import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  PetVisualStatus,
  PrimaryButton,
} from '@/presentation/components';

import { FocusResultScreen } from './index';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));

const flatten = (node: ReactNode): ReactNode[] => {
  const values = Children.toArray(node);
  return values.flatMap((value) => {
    if (!isValidElement<{ readonly children?: ReactNode }>(value)) return [value];
    if (value.type === Fragment) return flatten(value.props.children);
    return [value, ...flatten(value.props.children)];
  });
};

interface TestElementProps {
  readonly children?: ReactNode;
  readonly projection?: unknown;
  readonly label?: string;
  readonly onPress?: () => void;
}

const isTestElement = (node: ReactNode): node is ReactElement<TestElementProps> =>
  isValidElement<TestElementProps>(node);

describe('FocusResultScreen terminal Pet feedback', () => {
  it('keeps the Result CTA available while accepted feedback is active', () => {
    const onHome = vi.fn();
    const onTriggerTerminalReviewFixture = vi.fn();
    const feedback = {
      status: 'ready' as const,
      source: 'terminal' as const,
      feedbackId: 'focus-1:completed',
      state: 'celebrating' as const,
      announcementId: 'focus-1:completed',
      visualMode: 'one-shot' as const,
    };
    const tree = FocusResultScreen({
      result: {
        kind: 'trial',
        outcome: 'completed',
        durationMinutes: 5,
        mode: 'relax',
        xpEarned: 5,
        coinsEarned: 1,
      },
      nextBreakKind: 'short',
      onSetNextBreakKind: vi.fn(),
      onStartBreak: vi.fn(),
      onHome,
      onRetryFocus: vi.fn(),
      onRetryTrial: vi.fn(),
      onRetryPet: vi.fn(),
      onDismissPetFeedbackError: vi.fn(),
      onTriggerTerminalReviewFixture,
      pet: feedback,
      terminalReviewFixtureAvailable: true,
    });
    const elements = flatten(tree).filter(isTestElement);
    const feedbackStatus = elements.find(
      (element) => element.type === PetVisualStatus,
    );
    const homeCta = elements.find(
      (element) =>
        element.type === PrimaryButton &&
        element.props.label === 'Vào Pet Room',
    );
    const reviewControl = elements.find(
      (element) => element.props.label === 'Emit Pet review fixture',
    );

    expect(feedbackStatus?.props.projection).toBe(feedback);
    expect(homeCta).toBeDefined();
    expect(onTriggerTerminalReviewFixture).not.toHaveBeenCalled();
    reviewControl?.props.onPress?.();
    expect(onTriggerTerminalReviewFixture).toHaveBeenCalledOnce();
    homeCta?.props.onPress?.();
    expect(onHome).toHaveBeenCalledOnce();
  });
});
