export {
  OTA_FOREGROUND_THROTTLE_MS,
  OtaUpdateController,
  type OtaUpdateControllerDependencies,
  type OtaUpdateErrorCode,
  type OtaUpdateProjection,
} from './ota-update.controller';
export {
  selectOtaReleaseInfo,
  type OtaLatestStatus,
  type OtaReleaseInfo,
} from './ota-release-info';
export {
  OtaRestartSafetyEvaluator,
  type OtaRestartSafetyEvaluatorDependencies,
} from './ota-restart-safety.evaluator';
export type {
  OtaCheckResult,
  OtaFetchResult,
  OtaRestartDeferredReason,
  OtaRestartSafety,
  OtaRestartSafetyPort,
  OtaRuntimeInfo,
  OtaUpdateDescriptor,
  OtaUpdatePort,
} from './ota-update.port';
