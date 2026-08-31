import { describe, expect, it, vi } from 'vitest';

import { RewardSummary } from './reward-summary';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

vi.mock('./panel', () => ({ Panel: 'Panel' }));
vi.mock('./stat-display', () => ({ StatDisplay: 'StatDisplay' }));

describe('RewardSummary', () => {
  it('groups committed XP and Coin without a claim action', () => {
    const tree = RewardSummary({ xpEarned: 5, coinsEarned: 1 });
    expect(JSON.stringify(tree)).toContain('Phần thưởng đã nhận: 5 XP và 1 Coin');
    expect(JSON.stringify(tree)).toContain('+5');
    expect(JSON.stringify(tree)).toContain('+1');
    expect(JSON.stringify(tree)).not.toContain('onPress');
  });
});
