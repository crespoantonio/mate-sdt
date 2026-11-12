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
    `    ${color('install', COLORS.brightGreen, COLORS.bold)}              Interactive installer (15 AI skills, 7 E2E workflows, IDE rules & SDT layout)`
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
    `    ${color('context [module]', COLORS.brightGreen, COLORS.bold)}     Analyze Context Engineering token budget & build JIT Context Pack`
  );
  console.log(
    `    ${color('gate [dir]', COLORS.brightGreen, COLORS.bold)}           Execute the 5-Gate Harness Engineering Closed Verification Loop`
  );
  console.log(
    `    ${color('cases <module>', COLORS.brightGreen, COLORS.bold)}       Create a 4-Quadrant Test Case Matrix (.md & .csv) in tests/cases/`
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
    `    ${color('bug <module>', COLORS.brightGreen, COLORS.bold)}         Create a Structured Bug Report linked to spec invariants in tests/bugs/`
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
  console.log('    --ide <list>             Target IDEs: antigravity,claude,cursor,windsurf,copilot,all');
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
          console.log(`     • Installed Skills: ${color(`${existing.installedSkillsCount} skills`, COLORS.yellow)} (Framework v${pkg.version} provides 16 core skills)`);
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
              { label: 'Claude Code (.claude/commands + .claude/skills + CLAUDE.md)', value: 'claude' },
              { label: 'Cursor (.cursor/rules/*.mdc)', value: 'cursor' },
              { label: 'Windsurf (.windsurf/rules + .windsurf/workflows)', value: 'windsurf' },
              { label: 'GitHub Copilot (.github/copilot-instructions.md + .github/prompts)', value: 'copilot' },
            ],
            existing.detectedIdes.map((id) => ['antigravity', 'claude', 'cursor', 'windsurf', 'copilot'].indexOf(id)).filter((i) => i >= 0)
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
              label: 'Greenfield (Full SDT Architecture + 16 AI Skills + 7 Workflows + SOLID Templates)',
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
            { label: 'Claude Code (.claude/commands + .claude/skills + CLAUDE.md)', value: 'claude' },
            { label: 'Cursor (.cursor/rules/*.mdc)', value: 'cursor' },
            { label: 'Windsurf (.windsurf/rules + .windsurf/workflows)', value: 'windsurf' },
            { label: 'GitHub Copilot (.github/copilot-instructions.md + .github/prompts)', value: 'copilot' },
          ],
          [0, 1, 2]
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

  console.log(color('\n  🤖 Installed 16 Synergistic AI Skills, 7 E2E Workflows & IDE Rules:', COLORS.bold, COLORS.cyan));
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
  const moduleName = flags.positional[1] || null;
  const targetDir = flags.dir || '.';
  const ctx = analyzeContextEngineering(targetDir, moduleName);

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

  if (ctx.contextPackPath) {
    console.log(
      color(`\n  📦 Generated Just-In-Time (JIT) Context Pack (~${ctx.contextPackTokens} tokens):`, COLORS.brightGreen, COLORS.bold)
    );
    console.log(`     ${ctx.contextPackPath}`);
  }
  console.log('');
}

function handleGate(flags) {
  const targetDir = flags.dir || flags.positional[1] || '.';
  const report = runHarnessGate(targetDir);

  if (flags.json) {
    console.log(JSON.stringify(report, null, 2));
    if (!report.allGatesPassed) process.exit(1);
    return;
  }

  console.log(
    color(
      `\n⚙️  M.A.T.E. Harness Engineering — Closed Verification Loop (${targetDir})\n`,
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
  }
  console.log('');

  if (result.findings.some((f) => f.severity === 'CRITICAL')) {
    console.error(
      color(
        '❌ Critical M.A.T.E. anti-patterns (arbitrary sleeps or .only locks) detected!',
        COLORS.red,
        COLORS.bold
      )
    );
    process.exit(1);
  }
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
  console.log(`  • Claude Code Commands (.claude/commands/):      ${checkMark(status.hasClaudeCommands)}`);
  console.log(`  • Cursor Rules (.cursor/rules/):                 ${checkMark(status.hasCursorRules)}`);
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
    case 'gate':
    case 'verify':
    case 'harness':
      handleGate(flags);
      break;
    case 'audit':
      handleAudit(flags);
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
