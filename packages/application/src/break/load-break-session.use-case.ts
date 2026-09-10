import type { SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import { isCancelledBreak, isCompletedBreak, isRunningBreak } from './break-session-record';

interface BreakProjectionBase {
  readonly sessionId: string;
  readonly kind: 'short' | 'long';
  readonly durationMinutes: 5 | 15;
  readonly startedAt: number;
  readonly endsAt: number;
}

export type BreakSessionProjection =
  | (BreakProjectionBase & { readonly status: 'running' })
  | (BreakProjectionBase & {
      readonly status: 'completed';
      readonly resolvedAt: number;
    })
  | (BreakProjectionBase & {
      readonly status: 'cancelled';
      readonly resolvedAt: number;
    });

export interface LoadBreakSessionError {
  readonly kind: 'load_break_session_error';
  readonly code: 'BREAK_SESSION_INELIGIBLE' | 'BREAK_SESSION_READ_FAILED';
}

const failure = (code: LoadBreakSessionError['code']):
ApplicationResult<never, LoadBreakSessionError> => ({
  ok: false,
  error: { kind: 'load_break_session_error', code },
});

export class LoadBreakSessionUseCase {
  constructor(private readonly sessions: Pick<SessionRepository, 'findById'>) {}

  async execute(sessionId: string): Promise<
  ApplicationResult<BreakSessionProjection, LoadBreakSessionError>> {
    if (!sessionId.trim()) return failure('BREAK_SESSION_INELIGIBLE');
    try {
      const result = await this.sessions.findById(sessionId);
      if (!result.ok) return failure('BREAK_SESSION_READ_FAILED');
      const row = result.value;
      if (row === null || (!isRunningBreak(row) && !isCompletedBreak(row) &&
        !isCancelledBreak(row))) {
        return failure('BREAK_SESSION_INELIGIBLE');
      }
      const base = {
        sessionId: row.id,
        kind: row.sessionType === 'long_break' ? 'long' as const : 'short' as const,
        durationMinutes: row.sessionType === 'long_break' ? 15 as const : 5 as const,
        startedAt: row.startedAt,
        endsAt: row.endsAt,
      };
      if (row.status === 'running') return { ok: true, value:
        Object.freeze({ ...base, status: 'running' as const }) };
      return { ok: true, value: isCompletedBreak(row)
        ? Object.freeze({ ...base, status: 'completed' as const, resolvedAt: row.resolvedAt! })
        : Object.freeze({ ...base, status: 'cancelled' as const, resolvedAt: row.resolvedAt! }) };
    } catch {
      return failure('BREAK_SESSION_READ_FAILED');
    }
  }
}
