# ❓ Discovery Questions Checklist: User Stories & Test Case Ingestion (`mate-story-testcases`)

When receiving a User Story, Jira/Linear ticket, Notion page, or raw requirements text, use this checklist to uncover ambiguities before designing Test Cases or writing automated code:

---

## 🔍 1. Acceptance Criteria & State Transitions
1. **The Core Happy Path:** What is the primary user goal, and what is the exact post-condition upon success (e.g., URL change, toast notification, database record created)?
2. **Forbidden Transitions:** What should **never** happen? (e.g., Can an order transition from "Cancelled" back to "Shipped"? Can an unauthenticated user submit an application?).
3. **Boundary Limits:** What are the exact numeric, character, or format limits? (e.g., Min/max coupon discount percentage, maximum file upload size, valid international phone number patterns).

---

## ⚖️ 2. Automation vs. Manual Feasibility Assessment
1. **Automation ROI:** Does this feature have high execution frequency and deterministic UI/API behavior? (`[AUTOMATE_UI]` vs `[AUTOMATE_API]`).
2. **Manual Retention Flags:** Does the feature require:
   - Physical hardware interaction or 2FA token retrieval from a personal physical device?
   - Pixel-perfect visual layout, PDF rendering, or print dialog verification?
   - High UI volatility (expected to change next week)?
   *(If yes, classify as `[MANUAL_TEST]` with step-by-step instructions and rationale).*
3. **Exploratory Candidate:** Does the flow have rich interactive state spaces, deep filtering, or complex validation feedback? *(Classify as `[EXPLORATORY_CHARTER]`)*.

---

## 👥 3. Collaboration Checkpoints
1. **Product Owner Question:** *"What should happen if the user inputs X at step Y?"*
2. **Backend Developer Question:** *"What HTTP status code and payload structure does the API return when validation fails?"*
