---
name: mate-assert-playwright
description: >-
  Specialist in Pillar A (Assert - UI Architecture & Anti-Greenwashing Governance) of the M.A.T.E. Method.
  USE WHEN: Designing, writing, or reviewing Playwright TypeScript UI test suites, enforcing OOP/SOLID Page Objects
  (`BasePage`), Component Objects (`BaseComponent`), Dependency Inversion fixtures (`test.extend`), zero arbitrary
  sleeps, and the Anti-Greenwashing Mandate (automating Happy + Border + Negative cases and marking real app bugs
  with `test.fail()`).
  SYNERGY: Works in tandem with `mate-pw-codegen` (which translates `@playwright/cli` locators, auth states, and
  mocks into this architecture), receives test cases from `mate-story-testcases` and `mate-model`, and hands off
  bugs to `mate-triage` and `mate-pw-forensics`.
---

# 🎯 Pillar A Skill: SOLID Playwright Architecture & Anti-Greenwashing (`mate-assert-playwright`)

This skill governs **Pillar A (Assert — UI Architecture)** of the M.A.T.E. Method. Its purpose is to translate specification invariants (`specs/*.mate-spec.md`) and Test Case Matrices (`docs/test-cases/TC-*.md`) into **maintainable, deterministic, SOLID automated test suites that never hide product defects**.

> [!IMPORTANT]
> **Anti-Hallucination & Tool-First Invariant:**  
> When running with reasoning models, **NEVER hallucinate or deduce selectors in thinking loops**. Use verified accessibility locators (`page.getByRole`, `page.getByLabel`, `page.getByTestId`) obtained through `@playwright/cli` live discovery or live DOM inspection. Every assertion must map strictly to an invariant in `specs/*.mate-spec.md` and a test case in `docs/test-cases/TC-*.md`.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-story-testcases`, `mate-model` & `mate-pw-recon`** | Supplies the validated `*.mate-spec.md`, the 4-quadrant Test Case Matrix (`HAPPY_PATH`, `BORDER_CASE`, `NEGATIVE_PATH`, `STATE_TRANSITION`), and live-verified DOM locators. |
| **Companion (CLI Codegen)** | **`mate-pw-codegen`** | Executes `@playwright/cli` code generation, `storageState` auth capture, and `route` network mocking following the architectural rules defined here. |
| **Downstream (Defects)** | **`mate-triage` & `mate-pw-forensics`** | When a test fails against the app due to a real product bug, captures trace/video evidence, creates `tests/bugs/BUG-*.md` (`npx mate-sdt bug`), and links it to the `test.fail()` annotation. |
| **Downstream (Health Gate)** | **`mate-maintenance`** | Verifies via `npx mate-sdt audit` that the generated code scores `Grade A (100/100)` with zero sleeps, zero `.only`, and 100% DIP compliance. |

---

## 🏛️ 1. OOP and SOLID Principles in Testing with M.A.T.E.

1.  **Single Responsibility Principle (SRP):**  
    - **Page Objects (`src/pages/*.page.ts`)** extend `BasePage` and are solely responsible for page-level navigation, semantic locators, and domain interactions.
    - **Component Objects (`src/components/*.component.ts`)** extend `BaseComponent` and model reusable UI widgets (navigation bars, payment modals, toast alerts, data tables) via OOP composition.
    - **Test Specs (`tests/e2e/*.spec.ts`)** express business intent and verify invariants—zero raw `page.locator()` or `page.getByRole()` calls inside spec files.
2.  **Open/Closed Principle (OCP):**  
    `BasePage` and `BaseComponent` expose reusable waiting hooks and state getters. Specific pages extend or compose these capabilities without modifying shared core classes.
3.  **Dependency Inversion Principle (DIP):**  
    Tests must never instantiate Page Objects via hard-coupled `new PageObject(page)` inside test bodies. Inject all Page Objects and pre-authenticated contexts through `src/fixtures/mate.fixtures.ts`:
    ```typescript
    export const test = baseTest.extend<{ checkoutPage: CheckoutPage }>({
      checkoutPage: async ({ page }, use) => {
        await use(new CheckoutPage(page));
      },
    });
    ```
4.  **Express Prohibition of Arbitrary Sleeps:**  
    In M.A.T.E., `page.waitForTimeout()` is strictly forbidden (`MATE-ANTI-01`). Every assertion must use auto-retrying web-first assertions: `expect(locator).toBeVisible()`, `expect(locator).toHaveText()`, `expect(locator).toHaveValue()`.

---

## 🚨 2. The Anti-Greenwashing Mandate (Never Only Write Tests That Pass!)

AI agents frequently fall into the **"Greenwashing Trap"**: only writing happy-path tests, or deleting/modifying assertions when a test fails against the application so the test run looks green. **In M.A.T.E., this is a critical violation.**

1. **Mandatory 4-Quadrant Automation:**  
   Every `tests/e2e/[module].spec.ts` file must include tests for:
   - `@happy` — Valid end-to-end Acceptance Criteria.
   - `@border` — Boundary values (min, max, `0`, empty, max+1, special characters).
   - `@negative` — Invalid inputs, missing required fields, unauthorized access, API `4xx`/`5xx` error handling.
   - `@fsm` — Forbidden state transitions and double-submission idempotency.
2. **Protocol When a Test Fails Against the App (Real Product Defect):**  
   If a test case *should* pass according to the User Story / Spec Invariant (`[INV-XX]`), but fails when executed against the application:
   - **KEEP THE TEST** in `tests/e2e/[module].spec.ts` with the true expected assertion intact.
   - **Annotate with `test.fail()`** (or `test.fixme()` if it hangs/crashes) citing the Bug ID and Invariant:
     ```typescript
     test('TC-03: should reject negative item quantity [INV-02] @p0 @border', async ({ cartPage }) => {
       test.fail(true, 'BUG-20261111-CART-01: App currently accepts negative quantities violating INV-02');
       await cartPage.navigate();
       await cartPage.setItemQuantity(-3);
       await cartPage.expectQuantityValidationError('Quantity must be at least 1');
     });
     ```
   - **Generate the Bug Report:** Run `npx mate-sdt bug <module>` to create `tests/bugs/BUG-*.md`.
   - **Alert the Tester Clearly:** Always present an explicit summary table distinguishing passing tests (`✅ PASS`) from tests exposing real application defects (`⚠️ KNOWN FAIL — test.fail() linked to BUG-XXX`).
3. **The Discrepancy Escalation Protocol (Zero Silent Adaptations & Anti-Permissive Regex):**  
   Whenever live application behavior contradicts or deviates from the User Story / Spec (e.g., copy mismatches, undocumented mandatory fields, unexpected state reset on refresh, account lockouts on shared seed data):
   - **ABSOLUTE PROHIBITION ON PERMISSIVE REGEXES (`MATE-ANTI-06`):** Never write ambiguous alternative regexes like `/already in use|already exists/i` to make a test pass when the copy differs from the Acceptance Criteria. This is silent greenwashing.
   - **ABSOLUTE PROHIBITION ON SILENT WORKAROUNDS:** Never silently add undocumented mandatory fields to Page Objects without notifying the engineer, and never silently bypass a failing user journey (e.g., direct URL navigation vs. SPA click) without asking if the URL behavior is a bug.
   - **MANDATORY ESCALATION TO USER:** The agent MUST PAUSE and ask the human engineer:
     > ⚠️ **DISCREPANCIA DETECTADA: [Módulo / Campo / Comportamiento]**  
     > • **Lo que especifica la User Story:** `[Texto exacto del AC / Invariante]`  
     > • **Lo que hace la aplicación en vivo:** `[Texto o comportamiento real observado]`  
     >  
     > **¿Cómo procedemos?**  
     > 1. **Opción A (Defecto / Bug):** La app está violando la especificación. Mantenemos el assert literal estricto de la User Story, marcamos el test con `test.fail(true, 'BUG-XXX: ...')` y generamos el bug report.  
     > 2. **Opción B (Actualizar Especificación):** La User Story estaba desactualizada y la app refleja el comportamiento deseado por Producto. Actualizamos `specs/*.mate-spec.md` y `docs/test-cases/`, y luego automatizamos con el nuevo criterio aprobado.

---

## 📦 Reference Boilerplates & Companion Guides

*   **Base Page Object Template:** [`resources/base-page.template.ts`](./resources/base-page.template.ts)
*   **Component Object Model Template:** [`resources/component.template.ts`](./resources/component.template.ts)
*   **DIP Test Fixtures Template:** [`resources/fixtures.template.ts`](./resources/fixtures.template.ts)
*   **`@playwright/cli` Codegen & Mocking Guides:** Activate **`mate-pw-codegen`** (`skills/mate-pw-codegen/SKILL.md`).
