---
name: mate-explore
description: >-
  Specialist in Pillar E (Explore & Release Governance) of the M.A.T.E. Method.
  USE WHEN: Designing or executing human Session-Based Test Management (SBTM) exploratory charters
  (`npx mate-sdt charter`), performing WCAG 2.1 AA accessibility & UX ergonomics audits, generating Formal
  Release Waivers (`npx mate-sdt waiver`), or issuing the final Release Verdict (`PASS`, `CONCERNS`, or `FAIL`).
  SYNERGY: Pairs with `mate-pw-forensics` (to record traces and 60fps videos during exploratory charters) and
  consolidates evidence from `mate-story-testcases`, `mate-assert-playwright`, `mate-threat`, and `mate-triage`.
---

# 🧭 Pillar E Skill: Human Exploration & Release Governance (`mate-explore`)

This skill is responsible for **Pillar E (Explore)** of the M.A.T.E. Method. Its purpose is to safeguard the human dimension of software quality—evaluating heuristics that no language model or automated script can judge alone—and issuing the final release gate verdict.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-model` & `mate-story-testcases`** | Supplies `<exploratory_charters>` (`CHR-01..CHR-NN`) and edge-case hypotheses from the User Story. |
| **Companion (CLI Capture)** | **`mate-pw-forensics` & `mate-pw-recon`** | Records browser traces (`tracing-start`), 60fps videos (`video-start`), and inspects WCAG 2.1 AA computed styles (`eval`) during the charter session. |
| **Downstream (Defects)** | **`mate-triage`** | Converts anomalies discovered during exploratory charters into formal spec-linked Bug Reports (`npx mate-sdt bug`). |

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
    - **`[PASS]`**: 100% Invariants green, zero unwaived `test.fail()` bugs, Mutation Score >= 85%, and human exploratory charters show zero blocking issues.
    - **`[CONCERNS]`**: Minor acceptable deviations; requires a **Formal Release Waiver** (`npx mate-sdt waiver <module>`) signed by both the Quality Lead and Tech Lead, backed by a tracked technical debt issue.
    - **`[FAIL]`**: Broken P0/P1 invariant, active `test.fail()` bug on critical AC, or critical UX defect. Release pipeline blocked immediately.

---

## 🧭 CLI & Exploratory Templates

*   **Generate Exploratory Charter via CLI:** `npx mate-sdt charter <module-name>`
*   **Generate Release Waiver via CLI:** `npx mate-sdt waiver <module-name>`
*   **Exploratory Charter Template (SBTM):** [`resources/charter.template.md`](./resources/charter.template.md)
*   **Formal Release Waiver Template:** [`resources/release-waiver.template.md`](./resources/release-waiver.template.md)
