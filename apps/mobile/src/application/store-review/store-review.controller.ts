import type {
  ClockPort,
  IdPort,
  SessionRepository,
} from '@pixeldoro/application';

import type {
  StoreReviewAttemptRepository,
  StoreReviewFacts,
  StoreReviewFactsQuery,
} from '../persistence';

export const STORE_REVIEW_MIN_INSTALL_AGE_MS = 604_800_000;
export const STORE_REVIEW_COOLDOWN_MS = 10_368_000_000;
export const STORE_REVIEW_MIN_COMPLETED_FOCUS = 5;
export const STORE_REVIEW_MIN_ACTIVE_DAYS = 3;
export const STORE_REVIEW_MAX_ROLLING_YEAR_ATTEMPTS = 3;

export interface StoreReviewPort {
  isAvailable(): Promise<boolean>;
  request(): Promise<void>;
}

export interface StoreReviewEligibilityInput {
  readonly facts: StoreReviewFacts;
  readonly nowMs: number;
}

export const isStoreReviewEligible = ({
  facts,
  nowMs,
}: StoreReviewEligibilityInput): boolean =>
  Number.isSafeInteger(nowMs) && nowMs >= 0 &&
  nowMs - facts.installedAt >= STORE_REVIEW_MIN_INSTALL_AGE_MS &&
  facts.completedStandardFocusCount >= STORE_REVIEW_MIN_COMPLETED_FOCUS &&
  facts.distinctStandardFocusActiveDayCount >= STORE_REVIEW_MIN_ACTIVE_DAYS &&
  !facts.currentVersionAttempted &&
  facts.rolling365DayAttemptCount < STORE_REVIEW_MAX_ROLLING_YEAR_ATTEMPTS &&
  (facts.latestAttempt === null ||
    nowMs - facts.latestAttempt.attemptedAt >= STORE_REVIEW_COOLDOWN_MS);

export interface StoreReviewControllerDependencies {
  readonly appVersion: string;
  readonly attempts: Pick<StoreReviewAttemptRepository, 'insert'>;
  readonly clock: ClockPort;
  readonly facts: StoreReviewFactsQuery;
  readonly id: IdPort;
  readonly isAppActive: () => boolean;
  readonly isProduction: boolean;
  readonly nativeReview: StoreReviewPort;
  readonly sessions: Pick<SessionRepository, 'findActive'>;
  readonly recordRequested?: (attemptId: string, occurredAt: number) => void;
}

export type StoreReviewRequestOutcome =
  | 'requested'
  | 'native_failed_attempt_counted'
  | 'ineligible'
  | 'unavailable'
  | 'stale_context'
  | 'persistence_unavailable';

export class StoreReviewController {
  private operation: Promise<StoreReviewRequestOutcome> | undefined;
  private readonly consumedTokens = new Set<string>();
  private disposed = false;

  constructor(private readonly dependencies: StoreReviewControllerDependencies) {}

  requestAtHome = (freshCompletionToken: string): Promise<StoreReviewRequestOutcome> => {
    if (
      this.disposed || !freshCompletionToken.trim() ||
      this.consumedTokens.has(freshCompletionToken)
    ) return Promise.resolve('ineligible');
    this.consumedTokens.add(freshCompletionToken);
    if (this.operation !== undefined) return this.operation;
    const operation = this.run();
    this.operation = operation;
    void operation.finally(() => {
      if (this.operation === operation) this.operation = undefined;
    });
    return operation;
  };

  dispose(): void {
    this.disposed = true;
    this.consumedTokens.clear();
  }

  private async run(): Promise<StoreReviewRequestOutcome> {
    if (
      !this.dependencies.isProduction || !this.dependencies.isAppActive() ||
      !this.dependencies.appVersion.trim()
    ) return 'ineligible';

    let available = false;
    try {
      available = await this.dependencies.nativeReview.isAvailable();
    } catch {
      return 'unavailable';
    }
    if (!available) return 'unavailable';

    const nowMs = this.dependencies.clock.nowMs();
    const [facts, activeSession] = await Promise.all([
      this.dependencies.facts.getFacts({
        profileId: 1,
        appVersion: this.dependencies.appVersion,
        nowMs,
      }).catch(() => null),
      this.dependencies.sessions.findActive().catch(() => null),
    ]);
    if (facts === null || activeSession === null || !facts.ok || !activeSession.ok) {
      return 'persistence_unavailable';
    }
    if (activeSession.value !== null || !isStoreReviewEligible({ facts: facts.value, nowMs })) {
      return 'ineligible';
    }
    if (this.disposed || !this.dependencies.isAppActive()) return 'stale_context';

    const attemptId = this.dependencies.id.nextId();
    const inserted = await this.dependencies.attempts.insert({
      id: attemptId,
      appVersion: this.dependencies.appVersion,
      attemptedAt: nowMs,
      createdAt: nowMs,
    }).catch(() => null);
    if (inserted === null || !inserted.ok) return 'persistence_unavailable';

    try {
      this.dependencies.recordRequested?.(attemptId, nowMs);
    } catch {
      // Analytics cannot alter review attempt truth.
    }
    try {
      await this.dependencies.nativeReview.request();
      return 'requested';
    } catch {
      return 'native_failed_attempt_counted';
    }
  }
}

