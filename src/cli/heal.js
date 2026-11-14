'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  estimateTokens,
  extractXmlBlock,
  startSession,
  recordEvent,
  advanceStage,
  consolidateMemory,
  ensureMemoryScaffold,
} = require('./memory');
const { runHarnessLoop } = require('./harness');
const { runGarbageCollection } = require('./gc');

const MAX_DIGEST_TOKENS = 400;
const ANSI_REGEX = /\x1B\[[0-9;]*[A-Za-z]/g;

const DECISION_MATRIX = [
  {
    class: 'UI_LOCATOR_DRIFT',
    evidence: 'Live @playwright/cli YAML ARIA snapshot (<= 800 tokens) proves flow & <invariants> work, but selector/role changed.',
    action: 'AUTO-HEAL LOCATOR in src/pages/ or src/components/ (never in .spec.ts), then run `npx mate-sdt context <module> --consolidate`.',
  },
  {
    class: 'SYNC_OR_FLAKY_RACE',
    evidence: 'mate-pw-forensics trace/network inspection reveals unawaited network response, hydration delay, or animation race.',
    action: 'AUTO-HEAL SYNCHRONIZATION with event/web-first assertions (expect(locator).toBeVisible(), waitForResponse). Zero waitForTimeout/sleep.',
  },
  {
    class: 'HARNESS_OR_TYPING_DRIFT',
    evidence: 'Broken DIP fixture in src/fixtures/, outdated mock in src/mocks/, TS mismatch in src/models/, or Podman/env flag error.',
    action: 'AUTO-HEAL HARNESS/TYPES preserving Forward-Only 6-Layer imports (GATE-04).',
  },
  {
    class: 'SPEC_EVOLUTION_DRIFT',
    evidence: 'Live recon shows product UX or API contract intentionally evolved, making specs/<module>.mate-spec.md outdated.',
    action: 'HALT & CONFIRM WITH HUMAN: Present live vs. spec diff; after approval, update spec first (GATE-02), then Page Object/test.',
  },
  {
    class: 'REAL_PRODUCT_BUG',
    evidence: 'Live app/API violates an <invariants> rule (INV-XX), returns unhandled 500, or allows a Forbidden Transition.',
    action: 'STRICT QUARANTINE (NEVER HEAL ASSERTION): Keep true assertion, mark `test.fail(true, "BUG-XXX")`, run `npx mate-sdt bug <module>`.',
  },
];

function stripAnsi(text) {
  return String(text || '').replace(ANSI_REGEX, '');
}

function classifyFailureSignature(cleanLog) {
  if (/strict mode violation|resolved to \d+ elements/i.test(cleanLog)) return 'STRICT_MODE_VIOLATION';
  if (/TimeoutError|Timed out \d+ms|waiting for locator|waiting for selector/i.test(cleanLog)) return 'LOCATOR_TIMEOUT';
  if (/HTTP\s+[45]\d{2}\b|status\s+(?:code\s+)?[45]\d{2}\b|ECONNREFUSED|schema mismatch/i.test(cleanLog)) return 'HTTP_CONTRACT_ERROR';
  if (/TS\d{4}|TypeError:|Cannot find module|fixture|is not a function/i.test(cleanLog)) return 'DIP_FIXTURE_OR_TYPE_ERROR';
  if (/podman|stryker|k6|EACCES|ENOENT|container/i.test(cleanLog)) return 'CONTAINER_OR_INFRA_ERROR';
  if (/expect\(.*\)\.|AssertionError|Expected:|Received:/i.test(cleanLog)) return 'ASSERTION_MISMATCH';
  return 'ASSERTION_MISMATCH';
}

function mapLayerLabel(relPath) {
  const norm = relPath.replace(/\\/g, '/').toLowerCase();
  if (norm.includes('tests/')) return 'L5:tests';
  if (norm.includes('src/fixtures/')) return 'L4:fixtures';
  if (norm.includes('src/pages/')) return 'L3:pages';
  if (norm.includes('src/components/')) return 'L2:components';
  if (norm.includes('src/api/')) return 'L2:api';
  if (norm.includes('src/models/')) return 'L1:models';
  return 'project';
}

/**
 * Compresses noisy stack traces / CI logs into a structured <error_digest> (<= 400 tokens).
 */
function compressErrorTrace(rawLog, resolvedRoot = process.cwd()) {
  const clean = stripAnsi(rawLog);
  const lines = clean.split(/\r?\n/);
  const failureSignature = classifyFailureSignature(clean);

  const callChain = [];
  const seenFrames = new Set();
  const frameRe = /([A-Za-z0-9_./\\:-]+\.(?:spec\.ts|spec\.js|test\.ts|test\.js|page\.ts|component\.ts|ts|js)):(\d+)(?::(\d+))?/g;

  for (const line of lines) {
    if (/node_modules|node:internal|playwright-core\/lib/i.test(line)) continue;
    let m;
    while ((m = frameRe.exec(line)) !== null) {
      const rawFile = m[1];
      const lineNum = Number(m[2]);
      const absOrRel = path.isAbsolute(rawFile)
        ? path.relative(resolvedRoot, rawFile).replace(/\\/g, '/')
        : rawFile.replace(/\\/g, '/');
      if (absOrRel.startsWith('..') || absOrRel.includes('node_modules')) continue;
      const key = `${absOrRel}:${lineNum}`;
      if (!seenFrames.has(key)) {
        seenFrames.add(key);
        callChain.push({
          file: absOrRel,
          line: lineNum,
          layer: mapLayerLabel(absOrRel),
        });
      }
    }
  }

  const deltaLines = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^(Error:|TimeoutError:|AssertionError|Expected:|Received:|Locator:|waiting for locator|strict mode violation)/i.test(t)) {
      deltaLines.push(t);
    }
  }
  const deltaRaw = (deltaLines.length > 0 ? deltaLines : lines.filter((l) => l.trim()).slice(0, 6)).join('\n');

  let digestObj = {
    failure_signature: failureSignature,
    call_chain: callChain.slice(0, 8),
    delta: deltaRaw.slice(0, 900),
  };

  let xml = formatErrorDigestXml(digestObj);
  while (estimateTokens(xml) > MAX_DIGEST_TOKENS && digestObj.delta.length > 120) {
    digestObj = {
      ...digestObj,
      delta: `${digestObj.delta.slice(0, Math.floor(digestObj.delta.length * 0.7))}...`,
    };
    xml = formatErrorDigestXml(digestObj);
  }

  return {
    ...digestObj,
    xml,
    tokens: estimateTokens(xml),
  };
}

function formatErrorDigestXml(digest) {
  const chainLines = digest.call_chain.length
    ? digest.call_chain.map((f) => `  - [${f.layer}] ${f.file}:${f.line}`).join('\n')
    : '  - [unknown] (no project stack frame matched)';
  return [
    '<error_digest>',
    `failure_signature: ${digest.failure_signature}`,
    'call_chain:',
    chainLines,
    'delta: |',
    ...digest.delta.split(/\r?\n/).map((l) => `  ${l}`),
    '</error_digest>',
  ].join('\n');
}

function inferModuleName(target, digest) {
  const candidates = [
    ...(digest.call_chain || []).map((c) => c.file),
    target && !String(target).startsWith('--') ? target : null,
  ].filter(Boolean);

  for (const c of candidates) {
    const base = path.basename(String(c))
      .replace(/\.(spec|test|page|component|api|model|mate-spec)\.(ts|js|md)$/i, '')
      .replace(/\.(ts|js|md|log|txt)$/i, '');
    if (base && base !== 'last' && !base.startsWith('error')) {
      return base.toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
    }
  }
  return 'global';
}

function findMatchingSpec(resolvedRoot, moduleName) {
  const specsDir = path.join(resolvedRoot, 'specs');
  if (!fs.existsSync(specsDir)) return null;
  const specs = fs.readdirSync(specsDir).filter((f) => f.endsWith('.mate-spec.md'));
  const direct = specs.find((f) => f.toLowerCase().includes(moduleName.toLowerCase()));
  if (direct) return path.join(specsDir, direct);
  const nonTemplate = specs.find((f) => !f.toLowerCase().includes('template'));
  return nonTemplate ? path.join(specsDir, nonTemplate) : null;
}

function selectSurgicalContext(resolvedRoot, moduleName, digest) {
  const snippets = [];
  for (const frame of (digest.call_chain || []).slice(0, 3)) {
    const full = path.resolve(resolvedRoot, frame.file);
    if (fs.existsSync(full)) {
      const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
      const start = Math.max(0, frame.line - 26);
      const end = Math.min(lines.length, frame.line + 25);
      snippets.push({
        file: frame.file,
        startLine: start + 1,
        endLine: end,
        code: lines.slice(start, end).map((l, idx) => `${start + idx + 1}: ${l}`).join('\n'),
      });
    }
  }

  const specPath = findMatchingSpec(resolvedRoot, moduleName);
  let specIntent = '';
  let specInvariants = '';
  if (specPath && fs.existsSync(specPath)) {
    const specText = fs.readFileSync(specPath, 'utf8');
    specIntent = extractXmlBlock(specText, 'intent_model') || '';
    specInvariants = extractXmlBlock(specText, 'invariants') || '';
  }

  const playbooksPath = path.join(resolvedRoot, '.mate', 'memory', 'procedural-playbooks.md');
  const playbooks = fs.existsSync(playbooksPath)
    ? fs.readFileSync(playbooksPath, 'utf8').slice(0, 1200)
    : '';

  return {
    moduleName,
    specPath: specPath ? path.relative(resolvedRoot, specPath).replace(/\\/g, '/') : null,
    specIntent,
    specInvariants,
    snippets,
    playbooks,
  };
}

function resolveRawTrace(resolvedRoot, targetArg, options = {}) {
  if (options.trace) return String(options.trace);

  if (options.last || targetArg === '--last') {
    const mateDir = path.join(resolvedRoot, '.mate');
    if (fs.existsSync(mateDir)) {
      const logs = fs.readdirSync(mateDir)
        .filter((f) => f.endsWith('.log') || f.startsWith('scratchpad-heal-'))
        .map((f) => path.join(mateDir, f));
      if (logs.length > 0) return fs.readFileSync(logs[0], 'utf8');
    }
    const testResultsDir = path.join(resolvedRoot, 'test-results');
    if (fs.existsSync(testResultsDir)) {
      const errFiles = [];
      const walk = (d) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          const full = path.join(d, e.name);
          if (e.isDirectory()) walk(full);
          else if (/error|trace|stderr/i.test(e.name) && /\.(txt|log|md)$/i.test(e.name)) errFiles.push(full);
        }
      };
      walk(testResultsDir);
      if (errFiles.length > 0) return fs.readFileSync(errFiles[0], 'utf8');
    }
    return 'TimeoutError: No recent error log found in .mate/ or test-results/. Pass a log file or spec path.';
  }

  if (targetArg) {
    const full = path.resolve(resolvedRoot, targetArg);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      const content = fs.readFileSync(full, 'utf8');
      if (/\.(log|txt)$/i.test(full)) return content;
      // Failing spec file passed directly: synthesize anchor frame for surgical context
      return `AssertionError in ${path.relative(resolvedRoot, full).replace(/\\/g, '/')}:1\n${content.slice(0, 500)}`;
    }
    return String(targetArg);
  }

  return 'AssertionError: No target provided. Pass <spec-or-log-path> or --last.';
}

/**
 * Executes `npx mate-sdt heal [target]` (Ingest -> Compress -> Select -> Write Scratchpad -> Optional Verify/Consolidate).
 */
function runHeal(targetDir = '.', targetArg = null, options = {}) {
  const resolved = path.resolve(targetDir || '.');
  const rawTrace = resolveRawTrace(resolved, targetArg, options);
  const digest = compressErrorTrace(rawTrace, resolved);
  const moduleName = options.module || inferModuleName(targetArg, digest);
  const surgical = selectSurgicalContext(resolved, moduleName, digest);

  const mateDir = path.join(resolved, '.mate');
  fs.mkdirSync(mateDir, { recursive: true });
  const scratchpadPath = path.join(mateDir, `scratchpad-heal-${moduleName}.md`);

  let attempt = 1;
  if (fs.existsSync(scratchpadPath)) {
    const prev = fs.readFileSync(scratchpadPath, 'utf8');
    const m = prev.match(/attempt:\s*(\d+)\/3/i);
    if (m) attempt = Math.min(3, Number(m[1]) + 1);
  }

  const forensicCommands = [
    'npx playwright-cli open <target-url>',
    'npx playwright-cli snapshot',
    'npx playwright-cli network',
  ];

  const scratchpadContent = [
    `# M.A.T.E. Spec-Guarded Healing Scratchpad: ${moduleName}`,
    `> Updated: ${new Date().toISOString()} | attempt: ${attempt}/3 | Flow: 3-Stage Black-Box Triage`,
    '',
    '## 1. Compressed Crash Digest (<= 400 tokens)',
    '```xml',
    digest.xml,
    '```',
    '',
    '## 2. Governing Specification Context',
    `- **Spec File:** ${surgical.specPath || '_No matching spec found in specs/_'}`,
    surgical.specIntent ? `### <intent_model>\n${surgical.specIntent}` : '',
    surgical.specInvariants ? `### <invariants>\n${surgical.specInvariants}` : '',
    '',
    '## 3. Surgical Code Slices (+/- 25 lines)',
    ...(surgical.snippets.length > 0
      ? surgical.snippets.map((s) => `### ${s.file} (L${s.startLine}-L${s.endLine})\n\`\`\`ts\n${s.code}\n\`\`\``)
      : ['_No local source frame matched._']),
    '',
    '## 4. 5-Class "Heal vs. Quarantine" Decision Matrix',
    '| Class | Required [OBSERVED] Evidence | Mandatory Action |',
    '| :--- | :--- | :--- |',
    ...DECISION_MATRIX.map((d) => `| \`${d.class}\` | ${d.evidence} | ${d.action} |`),
    '',
    '## 5. Live Forensic Recon Commands',
    ...forensicCommands.map((c) => `- \`${c}\``),
    '',
  ].filter(Boolean).join('\n');

  fs.writeFileSync(scratchpadPath, scratchpadContent, 'utf8');

  // Record Stage 1 isolation in Session Workbench
  const flowId = `heal-${moduleName}`;
  startSession(resolved, flowId, { module: moduleName, stage: 'forensic-recon' });
  recordEvent(resolved, flowId, {
    type: 'note',
    message: `[OBSERVED | ${new Date().toISOString()}] Compressed ${digest.failure_signature} (${digest.tokens} tokens)`,
  });
  advanceStage(resolved, flowId, 'root-cause-verdict', {
    digest: `${digest.failure_signature} in ${moduleName}; see .mate/scratchpad-heal-${moduleName}.md`,
    artifacts: [path.relative(resolved, scratchpadPath).replace(/\\/g, '/')],
  });

  let verification = null;
  if (options.verify) {
    verification = runHarnessLoop(resolved, { maxIterations: 3 });
    if (verification.allGatesPassed && options.consolidate) {
      consolidateMemory(resolved, moduleName, {
        facts: [
          {
            kind: 'playbook',
            key: `heal.${digest.failure_signature.toLowerCase()}`,
            value: `Resolved ${digest.failure_signature} on ${moduleName} via spec-guarded loop`,
            source: 'OBSERVED',
          },
        ],
      });
      ensureMemoryScaffold(resolved);
      const pbPath = path.join(resolved, '.mate', 'memory', 'procedural-playbooks.md');
      fs.appendFileSync(
        pbPath,
        `\n- [OBSERVED | ${new Date().toISOString()}] (${moduleName}) ${digest.failure_signature}: Verified via \`npx mate-sdt heal --verify\`.\n`,
        'utf8'
      );
      runGarbageCollection(resolved, { write: true });
    }
  }

  return {
    targetDir: resolved,
    moduleName,
    attempt,
    digest,
    surgical,
    scratchpadPath,
    forensicCommands,
    decisionMatrix: DECISION_MATRIX,
    verification,
  };
}

module.exports = {
  MAX_DIGEST_TOKENS,
  DECISION_MATRIX,
  stripAnsi,
  classifyFailureSignature,
  compressErrorTrace,
  selectSurgicalContext,
  runHeal,
};
