import { ESLint } from 'eslint';

const eslint = new ESLint();

const invalidCases = [
  {
    name: 'Domain cannot import shared Application',
    filePath: 'packages/domain/src/__boundary-check__.ts',
    code: "import '@pixeldoro/application';",
  },
  {
    name: 'Shared Application cannot import Expo',
    filePath: 'packages/application/src/__boundary-check__.ts',
    code: "import 'expo';",
  },
  {
    name: 'Shared Application cannot import SQLite',
    filePath: 'packages/application/src/__sqlite-boundary-check__.ts',
    code: "import 'expo-sqlite';",
  },
  {
    name: 'Mobile Application cannot import Infrastructure',
    filePath: 'apps/mobile/src/application/__boundary-check__.ts',
    code: "import '@/infrastructure/platform/clock/device-clock.adapter';",
  },
  {
    name: 'Mobile Application cannot import SQLite',
    filePath: 'apps/mobile/src/application/__sqlite-boundary-check__.ts',
    code: "import 'expo-sqlite';",
  },
  {
    name: 'Mobile Presentation cannot import Domain directly',
    filePath: 'apps/mobile/src/presentation/__boundary-check__.ts',
    code: "import '@pixeldoro/domain';",
  },
  {
    name: 'Route cannot import Infrastructure',
    filePath: 'apps/mobile/src/app/__boundary-check__.tsx',
    code: "import '@/infrastructure/platform/clock/device-clock.adapter';",
  },
  {
    name: 'Composition cannot import SQLite directly',
    filePath: 'apps/mobile/src/composition/__sqlite-boundary-check__.ts',
    code: "import 'expo-sqlite';",
  },
  {
    name: 'Non-database Infrastructure cannot import SQLite',
    filePath: 'apps/mobile/src/infrastructure/platform/__sqlite-boundary-check__.ts',
    code: "import 'expo-sqlite';",
  },
  {
    name: 'Consumer cannot deep-import package source',
    filePath: 'apps/mobile/src/composition/__boundary-check__.ts',
    code: "import '@pixeldoro/domain/src/foundation/domain-foundation';",
  },
  {
    name: 'Production source cannot import test support',
    filePath: 'packages/application/src/__test-boundary-check__.ts',
    code: "import '../../test/fakes/fake-clock';",
  },
];

for (const boundaryCase of invalidCases) {
  const [result] = await eslint.lintText(boundaryCase.code, {
    filePath: boundaryCase.filePath,
  });
  const violations = result?.messages.filter(
    (message) => message.ruleId === 'no-restricted-imports',
  );

  if (violations?.length === 0) {
    throw new Error(`Expected boundary violation was not detected: ${boundaryCase.name}`);
  }
}

const validCases = [
  {
    name: 'Presentation can import mobile Application',
    filePath: 'apps/mobile/src/presentation/__valid-boundary-check__.ts',
    code: "import type { BootstrapProjection } from '@/application';\nexport type Projection = BootstrapProjection;",
  },
  {
    name: 'Infrastructure can implement Application port',
    filePath: 'apps/mobile/src/infrastructure/__valid-boundary-check__.ts',
    code: "import type { AppLifecyclePort } from '@/application';\nexport type Port = AppLifecyclePort;",
  },
  {
    name: 'Database Infrastructure can import SQLite',
    filePath: 'apps/mobile/src/infrastructure/database/__valid-sqlite-boundary-check__.ts',
    code: "import type { SQLiteDatabase } from 'expo-sqlite';\nexport type Database = SQLiteDatabase;",
  },
];

for (const boundaryCase of validCases) {
  const [result] = await eslint.lintText(boundaryCase.code, {
    filePath: boundaryCase.filePath,
  });
  const violations = result?.messages.filter(
    (message) => message.ruleId === 'no-restricted-imports',
  );

  if ((violations?.length ?? 0) > 0) {
    throw new Error(`Valid dependency was rejected: ${boundaryCase.name}`);
  }
}

console.log(`${invalidCases.length} forbidden imports rejected; ${validCases.length} valid imports accepted.`);
