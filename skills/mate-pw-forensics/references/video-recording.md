# Video Recording & Screencast Evidence in M.A.T.E.

Record high-frame-rate WebM videos with cursor highlights, action annotations, and chapter cards via `playwright-cli` for **Bug Reproduction Evidence (`mate-triage`)**, **Exploratory Session Recordings (`mate-explore`)**, and **Pull Request Demos**.

---

## 1. CLI Video Recording Commands

Record a session directly from the terminal without writing custom scripts:

```bash
# Open the target page
playwright-cli open https://app.example.com

# Start a 60fps video recording with visible cursor and action badges
playwright-cli video-start demo-checkout.webm --cursor --fps=60
playwright-cli video-show-actions

# Insert a chapter title card
playwright-cli video-chapter "1. Cart Review" --description="Validating item subtotals [INV-01]" --duration=1800

# Perform interactions
playwright-cli click e4
playwright-cli fill e7 "PROMO20"
playwright-cli click e9

# Insert another chapter card
playwright-cli video-chapter "2. Order Confirmation" --description="Verifying order receipt generation" --duration=1800

# Hide action overlays if desired and stop recording
playwright-cli video-hide-actions
playwright-cli video-stop
```

### Command Summary

| Command | Purpose |
| :--- | :--- |
| `playwright-cli video-start [filename] [--cursor] [--fps=60]` | Begin recording the active browser viewport to a `.webm` file. |
| `playwright-cli video-stop` | Finalize and save the WebM recording. |
| `playwright-cli video-chapter <title> [--description=...] [--duration=ms]` | Render a full-screen chapter card overlay before the next step. |
| `playwright-cli video-show-actions` | Enable visual click ripples and keystroke badges on the recording. |
| `playwright-cli video-hide-actions` | Disable visual action overlays. |

---

## 2. Programmatic Screencast Scripts (`page.screencast`)

When building a standalone bug reproduction video or PR feature walkthrough script (outside of `tests/**/*.spec.ts`), you can use Playwright's programmatic `page.screencast` API while reusing your **M.A.T.E. Page Objects**:

```typescript
// scripts/record-bug-repro.ts (Standalone demo script — NOT an automated test spec)
import { chromium } from 'playwright';
import { CheckoutPage } from '../src/pages/checkout.page';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.screencast.start({ path: 'docs/mate/bugs/bug-042-repro.webm', fps: 60 });
await page.screencast.showCursor();
await page.screencast.showActions({ position: 'top-right' });

const checkoutPage = new CheckoutPage(page);

await page.screencast.showChapter('BUG-042 Reproduction', {
  description: 'Applying two sequential discount codes results in a negative total [Violates INV-03]',
  duration: 2000,
});

await checkoutPage.navigate();
await checkoutPage.applyCoupon('SAVE50');
await checkoutPage.applyCoupon('VIP50');

await page.screencast.stop();
await browser.close();
```

---

## 3. Architectural Guardrail: Screencast Pacing vs. Test Determinism

> **CRITICAL M.A.T.E. RULE:**
> Visual pacing delays (`duration` in `showChapter` or presentation pauses in standalone video generator scripts) are **strictly limited to standalone documentation/demo scripts** (such as `scripts/record-*.ts`).
>
> **NEVER** place `page.waitForTimeout()` or artificial presentation sleeps inside:
> - `src/pages/**/*.page.ts`
> - `src/components/**/*.component.ts`
> - `src/fixtures/**/*.fixtures.ts`
> - `tests/**/*.spec.ts`
>
> Automated tests must execute at maximum deterministic speed using Playwright auto-waiting and web-first assertions (`expect(locator).toBeVisible()`).
