import { calculateStandardFocusReward, decideStrictReconciliation, validateStandardFocusConfiguration, type FocusMode, type WorkTag } from '@pixeldoro/domain';
import type { ProfileRecord } from '../persistence/profile.repository';
import type { RewardReceiptRecord } from '../persistence/reward-receipt.repository';
import type { SessionRecord } from '../persistence/session.repository';

interface StandardFocusResultBase {
  readonly sessionId: string;
  readonly durationMinutes: number;
  readonly mode: FocusMode;
  readonly workTag: WorkTag;
  readonly startedAt: number;
  readonly endsAt: number;
  readonly resolvedAt: number;
}
export interface StandardFocusCompletedResult extends StandardFocusResultBase {
  readonly status: 'completed';
  readonly receiptId: string;
  readonly rewardClaimedAt: number;
  readonly xpEarned: number;
  readonly coinsEarned: number;
  readonly totalXp: number;
  readonly coinBalance: number;
}
export interface StandardFocusCancelledResult extends StandardFocusResultBase {
  readonly status: 'cancelled';
  readonly xpEarned: 0;
  readonly coinsEarned: 0;
}
export interface StandardFocusFailedResult extends StandardFocusResultBase {
  readonly status: 'failed';
  readonly mode: 'strict';
  readonly backgroundedAt: number;
  readonly xpEarned: 0;
  readonly coinsEarned: 0;
}
export type StandardFocusTerminalResult = StandardFocusCompletedResult | StandardFocusCancelledResult | StandardFocusFailedResult;

export const isStandardTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000;

export const hasStandardFocusIdentity = (row: SessionRecord): boolean =>
  row.id.trim().length > 0 && row.profileId === 1 && row.sessionType === 'focus' &&
  row.focusVariant === 'standard' && row.mode !== null && row.workTag !== null &&
  validateStandardFocusConfiguration({ durationMinutes: row.configuredDurationMinutes, mode: row.mode, workTag: row.workTag }).ok &&
  isStandardTimestamp(row.startedAt) && isStandardTimestamp(row.endsAt) &&
  row.endsAt === row.startedAt + row.configuredDurationMinutes * 60_000 &&
  row.createdAt === row.startedAt && isStandardTimestamp(row.updatedAt) && row.updatedAt >= row.startedAt &&
  (row.backgroundedAt === null || (row.mode === 'strict' && isStandardTimestamp(row.backgroundedAt) &&
    row.backgroundedAt >= row.startedAt && row.backgroundedAt <= row.updatedAt));

export const validStandardProfile = (profile: ProfileRecord): boolean =>
  profile.id === 1 && Number.isSafeInteger(profile.totalXp) && profile.totalXp >= 0 &&
  Number.isSafeInteger(profile.coinBalance) && profile.coinBalance >= 0;

export const projectStandardFocusResult = (
  row: SessionRecord, receipt: RewardReceiptRecord | null, profile: ProfileRecord,
): StandardFocusTerminalResult | null => {
  if (!hasStandardFocusIdentity(row) || !validStandardProfile(profile) || row.mode === null ||
    row.workTag === null || row.resolvedAt === null || !isStandardTimestamp(row.resolvedAt) ||
    row.resolvedAt < row.startedAt || row.updatedAt !== row.resolvedAt) return null;
  const common = {
    sessionId: row.id, durationMinutes: row.configuredDurationMinutes, mode: row.mode,
    workTag: row.workTag, startedAt: row.startedAt, endsAt: row.endsAt, resolvedAt: row.resolvedAt,
  };
  if (row.status === 'completed') {
    const reward = calculateStandardFocusReward(row.configuredDurationMinutes);
    if (!reward.ok || row.resolvedAt < row.endsAt || row.rewardClaimedAt !== row.resolvedAt ||
      row.xpEarned !== reward.xpEarned || row.coinsEarned !== reward.coinsEarned || receipt === null ||
      receipt.id.trim().length === 0 || receipt.sessionId !== row.id || receipt.profileId !== row.profileId ||
      receipt.reason !== 'focus_completed' || receipt.xpDelta !== row.xpEarned ||
      receipt.coinDelta !== row.coinsEarned || receipt.createdAt !== row.rewardClaimedAt) return null;
    if (row.mode === 'strict' && decideStrictReconciliation({
      startedAt: row.startedAt, endsAt: row.endsAt, backgroundedAt: row.backgroundedAt, now: row.resolvedAt,
    }).outcome !== 'completion_due') return null;
    return Object.freeze({ ...common, status: 'completed', receiptId: receipt.id,
      rewardClaimedAt: row.rewardClaimedAt, xpEarned: row.xpEarned, coinsEarned: row.coinsEarned,
      totalXp: profile.totalXp, coinBalance: profile.coinBalance });
  }
  if (receipt !== null || row.xpEarned !== 0 || row.coinsEarned !== 0 || row.rewardClaimedAt !== null) return null;
  if (row.status === 'cancelled' && row.resolvedAt < row.endsAt && row.backgroundedAt === null) {
    return Object.freeze({ ...common, status: 'cancelled', xpEarned: 0, coinsEarned: 0 });
  }
  if (row.status === 'failed' && row.mode === 'strict' && row.backgroundedAt !== null &&
    decideStrictReconciliation({ startedAt: row.startedAt, endsAt: row.endsAt,
      backgroundedAt: row.backgroundedAt, now: row.resolvedAt }).outcome === 'failed_due') {
    return Object.freeze({ ...common, status: 'failed', mode: 'strict', backgroundedAt: row.backgroundedAt,
      xpEarned: 0, coinsEarned: 0 });
  }
  return null;
};
