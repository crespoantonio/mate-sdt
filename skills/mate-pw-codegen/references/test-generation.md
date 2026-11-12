# 📐 M.A.T.E. Test Engineering Lifecycle: Plan ➔ Generate (SOLID POM/DIP) ➔ Heal

This guide defines the official end-to-end workflow for planning, generating, and healing Playwright suites using `playwright-cli` under the **M.A.T.E. Method**.

> **THE GOLDEN ARCHITECTURAL RULE:**  
> `playwright-cli` emits raw locator code on every interaction (`await page.getByRole(...).click()`).  
> **Never paste raw locators directly into `tests/**/*.spec.ts`.** Always encapsulate locators inside **Component Objects (`src/components/`)** and **Page Objects (`src/pages/` extending `BasePage`)**, inject them via **Playwright Fixtures (`src/fixtures/`)**, and register them in **`MATE-PROJECT-MAP.md`**.

---

## 0. How `playwright-cli` Code Generation Maps to SOLID Architecture

When you drive the browser with `playwright-cli`:

```bash
playwright-cli open https://example.com/login
playwright-cli snapshot
# Snapshot shows: e1 [textbox "Email"], e2 [textbox "Password"], e3 [button "Sign In"]

playwright-cli fill e1 "user@example.com"
# Output: await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');

playwright-cli fill e2 "secret123"
# Output: await page.getByRole('textbox', { name: 'Password' }).fill('secret123');

playwright-cli click e3
# Output: await page.getByRole('button', { name: 'Sign In' }).click();

# Extract locator for assertion target e9:
playwright-cli --raw generate-locator e9
# Output: getByRole('heading', { name: 'Dashboard' })
```

### ❌ The Anti-Pattern (Monolithic Script — FORBIDDEN in M.A.T.E.)
Pasting `page.getByRole(...)` directly inside `test('login', async ({ page }) => { ... })` creates unmaintainable duplication across dozens of test files. When a button label changes, 40 tests break.

### ✅ The M.A.T.E. SOLID Transformation (4 Layers)

#### Layer 1: Component Object (`src/components/*.component.ts` — SRP & Composition)
If the page contains a reusable widget (e.g., `NotificationToastComponent`, `HeaderNavComponent`), encapsulate its locators relative to `rootLocator`.

#### Layer 2: Page Object (`src/pages/login.page.ts` — SRP & OCP)
```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  async login(email: string, pass: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.signInButton.click();
  }
}
```

#### Layer 3: Dependency Inversion Fixture (`src/fixtures/mate.fixtures.ts` — DIP)
```typescript
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

type MateFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<MateFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect };
```

#### Layer 4: Declarative Invariant Spec (`tests/e2e/login.spec.ts`)
```typescript
// spec: specs/authentication.mate-spec.md
// invariant: INV-01
import { test, expect } from '../../src/fixtures/mate.fixtures';

test.describe('Authentication Lifecycle', () => {
  test('INV-01: Valid credentials transition session from ANONYMOUS to AUTHENTICATED @p0', async ({
    loginPage,
  }) => {
    await loginPage.navigateTo('/login');
    await loginPage.login('user@example.com', 'secret123');
    await loginPage.assertUrl(/.*dashboard/);
  });
});
```

---

## 1. Phase 1: PLAN (Pillar M — Live Exploration to `*.mate-spec.md`)

**Goal:** Explore the live application via a seed test + `playwright-cli`, discover the Finite State Machine, Forbidden Transitions, and Invariants, and write `specs/<module>.mate-spec.md`.

1. **Read `MATE-PROJECT-MAP.md` first** to inspect existing modules, Page Objects, and fixtures.
2. **Launch via Seed Fixture (`--debug=cli`):**
   ```bash
   PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/seed.spec.ts --debug=cli
   # Wait for "Debugging Instructions" and session ID tw-XXXX
   playwright-cli attach tw-XXXX
   playwright-cli resume
   ```
3. **Probe States & Transitions:**
   ```bash
   playwright-cli snapshot
   playwright-cli find "Checkout"
   playwright-cli click e5
   playwright-cli show --annotate   # Optional: ask human QE for visual feedback
   ```
4. **Author & Validate `specs/<module>.mate-spec.md`:**
   - Populate YAML frontmatter (`module`, `version`, `status: APPROVED`).
   - Populate `<intent_model>` (FSM + **Explicitly Forbidden Transitions**), `<invariants>` (`INV-01`...), `<threat_scenarios>` (`THR-01`...), and `<exploratory_charters>`.
   - Validate with `npx mate-sdt validate specs/<module>.mate-spec.md`.

---

## 2. Phase 2: GENERATE (Pillar A & T — Spec to SOLID Code)

1. **Walk each invariant and scenario** in `specs/<module>.mate-spec.md` using `playwright-cli` attached to the seed session.
2. **Check `MATE-PROJECT-MAP.md`:**
   - Does a Page Object or Component Object already exist for this screen? **Extend it** (Open/Closed Principle) rather than creating a duplicate file.
   - If it is a new screen, create `src/pages/<name>.page.ts` extending `BasePage` and register it in `src/fixtures/mate.fixtures.ts` and `MATE-PROJECT-MAP.md`.
3. **Add Deterministic Oracles (Zero Arbitrary Sleeps):**
   - Use `playwright-cli --raw generate-locator <ref>` and `playwright-cli --raw snapshot <ref>`.
   - Assert state with `toBeVisible()`, `toHaveText()`, `toHaveValue()`, or `toMatchAriaSnapshot()`.
   - **Never** use `page.waitForTimeout()`.
4. **Run the Test & Static Health Audit:**
   ```bash
   PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e/<module>.spec.ts
   npx mate-sdt audit
   ```
   Ensure `npx mate-sdt audit` reports **Health Score: `A (100/100)`**.

---

## 3. Phase 3: HEAL (Day-2 Diagnosis & Spec Reconciliation)

When a test fails in CI or locally:

1. **Attach `playwright-cli` to the failing test:**
   ```bash
   PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e/<module>.spec.ts:<line> --debug=cli
   playwright-cli attach tw-XXXX
   ```
2. **Inspect DOM, Console & Network:**
   ```bash
   playwright-cli snapshot
   playwright-cli console error
   playwright-cli requests
   ```
3. **Apply the M.A.T.E. Healing Decision Tree:**
   - **Case A — Pure Technical Locator Drift (UI renamed a button or structure changed, but invariant still holds):**
     - Update the locator inside **`src/pages/<module>.page.ts`** or **`src/components/<widget>.component.ts`**.
     - Do **not** scatter raw fixes into the test file. Rerun the test and `npx mate-sdt audit`.
   - **Case B — Intentional Business Flow Evolution:**
     - Confirm with the user, update `specs/<module>.mate-spec.md` first, validate via `npx mate-sdt validate`, and update the Page Object method.
   - **Case C — Production Bug / Broken Invariant (`INV-XX` or Forbidden Transition violated):**
     - **NEVER weaken or delete an assertion to make a broken application pass!**
     - Run `npx mate-sdt bug <module>` (`mate-triage` skill) to generate a formal Bug Report in `docs/bugs/` citing the exact broken invariant, and mark the test with `test.fixme()` referencing the bug ID.
