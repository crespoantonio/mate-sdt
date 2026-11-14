'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Generates Master Test Strategy (docs/TEST-STRATEGY.md) from template
 */
function generateTestStrategy(projectName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const destPath = path.join(resolved, 'docs', 'TEST-STRATEGY.md');
  const templatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-strategy',
    'resources',
    'test-strategy.template.md'
  );
  const today = new Date().toISOString().slice(0, 10);
  const title = projectName || path.basename(resolved) || 'Project';
  const content = fs
    .readFileSync(templatePath, 'utf8')
    .replace(/\[Project \/ Product Name\]/g, title)
    .replace(/\[Project Name\]/g, title)
    .replace(/YYYY-MM-DD/g, today);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

/**
 * Generates a Release / Sprint Test Plan (docs/test-plans/TP-<scope>.md) from template
 */
function generateTestPlan(scopeName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (scopeName || 'release')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = today.replace(/-/g, '');
  const destPath = path.join(resolved, 'docs', 'test-plans', `TP-${dateStr}-${safeName}.md`);

  const templatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-strategy',
    'resources',
    'test-plan.template.md'
  );
  const content = fs
    .readFileSync(templatePath, 'utf8')
    .replace(/\[Release \/ Sprint \/ Epic Name\]/g, scopeName || 'Release Cycle')
    .replace(/\[SCOPE\]/g, safeName.toUpperCase())
    .replace(/\[scope\]/g, safeName)
    .replace(/YYYY-MM-DD/g, today)
    .replace(/YYYYMMDD/g, dateStr);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

/**
 * Generates a 4-Quadrant Test Case Matrix (.md + .csv) from template
 */
function generateTestCases(moduleName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (moduleName || 'feature')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = today.replace(/-/g, '');

  const casesDir = path.join(resolved, 'docs', 'test-cases');
  fs.mkdirSync(casesDir, { recursive: true });

  const mdDest = path.join(casesDir, `TC-${safeName}.md`);
  const csvDest = path.join(casesDir, `TC-${safeName}.csv`);

  const mdTemplatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-story-testcases',
    'resources',
    'test-cases.template.md'
  );
  const csvTemplatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-story-testcases',
    'resources',
    'test-cases.template.csv'
  );

  let mdContent = fs.readFileSync(mdTemplatePath, 'utf8');
  mdContent = mdContent
    .replace(/\[Module Name\]/g, moduleName || 'Feature Module')
    .replace(/\[module\]/g, safeName)
    .replace(/YYYY-MM-DD/g, today)
    .replace(/YYYYMMDD/g, dateStr);

  const csvContent = fs.readFileSync(csvTemplatePath, 'utf8');

  fs.writeFileSync(mdDest, mdContent, 'utf8');
  fs.writeFileSync(csvDest, csvContent, 'utf8');

  return { mdDest, csvDest };
}

/**
 * Generates an Exploratory Testing Charter (SBTM) from template
 */
function generateCharter(moduleName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (moduleName || 'feature')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `CHR-${dateStr}-${safeName}.md`;
  const destPath = path.join(resolved, 'tests', 'charters', fileName);

  const templatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-explore',
    'resources',
    'charter.template.md'
  );
  let content = fs.readFileSync(templatePath, 'utf8');
  content = content
    .replace('CHR-[YYYYMMDD]-[MODULE]-[##]', `CHR-${dateStr}-${safeName.toUpperCase()}-01`)
    .replace('[e.g., Laundry Checkout & Scheduling]', moduleName || 'Feature Module')
    .replace('YYYY-MM-DD', new Date().toISOString().slice(0, 10));

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

/**
 * Generates a Formal Release Waiver from template
 */
function generateWaiver(moduleName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (moduleName || 'feature')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const year = today.slice(0, 4);
  const fileName = `WVR-${year}-${safeName}.md`;
  const destPath = path.join(resolved, 'specs', 'waivers', fileName);

  const templatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-explore',
    'resources',
    'release-waiver.template.md'
  );
  let content = fs.readFileSync(templatePath, 'utf8');
  content = content
    .replace('WVR-[YEAR]-[SPRINT]-[##]', `WVR-${year}-${safeName.toUpperCase()}-01`)
    .replace('[Module Name]', moduleName || 'Feature Module')
    .replace(/YYYY-MM-DD/g, today);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

/**
 * Generates a Structured Bug Report linked to M.A.T.E. Invariants
 */
function generateBugReport(moduleName, targetDir = '.') {
  const resolved = path.resolve(targetDir);
  const safeName = (moduleName || 'feature')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = today.replace(/-/g, '');
  const fileName = `BUG-${dateStr}-${safeName}.md`;
  const destPath = path.join(resolved, 'docs', 'bugs', fileName);

  const templatePath = path.join(
    PACKAGE_ROOT,
    'skills',
    'mate-triage',
    'resources',
    'bug-report.template.md'
  );
  let content = fs.readFileSync(templatePath, 'utf8');
  content = content
    .replace('BUG-[YYYYMMDD]-[MODULE]-[##]', `BUG-${dateStr}-${safeName.toUpperCase()}-01`)
    .replace(/\[module\]/g, safeName)
    .replace(/\[Module\]/g, moduleName || 'Module')
    .replace(/YYYY-MM-DD/g, today);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

module.exports = {
  generateTestStrategy,
  generateTestPlan,
  generateTestCases,
  generateCharter,
  generateWaiver,
  generateBugReport,
};
