---
document_id: PIXELDORO_SESSION_LIFECYCLE_SPECIFICATION
title: PixelDoro Mobile MVP — Session Lifecycle Specification
version: 1.0.0
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
  - session_lifecycle
authority: TERTIARY
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
timer_engine_baseline: ./timer-engine.md
---

# PixelDoro Mobile MVP — Session Lifecycle Specification

## 0. Vai trò và phạm vi tài liệu

Tài liệu này đặc tả vòng đời sản phẩm của Focus và Break session cho PixelDoro Mobile MVP, gồm:

- Ý nghĩa của `running`, `completed`, `failed` và `cancelled`.
- Luồng Focus → Reward → Result → Break/Home.
- Hành vi Relax Mode và Strict Mode Lite.
- Kết quả khi app background, crash, bị kill, relaunch hoặc mở lại sau `endsAt`.
- Reward eligibility cho từng loại session và terminal result.
- Recovery flow khi timestamp hoặc database không an toàn.
- Scenario matrix, edge cases và acceptance criteria cho success/failure flow.

Tài liệu này không quyết định lại:

- Timer truth, timestamp representation, reconciliation precedence, notification idempotency hoặc safe recovery đã khóa trong [Timer Engine 1.0.1](./timer-engine.md).
- Công thức XP/Coin (`OPEN-004`), Long Break cadence (`OPEN-003`) và manual Break start (`OPEN-010`) đã được chốt trong [Product Core 1.10.0](../PIXELDORO_CORE_TRUTH.md) và được tài liệu này kế thừa.
- Pet animation duration/priority của `pet-state-machine.md`.
- Reward formula, level threshold, item hoặc economy detail của `gamification-rules.md`.
- Schema, datatype, index, constraint hoặc migration của `data-model.md`.

Nếu có mâu thuẫn, Product Core là nguồn sự thật sản phẩm ưu tiên cao nhất. Technical Overview 1.0.0, System Architecture 1.0.0, Project Structure 1.0.0, Timer Engine 1.0.1 và ADR-001 đến ADR-008 là baseline đã duyệt; tài liệu này chỉ chi tiết hóa và không được làm suy yếu các quyết định đó.

### 0.1. Trạng thái quyết định

| Trạng thái | Ý nghĩa |
|---|---|
| `LOCKED` | Đã được Product Core khóa; implementation phải tuân theo. |
| `BASELINE` | Đã được tài liệu kỹ thuật/ADR có authority cao hơn chấp nhận; tài liệu này chỉ trace và chi tiết hóa. |
| `PROPOSED` | Đề xuất trong draft; chưa thành requirement cho tới khi Dũng Lư xác nhận. |
| `RESOLVED` | Quyết định Session Lifecycle đã được Dũng Lư xác nhận trong tài liệu này. |
| `OPEN` | Chưa quyết định; không được tự suy diễn khi triển khai hoặc viết acceptance test. |
| `DEFERRED` | Không thuộc Mobile MVP. |

Phiên bản `1.0.0` đã được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26. `SL-OPEN-001`, `SL-OPEN-002`, Product `OPEN-003`, `OPEN-004` và `OPEN-010` đều `RESOLVED`; đây là baseline Session Lifecycle cho Mobile MVP và các tài liệu phụ thuộc.

### 0.2. Authority và traceability

| Nguồn | Phiên bản/trạng thái | Rule được kế thừa |
|---|---|---|
| `PIXELDORO_CORE_TRUTH.md` | 1.10.0 `ACTIVE` | Product loop, four statuses, Relax/Strict behavior, Long Break cadence, manual Break start và reward formula. |
| `TECHNICAL_DOCUMENTATION_CHECKLIST.md` | Hiện hành | Phạm vi và definition of done của Session Lifecycle. |
| `architecture/technical-overview.md` | 1.0.0 `APPROVED` | Offline-first, durable truth, transaction/side-effect constraints. |
| `architecture/system-architecture.md` | 1.0.0 `APPROVED` | Application command coordinator, transaction ordering, typed result và projection boundary. |
| `architecture/project-structure.md` | 1.0.0 `APPROVED` | Domain/Application/Infrastructure/Presentation ownership và test placement. |
| `specifications/timer-engine.md` | 1.0.1 `APPROVED` | Direct baseline cho timestamp, lifecycle reconciliation, precedence, concurrency, reward idempotency và safe recovery. |
| ADR-001 đến ADR-008 | `ACCEPTED`/`ACCEPTED_WITH_GATE` | Runtime, persistence, domain/platform boundary và side-effect constraints liên quan. |

## 1. Nguyên tắc và invariant

Các invariant sau là normative vì đã được khóa ở Product Core hoặc Timer Engine:

1. Mỗi Focus/Break session bắt đầu ở `running` và chỉ có thể kết thúc ở một trong ba terminal status: `completed`, `failed` hoặc `cancelled`.
2. Terminal status không transition trở lại `running` hoặc sang một terminal status khác.
3. Operational timer state như `resolution_due`, `resolving` hoặc UI recovery state chỉ được derive; không tạo durable session status mới.
4. Focus và Break không hỗ trợ pause; không có `paused` hoặc `pausedAt` trong Mobile MVP.
5. Session truth dựa trên persisted timestamp + device wall clock; countdown tick và notification không phải bằng chứng terminal result.
6. Completion boundary là `now >= endsAt`, với timestamp Unix epoch milliseconds UTC và `now` được capture một lần tại command/lifecycle boundary.
7. Strict violation chỉ được kết luận khi có durable evidence và phải theo precedence `violationAt <= endsAt`.
8. Completed Focus transition và reward grant commit atomically; retry, Result screen hoặc notification không thể cấp reward lần hai.
9. Failed/cancelled session không nhận XP/Coin.
10. Khi durable truth không đọc, validate hoặc commit an toàn, app không tự suy diễn terminal result hoặc reward.
11. Notification, analytics, audio, haptic và animation là side effect sau commit; failure không thay đổi session/reward truth.
12. Mọi session-mutating command đi qua `SessionCommandCoordinator`; database transaction và constraint là correctness backstop cuối cùng.

## 2. Session concepts và ownership

### 2.1. Session types

| Session type | Mục đích | Thời lượng baseline | Reward boundary |
|---|---|---:|---|
| Focus | Khoảng thời gian người dùng cam kết tập trung cùng Pet | 15–120 phút | Completed Focus có thể nhận XP/Coin theo công thức được duyệt. |
| Short Break | Khoảng nghỉ ngắn sau Focus | 5 phút | Không tạo XP/Coin; completion chỉ ghi nhận kết quả Break. |
| Long Break | Khoảng nghỉ dài | 15 phút | Không tạo XP/Coin; là Break kế tiếp khi cadence bốn completed Focus đến hạn. |

Thời lượng mặc định/step được kế thừa từ Product Core. Long Break cadence đã được `OPEN-003` chốt và Break không auto-start theo `OPEN-010`.

### 2.2. Durable truth và projection

| Nhóm | Owner | Ví dụ |
|---|---|---|
| Durable session truth | SQLite qua repository/transaction | Type, status, mode, `startedAt`, `endsAt`, `backgroundedAt`, `resolvedAt`, reward fields. |
| Domain decision | Domain thuần TypeScript | Terminal transition, Strict precedence, reward eligibility fact. |
| Application orchestration | Application use case/coordinator | Start, cancel, background, foreground, reconcile, transaction và side-effect dispatch. |
| UI projection | Zustand/Presentation | Countdown, command pending/error, Result view, `recovery_required`. |
| Transient experience | Presentation/platform adapter | Pet celebration/bugged feedback, audio, haptic, notification display. |

UI không được suy diễn một session đã complete chỉ vì countdown hiển thị `0`, route Result đang mở hoặc notification đã được giao.

### 2.3. Active-session invariant

Một active session là session có status `running`. Mobile MVP không được có nhiều active Focus/Break session trái invariant. Start Focus/Break chỉ thành công sau khi durable precondition được kiểm tra và transaction tạo session commit.

Schema/constraint cụ thể thuộc `data-model.md`; Session Lifecycle chỉ yêu cầu hành vi:

- Start request thứ hai không tạo session trùng.
- UI pending/disabled không phải concurrency lock.
- Relaunch phải qua startup reconciliation barrier trước khi nhận core mutation mới.

## 3. Durable session statuses

### 3.1. `running` — `LOCKED`

`running` nghĩa là session đã start và chưa có terminal result được persist.

- `running` không đảm bảo `now < endsAt`; nếu deadline/violation đã tới nhưng chưa reconcile, operational state là `resolution_due` trong khi durable status vẫn là `running`.
- Countdown bằng `0`, app background hoặc notification delivery không tự đổi status.
- User có thể cancel khi conditional transition vẫn thấy persisted status `running`.
- UI phải reconcile trước khi trình bày final truth sau startup/foreground.

Trace: Product Core §7.2–7.5; Timer Engine §2.1–2.3, §4.

### 3.2. `completed` — `LOCKED`

`completed` nghĩa là session đã đạt deadline theo rule và transaction resolve terminal đã commit.

- Guard thời gian cơ bản: `now >= endsAt`.
- Với Strict Focus, completion chỉ thắng khi không có violation hợp lệ xảy ra sớm hơn hoặc đúng tại deadline.
- Completed Focus grant reward tự động trong cùng transaction nếu reward chưa từng được grant.
- Completed Break không tạo XP/Coin.
- `resolvedAt` ghi thời điểm terminal result được persist; không thay thế `endsAt`.

Trace: Product Core §7.2–7.5; Timer Engine §3.2, §5.6, §6.2, §9.

### 3.3. `failed` — `LOCKED` cho Strict Focus

`failed` nghĩa là Strict Focus đã có durable evidence chứng minh người dùng vắng app quá grace period 10 giây và violation xảy ra không muộn hơn deadline.

```text
violationAt = backgroundedAt + 10_000

failed khi:
  backgroundedAt hợp lệ
  AND now >= violationAt
  AND violationAt <= endsAt
```

- Không nhận XP/Coin.
- Pet projection là `bugged` ngắn hạn theo Product Core; duration/animation priority thuộc Pet State Machine.
- Failure copy phải ấm áp, không phán xét hoặc tạo guilt.
- Break không áp dụng Strict và không chuyển `failed` chỉ vì app background theo `SL-OPEN-001` đã được Dũng Lư chốt.

Trace: Product Core §2.1, §6.2, §7.2–7.5, §8.2–8.3; Timer Engine §6.1–6.3.

### 3.4. `cancelled` — `LOCKED`

`cancelled` nghĩa là người dùng chủ động kết thúc session và conditional terminal transition đã commit khi persisted status còn `running`.

- Không nhận XP/Coin.
- Notification cleanup là best-effort sau commit.
- Cancel không thắng một completion/failure đã commit trước.
- Cancel terminal session trả typed result `SESSION_ALREADY_TERMINAL`, không mutate.
- Explicit cancel trong safe recovery chỉ áp dụng khi database còn đọc/ghi được và record lỗi vẫn `running`.

Trace: Product Core §5.4, §7.2–7.5; Timer Engine §5.5, §9.2, §10.2.

### 3.5. Terminal invariant

```text
running ── deadline/reconcile ──► completed
running ── Strict violation ────► failed
running ── explicit cancel ─────► cancelled

completed / failed / cancelled
  └── không transition ngược hoặc đổi terminal result
```

Nếu cancel và reconciliation cạnh tranh, transaction đầu tiên conditional-transition từ `running` thắng. Lời gọi sau đọc terminal truth, trả kết quả idempotent/no-op phù hợp và không đổi reward.

## 4. Focus lifecycle

### 4.1. Start Focus

```text
Home / Focus Setup
  → user chọn duration, work tag và Relax/Strict mode
  → StartFocus command capture ID + now
  → validate input và active-session invariant
  → transaction tạo Focus status running với startedAt/endsAt
  → commit
  → render Focus Session + Pet working
  → best-effort ensure Focus completion notification
  → best-effort analytics/audio/haptic
```

Start không thành công khi duration/timestamp không hợp lệ, có active session hoặc database write thất bại. Trong các trường hợp đó app không điều hướng như đã start và không schedule notification.

### 4.2. Running Focus

- Presentation derive remaining time bằng `max(0, endsAt - now)` và có thể tick khoảng mỗi giây khi nhìn thấy.
- Không có Pause/Resume action.
- User có thể cancel hoặc để timer tiếp tục.
- Pet projection là `working` khi durable session vẫn active và app không ở recovery projection.
- Relax/Strict lifecycle behavior theo mục 6.
- Tick thấy deadline chỉ request reconciliation; transaction mới quyết định final status.

### 4.3. Resolve Focus

Khi countdown chạm deadline, app foreground/startup, notification được mở hoặc Application chủ động reconcile:

```text
ReconcileActiveSession
  → serialize/single-flight
  → transaction đọc durable Focus còn running
  → validate timestamps
  → áp dụng Strict precedence nếu cần
  → terminal decision:
      failed    nếu có Strict violation thắng
      completed nếu không có violation thắng và now >= endsAt
      running   nếu chưa tới terminal condition
  → nếu completed:
      persist completed + resolvedAt
      insert RewardTransaction unique(sessionId)
      update XP/Coin theo formula đã được duyệt
      set rewardClaimedAt
  → nếu failed:
      persist failed + resolvedAt, không reward
  → commit
  → rebuild projection
  → best-effort notification cleanup + analytics
```

Nếu timestamp/database không an toàn, flow dừng ở safe recovery của mục 8; không tự complete/fail/cancel/reward.

### 4.4. Focus Result

Result screen chỉ render committed terminal truth:

| Focus result | Nội dung tối thiểu | Pet feedback | Reward display |
|---|---|---|---|
| `completed` | Thời lượng Focus đã hoàn thành và kết quả tích cực | `celebrating` ngắn hạn | Hiển thị XP/Coin đã commit; không có manual claim. |
| `failed` | Strict violation với copy khuyến khích thử lại | `bugged` ngắn hạn | Không XP/Coin. |
| `cancelled` | Session đã được dừng chủ động, copy trung tính | `idle` | Không XP/Coin. |

Animation/audio/haptic không bắt buộc replay sau crash/relaunch. Result screen mở lại không tạo reward hoặc terminal transition mới.

### 4.5. Từ Result tới Break hoặc Home

`SL-OPEN-002` được Dũng Lư — Product Owner chốt theo lựa chọn A ngày 2026-08-26. Break entry chỉ thuộc luồng Focus `completed`:

```text
Focus completed
  → Result với committed reward
  → eligible đi tiếp tới Break hoặc Home

Focus failed / cancelled
  → Result không reward
  → Home hoặc thử Focus lại
  → không có Break CTA và không được tạo Break từ terminal result này
```

Rule này xác định eligibility đi từ Focus result vào Break. Loại Break đã được `OPEN-003` chốt:

- Trước khi Long Break đến hạn: Break kế tiếp là Short Break 5 phút.
- Sau bốn completed Focus kể từ completed Long Break gần nhất: Break kế tiếp là Long Break 15 phút.
- `OPEN-010` đã chốt: Break không auto-start; người dùng phải chọn “Bắt đầu nghỉ”.

Sau reward/celebration, completed Result hiển thị “Bắt đầu nghỉ” và “Về Home”. Chỉ thao tác “Bắt đầu nghỉ” mới gửi StartBreak command; failed/cancelled Result không được bắt đầu Break trực tiếp.

Không được tạo Break durable record khi Focus vừa complete, khi Result render hoặc khi app relaunch. Break chỉ tồn tại sau explicit user action và StartBreak transaction commit.

Product Core 1.9.0 đã được đồng bộ outcome gating, Long Break cadence và manual Break start ngày 2026-08-26.

## 5. Reward lifecycle

### 5.1. Reward eligibility

| Session type | Terminal status | XP/Coin eligibility | Lý do/nguồn |
|---|---|---|---|
| Focus | `completed` | `XP = completedFocusMinutes`; `Coin = floor(completedFocusMinutes / 5)` | Product Core 1.10.0 §9.3; Product Core §7.4; Timer Engine §5.6, §9. |
| Focus | `failed` | Không | Product Core §6.2, §7.4. |
| Focus | `cancelled` | Không | Product Core §7.4. |
| Break | `completed` | Không | Reward transaction baseline chỉ gắn với completed Focus; Product Core §7.4 và Timer Engine §5.6. |
| Break | `cancelled` | Không | Cancelled session không reward; Product Core §7.4. |
| Break | `failed` | Không áp dụng; background không tạo failed Break | `SL-OPEN-001` đã `RESOLVED`; Break chỉ complete theo deadline hoặc cancel do user. |

`OPEN-004` đã được Dũng Lư — Product Owner chốt ngày 2026-08-26 và đồng bộ vào Product Core 1.10.0. `completedFocusMinutes` là số phút Focus đã cấu hình của session `completed`; thời gian app reconcile muộn hoặc vượt quá `endsAt` không tạo thêm reward.

### 5.2. Formula và rounding — `OPEN-004` (`RESOLVED`)

```text
xpEarned    = completedFocusMinutes
coinsEarned = floor(completedFocusMinutes / 5)
```

| Focus đã hoàn thành | XP | Coin |
|---:|---:|---:|
| 15 phút | 15 | 3 |
| 25 phút | 25 | 5 |
| 50 phút | 50 | 10 |
| 120 phút | 120 | 24 |

Quy tắc:

- Chỉ Focus `completed` chạy công thức.
- Dùng configured/completed Focus minutes, không dùng thời điểm `resolvedAt - startedAt` và không thưởng overtime.
- Coin dùng integer floor; duration Focus MVP theo bước 5 phút nên các duration hợp lệ thông thường chia hết cho 5.
- Failed/cancelled Focus và mọi Break có XP/Coin bằng 0.
- Reward delta vẫn phải được tính/commit trong completed Focus transaction; Result không tự tính hoặc claim lại.

### 5.3. Atomic automatic grant

Completed Focus phải commit trong một transaction nguyên tử:

1. Conditional transition từ `running` sang `completed`.
2. `resolvedAt`.
3. Một RewardTransaction unique theo `sessionId`.
4. XP/Coin balance delta theo công thức đã duyệt.
5. `rewardClaimedAt`.

Không được có trạng thái durable `completed` nhưng reward eligible chưa được ghi do crash giữa các bước. Unique constraint hoặc atomic equivalent là backstop chống grant hai lần.

### 5.4. Result và side-effect boundary

- Result screen chỉ đọc reward đã commit.
- Không có nút manual claim trong MVP.
- Notification delivery/open không grant reward.
- Celebration, audio, haptic hoặc analytics failure không rollback reward.
- Relaunch sau commit hydrate cùng reward; không replay grant.
- `reward_granted` analytics không phải ledger và có thể mất trong crash window được baseline chấp nhận.

## 6. Relax Mode và Strict Mode Lite

### 6.1. Relax Focus — `LOCKED`

Relax Mode cho phép user chuyển app, khóa màn hình, nghe nhạc hoặc tra cứu tài liệu. Rời app không làm Focus fail.

| Tình huống Relax Focus | Kết quả |
|---|---|
| Background rồi foreground trước deadline | Giữ `running`, remaining derive lại từ timestamp. |
| Background qua deadline | `completed` khi reconcile; reward đúng một lần. |
| Crash/kill trước deadline | Relaunch reconcile; tiếp tục `running` nếu `now < endsAt`. |
| Crash/kill và relaunch sau deadline | `completed` khi reconcile. |
| Notification không giao | Không đổi kết quả hoặc reward eligibility. |

Trace: Product Core §6.1, §7.5; Timer Engine §6, §8.

### 6.2. Strict Focus — `LOCKED`

```text
backgroundedAt = timestamp app rời foreground
violationAt    = backgroundedAt + 10_000

nếu có durable backgroundedAt:
  nếu now >= violationAt AND violationAt <= endsAt → failed
  ngược lại nếu now >= endsAt                     → completed
  ngược lại                                       → running
```

Boundary bắt buộc:

- Foreground trước `violationAt` và trước `endsAt`: giữ `running`, clear `backgroundedAt` atomically trong cùng transaction.
- `violationAt == endsAt`: `failed`.
- `endsAt < violationAt`: deadline thắng; `completed` khi reconcile.
- Foreground đúng `endsAt` với violation chưa tới: `completed`.
- Relaunch thiếu persisted `backgroundedAt`: không suy diễn violation; resolve theo deadline.
- Native app blocking không thuộc MVP.

### 6.3. Strict evidence và grace episode

Mỗi background episode chỉ được đánh giá bằng timestamp đã persist:

1. Lifecycle bridge capture timestamp trước khi enqueue.
2. Background command persist `backgroundedAt` cho active Strict Focus.
3. Safe foreground trong grace reconcile rồi clear field atomically.
4. Background episode mới ghi timestamp mới sau khi episode trước đã clear.
5. Stale event phải tuân theo coordinator event order/timestamp và không được phục hồi một episode đã clear an toàn.

Nếu background write thất bại hoặc database không an toàn, app dùng safe recovery; không invent evidence để fail.

### 6.4. Break không áp dụng Strict — `SL-OPEN-001` (`RESOLVED`)

Quyết định được Dũng Lư — Product Owner/Tech Lead chốt ngày 2026-08-26:

- Break không áp dụng Strict Mode Lite và không có grace/violation lifecycle.
- Rời app, khóa màn hình, crash hoặc kill không làm Break `failed`.
- Break đang `running` resolve `completed` khi `now >= endsAt`, hoặc `cancelled` khi user cancel commit trước completion.
- Break không persist `backgroundedAt` cho mục đích Strict enforcement. Lifecycle diagnostics nếu có không được dùng để đổi Break result.
- Break notification vẫn là best-effort và không phải timer truth.
- Status `failed` trong Mobile MVP chỉ reachable từ Strict Focus violation.

Các lựa chọn đã được cân nhắc khi ra quyết định:

| Lựa chọn | Hành vi | Độ tin cậy/UX | Chi phí/phức tạp |
|---|---|---|---|
| A — Break không áp dụng Strict; rời app không fail Break | Break chỉ `completed` theo deadline hoặc `cancelled` do user | Phù hợp mục tiêu nghỉ và companion-before-punishment; ít fail oan | Thấp; **đã chọn** |
| B — Break kế thừa mode của Focus | Strict Break có thể `failed` sau background quá 10 giây | Nhất quán máy móc với shared engine nhưng có thể phạt user trong lúc nghỉ | Trung bình; thêm UI/copy/test/recovery case |

Product Core 1.9.0 kế thừa Break no-Strict behavior đã đồng bộ ngày 2026-08-26.

## 7. Break lifecycle

### 7.1. Break entry boundary

Break chỉ được tạo qua StartBreak command hợp lệ sau thao tác explicit “Bắt đầu nghỉ” trên completed Result. Điều hướng, countdown UI, reward/celebration completion hoặc relaunch không tự tạo durable Break.

```text
Completed Result + explicit Bắt đầu nghỉ
  → derive Short/Long Break theo cadence `OPEN-003` đã duyệt
  → StartBreak command capture ID + now
  → validate không có active session
  → transaction persist Break status running + timestamps
  → commit
  → render Break Session + Pet breaking
  → best-effort ensure Break completion notification
```

`OPEN-003` khóa type selection và `OPEN-010` khóa manual trigger. Nếu user chọn “Về Home”, không tạo Break; Long Break due state nếu có vẫn được giữ.

### 7.2. Long Break cadence — `OPEN-003` (`RESOLVED`)

Quyết định được Dũng Lư — Product Owner chốt ngày 2026-08-26 và đã đồng bộ vào Product Core 1.8.0:

1. Mốc đầu tiên bắt đầu từ completed Focus đầu tiên nếu chưa từng có completed Long Break.
2. Mỗi Focus `completed` sau completed Long Break gần nhất tăng completed-Focus count của cycle.
3. Focus `failed` hoặc `cancelled` không tăng count.
4. Khi count đạt bốn, Long Break 15 phút trở thành Break kế tiếp cho completed Result.
5. Long Break due state giữ qua relaunch và tiếp tục có hiệu lực nếu user về Home hoặc hoàn thành thêm Focus.
6. Chỉ Long Break `completed` reset cycle; Long Break `cancelled` không reset due state.
7. Trước khi due, Break kế tiếp là Short Break 5 phút.
8. Type selection không tự start Break; user phải chọn “Bắt đầu nghỉ” theo `OPEN-010`.

Implementation có thể derive cadence từ durable history hoặc persist projection/counter có thể kiểm chứng, nhưng behavior phải deterministic, sống qua relaunch và không tạo source of truth mâu thuẫn. Exact field/index thuộc `data-model.md`.

### 7.3. Running Break

- Không có Pause/Resume action.
- Countdown derive từ persisted timestamps.
- User có thể cancel hoặc để Break tiếp tục.
- Pet projection là `breaking`.
- Break không áp dụng Strict; background/lock/crash/kill không làm Break fail.

### 7.4. Resolve Break

| Condition | Terminal result | Reward |
|---|---|---|
| `now >= endsAt` và cancel chưa commit trước | `completed` | Không XP/Coin. |
| User cancel commit khi status còn `running` | `cancelled` | Không XP/Coin. |

Break không có nhánh Strict violation/`failed`. Nếu cancel và completion cạnh tranh, transaction đầu tiên conditional-transition từ `running` thắng như invariant chung.

Completed/cancelled Break commit terminal truth trước UI, notification cleanup hoặc analytics. Break completion không tự start Focus; user trở về Home hoặc bắt đầu Focus mới bằng explicit product flow. Tài liệu hiện có không khóa auto-start Focus, vì vậy draft không tạo behavior đó.

## 8. Crash, kill, relaunch và safe recovery

### 8.1. Startup/foreground reconciliation barrier

```text
App start / foreground
  → mở SQLite + migration
  → tạo dependency graph + SessionCommandCoordinator
  → đọc active session
  → validate durable timestamps
  → reconcile theo mode/deadline/Strict evidence
  → commit terminal result + Focus reward nếu cần
  → hydrate committed projection
  → mới cho phép core mutation từ Presentation
```

Nếu relaunch trước `endsAt`, session tiếp tục `running` khi không có Strict violation. Nếu relaunch tại/sau `endsAt`, session resolve theo Strict precedence. Device restart áp dụng cùng flow từ absolute timestamp; notification không phải truth.

### 8.2. Crash windows

| Crash/kill window | Recovery bắt buộc |
|---|---|
| Trước Start transaction commit | Không có running session; không trình bày như đã start. |
| Sau Start commit, trước notification schedule | Hydrate running session; ensure notification idempotently nếu còn relevant. |
| Trong lúc app chạy trước deadline | Relaunch reconcile; tiếp tục running hoặc fail theo durable Strict evidence. |
| Sau deadline, trước terminal reconciliation | Relaunch resolve terminal từ timestamp/Strict precedence. |
| Sau terminal/reward commit, trước Result render | Hydrate committed terminal truth/reward; không grant lại. |
| Sau terminal commit, trước side effects | Truth giữ nguyên; cleanup/analytics/notification best-effort, transient effect không cần replay. |
| Thiếu `backgroundedAt` sau kill | Không suy diễn Strict violation; resolve theo deadline. |

### 8.3. Safe recovery flow

Khi active timestamp invalid hoặc database read/write thất bại:

```text
Reconcile/command failure
  → không mutate terminal status hoặc reward
  → giữ durable data hiện có
  → Application trả typed recovery error
  → Presentation render recovery_required projection
  → user chọn Retry
      → nếu đọc/validate/commit được: tiếp tục reconciliation bình thường
      → nếu record timestamp hỏng nhưng DB hoạt động: có thể explicit cancel
      → nếu DB tiếp tục unavailable: confirmed full local-data reset là last resort
```

`recovery_required` là application/UI projection, không phải session status. App không được sửa timestamp để ép completion, tự cancel, tự xóa hoặc overwrite dữ liệu.

Stable error code tối thiểu kế thừa Timer Engine:

- `INVALID_SESSION_TIMESTAMP`
- `DATABASE_UNAVAILABLE`
- `DATABASE_WRITE_FAILED`
- `RECOVERY_CANCEL_FAILED`

## 9. Scenario → terminal status → reward matrix

| ID | Tình huống | Terminal status/kết quả | XP/Coin | Trace |
|---|---|---|---|---|
| `SL-SCENARIO-001` | Relax Focus foreground tới `now >= endsAt` | `completed` | Có, đúng một grant | Product Core §6.1, §7.4; Timer §5.6. |
| `SL-SCENARIO-002` | Relax Focus background qua deadline rồi mở lại | `completed` khi reconcile | Có, đúng một grant | Product Core §6.1; Timer `TE-EDGE-008`. |
| `SL-SCENARIO-003` | Strict Focus foreground trước grace và trước deadline | Chưa terminal; giữ `running`, clear `backgroundedAt` | Không grant lúc này | Timer §6.3. |
| `SL-SCENARIO-004` | Strict Focus vắng tới grace; `violationAt < endsAt` | `failed` | Không | Product Core §6.2; Timer §6.2. |
| `SL-SCENARIO-005` | Strict Focus `violationAt == endsAt` | `failed` | Không | Product Core §6.2; Timer `TE-EDGE-004`. |
| `SL-SCENARIO-006` | Strict Focus `endsAt < violationAt`, reconcile sau cả hai | `completed` | Có, đúng một grant | Product Core §6.2; Timer `TE-EDGE-005`. |
| `SL-SCENARIO-007` | Strict Focus relaunch thiếu `backgroundedAt`, `now < endsAt` | Giữ `running` | Không grant lúc này | Product Core §7.6; Timer §6.7. |
| `SL-SCENARIO-008` | Strict Focus relaunch thiếu `backgroundedAt`, `now >= endsAt` | `completed` theo deadline | Có, đúng một grant | Product Core §7.6; Timer §6.7. |
| `SL-SCENARIO-009` | User cancel Focus trước terminal commit | `cancelled` | Không | Product Core §7.4; Timer §5.5. |
| `SL-SCENARIO-010` | Completion commit trước cancel | `completed`; cancel no-op/typed terminal result | Có, không lặp | Timer §9.2. |
| `SL-SCENARIO-011` | Cancel commit trước completion | `cancelled`; reconcile no-op | Không | Timer §9.2. |
| `SL-SCENARIO-012` | Completed Focus, Result mở nhiều lần | Giữ `completed` | Reward cũ; không grant mới | Product Core §7.4; Timer §9. |
| `SL-SCENARIO-013` | Notification permission denied/schedule fail | Theo timestamp/mode, không theo notification | Eligibility không đổi | Product Core §11.1; Timer §8. |
| `SL-SCENARIO-014` | App kill sau completed Focus transaction, trước Result | `completed` khi hydrate | Reward đã commit đúng một lần | System Architecture §6.5; Timer §9.2. |
| `SL-SCENARIO-015` | Break tới deadline | `completed` | Không | Product Core §7.4; Timer §5.6. |
| `SL-SCENARIO-016` | User cancel Break | `cancelled` | Không | Product Core §5.4, §7.4. |
| `SL-SCENARIO-017` | Invalid `endsAt < startedAt` | Không tự terminal; `recovery_required` projection | Không | Product Core §7.7; Timer `TE-EDGE-002`. |
| `SL-SCENARIO-018` | Database fail khi reconcile | Không hiển thị terminal chưa commit; recovery | Không | Product Core §7.7; Timer `TE-EDGE-025`. |
| `SL-SCENARIO-019` | User chỉnh clock tiến | Resolve theo wall clock mới; có thể `completed` sớm | Theo final eligible result | Product Core §7.6; Timer §7. |
| `SL-SCENARIO-020` | User chỉnh clock lùi | Có thể giữ `running` lâu hơn | Chưa grant khi còn running | Product Core §7.6; Timer §7. |
| `SL-SCENARIO-021` | Break background/lock qua deadline | `completed` khi reconcile; không có Strict failure | Không | `SL-OPEN-001` `RESOLVED`; Timer timestamp baseline. |
| `SL-SCENARIO-022` | Completed Focus thứ 1–3; user chọn Bắt đầu nghỉ | Start Short Break 5 phút sau transaction commit | Focus reward đã độc lập commit | Product Core 1.9.0 §5.2, §10.3. |
| `SL-SCENARIO-023` | Failed/cancelled Focus Result | Home hoặc thử Focus lại; không Break CTA/entry | Không | `SL-OPEN-002` `RESOLVED`. |
| `SL-SCENARIO-024` | Completed Focus thứ tư; user chọn Bắt đầu nghỉ | Start Long Break 15 phút sau transaction commit | Focus reward đã độc lập commit | Product Core 1.9.0 §5.2, §10.3. |
| `SL-SCENARIO-025` | Long Break đến hạn nhưng user chọn Về Home/relaunch | Không tạo Break; due state giữ nguyên | Không reward cho Break | Product Core 1.9.0 §5.2, §10.3. |
| `SL-SCENARIO-026` | Long Break đến hạn rồi bị cancel | `cancelled`; due state không reset | Không | Product Core 1.9.0 §5.2. |
| `SL-SCENARIO-027` | Long Break hoàn thành | `completed`; reset cycle về 0 | Không | Product Core 1.9.0 §5.2. |
| `SL-SCENARIO-028` | App crash/kill/relaunch ở completed Result trước khi user chọn Bắt đầu nghỉ | Hydrate Focus result/reward; không tạo running Break | Không reward mới | Product Core 1.9.0 §10.3; `OPEN-010` `RESOLVED`. |

## 10. Edge cases

| ID | Edge case | Hành vi bắt buộc | Trạng thái |
|---|---|---|---|
| `SL-EDGE-001` | `now == endsAt` | Complete nếu Strict violation không thắng precedence. | `BASELINE`. |
| `SL-EDGE-002` | `now < startedAt` do clock lùi | Giữ `running` theo wall clock. | `BASELINE`. |
| `SL-EDGE-003` | `endsAt < startedAt`/timestamp invalid | Safe recovery; không terminal/reward. | `BASELINE`. |
| `SL-EDGE-004` | Strict foreground đúng trước `violationAt` | Giữ running và clear episode atomically. | `BASELINE`. |
| `SL-EDGE-005` | Strict foreground đúng `violationAt`, với `violationAt <= endsAt` | `failed`. | `LOCKED`. |
| `SL-EDGE-006` | Deadline nằm trong grace (`endsAt < violationAt`) | `completed` khi deadline tới. | `LOCKED`. |
| `SL-EDGE-007` | Kill không phát lifecycle event | Không invent `backgroundedAt`; deadline-based recovery. | `BASELINE`. |
| `SL-EDGE-008` | Stale notification được tap nhiều lần | Mỗi tap chỉ reconcile/read truth; không đổi terminal/reward. | `BASELINE`. |
| `SL-EDGE-009` | Hai reconciliation đồng thời | Single-flight + DB backstop; một committed result. | `BASELINE`. |
| `SL-EDGE-010` | Reward unique conflict khi retry | Không cộng balance lần hai; transaction xử lý idempotently. | `BASELINE`. |
| `SL-EDGE-011` | Result route mở trước commit | Không render success/reward như truth; chờ typed application result/projection. | `BASELINE`. |
| `SL-EDGE-012` | Side effect fail sau commit | Không rollback truth; actionable notification warning nếu phù hợp. | `BASELINE`. |
| `SL-EDGE-013` | Cancel terminal session | `SESSION_ALREADY_TERMINAL`; no mutation. | `BASELINE`. |
| `SL-EDGE-014` | Pause/Resume được gọi | Typed not-supported error; no mutation/side effect. | `BASELINE`. |
| `SL-EDGE-015` | Database fail khi explicit recovery cancel | Giữ dữ liệu; `RECOVERY_CANCEL_FAILED`; không reward. | `BASELINE`. |
| `SL-EDGE-016` | Reconcile completed Focus sau deadline rất lâu | Reward dùng configured completed Focus minutes; overtime không tăng XP/Coin. | `RESOLVED` theo `OPEN-004`. |
| `SL-EDGE-017` | Focus thứ tư complete | Long Break trở thành type kế tiếp nhưng không tự start. | `RESOLVED` theo `OPEN-003`/`OPEN-010`. |
| `SL-EDGE-018` | User rời completed Result mà chưa chọn Bắt đầu nghỉ | Focus terminal/reward không đổi; không tạo Break record; due state giữ nguyên. | `RESOLVED` theo `OPEN-010`. |
| `SL-EDGE-019` | Break rời app quá 10 giây | Giữ `running` trước deadline hoặc `completed` khi deadline tới; không `failed`. | `RESOLVED` theo `SL-OPEN-001`. |
| `SL-EDGE-020` | User ở failed/cancelled Result cố gọi StartBreak trực tiếp | Reject bằng typed eligibility error; không tạo running Break. | `RESOLVED` theo `SL-OPEN-002`; exact error code thuộc Application/Data Model review. |

## 11. Documentation boundaries và open decisions

### 11.1. Product decisions

| Product ID | Câu hỏi | Ảnh hưởng trong Session Lifecycle | Trạng thái |
|---|---|---|---|
| `OPEN-003` | Long Break có tự động sau mỗi bốn completed Focus không? | Long Break due sau bốn completed Focus; sticky qua relaunch; reset khi Long Break completed; không tự quyết định start. | `RESOLVED` ngày 2026-08-26; Product Core 1.8.0. |
| `OPEN-004` | Công thức XP/Coin đề xuất có được chốt không? | `XP = completedFocusMinutes`; `Coin = floor(completedFocusMinutes / 5)`; không thưởng overtime. | `RESOLVED` ngày 2026-08-26; Product Core 1.10.0. |
| `OPEN-010` | Có tự động bắt đầu Break sau Focus completed không? | Không auto-start; user chọn “Bắt đầu nghỉ” hoặc “Về Home”; Break chỉ tạo sau explicit StartBreak action. | `RESOLVED` ngày 2026-08-26; Product Core 1.9.0. |

`OPEN-003`, `OPEN-004` và `OPEN-010` đã được cập nhật ở Product Core 1.10.0. Timer Engine 1.0.1 đã đồng bộ các tham chiếu `OPEN-003`/`OPEN-010` bằng maintenance update được Dũng Lư phê duyệt; không thay đổi timer semantics.

### 11.2. Session Lifecycle decisions

| ID | Câu hỏi cần Dũng Lư chốt | Đề xuất hiện tại | Owner | Trạng thái |
|---|---|---|---|---|
| `SL-OPEN-001` | Break có áp dụng Strict/grace 10 giây hay luôn không fail vì background? | Break không áp dụng Strict; chỉ complete theo deadline hoặc cancel. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-26. |
| `SL-OPEN-002` | Break CTA có được đưa ra sau `failed`/`cancelled` Focus hay chỉ sau `completed`? | Chỉ completed Focus eligible đi tới Break; failed/cancelled đưa Home hoặc thử lại. | Dũng Lư — Product Owner | `RESOLVED` ngày 2026-08-26. |

### 11.3. Đánh giá đã dùng cho `SL-OPEN-002`

| Lựa chọn | Hành vi | Độ tin cậy/UX | Chi phí/phức tạp |
|---|---|---|---|
| A — Chỉ completed Focus đưa CTA Break | Failure/cancel Result đưa Home hoặc thử Focus lại | Loop Focus → Reward → Break rõ; tránh coi phiên chưa hoàn thành là một Pomodoro cycle | Thấp; **đã chọn** |
| B — Mọi Focus terminal result đều đưa CTA Break | Completed/failed/cancelled đều có thể start Break | Linh hoạt và bám flow tổng quát “Result → Break hoặc Home”, nhưng cycle/reward meaning kém rõ | Thấp–trung bình; thêm copy/test theo outcome |

`SL-OPEN-001`, `SL-OPEN-002`, `OPEN-003`, `OPEN-004` và `OPEN-010` đều đã được chốt.

### 11.4. Out of scope/deferred

- Native app blocking/allowlist.
- Pause/Resume Focus hoặc Break.
- Server clock, anti-cheat backend hoặc cloud reconciliation.
- Authentication, sync, multi-device conflict.
- Live Activities, Dynamic Island, widget hoặc server push.
- Manual reward claim/revive token.
- Pet animation timing/priority và game economy chưa duyệt.
- History local-day/timezone semantics ngoài timer truth.

## 12. Traceability tới checklist

| Checklist Session Lifecycle | Vị trí trong draft | Trạng thái |
|---|---|---|
| Định nghĩa four statuses | Mục 3 | Đã có baseline normative. |
| Focus → Reward → Break | Mục 4, 5, 7 | Outcome gating, Break type/cadence và manual start đã chốt. |
| Relax Mode | Mục 6.1 | Đã khóa theo Product Core/Timer Engine. |
| Strict Mode Lite + grace 10 giây | Mục 6.2–6.4 | Đã khóa cho Focus; Break không áp dụng Strict theo `SL-OPEN-001` đã `RESOLVED`. |
| Crash/relaunch/sau `endsAt` | Mục 8 | Đã mô tả theo Timer Engine. |
| XP/Coin eligibility | Mục 5.1–5.2 | Đã chốt eligibility, formula và rounding theo Product Core 1.10.0. |
| Tình huống → status → reward | Mục 9 | Đã có. |
| Edge cases/recovery | Mục 8, 10 | Đã có. |
| Acceptance criteria success/failure | Mục 14 | Đã đầy đủ theo các decision đã chốt và được reviewer phê duyệt. |
| Review/phê duyệt | Mục 13–15 | Dũng Lư đã review/phê duyệt ngày 2026-08-26. |

## 13. Decision table

### 13.1. Resolved/baseline decisions

| ID/phạm vi | Quyết định | Nguồn authority | Trạng thái |
|---|---|---|---|
| Status model | Chỉ `running`, `completed`, `failed`, `cancelled`; terminal không quay lại running. | Product Core §7.2–7.3 | `LOCKED`. |
| No pause | Focus/Break không Pause/Resume; không `pausedAt`. | Product Core §5.4; Timer `TE-OPEN-001/002` | `BASELINE`. |
| Clock | Unix epoch ms UTC, device wall clock, `now >= endsAt`. | Product Core §7.6; Timer `TE-OPEN-004/005` | `BASELINE`. |
| Strict recovery | Chỉ fail khi có persisted evidence; missing `backgroundedAt` resolve theo deadline. | Product Core §7.6; Timer `TE-OPEN-006` | `BASELINE`. |
| Grace clear | Safe foreground trong grace clear `backgroundedAt` atomically. | Product Core §7.6; Timer `TE-OPEN-007` | `BASELINE`. |
| Notification | Ensure/cancel idempotent; notification không là truth. | Product Core §11.1; Timer `TE-OPEN-008` | `BASELINE`. |
| Focus reward | Automatic atomic grant khi completed; Result không manual claim. | Product Core §7.4; Timer `TE-OPEN-009` | `BASELINE`. |
| Safe recovery | Invalid timestamp/DB failure không terminal/reward; Retry, explicit cancel, confirmed reset fallback. | Product Core §7.7; Timer `TE-OPEN-010` | `BASELINE`. |
| `SL-OPEN-001` | Break không áp dụng Strict; background không làm Break fail. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-26. |
| `SL-OPEN-002` | Chỉ completed Focus eligible đi tiếp tới Break; failed/cancelled không có Break CTA/entry. | Dũng Lư — Product Owner | `RESOLVED` ngày 2026-08-26. |
| Product `OPEN-003` | Long Break đến hạn sau bốn completed Focus, sticky qua relaunch và reset khi completed Long Break. | Product Core 1.8.0 | `RESOLVED` ngày 2026-08-26. |
| Product `OPEN-010` | Break không auto-start; chỉ explicit “Bắt đầu nghỉ” và committed StartBreak transaction tạo running Break. | Product Core 1.9.0 | `RESOLVED` ngày 2026-08-26. |
| Product `OPEN-004` | Completed Focus nhận XP bằng configured minutes và Coin bằng `floor(minutes / 5)`; overtime không thưởng thêm. | Product Core 1.10.0 | `RESOLVED` ngày 2026-08-26. |

### 13.2. Open decisions

Không còn Session Lifecycle hoặc Product decision mở ảnh hưởng trực tiếp tới phạm vi tài liệu này. Các Product Core decision khác như Pet mặc định, shop price hoặc contribution color vẫn ngoài phạm vi và không được tài liệu này tự chốt.

## 14. Acceptance criteria

Các acceptance criteria dưới đây phản ánh toàn bộ Session Lifecycle/Product decision đã được Dũng Lư chốt trong phạm vi tài liệu này.

### 14.1. Status và transaction correctness

- [ ] Session chỉ persist `running`, `completed`, `failed` hoặc `cancelled`.
- [ ] `completed`, `failed`, `cancelled` không transition ngược hoặc đổi terminal result.
- [ ] Operational/recovery state không được persist như session status mới.
- [ ] Focus/Break không có Pause/Resume action, paused status hoặc `pausedAt`.
- [ ] Start chỉ được trình bày thành công sau durable transaction commit.
- [ ] Chỉ có một active Focus/Break session hợp lệ.
- [ ] Cancel/completion race cho kết quả theo transaction đầu tiên conditional-transition từ `running`.
- [ ] Startup reconciliation barrier hoàn tất trước core mutation mới từ Presentation.

### 14.2. Successful Focus flow

- [ ] Relax Focus foreground tới deadline resolve `completed` tại `now >= endsAt`.
- [ ] Relax Focus background/kill qua deadline resolve `completed` khi relaunch/foreground.
- [ ] Strict Focus có `endsAt < violationAt` resolve `completed` khi deadline tới.
- [ ] Completed Focus commit terminal status, RewardTransaction, XP/Coin và `rewardClaimedAt` atomically.
- [ ] Completed Focus nhận `XP = completedFocusMinutes` và `Coin = floor(completedFocusMinutes / 5)`.
- [ ] Reward dùng configured Focus minutes; reconcile muộn/overtime không tăng reward.
- [ ] Các ví dụ 15/25/50/120 phút lần lượt cho 15/25/50/120 XP và 3/5/10/24 Coin.
- [ ] Completed Focus chỉ có tối đa một reward grant theo `sessionId` khi reconcile/result/notification bị retry.
- [ ] Result hiển thị duration và committed reward; không có manual claim trigger.
- [ ] Pet/result side effect failure không rollback completion/reward.
- [ ] Chỉ completed Focus eligible đi tiếp tới Break; Result hiển thị “Bắt đầu nghỉ” và “Về Home”.
- [ ] Break chỉ được tạo sau explicit “Bắt đầu nghỉ” và StartBreak transaction commit.
- [ ] Crash/kill/relaunch trước explicit action không tự tạo Break.

### 14.3. Failed/cancelled Focus flow

- [ ] Strict Focus có durable `backgroundedAt`, `now >= violationAt` và `violationAt <= endsAt` resolve `failed`.
- [ ] `violationAt == endsAt` resolve `failed`.
- [ ] Failed Focus không nhận XP/Coin và dùng copy không phán xét.
- [ ] User cancel Focus khi persisted status còn `running` resolve `cancelled` và không reward.
- [ ] Cancel sau terminal commit không đổi result/reward.
- [ ] Failed/cancelled Result chỉ render committed truth.
- [ ] Failed/cancelled Result chỉ đưa Home hoặc thử Focus lại; không hiển thị Break CTA và không cho StartBreak trực tiếp.

### 14.4. Grace, crash và recovery

- [ ] Strict foreground trước grace và deadline giữ `running`, clear `backgroundedAt` atomically.
- [ ] Strict relaunch thiếu `backgroundedAt` không tự fail; resolve theo deadline.
- [ ] Relaunch trước deadline hydrate running session khi không có violation.
- [ ] Relaunch sau deadline resolve theo Strict precedence trước khi render final truth.
- [ ] Device restart dùng persisted absolute timestamp + device wall clock.
- [ ] Notification denied/missing/stale không thay terminal result hoặc reward eligibility.
- [ ] Invalid timestamp/database failure không tự terminal/reward và render `recovery_required` với Retry.
- [ ] Explicit recovery cancel chỉ transition accessible corrupt record còn `running` sang `cancelled`.
- [ ] Full local-data reset chỉ xuất hiện như last resort có cảnh báo/xác nhận; app không tự xóa dữ liệu.

### 14.5. Break flow

- [ ] StartBreak chỉ render running sau durable commit và không tạo nhiều active session.
- [ ] Break không có Pause/Resume.
- [ ] Completed Break không nhận XP/Coin.
- [ ] Cancelled Break không nhận XP/Coin.
- [ ] Break notification ensure/cancel idempotent và không quyết định result.
- [ ] Break background/lock/crash/kill không chuyển `failed`; trước deadline giữ `running`, tại/sau deadline resolve `completed` nếu cancel chưa commit trước.
- [ ] Break không persist/use `backgroundedAt` cho Strict enforcement.
- [ ] Completed Focus thứ 1–3 kể từ completed Long Break gần nhất chọn Short Break 5 phút.
- [ ] Completed Focus thứ tư làm Long Break 15 phút đến hạn.
- [ ] Long Break due state sống qua relaunch và không mất khi user về Home hoặc hoàn thành thêm Focus.
- [ ] Failed/cancelled Focus không tăng Long Break cycle count.
- [ ] Cancelled Long Break không reset due state; completed Long Break reset cycle.
- [ ] Chọn “Về Home” không tạo Break và không làm mất Long Break due state.

### 14.6. Test matrix tối thiểu

| Cấp test | Phạm vi Session Lifecycle |
|---|---|
| Domain unit | Four-status transition, Strict Focus precedence/boundaries, Break no-Strict rule, terminal invariant, reward eligibility fact. |
| Application unit | Focus → reward → result projection, Result/Break policy sau khi duyệt, typed errors, coordinator race. |
| SQLite integration | Active-session invariant, conditional terminal transition, atomic Focus reward, unique reward `sessionId`. |
| Mobile integration | Relax/Strict lifecycle bridge, notification failure/stale tap, startup recovery barrier. |
| Device/simulator | Background trong/ngoài grace, crash/kill/relaunch trước/sau deadline, device restart và wall-clock change. |

Test reward formula phải dùng exact integer values đã chốt và vẫn chứng minh retry/result/notification không grant lần hai.

## 15. Review và phát hành

Session Lifecycle `1.0.0` được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26 sau khi xác nhận:

1. `SL-OPEN-001` và `SL-OPEN-002` đã `RESOLVED`.
2. Product Core 1.10.0 đã đồng bộ Break no-Strict, Result → Break outcome gating, `OPEN-003`, `OPEN-004` và `OPEN-010`.
3. Decision table, scenario matrix và acceptance criteria phản ánh các quyết định đã duyệt.
4. Timer Engine 1.0.1 đã đồng bộ hai tham chiếu `OPEN-003`/`OPEN-010` mà không thay đổi timer semantics.
5. Không có enum/term mâu thuẫn với baseline đã hoàn thành trong phạm vi hiện tại.
6. Technical Documentation Checklist được phép cập nhật mục Session Lifecycle thành hoàn thành.

Các checkbox ở mục 14 là implementation acceptance criteria và vẫn để trống cho tới khi có test/device evidence; việc phê duyệt specification không được dùng thay cho implementation verification.

## 16. Change log

### 1.0.0 — 2026-08-26

- Dũng Lư — Tech Lead/Product Owner review và phê duyệt toàn bộ Session Lifecycle Specification.
- Chuyển trạng thái tài liệu từ `DRAFT` sang `APPROVED` sau khi toàn bộ Session Lifecycle/Product decision ảnh hưởng trực tiếp đã `RESOLVED`.
- Xác nhận Product Core 1.10.0 và Timer Engine 1.0.1 đã được đồng bộ; không thay đổi baseline timer semantics.
- Phát hành Session Lifecycle 1.0.0 làm baseline cho Pet State Machine, Gamification Rules, Data Model và Mobile MVP implementation.

### 0.6.1 — 2026-08-26

- Đồng bộ direct baseline sang Timer Engine 1.0.1 sau maintenance update được Dũng Lư phê duyệt.
- Xác nhận hai tham chiếu `OPEN-003`/`OPEN-010` đã được cập nhật và không có thay đổi timer semantics.
- Hoàn tất kiểm tra điều kiện đồng bộ baseline trước khi trình Session Lifecycle phê duyệt.

### 0.6.0 — 2026-08-26

- Dũng Lư — Product Owner chốt Product `OPEN-004` theo đề xuất A; đồng bộ Product Core 1.10.0.
- Chốt completed Focus nhận XP bằng configured Focus minutes và Coin bằng `floor(completedFocusMinutes / 5)`.
- Quy định overtime/reconcile muộn không tăng reward; failed/cancelled Focus và mọi Break không nhận XP/Coin.
- Thêm formula examples, rounding rule, edge case và acceptance criteria; không còn decision mở ảnh hưởng trực tiếp tới Session Lifecycle.
- Không sửa Timer Engine 1.0.0 hoặc checklist; tài liệu vẫn `DRAFT` chờ kiểm tra chéo và phê duyệt.

### 0.5.0 — 2026-08-26

- Dũng Lư — Product Owner chốt Product `OPEN-010` theo đề xuất A; đồng bộ Product Core 1.9.0.
- Chốt Break không auto-start; completed Result hiển thị “Bắt đầu nghỉ” và “Về Home”.
- Quy định chỉ explicit action + committed StartBreak transaction tạo running Break; crash/kill/relaunch trước action không được tự tạo Break.
- Giữ automatic Short/Long type selection độc lập với manual start; về Home không làm mất Long Break due state.
- Cập nhật flow, scenario/edge-case matrix, decision table và acceptance criteria; không sửa Timer Engine 1.0.0 hoặc checklist.

### 0.4.0 — 2026-08-26

- Dũng Lư — Product Owner chốt Product `OPEN-003` theo đề xuất A; đồng bộ Product Core 1.8.0.
- Chốt Long Break 15 phút đến hạn sau bốn completed Focus kể từ completed Long Break gần nhất; due state giữ qua relaunch.
- Chốt failed/cancelled Focus không tăng count, cancelled Long Break không reset due và completed Long Break reset cycle.
- Tách automatic type selection khỏi `OPEN-010` về manual/auto-start trigger.
- Cập nhật flow, scenario/edge-case matrix, decision table và acceptance criteria; không sửa Timer Engine 1.0.0 hoặc checklist.

### 0.3.0 — 2026-08-26

- Dũng Lư — Product Owner chốt `SL-OPEN-002` theo đề xuất A.
- Chốt chỉ completed Focus eligible đi tiếp tới Break; failed/cancelled Result chỉ đưa Home hoặc thử Focus lại và không có Break CTA/entry.
- Giữ `OPEN-003` cho Long Break selection/cycle và `OPEN-010` cho manual/auto trigger; không tạo Break record trước StartBreak transaction được policy đã duyệt kích hoạt.
- Cập nhật lifecycle flow, scenario/edge-case matrix, decision table và acceptance criteria.
- Ghi nhu cầu đồng bộ outcome gating vào Product Core trước hoặc đồng thời với approval; chưa sửa Product Core, checklist hoặc baseline đã duyệt.

### 0.2.0 — 2026-08-26

- Dũng Lư — Product Owner/Tech Lead chốt `SL-OPEN-001` theo đề xuất A.
- Quy định Break không áp dụng Strict/grace/violation; background, lock, crash hoặc kill không làm Break `failed`.
- Chốt Break chỉ resolve `completed` theo deadline hoặc `cancelled` khi user cancel commit trước; Break không nhận XP/Coin.
- Cập nhật reward/scenario/edge-case matrix, decision table và acceptance criteria cho Break no-Strict behavior.
- Ghi nhu cầu đồng bộ rule vào Product Core trước hoặc đồng thời với approval; chưa sửa Product Core, checklist hoặc baseline đã duyệt.

### 0.1.0 — 2026-08-26

- Tạo draft Session Lifecycle từ Product Core 1.7.0, checklist, Technical Overview 1.0.0, System Architecture 1.0.0, Project Structure 1.0.0, Timer Engine 1.0.0 và ADR-001 đến ADR-008.
- Định nghĩa four-status lifecycle, Focus → automatic reward → Result → Break/Home boundary, Relax/Strict behavior và crash/kill/relaunch recovery.
- Kế thừa nguyên vẹn Unix epoch milliseconds UTC, `now >= endsAt`, device wall clock, evidence-based Strict recovery, atomic grace clearing, notification idempotency, atomic completed Focus reward và safe recovery.
- Thêm reward eligibility/scenario/edge-case matrix và acceptance criteria cho success/failure flow.
- Giữ Product `OPEN-003`, `OPEN-004`, `OPEN-010` nguyên trạng; không chọn Long Break cycle, reward formula hoặc auto-start Break.
- Ghi `SL-OPEN-001` cho Strict scope của Break và `SL-OPEN-002` cho Break CTA sau failed/cancelled Focus; cả hai chờ Dũng Lư xác nhận.
- Không sửa Product Core, checklist, baseline kiến trúc, Timer Engine hoặc ADR.
