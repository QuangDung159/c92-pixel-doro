import { useRouter } from 'expo-router';

import { OnboardingScreen } from '@/presentation/features/onboarding';
import { usePrototype } from '@/presentation/prototype/prototype-context';

export default function OnboardingRoute() {
  const router = useRouter();
  const { startTrial } = usePrototype();

  return (
    <OnboardingScreen
      onStartTrial={() => {
        startTrial();
        router.push('/focus/session');
      }}
    />
  );
}
