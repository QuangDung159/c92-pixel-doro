import { describe, expect, it, vi } from 'vitest';
import { View } from 'react-native';

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
    const status = tree.props.children.filter(Boolean)[1];
    expect(status.type).toBe(PetStatusText);
    expect(status.props).toMatchObject({
      label: 'Người bạn đang chờ bạn',
    });
    expect(JSON.stringify(tree)).toContain('Người bạn đang chờ bạn');
  });

  it.each(['idle', 'working', 'breaking', 'celebrating', 'bugged'] as const)(
    'keeps optional room layers backward-compatible in %s without removing Pet or status', (state) => {
      const tree = PetStage({ state });
      const children = tree.props.children.filter(Boolean);
      expect(children).toHaveLength(2);
      expect(children[0].props.children.type).toBe(PetAnimationRenderer);
      expect(children[0].props.children.props.state).toBe(state);
      expect(children[1].type).toBe(PetStatusText);
    },
  );

  it('places approved scene nodes around the Pet while retaining the semantic status last', () => {
    const underlay = <View testID="room-underlay" />;
    const overlay = <View testID="room-overlay" />;
    const tree = PetStage({
      state: 'idle',
      sceneMode: 'room',
      sceneUnderlay: underlay,
      sceneOverlay: overlay,
    });
    expect(tree.props.children[0]).toBe(underlay);
    expect(tree.props.children[1].props.style).toMatchObject({
      top: '20%',
      transform: [{ scale: 0.4 }],
    });
    expect(tree.props.children[1].props.children.type).toBe(PetAnimationRenderer);
    expect(tree.props.children[2]).toBe(overlay);
    expect(tree.props.children[3].props).toMatchObject({
      accessibilityLabel: 'Người bạn đang chờ bạn',
      accessibilityRole: 'text',
    });
    expect(JSON.stringify(tree)).not.toContain('PetStatusText');
  });

  it('does not render room art when the scene is in focus mode', () => {
    const tree = PetStage({
      state: 'working',
      sceneMode: 'focus',
      sceneUnderlay: <View testID="room-underlay" />,
      sceneOverlay: <View testID="room-overlay" />,
    });
    expect(JSON.stringify(tree)).not.toContain('room-underlay');
    expect(JSON.stringify(tree)).not.toContain('room-overlay');
  });

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
