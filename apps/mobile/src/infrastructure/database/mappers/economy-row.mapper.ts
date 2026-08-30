import type {
  OwnedItemRecord,
  PurchaseReceiptRecord,
  RewardReceiptRecord,
} from '@pixeldoro/application';

import {
  corrupt,
  isNonEmptyString,
  isPositiveSafeInteger,
  isSafeTimestamp,
  isSQLiteBoolean,
  mapped,
  type RowMapping,
} from './row-mapping';

export interface RewardReceiptRow {
  readonly id: unknown;
  readonly session_id: unknown;
  readonly profile_id: unknown;
  readonly xp_delta: unknown;
  readonly coin_delta: unknown;
  readonly reason: unknown;
  readonly created_at: unknown;
}

export interface PurchaseReceiptRow {
  readonly id: unknown;
  readonly profile_id: unknown;
  readonly item_id: unknown;
  readonly price_paid_coins: unknown;
  readonly coin_delta: unknown;
  readonly reason: unknown;
  readonly created_at: unknown;
}

export interface OwnedItemRow {
  readonly profile_id: unknown;
  readonly item_id: unknown;
  readonly purchase_transaction_id: unknown;
  readonly unlocked_at: unknown;
  readonly is_equipped: unknown;
  readonly equipped_at: unknown;
  readonly updated_at: unknown;
}

export const mapRewardReceiptRow = (
  row: RewardReceiptRow,
): RowMapping<RewardReceiptRecord> => {
  if (!isNonEmptyString(row.id)) return corrupt('id');
  if (!isNonEmptyString(row.session_id)) return corrupt('session_id');
  if (row.profile_id !== 1) return corrupt('profile_id');
  if (!isPositiveSafeInteger(row.xp_delta)) return corrupt('xp_delta');
  if (!isPositiveSafeInteger(row.coin_delta)) return corrupt('coin_delta');
  if (
    row.reason !== 'focus_completed' &&
    row.reason !== 'onboarding_trial_completed'
  ) return corrupt('reason');
  if (!isSafeTimestamp(row.created_at)) return corrupt('created_at');
  return mapped({
    id: row.id,
    sessionId: row.session_id,
    profileId: 1,
    xpDelta: row.xp_delta,
    coinDelta: row.coin_delta,
    reason: row.reason,
    createdAt: row.created_at,
  });
};

export const mapPurchaseReceiptRow = (
  row: PurchaseReceiptRow,
): RowMapping<PurchaseReceiptRecord> => {
  if (!isNonEmptyString(row.id)) return corrupt('id');
  if (row.profile_id !== 1) return corrupt('profile_id');
  if (!isNonEmptyString(row.item_id)) return corrupt('item_id');
  if (!isPositiveSafeInteger(row.price_paid_coins)) return corrupt('price_paid_coins');
  if (row.coin_delta !== -row.price_paid_coins) return corrupt('coin_delta');
  if (row.reason !== 'item_purchase') return corrupt('reason');
  if (!isSafeTimestamp(row.created_at)) return corrupt('created_at');
  return mapped({
    id: row.id,
    profileId: 1,
    itemId: row.item_id,
    pricePaidCoins: row.price_paid_coins,
    coinDelta: row.coin_delta,
    reason: 'item_purchase',
    createdAt: row.created_at,
  });
};

export const mapOwnedItemRow = (
  row: OwnedItemRow,
): RowMapping<OwnedItemRecord> => {
  if (row.profile_id !== 1) return corrupt('profile_id');
  if (!isNonEmptyString(row.item_id)) return corrupt('item_id');
  if (!isNonEmptyString(row.purchase_transaction_id)) {
    return corrupt('purchase_transaction_id');
  }
  if (!isSafeTimestamp(row.unlocked_at)) return corrupt('unlocked_at');
  if (!isSQLiteBoolean(row.is_equipped)) return corrupt('is_equipped');
  if (row.equipped_at !== null && !isSafeTimestamp(row.equipped_at)) {
    return corrupt('equipped_at');
  }
  if (
    (row.is_equipped === 0 && row.equipped_at !== null) ||
    (row.is_equipped === 1 && row.equipped_at === null)
  ) return corrupt('equipped_shape');
  if (!isSafeTimestamp(row.updated_at)) return corrupt('updated_at');
  return mapped({
    profileId: 1,
    itemId: row.item_id,
    purchaseTransactionId: row.purchase_transaction_id,
    unlockedAt: row.unlocked_at,
    isEquipped: row.is_equipped === 1,
    equippedAt: row.equipped_at,
    updatedAt: row.updated_at,
  });
};
