import type { ShopControllerProjection } from '@/application';

import {
  ConfirmationDialog,
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

export interface ShopScreenProps {
  readonly projection: ShopControllerProjection;
  readonly onRetry: () => void;
  readonly onRequestPurchase: (itemId: string) => void;
  readonly onConfirmPurchase: () => void;
  readonly onDismissPurchase: () => void;
  readonly onRetryPurchaseRefresh: () => void;
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
}: ShopScreenProps) => {
  const selectedItem = itemForPurchase(projection);
  const purchase = projection.status === 'ready' ? projection.purchase : { status: 'idle' as const };
  const purchasePending = purchase.status === 'submitting' ||
    purchase.status === 'committed_refresh_pending';
  const actionForItem = (item: ItemTileModel): ItemTileAction | undefined => {
    if (projection.status !== 'ready' || item.state !== 'available') return undefined;
    const shortfall = Math.max(0, item.priceCoins - projection.shop.profile.coinBalance);
    return {
      label: shortfall > 0 ? `Chưa đủ Coin · thiếu ${shortfall}` : 'Mua',
      accessibilityLabel: shortfall > 0
        ? `Chưa đủ Coin để mua ${item.displayName}, thiếu ${shortfall} Coin`
        : `Mua ${item.displayName} với ${item.priceCoins} Coin`,
      disabled: shortfall > 0 || purchasePending || projection.refresh !== 'idle',
      busy: purchase.status === 'submitting' && purchase.itemId === item.id,
      onPress: () => onRequestPurchase(item.id),
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
          <ItemGrid actionForItem={actionForItem} items={projection.shop.items} />
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
