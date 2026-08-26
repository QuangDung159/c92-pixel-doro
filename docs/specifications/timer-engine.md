---
document_id: PIXELDORO_TIMER_ENGINE_SPECIFICATION
title: PixelDoro Mobile MVP — Timer Engine Specification
version: 1.0.1
status: APPROVED
last_updated: 2026-08-26
owner: Dũng Lư
owner_roles:
  - Tech Lead
  - Product Owner
  - Lead Mobile Developer
reviewer: Dũng Lư
reviewer_role: Tech Lead
reviewed_at: 2026-08-26
approved_by: Dũng Lư
approver_role: Tech Lead / Product Owner
approved_at: 2026-08-26
language: vi
scope:
  - mobile_mvp
  - timer_engine
authority: TERTIARY
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
---

# PixelDoro Mobile MVP — Timer Engine Specification

## 0. Vai trò và phạm vi tài liệu

Tài liệu này đặc tả cơ chế đo thời gian và resolve timer cho Focus/Break session, gồm:

- Timer states và events.
- State-transition table và diagram.
- Semantics của `startedAt`, `endsAt`, `pausedAt` và timestamp hiện tại.
- Start, pause, resume, cancel và complete.
- Background, foreground, app bị kill, relaunch và device restart.
- Timezone và thay đổi giờ hệ thống.
- Concurrency, idempotency và chống complete/claim reward hai lần.
- Edge cases cùng acceptance criteria.

Tài liệu này không quyết định lại:

- Product behavior ngoài timer semantics. Product Core 1.10.0 đã chốt Long Break cadence (`OPEN-003`) và Break không auto-start (`OPEN-010`); flow chi tiết thuộc `session-lifecycle.md`. Pause Focus/Break đã được chốt không hỗ trợ trong Mobile MVP.
- Trạng thái cuối, Focus → Reward → Break và reward eligibility chi tiết của `session-lifecycle.md`.
- Công thức XP/Coin của `gamification-rules.md`.
- Schema, datatype, constraint và migration cụ thể của `data-model.md`.
- Pet state/animation của `pet-state-machine.md`.

Nếu có mâu thuẫn, Product Core được ưu tiên về sản phẩm. Technical Overview 1.0.0, System Architecture 1.0.0, Project Structure 1.0.0 và ADR đã duyệt là baseline kỹ thuật đã khóa.

### 0.1. Trạng thái quyết định

| Trạng thái | Ý nghĩa |
|---|---|
| `LOCKED` | Đã được Product Core khóa; implementation phải tuân theo. |
| `BASELINE` | Đã được Technical Overview, System Architecture, Project Structure hoặc ADR chấp nhận; tài liệu này chỉ chi tiết hóa. |
| `PROPOSED` | Đề xuất trong draft; chưa thành requirement cho tới khi Tech Lead xác nhận. |
| `RESOLVED` | Quyết định Timer Engine đã được Dũng Lư — Tech Lead chốt trong tài liệu này. |
| `OPEN` | Chưa quyết định; không được tự suy diễn khi triển khai hoặc viết test. |
| `DEFERRED` | Không thuộc Mobile MVP. |

Baseline `1.0.0` đã được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26; maintenance `1.0.1` được phê duyệt cùng ngày để đồng bộ Product decision references mà không đổi timer semantics. `TE-OPEN-001` đến `TE-OPEN-010` đều `RESOLVED`; đây là baseline Timer Engine cho Mobile MVP và các tài liệu phụ thuộc.

### 0.2. Authority và nguồn tham chiếu

| Tài liệu | Phiên bản/trạng thái | Vai trò |
|---|---|---|
| `PIXELDORO_CORE_TRUTH.md` | 1.10.0 `ACTIVE` | Nguồn sự thật sản phẩm ưu tiên cao nhất. |
| `TECHNICAL_DOCUMENTATION_CHECKLIST.md` | Hiện hành | Phạm vi và tiêu chí hoàn thành Timer Engine. |
| `architecture/technical-overview.md` | 1.0.0 `APPROVED` | Stack, timer consistency, offline-first và source-of-truth baseline. |
| `architecture/system-architecture.md` | 1.0.0 `APPROVED` | Layer, transaction, command serialization và side-effect ordering. |
| `architecture/project-structure.md` | 1.0.0 `APPROVED` | Package/module/import/test boundaries. |
| ADR-001 đến ADR-008 | `ACCEPTED` hoặc `ACCEPTED_WITH_GATE` | Các quyết định kiến trúc liên quan. |

## 1. Nguyên tắc và invariant nền tảng

Các nguyên tắc sau kế thừa trực tiếp từ Product Core và baseline đã duyệt:

1. Timer truth dựa trên timestamp đã persist, không dựa vào số lần JavaScript interval tick.
2. SQLite là durable source of truth; Zustand và countdown UI chỉ là projection có thể dựng lại.
3. Notification không phải clock, không phải bằng chứng completion và không quyết định reward eligibility.
4. App start/foreground phải reconcile active session trước khi hiển thị final truth.
5. Relax Mode không fail khi app background; Strict Mode Lite dùng grace period 10 giây.
6. `completed`, `failed` và `cancelled` là terminal.
7. Terminal transition và Focus reward grant phải idempotent và commit atomically.
8. Domain nhận `now` dưới dạng input value; không tự đọc clock hoặc platform API.
9. Focus và Break không hỗ trợ pause trong Mobile MVP.
10. Side-effect failure không được rollback hoặc thay đổi session/reward truth đã commit.

Active session là session có status `running`. Database phải có constraint hoặc cơ chế tương đương để bảo vệ invariant không có nhiều active Focus/Break session trái rule. Schema cụ thể thuộc `data-model.md`.

## 2. Timer state model

### 2.1. Session status là durable truth — `LOCKED`

Session có đúng bốn status đã được Product Core khóa:

| Status | Ý nghĩa |
|---|---|
| `running` | Session đã bắt đầu và chưa có kết quả cuối. |
| `completed` | Session đã hoàn thành đủ thời gian theo rule. |
| `failed` | Focus session đã vi phạm Strict Mode Lite. |
| `cancelled` | Người dùng chủ động kết thúc trước thời hạn. |

`completed`, `failed` và `cancelled` là terminal. Không status terminal nào được transition trở lại `running`.

### 2.2. Operational state không tạo durable truth thứ hai — `TE-OPEN-003` (`RESOLVED`)

Quyết định được Dũng Lư — Tech Lead chốt ngày 2026-08-26: Timer Engine không persist một enum timer state độc lập. Engine chỉ derive operational state từ session record đã persist, timestamp hiện tại và command đang chạy:

| Operational state | Điều kiện | Có persist không? |
|---|---|---|
| `idle` | Không có active session. | Không. |
| `running` | Session có status `running` và chưa đến điều kiện resolve terminal. | Session status được persist; operational state được derive. |
| `resolution_due` | Session vẫn persist là `running`, nhưng timestamp cho thấy phải reconcile thành terminal. | Không; đây là trạng thái chuyển tiếp trước transaction. |
| `resolving` | Application đang chạy một session-mutating command/reconciliation. | Không; chỉ là command/projection state. |
| `terminal` | Session đã persist `completed`, `failed` hoặc `cancelled`. | Durable truth nằm ở session status. |
| `paused` | Không thuộc Mobile MVP vì Focus và Break đều không hỗ trợ pause. | Không persist hoặc implement. |

`resolution_due` và `resolving` không được hiển thị hoặc lưu như kết quả sản phẩm. Chúng chỉ giúp mô tả engine và ngăn UI tự coi countdown bằng `0` là bằng chứng completion.

### 2.3. Display tick — `RESOLVED`

- Presentation có thể tick khoảng một lần mỗi giây khi countdown đang nhìn thấy.
- Tick không mutate SQLite, không đi qua `SessionCommandCoordinator` và không tự grant reward.
- Khi tick thấy `now >= endsAt`, Presentation/Application có thể request reconciliation; chỉ durable transaction mới quyết định terminal status.
- Tick được dừng khi screen unmount hoặc app background để tiết kiệm pin.
- Khi foreground, UI không cộng số tick đã bỏ lỡ mà re-anchor từ persisted timestamp + `now` mới.
- Monotonic clock chỉ có thể hỗ trợ countdown foreground mượt hơn; device wall clock vẫn là durable time authority đã chốt.

## 3. Timestamp semantics — `TE-OPEN-004` (`RESOLVED`)

### 3.1. Field semantics

| Field/fact | Semantics | Trạng thái |
|---|---|---|
| `startedAt` | Timestamp tuyệt đối khi Start command hợp lệ được capture tại application boundary. Bất biến sau khi session được tạo. | `RESOLVED`. |
| `endsAt` | Deadline tuyệt đối của session: `startedAt + configuredDuration` vì MVP không pause. | `RESOLVED`. |
| `pausedAt` | Không áp dụng cho Mobile MVP vì Focus và Break đều không hỗ trợ pause. | `RESOLVED`; không phải schema requirement. |
| `backgroundedAt` | Timestamp lifecycle event gần nhất cần dùng để đánh giá Strict Mode Lite; được clear atomically sau safe foreground reconciliation. | `RESOLVED`. |
| `resolvedAt` | Timestamp command/reconciliation persist kết quả terminal; không thay thế thời điểm deadline hoặc violation. | `LOCKED` là field tối thiểu; exact representation theo Data Model. |
| `rewardClaimedAt` | Dấu thời gian reward đã được grant atomically cho completed Focus session. | `LOCKED`; exact representation theo Data Model. |
| `now` | Timestamp được Clock port capture một lần tại boundary của command/lifecycle event rồi truyền vào Domain dưới dạng value. | `BASELINE`. |

### 3.2. Representation và phép tính — `TE-OPEN-004` (`RESOLVED`)

Quyết định được Dũng Lư — Tech Lead chốt ngày 2026-08-26:

- Persist timestamp dưới dạng Unix epoch milliseconds UTC, số nguyên.
- Dùng cùng một unit cho mọi phép so sánh Domain; không mix giây và millisecond.
- Validate timestamp là số hữu hạn, số nguyên và nằm trong range storage được Data Model chấp nhận.
- Với session không pause: `endsAt = startedAt + durationMs`.
- Remaining time dùng cho projection: `max(0, endsAt - now)`.
- Completion boundary: `now >= endsAt`.
- `now` được capture một lần cho mỗi command. Không gọi clock nhiều lần bên trong cùng Domain decision.
- Lifecycle bridge capture event timestamp trước khi enqueue vào `SessionCommandCoordinator`, đúng System Architecture 1.0.0.

Lý do: Unix epoch milliseconds đủ chính xác cho countdown theo giây, tương thích JavaScript/SQLite và không phụ thuộc timezone. Exact datatype/constraint vẫn thuộc `data-model.md`.

## 4. Events và transition model

### 4.1. Event catalog

| Event | Nguồn | Ý nghĩa | Trạng thái |
|---|---|---|---|
| `START_REQUESTED` | User/Application | Yêu cầu tạo Focus/Break session mới. | `BASELINE`. |
| `DISPLAY_TICK` | Presentation | Cập nhật countdown hiển thị; không mutate durable state. | `RESOLVED`. |
| `TIME_REACHED` | Presentation/Application | Tín hiệu nên reconcile vì `now >= endsAt`; không tự chứng minh completion. | `RESOLVED`. |
| `PAUSE_REQUESTED` | Defensive Application boundary | Không phải product action; nếu bị gọi thì reject bằng typed error `PAUSE_NOT_SUPPORTED` và không mutate. | `RESOLVED`. |
| `RESUME_REQUESTED` | Defensive Application boundary | Không phải product action; nếu bị gọi thì reject bằng typed error `RESUME_NOT_SUPPORTED` và không mutate. | `RESOLVED`. |
| `CANCEL_REQUESTED` | User | Yêu cầu chuyển active session sang `cancelled`. | `LOCKED`. |
| `APP_BACKGROUNDED` | Lifecycle bridge | App rời foreground; timestamp được capture tại boundary. | `BASELINE`. |
| `APP_FOREGROUNDED` | Lifecycle bridge | App trở lại foreground và yêu cầu reconciliation. | `BASELINE`. |
| `APP_STARTED` | Composition Root | App khởi động/relaunch và yêu cầu startup reconciliation. | `BASELINE`. |
| `RECONCILE_REQUESTED` | Application | Yêu cầu đọc durable truth và resolve bằng timestamp hiện tại. | `BASELINE`. |
| `STRICT_VIOLATION_DUE` | Domain-derived fact | `now` đã tới `backgroundedAt + 10 giây` và violation xảy ra không muộn hơn `endsAt`. | `LOCKED`. |

Các event trên là vocabulary của specification, không bắt buộc implementation phải dùng event bus hoặc state-machine framework. System Architecture đã loại event-bus/state-machine framework khỏi baseline MVP.

### 4.2. Command boundary — `BASELINE`

`StartFocus`, `StartBreak`, cancel, background, foreground và reconciliation đi qua cùng application-scoped `SessionCommandCoordinator`:

- Chỉ một session-mutating command chạy tại một thời điểm.
- Concurrent reconciliation dùng single-flight.
- Command failure phải release queue.
- Countdown/render tick không đi qua coordinator.
- SQLite transaction, persisted-state precondition và unique constraint là correctness backstop cuối cùng.

### 4.3. State diagram

```text
                              START_REQUESTED + valid input
                  ┌──────────────────────────────────────────┐
                  │                                          ▼
               [IDLE]                                  [RUNNING]
                                                           │
                             ┌─────────────────────────────┼──────────────────────────┐
                             │                             │                          │
                    CANCEL_REQUESTED                time/foreground/start       Strict absence reaches
                             │                       requests reconcile          violation boundary
                             ▼                             │                          │
                        [CANCELLED]                        ▼                          ▼
                                                   [RESOLUTION_DUE]             [RESOLUTION_DUE]
                                                          │                          │
                                                          └──────────┬───────────────┘
                                                                     ▼
                                                                [RESOLVING]
                                                                     │
                                                   ┌─────────────────┴─────────────────┐
                                                   ▼                                   ▼
                                             [COMPLETED]                           [FAILED]

PAUSE_REQUESTED / RESUME_REQUESTED:
  → không có nhánh PAUSED trong Mobile MVP; reject typed error và không mutate.

COMPLETED / FAILED / CANCELLED:
  → terminal; không transition trở lại RUNNING.
```

`RESOLUTION_DUE` và `RESOLVING` là operational state không persist. Durable terminal state chỉ có sau transaction commit.

### 4.4. State-transition table

| Durable state trước | Event/condition | Guard | Durable state sau | Durable write/reward | Trạng thái rule |
|---|---|---|---|---|---|
| Không có active session | `START_REQUESTED` | Input hợp lệ và không vi phạm active-session invariant | `running` | Persist session trước side effect | `BASELINE`. |
| `running` | `DISPLAY_TICK` | Bất kỳ | `running` | Không write | `RESOLVED`. |
| `running` | `CANCEL_REQUESTED` | Persisted status vẫn `running` | `cancelled` | Persist terminal; không reward | `LOCKED`/`BASELINE`. |
| `running` | reconcile | Strict violation đã xảy ra và `violationAt <= endsAt` | `failed` | Persist terminal; không reward | `LOCKED`. |
| `running` | reconcile | Không có Strict violation thắng precedence và `now >= endsAt` | `completed` | Persist terminal; Focus reward atomically nếu eligible | `LOCKED`/`BASELINE`. |
| `running` | reconcile | Chưa có terminal condition | `running` | Cập nhật lifecycle fact theo rule ở mục 6 khi cần | `LOCKED`/`RESOLVED`. |
| Terminal | Bất kỳ session mutation/reconcile retry | Persisted status không còn `running` | Không đổi | Không cấp reward lại | `LOCKED`/`BASELINE`. |
| `running` | `PAUSE_REQUESTED` | Pause không được hỗ trợ | Không đổi | Không write; `PAUSE_NOT_SUPPORTED` | `RESOLVED`. |
| Bất kỳ | `RESUME_REQUESTED` | Không có paused state trong MVP | Không đổi | Không write; `RESUME_NOT_SUPPORTED` | `RESOLVED`. |

## 5. Session operations

### 5.1. Start — `BASELINE`

```text
START_REQUESTED
  → SessionCommandCoordinator
  → validate duration/tag/mode/type và active-session invariant
  → capture startedAt = now
  → derive endsAt
  → transaction: persist running session
  → commit
  → refresh committed projection/navigation
  → best-effort notification schedule/ensure
  → best-effort analytics + audio/haptic
```

Quy tắc:

- Duration Focus phải nằm trong Product Core: 15–120 phút; default/step không được timer engine diễn giải lại.
- Short Break 5 phút và Long Break 15 phút theo Product Core. Product Core 1.10.0 đã chốt tự động chọn Long Break sau bốn completed Focus (`OPEN-003`) nhưng Break chỉ start sau explicit user action (`OPEN-010`); transaction boundary tiếp tục theo session lifecycle.
- Start thất bại nếu durable active-session invariant không cho phép tạo session mới.
- Notification failure hoặc permission denial không rollback session.
- UI chỉ điều hướng như session đã start sau khi transaction commit.
- Notification operation phải idempotent theo session; stable operation key được chốt ở mục 8.2.

### 5.2. Pause Focus — `TE-OPEN-001` (`RESOLVED`)

Tech Lead Dũng Lư xác nhận ngày 2026-08-26: Mobile MVP không hỗ trợ pause Focus. Product `OPEN-002` được resolve và Product Core 1.4.0 ghi quyết định ở trạng thái `MVP_DEFAULT`.

Không được:

- Thêm durable status `paused`.
- Yêu cầu field `pausedAt` trong schema.
- Dời `endsAt` vì pause hoặc reschedule notification cho pause.
- Hiển thị action Pause/Resume trong Focus UI.
- Đưa pause vào reward, Strict Mode, history hoặc recovery semantics.

Nếu defensive Application boundary nhận `PAUSE_REQUESTED`, command trả typed error `PAUSE_NOT_SUPPORTED`, không persist và không chạy side effect.

### 5.3. Pause Break — `TE-OPEN-002` (`RESOLVED`)

Tech Lead Dũng Lư xác nhận cùng quyết định ngày 2026-08-26: Mobile MVP không hỗ trợ pause Break.

Break UI không hiển thị action Pause/Resume. `PAUSE_REQUESTED` bị reject giống Focus và không làm thay đổi `endsAt`, notification hoặc durable state.

### 5.4. Resume — `RESOLVED`

Mobile MVP không có paused state nên không có Resume product action. Nếu defensive Application boundary nhận `RESUME_REQUESTED`, command trả typed error `RESUME_NOT_SUPPORTED`, không persist và không chạy side effect.

Pause/resume sau MVP chỉ được xem xét lại bằng Product decision mới; khi đó phải mở lại timestamp, notification, Strict Mode, history, recovery và Data Model semantics thay vì tái sử dụng ngầm field `pausedAt`.

### 5.5. Cancel — `BASELINE`

```text
CANCEL_REQUESTED
  → serialize qua SessionCommandCoordinator
  → transaction đọc persisted session
  → nếu status còn running: conditional transition → cancelled
  → commit
  → refresh projection/navigation
  → best-effort cancel notification + analytics/Pet feedback
```

- Cancel chỉ thắng khi transaction của nó transition persisted status từ `running`.
- Cancelled session không nhận XP/Coin.
- Nếu completion đã commit trước, cancel không được đổi kết quả.
- Nếu cancel commit trước, reconcile sau không được complete hoặc grant reward.
- Cancel một terminal session trả typed result `SESSION_ALREADY_TERMINAL`, không throw và không mutate. `RESOLVED`.

### 5.6. Complete — `BASELINE`

- User/UI không được tự set session thành `completed` và không có nút kỹ thuật “claim complete” dựa trên countdown hiển thị.
- Completion được resolve từ persisted timestamps + `now` trong Domain/Application flow.
- Countdown chạm `0` chỉ request reconciliation.
- Terminal transition chỉ được persist khi stored status vẫn là `running`.
- Completed Focus transition, RewardTransaction, XP/Coin balance và `rewardClaimedAt` phải commit atomically.
- Completed Break không tự suy diễn reward; chi tiết thuộc Session Lifecycle/Gamification.

## 6. Strict Mode Lite và lifecycle recovery

### 6.1. Strict Mode rule — `LOCKED`

```text
backgroundedAt = thời điểm app rời foreground
violationAt    = backgroundedAt + 10 giây

Nếu violationAt <= endsAt:
    session thất bại khi absence đã chạm violationAt

Nếu endsAt < violationAt:
    session hoàn thành trước khi grace period kết thúc
```

Relax Mode không fail khi rời app. Native app blocking không thuộc MVP.

### 6.2. Reconciliation precedence — `LOCKED`

Khi persisted status còn `running`:

1. Nếu là Strict Mode, có `backgroundedAt`, `now >= violationAt` và `violationAt <= endsAt` → `failed`.
2. Ngược lại, nếu `now >= endsAt` → `completed`.
3. Ngược lại → giữ `running`.

Hệ quả boundary:

- `violationAt == endsAt` → `failed` vì Product Core dùng `violationAt <= endsAt`.
- `endsAt < violationAt` → completion thắng nếu deadline đã tới.
- Notification delivery time không tham gia precedence.
- Terminal persisted state luôn thắng mọi phép tính lại.

### 6.3. Clearing `backgroundedAt` — `TE-OPEN-007` (`RESOLVED`)

Quyết định được Dũng Lư — Tech Lead/Product Owner chốt ngày 2026-08-26:

- Với Strict session quay lại trước `violationAt` và trước `endsAt`, reconciliation giữ `running` rồi clear `backgroundedAt` trong cùng transaction để một background episode cũ không gây fail sau này.
- Với Relax session, lifecycle timestamp có thể được ghi cho diagnostics/session lifecycle nếu specification khác cần; nó không ảnh hưởng terminal decision.
- Mỗi lần background mới thay thế active background episode sau khi lần trước đã reconcile an toàn.

Data Model phải chốt nullability và update rule cụ thể.

### 6.4. Background — `BASELINE` và chi tiết đã duyệt

- Lifecycle bridge capture timestamp trước khi enqueue command. `BASELINE`.
- Strict Mode cần persist `backgroundedAt` để relaunch có thể đánh giá grace period. `LOCKED`.
- Notification không cần được dùng để giữ JavaScript timer chạy. `LOCKED`.
- Presentation tick/animation dừng khi không nhìn thấy để tiết kiệm pin. `BASELINE`.
- Exact response khi background persistence thất bại thuộc `TE-OPEN-010` vì ảnh hưởng Strict reliability và recovery UX.

### 6.5. Foreground — `BASELINE`

```text
APP_FOREGROUNDED
  → capture event now
  → enqueue/single-flight reconciliation
  → transaction đọc active session
  → Domain resolve Strict/completion/running
  → persist terminal + reward atomically nếu cần
  → commit
  → rebuild projection/Pet state
  → best-effort notification cleanup/ensure và analytics
```

UI phải đi qua reconciliation barrier trước khi hiển thị active/result truth.

### 6.6. App bị kill hoặc crash — `BASELINE`

- Nếu app bị kill sau durable commit nhưng trước side effect, session/reward truth vẫn đúng.
- Notification có thể được ensure/cancel lại idempotently sau relaunch.
- Audio, haptic và transient animation không bắt buộc replay.
- Khi relaunch, Composition Root mở database, chạy migration, wire dependency graph, tạo coordinator mới và hoàn tất startup reconciliation trước core mutation command.
- Nếu app bị kill khi active session chưa tới deadline, session vẫn được dựng lại từ durable record.
- Nếu relaunch sau `endsAt`, reconciliation resolve terminal theo timestamp và Strict precedence.

### 6.7. Kill không có persisted background event — `TE-OPEN-006` (`RESOLVED`)

Mobile lifecycle không bảo đảm mọi kill/crash đều cho JavaScript cơ hội persist `APP_BACKGROUNDED`. Với Strict session, nếu relaunch thấy status `running` nhưng không có `backgroundedAt`, durable data không đủ chứng minh người dùng đã vắng app từ lúc nào.

Quyết định được Dũng Lư — Tech Lead/Product Owner chốt ngày 2026-08-26: dùng policy evidence-based cho Mobile MVP. Strict session chỉ fail khi có persisted `backgroundedAt` chứng minh violation. Nếu timestamp này bị thiếu, app không tự suy diễn violation và resolve session theo deadline.

Các lựa chọn đã cân nhắc:

| Lựa chọn | Reliability/UX | Anti-abuse | Chi phí/phức tạp |
|---|---|---|---|
| A. Evidence-based: chỉ fail khi có persisted `backgroundedAt`; nếu thiếu thì resolve theo deadline | Không phạt nhầm do crash; phù hợp companion principle | Có thể bị lách bằng force-kill | Thấp; **đã chọn cho MVP** |
| B. Conservative Strict: coi missing lifecycle sau process restart là violation từ checkpoint gần nhất | Chặt hơn nhưng có thể fail oan khi crash/OS kill | Khó lách hơn | Cao; cần heartbeat/checkpoint và nhiều edge case |

Không có server authority trong MVP nên không thể chứng minh tuyệt đối elapsed time hoặc user intent qua mọi kill scenario.

### 6.8. Device restart — `RESOLVED`

- Sau device restart, app startup dùng persisted absolute timestamps và current wall-clock timestamp để reconcile.
- Không giả định JavaScript interval, in-memory monotonic clock hoặc scheduled notification còn tồn tại.
- Local notification delivery sau restart là best-effort theo platform; delivery không đổi session result.
- Nếu system clock cũng thay đổi, áp dụng policy được chốt cho `TE-OPEN-005` ở mục 7 và 11.2.

## 7. Timezone và thay đổi giờ hệ thống — `TE-OPEN-005` (`RESOLVED`)

### 7.1. Timezone — `LOCKED` + `RESOLVED` representation

- Timer truth dùng absolute timestamp; đổi timezone không dời `startedAt` hoặc `endsAt`.
- Countdown remaining không đổi chỉ vì timezone đổi.
- Timezone chỉ ảnh hưởng format hiển thị và contribution/history grouping theo ngày local.
- Session Lifecycle/Data Model cần chốt ngày local được derive theo timezone tại thời điểm nào nếu timezone đổi sau session; Timer Engine không tự quyết định history semantics ngoài Product Core.

### 7.2. Automatic clock correction và manual time change — `RESOLVED`

Offline MVP không có trusted server clock. Absolute wall-clock timestamp sống qua kill/restart nhưng có thể bị thay đổi bởi:

- Network time correction.
- Người dùng chỉnh ngày/giờ thủ công.
- Device restore/restart với clock sai.
- Daylight-saving/timezone change; timezone change tự nó không đổi epoch nhưng có thể đi kèm system correction.

Quyết định được Dũng Lư — Tech Lead/Product Owner chốt ngày 2026-08-26: device wall clock là time authority của Mobile MVP. Reconciliation dùng trực tiếp `now` từ thiết bị và chấp nhận manual/system clock change có thể làm session complete sớm hoặc muộn. Không thêm backend, checkpoint hoặc anomaly state cho MVP.

Các lựa chọn đã cân nhắc:

| Lựa chọn | Hành vi | Độ tin cậy | Chi phí/phức tạp |
|---|---|---|---|
| A. Wall clock là authority cho MVP | Reconcile trực tiếp bằng `now` của thiết bị; chấp nhận manual time có thể làm session sớm/muộn | Đơn giản, nhất quán qua restart; có giới hạn anti-cheat | Thấp; **đã chọn cho MVP** |
| B. Hybrid wall + monotonic trong cùng process | Dùng monotonic elapsed khi process sống, wall clock sau relaunch | Chống clock jump trong process nhưng behavior khác nhau tùy kill | Trung bình; cần drift policy/test |
| C. Persist checkpoint/anomaly guard | Ghi thêm observed time/elapsed, phát hiện jump và giữ session ở recovery state | Có thể giảm abuse nhưng khó phân biệt chỉnh giờ hợp lệ | Cao; thêm schema, UX và failure state |

Không policy nào cung cấp trusted elapsed time tuyệt đối qua kill/restart mà không có nguồn thời gian bên ngoài. Timer Engine không được âm thầm thêm backend chỉ để giải quyết bài toán này.

### 7.3. Consequences và limitation — `RESOLVED`

- MVP không có clock-anomaly state hoặc UX riêng.
- Clock nhảy tiến có thể khiến `now >= endsAt` và session được resolve sớm.
- Clock nhảy lùi có thể làm deadline bị trì hoãn cho tới khi wall clock bắt kịp.
- App không tự fail/cancel hoặc phạt người dùng chỉ vì phát hiện time change.
- Chống clock tampering mạnh hơn là post-MVP decision và không được âm thầm thêm backend.

## 8. Notification interaction — `TE-OPEN-008` (`RESOLVED`)

### 8.1. Baseline

- Local notification dùng cho Focus/Break completion.
- Schedule/ensure diễn ra sau durable start commit.
- Cancel/cleanup diễn ra sau terminal commit.
- Permission denial hoặc adapter failure không rollback core truth.
- Notification handler luôn đọc/reconcile durable state; không tự complete hoặc grant reward.

### 8.2. Idempotent operation — `TE-OPEN-008` (`RESOLVED`)

Quyết định được Dũng Lư — Tech Lead chốt ngày 2026-08-26:

- Mỗi active session có một stable notification operation key derive từ `sessionId` và loại completion.
- `ensureScheduled(sessionId, endsAt)` không tạo nhiều notification tương đương.
- `cancelScheduled(sessionId)` an toàn khi gọi lặp lại hoặc notification không tồn tại.
- Sau relaunch, running session có thể ensure lại; terminal session có thể cancel stale notification.
- Nếu stale notification vẫn được OS hiển thị sau cancel race, mở notification chỉ dẫn tới durable reconciliation và không thay session truth.

Exact adapter API và storage mapping thuộc Mobile Application/Infrastructure implementation.

## 9. Complete/reward idempotency và concurrency

### 9.1. Correctness layers — `LOCKED`/`BASELINE`

```text
Lifecycle/user request
  → SessionCommandCoordinator serialization
  → reconciliation single-flight
  → SQLite transaction
  → conditional transition WHERE status = running
  → completed Focus + RewardTransaction + XP/Coin + rewardClaimedAt atomically
  → unique RewardTransaction(sessionId)
  → commit
  → UI projection
  → best-effort side effects
```

Các hàng rào bắt buộc:

1. Terminal status không transition lại `running` hoặc sang terminal status khác.
2. Completion retry đọc terminal state và không tạo reward mới.
3. Reward ledger có unique constraint theo `sessionId` hoặc cơ chế atomic tương đương.
4. Result screen không trực tiếp cộng XP/Coin.
5. Notification open/delivery không grant reward.
6. Analytics `focus_session_completed`/`reward_granted` không phải durable proof và failure không rollback.
7. Nhiều trigger đồng thời chỉ có tối đa một durable transition/reward commit.

### 9.2. Race examples

| Race | Kết quả bắt buộc |
|---|---|
| Hai reconciliation đồng thời | Single-flight trong process; database backstop bảo đảm một terminal transition/reward. |
| Countdown tick và foreground cùng request reconcile | Serialize/coalesce; một committed result. |
| Cancel commit trước completion | `cancelled`; completion retry no-op; không reward. |
| Completion commit trước cancel | `completed`; cancel không đổi status; reward không lặp. |
| App kill sau completion commit, trước Result screen | Relaunch hydrate `completed`; reward đã có đúng một lần. |
| App kill sau session terminal write nhưng trước reward write | Không được có crash window này vì terminal + reward phải cùng transaction. |
| Result screen mở nhiều lần | Chỉ đọc committed result; không grant thêm reward. |
| Notification được tap nhiều lần | Mỗi lần chỉ reconcile/read durable truth; không grant thêm reward. |

### 9.3. “Claim reward” semantics — `TE-OPEN-009` (`RESOLVED`)

Quyết định được Dũng Lư — Tech Lead/Product Owner chốt ngày 2026-08-26: “claim” là thao tác nội bộ, tự động trong completed Focus transaction. Người dùng không cần nhấn nút để tạo reward transaction; Result screen chỉ trình bày reward đã commit.

Nếu Product muốn manual claim, đó là thay đổi gameplay/session lifecycle và phải được duyệt riêng trước khi timer/data model triển khai.

## 10. Edge cases và documentation boundaries

### 10.1. Edge-case matrix

| ID | Tình huống | Kết quả hiện tại | Trạng thái |
|---|---|---|---|
| `TE-EDGE-001` | `now < startedAt` do clock jump backward | Giữ session `running`; remaining time theo wall clock cho tới khi clock bắt kịp | `RESOLVED`. |
| `TE-EDGE-002` | `endsAt < startedAt` trong record | Không resolve/reward; vào safe recovery và cho phép explicit cancel phiên lỗi | `RESOLVED`. |
| `TE-EDGE-003` | `now == endsAt` | Eligible completion nếu không có Strict violation thắng precedence | `RESOLVED`. |
| `TE-EDGE-004` | Strict `violationAt == endsAt` | `failed` | `LOCKED`. |
| `TE-EDGE-005` | Strict `endsAt < violationAt` | `completed` khi deadline tới | `LOCKED`. |
| `TE-EDGE-006` | Foreground trước `violationAt` | Giữ `running`; clear background episode atomically | `RESOLVED`. |
| `TE-EDGE-007` | Foreground sau `violationAt`, violation trước/equal deadline | `failed`, không reward | `LOCKED`. |
| `TE-EDGE-008` | Relax background qua deadline | `completed` khi reconcile; reward đúng một lần nếu Focus | `LOCKED`/`BASELINE`. |
| `TE-EDGE-009` | Notification permission denied | Timer/session vẫn hoạt động đầy đủ | `LOCKED`. |
| `TE-EDGE-010` | Notification schedule/cancel thất bại | Không rollback durable truth; retry/ensure best-effort | `BASELINE`. |
| `TE-EDGE-011` | App kill trước background timestamp persist | Không suy diễn Strict violation; resolve theo deadline vì thiếu durable evidence | `RESOLVED`. |
| `TE-EDGE-012` | App relaunch trước deadline | Hydrate/reconcile rồi tiếp tục `running` nếu không violation | `BASELINE`. |
| `TE-EDGE-013` | App relaunch sau deadline | Resolve terminal theo Strict precedence | `LOCKED`/`BASELINE`. |
| `TE-EDGE-014` | Device restart | Reconcile từ durable wall-clock timestamp; notification không là truth | `RESOLVED`. |
| `TE-EDGE-015` | Hai Start request nhanh | Coordinator + DB invariant chỉ cho một active session hợp lệ | `BASELINE`. |
| `TE-EDGE-016` | Cancel và complete race | Transaction commit đầu tiên trên `running` thắng | `BASELINE`. |
| `TE-EDGE-017` | Reconcile terminal session | No mutation, no reward mới | `LOCKED`. |
| `TE-EDGE-018` | Reward insert bị unique conflict do retry/race | Transaction xử lý idempotently; không cộng balance lần hai | `BASELINE`; exact SQL thuộc Data Model. |
| `TE-EDGE-019` | Result screen mở lại | Render committed result; không claim lại | `LOCKED`. |
| `TE-EDGE-020` | User chỉnh giờ tiến mạnh | Reconcile theo wall clock mới; session có thể complete sớm | `RESOLVED`. |
| `TE-EDGE-021` | User chỉnh giờ lùi | Reconcile theo wall clock mới; completion có thể bị trì hoãn | `RESOLVED`. |
| `TE-EDGE-022` | Đổi timezone giữa session | Absolute deadline không đổi; presentation/history regroup thuộc spec khác | Timer truth `LOCKED`; history detail `OPEN` ngoài phạm vi. |
| `TE-EDGE-023` | Invalid/overflow duration arithmetic | Reject Start bằng typed error; không persist session | `RESOLVED`. |
| `TE-EDGE-024` | Database unavailable khi Start | Start thất bại; không schedule notification hoặc điều hướng như đã start | `BASELINE`. |
| `TE-EDGE-025` | Database failure khi reconcile | Không hiển thị terminal/reward chưa commit; giữ dữ liệu và vào safe recovery với Retry | `RESOLVED`. |
| `TE-EDGE-026` | Pause/Resume được gọi tại defensive boundary | Không mutate; `PAUSE_NOT_SUPPORTED` hoặc `RESUME_NOT_SUPPORTED` | `RESOLVED`. |
| `TE-EDGE-027` | Stale background event được xử lý sau foreground event | Coordinator giữ event order/timestamp; exact coalescing policy cần test | `BASELINE` + implementation detail. |

### 10.2. Safe recovery — `TE-OPEN-010` (`RESOLVED`)

Quyết định được Dũng Lư — Tech Lead/Product Owner chốt ngày 2026-08-26:

1. Nếu active-session timestamp không hợp lệ hoặc database read/write thất bại, Application trả typed recovery error; không tự resolve terminal status hoặc grant reward.
2. Durable data hiện có được giữ nguyên. UI không được render một terminal result chưa commit.
3. Presentation chuyển sang `recovery_required` projection với thông báo thân thiện và action Retry. Đây không phải durable session status và không được persist như timer state.
4. Nếu database đọc/ghi được nhưng riêng active session có timestamp hỏng, người dùng có thể chọn hủy phiên lỗi. Recovery command chỉ conditional-transition record còn `running` sang `cancelled`; không reward và không sửa timestamp để suy diễn completion.
5. Nếu database tiếp tục không khả dụng, full local-data reset chỉ được cung cấp như phương án cuối với cảnh báo và xác nhận rõ ràng. App không tự xóa hoặc overwrite dữ liệu.
6. Error/log phải được sanitize; không ghi raw session payload, Pet name hoặc dữ liệu database nhạy cảm.

Application contract phải hỗ trợ tối thiểu các stable error code:

- `INVALID_SESSION_TIMESTAMP`
- `DATABASE_UNAVAILABLE`
- `DATABASE_WRITE_FAILED`
- `RECOVERY_CANCEL_FAILED`

Exact error-code set và reset implementation được Data Model/Presentation chi tiết hóa nhưng không được thay đổi safe-recovery behavior trên.

### 10.3. Out of scope và deferred

- Native app blocking/allowlist.
- Server-authoritative clock hoặc anti-cheat backend.
- Authentication, cloud sync và multi-device conflict resolution.
- Live Activities, Dynamic Island, widgets và server push notification.
- Desktop timer implementation.
- Event-sourcing, distributed lock, durable process lock hoặc generic workflow/state-machine framework.
- Gamification formula, Pet animation và history-day semantics ngoài phần timer truth.

### 10.4. Traceability tới checklist

| Checklist Timer Engine | Vị trí trong draft | Trạng thái draft |
|---|---|---|
| Timer states và events | Mục 2, 4 | Đã mô tả; `TE-OPEN-003` đã `RESOLVED`. |
| State-transition table/diagram | Mục 4 | Đã có; Pause/Resume được resolve thành unsupported error path. |
| `startedAt`, `endsAt`, `pausedAt`, current timestamp | Mục 3 | Đã chốt; `pausedAt` không áp dụng cho MVP. |
| Start/pause/resume/cancel/complete | Mục 5 | No-pause behavior đã chốt; các chi tiết còn lại tiếp tục review. |
| Background/foreground/kill/restart | Mục 6 | Đã chốt evidence-based recovery và lifecycle clearing. |
| Timezone/system clock | Mục 7 | Đã chốt wall clock authority và limitation. |
| Chống complete/claim reward hai lần | Mục 9 | Đã chốt automatic reward claim trong transaction. |
| Edge cases/acceptance criteria | Mục 10, 12 | Đã liệt kê; safe-recovery behavior đã `RESOLVED`. |
| Review/phê duyệt | Mục 11, 12 | Chưa review/phê duyệt toàn bộ. |

## 11. Timer engine decisions

### 11.1. Resolved decisions

| ID | Quyết định | Owner | Trạng thái | Ngày chốt |
|---|---|---|---|---|
| `TE-OPEN-001` | Mobile MVP không hỗ trợ pause Focus; không có paused state/`pausedAt`; defensive Pause/Resume command không mutate. | Product/Tech Lead — Dũng Lư | `RESOLVED` | 2026-08-26 |
| `TE-OPEN-002` | Mobile MVP không hỗ trợ pause Break; áp dụng cùng no-pause boundary với Focus. | Product/Tech Lead — Dũng Lư | `RESOLVED` | 2026-08-26 |
| `TE-OPEN-003` | Operational state gồm `idle`, `running`, `resolution_due`, `resolving`, `terminal` được derive; không persist timer-state enum riêng. | Tech Lead — Dũng Lư | `RESOLVED` | 2026-08-26 |
| `TE-OPEN-004` | Timestamp dùng Unix epoch milliseconds UTC, integer; completion tại `now >= endsAt`; capture `now` một lần mỗi command. | Tech Lead — Dũng Lư | `RESOLVED` | 2026-08-26 |
| `TE-OPEN-005` | Device wall clock là time authority của offline MVP; chấp nhận session sớm/muộn khi system clock đổi; không thêm anomaly state/backend. | Product/Tech Lead — Dũng Lư | `RESOLVED` | 2026-08-26 |
| `TE-OPEN-006` | Strict relaunch thiếu persisted `backgroundedAt` dùng evidence-based policy: không suy diễn violation, resolve theo deadline. | Product/Tech Lead — Dũng Lư | `RESOLVED` | 2026-08-26 |
| `TE-OPEN-007` | Strict session quay lại trong grace sẽ clear `backgroundedAt` atomically sau safe reconciliation. | Tech Lead — Dũng Lư | `RESOLVED` | 2026-08-26 |
| `TE-OPEN-008` | Notification operation key derive từ `sessionId + completion type`; ensure/cancel phải idempotent khi retry. | Tech Lead — Dũng Lư | `RESOLVED` | 2026-08-26 |
| `TE-OPEN-009` | Reward claim là thao tác tự động trong completed Focus transaction; Result screen chỉ hiển thị reward đã commit. | Product/Tech Lead — Dũng Lư | `RESOLVED` | 2026-08-26 |
| `TE-OPEN-010` | Corrupt timestamp/database failure dùng safe recovery: không resolve/reward, giữ dữ liệu, Retry; explicit cancel phiên lỗi và confirmed full reset là fallback. | Product/Tech Lead — Dũng Lư | `RESOLVED` | 2026-08-26 |

### 11.2. Open decisions

Không còn Timer Engine decision ở trạng thái `OPEN` trong baseline hiện tại.

Mỗi quyết định chỉ được chuyển sang `RESOLVED` và đưa vào normative acceptance criteria sau khi Dũng Lư xác nhận. Nếu một quyết định thay đổi Product Core hoặc baseline đã duyệt, phải cập nhật nguồn có authority cao hơn trước hoặc đồng thời, với phê duyệt rõ ràng.

## 12. Acceptance criteria

### 12.1. Baseline acceptance criteria

- [ ] Timer truth không phụ thuộc số lần JavaScript interval tick.
- [ ] Operational state được derive từ durable session status, timestamp và command state; không persist timer-state enum riêng.
- [ ] Timestamp dùng Unix epoch milliseconds UTC, integer; `now` được capture một lần mỗi command và completion boundary là `now >= endsAt`.
- [ ] Focus và Break không có Pause/Resume action, paused state hoặc `pausedAt` trong Mobile MVP.
- [ ] Defensive Pause/Resume command không mutate và trả typed not-supported error.
- [ ] App foreground/startup reconcile active session từ durable record + current timestamp trước khi render final truth.
- [ ] Relax Mode không fail chỉ vì app background.
- [ ] Strict Mode dùng grace 10 giây và boundary `violationAt <= endsAt` đúng Product Core.
- [ ] `completed`, `failed`, `cancelled` là terminal và không quay lại `running`.
- [ ] Cancelled/failed session không nhận XP/Coin.
- [ ] Completed Focus chỉ có tối đa một RewardTransaction/reward grant theo `sessionId`.
- [ ] Terminal transition + reward ledger + XP/Coin + `rewardClaimedAt` commit atomically.
- [ ] Result screen, notification và analytics không thể grant reward trực tiếp.
- [ ] Concurrent/retried reconciliation không complete hoặc reward hai lần.
- [ ] Notification permission denial/failure không làm hỏng timer.
- [ ] Kill sau durable commit không làm mất session/reward truth.
- [ ] Strict relaunch thiếu `backgroundedAt` không tự suy diễn violation; session resolve theo deadline.
- [ ] Strict session foreground an toàn trong grace sẽ clear `backgroundedAt` atomically.
- [ ] Device wall clock là time authority; system-clock change có thể làm session sớm/muộn mà không tạo anomaly state.
- [ ] Notification ensure/cancel dùng stable operation key và an toàn khi retry.
- [ ] Reward được grant tự động trong completed Focus transaction; Result screen không manual claim.
- [ ] Corrupt timestamp/database failure không resolve hoặc reward; dữ liệu được giữ và UI vào `recovery_required` projection với Retry.
- [ ] Phiên lỗi chỉ bị cancel khi người dùng chủ động chọn và database commit được; full reset là phương án cuối có xác nhận.
- [ ] Startup reconciliation barrier chạy trước core mutation từ Presentation.
- [ ] Timezone change không dời absolute timer deadline.

Các ô chưa được đánh dấu vì đây là implementation acceptance criteria và chưa có implementation/test evidence; việc phê duyệt specification không thay thế bước xác minh này.

### 12.2. Test matrix bắt buộc — `RESOLVED`

| Cấp test | Phạm vi |
|---|---|
| Domain unit | Timestamp comparison, completion boundary, Strict precedence, terminal invariant, fake clock. |
| Application unit | Command serialization, single-flight reconciliation, start/cancel/reconcile results, side-effect ordering. |
| SQLite integration | Active-session constraint, conditional terminal transition, atomic reward transaction, unique `sessionId`. |
| Mobile integration | App lifecycle bridge, notification denial/failure, startup barrier, stale notification handling. |
| Device/simulator | Background/foreground trong/ngoài grace, kill/relaunch trước/sau deadline, device restart, timezone/system-time scenarios theo policy đã duyệt. |

Test không được khóa behavior cho câu hỏi `OPEN` trước khi quyết định tương ứng được duyệt.

## 13. Change log

### 1.0.1 — 2026-08-26

- Dũng Lư phê duyệt maintenance update đồng bộ hai tham chiếu Product decision với Product Core 1.10.0.
- Ghi nhận `OPEN-003` đã chốt automatic Long Break type selection sau bốn completed Focus và `OPEN-010` đã chốt Break không auto-start.
- Không thay đổi timer state, timestamp, Strict precedence, recovery, notification idempotency, reward transaction hoặc acceptance semantics của Timer Engine 1.0.0.

### 1.0.0 — 2026-08-26

- Dũng Lư — Tech Lead/Product Owner review và phê duyệt toàn bộ Timer Engine Specification.
- Chuyển trạng thái tài liệu từ `DRAFT` sang `APPROVED` sau khi `TE-OPEN-001` đến `TE-OPEN-010` đều `RESOLVED`.
- Chuyển display tick/event semantics, terminal-cancel result, recovery error contract và test matrix còn lại sang normative `RESOLVED` rules theo phê duyệt tổng thể.
- Phát hành Timer Engine 1.0.0 làm baseline cho Session Lifecycle, Pet State Machine, Gamification Rules, Data Model và Mobile MVP implementation.

### 0.7.0 — 2026-08-26

- Dũng Lư chốt `TE-OPEN-010` theo safe-recovery policy.
- Quy định corrupt timestamp/database failure không tự resolve terminal hoặc grant reward; dữ liệu được giữ và UI chuyển sang `recovery_required` projection với Retry.
- Cho phép explicit cancel phiên lỗi khi database còn hoạt động; full local-data reset chỉ là phương án cuối có xác nhận.
- Đồng bộ Product Core 1.7.0, edge-case matrix và acceptance criteria; `TE-OPEN-001` đến `TE-OPEN-010` đều `RESOLVED`.

### 0.6.0 — 2026-08-26

- Dũng Lư chốt `TE-OPEN-004` đến `TE-OPEN-009`.
- Chốt Unix epoch milliseconds UTC, integer, single-capture `now` và completion boundary `now >= endsAt`.
- Chốt device wall clock authority, evidence-based Strict recovery, atomic `backgroundedAt` clearing và idempotent notification key.
- Chốt automatic reward claim trong completed Focus transaction; Result screen chỉ hiển thị committed reward.
- Đồng bộ Product Core 1.6.0, edge-case matrix, traceability và acceptance criteria; chỉ `TE-OPEN-010` còn `OPEN`.

### 0.5.0 — 2026-08-26

- Tech Lead Dũng Lư chốt `TE-OPEN-003`: operational timer state được derive, không persist enum riêng.
- Khóa `idle`, `running`, `resolution_due`, `resolving` và `terminal` là operational projection từ durable session truth và command state.
- Cập nhật decision table, acceptance criteria và thứ tự review; `TE-OPEN-004` đến `TE-OPEN-010` tiếp tục `OPEN`.

### 0.4.0 — 2026-08-26

- Ghi nhận Dũng Lư là owner của Timer Engine Specification với các vai trò Tech Lead, Product Owner và Lead Mobile Developer.
- Đồng bộ project context từ Product Core 1.5.0; không thay đổi timer behavior hoặc trạng thái các quyết định.

### 0.3.0 — 2026-08-26

- Chuẩn hóa cấu trúc tài liệu theo format của Project Structure 1.0.0: vai trò/phạm vi và trạng thái quyết định ở đầu; rule theo chủ đề; decision table, acceptance criteria và change log ở cuối.
- Gom state diagram, transition table và event catalog vào một section; gom Strict Mode với lifecycle recovery.
- Đưa out-of-scope và checklist traceability vào documentation boundaries trước decision table.
- Giữ nguyên `TE-OPEN-001`/`TE-OPEN-002` đã `RESOLVED` và `TE-OPEN-003` đến `TE-OPEN-010` đang `OPEN`.
- Không thay đổi Product Core hoặc technical behavior đã được duyệt.

### 0.2.0 — 2026-08-26

- Tech Lead Dũng Lư chốt `TE-OPEN-001` và `TE-OPEN-002`: Mobile MVP không hỗ trợ pause cho cả Focus và Break.
- Loại paused state và `pausedAt` khỏi requirement/schema MVP; UI không có Pause/Resume action.
- Quy định defensive Pause/Resume command trả typed not-supported error và không mutate durable state.
- Đồng bộ Product Core 1.4.0, chuyển Product `OPEN-002` sang `RESOLVED` và cập nhật Technical Documentation Checklist sang `Đang thực hiện`.
- Giữ tài liệu ở trạng thái `DRAFT`; `TE-OPEN-003` đến `TE-OPEN-010` tiếp tục chờ review.

### 0.1.0 — 2026-08-26

- Tạo bản draft đầu tiên từ Product Core 1.3.0, checklist, ba baseline kiến trúc 1.0.0 và ADR-001 đến ADR-008.
- Ghi timer/session state boundary, event catalog, diagram, transition table và timestamp semantics.
- Ghi lifecycle behavior cho background, foreground, kill, relaunch và device restart.
- Ghi Strict Mode precedence, notification boundary, concurrency và reward idempotency.
- Liệt kê edge cases, acceptance criteria và traceability với checklist.
- Ghi `TE-OPEN-001` đến `TE-OPEN-010`; không tự chốt pause Focus hoặc các quyết định chưa được Product/Tech Lead duyệt.
- Giữ tài liệu ở trạng thái `DRAFT`; chưa cập nhật Product Core, baseline kiến trúc, ADR hoặc Technical Documentation Checklist.
