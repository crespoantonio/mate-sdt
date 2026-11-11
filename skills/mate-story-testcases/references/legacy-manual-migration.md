# Legacy Manual Test Suite Audit, Deduplication & Migration Guide

How to help a QA team that already has **hundreds of manual test cases** (in Excel `.xlsx`/`.csv`, Jira Xray/Zephyr, TestRail, or Notion) transition to M.A.T.E. Spec-Driven Testing without automating low-value bloat.

---

## 1. Why 1:1 Blind Automation of Manual Suites Fails

Manual test repositories accumulated over years typically suffer from:
- **Massive Duplication:** 15 manual cases repeating the exact same 8 login and navigation steps just to check 1 different dropdown value.
- **Wrong Test Pyramid Layer:** Testing 25 field-validation permutations through slow UI E2E tests instead of fast API contract tests (`tests/api/`).
- **Missing Border & Forbidden State Coverage:** Hundreds of happy-path variations, but zero concurrency, idempotency, or forbidden state transition checks.
- **Obsolete Steps:** Steps referencing UI buttons or flows that changed 6 months ago.

---

## 2. The 4-Step M.A.T.E. Manual Suite Migration Protocol

### Step 1: Ingest & Group by Business Domain
Read the legacy Excel/CSV file or fetch the test repository via MCP. Group all test cases by business module (e.g., `auth`, `checkout`, `inventory`).

### Step 2: Classify Every Legacy Test Case into the 5 ROI Buckets

| Bucket | Target M.A.T.E. Layer | Criteria | Action |
| :--- | :--- | :--- | :--- |
| **Bucket 1: `@smoke @p0` (UI E2E)** | `tests/e2e/` | Critical revenue/survival user journeys (typically 10–15% of manual cases) | Automate first in **Wave 1** (`mate-pw-codegen`). |
| **Bucket 2: `@api` (Shift-Left to API)** | `tests/api/` | Input validations, data permutations, role permissions, status codes (typically 40–50% of manual cases) | Convert into fast API tests via `mate-assert-api` (runs in milliseconds instead of minutes). |
| **Bucket 3: `@e2e @border` (UI State & Edge)** | `tests/e2e/` | UI-specific state transitions, error banners, modal interactions | Automate in **Wave 2** alongside missing border cases. |
| **Bucket 4: `@charter` (Human Exploratory)** | `tests/charters/` | Subjective UX, visual layout, complex hardware/network interruptions | Consolidate into 30–60 min SBTM charters (`mate-explore`). |
| **Bucket 5: `DUPLICATE / OBSOLETE`** | Archive | Redundant steps already covered by another test or outdated UI | Merge or retire; document in the migration summary. |

### Step 3: Gap Analysis (Add Missing M.A.T.E. Quadrants)
Inspect the migrated cases against M.A.T.E.'s 4 quadrants (`HAPPY_PATH`, `BORDER_CASE`, `NEGATIVE_PATH`, `STATE_TRANSITION`). Add any missing boundary values or **Explicit Forbidden Transitions** that the legacy manual suite missed.

### Step 4: Output Clean M.A.T.E. Artifacts
1. Generate `specs/[module].mate-spec.md` synthesizing the business rules and invariants.
2. Output the clean, deduplicated matrix in `tests/cases/TC-[module].md` and `tests/cases/TC-[module].csv` (with a `Migration_Source_ID` reference so traceability to old Jira/Excel IDs is 100% preserved).
