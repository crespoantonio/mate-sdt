# 🤝 Contributing to M.A.T.E. Method (`mate-sdt`)

Thank you for your interest in contributing to the **M.A.T.E. Method — Spec-Driven Testing (SDT) Framework**!

---

## 🛠️ Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mate-sdt/mate-sdt.git
   cd mate-sdt
   ```
2. **Verify package integrity and run the automated test suite:**
   ```bash
   npm run build
   npm test
   ```
3. **Test the CLI locally:**
   ```bash
   node ./bin/mate-sdt.js --help
   node ./bin/mate-sdt.js validate
   ```

---

## 📏 Engineering Standards

Because this repository is the reference implementation of the **M.A.T.E. Method**, all contributions must adhere to our core engineering rules:

1. **Zero Runtime Dependencies for the CLI:** Keep `bin/` and `src/cli/` built strictly on standard Node.js (`>= 18`) built-in modules (`node:fs`, `node:path`, `node:readline`, `node:child_process`) so `npx mate-sdt install` remains instantaneous and free of supply-chain bloat.
2. **100% English Documentation & Templates:** All documentation, skill definitions (`SKILL.md`), templates, and CLI outputs must be written in clear, idiomatic English.
3. **Spec Compliance:** Any new example or template specification must pass `node ./bin/mate-sdt.js validate`.
4. **Automated Tests:** Every new CLI feature or validator rule must include unit/integration coverage in `tests/cli.test.js`.

---

## 🔄 Pull Request Process

1. Fork the repository and create your branch from `main` (`git checkout -b feat/your-feature`).
2. Ensure `npm run build` and `npm test` pass with zero errors.
3. Open a Pull Request describing the intent, invariants verified, and any CLI behavior changes.
