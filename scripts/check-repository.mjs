import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';

const repositoryRoot = process.cwd();
const ignoredDirectories = new Set(['.git', '.expo', 'coverage', 'dist', 'node_modules']);
const ignoredGeneratedPaths = new Set([
  'apps/mobile/android',
  'apps/mobile/artifacts',
  'apps/mobile/ios',
]);
const forbiddenFiles = new Set([
  'package-lock.json',
  'yarn.lock',
  'credentials.json',
]);
const forbiddenExtensions = new Set([
  '.jks',
  '.keystore',
  '.mobileprovision',
  '.p8',
  '.p12',
]);

const files = [];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = resolve(directory, entry.name);
    const repositoryPath = relative(repositoryRoot, absolutePath);
    if (entry.isDirectory()) {
      if (ignoredGeneratedPaths.has(repositoryPath)) {
        continue;
      }

      await walk(absolutePath);
    } else {
      files.push(absolutePath);
    }
  }
};

await walk(repositoryRoot);

const relativeFiles = files.map((file) => relative(repositoryRoot, file));
const lockfiles = relativeFiles.filter((file) => file.endsWith('pnpm-lock.yaml'));

if (lockfiles.length !== 1 || lockfiles[0] !== 'pnpm-lock.yaml') {
  throw new Error(`Expected exactly one root pnpm-lock.yaml; found: ${lockfiles.join(', ') || 'none'}`);
}

const forbidden = relativeFiles.filter(
  (file) => forbiddenFiles.has(file.split('/').at(-1)) || forbiddenExtensions.has(extname(file)),
);

if (forbidden.length > 0) {
  throw new Error(`Forbidden lockfile or credential material found: ${forbidden.join(', ')}`);
}

const manifests = relativeFiles.filter((file) => file.endsWith('package.json'));
for (const manifest of manifests) {
  const content = await readFile(resolve(repositoryRoot, manifest), 'utf8');
  if (content.includes('@shopify/react-native-skia')) {
    throw new Error(`Skia is outside the Epic 1 baseline: ${manifest}`);
  }
}

const retiredPrototypeFiles = relativeFiles.filter(
  (file) => file.startsWith('apps/mobile/src/') && (
    file.includes('/prototype/') || file.split('/').at(-1)?.startsWith('prototype-')
  ),
);

if (retiredPrototypeFiles.length > 0) {
  throw new Error(
    `Retired prototype source re-entered the production graph: ${retiredPrototypeFiles.join(', ')}`,
  );
}

const retiredPrototypeReferences = [];
for (const file of relativeFiles.filter(
  (path) => path.startsWith('apps/mobile/src/') &&
    /\.[jt]sx?$/u.test(path) &&
    !path.includes('.test.'),
)) {
  const content = await readFile(resolve(repositoryRoot, file), 'utf8');
  if (
    content.includes('presentation/prototype') ||
    content.includes('PrototypeProvider') ||
    /\busePrototype\s*\(/u.test(content)
  ) {
    retiredPrototypeReferences.push(file);
  }
}

if (retiredPrototypeReferences.length > 0) {
  throw new Error(
    `Retired prototype reference re-entered production source: ${retiredPrototypeReferences.join(', ')}`,
  );
}

const productionUiFiles = relativeFiles.filter(
  (file) => (
    file.startsWith('apps/mobile/src/app/') ||
    file.startsWith('apps/mobile/src/presentation/')
  ) && file.endsWith('.tsx') && !file.includes('.test.'),
);

const oversizedUiFiles = [];
for (const file of productionUiFiles) {
  const content = await readFile(resolve(repositoryRoot, file), 'utf8');
  const lineCount = content.split(/\r?\n/u).length - (content.endsWith('\n') ? 1 : 0);
  if (lineCount > 300) oversizedUiFiles.push(`${file} (${lineCount})`);
}

if (oversizedUiFiles.length > 0) {
  throw new Error(`Production screen/component exceeds 300 lines: ${oversizedUiFiles.join(', ')}`);
}

const { validateMigrations } = await import('./validate-migrations.mjs');
const migrationResult = await validateMigrations(repositoryRoot);

console.log(
  `Repository hygiene verified: one lockfile, no signing material, no Skia dependency, no retired prototype source, UI files <=300 lines, ${migrationResult.migrationCount} immutable migration(s).`,
);
