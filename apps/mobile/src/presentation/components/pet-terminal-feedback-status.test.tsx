import { describe, expect, it, vi } from 'vitest';

import { PetCompanionStatus } from './pet-companion-status';
import { PetStage } from './pet-stage';
import { PetTerminalFeedbackStatus } from './pet-terminal-feedback-status';
import { ErrorState } from './status-surface';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Pressable: 'Pressable',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

const baseProjection = {
  status: 'ready' as const,
  baseState: 'idle' as const,
  activeSessionId: null,
};

describe('PetTerminalFeedbackStatus', () => {
  it.each(['celebrating', 'bugged'] as const)(
    'renders accepted %s feedback as one polite semantic status',
    (state) => {
      const tree = PetTerminalFeedbackStatus({
        baseProjection,
        feedbackProjection: {
          status: 'active',
          feedbackId: `session:${state}`,
          state,
          startedAtMs: 0,
          endsAtMs: state === 'celebrating' ? 2_000 : 1_500,
          visualMode: 'one-shot',
        },
        onDismissFeedbackError: vi.fn(),
        onRetryBase: vi.fn(),
      });

      expect(tree.type).toBe(PetStage);
      expect(tree.props).toMatchObject({ state, liveRegion: 'polite' });
    },
  );

  it('returns to the committed base projection after feedback ends', () => {
    const tree = PetTerminalFeedbackStatus({
      baseProjection,
      feedbackProjection: { status: 'idle' },
      onDismissFeedbackError: vi.fn(),
      onRetryBase: vi.fn(),
    });

    expect(tree.type).toBe(PetCompanionStatus);
  });

  it('shows a safe visual-only recovery without changing result truth', () => {
    const onDismissFeedbackError = vi.fn();
    const tree = PetTerminalFeedbackStatus({
      baseProjection,
      feedbackProjection: {
        status: 'recovery',
        reason: 'invalid_terminal_transition',
      },
      onDismissFeedbackError,
      onRetryBase: vi.fn(),
    });

    expect(tree.type).toBe(ErrorState);
    tree.props.onRetry();
    expect(onDismissFeedbackError).toHaveBeenCalledOnce();
  });
});
