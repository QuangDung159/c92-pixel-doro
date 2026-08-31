import type {
  PetPlaybackDriver,
  PetPlaybackDriverCallbacks,
  PetPlaybackHandle,
  PetPlaybackReconcileInput,
} from './pet-playback.driver';

interface ActivePlayback {
  readonly key: string;
  readonly generation: number;
  readonly handle: PetPlaybackHandle;
}

const playbackKey = (input: PetPlaybackReconcileInput): string =>
  `${input.playbackId}:${input.entry.assetId}:${input.visualMode}`;

export class PetPlaybackController {
  private active: ActivePlayback | undefined;
  private completedKey: string | undefined;
  private callbacks: PetPlaybackDriverCallbacks = {
    onComplete: () => undefined,
    onFailure: () => undefined,
  };
  private generation = 0;
  private disposed = false;

  constructor(private readonly driver: PetPlaybackDriver) {}

  reconcile(
    input: PetPlaybackReconcileInput,
    callbacks: PetPlaybackDriverCallbacks,
  ): void {
    if (this.disposed) return;
    this.callbacks = callbacks;
    if (
      !input.isVisible ||
      input.reduceMotion ||
      input.visualMode === 'still'
    ) {
      this.stop();
      return;
    }

    const key = playbackKey(input);
    if (this.active?.key === key || this.completedKey === key) return;
    this.stop();
    const generation = ++this.generation;
    let failedSynchronously = false;
    try {
      const handle = this.driver.start(input.entry, {
        onComplete: () => this.complete(generation),
        onFailure: () => {
          failedSynchronously = true;
          this.fail(generation);
        },
      });
      if (!failedSynchronously && generation === this.generation) {
        this.active = { key, generation, handle };
      } else {
        handle.cancel();
      }
    } catch {
      this.fail(generation);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
  }

  private complete(generation: number): void {
    if (
      this.disposed ||
      this.active?.generation !== generation
    ) return;
    const key = this.active.key;
    this.active = undefined;
    this.completedKey = key;
    this.generation += 1;
    this.callbacks.onComplete();
  }

  private fail(generation: number): void {
    if (this.disposed || generation !== this.generation) return;
    const handle = this.active?.generation === generation
      ? this.active.handle
      : undefined;
    this.active = undefined;
    this.completedKey = undefined;
    handle?.cancel();
    this.generation += 1;
    this.callbacks.onFailure();
  }

  private stop(): void {
    const handle = this.active?.handle;
    this.active = undefined;
    this.completedKey = undefined;
    this.generation += 1;
    handle?.cancel();
  }
}
