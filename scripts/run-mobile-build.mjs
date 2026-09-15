#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const buildTarget = process.argv[2];
const checkOnly = process.argv.includes('--check');
const supportedTargets = new Set([
  'build:interactive',
  'build:android:prd:local',
  'build:ios:prd:local',
  'build:android:prd',
  'build:ios:prd',
]);

if (!supportedTargets.has(buildTarget)) {
  console.error([
    'Missing or unsupported mobile build target.',
    `Supported targets: ${[...supportedTargets].join(', ')}`,
  ].join('\n'));
  process.exit(1);
}

const nodeVersion = readFileSync(join(repositoryRoot, '.nvmrc'), 'utf8').trim();
const nvmDirectory = process.env.NVM_DIR || join(homedir(), '.nvm');
const nvmCandidates = [
  join(nvmDirectory, 'nvm.sh'),
  '/opt/homebrew/opt/nvm/libexec/nvm.sh',
  '/usr/local/opt/nvm/nvm.sh',
];
const nvmScript = nvmCandidates.find((candidate) => existsSync(candidate));

if (!nvmScript) {
  console.error('nvm was not found. Install nvm before running a mobile build.');
  process.exit(1);
}

const setupCommands = [
  'source "$PIXELDORO_NVM_SCRIPT"',
  'nvm use "$PIXELDORO_NODE_VERSION"',
  'node -v',
  'pnpm -v',
];
const buildCommands = [
  'pnpm prebuild',
  'pnpm --filter @pixeldoro/mobile run "$PIXELDORO_BUILD_TARGET"',
];
const command = [...setupCommands, ...(checkOnly ? [] : buildCommands)].join(' && ');
const buildEnvironment = {
  ...process.env,
  NVM_DIR: nvmDirectory,
  PIXELDORO_BUILD_TARGET: buildTarget,
  PIXELDORO_NODE_VERSION: nodeVersion,
  PIXELDORO_NVM_SCRIPT: nvmScript,
};

// npm exports its global prefix to child processes, while nvm requires control
// over the active Node prefix when switching versions.
delete buildEnvironment.npm_config_prefix;
delete buildEnvironment.NPM_CONFIG_PREFIX;

const result = spawnSync('/bin/zsh', ['-c', command], {
  cwd: repositoryRoot,
  env: buildEnvironment,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
