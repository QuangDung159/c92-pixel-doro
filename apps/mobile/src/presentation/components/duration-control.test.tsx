import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SecondaryButton } from './button';
import { ChoiceChip } from './choice-chip';
import { DurationControl } from './duration-control';

vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text', View: 'View',
}));

const flatten = (node: ReactNode): ReactNode[] => Children.toArray(node).flatMap((value) =>
  isValidElement<{ readonly children?: ReactNode }>(value)
    ? [value, ...flatten(value.props.children)]
    : [value]);

interface TestElementProps {
  readonly children?: ReactNode;
  readonly label?: string;
  readonly onPress?: () => void;
}

const isTestElement = (node: ReactNode): node is ReactElement<TestElementProps> =>
  isValidElement<TestElementProps>(node);

describe('DurationControl', () => {
  it('emits exact step and quick-value intents without clamping', () => {
    const onChange = vi.fn();
    const tree = DurationControl({
      value: 25, min: 15, max: 120, step: 5,
      quickValues: [15, 25, 50], onChange,
    });
    const elements = flatten(tree).filter(isTestElement);
    const buttons = elements.filter((element) => element.type === SecondaryButton);
    const quick = elements.find((element) =>
      element.type === ChoiceChip && element.props.label === '50 phút');
    buttons[0]?.props.onPress?.();
    buttons[1]?.props.onPress?.();
    quick?.props.onPress?.();
    expect(onChange.mock.calls).toEqual([[20], [30], [50]]);
  });
});
