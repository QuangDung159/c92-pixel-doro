import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export const InlineNotice = ({
  children,
  announce = false,
}: {
  readonly children: ReactNode;
  readonly announce?: boolean;
}) => (
  <View style={styles.notice}>
    <Text accessibilityLiveRegion={announce ? 'polite' : 'none'} style={styles.text}>
      {children}
    </Text>
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
