import { describe, expect, it } from 'vitest';

import {
  mapCatalogItemRow,
  mapInstallationRow,
  mapProfileRow,
  mapSettingsRow,
} from './foundation-row.mapper';
import {
  mapOwnedItemRow,
  mapPurchaseReceiptRow,
  mapRewardReceiptRow,
} from './economy-row.mapper';
import {
  mapAnalyticsEventRow,
  mapStoreReviewAttemptRow,
  serializeAnalyticsProperties,
} from './metadata-row.mapper';
import { mapSessionRow, type SessionRow } from './session-row.mapper';

const timestamp = 1_700_000_000_000;

const runningSessionRow = (): SessionRow => ({
  id: 'session-1',
  profile_id: 1,
  session_type: 'focus',
  focus_variant: 'standard',
  mode: 'strict',
  status: 'running',
  work_tag: 'coding',
  configured_duration_minutes: 25,
  started_at: timestamp,
  ends_at: timestamp + 25 * 60_000,
  backgrounded_at: null,
  resolved_at: null,
  xp_earned: 0,
  coins_earned: 0,
  reward_claimed_at: null,
  scheduled_end_local_date: '2026-08-28',
  scheduled_end_utc_offset_minutes: 420,
  created_at: timestamp,
  updated_at: timestamp,
});

describe('durable row mappers', () => {
  it('maps all bootstrap entity rows without leaking snake_case fields', () => {
    const installation = mapInstallationRow({
      id: 1,
      installed_at: timestamp,
      onboarding_completed_at: null,
      anonymous_analytics_id: 'anonymous-1',
      created_at: timestamp,
      updated_at: timestamp,
    });
    const settings = mapSettingsRow({
      id: 1,
      focus_duration_minutes: 25,
      short_break_minutes: 5,
      long_break_minutes: 15,
      default_mode: 'strict',
      sound_enabled: 1,
      haptics_enabled: 0,
      notifications_enabled: 1,
      analytics_enabled: 0,
      created_at: timestamp,
      updated_at: timestamp,
    });
    const profile = mapProfileRow({
      id: 1,
      total_xp: 25,
      coin_balance: 5,
      created_at: timestamp,
      updated_at: timestamp,
    });
    const catalog = mapCatalogItemRow({
      id: 'desk-lamp',
      display_name: 'Desk Lamp',
      category: 'furniture',
      price_coins: 10,
      catalog_version: 1,
      created_at: timestamp,
      updated_at: timestamp,
    });

    expect(installation).toMatchObject({ ok: true, value: { installedAt: timestamp } });
    expect(settings).toMatchObject({ ok: true, value: { defaultMode: 'strict', hapticsEnabled: false } });
    expect(profile).toMatchObject({ ok: true, value: { totalXp: 25, coinBalance: 5 } });
    expect(catalog).toMatchObject({ ok: true, value: { displayName: 'Desk Lamp', priceCoins: 10 } });
    expect('installed_at' in (installation.ok ? installation.value : {})).toBe(false);
  });

  it.each([
    ['installation nullability', () => mapInstallationRow({
      id: 1, installed_at: timestamp, onboarding_completed_at: 'bad',
      anonymous_analytics_id: null, created_at: timestamp, updated_at: timestamp,
    }), 'onboarding_completed_at'],
    ['settings boolean', () => mapSettingsRow({
      id: 1, focus_duration_minutes: 25, short_break_minutes: 5,
      long_break_minutes: 15, default_mode: 'relax', sound_enabled: 2,
      haptics_enabled: 1, notifications_enabled: 1, analytics_enabled: 1,
      created_at: timestamp, updated_at: timestamp,
    }), 'sound_enabled'],
    ['profile negative balance', () => mapProfileRow({
      id: 1, total_xp: 0, coin_balance: -1,
      created_at: timestamp, updated_at: timestamp,
    }), 'coin_balance'],
    ['catalog enum', () => mapCatalogItemRow({
      id: 'item', display_name: 'Item', category: 'hat', price_coins: 1,
      catalog_version: 1, created_at: timestamp, updated_at: timestamp,
    }), 'category'],
  ])('rejects corrupt %s instead of coercing it', (_name, map, field) => {
    expect(map()).toEqual({ ok: false, field });
  });

  it('maps valid running and completed session shapes exactly', () => {
    expect(mapSessionRow(runningSessionRow())).toMatchObject({
      ok: true,
      value: { id: 'session-1', status: 'running', backgroundedAt: null },
    });

    const completed = {
      ...runningSessionRow(),
      status: 'completed',
      resolved_at: timestamp + 25 * 60_000,
      xp_earned: 25,
      coins_earned: 5,
      reward_claimed_at: timestamp + 25 * 60_000,
      updated_at: timestamp + 25 * 60_000,
    };
    expect(mapSessionRow(completed)).toMatchObject({
      ok: true,
      value: { status: 'completed', xpEarned: 25, coinsEarned: 5 },
    });
  });

  it('rejects unknown session enum and inconsistent relationship/terminal shapes', () => {
    expect(mapSessionRow({ ...runningSessionRow(), status: 'paused' })).toEqual({
      ok: false,
      field: 'status',
    });
    expect(mapSessionRow({ ...runningSessionRow(), profile_id: 2 })).toEqual({
      ok: false,
      field: 'profile_id',
    });
    expect(mapSessionRow({ ...runningSessionRow(), xp_earned: 25 })).toEqual({
      ok: false,
      field: 'conditional_resolution_shape',
    });
  });

  it('maps immutable economy receipts and ownership records', () => {
    expect(mapRewardReceiptRow({
      id: 'reward-1', session_id: 'session-1', profile_id: 1,
      xp_delta: 25, coin_delta: 5, reason: 'focus_completed', created_at: timestamp,
    })).toMatchObject({ ok: true, value: { sessionId: 'session-1', xpDelta: 25 } });
    expect(mapPurchaseReceiptRow({
      id: 'purchase-1', profile_id: 1, item_id: 'desk-lamp',
      price_paid_coins: 10, coin_delta: -10, reason: 'item_purchase', created_at: timestamp,
    })).toMatchObject({ ok: true, value: { itemId: 'desk-lamp', coinDelta: -10 } });
    expect(mapOwnedItemRow({
      profile_id: 1, item_id: 'desk-lamp', purchase_transaction_id: 'purchase-1',
      unlocked_at: timestamp, is_equipped: 1, equipped_at: timestamp, updated_at: timestamp,
    })).toMatchObject({ ok: true, value: { isEquipped: true, equippedAt: timestamp } });
  });

  it('rejects corrupt receipt and equipped shapes', () => {
    expect(mapPurchaseReceiptRow({
      id: 'purchase-1', profile_id: 1, item_id: 'desk-lamp',
      price_paid_coins: 10, coin_delta: -9, reason: 'item_purchase', created_at: timestamp,
    })).toEqual({ ok: false, field: 'coin_delta' });
    expect(mapOwnedItemRow({
      profile_id: 1, item_id: 'desk-lamp', purchase_transaction_id: 'purchase-1',
      unlocked_at: timestamp, is_equipped: 0, equipped_at: timestamp, updated_at: timestamp,
    })).toEqual({ ok: false, field: 'equipped_shape' });
  });

  it('maps review and analytics metadata with bounded properties', () => {
    expect(mapStoreReviewAttemptRow({
      id: 'review-1', app_version: '0.1.0', attempted_at: timestamp, created_at: timestamp,
    })).toMatchObject({ ok: true, value: { appVersion: '0.1.0' } });
    expect(mapAnalyticsEventRow({
      event_id: 'event-1', event_name: 'focus_started',
      properties_json: '{"mode":"strict","duration":25}', occurred_at: timestamp,
      expires_at: timestamp + 604_800_000, delivery_state: 'pending', attempt_count: 0,
      next_attempt_at: null, created_at: timestamp,
    })).toMatchObject({
      ok: true,
      value: { properties: { mode: 'strict', duration: 25 }, nextAttemptAt: null },
    });
  });

  it('rejects invalid JSON, nested values, excessive property count and payload bytes', () => {
    const base = {
      event_id: 'event-1', event_name: 'focus_started', occurred_at: timestamp,
      expires_at: timestamp + 604_800_000, delivery_state: 'pending', attempt_count: 0,
      next_attempt_at: null, created_at: timestamp,
    };
    expect(mapAnalyticsEventRow({ ...base, properties_json: '{bad' })).toEqual({
      ok: false,
      field: 'properties_json',
    });
    expect(serializeAnalyticsProperties({ nested: { bad: true } } as never)).toEqual({
      ok: false,
      field: 'properties',
    });
    expect(serializeAnalyticsProperties(Object.fromEntries(
      Array.from({ length: 21 }, (_, index) => [`p${index}`, index]),
    ))).toEqual({ ok: false, field: 'properties' });
    expect(serializeAnalyticsProperties({ text: 'x'.repeat(2_100) })).toEqual({
      ok: false,
      field: 'properties',
    });
  });
});
