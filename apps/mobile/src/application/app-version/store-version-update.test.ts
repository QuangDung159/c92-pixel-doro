import { describe, expect, it, vi } from 'vitest';

import {
  checkForStoreVersionUpdate,
  compareStoreVersions,
  type StoreVersionLookupPort,
} from './store-version-update';

describe('compareStoreVersions', () => {
  it.each([
    ['1.2.0', '1.1.9', 1],
    ['1.0', '1.0.0', 0],
    ['2.0.0', '10.0.0', -1],
    ['1.0.10', '1.0.2', 1],
  ] as const)('compares %s with %s', (first, second, expected) => {
    expect(compareStoreVersions(first, second)).toBe(expected);
  });

  it.each(['', '1.beta.0', '1..0', 'v1.0.0'])('rejects invalid version %s', (version) => {
    expect(compareStoreVersions(version, '1.0.0')).toBeNull();
  });
});

describe('checkForStoreVersionUpdate', () => {
  const latest = { version: '1.1.0', storeUrl: 'https://store.example/app' };

  it('returns store information only when the store version is newer', async () => {
    const lookup: StoreVersionLookupPort = {
      lookupLatestVersion: vi.fn().mockResolvedValue(latest),
    };

    await expect(checkForStoreVersionUpdate('1.0.0', lookup)).resolves.toEqual(latest);
    await expect(checkForStoreVersionUpdate('1.1.0', lookup)).resolves.toBeNull();
    await expect(checkForStoreVersionUpdate('1.2.0', lookup)).resolves.toBeNull();
  });

  it('does not prompt a TestFlight build whose version is ahead of the public store', async () => {
    const lookup: StoreVersionLookupPort = {
      lookupLatestVersion: vi.fn().mockResolvedValue({
        version: '1.4.9',
        storeUrl: 'https://store.example/app',
      }),
    };

    await expect(checkForStoreVersionUpdate('1.5.0', lookup)).resolves.toBeNull();
  });

  it('fails silently when version discovery is unavailable', async () => {
    const lookup: StoreVersionLookupPort = {
      lookupLatestVersion: vi.fn().mockRejectedValue(new Error('offline')),
    };

    await expect(checkForStoreVersionUpdate('1.0.0', lookup)).resolves.toBeNull();
  });
});
