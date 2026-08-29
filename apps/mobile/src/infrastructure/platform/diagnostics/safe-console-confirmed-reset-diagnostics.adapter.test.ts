import { afterEach, describe, expect, it, vi } from 'vitest';

import { SafeConsoleConfirmedResetDiagnosticsAdapter } from './safe-console-confirmed-reset-diagnostics.adapter';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SafeConsoleConfirmedResetDiagnosticsAdapter', () => {
  it('emits only the fixed sanitized reset envelope', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const adapter = new SafeConsoleConfirmedResetDiagnosticsAdapter();

    adapter.record({
      eventName: 'confirmed_reset_warning',
      attemptNumber: 1,
      errorCode: null,
      warningCode: 'NOTIFICATION_CLEANUP_FAILED',
    });

    expect(info).toHaveBeenCalledWith(
      '[PixelDoro][ConfirmedReset]',
      JSON.stringify({
        eventName: 'confirmed_reset_warning',
        attemptNumber: 1,
        errorCode: null,
        warningCode: 'NOTIFICATION_CLEANUP_FAILED',
      }),
    );
    const output = JSON.stringify(info.mock.calls);
    expect(output).not.toContain('stack');
    expect(output).not.toContain('sql');
    expect(output).not.toContain('sessionId');
    expect(output).not.toContain('anonymousAnalyticsId');
  });
});
