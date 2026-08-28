import type {
  AppLifecyclePort,
  AppLifecycleState,
} from '@/application';

export class NoopAppLifecycleAdapter implements AppLifecyclePort {
  private listeners = new Set<(state: AppLifecycleState) => void>();

  getCurrentState(): AppLifecycleState {
    return 'active';
  }

  subscribe(listener: (state: AppLifecycleState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitForTest(state: AppLifecycleState): void {
    this.listeners.forEach((listener) => listener(state));
  }
}
