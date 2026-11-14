---
name: mate-performance-k6
description: >-
  Specialist in Non-Functional Performance Oracles & Grafana k6 of the M.A.T.E. Method.
  USE WHEN: Designing load profiles (Smoke, Load, Stress, Spike, Soak), translating `<performance_oracles>`
  SLAs (`p95`, `p99`, error rates) into `tests/nfr/*.k6.js` scripts, or executing performance suites inside
  rootless Podman containers (`npx mate-sdt k6`).
  SYNERGY: Receives `<performance_oracles>` from `mate-model`, reuses endpoint contracts from `mate-assert-api`,
  and feeds SLA verdicts into `mate-explore` and `mate-triage`.
---

# ⚡ Pillar A/T Skill: Performance Oracles & k6 (`mate-performance-k6`)

This skill governs **Non-Functional Oracles (`<performance_oracles>`)** in the M.A.T.E. Method. It translates latency SLAs, throughput requirements, and resilience targets from `specs/[module].mate-spec.md` into deterministic **Grafana k6** suites executed inside rootless **Podman** containers.

> **CRITICAL RULE:** Always read `MATE-PROJECT-MAP.md` first to verify environment VU limits (`dev` vs. `staging`) and existing SLA thresholds. Never invent load targets—apply the **Handling Uncertainty Protocol**.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-model` & `mate-assert-api`** | Supplies `<performance_oracles>` SLAs and typed payload structures for critical endpoints. |
| **Companion** | **`mate-threat`** | Combines spike/stress load profiles with idempotency and concurrency checks. |
| **Downstream** | **`mate-triage` & `mate-explore`** | Reports SLA breaches (`p95`/`p99` violations) to `mate-triage` (`npx mate-sdt bug`) and informs the final Release Verdict in `mate-explore`. |

---

## 📈 Load Profile Selection Matrix

| Profile Type | Purpose | VU / Arrival Pattern | Typical Duration | When to Use |
| :--- | :--- | :--- | :--- | :--- |
| **Smoke** | Sanity & script verification | `1–5 VUs` constant | `1–3 min` | Before every load test or in PR gates |
| **Load** | Validate SLAs under expected traffic | Ramp-up ➔ steady peak ➔ ramp-down | `10–30 min` | Standard Pillar A `<performance_oracles>` check |
| **Stress** | Discover breaking points & degradation | Progressive ramp beyond normal peak | `15–45 min` | Pillar T capacity & circuit-breaker validation |
| **Spike** | Sudden viral burst resilience | Instant jump (`10x` traffic) ➔ recovery | `5–15 min` | Flash sales, ticket drops, webhook storms |
| **Soak** | Detect memory leaks & pool exhaustion | Steady moderate load (`70%` peak) | `2–8 hours` | Pre-release endurance verification |

---

## 🎯 SLA-to-Threshold Mapping Rules

Every k6 script in `tests/nfr/*.k6.js` must bind directly to the SLAs declared in `specs/[module].mate-spec.md`:
- **Latency Oracles (`ORA-LATENCY`):** `http_req_duration: ['p(95)<400', 'p(99)<800']`
- **Reliability Oracles (`ORA-ERRORS`):** `http_req_failed: ['rate<0.01']` (Error rate strictly `< 1%`)
- **Per-Endpoint Tagging:** Use `{ endpoint: 'checkout' }` tags to isolate critical P0 endpoints from background calls.

---

## 🐳 Execution in Rootless Podman

Run k6 scripts in isolated containers via the M.A.T.E. CLI:

```bash
npx mate-sdt k6 tests/nfr/load.k6.js
```

Or directly via Podman:
```bash
podman run --rm -i -v $(pwd):/app:Z -w /app grafana/k6 run tests/nfr/load.k6.js
```

---

## 📦 Reference Boilerplate

*   **Modular k6 Load Template:** [`resources/k6-load.template.js`](./resources/k6-load.template.js)

---

## 🔄 Black-Box Handoff & Session Isolation

- **Separate Individual Histories:** Never pass raw multi-turn scratchpads or verbose upstream tool logs into this skill or out to downstream skills.
- **Consume & Emit `mate.handoff/v1`:** Read only the compressed upstream handoff digest + `npx mate-sdt context <module>` JIT pack, and advance stages via `npx mate-sdt session advance <flow-id> --stage=<next> --to=<skill> --digest="..."`.
- **Provenance & Hygiene:** Tag findings with `[BOOTSTRAPPED]`, `[USER_EXPLICIT]`, `[OBSERVED | ISO]`, `[INFERRED]`, or `[TBD]`; promote verified facts via `npx mate-sdt context <module> --consolidate`.
