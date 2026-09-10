import type { ApplicationResult, RunningSessionRecord } from '@pixeldoro/application';

export const STANDARD_FOCUS_NOTIFICATION_KIND = 'standard_focus_completion';
export const STANDARD_FOCUS_NOTIFICATION_PREFIX = 'standard-focus-complete:';
export const BREAK_NOTIFICATION_KIND = 'break_completion';
export const BREAK_NOTIFICATION_PREFIX = 'break-complete:';

export type FocusNotificationPermission =
  | 'allowed'
  | 'denied'
  | 'undetermined';

export interface FocusCompletionNotificationInput {
  readonly kind: typeof STANDARD_FOCUS_NOTIFICATION_KIND;
  readonly operationKey: string;
  readonly sessionId: string;
  readonly endsAt: number;
  readonly soundEnabled: boolean;
}

export interface BreakCompletionNotificationInput {
  readonly kind: typeof BREAK_NOTIFICATION_KIND;
  readonly operationKey: string;
  readonly sessionId: string;
  readonly endsAt: number;
  readonly soundEnabled: boolean;
  readonly breakType: 'short_break' | 'long_break';
}

export type SessionCompletionNotificationInput =
  | FocusCompletionNotificationInput
  | BreakCompletionNotificationInput;

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

export interface BreakCompletionNotificationPort {
  prepare(): Promise<ApplicationResult<void, FocusCompletionNotificationError>>;
  readPermission(): Promise<
    ApplicationResult<FocusNotificationPermission, FocusCompletionNotificationError>
  >;
  requestPermission(): Promise<
    ApplicationResult<FocusNotificationPermission, FocusCompletionNotificationError>
  >;
  ensure(
    input: BreakCompletionNotificationInput,
  ): Promise<ApplicationResult<FocusNotificationEnsureOutcome, FocusCompletionNotificationError>>;
  cancel(
    operationKey: string,
  ): Promise<ApplicationResult<'cancelled' | 'already_absent', FocusCompletionNotificationError>>;
}

export interface FocusNotificationResponse {
  readonly responseId: string;
  readonly operationKey: string;
  readonly kind: typeof STANDARD_FOCUS_NOTIFICATION_KIND;
  readonly sessionId: string;
}

export interface BreakNotificationResponse {
  readonly responseId: string;
  readonly operationKey: string;
  readonly kind: typeof BREAK_NOTIFICATION_KIND;
  readonly sessionId: string;
  readonly breakType: 'short_break' | 'long_break';
}

export type SessionNotificationResponse = FocusNotificationResponse | BreakNotificationResponse;

export interface FocusNotificationResponseSource {
  readInitial(): Promise<SessionNotificationResponse | null>;
  subscribe(
    listener: (response: SessionNotificationResponse) => void,
  ): Promise<() => void>;
  clearInitial(): Promise<void>;
}

export const standardFocusNotificationKey = (sessionId: string): string =>
  `${STANDARD_FOCUS_NOTIFICATION_PREFIX}${sessionId}`;

export const breakNotificationKey = (sessionId: string): string =>
  `${BREAK_NOTIFICATION_PREFIX}${sessionId}`;

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

export const isValidBreakNotificationSession = (
  session: RunningSessionRecord,
): boolean =>
  session.id.trim().length > 0 &&
  (session.sessionType === 'short_break' || session.sessionType === 'long_break') &&
  session.focusVariant === null &&
  session.status === 'running' &&
  session.mode === null &&
  session.workTag === null &&
  Number.isSafeInteger(session.endsAt) &&
  session.endsAt > session.startedAt;
