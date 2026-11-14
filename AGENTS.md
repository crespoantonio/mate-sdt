# AGENTS.md — M.A.T.E. SDT Framework Developer & Maintainer Guide (<= 100 Lines)

> **Repository Identity:** You are developing the **`mate-sdt`** npm package and framework itself (`Agent = Model + Harness + Knowledge`).
> **Audience:** Autonomous AI Agents & human maintainers developing, extending, and shipping `mate-sdt`.
> **Note:** This repository is NOT a test automation project for a web application. It is the CLI engine, skill catalog, and scaffold generator that other projects install via `npx mate-sdt install`.

---

## 1. Repository Topology & Subsystem Routing

| Subsystem | Directory / Entry | Responsibility |
| :--- | :--- | :--- |
| **CLI Router** | `bin/mate-sdt.js` | Parses flags and routes commands (`install`, `init`, `context`, `session`, `gate`, `audit`, `heal`, `gc`, etc.) |
| **Multi-IDE Installer** | `src/cli/installer.js` | Generates consumer `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.windsurf/`, `.agents/skills/`, and package scaffolds |
| **AST & Regex Auditor** | `src/cli/auditor.js` | Linter enforcing consumer 6-layer architecture, `MATE-ANTI-01..08` (catches raw `page.locator()` / `page.getBy*()`), and DIP |
| **Spec Validator** | `src/cli/validator.js` | Validates consumer `specs/*.mate-spec.md` with remediation-injecting `[SELF-CORRECTION][GATE-02]` errors |
| **Harness Engine** | `src/cli/harness.js` | Executes 5-Gate Closed-Loop Verification (`GATE-01`..`GATE-05`) and `--loop` state machine |
| **Memory & Context** | `src/cli/memory.js` | 3-Bucket / 7-Layer JIT Context Pack builder, rolling compaction ($K=5$), memory consolidation |
| **Doc-Gardening & GC** | `src/cli/gc.js` | Analyzes entropy, generates `docs/QUALITY_SCORE.md`, maintains `.mate/exec-plans/tech-debt-tracker.md` |
| **Self-Healing Engine** | `src/cli/heal.js` | Sanitizes stack traces into `<error_digest> <= 400t` and manages 5-class triage (`npx mate-sdt heal`) |
| **Skill Catalog** | `skills/mate-*` | 20 specialized skills (16 Core + 4 AI Quality Pack) distributed to consumer IDEs |
| **Workflow Recipes** | `workflows/mate-flow-*.md` | 8 End-to-End SDT workflows (`zero-to-one`, `user-story`, `triage`, `greenfield`, etc.) |
| **Consumer Templates** | `templates/standalone/` | Starter files (`playwright.config`, `tsconfig`, `gitignore`, `env.example`) installed in target projects |
| **Integration Suite** | `tests/cli.test.js` | Native Node integration suite verifying CLI commands, validator, auditor, and gates (`npm test`) |
| **Build Integrity Gate** | `scripts/build-check.js` | Package integrity, file existence, LF endings, and spec checks (`npm run build`) |

---

## 2. Non-Negotiable Framework Development Invariants

1. **Zero Runtime Dependencies:** `bin/` and `src/cli/` MUST use **strictly native Node.js (`>= 18`) built-ins** (`node:fs`, `node:path`, `node:child_process`, `node:readline`, `node:os`). Never add production dependencies to `package.json`.
2. **Multi-IDE Synchronization Rule:** Any change to skills, consumer rules, or templates in `src/cli/installer.js` MUST stay synchronized across all targets (`Antigravity`, `Claude Code`, `Cursor`, `Windsurf`, `GitHub Copilot`, and Universal `AGENTS.md`).
3. **LF Line Endings:** `bin/mate-sdt.js` and all CLI scripts must strictly use **LF** line endings.
4. **Safety Guardrails:** Block destructive commands (`rm -rf`, `git push --force`, `git reset --hard`, `DROP TABLE`) via `src/cli/gc.js`.
5. **Consumer Separation:** Never confuse this repository with a consumer testing project. Consumer rules (POM, 6-layer architecture, 4-quadrant test cases, `.mate/exec-plans/active/`) are generated into consumer repositories via `installer.js` and tested via `tests/cli.test.js`.
6. **Container Isolation:** Always use rootless **Podman** (never Docker) for mutation testing (`Stryker`) and performance testing (`k6`).
7. **Verification Mandate:** Always run `npm run build` and `npm test` after any code change before concluding your turn.

---

## 3. Verification & Maintenance Commands

```bash
npm run build        # Integrity, LF endings & template check (scripts/build-check.js)
npm test             # Native Node integration suite (tests/cli.test.js)
npm run gc           # Doc-gardening & entropy scan (src/cli/gc.js)
```
