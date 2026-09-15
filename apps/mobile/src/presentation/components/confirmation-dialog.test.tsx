import { describe, expect, it, vi } from 'vitest';

import { ConfirmationDialog } from './confirmation-dialog';
import { PrimaryButton } from './button';

vi.mock('react-native', () => ({
  Modal: 'Modal',
  Pressable: 'Pressable',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('ConfirmationDialog', () => {
  it('cannot be dismissed and exposes only the confirmation action when blocking', () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    const tree = ConfirmationDialog({
      body: 'Cập nhật để tiếp tục.',
      confirmLabel: 'Cập nhật ngay',
      confirmTone: 'primary',
      dismissible: false,
      onConfirm,
      onDismiss,
      title: 'Có phiên bản mới',
      visible: true,
    });
    const card = tree.props.children.props.children;
    const actions = (card.props.children as readonly unknown[]).filter((child) => {
      if (child === null || typeof child !== 'object') return false;
      return (child as { readonly type?: unknown }).type === PrimaryButton;
    });

    tree.props.onRequestClose();

    expect(onDismiss).not.toHaveBeenCalled();
    expect(actions).toHaveLength(1);
  });
});
