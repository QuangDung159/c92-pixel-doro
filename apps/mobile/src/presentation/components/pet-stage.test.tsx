import { describe, expect, it, vi } from 'vitest';

import { PetStage } from './pet-stage';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

describe('PetStage', () => {
  it('communicates neutral Idle state without relying on color or artwork', () => {
    const tree = PetStage({ state: 'idle' });
    expect(tree.props).toMatchObject({
      accessible: true,
      accessibilityLabel: 'Người bạn đang chờ bạn',
    });
    expect(JSON.stringify(tree)).toContain('Người bạn đang chờ bạn');
    expect(JSON.stringify(tree)).not.toContain('Cat');
    expect(JSON.stringify(tree)).not.toContain('Dog');
    expect(JSON.stringify(tree)).not.toContain('Robot');
  });
});
