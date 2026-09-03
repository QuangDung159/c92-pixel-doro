import {
  persistenceError,
  type RunningSessionRecord,
  type SessionRepository,
  type TransactionScope,
} from '@pixeldoro/application';

import {
  mapSessionRow,
  type SessionRow,
} from '../mappers/session-row.mapper';
import {
  isNonEmptyString,
  isNonNegativeSafeInteger,
  isSafeTimestamp,
} from '../mappers/row-mapping';
import type { SQLiteDatabaseOwner } from '../sqlite-database-owner';
import type { SQLiteExecutor } from '../sqlite-executor';
import type { SQLiteTransaction } from '../sqlite-transaction';
import {
  mapWriteError,
  readMappedOne,
  readWithOwner,
  withTransactionExecutor,
} from './sqlite-repository-support';

const sessionSelect = `SELECT id, profile_id, session_type, focus_variant, mode, status,
  work_tag, configured_duration_minutes, started_at, ends_at, backgrounded_at, resolved_at,
  xp_earned, coins_earned, reward_claimed_at, scheduled_end_local_date,
  scheduled_end_utc_offset_minutes, created_at, updated_at FROM sessions`;

const runningRecordToRow = (record: RunningSessionRecord): SessionRow => ({
  id: record.id,
  profile_id: record.profileId,
  session_type: record.sessionType,
  focus_variant: record.focusVariant,
  mode: record.mode,
  status: record.status,
  work_tag: record.workTag,
  configured_duration_minutes: record.configuredDurationMinutes,
  started_at: record.startedAt,
  ends_at: record.endsAt,
  backgrounded_at: record.backgroundedAt,
  resolved_at: record.resolvedAt,
  xp_earned: record.xpEarned,
  coins_earned: record.coinsEarned,
  reward_claimed_at: record.rewardClaimedAt,
  scheduled_end_local_date: record.scheduledEndLocalDate,
  scheduled_end_utc_offset_minutes: record.scheduledEndUtcOffsetMinutes,
  created_at: record.createdAt,
  updated_at: record.updatedAt,
});

export class SQLiteSessionRepository implements SessionRepository {
  constructor(
    private readonly owner: SQLiteDatabaseOwner,
    private readonly transaction: SQLiteTransaction,
  ) {}

  findById(id: string): ReturnType<SessionRepository['findById']> {
    return readWithOwner(this.owner, 'sessions', (executor) => this.readById(executor, id));
  }

  findActive(): ReturnType<SessionRepository['findActive']> {
    return readWithOwner(this.owner, 'sessions', (executor) => this.readActive(executor));
  }

  findLatestOnboardingTrial(): ReturnType<SessionRepository['findLatestOnboardingTrial']> {
    return readWithOwner(this.owner, 'sessions', (executor) =>
      readMappedOne(
        executor,
        'sessions',
        `${sessionSelect} WHERE session_type = 'focus'
          AND focus_variant = 'onboarding_trial'
          ORDER BY started_at DESC, created_at DESC, id DESC LIMIT 1`,
        [],
        mapSessionRow,
      ));
  }

  findByIdInTransaction(
    scope: TransactionScope,
    id: string,
  ): ReturnType<SessionRepository['findByIdInTransaction']> {
    return withTransactionExecutor(this.transaction, scope, 'sessions', (executor) =>
      this.readById(executor, id));
  }

  findActiveInTransaction(scope: TransactionScope): ReturnType<SessionRepository['findActiveInTransaction']> {
    return withTransactionExecutor(this.transaction, scope, 'sessions', (executor) =>
      this.readActive(executor));
  }

  insertRunningInTransaction(
    scope: TransactionScope,
    record: RunningSessionRecord,
  ): ReturnType<SessionRepository['insertRunningInTransaction']> {
    const validation = mapSessionRow(runningRecordToRow(record));
    if (!validation.ok) return Promise.resolve({
      ok: false,
      error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions', validation.field),
    });
    return withTransactionExecutor(this.transaction, scope, 'sessions', async (executor) => {
      try {
        await executor.run(
          `INSERT INTO sessions (id, profile_id, session_type, focus_variant, mode, status,
            work_tag, configured_duration_minutes, started_at, ends_at, backgrounded_at,
            resolved_at, xp_earned, coins_earned, reward_claimed_at,
            scheduled_end_local_date, scheduled_end_utc_offset_minutes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [record.id, record.profileId, record.sessionType, record.focusVariant, record.mode,
            record.status, record.workTag, record.configuredDurationMinutes, record.startedAt,
            record.endsAt, record.backgroundedAt, record.resolvedAt, record.xpEarned,
            record.coinsEarned, record.rewardClaimedAt, record.scheduledEndLocalDate,
            record.scheduledEndUtcOffsetMinutes, record.createdAt, record.updatedAt],
        );
        return { ok: true, value: undefined };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'sessions') };
      }
    });
  }

  recordBackgroundedAtInTransaction(
    scope: TransactionScope,
    input: Parameters<SessionRepository['recordBackgroundedAtInTransaction']>[1],
  ): ReturnType<SessionRepository['recordBackgroundedAtInTransaction']> {
    if (!isNonEmptyString(input.sessionId) || !isSafeTimestamp(input.backgroundedAt) ||
      !isSafeTimestamp(input.updatedAt)) return Promise.resolve({
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions', 'input'),
      });
    return withTransactionExecutor(this.transaction, scope, 'sessions', async (executor) => {
      try {
        const result = await executor.run(
          `UPDATE sessions SET backgrounded_at = ?, updated_at = ?
            WHERE id = ? AND status = 'running' AND session_type = 'focus'
              AND focus_variant = 'standard' AND mode = 'strict' AND backgrounded_at IS NULL
              AND updated_at <= ?`,
          [input.backgroundedAt, input.updatedAt, input.sessionId, input.backgroundedAt],
        );
        return { ok: true, value: result.changes === 1 ? 'updated' : 'not_updated' };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'sessions') };
      }
    });
  }

  clearBackgroundedAtInTransaction(
    scope: TransactionScope,
    input: Parameters<SessionRepository['clearBackgroundedAtInTransaction']>[1],
  ): ReturnType<SessionRepository['clearBackgroundedAtInTransaction']> {
    if (!isNonEmptyString(input.sessionId) ||
      !isSafeTimestamp(input.expectedBackgroundedAt) ||
      !isSafeTimestamp(input.updatedAt)) return Promise.resolve({
        ok: false,
        error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions', 'input'),
      });
    return withTransactionExecutor(this.transaction, scope, 'sessions', async (executor) => {
      try {
        const result = await executor.run(
          `UPDATE sessions SET backgrounded_at = NULL, updated_at = ?
            WHERE id = ? AND status = 'running' AND session_type = 'focus'
              AND focus_variant = 'standard' AND mode = 'strict' AND backgrounded_at = ?`,
          [input.updatedAt, input.sessionId, input.expectedBackgroundedAt],
        );
        return { ok: true, value: result.changes === 1 ? 'updated' : 'not_updated' };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'sessions') };
      }
    });
  }

  transitionFromRunningInTransaction(
    scope: TransactionScope,
    input: Parameters<SessionRepository['transitionFromRunningInTransaction']>[1],
  ): ReturnType<SessionRepository['transitionFromRunningInTransaction']> {
    const valid = isNonEmptyString(input.sessionId) && isSafeTimestamp(input.resolvedAt) &&
      isNonNegativeSafeInteger(input.xpEarned) && isNonNegativeSafeInteger(input.coinsEarned) &&
      (input.rewardClaimedAt === null || isSafeTimestamp(input.rewardClaimedAt)) &&
      isSafeTimestamp(input.updatedAt);
    if (!valid) return Promise.resolve({
      ok: false,
      error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions', 'input'),
    });
    return withTransactionExecutor(this.transaction, scope, 'sessions', async (executor) => {
      try {
        const result = await executor.run(
          `UPDATE sessions SET status = ?, resolved_at = ?, xp_earned = ?, coins_earned = ?,
            reward_claimed_at = ?, updated_at = ? WHERE id = ? AND status = 'running'`,
          [input.status, input.resolvedAt, input.xpEarned, input.coinsEarned,
            input.rewardClaimedAt, input.updatedAt, input.sessionId],
        );
        return { ok: true, value: result.changes === 1 ? 'updated' : 'not_updated' };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'sessions') };
      }
    });
  }

  private readById(executor: SQLiteExecutor, id: string): ReturnType<SessionRepository['findById']> {
    if (!isNonEmptyString(id)) return Promise.resolve({
      ok: false,
      error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions', 'id'),
    });
    return readMappedOne(executor, 'sessions', `${sessionSelect} WHERE id = ?`, [id], mapSessionRow);
  }

  private readActive(executor: SQLiteExecutor): ReturnType<SessionRepository['findActive']> {
    return readMappedOne(
      executor,
      'sessions',
      `${sessionSelect} WHERE status = 'running' ORDER BY started_at DESC LIMIT 1`,
      [],
      mapSessionRow,
    );
  }
}
