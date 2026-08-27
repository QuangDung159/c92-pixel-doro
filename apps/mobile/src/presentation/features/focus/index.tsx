import { PlaceholderScreen } from '@/presentation/components/placeholder-screen';

export const FocusSetupScreen = () => (
  <PlaceholderScreen
    description="Route sẵn sàng nhận Focus configuration từ Application boundary."
    eyebrow="Focus"
    title="Chuẩn bị phiên"
  />
);

export const FocusSessionScreen = () => (
  <PlaceholderScreen
    description="Countdown thật sẽ dựa trên persisted timestamp, không dựa vào UI tick."
    eyebrow="Focus"
    title="Đang tập trung"
  />
);

export const FocusResultScreen = () => (
  <PlaceholderScreen
    description="Kết quả chỉ hiển thị sau khi Application trả về durable projection đã commit."
    eyebrow="Focus"
    title="Kết quả phiên"
  />
);

