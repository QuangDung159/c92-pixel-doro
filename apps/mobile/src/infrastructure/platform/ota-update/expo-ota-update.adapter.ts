import type * as ExpoUpdates from 'expo-updates';

import type {
  OtaCheckResult,
  OtaFetchResult,
  OtaRuntimeInfo,
  OtaUpdateDescriptor,
  OtaUpdatePort,
} from '@/application';

const ROLLBACK_TO_EMBEDDED_ID = 'rollback-to-embedded';
const UPDATE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

const descriptorFromManifest = (
  manifest: { readonly id?: unknown },
): OtaUpdateDescriptor => {
  const id = typeof manifest.id === 'string' ? manifest.id.trim().toLowerCase() : '';
  if (!UPDATE_ID.test(id)) throw new Error('OTA_UPDATE_MANIFEST_INVALID');
  return { kind: 'update', updateId: id };
};

const rollbackDescriptor = (): OtaUpdateDescriptor => ({
  kind: 'rollback_to_embedded',
  updateId: ROLLBACK_TO_EMBEDDED_ID,
});

export class ExpoOtaUpdateAdapter implements OtaUpdatePort {
  private updates: Promise<typeof ExpoUpdates> | undefined;

  private load(): Promise<typeof ExpoUpdates> {
    this.updates ??= import('expo-updates');
    return this.updates;
  }

  async getRuntimeInfo(): Promise<OtaRuntimeInfo> {
    const [Updates, Application] = await Promise.all([
      this.load(),
      import('expo-application'),
    ]);
    const createdAt = Updates.createdAt;
    const configuredOtaNumber = process.env.EXPO_PUBLIC_OTA_NUMBER?.trim();
    return {
      appVersion: Application.nativeApplicationVersion,
      enabled: Updates.isEnabled,
      channel: Updates.channel,
      runtimeVersion: Updates.runtimeVersion,
      currentUpdateId: Updates.updateId,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      otaNumber: configuredOtaNumber !== undefined && /^\d{13}$/u.test(configuredOtaNumber)
        ? configuredOtaNumber
        : createdAt instanceof Date && Number.isFinite(createdAt.getTime())
          ? String(createdAt.getTime())
          : null,
    };
  }

  async checkForUpdate(): Promise<OtaCheckResult> {
    const Updates = await this.load();
    const result = await Updates.checkForUpdateAsync();
    if (result.isRollBackToEmbedded) {
      return { outcome: 'available', update: rollbackDescriptor() };
    }
    if (!result.isAvailable) return { outcome: 'no_update' };
    return { outcome: 'available', update: descriptorFromManifest(result.manifest) };
  }

  async fetchUpdate(): Promise<OtaFetchResult> {
    const Updates = await this.load();
    const result = await Updates.fetchUpdateAsync();
    if (result.isRollBackToEmbedded) {
      return { outcome: 'downloaded', update: rollbackDescriptor() };
    }
    if (!result.isNew) return { outcome: 'not_downloaded' };
    return { outcome: 'downloaded', update: descriptorFromManifest(result.manifest) };
  }

  async reload(): Promise<void> {
    const Updates = await this.load();
    await Updates.reloadAsync();
  }
}

export const OTA_ROLLBACK_TO_EMBEDDED_UPDATE_ID = ROLLBACK_TO_EMBEDDED_ID;
