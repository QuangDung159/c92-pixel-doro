import { type PropsWithChildren, useEffect, useState } from 'react';

import { BootstrapBoundary } from '@/presentation/components/bootstrap-boundary';
import {
  parsePetAssetReviewScenario,
  PetAssetReviewProvider,
} from '@/presentation/animation/pet-asset-review-context';
import { MobileApplicationProvider } from '@/presentation/providers/mobile-application-context';
import { ReducedMotionProvider } from '@/presentation/providers/reduced-motion-context';

import { createMobileApplication } from './create-mobile-application';

export const MobileApplicationRoot = ({ children }: PropsWithChildren) => {
  const [application] = useState(createMobileApplication);
  const [petAssetReviewScenario] = useState(() => parsePetAssetReviewScenario(
    process.env.EXPO_PUBLIC_EPIC_04_ASSET_FIXTURE,
    typeof __DEV__ !== 'undefined' && __DEV__,
  ));

  useEffect(() => {
    void application.boot();
    return () => {
      void application.dispose();
    };
  }, [application]);

  return (
    <MobileApplicationProvider application={application}>
      <ReducedMotionProvider>
        <PetAssetReviewProvider scenario={petAssetReviewScenario}>
          <BootstrapBoundary>{children}</BootstrapBoundary>
        </PetAssetReviewProvider>
      </ReducedMotionProvider>
    </MobileApplicationProvider>
  );
};
