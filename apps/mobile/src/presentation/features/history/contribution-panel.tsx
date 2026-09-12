import type { ContributionControllerProjection } from '@/application';
import { StyleSheet, View } from 'react-native';

import {
  InlineNotice,
  SecondaryButton,
  SectionLabel,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

import { ContributionDayRow } from './contribution-day-row';
import { ContributionGraphStrip } from './contribution-graph-strip';
import { ContributionLegend } from './contribution-legend';

export const ContributionPanel = ({
  onRetryInitial,
  onRetryRefresh,
  projection,
}: {
  readonly onRetryInitial: () => void;
  readonly onRetryRefresh: () => void;
  readonly projection: ContributionControllerProjection;
}) => (
  <View style={styles.panel}>
    <SectionLabel>7 ngày gần đây</SectionLabel>
    {projection.status === 'idle' || projection.status === 'loading' ? (
      <InlineNotice>Đang tính nhịp tập trung…</InlineNotice>
    ) : null}
    {projection.status === 'error' ? (
      <View style={styles.notice}>
        <InlineNotice announce>Chưa đọc được đóng góp theo ngày.</InlineNotice>
        <SecondaryButton label="Thử lại" onPress={onRetryInitial} />
      </View>
    ) : null}
    {projection.status === 'ready' ? (
      <>
        {projection.refresh === 'refreshing' ? (
          <InlineNotice>Đang cập nhật đóng góp…</InlineNotice>
        ) : null}
        {projection.refresh === 'error' ? (
          <View style={styles.notice}>
            <InlineNotice announce>Chưa cập nhật được đóng góp mới nhất.</InlineNotice>
            <SecondaryButton label="Thử lại" onPress={onRetryRefresh} />
          </View>
        ) : null}
        <ContributionGraphStrip days={projection.value.days} />
        <View accessibilityRole="list" style={styles.days}>
          {projection.value.days.map((day) => (
            <ContributionDayRow
              day={day}
              isToday={day.localDate === projection.value.endLocalDate}
              key={day.localDate}
            />
          ))}
        </View>
        <ContributionLegend />
      </>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 6,
    borderWidth: 2,
    gap: 10,
    padding: 14,
  },
  days: { gap: 0 },
  notice: { gap: 8 },
});
