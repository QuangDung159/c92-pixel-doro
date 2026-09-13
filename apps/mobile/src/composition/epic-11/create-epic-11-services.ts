import { Platform } from 'react-native';
import type { ClockPort, IdPort, SessionRepository } from '@pixeldoro/application';

import {
  AnalyticsDeliveryCoordinator,
  EngagementAnalyticsRecorder,
  FeedbackController,
  StoreReviewController,
  type AnalyticsCaptureGate,
  type AnalyticsDeliveryPort,
  type AnalyticsQueue,
  type FeedbackSubmissionPort,
  type InstallationRepository,
  type StoreReviewAttemptRepository,
  type StoreReviewFactsQuery,
  type StoreReviewPort,
} from '@/application';
import {
  DisabledAnalyticsDeliveryAdapter,
} from '@/infrastructure/providers/analytics/disabled-analytics-delivery.adapter';
import {
  PostHogAnalyticsDeliveryAdapter,
  resolvePostHogAnalyticsConfig,
} from '@/infrastructure/providers/analytics/posthog-analytics-delivery.adapter';
import {
  DisabledFeedbackSubmissionAdapter,
  HttpFeedbackSubmissionAdapter,
  resolveFeedbackEndpointConfig,
} from '@/infrastructure/providers/feedback/http-feedback-submission.adapter';
import {
  DisabledStoreReviewAdapter,
  ExpoStoreReviewAdapter,
} from '@/infrastructure/platform/store-review/expo-store-review.adapter';

import type { Epic11ReviewFixture } from '../review/epic-11-review-fixture';

export interface CreateEpic11ServicesDependencies {
  readonly analyticsDelivery?: AnalyticsDeliveryPort;
  readonly analyticsGate: AnalyticsCaptureGate;
  readonly analyticsQueue: AnalyticsQueue;
  readonly analyticsCaptureQueue: Pick<AnalyticsQueue, 'enqueueBounded'>;
  readonly attempts: StoreReviewAttemptRepository;
  readonly clock: ClockPort;
  readonly feedbackProvider?: FeedbackSubmissionPort;
  readonly fixture?: Epic11ReviewFixture;
  readonly id: IdPort;
  readonly installation: InstallationRepository;
  readonly isAppActive: () => boolean;
  readonly isProductionReview?: boolean;
  readonly nativeReview?: StoreReviewPort;
  readonly readAnalyticsEnabled: () => boolean;
  readonly reviewFacts: StoreReviewFactsQuery;
  readonly sessions: Pick<SessionRepository, 'findActive'>;
}

export const createEpic11Services = (
  dependencies: CreateEpic11ServicesDependencies,
) => {
  const externalAnalyticsAllowed = typeof __DEV__ === 'undefined' || !__DEV__;
  const postHogConfig = externalAnalyticsAllowed
    ? resolvePostHogAnalyticsConfig(process.env)
    : null;
  const feedbackConfig = resolveFeedbackEndpointConfig(process.env);
  const analyticsDelivery = dependencies.analyticsDelivery ??
    dependencies.fixture?.analytics ??
    (postHogConfig === null
      ? new DisabledAnalyticsDeliveryAdapter()
      : new PostHogAnalyticsDeliveryAdapter(postHogConfig));
  const feedbackProvider = dependencies.feedbackProvider ??
    dependencies.fixture?.feedback ??
    (feedbackConfig === null
      ? new DisabledFeedbackSubmissionAdapter()
      : new HttpFeedbackSubmissionAdapter(feedbackConfig));
  const providerEnabled = dependencies.analyticsDelivery !== undefined ||
    dependencies.fixture !== undefined || postHogConfig !== null;
  const delivery = new AnalyticsDeliveryCoordinator({
    clock: dependencies.clock,
    delivery: analyticsDelivery,
    gate: {
      generation: () => dependencies.analyticsGate.generation(),
      isEnabled: () => providerEnabled && dependencies.isAppActive() &&
        dependencies.analyticsGate.isEnabled(dependencies.readAnalyticsEnabled()),
    },
    installation: dependencies.installation,
    queue: dependencies.analyticsQueue,
  });
  const engagement = new EngagementAnalyticsRecorder({
    isCaptureEnabled: () => dependencies.analyticsGate.isEnabled(
      dependencies.readAnalyticsEnabled(),
    ),
    queue: dependencies.analyticsCaptureQueue,
  });
  const appVersion = process.env.EXPO_PUBLIC_APP_VERSION?.trim() ||
    '0.1.0';
  const feedback = new FeedbackController({
    appVersion,
    clock: dependencies.clock,
    id: dependencies.id,
    platform: () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') return Platform.OS;
      throw new Error('unsupported_feedback_platform');
    },
    provider: feedbackProvider,
    recordStarted: (episodeId, occurredAt) => {
      void engagement.record('feedback_started', episodeId, occurredAt);
    },
    recordSubmitted: (submissionId, occurredAt) => {
      void engagement.record('feedback_submitted', submissionId, occurredAt);
    },
  });
  const nativeReview = dependencies.nativeReview ?? dependencies.fixture?.review ??
    (dependencies.isProductionReview === true
      ? new ExpoStoreReviewAdapter()
      : new DisabledStoreReviewAdapter());
  const storeReview = new StoreReviewController({
    appVersion,
    attempts: dependencies.attempts,
    clock: dependencies.clock,
    facts: dependencies.reviewFacts,
    id: dependencies.id,
    isAppActive: dependencies.isAppActive,
    isProduction: appVersion !== 'unknown' && (dependencies.isProductionReview ??
      dependencies.fixture?.productionReview ?? false),
    nativeReview,
    sessions: dependencies.sessions,
    recordRequested: (attemptId, occurredAt) => {
      void engagement.record('store_review_requested', attemptId, occurredAt);
    },
  });
  return { delivery, engagement, feedback, storeReview } as const;
};
