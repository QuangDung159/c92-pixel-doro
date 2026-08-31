import type {
  OnboardingTrialFreshCompletionEvent,
  PetCompanionController,
  PetTerminalFeedbackController,
} from '@pixeldoro/application';

import type { OnboardingTrialCompletionController } from './onboarding-trial-completion.controller';

export type OnboardingTrialPetFeedbackBridgeProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'delivering'; readonly eventId: string }
  | { readonly status: 'delivered'; readonly eventId: string }
  | {
      readonly status: 'recovery';
      readonly eventId: string;
      readonly reason:
        | 'pet_base_unavailable'
        | 'conflicting_committed_truth'
        | 'feedback_runtime_unavailable';
    };

export interface OnboardingTrialPetFeedbackBridgeDependencies {
  readonly completion: OnboardingTrialCompletionController;
  readonly petCompanion: PetCompanionController;
  readonly petTerminalFeedback: PetTerminalFeedbackController;
}

export class OnboardingTrialPetFeedbackBridge {
  private projection: OnboardingTrialPetFeedbackBridgeProjection = {
    status: 'idle',
  };
  private readonly listeners = new Set<() => void>();
  private unsubscribe: (() => void) | undefined;
  private operation: Promise<void> | undefined;
  private disposed = false;

  constructor(
    private readonly dependencies: OnboardingTrialPetFeedbackBridgeDependencies,
  ) {}

  getSnapshot = (): OnboardingTrialPetFeedbackBridgeProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  start(): void {
    if (this.disposed || this.unsubscribe !== undefined) return;
    this.unsubscribe = this.dependencies.completion.subscribe(this.synchronize);
    this.synchronize();
  }

  retry(): Promise<void> {
    if (this.projection.status === 'recovery') {
      this.dependencies.petTerminalFeedback.dismissRecovery();
    }
    return this.deliverCurrentEvent();
  }

  reset(): void {
    if (!this.disposed && this.operation === undefined) {
      this.publish({ status: 'idle' });
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.listeners.clear();
  }

  private synchronize = (): void => {
    const completion = this.dependencies.completion.getSnapshot();
    if (completion.status !== 'committed' || completion.freshEvent === null) {
      return;
    }
    void this.deliverCurrentEvent();
  };

  private deliverCurrentEvent(): Promise<void> {
    if (this.operation !== undefined) return this.operation;
    const completion = this.dependencies.completion.getSnapshot();
    if (completion.status !== 'committed' || completion.freshEvent === null) {
      return Promise.resolve();
    }
    const operation = this.deliver(completion.freshEvent);
    this.operation = operation;
    void operation.finally(() => {
      if (this.operation === operation) this.operation = undefined;
    });
    return operation;
  }

  private async deliver(event: OnboardingTrialFreshCompletionEvent): Promise<void> {
    this.publish({ status: 'delivering', eventId: event.eventId });
    try {
      await this.dependencies.petCompanion.refresh();
    } catch {
      this.recover(event.eventId, 'pet_base_unavailable');
      return;
    }
    if (this.disposed) return;
    const base = this.dependencies.petCompanion.getSnapshot();
    if (base.status !== 'ready') {
      this.recover(event.eventId, 'pet_base_unavailable');
      return;
    }
    if (base.activeSessionId !== null) {
      this.recover(event.eventId, 'conflicting_committed_truth');
      return;
    }

    const delivered = this.dependencies.petTerminalFeedback.requestFreshTransition(
      {
        sessionId: event.sessionId,
        committedAtMs: event.resolvedAt,
        sessionType: 'focus',
        focusVariant: 'onboarding_trial',
        mode: 'relax',
        terminalStatus: 'completed',
        rewardCommitted: true,
      },
      {
        currentResultSessionId: event.sessionId,
        activeSessionId: base.activeSessionId,
      },
    );

    if (
      delivered.accepted ||
      delivered.reason === 'duplicate_terminal_transition' ||
      delivered.reason === 'stale_terminal_transition' ||
      delivered.reason === 'terminal_result_has_no_pet_feedback'
    ) {
      this.publish({ status: 'delivered', eventId: event.eventId });
      this.dependencies.completion.discardFreshEvent();
      return;
    }
    this.recover(
      event.eventId,
      delivered.reason === 'feedback_runtime_unavailable'
        ? 'feedback_runtime_unavailable'
        : 'conflicting_committed_truth',
    );
  }

  private recover(
    eventId: string,
    reason: Extract<
      OnboardingTrialPetFeedbackBridgeProjection,
      { readonly status: 'recovery' }
    >['reason'],
  ): void {
    this.publish({ status: 'recovery', eventId, reason });
  }

  private publish(projection: OnboardingTrialPetFeedbackBridgeProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
