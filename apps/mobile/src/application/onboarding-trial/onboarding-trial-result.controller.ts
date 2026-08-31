import {
  type LoadOnboardingTrialResultUseCase,
  type OnboardingTrialCommittedResult,
} from '@pixeldoro/application';

export type OnboardingTrialResultProjection =
  | { readonly status: 'idle' | 'loading' }
  | { readonly status: 'ready'; readonly result: OnboardingTrialCommittedResult }
  | { readonly status: 'missing' }
  | {
      readonly status: 'error';
      readonly error: {
        readonly code:
          | 'ONBOARDING_TRIAL_RESULT_READ_FAILED'
          | 'ONBOARDING_TRIAL_RESULT_INCONSISTENT';
      };
    };

export class OnboardingTrialResultController {
  private projection: OnboardingTrialResultProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private operation: Promise<void> | undefined;
  private generation = 0;
  private disposed = false;

  constructor(private readonly loadResult: LoadOnboardingTrialResultUseCase) {}

  getSnapshot = (): OnboardingTrialResultProjection => this.projection;

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
    const loaded = await this.loadResult.execute();
    if (this.disposed || generation !== this.generation) return;
    if (!loaded.ok) {
      this.publish({ status: 'error', error: { code: loaded.error.code } });
    } else if (loaded.value.outcome === 'missing') {
      this.publish({ status: 'missing' });
    } else {
      this.publish({ status: 'ready', result: loaded.value.result });
    }
  }

  private publish(projection: OnboardingTrialResultProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
