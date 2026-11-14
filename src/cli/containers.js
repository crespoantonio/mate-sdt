'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { COLORS, color } = require('./ui');

/**
 * Runs Stryker mutation testing inside an isolated rootless Podman container
 */
function runPodmanMutation(targetDir = '.', configFile = 'stryker.config.json') {
  const resolved = path.resolve(targetDir);
  console.log(
    color(
      '\n💣 [M.A.T.E. Pillar T] Launching Mutation Testing Suite via Rootless Podman...',
      COLORS.bold,
      COLORS.brightGreen
    )
  );
  console.log(`   📁 Target Project: ${resolved}`);
  console.log(`   ⚙️  Config File:    ${configFile}\n`);

  const check = spawnSync('podman', ['--version'], { encoding: 'utf8' });
  if (check.status !== 0) {
    console.error(
      color(
        "❌ Error: 'podman' is not installed or not in PATH. Rootless Podman is required by M.A.T.E. Pillar T.",
        COLORS.red,
        COLORS.bold
      )
    );
    return 1;
  }

  console.log(color(`   🐳 Container Engine: ${check.stdout.trim()}`, COLORS.cyan));

  const podmanArgs = [
    'run',
    '--rm',
    '-v',
    `${resolved}:/app:Z`,
    '-w',
    '/app',
    'node:20-alpine',
    'sh',
    '-c',
    `npm install --legacy-peer-deps && npx stryker run ${configFile}`,
  ];

  console.log(color(`   🚀 Executing: podman ${podmanArgs.join(' ')}\n`, COLORS.gray));
  const run = spawnSync('podman', podmanArgs, { stdio: 'inherit' });
  if (run.status === 0) {
    console.log(
      color(
        '\n✅ [Pillar T Passed] Mutation Score meets the >= 85% M.A.T.E. threshold!',
        COLORS.brightGreen,
        COLORS.bold
      )
    );
  } else {
    console.error(
      color(
        '\n❌ [Pillar T Failed] Mutation testing failed or score fell below the 85% M.A.T.E. threshold.',
        COLORS.red,
        COLORS.bold
      )
    );
  }
  return run.status ?? 1;
}

/**
 * Runs Grafana k6 performance script inside an isolated rootless Podman container
 */
function runPodmanK6(scriptPath = 'tests/nfr/order-load.k6.js', targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const relScript = path.isAbsolute(scriptPath)
    ? path.relative(resolved, scriptPath).replace(/\\/g, '/')
    : scriptPath.replace(/\\/g, '/');

  console.log(
    color(
      '\n⚡ [M.A.T.E. Performance Oracles] Launching Grafana k6 Suite via Rootless Podman...',
      COLORS.bold,
      COLORS.brightGreen
    )
  );
  console.log(`   📁 Target Project: ${resolved}`);
  console.log(`   📈 k6 Script:      ${relScript}\n`);

  const check = spawnSync('podman', ['--version'], { encoding: 'utf8' });
  if (check.status !== 0) {
    console.error(
      color(
        "❌ Error: 'podman' is not installed or not in PATH. Rootless Podman is required by M.A.T.E. k6 runner.",
        COLORS.red,
        COLORS.bold
      )
    );
    return 1;
  }

  console.log(color(`   🐳 Container Engine: ${check.stdout.trim()}`, COLORS.cyan));

  const podmanArgs = [
    'run',
    '--rm',
    '-i',
    '-v',
    `${resolved}:/app:Z`,
    '-w',
    '/app',
    'grafana/k6:latest',
    'run',
    relScript,
  ];

  console.log(color(`   🚀 Executing: podman ${podmanArgs.join(' ')}\n`, COLORS.gray));
  const run = spawnSync('podman', podmanArgs, { stdio: 'inherit' });
  if (run.status === 0) {
    console.log(
      color(
        '\n✅ [Performance Oracles Passed] All k6 SLA thresholds satisfied!',
        COLORS.brightGreen,
        COLORS.bold
      )
    );
  } else {
    console.error(
      color(
        '\n❌ [Performance Oracles Failed] k6 run failed or violated SLA thresholds.',
        COLORS.red,
        COLORS.bold
      )
    );
  }
  return run.status ?? 1;
}

module.exports = {
  runPodmanMutation,
  runPodmanK6,
};
