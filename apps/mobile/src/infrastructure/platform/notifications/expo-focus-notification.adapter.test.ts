import { describe, expect, it, vi } from 'vitest';

import {
  ExpoFocusNotificationAdapter,
  type ExpoNotificationGateway,
} from './expo-focus-notification.adapter';

const gateway = (): ExpoNotificationGateway => ({
  prepareForegroundPresentation: vi.fn(async () => undefined),
  readPermission: vi.fn(async () => ({
    granted: false, status: 'undetermined' as const,
  })),
  requestPermission: vi.fn(async () => ({
    granted: false, status: 'undetermined' as const, iosAuthorizationStatus: 3,
  })),
  prepareAndroidChannel: vi.fn(async () => undefined),
  listScheduled: vi.fn(async () => []),
  schedule: vi.fn(async (input) => input.operationKey),
  cancel: vi.fn(async () => undefined),
  readInitialResponse: vi.fn(async () => null),
  subscribeResponses: vi.fn(async () => () => undefined),
  clearInitialResponse: vi.fn(async () => undefined),
});

const input = {
  operationKey: 'standard-focus-complete:focus-1',
  sessionId: 'focus-1',
  endsAt: 901_000,
  soundEnabled: true,
} as const;

describe('ExpoFocusNotificationAdapter', () => {
  it('treats iOS provisional permission as allowed', async () => {
    const subject = new ExpoFocusNotificationAdapter(gateway(), 'ios', () => 1_000);
    expect(await subject.readPermission()).toEqual({
      ok: true, value: 'undetermined',
    });
    expect(await subject.requestPermission()).toEqual({ ok: true, value: 'allowed' });
  });

  it('distinguishes requestable Android permission from a final denial', async () => {
    const requestable = gateway();
    vi.mocked(requestable.readPermission).mockResolvedValue({
      granted: false,
      status: 'denied',
      canAskAgain: true,
    });
    expect(await new ExpoFocusNotificationAdapter(
      requestable,
      'android',
    ).readPermission()).toEqual({ ok: true, value: 'undetermined' });

    const denied = gateway();
    vi.mocked(denied.readPermission).mockResolvedValue({
      granted: false,
      status: 'denied',
      canAskAgain: false,
    });
    expect(await new ExpoFocusNotificationAdapter(
      denied,
      'android',
    ).readPermission()).toEqual({ ok: true, value: 'denied' });
  });

  it('ensures one deterministic request and prepares the Android channel', async () => {
    const sdk = gateway();
    const subject = new ExpoFocusNotificationAdapter(sdk, 'android', () => 1_000);
    expect(await subject.ensure(input)).toEqual({ ok: true, value: 'scheduled' });
    expect(sdk.prepareAndroidChannel).toHaveBeenCalledWith(true);
    expect(sdk.schedule).toHaveBeenCalledWith(input);

    vi.mocked(sdk.listScheduled).mockResolvedValue([{
      identifier: input.operationKey,
      data: { kind: 'standard_focus_completion', sessionId: 'focus-1' },
      endsAt: input.endsAt,
      soundEnabled: true,
    }]);
    expect(await subject.ensure(input)).toEqual({
      ok: true, value: 'already_scheduled',
    });
    expect(sdk.schedule).toHaveBeenCalledTimes(1);
  });

  it('replaces only an owned mismatched identifier and skips past deadlines', async () => {
    const sdk = gateway();
    vi.mocked(sdk.listScheduled).mockResolvedValue([{
      identifier: input.operationKey,
      data: { kind: 'foreign', sessionId: 'focus-1' },
      endsAt: input.endsAt,
      soundEnabled: true,
    }]);
    const subject = new ExpoFocusNotificationAdapter(sdk, 'ios', () => 1_000);
    expect(await subject.ensure(input)).toMatchObject({ ok: true, value: 'scheduled' });
    expect(sdk.cancel).toHaveBeenCalledWith(input.operationKey);

    const expired = new ExpoFocusNotificationAdapter(sdk, 'ios', () => input.endsAt);
    expect(await expired.ensure(input)).toEqual({ ok: true, value: 'skipped_past_due' });
  });

  it('cancels exact scheduled operations idempotently', async () => {
    const sdk = gateway();
    const subject = new ExpoFocusNotificationAdapter(sdk, 'ios', () => 1_000);
    expect(await subject.cancel(input.operationKey)).toEqual({
      ok: true, value: 'already_absent',
    });
    vi.mocked(sdk.listScheduled).mockResolvedValue([{
      identifier: input.operationKey,
      data: { kind: 'standard_focus_completion', sessionId: 'focus-1' },
      endsAt: input.endsAt,
      soundEnabled: true,
    }]);
    expect(await subject.cancel(input.operationKey)).toEqual({ ok: true, value: 'cancelled' });
    expect(sdk.cancel).toHaveBeenCalledWith(input.operationKey);
    expect(await subject.cancel('foreign')).toMatchObject({
      ok: false, error: { code: 'NOTIFICATION_INPUT_INVALID' },
    });
  });

  it('replaces an owned request when deadline or sound no longer matches', async () => {
    const sdk = gateway();
    vi.mocked(sdk.listScheduled).mockResolvedValue([{
      identifier: input.operationKey,
      data: { kind: 'standard_focus_completion', sessionId: input.sessionId },
      endsAt: input.endsAt - 1,
      soundEnabled: false,
    }]);
    const subject = new ExpoFocusNotificationAdapter(sdk, 'ios', () => 1_000);

    expect(await subject.ensure(input)).toEqual({ ok: true, value: 'scheduled' });
    expect(sdk.cancel).toHaveBeenCalledWith(input.operationKey);
    expect(sdk.schedule).toHaveBeenCalledWith(input);
  });

  it('maps only allowlisted default-action responses', async () => {
    const sdk = gateway();
    vi.mocked(sdk.readInitialResponse).mockResolvedValue({
      actionIsDefault: true,
      identifier: input.operationKey,
      notificationDate: 902_000,
      data: { kind: 'standard_focus_completion', sessionId: 'focus-1', reward: 999 },
    });
    const subject = new ExpoFocusNotificationAdapter(sdk, 'ios');
    expect(await subject.readInitial()).toEqual({
      responseId: `${input.operationKey}:902000`,
      operationKey: input.operationKey,
      kind: 'standard_focus_completion',
      sessionId: 'focus-1',
    });
    vi.mocked(sdk.readInitialResponse).mockResolvedValue({
      actionIsDefault: false,
      identifier: input.operationKey,
      notificationDate: 902_000,
      data: { kind: 'standard_focus_completion', sessionId: 'focus-1' },
    });
    expect(await subject.readInitial()).toBeNull();
  });

  it('returns finite errors when the provider rejects', async () => {
    const sdk = gateway();
    vi.mocked(sdk.listScheduled).mockRejectedValue(new Error('native unavailable'));
    const subject = new ExpoFocusNotificationAdapter(sdk, 'ios', () => 1_000);
    expect(await subject.ensure(input)).toMatchObject({
      ok: false, error: { code: 'NOTIFICATION_SCHEDULE_FAILED' },
    });
    expect(await subject.cancel(input.operationKey)).toMatchObject({
      ok: false, error: { code: 'NOTIFICATION_CANCEL_FAILED' },
    });
  });
});
