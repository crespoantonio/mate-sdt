# AGENTS.md — M.A.T.E. SDT Framework Map (<= 100 Lines)

> **Core Rule:** *Humans steer. Agents execute.* When an agent fails, encode the missing capability, legibility, or mechanical guardrail into the harness (`Agent = Model + Harness + Knowledge`).
> **Audience:** Autonomous AI Agents & human maintainers working on the `mate-sdt` repository itself.

---

## 1. Progressive Disclosure Routing (Where to Look Next)

| Need | Authoritative Source |
| :--- | :--- |
| **Repository Topology & Module Index (`< 3,000` tokens)** | [`MATE-PROJECT-MAP.md`](./MATE-PROJECT-MAP.md) |
| **Philosophical Manifesto & 10 Commandments** | [`MANIFESTO.md`](./MANIFESTO.md) |
| **Module Quality Scorecard (`A`–`F`)** | [`docs/QUALITY_SCORE.md`](./docs/QUALITY_SCORE.md) |
| **Sessions, Memory & Harness Architecture** | [`docs/CONTEXT_AND_HARNESS_ENGINEERING.md`](./docs/CONTEXT_AND_HARNESS_ENGINEERING.md) |
| **AI Agent & 3-Layer Memory Evaluation** | [`docs/AI_AGENT_AND_RAG_TESTING.md`](./docs/AI_AGENT_AND_RAG_TESTING.md) |
| **CLI Commands & Flags Reference** | [`docs/CLI_REFERENCE.md`](./docs/CLI_REFERENCE.md) |
| **Spec Standard & Provenance Hierarchy** | [`docs/SPEC_STANDARD.md`](./docs/SPEC_STANDARD.md) |
| **Active Execution Plans & Tech Debt** | [`.mate/exec-plans/tech-debt-tracker.md`](./.mate/exec-plans/tech-debt-tracker.md) |
| **Pasted Stack Trace / Test Failure / "Fix this"** | Route immediately to `mate-triage` + `npx mate-sdt heal` (`/mate-flow-triage`) |

---

## 2. Non-Negotiable Engineering Invariants

1. **Zero Runtime Dependencies:** `bin/` and `src/cli/` MUST use **strictly native Node.js (`>= 18`) built-ins**. Never add production dependencies to `package.json`.
2. **Forward-Only 6-Layer Architecture:** `src/models/` $\rightarrow$ `src/api/` & `src/components/` $\rightarrow$ `src/pages/` ($\le 300$ lines) $\rightarrow$ `src/fixtures/` (`test.extend`) $\rightarrow$ `tests/**/*.spec.ts`. Backward imports, `new SomePage()`, or raw `page.locator()` in specs fail `GATE-04`.
3. **Anti-Greenwashing (`MATE-ANTI-06`):** Never delete/weaken failing assertions or use permissive regexes (`/A|B/`). Keep failing tests with `test.fail(true, "BUG-XXX")` and file `docs/bugs/BUG-*.md`.
4. **Sessions vs. Memory & Provenance:** Separate ephemeral `.mate/sessions/` (24h TTL, $K=5$, `mate.handoff/v1`) from canonical `MATE-PROJECT-MAP.md`, `specs/`, and `.mate/memory/`. Enforce `[BOOTSTRAPPED] > [USER_EXPLICIT] > [OBSERVED | ISO] > [INFERRED] / [TBD]`.
5. **Container Isolation & Safety:** Always use rootless **Podman** (never Docker) for Stryker, k6, and Red Team. Block destructive commands (`rm -rf`, `git push --force`, `git reset --hard`).
6. **Idiomatic English & LF Line Endings:** All repo code, docs, skills, and CLI outputs MUST be in English. Keep `bin/mate-sdt.js` in **LF**.

---

## 3. Verification & Maintenance Commands

```bash
npm run build        # Integrity, LF endings & spec check (scripts/build-check.js)
npm test             # Native Node integration suite (tests/cli.test.js)
npm run gc           # Doc-gardening, AI slop GC, docs/QUALITY_SCORE.md & tech-debt-tracker.md
npx mate-sdt heal [target]        # Compress stack trace (<error_digest>) & 5-Class Heal vs. Quarantine
npx mate-sdt gate --loop --json   # Closed-loop 5-gate verification (max 5 iterations)
```

---

## 4. Multi-IDE Sync Rule
Any change to generated rules, skills, or templates in `src/cli/installer.js` MUST stay synchronized across all targets: `Antigravity`, `Claude Code`, `Cursor`, `Windsurf`, `GitHub Copilot`, and Universal `AGENTS.md`.
