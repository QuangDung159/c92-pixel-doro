import { validateStandardFocusConfiguration } from '@pixeldoro/domain';

import type { SessionRecord } from '../persistence/session.repository';

const MAX_TIMESTAMP = 8_640_000_000_000_000;

export const isSafeSessionTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP;

export const isEligibleCompletedStandardFocusSource = (
  row: SessionRecord,
  sessionId: string,
): boolean => {
  const configuration = validateStandardFocusConfiguration({
    durationMinutes: row.configuredDurationMinutes,
    mode: row.mode,
    workTag: row.workTag,
  });
  return (
    row.id === sessionId &&
    row.profileId === 1 &&
    row.sessionType === 'focus' &&
    row.focusVariant === 'standard' &&
    row.status === 'completed' &&
    configuration.ok &&
    isSafeSessionTimestamp(row.startedAt) &&
    isSafeSessionTimestamp(row.endsAt) &&
    row.endsAt === row.startedAt + row.configuredDurationMinutes * 60_000 &&
    row.resolvedAt !== null &&
    isSafeSessionTimestamp(row.resolvedAt) &&
    row.resolvedAt >= row.endsAt &&
    row.updatedAt === row.resolvedAt &&
    row.rewardClaimedAt === row.resolvedAt
  );
};
