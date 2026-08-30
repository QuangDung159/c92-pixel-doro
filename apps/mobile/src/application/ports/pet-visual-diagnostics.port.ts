export type PetVisualStateName =
  | 'idle'
  | 'working'
  | 'breaking'
  | 'celebrating'
  | 'bugged';

export type PetVisualFallbackLayer =
  | 'state_still'
  | 'idle_still'
  | 'neutral_placeholder';

export type PetVisualFallbackReason =
  | 'playback_unavailable'
  | 'driver_failure'
  | 'state_frame_unavailable'
  | 'all_art_unavailable';

export interface PetVisualDiagnostic {
  readonly eventName: 'pet_visual_fallback';
  readonly state: PetVisualStateName;
  readonly fallbackLayer: PetVisualFallbackLayer;
  readonly reasonCode: PetVisualFallbackReason;
}

export interface PetVisualDiagnosticsPort {
  record(diagnostic: PetVisualDiagnostic): void;
}
