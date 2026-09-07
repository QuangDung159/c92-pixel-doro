import { useLocalSearchParams, useRouter } from 'expo-router';
import { ErrorState, ScreenShell } from '@/presentation/components';
import { StandardFocusResultBranch } from './standard-focus-result-branch';
import { TrialResultBranch } from './trial-result-branch';

export default function FocusResultRoute() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ readonly sessionId?: string | string[] }>();
  if (sessionId === undefined) return <TrialResultBranch />;
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    return <ScreenShell><ErrorState title="Chưa thể mở kết quả"
      body="Định danh kết quả không hợp lệ. PixelDoro sẽ không dùng một phiên khác thay thế."
      onRetry={() => router.replace('/(tabs)')} /></ScreenShell>;
  }
  return <StandardFocusResultBranch sessionId={sessionId} />;
}
