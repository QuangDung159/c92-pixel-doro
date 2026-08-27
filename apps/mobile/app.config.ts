import { env } from 'node:process';

import type { ConfigContext, ExpoConfig } from 'expo/config';

const IOS_BUNDLE_IDENTIFIER = 'com.dragonc92team.pixeldoro';
const ANDROID_APPLICATION_ID = 'com.dragonc92team.pixeldoro';
const EAS_PROJECT_ID = '6f65fb79-ffe9-4fa6-9951-895f27bf0725';

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = env.EXPO_PROJECT_ID ?? EAS_PROJECT_ID;
  const owner = env.EXPO_OWNER;

  return {
    ...config,
    name: 'PixelDoro',
    slug: 'pixeldoro',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/images/pixeldoro-icon-1024.png',
    scheme: 'pixeldoro',
    userInterfaceStyle: 'automatic',
    runtimeVersion: {
      policy: 'appVersion',
    },
    ...(owner === undefined ? {} : { owner }),
    ...(projectId === undefined
      ? {}
      : {
          updates: { url: `https://u.expo.dev/${projectId}` },
          extra: { eas: { projectId } },
        }),
    ios: {
      bundleIdentifier: IOS_BUNDLE_IDENTIFIER,
      supportsTablet: false,
    },
    android: {
      package: ANDROID_APPLICATION_ID,
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      'expo-router',
      'expo-sqlite',
      'expo-updates',
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '16.4',
          },
          android: {
            minSdkVersion: 24,
            compileSdkVersion: 36,
            targetSdkVersion: 36,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  };
};
