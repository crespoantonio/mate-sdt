'use strict';

const fs = require('node:fs');
const path = require('node:path');

const AUDIT_RULES = [
  {
    code: 'MATE-ANTI-01',
    name: 'Arbitrary Sleep / Fixed Delay (Commandment #4)',
    severity: 'CRITICAL',
    penalty: 15,
    regex: /\b(waitForTimeout|Thread\.sleep|time\.sleep)\s*\(|page\.pause\s*\(/,
    remediation: 'Replace with event-driven synchronization or auto-retrying expect(locator) web assertions.',
    testFilesOnly: false,
  },
  {
    code: 'MATE-ANTI-02',
    name: 'Committed Focus Lock (.only)',
    severity: 'CRITICAL',
    penalty: 15,
    regex: /\b(test|describe|it)\.only\s*\(/,
    remediation: 'Remove .only() before committing so the full regression suite runs in CI.',
    testFilesOnly: true,
  },
  {
    code: 'MATE-ANTI-03',
    name: 'Dependency Inversion (DIP) Violation — Direct Page Object Instantiation',
    severity: 'HIGH',
    penalty: 5,
    regex: /\bnew\s+[A-Z][A-Za-z0-9_]*Page\s*\(/,
    remediation: 'Inject Page Objects via Playwright test.extend() fixtures instead of instantiating in test bodies.',
    testFilesOnly: true,
  },
  {
    code: 'MATE-ANTI-04',
    name: 'Cosmetic / Weak Oracle Assertion',
    severity: 'MEDIUM',
    penalty: 3,
    regex: /\.toBeDefined\s*\(\s*\)|\.not\.toBeNull\s*\(\s*\)/,
    remediation: 'Assert concrete business invariants, strict schemas, or exact state values instead of existence checks.',
    testFilesOnly: true,
  },
  {
    code: 'MATE-ANTI-05',
    name: 'Fragile Selector (Raw XPath or :nth-child)',
    severity: 'MEDIUM',
    penalty: 3,
    regex: /:nth-child\s*\(|locator\s*\(\s*['"`](\/\/|\(\/\/)/,
    remediation: 'Prefer semantic accessibility locators: getByRole, getByLabel, or getByTestId.',
    testFilesOnly: false,
  },
  {
    code: 'MATE-ANTI-06',
    name: 'Permissive Discrepancy Regex in Assertions (Silent Greenwashing)',
    severity: 'HIGH',
    penalty: 8,
    regex: /(?:toContainText|toHaveText|toHaveValue|toHaveTitle|toHaveURL)\s*\(\s*\/[^/]+\|[^/]+\/[a-z]*\s*\)/,
    remediation: 'Do not use permissive alternative regexes (/A|B/) to paper over copy/spec discrepancies. Escalate to the user: assert the exact requirement and use test.fail() if it is a defect, or update the spec if intentional.',
    testFilesOnly: true,
  },
];

function isScannableFile(fileName) {
  return /\.(spec|test)\.(ts|js|mjs|cjs|tsx|jsx)$|\.(ts|js)$|Test\.java$|^test_.*\.py$|_test\.py$/.test(
    fileName
  );
}

function isTestSpecFile(fileName) {
  return /\.(spec|test)\.(ts|js|mjs|cjs|tsx|jsx)$|Test\.java$|^test_.*\.py$|_test\.py$/.test(
    fileName
  );
}

function computeGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Scans tests/ and src/ in targetDir for M.A.T.E. anti-patterns and computes Health Score (A-F).
 * @param {string} targetDir
 */
function auditTestSuite(targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const dirsToScan = ['tests', 'src']
    .map((d) => path.join(resolved, d))
    .filter((d) => fs.existsSync(d));

  const filesToScan = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'reports' ||
        entry.name === 'test-results'
      ) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (isScannableFile(entry.name)) {
        filesToScan.push(fullPath);
      }
    }
  }

  for (const dir of dirsToScan) {
    walk(dir);
  }

  const findings = [];

  for (const filePath of filesToScan) {
    const fileName = path.basename(filePath);
    const isSpec = isTestSpecFile(fileName);
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      // Skip comments
      if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('#')
      ) {
        return;
      }

      for (const rule of AUDIT_RULES) {
        if (rule.testFilesOnly && !isSpec) continue;
        if (rule.regex.test(lineText)) {
          findings.push({
            file: path.relative(resolved, filePath).replace(/\\/g, '/'),
            line: idx + 1,
            code: rule.code,
            name: rule.name,
            severity: rule.severity,
            penalty: rule.penalty,
            snippet: trimmed.slice(0, 100),
            remediation: rule.remediation,
          });
        }
      }
    });
  }

  const totalPenalty = findings.reduce((acc, f) => acc + f.penalty, 0);
  const score = Math.max(0, 100 - totalPenalty);
  const grade = computeGrade(score);

  return {
    targetDir: resolved,
    filesScanned: filesToScan.length,
    score,
    grade,
    findings,
  };
}

module.exports = {
  AUDIT_RULES,
  auditTestSuite,
};
