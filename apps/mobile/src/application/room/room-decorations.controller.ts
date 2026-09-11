import type {
  ApplicationResult,
  EquippedRoomProjection,
  LoadEquippedRoomProjectionError,
} from '@pixeldoro/application';

interface RoomProjectionLoader {
  execute(): Promise<ApplicationResult<EquippedRoomProjection, LoadEquippedRoomProjectionError>>;
}

export type RoomDecorationsControllerProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly room: EquippedRoomProjection;
      readonly refresh: 'idle' | 'refreshing' | 'error';
    }
  | { readonly status: 'error'; readonly code: 'ROOM_READ_FAILED' | 'ROOM_DATA_INVALID' };

export class RoomDecorationsController {
  private projection: RoomDecorationsControllerProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private active = false;
  private disposed = false;
  private generation = 0;
  private loadPromise: Promise<void> | undefined;

  constructor(private readonly loader: RoomProjectionLoader) {}

  getSnapshot = (): RoomDecorationsControllerProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  activate = (): Promise<void> => {
    if (this.disposed) return Promise.resolve();
    if (this.active) return this.loadPromise ?? Promise.resolve();
    this.active = true;
    return this.load(++this.generation);
  };

  deactivate = (): void => {
    if (!this.active || this.disposed) return;
    this.active = false;
    this.generation += 1;
    this.loadPromise = undefined;
    if (this.projection.status === 'ready') {
      this.publish({ ...this.projection, refresh: 'idle' });
    }
  };

  retry = (): Promise<void> => {
    if (!this.active || this.disposed) return Promise.resolve();
    return this.loadPromise ?? this.load(this.generation);
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.active = false;
    this.generation += 1;
    this.loadPromise = undefined;
    this.listeners.clear();
  }

  private load(generation: number): Promise<void> {
    const previous = this.projection.status === 'ready' ? this.projection.room : null;
    this.publish(previous === null
      ? { status: 'loading' }
      : { status: 'ready', room: previous, refresh: 'refreshing' });
    const operation = this.loader.execute().then((result) => {
      if (!this.current(generation)) return;
      if (result.ok) {
        this.publish({ status: 'ready', room: result.value, refresh: 'idle' });
        return;
      }
      const invalid = result.error.code !== 'ROOM_READ_FAILED';
      this.publish(previous === null
        ? { status: 'error', code: invalid ? 'ROOM_DATA_INVALID' : 'ROOM_READ_FAILED' }
        : { status: 'ready', room: previous, refresh: 'error' });
    }).catch(() => {
      if (!this.current(generation)) return;
      this.publish(previous === null
        ? { status: 'error', code: 'ROOM_READ_FAILED' }
        : { status: 'ready', room: previous, refresh: 'error' });
    }).finally(() => {
      if (this.loadPromise === operation) this.loadPromise = undefined;
    });
    this.loadPromise = operation;
    return operation;
  }

  private current(generation: number): boolean {
    return this.active && !this.disposed && this.generation === generation;
  }

  private publish(projection: RoomDecorationsControllerProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Presentation subscribers cannot alter committed room truth.
      }
    });
  }
}
