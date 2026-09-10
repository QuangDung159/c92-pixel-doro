import {
  BREAK_NOTIFICATION_KIND,
  BREAK_NOTIFICATION_PREFIX,
  STANDARD_FOCUS_NOTIFICATION_KIND,
  STANDARD_FOCUS_NOTIFICATION_PREFIX,
  breakNotificationKey,
  standardFocusNotificationKey,
  type BreakCompletionNotificationPort,
  type FocusCompletionNotificationError,
  type SessionCompletionNotificationInput,
  type FocusCompletionNotificationPort,
  type FocusNotificationPermission,
  type SessionNotificationResponse,
  type FocusNotificationResponseSource,
  type ResetNotificationCleanupPort,
} from '@/application';
import { Platform } from 'react-native';
import type {
  ExpoNotificationGateway,
  ExpoPermissionSnapshot,
  ExpoResponseSnapshot,
} from './expo-notification.gateway';
export { ExpoNotificationGatewayAdapter } from './expo-notification.gateway';
export type { ExpoNotificationGateway } from './expo-notification.gateway';

const notificationError = (
  code: FocusCompletionNotificationError['code'],
): FocusCompletionNotificationError => ({
  kind: 'focus_completion_notification_error',
  code,
});

const permissionFrom = (snapshot: ExpoPermissionSnapshot): FocusNotificationPermission => {
  if (
    snapshot.granted ||
    snapshot.status === 'granted' ||
    snapshot.iosAuthorizationStatus === 2 ||
    snapshot.iosAuthorizationStatus === 3 ||
    snapshot.iosAuthorizationStatus === 4
  ) return 'allowed';
  if (snapshot.iosAuthorizationStatus === 1) {
    return 'denied';
  }
  if (snapshot.status === 'denied') {
    return snapshot.canAskAgain === true ? 'undetermined' : 'denied';
  }
  return 'undetermined';
};

const validInput = (input: SessionCompletionNotificationInput): boolean =>
  (input.kind === STANDARD_FOCUS_NOTIFICATION_KIND || input.kind === BREAK_NOTIFICATION_KIND) &&
  input.sessionId.trim().length > 0 &&
  input.operationKey === (input.kind === BREAK_NOTIFICATION_KIND
    ? breakNotificationKey(input.sessionId)
    : standardFocusNotificationKey(input.sessionId)) &&
  (input.kind !== BREAK_NOTIFICATION_KIND ||
    input.breakType === 'short_break' || input.breakType === 'long_break') &&
  Number.isSafeInteger(input.endsAt) &&
  input.endsAt >= 0;

const mapResponse = (response: ExpoResponseSnapshot): SessionNotificationResponse | null => {
  const kind = response.data.kind;
  const sessionId = response.data.sessionId;
  if (
    !response.actionIsDefault ||
    kind !== STANDARD_FOCUS_NOTIFICATION_KIND && kind !== BREAK_NOTIFICATION_KIND ||
    typeof sessionId !== 'string' ||
    sessionId.trim().length === 0 ||
    response.identifier !== (kind === BREAK_NOTIFICATION_KIND
      ? breakNotificationKey(sessionId) : standardFocusNotificationKey(sessionId)) ||
    !Number.isSafeInteger(response.notificationDate) ||
    response.notificationDate < 0
  ) return null;
  if (kind === BREAK_NOTIFICATION_KIND) {
    const breakType = response.data.breakType;
    if (breakType !== 'short_break' && breakType !== 'long_break') return null;
    return Object.freeze({
      responseId: `${response.identifier}:${response.notificationDate}`,
      operationKey: response.identifier,
      kind,
      sessionId,
      breakType,
    });
  }
  return Object.freeze({
    responseId: `${response.identifier}:${response.notificationDate}`,
    operationKey: response.identifier,
    kind,
    sessionId,
  });
};

export class ExpoFocusNotificationAdapter
  implements FocusCompletionNotificationPort, FocusNotificationResponseSource,
    BreakCompletionNotificationPort, ResetNotificationCleanupPort
{
  private iosAllowsSound: boolean | null | undefined;

  constructor(
    private readonly gateway: ExpoNotificationGateway,
    private readonly platform: 'ios' | 'android' | 'other' | 'auto',
    private readonly nowMs: () => number = Date.now,
  ) {}

  async prepare(): ReturnType<FocusCompletionNotificationPort['prepare']> {
    try {
      await this.gateway.prepareForegroundPresentation();
      return { ok: true, value: undefined };
    } catch {
      return { ok: false, error: notificationError('NOTIFICATION_SCHEDULE_FAILED') };
    }
  }

  async readPermission(): ReturnType<FocusCompletionNotificationPort['readPermission']> {
    try {
      const snapshot = await this.gateway.readPermission();
      this.iosAllowsSound = snapshot.iosAllowsSound;
      return { ok: true, value: permissionFrom(snapshot) };
    } catch {
      return { ok: false, error: notificationError('NOTIFICATION_PERMISSION_FAILED') };
    }
  }

  async requestPermission(): ReturnType<FocusCompletionNotificationPort['requestPermission']> {
    try {
      const snapshot = await this.gateway.requestPermission();
      this.iosAllowsSound = snapshot.iosAllowsSound;
      return { ok: true, value: permissionFrom(snapshot) };
    } catch {
      return { ok: false, error: notificationError('NOTIFICATION_PERMISSION_FAILED') };
    }
  }

  async ensure(input: SessionCompletionNotificationInput): ReturnType<FocusCompletionNotificationPort['ensure']> {
    if (!validInput(input)) {
      return { ok: false, error: notificationError('NOTIFICATION_INPUT_INVALID') };
    }
    let now: number;
    try {
      now = this.nowMs();
    } catch {
      return { ok: false, error: notificationError('NOTIFICATION_SCHEDULE_FAILED') };
    }
    if (!Number.isSafeInteger(now) || input.endsAt <= now) {
      return { ok: true, value: 'skipped_past_due' };
    }
    try {
      const scheduled = await this.gateway.listScheduled();
      const matching = scheduled.find(({ identifier }) => identifier === input.operationKey);
      const platform = await this.resolvePlatform();
      const soundEnabled = input.soundEnabled &&
        (platform !== 'ios' || this.iosAllowsSound !== false);
      if (
        matching?.data.kind === input.kind &&
        matching.data.sessionId === input.sessionId &&
        (input.kind !== BREAK_NOTIFICATION_KIND ||
          matching.data.breakType === input.breakType) &&
        matching.endsAt === input.endsAt &&
        matching.soundEnabled === soundEnabled
      ) return { ok: true, value: 'already_scheduled' };
      if (matching !== undefined) await this.gateway.cancel(input.operationKey);
      if (platform === 'android') {
        await this.gateway.prepareAndroidChannel(input.kind, soundEnabled);
      }
      const identifier = await this.gateway.schedule({ ...input, soundEnabled });
      if (identifier !== input.operationKey) {
        await this.gateway.cancel(identifier).catch(() => undefined);
        return { ok: false, error: notificationError('NOTIFICATION_SCHEDULE_FAILED') };
      }
      return { ok: true, value: 'scheduled' };
    } catch {
      return { ok: false, error: notificationError('NOTIFICATION_SCHEDULE_FAILED') };
    }
  }

  async cancel(operationKey: string): ReturnType<FocusCompletionNotificationPort['cancel']> {
    const ownedPrefix = operationKey.startsWith(STANDARD_FOCUS_NOTIFICATION_PREFIX)
      ? STANDARD_FOCUS_NOTIFICATION_PREFIX
      : operationKey.startsWith(BREAK_NOTIFICATION_PREFIX) ? BREAK_NOTIFICATION_PREFIX : null;
    if (ownedPrefix === null || operationKey.length <= ownedPrefix.length) {
      return { ok: false, error: notificationError('NOTIFICATION_INPUT_INVALID') };
    }
    try {
      const scheduled = await this.gateway.listScheduled();
      if (!scheduled.some(({ identifier }) => identifier === operationKey)) {
        return { ok: true, value: 'already_absent' };
      }
      await this.gateway.cancel(operationKey);
      return { ok: true, value: 'cancelled' };
    } catch {
      return { ok: false, error: notificationError('NOTIFICATION_CANCEL_FAILED') };
    }
  }

  async readInitial(): Promise<SessionNotificationResponse | null> {
    try {
      const response = await this.gateway.readInitialResponse();
      if (response === null) return null;
      const mapped = mapResponse(response);
      if (mapped === null) await this.gateway.clearInitialResponse();
      return mapped;
    } catch {
      return null;
    }
  }

  async subscribe(listener: (response: SessionNotificationResponse) => void): Promise<() => void> {
    try {
      return await this.gateway.subscribeResponses((raw) => {
        const response = mapResponse(raw);
        if (response !== null) listener(response);
      });
    } catch {
      return () => undefined;
    }
  }

  async clearInitial(): Promise<void> {
    await this.gateway.clearInitialResponse().catch(() => undefined);
  }

  private resolvePlatform(): 'ios' | 'android' | 'other' {
    if (this.platform !== 'auto') return this.platform;
    return Platform?.OS === 'ios'
      ? 'ios'
      : Platform?.OS === 'android'
        ? 'android'
        : 'other';
  }

  async cancelKnownSession(
    sessionId: string | null,
  ): ReturnType<ResetNotificationCleanupPort['cancelKnownSession']> {
    if (sessionId === null) return { ok: true, value: undefined };
    const results = await Promise.all([
      this.cancel(standardFocusNotificationKey(sessionId)),
      this.cancel(breakNotificationKey(sessionId)),
    ]);
    return results.every((result) => result.ok)
      ? { ok: true, value: undefined }
      : {
          ok: false,
          error: {
            kind: 'reset_notification_cleanup_error',
            code: 'RESET_NOTIFICATION_CLEANUP_FAILED',
          },
        };
  }
}
