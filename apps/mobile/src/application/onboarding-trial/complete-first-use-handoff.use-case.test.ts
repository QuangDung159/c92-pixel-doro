import { describe, expect, it, vi } from 'vitest';
import { persistenceError } from '@pixeldoro/application';

import type { InstallationRecord, InstallationRepository } from '../persistence';
import { CompleteFirstUseHandoffUseCase } from './complete-first-use-handoff.use-case';

const record = (onboardingCompletedAt: number | null): InstallationRecord => ({
  id: 1,
  installedAt: 10,
  onboardingCompletedAt,
  anonymousAnalyticsId: null,
  createdAt: 10,
  updatedAt: onboardingCompletedAt ?? 10,
});

const repository = () => ({
  find: vi.fn<InstallationRepository['find']>(),
  setOnboardingCompleted: vi.fn<InstallationRepository['setOnboardingCompleted']>(),
});

describe('CompleteFirstUseHandoffUseCase', () => {
  it('writes a null completion timestamp once', async () => {
    const installation = repository();
    installation.find.mockResolvedValue({ ok: true, value: record(null) });
    installation.setOnboardingCompleted.mockResolvedValue({ ok: true, value: 'updated' });
    const useCase = new CompleteFirstUseHandoffUseCase({
      clock: { nowMs: () => 42 },
      installation,
    });

    await expect(useCase.execute()).resolves.toEqual({
      ok: true,
      value: { outcome: 'completed_fresh', completedAt: 42 },
    });
    expect(installation.setOnboardingCompleted).toHaveBeenCalledWith(42, 42);
  });

  it('preserves an existing timestamp without writing again', async () => {
    const installation = repository();
    installation.find.mockResolvedValue({ ok: true, value: record(40) });
    const useCase = new CompleteFirstUseHandoffUseCase({
      clock: { nowMs: () => 99 },
      installation,
    });

    await expect(useCase.execute()).resolves.toEqual({
      ok: true,
      value: { outcome: 'already_completed', completedAt: 40 },
    });
    expect(installation.setOnboardingCompleted).not.toHaveBeenCalled();
  });

  it('re-reads a lost race and accepts only durable completion truth', async () => {
    const installation = repository();
    installation.find
      .mockResolvedValueOnce({ ok: true, value: record(null) })
      .mockResolvedValueOnce({ ok: true, value: record(41) });
    installation.setOnboardingCompleted.mockResolvedValue({
      ok: true,
      value: 'not_updated',
    });
    const useCase = new CompleteFirstUseHandoffUseCase({
      clock: { nowMs: () => 42 },
      installation,
    });

    await expect(useCase.execute()).resolves.toMatchObject({
      ok: true,
      value: { outcome: 'already_completed', completedAt: 41 },
    });
  });

  it('maps invalid time, provider failures, and inconsistent rows to finite errors', async () => {
    const invalidTime = new CompleteFirstUseHandoffUseCase({
      clock: { nowMs: () => Number.NaN },
      installation: repository(),
    });
    await expect(invalidTime.execute()).resolves.toMatchObject({
      ok: false,
      error: { code: 'ONBOARDING_HANDOFF_TIME_INVALID' },
    });

    const installation = repository();
    installation.find.mockResolvedValue({ ok: true, value: record(null) });
    installation.setOnboardingCompleted.mockResolvedValue({
      ok: false,
      error: persistenceError('PERSISTENCE_WRITE_FAILED', 'app_installation'),
    });
    await expect(new CompleteFirstUseHandoffUseCase({
      clock: { nowMs: () => 42 },
      installation,
    }).execute()).resolves.toMatchObject({
      ok: false,
      error: { code: 'ONBOARDING_HANDOFF_WRITE_FAILED' },
    });
  });
});
