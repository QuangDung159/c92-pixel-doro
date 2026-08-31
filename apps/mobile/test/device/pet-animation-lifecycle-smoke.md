# US-04-05 Pet animation lifecycle and performance review

Dùng Development Build hiện có. US-04-05 không thêm native dependency, không cần chạy prebuild/EAS.
Fixture chỉ đổi committed Pet projection trong development và không ghi session/reward/receipt.

## 1. Chuẩn bị

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle pnpm start --clear
```

`node -v` phải là `v22.23.2`. Mở Development Build và xác nhận Pet Idle chuyển động nhẹ, status text
đứng yên, CTA vẫn bấm được. Không đánh giá FPS bằng Expo Go.

## 2. Ba loop base và không restart

Dừng Metro giữa các scenario, chạy lần lượt rồi reload app:

```sh
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=short_break pnpm start --clear
```

Kỳ vọng:

- `idle`: Pet thở/nhún chậm ở Pet Room.
- `focus`: vào Focus session, Pet Working có nhịp ngắn hơn; countdown/UI update không làm pose nhảy về
  frame đầu hoặc tạo thêm loop.
- `short_break`: vào Break session, Pet Breaking chuyển động chậm; text và nút không di chuyển theo.
- Chuyển sang tab/screen không có Pet rồi quay lại: chỉ current base loop chạy, không có hai animation
  chồng nhau.

## 3. One-shot, blur, background và unmount

```sh
EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=completed pnpm start --clear
EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=strict_failed pnpm start --clear
```

Với mỗi scenario, tạo Focus result theo guide US-04-03 và bấm `Emit Pet review fixture` đúng một lần.

- `completed`: Celebrate chạy một lần rồi giữ pose tĩnh tới hết cửa sổ feedback; không loop.
- `strict_failed`: Bugged chạy một lần rồi giữ pose tĩnh; CTA vẫn phản hồi ngay.
- Trong lúc one-shot đang chạy, điều hướng khỏi Result rồi quay lại. Animation cũ phải dừng và không
  replay chỉ vì remount.
- Trong lúc loop đang chạy, background 10–30 giây. Không được thấy jump/replay terminal khi
  foreground; current committed base được derive lại.
- Lặp background/foreground và đổi screen 5 lần. Không có loop nhân đôi, freeze hay warning đỏ.

## 4. Reduce Motion và accessibility

Bật **Reduce Motion** trong Settings của iOS/Android, relaunch Development Build và lặp một base state
cùng một terminal state. Pet phải dùng pose tĩnh; status text vẫn đọc được bằng VoiceOver/TalkBack,
không announce lặp và CTA giữ đúng focus/touch. Tắt Reduce Motion sau khi ghi evidence. Acceptance đầy
đủ cho fallback/accessibility thuộc US-04-06; bước này chỉ xác nhận hook và cleanup của US-04-05.

## 5. Ma trận performance 30 phút

Chạy loop Working liên tục **30 phút** trên physical device nếu có. Thu số bằng Instruments/Xcode cho
iOS hoặc Android Studio Profiler/Perfetto cho Android. Simulator chỉ dùng functional smoke, không dùng
làm performance pass. Ghi một dòng cho mỗi target:

| SHA | Platform/device/OS | Build | Fixture | Duration | jank >100 ms | Memory start/end | CPU avg/peak | Thermal/energy | Cold start | Binary delta | Result |
|---|---|---|---|---:|---:|---|---|---|---|---|---|
| PENDING | PENDING | Development Build | focus | 30 phút | PENDING | PENDING | PENDING | PENDING | PENDING | `0` expected | PENDING |

Pass khi không freeze/leak tăng liên tục, không có jank >100 ms lặp lại do Pet, nhiệt/energy không có
blocker và Focus CTA/countdown vẫn phản hồi. Gắn screenshot profiler hoặc export trace; không ghi raw
session payload. Nếu chưa có physical target, ghi rõ `PENDING_DEVICE_EVIDENCE`, không tự đánh dấu pass.

## 6. Dọn fixture và evidence cần gửi

```sh
unset EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE
unset EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE
unset EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE
pnpm start --clear
```

Gửi lại: Git SHA, platform/device/OS, pass/fail các bước 2–4, video ngắn background/foreground và
one-shot, bảng 30 phút cùng profiler evidence. Xác nhận app trở về luồng bình thường sau khi unset.
