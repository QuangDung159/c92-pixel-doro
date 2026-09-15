import { describe, expect, it } from 'vitest';

import { selectOtaReleaseInfo } from './ota-release-info';

const runtime = {
  appVersion: '1.0.1',
  enabled: true,
  channel: 'staging',
  runtimeVersion: '1.0.1',
  currentUpdateId: 'current-id',
  isEmbeddedLaunch: false,
  otaNumber: '1789489114',
};

describe('OTA release info', () => {
  it('exposes the exact running version and timestamp OTA number', () => {
    expect(selectOtaReleaseInfo({
      status: 'idle', runtime, lastCheckedAt: 1789440001000,
    })).toEqual({
      appVersion: '1.0.1',
      channel: 'staging',
      isEmbeddedLaunch: false,
      lastCheckedAt: 1789440001000,
      latestStatus: 'latest',
      otaNumber: '1789489114',
      runtimeVersion: '1.0.1',
    });
  });

  it('never claims latest while an update is pending or a check failed', () => {
    expect(selectOtaReleaseInfo({
      status: 'pending', runtime,
      update: { kind: 'update', updateId: 'next-id' }, prompt: 'deferred',
      deferredReason: 'active_focus',
    }).latestStatus).toBe('update_available');
    expect(selectOtaReleaseInfo({
      status: 'idle', runtime, lastError: 'CHECK_FAILED',
    }).latestStatus).toBe('unknown');
  });
});
