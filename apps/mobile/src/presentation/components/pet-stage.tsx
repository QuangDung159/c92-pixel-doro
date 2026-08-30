import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/presentation/theme/palette';

import { PetAnimationRenderer } from '@/presentation/animation/pet-animation-renderer';
import { petAnimationManifest } from '@/presentation/animation/pet-animation-manifest';

import type { CompanionState } from './pet-portrait';

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

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion={liveRegion}
      style={styles.scene}
    >
      <View accessibilityElementsHidden style={styles.roomShelf} />
      <PetAnimationRenderer
        {...(onPlaybackComplete === undefined ? {} : { onPlaybackComplete })}
        {...(onPlaybackFailure === undefined ? {} : { onPlaybackFailure })}
        playbackId={playbackId}
        state={state}
        visualMode={visualMode}
      />
      <Text style={styles.label}>{label}</Text>
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
  roomShelf: {
    backgroundColor: palette.accentDark,
    height: 8,
    opacity: 0.35,
    position: 'absolute',
    right: 20,
    top: 40,
    width: 75,
  },
  label: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
});
