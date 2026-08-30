import { describe, expect, it } from 'vitest';

import {
  initialPrototypeState,
  prototypeReducer,
} from './prototype-state';

describe('prototypeReducer', () => {
  it('runs the onboarding trial without exposing mode or tag decisions', () => {
    const running = prototypeReducer(initialPrototypeState, { type: 'start-trial' });
    expect(running.activeSession).toEqual({
      kind: 'trial',
      durationMinutes: 5,
      mode: 'relax',
    });

    const completed = prototypeReducer(running, {
      type: 'resolve-focus',
      outcome: 'completed',
    });
    expect(completed.focusResult).toEqual({
      kind: 'trial',
      outcome: 'completed',
      durationMinutes: 5,
      mode: 'relax',
      xpEarned: 5,
      coinsEarned: 1,
    });
  });

  it('derives visible mock reward from configured completed Focus minutes', () => {
    const configured = prototypeReducer(initialPrototypeState, {
      type: 'set-duration',
      durationMinutes: 50,
    });
    const running = prototypeReducer(configured, { type: 'start-focus' });
    const completed = prototypeReducer(running, {
      type: 'resolve-focus',
      outcome: 'completed',
    });

    expect(completed.focusResult).toMatchObject({
      kind: 'focus',
      outcome: 'completed',
      durationMinutes: 50,
      xpEarned: 50,
      coinsEarned: 10,
    });
    expect(completed.activeSession).toBeNull();
  });

  it('allows failed result only for the Strict prototype branch', () => {
    const relaxRunning = prototypeReducer(initialPrototypeState, {
      type: 'start-focus',
    });
    const rejected = prototypeReducer(relaxRunning, {
      type: 'resolve-focus',
      outcome: 'failed',
    });
    expect(rejected).toBe(relaxRunning);

    const strictConfig = prototypeReducer(initialPrototypeState, {
      type: 'set-mode',
      mode: 'strict',
    });
    const strictRunning = prototypeReducer(strictConfig, { type: 'start-focus' });
    const failed = prototypeReducer(strictRunning, {
      type: 'resolve-focus',
      outcome: 'failed',
    });
    expect(failed.focusResult).toMatchObject({
      outcome: 'failed',
      xpEarned: 0,
      coinsEarned: 0,
    });
  });

  it('starts Break only after the explicit prototype action and never grants reward', () => {
    const longBreakSelected = prototypeReducer(initialPrototypeState, {
      type: 'set-next-break-kind',
      breakKind: 'long',
    });
    expect(longBreakSelected.activeSession).toBeNull();

    const running = prototypeReducer(longBreakSelected, { type: 'start-break' });
    expect(running.activeSession).toEqual({
      kind: 'break',
      breakKind: 'long',
      durationMinutes: 15,
    });

    const completed = prototypeReducer(running, {
      type: 'resolve-break',
      outcome: 'completed',
    });
    expect(completed.breakResult).toEqual({
      breakKind: 'long',
      durationMinutes: 15,
      outcome: 'completed',
    });
  });

  it('clamps standard Focus duration to the approved range and step', () => {
    const below = prototypeReducer(initialPrototypeState, {
      type: 'set-duration',
      durationMinutes: 2,
    });
    const above = prototypeReducer(initialPrototypeState, {
      type: 'set-duration',
      durationMinutes: 127,
    });
    const rounded = prototypeReducer(initialPrototypeState, {
      type: 'set-duration',
      durationMinutes: 33,
    });

    expect(below.configuration.durationMinutes).toBe(15);
    expect(above.configuration.durationMinutes).toBe(120);
    expect(rounded.configuration.durationMinutes).toBe(35);
  });
});
