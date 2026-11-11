---
name: mate-assert-playwright
description: >-
  Specialist in Pillar A (Assert) of the M.A.T.E. Method. Translates spec invariants and
  oracles into robust automation using Playwright CLI and TypeScript, applying OOP and SOLID
  principles (Page & Component Object Models, Dependency Inversion with fixtures, zero arbitrary sleeps).
---

# 🎯 Pillar A Skill: Assert & Playwright CLI (`mate-assert-playwright`)

This skill is responsible for **Pillar A (Assert)** of the M.A.T.E. Method. Its purpose is to translate specification invariants and mathematical oracles into **highly maintainable, deterministic, and scalable automated test suites**.

---

## 🏛️ OOP and SOLID Principles in Testing with M.A.T.E.

1.  **Single Responsibility Principle (SRP):**  
    - **Page Objects** are solely responsible for page-level navigation and element locators.
    - **Component Objects** (e.g., navigation bars, payment modals, toast alerts) are modeled in isolated, reusable component classes.
    - Complex business verifications reside inside domain assertion helpers or test specs, never tangled within raw UI locator methods.
2.  **Open/Closed Principle (OCP):**  
    Base page abstractions expose reusable waiting hooks and state getters. Specific pages extend or compose these capabilities without modifying shared core classes.
3.  **Dependency Inversion Principle (DIP):**  
    Tests must never instantiate Page Objects via hard-coupled `new PageObject(page)` inside test bodies. We enforce **Playwright Custom Fixtures** to inject pages and authenticated session contexts in a clean, modular hierarchy:
    ```typescript
    export const test = baseTest.extend<{ checkoutPage: CheckoutPage }>({
      checkoutPage: async ({ page }, use) => {
        await use(new CheckoutPage(page));
      },
    });
    ```
4.  **Express Prohibition of Arbitrary Sleeps:**  
    In M.A.T.E., `page.waitForTimeout()` is strictly forbidden. Every assertion must be an auto-retrying web assertion targeting web state: `expect(locator).toBeVisible()`, `expect(locator).toHaveText()`, `expect(locator).toHaveValue()`.

---

## ⚡ Superpowers with Playwright CLI (`mate-playwright-cli`)

This skill works hand-in-hand with **`mate-playwright-cli`** (`@playwright/cli`) and Playwright's command-line tools to accelerate test development and debugging without ever breaking OOP/SOLID boundaries:

*   **Interactive Browser Recon & Ref-Based Codegen (`playwright-cli`):**  
    Use `playwright-cli open <url>` and `playwright-cli snapshot` to inspect live ARIA trees and generate semantic locators (`getByRole`, `getByLabel`, `getByTestId`), then encapsulate them inside `src/pages/*.page.ts` (`BasePage`) and `src/components/*.component.ts` (`BaseComponent`). See the **`mate-playwright-cli`** skill and its 10 reference guides for full workflows.
*   **Semantic Selector Discovery:**  
    `npx playwright codegen localhost:3000` prioritizing accessibility and ARIA roles: `getByRole`, `getByLabel`, `getByTestId`.
*   **Forensic Failure Auditing:**  
    `playwright-cli tracing-start` / `tracing-stop` and `npx playwright show-trace ./test-results/trace.zip` to review microsecond-level DOM snapshots, network payloads, and console logs when an oracle fails.
*   **Interactive UI Debugging:**  
    `npx playwright test --ui` for step-by-step state machine transition inspection.
*   **Risk-Based Execution:**  
    `npx playwright test --grep @p0` to immediately validate blocking invariants in rapid CI loops.

---

## 📦 Reference Boilerplates & Templates

*   **Base Page Object:** [`resources/base-page.template.ts`](./resources/base-page.template.ts)
*   **Component Object Model:** [`resources/component.template.ts`](./resources/component.template.ts)
*   **DIP Test Fixtures:** [`resources/fixtures.template.ts`](./resources/fixtures.template.ts)
