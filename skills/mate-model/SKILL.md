---
name: mate-model
description: >-
  Specialist in Pillar M (Model) of the M.A.T.E. Method. Models business intent,
  diagrams Finite State Machines (FSM) with explicit forbidden transitions, defines
  strict technical contracts, performs Live Page Reconnaissance (via Playwright MCP/CLI),
  and authors MATE-SPEC.md files for both Greenfield and Brownfield projects.
---

# 🗺️ Pillar M Skill: Intent Modeling & Live Reconnaissance (`mate-model`)

This skill is responsible for **Pillar M (Model)** of the M.A.T.E. Method. Its purpose is to eradicate ambiguity before application source code or automated tests are written.

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
    When documentation is missing or a feature is already deployed in dev/staging, uses **Playwright MCP** (or Playwright CLI) to interactively navigate the live URL, inventory UI elements, probe validation states, capture screenshots, and convert empirical observations directly into a `specs/[module].mate-spec.md`. See [`references/live-page-reconnaissance.md`](./references/live-page-reconnaissance.md).
5.  **Maintaining the Living Project Map:**  
    Automatically registers newly modeled modules in `MATE-PROJECT-MAP.md`.

---

## 🛠️ Operational Workflows

### 1. Greenfield Projects (New Feature / New System):
1.  Interview the user, Product Owner, or ingest requirements (applying the **Handling Uncertainty Protocol**: ask clarifying questions or mark `[TBD]`).
2.  Identify system actors, domain entities, and entity lifecycles.
3.  Draft the `<intent_model>` block containing Mermaid state diagrams, legal transition tables, and **Explicitly Forbidden Transitions**.
4.  Define typed data contracts for APIs and events.
5.  Validate with `npx mate-sdt validate` and deliver the spec with status `APPROVED` to unblock Pillar A automation.

### 2. Brownfield Projects — Source Code Reverse-Engineering:
1.  Inspect API routes, controllers, ORM schemas, and database migrations.
2.  Extract the implicit state machine implemented in the legacy code.
3.  Identify illegitimate transitions currently possible due to edge-case bugs and mark them as strictly forbidden.
4.  Generate `specs/[module].mate-spec.md` with status `REVIEW` so tech leads and stakeholders can validate and freeze the intended business rules.

### 3. Brownfield / Undocumented Live App — Live Page Reconnaissance:
1.  Follow [`references/live-page-reconnaissance.md`](./references/live-page-reconnaissance.md) using Playwright MCP.
2.  Navigate the target URL, inventory interactive elements (navigation, forms, buttons, modals, alerts), and test non-destructive happy/error states.
3.  Synthesize findings into a draft `specs/[module].mate-spec.md` (with confidence tags `[OBSERVED]` vs. `[INFERRED]`).

---

## ⚡ CLI & Reference Artifacts

*   **CLI Spec Validator:** `npx mate-sdt validate specs/your-feature.mate-spec.md`
*   **Python Spec Linter Script:** [`scripts/validate_mate_spec.py`](./scripts/validate_mate_spec.py)
*   **Live Page Reconnaissance Guide:** [`references/live-page-reconnaissance.md`](./references/live-page-reconnaissance.md)
*   **Golden Sample Spec:** [`examples/sample-order-lifecycle.mate-spec.md`](./examples/sample-order-lifecycle.mate-spec.md)
