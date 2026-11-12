---
name: mate-story-testcases
description: >-
  Source-agnostic User Story Ingestion, Pragmatic Test Case Design (Automated vs. Manual Decision Engine) &
  Exploratory Recommendation specialist for the M.A.T.E. Method.
  USE WHEN: The tester references a User Story, ticket, PRD, or legacy manual test suite from an external MCP
  (Atlassian Jira/Confluence/Xray, Notion, Linear, GitHub Issues, Azure DevOps), a local file (Excel .xlsx/.csv,
  Markdown, PDF), or pasted text, and needs a complete QA Companion Document (`tests/cases/TC-[module].md` & `.csv`)
  covering Happy Paths, Border/Boundary Cases, Negative Paths, State Transitions, what to Automate vs. what to
  run Manually (with explicit rationale), and tailored Exploratory Testing recommendations.
  SYNERGY: Hands off to `mate-model` (to formalize `specs/*.mate-spec.md`), `mate-pw-recon` (to validate the
  story live in the browser via `@playwright/cli`), `mate-assert-playwright` + `mate-pw-codegen` (to automate
  high-ROI UI/API cases), and `mate-explore` (to execute the recommended exploratory charters).
---

# 📋 Skill: User Story Ingestion, Pragmatic Test Design & QA Companion (`mate-story-testcases`)

This skill acts as your **Senior QA/QE Partner** when working with daily requirements (Jira/Atlassian MCP, Notion MCP, Excel/CSV spreadsheets, or written user stories).

Its mission is three-fold:
1. **Ingest Requirements Without Friction:** Automatically fetch User Stories and Acceptance Criteria from connected MCP servers or local files without forcing the tester to copy-paste everything manually.
2. **Design 4-Quadrant Coverage & Decide What to Automate vs. Keep Manual:** Not everything should be automated! Design Happy Paths, Border/Boundary Cases, Negative Paths, and State Transitions, and classify every case into **`[AUTOMATE_UI]`**, **`[AUTOMATE_API]`**, or **`[MANUAL_TEST]`** with an explicit **Engineering Rationale (`Why Automate vs. Why Manual`)**.
3. **Recommend Context-Aware Exploratory Testing Flows:** Generate tailored exploratory testing missions and border-case heuristics specific to what the tester is working on right now.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-core` & `mate-strategy`** | Reads `MATE-PROJECT-MAP.md` and `docs/TEST-STRATEGY.md` to understand existing domain modules, risk priority (`P0/P1/P2`), and test pyramid goals. |
| **Companion (Step 1)** | **`mate-model`** | Translates the ingested User Story & Acceptance Criteria into a formal `specs/[module].mate-spec.md` with `<intent_model>` and `<invariants>`. |
| **Companion (Step 2)** | **`mate-pw-recon`** | Uses `@playwright/cli` (`open`, `snapshot`) on the running app to verify whether the User Story works in real life and discover undocumented UI/API behavior. |
| **Downstream (Step 3)** | **`mate-assert-playwright`, `mate-pw-codegen` & `mate-assert-api`** | Automates the cases classified as **`[AUTOMATE_UI]`** and **`[AUTOMATE_API]`** (Happy + Border + Negative). Enforces the **Anti-Greenwashing Rule**: if an automatable test case fails because the app has a bug, the test is still created and marked with `test.fail()`. |
| **Downstream (Step 4)** | **`mate-explore`** | Takes the tailored **Exploratory Testing Recommendations** from `TC-[module].md` and executes or schedules time-boxed SBTM charters (`npx mate-sdt charter <module>`). |

---

## 🔌 1. Source-Agnostic Requirement Ingestion Protocol

Never assume a single tool. Detect how the tester provided the User Story or existing manual test suite and use the matching ingestion path (see [`references/mcp-and-file-ingestion.md`](./references/mcp-and-file-ingestion.md) and [`references/legacy-manual-migration.md`](./references/legacy-manual-migration.md)):

1. **Atlassian MCP (Jira / Confluence / Xray / Zephyr):** Fetch issue summary, description, acceptance criteria, and linked pages via MCP.
2. **Notion / Linear / GitHub Issues / Azure DevOps MCP:** Query the page, database item, or issue directly via the corresponding MCP tool.
3. **Local Files (Excel `.xlsx`, `.csv`, `.md`, `.json`, `.txt`):** Read the file directly from the workspace.
4. **No MCP / Missing Context Fallback (Handling Uncertainty Protocol):** Ask the tester to paste the User Story or point to an exported file, and flag any ambiguous business rule as `[TBD: clarify with Product/Dev]`.

---

## 🧠 2. Mandatory 4-Quadrant Test Case Design Rules

For **every** User Story or feature, design test cases across all 4 quadrants—never stop at the Happy Path:

| Quadrant | Category Tag | Technique Applied | Minimum Coverage Requirement |
| :--- | :--- | :--- | :--- |
| **Q1: Happy Path** | `HAPPY_PATH` | Acceptance Criteria Walkthrough | Every explicit Acceptance Criterion (AC) in the User Story works end-to-end with valid inputs. |
| **Q2: Border & Boundary** | `BORDER_CASE` | Boundary Value Analysis (BVA) & Equivalence Partitioning | Min, Min-1, Max, Max+1 lengths/amounts, empty strings, whitespace-only, special characters/Unicode, timezone/midnight boundaries, zero/negative numbers. |
| **Q3: Negative & Error** | `NEGATIVE_PATH` | Invalid Input & Fault Handling | Missing required fields, invalid formats, unauthorized role access (`401`/`403`), duplicate submission, backend `4xx`/`5xx` graceful UI error messages. |
| **Q4: State & Concurrency** | `STATE_TRANSITION` | Finite State Machine & Forbidden Transitions | Refreshing mid-transaction, browser Back button after submit, double-clicking submit, modifying cart/data in a second tab (`mate-pw-forensics`). |

---

## ⚖️ 3. The Pragmatic Execution Mode Decision Engine (What to Automate vs. Manual vs. Exploratory)

**Not everything should be automated.** For every test case you design, assign one of these 4 Execution Modes and explain **WHY** in the `Rationale` column:

| Execution Mode | When to Choose It | Example Rationale |
| :--- | :--- | :--- |
| **`AUTOMATE_UI`** | High-ROI, repeatable end-to-end user journeys, critical visual state transitions, P0/P1 smoke flows, and accessible error banners (`role="alert"`). | *"Core revenue flow executed on every deploy; high regression risk in DOM state transitions."* |
| **`AUTOMATE_API`** | Field validation matrices, boundary value permutations (`0`, `-1`, `MAX+1`), role authorization (`401/403`), and schema checks. | *"20x faster and more deterministic via API contract test (`tests/api/`) than repeating UI form fills."* |
| **`MANUAL_TEST`** | Scenarios with negative automation ROI, physical hardware/device dependencies, external inbox/SMS/2FA verification, PDF/print aesthetics, or volatile experimental UI. | *"Requires visual inspection of formatted PDF invoice layout and email rendering across clients; low ROI to automate in DOM."* |
| **`EXPLORATORY_CHARTER`** | Open-ended lateral thinking, UX friction, emotional trust, screen-reader/keyboard flow, and complex multi-factor interruptions. | *"Requires human judgment to evaluate UX clarity and recovery when network drops mid-payment."* |

---

## 📊 4. Dual QA Companion Artifacts (`tests/cases/TC-[module].md` + `.csv`)

Whenever you analyze a User Story, generate **both** files in `tests/cases/` (or run `npx mate-sdt cases <module>`):

1. **`tests/cases/TC-[module].md`** (Template: [`resources/test-cases.template.md`](./resources/test-cases.template.md)) — A comprehensive **QA Companion Document** containing:
   - **Section 1:** Acceptance Criteria Traceability.
   - **Section 2:** Complete 4-Quadrant Test Case Matrix with **`Execution Mode` (`AUTOMATE_UI` / `AUTOMATE_API` / `MANUAL_TEST`)** and **`Engineering Rationale (Why Automate vs. Why Manual)`**.
   - **Section 3:** **Step-by-Step Manual Test Execution Guide** (dedicated playbook for the cases marked `MANUAL_TEST` so the human tester can execute them cleanly).
   - **Section 4:** **Tailored Exploratory Testing Recommendations & Border-Case Heuristics** (explaining *what* to explore, *why* automation cannot replace it, and concrete edge-case prompts based on the User Story).
   - **Section 5:** **Discovered Bugs & Anti-Greenwashing Log** (tracking any automated or manual test that failed due to a real application defect).
2. **`tests/cases/TC-[module].csv`** (Template: [`resources/test-cases.template.csv`](./resources/test-cases.template.csv)) — Ready for one-click import into **Excel, Google Sheets, Jira (Xray / Zephyr), TestRail, or Notion**.
