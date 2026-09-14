import type { AnalyticsDeliveryPort } from '@/application';

export class DisabledAnalyticsDeliveryAdapter implements AnalyticsDeliveryPort {
  deliver(): Promise<'retryable'> {
    return Promise.resolve('retryable');
  }
}
