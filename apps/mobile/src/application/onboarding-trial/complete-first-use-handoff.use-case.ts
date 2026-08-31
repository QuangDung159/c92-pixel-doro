import type { ApplicationResult, ClockPort } from '@pixeldoro/application';

import type { InstallationRepository } from '../persistence';

export type CompleteFirstUseHandoffOutcome =
  | {
      readonly outcome: 'completed_fresh';
      readonly completedAt: number;
    }
  | {
      readonly outcome: 'already_completed';
      readonly completedAt: number;
    };

export type CompleteFirstUseHandoffErrorCode =
  | 'ONBOARDING_HANDOFF_TIME_INVALID'
  | 'INSTALLATION_READ_FAILED'
  | 'ONBOARDING_HANDOFF_WRITE_FAILED'
  | 'ONBOARDING_HANDOFF_STATE_INCONSISTENT';

export interface CompleteFirstUseHandoffError {
  readonly kind: 'complete_first_use_handoff_error';
  readonly code: CompleteFirstUseHandoffErrorCode;
}

export interface CompleteFirstUseHandoffDependencies {
  readonly clock: ClockPort;
  readonly installation: Pick<
    InstallationRepository,
    'find' | 'setOnboardingCompleted'
  >;
}

const failure = (
  code: CompleteFirstUseHandoffErrorCode,
): ApplicationResult<never, CompleteFirstUseHandoffError> => ({
  ok: false,
  error: { kind: 'complete_first_use_handoff_error', code },
});

export class CompleteFirstUseHandoffUseCase {
  constructor(private readonly dependencies: CompleteFirstUseHandoffDependencies) {}

  async execute(): Promise<
    ApplicationResult<CompleteFirstUseHandoffOutcome, CompleteFirstUseHandoffError>
  > {
    const completedAt = this.dependencies.clock.nowMs();
    if (!Number.isSafeInteger(completedAt) || completedAt < 0) {
      return failure('ONBOARDING_HANDOFF_TIME_INVALID');
    }

    const installation = await this.readInstallation();
    if (!installation.ok) return installation;
    if (installation.value.onboardingCompletedAt !== null) {
      return {
        ok: true,
        value: {
          outcome: 'already_completed',
          completedAt: installation.value.onboardingCompletedAt,
        },
      };
    }

    try {
      const written = await this.dependencies.installation.setOnboardingCompleted(
        completedAt,
        completedAt,
      );
      if (!written.ok) return failure('ONBOARDING_HANDOFF_WRITE_FAILED');
      if (written.value === 'updated') {
        return {
          ok: true,
          value: { outcome: 'completed_fresh', completedAt },
        };
      }
    } catch {
      return failure('ONBOARDING_HANDOFF_WRITE_FAILED');
    }

    const racedInstallation = await this.readInstallation();
    if (!racedInstallation.ok) return racedInstallation;
    if (racedInstallation.value.onboardingCompletedAt === null) {
      return failure('ONBOARDING_HANDOFF_STATE_INCONSISTENT');
    }
    return {
      ok: true,
      value: {
        outcome: 'already_completed',
        completedAt: racedInstallation.value.onboardingCompletedAt,
      },
    };
  }

  private async readInstallation() {
    try {
      const installation = await this.dependencies.installation.find();
      if (!installation.ok) return failure('INSTALLATION_READ_FAILED');
      if (installation.value === null || installation.value.id !== 1) {
        return failure('ONBOARDING_HANDOFF_STATE_INCONSISTENT');
      }
      return { ok: true as const, value: installation.value };
    } catch {
      return failure('INSTALLATION_READ_FAILED');
    }
  }
}
