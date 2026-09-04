import { calculateStandardFocusReward } from '@pixeldoro/domain';
import type { IdPort } from '../ports/id.port';
import type { TransactionScope } from '../ports/transaction.port';
import type { ProfileRepository } from '../persistence/profile.repository';
import type { RewardReceiptRepository } from '../persistence/reward-receipt.repository';
import type { SessionRecord, SessionRepository } from '../persistence/session.repository';
import type { ApplicationResult } from '../result/application-result';
import { readStandardFocusResult } from './load-standard-focus-result.use-case';
import { validStandardProfile, type StandardFocusTerminalResult } from './standard-focus-terminal-result';

export interface StandardCompletionDependencies {
  readonly id: IdPort;
  readonly sessions: Pick<SessionRepository, 'findByIdInTransaction' | 'transitionFromRunningInTransaction'>;
  readonly rewards: Pick<RewardReceiptRepository, 'findBySessionIdInTransaction' | 'insertInTransaction'>;
  readonly profile: Pick<ProfileRepository, 'findInTransaction' | 'applyProgressionInTransaction'>;
}
export interface StandardCompletionError {
  readonly kind: 'standard_completion_error';
  readonly code: 'READ_FAILED' | 'WRITE_FAILED' | 'STATE_INVALID';
}
export interface StandardCompletionOutcome {
  readonly result: StandardFocusTerminalResult;
  readonly freshness: 'fresh_commit' | 'existing_terminal';
}
const failure = (code: StandardCompletionError['code']): ApplicationResult<never, StandardCompletionError> =>
  ({ ok: false, error: { kind: 'standard_completion_error', code } });

export const completeStandardFocusInTransaction = async (
  dependencies: StandardCompletionDependencies, scope: TransactionScope, session: SessionRecord, now: number,
): Promise<ApplicationResult<StandardCompletionOutcome, StandardCompletionError>> => {
  const reward = calculateStandardFocusReward(session.configuredDurationMinutes);
  const before = await dependencies.profile.findInTransaction(scope);
  if (!before.ok) return failure('READ_FAILED');
  if (!reward.ok || before.value === null || !validStandardProfile(before.value)) return failure('STATE_INVALID');
  const totalXp = before.value.totalXp + reward.xpEarned;
  const coinBalance = before.value.coinBalance + reward.coinsEarned;
  if (!Number.isSafeInteger(totalXp) || !Number.isSafeInteger(coinBalance)) return failure('STATE_INVALID');
  const receiptId = dependencies.id.nextId();
  if (!receiptId.trim()) return failure('STATE_INVALID');
  const transitioned = await dependencies.sessions.transitionFromRunningInTransaction(scope, {
    sessionId: session.id, status: 'completed', resolvedAt: now, updatedAt: now,
    xpEarned: reward.xpEarned, coinsEarned: reward.coinsEarned, rewardClaimedAt: now,
  });
  if (!transitioned.ok) return failure('WRITE_FAILED');
  if (transitioned.value === 'not_updated') {
    const winner = await readStandardFocusResult(dependencies, scope, session.id);
    if (!winner.ok || winner.value.outcome !== 'ready') return failure('STATE_INVALID');
    return { ok: true, value: { result: winner.value.result, freshness: 'existing_terminal' } };
  }
  const inserted = await dependencies.rewards.insertInTransaction(scope, {
    id: receiptId, sessionId: session.id, profileId: session.profileId, reason: 'focus_completed',
    xpDelta: reward.xpEarned, coinDelta: reward.coinsEarned, createdAt: now,
  });
  if (!inserted.ok) return failure('WRITE_FAILED');
  const progressed = await dependencies.profile.applyProgressionInTransaction(scope, {
    profileId: session.profileId, xpDelta: reward.xpEarned, coinDelta: reward.coinsEarned, updatedAt: now,
  });
  if (!progressed.ok || progressed.value !== 'updated') return failure('WRITE_FAILED');
  const committed = await readStandardFocusResult(dependencies, scope, session.id);
  if (!committed.ok) return failure(committed.error.code.includes('READ') ? 'READ_FAILED' : 'STATE_INVALID');
  if (committed.value.outcome !== 'ready' || committed.value.result.status !== 'completed' ||
    committed.value.result.receiptId !== receiptId || committed.value.result.totalXp !== totalXp ||
    committed.value.result.coinBalance !== coinBalance) return failure('STATE_INVALID');
  return { ok: true, value: { result: committed.value.result, freshness: 'fresh_commit' } };
};
