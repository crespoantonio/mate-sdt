---
name: mate-assert-api
description: >-
  Specialist in Pillar A (Assert - API & Contracts) of the M.A.T.E. Method. Translates OpenAPI/Swagger
  specifications and MATE-SPEC.md technical contracts into deterministic API & contract test suites using
  Playwright APIRequestContext or SuperTest with strict schema validation, OOP API Clients, and DIP fixtures.
---

# 🔌 Pillar A Skill: API & Contract Testing (`mate-assert-api`)

This skill is responsible for **Pillar A (Assert — API & Service Layer)** of the M.A.T.E. Method. Its purpose is to enforce strict API contracts, mathematical invariants, and HTTP status semantics before UI code even touches the backend.

> **CRITICAL RULE:** Always read `MATE-PROJECT-MAP.md` and the module's `specs/[module].mate-spec.md` before designing or generating API tests.

---

## 🏛️ SOLID & OOP Principles in API Testing

1.  **Single Responsibility Principle (SRP):**  
    - **Typed API Clients (`src/api/*.client.ts`)** encapsulate endpoint paths, headers, and HTTP verbs.
    - **Test Specs (`tests/api/*.spec.ts`)** focus strictly on invariant assertions, contract schemas, and state transitions—never raw URL string concatenation.
2.  **Dependency Inversion Principle (DIP):**  
    Inject authenticated `APIRequestContext` and domain API clients through Playwright fixtures (`src/fixtures/`).
3.  **Strict Contract & Schema Validation:**  
    Every response must be validated against its typed contract (TypeScript interfaces / Zod / JSON Schema). Cosmetics like `expect(res.status()).toBeDefined()` are strictly forbidden.

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
