import { useState } from 'react';
import { useRouter } from 'expo-router';

import { FocusSessionScreen } from '@/presentation/features/focus';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { usePrototypeBack } from '../use-prototype-back';

export default function FocusSessionRoute() {
  const router = useRouter();
  const [cancelRequestToken, setCancelRequestToken] = useState(0);
  const { activeSession, resolveFocus } = usePrototype();
  const session =
    activeSession?.kind === 'trial' || activeSession?.kind === 'focus'
      ? activeSession
      : null;

  usePrototypeBack(() => setCancelRequestToken((token) => token + 1));

  return (
    <FocusSessionScreen
      cancelRequestToken={cancelRequestToken}
      onMissingSession={() => router.replace('/(tabs)')}
      onResolve={(outcome) => {
        resolveFocus(outcome);
        router.replace('/focus/result');
      }}
      session={session}
    />
  );
}
