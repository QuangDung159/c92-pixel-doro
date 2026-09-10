# US-07-04 — Break cancel và exact terminal Result quick smoke

Status: `NOT_RUN`. Formal tester: `NOT_RUN`.

Ghi `<implementation-sha>`, platform/device/OS, build, fixture, thời gian và PASS/FAIL/BLOCKED/NOT_RUN.
Fixtures chỉ dùng database disposable prefix `pixeldoro-us-07-04-`; không ghi vào `pixeldoro.db`.

## 1. Chuẩn bị

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node --version
```

Mỗi case dừng Metro bằng Ctrl+C rồi chạy đúng một fixture với `pnpm start --clear`. Nhấn `i` để mở
Development Build. Không reload app giữa lỗi one-shot và lần Retry.

## 2. Smoke chính — Short cancel

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cancel_short pnpm start --clear
```

- [ ] Màn hình hiện `Nghỉ ngắn · 5 phút`, countdown đang chạy và nút **Dừng phiên**.
- [ ] Nhấn **Dừng phiên**: modal xác nhận mở; nhấn **Tiếp tục nghỉ** chỉ đóng modal, countdown tiếp tục
  và không reset thời gian.
- [ ] Mở lại modal rồi nhấn **Dừng phiên nghỉ**: chỉ commit một lần và hiện exact Result `CANCELLED`.
- [ ] Result có Pet Idle, thông báo không XP/Coin và **Về Home**; không có reward/progression/Claim.
- [ ] **Về Home** hoạt động. Double tap confirm không tạo hai transition hoặc hai navigation.
- [ ] Android hardware Back khi đang chạy mở cùng modal; Back trong modal đóng modal. iOS swipe-back không
  thoát khỏi phiên đang chạy.

Mở exact route thủ công phải quote URL để shell không hiểu dấu `?`:

```sh
xcrun simctl openurl booted 'pixeldoro://break/session?sessionId=us0704-break-1'
```

Android: `adb shell am start -W -a android.intent.action.VIEW -d 'pixeldoro://break/session?sessionId=us0704-break-1'`.

## 3. Long cancel và cadence

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cancel_long pnpm start --clear
```

- [ ] Màn hình hiện `Nghỉ dài · 15 phút`; cancel trước deadline hiện exact `CANCELLED` Result.
- [ ] XP/Coin vẫn 0, Pet trở về Idle và Long Break vẫn còn due; cancelled Long không reset cadence.

## 4. Failure một lần và Retry

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cancel_write_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cancel_read_failure_once pnpm start --clear
```

- [ ] Write failure lần đầu giữ durable row running, không hiện terminal giả; Retry cancel thành công một lần.
- [ ] Read failure xảy ra sau terminal commit; Retry chỉ hydrate exact Result, không gửi cancel intent mới.
- [ ] Background khi modal đang mở dismiss transient modal; foreground vẫn render durable current state.

## 5. Completion thắng tại deadline

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cancel_completion_first pnpm start --clear
```

- [ ] Fixture tự tới deadline nhanh và render `COMPLETED`, không bị stale Cancel ghi đè thành cancelled.
- [ ] Result vẫn zero reward và chỉ có **Về Home**.

## 6. Accessibility, offline và cleanup

- [ ] Airplane mode vẫn cancel/Result vì durable path local không phụ thuộc network.
- [ ] VoiceOver/TalkBack đọc loại Break, countdown, modal, trạng thái `CANCELLED`/`COMPLETED` và CTA rõ ràng.
- [ ] Largest text vẫn scroll tới modal/CTA; Reduce Motion không làm mất trạng thái bằng chữ.
- [ ] Kill/relaunch sau terminal về Home; exact deep link mở lại đúng immutable Result, không replay reward.

```sh
unset EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE
pnpm start --clear
```

| Platform/device/OS | Fixture | Scenario | Result | Artifact/notes |
|---|---|---|---|---|
| `<fill>` | `break_cancel_short` | Modal/dismiss/cancel/exact Result/Back | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_cancel_long` | Long cancel/cadence | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_cancel_write_failure_once` | Write failure/Retry | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_cancel_read_failure_once` | Post-commit hydration Retry | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_cancel_completion_first` | Deadline winner | `NOT_RUN` | `<fill>` |

Owner quick smoke, structured platform/accessibility matrix và formal tester được ghi riêng; case chưa
chạy luôn giữ `NOT_RUN`.
