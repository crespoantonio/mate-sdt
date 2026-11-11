# 🌐 Live Web Page Reconnaissance Protocol (`page-explorer` Mode)

Use this protocol within `mate-model` (or `mate-explore`) when requirements documentation is missing, outdated, or when reverse-engineering a live application via **Playwright MCP** or browser automation tools.

---

## 1. Safety & Operational Boundaries (Non-Negotiable)
1. **Never submit destructive actions in production:** Ask explicit user permission before clicking actions like *"Delete Account"*, *"Cancel Subscription"*, or triggering real financial charges.
2. **Never store credentials in specs or git:** Ask the user to authenticate in the browser session or provide temporary sandbox credentials via environment variables.
3. **Time-box exploration:** Limit each autonomous page reconnaissance pass to 30 minutes or one cohesive user flow at a time.
4. **Confidence Tagging:** Mark every discovered rule as `[OBSERVED]` (directly tested in the DOM/network) or `[INFERRED]` (deduced from UI labels).

---

## 2. Four-Phase Reconnaissance Workflow

### Phase 1: Entry & Initial State Capture
1. Navigate to the target URL via Playwright MCP and wait for network/DOM stability.
2. Capture an initial screenshot (`{module}-initial-state.png`).
3. Check authentication barriers; prompt the user if login is required.

### Phase 2: DOM & Semantic Element Inventory
Categorize all interactive elements prioritizing accessibility locators (`role`, `label`, `testId`):
- **Navigation:** Menus, tabs, breadcrumbs, step indicators.
- **Forms & Inputs:** Text fields, selects, checkboxes, date pickers, file uploads, validation constraints (`required`, `min`, `max`, `pattern`).
- **Triggers & Actions:** Primary/secondary submit buttons, toggles, destructive actions.
- **Feedback & State Indicators:** Spinners, skeleton loaders, toast notifications (`role="alert"`), inline validation messages.

### Phase 3: State Transition & Edge-Case Probing
1. **Happy Path Transition:** Execute valid input steps, observe network requests (`POST/PUT/GET`), and record state transitions (`State A -> State B`).
2. **Boundary & Validation Probing:** Test empty submission, invalid formats (e.g., malformed email, negative numbers), and rapid double-clicks to observe how the UI and API respond.
3. **Accessibility Quick-Scan:** Check keyboard `Tab` focus order, modal focus trapping, and `aria-live` error announcements.

### Phase 4: Synthesis into `specs/[module].mate-spec.md`
Translate the reconnaissance findings directly into the 4 M.A.T.E. XML blocks:
- **`<intent_model>`**: Populate the observed Finite State Machine, legal transitions, and any **Forbidden Transitions** discovered (e.g., clicking "Next Step" before required fields validate).
- **`<invariants>`**: Convert observed form/API validations and business calculations into `INV-01`, `INV-02`, etc.
- **`<threat_scenarios>`**: Flag endpoints or buttons lacking debounce/idempotency protection as `THR-01`, `THR-02`.
- **`<exploratory_charters>`**: Document areas that were `[BLOCKED]` or require deeper human usability judgment.
