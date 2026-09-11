import type { FocusHistoryItemProjection } from '@pixeldoro/application';
import { StyleSheet, View } from 'react-native';

import { Panel, SectionLabel } from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

import { FocusHistoryRow } from './focus-history-row';

export const FocusHistoryList = ({
  items,
}: {
  readonly items: readonly FocusHistoryItemProjection[];
}) => (
  <Panel>
    <SectionLabel>Gần đây</SectionLabel>
    <View accessibilityRole="list">
      {items.map((item, index) => (
        <View key={item.id}>
          <FocusHistoryRow item={item} />
          {index === items.length - 1 ? null : <View style={styles.divider} />}
        </View>
      ))}
    </View>
  </Panel>
);

const styles = StyleSheet.create({
  divider: { backgroundColor: palette.border, height: 1, opacity: 0.2 },
});
