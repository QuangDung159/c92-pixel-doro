import { Modal, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { PrimaryButton, SecondaryButton } from './button';

export interface ConfirmationDialogProps {
  readonly visible: boolean;
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly onDismiss: () => void;
}

export const ConfirmationDialog = ({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onDismiss,
}: ConfirmationDialogProps) => (
  <Modal animationType="fade" onRequestClose={onDismiss} transparent visible={visible}>
    <View style={styles.scrim}>
      <View accessibilityViewIsModal style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.body}>{body}</Text>
        <PrimaryButton label="Tiếp tục" onPress={onDismiss} />
        <SecondaryButton label={confirmLabel} onPress={onConfirm} />
      </View>
    </View>
  </Modal>
);

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
    maxWidth: 460,
    padding: 22,
    width: '100%',
  },
  title: { color: palette.textPrimary, fontSize: 25, fontWeight: '900' },
  body: { color: palette.textSecondary, fontSize: 16, lineHeight: 23 },
});
