import type { StoreVersionInfo, StoreVersionLookupPort } from '@/application';

export type StorePlatform = 'android' | 'ios';

type FetchResponse = Pick<Response, 'json' | 'ok' | 'text'>;
type FetchImplementation = (
  input: string,
  init?: RequestInit,
) => Promise<FetchResponse>;

interface StoreVersionGatewayOptions {
  readonly applicationId: string;
  readonly fetch?: FetchImplementation;
  readonly manifestUrl?: string;
  readonly platform: StorePlatform;
  readonly timeoutMs?: number;
}

interface VersionManifestEntry {
  readonly version?: unknown;
  readonly storeUrl?: unknown;
}

interface VersionManifest {
  readonly android?: VersionManifestEntry;
  readonly ios?: VersionManifestEntry;
}

interface AppleLookupResult {
  readonly trackId?: unknown;
  readonly trackViewUrl?: unknown;
  readonly version?: unknown;
}

interface AppleLookupResponse {
  readonly results?: unknown;
}

const DEFAULT_TIMEOUT_MS = 6_000;
const VERSION_PATTERN = /^\d+(?:\.\d+)*$/;

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const validVersion = (value: unknown): value is string =>
  nonEmptyString(value) && VERSION_PATTERN.test(value.trim());

const manifestEntry = (value: VersionManifestEntry | undefined): StoreVersionInfo | null => {
  if (!validVersion(value?.version) || !nonEmptyString(value.storeUrl)) return null;
  return { version: value.version.trim(), storeUrl: value.storeUrl };
};

const extractAndroidVersion = (html: string): string | null => {
  const patterns = [
    /itemprop=["']softwareVersion["'][^>]*content=["'](\d+(?:\.\d+)+)["']/i,
    /["']softwareVersion["']\s*:\s*["'](\d+(?:\.\d+)+)["']/i,
    /\[\[\[?["'](\d+(?:\.\d+)+)["']\]\]\]?/,
  ];

  for (const pattern of patterns) {
    const version = html.match(pattern)?.[1];
    if (validVersion(version)) return version;
  }
  return null;
};

const fetchWithTimeout = async (
  fetchImplementation: FetchImplementation,
  url: string,
  timeoutMs: number,
): Promise<FetchResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImplementation(url, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

export class StoreVersionGateway implements StoreVersionLookupPort {
  private readonly fetchImplementation: FetchImplementation;
  private readonly timeoutMs: number;

  public constructor(private readonly options: StoreVersionGatewayOptions) {
    this.fetchImplementation = options.fetch ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  public async lookupLatestVersion(): Promise<StoreVersionInfo | null> {
    const configured = await this.lookupManifestVersion();
    if (configured !== null) return configured;

    return this.options.platform === 'ios'
      ? this.lookupAppleVersion()
      : this.lookupGooglePlayVersion();
  }

  private async lookupManifestVersion(): Promise<StoreVersionInfo | null> {
    if (!nonEmptyString(this.options.manifestUrl)) return null;

    try {
      const response = await fetchWithTimeout(
        this.fetchImplementation,
        this.options.manifestUrl,
        this.timeoutMs,
      );
      if (!response.ok) return null;
      const payload = await response.json() as VersionManifest;
      return manifestEntry(payload[this.options.platform]);
    } catch {
      return null;
    }
  }

  private async lookupAppleVersion(): Promise<StoreVersionInfo | null> {
    const query = new URLSearchParams({
      bundleId: this.options.applicationId,
      country: 'vn',
      entity: 'software',
      cacheBust: String(Date.now()),
    });
    const response = await fetchWithTimeout(
      this.fetchImplementation,
      `https://itunes.apple.com/lookup?${query.toString()}`,
      this.timeoutMs,
    );
    if (!response.ok) return null;

    const payload = await response.json() as AppleLookupResponse;
    if (!Array.isArray(payload.results)) return null;
    const result = payload.results[0] as AppleLookupResult | undefined;
    if (!validVersion(result?.version)) return null;

    const fallbackUrl = typeof result.trackId === 'number'
      ? `https://apps.apple.com/app/id${result.trackId}`
      : null;
    const storeUrl = nonEmptyString(result.trackViewUrl) ? result.trackViewUrl : fallbackUrl;
    return storeUrl === null
      ? null
      : { version: result.version.trim(), storeUrl };
  }

  private async lookupGooglePlayVersion(): Promise<StoreVersionInfo | null> {
    const query = new URLSearchParams({
      id: this.options.applicationId,
      hl: 'vi',
      gl: 'VN',
    });
    const storeUrl = `https://play.google.com/store/apps/details?${query.toString()}`;
    const response = await fetchWithTimeout(
      this.fetchImplementation,
      `${storeUrl}&cacheBust=${Date.now()}`,
      this.timeoutMs,
    );
    if (!response.ok) return null;

    const version = extractAndroidVersion(await response.text());
    return version === null ? null : { version, storeUrl };
  }
}

export const storeVersionParsing = { extractAndroidVersion, manifestEntry };
