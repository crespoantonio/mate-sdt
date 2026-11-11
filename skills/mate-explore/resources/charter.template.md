# 🧭 M.A.T.E. Exploratory Testing Charter (SBTM)
<!-- Session-Based Test Management Log -->

## 📋 Session Metadata
- **Charter ID:** `CHR-[YYYYMMDD]-[MODULE]-[##]`
- **Target Module / Feature:** `[e.g., Laundry Checkout & Scheduling]`
- **Explorer (Quality Engineer):** `[Name / Handle]`
- **Date & Time:** `YYYY-MM-DD HH:MM`
- **Time-box Duration:** `45 minutes` (Standard: 30–60 min)
- **Environment:** `Staging / Production-Mirror`
- **Device / Browser:** `[e.g., Pixel 7 / Chrome Mobile 124]`

---

## 🎯 Charter Mission
> *Explore [target area/feature] using [heuristic/technique] to discover [potential risk/behavioral flaw].*

**Specific Mission Focus:**
- [Describe the objective of this session]

---

## 🔍 Heuristics & Personas Explored
- [ ] **Ergonomics & Thumb-zone:** Mobile reachability, visual balance, one-handed operation.
- [ ] **Accessibility (a11y):** Keyboard navigation tab order, contrast, screen reader announcements (WCAG 2.1 AA).
- [ ] **Emotional / Trust Factors:** Do spinners, confirmation dialogues, and payment receipts induce confidence?
- [ ] **Chaotic Environments:** Rapid network switching (WiFi -> 4G -> Airplane Mode), interrupted flow.

---

## 📝 Session Notes & Observations
- `[HH:MM]` Started exploration at landing screen...
- `[HH:MM]` Observed slight lag when switching laundry weight category...
- `[HH:MM]` Screen reader correctly announced total price update after adding dry cleaning.

---

## 🐛 Defects & Friction Discovered

| Issue ID | Severity (`P0/P1/P2`) | Description | Steps to Reproduce | Visual Evidence (Screenshot/Video) |
| :---: | :---: | :--- | :--- | :--- |
| `BUG-01` | `P2` | Keyboard focus lost when closing promo code modal | Tab to promo -> Open -> Esc -> Focus jumps to top of body | `[link-or-path]` |

---

## ⚖️ Quality Engineer's Session Assessment
- [ ] **Clean:** No friction or blocking bugs discovered.
- [ ] **Concerns:** Minor usability or cosmetic friction observed; non-blocking.
- [ ] **Critical Blocker:** Invariant violation or severe user friction encountered.

**Notes for Release Verdict:**  
`[Enter closing recommendations]`
