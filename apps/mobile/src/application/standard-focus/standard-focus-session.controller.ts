import {
  isRunningStandardFocus,
  projectRemainingTime,
  type ClockPort,
  type FocusMode,
  type RunningSessionRecord,
  type SessionRepository,
  type WorkTag,
} from '@pixeldoro/application';

import type { TickScheduler } from '../ports/tick-scheduler.port';

export type StandardFocusSessionErrorCode =
  | 'STANDARD_FOCUS_READ_FAILED'
  | 'STANDARD_FOCUS_STATE_INVALID';

interface StandardFocusReadyBase {
  readonly status: 'ready';
  readonly sessionId: string;
  readonly durationMinutes: number;
  readonly mode: FocusMode;
  readonly workTag: WorkTag;
  readonly startedAt: number;
  readonly endsAt: number;
}

export type StandardFocusSessionProjection =
  | { readonly status: 'idle' | 'loading' }
  | (StandardFocusReadyBase & {
      readonly phase: 'running';
      readonly mode: 'relax';
      readonly remainingMs: number;
      readonly displaySeconds: number;
    })
  | (StandardFocusReadyBase & {
      readonly phase: 'deadline_pending';
      readonly mode: 'relax';
      readonly remainingMs: 0;
      readonly displaySeconds: 0;
    })
  | (StandardFocusReadyBase & {
      readonly phase: 'strict_handoff';
      readonly mode: 'strict';
    })
  | { readonly status: 'missing' }
  | {
      readonly status: 'error';
      readonly error: { readonly code: StandardFocusSessionErrorCode };
    };

export interface StandardFocusSessionControllerDependencies {
  readonly clock: ClockPort;
  readonly scheduler: TickScheduler;
  readonly sessions: Pick<SessionRepository, 'findActive'>;
  readonly appInitiallyVisible?: boolean;
}

export class StandardFocusSessionController {
  private projection: StandardFocusSessionProjection = { status: 'idle' };
  private session: RunningSessionRecord | null = null;
  private readonly listeners = new Set<() => void>();
  private operation: Promise<void> | undefined;
  private cancelTick: (() => void) | undefined;
  private generation = 0;
  private routeActive = false;
  private appVisible: boolean;
  private disposed = false;

  constructor(private readonly dependencies: StandardFocusSessionControllerDependencies) {
    this.appVisible = dependencies.appInitiallyVisible ?? true;
  }

  getSnapshot = (): StandardFocusSessionProjection => this.projection;

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

  refresh = (): Promise<void> => {
    if (this.disposed) return Promise.resolve();
    if (this.operation !== undefined) return this.operation;
    const generation = ++this.generation;
    if (this.projection.status === 'idle') this.publish({ status: 'loading' });
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
    this.stopTick();
    this.listeners.clear();
  }

  private async load(generation: number): Promise<void> {
    try {
      const result = await this.dependencies.sessions.findActive();
      if (!this.isCurrent(generation)) return;
      if (!result.ok) return this.publishError('STANDARD_FOCUS_READ_FAILED');
      const active = result.value;
      if (active === null || active.focusVariant !== 'standard') {
        this.session = null;
        this.stopTick();
        this.publish({ status: 'missing' });
        return;
      }
      if (!isRunningStandardFocus(active)) {
        this.session = null;
        this.stopTick();
        this.publishError('STANDARD_FOCUS_STATE_INVALID');
        return;
      }
      this.session = active;
      this.projectNow();
    } catch {
      if (this.isCurrent(generation)) this.publishError('STANDARD_FOCUS_READ_FAILED');
    }
  }

  private projectNow(): void {
    if (this.session === null || this.disposed) return;
    const base = {
      status: 'ready' as const,
      sessionId: this.session.id,
      durationMinutes: this.session.configuredDurationMinutes,
      workTag: this.session.workTag!,
      startedAt: this.session.startedAt,
      endsAt: this.session.endsAt,
    };
    if (this.session.mode === 'strict') {
      this.stopTick();
      this.publish({ ...base, phase: 'strict_handoff', mode: 'strict' });
      return;
    }
    const remaining = projectRemainingTime(
      this.session.endsAt,
      this.dependencies.clock.nowMs(),
    );
    if (remaining.phase === 'invalid') {
      this.publishError('STANDARD_FOCUS_STATE_INVALID');
      return;
    }
    this.publish({ ...base, ...remaining, mode: 'relax' });
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

  private isCurrent(generation: number): boolean {
    return !this.disposed && generation === this.generation;
  }

  private publishError(code: StandardFocusSessionErrorCode): void {
    this.session = null;
    this.stopTick();
    this.publish({ status: 'error', error: { code } });
  }

  private publish(projection: StandardFocusSessionProjection): void {
    if (this.disposed) return;
    this.projection = Object.freeze(projection);
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Presentation subscribers cannot change durable session truth.
      }
    }
  }
}
