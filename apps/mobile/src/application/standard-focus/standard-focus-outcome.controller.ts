export type StandardFocusOutcomeProjection =
  | { readonly status: 'idle' }
  | {
      readonly status: 'failed';
      readonly sessionId: string;
      readonly resolvedAt: number;
    };

export class StandardFocusOutcomeController {
  private projection: StandardFocusOutcomeProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private disposed = false;

  getSnapshot = (): StandardFocusOutcomeProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  publishFreshFailure = (sessionId: string, resolvedAt: number): void => {
    if (
      this.disposed ||
      sessionId.trim().length === 0 ||
      !Number.isSafeInteger(resolvedAt) ||
      resolvedAt < 0
    ) return;
    this.publish(Object.freeze({ status: 'failed', sessionId, resolvedAt }));
  };

  consume = (sessionId: string): void => {
    if (
      !this.disposed &&
      this.projection.status === 'failed' &&
      this.projection.sessionId === sessionId
    ) this.publish({ status: 'idle' });
  };

  reset = (): void => {
    if (!this.disposed) this.publish({ status: 'idle' });
  };

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }

  private publish(projection: StandardFocusOutcomeProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
