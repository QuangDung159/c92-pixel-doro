import { describe, expect, it } from 'vitest';

import { domainFoundationHealth } from './domain-foundation';

describe('domain foundation', () => {
  it('runs without a mobile runtime', () => {
    expect(domainFoundationHealth).toEqual({
      packageId: '@pixeldoro/domain',
      isPureTypeScript: true,
    });
  });
});

