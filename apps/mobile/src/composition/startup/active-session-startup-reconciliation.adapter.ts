import { isRunningStandardFocus, type SessionRepository } from '@pixeldoro/application';
import {
  startupReconciliationError,
  type StartupReconciliationPort,
} from '@/application';

export class ActiveSessionStartupReconciliationAdapter implements StartupReconciliationPort {
  constructor(
    private readonly delegate: StartupReconciliationPort,
    private readonly sessions: Pick<SessionRepository, 'findActive'>,
  ) {}

  async reconcileAtStartup(): ReturnType<StartupReconciliationPort['reconcileAtStartup']> {
    const reconciled = await this.delegate.reconcileAtStartup();
    if (!reconciled.ok) return reconciled;
    try {
      const active = await this.sessions.findActive();
      if (!active.ok) return { ok: false, error: startupReconciliationError() };
      if (
        active.value !== null &&
        active.value.focusVariant === 'standard' &&
        !isRunningStandardFocus(active.value)
      ) {
        return { ok: false, error: startupReconciliationError() };
      }
      return reconciled;
    } catch {
      return { ok: false, error: startupReconciliationError() };
    }
  }
}
