import type { PetFeedbackScheduler } from '@pixeldoro/application';

export class DeviceTimeoutScheduler implements PetFeedbackScheduler {
  schedule(callback: () => void, delayMs: number): () => void {
    const timeout = setTimeout(callback, delayMs);
    return () => clearTimeout(timeout);
  }
}
