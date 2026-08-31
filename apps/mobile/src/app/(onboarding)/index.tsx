import { OnboardingScreen } from '@/presentation/features/onboarding';

import { PetRouteVisibility } from '../pet-route-visibility';

export default function OnboardingRoute() {
  return (
    <PetRouteVisibility>
      <OnboardingScreen
        onStartTrial={() => undefined}
        startTrialEnabled={false}
      />
    </PetRouteVisibility>
  );
}
