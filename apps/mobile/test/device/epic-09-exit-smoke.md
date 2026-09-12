# EPIC-09 / US-09-05 quick UI smoke

Status: `PASS_OWNER_QUICK_UI`
Implementation SHA: `a1abf5fecea6f27483de024bc64df2f2b2bfe0b5`

Owner result (2026-09-12): no crash; behavior worked as expected. Đây là quick UI acceptance trên
exact committed/pushed SHA; các structured platform/accessibility rows chưa chạy vẫn giữ `NOT_RUN`.

Guide này kiểm tra exit candidate của History/Contribution. Mỗi fixture dùng database riêng với prefix
`pixeldoro-us-09-05-`; không đọc, reset hoặc ghi vào database thường `pixeldoro.db`.

## 1. Empty và mixed/pagination

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=epic_09_empty pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=epic_09_mixed_40 pnpm start --clear
```

Dừng Metro trước khi chuyển fixture.

- [ ] `epic_09_empty`: tab `Lịch sử` hiện empty state, graph đủ 7 ngày ở mức zero, không crash.
- [ ] `epic_09_mixed_40`: trang đầu có 20 dòng và nút `Xem thêm`; bấm một lần có đủ 40 dòng,
  không trùng/mất dòng.
- [ ] Có đủ `Hoàn thành`, `Thất bại`, `Đã hủy`; section date và tổng phút chỉ tính completed.
- [ ] Năm mức graph đầu tuần lần lượt là zero, low, medium, high, peak.
- [ ] Rời tab rồi quay lại tạo focus episode mới nhưng UI không nháy empty hoặc nhân đôi dữ liệu.

## 2. Offline, relaunch và failure isolation

```sh
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=epic_09_offline_relaunch pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=epic_09_read_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=epic_09_analytics_failure_once pnpm start --clear
```

- [ ] `epic_09_offline_relaunch`: bật Airplane mode, mở History, load đủ hai trang; force-close/reopen
  vẫn giữ đúng rows, groups và graph.
- [ ] Background→foreground khi đang ở History chỉ refresh local data; không reset list/navigation.
- [ ] `epic_09_read_failure_once`: list và graph có failure riêng; bấm từng `Thử lại` thì phục hồi,
  không che hoặc reset panel còn lại.
- [ ] `epic_09_analytics_failure_once`: History/graph/load more/refocus vẫn hoạt động bình thường;
  không hiện Recovery hay lỗi analytics trên UI.
- [ ] Analytics evidence tự động kiểm exact `history_viewed:<focusEpisodeId>`, properties `{}` và
  one event/inactive→active; không cần debug UI.

## 3. Timezone và accessibility quick pass

```sh
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=epic_09_timezone_changed pnpm start --clear
```

- [ ] Range hiện tại dịch đến `13/09`; các History row vẫn nằm trong ngày local đã lưu, không regroup.
- [ ] Largest text không che status badge/nút; row text và badge vertical center, padding hai phía đều.
- [ ] VoiceOver/TalkBack đọc row, Retry, Load more và contribution exact row rõ nghĩa.
- [ ] Reduce Motion không làm mất trạng thái; graph không tạo focus thừa.

## 4. Cleanup và evidence

```sh
unset EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] Launch thường dùng `pixeldoro.db`; Settings prototype và các later-owner branches vẫn tồn tại.
- [ ] Ghi PASS/FAIL/BLOCKED/NOT_RUN, device/OS/network/accessibility, screenshot và exact SHA thực tế.

| Platform/device/OS | Fixture/settings | Result | Artifact/notes |
|---|---|---|---|
| `Owner available UI environment; metadata not recorded` | `Quick UI smoke` | `PASS_OWNER_QUICK_UI` | 2026-09-12 at `a1abf5f...`: no crash, behavior worked as expected |
| `<fill>` | `epic_09_empty` | `NOT_RUN` | `<implementation-sha>` |
| `<fill>` | `epic_09_mixed_40` | `NOT_RUN` | `<fill>` |
| `<fill>` | `epic_09_offline_relaunch` + Airplane mode | `NOT_RUN` | `<fill>` |
| `<fill>` | `epic_09_read_failure_once` | `NOT_RUN` | `<fill>` |
| `<fill>` | `epic_09_analytics_failure_once` | `NOT_RUN` | `<fill>` |
| `<fill>` | `epic_09_timezone_changed` | `NOT_RUN` | `<fill>` |
| `<fill>` | `Largest text + VoiceOver/TalkBack + Reduce Motion` | `NOT_RUN` | `<fill>` |
