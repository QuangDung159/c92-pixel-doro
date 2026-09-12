import type { ContributionIntensityBand } from '@pixeldoro/application';

import { palette } from '@/presentation/theme/palette';

export interface ContributionVisualTokens {
  readonly borderColor: string;
  readonly fillColor: string;
}

const visualTokens: Readonly<Record<ContributionIntensityBand, ContributionVisualTokens>> = {
  zero: { fillColor: palette.background, borderColor: palette.border },
  low: { fillColor: palette.surface, borderColor: palette.border },
  medium: { fillColor: palette.surfaceStrong, borderColor: palette.border },
  high: { fillColor: palette.accent, borderColor: palette.border },
  peak: { fillColor: palette.accentDark, borderColor: palette.white },
};

export const contributionVisualTokens = (
  intensity: ContributionIntensityBand,
): ContributionVisualTokens => visualTokens[intensity];
