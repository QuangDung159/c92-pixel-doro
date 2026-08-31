import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export interface ScreenHeaderProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
}

export const ScreenHeader = ({
  eyebrow,
  title,
  description,
}: ScreenHeaderProps) => (
  <View style={styles.header}>
    <Text style={styles.eyebrow}>{eyebrow}</Text>
    <Text accessibilityRole="header" style={styles.title}>
      {title}
    </Text>
    {description === undefined ? null : (
      <Text style={styles.description}>{description}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  header: { gap: 8 },
  eyebrow: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 39,
  },
  description: { color: palette.textSecondary, fontSize: 16, lineHeight: 24 },
});
