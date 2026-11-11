# 📋 M.A.T.E. Test Case Matrix: [Module Name]

* **Source User Story / Ticket:** `[e.g., JIRA-101 / Notion PRD / Local Spec]`
* **Linked M.A.T.E. Specification:** `specs/[module].mate-spec.md`
* **Date:** `YYYY-MM-DD`
* **Coverage Summary:** `[X] Total Cases ([A] Happy Path | [B] Border Cases | [C] Negative Paths | [D] State/Concurrency)`
* **Execution Summary:** `[P] PASS | [F] FAIL (Known Bugs Kept in Suite with test.fail)`

---

## 1. Acceptance Criteria Traceability

| AC ID | User Story Acceptance Criterion | Linked Spec Invariant | Covered By Test Cases |
| :--- | :--- | :--- | :--- |
| **AC-01** | [Describe AC-01 from User Story] | `INV-01` | `TC-01`, `TC-02`, `TC-05` |
| **AC-02** | [Describe AC-02 from User Story] | `INV-02` | `TC-03`, `TC-04`, `TC-06` |

---

## 2. Complete Test Case Matrix (Happy + Border + Negative + State)

| TC ID | Category | Priority | Title | Preconditions | Test Steps | Expected Result (Oracle) | Live CLI Check | Automated Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | `HAPPY_PATH` | `@p0` | [Valid end-to-end flow] | User authenticated; item in stock | 1. Open page<br>2. Fill valid data<br>3. Submit | Status transitions to `CONFIRMED`; total matches formula [`INV-01`] | ✅ PASS | ✅ Automated (`PASS`) |
| **TC-02** | `BORDER_CASE` | `@p1` | [Boundary: Min/Max value or special chars] | User authenticated | 1. Enter boundary value (`0`, `MAX`, Unicode)<br>2. Submit | System handles boundary deterministically without precision loss [`INV-02`] | ✅ PASS | ✅ Automated (`PASS`) |
| **TC-03** | `BORDER_CASE` | `@p1` | [Boundary: Maximum discount / edge threshold] | Cart with $100 subtotal | 1. Apply 100% discount coupon | Total equals `$0.00` (never negative) [`INV-01`] | ❌ FAIL (`BUG-01`) | ⚠️ Automated (`test.fail()` — `BUG-01`) |
| **TC-04** | `NEGATIVE_PATH` | `@p0` | [Invalid input / missing required field] | User on form | 1. Leave required field blank or invalid<br>2. Click Submit | Inline `role="alert"` error displayed; `POST` request blocked [`INV-03`] | ✅ PASS | ✅ Automated (`PASS`) |
| **TC-05** | `STATE_TRANSITION` | `@p0` | [Forbidden Transition / Double Submit] | Order in `PENDING` state | 1. Double-click Submit rapidly | Exactly 1 order created; second request rejected [`Forbidden Transition`] | ✅ PASS | ✅ Automated (`PASS`) |

---

## 3. Discovered Bugs & Failing Tests Report (Anti-Greenwashing Log)

> **M.A.T.E. Rule:** Every test case above that failed during live verification or automated execution is **kept in the automated test suite** with its real assertion intact, annotated with `test.fail()`, and linked to a bug report below.

| Bug ID | Failing TC ID | Violated AC / Invariant | Expected Behavior | Actual Behavior Observed | Automated Spec Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BUG-YYYYMMDD-01` | `TC-03` | `AC-02` / `INV-01` | Order total floors at `$0.00` | UI displays `-$5.00` and API returns `500` | `tests/e2e/[module].spec.ts` (`test.fail`) |
