import { describe, expect, it, vi } from 'vitest';

import { BreakStartedScreen } from './break-started-screen';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useState: <TValue,>(value: TValue) => [value, vi.fn()] as const };
});
vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text', View: 'View',
}));
vi.mock('@/presentation/components', () => ({
  ConfirmationDialog: 'ConfirmationDialog', CountdownDisplay: 'CountdownDisplay',
  InlineNotice: 'InlineNotice', Panel: 'Panel', SecondaryButton: 'SecondaryButton',
  PetVisualStatus: 'PetVisualStatus', PrimaryButton: 'PrimaryButton',
  ScreenHeader: 'ScreenHeader', ScreenShell: 'ScreenShell',
}));

const session = { status: 'running' as const, sessionId: 'break-1', kind: 'short' as const,
  durationMinutes: 5 as const, startedAt: 10, endsAt: 300_010 };
const base = { pet: { status: 'loading' as const }, onDismissPetFeedbackError: vi.fn(),
  onHome: vi.fn(), onRetryPet: vi.fn(), appVisible: true, cancelBusy: false,
  cancelError: null, onConfirmCancel: vi.fn() };

describe('BreakStartedScreen', () => {
  it('renders timestamp countdown and no Pause, Strict or reward action', () => {
    const tree = BreakStartedScreen({ ...base, projection: {
      status: 'ready', phase: 'running', session, remainingMs: 300_000, displaySeconds: 300,
    } });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('Nghỉ ngắn · 5 phút');
    expect(serialized).toContain('CountdownDisplay');
    expect(serialized).not.toContain('PrimaryButton');
    expect(serialized).toContain('Dừng phiên');
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

  it('renders exact cancelled Result with Home and no countdown/reward card', () => {
    const tree = BreakStartedScreen({ ...base, projection: {
      status: 'ready', phase: 'cancelled',
      session: { ...session, status: 'cancelled', resolvedAt: 2_000 },
    } });
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('Phiên nghỉ đã dừng');
    expect(serialized).toContain('CANCELLED');
    expect(serialized).toContain('Về Home');
    expect(serialized).not.toContain('CountdownDisplay');
    expect(serialized).not.toMatch(/RewardSummary|ProgressionSummary|StatDisplay/);
  });
});
