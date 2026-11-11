'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { validateSpecFile } = require('../src/cli/validator');
const { auditTestSuite } = require('../src/cli/auditor');
const {
  SKILL_NAMES,
  WORKFLOW_NAMES,
  installMate,
  generateTestCases,
  generateCharter,
  generateWaiver,
  generateBugReport,
  checkStatus,
} = require('../src/cli/installer');

const CLI_BIN = path.resolve(__dirname, '..', 'bin', 'mate-sdt.js');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mate-sdt-test-'));
}

describe('M.A.T.E. SDT Framework CLI, 9 Skills, 5 Workflows & Auditor Suite', () => {
  test('1. Golden sample spec and official template pass M.A.T.E. validation', () => {
    const samplePath = path.resolve(
      __dirname,
      '..',
      'skills/mate-model/examples/sample-order-lifecycle.mate-spec.md'
    );
    const res = validateSpecFile(samplePath);
    assert.equal(res.valid, true, `Expected sample spec to be valid, got errors: ${res.errors.join(', ')}`);

    const templatePath = path.resolve(__dirname, '..', 'templates/TEMPLATE_MATE_SPEC.md');
    const tplRes = validateSpecFile(templatePath);
    assert.equal(tplRes.valid, true, `Expected template spec to be valid, got errors: ${tplRes.errors.join(', ')}`);
  });

  test('2. Validator rejects spec missing Forbidden Transitions in <intent_model>', () => {
    const tmpDir = createTempDir();
    try {
      const badSpec = path.join(tmpDir, 'bad.mate-spec.md');
      fs.writeFileSync(
        badSpec,
        [
          '---',
          'module: broken-auth',
          'version: 1.0.0',
          'status: DRAFT',
          '---',
          '<intent_model>',
          'State machine: LOGIN -> ACTIVE -> LOGOUT without any restrictions listed.',
          '</intent_model>',
          '<invariants>',
          'INV-01: Token must expire within 15 minutes of issuance.',
          '</invariants>',
          '<threat_scenarios>',
          'THR-01: Concurrent refresh token reuse must revoke session.',
          '</threat_scenarios>',
          '<exploratory_charters>',
          'CHR-01: Explore login screen with keyboard and screen reader.',
          '</exploratory_charters>',
        ].join('\n'),
        'utf8'
      );

      const res = validateSpecFile(badSpec);
      assert.equal(res.valid, false);
      assert.ok(res.errors.some((e) => e.includes('Forbidden Transitions')));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('3. installMate scaffolds Greenfield project, 13 synergistic skills, and 6 E2E workflows across all 5 IDEs', () => {
    const tmpDir = createTempDir();
    try {
      assert.equal(SKILL_NAMES.length, 13);
      assert.equal(WORKFLOW_NAMES.length, 6);

      installMate({
        targetDir: tmpDir,
        mode: 'greenfield',
        ides: ['antigravity', 'claude', 'cursor', 'windsurf', 'copilot'],
        includeStarterFiles: true,
      });

      assert.ok(fs.existsSync(path.join(tmpDir, 'MATE-PROJECT-MAP.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.gitignore')));
      assert.ok(fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8').includes('.playwright-cli/'));
      assert.ok(fs.existsSync(path.join(tmpDir, 'specs', 'TEMPLATE_MATE_SPEC.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'specs', 'sample-order-lifecycle.mate-spec.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'stryker.config.json')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'pages', 'base.page.ts')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'components', 'notification-toast.component.ts')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'api', 'base-api.client.ts')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'fixtures', 'mate.fixtures.ts')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'tests', 'nfr', 'order-load.k6.js')));

      // Verify all 13 skills installed in Antigravity, Claude, and Cursor, with USE WHEN & SYNERGY in descriptions
      for (const skill of SKILL_NAMES) {
        const skillPath = path.join(tmpDir, '.agents', 'skills', skill, 'SKILL.md');
        assert.ok(fs.existsSync(skillPath));
        const rawSkill = fs.readFileSync(skillPath, 'utf8');
        assert.ok(rawSkill.includes('USE WHEN:'), `Expected ${skill} to have USE WHEN trigger`);
        assert.ok(rawSkill.includes('SYNERGY:'), `Expected ${skill} to have SYNERGY declaration`);
        assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', `${skill}.md`)));
        assert.ok(fs.existsSync(path.join(tmpDir, '.cursor', 'rules', `${skill}.mdc`)));
      }

      // Verify specialized @playwright/cli skills and mate-story-testcases references are copied
      assert.ok(
        fs.existsSync(
          path.join(tmpDir, '.agents', 'skills', 'mate-story-testcases', 'references', 'mcp-and-file-ingestion.md')
        )
      );
      assert.ok(
        fs.existsSync(
          path.join(tmpDir, '.agents', 'skills', 'mate-pw-recon', 'references', 'live-story-verification.md')
        )
      );
      assert.ok(
        fs.existsSync(
          path.join(tmpDir, '.agents', 'skills', 'mate-pw-codegen', 'references', 'test-generation.md')
        )
      );
      assert.ok(
        fs.existsSync(
          path.join(tmpDir, '.agents', 'skills', 'mate-pw-forensics', 'references', 'tracing.md')
        )
      );

      // Verify all 5 workflows installed in Antigravity, Claude, Windsurf, Copilot
      for (const wf of WORKFLOW_NAMES) {
        assert.ok(fs.existsSync(path.join(tmpDir, '.agent', 'workflows', 'mate', `${wf}.md`)));
        assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', `${wf}.md`)));
        assert.ok(fs.existsSync(path.join(tmpDir, '.windsurf', 'workflows', `${wf}.md`)));
        assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'prompts', `${wf}.prompt.md`)));
      }

      const status = checkStatus(tmpDir);
      assert.equal(status.hasProjectMap, true);
      assert.equal(status.auditResult.grade, 'A');
      assert.equal(status.specValidation.allValid, true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('4. generateTestCases, generateCharter, generateBugReport, and generateWaiver create formatted artifacts', () => {
    const tmpDir = createTempDir();
    try {
      const { mdDest, csvDest } = generateTestCases('checkout-payment', tmpDir);
      assert.ok(fs.existsSync(mdDest));
      assert.ok(fs.existsSync(csvDest));
      assert.ok(fs.readFileSync(mdDest, 'utf8').includes('HAPPY_PATH'));
      assert.ok(fs.readFileSync(mdDest, 'utf8').includes('BORDER_CASE'));
      assert.ok(fs.readFileSync(csvDest, 'utf8').includes('TC_ID,Story_Key,Category'));

      const charterFile = generateCharter('checkout-payment', tmpDir);
      assert.ok(fs.existsSync(charterFile));
      assert.ok(fs.readFileSync(charterFile, 'utf8').includes('CHECKOUT-PAYMENT'));

      const bugFile = generateBugReport('checkout-payment', tmpDir);
      assert.ok(fs.existsSync(bugFile));
      assert.ok(fs.readFileSync(bugFile, 'utf8').includes('CHECKOUT-PAYMENT'));

      const waiverFile = generateWaiver('checkout-payment', tmpDir);
      assert.ok(fs.existsSync(waiverFile));
      assert.ok(fs.readFileSync(waiverFile, 'utf8').includes('CHECKOUT-PAYMENT'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('5. auditTestSuite detects waitForTimeout, .only, and DIP violations and grades accordingly', () => {
    const tmpDir = createTempDir();
    try {
      const e2eDir = path.join(tmpDir, 'tests', 'e2e');
      fs.mkdirSync(e2eDir, { recursive: true });
      fs.writeFileSync(
        path.join(e2eDir, 'flaky.spec.ts'),
        [
          "import { test, expect } from '@playwright/test';",
          "test.only('bad test', async ({ page }) => {",
          '  const loginPage = new LoginPage(page);',
          '  await page.waitForTimeout(5000);',
          '  expect(loginPage).toBeDefined();',
          '});',
        ].join('\n'),
        'utf8'
      );

      const audit = auditTestSuite(tmpDir);
      assert.equal(audit.filesScanned, 1);
      assert.ok(audit.findings.some((f) => f.code === 'MATE-ANTI-01'));
      assert.ok(audit.findings.some((f) => f.code === 'MATE-ANTI-02'));
      assert.ok(audit.findings.some((f) => f.code === 'MATE-ANTI-03'));
      assert.ok(audit.findings.some((f) => f.code === 'MATE-ANTI-04'));
      assert.ok(audit.score < 70);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('6. CLI binary executes install, validate, audit, and bug end-to-end', () => {
    const tmpDir = createTempDir();
    try {
      const installRun = spawnSync(
        process.execPath,
        [CLI_BIN, 'install', '--yes', '--dir', tmpDir, '--ide', 'antigravity,claude'],
        { encoding: 'utf8' }
      );
      assert.equal(installRun.status, 0, `CLI install failed: ${installRun.stderr}`);

      const validateRun = spawnSync(
        process.execPath,
        [CLI_BIN, 'validate', path.join(tmpDir, 'specs')],
        { encoding: 'utf8' }
      );
      assert.equal(validateRun.status, 0, `CLI validate failed: ${validateRun.stderr}`);

      const auditRun = spawnSync(
        process.execPath,
        [CLI_BIN, 'audit', '--dir', tmpDir],
        { encoding: 'utf8' }
      );
      assert.equal(auditRun.status, 0, `CLI audit failed: ${auditRun.stderr}`);
      assert.ok(auditRun.stdout.includes('A (100/100)'));

      const bugRun = spawnSync(
        process.execPath,
        [CLI_BIN, 'bug', 'order-service', '--dir', tmpDir],
        { encoding: 'utf8' }
      );
      assert.equal(bugRun.status, 0, `CLI bug failed: ${bugRun.stderr}`);

      const casesRun = spawnSync(
        process.execPath,
        [CLI_BIN, 'cases', 'order-service', '--dir', tmpDir],
        { encoding: 'utf8' }
      );
      assert.equal(casesRun.status, 0, `CLI cases failed: ${casesRun.stderr}`);
      assert.ok(fs.existsSync(path.join(tmpDir, 'tests', 'cases', 'TC-order-service.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'tests', 'cases', 'TC-order-service.csv')));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
