import type { ClockPort } from '@pixeldoro/application';

export class DeviceClockAdapter implements ClockPort {
  nowMs(): number {
    return Date.now();
  }
}

