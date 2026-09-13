import type {
  AppDefaultMode,
  FocusNotificationPermission,
  SettingsIssueCode,
} from '@/application';
import {
  ChoiceChip,
  DurationControl,
  InlineNotice,
  PixelPanel,
  SecondaryButton,
  SectionLabel,
  ToggleRow,
} from '@/presentation/components';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/presentation/theme/palette';

const issueCopy: Record<SettingsIssueCode, string> = {
  SETTINGS_READ_FAILED: 'Không đọc được cài đặt đã lưu.',
  SETTINGS_WRITE_FAILED: 'Chưa lưu được thay đổi. Giá trị đã commit vẫn được giữ.',
  SETTINGS_REFRESH_FAILED: 'Thay đổi có thể đã lưu nhưng màn hình chưa đồng bộ. Hãy thử lại.',
  ANALYTICS_CLEANUP_REQUIRED: 'Analytics đã tắt. Cần thử lại để hoàn tất xóa hàng đợi và đổi mã ẩn danh.',
  NOTIFICATION_PERMISSION_FAILED: 'Chưa đọc được quyền thông báo của hệ điều hành.',
  NOTIFICATION_OS_BLOCKED: 'PixelDoro đang bật nhắc việc, nhưng hệ điều hành đang chặn thông báo.',
  NOTIFICATION_SYNC_FAILED: 'Tùy chọn đã lưu nhưng lịch thông báo chưa đồng bộ.',
  SYSTEM_SETTINGS_UNAVAILABLE: 'Không mở được Cài đặt hệ thống trên thiết bị này.',
  RESET_FAILED: 'Chưa thể xóa dữ liệu. Không có trạng thái thành công giả; dữ liệu đã commit vẫn được bảo vệ.',
};

export const SettingsIssueBanner = ({
  issue, onDismiss, onOpenSystemSettings, onRetry,
}: {
  readonly issue: SettingsIssueCode;
  readonly onDismiss: () => void;
  readonly onOpenSystemSettings: () => void;
  readonly onRetry: () => void;
}) => (
  <PixelPanel tone="danger">
    <InlineNotice announce>{issueCopy[issue]}</InlineNotice>
    {issue === 'NOTIFICATION_OS_BLOCKED' ? (
      <SecondaryButton label="Mở Cài đặt hệ thống" onPress={onOpenSystemSettings} />
    ) : null}
    {issue !== 'NOTIFICATION_OS_BLOCKED' && issue !== 'SYSTEM_SETTINGS_UNAVAILABLE' ? (
      <SecondaryButton label="Thử lại" onPress={onRetry} />
    ) : null}
    <SecondaryButton label="Đóng thông báo" onPress={onDismiss} />
  </PixelPanel>
);

export const FocusDefaultsSection = ({
  duration, mode, onSetDuration, onSetMode,
}: {
  readonly duration: number;
  readonly mode: AppDefaultMode;
  readonly onSetDuration: (minutes: number) => void;
  readonly onSetMode: (mode: AppDefaultMode) => void;
}) => (
  <PixelPanel>
    <SectionLabel>Focus mặc định</SectionLabel>
    <Text style={styles.help}>Áp dụng khi mở một Focus Setup mới; không đổi phiên đang chạy.</Text>
    <DurationControl max={120} min={15} onChange={onSetDuration}
      quickValues={[15, 25, 50]} step={5} value={duration} />
    <View accessibilityRole="radiogroup" style={styles.column}>
      <ChoiceChip label="Relax · có thể rời app" onPress={() => onSetMode('relax')} selected={mode === 'relax'} />
      <ChoiceChip label="Strict · grace 10 giây" onPress={() => onSetMode('strict')} selected={mode === 'strict'} />
    </View>
  </PixelPanel>
);

export const PreferenceSection = ({
  soundEnabled, hapticsEnabled, onSetSound, onSetHaptics,
}: {
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
  readonly onSetSound: (enabled: boolean) => void;
  readonly onSetHaptics: (enabled: boolean) => void;
}) => (
  <PixelPanel>
    <SectionLabel>Phản hồi nhẹ</SectionLabel>
    <ToggleRow body="Âm báo ngắn khi hoàn tất và nhận thưởng mới." label="Âm thanh" onValueChange={onSetSound} value={soundEnabled} />
    <View style={styles.divider} />
    <ToggleRow body="Rung nhẹ cho hành động quan trọng; nội dung không phụ thuộc vào rung." label="Rung phản hồi" onValueChange={onSetHaptics} value={hapticsEnabled} />
  </PixelPanel>
);

const permissionCopy = (permission: FocusNotificationPermission | 'checking' | 'unavailable') => {
  if (permission === 'allowed') return 'Hệ điều hành: đã cho phép.';
  if (permission === 'denied') return 'Hệ điều hành: đang chặn. Bạn có thể mở Cài đặt hệ thống.';
  if (permission === 'undetermined') return 'Hệ điều hành: chưa được hỏi; chỉ hỏi khi bạn chủ động bật.';
  if (permission === 'checking') return 'Đang kiểm tra quyền hệ điều hành…';
  return 'Chưa đọc được quyền hệ điều hành.';
};

export const NotificationSection = ({
  enabled, permission, onChange, onOpenSystemSettings,
}: {
  readonly enabled: boolean;
  readonly permission: FocusNotificationPermission | 'checking' | 'unavailable';
  readonly onChange: (enabled: boolean) => void;
  readonly onOpenSystemSettings: () => void;
}) => (
  <PixelPanel>
    <SectionLabel>Thông báo</SectionLabel>
    <ToggleRow body="Nhắc khi Focus hoặc Break kết thúc." label="Nhắc kết thúc phiên" onValueChange={onChange} value={enabled} />
    <Text accessibilityLiveRegion="polite" style={styles.status}>{permissionCopy(permission)}</Text>
    {permission === 'denied' ? (
      <SecondaryButton label="Mở Cài đặt hệ thống" onPress={onOpenSystemSettings} />
    ) : null}
  </PixelPanel>
);

export const DataControlSection = ({
  analyticsEnabled, resetBusy, onSetAnalytics, onRequestReset,
}: {
  readonly analyticsEnabled: boolean;
  readonly resetBusy: boolean;
  readonly onSetAnalytics: (enabled: boolean) => void;
  readonly onRequestReset: () => void;
}) => (
  <PixelPanel tone="strong">
    <SectionLabel>Quyền riêng tư & dữ liệu</SectionLabel>
    <ToggleRow body="Dữ liệu sử dụng ẩn danh, không có tài khoản. Tắt sẽ dừng capture, xóa hàng đợi và đổi mã ẩn danh." label="Anonymous analytics" onValueChange={onSetAnalytics} value={analyticsEnabled} />
    <View style={styles.divider} />
    <Text style={styles.dangerTitle}>Vùng nguy hiểm</Text>
    <Text style={styles.help}>Xóa lịch sử, tiến trình, Coin, vật phẩm và tùy chọn local; catalog và schema hợp lệ được giữ lại.</Text>
    <SecondaryButton busy={resetBusy} label="Xóa toàn bộ dữ liệu local" onPress={onRequestReset} />
  </PixelPanel>
);

export const FeedbackEntrySection = ({
  onOpenFeedback,
}: {
  readonly onOpenFeedback: () => void;
}) => (
  <PixelPanel>
    <SectionLabel>Góp ý</SectionLabel>
    <Text style={styles.help}>
      Chia sẻ điểm trải nghiệm và lời nhắn tùy chọn trực tiếp với team PixelDoro.
    </Text>
    <SecondaryButton label="Góp ý cho PixelDoro" onPress={onOpenFeedback} />
  </PixelPanel>
);

const styles = StyleSheet.create({
  column: { gap: 9 },
  divider: { backgroundColor: palette.border, height: 1, opacity: 0.2 },
  help: { color: palette.textSecondary, fontSize: 13, lineHeight: 19 },
  status: { color: palette.accentDark, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  dangerTitle: { color: palette.accentRed, fontSize: 16, fontWeight: '900' },
});
