# US-09-03 — Daily contribution projection UI smoke

Status: `NOT_RUN`. Chỉ ghi PASS sau khi chạy trên exact `<implementation-sha>`. Fixture dùng database
riêng prefix `pixeldoro-us-09-03-`; không đụng production database `pixeldoro.db`.

## 1. Setup và flow chính

Ghi platform/device/OS, build/runtime, timezone, network, text size và accessibility settings.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=contribution_mixed_week pnpm start --clear
```

Mở tab `Lịch sử`:

- [ ] Panel `7 NGÀY GẦN ĐÂY` nằm trước `GẦN ĐÂY` trong cùng list và cuộn cùng History.
- [ ] Có đủ 7 ngày `06/09` → `12/09`, oldest→today, kể cả ngày `0 phút`.
- [ ] Các ngày có dữ liệu lần lượt: `15 phút / 1 phiên`, `25 phút / 1 phiên`,
  `50 phút / 2 phiên`, `100 phút / 4 phiên`; ngày xen giữa là zero.
- [ ] Range text tương ứng `1–24`, `25–49`, `50–99`, `100+ phút`; chưa dùng final graph colors.
- [ ] History empty/list state vẫn hoạt động riêng, không crash hoặc nested-scroll warning.

## 2. Zero, timezone và failure

Dừng Metro giữa mỗi fixture:

```sh
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=contribution_zero_week pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=contribution_threshold_edges pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=contribution_cross_midnight pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=contribution_timezone_changed pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=contribution_read_failure_once pnpm start --clear
```

- [ ] `contribution_zero_week`: đủ 7 rows, mọi row `0 phút / 0 phiên`; không hiện empty graph giả.
- [ ] `contribution_threshold_edges`: thấy đủ four non-zero semantic ranges đúng boundary fixture.
- [ ] `contribution_cross_midnight`: `25 phút` giữ ở persisted day `11/09`.
- [ ] `contribution_timezone_changed`: range kết thúc `13/09`, stored contribution vẫn ở `11/09`.
- [ ] `contribution_read_failure_once`: panel hiện `Chưa đọc được đóng góp theo ngày.`; History vẫn
  usable; bấm `Thử lại` thì panel hiện đủ dữ liệu.
- [ ] Rời/quay lại tab hoặc background/foreground: panel hiện `Đang cập nhật đóng góp…`; lỗi refresh
  nếu có giữ rows cũ và Retry riêng.
- [ ] Bật Airplane mode và cold relaunch: projection vẫn đọc từ SQLite/local fixture.

## 3. Layout và accessibility

- [ ] Small portrait/largest text: date, minutes, count, range và Retry không bị cắt; content cuộn được.
- [ ] VoiceOver/TalkBack đọc mỗi day một lần: full date, minutes, completed count và exact range.
- [ ] Grayscale vẫn hiểu bằng numeric/text; Reduce Motion không làm mất behavior.
- [ ] Không có horizontal scroll; contribution và History dùng một SectionList owner.

## 4. Cleanup và evidence

```sh
unset EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE
pnpm start --clear
```

Xác nhận normal launch dùng `pixeldoro.db`. Ghi implementation SHA, fixture/database, PASS/FAIL/
BLOCKED, screenshot/recording và notes; case chưa chạy giữ `NOT_RUN`.

| Platform/device/OS | Fixture | Network/a11y | Result | Artifact/notes |
|---|---|---|---|---|
| `<fill>` | `contribution_mixed_week` | `<fill>` | `NOT_RUN` | `<implementation-sha>` |
| `<fill>` | `contribution_zero_week` | `<fill>` | `NOT_RUN` | `<fill>` |
| `<fill>` | `contribution_threshold_edges` | `<fill>` | `NOT_RUN` | `<fill>` |
| `<fill>` | `contribution_cross_midnight` | `<fill>` | `NOT_RUN` | `<fill>` |
| `<fill>` | `contribution_timezone_changed` | `<fill>` | `NOT_RUN` | `<fill>` |
| `<fill>` | `contribution_read_failure_once` | `<fill>` | `NOT_RUN` | `<fill>` |
