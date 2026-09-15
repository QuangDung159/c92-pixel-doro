import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = resolve(process.cwd(), 'scripts/run-mobile-update.mjs');
const run = (args: readonly string[]) => spawnSync(process.execPath, [script, ...args], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

describe('mobile update entry point', () => {
  it('rejects every direct production source publish before Git or EAS work', () => {
    const result = run([
      'source', '--target', 'production', '--base', 'a'.repeat(40),
      '--runtime', '1.0.1', '--platform', 'all', '--message', 'hotfix', '--execute',
      '--authorization', 'OTA-NONPROD-TEST',
    ]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('DIRECT_PRODUCTION_SOURCE_PUBLISH_FORBIDDEN');
    expect(result.stdout).not.toContain('eas-cli');
  });

  it('requires an explicit non-production authorization for execute mode', () => {
    const result = run([
      'source', '--target', 'staging', '--base', 'a'.repeat(40),
      '--runtime', '1.0.1', '--platform', 'all', '--message', 'hotfix', '--execute',
    ]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('NONPRODUCTION_EXECUTION_AUTHORIZATION_MISSING');
    expect(result.stdout).not.toContain('eas-cli');
  });

  it('rejects missing messages before creating a publish-capable preflight', () => {
    const result = run([
      'source', '--target', 'qa', '--base', 'a'.repeat(40),
      '--runtime', '1.0.1', '--platform', 'ios', '--dry-run',
    ]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('UPDATE_REQUIRED_ARGUMENT_MISSING');
    expect(result.stdout).toBe('');
  });
});
