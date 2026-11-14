# 🗺️ MATE-PROJECT-MAP (Living Architecture & QA Context Index)
<!-- Auto-updated: YYYY-MM-DD | Git Commit: [git-hash] | Status: GREENFIELD / BROWNFIELD -->

This living document is the **single source of truth** for AI coding agents and Quality Engineers. It merges M.A.T.E. specification governance with project conventions, reusable components, execution commands, and agent guardrails to prevent full-repository context saturation and pattern drift.

> **CRITICAL AGENT RULE:** Every agent MUST read `MATE-PROJECT-MAP.md` before planning, generating, refactoring, or triaging any test or specification.

---

## 1. Project Identity & Technical Stack

- **Primary Language:** `TypeScript` *(or Java / Python — see stack references)*
- **UI / E2E Framework:** `Playwright (@playwright/test)`
- **API / Contract Framework:** `Playwright APIRequestContext / SuperTest`
- **Performance / NFR Engine:** `Grafana k6 (via rootless Podman)`
- **Mutation Testing Engine:** `Stryker Mutator (via rootless Podman, threshold >= 85%)`
- **Environments:**
  - `local / dev`: `http://localhost:3000` (Max k6 VUs: `50`)
  - `staging`: `https://staging.example.com` (Max k6 VUs: `500`)

---

## 2. System Modules and Specifications

| Module Name | Specification File | Status | Key State Machine | Page Object / API Client |
| :--- | :--- | :---: | :--- | :--- |
| **Example Module** | `./specs/sample-order-lifecycle.mate-spec.md` | `APPROVED` | `DRAFT -> CONFIRMED -> PICKED_UP -> IN_WASH -> READY -> DELIVERED` | `./src/pages/base.page.ts` |

---

## 3. System Invariants (Sacred Rules)

Non-negotiable mathematical and business rules that must never be violated under any state transition:

- **`INV-01`**: Order garment count must be strictly greater than zero (`tests/e2e/orders.spec.ts:15`)
- **`INV-02`**: Payment webhook processing must be strictly idempotent (`tests/threats/idempotency.spec.ts:28`)
- **`ORA-PERF`**: Checkout API P95 latency <= `400ms` at `200 RPS` (`tests/nfr/checkout.k6.js`)

---

## 4. Injectable Fixtures, Page Objects & Reusable Components (SOLID / DIP)

- **`BasePage`** (`./src/pages/base.page.ts`): Abstract base class enforcing zero arbitrary sleeps and locator-based assertions.
- **`NotificationToastComponent`** (`./src/components/notification-toast.component.ts`): Reusable alert/toast component object.
- **`authenticatedSession`** (`./src/fixtures/mate.fixtures.ts`): Pre-authenticated context fixture bypassing UI login overhead.

---

## 5. Naming Conventions & Agent Guardrails (`MUST` / `MUST NOT`)

### ✅ Agents MUST Follow:
- **Specs First:** Never generate test automation without an approved or reviewable `specs/[module].mate-spec.md`.
- **Sessions vs. Memory:** Keep ephemeral flow logs in `.mate/sessions/` & `.mate/scratchpad-*.md`; promote verified facts via `npx mate-sdt context <module> --consolidate`.
- **Provenance Hierarchy:** Enforce `[BOOTSTRAPPED] > [USER_EXPLICIT] > [OBSERVED | ISO-timestamp] > [INFERRED] / [TBD]`. Never place `[INFERRED]` or `[TBD]` inside `<invariants>` or Page/Component Objects.
- **Dependency Inversion (DIP):** Inject Page Objects and API clients via fixtures (`test.extend()`).
- **Semantic Locators:** Prioritize `getByRole`, `getByLabel`, `getByTestId`.
- **Handling Uncertainty:** Never guess SLAs, auth flows, or undocumented business rules. Ask the user or mark `[TBD: needs clarification on X]` with confidence level (`Observed` vs. `Inferred`).

### ⛔ Agents MUST NOT Do:
- **Zero Arbitrary Sleeps:** Never use `page.waitForTimeout()`, `Thread.sleep()`, or `time.sleep()`.
- **No Direct Instantiation in Tests:** Do not scatter `new SomePage(page)` across test bodies when a fixture exists.
- **No Cosmetic Assertions:** Never write `expect(res).toBeDefined()` without validating schema and business invariants.

---

## 6. Execution Commands Reference

| Operation | Command |
| :--- | :--- |
| **Assemble 3-Bucket JIT Context Pack** | `npx mate-sdt context <module> [--compact] [--consolidate]` |
| **Manage Session & Black-Box Handoffs** | `npx mate-sdt session <start|event|advance|list|prune>` |
| **Validate M.A.T.E. Specs** | `npx mate-sdt validate` |
| **Audit Test Suite Health (A–F)** | `npx mate-sdt audit` |
| **Run E2E & API Tests** | `npx playwright test` |
| **Run P0 Smoke Invariants** | `npx playwright test --grep @p0` |
| **Run Mutation Suite (Podman)** | `npx mate-sdt mutate` |
| **Run k6 Performance Suite (Podman)** | `npx mate-sdt k6 tests/nfr/load.k6.js` |
| **Create Exploratory Charter** | `npx mate-sdt charter <module>` |
| **Create Bug Report** | `npx mate-sdt bug <module>` |
| **Create Release Waiver** | `npx mate-sdt waiver <module>` |

---

## 7. Current Quality Status, Gaps & Release Governance

- **Latest Release Verdict:** `[PASS]` | Sprint: `Sprint-01` | Date: `YYYY-MM-DD`
- **Test Suite Health Score:** `A` (verified via `npx mate-sdt audit`)
- **Mutation Testing Score:** `87.5%` (Stryker Mutator via Podman, threshold `>= 85%`)
- **Active Release Waivers:** `None` (`./specs/waivers/`)
- **Identified Gaps & Flakiness Radar:**
  - *None recorded yet. (`mate-triage` and `mate-maintenance` append discovered gaps here).*

<!-- MATE-MEMORY:global:START -->
<!-- Canonical consolidated memory entries promoted via `npx mate-sdt context --consolidate` -->
<!-- MATE-MEMORY:global:END -->
