import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { OnboardingScreen } from '@/presentation/features/onboarding';
import { useStartOnboardingTrial } from '@/presentation/providers/mobile-application-context';

import { PetRouteVisibility } from '../pet-route-visibility';

export default function OnboardingRoute() {
  const router = useRouter();
  const startOnboardingTrial = useStartOnboardingTrial();
  const operation = useRef<Promise<void> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = (): void => {
    if (operation.current !== null) return;
    setBusy(true);
    setError(null);
    const pending = startOnboardingTrial().then((result) => {
      if (result.ok) {
        router.replace('/focus/session');
        return;
      }
      setError(
        result.error.kind === 'start_onboarding_trial_error' &&
          result.error.code === 'SESSION_START_CONFLICT'
          ? 'Bạn đang có một phiên khác. Hãy mở lại phiên đang chạy.'
          : 'Chưa thể bắt đầu. Dữ liệu của bạn chưa thay đổi.',
      );
    }).finally(() => {
      if (operation.current === pending) operation.current = null;
      setBusy(false);
    });
    operation.current = pending;
  };

  return (
    <PetRouteVisibility>
      <OnboardingScreen
        onStartTrial={start}
        startTrialBusy={busy}
        startTrialEnabled
        startTrialError={error}
      />
    </PetRouteVisibility>
  );
}
