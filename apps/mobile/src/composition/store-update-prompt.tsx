import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import { checkForStoreVersionUpdate, type StoreVersionInfo } from '@/application';
import { StoreVersionGateway, type StorePlatform } from '@/infrastructure/platform/app-version/store-version.gateway';
import { ConfirmationDialog } from '@/presentation/components';

const INITIAL_CHECK_DELAY_MS = 1_000;

const configuredApplicationId = (): string | null => {
  if (Platform.OS === 'ios') return Constants.expoConfig?.ios?.bundleIdentifier ?? null;
  if (Platform.OS === 'android') return Constants.expoConfig?.android?.package ?? null;
  return null;
};

export const StoreUpdatePrompt = () => {
  const currentVersion = Application.nativeApplicationVersion;
  const applicationId = configuredApplicationId();
  const nativeApplicationId = Application.applicationId;
  const platform = Platform.OS === 'ios' || Platform.OS === 'android'
    ? Platform.OS as StorePlatform
    : null;
  const [availableUpdate, setAvailableUpdate] = useState<StoreVersionInfo | null>(null);
  const appState = useRef(AppState.currentState);
  const requestSequence = useRef(0);
  const [lookup] = useState(() => (
    applicationId === null || platform === null
      ? null
      : new StoreVersionGateway({
          applicationId,
          ...(process.env.EXPO_PUBLIC_APP_VERSION_MANIFEST_URL === undefined
            ? {}
            : { manifestUrl: process.env.EXPO_PUBLIC_APP_VERSION_MANIFEST_URL }),
          platform,
        })
  ));

  const checkVersion = useCallback(async () => {
    if (
      lookup === null ||
      applicationId === null ||
      applicationId !== nativeApplicationId
    ) return;

    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;
    const update = await checkForStoreVersionUpdate(currentVersion, lookup);
    if (requestId !== requestSequence.current) return;
    setAvailableUpdate(update);
  }, [applicationId, currentVersion, lookup, nativeApplicationId]);

  useEffect(() => {
    const timeout = setTimeout(() => void checkVersion(), INITIAL_CHECK_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [checkVersion]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        void checkVersion();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [checkVersion]);

  const openStore = () => {
    const storeUrl = availableUpdate?.storeUrl;
    if (storeUrl !== undefined) void Linking.openURL(storeUrl).catch(() => undefined);
  };

  return (
    <ConfirmationDialog
      body={availableUpdate === null
        ? ''
        : `Phiên bản ${availableUpdate.version} đã sẵn sàng. Cập nhật để nhận cải tiến mới nhất của PixelDoro.`}
      confirmLabel="Cập nhật ngay"
      confirmTone="primary"
      dismissible={false}
      onConfirm={openStore}
      onDismiss={() => undefined}
      title="Cần cập nhật PixelDoro"
      visible={availableUpdate !== null}
    />
  );
};
