import { validateStandardFocusConfiguration, type FocusMode, type WorkTag } from '@pixeldoro/domain';

import type { SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';

export interface StandardFocusCancelledResult {
  readonly status: 'cancelled';
  readonly sessionId: string;
  readonly durationMinutes: number;
  readonly mode: FocusMode;
  readonly workTag: WorkTag;
  readonly startedAt: number;
  readonly endsAt: number;
  readonly resolvedAt: number;
  readonly xpEarned: 0;
  readonly coinsEarned: 0;
}

export interface StandardFocusFailedResult {
  readonly status: 'failed';
  readonly sessionId: string;
  readonly durationMinutes: number;
  readonly mode: 'strict';
  readonly workTag: WorkTag;
  readonly startedAt: number;
  readonly endsAt: number;
  readonly backgroundedAt: number;
  readonly resolvedAt: number;
  readonly xpEarned: 0;
  readonly coinsEarned: 0;
}

export type StandardFocusTerminalResult =
  | StandardFocusCancelledResult
  | StandardFocusFailedResult;

export type LoadStandardFocusCancelledResultOutcome =
  | { readonly outcome: 'ready'; readonly result: StandardFocusTerminalResult }
  | { readonly outcome: 'missing' };

export interface LoadStandardFocusCancelledResultError {
  readonly kind: 'load_standard_focus_cancelled_result_error';
  readonly code:
    | 'STANDARD_FOCUS_RESULT_READ_FAILED'
    | 'STANDARD_FOCUS_RESULT_INCONSISTENT';
}

export interface LoadStandardFocusCancelledResultDependencies {
  readonly sessions: Pick<SessionRepository, 'findById'>;
}

const failure = (
  code: LoadStandardFocusCancelledResultError['code'],
): ApplicationResult<never, LoadStandardFocusCancelledResultError> => ({
  ok: false,
  error: { kind: 'load_standard_focus_cancelled_result_error', code },
});

const isSafeTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0;

export class LoadStandardFocusCancelledResultUseCase {
  constructor(private readonly dependencies: LoadStandardFocusCancelledResultDependencies) {}

  async execute(
    sessionId: string,
  ): Promise<
    ApplicationResult<
      LoadStandardFocusCancelledResultOutcome,
      LoadStandardFocusCancelledResultError
    >
  > {
    try {
      const found = await this.dependencies.sessions.findById(sessionId);
      if (!found.ok) return failure('STANDARD_FOCUS_RESULT_READ_FAILED');
      if (found.value === null) return { ok: true, value: { outcome: 'missing' } };
      const row = found.value;
      if (
        row.sessionType !== 'focus' ||
        row.focusVariant !== 'standard' ||
        row.mode === null ||
        row.workTag === null ||
        (row.status !== 'cancelled' && row.status !== 'failed') ||
        row.resolvedAt === null ||
        !isSafeTimestamp(row.startedAt) ||
        !isSafeTimestamp(row.endsAt) ||
        !isSafeTimestamp(row.resolvedAt) ||
        row.resolvedAt < row.startedAt ||
        row.updatedAt !== row.resolvedAt ||
        row.xpEarned !== 0 ||
        row.coinsEarned !== 0 ||
        row.rewardClaimedAt !== null ||
        !validateStandardFocusConfiguration({
          durationMinutes: row.configuredDurationMinutes,
          mode: row.mode,
          workTag: row.workTag,
        }).ok
      ) return failure('STANDARD_FOCUS_RESULT_INCONSISTENT');

      if (
        row.status === 'cancelled' &&
        (row.resolvedAt >= row.endsAt || row.backgroundedAt !== null)
      ) return failure('STANDARD_FOCUS_RESULT_INCONSISTENT');
      if (row.status === 'failed') {
        if (
          row.mode !== 'strict' ||
          row.backgroundedAt === null ||
          row.backgroundedAt < row.startedAt ||
          !isSafeTimestamp(row.backgroundedAt) ||
          !Number.isSafeInteger(row.backgroundedAt + 10_000) ||
          row.backgroundedAt + 10_000 > row.endsAt ||
          row.resolvedAt < row.backgroundedAt + 10_000
        ) return failure('STANDARD_FOCUS_RESULT_INCONSISTENT');
      }

      const common = {
        sessionId: row.id,
        durationMinutes: row.configuredDurationMinutes,
        workTag: row.workTag,
        startedAt: row.startedAt,
        endsAt: row.endsAt,
        resolvedAt: row.resolvedAt,
        xpEarned: 0 as const,
        coinsEarned: 0 as const,
      };
      const result: StandardFocusTerminalResult = row.status === 'failed'
        ? Object.freeze({
            ...common,
            status: 'failed',
            mode: 'strict',
            backgroundedAt: row.backgroundedAt!,
          })
        : Object.freeze({ ...common, status: 'cancelled', mode: row.mode });
      return { ok: true, value: { outcome: 'ready', result } };
    } catch {
      return failure('STANDARD_FOCUS_RESULT_READ_FAILED');
    }
  }
}
