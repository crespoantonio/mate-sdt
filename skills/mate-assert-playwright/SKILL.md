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
| **Downstream (Defects)** | **`mate-triage` & `mate-pw-forensics`** | When a test fails against the app due to a real product bug, captures trace/video evidence, creates `docs/bugs/BUG-*.md` (`npx mate-sdt bug`), and links it to the `test.fail()` annotation. |
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
   - **Annotate with `test.fail()` (The Active Defect Canary):**  
     Cite the Bug ID and Invariant with strict literal assertion. **Never use `test.skip()` for known defects:**
     ```typescript
     test('TC-03: should reject negative item quantity [INV-02] @p0 @border', async ({ cartPage }) => {
       test.fail(true, 'BUG-20261111-CART-01: App currently accepts negative quantities violating INV-02');
       await cartPage.navigate();
       await cartPage.setItemQuantity(-3);
       await cartPage.expectQuantityValidationError('Quantity must be at least 1');
     });
     ```
     > **Why `test.fail()` is an Active Canary Tripwire:**  
     > While the defect exists, Playwright tracks it with `x` (expected failure) without breaking CI. But the moment developers fix the application and the test starts passing, Playwright **FAILS THE CI RUN** with `Error: Expected test to fail, but it passed!`. This automatically alerts QA that the defect was resolved and forces the team to remove `test.fail()`, promote the test to standard green, and close the bug report in `docs/bugs/`!
   - **Generate the Bug Report:** Run `npx mate-sdt bug <module>` to create `docs/bugs/BUG-*.md`.
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

## 🏛️ 3. The Enterprise Anti-Bloated Page Object & Component Extraction Pattern

A common architectural trap in enterprise automation—greatly amplified by AI coding agents—is the **"Bloated Page Object" (or God Page Object)** antipattern. When an agent automates negative paths or border cases, its default reflex is often to add dedicated, hardcoded assertion methods to the Page Object for every single permutation (e.g. `assertInvalidEmail()`, `assertEmptyPassword()`, `assertDuplicateEmailStrict()`, `assertMissingHouseNumber()`).

In an enterprise application, this causes:
1. **Class Explosion:** Page Objects balloon to 40+ methods and 800+ lines tightly coupled to specific test cases.
2. **Loss of Assertion Flexibility (`expect.soft()` Lockout):** Hardcoding `await expect()` inside an encapsulated Page Object method strips the test spec of the ability to choose between hard assertion (`expect`) and soft assertion (`expect.soft()`) to collect multiple form validation failures in a single run.
3. **SRP & OCP Violations:** Complex multi-step widgets (e.g. password strength meters, toast alert containers, checkout wizards) are locked inside a single page instead of being reusable across the application.

### 📐 The 4 Rules of Enterprise Clean UI Architecture in M.A.T.E.

#### Rule 1: Parameterized Assertions over Hardcoded Single-Case Methods
Never hardcode specific expectation text or single-use condition names inside a Page Object assertion method. Expose parameterized, reusable assertion methods that accept the expected message, regex, or status:
```typescript
// ❌ ANTI-PATTERN: Bloated, single-case assertion hardcoding domain text
async assertDuplicateEmailErrorStrict(): Promise<void> {
  await expect(this.errorMessage.first()).toContainText('Email is already in use.');
}

// ✅ M.A.T.E. ENTERPRISE PATTERN: Parameterized, reusable assertion
async assertAlertMessage(expected: string | RegExp): Promise<void> {
  await expect(this.alertBanner.first()).toBeVisible({ timeout: 10000 });
  await expect(this.alertBanner.first()).toContainText(expected);
}
```

#### Rule 2: Public `readonly` Locators for Assertion Flexibility (`expect.soft()`)
Every meaningful UI element that tests need to inspect must be exposed as a public `readonly Locator`. This grants test specifications the freedom to use Playwright's native web-first assertions and **`expect.soft()`** without breaking encapsulation:
```typescript
export class RegisterPage extends BasePage {
  // Public readonly locators empower the test spec
  readonly alertBanner: Locator;
  readonly fieldErrors: Locator;

  constructor(page: Page) {
    super(page);
    this.alertBanner = page.locator('[data-test="register-error"], .alert-danger');
    this.fieldErrors = page.locator('.invalid-feedback, input:invalid');
  }
}

// In tests/e2e/auth-registration.spec.ts:
// Soft-assert multiple errors across the form in a single test execution:
await expect.soft(registerPage.alertBanner).toContainText('Email is already in use.');
await expect.soft(registerPage.fieldErrors).toHaveCount(3);
```

#### Rule 3: Strict Separation of "Guards" vs. "Business Verifications"
* **Internal Guards (Private / Protected):** Preconditions and synchronization checks (e.g., verifying that a modal opened, that a submit button is enabled, or that a spinner disappeared). Guards live **100% hidden inside Page Object actions** (`submit()`, `selectOption()`, `goto()`). Test specs never call guards directly.
* **Business Verifications (Public `assert*` or `verify*`):** The explicit **"Then"** of the User Story / Acceptance Criteria. They are invoked only at the end of the test step to validate domain invariants.

#### Rule 4: Mandatory Component Extraction (`BaseComponent`)
If a UI widget meets **any** of these criteria, it **MUST NOT** remain embedded inside a Page Object:
1. It possesses its own internal state or dynamic interaction (e.g. password strength meters, toast notifications, date pickers, multi-select dropdowns).
2. It appears in more than one page or view (e.g. navigation bars, language switchers, shopping cart badges, address forms, payment modals).

Extract the widget into a class extending **`BaseComponent`** (`src/components/*.component.ts`) and compose it inside the Page Object or inject it via `src/fixtures/mate.fixtures.ts`:
```typescript
// src/components/password-strength.component.ts
export class PasswordStrengthComponent extends BaseComponent {
  readonly progressBar: Locator;
  readonly strengthText: Locator;

  async assertLevel(expected: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong' | 'Excellent'): Promise<void> {
    const indicator = this.root.getByText(expected, { exact: true });
    await expect(indicator.first()).toBeVisible({ timeout: 5000 });
  }
}
```

---

## 🏛️ 4. The Multi-Role & Multi-Tenant Dependency Inversion Pattern

Enterprise applications frequently require testing across distinct permission tiers (e.g., `Admin`, `Manager`, `Customer`, `Auditor`) or separated tenant domains (e.g., `Tenant A`, `Tenant B`).

### The Problem with Project-Based Auth in Playwright
Playwright's default documentation recommends configuring authentication via separate projects in `playwright.config.ts` (e.g. `setup` -> `admin-tests`, `user-tests`). While functional for simple single-user suites, this introduces **two fatal limitations in enterprise QA**:
1. **No Collaborative Multi-User Flows:** If an Admin approves a requisition and a Customer verifies its status in real-time, project-based auth cannot execute the flow because a test is locked to a single project/context.
2. **Cannot Test Cross-Tenant Security Invariants (BOLA / IDOR):** Testing that Tenant B is strictly forbidden (`403 Forbidden`) from reading Tenant A's private documents requires **two simultaneous, isolated authenticated contexts in the same test block**.

### The M.A.T.E. Multi-Role Fixture Architecture

In M.A.T.E., we solve this by injecting pre-authenticated, isolated browser contexts via **Dependency Inversion Fixtures (`test.extend()`)** backed by `storageState` JSON files (`playwright/.auth/*.json`):

#### 1. Static Role Fixtures (`adminPage`, `customerPage`)
Tests declare exactly the role contexts they need:
```typescript
import { test, expect } from '../src/fixtures/mate.fixtures';

test('Admin unlocks user and Customer can log in immediately [INV-03]', async ({ adminPage, customerPage }) => {
  // adminPage runs with admin storageState
  await adminPage.goto('/admin/users');
  await adminPage.getByRole('button', { name: /unlock customer/i }).click();

  // customerPage runs with customer storageState in an isolated context
  await customerPage.goto('/account/orders');
  await expect(customerPage.getByTestId('order-history')).toBeVisible();
});
```

#### 2. Cross-Tenant Security & Isolation Testing (Pillar T Synergy)
Using the dynamic tenant factory fixture `asTenant(tenantId, role)`:
```typescript
test('THR-SEC-01: Cross-Tenant Isolation - Tenant B cannot read Tenant A order', async ({ asTenant }) => {
  const { page: tenantAPage } = await asTenant('tenant-alpha', 'customer');
  const { page: tenantBPage } = await asTenant('tenant-beta', 'customer');

  // Tenant A creates an invoice
  await tenantAPage.goto('/invoices');
  const invoiceId = await tenantAPage.getByTestId('latest-invoice-id').innerText();

  // Tenant B attempts direct access (IDOR / BOLA probe)
  await tenantBPage.goto(`/invoices/${invoiceId}`);
  await expect(tenantBPage.getByTestId('error-403-forbidden')).toBeVisible();
});
```

#### 3. Fast API-Driven Session Pre-Hydration
Never perform repetitive UI logins in `beforeEach`. Populate `playwright/.auth/*.json` using fast backend API requests in a global setup or setup project (`request.post('/api/auth/login')`), and let fixtures inject the cached storage state instantly.

---

## 📦 Reference Boilerplates & Companion Guides

*   **Base Page Object Template:** [`resources/base-page.template.ts`](./resources/base-page.template.ts)
*   **Component Object Model Template:** [`resources/component.template.ts`](./resources/component.template.ts)
*   **DIP Test Fixtures Template:** [`resources/fixtures.template.ts`](./resources/fixtures.template.ts)
*   **`@playwright/cli` Codegen & Mocking Guides:** Activate **`mate-pw-codegen`** (`skills/mate-pw-codegen/SKILL.md`).
