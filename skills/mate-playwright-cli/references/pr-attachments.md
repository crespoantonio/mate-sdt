# Pull Request & Bug Report Visual Attachments in M.A.T.E.

Attach screenshots, WebM recordings, and Playwright traces captured with `playwright-cli` to GitHub Pull Requests, Issues, and M.A.T.E. Bug Reports (`docs/mate/bugs/`).

---

## 1. Capturing Visual Proof Before Opening a PR or Bug Report

When adding a new Page Object / E2E spec (`mate-flow-greenfield` / `mate-flow-brownfield`) or triaging a defect (`mate-flow-triage`), capture deterministic visual evidence:

```bash
# Capture a full-page or viewport screenshot
playwright-cli open http://localhost:3000/checkout
playwright-cli screenshot --filename=.playwright-cli/checkout-verified.png

# Or record a short WebM clip showing the invariant holding (or failing)
playwright-cli video-start .playwright-cli/checkout-invariant-demo.webm --cursor --fps=60
playwright-cli video-show-actions
playwright-cli click e5
playwright-cli video-stop

playwright-cli close
```

---

## 2. Attaching Visuals to GitHub Pull Requests (`gh` CLI)

Use the GitHub CLI (`gh`) to upload local screenshots or WebM recordings and reference them in the PR body or comments:

### Creating a Pull Request with Visual Evidence

```bash
gh pr create \
  --title "test(checkout): automate INV-01..INV-04 E2E & security specs" \
  --attach .playwright-cli/checkout-verified.png \
  --attach .playwright-cli/checkout-invariant-demo.webm \
  --body "## Summary
- Added \`CheckoutPage\` (\`src/pages/checkout.page.ts\`) and \`OrderSummaryComponent\` (\`src/components/order-summary.component.ts\`)
- Registered classes in \`MATE-PROJECT-MAP.md\` and \`src/fixtures/mate.fixtures.ts\`
- Automated Invariants \`[INV-01]\` through \`[INV-04]\` in \`tests/e2e/checkout.spec.ts\`

## Visual Verification
![Checkout Verified](checkout-verified.png)
![Checkout Invariant Demo](checkout-invariant-demo.webm)"
```

### Adding Evidence to an Existing PR or Issue

```bash
gh pr comment 42 \
  --attach .playwright-cli/bug-repro.webm \
  --body "Attached reproduction video for \`BUG-042\` captured via \`playwright-cli\`:\n\n![Bug Repro](bug-repro.webm)"
```

---

## 3. Embedding Evidence in M.A.T.E. Bug Reports (`docs/mate/bugs/`)

When generating a bug report via `npx mate-sdt bug <id> "<title>"`, store or link the captured artifacts in the **Visual & Forensic Evidence** section of `docs/mate/bugs/<id>-<slug>.md`:

```markdown
## 5. Visual & Forensic Evidence
- **Screenshot:** `docs/mate/bugs/assets/bug-042-negative-total.png`
- **Video Recording:** `docs/mate/bugs/assets/bug-042-repro.webm`
- **Playwright Trace:** `.playwright-cli/traces/trace-2026-04-12T15-30-00.zip` (`npx playwright show-trace <path>`)
- **Violated Invariant:** `[INV-03]` (Order total must never be negative)
```

---

## 4. Clean Repository Hygiene

Keep temporary CLI captures out of git commits unless intentionally stored under `docs/mate/bugs/assets/`:

- Ensure `.playwright-cli/`, `test-results/`, `playwright-report/`, and `*.auth-state.json` are present in `.gitignore`.
- Clean up temporary `.webm` and `.png` files after uploading them to the Pull Request or issue tracker.
