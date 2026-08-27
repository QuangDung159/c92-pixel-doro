import type { ClockPort } from '../../src/ports/clock.port';

export class FakeClock implements ClockPort {
  constructor(private currentMs: number) {}

  nowMs(): number {
    return this.currentMs;
  }

  setNowMs(currentMs: number): void {
    this.currentMs = currentMs;
  }
}

