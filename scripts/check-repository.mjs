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

console.log('Repository hygiene verified: one lockfile, no signing material, no Skia dependency.');
