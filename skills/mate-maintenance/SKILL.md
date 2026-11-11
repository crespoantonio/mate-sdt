---
name: mate-maintenance
description: >-
  Specialist in Day-2 Test Codebase Health & Technical Debt Auditing of the M.A.T.E. Method.
  Audits test suites for SOLID/DIP violations, arbitrary sleeps (waitForTimeout/sleep),
  duplicate locators, weak cosmetic assertions, and orphan tests, computing the official
  M.A.T.E. Health Score (A to F) via npx mate-sdt audit.
---

# 🧹 Day-2 Operations Skill: Test Suite Maintenance & Health Audit (`mate-maintenance`)

This skill governs the long-term architectural health of the test automation codebase. Its mission is to prevent test decay, eliminate flakiness root causes, and enforce strict compliance with M.A.T.E. SOLID principles.

> **CRITICAL RULE:** Always read `MATE-PROJECT-MAP.md` before auditing or refactoring. Update `MATE-PROJECT-MAP.md` whenever reusable components, Page Objects, or Health Scores change.

---

## 🔍 M.A.T.E. Anti-Pattern & Smell Detection Rules

When auditing `tests/` and `src/` (or executing `npx mate-sdt audit`), scan for these six violation categories:

| Violation Code | Anti-Pattern | Detection Heuristic | Severity |
| :--- | :--- | :--- | :---: |
| **`MATE-ANTI-01`** | **Arbitrary Sleeps (Commandment #4)** | `waitForTimeout(`, `Thread.sleep(`, `time.sleep(`, `.pause(` | 🔴 **Critical** |
| **`MATE-ANTI-02`** | **Committed Focus/Skip Locks** | `test.only(`, `describe.only(`, `it.only(` left in test files | 🔴 **Critical** |
| **`MATE-ANTI-03`** | **DIP Violation (Hard Instantiation)** | `new [A-Z]\w*Page\(` inside `*.spec.ts` instead of fixture injection | 🟡 **High** |
| **`MATE-ANTI-04`** | **Cosmetic / Weak Assertions** | `toBeDefined()`, `not.toBeNull()` as the sole oracle without value/schema checks | 🟡 **High** |
| **`MATE-ANTI-05`** | **Fragile DOM Selectors** | Deep XPath (`//div/div[3]`), `:nth-child`, or dynamic CSS class chains inside specs | 🟡 **Medium** |
| **`MATE-ANTI-06`** | **Hardcoded Secrets / Credentials** | Literal passwords, bearer tokens, or API keys inside test files | 🔴 **Critical** |

---

## 🏆 M.A.T.E. Health Score Grading (`A` to `F`)

The CLI command `npx mate-sdt audit` computes a deterministic score starting from `100` points:
- **`A` (`90–100`)**: Exemplary SOLID architecture, zero sleeps, zero `.only`, full fixture DIP compliance.
- **`B` (`80–89`)**: Minor maintainability warnings (e.g., 1–2 direct instantiations or non-semantic locators).
- **`C` (`70–79`)**: Noticeable technical debt; refactoring required this sprint.
- **`D` (`60–69`)**: High flakiness risk; arbitrary sleeps or weak assertions detected.
- **`F` (`< 60`)**: Critical M.A.T.E. non-compliance; test suite cannot be trusted as a release gate.

---

## ⚡ CLI & Reference Artifacts

*   **Automated Static Health Audit:** `npx mate-sdt audit [dir]`
*   **Maintenance Report Template:** [`resources/maintenance-report.template.md`](./resources/maintenance-report.template.md)
