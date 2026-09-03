import {
  createOnboardingTrialRemainingProjection,
  isRunningOnboardingTrial,
  type ClockPort,
  type RunningSessionRecord,
  type SessionRepository,
} from '@pixeldoro/application';

export interface TrialTickScheduler {
  schedule(callback: () => void, delayMs: number): () => void;
}

export type OnboardingTrialRunningErrorCode = 'ONBOARDING_TRIAL_READ_FAILED';

export type OnboardingTrialRunningProjection =
  | { readonly status: 'idle' | 'loading' }
  | {
      readonly status: 'ready';
      readonly phase: 'running';
      readonly sessionId: string;
      readonly endsAt: number;
      readonly remainingMs: number;
      readonly displaySeconds: number;
    }
  | {
      readonly status: 'ready';
      readonly phase: 'deadline_pending';
      readonly sessionId: string;
      readonly endsAt: number;
      readonly remainingMs: 0;
      readonly displaySeconds: 0;
    }
  | { readonly status: 'missing' }
  | {
      readonly status: 'error';
      readonly error: { readonly code: OnboardingTrialRunningErrorCode };
    };

export interface OnboardingTrialRunningControllerDependencies {
  readonly clock: ClockPort;
  readonly scheduler: TrialTickScheduler;
  readonly sessions: Pick<SessionRepository, 'findActive'>;
  readonly appInitiallyVisible?: boolean;
  readonly onDeadlineReached?: (sessionId: string) => void;
}

export class OnboardingTrialRunningController {
  private projection: OnboardingTrialRunningProjection = { status: 'idle' };
  private session: RunningSessionRecord | null = null;
  private readonly listeners = new Set<() => void>();
  private cancelTick: (() => void) | undefined;
  private generation = 0;
  private routeActive = false;
  private appVisible: boolean;
  private disposed = false;
  private deadlineRequestSessionId: string | null = null;

  constructor(private readonly dependencies: OnboardingTrialRunningControllerDependencies) {
    this.appVisible = dependencies.appInitiallyVisible ?? true;
  }

  getSnapshot = (): OnboardingTrialRunningProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  activate = (): void => {
    if (this.disposed) return;
    this.routeActive = true;
    void this.refresh();
  };

  deactivate = (): void => {
    this.routeActive = false;
    this.stopTick();
  };

  setAppVisible(visible: boolean): void {
    if (this.disposed || visible === this.appVisible) return;
    this.appVisible = visible;
    if (!visible) {
      this.stopTick();
      return;
    }
    if (this.routeActive) void this.refresh();
  }

  refresh = async (): Promise<void> => {
    if (this.disposed) return;
    const generation = ++this.generation;
    if (this.projection.status === 'idle') this.publish({ status: 'loading' });
    let result: Awaited<ReturnType<typeof this.dependencies.sessions.findActive>>;
    try {
      result = await this.dependencies.sessions.findActive();
    } catch {
      if (this.disposed || generation !== this.generation) return;
      this.publishReadError();
      return;
    }
    if (this.disposed || generation !== this.generation) return;
    if (!result.ok) {
      this.publishReadError();
      return;
    }
    if (result.value === null || !isRunningOnboardingTrial(result.value)) {
      this.session = null;
      this.deadlineRequestSessionId = null;
      this.stopTick();
      this.publish({ status: 'missing' });
      return;
    }
    this.session = result.value;
    this.projectNow();
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation += 1;
    this.stopTick();
    this.listeners.clear();
  }

  private projectNow(): void {
    if (this.session === null || this.disposed) return;
    const remaining = createOnboardingTrialRemainingProjection(
      this.session.endsAt,
      this.dependencies.clock.nowMs(),
    );
    this.publish(
      remaining.phase === 'deadline_pending'
        ? {
            status: 'ready',
            phase: 'deadline_pending',
            sessionId: this.session.id,
            endsAt: this.session.endsAt,
            remainingMs: 0,
            displaySeconds: 0,
          }
        : {
            status: 'ready',
            phase: 'running',
            sessionId: this.session.id,
            endsAt: this.session.endsAt,
            remainingMs: remaining.remainingMs,
            displaySeconds: remaining.displaySeconds,
          },
    );
    if (
      remaining.phase === 'deadline_pending' &&
      this.deadlineRequestSessionId !== this.session.id
    ) {
      this.deadlineRequestSessionId = this.session.id;
      this.dependencies.onDeadlineReached?.(this.session.id);
    }
    this.scheduleTick();
  }

  private scheduleTick(): void {
    this.stopTick();
    if (
      !this.routeActive ||
      !this.appVisible ||
      this.projection.status !== 'ready' ||
      this.projection.phase !== 'running'
    ) return;
    const delayMs = Math.min(1_000, this.projection.remainingMs);
    this.cancelTick = this.dependencies.scheduler.schedule(() => {
      this.cancelTick = undefined;
      this.projectNow();
    }, delayMs);
  }

  private stopTick(): void {
    this.cancelTick?.();
    this.cancelTick = undefined;
  }

  private publishReadError(): void {
    this.session = null;
    this.stopTick();
    this.publish({
      status: 'error',
      error: { code: 'ONBOARDING_TRIAL_READ_FAILED' },
    });
  }

  private publish(projection: OnboardingTrialRunningProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Presentation subscribers cannot change durable timer truth.
      }
    }
  }
}
