import { createContext, type PropsWithChildren, useContext } from 'react';

export type PetAssetReviewScenario =
  | 'normal'
  | 'playback_failure'
  | 'state_frame_missing'
  | 'all_art_missing';

const reviewScenarios = new Set<PetAssetReviewScenario>([
  'playback_failure',
  'state_frame_missing',
  'all_art_missing',
]);

export const parsePetAssetReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): PetAssetReviewScenario =>
  enabled && reviewScenarios.has(value as PetAssetReviewScenario)
    ? value as PetAssetReviewScenario
    : 'normal';

const PetAssetReviewContext = createContext<PetAssetReviewScenario>('normal');

export const PetAssetReviewProvider = ({
  children,
  scenario,
}: PropsWithChildren<{ readonly scenario: PetAssetReviewScenario }>) => (
  <PetAssetReviewContext.Provider value={scenario}>
    {children}
  </PetAssetReviewContext.Provider>
);

export const usePetAssetReviewScenario = (): PetAssetReviewScenario =>
  useContext(PetAssetReviewContext);
