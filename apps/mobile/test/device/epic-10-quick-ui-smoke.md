# EPIC-10 Settings & Data Control — quick UI smoke

Status: `NOT_RUN`
Implementation SHA: `<implementation-sha>` (worktree chưa commit thì ghi `UNCOMMITTED@<baseline-sha>`)
Allowed case results: `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`.

Guide này dùng database disposable `pixeldoro-us-10-epic-10-quick.db`. Không mở, thay đổi, reset
hoặc xóa database thường `pixeldoro.db`.

## 1. Setup

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node --version
pnpm --version
git rev-parse HEAD
EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE=epic_10_quick pnpm start --clear
```

Mở Development Build hiện có. Nếu database mới đi qua First Use, hoàn tất Trial một lần rồi mở tab
`Cài đặt`. Dừng Metro trước khi đổi fixture.

## 2. Settings persistence và Focus defaults

- [ ] Settings không còn badge/copy prototype; có Focus mặc định, phản hồi, thông báo, analytics và
  vùng xóa dữ liệu.
- [ ] Chọn `50 phút` và `Strict`; phần chữ của từng hàng giảm opacity ngắn khi lưu, không đổi chiều
  cao hoặc nháy label, rồi trở lại bình thường.
- [ ] Tắt/bật `Âm thanh` và `Rung phản hồi`; hàng còn lại không bị đổi theo.
- [ ] Rời tab rồi quay lại: các giá trị vẫn đúng.
- [ ] Mở một Focus Setup mới: mặc định là `50 phút / Strict / Lập trình`; phiên đang chạy không đổi.
- [ ] Force-close/relaunch với Airplane mode: Settings và Focus Setup vẫn giữ giá trị đã commit.

## 3. Notification, privacy và sensory feedback

- [ ] Bật `Nhắc kết thúc phiên` khi OS chưa hỏi: chỉ một permission prompt xuất hiện sau thao tác này.
- [ ] Chọn Deny: switch app vẫn On, UI nói OS đang chặn và `Mở Cài đặt hệ thống` hoạt động; Timer,
  Session và Reward không bị block.
- [ ] Background→foreground sau khi đổi quyền trong OS: trạng thái quyền được đọc lại, không tự prompt.
- [ ] Tắt `Anonymous analytics`: UI giữ Off; nếu cleanup lỗi thì nêu rõ analytics đã tắt và có `Thử lại`.
- [ ] Bật lại analytics: không có hành vi backfill hoặc lỗi UI; tắt lại trước bước reset để kiểm privacy.
- [ ] Bật sound+haptic, bắt đầu Focus: có một haptic nhẹ; Back/reopen không replay.

Để kiểm completion chime nhanh, dừng Metro và chạy fixture kết hợp:

```sh
EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE=epic_10_quick \
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_fast_clock \
pnpm start --clear
```

- [ ] Fresh completion phát đúng một chime ngắn và một success haptic.
- [ ] Reopen Result/relaunch không replay; tắt riêng sound hoặc haptic thì chỉ channel tương ứng im.
- [ ] Silent mode/haptic unavailable không crash và toàn bộ ý nghĩa vẫn có bằng text/visual.

## 4. Confirmed full reset

- [ ] Tạo ít nhất một Focus result và thay Settings; mở `Xóa toàn bộ dữ liệu local`.
- [ ] Chọn `Giữ dữ liệu`: modal đóng và mọi dữ liệu còn nguyên.
- [ ] Mở lại, chọn `Xóa toàn bộ dữ liệu`: nút busy, không double-submit/back-dismiss trong lúc chạy.
- [ ] Chỉ sau commit/rebootstrap app mới về First Use; defaults trở lại `25 / Relax`, bốn toggle On,
  history/XP/Coin/items/events cũ không xuất hiện lại.
- [ ] Force-close/relaunch khi Airplane mode vẫn ở First Use và không có stale notification/route.

## 5. Accessibility và cleanup

- [ ] Largest system text: mọi label/value/status/CTA/modal vẫn đọc được và scroll tới được.
- [ ] VoiceOver/TalkBack đọc đúng switch checked/disabled/busy, radiogroup, Retry và reset warning.
- [ ] Reduce Motion không làm mất trạng thái; sound/haptic setting độc lập với Reduce Motion.

```sh
unset EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] Xác nhận launch thường dùng `pixeldoro.db`; chỉ xóa đúng disposable fixture bằng flow reset đã
  xác nhận nếu cần. Không xóa file database bằng glob.
- [ ] Không suy diễn manual PASS từ automated tests, typecheck, lint hoặc JS export.

| Date/time/timezone | Platform/device/OS/build | Network/permission/silent/a11y | Result | SHA/artifact/notes |
|---|---|---|---|---|
| `<fill>` | `<fill>` | `<fill>` | `NOT_RUN` | `<implementation-sha>` |
