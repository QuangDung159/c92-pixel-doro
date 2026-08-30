import type { PersistenceResult } from '@pixeldoro/application';

export interface InstallationRecord {
  readonly id: 1;
  readonly installedAt: number;
  readonly onboardingCompletedAt: number | null;
  readonly anonymousAnalyticsId: string | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface InstallationRepository {
  find(): Promise<PersistenceResult<InstallationRecord | null>>;
  setOnboardingCompleted(
    completedAt: number,
    updatedAt: number,
  ): Promise<PersistenceResult<'updated' | 'not_updated'>>;
  setAnonymousAnalyticsId(
    anonymousAnalyticsId: string | null,
    updatedAt: number,
  ): Promise<PersistenceResult<'updated' | 'not_updated'>>;
}
