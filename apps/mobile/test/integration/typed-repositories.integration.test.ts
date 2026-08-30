import { describe, expect, it } from 'vitest';

import type { ApplicationResult, RunningSessionRecord } from '@pixeldoro/application';
import { createSQLitePersistenceGraph, PERSISTENCE_ENTITY_OWNERS } from '@/infrastructure/database/persistence-graph';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';
import { FakeSQLiteDriver } from '../fakes/fake-sqlite-driver';

const timestamp = 1_700_000_000_000;

const runningSession: RunningSessionRecord = {
  id: 'session-1',
  profileId: 1,
  sessionType: 'focus',
  focusVariant: 'standard',
  mode: 'strict',
  status: 'running',
  workTag: 'coding',
  configuredDurationMinutes: 25,
  startedAt: timestamp,
  endsAt: timestamp + 25 * 60_000,
  backgroundedAt: null,
  resolvedAt: null,
  xpEarned: 0,
  coinsEarned: 0,
  rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-08-28',
  scheduledEndUtcOffsetMinutes: 420,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const rowForSql = (sql: string): unknown => {
  if (sql.includes('FROM app_installation')) return {
    id: 1, installed_at: timestamp, onboarding_completed_at: null,
    anonymous_analytics_id: 'anonymous-1', created_at: timestamp, updated_at: timestamp,
  };
  if (sql.includes('FROM app_settings')) return {
    id: 1, focus_duration_minutes: 25, short_break_minutes: 5, long_break_minutes: 15,
    default_mode: 'relax', sound_enabled: 1, haptics_enabled: 1,
    notifications_enabled: 1, analytics_enabled: 1, created_at: timestamp, updated_at: timestamp,
  };
  if (sql.includes('FROM pet_profiles')) return {
    id: 1, total_xp: 25, coin_balance: 20, created_at: timestamp, updated_at: timestamp,
  };
  if (sql.includes('FROM sessions')) return {
    id: runningSession.id, profile_id: 1, session_type: runningSession.sessionType,
    focus_variant: runningSession.focusVariant, mode: runningSession.mode,
    status: runningSession.status, work_tag: runningSession.workTag,
    configured_duration_minutes: runningSession.configuredDurationMinutes,
    started_at: runningSession.startedAt, ends_at: runningSession.endsAt,
    backgrounded_at: null, resolved_at: null, xp_earned: 0, coins_earned: 0,
    reward_claimed_at: null, scheduled_end_local_date: runningSession.scheduledEndLocalDate,
    scheduled_end_utc_offset_minutes: 420, created_at: timestamp, updated_at: timestamp,
  };
  if (sql.includes('FROM reward_transactions')) return {
    id: 'reward-1', session_id: 'session-1', profile_id: 1, xp_delta: 25,
    coin_delta: 5, reason: 'focus_completed', created_at: timestamp,
  };
  if (sql.includes('FROM catalog_items')) return {
    id: 'desk-lamp', display_name: 'Desk Lamp', category: 'furniture',
    price_coins: 10, catalog_version: 1, created_at: timestamp, updated_at: timestamp,
  };
  if (sql.includes('FROM purchase_transactions')) return {
    id: 'purchase-1', profile_id: 1, item_id: 'desk-lamp', price_paid_coins: 10,
    coin_delta: -10, reason: 'item_purchase', created_at: timestamp,
  };
  if (sql.includes('FROM owned_items')) return {
    profile_id: 1, item_id: 'desk-lamp', purchase_transaction_id: 'purchase-1',
    unlocked_at: timestamp, is_equipped: 0, equipped_at: null, updated_at: timestamp,
  };
  if (sql.includes('FROM store_review_attempts')) return {
    id: 'review-1', app_version: '0.1.0', attempted_at: timestamp, created_at: timestamp,
  };
  if (sql.includes('FROM analytics_events')) return {
    event_id: 'event-1', event_name: 'focus_session_started', properties_json: '{"mode":"strict"}',
    occurred_at: timestamp, expires_at: timestamp + 604_800_000, delivery_state: 'pending',
    attempt_count: 0, next_attempt_at: null, created_at: timestamp,
  };
  return null;
};

const createHarness = async () => {
  const driver = new FakeSQLiteDriver();
  driver.connection.firstRowHandler = (sql) => rowForSql(sql);
  driver.connection.allRowsHandler = (sql) => {
    const row = rowForSql(sql);
    return row === null ? [] : [row];
  };
  const owner = new SQLiteDatabaseOwner('repositories.db', driver);
  expect(await owner.open()).toEqual({ ok: true, value: undefined });
  const transaction = new SQLiteTransaction(owner);
  return {
    driver,
    owner,
    transaction,
    graph: createSQLitePersistenceGraph(owner, transaction),
  };
};

describe('typed SQLite repositories', () => {
  it('owns and maps every normative product/metadata table without raw rows', async () => {
    const { graph, owner } = await createHarness();

    expect(PERSISTENCE_ENTITY_OWNERS).toHaveLength(10);
    expect(PERSISTENCE_ENTITY_OWNERS).not.toContain('schema_migrations');
    expect(await graph.installation.find()).toMatchObject({ ok: true, value: { installedAt: timestamp } });
    expect(await graph.settings.find()).toMatchObject({ ok: true, value: { focusDurationMinutes: 25 } });
    expect(await graph.profile.find()).toMatchObject({ ok: true, value: { totalXp: 25 } });
    expect(await graph.sessions.findById('session-1')).toMatchObject({ ok: true, value: { status: 'running' } });
    expect(await graph.rewards.findBySessionId('session-1')).toMatchObject({ ok: true, value: { xpDelta: 25 } });
    expect(await graph.catalog.list()).toMatchObject({ ok: true, value: [{ priceCoins: 10 }] });
    expect(await graph.purchases.findById('purchase-1')).toMatchObject({ ok: true, value: { coinDelta: -10 } });
    expect(await graph.ownedItems.listByProfile(1)).toMatchObject({ ok: true, value: [{ isEquipped: false }] });
    expect(await graph.storeReviewAttempts.list()).toMatchObject({ ok: true, value: [{ appVersion: '0.1.0' }] });
    expect(await graph.analyticsEvents.findById('event-1')).toMatchObject({ ok: true, value: { properties: { mode: 'strict' } } });

    const installation = await graph.installation.find();
    expect(installation.ok && installation.value !== null && 'installed_at' in installation.value).toBe(false);
    await owner.close();
  });

  it('uses one current transaction scope across repositories and rolls back returned failure', async () => {
    const { driver, graph, owner, transaction } = await createHarness();
    const result = await transaction.execute(async (scope): Promise<ApplicationResult<void, { code: 'INJECTED' }>> => {
      expect(await graph.sessions.insertRunningInTransaction(scope, runningSession)).toEqual({
        ok: true,
        value: undefined,
      });
      expect(await graph.profile.debitCatalogItemInTransaction(scope, {
        profileId: 1,
        itemId: 'desk-lamp',
        updatedAt: timestamp + 1,
      })).toEqual({ ok: true, value: 'updated' });
      expect(await graph.catalog.findByIdInTransaction(scope, 'desk-lamp')).toMatchObject({
        ok: true,
        value: { priceCoins: 10 },
      });
      return { ok: false, error: { code: 'INJECTED' } };
    });

    expect(result).toEqual({ ok: false, error: { code: 'INJECTED' } });
    expect(driver.connection.controlStatements).toEqual([
      'PRAGMA foreign_keys = ON',
      'BEGIN IMMEDIATE',
      'ROLLBACK',
    ]);
    const debit = driver.connection.boundStatements.find(({ sql }) =>
      sql.includes('coin_balance = coin_balance -'));
    expect(debit?.parameters).toEqual([
      'desk-lamp', timestamp + 1, 1, 'desk-lamp', 'desk-lamp',
    ]);
    await owner.close();
  });

  it('rejects an inactive scope instead of silently running unscoped', async () => {
    const { graph, owner } = await createHarness();
    expect(await graph.profile.findInTransaction({ transactionId: Symbol('foreign') })).toEqual({
      ok: false,
      error: {
        kind: 'persistence_error',
        code: 'PERSISTENCE_UNAVAILABLE',
        entity: 'pet_profiles',
        field: null,
      },
    });
    await owner.close();
  });

  it('maps committed corrupt rows and provider conflicts to stable sanitized errors', async () => {
    const { driver, graph, owner, transaction } = await createHarness();
    driver.connection.firstRowHandler = (sql) => sql.includes('FROM app_settings')
      ? { ...rowForSql(sql) as object, sound_enabled: 2 }
      : rowForSql(sql);
    expect(await graph.settings.find()).toMatchObject({
      ok: false,
      error: {
        code: 'PERSISTENCE_CORRUPT_DATA',
        entity: 'app_settings',
        field: 'sound_enabled',
      },
    });

    driver.connection.runHandler = (sql) => {
      if (sql.includes('INSERT INTO reward_transactions')) {
        throw new Error('UNIQUE constraint failed');
      }
      return { lastInsertRowId: 1, changes: 1 };
    };
    const conflict = await transaction.execute((scope) =>
      graph.rewards.insertInTransaction(scope, {
        id: 'reward-1', sessionId: 'session-1', profileId: 1,
        xpDelta: 25, coinDelta: 5, reason: 'focus_completed', createdAt: timestamp,
      }));
    expect(conflict).toMatchObject({
      ok: false,
      error: { code: 'PERSISTENCE_CONFLICT', entity: 'reward_transactions' },
    });
    expect(JSON.stringify(conflict)).not.toContain('UNIQUE constraint failed');
    await owner.close();
  });

  it('keeps immutable receipts/catalog free of arbitrary mutation APIs', async () => {
    const { graph, owner } = await createHarness();
    expect('update' in graph.rewards).toBe(false);
    expect('delete' in graph.rewards).toBe(false);
    expect('update' in graph.purchases).toBe(false);
    expect('delete' in graph.purchases).toBe(false);
    expect('insert' in graph.catalog).toBe(false);
    expect('update' in graph.catalog).toBe(false);
    expect('delete' in graph.catalog).toBe(false);
    await owner.close();
  });
});
