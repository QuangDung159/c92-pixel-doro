import type { ShopControllerProjection } from '@/application';
import { StyleSheet, View } from 'react-native';

import {
  ChoiceChip,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  InlineNotice,
  ItemGrid,
  LoadingState,
  ProgressionSummary,
  SecondaryButton,
  ScreenHeader,
  ScreenShell,
  type ItemTileAction,
  type ItemTileModel,
} from '@/presentation/components';
import { ShopEquipNotice } from './shop-equip-notice';

export interface ShopScreenProps {
  readonly projection: ShopControllerProjection;
  readonly onRetry: () => void;
  readonly onRequestPurchase: (itemId: string) => void;
  readonly onConfirmPurchase: () => void;
  readonly onDismissPurchase: () => void;
  readonly onRetryPurchaseRefresh: () => void;
  readonly onSetViewMode: (mode: 'catalog' | 'inventory') => void;
  readonly onSetItemEquipped: (itemId: string, isEquipped: boolean) => void;
  readonly onRetryEquipRefresh: () => void;
  readonly onDismissEquipNotice: () => void;
}

const itemForPurchase = (projection: ShopControllerProjection) => {
  if (projection.status !== 'ready') return undefined;
  const purchase = projection.purchase;
  if (purchase.status === 'idle') return undefined;
  return projection.shop.items.find(({ id }) => id === purchase.itemId);
};

export const ShopScreen = ({
  projection,
  onRetry,
  onRequestPurchase,
  onConfirmPurchase,
  onDismissPurchase,
  onRetryPurchaseRefresh,
  onSetViewMode,
  onSetItemEquipped,
  onRetryEquipRefresh,
  onDismissEquipNotice,
}: ShopScreenProps) => {
  const selectedItem = itemForPurchase(projection);
  const purchase = projection.status === 'ready' ? projection.purchase : { status: 'idle' as const };
  const purchasePending = purchase.status === 'submitting' ||
    purchase.status === 'committed_refresh_pending';
  const equip = projection.status === 'ready' ? projection.equip : { status: 'idle' as const };
  const equipPending = equip.status === 'submitting' ||
    equip.status === 'committed_refresh_pending';
  const actionForItem = (item: ItemTileModel): ItemTileAction | undefined => {
    if (projection.status !== 'ready') return undefined;
    if (item.state === 'available') {
      const shortfall = Math.max(0, item.priceCoins - projection.shop.profile.coinBalance);
      return {
        label: shortfall > 0 ? `Chưa đủ Coin · thiếu ${shortfall}` : 'Mua',
        accessibilityLabel: shortfall > 0
          ? `Chưa đủ Coin để mua ${item.displayName}, thiếu ${shortfall} Coin`
          : `Mua ${item.displayName} với ${item.priceCoins} Coin`,
        disabled: shortfall > 0 || purchasePending || equipPending ||
          projection.refresh !== 'idle',
        busy: purchase.status === 'submitting' && purchase.itemId === item.id,
        onPress: () => onRequestPurchase(item.id),
      };
    }
    const shouldEquip = item.state === 'owned';
    const busy = equip.status === 'submitting' && equip.itemId === item.id;
    return {
      label: busy ? (shouldEquip ? 'Đang trang bị…' : 'Đang tháo…')
        : (shouldEquip ? 'Trang bị' : 'Tháo'),
      accessibilityLabel: shouldEquip
        ? `Trang bị ${item.displayName}`
        : `Tháo ${item.displayName}`,
      disabled: purchasePending || equipPending || projection.refresh !== 'idle',
      busy,
      onPress: () => onSetItemEquipped(item.id, shouldEquip),
    };
  };

  return (
    <ScreenShell>
      <ScreenHeader
        description="Biến thời gian tập trung thành những thay đổi nhỏ trong căn phòng."
        eyebrow="CỬA HÀNG · ĐỒ TRANG TRÍ"
        title="Một góc riêng đang lớn dần."
      />
      {projection.status === 'idle' || projection.status === 'loading' ? (
        <LoadingState label="Đang mở cửa hàng…" />
      ) : null}
      {projection.status === 'error' ? (
        <ErrorState
          body={projection.code === 'SHOP_DATA_INVALID'
            ? 'Dữ liệu cửa hàng cần được kiểm tra lại trước khi tiếp tục.'
            : 'Chưa đọc được cửa hàng trên thiết bị. Coin và vật phẩm không bị thay đổi.'}
          onRetry={onRetry}
          title="Cửa hàng cần thử lại"
        />
      ) : null}
      {projection.status === 'ready' ? (
        <>
          <ProgressionSummary progression={projection.shop.profile} variant="compact" />
          <View accessibilityRole="radiogroup" style={styles.modeSelector}>
            <ChoiceChip
              disabled={purchasePending || equipPending}
              label="Cửa hàng"
              onPress={() => onSetViewMode('catalog')}
              selected={projection.mode === 'catalog'}
            />
            <ChoiceChip
              disabled={purchasePending || equipPending}
              label="Đã sở hữu"
              onPress={() => onSetViewMode('inventory')}
              selected={projection.mode === 'inventory'}
            />
          </View>
          {projection.refresh === 'refreshing' ? (
            <InlineNotice>Đang cập nhật dữ liệu đã lưu trên thiết bị…</InlineNotice>
          ) : null}
          {projection.refresh === 'error' ? (
            <>
              <InlineNotice>
                Chưa cập nhật được dữ liệu mới. Danh sách committed gần nhất vẫn đang hiển thị.
              </InlineNotice>
              <SecondaryButton label="Thử cập nhật lại" onPress={onRetry} />
            </>
          ) : null}
          {purchase.status === 'success' && selectedItem !== undefined ? (
            <>
              <InlineNotice announce>
                Đã thêm {selectedItem.displayName} vào vật phẩm sở hữu.
              </InlineNotice>
              <SecondaryButton label="Đóng thông báo" onPress={onDismissPurchase} />
            </>
          ) : null}
          {purchase.status === 'insufficient' && selectedItem !== undefined ? (
            <>
              <InlineNotice announce>
                Cần thêm {purchase.shortfallCoins} Coin để mua {selectedItem.displayName}.
              </InlineNotice>
              <SecondaryButton label="Đã hiểu" onPress={onDismissPurchase} />
            </>
          ) : null}
          {purchase.status === 'already_owned' && selectedItem !== undefined ? (
            <>
              <InlineNotice announce>
                Bạn đã sở hữu {selectedItem.displayName}. Coin không thay đổi.
              </InlineNotice>
              <SecondaryButton label="Đóng thông báo" onPress={onDismissPurchase} />
            </>
          ) : null}
          {purchase.status === 'error' ? (
            <>
              <InlineNotice announce>
                Chưa thể hoàn tất giao dịch. Coin và vật phẩm chưa được xác nhận thay đổi.
              </InlineNotice>
              <SecondaryButton label="Đóng thông báo" onPress={onDismissPurchase} />
            </>
          ) : null}
          {purchase.status === 'committed_refresh_pending' ? (
            <>
              <InlineNotice announce>
                Đã ghi nhận giao dịch. Đang đọc lại Coin và vật phẩm đã lưu.
              </InlineNotice>
              <SecondaryButton
                label="Thử đọc lại dữ liệu"
                onPress={onRetryPurchaseRefresh}
              />
            </>
          ) : null}
          <ShopEquipNotice
            onDismiss={onDismissEquipNotice}
            onRetryRefresh={onRetryEquipRefresh}
            projection={projection}
          />
          {projection.mode === 'inventory' &&
          projection.shop.items.every(({ state }) => state === 'available') ? (
              <>
                <EmptyState
                  body="Mua một món trong Cửa hàng để bắt đầu bộ sưu tập của bạn."
                  title="Chưa có vật phẩm đã sở hữu"
                />
                <SecondaryButton label="Xem cửa hàng" onPress={() => onSetViewMode('catalog')} />
              </>
            ) : (
              <ItemGrid
                actionForItem={actionForItem}
                items={projection.mode === 'inventory'
                  ? projection.shop.items.filter(({ state }) => state !== 'available')
                  : projection.shop.items}
              />
            )}
          <ConfirmationDialog
            body={selectedItem === undefined
              ? ''
              : `Dùng ${selectedItem.priceCoins} Coin. Vật phẩm sẽ vào mục Đã sở hữu và chưa được trang bị.`}
            busy={purchase.status === 'submitting'}
            busyLabel="Đang mua…"
            confirmLabel={selectedItem === undefined
              ? 'Mua'
              : `Mua với ${selectedItem.priceCoins} Coin`}
            confirmTone="primary"
            dismissLabel="Để sau"
            onConfirm={onConfirmPurchase}
            onDismiss={onDismissPurchase}
            title={selectedItem === undefined ? 'Xác nhận mua' : `Mua ${selectedItem.displayName}?`}
            visible={purchase.status === 'confirming' || purchase.status === 'submitting'}
          />
        </>
      ) : null}
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  modeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
