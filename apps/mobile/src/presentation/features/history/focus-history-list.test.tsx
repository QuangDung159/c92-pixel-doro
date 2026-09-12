import { describe, expect, it, vi } from 'vitest';

import { FocusHistoryRow } from './focus-history-row';
import { FocusHistoryList } from './focus-history-list';
import { HistoryDateSectionHeader } from './history-date-section-header';

vi.mock('react-native', () => ({
  SectionList: 'SectionList',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  View: 'View',
}));
vi.mock('@/presentation/components', () => ({
  Panel: 'Panel',
  SectionLabel: 'SectionLabel',
}));

const findAll = (
  node: unknown,
  type: unknown,
  found: { readonly props: Record<string, unknown> }[] = [],
): { readonly props: Record<string, unknown> }[] => {
  if (node === null || typeof node !== 'object') return found;
  const element = node as { readonly type?: unknown; readonly props?: Record<string, unknown> };
  if (element.type === type && element.props !== undefined) found.push({ props: element.props });
  const children = element.props?.children;
  const candidates = Array.isArray(children) ? children : [children];
  candidates.forEach((child) => findAll(child, type, found));
  return found;
};

describe('FocusHistoryList', () => {
  it('passes grouped order, stable keys and non-sticky headers to one SectionList', () => {
    const newer = {
        id: 'newer', status: 'completed' as const, workTag: 'coding' as const,
        configuredDurationMinutes: 25, endsAt: 2_000,
        scheduledEndLocalDate: '2026-09-11',
      };
    const older = {
        id: 'older', status: 'failed' as const, workTag: 'reading' as const,
        configuredDurationMinutes: 15, endsAt: 1_000,
        scheduledEndLocalDate: '2026-09-10',
      };
    const items = [newer, older];
    const tree = FocusHistoryList({
      onLoadMore: vi.fn(),
      onRetryLoadMore: vi.fn(),
      pagination: 'idle',
      sections: [
        { localDate: '2026-09-11', completedMinutes: 25, items: [newer] },
        { localDate: '2026-09-10', completedMinutes: 0, items: [older] },
      ],
    });
    const list = findAll(tree, 'SectionList')[0]!;
    const sections = list.props.sections as readonly { data: readonly { id: string }[] }[];
    expect(sections.map((section) => section.data.map((item) => item.id)))
      .toEqual([['newer'], ['older']]);
    expect((list.props.keyExtractor as (item: { id: string }) => string)(newer))
      .toBe('newer');
    expect(list.props.stickySectionHeadersEnabled).toBe(false);
    expect((list.props.renderItem as (input: { item: typeof items[number] }) => unknown)({
      item: newer,
    })).toMatchObject({ type: FocusHistoryRow });
    expect((list.props.renderSectionHeader as (input: {
      section: { localDate: string; completedMinutes: number };
    }) => unknown)({
      section: { localDate: '2026-09-11', completedMinutes: 25 },
    })).toMatchObject({ type: HistoryDateSectionHeader });
  });
});
