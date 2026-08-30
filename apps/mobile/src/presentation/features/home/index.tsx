import type { HomeProfileProjection } from '@pixeldoro/application';
import { StyleSheet, Text, View } from 'react-native';

import {
  LoadingState,
  Panel,
  PetStage,
  PrimaryButton,
  ScreenHeader,
  ScreenShell,
  StatDisplay,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

export interface HomeScreenProps {
  readonly profile: HomeProfileProjection | null;
  readonly onStartFocus: () => void;
}

export const HomeScreen = ({ profile, onStartFocus }: HomeScreenProps) => {
  const progressWidth = `${profile?.levelProgressPercent ?? 0}%` as `${number}%`;

  return (
    <ScreenShell>
      <ScreenHeader
        description="Một căn phòng nhỏ cho những nỗ lực lớn."
        eyebrow="PET ROOM · HÔM NAY"
        title="Chào bạn trở lại."
      />

      {profile === null ? (
        <LoadingState label="Đang mở Pet Room…" />
      ) : (
        <>
          <PetStage state="idle" />
          <View accessibilityRole="summary" style={styles.statsRow}>
            <StatDisplay label="Level" value={String(profile.level)} />
            <StatDisplay label="XP" value={String(profile.totalXp)} />
            <StatDisplay label="Coin" value={String(profile.coinBalance)} />
          </View>
          <Panel tone="strong">
            <Text style={styles.cardEyebrow}>TIẾP THEO</Text>
            <Text style={styles.cardTitle}>Sẵn sàng cho một phiên 25 phút?</Text>
            <Text style={styles.cardBody}>
              Bạn có thể đổi thời lượng, chế độ và loại công việc trước khi bắt đầu.
            </Text>
            <PrimaryButton label="Bắt đầu tập trung" onPress={onStartFocus} />
          </Panel>
          <Panel>
            <Text style={styles.cardEyebrow}>TIẾN TRÌNH ĐỒNG HÀNH</Text>
            <View
              accessibilityLabel={`Tiến trình Level ${profile.level}: ${profile.levelProgressPercent} phần trăm`}
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: profile.levelProgressPercent,
              }}
              style={styles.progressTrack}
            >
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.cardBody}>
              Còn {profile.xpToNextLevel} XP để đạt Level {profile.level + 1}.
            </Text>
          </Panel>
        </>
      )}
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 9 },
  cardEyebrow: {
    color: palette.accentDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardTitle: {
    color: palette.textPrimary,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 27,
  },
  cardBody: { color: palette.textSecondary, fontSize: 14, lineHeight: 21 },
  progressTrack: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderWidth: 2,
    height: 22,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: palette.accentGold, height: '100%' },
});
