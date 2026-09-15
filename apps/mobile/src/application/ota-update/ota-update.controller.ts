import type { ClockPort } from '@pixeldoro/application';

import type {
  OtaRestartDeferredReason,
  OtaRestartSafetyPort,
  OtaRuntimeInfo,
  OtaUpdateDescriptor,
  OtaUpdatePort,
} from './ota-update.port';

export const OTA_FOREGROUND_THROTTLE_MS = 15 * 60 * 1_000;

export type OtaUpdateErrorCode =
  | 'CHECK_FAILED'
  | 'FETCH_FAILED'
  | 'MALFORMED_RUNTIME'
  | 'RELOAD_FAILED';

interface AvailableContext {
  readonly runtime: OtaRuntimeInfo;
  readonly lastCheckedAt?: number;
  readonly lastError?: OtaUpdateErrorCode;
}

export type OtaUpdateProjection =
  | { readonly status: 'initializing' }
  | {
      readonly status: 'unavailable';
      readonly reason: 'disabled' | 'runtime_missing' | 'adapter_error';
      readonly runtime?: OtaRuntimeInfo;
    }
  | ({ readonly status: 'idle' | 'checking' } & AvailableContext)
  | ({ readonly status: 'downloading'; readonly update: OtaUpdateDescriptor } & AvailableContext)
  | ({
      readonly status: 'pending';
      readonly update: OtaUpdateDescriptor;
      readonly prompt: 'checking' | 'visible' | 'deferred' | 'dismissed';
      readonly deferredReason?: OtaRestartDeferredReason;
    } & AvailableContext)
  | ({ readonly status: 'restarting'; readonly update: OtaUpdateDescriptor } & AvailableContext);

export interface OtaUpdateControllerDependencies {
  readonly clock: Pick<ClockPort, 'nowMs'>;
  readonly updates: OtaUpdatePort;
  readonly restartSafety: OtaRestartSafetyPort;
  readonly throttleMs?: number;
}

export class OtaUpdateController {
  private projection: OtaUpdateProjection;
  private readonly listeners = new Set<() => void>();
  private checkOperation: Promise<void> | undefined;
  private initializationOperation: Promise<void> | undefined;
  private safetyOperation: Promise<void> | undefined;
  private reloadOperation: Promise<void> | undefined;
  private lastCheckAt: number | undefined;
  private disposed = false;

  constructor(private readonly dependencies: OtaUpdateControllerDependencies) {
    this.projection = { status: 'initializing' };
  }

  getSnapshot = (): OtaUpdateProjection => this.projection;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async start(): Promise<void> {
    await this.initialize();
    await this.check(false);
  }

  async handleForeground(): Promise<void> {
    if (this.projection.status === 'pending') return this.refreshRestartSafety();
    await this.initialize();
    await this.check(false);
  }

  async checkNow(): Promise<void> {
    await this.initialize();
    await this.check(true);
  }

  dismissPrompt(): void {
    if (this.projection.status !== 'pending' || this.projection.prompt !== 'visible') return;
    this.publish({ ...this.projection, prompt: 'dismissed' });
  }

  refreshRestartSafety(): Promise<void> {
    if (this.disposed || this.projection.status !== 'pending' ||
      this.projection.prompt === 'dismissed') return Promise.resolve();
    if (this.safetyOperation !== undefined) return this.safetyOperation;

    const updateId = this.projection.update.updateId;
    this.publish({ ...this.projection, prompt: 'checking' });
    const operation = this.evaluateSafety(updateId);
    this.safetyOperation = operation;
    void operation.finally(() => {
      if (this.safetyOperation === operation) this.safetyOperation = undefined;
    });
    return operation;
  }

  requestRestart(): Promise<void> {
    if (this.disposed || this.projection.status !== 'pending' ||
      this.projection.prompt !== 'visible') return Promise.resolve();
    if (this.reloadOperation !== undefined) return this.reloadOperation;
    const updateId = this.projection.update.updateId;
    const operation = this.reloadWhenSafe(updateId);
    this.reloadOperation = operation;
    void operation.finally(() => {
      if (this.reloadOperation === operation) this.reloadOperation = undefined;
    });
    return operation;
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }

  private initialize(): Promise<void> {
    if (this.disposed || this.projection.status !== 'initializing') return Promise.resolve();
    if (this.initializationOperation !== undefined) return this.initializationOperation;
    const operation = this.runInitialization();
    this.initializationOperation = operation;
    void operation.finally(() => {
      if (this.initializationOperation === operation) this.initializationOperation = undefined;
    });
    return operation;
  }

  private async runInitialization(): Promise<void> {
    try {
      const runtime = await this.dependencies.updates.getRuntimeInfo();
      if (this.disposed) return;
      this.publish(!runtime.enabled
        ? { status: 'unavailable', reason: 'disabled', runtime }
        : runtime.runtimeVersion === null || runtime.runtimeVersion.trim() === ''
          ? { status: 'unavailable', reason: 'runtime_missing', runtime }
          : { status: 'idle', runtime });
    } catch {
      if (!this.disposed) this.publish({ status: 'unavailable', reason: 'adapter_error' });
    }
  }

  private check(force: boolean): Promise<void> {
    if (this.disposed || this.projection.status === 'initializing' ||
      this.projection.status === 'unavailable' ||
      this.projection.status === 'downloading' || this.projection.status === 'restarting' ||
      this.projection.status === 'pending') return Promise.resolve();
    if (this.checkOperation !== undefined) return this.checkOperation;

    const now = this.dependencies.clock.nowMs();
    const throttleMs = this.dependencies.throttleMs ?? OTA_FOREGROUND_THROTTLE_MS;
    if (!force && this.lastCheckAt !== undefined && now - this.lastCheckAt < throttleMs) {
      return Promise.resolve();
    }
    this.lastCheckAt = now;
    const operation = this.runCheck();
    this.checkOperation = operation;
    void operation.finally(() => {
      if (this.checkOperation === operation) this.checkOperation = undefined;
    });
    return operation;
  }

  private async runCheck(): Promise<void> {
    if (this.projection.status === 'initializing' || this.projection.status === 'unavailable') return;
    const runtime = this.projection.runtime;
    this.publish({ status: 'checking', runtime });
    try {
      const checked = await this.dependencies.updates.checkForUpdate();
      if (this.disposed) return;
      if (checked.outcome === 'no_update') {
        this.publish({ status: 'idle', runtime, lastCheckedAt: this.dependencies.clock.nowMs() });
        return;
      }
      this.publish({ status: 'downloading', runtime, update: checked.update });
      try {
        const fetched = await this.dependencies.updates.fetchUpdate();
        if (this.disposed) return;
        if (fetched.outcome !== 'downloaded') {
          this.publish({ status: 'idle', runtime, lastError: 'FETCH_FAILED' });
          return;
        }
        this.publish({
          status: 'pending',
          runtime,
          update: fetched.update,
          prompt: 'checking',
        });
        await this.refreshRestartSafety();
      } catch {
        if (!this.disposed) this.publish({ status: 'idle', runtime, lastError: 'FETCH_FAILED' });
      }
    } catch {
      if (!this.disposed) this.publish({ status: 'idle', runtime, lastError: 'CHECK_FAILED' });
    }
  }

  private async evaluateSafety(updateId: string): Promise<void> {
    let safety;
    try {
      safety = await this.dependencies.restartSafety.evaluate();
    } catch {
      safety = { safe: false, reason: 'critical_operation' } as const;
    }
    if (this.disposed || this.projection.status !== 'pending' ||
      this.projection.update.updateId !== updateId || this.projection.prompt === 'dismissed') return;
    if (safety.safe) {
      const { deferredReason: _deferredReason, ...pending } = this.projection;
      this.publish({ ...pending, prompt: 'visible' });
      return;
    }
    this.publish({ ...this.projection, prompt: 'deferred', deferredReason: safety.reason });
  }

  private async reloadWhenSafe(updateId: string): Promise<void> {
    let safety;
    try {
      safety = await this.dependencies.restartSafety.evaluate();
    } catch {
      safety = { safe: false, reason: 'critical_operation' } as const;
    }
    if (this.disposed || this.projection.status !== 'pending' ||
      this.projection.update.updateId !== updateId) return;
    if (!safety.safe) {
      this.publish({ ...this.projection, prompt: 'deferred', deferredReason: safety.reason });
      return;
    }

    const pending = this.projection;
    this.publish({ status: 'restarting', runtime: pending.runtime, update: pending.update });
    try {
      await this.dependencies.updates.reload();
    } catch {
      if (!this.disposed) {
        this.publish({ ...pending, prompt: 'visible', lastError: 'RELOAD_FAILED' });
      }
    }
  }

  private publish(projection: OtaUpdateProjection): void {
    if (this.disposed) return;
    this.projection = Object.freeze(projection);
    for (const listener of this.listeners) {
      try { listener(); } catch { /* Subscribers cannot affect update truth. */ }
    }
  }
}
