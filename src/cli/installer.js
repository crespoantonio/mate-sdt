'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { COLORS, color } = require('./ui');
const { validateTarget } = require('./validator');
const { auditTestSuite } = require('./auditor');
const { analyzeContextEngineering, runHarnessGate } = require('./harness');

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

const STANDARD_DIRECTORIES = [
  'docs',
  'docs/test-plans',
  'specs',
  'specs/waivers',
  'tests/cases',
  'tests/e2e',
  'tests/api',
  'tests/threats',
  'tests/charters',
  'tests/nfr',
  'tests/bugs',
  'src/pages',
  'src/components',
  'src/api',
  'src/mocks',
  'src/fixtures',
  'src/models',
];

const SKILL_NAMES = [
  'mate-core',
  'mate-help',
  'mate-strategy',
  'mate-story-testcases',
  'mate-model',
  'mate-pw-recon',
  'mate-assert-playwright',
  'mate-pw-codegen',
  'mate-pw-forensics',
  'mate-assert-api',
  'mate-threat',
  'mate-performance-k6',
  'mate-explore',
  'mate-triage',
  'mate-maintenance',
];

const WORKFLOW_NAMES = [
  'mate-flow-zero-to-one',
  'mate-flow-user-story',
  'mate-flow-greenfield',
  'mate-flow-brownfield',
  'mate-flow-api-contract',
  'mate-flow-performance',
  'mate-flow-triage',
];

const AI_SKILL_NAMES = [
  'mate-ai-dataset',
  'mate-ai-evals',
  'mate-ai-redteam',
  'mate-ai-observability',
];

const AI_WORKFLOW_NAMES = ['mate-flow-ai-agent'];

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function writeFileIfMissing(targetPath, content, overwrite = false) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  if (fs.existsSync(targetPath) && !overwrite) {
    return false;
  }
  fs.writeFileSync(targetPath, content, 'utf8');
  return true;
}

/**
 * Installs M.A.T.E. skills, workflows, and configurations for Google Antigravity IDE / agy CLI
 */
function installAntigravity(targetDir) {
  const skillsDestRoot = path.join(targetDir, '.agents', 'skills');
  fs.mkdirSync(skillsDestRoot, { recursive: true });
  const installed = [];

  for (const skillName of SKILL_NAMES) {
    const srcSkillDir = path.join(PACKAGE_ROOT, 'skills', skillName);
    const destSkillDir = path.join(skillsDestRoot, skillName);
    if (fs.existsSync(srcSkillDir)) {
      copyDirRecursive(srcSkillDir, destSkillDir);
      installed.push(`.agents/skills/${skillName}`);
    }
  }

  // Install E2E Workflows into .agent/workflows/mate/
  const workflowsDest = path.join(targetDir, '.agent', 'workflows', 'mate');
  fs.mkdirSync(workflowsDest, { recursive: true });
  for (const wfName of WORKFLOW_NAMES) {
    const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wfName}.md`);
    if (fs.existsSync(wfSrc)) {
      fs.copyFileSync(wfSrc, path.join(workflowsDest, `${wfName}.md`));
      installed.push(`.agent/workflows/mate/${wfName}.md`);
    }
  }

  // Ensure .agent/skills.json registers .agents/skills
  const agentConfigPath = path.join(targetDir, '.agent', 'skills.json');
  fs.mkdirSync(path.dirname(agentConfigPath), { recursive: true });

  let config = { entries: [] };
  if (fs.existsSync(agentConfigPath)) {
    try {
      config = JSON.parse(fs.readFileSync(agentConfigPath, 'utf8'));
      if (!Array.isArray(config.entries)) config.entries = [];
    } catch {
      config = { entries: [] };
    }
  }

  const hasEntry = config.entries.some((e) => e && e.path === '.agents/skills');
  if (!hasEntry) {
    config.entries.push({ path: '.agents/skills' });
    fs.writeFileSync(agentConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }
  installed.push('.agent/skills.json');

  return installed;
}

/**
 * Installs M.A.T.E. slash commands (skills + workflows) and CLAUDE.md rules for Anthropic Claude Code
 */
function installClaudeCode(targetDir) {
  const commandsDir = path.join(targetDir, '.claude', 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });
  const installed = [];

  for (const skillName of SKILL_NAMES) {
    const skillDir = path.join(PACKAGE_ROOT, 'skills', skillName);
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
      const content = fs.readFileSync(skillMdPath, 'utf8');
      const cmdFile = path.join(commandsDir, `${skillName}.md`);
      fs.writeFileSync(cmdFile, content, 'utf8');
      installed.push(`.claude/commands/${skillName}.md`);
    }
    const refsDir = path.join(skillDir, 'references');
    if (fs.existsSync(refsDir)) {
      const claudeSkillDest = path.join(targetDir, '.claude', 'skills', skillName);
      copyDirRecursive(skillDir, claudeSkillDest);
      installed.push(`.claude/skills/${skillName}`);
    }
  }

  for (const wfName of WORKFLOW_NAMES) {
    const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wfName}.md`);
    if (fs.existsSync(wfSrc)) {
      const content = fs.readFileSync(wfSrc, 'utf8');
      const cmdFile = path.join(commandsDir, `${wfName}.md`);
      fs.writeFileSync(cmdFile, content, 'utf8');
      installed.push(`.claude/commands/${wfName}.md`);
    }
  }

  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  const mateSection = [
    '',
    '<!-- MATE-SDT-START -->',
    '## 🧉 M.A.T.E. Method — Context Engineering & Harness Engineering Governance',
    '',
    'This repository is governed by the **M.A.T.E. Method** (`mate-sdt` — 15 Synergistic Skills & 7 E2E Workflows) built on **Context Engineering** (*Write, Select, Compress, Isolate*) and **Harness Engineering** ($\\text{Agent} = \\text{Model} + \\text{Harness}$):',
    '- **Context Engineering (Tier-1 Living Map):** Always read and update `MATE-PROJECT-MAP.md` (`< 3,000 tokens`) before scanning the repository. Run `npx mate-sdt context [module]` to check token budgets, detect unindexed artifacts, and assemble Just-In-Time (JIT) Context Packs.',
    '- **Epistemic Isolation (Anti-Poisoning):** Never guess SLAs, auth mechanisms, or undocumented contracts. Isolate uncertainty with `[OBSERVED]`, `[INFERRED]`, and `[TBD]` tags.',
    '- **User Story Ingestion & Pragmatic QA Companion (`mate-story-testcases`):** Ingest stories from Atlassian/Jira MCP, Notion MCP, Excel/CSV, or text. Generate `tests/cases/TC-*.md` & `.csv` (`npx mate-sdt cases <mod>`) covering 4 quadrants (`HAPPY_PATH`, `BORDER_CASE`, `NEGATIVE_PATH`, `STATE_TRANSITION`) and classifying each into `AUTOMATE_UI`, `AUTOMATE_API`, `MANUAL_TEST` (with rationale), or `EXPLORATORY_CHARTER`.',
    '- **Anti-Greenwashing Guardrail:** Never only write tests that pass! If an automatable test fails against the app due to a real bug, KEEP the test with its real assertion, mark it with `test.fail(true, "BUG-XXX: ...")`, generate `npx mate-sdt bug <mod>`, and alert the tester.',
    '- **Pillar M (`mate-model` + `mate-pw-recon`):** Specifications live in `specs/*.mate-spec.md` (`npx mate-sdt validate`). Verify live behavior and compress DOM context using `@playwright/cli` YAML ARIA snapshots (`playwright-cli open/snapshot`).',
    '- **Pillar A (`mate-assert-playwright` + `mate-pw-codegen` + `mate-assert-api`):** Follow OOP & SOLID principles (`src/pages/`, `src/components/`, `src/api/`, `src/mocks/`, `src/fixtures/`). Zero arbitrary sleeps (`waitForTimeout` is strictly forbidden).',
    '- **Harness Verification Loop (`npx mate-sdt gate`):** Before finishing any coding or spec turn, run `npx mate-sdt gate` to execute all deterministic guardrails (Context Budget, Spec Linter, Anti-Greenwashing Traceability, and SOLID Audit) and self-correct any failures.',
    '<!-- MATE-SDT-END -->',
    '',
  ].join('\n');

  if (fs.existsSync(claudeMdPath)) {
    const existing = fs.readFileSync(claudeMdPath, 'utf8');
    if (!existing.includes('<!-- MATE-SDT-START -->')) {
      fs.writeFileSync(claudeMdPath, `${existing.trimEnd()}\n${mateSection}`, 'utf8');
    }
  } else {
    fs.writeFileSync(claudeMdPath, `# Project Instructions\n${mateSection}`, 'utf8');
  }
  installed.push('CLAUDE.md');

  return installed;
}

/**
 * Installs M.A.T.E. .mdc rules for Cursor IDE
 */
function installCursor(targetDir) {
  const rulesDir = path.join(targetDir, '.cursor', 'rules');
  fs.mkdirSync(rulesDir, { recursive: true });
  const installed = [];

  const globsMap = {
    'mate-core': '**/*',
    'mate-help': '**/*',
    'mate-strategy': 'docs/**/*.md,MATE-PROJECT-MAP.md',
    'mate-story-testcases': 'tests/cases/**/*,specs/**/*.mate-spec.md',
    'mate-model': 'specs/**/*.mate-spec.md,MATE-PROJECT-MAP.md',
    'mate-pw-recon': 'specs/**/*.mate-spec.md,tests/cases/**/*,src/pages/**/*.ts,src/components/**/*.ts',
    'mate-assert-playwright': 'tests/e2e/**/*.ts,src/pages/**/*.ts,src/components/**/*.ts,src/fixtures/**/*.ts',
    'mate-pw-codegen': 'tests/e2e/**/*.ts,src/pages/**/*.ts,src/components/**/*.ts,src/mocks/**/*.ts,src/fixtures/**/*.ts',
    'mate-pw-forensics': 'tests/threats/**/*.ts,tests/charters/**/*.md,tests/bugs/**/*.md',
    'mate-assert-api': 'tests/api/**/*.ts,src/api/**/*.ts,src/models/**/*.ts',
    'mate-threat': 'tests/threats/**/*.ts,stryker.config.json',
    'mate-performance-k6': 'tests/nfr/**/*.js,tests/nfr/**/*.ts',
    'mate-explore': 'tests/charters/**/*.md,specs/waivers/**/*.md',
    'mate-triage': 'tests/bugs/**/*.md,MATE-PROJECT-MAP.md',
    'mate-maintenance': 'tests/**/*.ts,src/**/*.ts',
  };

  for (const skillName of SKILL_NAMES) {
    const skillMdPath = path.join(PACKAGE_ROOT, 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;
    const raw = fs.readFileSync(skillMdPath, 'utf8');
    const body = raw.replace(/^---[\s\S]*?---\r?\n/, '');
    const mdcContent = [
      '---',
      `description: M.A.T.E. Method (${skillName}) Spec-Driven Testing rule`,
      `globs: ${globsMap[skillName] || '**/*'}`,
      `alwaysApply: ${skillName === 'mate-core' ? 'true' : 'false'}`,
      '---',
      '',
      body.trim(),
      '',
    ].join('\n');

    const destFile = path.join(rulesDir, `${skillName}.mdc`);
    fs.writeFileSync(destFile, mdcContent, 'utf8');
    installed.push(`.cursor/rules/${skillName}.mdc`);
  }

  return installed;
}

/**
 * Installs M.A.T.E. rules and workflows for Windsurf IDE
 */
function installWindsurf(targetDir) {
  const rulesDir = path.join(targetDir, '.windsurf', 'rules');
  const workflowsDir = path.join(targetDir, '.windsurf', 'workflows');
  fs.mkdirSync(rulesDir, { recursive: true });
  fs.mkdirSync(workflowsDir, { recursive: true });
  const installed = [];

  const combined = SKILL_NAMES.map((skillName) => {
    const p = path.join(PACKAGE_ROOT, 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(p)) return '';
    return fs.readFileSync(p, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '').trim();
  })
    .filter(Boolean)
    .join('\n\n---\n\n');

  const dest = path.join(rulesDir, 'mate-sdt.md');
  fs.writeFileSync(dest, combined + '\n', 'utf8');
  installed.push('.windsurf/rules/mate-sdt.md');

  for (const wfName of WORKFLOW_NAMES) {
    const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wfName}.md`);
    if (fs.existsSync(wfSrc)) {
      fs.copyFileSync(wfSrc, path.join(workflowsDir, `${wfName}.md`));
      installed.push(`.windsurf/workflows/${wfName}.md`);
    }
  }

  return installed;
}

/**
 * Installs M.A.T.E. instructions and prompt files for GitHub Copilot
 */
function installCopilot(targetDir) {
  const githubDir = path.join(targetDir, '.github');
  const promptsDir = path.join(githubDir, 'prompts');
  fs.mkdirSync(promptsDir, { recursive: true });
  const installed = [];

  for (const skillName of SKILL_NAMES) {
    const p = path.join(PACKAGE_ROOT, 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(p)) continue;
    const body = fs.readFileSync(p, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '').trim();
    const promptFile = path.join(promptsDir, `${skillName}.prompt.md`);
    fs.writeFileSync(promptFile, body + '\n', 'utf8');
    installed.push(`.github/prompts/${skillName}.prompt.md`);
  }

  for (const wfName of WORKFLOW_NAMES) {
    const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wfName}.md`);
    if (!fs.existsSync(wfSrc)) continue;
    const body = fs.readFileSync(wfSrc, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '').trim();
    const promptFile = path.join(promptsDir, `${wfName}.prompt.md`);
    fs.writeFileSync(promptFile, body + '\n', 'utf8');
    installed.push(`.github/prompts/${wfName}.prompt.md`);
  }

  const copilotInstructionsPath = path.join(githubDir, 'copilot-instructions.md');
  const block = [
    '',
    '<!-- MATE-SDT-START -->',
    '## 🧉 M.A.T.E. Method — Spec-Driven Testing (SDT) Instructions',
    '',
    '1. Consult `MATE-PROJECT-MAP.md` first to understand modules, state machines, invariants, conventions, and fixtures.',
    '2. Every feature requires a validated specification in `specs/[module].mate-spec.md` (`npx mate-sdt validate`).',
    '3. Enforce OOP and SOLID principles in Playwright UI/API tests (`src/pages`, `src/components`, `src/api`, `src/fixtures`). Never use `waitForTimeout()`. Audit with `npx mate-sdt audit`.',
    '4. Enforce Mutation Testing >= 85% via Stryker in rootless Podman (`npx mate-sdt mutate`) and k6 SLAs (`npx mate-sdt k6`).',
    '<!-- MATE-SDT-END -->',
    '',
  ].join('\n');

  if (fs.existsSync(copilotInstructionsPath)) {
    const existing = fs.readFileSync(copilotInstructionsPath, 'utf8');
    if (!existing.includes('<!-- MATE-SDT-START -->')) {
      fs.writeFileSync(copilotInstructionsPath, `${existing.trimEnd()}\n${block}`, 'utf8');
    }
  } else {
    fs.writeFileSync(
      copilotInstructionsPath,
      `# GitHub Copilot Repository Instructions\n${block}`,
      'utf8'
    );
  }
  installed.push('.github/copilot-instructions.md');

  return installed;
}

/**
 * Scaffolds the standard M.A.T.E. directory structure and core templates.
 */
function initMateProject(targetDir, options = {}) {
  const resolved = path.resolve(targetDir || '.');
  const { includeStarterFiles = true, mode = 'greenfield' } = options;
  const created = [];

  if (mode !== 'skills-only') {
    for (const relDir of STANDARD_DIRECTORIES) {
      const fullDir = path.join(resolved, relDir);
      fs.mkdirSync(fullDir, { recursive: true });
      const gitkeep = path.join(fullDir, '.gitkeep');
      if (fs.readdirSync(fullDir).length === 0) {
        fs.writeFileSync(gitkeep, '', 'utf8');
      }
      created.push(`${relDir}/`);
    }
  } else {
    fs.mkdirSync(path.join(resolved, 'specs'), { recursive: true });
    created.push('specs/');
  }

  // Copy MATE-PROJECT-MAP.md
  const mapTemplate = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-core',
    'resources',
    'MATE-PROJECT-MAP.template.md'
  );
  const mapDest = path.join(resolved, 'MATE-PROJECT-MAP.md');
  if (!fs.existsSync(mapDest) && fs.existsSync(mapTemplate)) {
    fs.copyFileSync(mapTemplate, mapDest);
    created.push('MATE-PROJECT-MAP.md');
  }

  // Copy specs/TEMPLATE_MATE_SPEC.md
  const specTemplate = path.join(PACKAGE_ROOT, 'templates', 'TEMPLATE_MATE_SPEC.md');
  const specTemplateDest = path.join(resolved, 'specs', 'TEMPLATE_MATE_SPEC.md');
  if (!fs.existsSync(specTemplateDest) && fs.existsSync(specTemplate)) {
    fs.copyFileSync(specTemplate, specTemplateDest);
    created.push('specs/TEMPLATE_MATE_SPEC.md');
  }

  // Copy docs/TEST-STRATEGY.md
  if (mode !== 'skills-only') {
    const strategyTemplate = path.join(
      PACKAGE_ROOT,
      'skills',
      'mate-strategy',
      'resources',
      'test-strategy.template.md'
    );
    const strategyDest = path.join(resolved, 'docs', 'TEST-STRATEGY.md');
    if (!fs.existsSync(strategyDest) && fs.existsSync(strategyTemplate)) {
      fs.mkdirSync(path.dirname(strategyDest), { recursive: true });
      const today = new Date().toISOString().slice(0, 10);
      const text = fs
        .readFileSync(strategyTemplate, 'utf8')
        .replace(/YYYY-MM-DD/g, today)
        .replace(/\[Project \/ Product Name\]/g, path.basename(resolved) || 'Project')
        .replace(/\[Project Name\]/g, path.basename(resolved) || 'Project');
      fs.writeFileSync(strategyDest, text, 'utf8');
      created.push('docs/TEST-STRATEGY.md');
    }
  }

  // Copy stryker.config.json
  if (mode !== 'skills-only') {
    const strykerSrc = path.join(
      PACKAGE_ROOT,
      'skills',
      'mate-threat',
      'resources',
      'stryker.config.json'
    );
    const strykerDest = path.join(resolved, 'stryker.config.json');
    if (!fs.existsSync(strykerDest) && fs.existsSync(strykerSrc)) {
      fs.copyFileSync(strykerSrc, strykerDest);
      created.push('stryker.config.json');
    }
  }

  // Optional starter files (Golden sample spec + SOLID Playwright UI/API + k6 templates)
  if (includeStarterFiles && mode !== 'skills-only') {
    const sampleSpecSrc = path.join(
      PACKAGE_ROOT,
      'skills',
      'mate-model',
      'examples',
      'sample-order-lifecycle.mate-spec.md'
    );
    const sampleSpecDest = path.join(resolved, 'specs', 'sample-order-lifecycle.mate-spec.md');
    if (!fs.existsSync(sampleSpecDest) && fs.existsSync(sampleSpecSrc)) {
      fs.copyFileSync(sampleSpecSrc, sampleSpecDest);
      created.push('specs/sample-order-lifecycle.mate-spec.md');
    }

    const assertResDir = path.join(PACKAGE_ROOT, 'skills', 'mate-assert-playwright', 'resources');
    const boilerplates = [
      {
        src: path.join(assertResDir, 'base-page.template.ts'),
        dest: path.join('src', 'pages', 'base.page.ts'),
      },
      {
        src: path.join(assertResDir, 'component.template.ts'),
        dest: path.join('src', 'components', 'notification-toast.component.ts'),
      },
      {
        src: path.join(assertResDir, 'fixtures.template.ts'),
        dest: path.join('src', 'fixtures', 'mate.fixtures.ts'),
      },
      {
        src: path.join(
          PACKAGE_ROOT,
          'skills',
          'mate-assert-api',
          'resources',
          'base-api-client.template.ts'
        ),
        dest: path.join('src', 'api', 'base-api.client.ts'),
      },
      {
        src: path.join(
          PACKAGE_ROOT,
          'skills',
          'mate-performance-k6',
          'resources',
          'k6-load.template.js'
        ),
        dest: path.join('tests', 'nfr', 'order-load.k6.js'),
      },
    ];

    for (const item of boilerplates) {
      const d = path.join(resolved, item.dest);
      if (!fs.existsSync(d) && fs.existsSync(item.src)) {
        let text = fs.readFileSync(item.src, 'utf8');
        if (item.src.endsWith('fixtures.template.ts')) {
          text = text.replace('./base-page.template', '../pages/base.page');
        }
        writeFileIfMissing(d, text, false);
        created.push(item.dest.replace(/\\/g, '/'));
      }
    }

    // Standalone & Ready-to-Run QA Harness files (playwright.config.ts, tsconfig.json, .env.example, CI workflow)
    const standaloneTemplatesDir = path.join(PACKAGE_ROOT, 'templates', 'standalone');
    const harnessFiles = [
      {
        src: path.join(standaloneTemplatesDir, 'playwright.config.template.ts'),
        dest: 'playwright.config.ts',
      },
      {
        src: path.join(standaloneTemplatesDir, 'tsconfig.template.json'),
        dest: 'tsconfig.json',
      },
      {
        src: path.join(standaloneTemplatesDir, 'env.example.template'),
        dest: '.env.example',
      },
      {
        src: path.join(standaloneTemplatesDir, 'github-workflow.template.yml'),
        dest: path.join('.github', 'workflows', 'mate-qa.yml'),
      },
    ];

    for (const hf of harnessFiles) {
      const destFull = path.join(resolved, hf.dest);
      if (!fs.existsSync(destFull) && fs.existsSync(hf.src)) {
        writeFileIfMissing(destFull, fs.readFileSync(hf.src, 'utf8'), false);
        created.push(hf.dest.replace(/\\/g, '/'));
      }
    }

    // Ensure package.json has standard M.A.T.E. & Playwright scripts in standalone/target QA folders
    const pkgPath = path.join(resolved, 'package.json');
    const qaScripts = {
      'test:smoke': 'playwright test --project=smoke',
      'test:e2e': 'playwright test --project=e2e',
      'test:api': 'playwright test --project=api',
      'test:threats': 'playwright test --project=threats',
      'mate:gate': 'mate-sdt gate',
      'mate:context': 'mate-sdt context',
      'mate:validate': 'mate-sdt validate',
      'mate:audit': 'mate-sdt audit',
      'mate:status': 'mate-sdt status',
    };

    if (!fs.existsSync(pkgPath)) {
      const newPkg = {
        name: `${(path.basename(resolved) || 'qa-suite').toLowerCase().replace(/[^a-z0-9-_]/g, '-')}`,
        version: '1.0.0',
        private: true,
        description: 'M.A.T.E. Method Spec-Driven QA & Automation Suite',
        scripts: qaScripts,
      };
      fs.writeFileSync(pkgPath, `${JSON.stringify(newPkg, null, 2)}\n`, 'utf8');
      created.push('package.json (with M.A.T.E. & Playwright scripts)');
    } else {
      try {
        const existingPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (existingPkg.name !== 'mate-sdt') {
          existingPkg.scripts = existingPkg.scripts || {};
          let addedScript = false;
          for (const [k, v] of Object.entries(qaScripts)) {
            if (!existingPkg.scripts[k]) {
              existingPkg.scripts[k] = v;
              addedScript = true;
            }
          }
          if (addedScript) {
            fs.writeFileSync(pkgPath, `${JSON.stringify(existingPkg, null, 2)}\n`, 'utf8');
            created.push('package.json (updated with M.A.T.E. & Playwright scripts)');
          }
        }
      } catch {
        // Ignore malformed package.json
      }
    }
  }

  return created;
}

/**
 * Ensures .gitignore has standard M.A.T.E. and @playwright/cli ignore entries
 */
function ensurePlaywrightGitignore(targetDir) {
  const gitignorePath = path.join(targetDir, '.gitignore');
  const requiredEntries = [
    '.mate/',
    '.playwright-cli/',
    'playwright/.auth/',
    '*.auth-state.json',
  ];

  let existing = '';
  if (fs.existsSync(gitignorePath)) {
    existing = fs.readFileSync(gitignorePath, 'utf8');
  }

  const missing = requiredEntries.filter((entry) => !existing.includes(entry));
  if (missing.length > 0) {
    const block = [
      '',
      '# M.A.T.E. & @playwright/cli artifacts and auth states',
      ...missing,
      '',
    ].join('\n');
    fs.writeFileSync(gitignorePath, `${existing.trimEnd()}\n${block}`, 'utf8');
    return true;
  }
  return false;
}

/**
 * Installs @playwright/cli and @playwright/test into the target project
 */
function installPlaywrightCliPackages(targetDir = '.') {
  const resolved = path.resolve(targetDir);
  ensurePlaywrightGitignore(resolved);

  const pkgJsonPath = path.join(resolved, 'package.json');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  if (!fs.existsSync(pkgJsonPath)) {
    console.log(color('   📄 No package.json found. Running `npm init -y`...', COLORS.cyan));
    spawnSync(npmCmd, ['init', '-y'], {
      cwd: resolved,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
  }

  console.log(
    color(
      '\n🎭 Installing @playwright/cli@latest and @playwright/test@latest (M.A.T.E. Browser Engine)...',
      COLORS.bold,
      COLORS.brightGreen
    )
  );

  const installRes = spawnSync(
    npmCmd,
    ['install', '-D', '@playwright/cli@latest', '@playwright/test@latest'],
    {
      cwd: resolved,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  return installRes.status === 0;
}

/**
 * Full M.A.T.E. installation orchestrator
 */
function installMate(options = {}) {
  const targetDir = path.resolve(options.targetDir || '.');
  const mode = options.mode || 'greenfield';
  const ides = options.ides || ['antigravity', 'claude', 'cursor', 'windsurf', 'copilot'];
  const includeStarterFiles =
    options.includeStarterFiles !== undefined ? options.includeStarterFiles : true;
  const installPlaywrightCli = Boolean(options.installPlaywrightCli);

  const scaffolded = initMateProject(targetDir, { mode, includeStarterFiles });
  if (ensurePlaywrightGitignore(targetDir)) {
    scaffolded.push('.gitignore (added .playwright-cli/ & *.auth-state.json)');
  }
  const ideFiles = [];

  if (ides.includes('antigravity') || ides.includes('all')) {
    ideFiles.push(...installAntigravity(targetDir));
  }
  if (ides.includes('claude') || ides.includes('all')) {
    ideFiles.push(...installClaudeCode(targetDir));
  }
  if (ides.includes('cursor') || ides.includes('all')) {
    ideFiles.push(...installCursor(targetDir));
  }
  if (ides.includes('windsurf') || ides.includes('all')) {
    ideFiles.push(...installWindsurf(targetDir));
  }
  if (ides.includes('copilot') || ides.includes('all')) {
    ideFiles.push(...installCopilot(targetDir));
  }

  let playwrightCliInstalled = false;
  if (installPlaywrightCli) {
    playwrightCliInstalled = installPlaywrightCliPackages(targetDir);
  }

  let aiPackFiles = [];
  if (options.installAiEvals) {
    const aiRes = setupAiQualityPack(targetDir, { ides });
    aiPackFiles = aiRes.created;
  }

  return {
    targetDir,
    mode,
    ides,
    scaffolded,
    ideFiles,
    playwrightCliInstalled,
    aiPackInstalled: Boolean(options.installAiEvals),
    aiPackFiles,
  };
}

/**
 * Generates an AI Dataset Discovery Sheet (5-Dimension Socratic Interview + 5 Seeds)
 * and a Promptfoo/DeepEval-compatible Golden Dataset JSON file.
 */
function generateAiDataset(moduleName = 'agent', targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (moduleName || 'agent')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);

  const datasetsDir = path.join(resolved, 'tests', 'ai-evals', 'datasets');
  fs.mkdirSync(datasetsDir, { recursive: true });

  const discoveryDest = path.join(datasetsDir, `DS-${safeName}-discovery.md`);
  const jsonDest = path.join(datasetsDir, `DS-${safeName}.json`);

  const discoveryTemplate = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-ai-dataset',
    'resources',
    'dataset-discovery.template.md'
  );
  const jsonTemplate = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-ai-dataset',
    'resources',
    'golden-dataset.template.json'
  );

  const discoveryContent = fs
    .readFileSync(discoveryTemplate, 'utf8')
    .replace(/\{\{MODULE\}\}/g, safeName)
    .replace(/\{\{DATE\}\}/g, today);

  const jsonContent = fs
    .readFileSync(jsonTemplate, 'utf8')
    .replace(/\{\{MODULE\}\}/g, safeName)
    .replace(/\{\{DATE\}\}/g, today);

  fs.writeFileSync(discoveryDest, discoveryContent, 'utf8');
  fs.writeFileSync(jsonDest, jsonContent, 'utf8');

  return { discoveryDest, jsonDest };
}

/**
 * Installs the on-demand M.A.T.E. AI Quality Pack:
 *   - 4 Synergistic AI Skills (mate-ai-dataset, mate-ai-evals, mate-ai-redteam, mate-ai-observability)
 *   - 1 E2E Workflow (/mate-flow-ai-agent)
 *   - Promptfoo, DeepEval, and OpenTelemetry/OpenInference Trace Auditor starter files
 *   - package.json evaluation scripts (eval:promptfoo, eval:redteam, eval:deepeval, eval:traces)
 */
function setupAiQualityPack(targetDir = '.', options = {}) {
  const resolved = path.resolve(targetDir);
  const ides = options.ides || ['antigravity', 'claude', 'cursor', 'windsurf', 'copilot'];
  const created = [];

  // 1. Create AI Evaluation Directory Structure
  const aiDirs = [
    'tests/ai-evals/datasets',
    'tests/ai-evals/promptfoo',
    'tests/ai-evals/deepeval',
    'tests/ai-evals/traces',
  ];
  for (const rel of aiDirs) {
    fs.mkdirSync(path.join(resolved, rel), { recursive: true });
    created.push(`${rel}/`);
  }

  // 2. Install the 4 AI Skills & 1 AI Workflow across selected IDEs
  if (ides.includes('antigravity') || ides.includes('all')) {
    const skillsDestRoot = path.join(resolved, '.agents', 'skills');
    fs.mkdirSync(skillsDestRoot, { recursive: true });
    for (const sName of AI_SKILL_NAMES) {
      const srcDir = path.join(PACKAGE_ROOT, 'skills', sName);
      if (fs.existsSync(srcDir)) {
        copyDirRecursive(srcDir, path.join(skillsDestRoot, sName));
        created.push(`.agents/skills/${sName}`);
      }
    }
    const wfDest = path.join(resolved, '.agent', 'workflows', 'mate');
    fs.mkdirSync(wfDest, { recursive: true });
    for (const wf of AI_WORKFLOW_NAMES) {
      const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wf}.md`);
      if (fs.existsSync(wfSrc)) {
        fs.copyFileSync(wfSrc, path.join(wfDest, `${wf}.md`));
        created.push(`.agent/workflows/mate/${wf}.md`);
      }
    }
  }

  if (ides.includes('claude') || ides.includes('all')) {
    const commandsDir = path.join(resolved, '.claude', 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    for (const sName of AI_SKILL_NAMES) {
      const skillDir = path.join(PACKAGE_ROOT, 'skills', sName);
      const skillMd = path.join(skillDir, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        fs.copyFileSync(skillMd, path.join(commandsDir, `${sName}.md`));
        created.push(`.claude/commands/${sName}.md`);
      }
      copyDirRecursive(skillDir, path.join(resolved, '.claude', 'skills', sName));
    }
    for (const wf of AI_WORKFLOW_NAMES) {
      const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wf}.md`);
      if (fs.existsSync(wfSrc)) {
        fs.copyFileSync(wfSrc, path.join(commandsDir, `${wf}.md`));
        created.push(`.claude/commands/${wf}.md`);
      }
    }
  }

  if (ides.includes('cursor') || ides.includes('all')) {
    const rulesDir = path.join(resolved, '.cursor', 'rules');
    fs.mkdirSync(rulesDir, { recursive: true });
    for (const sName of AI_SKILL_NAMES) {
      const skillMd = path.join(PACKAGE_ROOT, 'skills', sName, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        const body = fs.readFileSync(skillMd, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '');
        const mdc = [
          '---',
          `description: M.A.T.E. AI Quality Pack (${sName}) rule`,
          'globs: tests/ai-evals/**/*,specs/**/*.mate-spec.md',
          'alwaysApply: false',
          '---',
          '',
          body.trim(),
          '',
        ].join('\n');
        fs.writeFileSync(path.join(rulesDir, `${sName}.mdc`), mdc, 'utf8');
        created.push(`.cursor/rules/${sName}.mdc`);
      }
    }
  }

  // 3. Copy Starter Templates (Promptfoo, RedTeam, DeepEval, OTel Trace Auditor, Sample Dataset)
  const dsRes = generateAiDataset('agent', resolved);
  created.push(
    path.relative(resolved, dsRes.discoveryDest).replace(/\\/g, '/'),
    path.relative(resolved, dsRes.jsonDest).replace(/\\/g, '/')
  );

  const templateMappings = [
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-evals', 'resources', 'promptfooconfig.template.yaml'),
      dest: 'tests/ai-evals/promptfoo/promptfooconfig.yaml',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-redteam', 'resources', 'redteam.promptfoo.template.yaml'),
      dest: 'tests/ai-evals/promptfoo/redteam.promptfoo.yaml',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-evals', 'resources', 'test_agent_deepeval.template.py'),
      dest: 'tests/ai-evals/deepeval/test_agent_deepeval.py',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-observability', 'resources', 'otel_trace_auditor.template.ts'),
      dest: 'tests/ai-evals/traces/otel_trace_auditor.js',
    },
  ];

  for (const tm of templateMappings) {
    const destFull = path.join(resolved, tm.dest);
    if (fs.existsSync(tm.src) && writeFileIfMissing(destFull, fs.readFileSync(tm.src, 'utf8'), false)) {
      created.push(tm.dest);
    }
  }

  // Create sample OpenTelemetry / OpenInference trace JSON for immediate trace auditing
  const sampleTraceDest = path.join(resolved, 'tests', 'ai-evals', 'traces', 'sample-trace.json');
  const sampleTracePayload = {
    trace_id: 'otel-trace-ord-1042',
    duration_ms: 1420,
    sla: { max_steps: 5, max_tokens: 3500, max_latency_ms: 8000, forbidden_tools: ['issue_refund', 'delete_user'] },
    spans: [
      {
        span_id: 'span-01',
        name: 'vector_db_search',
        kind: 'RETRIEVAL',
        attributes: {
          'retrieval.documents': [{ id: 'doc-shipping-01', score: 0.92, text: 'Order ORD-1042 is IN_TRANSIT via FedEx.' }],
        },
      },
      {
        span_id: 'span-02',
        name: 'get_order_status',
        kind: 'TOOL',
        attributes: {
          'tool.name': 'get_order_status',
          'tool.parameters': { order_id: 'ORD-1042' },
        },
      },
      {
        span_id: 'span-03',
        name: 'gpt-4o-mini-synthesis',
        kind: 'LLM',
        attributes: {
          'gen_ai.usage.input_tokens': 310,
          'gen_ai.usage.output_tokens': 95,
        },
      },
    ],
  };
  if (writeFileIfMissing(sampleTraceDest, `${JSON.stringify(sampleTracePayload, null, 2)}\n`, false)) {
    created.push('tests/ai-evals/traces/sample-trace.json');
  }

  // 4. Add AI Evaluation scripts to package.json
  const pkgPath = path.join(resolved, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name !== 'mate-sdt') {
        pkg.scripts = pkg.scripts || {};
        const aiScripts = {
          'eval:promptfoo': 'npx promptfoo@latest eval -c tests/ai-evals/promptfoo/promptfooconfig.yaml',
          'eval:redteam': 'npx promptfoo@latest redteam run -c tests/ai-evals/promptfoo/redteam.promptfoo.yaml',
          'eval:deepeval': 'deepeval test run tests/ai-evals/deepeval/test_agent_deepeval.py',
          'eval:traces': 'node tests/ai-evals/traces/otel_trace_auditor.js',
          'mate:dataset': 'mate-sdt dataset',
        };
        let modified = false;
        for (const [k, v] of Object.entries(aiScripts)) {
          if (!pkg.scripts[k]) {
            pkg.scripts[k] = v;
            modified = true;
          }
        }
        if (modified) {
          fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
          created.push('package.json (added AI Evals, RedTeam & OTel Trace scripts)');
        }
      }
    } catch {
      // Ignore malformed package.json
    }
  }

  return { targetDir: resolved, created };
}

/**
 * Generates Master Test Strategy (docs/TEST-STRATEGY.md) from template
 */
function generateTestStrategy(projectName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const destPath = path.join(resolved, 'docs', 'TEST-STRATEGY.md');
  const templatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-strategy',
    'resources',
    'test-strategy.template.md'
  );
  const today = new Date().toISOString().slice(0, 10);
  const title = projectName || path.basename(resolved) || 'Project';
  const content = fs
    .readFileSync(templatePath, 'utf8')
    .replace(/\[Project \/ Product Name\]/g, title)
    .replace(/\[Project Name\]/g, title)
    .replace(/YYYY-MM-DD/g, today);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

/**
 * Generates a Release / Sprint Test Plan (docs/test-plans/TP-<scope>.md) from template
 */
function generateTestPlan(scopeName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (scopeName || 'release')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = today.replace(/-/g, '');
  const destPath = path.join(resolved, 'docs', 'test-plans', `TP-${dateStr}-${safeName}.md`);

  const templatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-strategy',
    'resources',
    'test-plan.template.md'
  );
  const content = fs
    .readFileSync(templatePath, 'utf8')
    .replace(/\[Release \/ Sprint \/ Epic Name\]/g, scopeName || 'Release Cycle')
    .replace(/\[SCOPE\]/g, safeName.toUpperCase())
    .replace(/\[scope\]/g, safeName)
    .replace(/YYYY-MM-DD/g, today)
    .replace(/YYYYMMDD/g, dateStr);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

/**
 * Generates a 4-Quadrant Test Case Matrix (.md + .csv) from template
 */
function generateTestCases(moduleName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (moduleName || 'feature')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = today.replace(/-/g, '');

  const casesDir = path.join(resolved, 'tests', 'cases');
  fs.mkdirSync(casesDir, { recursive: true });

  const mdDest = path.join(casesDir, `TC-${safeName}.md`);
  const csvDest = path.join(casesDir, `TC-${safeName}.csv`);

  const mdTemplatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-story-testcases',
    'resources',
    'test-cases.template.md'
  );
  const csvTemplatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-story-testcases',
    'resources',
    'test-cases.template.csv'
  );

  let mdContent = fs.readFileSync(mdTemplatePath, 'utf8');
  mdContent = mdContent
    .replace(/\[Module Name\]/g, moduleName || 'Feature Module')
    .replace(/\[module\]/g, safeName)
    .replace(/YYYY-MM-DD/g, today)
    .replace(/YYYYMMDD/g, dateStr);

  const csvContent = fs.readFileSync(csvTemplatePath, 'utf8');

  fs.writeFileSync(mdDest, mdContent, 'utf8');
  fs.writeFileSync(csvDest, csvContent, 'utf8');

  return { mdDest, csvDest };
}

/**
 * Generates an Exploratory Testing Charter (SBTM) from template
 */
function generateCharter(moduleName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (moduleName || 'feature')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `CHR-${dateStr}-${safeName}.md`;
  const destPath = path.join(resolved, 'tests', 'charters', fileName);

  const templatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-explore',
    'resources',
    'charter.template.md'
  );
  let content = fs.readFileSync(templatePath, 'utf8');
  content = content
    .replace('CHR-[YYYYMMDD]-[MODULE]-[##]', `CHR-${dateStr}-${safeName.toUpperCase()}-01`)
    .replace('[e.g., Laundry Checkout & Scheduling]', moduleName || 'Feature Module')
    .replace('YYYY-MM-DD', new Date().toISOString().slice(0, 10));

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

/**
 * Generates a Formal Release Waiver from template
 */
function generateWaiver(moduleName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (moduleName || 'feature')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const year = today.slice(0, 4);
  const fileName = `WVR-${year}-${safeName}.md`;
  const destPath = path.join(resolved, 'specs', 'waivers', fileName);

  const templatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-explore',
    'resources',
    'release-waiver.template.md'
  );
  let content = fs.readFileSync(templatePath, 'utf8');
  content = content
    .replace('WVR-[YEAR]-[SPRINT]-[##]', `WVR-${year}-${safeName.toUpperCase()}-01`)
    .replace('[Module Name]', moduleName || 'Feature Module')
    .replace(/YYYY-MM-DD/g, today);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

/**
 * Generates a Structured Bug Report linked to M.A.T.E. Invariants
 */
function generateBugReport(moduleName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (moduleName || 'feature')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = today.replace(/-/g, '');
  const fileName = `BUG-${dateStr}-${safeName}.md`;
  const destPath = path.join(resolved, 'tests', 'bugs', fileName);

  const templatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-triage',
    'resources',
    'bug-report.template.md'
  );
  let content = fs.readFileSync(templatePath, 'utf8');
  content = content
    .replace('BUG-[YYYYMMDD]-[MODULE]-[##]', `BUG-${dateStr}-${safeName.toUpperCase()}-01`)
    .replace(/\[module\]/g, safeName)
    .replace(/\[Module\]/g, moduleName || 'Module')
    .replace(/YYYY-MM-DD/g, today);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

/**
 * Runs M.A.T.E. Doctor / Status check on the target directory
 */
function checkStatus(targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const hasProjectMap = fs.existsSync(path.join(resolved, 'MATE-PROJECT-MAP.md'));
  const hasStrykerConfig = fs.existsSync(path.join(resolved, 'stryker.config.json'));
  const hasSpecsDir = fs.existsSync(path.join(resolved, 'specs'));
  const hasAntigravitySkills = fs.existsSync(
    path.join(resolved, '.agents', 'skills', 'mate-core', 'SKILL.md')
  );
  const hasClaudeCommands = fs.existsSync(
    path.join(resolved, '.claude', 'commands', 'mate-core.md')
  );
  const hasCursorRules = fs.existsSync(
    path.join(resolved, '.cursor', 'rules', 'mate-core.mdc')
  );

  let specValidation = { allValid: true, results: [] };
  if (hasSpecsDir) {
    specValidation = validateTarget(path.join(resolved, 'specs'));
    if (
      specValidation.results.length === 1 &&
      specValidation.results[0].errors[0]?.startsWith('No *.mate-spec.md files found')
    ) {
      specValidation = { allValid: true, results: [] };
    }
  }

  const auditResult = auditTestSuite(resolved);

  let podmanAvailable = false;
  let podmanVersion = null;
  try {
    const res = spawnSync('podman', ['--version'], { encoding: 'utf8' });
    if (res.status === 0 && res.stdout) {
      podmanAvailable = true;
      podmanVersion = res.stdout.trim();
    }
  } catch {
    podmanAvailable = false;
  }

  let playwrightCliAvailable = false;
  let playwrightCliVersion = null;
  const localPwCliPkg = path.join(resolved, 'node_modules', '@playwright', 'cli', 'package.json');
  if (fs.existsSync(localPwCliPkg)) {
    try {
      const pwPkg = JSON.parse(fs.readFileSync(localPwCliPkg, 'utf8'));
      playwrightCliAvailable = true;
      playwrightCliVersion = `@playwright/cli v${pwPkg.version} (local)`;
    } catch {
      playwrightCliAvailable = true;
      playwrightCliVersion = '@playwright/cli (local)';
    }
  } else {
    try {
      const pwCmd = process.platform === 'win32' ? 'playwright-cli.cmd' : 'playwright-cli';
      const res = spawnSync(pwCmd, ['--version'], {
        encoding: 'utf8',
        shell: process.platform === 'win32',
      });
      if (res.status === 0 && res.stdout) {
        playwrightCliAvailable = true;
        playwrightCliVersion = res.stdout.trim();
      }
    } catch {
      playwrightCliAvailable = false;
    }
  }

  return {
    targetDir: resolved,
    hasProjectMap,
    hasStrykerConfig,
    hasSpecsDir,
    hasAntigravitySkills,
    hasClaudeCommands,
    hasCursorRules,
    specValidation,
    auditResult,
    podmanAvailable,
    podmanVersion,
    playwrightCliAvailable,
    playwrightCliVersion,
  };
}

/**
 * Runs Stryker Mutator inside an isolated rootless Podman container
 */
function runPodmanMutation(targetDir = '.', configFile = 'stryker.config.json') {
  const resolved = path.resolve(targetDir);
  console.log(
    color(
      '\n💣 [M.A.T.E. Pillar T] Launching Mutation Testing Suite via Rootless Podman...',
      COLORS.bold,
      COLORS.brightGreen
    )
  );
  console.log(`   📁 Target Project: ${resolved}`);
  console.log(`   ⚙️  Config File:    ${configFile}\n`);

  const check = spawnSync('podman', ['--version'], { encoding: 'utf8' });
  if (check.status !== 0) {
    console.error(
      color(
        "❌ Error: 'podman' is not installed or not in PATH. Rootless Podman is required by M.A.T.E. Pillar T.",
        COLORS.red,
        COLORS.bold
      )
    );
    return 1;
  }

  console.log(color(`   🐳 Container Engine: ${check.stdout.trim()}`, COLORS.cyan));

  const podmanArgs = [
    'run',
    '--rm',
    '-v',
    `${resolved}:/app:Z`,
    '-w',
    '/app',
    'node:20-alpine',
    'sh',
    '-c',
    `npm install --legacy-peer-deps && npx stryker run ${configFile}`,
  ];

  console.log(color(`   🚀 Executing: podman ${podmanArgs.join(' ')}\n`, COLORS.gray));
  const run = spawnSync('podman', podmanArgs, { stdio: 'inherit' });
  if (run.status === 0) {
    console.log(
      color(
        '\n✅ [Pillar T Passed] Mutation Score meets the >= 85% M.A.T.E. threshold!',
        COLORS.brightGreen,
        COLORS.bold
      )
    );
  } else {
    console.error(
      color(
        '\n❌ [Pillar T Failed] Mutation testing failed or score fell below the 85% M.A.T.E. threshold.',
        COLORS.red,
        COLORS.bold
      )
    );
  }
  return run.status ?? 1;
}

/**
 * Runs Grafana k6 performance script inside an isolated rootless Podman container
 */
function runPodmanK6(scriptPath = 'tests/nfr/order-load.k6.js', targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const relScript = path.isAbsolute(scriptPath)
    ? path.relative(resolved, scriptPath).replace(/\\/g, '/')
    : scriptPath.replace(/\\/g, '/');

  console.log(
    color(
      '\n⚡ [M.A.T.E. Performance Oracles] Launching Grafana k6 Suite via Rootless Podman...',
      COLORS.bold,
      COLORS.brightGreen
    )
  );
  console.log(`   📁 Target Project: ${resolved}`);
  console.log(`   📈 k6 Script:      ${relScript}\n`);

  const check = spawnSync('podman', ['--version'], { encoding: 'utf8' });
  if (check.status !== 0) {
    console.error(
      color(
        "❌ Error: 'podman' is not installed or not in PATH. Rootless Podman is required by M.A.T.E. k6 runner.",
        COLORS.red,
        COLORS.bold
      )
    );
    return 1;
  }

  console.log(color(`   🐳 Container Engine: ${check.stdout.trim()}`, COLORS.cyan));

  const podmanArgs = [
    'run',
    '--rm',
    '-i',
    '-v',
    `${resolved}:/app:Z`,
    '-w',
    '/app',
    'grafana/k6:latest',
    'run',
    relScript,
  ];

  console.log(color(`   🚀 Executing: podman ${podmanArgs.join(' ')}\n`, COLORS.gray));
  const run = spawnSync('podman', podmanArgs, { stdio: 'inherit' });
  if (run.status === 0) {
    console.log(
      color(
        '\n✅ [Performance Oracles Passed] All k6 SLA thresholds satisfied!',
        COLORS.brightGreen,
        COLORS.bold
      )
    );
  } else {
    console.error(
      color(
        '\n❌ [Performance Oracles Failed] k6 run failed or violated SLA thresholds.',
        COLORS.red,
        COLORS.bold
      )
    );
  }
  return run.status ?? 1;
}

module.exports = {
  STANDARD_DIRECTORIES,
  SKILL_NAMES,
  WORKFLOW_NAMES,
  AI_SKILL_NAMES,
  AI_WORKFLOW_NAMES,
  initMateProject,
  installMate,
  installPlaywrightCliPackages,
  setupAiQualityPack,
  generateAiDataset,
  generateTestStrategy,
  generateTestPlan,
  generateTestCases,
  generateCharter,
  generateWaiver,
  generateBugReport,
  checkStatus,
  analyzeContextEngineering,
  runHarnessGate,
  runPodmanMutation,
  runPodmanK6,
};
