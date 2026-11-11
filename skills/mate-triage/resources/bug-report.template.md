# 🐛 M.A.T.E. Structured Bug Report
<!-- Generated via: npx mate-sdt bug <module> -->

## 📋 Defect Metadata
- **Bug ID:** `BUG-[YYYYMMDD]-[MODULE]-[##]`
- **Title:** `[Module] Brief, deterministic description of the violated invariant or failure`
- **Date Reported:** `YYYY-MM-DD`
- **Violated Specification:** `./specs/[module].mate-spec.md`
- **Violated Clause / Oracle:** `[e.g., INV-02 / THR-01 / Forbidden Transition: DRAFT -> DELIVERED]`
- **Severity:** `Critical (P0) | High (P1) | Medium (P2) | Low (P3)`
- **Reproduction Rate:** `Deterministic (3/3) | Intermittent (X/Y runs)`

---

## 🌍 Environment & Context
- **Environment:** `Local Podman / QA / Staging`
- **Commit / PR / Version:** `[git-sha / vX.Y.Z]`
- **Browser / Device / Runtime:** `[e.g., Chromium 130 / Node 20 / API]`

---

## 📝 Description & Business Impact
Provide a concise 2–3 sentence technical summary explaining what invariant or state transition broke and how it impacts users or data integrity.

---

## 🔄 Steps to Reproduce
1. **Precondition:** `[e.g., Authenticated user with order in DRAFT state]`
2. **Action:** `[e.g., Dispatch two concurrent POST /api/orders/confirm requests within 40ms]`
3. **Observed Fault:** `[e.g., Backend creates two duplicate charge records instead of enforcing idempotency]`

---

## ⚖️ Expected vs. Actual Behavior

- **Expected (Per `MATE-SPEC.md`):**  
  `[Exact behavior mandated by INV-XX / THR-XX]`
- **Actual (Observed):**  
  `[Actual HTTP status, DOM state, or database mutation observed]`

---

## 🔬 Forensic Evidence
- **Playwright Trace / Screenshot:** `[path-to-trace.zip or screenshot.png]`
- **Console / Network / Server Logs:**
  ```text
  [Paste stack trace, HTTP payload, or assertion diff]
  ```
- **Suggested Root Cause Area:** `[e.g., src/controllers/order.controller.ts — missing idempotency lock]`
- **Regression Test Coverage:** `[Link to failing test in tests/e2e/ or tests/threats/]`
