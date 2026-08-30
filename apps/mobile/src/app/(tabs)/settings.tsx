import { useRouter } from 'expo-router';

import { SettingsScreen } from '@/presentation/features/settings';
import { usePrototype } from '@/presentation/prototype/prototype-context';

export default function SettingsRoute() {
  const router = useRouter();
  const { nextBreakKind, setNextBreakKind } = usePrototype();

  return (
    <SettingsScreen
      nextBreakKind={nextBreakKind}
      onOpenFeedback={() => router.push('/feedback')}
      onSetNextBreakKind={setNextBreakKind}
    />
  );
}
