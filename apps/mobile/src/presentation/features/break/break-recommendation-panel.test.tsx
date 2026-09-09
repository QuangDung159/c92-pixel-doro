import { Children, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { BreakRecommendationPanel } from './break-recommendation-panel';

const findByType = (
  node: ReactElement<Record<string, unknown>>,
  type: string,
): ReactElement<Record<string, unknown>> | undefined => {
  if (node.type === type) return node;
  for (const child of Children.toArray(node.props.children as ReactNode)) {
    if (typeof child === 'object' && child !== null && 'props' in child) {
      const found = findByType(child as ReactElement<Record<string, unknown>>, type);
      if (found !== undefined) return found;
    }
  }
  return undefined;
};

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('@/presentation/components', () => ({
  InlineNotice: 'InlineNotice', Panel: 'Panel', PrimaryButton: 'PrimaryButton',
  SecondaryButton: 'SecondaryButton',
}));

describe('BreakRecommendationPanel', () => {
  it.each([
    ['short', 'short_break', 5, 'Nghỉ ngắn · 5 phút'],
    ['long', 'long_break', 15, 'Nghỉ dài · 15 phút'],
  ] as const)('renders accessible %s type and duration without raw cadence count', (
    kind,
    sessionType,
    durationMinutes,
    label,
  ) => {
    const tree = BreakRecommendationPanel({
      projection: {
        status: 'ready', sourceSessionId: 'focus-1',
        recommendation: { kind, sessionType, durationMinutes } as never,
      },
      startProjection: { status: 'idle', sourceSessionId: 'focus-1' },
      onRetry: vi.fn(),
      onStartBreak: vi.fn(),
    });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain(label);
    expect(serialized).not.toMatch(/\/4/);
    expect(serialized).toContain(`Bắt đầu nghỉ ${durationMinutes} phút`);
  });

  it('keeps retry finite and does not guess Short on error', () => {
    const retry = vi.fn();
    const tree = BreakRecommendationPanel({
      projection: {
        status: 'error', sourceSessionId: 'focus-1',
        error: { code: 'BREAK_RECOMMENDATION_READ_FAILED' },
      },
      startProjection: { status: 'idle', sourceSessionId: 'focus-1' },
      onRetry: retry,
      onStartBreak: vi.fn(),
    }) as ReactElement<Record<string, unknown>>;
    const children = Children.toArray(
      tree.props.children as ReactNode,
    ) as ReactElement<Record<string, unknown>>[];
    const button = children.find((child) => child.type === 'SecondaryButton');
    expect(button?.props.label).toBe('Thử đọc lại');
    (button?.props.onPress as () => void)();
    expect(retry).toHaveBeenCalledOnce();
    expect(JSON.stringify(tree)).not.toContain('Nghỉ ngắn · 5 phút');
  });

  it('exposes the production Start callback for a ready recommendation', () => {
    const start = vi.fn();
    const tree = BreakRecommendationPanel({
      projection: {
        status: 'ready', sourceSessionId: 'focus-1',
        recommendation: { kind: 'short', sessionType: 'short_break', durationMinutes: 5 },
      },
      startProjection: { status: 'idle', sourceSessionId: 'focus-1' },
      onRetry: vi.fn(),
      onStartBreak: start,
    }) as ReactElement<Record<string, unknown>>;
    const button = findByType(tree, 'PrimaryButton');
    expect(button?.props.label).toBe('Bắt đầu nghỉ 5 phút');
    (button?.props.onPress as () => void)();
    expect(start).toHaveBeenCalledOnce();
  });
});
