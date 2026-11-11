# 🐞 Running and Debugging Playwright Tests (`--debug=cli`)

## 1. Running Playwright Suites (Headless CI & Local Mode)

Always set `PLAYWRIGHT_HTML_OPEN=never` so the HTML report server does not block agent execution:

```bash
# Run full suite
PLAYWRIGHT_HTML_OPEN=never npx playwright test

# Run P0 blocking invariants only (Risk-Based Execution)
PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep @p0

# Run a specific spec file
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e/orders.spec.ts
```

---

## 2. Live Interactive Debugging with `--debug=cli` + `playwright-cli attach`

To diagnose a failing test or step through a Page Object workflow interactively:

1. **Start the test with `--debug=cli` in the background:**
   ```bash
   PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e/orders.spec.ts --debug=cli
   ```
   Wait until the console prints `"Debugging Instructions"` containing the session name (e.g., `tw-abcdef`).

2. **Attach `playwright-cli` to the paused test session:**
   ```bash
   playwright-cli attach tw-abcdef
   ```

3. **Inspect, Step, and Rehearse:**
   ```bash
   playwright-cli snapshot
   playwright-cli console
   playwright-cli requests
   playwright-cli --raw generate-locator e12
   ```

4. **Update the Page Object & Clean Up:**
   - Copy any updated semantic locator (`getByRole`, `getByLabel`, `getByTestId`) into the corresponding Page Object (`src/pages/*.page.ts`) or Component Object (`src/components/*.component.ts`).
   - Stop the background `--debug=cli` process and rerun the test normally to confirm green.
   - Run `npx mate-sdt audit` to ensure no `.only` or `waitForTimeout` calls were left behind.
