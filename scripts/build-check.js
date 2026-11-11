'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validateSpecFile } = require('../src/cli/validator');

const ROOT = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
  'package.json',
  'README.md',
  'MANIFESTO.md',
  'LICENSE',
  'bin/mate-sdt.js',
  'src/cli/ui.js',
  'src/cli/validator.js',
  'src/cli/installer.js',
  'templates/TEMPLATE_MATE_SPEC.md',
  'skills/mate-core/SKILL.md',
  'skills/mate-core/scripts/init_mate_project.py',
  'skills/mate-core/resources/MATE-PROJECT-MAP.template.md',
  'skills/mate-model/SKILL.md',
  'skills/mate-model/scripts/validate_mate_spec.py',
  'skills/mate-model/examples/sample-order-lifecycle.mate-spec.md',
  'skills/mate-assert-playwright/SKILL.md',
  'skills/mate-assert-playwright/resources/base-page.template.ts',
  'skills/mate-assert-playwright/resources/component.template.ts',
  'skills/mate-assert-playwright/resources/fixtures.template.ts',
  'skills/mate-threat/SKILL.md',
  'skills/mate-threat/resources/stryker.config.json',
  'skills/mate-threat/scripts/run_mutation_podman.py',
  'skills/mate-explore/SKILL.md',
  'skills/mate-explore/resources/charter.template.md',
  'skills/mate-explore/resources/release-waiver.template.md',
];

console.log('🧉 Running M.A.T.E. SDT Package Build & Integrity Check...\n');

let hasErrors = false;

for (const rel of REQUIRED_FILES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    console.error(`❌ Missing required package file: ${rel}`);
    hasErrors = true;
  } else {
    console.log(`  ✔ Verified: ${rel}`);
  }
}

// Ensure CLI executable has Unix LF line endings for cross-platform #!/usr/bin/env node compatibility
const binPath = path.join(ROOT, 'bin/mate-sdt.js');
const binRaw = fs.readFileSync(binPath, 'utf8');
if (binRaw.includes('\r\n')) {
  fs.writeFileSync(binPath, binRaw.replace(/\r\n/g, '\n'), 'utf8');
  console.log('  ✔ Normalized bin/mate-sdt.js line endings to LF');
} else {
  console.log('  ✔ Verified bin/mate-sdt.js uses LF line endings');
}

// Validate Golden Sample Spec and Template Spec
const sampleSpec = path.join(ROOT, 'skills/mate-model/examples/sample-order-lifecycle.mate-spec.md');
const templateSpec = path.join(ROOT, 'templates/TEMPLATE_MATE_SPEC.md');

for (const specPath of [sampleSpec, templateSpec]) {
  const res = validateSpecFile(specPath);
  if (!res.valid) {
    console.error(`❌ Spec validation failed for ${path.relative(ROOT, specPath)}:`);
    for (const err of res.errors) {
      console.error(`   - ${err}`);
    }
    hasErrors = true;
  } else {
    console.log(`  ✔ Validated Spec: ${path.relative(ROOT, specPath)}`);
  }
}

if (hasErrors) {
  console.error('\n❌ Build check FAILED.');
  process.exit(1);
}

console.log('\n✅ Build check PASSED! Package is ready for distribution.');
