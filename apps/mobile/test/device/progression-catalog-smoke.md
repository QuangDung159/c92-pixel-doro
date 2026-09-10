# US-08-01 — Progression & catalog quick UI smoke

Status: `OWNER_QUICK_UI_SMOKE_REPORTED`. Owner quick UI: `PASS` on 2026-09-10 — no crash and
behavior worked as expected at exact SHA `9be0a0f399a78014bb1a67239b0c478b30a7cdcd`.
Structured fixture/platform/accessibility cases below remain `NOT_RUN`; automated checks and the
general owner smoke do not replace those evidence rows.

## 1. Setup an toàn

Từ repository root, dùng Node đã khóa. Mỗi fixture dùng database riêng có prefix
`pixeldoro-us-08-01-`; không seed, reset hoặc xóa database thường `pixeldoro.db`.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=shop_fresh_zero pnpm start --clear
```

Mở tab Shop trong app. Nếu cần deep link:

```sh
xcrun simctl openurl booted 'pixeldoro://shop?review=us0801'
adb shell am start -W -a android.intent.action.VIEW -d 'pixeldoro://shop?review=us0801'
```

Ghi implementation SHA, build, platform/device/OS, timezone, network, cỡ chữ, VoiceOver/TalkBack,
Reduce Motion và kết quả `PASS/FAIL/BLOCKED/NOT_RUN`.

## 2. Smoke nhanh bắt buộc

- [ ] `shop_fresh_zero`: Shop hiện Level 1, 0 XP, 0 Coin và đúng 12 vật phẩm/giá; không badge
  prototype, không nút mua/trang bị.
- [ ] Chuyển Home ↔ Shop: Level/XP/Coin giống nhau; refocus cập nhật nhẹ, không chớp về loading.
- [ ] Cuộn hết danh sách; tên/giá/trạng thái không bị cắt ở cỡ chữ lớn.
- [ ] Bật Airplane mode và cold relaunch: cùng dữ liệu local vẫn hiển thị.

## 3. Progression, ownership và Retry

Dừng Metro giữa mỗi fixture rồi chạy từng case cần review:

```sh
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=shop_progress_45 pnpm start --clear
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=shop_progress_50 pnpm start --clear
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=shop_owned_mixed pnpm start --clear
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=shop_read_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=shop_catalog_corrupt pnpm start --clear
```

- [ ] `shop_progress_45` → Level 1, còn 5 XP; `shop_progress_50` → Level 2, không phát sinh thêm reward.
- [ ] `shop_owned_mixed`: `Cốc trên bàn` là `Đã sở hữu`, `Chậu cây nhỏ` là `Đang trang bị`,
  các item còn lại `Có thể mua`.
- [ ] `shop_read_failure_once`: lần đầu báo lỗi local; bấm `Thử lại` thì hiện catalog thật. Retry
  nhiều lần không đổi XP/Coin/ownership và không ghi thêm `shop_viewed` trong cùng focus episode.
- [ ] `shop_catalog_corrupt`: app vào safe recovery; không dựng catalog giả và không hiển thị empty state giả.
- [ ] VoiceOver/TalkBack đọc một summary Level/XP/Coin, progress bar riêng và từng item gồm tên, giá,
  trạng thái; màu/marker không phải tín hiệu duy nhất.

`49 XP` chỉ là unit boundary. Fixture thiết bị dùng `45→50 XP` vì production Focus chỉ tạo reward
theo bội số 5; fixture không sửa thẳng profile/reward.

## 4. Cleanup và evidence

Trong fixture, dùng flow **Reset dữ liệu test** đã xác nhận nếu muốn xóa dữ liệu review, rồi dừng
Metro ngay để fixture không seed lại. Sau đó bỏ fixture và mở app thường:

```sh
unset EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] Database thường còn nguyên dữ liệu trước review.
- [ ] Đính kèm screenshot/recording, fixture, database name và kết quả. Case chưa chạy giữ `NOT_RUN`.

| Platform/device/OS | Fixture | Scenario | Result | Artifact/notes |
|---|---|---|---|---|
| `Owner report; metadata not recorded` | `Quick UI smoke` | App stability + expected US-08-01 behavior | `PASS` | 2026-09-10: no crash, worked as expected. Not a structured/formal matrix. |
| `<fill>` | `shop_fresh_zero` | Catalog + parity + offline | `NOT_RUN` | `<fill>` |
| `<fill>` | `shop_progress_45/50` | Level boundary | `NOT_RUN` | `<fill>` |
| `<fill>` | `shop_owned_mixed` | Item states | `NOT_RUN` | `<fill>` |
| `<fill>` | `shop_read_failure_once/shop_catalog_corrupt` | Retry/recovery/no-write | `NOT_RUN` | `<fill>` |
