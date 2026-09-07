import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { MobileApplicationRoot } from '@/composition';
import { PrototypeProvider } from '@/presentation/prototype/prototype-context';
import { StandardFocusNotificationNavigationBridge } from './standard-focus-notification-navigation-bridge';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <MobileApplicationRoot>
      <StandardFocusNotificationNavigationBridge />
      <PrototypeProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ animation: 'fade', headerShown: false }}>
          <Stack.Screen name="focus/session" options={{ gestureEnabled: false }} />
          <Stack.Screen name="break/session" options={{ gestureEnabled: false }} />
        </Stack>
      </PrototypeProvider>
    </MobileApplicationRoot>
  );
}
