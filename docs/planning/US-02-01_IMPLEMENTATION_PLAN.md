---
document_id: PIXELDORO_US_02_01_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-02-01 Implementation Plan
version: 1.0.0
status: READY_FOR_IMPLEMENTATION
implementation_status: AWAITING_OWNER_NATIVE_RUNTIME
last_updated: 2026-08-27
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
approved_by: Dũng Lư
approver_role: Tech Lead/Product Owner
approved_at: 2026-08-27
language: vi
scope:
  - mobile_mvp
  - epic_02
  - us_02_01
  - sqlite_ownership
  - transactional_kernel
authority: PLANNING
story_baseline: ./EPIC-02_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-02-01 — SQLite Ownership và Transactional Kernel

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan cho `US-02-01` thuộc
`EPIC-02 — Durable Local Data, Migration và Safe Bootstrap`.

**Story outcome:** Mobile composition graph có thể mở/đóng một database
application-scoped, bật và xác minh foreign-key enforcement trước repository access,
đồng thời cung cấp transaction boundary do Application sở hữu với commit/rollback
kiểm chứng được.

**Dependency:** `EPIC-01 DONE` — đã đạt.

**Story priority:** `MUST` / `P0_CORRECTNESS` / execution order `01` trong EPIC-02.

**Blocks:** `US-02-02`. Schema, migration và seed không được bắt đầu trước khi owner,
connection lifecycle và transaction semantics của Story này có automated evidence.

**Planning status:** `READY_FOR_IMPLEMENTATION`. Owner đã duyệt technical direction và
test strategy ngày 2026-08-27. Không có production code, dependency hoặc native artifact
nào được tạo bởi tài liệu này.

### 0.1. Readiness gate — đã đạt

- [x] Tech Lead duyệt các technical decision ở mục 3.
- [x] `EPIC02-INPUT-01` được xác nhận theo test strategy ở mục 8.
- [x] Một Story duy nhất active; `US-02-02` vẫn `NOT_STARTED`.
- [x] Working tree được kiểm tra và thay đổi ngoài Story được giữ nguyên.

`EPIC02-INPUT-01` đã được resolve bằng approval này. Story vẫn không được đóng chỉ bằng
fake hoặc host test; exact native runtime probe là acceptance evidence bắt buộc.

**Implementation update — 2026-08-27:** `T01` đến `T07` đã hoàn tất; `T08` harness và
owner runbook đã sẵn sàng nhưng exact native report chưa được chạy. Automated portion của
`T09` pass; Story giữ `AWAITING_OWNER_NATIVE_RUNTIME` cho tới khi evidence record nhận
`passed: true` từ development build.

## 1. Baseline và current-state review

### 1.1. Baseline bắt buộc

| Authority | Contract áp dụng cho US-02-01 |
|---|---|
| `EPIC-02_USER_STORIES.md` | Một application-scoped SQLite owner; Application-owned transaction port; FK trước repository; typed error; parameter binding; commit/rollback; no side effect trong transaction. |
| Data Model §2.3 | `foreign_keys = ON` trên mọi connection; một connection/transaction implementation; transaction ngắn; repository parameter binding. |
| System Architecture §3.2, §5, §6.1 | Application sở hữu port; Infrastructure implement; composition root tạo concrete graph; durable commit trước UI/side effect. |
| Project Structure §3–5 | `transaction.port.ts` thuộc shared Application; SQL chỉ nằm trong mobile Infrastructure database; Presentation/route không truy cập SQLite. |
| ADR-003 | SQLite là durable source of truth; mọi database access đi qua repository boundary. |
| ADR-004 | Domain/Application thuần không import Expo/SQLite; native adapter nằm ngoài core. |

### 1.2. Repository hiện tại

| Khu vực | Current state | Hệ quả cho plan |
|---|---|---|
| Dependency | Expo SDK `~57.0.17`; chưa có `expo-sqlite`. | Cài bằng Expo-compatible flow, không tự đoán version. |
| Shared Application | Có `ApplicationResult`, `ClockPort`, `IdPort`; chưa có transaction contract. | Thêm contract nhỏ, không thêm repository/entity sớm. |
| Mobile bootstrap | `boot()`/`dispose()` đồng bộ; recovery chỉ có `FOUNDATION_BOOT_FAILED`. | Chỉ chuyển lifecycle sang async đủ cho DB open/close; phase migration/readiness chi tiết thuộc `US-02-04`. |
| Composition root | Tạo graph một lần bằng manual DI; chưa có database. | Đây là owner duy nhất tạo concrete SQLite graph. |
| Infrastructure | Chỉ có platform adapters; chưa có `infrastructure/database`. | Tạo capability database tối thiểu, chưa tạo schema/migration/repository product. |
| Test | Vitest chạy Node host; device evidence hiện là manual checklist. | Host fake không chứng minh native SQLite; cần runtime probe tách biệt. |
| Boundary checks | Application/Presentation/route đã cấm `expo-sqlite`; chưa có negative case rõ cho composition và non-database Infrastructure. | Bổ sung enforcement để driver chỉ xuất hiện trong database adapter. |

### 1.3. Findings ảnh hưởng thiết kế

1. `SQLiteProvider`/`useSQLiteContext` sẽ đưa database ownership về React tree và tạo
   đường truy cập từ Presentation. Cách đó không phù hợp manual composition root đã duyệt.
2. `withTransactionAsync()` có thể đưa query chạy ngoài callback vào transaction đang
   mở. Đây là behavior không phù hợp transaction scope chặt của Application.
3. `withExclusiveTransactionAsync()` cô lập callback tốt hơn, nhưng Expo từng ghi nhận
   implementation mở connection khác; `PRAGMA foreign_keys` lại là setting theo connection.
   Không được giả định helper này giữ FK chỉ vì owner connection đã bật FK.
4. `execAsync()` không bind/escape value. Nó chỉ được dùng cho SQL tĩnh do repository
   kiểm soát như `PRAGMA`, `BEGIN IMMEDIATE`, `COMMIT`, `ROLLBACK`; data value phải đi
   qua bound parameters.
5. JavaScript type system không thể ngăn một callback tự capture side-effect adapter.
   Kernel chỉ có thể không cung cấp side-effect capability; orchestration test ở Epic sau
   phải chứng minh side effect được gọi sau commit.
6. `US-02-01` cần async open/close nhưng không được triển khai luôn migration phases,
   hydration, reconciliation, Retry UX hoặc destructive recovery của Story sau.

## 2. Scope khóa cho implementation

### 2.1. In scope

- Cài `expo-sqlite` bằng Expo-compatible install flow và cập nhật root lockfile.
- Shared Application transaction contract, transaction scope opaque và typed technical error.
- Host fake/test double cho result-aware commit/rollback orchestration.
- Application-scoped SQLite connection owner với open/close single-flight, idempotent dispose.
- Xác lập và verify `PRAGMA foreign_keys = ON` trước khi connection được xem là usable.
- Transaction kernel chạy trên chính owner connection với SQL control statement tĩnh.
- Deterministic behavior cho success, returned failure, thrown failure và overlap/nesting.
- Internal parameter-binding executor cho adapter/repository tương lai.
- Minimal async application boot/dispose wiring để graph sở hữu đúng lifecycle.
- Architecture enforcement và automated host tests.
- Native runtime probe trên database file riêng để xác minh SDK behavior thật.
- Evidence record cho Story acceptance.

### 2.2. Out of scope

- Normative table/schema, migration `001`, `schema_migrations`, checksum hoặc seed.
- `PRAGMA user_version`, migration runner, compatibility/downgrade policy.
- `journal_mode = WAL`; chưa có acceptance hoặc benchmark yêu cầu trong Story này.
- Session/Timer/Reward/Pet/Inventory/Settings repository hoặc use case.
- `SessionCommandCoordinator`, reward/purchase transaction hoặc full reset.
- Hydration, startup reconciliation, readiness barrier hoàn chỉnh và Retry UX.
- Database auto-delete, auto-reset, auto-repair hoặc recovery action phá dữ liệu.
- ORM/query builder/DI container, second SQLite driver hoặc generic persistence framework.
- Production diagnostics route/screen hoặc public transaction access từ Presentation.
- Native/EAS build trong lượt planning này.

## 3. Technical decisions đã duyệt

Các decision dưới là **technical implementation decision**, không thay Product truth.
Tech Lead/Product Owner đã duyệt ngày 2026-08-27 và chúng là authoritative cho Story.

### TD-02-01-A — Direct async owner, không dùng React SQLite context

**Decision:** `SQLiteDatabaseOwner` trong mobile Infrastructure gọi async open API.
Composition root tạo đúng một instance/application graph. Không dùng `SQLiteProvider`,
`useSQLiteContext`, global singleton hoặc service locator.

**Rationale:** Ownership và startup/shutdown order nằm tại composition root; Presentation
không có đường nhận driver/native handle.

### TD-02-01-B — Same-connection explicit transaction kernel

**Decision:** Kernel dùng owner connection đã verify và thực thi:

```text
BEGIN IMMEDIATE
  → callback dùng opaque TransactionScope
  → repository adapter resolve scope thành private bound executor
  → callback ok=true  → COMMIT
  → callback ok=false → ROLLBACK, trả nguyên application failure
  → callback throw    → ROLLBACK, map technical error
```

Không chọn `withTransactionAsync()` làm primitive vì async query ngoài callback có thể bị
cuốn vào transaction. Không mặc định chọn `withExclusiveTransactionAsync()` trước khi
runtime probe chứng minh FK được bật trên connection thực thi transaction của SDK 57.

**Rationale:** `BEGIN IMMEDIATE` trên cùng private connection giữ FK setting và cho write
lock semantics rõ. Raw connection không thoát khỏi Infrastructure database module.

### TD-02-01-C — Opaque, result-aware Application contract

**Decision:** Shared Application contract mang ý nghĩa sau; exact TypeScript spelling được
refine trong Task `T02` nhưng không được đổi semantics:

```ts
interface TransactionScope {
  // Opaque marker only; no SQL/native/provider capability.
}

interface TransactionPort {
  execute<TValue, TError>(
    work: (
      scope: TransactionScope,
    ) => Promise<ApplicationResult<TValue, TError>>,
  ): Promise<ApplicationResult<TValue, TError | TransactionTechnicalError>>;
}
```

- `ok: true` chỉ được trả sau khi `COMMIT` thành công.
- `ok: false` từ callback buộc rollback và giữ nguyên business/application error.
- Exception hoặc control-statement failure được map sang application-owned technical code.
- `TransactionScope` không expose `runAsync`, SQL string, SQLite database hoặc side-effect port.
- Future repository port nhận `TransactionScope` khi command cần nhiều write atomic; exact
  repository signature thuộc `US-02-05`.

### TD-02-01-D — Reject overlap/nesting, không silently queue hoặc auto-commit

**Decision:** Một kernel chỉ cho một top-level transaction active. Lời gọi thứ hai khi
transaction đang mở bị reject deterministic bằng `TRANSACTION_BUSY`; không queue ngầm,
không tạo savepoint và không auto-commit transaction ngoài.

**Rationale:** Cơ chế này tránh deadlock re-entrant không thể phân biệt an toàn trong React
Native JavaScript. Session command serialization thuộc Epic sau. Nếu sau này cần queue hoặc
savepoint, phải có consumer/race evidence và update contract có review.

### TD-02-01-E — Stable technical errors, không rò provider exception

**Decision:** Story khóa tối thiểu các code:

| Code | Khi nào trả | Raw error policy |
|---|---|---|
| `DATABASE_NOT_OPEN` | Operation cần DB trước successful open hoặc sau close. | Không raw message. |
| `DATABASE_OPEN_FAILED` | Native open/FK enable/FK verification fail. | Giữ `cause` chỉ trong Infrastructure logging/test seam; không đưa Presentation. |
| `DATABASE_CLOSE_FAILED` | Native close fail. | Không thay thành success; dispose vẫn idempotent cho caller sau. |
| `TRANSACTION_BUSY` | Nested/overlapping transaction. | Deterministic, không phụ thuộc provider wording. |
| `TRANSACTION_BEGIN_FAILED` | Không lấy được transaction/write lock hoặc begin fail. | Map provider code nội bộ nếu cần chẩn đoán. |
| `TRANSACTION_COMMIT_FAILED` | Callback success nhưng commit fail. | Không trả callback value như committed truth. |
| `TRANSACTION_ROLLBACK_FAILED` | Rollback sau failure/throw không hoàn tất. | Ưu tiên recovery-required technical failure. |
| `TRANSACTION_WORK_FAILED` | Callback throw/provider query throw sau rollback thành công. | Không rò raw exception. |

Returned `ApplicationResult` failure không bị thay bằng `TRANSACTION_WORK_FAILED` khi
rollback thành công; đó vẫn là expected application failure của caller.

### TD-02-01-F — Async lifecycle chỉ ở mức kernel readiness

**Decision:** Mobile facade chuyển `boot()` và `dispose()` sang `Promise<void>`.
`MobileBootstrap` chỉ thêm database lifecycle prerequisite tối thiểu:

```text
idle → booting
  → database.open + verify FK
  → existing foundation snapshot
  → ready

dispose
  → unsubscribe lifecycle
  → wait in-flight boot/transaction settle
  → database.close
  → idle
```

Open failure map sang existing recovery boundary bằng stable database code. Migration phase,
schema verification, hydration, startup reconciliation, Retry và command readiness barrier
được thêm ở `US-02-04`, không có placeholder behavior giả trong Story này.

### TD-02-01-G — Không bật WAL trong Story này

**Decision:** Chỉ set/verify `foreign_keys`. `journal_mode = WAL` không được bật opportunistic.

**Rationale:** WAL có lifecycle/concurrency/device implications và không nằm trong acceptance
US-02-01. Có thể đưa vào migration/bootstrap plan sau khi có measured need và runtime evidence.

## 4. Target design

### 4.1. Ownership graph

```text
MobileApplicationRoot
  → createMobileApplication()                         [Composition]
      → new SQLiteDatabaseOwner(databaseName)         [Infrastructure]
      → new SQLiteTransaction(owner, scopeResolver)   [Infrastructure]
      → inject DatabaseLifecyclePort vào bootstrap    [Application]
      → future use cases nhận TransactionPort         [Application]

Presentation
  → MobileApplicationFacade
      └─ không expose SQLiteDatabaseOwner/TransactionPort/raw connection
```

Chỉ `SQLiteDatabaseOwner` import open/close API của `expo-sqlite`. Transaction adapter dùng
private driver interface do database module sở hữu, không import driver ở shared Application.

### 4.2. Connection owner state machine

```text
CLOSED
  └─ open() ─→ OPENING ─→ OPEN
                   └────→ CLOSED + DATABASE_OPEN_FAILED

OPEN
  ├─ open() ─→ same resolved connection
  └─ close() → CLOSING

OPENING
  ├─ open()  → await same in-flight promise
  └─ close() → await open settle, then close if opened

CLOSING
  ├─ close() → await same in-flight promise
  ├─ open()  → await close; nếu success thì start một open cycle mới
  ├─ native close success → CLOSED
  └─ native close fail → CLOSE_FAILED

CLOSE_FAILED
  ├─ close() → same typed failure; không gọi native close lặp ngoài policy đã review
  └─ open()  → reject; graph mới được tạo sau recovery/reload
```

Required invariants:

- Không có hai native open call cho cùng application graph trong một open cycle.
- Connection chỉ chuyển `OPEN` sau `PRAGMA foreign_keys = ON` và
  `PRAGMA foreign_keys` trả `1`.
- FK verification failure đóng connection vừa mở nếu có thể và trả `DATABASE_OPEN_FAILED`.
- `close()` chờ active transaction kết thúc; không đóng handle giữa commit/rollback.
- `close()` gọi lặp không gọi native close lần hai.
- Close failure không được giả thành `CLOSED`; graph giữ typed failed state để recovery
  sau này quyết định, không tự reopen/reset/delete database.
- Không có database deletion trong open/close failure path.

### 4.3. Transaction state machine

```text
IDLE
  └─ execute() → BEGINNING → ACTIVE
                    │           ├─ work ok=true  → COMMITTING → IDLE
                    │           ├─ work ok=false → ROLLING_BACK → IDLE
                    │           └─ work throws   → ROLLING_BACK → IDLE
                    └─ begin fail → IDLE + typed failure

BEGINNING | ACTIVE | COMMITTING | ROLLING_BACK
  └─ execute() → TRANSACTION_BUSY
```

Transaction scope hết hiệu lực ngay khi commit/rollback bắt đầu. Repository adapter dùng
scope cũ sau đó phải nhận typed internal misuse error, không chạy query ngoài transaction.

### 4.4. SQL execution boundary

Internal executor tối thiểu cần hỗ trợ:

- `run(sql, params)` cho write có bind value.
- `getFirst<T>(sql, params)` cho single-row read.
- `getAll<T>(sql, params)` chỉ khi Story sau có consumer; không cần thêm sớm.
- Private `execControlStatement(staticSql)` cho `PRAGMA` và transaction statements.

Rules:

- Data value chỉ đi trong params; không string interpolation.
- Dynamic identifier/table/order clause không được nhận từ user/provider input.
- Prepared statement phải finalize trong `finally` nếu adapter dùng explicit prepare API.
- Không cache/reuse một mutable prepared statement giữa overlapping caller.
- Không export executor từ package/mobile public index hoặc application facade.
- Owner không cung cấp public `getConnection()`. Transaction adapter và repository adapter
  tương lai chỉ nhận executor/scope hẹp do database module cấp; query entry point ngoài active
  scope không được bypass transaction state guard.

## 5. Authoritative execution plan cho solo developer

Chỉ một Task active tại một thời điểm. Mỗi Task phải pass local checks của chính nó trước
khi chuyển Task sau. Không bắt đầu schema/migration khi `T09` chưa hoàn tất.

### T00 — Plan approval và test gate

**Outcome:** Technical direction và authoritative runtime strategy được owner xác nhận.

- [x] Duyệt `TD-02-01-A` đến `TD-02-01-G`.
- [x] Xác nhận hybrid test strategy ở mục 8, không thêm driver thứ hai.
- [x] Native target đầu tiên là platform có development build khả dụng trước; exact
  platform được ghi trong evidence `T08`.
- [x] Xác nhận both-platform repeat vẫn thuộc `US-02-09`.

**Blocks:** `T01` về acceptance semantics; host contract refinement có thể chuẩn bị nhưng
không merge Story như complete trước Task này.

### T01 — Install compatible `expo-sqlite`

**Outcome:** Mobile workspace resolve đúng package dành cho Expo SDK 57 và lockfile ổn định.

- [ ] Chạy Expo-compatible install từ `apps/mobile` bằng pnpm toolchain đã pin.
- [ ] Review change chỉ gồm `apps/mobile/package.json` và root `pnpm-lock.yaml` cần thiết.
- [ ] Chạy Expo dependency compatibility check.
- [ ] Không bật SQLCipher, libSQL, FTS config hoặc custom native build flag.
- [ ] Không thêm ORM, Jest preset hoặc SQLite driver khác.

**Verification:** dependency list, lockfile diff, mobile typecheck, Expo package check.

**Blocks:** `T03`, `T04`, `T08`.

### T02 — Define Application transaction contract và host fake

**Outcome:** Shared Application diễn đạt transaction semantics mà không biết SQLite.

- [ ] Thêm opaque `TransactionScope`.
- [ ] Thêm result-aware `TransactionPort`.
- [ ] Thêm `TransactionTechnicalError` với stable code ở `TD-02-01-E`.
- [ ] Export production types qua `packages/application/src/index.ts`.
- [ ] Thêm fake trong package test support; không export fake ở runtime public API.
- [ ] Test fake: success commit, returned failure rollback, throw rollback, overlap reject.
- [ ] Type/boundary test: scope không có SQL/native/provider capability.

**Không làm:** repository port, session/reward DTO hoặc generic Unit of Work framework.

**Blocks:** `T04`, `T07`.

### T03 — Implement application-scoped SQLite connection owner

**Outcome:** Một owner mở/verify/đóng một native connection deterministic.

- [ ] Tạo database capability directory và private driver seam.
- [ ] Implement open single-flight/state machine.
- [ ] Set `PRAGMA foreign_keys = ON` ngay sau native open.
- [ ] Read back `PRAGMA foreign_keys` và yêu cầu exact enabled value.
- [ ] Cleanup handle khi initialization/verification fail.
- [ ] Implement close/dispose idempotent và in-flight coordination.
- [ ] Map native error sang application-owned lifecycle error.
- [ ] Giữ database filename là composition configuration, không hard-code trong screen/use case.
- [ ] Không expose raw native connection ngoài database Infrastructure module.

**Host verification:** fake driver đếm open/close và inject lỗi ở từng phase.

**Blocks:** `T04`, `T05`, `T08`.

### T04 — Implement same-connection transactional kernel

**Outcome:** Transaction port commit/rollback đúng trên private owner connection.

- [ ] Implement transaction state guard.
- [ ] Begin bằng static `BEGIN IMMEDIATE` trên owner connection.
- [ ] Tạo opaque scope và internal resolver chỉ hợp lệ khi state `ACTIVE`.
- [ ] Commit khi callback trả `ok: true`; chỉ trả value sau successful commit.
- [ ] Rollback khi callback trả `ok: false`; preserve error khi rollback thành công.
- [ ] Rollback khi callback throw/query fail; map raw failure.
- [ ] Nếu rollback fail, trả `TRANSACTION_ROLLBACK_FAILED` thay vì expected failure.
- [ ] Reject overlap/nested bằng `TRANSACTION_BUSY`.
- [ ] Release state guard trong mọi path bằng `finally` có kiểm soát.
- [ ] Track active promise để owner close chờ settle.
- [ ] Không nhận hoặc gọi provider/notification/analytics capability.

**Host verification:** scripted fake driver kiểm tra exact statement order và fault injection
ở begin/work/commit/rollback.

**Blocks:** `T05`, `T07`, `T08`.

### T05 — Wire minimal async boot/dispose lifecycle

**Outcome:** Production graph sở hữu connection từ boot tới dispose mà chưa kéo migration.

- [ ] Thêm mobile Application `DatabaseLifecyclePort` tối thiểu hoặc equivalent approved seam.
- [ ] Chuyển facade `boot()`/`dispose()` sang async contract.
- [ ] Boot gọi database open/verify trước existing foundation snapshot.
- [ ] Boot idempotent/single-flight khi React effect hoặc test gọi lặp.
- [ ] Dispose trong lúc boot không để late `ready` update sau unmount.
- [ ] Dispose unsubscribe lifecycle rồi đóng database an toàn.
- [ ] Open failure tạo typed recovery projection; không rò provider message.
- [ ] `MobileApplicationRoot` không return Promise từ effect cleanup; gọi async dispose an toàn.
- [ ] Không expose transaction/database qua Presentation context.
- [ ] Không thêm Retry, migration phase, hydration hoặc reconciliation giả.

**Blocks:** `T07`, `T08`.

### T06 — Strengthen architecture enforcement

**Outcome:** Chỉ database Infrastructure được phép import concrete SQLite driver.

- [ ] Thêm negative case: shared Application không import `expo-sqlite`.
- [ ] Thêm negative case: mobile Application không import `expo-sqlite`.
- [ ] Thêm negative case: Presentation/route không import `expo-sqlite`.
- [ ] Thêm negative case: composition không import driver trực tiếp; chỉ import owner adapter.
- [ ] Thêm restriction cho non-database Infrastructure nếu cấu hình ESLint cho phép rõ ràng.
- [ ] Giữ database Infrastructure import hợp lệ.
- [ ] Xác nhận production source không import `test/**`.

**Blocks:** `T09`.

### T07 — Complete deterministic host tests

**Outcome:** Contract, lifecycle và composition behavior có fast automated regression suite.

- [ ] Application contract/fake tests.
- [ ] Owner state-machine tests với fake driver.
- [ ] Transaction statement-order/fault-injection tests.
- [ ] Async mobile bootstrap integration tests.
- [ ] Composition single-owner/open-once/close-once tests.
- [ ] Parameter-binding/injection-shaped value test qua internal probe repository fake.
- [ ] Raw error non-leak test.
- [ ] Dispose-during-open và close-during-transaction test.
- [ ] Overlap/nested rejection test không dùng timing sleep dễ flaky.

**Blocks:** `T08`, `T09`.

### T08 — Run exact Expo SQLite runtime probe

**Outcome:** SDK 57 native runtime chứng minh behavior mà host fake không thể bảo đảm.

Probe phải dùng database riêng, ví dụ `pixeldoro-us-02-01-probe.db`; không chạy trên product
database. Harness chỉ kích hoạt khi `__DEV__` và explicit environment flag được set, không tạo
route/screen production.

- [ ] Reuse production owner/kernel; không reimplement transaction trong probe.
- [ ] Tạo probe repository nội bộ với bound parameters.
- [ ] Mở probe DB và assert `PRAGMA foreign_keys = 1`.
- [ ] Tạo probe parent/child schema trong probe DB.
- [ ] Commit path: insert hợp lệ, reopen/read thấy committed row.
- [ ] Returned-failure path: insert rồi trả `ok: false`, reopen/read không thấy row.
- [ ] Throw path: insert rồi throw, reopen/read không thấy row.
- [ ] FK path: invalid child insert fail và không persist partial row.
- [ ] Parameter-binding path: value chứa quote/SQL-shaped text được lưu như data.
- [ ] Overlap path trả stable `TRANSACTION_BUSY`, không provider-dependent message.
- [ ] Close/reopen path giữ committed row và owner dispose idempotent.
- [ ] Close probe DB trước khi xóa exact probe filename.
- [ ] Structured result log có platform, OS, app version, SDK/package version, commit SHA,
  timestamp và pass/fail từng assertion.
- [ ] Chạy ít nhất một native target ở Story này; repeat iOS + Android là final audit `US-02-09`.

Nếu runtime evidence cho thấy `BEGIN IMMEDIATE` qua driver API không an toàn hoặc foreign-key
setting không tồn tại trên transaction connection, dừng Story, không fallback âm thầm sang
helper/driver khác. Cập nhật plan/decision rồi review lại.

**Owner step:** development/native build và device run do owner thực hiện thủ công. Agent không
chạy native/EAS build nếu không có yêu cầu mới rõ ràng.

**Blocks:** `T09`.

### T09 — Story verification và evidence closeout

**Outcome:** Mọi acceptance criterion của `US-02-01` có evidence traceable.

- [ ] Chạy clean typecheck/lint/test/boundary validation.
- [ ] Chạy Expo dependency compatibility/doctor check không tạo native artifact.
- [ ] Review `git diff` không có schema/migration/product behavior ngoài scope.
- [ ] Ghi result vào `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`.
- [ ] Link automated output và runtime probe record tới từng acceptance criterion.
- [ ] Xác nhận không commit probe database, native build output, secret hoặc machine path.
- [ ] Mark checklist `US-02-01` chỉ sau evidence review.
- [ ] Chuyển `US-02-02` sang ready; không cùng lúc giữ `US-02-01` active.

## 6. Planned file impact

Tên file exact có thể tinh chỉnh trong Task nếu vẫn giữ ownership/boundary. Không tạo file
placeholder không có test hoặc consumer.

### 6.1. Files dự kiến tạo

| File/khu vực | Mục đích |
|---|---|
| `packages/application/src/ports/transaction.port.ts` | Opaque scope, result-aware transaction port. |
| `packages/application/src/ports/transaction.error.ts` | Stable application-owned technical error. |
| `packages/application/test/fakes/fake-transaction.ts` | Host fake, không runtime export. |
| `apps/mobile/src/application/ports/database-lifecycle.port.ts` | Mobile bootstrap open/close abstraction tối thiểu. |
| `apps/mobile/src/infrastructure/database/sqlite-database-owner.ts` | Concrete async connection lifecycle/FK verification. |
| `apps/mobile/src/infrastructure/database/sqlite-driver.ts` | Private narrow driver/executor seam nếu cần test injection. |
| `apps/mobile/src/infrastructure/database/sqlite-transaction.ts` | Application `TransactionPort` implementation. |
| `apps/mobile/src/infrastructure/database/sqlite-transaction-scope.ts` | Opaque-scope resolver/private executor nếu tách file làm rõ lifecycle. |
| `apps/mobile/src/infrastructure/database/*.test.ts` | Owner/kernel host tests với fake driver. |
| `apps/mobile/src/composition/diagnostics/run-sqlite-kernel-probe.ts` | Explicit dev-only native probe, không product route. |
| `apps/mobile/test/device/sqlite-kernel-smoke.md` | Owner-run steps và evidence template. |

`sqlite-driver.ts` và `sqlite-transaction-scope.ts` chỉ tách khi giảm coupling/test seam thật;
nếu implementation rõ hơn trong hai file owner/transaction thì không tạo abstraction/file thừa.

### 6.2. Files dự kiến cập nhật

| File | Change boundary |
|---|---|
| `apps/mobile/package.json` | Thêm compatible `expo-sqlite`; có thể thêm non-native probe validation script. |
| `pnpm-lock.yaml` | Dependency resolution do Expo install flow tạo. |
| `packages/application/src/index.ts` | Export production transaction types/errors. |
| `apps/mobile/src/application/index.ts` | Export mobile lifecycle/facade types cần thiết. |
| `apps/mobile/src/application/bootstrap/mobile-bootstrap.ts` | Minimal async DB prerequisite; chưa migration/hydration/retry. |
| `apps/mobile/src/application/mobile-application.facade.ts` | Async `boot`/`dispose`; không expose DB/transaction. |
| `apps/mobile/src/composition/create-mobile-application.ts` | Tạo một owner/kernel và inject manual. |
| `apps/mobile/src/composition/mobile-application-root.tsx` | Async effect lifecycle/cancellation-safe cleanup. |
| Existing composition/bootstrap tests | Update thành async và inject fake lifecycle/DB. |
| `eslint.config.mjs` | Driver import allowlist/restriction. |
| `scripts/validate-boundaries.mjs` | Positive/negative SQLite ownership cases. |
| `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md` | Tạo/cập nhật trong `T09`, không phải lượt planning. |

### 6.3. Files/khu vực không được chạm trong Story

- `packages/domain/**`.
- Product screens/routes/stores ngoài minimal root lifecycle wiring.
- `infrastructure/database/migrations/**`, mappers và product repositories.
- Timer/Session/Pet/Gamification specifications hoặc production behavior.
- Native `ios/**`, `android/**`, EAS config và generated native artifacts, trừ khi owner tạo
  lượt riêng có scope rõ.

## 7. Acceptance-to-evidence matrix

| `US-02-01` acceptance | Primary evidence | Secondary evidence |
|---|---|---|
| Compatible Expo SQLite + lockfile | Expo package check; manifest/lockfile diff | `expo-doctor` output. |
| Chỉ owner khởi tạo concrete connection | ESLint/boundary negative cases | Composition diff review. |
| Một application-scoped implementation, dispose idempotent | Composition integration test | Owner open/close call-count test. |
| FK bật trước repository access | Native runtime probe `foreign_keys=1` + invalid FK insert | Owner initialization-order test. |
| Commit toàn bộ write khi success | Native committed-row/reopen probe | Fake statement-order test. |
| Rollback returned failure | Native no-row-after-reopen probe | Result-aware contract test. |
| Rollback throw/query failure | Native no-partial-row probe | Fault-injection test. |
| Nested/overlap defined | `TRANSACTION_BUSY` deterministic tests | State-machine review. |
| No provider side-effect capability trong kernel | Public type/boundary review | Future orchestration evidence deferred. |
| Parameter binding | SQL-shaped value native probe | Executor API review/test. |
| Typed open/transaction/close failure | Fault-injection matrix | Presentation non-leak test. |
| Architecture checks pass | lint + boundary validator output | Typecheck. |

### 7.1. Acceptance clarification: side effects

Story này chứng minh transaction scope/kernel **không cung cấp** notification, analytics,
feedback, audio, haptic hoặc provider capability. Việc chứng minh một concrete product use case
không tự capture/call side effect trước commit thuộc Story triển khai use case đó; không tạo fake
Timer/Reward use case chỉ để thỏa criterion bằng scope creep.

## 8. Test strategy — resolution cho `EPIC02-INPUT-01`

### 8.1. Strategy

| Tier | Runtime | Chứng minh | Không được dùng để kết luận |
|---|---|---|---|
| A — Host unit/contract | Vitest Node + fake driver/transaction | State machine, statement order, result mapping, lifecycle, boundary, fault injection. | Native SQLite atomicity/FK behavior. |
| B — Expo native runtime probe | Exact `expo-sqlite` trong development build | FK per connection, `BEGIN IMMEDIATE`, commit/rollback/reopen, bound value, close behavior. | Full normative schema/migration hoặc both-platform Epic exit. |
| C — Epic exit device audit | iOS và Android owner-run ở `US-02-09` | Cross-platform final database/bootstrap confidence. | Thay thế automated host regression. |

**Owner-approved resolution — 2026-08-27:** Dùng cả Tier A + Tier B cho `US-02-01`;
không thêm SQLite driver thứ hai. Tier B chạy trên native platform có development build
khả dụng trước và ghi exact platform trong evidence trước Story acceptance. Tier C lặp lại
cả iOS và Android sau toàn bộ `US-02-01` → `US-02-08`.

### 8.2. Vì sao không dùng second driver cho host integration

Một Node SQLite package khác có thể chứng minh generic SQL nhưng không chứng minh bridge,
connection hoặc transaction semantics của `expo-sqlite`. Nó cũng tạo dependency và behavior
surface thứ hai. Exact SQL/schema tests có thể bổ sung tooling sau nếu có compatibility need
được chứng minh; không làm mặc định trong `US-02-01`.

### 8.3. Runtime probe guardrails

- Chỉ chạy khi explicit dev flag bật; production/default boot không chạy probe.
- Exact probe database name constant, validate trước delete.
- Không dùng product database hoặc table name normative.
- Cleanup chạy sau close; nếu cleanup fail, log exact probe path/name để owner xử lý thủ công.
- Probe output không chứa user data, secret hoặc raw absolute device path.
- Không tạo product UI/route để chạy test.

## 9. Verification commands dự kiến

Exact script name có thể thay đổi nếu package scripts được giữ ổn định. Implementation PR phải
ghi command thực tế và exit status trong evidence.

```sh
pnpm --filter @pixeldoro/application typecheck
pnpm --filter @pixeldoro/application test
pnpm --filter @pixeldoro/mobile typecheck
pnpm --filter @pixeldoro/mobile lint
pnpm --filter @pixeldoro/mobile test
pnpm validate:boundaries
pnpm typecheck
pnpm lint
pnpm test
```

Expo dependency compatibility/doctor checks được chạy theo scripts/toolchain repository. Không
chạy `expo run:*`, local EAS build hoặc tạo `ios/`/`android/` artifact trong automated plan turn.

## 10. Fault-injection matrix

| Injection point | Expected durable/observable result |
|---|---|
| Native open throws | `DATABASE_OPEN_FAILED`; graph không ready; không delete DB. |
| FK enable throws | Connection cleanup attempted; `DATABASE_OPEN_FAILED`; không repository access. |
| FK readback `0`/invalid | Open rejected; connection không publish. |
| Native close throws | `DATABASE_CLOSE_FAILED`; không giả `CLOSED`, auto-reopen hoặc auto-delete. |
| Begin fails/locked | `TRANSACTION_BEGIN_FAILED`; callback không chạy. |
| Callback returns failure | Rollback; same application error returned. |
| Callback throws | Rollback; `TRANSACTION_WORK_FAILED`; raw message không tới Presentation. |
| Commit fails | Không trả value; rollback attempt theo reviewed driver behavior; technical failure. |
| Rollback fails | `TRANSACTION_ROLLBACK_FAILED`; graph cần recovery, không giả success. |
| Second execute while active | `TRANSACTION_BUSY`; first transaction không bị auto-commit/rollback bởi call thứ hai. |
| Close while work active | Close waits transaction settle, rồi close once. |
| Dispose during open | Không late-ready; handle mở xong được close. |
| Close called twice | Second call resolves idempotently; native close once. |
| Bound value chứa quote/SQL text | Persist/read đúng literal value; không execute injected SQL. |

Commit failure handling phải được xác minh trên exact driver: nếu provider đã kết thúc transaction
hoặc rollback không hợp lệ sau failed commit, adapter map an toàn theo observed state, không giả
định bằng provider message. Plan phải update nếu runtime behavior khác matrix.

## 11. Delivery slices và review checkpoints

Đề xuất chia commit/PR review theo slices nhỏ nhưng vẫn giữ một Story active:

1. **Contract slice:** `T01` + `T02`; package compatible, Application port/fake pass.
2. **Kernel slice:** `T03` + `T04`; owner/transaction host tests pass.
3. **Lifecycle slice:** `T05` + `T06`; composition async và boundary pass.
4. **Evidence slice:** `T07` + `T08` + `T09`; native probe và acceptance mapping complete.

Không merge một slice làm app production boot phụ thuộc database nếu error path/cleanup của cùng
slice chưa pass. Nếu repository policy yêu cầu một PR/Story, dùng commit checkpoints tương ứng.

## 12. Risks, stop conditions và rollback plan

### 12.1. Main risks

| Risk | Mitigation | Stop condition |
|---|---|---|
| Transaction helper dùng connection khác, FK off | Same-connection explicit kernel + native FK probe. | Invalid FK insert được commit hoặc connection identity không bảo đảm. |
| Query ngoài scope chen vào transaction | Private connection, state guard, no raw handle export. | Runtime chứng minh outside operation chạy trong active transaction ngoài contract. |
| Async boot race/unmount | Boot single-flight + generation/cancellation test + awaited close. | Late `ready` sau dispose hoặc handle leak. |
| Error mapping che mất rollback failure | Rollback failure có code ưu tiên riêng. | Test không phân biệt work failure với rollback failure. |
| Diagnostics làm bẩn product DB/UI | Separate exact probe DB, dev flag, no route. | Probe chạm product database hoặc production default boot. |
| Story kéo migration/schema vào sớm | File scope review và `US-02-02` giữ inactive. | Normative product table/migration xuất hiện trong diff. |

### 12.2. Rollback/revert strategy

- Dependency/contract slice có thể revert độc lập trước khi app boot dùng database.
- Khi lifecycle slice đã merge, revert phải đưa facade/bootstrap tests về synchronous contract
  cùng lúc; không để mixed sync/async API.
- Không rollback bằng cách xóa product database.
- Probe cleanup chỉ được xóa exact test database name đã validate.
- Nếu native SDK behavior không đạt, giữ Story `IN_PROGRESS`/`BLOCKED_FOR_TECH_REVIEW`, revert
  risky adapter slice nếu cần và update technical decision; không đổi Data Model invariant.

## 13. Definition of Done cho `US-02-01`

Story chỉ `DONE` khi:

- [ ] `T00` → `T09` hoàn tất theo order.
- [ ] Mọi acceptance criterion trong `EPIC-02_USER_STORIES.md` có evidence.
- [ ] Application/Presentation/Domain không import SQLite/native type.
- [ ] Một composition graph chỉ có một connection owner/transaction implementation.
- [ ] Open/FK verification/close lifecycle deterministic và idempotent.
- [ ] Result-aware commit/rollback, throw, overlap và failure mapping đều pass.
- [ ] Native runtime probe pass trên ít nhất một platform bằng exact Expo SDK/package.
- [ ] No raw provider error/value/connection lọt ra Presentation.
- [ ] No schema/migration/product behavior scope creep.
- [ ] No native artifact/probe DB/secret được commit.
- [ ] `EPIC-02_IMPLEMENTATION_EVIDENCE.md` được reviewer chấp nhận.

Sau đó `US-02-02` mới đủ dependency gate để active. Both-platform native evidence vẫn được
audit lại ở `US-02-09`; việc pass một platform trong Story này không tự hoàn thành Epic exit gate.

## 14. Owner confirmations đã chốt

| ID | Resolution | Status | Approved at |
|---|---|---|---|
| `US0201-CONFIRM-01` | Dùng same-connection explicit `BEGIN IMMEDIATE` kernel; runtime probe là backstop. | `APPROVED` | 2026-08-27 |
| `US0201-CONFIRM-02` | Resolve `EPIC02-INPUT-01` bằng host fake + exact Expo native probe; không second driver. | `APPROVED` | 2026-08-27 |
| `US0201-CONFIRM-03` | Chạy platform có development build khả dụng trước; ghi exact target ở `T08`; cả hai platform vẫn thuộc `US-02-09`. | `APPROVED` | 2026-08-27 |

Không có Product decision `OPEN-001`, `OPEN-006` hoặc `OPEN-009` nào cần chốt cho
`US-02-01`. Không được dùng các confirmation kỹ thuật trên để thêm Pet naming/species,
contribution color, Timer/Session behavior hoặc reward/purchase behavior.

## 15. References

- [EPIC-02 User Stories](./EPIC-02_USER_STORIES.md)
- [MVP Epic Plan](./MVP_EPICS.md)
- [Product Core Truth](../PIXELDORO_CORE_TRUTH.md)
- [Data Model](../architecture/data-model.md)
- [System Architecture](../architecture/system-architecture.md)
- [Project Structure](../architecture/project-structure.md)
- [Technical Overview](../architecture/technical-overview.md)
- [ADR-003 — State and Persistence](../architecture/decisions/ADR-003-state-and-persistence.md)
- [ADR-004 — Domain and Platform Boundaries](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md)
- [Expo SQLite documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo issue #41986 — exclusive transaction connection/FK caveat](https://github.com/expo/expo/issues/41986)
