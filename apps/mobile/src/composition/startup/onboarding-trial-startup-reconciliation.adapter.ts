import {
  startupReconciliationError,
  type OnboardingTrialCompletionController,
  type StartupReconciliationPort,
} from '@/application';

export class OnboardingTrialStartupReconciliationAdapter
  implements StartupReconciliationPort
{
  constructor(
    private readonly completion: OnboardingTrialCompletionController,
    private readonly prepare?: () => Promise<boolean>,
  ) {}

  async reconcileAtStartup(): ReturnType<StartupReconciliationPort['reconcileAtStartup']> {
    const preparedDurableData = this.prepare !== undefined;
    if (preparedDurableData && !(await this.prepare!())) {
      return { ok: false, error: startupReconciliationError() };
    }
    const result = await this.completion.reconcile();
    if (!result.ok) return { ok: false, error: startupReconciliationError() };
    return {
      ok: true,
      value: {
        durableDataChanged:
          preparedDurableData || result.value.outcome === 'completed_fresh',
      },
    };
  }
}
