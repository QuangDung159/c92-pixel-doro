---
document_id: PIXELDORO_SYSTEM_ARCHITECTURE
title: PixelDoro Mobile MVP — System Architecture
version: 1.0.0
status: APPROVED
last_updated: 2026-08-26
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
approved_by: Dũng Lư
approver_role: Tech Lead
approved_at: 2026-08-26
language: vi
scope:
  - mobile_mvp
  - system_architecture
authority: SECONDARY
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ./technical-overview.md
---

# PixelDoro Mobile MVP — System Architecture

## 0. Vai trò và phạm vi tài liệu

Tài liệu này chi tiết hóa kiến trúc hệ thống của PixelDoro Mobile MVP từ [Product Core — Single Source of Truth](../PIXELDORO_CORE_TRUTH.md) và [Technical Overview 1.0.0](./technical-overview.md). Tài liệu xác định:

- Trách nhiệm của Presentation, Application, Domain và Infrastructure.
- Chiều dependency và import boundary giữa các layer.
- Ranh giới giữa shared core và mobile adapters.
- Cách use case truy cập dữ liệu và platform capability qua port.
- Cách composition root nối implementation với abstraction.
- Data flow và side-effect flow của một focus session hoàn chỉnh.

Tài liệu này không thay thế:

- `project-structure.md` cho workspace layout, folder, file naming và import rule cụ thể.
- `timer-engine.md` cho timer state machine, clock semantics và timer edge case.
- `session-lifecycle.md` cho kết quả session, Focus → Reward → Break và recovery scenario.
- `pet-state-machine.md` cho Pet transition và animation priority.
- `gamification-rules.md` cho công thức XP/Coin và economy.
- `data-model.md` cho schema, constraint, index và migration.

Khi có mâu thuẫn về ý nghĩa sản phẩm hoặc phạm vi MVP, Product Core được ưu tiên. Khi có mâu thuẫn với technical baseline đã duyệt, Technical Overview 1.0.0 và ADR-001 đến ADR-008 được ưu tiên cho tới khi thay đổi đó được Tech Lead duyệt và ADR liên quan được cập nhật.

### 0.1. Trạng thái quyết định

| Trạng thái | Ý nghĩa |
|---|---|
| `LOCKED` | Đã được Product Core khóa; implementation phải tuân theo. |
| `BASELINE` | Đã được Technical Overview hoặc ADR chấp nhận; tài liệu này chỉ chi tiết hóa. |
| `RESOLVED` | Quyết định kiến trúc đã được Tech Lead chốt trong tài liệu này. |
| `OPEN` | Chưa quyết định; không được tự suy diễn thành requirement. |
| `DEFERRED` | Không thuộc Mobile MVP. |

## 1. Architectural goals và constraints

System Architecture phải bảo vệ các mục tiêu đã khóa sau:

1. Timer và kết quả session có thể được khôi phục đúng từ dữ liệu đã persist cùng timestamp hiện tại.
2. Một completed session chỉ được cấp reward tối đa một lần.
3. Core focus loop hoạt động offline và không phụ thuộc notification, analytics hoặc feedback provider.
4. UI, Pet state và history có thể được dựng lại từ durable state.
5. Business rule có thể unit test mà không cần React Native runtime hoặc thiết bị thật.
6. Platform SDK không lan vào Domain hoặc screen/route.
7. Desktop tương lai có thể tái sử dụng core TypeScript mà không kéo desktop vào phạm vi Mobile MVP.

Các constraint bắt buộc:

- SQLite là nguồn sự thật của durable product state.
- Zustand chỉ giữ UI/application projection có thể hydrate hoặc dựng lại.
- Screen và route không truy cập SQLite hoặc platform SDK trực tiếp.
- Domain không import React, React Native, Expo, Zustand, SQLite hoặc UI framework.
- Repository là lối vào duy nhất cho durable data; SQL chỉ tồn tại trong Infrastructure.
- Terminal session transition và reward ledger phải được persist atomically.
- Notification, analytics, feedback, audio, haptic và store review là side effect; failure của chúng không được làm sai session truth hoặc reward truth.

## 2. Layer model

### 2.1. Presentation

Presentation chịu trách nhiệm hiển thị và nhận tương tác:

- Expo Router route/layout và screen composition.
- Screen, component, hook trình bày và accessibility semantics.
- Zustand projection phục vụ render và application coordination.
- Countdown hiển thị, Pet animation và transient visual state.
- Chuyển user intent đã validate ở mức input sang Application use case.

Presentation không được:

- Chứa session transition, Strict Mode, reward hoặc store-review eligibility rule.
- Query SQLite hoặc gọi Expo/native/provider SDK trực tiếp.
- Dùng state trong memory làm bằng chứng duy nhất cho completion hoặc reward grant.
- Đưa domain rule vào route file, component hoặc Zustand action.

### 2.2. Application

Application chịu trách nhiệm điều phối một hành vi người dùng hoặc lifecycle event hoàn chỉnh:

- Cung cấp use case làm application boundary cho Presentation và lifecycle bridge.
- Load dữ liệu qua repository port, gọi Domain và persist kết quả.
- Xác lập transaction boundary của use case.
- Chuyển domain result thành application result/projection phù hợp cho Presentation.
- Điều phối platform side effect qua port mà không làm provider SDK rò rỉ vào core flow.
- Định nghĩa các port mà Infrastructure phải triển khai.

Application không được:

- Nhân đôi business rule thuộc Domain.
- Chứa SQL hoặc import trực tiếp Expo/native/provider SDK.
- Coi notification hoặc analytics delivery là điều kiện để session/reward thành công.

### 2.3. Domain

Domain chứa product rule thuần TypeScript:

- Entity, value object và domain result.
- Session transition và terminal-state invariant.
- Strict Mode decision từ timestamp đã cung cấp.
- Reward eligibility/idempotency policy ở mức business rule.
- Pet-state mapping và các policy khác khi được đặc tả tương ứng chốt.

Domain phải deterministic với input được truyền vào. Thời gian hiện tại, ID và dữ liệu bên ngoài được Application cung cấp dưới dạng value; Domain không tự đọc clock, database hoặc platform API.

Domain không được:

- Import Application, Presentation hoặc Infrastructure.
- Sở hữu repository, notification, analytics, lifecycle hay platform port.
- Thực hiện I/O, navigation hoặc mutate UI state.

### 2.4. Infrastructure

Infrastructure triển khai các port do Application sở hữu:

- SQLite repository, mapper, migration và transaction implementation.
- Clock và ID adapter.
- App lifecycle bridge.
- Local notification adapter.
- PostHog analytics adapter và bounded offline queue.
- Feedback, store review, audio và haptic adapter.
- Provider-specific serialization, error mapping và retry mechanism.

Infrastructure được phép import Application contract và Domain type cần thiết để triển khai port/mapping. Infrastructure không được chứa hoặc thay đổi business rule.

## 3. Dependency direction

### 3.1. Compile-time dependencies

```text
Presentation ─────────→ Application ─────────→ Domain
                              ↑
Infrastructure ───────────────┘

Composition Root ─────────→ Presentation
                 ├───────→ Application
                 ├───────→ Domain
                 └───────→ Infrastructure
```

Quy tắc:

1. Domain không phụ thuộc layer nào khác.
2. Application phụ thuộc Domain, đồng thời sở hữu port contract.
3. Infrastructure phụ thuộc các port contract của Application để cung cấp implementation.
4. Presentation gọi Application boundary; Presentation không gọi Infrastructure.
5. Composition root là nơi duy nhất được biết concrete implementation của toàn bộ graph.
6. Mũi tên runtime có thể đi từ use case tới adapter object đã inject, nhưng compile-time dependency vẫn hướng về Application-owned abstraction.

### 3.2. Port ownership — `SA-OPEN-001` (`RESOLVED`)

Quyết định được Tech Lead Dũng Lư chốt ngày 2026-08-26:

- Domain chỉ chứa rule thuần và nhận clock/ID/external facts dưới dạng input value.
- Application sở hữu toàn bộ I/O port, gồm repository, transaction, clock, ID, notification, analytics, feedback, lifecycle-facing capability, audio, haptic và store review.
- Infrastructure triển khai các port này.
- Presentation chỉ gọi use case và nhận application result/projection.
- Composition root chịu trách nhiệm khởi tạo và nối concrete adapter vào use case.

Hệ quả:

- Domain test không cần mock database hoặc platform SDK.
- Transaction và side-effect orchestration có một owner rõ ràng tại Application.
- Cần mapper giữa persistence record, domain model và application projection.
- Sơ đồ bốn vùng không được hiểu là Domain phụ thuộc Infrastructure.

## 4. Shared core và mobile adapter boundary

Shared core gồm Domain cùng phần Application không phụ thuộc mobile runtime. Shared core chỉ dùng TypeScript và kiểu dữ liệu do ứng dụng sở hữu.

Mobile-specific code gồm:

- Expo Router và React Native Presentation.
- SQLite, app lifecycle, notification, PostHog, feedback, store review, audio và haptic adapters.
- Mobile composition root và native configuration.

Ranh giới này bảo vệ khả năng reuse trong tương lai nhưng không yêu cầu tạo desktop app, sync abstraction hoặc remote repository trong MVP. Package/folder layout cụ thể sẽ được chốt trong `project-structure.md`.

## 5. Composition root và dependency injection

### 5.1. Manual dependency injection — `SA-OPEN-003` (`RESOLVED`)

Mobile MVP dùng manual dependency injection tại một mobile composition root. Không dùng DI container hoặc service locator trong baseline.

Composition root phải là nơi duy nhất:

- Khởi tạo database connection và concrete adapter.
- Nối port implementation vào application use case.
- Khởi tạo Zustand projection/controller với application boundary.
- Đăng ký lifecycle bridge gọi use case tương ứng.
- Quản lý startup/shutdown order của dependency graph.

Use case nhận dependency tường minh qua constructor hoặc object parameter. Screen, component, hook và Zustand store không được truy cập global container, service locator hoặc tự khởi tạo concrete Infrastructure adapter.

Dependency graph khái niệm:

```text
Mobile Composition Root
  → mở SQLite và chạy migration
  → tạo repository + transaction implementation
  → tạo platform/provider adapters
  → inject ports vào application use cases/facade
  → đưa application facade vào Zustand/controller boundary
  → đăng ký lifecycle bridge một lần
  → chạy startup reconciliation + hydration
  → cho phép Presentation render core flow
```

### 5.2. Dependency lifecycle

| Dependency | Vòng đời | Quy tắc |
|---|---|---|
| SQLite connection và transaction implementation | Application-scoped | Khởi tạo một lần sau migration; không mở connection từ screen/use case. |
| Repository và platform/provider adapter | Application-scoped | Dùng lại trong application graph; adapter giữ mutable state chỉ khi contract yêu cầu. |
| Application use case/facade | Application-scoped | Được composition root tạo với dependency tường minh. |
| Zustand projection/controller | Application-scoped, có thể rehydrate/reset | Chỉ biết application boundary; không sở hữu durable truth. |
| App lifecycle subscription | Một registration/application graph | Forward event vào Application; phải unsubscribe khi graph bị dispose/reload. |
| Component/Reanimated visual state | Screen/component-scoped | Được cleanup khi unmount; không được dùng làm durable product truth. |

Startup không cho Presentation thực hiện core command trước khi database migration, application graph và startup reconciliation tối thiểu hoàn tất. UI có thể hiển thị bootstrap/loading/recovery state trong thời gian này.

Nếu dependency graph tăng đáng kể sau MVP, việc đưa DI container vào phải có nhu cầu đo được, review chi phí và ADR riêng. Không thêm container chỉ để chuẩn bị cho phạm vi deferred.

## 6. Focus-session data flow

### 6.1. Transaction và side-effect ordering — `SA-OPEN-002` (`RESOLVED`)

Quyết định được Tech Lead Dũng Lư chốt ngày 2026-08-26:

```text
User intent / lifecycle event
  → Presentation gọi Application use case
  → Application validate input, lấy current time/ID
  → Mở SQLite transaction ngắn
      → Đọc durable state qua repository port
      → Truyền facts/value vào Domain
      → Nhận decision/transition thuần
      → Persist toàn bộ durable product truth liên quan
  → Commit transaction
  → Refresh Zustand/application projection từ kết quả đã persist
  → Presentation render trạng thái đã commit
  → Chạy hoặc enqueue platform/network side effect best-effort
```

Quy tắc bắt buộc:

1. Mỗi application command chỉ giữ transaction trong thời gian cần thiết để đọc/ghi durable product truth.
2. Không gọi notification, analytics, feedback, store review, audio, haptic hoặc provider SDK bên trong SQLite transaction.
3. UI chỉ phản ánh command thành công sau khi durable transaction đã commit.
4. Side-effect failure sau commit không được rollback hoặc thay đổi session/reward truth.
5. MVP không dùng transactional outbox chung. Adapter có retry/deduplication riêng khi baseline yêu cầu.

### 6.2. Start Focus

```text
StartFocus command
  → validate duration, tag, mode và active-session invariant
  → transaction: tạo running session với startedAt/endsAt
  → commit
  → cập nhật projection và điều hướng tới Focus Session
  → best-effort: ensure local notification scheduled
  → best-effort: enqueue focus_session_started analytics
  → transient: audio/haptic phản hồi Start nếu setting cho phép
```

Nếu notification bị từ chối hoặc schedule thất bại, running session vẫn hợp lệ. Notification adapter phải hỗ trợ lời gọi idempotent theo session; khi resume, Application có thể yêu cầu đảm bảo notification cho session vẫn đang chạy mà không tạo nhiều notification tương đương.

### 6.3. Reconciliation và reward

```text
App start / foreground
  → ReconcileActiveSession command
  → transaction:
      → đọc active session
      → Domain resolve từ persisted timestamps + current time
      → nếu chưa terminal: giữ running state cần thiết
      → nếu completed:
          → persist completed + resolvedAt
          → insert RewardTransaction unique theo sessionId
          → cộng XP/Coin
          → ghi rewardClaimedAt
      → nếu failed/cancelled: persist terminal result, không cấp reward
  → commit
  → rebuild projection/Pet state từ durable result
  → best-effort: notification cleanup và analytics
  → transient: celebration/audio/haptic khi context phù hợp
```

Terminal session transition, `RewardTransaction`, XP/Coin balance và `rewardClaimedAt` của một completed session phải nằm trong cùng một transaction. Unique constraint theo `sessionId` là hàng rào cuối cùng chống cấp reward hai lần khi command bị retry hoặc có race.

### 6.4. Cancel và terminal side effects

Cancel/failed flow cũng persist terminal status trước, sau đó mới cập nhật UI và chạy notification cleanup, analytics, Pet feedback, audio hoặc haptic. Không side effect nào được dùng làm bằng chứng rằng session đã `completed`, `failed` hoặc `cancelled`.

### 6.5. Crash window và retry policy

Nếu app bị kill sau commit nhưng trước side effect:

- Session và reward vẫn đúng và có thể hydrate/reconcile lại.
- Notification có thể được ensure/cancel lại bằng operation idempotent khi app resume.
- Analytics dùng bounded queue và `eventId` theo ADR-008, nhưng việc mất một event trong crash window được chấp nhận cho MVP.
- Audio, haptic và transient animation không bắt buộc replay sau relaunch.
- Store-review attempt tuân theo ADR-006: persist attempt ngay trước khi gọi native API và vẫn tính attempt nếu prompt không hiển thị.

Không thêm bảng outbox/worker/retry framework tổng quát trong MVP. Nếu dữ liệu beta chứng minh một side effect cần delivery guarantee cao hơn, thay đổi đó phải được review và ghi bằng ADR phù hợp.

### 6.6. Command serialization và concurrency — `SA-OPEN-005` (`RESOLVED`)

Application dùng một application-scoped `SessionCommandCoordinator` để serialize mọi command làm thay đổi Focus/Break session. Coordinator là cơ chế điều phối trong một JavaScript process; SQLite transaction và constraint vẫn là hàng rào correctness cuối cùng.

```text
User command / lifecycle event
  → capture input + event timestamp tại boundary
  → SessionCommandCoordinator
      → xếp Start/Cancel/Background/Foreground/Reconcile theo thứ tự
      → chỉ chạy một session-mutating command tại một thời điểm
      → coalesce concurrent Reconcile bằng single-flight
  → SQLite transaction + persisted-state precondition
  → committed projection
  → ordered best-effort side-effect dispatch
```

Quy tắc:

1. `StartFocus`, `StartBreak`, cancel, background, foreground và reconciliation phải đi qua cùng session command boundary.
2. Nhiều lời gọi reconciliation đồng thời dùng single-flight: caller cùng chờ một in-flight result thay vì tạo transaction trùng lặp.
3. Lifecycle bridge capture timestamp khi nhận event rồi enqueue command; Domain đánh giá rule từ persisted timestamps và timestamp đã capture, không từ thời điểm command tình cờ được chạy.
4. UI pending/disabled state chỉ cải thiện trải nghiệm, không phải concurrency lock hoặc idempotency guarantee.
5. Countdown/render tick không mutate durable state và không đi qua coordinator.
6. Một command failure phải release queue để command sau vẫn chạy; queue không được bị poison bởi rejected promise.
7. Session-related side-effect intention được dispatch theo command order sau commit; network delivery không nằm trong critical section hoặc SQLite transaction.
8. App relaunch tạo coordinator mới, sau đó phải qua startup reconciliation barrier trước khi Presentation được phép gửi core mutation command.

Database backstop phải được chi tiết hóa trong `data-model.md` và session specifications, tối thiểu gồm:

- Constraint bảo vệ không có nhiều active session trái invariant.
- Conditional terminal transition chỉ thành công khi persisted status còn `running`.
- Terminal status không transition ngược về `running`.
- Reward ledger unique theo `sessionId`.

Ví dụ race giữa cancel và completion:

```text
Cancel chạy trước
  → persist cancelled
  → completion/reconcile chạy sau thấy terminal state
  → không đổi status, không cấp reward

Completion chạy trước
  → persist completed + reward atomically
  → cancel chạy sau thấy terminal state
  → không đổi kết quả
```

Không dùng distributed lock, durable process lock hoặc event-bus/state-machine framework cho Mobile MVP. Các cơ chế đó chỉ được xem xét khi xuất hiện nhiều writer/process thực sự và phải có ADR riêng.

## 7. Application result và Presentation projection

### 7.1. Typed result contract — `SA-OPEN-004` (`RESOLVED`)

Application use case trả về discriminated union có kiểu rõ ràng thay vì để Presentation suy diễn từ exception, database record hoặc SDK response.

Contract khái niệm:

```ts
type ApplicationResult<TValue, TError> =
  | {
      ok: true;
      value: TValue;
      warnings?: ApplicationWarning[];
    }
  | {
      ok: false;
      error: TError;
    };
```

`value`, `error` và `warning` là application-owned DTO/type. Application không trả SQLite row, Domain entity có mutable behavior, native SDK object, provider exception hoặc raw technical message cho Presentation.

### 7.2. Error policy

| Loại | Cách biểu diễn | Ví dụ | Presentation behavior |
|---|---|---|---|
| Expected validation/domain/application error | Typed `error.code` trong `ok: false` | Duration không hợp lệ, đã có active session, session không tồn tại hoặc đã terminal | Giữ projection hiện tại và map code sang copy thân thiện. |
| Actionable side-effect issue sau core commit | `warning` trong `ok: true` hoặc secondary projection | Notification permission bị từ chối/schedule thất bại | Core flow tiếp tục; UI có thể giải thích giới hạn và hướng xử lý. |
| Non-actionable best-effort failure | Không đổi core result; adapter queue/sanitize log theo policy | Analytics delivery tạm thời thất bại | Không làm phiền người dùng và không rollback core state. |
| Unexpected programming/invariant defect | Throw tới application error boundary sau khi bảo vệ dữ liệu | Impossible state do bug hoặc contract violation | Hiển thị recovery state an toàn; không lộ raw error hoặc dữ liệu nhạy cảm. |

Error code phải ổn định và test được; localized/user-facing copy thuộc Presentation. Provider-specific error phải được Infrastructure map sang application-owned error/warning khi cần đi qua boundary.

### 7.3. Zustand update contract

```text
Presentation intent
  → Zustand/controller đánh dấu command pending
  → gọi Application use case
  → ok: true
      → áp dụng projection được tạo từ durable result đã commit
      → clear command error
      → expose warning có thể hành động nếu có
  → ok: false
      → giữ nguyên durable projection hiện tại
      → lưu typed error state cho Presentation
  → UI render/điều hướng từ application result + projection mới
```

Quy tắc:

1. Application use case không import hoặc mutate Zustand.
2. Zustand không chứa session transition, reward formula, eligibility hoặc persistence rule.
3. Zustand chỉ giữ application projection có thể dựng lại, command status (`idle`/`pending`/`error`) và ephemeral UI state.
4. Projection chỉ được áp dụng như committed truth sau khi use case trả `ok: true`.
5. Query/hydration/reconciliation use case dùng cùng application-owned projection contract; screen không tự map SQLite row hoặc Domain entity.
6. Navigation dựa trên result/projection đã commit, không dựa trên optimistic durable-state mutation.

Việc serialize command và xử lý nhiều lifecycle/user command đồng thời thuộc `SA-OPEN-005`; `pending` UI state tự nó không phải concurrency lock hoặc idempotency guarantee.

## 8. Architecture decisions

| ID | Câu hỏi | Owner | Trạng thái |
|---|---|---|---|
| `SA-OPEN-001` | Port thuộc layer nào và dependency direction chính xác ra sao? | Dũng Lư — Tech Lead | `RESOLVED` |
| `SA-OPEN-002` | Transaction boundary và thứ tự durable write/side effect của start, reconcile và reward flow là gì? | Dũng Lư — Tech Lead | `RESOLVED` |
| `SA-OPEN-003` | MVP dùng manual dependency injection hay DI container; dependency lifecycle được quản lý thế nào? | Dũng Lư — Tech Lead | `RESOLVED` |
| `SA-OPEN-004` | Application trả result/error và cập nhật Zustand projection theo contract nào? | Dũng Lư — Tech Lead | `RESOLVED` |
| `SA-OPEN-005` | Lifecycle event, concurrent command và relaunch được serialize/deduplicate tại boundary nào? | Dũng Lư — Tech Lead | `RESOLVED` |

Mỗi quyết định `OPEN` phải được thảo luận và xác nhận trước khi trở thành requirement. Nếu quyết định làm thay đổi Technical Overview hoặc ADR đã duyệt, phải cập nhật baseline/ADR trước hoặc đồng thời.

## 9. Acceptance criteria

- [x] Trách nhiệm của Presentation, Application, Domain và Infrastructure không chồng lấn.
- [x] Dependency direction và port ownership đã được Tech Lead chốt.
- [x] Focus session flow mô tả đầy đủ start, background/foreground, reconciliation, terminal result và reward ở cấp kiến trúc.
- [x] Shared core và mobile adapter boundary không kéo desktop/backend vào MVP.
- [x] UI không truy cập database hoặc platform SDK trực tiếp.
- [x] Domain không import React Native, Expo, Zustand hoặc database driver.
- [x] Transaction boundary và side-effect ordering đã được Tech Lead chốt.
- [x] Manual dependency injection và application-scoped dependency lifecycle đã được Tech Lead chốt.
- [x] Application result/error và Zustand projection contract đã được Tech Lead chốt.
- [x] Concurrent command và lifecycle race có ownership rõ ràng.
- [x] Không còn quyết định kiến trúc quan trọng ở trạng thái `OPEN` mà không có owner.
- [x] Tech Lead Dũng Lư đã review và phê duyệt tài liệu ngày 2026-08-26.

## 10. Change log

### 1.0.0 — 2026-08-26

- Tech Lead Dũng Lư review và phê duyệt toàn bộ System Architecture.
- Chuyển trạng thái tài liệu từ `DRAFT` sang `APPROVED` sau khi `SA-OPEN-001` đến `SA-OPEN-005` đều được chốt.
- Ghi nhận owner/approver và phát hành System Architecture `1.0.0` làm baseline cho `project-structure.md`, `timer-engine.md` và `session-lifecycle.md`.

### 0.5.0 — 2026-08-26

- Chốt `SA-OPEN-005`: Application dùng application-scoped session command coordinator để serialize Focus/Break mutation command.
- Dùng single-flight cho concurrent reconciliation; lifecycle timestamp được capture tại boundary trước khi enqueue.
- Quy định UI pending state không phải concurrency lock; SQLite transaction, persisted-state precondition và unique constraint vẫn là correctness backstop.
- Bổ sung startup reconciliation barrier, queue failure recovery và race examples cho cancel/completion.
- Không dùng distributed lock, durable process lock hoặc event-bus/state-machine framework trong Mobile MVP.

### 0.4.0 — 2026-08-26

- Chốt `SA-OPEN-004`: Application use case trả typed result chứa application-owned projection hoặc typed error/warning.
- Quy định expected error không dùng exception; provider-specific object/error không đi qua application boundary.
- Quy định Zustand chỉ áp dụng committed projection khi use case thành công, giữ projection cũ khi command thất bại và không chứa business rule.
- Tách actionable warning khỏi non-actionable best-effort side-effect failure; analytics failure không làm core result thất bại.

### 0.3.0 — 2026-08-26

- Chốt `SA-OPEN-003`: dùng manual dependency injection tại mobile composition root; không dùng DI container hoặc service locator trong baseline.
- Quy định screen, component, hook và Zustand chỉ nhận application boundary, không tự khởi tạo concrete adapter.
- Xác định application-scoped lifecycle cho database, repository, adapters, use cases và Zustand projection; lifecycle subscription phải được cleanup khi graph dispose/reload.
- Bổ sung bootstrap order từ migration, dependency wiring và reconciliation tới Presentation readiness.

### 0.2.0 — 2026-08-26

- Chốt `SA-OPEN-002`: durable product truth được persist atomically trong SQLite transaction ngắn; UI chỉ phản ánh thành công sau commit.
- Đưa notification, analytics, feedback, store review, audio và haptic ra ngoài core transaction dưới dạng side effect best-effort.
- Quy định completed session, reward ledger, XP/Coin và `rewardClaimedAt` được persist trong cùng một transaction với unique constraint theo `sessionId`.
- Bổ sung data flow cho Start Focus, reconciliation, terminal result, crash window và retry policy.
- Không dùng transactional outbox chung trong Mobile MVP.

### 0.1.0 — 2026-08-26

- Tạo bản nháp System Architecture từ Product Core 1.3.0 và Technical Overview 1.0.0 đã duyệt.
- Chốt `SA-OPEN-001`: Domain thuần nhận external facts dưới dạng value; Application sở hữu port; Infrastructure triển khai; Composition Root nối dependency graph.
- Làm rõ compile-time dependency direction và tránh diễn giải Domain phụ thuộc Infrastructure.
- Ghi nhận `SA-OPEN-002` đến `SA-OPEN-005` để tiếp tục review với Tech Lead.
