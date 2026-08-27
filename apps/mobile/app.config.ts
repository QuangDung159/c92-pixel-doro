import type { ConfigContext, ExpoConfig } from 'expo/config';

const IOS_BUNDLE_IDENTIFIER = 'com.dunglu.pixeldoro';
const ANDROID_APPLICATION_ID = 'com.dunglu.pixeldoro';

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EXPO_PROJECT_ID;
  const owner = process.env.EXPO_OWNER;

  return {
    ...config,
    name: 'PixelDoro',
    slug: 'pixeldoro',
    version: '0.1.0',
    orientation: 'portrait',
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
      supportsTablet: true,
    },
    android: {
      package: ANDROID_APPLICATION_ID,
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      'expo-router',
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
