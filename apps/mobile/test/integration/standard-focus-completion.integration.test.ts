import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CancelStandardFocusUseCase, LoadStandardFocusResultUseCase, RecordStrictBackgroundUseCase,
  ReconcileStandardFocusUseCase, SessionCommandCoordinator, StartStandardFocusUseCase,
  persistenceError, type ReconcileStandardFocusDependencies,
} from '@pixeldoro/application';
import { HostDriver, openDatabase, now } from '../support/standard-focus-sqlite';
import { createMobileApplication } from '@/composition/create-mobile-application';
import { createStandardFocusCompletionReviewFixture } from '@/composition/review/standard-focus-completion-review-fixture';

vi.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: () => ({ remove: vi.fn() }) },
}));
const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
});
const setup = async (mode: 'relax' | 'strict' = 'relax', durationMinutes = 15) => {
  const directory = await mkdtemp(join(tmpdir(), 'pixeldoro-us0604-'));
  cleanup.push(() => rm(directory, { recursive: true, force: true }));
  const driver = new HostDriver(directory);
  const db = await openDatabase(driver, 'completion.db');
  cleanup.push(() => db.owner.close());
  let time = now;
  let id = 0;
  const coordinator = new SessionCommandCoordinator();
  const clock = { nowMs: () => time };
  const dependencies = {
    clock, coordinator, id: { nextId: () => `id-${++id}` },
    sessions: db.graph.sessions, profile: db.graph.profile, rewards: db.graph.rewards, transaction: db.transaction,
  };
  const start = new StartStandardFocusUseCase({
    ...dependencies, calendar: { snapshot: () => ({ ok: true, value: { localDate: '2026-09-03', utcOffsetMinutes: 420 } }) },
  });
  expect(await start.execute({ durationMinutes, mode, workTag: 'study' })).toMatchObject({ ok: true });
  const load = new LoadStandardFocusResultUseCase(dependencies);
  const reconcile = new ReconcileStandardFocusUseCase(dependencies);
  return { ...db, directory, driver, dependencies, coordinator, clock, start, load, reconcile,
    setTime: (value: number) => { time = value; }, sessionId: 'id-1', endsAt: now + durationMinutes * 60_000 };
};
const override = <T extends object>(target: T, changes: Partial<T>): T => new Proxy(target, {
  get(object, key) {
    const value = key in changes ? Reflect.get(changes, key) : Reflect.get(object, key);
    return typeof value === 'function' ? value.bind(object) : value;
  },
});

describe('Standard completion atomic SQLite truth', () => {
  it('reopens earned rewards after a real purchase with ledger-consistent lower balance', async () => {
    const h = await setup('relax', 25);
    h.setTime(h.endsAt);
    expect(await h.reconcile.execute()).toMatchObject({ ok: true });
    expect(await h.transaction.execute(async (scope) => {
      const debit = await h.graph.profile.debitCatalogItemInTransaction(scope, {
        profileId: 1, itemId: 'desk-mug', updatedAt: h.endsAt + 1,
      });
      if (!debit.ok) return debit;
      expect(debit.value).toBe('updated');
      const receipt = await h.graph.purchases.insertInTransaction(scope, {
        id: 'purchase-1', profileId: 1, itemId: 'desk-mug', pricePaidCoins: 5,
        coinDelta: -5, reason: 'item_purchase', createdAt: h.endsAt + 1,
      });
      if (!receipt.ok) return receipt;
      return h.graph.ownedItems.insertInTransaction(scope, {
        profileId: 1, itemId: 'desk-mug', purchaseTransactionId: 'purchase-1',
        unlockedAt: h.endsAt + 1, isEquipped: false, equippedAt: null, updatedAt: h.endsAt + 1,
      });
    })).toMatchObject({ ok: true });
    expect(await h.load.execute(h.sessionId)).toMatchObject({ ok: true, value: { result: {
      xpEarned: 25, coinsEarned: 5, totalXp: 25, coinBalance: 0,
    } } });
    const facts = await h.owner.withConnection((connection) => connection.getFirstAsync(
      `SELECT total_xp = (SELECT SUM(xp_delta) FROM reward_transactions) AS xp_matches,
        coin_balance = (SELECT SUM(coin_delta) FROM reward_transactions) +
          (SELECT SUM(coin_delta) FROM purchase_transactions) AS coin_matches,
        (SELECT COUNT(*) FROM reward_transactions WHERE session_id = ?) AS receipts
        FROM pet_profiles WHERE id = 1`, [h.sessionId],
    ));
    expect(facts).toMatchObject({ xp_matches: 1, coin_matches: 1, receipts: 1 });
  });

  it('post-commit Result read failure retries only reads; disabled fixture never fails', async () => {
    const h = await setup();
    h.setTime(h.endsAt);
    const fixture = createStandardFocusCompletionReviewFixture('standard_completion_result_read_failure_once', true,
      h.graph.profile, h.graph.rewards);
    expect(await h.reconcile.execute()).toMatchObject({ ok: true });
    const reader = new LoadStandardFocusResultUseCase({ ...h.dependencies, rewards: fixture.resultRewards });
    expect(await reader.execute(h.sessionId)).toMatchObject({ ok: false, error: { code: 'STANDARD_FOCUS_RESULT_READ_FAILED' } });
    expect(await reader.execute(h.sessionId)).toMatchObject({ ok: true, value: { result: { totalXp: 15, coinBalance: 3 } } });
    const disabled = createStandardFocusCompletionReviewFixture('standard_completion_result_read_failure_once', false,
      h.graph.profile, h.graph.rewards);
    expect(await new LoadStandardFocusResultUseCase({ ...h.dependencies, rewards: disabled.resultRewards }).execute(h.sessionId))
      .toMatchObject({ ok: true });
  });
  it.each([15, 25, 120])('grants configured %i minutes once across duplicate/reopen/late reconciliation', async (minutes) => {
    const h = await setup('relax', minutes);
    h.setTime(h.endsAt + 600_000);
    const results = await Promise.all([h.reconcile.execute(), h.reconcile.execute(h.sessionId)]);
    expect(results[0]).toMatchObject({ ok: true, value: { outcome: 'completed', freshness: 'fresh_commit',
      result: { xpEarned: minutes, coinsEarned: minutes / 5, totalXp: minutes, coinBalance: minutes / 5 } } });
    expect(results[1]).toMatchObject({ ok: true, value: { outcome: 'completed', freshness: 'existing_terminal' } });
    expect(await h.graph.sessions.findActive()).toEqual({ ok: true, value: null });
    expect(await h.graph.rewards.findBySessionId(h.sessionId)).toMatchObject({ ok: true,
      value: { reason: 'focus_completed', xpDelta: minutes, coinDelta: minutes / 5 } });
    await h.owner.close();
    const reopened = await openDatabase(h.driver, 'completion.db');
    cleanup.push(() => reopened.owner.close());
    const reader = new LoadStandardFocusResultUseCase({ ...reopened.graph, transaction: reopened.transaction });
    expect(await reader.execute(h.sessionId)).toMatchObject({ ok: true, value: { result: { status: 'completed',
      xpEarned: minutes, coinsEarned: minutes / 5, totalXp: minutes, coinBalance: minutes / 5 } } });
    const existing = new ReconcileStandardFocusUseCase({ ...h.dependencies, ...reopened.graph, transaction: reopened.transaction });
    expect(await existing.execute(h.sessionId)).toMatchObject({ ok: true, value: { freshness: 'existing_terminal' } });
  });

  it.each(['receipt', 'receipt_conflict', 'profile', 'profile_missing', 'profile_not_updated',
    'profile_postcondition', 'transition', 'post_read', 'overflow', 'commit'] as const)(
    'rolls back every write on %s failure, then retries exactly once', async (stage) => {
      const h = await setup();
      h.setTime(h.endsAt);
      const fail = { ok: false as const, error: persistenceError('PERSISTENCE_WRITE_FAILED', 'sessions') };
      const deps: ReconcileStandardFocusDependencies = { ...h.dependencies };
      let mutations: Partial<ReconcileStandardFocusDependencies> = {};
      if (stage === 'receipt') mutations = { rewards: override(h.graph.rewards, { insertInTransaction: async () => fail }) };
      if (stage === 'receipt_conflict') mutations = { rewards: override(h.graph.rewards, {
        insertInTransaction: async (scope, receipt) => {
          expect(await h.graph.rewards.insertInTransaction(scope, receipt)).toMatchObject({ ok: true });
          return h.graph.rewards.insertInTransaction(scope, { ...receipt, id: 'conflict-id' });
        },
      }) };
      if (stage === 'profile') mutations = { profile: override(h.graph.profile, { applyProgressionInTransaction: async () => fail }) };
      if (stage === 'profile_missing') mutations = { profile: override(h.graph.profile, {
        findInTransaction: async () => ({ ok: true, value: null }),
      }) };
      if (stage === 'profile_not_updated' || stage === 'profile_postcondition') mutations = { profile: override(h.graph.profile, {
        applyProgressionInTransaction: async () => ({ ok: true, value: stage === 'profile_not_updated' ? 'not_updated' : 'updated' }),
      }) };
      if (stage === 'transition') mutations = { sessions: override(h.graph.sessions, { transitionFromRunningInTransaction: async () => fail }) };
      if (stage === 'post_read') mutations = { sessions: override(h.graph.sessions, { findByIdInTransaction: async () => fail }) };
      if (stage === 'overflow') mutations = { profile: override(h.graph.profile, {
        findInTransaction: async () => ({ ok: true, value: { id: 1, totalXp: Number.MAX_SAFE_INTEGER,
          coinBalance: 0, createdAt: now, updatedAt: now } }),
      }) };
      if (stage === 'commit') h.driver.failNextCommit();
      expect(await new ReconcileStandardFocusUseCase({ ...deps, ...mutations }).execute()).toMatchObject({ ok: false });
      expect(await h.graph.sessions.findById(h.sessionId)).toMatchObject({ ok: true, value: {
        status: 'running', xpEarned: 0, coinsEarned: 0, rewardClaimedAt: null,
      } });
      expect(await h.graph.rewards.findBySessionId(h.sessionId)).toEqual({ ok: true, value: null });
      expect(await h.graph.profile.find()).toMatchObject({ ok: true, value: { totalXp: 0, coinBalance: 0 } });
      expect(await h.reconcile.execute()).toMatchObject({ ok: true, value: { freshness: 'fresh_commit' } });
      expect(await h.reconcile.execute(h.sessionId)).toMatchObject({ ok: true, value: { freshness: 'existing_terminal' } });
      expect(await h.graph.profile.find()).toMatchObject({ ok: true, value: { totalXp: 15, coinBalance: 3 } });
    });

  it.each([
    ['missing', null, 'completed'],
    ['deadline-first', -5_000, 'completed'],
    ['equal', -10_000, 'failed'],
    ['violation-first', -11_000, 'failed'],
  ] as const)('preserves Strict %s precedence at late foreground', async (_name, offset, outcome) => {
    const h = await setup('strict');
    if (offset !== null) expect(await new RecordStrictBackgroundUseCase(h.dependencies).execute(h.endsAt + offset)).toMatchObject({ ok: true });
    h.setTime(h.endsAt + 30_000);
    expect(await h.reconcile.execute()).toMatchObject({ ok: true, value: { outcome } });
    expect(await h.load.execute(h.sessionId)).toMatchObject({ ok: true, value: { result: { status: outcome,
      xpEarned: outcome === 'completed' ? 15 : 0 } } });
    expect(await h.graph.rewards.findBySessionId(h.sessionId)).toMatchObject(
      outcome === 'completed' ? { ok: true, value: { xpDelta: 15 } } : { ok: true, value: null },
    );
  });

  it('keeps cancel-first terminal immutable and rejects cancel after deadline', async () => {
    const h = await setup();
    const cancel = new CancelStandardFocusUseCase(h.dependencies);
    h.setTime(h.endsAt - 1);
    expect(await cancel.execute(h.sessionId)).toMatchObject({ ok: true, value: { outcome: 'cancelled' } });
    h.setTime(h.endsAt + 1);
    expect(await h.reconcile.execute(h.sessionId)).toMatchObject({ ok: true, value: { outcome: 'terminal_winner' } });
    expect(await h.graph.profile.find()).toMatchObject({ ok: true, value: { totalXp: 0 } });
    expect(await h.start.execute({ durationMinutes: 15, mode: 'relax', workTag: 'study' })).toMatchObject({ ok: true });
    h.setTime(h.endsAt + 1 + 900_000);
    expect(await cancel.execute('id-2')).toMatchObject({ ok: false, error: { code: 'SESSION_DEADLINE_REACHED' } });
    expect(await h.reconcile.execute()).toMatchObject({ ok: true, value: { outcome: 'completed' } });
    expect(await cancel.execute('id-2')).toMatchObject({ ok: false, error: { code: 'SESSION_ALREADY_TERMINAL' } });
  });

  it.each(['standard_completion_receipt_failure_once', 'standard_completion_profile_failure_once'])('retries the real %s fixture without partial truth', async (scenario) => {
    const h = await setup();
    h.setTime(h.endsAt);
    const fixture = createStandardFocusCompletionReviewFixture(scenario, true, h.graph.profile, h.graph.rewards);
    const useCase = new ReconcileStandardFocusUseCase({ ...h.dependencies, ...fixture });
    expect(await useCase.execute()).toMatchObject({ ok: false });
    expect(await h.graph.profile.find()).toMatchObject({ ok: true, value: { totalXp: 0, coinBalance: 0 } });
    expect(await useCase.execute()).toMatchObject({ ok: true, value: { freshness: 'fresh_commit' } });
  });

  it('fresh startup completion refreshes profile, routes Result and does not replay on next cold start', async () => {
    const h = await setup();
    await h.graph.installation.setOnboardingCompleted(now, now);
    await h.owner.close();
    const make = () => createMobileApplication({
      appLifecycle: { getCurrentState: () => 'active', subscribe: () => vi.fn() },
      clock: { nowMs: () => h.endsAt + 1 }, id: { nextId: () => 'startup-receipt' },
      databaseName: 'completion.db', sqliteDriver: h.driver, diagnosticsEnabled: false,
    });
    const first = make();
    cleanup.push(() => first.dispose());
    await first.boot();
    expect(first.firstUseEntry.getSnapshot()).toMatchObject({ status: 'ready', destination: 'standard_focus_result', sessionId: h.sessionId });
    expect(first.standardFocusOutcome.getSnapshot()).toMatchObject({ status: 'completed', receiptId: 'startup-receipt' });
    expect(first.bootstrap.getSnapshot()).toMatchObject({ status: 'ready', snapshot: { profile: { totalXp: 15, coinBalance: 3 } } });
    await first.dispose();
    const second = make();
    cleanup.push(() => second.dispose());
    await second.boot();
    expect(second.firstUseEntry.getSnapshot()).toMatchObject({ status: 'ready', destination: 'home' });
    expect(second.standardFocusOutcome.getSnapshot()).toEqual({ status: 'idle' });
    expect(second.petTerminalFeedback.getSnapshot()).toEqual({ status: 'idle' });
    await second.standardFocusResult.refresh(h.sessionId);
    expect(second.standardFocusResult.getSnapshot()).toMatchObject({ status: 'ready', result: { xpEarned: 15, totalXp: 15 } });
  });
});
