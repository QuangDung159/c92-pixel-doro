export interface OtaRuntimeInfo {
  readonly appVersion: string | null;
  readonly enabled: boolean;
  readonly channel: string | null;
  readonly runtimeVersion: string | null;
  readonly currentUpdateId: string | null;
  readonly isEmbeddedLaunch: boolean;
  readonly otaNumber: string | null;
}

export interface OtaUpdateDescriptor {
  readonly updateId: string;
  readonly kind: 'update' | 'rollback_to_embedded';
}

export type OtaCheckResult =
  | { readonly outcome: 'no_update' }
  | { readonly outcome: 'available'; readonly update: OtaUpdateDescriptor };

export type OtaFetchResult =
  | { readonly outcome: 'downloaded'; readonly update: OtaUpdateDescriptor }
  | { readonly outcome: 'not_downloaded' };

export interface OtaUpdatePort {
  getRuntimeInfo(): Promise<OtaRuntimeInfo>;
  checkForUpdate(): Promise<OtaCheckResult>;
  fetchUpdate(): Promise<OtaFetchResult>;
  reload(): Promise<void>;
}

export type OtaRestartDeferredReason =
  | 'bootstrap_not_ready'
  | 'critical_operation'
  | 'active_focus'
  | 'active_break'
  | 'active_trial'
  | 'session_read_failed';

export type OtaRestartSafety =
  | { readonly safe: true }
  | { readonly safe: false; readonly reason: OtaRestartDeferredReason };

export interface OtaRestartSafetyPort {
  evaluate(): Promise<OtaRestartSafety>;
}
