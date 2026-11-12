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
  'src/cli/harness.js',
  'src/cli/installer.js',
  'docs/CONTEXT_AND_HARNESS_ENGINEERING.md',
  'docs/AI_AGENT_AND_RAG_TESTING.md',
  'docs/SUBAGENTS_AND_PARALLEL_EXECUTION.md',
  'templates/TEMPLATE_MATE_SPEC.md',
  'templates/standalone/playwright.config.template.ts',
  'templates/standalone/tsconfig.template.json',
  'templates/standalone/env.example.template',
  'templates/standalone/github-workflow.template.yml',
  // 16 Synergistic M.A.T.E. Skills
  'skills/mate-core/SKILL.md',
  'skills/mate-core/scripts/init_mate_project.py',
  'skills/mate-core/resources/MATE-PROJECT-MAP.template.md',
  'skills/mate-core/references/handling-uncertainty.md',
  'skills/mate-core/references/polyglot-stacks-java-python.md',
  'skills/mate-party/SKILL.md',
  'skills/mate-party/references/party-moderation-guide.md',
  'skills/mate-party/resources/party-verdict.template.md',
  'skills/mate-help/SKILL.md',
  'skills/mate-help/references/framework-faq-and-scenarios.md',
  'skills/mate-strategy/SKILL.md',
  'skills/mate-strategy/resources/test-strategy.template.md',
  'skills/mate-strategy/resources/test-plan.template.md',
  'skills/mate-strategy/references/qa-maturity-playbooks.md',
  'skills/mate-strategy/references/strategy-discovery-questions.md',
  'skills/mate-story-testcases/SKILL.md',
  'skills/mate-story-testcases/references/mcp-and-file-ingestion.md',
  'skills/mate-story-testcases/references/legacy-manual-migration.md',
  'skills/mate-story-testcases/references/story-discovery-questions.md',
  'skills/mate-story-testcases/resources/test-cases.template.md',
  'skills/mate-story-testcases/resources/test-cases.template.csv',
  'skills/mate-model/SKILL.md',
  'skills/mate-model/scripts/validate_mate_spec.py',
  'skills/mate-model/examples/sample-order-lifecycle.mate-spec.md',
  'skills/mate-model/references/live-page-reconnaissance.md',
  'skills/mate-pw-recon/SKILL.md',
  'skills/mate-pw-recon/references/live-story-verification.md',
  'skills/mate-pw-recon/references/network-api-discovery.md',
  'skills/mate-pw-recon/references/element-attributes.md',
  'skills/mate-pw-recon/references/running-code.md',
  'skills/mate-assert-playwright/SKILL.md',
  'skills/mate-assert-playwright/resources/base-page.template.ts',
  'skills/mate-assert-playwright/resources/component.template.ts',
  'skills/mate-assert-playwright/resources/fixtures.template.ts',
  'skills/mate-pw-codegen/SKILL.md',
  'skills/mate-pw-codegen/references/test-generation.md',
  'skills/mate-pw-codegen/references/storage-state.md',
  'skills/mate-pw-codegen/references/request-mocking.md',
  'skills/mate-pw-codegen/references/playwright-tests.md',
  'skills/mate-pw-forensics/SKILL.md',
  'skills/mate-pw-forensics/references/session-management.md',
  'skills/mate-pw-forensics/references/tracing.md',
  'skills/mate-pw-forensics/references/video-recording.md',
  'skills/mate-pw-forensics/references/pr-attachments.md',
  'skills/mate-assert-api/SKILL.md',
  'skills/mate-assert-api/resources/base-api-client.template.ts',
  'skills/mate-threat/SKILL.md',
  'skills/mate-threat/resources/stryker.config.json',
  'skills/mate-threat/scripts/run_mutation_podman.py',
  'skills/mate-performance-k6/SKILL.md',
  'skills/mate-performance-k6/resources/k6-load.template.js',
  'skills/mate-explore/SKILL.md',
  'skills/mate-explore/references/exploratory-discovery-questions.md',
  'skills/mate-explore/resources/charter.template.md',
  'skills/mate-explore/resources/release-waiver.template.md',
  'skills/mate-triage/SKILL.md',
  'skills/mate-triage/resources/bug-report.template.md',
  'skills/mate-triage/resources/triage-report.template.md',
  'skills/mate-maintenance/SKILL.md',
  'skills/mate-maintenance/resources/maintenance-report.template.md',
  // 7 E2E Workflows + 1 On-Demand AI Agent Workflow
  'workflows/mate-flow-zero-to-one.md',
  'workflows/mate-flow-user-story.md',
  'workflows/mate-flow-greenfield.md',
  'workflows/mate-flow-brownfield.md',
  'workflows/mate-flow-api-contract.md',
  'workflows/mate-flow-performance.md',
  'workflows/mate-flow-triage.md',
  'workflows/mate-flow-ai-agent.md',
  // 4 On-Demand AI Quality Pack Skills (Promptfoo + DeepEval + OTel Observability)
  'skills/mate-ai-dataset/SKILL.md',
  'skills/mate-ai-dataset/references/socratic-dataset-interview.md',
  'skills/mate-ai-dataset/resources/dataset-discovery.template.md',
  'skills/mate-ai-dataset/resources/golden-dataset.template.json',
  'skills/mate-ai-evals/SKILL.md',
  'skills/mate-ai-evals/references/promptfoo-agent-guide.md',
  'skills/mate-ai-evals/references/deepeval-rag-and-agents.md',
  'skills/mate-ai-evals/resources/promptfooconfig.template.yaml',
  'skills/mate-ai-evals/resources/test_agent_deepeval.template.py',
  'skills/mate-ai-redteam/SKILL.md',
  'skills/mate-ai-redteam/references/owasp-llm-and-agentic-threats.md',
  'skills/mate-ai-redteam/resources/redteam.promptfoo.template.yaml',
  'skills/mate-ai-observability/SKILL.md',
  'skills/mate-ai-observability/references/otel-openinference-langfuse-phoenix.md',
  'skills/mate-ai-observability/resources/otel_trace_auditor.template.ts',
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
