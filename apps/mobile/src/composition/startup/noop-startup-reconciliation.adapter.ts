import type { StartupReconciliationPort } from '@/application';

/**
 * Epic 2 readiness boundary only. A production Session vertical slice may
 * replace this adapter only after the UI/user-flow approval gate; this
 * implementation deliberately reads and mutates no Session state.
 */
export class NoopStartupReconciliationAdapter
  implements StartupReconciliationPort
{
  async reconcileAtStartup(): ReturnType<
    StartupReconciliationPort['reconcileAtStartup']
  > {
    return { ok: true, value: undefined };
  }
}
