'use strict';

const fs = require('node:fs');
const path = require('node:path');

const LAYER_RANKS = [
  { layer: 'models', rank: 1, match: /\/src\/models\// },
  { layer: 'api', rank: 2, match: /\/src\/api\// },
  { layer: 'components', rank: 2, match: /\/src\/components\// },
  { layer: 'pages', rank: 3, match: /\/src\/pages\// },
  { layer: 'fixtures', rank: 4, match: /\/src\/fixtures\// },
  { layer: 'tests', rank: 5, match: /\/tests\// },
];

const MAX_PAGE_OBJECT_LINES = 300;

function detectLayer(filePath) {
  const norm = `/${filePath.replace(/\\/g, '/').toLowerCase()}`;
  for (const entry of LAYER_RANKS) {
    if (entry.match.test(norm)) return entry;
  }
  return null;
}

function detectImportedLayer(specifier, fromFile, resolvedRoot) {
  if (!specifier.startsWith('.')) {
    const normSpec = specifier.replace(/\\/g, '/').toLowerCase();
    for (const entry of LAYER_RANKS) {
      if (normSpec.includes(`/${entry.layer}/`) || normSpec.startsWith(`${entry.layer}/`)) {
        return entry;
      }
    }
    return null;
  }
  const resolvedTarget = path.resolve(path.dirname(fromFile), specifier);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  return detectLayer(rel);
}

function formatRemediationLint(finding) {
  return [
    `[SELF-CORRECTION][GATE-04][${finding.code}] File: ${finding.file}:${finding.line}`,
    `Violation: ${finding.name}${finding.snippet ? ` (${finding.snippet})` : ''}`,
    'Golden Principle: Code must follow forward-only layers (models -> api/components -> pages -> fixtures -> tests).',
    `Remediation: ${finding.remediation}`,
  ].join('\n');
}

const AUDIT_RULES = [
  {
    code: 'MATE-ANTI-01',
    name: 'Arbitrary Sleep / Fixed Delay (Commandment #4)',
    severity: 'CRITICAL',
    penalty: 15,
    regex: /\b(waitForTimeout|Thread\.sleep|time\.sleep)\s*\(|page\.pause\s*\(|setTimeout\s*\([^,]+,\s*\d+/,
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
    penalty: 10,
    regex: /\bnew\s+[A-Z][A-Za-z0-9_]*Page\s*\(/,
    remediation: 'Export the Page Object from `src/fixtures/mate.fixtures.ts` via `test.extend()` and inject it into the test signature.',
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
  {
    code: 'MATE-ANTI-07',
    name: 'Hardcoded Single-Case Assertion in Page Object (Bloated PO Smell)',
    severity: 'MEDIUM',
    penalty: 4,
    regex: /async\s+assert[A-Za-z0-9]*(?:Duplicate|Strict|Missing|Invalid)[A-Za-z0-9]*\s*\(\s*\)/,
    remediation: 'Do not hardcode single-case assertions in Page Objects. Parametrize them (e.g. assertAlertMessage(expected)) and expose public readonly Locators for expect.soft() flexibility.',
    pageObjectsOnly: true,
  },
  {
    code: 'MATE-ANTI-08',
    name: 'Raw page.locator() Hardcoded Inside Test Spec',
    severity: 'HIGH',
    penalty: 10,
    regex: /\bpage\.locator\s*\(/,
    remediation: 'Move selector definitions into a Page Object (`src/pages/`) or Component Object (`src/components/`) and expose semantic actions/locators.',
    testFilesOnly: true,
  },
  {
    code: 'MATE-TASTE-02',
    name: 'Untyped `any` Usage in Boundary Models/APIs',
    severity: 'HIGH',
    penalty: 8,
    regex: /:\s*any\b|\bas\s+any\b|<any>/,
    remediation: 'Replace `any` with strict TypeScript interfaces/schemas and boundary validation.',
    modelsOrApiOnly: true,
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

function isPageObjectFile(filePath) {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();
  return (
    norm.includes('/pages/') ||
    norm.endsWith('.page.ts') ||
    norm.endsWith('.page.js')
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
    const relPath = path.relative(resolved, filePath).replace(/\\/g, '/');
    const isSpec = isTestSpecFile(fileName);
    const isPageObject = isPageObjectFile(filePath);
    const fileLayer = detectLayer(relPath);
    const isModelsOrApi = Boolean(fileLayer && (fileLayer.layer === 'models' || fileLayer.layer === 'api'));
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

    // Taste Invariant: Page Object file-size ceiling (<= 300 lines)
    if (isPageObject && lines.length > MAX_PAGE_OBJECT_LINES) {
      const f = {
        file: relPath,
        line: lines.length,
        code: 'MATE-TASTE-01',
        name: `Page Object exceeds ${MAX_PAGE_OBJECT_LINES}-line ceiling (${lines.length} lines)`,
        severity: 'HIGH',
        penalty: 8,
        snippet: `${lines.length} lines > ${MAX_PAGE_OBJECT_LINES}`,
        remediation: 'Extract cohesive widgets or sections into reusable BaseComponent subclasses under `src/components/`.',
      };
      f.formatted = formatRemediationLint(f);
      findings.push(f);
    }

    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      // Skip comments and pure string-literal template lines
      if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith("'") ||
        trimmed.startsWith('"') ||
        trimmed.startsWith('`')
      ) {
        return;
      }

      // Forward-Only Dependency Direction check (models -> api/components -> pages -> fixtures -> tests)
      if (fileLayer) {
        const importMatch =
          trimmed.match(/^(?:import|export)\s+.*?\bfrom\s+['"]([^'"]+)['"]/) ||
          trimmed.match(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (importMatch) {
          const importedLayer = detectImportedLayer(importMatch[1], filePath, resolved);
          if (importedLayer && importedLayer.rank > fileLayer.rank) {
            const f = {
              file: relPath,
              line: idx + 1,
              code: 'LAYER_VIOLATION',
              name: `Backward layer import from '${fileLayer.layer}' (L${fileLayer.rank}) to '${importedLayer.layer}' (L${importedLayer.rank})`,
              severity: 'CRITICAL',
              penalty: 15,
              snippet: trimmed.slice(0, 100),
              remediation: `Move shared contract/helper to '${fileLayer.layer}' or an earlier layer; never import '${importedLayer.layer}' from '${fileLayer.layer}'.`,
            };
            f.formatted = formatRemediationLint(f);
            findings.push(f);
          }
        }
      }

      // Ad-hoc helper function in tests/ instead of src/fixtures/ or src/components/
      if (isSpec && /^(?:async\s+)?function\s+[a-zA-Z0-9_]+\s*\(/.test(trimmed)) {
        const f = {
          file: relPath,
          line: idx + 1,
          code: 'MATE-TASTE-03',
          name: 'Ad-hoc helper function defined inside test spec',
          severity: 'MEDIUM',
          penalty: 5,
          snippet: trimmed.slice(0, 100),
          remediation: 'Move reusable test helpers into `src/fixtures/` or `src/components/` so specs stay declarative.',
        };
        f.formatted = formatRemediationLint(f);
        findings.push(f);
      }

      for (const rule of AUDIT_RULES) {
        if (rule.testFilesOnly && !isSpec) continue;
        if (rule.pageObjectsOnly && !isPageObject) continue;
        if (rule.modelsOrApiOnly && !isModelsOrApi) continue;
        if (rule.regex.test(lineText)) {
          const f = {
            file: relPath,
            line: idx + 1,
            code: rule.code,
            name: rule.name,
            severity: rule.severity,
            penalty: rule.penalty,
            snippet: trimmed.slice(0, 100),
            remediation: rule.remediation,
          };
          f.formatted = formatRemediationLint(f);
          findings.push(f);
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
  LAYER_RANKS,
  MAX_PAGE_OBJECT_LINES,
  AUDIT_RULES,
  detectLayer,
  formatRemediationLint,
  auditTestSuite,
};
