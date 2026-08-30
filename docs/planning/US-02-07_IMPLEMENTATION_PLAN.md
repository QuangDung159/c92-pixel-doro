---
document_id: PIXELDORO_US_02_07_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-02-07 Implementation Plan
version: 0.4.0
status: DONE
implementation_status: DONE
last_updated: 2026-08-29
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
language: vi
scope:
  - mobile_mvp
  - epic_02
  - us_02_07
  - typed_recovery
  - safe_retry
  - readiness_and_failure_evidence
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

# US-02-07 — Failure Recovery và Retry

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan authoritative dự kiến cho `US-02-07` thuộc
`EPIC-02 — Durable Local Data, Migration và Safe Bootstrap`.

**Story outcome:** Database/migration/core-invariant failure được chiếu thành recovery state có
kiểu ổn định và action Retry; readiness tiếp tục đóng, dữ liệu durable giữ nguyên, Retry dùng lại
cùng database và chỉ mở core flow sau khi toàn bộ bootstrap barrier pass lại.

**Dependency:** `US-02-04 DONE` và `US-02-06 DONE`. Exact iOS
`US-02-06_DERIVED_QUERIES` probe pass `11/11` assertions với SQLite `3.50.3` trên SHA
`e1cd3a54b1a58e84a68518a6ac87ad751f422992`; host quality pass `17` files / `95` tests.

**Priority:** `MUST` / `P2_RECOVERY` / execution order `07` trong EPIC-02.

**Blocks:** `US-02-08`. Confirmed full reset chỉ được xây trên một recovery boundary đã chứng minh
không tự gọi reset, không repair và không để Retry chạy đồng thời.

**Planning status:** `DONE`.
**Implementation status:** `DONE`.

Năm technical direction `US0207-CONFIRM-01`–`05` đã được owner duyệt ngày 2026-08-29.
Production recovery contracts, full-barrier Retry, critical ingress, friendly UI, sanitized
diagnostics, host fault/fingerprint matrix và dev-only native probe/runbook đã hoàn tất. Full
`pnpm quality` pass `21` files / `126` tests. Exact owner iOS report pass `11/11` assertions với
SQLite `3.50.3` trên implementation SHA
`b3c8421ef3a20934005711a571655265cf736091`; Story đã closeout `DONE`.

### 0.1. Start gate

- [x] `US-02-04 DONE`: ordered bootstrap/readiness barrier đã có host + exact native evidence.
- [x] `US-02-06 DONE`: economy consistency result, retention boundary và exact native evidence đã có.
- [x] Data Model `1.0.0 APPROVED`; `DM-OPEN-001`–`007` đều `RESOLVED`.
- [x] Product Core §7.7 và Timer Engine §10.2 đã khóa no-delete/no-repair/Retry behavior.
- [x] Không cần Product decision `OPEN` nào để lập plan.
- [x] Owner duyệt `US0207-CONFIRM-01`–`05` ngày 2026-08-29.
- [x] Chỉ `US-02-07` active khi implementation bắt đầu; `US-02-08` chưa được implement song song.

## 1. Baseline và current-state review

### 1.1. Authority contract

| Authority | Contract áp dụng cho `US-02-07` |
|---|---|
| `EPIC-02_USER_STORIES.md` | Typed database/migration/invariant recovery, actionable Retry, closed readiness, no destructive side effect. |
| Product Core §7.7 | Giữ durable data; recovery là Application projection; retry; không tự terminal/reward/reset/repair. |
| Timer Engine §10.2 | Invalid active-session/database failure trả typed recovery; không render uncommitted result; log sanitize. |
| Data Model §1, §6.1, §8.1, §11, §14.6 | Economy mismatch/migration failure fail closed; same data retained; no auto-delete/downgrade/repair. |
| System Architecture §5.2, §7 | Startup barrier, Application-owned result/error, friendly Presentation mapping, provider exception không rò. |
| Technical Overview §10.1 | Migration/asset failure không xóa data; app fail safely và có recovery path. |
| ADR-003/004 | SQLite là durable truth; Application sở hữu orchestration/ports; Infrastructure map provider failure. |

### 1.2. Current implementation đã có

- `MobileBootstrap` chạy ordered `opening → migrating → verifying → hydrating → reconciling`,
  đóng readiness và vào `recovery` khi một phase fail.
- `ReadinessGate` đã reject core command khi chưa `ready` hoặc đang recovery.
- `SQLiteDatabaseOwner`, `SQLiteTransaction`, `MigrationRunner`, bootstrap verifier/data adapter và
  typed repositories đã map provider exception ra khỏi Presentation.
- Migration error set đã phân biệt registry/history/gap/checksum/newer/apply/history-write.
- Bootstrap verifier đã kiểm tra schema/seed/economy nhưng đang trả một generic
  `BOOTSTRAP_INVARIANT_FAILED`.
- `PersistenceError` đã có unavailable/query/write/corrupt/invariant mismatch categories.
- `BootstrapBoundary` đã chặn core children trong recovery nhưng chỉ hiển thị error code; chưa có
  Retry action.
- Existing US-02-01–06 probes đã chứng minh transaction rollback, migration retry, bootstrap
  fingerprint preservation, mapper failure và economy no-repair ở từng slice.

### 1.3. Gap phải đóng trong Story này

| ID | Gap hiện tại | Hướng xử lý trong plan |
|---|---|---|
| `US0207-GAP-01` | `MobileBootstrap.boot()` chỉ chạy từ `idle`; gọi lại trong recovery là no-op. | Thêm explicit `retry()` single-flight; không dùng repeated `boot()` như hidden retry. |
| `US0207-GAP-02` | Migration lỗi chi tiết bị collapse thành `BOOTSTRAP_MIGRATION_FAILED`. | Preserve/map stable Application recovery reason, không mất checksum/gap/newer-schema identity. |
| `US0207-GAP-03` | Verify/hydrate đang collapse query failure, corrupt seed/schema/economy mismatch. | Tách source error đủ acceptance nhưng không rò raw SQL/row/provider exception. |
| `US0207-GAP-04` | Chưa có ingress để future core command đưa app vào global recovery. | Add Application-owned critical-failure escalation port; repository vẫn side-effect-free. |
| `US0207-GAP-05` | Không phân biệt core-critical write/read failure với analytics/provider failure. | Chỉ bootstrap hoặc Application core coordinator mới escalate; side-effect failure không đóng core flow. |
| `US0207-GAP-06` | Recovery UI là dead-end và render technical code. | Minimal friendly recovery surface có accessible Retry; technical code chỉ vào sanitized diagnostics. |
| `US0207-GAP-07` | Chưa có retry connection lifecycle/fault concurrency evidence. | Full barrier retry trên same DB identity, one in-flight attempt, exact close/reopen/lease assertions. |
| `US0207-GAP-08` | No-reset/no-repair evidence đang phân tán ở Story trước. | Gom fault matrix + durable fingerprint/statement audit thành Story-level evidence. |

### 1.4. Mâu thuẫn/scope traps đã xử lý

1. Timer Engine cho phép explicit cancel một corrupt active session nếu DB usable, nhưng Story
   baseline loại Product-specific corrupt-session cancel. `US-02-07` chỉ surface typed fact/port;
   command/session transition thuộc `EPIC-03`.
2. `US-02-08` sở hữu confirmed reset executor; recovery của Story này không import, compose hoặc
   gọi reset dưới mọi error category.
3. Lỗi analytics/feedback/notification là side-effect issue, không phải global database recovery;
   không biến queue/provider failure thành core lockout.
4. Retry là reinspection/rebootstrap, không phải migration repair, downgrade, reseed, balance fix,
   catalog upsert hoặc session normalization.
5. UI recovery tối thiểu thuộc foundation boundary; không tạo Settings flow, reset confirmation,
   Home/Timer/Result behavior hoặc feature navigation mới.

## 2. Proposed technical directions cần owner xác nhận

### TD-02-07-A — Stable recovery reason và mapping ownership

Application mobile sở hữu `RecoveryReason`/`RecoveryProjection`; Infrastructure tiếp tục trả
typed source error. Bootstrap/recovery coordinator map source error sang stable reason mà không
collapse migration identity.

Proposed stable reason groups:

- Database lifecycle/core access: `DATABASE_OPEN_FAILED`, `DATABASE_UNAVAILABLE`,
  `DATABASE_READ_FAILED`, `DATABASE_WRITE_FAILED`, `DURABLE_DATA_CORRUPT`.
- Migration: preserve exact existing registry/history-missing/history-invalid/version-gap/
  unknown-applied/checksum-mismatch/newer-schema/apply/history-write codes; transaction technical
  failure trong migration phase map thành `MIGRATION_EXECUTION_FAILED`.
- Verification/hydration: `BOOTSTRAP_SCHEMA_INVARIANT_FAILED`, `BOOTSTRAP_SEED_INVALID`,
  `BOOTSTRAP_DATA_INVALID`, `BOOTSTRAP_ECONOMY_INVARIANT_FAILED`.
- Startup boundary: `STARTUP_RECONCILIATION_FAILED`.

Transaction technical errors map deterministically: database-not-open → unavailable; begin/work/
commit/rollback failure của core transaction → write failed. Mapper/query errors map read/corrupt
theo source; economy mismatch giữ reason riêng. Không lưu recovery reason vào SQLite.

### TD-02-07-B — Critical-failure ingress và unavailable projection

- `MobileBootstrap`/Application recovery coordinator là owner duy nhất của global recovery +
  readiness transition.
- Bootstrap failure tự enter recovery. Future core durable use case phải gọi explicit injected
  `CriticalRecoveryPort` sau typed critical read/write/invariant failure.
- Repository/SQLite adapter không tự mutate global state vì adapter không biết failure có thuộc
  core truth hay chỉ analytics/side effect.
- Analytics queue, notification, feedback, store-review provider và other best-effort failure
  không enter global recovery.
- Khi recovery, Presentation nhận explicit unavailable projection; không render core children hoặc
  expose stale snapshot như current truth. Snapshot chỉ được hydrate lại sau successful Retry.

### TD-02-07-C — Retry state machine và connection policy

- Add explicit `retry(): Promise<void>` trên bootstrap/facade; chỉ recovery UI gọi capability này.
- Concurrent Retry trả cùng in-flight promise; không mở nhiều connection/apply migration trùng.
- Retry giữ readiness đóng, recycle connection có kiểm soát, rồi chạy lại full ordered barrier từ
  `opening` trên **cùng database name/owner**, không delete/recreate file.
- `open`/migration vẫn idempotent; migration luôn re-inspect durable history và latest DB là no-op.
- Retry success thay snapshot bằng fresh hydration rồi mới mở gate. Retry failure trở lại recovery
  với reason mới/hiện tại và vẫn giữ data.
- Dispose thắng retry bằng generation guard; cleanup subscription/connection một lần. Retry sau
  disposed không resurrect graph.
- Mọi reason vẫn có Retry; deterministic mismatch/newer schema có thể fail lại an toàn nhưng không
  tạo hidden repair/reset path.

### TD-02-07-D — Minimal recovery UI và sanitized diagnostics

- `BootstrapBoundary` hiển thị copy thân thiện, không render raw exception, stack, SQL, row hoặc
  stable technical error code cho user.
- Add button `Thử lại` với accessibility role/label; khi retry chạy, projection trở về phase loading
  nên double tap bị coalesce và UI không báo ready sớm.
- Application-owned diagnostic envelope chỉ chứa fixed fields: event name, attempt number,
  bootstrap phase và stable reason code. Không nhận `Error`, message, stack, entity payload,
  database dump, feedback text hoặc future Pet/user free text.
- Default adapter chỉ emit fixed safe envelope; test recording fake chứng minh allowlist shape.
  Không thêm Sentry/PostHog/provider hoặc durable diagnostics table trong Story này.

### TD-02-07-E — Evidence split và native gate

- Host tests cover full deterministic matrix cho source-error mapping, phase/order, concurrent
  Retry, dispose race, critical-vs-side-effect escalation và before/after durable fingerprint.
- Real host SQLite tests cover failed core transaction rollback, migration reinspection và
  no-delete/no-repair/no-terminal statement/row audit.
- Dev-only Expo SQLite probe dùng isolated database, production recovery coordinator và minimal UI
  contract; inject representative failures rồi Retry trên same DB. Raw SQL chỉ seed/read evidence.
- Một owner-run native platform pass đủ close `US-02-07`; both-platform repeat và broader kill/
  disk-full matrix vẫn thuộc `US-02-09`.
- Không thêm migration `002`, reset executor, corrupt-session cancel, production Session/Reward
  command, provider integration hoặc native artifact.

## 3. Owner confirmations

| ID | Cần xác nhận | Đề xuất | Trạng thái |
|---|---|---|---|
| `US0207-CONFIRM-01` | Recovery taxonomy và exact source-error mapping | Duyệt TD-02-07-A | `APPROVED 2026-08-29` |
| `US0207-CONFIRM-02` | Critical-failure ingress và explicit unavailable projection | Duyệt TD-02-07-B | `APPROVED 2026-08-29` |
| `US0207-CONFIRM-03` | Full-barrier Retry, same DB, controlled connection recycle và single-flight | Duyệt TD-02-07-C | `APPROVED 2026-08-29` |
| `US0207-CONFIRM-04` | Friendly Retry UI và allowlisted sanitized diagnostic envelope | Duyệt TD-02-07-D | `APPROVED 2026-08-29` |
| `US0207-CONFIRM-05` | Host/native evidence split và exclusions/no-migration policy | Duyệt TD-02-07-E | `APPROVED 2026-08-29` |

Đây là technical implementation decisions. Nếu owner không duyệt một proposal, chỉ direction liên
quan được sửa; không tự mở rộng thành Product behavior mới.

## 4. In scope và out of scope khóa cho implementation

### 4.1. In scope

- Application-owned recovery reason/projection, source-error mapping và critical-failure ingress.
- Retry-capable bootstrap state machine, single-flight, generation/dispose safety và readiness gate.
- Controlled connection recycle/reopen trên exact same database identity.
- Phase-specific bootstrap verifier/data error mapping cho schema, seed, economy, query/corrupt data.
- Minimal recovery screen/action/accessibility contract.
- Sanitized diagnostic envelope/port/adapter/fake.
- Full host fault matrix, real SQLite durable fingerprint/rollback/retention audit.
- Isolated dev-only Expo SQLite recovery probe và owner manual runbook.
- Documentation/evidence/status closeout.

### 4.2. Out of scope

- Automatic/confirmed reset executor, deletion/reseed implementation hoặc Settings reset UX.
- Explicit corrupt-session cancel command, Start/Cancel/Reconcile/Complete/Reward use case.
- Timer/Result/Pet/History/Shop behavior hoặc Zustand feature projection.
- Migration repair/downgrade, schema `002`, catalog/economy normalization.
- Cloud backup/restore, file export, database salvage/copy or support tooling.
- PostHog/Sentry/remote log provider, durable diagnostics table hoặc raw database dump.
- Notification/analytics/feedback retry orchestration.
- Native/EAS/prebuild execution hoặc generated native artifact trong agent turn.

## 5. Authoritative execution order cho solo developer

| Order | Task | Gate/output | Blocks |
|---:|---|---|---|
| `T00` | Owner confirmation gate | `CONFIRM-01`–`05` approved | Tất cả implementation task |
| `T01` | Recovery contracts + mapping table | Stable reasons, projection, diagnostics schema compile | T02–T05 |
| `T02` | Bootstrap Retry vertical slice | Open/migrate/verify/hydrate failure → Retry → ready | T03, T06 |
| `T03` | Critical failure ingress + readiness | Core failure locks gate; side effect failure does not | T05–T06 |
| `T04` | Recovery UI + diagnostics vertical slice | Accessible Retry and sanitized envelope evidence | T06 |
| `T05` | Full host fault/transaction matrix | Exact category + fingerprint + rollback evidence | T06 |
| `T06` | Composition/regression/retention audit | One graph, no reset/repair/delete/feature leak | T07 |
| `T07` | Full host quality | Type/lint/test/boundary/hygiene pass | T08 |
| `T08` | Native diagnostic + runbook | Isolated Expo SQLite probe ready | T09 |
| `T09` | Owner native evidence | Exact report on final implementation SHA | T10 |
| `T10` | Closeout | Evidence/docs/status complete; open US-02-08 | Story DONE |

Chỉ một task/Story active tại một thời điểm. `MUST` là MVP requirement;
`P2_RECOVERY` là dependency/risk priority; bảng trên là implementation sequence thực tế.

### 5.1. Rationale cho order

1. Stable mapping đi trước state machine để UI/test không phụ thuộc provider exception spelling.
2. Retry bootstrap vertical slice đi trước runtime ingress vì nó tạo recovery owner và lifecycle
   semantics dùng chung.
3. Critical-vs-side-effect boundary phải khóa trước fault matrix để tránh vô tình làm analytics
   failure block core loop.
4. UI/diagnostics dùng cùng Application projection, không tạo store/error truth riêng.
5. Full matrix và retention audit chạy trước native để lỗi logic không bị đẩy sang owner.
6. `US-02-08` chỉ mở sau evidence rằng recovery không tự gọi destructive path.

## 6. Task checklist chi tiết

### US0207-T00 — Decision gate

- [x] Owner duyệt `US0207-CONFIRM-01`–`05` ngày 2026-08-29.
- [x] Update plan qua `READY_FOR_IMPLEMENTATION` trước implementation.
- [x] Snapshot worktree và giữ nguyên unrelated owner changes.

### US0207-T01 — Recovery contracts và mapping

- [x] Add stable `RecoveryReason`, phase, projection và retry capability tại mobile Application.
- [x] Preserve exact migration reasons; map database/persistence/transaction/bootstrap source errors.
- [x] Split verifier/data source errors đủ schema/seed/economy/read/corrupt acceptance.
- [x] Add pure exhaustive mapping tests; new source code phải gây compile/test failure nếu chưa map.
- [x] Chứng minh projection/DTO không chứa SQLite row, SQL, `Error`, message hoặc stack.

### US0207-T02 — Bootstrap Retry vertical slice

- [x] Add explicit `retry()`; repeated `boot()` không âm thầm retry recovery.
- [x] Coalesce concurrent Retry về exact same promise/attempt.
- [x] Keep gate closed, recycle owner connection safely và rerun full ordered barrier.
- [x] Re-inspect migration history; latest database no-op; same database filename/rows survive.
- [x] Retry success hydrate fresh snapshot trước ready; retry failure giữ recovery.
- [x] Handle close/open/retry/dispose race; no graph resurrection, duplicate subscription/connection.

### US0207-T03 — Critical failure ingress và command blocking

- [x] Add Application-owned critical recovery port/controller wired vào same bootstrap projection.
- [x] Map simulated core read/write/transaction/invariant failures sang recovery after rollback.
- [x] Close readiness before publishing recovery projection.
- [x] Keep repositories pure; no adapter global callback/service locator.
- [x] Test analytics/provider/best-effort failure does not enter recovery or close a ready gate.
- [x] Test future core command fake cannot execute while booting/retrying/recovery.

### US0207-T04 — Recovery UI và diagnostics

- [x] Replace dead-end recovery output bằng friendly message + accessible `Thử lại` action.
- [x] Không render technical code/raw message; booting/retrying state prevents duplicate UX action.
- [x] Add fixed allowlisted `RecoveryDiagnostic` DTO và injected port.
- [x] Add safe default adapter + recording fake; assert exact keys/value types.
- [x] Test forbidden message/stack/SQL/row/free-text không thể/không được emit.
- [x] Không thêm provider SDK, durable log table hoặc navigation/reset action.

### US0207-T05 — Host fault và durable safety matrix

- [x] Matrix open/unavailable/read/write + every migration source code.
- [x] Matrix schema/seed/data/economy/reconciliation failure.
- [x] For each phase: reason, projection, readiness, phase order, Retry result.
- [x] Real SQLite failed transaction proves rollback/no half-state.
- [x] Fingerprint product/schema rows before/after failure/Retry.
- [x] Test checksum/gap/newer/mismatch mapping/retry remains non-destructive and deterministic.
- [x] Test retry after transient failure reaches ready on same durable rows.

### US0207-T06 — Composition, retention và scope audit

- [x] Wire one application-scoped recovery coordinator/diagnostic adapter in composition root.
- [x] Verify connection/subscription lifecycle exactly once across recovery/retry/dispose.
- [x] Audit production delete/update paths: no reset, repair, terminal/reward or catalog overwrite.
- [x] Audit no `US-02-08` reset import/capability reachable from recovery UI/facade.
- [x] Run US-02-01–06 regression suites and boundary checks.
- [x] Confirm no migration/schema `002` and no Product feature code.

### US0207-T07 — Full host quality

- [x] Run targeted recovery/UI/fault tests với pinned Node/pnpm.
- [x] Run root `pnpm quality`: `21` files / `126` tests pass ngày 2026-08-29.
- [x] Run `git diff --check`, repository hygiene, boundary and immutable migration checks.
- [x] Record exact file/test counts và owner native runtime gate còn lại.

### US0207-T08 — Native diagnostic và manual runbook

- [x] Add dev-only `US-02-07_FAILURE_RECOVERY` probe via existing diagnostics seam.
- [x] Use isolated database and production recovery coordinator/Retry path.
- [x] Inject representative failure after real Expo SQLite open/migrate, fingerprint rows, Retry.
- [x] Assert gate/UI contract/same DB/single-flight/no reset/no repair/cleanup.
- [x] Report platform/OS/app/application ID/commit SHA/SQLite version/stable assertion IDs.
- [x] Close connection idempotently; delete only isolated probe database.
- [x] Write owner manual guide; agent không chạy native/EAS build.

### US0207-T09 — Owner native evidence

- [x] Owner chạy manual probe trên iOS `26.5` ngày 2026-08-29.
- [x] Report `passed: true`, đủ `11/11` assertions, SQLite `3.50.3` trên exact SHA
  `b3c8421ef3a20934005711a571655265cf736091`.
- [x] Agent review SHA/assertion completeness; documentation-only closeout không làm stale
  behavioral evidence.

### US0207-T10 — Closeout

- [x] Map all Story acceptance criteria tới host/native evidence.
- [x] Update plan, Epic Story và consolidated implementation evidence.
- [x] Chỉ chuyển `DONE` sau host quality + exact native report pass.
- [x] Mở planning gate `US-02-08`; không tự implement reset trong closeout.

## 7. Planned file impact

| Khu vực | Planned impact |
|---|---|
| `apps/mobile/src/application/bootstrap/` | Recovery reason/projection, retry state machine, critical ingress orchestration. |
| `apps/mobile/src/application/ports/` | Critical recovery và sanitized diagnostic contracts. |
| `apps/mobile/src/application/readiness/` | Reuse/extend readiness controller only where required; no feature command. |
| `apps/mobile/src/application/mobile-application.facade.ts` | Intentional Retry capability for Presentation. |
| `apps/mobile/src/infrastructure/database/bootstrap/` | Phase-specific source errors; no repair/write. |
| `apps/mobile/src/infrastructure/platform/diagnostics/` | Safe fixed-field diagnostic adapter if needed. |
| `apps/mobile/src/composition/` | One application-scoped recovery graph and dev-only probe wiring. |
| `apps/mobile/src/presentation/components/bootstrap-boundary.tsx` | Minimal friendly recovery + accessible Retry action. |
| `apps/mobile/test/integration/` | Real SQLite fault/retry/fingerprint matrix. |
| `apps/mobile/test/device/` | Owner native recovery runbook and harness validation. |
| `docs/planning/` | Plan, Story status and evidence closeout. |

Tên file có thể đổi nhỏ khi implement nhưng ownership/dependency direction không đổi.

**Không planned:** migration `002`, reset executor, Settings/reset route, session cancel/reconcile/
reward command, Product screen behavior, provider SDK hoặc native generated artifact.

## 8. Acceptance và evidence matrix

| Story acceptance | Host evidence | Native evidence |
|---|---|---|
| Stable open/read/write/migration/seed/invariant/economy mapping | Exhaustive source→reason table test | Representative reason report trên Expo SQLite path |
| Recovery is transient Application/UI state | Type/boundary test; no schema/migration diff | Recovery→Retry→ready projection trace |
| Accessible actionable Retry | React component interaction/accessibility test | Owner observes Retry action and successful recovery |
| Readiness/core command blocked | Boot/recovery/retry fake-command matrix | Gate remains closed until barrier passes |
| No delete/reset/repair/terminal/reward | SQL audit + full product fingerprint | Isolated durable fingerprint before/after injected failure |
| Same DB full-barrier retry | Exact phase/history/connection call trace | Same database rows survive real close/reopen/retry |
| Concurrent Retry single-flight | Same promise, one connection/migration/reconcile call | Double invocation produces one native attempt |
| Failed core transaction rollback | Real SQLite injected work/commit failure matrix | Representative failure has no half-state |
| Sanitized diagnostics | Exact allowlist/forbidden-value tests | Structured report contains only fixed metadata/assertions |
| Recovery cannot call reset | Import/capability/statement audit | Probe has no destructive recovery action |

### 8.1. Proposed native report contract

```json
{
  "probe": "US-02-07_FAILURE_RECOVERY",
  "passed": true,
  "platform": "ios-or-android",
  "osVersion": "owner-runtime",
  "appVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "40-character-final-implementation-sha",
  "sqliteVersion": "runtime-value",
  "assertions": [
    "recovery_probe_database_opened_and_migrated",
    "typed_failure_reason_was_sanitized",
    "failure_closed_readiness_and_hid_core_projection",
    "durable_rows_survived_injected_failure",
    "concurrent_retry_coalesced_to_one_attempt",
    "retry_reused_same_database_and_reran_ordered_barrier",
    "successful_retry_hydrated_fresh_snapshot_before_ready",
    "side_effect_failure_did_not_enter_core_recovery",
    "no_reset_repair_terminal_or_reward_path_was_invoked",
    "repeated_retry_and_dispose_were_safe",
    "probe_connections_closed_and_database_cleaned"
  ]
}
```

Assertion IDs chỉ freeze khi `T08` implement. Host full matrix không được thay bằng một native
happy-path report; native report không cần tái tạo mọi synthetic migration category đã cover host.

## 9. Failure, rollback và retry policy

- Recovery entry đóng readiness trước khi publish state; không có window core command chạy trong
  recovery transition.
- Source exception chỉ dùng để map tại boundary rồi bị discard; không giữ trong projection/store.
- Retry không mutate product data ngoài migration logic đã approved; latest migration là no-op.
- Failed core transaction phải rollback trước recovery escalation; rollback failure vẫn map write
  failure và không giả vờ biết durable state đã commit.
- Không dùng stale in-memory snapshot làm authoritative display trong recovery.
- Side-effect failure sau valid core commit không rollback core truth hoặc enter global recovery.
- No automatic retry loop/backoff/background worker; Retry chỉ do explicit user action trong UI.
- No automatic reset/reseed/recreate/repair/downgrade under any reason.
- Dispose/unmount stops new retry and cleans application-scoped resources idempotently.

## 10. Definition of Done

- [x] `US0207-CONFIRM-01`–`05` approved và reflected trong plan.
- [x] `T01`–`T08` implementation/host/native harness/runbook hoàn tất theo order.
- [x] Full stable recovery taxonomy và critical-vs-side-effect boundary có evidence.
- [x] Retry full barrier, same DB, single-flight, dispose race và readiness behavior pass.
- [x] Recovery UI có accessible Retry, không render raw technical data.
- [x] Full fault/fingerprint matrix chứng minh no partial state/reset/repair/terminal/reward.
- [x] Root quality/boundary/hygiene và immutable migration checks pass.
- [x] Owner native report pass exact assertions trên exact implementation SHA.
- [x] Không migration `002`, reset executor, feature behavior, provider hoặc native artifact ngoài scope.
- [x] Documentation closeout hoàn tất; `US-02-07 DONE` rồi mới mở planning `US-02-08`.

## 11. Handoff sau implementation

1. `T00 → T10` đã hoàn tất; Story `DONE` với host + exact iOS evidence.
2. Planning dependency `US-02-08` đã mở theo authoritative solo order.
3. Reset implementation vẫn phải chờ owner duyệt technical confirmations của plan `US-02-08`.
4. Both-platform recovery repeat và broader kill/disk-full matrix vẫn thuộc `US-02-09`.

## 12. References

- `docs/planning/EPIC-02_USER_STORIES.md`
- `docs/planning/MVP_EPICS.md`
- `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`
- `docs/planning/US-02-04_IMPLEMENTATION_PLAN.md`
- `docs/planning/US-02-06_IMPLEMENTATION_PLAN.md`
- `docs/PIXELDORO_CORE_TRUTH.md`, §7.7
- `docs/architecture/data-model.md`, §1, §6.1, §8.1, §11, §13–14
- `docs/architecture/system-architecture.md`, §5.2, §6.5–6.6, §7
- `docs/architecture/project-structure.md`, §3–5, §7
- `docs/architecture/technical-overview.md`, §5, §10.1, §10.3–10.4
- `docs/specifications/timer-engine.md`, §10.2
- `docs/architecture/decisions/ADR-003-state-and-persistence.md`
- `docs/architecture/decisions/ADR-004-domain-and-platform-boundaries.md`

## 13. Change log

### 0.4.0 — 2026-08-29

- Tiếp nhận exact iOS `US-02-07_FAILURE_RECOVERY` report `passed: true`, đủ `11/11`
  assertions, SQLite `3.50.3`, trên implementation SHA
  `b3c8421ef3a20934005711a571655265cf736091`.
- Xác nhận typed failure, closed readiness, durable-row retention, same-DB full-barrier Retry,
  single-flight, side-effect isolation, no reset/repair/terminal/reward và cleanup trên native.
- Hoàn tất `T09`–`T10`, chuyển Story sang `DONE` và mở planning dependency `US-02-08`.

### 0.3.0 — 2026-08-29

- Implement stable recovery taxonomy/source mapping, critical ingress, full-barrier same-DB Retry,
  connection recycle, readiness/single-flight/dispose safety.
- Replace dead-end recovery surface bằng friendly accessible Retry; add fixed sanitized diagnostic
  envelope/default adapter mà không thêm provider.
- Add exhaustive fake/real SQLite failure, migration mapping, rollback/fingerprint, side-effect
  isolation và UI evidence; full `pnpm quality` pass `21` files / `126` tests.
- Add isolated dev-only `US-02-07_FAILURE_RECOVERY` native probe và manual runbook; không chạy
  native/EAS build, không thêm migration `002`/reset/session behavior.
- Chuyển Story sang `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`; còn `T09` owner report và `T10`.

### 0.2.0 — 2026-08-29

- Ghi nhận owner duyệt đủ `US0207-CONFIRM-01`–`05` ngày 2026-08-29.
- Khóa recovery taxonomy, critical ingress, full-barrier Retry, safe UI/diagnostics và evidence
  split; chuyển plan qua `READY_FOR_IMPLEMENTATION` trước khi owner yêu cầu triển khai.

### 0.1.0 — 2026-08-29

- Tạo implementation plan sau `US-02-06 DONE` và exact iOS evidence được review.
- Review current recovery/bootstrap/error/Presentation gaps và khóa scope typed recovery + explicit
  Retry, không kéo reset/session/Product behavior.
- Đề xuất năm technical confirmations cho taxonomy, critical ingress, Retry lifecycle,
  UI/diagnostics và host/native evidence split.
- Đặt authoritative solo order `T00 → T10`; implementation `NOT_STARTED`.
- Không chỉnh production code, migration hoặc chạy native/EAS build trong planning turn.
