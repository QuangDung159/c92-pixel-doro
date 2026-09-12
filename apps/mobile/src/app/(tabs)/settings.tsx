import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { SettingsScreen } from '@/presentation/features/settings';
import {
  useSettingsActions,
  useSettingsProjection,
} from '@/presentation/providers/settings-hooks';
import { useAppVisibility } from '@/presentation/providers/mobile-application-context';

export default function SettingsRoute() {
  const router = useRouter();
  const projection = useSettingsProjection();
  const actions = useSettingsActions();
  const visibility = useAppVisibility();
  const previousVisibility = useRef(visibility);

  useFocusEffect(useCallback(() => {
    void actions.activate();
    return actions.deactivate;
  }, [actions]));

  useEffect(() => {
    const previous = previousVisibility.current;
    previousVisibility.current = visibility;
    if (previous !== 'active' && visibility === 'active') void actions.activate();
  }, [actions, visibility]);

  return (
    <SettingsScreen
      onActivateRetry={() => { void actions.activate(); }}
      onDismissIssue={actions.dismissIssue}
      onOpenSystemSettings={() => { void actions.openSystemSettings(); }}
      onReset={actions.resetAllLocalData}
      onResetComplete={() => router.replace('/')}
      onRetry={() => { void actions.retry(); }}
      onSetAnalytics={(enabled) => { void actions.setAnalyticsEnabled(enabled); }}
      onSetDuration={(minutes) => { void actions.setFocusDuration(minutes); }}
      onSetHaptics={(enabled) => { void actions.setHapticsEnabled(enabled); }}
      onSetMode={(mode) => { void actions.setDefaultMode(mode); }}
      onSetNotifications={(enabled) => { void actions.setNotificationsEnabled(enabled); }}
      onSetSound={(enabled) => { void actions.setSoundEnabled(enabled); }}
      projection={projection}
    />
  );
}
