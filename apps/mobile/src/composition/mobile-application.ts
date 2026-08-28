import type { MobileApplicationFacade } from '@/application';
import type { MobilePersistenceGraph } from '@/infrastructure/database/persistence-graph';
import type { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';

export interface MobileApplication extends MobileApplicationFacade {
  readonly persistence: MobilePersistenceGraph;
  readonly transaction: SQLiteTransaction;
}
