import { describe, expect, it, vi } from 'vitest';

import { PetAnimationRenderer } from '@/presentation/animation/pet-animation-renderer';
import { PetStage } from './pet-stage';
import { PetStatusText } from './pet-status-text';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('PetStage', () => {
  it('communicates Idle state without relying on color or artwork', () => {
    const tree = PetStage({ state: 'idle' });
    const status = tree.props.children[1];
    expect(status.type).toBe(PetStatusText);
    expect(status.props).toMatchObject({
      label: 'Người bạn đang chờ bạn',
    });
    expect(JSON.stringify(tree)).toContain('Người bạn đang chờ bạn');
  });

  it.each(['idle', 'working', 'breaking', 'celebrating', 'bugged'] as const)(
    'keeps placeholder room decor hidden in %s without removing Pet or status', (state) => {
      const tree = PetStage({ state });
      expect(tree.props.children).toHaveLength(2);
      expect(tree.props.children[0].type).toBe(PetAnimationRenderer);
      expect(tree.props.children[0].props.state).toBe(state);
      expect(tree.props.children[1].type).toBe(PetStatusText);
    },
  );

  it('keeps one semantic status owner outside the decorative animation', () => {
    const status = PetStatusText({
      label: 'Người bạn đang ăn mừng cùng bạn',
      liveRegion: 'polite',
    });
    expect(status.props).toMatchObject({
      accessibilityLabel: 'Người bạn đang ăn mừng cùng bạn',
      accessibilityLiveRegion: 'polite',
      accessibilityRole: 'text',
    });
  });
});
