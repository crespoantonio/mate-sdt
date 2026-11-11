---
name: mate-core
description: >-
  Master methodology of Spec-Driven Testing (SDT) M.A.T.E. created by Tony Crespo (Un Junior En Apuros).
  Governs the quality lifecycle in both Greenfield and Brownfield projects across all 9 M.A.T.E. skills
  and 5 E2E workflows, enforcing OOP/SOLID principles, Living Documentation (MATE-PROJECT-MAP.md),
  and the Handling Uncertainty Protocol.
---

# 🧉 Master Skill: M.A.T.E. Core (`mate-core`)

This skill serves as the operational engine of the **M.A.T.E. Method** (*Spec-Driven Testing Framework*).  
Its purpose is to ensure that any software project (from a greenfield startup to an inherited enterprise repository) implements a quality architecture that is **scalable, Object-Oriented (OOP), adheres to SOLID principles, and is optimized for AI consumption without context window saturation**.

---

## 🎯 The 4 Core Operational Objectives of `mate-core`

1.  **AI-Friendly Architecture with Living Documentation (`MATE-PROJECT-MAP.md`):**  
    Prevent LLMs from burning 100k+ tokens reading the entire repository. Maintain an up-to-date living index in the root directory that maps project stack, naming conventions, business modules, specs, invariants, injectable fixtures, execution commands, and quality gaps.
2.  **Object-Oriented Design and SOLID Principles in Testing:**  
    - **Single Responsibility (SRP):** Atomic Page Objects, dedicated Component Objects, and typed API Clients.
    - **Open/Closed (OCP):** Extensible base classes and fixtures that allow extending behavior without modifying existing code.
    - **Liskov Substitution (LSP):** Base page abstractions and API clients must be substitutable by their derivatives without breaking test contracts.
    - **Interface Segregation (ISP):** Lean, specific interfaces for test data and contract models (zero `any` types).
    - **Dependency Inversion (DIP):** Dependency injection via Playwright fixtures (`test.extend()`) rather than hard-coupled `new PageObject(page)` instantiation inside test files.
3.  **Strict Handling Uncertainty Protocol:**  
    - **Never Assume:** Do not invent SLAs, authentication flows, or undocumented business rules.
    - **Ask First or Mark `[TBD]`:** When critical context is missing, ask targeted clarifying questions or mark `[TBD: needs input on X]` with explicit confidence levels (`Observed` vs. `Inferred`). See [`references/handling-uncertainty.md`](./references/handling-uncertainty.md).
4.  **Full Lifecycle Governance (Greenfield, Brownfield & Day-2 Operations):**  
    Orchestrates the **9 M.A.T.E. Skills** and **5 End-to-End Workflows** from initial intent modeling through post-execution failure triage and test suite maintenance.

---

## 🧩 The 9 M.A.T.E. Skills Ecosystem

| Skill | Pillar / Phase | Core Responsibility |
| :--- | :--- | :--- |
| **`mate-core`** | **Orchestrator** | Living Architecture Map (`MATE-PROJECT-MAP.md`), SOLID rules, uncertainty protocol, polyglot references. |
| **`mate-model`** | **Pillar M (Model)** | Authors `specs/*.mate-spec.md`, Finite State Machines, **Explicit Forbidden Transitions**, and Live Page Reconnaissance (`page-explorer`). |
| **`mate-assert-playwright`** | **Pillar A (Assert - UI)** | SOLID Playwright UI automation (`BasePage`, `ComponentObject`, DIP fixtures, zero arbitrary sleeps). |
| **`mate-assert-api`** | **Pillar A (Assert - API)** | Contract-driven API testing from OpenAPI/Swagger, schema validation, auth & status matrices. |
| **`mate-threat`** | **Pillar T (Threat & Trash)** | Concurrency, race conditions, idempotency, payload fuzzing, and Stryker Mutation (`>= 85%`) in Podman. |
| **`mate-performance-k6`** | **Pillar A/T (NFR - k6)** | Translates `<performance_oracles>` SLAs into k6 load/stress/spike scripts executed in rootless Podman. |
| **`mate-explore`** | **Pillar E (Explore)** | Human Session-Based Test Management (SBTM) charters, WCAG 2.1 AA audits, Release Waivers, and Release Verdict. |
| **`mate-triage`** | **Day-2 Operations** | Triages CI failures (Bug vs. Flaky vs. Env vs. Data), detects flakiness, and generates spec-linked Bug Reports. |
| **`mate-maintenance`** | **Day-2 Operations** | Audits test codebase health (`A`–`F`), detects `waitForTimeout`/sleeps, duplication, and DIP violations. |

---

## 🗺️ M.A.T.E. AI-Friendly Directory Layout

```text
project-root/
├── MATE-PROJECT-MAP.md          <-- [CRITICAL] Living architecture & QA context index
├── specs/                       <-- M.A.T.E. specifications & release waivers
│   ├── TEMPLATE_MATE_SPEC.md
│   ├── waivers/                 <-- Formal Release Waivers (WVR-*.md)
│   └── [module].mate-spec.md
├── tests/
│   ├── e2e/                     <-- P0/P1 end-to-end UI workflows
│   ├── api/                     <-- Contract and API integration tests
│   ├── threats/                 <-- Concurrency, race conditions, idempotency, fuzzing
│   ├── nfr/                     <-- Performance (k6) and resilience scripts (*.k6.js)
│   ├── charters/                <-- Human exploratory testing sessions (CHR-*.md)
│   └── bugs/                    <-- Structured bug reports linked to invariants (BUG-*.md)
├── src/
│   ├── pages/                   <-- Page Object Model (OOP / SOLID)
│   ├── components/              <-- Reusable UI Component Objects
│   ├── api/                     <-- Typed API Clients & Request Builders
│   ├── fixtures/                <-- Dependency Inversion (DIP) fixtures
│   └── models/                  <-- Strict TypeScript types and schemas
└── stryker.config.json          <-- Mutation testing governance (>=85% threshold)
```

---

## 🔒 Agent Permissions Matrix on `MATE-PROJECT-MAP.md`

| Skill / Agent | Read First | Create / Update Sections |
| :--- | :---: | :--- |
| **`mate-core` / `mate-model`** | ✅ Mandatory | Creates file; updates *System Modules*, *Invariants*, and *Stack*. |
| **`mate-assert-playwright` / `mate-assert-api`** | ✅ Mandatory | Updates *Injectable Fixtures, Page Objects & API Clients*. |
| **`mate-threat` / `mate-performance-k6`** | ✅ Mandatory | Updates *Mutation Score* and *NFR Oracles Status*. |
| **`mate-explore`** | ✅ Mandatory | Updates *Latest Release Verdict* and *Active Release Waivers*. |
| **`mate-triage` / `mate-maintenance`** | ✅ Mandatory | Updates *Test Suite Health Score* and *Identified Gaps & Flakiness Radar*. |

---

## ⚡ CLI Commands & Reference Resources

- **Interactive Installer:** `npx mate-sdt install`
- **Validate Specs:** `npx mate-sdt validate`
- **Audit Test Suite Health (`A`–`F`):** `npx mate-sdt audit`
- **Run Podman Mutation (`>=85%`):** `npx mate-sdt mutate`
- **Run Podman k6 Performance:** `npx mate-sdt k6 tests/nfr/load.k6.js`
- **Generate Charter / Bug / Waiver:** `npx mate-sdt charter <mod>` | `npx mate-sdt bug <mod>` | `npx mate-sdt waiver <mod>`
- **References:**
  - [`resources/MATE-PROJECT-MAP.template.md`](./resources/MATE-PROJECT-MAP.template.md)
  - [`references/handling-uncertainty.md`](./references/handling-uncertainty.md)
  - [`references/polyglot-stacks-java-python.md`](./references/polyglot-stacks-java-python.md)
