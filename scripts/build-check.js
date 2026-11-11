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
  'src/cli/auditor.js',
  'src/cli/installer.js',
  'templates/TEMPLATE_MATE_SPEC.md',
  // 9 M.A.T.E. Skills
  'skills/mate-core/SKILL.md',
  'skills/mate-core/scripts/init_mate_project.py',
  'skills/mate-core/resources/MATE-PROJECT-MAP.template.md',
  'skills/mate-core/references/handling-uncertainty.md',
  'skills/mate-core/references/polyglot-stacks-java-python.md',
  'skills/mate-model/SKILL.md',
  'skills/mate-model/scripts/validate_mate_spec.py',
  'skills/mate-model/examples/sample-order-lifecycle.mate-spec.md',
  'skills/mate-model/references/live-page-reconnaissance.md',
  'skills/mate-assert-playwright/SKILL.md',
  'skills/mate-assert-playwright/resources/base-page.template.ts',
  'skills/mate-assert-playwright/resources/component.template.ts',
  'skills/mate-assert-playwright/resources/fixtures.template.ts',
  'skills/mate-playwright-cli/SKILL.md',
  'skills/mate-playwright-cli/references/element-attributes.md',
  'skills/mate-playwright-cli/references/playwright-tests.md',
  'skills/mate-playwright-cli/references/pr-attachments.md',
  'skills/mate-playwright-cli/references/request-mocking.md',
  'skills/mate-playwright-cli/references/running-code.md',
  'skills/mate-playwright-cli/references/session-management.md',
  'skills/mate-playwright-cli/references/storage-state.md',
  'skills/mate-playwright-cli/references/test-generation.md',
  'skills/mate-playwright-cli/references/tracing.md',
  'skills/mate-playwright-cli/references/video-recording.md',
  'skills/mate-assert-api/SKILL.md',
  'skills/mate-assert-api/resources/base-api-client.template.ts',
  'skills/mate-threat/SKILL.md',
  'skills/mate-threat/resources/stryker.config.json',
  'skills/mate-threat/scripts/run_mutation_podman.py',
  'skills/mate-performance-k6/SKILL.md',
  'skills/mate-performance-k6/resources/k6-load.template.js',
  'skills/mate-explore/SKILL.md',
  'skills/mate-explore/resources/charter.template.md',
  'skills/mate-explore/resources/release-waiver.template.md',
  'skills/mate-triage/SKILL.md',
  'skills/mate-triage/resources/bug-report.template.md',
  'skills/mate-triage/resources/triage-report.template.md',
  'skills/mate-maintenance/SKILL.md',
  'skills/mate-maintenance/resources/maintenance-report.template.md',
  // 5 E2E Workflows
  'workflows/mate-flow-greenfield.md',
  'workflows/mate-flow-brownfield.md',
  'workflows/mate-flow-api-contract.md',
  'workflows/mate-flow-performance.md',
  'workflows/mate-flow-triage.md',
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
