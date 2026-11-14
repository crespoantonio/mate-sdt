'use strict';

/**
 * M.A.T.E. Session Workbench Engine (Ephemeral Sessions, Rolling Compaction & Black-Box Handoffs)
 *
 *  - Session Layer (ephemeral workbench):
 *      .mate/sessions/<flow-id>.json
 *      .mate/scratchpad-<module>.md
 *      .mate/handoffs/<flow-id>--<stage>.json
 *
 * Zero runtime dependencies: native Node.js built-ins only.
 */

const fs = require('node:fs');
const path = require('node:path');

const RAW_EVENT_WINDOW_K = 5;
const DEFAULT_SESSION_TTL_HOURS = 24;
const MAX_SUMMARY_LINES = 3;
const MAX_HANDOFF_DIGEST_TOKENS = 500;

function safeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

function isSessionExpired(session, now = Date.now()) {
  const t = Date.parse(session && session.expiresAt);
  return !Number.isNaN(t) && t < now;
}

function loadSession(targetDir, flowId) {
  const resolved = path.resolve(targetDir);
  return readJson(sessionPath(resolved, flowId), null);
}

function saveSession(resolved, session) {
  session.updatedAt = new Date().toISOString();
  writeJson(sessionPath(resolved, session.flowId), session);
}

/**
 * Starts or retrieves an active session for the specified flow.
 */
function startSession(targetDir, flowId, options = {}) {
  const resolved = path.resolve(targetDir);
  const cfg = readJson(path.join(resolved, '.mate', 'config.json'), {}) || {};
  const ttlHours = Number(options.ttlHours) || Number(cfg.sessionTtlHours) || DEFAULT_SESSION_TTL_HOURS;
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

/**
 * Writes the human-readable `.mate/scratchpad-<module>.md` reflecting rolling summary + last K=5 raw findings.
 */
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

/**
 * Compacts all active sessions (or a targeted flow/module) on demand (`npx mate-sdt context --compact`).
 */
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

/**
 * Records a raw event in the session workbench. PII is redacted and injection payloads are rejected
 * before persistence. Count-based compaction triggers automatically when raw events exceed K=5.
 */
function recordEvent(targetDir, flowId, event, helperFns = {}) {
  const resolved = path.resolve(targetDir);
  const { redactPII, detectInjection } = helperFns;
  const session = loadSession(resolved, flowId) || startSession(resolved, flowId, {});
  const message = String(event.message || '');
  const injection = detectInjection ? detectInjection(message) : [];
  if (injection.length > 0) {
    return { ok: false, reason: `Blocked potential prompt-injection payload: "${injection[0]}"`, session };
  }
  const redacted = redactPII ? redactPII(message) : { text: message, count: 0 };
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
    const factInj = detectInjection ? detectInjection(`${event.fact.key || ''} ${rawVal}`) : [];
    if (factInj.length > 0) {
      return { ok: false, reason: `Blocked prompt-injection payload in fact: "${factInj[0]}"`, session };
    }
    session.findings.push({
      ...event.fact,
      value: redactPII ? redactPII(rawVal).text : rawVal,
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

function validateHandoff(resolved, handoff, helperFns = {}) {
  const { estimateTokens = (t) => Math.ceil((t || '').length / 4), detectInjection = () => [] } = helperFns;
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
function advanceStage(targetDir, flowId, toStage, options = {}, helperFns = {}) {
  const resolved = path.resolve(targetDir);
  const { redactPII = (t) => ({ text: t, count: 0 }), formatProvenance } = helperFns;
  const session = loadSession(resolved, flowId) || startSession(resolved, flowId, {});
  const fromStage = session.activeStage;
  const redactedDigest = redactPII(options.digest || '').text;
  const provStr = formatProvenance ? formatProvenance('OBSERVED', new Date().toISOString(), 0.8) : '[OBSERVED]';
  const handoff = {
    schema: 'mate.handoff/v1',
    flowId: session.flowId,
    fromStage,
    toStage,
    module: options.module || session.module || '',
    createdAt: new Date().toISOString(),
    digest: redactedDigest,
    artifacts: options.artifacts || [],
    provenance: provStr,
  };
  const check = validateHandoff(resolved, handoff, helperFns);
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

module.exports = {
  RAW_EVENT_WINDOW_K,
  DEFAULT_SESSION_TTL_HOURS,
  MAX_SUMMARY_LINES,
  MAX_HANDOFF_DIGEST_TOKENS,
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
  recordEvent,
  validateHandoff,
  advanceStage,
  pruneExpiredSessions,
  listSessions,
  latestHandoff,
};
