import type { StartupReconciliationPort } from '@/application';

/**
 * Epic 2 readiness boundary only. EPIC-03 must replace this adapter with the
 * real Session command coordinator; this implementation deliberately reads
 * and mutates no Session state.
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
