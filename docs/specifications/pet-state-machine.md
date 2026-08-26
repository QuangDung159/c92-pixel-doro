---
document_id: PIXELDORO_PET_STATE_MACHINE_SPECIFICATION
title: PixelDoro Mobile MVP — Pet State Machine Specification
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
  - pet_state_machine
authority: TERTIARY
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
timer_engine_baseline: ./timer-engine.md
session_lifecycle_baseline: ./session-lifecycle.md
---

# PixelDoro Mobile MVP — Pet State Machine Specification

## 0. Vai trò, phạm vi và trạng thái quyết định

Tài liệu này đặc tả Pet state machine của PixelDoro Mobile MVP, gồm:

- Ý nghĩa của `idle`, `working`, `breaking`, `celebrating` và `bugged`.
- Cách derive Pet state từ session truth đã commit.
- State diagram và transition table.
- Animation loop, animation one-shot, priority và preemption.
- Thời gian giữ `celebrating`/`bugged`.
- Fallback khi asset/animation không tải được và reduced-motion behavior.
- Edge case cùng acceptance criteria cho từng Pet state.

Tài liệu này không quyết định lại session/timer/reward truth và không quyết định:

- Pet mặc định là Cat, Dog hay Robot; Product `OPEN-001` vẫn `OPEN`.
- Tên Pet trong onboarding; Product `OPEN-009` vẫn `OPEN`.
- Item, shop, price, inventory content hoặc Product `OPEN-005`.
- Contribution graph color threshold hoặc Product `OPEN-006`.
- Pet evolution, Happiness, Energy hoặc nội dung `DEFERRED`.
- Sprite artwork, frame count hoặc loài-specific motion trước khi Art/Product chốt asset tương ứng.

Nếu có mâu thuẫn, Product Core 1.10.0 là nguồn sự thật sản phẩm ưu tiên cao nhất. Technical Overview 1.0.0, System Architecture 1.0.0, Project Structure 1.0.0, Timer Engine 1.0.1, Session Lifecycle 1.0.0 và ADR-001 đến ADR-008 là baseline đã duyệt.

### 0.1. Trạng thái quyết định

| Trạng thái | Ý nghĩa |
|---|---|
| `LOCKED` | Đã được Product Core khóa; implementation phải tuân theo. |
| `BASELINE` | Đã được tài liệu kỹ thuật/ADR có authority cao hơn chấp nhận; tài liệu này chỉ trace và chi tiết hóa. |
| `PROPOSED` | Phương án đang đề xuất; chưa phải requirement và không được dùng để khóa implementation/acceptance test. |
| `RESOLVED` | Quyết định Pet State Machine đã được Dũng Lư xác nhận. |
| `OPEN` | Chưa quyết định; không được tự suy diễn khi triển khai hoặc viết test. |
| `DEFERRED` | Không thuộc Mobile MVP. |

Phiên bản `1.0.0` đã được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26. `PSM-OPEN-001` đến `PSM-OPEN-004` đều `RESOLVED`; không còn Pet State Machine decision ở trạng thái `OPEN` trong phạm vi hiện tại.

### 0.2. Authority và traceability

| Nguồn | Phiên bản/trạng thái | Rule được kế thừa |
|---|---|---|
| `PIXELDORO_CORE_TRUTH.md` | 1.10.0 `ACTIVE` | Năm Pet state, mapping, companion principle, Break no-Strict và durable session/reward truth. |
| `TECHNICAL_DOCUMENTATION_CHECKLIST.md` | Hiện hành | Definition of done của Pet State Machine. |
| `architecture/technical-overview.md` | 1.0.0 `APPROVED` | Reanimated + bundled sprite baseline, ephemeral visual state, reduced motion, performance/battery rule. |
| `architecture/system-architecture.md` | 1.0.0 `APPROVED` | Pet state là Domain mapping/Presentation projection; durable commit trước transient side effect. |
| `architecture/project-structure.md` | 1.0.0 `APPROVED` | Sprite sheet mỗi Pet state, typed static catalog/manifest, stable asset ID và fallback boundary. |
| `specifications/timer-engine.md` | 1.0.1 `APPROVED` | Timer/session reconciliation, terminal truth, recovery và side-effect idempotency. |
| `specifications/session-lifecycle.md` | 1.0.0 `APPROVED` | Baseline trực tiếp cho Focus/Break/result → Pet mapping và crash/relaunch behavior. |
| ADR-005 | `ACCEPTED_WITH_GATE` | Reanimated + bundled sprite; Skia chưa thuộc baseline; static/sprite fallback bắt buộc. |

## 1. Nguyên tắc và invariant

1. Pet state là projection của session truth đã commit cộng với transient visual feedback; Pet state không phải durable session/reward truth. `LOCKED`/`BASELINE`.
2. Animation không được complete, fail, cancel, start session hoặc grant/revoke reward. `LOCKED`.
3. UI không đổi Pet state terminal chỉ vì countdown chạm `0`, notification được giao hoặc route Result được mở; phải chờ reconciliation/transaction commit. `BASELINE`.
4. Animation/audio/haptic failure, interruption hoặc absence không rollback session/reward truth đã commit. `BASELINE`.
5. Pet animation dùng Reanimated + bundled sprite asset. Skia không thuộc dependency baseline và chỉ được xem xét theo gate của ADR-005. `BASELINE`.
6. Core Pet asset không phụ thuộc mạng; screen/component chỉ truy cập qua typed static catalog/manifest. `BASELINE`.
7. Animation không nhìn thấy phải dừng khi app background hoặc screen unmount để bảo vệ pin/hiệu năng. `BASELINE`.
8. Countdown, result và action quan trọng phải có text/semantic label; sprite không được là nguồn duy nhất truyền đạt session result. `BASELINE`.
9. Reduced motion và asset failure dùng visual fallback nhưng không tạo thêm Pet state hoặc session status. `BASELINE`.
10. Không có Pet state `failed`, `completed`, `paused`, `loading` hoặc `recovery_required`; các khái niệm này thuộc session/application projection, không phải Pet-state enum. `LOCKED`/`BASELINE`.

## 2. Pet state model

### 2.1. Enum duy nhất — `LOCKED`

```ts
type PetState =
  | 'idle'
  | 'working'
  | 'breaking'
  | 'celebrating'
  | 'bugged';
```

Không thêm loài Pet, evolution stage hoặc mood/energy state vào enum này. Pet identity được biểu diễn độc lập bằng stable `<pet-id>` và Product `OPEN-001` vẫn chưa được chốt.

### 2.2. Base state và transient feedback state

Để không biến animation thành durable truth, state machine phân biệt hai lớp khái niệm:

| Lớp | State | Nguồn | Vòng đời |
|---|---|---|---|
| Base projection | `idle`, `working`, `breaking` | Active session truth đã commit | Derive lại bất kỳ lúc nào từ durable projection. |
| Transient feedback | `celebrating`, `bugged` | Terminal Focus result vừa commit | Visual one-shot ngắn hạn; không persist như session/Pet-profile truth. |

Sau khi transient feedback kết thúc hoặc bị một truth mới có priority cao hơn preempt, Presentation derive lại base state từ active session hiện tại. Duration, preemption và replay áp dụng các quyết định `PSM-OPEN-001` đến `PSM-OPEN-003` đã `RESOLVED`.

### 2.3. State definitions

| Pet state | Điều kiện vào | Hành vi hình ảnh | Điều kiện rời | Trạng thái rule |
|---|---|---|---|---|
| `idle` | Không có active Focus/Break và không có terminal one-shot hợp lệ đang được trình bày | Loop nhẹ: ngồi, nhìn quanh hoặc tương tác nhẹ; reduced motion dùng still pose | Start Focus/Break commit hoặc terminal one-shot được chấp nhận | Mapping `LOCKED`; loop semantics `BASELINE`; arbitration `RESOLVED`. |
| `working` | Focus status `running` đã commit | Loop làm việc như gõ máy/đọc sách/đeo tai nghe; artwork cụ thể không được tài liệu này chốt | Focus commit `completed`/`failed`/`cancelled`, hoặc recovery projection ngăn render truth | Mapping `LOCKED`; loop semantics `BASELINE`. |
| `breaking` | Short/Long Break status `running` đã commit | Loop nghỉ như ngủ/uống cà phê/vươn vai; artwork cụ thể không được tài liệu này chốt | Break commit `completed`/`cancelled`, hoặc recovery projection ngăn render truth | Mapping `LOCKED`; Break no-Strict `LOCKED`/`RESOLVED` upstream. |
| `celebrating` | Focus status `completed` vừa commit trong context được phép phát transient feedback | One-shot phản hồi tích cực; không block navigation/input | Sau 2.000 ms hoặc bị truth mới preempt | Trigger `LOCKED`; duration/replay/preemption `RESOLVED`. |
| `bugged` | Strict Focus status `failed` vừa commit trong context được phép phát transient feedback | One-shot bug/buồn ngắn hạn, không guilt-heavy và không gây mất progress | Sau 1.500 ms hoặc bị truth mới preempt | Trigger `LOCKED`; duration/replay/preemption `RESOLVED`. |

## 3. Mapping từ timer/session truth sang Pet state

### 3.1. Mapping đã duyệt — `LOCKED`

| Timer/session truth đã commit | Pet state |
|---|---|
| Không có active session | `idle` |
| Focus `running` | `working` |
| Break `running` | `breaking` |
| Focus `completed` | `celebrating` |
| Strict Focus `failed` | `bugged` |
| Focus hoặc Break `cancelled` | `idle` |

Các hệ quả bắt buộc:

- Break không áp dụng Strict và không có nhánh `failed` do background/lock/crash/kill.
- Break `completed` không trigger `celebrating`; khi không có active session, base state là `idle`.
- Cancel không trigger one-shot thưởng/phạt; Pet về `idle` sau terminal commit nếu không có active session khác.
- `celebrating` chỉ phản hồi completed Focus; reward đã được commit atomically trước khi animation được yêu cầu.
- `bugged` chỉ phản hồi Strict Focus failed; không xóa XP/Coin/progress đã có và không làm Pet chết/bị hỏng vĩnh viễn.

### 3.2. Derivation boundary — `BASELINE`

```text
Committed application projection
  → kiểm tra recovery/bootstrap barrier
  → derive base state từ active session
  → xem xét terminal feedback request hợp lệ
  → animation arbiter chọn state được render
  → Presentation chạy sprite/static fallback
```

- Domain có thể cung cấp hàm mapping thuần từ committed session fact sang Pet-state decision.
- Application/Presentation chịu trách nhiệm lifecycle của transient animation request; request này không được ghi vào session/reward record.
- Zustand có thể giữ animation request/progress tạm thời, nhưng phải dựng lại base state từ durable projection và không trở thành nguồn sự thật thứ hai.
- `recovery_required` không được map thành `idle`, `working`, `breaking`, `celebrating` hoặc `bugged` khi durable truth không thể validate. Presentation dùng recovery visual riêng theo mục 9.

## 4. State diagram

```text
                              StartFocus commit
                         ┌────────────────────────┐
                         │                        ▼
                      [IDLE]                 [WORKING]
                        ▲  ▲                  │   │   │
                        │  │       cancel     │   │   │ Strict failed commit
                        │  └──────────────────┘   │   └────────────────────► [BUGGED]*
                        │                         │                               │
                        │                         │ Focus completed commit         │ one-shot ends
                        │                         └──────────────────────────────► [CELEBRATING]*
                        │                                                         │
                        └──────────────────── one-shot ends ──────────────────────┘

                      [IDLE]
                        │  ▲
       StartBreak commit│  │ Break completed/cancelled commit
                        ▼  │
                    [BREAKING]

* `CELEBRATING` và `BUGGED` là transient visual feedback, không phải durable
  session/reward truth. Hết hold time sẽ derive lại base state; truth mới có
  priority cao hơn được phép preempt theo rule đã duyệt.

Completed Focus → Break không phải transition tự động:
  [CELEBRATING]/completed Result
    → user chọn “Bắt đầu nghỉ”
    → StartBreak transaction commit
    → [BREAKING]
```

Diagram không tạo đường `BREAKING → BUGGED`: Break background không fail. Diagram cũng không tạo `WORKING → BREAKING` trực tiếp trước completed Focus + explicit StartBreak commit.

## 5. Transition table

| State đang render | Event/fact mới | Guard | State kế tiếp | Animation action | Ảnh hưởng durable truth |
|---|---|---|---|---|---|
| `idle` | Start Focus success | Running Focus đã commit | `working` | Start/restart working loop | Không; chỉ phản ánh truth đã commit. |
| `idle` | Start Break success | Running Break đã commit sau explicit action | `breaking` | Start/restart breaking loop | Không. |
| `working` | Display tick | Focus vẫn persist `running` | `working` | Tiếp tục loop; không restart mỗi tick | Không. |
| `working` | Focus completed | Terminal + reward transaction đã commit | `celebrating` | Stop loop, request one-shot | Không grant reward từ animation. |
| `working` | Strict Focus failed | Terminal failed đã commit | `bugged` | Stop loop, request one-shot | Không reward; animation không tạo failure. |
| `working` | Focus cancelled | Cancel đã commit | `idle` | Stop working, start idle loop | Không. |
| `breaking` | Display tick/background/foreground trước deadline | Break vẫn persist `running` | `breaking` | Visible screen tiếp tục/derive lại loop; background dừng render | Không. |
| `breaking` | Break completed | Terminal completed đã commit | `idle` | Stop breaking, start idle loop | Không reward và không celebrate. |
| `breaking` | Break cancelled | Cancel đã commit | `idle` | Stop breaking, start idle loop | Không. |
| `celebrating` | One-shot/hold kết thúc sau 2.000 ms | Không có truth mới ưu tiên hơn | Derive base, thường `idle` | Stop one-shot, start base loop | Không. `RESOLVED`. |
| `bugged` | One-shot/hold kết thúc sau 1.500 ms | Không có truth mới ưu tiên hơn | Derive base, thường `idle` | Stop one-shot, start base loop | Không. `RESOLVED`. |
| `celebrating`/`bugged` | Start Focus/Break commit | Có active session mới | `working`/`breaking` | Preempt one-shot, start active loop | Không. `RESOLVED` theo `PSM-OPEN-002`. |
| Bất kỳ | Asset/animation failure | Committed projection vẫn hợp lệ | Giữ logical Pet state | Chuyển layered static fallback, không phát transition mới | Không. `RESOLVED` theo `PSM-OPEN-004`. |
| Bất kỳ | Durable truth không validate/DB unavailable | `recovery_required` projection | Không derive Pet state mới | Stop animation; render recovery visual | Không tự terminal/reward. `BASELINE`/`RESOLVED`. |
| Terminal one-shot | App relaunch/Result reopen | Chỉ hydrate terminal record cũ | Derive base thay vì replay | Không replay | `RESOLVED` theo `PSM-OPEN-003`. |

## 6. Animation contract

### 6.1. Sprite manifest — `BASELINE`

Mỗi `<pet-id>` dùng một sprite sheet cho mỗi state theo Project Structure 1.0.0. Typed manifest trong Presentation khai báo tối thiểu:

```ts
type PetAnimationManifestEntry = {
  state: PetState;
  source: StaticAssetReference;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  playback: 'loop' | 'one-shot';
  fallbackFrame: number;
};
```

Đây là contract khái niệm, không tự chốt schema/code chính xác. Frame timing cụ thể có thể nằm trong manifest sau Art/Engineering validation, nhưng phải tuân thủ state lifecycle và hold-time decision đã duyệt. Asset catalog dùng static import/`require` literal; không dựng path động hoặc download core sprite lúc runtime.

### 6.2. Loop states — `BASELINE`

| State | Playback | Rule |
|---|---|---|
| `idle` | Loop | Lặp liên tục khi state còn được chọn và screen nhìn thấy; không restart do render/tick thông thường. |
| `working` | Loop | Lặp liên tục trong Focus `running`; countdown tick không reset frame sequence. |
| `breaking` | Loop | Lặp liên tục trong Break `running`; app background không đổi logical state thành `bugged`. |

Loop phải:

- Dừng khi app background, screen unmount, recovery visual thay thế hoặc state khác được chọn.
- Khởi tạo lại từ frame hợp lệ khi screen/state được mount lại; không cần persist frame index/progress.
- Không mutate session/reward truth và không chạy qua `SessionCommandCoordinator`.
- Dùng static key frame khi reduced motion được bật.

### 6.3. One-shot states — trigger `LOCKED`, lifecycle `RESOLVED`

| State | Playback | Trigger |
|---|---|---|
| `celebrating` | One-shot đúng một lượt | Completed Focus transaction vừa commit. |
| `bugged` | One-shot đúng một lượt | Strict Focus failed transaction vừa commit. |

- One-shot không loop và không block navigation, StartBreak hoặc input.
- Nếu sprite kết thúc trước hold time, giữ fallback/key pose cuối đến hết hold time; asset phải được author để không vượt hold time đã duyệt.
- State mới có priority cao hơn được phép preempt trước hold time.
- App background/unmount hủy visual playback; resume/remount không replay terminal effect cũ.
- Dedupe theo `sessionId + terminalStatus` trong một application runtime để render/reconcile lặp không phát lại effect.

## 7. Hold time cho `celebrating` và `bugged` — `PSM-OPEN-001` (`RESOLVED`)

Hold time là khoảng tối đa một transient Pet state được giữ nếu không bị truth mới preempt. Hold time không trì hoãn durable commit, reward, Result render, navigation hoặc input.

| Phương án | `celebrating` | `bugged` | Độ tin cậy | Chi phí | Độ phức tạp | Nhận xét |
|---|---:|---:|---|---|---|---|
| A — Cân bằng theo tone (**đã chọn**) | 2.000 ms | 1.500 ms | Trung bình | Thấp | Thấp | Celebration đủ thấy nhưng ngắn; failure ngắn hơn để tránh cảm giác phạt. Cần kiểm chứng bằng Pet prototype trong implementation QA. |
| B — Một duration thống nhất | 2.000 ms | 2.000 ms | Trung bình | Thấp nhất | Thấp nhất | Dễ author/test hơn nhưng Bugged có thể tạo cảm giác nặng hơn cần thiết. |
| C — Phản hồi dài hơn | 2.500 ms | 2.000 ms | Thấp–trung bình | Thấp | Thấp | Dễ nhận thấy hơn nhưng tăng nguy cơ cảm giác chậm ở Result flow. |

Quyết định: Dũng Lư chọn phương án A ngày 2026-08-26. `celebrating` giữ tối đa 2.000 ms và `bugged` giữ tối đa 1.500 ms nếu không bị truth mới có priority cao hơn preempt. Confidence tại thời điểm chốt là `MEDIUM`; implementation QA vẫn phải kiểm chứng cảm giác và frame timing trên Pet prototype nhưng không được tự đổi duration.

## 8. Priority và preemption — `PSM-OPEN-002` (`RESOLVED`)

Priority chỉ chọn visual state được render; không thay đổi priority/ordering của session command hoặc durable transaction.

### 8.1. Phương án đã chọn

```text
Safety gate: bootstrap/recovery/reduced-motion/asset fallback
    ↓
P1 — Active session truth mới nhất: working hoặc breaking
    ↓
P2 — Terminal Focus one-shot vừa commit: celebrating hoặc bugged
    ↓
P3 — Không active session: idle
```

Quy tắc tie-break đã chốt:

1. Chỉ request gắn với committed `sessionId`/terminal status mới hợp lệ; speculative event bị bỏ.
2. Active Focus/Break mới đã commit preempt transient effect của session trước để Pet phản ánh công việc hiện tại.
3. Giữa nhiều terminal request, request thuộc terminal Result context hiện tại và có committed sequence/time mới hơn thắng; stale request bị drop.
4. Cùng một session không thể vừa `completed` vừa `failed`; nếu input vi phạm invariant, không chọn cố định Bugged/Celebrating mà vào safe error boundary và giữ durable truth nguyên vẹn.
5. `idle` không preempt one-shot hợp lệ; nó là base state sau khi one-shot kết thúc.

| Phương án | Độ tin cậy | Chi phí | Độ phức tạp | Nhận xét |
|---|---|---|---|---|
| A — Durable truth + recency (**đã chọn**) | Cao | Thấp–trung bình | Trung bình | Không cần gán “bugged luôn thắng celebrating”; chống stale request và phản ánh active session mới. |
| B — Fixed enum priority | Trung bình | Thấp | Thấp | Dễ code nhưng có thể render outcome cũ/sai context khi request đến lệch thứ tự. |
| C — Queue mọi one-shot | Thấp | Trung bình | Trung bình–cao | Có thể phát animation cũ sau khi user đã bắt đầu session mới; không phù hợp focus-first. |

Quyết định: Dũng Lư chọn phương án A ngày 2026-08-26. Priority và tie-break ở mục 8.1 là normative; fixed enum priority và queue mọi one-shot không thuộc Mobile MVP baseline.

## 9. Replay, fallback và accessibility

### 9.1. Replay/deduplication — `PSM-OPEN-003` (`RESOLVED`)

Quy tắc đã chốt: terminal one-shot chỉ phát cho terminal transition vừa commit trong application runtime/foreground presentation hiện tại.

- Hydrate terminal record sau relaunch không replay `celebrating`/`bugged`.
- Reopen/remount Result không replay.
- Reconcile/read terminal session lặp không replay.
- Nếu app background hoặc screen unmount giữa one-shot, effect được bỏ; resume derive base state từ committed truth.
- Dedupe key tạm thời là `sessionId + terminalStatus`; không persist “animation claimed” vào session/reward schema.

| Phương án | Độ tin cậy | Chi phí | Độ phức tạp | Nhận xét |
|---|---|---|---|---|
| A — Fresh-transition only (**đã chọn**) | Cao | Thấp | Thấp–trung bình | Khớp baseline “transient animation không bắt buộc replay”; tránh animation lặp khi mở Result. |
| B — Replay mỗi lần mở Result | Thấp–trung bình | Thấp | Thấp | Dễ thấy feedback nhưng có thể lặp gây phiền và không còn là one-shot theo session context. |
| C — Persist playback receipt | Trung bình | Trung bình–cao | Cao | Dedupe qua relaunch rõ hơn nhưng tạo durable data chỉ để quản lý visual side effect. |

Quyết định: Dũng Lư chọn phương án A ngày 2026-08-26. Fresh-transition-only và runtime dedupe bằng `sessionId + terminalStatus` là normative; không persist animation receipt.

### 9.2. Asset/animation fallback — `PSM-OPEN-004` (`RESOLVED`)

Fallback phải giữ core loop dùng được và không phụ thuộc mạng. Chuỗi đã chốt:

1. Dùng state sprite sheet bình thường.
2. Nếu playback/Reanimated fail nhưng asset đọc được, render `fallbackFrame` tĩnh của cùng state.
3. Nếu state sheet/fallback frame thiếu hoặc corrupt, render still frame `idle` khả dụng của cùng `<pet-id>` và status text/semantic label từ committed projection.
4. Nếu toàn bộ Pet bitmap không tải được, render placeholder hình học trung tính bằng UI primitive cùng status text; placeholder không chọn Cat/Dog/Robot và không giải quyết Product `OPEN-001`.
5. Ghi sanitized diagnostic cục bộ; không log raw session payload/Pet name và không retry download vì core asset được bundle local.

Reduced-motion rule:

- `idle`, `working`, `breaking`: render state-specific static key pose.
- `celebrating`, `bugged`: render state-specific still pose trong hold time đã duyệt, trừ khi bị preempt.
- Text/result/action vẫn truyền đạt đầy đủ outcome; không chỉ dùng motion, sprite hoặc màu.

| Phương án | Độ tin cậy | Chi phí | Độ phức tạp | Nhận xét |
|---|---|---|---|---|
| A — Layered static fallback (**đã chọn**) | Cao | Thấp–trung bình | Trung bình | Bảo toàn state semantics khi có thể, vẫn có code-rendered last resort và không cần mạng. |
| B — Luôn thay bằng idle still | Trung bình | Thấp nhất | Thấp | Đơn giản nhưng mất visual distinction cho Working/Breaking/Result. |
| C — Retry/load remote asset | Thấp | Trung bình–cao | Cao | Mâu thuẫn core asset bundled/offline-first; đã loại khỏi Mobile MVP. |

Quyết định: Dũng Lư chọn phương án A ngày 2026-08-26. Chuỗi layered static fallback và reduced-motion rule ở mục này là normative. Remote retry/load asset không thuộc Mobile MVP.

## 10. Edge cases

| ID | Edge case | Hành vi | Trạng thái |
|---|---|---|---|
| `PSM-EDGE-001` | Countdown hiển thị `0` nhưng completion chưa commit | Giữ state theo committed running session; request reconcile, không tự celebrate | `BASELINE`. |
| `PSM-EDGE-002` | Focus completed transaction commit sau reconciliation | Request `celebrating`; reward đã commit trước animation | Trigger `LOCKED`; playback `RESOLVED`. |
| `PSM-EDGE-003` | Strict violation được tính nhưng failed write chưa commit | Không render `bugged` như final truth; chờ committed result hoặc recovery | `BASELINE`. |
| `PSM-EDGE-004` | Strict `violationAt == endsAt` | Sau failed commit, map `bugged`; không reward | `LOCKED`. |
| `PSM-EDGE-005` | Strict `endsAt < violationAt` | Sau completed commit, map `celebrating`; reward đúng một lần | `LOCKED`. |
| `PSM-EDGE-006` | Strict relaunch thiếu `backgroundedAt` | Không tự render `bugged`; mapping theo deadline-based committed result | `BASELINE`. |
| `PSM-EDGE-007` | Break background/lock quá 10 giây | Không render `bugged`; giữ `breaking` trước deadline hoặc `idle` sau completed commit | `LOCKED`/`BASELINE`. |
| `PSM-EDGE-008` | Focus/Break cancel và terminal reconciliation race | Render theo transaction đầu tiên đã commit; animation không quyết định winner | `BASELINE`. |
| `PSM-EDGE-009` | Completed Focus Result mở nhiều lần | Reward không đổi; không replay one-shot | Truth `LOCKED`; replay `RESOLVED`. |
| `PSM-EDGE-010` | App kill sau terminal/reward commit, trước animation | Hydrate truth/reward; không replay one-shot và không sửa truth | `BASELINE`/`RESOLVED`. |
| `PSM-EDGE-011` | User chọn Start Break khi celebration còn chạy | Chỉ sau StartBreak commit mới map `breaking`; active Break preempt celebration | Start rule `LOCKED`; preemption `RESOLVED`. |
| `PSM-EDGE-012` | User bắt đầu Focus mới khi one-shot còn chạy | Chỉ sau StartFocus commit mới map `working`; active Focus preempt one-shot | Start rule `BASELINE`; preemption `RESOLVED`. |
| `PSM-EDGE-013` | Asset sheet của state hiện tại thiếu/corrupt | Giữ logical state/truth, dùng layered static fallback | `BASELINE`/`RESOLVED`. |
| `PSM-EDGE-014` | Reanimated runtime/playback lỗi | Không crash core flow/rollback; render static fallback cùng state nếu có | `BASELINE`/`RESOLVED`. |
| `PSM-EDGE-015` | Reduced motion bật khi animation đang chạy | Không đổi session/Pet logical state; chuyển state-specific static representation | `BASELINE`/`RESOLVED`. |
| `PSM-EDGE-016` | App background giữa loop/one-shot | Dừng visual work; logical truth giữ nguyên; foreground reconcile, không replay terminal one-shot cũ | `BASELINE`/`RESOLVED`. |
| `PSM-EDGE-017` | Invalid timestamp/database unavailable | Không suy diễn Pet state từ unsafe truth; render recovery visual + Retry | `BASELINE`/`RESOLVED`. |
| `PSM-EDGE-018` | Stale terminal animation request tới sau active session mới | Drop stale request; active committed session thắng priority | `RESOLVED`. |
| `PSM-EDGE-019` | Completed Break | Không celebrate và không reward; base state `idle` khi không active session | `LOCKED`. |
| `PSM-EDGE-020` | Failed/cancelled Focus | `bugged` chỉ cho Strict failed; cancelled về `idle`; không Break CTA/entry | `LOCKED`/`BASELINE`. |

## 11. Documentation boundaries và traceability

### 11.1. Checklist Pet State Machine

| Checklist | Vị trí trong draft | Trạng thái draft |
|---|---|---|
| Định nghĩa Idle, Working, Break, Bugged, Celebrating | Mục 2 | Baseline đã ghi; naming canonical dùng `breaking`. |
| Ánh xạ timer/session state sang Pet state | Mục 3 | Mapping `LOCKED` đã kế thừa nguyên vẹn. |
| State diagram/transition table | Mục 4, 5 | Đã có. |
| Animation loop/one-shot | Mục 6 | Baseline/trigger và lifecycle đã chốt. |
| Priority nhiều animation request | Mục 8 | `PSM-OPEN-002` `RESOLVED`. |
| Hold time Bugged/Celebrating | Mục 7 | `PSM-OPEN-001` `RESOLVED`. |
| Asset/animation fallback | Mục 9.2 | `PSM-OPEN-004` `RESOLVED`. |
| Edge case/acceptance theo từng state | Mục 10, 13 | Đã cập nhật theo toàn bộ decision đã chốt. |
| Review/phê duyệt | Mục 12–14 | Dũng Lư đã review/phê duyệt ngày 2026-08-26. |

### 11.2. Out of scope/deferred

- Default Pet choice, Pet naming, multi-Pet và species-specific behavior.
- Evolution, Happiness, Energy và persistent mood/penalty.
- Item/shop/economy, room decoration và contribution colors.
- Native app blocking, desktop/web, social hoặc cloud sync.
- Skia trước khi ADR-005 performance/adoption gate được vượt và ADR được cập nhật.
- Exact art direction, audio content, frame drawing hoặc font family.

## 12. Decision table

### 12.1. Resolved/baseline decisions

| ID/phạm vi | Quyết định | Nguồn authority | Trạng thái |
|---|---|---|---|
| Pet enum | Chỉ `idle`, `working`, `breaking`, `celebrating`, `bugged`. | Product Core §8.2 | `LOCKED`. |
| Mapping | No active → idle; Focus running → working; Break running → breaking; completed Focus → celebrating; Strict failed → bugged; cancelled → idle. | Product Core §8.3 | `LOCKED`. |
| Break no-Strict | Background/lock/crash/kill không làm Break failed/bugged. | Product Core §6.4; Session `SL-OPEN-001` | `LOCKED`/`BASELINE`. |
| Durable truth | Animation là transient side effect sau commit; không đổi session/reward truth. | System Architecture §6; Session Lifecycle §1/§2.2 | `BASELINE`. |
| Animation stack | Reanimated + bundled sprite; Skia gated; static/sprite fallback. | Technical Overview §3/§10.6; ADR-005 | `BASELINE`. |
| Asset boundary | Một sprite sheet mỗi state, stable ID, typed static catalog, core asset offline. | Project Structure §8 | `BASELINE`. |
| Visibility/accessibility | Dừng animation không nhìn thấy; reduced-motion/static fallback; text quan trọng không chỉ là sprite. | Technical Overview §10.2–10.3 | `BASELINE`. |
| `PSM-OPEN-001` | `celebrating` giữ tối đa 2.000 ms; `bugged` giữ tối đa 1.500 ms; truth mới có thể preempt; không block input/navigation. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-26. |
| `PSM-OPEN-002` | Safety gate → active committed session → fresh terminal one-shot → idle; tie-break bằng committed context + recency. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-26. |
| `PSM-OPEN-003` | Fresh-transition-only; không replay khi reopen/relaunch/resume; runtime dedupe bằng `sessionId + terminalStatus`; không persist receipt. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-26. |
| `PSM-OPEN-004` | State fallback frame → selected Pet idle still → neutral code placeholder; luôn có status text; reduced motion dùng static pose. | Dũng Lư — Tech Lead/Product Owner + Art | `RESOLVED` ngày 2026-08-26. |

### 12.2. Open decisions

Không còn Pet State Machine decision ở trạng thái `OPEN` trong phạm vi hiện tại. Nếu phát sinh decision mới, mục đó phải có owner và không được biến thành requirement trước khi Dũng Lư xác nhận. Nếu decision làm thay đổi Product Core/baseline/ADR, phải nêu dependency và chờ phê duyệt trước khi đồng bộ nguồn authority cao hơn.

## 13. Acceptance criteria

Các criteria dưới đây phản ánh baseline cùng `PSM-OPEN-001` đến `PSM-OPEN-004` đã được Dũng Lư chốt. Checkbox vẫn để trống cho tới khi có implementation/test evidence.

### 13.1. `idle`

- [ ] Không có active session map thành logical Pet state `idle`. `LOCKED`.
- [ ] Focus/Break `cancelled` đã commit map thành `idle` nếu không có active session khác. `LOCKED`.
- [ ] Completed Break map về base `idle`, không trigger celebration hoặc reward. `LOCKED`.
- [ ] Idle animation loop khi nhìn thấy và không restart do render/tick thông thường. `BASELINE` candidate implementation acceptance.
- [ ] Reduced motion/asset failure dùng layered static fallback, có readable status text và không chọn một default Pet cụ thể. `BASELINE`/`RESOLVED`.

### 13.2. `working`

- [ ] Chỉ Focus `running` đã commit map thành `working`. `LOCKED`.
- [ ] Countdown tick hoặc countdown hiển thị `0` không tự rời `working` trước terminal commit. `BASELINE`.
- [ ] Relax Focus background không map thành `bugged`; foreground reconcile rồi render committed truth. `LOCKED`/`BASELINE`.
- [ ] Working loop không mutate durable state/reward và dừng khi không nhìn thấy. `BASELINE`.
- [ ] Focus completion/failure/cancel chỉ đổi Pet feedback sau conditional terminal transaction commit. `BASELINE`.

### 13.3. `breaking`

- [ ] Chỉ running Short/Long Break đã commit map thành `breaking`. `LOCKED`.
- [ ] Break background/lock/crash/kill không map thành `bugged` hoặc session failed. `LOCKED`.
- [ ] Break completed/cancelled không nhận reward; khi không active session, base state là `idle`. `LOCKED`.
- [ ] Breaking loop không restart theo countdown tick và dừng khi không nhìn thấy. `BASELINE`.
- [ ] `breaking` chỉ bắt đầu sau explicit StartBreak action và durable StartBreak commit; celebration không auto-start Break. `LOCKED`/`BASELINE`.

### 13.4. `celebrating`

- [ ] Chỉ completed Focus transaction đã commit mới request `celebrating`. `LOCKED`.
- [ ] Reward đã commit atomically trước animation; animation failure/interruption không rollback hoặc grant lại reward. `BASELINE`.
- [ ] Completed Break không request `celebrating`. `LOCKED`.
- [ ] One-shot không block navigation/input/StartBreak và active committed session mới có thể preempt. `RESOLVED`.
- [ ] `celebrating` giữ tối đa 2.000 ms rồi derive base state nếu không bị preempt. `RESOLVED`.
- [ ] Reconcile/reopen/relaunch/resume không phát lại one-shot cũ; runtime dedupe bằng `sessionId + terminalStatus`. `RESOLVED`.
- [ ] Missing asset/reduced motion vẫn truyền đạt completed result qua layered static fallback và status text. `BASELINE`/`RESOLVED`.

### 13.5. `bugged`

- [ ] Chỉ Strict Focus `failed` đã commit mới request `bugged`. `LOCKED`.
- [ ] Break không request `bugged` do background/lock/crash/kill. `LOCKED`.
- [ ] `bugged` không xóa reward/progress trước đó, không làm Pet chết vĩnh viễn và không persist punishment/mood state. `LOCKED`.
- [ ] Failed Focus không nhận XP/Coin; animation không phải nguyên nhân hoặc bằng chứng failure. `LOCKED`/`BASELINE`.
- [ ] One-shot/copy ngắn, trung tính, không guilt-heavy, không block thử lại/Home và giữ tối đa 1.500 ms nếu không bị preempt. `LOCKED`/`RESOLVED`.
- [ ] Reconcile/reopen/relaunch/resume không phát lại one-shot cũ; runtime dedupe bằng `sessionId + terminalStatus`. `RESOLVED`.
- [ ] Missing asset/reduced motion vẫn truyền đạt failed result qua layered static fallback và status text. `BASELINE`/`RESOLVED`.

### 13.6. Cross-state và test matrix

- [ ] Pet state/animation không thể mutate session status, timestamp, reward ledger, XP hoặc Coin. `LOCKED`/`BASELINE`.
- [ ] Recovery projection không suy diễn Pet state từ invalid/unreadable durable truth. `BASELINE`.
- [ ] Asset/Reanimated failure không crash/block core session flow hoặc đổi committed truth. `BASELINE`.
- [ ] Priority, replay, hold time và fallback behavior khớp `PSM-OPEN-001` đến `PSM-OPEN-004` đã `RESOLVED`.

| Cấp test | Phạm vi Pet State Machine |
|---|---|
| Domain unit | Pure mapping cho no-active/Focus running/Break running/completed Focus/Strict failed/cancelled; Break no-Strict; impossible terminal combinations. |
| Application unit | Chỉ tạo transient request sau committed result; không request khi command fail/recovery; runtime dedupe và priority theo rule đã chốt. |
| Presentation unit/integration | Loop vs one-shot, state switch không restart ngoài chủ đích, reduced motion, missing/corrupt asset fallback và semantic text. |
| Mobile integration | Foreground reconciliation trước Pet render; Result reopen/relaunch/background policy; StartBreak preemption sau commit. |
| Device/simulator | Loop 30 phút và ADR-005 performance matrix; background/unmount cleanup; iOS/Android reduced-motion/asset smoke test. |

## 14. Review và phát hành

Pet State Machine `1.0.0` được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26 sau khi xác nhận:

1. `PSM-OPEN-001` đến `PSM-OPEN-004` đều `RESOLVED`.
2. Decision table, edge cases và acceptance criteria đã được chuyển thành normative rule tương ứng.
3. Mapping Pet state kế thừa nguyên vẹn Product Core và Session Lifecycle đã duyệt.
4. Không có quyết định Pet mặc định, shop/item, contribution color hoặc nội dung deferred bị chốt ngoài authority.
5. Các quyết định Pet Presentation mới không làm thay đổi Product Core, architecture baseline, Timer Engine, Session Lifecycle hoặc ADR, nên không cần sửa nguồn authority cao hơn.
6. Technical Documentation Checklist được phép cập nhật mục Pet State Machine thành hoàn thành.

Các checkbox ở mục 13 là implementation acceptance criteria và vẫn để trống cho tới khi có test/device evidence; specification approval không thay thế implementation verification.

## 15. Change log

### 1.0.0 — 2026-08-26

- Dũng Lư — Tech Lead/Product Owner review và phê duyệt toàn bộ Pet State Machine Specification.
- Chuyển tài liệu từ `DRAFT` sang `APPROVED` sau khi `PSM-OPEN-001` đến `PSM-OPEN-004` đều `RESOLVED`.
- Xác nhận state mapping, transition, loop/one-shot, hold time, priority, replay, fallback, edge cases và acceptance criteria không mâu thuẫn Product Core hoặc các baseline đã duyệt.
- Phát hành Pet State Machine 1.0.0 làm baseline cho Gamification Rules, Data Model và Mobile MVP implementation.
- Cho phép cập nhật Technical Documentation Checklist mục Pet State Machine thành hoàn thành.

### 0.2.0 — 2026-08-26

- Dũng Lư chốt phương án đề xuất cho `PSM-OPEN-001` đến `PSM-OPEN-004`.
- Chốt `celebrating` tối đa 2.000 ms và `bugged` tối đa 1.500 ms; transient state không block input/navigation và có thể bị active session truth mới preempt.
- Chốt priority theo safety gate → active committed session → fresh terminal one-shot → idle, với tie-break bằng committed context và recency.
- Chốt fresh-transition-only, không replay khi Result reopen/app relaunch/resume; runtime dedupe bằng `sessionId + terminalStatus` và không persist animation receipt.
- Chốt layered static fallback, neutral code placeholder cuối chuỗi, status text bắt buộc và reduced-motion static pose.
- Chuyển edge case, decision table và acceptance criteria liên quan thành normative; giữ tài liệu ở `DRAFT` để chờ review/phê duyệt toàn bộ.
- Không sửa Product Core, Technical Documentation Checklist, architecture baseline, Timer Engine, Session Lifecycle hoặc ADR vì các quyết định chỉ chi tiết hóa Pet Presentation behavior trong boundary đã duyệt.

### 0.1.0 — 2026-08-26

- Tạo draft Pet State Machine từ Product Core 1.10.0, checklist, ba architecture baseline 1.0.0, Timer Engine 1.0.1, Session Lifecycle 1.0.0 và ADR-001 đến ADR-008.
- Kế thừa nguyên vẹn năm Pet state và mapping đã duyệt; giữ Break no-Strict và durable session/reward truth độc lập với transient animation.
- Thêm base/transient model, state diagram, transition table, loop/one-shot contract, fallback, edge case và acceptance criteria theo từng state.
- Ghi `PSM-OPEN-001` đến `PSM-OPEN-004` cho hold time, priority/preemption, replay/deduplication và fallback/reduced-motion behavior.
- Đề xuất có confidence/cost/complexity nhưng giữ toàn bộ lựa chọn chưa duyệt ở trạng thái `PROPOSED`/`OPEN`.
- Không sửa Product Core, Technical Documentation Checklist, architecture baseline, Timer Engine, Session Lifecycle hoặc ADR.
