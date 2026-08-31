import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export const InlineNotice = ({ children }: { readonly children: ReactNode }) => (
  <View style={styles.notice}>
    <Text style={styles.text}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  notice: {
    backgroundColor: palette.surface,
    borderLeftColor: palette.accentDark,
    borderLeftWidth: 5,
    padding: 13,
  },
  text: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
});
