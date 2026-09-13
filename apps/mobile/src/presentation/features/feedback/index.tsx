import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { FeedbackIssueCode, FeedbackProjection } from '@/application';
import { FEEDBACK_COMMENT_MAX_CODE_POINTS } from '@/application';
import {
  ChoiceChip,
  InlineNotice,
  PixelPanel,
  PrimaryButton,
  ScreenHeader,
  ScreenShell,
  SecondaryButton,
  SectionLabel,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

const issueCopy: Record<FeedbackIssueCode, string> = {
  SCORE_REQUIRED: 'Chọn từ 1 đến 5 sao trước khi gửi.',
  COMMENT_TOO_LONG: 'Lời nhắn vượt quá giới hạn cho phép. Hãy rút gọn rồi thử lại.',
  NETWORK_REQUIRED: 'Chưa gửi được góp ý. Kiểm tra kết nối rồi thử lại.',
  SUBMISSION_REJECTED: 'Dịch vụ chưa thể nhận góp ý này. Bạn có thể chỉnh sửa rồi thử lại.',
  PROVIDER_UNAVAILABLE: 'Kênh góp ý chưa được cấu hình cho build này.',
};

export interface FeedbackScreenProps {
  readonly projection: FeedbackProjection;
  readonly onBack: () => void;
  readonly onCloseSuccess: () => void;
  readonly onSetComment: (comment: string) => void;
  readonly onSetScore: (score: number) => void;
  readonly onSubmit: () => void;
}

const FeedbackRatingGroup = ({
  disabled,
  onSelect,
  score,
}: {
  readonly disabled: boolean;
  readonly onSelect: (score: number) => void;
  readonly score: number | null;
}) => (
  <View accessibilityRole="radiogroup" style={styles.scoreRow}>
    {[1, 2, 3, 4, 5].map((value) => (
      <ChoiceChip
        disabled={disabled}
        key={value}
        label={`${value} sao`}
        onPress={() => onSelect(value)}
        selected={score === value}
      />
    ))}
  </View>
);

const FeedbackCommentField = ({
  disabled,
  onChange,
  value,
}: {
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
  readonly value: string;
}) => (
  <>
    <TextInput
      accessibilityLabel="Nội dung góp ý tùy chọn"
      editable={!disabled}
      multiline
      onChangeText={onChange}
      placeholder="Điều gì giúp hoặc làm bạn mất nhịp?"
      placeholderTextColor={palette.textSecondary}
      style={styles.input}
      textAlignVertical="top"
      value={value}
    />
    <Text accessibilityLiveRegion="polite" style={styles.counter}>
      {Array.from(value).length}/{FEEDBACK_COMMENT_MAX_CODE_POINTS} ký tự
    </Text>
  </>
);

export const FeedbackScreen = ({
  projection,
  onBack,
  onCloseSuccess,
  onSetComment,
  onSetScore,
  onSubmit,
}: FeedbackScreenProps) => {
  if (projection.status === 'idle') return <ScreenShell />;
  if (projection.status === 'success') {
    return (
      <ScreenShell>
        <ScreenHeader
          description="Góp ý đã được gửi riêng cho team sản phẩm, không phải đánh giá trên cửa hàng."
          eyebrow="FEEDBACK · SENT"
          title="Cảm ơn bạn đã giúp PixelDoro tốt hơn."
        />
        <PixelPanel tone="strong">
          <Text accessibilityRole="alert" style={styles.success}>✓ Đã gửi góp ý</Text>
        </PixelPanel>
        <PrimaryButton label="Về Cài đặt" onPress={onCloseSuccess} />
      </ScreenShell>
    );
  }

  const busy = projection.status === 'submitting';
  const invalidComment = projection.issue === 'COMMENT_TOO_LONG';
  return (
    <ScreenShell>
      <ScreenHeader
        description="Phản hồi này dành cho team PixelDoro, không phải App Store hay Google Play."
        eyebrow="FEEDBACK"
        title="Nhịp hôm nay thế nào?"
      />
      {projection.issue === null ? null : (
        <InlineNotice announce>{issueCopy[projection.issue]}</InlineNotice>
      )}
      <PixelPanel>
        <SectionLabel>Điểm trải nghiệm</SectionLabel>
        <FeedbackRatingGroup
          disabled={busy}
          onSelect={onSetScore}
          score={projection.score}
        />
      </PixelPanel>
      <PixelPanel>
        <SectionLabel>Điều bạn muốn kể thêm · tùy chọn</SectionLabel>
        <FeedbackCommentField
          disabled={busy}
          onChange={onSetComment}
          value={projection.comment}
        />
      </PixelPanel>
      <PrimaryButton
        accessibilityLabel={projection.score === null
          ? 'Gửi góp ý, cần chọn điểm trải nghiệm trước'
          : 'Gửi góp ý'}
        busy={busy}
        disabled={projection.score === null || invalidComment}
        label={busy
          ? 'Đang gửi góp ý…'
          : projection.status === 'failure' ? 'Thử gửi lại' : 'Gửi góp ý'}
        onPress={onSubmit}
      />
      <SecondaryButton disabled={busy} label="Về Cài đặt" onPress={onBack} />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  input: {
    borderColor: palette.border,
    borderRadius: 5,
    borderWidth: 2,
    color: palette.textPrimary,
    fontSize: 16,
    lineHeight: 23,
    minHeight: 130,
    padding: 12,
  },
  counter: { color: palette.textSecondary, fontSize: 12, textAlign: 'right' },
  success: {
    color: palette.accentDark,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
});
