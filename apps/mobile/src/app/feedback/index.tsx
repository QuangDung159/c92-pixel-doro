import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { FeedbackScreen } from '@/presentation/features/feedback';
import {
  useFeedbackActions,
  useFeedbackProjection,
} from '@/presentation/providers/feedback-hooks';

export default function FeedbackRoute() {
  const router = useRouter();
  const projection = useFeedbackProjection();
  const actions = useFeedbackActions();
  useFocusEffect(useCallback(() => {
    actions.activate();
    return actions.deactivate;
  }, [actions]));
  return (
    <FeedbackScreen
      onBack={() => router.back()}
      onCloseSuccess={() => router.back()}
      onSetComment={actions.setComment}
      onSetScore={actions.setScore}
      onSubmit={() => { void actions.submit(); }}
      projection={projection}
    />
  );
}
