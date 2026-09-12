import type {
  FocusHistoryDateSection,
  FocusHistoryItemProjection,
} from '@pixeldoro/application';
import type { ReactElement, ReactNode } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { Panel, SectionLabel } from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

import { FocusHistoryRow } from './focus-history-row';
import { HistoryDateSectionHeader } from './history-date-section-header';
import {
  HistoryPaginationFooter,
  type HistoryPaginationStatus,
} from './history-pagination-footer';

interface ListSection {
  readonly localDate: string;
  readonly completedMinutes: number;
  readonly data: readonly FocusHistoryItemProjection[];
}

export const FocusHistoryList = ({
  contributionHeader,
  emptyState,
  onLoadMore,
  onRetryLoadMore,
  pagination,
  sections,
}: {
  readonly contributionHeader?: ReactNode;
  readonly emptyState?: ReactElement | null;
  readonly onLoadMore: () => void;
  readonly onRetryLoadMore: () => void;
  readonly pagination: HistoryPaginationStatus;
  readonly sections: readonly FocusHistoryDateSection[];
}) => {
  const listSections: readonly ListSection[] = sections.map((section) => ({
    localDate: section.localDate,
    completedMinutes: section.completedMinutes,
    data: section.items,
  }));
  return (
    <Panel style={styles.panel}>
      <SectionList
        accessibilityRole="list"
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        keyExtractor={(item) => item.id}
        ListFooterComponent={(
          <HistoryPaginationFooter
            onLoadMore={onLoadMore}
            onRetry={onRetryLoadMore}
            status={pagination}
          />
        )}
        ListEmptyComponent={emptyState}
        ListHeaderComponent={(
          <View style={styles.header}>
            {contributionHeader}
            <SectionLabel>Gần đây</SectionLabel>
          </View>
        )}
        renderItem={({ item }) => <FocusHistoryRow item={item} />}
        renderSectionHeader={({ section }) => (
          <HistoryDateSectionHeader
            completedMinutes={section.completedMinutes}
            localDate={section.localDate}
          />
        )}
        sections={listSections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </Panel>
  );
};

const styles = StyleSheet.create({
  panel: { flex: 1, minHeight: 0 },
  content: { paddingBottom: 4 },
  divider: { backgroundColor: palette.border, height: 1, opacity: 0.2 },
  header: { gap: 18 },
});
