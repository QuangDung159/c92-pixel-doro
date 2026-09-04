export interface TickScheduler {
  schedule(callback: () => void, delayMs: number): () => void;
}
