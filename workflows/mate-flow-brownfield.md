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

## Step 1: Surface Reconnaissance (`mate-core`, `mate-pw-recon` & `mate-model`)
Choose the appropriate reconnaissance path (or combine both):
- **Path A (Source Code & Legacy Suite Scan):** Inspect `package.json` / `pom.xml` / `pyproject.toml`, API routing tables, controllers, ORM models, and existing manual/legacy test suites (`skills/mate-story-testcases/references/legacy-manual-migration.md`).
- **Path B (Live Browser & Network Reconnaissance via `@playwright/cli`):** Activate `mate-pw-recon` (`playwright-cli open <url>`, `snapshot`, `network`) and follow `skills/mate-pw-recon/references/network-api-discovery.md` to inventory DOM elements, observe state transitions, and reverse-engineer backend API endpoints without executing destructive actions.

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

## Step 4: Audit Existing Tests, Freeze P0 Invariants & Run Harness Gate (`mate-maintenance` & `mate-assert-playwright`)
1. Audit any existing test suite for flaky anti-patterns (`npx mate-sdt audit`).
2. Automate and lock the P0 business invariants (`tests/e2e/` and `tests/api/`) so legacy refactoring cannot silently break production behavior.
3. Run `npx mate-sdt context [module]` and `npx mate-sdt gate` to verify all 5 Harness Engineering gates (`GATE-01-CONTEXT` through `GATE-04-SOLID-AUDIT` + `.mate/harness-state.json`).

---

## 🧵 Session Workbench & Black-Box Handoff Protocol

1. **Start Isolated Session:** `npx mate-sdt session start <flow-id> --module=<module> --stage=<initial-stage>`
2. **Record Raw Events (Window $K=5$):** `npx mate-sdt session event <flow-id> "[OBSERVED | ISO] ..."`
3. **Stage Transition (Auto-Compaction + `mate.handoff/v1`):** `npx mate-sdt session advance <flow-id> --stage=<next> --to=<next-skill> --digest="..."`
4. **JIT Context & Consolidation:** Run `npx mate-sdt context <module>` before each stage and `npx mate-sdt context <module> --consolidate` + `npx mate-sdt gate` at completion.
