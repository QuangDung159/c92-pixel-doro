import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { MobileApplicationRoot } from '@/composition';
import { PrototypeProvider } from '@/presentation/prototype/prototype-context';

export const unstable_settings = {
  initialRouteName: '(onboarding)',
};

export default function RootLayout() {
  return (
    <MobileApplicationRoot>
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
