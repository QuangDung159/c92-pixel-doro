import type { ProfileRepository } from '../persistence/profile.repository';
import type { RewardReceiptRepository } from '../persistence/reward-receipt.repository';
import type { SessionRepository } from '../persistence/session.repository';
import type { TransactionPort, TransactionScope } from '../ports/transaction.port';
import type { ApplicationResult } from '../result/application-result';
import { projectStandardFocusResult, type StandardFocusTerminalResult } from './standard-focus-terminal-result';

export type LoadStandardFocusResultOutcome =
  | { readonly outcome: 'ready'; readonly result: StandardFocusTerminalResult }
  | { readonly outcome: 'missing' };
export interface LoadStandardFocusResultError {
  readonly kind: 'load_standard_focus_result_error';
  readonly code: 'STANDARD_FOCUS_RESULT_READ_FAILED' | 'STANDARD_FOCUS_RESULT_INCONSISTENT';
}
export interface StandardFocusResultReaders {
  readonly sessions: Pick<SessionRepository, 'findByIdInTransaction'>;
  readonly rewards: Pick<RewardReceiptRepository, 'findBySessionIdInTransaction'>;
  readonly profile: Pick<ProfileRepository, 'findInTransaction'>;
}
export interface LoadStandardFocusResultDependencies extends StandardFocusResultReaders {
  readonly transaction: TransactionPort;
}
const failure = (code: LoadStandardFocusResultError['code']): ApplicationResult<never, LoadStandardFocusResultError> =>
  ({ ok: false, error: { kind: 'load_standard_focus_result_error', code } });

export const readStandardFocusResult = async (
  dependencies: StandardFocusResultReaders, scope: TransactionScope, sessionId: string,
): Promise<ApplicationResult<LoadStandardFocusResultOutcome, LoadStandardFocusResultError>> => {
  if (!sessionId.trim()) return failure('STANDARD_FOCUS_RESULT_INCONSISTENT');
  const found = await dependencies.sessions.findByIdInTransaction(scope, sessionId);
  if (!found.ok) return failure('STANDARD_FOCUS_RESULT_READ_FAILED');
  if (found.value === null) return { ok: true, value: { outcome: 'missing' } };
  if (found.value.id !== sessionId) return failure('STANDARD_FOCUS_RESULT_INCONSISTENT');
  const receipt = await dependencies.rewards.findBySessionIdInTransaction(scope, sessionId);
  const profile = await dependencies.profile.findInTransaction(scope);
  if (!receipt.ok || !profile.ok) return failure('STANDARD_FOCUS_RESULT_READ_FAILED');
  if (profile.value === null) return failure('STANDARD_FOCUS_RESULT_INCONSISTENT');
  const result = projectStandardFocusResult(found.value, receipt.value, profile.value);
  return result === null ? failure('STANDARD_FOCUS_RESULT_INCONSISTENT') : { ok: true, value: { outcome: 'ready', result } };
};

export class LoadStandardFocusResultUseCase {
  constructor(private readonly dependencies: LoadStandardFocusResultDependencies) {}
  async execute(sessionId: string): Promise<ApplicationResult<LoadStandardFocusResultOutcome, LoadStandardFocusResultError>> {
    try {
      const result = await this.dependencies.transaction.execute((scope) => readStandardFocusResult(this.dependencies, scope, sessionId));
      if (!result.ok) return result.error.kind === 'transaction_technical_error'
        ? failure('STANDARD_FOCUS_RESULT_READ_FAILED') : { ok: false, error: result.error };
      return { ok: true, value: result.value };
    } catch { return failure('STANDARD_FOCUS_RESULT_READ_FAILED'); }
  }
}
