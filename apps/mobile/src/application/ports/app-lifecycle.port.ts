export type AppLifecycleState = 'active' | 'background';

export interface AppLifecyclePort {
  subscribe(listener: (state: AppLifecycleState) => void): () => void;
}

