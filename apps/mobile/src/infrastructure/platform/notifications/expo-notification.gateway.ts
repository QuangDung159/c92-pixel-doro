import type {
  NotificationPermissionsStatus,
  NotificationResponse,
} from 'expo-notifications';

import {
  STANDARD_FOCUS_NOTIFICATION_KIND,
  type FocusCompletionNotificationInput,
} from '@/application';

const CHANNEL_ID = 'focus-completion';

export type ExpoPermissionSnapshot = {
  readonly granted: boolean;
  readonly status: 'granted' | 'denied' | 'undetermined';
  readonly iosAuthorizationStatus?: number;
  readonly iosAllowsSound?: boolean | null;
};

export type ExpoScheduledRequest = {
  readonly identifier: string;
  readonly data: Record<string, unknown>;
  readonly endsAt: number | null;
  readonly soundEnabled: boolean;
};

export type ExpoResponseSnapshot = {
  readonly actionIsDefault: boolean;
  readonly identifier: string;
  readonly notificationDate: number;
  readonly data: Record<string, unknown>;
};

export interface ExpoNotificationGateway {
  prepareForegroundPresentation(): Promise<void>;
  readPermission(): Promise<ExpoPermissionSnapshot>;
  requestPermission(): Promise<ExpoPermissionSnapshot>;
  prepareAndroidChannel(soundEnabled: boolean): Promise<void>;
  listScheduled(): Promise<readonly ExpoScheduledRequest[]>;
  schedule(input: FocusCompletionNotificationInput): Promise<string>;
  cancel(identifier: string): Promise<void>;
  readInitialResponse(): Promise<ExpoResponseSnapshot | null>;
  subscribeResponses(listener: (response: ExpoResponseSnapshot) => void): Promise<() => void>;
  clearInitialResponse(): Promise<void>;
}

const responseSnapshot = (
  response: NotificationResponse,
  defaultActionIdentifier: string,
): ExpoResponseSnapshot => ({
  actionIsDefault: response.actionIdentifier === defaultActionIdentifier,
  identifier: response.notification.request.identifier,
  notificationDate: response.notification.date,
  data: response.notification.request.content.data ?? {},
});

const scheduledEndsAt = (trigger: unknown): number | null => {
  if (typeof trigger !== 'object' || trigger === null) return null;
  const record = trigger as Record<string, unknown>;
  if (record.type !== 'date') return null;
  const value = record.date ?? record.timestamp;
  const timestamp = value instanceof Date ? value.getTime() : value;
  return typeof timestamp === 'number' && Number.isSafeInteger(timestamp)
    ? timestamp
    : null;
};

export class ExpoNotificationGatewayAdapter implements ExpoNotificationGateway {
  private modulePromise: Promise<typeof import('expo-notifications')> | undefined;

  async prepareForegroundPresentation(): Promise<void> {
    const notifications = await this.module();
    notifications.setNotificationHandler({
      handleNotification: async (notification) => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: notification.request.content.sound !== null,
        shouldSetBadge: false,
      }),
    });
  }

  async readPermission(): Promise<ExpoPermissionSnapshot> {
    const notifications = await this.module();
    return this.permissionSnapshot(await notifications.getPermissionsAsync());
  }

  async requestPermission(): Promise<ExpoPermissionSnapshot> {
    const notifications = await this.module();
    return this.permissionSnapshot(await notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    }));
  }

  async prepareAndroidChannel(soundEnabled: boolean): Promise<void> {
    const notifications = await this.module();
    await notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Kết thúc phiên tập trung',
      importance: notifications.AndroidImportance.DEFAULT,
      showBadge: false,
      sound: soundEnabled ? 'default' : null,
    });
  }

  async listScheduled(): Promise<readonly ExpoScheduledRequest[]> {
    const notifications = await this.module();
    return (await notifications.getAllScheduledNotificationsAsync()).map((request) => ({
      identifier: request.identifier,
      data: request.content.data ?? {},
      endsAt: scheduledEndsAt(request.trigger),
      soundEnabled: request.content.sound !== null,
    }));
  }

  async schedule(input: FocusCompletionNotificationInput): Promise<string> {
    const notifications = await this.module();
    return notifications.scheduleNotificationAsync({
      identifier: input.operationKey,
      content: {
        title: 'Phiên tập trung đã kết thúc',
        body: 'Mèo Dev đang chờ bạn xem kết quả.',
        data: {
          kind: STANDARD_FOCUS_NOTIFICATION_KIND,
          sessionId: input.sessionId,
          url: '/focus/session',
        },
        badge: 0,
        sound: input.soundEnabled ? 'default' : false,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DATE,
        date: input.endsAt,
        channelId: CHANNEL_ID,
      },
    });
  }

  async cancel(identifier: string): Promise<void> {
    const notifications = await this.module();
    await notifications.cancelScheduledNotificationAsync(identifier);
  }

  async readInitialResponse(): Promise<ExpoResponseSnapshot | null> {
    const notifications = await this.module();
    const response = notifications.getLastNotificationResponse();
    return response === null
      ? null
      : responseSnapshot(response, notifications.DEFAULT_ACTION_IDENTIFIER);
  }

  async subscribeResponses(
    listener: (response: ExpoResponseSnapshot) => void,
  ): Promise<() => void> {
    const notifications = await this.module();
    const subscription = notifications.addNotificationResponseReceivedListener((response) => {
      listener(responseSnapshot(response, notifications.DEFAULT_ACTION_IDENTIFIER));
    });
    return () => subscription.remove();
  }

  async clearInitialResponse(): Promise<void> {
    const notifications = await this.module();
    notifications.clearLastNotificationResponse();
  }

  private module(): Promise<typeof import('expo-notifications')> {
    this.modulePromise ??= import('expo-notifications');
    return this.modulePromise;
  }

  private permissionSnapshot(status: NotificationPermissionsStatus): ExpoPermissionSnapshot {
    return {
      granted: status.granted,
      status: status.status,
      ...(status.ios === undefined ? {} : {
        iosAuthorizationStatus: status.ios.status,
        iosAllowsSound: status.ios.allowsSound,
      }),
    };
  }
}
