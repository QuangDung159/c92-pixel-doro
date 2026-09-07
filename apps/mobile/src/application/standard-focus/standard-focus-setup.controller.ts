import type {
  FocusMode,
  RunningSessionRecord,
  WorkTag,
} from '@pixeldoro/application';
import { validateStandardFocusConfiguration } from '@pixeldoro/domain';

export const DEFAULT_STANDARD_FOCUS_CONFIGURATION = Object.freeze({
  durationMinutes: 25,
  mode: 'relax' as const,
  workTag: 'coding' as const,
});

export type StandardFocusSetupErrorCode =
  | 'INVALID_CONFIGURATION'
  | 'ACTIVE_SESSION'
  | 'START_UNAVAILABLE'
  | 'COMMITTED_HANDOFF_UNAVAILABLE';

export interface StandardFocusSetupConfiguration {
  readonly durationMinutes: number;
  readonly mode: FocusMode;
  readonly workTag: WorkTag;
}

export type StandardFocusSetupProjection = {
  readonly configuration: StandardFocusSetupConfiguration;
  readonly command:
    | { readonly status: 'idle' }
    | { readonly status: 'submitting' }
    | {
        readonly status: 'error';
        readonly error: { readonly code: StandardFocusSetupErrorCode };
      };
};

export type StandardFocusSetupStartResult =
  | { readonly ok: true; readonly session: RunningSessionRecord }
  | {
      readonly ok: false;
      readonly error: { readonly code: StandardFocusSetupErrorCode };
    };

export interface StandardFocusSetupControllerDependencies {
  readonly start: (
    configuration: StandardFocusSetupConfiguration,
  ) => Promise<StandardFocusSetupStartResult>;
}

const initialProjection = (): StandardFocusSetupProjection => ({
  configuration: DEFAULT_STANDARD_FOCUS_CONFIGURATION,
  command: { status: 'idle' },
});

export class StandardFocusSetupController {
  private projection = initialProjection();
  private readonly listeners = new Set<() => void>();
  private operation: Promise<StandardFocusSetupStartResult> | undefined;
  private disposed = false;

  constructor(private readonly dependencies: StandardFocusSetupControllerDependencies) {}

  getSnapshot = (): StandardFocusSetupProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setDuration = (durationMinutes: number): void => {
    this.setConfiguration({ ...this.projection.configuration, durationMinutes });
  };

  setMode = (mode: FocusMode): void => {
    this.setConfiguration({ ...this.projection.configuration, mode });
  };

  setWorkTag = (workTag: WorkTag): void => {
    this.setConfiguration({ ...this.projection.configuration, workTag });
  };

  reset = (): void => {
    if (this.disposed || this.operation !== undefined) return;
    this.publish(initialProjection());
  };

  start = (): Promise<StandardFocusSetupStartResult> => {
    if (this.disposed) {
      return Promise.resolve({ ok: false, error: { code: 'START_UNAVAILABLE' } });
    }
    if (this.operation !== undefined) return this.operation;
    const configuration = this.projection.configuration;
    if (!validateStandardFocusConfiguration(configuration).ok) {
      const result = { ok: false as const, error: { code: 'INVALID_CONFIGURATION' as const } };
      this.publish({ configuration, command: { status: 'error', error: result.error } });
      return Promise.resolve(result);
    }
    this.publish({ configuration, command: { status: 'submitting' } });
    const operation = this.runStart(configuration);
    this.operation = operation;
    void operation.finally(() => {
      if (this.operation === operation) this.operation = undefined;
    });
    return operation;
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.listeners.clear();
  }

  private async runStart(
    configuration: StandardFocusSetupConfiguration,
  ): Promise<StandardFocusSetupStartResult> {
    let result: StandardFocusSetupStartResult;
    try {
      result = await this.dependencies.start(configuration);
    } catch {
      result = { ok: false, error: { code: 'START_UNAVAILABLE' } };
    }
    if (this.disposed) return result;
    if (result.ok) {
      this.publish(initialProjection());
    } else {
      this.publish({ configuration, command: { status: 'error', error: result.error } });
    }
    return result;
  }

  private setConfiguration(configuration: StandardFocusSetupConfiguration): void {
    if (this.disposed || this.operation !== undefined) return;
    if (!validateStandardFocusConfiguration(configuration).ok) return;
    this.publish({ configuration: Object.freeze(configuration), command: { status: 'idle' } });
  }

  private publish(projection: StandardFocusSetupProjection): void {
    if (this.disposed) return;
    this.projection = projection;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Presentation subscribers cannot alter the draft or command outcome.
      }
    }
  }
}
