import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { AnalyticsEventRecord } from '@/application';
import { MigrationRunner } from '@/infrastructure/database/migration-runner';
import { productionMigrationRegistry } from '@/infrastructure/database/migrations/migration-registry';
import { createSQLitePersistenceGraph } from '@/infrastructure/database/persistence-graph';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import type {
  SQLiteConnection,
  SQLiteDriver,
  SQLiteParameters,
} from '@/infrastructure/database/sqlite-driver';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';

const PROBE_DATABASE = 'pixeldoro-us-02-06-derived-queries-probe.db';
const BASE_TIMESTAMP = 1_787_836_800_000;
const DAY_MS = 86_400_000;
const TTL_MS = 604_800_000;
const REVIEW_NOW = BASE_TIMESTAMP + 400 * DAY_MS;

export interface DerivedQueriesProbeReport {
  readonly probe: 'US-02-06_DERIVED_QUERIES';
  readonly passed: boolean;
  readonly failedAssertion?: string;
  readonly platform: string;
  readonly osVersion: string;
  readonly appVersion: string;
  readonly applicationId: string;
  readonly commitSha: string;
  readonly sqliteVersion: string;
  readonly assertions: readonly string[];
}

const assertProbe = (
  condition: boolean,
  assertion: string,
  assertions: string[],
): void => {
  if (!condition) throw new Error(assertion);
  assertions.push(assertion);
};

const removeStaleDatabase = async (driver: SQLiteDriver): Promise<void> => {
  try {
    await driver.deleteDatabase(PROBE_DATABASE);
  } catch {
    // Missing isolated probe state is a valid starting point.
  }
};

const run = (
  connection: SQLiteConnection,
  sql: string,
  parameters: SQLiteParameters,
) => connection.runAsync(sql, parameters);

interface ProbeSession {
  readonly id: string;
  readonly sessionType: 'focus' | 'long_break';
  readonly focusVariant: 'standard' | 'onboarding_trial' | null;
  readonly mode: 'relax' | 'strict' | null;
  readonly status: 'running' | 'completed' | 'failed' | 'cancelled';
  readonly workTag: 'coding' | 'study' | null;
  readonly duration: number;
  readonly startedAt: number;
  readonly resolvedAt: number | null;
  readonly localDate: string;
  readonly offset: number;
}

const insertSession = (
  connection: SQLiteConnection,
  session: ProbeSession,
): Promise<unknown> => {
  const completedFocus = session.sessionType === 'focus' && session.status === 'completed';
  return run(
    connection,
    `INSERT INTO sessions (
      id, profile_id, session_type, focus_variant, mode, status, work_tag,
      configured_duration_minutes, started_at, ends_at, backgrounded_at, resolved_at,
      xp_earned, coins_earned, reward_claimed_at, scheduled_end_local_date,
      scheduled_end_utc_offset_minutes, created_at, updated_at
    ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [session.id, session.sessionType, session.focusVariant, session.mode, session.status,
      session.workTag, session.duration, session.startedAt,
      session.startedAt + session.duration * 60_000, session.resolvedAt,
      completedFocus ? session.duration : 0, completedFocus ? session.duration / 5 : 0,
      completedFocus ? session.resolvedAt : null, session.localDate, session.offset,
      session.startedAt, session.resolvedAt ?? session.startedAt],
  );
};

const eventRecord = (eventId: string, occurredAt: number): AnalyticsEventRecord => ({
  eventId,
  eventName: 'history_viewed',
  properties: {},
  occurredAt,
  expiresAt: occurredAt + TTL_MS,
  deliveryState: 'pending',
  attemptCount: 0,
  nextAttemptAt: null,
  createdAt: occurredAt,
});

const insertRawEvent = (
  connection: SQLiteConnection,
  event: AnalyticsEventRecord,
): Promise<unknown> => run(
  connection,
  `INSERT INTO analytics_events (
    event_id, event_name, properties_json, occurred_at, expires_at,
    delivery_state, attempt_count, next_attempt_at, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [event.eventId, event.eventName, JSON.stringify(event.properties), event.occurredAt,
    event.expiresAt, event.deliveryState, event.attemptCount,
    event.nextAttemptAt, event.createdAt],
);

const getCount = async (
  connection: SQLiteConnection,
  table: 'analytics_events' | 'sessions' | 'store_review_attempts',
): Promise<number> => {
  const row = await connection.getFirstAsync<{ readonly count: number }>(
    `SELECT COUNT(*) AS count FROM ${table}`,
    [],
  );
  if (row === null) throw new Error('probe_count_missing');
  return row.count;
};

const planUses = async (
  connection: SQLiteConnection,
  sql: string,
  parameters: SQLiteParameters,
  indexName: string,
): Promise<boolean> => {
  const rows = await connection.getAllAsync<{ readonly detail: string }>(
    `EXPLAIN QUERY PLAN ${sql}`,
    parameters,
  );
  return rows.some((row) => row.detail.includes(indexName));
};

export const runDerivedQueriesProbe = async (
  driver: SQLiteDriver,
): Promise<DerivedQueriesProbeReport> => {
  const assertions: string[] = [];
  let failedAssertion: string | undefined;
  let sqliteVersion = 'unavailable';
  const owner = new SQLiteDatabaseOwner(PROBE_DATABASE, driver);
  const transaction = new SQLiteTransaction(owner);

  try {
    await removeStaleDatabase(driver);
    const opened = await owner.open();
    if (!opened.ok) throw new Error('query_probe_database_open_failed');
    const migration = new MigrationRunner({
      owner,
      transaction,
      registry: productionMigrationRegistry,
      clock: { nowMs: () => BASE_TIMESTAMP },
      id: { nextId: () => 'derived-query-probe-anonymous-id' },
    });
    const migrated = await migration.migrate();
    assertProbe(
      migrated.ok && migrated.value.toVersion === 1,
      'query_probe_database_opened_and_migrated',
      assertions,
    );
    const graph = createSQLitePersistenceGraph(owner, transaction);
    const markerStartedAt = BASE_TIMESTAMP + 10 * 60 * 60_000;
    const markerResolvedAt = markerStartedAt + 15 * 60_000;

    await owner.withConnection(async (connection) => {
      const sessions: readonly ProbeSession[] = [
        { id: 'probe-standard-before', sessionType: 'focus', focusVariant: 'standard',
          mode: 'strict', status: 'completed', workTag: 'coding', duration: 25,
          startedAt: BASE_TIMESTAMP, resolvedAt: BASE_TIMESTAMP + 25 * 60_000,
          localDate: '2026-08-28', offset: 420 },
        { id: 'probe-failed', sessionType: 'focus', focusVariant: 'standard',
          mode: 'strict', status: 'failed', workTag: 'study', duration: 25,
          startedAt: BASE_TIMESTAMP + 2 * 60 * 60_000,
          resolvedAt: BASE_TIMESTAMP + 2 * 60 * 60_000 + 1,
          localDate: '2026-08-28', offset: 420 },
        { id: 'probe-cancelled', sessionType: 'focus', focusVariant: 'standard',
          mode: 'relax', status: 'cancelled', workTag: 'coding', duration: 25,
          startedAt: BASE_TIMESTAMP + 3 * 60 * 60_000,
          resolvedAt: BASE_TIMESTAMP + 3 * 60 * 60_000 + 1,
          localDate: '2026-08-28', offset: 420 },
        { id: 'probe-trial', sessionType: 'focus', focusVariant: 'onboarding_trial',
          mode: 'relax', status: 'completed', workTag: null, duration: 5,
          startedAt: BASE_TIMESTAMP + 4 * 60 * 60_000,
          resolvedAt: BASE_TIMESTAMP + 4 * 60 * 60_000 + 5 * 60_000,
          localDate: '2026-08-28', offset: 420 },
        { id: 'probe-long-marker', sessionType: 'long_break', focusVariant: null,
          mode: null, status: 'completed', workTag: null, duration: 15,
          startedAt: markerStartedAt, resolvedAt: markerResolvedAt,
          localDate: '2026-08-28', offset: 420 },
        { id: 'probe-long-cancelled', sessionType: 'long_break', focusVariant: null,
          mode: null, status: 'cancelled', workTag: null, duration: 15,
          startedAt: markerResolvedAt + 1, resolvedAt: markerResolvedAt + 2,
          localDate: '2026-08-28', offset: 420 },
        { id: 'probe-standard-after', sessionType: 'focus', focusVariant: 'standard',
          mode: 'relax', status: 'completed', workTag: 'study', duration: 50,
          startedAt: markerResolvedAt + 60_000,
          resolvedAt: markerResolvedAt + 51 * 60_000,
          localDate: '2026-08-29', offset: -300 },
        { id: 'probe-running', sessionType: 'focus', focusVariant: 'standard',
          mode: 'relax', status: 'running', workTag: 'coding', duration: 25,
          startedAt: markerResolvedAt + 3 * 60 * 60_000, resolvedAt: null,
          localDate: '2026-08-29', offset: -300 },
      ];
      for (const session of sessions) await insertSession(connection, session);
      await run(
        connection,
        `INSERT INTO store_review_attempts (id, app_version, attempted_at, created_at)
          VALUES (?, ?, ?, ?)`,
        ['probe-review', '0.1.0', REVIEW_NOW - 100 * DAY_MS, REVIEW_NOW - 100 * DAY_MS],
      );
      const version = await connection.getFirstAsync<{ readonly version: string }>(
        'SELECT sqlite_version() AS version', [],
      );
      sqliteVersion = version?.version ?? 'unavailable';
    });

    const history = await graph.standardFocusHistory.list({ profileId: 1, limit: 100, cursor: null });
    assertProbe(
      history.ok && history.value.entries.map(({ id }) => id).join(',') ===
        'probe-standard-after,probe-cancelled,probe-failed,probe-standard-before',
      'mixed_standard_history_excluded_trial_running_and_breaks',
      assertions,
    );
    const contribution = await graph.contribution.listRange({
      profileId: 1, startLocalDate: '2026-08-28', endLocalDate: '2026-08-29',
    });
    assertProbe(
      contribution.ok && contribution.value.length === 2 &&
        contribution.value[0]?.totalCompletedMinutes === 25 &&
        contribution.value[1]?.totalCompletedMinutes === 50,
      'contribution_grouped_by_persisted_local_date',
      assertions,
    );

    await owner.close();
    const reopened = await owner.open();
    if (!reopened.ok) throw new Error('timezone_probe_reopen_failed');
    const reopenedGraph = createSQLitePersistenceGraph(owner, transaction);
    const persistedDay = await reopenedGraph.contribution.listRange({
      profileId: 1, startLocalDate: '2026-08-29', endLocalDate: '2026-08-29',
    });
    assertProbe(
      persistedDay.ok && persistedDay.value[0]?.totalCompletedMinutes === 50,
      'timezone_change_did_not_regroup_contribution',
      assertions,
    );
    const cadence = await reopenedGraph.longBreakCadence.getFacts(1);
    assertProbe(
      cadence.ok &&
        cadence.value.latestCompletedLongBreak?.sessionId === 'probe-long-marker' &&
        cadence.value.completedStandardFocusCountSinceLastCompletedLongBreak === 1,
      'cadence_used_completed_long_break_reset_only',
      assertions,
    );
    const review = await reopenedGraph.storeReviewFacts.getFacts({
      profileId: 1, appVersion: '0.1.0', nowMs: REVIEW_NOW,
    });
    assertProbe(
      review.ok && review.value.completedStandardFocusCount === 2 &&
        review.value.distinctStandardFocusActiveDayCount === 2 &&
        review.value.rolling365DayAttemptCount === 1 &&
        review.value.currentVersionAttempted,
      'store_review_facts_excluded_trial_status_and_feedback',
      assertions,
    );

    const economyBefore = await reopenedGraph.economyConsistency.verify(1);
    await owner.withConnection((connection) => run(
      connection, 'UPDATE pet_profiles SET total_xp = 1 WHERE id = 1', [],
    ).then(() => undefined));
    const mismatchFingerprintBefore = await owner.withConnection((connection) =>
      connection.getFirstAsync<{ readonly total_xp: number; readonly coin_balance: number }>(
        'SELECT total_xp, coin_balance FROM pet_profiles WHERE id = 1', [],
      ));
    const mismatch = await reopenedGraph.economyConsistency.verify(1);
    const mismatchFingerprintAfter = await owner.withConnection((connection) =>
      connection.getFirstAsync<{ readonly total_xp: number; readonly coin_balance: number }>(
        'SELECT total_xp, coin_balance FROM pet_profiles WHERE id = 1', [],
      ));
    assertProbe(
      economyBefore.ok && !mismatch.ok &&
        mismatch.error.code === 'PERSISTENCE_INVARIANT_MISMATCH' &&
        JSON.stringify(mismatchFingerprintBefore) === JSON.stringify(mismatchFingerprintAfter),
      'economy_consistency_passed_and_mismatch_preserved_rows',
      assertions,
    );

    await owner.withConnection(async (connection) => {
      for (let index = 0; index < 1_000; index += 1) {
        await insertRawEvent(
          connection,
          eventRecord(`probe-queue-${index.toString().padStart(4, '0')}`,
            REVIEW_NOW - DAY_MS + index),
        );
      }
    });
    const queued = await reopenedGraph.analyticsQueue.enqueueBounded(
      eventRecord('probe-queue-new', REVIEW_NOW), REVIEW_NOW,
    );
    const duplicate = await reopenedGraph.analyticsQueue.enqueueBounded(
      eventRecord('probe-queue-new', REVIEW_NOW), REVIEW_NOW,
    );
    const oldest = await reopenedGraph.analyticsEvents.findById('probe-queue-0000');
    await reopenedGraph.analyticsQueue.clear();
    await owner.withConnection((connection) => insertRawEvent(
      connection,
      eventRecord('probe-expired-exact', REVIEW_NOW - TTL_MS),
    ).then(() => undefined));
    await reopenedGraph.analyticsQueue.enqueueBounded(
      eventRecord('probe-pending', REVIEW_NOW), REVIEW_NOW,
    );
    const expired = await reopenedGraph.analyticsEvents.findById('probe-expired-exact');
    await reopenedGraph.analyticsQueue.enqueueBounded(
      eventRecord('probe-retry', REVIEW_NOW - 1), REVIEW_NOW,
    );
    await reopenedGraph.analyticsQueue.markRetry({
      eventId: 'probe-retry', deliveryState: 'retry_wait', attemptCount: 1,
      nextAttemptAt: REVIEW_NOW,
    });
    const due = await reopenedGraph.analyticsQueue.listDue(REVIEW_NOW, 10);
    const forbidden = {
      ...eventRecord('probe-forbidden', REVIEW_NOW),
      properties: { comment: 'private task' },
    } as unknown as AnalyticsEventRecord;
    const rejected = await reopenedGraph.analyticsQueue.enqueueBounded(forbidden, REVIEW_NOW);
    const queueCount = await owner.withConnection((connection) =>
      getCount(connection, 'analytics_events'));
    assertProbe(
      queued.ok && duplicate.ok && duplicate.value === 'already_queued' &&
        oldest.ok && oldest.value === null && expired.ok && expired.value === null && due.ok &&
        due.value.map(({ eventId }) => eventId).join(',') === 'probe-pending,probe-retry' &&
        !rejected.ok && queueCount === 2,
      'analytics_queue_enforced_ttl_cap_dedupe_retry_and_privacy',
      assertions,
    );

    const retained = await owner.withConnection(async (connection) => ({
      sessions: await getCount(connection, 'sessions'),
      reviews: await getCount(connection, 'store_review_attempts'),
    }));
    assertProbe(
      retained.sessions === 8 && retained.reviews === 1,
      'product_retention_rows_survived_queue_maintenance',
      assertions,
    );

    const plansPassed = await owner.withConnection(async (connection) => {
      const checks = await Promise.all([
        planUses(connection,
          `SELECT id FROM sessions WHERE profile_id = ? AND session_type = 'focus'
            AND focus_variant = 'standard' AND status = 'completed'
            ORDER BY ends_at DESC`, [1], 'ix_sessions_history'),
        planUses(connection,
          `SELECT scheduled_end_local_date FROM sessions WHERE profile_id = ?
            AND scheduled_end_local_date BETWEEN ? AND ? AND session_type = 'focus'
            AND focus_variant = 'standard' AND status = 'completed'`,
          [1, '2026-08-28', '2026-08-29'], 'ix_sessions_local_day'),
        planUses(connection,
          `SELECT id FROM sessions WHERE profile_id = ? AND session_type = 'long_break'
            AND status = 'completed' ORDER BY resolved_at DESC LIMIT 1`,
          [1], 'ix_sessions_long_break_cadence'),
        planUses(connection,
          'SELECT id FROM store_review_attempts WHERE attempted_at BETWEEN ? AND ?',
          [REVIEW_NOW - 365 * DAY_MS, REVIEW_NOW], 'ix_store_review_attempt_time'),
        planUses(connection,
          `SELECT event_id FROM analytics_events WHERE delivery_state = 'retry_wait'
            AND next_attempt_at <= ?`, [REVIEW_NOW], 'ix_analytics_delivery'),
        planUses(connection,
          'SELECT event_id FROM analytics_events WHERE expires_at <= ?',
          [REVIEW_NOW], 'ix_analytics_expiry'),
      ]);
      return checks.every(Boolean);
    });
    assertProbe(
      plansPassed && sqliteVersion !== 'unavailable',
      'critical_query_plans_used_or_documented_approved_indexes',
      assertions,
    );
  } catch (error) {
    failedAssertion = error instanceof Error ? error.message : 'unknown_derived_query_probe_failure';
  } finally {
    const closed = await owner.close();
    if (!closed.ok) {
      failedAssertion ??= 'query_probe_database_not_closed';
    } else {
      try {
        await driver.deleteDatabase(PROBE_DATABASE);
        if (failedAssertion === undefined) {
          assertions.push('probe_connections_closed_and_database_cleaned');
        }
      } catch {
        failedAssertion ??= 'query_probe_database_cleanup_failed';
      }
    }
  }

  return {
    probe: 'US-02-06_DERIVED_QUERIES',
    passed: failedAssertion === undefined,
    ...(failedAssertion === undefined ? {} : { failedAssertion }),
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    applicationId:
      (Platform.OS === 'ios'
        ? Constants.expoConfig?.ios?.bundleIdentifier
        : Constants.expoConfig?.android?.package) ?? 'unknown',
    commitSha: process.env.EXPO_PUBLIC_COMMIT_SHA ?? 'not-provided',
    sqliteVersion,
    assertions,
  };
};
