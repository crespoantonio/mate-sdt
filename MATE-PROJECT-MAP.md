# 🗺️ MATE-PROJECT-MAP (Self-Governing Repository Index — `mate-sdt`)
<!-- Auto-updated: 2026-11-13 | Status: ACTIVE -->

This Living Architecture Map indexes the **`mate-sdt`** repository itself (`< 3,000 tokens`) so autonomous AI agents navigate the CLI, Context Engineering engine, Skills, Workflows, and Templates without saturating context.

---

## 1. Repository Stack & Governance
- **Runtime:** Native Node.js `>= 18` (`node:fs`, `node:path`, `node:readline`, `node:child_process`, `node:os`) — **ZERO production dependencies**.
- **Test & Build Gate:** `npm run build` (`node scripts/build-check.js`) & `npm test` (`node --test tests/cli.test.js`).
- **Containers:** Rootless **Podman** (Stryker mutation testing & Grafana k6).

---

## 2. Core CLI & Engine Modules

| Module | File Path | Responsibility |
| :--- | :--- | :--- |
| **CLI Entry** | `bin/mate-sdt.js` | Argument parsing & command router (`install`, `init`, `context`, `session`, `gate`, `validate`, `audit`, `setup-ai`, `dataset`, etc.) |
| **Memory & Sessions** | `src/cli/memory.js` | Session Workbench (`.mate/sessions/`, TTL, $K=5$ compaction, `mate.handoff/v1`), 3-Bucket / 7-Layer JIT Context Pack, self-editing consolidation (`CREATE`/`UPDATE`/`DELETE`), PII & injection hygiene |
| **Harness Gate** | `src/cli/harness.js` | `analyzeContextEngineering`, 5-Gate Verification Loop (`GATE-01`..`GATE-05`), and `runHarnessLoop` (`--loop`) |
| **Garbage Collector** | `src/cli/gc.js` | `runGarbageCollection` (`npx mate-sdt gc`), `blockDestructiveCommands`, `docs/QUALITY_SCORE.md`, `.mate/exec-plans/` |
| **Self-Healing Engine** | `src/cli/heal.js` | `compressErrorTrace` (`<error_digest> <= 400t`), surgical spec/code slice, 5-Class Heal vs. Quarantine (`npx mate-sdt heal`) |
| **Multi-IDE Installer** | `src/cli/installer.js` | Scaffolds Antigravity, Claude Code, Cursor, Windsurf, Copilot, Codex, `AGENTS.md`, `MATE-PROJECT-MAP.md`, and AI Quality Pack |
| **Spec Linter** | `src/cli/validator.js` | Validates `specs/*.mate-spec.md` with Remediation-Injecting `[SELF-CORRECTION][GATE-02]` errors |
| **Health Auditor** | `src/cli/auditor.js` | Forward-Only 6-Layer Dependency Analyzer, Taste Invariants (`<= 300` lines), `MATE-ANTI-01..08`, `[SELF-CORRECTION][GATE-04]` |
| **Terminal UI** | `src/cli/ui.js` | ANSI colors, banners, and spinners |

---

## 3. Verification & Documentation Assets
- **Build Integrity Gate:** `scripts/build-check.js` (verifies LF endings, required CLI/skill/workflow/template files).
- **Integration Suite:** `tests/cli.test.js` (native `node --test` suites).
- **Whitepapers & References:** `docs/CONTEXT_AND_HARNESS_ENGINEERING.md`, `docs/AI_AGENT_AND_RAG_TESTING.md`, `docs/SUBAGENTS_AND_PARALLEL_EXECUTION.md`, `docs/CLI_REFERENCE.md`, `docs/SPEC_STANDARD.md`, `docs/QUALITY_SCORE.md`.
- **Skills & Workflows:** `skills/mate-*` (16 Core + 4 AI Quality Pack) & `workflows/mate-flow-*.md` (8 E2E workflows).

---

## 4. Non-Negotiable Guardrails
- Never add third-party runtime dependencies to `package.json`.
- Enforce `[BOOTSTRAPPED] > [USER_EXPLICIT] > [OBSERVED | ISO] > [INFERRED] / [TBD]`; block `[INFERRED]`/`[TBD]` from `<invariants>` and Page/Component Objects.
- Keep `bin/mate-sdt.js` in **LF** line endings.
- Always run `npm run build` and `npm test` after code changes.

<!-- MATE-MEMORY:global:START -->
<!-- Canonical consolidated memory entries promoted via `npx mate-sdt context --consolidate` -->
<!-- MATE-MEMORY:global:END -->
