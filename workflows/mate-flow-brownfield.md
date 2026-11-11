---
name: mate-flow-brownfield
description: >-
  End-to-End M.A.T.E. Brownfield Workflow: Reverse-engineers an existing codebase or
  live web application (via Playwright MCP page-explorer), builds MATE-PROJECT-MAP.md,
  drafts specs/[module].mate-spec.md in REVIEW status, and freezes P0 invariants before refactoring.
---

# 🏭 E2E Workflow: Brownfield Reverse-Spec & Freeze (`/mate-flow-brownfield`)

Execute this workflow when onboarding an existing/legacy repository or an undocumented live web application into the M.A.T.E. Method.

---

## Step 1: Surface Reconnaissance (`mate-core` & `mate-model`)
Choose the appropriate reconnaissance path (or combine both):
- **Path A (Source Code Scan):** Inspect `package.json` / `pom.xml` / `pyproject.toml`, API routing tables, controllers, ORM models, and existing test suites.
- **Path B (Live Page Exploration via Playwright MCP):** Follow `skills/mate-model/references/live-page-reconnaissance.md` to navigate the live URL, inventory DOM elements/forms, and observe state transitions without executing destructive actions.

## Step 2: Initialize or Update `MATE-PROJECT-MAP.md` (`mate-core`)
1. Run `npx mate-sdt init` if the project has not been initialized yet.
2. Populate `MATE-PROJECT-MAP.md` with discovered project identity, existing naming conventions, reusable components, and `MUST / MUST NOT` guardrails.

## Step 3: Reverse-Engineer `specs/[module].mate-spec.md` (`mate-model`)
1. Draft `specs/[module].mate-spec.md` with `status: REVIEW`.
2. Tag empirical findings as `[OBSERVED]` and deductions as `[INFERRED]`. Mark missing business rules as `[TBD: needs stakeholder confirmation]`.
3. Explicitly list illegitimate or unprotected state transitions currently possible in legacy code under **Explicitly Forbidden Transitions**.
4. Validate structural compliance:
   ```bash
   npx mate-sdt validate specs/[module].mate-spec.md
   ```

## Step 4: Audit Existing Tests & Freeze P0 Invariants (`mate-maintenance` & `mate-assert-playwright`)
1. Audit any existing test suite for flaky anti-patterns:
   ```bash
   npx mate-sdt audit
   ```
2. Automate and lock the P0 business invariants (`tests/e2e/` and `tests/api/`) so legacy refactoring cannot silently break production behavior.
