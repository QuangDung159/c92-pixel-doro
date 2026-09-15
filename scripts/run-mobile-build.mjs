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

const readGit = (args) => spawnSync('git', args, {
  cwd: repositoryRoot,
  encoding: 'utf8',
});

const requireCleanBuildSource = (phase) => {
  const status = readGit(['status', '--porcelain=v1', '--untracked-files=all']);
  if (status.error) throw status.error;
  if (status.status !== 0) {
    console.error(`Unable to verify Git status ${phase}.`);
    process.exit(1);
  }

  const dirtyEntries = status.stdout.trim();
  if (dirtyEntries !== '') {
    console.error([
      `Refusing mobile build: repository is not clean ${phase}.`,
      'Commit or intentionally discard every tracked/untracked change first.',
      dirtyEntries,
    ].join('\n'));
    process.exit(1);
  }

  const revision = readGit(['rev-parse', 'HEAD']);
  if (revision.error) throw revision.error;
  if (revision.status !== 0) {
    console.error(`Unable to resolve exact Git SHA ${phase}.`);
    process.exit(1);
  }

  const exactSha = revision.stdout.trim();
  if (!/^[0-9a-f]{40}$/u.test(exactSha)) {
    console.error(`Invalid exact Git SHA ${phase}: ${exactSha}`);
    process.exit(1);
  }
  console.log(`Verified clean mobile build source ${phase}: ${exactSha}`);
  return exactSha;
};

const setupCommands = [
  'source "$PIXELDORO_NVM_SCRIPT"',
  'nvm use "$PIXELDORO_NODE_VERSION"',
  'node -v',
  'pnpm -v',
];
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

const runCommands = (commands) => spawnSync(
  '/bin/zsh',
  ['-c', [...setupCommands, ...commands].join(' && ')],
  {
    cwd: repositoryRoot,
    env: buildEnvironment,
    stdio: 'inherit',
  },
);

const sourceSha = requireCleanBuildSource('before prebuild');
const prebuildResult = runCommands(checkOnly ? [] : ['pnpm prebuild']);
if (prebuildResult.error) throw prebuildResult.error;
if ((prebuildResult.status ?? 1) !== 0 || checkOnly) {
  process.exitCode = prebuildResult.status ?? 1;
} else {
  const postPrebuildSha = requireCleanBuildSource('after prebuild');
  if (postPrebuildSha !== sourceSha) {
    console.error(`Build source SHA changed during prebuild: ${sourceSha} -> ${postPrebuildSha}`);
    process.exitCode = 1;
  } else {
    buildEnvironment.PIXELDORO_BUILD_SHA = sourceSha;
    const buildResult = runCommands([
      'pnpm --filter @pixeldoro/mobile run "$PIXELDORO_BUILD_TARGET"',
    ]);
    if (buildResult.error) throw buildResult.error;
    process.exitCode = buildResult.status ?? 1;
  }
}
