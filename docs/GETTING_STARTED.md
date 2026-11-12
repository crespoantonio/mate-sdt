# 🚀 Getting Started with M.A.T.E. Method (`mate-sdt`)

This guide walks you through installing and operating the **M.A.T.E. Method — Spec-Driven Testing (SDT) Framework & QA Companion** across **Standalone Black-Box QA Repositories**, **Greenfield** projects, and **Brownfield** legacy applications.

---

## 1. Prerequisites

*   **Node.js:** `>= 18.0.0` (for running `npx mate-sdt`, `@playwright/cli`, and `@playwright/test`).
*   **Podman (Recommended for Pillar T & Performance):** Rootless [Podman](https://podman.io/) for isolated execution of Stryker Mutation Testing (`npx mate-sdt mutate`) and Grafana k6 load tests (`npx mate-sdt k6`).
*   **AI Coding Agent / IDE:** Works natively with Google Antigravity (`agy`), Claude Code, Cursor, Windsurf, and GitHub Copilot.

---

## 2. Installing M.A.T.E. in Your Repository (or Standalone QA Folder)

Navigate to your project's root folder (or create a dedicated QA folder outside your frontend/backend repos) and run:

```bash
npx mate-sdt install
```

### Interactive Wizard Steps
1.  **Select Project Lifecycle Mode:**
    *   `Standalone QA Repository (Separate QA Folder for a Live App)`: Scaffolds the complete SDT layout, `docs/TEST-STRATEGY.md`, `MATE-PROJECT-MAP.md`, `playwright.config.ts`, `tsconfig.json`, `.env.example`, `.github/workflows/mate-qa.yml`, and `package.json` scripts (`test:smoke`, `test:e2e`, `test:api`, `test:threats`).
    *   `Greenfield`: Full SDT architecture, 15 synergistic AI skills, 7 E2E workflows, and SOLID starter templates for new projects.
    *   `Brownfield`: Installs the Living Map, spec governance, and AI agent skills for reverse-engineering existing code.
    *   `AI Skills, Workflows & IDE Rules Only`: Installs the 15 skills, 7 workflows, and `specs/` directory without scaffolding `src/` or `tests/` folders.
2.  **Select Target AI Agents / IDEs:**
    *   Choose one or multiple IDEs (`Antigravity`, `Claude Code`, `Cursor`, `Windsurf`, `GitHub Copilot`).
3.  **Starter Templates & `@playwright/cli` Installation:**
    *   Copies SOLID templates (`BasePage`, `BaseComponent`, `BaseApiClient`, `MateFixtures`, `k6`) and optionally installs `@playwright/cli@latest` and `@playwright/test@latest`.

> **Need Help at Any Time?**  
> Ask your AI agent using the **`/mate-help`** skill (e.g., *"Use `mate-help` to tell me how to start testing our live staging app"*), or run `npx mate-sdt status`.

---

## 3. Choose Your Daily QA Workflow

### Scenario A: Working on a User Story (From Jira/Atlassian MCP, Notion, Excel, or Text)
Use the **`/mate-flow-user-story`** workflow:
1.  **Ingest & Design (`mate-story-testcases`):** Reads the User Story from your MCP (Jira/Notion/Linear) or local file (`.xlsx`/`.csv`/`.md`) and generates `tests/cases/TC-[module].md` and `.csv` (`npx mate-sdt cases <module>`).
2.  **Pragmatic Automation vs. Manual vs. Exploratory Split:**
    *   Classifies every test case (`HAPPY_PATH`, `BORDER_CASE`, `NEGATIVE_PATH`, `STATE_TRANSITION`) into **`AUTOMATE_UI`**, **`AUTOMATE_API`**, **`MANUAL_TEST`**, or **`EXPLORATORY_CHARTER`** with an explicit engineering rationale.
    *   Includes a step-by-step **Manual Test Execution Guide** for cases that should not be automated, plus tailored **Exploratory Testing Recommendations**.
3.  **Live Browser Verification (`mate-pw-recon`):** Opens the live app with `playwright-cli` to verify whether the User Story and border cases actually work and extracts semantic locators.
4.  **SOLID Automation & Anti-Greenwashing (`mate-pw-codegen` + `mate-assert-playwright`):** Automates all `AUTOMATE_UI` and `AUTOMATE_API` cases. If a test fails because the app has a bug, M.A.T.E. **keeps the test**, marks it with `test.fail(true, 'BUG-XXX')`, generates `tests/bugs/BUG-*.md` (`npx mate-sdt bug <module>`), and reports it clearly.

---

### Scenario B: Starting From Zero on a Live Production App (`/mate-flow-zero-to-one`)
When your team has zero Test Strategy, zero Test Plan, and zero tests on an already running application:
1.  **Global Live Recon (`mate-pw-recon`):** Explores the live URL via `playwright-cli` and reverse-engineers hidden backend APIs from browser network traffic (even without Swagger!).
2.  **Master Strategy & Risk Matrix (`mate-strategy`):** Generates `docs/TEST-STRATEGY.md` (`npx mate-sdt strategy`) and scores modules into `P0`, `P1`, and `P2`.
3.  **Wave 1 — 72-Hour P0 Smoke Shield:** Automates the top 5–8 critical Golden Paths (`npm run test:smoke`) to protect production immediately.
4.  **Wave 2 — Module-by-Module Deepening:** Iterates through `P0` ➔ `P1` ➔ `P2` modules with full 4-quadrant specs, automated suites, manual checklists, and exploratory charters.

---

### Scenario C: Testing an AI Agent, Chatbot, or RAG Pipeline (`/mate-flow-ai-agent`)
When testing an AI system (even if you have zero evaluation datasets today):
1.  **Install the On-Demand AI Pack:** Run `npx mate-sdt setup-ai` (adds `mate-ai-dataset`, `mate-ai-evals`, `mate-ai-redteam`, and `mate-ai-observability`).
2.  **Socratic 5-Dimension Interview & 5-Seed Gate (`mate-ai-dataset`):** Run `npx mate-sdt dataset <agent>`. Your AI agent interviews you across 5 dimensions (Taxonomy, Ground Truth, Tool Guardrails, Compliance, and Trace SLAs) and gets your sign-off on **5 Seed Cases** before synthesizing `tests/ai-evals/datasets/DS-<agent>.json`.
3.  **Dual-Engine Evals & Red Teaming (`mate-ai-evals` + `mate-ai-redteam`):** Run **Promptfoo** (`npm run eval:promptfoo` & `npm run eval:redteam`) and **DeepEval** (`npm run eval:deepeval`) to verify RAG Faithfulness, Tool Correctness, and OWASP LLM Top 10 security.
4.  **OpenTelemetry Trace Forensics (`mate-ai-observability`):** Audit **Langfuse / Arize Phoenix / OTel** traces (`npm run eval:traces`) to catch infinite tool loops, token spikes, and isolate `[RETRIEVER_DEFECT]` vs. `[GENERATOR_DEFECT]`.

> 📖 Read the complete guide in [`docs/AI_AGENT_AND_RAG_TESTING.md`](./AI_AGENT_AND_RAG_TESTING.md).

---

## 4. Context Engineering & Harness Verification Gates (`v1.6+`)

M.A.T.E. enforces the two foundational disciplines of modern AI Agent systems:

1.  **Context Engineering (`npx mate-sdt context [module]`):**
    *   Audits your Tier-1 RAM index (`MATE-PROJECT-MAP.md`) to ensure it stays under the `< 3,000` token budget and checks for *Context Drift* (unindexed Page Objects, Component Objects, or Specs).
    *   When given a `[module]` name, compiles a compressed **Just-In-Time (JIT) Context Pack** (`.mate/context-pack-<module>.md`) so your AI agent only loads the artifacts relevant to the current task.
2.  **Harness Engineering (`npx mate-sdt gate`):**
    *   Executes the **5-Gate Closed Verification Loop** (`GATE-01-CONTEXT`, `GATE-02-SPEC-MODEL`, `GATE-03-ANTI-GREENWASHING`, `GATE-04-SOLID-AUDIT`, and `GATE-05` State Persistence in `.mate/harness-state.json`).
    *   Always run `npx mate-sdt gate` (or `npm run mate:gate`) before completing a task or opening a Pull Request.

> 📖 Read the full deep-dive in [`docs/CONTEXT_AND_HARNESS_ENGINEERING.md`](./CONTEXT_AND_HARNESS_ENGINEERING.md).
