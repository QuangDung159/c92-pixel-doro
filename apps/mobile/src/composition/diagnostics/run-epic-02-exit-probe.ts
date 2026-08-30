import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { ClockPort, IdPort } from '@pixeldoro/application';

import { MigrationRunner } from '@/infrastructure/database/migration-runner';
import { productionMigrationRegistry } from '@/infrastructure/database/migrations/migration-registry';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import type { SQLiteDriver } from '@/infrastructure/database/sqlite-driver';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';
import { DeviceClockAdapter } from '@/infrastructure/platform/clock/device-clock.adapter';
import { DeviceIdAdapter } from '@/infrastructure/platform/id/device-id.adapter';

const EXIT_DATABASE_NAME = 'pixeldoro-us-02-09-epic-exit-probe.db';
const SENTINEL_EVENT_ID = 'us-02-09-process-relaunch-sentinel';
const SENTINEL_EVENT_NAME = 'us_02_09_process_relaunch_sentinel';
const ANALYTICS_TTL_MS = 604_800_000;
const COMMIT_SHA_PATTERN = /^[a-f0-9]{40}$/;

export const EPIC_02_EXIT_PROBE_ID = 'US-02-09_EPIC_EXIT' as const;

export const EPIC_02_COMPONENT_ASSERTIONS = {
  'US-02-01_SQLITE_KERNEL': [
    'connection_open_and_foreign_keys_verified',
    'probe_schema_committed',
    'successful_work_committed',
    'close_reopen_succeeded',
    'committed_bound_value_survived_reopen',
    'returned_failure_preserved',
    'thrown_failure_mapped',
    'returned_and_thrown_work_rolled_back',
    'foreign_key_violation_rejected',
    'overlap_rejected_deterministically',
    'dispose_is_idempotent',
  ],
  'US-02-02_INITIAL_SCHEMA': [
    'schema_probe_database_opened',
    'initial_schema_applied_atomically',
    'exact_schema_surface_verified',
    'foreign_keys_restrict_and_valid_seed_verified',
    'exact_seed_verified',
    'valid_entity_shapes_committed',
    'negative_write_matrix_rejected_without_partial_rows',
    'schema_and_seed_survived_reopen',
    'failure_probe_database_opened',
    'injected_apply_failure_rolled_back_all_schema',
    'probe_connections_closed_idempotently',
  ],
  'US-02-03_FORWARD_MIGRATION': [
    'empty_database_migrated_to_latest',
    'exact_history_committed_after_validation',
    'latest_rerun_was_noop',
    'incompatible_history_rejected_before_write',
    'failed_migration_rolled_back_without_false_history',
    'failed_history_write_rolled_back_without_false_history',
    'retry_resumed_from_valid_durable_history',
    'synthetic_upgrade_applied_in_order',
    'committed_history_survived_reopen',
    'probe_connections_closed_and_databases_cleaned',
  ],
  'US-02-04_SAFE_BOOTSTRAP': [
    'empty_database_reached_ready_after_ordered_barrier',
    'exact_durable_snapshot_hydrated',
    'readiness_gate_opened_only_after_reconciliation',
    'latest_reopen_preserved_snapshot_without_duplicate_seed',
    'injected_invariant_mismatch_entered_typed_recovery',
    'failed_bootstrap_kept_gate_closed_and_skipped_reconciliation',
    'failed_bootstrap_preserved_database_fingerprint',
    'repeated_boot_and_dispose_were_idempotent',
    'probe_connections_closed_and_databases_cleaned',
  ],
  'US-02-05_TYPED_REPOSITORIES': [
    'repository_probe_database_opened_and_migrated',
    'all_durable_entity_groups_round_tripped',
    'transaction_scoped_multi_repository_work_committed',
    'catalog_authoritative_price_debit_was_verified',
    'canonical_mappers_preserved_exact_values_after_reopen',
    'returned_and_thrown_failures_rolled_back_all_repository_writes',
    'session_conditional_conflict_was_deterministic',
    'corrupt_or_constraint_failures_were_safely_mapped',
    'immutable_receipt_mutation_was_not_exposed_or_committed',
    'repository_graph_connections_closed_and_database_cleaned',
  ],
  'US-02-06_DERIVED_QUERIES': [
    'query_probe_database_opened_and_migrated',
    'mixed_standard_history_excluded_trial_running_and_breaks',
    'contribution_grouped_by_persisted_local_date',
    'timezone_change_did_not_regroup_contribution',
    'cadence_used_completed_long_break_reset_only',
    'store_review_facts_excluded_trial_status_and_feedback',
    'economy_consistency_passed_and_mismatch_preserved_rows',
    'analytics_queue_enforced_ttl_cap_dedupe_retry_and_privacy',
    'product_retention_rows_survived_queue_maintenance',
    'critical_query_plans_used_or_documented_approved_indexes',
    'probe_connections_closed_and_database_cleaned',
  ],
  'US-02-07_FAILURE_RECOVERY': [
    'recovery_probe_database_opened_and_migrated',
    'typed_failure_reason_was_sanitized',
    'failure_closed_readiness_and_hid_core_projection',
    'durable_rows_survived_injected_failure',
    'concurrent_retry_coalesced_to_one_attempt',
    'retry_reused_same_database_and_reran_ordered_barrier',
    'successful_retry_hydrated_fresh_snapshot_before_ready',
    'side_effect_failure_did_not_enter_core_recovery',
    'no_reset_repair_terminal_or_reward_path_was_invoked',
    'repeated_retry_and_dispose_were_safe',
    'probe_connections_closed_and_database_cleaned',
  ],
  'US-02-08_CONFIRMED_RESET': [
    'reset_probe_database_opened_and_migrated',
    'complete_pre_reset_product_fixture_was_verified',
    'unconfirmed_and_recovery_paths_could_not_invoke_reset',
    'notification_cleanup_failure_was_best_effort',
    'confirmed_reset_committed_atomically',
    'product_history_economy_and_metadata_were_cleared',
    'singletons_reseeded_and_anonymous_identity_rotated',
    'schema_history_triggers_indexes_and_exact_catalog_were_preserved',
    'post_reset_bootstrap_hydrated_fresh_defaults_before_ready',
    'injected_mid_reset_failure_restored_complete_fingerprint',
    'concurrent_repeated_reset_and_dispose_were_safe',
    'probe_connections_closed_and_databases_cleaned',
  ],
} as const;

export type Epic02ComponentProbeId = keyof typeof EPIC_02_COMPONENT_ASSERTIONS;
export type Epic02ExitTargetKind =
  | 'device'
  | 'simulator'
  | 'emulator'
  | 'not-provided';
export type PhysicalDiskFullStatus =
  | 'RUN_ON_ISOLATED_TARGET_AND_PASSED'
  | 'RUN_ON_ISOLATED_TARGET_AND_FAILED'
  | 'NOT_RUN_UNSAFE_OR_NONDETERMINISTIC';

export interface Epic02ComponentProbeReport {
  readonly probe: string;
  readonly passed: boolean;
  readonly failedAssertion?: string;
  readonly platform: string;
  readonly osVersion: string;
  readonly appVersion: string;
  readonly applicationId?: string;
  readonly commitSha: string;
  readonly sqliteVersion?: string;
  readonly assertions: readonly string[];
}

export interface Epic02ComponentProbeRunner {
  readonly probe: Epic02ComponentProbeId;
  run(driver: SQLiteDriver): Promise<Epic02ComponentProbeReport>;
}

export interface Epic02ExitProbeMetadata {
  readonly platform: string;
  readonly osVersion: string;
  readonly targetKind: Epic02ExitTargetKind;
  readonly appVersion: string;
  readonly runtimeVersion: string;
  readonly applicationId: string;
  readonly commitSha: string;
}

interface Epic02ExitProbeBase extends Epic02ExitProbeMetadata {
  readonly probe: typeof EPIC_02_EXIT_PROBE_ID;
  readonly sqliteVersion: string;
  readonly assertions: readonly string[];
}

export interface Epic02ExitAwaitingRelaunchReport extends Epic02ExitProbeBase {
  readonly status: 'AWAITING_RELAUNCH';
  readonly phase: 'sentinel_committed';
  readonly nextAction: 'terminate_and_relaunch_same_build';
}

export interface Epic02ExitFailedReport extends Epic02ExitProbeBase {
  readonly passed: false;
  readonly phase: 'failed';
  readonly failedAssertion: string;
  readonly physicalDiskFullStatus: PhysicalDiskFullStatus;
  readonly componentProbes: readonly Epic02ComponentProbeId[];
}

export interface Epic02ExitFinalReport extends Epic02ExitProbeBase {
  readonly passed: true;
  readonly phase: 'completed_after_relaunch';
  readonly physicalDiskFullStatus: PhysicalDiskFullStatus;
  readonly componentProbes: readonly Epic02ComponentProbeId[];
}

export interface Epic02ExitCompletionCandidate extends Epic02ExitProbeBase {
  readonly kind: 'completion_candidate';
  readonly physicalDiskFullStatus: PhysicalDiskFullStatus;
  readonly componentProbes: readonly Epic02ComponentProbeId[];
}

export type Epic02ExitProbeExecution =
  | Epic02ExitAwaitingRelaunchReport
  | Epic02ExitFailedReport
  | Epic02ExitCompletionCandidate;

type SentinelProperties = Epic02ExitProbeMetadata;

interface SentinelRow {
  readonly properties_json: string;
}

interface SQLiteVersionRow {
  readonly version: string;
}

interface Epic02ExitProbeOptions {
  readonly clock?: ClockPort;
  readonly componentRunners?: readonly Epic02ComponentProbeRunner[];
  readonly id?: IdPort;
  readonly metadata?: Epic02ExitProbeMetadata;
  readonly physicalDiskFullStatus?: PhysicalDiskFullStatus;
}

const arraysEqual = (
  actual: readonly string[],
  expected: readonly string[],
): boolean =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index]);

const assertProbe: (
  condition: boolean,
  assertion: string,
) => asserts condition = (condition, assertion) => {
  if (!condition) {
    throw new Error(assertion);
  }
};

const applicationId = (): string =>
  (Platform.OS === 'ios'
    ? Constants.expoConfig?.ios?.bundleIdentifier
    : Constants.expoConfig?.android?.package) ?? 'unknown';

const runtimeVersion = (appVersion: string): string => {
  const configured = Constants.expoConfig?.runtimeVersion;
  return typeof configured === 'string' ? configured : appVersion;
};

const targetKindFromEnvironment = (): Epic02ExitTargetKind => {
  const value = process.env.EXPO_PUBLIC_EPIC_02_TARGET_KIND;
  if (value === 'device' || value === 'simulator' || value === 'emulator') {
    return value;
  }
  return 'not-provided';
};

const currentMetadata = (): Epic02ExitProbeMetadata => {
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  return {
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    targetKind: targetKindFromEnvironment(),
    appVersion,
    runtimeVersion: runtimeVersion(appVersion),
    applicationId: applicationId(),
    commitSha: process.env.EXPO_PUBLIC_COMMIT_SHA ?? 'not-provided',
  };
};

const validateMetadata = (metadata: Epic02ExitProbeMetadata): void => {
  assertProbe(
    metadata.platform === 'ios' || metadata.platform === 'android',
    'runtime_platform_was_not_ios_or_android',
  );
  assertProbe(
    metadata.targetKind === 'device' ||
      metadata.targetKind === 'simulator' ||
      metadata.targetKind === 'emulator',
    'target_kind_was_not_provided',
  );
  assertProbe(
    metadata.platform === 'ios'
      ? metadata.targetKind !== 'emulator'
      : metadata.targetKind !== 'simulator',
    'target_kind_did_not_match_platform',
  );
  assertProbe(metadata.osVersion.length > 0, 'runtime_os_version_was_missing');
  assertProbe(
    metadata.appVersion !== 'unknown' && metadata.appVersion.length > 0,
    'runtime_app_version_was_missing',
  );
  assertProbe(
    metadata.runtimeVersion !== 'unknown' && metadata.runtimeVersion.length > 0,
    'runtime_version_was_missing',
  );
  assertProbe(
    metadata.applicationId !== 'unknown' && metadata.applicationId.length > 0,
    'runtime_application_id_was_missing',
  );
  assertProbe(
    COMMIT_SHA_PATTERN.test(metadata.commitSha),
    'final_commit_sha_was_invalid',
  );
};

const metadataMatches = (
  actual: SentinelProperties,
  expected: Epic02ExitProbeMetadata,
): boolean =>
  actual.platform === expected.platform &&
  actual.osVersion === expected.osVersion &&
  actual.targetKind === expected.targetKind &&
  actual.appVersion === expected.appVersion &&
  actual.runtimeVersion === expected.runtimeVersion &&
  actual.applicationId === expected.applicationId &&
  actual.commitSha === expected.commitSha;

const parseSentinel = (propertiesJson: string): SentinelProperties => {
  const value: unknown = JSON.parse(propertiesJson);
  assertProbe(
    typeof value === 'object' && value !== null,
    'persistent_sentinel_payload_was_invalid',
  );
  const candidate = value as Partial<SentinelProperties>;
  assertProbe(
    typeof candidate.platform === 'string' &&
      typeof candidate.osVersion === 'string' &&
      (candidate.targetKind === 'device' ||
        candidate.targetKind === 'simulator' ||
        candidate.targetKind === 'emulator') &&
      typeof candidate.appVersion === 'string' &&
      typeof candidate.runtimeVersion === 'string' &&
      typeof candidate.applicationId === 'string' &&
      typeof candidate.commitSha === 'string',
    'persistent_sentinel_payload_was_invalid',
  );
  return candidate as SentinelProperties;
};

const defaultComponentRunners = (): readonly Epic02ComponentProbeRunner[] => [
  {
    probe: 'US-02-01_SQLITE_KERNEL',
    run: async (driver) =>
      (await import('./run-sqlite-kernel-probe')).runSQLiteKernelProbe(driver),
  },
  {
    probe: 'US-02-02_INITIAL_SCHEMA',
    run: async (driver) =>
      (await import('./run-initial-schema-probe')).runInitialSchemaProbe(driver),
  },
  {
    probe: 'US-02-03_FORWARD_MIGRATION',
    run: async (driver) =>
      (await import('./run-forward-migration-probe')).runForwardMigrationProbe(
        driver,
      ),
  },
  {
    probe: 'US-02-04_SAFE_BOOTSTRAP',
    run: async (driver) =>
      (await import('./run-safe-bootstrap-probe')).runSafeBootstrapProbe(driver),
  },
  {
    probe: 'US-02-05_TYPED_REPOSITORIES',
    run: async (driver) =>
      (await import('./run-typed-repositories-probe')).runTypedRepositoriesProbe(
        driver,
      ),
  },
  {
    probe: 'US-02-06_DERIVED_QUERIES',
    run: async (driver) =>
      (await import('./run-derived-queries-probe')).runDerivedQueriesProbe(
        driver,
      ),
  },
  {
    probe: 'US-02-07_FAILURE_RECOVERY',
    run: async (driver) =>
      (await import('./run-failure-recovery-probe')).runFailureRecoveryProbe(
        driver,
      ),
  },
  {
    probe: 'US-02-08_CONFIRMED_RESET',
    run: async (driver) =>
      (await import('./run-confirmed-reset-probe')).runConfirmedResetProbe(driver),
  },
];

const validateComponentRunners = (
  runners: readonly Epic02ComponentProbeRunner[],
): void => {
  assertProbe(
    arraysEqual(
      runners.map(({ probe }) => probe),
      Object.keys(EPIC_02_COMPONENT_ASSERTIONS),
    ),
    'component_probe_runner_surface_was_not_exact',
  );
};

const validateComponentReport = (
  report: Epic02ComponentProbeReport,
  probe: Epic02ComponentProbeId,
  metadata: Epic02ExitProbeMetadata,
): void => {
  assertProbe(report.probe === probe, 'component_probe_id_was_not_exact');
  assertProbe(report.passed, `component_probe_failed_${probe.toLowerCase()}`);
  assertProbe(
    report.failedAssertion === undefined,
    'component_probe_exposed_failed_assertion_on_success',
  );
  assertProbe(
    report.platform === metadata.platform &&
      report.osVersion === metadata.osVersion &&
      report.appVersion === metadata.appVersion &&
      report.commitSha === metadata.commitSha,
    'component_probe_runtime_identity_mismatched',
  );
  if (report.applicationId !== undefined) {
    assertProbe(
      report.applicationId === metadata.applicationId,
      'component_probe_application_id_mismatched',
    );
  }
  if (report.sqliteVersion !== undefined) {
    assertProbe(
      report.sqliteVersion !== 'unavailable' && report.sqliteVersion.length > 0,
      'component_probe_sqlite_version_was_missing',
    );
  }
  assertProbe(
    arraysEqual(report.assertions, EPIC_02_COMPONENT_ASSERTIONS[probe]),
    'component_probe_assertion_surface_was_not_exact',
  );
};

const failedReport = (
  metadata: Epic02ExitProbeMetadata,
  sqliteVersion: string,
  failedAssertion: string,
  assertions: readonly string[],
  componentProbes: readonly Epic02ComponentProbeId[],
  physicalDiskFullStatus: PhysicalDiskFullStatus,
): Epic02ExitFailedReport => ({
  probe: EPIC_02_EXIT_PROBE_ID,
  passed: false,
  phase: 'failed',
  failedAssertion,
  ...metadata,
  sqliteVersion,
  physicalDiskFullStatus,
  componentProbes,
  assertions,
});

const safeErrorIdentity = (error: unknown): string =>
  error instanceof Error && /^[a-z0-9_-]+$/i.test(error.message)
    ? error.message
    : 'unknown_epic_exit_probe_failure';

const cleanupFailedExecution = async (
  driver: SQLiteDriver,
  owner: SQLiteDatabaseOwner,
  metadata: Epic02ExitProbeMetadata,
  sqliteVersion: string,
  error: unknown,
  assertions: readonly string[],
  componentProbes: readonly Epic02ComponentProbeId[],
  physicalDiskFullStatus: PhysicalDiskFullStatus,
): Promise<Epic02ExitFailedReport> => {
  let failedAssertion = safeErrorIdentity(error);
  const closeResult = await owner.close();
  if (!closeResult.ok) {
    failedAssertion = 'exit_probe_database_not_closed';
  } else {
    try {
      await driver.deleteDatabase(EXIT_DATABASE_NAME);
    } catch {
      failedAssertion = 'exit_probe_database_cleanup_failed';
    }
  }
  return failedReport(
    metadata,
    sqliteVersion,
    failedAssertion,
    assertions,
    componentProbes,
    physicalDiskFullStatus,
  );
};

export const runEpic02ExitProbe = async (
  driver: SQLiteDriver,
  options: Epic02ExitProbeOptions = {},
): Promise<Epic02ExitProbeExecution> => {
  const metadata = options.metadata ?? currentMetadata();
  const assertions: string[] = [];
  const componentProbes: Epic02ComponentProbeId[] = [];
  const physicalDiskFullStatus =
    options.physicalDiskFullStatus ?? 'NOT_RUN_UNSAFE_OR_NONDETERMINISTIC';
  const owner = new SQLiteDatabaseOwner(EXIT_DATABASE_NAME, driver);
  const transaction = new SQLiteTransaction(owner);
  let sqliteVersion = 'unavailable';

  try {
    validateMetadata(metadata);
    const opened = await owner.open();
    assertProbe(opened.ok, 'exit_probe_database_open_failed');

    const migration = new MigrationRunner({
      owner,
      transaction,
      registry: productionMigrationRegistry,
      clock: options.clock ?? new DeviceClockAdapter(),
      id: options.id ?? new DeviceIdAdapter(),
    });
    const migrationResult = await migration.migrate();
    assertProbe(migrationResult.ok, 'exit_probe_migration_failed');
    assertions.push('exit_probe_database_opened_and_migrated');

    const stateResult = await transaction.execute(async (scope) => {
      const executor = transaction.executorFor(scope);
      const version = await executor.getFirst<SQLiteVersionRow>(
        'SELECT sqlite_version() AS version',
        [],
      );
      const sentinel = await executor.getFirst<SentinelRow>(
        'SELECT properties_json FROM analytics_events WHERE event_id = ?',
        [SENTINEL_EVENT_ID],
      );
      return {
        ok: true as const,
        value: { sentinel, sqliteVersion: version?.version ?? 'unavailable' },
      };
    });
    assertProbe(stateResult.ok, 'exit_probe_state_read_failed');
    sqliteVersion = stateResult.value.sqliteVersion;
    assertProbe(
      sqliteVersion !== 'unavailable' && sqliteVersion.length > 0,
      'exit_probe_sqlite_version_was_missing',
    );

    if (stateResult.value.sentinel === null) {
      const now = (options.clock ?? new DeviceClockAdapter()).nowMs();
      const insertResult = await transaction.execute(async (scope) => {
        const result = await transaction.executorFor(scope).run(
          `INSERT INTO analytics_events(
            event_id,
            event_name,
            properties_json,
            occurred_at,
            expires_at,
            delivery_state,
            attempt_count,
            next_attempt_at,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            SENTINEL_EVENT_ID,
            SENTINEL_EVENT_NAME,
            JSON.stringify(metadata),
            now,
            now + ANALYTICS_TTL_MS,
            'pending',
            0,
            null,
            now,
          ],
        );
        return { ok: true as const, value: result.changes };
      });
      assertProbe(
        insertResult.ok && insertResult.value === 1,
        'persistent_sentinel_commit_failed',
      );
      assertions.push('persistent_sentinel_committed_before_relaunch');

      const closed = await owner.close();
      assertProbe(closed.ok, 'sentinel_connection_close_failed');
      assertions.push('sentinel_connection_closed_before_relaunch');
      return {
        probe: EPIC_02_EXIT_PROBE_ID,
        status: 'AWAITING_RELAUNCH',
        phase: 'sentinel_committed',
        ...metadata,
        sqliteVersion,
        nextAction: 'terminate_and_relaunch_same_build',
        assertions,
      };
    }

    const sentinel = parseSentinel(stateResult.value.sentinel.properties_json);
    assertProbe(
      metadataMatches(sentinel, metadata),
      'persistent_sentinel_runtime_identity_mismatched',
    );
    assertions.push('persistent_sentinel_survived_actual_process_relaunch');

    const closed = await owner.close();
    assertProbe(closed.ok, 'exit_probe_database_close_failed');

    const runners = options.componentRunners ?? defaultComponentRunners();
    validateComponentRunners(runners);
    for (const runner of runners) {
      const report = await runner.run(driver);
      validateComponentReport(report, runner.probe, metadata);
      componentProbes.push(runner.probe);
    }
    assertions.push(
      'all_component_probes_passed_with_exact_assertions',
      'migration_and_schema_safety_were_cross_platform_equivalent',
      'constraints_repositories_and_queries_were_cross_platform_equivalent',
      'bootstrap_recovery_retry_and_reset_were_cross_platform_equivalent',
      'representative_unavailable_and_write_failures_preserved_durable_truth',
      'no_open_or_deferred_schema_scope_was_detected',
      'runtime_identity_and_final_commit_were_verified',
    );

    return {
      probe: EPIC_02_EXIT_PROBE_ID,
      kind: 'completion_candidate',
      ...metadata,
      sqliteVersion,
      physicalDiskFullStatus,
      componentProbes,
      assertions,
    };
  } catch (error) {
    return cleanupFailedExecution(
      driver,
      owner,
      metadata,
      sqliteVersion,
      error,
      assertions,
      componentProbes,
      physicalDiskFullStatus,
    );
  }
};

export const completeEpic02ExitProbe = async (
  driver: SQLiteDriver,
  candidate: Epic02ExitCompletionCandidate,
  normalBootReady: boolean,
): Promise<Epic02ExitFinalReport | Epic02ExitFailedReport> => {
  const assertions = [...candidate.assertions];
  let failedAssertion: string | undefined;

  if (normalBootReady) {
    assertions.push('normal_boot_reached_ready_after_exit_probe');
  } else {
    failedAssertion = 'normal_boot_did_not_reach_ready_after_exit_probe';
  }

  try {
    await driver.deleteDatabase(EXIT_DATABASE_NAME);
    if (failedAssertion === undefined) {
      assertions.push('probe_connections_closed_and_databases_cleaned');
    }
  } catch {
    failedAssertion = 'exit_probe_database_cleanup_failed';
  }

  if (failedAssertion !== undefined) {
    return failedReport(
      candidate,
      candidate.sqliteVersion,
      failedAssertion,
      assertions,
      candidate.componentProbes,
      candidate.physicalDiskFullStatus,
    );
  }

  return {
    probe: EPIC_02_EXIT_PROBE_ID,
    passed: true,
    phase: 'completed_after_relaunch',
    platform: candidate.platform,
    osVersion: candidate.osVersion,
    targetKind: candidate.targetKind,
    appVersion: candidate.appVersion,
    runtimeVersion: candidate.runtimeVersion,
    applicationId: candidate.applicationId,
    commitSha: candidate.commitSha,
    sqliteVersion: candidate.sqliteVersion,
    physicalDiskFullStatus: candidate.physicalDiskFullStatus,
    componentProbes: candidate.componentProbes,
    assertions,
  };
};
