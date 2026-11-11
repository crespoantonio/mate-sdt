---
name: mate-model
description: >-
  Specialist in Pillar M (Model) of the M.A.T.E. Method. Models business intent,
  diagrams Finite State Machines (FSM) with explicit forbidden transitions, defines
  strict technical contracts, and authors MATE-SPEC.md files for both Greenfield and Brownfield projects.
---

# 🗺️ Pillar M Skill: Intent Modeling (`mate-model`)

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
4.  **Maintaining the Living Project Map:**  
    Automatically registers newly modeled modules in `MATE-PROJECT-MAP.md`.

---

## 🛠️ Operational Workflow

### In Greenfield Projects (New Feature / New System):
1.  Interview the user, Product Owner, or ingest requirements.
2.  Identify system actors, domain entities, and entity lifecycles.
3.  Draft the `<intent_model>` block containing Mermaid state diagrams and transition tables.
4.  Define typed data contracts for APIs and events.
5.  Deliver the spec with status `APPROVED` to unblock Pillar A automation.

### In Brownfield Projects (Existing Feature / Legacy Codebase):
1.  Inspect API routes, controllers, ORM schemas, and database migrations.
2.  Extract the implicit state machine implemented in the legacy code.
3.  Identify illegitimate transitions currently possible due to edge-case bugs and mark them as strictly forbidden.
4.  Generate `specs/[module].mate-spec.md` with status `REVIEW` so tech leads and stakeholders can validate and freeze the intended business rules.

---

## ⚡ CLI & Reference Artifacts

*   **CLI Spec Validator:** Run `npx mate-sdt validate specs/your-feature.mate-spec.md` (or validate all specs with `npx mate-sdt validate`) to verify structural integrity and compliance.
*   **Python Spec Linter Script:** Run [`scripts/validate_mate_spec.py`](./scripts/validate_mate_spec.py) on any spec:
    ```bash
    python skills/mate-model/scripts/validate_mate_spec.py specs/your-feature.mate-spec.md
    ```
*   **Golden Sample Spec:** Review [`examples/sample-order-lifecycle.mate-spec.md`](./examples/sample-order-lifecycle.mate-spec.md) for a complete reference specification.
