import type { AppLifecycleState } from '../ports/app-lifecycle.port';

export class AppVisibilityController {
  private state: AppLifecycleState;
  private readonly listeners = new Set<() => void>();
  private disposed = false;

  constructor(initialState: AppLifecycleState) {
    this.state = initialState;
  }

  getSnapshot = (): AppLifecycleState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  publish(state: AppLifecycleState): void {
    if (this.disposed || state === this.state) return;
    this.state = state;
    for (const listener of this.listeners) listener();
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }
}
