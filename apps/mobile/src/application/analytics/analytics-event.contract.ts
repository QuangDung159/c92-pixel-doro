import type {
  AnalyticsProperties,
  ApprovedAnalyticsEventName,
} from '../persistence/analytics-event.repository';

const approvedItemIds = new Set([
  'desk-mug', 'tiny-plant', 'book-stack', 'desk-lamp', 'wall-calendar',
  'floor-cushion', 'small-rug', 'wall-poster', 'bookshelf', 'standing-lamp',
  'armchair', 'window-view',
]);

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => keys.includes(key));
};

const isOneOf = <TValue extends string>(
  value: unknown,
  choices: readonly TValue[],
): value is TValue => typeof value === 'string' && choices.includes(value as TValue);

const isDuration = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 5 && value <= 120;

const isStandardFocus = (value: Record<string, unknown>): boolean =>
  exactKeys(value, ['mode', 'workTag', 'durationMinutes']) &&
  isOneOf(value.mode, ['relax', 'strict']) &&
  isOneOf(value.workTag, ['coding', 'study', 'writing', 'reading']) &&
  isDuration(value.durationMinutes) && value.durationMinutes >= 15;

const isTerminalFocus = (
  value: Record<string, unknown>,
  terminalStatus: 'completed' | 'failed' | 'cancelled',
): boolean => exactKeys(value, ['mode', 'workTag', 'durationMinutes', 'terminalStatus']) &&
  isOneOf(value.mode, ['relax', 'strict']) &&
  isOneOf(value.workTag, ['coding', 'study', 'writing', 'reading']) &&
  isDuration(value.durationMinutes) && value.durationMinutes >= 15 &&
  value.terminalStatus === terminalStatus;

const isBreak = (
  value: Record<string, unknown>,
  completed: boolean,
): boolean => {
  const expected = completed
    ? ['breakType', 'durationMinutes', 'terminalStatus']
    : ['breakType', 'durationMinutes'];
  if (!exactKeys(value, expected)) return false;
  const durationMatches = value.breakType === 'short_break'
    ? value.durationMinutes === 5
    : value.breakType === 'long_break' && value.durationMinutes === 15;
  return durationMatches && (!completed || value.terminalStatus === 'completed');
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

export const validateAnalyticsEventPayload = (
  eventName: ApprovedAnalyticsEventName,
  properties: unknown,
): properties is AnalyticsProperties => {
  if (!isPlainObject(properties) || Object.keys(properties).length > 20) return false;
  switch (eventName) {
    case 'onboarding_started':
    case 'onboarding_completed':
    case 'focus_setup_viewed':
    case 'shop_viewed':
    case 'history_viewed':
    case 'feedback_started':
    case 'feedback_submitted':
    case 'store_review_requested':
      return exactKeys(properties, []);
    case 'focus_session_started':
      return isStandardFocus(properties);
    case 'focus_session_completed':
      return isTerminalFocus(properties, 'completed');
    case 'focus_session_failed':
      return isTerminalFocus(properties, 'failed');
    case 'focus_session_cancelled':
      return isTerminalFocus(properties, 'cancelled');
    case 'break_started':
      return isBreak(properties, false);
    case 'break_completed':
      return isBreak(properties, true);
    case 'reward_granted':
      return exactKeys(properties, ['durationMinutes', 'xpEarned', 'coinsEarned']) &&
        isDuration(properties.durationMinutes) && properties.durationMinutes >= 15 &&
        typeof properties.xpEarned === 'number' &&
        Number.isSafeInteger(properties.xpEarned) && properties.xpEarned >= 0 &&
        properties.xpEarned <= 120 && typeof properties.coinsEarned === 'number' &&
        Number.isSafeInteger(properties.coinsEarned) && properties.coinsEarned >= 0 &&
        properties.coinsEarned <= 24;
    case 'item_unlocked':
      return exactKeys(properties, ['itemId', 'pricePaidCoins']) &&
        typeof properties.itemId === 'string' && approvedItemIds.has(properties.itemId) &&
        typeof properties.pricePaidCoins === 'number' &&
        Number.isSafeInteger(properties.pricePaidCoins) && properties.pricePaidCoins > 0;
    case 'item_equipped':
      return exactKeys(properties, ['itemId']) && typeof properties.itemId === 'string' &&
        approvedItemIds.has(properties.itemId);
  }
};

