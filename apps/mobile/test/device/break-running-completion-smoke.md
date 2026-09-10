# US-07-03 — Break countdown, relaunch và completion quick smoke

Status: `OWNER_QUICK_UI_SMOKE_REPORTED` — owner confirmed PASS ngày 2026-09-09: không crash, hoạt
động đúng kỳ vọng. Formal tester: `NOT_RUN`.

Ghi `<implementation-sha>`, platform/device/OS, build, fixture, thời gian và PASS/FAIL/BLOCKED/NOT_RUN.
Fixtures chỉ dùng database disposable prefix `pixeldoro-us-07-03-`; không ghi vào `pixeldoro.db`.

## 1. Chuẩn bị

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node --version
```

Mỗi case dừng Metro bằng Ctrl+C rồi chạy đúng một fixture với `pnpm start --clear`. Nhấn `i` để mở
Development Build. Sau test, dùng **Reset dữ liệu test** nếu cần rồi restart fixture.

## 2. Short / Long countdown và completion

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_running_short_fast_clock pnpm start --clear
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_running_long_fast_clock pnpm start --clear
```

- [ ] Short hiện `Nghỉ ngắn · 5 phút`; Long hiện `Nghỉ dài · 15 phút`.
- [ ] Đồng hồ giảm theo timestamp (mỗi khoảng 120 ms thật tiến 60 giây), không âm và không đứng ở số tĩnh.
- [ ] Đến 0 chỉ complete một lần; màn hình báo hoàn thành, Pet trở lại trạng thái sẵn sàng.
- [ ] Completion giữ XP/Coin bằng 0, không Claim/reward/notification/analytics mới.
- [ ] Running không có Pause, Strict Mode hoặc Cancel; completed chỉ có **Về Home**.
- [ ] **Về Home** usable; cadence chỉ đổi theo Focus đã complete trước đó, Break không tự reset/tăng cadence.

## 3. Background và relaunch trước deadline

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_running_relaunch_before_deadline pnpm start --clear
```

- [ ] Ghi thời gian còn lại, đưa app background/khóa màn hình rồi trở lại: đồng hồ tính từ `endsAt`, không
  cộng thêm thời gian và không tạo durable background write.
- [ ] Kill/relaunch trước deadline mở lại exact active Break, không fallback sang Focus/latest/prototype.
- [ ] Kill/relaunch sau deadline thật tự reconcile thành completed một lần, XP/Coin vẫn 0.
- [ ] Mở URL phải quote để shell không hiểu dấu `?`:

```sh
xcrun simctl openurl booted 'pixeldoro://break/session?sessionId=us0703-break-1'
```

Android: `adb shell am start -W -a android.intent.action.VIEW -d 'pixeldoro://break/session?sessionId=us0703-break-1'`.

## 4. Failure một lần và Retry

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_completion_write_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_completion_read_failure_once pnpm start --clear
```

- [ ] Write failure lần đầu vào Recovery, không hiển thị completed giả; Retry hoàn tất đúng một lần.
- [ ] Read failure sau commit vào Recovery; Retry chỉ đọc/reconcile exact ID, không tạo reward hay completion kép.
- [ ] Không reload app trước Retry vì fixture one-shot được tạo lại theo runtime.

## 5. Accessibility, offline và cleanup

- [ ] Airplane mode vẫn countdown/complete vì durable local path không phụ thuộc network.
- [ ] VoiceOver/TalkBack đọc loại Break, thời gian còn lại, completion và CTA rõ ràng.
- [ ] Largest text vẫn scroll tới nội dung/CTA; Reduce Motion không làm mất trạng thái bằng chữ.
- [ ] Invalid/missing/Focus/cancelled ID báo unavailable, không tự mở một session khác.

```sh
unset EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE
pnpm start --clear
```

| Platform/device/OS | Fixture | Scenario | Result | Artifact/notes |
|---|---|---|---|---|
| `Owner report; metadata not recorded` | `Quick UI smoke` | Stability + expected US-07-03 behavior | `PASS` | 2026-09-09: no crash, works as expected; không thay structured/formal matrix. |
| `<fill>` | `break_running_short_fast_clock` | Short/countdown/completion | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_running_long_fast_clock` | Long/countdown/completion | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_running_relaunch_before_deadline` | Background/relaunch | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_completion_write_failure_once` | Write recovery | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_completion_read_failure_once` | Read-after-commit recovery | `NOT_RUN` | `<fill>` |

Owner quick smoke đã PASS nhưng formal/structured matrix vẫn ghi riêng; case chưa chạy giữ `NOT_RUN`.
