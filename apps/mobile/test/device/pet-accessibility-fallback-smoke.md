# US-04-06 Reduced Motion, fallback và accessibility review

Dùng Development Build hiện có. Fixture chỉ thay visual availability trong development, không tải
asset từ mạng và không ghi session/reward/profile vào `pixeldoro.db`.

## 1. Chuẩn bị

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle pnpm start --clear
```

`node -v` phải in `v22.23.2`. Ghi lại XP/Coin hiện tại trước khi test.

## 2. Reduce Motion cho đủ năm state

Bật **Reduce Motion** trong Settings trước khi mở app. Chạy lần lượt ba base fixture:

```sh
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=short_break pnpm start --clear
```

Sau đó chạy terminal fixture và bấm `Emit Pet review fixture` tại Result:

```sh
EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=completed pnpm start --clear
EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=strict_failed pnpm start --clear
```

Kỳ vọng: Idle/Working/Breaking/Celebrate/Bugged đều có pose riêng nhưng không chuyển động. Celebrate
giữ tối đa **2.000 ms**, Bugged tối đa **1.500 ms** rồi trở về base; rời Result hoặc bắt đầu session
mới vẫn preempt ngay. Tắt/bật Reduce Motion khi loop hoặc one-shot đang chạy: motion phải dừng ngay,
không đổi status, XP/Coin hay kết quả phiên.

## 3. Kiểm tra ba fallback layer

Tắt Reduce Motion trước phần này. Dừng Metro giữa mỗi scenario, giữ base fixture `focus`, rồi chạy:

```sh
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus EXPO_PUBLIC_EPIC_04_ASSET_FIXTURE=playback_failure pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus EXPO_PUBLIC_EPIC_04_ASSET_FIXTURE=state_frame_missing pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus EXPO_PUBLIC_EPIC_04_ASSET_FIXTURE=all_art_missing pnpm start --clear
```

Kỳ vọng:

- `playback_failure`: không crash; hiển thị đúng Working pose tĩnh và status Working.
- `state_frame_missing`: hiển thị neutral Idle pose tĩnh nhưng status vẫn là Working; không được đổi
  logical state thành Idle.
- `all_art_missing`: hiển thị placeholder hình học nét đứt; status vẫn là Working.
- Cả ba trường hợp: CTA/Back/Complete vẫn bấm được, không remote retry/download, không màn đỏ.

Trong Metro log chỉ được có envelope dạng `[PixelDoro][PetVisual]` với `eventName`, `state`,
`fallbackLayer`, `reasonCode`; không được có session ID, tên Pet, payload, SQL hoặc stack.

## 4. Terminal fallback và durable truth

Chạy `completed` hoặc `strict_failed` cùng từng `EXPO_PUBLIC_EPIC_04_ASSET_FIXTURE`, tạo Result rồi
bấm fixture. Chụp lại state text, fallback pose và XP/Coin trước/sau.

Kỳ vọng: fallback không grant/rollback reward, không thay kết quả phiên, không replay sau reopen và
không block các nút. Kết thúc test, XP/Coin phải chỉ phản ánh luồng prototype vốn có, không thay đổi do
việc đổi asset fixture.

## 5. VoiceOver/TalkBack và chữ lớn

1. Bật VoiceOver/TalkBack và font size lớn.
2. Duyệt Home → Focus → Result → Break ở normal, Reduce Motion và `all_art_missing`.
3. Kiểm tra thứ tự focus, radio selected/disabled, button disabled/busy và Back/CTA.

Kỳ vọng: mỗi Pet state có đúng một semantic status text; decorative pose/placeholder không nhận focus;
terminal status không announce lặp khi UI rerender. Meaning không phụ thuộc màu, hình hay motion; màn
hình vẫn scroll được và CTA không bị che.

## 6. Dọn fixture và gửi evidence

```sh
unset EXPO_PUBLIC_EPIC_04_ASSET_FIXTURE
unset EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE
unset EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE
unset EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE
pnpm start --clear
```

Gửi: Git SHA, device/OS, screenshot năm reduced-motion state, ba fallback layer, accessibility notes,
before/after XP/Coin và pass/fail. Xác nhận app trở về normal motion/asset path sau khi unset.
