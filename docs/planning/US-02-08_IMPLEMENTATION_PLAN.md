---
document_id: PIXELDORO_US_02_08_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-02-08 Implementation Plan
version: 0.3.0
status: IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME
implementation_status: IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME
last_updated: 2026-08-29
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
language: vi
scope:
  - mobile_mvp
  - epic_02
  - us_02_08
  - confirmed_full_local_data_reset
  - atomic_maintenance_transaction
  - post_reset_safe_bootstrap
authority: PLANNING
story_baseline: ./EPIC-02_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundaries: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
adr_analytics_privacy: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# US-02-08 — Atomic Confirmed Full Local-data Reset

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan authoritative dự kiến cho `US-02-08` thuộc
`EPIC-02 — Durable Local Data, Migration và Safe Bootstrap`.

**Story outcome:** Sau một confirmation boundary bên ngoài đã xác nhận intent, Application có thể
độc quyền block core command, clear/reseed toàn bộ product data trong một transaction, giữ nguyên
schema/migration history/exact catalog và chỉ trở lại ready sau fresh bootstrap. Failure trước
commit rollback toàn bộ; không có reset dở dang hoặc success projection giả.

**Dependency:** `US-02-07 DONE`. Full host quality pass `21` files / `126` tests; exact iOS
`US-02-07_FAILURE_RECOVERY` probe pass `11/11` assertions với SQLite `3.50.3` trên SHA
`b3c8421ef3a20934005711a571655265cf736091`.

**Priority:** `MUST` / `P2_RECOVERY` / execution order `08` trong EPIC-02.

**Blocks:** `US-02-09`. Cross-platform/exit audit chỉ có ý nghĩa sau khi reset atomicity,
retention, post-reset bootstrap và no-partial-state đã có host + native evidence.

**Planning status:** `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`.
**Implementation status:** `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`.

Không có Product decision `OPEN` nào block planning. Năm technical direction
Owner đã duyệt đủ `US0208-CONFIRM-01`–`05` ngày 2026-08-29. Production private reset graph,
atomic maintenance adapter, exclusive lifecycle/post-reset bootstrap, best-effort side effects,
host failure matrix và dev-only native probe/runbook đã hoàn tất. Full `pnpm quality` pass `24`
files / `147` tests; Story còn chờ exact owner native report trên final implementation SHA.

### 0.1. Start gate

- [x] `US-02-07 DONE` với host + exact native recovery evidence.
- [x] `EPIC02-INPUT-03 RESOLVED`: immutable receipt normal path và private confirmed-reset delete
  authority đã được owner duyệt.
- [x] Data Model `1.0.0 APPROVED`; `DM-OPEN-001`–`007` đều `RESOLVED`.
- [x] Product Core §7.7/§14.2 và Data Model §9.2 khóa explicit-confirmed full reset semantics.
- [x] Initial/reset defaults và analytics identity policy đã approved.
- [x] Chỉ planning `US-02-08` active; không implement song song `US-02-09`.
- [x] Owner duyệt `US0208-CONFIRM-01`–`05` ngày 2026-08-29.

## 1. Baseline và current-state review

### 1.1. Authority contract

| Authority | Contract áp dụng cho `US-02-08` |
|---|---|
| `EPIC-02_USER_STORIES.md` | Private confirmed-reset executor, atomic ordered clear/reseed, schema/catalog retention, fresh bootstrap và rollback evidence. |
| Product Core §7.7 | Full local reset là last resort do user chủ động chọn và xác nhận rõ; recovery không được tự reset. |
| Product Core §14.2/§19 | User sở hữu local-data control; MVP phải có cơ chế reset/xóa local data. |
| Data Model §7.8/§9.2 | Block command; notification cleanup best-effort; exact reset transaction; identity rotation; clear projection; rerun bootstrap. |
| Data Model §11 `DM-EDGE-021`–`022` | Analytics queue/identity reset đúng policy; kill giữa transaction chỉ rollback hoặc full commit. |
| Data Model §13/§14.5–14.6 | Reset integration, singleton defaults, schema/catalog preservation và product retention acceptance. |
| System Architecture §2/§5–7 | Application owns transaction/side-effect order; provider call ngoài transaction; UI chỉ phản ánh committed result. |
| Technical Overview §4/§8 | SQLite durable truth; reset clear queue/rotate anonymous ID; provider vẫn best-effort và privacy bounded. |
| ADR-003/004/008 | Projection rebuildable; Application-owned ports; reset/opt-out privacy boundary không rò provider vào core. |
| `MVP_EPICS.md` EPIC-02/10 | Epic 2 dựng capability/evidence; Epic 10 sở hữu warning/confirmation Settings UX và user invocation. |

### 1.2. Current implementation đã có

- Một `SQLiteDatabaseOwner`, `SQLiteTransaction` và application-scoped persistence graph.
- `ReadinessGate` đóng/mở core command capability; bootstrap/recovery cùng sở hữu ready state.
- `MobileBootstrap` hỗ trợ ordered boot, recovery, same-DB Retry, single-flight và dispose safety.
- Typed repositories cover mười durable entity groups; normal reward/purchase repositories không
  expose update/delete.
- `analytics_events` có narrow queue cleanup API; chưa có product-wide maintenance capability.
- Initial migration có exact singleton defaults, exact 12-item catalog, FK `RESTRICT`, indexes,
  immutable triggers và schema verifier.
- `ClockPort`/`IdPort` concrete adapters đã inject ở composition root.
- Chưa có notification reset-cleanup port/provider và chưa có Settings confirmation screen; đây là
  expected boundary, không phải blocker của Epic 2.

### 1.3. Gap phải đóng trong Story này

| ID | Gap hiện tại | Hướng xử lý trong plan |
|---|---|---|
| `US0208-GAP-01` | Không có reset executor/barrier; readiness chỉ cover boot/recovery. | Add Application-owned confirmed-reset coordinator + exclusive maintenance lifecycle. |
| `US0208-GAP-02` | Normal repositories cố ý không có ledger/session delete. | Add narrow private maintenance port/SQLite adapter, không mở generic CRUD hoặc normal delete API. |
| `US0208-GAP-03` | Initial singleton seed chỉ dùng khi DB trống. | Extract/reuse normative reset values; reset singleton bằng exact parameterized statements với injected `now`/new ID. |
| `US0208-GAP-04` | Bootstrap không có trusted post-commit restart từ `ready`. | Add internal post-reset full-barrier rebootstrap; không giả recovery reason hoặc expose UI shortcut. |
| `US0208-GAP-05` | Retry recovery và reset có thể tranh connection nếu capability được thêm độc lập. | Serialize/reset-vs-bootstrap lifecycle; reset không chạy khi boot/retry/reset/dispose đang active. |
| `US0208-GAP-06` | Chưa có best-effort notification cleanup seam. | Add minimal Application port + no-op/recording fake; không kéo `expo-notifications` integration. |
| `US0208-GAP-07` | Analytics ID reset sequencing có thể để commit xong nhưng ID cũ còn lại. | Generate trước transaction, persist new ID atomically; provider adoption là post-commit future side effect. |
| `US0208-GAP-08` | Chưa có full before/after/rollback/native evidence. | Real SQLite statement-fault/fingerprint matrix + isolated Expo SQLite probe/runbook. |

### 1.4. Mâu thuẫn/scope traps đã xử lý

1. Data Model mô tả reset installation metadata trong transaction rồi “rotate/create anonymous
   ID” sau commit. Plan hiểu bước sau commit là provider coordination; durable new ID được persist
   trong transaction để không có privacy half-state.
2. Full reset là xóa **product rows**, không phải delete/recreate database file. Schema newer,
   checksum invalid hoặc schema unsafe phải fail typed; không bypass compatibility bằng destructive
   file reset.
3. Notification cleanup là best-effort. Lookup/cleanup failure được sanitize và không làm rollback/
   block một reset transaction hợp lệ; notification không là durable truth.
4. Epic 2 chỉ tạo private capability và evidence. Settings route, warning/copy/modal, user
   confirmation state và navigation success thuộc EPIC-10.
5. Post-commit bootstrap có thể fail dù reset transaction đã commit. Khi đó gate giữ đóng và app
   vào typed recovery; result không được nói reset rollback hoặc success hoàn chỉnh.
6. Không thêm reset receipt/idempotency table hoặc migration `002`. Same-process double invocation
   dùng single-flight; explicit retry trên already-reset state vẫn an toàn nhờ exact singleton/cardinality.

## 2. Proposed technical directions cần owner xác nhận

### TD-02-08-A — Private confirmed authority và invocation boundary

- Add `ConfirmedLocalDataReset` Application capability ở concrete mobile application graph.
- Capability không được export qua current Presentation facade/provider, route, recovery screen hoặc
  generic Settings API; dev-only probe có thể gọi direct concrete graph.
- `US-02-07` Retry/recovery không import hoặc invoke capability này.
- EPIC-10 sau này sở hữu warning/confirmation UX và mới intentionally wire confirmed user intent
  vào capability. Không tạo opaque “confirmation token” giả khi confirmation owner chưa tồn tại.
- Reset cho phép từ stable `ready` hoặc explicit `recovery` last-resort context khi preflight xác
  minh database/schema đủ an toàn; reject booting/retrying/resetting/disposed.

### TD-02-08-B — Narrow atomic maintenance port và exact retained surface

- Application coordinator dùng existing `TransactionPort`; Infrastructure triển khai narrow
  `ConfirmedResetPersistencePort.resetInTransaction(scope, seed)`.
- Adapter có static parameterized SQL và exact order:
  `analytics_events → owned_items → purchase_transactions → reward_transactions → sessions →
  store_review_attempts`, sau đó reset singleton installation/settings/profile.
- Singleton ID vẫn là `1`; reset values: installed/created/updated time = injected `now`, onboarding
  `NULL`, profile XP/Coin `0`, durations `25/5/15`, default mode `relax`, sound/haptic/
  notifications/analytics `1`, new non-empty anonymous ID.
- `schema_migrations`, schema objects/indexes/triggers và exact 12-item `catalog_items` không được
  delete/update/reseed trong normal reset transaction.
- Adapter assert exact affected-row/cardinality và postconditions trước commit. Any mismatch returns
  typed failure so transaction rollback; no dynamic table input, generic clear hoặc normal repository
  delete exposure.
- No database-file deletion/recreation, migration repair/downgrade hoặc schema `002`.

### TD-02-08-C — Exclusive barrier, single-flight và post-reset bootstrap

- Application-scoped reset coordinator closes readiness before any lookup/cleanup/transaction and
  owns one in-flight reset promise; concurrent calls coalesce.
- Reset and bootstrap Retry/dispose are mutually exclusive through one lifecycle/maintenance gate;
  correctness still relies on SQLite `BEGIN IMMEDIATE`, FK/check/trigger and transaction rollback.
- Transaction failure with successful rollback restores previous readiness/projection and returns a
  stable typed failure. Rollback/connection uncertainty enters existing critical recovery and keeps
  gate closed.
- After commit, stale bootstrap/application projection is discarded and an internal full ordered
  same-DB bootstrap runs: open/migrate/verify/hydrate/reconcile → ready.
- Reset reports complete only after fresh defaults/catalog hydrate and readiness opens. If this
  post-commit barrier fails, reset data remains committed, app enters typed recovery and result is
  `RESET_COMMITTED_BOOTSTRAP_FAILED`; Retry uses existing recovery path.
- Repeating reset on already-fresh state creates one valid singleton set/new identity and never
  duplicates catalog or resurrects deleted rows. No durable reset receipt is added.

### TD-02-08-D — Best-effort side effects và anonymous identity policy

- Before transaction, coordinator attempts to obtain known active session ID and invokes a minimal
  `ResetNotificationCleanupPort.cancelKnownSession(id | null)`. Lookup/cleanup error becomes a
  sanitized warning/diagnostic and reset continues.
- No notification provider call occurs inside SQLite transaction. Default implementation is no-op;
  recording/failing fake supplies evidence. `expo-notifications` integration belongs capability
  owner in later Epic.
- Generate a fresh non-empty anonymous ID before transaction and persist it with reset installation
  row inside the same transaction; queue clear and identity rotation therefore commit together.
- Settings reset to approved analytics default `enabled = 1`. Provider stop/reset/adopt-ID behavior
  remains behind a future best-effort analytics adapter and is not implemented in this Story.
- Diagnostics use fixed allowlisted event/reason/warning fields only; no old ID, session payload,
  SQL, row dump, provider error message or free text.

### TD-02-08-E — Evidence split, kill semantics và close gate

- Pure/host tests cover authorization exposure, exact delete order, typed result/warning, barrier,
  reset-vs-retry concurrency, single-flight and bootstrap transition.
- Real Node SQLite integration seeds every product table, fingerprints product/schema/catalog,
  injects failure after each destructive/reseed statement and proves full rollback.
- “Kill before commit” is simulated deterministically by abort/connection failure within transaction;
  actual OS process-kill/relaunch and both-platform repetition remain `US-02-09`.
- Isolated dev-only Expo SQLite probe runs production reset coordinator/maintenance adapter against
  a probe DB, verifies success + injected rollback + reopen/bootstrap/cleanup.
- One owner-run native platform pass on exact implementation SHA closes `US-02-08`; iOS + Android
  matrix stays in `US-02-09`.
- No Settings/reset UI, Product command, provider SDK, native/EAS build or generated native artifact.

## 3. Owner confirmations

| ID | Cần xác nhận | Đề xuất | Trạng thái |
|---|---|---|---|
| `US0208-CONFIRM-01` | Reset capability exposure và allowed invocation states | Duyệt TD-02-08-A | `APPROVED 2026-08-29` |
| `US0208-CONFIRM-02` | Exact atomic maintenance/delete/reseed/retained surface | Duyệt TD-02-08-B | `APPROVED 2026-08-29` |
| `US0208-CONFIRM-03` | Barrier, reset-vs-Retry serialization và post-commit bootstrap semantics | Duyệt TD-02-08-C | `APPROVED 2026-08-29` |
| `US0208-CONFIRM-04` | Notification best-effort và atomic anonymous-ID rotation policy | Duyệt TD-02-08-D | `APPROVED 2026-08-29` |
| `US0208-CONFIRM-05` | Host/native evidence split và simulated-vs-real kill boundary | Duyệt TD-02-08-E | `APPROVED 2026-08-29` |

Đây là technical implementation decisions. Không có Product decision `OPEN` bị chốt trong plan;
nếu owner không duyệt một proposal, chỉ direction tương ứng được sửa trước implementation.

## 4. In scope và out of scope khóa cho implementation

### 4.1. In scope

- Private Application confirmed-reset capability, stable result/error/warning và single-flight.
- Exclusive readiness/bootstrap/reset lifecycle coordination.
- Narrow SQLite maintenance adapter chạy trong existing transaction scope.
- Exact product clear order, singleton reset defaults và atomic anonymous-ID rotation.
- Preserve/verify schema, migration history, triggers/indexes và exact catalog.
- Best-effort notification cleanup port với no-op/recording/failing fake.
- Post-commit projection invalidation + full safe bootstrap/recovery handoff.
- Exhaustive fake/real SQLite rollback/fingerprint/concurrency evidence.
- Isolated dev-only Expo SQLite reset probe và owner manual runbook.
- Documentation/evidence/status closeout.

### 4.2. Out of scope

- Settings route/screen, warning/copy/modal, confirmation state hoặc success navigation.
- Recovery screen reset button hoặc automatic reset from any recovery reason.
- Partial XP/Coin/session/history/inventory/onboarding-only reset.
- Database file delete/recreate, schema salvage, migration repair/downgrade hoặc migration `002`.
- Provider-specific notification/PostHog cleanup, delivery/capture orchestration hoặc SDK install.
- Session terminal/cancel/reward logic, Timer/Pet/Gamification behavior hay Product UI.
- Account/server deletion, cloud backup/restore/export/import.
- Durable reset receipt/idempotency key table hoặc background reset worker.
- Native/EAS/prebuild execution hoặc generated native artifact trong agent turn.

## 5. Authoritative execution order cho solo developer

| Order | Task | Gate/output | Blocks |
|---:|---|---|---|
| `T00` | Owner confirmation gate | `CONFIRM-01`–`05` approved | Tất cả implementation task |
| `T01` | Reset contracts + lifecycle state | Stable result/error/warning, private capability, barrier contract | T02–T05 |
| `T02` | Atomic maintenance vertical slice | Seeded DB → one transaction → exact fresh durable state | T03, T05 |
| `T03` | Side-effect/identity orchestration | Best-effort notification + atomic new ID/queue clear | T05 |
| `T04` | Post-reset bootstrap integration | Stale projection cleared; full barrier → fresh ready/recovery | T05–T06 |
| `T05` | Failure/concurrency matrix | Every statement rollback, reset-vs-retry/dispose deterministic | T06 |
| `T06` | Composition/scope/retention audit | Private graph only; no UI/provider/file-delete/migration leak | T07 |
| `T07` | Full host quality | Type/lint/test/boundary/hygiene pass | T08 |
| `T08` | Native diagnostic + runbook | Isolated Expo SQLite reset probe ready | T09 |
| `T09` | Owner native evidence | Exact report on final implementation SHA | T10 |
| `T10` | Closeout | Evidence/docs/status complete; open US-02-09 | Story DONE |

Chỉ một task/Story active tại một thời điểm. `MUST` là MVP requirement;
`P2_RECOVERY` là dependency/risk priority; bảng trên là implementation sequence thực tế.

### 5.1. Rationale cho order

1. Authorization/result/lifecycle contract phải khóa trước destructive capability.
2. Atomic durable reset được chứng minh độc lập trước projection/bootstrap orchestration.
3. Notification/identity sequencing dựa trên transaction outcome, không được chen provider vào DB.
4. Post-reset bootstrap chỉ dùng committed fresh truth; không tạo optimistic success.
5. Full statement-fault/concurrency matrix chạy trước composition/native để phát hiện partial reset.
6. `US-02-09` chỉ mở sau exact host/native evidence của reset capability.

## 6. Task checklist chi tiết

### US0208-T00 — Decision gate

- [x] Owner duyệt `US0208-CONFIRM-01`–`05` ngày 2026-08-29.
- [x] Update plan qua `READY_FOR_IMPLEMENTATION` trước implementation.
- [x] Snapshot worktree và giữ nguyên unrelated owner documentation changes.

### US0208-T01 — Application contracts và exclusive lifecycle

- [x] Add stable reset command result/error/warning types; không chứa provider/SQLite error.
- [x] Add private concrete-graph capability; không expose current Presentation facade/provider.
- [x] Add reset lifecycle/single-flight and mutual exclusion với boot/retry/dispose.
- [x] Close readiness synchronously trước reset work; fake future core command bị reject.
- [x] Test no route/recovery/facade import or invocation path.

### US0208-T02 — Narrow atomic reset persistence

- [x] Define narrow `ConfirmedResetPersistencePort` với exact typed seed input.
- [x] Implement static parameterized SQLite statements theo approved FK-safe order.
- [x] Clear exact six product/metadata groups; reset exact three singleton rows.
- [x] Preserve catalog/schema/history; assert exact affected rows/cardinality/postconditions.
- [x] Keep receipt/catalog normal repository APIs immutable/non-destructive.
- [x] Reject invalid time/ID/input before write; map provider failure safely.

### US0208-T03 — Notification và analytics identity boundary

- [x] Add minimal best-effort reset notification cleanup port + no-op/recording/failing fake.
- [x] Capture known active session ID when available without creating Session behavior.
- [x] Prove cleanup runs after barrier and before transaction; failure becomes warning only.
- [x] Generate one fresh ID per in-flight attempt; persist with queue clear in transaction.
- [x] Verify old ID/payload/provider message never enters diagnostics/projection.

### US0208-T04 — Post-commit rebootstrap vertical slice

- [x] Add internal trusted post-reset bootstrap entry; no fake recovery reason or public UI shortcut.
- [x] Clear stale snapshot immediately after commit and rerun full ordered barrier on same DB.
- [x] Open readiness only after exact defaults/catalog/new identity hydrate and reconcile.
- [x] Map post-commit bootstrap failure to recovery + typed committed-but-not-ready result.
- [x] Existing recovery Retry resumes safely; no duplicate singleton/catalog/resurrected rows.

### US0208-T05 — Host failure, rollback và concurrency matrix

- [x] Seed fixtures across all product/metadata tables and record exact pre-reset fingerprint.
- [x] Inject provider failure across every destructive/reseed statement plus returned/thrown paths.
- [x] Prove transaction rollback restores all rows/values/schema/catalog/history.
- [x] Test successful before/after counts, exact defaults, timestamps and rotated ID.
- [x] Test concurrent reset coalescing; reset-vs-retry/boot/dispose deterministic.
- [x] Test repeated reset on fresh DB and post-commit bootstrap failure semantics.
- [x] Test rollback/connection uncertainty enters recovery and never reports success.

### US0208-T06 — Composition, boundary và scope audit

- [x] Wire one reset coordinator/maintenance adapter in composition root.
- [x] Keep reset absent from current public mobile facade/context/UI/recovery action.
- [x] Audit production `DELETE`: exact maintenance adapter + existing analytics queue only.
- [x] Audit no reset-path `deleteDatabase`, dynamic table/generic clear, catalog/schema/history mutation.
- [x] Run US-02-01–07 regressions and immutable migration checks.
- [x] Confirm no Settings/Product/provider code, migration `002` or native artifact.

### US0208-T07 — Full host quality

- [x] Run targeted reset/rollback/bootstrap/privacy tests với pinned Node/pnpm.
- [x] Run root `pnpm quality`: `24` files / `147` tests pass ngày 2026-08-29.
- [x] Run `git diff --check`, boundary, device harness, repository hygiene/checksum.
- [x] Record exact file/test count and remaining owner native gate.

### US0208-T08 — Native diagnostic và manual runbook

- [x] Add dev-only `US-02-08_CONFIRMED_RESET` probe via existing diagnostics seam.
- [x] Use isolated database and production reset coordinator/adapter/bootstrap.
- [x] Seed every product table, run success/repeat reset and verify exact fresh state.
- [x] Run isolated injected failure case proving complete rollback fingerprint.
- [x] Report platform/OS/app/application ID/commit SHA/SQLite version/stable assertions.
- [x] Close connections idempotently; delete only exact isolated probe databases.
- [x] Write owner manual guide; agent không chạy native/EAS build.

### US0208-T09 — Owner native evidence

- [ ] Owner chạy manual probe trên ít nhất một approved native target.
- [ ] Report `passed: true`, exact assertions và exact final implementation SHA.
- [ ] Agent review SHA/assertion completeness; code change sau report làm evidence stale.

### US0208-T10 — Closeout

- [ ] Map all Story acceptance criteria tới host/native evidence.
- [ ] Update plan, Epic Story và consolidated implementation evidence.
- [ ] Chỉ chuyển `DONE` khi host quality + exact native report pass.
- [ ] Mở planning gate `US-02-09`; không tự chạy cross-platform/native build.

## 7. Planned file impact

| Khu vực | Planned impact |
|---|---|
| `apps/mobile/src/application/reset/` | Reset result/error/warning, private coordinator, barrier/single-flight orchestration. |
| `apps/mobile/src/application/ports/` | Narrow maintenance, notification cleanup và post-reset bootstrap contracts nếu cần. |
| `apps/mobile/src/application/bootstrap/` | Internal trusted post-reset full-barrier entry/mutual exclusion. |
| `apps/mobile/src/infrastructure/database/reset/` | Static ordered SQL maintenance adapter + postcondition verifier. |
| `apps/mobile/src/infrastructure/platform/notifications/` | No-op reset cleanup adapter only if required; no Expo provider integration. |
| `apps/mobile/src/composition/` | Private graph wiring and dev-only probe; no public Presentation exposure. |
| `apps/mobile/test/integration/` | Real SQLite success/rollback/fingerprint/rebootstrap/concurrency matrix. |
| `apps/mobile/test/device/` | Owner native reset runbook and harness validation. |
| `docs/planning/` | Plan, Story status and consolidated evidence closeout. |

Tên file có thể đổi nhỏ khi implement nhưng ownership/dependency direction không đổi.

**Không planned:** route/screen/reset button, current facade exposure, migration `002`, database-file
deletion, Product Session/Reward/Pet behavior, provider SDK hoặc native generated artifact.

## 8. Acceptance và evidence matrix

| Story acceptance | Host evidence | Native evidence |
|---|---|---|
| No unconfirmed/current path invokes reset | Export/import/capability audit + facade/recovery tests | Probe only runs under explicit dev flag |
| Barrier blocks commands and releases safely | Fake command/reset/retry/dispose state matrix | Gate trace around real Expo SQLite reset |
| Notification cleanup best-effort | Recording/failing fake order + warning assertions | Representative failure does not block reset |
| Exact atomic clear order | Statement trace + real SQLite all-table fixture | Product rows zero after committed reset/reopen |
| Exact singleton defaults/new identity | Value/timestamp/ID assertions | Fresh hydrated native snapshot |
| Schema/history/catalog preserved | Full sqlite_master/history/catalog fingerprint | Native verifier after reset/reopen |
| Projection rebuilt after commit | Bootstrap phase/projection trace | Same-DB full bootstrap before ready |
| Mid-reset failure rollback | Fault after every statement + full fingerprint | Representative injected rollback case |
| Retry/repeat does not duplicate/resurrect | Repeated/concurrent/ambiguous-result matrix | Repeat on same isolated database |
| Normal repositories remain immutable | Type/API/import/SQL audit | Probe uses private maintenance capability only |

### 8.1. Native report contract

```json
{
  "probe": "US-02-08_CONFIRMED_RESET",
  "passed": true,
  "platform": "ios-or-android",
  "osVersion": "owner-runtime",
  "appVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "40-character-final-implementation-sha",
  "sqliteVersion": "runtime-value",
  "assertions": [
    "reset_probe_database_opened_and_migrated",
    "complete_pre_reset_product_fixture_was_verified",
    "unconfirmed_and_recovery_paths_could_not_invoke_reset",
    "notification_cleanup_failure_was_best_effort",
    "confirmed_reset_committed_atomically",
    "product_history_economy_and_metadata_were_cleared",
    "singletons_reseeded_and_anonymous_identity_rotated",
    "schema_history_triggers_indexes_and_exact_catalog_were_preserved",
    "post_reset_bootstrap_hydrated_fresh_defaults_before_ready",
    "injected_mid_reset_failure_restored_complete_fingerprint",
    "concurrent_repeated_reset_and_dispose_were_safe",
    "probe_connections_closed_and_databases_cleaned"
  ]
}
```

Assertion IDs đã freeze tại `T08`. Host per-statement failure matrix không được thay bằng một native
happy path; native report chỉ cần representative injected rollback và real runtime path.

## 9. Failure, rollback và retry policy

- Reset barrier đóng readiness trước mọi best-effort cleanup và database work.
- Invalid invocation/preflight failure không mutate; prior ready projection có thể giữ nguyên nếu
  durable state vẫn được chứng minh an toàn.
- Notification lookup/cleanup failure là warning; không nằm trong transaction hoặc quyết định reset.
- Transaction returned/thrown/constraint/postcondition failure phải rollback all product/singleton
  mutation và không publish success.
- Rollback/connection uncertainty đi vào existing critical recovery; không giả định old/new state.
- Commit là durable boundary. Sau commit không khôi phục old projection; bootstrap failure giữ gate
  đóng và dùng existing recovery Retry trên committed fresh database.
- Catalog/schema/history mismatch trước hoặc sau reset fail closed; không overwrite/repair/recreate.
- Concurrent reset coalesce; reset và recovery Retry/dispose không được thao tác owner cùng lúc.
- No automatic invocation, timer-based retry, background worker hoặc partial reset.

## 10. Definition of Done

- [x] `US0208-CONFIRM-01`–`05` approved và reflected trong plan.
- [x] `T01`–`T08` implementation/host/native harness/runbook hoàn tất theo order.
- [x] Private confirmed authority và no-current-UI/recovery invocation có evidence.
- [x] Exact ordered transaction/defaults/identity/retained surface pass.
- [x] Full rollback/fingerprint matrix chứng minh no partial reset.
- [x] Post-commit full bootstrap, readiness, recovery/retry và projection freshness pass.
- [x] Notification cleanup failure best-effort; diagnostics/privacy allowlist pass.
- [x] Root quality/boundary/hygiene và immutable migration checks pass.
- [ ] Owner native report pass exact assertions trên exact implementation SHA.
- [x] Không migration `002`, reset-path database-file deletion, feature/provider/native artifact ngoài scope.
- [ ] Documentation closeout hoàn tất; `US-02-08 DONE` rồi mới mở `US-02-09`.

## 11. Handoff sau planning

1. `T00 → T08` đã hoàn tất; Story đang `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`.
2. Owner commit final implementation, chạy manual probe và gửi exact structured report.
3. Agent review exact SHA/assertions rồi thực hiện `T10` closeout.
4. Chỉ sau `US-02-08 DONE` mới mở `US-02-09` cross-platform/exit audit.

## 12. References

- `docs/planning/EPIC-02_USER_STORIES.md`, `US-02-08`
- `docs/planning/MVP_EPICS.md`, EPIC-02 và EPIC-10
- `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`
- `docs/planning/US-02-07_IMPLEMENTATION_PLAN.md`
- `docs/PIXELDORO_CORE_TRUTH.md`, §7.7, §14.2, §19
- `docs/architecture/data-model.md`, §7.8, §8.1, §9.2, §11, §13, §14.5–14.6
- `docs/architecture/system-architecture.md`, §2, §4–7
- `docs/architecture/project-structure.md`, §3–5, §7
- `docs/architecture/technical-overview.md`, §4–5, §8, §10
- `docs/architecture/decisions/ADR-003-state-and-persistence.md`
- `docs/architecture/decisions/ADR-004-domain-and-platform-boundaries.md`
- `docs/architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md`

## 13. Change log

### 0.3.0 — 2026-08-29

- Implement private confirmed-reset coordinator, stable result/warning/diagnostic contracts,
  readiness maintenance lease, single-flight và reset-vs-Retry/dispose safety.
- Implement narrow static SQLite maintenance adapter: FK-safe clear, exact singleton reseed,
  atomic new anonymous ID, schema/history/catalog preservation và postcondition validation.
- Add best-effort notification cleanup/no-op adapter, full post-commit bootstrap/recovery handoff,
  per-statement real SQLite rollback/fingerprint matrix and privacy/scope audit.
- Full `pnpm quality` pass `24` files / `147` tests; no migration `002`, Settings UI, provider,
  Product behavior, reset-path database-file deletion or native artifact.
- Add isolated dev-only `US-02-08_CONFIRMED_RESET` probe + runbook; chuyển Story sang
  `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`.

### 0.2.0 — 2026-08-29

- Ghi nhận owner duyệt đủ `US0208-CONFIRM-01`–`05`.
- Khóa private reset authority, exact atomic maintenance/reseed, exclusive post-reset bootstrap,
  best-effort notification/atomic identity và host/native evidence split.
- Chuyển plan sang `READY_FOR_IMPLEMENTATION`; implementation vẫn `NOT_STARTED` tại decision gate.

### 0.1.0 — 2026-08-29

- Tạo implementation plan sau `US-02-07 DONE` với exact iOS recovery evidence.
- Review reset authority, FK-safe transaction, singleton defaults, identity/privacy sequencing,
  bootstrap/recovery lifecycle và current repository/composition gaps.
- Đề xuất năm technical confirmations cho private authority, atomic maintenance surface,
  exclusive post-reset bootstrap, best-effort side effects/identity và evidence split.
- Đặt authoritative solo order `T00 → T10`; implementation `NOT_STARTED`.
- Không chỉnh production code, migration hoặc chạy native/EAS build trong planning turn.
