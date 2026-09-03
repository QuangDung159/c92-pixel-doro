import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describe, expect, it, vi } from 'vitest';

import { OnboardingTrialRunningScreen } from './onboarding-trial-running-screen';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useState: <TValue,>(value: TValue) => [value, vi.fn()] as const };
});

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

vi.mock('@/presentation/components', () => ({
  ConfirmationModal: 'ConfirmationModal',
  InlineNotice: 'InlineNotice',
  PetVisualStatus: 'PetVisualStatus',
  ScreenHeader: 'ScreenHeader',
  ScreenShell: 'ScreenShell',
  SecondaryButton: 'SecondaryButton',
}));

vi.mock('./trial-countdown', () => ({ TrialCountdown: 'TrialCountdown' }));

const flatten = (node: ReactNode): ReactNode[] =>
  Children.toArray(node).flatMap((value) => {
    if (!isValidElement<{ readonly children?: ReactNode }>(value)) return [value];
    if (value.type === Fragment) return flatten(value.props.children);
    return [value, ...flatten(value.props.children)];
  });

interface Props {
  readonly label?: string;
  readonly disabled?: boolean;
  readonly pending?: boolean;
  readonly visible?: boolean;
}

describe('OnboardingTrialRunningScreen', () => {
  it('renders the production running branch without prototype controls', () => {
    const tree = OnboardingTrialRunningScreen({
      projection: {
        status: 'ready',
        phase: 'running',
        sessionId: 'trial-1',
        endsAt: 301_000,
        remainingMs: 299_000,
        displaySeconds: 299,
      },
      pet: {
        status: 'ready',
        source: 'base',
        state: 'working',
        activeSessionId: 'trial-1',
        announcementId: 'pet-working',
        visualMode: 'loop',
      },
      cancelBusy: false,
      cancelError: null,
      onConfirmCancel: vi.fn(),
      onDismissPetFeedbackError: vi.fn(),
      onRetryPet: vi.fn(),
    });
    const elements = flatten(tree).filter(isValidElement) as ReactElement<Props>[];
    expect(elements.find((element) => element.type === 'TrialCountdown')?.props.pending).toBe(false);
    expect(elements.find((element) => element.type === 'SecondaryButton')?.props).toMatchObject({
      disabled: false,
      label: 'Dừng phiên',
    });
    expect(JSON.stringify(tree)).not.toMatch(/PrototypeBadge|MOCK COUNTDOWN|Complete|Strict/);
  });

  it('disables cancellation in deadline-pending', () => {
    const tree = OnboardingTrialRunningScreen({
      projection: {
        status: 'ready',
        phase: 'deadline_pending',
        sessionId: 'trial-1',
        endsAt: 301_000,
        remainingMs: 0,
        displaySeconds: 0,
      },
      pet: { status: 'loading' },
      cancelBusy: false,
      cancelError: null,
      onConfirmCancel: vi.fn(),
      onDismissPetFeedbackError: vi.fn(),
      onRetryPet: vi.fn(),
    });
    const elements = flatten(tree).filter(isValidElement) as ReactElement<Props>[];
    expect(elements.find((element) => element.type === 'SecondaryButton')?.props).toMatchObject({
      disabled: true,
      label: 'Đang xác nhận kết quả…',
    });
    expect(elements.find((element) => element.type === 'ConfirmationModal')?.props.visible).toBe(false);
  });
});
