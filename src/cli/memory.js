'use strict';

/**
 * M.A.T.E. Memory Architecture (Context Engineering: Sessions & Memory)
 *
 *  - Session Layer  (ephemeral workbench):
 *      .mate/sessions/<flow-id>.json, .mate/scratchpad-<module>.md, .mate/handoffs/*.json, .mate/harness-state.json
 *  - Memory Layer   (canonical filing cabinet):
 *      MATE-PROJECT-MAP.md, specs/*.mate-spec.md, .mate/memory/procedural-playbooks.md
 *
 * Zero runtime dependencies: native Node.js built-ins only.
 * Framework-agnostic: never reads any IDE-specific conversation history.
 */

const fs = require('node:fs');
const path = require('node:path');

// Subsystem modules
const sessionsModule = require('./sessions');
const contextModule = require('./context');

const {
  RAW_EVENT_WINDOW_K,
  DEFAULT_SESSION_TTL_HOURS,
  safeName,
  listFilesWithExt,
  readJson,
  writeJson,
  sessionsDir,
  handoffsDir,
  sessionPath,
  scratchpadPath,
  isSessionExpired,
  loadSession,
  saveSession,
  startSession,
  syncModuleScratchpad,
  compactSession,
  compactActiveSessions,
  pruneExpiredSessions,
  listSessions,
  latestHandoff,
} = sessionsModule;

const {
  MAP_TOKEN_BUDGET,
  ARIA_SNAPSHOT_TOKEN_BUDGET,
  DEFAULT_PACK_TOKEN_CEILING,
  MAP_SLICE_TOKEN_BUDGET,
  PHASES,
  FEWSHOTS,
  estimateTokens,
  readText,
  rel,
  loadConfig,
  ageInDays,
  extractXmlBlock,
  selectMemorySlice,
  compressAriaSnapshot,
  digestHar,
  inferPhase,
} = contextModule;

// ───────────────────────────── Constants ─────────────────────────────

const INFERRED_DECAY_DAYS = 14;
const OBSERVED_STALE_DAYS = 30;

/** Trust hierarchy & Clash precedence: higher rank wins during consolidation. */
const TRUST_RANK = { BOOTSTRAPPED: 4, USER_EXPLICIT: 3, OBSERVED: 2, INFERRED: 1, TBD: 0 };

const SAFE_EMAIL_DOMAINS = /@(example\.(com|org|net)|test\.(com|org)|localhost|mate\.test|domain\.tld)$/i;

// ───────────────────── PII Redaction & Injection Guards ─────────────────────

const PII_PATTERNS = [
  { code: 'EMAIL', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, allow: (m) => SAFE_EMAIL_DOMAINS.test(m) },
  { code: 'JWT', re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g },
  { code: 'BEARER', re: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/g },
  { code: 'API_KEY', re: /\b(?:sk|pk|rk|ghp|gho|ghu|ghs|xox[bap])[-_][A-Za-z0-9_-]{16,}/g },
  { code: 'AWS_KEY', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { code: 'CREDIT_CARD', re: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:\d{4}[-\s]){3}\d{4})\b/g },
  {
    code: 'SECRET_ASSIGNMENT',
    re: /\b(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)["']?\s*[:=]\s*["']?([^\s"',;<>{}$*[\]]{4,})/gi,
    allow: (m, g1) => /^(redacted|none|null|undefined|true|false|xxx+|\*+)$/i.test(g1 || ''),
  },
  { code: 'COOKIE', re: /\b(?:Set-Cookie|Cookie)\s*:\s*[^\r\n]{12,}/gi },
  { code: 'SESSION_ID', re: /\b(?:sessionid|session_id|JSESSIONID|PHPSESSID|connect\.sid)\s*[=:]\s*[A-Za-z0-9%._-]{10,}/gi },
];

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+|any\s+)?(?:the\s+)?(?:previous|prior|above|earlier)\s+(?:instructions|prompts|rules|directions)/i,
  /disregard\s+(?:all\s+|any\s+)?(?:the\s+)?(?:previous|prior|above|your)\s+(?:instructions|rules|guidelines)/i,
  /you\s+are\s+now\s+(?:a|an|in)\s+\w+/i,
  /(?:reveal|print|show|leak|output)\s+(?:your\s+|the\s+)?(?:system\s+prompt|hidden\s+instructions)/i,
  /<\s*\/?\s*(?:system|assistant|im_start|im_end)\s*>/i,
  /\bnew\s+instructions\s*:/i,
  /do\s+not\s+(?:tell|inform|notify)\s+the\s+(?:user|engineer|tester)/i,
  /disable\s+(?:the\s+)?(?:gate|harness|guardrails?|anti-greenwashing)/i,
  /\bexfiltrate\b/i,
  /curl\s+[^\n|]*\|\s*(?:sh|bash)\b/i,
];

/** Redacts PII/secrets. Returns { text, count, kinds }. */
function redactPII(text) {
  let out = String(text || '');
  let count = 0;
  const kinds = new Set();
  for (const p of PII_PATTERNS) {
    out = out.replace(p.re, (m, g1) => {
      if (p.allow && p.allow(m, g1)) return m;
      count += 1;
      kinds.add(p.code);
      return `[REDACTED:${p.code}]`;
    });
  }
  return { text: out, count, kinds: [...kinds] };
}

/** Detects PII without mutating. Returns array of { code, sample }. */
function detectPII(text) {
  const hits = [];
  const src = String(text || '');
  for (const p of PII_PATTERNS) {
    const re = new RegExp(p.re.source, p.re.flags);
    let m;
    while ((m = re.exec(src)) !== null) {
      if (p.allow && p.allow(m[0], m[1])) continue;
      hits.push({ code: p.code, sample: m[0].slice(0, 6) + '…' });
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return hits;
}

/** Detects indirect prompt-injection payloads. Returns array of matched snippets. */
function detectInjection(text) {
  const hits = [];
  const src = String(text || '');
  for (const re of INJECTION_PATTERNS) {
    const m = src.match(re);
    if (m) hits.push(m[0].slice(0, 60));
  }
  return hits;
}

// ───────────────────────────── Provenance ─────────────────────────────

const PROV_RE = /\[(BOOTSTRAPPED|USER_EXPLICIT|OBSERVED|INFERRED|TBD)([^\]]*)\]/g;

function formatProvenance(source, timestamp, confidence) {
  const parts = [source];
  if (timestamp) parts.push(timestamp);
  if (confidence !== undefined && confidence !== null && confidence !== '') parts.push(Number(confidence).toFixed(2));
  return `[${parts.join(' | ')}]`;
}

function parseProvenance(text) {
  const results = [];
  const re = new RegExp(PROV_RE.source, 'g');
  let m;
  while ((m = re.exec(text || '')) !== null) {
    const extras = m[2]
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    const ts = extras.find((e) => /^\d{4}-\d{2}-\d{2}/.test(e)) || null;
    const conf = extras.find((e) => /^\d(\.\d+)?$/.test(e));
    results.push({ source: m[1], timestamp: ts, confidence: conf !== undefined ? Number(conf) : null });
  }
  return results;
}

// ───────────────────── Memory Layer Scaffolding ─────────────────────

const PROCEDURAL_PLAYBOOK_TEMPLATE = [
  '# 🛠️ Procedural Playbooks (Repo-Specific "Knowing How")',
  '',
  '> Canonical, framework-agnostic procedural memory for this repository. Any AI assistant (Antigravity, Claude Code,',
  '> Cursor, Windsurf, Copilot) can read and patch this file. Keep each playbook short, dated, anonymized (no tenant secrets),',
  '> and provenance-tagged. Patch flawed steps in place and prune outdated procedures online — do not append contradictions.',
  '',
  '## Auth State Save (storageState)',
  '- [TBD] Document how this repo records and refreshes per-role `storageState` files (see `mate-assert-playwright` §4).',
  '',
  '## Custom Locator Strategies (Shadow DOM / Iframes)',
  '- [TBD] Document any non-standard locator strategies required by this application.',
  '',
  '## Podman Network Bridges (Stryker / k6)',
  '- [TBD] Document the rootless Podman network flags needed to reach the system under test.',
  '',
].join('\n');

function ensureMemoryScaffold(targetDir) {
  const resolved = path.resolve(targetDir);
  const memDir = path.join(resolved, '.mate', 'memory');
  const sessDir = sessionsDir(resolved);
  fs.mkdirSync(memDir, { recursive: true });
  fs.mkdirSync(sessDir, { recursive: true });
  const created = [];
  const playbook = path.join(memDir, 'procedural-playbooks.md');
  if (!fs.existsSync(playbook)) {
    fs.writeFileSync(playbook, PROCEDURAL_PLAYBOOK_TEMPLATE, 'utf8');
    created.push('.mate/memory/procedural-playbooks.md');
  }
  return created;
}

// ───────────────────── Consolidation (CREATE / UPDATE / DELETE) ─────────────────────

function ledgerMarkers(moduleName) {
  const m = safeName(moduleName);
  return { start: `<!-- MATE-MEMORY:${m}:START -->`, end: `<!-- MATE-MEMORY:${m}:END -->` };
}

function escCell(s) {
  return String(s).replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
}

function parseLedger(block) {
  const rows = [];
  for (const line of block.split(/\r?\n/)) {
    if (!/^\|/.test(line) || /^\|\s*:?-{2,}/.test(line) || /^\|\s*Key\s*\|/i.test(line)) continue;
    const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim().replace(/\\\|/g, '|'));
    if (cells.length < 3) continue;
    const key = cells[0].replace(/^`|`$/g, '');
    const value = cells[1].replace(/^`|`$/g, '');
    const prov = parseProvenance(cells[2])[0];
    if (!key || !prov) continue;
    rows.push({ key, value, source: prov.source, timestamp: prov.timestamp, confidence: prov.confidence });
  }
  return rows;
}

function renderLedger(moduleName, rows) {
  const { start, end } = ledgerMarkers(moduleName);
  const body = rows
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((r) => `| \`${escCell(r.key)}\` | \`${escCell(r.value).replace(/`/g, "'")}\` | \`${escCell(formatProvenance(r.source, r.timestamp, r.confidence))}\` |`);
  return [start, `### 🧠 Consolidated Memory — ${moduleName}`, '| Key | Value | Provenance |', '| :--- | :--- | :--- |', ...body, end].join('\n');
}

function resolvedBugKeys(resolved) {
  const resolvedIds = new Set();
  for (const f of listFilesWithExt(path.join(resolved, 'docs', 'bugs'), '.md')) {
    const text = readText(f);
    if (/status[^\n]*\b(resolved|closed|fixed|done)\b/i.test(text)) {
      const id = path.basename(f).replace(/\.md$/i, '');
      resolvedIds.add(id.toLowerCase());
      const bugId = (text.match(/BUG-[A-Za-z0-9-]+/) || [])[0];
      if (bugId) resolvedIds.add(bugId.toLowerCase());
    }
  }
  return resolvedIds;
}

function parseScratchpadFindings(resolved, moduleName) {
  const p = scratchpadPath(resolved, moduleName);
  if (!fs.existsSync(p)) return [];
  const findings = [];
  for (const line of readText(p).split(/\r?\n/)) {
    const m = line.match(/^\s*[-*]\s+\[(BOOTSTRAPPED|USER_EXPLICIT|OBSERVED|INFERRED|TBD)([^\]]*)\]\s+([a-z]+):([A-Za-z0-9._/-]+)\s*=\s*(.+)$/i);
    if (!m) continue;
    const extras = m[2].split('|').map((s) => s.trim()).filter(Boolean);
    const ts = extras.find((e) => /^\d{4}-\d{2}-\d{2}/.test(e)) || new Date().toISOString();
    findings.push({ kind: m[3].toLowerCase(), key: m[4], value: m[5].trim(), source: m[1].toUpperCase(), timestamp: ts });
  }
  return findings;
}

function normalizeFact(raw) {
  const kind = safeName(raw.kind || 'fact') || 'fact';
  const keyPart = String(raw.key || '').trim();
  if (!keyPart) return { error: 'fact missing "key"' };
  const source = String(raw.source || 'OBSERVED').toUpperCase();
  if (!(source in TRUST_RANK)) return { error: `unknown provenance source "${raw.source}"` };
  const value = raw.invalidate ? '' : redactPII(String(raw.value === undefined ? '' : raw.value)).text;
  if (!raw.invalidate && value.trim() === '') return { error: `fact "${kind}:${keyPart}" has empty value` };
  const inj = detectInjection(`${keyPart} ${value}`);
  if (inj.length) return { error: `fact "${kind}:${keyPart}" rejected: prompt-injection payload detected (content quarantined, not persisted)` };
  return {
    fact: {
      key: `${kind}:${keyPart}`,
      value,
      source,
      timestamp: raw.timestamp || new Date().toISOString(),
      confidence: raw.confidence === undefined ? (source === 'OBSERVED' ? 0.8 : source === 'INFERRED' ? 0.4 : 1) : Number(raw.confidence),
      invalidate: Boolean(raw.invalidate),
    },
  };
}

function consolidateMemory(targetDir, moduleName, options = {}) {
  const resolved = path.resolve(targetDir);
  const mapFile = path.join(resolved, 'MATE-PROJECT-MAP.md');
  const result = {
    module: moduleName,
    dryRun: Boolean(options.dryRun),
    transactions: [],
    rejected: [],
    counts: { CREATE: 0, UPDATE: 0, DELETE: 0, CONFLICT: 0, NOOP: 0 },
    stale: [],
    mapTokens: 0,
    written: false,
  };
  if (!fs.existsSync(mapFile)) {
    result.error = 'MATE-PROJECT-MAP.md not found. Run `npx mate-sdt init` first.';
    return result;
  }
  if (!moduleName) {
    result.error = 'A <module> is required for consolidation.';
    return result;
  }

  const rawFacts = [];
  if (options.factsPath) {
    const parsed = readJson(path.resolve(resolved, options.factsPath), null);
    if (!parsed) {
      result.error = `Could not read facts JSON: ${options.factsPath}`;
      return result;
    }
    rawFacts.push(...(Array.isArray(parsed) ? parsed : parsed.facts || []));
  }
  if (Array.isArray(options.facts)) {
    rawFacts.push(...options.facts);
  }
  rawFacts.push(...parseScratchpadFindings(resolved, moduleName));
  const sessions = listSessions(resolved).filter((s) => !s.module || safeName(s.module) === safeName(moduleName));
  for (const s of sessions) for (const f of s.findings || []) if (!f.consolidated) rawFacts.push(f);

  const facts = [];
  for (const raw of rawFacts) {
    const n = normalizeFact(raw);
    if (n.error) result.rejected.push(n.error);
    else facts.push(n.fact);
  }

  const map = readText(mapFile);
  const { start, end } = ledgerMarkers(moduleName);
  const startIdx = map.indexOf(start);
  const endIdx = map.indexOf(end);
  const hasBlock = startIdx !== -1 && endIdx > startIdx;
  const ledger = hasBlock ? parseLedger(map.slice(startIdx, endIdx)) : [];
  const byKey = new Map(ledger.map((r) => [r.key, r]));
  const now = Date.now();

  const log = (op, key, detail) => {
    result.counts[op] += 1;
    result.transactions.push({ op, key, detail });
  };

  for (const f of facts) {
    const existing = byKey.get(f.key);
    if (f.invalidate) {
      if (!existing) log('NOOP', f.key, 'invalidate requested but fact not present');
      else if (TRUST_RANK[existing.source] === 4 && f.source !== 'BOOTSTRAPPED') {
        log('CONFLICT', f.key, `cannot invalidate [BOOTSTRAPPED] fact with [${f.source}] evidence`);
      } else {
        byKey.delete(f.key);
        log('DELETE', f.key, `invalidated by [${f.source}] evidence`);
      }
      continue;
    }
    if (!existing) {
      byKey.set(f.key, { key: f.key, value: f.value, source: f.source, timestamp: f.timestamp, confidence: f.confidence });
      log('CREATE', f.key, `new fact [${f.source}]`);
      continue;
    }
    const newRank = TRUST_RANK[f.source];
    const oldRank = TRUST_RANK[existing.source];
    if (existing.value === f.value) {
      if (newRank >= oldRank) {
        byKey.set(f.key, { ...existing, source: f.source, timestamp: f.timestamp, confidence: f.confidence });
        log('UPDATE', f.key, `corroborated by fresh [${f.source}] evidence (timestamp refreshed)`);
      } else log('NOOP', f.key, 'identical value with lower trust');
      continue;
    }
    if (oldRank === 4 && newRank < 4) {
      log('CONFLICT', f.key, `[${f.source}] contradicts [BOOTSTRAPPED] fact; escalate to the engineer (Defect vs Spec Update)`);
    } else if (newRank >= oldRank) {
      byKey.set(f.key, { key: f.key, value: f.value, source: f.source, timestamp: f.timestamp, confidence: f.confidence });
      log('UPDATE', f.key, `value evolved: "${existing.value}" → "${f.value}" ([${existing.source}] → [${f.source}])`);
    } else {
      log('CONFLICT', f.key, `lower-trust [${f.source}] cannot override [${existing.source}]`);
    }
  }

  // Automatic invalidation: decayed [INFERRED]/[TBD] notes and resolved bug markers.
  const resolvedBugs = resolvedBugKeys(resolved);
  for (const [key, r] of [...byKey.entries()]) {
    if ((r.source === 'INFERRED' || r.source === 'TBD') && (ageInDays(r.timestamp, now) || 0) > INFERRED_DECAY_DAYS) {
      byKey.delete(key);
      log('DELETE', key, `decayed uncorroborated [${r.source}] note (> ${INFERRED_DECAY_DAYS}d)`);
    } else if (key.startsWith('bug:') && resolvedBugs.has(key.slice(4).toLowerCase())) {
      byKey.delete(key);
      log('DELETE', key, 'bug report is resolved/closed; test.fail() marker invalidated');
    } else if (r.source === 'OBSERVED' && (ageInDays(r.timestamp, now) || 0) > OBSERVED_STALE_DAYS) {
      result.stale.push(`${key} (observed ${Math.round(ageInDays(r.timestamp, now))}d ago — re-verify with a live snapshot)`);
    }
  }

  const rendered = renderLedger(moduleName, [...byKey.values()]);
  const next = hasBlock ? `${map.slice(0, startIdx)}${rendered}${map.slice(endIdx + end.length)}` : `${map.trimEnd()}\n\n${rendered}\n`;
  result.mapTokens = estimateTokens(next);
  result.overBudget = result.mapTokens > MAP_TOKEN_BUDGET;

  if (!options.dryRun) {
    fs.writeFileSync(mapFile, next, 'utf8');
    result.written = true;
    for (const s of sessions) {
      let changed = false;
      for (const f of s.findings || []) {
        if (!f.consolidated) {
          f.consolidated = true;
          changed = true;
        }
      }
      if (changed) saveSession(resolved, s);
    }
    ensureMemoryScaffold(resolved);
    const logFile = path.join(resolved, '.mate', 'memory', 'consolidation-log.jsonl');
    fs.appendFileSync(
      logFile,
      `${JSON.stringify({ ts: new Date().toISOString(), module: moduleName, counts: result.counts, transactions: result.transactions, rejected: result.rejected })}\n`,
      'utf8'
    );
  }
  return result;
}

// ───────────────────── GATE-01 hygiene checks ─────────────────────

function mapTableAndBulletKeys(content) {
  const found = [];
  let section = '';
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,4}\s/.test(line)) {
      section = line.replace(/^#+\s*/, '').trim();
      continue;
    }
    if (/^<!-- MATE-MEMORY:/.test(line)) section = line.trim();
    const isHeaderRow = /^\|/.test(line) && lines[i + 1] && /^\|\s*:?-{2,}/.test(lines[i + 1]);
    if (/^\|/.test(line) && !/^\|\s*:?-{2,}/.test(line) && !isHeaderRow) {
      const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
      const key = (cells[0] || '').replace(/[*`]/g, '').trim();
      if (key && key !== '—' && key !== '...') found.push({ section, key, content: cells.slice(1).join('|') });
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+\*\*`?([A-Za-z0-9._-]{2,40})`?\*\*\s*(?:\([^)]*\))?\s*:\s*(.*)$/);
    if (bullet) found.push({ section: '(id-registry)', key: bullet[1], content: bullet[2] });
  }
  return found;
}

function runContextHygieneChecks(targetDir) {
  const resolved = path.resolve(targetDir);
  const cfg = loadConfig(resolved);
  const issues = [];
  const add = (severity, code, message, file) => issues.push({ severity, code, message, file: file || null });

  const mapFile = path.join(resolved, 'MATE-PROJECT-MAP.md');
  const mapContent = readText(mapFile);

  // 1. Token budgets
  const mapTokens = estimateTokens(mapContent);
  if (mapContent && mapTokens > MAP_TOKEN_BUDGET) {
    add('error', 'CTX-BUDGET-MAP', `MATE-PROJECT-MAP.md ~${mapTokens} tokens exceeds ${MAP_TOKEN_BUDGET}.`, 'MATE-PROJECT-MAP.md');
  }
  const snapFiles = [
    ...listFilesWithExt(path.join(resolved, '.mate', 'snapshots'), ['.yml', '.yaml']),
    ...listFilesWithExt(path.join(resolved, '.playwright-cli'), ['.yml', '.yaml']),
  ];
  for (const f of snapFiles) {
    const t = estimateTokens(readText(f));
    if (t > cfg.ariaSnapshotCeiling) {
      add('error', 'CTX-BUDGET-ARIA', `ARIA snapshot ~${t} tokens exceeds ${cfg.ariaSnapshotCeiling}; re-snapshot a narrower region.`, rel(resolved, f));
    }
  }
  const packs = listFilesWithExt(path.join(resolved, '.mate'), '.md').filter((f) => path.basename(f).startsWith('context-pack-'));
  for (const f of packs) {
    const t = estimateTokens(readText(f));
    if (t > cfg.contextPackCeiling) {
      add('error', 'CTX-BUDGET-PACK', `JIT Context Pack ~${t} tokens exceeds ceiling ${cfg.contextPackCeiling}.`, rel(resolved, f));
    }
  }

  // 2. PII + injection scan over everything persisted by the memory/session layers.
  const persisted = [
    ...(fs.existsSync(mapFile) ? [mapFile] : []),
    ...listFilesWithExt(path.join(resolved, '.mate', 'memory'), null),
    ...listFilesWithExt(sessionsDir(resolved), '.json'),
    ...listFilesWithExt(handoffsDir(resolved), '.json'),
    ...listFilesWithExt(path.join(resolved, '.mate'), '.md').filter((f) => path.basename(f).startsWith('scratchpad-')),
    ...listFilesWithExt(path.join(resolved, '.mate', 'snapshots'), null),
    ...listFilesWithExt(path.join(resolved, '.mate'), '.har'),
    ...listFilesWithExt(path.join(resolved, '.playwright-cli'), ['.yml', '.yaml', '.har']),
  ];
  for (const f of [...new Set(persisted)]) {
    const text = readText(f);
    const pii = detectPII(text);
    if (pii.length) {
      add('error', 'CTX-PII', `${pii.length} PII/secret match(es) [${[...new Set(pii.map((p) => p.code))].join(', ')}]; redact before persisting.`, rel(resolved, f));
    }
    const inj = detectInjection(text);
    if (inj.length) {
      add('error', 'CTX-INJECTION', `Potential indirect prompt-injection payload: "${inj[0]}".`, rel(resolved, f));
    }
  }

  // 3. Provenance: invariants & Page/Component Objects must not rest on [INFERRED]/[TBD].
  for (const f of listFilesWithExt(path.join(resolved, 'specs'), '.mate-spec.md')) {
    const block = extractXmlBlock(readText(f), 'invariants');
    if (block && /\[(INFERRED|TBD)/i.test(block)) {
      add('error', 'CTX-PROV-INVARIANT', '<invariants> relies on unverified [INFERRED]/[TBD] facts; verify with the engineer/live app or move them out.', rel(resolved, f));
    }
  }
  for (const f of [...listFilesWithExt(path.join(resolved, 'src', 'pages'), '.ts'), ...listFilesWithExt(path.join(resolved, 'src', 'components'), '.ts')]) {
    const lines = readText(f).split(/\r?\n/);
    lines.forEach((l, i) => {
      if (/\[(INFERRED|TBD)/i.test(l)) {
        add('error', 'CTX-PROV-LOCATOR', `Page Object/Component line ${i + 1} relies on an unverified [INFERRED]/[TBD] locator.`, rel(resolved, f));
      }
    });
  }
  if (mapContent && /\[(INFERRED|TBD)/i.test(mapContent.replace(/`[^`\n]*`/g, ''))) {
    add('warn', 'CTX-INFERRED-MAP', 'MATE-PROJECT-MAP.md contains [INFERRED]/[TBD] entries; verify or prune before test generation.', 'MATE-PROJECT-MAP.md');
  }

  // 4. Clash check: duplicate / contradictory entries in the Living Map.
  const seen = new Map();
  for (const e of mapTableAndBulletKeys(mapContent)) {
    const id = `${e.section}::${e.key.toLowerCase()}`;
    if (seen.has(id)) {
      const prev = seen.get(id);
      if (prev.content.replace(/\s+/g, ' ') === e.content.replace(/\s+/g, ' ')) {
        add('error', 'CTX-CLASH-DUP', `Duplicate entry "${e.key}" in section "${e.section}".`, 'MATE-PROJECT-MAP.md');
      } else {
        add('error', 'CTX-CLASH-CONTRA', `Contradictory entries for "${e.key}" in section "${e.section}".`, 'MATE-PROJECT-MAP.md');
      }
    } else seen.set(id, e);
  }

  // 5. Session hygiene (info): expired sessions awaiting prune.
  const expired = listSessions(resolved).filter((s) => isSessionExpired(s)).length;
  if (expired) add('warn', 'CTX-SESSION-TTL', `${expired} expired session(s) past TTL; run \`npx mate-sdt session prune\`.`, '.mate/sessions');

  return {
    issues,
    errors: issues.filter((i) => i.severity === 'error'),
    warnings: issues.filter((i) => i.severity === 'warn'),
    mapTokens,
    budgets: { map: MAP_TOKEN_BUDGET, aria: cfg.ariaSnapshotCeiling, pack: cfg.contextPackCeiling },
  };
}

// ───────────────────── Wrapper Integration Methods ─────────────────────

function wrappedRecordEvent(targetDir, flowId, event) {
  return sessionsModule.recordEvent(targetDir, flowId, event, { redactPII, detectInjection });
}

function wrappedValidateHandoff(resolved, handoff) {
  return sessionsModule.validateHandoff(resolved, handoff, { estimateTokens, detectInjection });
}

function wrappedAdvanceStage(targetDir, flowId, toStage, options = {}) {
  return sessionsModule.advanceStage(targetDir, flowId, toStage, options, {
    redactPII,
    formatProvenance,
    estimateTokens,
    detectInjection,
  });
}

function wrappedBuildJitContextPack(resolved, moduleName, options = {}) {
  return contextModule.buildJitContextPack(resolved, moduleName, options, { redactPII });
}

module.exports = {
  // Constants
  RAW_EVENT_WINDOW_K,
  MAP_TOKEN_BUDGET,
  ARIA_SNAPSHOT_TOKEN_BUDGET,
  TRUST_RANK,
  PHASES,
  FEWSHOTS,

  // Utilities & Security
  estimateTokens,
  redactPII,
  detectPII,
  detectInjection,
  parseProvenance,
  formatProvenance,
  extractXmlBlock,
  loadConfig,

  // Sessions (ephemeral workbench)
  startSession,
  loadSession,
  recordEvent: wrappedRecordEvent,
  compactSession,
  compactActiveSessions,
  advanceStage: wrappedAdvanceStage,
  validateHandoff: wrappedValidateHandoff,
  pruneExpiredSessions,
  listSessions,
  isSessionExpired,

  // Memory & Context Pack
  ensureMemoryScaffold,
  selectMemorySlice,
  compressAriaSnapshot,
  digestHar,
  buildJitContextPack: wrappedBuildJitContextPack,
  consolidateMemory,
  runContextHygieneChecks,
};
