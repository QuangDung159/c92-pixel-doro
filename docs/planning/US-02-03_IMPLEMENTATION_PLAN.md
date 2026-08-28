---
document_id: PIXELDORO_US_02_03_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-02-03 Implementation Plan
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
  - us_02_03
  - forward_only_migration
  - migration_history
  - checksum
  - compatibility
authority: PLANNING
story_baseline: ./EPIC-02_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_delivery_pipeline: ../architecture/decisions/ADR-007-eas-delivery-pipeline.md
---

# US-02-03 — Forward-only Migration Safety

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan cho `US-02-03` thuộc
`EPIC-02 — Durable Local Data, Migration và Safe Bootstrap`.

**Story outcome:** Migration runner xác định database history có tương thích với binary hay
không, apply các migration pending theo đúng thứ tự, ghi history chỉ sau migration success và
fail typed khi gặp drift/gap/unknown/newer schema hoặc execution failure; không downgrade,
adopt schema mơ hồ, reset hay xóa database.

**Dependency:** `US-02-02 DONE` — production artifact `001` và exact native evidence đã đạt
trên commit `4996c7d6529d0a1578e2d052bdbaaf858d9e1a1d`.

**Priority:** `MUST` / `P0_CORRECTNESS` / execution order `03` trong EPIC-02.

**Dependency handoff:** `US-02-04` gate đã mở sau exact host/native evidence; Story sau vẫn
chưa được triển khai trong closeout này.

**Planning status:** `DONE`. **Implementation status:** `DONE`.

Exact iOS probe pass đủ `10/10` assertions trên implementation commit
`1b6a0427b3db20f4536a2b251101fa0e32b5c0ea`; SHA khớp repository `HEAD` khi review ngày
2026-08-28.

`EPIC02-INPUT-02` / `US0203-CONFIRM-01` đã được Dũng Lư duyệt ngày 2026-08-28.
`US0203-CONFIRM-02` và `03` đã được Dũng Lư duyệt ngày 2026-08-28. Toàn bộ technical decision
gate đã đóng; production implementation được phép bắt đầu theo thứ tự `T01 → T10`.

### 0.1. Readiness gate hiện tại

- [x] `US-02-01 DONE`: một SQLite owner và same-connection transaction kernel đã có evidence.
- [x] `US-02-02 DONE`: artifact `001`, normative schema/seed và native behavior đã có evidence.
- [x] `schema_migrations` tồn tại trong schema nhưng production artifact `001` chưa tự ghi row.
- [x] Ranh giới artifact `001` với runner/history/checksum đã được owner duyệt ở
  `US0202-CONFIRM-02`.
- [x] Không có migration runner hoặc production bootstrap migration đang active song song.
- [x] `EPIC02-INPUT-02` / `US0203-CONFIRM-01` được owner resolve ngày 2026-08-28.
- [x] Transaction granularity/retry semantics ở `US0203-CONFIRM-02` được owner duyệt ngày 2026-08-28.
- [x] Missing-history/no-adoption behavior ở `US0203-CONFIRM-03` được owner duyệt ngày 2026-08-28.
- [x] Plan chuyển `READY_FOR_IMPLEMENTATION`.

## 1. Baseline và current-state review

### 1.1. Authority contract

| Authority | Contract áp dụng cho `US-02-03` |
|---|---|
| `EPIC-02_USER_STORIES.md` | Ordered registry, checksum, gap/unknown/newer detection, transactional apply/history, retry và immutable-artifact evidence. |
| Data Model §4.11 | `schema_migrations(version, name, checksum, applied_at)` là canonical history; không có writable version truth thứ hai. |
| Data Model §8.1–8.3 | Forward-only, file immutable/naming chuẩn, history sau success, no auto-delete/downgrade, future schema cần authority mới. |
| Data Model §11 `DM-EDGE-017–019` | Invalid catalog migration fail, migration failure retain DB, older binary gặp newer schema fail safely. |
| Data Model §13, §14.6 | Empty/released → latest, checksum/gap/rollback/compatibility evidence. |
| Technical Overview §10.1, §10.4–10.5 | Test previous-version data, fail safely/no deletion; OTA không được bypass runtime compatibility. |
| System Architecture §5 | Composition cuối cùng chạy migration trước repository/readiness; Story này chưa wire production bootstrap. |
| Project Structure §4, §7 | Migration/runner/SQL ở database Infrastructure; integration/device fixture không trở thành runtime dependency. |
| ADR-003 | SQLite là durable truth và phải có schema version/migration rõ ràng. |
| ADR-007 | `runtimeVersion = appVersion`; migration compatibility không được suy ra từ OTA channel hoặc bundle timestamp. |

### 1.2. Repository hiện tại sau `US-02-02`

| Khu vực | Current state | Hệ quả cho plan |
|---|---|---|
| Migration `001` | Export version/name, ordered schema statements và `apply(executor, seedInput)`. | Registry phải reuse exact artifact; không copy DDL/seed hoặc gọi wrapper transaction lồng nhau. |
| Initial apply | `initialSchemaMigration.apply` yêu cầu empty DB, tạo `schema_migrations`, seed và verify nhưng để history empty. | Runner gọi artifact bên trong migration transaction rồi insert history trong cùng transaction. |
| Transaction kernel | `SQLiteTransaction` dùng `BEGIN IMMEDIATE`, commit/rollback và reject overlap deterministic. | Mỗi migration apply/validate/history dùng một transaction kernel hiện có. |
| Owner/read seam | `SQLiteDatabaseOwner.withConnection` giữ application-scoped lease; executor không rò raw connection ra layer khác. | History inspection có thể dùng internal read executor trên owner connection; không mở DB thứ hai. |
| Bootstrap | Production boot hiện chỉ open DB; chưa migration/verification/readiness phase. | Không wire runner vào `MobileBootstrap`/Presentation ở Story này; đó là `US-02-04`. |
| Registry/checksum | Chưa tồn tại. | Story phải khóa exact registry contract và append-only integrity check. |
| Released production versions | Chỉ có production artifact `001`; chưa có released upgrade `002`. | Upgrade ordering/failure dùng synthetic test-only descriptor, không tạo product schema `002`. |
| Test strategy | Host fake + exact Expo native probe đã được owner duyệt. | Reuse strategy; không thêm SQLite driver thứ hai hoặc native build. |

### 1.3. Findings cần xử lý trong implementation

1. `applyInitialSchema(...)` tự mở transaction, nên runner không được gọi wrapper này; runner
   gọi `initialSchemaMigration.apply(executor, input)` trong transaction do runner sở hữu.
2. History row của `001` phải nằm cùng transaction với schema/seed. Nếu insert history fail,
   toàn schema/seed của empty database phải rollback.
3. Database non-empty nhưng thiếu `schema_migrations`, hoặc có table này nhưng history empty
   trong khi product schema đã tồn tại, là ambiguous/unmanaged state. Auto-adopt bằng cách ghi
   row `001` sẽ che drift và bị cấm theo proposal.
4. Registry phải được validate hoàn toàn trước database mutation: version/name/checksum/path
   invalid, duplicate hoặc gap là programming/release error, không phải lý do thử apply.
5. Checksum chỉ hữu ích nếu bao phủ toàn migration-owned payload. `001` phụ thuộc cả
   `001_initial-schema.migration.ts` và `schema-manifest.ts`; hash riêng một SQL array sẽ bỏ sót
   exact catalog/name/version hoặc apply/verification change.
6. Checksum runtime không được phụ thuộc Node `crypto`, transpiled Metro bundle, timestamp,
   minification hoặc source-map. Runtime dùng committed lock checksum; repository quality dùng
   Node SHA-256 để recompute canonical source set.
7. Một local lock file không tự ngăn người sửa đồng thời migration và checksum. Quality gate
   phát hiện accidental drift; code review phải giữ existing lock entry append-only sau release.
8. “Rollback” trong Story là rollback transaction của migration đang fail, không phải
   downgrade những migration đã commit trước đó.
9. Physical schema/seed invariant verification sau runner là barrier của `US-02-04`. Runner
   chỉ trả `migration-compatible`; không tự publish application `ready`.
10. Error public phải typed/stable và không chứa provider message/raw SQL. Recovery projection,
    Retry UI và reset choice vẫn thuộc `US-02-07/08`.

## 2. Scope contract

### 2.1. In scope

- Application-owned migration port/result/error tối thiểu để `US-02-04` consume sau này.
- Production ordered registry chỉ chứa exact `001` ở thời điểm Story này.
- Append-only migration lock manifest và deterministic checksum verification script.
- Empty/unmanaged/history-present database classification.
- Registry and history preflight trước mutation.
- Exact version/name/checksum validation, contiguous history và latest-version detection.
- One-transaction-per-migration apply → artifact validation → history insert.
- Idempotent latest-database rerun và retry trên same database sau failed migration.
- Synthetic test-only migration/fixture để chứng minh order, partial-batch checkpoint và retry.
- Host fault-injection tests và dev-only exact Expo SQLite migration probe.
- Evidence/update planning status sau owner native report.

### 2.2. Explicit out of scope

- Production migration `002` hoặc future product table/column/index/catalog change.
- Automatic downgrade, down migration, remote migration hoặc cloud schema negotiation.
- Auto-adopt/backfill history cho database không có trustworthy history.
- Auto-delete/recreate/rename database, auto-reset hoặc repair product rows.
- Production bootstrap phase, readiness/hydration/reconciliation và recovery UI.
- Repository/mapper hoặc Session/Timer/Reward/Purchase/Pet/Settings product behavior.
- EAS/native build, prebuild, `ios/`/`android/` output hoặc second SQLite driver.
- Both-platform release audit; iOS + Android repeat thuộc `US-02-09`.

## 3. Technical directions đề xuất — chờ owner confirmation

### TD-02-03-A — Canonical migration checksum và append-only lock

**Proposal cho `EPIC02-INPUT-02`:**

1. Algorithm: SHA-256, output lowercase 64-character hexadecimal.
2. Mỗi migration lock entry gồm `version`, `name`, `filename`, ordered `sourcePaths` và
   `checksum`.
3. `sourcePaths` là exact migration-owned transitive payload. Với `001`:
   - `apps/mobile/src/infrastructure/database/migrations/001_initial-schema.migration.ts`
   - `apps/mobile/src/infrastructure/database/migrations/schema-manifest.ts`
4. Validator bắt buộc source paths sorted, unique, nằm dưới migrations directory và không
   trỏ test/probe/generated/native file.
5. Mỗi source decode UTF-8, reject BOM, normalize `CRLF`/`CR` thành `LF`, require một final
   newline và không trim whitespace/comment.
6. Canonical byte stream dùng domain prefix + length-prefixed relative path/content cho từng
   source để không có delimiter ambiguity; không chứa runtime timestamp, seed ID, build path,
   transpiled bundle hoặc source-map.
7. Repository script recompute checksum bằng Node `crypto`; mismatch fail quality gate.
8. Runtime registry đọc committed checksum từ lock manifest và so exact với durable history;
   không hash source/bundle trên device và không thêm crypto runtime dependency.
9. Lock entry đã release là append-only. Future migration chỉ append entry; sửa existing
   checksum/source set cần explicit migration incident review, không phải “update snapshot”.

**Status:** `APPROVED 2026-08-28` — `US0203-CONFIRM-01`; đây là resolution trực tiếp của
`EPIC02-INPUT-02`.

### TD-02-03-B — Transaction granularity và retry checkpoint

**Proposal:** Preflight toàn registry/history trước write; sau đó mỗi pending migration chạy
trong một transaction riêng:

```text
for each pending migration by ascending version
  capture one migration timestamp (+ seed ID only when descriptor requires)
  BEGIN IMMEDIATE
    descriptor.apply
    descriptor validation/postcondition
    INSERT exact schema_migrations row
  COMMIT
stop immediately on first failure
```

Nếu `001` commit và synthetic `002` fail, database giữ valid version `001`; row/schema/data của
`002` rollback. Retry đọc durable history `001` và bắt đầu lại ở `002`. Không rollback/downgrade
`001`, không chạy `003`, không ghi row giả.

**Status:** `APPROVED 2026-08-28` — `US0203-CONFIRM-02`.

### TD-02-03-C — Missing history không được auto-adopt

**Proposal:** Chỉ hai start state hợp lệ:

- Exact empty user database, không có `schema_migrations` → apply từ `001`.
- Có `schema_migrations` với contiguous exact prefix của production registry → validate rồi
  apply pending suffix hoặc return latest.

Các state sau fail typed và không mutate:

- Non-empty database không có `schema_migrations`.
- `schema_migrations` tồn tại nhưng history empty trong khi object/schema khác đã tồn tại.
- History row unknown/name mismatch/checksum mismatch/gap/newer than binary.
- History table malformed/unreadable.

Không infer version từ table names, không auto-insert missing history, không reseed/upsert,
không rename/delete database.

**Status:** `APPROVED 2026-08-28` — `US0203-CONFIRM-03`.

### TD-02-03-D — One owner, no nested transaction

- `MigrationRunner` nhận cùng `SQLiteDatabaseOwner` và `SQLiteTransaction` application-scoped.
- History inspection dùng owner lease/internal executor; migration apply dùng transaction
  executor cùng connection.
- Runner gọi descriptor `apply`, không gọi `applyInitialSchema` wrapper để tránh nested
  transaction.
- Không expose connection, SQL hoặc migration history row qua Application/Presentation.

**Status:** `PROPOSED`; implementation-level consequence của `US-02-01/02`, không đổi Product.

### TD-02-03-E — Typed result/error boundary

Application-owned contract dự kiến:

```text
MigrationResult
  fromVersion: integer 0..latest
  toVersion: integer 0..latest
  appliedVersions: readonly integer[]

MigrationError.code
  MIGRATION_REGISTRY_INVALID
  MIGRATION_HISTORY_MISSING
  MIGRATION_HISTORY_INVALID
  MIGRATION_VERSION_GAP
  MIGRATION_UNKNOWN_APPLIED
  MIGRATION_CHECKSUM_MISMATCH
  DATABASE_SCHEMA_NEWER_THAN_BINARY
  MIGRATION_APPLY_FAILED
  MIGRATION_HISTORY_WRITE_FAILED
```

Transaction technical errors vẫn dùng application-owned `TransactionTechnicalError`; runner
không đưa raw exception/message/SQL vào result. Exact spelling có thể refine trước code nhưng
mọi test/evidence phải dùng stable named code.

**Status:** `PROPOSED`; `US-02-07` sẽ map các category này sang recovery projection, không
được đổi chúng thành auto-repair/reset trong Story này.

### TD-02-03-F — Production registry và synthetic upgrade

- Production registry ở Story này chỉ có `001 initial-schema`.
- Synthetic `002`/`003` chỉ nằm trong test/probe fixture, dùng harmless probe table/row trên
  exact test database.
- Test registry được dependency-inject; production registry không import test fixture.
- Không đặt file synthetic theo production migration naming trong runtime directory để
  repository lock script hiểu nhầm là released migration.

**Status:** `PROPOSED`; giữ no-scope-creep boundary.

### TD-02-03-G — Native evidence boundary

- Host fake kiểm tra registry/history orchestration, error mapping, call order và fault injection.
- Exact Expo runtime probe kiểm tra DDL transaction, durable history, rerun, synthetic upgrade,
  rollback và retry trên probe database riêng.
- Một native target pass đóng runtime gate của Story; both-platform repeat ở `US-02-09`.
- Agent không chạy native/EAS build; owner chạy development build theo runbook.

**Status:** `PROPOSED`; kế thừa `EPIC02-INPUT-01 RESOLVED`.

## 4. Migration contract chi tiết

### 4.1. Descriptor/registry

Production descriptor tối thiểu phải có:

```text
version             positive safe integer
name                stable non-empty kebab name
filename            exact zero-padded filename
checksum            exact lowercase SHA-256 from lock
apply(executor, context)
```

Registry preflight bắt buộc:

- Non-empty và bắt đầu ở version `1`.
- Strict ascending, contiguous `1..latest`; không gap/duplicate.
- Version/name/filename/checksum exact với lock manifest.
- Name và filename unique.
- Filename match `<zero-padded-version>_<kebab-description>.migration.ts`.
- Checksum match `/^[a-f0-9]{64}$/`.
- Descriptor `001` là exact artifact đã `DONE`, không copy schema statements.
- Production registry không chứa synthetic/test descriptor.

Registry invalid fail trước owner/database read và không mở transaction.

### 4.2. Database classification và history validation

Runner inspection order:

```text
validate production registry + lock
  → inspect exact user sqlite_master surface needed for history classification
  → if exact empty DB: durable version = 0
  → else require readable schema_migrations
  → read rows ORDER BY version
  → validate contiguous prefix 1..N
  → reject N > registry latest before any pending apply
  → compare every version/name/checksum with registry
  → derive pending suffix N+1..latest
```

Rules:

- Empty means không có user table/view/index/trigger ngoài SQLite internal object.
- `schema_migrations` alone with zero rows is not a released version; nếu có product object
  khác thì fail missing/invalid history.
- Unknown applied version within range, name mismatch và checksum mismatch không được “fix”
  bằng update history.
- History gap hoặc out-of-order row fail typed dù physical schema có vẻ usable.
- `max(history.version) > registry.latest` là newer-schema failure; không query product table.
- Read/query/provider failure map typed và giữ database nguyên.

### 4.3. Per-migration atomic unit

Trong transaction của version `V`:

1. Capture/make available deterministic context trước transaction; validate timestamp/ID.
2. Recheck durable latest version nếu cần để chặn concurrent stale plan.
3. Call exact descriptor `apply`.
4. Run migration-owned validation/postcondition.
5. Insert bound `(version, name, checksum, applied_at)`.
6. Commit.

History insert là bước cuối nhưng vẫn trong transaction. Không dùng `INSERT OR IGNORE`, upsert,
`IF NOT EXISTS` để che reapply/drift. Duplicate/conflict là failure.

### 4.4. Timestamp/ID input

- Runner nhận `ClockPort`/`IdPort` đã có; không gọi SQLite current time/random.
- Capture đúng một timestamp cho mỗi migration attempt; dùng làm `applied_at`.
- `001` dùng cùng attempt timestamp cho initial seed và history; anonymous installation ID
  capture đúng một lần khi thực sự pending.
- Latest/no-op run không gọi `IdPort`; không tạo seed input thừa.
- Failed attempt không commit timestamp/ID; Retry được phép capture attempt value mới.
- Host fixtures dùng fixed values; không assert wall-clock thực.

### 4.5. Idempotency/concurrency

- Latest history exact → `appliedVersions = []`, không gọi artifact/seed/history insert.
- Repeated runner trên same connection/database trả cùng latest result.
- Transaction kernel reject overlapping write; runner map/preserve typed busy/technical result.
- Nếu concurrent caller đọc stale pending state, recheck trong transaction phải ngăn duplicate
  apply/history; không dựa riêng vào UI single-flight.
- Coalesced bootstrap Retry là `US-02-04/07`; Story này chỉ bảo đảm same-database retry an toàn.

### 4.6. No second truth

- `schema_migrations` là durable version truth duy nhất.
- Không dùng `PRAGMA user_version`, Zustand, app settings, AsyncStorage hoặc package version
  làm writable schema truth thứ hai.
- App/package/runtime version chỉ là report metadata; không thay registry/history comparison.

## 5. Authoritative execution plan cho solo developer

Chỉ một Task active tại một thời điểm. Không implement `US-02-04` song song.

### T00 — Owner decision gate

**Outcome:** Checksum, transaction checkpoint và no-adoption behavior được duyệt.

- [x] Duyệt `US0203-CONFIRM-01` và resolve `EPIC02-INPUT-02` ngày 2026-08-28.
- [x] Duyệt `US0203-CONFIRM-02` one-transaction-per-migration ngày 2026-08-28.
- [x] Duyệt `US0203-CONFIRM-03` missing-history fail/no auto-adopt ngày 2026-08-28.
- [x] Chuyển plan `READY_FOR_IMPLEMENTATION`; giữ `US-02-04 NOT_STARTED`.

**Blocks:** mọi implementation Task.

### T01 — Freeze migration descriptor, lock format và error matrix

**Outcome:** Exact contract có manifest/test mapping trước khi refactor artifact `001`.

- [x] Define descriptor/result/error types và exact registry invariants.
- [x] Define lock manifest schema và canonical byte-stream format.
- [x] List exact transitive source set của `001`.
- [x] Freeze database classification/history state matrix.
- [x] Map every invalid state tới one stable error code và zero-write expectation.
- [x] Audit no Product `OPEN`/future schema field trong descriptor/test fixture.

**Blocks:** `T02`, `T03`, `T04`, `T07`.

### T02 — Add checksum lock và immutable-artifact quality gate

**Outcome:** Released migration drift fail deterministic trong repository quality.

- [x] Add append-only migration lock manifest với exact `001` entry.
- [x] Add Node SHA-256 verifier dùng canonical source-set algorithm đã duyệt.
- [x] Validate filename/version/name/source path/checksum format.
- [x] Fail missing/unlocked production migration và unexpected runtime migration file.
- [x] Add positive recompute test và tampered source/checksum expected failures.
- [x] Wire verifier vào `check:repository` hoặc root `quality` without network/native artifact.
- [x] Document review rule: existing lock rows không được update sau release.

**Blocks:** `T03`, `T08`, `T10`.

### T03 — Normalize `001` thành production registry descriptor

**Outcome:** Runner consume exact artifact mà không duplicate DDL/seed hoặc nested transaction.

- [x] Preserve exact schema/seed behavior đã pass `US-02-02`.
- [x] Expose descriptor apply/context seam phù hợp registry.
- [x] Import checksum/name/path từ exact lock/registry contract.
- [x] Ensure `001` apply runs qua supplied executor, không gọi transaction wrapper.
- [x] Keep standalone `applyInitialSchema` only if diagnostic/tests still need it and no duplicate logic.
- [x] Re-run `US-02-02` host contract tests to prove no schema regression.
- [x] Recompute/lock final `001` canonical checksum only after refactor review.

**Blocks:** `T05`, `T06`, `T08`.

### T04 — Implement history classification và preflight validator

**Outcome:** Invalid database/registry fail trước mutation.

- [x] Inspect empty vs history-present vs ambiguous non-empty database.
- [x] Read `schema_migrations` ordered with bound/static trusted SQL internal only.
- [x] Validate exact contiguous prefix, name và checksum.
- [x] Detect gap, unknown, malformed history và newer schema.
- [x] Return latest/pending plan without applying anything.
- [x] Prove every preflight failure opens zero write transaction and preserves full DB fingerprint.

**Blocks:** `T05`, `T06`, `T07`.

### T05 — Implement ordered per-migration runner

**Outcome:** Pending migration và its history row commit/rollback atomically.

- [x] Apply pending suffix ascending.
- [x] Capture Clock/ID only when required by pending descriptor.
- [x] Recheck expected durable predecessor inside transaction.
- [x] Call descriptor apply/validation then bound history insert.
- [x] Stop on first failure; do not run later migration.
- [x] Map apply/history/transaction failures typed, no raw provider detail.
- [x] Return minimal summary, không publish readiness/repository capability.

**Blocks:** `T06`, `T07`, `T08`.

### T06 — Complete host migration matrix

**Outcome:** Deterministic tests cover all acceptance branches without second SQLite driver.

- [x] Empty → `001` → exact one history row.
- [x] Latest rerun: no DDL/seed/history write; ID port not called.
- [x] Synthetic `001 → 002 → 003` ordered apply.
- [x] Duplicate registry version/name, registry gap và invalid checksum fail pre-DB.
- [x] Non-empty/no-history và product-schema/empty-history fail no-adoption.
- [x] History gap/unknown/name mismatch/checksum mismatch/newer binary failure.
- [x] Apply failure, validation failure, history insert failure and rollback failure mapping.
- [x] Synthetic `002` fail after partial writes: all `002` writes/history rollback, `001` retained.
- [x] Retry starts from exact durable predecessor and succeeds once; no duplicate seed/catalog.
- [x] Full before/after fingerprint for failure cases, không assert error message-only.

**Blocks:** `T07`, `T08`, `T10`.

### T07 — Architecture/scope integration checks

**Outcome:** Migration capability usable by future bootstrap nhưng không leak/cross scope.

- [x] Application port/result/error không import SQL/SQLite/Node crypto.
- [x] SQL/registry implementation chỉ ở database Infrastructure.
- [x] Production source không import synthetic fixture/probe.
- [x] No `PRAGMA user_version`, AsyncStorage/Zustand schema truth hoặc second driver.
- [x] No production bootstrap/readiness/recovery/reset/repository behavior.
- [x] Boundary/repository checks cover new files.

**Blocks:** `T08`, `T10`.

### T08 — Implement exact Expo SQLite migration probe

**Outcome:** Exact packaged SQLite xác nhận history, ordering, rollback và retry semantics.

- [x] Dev-only explicit flag; lazy import from composition diagnostics only.
- [x] Use exact production `001`/runner/registry/lock; không copy production logic.
- [x] Use exact isolated database names; never open/delete `pixeldoro.db`.
- [x] Empty → latest, exact history row/checksum và no-op rerun.
- [x] Synthetic upgrade order on test registry without production schema `002`.
- [x] Checksum/gap/unknown/newer/missing-history cases reject before unsafe write.
- [x] Inject apply/history failure, compare full fingerprint, close/reopen, then Retry success.
- [x] Structured report: platform/OS/app/package/commit SHA + named assertions.
- [x] `passed: true` only after all connections close and exact probe DB cleanup.
- [x] Add owner manual runbook; one native target for Story, both platforms at `US-02-09`.

Agent không chạy native/EAS build.

**Blocks:** `T09`, `T10`.

### T09 — Owner native runtime evidence

**Outcome:** One exact Expo runtime report trace được về final implementation commit.

- [x] Owner commit implementation và truyền `git rev-parse HEAD` vào probe flag.
- [x] Owner chạy existing development build trên iOS.
- [x] Capture complete structured report; device model không được cung cấp.
- [x] Verify report `passed: true`, `10/10` assertions và SHA khớp repository.
- [x] Exact probe DB cleanup được report; stop Metro/unset flag là owner local hygiene,
  không phải repository acceptance.

**Blocks:** `T10` Story closeout.

### T10 — Quality, evidence và handoff closeout

**Outcome:** `US-02-03 DONE` và `US-02-04` nhận migration-compatible boundary ổn định.

- [x] Run pinned Node/pnpm typecheck/lint/test/boundary/repository checksum checks.
- [x] Run Expo public-config check không tạo native artifact; SDK 57 và `expo-sqlite` resolve.
- [x] Review diff/source lock và no-scope-creep audit.
- [x] Record host/failure/native evidence trong `EPIC-02_IMPLEMENTATION_EVIDENCE.md`.
- [x] Mark every Story acceptance after exact evidence review.
- [x] Confirm no DB/native output/secret/machine-local path trong implementation working tree.
- [x] Mark `US-02-03 DONE`; mở `US-02-04` dependency gate, không active song song.

## 6. Implemented file impact

Exact filenames có thể refine khi implement nếu vẫn giữ ownership và được review.

### 6.1. Files đã tạo

| File/khu vực | Mục đích |
|---|---|
| `apps/mobile/src/application/ports/migration.port.ts` | Application-owned result/error/port, no SQL/provider type. |
| `apps/mobile/src/infrastructure/database/migrations/migration-descriptor.ts` | Internal descriptor/context contract. |
| `apps/mobile/src/infrastructure/database/migrations/migration-lock.json` | Append-only production source set/checksum metadata. |
| `apps/mobile/src/infrastructure/database/migrations/migration-registry.ts` | Exact production ordered registry. |
| `apps/mobile/src/infrastructure/database/migration-runner.ts` | History preflight và ordered transactional apply. |
| `apps/mobile/src/infrastructure/database/migration-runner.test.ts` | Host registry/history/apply/failure/retry matrix. |
| `scripts/validate-migrations.mjs` | Canonical SHA-256 recompute và lock/naming/source audit. |
| `scripts/validate-migrations.test.ts` | Positive/source-tamper/lock-tamper integrity matrix. |
| `apps/mobile/src/composition/diagnostics/run-forward-migration-probe.ts` | Dev-only exact Expo migration probe; synthetic descriptors chỉ nằm trong diagnostic scope. |
| `apps/mobile/test/device/forward-migration-smoke.md` | Owner runbook và expected report. |

### 6.2. Files đã cập nhật

| File/khu vực | Mục đích |
|---|---|
| `001_initial-schema.migration.ts` | Không sửa; registry adapter reuse exact artifact đã pass `US-02-02`. |
| Application/index exports | Export migration port/result/error only. |
| Host migration test fake | Stateful test-local DB fingerprint/fault injection; production fake không đổi. |
| Composition root | Chỉ add dev-only probe flag; chưa production migration bootstrap. |
| Root scripts / repository validator | Add immutable migration check vào quality gate. |
| Device harness validator | Validate migration runbook/report contract. |
| `EPIC-02_IMPLEMENTATION_EVIDENCE.md` | Host/native evidence và SHA trace. |
| `EPIC-02_USER_STORIES.md` | Status/checklist chỉ sau evidence review. |

### 6.3. Forbidden impact

- Production `002` hoặc schema/product field ngoài Data Model `1.0.0`.
- `src/presentation/**`, route UI, Zustand readiness/recovery store.
- Production repository/mapper hoặc Session/Reward/Purchase use case.
- `deleteDatabase`/reset/recreate fallback trong migration runner.
- Runtime Node `crypto`, additional crypto/SQLite package hoặc raw connection export.
- `ios/`, `android/`, `.db`, `.sqlite`, APK/AAB/IPA hoặc EAS output.

## 7. Acceptance-to-evidence trace

| Story acceptance | Primary Tasks | Required evidence |
|---|---|---|
| Strict filename/registry order | `T01–T03`, `T06` | Registry/lock manifest + invalid duplicate/gap/name tests. |
| Empty → exact `001` history | `T03`, `T05`, `T08` | Exact row compare after close/reopen. |
| Latest no reapply | `T04–T06`, `T08` | Zero apply/seed/history calls and unchanged fingerprint. |
| Ordered pending migrations | `T05`, `T06`, `T08` | Synthetic ordered call/history output. |
| Deterministic checksum/drift | `T00–T02`, `T04`, `T06` | Recompute script + runtime mismatch rejection. |
| Gap/duplicate/unknown | `T04`, `T06`, `T08` | Typed expected-failure + zero-write evidence. |
| Newer schema safe fail | `T04`, `T06`, `T08` | No product query/write/apply after detection. |
| Failed migration rollback | `T05`, `T06`, `T08` | Full before/after schema/data/history fingerprint. |
| Retry same DB | `T05`, `T06`, `T08` | Durable predecessor retained; failed version commits once on Retry. |
| No destructive fallback | `T04–T08`, `T10` | Driver call/source audit proves no delete/reset/recreate. |
| Synthetic upgrade only | `T06–T08`, `T10` | Test-only import/boundary audit. |
| Released artifact immutable | `T02`, `T10` | Quality command and append-only review evidence. |

## 8. Deterministic test matrix

### 8.1. Registry/lock cases

| Case | Expected |
|---|---|
| Exact production registry `[001]` | Valid latest `1`. |
| Empty registry | `MIGRATION_REGISTRY_INVALID`, no DB access. |
| Duplicate version/name/filename | Typed registry failure, no DB access. |
| Versions `[1,3]` | Registry gap failure, no DB access. |
| Invalid version/name/filename/checksum format | Registry failure. |
| Lock missing/unexpected migration source | Repository check fails. |
| One source byte/comment/SQL/catalog change | SHA mismatch until reviewed lock action; quality fails. |
| Timestamp/absolute checkout/build output change | Không thuộc canonical input; checksum stable. |

### 8.2. Durable history cases

| Database state | Expected |
|---|---|
| Exact empty user DB | Apply `001`, one exact row. |
| Latest exact history `001` | No-op success, no seed/DDL/history write. |
| Non-empty, no history table | Missing-history typed failure, unchanged. |
| Product schema + empty history | Missing/invalid-history failure; không adopt `001`. |
| History starts at `2` hoặc `1,3` | Version-gap failure. |
| Known version, wrong name | Unknown/identity failure. |
| Known version/name, wrong checksum | Checksum mismatch. |
| Applied version greater binary latest | Newer-schema failure before product query/write. |
| Malformed/unreadable history table | History-invalid/read failure, unchanged. |

### 8.3. Apply/rollback/retry cases

| Case | Expected |
|---|---|
| `001` apply success, history success | Schema/seed/history atomic commit. |
| `001` DDL/seed/validation/history insert fail | Empty DB remains without partial user schema/history. |
| Synthetic `002` success then `003` success | Ascending apply/history. |
| Synthetic `002` writes then throws | `002` row/schema/data rollback; previous version retained. |
| History insert throws after apply | Apply changes rollback with missing history row. |
| Commit/rollback failure | Stable transaction technical error; no fabricated success. |
| Retry after `002` failure | Starts after retained version, commits `002` once. |
| Later migration after current fail | Not invoked. |
| Overlap | Deterministic busy/technical result; no duplicate history. |

## 9. Verification commands và native boundary

Automated closeout dùng toolchain pin:

```sh
pnpm --filter @pixeldoro/mobile typecheck
pnpm --filter @pixeldoro/mobile lint
pnpm test
pnpm test:boundaries
pnpm check:repository
pnpm quality
```

Migration integrity validator phải chạy trong root quality/repository gate. Expo
dependency/config/doctor check chỉ chạy nếu không tạo native artifact. Không chạy
`expo run:*`, prebuild, local EAS build hoặc native compilation trong agent turn.

Native probe sau implementation phải report tối thiểu:

```text
probe = US-02-03_FORWARD_MIGRATION
passed = true
platform / osVersion / appVersion / commitSha
assertions:
  empty_database_migrated_to_latest
  exact_history_committed_after_validation
  latest_rerun_was_noop
  synthetic_upgrade_applied_in_order
  incompatible_history_rejected_before_write
  failed_migration_rolled_back_without_false_history
  failed_history_write_rolled_back_without_false_history
  retry_resumed_from_valid_durable_history
  committed_history_survived_reopen
  probe_connections_closed_and_databases_cleaned
```

## 10. Risk register

| Risk | Mitigation | Stop condition |
|---|---|---|
| Hash không bao phủ transitive seed/manifest | Exact source set + lock validator. | Migration behavior import file ngoài source set. |
| Hash self-reference/runtime instability | Separate lock, no runtime recompute, canonical LF/length-prefix input. | Checksum đổi theo checkout/build/runtime. |
| Update lock cùng migration che released drift | Append-only review rule + visible lock diff. | Existing released entry bị sửa không có incident approval. |
| Nested transaction khi runner gọi wrapper `001` | Call descriptor apply on runner executor. | `TRANSACTION_BUSY` hoặc history ngoài schema transaction. |
| Batch failure rollback quá rộng/hẹp | One transaction per migration, explicit checkpoint evidence. | Previous valid version mất hoặc failed version còn partial. |
| Latest rerun gọi seed `001` | History preflight determines pending suffix. | Any seed/DDL call on latest DB. |
| Auto-adopt che partial schema | Non-empty/missing history typed fail. | Runner inserts history without executing trusted migration. |
| Older binary queries newer schema | Newer check before product access; no bootstrap wiring yet. | Any product query/write after newer detection. |
| Synthetic fixture lọt production | Test-only path/import boundary. | Production registry contains version `002` in Story này. |
| Scope creep sang recovery/bootstrap | No UI/readiness/reset; typed port only. | Presentation/repository/reset behavior appears. |

## 11. Rollback và recovery của implementation change

- Trước khi runner được wire ở `US-02-04`, toàn `US-02-03` implementation có thể revert như
  một Story mà không mở/migrate production `pixeldoro.db`.
- Không rollback user schema bằng down migration hoặc `deleteDatabase`.
- Nếu native behavior fail, giữ Story `IN_PROGRESS`/`BLOCKED_FOR_TECH_REVIEW`, sửa plan/code
  và rerun exact probe database; không làm yếu history/checksum invariant.
- Khi `001` lock được release, migration source set và lock entry là immutable; mọi schema
  thay đổi đi qua forward migration mới.

## 12. Definition of Done cho `US-02-03`

- [x] `T00 → T10` hoàn tất theo order.
- [x] `EPIC02-INPUT-02` được owner resolve và sync vào Story baseline ngày 2026-08-28.
- [x] Production registry/lock chỉ chứa exact released `001`, valid contiguous metadata.
- [x] Empty → latest và latest no-op pass với exact history/checksum evidence.
- [x] Ordered synthetic upgrade pass mà không tạo production schema `002`.
- [x] Gap/duplicate/unknown/name/checksum/newer/missing-history cases fail typed trước unsafe write.
- [x] Failed migration/history insert rollback full version unit; previous durable version retained.
- [x] Retry same database commits failed version đúng một lần, không duplicate seed/catalog.
- [x] Immutable migration checksum check nằm trong repository quality gate.
- [x] Native Expo SQLite probe pass trên iOS và exact implementation SHA.
- [x] Không auto-adopt/downgrade/reset/delete/recreate/repair database.
- [x] Không production bootstrap/repository/Product behavior scope creep.
- [x] Application/Presentation không import SQL/SQLite/Node crypto/provider type.
- [x] Không có DB/native artifact/secret/machine-local path trong implementation working tree.
- [x] Evidence được owner/reviewer chấp nhận; `US-02-03 DONE` trước khi active `US-02-04`.

## 13. Owner confirmations cần chốt

| ID | Proposal | Status | Blocks |
|---|---|---|---|
| `US0203-CONFIRM-01` / `EPIC02-INPUT-02` | SHA-256 lowercase trên canonical ordered source set, LF/length-prefix encoding; separate append-only lock; host recompute, runtime compare committed checksum. `001` source set gồm migration file + schema manifest. | `APPROVED 2026-08-28` | Đã mở `T02`, `T03` và checksum acceptance. |
| `US0203-CONFIRM-02` | Preflight all; one transaction per migration gồm apply/validate/history. Previous migration commit được giữ nếu later migration fail; Retry resume từ durable prefix. | `APPROVED 2026-08-28` | Đã mở `T05` và rollback/retry acceptance. |
| `US0203-CONFIRM-03` | Chỉ empty DB hoặc exact contiguous history được migrate. Non-empty/missing hoặc empty history không auto-adopt/backfill/reset; fail typed, preserve DB. | `APPROVED 2026-08-28` | Đã mở `T04` và compatibility acceptance. |

Các confirmation này là technical migration policy, không quyết định Product `OPEN-001`,
`OPEN-006` hoặc `OPEN-009` và không cho phép thêm future schema.

## 14. Handoff sang `US-02-04`

Khi Story `DONE`, handoff gồm:

- Application-owned migration port/result/error contract.
- Immutable production registry và lock/checksum verifier.
- Runner trả migration-compatible summary nhưng không tự publish readiness.
- Exact behavior cho empty/latest/pending/incompatible/failure/retry.
- Final host/native evidence và implementation SHA.
- Explicit remaining boundary: `US-02-04` mới wire open → migrate → verify → hydrate →
  reconciliation fake → ready; `US-02-07` mới tạo user-facing recovery/Retry projection.

## 15. References

- [EPIC-02 User Stories](./EPIC-02_USER_STORIES.md)
- [US-02-02 Implementation Plan](./US-02-02_IMPLEMENTATION_PLAN.md)
- [EPIC-02 Implementation Evidence](./EPIC-02_IMPLEMENTATION_EVIDENCE.md)
- [MVP Epic Plan](./MVP_EPICS.md)
- [Product Core Truth](../PIXELDORO_CORE_TRUTH.md)
- [Data Model](../architecture/data-model.md)
- [System Architecture](../architecture/system-architecture.md)
- [Project Structure](../architecture/project-structure.md)
- [Technical Overview](../architecture/technical-overview.md)
- [ADR-003 — State and Persistence](../architecture/decisions/ADR-003-state-and-persistence.md)
- [ADR-007 — EAS Delivery Pipeline](../architecture/decisions/ADR-007-eas-delivery-pipeline.md)

## 16. Change log

### 0.5.0 — 2026-08-28

- Tiếp nhận exact iOS report `US-02-03_FORWARD_MIGRATION` `passed: true`, đủ `10/10`
  assertions trên SHA `1b6a0427b3db20f4536a2b251101fa0e32b5c0ea` khớp repository `HEAD`.
- Re-run `pnpm quality`: `11` files / `53` tests cùng boundary/checksum gates pass.
- Chuyển `US-02-03` sang `DONE` và mở dependency gate `US-02-04`; không triển khai Story sau
  trong closeout này.

### 0.4.0 — 2026-08-28

- Implement canonical checksum lock/validator, production registry, typed migration port,
  history preflight và per-migration transactional runner.
- Host matrix pass cho order/latest, invalid registry/history, checksum/gap/newer schema,
  rollback/history-write failure và same-database retry.
- Implement dev-only exact Expo probe/runbook; chuyển implementation sang
  `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`, chưa `DONE` và chưa mở `US-02-04`.

### 0.3.0 — 2026-08-28

- Ghi nhận owner duyệt `US0203-CONFIRM-02` và `US0203-CONFIRM-03`.
- Khóa one-transaction-per-migration checkpoint/retry và missing-history no-auto-adoption.
- Chuyển plan sang `READY_FOR_IMPLEMENTATION`; implementation bắt đầu ở `IN_PROGRESS` và
  tiếp tục giữ production bootstrap `US-02-04` ngoài scope.

### 0.2.0 — 2026-08-28

- Ghi nhận owner duyệt `US0203-CONFIRM-01` và resolve `EPIC02-INPUT-02`.
- Khóa SHA-256 canonical ordered source set, append-only lock, host recompute và runtime
  committed-checksum comparison.
- Giữ `US0203-CONFIRM-02`/`03` chờ owner; plan chưa chuyển
  `READY_FOR_IMPLEMENTATION`.

### 0.1.0 — 2026-08-28

- Tạo implementation plan đầu tiên sau khi `US-02-02 DONE`.
- Đề xuất exact checksum/source-lock, per-migration transaction checkpoint và no-adoption
  semantics; giữ cả ba ở `PENDING_OWNER`.
- Chia execution `T00 → T10` cho solo developer, bao phủ registry/history/checksum,
  rollback/retry, immutable artifact quality gate và exact Expo runtime probe.
- Không wire production bootstrap, không tạo production `002`, repository/Product behavior
  hoặc native/EAS artifact.
