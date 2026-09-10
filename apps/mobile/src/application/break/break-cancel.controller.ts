import type { ApplicationResult, CancelBreakError, CancelBreakOutcome } from '@pixeldoro/application';

export type BreakCancelProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting'; readonly sessionId: string }
  | { readonly status: 'error'; readonly code: 'CANCEL_UNAVAILABLE' | 'STATE_INVALID' };

export type BreakCancelResult =
  | { readonly ok: true; readonly sessionId: string;
      readonly terminalStatus: 'completed' | 'cancelled' }
  | { readonly ok: false };

export interface BreakCancelControllerDependencies {
  cancel(sessionId: string): Promise<ApplicationResult<CancelBreakOutcome, CancelBreakError>>;
  afterCommitted(sessionId: string): Promise<void>;
}

export class BreakCancelController {
  private projection: BreakCancelProjection = { status: 'idle' };
  private operation: Promise<BreakCancelResult> | undefined;
  private operationSessionId: string | undefined;
  private readonly listeners = new Set<() => void>();
  private disposed = false;

  constructor(private readonly dependencies: BreakCancelControllerDependencies) {}
  getSnapshot = (): BreakCancelProjection => this.projection;
  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener); return () => this.listeners.delete(listener);
  };
  cancel = (sessionId: string): Promise<BreakCancelResult> => {
    if (this.disposed) return Promise.resolve({ ok: false });
    if (this.operation !== undefined) return this.operationSessionId === sessionId
      ? this.operation : Promise.resolve({ ok: false });
    this.publish({ status: 'submitting', sessionId });
    const operation = this.execute(sessionId);
    this.operation = operation; this.operationSessionId = sessionId;
    void operation.finally(() => {
      if (this.operation === operation) {
        this.operation = undefined; this.operationSessionId = undefined;
      }
    });
    return operation;
  };
  reset = (): void => {
    if (!this.disposed && this.operation === undefined) this.publish({ status: 'idle' });
  };
  dispose(): void { this.disposed = true; this.listeners.clear(); }

  private async execute(sessionId: string): Promise<BreakCancelResult> {
    try {
      const result = await this.dependencies.cancel(sessionId);
      if (this.disposed) return { ok: false };
      if (!result.ok) {
        this.publish({ status: 'error', code: result.error.code === 'BREAK_CANCEL_STATE_INVALID'
          ? 'STATE_INVALID' : 'CANCEL_UNAVAILABLE' });
        return { ok: false };
      }
      await this.dependencies.afterCommitted(result.value.sessionId).catch(() => undefined);
      if (!this.disposed) this.publish({ status: 'idle' });
      return { ok: true, sessionId: result.value.sessionId,
        terminalStatus: result.value.outcome };
    } catch {
      if (!this.disposed) this.publish({ status: 'error', code: 'CANCEL_UNAVAILABLE' });
      return { ok: false };
    }
  }
  private publish(projection: BreakCancelProjection): void {
    if (this.disposed) return;
    this.projection = Object.freeze(projection);
    for (const listener of this.listeners) listener();
  }
}
