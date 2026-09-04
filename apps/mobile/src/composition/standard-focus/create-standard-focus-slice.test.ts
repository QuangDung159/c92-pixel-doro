import { describe, expect, it, vi } from 'vitest';
import {
  SessionCommandCoordinator,
  type RunningSessionRecord,
  type SessionRecord,
  type TransactionScope,
} from '@pixeldoro/application';

import { ReadinessGate } from '@/application';
import { createStandardFocusSlice } from './create-standard-focus-slice';

const scope: TransactionScope = { transactionId: Symbol('slice') };

describe('createStandardFocusSlice', () => {
  it('returns success only after committed session and Pet projections refresh', async () => {
    let active: SessionRecord | null = null;
    const readiness = new ReadinessGate();
    readiness.open();
    const petRefresh = vi.fn(async () => undefined);
    const slice = createStandardFocusSlice({
      profile: {} as never, rewards: {} as never,
      appInitiallyVisible: true,
      calendar: { snapshot: () => ({
        ok: true, value: { localDate: '2026-09-03', utcOffsetMinutes: 420 },
      }) },
      clock: { nowMs: () => 1_000 },
      coordinator: new SessionCommandCoordinator(),
      id: { nextId: () => 'focus-1' },
      petCompanion: { refresh: petRefresh } as never,
      readiness,
      scheduler: { schedule: vi.fn(() => vi.fn()) },
      sessions: {
        findActive: async () => ({ ok: true, value: active }),
        findActiveInTransaction: async () => ({ ok: true, value: active }),
        insertRunningInTransaction: async (
          _scope: TransactionScope,
          record: RunningSessionRecord,
        ) => {
          active = record;
          return { ok: true, value: undefined };
        },
      } as never,
      transaction: { execute: (work) => work(scope) },
    });

    const result = await slice.setup.start();

    expect(result).toMatchObject({ ok: true, session: { id: 'focus-1' } });
    expect(slice.session.getSnapshot()).toMatchObject({
      status: 'ready', sessionId: 'focus-1', durationMinutes: 25,
    });
    expect(petRefresh).toHaveBeenCalledOnce();
  });

  it('does not write while core commands are not ready', async () => {
    const insert = vi.fn();
    const slice = createStandardFocusSlice({
      profile: {} as never, rewards: {} as never,
      appInitiallyVisible: true,
      calendar: { snapshot: vi.fn() }, clock: { nowMs: vi.fn() },
      coordinator: new SessionCommandCoordinator(), id: { nextId: vi.fn() },
      petCompanion: { refresh: vi.fn() } as never,
      readiness: new ReadinessGate(),
      scheduler: { schedule: vi.fn(() => vi.fn()) },
      sessions: { insertRunningInTransaction: insert } as never,
      transaction: { execute: vi.fn() },
    });
    expect(await slice.setup.start()).toEqual({
      ok: false, error: { code: 'START_UNAVAILABLE' },
    });
    expect(insert).not.toHaveBeenCalled();
  });
});
