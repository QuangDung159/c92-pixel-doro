import { useRouter } from 'expo-router';

import { HomeScreen } from '@/presentation/features/home';
import { useHomeProfileProjection } from '@/presentation/providers/mobile-application-context';

export default function HomeRoute() {
  const router = useRouter();
  const profile = useHomeProfileProjection();
  return (
    <HomeScreen
      onStartFocus={() => router.push('/focus/setup')}
      profile={profile}
    />
  );
}
