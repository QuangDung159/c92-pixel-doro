export type AppLifecycleState = 'active' | 'background';

export interface AppLifecyclePort {
  getCurrentState(): AppLifecycleState;
  subscribe(listener: (state: AppLifecycleState) => void): () => void;
}
