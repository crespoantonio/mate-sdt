'use strict';

/**
 * M.A.T.E. JIT Context Engineering Engine (3-Bucket / 7-Layer Pack Builder)
 *
 *  - Bucket 1: Context to Guide Reasoning (Layers 1–3: Guardrails, Tools, Few-Shots)
 *  - Bucket 2: Evidential & Factual Data (Layers 4–5: Specs, OpenAPI, Living Map, ARIA/HAR digests)
 *  - Bucket 3: Immediate Conversational & Working State (Layers 6–7: Scratchpad, Gates, Task/Schema)
 *
 * Zero runtime dependencies: native Node.js built-ins only.
 */

const fs = require('node:fs');
const path = require('node:path');

const {
  RAW_EVENT_WINDOW_K,
  safeName,
  listFilesWithExt,
  readJson,
  scratchpadPath,
  isSessionExpired,
  loadSession,
  listSessions,
  latestHandoff,
  validateHandoff,
} = require('./sessions');

const MAP_TOKEN_BUDGET = 3000;
const ARIA_SNAPSHOT_TOKEN_BUDGET = 800;
const DEFAULT_PACK_TOKEN_CEILING = 12000;
const MAP_SLICE_TOKEN_BUDGET = 1200;

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
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

function rel(resolved, file) {
  return path.relative(resolved, file).replace(/\\/g, '/');
}

function loadConfig(resolved) {
  const cfg = readJson(path.join(resolved, '.mate', 'config.json'), {}) || {};
  return {
    contextPackCeiling: Number(cfg.contextPackCeiling) || DEFAULT_PACK_TOKEN_CEILING,
    ariaSnapshotCeiling: Number(cfg.ariaSnapshotCeiling) || ARIA_SNAPSHOT_TOKEN_BUDGET,
  };
}

function ageInDays(timestamp, now = Date.now()) {
  const t = Date.parse(timestamp || '');
  if (Number.isNaN(t)) return null;
  return Math.max(0, (now - t) / 86400000);
}

function extractXmlBlock(content, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?</${tag}>`, 'i');
  const m = (content || '').match(re);
  return m ? m[0] : null;
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
    rules: ['Every threat scenario references STRIDE + an executable invariant or security assertion.', 'Rootless Podman for Stryker mutation testing (>= 85% mutation score threshold).'],
    tools: ['npx mate-sdt mutate', 'npx playwright test --project=threats'],
    blocks: ['threat_scenarios', 'invariants'],
    fewshots: ['threat-idempotency'],
    outputSchema: '`tests/threats/*.spec.ts` + updated `stryker.config.json`.',
  },
  performance: {
    skills: ['mate-performance-k6'],
    rules: ['Non-functional SLA oracles (p95, error rate, RPS); run in rootless Podman.'],
    tools: ['npx mate-sdt k6 <script>', 'podman run ... grafana/k6'],
    blocks: ['performance_oracles'],
    fewshots: ['k6-oracle'],
    outputSchema: '`tests/nfr/*.k6.js` (with thresholds for p95 < 400ms, http_req_failed < 1%).',
  },
  explore: {
    skills: ['mate-explore'],
    rules: ['Session-Based Test Management (SBTM); time-boxed charters with heuristics (FEW HICCUPPS).', 'File bugs under `docs/bugs/BUG-*.md` or formal waivers under `specs/waivers/WVR-*.md`.'],
    tools: ['npx mate-sdt charter <module>', 'npx mate-sdt waiver <module>'],
    blocks: ['exploratory_charters'],
    fewshots: ['exploratory-charter'],
    outputSchema: '`tests/charters/CHR-*.md` with bug notes and risk observations.',
  },
  triage: {
    skills: ['mate-triage'],
    rules: ['5-class triage: LOCATOR_DRIFT | TIMING | APP_BUG | ENV | SPEC_FLAW.', 'Sanitize stack traces into <error_digest> <= 400t; auto-classify and invoke self-healing via `npx mate-sdt heal`.'],
    tools: ['npx mate-sdt heal', 'npx mate-sdt bug <module>'],
    blocks: ['invariants'],
    fewshots: ['invariant-oracle'],
    outputSchema: '`docs/bugs/BUG-*.md` + self-healing patch plan or Playwright trace link.',
  },
  ai: {
    skills: ['mate-ai-dataset', 'mate-ai-evals', 'mate-ai-redteam', 'mate-ai-observability'],
    rules: ['Ground evals in golden datasets; score via Promptfoo / DeepEval.', 'Audit OpenTelemetry/OpenInference spans for token, tool, and latency invariants.'],
    tools: ['npx promptfoo eval', 'deepeval test run', 'npx mate-sdt dataset'],
    blocks: ['invariants'],
    fewshots: ['memory-golden-fact'],
    outputSchema: '`tests/ai-evals/promptfoo/promptfooconfig.yaml`, `tests/ai-evals/datasets/DS-*.json`.',
  },
};

const FEWSHOTS = {
  'aria-to-locator': '```yaml\n# Live ARIA snapshot fragment:\n- button "Place Order" [disabled]\n```\n→ `this.placeOrderButton = page.getByRole(\'button\', { name: \'Place Order\' });`',
  'fsm-intent-model': '```mermaid\nstateDiagram-v2\n  [*] --> Cart\n  Cart --> Checkout: proceed\n  Checkout --> Confirmed: pay\n```',
  'forbidden-transition': '```xml\n<forbidden_transitions>\n  <transition from="Confirmed" to="Checkout" reason="Cannot re-enter checkout once paid"/>\n</forbidden_transitions>\n```',
  'invariant-oracle': '```ts\n// INV-01: Total equals sum of line items + tax\nexpect(order.total).toBe(order.subtotal + order.tax);\n```',
  'dip-fixture': '```ts\nexport const test = base.extend<{ orderPage: OrderPage }>({\n  orderPage: async ({ page }, use) => { await use(new OrderPage(page)); },\n});\n```',
  'parameterized-assert': '```ts\nasync assertAlertMessage(expected: string | RegExp) {\n  await expect(this.alertBanner).toContainText(expected);\n}\n```',
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

/**
 * Builds a 3-Bucket / 7-Layer JIT Context Pack for an agent or subagent.
 */
function buildJitContextPack(resolved, moduleName, options = {}, helperFns = {}) {
  const { redactPII = (t) => ({ text: t, count: 0 }) } = helperFns;
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
    `> Generated ${new Date().toISOString()} | 3-Bucket / 7-Layer payload | Phase: \`${phaseKey}\`${options.subagent ? ` | Sub-Agent: \`${options.subagent}\`` : ''} | Loop: WRITE + SELECT + COMPRESS + ISOLATE`,
    `> Precedence (Anti-Clash): 1. Approved specs (*.mate-spec.md [BOOTSTRAPPED]) > 2. Fresh [OBSERVED | ts] > 3. MATE-PROJECT-MAP.md > 4. Legacy code.`,
    ...(options.subagent
      ? [
          '',
          `## 🤖 Sub-Agent Delegation & Isolation Contract (\`--subagent ${options.subagent}\`)`,
          `- **Target Sub-Agent Skill:** \`${options.subagent}\` (operates with Separate Individual History — never inherit parent scratchpad noise).`,
          `- **Zero-Assumption Escalation:** Never guess undocumented business rules. Tag unknowns as \`[TBD: <question>]\` under \`## Open Questions for Human QA\` and return \`STATUS: BLOCKED_ON_USER_INPUT\`.`,
          `- **Required Return Digest:** Persist output artifact to disk and emit a compact \`mate.handoff/v1\` digest via \`npx mate-sdt session advance\`.`,
        ]
      : []),
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

module.exports = {
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
  moduleTier,
  importanceOf,
  scoreEntry,
  mapEntries,
  selectMemorySlice,
  compressAriaSnapshot,
  digestHar,
  openApiPaths,
  inferPhase,
  buildJitContextPack,
};
