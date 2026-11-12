# 📋 M.A.T.E. QA Companion & Test Case Matrix: [Module Name]

* **Source User Story / Ticket:** `[e.g., JIRA-101 / Notion PRD / Local Spec]`
* **Linked M.A.T.E. Specification:** `specs/[module].mate-spec.md`
* **Date:** `YYYY-MM-DD`
* **Coverage Summary:** `[X] Total Cases ([A] Happy Path | [B] Border Cases | [C] Negative Paths | [D] State/Concurrency)`
* **Execution Split:** `[U] Automate UI | [I] Automate API | [M] Manual Execution | [E] Exploratory Charters`
* **Execution Status:** `[P] PASS | [F] FAIL (Known Bugs Kept in Suite with test.fail)`

---

## 1. Acceptance Criteria Traceability

| AC ID | User Story Acceptance Criterion | Linked Spec Invariant | Covered By Test Cases | Recommended Execution Mix |
| :--- | :--- | :--- | :--- | :--- |
| **AC-01** | [Describe AC-01 from User Story] | `INV-01` | `TC-01`, `TC-02`, `TC-05`, `TC-06` | `AUTOMATE_UI` + `MANUAL_TEST` |
| **AC-02** | [Describe AC-02 from User Story] | `INV-02` | `TC-03`, `TC-04`, `EXP-01` | `AUTOMATE_API` + `EXPLORATORY` |

---

## 2. Complete 4-Quadrant Test Case Matrix (With Automation vs. Manual Rationale)

| TC ID | Category | Priority | Execution Mode | Engineering Rationale (Why Automate vs. Why Manual) | Title | Test Steps | Expected Result (Oracle) | Live CLI Check | Final Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-01** | `HAPPY_PATH` | `@p0` | `AUTOMATE_UI` | Core business journey executed on every deployment; high regression value in browser DOM. | [Valid end-to-end flow] | 1. Open page<br>2. Fill valid data<br>3. Submit | Status transitions to `CONFIRMED`; total matches formula [`INV-01`] | ✅ PASS | ✅ Automated (`PASS`) |
| **TC-02** | `BORDER_CASE` | `@p1` | `AUTOMATE_API` | Boundary value matrix (`0`, `MIN`, `MAX`, `MAX+1`, Unicode) is 20x faster and more stable at the API layer than repeating UI form fills. | [Boundary: Min/Max value & special chars] | 1. Send boundary payload (`0`, `MAX`, Unicode) to endpoint | System handles boundary deterministically without precision loss [`INV-02`] | ✅ PASS | ✅ Automated (`PASS`) |
| **TC-03** | `BORDER_CASE` | `@p1` | `AUTOMATE_UI` | Verifies UI price summary reactivity and floor constraint on 100% discount coupon. | [Boundary: 100% discount coupon floor] | 1. Add $100 item<br>2. Apply 100% coupon | Total equals `$0.00` (never negative) [`INV-01`] | ❌ FAIL (`BUG-01`) | ⚠️ Automated (`test.fail()` — `BUG-01`) |
| **TC-04** | `NEGATIVE_PATH` | `@p0` | `AUTOMATE_UI` | Critical UX validation ensuring accessible `role="alert"` feedback and blocked submission. | [Invalid input / missing required field] | 1. Leave required field blank<br>2. Click Submit | Inline `role="alert"` error displayed; `POST` request blocked [`INV-03`] | ✅ PASS | ✅ Automated (`PASS`) |
| **TC-05** | `STATE_TRANSITION` | `@p0` | `AUTOMATE_UI` | Protects against double-charge / duplicate creation on rapid double-click. | [Forbidden Transition / Double Submit] | 1. Double-click Submit rapidly | Exactly 1 order created; second request rejected [`Forbidden Transition`] | ✅ PASS | ✅ Automated (`PASS`) |
| **TC-06** | `HAPPY_PATH` | `@p2` | `MANUAL_TEST` | Requires human visual verification of downloaded PDF receipt layout, print pagination, and external email client rendering (negative ROI to automate). | [Visual layout of PDF receipt & confirmation email] | See Section 3 below | PDF table alignment, brand logo, and email rendering are visually intact | ➖ Manual | 🧑‍💻 Manual Checklist |

---

## 3. 🧑‍💻 Manual Test Execution Guide (Cases Not Recommended for Automation)

> **Why These Cases Are Manual:** M.A.T.E. intentionally keeps these scenarios manual because automating them introduces high maintenance fragility with low defect-detection ROI, or because they require human visual/sensory evaluation.

### Manual Case `TC-06`: [Visual Layout of Downloaded PDF Receipt & Email Notification]
* **Why Not Automate?** Checking that a PDF binary exists is automated in API/UI, but judging whether text overlaps, margins break on page 2, or dark-mode email clients invert the brand logo requires human visual inspection.
* **Preconditions:** Complete a valid order in Staging (`TC-01`) using a real test inbox.
* **Step-by-Step Instructions for the Tester:**
  1. Click **"Download Receipt (PDF)"** on the order confirmation screen.
  2. Open the PDF and verify that long product names (50+ characters) wrap cleanly without overlapping the price column.
  3. Open the confirmation email on Desktop and Mobile (Dark Mode enabled) and verify the CTA button contrast and layout.
* **Expected Pass Criteria:** Zero text truncation, readable contrast in dark mode, and accurate totals matching the checkout screen.

---

## 4. 🧭 Tailored Exploratory Testing Recommendations & Border-Case Heuristics

> **Why Exploratory Testing Here?** Automated scripts only verify rules we explicitly programmed (`Checking`). Based on this User Story, the QA Engineer should run the following **time-boxed Exploratory Missions (`Testing`)** to uncover unpredictable edge cases:

### Exploratory Mission `EXP-01` (30–45 min): [Interruptions, Multi-Tab State & UX Friction Tour]
* **Generate Charter File:** `npx mate-sdt charter [module]`
* **Why This Mission Matters for This Story:** Users frequently switch tabs to copy promo codes or payment details, experience flaky mobile networks, or use browser Back/Forward buttons mid-flow.
* **Recommended Heuristics & Border Prompts to Probe:**
  1. **The "Two-Tab Cart Mutation" Probe:** Open the checkout screen in Tab A. Open Tab B, remove an item or change the quantity, then return to Tab A and click "Submit" without refreshing. Does Tab A detect the stale state gracefully?
  2. **The "Mid-Flight Network Drop" Probe:** Throttle network to `Offline` (or slow 3G) right after clicking the primary CTA, then restore connectivity. Does the spinner hang forever, or can the user retry safely without duplicate records?
  3. **The "Copy-Paste Chaos" Probe:** Paste values with leading/trailing newlines, emojis (`👕🔥`), RTL characters, or formatted currency strings (`$1,250.00`) into numeric/text inputs.
  4. **Keyboard-Only & Screen-Reader Ergonomics (WCAG 2.1 AA):** Complete the entire story using only `Tab`, `Shift+Tab`, `Space`, and `Enter`. Verify focus never gets trapped inside modals or disappears on validation errors.

---

## 5. 🐛 Discovered Bugs & Anti-Greenwashing Log (`test.fail()` Tracker)

> **M.A.T.E. Anti-Greenwashing Rule:** Every automatable test case that failed during live verification or automated execution is **kept in the automated test suite** with its real assertion intact, annotated with `test.fail()`, and linked to a bug report below.

| Bug ID | Failing TC ID | Violated AC / Invariant | Expected Behavior | Actual Behavior Observed | Automated Spec Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BUG-YYYYMMDD-01` | `TC-03` | `AC-02` / `INV-01` | Order total floors at `$0.00` | UI displays `-$5.00` and API returns `500` | `tests/e2e/[module].spec.ts` (`test.fail`) |
