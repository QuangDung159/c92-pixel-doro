import { describe, expect, it, vi } from 'vitest';

import { BreakStartedScreen } from './break-started-screen';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text', View: 'View',
}));
vi.mock('@/presentation/components', () => ({
  CountdownDisplay: 'CountdownDisplay', InlineNotice: 'InlineNotice', Panel: 'Panel',
  PetVisualStatus: 'PetVisualStatus', PrimaryButton: 'PrimaryButton',
  ScreenHeader: 'ScreenHeader', ScreenShell: 'ScreenShell',
}));

const session = { status: 'running' as const, sessionId: 'break-1', kind: 'short' as const,
  durationMinutes: 5 as const, startedAt: 10, endsAt: 300_010 };
const base = { pet: { status: 'loading' as const }, onDismissPetFeedbackError: vi.fn(),
  onHome: vi.fn(), onRetryPet: vi.fn() };

describe('BreakStartedScreen', () => {
  it('renders timestamp countdown and no Pause, Strict or reward action', () => {
    const tree = BreakStartedScreen({ ...base, projection: {
      status: 'ready', phase: 'running', session, remainingMs: 300_000, displaySeconds: 300,
    } });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('Nghỉ ngắn · 5 phút');
    expect(serialized).toContain('CountdownDisplay');
    expect(serialized).not.toContain('PrimaryButton');
  });

  it('renders committed completion with Home and zero-reward copy', () => {
    const tree = BreakStartedScreen({ ...base, projection: {
      status: 'ready', phase: 'completed',
      session: { ...session, status: 'completed', resolvedAt: 301_000 },
    } });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('Phiên nghỉ đã hoàn thành');
    expect(serialized).toContain('Về Home');
    expect(serialized).toContain('không tạo XP hoặc Coin');
    expect(serialized).not.toContain('CountdownDisplay');
  });
});
