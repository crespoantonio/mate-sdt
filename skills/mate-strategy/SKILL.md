---
name: mate-strategy
description: >-
  Master Test Strategy, Test Planning, Business Risk Matrix & QA Maturity Onboarding specialist for the M.A.T.E. Method.
  USE WHEN: A QA team is starting from scratch on an existing live application (Zero-to-One / Standalone Black-Box QA Repo),
  needs to create a Master Test Strategy (`docs/TEST-STRATEGY.md`) or Release/Sprint Test Plan (`docs/test-plans/TP-*.md`),
  needs to prioritize modules via a Business Risk Matrix (`P0`/`P1`/`P2`), design a Smoke-First rollout, or migrate/rebalance
  an existing manual or flaky test suite.
  SYNERGY: Works upstream of all M.A.T.E. skills—pairs with `mate-pw-recon` (to inventory a live app's modules and hidden APIs),
  `mate-core` (to populate `MATE-PROJECT-MAP.md`), and hands off prioritized modules to `mate-story-testcases`, `mate-model`,
  and `mate-assert-playwright`.
---

# ♟️ Skill: Master Test Strategy, Risk Matrix & QA Onboarding (`mate-strategy`)

This skill governs **Phase 0 (Strategic Governance & QA Onboarding)** of the M.A.T.E. Method.

When a QA team lands in a project—especially when working in a **standalone QA folder outside the frontend/backend repositories** on an application that is **already running in production with real users** and has zero existing tests—jumping straight into writing deep edge-case specs for a single screen is a fatal mistake. First, you need **strategic visibility, risk prioritization, and immediate production protection (Smoke P0)**.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Companion (Discovery)** | **`mate-pw-recon` & `mate-core`** | Uses `@playwright/cli` (`open`, `snapshot`, `network`) to crawl the live application, inventory all business modules and hidden API endpoints, and populate `MATE-PROJECT-MAP.md`. |
| **Downstream (Wave 1: Smoke)** | **`mate-assert-playwright` & `mate-pw-codegen`** | Automates the **Wave 1 P0 Smoke Suite (`@smoke @p0`)** covering the 5–10 critical Golden Paths that keep the business alive in production. |
| **Downstream (Wave 2: Depth)** | **`mate-story-testcases` & `mate-model`** | Iterates module by module in priority order (`P0` ➔ `P1` ➔ `P2`) to create formal `specs/*.mate-spec.md` and 4-Quadrant Test Case Matrices (`tests/cases/TC-*.md` & `.csv`). |
| **Downstream (Rescue)** | **`mate-maintenance` & `mate-triage`** | When the team already has legacy flaky tests or manual Excel sheets, coordinates the audit, deduplication, and incremental migration. |

---

## 🧭 1. Assessing the QA Team's Starting Scenario (The 6 Maturity Playbooks)

Before writing a Test Strategy, identify which of the **6 real-world scenarios** the QA team is in (see full playbooks in [`references/qa-maturity-playbooks.md`](./references/qa-maturity-playbooks.md)):

| Scenario | Current State of the QA Team | Immediate M.A.T.E. Action Plan |
| :--- | :--- | :--- |
| **1. Zero-to-One in Production (Standalone QA Repo)** | App is live with real users; QA works in a separate folder with **zero** Test Strategy, Test Plan, manual cases, or automation. | Run `/mate-flow-zero-to-one`: Recon live URL ➔ Create `TEST-STRATEGY.md` & Risk Matrix ➔ Automate **Wave 1 P0 Smoke Suite** ➔ Deepen module by module in **Wave 2**. |
| **2. Manual-Only QA (Excel / Jira / Xray / Notion)** | Has hundreds of manual test cases, 5-day manual regressions, and **0%** automation. | Audit & deduplicate manual suite (`mate-story-testcases`), classify by ROI (`@smoke`, `@api`, `@e2e`, `@charter`), synthesize `*.mate-spec.md`, and automate P0 first. |
| **3. Flaky / Broken Automation Rescue** | Has legacy Playwright/Cypress/Selenium tests full of `waitForTimeout`, no POM/SOLID, and no Test Plan. | Run `npx mate-sdt audit`, quarantine flaky specs, extract invariants into `*.mate-spec.md`, and refactor incrementally into `BasePage` / `BaseComponent`. |
| **4. Unbalanced Test Pyramid (UI-Only or No Swagger)** | Everything is tested via slow UI E2E tests; Backend never provided an OpenAPI/Swagger file. | Use `mate-pw-recon` (`playwright-cli network`) to reverse-engineer backend API endpoints from browser traffic and shift validation tests down to `tests/api/`. |
| **5. Greenfield Co-Creation** | Building a new product or feature from scratch alongside Developers and Product. | Run `/mate-flow-greenfield` or `/mate-flow-user-story`: Spec & 4-Quadrant Cases *before* code is merged. |
| **6. Local-Only Tests (No CI/CD or Visibility)** | Tests only run on a QA engineer's laptop; no release gates or stakeholder reports. | Scaffold `.github/workflows/mate-qa.yml`, separate `@smoke` (every deploy/cron) from `@regression`, and enforce formal Release Verdicts (`mate-explore`). |

---

## 🌊 2. The "2-Wave Rollout Strategy" for Live Applications Without Tests

When an application is already serving real users and has zero test coverage, **never try to boil the ocean in Sprint 1**. Enforce the **2-Wave Strategy**:

### Wave 1: The 72-Hour P0 Smoke Survival Shield (`@smoke @p0`)
- **Goal:** Protect revenue and core user journeys *this week* across the entire app before going deep into any single module.
- **Scope:** Identify the 5 to 10 vital business flows (e.g., *Login/Auth, Core Search/Catalog, Cart/Creation, Checkout/Payment, Critical Admin Action*).
- **Execution:**
  1. Explore each flow via `playwright-cli` (`mate-pw-recon`).
  2. Build the core `BasePage` and `BaseComponent` classes (`mate-pw-codegen`).
  3. Write 1 deterministic `@smoke @p0` E2E test + 1 health/contract API test per critical flow.
  4. Wire `npm run test:smoke` so the team has a 2-minute safety net immediately.

### Wave 2: Module-by-Module M.A.T.E. Deepening (4 Quadrants + Pillar T & E)
- Once Wave 1 is green, pick modules in strict **Risk Matrix order (`P0` ➔ `P1` ➔ `P2`)**:
  1. Author `specs/[module].mate-spec.md` (`mate-model`).
  2. Generate the 4-Quadrant Test Case Matrix `docs/test-cases/TC-[module].md` & `.csv` (`mate-story-testcases`: Happy + Border + Negative + Forbidden Transitions).
  3. Automate all cases enforcing the **Anti-Greenwashing Mandate** (keep failing tests marked with `test.fail()` + `npx mate-sdt bug`).
  4. Add Concurrency/Fuzzing (`mate-threat`), k6 SLAs (`mate-performance-k6`), and Exploratory Charters (`mate-explore`).

---

## 🧮 3. Business Risk Matrix Prioritization Formula

Rank every discovered module in `docs/TEST-STRATEGY.md` and `MATE-PROJECT-MAP.md` using deterministic criteria:

$$\text{Risk Score} = \text{Business Impact } (1\text{–}5) \times \text{Failure Probability / Complexity } (1\text{–}5)$$

- **P0 (`Score 15–25` — Critical / Blocker):** Auth, Payments, Billing, Core Core Transaction, Multi-Tenant Data Isolation. *(Must be in Wave 1 Smoke + first in Wave 2 Deepening).*
- **P1 (`Score 8–14` — High):** Profile management, Notifications, Reporting, Secondary workflows, Search filters.
- **P2 (`Score 1–7` — Medium/Low):** Static pages, cosmetic preferences, low-traffic admin utilities.

---

## ⚡ CLI Commands & Templates

- **Generate Master Test Strategy (`docs/TEST-STRATEGY.md`):** `npx mate-sdt strategy`
- **Generate Release / Sprint Test Plan (`docs/test-plans/TP-<scope>.md`):** `npx mate-sdt plan <scope>`
- **References & Templates:**
  - [`resources/test-strategy.template.md`](./resources/test-strategy.template.md)
  - [`resources/test-plan.template.md`](./resources/test-plan.template.md)
  - [`references/qa-maturity-playbooks.md`](./references/qa-maturity-playbooks.md)
