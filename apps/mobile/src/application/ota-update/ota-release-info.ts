import type { OtaUpdateProjection } from './ota-update.controller';

export type OtaLatestStatus =
  | 'checking'
  | 'latest'
  | 'update_available'
  | 'unavailable'
  | 'unknown';

export interface OtaReleaseInfo {
  readonly appVersion: string | null;
  readonly channel: string | null;
  readonly isEmbeddedLaunch: boolean | null;
  readonly lastCheckedAt: number | null;
  readonly latestStatus: OtaLatestStatus;
  readonly otaNumber: string | null;
  readonly runtimeVersion: string | null;
}

export const selectOtaReleaseInfo = (
  projection: OtaUpdateProjection,
): OtaReleaseInfo => {
  const runtime = 'runtime' in projection ? projection.runtime : undefined;
  let latestStatus: OtaLatestStatus = 'unknown';
  if (projection.status === 'initializing' || projection.status === 'checking') {
    latestStatus = 'checking';
  } else if (projection.status === 'unavailable') {
    latestStatus = 'unavailable';
  } else if (
    projection.status === 'downloading' ||
    projection.status === 'pending' ||
    projection.status === 'restarting' ||
    (projection.status === 'idle' && projection.lastError === 'FETCH_FAILED')
  ) {
    latestStatus = 'update_available';
  } else if (
    projection.status === 'idle' &&
    projection.lastCheckedAt !== undefined &&
    projection.lastError === undefined
  ) {
    latestStatus = 'latest';
  }
  return {
    appVersion: runtime?.appVersion ?? null,
    channel: runtime?.channel ?? null,
    isEmbeddedLaunch: runtime?.isEmbeddedLaunch ?? null,
    lastCheckedAt: 'lastCheckedAt' in projection ? projection.lastCheckedAt ?? null : null,
    latestStatus,
    otaNumber: runtime?.otaNumber ?? null,
    runtimeVersion: runtime?.runtimeVersion ?? null,
  };
};
