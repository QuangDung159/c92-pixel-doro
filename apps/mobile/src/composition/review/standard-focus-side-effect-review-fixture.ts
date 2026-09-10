import { persistenceError } from '@pixeldoro/application';

import type {
  AnalyticsQueue,
  BreakCompletionNotificationInput,
  BreakCompletionNotificationPort,
  FocusCompletionNotificationPort,
  FocusCompletionNotificationInput,
  FocusNotificationResponseSource,
  ResetNotificationCleanupPort,
} from '@/application';

export type StandardFocusSideEffectReviewScenario =
  | 'standard_side_effect_fast_notification'
  | 'standard_side_effect_permission_denied'
  | 'standard_side_effect_schedule_failure_once'
  | 'standard_side_effect_cancel_failure_once'
  | 'standard_side_effect_queue_failure_once'
  | 'break_side_effect_fast_notification'
  | 'break_side_effect_permission_denied'
  | 'break_side_effect_schedule_failure_once'
  | 'break_side_effect_cancel_failure_once'
  | 'break_side_effect_queue_failure_once';

const scenarios = new Set<StandardFocusSideEffectReviewScenario>([
  'standard_side_effect_fast_notification',
  'standard_side_effect_permission_denied',
  'standard_side_effect_schedule_failure_once',
  'standard_side_effect_cancel_failure_once',
  'standard_side_effect_queue_failure_once',
  'break_side_effect_fast_notification',
  'break_side_effect_permission_denied',
  'break_side_effect_schedule_failure_once',
  'break_side_effect_cancel_failure_once',
  'break_side_effect_queue_failure_once',
]);

const isScenario = (value: string): value is StandardFocusSideEffectReviewScenario =>
  scenarios.has(value as StandardFocusSideEffectReviewScenario);

type NotificationAdapter = FocusCompletionNotificationPort &
  BreakCompletionNotificationPort &
  FocusNotificationResponseSource & ResetNotificationCleanupPort;

export const createStandardFocusSideEffectReviewFixture = (
  value: string | undefined,
  enabled: boolean,
  notifications: NotificationAdapter,
  analyticsQueue: AnalyticsQueue,
): {
  readonly scenario: StandardFocusSideEffectReviewScenario;
  readonly notifications: NotificationAdapter;
  readonly analyticsQueue: AnalyticsQueue;
} | undefined => {
  if (!enabled || value === undefined || !isScenario(value)) return undefined;
  let failSchedule = value.endsWith('schedule_failure_once');
  let failCancel = value.endsWith('cancel_failure_once');
  let failQueue = value.endsWith('queue_failure_once');
  return {
    scenario: value,
    notifications: {
      prepare: () => notifications.prepare(),
      readPermission: () => value.endsWith('permission_denied')
        ? Promise.resolve({ ok: true, value: 'denied' })
        : notifications.readPermission(),
      requestPermission: () => notifications.requestPermission(),
      ensure: (input: FocusCompletionNotificationInput | BreakCompletionNotificationInput) => {
        if (failSchedule) {
          failSchedule = false;
          return Promise.resolve({
            ok: false,
            error: {
              kind: 'focus_completion_notification_error',
              code: 'NOTIFICATION_SCHEDULE_FAILED',
            },
          });
        }
        const next = value.endsWith('fast_notification')
          ? { ...input, endsAt: Date.now() + 30_000 }
          : input;
        return input.kind === 'break_completion'
          ? notifications.ensure(next as BreakCompletionNotificationInput)
          : notifications.ensure(next as FocusCompletionNotificationInput);
      },
      cancel: (key) => {
        if (failCancel) {
          failCancel = false;
          return Promise.resolve({
            ok: false,
            error: {
              kind: 'focus_completion_notification_error',
              code: 'NOTIFICATION_CANCEL_FAILED',
            },
          });
        }
        return notifications.cancel(key);
      },
      readInitial: () => notifications.readInitial(),
      subscribe: (listener) => notifications.subscribe(listener),
      clearInitial: () => notifications.clearInitial(),
      cancelKnownSession: (sessionId) => notifications.cancelKnownSession(sessionId),
    },
    analyticsQueue: {
      enqueueBounded: (event, nowMs) => {
        if (failQueue) {
          failQueue = false;
          return Promise.resolve({
            ok: false,
            error: persistenceError('PERSISTENCE_WRITE_FAILED', 'analytics_events'),
          });
        }
        return analyticsQueue.enqueueBounded(event, nowMs);
      },
      listDue: (nowMs, limit) => analyticsQueue.listDue(nowMs, limit),
      markRetry: (input) => analyticsQueue.markRetry(input),
      deleteDelivered: (eventIds) => analyticsQueue.deleteDelivered(eventIds),
      clear: () => analyticsQueue.clear(),
    },
  };
};
