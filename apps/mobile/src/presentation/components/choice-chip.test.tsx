import { describe, expect, it, vi } from 'vitest';

import { ChoiceChip } from './choice-chip';

vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
}));

describe('ChoiceChip', () => {
  it('keeps selected and disabled semantics independent of color', () => {
    const tree = ChoiceChip({
      label: 'Strict',
      selected: true,
      disabled: true,
      onPress: vi.fn(),
    });

    expect(tree.props).toMatchObject({
      accessibilityRole: 'radio',
      accessibilityState: { disabled: true, selected: true },
      disabled: true,
    });
    expect(JSON.stringify(tree)).toContain('✓ Strict');
  });
});
