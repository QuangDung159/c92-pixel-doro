import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  PetVisualStatus,
  ScreenHeader,
  StatDisplay,
} from '@/presentation/components';

import { HomeScreen } from './index';

vi.mock('react-native', () => ({
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

describe('HomeScreen', () => {
  it('renders committed profile progress in the approved hierarchy without prototype controls', () => {
    const onStartFocus = vi.fn();
    const tree = HomeScreen({
      onStartFocus,
      onDismissPetFeedbackError: vi.fn(),
      onRetryPet: vi.fn(),
      pet: {
        status: 'ready',
        source: 'base',
        state: 'idle',
        activeSessionId: null,
        announcementId: 'base:idle:none',
        visualMode: 'loop',
      },
      profile: {
        level: 1,
        totalXp: 30,
        coinBalance: 6,
        levelProgressPercent: 60,
        xpToNextLevel: 20,
      },
    });
    const nodes = flatten(tree);
    const componentNames = nodes
      .filter(isValidElement)
      .map((node) => typeof node.type === 'function' ? node.type.name : String(node.type));

    expect(componentNames).toContain(ScreenHeader.name);
    expect(componentNames).toContain(PetVisualStatus.name);
    expect(componentNames.filter((name) => name === StatDisplay.name)).toHaveLength(3);
    expect(componentNames).not.toContain('PrototypeBadge');
    expect(componentNames).not.toContain('PrototypeControls');
    expect(JSON.stringify(tree)).toContain('Còn ');
    expect(JSON.stringify(tree)).toContain('20');
  });
});
