import { DOMAIN_PACKAGE_ID } from '@pixeldoro/domain';

import type { ClockPort } from '../ports/clock.port';
import type { IdPort } from '../ports/id.port';
import type { ApplicationResult } from '../result/application-result';

export interface FoundationSnapshot {
  readonly snapshotId: string;
  readonly checkedAtMs: number;
  readonly domainPackageId: typeof DOMAIN_PACKAGE_ID;
}

export interface CreateFoundationSnapshotDependencies {
  readonly clock: ClockPort;
  readonly id: IdPort;
}

export class CreateFoundationSnapshotUseCase {
  constructor(private readonly dependencies: CreateFoundationSnapshotDependencies) {}

  execute(): ApplicationResult<FoundationSnapshot, never> {
    return {
      ok: true,
      value: {
        snapshotId: this.dependencies.id.nextId(),
        checkedAtMs: this.dependencies.clock.nowMs(),
        domainPackageId: DOMAIN_PACKAGE_ID,
      },
    };
  }
}

