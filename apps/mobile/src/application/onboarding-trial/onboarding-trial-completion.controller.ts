import {
  type ApplicationResult,
  type CompleteOnboardingTrialError,
  type CompleteOnboardingTrialOutcome,
  type CompleteOnboardingTrialUseCase,
  type OnboardingTrialCommittedResult,
  type OnboardingTrialFreshCompletionEvent,
} from '@pixeldoro/application';

import type { OnboardingTrialResultController } from './onboarding-trial-result.controller';

export type OnboardingTrialCompletionProjection =
  | { readonly status: 'idle' | 'resolving' }
  | {
      readonly status: 'committed';
      readonly result: OnboardingTrialCommittedResult;
      readonly freshEvent: OnboardingTrialFreshCompletionEvent | null;
    }
  | {
      readonly status: 'error';
      readonly sessionId: string | null;
      readonly error: { readonly code: CompleteOnboardingTrialError['code'] };
    };

export class OnboardingTrialCompletionController {
  private projection: OnboardingTrialCompletionProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private operation:
    | Promise<ApplicationResult<CompleteOnboardingTrialOutcome, CompleteOnboardingTrialError>>
    | undefined;
  private pendingFreshEvent: OnboardingTrialFreshCompletionEvent | null = null;
  private disposed = false;

  constructor(
    private readonly completeTrial: CompleteOnboardingTrialUseCase,
    private readonly result: OnboardingTrialResultController,
  ) {}

  getSnapshot = (): OnboardingTrialCompletionProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  reconcile(
    sessionId?: string,
  ): Promise<ApplicationResult<CompleteOnboardingTrialOutcome, CompleteOnboardingTrialError>> {
    if (this.operation !== undefined) return this.operation;
    if (this.projection.status === 'committed') {
      return Promise.resolve({
        ok: true,
        value: { outcome: 'already_completed', result: this.projection.result },
      });
    }
    this.publish({ status: 'resolving' });
    const operation = this.run(sessionId);
    this.operation = operation;
    void operation.finally(() => {
      if (this.operation === operation) this.operation = undefined;
    });
    return operation;
  }

  retry(): Promise<ApplicationResult<CompleteOnboardingTrialOutcome, CompleteOnboardingTrialError>> {
    const sessionId = this.projection.status === 'error'
      ? this.projection.sessionId ?? undefined
      : undefined;
    return this.reconcile(sessionId);
  }

  discardFreshEvent(): void {
    if (this.projection.status !== 'committed' || this.projection.freshEvent === null) return;
    this.pendingFreshEvent = null;
    this.publish({ ...this.projection, freshEvent: null });
  }

  reset(): void {
    if (this.disposed || this.operation !== undefined) return;
    this.pendingFreshEvent = null;
    this.publish({ status: 'idle' });
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }

  private async run(
    sessionId?: string,
  ): Promise<ApplicationResult<CompleteOnboardingTrialOutcome, CompleteOnboardingTrialError>> {
    const completed = await this.completeTrial.execute(sessionId);
    if (this.disposed) return completed;
    if (!completed.ok) {
      this.publish({
        status: 'error',
        sessionId: sessionId ?? null,
        error: { code: completed.error.code },
      });
      return completed;
    }
    if (
      completed.value.outcome === 'completed_fresh' ||
      completed.value.outcome === 'already_completed'
    ) {
      if (completed.value.outcome === 'completed_fresh') {
        this.pendingFreshEvent = completed.value.event;
      }
      await this.result.refresh();
      const projected = this.result.getSnapshot();
      if (projected.status !== 'ready') {
        const error: CompleteOnboardingTrialError = {
          kind: 'complete_onboarding_trial_error',
          code: 'SESSION_COMPLETION_READ_FAILED',
        };
        this.publish({ status: 'error', sessionId: sessionId ?? null, error: { code: error.code } });
        return { ok: false, error };
      }
      this.publish({
        status: 'committed',
        result: projected.result,
        freshEvent: this.pendingFreshEvent,
      });
    } else {
      this.publish({ status: 'idle' });
    }
    return completed;
  }

  private publish(projection: OnboardingTrialCompletionProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
