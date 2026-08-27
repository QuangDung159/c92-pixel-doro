import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const deviceDirectory = fileURLToPath(new URL('.', import.meta.url));
const mobileDirectory = fileURLToPath(new URL('../..', import.meta.url));
const flowPath = `${deviceDirectory}foundation-smoke.md`;

await access(flowPath);
const flow = await readFile(flowPath, 'utf8');

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

console.log('Manual device checklist and required route skeleton are present.');
