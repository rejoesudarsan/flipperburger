'use strict';

const path = require('node:path');
const packageJson = require('../package.json');
const { installSkill, SUPPORTED_AGENTS } = require('./installer');

const HELP = `Usage: flipperburger install [options]

Install the flipperburger skill for one or more coding agents.

Options:
  --agent <names>       Comma-separated agents (default: all)
                        ${SUPPORTED_AGENTS.join(', ')}
  --scope <scope>       project or user (default: project)
  --dir <path>          Project root (default: current directory)
  --target-dir <path>   Custom parent directory for installed skills
  --dry-run             Show what would change without writing files
  --force               Back up and replace a differing installation
  -h, --help            Show help
  -v, --version         Show version`;

const VALUE_OPTIONS = new Set(['--agent', '--scope', '--dir', '--target-dir']);
const FLAG_OPTIONS = new Set(['--dry-run', '--force']);

function parseArgs(argv) {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    return { action: 'help' };
  }
  if (argv.includes('--version') || argv.includes('-v')) {
    return { action: 'version' };
  }
  if (argv[0] !== 'install') {
    throw new Error(`Unknown command: ${argv[0]}. Run with --help for usage.`);
  }

  const options = {
    action: 'install',
    agents: ['all'],
    scope: 'project',
    dryRun: false,
    force: false,
  };

  for (let index = 1; index < argv.length; index += 1) {
    let token = argv[index];
    let value;
    const equalsIndex = token.indexOf('=');
    if (equalsIndex !== -1) {
      value = token.slice(equalsIndex + 1);
      token = token.slice(0, equalsIndex);
    }

    if (FLAG_OPTIONS.has(token)) {
      if (value !== undefined) {
        throw new Error(`${token} does not accept a value.`);
      }
      options[token === '--dry-run' ? 'dryRun' : 'force'] = true;
      continue;
    }
    if (!VALUE_OPTIONS.has(token)) {
      throw new Error(`Unknown option: ${token}`);
    }
    if (value === undefined) {
      index += 1;
      value = argv[index];
    }
    if (value === undefined || value === '' || value.startsWith('--')) {
      throw new Error(`${token} requires a value.`);
    }

    if (token === '--agent') {
      const agents = value.split(',').map((agent) => agent.trim()).filter(Boolean);
      if (agents.length === 0) throw new Error('--agent requires at least one agent.');
      options.agents = agents;
    } else if (token === '--scope') {
      options.scope = value;
    } else if (token === '--dir') {
      options.dir = value;
    } else if (token === '--target-dir') {
      options.targetDir = value;
    }
  }

  return options;
}

async function runCli(argv, context = {}) {
  const stdout = context.stdout || process.stdout;
  const cwd = context.cwd || process.cwd();
  const parsed = parseArgs(argv);
  if (parsed.action === 'help') {
    stdout.write(`${HELP}\n`);
    return [];
  }
  if (parsed.action === 'version') {
    stdout.write(`${packageJson.version}\n`);
    return [];
  }

  const results = await installSkill({
    ...parsed,
    cwd,
    home: context.home,
    sourceDir: context.sourceDir,
  });
  for (const result of results) {
    if (result.action === 'noop') {
      stdout.write(`Already installed: ${result.destination}\n`);
    } else if (result.action === 'would-install') {
      stdout.write(`Would install: ${result.destination}\n`);
    } else if (result.action === 'would-replace') {
      stdout.write(`Would replace: ${result.destination}\n`);
    } else if (result.action === 'replaced') {
      stdout.write(`Installed: ${result.destination} (backup: ${result.backup})\n`);
    } else {
      stdout.write(`Installed: ${result.destination}\n`);
    }
  }
  return results;
}

module.exports = { HELP, parseArgs, runCli };
