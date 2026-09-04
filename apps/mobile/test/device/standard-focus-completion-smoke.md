# US-06-04 — Test nhanh completion / reward / Result

Status: NOT_RUN — chờ owner test UI trên candidate. Formal tester: `DEFERRED_TO_LATER_PHASE`.
Ghi `<implementation-sha>` (hoặc HEAD + uncommitted diff), iPhone/OS, development build, fixture,
ảnh/video và PASS/FAIL/BLOCKED/NOT_RUN cho từng bước. Checklist validator không phải device test.

## 1. Chạy phiên nhanh

Dừng Metro hiện tại bằng Ctrl+C, chạy từ repository root:

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node --version
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_fast_clock pnpm start --clear
```

Nhấn `i` để mở Development Build hiện có. Không cần prebuild/cài lại app.
Hoàn thành Trial và vào Pet Room/Home nếu chưa onboarding. Giữ dữ liệu hiện có, ghi lại XP/Coin
ban đầu; chỉ dùng **Reset dữ liệu test** và xác nhận trong Development Build khi chấp nhận xóa dữ
liệu test. Reset không bắt buộc cho mỗi phiên.

- [ ] Home → tạo **15 phút / Relax / Học tập** → Start vào countdown ngay, không về Result Trial 5 phút.
- [ ] Clock x30: 15 phút mất khoảng **30 giây thật**. Dữ liệu vẫn lưu duration=15, không phải phiên giả ngắn.
- [ ] Hết giờ tự mở completed Result: **+15 XP / +3 Coin**, cấp tự động; không Claim/Break/Focus Again.
- [ ] Pet Celebrate chỉ chạy một lần cho completion mới; không cần chờ animation mới bấm Về Home.
- [ ] Tiến trình hiện tại tăng đúng 15/3. Nếu baseline sau Trial là 5/1 thì thành **20 XP / 4 Coin**.
- [ ] Bấm dev **Đọc lại kết quả đã lưu** vài lần: cùng session ID/thưởng/tổng; không Celebrate lại.
- [ ] **Về Home**, tổng đúng; tạo phiên mới ngay, không bị outcome cũ kéo sang Result.
- [ ] Lặp với 25 phút (khoảng 50 giây): +25/+5; 120 phút (khoảng 4 phút): +120/+24.

## 2. Strict và Cancel regression

- [ ] Với fixture x30, tạo Strict và giữ foreground đến deadline: completed, +15/+3.
- [ ] Tạo Strict khác, rời app khoảng 1 giây thật rồi trở lại trước deadline: vượt grace tăng tốc,
  failed, 0/0, Home-only; Bugged tối đa một lần. **Grace x30 chỉ khoảng 0,33 giây thật**.
- [ ] Test under-grace dùng clock thường (unset fixture, restart Metro), rời app dưới 10 giây.
- [ ] Relax/Strict trước cutoff: Dừng → đóng popup vẫn chạy; Dừng → xác nhận vào cancelled Result,
  0/0, Home-only, không crash `disposed` và không cộng thưởng.
- [ ] Deadline đúng bằng thời điểm vi phạm: failed thắng; deadline trước vi phạm: completed.
  Ranh giới millisecond được kiểm tra tự động bằng controlled clock/SQLite, không kết luận từ thao tác tay.

## 3. Failure + Retry

Mỗi lần chỉ chạy **một** lệnh dưới đây sau khi dừng Metro. Mỗi fixture x30, lỗi một lần trong runtime;
không reload app trước khi bấm Retry, vì reload sẽ tạo lại one-shot fixture.

```sh
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_receipt_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_profile_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_result_read_failure_once pnpm start --clear
```

- [ ] Receipt/profile failure: tạo 15/Relax, hết giờ vào Recovery, không báo completed giả.
  Bấm Retry: atomic grant thành công một lần → Result +15/+3 → Home tăng đúng một lần.
  Trước Retry, automated SQLite evidence xác nhận session running, receipt absent, profile chưa tăng.
- [ ] Result-read failure: grant đã commit nhưng Result báo chưa đọc được; bấm **Thử lại** tại Result.
  Chỉ đọc lại exact ID, không grant thêm. Thưởng/tổng đúng sau Retry, không giả reward từ prototype.
- [ ] Đọc lại Result không phải hành động Retry grant và không thay dữ liệu.

## 4. Relaunch — Option A đã duyệt

- [ ] Sau completed Result, ghi ID/tổng rồi tắt mở lại app: **Home**, tổng giữ nguyên, không thưởng/animation lại.
- [ ] Để test startup completion từ overdue running, dùng **clock thường**: tạo 15/Relax,
  tắt app trước deadline và mở lại sau deadline thật → startup vừa commit → exact completed Result.
- [ ] Strict thiếu background evidence không bị tự suy đoán failed; evidence có thật áp dụng precedence.
- [ ] Nếu process chết sau commit trước Result: startup không có runtime handoff → Home đúng tổng.
  Không có cam kết tự mở lại Result chưa xem, không có durable viewed marker trong Option A.
- [ ] Exact-ID reopen đọc cùng facts, không replay. Dev reload trên Result là entry read-only có sẵn;
  không có lịch sử/deep-link notification mới trong US-06-04.

Không dùng kill/reload để đánh giá clock x30: anchor tăng tốc nằm trong runtime, không tồn tại qua
process kill. Kết thúc phiên trước khi đổi fixture; phiên đang chạy với timestamp tăng tốc có thể ở
tương lai so với clock thường. Nếu cần reset chỉ thực hiện qua confirmation trên dữ liệu test.

## 5. Accessibility / cleanup

- [ ] Offline vẫn complete; Reduce Motion vẫn có thông tin chữ/thưởng, không phụ thuộc animation.
- [ ] Screen reader đọc reward/tổng/CTA rõ; chữ lớn không che nút Về Home, Retry hoặc Cancel.
- [ ] Chạy lại Trial 5/1 nếu test reset; Standard không phát onboarding analytics.

```sh
unset EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE
pnpm start --clear
```

US-06-04 chưa được coi owner-accepted và chưa mở US-06-05 cho tới khi owner xác nhận quick UI.
