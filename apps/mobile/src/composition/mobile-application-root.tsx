import { type PropsWithChildren, useEffect, useState } from 'react';

import { BootstrapBoundary } from '@/presentation/components/bootstrap-boundary';
import { MobileApplicationProvider } from '@/presentation/providers/mobile-application-context';

import { createMobileApplication } from './create-mobile-application';

export const MobileApplicationRoot = ({ children }: PropsWithChildren) => {
  const [application] = useState(createMobileApplication);

  useEffect(() => {
    void application.boot();
    return () => {
      void application.dispose();
    };
  }, [application]);

  return (
    <MobileApplicationProvider application={application}>
      <BootstrapBoundary>{children}</BootstrapBoundary>
    </MobileApplicationProvider>
  );
};
