# Session Management & Multi-Actor Concurrency in M.A.T.E.

Run multiple isolated browser sessions simultaneously, persist profiles across commands, attach to live browser instances, and test concurrent multi-actor scenarios under **Pillar T (Threat & Risk Analysis)**.

---

## 1. Named Sessions (`-s=<name>`)

Use `-s=<name>` (or `--session=<name>`) to run and control multiple independent browsers at the same time:

```bash
# Default session
playwright-cli open https://app.example.com

# Named sessions with isolated cookies, storage, and history
playwright-cli -s=buyer-a open https://app.example.com/checkout
playwright-cli -s=buyer-b open https://app.example.com/checkout
playwright-cli -s=admin open https://admin.example.com --persistent

# Interact with a specific session
playwright-cli -s=buyer-a click e12
playwright-cli -s=buyer-b click e12
```

### Environment Variable (`PLAYWRIGHT_CLI_SESSION`)

Set a default session name for the current shell to avoid repeating `-s`:

```bash
export PLAYWRIGHT_CLI_SESSION="auth-user"
playwright-cli open https://app.example.com
playwright-cli click e5
```

---

## 2. Multi-Actor Concurrency Testing (Pillar T)

A critical risk category in **Pillar T (`mate-threat`)** is **State & Concurrency Attacks**: race conditions, double-spend vulnerabilities, inventory overselling, and stale-state overwrites.

### Interactive Race-Condition Probe via `playwright-cli`

1. Launch two named sessions logged in as separate users (or the same user on two devices):
   ```bash
   playwright-cli -s=actor1 open https://app.example.com/product/limited-sku
   playwright-cli -s=actor2 open https://app.example.com/product/limited-sku
   ```
2. Navigate both sessions to the final confirmation step.
3. Trigger the mutation simultaneously or inspect how the UI behaves when Actor 1 completes the purchase while Actor 2 holds a stale checkout form.

### Translating Multi-Actor Scenarios into M.A.T.E. Page Objects & Tests

When promoting a multi-actor test to `tests/e2e/` or `tests/security/`, instantiate multiple `BrowserContext` instances and inject each context's `Page` into its own Page Object instance (**OOP Composition**):

```typescript
// tests/e2e/inventory-concurrency.spec.ts
import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../src/pages/checkout.page';

test.describe('Checkout Concurrency @security @concurrency', () => {
  test('should prevent overselling the last item in stock [THREAT-02 / INV-05]', async ({ browser }) => {
    const contextA = await browser.newContext({ storageState: 'playwright/.auth/buyer-a.auth-state.json' });
    const contextB = await browser.newContext({ storageState: 'playwright/.auth/buyer-b.auth-state.json' });

    const buyerACheckout = new CheckoutPage(await contextA.newPage());
    const buyerBCheckout = new CheckoutPage(await contextB.newPage());

    await Promise.all([
      buyerACheckout.navigate(),
      buyerBCheckout.navigate(),
    ]);

    // Trigger concurrent order submissions
    await Promise.all([
      buyerACheckout.submitOrder(),
      buyerBCheckout.submitOrder(),
    ]);

    await contextA.close();
    await contextB.close();
  });
});
```

---

## 3. Managing & Cleaning Up Sessions

```bash
# List all active and configured sessions
playwright-cli list

# Gracefully close a session's browser
playwright-cli close
playwright-cli -s=buyer-a close

# Close all running browsers across all sessions
playwright-cli close-all

# Forcefully terminate stuck or zombie daemon processes
playwright-cli kill-all

# Wipe stored profile data (cookies, IndexedDB, cache) for a session
playwright-cli delete-data
playwright-cli -s=admin delete-data
```

Always run `playwright-cli close` (or `close-all`) after finishing a discovery or exploratory session.

---

## 4. Persistent Profiles vs. Ephemeral Sessions

By default, browser profile data is kept in memory and discarded when the browser closes.

```bash
# Ephemeral (in-memory) session — default
playwright-cli open https://example.com

# Persistent profile (auto-generated storage directory)
playwright-cli open https://example.com --persistent

# Persistent profile at an explicit directory path
playwright-cli open https://example.com --profile=/path/to/profile
```

---

## 5. Attaching to Existing Browsers

### Attach via Chrome DevTools Protocol (`--cdp`)

Connect `playwright-cli` to an already-running Chromium/Chrome instance started with `--remote-debugging-port` or a remote endpoint:

```bash
playwright-cli attach --cdp=http://localhost:9222
playwright-cli -s=local-debug attach --cdp=ws://127.0.0.1:9222/devtools/browser/...
```

### Attach via Browser Extension (`--extension`)

Connect to an active Chrome/Edge session through the Playwright Browser Extension:

```bash
playwright-cli attach --extension
playwright-cli attach --extension=chrome
```
