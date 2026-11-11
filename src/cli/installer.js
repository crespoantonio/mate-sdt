'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { COLORS, color } = require('./ui');
const { validateTarget } = require('./validator');

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

const STANDARD_DIRECTORIES = [
  'specs',
  'specs/waivers',
  'tests/e2e',
  'tests/api',
  'tests/threats',
  'tests/charters',
  'tests/nfr',
  'src/pages',
  'src/components',
  'src/fixtures',
  'src/models',
];

const SKILL_NAMES = [
  'mate-core',
  'mate-model',
  'mate-assert-playwright',
  'mate-threat',
  'mate-explore',
];

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
 * Installs M.A.T.E. skills and configurations for Google Antigravity IDE / agy CLI
 */
function installAntigravity(targetDir) {
  const skillsDestRoot = path.join(targetDir, '.agents', 'skills');
  fs.mkdirSync(skillsDestRoot, { recursive: true });

  for (const skillName of SKILL_NAMES) {
    const srcSkillDir = path.join(PACKAGE_ROOT, 'skills', skillName);
    const destSkillDir = path.join(skillsDestRoot, skillName);
    if (fs.existsSync(srcSkillDir)) {
      copyDirRecursive(srcSkillDir, destSkillDir);
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

  return [
    '.agents/skills/mate-core',
    '.agents/skills/mate-model',
    '.agents/skills/mate-assert-playwright',
    '.agents/skills/mate-threat',
    '.agents/skills/mate-explore',
    '.agent/skills.json',
  ];
}

/**
 * Installs M.A.T.E. slash commands and CLAUDE.md rules for Anthropic Claude Code
 */
function installClaudeCode(targetDir) {
  const commandsDir = path.join(targetDir, '.claude', 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });
  const installed = [];

  for (const skillName of SKILL_NAMES) {
    const skillMdPath = path.join(PACKAGE_ROOT, 'skills', skillName, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
      const content = fs.readFileSync(skillMdPath, 'utf8');
      const cmdFile = path.join(commandsDir, `${skillName}.md`);
      fs.writeFileSync(cmdFile, content, 'utf8');
      installed.push(`.claude/commands/${skillName}.md`);
    }
  }

  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  const mateSection = [
    '',
    '<!-- MATE-SDT-START -->',
    '## 🧉 M.A.T.E. Method — Spec-Driven Testing (SDT) Governance',
    '',
    'This repository is governed by the **M.A.T.E. Method** (`mate-sdt`):',
    '- **Living Architecture Map:** Always read and update `MATE-PROJECT-MAP.md` before scanning the entire repository.',
    '- **Pillar M (Model):** Specifications live in `specs/*.mate-spec.md`. Validate specs via `npx mate-sdt validate`. Every state machine must declare **Explicit Forbidden Transitions**.',
    '- **Pillar A (Assert):** Follow OOP & SOLID principles in Playwright (`src/pages/`, `src/components/`, `src/fixtures/`). Zero arbitrary sleeps (`waitForTimeout` is strictly forbidden).',
    '- **Pillar T (Threat & Trash):** Test concurrency, idempotency, and fuzzing. Enforce Mutation Score >= 85% with Stryker inside rootless Podman (`npx mate-sdt mutate`).',
    '- **Pillar E (Explore):** Reserve human exploratory charters (`tests/charters/`) and enforce formal release verdicts (`PASS`, `CONCERNS` with waiver, or `FAIL`).',
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
    'mate-model': 'specs/**/*.mate-spec.md,MATE-PROJECT-MAP.md',
    'mate-assert-playwright': 'tests/**/*.ts,src/pages/**/*.ts,src/components/**/*.ts,src/fixtures/**/*.ts',
    'mate-threat': 'tests/threats/**/*.ts,stryker.config.json',
    'mate-explore': 'tests/charters/**/*.md,specs/waivers/**/*.md',
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
 * Installs M.A.T.E. rules for Windsurf IDE
 */
function installWindsurf(targetDir) {
  const rulesDir = path.join(targetDir, '.windsurf', 'rules');
  fs.mkdirSync(rulesDir, { recursive: true });

  const combined = SKILL_NAMES.map((skillName) => {
    const p = path.join(PACKAGE_ROOT, 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(p)) return '';
    return fs.readFileSync(p, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '').trim();
  })
    .filter(Boolean)
    .join('\n\n---\n\n');

  const dest = path.join(rulesDir, 'mate-sdt.md');
  fs.writeFileSync(dest, combined + '\n', 'utf8');
  return ['.windsurf/rules/mate-sdt.md'];
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

  const copilotInstructionsPath = path.join(githubDir, 'copilot-instructions.md');
  const block = [
    '',
    '<!-- MATE-SDT-START -->',
    '## 🧉 M.A.T.E. Method — Spec-Driven Testing (SDT) Instructions',
    '',
    '1. Consult `MATE-PROJECT-MAP.md` first to understand modules, state machines, invariants, and fixtures.',
    '2. Every feature requires a validated specification in `specs/[module].mate-spec.md` (`npx mate-sdt validate`).',
    '3. Enforce OOP and SOLID principles in Playwright tests (`src/pages`, `src/components`, `src/fixtures`). Never use `waitForTimeout()`.',
    '4. Enforce Mutation Testing >= 85% via Stryker in rootless Podman (`npx mate-sdt mutate`).',
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

  // Optional starter files (Golden sample spec + SOLID Playwright templates)
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
      { src: 'base-page.template.ts', dest: path.join('src', 'pages', 'base.page.ts') },
      {
        src: 'component.template.ts',
        dest: path.join('src', 'components', 'notification-toast.component.ts'),
      },
      { src: 'fixtures.template.ts', dest: path.join('src', 'fixtures', 'mate.fixtures.ts') },
    ];

    for (const item of boilerplates) {
      const s = path.join(assertResDir, item.src);
      const d = path.join(resolved, item.dest);
      if (!fs.existsSync(d) && fs.existsSync(s)) {
        let text = fs.readFileSync(s, 'utf8');
        if (item.src === 'fixtures.template.ts') {
          text = text.replace('./base-page.template', '../pages/base.page');
        }
        writeFileIfMissing(d, text, false);
        created.push(item.dest.replace(/\\/g, '/'));
      }
    }
  }

  return created;
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

  const scaffolded = initMateProject(targetDir, { mode, includeStarterFiles });
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

  return {
    targetDir,
    mode,
    ides,
    scaffolded,
    ideFiles,
  };
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
    // If no *.mate-spec.md files exist yet, don't treat as syntax failure in status summary
    if (
      specValidation.results.length === 1 &&
      specValidation.results[0].errors[0]?.startsWith('No *.mate-spec.md files found')
    ) {
      specValidation = { allValid: true, results: [] };
    }
  }

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

  return {
    targetDir: resolved,
    hasProjectMap,
    hasStrykerConfig,
    hasSpecsDir,
    hasAntigravitySkills,
    hasClaudeCommands,
    hasCursorRules,
    specValidation,
    podmanAvailable,
    podmanVersion,
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

module.exports = {
  STANDARD_DIRECTORIES,
  SKILL_NAMES,
  initMateProject,
  installMate,
  generateCharter,
  generateWaiver,
  checkStatus,
  runPodmanMutation,
};
