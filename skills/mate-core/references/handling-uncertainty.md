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

## 3. Mark Unknowns Explicitly with `[TBD]`
When generating a draft specification (`status: DRAFT` or `status: REVIEW`) without complete information:
- Tag every gap clearly: `[TBD: needs confirmation from Product/Ops on X]`.
- Aggregate all open questions in a dedicated **Assumptions & Open Questions** section so reviewers can resolve them before flipping the spec status to `APPROVED`.

## 4. Document Evidence Confidence Levels
Whenever reverse-engineering Brownfield code, exploring a live web page (`mate-model`), or triaging test failures (`mate-triage`), label findings with their confidence level:
- **`[OBSERVED]` (High Confidence):** Directly verified via source code inspection, live Playwright browser interaction, or stack trace.
- **`[INFERRED]` (Medium Confidence):** Deduced from UI patterns, naming conventions, or adjacent modules, but requires human verification.
- **`[UNKNOWN / BLOCKED]`:** Could not be determined (e.g., requires production credentials or external third-party sandbox).
