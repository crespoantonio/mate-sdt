---
name: mate-pw-codegen
description: >-
  SOLID Playwright Test Generation, StorageState Dependency Inversion & Network Mocking specialist using `@playwright/cli`.
  USE WHEN: You are converting `@playwright/cli` interactions (`#Ran Playwright code`), saved auth states (`state-save`),
  or CLI network mocks (`route`) into M.A.T.E.'s 4-layer OOP/SOLID automation architecture (`BaseComponent` -> `BasePage`
  -> `MateFixtures` -> `tests/e2e/*.spec.ts`), or running and debugging Playwright tests via the CLI.
  SYNERGY: Works hand-in-hand with `mate-assert-playwright` (SOLID rules & Anti-Greenwashing `test.fail()` protocol),
  receives locators and test cases from `mate-pw-recon` and `mate-story-testcases`, and hands off failures to `mate-pw-forensics` and `mate-triage`.
---

# 🏗️ Skill: SOLID Codegen, Auth State & Network Mocking (`mate-pw-codegen`)

This skill governs **Phase 2 of `@playwright/cli` in M.A.T.E.**: transforming interactive CLI commands, authentication states, and network route mocks into **production-grade, Object-Oriented (OOP), SOLID TypeScript automation** that scales without technical debt.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-story-testcases` & `mate-pw-recon`** | Supplies the complete Test Case Matrix (`HAPPY_PATH`, `BORDER_CASE`, `NEGATIVE_PATH`, `STATE_TRANSITION`), verified locators, and which cases passed or failed live in the browser. |
| **Companion (Mandatory)** | **`mate-assert-playwright`** | Enforces `BasePage` / `BaseComponent` inheritance, `test.extend` Dependency Inversion, zero `waitForTimeout()`, and the **Anti-Greenwashing Mandate**. |
| **Downstream** | **`mate-pw-forensics` & `mate-triage`** | When a test fails during execution, captures traces/videos and files spec-linked bug reports (`npx mate-sdt bug`). |
| **Downstream (Audit)** | **`mate-maintenance`** | Runs `npx mate-sdt audit` after code generation to verify a `100/100 (Grade A)` health score. |

---

## 🏛️ 1. The 4-Layer SOLID Codegen Pipeline

Never paste raw `#Ran Playwright code` lines directly into `tests/e2e/*.spec.ts`. Every locator and action emitted by `playwright-cli` must flow through these 4 layers:

```text
[playwright-cli #Ran Playwright code]
        │
        ├──► Layer 1: src/components/<widget>.component.ts  (extends BaseComponent — SRP/OCP)
        ├──► Layer 2: src/pages/<domain>.page.ts            (extends BasePage — encapsulates locators)
        ├──► Layer 3: src/fixtures/mate.fixtures.ts         (test.extend<MateFixtures> — DIP + storageState)
        └──► Layer 4: tests/e2e/<domain>.spec.ts            (tests Happy + Border + Negative cases)
```

Always register every new Page Object, Component Object, and Fixture inside **`MATE-PROJECT-MAP.md`** so future sessions reuse them instead of duplicating classes.

> [!CAUTION]
> **Zero Direct Locators or Actions in Test Specs (`MATE-ANTI-08` CRITICAL):**  
> Never inject `{ page }` into a test spec to write inline `page.getByRole()`, `page.getByTestId()`, `page.fill()`, or `page.goto()`. If a user story covers a new page or modal (e.g., Customer Registration, Multi-step Checkout, Admin Management), you **MUST** create the Page Object (`src/pages/<domain>.page.ts`) extending `BasePage`, encapsulate all locators and methods inside it, inject it via `src/fixtures/mate.fixtures.ts`, and interact solely through the fixture. Any direct `page` locator or action in a `.spec.ts` triggers `MATE-ANTI-08` (`CRITICAL`), failing `GATE-04-SOLID-AUDIT` with exit code 1.

---

## 🚨 2. Anti-Greenwashing Codegen Rule (Handling Failing Tests)

When automating the Test Case Matrix from `mate-story-testcases`:

1. **Automate ALL cases** (`HAPPY_PATH`, `BORDER_CASE`, `NEGATIVE_PATH`, `STATE_TRANSITION`)—never cherry-pick only the tests that pass!
2. **If a test fails because the application has a bug** (discovered during `mate-pw-recon` or when running `npx playwright test`):
   - **Keep the test in `tests/e2e/<domain>.spec.ts`** with the exact assertion required by the User Story / Spec Invariant (`[INV-XX]`).
   - **Never weaken or invert the assertion** to make a broken feature pass.
   - **Annotate the test with `test.fail()`** (or `test.fixme()` if it causes a hard timeout/crash) referencing the Bug ID:
     ```typescript
     test('TC-03: should floor order total at $0.00 when 100% coupon is applied [INV-01] @p1 @border', async ({
       checkoutPage,
     }) => {
       test.fail(true, 'BUG-20261111-CHECKOUT-01: App currently calculates -$5.00 instead of $0.00');
       await checkoutPage.navigate();
       await checkoutPage.applyCoupon('FREE100');
       await checkoutPage.expectTotalAmount('$0.00');
     });
     ```
   - Generate the bug report via `npx mate-sdt bug <module>` and report it clearly to the user:
     > *"⚠️ Automated 6 high-ROI test cases: 5 pass (`PASS`) and 1 fails due to a real application bug (`TC-03`, documented in `docs/bugs/BUG-...md` and marked with `test.fail()` in the suite). Additionally, 2 manual cases and 1 exploratory charter were documented in `docs/test-cases/TC-<module>.md`."*

---

## 📚 Deep-Dive Reference Guides

Load these references on demand when generating code, managing auth state, or mocking network routes:
* **[SOLID Test Generation from `playwright-cli` (`test-generation.md`)](./references/test-generation.md)** — Complete TypeScript examples of `BaseComponent`, `BasePage`, `MateFixtures`, and `spec.ts` files.
* **[Storage State & Dependency Inversion Auth (`storage-state.md`)](./references/storage-state.md)** — Using `playwright-cli state-save`, cookies, and `localStorage` and wiring them into `src/fixtures/mate.fixtures.ts`.
* **[Network Mocking & Fault Injection (`request-mocking.md`)](./references/request-mocking.md)** — Using `playwright-cli route` to simulate `500`/`429`/corrupt payloads and encapsulating mocks in `src/mocks/<domain>.mock.ts`.
* **[Running, Filtering & Debugging Playwright Tests (`playwright-tests.md`)](./references/playwright-tests.md)** — Tag execution (`@p0`), attaching `playwright-cli` to a paused test via `PLAYWRIGHT_CLI_SESSION`, and self-healing locators.

---

## 🔄 Black-Box Handoff & Session Isolation

- **Separate Individual Histories:** Never pass raw multi-turn scratchpads or verbose upstream tool logs into this skill or out to downstream skills.
- **Consume & Emit `mate.handoff/v1`:** Read only the compressed upstream handoff digest + `npx mate-sdt context <module>` JIT pack, and advance stages via `npx mate-sdt session advance <flow-id> --stage=<next> --to=<skill> --digest="..."`.
- **Provenance & Hygiene:** Tag findings with `[BOOTSTRAPPED]`, `[USER_EXPLICIT]`, `[OBSERVED | ISO]`, `[INFERRED]`, or `[TBD]`; promote verified facts via `npx mate-sdt context <module> --consolidate`.

## Zero-Assumption Escalation & Sub-Agent Isolation Protocol

- **Ask, Never Guess (`STATUS: BLOCKED_ON_USER_INPUT`):** Inspect local context (`MATE-PROJECT-MAP.md`, `specs/`, code) and live browser/API responses first. Never invent business thresholds, auth boundaries, or SLA numbers. Tag any genuine requirement gap as `[TBD: <exact question for PO/Dev/QA>]` inside `## Open Questions for Human QA`, finish all unblocked work, and halt when `npx mate-sdt validate` or `npx mate-sdt gate` returns `STATUS: BLOCKED_ON_USER_INPUT` to ask the human.
- **Sub-Agent Context Isolation (`--subagent` & `mate.handoff/v1`):** When delegating to a sub-agent or running a multi-stage pipeline (Reader/Extractor -> Spec Scorer -> Code Writer -> Independent Reviewer), build a scoped prompt via `npx mate-sdt context <module> --subagent <skill-name>` (`.mate/subagent-prompt-<module>-<skill>.md`). Pass only the structured `mate.handoff/v1` digest between stages (or run `--compact` in single-agent IDEs) so raw exploratory noise never pollutes downstream context windows.
