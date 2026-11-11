---
name: mate-story-testcases
description: >-
  Source-agnostic User Story Ingestion & Test Case Design specialist for the M.A.T.E. Method.
  USE WHEN: The tester references a User Story, ticket, PRD, or acceptance criteria from an external MCP
  (Atlassian Jira/Confluence/Xray, Notion, Linear, GitHub Issues, Azure DevOps), a local file (Excel .xlsx/.csv,
  Markdown, PDF), or pasted text, and needs to design comprehensive Test Cases covering Happy Paths, Border/Boundary
  Cases, Negative Paths, and Forbidden Transitions.
  SYNERGY: Hands off to `mate-model` (to formalize `specs/*.mate-spec.md`), `mate-pw-recon` (to validate the
  story live in the browser via `@playwright/cli`), and `mate-assert-playwright` + `mate-pw-codegen` (to automate all cases).
---

# 📋 Skill: User Story Ingestion & Test Case Design (`mate-story-testcases`)

This skill bridges the gap between **daily QA requirement sources** (Jira/Atlassian MCP, Notion MCP, Excel/CSV spreadsheets, or written user stories) and **M.A.T.E.'s Spec-Driven Testing (SDT) lifecycle**.

Its mission is two-fold:
1. **Ingest Requirements Without Friction:** Automatically fetch User Stories and Acceptance Criteria from connected MCP servers or local files without forcing the tester to copy-paste everything manually.
2. **Eradicate "Happy-Path-Only" Bias:** Systematically design a complete **Test Case Matrix** (`tests/cases/TC-[module].md` and `tests/cases/TC-[module].csv`) covering **Happy Paths, Border/Boundary Cases, Negative Paths, and Forbidden State Transitions** before a single line of test code is written.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-core`** | Reads `MATE-PROJECT-MAP.md` to understand existing domain modules, roles, and invariants before analyzing a new User Story. |
| **Companion (Step 1)** | **`mate-model`** | Translates the ingested User Story & Acceptance Criteria into a formal `specs/[module].mate-spec.md` with `<intent_model>` and `<invariants>`. |
| **Companion (Step 2)** | **`mate-pw-recon`** | Uses `@playwright/cli` (`open`, `snapshot`) on the running app to verify whether the User Story works in real life and discover undocumented UI states. |
| **Downstream (Step 3)** | **`mate-assert-playwright` + `mate-pw-codegen`** | Automates **100% of the Automatable Test Cases** (Happy + Border + Negative). Enforces the **Anti-Greenwashing Rule**: if a test case fails because the app has a bug, the test is still created and marked with `test.fail()`. |
| **Downstream (Step 4)** | **`mate-triage`** | If live verification or test execution reveals that the app violates a User Story requirement, generates `tests/bugs/BUG-*.md` and links it back to Jira/Notion/Excel. |

---

## 🔌 1. Source-Agnostic Requirement Ingestion Protocol

Never assume a single tool. Detect how the tester provided the User Story or existing manual test suite and use the matching ingestion path (see [`references/mcp-and-file-ingestion.md`](./references/mcp-and-file-ingestion.md) and [`references/legacy-manual-migration.md`](./references/legacy-manual-migration.md)):

1. **Atlassian MCP (Jira / Confluence / Xray / Zephyr):**
   - When the tester mentions a Jira key (e.g., `PROJ-142`) or Confluence URL and an Atlassian MCP server is available, call the MCP tool to read the issue summary, description, acceptance criteria, linked subtasks, and comments.
   - If the tester wants to push designed Test Cases back to Jira/Xray/Zephyr, format them according to the issue tracker's test steps schema or export `tests/cases/TC-[module].csv`.
2. **Notion / Linear / GitHub Issues / Azure DevOps MCP:**
   - Query the page, database item, or issue directly via the corresponding MCP tool.
3. **Local Files (Excel `.xlsx`, `.csv`, `.md`, `.json`, `.txt`):**
   - If the tester references a spreadsheet or document in the workspace, read the file directly (or parse `.csv`/`.xlsx` via Node/Python one-liner if needed).
4. **No MCP / Missing Context Fallback (Handling Uncertainty Protocol):**
   - If the tester references a ticket ID (e.g., `JIRA-999`) but no MCP is configured, politely inform them and ask them to paste the User Story / Acceptance Criteria or point to an exported file (`.csv`/`.md`).
   - Flag any ambiguous or missing business rule as `[TBD: clarify with Product/Dev]` rather than guessing.

---

## 🧠 2. Mandatory 4-Quadrant Test Case Design Rules

For **every** User Story or feature, you MUST design test cases across all 4 quadrants—never stop at the Happy Path:

| Quadrant | Category Tag | Technique Applied | Minimum Coverage Requirement |
| :--- | :--- | :--- | :--- |
| **Q1: Happy Path** | `[HAPPY_PATH]` | Acceptance Criteria Walkthrough | Every explicit Acceptance Criterion (AC) in the User Story works end-to-end with valid inputs. |
| **Q2: Border & Boundary** | `[BORDER_CASE]` | Boundary Value Analysis (BVA) & Equivalence Partitioning | Min, Min-1, Max, Max+1 lengths/amounts, empty strings, whitespace-only, special characters/Unicode, timezone/midnight boundaries, zero/negative numbers. |
| **Q3: Negative & Error** | `[NEGATIVE_PATH]` | Invalid Input & Fault Handling | Missing required fields, invalid formats, unauthorized role access (`401`/`403`), duplicate submission, backend `4xx`/`5xx` graceful UI error messages. |
| **Q4: State & Concurrency** | `[STATE_TRANSITION]` | Finite State Machine & Forbidden Transitions | Refreshing mid-transaction, browser Back button after submit, double-clicking submit, modifying cart/data in a second tab (`mate-pw-forensics`). |

---

## 📊 3. Dual Artifact Generation (`.md` + `.csv`)

Whenever you design test cases for a User Story, generate **both** artifacts in `tests/cases/` (or run `npx mate-sdt cases <module>`):

1. **`tests/cases/TC-[module].md`** (Template: [`resources/test-cases.template.md`](./resources/test-cases.template.md)):
   - Human-readable specification traceability table linking `TC-ID` ➔ `Story AC` ➔ `Spec Invariant (INV-XX)` ➔ `Category` (`HAPPY_PATH` / `BORDER_CASE` / `NEGATIVE_PATH` / `STATE_TRANSITION`) ➔ `Preconditions` ➔ `Steps` ➔ `Expected Oracle` ➔ `Live Verification Status` ➔ `Automated Spec Path`.
2. **`tests/cases/TC-[module].csv`** (Template: [`resources/test-cases.template.csv`](./resources/test-cases.template.csv)):
   - Standard comma-separated file ready for one-click import into **Excel, Google Sheets, Jira (Xray / Zephyr), TestRail, or Notion databases**.

---

## 🚨 4. The Anti-Greenwashing Mandate (When a Test Case Fails Against the App)

When validating a Test Case via `playwright-cli` (`mate-pw-recon`) or executing it in Playwright (`mate-assert-playwright`):

1. **NEVER omit a failing Test Case from automation.** If `TC-04 (Border Case: Discount = 100%)` fails because the app crashes or shows `NaN`, you MUST still write the automated test in `tests/e2e/[module].spec.ts`.
2. **NEVER alter the expected assertion to match buggy behavior.** The assertion must assert what the User Story / Invariant requires.
3. **Mark & Report:**
   - Annotate the failing automated test with `test.fail(true, 'BUG-XXX: App violates AC-2 / INV-03 on TC-04')` (or `test.fixme()` if it hangs/crashes the browser).
   - Mark `TC-04` as `❌ FAIL (BUG-XXX)` in `tests/cases/TC-[module].md` and `.csv`.
   - Generate the formal bug report in `tests/bugs/` (`npx mate-sdt bug <module>`).
   - Highlight the failure prominently in the final report to the tester.
