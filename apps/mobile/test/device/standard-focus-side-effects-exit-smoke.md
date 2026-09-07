# US-06-05 — Local notification, analytics, accessibility và EPIC-06 exit

Status: NOT_RUN — chờ owner quick UI trên implementation candidate `<implementation-sha>`.
Formal tester: `DEFERRED_TO_LATER_PHASE`. Ghi platform, device/simulator, OS, Development Build,
permission state, text size, screen reader, Reduce Motion, ảnh/video/log và PASS/FAIL/BLOCKED.

## 1. Bắt buộc rebuild Development Build

US-06-05 thêm config plugin `expo-notifications`; Metro reload không đủ. Từ repository root với
Node `22.23.2`, tạo lại Development Build trên iOS và Android trước khi kết luận native behavior.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
pnpm ios
pnpm android
```

Không cần Expo push token, APNs/FCM credential hoặc network: Story chỉ dùng local notification.

## 2. Quick notification smoke — khoảng 30 giây

Reset OS notification permission cho PixelDoro trên simulator/device, sau đó chạy:

```sh
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_side_effect_fast_notification pnpm start --clear
```

- [ ] Tạo `15 phút / Relax / Học tập`; Start vào Running ngay, không chờ permission/schedule.
- [ ] Permission system xuất hiện tối đa một lần sau committed Start. Cho phép notification.
- [ ] Đưa app về background. Khoảng 30 giây thật nhận đúng một notification:
  `Phiên tập trung đã kết thúc` / `Mèo Dev đang chờ bạn xem kết quả.`
- [ ] Tap notification mở exact committed Result `+15 XP / +3 Coin`, không grant/replay lần hai.
- [ ] Tap/reopen lại không tạo reward/event mới; notification cũ không kéo sang Trial/latest Result.
- [ ] Cancel một phiên mới: local notification bị hủy; Result 0/0 và core flow không crash.

Fixture chỉ rút ngắn native notification trigger và dùng clock x30 qua production orchestration;
durable Standard session vẫn có configured duration 15 phút. Không dùng fixture này làm bằng chứng
relaunch timestamp qua process kill.

## 3. Permission/provider failure isolation

Mỗi lần dừng Metro rồi chạy đúng một fixture:

```sh
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_side_effect_permission_denied pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_side_effect_schedule_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_side_effect_cancel_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_side_effect_queue_failure_once pnpm start --clear
```

- [ ] Denied: không prompt lặp, không notification; Start/countdown/completion/reward vẫn đúng.
- [ ] Schedule failure: Start vẫn vào Running; không vào core Recovery.
- [ ] Cancel failure: cancelled/failed/completed Result và reward truth vẫn đúng.
- [ ] Queue failure: session/reward/profile vẫn commit; retry/reopen không backfill event lịch sử.
- [ ] Chế độ offline lặp primary flow: local timer/result/notification/queue không phụ thuộc network.

## 4. Analytics local evidence

Analytics chỉ enqueue local SQLite khi `analytics_enabled=1`; không có PostHog/network delivery.
Qua automated probe hoặc development inspection, xác nhận deterministic IDs:

- [ ] `focus_session_started:<sessionId>` một lần sau committed Start.
- [ ] Đúng một terminal event: `focus_session_completed`, `focus_session_failed` hoặc
  `focus_session_cancelled` theo fresh terminal commit.
- [ ] Completed có `reward_granted:<receiptId>`; failed/cancelled không có reward event.
- [ ] Properties chỉ có mode/workTag/duration/terminal/reward allowlist; không session ID, receipt ID,
  free text, device ID, Pet name hoặc current balance.
- [ ] Trial vẫn chỉ phát onboarding analytics; analytics opt-out không backfill khi bật lại.

## 5. Accessibility và cleanup

- [ ] VoiceOver iOS và TalkBack Android đọc rõ Setup selections, countdown value, Cancel modal,
  completed/failed/cancelled Result và CTA Home/Retry.
- [ ] Countdown không tự đọc mỗi giây; deadline pending được thông báo polite một lần theo state.
- [ ] Largest text: mode/tag, reward/progression và CTA wrap/stack, không bị che hoặc mất thao tác.
- [ ] Reduce Motion: Pet fallback và toàn bộ meaning/reward vẫn có text, không phụ thuộc animation/color.
- [ ] Hidden pegboard decoration placeholder vẫn không xuất hiện.

```sh
unset EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE
pnpm start --clear
```

Chỉ owner quick-smoke được ghi khi các bước thực tế đã chạy. Validator/checklist, unit tests và JS
export không thay thế native device evidence; formal tester giữ `DEFERRED_TO_LATER_PHASE` nếu chưa chạy.
