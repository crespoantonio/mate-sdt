---
name: mate-threat
description: >-
  Specialist in Pillar T (Threat & Trash) of the M.A.T.E. Method. Designs and executes
  adversarial tests, fuzzing, race conditions, concurrency and idempotency suites, and
  governs Mutation Testing (Stryker Mutator) within ephemeral Podman containers.
---

# 💣 Pillar T Skill: Threat, Trash & Mutation Testing (`mate-threat`)

This skill is responsible for **Pillar T (Threat & Trash)** of the M.A.T.E. Method. Its purpose is to shatter the illusion of the happy path and expose software to real-world chaos before release.

---

## 📋 Responsibilities of `mate-threat`

1.  **Threat Modeling and Adversarial Scenarios:**  
    Inspects module specifications and discovers critical failure vectors:
    - **Concurrency & Race Conditions:** Simultaneous user actions, concurrent transactions executed in the exact same millisecond.
    - **Idempotency:** Automated network retries and duplicate webhooks (ensuring operations process exactly ONCE).
    - **Data Trash & Fuzzing:** Massive payloads, SQL/NoSQL/XSS injections, negative balances, non-standard Unicode strings, and corrupted ISO timestamp formats.
2.  **Mandatory Mutation Testing (Stryker Mutator):**  
    To guarantee that AI-authored test suites are not merely cosmetic checks that pass blindly, this skill mutates production code systematically:
    - Mutating boundary operators (`>` to `>=`, `&&` to `||`).
    - Stripping critical business validation statements.
    - Flipping boolean returns.
    - **M.A.T.E. Quality Threshold:** **Mutation Score >= 85%**. If surviving mutants exceed 15%, the pull request is rejected.
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
