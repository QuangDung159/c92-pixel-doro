import { describe, expect, it, vi } from 'vitest';

import { TrialCountdown } from './trial-countdown';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('TrialCountdown', () => {
  it('formats timestamp-derived running time with a stable accessibility label', () => {
    const tree = TrialCountdown({ displaySeconds: 299, pending: false });
    expect(tree.props).toMatchObject({
      displaySeconds: 299, pending: false,
      runningCaption: 'CỨ BẮT ĐẦU, RỒI NHỊP SẼ ĐẾN.',
    });
  });

  it('renders a truthful deadline-pending state', () => {
    const tree = TrialCountdown({ displaySeconds: 0, pending: true });
    expect(tree.props).toMatchObject({ displaySeconds: 0, pending: true });
  });
});
