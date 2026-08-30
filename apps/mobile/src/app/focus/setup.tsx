import { useRouter } from 'expo-router';

import { FocusSetupScreen } from '@/presentation/features/focus';
import { usePrototype } from '@/presentation/prototype/prototype-context';

export default function FocusSetupRoute() {
  const router = useRouter();
  const {
    configuration,
    setDuration,
    setMode,
    setWorkTag,
    startFocus,
  } = usePrototype();

  return (
    <FocusSetupScreen
      configuration={configuration}
      onBack={() => router.replace('/(tabs)')}
      onSetDuration={setDuration}
      onSetMode={setMode}
      onSetWorkTag={setWorkTag}
      onStart={() => {
        startFocus();
        router.push('/focus/session');
      }}
    />
  );
}
