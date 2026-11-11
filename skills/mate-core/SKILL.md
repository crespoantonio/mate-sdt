---
name: mate-core
description: >-
  Master methodology of Spec-Driven Testing (SDT) M.A.T.E. created by Tony Crespo (Un Junior En Apuros).
  Governs the quality lifecycle in both Greenfield and Brownfield projects, enforcing OOP and SOLID
  principles in testing, AI-friendly architecture with Living Documentation (MATE-PROJECT-MAP.md),
  and orchestration across the 4 pillars: Model, Assert, Threat, and Explore.
---

# 🧉 Master Skill: M.A.T.E. Core (`mate-core`)

This skill serves as the operational engine of the **M.A.T.E. Method** (*Spec-Driven Testing Framework*).  
Its purpose is to ensure that any software project (from a greenfield startup to an inherited enterprise repository) implements a quality architecture that is **scalable, Object-Oriented (OOP), adheres to SOLID principles, and is optimized for AI consumption without context window saturation**.

---

## 🎯 The 3 Core Operational Objectives of `mate-core`

1.  **AI-Friendly Architecture with Living Documentation:**  
    Prevent LLMs from burning 100k+ tokens reading the entire repository to understand testing targets. Maintain an up-to-date living index (`MATE-PROJECT-MAP.md`) in the root directory that maps business modules, contracts, Page Objects, invariants, and quality status.
2.  **Object-Oriented Design and SOLID Principles in Testing:**  
    - **Single Responsibility (SRP):** Atomic Page Objects and dedicated Component Objects (a button does not validate payments; a form does not issue raw HTTP requests).
    - **Open/Closed (OCP):** Extensible Playwright base classes and fixtures that allow extending behavior without modifying existing code.
    - **Liskov Substitution (LSP):** Base page abstractions and API clients must be substitutable by their derivatives without breaking test contracts.
    - **Interface Segregation (ISP):** Lean, specific interfaces for test data and contract models (no bloated god-objects).
    - **Dependency Inversion (DIP):** Dependency injection via Playwright fixtures (`page`, `request`, custom authenticated contexts) rather than tight instantiation.
3.  **Greenfield vs. Brownfield Lifecycle Governance:**  
    - **Greenfield:** The M.A.T.E. spec is co-designed and locked *before* application source code is written; dev agents build against the spec until all assertions pass.
    - **Brownfield:** Performs reverse-engineering scans on legacy code to infer state machines, map contracts, and freeze invariants before refactoring.

---

## 🗺️ M.A.T.E. AI-Friendly Directory Layout

Every project governed by M.A.T.E. must follow a layout where an AI agent only needs to read the specific file it is working on:

```text
project-root/
├── MATE-PROJECT-MAP.md          <-- [CRITICAL] Living architecture index for AIs & humans
├── specs/                       <-- M.A.T.E. specifications
│   ├── TEMPLATE_MATE_SPEC.md
│   ├── waivers/                 <-- Formal Release Waivers (when verdict is CONCERNS)
│   └── [module].mate-spec.md
├── tests/
│   ├── e2e/                     <-- P0/P1 end-to-end customer workflows
│   ├── api/                     <-- Contract and API integration tests
│   ├── threats/                 <-- Adversarial, concurrency, race conditions, fuzzing
│   ├── charters/                <-- Human exploratory testing sessions (SBTM)
│   └── nfr/                     <-- Performance (k6) and resilience tests
├── src/ (or tests/support/)
│   ├── pages/                   <-- Page Object Model (OOP / SOLID)
│   ├── components/              <-- Reusable Component Objects
│   ├── fixtures/                <-- Dependency Inversion (DIP) fixtures
│   └── models/                  <-- TypeScript types and interfaces
└── stryker.config.json          <-- Mutation testing governance (>=85% threshold)
```

### ⚡ CLI & Scaffolding Resources
- **CLI Interactive Installer:** `npx mate-sdt install`
- **Quick Project Scaffolding:** `npx mate-sdt init` (or execute [`scripts/init_mate_project.py`](./scripts/init_mate_project.py))
- **Project Compliance Audit:** `npx mate-sdt status`
- **Reference Template:** [`resources/MATE-PROJECT-MAP.template.md`](./resources/MATE-PROJECT-MAP.template.md)

---

## 📄 The Critical File: `MATE-PROJECT-MAP.md` (Living Documentation)

To prevent AI hallucination and massive token consumption, `mate-core` creates and continuously maintains this document in the root directory:

```markdown
# 🗺️ MATE-PROJECT-MAP (Living Architecture Index)
<!-- Auto-updated: [Timestamp] | Git Commit: [hash] -->

## 1. System Modules and Specs
- **Module Laundry Orders:** Spec at `./specs/laundry-orders.mate-spec.md`
  - *Status:* APPROVED
  - *Finite State Machine:* `PENDING -> PICKED_UP -> WASHING -> READY -> DELIVERED`
  - *Page Object:* `./src/pages/laundry-order.page.ts`

## 2. Invariants (Non-Negotiable Rules)
- `INV-01`: Garment count strictly > 0 (`tests/e2e/orders.spec.ts:18`)
- `INV-02`: Payment idempotency under duplicate webhooks (`tests/threats/idempotency.spec.ts:34`)

## 3. Injectable Fixtures and Services
- `authenticatedUser`: Pre-seeded authenticated session fixture bypassing UI (`src/fixtures/auth.fixture.ts`)
- `cleanDatabase`: Ephemeral container hook restoring state (`src/fixtures/db.fixture.ts`)

## 4. Current Quality Status
- *Mutation Score:* 88% (Stryker Mutator)
- *Last Release Verdict:* PASS (Sprint 14)
```

---

## 🔄 Operational Strategy: Greenfield vs. Brownfield

### Greenfield Mode (From Scratch)
1.  **Invoke `mate-model`:** Co-design `specs/[module].mate-spec.md` with the Product Owner or user before writing code.
2.  **Validate Spec:** Run `npx mate-sdt validate` to verify structural compliance and explicit forbidden transitions.
3.  **Invoke `mate-assert-playwright`:** Generate SOLID Page Objects and invariant assertions before production code exists.
4.  **Generate Code:** Dev agents build application features until the automated pipeline turns green.
5.  **Invoke `mate-threat`:** Subject the codebase to mutation testing (`npx mate-sdt mutate`) and fuzzing in Podman containers.
6.  **Invoke `mate-explore`:** Human Quality Engineer executes the charter (`npx mate-sdt charter <module>`) for ergonomic and accessibility validation.

### Brownfield Mode (Legacy / Existing Codebase)
1.  **Surface Scan:** Read routing tables, OpenAPI/Swagger schemas, and database types.
2.  **Reverse Spec Generation:** Generate a draft `specs/[module].mate-spec.md` with inferred state machines and invariants with status `REVIEW`.
3.  **Create `MATE-PROJECT-MAP.md`:** Index the existing codebase so AI agents understand system boundaries without hallucinations.
4.  **Identify Quality Gaps:** Highlight hidden coupling, SOLID violations, and blind spots with zero test coverage.
5.  **Freeze Invariants:** Automate P0 blocker regression suites before allowing any legacy refactoring.
