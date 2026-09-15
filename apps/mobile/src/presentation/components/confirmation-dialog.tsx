import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { PrimaryButton, SecondaryButton } from './button';

export interface ConfirmationDialogProps {
  readonly visible: boolean;
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly onDismiss: () => void;
  readonly busy?: boolean;
  readonly busyLabel?: string;
  readonly dismissLabel?: string;
  readonly confirmTone?: 'primary' | 'secondary';
  readonly dismissible?: boolean;
}

export const ConfirmationDialog = ({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onDismiss,
  busy = false,
  busyLabel = 'Đang dừng phiên…',
  dismissLabel = 'Tiếp tục',
  confirmTone = 'secondary',
  dismissible = true,
}: ConfirmationDialogProps) => {
  const confirmButton = confirmTone === 'primary'
    ? <PrimaryButton busy={busy} label={busy ? busyLabel : confirmLabel} onPress={onConfirm} />
    : <SecondaryButton busy={busy} label={busy ? busyLabel : confirmLabel} onPress={onConfirm} />;

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => { if (dismissible && !busy) onDismiss(); }}
      transparent
      visible={visible}
    >
      <View style={styles.scrim}>
        <View accessibilityLabel={title} accessibilityViewIsModal style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator
          >
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Text style={styles.body}>{body}</Text>
          </ScrollView>
          {dismissible && confirmTone === 'primary' ? (
            <SecondaryButton busy={busy} label={dismissLabel} onPress={onDismiss} />
          ) : null}
          {dismissible && confirmTone === 'secondary' ? (
            <PrimaryButton busy={busy} label={dismissLabel} onPress={onDismiss} />
          ) : null}
          {confirmButton}
        </View>
      </View>
    </Modal>
  );
};

export const ConfirmationModal = ConfirmationDialog;

const styles = StyleSheet.create({
  scrim: {
    alignItems: 'center',
    backgroundColor: palette.scrim,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 3,
    gap: 14,
    maxHeight: '90%',
    maxWidth: 460,
    padding: 22,
    width: '100%',
  },
  content: { gap: 14 },
  title: { color: palette.textPrimary, fontSize: 25, fontWeight: '900' },
  body: { color: palette.textSecondary, fontSize: 16, lineHeight: 23 },
});
