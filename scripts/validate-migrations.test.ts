import { spawnSync } from 'node:child_process';
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const validator = resolve(repositoryRoot, 'scripts/validate-migrations.mjs');
const migrationsPath =
  'apps/mobile/src/infrastructure/database/migrations';
const temporaryRoots: string[] = [];

const createFixture = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'pixeldoro-migration-integrity-'));
  temporaryRoots.push(root);
  await cp(resolve(repositoryRoot, migrationsPath), resolve(root, migrationsPath), {
    recursive: true,
  });
  return root;
};

const runValidator = (root: string) =>
  spawnSync(process.execPath, [validator, '--root', root], {
    encoding: 'utf8',
  });

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

describe('migration integrity validator', () => {
  it('recomputes the committed canonical source set', async () => {
    const root = await createFixture();

    const result = runValidator(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      'Migration integrity verified: 1 immutable migration(s).',
    );
  });

  it('rejects a released migration source change', async () => {
    const root = await createFixture();
    const migration = resolve(
      root,
      migrationsPath,
      '001_initial-schema.migration.ts',
    );
    const source = await readFile(migration, 'utf8');
    await writeFile(migration, `${source}// injected drift\n`, 'utf8');

    const result = runValidator(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/checksum mismatch/);
  });

  it('rejects a modified checksum lock entry', async () => {
    const root = await createFixture();
    const lockPath = resolve(root, migrationsPath, 'migration-lock.json');
    const lock = await readFile(lockPath, 'utf8');
    await writeFile(
      lockPath,
      lock.replace(/[a-f0-9]{64}/, 'f'.repeat(64)),
      'utf8',
    );

    const result = runValidator(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/checksum mismatch/);
  });
});
