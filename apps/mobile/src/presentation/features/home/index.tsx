import type {
  HomeProfileProjection,
  PetVisualProjection,
} from '@pixeldoro/application';
import type {
  RoomDecorationsControllerProjection,
  StoreReviewRequestOutcome,
} from '@/application';
import { StyleSheet, Text } from 'react-native';

import {
  LoadingState,
  Panel,
  PetVisualStatus,
  PrimaryButton,
  ProgressionSummary,
  ScreenHeader,
  ScreenShell,
} from '@/presentation/components';
import { palette } from '@/presentation/theme/palette';

import {
  EquippedRoomDecorationLayer,
  RoomBackdropLayer,
} from './equipped-room-decoration-layer';
import { RoomDecorationStatus } from './room-decoration-status';

export interface HomeScreenProps {
  readonly profile: HomeProfileProjection | null;
  readonly pet: PetVisualProjection;
  readonly onDismissPetFeedbackError: () => void;
  readonly onRetryPet: () => void;
  readonly onStartFocus: () => void;
  readonly room: RoomDecorationsControllerProjection;
  readonly onRetryRoom: () => void;
  readonly reviewFixtureOutcome?: StoreReviewRequestOutcome | null;
  readonly reviewFixtureLabel?: string;
}

export const HomeScreen = ({
  profile,
  pet,
  onRetryPet,
  onDismissPetFeedbackError,
  onStartFocus,
  room,
  onRetryRoom,
  reviewFixtureOutcome,
  reviewFixtureLabel,
}: HomeScreenProps) => {
  const roomItems = room.status === 'ready' ? room.room.items : [];
  return (
    <ScreenShell>
      <ScreenHeader
        description="Một căn phòng nhỏ cho những nỗ lực lớn."
        eyebrow="PET ROOM · HÔM NAY"
        title="Chào bạn trở lại."
      />

      {profile === null ? (
        <LoadingState label="Đang mở Pet Room…" />
      ) : (
        <>
          <PetVisualStatus
            onDismissTerminalError={onDismissPetFeedbackError}
            onRetryBase={onRetryPet}
            projection={pet}
            sceneMode="room"
            sceneUnderlay={(
              <>
                <RoomBackdropLayer />
                <EquippedRoomDecorationLayer items={roomItems} layer="back" />
              </>
            )}
            sceneOverlay={<EquippedRoomDecorationLayer items={roomItems} layer="front" />}
          />
          <RoomDecorationStatus onRetry={onRetryRoom} projection={room} />
          <ProgressionSummary progression={profile} variant="full" />
          {reviewFixtureOutcome !== undefined ? (
            <Panel>
              <Text style={styles.cardEyebrow}>EPIC-11 REVIEW FIXTURE</Text>
              {reviewFixtureLabel === undefined ? null : (
                <Text style={styles.cardBody}>{reviewFixtureLabel}</Text>
              )}
              <Text accessibilityLiveRegion="polite" style={styles.cardBody}>
                {reviewFixtureOutcome === null
                  ? 'Chưa có yêu cầu đánh giá mới.'
                  : `Kết quả đã làm sạch: ${reviewFixtureOutcome}`}
              </Text>
            </Panel>
          ) : null}
          <Panel tone="strong">
            <Text style={styles.cardEyebrow}>TIẾP THEO</Text>
            <Text style={styles.cardTitle}>Sẵn sàng cho một phiên 25 phút?</Text>
            <Text style={styles.cardBody}>
              Bạn có thể đổi thời lượng, chế độ và loại công việc trước khi bắt đầu.
            </Text>
            <PrimaryButton label="Bắt đầu tập trung" onPress={onStartFocus} />
          </Panel>
        </>
      )}
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  cardEyebrow: {
    color: palette.accentDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardTitle: {
    color: palette.textPrimary,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 27,
  },
  cardBody: { color: palette.textSecondary, fontSize: 14, lineHeight: 21 },
});
