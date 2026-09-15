import { env } from "node:process";

import type { ConfigContext, ExpoConfig } from "expo/config";

const IOS_BUNDLE_IDENTIFIER = "com.dragonc92team.pixeldoro";
const ANDROID_APPLICATION_ID = "com.dragonc92team.pixeldoro";
const EAS_PROJECT_ID = "6f65fb79-ffe9-4fa6-9951-895f27bf0725";
// Increment both values manually before every production store build.
const IOS_BUILD_NUMBER = "1";
const ANDROID_VERSION_CODE = 1;

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = env.EXPO_PROJECT_ID ?? EAS_PROJECT_ID;
  const owner = env.EXPO_OWNER;

  return {
    ...config,
    name: "PixelDoro",
    slug: "pixeldoro",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/pixeldoro-icon-1024.png",
    scheme: "pixeldoro",
    userInterfaceStyle: "automatic",
    runtimeVersion: {
      policy: "appVersion",
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
      buildNumber: IOS_BUILD_NUMBER,
      supportsTablet: false,
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      package: ANDROID_APPLICATION_ID,
      versionCode: ANDROID_VERSION_CODE,
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          color: "#143D32",
        },
      ],
      "expo-sqlite",
      [
        "expo-audio",
        {
          enableBackgroundPlayback: false,
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
      "expo-updates",
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "16.4",
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
