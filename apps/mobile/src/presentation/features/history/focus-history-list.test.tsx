import { describe, expect, it, vi } from 'vitest';

import { FocusHistoryRow } from './focus-history-row';
import { FocusHistoryList } from './focus-history-list';

vi.mock('react-native', () => ({
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
  it('preserves input order and stable item identities', () => {
    const items = [
      {
        id: 'newer', status: 'completed' as const, workTag: 'coding' as const,
        configuredDurationMinutes: 25, endsAt: 2_000,
        scheduledEndLocalDate: '2026-09-11',
      },
      {
        id: 'older', status: 'failed' as const, workTag: 'reading' as const,
        configuredDurationMinutes: 15, endsAt: 1_000,
        scheduledEndLocalDate: '2026-09-10',
      },
    ];
    const rows = findAll(FocusHistoryList({ items }), FocusHistoryRow);
    expect(rows.map(({ props }) => (props.item as { id: string }).id))
      .toEqual(['newer', 'older']);
  });
});
