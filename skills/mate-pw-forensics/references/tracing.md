# Execution Tracing & Forensic Triage in M.A.T.E.

Capture full Playwright execution traces via `playwright-cli` for **Pillar E (Exploratory Session Charters)** and **Root-Cause Failure Triage (`mate-triage`)**.

---

## 1. Starting and Stopping Traces via `playwright-cli`

A Playwright trace captures every DOM snapshot (before, during, and after each action), console log, uncaught page error, network request/response payload, and timeline screenshot.

```bash
# Start recording a trace in the active session
playwright-cli tracing-start

# Perform the reproduction steps or exploratory charter actions
playwright-cli open https://app.example.com/checkout
playwright-cli fill e4 "DISCOUNT-50"
playwright-cli click e8

# Stop tracing and write the trace archive
playwright-cli tracing-stop
```

---

## 2. Trace Output Structure

When `tracing-stop` runs, files are saved under `.playwright-cli/traces/`:

- `trace-{timestamp}.trace` — Action log, DOM snapshots, console logs, and metadata.
- `trace-{timestamp}.network` — Full HAR-like network log of every HTTP/WebSocket call.
- `resources/` — Extracted response bodies, stylesheets, and screenshots.

To view a trace interactively in the Playwright Trace Viewer:

```bash
npx playwright show-trace .playwright-cli/traces/trace-<timestamp>.zip
```

---

## 3. Using Traces in M.A.T.E. Workflows

### Workflow 1: Exploratory Testing Evidence (`mate-explore` — Pillar E)

When you uncover an edge case or unexpected behavior during a 30–60 minute time-boxed exploratory charter (`docs/mate/charters/<feature>-charter.md`):

1. Run `playwright-cli tracing-start`.
2. Reproduce the exact sequence of actions that triggers the anomaly.
3. Run `playwright-cli tracing-stop` and `playwright-cli screenshot --filename=docs/mate/bugs/<id>-evidence.png`.
4. Reference the trace path and screenshot inside the **Bugs & Anomalies Discovered** table of the charter and in the generated Bug Report (`npx mate-sdt bug <id> "<title>"`).

### Workflow 2: Root-Cause Classification (`mate-triage`)

During `mate-flow-triage`, inspect trace data to classify failures into one of the 4 canonical root-cause buckets:

| Evidence in Trace | Classification | Required Action |
| :--- | :--- | :--- |
| Action log shows element existed with a renamed `data-testid` or new ARIA label; API returned `200 OK` | **Bucket 1: Locator Drift (UI Evolution)** | Update the single `readonly` locator property inside `src/pages/<domain>.page.ts` or `src/components/<component>.component.ts`. |
| Action log shows action fired before network settled or animation completed | **Bucket 2: Timing / Flakiness** | Replace imperative checks with web-first assertions (`await expect(locator).toBeVisible()`) inside the Page Object. |
| Network log shows `503 Service Unavailable`, `ECONNREFUSED`, or expired auth token | **Bucket 3: Environment / Test Data** | Fix fixture setup, mock boundary (`src/mocks/`), or environment health check. |
| Network log shows `500 Internal Server Error` or UI violates `[INV-XX]` despite valid inputs | **Bucket 4: Real Product Defect (Bug)** | Generate `docs/mate/bugs/BUG-XXX.md` via `npx mate-sdt bug`, attach trace & screenshot, and mark the spec with `test.fixme()`. |

---

## 4. Automated Trace Capture in `playwright.config.ts`

Ensure `playwright.config.ts` always keeps traces on first retry or on failure so CI runs produce the same forensic data automatically:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```
