# US-09-01 — Focus history first-page UI smoke

Status: `OWNER_QUICK_UI_SMOKE_REPORTED_PASS`. Owner xác nhận ngày 2026-09-11 tại exact committed/
pushed SHA `18057fafe478ea95969c43c11b1ad72d9a7faed4`: không crash và behavior hoạt động như kỳ vọng.
Đây là quick UI acceptance; structured fixture/platform/accessibility rows vẫn `NOT_RUN`. Các fixture
chỉ bật trong dev, dùng database riêng prefix `pixeldoro-us-09-01-` và không đụng database thật
`pixeldoro.db`.

## 1. Setup

Ghi trước platform/device/OS, build/runtime, timezone, trạng thái network và cỡ chữ. Từ repository:

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_first_page_mixed pnpm start --clear
```

Mở tab `Lịch sử`. Nếu cần deep link:

```sh
xcrun simctl openurl booted 'pixeldoro://history?review=us0901'
adb shell am start -W -a android.intent.action.VIEW -d 'pixeldoro://history?review=us0901'
```

## 2. Smoke nhanh bắt buộc

- [ ] Header hiện `Những nhịp đã qua.`; không còn biểu đồ/sample data của prototype.
- [ ] Danh sách có đúng 3 dòng theo thứ tự mới nhất trước: `15 phút · Viết` / `Đã hủy`,
  `25 phút · Học tập` / `Thất bại`, `25 phút · Lập trình` / `Hoàn thành`.
- [ ] Cả 3 dòng hiện ngày `11/09/2026`; không hiện mode, giờ, XP, Coin hoặc reward.
- [ ] Trial và phiên nghỉ do fixture tạo không xuất hiện.
- [ ] Chuyển Home → Lịch sử → Shop → Lịch sử trong cùng runtime: danh sách ổn định, không nháy
  loading và không tự refresh.
- [ ] Kill/cold relaunch với cùng fixture: đúng 3 dòng được đọc lại từ SQLite.
- [ ] Bật Airplane mode, cold relaunch và mở `Lịch sử`: kết quả vẫn giống nhau.

## 3. Các nhánh fixture

Dừng Metro giữa mỗi fixture rồi chạy lần lượt:

```sh
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_first_page_empty pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_first_page_read_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_first_page_corrupt pnpm start --clear
```

- [ ] `history_first_page_empty`: hiện `Chưa có lịch sử Focus`; không có dòng giả và không có graph.
- [ ] `history_first_page_read_failure_once`: lần đầu hiện lỗi local; bấm `Thử lại` thì hiện đúng 3
  dòng. Retry chỉ đọc lại, không tạo phiên hay reward mới.
- [ ] `history_first_page_corrupt`: app đi vào màn recovery toàn cục vì local date không hợp lệ;
  không render dữ liệu một phần và không tự reset database.
- [ ] Với danh sách mixed, cỡ chữ lớn nhất không che ngày/trạng thái; vùng nội dung vẫn cuộn được
  trên màn hình portrait nhỏ.
- [ ] VoiceOver/TalkBack đọc mỗi dòng một lần theo thứ tự ngày, số phút, tag, trạng thái; badge
  không bị đọc lặp.
- [ ] Grayscale vẫn phân biệt được trạng thái bằng chữ; Reduce Motion không làm mất thông tin.

## 4. Cleanup và evidence

```sh
unset EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE
pnpm start --clear
```

Xác nhận lần chạy bình thường quay lại `pixeldoro.db`. Mỗi kết quả cần implementation SHA, thiết
bị/OS, timezone, PASS/FAIL/BLOCKED và screenshot/recording; case chưa chạy giữ `NOT_RUN`.

| Platform/device/OS | Fixture | Network/a11y | Result | Artifact/notes |
|---|---|---|---|---|
| `Owner available UI environment; metadata not recorded` | `Quick UI smoke` | `Not recorded` | `PASS_OWNER_QUICK_UI` | 2026-09-11 at `18057faf...`: no crash, behavior worked as expected |
| `<fill>` | `history_first_page_mixed` | `<fill>` | `NOT_RUN` | `<implementation-sha>` |
| `<fill>` | `history_first_page_empty` | `<fill>` | `NOT_RUN` | `<fill>` |
| `<fill>` | `history_first_page_read_failure_once` | `<fill>` | `NOT_RUN` | `<fill>` |
| `<fill>` | `history_first_page_corrupt` | `<fill>` | `NOT_RUN` | `<fill>` |
