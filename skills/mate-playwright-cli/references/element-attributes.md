# 🔍 Inspecting Element Attributes & Building Resilient Page Object Locators

When `playwright-cli snapshot` shows an element reference (e.g., `e7`) but you need to inspect its underlying `data-testid`, `aria-*` attributes, or DOM properties to build a resilient locator for a Page Object:

## 1. Inspecting Attributes via `eval` and `generate-locator`

```bash
playwright-cli snapshot

# Generate the recommended semantic Playwright locator for e7
playwright-cli --raw generate-locator e7

# Inspect specific attributes on ref e7
playwright-cli eval "el => el.getAttribute('data-testid')" e7
playwright-cli eval "el => el.getAttribute('aria-label')" e7
playwright-cli eval "el => el.getAttribute('role')" e7
playwright-cli eval "el => el.id" e7
playwright-cli eval "el => getComputedStyle(el).visibility" e7
```

---

## 2. M.A.T.E. Selector Priority Hierarchy (For Page & Component Objects)

When storing locators as `readonly` properties on a `BasePage` or `BaseComponent` subclass, enforce this strict order of resilience:

1. **`getByRole(role, { name })`** — Highest resilience; validates WCAG accessibility semantics simultaneously.
2. **`getByLabel(text)` / `getByPlaceholder(text)`** — Ideal for form inputs.
3. **`getByTestId(id)`** — Ideal for dynamic data containers where text changes (`[data-testid="order-total"]`).
4. **Scoped CSS (`this.rootLocator.locator(...)`)** — Only when semantic attributes are unavailable.
5. **⛔ Forbidden (`MATE-ANTI-05`):** Raw absolute XPaths (`//div/div[3]/button`) or brittle `:nth-child()` chains.
