import type { PropsWithChildren } from 'react';
import { StyleSheet, Text } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export const SectionLabel = ({ children }: PropsWithChildren) => (
  <Text style={styles.label}>{children}</Text>
);

const styles = StyleSheet.create({
  label: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
