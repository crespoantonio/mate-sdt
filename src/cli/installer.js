'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { COLORS, color } = require('./ui');
const { validateTarget } = require('./validator');
const { auditTestSuite } = require('./auditor');
const { analyzeContextEngineering, runHarnessGate } = require('./harness');
const { ensureMemoryScaffold } = require('./memory');
const { ensureExecPlansScaffold, runGarbageCollection } = require('./gc');

// Subsystem modules
const {
  SKILL_NAMES,
  WORKFLOW_NAMES,
  normalizeIdeName,
  writeFileIfMissing,
  installAntigravity,
  installClaudeCode,
  installCursor,
  installWindsurf,
  installUniversalAgents,
  installCodex,
  installCopilot,
} = require('./ide-scaffold');

const {
  generateTestStrategy,
  generateTestPlan,
  generateTestCases,
  generateCharter,
  generateWaiver,
  generateBugReport,
} = require('./generators');

const {
  runPodmanMutation,
  runPodmanK6,
} = require('./containers');

const {
  AI_SKILL_NAMES,
  AI_WORKFLOW_NAMES,
  generateAiDataset,
  setupAiQualityPack,
} = require('./ai-pack');

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

const STANDARD_DIRECTORIES = [
  'docs',
  'docs/test-plans',
  'docs/test-cases',
  'docs/bugs',
  'specs',
  'specs/waivers',
  'tests/e2e',
  'tests/api',
  'tests/threats',
  'tests/charters',
  'tests/nfr',
  'src/pages',
  'src/components',
  'src/api',
  'src/mocks',
  'src/fixtures',
  'src/models',
];

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

  // Ensure Memory Filing Cabinet, Session Workbench & Exec-Plans scaffold
  ensureMemoryScaffold(resolved);
  created.push('.mate/memory/procedural-playbooks.md');
  if (mode !== 'skills-only') {
    ensureExecPlansScaffold(resolved);
    created.push('.mate/exec-plans/active/', '.mate/exec-plans/completed/', '.mate/exec-plans/tech-debt-tracker.md');
    runGarbageCollection(resolved, { write: true });
    created.push('docs/QUALITY_SCORE.md');
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

    // Scaffolds starter 4-quadrant test case matrix matching sample-order-lifecycle
    const sampleCasesDest = path.join(resolved, 'docs', 'test-cases', 'TC-sample-order-lifecycle.md');
    if (!fs.existsSync(sampleCasesDest)) {
      const generated = generateTestCases('sample-order-lifecycle', resolved);
      created.push(
        path.relative(resolved, generated.mdDest).replace(/\\/g, '/'),
        path.relative(resolved, generated.csvDest).replace(/\\/g, '/')
      );
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

    // Ensure .gitignore has node_modules, .env, Playwright & M.A.T.E. entries
    if (ensureGitignore(resolved) && !created.includes('.gitignore')) {
      created.push('.gitignore');
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
    const qaDevDependencies = {
      '@types/node': '^22.10.0',
      '@playwright/test': '^1.50.0',
      '@playwright/cli': '^0.1.0',
      typescript: '^5.7.0',
    };

    if (!fs.existsSync(pkgPath)) {
      const newPkg = {
        name: `${(path.basename(resolved) || 'qa-suite').toLowerCase().replace(/[^a-z0-9-_]/g, '-')}`,
        version: '1.0.0',
        private: true,
        description: 'M.A.T.E. Method Spec-Driven QA & Automation Suite',
        scripts: qaScripts,
        devDependencies: qaDevDependencies,
      };
      fs.writeFileSync(pkgPath, `${JSON.stringify(newPkg, null, 2)}\n`, 'utf8');
      created.push('package.json (with M.A.T.E. & Playwright scripts and TypeScript devDependencies)');
    } else {
      try {
        const existingPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (existingPkg.name !== 'mate-sdt') {
          existingPkg.scripts = existingPkg.scripts || {};
          existingPkg.devDependencies = existingPkg.devDependencies || {};
          let addedScript = false;
          for (const [k, v] of Object.entries(qaScripts)) {
            if (!existingPkg.scripts[k]) {
              existingPkg.scripts[k] = v;
              addedScript = true;
            }
          }
          // Ensure @types/node and core devDependencies are registered
          for (const [dep, ver] of Object.entries(qaDevDependencies)) {
            if (!existingPkg.devDependencies[dep] && (!existingPkg.dependencies || !existingPkg.dependencies[dep])) {
              existingPkg.devDependencies[dep] = ver;
              addedScript = true;
            }
          }
          if (addedScript) {
            fs.writeFileSync(pkgPath, `${JSON.stringify(existingPkg, null, 2)}\n`, 'utf8');
            created.push('package.json (updated with M.A.T.E. scripts and devDependencies)');
          }
        }
      } catch {
        // Ignore malformed package.json
      }
    }
  }

  // Universal AGENTS.md instructions for agent-assisted projects
  created.push(...installUniversalAgents(resolved));

  return created;
}

/**
 * Ensures .gitignore has standard M.A.T.E., Node, environment, and Playwright ignore entries
 */
function ensureGitignore(targetDir) {
  const gitignorePath = path.join(targetDir, '.gitignore');
  const templatePath = path.join(PACKAGE_ROOT, 'templates', 'standalone', 'gitignore.template');

  if (!fs.existsSync(gitignorePath)) {
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, gitignorePath);
    } else {
      const fallback = [
        '# Dependencies',
        'node_modules/',
        '',
        '# Environment & Secrets',
        '.env',
        '.env.local',
        '.env.*.local',
        '!.env.example',
        '*.pem',
        '*.key',
        '',
        '# Playwright Test Artifacts & Reports',
        'test-results/',
        'playwright-report/',
        'blob-report/',
        'playwright/.cache/',
        '.playwright-cli/',
        'playwright/.auth/',
        '*.auth-state.json',
        '',
        '# M.A.T.E. Ephemeral Sessions, Handoffs & Scratchpads',
        '.mate/sessions/',
        '.mate/handoffs/',
        '.mate/scratchpad-*.md',
        '.mate/snapshots/',
        '.mate/harness-state.json',
        '.mate/context-pack-*.md',
        '.mate/*.har',
        '',
        '# Temp Files',
        'stryker-tmp/',
        'coverage/',
        '.promptfoo/',
        '',
        '# OS Files',
        '.DS_Store',
        'Thumbs.db',
        '',
      ].join('\n');
      fs.writeFileSync(gitignorePath, fallback, 'utf8');
    }
    return true;
  }

  const existing = fs.readFileSync(gitignorePath, 'utf8');
  const hasBroadMateIgnore = /(^|\r?\n)\.mate\/?\s*(\r?\n|$)/.test(existing);

  const requiredEntries = [
    'node_modules/',
    '.env',
    'test-results/',
    'playwright-report/',
    'blob-report/',
    '.playwright-cli/',
    'playwright/.auth/',
    '*.auth-state.json',
    '.mate/sessions/',
    '.mate/handoffs/',
    '.mate/scratchpad-*.md',
    '.mate/snapshots/',
    '.mate/harness-state.json',
    '.mate/context-pack-*.md',
    '.mate/*.har',
    'stryker-tmp/',
    '.promptfoo/',
  ];

  const missing = requiredEntries.filter((entry) => {
    if (hasBroadMateIgnore && entry.startsWith('.mate/')) return false;
    return !existing.includes(entry);
  });

  if (missing.length > 0) {
    const block = [
      '',
      '# M.A.T.E., Playwright & Security ignore rules',
      ...missing,
      '',
    ].join('\n');
    fs.writeFileSync(gitignorePath, `${existing.trimEnd()}\n${block}`, 'utf8');
    return true;
  }
  return false;
}

/**
 * Backward-compatible alias for ensureGitignore
 */
function ensurePlaywrightGitignore(targetDir) {
  return ensureGitignore(targetDir);
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
      '\n🎭 Installing Playwright & TypeScript definitions (@playwright/cli, @playwright/test, @types/node, typescript)...',
      COLORS.bold,
      COLORS.brightGreen
    )
  );

  const installRes = spawnSync(
    npmCmd,
    [
      'install',
      '-D',
      '@playwright/cli@latest',
      '@playwright/test@latest',
      '@types/node@latest',
      'typescript@latest',
    ],
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
  const rawIdes = options.ides || ['antigravity', 'claude', 'cursor', 'windsurf', 'copilot'];
  const ides = rawIdes.map(normalizeIdeName);
  const includeStarterFiles =
    options.includeStarterFiles !== undefined ? options.includeStarterFiles : true;
  const installPlaywrightCli = Boolean(options.installPlaywrightCli);

  const scaffolded = initMateProject(targetDir, { mode, includeStarterFiles });
  if (ensureGitignore(targetDir)) {
    if (!scaffolded.includes('.gitignore') && !scaffolded.some((s) => s.startsWith('.gitignore'))) {
      scaffolded.push('.gitignore (configured ignore rules for node_modules, .env, Playwright & M.A.T.E.)');
    }
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
  if (
    ides.includes('codex') ||
    ides.includes('agents') ||
    ides.includes('universal') ||
    ides.includes('all')
  ) {
    ideFiles.push(...installUniversalAgents(targetDir));
  }

  // Always ensure universal AGENTS.md is maintained at project root
  ideFiles.push(...installUniversalAgents(targetDir));

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
  const hasClaudeCommands =
    fs.existsSync(path.join(resolved, '.claude', 'commands', 'mate-core.md')) ||
    fs.existsSync(path.join(resolved, '.claude', 'skills', 'mate-core', 'SKILL.md'));
  const hasCursorRules = fs.existsSync(
    path.join(resolved, '.cursor', 'rules', 'mate-core.mdc')
  );
  const hasWindsurfRules =
    fs.existsSync(path.join(resolved, '.windsurf', 'rules', 'mate-core.md')) ||
    fs.existsSync(path.join(resolved, '.windsurf', 'rules', 'mate-sdt.md'));
  const hasCopilotInstructions = fs.existsSync(
    path.join(resolved, '.github', 'copilot-instructions.md')
  );
  const hasAgentsMd = fs.existsSync(path.join(resolved, 'AGENTS.md'));

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
    hasWindsurfRules,
    hasCopilotInstructions,
    hasAgentsMd,
    specValidation,
    auditResult,
    podmanAvailable,
    podmanVersion,
    playwrightCliAvailable,
    playwrightCliVersion,
  };
}

/**
 * Detects if a directory has an existing M.A.T.E. installation
 */
function detectExistingMate(targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const hasProjectMap = fs.existsSync(path.join(resolved, 'MATE-PROJECT-MAP.md'));
  const hasSpecs = fs.existsSync(path.join(resolved, 'specs'));
  const hasAntigravity = fs.existsSync(path.join(resolved, '.agents', 'skills', 'mate-core', 'SKILL.md'));
  const hasClaude =
    fs.existsSync(path.join(resolved, '.claude', 'commands', 'mate-core.md')) ||
    fs.existsSync(path.join(resolved, '.claude', 'skills', 'mate-core', 'SKILL.md'));
  const hasCursor = fs.existsSync(path.join(resolved, '.cursor', 'rules', 'mate-core.mdc'));
  const hasWindsurf =
    fs.existsSync(path.join(resolved, '.windsurf', 'rules', 'mate-core.md')) ||
    fs.existsSync(path.join(resolved, '.windsurf', 'rules', 'mate-sdt.md'));
  const hasCopilot = fs.existsSync(path.join(resolved, '.github', 'copilot-instructions.md'));
  const hasCodex = fs.existsSync(path.join(resolved, 'AGENTS.md'));
  const hasAiPack = fs.existsSync(path.join(resolved, '.agents', 'skills', 'mate-ai-dataset', 'SKILL.md'));

  const detectedIdes = [];
  if (hasAntigravity) detectedIdes.push('antigravity');
  if (hasClaude) detectedIdes.push('claude');
  if (hasCursor) detectedIdes.push('cursor');
  if (hasWindsurf) detectedIdes.push('windsurf');
  if (hasCopilot) detectedIdes.push('copilot');
  if (hasCodex) detectedIdes.push('codex');

  const isInstalled = hasProjectMap || hasSpecs || detectedIdes.length > 0;

  let installedSkillsCount = 0;
  const antigravitySkillsDir = path.join(resolved, '.agents', 'skills');
  if (fs.existsSync(antigravitySkillsDir)) {
    try {
      const items = fs.readdirSync(antigravitySkillsDir, { withFileTypes: true });
      installedSkillsCount = items.filter((i) => i.isDirectory() && i.name.startsWith('mate-')).length;
    } catch {
      installedSkillsCount = 0;
    }
  }

  return {
    isInstalled,
    hasProjectMap,
    hasSpecs,
    hasAiPack,
    detectedIdes: detectedIdes.length > 0 ? detectedIdes : ['antigravity', 'claude', 'cursor', 'windsurf', 'copilot', 'codex'],
    installedSkillsCount,
  };
}

module.exports = {
  // Constants
  STANDARD_DIRECTORIES,
  SKILL_NAMES,
  WORKFLOW_NAMES,
  AI_SKILL_NAMES,
  AI_WORKFLOW_NAMES,

  // IDE Scaffolding
  normalizeIdeName,
  installUniversalAgents,
  installCodex,

  // AI Quality Pack
  setupAiQualityPack,
  generateAiDataset,

  // Artifact Generators
  generateTestStrategy,
  generateTestPlan,
  generateTestCases,
  generateCharter,
  generateWaiver,
  generateBugReport,

  // Core Installer & Orchestration
  detectExistingMate,
  initMateProject,
  installMate,
  ensureGitignore,
  ensurePlaywrightGitignore,
  installPlaywrightCliPackages,
  checkStatus,

  // Harness & Container Execution
  analyzeContextEngineering,
  runHarnessGate,
  runPodmanMutation,
  runPodmanK6,
};
