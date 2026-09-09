import type { BreakRecommendationProjection } from '@/application';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import {
  InlineNotice,
  Panel,
  PrimaryButton,
  SecondaryButton,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

export interface BreakRecommendationPanelProps {
  readonly projection: BreakRecommendationProjection;
  readonly onRetry: () => void;
  readonly onReviewStartBreak?: () => void;
}

export const BreakRecommendationPanel = ({
  projection,
  onRetry,
  onReviewStartBreak,
}: BreakRecommendationPanelProps) => {
  if (projection.status === 'idle') return null;

  if (projection.status === 'loading') {
    return <Panel style={styles.panel}>
      <ActivityIndicator
        accessibilityLabel="Đang đọc nhịp nghỉ đã lưu"
        accessibilityRole="progressbar"
        color={palette.accentDark}
      />
      <Text accessibilityLiveRegion="polite" style={styles.loading}>
        Đang đọc nhịp nghỉ đã lưu…
      </Text>
    </Panel>;
  }

  if (projection.status === 'error') {
    return <Panel tone="danger" style={styles.panel}>
      <Text accessibilityRole="alert" style={styles.title}>
        Chưa đọc được nhịp nghỉ đã lưu.
      </Text>
      <Text style={styles.body}>
        Bạn có thể thử lại hoặc về Home. PixelDoro sẽ không tự chọn một phiên nghỉ khác.
      </Text>
      <SecondaryButton label="Thử đọc lại" onPress={onRetry} />
    </Panel>;
  }

  const isLong = projection.recommendation.kind === 'long';
  const title = isLong ? 'Nghỉ dài · 15 phút' : 'Nghỉ ngắn · 5 phút';
  return <Panel tone={isLong ? 'gold' : 'strong'} style={styles.panel}>
    <Text style={styles.eyebrow}>BƯỚC TIẾP THEO LÀ DO BẠN CHỌN</Text>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.body}>
      {isLong
        ? 'Đã đến lúc hai bạn dành một khoảng nghỉ dài để lấy lại nhịp.'
        : 'Một khoảng nghỉ ngắn sẽ giúp hai bạn sẵn sàng cho phiên tiếp theo.'}
    </Text>
    {onReviewStartBreak === undefined ? null : <>
      <PrimaryButton
        accessibilityLabel={`Bắt đầu ${title.toLocaleLowerCase('vi-VN')}`}
        label={`Bắt đầu nghỉ ${projection.recommendation.durationMinutes} phút`}
        onPress={onReviewStartBreak}
      />
      <InlineNotice>
        Bản review chỉ kiểm tra CTA; phiên nghỉ chưa được tạo ở Story này.
      </InlineNotice>
    </>}
  </Panel>;
};

const styles = StyleSheet.create({
  panel: { alignItems: 'stretch' },
  eyebrow: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  title: { color: palette.textPrimary, fontSize: 21, fontWeight: '900' },
  body: { color: palette.textSecondary, fontSize: 15, lineHeight: 22 },
  loading: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
});
