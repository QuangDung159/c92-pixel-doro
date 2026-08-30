import { useRouter } from 'expo-router';

import { FocusResultScreen } from '@/presentation/features/focus';
import { usePrototype } from '@/presentation/prototype/prototype-context';

import { usePrototypeBack } from '../use-prototype-back';

export default function FocusResultRoute() {
  const router = useRouter();
  const {
    focusResult,
    nextBreakKind,
    setNextBreakKind,
    startBreak,
    startTrial,
  } = usePrototype();

  const goHome = () => router.replace('/(tabs)');
  usePrototypeBack(goHome);

  return (
    <FocusResultScreen
      nextBreakKind={nextBreakKind}
      onHome={goHome}
      onRetryFocus={() => router.replace('/focus/setup')}
      onRetryTrial={() => {
        startTrial();
        router.replace('/focus/session');
      }}
      onSetNextBreakKind={setNextBreakKind}
      onStartBreak={() => {
        startBreak();
        router.replace('/break/session');
      }}
      result={focusResult}
    />
  );
}
