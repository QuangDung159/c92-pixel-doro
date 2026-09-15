export interface StoreVersionInfo {
  readonly version: string;
  readonly storeUrl: string;
}

export interface StoreVersionLookupPort {
  lookupLatestVersion: () => Promise<StoreVersionInfo | null>;
}

const numericVersionParts = (version: string): readonly number[] | null => {
  const normalized = version.trim();
  if (!/^\d+(?:\.\d+)*$/.test(normalized)) return null;

  const parts = normalized.split('.').map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
};

export const compareStoreVersions = (first: string, second: string): number | null => {
  const firstParts = numericVersionParts(first);
  const secondParts = numericVersionParts(second);
  if (firstParts === null || secondParts === null) return null;

  const partCount = Math.max(firstParts.length, secondParts.length);
  for (let index = 0; index < partCount; index += 1) {
    const difference = (firstParts[index] ?? 0) - (secondParts[index] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }

  return 0;
};

export const checkForStoreVersionUpdate = async (
  currentVersion: string | null,
  lookup: StoreVersionLookupPort,
): Promise<StoreVersionInfo | null> => {
  if (currentVersion === null) return null;

  try {
    const latest = await lookup.lookupLatestVersion();
    if (latest === null) return null;

    return compareStoreVersions(latest.version, currentVersion) === 1 ? latest : null;
  } catch {
    // Version discovery is advisory and must never block the offline-first app boot.
    return null;
  }
};
