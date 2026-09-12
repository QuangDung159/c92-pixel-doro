import { useState } from 'react';

import type { AppDefaultMode, SettingsProjection } from '@/application';
import {
  ConfirmationDialog,
  ErrorState,
  LoadingState,
  ScreenHeader,
  ScreenShell,
} from '@/presentation/components';

import {
  DataControlSection,
  FocusDefaultsSection,
  NotificationSection,
  PreferenceSection,
  SettingsIssueBanner,
} from './settings-sections';

export interface SettingsScreenProps {
  readonly projection: SettingsProjection;
  readonly onActivateRetry: () => void;
  readonly onDismissIssue: () => void;
  readonly onOpenSystemSettings: () => void;
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
        busyDuration={busy('focusDurationMinutes')}
        busyMode={busy('defaultMode')}
        duration={projection.settings.focusDurationMinutes}
        mode={projection.settings.defaultMode}
        onSetDuration={onSetDuration}
        onSetMode={onSetMode}
      />
      <PreferenceSection
        hapticsBusy={busy('hapticsEnabled')}
        hapticsEnabled={projection.settings.hapticsEnabled}
        onSetHaptics={onSetHaptics}
        onSetSound={onSetSound}
        soundBusy={busy('soundEnabled')}
        soundEnabled={projection.settings.soundEnabled}
      />
      <NotificationSection
        busy={busy('notificationsEnabled')}
        enabled={projection.settings.notificationsEnabled}
        onChange={onSetNotifications}
        onOpenSystemSettings={onOpenSystemSettings}
        permission={projection.notificationPermission}
      />
      <DataControlSection
        analyticsBusy={busy('analyticsEnabled')}
        analyticsEnabled={projection.settings.analyticsEnabled}
        onRequestReset={() => setConfirmingReset(true)}
        onSetAnalytics={onSetAnalytics}
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
