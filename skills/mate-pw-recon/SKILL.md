---
name: mate-pw-recon
description: >-
  Live Browser Reconnaissance, User Story Verification & DOM/ARIA Discovery specialist using `@playwright/cli`.
  USE WHEN: You need to open a live URL (`playwright-cli open`), inspect ARIA snapshots (`playwright-cli snapshot`),
  interactively verify whether a User Story's Happy Paths, Border Cases, and Negative Paths actually work in the
  running browser, inspect DOM attributes/computed styles (`eval`), or discover semantic locators BEFORE writing
  automated test code.
  SYNERGY: Works alongside `mate-story-testcases` and `mate-model` during discovery/validation, and hands off
  discovered locators and pass/fail findings to `mate-pw-codegen` and `mate-assert-playwright`.
---

# 🔍 Skill: Live Browser Recon & Story Verification (`mate-pw-recon`)

This skill governs **Phase 1 of `@playwright/cli` in M.A.T.E.**: using the browser from the command line to **explore, verify User Stories in real time, test border cases interactively, and map semantic DOM/ARIA elements** before writing a single line of automated test code.

> [!IMPORTANT]
> **Tool-First Grounding (Zero Reasoning Speculation):**  
> When operating on frontier reasoning models (e.g., Claude 5.5 with Extended Thinking, OpenAI GPT-6, DeepSeek V4), **NEVER burn reasoning/thinking tokens trying to deduce or guess DOM selectors, CSS classes, or component hierarchies in internal thoughts.**  
> **Invoke `@playwright/cli` (`open`, `snapshot`, `eval`) immediately.** Every locator and assertion must be grounded on live accessibility snapshots, not internal speculation.
>
> **The Discrepancy Escalation Gate (Never Adapt Silently):**  
> If during `@playwright/cli` live exploration you discover ANY mismatch with the User Story (e.g. an undocumented mandatory field like `house_number`, differing error message copy, unexpected state reset, or account lockout):  
> **STOP IMMEDIATELY.** Do NOT unilaterally patch Page Objects, use permissive regexes, or bypass flows with silent workarounds. Ask the human engineer whether the behavior represents a Defect (`test.fail()`) or an intentional Specification Update before proceeding.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-story-testcases` & `mate-model`** | Provides the User Story Acceptance Criteria, Test Case Matrix (`TC-01..TC-NN`), and Spec Invariants (`INV-XX`) that need to be verified against the live app. |
| **Downstream (Automation)** | **`mate-pw-codegen` & `mate-assert-playwright`** | Receives the verified semantic locators (`getByRole`, `getByLabel`, `getByTestId`), reusable Component boundaries, and the list of passing vs. failing test cases to automate. |
| **Downstream (Defects)** | **`mate-pw-forensics` & `mate-triage`** | When a test case fails during live CLI verification, triggers `mate-pw-forensics` to capture a screenshot/trace/video and `mate-triage` (`npx mate-sdt bug`) to log the defect. |

---

## ⚡ 1. Core Recon & Interactive Verification Commands (`@playwright/cli`)

```bash
# Open target URL and automatically capture the initial ARIA snapshot with element refs (e1, e2...)
playwright-cli open http://localhost:3000/checkout

# Re-snapshot the page or a specific container after a state transition
playwright-cli snapshot
playwright-cli snapshot e12 --depth=3

# Interact with elements using snapshot refs to validate User Story steps
playwright-cli fill e4 "user@example.com"
playwright-cli click e7
playwright-cli press Enter
playwright-cli select e9 "express-shipping"
playwright-cli check e11

# Inspect console errors and network calls triggered by the interaction
playwright-cli console
playwright-cli network

# Inspect element attributes, computed styles, or ARIA properties
playwright-cli eval "el => el.getAttribute('aria-invalid')" e4
playwright-cli eval "el => getComputedStyle(el).color" e4

# Close browser when reconnaissance is complete
playwright-cli close
```

---

## 🧪 2. Live User Story & Border Case Verification Protocol

Before automating a User Story (`mate-story-testcases`), walk through the critical test cases in `playwright-cli`:

1. **Verify the Happy Path (`[HAPPY_PATH]`):**
   - Execute the steps via `playwright-cli fill/click`.
   - Observe the `#Ran Playwright code` output to collect exact semantic locators.
   - Check `playwright-cli network` and `playwright-cli console` to confirm zero silent `500` errors or unhandled exceptions.
2. **Probe Border & Negative Cases (`[BORDER_CASE]` & `[NEGATIVE_PATH]`):**
   - Test boundary values (`0`, negative numbers, max length + 1, empty strings, special characters) directly via `playwright-cli fill`.
   - Verify whether the UI displays accessible error messages (`role="alert"`, `aria-invalid="true"`).
3. **Record Honest Observations (`PASS` vs `FAIL`):**
   - Update the `Live CLI Check` column in `docs/test-cases/TC-[module].md` and `.csv`.
   - **CRITICAL:** If a border case or acceptance criterion **fails** in the live browser (e.g., applying a 100% discount results in `-10` or a `500` error), mark it as `❌ FAIL (BUG-XXX)` and pass it to `mate-pw-codegen` + `mate-assert-playwright` so the automated test is **still created** with `test.fail()`!

---

## 🏛️ 3. Mapping DOM Findings to M.A.T.E.'s SOLID Architecture

As you explore with `playwright-cli snapshot`, classify every UI element into the **Living Architecture Map (`MATE-PROJECT-MAP.md`)**:

- **Shared Widgets** (Navbars, Modals, Toasts, DatePickers, DataTables) ➔ Model as `BaseComponent` subclasses in `src/components/<widget>.component.ts`.
- **Page-Specific Elements** (Checkout form, Login form, Order summary) ➔ Model as `BasePage` subclasses in `src/pages/<domain>.page.ts`.
- **Locator Priority Hierarchy:**
  1. `page.getByRole(...)` (ARIA role + accessible name)
  2. `page.getByLabel(...)` (Form controls)
  3. `page.getByTestId(...)` (`data-testid` contract)
  4. Never use brittle XPath or `:nth-child` chains.

---

## 📚 Deep-Dive Reference Guides

Load these references on demand when inspecting complex DOM properties, reverse-engineering APIs, or probing browser APIs:
* **[Live Story Verification & Locator Mapping](./references/live-story-verification.md)** — Step-by-step protocol for validating Jira/Notion/Excel User Stories in `playwright-cli` and classifying pass/fail results.
* **[Black-Box Network API Reverse-Engineering](./references/network-api-discovery.md)** — Using `playwright-cli network` and `run-code` to discover hidden backend API endpoints, headers, and JSON schemas when Backend has no Swagger/OpenAPI docs.
* **[DOM Attributes, Computed Styles & WCAG Inspection](./references/element-attributes.md)** — Using `playwright-cli eval` to inspect attributes, bounding boxes, and accessibility states.
* **[Running Custom Playwright Code (`run-code`)](./references/running-code.md)** — Probing geolocation, clipboard, permissions, file downloads, and WebSockets during live recon.
