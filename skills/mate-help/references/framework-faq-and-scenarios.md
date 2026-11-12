# 💡 M.A.T.E. Framework FAQ & Real-World Implementation Guide

Answers to the most common questions from QA Engineers, SDETs, and Teams adopting the M.A.T.E. Method.

---

## Q1: Should we automate 100% of the test cases generated from a User Story?
**No!** M.A.T.E. follows *Pragmatism over Dogma* and *Testing != Checking*.
When you give M.A.T.E. a User Story (via `mate-story-testcases` or `/mate-flow-user-story`), it evaluates every scenario and assigns an **Execution Mode**:
1. **`[AUTOMATE_UI]`**: Deterministic, repeatable user flows and critical DOM state transitions (`tests/e2e/`).
2. **`[AUTOMATE_API]`**: Data permutations, boundary value tables, schema validations, and HTTP status codes (`tests/api/`).
3. **`[MANUAL_TEST]`**: Scenarios where automation has negative ROI or requires human perception/external devices (e.g., real SMS/Email rendering, physical camera/QR scanning, third-party OAuth/CAPTCHA gates, print/PDF aesthetics, or one-time migration checks). M.A.T.E. documents step-by-step manual instructions and explains *why* they should remain manual in `tests/cases/TC-[module].md`.
4. **`[EXPLORATORY_CHARTER]`**: Contextual exploratory testing missions (`tests/charters/CHR-*.md`) with tailored border-case heuristics for the human tester.

---

## Q2: What happens when M.A.T.E. tests a User Story and finds that the app fails a requirement?
Traditional AI assistants either delete the failing test or change the `expect()` assertion to match the broken app so the test suite turns green (*Greenwashing*).
**M.A.T.E. strictly forbids this:**
1. The test is **still written** in `tests/e2e/` or `tests/api/` with the **true expected assertion** from the User Story.
2. The test is annotated with `test.fail(true, 'BUG-XXX: App violates AC-02 / INV-01')` so Playwright tracks it as an expected failure until developers fix the bug.
3. A formal bug report is generated in `tests/bugs/BUG-*.md` (`npx mate-sdt bug <module>`).
4. Once developers fix the bug, Playwright automatically fails the `test.fail()` annotation ("Expected to fail, but passed!"), alerting QA to remove `test.fail()` and promote the test to standard green status!

---

## Q3: How do we use M.A.T.E. if QA works in a separate repository (outside Frontend and Backend)?
1. Create your dedicated QA folder (`mkdir my-qa-repo && cd my-qa-repo`) and run:
   ```bash
   npx mate-sdt install --with-playwright-cli
   ```
2. Select **`Standalone QA Repository`** mode. M.A.T.E. automatically creates `playwright.config.ts`, `tsconfig.json`, `.env.example`, `docs/TEST-STRATEGY.md`, and `package.json` scripts.
3. Copy `.env.example` to `.env` and set `BASE_URL` to your staging/production URL.
4. Run the **`/mate-flow-zero-to-one`** workflow in your AI agent: it will explore the live URL with `playwright-cli`, reverse-engineer hidden API calls from browser network traffic (even without Swagger!), build your `P0/P1/P2` Risk Matrix, and automate your **Wave 1 P0 Smoke Shield** first.

---

## Q4: What if we don't use Atlassian/Jira MCP? Can we use Notion, Excel, or plain text?
**Yes.** `mate-story-testcases` is 100% source-agnostic:
- **Atlassian MCP / Notion MCP / Linear MCP / GitHub MCP:** Fetches tickets and pages directly if configured.
- **Excel (`.xlsx`) / CSV (`.csv`) / Markdown (`.md`):** Reads local files directly from your workspace.
- **Export Compatibility:** Every time M.A.T.E. generates test cases (`npx mate-sdt cases <module>`), it creates both `tests/cases/TC-<module>.md` (rich QA companion document) and `tests/cases/TC-<module>.csv` (ready to import into Jira Xray, Zephyr, TestRail, Notion, or Excel).

---

## Q5: Why are there 3 separate `@playwright/cli` skills (`mate-pw-recon`, `mate-pw-codegen`, `mate-pw-forensics`)?
To keep your AI agent's context window lean and ensure the right rules apply at the right moment:
- **`mate-pw-recon`** activates *before* coding to open the live browser, verify User Stories interactively, inspect DOM/WCAG attributes, and reverse-engineer network APIs.
- **`mate-pw-codegen`** activates *during* automation to translate locators, `storageState` auth, and network route mocks into SOLID `BasePage`, `BaseComponent`, and `MateFixtures` classes.
- **`mate-pw-forensics`** activates *during* Pillar T concurrency testing (`-s=actor1`, `-s=actor2`), Pillar E exploratory recording (`video-start`), and Day-2 Triage (`tracing-start`, PR attachments).

---

## Q6: How does M.A.T.E. implement Context Engineering and Harness Engineering?
M.A.T.E. (`v1.6+`) is built around the two foundational disciplines of reliable AI Agent systems:

1. **Context Engineering (*Write, Select, Compress, Isolate*):**
   - **Write:** Persists truth outside the ephemeral chat history in `MATE-PROJECT-MAP.md`, `specs/*.mate-spec.md`, `tests/cases/TC-*.md`, `tests/bugs/BUG-*.md`, and `.mate/harness-state.json`.
   - **Select:** Uses a 3-Tier Progressive Context Architecture (`MATE-PROJECT-MAP.md` `< 3,000 tokens` + phase-scoped skills) and **`npx mate-sdt context <module>`** to generate a single-file Just-In-Time (JIT) Context Pack (`.mate/context-pack-<module>.md`).
   - **Compress:** Uses `@playwright/cli` concise YAML accessibility snapshots (`< 800 tokens`) instead of 80,000-token raw HTML dumps, immediately promoting locators into `src/pages/*.page.ts`.
   - **Isolate:** Requires Epistemic Provenance tags (`[OBSERVED]`, `[INFERRED]`, `[TBD]`) so AI agents never confuse assumptions with verified facts (*Context Poisoning*).

2. **Harness Engineering ($\text{Agent} = \text{Model} + \text{Harness}$):**
   - Executes a deterministic **5-Gate Closed Verification Loop** via **`npx mate-sdt gate`** (or `npx mate-sdt verify`):
     - `GATE-01-CONTEXT`: Checks `MATE-PROJECT-MAP.md` token budget (`<= 3,000 tokens`) and ensures zero unindexed Page Objects, Component Objects, or Specs (*Context Drift*).
     - `GATE-02-SPEC-MODEL`: Validates `specs/*.mate-spec.md` XML blocks, forbidden transitions, and `TC-XXX` matrices.
     - `GATE-03-ANTI-GREENWASHING`: Scans `tests/**/*.spec.ts` for `test.fail()` annotations and blocks the gate if any `test.fail()` lacks a matching `BUG-XXX` reference and a forensic report in `tests/bugs/BUG-*.md`.
     - `GATE-04-SOLID-AUDIT`: Enforces `Grade A (100/100)` zero-sleep (`waitForTimeout`) and SOLID Dependency Inversion rules.
     - `GATE-05` State Persistence: Writes `.mate/harness-state.json` with actionable `[SELF-CORRECTION]` prompts that tell the AI agent how to fix any violation before finishing its turn.

---

## Q7: How do we test AI Agents, Chatbots, and RAG systems with M.A.T.E.?
Run **`npx mate-sdt setup-ai`** (or `npx mate-sdt install --with-ai-evals`) to install the on-demand **M.A.T.E. AI Quality Pack**:
1. **Socratic Dataset Discovery (`mate-ai-dataset` / `npx mate-sdt dataset <module>`):** When no dataset exists, the agent interviews the tester across **5 Dimensions** (System Taxonomy, Ground Truth, Tool Guardrails, Compliance, and Observability Budgets), gets human sign-off on **5 Seed Cases**, and synthesizes `tests/ai-evals/datasets/DS-<module>.json`.
2. **Dual-Engine Evaluation (`mate-ai-evals`):** Evaluates the RAG Triad (*Faithfulness*, *Answer Relevancy*, *Contextual Precision/Recall*) and Agent Trajectories (*Tool Correctness*, *Task Completion*) using **Promptfoo** (`npm run eval:promptfoo`) and **DeepEval** (`npm run eval:deepeval`).
3. **Adversarial Red Teaming (`mate-ai-redteam`):** Runs OWASP LLM Top 10 probes (Prompt Injection, Tool RBAC/BOLA, PII leaks) via `npm run eval:redteam` (`npx promptfoo@latest redteam`).
4. **AI Observability & Trace Forensics (`mate-ai-observability`):** Audits **OpenTelemetry / OpenInference** traces (from **Langfuse**, **Arize Phoenix**, or local JSON) via `npm run eval:traces` to catch infinite tool loops, token spikes, and isolate `[RETRIEVER_DEFECT]` vs. `[GENERATOR_DEFECT]`.

---

## Q8: What if our project has ZERO documentation (no PRD, no Swagger, no User Stories, no AI Datasets)?
M.A.T.E. is specifically engineered to **discover and formalize truth from zero documentation** without hallucinating:
1. **For Web Apps with Zero Docs (`mate-pw-recon`):** Opens the live staging/production URL via `playwright-cli open <url>`, captures compact YAML ARIA snapshots (`snapshot`), maps user flows and DOM components, and tags findings as `[OBSERVED]`.
2. **For Backend APIs with Zero Swagger (`mate-pw-recon` — `network-api-discovery.md`):** Captures live XHR/Fetch/GraphQL network traffic (`playwright-cli network`) while navigating the UI to reverse-engineer endpoints, headers, status codes, and payload schemas into `specs/[module].mate-spec.md`.
3. **For AI Agents / Chatbots / RAGs with Zero Datasets (`mate-ai-dataset` — `socratic-dataset-interview.md`):** Never invents test cases blindly. Conducts the **5-Dimension Socratic Interview** with the tester/product owner, validates **5 Seed Cases** (`SEED-01` to `SEED-05`), and synthesizes a grounded Golden & Adversarial Dataset (`DS-<module>.json`).
4. **Epistemic Isolation (`[OBSERVED]`, `[INFERRED]`, `[TBD]`):** Anything that cannot be empirically observed from the live system is tagged `[TBD]` and surfaced as a targeted question for the team—preventing Context Poisoning.

---

## Q9: Can we use M.A.T.E. if our team writes tests in Java (Selenium/Playwright/REST Assured) or Python (Pytest)?
**Yes!** While M.A.T.E.'s default starter templates use TypeScript/Playwright, the **Spec-Driven Testing (`*.mate-spec.md`) model, 4-Quadrant Test Case Matrices (`TC-*.md` & `.csv`), Context Engineering (`MATE-PROJECT-MAP.md`), and AI Evals (`DeepEval` in Python)** are stack-agnostic. Consult `skills/mate-core/references/polyglot-stacks-java-python.md` for the official **Java 21 + Maven + JUnit 5** and **Python 3.12 + Pytest + Pydantic** OOP/SOLID mapping patterns.
