import { useCallback, useRef, useState } from 'react';
import type { StoreReviewRequestOutcome } from '@/application';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { HomeScreen } from '@/presentation/features/home';
import {
  useHomeProfileProjection,
  useDismissPetTerminalFeedbackError,
  usePetCompanionRefresh,
  usePetVisualProjection,
  useRoomDecorationsActions,
  useRoomDecorationsProjection,
  useEpic11ReviewFixtureAvailable,
  useEpic11ReviewFixtureLabel,
  useRequestStoreReviewAtHome,
} from '@/presentation/providers/mobile-application-context';

import { PetRouteVisibility } from '../pet-route-visibility';

export default function HomeRoute() {
  const router = useRouter();
  const { reviewToken } = useLocalSearchParams<{
    readonly reviewToken?: string | string[];
  }>();
  const requestStoreReview = useRequestStoreReviewAtHome();
  const reviewFixtureAvailable = useEpic11ReviewFixtureAvailable();
  const reviewFixtureLabel = useEpic11ReviewFixtureLabel();
  const [reviewFixtureOutcome, setReviewFixtureOutcome] =
    useState<StoreReviewRequestOutcome | null>(null);
  const lastReviewToken = useRef<string | null>(null);
  const profile = useHomeProfileProjection();
  const pet = usePetVisualProjection();
  const refreshPet = usePetCompanionRefresh();
  const dismissPetFeedbackError = useDismissPetTerminalFeedbackError();
  const room = useRoomDecorationsProjection();
  const {
    activate: activateRoom,
    deactivate: deactivateRoom,
    retry: retryRoom,
  } = useRoomDecorationsActions();

  useFocusEffect(
    useCallback(() => {
      let focused = true;
      void refreshPet();
      void activateRoom();
      if (
        typeof reviewToken === 'string' && reviewToken.trim() &&
        lastReviewToken.current !== reviewToken
      ) {
        lastReviewToken.current = reviewToken;
        void requestStoreReview(reviewToken).then((outcome) => {
          if (focused && reviewFixtureAvailable) setReviewFixtureOutcome(outcome);
        });
      }
      return () => {
        focused = false;
        deactivateRoom();
      };
    }, [
      activateRoom,
      deactivateRoom,
      refreshPet,
      requestStoreReview,
      reviewFixtureAvailable,
      reviewToken,
    ]),
  );

  return (
    <PetRouteVisibility>
      <HomeScreen
        onStartFocus={() => router.push('/focus/setup')}
        onDismissPetFeedbackError={dismissPetFeedbackError}
        onRetryPet={() => void refreshPet()}
        pet={pet}
        profile={profile}
        {...(reviewFixtureAvailable ? { reviewFixtureOutcome } : {})}
        {...(reviewFixtureLabel === null ? {} : { reviewFixtureLabel })}
        room={room}
        onRetryRoom={() => void retryRoom()}
      />
    </PetRouteVisibility>
  );
}
