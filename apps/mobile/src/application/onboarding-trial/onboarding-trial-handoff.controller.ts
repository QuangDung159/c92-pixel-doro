import type {
  ApplicationResult,
  OnboardingTrialCommittedResult,
  PetCompanionController,
} from '@pixeldoro/application';

import type { MobileBootstrap } from '../bootstrap/mobile-bootstrap';
import type { FirstUseEntryController } from '../first-use';
import type {
  CompleteFirstUseHandoffError,
  CompleteFirstUseHandoffOutcome,
  CompleteFirstUseHandoffUseCase,
} from './complete-first-use-handoff.use-case';

export type OnboardingTrialHandoffErrorCode =
  | CompleteFirstUseHandoffError['code']
  | 'ONBOARDING_HANDOFF_REFRESH_FAILED'
  | 'ONBOARDING_HANDOFF_STATE_INCONSISTENT';

export interface OnboardingTrialHandoffError {
  readonly kind: 'onboarding_trial_handoff_error';
  readonly code: OnboardingTrialHandoffErrorCode;
}

export type OnboardingTrialHandoffProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | {
      readonly status: 'success';
      readonly completedAt: number;
    }
  | {
      readonly status: 'error';
      readonly error: { readonly code: OnboardingTrialHandoffErrorCode };
    };

export interface OnboardingTrialHandoffControllerDependencies {
  readonly bootstrap: MobileBootstrap;
  readonly completeHandoff: CompleteFirstUseHandoffUseCase;
  readonly firstUseEntry: FirstUseEntryController;
  readonly petCompanion: PetCompanionController;
}

const failure = (
  code: OnboardingTrialHandoffErrorCode,
): ApplicationResult<never, OnboardingTrialHandoffError> => ({
  ok: false,
  error: { kind: 'onboarding_trial_handoff_error', code },
});

export class OnboardingTrialHandoffController {
  private projection: OnboardingTrialHandoffProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private operation:
    | Promise<
        ApplicationResult<CompleteFirstUseHandoffOutcome, OnboardingTrialHandoffError>
      >
    | undefined;
  private disposed = false;

  constructor(
    private readonly dependencies: OnboardingTrialHandoffControllerDependencies,
  ) {}

  getSnapshot = (): OnboardingTrialHandoffProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  complete(
    result: OnboardingTrialCommittedResult,
  ): Promise<
    ApplicationResult<CompleteFirstUseHandoffOutcome, OnboardingTrialHandoffError>
  > {
    if (this.operation !== undefined) return this.operation;
    if (this.disposed) {
      return Promise.resolve(failure('ONBOARDING_HANDOFF_REFRESH_FAILED'));
    }
    this.publish({ status: 'submitting' });
    const operation = this.run(result);
    this.operation = operation;
    void operation.finally(() => {
      if (this.operation === operation) this.operation = undefined;
    });
    return operation;
  }

  reset(): void {
    if (!this.disposed && this.operation === undefined) {
      this.publish({ status: 'idle' });
    }
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }

  private async run(
    result: OnboardingTrialCommittedResult,
  ): Promise<
    ApplicationResult<CompleteFirstUseHandoffOutcome, OnboardingTrialHandoffError>
  > {
    const completed = await this.dependencies.completeHandoff.execute();
    if (!completed.ok) return this.fail(completed.error.code);

    const refreshed = await this.dependencies.bootstrap.refreshReadySnapshot();
    if (!refreshed.ok) return this.fail('ONBOARDING_HANDOFF_REFRESH_FAILED');
    if (
      refreshed.value.installation.onboardingCompletedAt === null ||
      refreshed.value.profile.totalXp !== result.totalXp ||
      refreshed.value.profile.coinBalance !== result.coinBalance
    ) {
      return this.fail('ONBOARDING_HANDOFF_STATE_INCONSISTENT');
    }

    await Promise.all([
      this.dependencies.firstUseEntry.refresh(),
      this.dependencies.petCompanion.refresh(),
    ]);
    const destination = this.dependencies.firstUseEntry.getSnapshot();
    const pet = this.dependencies.petCompanion.getSnapshot();
    if (
      destination.status !== 'ready' ||
      destination.destination !== 'home' ||
      pet.status !== 'ready' ||
      pet.activeSessionId !== null
    ) {
      return this.fail('ONBOARDING_HANDOFF_STATE_INCONSISTENT');
    }

    if (!this.disposed) {
      this.publish({
        status: 'success',
        completedAt: completed.value.completedAt,
      });
    }
    return { ok: true, value: completed.value };
  }

  private fail(
    code: OnboardingTrialHandoffErrorCode,
  ): ApplicationResult<never, OnboardingTrialHandoffError> {
    if (!this.disposed) this.publish({ status: 'error', error: { code } });
    return failure(code);
  }

  private publish(projection: OnboardingTrialHandoffProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
