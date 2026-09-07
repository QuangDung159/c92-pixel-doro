import { describe, expect, it } from 'vitest';

import { isStandardFocusNotificationDestinationCurrent } from './standard-focus-notification-navigation';

const pending = (
  destination: 'home' | 'running' | 'result',
  sessionId = 'focus-1',
) => ({ status: 'pending', destination, sessionId, requestId: 1 } as const);

describe('standard focus notification navigation', () => {
  it('recognizes the exact Result route and suppresses a duplicate replace', () => {
    expect(isStandardFocusNotificationDestinationCurrent(
      pending('result'), '/focus/result', 'focus-1',
    )).toBe(true);
    expect(isStandardFocusNotificationDestinationCurrent(
      pending('result'), '/focus/result', ['focus-1'],
    )).toBe(true);
  });

  it('still navigates when the Result belongs to another session', () => {
    expect(isStandardFocusNotificationDestinationCurrent(
      pending('result'), '/focus/result', 'focus-2',
    )).toBe(false);
    expect(isStandardFocusNotificationDestinationCurrent(
      pending('result'), '/focus/session', undefined,
    )).toBe(false);
  });

  it('recognizes running and Home destinations without consuming a missing request', () => {
    expect(isStandardFocusNotificationDestinationCurrent(
      pending('running'), '/focus/session', undefined,
    )).toBe(true);
    expect(isStandardFocusNotificationDestinationCurrent(
      pending('home'), '/', undefined,
    )).toBe(true);
    expect(isStandardFocusNotificationDestinationCurrent(
      { status: 'idle' }, '/focus/session', undefined,
    )).toBe(true);
  });
});
