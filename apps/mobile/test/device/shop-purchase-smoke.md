# US-08-02 — Atomic purchase quick UI smoke

Status: `OWNER_QUICK_UI_SMOKE_REPORTED`. Owner quick UI: `PASS` on 2026-09-11 at exact SHA
`5c6791dbec982d7f522e4113180458daf2e9ce95` — no crash and behavior worked as expected. Structured
fixture/platform/accessibility rows remain `NOT_RUN`. Các fixture dùng database riêng prefix
`pixeldoro-us-08-02-` và không đụng `pixeldoro.db`.

## 1. Setup

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=purchase_exact_balance pnpm start --clear
```

Mở tab Shop. Nếu cần deep link:

```sh
xcrun simctl openurl booted 'pixeldoro://shop?review=us0802'
adb shell am start -W -a android.intent.action.VIEW -d 'pixeldoro://shop?review=us0802'
```

## 2. Smoke nhanh bắt buộc

- [ ] `purchase_exact_balance`: đầu vào 5 Coin. Tile `Cốc trên bàn` có nút `Mua`.
- [ ] Bấm `Mua` → dialog ghi đúng `Dùng 5 Coin`, `Để sau`, `Mua với 5 Coin`; bấm `Để sau`
  không đổi Coin/trạng thái và focus trở về tile vừa chọn.
- [ ] Mở lại, bấm confirm thật nhanh nhiều lần: chỉ một busy `Đang mua…`, sau đó Coin `5→0`, item
  thành `Đã sở hữu`, chưa trang bị và hiện đúng một thông báo thành công.
- [ ] Chuyển Home ↔ Shop hoặc cold relaunch: Coin vẫn `0`, item vẫn owned, không xuất hiện nút mua lại.
- [ ] Bật Airplane mode và lặp lại trên database fixture mới: local purchase vẫn hoạt động.

## 3. Nhánh ngắn bổ sung

Dừng Metro giữa các fixture:

```sh
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=purchase_insufficient pnpm start --clear
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=purchase_owned pnpm start --clear
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=purchase_read_failure_once pnpm start --clear
```

- [ ] `purchase_insufficient`: 0 Coin; CTA disabled ghi `Chưa đủ Coin · thiếu 5`; không mở dialog.
- [ ] `purchase_owned`: item đã owned, Coin 0; không có CTA mua lại.
- [ ] `purchase_read_failure_once`: mua commit, UI báo `Đã ghi nhận giao dịch`; bấm
  `Thử đọc lại dữ liệu` thì Coin/item cập nhật. Đây là refresh-only, không chạy mua lần hai.
- [ ] Cỡ chữ lớn không cắt tên/giá/dialog; VoiceOver/TalkBack đọc item, giá, trạng thái, CTA, busy và
  kết quả; Reduce Motion không làm mất thông tin; mọi CTA vẫn dễ chạm.

Rapid/concurrent same-item, concurrent reward, rollback từng write, ambiguous commit và analytics
failure được kiểm bằng automated suite; không dùng fixture UI để giả lập durable truth.

## 4. Cleanup và evidence

```sh
unset EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] App thường vẫn dùng database cũ; ghi platform/device/OS, implementation SHA, PASS/FAIL/BLOCKED,
  screenshot/recording. Case chưa chạy giữ `NOT_RUN`.

| Platform/device/OS | Fixture | Result | Artifact/notes |
|---|---|---|---|
| `Owner report; metadata not recorded` | `Quick UI smoke` | `PASS` | 2026-09-11: no crash, worked as expected at `5c6791d...`; not a structured/formal matrix. |
| `<fill>` | `purchase_exact_balance` | `NOT_RUN` | `<fill>` |
| `<fill>` | `purchase_insufficient/purchase_owned` | `NOT_RUN` | `<fill>` |
| `<fill>` | `purchase_read_failure_once` | `NOT_RUN` | `<fill>` |
