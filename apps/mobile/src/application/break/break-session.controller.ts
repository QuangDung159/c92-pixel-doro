import {
  projectRemainingTime,
  type BreakSessionProjection as DurableBreakSessionProjection,
  type ClockPort,
  type LoadBreakSessionUseCase,
} from '@pixeldoro/application';

import type { TickScheduler } from '../ports/tick-scheduler.port';

export type BreakSessionProjection =
  | { readonly status: 'idle' | 'loading' }
  | {
      readonly status: 'ready';
      readonly phase: 'running';
      readonly session: Extract<DurableBreakSessionProjection, { status: 'running' }>;
      readonly remainingMs: number;
      readonly displaySeconds: number;
    }
  | {
      readonly status: 'ready';
      readonly phase: 'deadline_pending';
      readonly session: Extract<DurableBreakSessionProjection, { status: 'running' }>;
      readonly remainingMs: 0;
      readonly displaySeconds: 0;
    }
  | {
      readonly status: 'ready';
      readonly phase: 'completed';
      readonly session: Extract<DurableBreakSessionProjection, { status: 'completed' }>;
    }
  | {
      readonly status: 'error';
      readonly code: 'SESSION_UNAVAILABLE' | 'SESSION_READ_FAILED';
    };

export interface BreakSessionControllerDependencies {
  readonly appInitiallyVisible?: boolean;
  readonly clock: ClockPort;
  readonly loader: Pick<LoadBreakSessionUseCase, 'execute'>;
  readonly scheduler: TickScheduler;
  readonly onDeadlineReached?: (sessionId: string) => void;
}

export class BreakSessionController {
  private projection: BreakSessionProjection = { status: 'idle' };
  private durable: DurableBreakSessionProjection | null = null;
  private readonly listeners = new Set<() => void>();
  private operation: Promise<void> | undefined;
  private operationSessionId: string | undefined;
  private cancelTick: (() => void) | undefined;
  private sessionId: string | null = null;
  private deadlineNotifiedSessionId: string | null = null;
  private routeActive = false;
  private appVisible: boolean;
  private generation = 0;
  private disposed = false;

  constructor(private readonly dependencies: BreakSessionControllerDependencies) {
    this.appVisible = dependencies.appInitiallyVisible ?? true;
  }

  getSnapshot = (): BreakSessionProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  activate = (sessionId: string): void => {
    if (this.disposed) return;
    this.routeActive = true;
    if (this.sessionId !== sessionId) this.deadlineNotifiedSessionId = null;
    this.sessionId = sessionId;
    void this.refresh(sessionId);
  };

  deactivate = (): void => {
    this.routeActive = false;
    this.stopTick();
  };

  setAppVisible(visible: boolean): void {
    if (this.disposed || visible === this.appVisible) return;
    this.appVisible = visible;
    if (!visible) this.stopTick();
    else if (this.routeActive && this.sessionId !== null) void this.refresh(this.sessionId);
  }

  refresh = (sessionId = this.sessionId): Promise<void> => {
    if (this.disposed || sessionId === null) return Promise.resolve();
    this.sessionId = sessionId;
    if (this.operation !== undefined && this.operationSessionId === sessionId) {
      return this.operation;
    }
    const generation = ++this.generation;
    if (this.projection.status === 'idle') this.publish({ status: 'loading' });
    const operation = this.load(sessionId, generation);
    this.operation = operation;
    this.operationSessionId = sessionId;
    void operation.finally(() => {
      if (this.operation === operation) {
        this.operation = undefined;
        this.operationSessionId = undefined;
      }
    });
    return operation;
  };

  reset = (): void => {
    if (this.disposed) return;
    this.generation += 1;
    this.sessionId = null;
    this.durable = null;
    this.operation = undefined;
    this.operationSessionId = undefined;
    this.deadlineNotifiedSessionId = null;
    this.stopTick();
    this.publish({ status: 'idle' });
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation += 1;
    this.stopTick();
    this.listeners.clear();
  }

  private async load(sessionId: string, generation: number): Promise<void> {
    try {
      const result = await this.dependencies.loader.execute(sessionId);
      if (!this.isCurrent(generation) || this.sessionId !== sessionId) return;
      if (!result.ok) return this.publishError(result.error.code === 'BREAK_SESSION_INELIGIBLE'
        ? 'SESSION_UNAVAILABLE' : 'SESSION_READ_FAILED');
      this.durable = result.value;
      this.projectNow();
    } catch {
      if (this.isCurrent(generation)) this.publishError('SESSION_READ_FAILED');
    }
  }

  private projectNow(): void {
    if (this.durable === null || this.disposed) return;
    if (this.durable.status === 'completed') {
      this.stopTick();
      this.publish({ status: 'ready', phase: 'completed', session: this.durable });
      return;
    }
    const remaining = projectRemainingTime(this.durable.endsAt, this.dependencies.clock.nowMs());
    if (remaining.phase === 'invalid') return this.publishError('SESSION_UNAVAILABLE');
    this.publish({ status: 'ready', session: this.durable, ...remaining });
    if (remaining.phase === 'deadline_pending' &&
      this.deadlineNotifiedSessionId !== this.durable.sessionId) {
      this.deadlineNotifiedSessionId = this.durable.sessionId;
      this.dependencies.onDeadlineReached?.(this.durable.sessionId);
    }
    this.scheduleTick();
  }

  private scheduleTick(): void {
    this.stopTick();
    if (!this.routeActive || !this.appVisible || this.projection.status !== 'ready' ||
      this.projection.phase !== 'running') return;
    this.cancelTick = this.dependencies.scheduler.schedule(() => {
      this.cancelTick = undefined;
      this.projectNow();
    }, Math.min(1_000, this.projection.remainingMs));
  }

  private stopTick(): void {
    this.cancelTick?.();
    this.cancelTick = undefined;
  }

  private isCurrent(generation: number): boolean {
    return !this.disposed && generation === this.generation;
  }

  private publishError(code: 'SESSION_UNAVAILABLE' | 'SESSION_READ_FAILED'): void {
    this.durable = null;
    this.stopTick();
    this.publish({ status: 'error', code });
  }

  private publish(projection: BreakSessionProjection): void {
    if (this.disposed) return;
    this.projection = Object.freeze(projection);
    for (const listener of this.listeners) {
      try { listener(); } catch { /* Subscribers cannot change durable truth. */ }
    }
  }
}
