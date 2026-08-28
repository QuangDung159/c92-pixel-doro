---
document_id: PIXELDORO_US_02_04_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-02-04 Implementation Plan
version: 0.5.0
status: DONE
implementation_status: DONE
last_updated: 2026-08-28
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
language: vi
scope:
  - mobile_mvp
  - epic_02
  - us_02_04
  - safe_bootstrap
  - readiness_barrier
  - durable_hydration
  - startup_reconciliation_boundary
authority: PLANNING
story_baseline: ./EPIC-02_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
timer_engine_baseline: ../specifications/timer-engine.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundaries: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-02-04 — Safe Bootstrap và Readiness Barrier

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan cho `US-02-04` thuộc
`EPIC-02 — Durable Local Data, Migration và Safe Bootstrap`.

**Story outcome:** App chỉ publish `ready` sau khi cùng application-scoped SQLite owner đã
open/FK-ready, migration-compatible, physical schema/durable invariants được verify, bootstrap
snapshot được hydrate từ committed SQLite và startup-reconciliation boundary đã hoàn tất.
Mọi trạng thái trước đó hoặc failure giữ readiness gate đóng và không expose raw SQLite/provider
detail.

**Dependency:** `US-02-03 DONE` — exact migration runner/checksum/history/native evidence đã đạt
trên commit `1b6a0427b3db20f4536a2b251101fa0e32b5c0ea`; documentation closeout ở commit
`ce1a08a91042416b288679ee144ab76675facdbd`.

**Priority:** `MUST` / `P1_DURABILITY` / execution order `04` trong EPIC-02.

**Blocks:** `US-02-05` và `US-02-07`. Repository integration không được xây trên graph chưa
ready; recovery/Retry cần consume stable bootstrap phase/error contract của Story này.

**Planning status:** `DONE`. **Implementation status:** `DONE`.

`US0204-CONFIRM-01` đến `04` đã được Dũng Lư duyệt ngày 2026-08-28. Technical decision
gate đã đóng; production/host implementation và owner native evidence `T01 → T10` đã hoàn tất.
Exact iOS probe pass `9/9` assertions trên implementation SHA
`b36bc45190129da07e42d046f2badf6fddcd99e4`, khớp repository `HEAD` khi review.
Không implement production Session reconciliation, repository suite, Retry UX hoặc reset.

### 0.1. Readiness gate hiện tại

- [x] `US-02-01 DONE`: application-scoped SQLite owner/transaction kernel.
- [x] `US-02-02 DONE`: normative schema, exact singleton/catalog seed và verifier manifest.
- [x] `US-02-03 DONE`: migration port/runner/registry/checksum và compatibility failure.
- [x] Current bootstrap code/failure/single-flight/dispose behavior đã được review.
- [x] Không có `US-02-05/07` implementation active song song.
- [x] `US0204-CONFIRM-01` durable bootstrap snapshot được owner duyệt ngày 2026-08-28.
- [x] `US0204-CONFIRM-02` verifier surface được owner duyệt ngày 2026-08-28.
- [x] `US0204-CONFIRM-03` recovery connection/Retry ownership được owner duyệt ngày 2026-08-28.
- [x] `US0204-CONFIRM-04` reconciliation/lifecycle/readiness seam được owner duyệt ngày 2026-08-28.
- [x] Plan chuyển `READY_FOR_IMPLEMENTATION`.
- [x] `T01 → T08` implementation, host matrix, probe/runbook và host quality pass.
- [x] `T09` exact owner native report được tiếp nhận và đối chiếu final SHA.

## 1. Baseline và current-state review

### 1.1. Authority contract

| Authority | Contract áp dụng cho `US-02-04` |
|---|---|
| `EPIC-02_USER_STORIES.md` | Exact order open → migrate → verify → hydrate → reconciliation boundary → ready; fail closed và command gate. |
| System Architecture §5.1–5.2 | Composition root sở hữu graph/startup/shutdown; Presentation không chạy core command trước migration/reconciliation readiness. |
| System Architecture §7 | Application-owned result/error/projection; provider/raw row không vượt boundary; committed truth mới được publish. |
| Project Structure §4.1–4.2 | Bootstrap orchestration ở mobile Application/Composition; SQL/verifier/read adapter ở database Infrastructure; route mỏng. |
| Technical Overview §5, §10 | SQLite durable truth; Zustand/projection hydrate lại; migration/database failure fail safely và có future recovery path. |
| Data Model §2.3, §6.1, §8, §11, §13 | No-second-truth, exact economy sums, no repair, migration barrier và mobile integration evidence. |
| Timer Engine §4.2, §6.6, §12.1 | `APP_STARTED`/startup reconciliation phải đứng trước future core mutation; Story này chỉ tạo seam, không resolve session. |
| ADR-003/004 | SQLite là durable authority; UI/Application state chỉ là projection có thể rebuild. |

### 1.2. Repository hiện tại sau `US-02-03`

| Khu vực | Current state | Hệ quả cho plan |
|---|---|---|
| `SQLiteDatabaseOwner` | `open()` bật/readback FK, single-flight; `close()` chờ lease và idempotent. | Reuse exact owner; không mở connection từ verifier/adapter/screen. |
| `MigrationRunner` | Preflight registry/history rồi per-migration atomic apply/history; latest no-op. | Composition inject runner ngay sau successful open; không gọi initial wrapper trực tiếp. |
| `MobileBootstrap` | `idle → booting → open DB → in-memory FoundationSnapshot → ready`; recovery chỉ open/generic foundation failure. | Phải thay placeholder bằng durable ordered pipeline và phase-specific sanitized failure. |
| Foundation snapshot | ID/time/domain package tạo từ Clock/ID, không đọc SQLite. | Stop using trong production bootstrap; không xóa shared Epic-01 artifact nếu chưa cần. |
| Hydration/repository | Chưa có bootstrap-specific read port/adapter hoặc full repository. | Tạo read slice tối thiểu; full typed repository/mapper vẫn `US-02-05`. |
| Physical verifier | Initial migration có apply-time verification; chưa có startup verifier cho existing DB. | Thêm read-only runtime verifier; không upsert/reseed/repair. |
| Presentation boundary | Loading/recovery chặn children; recovery hiện chỉ show stable code, chưa Retry. | Reuse barrier; chỉ minimal phase-safe rendering, Retry thuộc `US-02-07`. |
| Lifecycle | App-scoped port/subscription test có; production composition dùng no-op adapter. | Plan khóa minimal real lifecycle ownership nhưng không dispatch Session command. |
| Reconciliation | Chưa có port/fake/production behavior. | Tạo explicit replaceable boundary; production Session logic chờ `EPIC-03`. |

### 1.3. Review findings cần xử lý

1. `ready` hiện có thể xuất hiện mà migration chưa chạy và durable seed chưa được đọc; đây là
   blocker correctness trực tiếp của Story.
2. Foundation snapshot trong memory là Epic-01 scaffold, không phải durable hydration. Không
   được đổi tên nó thành database snapshot rồi giữ Clock/ID-generated truth.
3. Migration success không tự chứng minh physical database hiện tại đúng. Startup cần verify
   existing schema/seed/invariants sau migration và trước mọi bootstrap read projection.
4. Full repository suite trước bootstrap sẽ đảo dependency order và kéo `US-02-05`; cần một
   bootstrap-specific read adapter có surface hẹp, read-only và được thay/reuse có chủ đích.
5. `schema_migrations` là version truth, nhưng physical verifier vẫn phải fail nếu schema/catalog
   drift dù history exact. Không update history hoặc reseed để “sửa”.
6. Stored `pet_profiles` XP/Coin phải khớp immutable receipt sums; mismatch đi recovery và giữ
   rows, không clamp/recompute/write-back.
7. Current `boot()` coalesce in-flight và `dispose()` bảo vệ late-ready; refactor phải giữ các
   invariant này cho mọi phase, không chỉ database open.
8. Recovery/Retry UX là `US-02-07`. Story này phải tạo stable failure phase/code và reusable
   attempt seam nhưng không thêm Retry button/reset path.
9. Startup reconciliation production behavior thuộc `EPIC-03`; một no-op seam chỉ hợp lệ khi
   explicit, được gọi đúng order và không tuyên bố đã resolve durable Session.
10. `BootstrapBoundary` đã là Presentation readiness barrier. Command readiness còn cần một
    application-owned guard test được dù chưa có product command trong Epic 2.
11. Side-effect/provider readiness (analytics, notification, audio, haptic, store review) không
    được đưa vào success prerequisites.
12. AppState/lifecycle callback trong Story này chỉ cập nhật lifecycle projection/ownership;
    không background/foreground/reconcile Session.

## 2. Scope contract

### 2.1. In scope

- Application-owned bootstrap durable snapshot, phase/result/error và readiness guard.
- Bootstrap-specific read-only port/SQLite adapter cho installation/settings/profile/catalog.
- Read-only runtime verifier cho migration-compatible physical schema, seed và bounded durable
  invariants.
- Exact ordered async pipeline trên một application-scoped owner/connection.
- Migration runner integration tại production composition root.
- Explicit startup-reconciliation port/fake/no-op adapter với Epic-03 replacement note.
- Application-scoped lifecycle ownership, single registration và safe disposal.
- Single-flight repeated/concurrent boot; no late-ready after dispose/failure.
- Minimal loading/recovery boundary giữ core children và readiness guard đóng.
- Host orchestration/fault matrix và dev-only exact Expo SQLite bootstrap probe/runbook.
- Evidence/status closeout sau owner native report.

### 2.2. Explicit out of scope

- Full entity repository/mapper/CRUD suite của `US-02-05`.
- Derived history/cadence/review/economy queries của `US-02-06`.
- User-facing Retry action, retry concurrency policy và recovery copy matrix của `US-02-07`.
- Reset executor/confirmation/reseed của `US-02-08`/Epic 10.
- Production Session command coordinator/reconciliation/terminal/reward behavior của `EPIC-03`.
- Running-session resolution, notification ensure/cancel hoặc analytics startup delivery.
- Persistent Zustand store hoặc Product navigation/onboarding gate.
- Pet species/name/stage, contribution colors hoặc quyết định Product còn `OPEN`.
- Production schema/migration `002`, repair migration hoặc data backfill.
- Native/EAS build, prebuild, iOS/Android generated output hoặc second SQLite driver.

## 3. Technical directions đề xuất — chờ owner confirmation

### TD-02-04-A — Minimal durable bootstrap snapshot

**Proposal:** `ready` mang application-owned immutable snapshot đọc trong một ordered bootstrap
attempt từ committed SQLite:

```text
BootstrapDurableSnapshot
  migrationVersion
  installation
    installedAt
    onboardingCompletedAt | null
  settings
    focusDurationMinutes
    shortBreakMinutes
    longBreakMinutes
    defaultMode
    soundEnabled
    hapticsEnabled
    notificationsEnabled
    analyticsEnabled
  profile
    totalXp
    coinBalance
  catalog[]
    id
    displayName
    category
    priceCoins
    catalogVersion
```

- Không expose raw row, audit timestamp không cần cho Presentation, anonymous analytics ID,
  session/receipt/ownership/store-review/analytics queue hoặc Pet identity.
- Snapshot là initial durable projection, không trở thành writable truth thứ hai.
- Không dùng Clock/ID để fabricate bootstrap data; Clock chỉ phục vụ future reconciliation.
- Full repository DTO/capability vẫn thuộc `US-02-05`.

**Status:** `APPROVED 2026-08-28` — `US0204-CONFIRM-01`.

### TD-02-04-B — Bounded read-only verifier surface

**Proposal:** Sau migration, trước hydration, verifier chạy trên cùng owner connection và fail
closed nếu một trong các check sau không đạt:

1. Exact latest migration history identity/checksum đã được runner xác nhận.
2. SQLite integrity check trả exact `ok`; `PRAGMA foreign_key_check` không có violation.
3. Exact expected tables/columns/default/PK, FK rows và trusted normalized DDL fingerprint cho
   table CHECK constraints, named indexes/triggers của current latest schema manifest.
4. Installation/settings/profile có đúng một row; stored values đúng type/range/enum.
5. Catalog có đúng `12` rows và exact approved ID/name/category/price/version.
6. `pet_profiles.total_xp` bằng reward XP sum; `coin_balance` bằng reward + purchase Coin sum,
   empty sum là `0`.

Verifier chỉ đọc; không insert/update/delete, reseed, sửa history, clamp hoặc auto-repair.
Per-row Session/receipt/ownership mapper validation và derived query correctness thuộc
`US-02-05/06`; Session reconciliation thuộc `EPIC-03`.

**Status:** `APPROVED 2026-08-28` — `US0204-CONFIRM-02`.

### TD-02-04-C — Recovery connection lifecycle và Retry ownership

**Proposal:**

- Open failure → recovery, không có connection lease.
- Migration/verification/hydration/reconciliation failure sau successful open → giữ owner
  connection application-scoped nhưng gate đóng; chỉ `dispose()` đóng connection.
- Failure projection chỉ chứa stable `phase` + sanitized application code; không raw message,
  SQL/provider type hoặc row.
- `boot()` concurrent/repeated trong in-flight coalesce; `boot()` khi `ready` hoặc `recovery`
  là no-op deterministic.
- Tách internal `runAttempt()`/phase seams để `US-02-07` thêm Retry sau này, nhưng Story này
  không expose Retry action/button và không tự reset/close-reopen database.
- Dispose ở mọi phase invalidates generation, chờ/settle attempt, unsubscribe một lần, close
  owner một lần và không publish late `ready`.

**Status:** `APPROVED 2026-08-28` — `US0204-CONFIRM-03`.

### TD-02-04-D — Reconciliation/lifecycle seam và readiness guard

**Proposal:**

- `StartupReconciliationPort.reconcileAtStartup()` là application-owned barrier trả typed
  result, được gọi sau verify/hydrate và trước `ready`.
- Epic 2 production dùng explicit `NoopStartupReconciliationAdapter`, không đọc/mutate Session,
  kèm replacement note bắt buộc cho `EPIC-03`.
- `AppLifecyclePort` bổ sung read current state; production composition dùng minimal React
  Native AppState adapter/application-scoped subscription. Adapter map `AppState.currentState`
  và event sang mobile `active|background`; Story này không dispatch Session command.
- `ReadinessGate` đóng ở idle/booting/recovery/disposed và chỉ mở sau reconciliation success.
  Một fake future command chứng minh pre-ready/recovery rejection bằng stable
  `CORE_COMMANDS_NOT_READY` và zero side effect.
- Presentation tiếp tục chỉ render core children khi projection `ready`; UI loading/recovery
  tối thiểu không chứa Retry/reset/Product navigation mới.

**Status:** `APPROVED 2026-08-28` — `US0204-CONFIRM-04`.

## 4. Bootstrap contract chi tiết

### 4.1. Ordered success pipeline

```text
boot request
  → coalesce current attempt
  → projection = booting(open), readiness gate = closed
  → databaseOwner.open()              // includes FK ON + readback
  → projection phase = migration
  → migrationRunner.migrate()
  → projection phase = verification
  → bootstrapVerifier.verify()
  → projection phase = hydration
  → bootstrapData.loadSnapshot()
  → register lifecycle exactly once / capture latest mapped state
  → projection phase = reconciliation
  → startupReconciliation.reconcileAtStartup()
  → publish immutable ready snapshot
  → readiness gate = open
```

Gate open là bước logic cuối cùng cùng ready publication path. Không có intermediate projection
được Presentation hiểu là usable. Nếu update ordering cần atomicity trong memory, update gate và
projection trong cùng synchronous completion block, với test listener không quan sát trạng thái
mâu thuẫn.

### 4.2. Bootstrap phases và typed failure

```text
BootstrapPhase
  opening
  migrating
  verifying
  hydrating
  reconciling

BootstrapFailureCode
  DATABASE_OPEN_FAILED
  BOOTSTRAP_MIGRATION_FAILED
  BOOTSTRAP_VERIFICATION_FAILED
  BOOTSTRAP_HYDRATION_FAILED
  BOOTSTRAP_RECONCILIATION_FAILED
```

- Migration runner error detail có thể được giữ trong internal diagnostic category nhưng public
  recovery projection chỉ map stable bootstrap code + phase.
- Error không chứa exception message, raw SQL, table/row value, path hoặc native provider object.
- Dispose/close failure không fabricate `ready`; cleanup error log/report được sanitize theo
  existing lifecycle policy và không trở thành Product recovery decision trong Story này.

### 4.3. Hydration read rules

- Adapter dùng static trusted SQL + bound params khi có input; cùng owner lease, không second DB.
- Query singleton bằng exact `id = 1`, yêu cầu đúng một row và strict mapper type/value.
- Catalog order deterministic theo approved manifest/order contract; compare exact set trước
  publish.
- Boolean SQLite `0/1` map explicit sang boolean; không truthy coercion.
- Enum `default_mode` chỉ `relax|strict`; category chỉ baseline approved value.
- Missing/duplicate/invalid row fail hydration/verification; không fill bằng hard-coded default.
- Snapshot arrays/objects readonly; Presentation không nhận write adapter/capability.

### 4.4. Verifier read/failure rules

- Verifier chạy sau migration success, kể cả latest no-op.
- Dùng current latest schema manifest; future migration phải update verifier contract cùng version.
- SQLite integrity/FK/schema queries fail → verification failure, không fallback.
- Economy sum dùng integer/null-safe SQL; mapper reject non-safe integer/range violation.
- Mismatch giữ toàn bộ database unchanged; before/after fingerprint là required evidence.
- Không gọi `initialSchemaMigration.apply`, seed helper hoặc migration history write.

### 4.5. Lifecycle, subscription và dispose

- Một application graph có tối đa một AppState subscription và đọc initial current state đúng
  một lần mỗi bootstrap attempt/graph theo contract đã duyệt.
- Adapter map `active` → `active`; inactive/background/non-active → `background` cho projection.
- Callback trong boot/recovery không mở readiness và không gọi Session mutation.
- Repeated/concurrent boot không subscribe lặp.
- Dispose during any deferred phase invalidates attempt; late completion cannot subscribe/open gate.
- Dispose lặp coalesce/idempotent; provider raw exception không tới React cleanup.

### 4.6. No second truth / command gate

- SQLite snapshot là nguồn rebuild; readiness/gate/lifecycle là in-memory operational state.
- Không persist bootstrap phase, recovery code hoặc ready flag vào SQLite/Zustand/settings.
- `ReadinessGate` không thay SQLite invariant; chỉ ngăn future command chạy trước graph safe.
- Fake command test bắt buộc chứng minh work callback không được invoke khi gate closed.
- Gate đóng lại trước dispose/cleanup; future `US-02-07/08` phải dùng cùng barrier.

## 5. Authoritative execution plan cho solo developer

Chỉ một Task active tại một thời điểm. Không implement `US-02-05` hoặc `US-02-07` song song.

### T00 — Owner decision gate

**Outcome:** Snapshot/verifier/recovery/reconciliation contracts được duyệt.

- [x] Duyệt `US0204-CONFIRM-01` minimal durable snapshot.
- [x] Duyệt `US0204-CONFIRM-02` read-only verifier surface.
- [x] Duyệt `US0204-CONFIRM-03` recovery owner lifecycle/Retry boundary.
- [x] Duyệt `US0204-CONFIRM-04` reconciliation/lifecycle/readiness seam.
- [x] Chuyển plan `READY_FOR_IMPLEMENTATION`; tại gate này implementation vẫn `NOT_STARTED`.

**Blocks:** mọi implementation Task.

### T01 — Freeze bootstrap state/result/error/readiness contracts

**Outcome:** Application-owned phase/snapshot/failure/gate API ổn định trước concrete SQL.

- [x] Define exact `BootstrapProjection`, phase, public failure code và durable snapshot DTO.
- [x] Define bootstrap data/verifier/reconciliation ports không SQL/SQLite/React type.
- [x] Define readiness gate closed/open transitions và guarded fake command contract.
- [x] Map Migration/verification/hydration/reconciliation failure tới stable code.
- [x] Freeze no-Retry/no-reset public surface cho Story này.
- [x] Audit không chốt Product `OPEN-001`, `OPEN-006`, `OPEN-009`.

**Blocks:** `T02`, `T03`, `T04`, `T06`.

### T02 — Implement bootstrap runtime verifier

**Outcome:** Migration-compatible nhưng physically/invariant-invalid DB fail read-only.

- [x] Implement integrity/FK checks trên same owner connection.
- [x] Verify exact current tables/columns/FKs và normalized table/index/trigger DDL fingerprints
  từ approved manifest/artifact.
- [x] Verify exact singleton count/shape và catalog `12` rows.
- [x] Verify XP/Coin receipt-sum consistency.
- [x] Map query/type/mismatch failure typed và sanitize detail.
- [x] Prove zero write/history/seed/delete/reset calls.
- [x] Add exact before/after fingerprint for every injected mismatch.

**Blocks:** `T04`, `T05`, `T06`, `T08`.

### T03 — Implement bootstrap hydration adapter và readiness/reconciliation seams

**Outcome:** Minimal durable projection và explicit barriers có independent contract evidence.

- [x] Implement bootstrap-specific read adapter/strict mapper.
- [x] Return exact approved snapshot, deterministic catalog order và booleans/enums.
- [x] Add readiness gate with zero-work rejection proof.
- [x] Add startup reconciliation port + explicit Epic-2 no-op adapter/replacement note.
- [x] Add minimal real lifecycle adapter/one-subscription mapping if confirmation approved.
- [x] Keep full repositories/Zustand/Session behavior absent.

**Blocks:** `T04`, `T05`, `T06`, `T07`, `T08`.

### T04 — Refactor MobileBootstrap thành ordered durable pipeline

**Outcome:** `ready` chỉ xuất hiện sau exact sequence success.

- [x] Replace production FoundationSnapshot use bằng durable snapshot port.
- [x] Wire open → migrate → verify → hydrate → subscribe/reconcile → ready.
- [x] Keep gate closed through all phases; open only with ready publication.
- [x] Map every phase failure to recovery, stop later phases immediately.
- [x] Preserve connection according to approved recovery lifecycle.
- [x] Never invoke seed/repair/reset/provider side effect in failure path.

**Blocks:** `T05`, `T06`, `T07`, `T08`.

### T05 — Preserve single-flight, generation và dispose correctness

**Outcome:** Concurrency/cleanup không tạo duplicate phase hoặc late-ready.

- [x] Concurrent boot callers await exact same attempt.
- [x] Repeated boot at ready/recovery is deterministic no-op.
- [x] Dispose during opening/migration/verification/hydration/reconciliation blocks late-ready.
- [x] Subscription registered/unregistered at most once.
- [x] Close called once per graph and waits active leases.
- [x] Repeated dispose coalesces/idempotent and leaves disposed/gate closed.

**Blocks:** `T06`, `T07`, `T08`.

### T06 — Complete deterministic host bootstrap matrix

**Outcome:** Every acceptance/failure branch has independent evidence.

- [x] Exact ordered call trace và listener projection trace.
- [x] Empty DB migration → verification → exact hydrated seed → ready.
- [x] Latest DB repeated boot no migration/seed/read duplication.
- [x] Failure at open/migrate/verify/hydrate/reconcile stops suffix and never opens gate.
- [x] Physical schema/catalog/singleton/economy mismatch giữ full fingerprint.
- [x] Fake future command rejects idle/booting/every phase/recovery/disposed; runs once at ready.
- [x] Startup reconciliation fake called once after hydration and before ready.
- [x] Lifecycle event during boot cannot open gate hoặc mutate Session.
- [x] Single-flight/dispose deferred-phase matrix pass.
- [x] No provider availability dependency, raw error/row leak hoặc Product behavior.

**Blocks:** `T07`, `T08`, `T10`.

### T07 — Presentation/composition integration

**Outcome:** Exact production graph uses barriers nhưng UI scope vẫn foundation-only.

- [x] Composition constructs one owner/transaction/migration/verifier/data/reconciliation graph.
- [x] Remove in-memory FoundationSnapshot from production ready path.
- [x] `BootstrapBoundary` renders children only at ready; generic loading/recovery otherwise.
- [x] No Retry/reset button, Product navigation/onboarding/session behavior.
- [x] Facade/Provider expose only application-owned bootstrap/readiness capability.
- [x] Boundary tests prove no SQL/SQLite/React/provider type in Application projection.

**Blocks:** `T08`, `T10`.

### T08 — Implement exact Expo SQLite safe-bootstrap probe

**Outcome:** Packaged SQLite chứng minh production pipeline/readiness/failure preservation.

- [x] Dev-only explicit flag và lazy diagnostic import.
- [x] Use exact production migration/verifier/hydration/bootstrap graph.
- [x] Use isolated DB names; never open/delete `pixeldoro.db`.
- [x] Empty → ready with exact migration version/singletons/settings/profile/catalog.
- [x] Close/reopen latest → same durable projection, no duplicate history/seed.
- [x] Inject a verifier-detectable economy/catalog mismatch on isolated DB.
- [x] Assert recovery phase/code, gate closed, no reconciliation/children-ready publication.
- [x] Assert full before/after DB fingerprint unchanged by failed bootstrap.
- [x] Structured platform/OS/app/applicationId/commit SHA + named assertions.
- [x] Pass only after all connections close and exact probe DB cleanup.
- [x] Add owner runbook; one native target for Story, both platforms at `US-02-09`.

Agent không chạy native/EAS build.

**Blocks:** `T09`, `T10`.

### T09 — Owner native runtime evidence

**Outcome:** One exact native report trace được về final implementation commit.

- [x] Owner commit implementation và truyền exact SHA vào probe flag.
- [x] Owner chạy existing development build trên iOS.
- [x] Capture complete report; device model không được cung cấp và không block behavior evidence.
- [x] Verify `passed: true`, `9/9` assertions, application ID và SHA.
- [x] Confirm exact probe cleanup qua named assertion; unset flag/stop Metro là local hygiene.

**Blocks:** `T10` Story closeout.

### T10 — Quality, evidence và handoff closeout

**Outcome:** `US-02-04 DONE`; `US-02-05/07` nhận stable barrier contracts.

- [x] Run pinned typecheck/lint/test/boundary/repository checksum quality.
- [x] Run Expo public config check không tạo native artifact.
- [x] Review diff/no-scope-creep/no-second-truth/no-destructive-recovery.
- [x] Record host/failure evidence.
- [x] Record native evidence và final implementation SHA.
- [x] Mark Story acceptance only after exact evidence review.
- [x] Confirm no DB/native/secret/machine-local artifact trong implementation set.
- [x] Mark `US-02-04 DONE`; mở dependency gates, không active Story tiếp theo tự động.

## 6. Planned file impact

Exact filenames có thể refine khi implement nếu vẫn giữ ownership và được review.

### 6.1. Files dự kiến tạo

| File/khu vực | Mục đích |
|---|---|
| `apps/mobile/src/application/ports/bootstrap-data.port.ts` | Durable snapshot/read contract, no raw row. |
| `apps/mobile/src/application/ports/bootstrap-verifier.port.ts` | Read-only verification result/error contract. |
| `apps/mobile/src/application/ports/startup-reconciliation.port.ts` | Replaceable startup barrier for Epic 3. |
| `apps/mobile/src/application/readiness/readiness-gate.ts` | Application-owned command readiness capability. |
| `apps/mobile/src/infrastructure/database/bootstrap/sqlite-bootstrap-verifier.ts` | Physical schema/seed/economy read-only verifier. |
| `apps/mobile/src/infrastructure/database/bootstrap/sqlite-bootstrap-data.adapter.ts` | Strict minimal hydration adapter. |
| `apps/mobile/src/infrastructure/platform/app-lifecycle/react-native-app-lifecycle.adapter.ts` | Minimal real lifecycle mapping/subscription. |
| `apps/mobile/src/composition/startup/noop-startup-reconciliation.adapter.ts` hoặc equivalent composition-local adapter | Explicit temporary Epic-2 boundary implementing Application port. |
| Host verifier/bootstrap/readiness tests | Ordered/fault/fingerprint/concurrency matrix. |
| `apps/mobile/src/composition/diagnostics/run-safe-bootstrap-probe.ts` | Dev-only exact native bootstrap probe. |
| `apps/mobile/test/device/safe-bootstrap-smoke.md` | Owner manual runbook/report contract. |

### 6.2. Files dự kiến cập nhật

| File/khu vực | Mục đích |
|---|---|
| `mobile-bootstrap.ts` | Replace placeholder with durable phase pipeline. |
| Mobile Application exports/facade | Export stable projection/readiness only. |
| `create-mobile-application.ts` | Wire exact production graph + diagnostic flag. |
| `mobile-application-root.tsx` / provider | Preserve one graph and lifecycle cleanup. |
| `bootstrap-boundary.tsx` | Minimal phase-safe loading/recovery rendering; no Retry. |
| Device harness validator | Validate runbook/probe presence. |
| `EPIC-02_IMPLEMENTATION_EVIDENCE.md` | Host/native evidence and SHA trace. |
| `EPIC-02_USER_STORIES.md` | Status/checklist only after evidence. |

### 6.3. Forbidden impact

- Production Session mutation/reconciliation, reward, notification or analytics behavior.
- Full repository/mapper suite, generic CRUD or derived query implementation.
- Retry/reset/repair/reseed/upsert path outside approved migration.
- Product route/navigation/onboarding/Pet/Timer UI or persistent Zustand truth.
- Production migration `002`, new durable table/field/index/trigger.
- `deleteDatabase` outside exact dev-only probe cleanup.
- `ios/`, `android/`, DB, APK/AAB/IPA hoặc EAS/native output.

## 7. Acceptance-to-evidence trace

| Story acceptance | Primary Tasks | Required evidence |
|---|---|---|
| No ready before full barrier | `T01`, `T04`, `T06`, `T08` | Ordered phase/projection trace + native report. |
| Durable snapshot, no hard-coded defaults | `T01`, `T03`, `T06`, `T08` | Exact row-to-snapshot compare after reopen. |
| Drift/invariant fail closed | `T02`, `T04`, `T06`, `T08` | Typed phase failure + unchanged fingerprint. |
| Reconciliation after hydrate/before ready | `T03`, `T04`, `T06` | Fake call trace and no-suffix-on-failure test. |
| No Session behavior | `T03`, `T06`, `T07`, `T10` | Source/import/call audit; no Session write. |
| Presentation/gate block before ready | `T01`, `T04`, `T06`, `T07` | Children/fake-command rejection evidence. |
| Boot single-flight/idempotent | `T04–T06`, `T08` | Concurrent promise/call count + latest reopen output. |
| Dispose safe at every phase | `T05`, `T06` | Deferred-phase generation/subscription/close matrix. |
| Providers not prerequisites | `T06`, `T07`, `T10` | Production graph/source audit. |
| No raw row/provider error | `T01–T07`, `T10` | Type/boundary/error-shape tests. |

## 8. Deterministic test matrix

### 8.1. Ordered success cases

| Case | Expected |
|---|---|
| Empty database | Open/FK → apply `001` → verify → exact hydrate → reconcile fake → ready. |
| Latest database | Migration no-op; same snapshot; no duplicate seed/history. |
| Two concurrent boot calls | One pipeline, one subscription, both await completion. |
| Repeated boot after ready | No phase rerun; same immutable snapshot. |
| Lifecycle event before ready | May update buffered state only; no ready/command/Session mutation. |

### 8.2. Phase failure cases

| Injected failure | Expected public state | Forbidden suffix/action |
|---|---|---|
| Open/FK | recovery/opening | No migration/verifier/hydrate/reconcile; gate closed. |
| Migration history/apply | recovery/migrating | No verify/read/reconcile; DB preserved. |
| Integrity/schema/seed/economy verify | recovery/verifying | No hydrate/reconcile/ready; no repair. |
| Missing/invalid hydration row | recovery/hydrating | No reconcile/ready/default fill. |
| Reconciliation fake failure | recovery/reconciling | No ready/gate open; no Session mutation. |
| Provider exception at any phase | Stable sanitized code | No raw detail; later phase not called. |

### 8.3. Verification/hydration mismatch cases

| State | Expected |
|---|---|
| History exact, physical object/CHECK/index/trigger DDL missing hoặc drifted | Verification failure, unchanged. |
| FK/integrity violation | Verification failure, unchanged. |
| Missing/duplicate singleton | Verification/hydration failure, no reseed. |
| Catalog missing/extra/changed field | Verification failure, no upsert. |
| Profile XP differs receipt sum | Verification failure, no recompute/write-back. |
| Coin differs reward+purchase sums | Verification failure, no repair/delete receipt. |
| Valid `0` receipt empty sums | Pass with profile `0/0`. |
| SQLite boolean/enum unexpected | Typed hydration failure, no coercion. |

### 8.4. Concurrency/dispose cases

| Case | Expected |
|---|---|
| Dispose during each deferred phase | Attempt cannot publish ready; gate closes; owner closes once. |
| Dispose repeated/concurrent | Coalesced/idempotent; one unsubscribe/close. |
| Phase resolves after generation invalidated | Result ignored; no listener/subscription leak. |
| Boot while recovery | No-op until future explicit Retry capability. |
| Guarded command in non-ready state | `CORE_COMMANDS_NOT_READY`; callback count `0`. |

## 9. Verification commands và native boundary

Automated closeout dùng pinned toolchain:

```sh
pnpm --filter @pixeldoro/mobile typecheck
pnpm --filter @pixeldoro/mobile lint
pnpm test
pnpm test:boundaries
pnpm check:repository
pnpm quality
```

Expo public config/dependency check chỉ chạy nếu không tạo native artifact. Không chạy
`expo run:*`, prebuild, local EAS build hoặc native compilation trong agent turn.

Native probe sau implementation phải report tối thiểu:

```text
probe = US-02-04_SAFE_BOOTSTRAP
passed = true
platform / osVersion / appVersion / applicationId / commitSha
assertions:
  empty_database_reached_ready_after_ordered_barrier
  exact_durable_snapshot_hydrated
  readiness_gate_opened_only_after_reconciliation
  latest_reopen_preserved_snapshot_without_duplicate_seed
  injected_invariant_mismatch_entered_typed_recovery
  failed_bootstrap_kept_gate_closed_and_skipped_reconciliation
  failed_bootstrap_preserved_database_fingerprint
  repeated_boot_and_dispose_were_idempotent
  probe_connections_closed_and_databases_cleaned
```

## 10. Risk register

| Risk | Mitigation | Stop condition |
|---|---|---|
| Bootstrap-specific adapter thành full repository | Freeze four-slice read DTO; no write/capability CRUD. | Session/receipt/inventory command API xuất hiện. |
| History exact nhưng physical DB drift | Independent runtime verifier after migration. | Ready trước physical verification. |
| Verifier tự repair | Read-only executor/call audit + fingerprint tests. | Any insert/update/delete/reseed/reset call. |
| Economy verifier overflow/coercion | Safe-integer/null-safe mapping and typed failure. | Clamp/float/truthy coercion. |
| No-op reconciliation bị hiểu là Session-safe | Explicit name/replacement note; no Session read/write. | Adapter claims/returns terminal Session truth. |
| Lifecycle event opens gate | Gate only pipeline completion can open. | Callback changes readiness or mutates Session. |
| Dispose race publishes late-ready | Generation invalidation at every await boundary. | Listener observes ready after dispose. |
| Retry scope creep | No public retry in Story; reusable internal attempt only. | Retry button/API/reset appears. |
| Provider availability blocks ready | Exclude provider graph from prerequisites. | Analytics/notification/network failure enters DB recovery. |
| Snapshot becomes second durable truth | Immutable rebuildable projection; no persist ready/phase. | Zustand/settings used as bootstrap authority. |

## 11. Rollback và recovery của implementation change

- Nếu host/native evidence fail, giữ Story `IN_PROGRESS`, sửa exact phase contract/code và rerun;
  không bỏ verifier/gate hoặc auto-repair để đạt pass.
- Revert US-02-04 code không được sửa/xóa user database; migration `001` và history đã release
  giữ immutable.
- Post-open failure giữ DB intact; dispose đóng owner. User Retry/reset policy vẫn chờ Story có
  authority.
- Không down migration, delete database hoặc rewrite checksum/history khi bootstrap fail.

## 12. Definition of Done cho `US-02-04`

- [x] `T00 → T10` hoàn tất theo order.
- [x] Bốn owner confirmations được resolve và sync vào Story baseline.
- [x] Production exact order open → migrate → verify → hydrate → reconcile → ready.
- [x] Ready snapshot đọc committed SQLite, không Clock/ID-generated hoặc hard-coded defaults.
- [x] Physical/schema/catalog/singleton/economy verifier fail read-only và typed.
- [x] Every phase failure stops suffix, keeps gate closed and preserves durable fingerprint.
- [x] Reconciliation seam called after hydration/before ready; no production Session behavior.
- [x] Future command guard rejects every non-ready state with zero work.
- [x] Concurrent/repeated boot and phase-by-phase dispose matrix pass.
- [x] Loading/recovery boundary never renders core children before ready.
- [x] No Retry/reset/repair/full repository/Product behavior scope creep.
- [x] Application/Presentation receives no SQL/SQLite/raw row/provider type/message.
- [x] Native exact Expo bootstrap probe pass trên iOS/final implementation SHA.
- [x] No DB/native/secret/machine-local artifact committed.
- [x] Evidence accepted; `US-02-04 DONE` before active `US-02-05/07`.

## 13. Owner confirmations cần chốt

| ID | Proposal | Status | Blocks |
|---|---|---|---|
| `US0204-CONFIRM-01` | Ready snapshot chỉ gồm migration version + installation timestamps/onboarding state + full settings + XP/Coin profile + exact catalog; loại analytics ID, Session/receipts/inventory/Pet identity/audit timestamps. | `APPROVED 2026-08-28` | Đã mở `T01`, `T03` và hydration acceptance. |
| `US0204-CONFIRM-02` | Read-only verifier cover integrity/FK, exact physical schema surface, singleton/catalog và XP/Coin receipt sums; không repair; per-row repositories/derived queries chờ `US-02-05/06`. | `APPROVED 2026-08-28` | Đã mở `T02` và verification acceptance. |
| `US0204-CONFIRM-03` | Post-open failure giữ application-scoped connection tới dispose; gate đóng; repeated boot ở recovery no-op. Retry API/UI thuộc `US-02-07`, chỉ chuẩn bị internal attempt seam. | `APPROVED 2026-08-28` | Đã mở `T04–T06` và recovery lifecycle. |
| `US0204-CONFIRM-04` | Explicit no-op startup reconciliation adapter tới Epic 3 + `AppLifecyclePort` current-state read/minimal real AppState subscription; readiness guard chỉ open sau boundary success, lifecycle callback không mutate Session. | `APPROVED 2026-08-28` | Đã mở `T03–T08` và readiness/reconciliation acceptance. |

Các confirmation là technical bootstrap policy, không quyết định Product `OPEN-001`,
`OPEN-006`, `OPEN-009` và không cho phép thêm Product behavior/schema.

## 14. Handoff sang Story sau

Khi `US-02-04 DONE`, handoff gồm:

- Stable bootstrap phase/result/error/readiness contract.
- Bootstrap durable snapshot và strict read-only adapter/verifier.
- Production graph gọi exact migration runner trước verifier/hydration.
- Explicit temporary reconciliation seam + lifecycle ownership/replacement note.
- Host/native failure/readiness/dispose evidence và final SHA.
- `US-02-05` mới mở rộng typed repositories/mappers.
- `US-02-07` mới thêm user Retry/recovery matrix trên same bootstrap attempt seam.
- `EPIC-03` mới thay no-op reconciliation bằng Session command coordinator thực.

## 15. References

- [EPIC-02 User Stories](./EPIC-02_USER_STORIES.md)
- [US-02-03 Implementation Plan](./US-02-03_IMPLEMENTATION_PLAN.md)
- [EPIC-02 Implementation Evidence](./EPIC-02_IMPLEMENTATION_EVIDENCE.md)
- [MVP Epic Plan](./MVP_EPICS.md)
- [Product Core Truth](../PIXELDORO_CORE_TRUTH.md)
- [Data Model](../architecture/data-model.md)
- [System Architecture](../architecture/system-architecture.md)
- [Project Structure](../architecture/project-structure.md)
- [Technical Overview](../architecture/technical-overview.md)
- [Timer Engine](../specifications/timer-engine.md)
- [ADR-003 — State and Persistence](../architecture/decisions/ADR-003-state-and-persistence.md)
- [ADR-004 — Domain and Platform Boundaries](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md)

## 16. Change log

### 0.5.0 — 2026-08-28

- Tiếp nhận iOS report `US-02-04_SAFE_BOOTSTRAP` `passed: true`, đủ `9/9` assertions trên
  SHA `b36bc45190129da07e42d046f2badf6fddcd99e4`, khớp repository `HEAD`.
- Re-run `pnpm quality`: `13` files / `75` tests cùng device/boundary/checksum gates pass.
- Chuyển `US-02-04` sang `DONE`, mở dependency phía Story này cho `US-02-05/07`; `US-02-07`
  vẫn chờ `US-02-06`, không tự active hoặc implement Story tiếp theo.

### 0.4.0 — 2026-08-28

- Implement production order open → migrate → verify → hydrate → reconcile → ready cùng
  application-owned readiness gate và real AppState ownership.
- Thêm strict read-only SQLite verifier/hydration, host fault/concurrency/dispose matrix và
  dev-only exact native probe/runbook.
- `pnpm quality` pass `13` files / `75` tests; Expo public config pass, không chạy native/EAS.
- Chuyển implementation sang `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`; `T09` và final
  closeout/DONE vẫn chờ exact owner report trên final implementation SHA.

### 0.3.0 — 2026-08-28

- Owner yêu cầu bắt đầu implementation `US-02-04`; Story chuyển `IN_PROGRESS`.
- Giữ authoritative execution `T01 → T10`, native/EAS execution thuộc owner-run evidence.
- Chưa đánh dấu acceptance/DONE trước host quality và exact native report.

### 0.2.0 — 2026-08-28

- Ghi nhận Dũng Lư duyệt `US0204-CONFIRM-01` đến `04` theo toàn bộ proposal trong plan.
- Khóa durable snapshot, read-only verifier, recovery connection lifecycle và
  reconciliation/lifecycle/readiness boundary.
- Chuyển planning status sang `READY_FOR_IMPLEMENTATION`; implementation vẫn `NOT_STARTED`
  và bắt đầu từ `T01`, không tự active Story sau.

### 0.1.0 — 2026-08-28

- Tạo implementation plan đầu tiên sau `US-02-03 DONE`.
- Review exact current bootstrap scaffold và đề xuất durable snapshot, runtime verifier,
  recovery connection policy, reconciliation/lifecycle/readiness seams.
- Chia authoritative execution `T00 → T10`, host/native evidence và no-scope-creep boundary.
- Giữ bốn technical confirmations `PENDING_OWNER`; không implement production code/native build.
