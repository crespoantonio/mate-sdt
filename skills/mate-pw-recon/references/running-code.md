# ⚡ Running Custom Playwright Code (`run-code`) Under M.A.T.E. Rules

Use `playwright-cli run-code` to execute custom Playwright context/page operations during interactive exploration, debugging, or environment emulation.

```bash
playwright-cli run-code "async page => {
  // Single async function expression receiving page
}"
# Or from a file:
playwright-cli run-code --filename=./scripts/setup-geo.js
```

---

## 1. Geolocation, Permissions & Media Emulation (Pillar E Charters)

```bash
# Grant geolocation and set coordinates (e.g., Buenos Aires)
playwright-cli run-code "async page => {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: -34.6037, longitude: -58.3816 });
}"

# Emulate reduced motion & dark mode for accessibility charter
playwright-cli run-code "async page => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
}"
```

---

## 2. Deterministic Event-Driven Waits (Zero `waitForTimeout`)

In accordance with **M.A.T.E. Commandment #4 (`MATE-ANTI-01`)**, never use `page.waitForTimeout()` for synchronization. Always wait on explicit DOM states, network responses, or predicates:

```bash
# Wait for a loading spinner to disappear deterministically
playwright-cli run-code "async page => {
  await page.getByTestId('loading-spinner').waitFor({ state: 'hidden', timeout: 10000 });
}"

# Wait for a specific API response before inspecting state
playwright-cli run-code "async page => {
  const responsePromise = page.waitForResponse(res => res.url().includes('/api/orders') && res.status() === 201);
  await page.getByRole('button', { name: 'Confirm Order' }).click();
  await responsePromise;
}"
```

---

## 3. Working with Iframes and File Downloads

```bash
# Interact inside an iframe
playwright-cli run-code "async page => {
  const frame = page.locator('iframe#payment-frame').contentFrame();
  await frame.getByRole('button', { name: 'Authorize' }).click();
}"

# Verify file download deterministically
playwright-cli run-code "async page => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export Invoice PDF' }).click();
  const download = await downloadPromise;
  return download.suggestedFilename();
}"
```
