import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/presentation/theme/palette';

export const ScreenShell = ({
  children,
  scrollable = true,
}: PropsWithChildren<{ readonly scrollable?: boolean }>) => (
  <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
    {scrollable ? (
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    ) : (
      <View style={[styles.content, styles.fixedContent]}>{children}</View>
    )}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: { backgroundColor: palette.background, flex: 1 },
  content: {
    alignSelf: 'center',
    gap: 20,
    maxWidth: 560,
    minHeight: '100%',
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 16,
    width: '100%',
  },
  fixedContent: { flex: 1 },
});
