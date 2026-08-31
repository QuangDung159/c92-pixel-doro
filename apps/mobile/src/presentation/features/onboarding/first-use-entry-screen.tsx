import type { FirstUseEntryProjection } from '@/application';
import { ErrorState, LoadingState, ScreenShell } from '@/presentation/components';

export interface FirstUseEntryScreenProps {
  readonly projection: FirstUseEntryProjection;
  readonly onRetry: () => void;
}

export const FirstUseEntryScreen = ({
  projection,
  onRetry,
}: FirstUseEntryScreenProps) => (
  <ScreenShell>
    {projection.status === 'error' ? (
      <ErrorState
        body="Dữ liệu của bạn vẫn an toàn. Hãy thử lại để mở đúng không gian của bạn."
        onRetry={onRetry}
        title="Chưa thể mở PixelDoro"
      />
    ) : (
      <LoadingState
        label={
          projection.status === 'ready'
            ? 'Đang mở không gian của bạn…'
            : 'Đang kiểm tra hành trình đầu tiên…'
        }
      />
    )}
  </ScreenShell>
);
