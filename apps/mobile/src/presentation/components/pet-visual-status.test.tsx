import { describe, expect, it, vi } from 'vitest';

import { PetStage } from './pet-stage';
import { PetVisualStatus } from './pet-visual-status';
import { ErrorState, LoadingState } from './status-surface';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Pressable: 'Pressable',
  StyleSheet: { create: <TValue,>(styles: TValue): TValue => styles },
  Text: 'Text',
  View: 'View',
}));

const playbackCallbackSpies = vi.hoisted(() => ({
  reportComplete: vi.fn(),
  reportFailure: vi.fn(),
}));

vi.mock('@/presentation/providers/mobile-application-context', () => ({
  usePetVisualPlaybackCallbacks: () => playbackCallbackSpies,
}));

describe('PetVisualStatus', () => {
  it('renders one semantic terminal announcement and quiet base states', () => {
    const terminal = PetVisualStatus({
      projection: {
        status: 'ready',
        source: 'terminal',
        state: 'celebrating',
        feedbackId: 'focus-1:completed',
        announcementId: 'focus-1:completed',
        visualMode: 'one-shot',
      },
      onRetryBase: vi.fn(),
      onDismissTerminalError: vi.fn(),
    });
    const base = PetVisualStatus({
      projection: {
        status: 'ready',
        source: 'base',
        state: 'working',
        activeSessionId: 'focus-2',
        announcementId: 'base:working:focus-2',
        visualMode: 'loop',
      },
      onRetryBase: vi.fn(),
      onDismissTerminalError: vi.fn(),
    });

    expect(terminal.type).toBe(PetStage);
    expect(terminal.props).toMatchObject({
      playbackId: 'focus-1:completed',
      state: 'celebrating',
      liveRegion: 'polite',
      visualMode: 'one-shot',
    });
    terminal.props.onPlaybackComplete();
    terminal.props.onPlaybackFailure();
    expect(playbackCallbackSpies.reportComplete).toHaveBeenCalledWith('focus-1:completed');
    expect(playbackCallbackSpies.reportFailure).toHaveBeenCalledWith('focus-1:completed');
    expect(base.type).toBe(PetStage);
    expect(base.props.liveRegion).toBeUndefined();
    expect(base.props).toMatchObject({
      playbackId: 'base:working:focus-2',
      visualMode: 'loop',
    });
  });

  it('renders loading and routes each recovery action to its owner', () => {
    const onRetryBase = vi.fn();
    const onDismissTerminalError = vi.fn();
    const loading = PetVisualStatus({
      projection: { status: 'loading' },
      onRetryBase,
      onDismissTerminalError,
    });
    const baseRecovery = PetVisualStatus({
      projection: {
        status: 'recovery',
        source: 'base',
        reason: 'committed_session_unavailable',
      },
      onRetryBase,
      onDismissTerminalError,
    });
    const conflict = PetVisualStatus({
      projection: {
        status: 'recovery',
        source: 'conflict',
        reason: 'conflicting_committed_truth',
      },
      onRetryBase,
      onDismissTerminalError,
    });

    expect(loading.type).toBe(LoadingState);
    expect(baseRecovery.type).toBe(ErrorState);
    baseRecovery.props.onRetry();
    conflict.props.onRetry();
    expect(onRetryBase).toHaveBeenCalledOnce();
    expect(onDismissTerminalError).toHaveBeenCalledOnce();
  });
});
