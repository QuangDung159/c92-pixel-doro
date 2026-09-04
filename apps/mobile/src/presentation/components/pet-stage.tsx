import { StyleSheet, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { PetAnimationRenderer } from '@/presentation/animation/pet-animation-renderer';
import { petAnimationManifest } from '@/presentation/animation/pet-animation-manifest';

import type { CompanionState } from './pet-portrait';
import { PetStatusText } from './pet-status-text';

const defaultStatusLabels: Record<CompanionState, string> = {
  idle: 'Người bạn đang chờ bạn',
  working: 'Người bạn đang tập trung cùng bạn',
  breaking: 'Người bạn đang nghỉ cùng bạn',
  celebrating: 'Người bạn đang ăn mừng cùng bạn',
  bugged: 'Người bạn vừa bị nhiễu, mình thử lại nhé',
};

export interface PetStageProps {
  readonly state: CompanionState;
  readonly statusLabel?: string;
  readonly liveRegion?: 'none' | 'polite' | 'assertive';
  readonly playbackId?: string;
  readonly visualMode?: 'loop' | 'one-shot' | 'still';
  readonly onPlaybackComplete?: () => void;
  readonly onPlaybackFailure?: () => void;
}

export const PetStage = ({
  state,
  statusLabel,
  liveRegion,
  playbackId = `direct:${state}`,
  visualMode = petAnimationManifest[state].playback,
  onPlaybackComplete,
  onPlaybackFailure,
}: PetStageProps) => {
  const label = statusLabel ?? defaultStatusLabels[state];

  // TODO(room-decor): Restore room decoration with the future pegboard-style
  // feature. Keep the standalone placeholder shelf hidden until it is ready.
  return (
    <View style={styles.scene}>
      <PetAnimationRenderer
        {...(onPlaybackComplete === undefined ? {} : { onPlaybackComplete })}
        {...(onPlaybackFailure === undefined ? {} : { onPlaybackFailure })}
        playbackId={playbackId}
        state={state}
        visualMode={visualMode}
      />
      <PetStatusText
        {...(liveRegion === undefined ? {} : { liveRegion })}
        label={label}
      />
    </View>
  );
};

export const PixelCompanion = PetStage;

const styles = StyleSheet.create({
  scene: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 3,
    minHeight: 230,
    overflow: 'hidden',
    paddingTop: 30,
  },
});
