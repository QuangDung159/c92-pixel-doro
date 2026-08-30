import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  ChoiceChip,
  ErrorState,
  LoadingState,
  PixelPanel,
  PrimaryButton,
  PrototypeBadge,
  PrototypeScreen,
  ScreenHeader,
  SecondaryButton,
  SectionLabel,
} from '@/presentation/components/prototype-ui';
import { palette } from '@/presentation/theme/palette';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export const FeedbackScreen = ({ onBack }: { readonly onBack: () => void }) => {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  if (submitState === 'submitting') {
    return (
      <PrototypeScreen>
        <PrototypeBadge />
        <LoadingState label="Đang gửi góp ý mock…" />
        <SecondaryButton label="Mô phỏng lỗi mạng" onPress={() => setSubmitState('error')} />
        <PrimaryButton label="Mô phỏng thành công" onPress={() => setSubmitState('success')} />
      </PrototypeScreen>
    );
  }

  if (submitState === 'error') {
    return (
      <PrototypeScreen>
        <PrototypeBadge />
        <ErrorState body="Core focus loop vẫn dùng được. Nội dung mock được giữ trong memory để bạn thử lại." onRetry={() => setSubmitState('submitting')} title="Chưa gửi được góp ý" />
        <SecondaryButton label="Quay lại chỉnh sửa" onPress={() => setSubmitState('idle')} />
      </PrototypeScreen>
    );
  }

  if (submitState === 'success') {
    return (
      <PrototypeScreen>
        <PrototypeBadge />
        <ScreenHeader description="Không có request mạng thật nào được gửi." eyebrow="FEEDBACK SENT · MOCK" title="Cảm ơn bạn đã giúp PixelDoro tốt hơn." />
        <PixelPanel tone="strong">
          <Text style={styles.successGlyph}>✓</Text>
          <Text style={styles.successCopy}>Góp ý mock đã hoàn thành. Đây không phải rating trên cửa hàng ứng dụng.</Text>
        </PixelPanel>
        <PrimaryButton label="Về Cài đặt" onPress={onBack} />
      </PrototypeScreen>
    );
  }

  return (
    <PrototypeScreen>
      <PrototypeBadge />
      <ScreenHeader description="Phản hồi này dành cho team PixelDoro, không phải App Store hay Google Play." eyebrow="FEEDBACK" title="Nhịp hôm nay thế nào?" />
      <PixelPanel>
        <SectionLabel>Điểm trải nghiệm</SectionLabel>
        <View accessibilityRole="radiogroup" style={styles.scoreRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <ChoiceChip key={value} label={`${value}★`} onPress={() => setScore(value)} selected={score === value} />
          ))}
        </View>
      </PixelPanel>
      <PixelPanel>
        <SectionLabel>Điều bạn muốn kể thêm · tùy chọn</SectionLabel>
        <TextInput
          accessibilityLabel="Nội dung góp ý tùy chọn"
          multiline
          onChangeText={setComment}
          placeholder="Điều gì giúp hoặc làm bạn mất nhịp?"
          placeholderTextColor={palette.textSecondary}
          style={styles.input}
          value={comment}
        />
      </PixelPanel>
      {score === null ? <Text accessibilityRole="alert" style={styles.validation}>Chọn từ 1 đến 5 sao để gửi feedback mock.</Text> : null}
      <PrimaryButton disabled={score === null} label="Gửi góp ý mock" onPress={() => setSubmitState('submitting')} />
      <SecondaryButton label="Về Cài đặt" onPress={onBack} />
    </PrototypeScreen>
  );
};

const styles = StyleSheet.create({
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  input: { borderColor: palette.border, borderRadius: 5, borderWidth: 2, color: palette.textPrimary, fontSize: 15, minHeight: 130, padding: 12, textAlignVertical: 'top' },
  validation: { color: palette.accentRed, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  successGlyph: { color: palette.accentDark, fontSize: 52, fontWeight: '900', textAlign: 'center' },
  successCopy: { color: palette.textPrimary, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
