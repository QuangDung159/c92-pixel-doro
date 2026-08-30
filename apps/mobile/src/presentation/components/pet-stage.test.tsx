import { describe, expect, it, vi } from 'vitest';

import { PetStage } from './pet-stage';
import { PetStatusText } from './pet-status-text';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('PetStage', () => {
  it('communicates neutral Idle state without relying on color or artwork', () => {
    const tree = PetStage({ state: 'idle' });
    const status = tree.props.children[2];
    expect(status.type).toBe(PetStatusText);
    expect(status.props).toMatchObject({
      label: 'Người bạn đang chờ bạn',
    });
    expect(JSON.stringify(tree)).toContain('Người bạn đang chờ bạn');
    expect(JSON.stringify(tree)).not.toContain('Cat');
    expect(JSON.stringify(tree)).not.toContain('Dog');
    expect(JSON.stringify(tree)).not.toContain('Robot');
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
