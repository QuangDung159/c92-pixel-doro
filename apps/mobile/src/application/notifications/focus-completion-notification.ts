import type { ApplicationResult, RunningSessionRecord } from '@pixeldoro/application';

export const STANDARD_FOCUS_NOTIFICATION_KIND = 'standard_focus_completion';
export const STANDARD_FOCUS_NOTIFICATION_PREFIX = 'standard-focus-complete:';

export type FocusNotificationPermission =
  | 'allowed'
  | 'denied'
  | 'undetermined';

export interface FocusCompletionNotificationInput {
  readonly operationKey: string;
  readonly sessionId: string;
  readonly endsAt: number;
  readonly soundEnabled: boolean;
}

export type FocusNotificationEnsureOutcome =
  | 'scheduled'
  | 'already_scheduled'
  | 'skipped_past_due';

export interface FocusCompletionNotificationError {
  readonly kind: 'focus_completion_notification_error';
  readonly code:
    | 'NOTIFICATION_INPUT_INVALID'
    | 'NOTIFICATION_PERMISSION_FAILED'
    | 'NOTIFICATION_SCHEDULE_FAILED'
    | 'NOTIFICATION_CANCEL_FAILED';
}

export interface FocusCompletionNotificationPort {
  prepare(): Promise<ApplicationResult<void, FocusCompletionNotificationError>>;
  readPermission(): Promise<
    ApplicationResult<FocusNotificationPermission, FocusCompletionNotificationError>
  >;
  requestPermission(): Promise<
    ApplicationResult<FocusNotificationPermission, FocusCompletionNotificationError>
  >;
  ensure(
    input: FocusCompletionNotificationInput,
  ): Promise<
    ApplicationResult<FocusNotificationEnsureOutcome, FocusCompletionNotificationError>
  >;
  cancel(
    operationKey: string,
  ): Promise<
    ApplicationResult<'cancelled' | 'already_absent', FocusCompletionNotificationError>
  >;
}

export interface FocusNotificationResponse {
  readonly responseId: string;
  readonly operationKey: string;
  readonly kind: typeof STANDARD_FOCUS_NOTIFICATION_KIND;
  readonly sessionId: string;
}

export interface FocusNotificationResponseSource {
  readInitial(): Promise<FocusNotificationResponse | null>;
  subscribe(
    listener: (response: FocusNotificationResponse) => void,
  ): Promise<() => void>;
  clearInitial(): Promise<void>;
}

export const standardFocusNotificationKey = (sessionId: string): string =>
  `${STANDARD_FOCUS_NOTIFICATION_PREFIX}${sessionId}`;

export const isValidStandardFocusNotificationSession = (
  session: RunningSessionRecord,
): boolean =>
  session.id.trim().length > 0 &&
  session.focusVariant === 'standard' &&
  session.sessionType === 'focus' &&
  session.status === 'running' &&
  session.mode !== null &&
  session.workTag !== null &&
  Number.isSafeInteger(session.endsAt) &&
  session.endsAt > session.startedAt;

