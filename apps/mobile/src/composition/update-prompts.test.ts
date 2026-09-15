import { describe, expect, it } from 'vitest';

import { otaPromptOwnsModal } from './update-prompt-policy';

describe('update prompt arbitration', () => {
  it('gives the modal lease only to an actionable or restarting OTA', () => {
    expect(otaPromptOwnsModal({ status: 'initializing' })).toBe(false);
    expect(otaPromptOwnsModal({
      status: 'pending',
      prompt: 'deferred',
      runtime: {
        appVersion: '1.0.1',
        enabled: true,
        channel: 'staging',
        runtimeVersion: '1.0.1',
        currentUpdateId: null,
        isEmbeddedLaunch: true,
        otaNumber: '1789489114',
      },
      update: { kind: 'update', updateId: 'update-id' },
    })).toBe(false);
    expect(otaPromptOwnsModal({
      status: 'pending',
      prompt: 'visible',
      runtime: {
        appVersion: '1.0.1',
        enabled: true,
        channel: 'staging',
        runtimeVersion: '1.0.1',
        currentUpdateId: null,
        isEmbeddedLaunch: true,
        otaNumber: '1789489114',
      },
      update: { kind: 'update', updateId: 'update-id' },
    })).toBe(true);
  });
});
