import type { OtaRestartSafety, OtaRestartSafetyPort } from './ota-update.port';

interface ActiveSessionFact {
  readonly sessionType: 'focus' | 'short_break' | 'long_break';
  readonly focusVariant: 'standard' | 'onboarding_trial' | null;
}

export interface OtaRestartSafetyEvaluatorDependencies {
  readonly isBootstrapReady: () => boolean;
  readonly isCriticalOperationActive: () => boolean;
  readonly waitForLifecycleIdle: () => Promise<void>;
  readonly runAfterSessionCommands: <TValue>(work: () => Promise<TValue>) => Promise<TValue>;
  readonly findActiveSession: () => Promise<
    | { readonly ok: true; readonly value: ActiveSessionFact | null }
    | { readonly ok: false }
  >;
}

export class OtaRestartSafetyEvaluator implements OtaRestartSafetyPort {
  constructor(private readonly dependencies: OtaRestartSafetyEvaluatorDependencies) {}

  async evaluate(): Promise<OtaRestartSafety> {
    if (!this.dependencies.isBootstrapReady()) {
      return { safe: false, reason: 'bootstrap_not_ready' };
    }
    if (this.dependencies.isCriticalOperationActive()) {
      return { safe: false, reason: 'critical_operation' };
    }

    await this.dependencies.waitForLifecycleIdle();
    if (!this.dependencies.isBootstrapReady()) {
      return { safe: false, reason: 'bootstrap_not_ready' };
    }

    return this.dependencies.runAfterSessionCommands(async () => {
      if (this.dependencies.isCriticalOperationActive()) {
        return { safe: false, reason: 'critical_operation' } as const;
      }
      const active = await this.dependencies.findActiveSession();
      if (!active.ok) return { safe: false, reason: 'session_read_failed' } as const;
      if (active.value === null) {
        return this.dependencies.isCriticalOperationActive()
          ? { safe: false, reason: 'critical_operation' } as const
          : { safe: true } as const;
      }
      if (active.value.sessionType !== 'focus') {
        return { safe: false, reason: 'active_break' } as const;
      }
      return {
        safe: false,
        reason: active.value.focusVariant === 'onboarding_trial'
          ? 'active_trial'
          : 'active_focus',
      } as const;
    });
  }
}
