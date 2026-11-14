---
name: mate-core
description: >-
  Master orchestrator of the M.A.T.E. Spec-Driven Testing (SDT) Framework by Tony Crespo (Un Junior En Apuros).
  USE WHEN: Starting any QA/Testing task, reading or updating `MATE-PROJECT-MAP.md`, deciding which of the 20 M.A.T.E. skills (16 core + 4 AI pack) or 8 E2E workflows to activate, enforcing OOP/SOLID architecture, applying the Handling Uncertainty Protocol,
  or enforcing the Anti-Greenwashing Mandate.
  SYNERGY: Orchestrates and routes tasks across all 20 M.A.T.E. skills: 16 core skills (`mate-party`, `mate-help`, `mate-strategy`,
  `mate-story-testcases`, `mate-model`, `mate-pw-recon`, `mate-assert-playwright`, `mate-pw-codegen`,
  `mate-pw-forensics`, `mate-assert-api`, `mate-threat`, `mate-performance-k6`, `mate-explore`, `mate-triage`,
  `mate-maintenance`) + 4 On-Demand AI Pack skills (`mate-ai-dataset`, `mate-ai-evals`, `mate-ai-redteam`, `mate-ai-observability`).
---

# 🧉 Master Skill: M.A.T.E. Core (`mate-core`)

This skill serves as the operational brain and router of the **M.A.T.E. Method** (*Spec-Driven Testing Framework*).  
Its purpose is to ensure that any software project implements a quality architecture that is **scalable, Object-Oriented (OOP), adheres to SOLID principles, covers Happy + Border + Negative paths, never hides real application bugs, and is optimized for AI consumption without context window saturation**.

---

## 🎯 The 6 Core Operational Mandates of `mate-core`

1. **Context Engineering — Sessions, Memory & Failure-Mode Guardrails (*Write, Select, Compress, Isolate*):**  
   - **Separate Session Workbench from Memory Filing Cabinet:** Store ephemeral per-flow working state (last $K=5$ raw findings, active stage, scratchpad) in `.mate/sessions/<flow-id>.json`, `.mate/scratchpad-<module>.md`, and `.mate/handoffs/` (24h TTL, rolling + event-based compaction on stage transitions via `npx mate-sdt session`). Store canonical, cross-session knowledge in `MATE-PROJECT-MAP.md` (`< 3,000 tokens` Tier-1 RAM), `specs/*.mate-spec.md`, and `.mate/memory/procedural-playbooks.md`.
   - **Select (3-Bucket / 7-Layer JIT Context Pack):** Run `npx mate-sdt context <module>` to build a phase-scoped JIT pack instead of dumping raw repository files.
   - **Compress & Consolidate:** Compress `@playwright/cli` YAML ARIA snapshots (`<= 800 tokens`) and HAR logs; fold stale sessions with `--compact` and promote `[OBSERVED]` findings into canonical memory (`CREATE`/`UPDATE`/`DELETE`) with `--consolidate`.
   - **Isolate & Eliminate the 4 Context Failure Modes:** Guard against **Poisoning** (enforce `[BOOTSTRAPPED] > [USER_EXPLICIT] > [OBSERVED | ISO-timestamp] > [INFERRED] / [TBD]`; block `[INFERRED]`/`[TBD]` from `<invariants>` and Page/Component Objects; redact PII/secrets before persistence), **Distraction** (3-line rolling summaries + $K=5$ cap), **Confusion** (phase-scoped tools & XML slices), and **Clash** (self-editing consolidation + Black-Box `mate.handoff/v1` handoffs).
2. **Harness Engineering ($\text{Agent} = \text{Model} + \text{Harness}$ — Closed Verification Loop):**  
   Never rely on prompt instructions alone. After creating or modifying specs, Page Objects, or tests, run **`npx mate-sdt gate`** to execute the 5 deterministic guardrails (`GATE-01` Context Budget, `GATE-02` Spec Linter, `GATE-03` Anti-Greenwashing Traceability, `GATE-04` SOLID/Zero-Sleep Audit, and `GATE-05` State Persistence in `.mate/harness-state.json`). If any gate fails, follow the `[SELF-CORRECTION]` prompts until `npx mate-sdt gate` passes.
3. **Sub-Agent Forking & Parallel Isolation Mandate:**  
   Whenever the host platform supports sub-agent execution (`invoke_subagent` in Antigravity, `Agent` in Claude Code, or background task runners), **DELEGATE high-token operations** (live `@playwright/cli` DOM recon, heavy OpenTelemetry trace audits, or multi-quadrant test case generation) to **isolated sub-agents running in parallel**. The primary conversation thread must remain a lean cockpit (`< 3,000 tokens`), receiving only synthesized artifacts and file paths. See [`docs/SUBAGENTS_AND_PARALLEL_EXECUTION.md`](../../docs/SUBAGENTS_AND_PARALLEL_EXECUTION.md).
4. **Object-Oriented Design and SOLID Principles in Testing:**  
   - **Single Responsibility (SRP):** Atomic Page Objects (`BasePage`), dedicated Component Objects (`BaseComponent`), and typed API Clients (`BaseApiClient`).
   - **Open/Closed (OCP):** Extensible base classes and fixtures that allow extending behavior without modifying existing code.
   - **Liskov Substitution (LSP):** Base page abstractions and API clients must be substitutable by their derivatives without breaking test contracts.
   - **Interface Segregation (ISP):** Lean, specific interfaces for test data and contract models (zero `any` types).
   - **Dependency Inversion (DIP):** Dependency injection via Playwright fixtures (`test.extend()`) rather than hard-coupled `new PageObject(page)` instantiation inside test files.
   - **Anti-Bloated Page Objects (`MATE-ANTI-07`):** Never bloat Page Objects with dozens of single-case assertion methods (`assertInvalidEmail()`, `assertMissingHouseNumber()`). Parametrize assertions (`assertAlertMessage(expected)`), expose public `readonly Locator`s for `expect.soft()` flexibility, keep synchronization Guards private inside actions, and extract stateful/shared widgets into dedicated `BaseComponent` objects.
5. **The Anti-Greenwashing Mandate (Never Only Write Tests That Pass):**  
   - **Specification Over Implementation:** The User Story and `*.mate-spec.md` are the source of truth—never the potentially buggy application.
   - **4-Quadrant Coverage:** Every feature must have Test Cases and Automated Tests covering **Happy Paths, Border/Boundary Cases, Negative Paths, and Forbidden State Transitions**.
   - **Zero Permissive Regexes (`MATE-ANTI-06`):** Never write ambiguous alternative regex assertions (e.g. `toContainText(/A|B/)` or `/already in use|already exists/i`) to artificially mask copy or behavior mismatches between the User Story and the live application.
   - **Zero Silent Workarounds:** Never silently inject undocumented mandatory fields into Page Objects, switch test accounts without explaining why, or bypass broken navigation paths without human consultation.
   - **Mandatory Discrepancy Escalation:** Whenever a gap or discrepancy between User Story and live app is discovered, the agent **MUST PAUSE and ask the human engineer**:
     - *Is this a real defect?* ➔ Assert the literal User Story requirement, mark with `test.fail(true, 'BUG-XXX: ...')`, and file `docs/bugs/BUG-*.md`.
     - *Or is this an intentional spec update?* ➔ Update `specs/*.mate-spec.md` and `docs/test-cases/` first, then automate against the approved new criteria.
   - **Keep & Flag Failing Tests:** If a test that *should* pass according to the User Story / Spec **fails** against the live app, **NEVER delete the test or weaken the assertion** to make the suite green. Keep the test with its real assertion, annotate it with `test.fail(true, 'BUG-XXX: violates INV-YY / TC-ZZ')` (or `test.fixme()`), generate `docs/bugs/BUG-*.md` (`npx mate-sdt bug`), and report it clearly to the tester.
6. **Strict Handling Uncertainty Protocol:**  
   - **Never Assume:** Do not invent SLAs, authentication flows, or undocumented business rules.
   - **Ask First or Mark `[TBD]`:** When critical context is missing, ask targeted clarifying questions or mark `[TBD: needs input on X]` with explicit confidence levels (`Observed` vs. `Inferred`). See [`references/handling-uncertainty.md`](./references/handling-uncertainty.md).
7. **Skill Synergy & Lifecycle Routing:**  
   Orchestrates the **20 M.A.T.E. Skills** (16 Core + 4 AI Agent/RAG Pack) and **8 End-to-End Workflows** so the exact right skill activates at the exact right moment.

---

## 🧩 The 16 Core M.A.T.E. Skills & Synergy Routing Matrix (Plus 4 AI Agent Skills via `setup-ai`)

| Skill | Pillar / Phase | Exact Moment to Activate (`USE WHEN`) | Companion / Synergy Skills |
| :--- | :--- | :--- | :--- |
| **`mate-core`** | **Orchestrator** | Reading/updating `MATE-PROJECT-MAP.md`, routing tasks, enforcing SOLID & Anti-Greenwashing rules. | Routes to all 15 skills below |
| **`mate-party`** | **Conversational Entry Point ("Party Mode")** | User is uncertain, requirements are ambiguous/unstructured, asks "Where do I start?", or doesn't invoke a specific skill. Convenes virtual Council of Experts, loads JIT discovery questions, identifies human collaborators, and synthesizes action plan. | Routes to `mate-strategy`, `mate-story-testcases`, `mate-pw-recon`, or `mate-ai-dataset` |
| **`mate-help`** | **Coach & Advisor** | User asks any question about how M.A.T.E. works, which workflow/command to use, or how to implement SDT in their scenario. | Diagnoses context & routes to the exact skill/workflow |
| **`mate-strategy`** | **Phase 0 (Strategy & Plan)** | QA team starts from zero on a live app (Standalone QA Repo), needs `docs/TEST-STRATEGY.md`, `docs/test-plans/TP-*.md`, a `P0/P1/P2` Risk Matrix, a 2-Wave Smoke-First plan, or manual suite migration. | `mate-pw-recon` ➔ `mate-story-testcases` + `mate-model` |
| **`mate-story-testcases`** | **Ingestion & QA Companion** | Tester provides a User Story (Atlassian/Jira MCP, Notion MCP, Excel/CSV, or text) to design 4-Quadrant Test Cases (`docs/test-cases/TC-*.md` & `.csv`), decide What to Automate vs. Keep Manual (with rationale), and recommend Exploratory Charters. | `mate-model` ➔ `mate-pw-recon` ➔ `mate-assert-playwright` + `mate-explore` |
| **`mate-model`** | **Pillar M (Model)** | Authoring or validating `specs/*.mate-spec.md`, Finite State Machines, and **Explicit Forbidden Transitions**. | `mate-story-testcases` + `mate-pw-recon` |
| **`mate-pw-recon`** | **Pillar M/A (Live CLI Recon)** | Opening live URLs (`playwright-cli open/snapshot`), verifying User Story & border cases live in the browser, and mapping semantic DOM/ARIA locators before coding. | `mate-story-testcases` + `mate-model` ➔ `mate-pw-codegen` |
| **`mate-assert-playwright`** | **Pillar A (SOLID UI Rules)** | Designing or reviewing `BasePage`, `BaseComponent`, `MateFixtures`, zero-sleep assertions, and applying `test.fail()` on real app bugs. | `mate-pw-codegen` + `mate-story-testcases` |
| **`mate-pw-codegen`** | **Pillar A (CLI Codegen)** | Translating `playwright-cli` locators, `state-save` auth, and `route` network mocks into SOLID Page/Component Objects and running/debugging Playwright specs. | `mate-assert-playwright` + `mate-pw-recon` |
| **`mate-pw-forensics`** | **Pillar T/E & Triage (CLI)** | Multi-actor sessions (`-s=actor1`, `-s=actor2`), `tracing-start`/`stop`, 60fps `video-start` recordings, and PR/Jira visual attachments. | `mate-threat` + `mate-explore` + `mate-triage` |
| **`mate-assert-api`** | **Pillar A (API Contracts)** | Translating OpenAPI/Swagger or spec contracts into typed `BaseApiClient` classes and schema/status/auth matrices. | `mate-model` + `mate-threat` |
| **`mate-threat`** | **Pillar T (Chaos & Mutation)** | Concurrency, race conditions, idempotency, fuzzing, and Stryker Mutation (`>= 85%`) in rootless Podman (`npx mate-sdt mutate`). | `mate-pw-forensics` + `mate-assert-api` |
| **`mate-performance-k6`** | **Pillar A/T (NFR - k6)** | Translating `<performance_oracles>` SLAs into Grafana k6 scripts executed in rootless Podman (`npx mate-sdt k6`). | `mate-model` + `mate-threat` |
| **`mate-explore`** | **Pillar E (Explore)** | Human SBTM exploratory charters (`npx mate-sdt charter`), WCAG 2.1 AA audits, Release Waivers (`npx mate-sdt waiver`), and Release Verdicts. | `mate-pw-forensics` + `mate-triage` |
| **`mate-triage`** | **Day-2 Operations** | Classifying CI or live test failures (Real Bug vs. Flaky vs. Env vs. Drift) and generating spec-linked Bug Reports (`npx mate-sdt bug`). | `mate-pw-forensics` + `mate-maintenance` |
| **`mate-maintenance`** | **Day-2 Operations** | Auditing test codebase health (`A`–`F`) via `npx mate-sdt audit` to eliminate `waitForTimeout`, `.only`, and DIP violations. | `mate-assert-playwright` + `mate-triage` |
| **`mate-ai-dataset`** *(On-Demand AI Pack)* | **AI Dataset Discovery** | Testing an AI Agent, Chatbot, or RAG with no dataset: runs the **5-Dimension Socratic Interview**, **5-Seed Human Gate**, and synthetic evolutions (`npx mate-sdt dataset <mod>`). | `mate-ai-evals` + `mate-ai-redteam` + `mate-ai-observability` |
| **`mate-ai-evals`** *(On-Demand AI Pack)* | **AI Functional & RAG Evals** | Evaluating RAG Triad (*Faithfulness*, *Relevancy*, *Precision*) and Agent Tool Trajectories (`ToolCorrectness`, `TaskCompletion`) with **Promptfoo** & **DeepEval**. | `mate-ai-dataset` + `mate-ai-observability` |
| **`mate-ai-redteam`** *(On-Demand AI Pack)* | **AI Pillar T (Red Team)** | Running OWASP LLM Top 10 security scans (Prompt Injection, Indirect RAG Poisoning, RBAC/BOLA, PII leaks) via `promptfoo redteam`. | `mate-threat` + `mate-ai-dataset` + `mate-triage` |
| **`mate-ai-observability`** *(On-Demand AI Pack)* | **AI Trace Forensics** | Auditing **OpenTelemetry / OpenInference** traces (Langfuse, Arize Phoenix, JSON) for infinite tool loops, token/step budgets, and `[RETRIEVER_DEFECT]` vs. `[GENERATOR_DEFECT]`. | `mate-ai-evals` + `mate-ai-dataset` + `mate-triage` |

---

## 🗺️ M.A.T.E. AI-Friendly Directory Layout

```text
project-root/
├── MATE-PROJECT-MAP.md          <-- [CRITICAL] Living architecture & QA context index
├── docs/                        <-- QA Documentation & Strategy
│   ├── TEST-STRATEGY.md
│   ├── test-plans/              <-- Sprint / Release Test Plans (TP-*.md)
│   ├── test-cases/              <-- Test Case Matrices (TC-[module].md & .csv for Jira/Xray/Excel/Notion)
│   └── bugs/                    <-- Structured bug reports linked to invariants (BUG-*.md)
├── specs/                       <-- M.A.T.E. specifications & release waivers
│   ├── TEMPLATE_MATE_SPEC.md
│   ├── waivers/                 <-- Formal Release Waivers (WVR-*.md)
│   └── [module].mate-spec.md
├── tests/
│   ├── e2e/                     <-- P0/P1 UI workflows (Happy + Border + Negative; real bugs marked test.fail)
│   ├── api/                     <-- Contract and API integration tests
│   ├── threats/                 <-- Concurrency, race conditions, idempotency, fuzzing
│   ├── nfr/                     <-- Performance (k6) and resilience scripts (*.k6.js)
│   ├── charters/                <-- Human exploratory testing sessions (CHR-*.md)
│   └── ai-evals/                <-- [On-Demand AI Pack] Datasets, Promptfoo, DeepEval & OTel Trace Auditor
├── src/
│   ├── pages/                   <-- Page Object Model extending BasePage (OOP / SOLID)
│   ├── components/              <-- Reusable UI Component Objects extending BaseComponent
│   ├── api/                     <-- Typed API Clients & Request Builders
│   ├── mocks/                   <-- Reusable Network Route Mocks
│   ├── fixtures/                <-- Dependency Inversion (DIP) Playwright fixtures
│   └── models/                  <-- Strict TypeScript types and schemas
└── stryker.config.json          <-- Mutation testing governance (>=85% threshold)
```

---

## ⚡ CLI Commands & Reference Resources

- **Interactive Installer:** `npx mate-sdt install` (or `--with-playwright-cli` / `--with-ai-evals`)
- **Install `@playwright/cli`:** `npx mate-sdt setup-playwright`
- **Install On-Demand AI Quality Pack:** `npx mate-sdt setup-ai`
- **Generate AI Dataset Discovery & Golden JSON:** `npx mate-sdt dataset <module>`
- **Context Engineering & JIT Context Pack:** `npx mate-sdt context [module] [--compact] [--consolidate] [--phase=<phase>]`
- **Session Workbench & Black-Box Handoffs:** `npx mate-sdt session <start|event|advance|show|list|prune>`
- **5-Gate Harness Verification Loop:** `npx mate-sdt gate`
- **Validate Specs:** `npx mate-sdt validate`
- **Generate Test Case Matrix (`.md` + `.csv`):** `npx mate-sdt cases <module>` (saves to `docs/test-cases/`)
- **Audit Test Suite Health (`A`–`F`):** `npx mate-sdt audit`
- **Run Podman Mutation (`>=85%`):** `npx mate-sdt mutate`
- **Run Podman k6 Performance:** `npx mate-sdt k6 tests/nfr/load.k6.js`
- **Generate Charter / Bug / Waiver:** `npx mate-sdt charter <mod>` | `npx mate-sdt bug <mod>` | `npx mate-sdt waiver <mod>`
- **References:**
  - [`resources/MATE-PROJECT-MAP.template.md`](./resources/MATE-PROJECT-MAP.template.md)
  - [`references/handling-uncertainty.md`](./references/handling-uncertainty.md)
  - [`references/polyglot-stacks-java-python.md`](./references/polyglot-stacks-java-python.md)

---

## 🚨 Automatic Stack-Trace & Failure Entry Point

- Whenever the user pastes a raw stack trace, `TimeoutError`, `StrictModeViolation`, HTTP `4xx/5xx` mismatch, or says *"fix this"* / *"heal this test"* / *"why did this fail?"*, **route immediately to `mate-triage` + `npx mate-sdt heal` (`/mate-flow-triage`)**.
