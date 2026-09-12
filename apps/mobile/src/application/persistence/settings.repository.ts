import type { PersistenceResult } from '@pixeldoro/application';

export type AppDefaultMode = 'relax' | 'strict';

export interface AppSettingsRecord {
  readonly id: 1;
  readonly focusDurationMinutes: number;
  readonly shortBreakMinutes: 5;
  readonly longBreakMinutes: 15;
  readonly defaultMode: AppDefaultMode;
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
  readonly notificationsEnabled: boolean;
  readonly analyticsEnabled: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ReplaceAppSettingsInput {
  readonly focusDurationMinutes: number;
  readonly shortBreakMinutes: 5;
  readonly longBreakMinutes: 15;
  readonly defaultMode: AppDefaultMode;
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
  readonly notificationsEnabled: boolean;
  readonly analyticsEnabled: boolean;
  readonly updatedAt: number;
}

export type AppSettingsPatch = Partial<Pick<
  AppSettingsRecord,
  | 'focusDurationMinutes'
  | 'defaultMode'
  | 'soundEnabled'
  | 'hapticsEnabled'
  | 'notificationsEnabled'
  | 'analyticsEnabled'
>> & {
  readonly updatedAt: number;
};

export interface AppSettingsRepository {
  find(): Promise<PersistenceResult<AppSettingsRecord | null>>;
  patch(
    input: AppSettingsPatch,
  ): Promise<PersistenceResult<'updated' | 'not_updated'>>;
  replace(
    input: ReplaceAppSettingsInput,
  ): Promise<PersistenceResult<'updated' | 'not_updated'>>;
}
