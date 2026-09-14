import type { StoreReviewPort } from '@/application';

export class ExpoStoreReviewAdapter implements StoreReviewPort {
  async isAvailable(): Promise<boolean> {
    const storeReview = await import('expo-store-review');
    return storeReview.isAvailableAsync();
  }

  async request(): Promise<void> {
    const storeReview = await import('expo-store-review');
    await storeReview.requestReview();
  }
}

export class DisabledStoreReviewAdapter implements StoreReviewPort {
  isAvailable(): Promise<false> {
    return Promise.resolve(false);
  }

  request(): Promise<void> {
    return Promise.resolve();
  }
}
