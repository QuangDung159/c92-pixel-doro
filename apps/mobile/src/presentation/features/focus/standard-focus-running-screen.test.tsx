import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { StandardFocusRunningScreen } from './standard-focus-running-screen';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useState: <TValue,>(value: TValue) => [value, vi.fn()] as const };
});
vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles }, Text: 'Text', View: 'View',
}));
vi.mock('@/presentation/components', () => ({
  ConfirmationModal: 'ConfirmationModal', CountdownDisplay: 'CountdownDisplay',
  InlineNotice: 'InlineNotice', PetVisualStatus: 'PetVisualStatus', PixelPanel: 'PixelPanel',
  ScreenHeader: 'ScreenHeader', ScreenShell: 'ScreenShell', SecondaryButton: 'SecondaryButton',
}));

const flatten = (node: ReactNode): ReactNode[] => Children.toArray(node).flatMap((value) => {
  if (!isValidElement<{ readonly children?: ReactNode }>(value)) return [value];
  if (value.type === Fragment) return flatten(value.props.children);
  return [value, ...flatten(value.props.children)];
});

const projection = {
  status: 'ready' as const, phase: 'running' as const, sessionId: 'focus-1',
  durationMinutes: 15, mode: 'relax' as const, workTag: 'coding' as const,
  startedAt: 1_000, endsAt: 901_000, remainingMs: 899_000, displaySeconds: 899,
};

describe('StandardFocusRunningScreen', () => {
  it('renders committed Relax countdown and cancel', () => {
    const tree = StandardFocusRunningScreen({
      projection, pet: { status: 'loading' }, cancelBusy: false, cancelError: null,
      onConfirmCancel: vi.fn(), onDismissPetFeedbackError: vi.fn(), onRetryPet: vi.fn(),
    });
    const elements = flatten(tree).filter(isValidElement) as ReactElement<Record<string, unknown>>[];
    expect(elements.find((item) => item.type === 'CountdownDisplay')?.props)
      .toMatchObject({ displaySeconds: 899, pending: false });
    expect(elements.find((item) => item.type === 'SecondaryButton')?.props)
      .toMatchObject({ disabled: false, label: 'Dừng phiên' });
    expect(JSON.stringify(tree)).not.toMatch(/reward|Break|Complete|Prototype/);
  });

  it('locks cancel at deadline pending', () => {
    const tree = StandardFocusRunningScreen({
      projection: { ...projection, phase: 'deadline_pending', remainingMs: 0, displaySeconds: 0 },
      pet: { status: 'loading' }, cancelBusy: false, cancelError: null,
      onConfirmCancel: vi.fn(), onDismissPetFeedbackError: vi.fn(), onRetryPet: vi.fn(),
    });
    const elements = flatten(tree).filter(isValidElement) as ReactElement<Record<string, unknown>>[];
    expect(elements.find((item) => item.type === 'CountdownDisplay')?.props)
      .toMatchObject({ pending: true });
    expect(elements.find((item) => item.type === 'SecondaryButton')?.props)
      .toMatchObject({ disabled: true, label: 'Đang chờ xác nhận…' });
  });
});
