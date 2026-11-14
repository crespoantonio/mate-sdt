---
name: mate-flow-triage
description: >-
  End-to-End M.A.T.E. Day-2 Triage & Maintenance Workflow: Analyzes CI/test execution
  failures, classifies bugs vs. flakiness, generates spec-linked Bug Reports (npx mate-sdt bug),
  audits test suite health (npx mate-sdt audit), and updates MATE-PROJECT-MAP.md.
---

# 🔍 E2E Workflow: CI Failure Triage, Bug Reporting & Maintenance (`/mate-flow-triage`)

Execute this workflow whenever a test run fails in CI/CD or locally, or at the end of a sprint to audit test debt.

---

## Step 1: Read Context & Ingest Failure Evidence (`mate-triage`)
1. Read `MATE-PROJECT-MAP.md` and the corresponding `specs/[module].mate-spec.md`.
2. Inspect test execution outputs (Playwright traces, JUnit/JSON reports, stack traces, recent Git commits/PRs).

## Step 2: Classify Every Failure (`mate-triage`)
Categorize each failure using the M.A.T.E. matrix with explicit confidence levels (`[OBSERVED]` vs. `[INFERRED]`):
- **`[BUG - INVARIANT BROKEN]`**: Production code violated an `INV-XX` invariant, allowed a Forbidden Transition, or crashed under a `THR-XX` threat.
- **`[FLAKY TEST]`**: Race condition in test code, timing sensitivity, or shared mutable test state.
- **`[ENVIRONMENT / INFRA]`**: Container/network outage or missing secret.
- **`[TEST DATA / CONTRACT DRIFT]`**: Outdated fixture or un-synced Page Object.

## Step 3: Action Branch — File Bug Report or Refactor Suite
- **If `[BUG - INVARIANT BROKEN]`:**
  1. Run `npx mate-sdt bug [module]` to scaffold `docs/bugs/BUG-YYYYMMDD-[module].md`.
  2. Populate exact reproduction steps, forensic logs, and the violated clause from `specs/[module].mate-spec.md`.
- **If `[FLAKY TEST]` or `[CONTRACT DRIFT]`:**
  1. Invoke `mate-maintenance` and run `npx mate-sdt audit`.
  2. Eliminate arbitrary sleeps, isolate test data in fixtures, and restore a `Health Score: A`.

## Step 4: Update `MATE-PROJECT-MAP.md` (`mate-core`)
Append newly discovered coverage gaps, flaky test patterns, and the updated Test Suite Health Score to Section 7 of `MATE-PROJECT-MAP.md`.

---

## 🧵 Session Workbench & Black-Box Handoff Protocol

1. **Start Isolated Session:** `npx mate-sdt session start <flow-id> --module=<module> --stage=<initial-stage>`
2. **Record Raw Events (Window $K=5$):** `npx mate-sdt session event <flow-id> "[OBSERVED | ISO] ..."`
3. **Stage Transition (Auto-Compaction + `mate.handoff/v1`):** `npx mate-sdt session advance <flow-id> --stage=<next> --to=<next-skill> --digest="..."`
4. **JIT Context & Consolidation:** Run `npx mate-sdt context <module>` before each stage and `npx mate-sdt context <module> --consolidate` + `npx mate-sdt gate` at completion.
