---
name: mate-triage
description: >-
  Specialist in Day-2 QA Operations (Failure Triage, Known-Failure Tracking & Bug Reporting) of the M.A.T.E. Method.
  USE WHEN: The user pastes a raw stack trace, terminal error output, Playwright `TimeoutError` / `StrictModeViolation`,
  assertion mismatch, HTTP `4xx/5xx` contract error, TS compiler error in `src/`/`tests/`, or k6/Stryker/Podman crash,
  OR says "fix this", "heal this test", "why did this fail?", OR invokes `/mate-flow-triage` / `npx mate-sdt heal`.
  Compresses the noisy crash into `<error_digest>` (<= 400 tokens), diagnoses via live forensics, and applies the
  5-Class "Heal vs. Quarantine" Decision Matrix without ever greenwashing a broken requirement.
  SYNERGY: Pairs with `mate-pw-forensics` (for traces, screenshots & video evidence), `mate-assert-playwright`
  (to mark real bugs with `test.fail()`), and `mate-maintenance` (to fix flaky tests or locator drift).
---

# 🔍 Day-2 Operations Skill: Failure Triage & Bug Reporting (`mate-triage`)

This skill governs post-execution analysis when live CLI validation, automated test runs, or exploratory charters uncover failures. It enforces M.A.T.E.'s **Anti-Greenwashing Protocol** by ensuring real product defects are documented, linked to specification invariants, and tracked transparently.

> ⚡ **CRITICAL CONTEXT ENGINEERING RULE (Log Compression & Sub-Agents):**  
> Never dump 300+ lines of raw terminal test logs or ANSI stack traces into the primary conversation thread!  
> 1. **Sub-Agent Execution:** Whenever possible, run `npx playwright test` inside an isolated sub-agent (see Template 4 in [`docs/SUBAGENTS_AND_PARALLEL_EXECUTION.md`](../../docs/SUBAGENTS_AND_PARALLEL_EXECUTION.md)). The sub-agent consumes the verbose logs in its own thread and returns only a 5-line summary to the main cockpit.  
> 2. **Log Redirection:** If sub-agents are unavailable, run test commands with output redirected (e.g., `npx playwright test --reporter=list > .mate/test-run.log`) and read only the failure summary and diff.

> **CRITICAL RULE:** Always read `MATE-PROJECT-MAP.md` and the relevant `specs/[module].mate-spec.md` before triaging failures or drafting bug reports.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-pw-recon`, `mate-pw-codegen` & `mate-assert-playwright`** | Triggered automatically whenever a User Story test case (`TC-XX`) or Spec Invariant (`INV-XX`) fails against the application. |
| **Companion (Evidence)** | **`mate-pw-forensics`** | Captures `.playwright-cli/traces/`, failure screenshots, and 60fps WebM reproduction videos to attach to the bug report and PR/Jira ticket. |
| **Downstream (Suite Fix)** | **`mate-maintenance` & `mate-pw-codegen`** | If the failure is classified as **Locator Drift** or **Flaky Test** (not a product bug), delegates repair to the Page Object or fixture layer. |

---

## 🗂️ M.A.T.E. Failure Categorization Matrix

Every failing test must be classified with an explicit confidence level (`High`, `Medium`, `Low`):

| Category | Diagnostic Indicators | Required Action |
| :--- | :--- | :--- |
| **`[BUG - INVARIANT BROKEN]`** | Deterministic assertion failure on `INV-XX` / `TC-XX`, illegal state transition allowed, or `500` error on valid/border input. | 1. Keep the test in the suite with its real assertion.<br>2. Annotate with `test.fail(true, 'BUG-XXX: ...')`.<br>3. Generate M.A.T.E. Bug Report (`npx mate-sdt bug <module>`).<br>4. Alert the tester clearly in the execution summary. |
| **`[FLAKY TEST]`** | Passes on retry, `pass -> fail -> pass` history, race condition in test setup, or parallel collision. | Log in `MATE-PROJECT-MAP.md` *Flakiness Radar* and delegate fix to `mate-maintenance`. |
| **`[ENVIRONMENT / INFRA]`** | `ECONNREFUSED`, container OOM, expired staging certificate, third-party sandbox down (`502/503`). | Escalate to DevOps/Platform; do not mutate test assertions. |
| **`[TEST DATA DRIFT]`** | Seed record missing, unique constraint collision across runs, stale auth fixture. | Repair test fixture isolation (`src/fixtures/`). |
| **`[UI / CONTRACT DRIFT]`** | Intentional UI copy/locator change or spec version bump not yet reflected in Page Object. | Verify `specs/[module].mate-spec.md` first, then update the single `readonly` locator in `src/pages/` (`mate-pw-codegen`). |

---

## 🐛 Spec-Linked Bug Reporting (`npx mate-sdt bug <module>`)

Unlike generic bug tickets, a **M.A.T.E. Bug Report** explicitly traces the defect back to the User Story and specification clause it violated:
- **Violated Specification & Test Case:** `specs/[module].mate-spec.md` (`INV-XX`) & `docs/test-cases/TC-[module].md` (`TC-XX`)
- **Automated Test Guard:** Points to the exact `test.fail()` spec in `tests/e2e/[module].spec.ts`.
- **External Issue Tracker Sync:** If an Atlassian (Jira), GitHub Issues, Linear, or Notion MCP is connected, offer to create or link the bug ticket directly in the issue tracker.

---

## 🚨 The Active Defect Canary Pattern (`test.fail()` Lifecycle & Fix Alerting)

In M.A.T.E., known product defects are NEVER swept under the rug with `test.skip()` or permissive regexes (`/A|B/`). We use `test.fail()` as an **Active Defect Canary**:

1. **Defect Tracking Without Pipeline Blockage:**  
   Annotating a test with `test.fail(true, 'BUG-XXX: ...')` keeps the test running against the live app. While the bug is present, Playwright marks it with `x` (expected failure). The CI run remains green, preventing pipeline blockage while transparently reporting the defect.
2. **The Active Tripwire (Automatic Fix Alerting):**  
   The moment developers fix the application and the test starts passing, Playwright **INTENTIONALLY FAILS THE RUN** with:  
   `Error: Expected test to fail, but it passed!`  
   This provides instant feedback to QA that the bug has been resolved, forcing the team to remove `test.fail()`, promote the test to standard green status, and close the bug report in `docs/bugs/`.
3. **Absolute Prohibition of `test.skip()` for Known Bugs:**  
   Never use `test.skip()` to handle application defects. Skipped tests do not execute, cannot alert when fixed, and become dead rotting code. Always use `test.fail()` with strict literal assertions from the Acceptance Criteria.

---

## 📦 CLI & Reference Templates

*   **Generate Bug Report via CLI:** `npx mate-sdt bug <module-name>`
*   **Bug Report Template:** [`resources/bug-report.template.md`](./resources/bug-report.template.md)
*   **Test Results Triage Report Template:** [`resources/triage-report.template.md`](./resources/triage-report.template.md)

---

## 🔄 Black-Box Handoff & Session Isolation

- **Separate Individual Histories:** Never pass raw multi-turn scratchpads or verbose upstream tool logs into this skill or out to downstream skills.
- **Consume & Emit `mate.handoff/v1`:** Read only the compressed upstream handoff digest + `npx mate-sdt context <module>` JIT pack, and advance stages via `npx mate-sdt session advance <flow-id> --stage=<next> --to=<skill> --digest="..."`.
- **Provenance & Hygiene:** Tag findings with `[BOOTSTRAPPED]`, `[USER_EXPLICIT]`, `[OBSERVED | ISO]`, `[INFERRED]`, or `[TBD]`; promote verified facts via `npx mate-sdt context <module> --consolidate`.

---

## 🩹 Spec-Guarded Self-Healing (`npx mate-sdt heal`) & 5-Class Decision Matrix

1. **Compress & Select (`npx mate-sdt heal [target]`):** Strip ANSI/node_modules noise into `<error_digest>` (`<= 400` tokens), extract `+-25` lines around failing project frames + `<intent_model>`/`<invariants>`, and write `.mate/scratchpad-heal-<module>.md` (max 3 attempts).
2. **3-Stage Black-Box Isolation:** Stage 1 (`mate-pw-forensics` live recon) -> Stage 2 (`mate-triage` root-cause verdict) -> Stage 3 (surgical code patch or `test.fail()` quarantine).
3. **5-Class "Heal vs. Quarantine" Decision Matrix:**
   - **`UI_LOCATOR_DRIFT`:** Live ARIA snapshot (`<= 800`t) proves invariants pass; update locator strictly in `src/pages/` or `src/components/`, run `npx mate-sdt context <module> --consolidate`.
   - **`SYNC_OR_FLAKY_RACE`:** Add deterministic web-first assertions (`expect(locator).toBeVisible()`, `waitForResponse()`) in Page/Component Object. Zero `waitForTimeout()`/`sleep()`.
   - **`HARNESS_OR_TYPING_DRIFT`:** Fix DIP fixture (`src/fixtures/`), mock (`src/mocks/`), or model (`src/models/`) preserving Forward-Only layers (`GATE-04`).
   - **`SPEC_EVOLUTION_DRIFT`:** HALT & confirm with human; update `specs/<module>.mate-spec.md` (`GATE-02`) before tests.
   - **`REAL_PRODUCT_BUG`:** STRICT QUARANTINE (`GATE-03`): Keep true assertion, mark `test.fail(true, "BUG-XXX")`, and run `npx mate-sdt bug <module>`.
4. **Verify & Consolidate:** Finish with `npx mate-sdt heal [target] --verify --consolidate` (and `npx mate-sdt gate --loop`) to record root-cause playbooks in `.mate/memory/procedural-playbooks.md`.

## Zero-Assumption Escalation & Sub-Agent Isolation Protocol

- **Ask, Never Guess (`STATUS: BLOCKED_ON_USER_INPUT`):** Inspect local context (`MATE-PROJECT-MAP.md`, `specs/`, code) and live browser/API responses first. Never invent business thresholds, auth boundaries, or SLA numbers. Tag any genuine requirement gap as `[TBD: <exact question for PO/Dev/QA>]` inside `## Open Questions for Human QA`, finish all unblocked work, and halt when `npx mate-sdt validate` or `npx mate-sdt gate` returns `STATUS: BLOCKED_ON_USER_INPUT` to ask the human.
- **Sub-Agent Context Isolation (`--subagent` & `mate.handoff/v1`):** When delegating to a sub-agent or running a multi-stage pipeline (Reader/Extractor -> Spec Scorer -> Code Writer -> Independent Reviewer), build a scoped prompt via `npx mate-sdt context <module> --subagent <skill-name>` (`.mate/subagent-prompt-<module>-<skill>.md`). Pass only the structured `mate.handoff/v1` digest between stages (or run `--compact` in single-agent IDEs) so raw exploratory noise never pollutes downstream context windows.
