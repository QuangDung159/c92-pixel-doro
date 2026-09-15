import { useSyncExternalStore } from 'react';

import { ConfirmationDialog } from '@/presentation/components';
import { useMobileApplication } from '@/presentation/providers/mobile-application-context';

export const OtaUpdatePrompt = () => {
  const application = useMobileApplication();
  const projection = useSyncExternalStore(
    application.otaUpdate.subscribe,
    application.otaUpdate.getSnapshot,
    application.otaUpdate.getSnapshot,
  );
  const visible = projection.status === 'pending' && projection.prompt === 'visible';
  const reloadFailed = projection.status === 'pending' &&
    projection.lastError === 'RELOAD_FAILED';

  return (
    <ConfirmationDialog
      body={reloadFailed
        ? 'Bản cập nhật đã tải xong nhưng chưa thể khởi động lại. Bạn có thể thử lại hoặc tiếp tục làm việc.'
        : 'Bản cập nhật đã sẵn sàng. Khởi động lại nhanh để áp dụng ngay, hoặc tiếp tục làm việc và cập nhật sau.'}
      confirmLabel="Khởi động lại"
      confirmTone="primary"
      dismissLabel="Để sau"
      onConfirm={() => void application.otaUpdate.requestRestart()}
      onDismiss={() => application.otaUpdate.dismissPrompt()}
      title="Cập nhật PixelDoro"
      visible={visible}
    />
  );
};
