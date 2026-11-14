'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_BLOCKS = [
  'intent_model',
  'invariants',
  'threat_scenarios',
  'exploratory_charters',
];

const ALLOWED_STATUSES = ['DRAFT', 'REVIEW', 'APPROVED', 'DEPRECATED'];

/**
 * Validates a single *.mate-spec.md file against the M.A.T.E. standard.
 * @param {string} filePath
 * @returns {{ valid: boolean, filePath: string, errors: string[], warnings: string[] }}
 */
function validateSpecFile(filePath) {
  const resolved = path.resolve(filePath);
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(resolved)) {
    return {
      valid: false,
      filePath: resolved,
      errors: [`Specification file not found: ${resolved}`],
      warnings: [],
    };
  }

  const content = fs.readFileSync(resolved, 'utf8');

  // 1. Validate YAML Frontmatter
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    errors.push('Missing YAML frontmatter block (--- ... ---) at the top of the file.');
  } else {
    const fmText = fmMatch[1];
    for (const field of ['module', 'version', 'status']) {
      const fieldRegex = new RegExp(`^${field}\\s*:\\s*\\S+`, 'm');
      if (!fieldRegex.test(fmText)) {
        errors.push(`Frontmatter is missing required field: '${field}'`);
      }
    }

    const statusMatch = fmText.match(/^status\s*:\s*(\w+)/m);
    if (statusMatch) {
      const status = statusMatch[1].toUpperCase();
      if (!ALLOWED_STATUSES.includes(status)) {
        errors.push(
          `Invalid status '${status}'. Must be one of: ${ALLOWED_STATUSES.join(', ')}`
        );
      }
    }
  }

  // 2. Validate mandatory XML semantic blocks
  for (const block of REQUIRED_BLOCKS) {
    const openTag = `<${block}>`;
    const closeTag = `</${block}>`;
    if (!content.includes(openTag) || !content.includes(closeTag)) {
      errors.push(`Missing required XML semantic block: ${openTag}...${closeTag}`);
    } else {
      const inner = content.split(openTag)[1].split(closeTag)[0].trim();
      if (inner.length < 30) {
        warnings.push(`Block '${block}' appears unusually short or under-specified.`);
      }
    }
  }

  // 3. Pillar M Rule: Check for Explicit Forbidden Transitions in <intent_model>
  if (content.includes('<intent_model>') && content.includes('</intent_model>')) {
    const intentText = content.split('<intent_model>')[1].split('</intent_model>')[0];
    const forbiddenPatterns = [/forbidden/i, /prohibid/i, /illegal/i, /never allow/i];
    const hasForbidden = forbiddenPatterns.some((rx) => rx.test(intentText));
    if (!hasForbidden) {
      errors.push(
        "Pillar M violation: <intent_model> must explicitly declare 'Forbidden Transitions' to prevent security and business logic exploits."
      );
    }
  }

  // 4. Pillar A Rule: Check Invariant IDs in <invariants>
  if (content.includes('<invariants>') && content.includes('</invariants>')) {
    const invText = content.split('<invariants>')[1].split('</invariants>')[0];
    if (!/INV-\d+/i.test(invText)) {
      warnings.push(
        'No standard invariant IDs (e.g., INV-01, INV-02) detected inside <invariants> block.'
      );
    }
  }

  const remediations = errors.map((err) => {
    let hint = 'Ensure the specification follows `templates/TEMPLATE_MATE_SPEC.md` and `docs/SPEC_STANDARD.md`.';
    if (err.includes('YAML frontmatter')) {
      hint = 'Add YAML frontmatter (`---\\nmodule: <name>\\nversion: 1.0.0\\nstatus: DRAFT\\n---`) at line 1.';
    } else if (err.includes('Forbidden Transitions')) {
      hint = 'Add an explicit `Forbidden Transitions` subsection inside `<intent_model>` listing illegal state jumps.';
    } else if (err.includes('missing required field')) {
      hint = 'Include `module`, `version`, and `status` in YAML frontmatter.';
    } else if (err.includes('XML semantic block')) {
      hint = 'Include all 4 required XML blocks: `<intent_model>`, `<invariants>`, `<threat_scenarios>`, and `<exploratory_charters>`.';
    }
    return [
      `[SELF-CORRECTION][GATE-02][SPEC_VIOLATION] File: ${resolved}`,
      `Violation: ${err}`,
      'Golden Principle: Pillar M requires deterministic FSMs, Forbidden Transitions, and numbered INV-XX invariants.',
      `Remediation: ${hint}`,
    ].join('\n');
  });

  return {
    valid: errors.length === 0,
    filePath: resolved,
    errors,
    warnings,
    remediations,
  };
}

/**
 * Finds and validates all *.mate-spec.md files in a directory or a single file path.
 * @param {string} targetPath
 * @returns {{ allValid: boolean, results: Array<ReturnType<typeof validateSpecFile>> }}
 */
function validateTarget(targetPath) {
  const resolved = path.resolve(targetPath);
  if (!fs.existsSync(resolved)) {
    return {
      allValid: false,
      results: [
        {
          valid: false,
          filePath: resolved,
          errors: [`Path does not exist: ${resolved}`],
          warnings: [],
        },
      ],
    };
  }

  const stat = fs.statSync(resolved);
  if (stat.isFile()) {
    const res = validateSpecFile(resolved);
    return { allValid: res.valid, results: [res] };
  }

  const specFiles = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.mate-spec.md')) {
        specFiles.push(fullPath);
      }
    }
  }
  walk(resolved);

  if (specFiles.length === 0) {
    return {
      allValid: false,
      results: [
        {
          valid: false,
          filePath: resolved,
          errors: [`No *.mate-spec.md files found inside ${resolved}`],
          warnings: [],
        },
      ],
    };
  }

  const results = specFiles.map((file) => validateSpecFile(file));
  const allValid = results.every((r) => r.valid);
  return { allValid, results };
}

module.exports = {
  REQUIRED_BLOCKS,
  ALLOWED_STATUSES,
  validateSpecFile,
  validateTarget,
};
