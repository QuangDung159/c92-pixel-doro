#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import {
  classifyMobileUpdate,
  MobileUpdateOutcome,
  readMobileRuntimeManifest,
  sanitizeUpdateReceipt,
  validateUpdateReceiptIdentity,
} from './mobile-update-policy.mjs';

const repositoryRoot = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index < 0 ? undefined : args[index + 1];
};
const runGit = (gitArgs) => spawnSync('git', gitArgs, {
  cwd: repositoryRoot,
  encoding: 'utf8',
});
const requireGit = (gitArgs, label) => {
  const result = runGit(gitArgs);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label}:${result.stderr.trim()}`);
  return result.stdout.trim();
};

const mode = args[0];
if (mode === 'manifest') {
  const sourceSha = requireGit(['rev-parse', 'HEAD'], 'HEAD_UNRESOLVED');
  const dirty = requireGit(['status', '--porcelain=v1', '--untracked-files=all'], 'STATUS_FAILED') !== '';
  console.log(JSON.stringify({
    ...readMobileRuntimeManifest(repositoryRoot),
    sourceSha,
    dirty,
  }, null, 2));
  process.exit(0);
}
if (mode !== 'source') {
  console.error('Usage: node scripts/run-mobile-update.mjs manifest | source --target qa|staging --base <sha> --runtime <version> --platform android|ios|all --message <text> --dry-run');
  process.exit(1);
}

const target = valueFor('--target');
const base = valueFor('--base');
const expectedRuntime = valueFor('--runtime');
const platform = valueFor('--platform');
const message = valueFor('--message');
const dryRun = args.includes('--dry-run');
const execute = args.includes('--execute');
const authorization = valueFor('--authorization');
const otaNumber = String(Date.now());
if (target === 'production') throw new Error('DIRECT_PRODUCTION_SOURCE_PUBLISH_FORBIDDEN');
if (target !== 'qa' && target !== 'staging') throw new Error('UPDATE_TARGET_INVALID');
if (base === undefined || expectedRuntime === undefined || message === undefined || message.trim() === '') {
  throw new Error('UPDATE_REQUIRED_ARGUMENT_MISSING');
}
if (platform !== 'android' && platform !== 'ios' && platform !== 'all') {
  throw new Error('UPDATE_PLATFORM_INVALID');
}
if (dryRun === execute) throw new Error('CHOOSE_EXACTLY_ONE_OF_DRY_RUN_OR_EXECUTE');
if (execute && (authorization === undefined || !/^OTA-NONPROD-[A-Z0-9-]+$/u.test(authorization))) {
  throw new Error('NONPRODUCTION_EXECUTION_AUTHORIZATION_MISSING');
}

const manifest = readMobileRuntimeManifest(repositoryRoot);
const head = requireGit(['rev-parse', 'HEAD'], 'HEAD_UNRESOLVED');
requireGit(['merge-base', '--is-ancestor', base, head], 'BASE_NOT_ANCESTOR');
const dirty = requireGit(['status', '--porcelain=v1', '--untracked-files=all'], 'STATUS_FAILED') !== '';
const paths = requireGit(['diff', '--name-only', '--diff-filter=ACMRD', `${base}..${head}`], 'DIFF_FAILED')
  .split('\n').filter(Boolean);
const sourceDiff = requireGit(['diff', '--unified=0', `${base}..${head}`, '--', '*.ts', '*.tsx', '*.js', '*.mjs'], 'SOURCE_DIFF_FAILED');
const semanticFindings = [
  /^\+[^+].*EXPO_PUBLIC_/mu.test(sourceDiff) ? 'PUBLIC_ENVIRONMENT_VALUE_CHANGED' : null,
  /^\+[^+].*https?:\/\//mu.test(sourceDiff) ? 'NETWORK_ENDPOINT_CHANGED' : null,
].filter(Boolean);
const classification = classifyMobileUpdate({
  paths,
  baseSha: base,
  headSha: head,
  dirty,
  expectedRuntime,
  actualRuntime: manifest.runtimeVersion,
  semanticFindings,
});
const profile = manifest.profiles[target];
const command = [
  'pnpm', 'dlx', 'eas-cli@22.6.0', 'update',
  '--channel', profile.channel,
  '--environment', profile.environment,
  '--platform', platform,
  '--message', message,
  '--json', '--non-interactive',
];
if (classification.outcome !== MobileUpdateOutcome.ELIGIBLE) {
  console.log(JSON.stringify({
    action: 'BLOCKED',
    target,
    platform,
    runtimeVersion: manifest.runtimeVersion,
    classification,
  }, null, 2));
  throw new Error(`UPDATE_CANDIDATE_NOT_ELIGIBLE:${classification.outcome}`);
}
const preflight = Object.freeze({
  action: dryRun ? 'DRY_RUN' : 'PUBLISH_NONPRODUCTION',
  target,
  platform,
  channel: profile.channel,
  environment: profile.environment,
  runtimeVersion: manifest.runtimeVersion,
  otaNumber,
  message,
  command,
  classification,
});
console.log(JSON.stringify(preflight, null, 2));
if (dryRun) process.exit(0);

const quality = spawnSync('pnpm', ['quality'], { cwd: repositoryRoot, stdio: 'inherit' });
if (quality.error) throw quality.error;
if (quality.status !== 0) throw new Error('UPDATE_QUALITY_FAILED');
if (requireGit(['rev-parse', 'HEAD'], 'HEAD_RECHECK_FAILED') !== head ||
  requireGit(['status', '--porcelain=v1', '--untracked-files=all'], 'STATUS_RECHECK_FAILED') !== '') {
  throw new Error('UPDATE_SOURCE_CHANGED_DURING_QUALITY');
}
const publish = spawnSync(command[0], command.slice(1), {
  cwd: resolve(repositoryRoot, 'apps/mobile'),
  encoding: 'utf8',
  env: { ...process.env, EXPO_PUBLIC_OTA_NUMBER: otaNumber },
});
if (publish.error) throw publish.error;
if (publish.status !== 0) throw new Error('UPDATE_PUBLISH_FAILED');
let rawReceipt;
try {
  rawReceipt = JSON.parse(publish.stdout);
} catch {
  throw new Error('UPDATE_PUBLISH_RECEIPT_MALFORMED');
}
const receipt = validateUpdateReceiptIdentity(sanitizeUpdateReceipt(rawReceipt), {
  platform,
  runtimeVersion: manifest.runtimeVersion,
});
console.log(JSON.stringify({
  schemaVersion: 1,
  sourceSha: head,
  runtimeVersion: manifest.runtimeVersion,
  otaNumber,
  channel: profile.channel,
  environment: profile.environment,
  ...receipt,
}, null, 2));
