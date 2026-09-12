import { describe, expect, it, vi } from 'vitest';

import { ContributionPanel } from './contribution-panel';
import { ContributionDayRow } from './contribution-day-row';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  View: 'View',
}));
vi.mock('@/presentation/components', () => ({
  InlineNotice: 'InlineNotice',
  SecondaryButton: 'SecondaryButton',
  SectionLabel: 'SectionLabel',
}));

const actions = { onRetryInitial: vi.fn(), onRetryRefresh: vi.fn() };

const findAll = (
  node: unknown,
  type: unknown,
  found: { readonly props: Record<string, unknown> }[] = [],
): { readonly props: Record<string, unknown> }[] => {
  if (node === null || typeof node !== 'object') return found;
  const element = node as { readonly type?: unknown; readonly props?: Record<string, unknown> };
  if (element.type === type && element.props !== undefined) found.push({ props: element.props });
  const children = element.props?.children;
  (Array.isArray(children) ? children : [children]).forEach((child) => findAll(child, type, found));
  return found;
};

describe('ContributionPanel', () => {
  it('renders seven ready days and refresh state without final colors', () => {
    const days = Array.from({ length: 7 }, (_, index) => ({
      localDate: `2026-09-${String(index + 6).padStart(2, '0')}`,
      completedMinutes: index === 6 ? 25 : 0,
      completedSessionCount: index === 6 ? 1 : 0,
      intensity: index === 6 ? 'medium' as const : 'zero' as const,
    }));
    const tree = ContributionPanel({
      ...actions,
      projection: {
        status: 'ready',
        refresh: 'refreshing',
        value: { startLocalDate: '2026-09-06', endLocalDate: '2026-09-12', days },
      },
    });
    expect(JSON.stringify(tree)).toContain('7 ngày gần đây');
    expect(JSON.stringify(tree)).toContain('Đang cập nhật đóng góp');
    expect(findAll(tree, ContributionDayRow)).toHaveLength(7);
  });

  it('keeps initial and stale errors local with the correct Retry intent', () => {
    const initial = ContributionPanel({
      ...actions,
      projection: { status: 'error', code: 'CONTRIBUTION_READ_FAILED' },
    });
    expect(JSON.stringify(initial)).toContain('Chưa đọc được đóng góp theo ngày');
    expect(findAll(initial, 'SecondaryButton')[0]?.props.onPress).toBe(actions.onRetryInitial);

    const stale = ContributionPanel({
      ...actions,
      projection: {
        status: 'ready', refresh: 'error', value: {
          startLocalDate: '2026-09-06', endLocalDate: '2026-09-12', days: [],
        },
      },
    });
    expect(JSON.stringify(stale)).toContain('Chưa cập nhật được đóng góp mới nhất');
    expect(findAll(stale, 'SecondaryButton')[0]?.props.onPress).toBe(actions.onRetryRefresh);
  });
});
