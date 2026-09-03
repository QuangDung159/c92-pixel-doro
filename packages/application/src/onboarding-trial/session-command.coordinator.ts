export interface SessionCommandCoordinatorPort {
  run<TValue>(work: () => Promise<TValue>): Promise<TValue>;
}

export class SessionCommandCoordinator implements SessionCommandCoordinatorPort {
  private tail: Promise<void> = Promise.resolve();

  run<TValue>(work: () => Promise<TValue>): Promise<TValue> {
    const operation = this.tail.then(work, work);
    this.tail = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }
}
