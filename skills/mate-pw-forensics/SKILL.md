---
name: mate-pw-forensics
description: >-
  Multi-Actor Concurrency Sessions, Forensic Tracing, Video Recording & PR/Bug Evidence specialist using `@playwright/cli`.
  USE WHEN: You need to test multi-user concurrency/race conditions using named sessions (`playwright-cli -s=actor1`, `-s=actor2`),
  record execution traces (`tracing-start`/`tracing-stop`), record 60fps WebM videos with chapter cards (`video-start`,
  `video-chapter`), capture failure screenshots, or attach visual evidence to Bug Reports and GitHub Pull Requests (`gh pr create --attach`).
  SYNERGY: Pairs directly with `mate-threat` (Pillar T concurrency), `mate-explore` (Pillar E exploratory charters), and
  `mate-triage` (Day-2 root-cause failure classification and `npx mate-sdt bug` evidence).
---

# 🕵️‍♂️ Skill: Multi-Actor Sessions, Traces, Video & Evidence (`mate-pw-forensics`)

This skill governs **Phase 3 of `@playwright/cli` in M.A.T.E.**: using multi-session browser orchestration for **Pillar T concurrency attacks**, capturing **microsecond forensic traces and 60fps WebM videos** for **Pillar E charters and Day-2 Bug Reports**, and attaching visual proof to Pull Requests and issue trackers.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Companion (Pillar T)** | **`mate-threat`** | Uses named sessions (`playwright-cli -s=buyer-a`, `-s=buyer-b`) to execute race conditions, double-spends, and stale-state overwrites defined in `<threat_scenarios>`. |
| **Companion (Pillar E)** | **`mate-explore`** | Records traces (`tracing-start`) and annotated WebM videos (`video-start --cursor --fps=60`) during human/AI exploratory charters (`tests/charters/CHR-*.md`). |
| **Companion (Day-2 Ops)** | **`mate-triage`** | Analyzes `.playwright-cli/traces/` to classify CI failures into the 4 M.A.T.E. root-cause buckets and embeds screenshots/videos into `docs/bugs/BUG-*.md` (`npx mate-sdt bug`). |
| **Upstream** | **`mate-pw-recon` & `mate-pw-codegen`** | Triggered automatically whenever live story verification or automated test execution uncovers a real defect (`test.fail()`). |

---

## ⚡ 1. Quick Command Reference (`@playwright/cli`)

### Multi-Actor Named Sessions (Pillar T Concurrency)
```bash
# Launch two isolated browser sessions simultaneously
playwright-cli -s=actor1 open http://localhost:3000/checkout
playwright-cli -s=actor2 open http://localhost:3000/checkout

# Trigger concurrent actions across sessions
playwright-cli -s=actor1 click e10
playwright-cli -s=actor2 click e10

# List and clean up all active sessions
playwright-cli list
playwright-cli close-all
```

### Forensic Tracing (`tracing-start` / `tracing-stop`)
```bash
playwright-cli tracing-start
playwright-cli fill e4 "COUPON-100"
playwright-cli click e8
playwright-cli tracing-stop
# View trace: npx playwright show-trace .playwright-cli/traces/trace-<timestamp>.zip
```

### 60fps Video Recording with Chapters (`video-start` / `video-chapter`)
```bash
playwright-cli video-start docs/bugs/bug-repro.webm --cursor --fps=60
playwright-cli video-show-actions
playwright-cli video-chapter "BUG-01 Reproduction" --description="Violates INV-01" --duration=1800
playwright-cli click e8
playwright-cli video-stop
```

---

## 📚 Deep-Dive Reference Guides

Load these references on demand for multi-session setups, trace analysis, video recording, or PR attachments:
* **[Session Management & Multi-Actor Concurrency (`session-management.md`)](./references/session-management.md)** — Named sessions (`-s=`), persistent profiles, CDP/Extension attach, and multi-context Playwright test patterns.
* **[Execution Tracing & Forensic Triage (`tracing.md`)](./references/tracing.md)** — Capturing traces and classifying failures into M.A.T.E.'s 4 root-cause buckets (Locator Drift, Timing, Environment, Real Bug).
* **[Video Recording & Screencast Evidence (`video-recording.md`)](./references/video-recording.md)** — Recording 60fps WebM videos with action overlays and chapter cards without introducing `waitForTimeout` into test suites.
* **[Pull Request & Bug Report Attachments (`pr-attachments.md`)](./references/pr-attachments.md)** — Attaching screenshots, traces, and videos to GitHub PRs (`gh pr create --attach`) and M.A.T.E. Bug Reports.

---

## 🔄 Black-Box Handoff & Session Isolation

- **Separate Individual Histories:** Never pass raw multi-turn scratchpads or verbose upstream tool logs into this skill or out to downstream skills.
- **Consume & Emit `mate.handoff/v1`:** Read only the compressed upstream handoff digest + `npx mate-sdt context <module>` JIT pack, and advance stages via `npx mate-sdt session advance <flow-id> --stage=<next> --to=<skill> --digest="..."`.
- **Provenance & Hygiene:** Tag findings with `[BOOTSTRAPPED]`, `[USER_EXPLICIT]`, `[OBSERVED | ISO]`, `[INFERRED]`, or `[TBD]`; promote verified facts via `npx mate-sdt context <module> --consolidate`.

---

## 🔎 Targeted Single-Failure Recon for `npx mate-sdt heal`

- **ARIA Snapshot (`<= 800` tokens):** `npx playwright-cli open <url>` + `npx playwright-cli snapshot` scoped to the failing region.
- **Network & Trace Digest:** `npx playwright-cli network` + `tracing-start/stop` to isolate unawaited HTTP calls (`SYNC_OR_FLAKY_RACE`) vs. 500/invariant violations (`REAL_PRODUCT_BUG`).
