import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { ApplicationResult, RunningSessionRecord } from '@pixeldoro/application';
import type { SQLiteDriver } from '@/infrastructure/database/sqlite-driver';

import { createMobileApplication } from '../create-mobile-application';
import type { MobileApplication } from '../mobile-application';

const PROBE_DATABASE = 'pixeldoro-us-02-05-repositories-probe.db';
const BASE_TIMESTAMP = 1_787_836_800_000;
const RESOLVED_AT = BASE_TIMESTAMP + 25 * 60_000;

export interface TypedRepositoriesProbeReport {
  readonly probe: 'US-02-05_TYPED_REPOSITORIES';
  readonly passed: boolean;
  readonly failedAssertion?: string;
  readonly platform: string;
  readonly osVersion: string;
  readonly appVersion: string;
  readonly applicationId: string;
  readonly commitSha: string;
  readonly assertions: readonly string[];
}

const runningSession = (
  id: string,
  sessionType: 'focus' | 'short_break' = 'focus',
): RunningSessionRecord => {
  const duration = sessionType === 'focus' ? 25 : 5;
  return {
    id,
    profileId: 1,
    sessionType,
    focusVariant: sessionType === 'focus' ? 'standard' : null,
    mode: sessionType === 'focus' ? 'strict' : null,
    status: 'running',
    workTag: sessionType === 'focus' ? 'coding' : null,
    configuredDurationMinutes: duration,
    startedAt: BASE_TIMESTAMP,
    endsAt: BASE_TIMESTAMP + duration * 60_000,
    backgroundedAt: null,
    resolvedAt: null,
    xpEarned: 0,
    coinsEarned: 0,
    rewardClaimedAt: null,
    scheduledEndLocalDate: '2026-08-28',
    scheduledEndUtcOffsetMinutes: 420,
    createdAt: BASE_TIMESTAMP,
    updatedAt: BASE_TIMESTAMP,
  };
};

const assertProbe = (
  condition: boolean,
  assertion: string,
  assertions: string[],
): void => {
  if (!condition) throw new Error(assertion);
  assertions.push(assertion);
};

const removeStaleDatabase = async (driver: SQLiteDriver): Promise<void> => {
  try {
    await driver.deleteDatabase(PROBE_DATABASE);
  } catch {
    // Missing isolated probe state is a valid starting point.
  }
};

const errorCode = (result: { readonly ok: boolean; readonly error?: unknown }): string | undefined => {
  if (result.ok || result.error === null || typeof result.error !== 'object') return undefined;
  return 'code' in result.error && typeof result.error.code === 'string'
    ? result.error.code
    : undefined;
};

const disposeAll = async (applications: readonly MobileApplication[]): Promise<boolean> => {
  const settled = await Promise.allSettled(applications.map((application) => application.dispose()));
  return settled.every((result) => result.status === 'fulfilled');
};

export const runTypedRepositoriesProbe = async (
  driver: SQLiteDriver,
): Promise<TypedRepositoriesProbeReport> => {
  const assertions: string[] = [];
  const applications: MobileApplication[] = [];
  let failedAssertion: string | undefined;

  try {
    await removeStaleDatabase(driver);
    const first = createMobileApplication({
      databaseName: PROBE_DATABASE,
      diagnosticsEnabled: false,
      sqliteDriver: driver,
    });
    applications.push(first);
    await first.boot();
    assertProbe(
      first.bootstrap.getSnapshot().status === 'ready',
      'repository_probe_database_opened_and_migrated',
      assertions,
    );

    const installation = await first.persistence.installation.find();
    const settings = await first.persistence.settings.find();
    const profile = await first.persistence.profile.find();
    const catalog = await first.persistence.catalog.list();
    assertProbe(
      installation.ok && installation.value?.id === 1 &&
        settings.ok && settings.value?.id === 1 &&
        profile.ok && profile.value?.id === 1 &&
        catalog.ok && catalog.value.length === 12,
      'all_durable_entity_groups_round_tripped',
      assertions,
    );

    const session = runningSession('repository-session-1');
    const coreWrite = await first.transaction.execute(async (scope) => {
      const inserted = await first.persistence.sessions.insertRunningInTransaction(scope, session);
      if (!inserted.ok) return inserted;
      const transitioned = await first.persistence.sessions.transitionFromRunningInTransaction(scope, {
        sessionId: session.id,
        status: 'completed',
        resolvedAt: RESOLVED_AT,
        xpEarned: 25,
        coinsEarned: 5,
        rewardClaimedAt: RESOLVED_AT,
        updatedAt: RESOLVED_AT,
      });
      if (!transitioned.ok) return transitioned;
      if (transitioned.value !== 'updated') throw new Error('session_transition_not_updated');
      const progression = await first.persistence.profile.applyProgressionInTransaction(scope, {
        profileId: 1,
        xpDelta: 25,
        coinDelta: 5,
        updatedAt: RESOLVED_AT,
      });
      if (!progression.ok) return progression;
      if (progression.value !== 'updated') throw new Error('profile_progression_not_updated');
      return first.persistence.rewards.insertInTransaction(scope, {
        id: 'repository-reward-1',
        sessionId: session.id,
        profileId: 1,
        xpDelta: 25,
        coinDelta: 5,
        reason: 'focus_completed',
        createdAt: RESOLVED_AT,
      });
    });
    assertProbe(
      coreWrite.ok,
      'transaction_scoped_multi_repository_work_committed',
      assertions,
    );

    const purchaseWrite = await first.transaction.execute(async (scope) => {
      const debit = await first.persistence.profile.debitCatalogItemInTransaction(scope, {
        profileId: 1,
        itemId: 'desk-mug',
        updatedAt: RESOLVED_AT + 1,
      });
      if (!debit.ok) return debit;
      if (debit.value !== 'updated') throw new Error('catalog_debit_not_updated');
      const purchase = await first.persistence.purchases.insertInTransaction(scope, {
        id: 'repository-purchase-1',
        profileId: 1,
        itemId: 'desk-mug',
        pricePaidCoins: 5,
        coinDelta: -5,
        reason: 'item_purchase',
        createdAt: RESOLVED_AT + 1,
      });
      if (!purchase.ok) return purchase;
      return first.persistence.ownedItems.insertInTransaction(scope, {
        profileId: 1,
        itemId: 'desk-mug',
        purchaseTransactionId: 'repository-purchase-1',
        unlockedAt: RESOLVED_AT + 1,
        isEquipped: false,
        equippedAt: null,
        updatedAt: RESOLVED_AT + 1,
      });
    });
    assertProbe(
      purchaseWrite.ok,
      'catalog_authoritative_price_debit_was_verified',
      assertions,
    );

    const settingsWrite = await first.persistence.settings.replace({
      focusDurationMinutes: 30,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      defaultMode: 'strict',
      soundEnabled: false,
      hapticsEnabled: true,
      notificationsEnabled: false,
      analyticsEnabled: true,
      updatedAt: RESOLVED_AT + 2,
    });
    const installationWrite = await first.persistence.installation.setOnboardingCompleted(
      RESOLVED_AT + 2,
      RESOLVED_AT + 2,
    );
    const reviewWrite = await first.persistence.storeReviewAttempts.insert({
      id: 'repository-review-1',
      appVersion: Constants.expoConfig?.version ?? 'unknown',
      attemptedAt: RESOLVED_AT + 2,
      createdAt: RESOLVED_AT + 2,
    });
    const analyticsWrite = await first.persistence.analyticsEvents.insert({
      eventId: 'repository-event-1',
      eventName: 'focus_completed',
      properties: { mode: 'strict', durationMinutes: 25 },
      occurredAt: RESOLVED_AT + 2,
      expiresAt: RESOLVED_AT + 2 + 604_800_000,
      deliveryState: 'pending',
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: RESOLVED_AT + 2,
    });
    if (!settingsWrite.ok || !installationWrite.ok || !reviewWrite.ok || !analyticsWrite.ok) {
      throw new Error('metadata_or_singleton_write_failed');
    }

    await first.dispose();
    const reopened = createMobileApplication({
      databaseName: PROBE_DATABASE,
      diagnosticsEnabled: false,
      sqliteDriver: driver,
    });
    applications.push(reopened);
    await reopened.boot();
    const reopenedSession = await reopened.persistence.sessions.findById(session.id);
    const reopenedReward = await reopened.persistence.rewards.findBySessionId(session.id);
    const reopenedProfile = await reopened.persistence.profile.find();
    const reopenedPurchase = await reopened.persistence.purchases.findById('repository-purchase-1');
    const reopenedOwned = await reopened.persistence.ownedItems.find(1, 'desk-mug');
    const reopenedSettings = await reopened.persistence.settings.find();
    const reopenedReview = await reopened.persistence.storeReviewAttempts.findByAppVersion(
      Constants.expoConfig?.version ?? 'unknown',
    );
    const reopenedEvent = await reopened.persistence.analyticsEvents.findById('repository-event-1');
    assertProbe(
      reopenedSession.ok && reopenedSession.value?.status === 'completed' &&
        reopenedReward.ok && reopenedReward.value?.xpDelta === 25 &&
        reopenedProfile.ok && reopenedProfile.value?.totalXp === 25 &&
        reopenedProfile.value.coinBalance === 0 &&
        reopenedPurchase.ok && reopenedPurchase.value?.pricePaidCoins === 5 &&
        reopenedOwned.ok && reopenedOwned.value?.purchaseTransactionId === 'repository-purchase-1' &&
        reopenedSettings.ok && reopenedSettings.value?.focusDurationMinutes === 30 &&
        reopenedReview.ok && reopenedReview.value?.id === 'repository-review-1' &&
        reopenedEvent.ok && reopenedEvent.value?.properties.mode === 'strict',
      'canonical_mappers_preserved_exact_values_after_reopen',
      assertions,
    );

    const beforeRollbackProfile = reopenedProfile.ok ? reopenedProfile.value : null;
    const rollbackResult = await reopened.transaction.execute(async (scope): Promise<
      ApplicationResult<void, { readonly code: 'INJECTED_RETURNED_FAILURE' }>
    > => {
      const inserted = await reopened.persistence.sessions.insertRunningInTransaction(
        scope,
        runningSession('repository-rollback-session', 'short_break'),
      );
      if (!inserted.ok) throw new Error('rollback_fixture_insert_failed');
      const progression = await reopened.persistence.profile.applyProgressionInTransaction(scope, {
        profileId: 1,
        xpDelta: 1,
        coinDelta: 1,
        updatedAt: RESOLVED_AT + 3,
      });
      if (!progression.ok) throw new Error('rollback_fixture_progression_failed');
      return { ok: false, error: { code: 'INJECTED_RETURNED_FAILURE' } };
    });
    const afterRollbackSession = await reopened.persistence.sessions.findById('repository-rollback-session');
    const afterRollbackProfile = await reopened.persistence.profile.find();
    const thrownRollback = await reopened.transaction.execute(async (scope) => {
      const inserted = await reopened.persistence.sessions.insertRunningInTransaction(
        scope,
        runningSession('repository-thrown-rollback-session', 'short_break'),
      );
      if (!inserted.ok) return inserted;
      const progression = await reopened.persistence.profile.applyProgressionInTransaction(scope, {
        profileId: 1,
        xpDelta: 1,
        coinDelta: 1,
        updatedAt: RESOLVED_AT + 3,
      });
      if (!progression.ok) return progression;
      throw new Error('injected_repository_work_failure');
    });
    const afterThrownSession = await reopened.persistence.sessions.findById(
      'repository-thrown-rollback-session',
    );
    const afterThrownProfile = await reopened.persistence.profile.find();
    assertProbe(
      !rollbackResult.ok && !thrownRollback.ok &&
        afterRollbackSession.ok && afterRollbackSession.value === null &&
        afterThrownSession.ok && afterThrownSession.value === null &&
        afterRollbackProfile.ok && beforeRollbackProfile !== null &&
        afterRollbackProfile.value?.totalXp === beforeRollbackProfile.totalXp &&
        afterRollbackProfile.value.coinBalance === beforeRollbackProfile.coinBalance &&
        afterThrownProfile.ok &&
        afterThrownProfile.value?.totalXp === beforeRollbackProfile.totalXp &&
        afterThrownProfile.value.coinBalance === beforeRollbackProfile.coinBalance,
      'returned_and_thrown_failures_rolled_back_all_repository_writes',
      assertions,
    );

    const conditional = await reopened.transaction.execute((scope) =>
      reopened.persistence.sessions.transitionFromRunningInTransaction(scope, {
        sessionId: session.id,
        status: 'cancelled',
        resolvedAt: RESOLVED_AT + 4,
        xpEarned: 0,
        coinsEarned: 0,
        rewardClaimedAt: null,
        updatedAt: RESOLVED_AT + 4,
      }));
    assertProbe(
      conditional.ok && conditional.value === 'not_updated',
      'session_conditional_conflict_was_deterministic',
      assertions,
    );

    const duplicateReward = await reopened.transaction.execute((scope) =>
      reopened.persistence.rewards.insertInTransaction(scope, {
        id: 'repository-reward-duplicate',
        sessionId: session.id,
        profileId: 1,
        xpDelta: 25,
        coinDelta: 5,
        reason: 'focus_completed',
        createdAt: RESOLVED_AT,
      }));
    const wrongScope = await reopened.persistence.profile.findInTransaction({
      transactionId: Symbol('foreign-probe-scope'),
    });
    assertProbe(
      errorCode(duplicateReward) === 'PERSISTENCE_CONFLICT' &&
        errorCode(wrongScope) === 'PERSISTENCE_UNAVAILABLE',
      'corrupt_or_constraint_failures_were_safely_mapped',
      assertions,
    );
    assertProbe(
      !('update' in reopened.persistence.rewards) &&
        !('delete' in reopened.persistence.rewards) &&
        !('update' in reopened.persistence.purchases) &&
        !('delete' in reopened.persistence.purchases) &&
        !('insert' in reopened.persistence.catalog),
      'immutable_receipt_mutation_was_not_exposed_or_committed',
      assertions,
    );
  } catch (error) {
    failedAssertion = error instanceof Error ? error.message : 'unknown_repository_probe_failure';
  } finally {
    const closed = await disposeAll(applications);
    if (!closed) {
      failedAssertion ??= 'repository_probe_database_not_closed';
    } else {
      try {
        await driver.deleteDatabase(PROBE_DATABASE);
        if (failedAssertion === undefined) {
          assertions.push('repository_graph_connections_closed_and_database_cleaned');
        }
      } catch {
        failedAssertion ??= 'repository_probe_database_cleanup_failed';
      }
    }
  }

  return {
    probe: 'US-02-05_TYPED_REPOSITORIES',
    passed: failedAssertion === undefined,
    ...(failedAssertion === undefined ? {} : { failedAssertion }),
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    applicationId:
      (Platform.OS === 'ios'
        ? Constants.expoConfig?.ios?.bundleIdentifier
        : Constants.expoConfig?.android?.package) ?? 'unknown',
    commitSha: process.env.EXPO_PUBLIC_COMMIT_SHA ?? 'not-provided',
    assertions,
  };
};
