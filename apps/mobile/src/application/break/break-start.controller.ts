import type { RunningSessionRecord } from '@pixeldoro/application';

export type BreakStartUiErrorCode =
  | 'SOURCE_UNAVAILABLE'
  | 'ACTIVE_SESSION'
  | 'START_UNAVAILABLE';

export type BreakStartResult =
  | { readonly ok: true; readonly session: RunningSessionRecord }
  | { readonly ok: false; readonly error: { readonly code: BreakStartUiErrorCode } };

export type BreakStartProjection =
  | { readonly status: 'idle'; readonly sourceSessionId: string | null }
  | { readonly status: 'submitting'; readonly sourceSessionId: string }
  | {
      readonly status: 'committed';
      readonly sourceSessionId: string;
      readonly breakSessionId: string;
    }
  | {
      readonly status: 'error';
      readonly sourceSessionId: string;
      readonly error: { readonly code: BreakStartUiErrorCode };
    };

export interface BreakStartControllerDependencies {
  readonly start: (sourceSessionId: string) => Promise<BreakStartResult>;
  readonly afterCommitted?: (session: RunningSessionRecord) => Promise<void>;
}

export class BreakStartController {
  private projection: BreakStartProjection = { status: 'idle', sourceSessionId: null };
  private readonly listeners = new Set<() => void>();
  private operation: { sourceSessionId: string; promise: Promise<BreakStartResult> } | undefined;
  private generation = 0;
  private disposed = false;

  constructor(private readonly dependencies: BreakStartControllerDependencies) {}

  getSnapshot = (): BreakStartProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  start = (sourceSessionId: string): Promise<BreakStartResult> => {
    if (this.disposed) {
      return Promise.resolve({ ok: false, error: { code: 'START_UNAVAILABLE' } });
    }
    if (this.operation !== undefined) {
      return this.operation.sourceSessionId === sourceSessionId
        ? this.operation.promise
        : Promise.resolve({ ok: false, error: { code: 'START_UNAVAILABLE' } });
    }
    const generation = ++this.generation;
    this.publish({ status: 'submitting', sourceSessionId });
    const promise = this.runStart(sourceSessionId, generation);
    this.operation = { sourceSessionId, promise };
    void promise.finally(() => {
      if (this.operation?.promise === promise) this.operation = undefined;
    });
    return promise;
  };

  reset = (): void => {
    if (this.disposed || this.operation !== undefined) return;
    this.generation += 1;
    this.publish({ status: 'idle', sourceSessionId: null });
  };

  dispose(): void {
    this.disposed = true;
    this.generation += 1;
    this.listeners.clear();
  }

  private async runStart(
    sourceSessionId: string,
    generation: number,
  ): Promise<BreakStartResult> {
    let result: BreakStartResult;
    try {
      result = await this.dependencies.start(sourceSessionId);
    } catch {
      result = { ok: false, error: { code: 'START_UNAVAILABLE' } };
    }
    if (result.ok) {
      try {
        await this.dependencies.afterCommitted?.(result.session);
      } catch {
        // The durable commit is final; Pet/read recovery must never retry Start.
      }
    }
    if (this.disposed || generation !== this.generation) return result;
    if (result.ok) {
      this.publish({
        status: 'committed',
        sourceSessionId,
        breakSessionId: result.session.id,
      });
    } else {
      this.publish({ status: 'error', sourceSessionId, error: result.error });
    }
    return result;
  }

  private publish(projection: BreakStartProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
