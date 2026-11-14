'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validateTarget } = require('./validator');
const { auditTestSuite } = require('./auditor');
const {
  estimateTokens,
  ensureMemoryScaffold,
  compactActiveSessions,
  buildJitContextPack,
  consolidateMemory,
  runContextHygieneChecks,
  listSessions,
  isSessionExpired,
} = require('./memory');

function listFilesWithExt(dirPath, extFilter) {
  if (!fs.existsSync(dirPath)) return [];
  const results = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesWithExt(full, extFilter));
    } else if (!extFilter || entry.name.endsWith(extFilter)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Context Engineering Analyzer & Just-In-Time (JIT) Context Assembler
 * Implements the 4 Context Engineering Operations: Write, Select, Compress, Isolate.
 */
function analyzeContextEngineering(targetDir = '.', moduleName = null, options = {}) {
  const resolved = path.resolve(targetDir);
  const mapPath = path.join(resolved, 'MATE-PROJECT-MAP.md');
  const hasMap = fs.existsSync(mapPath);
  const mapContent = hasMap ? fs.readFileSync(mapPath, 'utf8') : '';
  const mapTokens = estimateTokens(mapContent);

  // Discover repository artifacts to check for Context Drift (unindexed files)
  const specFiles = listFilesWithExt(path.join(resolved, 'specs'), '.mate-spec.md');
  const pageFiles = listFilesWithExt(path.join(resolved, 'src', 'pages'), '.ts').filter(
    (f) => !f.endsWith('base.page.ts')
  );
  const componentFiles = listFilesWithExt(path.join(resolved, 'src', 'components'), '.ts');
  const caseFiles = listFilesWithExt(path.join(resolved, 'docs', 'test-cases'), '.md');
  const bugFiles = [
    ...listFilesWithExt(path.join(resolved, 'docs', 'bugs'), '.md'),
    ...listFilesWithExt(path.join(resolved, 'tests', 'bugs'), '.md'),
  ];

  const unindexedArtifacts = [];
  if (hasMap) {
    for (const f of [...specFiles, ...pageFiles, ...componentFiles]) {
      const base = path.basename(f);
      if (!mapContent.includes(base)) {
        unindexedArtifacts.push(path.relative(resolved, f).replace(/\\/g, '/'));
      }
    }
  }

  // Scan specs for epistemic hygiene tags ([OBSERVED], [INFERRED], [TBD])
  let tbdCount = 0;
  let observedCount = 0;
  let inferredCount = 0;
  let totalSpecTokens = 0;

  for (const sf of specFiles) {
    const content = fs.readFileSync(sf, 'utf8');
    totalSpecTokens += estimateTokens(content);
    tbdCount += (content.match(/\[TBD/gi) || []).length;
    observedCount += (content.match(/\[OBSERVED\]/gi) || []).length;
    inferredCount += (content.match(/\[INFERRED\]/gi) || []).length;
  }

  const tier1TokenBudget = 3000;
  const tier1Healthy = hasMap && mapTokens <= tier1TokenBudget;

  // Optional: Session compaction, self-editing memory consolidation, and 3-Bucket / 7-Layer JIT Context Pack
  let compactionResult = null;
  let consolidationResult = null;
  let contextPackPath = null;
  let contextPackTokens = 0;
  let packMeta = null;

  if (options.compact) {
    compactionResult = compactActiveSessions(resolved);
  }

  if (options.consolidate) {
    consolidationResult = consolidateMemory(resolved, moduleName || 'global', {
      facts: options.facts || [],
      dryRun: Boolean(options.dryRun),
    });
  }

  if (moduleName && (!options.consolidate || !options.dryRun)) {
    const safeMod = moduleName.toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
    const mateDir = path.join(resolved, '.mate');
    fs.mkdirSync(mateDir, { recursive: true });
    contextPackPath = path.join(mateDir, `context-pack-${safeMod}.md`);
    const built = buildJitContextPack(resolved, moduleName, {
      phase: options.phase,
      task: options.task,
      flow: options.flow,
    });
    fs.writeFileSync(contextPackPath, built.markdown, 'utf8');
    contextPackTokens = built.tokens;
    packMeta = {
      bucketStats: built.bucketTokens,
      phase: built.phase,
    };
  }

  const sessions = listSessions(resolved);
  const expiredSessionCount = sessions.filter((s) => isSessionExpired(s)).length;
  const activeSessionCount = sessions.length - expiredSessionCount;
  const hygiene = runContextHygieneChecks(resolved);

  return {
    targetDir: resolved,
    hasMap,
    mapTokens,
    tier1TokenBudget,
    tier1Healthy,
    totalSpecTokens,
    specCount: specFiles.length,
    pageObjectCount: pageFiles.length,
    componentCount: componentFiles.length,
    unindexedArtifacts,
    epistemicStats: {
      observedCount,
      inferredCount,
      tbdCount,
    },
    contextPackPath,
    contextPackTokens,
    packMeta,
    compactionResult,
    consolidationResult,
    activeSessionCount,
    expiredSessionCount,
    hygiene,
  };
}

/**
 * Harness Engineering Closed-Loop Verification Gate (`npx mate-sdt gate`)
 * Formula: Agent = Model + Harness
 * Enforces deterministic verification loops, anti-greenwashing guardrails, and state persistence.
 */
function runHarnessGate(targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const gates = [];
  const selfCorrectionPrompts = [];

  // Gate 1: Context Engineering, Living Map Budget & Context Hygiene (Poisoning/Distraction/Confusion/Clash)
  const ctx = analyzeContextEngineering(resolved);
  const hygiene = ctx.hygiene || runContextHygieneChecks(resolved);
  const hygieneErrors = hygiene.errors || (hygiene.issues || []).filter((i) => i.severity === 'error');
  const hygieneWarnings = hygiene.warnings || (hygiene.issues || []).filter((i) => i.severity === 'warn');
  const hygienePassed = hygieneErrors.length === 0;
  const gate1Passed = Boolean(ctx.hasMap && ctx.tier1Healthy && hygienePassed);
  gates.push({
    id: 'GATE-01-CONTEXT',
    name: 'Context Engineering, Living Map Budget (< 3,000 tokens) & Hygiene',
    passed: gate1Passed,
    details: !ctx.hasMap
      ? 'MATE-PROJECT-MAP.md is missing.'
      : `MATE-PROJECT-MAP.md uses ~${ctx.mapTokens} tokens (${ctx.unindexedArtifacts.length} unindexed artifact(s), ${hygieneErrors.length} hygiene error(s), ${hygieneWarnings.length} warning(s)).`,
  });
  if (!ctx.hasMap) {
    selfCorrectionPrompts.push(
      '[SELF-CORRECTION GATE-01]: Run `npx mate-sdt init` or create `MATE-PROJECT-MAP.md` before proceeding.'
    );
  } else if (!ctx.tier1Healthy) {
    selfCorrectionPrompts.push(
      `[SELF-CORRECTION GATE-01]: Compress \`MATE-PROJECT-MAP.md\` (~${ctx.mapTokens} tokens exceeds the 3,000-token Tier-1 RAM budget). Keep only index tables and move prose to \`docs/\` or \`specs/\`.`
    );
  }
  for (const issue of hygieneErrors) {
    selfCorrectionPrompts.push(
      `[SELF-CORRECTION GATE-01/${issue.code}]: ${issue.message}${issue.file ? ` (${issue.file})` : ''}`
    );
  }
  if (ctx.unindexedArtifacts.length > 0) {
    selfCorrectionPrompts.push(
      `[CONTEXT DRIFT WARNING]: Register these artifacts in \`MATE-PROJECT-MAP.md\` to prevent duplicate codegen: ${ctx.unindexedArtifacts.join(', ')}`
    );
  }

  // Gate 2: Pillar M Specification Determinism
  const specsDir = path.join(resolved, 'specs');
  let specRes = { allValid: true, results: [] };
  if (fs.existsSync(specsDir)) {
    specRes = validateTarget(specsDir);
    if (
      specRes.results.length === 1 &&
      specRes.results[0].errors[0]?.startsWith('No *.mate-spec.md files found')
    ) {
      specRes = { allValid: true, results: [] };
    }
  }
  gates.push({
    id: 'GATE-02-SPEC-MODEL',
    name: 'Pillar M Specification Determinism & Forbidden Transitions',
    passed: specRes.allValid,
    details: `${specRes.results.filter((r) => r.valid).length}/${specRes.results.length} spec(s) valid.`,
  });
  if (!specRes.allValid) {
    for (const r of specRes.results.filter((x) => !x.valid)) {
      if (Array.isArray(r.remediations) && r.remediations.length > 0) {
        selfCorrectionPrompts.push(...r.remediations);
      } else {
        selfCorrectionPrompts.push(
          `[SELF-CORRECTION][GATE-02][SPEC_VIOLATION] File: ${path.relative(resolved, r.filePath)}\nViolation: ${r.errors.join('; ')}\nRemediation: Follow templates/TEMPLATE_MATE_SPEC.md.`
        );
      }
    }
  }

  // Gate 3: Anti-Greenwashing & Known-Bug Traceability Guardrail
  const specTestFiles = listFilesWithExt(path.join(resolved, 'tests'), '.spec.ts');
  const allTestCode = specTestFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const hasTestFailAnnotations = /test\.(fail|fixme)\s*\(/.test(allTestCode);
  const bugReports = [
    ...listFilesWithExt(path.join(resolved, 'docs', 'bugs'), '.md'),
    ...listFilesWithExt(path.join(resolved, 'tests', 'bugs'), '.md'),
  ];
  const bugReportNamesAndText = bugReports
    .map((f) => `${path.basename(f)}\n${fs.readFileSync(f, 'utf8')}`)
    .join('\n');

  let greenwashingViolation = false;
  let greenwashingDetail = 'Anti-Greenwashing traceability intact.';
  if (hasTestFailAnnotations && bugReports.length === 0) {
    greenwashingViolation = true;
    greenwashingDetail =
      'Found `test.fail()` / `test.fixme()` in test specs without a corresponding Bug Report in `docs/bugs/BUG-*.md` or `tests/bugs/BUG-*.md`.';
    selfCorrectionPrompts.push(
      '[SELF-CORRECTION][GATE-03][ANTI_GREENWASHING]: Every `test.fail()` / `test.fixme()` annotation must have a corresponding spec-linked Bug Report. Run `npx mate-sdt bug <module>`.'
    );
  } else if (hasTestFailAnnotations) {
    const referencedBugs = [...new Set((allTestCode.match(/test\.(?:fail|fixme)\s*\([^)]*(BUG-[A-Za-z0-9-]+)/g) || []).map((m) => m.match(/BUG-[A-Za-z0-9-]+/)[0]))];
    const missingBugs = referencedBugs.filter((id) => !bugReportNamesAndText.includes(id));
    if (missingBugs.length > 0) {
      greenwashingViolation = true;
      greenwashingDetail = `Missing Bug Report file(s) for quarantined test annotation(s): ${missingBugs.join(', ')}.`;
      selfCorrectionPrompts.push(
        `[SELF-CORRECTION][GATE-03][MISSING_BUG_REPORT]: Create formal Bug Report(s) for ${missingBugs.join(', ')} via \`npx mate-sdt bug <module>\`.`
      );
    }
  }

  // Detect assertion weakening during an active heal session
  const mateDirPath = path.join(resolved, '.mate');
  const hasActiveHealScratchpad =
    fs.existsSync(mateDirPath) &&
    fs.readdirSync(mateDirPath).some((f) => f.startsWith('scratchpad-heal-'));
  if (hasActiveHealScratchpad) {
    const weakenedMatch = allTestCode.match(/expect\s*\([^)]+\)\s*\.(?:toBeDefined|toBeTruthy)\s*\(\s*\)/);
    if (weakenedMatch) {
      greenwashingViolation = true;
      greenwashingDetail = `Detected trivial/weakened assertion \`${weakenedMatch[0]}\` during active heal session.`;
      selfCorrectionPrompts.push(
        '[SELF-CORRECTION][GATE-03][WEAKENED_ASSERTION]: Never weaken assertions to `toBeDefined()`/`toBeTruthy()` during self-healing. Assert concrete <invariants> or quarantine with `test.fail(true, "BUG-XXX")`.'
      );
    }
  }

  gates.push({
    id: 'GATE-03-ANTI-GREENWASHING',
    name: 'Anti-Greenwashing & Defect Traceability Guardrail',
    passed: !greenwashingViolation,
    details: greenwashingDetail,
  });

  // Gate 4: Pillar A Forward-Only Layered Architecture & Zero-Sleep AST/Regex Guardrail
  const audit = auditTestSuite(resolved);
  const hasCriticalAntiPatterns = audit.findings.some((f) => f.severity === 'CRITICAL');
  const gate4Passed = !hasCriticalAntiPatterns && audit.score >= 80;
  gates.push({
    id: 'GATE-04-SOLID-AUDIT',
    name: 'Pillar A Forward-Only Layers, SOLID & Zero-Sleep Guardrail (Grade A/B)',
    passed: gate4Passed,
    details: `Health Score: ${audit.grade} (${audit.score}/100) across ${audit.filesScanned} file(s), ${audit.findings.length} finding(s).`,
  });
  if (!gate4Passed) {
    for (const f of audit.findings) {
      selfCorrectionPrompts.push(
        f.formatted ||
          `[SELF-CORRECTION][GATE-04][${f.code}] File: ${f.file}:${f.line}\nViolation: ${f.name}\nRemediation: ${f.remediation}`
      );
    }
  }

  const allPassed = gates.every((g) => g.passed);

  // Gate 5: State Persistence (.mate/harness-state.json)
  const mateStateDir = path.join(resolved, '.mate');
  fs.mkdirSync(mateStateDir, { recursive: true });
  const stateFilePath = path.join(mateStateDir, 'harness-state.json');
  const statePayload = {
    timestamp: new Date().toISOString(),
    allGatesPassed: allPassed,
    healthGrade: audit.grade,
    healthScore: audit.score,
    contextStats: {
      mapTokens: ctx.mapTokens,
      specCount: ctx.specCount,
      unindexedCount: ctx.unindexedArtifacts.length,
      epistemicStats: ctx.epistemicStats,
      hygienePassed,
      hygieneErrorCount: hygieneErrors.length,
      hygieneWarningCount: hygieneWarnings.length,
      activeSessions: ctx.activeSessionCount,
      expiredSessions: ctx.expiredSessionCount,
    },
    gates,
    selfCorrectionPrompts,
  };
  fs.writeFileSync(stateFilePath, `${JSON.stringify(statePayload, null, 2)}\n`, 'utf8');

  return statePayload;
}

/**
 * Closed-Loop Verification Harness ("Ralph Wiggum Loop" — `npx mate-sdt gate --loop`)
 * Runs up to maxIterations (default 5), persisting compact [SELF-CORRECTION] payloads into .mate/harness-state.json.
 */
function runHarnessLoop(targetDir = '.', options = {}) {
  const resolved = path.resolve(targetDir);
  const maxIterations = Math.max(1, Math.min(10, Number(options.maxIterations) || 5));
  const history = [];
  let finalReport = null;

  for (let i = 1; i <= maxIterations; i++) {
    finalReport = runHarnessGate(resolved);
    history.push({
      iteration: i,
      allGatesPassed: finalReport.allGatesPassed,
      healthGrade: finalReport.healthGrade,
      healthScore: finalReport.healthScore,
      promptCount: finalReport.selfCorrectionPrompts.length,
    });
    if (finalReport.allGatesPassed) {
      break;
    }
    if (typeof options.onIteration === 'function') {
      options.onIteration(i, finalReport);
    } else if (i === 1 && !options.forceAllIterations) {
      // Without an external fixer callback, run one deterministic pass to emit .mate/harness-state.json cleanly
      // unless caller explicitly requests full iteration ticks.
      break;
    }
  }

  const stateFilePath = path.join(resolved, '.mate', 'harness-state.json');
  const loopPayload = {
    ...finalReport,
    loop: {
      mode: 'closed-loop',
      maxIterations,
      iterationsExecuted: history.length,
      converged: Boolean(finalReport && finalReport.allGatesPassed),
      history,
    },
  };
  fs.writeFileSync(stateFilePath, `${JSON.stringify(loopPayload, null, 2)}\n`, 'utf8');
  return loopPayload;
}

module.exports = {
  estimateTokens,
  analyzeContextEngineering,
  runHarnessGate,
  runHarnessLoop,
};
