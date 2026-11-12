# 💡 M.A.T.E. Framework FAQ & Real-World Implementation Guide

Answers to the most common questions from QA Engineers, SDETs, and Teams adopting the M.A.T.E. Method.

---

## Q1: Should we automate 100% of the test cases generated from a User Story?
**No!** M.A.T.E. follows *Pragmatism over Dogma* and *Testing != Checking*.
When you give M.A.T.E. a User Story (via `mate-story-testcases` or `/mate-flow-user-story`), it evaluates every scenario and assigns an **Execution Mode**:
1. **`[AUTOMATE_UI]`**: Deterministic, repeatable user flows and critical DOM state transitions (`tests/e2e/`).
2. **`[AUTOMATE_API]`**: Data permutations, boundary value tables, schema validations, and HTTP status codes (`tests/api/`).
3. **`[MANUAL_TEST]`**: Scenarios where automation has negative ROI or requires human perception/external devices (e.g., real SMS/Email rendering, physical camera/QR scanning, third-party OAuth/CAPTCHA gates, print/PDF aesthetics, or one-time migration checks). M.A.T.E. documents step-by-step manual instructions and explains *why* they should remain manual in `tests/cases/TC-[module].md`.
4. **`[EXPLORATORY_CHARTER]`**: Contextual exploratory testing missions (`tests/charters/CHR-*.md`) with tailored border-case heuristics for the human tester.

---

## Q2: What happens when M.A.T.E. tests a User Story and finds that the app fails a requirement?
Traditional AI assistants either delete the failing test or change the `expect()` assertion to match the broken app so the test suite turns green (*Greenwashing*).
**M.A.T.E. strictly forbids this:**
1. The test is **still written** in `tests/e2e/` or `tests/api/` with the **true expected assertion** from the User Story.
2. The test is annotated with `test.fail(true, 'BUG-XXX: App violates AC-02 / INV-01')` so Playwright tracks it as an expected failure until developers fix the bug.
3. A formal bug report is generated in `tests/bugs/BUG-*.md` (`npx mate-sdt bug <module>`).
4. Once developers fix the bug, Playwright automatically fails the `test.fail()` annotation ("Expected to fail, but passed!"), alerting QA to remove `test.fail()` and promote the test to standard green status!

---

## Q3: How do we use M.A.T.E. if QA works in a separate repository (outside Frontend and Backend)?
1. Create your dedicated QA folder (`mkdir my-qa-repo && cd my-qa-repo`) and run:
   ```bash
   npx mate-sdt install --with-playwright-cli
   ```
2. Select **`Standalone QA Repository`** mode. M.A.T.E. automatically creates `playwright.config.ts`, `tsconfig.json`, `.env.example`, `docs/TEST-STRATEGY.md`, and `package.json` scripts.
3. Copy `.env.example` to `.env` and set `BASE_URL` to your staging/production URL.
4. Run the **`/mate-flow-zero-to-one`** workflow in your AI agent: it will explore the live URL with `playwright-cli`, reverse-engineer hidden API calls from browser network traffic (even without Swagger!), build your `P0/P1/P2` Risk Matrix, and automate your **Wave 1 P0 Smoke Shield** first.

---

## Q4: What if we don't use Atlassian/Jira MCP? Can we use Notion, Excel, or plain text?
**Yes.** `mate-story-testcases` is 100% source-agnostic:
- **Atlassian MCP / Notion MCP / Linear MCP / GitHub MCP:** Fetches tickets and pages directly if configured.
- **Excel (`.xlsx`) / CSV (`.csv`) / Markdown (`.md`):** Reads local files directly from your workspace.
- **Export Compatibility:** Every time M.A.T.E. generates test cases (`npx mate-sdt cases <module>`), it creates both `tests/cases/TC-<module>.md` (rich QA companion document) and `tests/cases/TC-<module>.csv` (ready to import into Jira Xray, Zephyr, TestRail, Notion, or Excel).

---

## Q5: Why are there 3 separate `@playwright/cli` skills (`mate-pw-recon`, `mate-pw-codegen`, `mate-pw-forensics`)?
To keep your AI agent's context window lean and ensure the right rules apply at the right moment:
- **`mate-pw-recon`** activates *before* coding to open the live browser, verify User Stories interactively, inspect DOM/WCAG attributes, and reverse-engineer network APIs.
- **`mate-pw-codegen`** activates *during* automation to translate locators, `storageState` auth, and network route mocks into SOLID `BasePage`, `BaseComponent`, and `MateFixtures` classes.
- **`mate-pw-forensics`** activates *during* Pillar T concurrency testing (`-s=actor1`, `-s=actor2`), Pillar E exploratory recording (`video-start`), and Day-2 Triage (`tracing-start`, PR attachments).
