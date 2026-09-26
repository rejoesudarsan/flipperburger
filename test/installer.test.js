'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(packageRoot, 'skills', 'flipperburger');
const { parseArgs } = require('../lib/cli');
const { installSkill } = require('../lib/installer');

async function temporaryDirectory(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'flipperburger-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

async function assertInstalled(destination) {
  const [expected, actual] = await Promise.all([
    fs.readFile(path.join(sourceDir, 'SKILL.md'), 'utf8'),
    fs.readFile(path.join(destination, 'SKILL.md'), 'utf8'),
  ]);
  assert.equal(actual, expected);
  assert.equal(await fs.readFile(path.join(destination, 'agents', 'openai.yaml'), 'utf8'),
    await fs.readFile(path.join(sourceDir, 'agents', 'openai.yaml'), 'utf8'));
}

async function listRelativeFiles(root, current = root) {
  const files = [];
  for (const entry of await fs.readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listRelativeFiles(root, absolute));
    } else if (entry.isFile()) {
      files.push(path.relative(packageRoot, absolute).split(path.sep).join('/'));
    }
  }
  return files;
}

test('default project install deduplicates shared agent destinations', async (t) => {
  const root = await temporaryDirectory(t);
  const results = await installSkill({ cwd: root, sourceDir });
  assert.equal(results.length, 2);
  await assertInstalled(path.join(root, '.agents', 'skills', 'flipperburger'));
  await assertInstalled(path.join(root, '.claude', 'skills', 'flipperburger'));

  const repeated = await installSkill({ cwd: root, sourceDir });
  assert.deepEqual(repeated.map((result) => result.action), ['noop', 'noop']);
});

test('Claude installs into its project-specific parent', async (t) => {
  const root = await temporaryDirectory(t);
  const results = await installSkill({ cwd: root, agents: ['claude'], sourceDir });
  assert.equal(results[0].destination, path.join(root, '.claude', 'skills', 'flipperburger'));
  await assertInstalled(results[0].destination);
});

test('user scope uses home equivalents', async (t) => {
  const root = await temporaryDirectory(t);
  const home = path.join(root, 'home');
  const results = await installSkill({ cwd: root, home, scope: 'user', sourceDir });
  assert.deepEqual(results.map((result) => result.destination), [
    path.join(home, '.agents', 'skills', 'flipperburger'),
    path.join(home, '.claude', 'skills', 'flipperburger'),
  ]);
});

test('dry run reports actions without creating target directories', async (t) => {
  const root = await temporaryDirectory(t);
  const results = await installSkill({ cwd: root, agents: ['codex'], dryRun: true, sourceDir });
  assert.equal(results[0].action, 'would-install');
  await assert.rejects(fs.access(path.join(root, '.agents')), { code: 'ENOENT' });
});

test('collision fails, while force backs up and replaces it', async (t) => {
  const root = await temporaryDirectory(t);
  const destination = path.join(root, '.agents', 'skills', 'flipperburger');
  await fs.mkdir(destination, { recursive: true });
  await fs.writeFile(path.join(destination, 'old.txt'), 'previous install');

  await assert.rejects(
    installSkill({ cwd: root, agents: ['codex'], sourceDir }),
    /Re-run with --force/,
  );
  const results = await installSkill({ cwd: root, agents: ['codex'], sourceDir, force: true });
  assert.equal(results[0].action, 'replaced');
  assert.equal(await fs.readFile(path.join(results[0].backup, 'old.txt'), 'utf8'), 'previous install');
  await assertInstalled(destination);
});

test('a later collision is detected before any destination is written', async (t) => {
  const root = await temporaryDirectory(t);
  const claudeDestination = path.join(root, '.claude', 'skills', 'flipperburger');
  await fs.mkdir(claudeDestination, { recursive: true });
  await fs.writeFile(path.join(claudeDestination, 'old.txt'), 'collision');

  await assert.rejects(installSkill({ cwd: root, sourceDir }), /Re-run with --force/);
  await assert.rejects(fs.access(path.join(root, '.agents')), { code: 'ENOENT' });
});

test('--dir and --target-dir resolve custom project locations', async (t) => {
  const root = await temporaryDirectory(t);
  const project = path.join(root, 'project');
  const projectResult = await installSkill({ cwd: root, dir: project, agents: ['cursor'], sourceDir });
  assert.equal(projectResult[0].destination, path.join(project, '.agents', 'skills', 'flipperburger'));

  const customResults = await installSkill({
    cwd: root,
    dir: project,
    targetDir: 'custom-skills',
    agents: ['codex', 'claude'],
    sourceDir,
  });
  assert.equal(customResults.length, 1);
  assert.equal(customResults[0].destination, path.join(project, 'custom-skills', 'flipperburger'));
});

test('argument parsing rejects invalid options, scope, and agents', async () => {
  assert.throws(() => parseArgs(['install', '--wat']), /Unknown option/);
  assert.throws(() => parseArgs(['install', '--agent']), /requires a value/);
  await assert.rejects(installSkill({ agents: ['robot'], sourceDir }), /Unsupported agent/);
  await assert.rejects(installSkill({ scope: 'global', sourceDir }), /project or user/);
});

test('help, version, and package contents are publishable', async () => {
  const help = spawnSync(process.execPath, ['bin/flipperburger.js', '--help'], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage: flipperburger install/);

  const version = spawnSync(process.execPath, ['bin/flipperburger.js', '--version'], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), require('../package.json').version);

  const packed = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
  assert.equal(packed.status, 0, packed.stderr);
  const files = JSON.parse(packed.stdout)[0].files.map((file) => file.path);
  const requiredFiles = [
    'bin/flipperburger.js',
    'lib/cli.js',
    'lib/installer.js',
    ...await listRelativeFiles(sourceDir),
  ];
  for (const required of requiredFiles) {
    assert.ok(files.includes(required), `${required} should be included in the package`);
  }
});
