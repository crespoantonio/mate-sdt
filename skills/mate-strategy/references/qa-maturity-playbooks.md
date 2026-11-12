# 🧭 Playbooks for the 6 Real-World QA Team Scenarios

How to apply M.A.T.E. depending on what the QA team currently has (or doesn't have) and where M.A.T.E. is installed.

---

## Playbook 1: "We Have Nothing & The App Is Already Live in Production" (Standalone QA Folder)

**Context:** QA works in a dedicated folder/repository outside the frontend and backend repos. The app is already used by real customers, but there is no Test Strategy, no Test Plan, no documented test cases, and no automation.

### Execution Protocol (`/mate-flow-zero-to-one`):
1. **Bootstrap the Standalone Harness:**
   - Run `npx mate-sdt install --with-playwright-cli`.
   - Configure `.env` (copied from `.env.example`) with `BASE_URL` and test credentials.
2. **Global Live Reconnaissance (`mate-pw-recon`):**
   - Open the live staging/prod URL (`playwright-cli open <BASE_URL>`).
   - Map the navigation tree, core user journeys, and underlying API calls (`playwright-cli network`).
   - Populate the *System Modules* table in `MATE-PROJECT-MAP.md`.
3. **Establish Strategy & Risk Matrix (`mate-strategy`):**
   - Run `npx mate-sdt strategy` to generate `docs/TEST-STRATEGY.md`.
   - Score every module by `Impact (1–5) × Probability (1–5)` to separate **P0 (Survival/Revenue)** from **P1** and **P2**.
4. **Wave 1 — Build the 72-Hour P0 Smoke Shield (`@smoke @p0`):**
   - Before writing 30 edge cases for a single screen, automate **1 Happy-Path Smoke Test for each of the top 5–8 P0 flows** (`tests/e2e/smoke.spec.ts`).
   - Run `npm run test:smoke` so the team immediately has a 2-minute safety net on every deployment.
5. **Wave 2 — Deepen Module by Module (4 Quadrants):**
   - Take the highest-risk P0 module first.
   - Run `npx mate-sdt plan <module>` and `npx mate-sdt cases <module>`.
   - Design Happy, Border, Negative, and State-Transition cases (`mate-story-testcases`), formalize `specs/<module>.mate-spec.md` (`mate-model`), and automate all cases (`mate-pw-codegen` + `mate-assert-playwright`).
   - Any pre-existing production bug uncovered during this process is **automated with `test.fail()`** and reported via `npx mate-sdt bug <module>`.

---

## Playbook 2: "We Only Have Manual Testing (Excel / Jira / Xray / Notion) & Zero Automation"

**Context:** The QA team has 200–1,000 manual test cases accumulated over time, and manual regression takes days before every release.

### Execution Protocol:
1. **Ingest & Audit Manual Cases (`mate-story-testcases`):**
   - Read the Excel/CSV export or fetch tickets via Atlassian/Notion MCP.
2. **Triage by Pyramid Layer & ROI (Do Not Automate 1:1 Blindly):**
   - Classify each legacy manual test into one of 5 buckets:
     - `BUCKET 1: @smoke @p0 (UI E2E)` — Critical end-to-end business flows (top 10–15%).
     - `BUCKET 2: @api (Shift-Left to API)` — Field validations, permutation matrices, and status checks that are 20x faster and more stable via `tests/api/` than via UI.
     - `BUCKET 3: @e2e @border (UI Edge Cases)` — Specific UI state transitions and border cases.
     - `BUCKET 4: @charter (Keep Manual Exploratory)` — Subjective UX, visual layout, or low-ROI one-off scenarios.
     - `BUCKET 5: DEPRECATED / DUPLICATE` — Merge redundant steps.
3. **Synthesize Specs & Automate Incrementally:**
   - Generate `specs/[module].mate-spec.md` and clean `docs/test-cases/TC-[module].md` / `.csv` from the triaged cases, then automate Bucket 1 (`@smoke`) and Bucket 2 (`@api`) first.

---

## Playbook 3: "We Have Legacy Automation, But It's Flaky, Unmaintainable & Has No Specs"

**Context:** An existing repo has dozens of tests full of `waitForTimeout()`, hardcoded selectors inside `*.spec.ts`, zero Page Objects, and constant false positives in CI.

### Execution Protocol:
1. **Static Health Baseline (`mate-maintenance`):**
   - Run `npx mate-sdt audit` to list all `MATE-ANTI-01..06` violations and establish the baseline Health Score (`A`–`F`).
2. **Reverse-Engineer the Intent (`mate-model`):**
   - Read the existing test files to extract what business rules (`INV-XX`) they were attempting to verify, and lock those rules in `specs/[module].mate-spec.md`.
3. **Strangler-Fig Refactoring (`mate-assert-playwright` + `mate-pw-codegen`):**
   - Extract repeated locators into `src/pages/*.page.ts` (`BasePage`) and `src/components/*.component.ts` (`BaseComponent`).
   - Replace every `waitForTimeout()` with deterministic web-first assertions (`expect(locator).toBeVisible()`).
   - Re-run `npx mate-sdt audit` until the suite reaches `Grade A (90–100)`.

---

## Playbook 4: "We Sit in a Separate QA Repo & Backend Never Gave Us a Swagger/OpenAPI"

**Context:** QA wants to write fast API contract tests (`tests/api/`) and k6 load tests (`tests/nfr/`), but there is no API documentation and no access to backend source code.

### Execution Protocol:
1. **Network Traffic Reverse-Engineering (`mate-pw-recon`):**
   - Open the web app in `playwright-cli` and perform the user journey while monitoring `playwright-cli network` (or intercepting JSON traffic via `run-code`).
2. **Extract Observed Contracts:**
   - Document every observed endpoint (`POST /api/v1/orders`, request headers, auth mechanism, request payload, and response JSON structure) inside `specs/[module].mate-spec.md` marked with `[OBSERVED]`.
3. **Generate Typed API Clients & k6 Suites (`mate-assert-api` + `mate-performance-k6`):**
   - Build `src/api/[module].client.ts` and `tests/api/[module].spec.ts` from the captured traffic, shifting 60% of slow UI permutations down to millisecond API tests.
