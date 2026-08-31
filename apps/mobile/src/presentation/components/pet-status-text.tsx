import { StyleSheet, Text } from 'react-native';

import { palette } from '@/presentation/theme/palette';

export interface PetStatusTextProps {
  readonly label: string;
  readonly liveRegion?: 'none' | 'polite' | 'assertive';
}

export const PetStatusText = ({
  label,
  liveRegion,
}: PetStatusTextProps) => (
  <Text
    accessibilityLabel={label}
    accessibilityLiveRegion={liveRegion}
    accessibilityRole="text"
    style={styles.label}
  >
    {label}
  </Text>
);

const styles = StyleSheet.create({
  label: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
});
