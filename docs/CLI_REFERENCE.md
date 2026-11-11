# 💻 CLI Reference (`mate-sdt`)

The `mate-sdt` command-line interface provides complete lifecycle tooling for Spec-Driven Testing (SDT).

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
Launches the interactive installer to scaffold directories, templates, and AI coding agent skills/rules.

```bash
npx mate-sdt install [options]
```

**Options:**
*   `-y, --yes`: Skip interactive prompts and use defaults.
*   `--mode <greenfield|brownfield|skills-only>`: Specify lifecycle mode.
*   `--ide <list>`: Comma-separated list of IDEs (`antigravity`, `claude`, `cursor`, `windsurf`, `copilot`, or `all`).
*   `--dir <path>`: Target directory (defaults to `.`).
*   `--no-starter`: Do not copy starter Playwright `.ts` templates or sample spec.

**Examples:**
```bash
# Interactive wizard
npx mate-sdt install

# Non-interactive CI/team bootstrap for Antigravity and Claude Code
npx mate-sdt install --yes --mode greenfield --ide antigravity,claude
```

---

### 2. `init [target-dir]`
Quickly scaffolds the standard M.A.T.E. folders, `MATE-PROJECT-MAP.md`, `specs/TEMPLATE_MATE_SPEC.md`, and `stryker.config.json` without prompting for IDE rules.

```bash
npx mate-sdt init
npx mate-sdt init ./my-service --no-starter
```

---

### 3. `validate [path]` (Alias: `lint`)
Validates a single `*.mate-spec.md` file or recursively validates all `*.mate-spec.md` files inside a directory (defaults to `./specs`).

**What it checks:**
1.  YAML frontmatter (`module`, `version`, `status` in `DRAFT | REVIEW | APPROVED | DEPRECATED`).
2.  Presence and non-emptiness of all 4 XML blocks:
    *   `<intent_model>`
    *   `<invariants>`
    *   `<threat_scenarios>`
    *   `<exploratory_charters>`
3.  **Pillar M Forbidden Transitions Rule:** Ensures `<intent_model>` explicitly declares forbidden/illegal transitions.
4.  **Pillar A Invariant IDs:** Checks for `INV-XX` identifiers inside `<invariants>`.

```bash
# Validate all specs in ./specs
npx mate-sdt validate

# Validate a specific module spec
npx mate-sdt validate specs/laundry-orders.mate-spec.md
```

Returns exit code `0` when all specs pass, or `1` when any validation error is found (ideal for CI/CD pull request gates).

---

### 4. `mutate [project-dir]`
Executes **Stryker Mutator** inside an ephemeral, rootless **Podman** container (`node:20-alpine`) mounting the project directory to `/app:Z`.

```bash
npx mate-sdt mutate
npx mate-sdt mutate --config custom-stryker.config.json
```

---

### 5. `charter <module-name>`
Generates a dated Exploratory Testing Charter (SBTM) in `tests/charters/CHR-YYYYMMDD-<module-name>.md`.

```bash
npx mate-sdt charter checkout-flow
```

---

### 6. `waiver <module-name>`
Generates a Formal Release Waiver in `specs/waivers/WVR-YYYY-<module-name>.md` required whenever a release verdict is `[CONCERNS]`.

```bash
npx mate-sdt waiver checkout-flow
```

---

### 7. `status [target-dir]` (Alias: `doctor`)
Audits the repository and prints a report of M.A.T.E. artifacts, installed AI IDE integrations, specification health, and Podman availability.

```bash
npx mate-sdt status
```
