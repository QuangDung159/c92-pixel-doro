import type { ShopControllerProjection } from '@/application';
import { InlineNotice, SecondaryButton } from '@/presentation/components';

export interface ShopEquipNoticeProps {
  readonly projection: Extract<ShopControllerProjection, { readonly status: 'ready' }>;
  readonly onDismiss: () => void;
  readonly onRetryRefresh: () => void;
}

export const ShopEquipNotice = ({
  projection,
  onDismiss,
  onRetryRefresh,
}: ShopEquipNoticeProps) => {
  const { equip } = projection;
  if (equip.status === 'idle' || equip.status === 'submitting') return null;
  const item = projection.shop.items.find(({ id }) => id === equip.itemId);
  const displayName = item?.displayName ?? 'vật phẩm này';

  if (equip.status === 'committed_refresh_pending') {
    return (
      <>
        <InlineNotice announce>
          Đã lưu thay đổi trang bị. Đang đọc lại danh sách vật phẩm đã lưu.
        </InlineNotice>
        <SecondaryButton label="Thử đọc lại dữ liệu" onPress={onRetryRefresh} />
      </>
    );
  }

  let message: string;
  switch (equip.status) {
    case 'success':
      message = equip.equipped
        ? `Đã trang bị ${displayName}.`
        : `Đã tháo ${displayName}.`;
      break;
    case 'already_in_state':
      message = equip.equipped
        ? `${displayName} đã được trang bị từ trước.`
        : `${displayName} đã được tháo từ trước.`;
      break;
    case 'not_owned':
      message = `Bạn chưa sở hữu ${displayName}. Danh sách chưa thay đổi.`;
      break;
    case 'error':
      message = 'Chưa thể thay đổi trạng thái trang bị. Vui lòng thử lại.';
      break;
  }

  return (
    <>
      <InlineNotice announce>{message}</InlineNotice>
      <SecondaryButton label="Đóng thông báo" onPress={onDismiss} />
    </>
  );
};
