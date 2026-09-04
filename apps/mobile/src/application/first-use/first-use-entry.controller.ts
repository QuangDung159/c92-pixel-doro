import type {
  SessionRecord,
  SessionRepository,
} from '@pixeldoro/application';
import { isRunningStandardFocus } from '@pixeldoro/application';

import type { InstallationRepository } from '../persistence';

export type FirstUseEntryDestination =
  | 'onboarding_intro'
  | 'trial_running'
  | 'trial_result'
  | 'standard_focus_running'
  | 'standard_focus_result'
  | 'home';

export type FirstUseEntryErrorCode =
  | 'FIRST_USE_ENTRY_READ_FAILED'
  | 'FIRST_USE_ENTRY_STATE_INVALID';

export type FirstUseEntryProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly destination: Exclude<FirstUseEntryDestination, 'standard_focus_result'>;
    }
  | {
      readonly status: 'ready';
      readonly destination: 'standard_focus_result';
      readonly sessionId: string;
    }
  | {
      readonly status: 'error';
      readonly error: { readonly code: FirstUseEntryErrorCode };
    };

export type FirstUseInstallationReader = Pick<InstallationRepository, 'find'>;
export type FirstUseSessionReader = Pick<
  SessionRepository,
  'findActive' | 'findLatestOnboardingTrial'
>;

export interface FirstUseEntryControllerDependencies {
  readonly installation: FirstUseInstallationReader;
  readonly sessions: FirstUseSessionReader;
  readonly standardOutcome?: {
    getSnapshot():
      | { readonly status: 'idle' }
      | { readonly status: 'failed' | 'completed'; readonly sessionId: string };
  };
}

const errorProjection = (
  code: FirstUseEntryErrorCode,
): FirstUseEntryProjection => ({
  status: 'error',
  error: { code },
});

const destinationForTrial = (
  trial: SessionRecord | null,
): FirstUseEntryProjection => {
  if (trial === null) {
    return { status: 'ready', destination: 'onboarding_intro' };
  }

  if (
    trial.sessionType !== 'focus' ||
    trial.focusVariant !== 'onboarding_trial'
  ) {
    return errorProjection('FIRST_USE_ENTRY_STATE_INVALID');
  }

  switch (trial.status) {
    case 'running':
      return { status: 'ready', destination: 'trial_running' };
    case 'completed':
      return { status: 'ready', destination: 'trial_result' };
    case 'cancelled':
      return { status: 'ready', destination: 'onboarding_intro' };
    case 'failed':
      return errorProjection('FIRST_USE_ENTRY_STATE_INVALID');
  }
};

const destinationForCompletedOnboarding = (
  active: SessionRecord | null,
): FirstUseEntryProjection => {
  if (active === null) return { status: 'ready', destination: 'home' };
  if (isRunningStandardFocus(active)) {
    return { status: 'ready', destination: 'standard_focus_running' };
  }
  return errorProjection('FIRST_USE_ENTRY_STATE_INVALID');
};

export class FirstUseEntryController {
  private projection: FirstUseEntryProjection = { status: 'idle' };
  private listeners = new Set<() => void>();
  private operation: Promise<void> | undefined;
  private generation = 0;
  private disposed = false;

  constructor(private readonly dependencies: FirstUseEntryControllerDependencies) {}

  getSnapshot = (): FirstUseEntryProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  refresh(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    if (this.operation !== undefined) return this.operation;

    const generation = ++this.generation;
    this.publish({ status: 'loading' });
    const operation = this.load(generation);
    this.operation = operation;
    void operation.finally(() => {
      if (this.operation === operation) this.operation = undefined;
    });
    return operation;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation += 1;
    this.listeners.clear();
  }

  private async load(generation: number): Promise<void> {
    try {
      const installation = await this.dependencies.installation.find();
      if (!this.isCurrent(generation)) return;
      if (!installation.ok) {
        this.publish(errorProjection('FIRST_USE_ENTRY_READ_FAILED'));
        return;
      }

      if (installation.value === null || installation.value.id !== 1) {
        this.publish(errorProjection('FIRST_USE_ENTRY_STATE_INVALID'));
        return;
      }

      if (installation.value.onboardingCompletedAt !== null) {
        const active = await this.dependencies.sessions.findActive();
        if (!this.isCurrent(generation)) return;
        if (!active.ok) {
          this.publish(errorProjection('FIRST_USE_ENTRY_READ_FAILED'));
          return;
        }
        const outcome = this.dependencies.standardOutcome?.getSnapshot();
        if (active.value === null && outcome !== undefined && outcome.status !== 'idle') {
          this.publish({
            status: 'ready',
            destination: 'standard_focus_result',
            sessionId: outcome.sessionId,
          });
          return;
        }
        this.publish(destinationForCompletedOnboarding(active.value));
        return;
      }

      const trial = await this.dependencies.sessions.findLatestOnboardingTrial();
      if (!this.isCurrent(generation)) return;
      if (!trial.ok) {
        this.publish(errorProjection('FIRST_USE_ENTRY_READ_FAILED'));
        return;
      }
      this.publish(destinationForTrial(trial.value));
    } catch {
      if (this.isCurrent(generation)) {
        this.publish(errorProjection('FIRST_USE_ENTRY_READ_FAILED'));
      }
    }
  }

  private isCurrent(generation: number): boolean {
    return !this.disposed && generation === this.generation;
  }

  private publish(projection: FirstUseEntryProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    this.listeners.forEach((listener) => listener());
  }
}
