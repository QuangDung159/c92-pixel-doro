import { useSyncExternalStore } from 'react';

import { useMobileApplication } from '@/presentation/providers/mobile-application-context';

import { OtaUpdatePrompt } from './ota-update-prompt';
import { otaPromptOwnsModal } from './update-prompt-policy';
import { StoreUpdatePrompt } from './store-update-prompt';

export const UpdatePrompts = () => {
  const application = useMobileApplication();
  const ota = useSyncExternalStore(
    application.otaUpdate.subscribe,
    application.otaUpdate.getSnapshot,
    application.otaUpdate.getSnapshot,
  );

  return (
    <>
      <StoreUpdatePrompt suppressed={otaPromptOwnsModal(ota)} />
      <OtaUpdatePrompt />
    </>
  );
};
