import { afterEach, describe, expect, it, vi } from 'vitest';

import { SafeConsolePetVisualDiagnosticsAdapter } from './safe-console-pet-visual-diagnostics.adapter';

afterEach(() => vi.restoreAllMocks());

describe('SafeConsolePetVisualDiagnosticsAdapter', () => {
  it('emits only the fixed visual fallback envelope', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const adapter = new SafeConsolePetVisualDiagnosticsAdapter();
    adapter.record({
      eventName: 'pet_visual_fallback',
      state: 'working',
      fallbackLayer: 'state_still',
      reasonCode: 'driver_failure',
    });

    const serialized = JSON.stringify(info.mock.calls);
    expect(info).toHaveBeenCalledWith(
      '[PixelDoro][PetVisual]',
      JSON.stringify({
        eventName: 'pet_visual_fallback',
        state: 'working',
        fallbackLayer: 'state_still',
        reasonCode: 'driver_failure',
      }),
    );
    expect(serialized).not.toContain('sessionId');
    expect(serialized).not.toContain('petName');
    expect(serialized).not.toContain('payload');
  });
});
