# 🗺️ MATE-PROJECT-MAP (Living Architecture Index)
<!-- Auto-updated: YYYY-MM-DD | Git Commit: [git-hash] -->

This living document indexes system specifications, business invariants, architectural fixtures, and quality metrics to allow AI agents and engineers to navigate the codebase without full-repository context saturation.

---

## 1. System Modules and Specifications

| Module Name | Specification File | Status | Key State Machine | Page Object / Component |
| :--- | :--- | :---: | :--- | :--- |
| **Example Module** | `./specs/example.mate-spec.md` | `APPROVED` | `INIT -> IN_PROGRESS -> COMPLETED` | `./src/pages/example.page.ts` |

---

## 2. System Invariants (Sacred Rules)

Non-negotiable rules that must never be broken under any operational circumstance:

- **`INV-01`**: [Describe rule, e.g., Order item count must be strictly greater than zero] (`tests/e2e/example.spec.ts:15`)
- **`INV-02`**: [Describe rule, e.g., Payment webhook processing must be strictly idempotent] (`tests/threats/idempotency.spec.ts:28`)

---

## 3. Injectable Fixtures and Test Services (Dependency Inversion)

Modular fixtures injected into tests via Playwright's `test.extend()`:

- **`authenticatedUser`**: Supplies pre-authenticated session state bypassing UI login (`tests/fixtures/auth.fixture.ts`).
- **`ephemeralDb`**: Provisions or resets isolated database state per test suite (`tests/fixtures/db.fixture.ts`).

---

## 4. Current Quality Status and Release Governance

- **Latest Release Verdict:** `[PASS]` | Sprint: `Sprint-X` | Date: `YYYY-MM-DD`
- **Mutation Testing Score:** `87.5%` (Stryker Mutator via Podman, threshold >= 85%)
- **Active Release Waivers:** `None`
- **Exploratory Charters Log:** `./tests/charters/`
