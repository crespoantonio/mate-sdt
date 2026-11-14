# M.A.T.E. Tech Debt & Entropy Tracker

> Updated automatically by `npx mate-sdt gc` at 2026-11-14T13:41:09.155Z.
> Atomic, 1-minute-reviewable cleanup tasks:

- [ ] **[MATE-TASTE-03]** Ad-hoc helper function defined inside test spec at tests/cli.test.js:50 — *Fix:* Move reusable test helpers into `src/fixtures/` or `src/components/` so specs stay declarative.
- [ ] **[MATE-ANTI-08]** Raw page.locator() Hardcoded Inside Test Spec at tests/cli.test.js:662 — *Fix:* Move selector definitions into a Page Object (`src/pages/`) or Component Object (`src/components/`) and expose semantic actions/locators.
