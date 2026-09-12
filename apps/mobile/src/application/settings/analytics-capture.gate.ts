export class AnalyticsCaptureGate {
  private blocked = false;

  isEnabled(durablePreference: boolean): boolean {
    return durablePreference && !this.blocked;
  }

  block(): void {
    this.blocked = true;
  }

  allow(): void {
    this.blocked = false;
  }
}
