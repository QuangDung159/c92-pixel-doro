# US-09-02 — Focus history pagination/lifecycle UI smoke

Status: `OWNER_QUICK_UI_SMOKE_REPORTED_PASS`. Owner xác nhận ngày 2026-09-12 tại exact committed/
pushed SHA `91d0612975c9532d0d860be7dcd9995584cde96b`: không crash và behavior hoạt động như kỳ vọng.
Đây là quick UI acceptance; structured fixture/platform/accessibility rows vẫn `NOT_RUN`. Các fixture
dev-only dùng database riêng prefix `pixeldoro-us-09-02-`; không đụng production database
`pixeldoro.db`.

## 1. Setup và primary flow

Ghi platform/device/OS, build/runtime, timezone, network, text size và accessibility settings.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_grouped_21 pnpm start --clear
```

Mở tab `Lịch sử`.

- [ ] First page có 20 rows, group theo `11/09/2026`, `10/09/2026`, `09/09/2026`.
- [ ] Header totals lần lượt là `105 phút hoàn thành`, `85 phút hoàn thành`,
  `105 phút hoàn thành`; failed/cancelled vẫn có row nhưng không tăng total.
- [ ] Có nút `Xem thêm`; bấm một lần thì tổng row thành 21, không duplicate hoặc mất row.
- [ ] Row thứ 21 merge vào group `09/09/2026`; completed total của group không đổi vì row đó đã hủy.
- [ ] Khi `nextCursor = null`, nút `Xem thêm` biến mất; không có infinite-scroll tự động.
- [ ] Header không sticky; chỉ list cuộn, screen không có nested-scroll warning.

## 2. Boundary và failure flows

Dừng Metro giữa mỗi fixture:

```sh
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_equal_end_boundary pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_load_more_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_refresh_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_new_terminal_on_refresh pnpm start --clear
```

- [ ] `history_equal_end_boundary`: first page 20, `Xem thêm` thành 21; không duplicate/skip ở cặp
  equal timestamp.
- [ ] `history_load_more_failure_once`: bấm `Xem thêm`; 20 rows cũ vẫn còn và hiện
  `Chưa tải thêm được lịch sử.`; bấm `Thử tải lại` thì đúng 21 rows và nút biến mất.
- [ ] `history_refresh_failure_once`: rời tab rồi quay lại; rows cũ vẫn còn, hiện
  `Chưa cập nhật được lịch sử mới nhất.`; bấm `Thử lại` thì notice biến mất.
- [ ] `history_new_terminal_on_refresh`: lần đầu newest row là `15 phút · Học tập`; rời/quay lại thì
  row mới `25 phút · Lập trình` / `Đã hủy` xuất hiện ở đầu sau refresh thành công.
- [ ] Trong lúc refresh, rows cũ vẫn hiện cùng notice `Đang cập nhật lịch sử…`; Load more bị khóa.
- [ ] Background rồi foreground khi History đang mở tạo cùng refresh behavior.
- [ ] Background/foreground khi tab khác đang mở không làm History query/render xen vào tab đó.
- [ ] Bật Airplane mode và cold relaunch `history_grouped_21`: first page/group/totals vẫn đúng.

## 3. Layout và accessibility

- [ ] Small portrait chỉ có SectionList là scroll owner; header/list/footer đều truy cập được.
- [ ] Largest text không cắt date, total, row status hoặc `Xem thêm`/Retry; content vẫn cuộn được.
- [ ] VoiceOver/TalkBack đọc date header trước rows, gồm explicit `N phút hoàn thành`.
- [ ] Mỗi row vẫn được đọc một lần; badge không tạo duplicate focus.
- [ ] `Xem thêm`, `Thử tải lại`, `Thử lại` có role button và busy/disabled state đúng.
- [ ] Grayscale vẫn phân biệt completed/failed/cancelled bằng text; Reduce Motion không mất behavior.

## 4. Cleanup và evidence

```sh
unset EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE
pnpm start --clear
```

Xác nhận normal launch dùng `pixeldoro.db`. Ghi implementation SHA, fixture/database, PASS/FAIL/
BLOCKED, screenshot/recording và notes; case chưa chạy giữ `NOT_RUN`.

| Platform/device/OS | Fixture | Network/a11y | Result | Artifact/notes |
|---|---|---|---|---|
| `Owner available UI environment; metadata not recorded` | `Quick UI smoke` | `Not recorded` | `PASS_OWNER_QUICK_UI` | 2026-09-12 at `91d0612...`: no crash, behavior worked as expected |
| `<fill>` | `history_grouped_21` | `<fill>` | `NOT_RUN` | `<implementation-sha>` |
| `<fill>` | `history_equal_end_boundary` | `<fill>` | `NOT_RUN` | `<fill>` |
| `<fill>` | `history_load_more_failure_once` | `<fill>` | `NOT_RUN` | `<fill>` |
| `<fill>` | `history_refresh_failure_once` | `<fill>` | `NOT_RUN` | `<fill>` |
| `<fill>` | `history_new_terminal_on_refresh` | `<fill>` | `NOT_RUN` | `<fill>` |
