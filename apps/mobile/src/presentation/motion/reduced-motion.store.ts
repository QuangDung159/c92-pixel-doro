export interface ReducedMotionSource {
  read(): Promise<boolean>;
  subscribe(listener: (enabled: boolean) => void): () => void;
}

export class ReducedMotionStore {
  private enabled = true;
  private readonly listeners = new Set<() => void>();
  private readonly unsubscribe: () => void;
  private sourceRevision = 0;
  private disposed = false;

  constructor(source: ReducedMotionSource) {
    this.unsubscribe = source.subscribe((enabled) => {
      this.sourceRevision += 1;
      this.publish(enabled);
    });
    const readRevision = this.sourceRevision;
    void source.read().then((enabled) => {
      if (readRevision === this.sourceRevision) this.publish(enabled);
    }).catch(() => undefined);
  }

  getSnapshot = (): boolean => this.enabled;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe();
    this.listeners.clear();
  }

  private publish(enabled: boolean): void {
    if (this.disposed || enabled === this.enabled) return;
    this.enabled = enabled;
    for (const listener of this.listeners) listener();
  }
}
