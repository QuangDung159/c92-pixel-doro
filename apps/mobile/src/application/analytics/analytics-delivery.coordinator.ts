import type { ClockPort } from '@pixeldoro/application';

import type {
  AnalyticsEventRecord,
  AnalyticsQueue,
  InstallationRepository,
} from '../persistence';

export const ANALYTICS_DELIVERY_BATCH_SIZE = 20;
export const ANALYTICS_RETRY_BASE_MS = 30_000;
export const ANALYTICS_RETRY_CAP_MS = 21_600_000;

export interface AnalyticsDeliveryBatch {
  readonly anonymousId: string;
  readonly events: readonly AnalyticsEventRecord[];
}

export interface AnalyticsDeliveryPort {
  deliver(batch: AnalyticsDeliveryBatch): Promise<'accepted' | 'retryable'>;
}

export interface AnalyticsDeliveryGate {
  isEnabled(): boolean;
  generation(): number;
}

export interface AnalyticsDeliveryCoordinatorDependencies {
  readonly clock: ClockPort;
  readonly delivery: AnalyticsDeliveryPort;
  readonly gate: AnalyticsDeliveryGate;
  readonly installation: Pick<InstallationRepository, 'find'>;
  readonly queue: Pick<AnalyticsQueue, 'listDue' | 'markRetry' | 'deleteDelivered'>;
}

export type AnalyticsDeliveryOutcome =
  | 'accepted'
  | 'empty'
  | 'retry_scheduled'
  | 'skipped_disabled'
  | 'skipped_identity_unavailable'
  | 'stale'
  | 'queue_unavailable';

const hash = (value: string): number => {
  let result = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16_777_619);
  }
  return result >>> 0;
};

export const analyticsRetryAt = (
  event: Pick<AnalyticsEventRecord, 'eventId' | 'attemptCount'>,
  nowMs: number,
): number => {
  const exponent = Math.min(event.attemptCount, 20);
  const delay = Math.min(ANALYTICS_RETRY_CAP_MS, ANALYTICS_RETRY_BASE_MS * (2 ** exponent));
  const jitter = Math.floor((hash(event.eventId) % 2_001) / 10_000 * delay);
  return nowMs + delay + jitter;
};

export class AnalyticsDeliveryCoordinator {
  private operation: Promise<AnalyticsDeliveryOutcome> | undefined;
  private disposed = false;

  constructor(private readonly dependencies: AnalyticsDeliveryCoordinatorDependencies) {}

  flush = (): Promise<AnalyticsDeliveryOutcome> => {
    if (this.disposed) return Promise.resolve('skipped_disabled');
    if (this.operation !== undefined) return this.operation;
    const operation = this.run();
    this.operation = operation;
    void operation.finally(() => {
      if (this.operation === operation) this.operation = undefined;
    });
    return operation;
  };

  dispose(): void {
    this.disposed = true;
  }

  private current(generation: number): boolean {
    return !this.disposed && this.dependencies.gate.isEnabled() &&
      this.dependencies.gate.generation() === generation;
  }

  private async run(): Promise<AnalyticsDeliveryOutcome> {
    if (!this.dependencies.gate.isEnabled()) return 'skipped_disabled';
    const generation = this.dependencies.gate.generation();
    const nowMs = this.dependencies.clock.nowMs();
    const installation = await this.dependencies.installation.find().catch(() => null);
    if (!this.current(generation)) return 'stale';
    const anonymousId = installation?.ok === true
      ? installation.value?.anonymousAnalyticsId?.trim()
      : undefined;
    if (!anonymousId) return 'skipped_identity_unavailable';

    const due = await this.dependencies.queue.listDue(
      nowMs,
      ANALYTICS_DELIVERY_BATCH_SIZE,
    ).catch(() => null);
    if (!this.current(generation)) return 'stale';
    if (due === null || !due.ok) return 'queue_unavailable';
    if (due.value.length === 0) return 'empty';

    let result: 'accepted' | 'retryable' = 'retryable';
    try {
      result = await this.dependencies.delivery.deliver({
        anonymousId,
        events: due.value,
      });
    } catch {
      result = 'retryable';
    }
    if (!this.current(generation)) return 'stale';

    if (result === 'accepted') {
      const deleted = await this.dependencies.queue.deleteDelivered(
        due.value.map(({ eventId }) => eventId),
      ).catch(() => null);
      return deleted?.ok === true ? 'accepted' : 'queue_unavailable';
    }

    for (const event of due.value) {
      if (!this.current(generation)) return 'stale';
      const marked = await this.dependencies.queue.markRetry({
        eventId: event.eventId,
        deliveryState: 'retry_wait',
        attemptCount: event.attemptCount + 1,
        nextAttemptAt: analyticsRetryAt(event, nowMs),
      }).catch(() => null);
      if (marked === null || !marked.ok) return 'queue_unavailable';
    }
    return 'retry_scheduled';
  }
}

