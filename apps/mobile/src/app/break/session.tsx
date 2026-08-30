import { useState } from 'react';
import { useRouter } from 'expo-router';

import { BreakResultScreen, BreakSessionScreen } from '@/presentation/features/break';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { usePrototypeBack } from '../use-prototype-back';

export default function BreakSessionRoute() {
  const router = useRouter();
  const [cancelRequestToken, setCancelRequestToken] = useState(0);
  const { activeSession, breakResult, resolveBreak } = usePrototype();
  const session = activeSession?.kind === 'break' ? activeSession : null;
  const goHome = () => router.replace('/(tabs)');

  usePrototypeBack(() => {
    if (breakResult === null) setCancelRequestToken((token) => token + 1);
    else goHome();
  });

  if (breakResult !== null && session === null) {
    return <BreakResultScreen onHome={goHome} result={breakResult} />;
  }

  return (
    <BreakSessionScreen
      cancelRequestToken={cancelRequestToken}
      onMissingSession={goHome}
      onResolve={resolveBreak}
      session={session}
    />
  );
}
