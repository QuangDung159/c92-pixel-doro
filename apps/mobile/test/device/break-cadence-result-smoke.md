# US-07-01 — Break cadence Result quick smoke

Status: `OWNER_QUICK_UI_SMOKE_REPORTED`.
Owner quick UI: `PASS` — owner confirmed 2026-09-09: no crash, works as expected.
Formal tester: `NOT_RUN`; không suy diễn từ automated evidence.

Phạm vi xác nhận hiện có là quick smoke tổng quát; platform/device/OS, từng fixture case và
accessibility/offline/relaunch matrix chưa được cung cấp nên các checkbox/evidence row chi tiết bên
dưới vẫn giữ `NOT_RUN`.

Ghi `<implementation-sha>`, app/build profile, fixture, database name, platform, device/simulator,
OS, ngày/giờ/timezone, online/offline, text size, Reduce Motion, VoiceOver/TalkBack và
`PASS/FAIL/BLOCKED/NOT_RUN` cho từng case. Story này chỉ đọc/hiển thị recommendation; không Start
Break, không notification mới và không thay đổi reward/session/profile.

## 1. Preconditions và database isolation

Từ repository root, dùng đúng Node đã khóa:

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node --version
```

Mỗi `EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE` tự chọn database disposable riêng có prefix
`pixeldoro-us-07-01-`; normal `pixeldoro.db` không được seed/reset/xóa. Fixture tạo completed Focus
và reward hợp lệ qua production Start/Reconcile/repository path, rồi production cadence query và
recommendation use case đọc lại durable facts.

Sau khi Metro chạy, mở exact Result bằng URL tương ứng:

```text
pixeldoro://focus/result?sessionId=us0701-focus-1
pixeldoro://focus/result?sessionId=us0701-focus-3
pixeldoro://focus/result?sessionId=us0701-focus-4
pixeldoro://focus/result?sessionId=us0701-focus-5
```

- [ ] Ghi session/reward/XP/Coin fingerprint trước khi mở Result.
- [ ] Xác nhận fixture database khác normal database và không có active session.
- [ ] Không raw-delete `pixeldoro.db`, không sửa row bằng SQLite shell và không dùng prototype selector.

## 2. Short cadence — count 0 và 3

Dừng Metro giữa các fixture, rồi chạy từng lệnh:

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cadence_count_0 pnpm start --clear
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cadence_count_3 pnpm start --clear
```

- [ ] `count_0`: mở `us0701-focus-1`; thấy `Nghỉ ngắn · 5 phút` bằng text.
- [ ] `count_3`: mở `us0701-focus-3`; vẫn thấy `Nghỉ ngắn · 5 phút`, không Long.
- [ ] Không hiển thị raw `0/4`, `3/4` hoặc một cadence counter cho user.
- [ ] Reward/Pet/tiến trình đã commit hiển thị trước hoặc độc lập với recommendation loading.
- [ ] CTA `Bắt đầu nghỉ 5 phút` chỉ có trong fixture review; tap hiện xác nhận review và không route,
  không tạo Break, không đổi cadence.
- [ ] `Về Home` luôn dùng được; mở lại exact Result cho cùng recommendation hiện tại.

## 3. Long due — count 4 và sticky 5+

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cadence_count_4 pnpm start --clear
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cadence_due_sticky pnpm start --clear
```

- [ ] `count_4`: mở `us0701-focus-4`; thấy `Nghỉ dài · 15 phút`.
- [ ] `due_sticky`: mở `us0701-focus-5`; vẫn Long `15`, không clamp/reset thành Short.
- [ ] Home → exact Result → background/foreground cho cùng durable result; Long vẫn due.
- [ ] Tắt/mở app rồi mở exact Result; recommendation derive lại, không dùng in-memory/prototype state.
- [ ] Tap CTA review nhanh/lặp lại không insert Short/Long Break và không navigation loop.

## 4. Completed/cancelled Long reset rules

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cadence_completed_long_reset pnpm start --clear
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cadence_cancelled_long_no_reset pnpm start --clear
```

- [ ] `completed_long_reset`: mở `us0701-focus-4`; recommendation trở lại Short `5`.
- [ ] `cancelled_long_no_reset`: mở `us0701-focus-4`; recommendation vẫn Long `15`.
- [ ] Short Break, trial, failed/cancelled/running Focus không được fixture/query tính vào cadence.
- [ ] Equal terminal timestamp được kiểm chứng tự động: Focus chỉ count khi `resolvedAt >` marker;
  không cố kết luận ranh giới millisecond bằng thao tác tay.

## 5. Failure, Retry và exact identity

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_cadence_read_failure_once pnpm start --clear
```

- [ ] Mở `us0701-focus-4`; lần đọc đầu hiện `Chưa đọc được nhịp nghỉ đã lưu.`.
- [ ] Reward/Pet/Home vẫn hiện và usable; UI không fallback thành Short hoặc bật Start giả.
- [ ] Bấm `Thử đọc lại`; production query trả Long `15` và không replay reward/Pet feedback.
- [ ] Rapid Retry/background/Home không làm recommendation của session cũ xuất hiện trên Result khác.
- [ ] URL blank/malformed/foreign/missing không fallback sang latest Result/session.

## 6. Offline, lifecycle và no-write evidence

- [ ] Airplane mode: exact Result và recommendation vẫn hoạt động từ SQLite local.
- [ ] Background/foreground/relaunch trước khi tap CTA review không tạo Break.
- [ ] Session/reward/profile fingerprint sau open/retry/Home/relaunch giống trước thao tác đọc.
- [ ] Notification permission allowed/denied/stale/repeated tap là `NOT_APPLICABLE` cho mutation của
  US-07-01; không case nào được tạo Break hoặc đổi cadence.
- [ ] Cancel/completion race là `NOT_APPLICABLE` trước Break lifecycle; chỉ committed history đã lưu
  ảnh hưởng recommendation.
- [ ] Provider/network failure không ảnh hưởng local Result/cadence.

## 7. Accessibility và responsive checks

- [ ] VoiceOver iOS/TalkBack Android đọc rõ `Nghỉ ngắn · 5 phút` hoặc `Nghỉ dài · 15 phút`.
- [ ] Loading được announce lịch sự một lần; không lặp theo render/timer.
- [ ] Error, `Thử đọc lại`, CTA review state và `Về Home` có label/role/state đúng.
- [ ] Largest text không cắt type/duration, reward hoặc action; có thể scroll tới mọi CTA.
- [ ] Reduce Motion/grayscale/missing Pet animation không làm mất ý nghĩa recommendation.
- [ ] Touch target giữ minimum platform-equivalent trên iOS và Android.

## 8. Cleanup và evidence classification

Trong fixture, dùng flow **Reset dữ liệu test** đã xác nhận để xóa dữ liệu trong disposable database
nếu cần; dừng Metro ngay sau reset để fixture không seed lại. Sau đó:

```sh
unset EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] Normal app mở lại với normal data/session/XP/Coin ban đầu, không active Break.
- [ ] Chỉ database có prefix exact `pixeldoro-us-07-01-` được coi là disposable fixture.
- [ ] Automated report, owner quick smoke và formal tester report lưu tách biệt.
- [ ] Case chưa chạy ghi `NOT_RUN` hoặc `DEFERRED`, không ghi PASS từ validator/simulator khác.

## 9. Evidence record

| Platform/device/OS | Fixture | Scenario | Result | Artifact/notes |
|---|---|---|---|---|
| `Owner report; metadata not recorded` | `Quick UI smoke` | App stability + expected US-07-01 behavior | `PASS` | 2026-09-09: no crash, works as expected. Không thay formal/structured matrix. |
| `<fill>` | `<fill>` | Short count 0/3 | `NOT_RUN` | `<fill>` |
| `<fill>` | `<fill>` | Long count 4/sticky | `NOT_RUN` | `<fill>` |
| `<fill>` | `<fill>` | Completed/cancelled Long | `NOT_RUN` | `<fill>` |
| `<fill>` | `<fill>` | Failure/Retry/no-write | `NOT_RUN` | `<fill>` |
| `<fill>` | `<fill>` | Accessibility/offline/relaunch | `NOT_RUN` | `<fill>` |

US-07-02 planning được mở từ automated PASS, exact committed SHA và owner quick UI acceptance. Coding
US-07-02 vẫn chờ owner duyệt plan/confirmations; formal status tiếp tục được ghi trung thực.
