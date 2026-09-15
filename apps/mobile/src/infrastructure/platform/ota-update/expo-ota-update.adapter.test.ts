import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ExpoOtaUpdateAdapter,
  OTA_ROLLBACK_TO_EMBEDDED_UPDATE_ID,
} from './expo-ota-update.adapter';

const updateId = '11111111-1111-4111-8111-111111111111';
const nextUpdateId = '22222222-2222-4222-8222-222222222222';
const state = vi.hoisted(() => ({
  enabled: true,
  channel: 'staging' as string | null,
  runtimeVersion: '1.0.1' as string | null,
  currentUpdateId: '11111111-1111-4111-8111-111111111111' as string | null,
  embedded: false,
  createdAt: new Date('2026-09-15T00:00:00.000Z') as Date | null,
}));
const checkForUpdateAsync = vi.hoisted(() => vi.fn());
const fetchUpdateAsync = vi.hoisted(() => vi.fn());
const reloadAsync = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('expo-updates', () => ({
  get isEnabled() { return state.enabled; },
  get channel() { return state.channel; },
  get runtimeVersion() { return state.runtimeVersion; },
  get updateId() { return state.currentUpdateId; },
  get isEmbeddedLaunch() { return state.embedded; },
  get createdAt() { return state.createdAt; },
  checkForUpdateAsync,
  fetchUpdateAsync,
  reloadAsync,
}));
vi.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.1' }));

describe('ExpoOtaUpdateAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.enabled = true;
    state.channel = 'staging';
    state.runtimeVersion = '1.0.1';
    state.currentUpdateId = updateId;
    state.embedded = false;
    state.createdAt = new Date('2026-09-15T00:00:00.000Z');
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_OTA_NUMBER;
  });

  it('maps immutable runtime facts without exposing Expo to Application', async () => {
    await expect(new ExpoOtaUpdateAdapter().getRuntimeInfo()).resolves.toEqual({
      appVersion: '1.0.1',
      enabled: true,
      channel: 'staging',
      runtimeVersion: '1.0.1',
      currentUpdateId: updateId,
      isEmbeddedLaunch: false,
      otaNumber: String(Math.floor(new Date('2026-09-15T00:00:00.000Z').getTime() / 1000)),
    });
  });

  it('prefers one publish-time OTA number shared by both platform bundles', async () => {
    process.env.EXPO_PUBLIC_OTA_NUMBER = '1789489114';
    await expect(new ExpoOtaUpdateAdapter().getRuntimeInfo()).resolves.toMatchObject({
      otaNumber: '1789489114',
    });
  });

  it('maps no-update, update, and rollback checks', async () => {
    const adapter = new ExpoOtaUpdateAdapter();
    checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: false, isRollBackToEmbedded: false });
    await expect(adapter.checkForUpdate()).resolves.toEqual({ outcome: 'no_update' });

    checkForUpdateAsync.mockResolvedValueOnce({
      isAvailable: true,
      isRollBackToEmbedded: false,
      manifest: { id: nextUpdateId.toUpperCase() },
    });
    await expect(adapter.checkForUpdate()).resolves.toEqual({
      outcome: 'available',
      update: { kind: 'update', updateId: nextUpdateId },
    });

    checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: false, isRollBackToEmbedded: true });
    await expect(adapter.checkForUpdate()).resolves.toEqual({
      outcome: 'available',
      update: { kind: 'rollback_to_embedded', updateId: OTA_ROLLBACK_TO_EMBEDDED_UPDATE_ID },
    });
  });

  it('rejects malformed manifests and maps fetch outcomes', async () => {
    const adapter = new ExpoOtaUpdateAdapter();
    checkForUpdateAsync.mockResolvedValueOnce({
      isAvailable: true,
      isRollBackToEmbedded: false,
      manifest: { id: 'not-an-update-id' },
    });
    await expect(adapter.checkForUpdate()).rejects.toThrow('OTA_UPDATE_MANIFEST_INVALID');

    fetchUpdateAsync.mockResolvedValueOnce({ isNew: false, isRollBackToEmbedded: false });
    await expect(adapter.fetchUpdate()).resolves.toEqual({ outcome: 'not_downloaded' });
    fetchUpdateAsync.mockResolvedValueOnce({
      isNew: true,
      isRollBackToEmbedded: false,
      manifest: { id: nextUpdateId },
    });
    await expect(adapter.fetchUpdate()).resolves.toEqual({
      outcome: 'downloaded',
      update: { kind: 'update', updateId: nextUpdateId },
    });
    fetchUpdateAsync.mockResolvedValueOnce({ isNew: false, isRollBackToEmbedded: true });
    await expect(adapter.fetchUpdate()).resolves.toEqual({
      outcome: 'downloaded',
      update: { kind: 'rollback_to_embedded', updateId: OTA_ROLLBACK_TO_EMBEDDED_UPDATE_ID },
    });
  });

  it('delegates reload exactly once', async () => {
    await new ExpoOtaUpdateAdapter().reload();
    expect(reloadAsync).toHaveBeenCalledOnce();
  });
});
