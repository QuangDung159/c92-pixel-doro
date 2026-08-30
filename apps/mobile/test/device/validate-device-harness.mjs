import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const deviceDirectory = fileURLToPath(new URL('.', import.meta.url));
const mobileDirectory = fileURLToPath(new URL('../..', import.meta.url));
const flowPath = `${deviceDirectory}foundation-smoke.md`;
const sqliteFlowPath = `${deviceDirectory}sqlite-kernel-smoke.md`;
const schemaFlowPath = `${deviceDirectory}initial-schema-smoke.md`;
const migrationFlowPath = `${deviceDirectory}forward-migration-smoke.md`;
const bootstrapFlowPath = `${deviceDirectory}safe-bootstrap-smoke.md`;
const repositoriesFlowPath = `${deviceDirectory}typed-repositories-smoke.md`;
const derivedQueriesFlowPath = `${deviceDirectory}derived-queries-smoke.md`;
const failureRecoveryFlowPath = `${deviceDirectory}failure-recovery-smoke.md`;
const confirmedResetFlowPath = `${deviceDirectory}confirmed-reset-smoke.md`;
const epic02ExitFlowPath = `${deviceDirectory}epic-02-exit-smoke.md`;
const petBaseStateFlowPath = `${deviceDirectory}pet-base-state-smoke.md`;

await access(flowPath);
await access(sqliteFlowPath);
await access(schemaFlowPath);
await access(migrationFlowPath);
await access(bootstrapFlowPath);
await access(repositoriesFlowPath);
await access(derivedQueriesFlowPath);
await access(failureRecoveryFlowPath);
await access(confirmedResetFlowPath);
await access(epic02ExitFlowPath);
await access(petBaseStateFlowPath);
const flow = await readFile(flowPath, 'utf8');
const sqliteFlow = await readFile(sqliteFlowPath, 'utf8');
const schemaFlow = await readFile(schemaFlowPath, 'utf8');
const migrationFlow = await readFile(migrationFlowPath, 'utf8');
const bootstrapFlow = await readFile(bootstrapFlowPath, 'utf8');
const repositoriesFlow = await readFile(repositoriesFlowPath, 'utf8');
const derivedQueriesFlow = await readFile(derivedQueriesFlowPath, 'utf8');
const failureRecoveryFlow = await readFile(failureRecoveryFlowPath, 'utf8');
const confirmedResetFlow = await readFile(confirmedResetFlowPath, 'utf8');
const epic02ExitFlow = await readFile(epic02ExitFlowPath, 'utf8');
const petBaseStateFlow = await readFile(petBaseStateFlowPath, 'utf8');

const requiredLabels = [
  'Chào mừng đến PixelDoro',
  'Chuẩn bị phiên',
  'Đang tập trung',
  'Kết quả phiên',
  'Nghỉ một chút',
  'Gửi góp ý',
];

for (const label of requiredLabels) {
  if (!flow.includes(label)) {
    throw new Error(`Device smoke flow is missing: ${label}`);
  }
}

const requiredRoutes = [
  'src/app/(onboarding)/index.tsx',
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/history.tsx',
  'src/app/(tabs)/settings.tsx',
  'src/app/(tabs)/shop.tsx',
  'src/app/focus/setup.tsx',
  'src/app/focus/session.tsx',
  'src/app/focus/result.tsx',
  'src/app/break/session.tsx',
  'src/app/feedback/index.tsx',
];

await Promise.all(requiredRoutes.map((route) => access(`${mobileDirectory}/${route}`)));

const requiredSQLiteEvidence = [
  'EXPO_PUBLIC_SQLITE_KERNEL_PROBE=1',
  'US-02-01_SQLITE_KERNEL',
  'passed: true',
  'pixeldoro-us-02-01-probe.db',
  'EPIC-02_IMPLEMENTATION_EVIDENCE.md',
];

for (const evidence of requiredSQLiteEvidence) {
  if (!sqliteFlow.includes(evidence)) {
    throw new Error(`SQLite device probe is missing: ${evidence}`);
  }
}

await access(
  `${mobileDirectory}/src/composition/diagnostics/run-sqlite-kernel-probe.ts`,
);

const requiredSchemaEvidence = [
  'EXPO_PUBLIC_INITIAL_SCHEMA_PROBE=1',
  'US-02-02_INITIAL_SCHEMA',
  'passed: true',
  'pixeldoro-us-02-02-schema-probe.db',
  'pixeldoro-us-02-02-failure-probe.db',
  'EPIC-02_IMPLEMENTATION_EVIDENCE.md',
];

for (const evidence of requiredSchemaEvidence) {
  if (!schemaFlow.includes(evidence)) {
    throw new Error(`Initial schema device probe is missing: ${evidence}`);
  }
}

await access(
  `${mobileDirectory}/src/composition/diagnostics/run-initial-schema-probe.ts`,
);

const requiredMigrationEvidence = [
  'EXPO_PUBLIC_FORWARD_MIGRATION_PROBE=1',
  'US-02-03_FORWARD_MIGRATION',
  'passed: true',
  'pixeldoro-us-02-03-migration-probe.db',
  'pixeldoro-us-02-03-incompatible-probe.db',
  'pixeldoro-us-02-03-retry-probe.db',
  'EPIC-02_IMPLEMENTATION_EVIDENCE.md',
];

for (const evidence of requiredMigrationEvidence) {
  if (!migrationFlow.includes(evidence)) {
    throw new Error(`Forward migration device probe is missing: ${evidence}`);
  }
}

await access(
  `${mobileDirectory}/src/composition/diagnostics/run-forward-migration-probe.ts`,
);

const requiredBootstrapEvidence = [
  'EXPO_PUBLIC_SAFE_BOOTSTRAP_PROBE=1',
  'US-02-04_SAFE_BOOTSTRAP',
  'passed: true',
  'pixeldoro-us-02-04-safe-bootstrap-probe.db',
  'failed_bootstrap_preserved_database_fingerprint',
  'EPIC-02_IMPLEMENTATION_EVIDENCE.md',
];

for (const evidence of requiredBootstrapEvidence) {
  if (!bootstrapFlow.includes(evidence)) {
    throw new Error(`Safe bootstrap device probe is missing: ${evidence}`);
  }
}

await access(
  `${mobileDirectory}/src/composition/diagnostics/run-safe-bootstrap-probe.ts`,
);

const requiredRepositoryEvidence = [
  'EXPO_PUBLIC_TYPED_REPOSITORIES_PROBE=1',
  'US-02-05_TYPED_REPOSITORIES',
  'passed: true',
  'pixeldoro-us-02-05-repositories-probe.db',
  'canonical_mappers_preserved_exact_values_after_reopen',
  'EPIC-02_IMPLEMENTATION_EVIDENCE.md',
];

for (const evidence of requiredRepositoryEvidence) {
  if (!repositoriesFlow.includes(evidence)) {
    throw new Error(`Typed repositories device probe is missing: ${evidence}`);
  }
}

await access(
  `${mobileDirectory}/src/composition/diagnostics/run-typed-repositories-probe.ts`,
);

const requiredDerivedQueryEvidence = [
  'EXPO_PUBLIC_DERIVED_QUERIES_PROBE=1',
  'US-02-06_DERIVED_QUERIES',
  'passed: true',
  'pixeldoro-us-02-06-derived-queries-probe.db',
  'economy_consistency_passed_and_mismatch_preserved_rows',
  'analytics_queue_enforced_ttl_cap_dedupe_retry_and_privacy',
  'EPIC-02_IMPLEMENTATION_EVIDENCE.md',
];

for (const evidence of requiredDerivedQueryEvidence) {
  if (!derivedQueriesFlow.includes(evidence)) {
    throw new Error(`Derived queries device probe is missing: ${evidence}`);
  }
}

await access(
  `${mobileDirectory}/src/composition/diagnostics/run-derived-queries-probe.ts`,
);

const requiredFailureRecoveryEvidence = [
  'EXPO_PUBLIC_FAILURE_RECOVERY_PROBE=1',
  'US-02-07_FAILURE_RECOVERY',
  'passed: true',
  'pixeldoro-us-02-07-failure-recovery-probe.db',
  'retry_reused_same_database_and_reran_ordered_barrier',
  'no_reset_repair_terminal_or_reward_path_was_invoked',
  'EPIC-02_IMPLEMENTATION_EVIDENCE.md',
];

for (const evidence of requiredFailureRecoveryEvidence) {
  if (!failureRecoveryFlow.includes(evidence)) {
    throw new Error(`Failure recovery device probe is missing: ${evidence}`);
  }
}

await access(
  `${mobileDirectory}/src/composition/diagnostics/run-failure-recovery-probe.ts`,
);

const requiredConfirmedResetEvidence = [
  'EXPO_PUBLIC_CONFIRMED_RESET_PROBE=1',
  'US-02-08_CONFIRMED_RESET',
  'passed: true',
  'pixeldoro-us-02-08-confirmed-reset-probe.db',
  'pixeldoro-us-02-08-confirmed-reset-failure-probe.db',
  'injected_mid_reset_failure_restored_complete_fingerprint',
  'schema_history_triggers_indexes_and_exact_catalog_were_preserved',
  'EPIC-02_IMPLEMENTATION_EVIDENCE.md',
];

for (const evidence of requiredConfirmedResetEvidence) {
  if (!confirmedResetFlow.includes(evidence)) {
    throw new Error(`Confirmed reset device probe is missing: ${evidence}`);
  }
}

await access(
  `${mobileDirectory}/src/composition/diagnostics/run-confirmed-reset-probe.ts`,
);

const requiredEpic02ExitEvidence = [
  'EXPO_PUBLIC_EPIC_02_EXIT_PROBE=1',
  'EXPO_PUBLIC_EPIC_02_TARGET_KIND=simulator',
  'EXPO_PUBLIC_EPIC_02_TARGET_KIND=emulator',
  'US-02-09_EPIC_EXIT',
  'AWAITING_RELAUNCH',
  'pixeldoro-us-02-09-epic-exit-probe.db',
  'persistent_sentinel_survived_actual_process_relaunch',
  'all_component_probes_passed_with_exact_assertions',
  'NOT_RUN_UNSAFE_OR_NONDETERMINISTIC',
  'normal_boot_reached_ready_after_exit_probe',
  'probe_connections_closed_and_databases_cleaned',
  'EPIC-02_IMPLEMENTATION_EVIDENCE.md',
];

for (const evidence of requiredEpic02ExitEvidence) {
  if (!epic02ExitFlow.includes(evidence)) {
    throw new Error(`Epic 02 exit device probe is missing: ${evidence}`);
  }
}

await access(
  `${mobileDirectory}/src/composition/diagnostics/run-epic-02-exit-probe.ts`,
);

const requiredPetBaseStateEvidence = [
  'EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle',
  'EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus',
  'EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=short_break',
  'EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=long_break',
  'EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=error',
  'unset EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE',
];

for (const evidence of requiredPetBaseStateEvidence) {
  if (!petBaseStateFlow.includes(evidence)) {
    throw new Error(`Pet base-state device guide is missing: ${evidence}`);
  }
}

await access(
  `${mobileDirectory}/src/composition/review/pet-base-review-fixture.ts`,
);

console.log(
  'Manual device checklists, SQLite probes, and required route skeleton are present.',
);
