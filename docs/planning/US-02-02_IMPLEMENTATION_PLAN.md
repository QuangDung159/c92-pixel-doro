---
document_id: PIXELDORO_US_02_02_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-02-02 Implementation Plan
version: 1.2.0
status: DONE
implementation_status: DONE
last_updated: 2026-08-28
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
reviewed_at: 2026-08-28
approved_by: Dũng Lư
approver_role: Tech Lead/Product Owner
approved_at: 2026-08-28
language: vi
scope:
  - mobile_mvp
  - epic_02
  - us_02_02
  - normative_schema
  - constraints
  - exact_seed
authority: PLANNING
story_baseline: ./EPIC-02_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
timer_engine_baseline: ../specifications/timer-engine.md
session_lifecycle_baseline: ../specifications/session-lifecycle.md
gamification_baseline: ../specifications/gamification-rules.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-02-02 — Normative Schema, Constraints và Exact Seed

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan cho `US-02-02` thuộc
`EPIC-02 — Durable Local Data, Migration và Safe Bootstrap`.

**Story outcome:** Một empty SQLite database có thể nhận initial schema artifact tạo đúng
11 table normative, toàn bộ field/check/FK/unique/index/trigger bắt buộc và exact initial
seed của Data Model `1.0.0`; invalid durable shapes bị database reject mà không cần Product
use case hoặc UI.

**Dependencies:** `US-02-01 DONE` — đã đạt trên commit
`a75ecc9112c2aa279bee9a818d9c97e586b84b21`.

**Story priority:** `MUST` / `P0_CORRECTNESS` / execution order `02` trong EPIC-02.

**Blocks:** dependency gate sang `US-02-03` đã mở ngày 2026-08-28. Migration registry/runner
nhận exact reviewed artifact; `EPIC02-INPUT-02` vẫn là gate riêng của Story sau.

**Planning status:** `DONE`. **Implementation status:** `DONE`.

Production schema artifact, host contract tests và dev-only probe đã được implement. Owner
native iOS report `passed: true` đã được đối chiếu với exact final implementation commit
`4996c7d6529d0a1578e2d052bdbaaf858d9e1a1d`.

### 0.1. Implementation checkpoint — 2026-08-28

- `T00` đến `T07` hoàn tất; host quality pass với `8` test files / `32` tests.
- Production artifact tạo exact 11 tables, 86 columns, 11 FK rows, 14 named indexes,
  6 named triggers và 12 catalog rows trong một transaction.
- DDL parse và exact column/FK manifest được đối chiếu thêm bằng host SQLite `3.51.0`;
  package `expo-sqlite 57.0.2` vendor SQLite `3.50.3`.
- `T08` native iOS probe pass đủ `11/11` named assertions trên iOS `26.5`, app `0.1.0`;
  schema/seed/negative writes/reopen/injected rollback/cleanup đều được xác nhận.
- `T09` evidence closeout hoàn tất; `US-02-03` dependency gate đã mở nhưng Story sau chưa
  tự active và vẫn giữ `EPIC02-INPUT-02` riêng.

### 0.2. Readiness gate hiện tại

- [x] `US-02-01` đã `DONE`; SQLite owner, same-connection transaction và parameter binding có evidence.
- [x] Data Model `1.0.0` đã `APPROVED`; `DM-OPEN-001` đến `DM-OPEN-007` đều `RESOLVED`.
- [x] Product `OPEN-001`, `OPEN-006`, `OPEN-009` có explicit exclusion khỏi schema.
- [x] Không có migration/schema implementation đang active song song.
- [x] Tech Lead duyệt các technical direction ở mục 3 ngày 2026-08-28 qua ba owner confirmations.
- [x] `EPIC02-INPUT-03` đã được Dũng Lư resolve ngày 2026-08-28 theo TD-02-02-G.
- [x] Plan chuyển `READY_FOR_IMPLEMENTATION` sau khi ba owner confirmations được duyệt.

`EPIC02-INPUT-03` đã được resolve: trigger chặn receipt `UPDATE`; normal repository không
có update/delete; chỉ private maintenance executor hoặc approved migration được xóa theo
explicit transaction/order, không dùng durable bypass state.

## 1. Baseline và current-state review

### 1.1. Baseline bắt buộc

| Authority | Contract áp dụng cho `US-02-02` |
|---|---|
| `EPIC-02_USER_STORIES.md` | 11 table, exact constraints/indexes/triggers/seed, negative writes và no-scope-creep acceptance. |
| Data Model §1–5 | Entity/field/type/null/default/check, enum, FK, unique, index và trigger normative. |
| Data Model §6, §8.2 | Economy consistency backstop, initial migration gate và exact seed rules. |
| Data Model §12–14 | Resolved decisions, edge cases, deterministic test matrix và implementation acceptance. |
| Product Core §5–9, §14, §20 | Four statuses, onboarding trial, reward/catalog/reset boundary và Product decisions còn `OPEN`. |
| Timer Engine §2–5, §9 | Timestamp/four-status/terminal/reward idempotency invariants; không triển khai timer behavior tại Story này. |
| Session Lifecycle §2–5 | Focus/Break/trial durable shapes; không triển khai lifecycle orchestration tại Story này. |
| Gamification Rules §2–8 | Reward formula, exact catalog và economy relationship dùng làm schema backstop. |
| System Architecture §3, §5–6 | SQL chỉ ở Infrastructure; short transaction; database barrier trước Presentation command. |
| Project Structure §4–5, §7 | Migration dưới mobile database Infrastructure; integration evidence không nằm trong screen/route. |
| ADR-003, ADR-004 | SQLite là durable truth; Domain/Application không import SQLite hoặc raw SQL. |

### 1.2. Repository hiện tại sau `US-02-01`

| Khu vực | Current state | Hệ quả cho plan |
|---|---|---|
| SQLite ownership | `SQLiteDatabaseOwner` mở một connection, verify FK và quản lý lease/close. | Reuse owner; không mở connection riêng cho migration/schema. |
| Transaction | `SQLiteTransaction` dùng `BEGIN IMMEDIATE` trên owner connection và opaque `TransactionScope`. | Schema apply/seed phải chạy qua cùng transaction kernel hoặc seam nội bộ tương đương. |
| Executor | `SQLiteExecutor` có bound `run/getFirst/getAll`; control SQL còn private trong transaction/owner. | Chỉ mở rộng internal static-DDL capability tối thiểu; không export raw connection. |
| Driver | `ExpoSQLiteDriver`; không có driver SQLite thứ hai cho Node. | Host test orchestration/manifest; exact SQL behavior cần Expo native probe. |
| Bootstrap | Chỉ open/verify database; chưa chạy migration. | Không wire artifact vào production bootstrap trong Story này. |
| Schema/migration | Chưa có `migrations/`, table product hoặc migration registry. | Story tạo initial artifact; runner/history/checksum thuộc `US-02-03`. |
| Product repositories | Chưa có. | Không tạo repository/use case sớm chỉ để test schema. |
| Test harness | Có dev-only exact SQLite kernel probe trên DB riêng. | Tạo schema probe riêng hoặc extension tách biệt, reuse production artifact. |

### 1.3. Findings ảnh hưởng thiết kế

1. `schema_migrations` là một trong 11 table normative, nhưng việc ghi applied row, checksum,
   version-gap và reapply semantics thuộc `US-02-03`. `US-02-02` tạo table nhưng không giả
   migration runner hoặc tự ghi history.
2. `CREATE TABLE IF NOT EXISTS` và upsert seed có thể che partial schema/drift. Initial artifact
   chỉ áp dụng lên empty database; repeated-run/idempotency do runner xác định ở Story sau.
3. Cross-table reward validity không biểu diễn đủ bằng `CHECK`; required trigger phải đọc
   completed Focus row và so reason/delta/profile.
4. SQLite trigger không biết caller là “normal repository” hay “confirmed reset”. Vì vậy
   `EPIC02-INPUT-03` đã khóa delete authority ở private maintenance/migration boundary và cấm
   bypass flag/table bền vững để lách trigger.
5. Seed timestamp và anonymous installation ID là input do Application cung cấp. SQL không
   được gọi `CURRENT_TIMESTAMP`, tự sinh random ID hoặc phụ thuộc wall clock native.
6. Exact table/index/trigger name chưa đủ evidence; cần behavior test cho invalid writes và
   durable rows trước/sau failure.
7. Constraint fixture dùng session/reward/purchase shapes nhưng không được trở thành Product
   use case, repository contract hoặc orchestration behavior của Epic sau.
8. Native probe cần database filename riêng, exact cleanup và explicit dev flag; không chạy
   trên `pixeldoro.db` và không thêm diagnostics screen/route.

## 2. Scope khóa cho implementation

### 2.1. In scope

- Initial migration/schema artifact tại mobile database Infrastructure theo naming baseline.
- 11 table normative:
  - `app_installation`
  - `app_settings`
  - `pet_profiles`
  - `sessions`
  - `reward_transactions`
  - `catalog_items`
  - `purchase_transactions`
  - `owned_items`
  - `store_review_attempts`
  - `analytics_events`
  - `schema_migrations`
- Exact column type, nullability, default, PK, FK, unique và database-checkable constraint.
- Required 14-index set và 6-trigger/backstop set trong Data Model §5.
- Product FK `ON DELETE RESTRICT` và composite ownership/reward relationship.
- Exact singleton/settings/profile/catalog seed với deterministic input timestamp/ID.
- Static schema manifest/descriptor dùng cho inspection và exact expected-surface tests.
- Valid fixtures cho mỗi durable shape và negative fixtures cho required invariant.
- Native Expo SQLite schema probe trên database riêng, reuse production artifact.
- Evidence mapping tới từng acceptance criterion của `US-02-02`.

### 2.2. Out of scope

- Migration registry/runner, canonical checksum algorithm, applied-history validation,
  version gap, downgrade/newer-schema handling — `US-02-03`.
- Production bootstrap migration/readiness/retry wiring — `US-02-04`.
- Session/Settings/Pet/Reward/Catalog/Purchase/OwnedItem repository adapters — `US-02-05`.
- History/contribution/cadence/store-review query adapters — `US-02-06`.
- Recovery UI, automatic repair hoặc destructive fallback — `US-02-07`.
- Confirmed reset executor và maintenance orchestration — `US-02-08`.
- Both-platform final evidence — `US-02-09`.
- Start/complete/cancel/reconcile Session, reward grant, purchase/equip hoặc analytics queue
  production behavior.
- ORM/query builder, alternate SQLite driver, React SQLite context hoặc generic schema framework.
- Pet species/name/stage/skin, contribution color/intensity, `paused`, cloud/sync IDs,
  dynamic pricing, refund, quantity, rarity hoặc deferred feature.
- Native/EAS build hoặc committed native artifact trong implementation turn.

## 3. Technical directions đã duyệt

Các direction dưới chỉ chi tiết hóa baseline và đã được Dũng Lư duyệt ngày 2026-08-28
qua chuỗi ba owner confirmations của Story.

### TD-02-02-A — Một production initial artifact; runner tách sang `US-02-03`

**Direction:** Tạo một artifact theo naming convention, dự kiến:

```text
apps/mobile/src/infrastructure/database/migrations/
  001_initial-schema.migration.ts
```

Artifact chứa stable `version = 1`, stable name, ordered static DDL và deterministic seed
operation. `US-02-02` có schema applicator nội bộ cho test/probe; `US-02-03` mới tạo registry,
checksum và ghi `schema_migrations` row.

- Không có duplicate schema string trong test harness.
- Không ghi version/checksum placeholder vào history.
- Không dùng `PRAGMA user_version` làm writable truth thứ hai.
- Không wire initial artifact vào production bootstrap ở Story này.
- Artifact trở thành immutable sau khi migration runner/evidence được release; trước đó mọi
  refinement vẫn phải giữ Data Model `1.0.0` và review diff.

**Status:** `APPROVED` — Dũng Lư duyệt ngày 2026-08-28. `US-02-02` sở hữu production
artifact `001` và empty-database applicator/probe; `US-02-03` sở hữu registry, checksum,
history, no-reapply và compatibility behavior.

### TD-02-02-B — Static DDL và bound seed trên same-connection transaction

**Direction:** Mở rộng database-internal executor bằng capability hẹp:

```text
executeStatic(statementOwnedByMigration)
run(statementOwnedByMigration, boundParameters)
getFirst/getAll(..., boundParameters)
```

- DDL/index/trigger SQL là literal/static payload do migration sở hữu.
- Seed value, timestamp và ID luôn đi qua bound parameters.
- Toàn initial schema + seed chạy trong một `BEGIN IMMEDIATE` transaction trên owner connection.
- Failure ở bất kỳ DDL/seed/validation step nào rollback; không publish partial success.
- Raw connection/executor không export khỏi database Infrastructure.

Không thêm generic public `executeSql(string)` vào Application hoặc facade.

**Status:** `APPROVED` — 2026-08-28.

### TD-02-02-C — Empty-database precondition; không che drift bằng idempotent DDL

**Direction:** Initial artifact có precondition database product schema rỗng. Không dùng
`IF NOT EXISTS`, `INSERT OR IGNORE` hoặc upsert để biến partial/mismatched schema thành success.

Schema probe có hai cases:

1. Empty DB apply thành công và cho exact surface/seed.
2. Reapply trực tiếp không được báo success giả; exact idempotency/no-reapply thuộc runner
   `US-02-03` dựa trên validated history.

**Status:** `APPROVED` — 2026-08-28.

### TD-02-02-D — Deterministic seed inputs do caller cung cấp

**Direction:** Artifact nhận immutable seed input tối thiểu:

```ts
interface InitialSeedInput {
  readonly timestamp: number;
  readonly anonymousAnalyticsId: string;
}
```

- Một valid Unix epoch-ms `timestamp` dùng nhất quán cho installation/settings/profile và
  catalog `created_at`/`updated_at`.
- Native/host fixture truyền timestamp cố định để exact-compare.
- Production caller tương lai lấy timestamp từ `ClockPort`; không dùng SQLite
  `CURRENT_TIMESTAMP`.
- Initial production anonymous ID bắt buộc non-empty và do Application/`IdPort` tạo;
  schema artifact không tự random. Nullable contract được giữ cho privacy/reset flow.
- `onboarding_completed_at` seed `NULL`; no session/reward/purchase/owned/review/analytics row.

Việc production bootstrap tạo anonymous ID ở phase nào thuộc adapter/bootstrap integration;
Story này chỉ bảo đảm initial seed lưu đúng non-empty bound input. Database column vẫn
nullable cho privacy/reset flow thuộc Story sau.

**Status:** `APPROVED` — Dũng Lư duyệt ngày 2026-08-28. Initial production seed nhận
timestamp từ `ClockPort` và non-empty anonymous ID từ `IdPort`; schema vẫn nullable cho
privacy/reset flow. Test dùng fixed inputs và SQL không tự đọc time/random.

### TD-02-02-E — Canonical schema manifest và normalized inspection

**Direction:** Test expected surface từ typed/static manifest cạnh migration artifact, gồm:

- Exact 11 table names và ordered column contract.
- PK, null/default/type/check expectations.
- Foreign keys cùng `ON DELETE RESTRICT`.
- Unique/composite constraints.
- Exact 14 index names/columns/partial predicates.
- Exact 6 trigger names và behavior ownership.
- Exact singleton/catalog seed manifest.

Verifier đọc `sqlite_master` và PRAGMA (`table_info`, `foreign_key_list`, `index_list`,
`index_info`/`index_xinfo`, `foreign_key_check`) rồi normalize whitespace/case chỉ khi so SQL
surface. Behavior acceptance không phụ thuộc snapshot string đơn thuần.

Manifest là test/verification contract, không phải Domain model hoặc repository API.

**Status:** `APPROVED` — 2026-08-28.

### TD-02-02-F — Database backstop không thay Product orchestration

**Direction:** Implement đúng required trigger/backstop set:

| Trigger | Story-owned behavior |
|---|---|
| `trg_sessions_terminal_immutable` | Terminal status không đổi/quay lại running. |
| `trg_sessions_identity_immutable` | Identity/config/start/deadline/local-day fields không đổi sau insert. |
| `trg_reward_insert_valid_session` | Chỉ completed Focus; profile/reason/delta khớp persisted session. |
| `trg_reward_immutable` | Mọi normal `UPDATE` bị abort; delete policy theo TD-02-02-G. |
| `trg_purchase_immutable` | Mọi normal `UPDATE` bị abort; delete policy theo TD-02-02-G. |
| `trg_owned_item_equip_consistency` | `is_equipped` và `equipped_at` luôn nhất quán. |

Trigger chỉ reject corruption/race shape. Trigger không:

- Tự complete/cancel/fail session.
- Tạo reward, update XP/Coin hoặc mua/equip item.
- Gọi provider/notification/analytics.
- Auto-repair ledger/balance hoặc xóa row.
- Thêm reward formula khác baseline.

**Status:** `APPROVED` — 2026-08-28.

### TD-02-02-G — Immutable receipt delete boundary

**Direction đã được duyệt để resolve `EPIC02-INPUT-03`:**

- `trg_reward_immutable` và `trg_purchase_immutable` chặn mọi `UPDATE`.
- Không tạo durable bypass flag, mutable maintenance table, magic connection setting hoặc
  provider-dependent trigger bypass.
- Normal repository ở `US-02-05` không có update/delete receipt method.
- Database owner không expose raw connection; normal adapter không nhận arbitrary SQL capability.
- `DELETE` chỉ xuất hiện trong private maintenance executor của `US-02-08`, yêu cầu
  maintenance scope nội bộ và explicit deletion order trong one transaction.
- Migration delete/backfill chỉ nằm trong reviewed immutable migration artifact.
- Architecture/static tests search normal repository source/API để chứng minh không có delete
  capability; integration test chứng minh confirmed maintenance order có thể xóa khi FK cho phép.

Lý do không dùng unconditional `BEFORE DELETE` trigger: SQLite không xác thực caller identity;
trigger đó cũng chặn chính confirmed reset/approved migration hoặc buộc thêm bypass state bền
vững ngoài normative schema.

**Status:** `APPROVED` — Dũng Lư duyệt ngày 2026-08-28; resolution này đồng thời resolve
`EPIC02-INPUT-03` cho `US-02-02` và làm baseline đầu vào cho `US-02-08`.

### TD-02-02-H — Exact SQLite evidence theo hybrid strategy đã duyệt

**Direction:** Kế thừa `EPIC02-INPUT-01`:

- Host tests: descriptor/manifest/seed input validation, statement order và failure orchestration
  bằng seam/fake hiện có.
- Expo native probe: exact DDL, PRAGMA inspection, seed comparison và negative writes trên
  `expo-sqlite 57.0.2`.
- Không thêm `better-sqlite3`, `sql.js`, SQLite WASM hoặc driver thứ hai.
- Probe dùng exact database riêng, dev-only flag, structured report và cleanup.
- Một native target pass đóng native gate Story này; iOS + Android repeat thuộc `US-02-09`.

**Status:** `APPROVED` — 2026-08-28; kế thừa `EPIC02-INPUT-01` đã approved.

## 4. Canonical schema contract cần implement

### 4.1. Table/column contract

Migration phải chuyển nguyên vẹn Data Model §4 thành SQLite DDL. Mỗi field được trace bằng
schema manifest với các thuộc tính:

```text
table
column
declared SQLite type
not-null
default expression hoặc no default
primary-key position
field/table CHECK ownership
reference target/on-delete action nếu có
```

Rules áp dụng toàn cục:

- Timestamp: integer Unix epoch ms, `0..8_640_000_000_000_000` khi non-null.
- Boolean: integer `0|1`.
- Enum: lowercase exact allowlist; không accept alias/unknown value.
- Coin/XP/duration/count: integer và bound đúng field.
- Session end arithmetic và conditional Focus/trial/Break shape đúng Data Model §4.4.
- Local date chỉ enforce stable storage shape ở SQLite; calendar validity do Application sau này.
- SQLite enforce `properties_json` là valid JSON object, non-null text và serialized payload
  tối đa `2 KiB`; `expires_at = occurred_at + 7 days`, state/count/time bounds cũng nằm ở schema.
- Event/property allowlist và tối đa 20 properties thuộc future typed analytics
  adapter/repository (`US-02-05/06`) trước insert. Đây là explicit owner-layer split; Story
  không thêm analytics delivery behavior.

Nếu một “Constraint/meaning” trong Data Model không thể hoặc không nên enforce bằng SQLite
`CHECK`/FK/index/required trigger, Task `T01` phải ghi rõ owner layer và evidence; không được
âm thầm bỏ hoặc thêm trigger normative ngoài review.

### 4.2. Relational contract

- Mọi product FK dùng `ON DELETE RESTRICT`; không dùng `CASCADE`/`SET NULL`.
- `sessions(profile_id)` → `pet_profiles(id)` và `UNIQUE(id, profile_id)`.
- `reward_transactions(session_id, profile_id)` → `sessions(id, profile_id)`;
  `session_id` unique.
- `purchase_transactions` unique `(profile_id, item_id)` và
  `(id, profile_id, item_id)`.
- `owned_items` composite PK `(profile_id, item_id)` và composite FK receipt/profile/item.
- Singleton tables chỉ nhận `id = 1`.
- `foreign_key_check` sau valid schema/seed không trả row.

### 4.3. Index contract

Exact required set từ Data Model §5.2:

1. `ux_sessions_one_running`
2. `ix_sessions_history`
3. `ix_sessions_local_day`
4. `ix_sessions_recent`
5. `ix_sessions_long_break_cadence`
6. `ix_sessions_strict_active`
7. `ux_reward_transactions_session`
8. `ix_reward_transactions_profile_time`
9. `ix_catalog_items_category_price`
10. `ux_purchase_profile_item`
11. `ix_owned_items_equipped`
12. `ix_store_review_attempt_time`
13. `ix_analytics_delivery`
14. `ix_analytics_expiry`

Test phải kiểm tra ordered columns, uniqueness và partial predicate; không chỉ kiểm tra tên.

### 4.4. Seed contract

Sau apply thành công trên empty database:

| Table | Exact initial result |
|---|---|
| `app_installation` | Một row `id=1`, input timestamp, onboarding `NULL`, bound anonymous ID/null. |
| `app_settings` | Một row: Focus `25`, Short `5`, Long `15`, mode `relax`, bốn preference `1`. |
| `pet_profiles` | Một row: `id=1`, XP `0`, Coin `0`. |
| `catalog_items` | Đúng 12 row/version `1`, exact ID/name/category/price theo Data Model §4.6. |
| `schema_migrations` | `0` row; history do runner `US-02-03` ghi sau validation. |
| Các table còn lại | `0` row. |

Không seed default owned item hoặc room/Pet presentation asset.

## 5. Authoritative execution plan cho solo developer

Chỉ một Task active tại một thời điểm. Mỗi Task pass host checks liên quan trước khi chuyển
Task sau. Không bắt đầu `US-02-03` khi `T09` chưa hoàn tất.

### T00 — Plan approval và decision gate

**Outcome:** Scope, artifact split, seed input và immutable-delete direction được Tech Lead duyệt.

- [x] Duyệt `TD-02-02-A` đến `TD-02-02-H` — approved 2026-08-28.
- [x] Resolve `US0202-CONFIRM-01`/`EPIC02-INPUT-03` — approved 2026-08-28.
- [x] Xác nhận seed timestamp/anonymous-ID direction — approved 2026-08-28.
- [x] Xác nhận `US-02-03` sở hữu registry/checksum/history apply semantics — approved 2026-08-28.
- [x] Xác nhận native probe do owner chạy thủ công, both-platform audit thuộc `US-02-09`.
- [x] Chuyển plan sang `READY_FOR_IMPLEMENTATION`; giữ `US-02-03 NOT_STARTED`.

**Blocks:** `T01` về authoritative decisions; không merge schema trước Task này.

### T01 — Freeze canonical schema inventory và acceptance matrix

**Outcome:** Mọi normative field/constraint/index/trigger/seed có một owner và test case.

- [x] Chuyển Data Model §4 thành exact 11-table/86-column manifest.
- [x] Chuyển §5.1 thành PK/FK/unique/composite relationship manifest.
- [x] Chuyển §5.2 thành exact 14-index manifest.
- [x] Chuyển §5.3 thành exact 6-trigger behavior matrix.
- [x] Ghi rõ rule nào thuộc SQLite và rule nào chỉ thuộc future Application/adapter.
- [x] Ghi exact catalog 12 rows và singleton seed manifest.
- [x] Audit không có Product `OPEN`/`DEFERRED` field.
- [x] Review table/constraint count với Data Model trước khi viết DDL.

**Blocks:** `T03`, `T04`, `T05`, `T06`, `T07`.

### T02 — Add migration-internal static executor và initial artifact shell

**Outcome:** Production artifact có thể thực thi static DDL + bound seed trong transaction
mà không rò raw connection hoặc tạo runner sớm.

- [x] Tạo `migrations/001_initial-schema.migration.ts`.
- [x] Thêm stable version/name metadata; chưa thêm checksum algorithm/history write.
- [x] Thêm migration-internal static statement executor trên same owner connection.
- [x] Giữ data value bắt buộc bound; không interpolate timestamp/ID/catalog text.
- [x] Thêm initial seed input validation trước transaction.
- [x] Không export migration executor qua Application/facade/Presentation.
- [x] Host test exact statement order và rollback on injected failure.
- [x] Architecture test chỉ database Infrastructure chứa SQL/driver import.

**Blocks:** `T03`, `T06`, `T08`.

### T03 — Implement 11 tables và field-level checks

**Outcome:** Empty database có đầy đủ table/column/default/check surface normative.

- [x] Implement singleton/settings/profile tables và timestamp/boolean/bound checks.
- [x] Implement `sessions` với exact enum và conditional Focus/trial/Break/status/reward shape.
- [x] Implement reward/catalog/purchase/owned-item tables.
- [x] Implement store-review/analytics/migration metadata tables.
- [x] Enforce JS-safe timestamp range cho mọi persisted timestamp phù hợp.
- [x] Enforce no-negative progression/balance, positive price/delta và exact duration bounds.
- [x] Enforce owned equip value/timestamp consistency ở table check.
- [x] Không thêm field/table ngoài Data Model `1.0.0`.
- [x] Host manifest test exact DDL inventory; native behavior deferred tới `T08`.

**Blocks:** `T04`, `T05`, `T06`, `T07`.

### T04 — Implement relational constraints và exact indexes

**Outcome:** SQLite enforce ownership/reference/uniqueness/one-running invariants.

- [x] Implement mọi PK/FK/unique/composite constraint ở mục 4.2.
- [x] Gắn `ON DELETE RESTRICT` cho mọi product FK.
- [x] Implement exact 14 indexes với ordered columns.
- [x] Implement partial predicates cho one-running và Strict-active index.
- [x] Không tạo redundant low-selectivity index ngoài normative set.
- [x] Tạo valid dependency fixture theo explicit insert order.
- [x] Tạo negative FK/unique/composite/second-running fixture.

**Blocks:** `T05`, `T07`, `T08`.

### T05 — Implement trigger/backstop và immutable receipt direction

**Outcome:** Terminal/identity/reward/receipt/equip corruption bị reject mà reset design vẫn
không cần durable bypass state.

- [x] `EPIC02-INPUT-03` đã được owner resolve trước implementation Task này.
- [x] Implement exact 6 required trigger names/behaviors.
- [x] Test terminal status mutation và identity/config mutation bị abort.
- [x] Test reward insert chỉ nhận completed Focus với matching profile/reason/delta.
- [x] Test reward/purchase update luôn bị abort.
- [x] Test equip consistency insert/update bị reject khi mismatch.
- [x] Ghi static boundary cho future normal repository không có receipt delete/update API.
- [x] Không implement confirmed reset executor hoặc migration delete behavior tại Story này.
- [x] Không thêm bypass flag/table/PRAGMA/provider-dependent caller identity.

**Blocks:** `T07`, `T08`, `T09`.

### T06 — Implement deterministic exact seed

**Outcome:** Empty database nhận singleton và 12-item catalog đúng baseline, không có row thừa.

- [x] Validate/inject one timestamp; không gọi SQLite/native current time.
- [x] Bind non-empty anonymous installation ID; schema vẫn nullable cho privacy/reset, không sinh random trong SQL.
- [x] Seed installation/settings/profile singleton đúng exact values.
- [x] Seed exact 12 catalog rows, catalog version `1` và exact Vietnamese display names.
- [x] Không seed owned item, session, receipt, review attempt, analytics event hoặc migration history.
- [x] Không seed Pet type/name/stage/skin/default catalog item.
- [x] Exact compare count + every field, không snapshot count-only.
- [x] Inject seed failure và chứng minh whole schema transaction rollback.

**Blocks:** `T07`, `T08`.

### T07 — Complete deterministic host contract tests

**Outcome:** Fast suite chứng minh artifact structure/orchestration trước native run.

- [x] Manifest parity: 11 tables, 86 columns, 11 FK rows, 14 indexes, 6 triggers, 12 seed rows.
- [x] Statement order: precondition → tables → indexes/triggers → seed → verification.
- [x] Bound-value test với quote/SQL-shaped anonymous-ID fixture seam.
- [x] Invalid seed input không mở transaction hoặc ghi partial state.
- [x] DDL/seed/verification failure rollback result được map ổn định trong Infrastructure.
- [x] Scope stale/overlap behavior vẫn kế thừa `US-02-01` tests.
- [x] Architecture boundary và no-second-driver checks pass.
- [x] Không test Product use case bằng fake repository trá hình.

**Blocks:** `T08`, `T09`.

### T08 — Run exact Expo SQLite schema/seed probe

**Outcome:** `expo-sqlite 57.0.2` thực sự enforce schema, trigger, seed và rollback contract.

Harness dev-only phải:

- [x] Dùng exact production `001` artifact; không copy/rewrite SQL trong probe.
- [x] Dùng hai exact database riêng: schema probe và injected-failure probe.
- [x] Harness delete stale exact probe DB trước run và cleanup exact filename sau close.
- [x] Harness apply artifact với deterministic timestamp/anonymous-ID fixture.
- [x] Inspect exact 11 tables, columns, defaults, FK, 14 indexes và 6 triggers.
- [x] Assert `PRAGMA foreign_key_check` empty trên valid seed.
- [x] Exact-compare singleton/profile/settings và all 12 catalog rows.
- [x] Run full negative-write matrix ở mục 8.
- [x] Reopen và verify committed schema/seed còn nguyên.
- [x] Inject one apply failure trên clean probe DB và verify không có partial durable schema/seed.
- [x] Structured report có platform, OS, app/package version, commit SHA và named assertions.
- [x] Report chỉ có thể trả `passed: true` sau cleanup thành công; không log raw row/free text/secret.
- [x] Owner chạy iOS `26.5`; iOS + Android repeat vẫn thuộc `US-02-09`.

Agent không chạy native/EAS build nếu không có yêu cầu mới rõ ràng.

**Blocks:** `T09`.

### T09 — Story verification và evidence closeout

**Outcome:** Mọi acceptance criterion có evidence traceable và `US-02-03` nhận artifact ổn định.

- [x] Chạy clean typecheck/lint/test/boundary validation bằng Node/pnpm version repo pin.
- [x] Chạy Expo dependency/config compatibility check không tạo native artifact.
- [x] Review diff không có repository/use case/bootstrap migration/Product behavior ngoài scope.
- [x] Ghi host evidence và native-pending gate vào `EPIC-02_IMPLEMENTATION_EVIDENCE.md`.
- [x] Link từng acceptance criterion tới host/native evidence requirement.
- [x] Xác nhận implementation diff/commit set không thêm probe DB, native artifact, secret hoặc machine-local path.
- [x] Mark `US-02-02` checklist sau khi owner evidence được đối chiếu exact SHA.
- [x] Chuyển `US-02-03` dependency gate sang ready-for-planning; chưa active Story sau.

## 6. File impact thực tế

Valid/negative SQL fixtures được giữ local trong dev-only probe thay vì tạo shared raw-SQL
test helper; cách này giảm surface có thể bị production caller dùng nhầm.

### 6.1. Files dự kiến tạo

| File/khu vực | Mục đích |
|---|---|
| `apps/mobile/src/infrastructure/database/migrations/001_initial-schema.migration.ts` | Production initial schema/seed artifact. |
| `apps/mobile/src/infrastructure/database/migrations/schema-manifest.ts` | Canonical expected table/index/trigger/seed surface. |
| `apps/mobile/src/infrastructure/database/migrations/001_initial-schema.migration.test.ts` | Host contract/order/failure tests. |
| `apps/mobile/src/composition/diagnostics/run-initial-schema-probe.ts` | Dev-only exact native schema probe. |
| `apps/mobile/test/device/initial-schema-smoke.md` | Owner native runbook và expected report. |

### 6.2. Files dự kiến cập nhật

| File/khu vực | Mục đích |
|---|---|
| `sqlite-executor.ts` | Internal static-DDL execution seam, không mở raw connection. |
| `create-mobile-application.ts` | Dev-only explicit probe flag; không production bootstrap migration. |
| Device harness validator | Validate schema runbook/report contract. |
| SQLite fake | Inject DDL/seed/read failure cho host rollback tests. |
| `EPIC-02_IMPLEMENTATION_EVIDENCE.md` | Host/native evidence và acceptance mapping ở `T09`. |
| `EPIC-02_USER_STORIES.md` | Chỉ cập nhật Story status/checklist sau evidence review. |

### 6.3. Files không được xuất hiện do scope creep

- Production Session/Reward/Purchase/Settings repository hoặc use case.
- Migration runner/registry/checksum/compatibility error của `US-02-03`.
- Bootstrap migration phase/readiness/recovery UI của `US-02-04/07`.
- Reset/maintenance executor production của `US-02-08`.
- Pet/Timer/History/Shop/Settings feature UI.
- `ios/`, `android/`, `.db`, `.sqlite`, EAS/native output hoặc second-driver dependency.

## 7. Acceptance-to-evidence trace matrix

| `US-02-02` acceptance | Primary Tasks | Required evidence |
|---|---|---|
| 11 table + exact column/check rules | `T01`, `T03`, `T08` | Manifest/PRAGMA inspection + invalid field writes. |
| Product FK `RESTRICT` và valid seed FK check | `T04`, `T08` | `foreign_key_list`, `foreign_key_check`, delete/insert negatives. |
| Four statuses + exact Focus/trial/Break shapes | `T03`, `T08` | Valid shape matrix + invalid enum/conditional rows. |
| One running session | `T04`, `T08` | Second insert rejected; first row unchanged. |
| Terminal/identity immutable | `T05`, `T08` | Update rejected; before/after row equal. |
| Reward validity/uniqueness/immutability | `T04`, `T05`, `T08` | Completed Focus positive path + invalid/duplicate/update negatives. |
| Purchase/ownership relationship | `T04`, `T08` | Composite mismatch/duplicate/equip negatives. |
| Singleton constraints | `T03`, `T06`, `T08` | Exact seed + `id != 1` rejected. |
| Exact settings/profile seed | `T06`, `T08` | Full row comparison with deterministic timestamp. |
| Exact 12-item catalog/no owned seed | `T06`, `T08` | Ordered per-field comparison and empty owned table. |
| No OPEN/DEFERRED field | `T01`, `T09` | Exact column inventory + source/diff audit. |
| Required indexes/triggers behavior | `T04`, `T05`, `T08` | PRAGMA/sqlite_master surface + behavior matrix. |
| Deterministic Application timestamp | `T02`, `T06`, `T08` | Bound fixed timestamp survives reopen; no `CURRENT_TIMESTAMP`. |
| No architecture leakage | `T02`, `T07`, `T09` | Boundary tests and import/source audit. |

## 8. Negative-write matrix bắt buộc

Mỗi case phải ghi durable state trước/sau; chỉ kiểm tra provider error text là không đủ.

| Case | Expected database result |
|---|---|
| Singleton `id = 2` | Reject; original singleton giữ nguyên. |
| Invalid setting duration/step/boolean/mode | Reject; settings seed giữ nguyên. |
| Negative XP/Coin hoặc invalid timestamp | Reject. |
| Unknown session status/type/mode/tag | Reject. |
| Standard Focus duration ngoài `15..120` hoặc không chia hết 5 | Reject. |
| Trial không phải 5/Relax/no-tag hoặc có Strict evidence | Reject. |
| Trial `failed` | Reject. |
| Break có mode/tag/focus variant/background/reward field | Reject. |
| Break sai duration hoặc `failed` | Reject. |
| Running row có terminal/reward fields | Reject. |
| Terminal row thiếu `resolved_at` | Reject. |
| Completed Focus delta/reward receipt fields không khớp duration | Reject. |
| `ends_at`/local date/offset invalid theo schema check | Reject. |
| Second `running` session | Reject; first running row giữ nguyên. |
| Terminal status đổi hoặc quay lại running | Trigger reject; original row giữ nguyên. |
| Identity/config/start/deadline/local-day update | Trigger reject. |
| FK tới profile/session/catalog không tồn tại | Reject. |
| Reward cho Break/running/failed/cancelled Focus | Trigger reject. |
| Reward profile/reason/delta mismatch | Trigger reject. |
| Duplicate reward theo session | Reject; đúng một receipt. |
| Reward/purchase `UPDATE` | Trigger reject. |
| Duplicate purchase `(profile_id,item_id)` | Reject. |
| Purchase `coin_delta != -price_paid_coins` hoặc reason sai | Reject. |
| Owned item receipt/profile/item mismatch | Composite FK reject. |
| Duplicate ownership hoặc reused receipt | Reject. |
| Equip flag/timestamp mismatch | Check/trigger reject. |
| Duplicate store-review app version | Reject. |
| Invalid analytics delivery/count/time/payload bound | Reject theo database-owned portion. |
| Delete parent có referenced product row | `ON DELETE RESTRICT`; child/parent rows giữ nguyên. |
| Inject failure giữa schema/seed | Whole transaction rollback; không partial seed/history success. |

Fixture chỉ trực tiếp ghi SQL trong database integration/diagnostic test. Production caller
không nhận API này.

## 9. Verification commands và native boundary

Automated closeout dùng repository toolchain đã pin:

```sh
pnpm --filter @pixeldoro/mobile typecheck
pnpm --filter @pixeldoro/mobile lint
pnpm --filter @pixeldoro/mobile test
pnpm test:boundaries
pnpm quality
```

Expo dependency/config/doctor check được chạy khi cần và không tạo native artifact. Không chạy
`expo run:*`, local EAS build hoặc prebuild trong agent implementation turn.

Owner chạy native probe theo runbook được tạo ở `T08`, truyền final implementation commit SHA.
Structured report phải được paste vào evidence trước khi Story `DONE`.

## 10. Delivery slices và review checkpoints

Giữ một Story active nhưng review theo slice nhỏ:

1. **Contract slice:** `T00` + `T01`; owner gate và exact schema matrix được khóa.
2. **Artifact slice:** `T02` + `T03`; static executor và 11-table field/check DDL.
3. **Invariant slice:** `T04` + `T05`; FK/index/trigger/immutability.
4. **Seed slice:** `T06`; deterministic singleton/catalog seed.
5. **Evidence slice:** `T07` + `T08` + `T09`; host/native evidence và Story closeout.

Không merge artifact slice nếu failure có thể để partial product schema/seed. Không bắt đầu
runner `US-02-03` “song song” để né Story gate.

## 11. Risks, stop conditions và rollback plan

### 11.1. Main risks

| Risk | Mitigation | Stop condition |
|---|---|---|
| DDL atomicity khác kỳ vọng trên exact Expo SQLite | Same-connection transaction + injected failure native probe. | Partial schema/seed còn durable sau failure. |
| CHECK/trigger khác behavior giữa host giả và native | Native probe là exact acceptance; không thêm second driver. | Invalid normative shape được commit. |
| Trigger vô tình triển khai Product orchestration | Trigger scope table ở TD-02-02-F + diff review. | Trigger tự mutate reward/profile/session ngoài reject backstop. |
| Immutable trigger làm confirmed reset bất khả thi | Resolve `EPIC02-INPUT-03` trước `T05`; no bypass state. | Cần tắt/drop trigger hoặc thêm durable flag để reset. |
| `IF NOT EXISTS`/upsert che schema drift | Empty-only artifact và exact surface verifier. | Partial/mismatched DB được báo success. |
| Seed timestamp/ID phụ thuộc runtime nondeterministic | Caller-provided bound inputs + fixed test values. | SQL dùng current time/random hoặc string interpolation. |
| Story kéo repository/use case vào sớm | Explicit forbidden file/scope audit ở `T09`. | Production Session/Reward/Purchase behavior xuất hiện. |
| Probe làm bẩn product database | Exact separate filename + cleanup included in pass result. | Probe mở/xóa `pixeldoro.db` hoặc để `.db` artifact. |

### 11.2. Rollback/revert strategy

- Trước khi production bootstrap dùng migration, toàn `US-02-02` artifact có thể revert như
  một Story mà không xóa product database.
- Không “rollback” bằng `deleteDatabase`, auto-recreate hoặc seed lại product DB.
- Probe cleanup chỉ xóa exact validated probe filename.
- Nếu native behavior không đạt, giữ Story `IN_PROGRESS`/`BLOCKED_FOR_TECH_REVIEW`, update
  plan/decision và rerun trên clean probe DB; không làm yếu Data Model invariant.
- Sau khi artifact được release qua `US-02-03`, không sửa migration `001`; mọi thay đổi là
  forward migration mới theo approved process.

## 12. Definition of Done cho `US-02-02`

Story chỉ `DONE` khi:

- [x] `T00` → `T09` hoàn tất theo order.
- [x] `EPIC02-INPUT-03` được owner resolve và ghi vào baseline; implementation evidence bổ sung ở `T09`.
- [x] Exact 11-table/field/check/FK/unique contract có inspection + behavior evidence.
- [x] Exact 14 indexes và 6 triggers tồn tại, đúng definition và behavior.
- [x] Full negative-write matrix pass; failed write không làm đổi durable rows liên quan.
- [x] Singleton/settings/profile và exact 12 catalog seed pass per-field comparison.
- [x] Seed dùng injected timestamp/ID qua binding; không có SQLite current time/random.
- [x] Schema + seed apply atomic trên exact native runtime; host failure paths cũng pass.
- [x] Native Expo SQLite probe pass trên iOS bằng exact package/artifact.
- [x] Không có schema field/table từ Product `OPEN` hoặc `DEFERRED` scope.
- [x] Không có repository/use case/bootstrap migration/reset executor scope creep.
- [x] Domain/Application/Presentation không import SQL/SQLite/native type.
- [x] Không commit native artifact, probe DB, secret hoặc machine-local path.
- [x] `EPIC-02_IMPLEMENTATION_EVIDENCE.md` được đối chiếu với owner report và exact SHA.

Sau đó `US-02-03` mới đủ dependency gate để active. Story này không tự làm EPIC-02
`READY_FOR_IMPLEMENTATION` hoặc `DONE`; các Story/input còn lại giữ gate riêng.

## 13. Owner confirmations đã chốt

| ID | Proposed resolution | Status | Blocks |
|---|---|---|---|
| `US0202-CONFIRM-01` / `EPIC02-INPUT-03` | Trigger chặn receipt `UPDATE`; normal repository không có update/delete; delete chỉ ở private maintenance executor/approved migration, không durable bypass flag. | `APPROVED` — 2026-08-28 | Đã mở gate `T05`; làm baseline cho `US-02-08`. |
| `US0202-CONFIRM-02` | `US-02-02` tạo production `001` artifact và empty-DB applicator/probe; `US-02-03` sở hữu registry/checksum/history/no-reapply/compatibility. | `APPROVED` — 2026-08-28 | Đã mở artifact split gate cho `T02`. |
| `US0202-CONFIRM-03` | Initial production seed nhận timestamp từ `ClockPort` và non-empty anonymous ID từ `IdPort`; schema vẫn nullable cho privacy/reset flow; test dùng fixed input, SQLite không tự đọc time/random. | `APPROVED` — 2026-08-28 | Đã mở seed gate cho `T02`, `T06`. |

Không có Product decision `OPEN-001`, `OPEN-006` hoặc `OPEN-009` nào cần chốt để implement
Story này. Owner confirmations trên là technical boundary; không được dùng chúng để thêm Pet
species/name/stage, contribution color, Timer/Session orchestration hoặc Shop behavior.

## 14. Handoff sang `US-02-03`

Khi Story `DONE`, handoff tối thiểu gồm:

- Immutable reviewed `001` artifact và stable version/name.
- Canonical schema/seed manifest.
- Exact native report cùng final commit SHA.
- Known SQLite DDL/transaction observations.
- Explicit fact: `schema_migrations` table tồn tại nhưng chưa có row do `US-02-02` tự ghi.
- Exact artifact payload/input boundary để `US-02-03` quyết định canonical checksum.
- No-reapply, gap/checksum/newer-schema/rollback semantics vẫn chưa được implement.

## 15. References

- [EPIC-02 User Stories](./EPIC-02_USER_STORIES.md)
- [US-02-01 Implementation Plan](./US-02-01_IMPLEMENTATION_PLAN.md)
- [EPIC-02 Implementation Evidence](./EPIC-02_IMPLEMENTATION_EVIDENCE.md)
- [MVP Epic Plan](./MVP_EPICS.md)
- [Product Core Truth](../PIXELDORO_CORE_TRUTH.md)
- [Data Model](../architecture/data-model.md)
- [System Architecture](../architecture/system-architecture.md)
- [Project Structure](../architecture/project-structure.md)
- [Technical Overview](../architecture/technical-overview.md)
- [Timer Engine](../specifications/timer-engine.md)
- [Session Lifecycle](../specifications/session-lifecycle.md)
- [Gamification Rules](../specifications/gamification-rules.md)
- [ADR-003 — State and Persistence](../architecture/decisions/ADR-003-state-and-persistence.md)
- [ADR-004 — Domain and Platform Boundaries](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md)

## 16. Change log

### 1.2.0 — 2026-08-28

- Tiếp nhận owner native report `US-02-02_INITIAL_SCHEMA` trên iOS `26.5`, app `0.1.0`;
  report `passed: true` với đủ `11/11` named assertions.
- Đối chiếu report commit SHA `4996c7d6529d0a1578e2d052bdbaaf858d9e1a1d` khớp exact
  repository `HEAD` trước documentation closeout.
- Hoàn tất `T08`, `T09` và toàn Definition of Done; chuyển Story sang `DONE`.
- Mở dependency gate cho `US-02-03` ở mức ready-for-planning; không resolve sớm
  `EPIC02-INPUT-02` hoặc tự active Story sau.

### 1.1.0 — 2026-08-28

- Ghi nhận production artifact, exact schema/FK/index/trigger/seed manifest, host failure tests,
  dev-only native probe và manual runbook đã được implement.
- Siết PK `NOT NULL`, singleton `id DEFAULT 1`, exact 86-column PRAGMA metadata và exact
  11-row FK target surface theo Data Model `1.0.0`.
- Ghi explicit analytics ownership split: database enforce valid JSON object, 2 KiB/time/state
  bounds; future typed adapter enforce event/property allowlist và tối đa 20 properties.
- Host quality pass `8` files / `32` tests; native/EAS không chạy.
- Chuyển implementation sang `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`; giữ Story chưa
  `DONE` và tiếp tục block `US-02-03` tới khi owner report được review.

### 1.0.0 — 2026-08-28

- Ghi nhận Dũng Lư duyệt `US0202-CONFIRM-03`.
- Khóa production seed lấy timestamp từ `ClockPort`, non-empty anonymous ID từ `IdPort`;
  schema vẫn nullable cho privacy/reset và test dùng fixed inputs.
- Xác nhận cả ba owner confirmation đã `APPROVED`; chuyển plan sang
  `READY_FOR_IMPLEMENTATION`, implementation vẫn `NOT_STARTED`.

### 0.3.0 — 2026-08-28

- Ghi nhận Dũng Lư duyệt `US0202-CONFIRM-02`.
- Khóa `US-02-02` sở hữu production artifact `001` và empty-database probe; `US-02-03`
  sở hữu runner/registry/checksum/history/no-reapply/compatibility.
- Giữ `US0202-CONFIRM-03` ở `PENDING_OWNER`; plan chưa tự chuyển
  `READY_FOR_IMPLEMENTATION`.

### 0.2.0 — 2026-08-28

- Ghi nhận Dũng Lư duyệt `US0202-CONFIRM-01` và resolve `EPIC02-INPUT-03`.
- Khóa receipt immutability: trigger chặn `UPDATE`; normal repository không có delete;
  private maintenance executor/approved migration là hai delete path duy nhất, không durable
  bypass state.
- Giữ `US0202-CONFIRM-02` và `US0202-CONFIRM-03` ở `PENDING_OWNER`; plan chưa tự chuyển
  `READY_FOR_IMPLEMENTATION`.

### 0.1.0 — 2026-08-28

- Tạo implementation plan đầu tiên cho `US-02-02` sau khi `US-02-01 DONE`.
- Khóa split giữa initial schema artifact (`US-02-02`) và migration runner/checksum/history
  (`US-02-03`) ở trạng thái đề xuất chờ owner review.
- Bao phủ exact 11-table schema, 14 indexes, 6 triggers, deterministic seed, negative-write
  matrix, native probe và evidence closeout.
- Giữ `EPIC02-INPUT-03` ở `PENDING_OWNER`; không tự chọn immutable receipt delete semantics.
- Không kéo repository, bootstrap migration, reset executor hoặc Product behavior Epic sau vào scope.
