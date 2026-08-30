import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/presentation/theme/palette';

export type CompanionState = 'idle' | 'working' | 'breaking' | 'celebrating' | 'bugged';

export const PrototypeScreen = ({ children }: PropsWithChildren) => (
  <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
    <ScrollView
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  </SafeAreaView>
);

export const PrototypeBadge = () => (
  <View
    accessibilityLabel="Bản mẫu giao diện, dữ liệu không được lưu"
    style={styles.prototypeBadge}
  >
    <View style={styles.liveDot} />
    <Text style={styles.prototypeBadgeText}>PROTOTYPE · FAKE DATA</Text>
  </View>
);

export const ScreenHeader = ({
  eyebrow,
  title,
  description,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
}) => (
  <View style={styles.header}>
    <Text style={styles.eyebrow}>{eyebrow}</Text>
    <Text accessibilityRole="header" style={styles.title}>
      {title}
    </Text>
    {description === undefined ? null : (
      <Text style={styles.description}>{description}</Text>
    )}
  </View>
);

export const PixelPanel = ({
  children,
  tone = 'default',
  style,
}: PropsWithChildren<{
  readonly tone?: 'default' | 'strong' | 'gold' | 'danger';
  readonly style?: ViewStyle;
}>) => (
  <View
    style={[
      styles.panel,
      tone === 'strong' && styles.panelStrong,
      tone === 'gold' && styles.panelGold,
      tone === 'danger' && styles.panelDanger,
      style,
    ]}
  >
    {children}
  </View>
);

export const PixelCompanion = ({ state }: { readonly state: CompanionState }) => {
  const labels: Record<CompanionState, string> = {
    idle: 'Người bạn đang chờ bạn',
    working: 'Người bạn đang tập trung cùng bạn',
    breaking: 'Người bạn đang nghỉ cùng bạn',
    celebrating: 'Người bạn đang ăn mừng cùng bạn',
    bugged: 'Người bạn vừa bị nhiễu, mình thử lại nhé',
  };

  return (
    <View accessible accessibilityLabel={labels[state]} style={styles.companionScene}>
      <View style={styles.roomShelf} />
      <View
        style={[
          styles.companionGlow,
          state === 'celebrating' && styles.companionGlowGold,
          state === 'bugged' && styles.companionGlowDanger,
        ]}
      >
        <View style={styles.companionHead}>
          <View style={styles.companionEyes}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>
          <View style={styles.companionMouth} />
        </View>
        <View style={styles.companionBody} />
      </View>
      <Text style={styles.companionLabel}>{labels[state]}</Text>
    </View>
  );
};

interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
}

export const PrimaryButton = ({
  label,
  onPress,
  disabled = false,
  accessibilityLabel = label,
}: ButtonProps) => (
  <Pressable
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.primaryButton,
      pressed && styles.buttonPressed,
      disabled && styles.buttonDisabled,
    ]}
  >
    <Text style={styles.primaryButtonText}>{label}</Text>
  </Pressable>
);

export const SecondaryButton = ({
  label,
  onPress,
  disabled = false,
  accessibilityLabel = label,
}: ButtonProps) => (
  <Pressable
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.secondaryButton,
      pressed && styles.buttonPressed,
      disabled && styles.buttonDisabled,
    ]}
  >
    <Text style={styles.secondaryButtonText}>{label}</Text>
  </Pressable>
);

export const ChoiceChip = ({
  label,
  selected,
  onPress,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    onPress={onPress}
    style={[styles.choiceChip, selected && styles.choiceChipSelected]}
  >
    <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>
      {selected ? `✓ ${label}` : label}
    </Text>
  </Pressable>
);

export const SectionLabel = ({ children }: PropsWithChildren) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

export const Stat = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const PrototypeControls = ({ children }: PropsWithChildren) => {
  const visible = typeof __DEV__ === 'undefined' || __DEV__;
  if (!visible) return null;

  return (
    <View accessibilityLabel="Điều khiển bản mẫu" style={styles.prototypeControls}>
      <Text style={styles.prototypeControlsTitle}>PROTOTYPE CONTROLS</Text>
      <Text style={styles.prototypeControlsCopy}>
        Chuyển state giả để review. Không tạo dữ liệu thật.
      </Text>
      <View style={styles.controlRow}>{children}</View>
    </View>
  );
};

export const ControlButton = ({ label, onPress }: Omit<ButtonProps, 'disabled'>) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [styles.controlButton, pressed && styles.buttonPressed]}
  >
    <Text style={styles.controlButtonText}>{label}</Text>
  </Pressable>
);

export const LoadingState = ({ label }: { readonly label: string }) => (
  <PixelPanel style={styles.statePanel}>
    <ActivityIndicator color={palette.accentDark} size="large" />
    <Text accessibilityLiveRegion="polite" style={styles.stateTitle}>
      {label}
    </Text>
    <View style={styles.skeletonWide} />
    <View style={styles.skeletonShort} />
  </PixelPanel>
);

export const EmptyState = ({
  title,
  body,
}: {
  readonly title: string;
  readonly body: string;
}) => (
  <PixelPanel style={styles.statePanel}>
    <Text style={styles.emptyGlyph}>□</Text>
    <Text style={styles.stateTitle}>{title}</Text>
    <Text style={styles.stateBody}>{body}</Text>
  </PixelPanel>
);

export const ErrorState = ({
  title,
  body,
  onRetry,
}: {
  readonly title: string;
  readonly body: string;
  readonly onRetry: () => void;
}) => (
  <PixelPanel tone="danger" style={styles.statePanel}>
    <Text accessibilityRole="alert" style={styles.stateTitle}>
      {title}
    </Text>
    <Text style={styles.stateBody}>{body}</Text>
    <SecondaryButton label="Thử lại" onPress={onRetry} />
  </PixelPanel>
);

export const ConfirmationModal = ({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onDismiss,
}: {
  readonly visible: boolean;
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly onDismiss: () => void;
}) => (
  <Modal
    animationType="fade"
    onRequestClose={onDismiss}
    transparent
    visible={visible}
  >
    <View style={styles.modalScrim}>
      <View accessibilityViewIsModal style={styles.modalCard}>
        <Text accessibilityRole="header" style={styles.modalTitle}>
          {title}
        </Text>
        <Text style={styles.modalBody}>{body}</Text>
        <PrimaryButton label="Tiếp tục" onPress={onDismiss} />
        <SecondaryButton label={confirmLabel} onPress={onConfirm} />
      </View>
    </View>
  </Modal>
);

export const InlineNotice = ({ children }: { readonly children: ReactNode }) => (
  <View style={styles.inlineNotice}>
    <Text style={styles.inlineNoticeText}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { backgroundColor: palette.background, flex: 1 },
  screenContent: {
    alignSelf: 'center',
    gap: 20,
    maxWidth: 560,
    minHeight: '100%',
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 16,
    width: '100%',
  },
  prototypeBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.textPrimary,
    borderRadius: 4,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: { backgroundColor: palette.accentGold, height: 7, width: 7 },
  prototypeBadgeText: { color: palette.white, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  header: { gap: 8 },
  eyebrow: { color: palette.accentDark, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title: { color: palette.textPrimary, fontSize: 34, fontWeight: '900', letterSpacing: -1, lineHeight: 39 },
  description: { color: palette.textSecondary, fontSize: 16, lineHeight: 24 },
  panel: {
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 3,
    gap: 12,
    padding: 18,
    shadowColor: palette.border,
    shadowOffset: { height: 5, width: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  panelStrong: { backgroundColor: palette.surfaceStrong },
  panelGold: { backgroundColor: '#F6D986' },
  panelDanger: { backgroundColor: '#F5C5B8' },
  companionScene: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 3,
    minHeight: 230,
    overflow: 'hidden',
    paddingTop: 30,
  },
  roomShelf: { backgroundColor: palette.accentDark, height: 8, opacity: 0.35, position: 'absolute', right: 20, top: 40, width: 75 },
  companionGlow: { alignItems: 'center', backgroundColor: '#C6DB83', borderRadius: 60, height: 130, justifyContent: 'center', width: 130 },
  companionGlowGold: { backgroundColor: palette.accentGold },
  companionGlowDanger: { backgroundColor: '#E99A82' },
  companionHead: { alignItems: 'center', backgroundColor: palette.textPrimary, borderRadius: 8, height: 58, justifyContent: 'center', width: 72 },
  companionEyes: { flexDirection: 'row', gap: 18 },
  eye: { backgroundColor: palette.accentGold, height: 9, width: 9 },
  companionMouth: { backgroundColor: palette.white, height: 5, marginTop: 11, width: 18 },
  companionBody: { backgroundColor: palette.accentDark, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, height: 42, width: 52 },
  companionLabel: { color: palette.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 18, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: palette.textPrimary, borderColor: palette.textPrimary, borderRadius: 6, borderWidth: 3, justifyContent: 'center', minHeight: 54, paddingHorizontal: 18, paddingVertical: 13 },
  primaryButtonText: { color: palette.white, fontSize: 16, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', backgroundColor: palette.white, borderColor: palette.border, borderRadius: 6, borderWidth: 3, justifyContent: 'center', minHeight: 52, paddingHorizontal: 18, paddingVertical: 12 },
  secondaryButtonText: { color: palette.textPrimary, fontSize: 16, fontWeight: '900' },
  buttonPressed: { opacity: 0.72, transform: [{ translateY: 2 }] },
  buttonDisabled: { opacity: 0.45 },
  choiceChip: { backgroundColor: palette.white, borderColor: palette.border, borderRadius: 5, borderWidth: 2, minHeight: 46, paddingHorizontal: 14, paddingVertical: 11 },
  choiceChipSelected: { backgroundColor: palette.textPrimary },
  choiceChipText: { color: palette.textPrimary, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  choiceChipTextSelected: { color: palette.white },
  sectionLabel: { color: palette.textPrimary, fontSize: 13, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  stat: { alignItems: 'center', backgroundColor: palette.background, borderColor: palette.border, borderRadius: 5, borderWidth: 2, flex: 1, gap: 2, minWidth: 88, padding: 12 },
  statValue: { color: palette.textPrimary, fontSize: 22, fontWeight: '900' },
  statLabel: { color: palette.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  prototypeControls: { backgroundColor: '#DDE8EE', borderColor: palette.accentBlue, borderRadius: 6, borderStyle: 'dashed', borderWidth: 2, gap: 8, padding: 14 },
  prototypeControlsTitle: { color: palette.textPrimary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  prototypeControlsCopy: { color: palette.textSecondary, fontSize: 12, lineHeight: 17 },
  controlRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  controlButton: { backgroundColor: palette.white, borderColor: palette.accentBlue, borderRadius: 4, borderWidth: 2, minHeight: 40, paddingHorizontal: 12, paddingVertical: 9 },
  controlButtonText: { color: palette.textPrimary, fontSize: 12, fontWeight: '900' },
  statePanel: { alignItems: 'center', justifyContent: 'center', minHeight: 260 },
  stateTitle: { color: palette.textPrimary, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  stateBody: { color: palette.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  skeletonWide: { backgroundColor: palette.surfaceStrong, height: 18, marginTop: 8, width: '86%' },
  skeletonShort: { backgroundColor: palette.surfaceStrong, height: 18, width: '58%' },
  emptyGlyph: { color: palette.accentDark, fontSize: 52, fontWeight: '900' },
  modalScrim: { alignItems: 'center', backgroundColor: palette.scrim, flex: 1, justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: palette.background, borderColor: palette.border, borderRadius: 8, borderWidth: 3, gap: 14, maxWidth: 460, padding: 22, width: '100%' },
  modalTitle: { color: palette.textPrimary, fontSize: 25, fontWeight: '900' },
  modalBody: { color: palette.textSecondary, fontSize: 16, lineHeight: 23 },
  inlineNotice: { backgroundColor: palette.surface, borderLeftColor: palette.accentDark, borderLeftWidth: 5, padding: 13 },
  inlineNoticeText: { color: palette.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 19 },
});
