import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const deviceDirectory = fileURLToPath(new URL('.', import.meta.url));
const mobileDirectory = fileURLToPath(new URL('../..', import.meta.url));
const flowPath = `${deviceDirectory}foundation-smoke.md`;
const sqliteFlowPath = `${deviceDirectory}sqlite-kernel-smoke.md`;
const schemaFlowPath = `${deviceDirectory}initial-schema-smoke.md`;

await access(flowPath);
await access(sqliteFlowPath);
await access(schemaFlowPath);
const flow = await readFile(flowPath, 'utf8');
const sqliteFlow = await readFile(sqliteFlowPath, 'utf8');
const schemaFlow = await readFile(schemaFlowPath, 'utf8');

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

console.log(
  'Manual device checklists, SQLite probes, and required route skeleton are present.',
);
