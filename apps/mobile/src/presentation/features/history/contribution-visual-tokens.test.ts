import { describe, expect, it } from 'vitest';

import { Palette } from '@/presentation/theme/palette';

import { contributionVisualTokens } from './contribution-visual-tokens';

const relativeLuminance = (hex: string): number => {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0);
};

const contrastRatio = (first: string, second: string): number => {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
};

describe('contributionVisualTokens', () => {
  it('maps every semantic band to the approved fill and adaptive border tokens', () => {
    expect({
      zero: contributionVisualTokens('zero'),
      low: contributionVisualTokens('low'),
      medium: contributionVisualTokens('medium'),
      high: contributionVisualTokens('high'),
      peak: contributionVisualTokens('peak'),
    }).toEqual({
      zero: { fillColor: Palette.light.background, borderColor: Palette.light.border },
      low: { fillColor: Palette.light.surface, borderColor: Palette.light.border },
      medium: { fillColor: Palette.light.surfaceStrong, borderColor: Palette.light.border },
      high: { fillColor: Palette.light.accent, borderColor: Palette.light.border },
      peak: { fillColor: Palette.light.accentDark, borderColor: Palette.light.white },
    });
  });

  it('keeps every fill and border pair at or above 3:1 contrast', () => {
    for (const intensity of ['zero', 'low', 'medium', 'high', 'peak'] as const) {
      const tokens = contributionVisualTokens(intensity);
      expect(contrastRatio(tokens.fillColor, tokens.borderColor), intensity).toBeGreaterThanOrEqual(3);
    }
  });
});
