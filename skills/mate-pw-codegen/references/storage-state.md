# Storage State, Authentication & Dependency Inversion in M.A.T.E.

Manage cookies, `localStorage`, `sessionStorage`, IndexedDB, and reusable authentication state (`storageState`) via `playwright-cli`, and wire them cleanly into M.A.T.E.'s **Dependency Inversion Fixtures (`src/fixtures/mate.fixtures.ts`)**.

---

## 1. Saving and Loading Storage State via `playwright-cli`

`storageState` exports cookies and `localStorage` into a portable JSON file so you can bypass repetitive login flows during DOM modeling, exploratory testing, and automated test execution.

```bash
# 1. Open the login page and authenticate once
playwright-cli open https://app.example.com/login
playwright-cli fill e1 "qa-user@example.com"
playwright-cli fill e2 "SuperSecret123!"
playwright-cli click e3

# 2. Save authenticated state to a gitignored JSON file
playwright-cli state-save playwright/.auth/user.auth-state.json

# 3. Restore state immediately in any new session
playwright-cli open https://app.example.com/dashboard
playwright-cli state-load playwright/.auth/user.auth-state.json
playwright-cli reload
```

> **Security Mandate:** Never commit `.auth-state.json` files to version control. Ensure `*.auth-state.json` and `playwright/.auth/` are listed in `.gitignore`.

---

## 2. Wiring `storageState` into M.A.T.E. Dependency Inversion Fixtures

In M.A.T.E., tests **must never** perform UI login in `beforeEach` unless the test is specifically validating the authentication domain itself. Instead, inject authenticated Page Objects through `src/fixtures/mate.fixtures.ts`:

```typescript
// src/fixtures/mate.fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { AdminSettingsPage } from '../pages/admin-settings.page';

export type MateFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  adminSettingsPage: AdminSettingsPage;
};

export const test = base.extend<MateFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  adminSettingsPage: async ({ browser }, use) => {
    // Dedicated context pre-hydrated with admin storage state
    const context = await browser.newContext({
      storageState: 'playwright/.auth/admin.auth-state.json',
    });
    const page = await context.newPage();
    await use(new AdminSettingsPage(page));
    await context.close();
  },
});

export { expect } from '@playwright/test';
```

---

## 3. Cookie Management Commands

Inspect and manipulate cookies directly from the CLI to test session expiration, `HttpOnly`/`SameSite` flags, and unauthenticated redirects (**Pillar T**):

```bash
# List all cookies (optionally filter by domain)
playwright-cli cookie-list
playwright-cli cookie-list --domain=example.com

# Inspect a specific cookie
playwright-cli cookie-get session_id

# Set a cookie with security attributes
playwright-cli cookie-set session_id "abc123xyz" --domain=example.com --httpOnly --secure --sameSite=Strict
playwright-cli cookie-set feature_flag "new_checkout" --domain=example.com --path=/

# Delete a single cookie or clear all cookies
playwright-cli cookie-delete session_id
playwright-cli cookie-clear
```

---

## 4. `localStorage` Commands

```bash
# List all key-value pairs in localStorage
playwright-cli localstorage-list

# Read a specific key
playwright-cli localstorage-get auth_token

# Set a key-value pair (useful for feature flags, theme state, or onboarding bypass)
playwright-cli localstorage-set onboarding_completed "true"
playwright-cli localstorage-set theme "dark"

# Delete a key or clear localStorage
playwright-cli localstorage-delete auth_token
playwright-cli localstorage-clear
```

---

## 5. `sessionStorage` Commands

```bash
# List all key-value pairs in sessionStorage
playwright-cli sessionstorage-list

# Read a specific key
playwright-cli sessionstorage-get checkout_step

# Set a key-value pair
playwright-cli sessionstorage-set checkout_step "payment"

# Delete a key or clear sessionStorage
playwright-cli sessionstorage-delete checkout_step
playwright-cli sessionstorage-clear
```

---

## 6. IndexedDB Inspection via `run-code`

When an offline-first or PWA application stores state in IndexedDB, inspect or seed it via `run-code`:

```bash
# List all IndexedDB databases for the current origin
playwright-cli run-code "async page => {
  return await page.evaluate(() => indexedDB.databases());
}"
```
