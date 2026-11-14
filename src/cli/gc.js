'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { auditTestSuite, MAX_PAGE_OBJECT_LINES } = require('./auditor');
const { listSessions, isSessionExpired } = require('./memory');

const DESTRUCTIVE_PATTERNS = [
  { name: 'Recursive force delete (rm -rf)', regex: /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f|\brm\s+-[a-zA-Z]*f[a-zA-Z]*r/i },
  { name: 'Force git push', regex: /\bgit\s+push\s+[^\n]*(?:--force|-f)\b/i },
  { name: 'Hard git reset', regex: /\bgit\s+reset\s+--hard\b/i },
  { name: 'Destructive SQL DDL/DML', regex: /\b(?:DROP\s+(?:DATABASE|TABLE|SCHEMA)|TRUNCATE\s+TABLE)\b/i },
  { name: 'Silent assertion deletion/weakening', regex: /(?:delete\s+test|remove\s+expect|skip\s+failing\s+assertion)\b/i },
];

/**
 * Deterministic Safety-Guarded Harness command blocker.
 */
function blockDestructiveCommands(commandStr) {
  const cmd = String(commandStr || '');
  for (const pat of DESTRUCTIVE_PATTERNS) {
    if (pat.regex.test(cmd)) {
      return {
        allowed: false,
        blockedPattern: pat.name,
        remediation:
          'Run destructive mutations/load/red-team suites inside rootless Podman (`npx mate-sdt mutate|k6`), use `test.fail(true, "BUG-XXX")` for real defects, and never force-push or hard-reset.',
      };
    }
  }
  return { allowed: true };
}

function listFiles(dir, matcher = () => true) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, matcher));
    else if (matcher(full)) out.push(full);
  }
  return out;
}

function ensureExecPlansScaffold(targetDir) {
  const resolved = path.resolve(targetDir || '.');
  const activeDir = path.join(resolved, '.mate', 'exec-plans', 'active');
  const completedDir = path.join(resolved, '.mate', 'exec-plans', 'completed');
  const trackerPath = path.join(resolved, '.mate', 'exec-plans', 'tech-debt-tracker.md');
  fs.mkdirSync(activeDir, { recursive: true });
  fs.mkdirSync(completedDir, { recursive: true });
  for (const d of [activeDir, completedDir]) {
    const gk = path.join(d, '.gitkeep');
    if (fs.readdirSync(d).length === 0) fs.writeFileSync(gk, '', 'utf8');
  }
  if (!fs.existsSync(trackerPath)) {
    fs.writeFileSync(
      trackerPath,
      [
        '# M.A.T.E. Tech Debt & Entropy Tracker',
        '',
        '> Managed automatically by `npx mate-sdt gc`. Keep items atomic and 1-minute-reviewable.',
        '',
        '## Open Cleanup Tasks',
        '- _No open entropy tasks recorded yet._',
        '',
      ].join('\n'),
      'utf8'
    );
  }
  return { activeDir, completedDir, trackerPath };
}

function gradeFromScore(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function readMutationScore(resolved) {
  const candidates = [
    path.join(resolved, 'reports', 'mutation', 'mutation.json'),
    path.join(resolved, '.mate', 'mutation-report.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const data = JSON.parse(fs.readFileSync(c, 'utf8'));
        if (typeof data.mutationScore === 'number') return `${data.mutationScore.toFixed(1)}%`;
      } catch {
        // ignore malformed report
      }
    }
  }
  return 'PENDING (`npx mate-sdt mutate`)';
}

/**
 * Runs Continuous Entropy & Doc-Gardening Garbage Collection (`npx mate-sdt gc`).
 */
function runGarbageCollection(targetDir = '.', options = {}) {
  const resolved = path.resolve(targetDir || '.');
  const writeFiles = options.write !== false;
  const { trackerPath } = ensureExecPlansScaffold(resolved);
  const findings = [];

  const mapPath = path.join(resolved, 'MATE-PROJECT-MAP.md');
  const mapContent = fs.existsSync(mapPath) ? fs.readFileSync(mapPath, 'utf8') : '';

  // 1. Doc-Gardening & Cross-Link Linter
  const specsDir = path.join(resolved, 'specs');
  const specFiles = listFiles(specsDir, (f) => f.endsWith('.mate-spec.md'));
  const pageFiles = listFiles(path.join(resolved, 'src', 'pages'), (f) => /\.(ts|js)$/.test(f));
  const compFiles = listFiles(path.join(resolved, 'src', 'components'), (f) => /\.(ts|js)$/.test(f));
  const apiFiles = listFiles(path.join(resolved, 'src', 'api'), (f) => /\.(ts|js)$/.test(f));
  const testFiles = listFiles(path.join(resolved, 'tests'), (f) => /\.(spec|test)\.(ts|js)$/.test(f));

  if (!fs.existsSync(mapPath)) {
    findings.push({
      code: 'GC-DOC-MAP-MISSING',
      severity: 'ERROR',
      message: 'MATE-PROJECT-MAP.md is missing at repository root.',
      remediation: 'Run `npx mate-sdt init` to scaffold MATE-PROJECT-MAP.md.',
    });
  } else {
    for (const f of [...specFiles, ...pageFiles, ...compFiles, ...apiFiles]) {
      const rel = path.relative(resolved, f).replace(/\\/g, '/');
      if (!mapContent.includes(path.basename(f)) && !mapContent.includes(rel)) {
        findings.push({
          code: 'GC-UNINDEXED-ARTIFACT',
          severity: 'WARN',
          file: rel,
          message: `Artifact \`${rel}\` is not indexed in MATE-PROJECT-MAP.md.`,
          remediation: `Register \`${rel}\` in MATE-PROJECT-MAP.md to prevent context drift.`,
        });
      }
    }

    // Broken local markdown links in MATE-PROJECT-MAP.md
    const linkRe = /\[[^\]]+\]\(([^)#]+)\)/g;
    let lm;
    while ((lm = linkRe.exec(mapContent)) !== null) {
      const target = lm[1].trim();
      if (/^https?:\/\//i.test(target) || target.startsWith('mailto:')) continue;
      const fullTarget = path.resolve(resolved, target);
      if (!fs.existsSync(fullTarget)) {
        findings.push({
          code: 'GC-BROKEN-LINK',
          severity: 'ERROR',
          file: 'MATE-PROJECT-MAP.md',
          message: `Broken cross-link \`${target}\` in MATE-PROJECT-MAP.md.`,
          remediation: `Update or remove the broken link \`${target}\` in MATE-PROJECT-MAP.md.`,
        });
      }
    }
  }

  // Unmapped INV-XX invariants (declared in specs but never referenced in tests)
  const allTestText = testFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  for (const sf of specFiles) {
    const specText = fs.readFileSync(sf, 'utf8');
    const invs = [...new Set((specText.match(/\bINV-\d+\b/g) || []))];
    for (const inv of invs) {
      if (!allTestText.includes(inv)) {
        findings.push({
          code: 'GC-UNMAPPED-INVARIANT',
          severity: 'WARN',
          file: path.relative(resolved, sf).replace(/\\/g, '/'),
          message: `Invariant \`${inv}\` in \`${path.basename(sf)}\` is not referenced in any test file.`,
          remediation: `Reference \`${inv}\` in \`tests/e2e/\` or \`tests/api/\` (or mark \`test.fail()\` if blocked by a bug).`,
        });
      }
    }
  }

  // 2. AI Slop & Entropy Scanner
  const audit = auditTestSuite(resolved);
  for (const af of audit.findings) {
    findings.push({
      code: af.code,
      severity: af.severity === 'CRITICAL' || af.severity === 'HIGH' ? 'ERROR' : 'WARN',
      file: af.file,
      message: `${af.name} at ${af.file}:${af.line}`,
      remediation: af.remediation,
    });
  }

  // Duplicated helper signatures across tests/
  const helperCounts = new Map();
  for (const tf of testFiles) {
    const lines = fs.readFileSync(tf, 'utf8').split(/\r?\n/);
    for (const l of lines) {
      const m = l.trim().match(/^(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/);
      if (m) {
        const name = m[1];
        helperCounts.set(name, (helperCounts.get(name) || 0) + 1);
      }
    }
  }
  for (const [fnName, count] of helperCounts.entries()) {
    if (count >= 2) {
      findings.push({
        code: 'GC-DUP-HELPER',
        severity: 'WARN',
        message: `Duplicated ad-hoc helper \`${fnName}()\` found ${count} times across tests/.`,
        remediation: `Extract \`${fnName}()\` into a shared fixture in \`src/fixtures/\` or component in \`src/components/\`.`,
      });
    }
  }

  // Stale test.fail(..., "BUG-...") pointing to Resolved/Closed/Fixed bug reports
  const bugFiles = listFiles(path.join(resolved, 'docs', 'bugs'), (f) => f.endsWith('.md'));
  const resolvedBugIds = new Set();
  for (const bf of bugFiles) {
    const bText = fs.readFileSync(bf, 'utf8');
    if (/status[^\n]*\b(resolved|closed|fixed|done)\b/i.test(bText)) {
      const idMatch = bText.match(/BUG-[A-Za-z0-9-]+/);
      if (idMatch) resolvedBugIds.add(idMatch[0]);
      resolvedBugIds.add(path.basename(bf, '.md'));
    }
  }
  for (const tf of testFiles) {
    const content = fs.readFileSync(tf, 'utf8');
    const failMatches = content.matchAll(/test\.fail\s*\([^)]*(BUG-[A-Za-z0-9-]+)[^)]*\)/g);
    for (const fm of failMatches) {
      if (resolvedBugIds.has(fm[1])) {
        findings.push({
          code: 'GC-STALE-TEST-FAIL',
          severity: 'WARN',
          file: path.relative(resolved, tf).replace(/\\/g, '/'),
          message: `Stale \`test.fail()\` referencing resolved bug \`${fm[1]}\`.`,
          remediation: `Remove \`test.fail()\` for \`${fm[1]}\` and verify the test passes cleanly.`,
        });
      }
    }
  }

  // Expired sessions in .mate/sessions/
  const expiredSessions = listSessions(resolved).filter((s) => isSessionExpired(s));
  if (expiredSessions.length > 0) {
    findings.push({
      code: 'GC-EXPIRED-SESSIONS',
      severity: 'WARN',
      file: '.mate/sessions/',
      message: `${expiredSessions.length} expired session(s) in \`.mate/sessions/\`.`,
      remediation: 'Run `npx mate-sdt session prune` to remove expired session workbenches.',
    });
  }

  // 3. Generate docs/QUALITY_SCORE.md
  const docsDir = path.join(resolved, 'docs');
  const scorecardPath = path.join(docsDir, 'QUALITY_SCORE.md');
  const mutationScore = readMutationScore(resolved);
  const obsDir = path.join(resolved, 'tests', 'ai-evals', 'traces');
  const obsStatus = fs.existsSync(obsDir) ? 'CONFIGURED' : 'N/A';

  const moduleRows = [];
  if (specFiles.length === 0) {
    moduleRows.push(`| \`global\` | ${audit.filesScanned} files | ${audit.grade} (${audit.score}/100) | ${mutationScore} | ${obsStatus} |`);
  } else {
    for (const sf of specFiles) {
      const modName = path.basename(sf, '.mate-spec.md');
      const modFindings = findings.filter((f) => (f.file || '').includes(modName));
      const modScore = Math.max(0, Math.min(audit.score, 100 - modFindings.length * 10));
      const modGrade = gradeFromScore(modScore);
      moduleRows.push(`| \`${modName}\` | \`specs/${path.basename(sf)}\` | ${modGrade} (${modScore}/100) | ${mutationScore} | ${obsStatus} |`);
    }
  }

  const scorecardContent = [
    '# M.A.T.E. Quality Scorecard (`docs/QUALITY_SCORE.md`)',
    '',
    `> Mechanically generated by \`npx mate-sdt gc\` at ${new Date().toISOString()}`,
    `> Overall Codebase Health: **Grade ${audit.grade} (${audit.score}/100)** | Page Object Ceiling: **<= ${MAX_PAGE_OBJECT_LINES} lines** | Mutation Target: **>= 85%**`,
    '',
    '| Module | Spec Coverage | Forward-Only & SOLID Grade | Mutation Score | Observability SLAs |',
    '| :--- | :--- | :---: | :---: | :---: |',
    ...moduleRows,
    '',
    '## Active Entropy Summary',
    `- Total GC Findings: **${findings.length}** (${findings.filter((f) => f.severity === 'ERROR').length} errors, ${findings.filter((f) => f.severity === 'WARN').length} warnings)`,
    `- Expired Sessions Pending Prune: **${expiredSessions.length}**`,
    '',
  ].join('\n');

  if (writeFiles) {
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(scorecardPath, scorecardContent, 'utf8');

    const trackerLines = [
      '# M.A.T.E. Tech Debt & Entropy Tracker',
      '',
      `> Updated automatically by \`npx mate-sdt gc\` at ${new Date().toISOString()}.`,
      '> Atomic, 1-minute-reviewable cleanup tasks:',
      '',
    ];
    if (findings.length === 0) {
      trackerLines.push('- [x] Zero entropy or doc-gardening issues detected.');
    } else {
      for (const f of findings) {
        trackerLines.push(`- [ ] **[${f.code}]** ${f.message} — *Fix:* ${f.remediation}`);
      }
    }
    trackerLines.push('');
    fs.writeFileSync(trackerPath, trackerLines.join('\n'), 'utf8');
  }

  return {
    targetDir: resolved,
    passed: findings.filter((f) => f.severity === 'ERROR').length === 0,
    score: audit.score,
    grade: audit.grade,
    findings,
    scorecardPath,
    trackerPath,
  };
}

module.exports = {
  blockDestructiveCommands,
  ensureExecPlansScaffold,
  runGarbageCollection,
};
