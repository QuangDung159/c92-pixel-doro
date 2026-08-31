import { describe, expect, it, vi } from 'vitest';

import { OnboardingTrialResultScreen } from './onboarding-trial-result-screen';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

vi.mock('@/presentation/components', () => ({
  InlineNotice: 'InlineNotice',
  PetVisualStatus: 'PetVisualStatus',
  PrimaryButton: 'PrimaryButton',
  RewardSummary: 'RewardSummary',
  ScreenHeader: 'ScreenHeader',
  ScreenShell: 'ScreenShell',
  StatDisplay: 'StatDisplay',
}));

describe('OnboardingTrialResultScreen', () => {
  it('renders committed reward and keeps Continue disabled for US-05-04', () => {
    const tree = OnboardingTrialResultScreen({
      result: {
        sessionId: 'trial-1', receiptId: 'receipt-1', resolvedAt: 10,
        xpEarned: 5, coinsEarned: 1, totalXp: 5, coinBalance: 1,
      },
      pet: { status: 'loading' },
      onDismissPetFeedbackError: vi.fn(),
      onRetryPet: vi.fn(),
    });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('TRIAL COMPLETE');
    expect(serialized).toContain('RewardSummary');
    expect(serialized).toContain('"disabled":true');
    expect(serialized).not.toMatch(/Claim|PrototypeBadge|MOCK/);
  });
});
