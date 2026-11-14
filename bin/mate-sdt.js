#!/usr/bin/env node
'use strict';

const path = require('node:path');
const pkg = require('../package.json');
const {
  COLORS,
  color,
  printBanner,
  createPromptInterface,
  promptSelect,
  promptMultiSelect,
  promptConfirm,
} = require('../src/cli/ui');
const { validateTarget } = require('../src/cli/validator');
const { auditTestSuite } = require('../src/cli/auditor');
const {
  detectExistingMate,
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
} = require('../src/cli/installer');
const {
  startSession,
  loadSession,
  recordEvent,
  advanceStage,
  pruneExpiredSessions,
  listSessions,
  isSessionExpired,
} = require('../src/cli/memory');
const { runHarnessLoop } = require('../src/cli/harness');
const { runGarbageCollection, blockDestructiveCommands } = require('../src/cli/gc');

function parseFlags(args) {
  const flags = {
    positional: [],
    yes: false,
    json: false,
    mode: null,
    ide: null,
    dir: null,
    config: 'stryker.config.json',
    starter: true,
    playwrightCli: false,
    aiEvals: false,
    help: false,
    version: false,
    consolidate: false,
    compact: false,
    dryRun: false,
    artifact: null,
    phase: null,
    task: null,
    flow: null,
    facts: [],
    stage: null,
    module: null,
    ttl: null,
    type: null,
    to: null,
    digest: null,
    loop: false,
    gc: false,
    maxIterations: 5,
    checkCommand: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-y' || arg === '--yes') {
      flags.yes = true;
    } else if (arg === '--json') {
      flags.json = true;
    } else if (arg === '-h' || arg === '--help') {
      flags.help = true;
    } else if (arg === '-v' || arg === '--version') {
      flags.version = true;
    } else if (arg === '--no-starter') {
      flags.starter = false;
    } else if (arg === '--with-playwright-cli' || arg === '--playwright-cli') {
      flags.playwrightCli = true;
    } else if (arg === '--no-playwright-cli') {
      flags.playwrightCli = false;
    } else if (arg === '--with-ai-evals' || arg === '--ai-evals' || arg === '--with-ai') {
      flags.aiEvals = true;
    } else if (arg === '--consolidate') {
      flags.consolidate = true;
    } else if (arg === '--compact') {
      flags.compact = true;
    } else if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg === '--loop') {
      flags.loop = true;
    } else if (arg === '--gc') {
      flags.gc = true;
    } else if (arg === '--max-iterations' && args[i + 1]) {
      flags.maxIterations = Number(args[++i]) || 5;
    } else if (arg.startsWith('--max-iterations=')) {
      flags.maxIterations = Number(arg.split('=')[1]) || 5;
    } else if (arg === '--check-command' && args[i + 1]) {
      flags.checkCommand = args[++i];
    } else if (arg.startsWith('--check-command=')) {
      flags.checkCommand = arg.slice('--check-command='.length);
    } else if (arg === '--mode' && args[i + 1]) {
      flags.mode = args[++i];
    } else if (arg.startsWith('--mode=')) {
      flags.mode = arg.split('=')[1];
    } else if (arg === '--ide' && args[i + 1]) {
      flags.ide = args[++i];
    } else if (arg.startsWith('--ide=')) {
      flags.ide = arg.split('=')[1];
    } else if (arg === '--dir' && args[i + 1]) {
      flags.dir = args[++i];
    } else if (arg.startsWith('--dir=')) {
      flags.dir = arg.split('=')[1];
    } else if (arg === '--config' && args[i + 1]) {
      flags.config = args[++i];
    } else if (arg.startsWith('--config=')) {
      flags.config = arg.split('=')[1];
    } else if (arg === '--artifact' && args[i + 1]) {
      flags.artifact = args[++i];
    } else if (arg.startsWith('--artifact=')) {
      flags.artifact = arg.slice('--artifact='.length);
    } else if (arg === '--phase' && args[i + 1]) {
      flags.phase = args[++i];
    } else if (arg.startsWith('--phase=')) {
      flags.phase = arg.slice('--phase='.length);
    } else if (arg === '--task' && args[i + 1]) {
      flags.task = args[++i];
    } else if (arg.startsWith('--task=')) {
      flags.task = arg.slice('--task='.length);
    } else if (arg === '--flow' && args[i + 1]) {
      flags.flow = args[++i];
    } else if (arg.startsWith('--flow=')) {
      flags.flow = arg.slice('--flow='.length);
    } else if ((arg === '--facts' || arg === '--fact') && args[i + 1]) {
      flags.facts.push(args[++i]);
    } else if (arg.startsWith('--facts=')) {
      flags.facts.push(arg.slice('--facts='.length));
    } else if (arg.startsWith('--fact=')) {
      flags.facts.push(arg.slice('--fact='.length));
    } else if (arg === '--stage' && args[i + 1]) {
      flags.stage = args[++i];
    } else if (arg.startsWith('--stage=')) {
      flags.stage = arg.slice('--stage='.length);
    } else if (arg === '--module' && args[i + 1]) {
      flags.module = args[++i];
    } else if (arg.startsWith('--module=')) {
      flags.module = arg.slice('--module='.length);
    } else if (arg === '--ttl' && args[i + 1]) {
      flags.ttl = Number(args[++i]);
    } else if (arg.startsWith('--ttl=')) {
      flags.ttl = Number(arg.slice('--ttl='.length));
    } else if (arg === '--type' && args[i + 1]) {
      flags.type = args[++i];
    } else if (arg.startsWith('--type=')) {
      flags.type = arg.slice('--type='.length);
    } else if (arg === '--to' && args[i + 1]) {
      flags.to = args[++i];
    } else if (arg.startsWith('--to=')) {
      flags.to = arg.slice('--to='.length);
    } else if (arg === '--digest' && args[i + 1]) {
      flags.digest = args[++i];
    } else if (arg.startsWith('--digest=')) {
      flags.digest = arg.slice('--digest='.length);
    } else {
      flags.positional.push(arg);
    }
  }

  return flags;
}

function printHelp() {
  printBanner(pkg.version);
  console.log(color('  USAGE:', COLORS.bold, COLORS.cyan));
  console.log('    npx mate-sdt <command> [options]\n');
  console.log(color('  COMMANDS:', COLORS.bold, COLORS.cyan));
  console.log(
    `    ${color('install', COLORS.brightGreen, COLORS.bold)}              Interactive installer (16 core AI skills, 7 E2E workflows, IDE rules & SDT layout; +4 AI Agent skills with setup-ai)`
  );
  console.log(
    `    ${color('init [dir]', COLORS.brightGreen, COLORS.bold)}           Quick-scaffold M.A.T.E. directories, Living Map & templates`
  );
  console.log(
    `    ${color('setup-playwright [dir]', COLORS.brightGreen, COLORS.bold)} Install @playwright/cli & @playwright/test in the target project`
  );
  console.log(
    `    ${color('setup-ai [dir]', COLORS.brightGreen, COLORS.bold)}         Install On-Demand AI Quality Pack (Promptfoo + DeepEval + OTel Traces)`
  );
  console.log(
    `    ${color('dataset <module>', COLORS.brightGreen, COLORS.bold)}       Generate Socratic 5-Dimension AI Dataset Discovery & Golden JSON`
  );
  console.log(
    `    ${color('strategy [name]', COLORS.brightGreen, COLORS.bold)}      Generate Master Test Strategy & Risk Matrix in docs/TEST-STRATEGY.md`
  );
  console.log(
    `    ${color('plan <scope>', COLORS.brightGreen, COLORS.bold)}         Generate a Release / Sprint Test Plan in docs/test-plans/`
  );
  console.log(
    `    ${color('validate [path]', COLORS.brightGreen, COLORS.bold)}      Validate one or all *.mate-spec.md files (defaults to ./specs)`
  );
  console.log(
    `    ${color('context [module]', COLORS.brightGreen, COLORS.bold)}     Analyze Context Engineering, compact/consolidate memory & build 3-Bucket JIT Context Pack`
  );
  console.log(
    `    ${color('session <action>', COLORS.brightGreen, COLORS.bold)}     Manage Session Workbench (start|event|advance|show|list|prune) & Black-Box Handoffs`
  );
  console.log(
    `    ${color('gate [dir] [--loop]', COLORS.brightGreen, COLORS.bold)}  Execute the 5-Gate Harness Engineering Closed Verification Loop`
  );
  console.log(
    `    ${color('gc [dir]', COLORS.brightGreen, COLORS.bold)}             Run Doc-Gardening, AI Slop GC, update docs/QUALITY_SCORE.md & tech-debt-tracker.md`
  );
  console.log(
    `    ${color('cases <module>', COLORS.brightGreen, COLORS.bold)}       Create a 4-Quadrant Test Case Matrix (.md & .csv) in docs/test-cases/`
  );
  console.log(
    `    ${color('audit [dir]', COLORS.brightGreen, COLORS.bold)}          Scan test codebase for anti-patterns & compute Health Score (A-F)`
  );
  console.log(
    `    ${color('mutate [dir]', COLORS.brightGreen, COLORS.bold)}         Execute Stryker Mutator (>=85%) inside a rootless Podman container`
  );
  console.log(
    `    ${color('k6 [script]', COLORS.brightGreen, COLORS.bold)}          Execute Grafana k6 performance suite inside a rootless Podman container`
  );
  console.log(
    `    ${color('charter <module>', COLORS.brightGreen, COLORS.bold)}     Create a human Exploratory Testing Charter (SBTM) in tests/charters/`
  );
  console.log(
    `    ${color('bug <module>', COLORS.brightGreen, COLORS.bold)}         Create a Structured Bug Report linked to spec invariants in docs/bugs/`
  );
  console.log(
    `    ${color('waiver <module>', COLORS.brightGreen, COLORS.bold)}      Create a Formal Release Waiver in specs/waivers/`
  );
  console.log(
    `    ${color('status [dir]', COLORS.brightGreen, COLORS.bold)}         Audit M.A.T.E. compliance, specs, Health Score, IDE skills & Podman`
  );
  console.log(
    `    ${color('help', COLORS.brightGreen, COLORS.bold)}                 Display this help message\n`
  );
  console.log(color('  INSTALL OPTIONS:', COLORS.bold, COLORS.cyan));
  console.log('    -y, --yes                Accept defaults without interactive prompts');
  console.log('    --mode <mode>            Project mode: greenfield | brownfield | skills-only');
  console.log('    --ide <list>             Target IDEs: antigravity,claude,cursor,windsurf,copilot,codex,all');
  console.log('    --dir <path>             Target project directory (default: current directory)');
  console.log('    --with-playwright-cli    Install @playwright/cli & @playwright/test via npm');
  console.log('    --with-ai-evals          Install the AI Agent, Chatbot & RAG Quality Pack (Promptfoo + DeepEval + OTel)');
  console.log('    --no-starter             Skip sample spec & Playwright/API/k6 starter templates\n');
  console.log(color('  EXAMPLES:', COLORS.bold, COLORS.cyan));
  console.log('    npx mate-sdt install');
  console.log('    npx mate-sdt validate specs/laundry-orders.mate-spec.md');
  console.log('    npx mate-sdt audit');
  console.log('    npx mate-sdt bug checkout-flow');
  console.log('    npx mate-sdt k6 tests/nfr/order-load.k6.js');
  console.log('    npx mate-sdt mutate\n');
}

async function handleInstall(flags) {
  printBanner(pkg.version);
  const targetDir = path.resolve(flags.dir || flags.positional[1] || '.');
  const existing = detectExistingMate(targetDir);

  let mode = flags.mode || (existing.hasProjectMap ? 'skills-only' : 'greenfield');
  let ides = flags.ide
    ? flags.ide.split(',').map((s) => s.trim().toLowerCase())
    : existing.detectedIdes;
  let includeStarterFiles = flags.starter;
  let installPlaywrightCli = flags.playwrightCli;
  let installAiEvals = flags.aiEvals !== undefined ? flags.aiEvals : existing.hasAiPack;

  if (!flags.yes && process.stdin.isTTY) {
    const rl = createPromptInterface();
    try {
      if (existing.isInstalled) {
        console.log(color('  🔍 Existing M.A.T.E. project detected in this directory:', COLORS.bold, COLORS.cyan));
        console.log(`     • Living Map (MATE-PROJECT-MAP.md): ${existing.hasProjectMap ? color('Found', COLORS.brightGreen) : color('Not found', COLORS.gray)}`);
        console.log(`     • Configured IDEs: ${color(existing.detectedIdes.join(', '), COLORS.brightGreen)}`);
        if (existing.installedSkillsCount > 0) {
          console.log(`     • Installed Skills: ${color(`${existing.installedSkillsCount} skills`, COLORS.yellow)} (Framework v${pkg.version} provides 16 core skills + 4 on-demand AI skills; 20 total)`);
        }
        console.log('');

        const wantUpdate = await promptConfirm(
          rl,
          `Would you like to UPDATE all M.A.T.E. AI skills and workflows to v${pkg.version}? (Your specs, tests, and pages will be 100% preserved)`,
          true
        );

        if (wantUpdate) {
          mode = 'skills-only';
          includeStarterFiles = false;

          ides = await promptMultiSelect(
            rl,
            'Which AI Coding Agents / IDEs do you want to update/configure?',
            [
              { label: 'Google Antigravity IDE & agy CLI (.agents/skills + .agent/workflows/mate)', value: 'antigravity' },
              { label: 'Claude Code (.claude/skills + .claude/commands + CLAUDE.md)', value: 'claude' },
              { label: 'Cursor (.cursor/rules/*.mdc + AGENTS.md)', value: 'cursor' },
              { label: 'Windsurf (.windsurf/rules/*.md + .windsurf/workflows)', value: 'windsurf' },
              { label: 'GitHub Copilot (.github/copilot-instructions.md + .github/prompts)', value: 'copilot' },
              { label: 'OpenAI Codex CLI & Universal Agents (AGENTS.md)', value: 'codex' },
            ],
            existing.detectedIdes.map((id) => ['antigravity', 'claude', 'cursor', 'windsurf', 'copilot', 'codex'].indexOf(id)).filter((i) => i >= 0)
          );

          if (!existing.hasAiPack) {
            installAiEvals = await promptConfirm(
              rl,
              'Also install the on-demand AI Quality Pack? (4 AI Skills + Promptfoo + DeepEval + OTel Trace Auditor)',
              false
            );
          } else {
            installAiEvals = true;
          }

          console.log(color('\n🧉 Updating M.A.T.E. skills and workflows...', COLORS.bold, COLORS.brightGreen));
        } else {
          console.log(color('\nExiting without making changes. Your existing setup remains untouched.\n', COLORS.gray));
          return;
        }
      } else {
        mode = await promptSelect(
          rl,
          'Select your project lifecycle mode:',
          [
            {
              label: 'Standalone QA Repository (Separate QA Folder for a Live App — Zero-to-One Harness)',
              description: 'Best when QA works in a dedicated folder outside Front/Back with playwright.config.ts, TEST-STRATEGY.md & Smoke-First setup.',
              value: 'standalone-qa',
            },
            {
              label: 'Greenfield (Full SDT Architecture + 16 Core AI Skills + 7 Workflows + SOLID Templates)',
              description: 'Best for new projects or establishing a complete UI, API, k6 & SDT harness.',
              value: 'greenfield',
            },
            {
              label: 'Brownfield / Existing Project (AI Skills + Workflows + Living Map + Spec Governance)',
              description: 'Best for existing repositories where you want to reverse-engineer specs.',
              value: 'brownfield',
            },
            {
              label: 'AI Skills, Workflows & IDE Rules Only (No test folder scaffolding)',
              description: 'Installs M.A.T.E. skills/workflows and specs/ folder without touching src/ or tests/.',
              value: 'skills-only',
            },
          ],
          0
        );

        ides = await promptMultiSelect(
          rl,
          'Which AI Coding Agents / IDEs do you want to configure?',
          [
            { label: 'Google Antigravity IDE & agy CLI (.agents/skills + .agent/workflows/mate)', value: 'antigravity' },
            { label: 'Claude Code (.claude/skills + .claude/commands + CLAUDE.md)', value: 'claude' },
            { label: 'Cursor (.cursor/rules/*.mdc + AGENTS.md)', value: 'cursor' },
            { label: 'Windsurf (.windsurf/rules/*.md + .windsurf/workflows)', value: 'windsurf' },
            { label: 'GitHub Copilot (.github/copilot-instructions.md + .github/prompts)', value: 'copilot' },
            { label: 'OpenAI Codex CLI & Universal Agents (AGENTS.md)', value: 'codex' },
          ],
          [0, 1, 2, 5]
        );

        if (mode !== 'skills-only') {
          includeStarterFiles = await promptConfirm(
            rl,
            'Include Golden Sample Spec and SOLID starter templates (BasePage, Component, BaseApiClient, Fixtures, k6)?',
            true
          );
        } else {
          includeStarterFiles = false;
        }

        installPlaywrightCli = await promptConfirm(
          rl,
          'Install @playwright/cli & @playwright/test via npm now? (Enables live browser recon, codegen, traces & video)',
          mode !== 'skills-only'
        );

        installAiEvals = await promptConfirm(
          rl,
          'Install the AI Agent, Chatbot & RAG Quality Pack? (4 AI Skills + Promptfoo + DeepEval + OTel Trace Auditor)',
          false
        );
      }
    } finally {
      rl.close();
    }
  }

  console.log(color(`\n🧉 Installing M.A.T.E. Method (${mode}) in: ${targetDir}\n`, COLORS.bold, COLORS.brightGreen));

  const result = installMate({
    targetDir,
    mode,
    ides,
    includeStarterFiles,
    installPlaywrightCli,
    installAiEvals,
  });

  console.log(color('  📦 Scaffolded Project Artifacts:', COLORS.bold, COLORS.cyan));
  for (const item of result.scaffolded) {
    console.log(`     ${color('✔', COLORS.brightGreen)} ${item}`);
  }

  console.log(color('\n  🤖 Installed 16 Core Synergistic AI Skills, 7 E2E Workflows & IDE Rules (Add 4 AI Agent/RAG skills via `setup-ai`):', COLORS.bold, COLORS.cyan));
  for (const item of result.ideFiles) {
    console.log(`     ${color('✔', COLORS.brightGreen)} ${item}`);
  }

  if (result.playwrightCliInstalled) {
    console.log(color('\n  🎭 Installed @playwright/cli & @playwright/test in node_modules', COLORS.bold, COLORS.brightGreen));
  }

  if (result.aiPackInstalled && result.aiPackFiles?.length) {
    console.log(color('\n  🧬 Installed M.A.T.E. AI Quality Pack (Promptfoo + DeepEval + OTel Observability):', COLORS.bold, COLORS.cyan));
    for (const item of result.aiPackFiles) {
      console.log(`     ${color('✔', COLORS.brightGreen)} ${item}`);
    }
  }

  console.log(color('\n✨ M.A.T.E. Method installation complete!', COLORS.bold, COLORS.brightGreen));
  console.log(color('\n👉 Next Steps:', COLORS.bold, COLORS.yellow));
  console.log('   1. Review MATE-PROJECT-MAP.md at the root of your repository.');
  console.log('   2. Draft or inspect your first spec in specs/ and run: npx mate-sdt validate');
  console.log('   3. Audit test suite health anytime with:               npx mate-sdt audit');
  console.log('   4. Check overall project compliance with:              npx mate-sdt status\n');
}

function handleInit(flags) {
  printBanner(pkg.version);
  const targetDir = path.resolve(flags.dir || flags.positional[1] || '.');
  console.log(color(`🧉 Initializing M.A.T.E. project structure in: ${targetDir}\n`, COLORS.bold, COLORS.brightGreen));

  const created = initMateProject(targetDir, {
    mode: flags.mode || 'greenfield',
    includeStarterFiles: flags.starter,
  });

  for (const item of created) {
    console.log(`  ${color('[+]', COLORS.brightGreen)} ${item}`);
  }
  console.log(color('\n✨ Project initialization complete! Run `npx mate-sdt validate` to verify specs.\n', COLORS.brightGreen));
}

function handleValidate(flags) {
  const target = flags.positional[1] || path.join(flags.dir || '.', 'specs');
  console.log(color(`\n🧉 Validating M.A.T.E. Specifications in: ${target}\n`, COLORS.bold, COLORS.cyan));

  const { allValid, results } = validateTarget(target);

  for (const res of results) {
    const relName = path.relative(process.cwd(), res.filePath) || res.filePath;
    if (res.valid) {
      console.log(`  ${color('✅ PASS', COLORS.brightGreen, COLORS.bold)} ${relName}`);
    } else {
      console.log(`  ${color('❌ FAIL', COLORS.red, COLORS.bold)} ${relName}`);
    }

    for (const warn of res.warnings) {
      console.log(`     ${color(`⚠️  Warning: ${warn}`, COLORS.yellow)}`);
    }
    for (const err of res.errors) {
      console.log(`     ${color(`•  Error:   ${err}`, COLORS.red)}`);
    }
    if (Array.isArray(res.remediations)) {
      for (const rem of res.remediations) {
        console.log(color(rem.split('\n').map((l) => `     ${l}`).join('\n'), COLORS.yellow));
      }
    }
  }

  console.log('');
  if (!allValid) {
    console.error(color('❌ Spec validation FAILED. Fix the errors above before proceeding to Pillar A.', COLORS.red, COLORS.bold));
    process.exit(1);
  } else {
    console.log(color('✅ All specifications comply with the M.A.T.E. Spec-Driven Testing Standard!', COLORS.brightGreen, COLORS.bold));
  }
}

function handleContext(flags) {
  const moduleName = flags.positional[1] || flags.module || null;
  const targetDir = flags.dir || '.';
  const ctx = analyzeContextEngineering(targetDir, moduleName, {
    compact: flags.compact,
    consolidate: flags.consolidate,
    facts: flags.facts,
    dryRun: flags.dryRun,
    phase: flags.phase,
    task: flags.task,
    flow: flags.flow,
  });

  if (flags.json) {
    console.log(JSON.stringify(ctx, null, 2));
    return;
  }

  console.log(
    color(`\n🧠 M.A.T.E. Context Engineering Analysis: ${ctx.targetDir}\n`, COLORS.bold, COLORS.cyan)
  );
  const budgetOk = ctx.tier1Healthy
    ? color(`✔ ${ctx.mapTokens} / ${ctx.tier1TokenBudget} tokens (LEAN)`, COLORS.brightGreen, COLORS.bold)
    : color(`✘ ${ctx.mapTokens} / ${ctx.tier1TokenBudget} tokens (EXCEEDS BUDGET OR MISSING)`, COLORS.red, COLORS.bold);

  console.log(`  • Tier-1 RAM Budget (MATE-PROJECT-MAP.md): ${budgetOk}`);
  console.log(`  • Total Spec Token Footprint (${ctx.specCount} specs):   ~${ctx.totalSpecTokens} tokens`);
  console.log(
    `  • Epistemic Isolation Tags:                [OBSERVED]: ${ctx.epistemicStats.observedCount} | [INFERRED]: ${ctx.epistemicStats.inferredCount} | [TBD]: ${ctx.epistemicStats.tbdCount}`
  );
  console.log(
    `  • Context Drift (Unindexed Artifacts):     ${
      ctx.unindexedArtifacts.length === 0
        ? color('0 (100% Synchronized)', COLORS.brightGreen)
        : color(`${ctx.unindexedArtifacts.length} unindexed (${ctx.unindexedArtifacts.join(', ')})`, COLORS.yellow)
    }`
  );
  console.log(
    `  • Active Sessions / Expired TTL:           ${ctx.activeSessionCount} active | ${ctx.expiredSessionCount} expired`
  );

  if (ctx.hygiene) {
    const errs = ctx.hygiene.errors || (ctx.hygiene.issues || []).filter((i) => i.severity === 'error');
    const warns = ctx.hygiene.warnings || (ctx.hygiene.issues || []).filter((i) => i.severity === 'warn');
    const hygieneLabel = errs.length === 0
      ? color(`✔ PASS (${warns.length} warning(s))`, COLORS.brightGreen)
      : color(`✘ FAIL (${errs.length} error(s), ${warns.length} warning(s))`, COLORS.red, COLORS.bold);
    console.log(`  • Context Hygiene (4 Failure Modes):       ${hygieneLabel}`);
  }

  if (ctx.compactionResult) {
    const compactedCount = Array.isArray(ctx.compactionResult) ? ctx.compactionResult.length : 0;
    console.log(
      color(
        `\n  🗜️  Session Compaction: ${compactedCount} session(s) compacted.`,
        COLORS.cyan
      )
    );
  }

  if (ctx.consolidationResult) {
    const cr = ctx.consolidationResult;
    const ops = cr.counts || {};
    console.log(
      color(
        `\n  🗄️  Memory Consolidation (${cr.module}${cr.dryRun ? ' [DRY RUN]' : ''}): CREATE=${ops.CREATE || 0} | UPDATE=${ops.UPDATE || 0} | DELETE=${ops.DELETE || 0} | CONFLICT=${ops.CONFLICT || 0}`,
        COLORS.brightGreen,
        COLORS.bold
      )
    );
    if (cr.rejected.length > 0) {
      console.log(color(`     ⚠ Rejected ${cr.rejected.length} finding(s) (PII/injection/untrusted provenance).`, COLORS.yellow));
    }
  }

  if (ctx.contextPackPath) {
    console.log(
      color(`\n  📦 Generated 3-Bucket / 7-Layer JIT Context Pack (~${ctx.contextPackTokens} tokens):`, COLORS.brightGreen, COLORS.bold)
    );
    console.log(`     ${ctx.contextPackPath}`);
    if (ctx.packMeta && ctx.packMeta.bucketStats) {
      const b = ctx.packMeta.bucketStats;
      console.log(
        `     Buckets -> System+Guardrails+FewShots: ~${b.bucket1 || 0}t | Memory+State+Handoff+Specs: ~${b.bucket2 || 0}t | Immediate Task+Schema: ~${b.bucket3 || 0}t`
      );
    }
  }
  console.log('');
}

function handleSession(flags) {
  const action = (flags.positional[1] || 'list').toLowerCase();
  const targetDir = flags.dir || '.';

  if (action === 'start') {
    const flowId = flags.positional[2] || flags.flow || `flow-${Date.now()}`;
    const session = startSession(targetDir, flowId, {
      module: flags.module || 'global',
      stage: flags.stage || 'recon',
      ttlHours: flags.ttl || 24,
    });
    if (flags.json) {
      console.log(JSON.stringify(session, null, 2));
      return;
    }
    console.log(color(`\n🧵 Started Session Workbench: ${session.flowId}`, COLORS.brightGreen, COLORS.bold));
    console.log(`   Module: ${session.module} | Stage: ${session.activeStage} | TTL: ${session.ttlHours}h\n`);
    return;
  }

  if (action === 'event' || action === 'log') {
    const flowId = flags.positional[2] || flags.flow;
    const message = flags.positional.slice(3).join(' ') || flags.task || flags.digest;
    if (!flowId || !message) {
      console.error(color('Usage: npx mate-sdt session event <flowId> "<message>" [--type=note] [--stage=recon]', COLORS.red));
      process.exit(1);
    }
    const res = recordEvent(targetDir, flowId, {
      type: flags.type || 'note',
      message,
      file: flags.artifact,
    });
    if (flags.json) {
      console.log(JSON.stringify(res, null, 2));
      return;
    }
    console.log(color(`\n📝 Recorded event in '${flowId}' (raw window: ${res.session.events.length}, ok: ${res.ok})\n`, COLORS.cyan));
    return;
  }

  if (action === 'advance') {
    const flowId = flags.positional[2] || flags.flow;
    const nextStage = flags.stage || flags.positional[3];
    if (!flowId || !nextStage) {
      console.error(color('Usage: npx mate-sdt session advance <flowId> --stage=<nextStage> [--to=<skill>] [--digest="<summary>"]', COLORS.red));
      process.exit(1);
    }
    const res = advanceStage(targetDir, flowId, nextStage, {
      toSkill: flags.to || nextStage,
      digest: flags.digest || flags.task || `Stage transition to ${nextStage}`,
      artifacts: flags.artifact ? [flags.artifact] : [],
    });
    if (flags.json) {
      console.log(JSON.stringify(res, null, 2));
      return;
    }
    console.log(color(`\n🔁 Advanced '${flowId}' -> stage '${nextStage}'`, COLORS.brightGreen, COLORS.bold));
    if (res.ok && res.handoff) {
      console.log(`   Black-Box Handoff: .mate/handoffs/${res.handoff.flowId}--${res.handoff.fromStage}.json`);
    }
    console.log('');
    return;
  }

  if (action === 'show') {
    const flowId = flags.positional[2] || flags.flow;
    const session = flowId ? loadSession(targetDir, flowId) : null;
    if (!session) {
      console.error(color(`Session '${flowId || ''}' not found.`, COLORS.red));
      process.exit(1);
    }
    if (flags.json) {
      console.log(JSON.stringify(session, null, 2));
      return;
    }
    console.log(color(`\n🧵 Session: ${session.flowId} (${session.activeStage})`, COLORS.bold, COLORS.cyan));
    console.log(`   Module: ${session.module} | Updated: ${session.updatedAt} | Expired: ${isSessionExpired(session)}`);
    console.log(`   Raw events (${session.events.length}):`);
    for (const ev of session.events) {
      console.log(`     - [${ev.stage}] ${ev.message}`);
    }
    console.log('');
    return;
  }

  if (action === 'prune') {
    const removed = pruneExpiredSessions(targetDir);
    if (flags.json) {
      console.log(JSON.stringify({ removed }, null, 2));
      return;
    }
    console.log(color(`\n🧹 Pruned ${removed.length} expired session(s).\n`, COLORS.cyan));
    return;
  }

  // Default: list
  const sessions = listSessions(targetDir);
  if (flags.json) {
    console.log(JSON.stringify(sessions, null, 2));
    return;
  }
  console.log(color(`\n🧵 Session Workbench (${sessions.length} session(s))`, COLORS.bold, COLORS.cyan));
  for (const s of sessions) {
    const exp = isSessionExpired(s) ? color('EXPIRED', COLORS.yellow) : color('ACTIVE', COLORS.brightGreen);
    console.log(`  • ${s.flowId} [${s.module} | ${s.stage}] (${s.events.length} raw events) - ${exp}`);
  }
  console.log('');
}

function handleGate(flags) {
  if (flags.checkCommand) {
    const guard = blockDestructiveCommands(flags.checkCommand);
    if (flags.json) {
      console.log(JSON.stringify(guard, null, 2));
      if (!guard.allowed) process.exit(1);
      return;
    }
    if (!guard.allowed) {
      console.error(color(`\n🛑 [SAFETY GUARDRAIL] Blocked destructive command: ${guard.blockedPattern}`, COLORS.red, COLORS.bold));
      console.error(color(`   Remediation: ${guard.remediation}\n`, COLORS.yellow));
      process.exit(1);
    }
    console.log(color('\n✅ Command passed M.A.T.E. Safety Guardrail.\n', COLORS.brightGreen));
    return;
  }

  const targetDir = flags.dir || flags.positional[1] || '.';
  const report = flags.loop
    ? runHarnessLoop(targetDir, { maxIterations: flags.maxIterations })
    : runHarnessGate(targetDir);

  if (flags.json) {
    console.log(JSON.stringify(report, null, 2));
    if (!report.allGatesPassed) process.exit(1);
    return;
  }

  console.log(
    color(
      `\n⚙️  M.A.T.E. Harness Engineering — ${flags.loop ? `Closed Verification Loop (max ${flags.maxIterations})` : 'Verification Gate'} (${targetDir})\n`,
      COLORS.bold,
      COLORS.cyan
    )
  );

  for (const g of report.gates) {
    const badge = g.passed
      ? color('✅ PASS', COLORS.brightGreen, COLORS.bold)
      : color('❌ FAIL', COLORS.red, COLORS.bold);
    console.log(`  ${badge} [${g.id}] ${g.name}`);
    console.log(`         ${color(g.details, COLORS.gray)}`);
  }

  if (report.selfCorrectionPrompts.length > 0) {
    console.log(color('\n🔁 Agent Self-Correction Feedback Loop:', COLORS.bold, COLORS.yellow));
    for (const p of report.selfCorrectionPrompts) {
      console.log(`  • ${p}`);
    }
  }

  console.log('');
  if (!report.allGatesPassed) {
    console.error(
      color(
        '❌ Harness Verification Gate FAILED. Apply the self-correction prompts above and re-run `npx mate-sdt gate`.',
        COLORS.red,
        COLORS.bold
      )
    );
    process.exit(1);
  } else {
    console.log(
      color(
        '✅ All 5 Harness Engineering Gates PASSED! State persisted in .mate/harness-state.json.\n',
        COLORS.brightGreen,
        COLORS.bold
      )
    );
  }
}

function handleAudit(flags) {
  const targetDir = flags.dir || flags.positional[1] || '.';
  const result = auditTestSuite(targetDir);

  const gradeColor =
    result.grade === 'A'
      ? COLORS.brightGreen
      : result.grade === 'B' || result.grade === 'C'
      ? COLORS.yellow
      : COLORS.red;

  console.log(color(`\n🧹 M.A.T.E. Test Codebase Health Audit: ${result.targetDir}`, COLORS.bold, COLORS.cyan));
  console.log(`   Files Scanned: ${result.filesScanned}`);
  console.log(
    `   Health Score:  ${color(`${result.grade} (${result.score}/100)`, gradeColor, COLORS.bold)}\n`
  );

  if (result.findings.length === 0) {
    console.log(
      color(
        '✅ Zero M.A.T.E. anti-patterns detected! Suite adheres to SOLID/DIP and zero-sleep rules.\n',
        COLORS.brightGreen,
        COLORS.bold
      )
    );
    if (flags.gc) handleGc(flags);
    return;
  }

  console.log(color(`⚠️  Detected ${result.findings.length} M.A.T.E. Anti-Pattern(s):`, COLORS.yellow, COLORS.bold));
  for (const f of result.findings) {
    const sevColor = f.severity === 'CRITICAL' ? COLORS.red : COLORS.yellow;
    console.log(
      `  • ${color(`[${f.code} | ${f.severity}]`, sevColor, COLORS.bold)} ${f.file}:${f.line} — ${f.name}`
    );
    console.log(`    ${color(`Code: ${f.snippet}`, COLORS.gray)}`);
    console.log(`    ${color(`Fix:  ${f.remediation}`, COLORS.cyan)}`);
    if (f.formatted) {
      console.log(color(f.formatted.split('\n').map((l) => `    ${l}`).join('\n'), COLORS.yellow));
    }
  }
  console.log('');

  if (flags.gc) {
    handleGc(flags);
  }

  if (result.findings.some((f) => f.severity === 'CRITICAL')) {
    console.error(
      color(
        '❌ Critical M.A.T.E. anti-patterns (arbitrary sleeps, backward layer imports, or .only locks) detected!',
        COLORS.red,
        COLORS.bold
      )
    );
    process.exit(1);
  }
}

function handleGc(flags) {
  const targetDir = flags.dir || flags.positional[1] || '.';
  const gc = runGarbageCollection(targetDir);

  if (flags.json) {
    console.log(JSON.stringify(gc, null, 2));
    if (!gc.passed) process.exit(1);
    return;
  }

  console.log(color(`\n🧹 M.A.T.E. Continuous Entropy & Doc-Gardening GC: ${gc.targetDir}`, COLORS.bold, COLORS.cyan));
  console.log(`   Quality Grade: ${gc.grade} (${gc.score}/100)`);
  console.log(`   Scorecard:     ${gc.scorecardPath}`);
  console.log(`   Debt Tracker:  ${gc.trackerPath}`);
  console.log(`   Findings:      ${gc.findings.length}\n`);
  for (const f of gc.findings) {
    const sevColor = f.severity === 'ERROR' ? COLORS.red : COLORS.yellow;
    console.log(`  • ${color(`[${f.code} | ${f.severity}]`, sevColor, COLORS.bold)} ${f.message}`);
    console.log(`    ${color(`Remediation: ${f.remediation}`, COLORS.cyan)}`);
  }
  console.log('');
  if (!gc.passed) process.exit(1);
}

function handleStrategy(flags) {
  const projectName = flags.positional[1] || '';
  const dest = generateTestStrategy(projectName, flags.dir || '.');
  console.log(color(`\n♟️  Created Master Test Strategy & Risk Matrix:`, COLORS.brightGreen, COLORS.bold));
  console.log(`   ${dest}\n`);
}

function handlePlan(flags) {
  const scopeName = flags.positional[1];
  if (!scopeName) {
    console.error(color('❌ Usage: npx mate-sdt plan <release-or-sprint-name>', COLORS.red, COLORS.bold));
    process.exit(1);
  }
  const dest = generateTestPlan(scopeName, flags.dir || '.');
  console.log(color(`\n📅 Created M.A.T.E. Release / Sprint Test Plan:`, COLORS.brightGreen, COLORS.bold));
  console.log(`   ${dest}\n`);
}

function handleCases(flags) {
  const moduleName = flags.positional[1];
  if (!moduleName) {
    console.error(color('❌ Usage: npx mate-sdt cases <module-name>', COLORS.red, COLORS.bold));
    process.exit(1);
  }
  const { mdDest, csvDest } = generateTestCases(moduleName, flags.dir || '.');
  console.log(color(`\n📋 Created 4-Quadrant M.A.T.E. Test Case Matrix (.md & .csv):`, COLORS.brightGreen, COLORS.bold));
  console.log(`   • Markdown Matrix: ${mdDest}`);
  console.log(`   • CSV Export:      ${csvDest}\n`);
}

function handleSetupAi(flags) {
  const targetDir = flags.dir || flags.positional[1] || '.';
  const res = setupAiQualityPack(targetDir);
  console.log(
    color(
      `\n🤖 Installed M.A.T.E. AI Quality Pack (Promptfoo + DeepEval + OTel Observability) in: ${res.targetDir}`,
      COLORS.brightGreen,
      COLORS.bold
    )
  );
  for (const item of res.created) {
    console.log(`   ${color('✔', COLORS.brightGreen)} ${item}`);
  }
  console.log('');
}

function handleDataset(flags) {
  const moduleName = flags.positional[1] || 'agent';
  const { discoveryDest, jsonDest } = generateAiDataset(moduleName, flags.dir || '.');
  console.log(
    color(
      `\n🧬 Created M.A.T.E. AI Dataset Discovery Sheet & Golden Dataset (Promptfoo + DeepEval):`,
      COLORS.brightGreen,
      COLORS.bold
    )
  );
  console.log(`   • 5-Dimension Discovery & 5-Seed Gate: ${discoveryDest}`);
  console.log(`   • Golden & Adversarial Dataset JSON:   ${jsonDest}\n`);
}

function handleCharter(flags) {
  const moduleName = flags.positional[1];
  if (!moduleName) {
    console.error(color('❌ Usage: npx mate-sdt charter <module-name>', COLORS.red, COLORS.bold));
    process.exit(1);
  }
  const dest = generateCharter(moduleName, flags.dir || '.');
  console.log(color(`\n🧭 Created Exploratory Testing Charter (SBTM):`, COLORS.brightGreen, COLORS.bold));
  console.log(`   ${dest}\n`);
}

function handleBug(flags) {
  const moduleName = flags.positional[1];
  if (!moduleName) {
    console.error(color('❌ Usage: npx mate-sdt bug <module-name>', COLORS.red, COLORS.bold));
    process.exit(1);
  }
  const dest = generateBugReport(moduleName, flags.dir || '.');
  console.log(color(`\n🐛 Created Spec-Linked M.A.T.E. Bug Report:`, COLORS.brightGreen, COLORS.bold));
  console.log(`   ${dest}\n`);
}

function handleWaiver(flags) {
  const moduleName = flags.positional[1];
  if (!moduleName) {
    console.error(color('❌ Usage: npx mate-sdt waiver <module-name>', COLORS.red, COLORS.bold));
    process.exit(1);
  }
  const dest = generateWaiver(moduleName, flags.dir || '.');
  console.log(color(`\n📜 Created Formal Release Waiver:`, COLORS.brightGreen, COLORS.bold));
  console.log(`   ${dest}\n`);
}

function handleStatus(flags) {
  printBanner(pkg.version);
  const targetDir = flags.dir || flags.positional[1] || '.';
  const status = checkStatus(targetDir);

  console.log(color(`📊 M.A.T.E. Governance Status for: ${status.targetDir}\n`, COLORS.bold, COLORS.cyan));
  const checkMark = (ok) => (ok ? color('✔ PRESENT', COLORS.brightGreen) : color('✘ MISSING', COLORS.yellow));

  console.log(`  • Living Architecture Map (MATE-PROJECT-MAP.md): ${checkMark(status.hasProjectMap)}`);
  console.log(`  • Specifications Directory (specs/):             ${checkMark(status.hasSpecsDir)}`);
  console.log(`  • Stryker Mutation Config (stryker.config.json): ${checkMark(status.hasStrykerConfig)}`);
  console.log(`  • Antigravity Skills (.agents/skills/mate-*):    ${checkMark(status.hasAntigravitySkills)}`);
  console.log(`  • Claude Code Skills/Commands (.claude/):        ${checkMark(status.hasClaudeCommands)}`);
  console.log(`  • Cursor Rules (.cursor/rules/):                 ${checkMark(status.hasCursorRules)}`);
  console.log(`  • Windsurf Rules (.windsurf/rules/):             ${checkMark(status.hasWindsurfRules)}`);
  console.log(`  • GitHub Copilot (.github/copilot-instructions): ${checkMark(status.hasCopilotInstructions)}`);
  console.log(`  • Universal Agents Standard (AGENTS.md):         ${checkMark(status.hasAgentsMd)}`);
  console.log(
    `  • Test Suite Health Score (npx mate-sdt audit):  ${color(
      `${status.auditResult.grade} (${status.auditResult.score}/100 across ${status.auditResult.filesScanned} files)`,
      COLORS.brightGreen,
      COLORS.bold
    )}`
  );
  console.log(
    `  • Rootless Podman Engine:                        ${
      status.podmanAvailable
        ? color(`✔ ${status.podmanVersion}`, COLORS.brightGreen)
        : color('✘ Not detected in PATH', COLORS.yellow)
    }`
  );
  console.log(
    `  • Playwright CLI (@playwright/cli):              ${
      status.playwrightCliAvailable
        ? color(`✔ ${status.playwrightCliVersion}`, COLORS.brightGreen)
        : color('✘ Not installed (run: npx mate-sdt setup-playwright)', COLORS.yellow)
    }`
  );

  const specCount = status.specValidation.results.length;
  console.log(`\n  📋 Specifications Validated: ${specCount}`);
  for (const res of status.specValidation.results) {
    const rel = path.relative(status.targetDir, res.filePath);
    console.log(
      `     ${res.valid ? color('✅', COLORS.brightGreen) : color('❌', COLORS.red)} ${rel}`
    );
  }
  console.log('');
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));

  if (flags.version) {
    console.log(pkg.version);
    return;
  }

  const command = (flags.positional[0] || 'install').toLowerCase();

  if (flags.help || command === 'help') {
    printHelp();
    return;
  }

  switch (command) {
    case 'install':
      await handleInstall(flags);
      break;
    case 'init':
      handleInit(flags);
      break;
    case 'setup-playwright':
    case 'playwright': {
      const ok = installPlaywrightCliPackages(flags.dir || flags.positional[1] || '.');
      process.exit(ok ? 0 : 1);
      break;
    }
    case 'setup-ai':
    case 'setup-ai-evals':
    case 'ai':
      handleSetupAi(flags);
      break;
    case 'dataset':
    case 'ai-dataset':
      handleDataset(flags);
      break;
    case 'validate':
    case 'lint':
      handleValidate(flags);
      break;
    case 'context':
      handleContext(flags);
      break;
    case 'session':
    case 'sessions':
      handleSession(flags);
      break;
    case 'gate':
    case 'verify':
    case 'harness':
      handleGate(flags);
      break;
    case 'audit':
      handleAudit(flags);
      break;
    case 'gc':
    case 'garbage-collect':
      handleGc(flags);
      break;
    case 'mutate':
      process.exit(runPodmanMutation(flags.dir || flags.positional[1] || '.', flags.config));
      break;
    case 'k6':
      process.exit(runPodmanK6(flags.positional[1] || 'tests/nfr/order-load.k6.js', flags.dir || '.'));
      break;
    case 'strategy':
      handleStrategy(flags);
      break;
    case 'plan':
    case 'testplan':
      handlePlan(flags);
      break;
    case 'cases':
    case 'testcases':
    case 'tc':
      handleCases(flags);
      break;
    case 'charter':
      handleCharter(flags);
      break;
    case 'bug':
      handleBug(flags);
      break;
    case 'waiver':
      handleWaiver(flags);
      break;
    case 'status':
    case 'doctor':
      handleStatus(flags);
      break;
    default:
      console.error(color(`\n❌ Unknown command: '${command}'`, COLORS.red, COLORS.bold));
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(color(`\n❌ Fatal error: ${err.message}`, COLORS.red, COLORS.bold));
  process.exit(1);
});
