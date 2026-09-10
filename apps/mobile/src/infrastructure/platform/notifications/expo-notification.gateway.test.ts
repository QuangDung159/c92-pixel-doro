import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpoNotificationGatewayAdapter } from './expo-notification.gateway';

const { getPermissionsAsync, requestPermissionsAsync, scheduleNotificationAsync,
  setNotificationChannelAsync } = vi.hoisted(() => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(async () => null),
  scheduleNotificationAsync: vi.fn(async () => 'scheduled-id'),
}));

vi.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  scheduleNotificationAsync,
}));

describe('ExpoNotificationGatewayAdapter Android channel', () => {
  beforeEach(() => {
    getPermissionsAsync.mockReset();
    requestPermissionsAsync.mockReset();
    setNotificationChannelAsync.mockClear();
  });

  it('preserves whether Android may still show the runtime permission prompt', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: false,
      status: 'denied',
      canAskAgain: true,
    });
    const gateway = new ExpoNotificationGatewayAdapter();

    await expect(gateway.readPermission()).resolves.toMatchObject({
      granted: false,
      status: 'denied',
      canAskAgain: true,
    });
  });

  it('omits sound to request the Android system default', async () => {
    const gateway = new ExpoNotificationGatewayAdapter();

    await gateway.prepareAndroidChannel('standard_focus_completion', true);

    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      'focus-completion',
      {
        name: 'Kết thúc phiên tập trung',
        importance: 3,
        showBadge: false,
      },
    );
  });

  it('uses null only for an explicitly silent Android channel', async () => {
    const gateway = new ExpoNotificationGatewayAdapter();

    await gateway.prepareAndroidChannel('standard_focus_completion', false);

    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      'focus-completion',
      expect.objectContaining({ sound: null }),
    );
  });

  it('keeps Break copy, payload and Android channel distinct', async () => {
    const gateway = new ExpoNotificationGatewayAdapter();
    await gateway.prepareAndroidChannel('break_completion', true);
    expect(setNotificationChannelAsync).toHaveBeenCalledWith('break-completion', {
      name: 'Kết thúc phiên nghỉ', importance: 3, showBadge: false,
    });
    await gateway.schedule({
      kind: 'break_completion', operationKey: 'break-complete:break-1',
      sessionId: 'break-1', endsAt: 301_000, soundEnabled: true,
      breakType: 'short_break',
    });
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      identifier: 'break-complete:break-1',
      content: expect.objectContaining({
        title: 'Phiên nghỉ đã kết thúc',
        body: 'Nghỉ ngắn đã xong. Mèo Dev đang chờ bạn quay lại.',
        data: expect.objectContaining({ kind: 'break_completion', sessionId: 'break-1',
          breakType: 'short_break', url: '/break/session' }),
      }),
      trigger: expect.objectContaining({ date: 301_000, channelId: 'break-completion' }),
    }));
  });
});
