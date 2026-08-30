import {
  loadPetCompanionProjection,
  type PetCompanionProjection,
  type PetCompanionSessionReader,
} from './load-pet-companion.projection';

const loadingProjection = (): PetCompanionProjection =>
  Object.freeze({ status: 'loading' });

export class PetCompanionController {
  private projection: PetCompanionProjection = loadingProjection();
  private readonly listeners = new Set<() => void>();
  private refreshPromise: Promise<void> | undefined;
  private generation = 0;
  private disposed = false;

  constructor(private readonly sessions: PetCompanionSessionReader) {}

  getSnapshot = (): PetCompanionProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  refresh(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    if (this.refreshPromise !== undefined) return this.refreshPromise;

    const generation = ++this.generation;
    this.publish(loadingProjection());
    const operation = loadPetCompanionProjection(this.sessions).then((projection) => {
      if (!this.disposed && generation === this.generation) {
        this.publish(projection);
      }
    });
    this.refreshPromise = operation;
    void operation.finally(() => {
      if (this.refreshPromise === operation) this.refreshPromise = undefined;
    });
    return operation;
  }

  dispose(): void {
    this.disposed = true;
    this.generation += 1;
    this.listeners.clear();
  }

  private publish(projection: PetCompanionProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
