import type { IdPort } from '../../src/ports/id.port';

export class FakeId implements IdPort {
  constructor(private readonly ids: string[]) {}

  nextId(): string {
    const id = this.ids.shift();

    if (id === undefined) {
      throw new Error('FakeId exhausted');
    }

    return id;
  }
}

