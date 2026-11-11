---
description: Zero-to-One QA Onboarding Workflow — For QA teams starting with ZERO testing (often in a standalone QA repo) on an application that is already live in production/staging with real users.
---

# 🚀 Workflow: `/mate-flow-zero-to-one` (Zero Testing to Production Protection)

Use this workflow when a QA team lands in a project that has **no Test Strategy, no Test Plan, no documented test cases, and no automation**, while the application is **already running in production/staging with real users** (including when M.A.T.E. is installed in a standalone QA folder outside the frontend/backend repositories).

```mermaid
flowchart LR
    P1["Phase 1: Standalone Harness & Global Live Recon<br/>(mate-pw-recon + mate-core)"] --> P2["Phase 2: Master Strategy & P0/P1/P2 Risk Matrix<br/>(mate-strategy)"]
    P2 --> P3["Phase 3: Wave 1 — 72h P0 Smoke Survival Shield<br/>(mate-pw-codegen + mate-assert-playwright)"]
    P3 --> P4["Phase 4: Wave 2 — Module-by-Module 4-Quadrant Depth<br/>(mate-story-testcases + mate-model + mate-triage)"]
```

---

## Phase 1: Bootstrap Standalone QA Harness & Global Live Recon (`mate-core` + `mate-pw-recon`)
1. Ensure the project has the M.A.T.E. standalone execution harness (`playwright.config.ts`, `tsconfig.json`, `.env.example`, and `package.json` scripts). Copy `.env.example` to `.env` and set `BASE_URL` to the live staging/production URL.
2. Open the live application via `playwright-cli open <BASE_URL>` (`mate-pw-recon`).
3. Crawl the primary navigation, user roles, forms, and workflows using `playwright-cli snapshot`.
4. Inspect `playwright-cli network` during navigation to discover the underlying backend API endpoints (`REST`/`GraphQL`), auth headers, and status codes—even if Backend has no Swagger/OpenAPI docs (`references/network-api-discovery.md`).
5. Populate the **System Modules** and **Architecture Stack** tables inside `MATE-PROJECT-MAP.md`.

---

## Phase 2: Master Test Strategy & Business Risk Matrix (`mate-strategy`)
1. Generate the Master Test Strategy (`npx mate-sdt strategy` ➔ `docs/TEST-STRATEGY.md`) and the initial Test Plan (`npx mate-sdt plan initial-onboarding` ➔ `docs/test-plans/TP-initial-onboarding.md`).
2. Score every discovered business module using the **M.A.T.E. Risk Formula**:
   $$\text{Risk Score} = \text{Business Impact } (1\text{–}5) \times \text{Failure Probability } (1\text{–}5)$$
3. Classify modules into:
   - **P0 (Score 15–25 — Survival/Revenue Critical):** Must be covered immediately in **Wave 1 (Smoke Shield)**.
   - **P1 (Score 8–14 — High Importance):** Scheduled for **Wave 2** sprint-by-sprint deepening.
   - **P2 (Score 1–7 — Secondary/Cosmetic):** Covered after P0/P1 stabilization.

---

## Phase 3: Wave 1 — Build the 72-Hour P0 Smoke Survival Shield (`mate-pw-codegen` + `mate-assert-playwright`)
> **Why Wave 1 First?** Never spend 3 weeks writing 40 edge cases for Module #1 while Modules #2–#6 in production have zero tests. Build the horizontal P0 Smoke Shield first!

1. Select the top **5 to 8 P0 Golden Paths** across the application (e.g., Login, Core Search/Catalog, Creation/Cart, Checkout/Payment, Critical API Health).
2. Walk through each P0 Golden Path in `playwright-cli` (`mate-pw-recon`), extracting semantic locators (`getByRole`, `getByLabel`, `getByTestId`).
3. Encapsulate shared widgets in `src/components/*.component.ts` (`BaseComponent`), pages in `src/pages/*.page.ts` (`BasePage`), and register them in `src/fixtures/mate.fixtures.ts` and `MATE-PROJECT-MAP.md`.
4. Automate the `@smoke @p0` suite (`tests/e2e/smoke.spec.ts` and `tests/api/health.spec.ts`).
5. Run `npm run test:smoke` and `npx mate-sdt audit` (`Grade A` verification). The team now has an automated 2-minute production safety net!

---

## Phase 4: Wave 2 — Iterative 4-Quadrant Deepening & Anti-Greenwashing (`mate-story-testcases` + `mate-model` + `mate-triage`)
Once Wave 1 (`npm run test:smoke`) is active, iterate through each module in priority order (`P0` ➔ `P1` ➔ `P2`) using `/mate-flow-user-story`:
1. **Model (`mate-model`):** Author `specs/[module].mate-spec.md` with Finite State Machines, **Explicit Forbidden Transitions**, and `<invariants>`. Validate with `npx mate-sdt validate`.
2. **4-Quadrant Test Cases (`mate-story-testcases`):** Run `npx mate-sdt cases <module>` to generate `tests/cases/TC-[module].md` and `.csv` covering `HAPPY_PATH`, `BORDER_CASE`, `NEGATIVE_PATH`, and `STATE_TRANSITION`.
3. **Verify & Automate (`mate-pw-recon` + `mate-pw-codegen` + `mate-assert-api`):**
   - Validate border and negative cases live in `playwright-cli`.
   - Automate UI E2E tests (`tests/e2e/[module].spec.ts`) and API Contract tests (`tests/api/[module].spec.ts`).
   - **Anti-Greenwashing Enforcement:** Any pre-existing bug discovered in the live app is **automated with its real expected assertion**, marked with `test.fail(true, 'BUG-XXX: ...')`, and documented via `npx mate-sdt bug <module>`.
4. **Black-Box Pillar T & E (`mate-threat` + `mate-performance-k6` + `mate-explore`):**
   - Execute multi-actor concurrency checks (`playwright-cli -s=actor1`, `-s=actor2`), k6 SLA scripts (`npx mate-sdt k6`), and 30-min human exploratory charters (`npx mate-sdt charter <module>`).
