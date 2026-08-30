import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FORMAT_VERSION = 1;
const ALGORITHM = 'sha256';
const DOMAIN_PREFIX = 'PIXELDORO_MIGRATION_SOURCE_SET_V1\n';
const MIGRATIONS_DIRECTORY =
  'apps/mobile/src/infrastructure/database/migrations';
const LOCK_PATH = `${MIGRATIONS_DIRECTORY}/migration-lock.json`;
const MIGRATION_FILENAME = /^(\d{3})_([a-z0-9]+(?:-[a-z0-9]+)*)\.migration\.ts$/;
const CHECKSUM = /^[a-f0-9]{64}$/;

const canonicalizeSource = (sourcePath, bytes) => {
  const raw = bytes.toString('utf8');
  if (raw.charCodeAt(0) === 0xfeff) {
    throw new Error(`Migration source must not contain a BOM: ${sourcePath}`);
  }

  const normalized = raw.replace(/\r\n?/g, '\n');
  if (!normalized.endsWith('\n')) {
    throw new Error(`Migration source must end with one newline: ${sourcePath}`);
  }

  return normalized;
};

export const checksumSourceSet = async (repositoryRoot, sourcePaths) => {
  const sorted = [...sourcePaths].sort();
  if (
    sorted.length === 0 ||
    sorted.some((sourcePath, index) => sourcePath !== sourcePaths[index]) ||
    new Set(sorted).size !== sorted.length
  ) {
    throw new Error('Migration source paths must be non-empty, sorted, and unique');
  }

  const hash = createHash(ALGORITHM);
  hash.update(DOMAIN_PREFIX, 'utf8');

  for (const sourcePath of sorted) {
    if (
      sourcePath.startsWith('/') ||
      sourcePath.includes('..') ||
      !sourcePath.startsWith(`${MIGRATIONS_DIRECTORY}/`) ||
      sourcePath.includes('.test.') ||
      sourcePath.includes('/test/')
    ) {
      throw new Error(`Invalid migration source path: ${sourcePath}`);
    }

    const content = canonicalizeSource(
      sourcePath,
      await readFile(resolve(repositoryRoot, sourcePath)),
    );
    hash.update(`PATH ${Buffer.byteLength(sourcePath, 'utf8')}\n`, 'utf8');
    hash.update(sourcePath, 'utf8');
    hash.update(`\nCONTENT ${Buffer.byteLength(content, 'utf8')}\n`, 'utf8');
    hash.update(content, 'utf8');
  }

  return hash.digest('hex');
};

export const validateMigrations = async (repositoryRoot = process.cwd()) => {
  const lock = JSON.parse(
    await readFile(resolve(repositoryRoot, LOCK_PATH), 'utf8'),
  );
  if (lock.formatVersion !== FORMAT_VERSION || lock.algorithm !== ALGORITHM) {
    throw new Error('Unsupported migration lock format or checksum algorithm');
  }

  if (!Array.isArray(lock.migrations) || lock.migrations.length === 0) {
    throw new Error('Migration lock must contain at least one migration');
  }

  const runtimeFiles = (
    await readdir(resolve(repositoryRoot, MIGRATIONS_DIRECTORY))
  )
    .filter((filename) => MIGRATION_FILENAME.test(filename))
    .sort();
  const lockedFiles = [];

  for (const [index, entry] of lock.migrations.entries()) {
    const match = MIGRATION_FILENAME.exec(entry.filename);
    const expectedVersion = index + 1;
    if (
      entry.version !== expectedVersion ||
      match === null ||
      Number(match[1]) !== entry.version ||
      match[2] !== entry.name ||
      !CHECKSUM.test(entry.checksum)
    ) {
      throw new Error(`Invalid migration lock entry at version ${expectedVersion}`);
    }

    const migrationSourcePath = `${MIGRATIONS_DIRECTORY}/${entry.filename}`;
    if (
      !Array.isArray(entry.sourcePaths) ||
      !entry.sourcePaths.includes(migrationSourcePath)
    ) {
      throw new Error(
        `Migration source set must include its runtime artifact: ${migrationSourcePath}`,
      );
    }

    const actualChecksum = await checksumSourceSet(
      repositoryRoot,
      entry.sourcePaths,
    );
    if (actualChecksum !== entry.checksum) {
      throw new Error(
        `Released migration ${entry.filename} checksum mismatch: expected ${entry.checksum}, got ${actualChecksum}`,
      );
    }

    lockedFiles.push(entry.filename);
  }

  if (JSON.stringify(runtimeFiles) !== JSON.stringify(lockedFiles)) {
    throw new Error(
      `Migration lock/runtime file mismatch: runtime=${runtimeFiles.join(',')} lock=${lockedFiles.join(',')}`,
    );
  }

  return { migrationCount: lock.migrations.length };
};

const isDirectRun =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const rootArgumentIndex = process.argv.indexOf('--root');
  const repositoryRoot =
    rootArgumentIndex === -1
      ? resolve(dirname(fileURLToPath(import.meta.url)), '..')
      : resolve(process.argv[rootArgumentIndex + 1]);
  const result = await validateMigrations(repositoryRoot);
  console.log(
    `Migration integrity verified: ${result.migrationCount} immutable migration(s).`,
  );
}
