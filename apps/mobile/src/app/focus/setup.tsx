import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { FocusSetupScreen } from '@/presentation/features/focus';
import {
  useStandardFocusSetupActions,
  useStandardFocusSetupProjection,
} from '@/presentation/providers/standard-focus-hooks';

export default function FocusSetupRoute() {
  const router = useRouter();
  const projection = useStandardFocusSetupProjection();
  const { reset, setDuration, setMode, setWorkTag, start } = useStandardFocusSetupActions();
  useFocusEffect(useCallback(() => {
    reset();
  }, [reset]));

  return (
    <FocusSetupScreen
      projection={projection}
      onBack={() => router.replace('/(tabs)')}
      onSetDuration={setDuration}
      onSetMode={setMode}
      onSetWorkTag={setWorkTag}
      onStart={() => {
        void start().then((result) => {
          if (result.ok) router.push('/focus/session');
        });
      }}
    />
  );
}
