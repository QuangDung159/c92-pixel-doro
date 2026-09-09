import type {
  BreakRecommendation,
  LoadNextBreakRecommendationErrorCode,
  LoadNextBreakRecommendationUseCase,
} from '@pixeldoro/application';

type BreakRecommendationLoader = Pick<
  LoadNextBreakRecommendationUseCase,
  'execute'
>;

export type BreakRecommendationProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly sourceSessionId: string }
  | {
      readonly status: 'ready';
      readonly sourceSessionId: string;
      readonly recommendation: BreakRecommendation;
    }
  | {
      readonly status: 'error';
      readonly sourceSessionId: string;
      readonly error: { readonly code: LoadNextBreakRecommendationErrorCode };
    };

export class BreakRecommendationController {
  private projection: BreakRecommendationProjection = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private generation = 0;
  private disposed = false;
  private inFlight:
    | { readonly sourceSessionId: string; readonly promise: Promise<void> }
    | undefined;

  constructor(private readonly loadRecommendation: BreakRecommendationLoader) {}

  getSnapshot = (): BreakRecommendationProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  refresh = (sourceSessionId: string): Promise<void> => {
    if (this.disposed) return Promise.resolve();
    if (this.inFlight?.sourceSessionId === sourceSessionId) {
      return this.inFlight.promise;
    }

    const generation = ++this.generation;
    this.publish({ status: 'loading', sourceSessionId });
    const promise = this.loadRecommendation.execute(sourceSessionId)
      .then((loaded) => {
        if (this.disposed || generation !== this.generation) return;
        if (!loaded.ok) {
          this.publish({
            status: 'error',
            sourceSessionId,
            error: { code: loaded.error.code },
          });
          return;
        }
        this.publish({
          status: 'ready',
          sourceSessionId: loaded.value.sourceSessionId,
          recommendation: loaded.value.recommendation,
        });
      })
      .finally(() => {
        if (this.inFlight?.promise === promise) this.inFlight = undefined;
      });
    this.inFlight = { sourceSessionId, promise };
    return promise;
  };

  reset = (): void => {
    if (this.disposed) return;
    this.generation += 1;
    this.inFlight = undefined;
    this.publish({ status: 'idle' });
  };

  dispose(): void {
    this.disposed = true;
    this.generation += 1;
    this.inFlight = undefined;
    this.listeners.clear();
  }

  private publish(projection: BreakRecommendationProjection): void {
    this.projection = projection;
    for (const listener of this.listeners) listener();
  }
}
