import { describe, expect, it, vi } from 'vitest';

import { StoreVersionGateway, storeVersionParsing } from './store-version.gateway';

describe('storeVersionParsing', () => {
  it.each([
    ['<meta itemprop="softwareVersion" content="1.2.3">', '1.2.3'],
    ['{"softwareVersion":"2.0.1"}', '2.0.1'],
    ['[[["3.4.5"]]]', '3.4.5'],
  ])('extracts Android version metadata', (html, expected) => {
    expect(storeVersionParsing.extractAndroidVersion(html)).toBe(expected);
  });

  it('rejects an invalid remote manifest entry', () => {
    expect(storeVersionParsing.manifestEntry({
      version: 'next',
      storeUrl: 'https://store.example/app',
    })).toBeNull();
  });
});

describe('StoreVersionGateway', () => {
  it('uses a configured manifest as the authoritative cross-platform source', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        android: { version: '1.2.0', storeUrl: 'https://play.example/app' },
      }),
      text: vi.fn(),
    });
    const gateway = new StoreVersionGateway({
      applicationId: 'com.example.app',
      fetch: fetchImplementation,
      manifestUrl: 'https://example.com/version.json',
      platform: 'android',
    });

    await expect(gateway.lookupLatestVersion()).resolves.toEqual({
      version: '1.2.0',
      storeUrl: 'https://play.example/app',
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it('reads iOS version and listing URL from Apple lookup', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        results: [{ version: '1.3.0', trackId: 123, trackViewUrl: 'https://apps.apple.com/app/id123' }],
      }),
      text: vi.fn(),
    });
    const gateway = new StoreVersionGateway({
      applicationId: 'com.example.app',
      fetch: fetchImplementation,
      platform: 'ios',
    });

    await expect(gateway.lookupLatestVersion()).resolves.toEqual({
      version: '1.3.0',
      storeUrl: 'https://apps.apple.com/app/id123',
    });
  });

  it('fails closed when a store response has no valid version', async () => {
    const gateway = new StoreVersionGateway({
      applicationId: 'com.example.app',
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn(),
        text: vi.fn().mockResolvedValue('<html>not listed</html>'),
      }),
      platform: 'android',
    });

    await expect(gateway.lookupLatestVersion()).resolves.toBeNull();
  });
});
