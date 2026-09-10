export type StandardFocusNotificationDestination =
  | { readonly status: 'idle' }
  | {
      readonly status: 'pending';
      readonly destination: 'home' | 'running' | 'result';
      readonly sessionId: string;
      readonly requestId: number;
      readonly flow?: 'break';
    };

export class StandardFocusNotificationNavigationController {
  private projection: StandardFocusNotificationDestination = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private requestId = 0;
  private disposed = false;

  getSnapshot = (): StandardFocusNotificationDestination => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  publish(
    destination: 'home' | 'running' | 'result',
    sessionId: string,
    flow?: 'break',
  ): void {
    if (this.disposed || sessionId.trim().length === 0) return;
    this.requestId += 1;
    this.projection = Object.freeze({
      status: 'pending',
      destination,
      sessionId,
      requestId: this.requestId,
      ...(flow === undefined ? {} : { flow }),
    });
    for (const listener of this.listeners) listener();
  }

  consume(requestId: number): void {
    if (
      this.disposed ||
      this.projection.status !== 'pending' ||
      this.projection.requestId !== requestId
    ) return;
    this.projection = { status: 'idle' };
    for (const listener of this.listeners) listener();
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
    this.projection = { status: 'idle' };
  }
}
