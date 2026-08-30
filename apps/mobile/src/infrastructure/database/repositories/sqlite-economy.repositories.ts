import {
  persistenceError,
  type OwnedItemRecord,
  type OwnedItemRepository,
  type PurchaseReceiptRecord,
  type PurchaseReceiptRepository,
  type RewardReceiptRecord,
  type RewardReceiptRepository,
  type TransactionScope,
} from '@pixeldoro/application';

import {
  mapOwnedItemRow,
  mapPurchaseReceiptRow,
  mapRewardReceiptRow,
  type OwnedItemRow,
  type PurchaseReceiptRow,
  type RewardReceiptRow,
} from '../mappers/economy-row.mapper';
import { isNonEmptyString, isSafeTimestamp } from '../mappers/row-mapping';
import type { SQLiteDatabaseOwner } from '../sqlite-database-owner';
import type { SQLiteExecutor } from '../sqlite-executor';
import type { SQLiteTransaction } from '../sqlite-transaction';
import {
  mapWriteError,
  readMappedAll,
  readMappedOne,
  readWithOwner,
  withTransactionExecutor,
} from './sqlite-repository-support';

const rewardSelect = `SELECT id, session_id, profile_id, xp_delta, coin_delta, reason,
  created_at FROM reward_transactions`;
const purchaseSelect = `SELECT id, profile_id, item_id, price_paid_coins, coin_delta,
  reason, created_at FROM purchase_transactions`;
const ownedSelect = `SELECT profile_id, item_id, purchase_transaction_id, unlocked_at,
  is_equipped, equipped_at, updated_at FROM owned_items`;

const rewardToRow = (record: RewardReceiptRecord): RewardReceiptRow => ({
  id: record.id,
  session_id: record.sessionId,
  profile_id: record.profileId,
  xp_delta: record.xpDelta,
  coin_delta: record.coinDelta,
  reason: record.reason,
  created_at: record.createdAt,
});

const purchaseToRow = (record: PurchaseReceiptRecord): PurchaseReceiptRow => ({
  id: record.id,
  profile_id: record.profileId,
  item_id: record.itemId,
  price_paid_coins: record.pricePaidCoins,
  coin_delta: record.coinDelta,
  reason: record.reason,
  created_at: record.createdAt,
});

const ownedToRow = (record: OwnedItemRecord): OwnedItemRow => ({
  profile_id: record.profileId,
  item_id: record.itemId,
  purchase_transaction_id: record.purchaseTransactionId,
  unlocked_at: record.unlockedAt,
  is_equipped: record.isEquipped ? 1 : 0,
  equipped_at: record.equippedAt,
  updated_at: record.updatedAt,
});

export class SQLiteRewardReceiptRepository implements RewardReceiptRepository {
  constructor(
    private readonly owner: SQLiteDatabaseOwner,
    private readonly transaction: SQLiteTransaction,
  ) {}

  findById(id: string): ReturnType<RewardReceiptRepository['findById']> {
    return this.find(`${rewardSelect} WHERE id = ?`, [id], id);
  }

  findBySessionId(sessionId: string): ReturnType<RewardReceiptRepository['findBySessionId']> {
    return this.find(`${rewardSelect} WHERE session_id = ?`, [sessionId], sessionId);
  }

  insertInTransaction(
    scope: TransactionScope,
    record: RewardReceiptRecord,
  ): ReturnType<RewardReceiptRepository['insertInTransaction']> {
    const validation = mapRewardReceiptRow(rewardToRow(record));
    if (!validation.ok) return invalidWrite('reward_transactions', validation.field);
    return withTransactionExecutor(this.transaction, scope, 'reward_transactions', async (executor) => {
      try {
        await executor.run(
          `INSERT INTO reward_transactions
            (id, session_id, profile_id, xp_delta, coin_delta, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [record.id, record.sessionId, record.profileId, record.xpDelta,
            record.coinDelta, record.reason, record.createdAt],
        );
        return { ok: true, value: undefined };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'reward_transactions') };
      }
    });
  }

  private find(
    sql: string,
    parameters: readonly [string],
    value: string,
  ): ReturnType<RewardReceiptRepository['findById']> {
    if (!isNonEmptyString(value)) return invalidQuery('reward_transactions', 'id');
    return readWithOwner(this.owner, 'reward_transactions', (executor) =>
      readMappedOne(executor, 'reward_transactions', sql, [...parameters], mapRewardReceiptRow));
  }
}

export class SQLitePurchaseReceiptRepository implements PurchaseReceiptRepository {
  constructor(
    private readonly owner: SQLiteDatabaseOwner,
    private readonly transaction: SQLiteTransaction,
  ) {}

  findById(id: string): ReturnType<PurchaseReceiptRepository['findById']> {
    if (!isNonEmptyString(id)) return invalidQuery('purchase_transactions', 'id');
    return readWithOwner(this.owner, 'purchase_transactions', (executor) =>
      readMappedOne(executor, 'purchase_transactions', `${purchaseSelect} WHERE id = ?`, [id], mapPurchaseReceiptRow));
  }

  findByProfileAndItem(
    profileId: number,
    itemId: string,
  ): ReturnType<PurchaseReceiptRepository['findByProfileAndItem']> {
    if (profileId !== 1 || !isNonEmptyString(itemId)) {
      return invalidQuery('purchase_transactions', 'identity');
    }
    return readWithOwner(this.owner, 'purchase_transactions', (executor) =>
      readMappedOne(executor, 'purchase_transactions',
        `${purchaseSelect} WHERE profile_id = ? AND item_id = ?`,
        [profileId, itemId], mapPurchaseReceiptRow));
  }

  insertInTransaction(
    scope: TransactionScope,
    record: PurchaseReceiptRecord,
  ): ReturnType<PurchaseReceiptRepository['insertInTransaction']> {
    const validation = mapPurchaseReceiptRow(purchaseToRow(record));
    if (!validation.ok) return invalidWrite('purchase_transactions', validation.field);
    return withTransactionExecutor(this.transaction, scope, 'purchase_transactions', async (executor) => {
      try {
        await executor.run(
          `INSERT INTO purchase_transactions
            (id, profile_id, item_id, price_paid_coins, coin_delta, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [record.id, record.profileId, record.itemId, record.pricePaidCoins,
            record.coinDelta, record.reason, record.createdAt],
        );
        return { ok: true, value: undefined };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'purchase_transactions') };
      }
    });
  }
}

export class SQLiteOwnedItemRepository implements OwnedItemRepository {
  constructor(
    private readonly owner: SQLiteDatabaseOwner,
    private readonly transaction: SQLiteTransaction,
  ) {}

  find(profileId: number, itemId: string): ReturnType<OwnedItemRepository['find']> {
    return readWithOwner(this.owner, 'owned_items', (executor) =>
      this.read(executor, profileId, itemId));
  }

  listByProfile(profileId: number): ReturnType<OwnedItemRepository['listByProfile']> {
    if (profileId !== 1) return invalidQuery('owned_items', 'profile_id');
    return readWithOwner(this.owner, 'owned_items', (executor) =>
      readMappedAll(executor, 'owned_items',
        `${ownedSelect} WHERE profile_id = ? ORDER BY unlocked_at, item_id`,
        [profileId], mapOwnedItemRow));
  }

  findInTransaction(
    scope: TransactionScope,
    profileId: number,
    itemId: string,
  ): ReturnType<OwnedItemRepository['findInTransaction']> {
    return withTransactionExecutor(this.transaction, scope, 'owned_items', (executor) =>
      this.read(executor, profileId, itemId));
  }

  insertInTransaction(
    scope: TransactionScope,
    record: OwnedItemRecord,
  ): ReturnType<OwnedItemRepository['insertInTransaction']> {
    const validation = mapOwnedItemRow(ownedToRow(record));
    if (!validation.ok) return invalidWrite('owned_items', validation.field);
    return withTransactionExecutor(this.transaction, scope, 'owned_items', async (executor) => {
      try {
        await executor.run(
          `INSERT INTO owned_items (profile_id, item_id, purchase_transaction_id,
            unlocked_at, is_equipped, equipped_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [record.profileId, record.itemId, record.purchaseTransactionId, record.unlockedAt,
            record.isEquipped ? 1 : 0, record.equippedAt, record.updatedAt],
        );
        return { ok: true, value: undefined };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'owned_items') };
      }
    });
  }

  setEquippedInTransaction(
    scope: TransactionScope,
    input: Parameters<OwnedItemRepository['setEquippedInTransaction']>[1],
  ): ReturnType<OwnedItemRepository['setEquippedInTransaction']> {
    const valid = input.profileId === 1 && isNonEmptyString(input.itemId) &&
      isSafeTimestamp(input.updatedAt) &&
      ((input.isEquipped && isSafeTimestamp(input.equippedAt)) ||
        (!input.isEquipped && input.equippedAt === null));
    if (!valid) return invalidWrite('owned_items', 'input');
    return withTransactionExecutor(this.transaction, scope, 'owned_items', async (executor) => {
      try {
        const result = await executor.run(
          `UPDATE owned_items SET is_equipped = ?, equipped_at = ?, updated_at = ?
            WHERE profile_id = ? AND item_id = ?`,
          [input.isEquipped ? 1 : 0, input.equippedAt, input.updatedAt,
            input.profileId, input.itemId],
        );
        return { ok: true, value: result.changes === 1 ? 'updated' : 'not_updated' };
      } catch (error) {
        return { ok: false, error: mapWriteError(error, 'owned_items') };
      }
    });
  }

  private read(
    executor: SQLiteExecutor,
    profileId: number,
    itemId: string,
  ): ReturnType<OwnedItemRepository['find']> {
    if (profileId !== 1 || !isNonEmptyString(itemId)) {
      return invalidQuery('owned_items', 'identity');
    }
    return readMappedOne(executor, 'owned_items',
      `${ownedSelect} WHERE profile_id = ? AND item_id = ?`,
      [profileId, itemId], mapOwnedItemRow);
  }
}

const invalidWrite = (entity: string, field: string) => Promise.resolve({
  ok: false as const,
  error: persistenceError('PERSISTENCE_WRITE_FAILED', entity, field),
});

const invalidQuery = (entity: string, field: string) => Promise.resolve({
  ok: false as const,
  error: persistenceError('PERSISTENCE_QUERY_FAILED', entity, field),
});
