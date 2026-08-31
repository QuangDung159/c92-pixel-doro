import { StyleSheet, Text, View } from 'react-native';

import {
  Button,
  InlineNotice,
  Panel,
  PetStage,
  ScreenHeader,
  ScreenShell,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

export interface OnboardingScreenProps {
  readonly onStartTrial: () => void;
  readonly startTrialEnabled: boolean;
}

export const OnboardingScreen = ({
  onStartTrial,
  startTrialEnabled,
}: OnboardingScreenProps) => (
  <ScreenShell>
    <ScreenHeader
      description="Một người bạn pixel nhỏ sẽ cùng làm, cùng nghỉ và cùng tiến bộ với bạn."
      eyebrow="FIRST USE · 1/1"
      title="Tập trung không còn là chuyện một mình."
    />
    <PetStage state="idle" />
    <Panel>
      <View style={styles.promiseRow}>
        <Text style={styles.number}>01</Text>
        <View style={styles.promiseCopy}>
          <Text style={styles.promiseTitle}>Cùng bắt đầu</Text>
          <Text style={styles.promiseBody}>Bạn tập trung, người bạn nhỏ cũng làm việc bên cạnh.</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.promiseRow}>
        <Text style={styles.number}>02</Text>
        <View style={styles.promiseCopy}>
          <Text style={styles.promiseTitle}>Nỗ lực thành tiến trình</Text>
          <Text style={styles.promiseBody}>Phiên hoàn thành sẽ biến thành XP, Coin và một căn phòng sống động hơn.</Text>
        </View>
      </View>
    </Panel>
    <InlineNotice>
      Bắt đầu bằng phiên dùng thử Relax 5 phút. Không cần chọn chế độ hay loại công việc.
    </InlineNotice>
    <Button
      disabled={!startTrialEnabled}
      label="Thử phiên 5 phút"
      onPress={onStartTrial}
    />
    <Text style={styles.decisionNote}>
      Người bạn mặc định trong MVP là Mèo Dev. Tên riêng và tính năng chọn Pet thuộc phase sau.
    </Text>
  </ScreenShell>
);

const styles = StyleSheet.create({
  promiseRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  number: { color: palette.accentDark, fontSize: 18, fontWeight: '900' },
  promiseCopy: { flex: 1, gap: 3 },
  promiseTitle: { color: palette.textPrimary, fontSize: 16, fontWeight: '900' },
  promiseBody: { color: palette.textSecondary, fontSize: 14, lineHeight: 20 },
  divider: { backgroundColor: palette.border, height: 2, opacity: 0.2 },
  decisionNote: { color: palette.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
