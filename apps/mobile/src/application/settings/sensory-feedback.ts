export type SensoryFeedbackKind =
  | 'committed_start'
  | 'fresh_completion'
  | 'fresh_reward'
  | 'destructive_confirmation';

export interface SensoryFeedbackSettings {
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
}

export interface SensoryFeedbackPort {
  emit(
    kind: SensoryFeedbackKind,
    settings: SensoryFeedbackSettings,
    freshnessKey: string,
  ): Promise<void>;
  setActive(active: boolean): Promise<void>;
  dispose(): Promise<void>;
}
