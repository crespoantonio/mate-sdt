# 🚀 Getting Started with M.A.T.E. Method (`mate-sdt`)

This guide walks you through installing and operating the **M.A.T.E. Method — Spec-Driven Testing (SDT) Framework** in both **Greenfield** (new) and **Brownfield** (existing/legacy) projects.

---

## 1. Prerequisites

*   **Node.js:** `>= 18.0.0` (for running `npx mate-sdt` and Playwright).
*   **Podman (Recommended for Pillar T):** Rootless [Podman](https://podman.io/) for isolated execution of Stryker Mutation Testing (`npx mate-sdt mutate`).
*   **AI Coding Agent / IDE:** Works natively with Google Antigravity (`agy`), Claude Code, Cursor, Windsurf, and GitHub Copilot.

---

## 2. Installing M.A.T.E. in Your Repository

Navigate to your project's root folder and run:

```bash
npx mate-sdt install
```

### Interactive Wizard Steps
1.  **Select Project Lifecycle Mode:**
    *   `Greenfield`: Creates the full SDT directory structure (`specs/`, `tests/`, `src/pages/`, `src/components/`, `src/fixtures/`), `MATE-PROJECT-MAP.md`, and `stryker.config.json`.
    *   `Brownfield`: Installs the Living Map, spec governance, and AI agent skills for reverse-engineering existing code.
    *   `AI Skills & IDE Rules Only`: Installs the agent skills and `specs/` directory without scaffolding `src/` or `tests/` folders.
2.  **Select Target AI Agents / IDEs:**
    *   Choose one or multiple IDEs (e.g., `1,2,3` for Antigravity, Claude Code, and Cursor, or `all`).
3.  **Starter Templates:**
    *   Optionally copies the Golden Sample Spec (`specs/sample-order-lifecycle.mate-spec.md`) and SOLID Playwright templates (`BasePage`, `NotificationToastComponent`, `MateFixtures`).

---

## 3. Executing the 4 Pillars Step-by-Step

### Step 1: Pillar M — Model Intent & State Machines (`mate-model`)
Before writing application code or tests, create a new spec from `specs/TEMPLATE_MATE_SPEC.md` (or ask your AI agent using the `mate-model` skill):

> **Prompt Example:**  
> *"Use `mate-model` to create `specs/checkout-payment.mate-spec.md` for our Stripe checkout workflow. Include the Finite State Machine, Explicit Forbidden Transitions, mathematical invariants, race condition threats, and accessibility charters."*

Validate your specification with the CLI linter:

```bash
npx mate-sdt validate specs/checkout-payment.mate-spec.md
```

### Step 2: Pillar A — Assert with SOLID Playwright (`mate-assert-playwright`)
Once the spec passes validation and is marked `APPROVED`, instruct your agent to build the Page Objects, Component Objects, Dependency Inversion fixtures, and test suite:

> **Prompt Example:**  
> *"Using `mate-assert-playwright`, implement the Page Objects in `src/pages/`, fixtures in `src/fixtures/`, and invariant tests in `tests/e2e/` for `specs/checkout-payment.mate-spec.md`. Remember: zero `waitForTimeout` sleeps."*

### Step 3: Pillar T — Threat & Mutation Governance (`mate-threat`)
Write adversarial tests in `tests/threats/` (double-click race conditions, duplicate webhook delivery, payload fuzzing) and verify that your test suite genuinely catches logic mutations:

```bash
npx mate-sdt mutate
```

If the Stryker Mutation Score drops below **85%**, ask `mate-threat` to analyze surviving mutants and strengthen your assertions.

### Step 4: Pillar E — Human Exploration & Release Verdict (`mate-explore`)
Before shipping to production, generate a time-boxed Session-Based Test Management (SBTM) charter for human exploratory testing:

```bash
npx mate-sdt charter checkout-payment
```

Complete the 30–45 minute session in `tests/charters/CHR-YYYYMMDD-checkout-payment.md`.
*   If everything passes cleanly, mark the release verdict as **`[PASS]`**.
*   If a minor non-blocking issue is accepted for this sprint, generate a formal waiver:
    ```bash
    npx mate-sdt waiver checkout-payment
    ```
    Have both the Quality Lead and Tech Lead sign `specs/waivers/WVR-YYYY-checkout-payment.md`.
