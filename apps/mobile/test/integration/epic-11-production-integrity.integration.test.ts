import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const read = (path: string): string => readFileSync(resolve(repoRoot, path), 'utf8');

describe('EPIC-11 production boundaries', () => {
  it('keeps feedback and Home routes on facade hooks', () => {
    const feedbackRoute = read('apps/mobile/src/app/feedback/index.tsx');
    const homeRoute = read('apps/mobile/src/app/(tabs)/index.tsx');
    expect(feedbackRoute).toContain('useFeedbackProjection');
    expect(feedbackRoute).toContain('useFeedbackActions');
    expect(homeRoute).toContain('useRequestStoreReviewAtHome');
    expect(`${feedbackRoute}\n${homeRoute}`)
      .not.toMatch(/SQLite|PostHog|HttpFeedback|ExpoStoreReview|prototype-context/);
  });

  it('ships a production feedback screen reached from Settings', () => {
    const feedback = read('apps/mobile/src/presentation/features/feedback/index.tsx');
    const settings = read('apps/mobile/src/presentation/features/settings/settings-sections.tsx');
    expect(settings).toContain('Góp ý cho PixelDoro');
    expect(feedback).toContain('ChoiceChip');
    expect(feedback).toContain('TextInput');
    expect(feedback).toContain('accessibilityRole="radiogroup"');
    expect(feedback).not.toMatch(/PrototypeBadge|prototype-context|mock controls/i);
    expect(feedback).not.toMatch(/SQLite|PostHog|HttpFeedback|StoreReview/);
  });

  it('keeps the exact taxonomy and visual boundaries reviewable', () => {
    const contract = read(
      'apps/mobile/src/application/persistence/analytics-event.repository.ts',
    );
    const eventNames = contract.match(/^ {2}\| '[a-z_]+'/gm) ?? [];
    expect(eventNames).toHaveLength(17);
    for (const path of [
      'apps/mobile/src/presentation/features/feedback/index.tsx',
      'apps/mobile/src/presentation/features/home/index.tsx',
    ]) expect(read(path).split('\n').length, path).toBeLessThan(240);
    for (const path of [
      'apps/mobile/src/application/feedback/feedback.controller.ts',
      'apps/mobile/src/application/store-review/store-review.controller.ts',
      'apps/mobile/src/application/analytics/analytics-delivery.coordinator.ts',
    ]) expect(read(path).split('\n').length, path).toBeLessThan(300);
  });

  it('uses a direct HTTPS adapter and only the approved native review dependency', () => {
    const packageManifest = read('apps/mobile/package.json');
    const postHog = read(
      'apps/mobile/src/infrastructure/providers/analytics/posthog-analytics-delivery.adapter.ts',
    );
    const services = read(
      'apps/mobile/src/composition/epic-11/create-epic-11-services.ts',
    );
    expect(packageManifest).toContain('expo-store-review');
    expect(packageManifest).not.toMatch(/posthog-react-native|segment|amplitude|mixpanel/i);
    expect(postHog).toContain("https://eu.i.posthog.com");
    expect(postHog).toContain('$process_person_profile: false');
    expect(services).toContain("typeof __DEV__ === 'undefined' || !__DEV__");
  });

  it('adds no schema migration and isolates review fixtures from the normal database', () => {
    const migrations = readdirSync(resolve(
      repoRoot,
      'apps/mobile/src/infrastructure/database/migrations',
    )).filter((name) => /^\d+.*\.migration\.ts$/.test(name));
    const composition = read('apps/mobile/src/composition/create-mobile-application.ts');
    const fixture = read('apps/mobile/src/composition/review/epic-11-review-fixture.ts');
    expect(migrations).toEqual(['001_initial-schema.migration.ts']);
    expect(composition).toContain('EXPO_PUBLIC_EPIC_11_REVIEW_FIXTURE');
    expect(composition).toContain(
      'analyticsCaptureQueue: coordinatedSideEffectAnalyticsQueue',
    );
    expect(fixture).toContain('pixeldoro-us-11-');
    expect(fixture).toContain('epic_11_review_eligible');
    expect(fixture).toContain('epic_11_review_cooldown');
  });
});
