import type { ApplicationResult } from '@pixeldoro/application';

export type BootstrapDefaultMode = 'relax' | 'strict';

export interface BootstrapDurableSnapshot {
  readonly migrationVersion: number;
  readonly installation: {
    readonly installedAt: number;
    readonly onboardingCompletedAt: number | null;
  };
  readonly settings: {
    readonly focusDurationMinutes: number;
    readonly shortBreakMinutes: number;
    readonly longBreakMinutes: number;
    readonly defaultMode: BootstrapDefaultMode;
    readonly soundEnabled: boolean;
    readonly hapticsEnabled: boolean;
    readonly notificationsEnabled: boolean;
    readonly analyticsEnabled: boolean;
  };
  readonly profile: {
    readonly totalXp: number;
    readonly coinBalance: number;
  };
  readonly catalog: readonly {
    readonly id: string;
    readonly displayName: string;
    readonly category: 'furniture';
    readonly priceCoins: number;
    readonly catalogVersion: number;
  }[];
}

export type BootstrapDataErrorCode =
  | 'DATABASE_READ_FAILED'
  | 'BOOTSTRAP_DATA_INVALID';

export interface BootstrapDataError {
  readonly kind: 'bootstrap_data_error';
  readonly code: BootstrapDataErrorCode;
}

export const bootstrapDataError = (
  code: BootstrapDataErrorCode,
): BootstrapDataError => ({
  kind: 'bootstrap_data_error',
  code,
});

export interface BootstrapDataPort {
  read(): Promise<ApplicationResult<BootstrapDurableSnapshot, BootstrapDataError>>;
}
