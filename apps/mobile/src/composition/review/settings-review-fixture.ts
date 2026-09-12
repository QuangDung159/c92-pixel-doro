export const SETTINGS_REVIEW_SCENARIOS = ['epic_10_quick'] as const;
export type SettingsReviewScenario = typeof SETTINGS_REVIEW_SCENARIOS[number];

export const resolveSettingsReviewScenario = (
  value: string | undefined,
  enabled: boolean,
): SettingsReviewScenario | undefined =>
  enabled && SETTINGS_REVIEW_SCENARIOS.includes(value as SettingsReviewScenario)
    ? value as SettingsReviewScenario
    : undefined;

export const settingsReviewDatabaseName = (
  scenario: SettingsReviewScenario,
): string => `pixeldoro-us-10-${scenario.replaceAll('_', '-')}.db`;
