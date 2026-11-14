# 📐 M.A.T.E. Specification Standard (`*.mate-spec.md`)

Every feature or domain module governed by the **M.A.T.E. Method** must be defined in a `*.mate-spec.md` file inside the `specs/` directory.

This hybrid Markdown + XML format is specifically designed to be:
1.  **Readable by Humans:** Clean tables, Mermaid state diagrams, and checklists for Product Owners and Quality Engineers.
2.  **Deterministically Parsable by AI Agents & Linters:** XML semantic tags (`<intent_model>`, `<invariants>`, `<threat_scenarios>`, `<exploratory_charters>`) allow LLMs and `npx mate-sdt validate` to extract exact architectural boundaries without ambiguity.

---

## 1. Required YAML Frontmatter

Every `*.mate-spec.md` file must begin with a YAML frontmatter block:

```yaml
---
module: order-fulfillment
version: 1.0.0
status: APPROVED # Allowed: DRAFT | REVIEW | APPROVED | DEPRECATED
author: Tony Crespo (@crespoantonio)
quality_lead: Tony Crespo
target_release: v2.1.0
governed_by: M.A.T.E. Spec-Driven Testing Framework
---
```

*   **`DRAFT`**: Work in progress during Pillar M discovery.
*   **`REVIEW`**: Ready for stakeholder sign-off or reverse-engineered from Brownfield legacy code.
*   **`APPROVED`**: Locked source of truth; unblocks Pillar A automation and application coding.
*   **`DEPRECATED`**: Superseded module retained for historical traceability.

---

## 2. The 4 Mandatory XML Semantic Blocks

### Block 1: `<intent_model> ... </intent_model>` (Pillar M)
Must contain:
*   **Domain Actors & Business Context**
*   **Finite State Machine (FSM):** Mermaid `stateDiagram-v2` and/or transition table.
*   **Explicitly Forbidden Transitions (Mandatory):** A list of state transitions that must never occur under any circumstance (e.g., `DRAFT -> DELIVERED`, `CANCELLED -> CONFIRMED`). The validator (`npx mate-sdt validate`) will reject any specification that omits forbidden transitions.
*   **Technical Contracts:** Typed API/event payloads.

### Block 2: `<invariants> ... </invariants>` (Pillar A)
Must contain deterministic business rules and architectural invariants identified with `INV-XX` codes:
*   `INV-01`: Quantitative, state, or contract invariants (e.g., `subtotal >= 0`, `items.length >= 1`, status transitions).
*   `ORA-PERF` / `ORA-SYNC`: Non-functional oracles (P95 latency SLAs, zero arbitrary sleeps).

### Block 3: `<threat_scenarios> ... </threat_scenarios>` (Pillar T)
Must define adversarial scenarios identified with `THR-XX` codes:
*   Concurrency & double-click race conditions (`< 50ms` window).
*   Webhook/event idempotency under network retry storms.
*   Data trash, boundary payloads, and injection fuzzing (`HTTP 422` expected, never `HTTP 500`).
*   Stryker Mutation Testing threshold (`>= 85%` inside container sandbox).

### Block 4: `<exploratory_charters> ... </exploratory_charters>` (Pillar E)
Must define at least one time-boxed human exploratory mission (30–60 minutes) covering:
*   UX ergonomics and emotional trust.
*   WCAG 2.1 AA accessibility (keyboard-only + screen reader).
*   Real-world network/device interruptions.

---

## 3. Epistemic Provenance Tags (Context Isolation)

To prevent **Context Poisoning** (where an AI agent hallucinates a business rule and later treats its own assumption as ground truth), every discovered rule, transition, or invariant in a `*.mate-spec.md` or `docs/test-cases/TC-*.md` file must carry an **Epistemic Provenance Tag**:

*   **`[OBSERVED]`**: Empirically verified against live application behavior (`playwright-cli` session, network capture) or explicit source code/documentation.
*   **`[INFERRED]`**: Logically deduced from UI labels, HTTP status codes, or standard domain conventions, pending stakeholder confirmation.
*   **`[TBD]`**: Ambiguous, missing, or contradictory requirement. **AI agents are strictly forbidden from writing permanent automated assertions on `[TBD]` items** until resolved.

Audited automatically via `npx mate-sdt context [module]`.

---

## 4. Pragmatic Execution Mode Classification (`docs/test-cases/TC-*.md`)

Not every test case belongs in an automated E2E script. Every test case designed from a `*.mate-spec.md` or User Story must be classified into one of four **Execution Modes** with an explicit engineering rationale:

1.  **`[AUTOMATE_UI]`**: Deterministic, repeatable user journeys and critical DOM state transitions (`tests/e2e/<module>.spec.ts`).
2.  **`[AUTOMATE_API]`**: Fast boundary value analysis (BVA), combinatorial data permutations, schema validations, and HTTP status codes (`tests/api/<module>.spec.ts`).
3.  **`[MANUAL_TEST]`**: Scenarios where automation has negative ROI or requires human perception/physical hardware (e.g., visual print/PDF/email layout, physical camera/QR scanning, third-party CAPTCHA/SMS/OAuth gates, or one-off migrations). Documented with step-by-step instructions and an explicit *"Why Manual"* justification in `docs/test-cases/TC-<module>.md`.
4.  **`[EXPLORATORY_CHARTER]`**: Context-aware human exploratory testing missions (`tests/charters/CHR-*.md`) targeting complex UX heuristics and edge cases.

---

## 5. Provenance Hierarchy & Anti-Poisoning Rules

Every fact, selector, SLA, or invariant in `*.mate-spec.md` MUST obey the strict M.A.T.E. provenance trust hierarchy:

`[BOOTSTRAPPED] > [USER_EXPLICIT] > [OBSERVED | ISO-timestamp] > [INFERRED] / [TBD]`

- **Hard Gate (`GATE-01`):** `[INFERRED]` and `[TBD]` markers are strictly **forbidden** inside `<invariants>` blocks and generated Page/Component Objects (`src/pages/`, `src/components/`). Resolve uncertainties with the user or via live `@playwright/cli` observation before promoting to invariants.
- **No Secrets / PII:** Never embed real emails, JWTs, API keys, or session cookies inside specs or `MATE-PROJECT-MAP.md`.
