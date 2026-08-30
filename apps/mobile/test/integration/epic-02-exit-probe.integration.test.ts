import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  completeEpic02ExitProbe,
  EPIC_02_COMPONENT_ASSERTIONS,
  runEpic02ExitProbe,
  type Epic02ComponentProbeId,
  type Epic02ComponentProbeRunner,
  type Epic02ExitProbeMetadata,
} from '@/composition/diagnostics/run-epic-02-exit-probe';
import type {
  SQLiteConnection,
  SQLiteDriver,
  SQLiteParameters,
  SQLiteWriteResult,
} from '@/infrastructure/database/sqlite-driver';

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      version: '0.1.0',
      runtimeVersion: '0.1.0',
      ios: { bundleIdentifier: 'com.dragonc92team.pixeldoro' },
      android: { package: 'com.dragonc92team.pixeldoro' },
    },
  },
}));

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: vi.fn() }),
  },
  Platform: { OS: 'android', Version: 36 },
}));

const EXIT_DATABASE_NAME = 'pixeldoro-us-02-09-epic-exit-probe.db';
const TIMESTAMP = 1_788_000_000_000;
const FINAL_SHA = '0123456789abcdef0123456789abcdef01234567';
const temporaryDirectories: string[] = [];

const positionalParameters = (parameters: SQLiteParameters): SQLInputValue[] => {
  if (!Array.isArray(parameters)) {
    throw new Error('host_driver_requires_positional_parameters');
  }
  return parameters.map((value) =>
    typeof value === 'boolean' ? (value ? 1 : 0) : value,
  ) as SQLInputValue[];
};

const bindRun = (statement: StatementSync, parameters: SQLiteParameters) =>
  statement.run(...positionalParameters(parameters));

class ExitProbeHostConnection {
  constructor(private readonly database: DatabaseSync) {}

  closeAsync(): Promise<void> {
    this.database.close();
    return Promise.resolve();
  }

  execAsync(sql: string): Promise<void> {
    this.database.exec(sql);
    return Promise.resolve();
  }

  runAsync(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<SQLiteWriteResult> {
    const result = bindRun(this.database.prepare(sql), parameters);
    return Promise.resolve({
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    } as SQLiteWriteResult);
  }

  getFirstAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow | null> {
    return Promise.resolve(
      (this.database.prepare(sql).get(...positionalParameters(parameters)) as
        | TRow
        | undefined) ?? null,
    );
  }

  getAllAsync<TRow>(
    sql: string,
    parameters: SQLiteParameters,
  ): Promise<TRow[]> {
    return Promise.resolve(
      this.database
        .prepare(sql)
        .all(...positionalParameters(parameters)) as TRow[],
    );
  }
}

class ExitProbeHostDriver implements SQLiteDriver {
  constructor(private readonly directory: string) {}

  openDatabase(databaseName: string): Promise<SQLiteConnection> {
    return Promise.resolve(
      new ExitProbeHostConnection(
        new DatabaseSync(join(this.directory, databaseName)),
      ) as unknown as SQLiteConnection,
    );
  }

  async deleteDatabase(databaseName: string): Promise<void> {
    await rm(join(this.directory, databaseName), { force: true });
  }
}

const metadata = (
  commitSha = FINAL_SHA,
): Epic02ExitProbeMetadata => ({
  platform: 'android',
  osVersion: '36',
  targetKind: 'emulator',
  appVersion: '0.1.0',
  runtimeVersion: '0.1.0',
  applicationId: 'com.dragonc92team.pixeldoro',
  commitSha,
});

const componentRunners = (
  mutate?: (
    probe: Epic02ComponentProbeId,
    assertions: readonly string[],
  ) => readonly string[],
): readonly Epic02ComponentProbeRunner[] =>
  (Object.keys(EPIC_02_COMPONENT_ASSERTIONS) as Epic02ComponentProbeId[]).map(
    (probe) => ({
      probe,
      run: () =>
        Promise.resolve({
          probe,
          passed: true,
          platform: 'android',
          osVersion: '36',
          appVersion: '0.1.0',
          applicationId: 'com.dragonc92team.pixeldoro',
          commitSha: FINAL_SHA,
          sqliteVersion: '3.50.3',
          assertions:
            mutate?.(probe, EPIC_02_COMPONENT_ASSERTIONS[probe]) ??
            EPIC_02_COMPONENT_ASSERTIONS[probe],
        }),
    }),
  );

const options = (
  overrides: {
    readonly commitSha?: string;
    readonly componentRunners?: readonly Epic02ComponentProbeRunner[];
    readonly useProductionComponentRunners?: boolean;
  } = {},
) => ({
  clock: { nowMs: () => TIMESTAMP },
  id: { nextId: () => 'epic-02-exit-anonymous-id' },
  metadata: metadata(overrides.commitSha),
  ...(overrides.useProductionComponentRunners === true
    ? {}
    : { componentRunners: overrides.componentRunners ?? componentRunners() }),
  physicalDiskFullStatus:
    'NOT_RUN_UNSAFE_OR_NONDETERMINISTIC' as const,
});

beforeEach(() => {
  process.env.EXPO_PUBLIC_COMMIT_SHA = FINAL_SHA;
});

afterEach(async () => {
  delete process.env.EXPO_PUBLIC_COMMIT_SHA;
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe('US-02-09 aggregate cross-platform exit probe', () => {
  it('persists a phase-one sentinel and completes only after the next launch reaches ready', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-epic-02-exit-'));
    temporaryDirectories.push(directory);
    const driver = new ExitProbeHostDriver(directory);

    const phaseOne = await runEpic02ExitProbe(driver, options());
    expect(phaseOne).toMatchObject({
      probe: 'US-02-09_EPIC_EXIT',
      status: 'AWAITING_RELAUNCH',
      phase: 'sentinel_committed',
      commitSha: FINAL_SHA,
      sqliteVersion: expect.not.stringMatching(/^unavailable$/),
      assertions: [
        'exit_probe_database_opened_and_migrated',
        'persistent_sentinel_committed_before_relaunch',
        'sentinel_connection_closed_before_relaunch',
      ],
    });
    await expect(
      access(join(directory, EXIT_DATABASE_NAME)),
    ).resolves.toBeUndefined();

    const phaseTwo = await runEpic02ExitProbe(
      new ExitProbeHostDriver(directory),
      options(),
    );
    expect(phaseTwo).toMatchObject({
      kind: 'completion_candidate',
      componentProbes: Object.keys(EPIC_02_COMPONENT_ASSERTIONS),
    });
    if (!('kind' in phaseTwo)) {
      throw new Error('completion_candidate_expected');
    }

    const finalReport = await completeEpic02ExitProbe(
      new ExitProbeHostDriver(directory),
      phaseTwo,
      true,
    );
    expect(finalReport).toMatchObject({
      probe: 'US-02-09_EPIC_EXIT',
      passed: true,
      phase: 'completed_after_relaunch',
      physicalDiskFullStatus: 'NOT_RUN_UNSAFE_OR_NONDETERMINISTIC',
      componentProbes: Object.keys(EPIC_02_COMPONENT_ASSERTIONS),
    });
    expect(finalReport.assertions).toEqual([
      'exit_probe_database_opened_and_migrated',
      'persistent_sentinel_survived_actual_process_relaunch',
      'all_component_probes_passed_with_exact_assertions',
      'migration_and_schema_safety_were_cross_platform_equivalent',
      'constraints_repositories_and_queries_were_cross_platform_equivalent',
      'bootstrap_recovery_retry_and_reset_were_cross_platform_equivalent',
      'representative_unavailable_and_write_failures_preserved_durable_truth',
      'no_open_or_deferred_schema_scope_was_detected',
      'runtime_identity_and_final_commit_were_verified',
      'normal_boot_reached_ready_after_exit_probe',
      'probe_connections_closed_and_databases_cleaned',
    ]);
    await expect(
      access(join(directory, EXIT_DATABASE_NAME)),
    ).rejects.toThrow();
  });

  it('fails closed and removes a stale sentinel when the final commit identity changes', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-epic-02-exit-'));
    temporaryDirectories.push(directory);
    const driver = new ExitProbeHostDriver(directory);

    await runEpic02ExitProbe(driver, options());
    const result = await runEpic02ExitProbe(driver, options({
      commitSha: 'abcdef0123456789abcdef0123456789abcdef01',
    }));

    expect(result).toMatchObject({
      passed: false,
      phase: 'failed',
      failedAssertion: 'persistent_sentinel_runtime_identity_mismatched',
      componentProbes: [],
    });
    await expect(
      access(join(directory, EXIT_DATABASE_NAME)),
    ).rejects.toThrow();
  });

  it('rejects missing target-kind evidence instead of assuming device metadata', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-epic-02-exit-'));
    temporaryDirectories.push(directory);
    const driver = new ExitProbeHostDriver(directory);

    const result = await runEpic02ExitProbe(driver, {
      ...options(),
      metadata: { ...metadata(), targetKind: 'not-provided' },
    });

    expect(result).toMatchObject({
      passed: false,
      phase: 'failed',
      targetKind: 'not-provided',
      failedAssertion: 'target_kind_was_not_provided',
    });
  });

  it('rejects component assertion drift without publishing aggregate success', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-epic-02-exit-'));
    temporaryDirectories.push(directory);
    const driver = new ExitProbeHostDriver(directory);
    await runEpic02ExitProbe(driver, options());

    const driftedRunners = componentRunners((probe, assertions) =>
      probe === 'US-02-04_SAFE_BOOTSTRAP' ? assertions.slice(0, -1) : assertions,
    );
    const result = await runEpic02ExitProbe(
      driver,
      options({ componentRunners: driftedRunners }),
    );

    expect(result).toMatchObject({
      passed: false,
      phase: 'failed',
      failedAssertion: 'component_probe_assertion_surface_was_not_exact',
      componentProbes: [
        'US-02-01_SQLITE_KERNEL',
        'US-02-02_INITIAL_SCHEMA',
        'US-02-03_FORWARD_MIGRATION',
      ],
    });
    await expect(
      access(join(directory, EXIT_DATABASE_NAME)),
    ).rejects.toThrow();
  });

  it('accepts the exact production-backed component probe contracts as one aggregate', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-epic-02-exit-'));
    temporaryDirectories.push(directory);
    const driver = new ExitProbeHostDriver(directory);
    const productionOptions = options({ useProductionComponentRunners: true });

    await runEpic02ExitProbe(driver, productionOptions);
    const phaseTwo = await runEpic02ExitProbe(driver, productionOptions);

    expect(phaseTwo).toMatchObject({
      kind: 'completion_candidate',
      componentProbes: Object.keys(EPIC_02_COMPONENT_ASSERTIONS),
    });
    if (!('kind' in phaseTwo)) {
      throw new Error('production_completion_candidate_expected');
    }

    const finalReport = await completeEpic02ExitProbe(
      driver,
      phaseTwo,
      true,
    );
    expect(finalReport).toMatchObject({
      passed: true,
      componentProbes: Object.keys(EPIC_02_COMPONENT_ASSERTIONS),
    });
    expect(finalReport).not.toHaveProperty('failedAssertion');
  });
});
