export class AnalyticsCaptureGate {
  private blocked = false;
  private privacyGeneration = 0;

  isEnabled(durablePreference: boolean): boolean {
    return durablePreference && !this.blocked;
  }

  block(): void {
    if (!this.blocked) this.privacyGeneration += 1;
    this.blocked = true;
  }

  allow(): void {
    this.blocked = false;
  }

  generation(): number {
    return this.privacyGeneration;
  }
}
