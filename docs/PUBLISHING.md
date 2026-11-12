# 📦 Publishing & Maintaining `mate-sdt` on NPM

This guide explains how `npx mate-sdt install` works under the hood and how to publish new versions of `mate-sdt` to the official NPM registry.

---

## 1. How `npx mate-sdt install` Works

When any developer runs `npx mate-sdt install` in their terminal:
1.  **NPM Registry Lookup:** `npx` queries `https://registry.npmjs.org/mate-sdt` and downloads the latest published tarball.
2.  **`bin` Execution:** NPM inspects the `"bin"` field in `package.json`:
    ```json
    "bin": {
      "mate-sdt": "./bin/mate-sdt.js",
      "mate": "./bin/mate-sdt.js"
    }
    ```
3.  **Zero-Dependency Speed:** Because `mate-sdt` uses only built-in Node.js modules (`node:fs`, `node:path`, `node:readline`, `node:child_process`), `npx` does not need to download dozens of third-party packages. It launches `./bin/mate-sdt.js` in less than a second and passes `install` as the first argument.

---

## 2. Publishing from Your Terminal (Step-by-Step)

### Step 1: Create an Account on NPM (If you don't have one)
1.  Go to [https://www.npmjs.com/signup](https://www.npmjs.com/signup) and create your free account.
2.  Enable Two-Factor Authentication (2FA) in your NPM account settings.

### Step 2: Log In via the Terminal
Inside your local `mate-sdt` repository, run:

```bash
npm login
```
This will press Enter to open your browser, authenticate your account, and store your session token in `~/.npmrc`.

Verify you are logged in:
```bash
npm whoami
```

### Step 3: Verify the Package Before Publishing
Run the build check, automated tests, and dry-run pack to inspect the exact files that will be uploaded:

```bash
npm run build
npm test
npm pack --dry-run
```

### Step 4: Publish to NPM!
Run:

```bash
npm publish --access public
```

*(Note: `prepublishOnly` in `package.json` automatically runs `npm run build && npm test` before every publish so broken builds can never be published accidentally.)*

Once `npm publish --access public` finishes, anyone in the world can immediately run:
```bash
npx mate-sdt install
```

---

## 3. Releasing Updates (New Versions)

NPM requires every published update to have a higher Semantic Version (`major.minor.patch`):

*   **Patch release (`1.0.0` -> `1.0.1`)** for bug fixes or documentation tweaks:
    ```bash
    npm version patch
    git push && git push --tags
    npm publish
    ```
*   **Minor release (`1.0.1` -> `1.1.0`)** for new CLI commands, IDE integrations, or templates:
    ```bash
    npm version minor
    git push && git push --tags
    npm publish
    ```
*   **Major release (`1.1.0` -> `2.0.0`)** for breaking changes to the spec standard or CLI:
    ```bash
    npm version major
    git push && git push --tags
    npm publish
    ```

---

## 4. Automated Publishing via GitHub Actions with OIDC Trusted Publishing (Recommended for npm v12+)

As of npm v12, long-lived **2FA-bypass Granular Access Tokens (GATs)** are deprecated for automated publishing and replaced by **Trusted Publishing (OIDC — OpenID Connect)**. With OIDC, you **do not need to create or store an `NPM_TOKEN` secret** in GitHub!

This repository includes `.github/workflows/publish.yml` pre-configured with `id-token: write` and `--provenance`.

### How to Enable OIDC Trusted Publishing on npmjs.com:
1.  **Publish the first version (`v1.7.0`) interactively from your terminal** (`npm login` + `npm publish --access public`) so the `mate-sdt` package exists on npmjs.com.
2.  On [npmjs.com](https://www.npmjs.com/), open your package **`mate-sdt`** -> go to **Settings** -> **Publishing access** -> **Trusted publishing (Add a new provider)**.
3.  Select **GitHub Actions** and fill in:
    *   **Organization or user:** `crespoantonio`
    *   **Repository:** `mate-sdt`
    *   **Workflow filename:** `publish.yml`
    *   **Environment name:** *(leave empty unless you use a dedicated GitHub environment)*
4.  Save with your interactive 2FA prompt.
5.  From now on, whenever you publish a **Release** on GitHub, `.github/workflows/publish.yml` automatically authenticates via OIDC (zero static tokens!) and publishes the package with cryptographic provenance.

---

## 5. Why `mate-sdt` Is 100% Compatible with npm v12 Install-Time Security Defaults

npm v12 disables `preinstall`/`install`/`postinstall` lifecycle scripts (`allowScripts: false`), git dependencies (`--allow-git: none`), and remote tarball dependencies (`--allow-remote: none`) by default.
*   `mate-sdt` has **zero third-party runtime dependencies** (`dependencies` is empty, using only built-in Node.js modules).
*   `mate-sdt` uses **zero install-time lifecycle scripts** (it uses `"bin"` executables invoked explicitly via `npx mate-sdt`, and `"prepublishOnly"` which only runs locally on the maintainer's machine before publishing).
*   Users on npm v12+ can run `npx mate-sdt init` cleanly with zero security warnings or `npm approve-scripts` prompts.
