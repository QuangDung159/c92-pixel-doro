import type { SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import { isRunningBreak } from './break-session-record';

export interface RunningBreakProjection {
  readonly sessionId: string;
  readonly kind: 'short' | 'long';
  readonly durationMinutes: 5 | 15;
  readonly startedAt: number;
  readonly endsAt: number;
}

export interface LoadRunningBreakError {
  readonly kind: 'load_running_break_error';
  readonly code: 'BREAK_SESSION_INELIGIBLE' | 'BREAK_SESSION_READ_FAILED';
}

const failure = (code: LoadRunningBreakError['code']):
ApplicationResult<never, LoadRunningBreakError> => ({
  ok: false,
  error: { kind: 'load_running_break_error', code },
});

export class LoadRunningBreakUseCase {
  constructor(private readonly sessions: Pick<SessionRepository, 'findById'>) {}

  async execute(sessionId: string): Promise<
  ApplicationResult<RunningBreakProjection, LoadRunningBreakError>> {
    if (!sessionId.trim()) return failure('BREAK_SESSION_INELIGIBLE');
    try {
      const result = await this.sessions.findById(sessionId);
      if (!result.ok) return failure('BREAK_SESSION_READ_FAILED');
      if (result.value === null || !isRunningBreak(result.value)) {
        return failure('BREAK_SESSION_INELIGIBLE');
      }
      const isLong = result.value.sessionType === 'long_break';
      return {
        ok: true,
        value: Object.freeze({
          sessionId: result.value.id,
          kind: isLong ? 'long' : 'short',
          durationMinutes: isLong ? 15 : 5,
          startedAt: result.value.startedAt,
          endsAt: result.value.endsAt,
        }),
      };
    } catch {
      return failure('BREAK_SESSION_READ_FAILED');
    }
  }
}
