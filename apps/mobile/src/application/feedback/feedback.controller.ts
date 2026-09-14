import type { ClockPort, IdPort } from '@pixeldoro/application';

export const FEEDBACK_COMMENT_MAX_CODE_POINTS = 1_000;
export const FEEDBACK_COMMENT_MAX_UTF8_BYTES = 4_096;

export interface FeedbackSubmission {
  readonly submissionId: string;
  readonly score: 1 | 2 | 3 | 4 | 5;
  readonly comment: string;
  readonly appVersion: string;
  readonly platform: 'ios' | 'android';
}

export interface FeedbackSubmissionPort {
  submit(input: FeedbackSubmission): Promise<'accepted' | 'retryable' | 'rejected' | 'unavailable'>;
}

export type FeedbackIssueCode =
  | 'SCORE_REQUIRED'
  | 'COMMENT_TOO_LONG'
  | 'NETWORK_REQUIRED'
  | 'SUBMISSION_REJECTED'
  | 'PROVIDER_UNAVAILABLE';

export type FeedbackProjection =
  | { readonly status: 'idle' }
  | {
      readonly status: 'ready' | 'submitting' | 'failure';
      readonly score: 1 | 2 | 3 | 4 | 5 | null;
      readonly comment: string;
      readonly commentCodePoints: number;
      readonly issue: FeedbackIssueCode | null;
    }
  | { readonly status: 'success' };

export interface FeedbackControllerDependencies {
  readonly appVersion: string;
  readonly clock: ClockPort;
  readonly id: IdPort;
  readonly platform: () => 'ios' | 'android';
  readonly provider: FeedbackSubmissionPort;
  readonly recordStarted?: (episodeId: string, occurredAt: number) => void;
  readonly recordSubmitted?: (submissionId: string, occurredAt: number) => void;
}

const utf8ByteLength = (value: string): number => {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
};

const commentLength = (value: string): number => Array.from(value).length;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

export const validateFeedbackSubmission = (
  value: unknown,
): value is FeedbackSubmission => {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  if (
    keys.length !== 5 ||
    !['submissionId', 'score', 'comment', 'appVersion', 'platform']
      .every((key) => keys.includes(key))
  ) return false;
  return typeof value.submissionId === 'string' &&
    value.submissionId === value.submissionId.trim() && value.submissionId.length > 0 &&
    value.submissionId.length <= 128 &&
    typeof value.score === 'number' && Number.isSafeInteger(value.score) &&
    value.score >= 1 && value.score <= 5 &&
    typeof value.comment === 'string' && value.comment === value.comment.trim() &&
    commentLength(value.comment) <= FEEDBACK_COMMENT_MAX_CODE_POINTS &&
    utf8ByteLength(value.comment) <= FEEDBACK_COMMENT_MAX_UTF8_BYTES &&
    typeof value.appVersion === 'string' && value.appVersion === value.appVersion.trim() &&
    value.appVersion.length > 0 &&
    value.appVersion.length <= 64 &&
    (value.platform === 'ios' || value.platform === 'android');
};

export class FeedbackController {
  private projection: FeedbackProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private operation: Promise<boolean> | undefined;
  private submissionId: string | undefined;
  private generation = 0;
  private disposed = false;

  constructor(private readonly dependencies: FeedbackControllerDependencies) {}

  getSnapshot = (): FeedbackProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  activate = (): void => {
    if (this.disposed) return;
    const wasIdle = this.projection.status === 'idle' || this.projection.status === 'success';
    if (wasIdle) {
      this.generation += 1;
      this.submissionId = undefined;
      this.publish({
        status: 'ready', score: null, comment: '', commentCodePoints: 0, issue: null,
      });
      const episodeId = this.dependencies.id.nextId();
      try {
        this.dependencies.recordStarted?.(episodeId, this.dependencies.clock.nowMs());
      } catch {
        // Analytics is independent from feedback.
      }
    }
  };

  deactivate = (): void => {
    if (this.disposed) return;
    this.generation += 1;
    this.operation = undefined;
    this.submissionId = undefined;
    this.publish({ status: 'idle' });
  };

  setScore = (score: number): void => {
    if (!this.editable() || ![1, 2, 3, 4, 5].includes(score)) return;
    this.invalidateFailedSubmission();
    const current = this.form();
    if (current === null) return;
    this.publish({ ...current, status: 'ready', score: score as 1 | 2 | 3 | 4 | 5, issue: null });
  };

  setComment = (comment: string): void => {
    if (!this.editable()) return;
    this.invalidateFailedSubmission();
    const current = this.form();
    if (current === null) return;
    const codePoints = commentLength(comment);
    const tooLong = codePoints > FEEDBACK_COMMENT_MAX_CODE_POINTS ||
      utf8ByteLength(comment) > FEEDBACK_COMMENT_MAX_UTF8_BYTES;
    this.publish({
      ...current,
      status: 'ready',
      comment,
      commentCodePoints: codePoints,
      issue: tooLong ? 'COMMENT_TOO_LONG' : null,
    });
  };

  submit = (): Promise<boolean> => {
    if (this.disposed) return Promise.resolve(false);
    if (this.operation !== undefined) return this.operation;
    const form = this.form();
    if (form === null || form.score === null) {
      if (form !== null) this.publish({ ...form, status: 'failure', issue: 'SCORE_REQUIRED' });
      return Promise.resolve(false);
    }
    const trimmed = form.comment.trim();
    if (
      commentLength(trimmed) > FEEDBACK_COMMENT_MAX_CODE_POINTS ||
      utf8ByteLength(trimmed) > FEEDBACK_COMMENT_MAX_UTF8_BYTES
    ) {
      this.publish({ ...form, status: 'failure', issue: 'COMMENT_TOO_LONG' });
      return Promise.resolve(false);
    }
    const submissionId = this.submissionId ?? this.dependencies.id.nextId();
    this.submissionId = submissionId;
    const generation = this.generation;
    this.publish({ ...form, status: 'submitting', issue: null });
    let platform: 'ios' | 'android';
    try {
      platform = this.dependencies.platform();
    } catch {
      this.publish({ ...form, status: 'failure', issue: 'PROVIDER_UNAVAILABLE' });
      return Promise.resolve(false);
    }
    const operation = this.runSubmit({
      submissionId,
      score: form.score,
      comment: trimmed,
      appVersion: this.dependencies.appVersion,
      platform,
    }, generation);
    this.operation = operation;
    void operation.finally(() => {
      if (this.operation === operation) this.operation = undefined;
    });
    return operation;
  };

  dispose(): void {
    this.disposed = true;
    this.generation += 1;
    this.operation = undefined;
    this.listeners.clear();
  }

  private async runSubmit(input: FeedbackSubmission, generation: number): Promise<boolean> {
    let outcome: Awaited<ReturnType<FeedbackSubmissionPort['submit']>>;
    try {
      outcome = await this.dependencies.provider.submit(input);
    } catch {
      outcome = 'retryable';
    }
    if (this.disposed || generation !== this.generation) return outcome === 'accepted';
    if (outcome === 'accepted') {
      this.submissionId = undefined;
      this.publish({ status: 'success' });
      try {
        this.dependencies.recordSubmitted?.(input.submissionId, this.dependencies.clock.nowMs());
      } catch {
        // Analytics cannot change accepted feedback.
      }
      return true;
    }
    const form = this.form();
    if (form !== null) {
      this.publish({
        ...form,
        status: 'failure',
        issue: outcome === 'unavailable'
          ? 'PROVIDER_UNAVAILABLE'
          : outcome === 'rejected'
            ? 'SUBMISSION_REJECTED'
            : 'NETWORK_REQUIRED',
      });
    }
    return false;
  }

  private editable(): boolean {
    return this.projection.status === 'ready' || this.projection.status === 'failure';
  }

  private form(): Extract<FeedbackProjection, { status: 'ready' | 'submitting' | 'failure' }> | null {
    return this.projection.status === 'ready' || this.projection.status === 'submitting' ||
      this.projection.status === 'failure' ? this.projection : null;
  }

  private invalidateFailedSubmission(): void {
    if (this.projection.status === 'failure') this.submissionId = undefined;
  }

  private publish(projection: FeedbackProjection): void {
    if (this.disposed) return;
    this.projection = Object.freeze(projection);
    for (const listener of this.listeners) {
      try { listener(); } catch { /* Presentation cannot alter feedback truth. */ }
    }
  }
}
