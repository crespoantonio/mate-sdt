---
name: mate-flow-api-contract
description: >-
  End-to-End M.A.T.E. API & Contract Testing Workflow: Transforms OpenAPI/Swagger schemas
  or backend routes into a validated MATE-SPEC.md, generates typed SOLID API Clients,
  and executes contract, authz, idempotency, and payload fuzzing suites.
---

# 🔌 E2E Workflow: API Contract & Fuzzing Suite (`/mate-flow-api-contract`)

Execute this workflow to establish comprehensive API and service-level quality governance.

---

## Step 1: Contract Ingestion & Uncertainty Check (`mate-model`)
1. Read `MATE-PROJECT-MAP.md`.
2. Ingest the OpenAPI/Swagger specification (`openapi.yaml` / `swagger.json`) or backend route definitions.
3. If auth mechanisms, rate limits, or enum constraints are missing, apply the **Handling Uncertainty Protocol** and ask the user or mark `[TBD]`.

## Step 2: Author & Validate the Contract Spec (`mate-model`)
1. Create or update `specs/[service].mate-spec.md` defining:
   - Entity state transitions and **Explicitly Forbidden Transitions** (`409 Conflict` / `422`).
   - Strict JSON request/response contracts.
   - Mathematical invariants (`INV-XX`) and idempotency/fuzzing threats (`THR-XX`).
2. Run `npx mate-sdt validate specs/[service].mate-spec.md`.

## Step 3: Build Typed API Clients & Contract Matrix (`mate-assert-api`)
1. Create a typed API Client in `src/api/[service].client.ts` extending `BaseApiClient`.
2. Register the client as an injectable fixture in `src/fixtures/`.
3. Generate contract tests in `tests/api/[service].spec.ts` covering:
   - `200/201` schema compliance
   - `400/422` missing required fields & boundary violations
   - `401/403` authentication & BOLA authorization checks
   - `409/422` forbidden state machine transitions

## Step 4: Adversarial API Fuzzing & Idempotency (`mate-threat`)
1. Generate concurrency and duplicate `Idempotency-Key` replay tests in `tests/threats/[service]-threats.spec.ts`.
2. Inject malformed UTF-8, oversized payloads, and SQLi/XSS strings, asserting clean `422` responses and zero `500` stack-trace leaks.
3. Run `npx mate-sdt audit` to verify suite health.
