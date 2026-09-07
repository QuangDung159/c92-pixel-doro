import type {
  ApplicationResult,
  CancelStandardFocusError,
  CancelStandardFocusOutcome,
} from '@pixeldoro/application';

import type { CommandReadinessError } from '../readiness/readiness-gate';

export type StandardFocusCancelErrorCode =
  | 'DEADLINE_REACHED'
  | 'ALREADY_TERMINAL'
  | 'CANCEL_UNAVAILABLE';

export type StandardFocusCancelProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting'; readonly sessionId: string }
  | { readonly status: 'error'; readonly error: { readonly code: StandardFocusCancelErrorCode } };

export type StandardFocusCancelResult =
  | {
      readonly ok: true;
      readonly sessionId: string;
      readonly terminalStatus: 'cancelled' | 'failed';
    }
  | { readonly ok: false };

export interface StandardFocusCancelControllerDependencies {
  cancel(sessionId: string): Promise<
    ApplicationResult<
      CancelStandardFocusOutcome,
      CancelStandardFocusError | CommandReadinessError
    >
  >;
  refreshPet(): Promise<void>;
  onFreshFailure?(sessionId: string, resolvedAt: number): void;
}

const mapError = (
  error: CancelStandardFocusError | CommandReadinessError,
): StandardFocusCancelErrorCode => {
  if (error.kind === 'cancel_standard_focus_error') {
    if (error.code === 'SESSION_DEADLINE_REACHED') return 'DEADLINE_REACHED';
    if (error.code === 'SESSION_ALREADY_TERMINAL') return 'ALREADY_TERMINAL';
  }
  return 'CANCEL_UNAVAILABLE';
};

export class StandardFocusCancelController {
  private projection: StandardFocusCancelProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private operation: Promise<StandardFocusCancelResult> | undefined;
  private disposed = false;

  constructor(private readonly dependencies: StandardFocusCancelControllerDependencies) {}

  getSnapshot = (): StandardFocusCancelProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  cancel = (sessionId: string): Promise<StandardFocusCancelResult> => {
    if (this.disposed) return Promise.resolve({ ok: false });
    if (this.operation !== undefined) return this.operation;
    this.publish({ status: 'submitting', sessionId });
    const operation = this.execute(sessionId);
    this.operation = operation;
    void operation.finally(() => {
      if (this.operation === operation) this.operation = undefined;
    });
    return operation;
  };

  reset = (): void => {
    if (!this.disposed && this.operation === undefined) this.publish({ status: 'idle' });
  };

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }

  private async execute(sessionId: string): Promise<StandardFocusCancelResult> {
    let result: Awaited<ReturnType<StandardFocusCancelControllerDependencies['cancel']>>;
    try {
      result = await this.dependencies.cancel(sessionId);
    } catch {
      if (!this.disposed) {
        this.publish({ status: 'error', error: { code: 'CANCEL_UNAVAILABLE' } });
      }
      return { ok: false };
    }
    if (this.disposed) return { ok: false };
    if (!result.ok) {
      this.publish({ status: 'error', error: { code: mapError(result.error) } });
      return { ok: false };
    }
    try {
      await this.dependencies.refreshPet().catch(() => undefined);
    } catch {
      // Pet refresh is post-commit and cannot change the cancelled outcome.
    }
    if (
      result.value.outcome === 'failed' &&
      result.value.freshness === 'fresh_commit'
    ) {
      this.dependencies.onFreshFailure?.(
        result.value.sessionId,
        result.value.resolvedAt,
      );
    }
    if (!this.disposed) this.publish({ status: 'idle' });
    return {
      ok: true,
      sessionId: result.value.sessionId,
      terminalStatus: result.value.outcome === 'failed' ? 'failed' : 'cancelled',
    };
  }

  private publish(projection: StandardFocusCancelProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
