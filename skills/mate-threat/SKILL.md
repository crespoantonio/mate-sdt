---
name: mate-threat
description: >-
  Specialist in Pillar T (Threat, Concurrency, Fuzzing & Mutation Testing) of the M.A.T.E. Method.
  USE WHEN: Designing or executing adversarial tests in `tests/threats/` (race conditions, double-spend
  concurrency, webhook idempotency, payload fuzzing, SQLi/XSS), or running Stryker Mutator (`>= 85%` mutation
  score) inside rootless Podman containers (`npx mate-sdt mutate`).
  SYNERGY: Pairs with `mate-pw-forensics` (for multi-actor browser sessions `-s=actor1`, `-s=actor2`), receives
  `<threat_scenarios>` from `mate-model`, and hands off uncovered vulnerabilities to `mate-triage`.
---

# 💣 Pillar T Skill: Threat, Trash & Mutation Testing (`mate-threat`)

This skill is responsible for **Pillar T (Threat & Trash)** of the M.A.T.E. Method. Its purpose is to shatter the illusion of the happy path and expose software to real-world chaos before release.

---

## 🔗 Skill Synergy & Handoff Protocol

| Direction | Skill | How They Work Together |
| :--- | :--- | :--- |
| **Upstream** | **`mate-model` & `mate-story-testcases`** | Supplies `<threat_scenarios>` (`THR-01..THR-NN`) and `STATE_TRANSITION` / concurrency test cases. |
| **Companion (Multi-Actor CLI)** | **`mate-pw-forensics`** | Launches simultaneous isolated browser sessions (`playwright-cli -s=buyer-a`, `-s=buyer-b`) to probe UI race conditions and stale-state overwrites interactively. |
| **Companion (API Layer)** | **`mate-assert-api`** | Uses `Promise.all()` with typed `BaseApiClient` instances to fire parallel HTTP mutations in the exact same millisecond. |
| **Downstream (Defects)** | **`mate-triage`** | Any vulnerability or surviving mutant that exposes a security/integrity flaw is logged via `npx mate-sdt bug` and kept in `tests/threats/` with `test.fail()`. |

---

## 📋 Responsibilities of `mate-threat`

1.  **Threat Modeling and Adversarial Scenarios (`tests/threats/`):**  
    Inspects module specifications and discovers critical failure vectors:
    - **Concurrency & Race Conditions:** Simultaneous user actions, concurrent transactions executed in the exact same millisecond.
    - **Idempotency:** Automated network retries and duplicate webhooks (ensuring operations process exactly ONCE).
    - **Data Trash & Fuzzing:** Massive payloads, SQL/NoSQL/XSS injections, negative balances, non-standard Unicode strings, and corrupted ISO timestamp formats.
2.  **Dual-Mode Pillar T Governance (White-Box Monorepo vs. Black-Box Standalone QA Repo):**  
    - **Mode A — White-Box / Integrated Repository (App source code present):**  
      Executes **Stryker Mutator** against production business logic (`>= 85%` Mutation Score threshold) inside rootless **Podman** containers (`npx mate-sdt mutate`) to guarantee that automated tests catch subtle boundary and boolean mutations.
    - **Mode B — Black-Box / Standalone QA Repository (QA sits in a separate folder outside Front/Back):**  
      When application source code is not in the QA repository, Pillar T enforces **Black-Box Adversarial & Chaos Verification** (`npm run test:threats`):
      - Multi-actor concurrent browser sessions (`playwright-cli -s=actor1`, `-s=actor2` via `mate-pw-forensics`).
      - Parallel API race-condition bursts (`Promise.all` with `BaseApiClient`).
      - Double-submit & webhook idempotency verification.
      - Boundary & payload fuzzing (`SQLi`, `XSS`, negative numbers, Unicode overflow, malformed JSON).
      - *(Optional)* If the frontend/backend repo is cloned in a sibling folder on disk, mount it into Stryker via `npx mate-sdt mutate --dir ../backend-repo`.
3.  **Isolated Execution in Ephemeral Podman Containers:**  
    All destructive tests, stress scenarios, and mutation test runs must execute inside a rootless, isolated **Podman** container:
    ```bash
    podman run --rm -v $(pwd):/app -w /app node:20-alpine npx stryker run
    ```
    This ensures zero contamination of the host machine and guarantees 100% reproducible results in CI/CD pipelines.

---

## ⚡ CLI & Mutation Resources

*   **CLI Podman Mutation Runner:** Run `npx mate-sdt mutate` to launch containerized Stryker mutation testing effortlessly.
*   **Official Stryker Config:** [`resources/stryker.config.json`](./resources/stryker.config.json) (preconfigured with `>=85%` breaking threshold).
*   **Python Podman Runner Script:** Execute [`scripts/run_mutation_podman.py`](./scripts/run_mutation_podman.py):
    ```bash
    python skills/mate-threat/scripts/run_mutation_podman.py /path/to/project
    ```
