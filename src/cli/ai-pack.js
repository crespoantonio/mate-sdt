'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { copyDirRecursive, writeFileIfMissing, normalizeIdeName } = require('./ide-scaffold');

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

const AI_SKILL_NAMES = [
  'mate-ai-dataset',
  'mate-ai-evals',
  'mate-ai-redteam',
  'mate-ai-observability',
];

const AI_WORKFLOW_NAMES = ['mate-flow-ai-agent'];

/**
 * Generates an AI Dataset Discovery Sheet (5-Dimension Socratic Interview + 5 Seeds)
 * and a Promptfoo/DeepEval-compatible Golden Dataset JSON file.
 */
function generateAiDataset(moduleName = 'agent', targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (moduleName || 'agent')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);

  const datasetsDir = path.join(resolved, 'tests', 'ai-evals', 'datasets');
  fs.mkdirSync(datasetsDir, { recursive: true });

  const discoveryDest = path.join(datasetsDir, `DS-${safeName}-discovery.md`);
  const jsonDest = path.join(datasetsDir, `DS-${safeName}.json`);

  const discoveryTemplate = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-ai-dataset',
    'resources',
    'dataset-discovery.template.md'
  );
  const jsonTemplate = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-ai-dataset',
    'resources',
    'golden-dataset.template.json'
  );

  const discoveryContent = fs
    .readFileSync(discoveryTemplate, 'utf8')
    .replace(/\{\{MODULE\}\}/g, safeName)
    .replace(/\{\{DATE\}\}/g, today);

  const jsonContent = fs
    .readFileSync(jsonTemplate, 'utf8')
    .replace(/\{\{MODULE\}\}/g, safeName)
    .replace(/\{\{DATE\}\}/g, today);

  fs.writeFileSync(discoveryDest, discoveryContent, 'utf8');
  fs.writeFileSync(jsonDest, jsonContent, 'utf8');

  return { discoveryDest, jsonDest };
}

/**
 * Installs the on-demand M.A.T.E. AI Quality Pack:
 *   - 4 Synergistic AI Skills (mate-ai-dataset, mate-ai-evals, mate-ai-redteam, mate-ai-observability)
 *   - 1 E2E Workflow (/mate-flow-ai-agent)
 *   - Promptfoo, DeepEval, and OpenTelemetry/OpenInference Trace Auditor starter files
 *   - package.json evaluation scripts (eval:promptfoo, eval:redteam, eval:deepeval, eval:traces)
 */
function setupAiQualityPack(targetDir = '.', options = {}, ensureGitignoreFn = null) {
  const resolved = path.resolve(targetDir);
  const rawIdes = options.ides || ['antigravity', 'claude', 'cursor', 'windsurf', 'copilot'];
  const ides = rawIdes.map(normalizeIdeName);
  const created = [];

  // 1. Create AI Evaluation Directory Structure
  const aiDirs = [
    'tests/ai-evals/datasets',
    'tests/ai-evals/promptfoo',
    'tests/ai-evals/deepeval',
    'tests/ai-evals/traces',
  ];
  for (const rel of aiDirs) {
    fs.mkdirSync(path.join(resolved, rel), { recursive: true });
    created.push(`${rel}/`);
  }

  // 2. Install the 4 AI Skills & 1 AI Workflow across selected IDEs
  if (ides.includes('antigravity') || ides.includes('all')) {
    const skillsDestRoot = path.join(resolved, '.agents', 'skills');
    fs.mkdirSync(skillsDestRoot, { recursive: true });
    for (const sName of AI_SKILL_NAMES) {
      const srcDir = path.join(PACKAGE_ROOT, 'skills', sName);
      if (fs.existsSync(srcDir)) {
        copyDirRecursive(srcDir, path.join(skillsDestRoot, sName));
        created.push(`.agents/skills/${sName}`);
      }
    }
    for (const wf of AI_WORKFLOW_NAMES) {
      const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wf}.md`);
      if (fs.existsSync(wfSrc)) {
        const destWfSkillDir = path.join(skillsDestRoot, wf);
        fs.mkdirSync(destWfSkillDir, { recursive: true });
        fs.copyFileSync(wfSrc, path.join(destWfSkillDir, 'SKILL.md'));
        created.push(`.agents/skills/${wf}`);
      }
    }
    const wfDest = path.join(resolved, '.agent', 'workflows', 'mate');
    fs.mkdirSync(wfDest, { recursive: true });
    for (const wf of AI_WORKFLOW_NAMES) {
      const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wf}.md`);
      if (fs.existsSync(wfSrc)) {
        fs.copyFileSync(wfSrc, path.join(wfDest, `${wf}.md`));
        created.push(`.agent/workflows/mate/${wf}.md`);
      }
    }
  }

  if (ides.includes('claude') || ides.includes('all')) {
    const commandsDir = path.join(resolved, '.claude', 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    for (const sName of AI_SKILL_NAMES) {
      const skillDir = path.join(PACKAGE_ROOT, 'skills', sName);
      const skillMd = path.join(skillDir, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        fs.copyFileSync(skillMd, path.join(commandsDir, `${sName}.md`));
        created.push(`.claude/commands/${sName}.md`);
      }
      copyDirRecursive(skillDir, path.join(resolved, '.claude', 'skills', sName));
    }
    for (const wf of AI_WORKFLOW_NAMES) {
      const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wf}.md`);
      if (fs.existsSync(wfSrc)) {
        fs.copyFileSync(wfSrc, path.join(commandsDir, `${wf}.md`));
        created.push(`.claude/commands/${wf}.md`);
      }
      const wfSkillDir = path.join(resolved, '.claude', 'skills', wf);
      fs.mkdirSync(wfSkillDir, { recursive: true });
      fs.copyFileSync(wfSrc, path.join(wfSkillDir, 'SKILL.md'));
      created.push(`.claude/skills/${wf}`);
    }
  }

  if (ides.includes('cursor') || ides.includes('all')) {
    const rulesDir = path.join(resolved, '.cursor', 'rules');
    fs.mkdirSync(rulesDir, { recursive: true });
    for (const sName of AI_SKILL_NAMES) {
      const skillMd = path.join(PACKAGE_ROOT, 'skills', sName, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        const body = fs.readFileSync(skillMd, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '');
        const mdc = [
          '---',
          `description: M.A.T.E. AI Quality Pack (${sName}) rule`,
          'globs: tests/ai-evals/**/*,specs/**/*.mate-spec.md',
          'alwaysApply: false',
          '---',
          '',
          body.trim(),
          '',
        ].join('\n');
        fs.writeFileSync(path.join(rulesDir, `${sName}.mdc`), mdc, 'utf8');
        created.push(`.cursor/rules/${sName}.mdc`);
      }
    }
  }

  if (ides.includes('windsurf') || ides.includes('all')) {
    const rulesDir = path.join(resolved, '.windsurf', 'rules');
    const workflowsDir = path.join(resolved, '.windsurf', 'workflows');
    fs.mkdirSync(rulesDir, { recursive: true });
    fs.mkdirSync(workflowsDir, { recursive: true });
    for (const sName of AI_SKILL_NAMES) {
      const skillMd = path.join(PACKAGE_ROOT, 'skills', sName, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        const body = fs.readFileSync(skillMd, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '');
        const ruleContent = [
          '---',
          'trigger: model_decision',
          `description: M.A.T.E. AI Quality Pack (${sName}) rule`,
          'globs: tests/ai-evals/**/*,specs/**/*.mate-spec.md',
          '---',
          '',
          body.trim(),
          '',
        ].join('\n');
        fs.writeFileSync(path.join(rulesDir, `${sName}.md`), ruleContent, 'utf8');
        created.push(`.windsurf/rules/${sName}.md`);
      }
    }
    for (const wf of AI_WORKFLOW_NAMES) {
      const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wf}.md`);
      if (fs.existsSync(wfSrc)) {
        fs.copyFileSync(wfSrc, path.join(workflowsDir, `${wf}.md`));
        created.push(`.windsurf/workflows/${wf}.md`);
      }
    }
  }

  if (ides.includes('copilot') || ides.includes('all')) {
    const promptsDir = path.join(resolved, '.github', 'prompts');
    fs.mkdirSync(promptsDir, { recursive: true });
    for (const sName of AI_SKILL_NAMES) {
      const skillMd = path.join(PACKAGE_ROOT, 'skills', sName, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        const body = fs.readFileSync(skillMd, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '').trim();
        fs.writeFileSync(path.join(promptsDir, `${sName}.prompt.md`), body + '\n', 'utf8');
        created.push(`.github/prompts/${sName}.prompt.md`);
      }
    }
    for (const wf of AI_WORKFLOW_NAMES) {
      const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wf}.md`);
      if (fs.existsSync(wfSrc)) {
        const body = fs.readFileSync(wfSrc, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '').trim();
        fs.writeFileSync(path.join(promptsDir, `${wf}.prompt.md`), body + '\n', 'utf8');
        created.push(`.github/prompts/${wf}.prompt.md`);
      }
    }
  }

  // 3. Copy Starter Templates
  const dsRes = generateAiDataset('agent', resolved);
  created.push(
    path.relative(resolved, dsRes.discoveryDest).replace(/\\/g, '/'),
    path.relative(resolved, dsRes.jsonDest).replace(/\\/g, '/')
  );

  const templateMappings = [
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-evals', 'resources', 'promptfooconfig.template.yaml'),
      dest: 'tests/ai-evals/promptfoo/promptfooconfig.yaml',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-evals', 'resources', 'memory-eval.promptfoo.template.yaml'),
      dest: 'tests/ai-evals/promptfoo/memory-eval.promptfoo.yaml',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-redteam', 'resources', 'redteam.promptfoo.template.yaml'),
      dest: 'tests/ai-evals/promptfoo/redteam.promptfoo.yaml',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-redteam', 'resources', 'memory-redteam.promptfoo.template.yaml'),
      dest: 'tests/ai-evals/promptfoo/memory-redteam.promptfoo.yaml',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-evals', 'resources', 'test_agent_deepeval.template.py'),
      dest: 'tests/ai-evals/deepeval/test_agent_deepeval.py',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-evals', 'resources', 'memory_eval.template.py'),
      dest: 'tests/ai-evals/deepeval/test_memory_eval.py',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-observability', 'resources', 'otel_trace_auditor.template.ts'),
      dest: 'tests/ai-evals/traces/otel_trace_auditor.js',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-observability', 'resources', 'memory_trace_auditor.template.ts'),
      dest: 'tests/ai-evals/traces/memory_trace_auditor.js',
    },
    {
      src: path.join(PACKAGE_ROOT, 'skills', 'mate-ai-dataset', 'resources', 'golden-memory-set.template.json'),
      dest: 'tests/ai-evals/datasets/DS-memory-golden.json',
    },
  ];

  for (const tm of templateMappings) {
    const destFull = path.join(resolved, tm.dest);
    if (fs.existsSync(tm.src) && writeFileIfMissing(destFull, fs.readFileSync(tm.src, 'utf8'), false)) {
      created.push(tm.dest);
    }
  }

  const sampleTraceDest = path.join(resolved, 'tests', 'ai-evals', 'traces', 'sample-trace.json');
  const sampleTracePayload = {
    trace_id: 'otel-trace-ord-1042',
    duration_ms: 1420,
    sla: { max_steps: 5, max_tokens: 3500, max_latency_ms: 8000, forbidden_tools: ['issue_refund', 'delete_user'] },
    spans: [
      {
        span_id: 'span-01',
        name: 'vector_db_search',
        kind: 'RETRIEVAL',
        attributes: {
          'retrieval.documents': [{ id: 'doc-shipping-01', score: 0.92, text: 'Order ORD-1042 is IN_TRANSIT via FedEx.' }],
        },
      },
      {
        span_id: 'span-02',
        name: 'get_order_status',
        kind: 'TOOL',
        attributes: {
          'tool.name': 'get_order_status',
          'tool.parameters': { order_id: 'ORD-1042' },
        },
      },
      {
        span_id: 'span-03',
        name: 'gpt-4o-mini-synthesis',
        kind: 'LLM',
        attributes: {
          'gen_ai.usage.input_tokens': 310,
          'gen_ai.usage.output_tokens': 95,
        },
      },
    ],
  };
  if (writeFileIfMissing(sampleTraceDest, `${JSON.stringify(sampleTracePayload, null, 2)}\n`, false)) {
    created.push('tests/ai-evals/traces/sample-trace.json');
  }

  // 4. Add AI Evaluation scripts to package.json
  const pkgPath = path.join(resolved, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name !== 'mate-sdt') {
        pkg.scripts = pkg.scripts || {};
        const aiScripts = {
          'eval:promptfoo': 'npx promptfoo@latest eval -c tests/ai-evals/promptfoo/promptfooconfig.yaml',
          'eval:redteam': 'npx promptfoo@latest redteam run -c tests/ai-evals/promptfoo/redteam.promptfoo.yaml',
          'eval:deepeval': 'deepeval test run tests/ai-evals/deepeval/test_agent_deepeval.py',
          'eval:traces': 'node tests/ai-evals/traces/otel_trace_auditor.js',
          'mate:dataset': 'mate-sdt dataset',
        };
        let modified = false;
        for (const [k, v] of Object.entries(aiScripts)) {
          if (!pkg.scripts[k]) {
            pkg.scripts[k] = v;
            modified = true;
          }
        }
        if (modified) {
          fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
          created.push('package.json (added AI Evals, RedTeam & OTel Trace scripts)');
        }
      }
    } catch {
      // Ignore malformed package.json
    }
  }

  if (typeof ensureGitignoreFn === 'function') {
    ensureGitignoreFn(resolved);
  }

  return { targetDir: resolved, created };
}

module.exports = {
  AI_SKILL_NAMES,
  AI_WORKFLOW_NAMES,
  generateAiDataset,
  setupAiQualityPack,
};
