import type { ResetNotificationCleanupPort } from '@/application';

export class NoopResetNotificationCleanupAdapter
  implements ResetNotificationCleanupPort
{
  cancelKnownSession(): ReturnType<ResetNotificationCleanupPort['cancelKnownSession']> {
    return Promise.resolve({ ok: true, value: undefined });
  }
}
