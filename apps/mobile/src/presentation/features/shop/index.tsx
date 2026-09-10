import type { ShopControllerProjection } from '@/application';

import {
  ErrorState,
  InlineNotice,
  ItemGrid,
  LoadingState,
  ProgressionSummary,
  SecondaryButton,
  ScreenHeader,
  ScreenShell,
} from '@/presentation/components';

export interface ShopScreenProps {
  readonly projection: ShopControllerProjection;
  readonly onRetry: () => void;
}

export const ShopScreen = ({ projection, onRetry }: ShopScreenProps) => (
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
        <ItemGrid items={projection.shop.items} />
      </>
    ) : null}
  </ScreenShell>
);
