import type {
  LoadStandardFocusCancelledResultUseCase,
  StandardFocusCancelledResult,
} from '@pixeldoro/application';

export type StandardFocusResultProjection =
  | { readonly status: 'idle' | 'loading' }
  | { readonly status: 'ready'; readonly result: StandardFocusCancelledResult }
  | { readonly status: 'missing' }
  | {
      readonly status: 'error';
      readonly error: {
        readonly code:
          | 'STANDARD_FOCUS_RESULT_READ_FAILED'
          | 'STANDARD_FOCUS_RESULT_INCONSISTENT';
      };
    };

export class StandardFocusResultController {
  private projection: StandardFocusResultProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private generation = 0;
  private disposed = false;

  constructor(private readonly loadResult: LoadStandardFocusCancelledResultUseCase) {}

  getSnapshot = (): StandardFocusResultProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  refresh = async (sessionId: string): Promise<void> => {
    if (this.disposed) return;
    const generation = ++this.generation;
    this.publish({ status: 'loading' });
    const loaded = await this.loadResult.execute(sessionId);
    if (this.disposed || generation !== this.generation) return;
    if (!loaded.ok) {
      this.publish({ status: 'error', error: { code: loaded.error.code } });
    } else if (loaded.value.outcome === 'missing') {
      this.publish({ status: 'missing' });
    } else {
      this.publish({ status: 'ready', result: loaded.value.result });
    }
  };

  dispose(): void {
    this.disposed = true;
    this.generation += 1;
    this.listeners.clear();
  }

  private publish(projection: StandardFocusResultProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
