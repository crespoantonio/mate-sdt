---
name: mate-maintenance
description: >-
  Specialist in Day-2 Test Codebase Health & Technical Debt Auditing of the M.A.T.E. Method.
  USE WHEN: Auditing or refactoring `tests/` and `src/` for SOLID/DIP violations, arbitrary sleeps
  (`waitForTimeout`/`sleep`), committed `.only` locks, duplicate locators, or weak cosmetic assertions, and
  computing the M.A.T.E. Health Score (`A` to `F`) via `npx mate-sdt audit`.
  SYNERGY: Runs as the final quality gate after `mate-pw-codegen` and `mate-assert-playwright` generate new tests,
  and receives flaky-test remediation tasks from `mate-triage`.
---

# 🧹 Day-2 Operations Skill: Test Suite Maintenance & Health Audit (`mate-maintenance`)

This skill governs the long-term architectural health of the test automation codebase. Its mission is to prevent test decay, eliminate flakiness root causes, and enforce strict compliance with M.A.T.E. SOLID principles.

> **CRITICAL RULE:** Always read `MATE-PROJECT-MAP.md` before auditing or refactoring. Update `MATE-PROJECT-MAP.md` whenever reusable components, Page Objects, or Health Scores change.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream (Post-Codegen)** | **`mate-pw-codegen` & `mate-assert-playwright`** | Runs `npx mate-sdt audit` after new Page Objects, Component Objects, and test specs are created to guarantee `Grade A (100/100)` compliance. |
| **Upstream (Flakiness)** | **`mate-triage`** | Receives tests classified as `[FLAKY TEST]` or `[UI / CONTRACT DRIFT]` and refactors them using web-first assertions and SOLID encapsulation. |
| **Downstream** | **`mate-core`** | Updates the *Test Suite Health Score* and *Injectable Fixtures* registry inside `MATE-PROJECT-MAP.md`. |

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

---

## 🔄 Black-Box Handoff & Session Isolation

- **Separate Individual Histories:** Never pass raw multi-turn scratchpads or verbose upstream tool logs into this skill or out to downstream skills.
- **Consume & Emit `mate.handoff/v1`:** Read only the compressed upstream handoff digest + `npx mate-sdt context <module>` JIT pack, and advance stages via `npx mate-sdt session advance <flow-id> --stage=<next> --to=<skill> --digest="..."`.
- **Provenance & Hygiene:** Tag findings with `[BOOTSTRAPPED]`, `[USER_EXPLICIT]`, `[OBSERVED | ISO]`, `[INFERRED]`, or `[TBD]`; promote verified facts via `npx mate-sdt context <module> --consolidate`.

## Zero-Assumption Escalation & Sub-Agent Isolation Protocol

- **Ask, Never Guess (`STATUS: BLOCKED_ON_USER_INPUT`):** Inspect local context (`MATE-PROJECT-MAP.md`, `specs/`, code) and live browser/API responses first. Never invent business thresholds, auth boundaries, or SLA numbers. Tag any genuine requirement gap as `[TBD: <exact question for PO/Dev/QA>]` inside `## Open Questions for Human QA`, finish all unblocked work, and halt when `npx mate-sdt validate` or `npx mate-sdt gate` returns `STATUS: BLOCKED_ON_USER_INPUT` to ask the human.
- **Sub-Agent Context Isolation (`--subagent` & `mate.handoff/v1`):** When delegating to a sub-agent or running a multi-stage pipeline (Reader/Extractor -> Spec Scorer -> Code Writer -> Independent Reviewer), build a scoped prompt via `npx mate-sdt context <module> --subagent <skill-name>` (`.mate/subagent-prompt-<module>-<skill>.md`). Pass only the structured `mate.handoff/v1` digest between stages (or run `--compact` in single-agent IDEs) so raw exploratory noise never pollutes downstream context windows.
