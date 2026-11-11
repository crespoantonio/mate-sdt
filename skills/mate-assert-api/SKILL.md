---
name: mate-assert-api
description: >-
  Specialist in Pillar A (Assert - API & Contracts) of the M.A.T.E. Method.
  USE WHEN: Designing or automating REST/GraphQL API and contract test suites from OpenAPI/Swagger or
  `specs/*.mate-spec.md`, building typed `BaseApiClient` classes in `src/api/`, validating schemas, testing
  HTTP status matrices (`2xx`, `400/422`, `401/403` BOLA, `409` Forbidden Transitions), or enforcing the
  Anti-Greenwashing Mandate on failing backend endpoints.
  SYNERGY: Receives contracts and test cases from `mate-model` and `mate-story-testcases`, pairs with
  `mate-threat` for API fuzzing/idempotency, and hands off discovered backend defects to `mate-triage`.
---

# 🔌 Pillar A Skill: API & Contract Testing (`mate-assert-api`)

This skill is responsible for **Pillar A (Assert — API & Service Layer)** of the M.A.T.E. Method. Its purpose is to enforce strict API contracts, mathematical invariants, and HTTP status semantics before UI code even touches the backend.

> **CRITICAL RULE:** Always read `MATE-PROJECT-MAP.md` and the module's `specs/[module].mate-spec.md` before designing or generating API tests.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-story-testcases` & `mate-model`** | Provides the endpoint contracts, `<intent_model>` Forbidden Transitions, and 4-quadrant Test Cases (`HAPPY_PATH`, `BORDER_CASE`, `NEGATIVE_PATH`, `STATE_TRANSITION`). |
| **Companion (UI Mocks)** | **`mate-pw-codegen`** | Shares strict response schemas (`src/models/`) so UI network mocks (`src/mocks/`) never drift from real backend API contracts. |
| **Downstream (Chaos)** | **`mate-threat` & `mate-performance-k6`** | Reuses typed API endpoints for concurrent race-condition suites (`tests/threats/`) and Grafana k6 load scripts (`tests/nfr/`). |
| **Downstream (Defects)** | **`mate-triage`** | When an endpoint violates its contract or returns `500` on a border/negative case, marks the test with `test.fail(true, 'BUG-XXX')` and files `tests/bugs/BUG-*.md`. |

---

## 🏛️ SOLID & OOP Principles in API Testing

1.  **Single Responsibility Principle (SRP):**  
    - **Typed API Clients (`src/api/*.client.ts`)** extend `BaseApiClient` and encapsulate endpoint paths, headers, and HTTP verbs.
    - **Test Specs (`tests/api/*.spec.ts`)** focus strictly on invariant assertions, contract schemas, and state transitions—never raw URL string concatenation.
2.  **Dependency Inversion Principle (DIP):**  
    Inject authenticated `APIRequestContext` and domain API clients through Playwright fixtures (`src/fixtures/`).
3.  **Strict Contract & Schema Validation (Anti-Greenwashing):**  
    Every response must be validated against its typed contract (TypeScript interfaces / Zod / JSON Schema). Cosmetics like `expect(res.status()).toBeDefined()` are strictly forbidden. If an endpoint fails a valid contract or border test, **keep the test**, annotate with `test.fail(true, 'BUG-XXX')`, and report the defect via `npx mate-sdt bug`.

---

## 📊 M.A.T.E. Contract-to-Test Matrix (OpenAPI / Swagger Mapping)

For every endpoint defined in `<intent_model>` or OpenAPI/Swagger, generate deterministic coverage across these dimensions:

| Contract Element | Required Test Scenarios | Priority & Tag |
| :--- | :--- | :---: |
| **Happy Path & Schema** | Valid payload ➔ `200/201`, response matches strict schema (`additionalProperties: false`) | `P0` (`@p0`, `@contract`) |
| **Forbidden State Transitions** | Attempt illegal transition from `MATE-SPEC.md` ➔ Must reject with `409 Conflict` or `422` | `P0` (`@p0`, `@fsm`) |
| **Required Fields** | Omit each required field ➔ `400/422` with explicit field-level validation error | `P1` (`@negative`) |
| **Boundary & Type Constraints** | Min/max numeric bounds, string length limits, invalid enum values ➔ `400/422` | `P1` (`@boundary`) |
| **Authentication & Authz (BOLA)** | Missing/expired token ➔ `401`; accessing another tenant's resource ID ➔ `403/404` | `P0` (`@security`) |
| **Idempotency** | Replay identical `POST/PATCH` with same `Idempotency-Key` ➔ single side effect | `P0` (`@idempotency`) |

---

## 📦 Reference Boilerplates & Polyglot Support

*   **Typed Base API Client (Playwright TS):** [`resources/base-api-client.template.ts`](./resources/base-api-client.template.ts)
*   **Java (RestAssured) & Python (Pytest + Requests/HTTPX):** Consult [`../mate-core/references/polyglot-stacks-java-python.md`](../mate-core/references/polyglot-stacks-java-python.md).
