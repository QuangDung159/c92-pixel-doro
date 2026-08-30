import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import {
  ChoiceChip,
  PixelPanel,
  PrototypeBadge,
  PrototypeScreen,
  ScreenHeader,
  SecondaryButton,
  SectionLabel,
} from '@/presentation/components/prototype-ui';
import type { BreakKind } from '@/presentation/prototype/prototype-state';
import { palette } from '@/presentation/theme/palette';

const SettingRow = ({
  label,
  body,
  value,
  onValueChange,
}: {
  readonly label: string;
  readonly body: string;
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingCopy}>
      <Text style={styles.settingTitle}>{label}</Text>
      <Text style={styles.settingBody}>{body}</Text>
    </View>
    <Switch
      accessibilityLabel={label}
      onValueChange={onValueChange}
      thumbColor={palette.white}
      trackColor={{ false: palette.textSecondary, true: palette.accentDark }}
      value={value}
    />
  </View>
);

export const SettingsScreen = ({
  nextBreakKind,
  onSetNextBreakKind,
  onOpenFeedback,
}: {
  readonly nextBreakKind: BreakKind;
  readonly onSetNextBreakKind: (kind: BreakKind) => void;
  readonly onOpenFeedback: () => void;
}) => {
  const [sound, setSound] = useState(true);
  const [haptic, setHaptic] = useState(true);
  const [notifications, setNotifications] = useState(false);

  return (
    <PrototypeScreen>
      <PrototypeBadge />
      <ScreenHeader
        description="Các control dưới đây chỉ đổi presentation state trong memory."
        eyebrow="SETTINGS"
        title="Giữ PixelDoro vừa đủ với bạn."
      />
      <PixelPanel>
        <SettingRow body="Âm thanh nhẹ khi bắt đầu và kết thúc." label="Âm thanh" onValueChange={setSound} value={sound} />
        <View style={styles.divider} />
        <SettingRow body="Phản hồi chạm cho CTA quan trọng." label="Rung phản hồi" onValueChange={setHaptic} value={haptic} />
        <View style={styles.divider} />
        <SettingRow body="Nhắc khi Focus hoặc Break kết thúc." label="Thông báo" onValueChange={setNotifications} value={notifications} />
      </PixelPanel>
      <PixelPanel>
        <SectionLabel>Reviewer shortcut · Break suggestion</SectionLabel>
        <View style={styles.breakChoices}>
          <ChoiceChip label="Short · 5 phút" onPress={() => onSetNextBreakKind('short')} selected={nextBreakKind === 'short'} />
          <ChoiceChip label="Long · 15 phút" onPress={() => onSetNextBreakKind('long')} selected={nextBreakKind === 'long'} />
        </View>
        <Text style={styles.boundaryCopy}>Chỉ đổi gợi ý mock; không implement production cadence.</Text>
      </PixelPanel>
      <PixelPanel tone="strong">
        <Text style={styles.feedbackTitle}>Có điều gì làm bạn mất nhịp?</Text>
        <Text style={styles.feedbackBody}>Gửi góp ý cho PixelDoro. Đây không phải đánh giá App Store hoặc Google Play.</Text>
        <SecondaryButton label="Góp ý cho PixelDoro" onPress={onOpenFeedback} />
      </PixelPanel>
      <Text style={styles.boundaryCopy}>Các lựa chọn này không được persist và reset local data chưa được nối.</Text>
    </PrototypeScreen>
  );
};

const styles = StyleSheet.create({
  settingRow: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'space-between' },
  settingCopy: { flex: 1, gap: 3 },
  settingTitle: { color: palette.textPrimary, fontSize: 16, fontWeight: '900' },
  settingBody: { color: palette.textSecondary, fontSize: 12, lineHeight: 18 },
  divider: { backgroundColor: palette.border, height: 1, opacity: 0.2 },
  breakChoices: { gap: 8 },
  boundaryCopy: { color: palette.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  feedbackTitle: { color: palette.textPrimary, fontSize: 19, fontWeight: '900' },
  feedbackBody: { color: palette.textSecondary, fontSize: 14, lineHeight: 21 },
});
