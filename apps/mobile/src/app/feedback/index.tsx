import { useRouter } from 'expo-router';

import { FeedbackScreen } from '@/presentation/features/feedback';

export default function FeedbackRoute() {
  const router = useRouter();
  return <FeedbackScreen onBack={() => router.back()} />;
}
