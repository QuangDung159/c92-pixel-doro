import { describe, expect, it } from 'vitest';

import { PetCompanionController } from '@pixeldoro/application';
import { createSQLitePersistenceGraph } from '@/infrastructure/database/persistence-graph';
import { SQLiteDatabaseOwner } from '@/infrastructure/database/sqlite-database-owner';
import { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';

import { FakeSQLiteDriver } from '../fakes/fake-sqlite-driver';

const sessionRow = (sessionType: 'focus' | 'short_break' | 'long_break') => {
  const durationMinutes = sessionType === 'focus'
    ? 25
    : sessionType === 'long_break'
      ? 15
      : 5;
  return {
  id: `committed-${sessionType}`,
  profile_id: 1,
  session_type: sessionType,
  focus_variant: sessionType === 'focus' ? 'standard' : null,
  mode: sessionType === 'focus' ? 'relax' : null,
  status: 'running',
  work_tag: sessionType === 'focus' ? 'coding' : null,
  configured_duration_minutes: durationMinutes,
  started_at: 100,
  ends_at: 100 + durationMinutes * 60_000,
  backgrounded_at: null,
  resolved_at: null,
  xp_earned: 0,
  coins_earned: 0,
  reward_claimed_at: null,
  scheduled_end_local_date: '2026-08-30',
  scheduled_end_utc_offset_minutes: 420,
  created_at: 100,
  updated_at: 100,
  };
};

describe('committed SQLite session to Pet companion projection', () => {
  it.each([
    ['focus', 'working'],
    ['short_break', 'breaking'],
    ['long_break', 'breaking'],
  ] as const)('renders committed %s as %s', async (sessionType, baseState) => {
    const driver = new FakeSQLiteDriver();
    driver.connection.firstRowHandler = (sql) =>
      sql.includes("WHERE status = 'running'") ? sessionRow(sessionType) : null;
    const owner = new SQLiteDatabaseOwner('pet-projection.db', driver);
    await owner.open();
    const graph = createSQLitePersistenceGraph(
      owner,
      new SQLiteTransaction(owner),
    );
    const controller = new PetCompanionController(graph.sessions);

    await controller.refresh();

    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      baseState,
      activeSessionId: `committed-${sessionType}`,
    });
    expect(driver.connection.boundStatements.some(({ sql }) =>
      sql.includes("WHERE status = 'running'") &&
      sql.includes('ORDER BY started_at DESC LIMIT 1'),
    )).toBe(true);
    controller.dispose();
    await owner.close();
  });

  it('returns idle only when the committed active query returns no row', async () => {
    const driver = new FakeSQLiteDriver();
    driver.connection.firstRowHandler = () => null;
    const owner = new SQLiteDatabaseOwner('pet-idle.db', driver);
    await owner.open();
    const graph = createSQLitePersistenceGraph(
      owner,
      new SQLiteTransaction(owner),
    );
    const controller = new PetCompanionController(graph.sessions);

    await controller.refresh();

    expect(controller.getSnapshot()).toEqual({
      status: 'ready',
      baseState: 'idle',
      activeSessionId: null,
    });
    controller.dispose();
    await owner.close();
  });
});
