export type BreakOutcomeProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'completed'; readonly sessionId: string; readonly resolvedAt: number };

export class BreakOutcomeController {
  private projection: BreakOutcomeProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private disposed = false;

  getSnapshot = (): BreakOutcomeProjection => this.projection;
  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  publishCompleted(sessionId: string, resolvedAt: number): void {
    if (!this.disposed) this.publish(Object.freeze({ status: 'completed', sessionId, resolvedAt }));
  }
  reset(): void { if (!this.disposed) this.publish({ status: 'idle' }); }
  dispose(): void { this.disposed = true; this.listeners.clear(); }
  private publish(projection: BreakOutcomeProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
