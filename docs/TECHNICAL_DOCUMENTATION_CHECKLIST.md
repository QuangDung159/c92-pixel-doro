# PixelDoro — Technical Documentation Checklist

Checklist này dùng để quản lý tám tài liệu kỹ thuật bắt buộc trước khi bắt đầu phát triển Mobile MVP.

**Project model:** Indie solo project; Dũng Lư là người duy nhất thực hiện và chịu trách nhiệm review/phê duyệt.

**Project roles:** Dũng Lư — Tech Lead, Product Owner và Lead Mobile Developer.

**Documentation preparation status:** `DONE` — Dũng Lư phê duyệt ngày 2026-08-27; bộ tài liệu hiện là baseline để bắt đầu implementation Mobile MVP.

**Latest consistency audit:** `PASS` — 2026-09-03 sau khi EPIC-01–05 hoàn tất; normative technical
documents vẫn approved, các implementation/deferred gates được giữ ở planning/evidence owner.

## Quy ước trạng thái

- [ ] Chưa bắt đầu
- [/] Đang thực hiện
- [x] Hoàn thành và đã review
- `[BLOCKED]` Đang bị chặn; ghi rõ nguyên nhân trong phần ghi chú

## Tiêu chí hoàn thành chung

Một tài liệu chỉ được đánh dấu hoàn thành khi đáp ứng tất cả điều kiện sau:

- [x] Đã tạo đúng file và đặt trong thư mục quy định.
- [x] Nội dung phản ánh đúng phạm vi Mobile MVP hiện tại.
- [x] Không còn quyết định quan trọng ở trạng thái mơ hồ hoặc `TBD` mà không có owner.
- [x] Có acceptance criteria hoặc quy tắc đủ rõ để triển khai và kiểm thử.
- [x] Các thuật ngữ, enum và tên trạng thái nhất quán với những tài liệu còn lại.
- [x] Với indie solo project: owner đã self-review có ghi nhận ngày, hoàn tất consistency audit giữa các tài liệu và tự phê duyệt trong vai trò Tech Lead/Product Owner. Nếu có contributor/reviewer khác tham gia sau này, peer review được khuyến nghị nhưng không phải điều kiện hồi tố của baseline hiện tại.
- [x] Các quyết định kỹ thuật quan trọng đã được ghi lại bằng ADR nếu cần.

## Tổng quan tiến độ

| # | Tài liệu | Đường dẫn | Owner | Trạng thái | Reviewer | Ngày hoàn thành |
|---:|---|---|---|---|---|---|
| 1 | Technical Overview | [`architecture/technical-overview.md`](architecture/technical-overview.md) | Dũng Lư | Hoàn thành | Dũng Lư — Tech Lead | 2026-08-26 |
| 2 | System Architecture | [`architecture/system-architecture.md`](architecture/system-architecture.md) | Dũng Lư | Hoàn thành | Dũng Lư — Tech Lead | 2026-08-26 |
| 3 | Project Structure | [`architecture/project-structure.md`](architecture/project-structure.md) | Dũng Lư | Hoàn thành | Dũng Lư — Tech Lead | 2026-08-26 |
| 4 | Timer Engine Specification | [`specifications/timer-engine.md`](specifications/timer-engine.md) | Dũng Lư | Hoàn thành | Dũng Lư — Tech Lead | 2026-08-26 |
| 5 | Session Lifecycle | [`specifications/session-lifecycle.md`](specifications/session-lifecycle.md) | Dũng Lư | Hoàn thành | Dũng Lư — Tech Lead | 2026-08-26 |
| 6 | Pet State Machine | [`specifications/pet-state-machine.md`](specifications/pet-state-machine.md) | Dũng Lư | Hoàn thành | Dũng Lư — Tech Lead | 2026-08-26 |
| 7 | Gamification Rules | [`specifications/gamification-rules.md`](specifications/gamification-rules.md) | Dũng Lư | Hoàn thành | Dũng Lư — Tech Lead | 2026-08-26 |
| 8 | Data Model | [`architecture/data-model.md`](architecture/data-model.md) | Dũng Lư | Hoàn thành | Dũng Lư — Tech Lead | 2026-08-27 |

---

## 1. Technical Overview

**File:** [`architecture/technical-overview.md`](architecture/technical-overview.md)

- [x] Xác định nền tảng MVP: iOS và Android.
- [x] Chốt React Native, TypeScript và Expo Development Build.
- [x] Chốt navigation, state management, database và animation stack.
- [x] Xác định rõ phạm vi có và không có trong MVP.
- [x] Ghi các nguyên tắc offline-first và privacy-first.
- [x] Liệt kê các ràng buộc kỹ thuật quan trọng.
- [x] Liên kết tới các ADR liên quan.
- [x] Đã review và phê duyệt.

**Owner:** Dũng Lư  
**Reviewer:** Dũng Lư — Tech Lead  
**Trạng thái:** Hoàn thành  
**Ghi chú:** Technical Overview `1.0.0` được Tech Lead Dũng Lư phê duyệt ngày 2026-08-26; `TECH-OPEN-001` đến `TECH-OPEN-006` đã chốt và ADR-001 đến ADR-008 đều `ACCEPTED`.

## 2. System Architecture

**File:** [`architecture/system-architecture.md`](architecture/system-architecture.md)

- [x] Mô tả các layer: Presentation, Application, Domain và Infrastructure.
- [x] Xác định dependency direction giữa các layer.
- [x] Có sơ đồ data flow cho một focus session hoàn chỉnh.
- [x] Xác định ranh giới giữa shared core và mobile adapters.
- [x] Quy định UI không truy cập database trực tiếp.
- [x] Quy định domain không import React Native hoặc Expo.
- [x] Mô tả cách xử lý side effects và dependency injection.
- [x] Đã review và phê duyệt.

**Owner:** Dũng Lư  
**Reviewer:** Dũng Lư — Tech Lead  
**Trạng thái:** Hoàn thành  
**Ghi chú:** System Architecture `1.0.0` được Tech Lead Dũng Lư phê duyệt ngày 2026-08-26; `SA-OPEN-001` đến `SA-OPEN-005` đều đã chốt.

## 3. Project Structure

**File:** [`architecture/project-structure.md`](architecture/project-structure.md)

- [x] Định nghĩa cấu trúc `apps/`, `packages/` và `docs/`.
- [x] Mô tả trách nhiệm của từng thư mục/module.
- [x] Quy định import boundaries.
- [x] Quy định naming cho file, component, hook, store và service.
- [x] Quy định vị trí của test, fixture và mock.
- [x] Quy định vị trí và naming của sprite, audio và font.
- [x] Có ví dụ thêm một feature mới đúng kiến trúc.
- [x] Đã review và phê duyệt.

**Owner:** Dũng Lư  
**Reviewer:** Dũng Lư — Tech Lead  
**Trạng thái:** Hoàn thành  
**Ghi chú:** Project Structure `1.0.0` được Tech Lead Dũng Lư phê duyệt ngày 2026-08-26; `PS-OPEN-001` đến `PS-OPEN-008` đều đã chốt.

## 4. Timer Engine Specification

**File:** [`specifications/timer-engine.md`](specifications/timer-engine.md)

- [x] Định nghĩa đầy đủ timer states và events.
- [x] Có state-transition table hoặc state diagram.
- [x] Chốt cách dùng `startedAt`, `endsAt`, `pausedAt` và timestamp hiện tại.
- [x] Quy định hành vi start, pause, resume, cancel và complete.
- [x] Quy định hành vi khi app background, foreground, bị kill hoặc thiết bị restart.
- [x] Quy định cách xử lý timezone và thay đổi giờ hệ thống.
- [x] Quy định cơ chế chống complete/claim reward hai lần.
- [x] Liệt kê edge cases và acceptance criteria tương ứng.
- [x] Đã review và phê duyệt.

**Owner:** Dũng Lư — Tech Lead / Product Owner / Lead Mobile Developer
**Reviewer:** Dũng Lư — Tech Lead
**Trạng thái:** Hoàn thành
**Ghi chú:** Timer Engine `1.0.0` được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26; maintenance `1.0.1` đồng bộ Product decision references và `1.0.2` ngày 2026-08-27 đồng bộ onboarding trial Relax/no-tag semantics. `TE-OPEN-001` đến `TE-OPEN-010` đều `RESOLVED`.

## 5. Session Lifecycle

**File:** [`specifications/session-lifecycle.md`](specifications/session-lifecycle.md)

- [x] Định nghĩa `running`, `completed`, `failed` và `cancelled`.
- [x] Mô tả toàn bộ luồng Focus → Reward → Break.
- [x] Chốt hành vi Relax Mode.
- [x] Chốt hành vi Strict Mode nhẹ và ngưỡng rời app 10 giây.
- [x] Quy định kết quả khi app crash hoặc được mở lại sau `endsAt`.
- [x] Xác định điều kiện nhận XP/Coin cho từng kết quả.
- [x] Có bảng tình huống, status cuối và reward tương ứng.
- [x] Có acceptance criteria cho các luồng thành công và thất bại.
- [x] Đã review và phê duyệt.

**Owner:** Dũng Lư — Tech Lead / Product Owner / Lead Mobile Developer  
**Reviewer:** Dũng Lư — Tech Lead  
**Trạng thái:** Hoàn thành  
**Ghi chú:** Session Lifecycle `1.0.0` được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26; maintenance `1.0.1` ngày 2026-08-27 đồng bộ `DM-OPEN-006`. `SL-OPEN-001`, `SL-OPEN-002`, Product `OPEN-003`, `OPEN-004`, `OPEN-010` và Data Model `DM-OPEN-006` đều `RESOLVED`.

## 6. Pet State Machine

**File:** [`specifications/pet-state-machine.md`](specifications/pet-state-machine.md)

- [x] Định nghĩa Idle, Working, Break, Bugged và Celebrating.
- [x] Ánh xạ timer/session state sang Pet state.
- [x] Có state-transition table hoặc state diagram.
- [x] Quy định animation loop và animation chạy một lần.
- [x] Quy định priority khi nhiều animation cùng được yêu cầu.
- [x] Chốt thời gian giữ trạng thái Bugged và Celebrating.
- [x] Có fallback khi asset hoặc animation không tải được.
- [x] Có acceptance criteria cho từng Pet state.
- [x] Đã review và phê duyệt.

**Owner:** Dũng Lư — Tech Lead / Product Owner / Lead Mobile Developer
**Reviewer:** Dũng Lư — Tech Lead
**Trạng thái:** Hoàn thành
**Ghi chú:** Pet State Machine `1.0.0` được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26; `PSM-OPEN-001` đến `PSM-OPEN-004` đều `RESOLVED`.

## 7. Gamification Rules

**File:** [`specifications/gamification-rules.md`](specifications/gamification-rules.md)

- [x] Chốt công thức XP và Coin.
- [x] Chốt level thresholds và unlock conditions.
- [x] Chốt reward theo thời lượng focus.
- [x] Chốt hành vi reward cho completed, failed và cancelled session.
- [x] Quy định rounding và giới hạn reward nếu có.
- [x] Quy định cách chống claim reward nhiều lần.
- [x] Chốt danh sách vật phẩm và giá cho MVP.
- [x] Có ví dụ tính reward cho các thời lượng phổ biến.
- [x] Đã review và phê duyệt.

**Owner:** Dũng Lư — Tech Lead / Product Owner / Lead Mobile Developer
**Reviewer:** Dũng Lư — Tech Lead
**Trạng thái:** Hoàn thành
**Ghi chú:** Gamification Rules `1.0.0` được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26; maintenance `1.0.1` ngày 2026-08-27 đồng bộ `DM-OPEN-006` mà không đổi reward/economy semantics. `GR-OPEN-001`, `GR-OPEN-002`, `GR-OPEN-003`, Product `OPEN-005` và Data Model `DM-OPEN-006` đều `RESOLVED`.

## 8. Data Model

**File:** [`architecture/data-model.md`](architecture/data-model.md)

- [x] Liệt kê đầy đủ entity của MVP.
- [x] Định nghĩa field, datatype, default và nullable rules.
- [x] Định nghĩa primary key, foreign key và index.
- [x] Chốt enum values và naming thống nhất.
- [x] Bổ sung RewardTransaction hoặc cơ chế ledger tương đương.
- [x] Mô tả quan hệ giữa Pet, Session, Inventory và Reward.
- [x] Có chiến lược migration và schema versioning.
- [x] Có quy tắc xóa/reset dữ liệu người dùng.
- [x] Có ví dụ record cho các entity chính.
- [x] Đã review và phê duyệt.

**Owner:** Dũng Lư — Tech Lead / Product Owner / Lead Mobile Developer
**Reviewer:** Dũng Lư — Tech Lead
**Trạng thái:** Hoàn thành
**Ghi chú:** Data Model `1.0.0` được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-27; `DM-OPEN-001` đến `DM-OPEN-007` đều `RESOLVED`, authority sync cần thiết đã hoàn tất và implementation acceptance tiếp tục chờ test/device evidence.

## Dependency và thứ tự thực hiện

```text
1. Technical Overview
        ↓
2. System Architecture
        ↓
3. Project Structure
        ↓
4. Timer Engine ──────► 5. Session Lifecycle
        │                       │
        └──────────────┬────────┘
                       ↓
                6. Pet State Machine
                       ↓
                7. Gamification Rules
                       ↓
                   8. Data Model
```

Timer Engine và Session Lifecycle có thể được soạn song song sau khi System Architecture đã được chốt. Data Model nên được duyệt cuối cùng sau khi các trạng thái và quy tắc gameplay đã ổn định.

## Governance cho decision ngoài documentation baseline

Các decision dưới được theo dõi ngoài documentation baseline. Với indie solo project, Dũng Lư sở hữu decision theo vai trò chức năng và phải review trước milestone tương ứng:

| Decision | Owner | Review milestone | Trạng thái |
|---|---|---|---|
| Product `OPEN-001` — Pet mặc định | Dũng Lư — Product/Art | Identity Cat / Mèo Dev (`cat-dev`) và Cat Dev sprite v1 đã được duyệt; Pet selection thuộc phase sau. | `RESOLVED`; artwork approved |
| Product `OPEN-006` — Contribution graph colors | Dũng Lư — Product/Design | Trước khi khóa visual design và visual QA của contribution graph. | `OPEN` |
| Product `OPEN-009` — Pet naming | Dũng Lư — Product | Trước khi khóa onboarding UX hoặc schema/migration liên quan Pet naming. | `OPEN` |

Milestone là governance gate, không phải quyết định sản phẩm. Implementation không được tự chọn giá trị trước khi Dũng cập nhật Product Core và tài liệu phụ thuộc nếu cần.

## Review cuối bộ tài liệu

- [x] Tám tài liệu đều đã hoàn thành.
- [x] Không có enum hoặc thuật ngữ mâu thuẫn giữa các tài liệu.
- [x] Timer states, session statuses và Pet states được ánh xạ đầy đủ.
- [x] Data Model lưu được toàn bộ trạng thái và quy tắc đã mô tả.
- [x] Gamification không thể cộng reward hai lần.
- [x] Mọi edge case quan trọng đều có acceptance criteria.
- [x] Các decision `OPEN`/`DEFERRED` ngoài documentation baseline có owner và review milestone; không bị chốt ngầm.
- [x] Tech Lead/Owner đã phê duyệt bộ tài liệu, đóng giai đoạn chuẩn bị tài liệu và cho phép bắt đầu implementation.

**Ngày bắt đầu:** —

**Ngày phê duyệt:** 2026-08-27

**Tech lead:** Dũng Lư

**Ghi chú chung:** `DONE` cho giai đoạn chuẩn bị tài liệu của indie solo project. Cả tám tài liệu kỹ thuật bắt buộc đã được self-review và phê duyệt; consistency audit về enum, state mapping, durable truth, reward idempotency và edge-case acceptance đã hoàn tất, gần nhất ngày 2026-09-03 sau closure EPIC-01–05. Product `OPEN-001` đã `RESOLVED` ngày 2026-08-31 với Cat / Mèo Dev (`cat-dev`) và Cat Dev sprite v1 đã được Product/Art duyệt; `OPEN-006` và `OPEN-009` vẫn có owner/review milestone và không chặn implementation ngoài phần chức năng trực tiếp phụ thuộc. Implementation acceptance tiếp tục cần code/test/device evidence; documentation approval không tự đánh dấu các acceptance checkbox trong specification.
