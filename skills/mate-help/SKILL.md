---
name: mate-help
description: >-
  Interactive M.A.T.E. Framework Coach, Onboarding Advisor & Documentation Reference skill.
  USE WHEN: The user asks any question about the M.A.T.E. Method ("How does M.A.T.E. work?", "How do I use M.A.T.E.
  in my situation?", "Which workflow or command should I run?", "Should I automate this or keep it manual?", "How
  do I use M.A.T.E. in a separate QA folder or with Jira/Notion/Excel?"), or wants guidance on implementing
  Spec-Driven Testing (SDT).
  SYNERGY: Acts as the conversational entry point and coach for the entire framework, diagnosing the tester's
  context and recommending the exact skill (`mate-strategy`, `mate-story-testcases`, `mate-pw-recon`, etc.),
  workflow (`/mate-flow-*`), or CLI command (`npx mate-sdt ...`) to execute next.
---

# 💡 Skill: M.A.T.E. Interactive Coach & Advisor (`mate-help`)

Welcome to **`mate-help`** — your interactive companion and architect guide for the **M.A.T.E. Method (Spec-Driven Testing Framework)** created by **Antonio "Tony" Crespo** (*Un Junior En Apuros*).

Whenever a QA Engineer, SDET, Developer, or Tech Lead asks a question about how M.A.T.E. works, how to apply it to their project, or what step to take next, this skill provides clear, actionable, context-aware answers and recommends the exact workflow or command to run.

---

## 🔗 Skill Synergy & Handoff Protocol

| User's Question / Situation | Recommended Workflow | Skills Activated | CLI Command |
| :--- | :--- | :--- | :--- |
| *"We have a live app in prod/staging, zero testing, and QA works in a separate folder."* | **`/mate-flow-zero-to-one`** | `mate-strategy` ➔ `mate-pw-recon` ➔ `mate-pw-codegen` | `npx mate-sdt strategy` & `npx mate-sdt plan initial` |
| *"I have a User Story (in Jira/Atlassian MCP, Notion, Excel, or text) and need to test it."* | **`/mate-flow-user-story`** | `mate-story-testcases` ➔ `mate-model` ➔ `mate-pw-recon` ➔ `mate-pw-codegen` + `mate-assert-playwright` | `npx mate-sdt cases <module>` |
| *"We are building a brand-new feature or greenfield app from scratch."* | **`/mate-flow-greenfield`** | `mate-model` ➔ `mate-assert-playwright` / `mate-assert-api` ➔ `mate-threat` ➔ `mate-explore` | `npx mate-sdt validate` |
| *"We have legacy code or an undocumented live URL and need to reverse-engineer specs."* | **`/mate-flow-brownfield`** | `mate-pw-recon` + `mate-model` | `npx mate-sdt validate` |
| *"We want to test APIs (from Swagger/OpenAPI or reverse-engineered from browser traffic)."* | **`/mate-flow-api-contract`** | `mate-pw-recon` ➔ `mate-assert-api` ➔ `mate-threat` | `npm run test:api` |
| *"We need load, stress, or spike performance testing with Grafana k6."* | **`/mate-flow-performance`** | `mate-performance-k6` | `npx mate-sdt k6 tests/nfr/<script>.k6.js` |
| *"Our tests failed in CI or our existing test suite is flaky and full of sleeps."* | **`/mate-flow-triage`** | `mate-triage` + `mate-pw-forensics` + `mate-maintenance` | `npx mate-sdt audit` & `npx mate-sdt bug <mod>` |

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
| `npx mate-sdt install` | Interactive installer (scaffolds folders, 15 skills, 7 workflows, `playwright.config.ts`, `TEST-STRATEGY.md`, and optionally `@playwright/cli`). |
| `npx mate-sdt init [dir]` | Quick-scaffolds M.A.T.E. folders and templates without interactive prompts. |
| `npx mate-sdt setup-playwright` | Installs `@playwright/cli@latest` and `@playwright/test@latest` and updates `.gitignore`. |
| `npx mate-sdt strategy [name]` | Generates the Master Test Strategy & Business Risk Matrix (`docs/TEST-STRATEGY.md`). |
| `npx mate-sdt plan <scope>` | Generates a Release / Sprint Test Plan (`docs/test-plans/TP-YYYYMMDD-<scope>.md`). |
| `npx mate-sdt context [module]` | Audits Context Engineering token budgets, checks for Context Drift, and builds a JIT Context Pack (`.mate/context-pack-<module>.md`). |
| `npx mate-sdt gate [dir]` | Runs the **5-Gate Harness Engineering Closed Verification Loop** with `[SELF-CORRECTION]` prompts. |
| `npx mate-sdt cases <module>` | Generates the QA Companion Test Case Matrix (`tests/cases/TC-<module>.md` & `.csv` with Automated, Manual & Exploratory sections). |
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
