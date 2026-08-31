# US-04-07 — Hướng dẫn test production Cat sprite

Không cần `prebuild`, EAS hay cài dependency mới. Dùng Development Build hiện có.

## 1. Chuẩn bị đúng Node

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
pnpm quality
```

Kỳ vọng `node -v` là `v22.23.2`; quality phải pass `55` files / `281` tests. Ghi Git SHA, platform,
device/simulator và OS. Không dùng `nvm use` nếu máy chưa cài `nvm`.

## 2. Kiểm tra ba loop base

Dừng Metro giữa mỗi scenario, chạy từng lệnh rồi mở Pet Room/active screen:

```sh
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=short_break pnpm start --clear
```

Kỳ vọng:

- Idle: Cat đứng/ngồi chờ, sáu frame chạy tuần hoàn chậm; không còn hình robot trung tính.
- Working: cùng Cat làm việc với laptop/desk; frame chạy liên tục, không reset theo countdown rerender.
- Breaking: cùng Cat nghỉ trên cushion; không dùng Working art.
- Cat không bị crop tai/đuôi, không tràn panel; status text và CTA đứng yên, vẫn bấm được.

## 3. Kiểm tra hai one-shot terminal

```sh
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=completed pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=strict_failed pnpm start --clear
```

Đi qua trial đến Result, bấm `Emit Pet review fixture` đúng một lần:

- Completed: Cat Celebrating chạy đủ sprite, status ăn mừng; trở về Idle không quá 2.000 ms.
- Strict failed: Cat Bugged dùng glitch đỏ ngắn, không mang nghĩa bị đau/chết; trở về Idle không quá
  1.500 ms và không có reward.
- Reopen Result không replay; CTA/Back vẫn phản hồi trong one-shot.

## 4. Reduced Motion và fallback

Bật **Reduce Motion** của iOS/Android rồi lặp một base và một terminal case. Kỳ vọng đúng Cat state
nhưng đứng ở fallback frame, status/CTA không đổi.

Tắt Reduce Motion, chạy lần lượt:

```sh
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus EXPO_PUBLIC_EPIC_04_ASSET_FIXTURE=playback_failure pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus EXPO_PUBLIC_EPIC_04_ASSET_FIXTURE=state_frame_missing pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus EXPO_PUBLIC_EPIC_04_ASSET_FIXTURE=all_art_missing pnpm start --clear
```

Kỳ vọng:

- `playback_failure`: Cat Working frame tĩnh + Working status.
- `state_frame_missing`: Cat Idle fallback frame + Working status; logical state không đổi thành Idle.
- `all_art_missing`: placeholder hình học nét đứt + Working status; không crash/remote download.

## 5. Accessibility, lifecycle và offline

1. Bật VoiceOver/TalkBack và font lớn; đi Home → Focus → Result → Break.
2. Xác nhận sprite là decorative, không nhận focus; mỗi state chỉ có một status announcement.
3. Background/foreground năm lần khi Working loop và một lần giữa one-shot; không nhân đôi/replay.
4. Bật Airplane Mode, force-close và mở lại; cả năm Cat assets vẫn tải từ bundle.
5. Kiểm tra ít nhất một viewport nhỏ và một viewport lớn trên iOS/Android; không clipping/che CTA.

## 6. Performance và dọn fixture

Chạy Working 30 phút trên physical device nếu có. Fail nếu freeze, leak tăng liên tục, jank >100 ms
lặp lại do Pet, nóng bất thường hoặc CTA/countdown mất phản hồi. Simulator chỉ tính functional smoke.

```sh
unset EXPO_PUBLIC_EPIC_04_ASSET_FIXTURE
unset EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE
unset EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE
unset EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE
pnpm start --clear
```

Gửi lại: Git SHA, iOS/Android device + OS, pass/fail mục 2–5, video ngắn năm state, fallback screenshots,
accessibility note và performance table. Sau owner xác nhận pass mới đánh `US-04-07`/`EPIC-04 DONE`.
