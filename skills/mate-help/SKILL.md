---
name: mate-help
description: >-
  Interactive M.A.T.E. Framework Coach, Onboarding Advisor & Documentation Reference skill.
  USE WHEN: The user asks any question about the M.A.T.E. Method ("How does M.A.T.E. work?", "How do I use M.A.T.E.
  in my situation?", "Which workflow or command should I run?", "Should I automate this or keep it manual?", "How
  do I use M.A.T.E. in a separate QA folder or with Jira/Notion/Excel?"), or wants guidance on implementing
  Spec-Driven Testing (SDT).
  SYNERGY: Acts as the conversational documentation advisor for the entire framework (working in synergy with `mate-party` for ambiguous entry points), diagnosing the tester's
  context and recommending the exact skill (`mate-strategy`, `mate-story-testcases`, `mate-pw-recon`, etc.),
  workflow (`/mate-flow-*`), or CLI command (`npx mate-sdt ...`) to execute next.
---

# 💡 Skill: M.A.T.E. Interactive Coach & Advisor (`mate-help`)

Welcome to **`mate-help`** — your interactive companion and architect guide for the **M.A.T.E. Method (Spec-Driven Testing Framework)** created by **Antonio "Tony" Crespo** (*Un Junior En Apuros*).

Whenever a QA Engineer, SDET, Developer, or Tech Lead asks a question about how M.A.T.E. works, how to apply it to their project, or what step to take next, this skill provides clear, actionable, context-aware answers and recommends the exact workflow or command to run.

---

## 🔗 1. Interactive Diagnostic Protocol (Any System × Any Documentation Level)

Whenever a tester asks *"How do I use M.A.T.E. in my project?"* or *"Where do I start?"*, first identify (or ask if not stated):
1. **What System Are You Testing?** (`Web/UI App`, `Backend API/Microservice`, `AI Agent / Chatbot / RAG`, or `Polyglot Java/Python Stack`)
2. **What Documentation & Testing Do You Currently Have?** (`Level 0: Nothing — only a live app/bot`, `Level 1: User Stories in Jira/Notion/Excel`, `Level 2: Manual test cases only`, `Level 3: Swagger/Docs only`, or `Level 4: Flaky existing tests`)

Then prescribe the exact workflow, skills, and CLI commands from this **Universal Scenario Matrix**:

| System Under Test | Documentation & QA Maturity Level | Recommended M.A.T.E. Workflow | Skills Activated in Sequence | Exact CLI Commands to Run |
| :--- | :--- | :--- | :--- | :--- |
| **Web / Full-Stack App** | **Level 0: Zero Docs & Zero Tests** (Live app in Prod/Staging, often in a separate QA folder) | **`/mate-flow-zero-to-one`** | `mate-pw-recon` (Live DOM & Network API discovery) ➔ `mate-strategy` (Risk Matrix + Wave 1 Smoke Shield) ➔ `mate-pw-codegen` | `npx mate-sdt install --with-playwright-cli`<br>`npx mate-sdt strategy`<br>`npx mate-sdt plan wave1-smoke` |
| **Web / API Feature** | **Level 1: User Story / Ticket Only** (Atlassian/Jira MCP, Notion MCP, Linear, Excel/CSV, or pasted text) | **`/mate-flow-user-story`** | `mate-story-testcases` (4-Quadrant Matrix + Automate vs. Manual vs. Exploratory split) ➔ `mate-model` ➔ `mate-pw-recon` ➔ `mate-pw-codegen` + `mate-assert-playwright` | `npx mate-sdt context <mod>`<br>`npx mate-sdt cases <mod>`<br>`npx mate-sdt gate` |
| **Web / Enterprise App** | **Level 2: Legacy Manual Suite Only** (100+ manual tests in Excel/Xray/TestRail, 0% automation) | **`/mate-flow-zero-to-one`** *(Manual Migration Playbook)* | `mate-strategy` + `mate-story-testcases` (`legacy-manual-migration.md`: P0/P1 pareto filtering & deduplication) ➔ `mate-pw-codegen` | `npx mate-sdt strategy`<br>`npx mate-sdt cases <mod>` |
| **Backend REST / GraphQL API** | **Level 0: Undocumented API** (No Swagger/OpenAPI; only a live frontend or Postman requests) | **`/mate-flow-api-contract`** *(Network Discovery Mode)* | `mate-pw-recon` (`network-api-discovery.md`: capture live XHR/Fetch traffic) ➔ `mate-model` (`[OBSERVED]` contracts) ➔ `mate-assert-api` + `mate-threat` | `npx mate-sdt validate`<br>`npm run test:api`<br>`npx mate-sdt gate` |
| **Backend REST / GraphQL API** | **Level 3: Swagger / OpenAPI Exists** (Contract exists, but zero contract/BOLA/fuzzing tests) | **`/mate-flow-api-contract`** | `mate-model` ➔ `mate-assert-api` (`BaseApiClient` + `2xx/400/401/403/409/422` matrix) ➔ `mate-threat` | `npx mate-sdt cases <api-mod>`<br>`npm run test:api` |
| **AI Agent (MCP/Tools), Chatbot, or RAG** | **Level 0: Zero Golden Dataset & Zero Evals** (Only a prompt, bot URL, or PDF docs exist) | **`/mate-flow-ai-agent`** | `mate-ai-dataset` (**5-Dimension Socratic Interview** + **5-Seed Human Gate** + Synthetic Evolutions) ➔ `mate-ai-evals` (Promptfoo + DeepEval) ➔ `mate-ai-redteam` ➔ `mate-ai-observability` (OTel/Langfuse/Phoenix traces) | `npx mate-sdt setup-ai`<br>`npx mate-sdt dataset <agent>`<br>`npm run eval:promptfoo`<br>`npm run eval:redteam`<br>`npm run eval:traces` |
| **AI Agent / RAG System** | **Level 3: Docs / Existing Dataset & Production Traces** (Langfuse / Arize Phoenix / OpenTelemetry) | **`/mate-flow-ai-agent`** | `mate-ai-observability` (Trace forensics & fault isolation: `[RETRIEVER_DEFECT]` vs `[GENERATOR_DEFECT]`) ➔ `mate-ai-evals` ➔ `mate-ai-redteam` | `npm run eval:traces`<br>`npm run eval:deepeval`<br>`npx mate-sdt bug <agent>` |
| **Greenfield Feature (Any Stack)** | **Level 5: Spec-First Idea** (Building a brand-new module before code exists) | **`/mate-flow-greenfield`** | `mate-model` (`*.mate-spec.md` + Forbidden Transitions) ➔ `mate-assert-playwright` / `mate-assert-api` ➔ `mate-threat` (`>=85%` Podman mutation) ➔ `mate-explore` | `npx mate-sdt validate`<br>`npx mate-sdt mutate`<br>`npx mate-sdt charter <mod>` |
| **Legacy / Brownfield Repo** | **Level 4: Existing Flaky Suite** (Tests full of `waitForTimeout`, `.only`, or raw locators) | **`/mate-flow-triage`** & **`/mate-flow-brownfield`** | `mate-maintenance` (`npx mate-sdt audit`) + `mate-triage` + `mate-pw-forensics` ➔ Refactor to `BasePage` / `BaseComponent` | `npx mate-sdt audit`<br>`npx mate-sdt gate` |
| **High-Traffic API / Checkout** | **Non-Functional SLA Verification** (Need Load, Stress, Spike, or Soak testing) | **`/mate-flow-performance`** | `mate-performance-k6` (Podman k6 execution enforcing `<performance_oracles>`) | `npx mate-sdt k6 tests/nfr/<script>.k6.js` |

---

## 🧭 1. Core Philosophy: M.A.T.E. Is Your QA Companion (Not Blind Automation)

When explaining or applying M.A.T.E., always emphasize its **5 Foundational Principles**:

1. **The 4 Pillars (`M.A.T.E.`):**
   - **M — Model (`mate-model`):** Model intent, Finite State Machines, and **Explicit Forbidden Transitions** in `specs/[module].mate-spec.md`.
   - **A — Assert (`mate-assert-playwright` & `mate-assert-api`):** OOP & SOLID test architecture (`BasePage`, `BaseComponent`, `BaseApiClient`, `test.extend` DIP fixtures, **zero `waitForTimeout`**).
   - **T — Threat & Trash (`mate-threat` & `mate-performance-k6`):** Multi-actor concurrency, idempotency, payload fuzzing, k6 SLAs, and Stryker Mutation (`>= 85%`) in rootless Podman.
   - **E — Explore (`mate-explore`):** Human Session-Based Test Management (SBTM) charters, WCAG 2.1 AA accessibility, and formal Release Verdicts (`PASS`, `CONCERNS` + Waiver, `FAIL`).
2. **Pragmatic Automation vs. Manual vs. Exploratory (`mate-story-testcases`):**
   - **Not everything should be automated!** When given a User Story, M.A.T.E. classifies every scenario into:
     - `[AUTOMATE_UI]` — High-ROI end-to-end user journeys & visual state checks.
     - `[AUTOMATE_API]` — Fast contract, boundary, and status-code permutations.
     - `[MANUAL_TEST]` — Low-ROI automation, physical/external 2FA/SMS/email rendering, visual print/PDF checks, or volatile UI, with step-by-step manual instructions and rationale.
     - `[EXPLORATORY_CHARTER]` — Context-aware exploratory testing missions with border-case heuristics tailored to the feature.
3. **The Anti-Greenwashing Mandate:**
   - M.A.T.E. never writes only the tests that pass. It automates all automatable Happy, Border, Negative, and State-Transition cases.
   - If a test that *should* pass per the User Story **fails** against the live app, M.A.T.E. **keeps the test** with its true assertion, marks it with `test.fail(true, 'BUG-XXX: ...')`, creates `tests/bugs/BUG-*.md` (`npx mate-sdt bug`), and alerts the tester.
4. **Token-Efficient Living Map (`MATE-PROJECT-MAP.md`):**
   - Every skill reads and updates `MATE-PROJECT-MAP.md` first so AI agents never waste tokens scanning the whole repo or duplicating Page Objects.
5. **Works Anywhere (Monorepo or Standalone Black-Box QA Folder):**
   - Supports both integrated developer repositories and dedicated QA folders outside frontend/backend repos.

---

## 🛠️ 2. Complete CLI Commands Cheat-Sheet (`npx mate-sdt`)

| Command | What It Does |
| :--- | :--- |
| `npx mate-sdt install` | Interactive installer (scaffolds folders, 16 skills, 7 workflows, `playwright.config.ts`, `TEST-STRATEGY.md`, and optionally `@playwright/cli`). |
| `npx mate-sdt init [dir]` | Quick-scaffolds M.A.T.E. folders and templates without interactive prompts. |
| `npx mate-sdt setup-playwright` | Installs `@playwright/cli@latest` and `@playwright/test@latest` and updates `.gitignore`. |
| `npx mate-sdt setup-ai` | Installs the on-demand **AI Agent, Chatbot & RAG Quality Pack** (4 AI Skills, `/mate-flow-ai-agent`, Promptfoo, DeepEval & OTel Trace Auditor). |
| `npx mate-sdt dataset <module>` | Generates the 5-Dimension Socratic AI Dataset Discovery Sheet (`DS-<module>-discovery.md`) and Golden Dataset (`DS-<module>.json`). |
| `npx mate-sdt strategy [name]` | Generates the Master Test Strategy & Business Risk Matrix (`docs/TEST-STRATEGY.md`). |
| `npx mate-sdt plan <scope>` | Generates a Release / Sprint Test Plan (`docs/test-plans/TP-YYYYMMDD-<scope>.md`). |
| `npx mate-sdt context [module]` | Audits Context Engineering token budgets, checks for Context Drift, and builds a JIT Context Pack (`.mate/context-pack-<module>.md`). |
| `npx mate-sdt gate [dir]` | Runs the **5-Gate Harness Engineering Closed Verification Loop** with `[SELF-CORRECTION]` prompts. |
| `npx mate-sdt cases <module>` | Generates the QA Companion Test Case Matrix (`docs/test-cases/TC-<module>.md` & `.csv` with Automated, Manual & Exploratory sections). |
| `npx mate-sdt validate [path]` | Validates `*.mate-spec.md` files (enforcing YAML frontmatter, 4 XML blocks, Forbidden Transitions, and `INV-XX` IDs). |
| `npx mate-sdt audit [dir]` | Scans test code for anti-patterns (`waitForTimeout`, `.only`, DIP violations) and computes Health Score (`A`–`F`). |
| `npx mate-sdt mutate [dir]` | Runs Stryker Mutator (`>= 85%`) inside a rootless Podman container. |
| `npx mate-sdt k6 [script]` | Runs Grafana k6 performance suite inside a rootless Podman container. |
| `npx mate-sdt charter <module>` | Generates a human Exploratory Testing Charter (SBTM) in `tests/charters/`. |
| `npx mate-sdt bug <module>` | Generates a Spec-Linked Bug Report in `tests/bugs/`. |
| `npx mate-sdt waiver <module>` | Generates a Formal Release Waiver in `specs/waivers/` when a release verdict is `[CONCERNS]`. |
| `npx mate-sdt status [dir]` | Prints a complete health and compliance dashboard of the repository. |

---

## 📚 Deep-Dive FAQ & Scenario Troubleshooting

For detailed answers to common implementation questions, consult:
* **[Framework FAQ & Real-World Implementation Scenarios](./references/framework-faq-and-scenarios.md)**
