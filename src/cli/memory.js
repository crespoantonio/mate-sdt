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

// ───────────────────────────── Constants ─────────────────────────────

const RAW_EVENT_WINDOW_K = 5;
const DEFAULT_SESSION_TTL_HOURS = 24;
const MAP_TOKEN_BUDGET = 3000;
const ARIA_SNAPSHOT_TOKEN_BUDGET = 800;
const DEFAULT_PACK_TOKEN_CEILING = 12000;
const MAP_SLICE_TOKEN_BUDGET = 1200;
const INFERRED_DECAY_DAYS = 14;
const OBSERVED_STALE_DAYS = 30;
const MAX_SUMMARY_LINES = 3;
const MAX_HANDOFF_DIGEST_TOKENS = 500;

/** Trust hierarchy & Clash precedence: higher rank wins during consolidation. */
const TRUST_RANK = { BOOTSTRAPPED: 4, USER_EXPLICIT: 3, OBSERVED: 2, INFERRED: 1, TBD: 0 };

const SAFE_EMAIL_DOMAINS = /@(example\.(com|org|net)|test\.(com|org)|localhost|mate\.test|domain\.tld)$/i;

// ───────────────────────────── Utilities ─────────────────────────────

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function listFilesWithExt(dirPath, extFilter) {
  if (!fs.existsSync(dirPath)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...listFilesWithExt(full, extFilter));
    } else if (
      !extFilter ||
      (Array.isArray(extFilter)
        ? extFilter.some((e) => entry.name.endsWith(e))
        : entry.name.endsWith(extFilter))
    ) {
      results.push(full);
    }
  }
  return results;
}

function safeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readText(file, maxBytes = 2 * 1024 * 1024) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > maxBytes) return fs.readFileSync(file, 'utf8').slice(0, maxBytes);
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function rel(resolved, file) {
  return path.relative(resolved, file).replace(/\\/g, '/');
}

function loadConfig(resolved) {
  const cfg = readJson(path.join(resolved, '.mate', 'config.json'), {}) || {};
  return {
    contextPackCeiling: Number(cfg.contextPackCeiling) || DEFAULT_PACK_TOKEN_CEILING,
    ariaSnapshotCeiling: Number(cfg.ariaSnapshotCeiling) || ARIA_SNAPSHOT_TOKEN_BUDGET,
    sessionTtlHours: Number(cfg.sessionTtlHours) || DEFAULT_SESSION_TTL_HOURS,
  };
}

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

function ageInDays(timestamp, now = Date.now()) {
  const t = Date.parse(timestamp || '');
  if (Number.isNaN(t)) return null;
  return Math.max(0, (now - t) / 86400000);
}

// ─────────────────────── Spec / XML Block Extraction ───────────────────────

function extractXmlBlock(content, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?</${tag}>`, 'i');
  const m = (content || '').match(re);
  return m ? m[0] : null;
}

// ───────────────────────── Session Layer (Workbench) ─────────────────────────

function sessionsDir(resolved) {
  return path.join(resolved, '.mate', 'sessions');
}
function handoffsDir(resolved) {
  return path.join(resolved, '.mate', 'handoffs');
}
function sessionPath(resolved, flowId) {
  return path.join(sessionsDir(resolved), `${safeName(flowId) || 'default'}.json`);
}
function scratchpadPath(resolved, moduleName) {
  return path.join(resolved, '.mate', `scratchpad-${safeName(moduleName) || 'default'}.md`);
}

function loadSession(targetDir, flowId) {
  const resolved = path.resolve(targetDir);
  return readJson(sessionPath(resolved, flowId), null);
}

function saveSession(resolved, session) {
  session.updatedAt = new Date().toISOString();
  writeJson(sessionPath(resolved, session.flowId), session);
}

function startSession(targetDir, flowId, options = {}) {
  const resolved = path.resolve(targetDir);
  const cfg = loadConfig(resolved);
  const ttlHours = Number(options.ttlHours) || cfg.sessionTtlHours;
  const now = new Date();
  const existing = loadSession(resolved, flowId);
  if (existing && !isSessionExpired(existing)) {
    if (options.stage) existing.activeStage = options.stage;
    if (options.module) existing.module = options.module;
    if (options.task) existing.activeTask = options.task;
    existing.expiresAt = new Date(now.getTime() + ttlHours * 3600000).toISOString();
    saveSession(resolved, existing);
    return existing;
  }
  const session = {
    schema: 'mate.session/v1',
    flowId: safeName(flowId) || 'default',
    module: options.module || null,
    activeStage: options.stage || 'start',
    activeTask: options.task || null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ttlHours,
    expiresAt: new Date(now.getTime() + ttlHours * 3600000).toISOString(),
    nextEventSeq: 1,
    stages: [],
    summaryLines: [],
    events: [],
    compactedEventIds: [],
    compactedEventCount: 0,
    checkedFiles: [],
    scratchpad: {},
    openQuestions: [],
    pendingGateChecks: ['GATE-01', 'GATE-02', 'GATE-03', 'GATE-04'],
    findings: [],
  };
  saveSession(resolved, session);
  if (session.module) syncModuleScratchpad(resolved, session);
  return session;
}

function isSessionExpired(session, now = Date.now()) {
  const t = Date.parse(session && session.expiresAt);
  return !Number.isNaN(t) && t < now;
}

/** Writes the human-readable `.mate/scratchpad-<module>.md` reflecting rolling summary + last K=5 raw findings. */
function syncModuleScratchpad(resolved, session) {
  if (!session || !session.module) return null;
  const p = scratchpadPath(resolved, session.module);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const recent = (session.events || []).slice(-RAW_EVENT_WINDOW_K);
  const lines = [
    `# 📝 M.A.T.E. Ephemeral Scratchpad: ${session.module}`,
    `> Flow: \`${session.flowId}\` | Active Stage: \`${session.activeStage}\` | Updated: ${session.updatedAt || new Date().toISOString()}`,
    `> Compacted Event IDs (${(session.compactedEventIds || []).length}): ${(session.compactedEventIds || []).slice(-10).join(', ') || 'none'}`,
    '',
    '## 3-Line Loss-Aware Rolling Summary',
    ...(session.summaryLines && session.summaryLines.length
      ? session.summaryLines.map((l, i) => `${i + 1}. ${l}`)
      : ['_No compacted prior stages yet._']),
    '',
    `## Last K=${RAW_EVENT_WINDOW_K} Raw Findings & Events`,
    ...(recent.length
      ? recent.map((e) => `- \`${e.id || 'evt'}\` [${e.ts}] (${e.stage}/${e.type}) ${e.message}`)
      : ['_No raw events recorded yet._']),
    '',
    '## Open Questions',
    ...(session.openQuestions && session.openQuestions.length
      ? session.openQuestions.slice(-5).map((q) => `- [TBD] ${q}`)
      : ['_None._']),
    '',
  ];
  fs.writeFileSync(p, lines.join('\n'), 'utf8');
  return p;
}

/**
 * Records a raw event in the session workbench. PII is redacted and injection payloads are rejected
 * before persistence. Count-based compaction triggers automatically when raw events exceed K=5.
 */
function recordEvent(targetDir, flowId, event) {
  const resolved = path.resolve(targetDir);
  const session = loadSession(resolved, flowId) || startSession(resolved, flowId, {});
  const message = String(event.message || '');
  const injection = detectInjection(message);
  if (injection.length > 0) {
    return { ok: false, reason: `Blocked potential prompt-injection payload: "${injection[0]}"`, session };
  }
  const redacted = redactPII(message);
  const seq = session.nextEventSeq || (session.events.length + (session.compactedEventCount || 0) + 1);
  session.nextEventSeq = seq + 1;
  const entry = {
    id: `evt-${String(seq).padStart(4, '0')}`,
    ts: new Date().toISOString(),
    stage: session.activeStage,
    type: event.type || 'note',
    message: redacted.text,
    redactions: redacted.count,
  };
  session.events.push(entry);
  if (event.file && !session.checkedFiles.includes(event.file)) {
    session.checkedFiles.push(event.file);
  }
  if (entry.type === 'finding' && event.fact) {
    const rawVal = event.fact.value !== undefined ? String(event.fact.value) : '';
    const factInj = detectInjection(`${event.fact.key || ''} ${rawVal}`);
    if (factInj.length > 0) {
      return { ok: false, reason: `Blocked prompt-injection payload in fact: "${factInj[0]}"`, session };
    }
    session.findings.push({
      ...event.fact,
      value: redactPII(rawVal).text,
      consolidated: false,
      stage: session.activeStage,
      ts: entry.ts,
    });
  }
  if (entry.type === 'question') session.openQuestions.push(redacted.text);

  // Count-based Compaction Trigger: > K=5 raw findings/events triggers rolling compaction.
  if (session.events.length > RAW_EVENT_WINDOW_K) {
    compactSession(session, 'count-trigger');
  }
  saveSession(resolved, session);
  syncModuleScratchpad(resolved, session);
  return { ok: true, event: entry, session };
}

/**
 * Loss-aware rolling compaction: older raw events collapse into at most 3 summary lines,
 * tracking compactedEventIds so verbose raw events are never resent, while retaining last K=5 raw events.
 */
function compactSession(session, reason = 'stage-complete') {
  if (!session.compactedEventIds) session.compactedEventIds = [];
  if (session.events.length <= RAW_EVENT_WINDOW_K && reason !== 'stage-complete' && reason !== 'manual') {
    return session;
  }
  const overflow = session.events.length > RAW_EVENT_WINDOW_K ? session.events.length - RAW_EVENT_WINDOW_K : 0;
  const dropped = overflow > 0 ? session.events.splice(0, overflow) : [];
  if (dropped.length > 0) {
    for (const d of dropped) {
      if (d.id && !session.compactedEventIds.includes(d.id)) session.compactedEventIds.push(d.id);
    }
    const byType = {};
    for (const e of dropped) byType[e.type] = (byType[e.type] || 0) + 1;
    const typeSummary = Object.entries(byType)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ');
    const highlight = dropped
      .filter((e) => e.type === 'finding' || e.type === 'decision')
      .slice(-2)
      .map((e) => e.message.slice(0, 80));
    session.summaryLines.push(
      `[${reason}] ${dropped[0].stage || session.activeStage}: ${dropped.length} events compacted (${typeSummary})${highlight.length ? ' — ' + highlight.join(' / ') : ''}`
    );
    session.compactedEventCount = (session.compactedEventCount || 0) + dropped.length;
  }
  while (session.summaryLines.length > MAX_SUMMARY_LINES) {
    const merged = `${session.summaryLines[0].slice(0, 120)} ⟶ ${session.summaryLines[1].slice(0, 120)}`;
    session.summaryLines.splice(0, 2, merged);
  }
  return session;
}

/** Compacts all active sessions (or a targeted flow/module) on demand (`npx mate-sdt context --compact`). */
function compactActiveSessions(targetDir, options = {}) {
  const resolved = path.resolve(targetDir);
  const compacted = [];
  for (const s of listSessions(resolved)) {
    if (options.flowId && s.flowId !== safeName(options.flowId)) continue;
    if (options.module && s.module && safeName(s.module) !== safeName(options.module)) continue;
    const before = s.events.length;
    compactSession(s, 'manual');
    saveSession(resolved, s);
    syncModuleScratchpad(resolved, s);
    compacted.push({ flowId: s.flowId, beforeEvents: before, afterEvents: s.events.length, summaryLines: s.summaryLines.length });
  }
  return compacted;
}

function validateHandoff(resolved, handoff) {
  const errors = [];
  if (!handoff || handoff.schema !== 'mate.handoff/v1') errors.push('schema must be "mate.handoff/v1"');
  for (const k of ['fromStage', 'toStage', 'module', 'digest']) {
    if (!handoff || typeof handoff[k] !== 'string' || handoff[k].trim() === '') errors.push(`missing "${k}"`);
  }
  for (const forbidden of ['transcript', 'messages', 'rawEvents', 'scratchpad', 'reasoning']) {
    if (handoff && Object.prototype.hasOwnProperty.call(handoff, forbidden)) {
      errors.push(`forbidden key "${forbidden}" (black-box handoff: raw history must stay private to the phase)`);
    }
  }
  if (handoff && estimateTokens(handoff.digest) > MAX_HANDOFF_DIGEST_TOKENS) {
    errors.push(`digest exceeds ${MAX_HANDOFF_DIGEST_TOKENS} tokens`);
  }
  if (handoff && !Array.isArray(handoff.artifacts)) errors.push('"artifacts" must be an array of on-disk paths');
  if (handoff && Array.isArray(handoff.artifacts)) {
    for (const a of handoff.artifacts) {
      if (typeof a !== 'string' || !fs.existsSync(path.resolve(resolved, a))) errors.push(`artifact not found on disk: ${a}`);
    }
  }
  if (handoff && detectInjection(handoff.digest).length > 0) errors.push('digest contains a prompt-injection payload');
  return { valid: errors.length === 0, errors };
}

/**
 * Completes a workflow stage (Event-Based Compaction Trigger): compacts the session, wipes the phase-private
 * scratchpad, and persists a schema-locked black-box handoff artifact for the next skill.
 */
function advanceStage(targetDir, flowId, toStage, options = {}) {
  const resolved = path.resolve(targetDir);
  const session = loadSession(resolved, flowId) || startSession(resolved, flowId, {});
  const fromStage = session.activeStage;
  const redactedDigest = redactPII(options.digest || '').text;
  const handoff = {
    schema: 'mate.handoff/v1',
    flowId: session.flowId,
    fromStage,
    toStage,
    module: options.module || session.module || '',
    createdAt: new Date().toISOString(),
    digest: redactedDigest,
    artifacts: options.artifacts || [],
    provenance: formatProvenance('OBSERVED', new Date().toISOString(), 0.8),
  };
  const check = validateHandoff(resolved, handoff);
  if (!check.valid) return { ok: false, errors: check.errors, session };

  compactSession(session, 'stage-complete');
  session.stages.push({ stage: fromStage, completedAt: handoff.createdAt, handoff: `${session.flowId}--${safeName(fromStage)}.json` });
  session.scratchpad = {}; // phase-private reasoning/tool-retry noise is never forwarded
  session.activeStage = toStage;
  if (options.module) session.module = options.module;
  saveSession(resolved, session);
  syncModuleScratchpad(resolved, session);
  writeJson(path.join(handoffsDir(resolved), `${session.flowId}--${safeName(fromStage)}.json`), handoff);
  return { ok: true, handoff, session };
}

function pruneExpiredSessions(targetDir) {
  const resolved = path.resolve(targetDir);
  const removed = [];
  for (const f of listFilesWithExt(sessionsDir(resolved), '.json')) {
    const s = readJson(f, null);
    if (!s || isSessionExpired(s)) {
      fs.rmSync(f, { force: true });
      removed.push(path.basename(f));
    }
  }
  return removed;
}

function listSessions(targetDir) {
  const resolved = path.resolve(targetDir);
  return listFilesWithExt(sessionsDir(resolved), '.json')
    .map((f) => readJson(f, null))
    .filter(Boolean);
}

function latestHandoff(resolved, flowId, moduleName) {
  const files = listFilesWithExt(handoffsDir(resolved), '.json');
  const candidates = files
    .map((f) => ({ f, data: readJson(f, null), mtime: fs.statSync(f).mtimeMs }))
    .filter((x) => x.data && (!flowId || x.data.flowId === safeName(flowId)))
    .filter((x) => !moduleName || !x.data.module || safeName(x.data.module) === safeName(moduleName))
    .sort((a, b) => b.mtime - a.mtime);
  return candidates.length ? candidates[0] : null;
}

// ───────────────────── Memory Layer scaffolding & scoring ─────────────────────

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

function moduleTier(resolved, moduleName) {
  const strategy = readText(path.join(resolved, 'docs', 'TEST-STRATEGY.md'));
  if (!strategy || !moduleName) return null;
  const mod = moduleName.toLowerCase();
  for (const line of strategy.split(/\r?\n/)) {
    if (line.toLowerCase().includes(mod)) {
      const m = line.match(/\bP([012])\b/);
      if (m) return `P${m[1]}`;
    }
  }
  return null;
}

function importanceOf(line, defaultTier) {
  const m = line.match(/\bP([012])\b/) || (defaultTier ? defaultTier.match(/P([012])/) : null);
  if (!m) return 0.5;
  return { 0: 1, 1: 0.66, 2: 0.33 }[m[1]];
}

/** Blended retrieval score: Relevance (0.5) + Recency (0.2) + Importance (0.3). */
function scoreEntry(line, moduleName, tags, fileMtimeMs, defaultTier, now = Date.now()) {
  const lower = line.toLowerCase();
  const mod = (moduleName || '').toLowerCase();
  let relevance = 0;
  if (mod && lower.includes(mod)) relevance = 1;
  else if (tags.some((t) => lower.includes(t))) relevance = 0.5;
  const ts = (line.match(/\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?/) || [])[0];
  const age = ts ? ageInDays(ts, now) : Math.max(0, (now - fileMtimeMs) / 86400000);
  const recency = Math.pow(0.5, (age === null ? 30 : age) / 30);
  const importance = importanceOf(line, defaultTier);
  return { score: 0.5 * relevance + 0.2 * recency + 0.3 * importance, relevance, recency, importance };
}

function mapEntries(content) {
  const entries = [];
  let section = '';
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,4}\s/.test(line)) {
      section = line.replace(/^#+\s*/, '');
      continue;
    }
    if (/^\s*[-*]\s+\S/.test(line) || (/^\|/.test(line) && !/^\|\s*:?-{2,}/.test(line) && !/^\|\s*(\*\*)?(Module Name|Operation|Key)\b/i.test(line))) {
      entries.push({ section, line: line.trim() });
    }
  }
  return entries;
}

function selectMemorySlice(resolved, moduleName, now = Date.now()) {
  const tags = (moduleName || '').toLowerCase().split(/[-_\s]+/).filter((t) => t.length >= 3);
  const tier = moduleTier(resolved, moduleName);
  const picked = [];

  const mapFile = path.join(resolved, 'MATE-PROJECT-MAP.md');
  if (fs.existsSync(mapFile)) {
    const mtime = fs.statSync(mapFile).mtimeMs;
    for (const e of mapEntries(readText(mapFile))) {
      const s = scoreEntry(e.line, moduleName, tags, mtime, tier, now);
      if (s.relevance > 0 || s.importance >= 1) picked.push({ source: 'MATE-PROJECT-MAP.md', section: e.section, text: e.line, ...s });
    }
  }
  const playbookFile = path.join(resolved, '.mate', 'memory', 'procedural-playbooks.md');
  if (fs.existsSync(playbookFile)) {
    const mtime = fs.statSync(playbookFile).mtimeMs;
    const sections = readText(playbookFile).split(/^## /m).slice(1);
    for (const sec of sections) {
      const title = sec.split(/\r?\n/)[0];
      const s = scoreEntry(sec, moduleName, tags, mtime, tier, now);
      const concrete = !/\[TBD\]/.test(sec);
      if (s.relevance > 0 || concrete) picked.push({ source: '.mate/memory/procedural-playbooks.md', section: title, text: `## ${sec.trim()}`, ...s });
    }
  }
  picked.sort((a, b) => b.score - a.score);
  const kept = [];
  let used = 0;
  for (const p of picked) {
    const t = estimateTokens(p.text);
    if (used + t > MAP_SLICE_TOKEN_BUDGET) continue;
    kept.push(p);
    used += t;
  }
  return { entries: kept, tokens: used, tier };
}

// ─────────────────── Multimodal → Textual compression ───────────────────

function compressAriaSnapshot(text, tokenBudget = ARIA_SNAPSHOT_TOKEN_BUDGET) {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim() !== '');
  const out = [];
  let used = 0;
  for (const l of lines) {
    const t = estimateTokens(l) + 1;
    if (used + t > tokenBudget) {
      out.push(`# … truncated (${lines.length - out.length} more nodes; re-run \`playwright-cli snapshot\` scoped to the region)`);
      break;
    }
    out.push(l);
    used += t;
  }
  return out.join('\n');
}

function digestHar(harText, moduleName, maxEntries = 15) {
  let har;
  try {
    har = JSON.parse(harText);
  } catch {
    return null;
  }
  const entries = (har && har.log && har.log.entries) || [];
  const mod = (moduleName || '').toLowerCase();
  const rows = [];
  for (const e of entries) {
    const req = e.request || {};
    const res = e.response || {};
    let urlPath = req.url || '';
    try {
      urlPath = new URL(req.url).pathname;
    } catch {
      /* keep raw */
    }
    if (!/^(GET|POST|PUT|PATCH|DELETE)$/i.test(req.method || '')) continue;
    if (/\.(png|jpe?g|gif|svg|css|woff2?|ico|map)(\?|$)/i.test(urlPath)) continue;
    if (mod && !urlPath.toLowerCase().includes(mod) && !/\/api\//i.test(urlPath)) continue;
    rows.push(`- ${req.method} ${urlPath} → ${res.status}${res.content && res.content.mimeType ? ` (${res.content.mimeType.split(';')[0]})` : ''}`);
    if (rows.length >= maxEntries) break;
  }
  return rows.length ? rows.join('\n') : '_No contract-relevant requests in HAR._';
}

function openApiPaths(resolved, moduleName) {
  const mod = (moduleName || '').toLowerCase();
  const files = [
    ...['openapi.json', 'openapi.yaml', 'openapi.yml', 'swagger.json', 'swagger.yaml'].map((n) => path.join(resolved, n)),
    ...listFilesWithExt(path.join(resolved, 'docs'), ['openapi.json', 'openapi.yaml', 'openapi.yml', 'swagger.json']),
    ...listFilesWithExt(path.join(resolved, 'specs'), ['openapi.json', 'openapi.yaml', 'openapi.yml']),
  ].filter((f) => fs.existsSync(f));
  const out = [];
  for (const f of files) {
    const text = readText(f);
    const matches = text.match(/["']?\/[A-Za-z0-9_\-/{}.]+["']?\s*:/g) || [];
    for (const m of matches) {
      const p = m.replace(/["':\s]/g, '');
      if (mod && p.toLowerCase().includes(mod)) out.push(`${rel(resolved, f)} → ${p}`);
    }
  }
  return [...new Set(out)].slice(0, 12);
}

// ───────────────────── Phase tables & few-shot library ─────────────────────

const COMMON_GUARDRAILS = [
  'Zero arbitrary sleeps (`waitForTimeout`/`sleep`); use auto-retrying web assertions.',
  'Anti-Greenwashing: never weaken an assertion to go green; keep failing tests with `test.fail(true, "BUG-XXX")` + `docs/bugs/BUG-*.md`.',
  'Epistemic hygiene & Precedence: `[BOOTSTRAPPED]` > `[OBSERVED | ts]` > `MATE-PROJECT-MAP.md` > Legacy code. Never build tests on `[INFERRED]`/`[TBD]`.',
];

const PHASES = {
  story: {
    skills: ['mate-story-testcases'],
    rules: ['Classify every case: AUTOMATE_UI | AUTOMATE_API | MANUAL_TEST | EXPLORATORY_CHARTER with rationale.', 'Cover 4 quadrants: HAPPY_PATH, BORDER_CASE, NEGATIVE_PATH, STATE_TRANSITION.'],
    tools: ['npx mate-sdt cases <module>', 'Jira/Notion MCP (read-only story ingestion)'],
    blocks: ['invariants'],
    fewshots: ['invariant-oracle'],
    outputSchema: '`docs/test-cases/TC-<module>.md` & `.csv` (with `TC_ID`, quadrant, classification, rationale).',
  },
  recon: {
    skills: ['mate-pw-recon'],
    rules: ['Ground every locator via live `@playwright/cli` snapshot; never guess DOM.', 'Compress snapshots to <= 800 tokens; promote corroborated locators via `--consolidate`.'],
    tools: ['playwright-cli open <url>', 'playwright-cli snapshot', 'playwright-cli eval'],
    blocks: [],
    fewshots: ['aria-to-locator'],
    outputSchema: 'Compact YAML ARIA snapshot in `.mate/snapshots/` + `[OBSERVED | ts]` session findings.',
  },
  model: {
    skills: ['mate-model'],
    rules: ['Every `<intent_model>` needs explicit Forbidden Transitions.', 'Invariants are executable oracles with IDs (`INV-xx`), not prose.'],
    tools: ['npx mate-sdt validate'],
    blocks: ['intent_model', 'invariants'],
    fewshots: ['fsm-intent-model', 'forbidden-transition'],
    outputSchema: '`specs/<module>.mate-spec.md` with `<intent_model>`, `<invariants>`, `<threat_scenarios>`, `<exploratory_charters>`.',
  },
  codegen: {
    skills: ['mate-assert-playwright', 'mate-pw-codegen'],
    rules: ['SOLID: `BasePage`/`BaseComponent`/`BaseApiClient`; inject via `test.extend()` fixtures (DIP).', 'Anti-Bloated Page Objects (`MATE-ANTI-07`): parameterized `assertAlertMessage(expected)` + public `readonly Locator`s.'],
    tools: ['npx playwright test', 'npx mate-sdt audit', 'npx mate-sdt gate'],
    blocks: ['intent_model', 'invariants'],
    fewshots: ['dip-fixture', 'parameterized-assert'],
    outputSchema: '`src/pages/*.page.ts`, `src/components/*.component.ts`, `src/fixtures/*.ts`, `tests/e2e/*.spec.ts`.',
  },
  api: {
    skills: ['mate-assert-api'],
    rules: ['Typed API clients; assert schema + business invariants, never `toBeDefined()` alone.'],
    tools: ['npx playwright test --project=api'],
    blocks: ['invariants'],
    fewshots: ['api-contract'],
    outputSchema: '`src/api/*.client.ts`, `src/models/*.ts`, `tests/api/*.spec.ts`.',
  },
  threat: {
    skills: ['mate-threat'],
    rules: ['Mutation score >= 85% via Stryker in rootless Podman (never Docker).', 'BOLA/IDOR: assert cross-tenant isolation with distinct role fixtures.'],
    tools: ['npx mate-sdt mutate', 'npx playwright test --project=threats'],
    blocks: ['threat_scenarios', 'invariants'],
    fewshots: ['threat-idempotency', 'test-fail-bug'],
    outputSchema: '`tests/threats/*.spec.ts` + Stryker mutation digest (>= 85%).',
  },
  performance: {
    skills: ['mate-performance-k6'],
    rules: ['Encode SLAs as `<performance_oracles>`; run k6 in rootless Podman.'],
    tools: ['npx mate-sdt k6 <script>'],
    blocks: ['performance_oracles'],
    fewshots: ['k6-oracle'],
    outputSchema: '`tests/nfr/*.k6.js` + P95/error-rate SLA verdict.',
  },
  explore: {
    skills: ['mate-explore'],
    rules: ['Charters are time-boxed with mission, areas, and risks; waivers require named sign-off.'],
    tools: ['npx mate-sdt charter <module>', 'npx mate-sdt waiver <module>'],
    blocks: ['exploratory_charters', 'invariants'],
    fewshots: ['exploratory-charter'],
    outputSchema: '`tests/charters/CHR-*.md` and signed `specs/waivers/WVR-*.md`.',
  },
  triage: {
    skills: ['mate-triage'],
    rules: ['Bug reports live in `docs/bugs/` (never `tests/`); link to `INV`/`TC` ids.'],
    tools: ['npx mate-sdt bug <module>'],
    blocks: ['invariants'],
    fewshots: ['test-fail-bug'],
    outputSchema: '`docs/bugs/BUG-*.md` + `test.fail(true, "BUG-XXX")` marker.',
  },
  'ai-eval': {
    skills: ['mate-ai-dataset', 'mate-ai-evals', 'mate-ai-redteam', 'mate-ai-observability'],
    rules: ['Evaluate memory in 3 layers: generation (P/R/F1), retrieval (Recall@K + P95 <= 200ms), end-to-end + red-team.'],
    tools: ['npx mate-sdt dataset <module>', 'npx promptfoo eval', 'pytest (DeepEval)'],
    blocks: ['performance_oracles', 'threat_scenarios'],
    fewshots: ['memory-golden-fact'],
    outputSchema: '`tests/ai-evals/datasets/DS-<module>.json` + Promptfoo/DeepEval/OTel verdicts.',
  },
};

const FEWSHOTS = {
  'fsm-intent-model': '```xml\n<intent_model>\n  <state id="DRAFT"/><state id="CONFIRMED"/><state id="DELIVERED"/>\n  <transition from="DRAFT" to="CONFIRMED" guard="items>0"/>\n  <forbidden from="DELIVERED" to="DRAFT" reason="INV-03 immutability"/>\n</intent_model>\n```',
  'invariant-oracle': '```xml\n<invariants>\n  <invariant id="INV-01" oracle="order.items.length > 0">Order must contain at least one item</invariant>\n</invariants>\n```',
  'forbidden-transition': '```xml\n<forbidden from="CANCELLED" to="CONFIRMED" reason="Cancelled orders are terminal"/>\n```',
  'aria-to-locator': '```yaml\n- textbox "Email"  →  page.getByLabel("Email")\n- button "Sign in" →  page.getByRole("button", { name: "Sign in" })\n```',
  'dip-fixture': '```ts\nexport const test = base.extend<{ loginPage: LoginPage }>({\n  loginPage: async ({ page }, use) => use(new LoginPage(page)),\n});\n```',
  'parameterized-assert': '```ts\n// Page Object: structure only; expected copy lives in the test\nreadonly errorBanner = this.page.getByRole("alert");\nasync assertAlertMessage(expected: string | RegExp) { await expect(this.errorBanner).toHaveText(expected); }\n```',
  'test-fail-bug': '```ts\ntest("INV-07 duplicate email is rejected", async ({ registerPage }) => {\n  test.fail(true, "BUG-20260101-register: server accepts duplicate email");\n  // keep the TRUE assertion\n});\n```',
  'threat-idempotency': '```ts\nconst [a, b] = await Promise.all([api.pay(id, key), api.pay(id, key)]);\nexpect(await api.paymentCount(id)).toBe(1); // idempotency oracle\n```',
  'k6-oracle': '```xml\n<performance_oracles>\n  <oracle id="ORA-PERF" metric="http_req_duration" p95="<=400ms" load="200rps"/>\n</performance_oracles>\n```',
  'exploratory-charter': '```md\n**Charter:** Explore checkout with expired cards to discover silent failures.\n**Time-box:** 45 min | **Heuristic:** RST FEW HICCUPPS\n```',
  'api-contract': '```ts\nconst res = await api.getOrder(id);\nexpect(res.status()).toBe(200);\nexpect(OrderSchema.safeParse(await res.json()).success).toBe(true);\n```',
  'memory-golden-fact': '```json\n{ "id": "GM-001", "fact": "User prefers metric units", "op": "CREATE", "scope": "user:42", "provenance": "[USER_EXPLICIT]" }\n```',
};

function inferPhase(resolved, moduleName, session) {
  if (session && session.activeStage && PHASES[session.activeStage]) return session.activeStage;
  if (session && session.activeStage) {
    const alias = {
      'mate-pw-recon': 'recon',
      'mate-model': 'model',
      'mate-pw-codegen': 'codegen',
      'mate-threat': 'threat',
      'mate-explore': 'explore',
      'mate-triage': 'triage',
      'mate-strategy': 'story',
      'mate-story-testcases': 'story',
      'mate-assert-api': 'api',
      'mate-performance-k6': 'performance',
    };
    if (alias[session.activeStage]) return alias[session.activeStage];
  }
  const specs = listFilesWithExt(path.join(resolved, 'specs'), '.mate-spec.md').filter((f) =>
    path.basename(f).toLowerCase().includes(safeName(moduleName))
  );
  return specs.length ? 'codegen' : 'recon';
}

// ───────────────────── 3-Bucket / 7-Layer JIT Context Pack ─────────────────────

function buildJitContextPack(resolved, moduleName, options = {}) {
  const cfg = loadConfig(resolved);
  const safeMod = safeName(moduleName);
  const flowId = options.flowId || null;
  const session = flowId
    ? loadSession(resolved, flowId)
    : listSessions(resolved)
        .filter((s) => !isSessionExpired(s) && (!s.module || safeName(s.module) === safeMod))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0] || null;
  const phaseKey = options.phase && PHASES[options.phase] ? options.phase : inferPhase(resolved, safeMod, session);
  const phase = PHASES[phaseKey];
  const specFiles = listFilesWithExt(path.join(resolved, 'specs'), '.mate-spec.md').filter((f) =>
    path.basename(f).toLowerCase().includes(safeMod)
  );

  // ── Bucket 1: Context to Guide Reasoning (Layers 1–3) ──
  const bucket1 = [
    '## 1️⃣ Bucket 1 — Context to Guide Reasoning',
    '',
    `**Active phase:** \`${phaseKey}\` | **Active skills:** ${phase.skills.map((s) => `\`${s}\``).join(', ')}`,
    '',
    '### Layer 1: System Instructions & Guardrails (active skills only)',
    ...[...phase.rules, ...COMMON_GUARDRAILS].map((r) => `- ${r}`),
    '',
    '### Layer 2: Scoped Tool Definitions (current phase only)',
    ...phase.tools.map((t) => `- \`${t}\``),
    '',
    '### Layer 3: Dynamic Few-Shot Examples (1–2, matched to the active pillar)',
    ...phase.fewshots.map((id) => `**${id}**\n${FEWSHOTS[id]}`),
    '',
  ].join('\n');

  // ── Bucket 2: Evidential & Factual Data (Layers 4–5) ──
  const slice = selectMemorySlice(resolved, moduleName);
  const bucket2Parts = [
    '## 2️⃣ Bucket 2 — Evidential & Factual Data',
    '',
    '### Layer 4: Retrieved Facts & External Knowledge (spec XML blocks + OpenAPI slice)',
  ];
  if (specFiles.length === 0) {
    bucket2Parts.push(`_No spec found matching '${safeMod}'. Run \`mate-model\` to create \`specs/${safeMod}.mate-spec.md\`._`);
  } else {
    for (const f of specFiles) {
      const content = readText(f);
      const wanted = phase.blocks.length ? phase.blocks : ['invariants'];
      const blocks = wanted.map((b) => extractXmlBlock(content, b)).filter(Boolean);
      bucket2Parts.push(`_${rel(resolved, f)}_`);
      bucket2Parts.push(blocks.length ? blocks.join('\n\n') : '_No matching XML blocks for this phase._');
    }
  }
  const apiPaths = openApiPaths(resolved, safeMod);
  if (apiPaths.length) bucket2Parts.push('', '**Target OpenAPI paths:**', ...apiPaths.map((p) => `- ${p}`));

  bucket2Parts.push(
    '',
    `### Layer 5: Long-Term Declarative & Procedural Memory + Multimodal-to-Textual (tier: ${slice.tier || 'n/a'} | score = 0.5·Relevance + 0.2·Recency + 0.3·Importance)`,
    slice.entries.length
      ? slice.entries
          .map((e) => `- _(${e.source} › ${e.section || 'root'} | score ${e.score.toFixed(2)})_ ${e.text.replace(/\n/g, ' ').slice(0, 400)}`)
          .join('\n')
      : `_No memory entries matched this module. Run \`mate-pw-recon\` then \`npx mate-sdt context ${moduleName || '<module>'} --consolidate\`._`,
    ''
  );

  const snapFiles = [
    ...listFilesWithExt(path.join(resolved, '.mate', 'snapshots'), ['.yml', '.yaml', '.md', '.txt']),
    ...listFilesWithExt(path.join(resolved, '.playwright-cli'), ['.yml', '.yaml']),
  ].filter((f) => path.basename(f).toLowerCase().includes(safeMod));
  if (snapFiles.length) {
    const newest = snapFiles.map((f) => ({ f, m: fs.statSync(f).mtimeMs })).sort((a, b) => b.m - a.m)[0].f;
    const snap = redactPII(compressAriaSnapshot(readText(newest), cfg.ariaSnapshotCeiling)).text;
    bucket2Parts.push(
      `_ARIA snapshot ${rel(resolved, newest)} — short-term session cache (\`[OBSERVED | ${new Date(fs.statSync(newest).mtimeMs).toISOString()}]\`), not yet corroborated:_`,
      '```yaml',
      snap,
      '```'
    );
  } else {
    bucket2Parts.push('_No ARIA snapshot cached for this module._');
  }
  const harFiles = [
    ...listFilesWithExt(path.join(resolved, '.mate'), '.har'),
    ...listFilesWithExt(path.join(resolved, '.playwright-cli'), '.har'),
  ].filter((f) => path.basename(f).toLowerCase().includes(safeMod));
  if (harFiles.length) {
    const digest = digestHar(readText(harFiles[0], 8 * 1024 * 1024), moduleName);
    if (digest) bucket2Parts.push(`_Network contract digest (${rel(resolved, harFiles[0])}, bodies/cookies stripped):_`, redactPII(digest).text);
  }

  const ho = latestHandoff(resolved, flowId || (session && session.flowId), moduleName);
  bucket2Parts.push('', '**Previous-Phase Black-Box Handoff Digest:**');
  if (ho) {
    const check = validateHandoff(resolved, ho.data);
    bucket2Parts.push(
      check.valid
        ? `- **${ho.data.fromStage} → ${ho.data.toStage}** ${ho.data.provenance}: ${ho.data.digest}\n- Artifacts: ${(ho.data.artifacts || []).map((a) => `\`${a}\``).join(', ') || '_none_'}`
        : `- ⚠️ Handoff rejected (schema-locked): ${check.errors.join('; ')}`
    );
  } else {
    bucket2Parts.push('_No upstream handoff. This phase starts from on-disk artifacts only._');
  }
  const bucket2 = bucket2Parts.join('\n') + '\n';

  // ── Bucket 3: Immediate Conversational & Working State (Layers 6–7) ──
  const harnessState = readJson(path.join(resolved, '.mate', 'harness-state.json'), null);
  const scratchpadFile = scratchpadPath(resolved, safeMod);
  const bucket3Parts = [
    '## 3️⃣ Bucket 3 — Immediate Conversational & Working State',
    '',
    '### Layer 6: Short-Term Notes, Rolling Summary & Working Scratchpad',
  ];
  if (session) {
    bucket3Parts.push(
      session.summaryLines.length ? session.summaryLines.map((l, i) => `${i + 1}. ${l}`).join('\n') : '_No compacted history yet._',
      '',
      `**Last K=${RAW_EVENT_WINDOW_K} raw findings/events** _(compacted IDs: ${(session.compactedEventIds || []).length})_:`,
      session.events.slice(-RAW_EVENT_WINDOW_K).map((e) => `- \`${e.id || 'evt'}\` [${e.ts}] (${e.stage}/${e.type}) ${e.message}`).join('\n') || '_none_'
    );
  } else if (fs.existsSync(scratchpadFile)) {
    bucket3Parts.push(readText(scratchpadFile).slice(0, 1500));
  } else {
    bucket3Parts.push(`_No active session. Start one with \`npx mate-sdt session start <flow-id> --module ${moduleName || '<module>'}\`._`);
  }
  bucket3Parts.push('', '**Harness Gate State:**');
  if (harnessState) {
    bucket3Parts.push(`- Gates: ${(harnessState.gates || []).map((g) => `${g.id}=${g.passed ? 'PASS' : 'FAIL'}`).join(', ') || 'n/a'} (as of ${harnessState.timestamp})`);
    for (const p of (harnessState.selfCorrectionPrompts || []).slice(0, 5)) bucket3Parts.push(`- ${p}`);
  } else {
    bucket3Parts.push('- _No harness-state.json yet. Run `npx mate-sdt gate`._');
  }
  if (session && session.openQuestions.length) {
    bucket3Parts.push('', '**Open questions:**', ...session.openQuestions.slice(-5).map((q) => `- ${q}`));
  }
  bucket3Parts.push(
    '',
    '### Layer 7: User Input & Output Schema Contract',
    `- **Active Task:** ${options.task || (session && session.activeTask) || `_Not set. Pass --task "<current /mate-flow-* step or user story objective>"._`}`,
    `- **Required Output Schema:** ${phase.outputSchema}`,
    ''
  );
  const bucket3 = bucket3Parts.join('\n');

  const header = [
    `# 🧠 M.A.T.E. Just-In-Time (JIT) Context Pack: ${moduleName}`,
    `> Generated ${new Date().toISOString()} | 3-Bucket / 7-Layer payload | Phase: \`${phaseKey}\` | Loop: WRITE + SELECT + COMPRESS + ISOLATE`,
    `> Precedence (Anti-Clash): 1. Approved specs (*.mate-spec.md [BOOTSTRAPPED]) > 2. Fresh [OBSERVED | ts] > 3. MATE-PROJECT-MAP.md > 4. Legacy code.`,
    '',
  ].join('\n');

  const redacted = redactPII(`${header}${bucket1}\n${bucket2}\n${bucket3}`);
  const markdown = redacted.text;
  return {
    markdown,
    tokens: estimateTokens(markdown),
    ceiling: cfg.contextPackCeiling,
    phase: phaseKey,
    bucketTokens: {
      bucket1: estimateTokens(bucket1),
      bucket2: estimateTokens(bucket2),
      bucket3: estimateTokens(bucket3),
    },
    redactions: redacted.count,
    sessionFlowId: session ? session.flowId : null,
  };
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
    // Format: - [OBSERVED | 2026-11-13T...] locator:login = getByRole('button')
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

  // Gather candidate facts: explicit --facts file + scratchpad findings + unconsolidated session findings.
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

module.exports = {
  RAW_EVENT_WINDOW_K,
  MAP_TOKEN_BUDGET,
  ARIA_SNAPSHOT_TOKEN_BUDGET,
  TRUST_RANK,
  PHASES,
  FEWSHOTS,
  estimateTokens,
  redactPII,
  detectPII,
  detectInjection,
  parseProvenance,
  formatProvenance,
  extractXmlBlock,
  loadConfig,
  startSession,
  loadSession,
  recordEvent,
  compactSession,
  compactActiveSessions,
  advanceStage,
  validateHandoff,
  pruneExpiredSessions,
  listSessions,
  isSessionExpired,
  ensureMemoryScaffold,
  selectMemorySlice,
  compressAriaSnapshot,
  digestHar,
  buildJitContextPack,
  consolidateMemory,
  runContextHygieneChecks,
};
