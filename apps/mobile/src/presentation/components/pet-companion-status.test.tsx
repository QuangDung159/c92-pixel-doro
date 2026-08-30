import { describe, expect, it, vi } from 'vitest';

import { PetCompanionStatus } from './pet-companion-status';
import { PetStage } from './pet-stage';
import { ErrorState, LoadingState } from './status-surface';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Pressable: 'Pressable',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('PetCompanionStatus', () => {
  it.each(['idle', 'working', 'breaking'] as const)(
    'renders committed %s state through PetStage',
    (baseState) => {
      const tree = PetCompanionStatus({
        onRetry: vi.fn(),
        projection: { status: 'ready', baseState, activeSessionId: null },
      });

      expect(tree.type).toBe(PetStage);
      expect(tree.props.state).toBe(baseState);
    },
  );

  it('renders loading without guessing a Pet state', () => {
    const tree = PetCompanionStatus({
      onRetry: vi.fn(),
      projection: { status: 'loading' },
    });

    expect(tree.type).toBe(LoadingState);
  });

  it('renders a friendly retry surface without a Pet state on recovery', () => {
    const onRetry = vi.fn();
    const tree = PetCompanionStatus({
      onRetry,
      projection: {
        status: 'recovery',
        reason: 'committed_session_unavailable',
      },
    });

    expect(tree.type).toBe(ErrorState);
    tree.props.onRetry();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
