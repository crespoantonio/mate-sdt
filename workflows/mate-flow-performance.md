---
name: mate-flow-performance
description: >-
  End-to-End M.A.T.E. Performance & NFR Workflow: Translates <performance_oracles> SLAs
  from MATE-SPEC.md into Grafana k6 load/stress/spike scripts and executes them inside
  rootless Podman containers (npx mate-sdt k6).
---

# ⚡ E2E Workflow: Performance Oracles with k6 & Podman (`/mate-flow-performance`)

Execute this workflow to verify Non-Functional Requirements (latency SLAs, throughput, error rates, and spike resilience).

---

## Step 1: Verify Performance Oracles & VU Limits (`mate-performance-k6`)
1. Read `MATE-PROJECT-MAP.md` and `specs/[module].mate-spec.md`.
2. Confirm `<invariants>` / `<performance_oracles>` define explicit SLAs (e.g., `P95 <= 400ms`, `Error Rate < 1%`, target RPS/VUs) and environment VU caps. If missing, ask the user—never guess load targets.

## Step 2: Design k6 Load Profile & Thresholds (`mate-performance-k6`)
1. Select the appropriate profile (`Smoke`, `Load`, `Stress`, `Spike`, or `Soak`).
2. Create `tests/nfr/[module].k6.js` based on `skills/mate-performance-k6/resources/k6-load.template.js`.
3. Map every SLA to deterministic k6 `thresholds` (`http_req_duration`, `http_req_failed`, custom `Trend`/`Rate` metrics) so k6 exits with a non-zero code if any oracle breaks.

## Step 3: Execute in Rootless Podman (`npx mate-sdt k6`)
1. Run the containerized k6 suite:
   ```bash
   npx mate-sdt k6 tests/nfr/[module].k6.js
   ```
2. Record the P95/P99 latency results and pass/fail status in `MATE-PROJECT-MAP.md`.

---

## 🧵 Session Workbench & Black-Box Handoff Protocol

1. **Start Isolated Session:** `npx mate-sdt session start <flow-id> --module=<module> --stage=<initial-stage>`
2. **Record Raw Events (Window $K=5$):** `npx mate-sdt session event <flow-id> "[OBSERVED | ISO] ..."`
3. **Stage Transition (Auto-Compaction + `mate.handoff/v1`):** `npx mate-sdt session advance <flow-id> --stage=<next> --to=<next-skill> --digest="..."`
4. **JIT Context & Consolidation:** Run `npx mate-sdt context <module>` before each stage and `npx mate-sdt context <module> --consolidate` + `npx mate-sdt gate` at completion.
