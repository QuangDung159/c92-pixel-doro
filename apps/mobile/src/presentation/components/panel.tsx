import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export type PanelTone = 'default' | 'strong' | 'gold' | 'danger';

export const Panel = ({
  children,
  tone = 'default',
  style,
}: PropsWithChildren<{
  readonly tone?: PanelTone;
  readonly style?: ViewStyle;
}>) => (
  <View
    style={[
      styles.panel,
      tone === 'strong' && styles.strong,
      tone === 'gold' && styles.gold,
      tone === 'danger' && styles.danger,
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 3,
    gap: 12,
    padding: 18,
    shadowColor: palette.border,
    shadowOffset: { height: 5, width: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  strong: { backgroundColor: palette.surfaceStrong },
  gold: { backgroundColor: '#F6D986' },
  danger: { backgroundColor: '#F5C5B8' },
});
