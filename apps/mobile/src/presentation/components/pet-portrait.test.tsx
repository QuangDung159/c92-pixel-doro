import { describe, expect, it, vi } from 'vitest';

import { PetPortrait } from './pet-portrait';

vi.mock('react-native', () => ({
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  View: 'View',
}));

describe('PetPortrait base-state poses', () => {
  it('keeps Idle upright without activity props', () => {
    const rendered = JSON.stringify(PetPortrait({ state: 'idle' }));

    expect(rendered).not.toContain('pet-working-desk');
    expect(rendered).not.toContain('pet-breaking-cushion');
  });

  it('renders a focused static pose for Working', () => {
    const rendered = JSON.stringify(PetPortrait({ state: 'working' }));

    expect(rendered).toContain('pet-working-desk');
    expect(rendered).not.toContain('pet-breaking-cushion');
  });

  it('renders a resting static pose for Breaking', () => {
    const rendered = JSON.stringify(PetPortrait({ state: 'breaking' }));

    expect(rendered).toContain('pet-breaking-cushion');
    expect(rendered).not.toContain('pet-working-desk');
  });

  it('renders a distinct positive still pose for Celebrate', () => {
    expect(JSON.stringify(PetPortrait({ state: 'celebrating' }))).toContain(
      'pet-celebration-sparks',
    );
  });

  it('renders a distinct short-lived still pose for Bugged', () => {
    expect(JSON.stringify(PetPortrait({ state: 'bugged' }))).toContain(
      'pet-bugged-glitches',
    );
  });
});
