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

## 4. Automated Publishing via GitHub Actions (Optional)

This repository includes `.github/workflows/publish.yml`. To publish automatically whenever you create a GitHub Release:
1.  On [npmjs.com](https://www.npmjs.com/), go to **Access Tokens** -> **Generate New Token** -> **Granular Access Token** (with Read and Write permissions for `mate-sdt`).
2.  In your GitHub repository (`crespoantonio/mate-sdt`), go to **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
3.  Name the secret `NPM_TOKEN` and paste your token.
4.  Whenever you publish a Release on GitHub, GitHub Actions will automatically run the test suite and publish the package to NPM with provenance!
