import { describe, expect, it, vi } from 'vitest';

import type { SessionRecord } from '@pixeldoro/application';
import { createBreakRecommendationSlice } from './create-break-recommendation-slice';

const source: SessionRecord = {
  id: 'focus-1', profileId: 1, sessionType: 'focus', focusVariant: 'standard',
  mode: 'relax', status: 'completed', workTag: 'study', configuredDurationMinutes: 15,
  startedAt: 1_000, endsAt: 901_000, backgroundedAt: null, resolvedAt: 901_000,
  xpEarned: 15, coinsEarned: 3, rewardClaimedAt: 901_000,
  scheduledEndLocalDate: '2026-09-08', scheduledEndUtcOffsetMinutes: 420,
  createdAt: 1_000, updatedAt: 901_000,
};

describe('createBreakRecommendationSlice', () => {
  it('wires existing durable readers into the recommendation controller', async () => {
    const findById = vi.fn(async () => ({ ok: true as const, value: source }));
    const getFacts = vi.fn(async () => ({
      ok: true as const,
      value: {
        profileId: 1,
        completedStandardFocusCountSinceLastCompletedLongBreak: 4,
        latestCompletedLongBreak: null,
      },
    }));
    const slice = createBreakRecommendationSlice({
      sessions: { findById },
      longBreakCadence: { getFacts },
    });

    await slice.recommendation.refresh('focus-1');
    expect(slice.recommendation.getSnapshot()).toMatchObject({
      status: 'ready',
      sourceSessionId: 'focus-1',
      recommendation: { kind: 'long', durationMinutes: 15 },
    });
    expect(findById).toHaveBeenCalledWith('focus-1');
    expect(getFacts).toHaveBeenCalledWith(1);

    slice.dispose();
  });
});
