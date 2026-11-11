# 💻 CLI Reference (`mate-sdt`)

The `mate-sdt` command-line interface provides complete lifecycle tooling for Spec-Driven Testing (SDT), Day-2 QA operations, and containerized quality gates.

---

## Global Usage

```bash
npx mate-sdt <command> [options]
```

Once installed locally or globally (`npm install -D mate-sdt` or `npm install -g mate-sdt`), you can also use the short alias `mate`:

```bash
npx mate status
```

---

## Commands

### 1. `install` (Default Command)
Launches the interactive installer to scaffold directories, templates, **10 AI agent skills** (including `mate-playwright-cli`), and **5 E2E workflows**, with optional automatic installation of `@playwright/cli` and `@playwright/test`.

```bash
npx mate-sdt install [options]
```

**Options:**
*   `-y, --yes`: Skip interactive prompts and use defaults.
*   `--mode <greenfield|brownfield|skills-only>`: Specify lifecycle mode.
*   `--ide <list>`: Comma-separated list of IDEs (`antigravity`, `claude`, `cursor`, `windsurf`, `copilot`, or `all`).
*   `--dir <path>`: Target directory (defaults to `.`).
*   `--with-playwright-cli`: Automatically install `@playwright/cli@latest` and `@playwright/test@latest` via npm.
*   `--no-starter`: Do not copy starter Playwright/API/k6 templates or sample spec.

---

### 2. `init [target-dir]`
Quickly scaffolds the standard M.A.T.E. folders, `MATE-PROJECT-MAP.md`, `specs/TEMPLATE_MATE_SPEC.md`, and `stryker.config.json` without prompting for IDE rules.

```bash
npx mate-sdt init
```

---

### 2b. `setup-playwright [target-dir]` (Alias: `playwright`)
Installs `@playwright/cli@latest` and `@playwright/test@latest` into the target project and configures `.gitignore` with `.playwright-cli/`, `playwright/.auth/`, and `*.auth-state.json`.

```bash
npx mate-sdt setup-playwright
```

---

### 3. `validate [path]` (Alias: `lint`)
Validates a single `*.mate-spec.md` file or recursively validates all `*.mate-spec.md` files inside a directory (defaults to `./specs`).

```bash
npx mate-sdt validate
npx mate-sdt validate specs/laundry-orders.mate-spec.md
```

---

### 4. `audit [target-dir]`
Scans `tests/` and `src/` for M.A.T.E. anti-patterns (`waitForTimeout`, `Thread.sleep`, `time.sleep`, `.only` focus locks, direct `new *Page()` DIP violations, weak `toBeDefined()` assertions, and raw XPath/`:nth-child` selectors) and calculates a deterministic **Health Score (`A` to `F`)**.

```bash
npx mate-sdt audit
```

Returns exit code `1` if any `CRITICAL` anti-pattern (`MATE-ANTI-01` arbitrary sleep or `MATE-ANTI-02` `.only` lock) is detected.

---

### 5. `mutate [project-dir]`
Executes **Stryker Mutator** inside an ephemeral, rootless **Podman** container (`node:20-alpine`) mounting the project directory to `/app:Z` and enforcing a `>= 85%` Mutation Score.

```bash
npx mate-sdt mutate
```

---

### 6. `k6 [script-path]`
Executes a **Grafana k6** performance test script inside an ephemeral, rootless **Podman** container (`grafana/k6:latest`) to validate `<performance_oracles>` SLAs.

```bash
npx mate-sdt k6 tests/nfr/order-load.k6.js
```

---

### 7. `charter <module-name>`
Generates a dated Exploratory Testing Charter (SBTM) in `tests/charters/CHR-YYYYMMDD-<module-name>.md`.

```bash
npx mate-sdt charter checkout-flow
```

---

### 8. `bug <module-name>`
Generates a Structured Bug Report in `tests/bugs/BUG-YYYYMMDD-<module-name>.md` explicitly linked to the violated M.A.T.E. specification clause (`INV-XX`, Forbidden Transition, or `THR-XX`).

```bash
npx mate-sdt bug checkout-flow
```

---

### 9. `waiver <module-name>`
Generates a Formal Release Waiver in `specs/waivers/WVR-YYYY-<module-name>.md` required whenever a release verdict is `[CONCERNS]`.

```bash
npx mate-sdt waiver checkout-flow
```

---

### 10. `status [target-dir]` (Alias: `doctor`)
Audits the repository and prints a full report of M.A.T.E. artifacts, installed AI IDE integrations, specification health, Test Suite Health Score (`A`–`F`), and Podman availability.

```bash
npx mate-sdt status
```
