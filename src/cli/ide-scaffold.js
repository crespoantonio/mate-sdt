'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

const SKILL_NAMES = [
  'mate-core',
  'mate-party',
  'mate-help',
  'mate-strategy',
  'mate-story-testcases',
  'mate-model',
  'mate-pw-recon',
  'mate-assert-playwright',
  'mate-pw-codegen',
  'mate-pw-forensics',
  'mate-assert-api',
  'mate-threat',
  'mate-performance-k6',
  'mate-explore',
  'mate-triage',
  'mate-maintenance',
];

const WORKFLOW_NAMES = [
  'mate-flow-zero-to-one',
  'mate-flow-user-story',
  'mate-flow-greenfield',
  'mate-flow-brownfield',
  'mate-flow-api-contract',
  'mate-flow-performance',
  'mate-flow-triage',
];

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function writeFileIfMissing(targetPath, content, overwrite = false) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  if (fs.existsSync(targetPath) && !overwrite) {
    return false;
  }
  fs.writeFileSync(targetPath, content, 'utf8');
  return true;
}

/**
 * Normalizes an IDE identifier to standard internal keys:
 * 'antigravity', 'claude', 'cursor', 'windsurf', 'copilot', 'codex', 'all'
 */
function normalizeIdeName(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (['antigravity', 'antigravity-ide', 'antigravity-cli', 'agy', 'gemini'].includes(s)) {
    return 'antigravity';
  }
  if (['claude', 'claude-code', 'claudecode'].includes(s)) {
    return 'claude';
  }
  if (['cursor', 'cursor-ide'].includes(s)) {
    return 'cursor';
  }
  if (['windsurf', 'cascade'].includes(s)) {
    return 'windsurf';
  }
  if (['copilot', 'github-copilot'].includes(s)) {
    return 'copilot';
  }
  if (['codex', 'openai-codex', 'agents', 'universal'].includes(s)) {
    return 'codex';
  }
  return s;
}

/**
 * Installs M.A.T.E. skills, workflows, and configurations for Google Antigravity IDE / agy CLI
 */
function installAntigravity(targetDir) {
  const skillsDestRoot = path.join(targetDir, '.agents', 'skills');
  fs.mkdirSync(skillsDestRoot, { recursive: true });
  const installed = [];

  // 1. Install Core 16 Skills into .agents/skills/<skillName>/
  for (const skillName of SKILL_NAMES) {
    const srcSkillDir = path.join(PACKAGE_ROOT, 'skills', skillName);
    const destSkillDir = path.join(skillsDestRoot, skillName);
    if (fs.existsSync(srcSkillDir)) {
      copyDirRecursive(srcSkillDir, destSkillDir);
      installed.push(`.agents/skills/${skillName}`);
    }
  }

  // 2. Install E2E Workflows as First-Class Antigravity Skills (.agents/skills/<wfName>/SKILL.md)
  for (const wfName of WORKFLOW_NAMES) {
    const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wfName}.md`);
    if (fs.existsSync(wfSrc)) {
      const destWfSkillDir = path.join(skillsDestRoot, wfName);
      fs.mkdirSync(destWfSkillDir, { recursive: true });
      fs.copyFileSync(wfSrc, path.join(destWfSkillDir, 'SKILL.md'));
      installed.push(`.agents/skills/${wfName}`);
    }
  }

  // 3. Backward-compatible fallback: also install into .agent/workflows/mate/
  const workflowsDest = path.join(targetDir, '.agent', 'workflows', 'mate');
  fs.mkdirSync(workflowsDest, { recursive: true });
  for (const wfName of WORKFLOW_NAMES) {
    const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wfName}.md`);
    if (fs.existsSync(wfSrc)) {
      fs.copyFileSync(wfSrc, path.join(workflowsDest, `${wfName}.md`));
      installed.push(`.agent/workflows/mate/${wfName}.md`);
    }
  }

  // 4. Ensure .agent/skills.json registers .agents/skills
  const agentConfigPath = path.join(targetDir, '.agent', 'skills.json');
  fs.mkdirSync(path.dirname(agentConfigPath), { recursive: true });

  let config = { entries: [] };
  if (fs.existsSync(agentConfigPath)) {
    try {
      config = JSON.parse(fs.readFileSync(agentConfigPath, 'utf8'));
      if (!Array.isArray(config.entries)) config.entries = [];
    } catch {
      config = { entries: [] };
    }
  }

  const hasEntry = config.entries.some((e) => e && e.path === '.agents/skills');
  if (!hasEntry) {
    config.entries.push({ path: '.agents/skills' });
    fs.writeFileSync(agentConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }
  installed.push('.agent/skills.json');

  return installed;
}

/**
 * Installs M.A.T.E. slash commands, Agent Skills (.claude/skills/), and CLAUDE.md rules for Anthropic Claude Code
 */
function installClaudeCode(targetDir) {
  const commandsDir = path.join(targetDir, '.claude', 'commands');
  const skillsDestRoot = path.join(targetDir, '.claude', 'skills');
  fs.mkdirSync(commandsDir, { recursive: true });
  fs.mkdirSync(skillsDestRoot, { recursive: true });
  const installed = [];

  for (const skillName of SKILL_NAMES) {
    const skillDir = path.join(PACKAGE_ROOT, 'skills', skillName);
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
      const claudeSkillDest = path.join(skillsDestRoot, skillName);
      copyDirRecursive(skillDir, claudeSkillDest);
      installed.push(`.claude/skills/${skillName}`);

      const content = fs.readFileSync(skillMdPath, 'utf8');
      const cmdFile = path.join(commandsDir, `${skillName}.md`);
      fs.writeFileSync(cmdFile, content, 'utf8');
      installed.push(`.claude/commands/${skillName}.md`);
    }
  }

  for (const wfName of WORKFLOW_NAMES) {
    const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wfName}.md`);
    if (fs.existsSync(wfSrc)) {
      const content = fs.readFileSync(wfSrc, 'utf8');
      const cmdFile = path.join(commandsDir, `${wfName}.md`);
      fs.writeFileSync(cmdFile, content, 'utf8');
      installed.push(`.claude/commands/${wfName}.md`);

      const wfSkillDir = path.join(skillsDestRoot, wfName);
      fs.mkdirSync(wfSkillDir, { recursive: true });
      fs.writeFileSync(path.join(wfSkillDir, 'SKILL.md'), content, 'utf8');
      installed.push(`.claude/skills/${wfName}`);
    }
  }

  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  const mateSection = [
    '',
    '<!-- MATE-SDT-START -->',
    '## 🧉 M.A.T.E. Method — Harness & Context Engineering Map',
    '',
    '> *Humans steer. Agents execute.* (`Agent = Model + Harness + Knowledge`)',
    '',
    '### 1. Progressive Disclosure Routing (Where to Look Next)',
    '- **Open-Ended / "Where do I start?":** Activate `mate-party` (Council of QA Experts).',
    '- **User Stories & Acceptance Criteria:** Generate 4-Quadrant Matrix: `npx mate-sdt cases <module>`.',
    '- **Pasted Stack Trace / Failure / "Fix this":** Activate `mate-triage` + `npx mate-sdt heal` (`/mate-flow-triage`).',
    '- **Framework Coaching:** Activate `mate-help` (`/mate-help`).',
    '- **Task Execution & Map Governance:** Activate `mate-core` and read `MATE-PROJECT-MAP.md` (`< 3,000` tokens).',
    '- **Quality Scorecard & Tech Debt:** Read `docs/QUALITY_SCORE.md` & `.mate/exec-plans/tech-debt-tracker.md`.',
    '- **Active Execution Plans:** Create plan in `.mate/exec-plans/active/<name>.md` (move to `completed/` when done).',
    '',
    '### 2. Zero-Assumption Escalation & Sub-Agent Delegation Protocols',
    '- **Zero-Assumption & Open-Question Escalation ("Ask, Never Guess"):** Inspect local/live context first. Never invent business thresholds, auth boundaries, or requirements. Tag unknowns `[TBD: <exact question>]` under `## Open Questions for Human QA`, finish unblocked work, and halt on `STATUS: BLOCKED_ON_USER_INPUT` (`GATE-01`/`GATE-02`) to ask the human.',
    '- **Sub-Agent Delegation & 3-Phase Pipeline Isolation:** Build scoped sub-agent prompts via `npx mate-sdt context <module> --subagent <skill>`. Isolate Reader/Extractor -> Spec Scorer -> Code Writer -> Independent Reviewer (`mate-review`/`mate-audit`) via `mate.handoff/v1` (or `--compact` fallback in single-agent IDEs).',
    '',
    '### 3. Forward-Only 6-Layer Architecture & Guardrails',
    '- **Strict Dependency Direction:** `src/models/` (no `any`) -> `src/api/` & `src/components/` -> `src/pages/` (`<= 300` lines) -> `src/fixtures/` (`test.extend`) -> `tests/**/*.spec.ts`.',
    '- **Test-Design-First Mandate (`MATE-INVARIANT-08`):** Never write `.spec.ts` automation (including smoke suites) without FIRST generating `docs/test-cases/TC-[module].md` and `.csv` (`mate-story-testcases` / `npx mate-sdt cases <module>`) with the Automate vs. Manual vs. Exploratory decision engine. Automated tests without test cases fail `GATE-02`.',
    '- **FORBIDDEN IN SPECS (MATE-ANTI-08 & MATE-ANTI-03 CRITICAL):** Zero `page.locator()`, `page.getBy*()`, `page.goto()`, or direct `page.fill/click/selectOption()` inside specs. All UI interactions must be encapsulated in Page/Component Objects. If a page lacks a Page Object, create it first under `src/pages/*.page.ts`! Zero `new SomePage(page)`, zero `waitForTimeout()`, and zero `.only()`.',
    '- **Anti-Greenwashing (`MATE-ANTI-06`):** Never delete/weaken failing assertions or use permissive regexes (`/A|B/`). Keep failing tests with `test.fail(true, "BUG-XXX")` and file `docs/bugs/BUG-*.md` (`npx mate-sdt bug <mod>`).',
    '',
    '### 4. Active `.mate/` Directory Protocol & Verification Commands',
    '- **Execution Plans:** For any multi-step task, create `.mate/exec-plans/active/<name>.md` with `- [ ]` tasks and move to `completed/` when verified.',
    '- **Context Hygiene & Scratchpads:** Never dump raw exploratory logs or HTML dumps into project root or `docs/`. Store transient findings in `.mate/scratchpad-<module>.md`. Run `npx mate-sdt context <module>` for phase-scoped JIT packs (`< 2,000` tokens).',
    '- **Closed-Loop Verification & GC:** Run `npx mate-sdt gate --loop` (persisting state in `.mate/harness-state.json`) and `npx mate-sdt gc` (updating `.mate/exec-plans/tech-debt-tracker.md` & `docs/QUALITY_SCORE.md`) before concluding any turn. Execute `mutate`/`k6` inside rootless Podman.',
    '<!-- MATE-SDT-END -->',
    '',
  ].join('\n');

  if (fs.existsSync(claudeMdPath)) {
    const existing = fs.readFileSync(claudeMdPath, 'utf8');
    if (existing.includes('<!-- MATE-SDT-START -->')) {
      const updated = existing.includes('<!-- MATE-SDT-END -->')
        ? existing.replace(
            /<!-- MATE-SDT-START -->[\s\S]*?<!-- MATE-SDT-END -->/,
            mateSection.trim()
          )
        : existing.replace(/<!-- MATE-SDT-START -->[\s\S]*/, mateSection.trim());
      fs.writeFileSync(claudeMdPath, updated, 'utf8');
    } else if (existing.includes('M.A.T.E. Method — Context Engineering')) {
      fs.writeFileSync(claudeMdPath, `# Project Instructions\n${mateSection}`, 'utf8');
    } else {
      fs.writeFileSync(claudeMdPath, `${existing.trimEnd()}\n${mateSection}`, 'utf8');
    }
  } else {
    fs.writeFileSync(claudeMdPath, `# Project Instructions\n${mateSection}`, 'utf8');
  }
  installed.push('CLAUDE.md');

  return installed;
}

/**
 * Installs M.A.T.E. .mdc rules for Cursor IDE
 */
function installCursor(targetDir) {
  const rulesDir = path.join(targetDir, '.cursor', 'rules');
  fs.mkdirSync(rulesDir, { recursive: true });
  const installed = [];

  const globsMap = {
    'mate-core': '**/*',
    'mate-help': '**/*',
    'mate-strategy': 'docs/**/*.md,MATE-PROJECT-MAP.md',
    'mate-story-testcases': 'docs/test-cases/**/*,specs/**/*.mate-spec.md',
    'mate-model': 'specs/**/*.mate-spec.md,MATE-PROJECT-MAP.md',
    'mate-pw-recon': 'specs/**/*.mate-spec.md,docs/test-cases/**/*,src/pages/**/*.ts,src/components/**/*.ts',
    'mate-assert-playwright': 'tests/e2e/**/*.ts,src/pages/**/*.ts,src/components/**/*.ts,src/fixtures/**/*.ts',
    'mate-pw-codegen': 'tests/e2e/**/*.ts,src/pages/**/*.ts,src/components/**/*.ts,src/mocks/**/*.ts,src/fixtures/**/*.ts',
    'mate-pw-forensics': 'tests/threats/**/*.ts,tests/charters/**/*.md,docs/bugs/**/*.md',
    'mate-assert-api': 'tests/api/**/*.ts,src/api/**/*.ts,src/models/**/*.ts',
    'mate-threat': 'tests/threats/**/*.ts,stryker.config.json',
    'mate-performance-k6': 'tests/nfr/**/*.js,tests/nfr/**/*.ts',
    'mate-explore': 'tests/charters/**/*.md,specs/waivers/**/*.md',
    'mate-triage': 'docs/bugs/**/*.md,MATE-PROJECT-MAP.md',
    'mate-maintenance': 'tests/**/*.ts,src/**/*.ts',
  };

  for (const skillName of SKILL_NAMES) {
    const skillMdPath = path.join(PACKAGE_ROOT, 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;
    const raw = fs.readFileSync(skillMdPath, 'utf8');
    const body = raw.replace(/^---[\s\S]*?---\r?\n/, '');
    const mdcContent = [
      '---',
      `description: M.A.T.E. Method (${skillName}) Spec-Driven Testing rule`,
      `globs: ${globsMap[skillName] || '**/*'}`,
      `alwaysApply: ${skillName === 'mate-core' ? 'true' : 'false'}`,
      '---',
      '',
      body.trim(),
      '',
    ].join('\n');

    const destFile = path.join(rulesDir, `${skillName}.mdc`);
    fs.writeFileSync(destFile, mdcContent, 'utf8');
    installed.push(`.cursor/rules/${skillName}.mdc`);
  }

  // Also write AGENTS.md for Cursor universal context
  installed.push(...installUniversalAgents(targetDir));

  return installed;
}

/**
 * Installs modular M.A.T.E. rules and workflows for Windsurf IDE (Cascade)
 */
function installWindsurf(targetDir) {
  const rulesDir = path.join(targetDir, '.windsurf', 'rules');
  const workflowsDir = path.join(targetDir, '.windsurf', 'workflows');
  fs.mkdirSync(rulesDir, { recursive: true });
  fs.mkdirSync(workflowsDir, { recursive: true });
  const installed = [];

  const legacyCombined = path.join(rulesDir, 'mate-sdt.md');
  if (fs.existsSync(legacyCombined)) {
    try {
      fs.unlinkSync(legacyCombined);
    } catch {
      // ignore
    }
  }

  const globsMap = {
    'mate-core': '**/*',
    'mate-help': '**/*',
    'mate-strategy': 'docs/**/*.md,MATE-PROJECT-MAP.md',
    'mate-story-testcases': 'docs/test-cases/**/*,specs/**/*.mate-spec.md',
    'mate-model': 'specs/**/*.mate-spec.md,MATE-PROJECT-MAP.md',
    'mate-pw-recon': 'specs/**/*.mate-spec.md,docs/test-cases/**/*,src/pages/**/*.ts,src/components/**/*.ts',
    'mate-assert-playwright': 'tests/e2e/**/*.ts,src/pages/**/*.ts,src/components/**/*.ts,src/fixtures/**/*.ts',
    'mate-pw-codegen': 'tests/e2e/**/*.ts,src/pages/**/*.ts,src/components/**/*.ts,src/mocks/**/*.ts,src/fixtures/**/*.ts',
    'mate-pw-forensics': 'tests/threats/**/*.ts,tests/charters/**/*.md,docs/bugs/**/*.md',
    'mate-assert-api': 'tests/api/**/*.ts,src/api/**/*.ts,src/models/**/*.ts',
    'mate-threat': 'tests/threats/**/*.ts,stryker.config.json',
    'mate-performance-k6': 'tests/nfr/**/*.js,tests/nfr/**/*.ts',
    'mate-explore': 'tests/charters/**/*.md,specs/waivers/**/*.md',
    'mate-triage': 'docs/bugs/**/*.md,MATE-PROJECT-MAP.md',
    'mate-maintenance': 'tests/**/*.ts,src/**/*.ts',
  };

  for (const skillName of SKILL_NAMES) {
    const p = path.join(PACKAGE_ROOT, 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(p)) continue;
    const body = fs.readFileSync(p, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '').trim();
    const isAlwaysOn = skillName === 'mate-core';
    const ruleContent = [
      '---',
      `trigger: ${isAlwaysOn ? 'always_on' : 'model_decision'}`,
      `description: M.A.T.E. Method (${skillName}) Spec-Driven Testing rule`,
      ...(globsMap[skillName] ? [`globs: ${globsMap[skillName]}`] : []),
      '---',
      '',
      body,
      '',
    ].join('\n');

    const dest = path.join(rulesDir, `${skillName}.md`);
    fs.writeFileSync(dest, ruleContent, 'utf8');
    installed.push(`.windsurf/rules/${skillName}.md`);
  }

  for (const wfName of WORKFLOW_NAMES) {
    const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wfName}.md`);
    if (fs.existsSync(wfSrc)) {
      fs.copyFileSync(wfSrc, path.join(workflowsDir, `${wfName}.md`));
      installed.push(`.windsurf/workflows/${wfName}.md`);
    }
  }

  // Also write AGENTS.md for Windsurf workspace awareness
  installed.push(...installUniversalAgents(targetDir));

  return installed;
}

/**
 * Installs M.A.T.E. AGENTS.md instructions for OpenAI Codex CLI and the open agent standard
 */
function installUniversalAgents(targetDir) {
  const agentsMdPath = path.join(targetDir, 'AGENTS.md');
  const installed = [];

  const mateBlock = [
    '<!-- MATE-SDT-START -->',
    '# AGENTS.md — M.A.T.E. Harness & Context Engineering Map (<= 100 Lines)',
    '',
    '> *Humans steer. Agents execute.* (`Agent = Model + Harness + Knowledge`)',
    '',
    '## 1. Progressive Disclosure Routing (Where to Look Next)',
    '| Need | Target |',
    '| :--- | :--- |',
    '| **Open-Ended / "Where do I start?"** | Activate `mate-party` (Council of QA Experts) |',
    '| **User Stories & Acceptance Criteria** | Generate 4-Quadrant Matrix: `npx mate-sdt cases <module>` |',
    '| **Pasted Stack Trace / Failure / "Fix this"** | Activate `mate-triage` + `npx mate-sdt heal` (`/mate-flow-triage`) |',
    '| **Framework Coaching & Diagnosis** | Activate `mate-help` (`/mate-help`) |',
    '| **Task Execution & Map Governance** | Activate `mate-core` & read `MATE-PROJECT-MAP.md` (`< 3,000` tokens) |',
    '| **Quality Scorecard & Tech Debt** | `docs/QUALITY_SCORE.md` & `.mate/exec-plans/tech-debt-tracker.md` |',
    '| **Active Execution Plans** | `.mate/exec-plans/active/` (completed -> `.mate/exec-plans/completed/`) |',
    '',
    '## 2. Zero-Assumption Escalation & Sub-Agent Delegation Protocols',
    '- **Zero-Assumption & Open-Question Escalation ("Ask, Never Guess"):** Inspect local/live context first. Never invent business thresholds, auth boundaries, or requirements. Tag unknowns `[TBD: <exact question>]` under `## Open Questions for Human QA`, finish unblocked work, and halt on `STATUS: BLOCKED_ON_USER_INPUT` (`GATE-01`/`GATE-02`) to ask the human.',
    '- **Sub-Agent Delegation & 3-Phase Pipeline Isolation:** Build scoped sub-agent prompts via `npx mate-sdt context <module> --subagent <skill>`. Isolate Reader/Extractor -> Spec Scorer -> Code Writer -> Independent Reviewer (`mate-review`/`mate-audit`) via `mate.handoff/v1` (or `--compact` fallback in single-agent IDEs).',
    '',
    '## 3. Forward-Only 6-Layer Architecture & Strict POM',
    '1. `src/models/` (strict TS schemas, zero `any`) -> 2. `src/api/` & `src/components/` -> 3. `src/pages/` (`<= 300` lines) -> 4. `src/fixtures/` (`test.extend`) -> 5. `tests/{e2e,api,threats,nfr}/**/*.spec.ts`.',
    '- **Test-Design-First Mandate (`MATE-INVARIANT-08`):** Never write `.spec.ts` automation code (even smoke tests) without FIRST generating `docs/test-cases/TC-[module].md` and `.csv` (`mate-story-testcases` / `npx mate-sdt cases <module>`). Every automated test must trace back to explicit cases (`[AUTOMATE_UI]`, `[AUTOMATE_API]`, `[MANUAL_TEST]`, `[EXPLORATORY_CHARTER]`). Specs without test cases fail `GATE-02`.',
    '- **FORBIDDEN IN SPECS (MATE-ANTI-08 & MATE-ANTI-03 CRITICAL):** Zero `page.locator()`, `page.getBy*()`, `page.goto()`, or direct `page.fill/click/selectOption()` inside specs. All UI interactions must be encapsulated in Page Objects (`src/pages/*.page.ts`) or Component Objects (`src/components/*.component.ts`). If a page lacks a Page Object, create it first under `src/pages/*.page.ts`! Zero `new SomePage(page)`, zero `waitForTimeout()`, and zero `.only()`.',
    '- **Anti-Greenwashing (`MATE-ANTI-06`):** Never delete/weaken failing assertions or use permissive regexes (`/A|B/`). Keep failing tests with `test.fail(true, "BUG-XXX")` and file `docs/bugs/BUG-*.md` (`npx mate-sdt bug <mod>`).',
    '',
    '## 4. Active `.mate/` Directory Protocol & Memory Provenance',
    '- **Execution Plans:** Before starting any multi-step task, create your plan in `.mate/exec-plans/active/<name>.md` with actionable `- [ ]` tasks. Move completed plans to `.mate/exec-plans/completed/`. Check `.mate/exec-plans/tech-debt-tracker.md` for pending cleanups.',
    '- **Context Hygiene & Scratchpads:** Never dump raw exploratory logs or HTML dumps into project root or `docs/`. Store transient findings in `.mate/scratchpad-<module>.md`. Run `npx mate-sdt context <module>` for phase-scoped JIT packs (`< 2,000` tokens).',
    '- **Provenance Hierarchy:** `[BOOTSTRAPPED] > [USER_EXPLICIT] > [OBSERVED | ISO] > [INFERRED] / [TBD]`. Never put `[INFERRED]`/`[TBD]` in `<invariants>` or Page Objects; halt on `STATUS: BLOCKED_ON_USER_INPUT` to ask the human.',
    '',
    '## 5. Verification & Garbage Collection Commands',
    '- `npx mate-sdt gate --loop` — Closed-loop 5-gate verification (max 5 iterations, auto-persisting state in `.mate/harness-state.json`).',
    '- `npx mate-sdt gc` — Continuous doc-gardening, updating `.mate/exec-plans/tech-debt-tracker.md` & `docs/QUALITY_SCORE.md`.',
    '- `npx mate-sdt context <module>` — 3-Bucket / 7-Layer JIT Context Pack (`--subagent <skill>`, `--compact`, `--consolidate`).',
    '- `npx mate-sdt heal [target]` — Compress crash (`<error_digest> <= 400 tokens` in `.mate/scratchpad-heal-*.md`) & 5-Class Heal vs. Quarantine.',
    '- `npx mate-sdt mutate` / `npx mate-sdt k6 <script>` — Rootless Podman mutation (`>= 85%`) & SLA suites.',
    '<!-- MATE-SDT-END -->',
    '',
  ].join('\n');

  if (fs.existsSync(agentsMdPath)) {
    const existing = fs.readFileSync(agentsMdPath, 'utf8');
    if (existing.includes('<!-- MATE-SDT-START -->')) {
      const updated = existing.includes('<!-- MATE-SDT-END -->')
        ? existing.replace(
            /<!-- MATE-SDT-START -->[\s\S]*?<!-- MATE-SDT-END -->/,
            mateBlock.trim()
          )
        : existing.replace(/<!-- MATE-SDT-START -->[\s\S]*/, mateBlock.trim());
      fs.writeFileSync(agentsMdPath, updated, 'utf8');
    } else if (existing.includes('# AGENTS.md — M.A.T.E.')) {
      fs.writeFileSync(agentsMdPath, `${mateBlock}`, 'utf8');
    } else {
      fs.writeFileSync(agentsMdPath, `${existing.trimEnd()}\n\n${mateBlock}`, 'utf8');
    }
  } else {
    fs.writeFileSync(agentsMdPath, `${mateBlock}`, 'utf8');
  }
  installed.push('AGENTS.md');

  return installed;
}

/**
 * Alias for installUniversalAgents tailored for OpenAI Codex CLI
 */
function installCodex(targetDir) {
  return installUniversalAgents(targetDir);
}

/**
 * Installs M.A.T.E. instructions and prompt files for GitHub Copilot
 */
function installCopilot(targetDir) {
  const githubDir = path.join(targetDir, '.github');
  const promptsDir = path.join(githubDir, 'prompts');
  fs.mkdirSync(promptsDir, { recursive: true });
  const installed = [];

  for (const skillName of SKILL_NAMES) {
    const p = path.join(PACKAGE_ROOT, 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(p)) continue;
    const body = fs.readFileSync(p, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '').trim();
    const promptFile = path.join(promptsDir, `${skillName}.prompt.md`);
    fs.writeFileSync(promptFile, body + '\n', 'utf8');
    installed.push(`.github/prompts/${skillName}.prompt.md`);
  }

  for (const wfName of WORKFLOW_NAMES) {
    const wfSrc = path.join(PACKAGE_ROOT, 'workflows', `${wfName}.md`);
    if (!fs.existsSync(wfSrc)) continue;
    const body = fs.readFileSync(wfSrc, 'utf8').replace(/^---[\s\S]*?---\r?\n/, '').trim();
    const promptFile = path.join(promptsDir, `${wfName}.prompt.md`);
    fs.writeFileSync(promptFile, body + '\n', 'utf8');
    installed.push(`.github/prompts/${wfName}.prompt.md`);
  }

  const copilotInstructionsPath = path.join(githubDir, 'copilot-instructions.md');
  const block = [
    '',
    '<!-- MATE-SDT-START -->',
    '## 🧉 M.A.T.E. Method — Spec-Driven Testing (SDT) Instructions',
    '',
    '1. **Progressive Disclosure Routing:** Open-ended -> `mate-party`; Pasted stack trace/failure -> `mate-triage` + `npx mate-sdt heal`; Coaching -> `mate-help`; Execution -> `mate-core` & `MATE-PROJECT-MAP.md` (`< 3,000` tokens). Track plans in `.mate/exec-plans/active/` & `docs/QUALITY_SCORE.md`.',
    '2. **Zero-Assumption Escalation ("Ask, Never Guess") & Sub-Agent Delegation:** Never invent business thresholds or requirements; tag unknowns `[TBD: <exact question>]` under `## Open Questions for Human QA` and halt on `STATUS: BLOCKED_ON_USER_INPUT` (`GATE-01`/`GATE-02`). Build scoped sub-agent prompts via `npx mate-sdt context <module> --subagent <skill>` and enforce 3-Phase Pipeline Isolation (Reader -> Scorer -> Writer -> Independent Reviewer).',
    '3. **Forward-Only 6-Layer Architecture & Test-Design-First:** `src/models/` (no `any`) -> `src/api/` & `src/components/` -> `src/pages/` (`<= 300` lines) -> `src/fixtures/` (`test.extend`) -> `tests/**/*.spec.ts`. Never write `.spec.ts` tests without FIRST generating `docs/test-cases/TC-[module].md` and `.csv` (`mate-story-testcases` / `npx mate-sdt cases <module>`). Never use `waitForTimeout()`, `.only()`, `new Page()`, raw `page.locator()`, `page.getBy*()`, or direct `page.fill/click/goto` in specs. Keep failing tests with `test.fail(true, "BUG-XXX")`.',
    '4. **Active `.mate/` Protocol & Memory:** Persist multi-step plans in `.mate/exec-plans/active/<name>.md` (move to `completed/` when done). Keep transient notes in `.mate/scratchpad-<module>.md`. Run `npx mate-sdt context <module>` for JIT packs (`< 2,000` tokens). Enforce `[BOOTSTRAPPED] > [USER_EXPLICIT] > [OBSERVED | ISO] > [INFERRED] / [TBD]`.',
    '5. **Closed-Loop Verification & GC:** Run `npx mate-sdt gate --loop` (persisting `.mate/harness-state.json`) and `npx mate-sdt gc` (updating `.mate/exec-plans/tech-debt-tracker.md` & `docs/QUALITY_SCORE.md`) before finishing. Run `mutate` (`>= 85%`) & `k6` inside rootless Podman.',
    '<!-- MATE-SDT-END -->',
    '',
  ].join('\n');

  if (fs.existsSync(copilotInstructionsPath)) {
    const existing = fs.readFileSync(copilotInstructionsPath, 'utf8');
    if (existing.includes('<!-- MATE-SDT-START -->')) {
      const updated = existing.includes('<!-- MATE-SDT-END -->')
        ? existing.replace(
            /<!-- MATE-SDT-START -->[\s\S]*?<!-- MATE-SDT-END -->/,
            block.trim()
          )
        : existing.replace(/<!-- MATE-SDT-START -->[\s\S]*/, block.trim());
      fs.writeFileSync(copilotInstructionsPath, updated, 'utf8');
    } else if (existing.includes('M.A.T.E. Method — Spec-Driven Testing')) {
      fs.writeFileSync(
        copilotInstructionsPath,
        `# GitHub Copilot Repository Instructions\n${block}`,
        'utf8'
      );
    } else {
      fs.writeFileSync(copilotInstructionsPath, `${existing.trimEnd()}\n${block}`, 'utf8');
    }
  } else {
    fs.writeFileSync(
      copilotInstructionsPath,
      `# GitHub Copilot Repository Instructions\n${block}`,
      'utf8'
    );
  }
  installed.push('.github/copilot-instructions.md');

  return installed;
}

module.exports = {
  SKILL_NAMES,
  WORKFLOW_NAMES,
  copyDirRecursive,
  writeFileIfMissing,
  normalizeIdeName,
  installAntigravity,
  installClaudeCode,
  installCursor,
  installWindsurf,
  installUniversalAgents,
  installCodex,
  installCopilot,
};
