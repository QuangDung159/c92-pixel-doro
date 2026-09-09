import { describe, expect, it, vi } from 'vitest';

import { BreakStartedScreen } from './break-started-screen';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text', View: 'View',
}));
vi.mock('@/presentation/components', () => ({
  InlineNotice: 'InlineNotice', Panel: 'Panel', PetVisualStatus: 'PetVisualStatus',
  ScreenHeader: 'ScreenHeader', ScreenShell: 'ScreenShell',
}));

describe('BreakStartedScreen', () => {
  it.each([
    ['short', 5, 'Nghỉ ngắn · 5 phút'],
    ['long', 15, 'Nghỉ dài · 15 phút'],
  ] as const)('renders committed %s meaning without a fake countdown', (kind, minutes, copy) => {
    const tree = BreakStartedScreen({
      session: { sessionId: 'break-1', kind, durationMinutes: minutes,
        startedAt: 10, endsAt: 10 + minutes * 60_000 },
      pet: { status: 'loading' },
      onDismissPetFeedbackError: vi.fn(),
      onRetryPet: vi.fn(),
    });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain(copy);
    expect(serialized).toContain('PetVisualStatus');
    expect(serialized).not.toMatch(/05:00|15:00|MOCK|Prototype/);
  });
});
