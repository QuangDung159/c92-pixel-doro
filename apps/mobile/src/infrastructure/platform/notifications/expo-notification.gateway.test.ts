import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpoNotificationGatewayAdapter } from './expo-notification.gateway';

const { getPermissionsAsync, requestPermissionsAsync, setNotificationChannelAsync } = vi.hoisted(() => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(async () => null),
}));

vi.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
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

    await gateway.prepareAndroidChannel(true);

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

    await gateway.prepareAndroidChannel(false);

    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      'focus-completion',
      expect.objectContaining({ sound: null }),
    );
  });
});
