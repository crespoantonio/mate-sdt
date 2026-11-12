# ❓ Discovery Questions Checklist: Exploratory Testing & Release Assessment (`mate-explore`)

When framing a Session-Based Test Management (SBTM) charter or deciding whether a feature is safe to ship, use this checklist:

---

## 🧭 1. Exploratory Charter Scoping
1. **Target Feature & Persona:** Who is the user persona for this session? (e.g., Novice user, Power user, Malicious actor, Screen-reader user).
2. **Heuristic Angle:** What Rapid Software Testing (RST) heuristics should we apply?
   - *FEW HICCUPS:* Familiarity, Explainability, World, History, Image, Comparable products, Claims, Users' desires, Purpose, Standards.
   - *Goldilocks:* Too big, too small, just right.
   - *CRUD:* Create, Read, Update, Delete in unexpected orders.
3. **Timebox:** Is this a 30-minute quick-poke session or a 90-minute comprehensive deep dive?

---

## ♿ 2. Non-Functional & Accessibility (a11y) Checkpoints
1. **Keyboard Only:** Can the entire flow be operated using `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Esc` without a mouse trap?
2. **Screen Reader Semantics:** Are aria-labels, headings (`h1`–`h6`), and error messages announced dynamically (`aria-live="polite"`)?
3. **Network Jitter & Offline:** What happens if the network is throttled to 3G or toggled offline mid-action?

---

## 🛑 3. Release Verdict & Waiver Criteria
1. **Known Defects:** Are there open P2/P3 bugs that cannot be fixed before the release window?
2. **Waiver Justification:** Who signs off on the risk (Product Lead / Engineering Manager), what is the business mitigation, and what is the sunset date for the formal waiver?
