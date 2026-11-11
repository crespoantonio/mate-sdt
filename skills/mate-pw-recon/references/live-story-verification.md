# Live User Story Verification & Locator Mapping Protocol

How to use `@playwright/cli` (`mate-pw-recon`) to validate User Story Acceptance Criteria and Border Cases against a live application before writing automated test code.

---

## 1. The 5-Step Live Verification Loop

Given a User Story (from Atlassian/Jira MCP, Notion MCP, Excel/CSV, or Markdown) and its Test Case Matrix (`tests/cases/TC-[module].md`):

### Step 1: Open & Snapshot the Entry State
```bash
playwright-cli open http://localhost:3000/orders/new
```
- Inspect the YAML snapshot returned by `playwright-cli`.
- Identify which elements belong to reusable **Component Objects** (`src/components/`) vs. the **Page Object** (`src/pages/`).

### Step 2: Execute Happy Path (`TC-01`) and Capture Semantic Locators
```bash
playwright-cli fill e3 "2.5"
playwright-cli select e5 "delicate-wash"
playwright-cli click e8
```
- Copy the semantic locators emitted under `#Ran Playwright code:` (e.g., `page.getByLabel('Weight (kg)')`, `page.getByRole('button', { name: 'Create Order' })`).
- Check `playwright-cli console` and `playwright-cli network` to verify clean execution.

### Step 3: Probe Border Cases (`TC-02`, `TC-03`) & Negative Paths (`TC-04`)
```bash
# Border Case: 0 kg weight
playwright-cli fill e3 "0"
playwright-cli click e8

# Border Case: Negative weight
playwright-cli fill e3 "-5"
playwright-cli click e8

# Border Case: Maximum limit + 1 (e.g., 50.1 kg when max is 50 kg)
playwright-cli fill e3 "50.1"
playwright-cli click e8
```

### Step 4: Compare Actual Behavior vs. User Story Oracles
For every test case, compare what the browser actually did against the User Story / Spec Invariant (`[INV-XX]`):

| Scenario | Actual Browser Behavior | Action Required |
| :--- | :--- | :--- |
| **Behavior matches Spec Oracle** | Validation error shown (`role="alert"`) and invalid request blocked | Mark `Live CLI Check = ✅ PASS` in `TC-[module].md`. Hand off to `mate-pw-codegen` to write a standard passing test. |
| **Behavior violates Spec Oracle (BUG!)** | App accepts `-5 kg` and creates an order with `-$25.00` total | 1. Mark `Live CLI Check = ❌ FAIL (BUG-XXX)` in `TC-[module].md`.<br>2. Capture screenshot (`playwright-cli screenshot --filename=tests/bugs/bug-negative-weight.png`).<br>3. Generate bug report (`npx mate-sdt bug orders`).<br>4. **Still automate the test** in `tests/e2e/orders.spec.ts` with the real oracle (`expect(errorAlert).toBeVisible()`) and mark it with `test.fail(true, 'BUG-XXX: App accepts negative weight violating INV-01')`. |

### Step 5: Close Session Cleanly
```bash
playwright-cli close
```
