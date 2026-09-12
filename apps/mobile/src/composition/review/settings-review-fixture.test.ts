import { describe, expect, it } from 'vitest';
import {
  resolveSettingsReviewScenario,
  settingsReviewDatabaseName,
} from './settings-review-fixture';

describe('EPIC-10 Settings review fixture', () => {
  it('is dev-gated and always uses a disposable database prefix', () => {
    expect(resolveSettingsReviewScenario('epic_10_quick', false)).toBeUndefined();
    expect(resolveSettingsReviewScenario('unknown', true)).toBeUndefined();
    const scenario = resolveSettingsReviewScenario('epic_10_quick', true);
    expect(scenario).toBe('epic_10_quick');
    expect(settingsReviewDatabaseName(scenario!)).toBe(
      'pixeldoro-us-10-epic-10-quick.db',
    );
    expect(settingsReviewDatabaseName(scenario!)).not.toBe('pixeldoro.db');
  });
});
