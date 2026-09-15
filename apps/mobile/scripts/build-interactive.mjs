#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const allEnvironmentChoices = [
  { value: 'development', label: 'Development', aliases: ['dev'] },
  { value: 'qa', label: 'QA' },
  { value: 'staging', label: 'Staging', aliases: ['stag'] },
  { value: 'preview', label: 'Preview' },
  { value: 'production', label: 'Production', aliases: ['prod'] },
];

const choose = async (readline, label, choices, defaultValue) => {
  stdout.write(`\n${label}\n`);
  choices.forEach((choice, index) => {
    stdout.write(`  ${index + 1}) ${choice.label}\n`);
  });

  const defaultIndex = choices.findIndex((choice) => choice.value === defaultValue);
  while (true) {
    const answer = (await readline.question(`Select [${defaultIndex + 1}]: `))
      .trim()
      .toLowerCase();
    if (answer === '') return defaultValue;

    const numericIndex = Number(answer) - 1;
    if (Number.isInteger(numericIndex) && choices[numericIndex]) {
      return choices[numericIndex].value;
    }

    const matched = choices.find((choice) =>
      choice.value === answer || choice.aliases?.includes(answer));
    if (matched) return matched.value;
    stdout.write(`Invalid choice. Use 1-${choices.length} or a listed value.\n`);
  }
};

const readline = createInterface({ input: stdin, output: stdout });

const resolveEnvironmentChoices = (platform, type) => {
  if (type === 'simulator') {
    return [{ value: 'development', label: 'Development' }];
  }
  if (platform === 'android' && type === 'aab') {
    return [{ value: 'production', label: 'Production' }];
  }
  if (platform === 'android') {
    return allEnvironmentChoices.filter(({ value }) => value !== 'production');
  }
  return allEnvironmentChoices;
};

const resolveDefaultEnvironment = (platform, type) => {
  if (type === 'simulator') return 'development';
  if (platform === 'ios' || type === 'aab') return 'production';
  return 'development';
};

try {
  const platform = await choose(readline, 'Platform', [
    { value: 'android', label: 'Android', aliases: ['a'] },
    { value: 'ios', label: 'iOS', aliases: ['i'] },
  ], 'android');

  const type = platform === 'ios'
    ? await choose(readline, 'Artifact type', [
      { value: 'ipa', label: 'IPA (device/store)' },
      { value: 'simulator', label: 'iOS Simulator archive' },
    ], 'ipa')
    : await choose(readline, 'Artifact type', [
      { value: 'apk', label: 'APK (install/share directly)' },
      { value: 'aab', label: 'AAB (Google Play)' },
    ], 'aab');

  const environmentChoices = resolveEnvironmentChoices(platform, type);
  const defaultEnvironment = resolveDefaultEnvironment(platform, type);
  const environment = await choose(
    readline,
    'Environment',
    environmentChoices,
    defaultEnvironment,
  );

  const defaultRunner = environment === 'development' ? 'local' : 'eas';
  const runner = await choose(readline, 'Build runner', [
    { value: 'eas', label: 'EAS service (shareable build link)', aliases: ['cloud'] },
    { value: 'local', label: 'Local machine' },
  ], defaultRunner);

  const profile = type === 'simulator' ? 'development-simulator' : environment;
  const extension = type === 'simulator' ? 'tar.gz' : type;
  const outputPath = join(
    mobileRoot,
    'artifacts',
    `pixeldoro-${environment}-${platform}.${extension}`,
  );
  const commandArgs = [
    'dlx',
    'eas-cli@22.6.0',
    'build',
    '--platform',
    platform,
    '--profile',
    profile,
  ];

  if (runner === 'local') {
    commandArgs.push('--local', '--output', outputPath);
  }

  stdout.write([
    '',
    'Build selection',
    `  Platform: ${platform}`,
    `  Type: ${type}`,
    `  Environment/profile: ${environment}`,
    `  Runner: ${runner}`,
    runner === 'local' ? `  Output: ${outputPath}` : '  Output: EAS build page',
    '',
  ].join('\n'));

  if (dryRun) {
    stdout.write(`Dry run: pnpm ${commandArgs.join(' ')}\n`);
  } else {
    if (runner === 'local') {
      mkdirSync(join(mobileRoot, 'artifacts'), { recursive: true });
    }
    const result = spawnSync('pnpm', commandArgs, {
      cwd: mobileRoot,
      env: {
        ...process.env,
        EAS_LOCAL_BUILD_PLUGIN_PATH: join(
          mobileRoot,
          'node_modules',
          '.bin',
          'eas-cli-local-build-plugin',
        ),
      },
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  }
} finally {
  readline.close();
}
