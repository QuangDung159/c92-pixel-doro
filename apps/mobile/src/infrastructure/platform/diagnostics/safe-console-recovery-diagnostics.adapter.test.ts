import { afterEach, describe, expect, it, vi } from 'vitest';

import { SafeConsoleRecoveryDiagnosticsAdapter } from './safe-console-recovery-diagnostics.adapter';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SafeConsoleRecoveryDiagnosticsAdapter', () => {
  it('emits only the fixed sanitized recovery envelope', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const adapter = new SafeConsoleRecoveryDiagnosticsAdapter();

    adapter.record({
      eventName: 'recovery_entered',
      attemptNumber: 1,
      phase: 'verifying',
      reasonCode: 'BOOTSTRAP_ECONOMY_INVARIANT_FAILED',
    });

    expect(info).toHaveBeenCalledWith(
      '[PixelDoro][Recovery]',
      JSON.stringify({
        eventName: 'recovery_entered',
        attemptNumber: 1,
        phase: 'verifying',
        reasonCode: 'BOOTSTRAP_ECONOMY_INVARIANT_FAILED',
      }),
    );
    expect(JSON.stringify(info.mock.calls)).not.toContain('stack');
    expect(JSON.stringify(info.mock.calls)).not.toContain('sql');
    expect(JSON.stringify(info.mock.calls)).not.toContain('payload');
  });
});
