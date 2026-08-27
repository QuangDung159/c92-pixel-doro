import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import tseslint from 'typescript-eslint';

const domainForbidden = [
  '@pixeldoro/application',
  '@pixeldoro/mobile',
  'react',
  'react-native',
  'expo',
  'expo-router',
  'zustand',
  'expo-sqlite',
  'posthog-react-native',
];

const sharedApplicationForbidden = [
  '@pixeldoro/mobile',
  'react',
  'react-native',
  'expo',
  'expo-router',
  'zustand',
  'expo-sqlite',
  'posthog-react-native',
];

const noRestrictedImports = (paths, patterns = []) => [
  'error',
  {
    paths: paths.map((name) => ({ name, message: `Import ${name} violates the approved layer boundary.` })),
    patterns: patterns.map((group) => ({ group: [group], message: `Import ${group} violates the approved layer boundary.` })),
  },
];

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**',
    '**/.expo/**',
    'apps/mobile/android/**',
    'apps/mobile/ios/**',
  ]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...expoConfig,
  {
    files: ['**/*.{ts,tsx,mts,cts,js,mjs,cjs}'],
    settings: {
      react: {
        version: '19.2',
      },
    },
    rules: {
      'import/no-named-as-default-member': 'off',
      'import/no-unresolved': 'off',
      'no-restricted-imports': noRestrictedImports([], [
        '@pixeldoro/domain/src/**',
        '@pixeldoro/application/src/**',
        '**/test/**',
      ]),
    },
  },
  {
    files: ['packages/domain/src/**/*.ts'],
    rules: {
      'no-restricted-imports': noRestrictedImports(domainForbidden, [
        '@pixeldoro/domain/src/**',
        '@pixeldoro/application/**',
        '@pixeldoro/mobile/**',
        'apps/mobile/**',
        'expo-*/**',
        '**/test/**',
      ]),
    },
  },
  {
    files: ['packages/application/src/**/*.ts'],
    rules: {
      'no-restricted-imports': noRestrictedImports(sharedApplicationForbidden, [
        '@pixeldoro/domain/src/**',
        '@pixeldoro/application/src/**',
        '@pixeldoro/mobile/**',
        'apps/mobile/**',
        'expo-*/**',
        '**/test/**',
      ]),
    },
  },
  {
    files: ['apps/mobile/src/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': noRestrictedImports([
        'react',
        'react-native',
        'expo',
        'expo-router',
        'zustand',
        'expo-sqlite',
        'posthog-react-native',
      ], [
        '@/presentation/**',
        '@/infrastructure/**',
        'expo-*/**',
        '**/test/**',
      ]),
    },
  },
  {
    files: ['apps/mobile/src/presentation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': noRestrictedImports([
        '@pixeldoro/domain',
        'expo',
        'expo-router',
        'expo-sqlite',
        'posthog-react-native',
      ], [
        '@/infrastructure/**',
        'expo-*/**',
        '**/test/**',
      ]),
    },
  },
  {
    files: ['apps/mobile/src/infrastructure/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': noRestrictedImports(['zustand', 'expo-sqlite'], [
        '@/presentation/**',
        '@/app/**',
        'expo-sqlite/**',
        '**/test/**',
      ]),
    },
  },
  {
    files: ['apps/mobile/src/infrastructure/database/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': noRestrictedImports(['zustand'], [
        '@/presentation/**',
        '@/app/**',
        '**/test/**',
      ]),
    },
  },
  {
    files: ['apps/mobile/src/composition/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': noRestrictedImports(['expo-sqlite'], [
        '@pixeldoro/domain/src/**',
        '@pixeldoro/application/src/**',
        'expo-sqlite/**',
        '**/test/**',
      ]),
    },
  },
  {
    files: ['apps/mobile/src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': noRestrictedImports([
        '@pixeldoro/domain',
        'expo-sqlite',
        'posthog-react-native',
      ], [
        '@pixeldoro/domain/**',
        '@/infrastructure/**',
        '**/repositories/**',
        'expo-*/**',
        '**/test/**',
      ]),
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx,js,mjs}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]);
