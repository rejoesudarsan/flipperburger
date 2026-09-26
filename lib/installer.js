'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const SKILL_NAME = 'flipperburger';
const SUPPORTED_AGENTS = Object.freeze([
  'codex',
  'cursor',
  'gemini',
  'copilot',
  'opencode',
  'windsurf',
  'claude',
]);
const SHARED_AGENTS = new Set(SUPPORTED_AGENTS.filter((agent) => agent !== 'claude'));

function expandAgents(agents) {
  const normalized = agents.map((agent) => agent.toLowerCase());
  if (normalized.includes('all')) {
    if (normalized.length !== 1) {
      throw new Error('Agent "all" cannot be combined with other agents.');
    }
    return [...SUPPORTED_AGENTS];
  }
  const unknown = normalized.filter((agent) => !SUPPORTED_AGENTS.includes(agent));
  if (unknown.length > 0) {
    throw new Error(`Unsupported agent: ${unknown.join(', ')}. Supported agents: ${SUPPORTED_AGENTS.join(', ')}.`);
  }
  return [...new Set(normalized)];
}

function resolveDestinations(options) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const home = path.resolve(options.home || os.homedir());
  const scope = options.scope || 'project';
  if (!['project', 'user'].includes(scope)) {
    throw new Error('--scope must be either project or user.');
  }

  const agents = expandAgents(options.agents || ['all']);
  const projectRoot = path.resolve(cwd, options.dir || '.');
  let customParent;
  if (options.targetDir) {
    customParent = path.resolve(projectRoot, options.targetDir);
  }

  const destinations = agents.map((agent) => {
    if (customParent) return path.join(customParent, SKILL_NAME);
    const root = scope === 'user' ? home : projectRoot;
    const parent = agent === 'claude'
      ? path.join(root, '.claude', 'skills')
      : path.join(root, '.agents', 'skills');
    return path.join(parent, SKILL_NAME);
  });

  return [...new Set(destinations.map((destination) => path.resolve(destination)))];
}

async function pathExists(filePath) {
  try {
    await fs.lstat(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function listTree(root) {
  const entries = [];
  async function visit(current, relative) {
    const stat = await fs.lstat(current);
    if (stat.isSymbolicLink()) {
      entries.push({ relative, type: 'link', value: await fs.readlink(current) });
      return;
    }
    if (stat.isDirectory()) {
      entries.push({ relative, type: 'directory' });
      const children = await fs.readdir(current);
      children.sort();
      for (const child of children) {
        await visit(path.join(current, child), path.join(relative, child));
      }
      return;
    }
    if (stat.isFile()) {
      const hash = crypto.createHash('sha256').update(await fs.readFile(current)).digest('hex');
      entries.push({ relative, type: 'file', hash });
      return;
    }
    entries.push({ relative, type: 'other' });
  }
  await visit(root, '');
  return entries;
}

async function directoriesEqual(left, right) {
  if (!(await pathExists(left)) || !(await pathExists(right))) return false;
  const [leftTree, rightTree] = await Promise.all([listTree(left), listTree(right)]);
  return JSON.stringify(leftTree) === JSON.stringify(rightTree);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function availableSibling(basePath) {
  if (!(await pathExists(basePath))) return basePath;
  for (let number = 1; ; number += 1) {
    const candidate = `${basePath}-${number}`;
    if (!(await pathExists(candidate))) return candidate;
  }
}

async function replaceDestination(sourceDir, destination) {
  const parent = path.dirname(destination);
  await fs.mkdir(parent, { recursive: true });
  const temp = await availableSibling(path.join(parent, `.${SKILL_NAME}.tmp-${process.pid}`));
  const backup = await availableSibling(`${destination}.backup-${timestamp()}`);
  await fs.cp(sourceDir, temp, { recursive: true, errorOnExist: true, force: false });
  try {
    await fs.rename(destination, backup);
    try {
      await fs.rename(temp, destination);
    } catch (error) {
      await fs.rename(backup, destination);
      throw error;
    }
  } catch (error) {
    await fs.rm(temp, { recursive: true, force: true });
    throw error;
  }
  return backup;
}

async function installNew(sourceDir, destination) {
  const parent = path.dirname(destination);
  await fs.mkdir(parent, { recursive: true });
  const temp = await availableSibling(path.join(parent, `.${SKILL_NAME}.tmp-${process.pid}`));
  await fs.cp(sourceDir, temp, { recursive: true, errorOnExist: true, force: false });
  try {
    await fs.rename(temp, destination);
  } catch (error) {
    await fs.rm(temp, { recursive: true, force: true });
    throw error;
  }
}

async function installSkill(options = {}) {
  const sourceDir = path.resolve(options.sourceDir || path.join(__dirname, '..', 'skills', SKILL_NAME));
  if (!(await pathExists(path.join(sourceDir, 'SKILL.md')))) {
    throw new Error(`Canonical skill is missing: ${sourceDir}`);
  }
  const destinations = resolveDestinations(options);
  const plans = [];

  for (const destination of destinations) {
    const exists = await pathExists(destination);
    const identical = exists && await directoriesEqual(sourceDir, destination);
    if (exists && !identical && !options.force) {
      throw new Error(`Installation differs at ${destination}. Re-run with --force to back it up and replace it.`);
    }
    plans.push({ destination, exists, identical });
  }

  const results = [];
  for (const plan of plans) {
    const { destination, exists, identical } = plan;
    if (identical) {
      results.push({ action: 'noop', destination });
      continue;
    }
    if (options.dryRun) {
      results.push({ action: exists ? 'would-replace' : 'would-install', destination });
      continue;
    }
    if (exists) {
      const backup = await replaceDestination(sourceDir, destination);
      results.push({ action: 'replaced', destination, backup });
    } else {
      await installNew(sourceDir, destination);
      results.push({ action: 'installed', destination });
    }
  }
  return results;
}

module.exports = {
  SKILL_NAME,
  SUPPORTED_AGENTS,
  directoriesEqual,
  expandAgents,
  installSkill,
  resolveDestinations,
};
