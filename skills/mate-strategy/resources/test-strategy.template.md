# ♟️ Master Test Strategy — [Project / Product Name]

* **Document Status:** `ACTIVE`
* **Last Updated:** `YYYY-MM-DD`
* **QA Repository Topology:** `[Standalone Black-Box QA Repo | Integrated Monorepo (White-Box)]`
* **Target Application URLs:**
  * **Staging / QA:** `[e.g., https://staging.example.com]`
  * **Production (Smoke Read-Only):** `[e.g., https://app.example.com]`
  * **API Base URL:** `[e.g., https://api.staging.example.com]`

---

## 1. Executive Summary & Quality Objectives

This Master Test Strategy governs the end-to-end quality engineering process for **[Project Name]** under the **M.A.T.E. Method (Spec-Driven Testing Framework)**.

* **Primary Objective:** Protect business-critical user journeys and domain invariants while maintaining a fast, deterministic, zero-flakiness automated suite (`Grade A` on `npx mate-sdt audit`).
* **Anti-Greenwashing Policy:** Tests validate **what the specification and User Stories require**, never what buggy implementation code happens to do. Any test that fails due to a real application defect is kept in the suite, annotated with `test.fail(true, 'BUG-XXX')`, and tracked in `tests/bugs/`.

---

## 2. Application Module Inventory & Business Risk Matrix

| Module ID | Business Module / Flow | Impact (1-5) | Probability (1-5) | Risk Score | Priority Tier | Wave 1 Smoke (`@smoke`) | Wave 2 Deep Spec (`*.mate-spec.md`) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **MOD-01** | Authentication & Session Management | 5 | 4 | **20** | **P0 (Critical)** | ✅ Required | `specs/auth.mate-spec.md` |
| **MOD-02** | [Core Transaction / Checkout / Creation] | 5 | 5 | **25** | **P0 (Critical)** | ✅ Required | `specs/checkout.mate-spec.md` |
| **MOD-03** | [User Dashboard / Catalog / Search] | 4 | 3 | **12** | **P1 (High)** | ✅ Required | `specs/catalog.mate-spec.md` |
| **MOD-04** | [Settings / Profile / Secondary Flows] | 2 | 2 | **4** | **P2 (Normal)** | ➖ Optional | `specs/profile.mate-spec.md` |

---

## 3. Two-Wave Implementation Roadmap

### Wave 1: 72-Hour P0 Smoke Shield (`npm run test:smoke`)
1. Discover live DOM and network calls via `@playwright/cli` (`mate-pw-recon`).
2. Scaffold `BasePage`, `BaseComponent`, and `MateFixtures` (`src/pages/`, `src/components/`, `src/fixtures/`).
3. Automate the Golden Path for every **P0** module (`@smoke @p0`).
4. Target execution time: **< 3 minutes** on every deployment.

### Wave 2: Incremental 4-Quadrant M.A.T.E. Deepening
For each module in priority order (`P0` ➔ `P1` ➔ `P2`):
1. **Model (`mate-model`):** Author `specs/[module].mate-spec.md` with explicit Forbidden Transitions.
2. **Test Cases (`mate-story-testcases`):** Generate `tests/cases/TC-[module].md` and `.csv` covering `HAPPY_PATH`, `BORDER_CASE`, `NEGATIVE_PATH`, and `STATE_TRANSITION`.
3. **Assert (`mate-assert-playwright` / `mate-assert-api`):** Automate UI and API suites.
4. **Threat & Performance (`mate-threat` / `mate-performance-k6`):** Add concurrency, fuzzing, and k6 load scripts.
5. **Explore (`mate-explore`):** Execute 30–60 min human SBTM charters (`tests/charters/`).

---

## 4. Test Pyramid & Layer Allocation Strategy

| Layer | Directory | Target Share | What Belongs Here | Execution Trigger |
| :--- | :--- | :---: | :--- | :--- |
| **API & Contract Suite** | `tests/api/` | ~50% | Schema validation, `400/401/403/409/422` matrices, boundary combinations, BOLA checks | Every PR & Nightly |
| **UI End-to-End (E2E)** | `tests/e2e/` | ~30% | P0 Smoke flows (`@smoke`), critical multi-step user journeys, visual/DOM state invariants | Smoke on every deploy; Full E2E on PR/Merge |
| **Adversarial & Chaos** | `tests/threats/` | ~10% | Multi-actor race conditions (`playwright-cli -s=`), double-submit idempotency, payload fuzzing | Nightly & Pre-Release |
| **Performance Oracles (k6)** | `tests/nfr/` | ~5% | Latency SLAs (`p95`, `p99`) and throughput checks via rootless Podman (`npx mate-sdt k6`) | Pre-Release / Staging |
| **Human Exploratory (SBTM)** | `tests/charters/` | ~5% | UX ergonomics, WCAG 2.1 AA accessibility, complex cross-device edge cases | Per Feature / Release Gate |

---

## 5. Test Data, Environments & Authentication Strategy

* **Authentication (`storageState` DIP):** Login UI is tested explicitly in `tests/e2e/auth.spec.ts`. All other domain suites inject pre-authenticated contexts (`playwright/.auth/*.auth-state.json`) via `src/fixtures/mate.fixtures.ts`.
* **Test Data Isolation:** Each test must generate or clean up its own isolated state (unique emails/skus or API fixture seeding) so tests can run in parallel without collisions.
* **Secrets Management:** Credentials and tokens are loaded exclusively from `.env` (never hardcoded; enforced by `MATE-ANTI-06` in `npx mate-sdt audit`).

---

## 6. Release Quality Gates & Verdict Criteria

Every release candidate is evaluated under three formal M.A.T.E. verdicts:
* 🟢 **`[PASS]`**: 100% of `@smoke` and `@p0` invariants pass, zero unwaived `test.fail()` P0/P1 defects, `npx mate-sdt audit` Grade `A`/`B`, and exploratory charters complete.
* 🟡 **`[CONCERNS]`**: Non-critical (`P2`) deviations exist; requires a signed Release Waiver in `specs/waivers/WVR-*.md` (`npx mate-sdt waiver <module>`).
* 🔴 **`[FAIL]`**: Any broken `@p0` invariant, critical security/concurrency flaw, or unwaived `test.fail()` bug on core acceptance criteria.
