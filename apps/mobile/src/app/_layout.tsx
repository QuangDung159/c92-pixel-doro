import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { MobileApplicationRoot } from '@/composition';

export default function RootLayout() {
  return (
    <MobileApplicationRoot>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </MobileApplicationRoot>
  );
}
