# AGENTS.md — M.A.T.E. SDT Framework Engineering & Contributor Governance

> **Repository:** `mate-sdt` (Model-Agnostic Test Engineering / Spec-Driven Testing)  
> **Creator & Lead Architect:** Antonio "Tony" Crespo (*Un Junior En Apuros*)  
> **Target Audience:** Autonomous AI Agents (Claude Code, Cursor, Windsurf, Copilot, Antigravity, OpenAI Codex, Gemini CLI) and human core maintainers.  
> **Core Mandate:** This document governs anyone or anything reading, editing, improving, or extending the `mate-sdt` framework codebase itself.

---

## 1. Project Mission & Identity

`mate-sdt` is a **Spec-Driven Testing (SDT) Framework and Daily QA/QE Companion** built for the Agentic AI Era (2026+).  
In an era where autonomous agents generate application code at lightspeed ("Vibe Coding"), testing cannot be reduced to naive LLM unit test prompts. `mate-sdt` equips human testers and AI agents with **Context Engineering** (*Write, Select, Compress, Isolate*) and **Harness Engineering** (`Agent = Model + Harness`) to govern software quality deterministically.

### Core Philosophy
1. **Testing != Checking:** Cosmetic assertions and green suites mean nothing if intent is violated. Specifications, invariant oracles, and human critical thinking are the permanent assets.
2. **Anti-Greenwashing Mandate (`MATE-ANTI-06`):** Never write tests that only pass. Never use permissive alternative regexes (e.g. `/A|B/`) to mask copy discrepancies. Keep failing tests with `test.fail(true, "BUG-XXX")` and formal bug reports in `docs/bugs/`.
3. **Enterprise Anti-Bloated Page Objects (`MATE-ANTI-07`):** Page Objects model the page structure, not test cases. Expose parameterized assertions, public `readonly Locator`s for `expect.soft()`, encapsulate synchronization guards inside actions, and extract reusable widgets into Component Objects.
4. **Epistemic Hygiene:** Separate observed facts (`[OBSERVED]`), reasoned hypotheses (`[INFERRED]`), and unknowns requiring clarification (`[TBD]`). Never guess contracts or SLAs.
5. **Multi-Voice Synergy (`mate-party`):** For open-ended questions, convene the Council of Experts (Tony Strategist, Exploratory Sleuth, Automation Architect, Threat Specialist, AI Evaluator, Human Stakeholder Liaison) before writing code.

---

## 2. Non-Negotiable Engineering Rules for Agents

Whenever an AI agent works on this repository, it **MUST ALWAYS** follow these rules without exception:

1. **Zero Runtime Dependencies for the CLI:**
   - `bin/` and `src/cli/` must be built **STRICTLY on native Node.js (>= 18) built-in modules** (`node:fs`, `node:path`, `node:readline`, `node:child_process`, `node:os`).
   - Do NOT add third-party production dependencies to `package.json`. The CLI must remain instantaneous, zero-install, and supply-chain risk-free for `npx mate-sdt`.
2. **Container Management — Podman Over Docker:**
   - Always use **`podman`** instead of `docker` for containerized execution (Stryker mutation testing, k6 performance runs). Do not attempt to start or require the Docker daemon.
3. **Information Integrity Mandate:**
   - **Never truncate, summarize, or remove** existing requirements, functional details, or narrative depth from planning artifacts, PRDs, architectural whitepapers, or specifications during updates. Prioritize information persistence over context display efficiency.
4. **Mandatory Build & Verification Gate:**
   - After **ANY** code change in `src/`, `bin/`, `skills/`, `workflows/`, or `templates/`, you **MUST ALWAYS** execute the full verification suite before concluding your turn:
     ```bash
     npm run build      # Runs node scripts/build-check.js (integrity, LF endings, specs)
     npm test           # Runs node --test tests/cli.test.js (all 9 integration suites)
     ```
   - Both commands must exit with code `0`. If any check fails, self-correct immediately.
5. **Language Standards:**
   - All repository code, comments, CLI stdout/stderr, documentation, templates, and `SKILL.md` files **MUST be written in 100% idiomatic English**.
   - (User-facing chat communication follows the user's language and project persona guidelines, e.g., Argentine Spanish voseo rioplatense for Tony Crespo, but repo assets are English).
6. **LF Line Endings:**
   - All executable scripts (especially `bin/mate-sdt.js`) must preserve **LF** line endings to guarantee clean execution across Linux, macOS, and Windows Subsystem.

---

## 3. Repository Architecture & Layout

```text
mate-sdt/
├── bin/
│   └── mate-sdt.js             # CLI binary entry point (npx mate-sdt / mate)
├── src/cli/
│   ├── ui.js                   # Terminal UI, colors, banners, spinner
│   ├── validator.js            # Spec linter (Intent model & Forbidden Transitions)
│   ├── auditor.js              # Codebase health auditor & anti-patterns (MATE-ANTI-01..07)
│   ├── harness.js              # Closed verification loop (GATE-01..05 & harness-state.json)
│   ├── memory.js               # Sessions & Memory engine (3-Bucket JIT pack, compaction, consolidation, hygiene)
│   └── installer.js            # Multi-IDE scafolder (Antigravity, Claude, Cursor, Windsurf, Copilot, Codex)
├── skills/                     # 20 Synergistic AI Skills (16 Core + 4 AI Pack)
│   ├── mate-core/              # Master orchestrator & Living Map governor
│   ├── mate-party/             # Conversational entry point & Council of Experts
│   ├── mate-help/              # Framework coaching, diagnosis & FAQs
│   ├── mate-strategy/          # Test strategy, plans & ROI discovery
│   ├── mate-story-testcases/   # User story ingestion & 4-quadrant matrices
│   ├── mate-model/             # Spec-Driven Testing & intent modeling
│   ├── mate-pw-recon/          # Live browser recon & ARIA snapshot compression
│   ├── mate-assert-playwright/ # SOLID Playwright UI (Anti-Bloated PO, Components, Fixtures)
│   ├── mate-pw-codegen/        # E2E journey generation & storage state
│   ├── mate-pw-forensics/      # Traces, videos, PR attachments & debugging
│   ├── mate-assert-api/        # Typed API clients & contract assertions
│   ├── mate-threat/            # Stryker mutation testing in Podman & threat modeling
│   ├── mate-performance-k6/    # k6 SLA performance scripts in Podman
│   ├── mate-explore/           # Exploratory charters & risk waivers
│   ├── mate-triage/            # Root cause analysis & docs/bugs/ bug reports
│   ├── mate-maintenance/      # Flakiness pruning, healing & maintenance reports
│   ├── mate-ai-dataset/        # Socratic dataset discovery & Golden Datasets (AI Pack)
│   ├── mate-ai-evals/          # Promptfoo & DeepEval non-deterministic testing (AI Pack)
│   ├── mate-ai-redteam/        # OWASP LLM Top 10 red-teaming (AI Pack)
│   └── mate-ai-observability/  # OpenTelemetry span traces & cost/latency auditor (AI Pack)
├── workflows/                  # 8 E2E Guided Workflows
│   ├── mate-flow-zero-to-one.md
│   ├── mate-flow-user-story.md
│   ├── mate-flow-greenfield.md
│   ├── mate-flow-brownfield.md
│   ├── mate-flow-api-contract.md
│   ├── mate-flow-performance.md
│   ├── mate-flow-triage.md
│   └── mate-flow-ai-agent.md
├── templates/                  # Canonical spec & harness templates
│   ├── TEMPLATE_MATE_SPEC.md   # Official .mate-spec.md template
│   └── standalone/             # Turnkey Playwright, TS, env, and CI configurations
├── scripts/
│   └── build-check.js          # Build integrity gate (runs on pre-commit/CI)
├── tests/
│   └── cli.test.js             # Native Node test suite (9 integration suites)
├── docs/                       # Architectural whitepapers & references
│   ├── CONTEXT_AND_HARNESS_ENGINEERING.md
│   ├── AI_AGENT_AND_RAG_TESTING.md
│   ├── SUBAGENTS_AND_PARALLEL_EXECUTION.md
│   ├── CLI_REFERENCE.md
│   └── SPEC_STANDARD.md
├── MATE-PROJECT-MAP.md         # Root Living Architecture Map for mate-sdt (< 3,000 tokens)
├── MANIFESTO.md                # The Philosophical Manifesto of the M.A.T.E. Method
└── package.json                # npm package descriptor (version, scripts, keywords)
```

---

## 4. Key Architectural Patterns to Uphold

### 1. Context Engineering: Sessions vs. Memory & 3-Tier Hierarchy
- **Session Workbench (Ephemeral, `.mate/sessions/<flow-id>.json`, `.mate/scratchpad-<module>.md`, `.mate/handoffs/`, `.mate/harness-state.json`):** Holds mutable per-flow state with a 24h TTL, $K=5$ raw event window, and automatic event-based compaction + `mate.handoff/v1` Black-Box Handoffs on stage transitions (`npx mate-sdt session`).
- **Memory Filing Cabinet (Canonical, `MATE-PROJECT-MAP.md`, `specs/*.mate-spec.md`, `.mate/memory/`):** Cross-session, framework-agnostic knowledge. Self-editing consolidation (`CREATE` / `UPDATE` / `DELETE` / `CONFLICT`) runs via `npx mate-sdt context <module> --consolidate`.
- **3-Tier Progressive Context:**
  - **Tier 1 (Always Hot, < 3,000 tokens):** `MATE-PROJECT-MAP.md` + active `specs/*.mate-spec.md`.
  - **Tier 2 (On-Demand Module Context):** 3-Bucket / 7-Layer JIT Context Pack assembled via `npx mate-sdt context <module>`.
  - **Tier 3 (Deep Forensic Cold Storage, Isolated/Sub-agent):** Playwright traces, Stryker mutation reports, k6 performance metrics, OpenTelemetry spans. Never dump Tier 3 into the main agent context.
- **4 Context Failure Modes & Provenance Hierarchy:** Guard against **Poisoning**, **Distraction**, **Confusion**, and **Clash**. Enforce `[BOOTSTRAPPED] > [USER_EXPLICIT] > [OBSERVED | ISO-timestamp] > [INFERRED] / [TBD]`; block `[INFERRED]`/`[TBD]` from `<invariants>` and Page/Component Objects, and redact PII/secrets before persistence.

### 2. Conversational Entry Points & Agent Routing
In any target project governed by M.A.T.E. (scaffolded via `installer.js`):
- **Open-Ended / Ambiguous / "Where do I start?":** ➔ **`mate-party`** (Council of Experts mode). Simulates multi-voice round-table and outputs a prioritized action plan.
- **Framework Guidance / Coaching:** ➔ **`mate-help`** (`/mate-help`).
- **Concrete Task Execution / Living Map Updates:** ➔ **`mate-core`**.

### 3. File System Conventions & Isolation
- **Specs:** `specs/[module].mate-spec.md`. Validated via `npx mate-sdt validate`.
- **Test Cases:** `docs/test-cases/TC-[module]-*.md` and `.csv`.
- **Bug Reports:** `docs/bugs/BUG-[date]-[module].md` (Generated via `npx mate-sdt bug <module>`). **Bugs must NEVER be written to `tests/`**.
- **Exploratory Charters:** `tests/charters/CHARTER-[module]-*.md`.
- **Release Waivers:** `specs/waivers/WAIVER-[module]-*.md`.
- **Test Code:** `tests/e2e/`, `tests/api/`, `tests/threats/`, `tests/nfr/`.
- **State & Harness Persistence:** `.mate/harness-state.json`.

### 4. Anti-Pattern Guardrails (`src/cli/auditor.js`)
- `MATE-ANTI-01`: Explicit sleeps (`waitForTimeout`, `sleep`) are strictly forbidden. Use auto-retrying assertions.
- `MATE-ANTI-02`: Focused test runs (`.only`) are forbidden in committed code.
- `MATE-ANTI-03`: In-test page instantiation (`new Page(page)`). Enforce Playwright fixture dependency injection (`test.extend()`).
- `MATE-ANTI-04`: Dynamic locators (`page.locator(variable)` without strict typing or accessibility).
- `MATE-ANTI-05`: Over-assertive UI checks that belong in API or contract layers.
- `MATE-ANTI-06`: Permissive regex assertions (`/A|B/`) masking copy/behavior discrepancies.
- `MATE-ANTI-07`: Bloated Page Objects with single-case assertion proliferation.

---

## 5. Contributor Workflow for AI Agents

When tasked with adding a new feature, fixing a bug, or updating templates in `mate-sdt`:

1. **Read Before Writing:** Inspect `src/cli/` or relevant `skills/` using targeted line ranges. Do not guess internal implementations.
2. **Preserve Backward Compatibility:** Any changes to `installer.js` must update existing blocks (`<!-- MATE-SDT-START --> ... <!-- MATE-SDT-END -->`) gracefully without corrupting user customizations.
3. **Update Multi-IDE Generators:** When adding new skills, rules, or guidance, ensure updates reflect across all supported targets (`Antigravity`, `Claude Code`, `Cursor`, `Windsurf`, `Copilot`, and Universal `AGENTS.md`).
4. **Run the Full Integrity Check:**
   ```bash
   node scripts/build-check.js
   node --test tests/cli.test.js
   ```
5. **Verify Versioning:** Bump `package.json` appropriately when introducing new rules, skills, or breaking improvements.

---

> *"The specification is the ultimate oracle. Quality is an architectural choice, not an afterthought."* — **Tony Crespo**
