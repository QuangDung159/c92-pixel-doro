import type { IdPort } from '@pixeldoro/application';

export class DeviceIdAdapter implements IdPort {
  private sequence = 0;

  nextId(): string {
    this.sequence += 1;
    return `foundation-${Date.now()}-${this.sequence}`;
  }
}
