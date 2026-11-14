# M.A.T.E. Tech Debt & Entropy Tracker

> Updated automatically by `npx mate-sdt gc` at 2026-11-14T01:30:16.354Z.
> Atomic, 1-minute-reviewable cleanup tasks:

- [ ] **[MATE-TASTE-03]** Ad-hoc helper function defined inside test spec at tests/cli.test.js:45 — *Fix:* Move reusable test helpers into `src/fixtures/` or `src/components/` so specs stay declarative.
- [ ] **[MATE-ANTI-08]** Raw page.locator() Hardcoded Inside Test Spec at tests/cli.test.js:635 — *Fix:* Move selector definitions into a Page Object (`src/pages/`) or Component Object (`src/components/`) and expose semantic actions/locators.
