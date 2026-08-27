import type { MobileApplicationFacade } from '@/application';
import type { SQLiteTransaction } from '@/infrastructure/database/sqlite-transaction';

export interface MobileApplication extends MobileApplicationFacade {
  readonly transaction: SQLiteTransaction;
}
