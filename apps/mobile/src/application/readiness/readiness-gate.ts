import type { ApplicationResult } from '@pixeldoro/application';

export interface CommandReadinessError {
  readonly kind: 'command_readiness_error';
  readonly code: 'CORE_COMMANDS_NOT_READY';
}

export interface CommandReadinessPort {
  run<TValue>(work: () => TValue): ApplicationResult<TValue, CommandReadinessError>;
}

export interface ReadinessController {
  close(): void;
  open(): void;
}

const notReady = (): ApplicationResult<never, CommandReadinessError> => ({
  ok: false,
  error: {
    kind: 'command_readiness_error',
    code: 'CORE_COMMANDS_NOT_READY',
  },
});

export class ReadinessGate
  implements CommandReadinessPort, ReadinessController
{
  private ready = false;

  close(): void {
    this.ready = false;
  }

  open(): void {
    this.ready = true;
  }

  run<TValue>(
    work: () => TValue,
  ): ApplicationResult<TValue, CommandReadinessError> {
    if (!this.ready) {
      return notReady();
    }

    return { ok: true, value: work() };
  }
}
