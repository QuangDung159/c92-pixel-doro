import { Children, isValidElement, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { OnboardingScreen } from './index';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

vi.mock('@/presentation/components', () => ({
  Button: 'Button',
  InlineNotice: 'InlineNotice',
  Panel: 'Panel',
  PetStage: 'PetStage',
  ScreenHeader: 'ScreenHeader',
  ScreenShell: 'ScreenShell',
}));

describe('OnboardingScreen', () => {
  it('renders approved production Intro with a truthful disabled Start handoff', () => {
    const onStartTrial = vi.fn();
    const tree = OnboardingScreen({ onStartTrial, startTrialEnabled: false });
    const children = Children.toArray(tree.props.children);
    const button = children.find(
      (child): child is ReactElement<{
        readonly label: string;
        readonly disabled: boolean;
        readonly onPress: () => void;
      }> => isValidElement(child) && child.type === 'Button',
    );
    const pet = children.find(
      (child): child is ReactElement<{ readonly state: string }> =>
        isValidElement(child) && child.type === 'PetStage',
    );

    expect(tree.type).toBe('ScreenShell');
    expect(button?.props).toMatchObject({
      label: 'Thử phiên 5 phút',
      disabled: true,
      onPress: onStartTrial,
    });
    expect(pet?.props.state).toBe('idle');

    const rendered = JSON.stringify(tree);
    expect(rendered).toContain('Tập trung không còn là chuyện một mình.');
    expect(rendered).toContain('Mèo Dev');
    expect(rendered).toContain('Relax 5 phút');
    expect(rendered).not.toMatch(/PrototypeBadge|MOCK COUNTDOWN|Strict|ChoiceChip|Skip/);
  });

  it('renders committed-start busy and recoverable error props without prototype controls', () => {
    const tree = OnboardingScreen({
      onStartTrial: vi.fn(),
      startTrialEnabled: true,
      startTrialBusy: true,
      startTrialError: 'Chưa thể bắt đầu. Dữ liệu của bạn chưa thay đổi.',
    });
    const rendered = JSON.stringify(tree);
    expect(rendered).toContain('Đang bắt đầu phiên');
    expect(rendered).toContain('Dữ liệu của bạn chưa thay đổi');
    expect(rendered).not.toMatch(/PrototypeBadge|MOCK COUNTDOWN|Strict|ChoiceChip|Skip/);
  });
});
