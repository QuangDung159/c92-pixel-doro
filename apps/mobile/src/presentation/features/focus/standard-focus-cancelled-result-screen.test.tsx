import { Children, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { StandardFocusCancelledResultScreen } from './standard-focus-cancelled-result-screen';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles }, Text: 'Text', View: 'View',
}));
vi.mock('@/presentation/components', () => ({
  InlineNotice: 'InlineNotice', PetVisualStatus: 'PetVisualStatus', PrimaryButton: 'PrimaryButton',
  ScreenHeader: 'ScreenHeader', ScreenShell: 'ScreenShell', StatDisplay: 'StatDisplay',
}));

describe('StandardFocusCancelledResultScreen', () => {
  it('renders neutral zero-reward Result with Home as the only action', () => {
    const tree = StandardFocusCancelledResultScreen({
      result: {
        status: 'cancelled',
        sessionId: 'focus-1', durationMinutes: 15, mode: 'relax', workTag: 'coding',
        startedAt: 1_000, endsAt: 901_000, resolvedAt: 2_000, xpEarned: 0, coinsEarned: 0,
      },
      pet: { status: 'loading' }, onDismissPetFeedbackError: vi.fn(),
      onRetryPet: vi.fn(), onHome: vi.fn(),
    });
    const children = Children.toArray(tree.props.children) as ReactElement<Record<string, unknown>>[];
    const buttons = children.filter((item) => item.type === 'PrimaryButton');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.props.label).toBe('Về Home');
    expect(JSON.stringify(tree)).not.toMatch(/RewardSummary|Claim|Start Break|Celebrate/);
  });
});
