# ❓ Discovery Questions Checklist: QA Strategy & Architecture (`mate-strategy`)

When kicking off a new testing initiative, migrating from zero tests, or setting up a standalone QA repository, use this targeted checklist to extract necessary architectural context without guessing:

---

## 🏛️ 1. System Topology & Environments
1. **Architecture Model:** Is the system a Monolith, Microservices architecture, Jamstack SPA (React/Vue/Angular) with REST/GraphQL backend, or an Event-Driven system?
2. **Repository Topology:** Will M.A.T.E. and the QA framework live in the same repository as the application code (integrated monorepo) or in a **dedicated, standalone black-box QA repository**?
3. **Environment Stability:** Are test environments (Staging / UAT) isolated, or do they share databases with development builds? How is test data seeded or reset?
4. **Third-Party Dependencies:** Does the system rely on external payment gateways (Stripe/PayPal), SMS/Email providers (Twilio/SendGrid), or external KYC services? Can they be stubbed, sandboxed, or mocked via `@playwright/cli` network routes?

---

## 🎯 2. Risk Matrix & Priority Allocation (P0–P3)
1. **Business Criticality (P0):** What are the top 3 user flows that, if broken for 15 minutes, directly cost the company money or cause legal/reputational damage (e.g., User Login, Checkout/Payment, Core Data Submission)?
2. **High-Frequency Paths (P1):** What features do 80% of active users execute daily (e.g., Search, Account Dashboard, Order History)?
3. **Release Frequency:** How often does the engineering team deploy to production (Continuous Delivery multiple times a day, weekly sprints, or monthly release trains)?

---

## 👥 3. Team Dynamics & Roles
1. **Who writes unit/integration tests?** Do backend/frontend developers write Jest/Vitest/JUnit tests, or is all testing left to QA?
2. **Who owns acceptance criteria?** Is there a Product Owner / Business Analyst available on Slack for rapid ticket clarification, or are specifications largely informal?
