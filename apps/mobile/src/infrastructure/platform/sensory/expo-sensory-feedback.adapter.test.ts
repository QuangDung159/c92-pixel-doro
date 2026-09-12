import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpoSensoryFeedbackAdapter } from './expo-sensory-feedback.adapter';

const play = vi.fn();
const pause = vi.fn();
const release = vi.fn();
const seekTo = vi.fn(async () => undefined);
const setIsAudioActiveAsync = vi.fn(async () => undefined);
const impactAsync = vi.fn(async () => undefined);
const notificationAsync = vi.fn(async () => undefined);

vi.mock('expo-audio', () => ({
  createAudioPlayer: vi.fn(() => ({
    play, pause, release, seekTo, volume: 1,
  })),
  setIsAudioActiveAsync,
}));
vi.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
  impactAsync,
  notificationAsync,
}));

describe('ExpoSensoryFeedbackAdapter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('respects independent channel settings and dedupes fresh outcomes', async () => {
    const adapter = new ExpoSensoryFeedbackAdapter();
    await adapter.emit('fresh_completion', {
      soundEnabled: true, hapticsEnabled: false,
    }, 'session-1');
    await adapter.emit('fresh_completion', {
      soundEnabled: true, hapticsEnabled: true,
    }, 'session-1');
    expect(play).toHaveBeenCalledOnce();
    expect(notificationAsync).not.toHaveBeenCalled();

    await adapter.emit('committed_start', {
      soundEnabled: false, hapticsEnabled: true,
    }, 'session-2');
    expect(play).toHaveBeenCalledOnce();
    expect(impactAsync).toHaveBeenCalledOnce();
  });

  it('pauses in background and releases its native player', async () => {
    const adapter = new ExpoSensoryFeedbackAdapter();
    await adapter.emit('fresh_reward', {
      soundEnabled: true, hapticsEnabled: true,
    }, 'purchase-1');
    await adapter.setActive(false);
    await adapter.dispose();
    expect(setIsAudioActiveAsync).toHaveBeenCalledWith(false);
    expect(pause).toHaveBeenCalled();
    expect(release).toHaveBeenCalledOnce();
  });
});
