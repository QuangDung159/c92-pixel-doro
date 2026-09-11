import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { palette } from "@/presentation/theme/palette";

import { petAnimationManifest } from "@/presentation/animation/pet-animation-manifest";
import { PetAnimationRenderer } from "@/presentation/animation/pet-animation-renderer";

import type { CompanionState } from "./pet-portrait";
import { PetStatusText } from "./pet-status-text";

const defaultStatusLabels: Record<CompanionState, string> = {
  idle: "Người bạn đang chờ bạn",
  working: "Người bạn đang tập trung cùng bạn",
  breaking: "Người bạn đang nghỉ cùng bạn",
  celebrating: "Người bạn đang ăn mừng cùng bạn",
  bugged: "Người bạn vừa bị nhiễu, mình thử lại nhé",
};

export interface PetStageProps {
  readonly state: CompanionState;
  readonly statusLabel?: string;
  readonly liveRegion?: "none" | "polite" | "assertive";
  readonly playbackId?: string;
  readonly visualMode?: "loop" | "one-shot" | "still";
  readonly onPlaybackComplete?: () => void;
  readonly onPlaybackFailure?: () => void;
  readonly sceneUnderlay?: ReactNode;
  readonly sceneOverlay?: ReactNode;
  readonly sceneMode?: "focus" | "room";
}

export const PetStage = ({
  state,
  statusLabel,
  liveRegion,
  playbackId = `direct:${state}`,
  visualMode = petAnimationManifest[state].playback,
  onPlaybackComplete,
  onPlaybackFailure,
  sceneUnderlay,
  sceneOverlay,
  sceneMode = "focus",
}: PetStageProps) => {
  const label = statusLabel ?? defaultStatusLabels[state];
  const isRoom = sceneMode === "room";

  return (
    <View style={[styles.scene, isRoom ? styles.roomScene : styles.focusScene]}>
      {isRoom ? sceneUnderlay : null}
      <View style={isRoom ? styles.roomPet : undefined}>
        <PetAnimationRenderer
          {...(onPlaybackComplete === undefined ? {} : { onPlaybackComplete })}
          {...(onPlaybackFailure === undefined ? {} : { onPlaybackFailure })}
          playbackId={playbackId}
          state={state}
          visualMode={visualMode}
        />
      </View>
      {isRoom ? sceneOverlay : null}
      {isRoom ? (
        <View
          accessible
          accessibilityLabel={label}
          accessibilityRole="text"
          style={styles.roomSemanticStatus}
        />
      ) : (
        <PetStatusText
          {...(liveRegion === undefined ? {} : { liveRegion })}
          label={label}
        />
      )}
    </View>
  );
};

export const PixelCompanion = PetStage;

const styles = StyleSheet.create({
  scene: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 3,
    overflow: "hidden",
  },
  focusScene: {
    minHeight: 230,
    paddingTop: 30,
  },
  roomScene: {
    aspectRatio: 1672 / 941,
    justifyContent: "flex-end",
    minHeight: 0,
    paddingBottom: 8,
  },
  roomPet: {
    alignItems: "center",
    left: "5%",
    position: "absolute",
    right: 0,
    top: "25%",
    transform: [{ scale: 0.45 }],
  },
  roomSemanticStatus: { height: 0, width: 0 },
});
