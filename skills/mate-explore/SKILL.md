---
name: mate-explore
description: >-
  Specialist in Pillar E (Explore) of the M.A.T.E. Method. Designs human exploratory
  testing charters (Session-Based Test Management), audits accessibility and ergonomics,
  and consolidates quality evidence to issue the official release verdict: PASS, CONCERNS (with waivers), or FAIL.
---

# 🧭 Pillar E Skill: Human Exploration & Release Governance (`mate-explore`)

This skill is responsible for **Pillar E (Explore)** of the M.A.T.E. Method. Its purpose is to safeguard the human dimension of software quality—evaluating heuristics that no language model or automated script can judge.

---

## 📋 Responsibilities of `mate-explore`

1.  **Designing Exploratory Charters (Session-Based Testing):**  
    Designs time-boxed missions (typically 30 to 60 minutes) targeting specific qualitative heuristics:
    - *Mobile Ergonomics & UX:* Ease of use, interface friction, visual feedback, trust factors.
    - *Web Accessibility (a11y):* Strict keyboard-only navigation and screen-reader audit (WCAG 2.1 AA compliance).
    - *Subjective Real-World Edge Cases:* Network handoffs (WiFi to cellular), airplane mode toggles, viewport orientation shifts, interrupted payments.
2.  **Structured Session Debriefs & Findings:**  
    Provides standardized templates for Quality Engineers to capture subtle bugs, design friction, and ergonomic insights.
3.  **Official M.A.T.E. Release Verdict:**  
    Aggregates verifiable evidence across all four pillars (M, A, T, E) to issue the final deployment verdict:
    - **`[PASS]`**: 100% Invariants green, Mutation Score >= 85%, and human exploratory charters show zero blocking issues.
    - **`[CONCERNS]`**: Minor acceptable deviations; requires a **Formal Release Waiver** signed by both the Quality Lead and Tech Lead, backed by a tracked technical debt issue.
    - **`[FAIL]`**: Broken invariant or critical user experience defect. Release pipeline blocked immediately.

---

## 🧭 CLI & Exploratory Templates

*   **Generate Exploratory Charter via CLI:** `npx mate-sdt charter <module-name>`
*   **Generate Release Waiver via CLI:** `npx mate-sdt waiver <module-name>`
*   **Exploratory Charter Template (SBTM):** [`resources/charter.template.md`](./resources/charter.template.md)
*   **Formal Release Waiver Template:** [`resources/release-waiver.template.md`](./resources/release-waiver.template.md)
