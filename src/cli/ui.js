'use strict';

const readline = require('node:readline');

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function color(text, ...codes) {
  if (process.env.NO_COLOR) return text;
  return `${codes.join('')}${text}${COLORS.reset}`;
}

function printBanner(version = '1.0.0') {
  const banner = [
    '',
    color('  ╔══════════════════════════════════════════════════════════════════════╗', COLORS.brightGreen, COLORS.bold),
    color('  ║                                                                      ║', COLORS.brightGreen, COLORS.bold),
    color('  ║   🧉  M.A.T.E. METHOD — SPEC-DRIVEN TESTING (SDT) FRAMEWORK          ║', COLORS.brightGreen, COLORS.bold),
    color('  ║       Model  •  Assert  •  Threat & Trash  •  Explore                ║', COLORS.cyan),
    color(`  ║       v${version.padEnd(10)} by Antonio "Tony" Crespo (Un Junior En Apuros)   ║`, COLORS.gray),
    color('  ║                                                                      ║', COLORS.brightGreen, COLORS.bold),
    color('  ╚══════════════════════════════════════════════════════════════════════╝', COLORS.brightGreen, COLORS.bold),
    '',
  ];
  console.log(banner.join('\n'));
}

function createPromptInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(rl, query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function promptSelect(rl, title, options, defaultIndex = 0) {
  console.log(color(`\n  ? ${title}`, COLORS.bold, COLORS.cyan));
  options.forEach((opt, idx) => {
    const marker = idx === defaultIndex ? color('›', COLORS.brightGreen, COLORS.bold) : ' ';
    const defaultTag = idx === defaultIndex ? color(' (default)', COLORS.gray) : '';
    console.log(`    ${marker} ${color(`${idx + 1})`, COLORS.yellow)} ${opt.label}${defaultTag}`);
    if (opt.description) {
      console.log(`         ${color(opt.description, COLORS.gray)}`);
    }
  });

  const answer = await askQuestion(
    rl,
    color(`  Enter choice [1-${options.length}] (default: ${defaultIndex + 1}): `, COLORS.bold)
  );

  if (!answer) return options[defaultIndex].value;
  const num = Number.parseInt(answer, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= options.length) {
    return options[num - 1].value;
  }
  return options[defaultIndex].value;
}

async function promptMultiSelect(rl, title, options, defaultIndices = [0]) {
  console.log(color(`\n  ? ${title}`, COLORS.bold, COLORS.cyan));
  console.log(color('    (Enter comma-separated numbers like "1,2,3" or "all" for everything)', COLORS.gray));
  options.forEach((opt, idx) => {
    const isDefault = defaultIndices.includes(idx);
    const marker = isDefault ? color('◉', COLORS.brightGreen) : color('◯', COLORS.gray);
    console.log(`    ${marker} ${color(`${idx + 1})`, COLORS.yellow)} ${opt.label}`);
  });

  const defaultStr = defaultIndices.map((i) => i + 1).join(',');
  const answer = await askQuestion(
    rl,
    color(`  Selection (default: ${defaultStr}): `, COLORS.bold)
  );

  if (!answer) {
    return defaultIndices.map((i) => options[i].value);
  }
  if (answer.toLowerCase() === 'all' || answer === '*') {
    return options.map((o) => o.value);
  }

  const chosen = answer
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 1 && n <= options.length)
    .map((n) => options[n - 1].value);

  return chosen.length > 0 ? [...new Set(chosen)] : defaultIndices.map((i) => options[i].value);
}

async function promptConfirm(rl, questionText, defaultYes = true) {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const answer = await askQuestion(
    rl,
    color(`\n  ? ${questionText} (${hint}): `, COLORS.bold, COLORS.cyan)
  );
  if (!answer) return defaultYes;
  return /^y(es)?$/i.test(answer);
}

module.exports = {
  COLORS,
  color,
  printBanner,
  createPromptInterface,
  askQuestion,
  promptSelect,
  promptMultiSelect,
  promptConfirm,
};
