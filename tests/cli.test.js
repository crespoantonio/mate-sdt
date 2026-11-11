'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { validateSpecFile } = require('../src/cli/validator');
const {
  installMate,
  generateCharter,
  generateWaiver,
  checkStatus,
} = require('../src/cli/installer');

const CLI_BIN = path.resolve(__dirname, '..', 'bin', 'mate-sdt.js');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mate-sdt-test-'));
}

describe('M.A.T.E. SDT Framework CLI & Installer Suite', () => {
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

  test('3. installMate scaffolds Greenfield project and configures all 5 AI IDEs', () => {
    const tmpDir = createTempDir();
    try {
      const result = installMate({
        targetDir: tmpDir,
        mode: 'greenfield',
        ides: ['antigravity', 'claude', 'cursor', 'windsurf', 'copilot'],
        includeStarterFiles: true,
      });

      assert.ok(fs.existsSync(path.join(tmpDir, 'MATE-PROJECT-MAP.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'specs', 'TEMPLATE_MATE_SPEC.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'specs', 'sample-order-lifecycle.mate-spec.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'stryker.config.json')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'pages', 'base.page.ts')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'components', 'notification-toast.component.ts')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'fixtures', 'mate.fixtures.ts')));

      // IDE files
      assert.ok(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'mate-core', 'SKILL.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.agent', 'skills.json')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'mate-core.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.cursor', 'rules', 'mate-core.mdc')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.windsurf', 'rules', 'mate-sdt.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'copilot-instructions.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'prompts', 'mate-core.prompt.md')));

      const status = checkStatus(tmpDir);
      assert.equal(status.hasProjectMap, true);
      assert.equal(status.hasAntigravitySkills, true);
      assert.equal(status.specValidation.allValid, true);
      assert.ok(result.ideFiles.length >= 15);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('4. generateCharter and generateWaiver create properly formatted files', () => {
    const tmpDir = createTempDir();
    try {
      const charterFile = generateCharter('checkout-payment', tmpDir);
      assert.ok(fs.existsSync(charterFile));
      const charterContent = fs.readFileSync(charterFile, 'utf8');
      assert.ok(charterContent.includes('CHECKOUT-PAYMENT'));

      const waiverFile = generateWaiver('checkout-payment', tmpDir);
      assert.ok(fs.existsSync(waiverFile));
      const waiverContent = fs.readFileSync(waiverFile, 'utf8');
      assert.ok(waiverContent.includes('CHECKOUT-PAYMENT'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('5. CLI binary executes install --yes and validate end-to-end', () => {
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
      assert.ok(validateRun.stdout.includes('PASS'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
