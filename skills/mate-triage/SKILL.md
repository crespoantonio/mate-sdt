---
name: mate-triage
description: >-
  Specialist in Day-2 QA Operations (Failure Triage, Flakiness Detection & Bug Reporting) of the
  M.A.T.E. Method. Analyzes test execution results, categorizes failures with confidence levels,
  generates structured Bug Reports linked to broken MATE-SPEC invariants (npx mate-sdt bug),
  and updates the Gaps & Flakiness Radar in MATE-PROJECT-MAP.md.
---

# 🔍 Day-2 Operations Skill: Failure Triage & Bug Reporting (`mate-triage`)

This skill governs post-execution analysis when automated pipelines or human exploratory sessions uncover failures. It merges the capabilities of **Results Analysis** and **Structured Bug Reporting** under M.A.T.E. governance.

> **CRITICAL RULE:** Always read `MATE-PROJECT-MAP.md` and the relevant `specs/[module].mate-spec.md` before triaging failures or drafting bug reports. Never modify production or test code during triage—analysis and documentation only.

---

## 🗂️ M.A.T.E. Failure Categorization Matrix

Every failing test must be classified with an explicit confidence level (`High`, `Medium`, `Low`):

| Category | Diagnostic Indicators | Required Action |
| :--- | :--- | :--- |
| **`[BUG - INVARIANT BROKEN]`** | Deterministic assertion failure on `INV-XX`, illegal state transition allowed, or `500` error on fuzzing (`THR-XX`). | Generate a M.A.T.E. Bug Report (`npx mate-sdt bug <module>`) and block release (`[FAIL]`). |
| **`[FLAKY TEST]`** | Passes on retry, `pass -> fail -> pass` history, race condition in test setup, or parallel collision. | Log in `MATE-PROJECT-MAP.md` *Flakiness Radar* and delegate fix to `mate-maintenance`. |
| **`[ENVIRONMENT / INFRA]`** | `ECONNREFUSED`, container OOM, expired staging certificate, third-party sandbox down (`502/503`). | Escalate to DevOps/Platform; do not mutate test assertions. |
| **`[TEST DATA DRIFT]`** | Seed record missing, unique constraint collision across runs, stale auth fixture. | Repair test fixture isolation (`src/fixtures/`). |
| **`[UI / CONTRACT DRIFT]`** | Intentional UI copy/locator change or spec version bump not yet reflected in Page Object. | Verify `specs/[module].mate-spec.md` first, then update Page Object (`mate-assert-playwright`). |

---

## 🐛 Spec-Linked Bug Reporting (`npx mate-sdt bug <module>`)

Unlike generic bug tickets, a **M.A.T.E. Bug Report** explicitly traces the defect back to the specification clause it violated:
- **Violated Specification:** `specs/[module].mate-spec.md`
- **Broken Clause ID:** `INV-01` / `THR-02` / `Forbidden Transition: DRAFT -> DELIVERED`
- **Duplicate Check:** Before creating a new ticket in Jira/GitHub Issues (via MCP or CLI), search recent issues for identical stack traces or component symptoms.

---

## 📦 CLI & Reference Templates

*   **Generate Bug Report via CLI:** `npx mate-sdt bug <module-name>`
*   **Bug Report Template:** [`resources/bug-report.template.md`](./resources/bug-report.template.md)
*   **Test Results Triage Report Template:** [`resources/triage-report.template.md`](./resources/triage-report.template.md)
