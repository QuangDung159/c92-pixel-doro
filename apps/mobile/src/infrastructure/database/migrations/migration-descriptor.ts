import type { InitialSchemaExecutor } from './001_initial-schema.migration';

export interface MigrationContext {
  readonly appliedAt: number;
  readonly anonymousAnalyticsId?: string;
}

export interface MigrationDescriptor {
  readonly version: number;
  readonly name: string;
  readonly filename: string;
  readonly checksum: string;
  readonly requiresAnonymousAnalyticsId: boolean;
  apply(
    executor: InitialSchemaExecutor,
    context: MigrationContext,
  ): Promise<void>;
}
