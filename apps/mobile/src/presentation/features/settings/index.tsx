import { useState } from 'react';

import type { AppDefaultMode, AppSettingsRecord, SettingsProjection } from '@/application';
import {
  ConfirmationDialog,
  ErrorState,
  LoadingState,
  ScreenHeader,
  ScreenShell,
} from '@/presentation/components';

import {
  DataControlSection,
  FeedbackEntrySection,
  FocusDefaultsSection,
  NotificationSection,
  PreferenceSection,
  SettingsIssueBanner,
} from './settings-sections';

type BackgroundSettingsDraft = Partial<Pick<
  AppSettingsRecord,
  | 'focusDurationMinutes'
  | 'defaultMode'
  | 'soundEnabled'
  | 'hapticsEnabled'
  | 'notificationsEnabled'
  | 'analyticsEnabled'
>>;

export interface SettingsScreenProps {
  readonly projection: SettingsProjection;
  readonly onActivateRetry: () => void;
  readonly onDismissIssue: () => void;
  readonly onOpenSystemSettings: () => void;
  readonly onOpenFeedback: () => void;
  readonly onReset: () => Promise<boolean>;
  readonly onResetComplete: () => void;
  readonly onRetry: () => void;
  readonly onSetAnalytics: (enabled: boolean) => void;
  readonly onSetDuration: (minutes: number) => void;
  readonly onSetHaptics: (enabled: boolean) => void;
  readonly onSetMode: (mode: AppDefaultMode) => void;
  readonly onSetNotifications: (enabled: boolean) => void;
  readonly onSetSound: (enabled: boolean) => void;
}

export const SettingsScreen = ({
  projection,
  onActivateRetry,
  onDismissIssue,
  onOpenSystemSettings,
  onOpenFeedback,
  onReset,
  onResetComplete,
  onRetry,
  onSetAnalytics,
  onSetDuration,
  onSetHaptics,
  onSetMode,
  onSetNotifications,
  onSetSound,
}: SettingsScreenProps) => {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [draft, setDraft] = useState<BackgroundSettingsDraft>({});

  if (projection.status === 'idle' || projection.status === 'loading') {
    return <ScreenShell><LoadingState label="Đang đọc cài đặt…" /></ScreenShell>;
  }
  if (projection.status === 'error') {
    return (
      <ScreenShell>
        <ErrorState
          body="Dữ liệu hiện tại chưa được thay đổi. Hãy thử đọc lại."
          onRetry={onActivateRetry}
          title="Chưa thể mở Cài đặt"
        />
      </ScreenShell>
    );
  }

  const busy = (key: typeof projection.busy[number]) => projection.busy.includes(key);
  const resetBusy = busy('reset');
  const current = <Key extends keyof BackgroundSettingsDraft>(
    key: Key,
  ): AppSettingsRecord[Key] => {
    const draftValue = draft[key];
    return busy(key) && draftValue !== undefined
      ? draftValue as AppSettingsRecord[Key]
      : projection.settings[key];
  };
  const stage = (
    key: keyof BackgroundSettingsDraft,
    value: BackgroundSettingsDraft[keyof BackgroundSettingsDraft],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  return (
    <ScreenShell>
      <ScreenHeader
        description="Các lựa chọn được lưu trên thiết bị và vẫn có hiệu lực khi mở lại ứng dụng."
        eyebrow="SETTINGS"
        title="Cài PixelDoro theo nhịp của bạn."
      />
      {projection.issue === null ? null : (
        <SettingsIssueBanner
          issue={projection.issue}
          onDismiss={onDismissIssue}
          onOpenSystemSettings={onOpenSystemSettings}
          onRetry={onRetry}
        />
      )}
      <FocusDefaultsSection
        duration={current('focusDurationMinutes')}
        mode={current('defaultMode')}
        onSetDuration={(minutes) => {
          onSetDuration(minutes);
          stage('focusDurationMinutes', minutes);
        }}
        onSetMode={(mode) => {
          onSetMode(mode);
          stage('defaultMode', mode);
        }}
      />
      <PreferenceSection
        hapticsEnabled={current('hapticsEnabled')}
        onSetHaptics={(enabled) => {
          onSetHaptics(enabled);
          stage('hapticsEnabled', enabled);
        }}
        onSetSound={(enabled) => {
          onSetSound(enabled);
          stage('soundEnabled', enabled);
        }}
        soundEnabled={current('soundEnabled')}
      />
      <NotificationSection
        enabled={current('notificationsEnabled')}
        onChange={(enabled) => {
          onSetNotifications(enabled);
          stage('notificationsEnabled', enabled);
        }}
        onOpenSystemSettings={onOpenSystemSettings}
        permission={projection.notificationPermission}
      />
      <FeedbackEntrySection onOpenFeedback={onOpenFeedback} />
      <DataControlSection
        analyticsEnabled={current('analyticsEnabled')}
        onRequestReset={() => setConfirmingReset(true)}
        onSetAnalytics={(enabled) => {
          onSetAnalytics(enabled);
          stage('analyticsEnabled', enabled);
        }}
        resetBusy={resetBusy}
      />
      <ConfirmationDialog
        body="Lịch sử, XP, Coin, vật phẩm và mọi tùy chọn trên thiết bị sẽ bị xóa. Không thể hoàn tác."
        busy={resetBusy}
        busyLabel="Đang xóa dữ liệu…"
        confirmLabel="Xóa toàn bộ dữ liệu"
        dismissLabel="Giữ dữ liệu"
        onConfirm={() => {
          void onReset().then((ok) => {
            if (ok) {
              setConfirmingReset(false);
              onResetComplete();
            }
          });
        }}
        onDismiss={() => setConfirmingReset(false)}
        title="Xóa toàn bộ dữ liệu local?"
        visible={confirmingReset}
      />
    </ScreenShell>
  );
};
