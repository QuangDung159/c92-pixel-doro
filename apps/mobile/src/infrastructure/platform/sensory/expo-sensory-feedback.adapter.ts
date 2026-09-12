import type {
  SensoryFeedbackKind,
  SensoryFeedbackPort,
  SensoryFeedbackSettings,
} from '@/application';

// Original 100 ms 8-bit two-tone chime generated for PixelDoro. No third-party source.
const COMPLETION_CHIME = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAqqqqqqqqVlZWV1dXqampqampV1dXV1dXqampqaioWFhYWFhYqKioqKioWFhYWFhZp6enp6enWVlZWVlZp6enp6enWlpaWlpapqampqamWlpaWlpapqWlpaWlW1tbW1tbpaWlpaWlpVtcXFxcXKSkpKSkpFxcXFxcXKSko6Ojo11dXV1dXaOjo6Ojo11dXV5eXqKioqKiol5eXl5eXqKioqKhoV9fX19fX6GhoaGhoV9fX19fYKCgoKCgoGBgYGBgYKCgoKCgoKBhYWFhYWGfn5+fn59hYWFhYWGfnp6enp5iYmJiYmKenp6enp5iYmNjY2OdnZ2dnZ1jY2NjY2OdnZ2cnJxkZGRkZGScnJycnJxkZGRkZWWbm5ubm5tlZWVlZWWbm5ubm5pmZmZmZmZmmpqampqaZmZmZmZnmZmZmZmZZ2dnZ2dnmZmZmZmZaGhoaGhomJiYmJiYaGhoaGhomJeXl5eXaWlpaWlpl5eXl5eXaWlqampqlpaWlpaWampqampqlpaWlZWVa2tra2trlZWVlZVra2tra5SUlJRsbGxsbJSUlJRsbGxsbJSTk5NtbW1tbZOTk5NtbW1tbZOTkpJubm5ubpKSkpKSbm5ubpKSkpGRb29vb5GRkZGRb29vb5GRkZGQcHBwcJCQkJCQcHBwcJCQkJCQcXFxcXGPj4+PcXFxcXGPj4+PcXJycnKOjo6OcnJycnKOjo6OcnJzc3ONjY2Nc3Nzc3ONjY2NjXNzdHSMjIyMjHR0dHSMjIyMjHR0dHWLi4uLi3V1dXWLi4uLi3V1dXV2ioqKinZ2dnZ2ioqKinZ2dnZ2iomJiXd3d3d3iYmJiXd3d3d3iYmIiHh4eHh4iIiIiHh4eHh4iIiIh4d5eXl5h4eHh4d5eXl5h4eHh4Z6enp6hoaGhoZ6enp6hoaGhoZ7e3t7e4WFhYV7e3t7e4WFhYV7fHx8fISEhIR8fHx8fISEhIR8fH19fYODg4N9fX19fYODg4N9fX1+foKCgoKCfn5+foKCgoKCfn5+f4GBgYGBf39/f4GBgYGBf39/f4CAgICAgICAgA==';

export class ExpoSensoryFeedbackAdapter implements SensoryFeedbackPort {
  private readonly handled = new Set<string>();
  private player: import('expo-audio').AudioPlayer | undefined;
  private active = true;
  private disposed = false;

  async emit(
    kind: SensoryFeedbackKind,
    settings: SensoryFeedbackSettings,
    freshnessKey: string,
  ): Promise<void> {
    const key = `${kind}:${freshnessKey}`;
    if (this.disposed || !this.active || !freshnessKey.trim() || this.handled.has(key)) return;
    this.handled.add(key);
    if (this.handled.size > 128) {
      const oldest = this.handled.values().next().value;
      if (typeof oldest === 'string') this.handled.delete(oldest);
    }

    const actions: Promise<unknown>[] = [];
    if (settings.soundEnabled && (kind === 'fresh_completion' || kind === 'fresh_reward')) {
      actions.push(this.playChime());
    }
    if (settings.hapticsEnabled) actions.push(this.haptic(kind));
    await Promise.allSettled(actions);
  }

  async setActive(active: boolean): Promise<void> {
    if (this.disposed || this.active === active) return;
    this.active = active;
    try {
      const audio = await import('expo-audio');
      await audio.setIsAudioActiveAsync(active);
      if (!active) this.player?.pause();
    } catch {
      // Sensory feedback is best effort and cannot change product truth.
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.handled.clear();
    try {
      this.player?.pause();
      this.player?.release();
    } catch {
      // Native teardown is best effort.
    }
    this.player = undefined;
  }

  private async playChime(): Promise<void> {
    const audio = await import('expo-audio');
    this.player ??= audio.createAudioPlayer(COMPLETION_CHIME, {
      keepAudioSessionActive: false,
    });
    await this.player.seekTo(0);
    this.player.volume = 0.45;
    this.player.play();
  }

  private async haptic(kind: SensoryFeedbackKind): Promise<void> {
    const haptics = await import('expo-haptics');
    if (kind === 'committed_start') {
      await haptics.impactAsync(haptics.ImpactFeedbackStyle.Light);
    } else if (kind === 'destructive_confirmation') {
      await haptics.notificationAsync(haptics.NotificationFeedbackType.Warning);
    } else {
      await haptics.notificationAsync(haptics.NotificationFeedbackType.Success);
    }
  }
}
