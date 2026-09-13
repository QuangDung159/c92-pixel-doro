import { useMemo, useSyncExternalStore } from 'react';

import type { FeedbackProjection } from '@/application';

import { useMobileApplication } from './mobile-application-context';

export const useFeedbackProjection = (): FeedbackProjection => {
  const { feedback } = useMobileApplication();
  return useSyncExternalStore(
    feedback.subscribe,
    feedback.getSnapshot,
    feedback.getSnapshot,
  );
};

export const useFeedbackActions = () => {
  const { feedback } = useMobileApplication();
  return useMemo(() => ({
    activate: feedback.activate,
    deactivate: feedback.deactivate,
    setComment: feedback.setComment,
    setScore: feedback.setScore,
    submit: feedback.submit,
  }), [feedback]);
};
