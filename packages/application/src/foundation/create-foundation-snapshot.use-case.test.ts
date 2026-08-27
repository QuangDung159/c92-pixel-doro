import { describe, expect, it } from 'vitest';

import { FakeClock } from '../../test/fakes/fake-clock';
import { FakeId } from '../../test/fakes/fake-id';
import { CreateFoundationSnapshotUseCase } from './create-foundation-snapshot.use-case';

describe('CreateFoundationSnapshotUseCase', () => {
  it('uses injected deterministic clock and id ports', () => {
    const useCase = new CreateFoundationSnapshotUseCase({
      clock: new FakeClock(1_777_777),
      id: new FakeId(['foundation-1']),
    });

    expect(useCase.execute()).toEqual({
      ok: true,
      value: {
        snapshotId: 'foundation-1',
        checkedAtMs: 1_777_777,
        domainPackageId: '@pixeldoro/domain',
      },
    });
  });
});

