import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export interface PlaceholderScreenProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
}

export const PlaceholderScreen = ({
  eyebrow,
  title,
  description,
}: PlaceholderScreenProps) => (
  <SafeAreaView style={styles.safeArea}>
    <View
      accessible
      accessibilityLabel={`${title}. ${description}`}
      style={styles.container}
    >
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.petPlaceholder}>
        <Text accessibilityLabel="Pet placeholder" style={styles.petText}>
          [ •ᴗ• ]
        </Text>
      </View>
      <Text style={styles.note}>Foundation placeholder · chưa chứa gameplay rule</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 28,
  },
  eyebrow: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: palette.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 420,
    textAlign: 'center',
  },
  petPlaceholder: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 3,
    height: 124,
    justifyContent: 'center',
    marginVertical: 10,
    width: 164,
  },
  petText: {
    color: palette.textPrimary,
    fontSize: 30,
    fontWeight: '700',
  },
  note: {
    color: palette.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});

