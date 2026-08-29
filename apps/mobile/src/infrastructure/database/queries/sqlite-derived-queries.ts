import {
  persistenceError,
  type ApplicationResult,
  type ContributionDayFact,
  type ContributionQuery,
  type EconomyConsistencyQuery,
  type EconomyConsistencySnapshot,
  type LongBreakCadenceFacts,
  type LongBreakCadenceQuery,
  type PersistenceError,
  type StandardFocusHistoryEntry,
  type StandardFocusHistoryPage,
  type StandardFocusHistoryQuery,
  type TransactionTechnicalError,
} from '@pixeldoro/application';
import type {
  StoreReviewFacts,
  StoreReviewFactsQuery,
} from '@/application';

import { mapSessionRow, type SessionRow } from '../mappers/session-row.mapper';
import {
  corrupt,
  isNonEmptyString,
  isNonNegativeSafeInteger,
  isSafeTimestamp,
  mapped,
  type RowMapping,
} from '../mappers/row-mapping';
import type { SQLiteDatabaseOwner } from '../sqlite-database-owner';
import type { SQLiteExecutor } from '../sqlite-executor';
import type { SQLiteTransaction } from '../sqlite-transaction';
import {
  readMappedAll,
  readMappedOne,
  readWithOwner,
  withTransactionExecutor,
} from '../repositories/sqlite-repository-support';

const SESSION_SELECT = `SELECT id, profile_id, session_type, focus_variant, mode, status,
  work_tag, configured_duration_minutes, started_at, ends_at, backgrounded_at, resolved_at,
  xp_earned, coins_earned, reward_claimed_at, scheduled_end_local_date,
  scheduled_end_utc_offset_minutes, created_at, updated_at FROM sessions`;
const ROLLING_365_DAYS_MS = 31_536_000_000;

interface ContributionRow {
  readonly scheduled_end_local_date: unknown;
  readonly total_completed_minutes: unknown;
  readonly completed_session_count: unknown;
}

interface CadenceRow {
  readonly latest_long_break_id: unknown;
  readonly latest_long_break_resolved_at: unknown;
  readonly completed_standard_focus_count: unknown;
}

interface StoreReviewFactsRow {
  readonly installed_at: unknown;
  readonly completed_standard_focus_count: unknown;
  readonly distinct_active_day_count: unknown;
  readonly latest_attempt_id: unknown;
  readonly latest_attempt_app_version: unknown;
  readonly latest_attempted_at: unknown;
  readonly rolling_attempt_count: unknown;
  readonly current_version_attempted: unknown;
}

interface EconomyAggregateRow {
  readonly profile_id: unknown;
  readonly total_xp: unknown;
  readonly coin_balance: unknown;
  readonly reward_xp_total: unknown;
  readonly reward_coin_total: unknown;
  readonly purchase_coin_total: unknown;
}

interface EconomyAggregate {
  readonly profileId: number;
  readonly totalXp: number;
  readonly coinBalance: number;
  readonly rewardXpTotal: number;
  readonly rewardCoinTotal: number;
  readonly purchaseCoinTotal: number;
}

const isLeapYear = (year: number): boolean =>
  year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const isCanonicalLocalDate = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] ?? 0);
};

const invalidQuery = (entity: string, field: string): Promise<{
  readonly ok: false;
  readonly error: PersistenceError;
}> => Promise.resolve({
  ok: false,
  error: persistenceError('PERSISTENCE_QUERY_FAILED', entity, field),
});

const mapHistoryEntry = (row: SessionRow): RowMapping<StandardFocusHistoryEntry> => {
  const result = mapSessionRow(row);
  if (!result.ok) return result;
  const session = result.value;
  if (
    session.sessionType !== 'focus' ||
    session.focusVariant !== 'standard' ||
    session.status === 'running' ||
    session.mode === null ||
    session.workTag === null ||
    session.resolvedAt === null
  ) return corrupt('history_identity');
  return mapped({
    id: session.id,
    status: session.status,
    mode: session.mode,
    workTag: session.workTag,
    configuredDurationMinutes: session.configuredDurationMinutes,
    startedAt: session.startedAt,
    endsAt: session.endsAt,
    resolvedAt: session.resolvedAt,
    scheduledEndLocalDate: session.scheduledEndLocalDate,
    scheduledEndUtcOffsetMinutes: session.scheduledEndUtcOffsetMinutes,
  });
};

const mapContributionRow = (row: ContributionRow): RowMapping<ContributionDayFact> => {
  if (!isCanonicalLocalDate(row.scheduled_end_local_date)) {
    return corrupt('scheduled_end_local_date');
  }
  if (
    !isNonNegativeSafeInteger(row.total_completed_minutes) ||
    row.total_completed_minutes === 0
  ) return corrupt('total_completed_minutes');
  if (
    !isNonNegativeSafeInteger(row.completed_session_count) ||
    row.completed_session_count === 0
  ) return corrupt('completed_session_count');
  return mapped({
    scheduledEndLocalDate: row.scheduled_end_local_date,
    totalCompletedMinutes: row.total_completed_minutes,
    completedSessionCount: row.completed_session_count,
  });
};

const mapCadenceRow = (
  profileId: number,
  row: CadenceRow,
): RowMapping<LongBreakCadenceFacts> => {
  const noMarker = row.latest_long_break_id === null &&
    row.latest_long_break_resolved_at === null;
  const hasMarker = isNonEmptyString(row.latest_long_break_id) &&
    isSafeTimestamp(row.latest_long_break_resolved_at);
  if (!noMarker && !hasMarker) return corrupt('latest_completed_long_break');
  if (!isNonNegativeSafeInteger(row.completed_standard_focus_count)) {
    return corrupt('completed_standard_focus_count');
  }
  return mapped({
    profileId,
    completedStandardFocusCountSinceLastCompletedLongBreak:
      row.completed_standard_focus_count,
    latestCompletedLongBreak: hasMarker
      ? {
          sessionId: row.latest_long_break_id,
          resolvedAt: row.latest_long_break_resolved_at,
        }
      : null,
  });
};

const mapStoreReviewFactsRow = (
  row: StoreReviewFactsRow,
): RowMapping<StoreReviewFacts> => {
  if (!isSafeTimestamp(row.installed_at)) return corrupt('installed_at');
  if (!isNonNegativeSafeInteger(row.completed_standard_focus_count)) {
    return corrupt('completed_standard_focus_count');
  }
  if (!isNonNegativeSafeInteger(row.distinct_active_day_count)) {
    return corrupt('distinct_active_day_count');
  }
  if (!isNonNegativeSafeInteger(row.rolling_attempt_count)) {
    return corrupt('rolling_attempt_count');
  }
  if (row.current_version_attempted !== 0 && row.current_version_attempted !== 1) {
    return corrupt('current_version_attempted');
  }
  const noLatest = row.latest_attempt_id === null &&
    row.latest_attempt_app_version === null && row.latest_attempted_at === null;
  const hasLatest = isNonEmptyString(row.latest_attempt_id) &&
    isNonEmptyString(row.latest_attempt_app_version) &&
    isSafeTimestamp(row.latest_attempted_at);
  if (!noLatest && !hasLatest) return corrupt('latest_attempt');
  return mapped({
    installedAt: row.installed_at,
    completedStandardFocusCount: row.completed_standard_focus_count,
    distinctStandardFocusActiveDayCount: row.distinct_active_day_count,
    latestAttempt: hasLatest
      ? {
          id: row.latest_attempt_id,
          appVersion: row.latest_attempt_app_version,
          attemptedAt: row.latest_attempted_at,
        }
      : null,
    rolling365DayAttemptCount: row.rolling_attempt_count,
    currentVersionAttempted: row.current_version_attempted === 1,
  });
};

const mapEconomyAggregateRow = (
  row: EconomyAggregateRow,
): RowMapping<EconomyAggregate> => {
  if (row.profile_id !== 1) return corrupt('profile_id');
  const values = [
    row.total_xp,
    row.coin_balance,
    row.reward_xp_total,
    row.reward_coin_total,
  ];
  if (!values.every(isNonNegativeSafeInteger)) return corrupt('economy_totals');
  if (
    typeof row.purchase_coin_total !== 'number' ||
    !Number.isSafeInteger(row.purchase_coin_total) ||
    row.purchase_coin_total > 0
  ) return corrupt('purchase_coin_total');
  return mapped({
    profileId: 1,
    totalXp: row.total_xp as number,
    coinBalance: row.coin_balance as number,
    rewardXpTotal: row.reward_xp_total as number,
    rewardCoinTotal: row.reward_coin_total as number,
    purchaseCoinTotal: row.purchase_coin_total,
  });
};

const mapTransactionResult = <TValue>(
  result: ApplicationResult<TValue, PersistenceError | TransactionTechnicalError>,
  entity: string,
): { readonly ok: true; readonly value: TValue } | {
  readonly ok: false;
  readonly error: PersistenceError;
} => {
  if (result.ok) return result;
  if (result.error.kind === 'persistence_error') {
    return { ok: false, error: result.error };
  }
  return {
    ok: false,
    error: persistenceError(
      result.error.code === 'DATABASE_NOT_OPEN'
        ? 'PERSISTENCE_UNAVAILABLE'
        : 'PERSISTENCE_QUERY_FAILED',
      entity,
    ),
  };
};

export class SQLiteStandardFocusHistoryQuery implements StandardFocusHistoryQuery {
  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  list(input: Parameters<StandardFocusHistoryQuery['list']>[0]): ReturnType<StandardFocusHistoryQuery['list']> {
    if (
      input.profileId !== 1 || !Number.isSafeInteger(input.limit) ||
      input.limit < 1 || input.limit > 100 ||
      (input.cursor !== null &&
        (!isSafeTimestamp(input.cursor.endsAt) || !isNonEmptyString(input.cursor.id)))
    ) return invalidQuery('sessions', 'history_input');

    return readWithOwner(this.owner, 'sessions', async (executor) => {
      const cursorSql = input.cursor === null
        ? ''
        : 'AND (ends_at < ? OR (ends_at = ? AND id > ?))';
      const parameters = input.cursor === null
        ? [input.profileId, input.limit + 1]
        : [input.profileId, input.cursor.endsAt, input.cursor.endsAt,
            input.cursor.id, input.limit + 1];
      const rows = await readMappedAll<SessionRow, StandardFocusHistoryEntry>(
        executor,
        'sessions',
        `${SESSION_SELECT} WHERE profile_id = ? AND session_type = 'focus'
          AND focus_variant = 'standard'
          AND status IN ('completed', 'failed', 'cancelled') ${cursorSql}
          ORDER BY ends_at DESC, id ASC LIMIT ?`,
        parameters,
        mapHistoryEntry,
      );
      if (!rows.ok) return rows;
      const entries = rows.value.slice(0, input.limit);
      const last = entries.at(-1);
      const page: StandardFocusHistoryPage = {
        entries: Object.freeze(entries),
        nextCursor: rows.value.length > input.limit && last !== undefined
          ? { endsAt: last.endsAt, id: last.id }
          : null,
      };
      return { ok: true, value: page };
    });
  }
}

export class SQLiteContributionQuery implements ContributionQuery {
  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  listRange(input: Parameters<ContributionQuery['listRange']>[0]): ReturnType<ContributionQuery['listRange']> {
    if (
      input.profileId !== 1 || !isCanonicalLocalDate(input.startLocalDate) ||
      !isCanonicalLocalDate(input.endLocalDate) ||
      input.startLocalDate > input.endLocalDate
    ) return invalidQuery('sessions', 'contribution_range');
    return readWithOwner(this.owner, 'sessions', (executor) =>
      readMappedAll<ContributionRow, ContributionDayFact>(
        executor,
        'sessions',
        `SELECT scheduled_end_local_date,
          SUM(configured_duration_minutes) AS total_completed_minutes,
          COUNT(*) AS completed_session_count
          FROM sessions
          WHERE profile_id = ? AND session_type = 'focus'
            AND focus_variant = 'standard' AND status = 'completed'
            AND scheduled_end_local_date BETWEEN ? AND ?
          GROUP BY scheduled_end_local_date
          ORDER BY scheduled_end_local_date ASC`,
        [input.profileId, input.startLocalDate, input.endLocalDate],
        mapContributionRow,
      ));
  }
}

export class SQLiteLongBreakCadenceQuery implements LongBreakCadenceQuery {
  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  getFacts(profileId: number): ReturnType<LongBreakCadenceQuery['getFacts']> {
    if (profileId !== 1) return invalidQuery('sessions', 'profile_id');
    return readWithOwner(this.owner, 'sessions', async (executor) => {
      const result = await readMappedOne<CadenceRow, LongBreakCadenceFacts>(
        executor,
        'sessions',
        `WITH latest_completed_long_break AS (
          SELECT id, resolved_at FROM sessions
          WHERE profile_id = ? AND session_type = 'long_break' AND status = 'completed'
          ORDER BY resolved_at DESC, id ASC LIMIT 1
        )
        SELECT
          (SELECT id FROM latest_completed_long_break) AS latest_long_break_id,
          (SELECT resolved_at FROM latest_completed_long_break) AS latest_long_break_resolved_at,
          (SELECT COUNT(*) FROM sessions
            WHERE profile_id = ? AND session_type = 'focus'
              AND focus_variant = 'standard' AND status = 'completed'
              AND (
                NOT EXISTS (SELECT 1 FROM latest_completed_long_break)
                OR resolved_at > (SELECT resolved_at FROM latest_completed_long_break)
              )) AS completed_standard_focus_count`,
        [profileId, profileId],
        (row) => mapCadenceRow(profileId, row),
      );
      if (!result.ok) return result;
      return result.value === null
        ? { ok: false, error: persistenceError(
            'PERSISTENCE_CORRUPT_DATA', 'sessions', 'cadence') }
        : { ok: true, value: result.value };
    });
  }
}

export class SQLiteStoreReviewFactsQuery implements StoreReviewFactsQuery {
  constructor(private readonly owner: SQLiteDatabaseOwner) {}

  getFacts(input: Parameters<StoreReviewFactsQuery['getFacts']>[0]): ReturnType<StoreReviewFactsQuery['getFacts']> {
    if (
      input.profileId !== 1 || !isNonEmptyString(input.appVersion) ||
      !isSafeTimestamp(input.nowMs)
    ) return invalidQuery('store_review_attempts', 'facts_input');
    const windowStart = Math.max(0, input.nowMs - ROLLING_365_DAYS_MS);
    return readWithOwner(this.owner, 'store_review_attempts', async (executor) => {
      const result = await readMappedOne<StoreReviewFactsRow, StoreReviewFacts>(
        executor,
        'store_review_attempts',
        `SELECT
          (SELECT installed_at FROM app_installation WHERE id = 1) AS installed_at,
          (SELECT COUNT(*) FROM sessions WHERE profile_id = ?
            AND session_type = 'focus' AND focus_variant = 'standard'
            AND status = 'completed') AS completed_standard_focus_count,
          (SELECT COUNT(DISTINCT scheduled_end_local_date) FROM sessions WHERE profile_id = ?
            AND session_type = 'focus' AND focus_variant = 'standard'
            AND status = 'completed') AS distinct_active_day_count,
          (SELECT id FROM store_review_attempts
            ORDER BY attempted_at DESC, id ASC LIMIT 1) AS latest_attempt_id,
          (SELECT app_version FROM store_review_attempts
            ORDER BY attempted_at DESC, id ASC LIMIT 1) AS latest_attempt_app_version,
          (SELECT attempted_at FROM store_review_attempts
            ORDER BY attempted_at DESC, id ASC LIMIT 1) AS latest_attempted_at,
          (SELECT COUNT(*) FROM store_review_attempts
            WHERE attempted_at BETWEEN ? AND ?) AS rolling_attempt_count,
          EXISTS(SELECT 1 FROM store_review_attempts
            WHERE app_version = ?) AS current_version_attempted`,
        [input.profileId, input.profileId, windowStart, input.nowMs, input.appVersion],
        mapStoreReviewFactsRow,
      );
      if (!result.ok) return result;
      return result.value === null
        ? { ok: false, error: persistenceError(
            'PERSISTENCE_CORRUPT_DATA', 'store_review_attempts', 'facts') }
        : { ok: true, value: result.value };
    });
  }
}

export class SQLiteEconomyConsistencyQuery implements EconomyConsistencyQuery {
  constructor(private readonly transaction: SQLiteTransaction) {}

  async verify(profileId: number): ReturnType<EconomyConsistencyQuery['verify']> {
    if (profileId !== 1) return invalidQuery('pet_profiles', 'profile_id');
    const result = await this.transaction.execute<EconomyConsistencySnapshot, PersistenceError>(
      async (scope) => withTransactionExecutor(
        this.transaction,
        scope,
        'pet_profiles',
        async (executor: SQLiteExecutor) => {
          const aggregate = await readMappedOne<EconomyAggregateRow, EconomyAggregate>(
            executor,
            'pet_profiles',
            `SELECT p.id AS profile_id, p.total_xp, p.coin_balance,
              COALESCE((SELECT SUM(xp_delta) FROM reward_transactions
                WHERE profile_id = p.id), 0) AS reward_xp_total,
              COALESCE((SELECT SUM(coin_delta) FROM reward_transactions
                WHERE profile_id = p.id), 0) AS reward_coin_total,
              COALESCE((SELECT SUM(coin_delta) FROM purchase_transactions
                WHERE profile_id = p.id), 0) AS purchase_coin_total
              FROM pet_profiles p WHERE p.id = ?`,
            [profileId],
            mapEconomyAggregateRow,
          );
          if (!aggregate.ok) return aggregate;
          if (aggregate.value === null) {
            return {
              ok: false,
              error: persistenceError('PERSISTENCE_CORRUPT_DATA', 'pet_profiles', 'id'),
            };
          }
          const value = aggregate.value;
          const xpMatches = value.totalXp === value.rewardXpTotal;
          const coinMatches = value.coinBalance ===
            value.rewardCoinTotal + value.purchaseCoinTotal;
          if (!xpMatches || !coinMatches) {
            return {
              ok: false,
              error: persistenceError(
                'PERSISTENCE_INVARIANT_MISMATCH',
                'pet_profiles',
                xpMatches ? 'coin_balance' : coinMatches ? 'total_xp' : 'economy_totals',
              ),
            };
          }
          return {
            ok: true,
            value: {
              profileId: value.profileId,
              totalXp: value.totalXp,
              coinBalance: value.coinBalance,
            },
          };
        },
      ),
    );
    return mapTransactionResult(result, 'pet_profiles');
  }
}
