import { useMemo, useSyncExternalStore } from 'react';

import type { SettingsProjection } from '@/application';
import { useMobileApplication } from './mobile-application-context';

export const useSettingsProjection = (): SettingsProjection => {
  const { settings } = useMobileApplication();
  return useSyncExternalStore(
    settings.subscribe,
    settings.getSnapshot,
    settings.getSnapshot,
  );
};

export const useSettingsActions = () => {
  const { settings } = useMobileApplication();
  return useMemo(() => ({
    activate: settings.activate,
    deactivate: settings.deactivate,
    dismissIssue: settings.dismissIssue,
    openSystemSettings: settings.openSystemSettings,
    resetAllLocalData: settings.resetAllLocalData,
    retry: settings.retry,
    setAnalyticsEnabled: settings.setAnalyticsEnabled,
    setDefaultMode: settings.setDefaultMode,
    setFocusDuration: settings.setFocusDuration,
    setHapticsEnabled: settings.setHapticsEnabled,
    setNotificationsEnabled: settings.setNotificationsEnabled,
    setSoundEnabled: settings.setSoundEnabled,
  }), [settings]);
};
