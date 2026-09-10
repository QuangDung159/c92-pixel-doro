# US-07-02 — Durable Start Break quick smoke

Status: `OWNER_QUICK_UI_SMOKE_REPORTED`.
Owner quick UI: `PASS` — owner confirmed 2026-09-09: no crash, works as expected.
Formal tester: `NOT_RUN`; không suy diễn từ automated evidence.

Phạm vi xác nhận hiện có là quick smoke tổng quát; platform/device/OS, từng fixture case và
accessibility/offline/relaunch matrix chưa được cung cấp nên các checkbox/evidence row chi tiết bên
dưới vẫn giữ `NOT_RUN`.

Ghi `<implementation-sha>`, app/build profile, fixture/database, platform, device/simulator, OS,
ngày/giờ/timezone, online/offline, text size, Reduce Motion, VoiceOver/TalkBack và
`PASS/FAIL/BLOCKED/NOT_RUN` cho từng case.

## 1. Preconditions và isolation

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node --version
```

Fixtures dùng database disposable prefix `pixeldoro-us-07-02-`; không seed/xóa normal
`pixeldoro.db`. Mở exact Result bằng URL đã quote:

```sh
xcrun simctl openurl booted 'pixeldoro://focus/result?sessionId=us0702-focus-1'
xcrun simctl openurl booted 'pixeldoro://focus/result?sessionId=us0702-focus-4'
```

Android dùng cùng URL qua `adb shell am start -W -a android.intent.action.VIEW -d '<url>'`.

## 2. Short durable Start

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_start_short pnpm start --clear
```

- [ ] Mở `us0702-focus-1`; thấy `Nghỉ ngắn · 5 phút` và primary `Bắt đầu nghỉ 5 phút`.
- [ ] `Về Home` không tạo Break và cadence không đổi.
- [ ] Tap Start: CTA busy, sau commit mở exact `/break/session?sessionId=<break-id>`.
- [ ] Running shell ghi `Nghỉ ngắn · 5 phút`; Pet có semantic state `breaking`.
- [ ] Row là `short_break/5/running`, null mode/tag/background/reward và XP/Coin `0`.
- [ ] Rapid double tap tạo đúng một active Break và một route handoff.

## 3. Long durable Start

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_start_long_due pnpm start --clear
```

- [ ] Mở `us0702-focus-4`; thấy `Nghỉ dài · 15 phút`.
- [ ] Tap Start tạo đúng một `long_break/15/running`, rồi Pet Breaking.
- [ ] Không reward receipt/profile delta/notification/analytics event mới.
- [ ] Screen không có fake/static countdown; timestamp countdown thuộc US-07-03.

## 4. Failure và active conflict

```sh
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_start_write_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_start_active_conflict pnpm start --clear
```

- [ ] Write failure lần đầu giữ Result, không row/Pet transition/navigation; Retry commit một lần.
- [ ] Active conflict không thay/cancel active Focus và không tạo Break.
- [ ] Error copy không lộ SQLite/query/transaction/fixture; Home vẫn usable.
- [ ] Post-commit read/Pet recovery chỉ retry read/Pet, không gọi Start lần hai.

## 5. Cadence race, exact identity và lifecycle boundary

`break_start_preview_changes` cung cấp isolated due history để review committed-type handoff; race
preview→tap được chứng minh bằng automated transaction integration vì không nên có manual DB mutation.

- [ ] Actual screen type/duration lấy từ committed record, không từ URL/preview payload.
- [ ] Blank/array/missing/Focus/terminal ID không fallback sang active/latest/prototype session.
- [ ] Reload exact running ID đọc cùng durable record; không tạo duplicate.
- [ ] Kill sau commit không làm row mất. Full cold-start arbitration/resume là `NOT_RUN` tới US-07-03.
- [ ] Cancel/completion race là `NOT_RUN` tới US-07-04.
- [ ] Notification allowed/denied/stale/repeated tap là `NOT_RUN` tới US-07-05.

## 6. Offline và accessibility

- [ ] Airplane mode: Start vẫn commit local và mở exact Break.
- [ ] Provider/network failure không block Start.
- [ ] VoiceOver/TalkBack đọc type, duration, busy/error và Pet Breaking bằng text.
- [ ] Largest text không cắt action/meaning; mọi action reachable bằng scroll.
- [ ] Reduce Motion/grayscale/missing sprite không đổi nghĩa committed Break.
- [ ] Touch target đạt platform-equivalent 44×44pt/48dp.

## 7. Cleanup và evidence

Dùng confirmed **Reset dữ liệu test** trong disposable fixture database nếu cần, dừng Metro rồi:

```sh
unset EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] Normal app mở lại normal data, không bị fixture ghi đè.
- [ ] Automated, owner quick smoke và formal tester được ghi tách biệt.
- [ ] Case chưa chạy giữ `NOT_RUN`/`DEFERRED`; không suy diễn từ platform khác.

| Platform/device/OS | Fixture | Scenario | Result | Artifact/notes |
|---|---|---|---|---|
| `Owner report; metadata not recorded` | `Quick UI smoke` | App stability + expected US-07-02 behavior | `PASS` | 2026-09-09: no crash, works as expected. Không thay formal/structured matrix. |
| `<fill>` | `break_start_short` | Short/explicit/double tap | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_start_long_due` | Long/committed handoff | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_start_write_failure_once` | Rollback/Retry | `NOT_RUN` | `<fill>` |
| `<fill>` | `break_start_active_conflict` | Preserve active | `NOT_RUN` | `<fill>` |
| `<fill>` | `<fill>` | Offline/accessibility/exact ID | `NOT_RUN` | `<fill>` |

US-07-03 đã được triển khai thành worktree candidate sau khi owner duyệt toàn bộ Option A; automated
gates PASS còn owner quick UI/formal status của Story 03 tiếp tục được ghi riêng và trung thực.
