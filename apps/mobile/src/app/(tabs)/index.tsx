import { useRouter } from 'expo-router';

import { HomeScreen } from '@/presentation/features/home';

export default function HomeRoute() {
  const router = useRouter();
  return <HomeScreen onStartFocus={() => router.push('/focus/setup')} />;
}
