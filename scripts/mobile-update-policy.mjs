import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const MOBILE_UPDATE_CLASSIFIER_VERSION = '1.0.0';

export const MobileUpdateOutcome = Object.freeze({
  ELIGIBLE: 'OTA_ELIGIBLE',
  NO_OTA_CHANGE: 'NO_OTA_CHANGE',
  STORE_BUILD_REQUIRED: 'STORE_BUILD_REQUIRED',
  UNDETERMINED_BLOCKED: 'UNDETERMINED_BLOCKED',
});

const nativePatterns = [
  /(^|\/)package\.json$/u,
  /^pnpm-lock\.yaml$/u,
  /^apps\/mobile\/app\.config\.[cm]?[jt]s$/u,
  /^apps\/mobile\/(android|ios)\//u,
  /^apps\/mobile\/(GoogleService-Info\.plist|google-services\.json)$/u,
  /^apps\/mobile\/assets\/.*(icon|splash)/iu,
  /(^|\/)(Podfile|Gemfile|gradle\.properties|settings\.gradle)$/u,
];
const dataUnsafePatterns = [
  /^apps\/mobile\/src\/infrastructure\/database\//u,
  /^apps\/mobile\/src\/application\/(bootstrap|reset)\//u,
  /^packages\/(domain|application)\/src\//u,
  /(^|\/)(migrations?|schema|persistence|repositories?)\//iu,
];
const environmentOrApiPatterns = [
  /(^|\/)\.env(\.|$)/u,
  /(^|\/)(api|network|http)(\/|\.|-)/iu,
  /EXPO_PUBLIC_/u,
];
const otaSourcePatterns = [
  /^apps\/mobile\/src\/(app|application|composition|presentation)\//u,
  /^apps\/mobile\/assets\//u,
];
const infrastructurePattern = /^apps\/mobile\/src\/infrastructure\//u;
const nonBundlePatterns = [
  /(^|\/)(docs?|test|tests|scripts)\//u,
  /(^|\/).*\.(md|mdx)$/u,
  /^eslint\.config\./u,
  /^tsconfig.*\.json$/u,
  /^apps\/mobile\/eas\.json$/u,
];

export const classifyMobileUpdatePath = (path) => {
  if (nativePatterns.some((pattern) => pattern.test(path))) {
    return { path, outcome: MobileUpdateOutcome.STORE_BUILD_REQUIRED, reason: 'NATIVE_SURFACE_CHANGED' };
  }
  if (dataUnsafePatterns.some((pattern) => pattern.test(path))) {
    return { path, outcome: MobileUpdateOutcome.UNDETERMINED_BLOCKED, reason: 'PERSISTED_DATA_CONTRACT_UNPROVEN' };
  }
  if (environmentOrApiPatterns.some((pattern) => pattern.test(path))) {
    return { path, outcome: MobileUpdateOutcome.UNDETERMINED_BLOCKED, reason: 'ENVIRONMENT_OR_API_CONTRACT_UNPROVEN' };
  }
  if (infrastructurePattern.test(path)) {
    return { path, outcome: MobileUpdateOutcome.UNDETERMINED_BLOCKED, reason: 'INFRASTRUCTURE_CHANGE_REVIEW_REQUIRED' };
  }
  if (otaSourcePatterns.some((pattern) => pattern.test(path))) {
    return { path, outcome: MobileUpdateOutcome.ELIGIBLE, reason: 'JS_OR_BUNDLED_ASSET_CANDIDATE' };
  }
  if (nonBundlePatterns.some((pattern) => pattern.test(path))) {
    return { path, outcome: MobileUpdateOutcome.NO_OTA_CHANGE, reason: 'NOT_IN_UPDATE_BUNDLE' };
  }
  return { path, outcome: MobileUpdateOutcome.UNDETERMINED_BLOCKED, reason: 'UNKNOWN_PATH_FAIL_CLOSED' };
};

export const classifyMobileUpdate = ({
  paths,
  baseSha,
  headSha,
  dirty = false,
  expectedRuntime,
  actualRuntime,
  semanticFindings = [],
}) => {
  const entries = [...new Set(paths)].sort().map(classifyMobileUpdatePath);
  let outcome = entries.some((entry) => entry.outcome === MobileUpdateOutcome.STORE_BUILD_REQUIRED)
    ? MobileUpdateOutcome.STORE_BUILD_REQUIRED
    : entries.some((entry) => entry.outcome === MobileUpdateOutcome.UNDETERMINED_BLOCKED)
      ? MobileUpdateOutcome.UNDETERMINED_BLOCKED
      : entries.some((entry) => entry.outcome === MobileUpdateOutcome.ELIGIBLE)
        ? MobileUpdateOutcome.ELIGIBLE
        : MobileUpdateOutcome.NO_OTA_CHANGE;
  const blockers = [];
  if (dirty) blockers.push('DIRTY_WORKTREE');
  if (!/^[0-9a-f]{40}$/u.test(baseSha) || !/^[0-9a-f]{40}$/u.test(headSha)) {
    blockers.push('UNRESOLVED_SOURCE_SHA');
  }
  if (expectedRuntime !== actualRuntime || expectedRuntime.trim() === '') {
    blockers.push('RUNTIME_MISMATCH');
  }
  blockers.push(...semanticFindings);
  if (blockers.length > 0) outcome = MobileUpdateOutcome.UNDETERMINED_BLOCKED;
  return Object.freeze({
    classifierVersion: MOBILE_UPDATE_CLASSIFIER_VERSION,
    outcome,
    baseSha,
    headSha,
    runtime: actualRuntime,
    blockers,
    entries,
  });
};

const requiredMatch = (source, pattern, label) => {
  const value = source.match(pattern)?.[1];
  if (value === undefined || value.trim() === '') throw new Error(`RUNTIME_MANIFEST_${label}_MISSING`);
  return value;
};

const resolveProfile = (profiles, name, visiting = new Set()) => {
  const profile = profiles[name];
  if (profile === undefined) throw new Error(`RUNTIME_MANIFEST_PROFILE_MISSING:${name}`);
  if (visiting.has(name)) throw new Error(`RUNTIME_MANIFEST_PROFILE_CYCLE:${name}`);
  if (profile.extends === undefined) return { ...profile };
  visiting.add(name);
  const parent = resolveProfile(profiles, profile.extends, visiting);
  visiting.delete(name);
  return { ...parent, ...profile };
};

export const readMobileRuntimeManifest = (repositoryRoot) => {
  const configPath = join(repositoryRoot, 'apps/mobile/app.config.ts');
  const easPath = join(repositoryRoot, 'apps/mobile/eas.json');
  const configSource = readFileSync(configPath, 'utf8');
  const easSource = readFileSync(easPath, 'utf8');
  const eas = JSON.parse(easSource);
  const appVersion = requiredMatch(configSource, /version:\s*["']([^"']+)["']/u, 'APP_VERSION');
  const projectId = requiredMatch(configSource, /const EAS_PROJECT_ID = ["']([^"']+)["']/u, 'PROJECT_ID');
  const iosBundleIdentifier = requiredMatch(
    configSource, /const IOS_BUNDLE_IDENTIFIER = ["']([^"']+)["']/u, 'IOS_BUNDLE_IDENTIFIER',
  );
  const iosBuildNumber = requiredMatch(
    configSource, /const IOS_BUILD_NUMBER = ["']([^"']+)["']/u, 'IOS_BUILD_NUMBER',
  );
  const androidApplicationId = requiredMatch(
    configSource, /const ANDROID_APPLICATION_ID = ["']([^"']+)["']/u, 'ANDROID_APPLICATION_ID',
  );
  const androidVersionCode = Number(requiredMatch(
    configSource, /const ANDROID_VERSION_CODE = (\d+)/u, 'ANDROID_VERSION_CODE',
  ));
  if (!/policy:\s*["']appVersion["']/u.test(configSource)) {
    throw new Error('RUNTIME_MANIFEST_POLICY_UNSUPPORTED');
  }
  const profiles = Object.fromEntries(
    ['development', 'preview', 'qa', 'staging', 'production'].map((name) => {
      const resolved = resolveProfile(eas.build, name);
      if (typeof resolved.channel !== 'string' || typeof resolved.environment !== 'string') {
        throw new Error(`RUNTIME_MANIFEST_PROFILE_INCOMPLETE:${name}`);
      }
      return [name, { channel: resolved.channel, environment: resolved.environment }];
    }),
  );
  return Object.freeze({
    schemaVersion: 1,
    projectId,
    updateUrl: `https://u.expo.dev/${projectId}`,
    appVersion,
    runtimePolicy: 'appVersion',
    runtimeVersion: appVersion,
    platforms: {
      android: { applicationId: androidApplicationId, versionCode: androidVersionCode },
      ios: { bundleIdentifier: iosBundleIdentifier, buildNumber: iosBuildNumber },
    },
    profiles,
    configHash: createHash('sha256').update(configSource).update('\0').update(easSource).digest('hex'),
  });
};

export const sanitizeUpdateReceipt = (value) => {
  const text = JSON.stringify(value);
  if (/(token|authorization|cookie|secret|password)/iu.test(text)) {
    throw new Error('UPDATE_RECEIPT_SENSITIVE_FIELD');
  }
  const updates = Array.isArray(value) ? value : value?.updates;
  if (!Array.isArray(updates) || updates.length === 0) throw new Error('UPDATE_RECEIPT_UPDATES_MISSING');
  const sanitized = updates.map((update) => {
    const id = update.id;
    const group = update.group;
    const platform = update.platform;
    if (![id, group].every((item) => typeof item === 'string' && item.length > 0) ||
      (platform !== 'android' && platform !== 'ios')) {
      throw new Error('UPDATE_RECEIPT_INVALID');
    }
    return { id, group, platform, runtimeVersion: update.runtimeVersion ?? null };
  });
  if (new Set(sanitized.map((update) => update.group)).size !== 1) {
    throw new Error('UPDATE_RECEIPT_GROUP_MISMATCH');
  }
  return Object.freeze({ schemaVersion: 1, updates: sanitized });
};

export const validateUpdateReceiptIdentity = (receipt, { platform, runtimeVersion }) => {
  const expectedPlatforms = platform === 'all' ? ['android', 'ios'] : [platform];
  const actualPlatforms = [...new Set(receipt.updates.map((update) => update.platform))].sort();
  if (JSON.stringify(actualPlatforms) !== JSON.stringify([...expectedPlatforms].sort())) {
    throw new Error('UPDATE_RECEIPT_PLATFORM_MISMATCH');
  }
  if (receipt.updates.some((update) => update.runtimeVersion !== runtimeVersion)) {
    throw new Error('UPDATE_RECEIPT_RUNTIME_MISMATCH');
  }
  return receipt;
};
