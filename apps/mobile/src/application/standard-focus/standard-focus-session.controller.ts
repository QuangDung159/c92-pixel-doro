import {
  isRunningStandardFocus,
  type FocusMode,
  type SessionRepository,
  type WorkTag,
} from '@pixeldoro/application';

export type StandardFocusSessionErrorCode =
  | 'STANDARD_FOCUS_READ_FAILED'
  | 'STANDARD_FOCUS_STATE_INVALID';

export type StandardFocusSessionProjection =
  | { readonly status: 'idle' | 'loading' }
  | {
      readonly status: 'ready';
      readonly sessionId: string;
      readonly durationMinutes: number;
      readonly mode: FocusMode;
      readonly workTag: WorkTag;
      readonly startedAt: number;
      readonly endsAt: number;
    }
  | { readonly status: 'missing' }
  | {
      readonly status: 'error';
      readonly error: { readonly code: StandardFocusSessionErrorCode };
    };

export interface StandardFocusSessionControllerDependencies {
  readonly sessions: Pick<SessionRepository, 'findActive'>;
}

export class StandardFocusSessionController {
  private projection: StandardFocusSessionProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private operation: Promise<void> | undefined;
  private generation = 0;
  private disposed = false;

  constructor(private readonly dependencies: StandardFocusSessionControllerDependencies) {}

  getSnapshot = (): StandardFocusSessionProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  refresh = (): Promise<void> => {
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
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation += 1;
    this.listeners.clear();
  }

  private async load(generation: number): Promise<void> {
    try {
      const result = await this.dependencies.sessions.findActive();
      if (!this.isCurrent(generation)) return;
      if (!result.ok) {
        this.publishError('STANDARD_FOCUS_READ_FAILED');
        return;
      }
      const active = result.value;
      if (active === null || active.focusVariant !== 'standard') {
        this.publish({ status: 'missing' });
        return;
      }
      if (!isRunningStandardFocus(active)) {
        this.publishError('STANDARD_FOCUS_STATE_INVALID');
        return;
      }
      this.publish(Object.freeze({
        status: 'ready',
        sessionId: active.id,
        durationMinutes: active.configuredDurationMinutes,
        mode: active.mode,
        workTag: active.workTag,
        startedAt: active.startedAt,
        endsAt: active.endsAt,
      }));
    } catch {
      if (this.isCurrent(generation)) this.publishError('STANDARD_FOCUS_READ_FAILED');
    }
  }

  private isCurrent(generation: number): boolean {
    return !this.disposed && generation === this.generation;
  }

  private publishError(code: StandardFocusSessionErrorCode): void {
    this.publish({ status: 'error', error: { code } });
  }

  private publish(projection: StandardFocusSessionProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Presentation subscribers cannot change durable session truth.
      }
    }
  }
}
