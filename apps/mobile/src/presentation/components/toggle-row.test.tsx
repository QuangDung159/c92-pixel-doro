import { describe, expect, it, vi } from 'vitest';

import { ToggleRow } from './toggle-row';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Switch: 'Switch',
  Text: 'Text',
  View: 'View',
}));

const findSwitch = (node: unknown): { readonly props: Record<string, unknown> } | undefined => {
  if (node === null || typeof node !== 'object') return undefined;
  const element = node as { readonly type?: unknown; readonly props?: Record<string, unknown> };
  if (element.type === 'Switch' && element.props !== undefined) return { props: element.props };
  const children = element.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = findSwitch(child);
    if (found !== undefined) return found;
  }
  return undefined;
};

const serializedText = (node: unknown): string => {
  if (typeof node === 'string') return node;
  if (node === null || typeof node !== 'object') return '';
  const children = (node as { readonly props?: { readonly children?: unknown } }).props?.children;
  return (Array.isArray(children) ? children : [children]).map(serializedText).join('');
};

describe('ToggleRow', () => {
  it('exposes label and checked state without a local-save visual state', () => {
    const onValueChange = vi.fn();
    const tree = ToggleRow({
      label: 'Âm thanh', body: 'Âm báo ngắn.', value: true,
      onValueChange,
    });
    expect(findSwitch(tree)?.props).toMatchObject({
      accessibilityLabel: 'Âm thanh',
      accessibilityHint: 'Âm báo ngắn.',
      accessibilityState: { checked: true, disabled: false },
      disabled: false,
      value: true,
    });
    expect(serializedText(tree)).toBe('Âm thanhÂm báo ngắn.');
  });
});
