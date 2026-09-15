import { describe, expect, it } from 'vitest';

import {
  classifyMobileUpdate,
  classifyMobileUpdatePath,
  MobileUpdateOutcome,
  readMobileRuntimeManifest,
  sanitizeUpdateReceipt,
  validateUpdateReceiptIdentity,
} from './mobile-update-policy.mjs';

const sha = 'a'.repeat(40);
const otherSha = 'b'.repeat(40);

describe('mobile update policy', () => {
  it.each([
    ['apps/mobile/src/presentation/components/card.tsx', MobileUpdateOutcome.ELIGIBLE],
    ['apps/mobile/assets/images/pet.png', MobileUpdateOutcome.ELIGIBLE],
    ['apps/mobile/app.config.ts', MobileUpdateOutcome.STORE_BUILD_REQUIRED],
    ['apps/mobile/assets/images/pixeldoro-icon-1024.png', MobileUpdateOutcome.STORE_BUILD_REQUIRED],
    ['pnpm-lock.yaml', MobileUpdateOutcome.STORE_BUILD_REQUIRED],
    ['apps/mobile/ios/PixelDoro/Info.plist', MobileUpdateOutcome.STORE_BUILD_REQUIRED],
    ['apps/mobile/src/infrastructure/database/migrations/0004.ts', MobileUpdateOutcome.UNDETERMINED_BLOCKED],
    ['packages/domain/src/session/session.ts', MobileUpdateOutcome.UNDETERMINED_BLOCKED],
    ['apps/mobile/src/infrastructure/platform/api/client.ts', MobileUpdateOutcome.UNDETERMINED_BLOCKED],
    ['apps/mobile/src/infrastructure/platform/clock/device-clock.adapter.ts', MobileUpdateOutcome.UNDETERMINED_BLOCKED],
    ['docs/planning/plan.md', MobileUpdateOutcome.NO_OTA_CHANGE],
    ['unknown/file.bin', MobileUpdateOutcome.UNDETERMINED_BLOCKED],
  ])('classifies %s fail closed', (path, outcome) => {
    expect(classifyMobileUpdatePath(path).outcome).toBe(outcome);
  });

  it('blocks dirty and wrong-runtime candidates even for JS-only changes', () => {
    const result = classifyMobileUpdate({
      paths: ['apps/mobile/src/presentation/home.tsx'],
      baseSha: sha,
      headSha: otherSha,
      dirty: true,
      expectedRuntime: '2.0.0',
      actualRuntime: '1.0.1',
      semanticFindings: ['PUBLIC_ENVIRONMENT_VALUE_CHANGED'],
    });
    expect(result.outcome).toBe(MobileUpdateOutcome.UNDETERMINED_BLOCKED);
    expect(result.blockers).toEqual([
      'DIRTY_WORKTREE', 'RUNTIME_MISMATCH', 'PUBLIC_ENVIRONMENT_VALUE_CHANGED',
    ]);
  });

  it('resolves the checked-in runtime/profile manifest', () => {
    const manifest = readMobileRuntimeManifest(process.cwd());
    expect(manifest).toMatchObject({
      runtimePolicy: 'appVersion',
      runtimeVersion: '1.0.1',
      platforms: {
        android: { applicationId: 'com.dragonc92team.pixeldoro', versionCode: 1 },
        ios: { bundleIdentifier: 'com.dragonc92team.pixeldoro', buildNumber: '2' },
      },
      profiles: {
        qa: { channel: 'qa', environment: 'preview' },
        staging: { channel: 'staging', environment: 'production' },
        production: { channel: 'production', environment: 'production' },
      },
    });
    expect(manifest.configHash).toMatch(/^[0-9a-f]{64}$/u);
  });

  it('validates a sanitized single-group receipt and rejects sensitive input', () => {
    const receipt = sanitizeUpdateReceipt([
      { id: 'ios-id', group: 'group-id', platform: 'ios', runtimeVersion: '1.0.1' },
      { id: 'android-id', group: 'group-id', platform: 'android', runtimeVersion: '1.0.1' },
    ]);
    expect(validateUpdateReceiptIdentity(receipt, {
      platform: 'all', runtimeVersion: '1.0.1',
    })).toMatchObject({ schemaVersion: 1, updates: [{ platform: 'ios' }, { platform: 'android' }] });
    expect(() => sanitizeUpdateReceipt({ token: 'do-not-log', updates: [] }))
      .toThrow('UPDATE_RECEIPT_SENSITIVE_FIELD');
    expect(() => validateUpdateReceiptIdentity(receipt, {
      platform: 'ios', runtimeVersion: '1.0.1',
    })).toThrow('UPDATE_RECEIPT_PLATFORM_MISMATCH');
    expect(() => validateUpdateReceiptIdentity(receipt, {
      platform: 'all', runtimeVersion: '2.0.0',
    })).toThrow('UPDATE_RECEIPT_RUNTIME_MISMATCH');
  });
});
