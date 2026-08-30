import type { SessionRecord } from '../persistence/session.repository';
import { persistenceError } from '../persistence/persistence.error';
import { describe, expect, it, vi } from 'vitest';

import { loadPetCompanionProjection } from './load-pet-companion.projection';

const runningSession = (
  sessionType: SessionRecord['sessionType'],
): SessionRecord => ({
  id: `session-${sessionType}`,
  profileId: 1,
  sessionType,
  focusVariant: sessionType === 'focus' ? 'standard' : null,
  mode: sessionType === 'focus' ? 'relax' : null,
  status: 'running',
  workTag: sessionType === 'focus' ? 'coding' : null,
  configuredDurationMinutes: 25,
  startedAt: 100,
  endsAt: 200,
  backgroundedAt: null,
  resolvedAt: null,
  xpEarned: 0,
  coinsEarned: 0,
  rewardClaimedAt: null,
  scheduledEndLocalDate: '2026-08-30',
  scheduledEndUtcOffsetMinutes: 420,
  createdAt: 100,
  updatedAt: 100,
});

describe('loadPetCompanionProjection', () => {
  it.each([
    [null, 'idle', null],
    [runningSession('focus'), 'working', 'session-focus'],
    [runningSession('short_break'), 'breaking', 'session-short_break'],
    [runningSession('long_break'), 'breaking', 'session-long_break'],
  ] as const)('projects committed session %j', async (record, state, id) => {
    const projection = await loadPetCompanionProjection({
      findActive: vi.fn(async () => ({ ok: true as const, value: record })),
    });

    expect(projection).toEqual({
      status: 'ready',
      baseState: state,
      activeSessionId: id,
    });
    expect(Object.isFrozen(projection)).toBe(true);
  });

  it('hides a previous state when committed truth is unavailable', async () => {
    const projection = await loadPetCompanionProjection({
      findActive: vi.fn(async () => ({
        ok: false as const,
        error: persistenceError('PERSISTENCE_QUERY_FAILED', 'sessions'),
      })),
    });

    expect(projection).toEqual({
      status: 'recovery',
      reason: 'committed_session_unavailable',
    });
    expect(projection).not.toHaveProperty('baseState');
  });

  it('maps corrupt committed truth to recovery instead of guessing idle', async () => {
    const projection = await loadPetCompanionProjection({
      findActive: vi.fn(async () => ({
        ok: false as const,
        error: persistenceError('PERSISTENCE_CORRUPT_DATA', 'sessions', 'status'),
      })),
    });

    expect(projection).toEqual({
      status: 'recovery',
      reason: 'invalid_committed_session',
    });
  });
});
