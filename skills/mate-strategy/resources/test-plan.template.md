# 📅 M.A.T.E. Test Plan: [Release / Sprint / Epic Name]

* **Test Plan ID:** `TP-[YYYYMMDD]-[SCOPE]`
* **Date:** `YYYY-MM-DD`
* **Linked Master Strategy:** `docs/TEST-STRATEGY.md`
* **Target Environment:** `[Staging / QA / Pre-Prod]`
* **Release Verdict Status:** `[PENDING | PASS | CONCERNS | FAIL]`

---

## 1. Scope & Objectives

### In-Scope Modules & User Stories
| Story / Ticket ID | Module | M.A.T.E. Spec | Test Case Matrix (`.md` / `.csv`) | Priority |
| :--- | :--- | :--- | :--- | :---: |
| `[e.g., JIRA-101]` | `[Module Name]` | `specs/[scope].mate-spec.md` | `tests/cases/TC-[scope].md` | `P0` |

### Out-of-Scope
* [List any modules, third-party sandboxes, or legacy screens explicitly excluded from this cycle and why.]

---

## 2. Planned Test Execution Matrix

| Test Level | Command / Artifact | Target Coverage | Status |
| :--- | :--- | :--- | :---: |
| **1. Spec Validation** | `npx mate-sdt validate` | 100% specs valid with Forbidden Transitions | ⏳ Pending |
| **2. P0 Smoke Suite** | `npm run test:smoke` | All critical Golden Paths green | ⏳ Pending |
| **3. 4-Quadrant UI & API** | `npm run test:e2e && npm run test:api` | Happy, Border, Negative & State Transitions | ⏳ Pending |
| **4. Pillar T Threats** | `npm run test:threats` | Concurrency, idempotency & fuzzing checks | ⏳ Pending |
| **5. Performance (k6)** | `npx mate-sdt k6 tests/nfr/[scope].k6.js` | `p95` / `p99` SLAs verified in Podman | ⏳ Pending |
| **6. Exploratory Charter** | `tests/charters/CHR-*-[scope].md` | UX ergonomics & WCAG 2.1 AA accessibility | ⏳ Pending |
| **7. Codebase Health Gate** | `npx mate-sdt audit` | Health Score Grade `A` (zero sleeps / `.only`) | ⏳ Pending |

---

## 3. Known Defects & Anti-Greenwashing Tracker (`test.fail()`)

| Bug ID | Failing TC ID | Severity | Marked in Suite (`test.fail`) | Waiver / Blocker Status |
| :--- | :--- | :---: | :---: | :--- |
| `[e.g., BUG-01]` | `TC-03` | `P1` | `tests/e2e/[scope].spec.ts` | `[BLOCKER / WAIVED in WVR-XX]` |

---

## 4. Entry & Exit Criteria Sign-Off

### Entry Criteria
- [ ] Target environment (`BASE_URL` / `API_BASE_URL`) is deployed and reachable.
- [ ] User Stories and Acceptance Criteria are ingested and mapped in `tests/cases/TC-[scope].md`.

### Exit Criteria
- [ ] All 4 quadrants of Test Cases have been executed and automated.
- [ ] Every failing test exposing a real product bug is documented in `tests/bugs/BUG-*.md` and annotated with `test.fail()`.
- [ ] Final Release Verdict (`PASS`, `CONCERNS` + Waiver, or `FAIL`) is recorded in `MATE-PROJECT-MAP.md`.
