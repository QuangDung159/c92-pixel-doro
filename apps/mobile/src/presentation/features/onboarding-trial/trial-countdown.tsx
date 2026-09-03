import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

const formatCountdown = (displaySeconds: number): string => {
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const TrialCountdown = ({
  displaySeconds,
  pending,
}: {
  readonly displaySeconds: number;
  readonly pending: boolean;
}) => {
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  return (
    <View
      accessible
      accessibilityLabel={pending
        ? 'Phiên đã tới thời điểm kết thúc, đang chờ xác nhận kết quả'
        : `Còn ${minutes} phút ${seconds} giây`}
      style={styles.block}
    >
      <Text style={styles.value}>{formatCountdown(displaySeconds)}</Text>
      <Text
        accessibilityLiveRegion={pending ? 'polite' : 'none'}
        style={styles.caption}
      >
        {pending ? 'ĐANG XÁC NHẬN KẾT QUẢ…' : 'CỨ BẮT ĐẦU, RỒI NHỊP SẼ ĐẾN.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    backgroundColor: palette.textPrimary,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 3,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 26,
  },
  value: {
    color: palette.accentGold,
    fontSize: 62,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    letterSpacing: 2,
  },
  caption: {
    color: palette.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
