import { useRouter } from 'expo-router';

import { OnboardingScreen } from '@/presentation/features/onboarding';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { PetRouteVisibility } from '../pet-route-visibility';

export default function OnboardingRoute() {
  const router = useRouter();
  const { startTrial } = usePrototype();

  return (
    <PetRouteVisibility>
      <OnboardingScreen
        onStartTrial={() => {
          startTrial();
          router.push('/focus/session');
        }}
      />
    </PetRouteVisibility>
  );
}
