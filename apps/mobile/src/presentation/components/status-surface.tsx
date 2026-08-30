import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { Panel } from './panel';
import { SecondaryButton } from './button';

export const LoadingState = ({ label }: { readonly label: string }) => (
  <Panel style={styles.panel}>
    <ActivityIndicator color={palette.accentDark} size="large" />
    <Text accessibilityLiveRegion="polite" style={styles.title}>
      {label}
    </Text>
    <View style={styles.skeletonWide} />
    <View style={styles.skeletonShort} />
  </Panel>
);

export const EmptyState = ({
  title,
  body,
}: {
  readonly title: string;
  readonly body: string;
}) => (
  <Panel style={styles.panel}>
    <Text accessibilityElementsHidden style={styles.emptyGlyph}>
      □
    </Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.body}>{body}</Text>
  </Panel>
);

export const ErrorState = ({
  title,
  body,
  onRetry,
}: {
  readonly title: string;
  readonly body: string;
  readonly onRetry: () => void;
}) => (
  <Panel tone="danger" style={styles.panel}>
    <Text accessibilityRole="alert" style={styles.title}>
      {title}
    </Text>
    <Text style={styles.body}>{body}</Text>
    <SecondaryButton label="Thử lại" onPress={onRetry} />
  </Panel>
);

const styles = StyleSheet.create({
  panel: { alignItems: 'center', justifyContent: 'center', minHeight: 260 },
  title: {
    color: palette.textPrimary,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  skeletonWide: {
    backgroundColor: palette.surfaceStrong,
    height: 18,
    marginTop: 8,
    width: '86%',
  },
  skeletonShort: {
    backgroundColor: palette.surfaceStrong,
    height: 18,
    width: '58%',
  },
  emptyGlyph: { color: palette.accentDark, fontSize: 52, fontWeight: '900' },
});
