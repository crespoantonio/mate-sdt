---
name: mate-model
description: >-
  Specialist in Pillar M (Model) of the M.A.T.E. Method.
  USE WHEN: You need to author or validate `specs/*.mate-spec.md`, model Finite State Machines (FSM) with
  Explicit Forbidden Transitions, define mathematical invariants (`INV-XX`), or reverse-engineer a spec from
  legacy code or a live web app.
  SYNERGY: Receives ingested User Stories and Test Case quadrants from `mate-story-testcases`, pairs with
  `mate-pw-recon` for live browser discovery, and feeds validated specs into `mate-assert-playwright`,
  `mate-pw-codegen`, `mate-assert-api`, `mate-threat`, and `mate-performance-k6`.
---

# 🗺️ Pillar M Skill: Intent Modeling & Spec Governance (`mate-model`)

This skill is responsible for **Pillar M (Model)** of the M.A.T.E. Method. Its purpose is to eradicate ambiguity before application source code or automated tests are written.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-core` & `mate-story-testcases`** | Receives ingested User Stories (from Atlassian/Jira MCP, Notion MCP, Excel/CSV, or text) and existing domain context from `MATE-PROJECT-MAP.md`. |
| **Companion (Live Recon)** | **`mate-pw-recon`** | Uses `@playwright/cli` (`open`, `snapshot`) to inspect the live application and verify state transitions empirically (`[OBSERVED]` vs `[INFERRED]`). |
| **Downstream (Pillar A)** | **`mate-assert-playwright`, `mate-pw-codegen` & `mate-assert-api`** | Translates `<invariants>` and `<intent_model>` contracts into SOLID UI and API test suites. |
| **Downstream (Pillar T & E)** | **`mate-threat`, `mate-performance-k6` & `mate-explore`** | Translates `<threat_scenarios>`, `<performance_oracles>`, and `<exploratory_charters>` into adversarial tests, k6 load scripts, and SBTM charters. |

---

## 📋 Responsibilities of `mate-model`

1.  **Authoring M.A.T.E. Specifications (`*.mate-spec.md`):**  
    Generates standardized specifications based on the official manifest template using machine-readable, XML-delimited semantic blocks (`<intent_model>`, `<invariants>`, `<threat_scenarios>`, `<exploratory_charters>`).
2.  **Modeling Finite State Machines (FSM):**  
    No business workflow is left undefined. Every entity lifecycle is modeled with:
    - Explicit initial state.
    - Deterministic allowed transitions.
    - **Strictly forbidden transitions** (the root cause of 90% of business logic bugs and financial exploits).
3.  **Technical Contracts and Interfaces:**  
    Defines request/response schemas in TypeScript or JSON Schema with strict static typing (zero `any` types allowed).
4.  **Live Web Page Reconnaissance (`page-explorer` Mode):**  
    When documentation is missing or a feature is already deployed in dev/staging, pairs with **`mate-pw-recon`** (`@playwright/cli`) or **Playwright MCP** to interactively navigate the live URL, inventory UI elements, probe validation states, capture screenshots, and convert empirical observations directly into a `specs/[module].mate-spec.md`. See [`references/live-page-reconnaissance.md`](./references/live-page-reconnaissance.md).
5.  **Maintaining the Living Project Map:**  
    Automatically registers newly modeled modules in `MATE-PROJECT-MAP.md`.

---

## 🛠️ Operational Workflows

### 1. Greenfield / User Story Projects:
1.  Ingest requirements via `mate-story-testcases` (applying the **Handling Uncertainty Protocol**: ask clarifying questions or mark `[TBD]`).
2.  Identify system actors, domain entities, and entity lifecycles.
3.  Draft the `<intent_model>` block containing Mermaid state diagrams, legal transition tables, and **Explicitly Forbidden Transitions**.
4.  Define `<invariants>` (`INV-01`, `INV-02`...) covering Happy Paths, Border Cases, and Negative Paths.
5.  Validate with `npx mate-sdt validate` and deliver the spec to unblock Pillar A automation.

### 2. Brownfield Projects — Source Code Reverse-Engineering:
1.  Inspect API routes, controllers, ORM schemas, and database migrations.
2.  Extract the implicit state machine implemented in the legacy code.
3.  Identify illegitimate transitions currently possible due to edge-case bugs and mark them as strictly forbidden.
4.  Generate `specs/[module].mate-spec.md` with status `REVIEW` so tech leads and stakeholders can validate and freeze the intended business rules.

### 3. Brownfield / Undocumented Live App — Live Page Reconnaissance:
1.  Activate **`mate-pw-recon`** (`playwright-cli open <url>`) or follow [`references/live-page-reconnaissance.md`](./references/live-page-reconnaissance.md).
2.  Navigate the target URL, inventory interactive elements (navigation, forms, buttons, modals, alerts), and test non-destructive happy/border/error states.
3.  Synthesize findings into a draft `specs/[module].mate-spec.md` (with confidence tags `[OBSERVED]` vs. `[INFERRED]`).

---

## ⚡ CLI & Reference Artifacts

*   **CLI Spec Validator:** `npx mate-sdt validate specs/your-feature.mate-spec.md`
*   **Python Spec Linter Script:** [`scripts/validate_mate_spec.py`](./scripts/validate_mate_spec.py)
*   **Live Page Reconnaissance Guide:** [`references/live-page-reconnaissance.md`](./references/live-page-reconnaissance.md)
*   **Golden Sample Spec:** [`examples/sample-order-lifecycle.mate-spec.md`](./examples/sample-order-lifecycle.mate-spec.md)

---

## 🔄 Black-Box Handoff & Session Isolation

- **Separate Individual Histories:** Never pass raw multi-turn scratchpads or verbose upstream tool logs into this skill or out to downstream skills.
- **Consume & Emit `mate.handoff/v1`:** Read only the compressed upstream handoff digest + `npx mate-sdt context <module>` JIT pack, and advance stages via `npx mate-sdt session advance <flow-id> --stage=<next> --to=<skill> --digest="..."`.
- **Provenance & Hygiene:** Tag findings with `[BOOTSTRAPPED]`, `[USER_EXPLICIT]`, `[OBSERVED | ISO]`, `[INFERRED]`, or `[TBD]`; promote verified facts via `npx mate-sdt context <module> --consolidate`.

## Zero-Assumption Escalation & Sub-Agent Isolation Protocol

- **Ask, Never Guess (`STATUS: BLOCKED_ON_USER_INPUT`):** Inspect local context (`MATE-PROJECT-MAP.md`, `specs/`, code) and live browser/API responses first. Never invent business thresholds, auth boundaries, or SLA numbers. Tag any genuine requirement gap as `[TBD: <exact question for PO/Dev/QA>]` inside `## Open Questions for Human QA`, finish all unblocked work, and halt when `npx mate-sdt validate` or `npx mate-sdt gate` returns `STATUS: BLOCKED_ON_USER_INPUT` to ask the human.
- **Sub-Agent Context Isolation (`--subagent` & `mate.handoff/v1`):** When delegating to a sub-agent or running a multi-stage pipeline (Reader/Extractor -> Spec Scorer -> Code Writer -> Independent Reviewer), build a scoped prompt via `npx mate-sdt context <module> --subagent <skill-name>` (`.mate/subagent-prompt-<module>-<skill>.md`). Pass only the structured `mate.handoff/v1` digest between stages (or run `--compact` in single-agent IDEs) so raw exploratory noise never pollutes downstream context windows.
