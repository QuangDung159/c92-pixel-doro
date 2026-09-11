# US-08-03 — Inventory equip/unequip quick UI smoke

Status: `OWNER_QUICK_UI_SMOKE_REPORTED`. Owner quick UI: `PASS` on 2026-09-11 at exact SHA
`d6399dd7590852c051f671757c3200c8d70b8bc8` — no crash and behavior worked as expected. Structured
fixture/platform/accessibility rows remain `NOT_RUN`. Các fixture chỉ bật trong dev, dùng database
riêng prefix `pixeldoro-us-08-03-` và không đụng `pixeldoro.db`.

## 1. Setup nhanh

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=inventory_mixed pnpm start --clear
```

Mở tab Shop. Nếu cần deep link:

```sh
xcrun simctl openurl booted 'pixeldoro://shop?review=us0803'
adb shell am start -W -a android.intent.action.VIEW -d 'pixeldoro://shop?review=us0803'
```

## 2. Smoke nhanh bắt buộc

- [ ] Shop có hai lựa chọn `Cửa hàng` và `Đã sở hữu`; `Cửa hàng` vẫn đủ 12 item.
- [ ] Chọn `Đã sở hữu`: chỉ có `Cốc trên bàn` ở trạng thái owned và `Chậu cây nhỏ` đang equipped.
- [ ] Bấm `Trang bị` trên Cốc thật nhanh nhiều lần: chỉ một nút busy `Đang trang bị…`, mọi action
  equip khác bị khóa; sau refresh cả Cốc và Chậu cây đều `Đang trang bị` (multi-equip).
- [ ] Bấm `Tháo` trên Chậu cây: không có dialog xác nhận; Cốc vẫn equipped, Chậu cây về owned.
- [ ] Coin/XP không đổi qua cả hai thao tác. Chuyển Home ↔ Shop vẫn giữ mode `Đã sở hữu` trong phiên.
- [ ] Kill/cold relaunch: mode mặc định lại `Cửa hàng`, nhưng trạng thái equip/unequip vẫn đúng.
- [ ] Bật Airplane mode và lặp lại trên database fixture mới: thao tác local vẫn hoạt động.

## 3. Nhánh ngắn bổ sung

Dừng Metro giữa các fixture:

```sh
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=inventory_empty pnpm start --clear
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=inventory_multi_equipped pnpm start --clear
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=equip_read_failure_once pnpm start --clear
```

- [ ] `inventory_empty`: `Đã sở hữu` hiện empty state và nút `Xem cửa hàng` quay về catalog.
- [ ] `inventory_multi_equipped`: hai item cùng `Đang trang bị`; tháo một item không đổi item còn lại.
- [ ] `equip_read_failure_once`: bấm `Trang bị` Cốc; UI báo `Đã lưu thay đổi trang bị`; bấm
  `Thử đọc lại dữ liệu` thì danh sách cập nhật. Đây là refresh-only, không gửi lại lệnh equip.
- [ ] Cỡ chữ lớn không cắt mode/tên/action; VoiceOver/TalkBack đọc tên, giá, trạng thái và action;
  Reduce Motion không làm mất thông tin; vùng chạm vẫn dễ dùng.

Các nhánh same-state, not-owned/corrupt, write failure, opposite race và analytics failure được kiểm
bằng automated suite; fixture UI không chèn trực tiếp ownership giả.

## 4. Cleanup và evidence

```sh
unset EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE
pnpm start --clear
```

Ghi platform/device/OS, implementation SHA, PASS/FAIL/BLOCKED và screenshot/recording. Case chưa chạy
giữ `NOT_RUN`.

| Platform/device/OS | Fixture | Result | Artifact/notes |
|---|---|---|---|
| `Owner report; metadata not recorded` | `Quick UI smoke` | `PASS` | 2026-09-11: no crash, worked as expected at `d6399dd...`; not a structured/formal matrix. |
| `<fill>` | `inventory_mixed` | `NOT_RUN` | `<implementation-sha>` |
| `<fill>` | `inventory_empty/inventory_multi_equipped` | `NOT_RUN` | `<fill>` |
| `<fill>` | `equip_read_failure_once` | `NOT_RUN` | `<fill>` |
