# 🛡️ M.A.T.E. Handling Uncertainty & Anti-Hallucination Protocol

When modeling specifications, planning tests, or triaging failures, AI agents face incomplete requirements, undocumented legacy endpoints, or missing environment configs. Follow this protocol strictly to prevent hallucinated tests and false assumptions.

---

## 1. Never Assume Critical Contracts or SLAs
- **Do NOT guess** API schemas, HTTP status codes, authentication mechanisms, or database constraints.
- **Do NOT invent** performance SLAs (P95/P99 latency, RPS targets, or production VU limits).
- **Do NOT assume** a UI workflow works if it has not been observed or verified against source code.

## 2. Ask Targeted Questions First
When information is missing and the user is available:
- **Missing API Contract:** *"I could not find an OpenAPI/Swagger schema for `/api/orders`. Can you share the request/response payload or point me to the controller?"*
- **Missing Performance SLA:** *"What is the target P95 response time, maximum error rate, and peak Virtual Users (VUs) for this endpoint?"*
- **Ambiguous State Transition:** *"Can an order transition from `PICKED_UP` to `CANCELLED`, or is cancellation strictly forbidden after pickup?"*
- **Destructive Live Action:** *"Exploring this live page shows a 'Delete Account' button. Should I skip this interaction?"*

## 3. Mark Unknowns Explicitly with `[TBD]` & Escalate (`STATUS: BLOCKED_ON_USER_INPUT`)
When generating a draft specification (`status: DRAFT` or `status: REVIEW`) or test case matrix (`docs/test-cases/TC-*.md`) without complete information:
- Tag every gap clearly: `[TBD: <exact question for PO/Dev/QA>]`.
- Aggregate all open questions in a dedicated **`## Open Questions for Human QA`** section in `specs/*.mate-spec.md` and `docs/test-cases/TC-*.md`.
- **Complete Unblocked Work, Then HALT and Ask:** Finish modeling and automating the parts that are `[USER_EXPLICIT]` or `[OBSERVED]`, then immediately stop and present a numbered list of questions to the user.
- **Mechanical Gate Enforcement (`STATUS: BLOCKED_ON_USER_INPUT`):** `npx mate-sdt validate` and `npx mate-sdt gate` (`GATE-01` & `GATE-02`) mechanically block any `[TBD]` or `[INFERRED]` tag inside `<invariants>` or `<intent_model>` with `STATUS: BLOCKED_ON_USER_INPUT`, halting `npx mate-sdt gate --loop` on iteration 1 so the agent asks the human instead of hallucinating a workaround.

## 4. Document Evidence Confidence Levels & Provenance Hierarchy
Enforce strict epistemic provenance across all specs and memory (`[BOOTSTRAPPED] > [USER_EXPLICIT] > [OBSERVED | ISO-timestamp] > [INFERRED] / [TBD]`):
- **`[BOOTSTRAPPED]` / `[USER_EXPLICIT]` (Canonical Authority):** Explicitly stated by the human QA/PO or validated User Story.
- **`[OBSERVED | ISO-timestamp]` (Empirical Verification):** Directly verified via source code inspection, live `@playwright/cli` browser interaction, or stack trace.
- **`[INFERRED]` (Medium Confidence — Blocked in Invariants):** Deduced from UI patterns, naming conventions, or adjacent modules; requires human confirmation before entering `<invariants>` or Page Objects.
- **`[TBD: <question>]` (Unknown — Blocked in Invariants):** Missing requirement; must be escalated via `## Open Questions for Human QA`.
