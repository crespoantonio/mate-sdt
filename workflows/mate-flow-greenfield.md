---
name: mate-flow-greenfield
description: >-
  End-to-End M.A.T.E. Greenfield Workflow: Orchestrates a new feature from initial idea
  to validated MATE-SPEC.md, SOLID Playwright/API test generation, Podman Mutation Testing (>=85%),
  and Human Exploratory Charter sign-off.
---

# 🌱 E2E Workflow: Greenfield Spec-to-Release (`/mate-flow-greenfield`)

Execute this step-by-step workflow when building or testing a new feature from scratch.

---

## Step 1: Context Check (`mate-core`)
1. Read `MATE-PROJECT-MAP.md` at the root of the repository (or run `npx mate-sdt init` if missing).
2. Apply the **Handling Uncertainty Protocol**: if actors, state transitions, or SLAs are ambiguous, ask the user before proceeding.

## Step 2: Pillar M — Model Intent & Forbidden Transitions (`mate-model`)
1. Create `specs/[module].mate-spec.md` from `specs/TEMPLATE_MATE_SPEC.md`.
2. Define `<intent_model>` with the Finite State Machine (Mermaid `stateDiagram-v2`), legal transitions, **Explicitly Forbidden Transitions**, and strict contracts.
3. Define `<invariants>` (`INV-01`, `INV-02`), `<threat_scenarios>` (`THR-01`, `THR-02`), and `<exploratory_charters>`.
4. Run the CLI validator:
   ```bash
   npx mate-sdt validate specs/[module].mate-spec.md
   ```
5. Once valid and approved by the user, set `status: APPROVED` and register the module in `MATE-PROJECT-MAP.md`.

## Step 3: Pillar A — Assert UI & API Invariants (`mate-assert-playwright` & `mate-assert-api`)
1. Generate or extend SOLID Page Objects (`src/pages/`), Component Objects (`src/components/`), Typed API Clients (`src/api/`), and Dependency Inversion fixtures (`src/fixtures/`).
2. Implement deterministic P0/P1 invariant tests in `tests/e2e/` and `tests/api/`.
3. Run the static health audit to guarantee zero `waitForTimeout` sleeps or DIP violations:
   ```bash
   npx mate-sdt audit
   ```

## Step 4: Pillar T — Adversarial Threats & Podman Mutation (`mate-threat`)
1. Implement concurrency, double-click idempotency, and payload fuzzing suites in `tests/threats/`.
2. Execute Stryker Mutation Testing inside a rootless Podman container:
   ```bash
   npx mate-sdt mutate
   ```
3. Verify that the **Mutation Score is `>= 85%`**. If mutants survive, strengthen test assertions until the threshold passes.

## Step 5: Pillar E — Human Exploration & Release Verdict (`mate-explore`)
1. Generate a time-boxed Session-Based Test Management (SBTM) charter:
   ```bash
   npx mate-sdt charter [module]
   ```
2. After the human Quality Engineer completes exploratory & WCAG 2.1 AA testing, record the formal Release Verdict (`[PASS]`, `[CONCERNS]` with `npx mate-sdt waiver [module]`, or `[FAIL]`) in `MATE-PROJECT-MAP.md`.
