---
document_id: PIXELDORO_EPIC_02_IMPLEMENTATION_EVIDENCE
title: PixelDoro Mobile MVP — EPIC-02 Implementation Evidence
version: 0.18.0
status: IN_PROGRESS
last_updated: 2026-08-29
owner: Dũng Lư
language: vi
scope:
  - mobile_mvp
  - epic_02
  - implementation_evidence
baseline: ./EPIC-02_USER_STORIES.md
us_02_01_plan: ./US-02-01_IMPLEMENTATION_PLAN.md
us_02_02_plan: ./US-02-02_IMPLEMENTATION_PLAN.md
us_02_03_plan: ./US-02-03_IMPLEMENTATION_PLAN.md
us_02_04_plan: ./US-02-04_IMPLEMENTATION_PLAN.md
us_02_05_plan: ./US-02-05_IMPLEMENTATION_PLAN.md
us_02_06_plan: ./US-02-06_IMPLEMENTATION_PLAN.md
us_02_07_plan: ./US-02-07_IMPLEMENTATION_PLAN.md
us_02_08_plan: ./US-02-08_IMPLEMENTATION_PLAN.md
us_02_09_plan: ./US-02-09_IMPLEMENTATION_PLAN.md
---

# PixelDoro Mobile MVP — EPIC-02 Implementation Evidence

## 1. Kết luận hiện tại

`US-02-01 — SQLite Ownership và Transactional Kernel` đã `DONE`. Host evidence và exact
Expo native runtime probe đều pass trên implementation commit
`a75ecc9112c2aa279bee9a818d9c97e586b84b21`; repository `HEAD` đã được đối chiếu đúng SHA
này khi tiếp nhận report ngày 2026-08-28.

`US-02-02 — Normative Schema, Constraints và Exact Seed` đã `DONE`. Host evidence pass và
owner iOS native runtime report `passed: true` đủ `11/11` assertions trên implementation
commit `4996c7d6529d0a1578e2d052bdbaaf858d9e1a1d`; repository `HEAD` đã được đối chiếu đúng
SHA này trước documentation closeout ngày 2026-08-28.

`US-02-03 — Forward-only Migration Safety` đã `DONE`. Automated evidence và exact iOS native
probe đều pass đủ `10/10` assertions trên implementation commit
`1b6a0427b3db20f4536a2b251101fa0e32b5c0ea`; repository `HEAD` đã được đối chiếu đúng SHA
này khi tiếp nhận report ngày 2026-08-28.

`US-02-04 — Safe Bootstrap và Readiness Barrier` đã `DONE`. Host quality/fault matrix và exact
iOS native probe đều pass đủ `9/9` assertions trên implementation commit
`b36bc45190129da07e42d046f2badf6fddcd99e4`; repository `HEAD` đã được đối chiếu đúng SHA
này khi tiếp nhận report ngày 2026-08-28.

`US-02-05 — Typed Repository và Mapper Integration` đã `DONE`. Production/host quality,
real-SQLite evidence và exact iOS native probe đều pass `10/10` assertions trên implementation
commit `bdbed4d820caa2ad1648cba28679d76327eca1b0`; repository `HEAD` đã được đối chiếu đúng SHA
này khi tiếp nhận report ngày 2026-08-28.

`US-02-06 — Derived Queries và Consistency Evidence` đã `DONE`. Full quality pass `17` files /
`95` tests; exact iOS native `US-02-06_DERIVED_QUERIES` report pass đủ `11/11` assertions với
SQLite `3.50.3` trên final implementation SHA
`e1cd3a54b1a58e84a68518a6ac87ad751f422992`; repository `HEAD` khớp SHA khi tiếp nhận report.

`US-02-07 — Failure Recovery và Retry` đã `DONE`. Production/host quality pass `21` files /
`126` tests; exact iOS native report pass đủ `11/11` assertions với SQLite `3.50.3` trên
implementation SHA `b3c8421ef3a20934005711a571655265cf736091`.
Full quality pass `21` files / `126` tests; stable typed recovery, critical-vs-side-effect boundary,
same-database full-barrier Retry, safe UI/diagnostics và real SQLite rollback/fingerprint matrix đều
pass. Planning dependency `US-02-08` đã mở; reset implementation chưa được tự active trước khi
owner duyệt technical confirmations của Story mới.

`US-02-08 — Atomic Confirmed Full Local-data Reset` đã `DONE`. Full quality pass `24` files /
`147` tests; exact iOS native report pass đủ `12/12` assertions với SQLite `3.50.3` trên
implementation SHA `795c3cd59abf80225747e36fcc61e4d13afbaa14`. Private authority, exact
atomic reset/reseed, post-reset bootstrap, notification/privacy boundary và per-statement
rollback/fingerprint matrix đều pass. Planning dependency `US-02-09` đã mở.

`US-02-09 — Cross-platform Evidence và Epic Exit Audit` có implementation plan `0.2.0` ở trạng
thái `READY_FOR_IMPLEMENTATION`; implementation `NOT_STARTED`. Owner đã duyệt đủ năm technical
confirmation. EPIC-02 chưa `DONE` và `EPIC-03` chưa được mở cho tới final host + iOS + Android
evidence và explicit owner exit review.

Không có migration `002`, Settings reset UI, reset-path database-file deletion, Product
Session/Reward/Pet/Gamification behavior, analytics/notification provider delivery, native/EAS
build hoặc generated native artifact nào được tạo trong implementation turn `US-02-08`.

Repository có ignored/generated native paths từ trước turn; chúng không thuộc implementation
diff/commit set và không bị sửa/xóa.

## 2. `US-02-01` implementation evidence

| Capability | Repository evidence | Automated status |
|---|---|---|
| Compatible SQLite dependency | `expo-sqlite ~57.0.2`, Expo config plugin mặc định, root lockfile và minimum-release-age allowlist | `PASS` |
| Application-owned contract | Opaque `TransactionScope`, result-aware `TransactionPort`, stable `TransactionTechnicalError` | `PASS` |
| Connection ownership | `SQLiteDatabaseOwner` open single-flight, FK enable/readback, close/lease coordination, stable close-failed state | `PASS_HOST_AND_NATIVE_IOS` |
| Transaction kernel | Same owner connection; static `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK`; returned-failure/throw rollback | `PASS_HOST_AND_NATIVE_IOS` |
| Scope safety | Executor chỉ resolve khi scope active; stale scope reject; no raw connection trên facade | `PASS_HOST_AND_NATIVE_IOS` |
| Concurrency | Nested/overlapping transaction reject deterministic bằng `TRANSACTION_BUSY` | `PASS_HOST_AND_NATIVE_IOS` |
| Parameter binding | Executor bắt buộc params; injection-shaped string được truyền tách khỏi SQL | `PASS_HOST_AND_NATIVE_IOS` |
| Error mapping | Open/close/begin/work/commit/rollback failures map về application-owned code; raw exception không tới Presentation | `PASS_HOST`; native work/FK/overlap paths pass |
| Async application lifecycle | Boot mở/verify DB trước ready; repeated boot/dispose idempotent; dispose-during-open không late-ready | `PASS_HOST_AND_NATIVE_IOS` |
| Architecture enforcement | Driver import chỉ hợp lệ trong database Infrastructure; route/Presentation/Application/composition/non-database Infrastructure bị chặn | `PASS` |
| Native runtime probe | Dev-only, explicit-flag harness trên exact probe DB; no product route; structured report/cleanup | `PASS_NATIVE_IOS` |

## 3. Automated evidence — 2026-08-27

Chạy bằng Node.js `22.23.2` và pnpm `11.24.0`:

- `pnpm quality`: `PASS`.
  - Domain/Application/Mobile strict typecheck: `PASS`.
  - ESLint workspace: `PASS`.
  - Vitest: `7` files, `25` tests pass.
  - Device-harness validation: `PASS`.
  - Architecture boundary validator: `11` forbidden imports rejected, `3` valid imports accepted.
- `pnpm --filter @pixeldoro/mobile exec expo install --check`: dependencies up to date
  theo SDK 57 local compatibility map.
- `pnpm --filter @pixeldoro/mobile run doctor`: Expo Doctor `21/21` checks pass khi có
  network access.
- `pnpm --filter @pixeldoro/mobile exec expo config --type public`: config resolve pass,
  SDK `57.0.0`, plugin `expo-sqlite` hiện diện với default configuration.
- `git diff --check`: `PASS`.

Host fault-injection coverage gồm:

- Open failure và FK readback `0` không publish connection.
- Open/close lặp chỉ gọi native open/close một lần trong cycle.
- Close chờ active lease; close failure giữ stable typed result và không gọi native close lặp.
- Success commit theo exact control-statement order.
- Returned application failure rollback và giữ nguyên expected error.
- Thrown work rollback và map `TRANSACTION_WORK_FAILED`.
- Begin/commit/rollback failure có code riêng; rollback failure được ưu tiên.
- Overlap trả `TRANSACTION_BUSY`; stale transaction scope bị reject.
- Dispose trong open không publish late `ready`.

## 4. Native runtime acceptance — owner evidence received 2026-08-28

Owner đã chạy harness theo
[`apps/mobile/test/device/sqlite-kernel-smoke.md`](../../apps/mobile/test/device/sqlite-kernel-smoke.md)
và cung cấp structured report `[PixelDoro][SQLiteKernelProbe]`:

| Field | Owner evidence |
|---|---|
| Platform / OS / device | iOS / 26.5 / target model không được cung cấp |
| App version | `0.1.0` |
| Evidence received | 2026-08-28; exact runtime timestamp không có trong owner report |
| Final implementation commit SHA | `a75ecc9112c2aa279bee9a818d9c97e586b84b21` — khớp repository `HEAD` khi review |
| `expo-sqlite` version | `57.0.2` |
| Probe result | `PASS` — `passed: true`, đủ `11/11` assertions được report |
| Probe DB cleanup | `PASS` — toàn probe kết thúc `passed: true`, không có `failedAssertion`; harness chỉ pass sau exact probe cleanup |

```json
{
  "probe": "US-02-01_SQLITE_KERNEL",
  "passed": true,
  "platform": "ios",
  "osVersion": "26.5",
  "appVersion": "0.1.0",
  "commitSha": "a75ecc9112c2aa279bee9a818d9c97e586b84b21",
  "assertions": [
    "connection_open_and_foreign_keys_verified",
    "probe_schema_committed",
    "successful_work_committed",
    "close_reopen_succeeded",
    "committed_bound_value_survived_reopen",
    "returned_failure_preserved",
    "thrown_failure_mapped",
    "returned_and_thrown_work_rolled_back",
    "foreign_key_violation_rejected",
    "overlap_rejected_deterministically",
    "dispose_is_idempotent"
  ]
}
```

Package version được đối chiếu từ exact implementation commit thay vì suy đoán từ runtime
report. Thiếu target model và exact runtime timestamp chỉ là khoảng trống audit metadata,
không làm yếu assertion behavior hoặc SHA traceability nên không block Story acceptance.

Probe phải chứng minh trên exact native runtime:

- FK bật trên connection và invalid child insert bị reject.
- Commit còn tồn tại sau close/reopen.
- Returned failure và thrown failure không để lại partial row.
- SQL-shaped value được lưu như bound data.
- Overlap trả `TRANSACTION_BUSY`.
- Close/dispose lặp an toàn và exact probe DB được cleanup.

Việc unset `EXPO_PUBLIC_SQLITE_KERNEL_PROBE` sau run vẫn là vệ sinh local environment của
owner, không phải repository acceptance. Both-platform repeat vẫn thuộc `US-02-09`; iOS pass
đáp ứng native gate của `US-02-01` nhưng không tự hoàn thành Epic exit gate.

## 5. Acceptance status

| `US-02-01` acceptance | Status |
|---|---|
| Dependency/lockfile compatible | `PASS` |
| Single owner và architecture boundary | `PASS` |
| Application-scoped lifecycle/dispose | `PASS_HOST_AND_NATIVE_IOS` |
| Foreign-key enable/enforcement | `PASS_HOST_AND_NATIVE_IOS` |
| Commit success | `PASS_HOST_AND_NATIVE_IOS` |
| Returned-failure/throw rollback | `PASS_HOST_AND_NATIVE_IOS` |
| Nested/overlap deterministic | `PASS_HOST_AND_NATIVE_IOS` |
| No side-effect capability trong transaction scope | `PASS` |
| Parameter binding | `PASS_HOST_AND_NATIVE_IOS` |
| Typed failure/no raw provider leak | `PASS_HOST` |
| Architecture checks | `PASS` |

**Current Story status:** `DONE`.

Dependency gate từ `US-02-01` sang `US-02-02` đã mở. `US-02-02` chỉ được active sau khi
các input/plan riêng của Story đó đạt gate; không giữ đồng thời `US-02-01` active.

## 6. `US-02-02` host implementation evidence — 2026-08-28

| Capability | Repository evidence | Status |
|---|---|---|
| Production initial artifact | `001_initial-schema.migration.ts`, version `1`, stable name `initial-schema`; empty-database precondition; no `IF NOT EXISTS`/upsert/history write | `PASS_HOST` |
| Exact schema surface | Canonical manifest: `11` tables, `86` columns, `11` FK rows, `14` indexes, `6` triggers | `PASS_HOST_AND_NATIVE_IOS` |
| Exact seed | Installation/settings/profile singleton và exact `12` Vietnamese catalog rows; all values bound với injected timestamp/ID | `PASS_HOST_AND_NATIVE_IOS` |
| Atomicity | Same-connection `BEGIN IMMEDIATE`; injected DDL, seed và post-verification failures rollback | `PASS_HOST_AND_NATIVE_IOS` |
| Constraints/backstops | Focus/trial/Break/status shapes, one-running, FK `RESTRICT`, terminal/identity immutability, reward/purchase/equip backstops | `PASS_HOST_AND_NATIVE_IOS` |
| Native probe harness | Exact production artifact, deterministic fixtures, full-row before/after negative matrix, reopen, injected failure DB, exact cleanup | `PASS_NATIVE_IOS` |
| Scope boundary | Không có production repository/use case/bootstrap/reset executor; SQL/driver không rò Domain/Application/Presentation | `PASS` |

Automated checks dùng Node.js `22.23.2` và pnpm `11.24.0`:

- `pnpm quality`: `PASS`.
  - Domain/Application/Mobile strict typecheck: `PASS`.
  - ESLint workspace: `PASS`.
  - Vitest: `8` files, `32` tests pass.
  - Device-harness validation: `PASS`.
  - Architecture boundary validator: `11` forbidden imports rejected, `3` valid imports accepted.
- Expo dependency check: local SDK 57 compatibility map báo dependencies up to date; network
  disabled nên không dùng kết quả này thay native evidence.
- Expo public config resolve: `PASS`; SDK `57.0.0`, `expo-sqlite` plugin hiện diện.
- Initial DDL parse trên host SQLite `3.51.0`: `PASS` — `11` tables, `14` named indexes,
  `6` triggers. Locked `expo-sqlite 57.0.2` source vendors SQLite `3.50.3` với JSON support;
  exact packaged behavior vẫn do native probe xác nhận.
- Exact `PRAGMA table_info` manifest so với DDL trên SQLite `3.51.0`: `PASS` — đủ type,
  nullability, default và PK position cho `86` columns.
- Exact flattened `PRAGMA foreign_key_list` surface: `PASS` — `11` source/target column rows,
  toàn bộ `ON DELETE RESTRICT`.
- `git diff --check`: `PASS` tại host closeout.

Analytics ownership split được ghi explicit: SQLite enforce valid JSON object,
text/non-null/default, payload `<= 2 KiB`, expiry arithmetic và state/count/time bounds.
Event/property allowlist cùng tối đa `20` properties thuộc future typed adapter/repository
`US-02-05/06`; `US-02-02` không thêm analytics delivery behavior.

## 7. `US-02-02` native runtime acceptance — owner evidence received 2026-08-28

Owner đã chạy runbook
[`apps/mobile/test/device/initial-schema-smoke.md`](../../apps/mobile/test/device/initial-schema-smoke.md)
trên exact final implementation commit:

| Field | Owner evidence |
|---|---|
| Platform / OS / device | iOS / 26.5 / target model không được cung cấp |
| App version | `0.1.0` |
| Evidence received | 2026-08-28; exact runtime timestamp không có trong report |
| Final implementation commit SHA | `4996c7d6529d0a1578e2d052bdbaaf858d9e1a1d` — khớp repository `HEAD` khi review |
| Probe result | `PASS` — `passed: true`, đủ `11/11` named assertions |
| Cleanup | `PASS` — report chỉ pass sau hai exact probe database close/delete thành công |

```json
{
  "probe": "US-02-02_INITIAL_SCHEMA",
  "passed": true,
  "platform": "ios",
  "osVersion": "26.5",
  "appVersion": "0.1.0",
  "commitSha": "4996c7d6529d0a1578e2d052bdbaaf858d9e1a1d",
  "assertions": [
    "schema_probe_database_opened",
    "initial_schema_applied_atomically",
    "exact_schema_surface_verified",
    "foreign_keys_restrict_and_valid_seed_verified",
    "exact_seed_verified",
    "valid_entity_shapes_committed",
    "negative_write_matrix_rejected_without_partial_rows",
    "schema_and_seed_survived_reopen",
    "failure_probe_database_opened",
    "injected_apply_failure_rolled_back_all_schema",
    "probe_connections_closed_idempotently"
  ]
}
```

Thiếu target model và exact runtime timestamp chỉ là audit metadata gap, không làm yếu
behavior assertions hoặc SHA traceability. Một native target pass đóng gate `US-02-02`;
iOS + Android repeat vẫn thuộc `US-02-09`.

## 8. `US-02-02` acceptance status

| Acceptance group | Host status | Native status |
|---|---|---|
| 11 tables / 86 columns / exact defaults/check surface | `PASS_MANIFEST_AND_DDL_AUDIT` | `PASS_IOS` |
| 11 FK rows / all product delete actions `RESTRICT` | `PASS_DDL_AUDIT` | `PASS_IOS` |
| Focus/trial/Break/status conditional shapes | `PASS_PROBE_MATRIX_IMPLEMENTED` | `PASS_IOS` |
| One-running + terminal/identity immutability | `PASS_PROBE_MATRIX_IMPLEMENTED` | `PASS_IOS` |
| Reward/purchase/ownership/equip backstops | `PASS_PROBE_MATRIX_IMPLEMENTED` | `PASS_IOS` |
| Singleton + exact deterministic seed | `PASS_HOST` | `PASS_IOS` |
| Exact indexes/triggers | `PASS_MANIFEST_AND_DDL_AUDIT` | `PASS_IOS` |
| Atomic apply/seed/failure rollback/reopen | `PASS_HOST_ORCHESTRATION` | `PASS_IOS` |
| No OPEN/DEFERRED field hoặc cross-layer scope creep | `PASS` | N/A |

**Current Story status:** `DONE`.

Dependency gate sang `US-02-03` đã mở và toàn bộ `US0203-CONFIRM-01`–`03` đã được owner
duyệt ngày 2026-08-28. Sau các closeout kế tiếp, `US-02-03` và `US-02-04` đều đã `DONE`.

## 9. `US-02-03` host implementation evidence — 2026-08-28

| Capability | Repository evidence | Status |
|---|---|---|
| Immutable production registry | Registry chỉ chứa `001 initial-schema`; strict version/name/filename/checksum validation | `PASS_HOST` |
| Canonical checksum lock | SHA-256 lowercase trên ordered source set gồm migration `001` và schema manifest; UTF-8/LF + length-prefixed path/content | `PASS_HOST` |
| Drift quality gate | Repository validator recompute checksum; positive, source-tamper và lock-tamper tests | `PASS_HOST` |
| History preflight | Empty/history-present classification; contiguous prefix, name/checksum/gap/unknown/newer validation trước write | `PASS_HOST` |
| No auto-adoption | Non-empty DB thiếu/rỗng history fail typed và giữ fingerprint; không backfill/reset/delete/recreate | `PASS_HOST` |
| Transactional apply/history | Mỗi pending version chạy `apply → validation → history` trong cùng `BEGIN IMMEDIATE` transaction | `PASS_HOST` |
| Rollback/retry | Failed apply/history insert rollback current version; durable predecessor retained; Retry commit đúng một lần | `PASS_HOST` |
| Latest idempotency | Latest history trả no-op; không gọi Clock/ID, artifact hoặc write transaction | `PASS_HOST` |
| Typed boundary | Application-owned result/error; transaction technical error được giữ typed; không raw SQL/provider message ra ngoài | `PASS_HOST` |
| Native probe harness | Isolated exact DBs, production `001`, synthetic upgrade/failure, reopen và cleanup report | `PASS_NATIVE_IOS` |
| Scope boundary | Không production bootstrap/repository/Product behavior, production `002`, reset hoặc native artifact | `PASS` |

Automated checks dùng Node.js `22.23.2` và pnpm `11.24.0`:

- `pnpm quality`: `PASS`.
  - Domain/Application/Mobile strict typecheck: `PASS`.
  - ESLint workspace: `PASS`.
  - Vitest: `11` files, `53` tests pass.
  - Device-harness validation: `PASS`.
  - Architecture boundary validator: `11` forbidden imports rejected, `3` valid imports accepted.
  - Repository hygiene/checksum validator: `PASS`, một immutable production migration.
- `git diff --check`: `PASS`.
- Expo public config resolve: `PASS`; SDK `57.0.0`, runtime policy `appVersion` và
  `expo-sqlite` plugin hiện diện.
- Không chạy native/EAS build hoặc tạo native artifact.

Host failure matrix gồm invalid/empty/gap/duplicate registry, non-empty missing history,
empty history cạnh product schema, history gap/name/checksum drift, newer schema, unreadable
history, apply failure và history-write failure. Failure cases assert no unsafe write hoặc exact
before/after fingerprint; retry bắt đầu từ durable prefix còn hợp lệ.

## 10. `US-02-03` native runtime acceptance — owner evidence received 2026-08-28

Owner đã chạy runbook
[`apps/mobile/test/device/forward-migration-smoke.md`](../../apps/mobile/test/device/forward-migration-smoke.md)
trên exact final implementation commit:

| Field | Owner evidence |
|---|---|
| Platform / OS / device | iOS / 26.5 / target model không được cung cấp |
| App version / application ID | `0.1.0` / `com.dragonc92team.pixeldoro` |
| Evidence received | 2026-08-28; exact runtime timestamp không có trong report |
| Final implementation commit SHA | `1b6a0427b3db20f4536a2b251101fa0e32b5c0ea` — khớp repository `HEAD` khi review |
| Probe result | `PASS` — `passed: true`, đủ `10/10` named assertions |
| Cleanup | `PASS` — report chỉ pass sau ba exact probe database close/delete thành công |

```json
{
  "probe": "US-02-03_FORWARD_MIGRATION",
  "passed": true,
  "platform": "ios",
  "osVersion": "26.5",
  "appVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "1b6a0427b3db20f4536a2b251101fa0e32b5c0ea",
  "assertions": [
    "empty_database_migrated_to_latest",
    "exact_history_committed_after_validation",
    "latest_rerun_was_noop",
    "incompatible_history_rejected_before_write",
    "failed_migration_rolled_back_without_false_history",
    "failed_history_write_rolled_back_without_false_history",
    "retry_resumed_from_valid_durable_history",
    "synthetic_upgrade_applied_in_order",
    "committed_history_survived_reopen",
    "probe_connections_closed_and_databases_cleaned"
  ]
}
```

Thiếu target model và exact runtime timestamp chỉ là audit metadata gap, không làm yếu
behavior assertions hoặc SHA traceability. Một native target pass đóng gate `US-02-03`;
iOS + Android repeat vẫn thuộc `US-02-09`.

**Current Story status:** `DONE`.

Dependency gate `US-02-04` đã được mở từ closeout `US-02-03`; Story sau đó hoàn tất production,
host và native evidence. Dependency phía `US-02-04` cho `US-02-05/07` đã đạt; `US-02-07`
vẫn chờ `US-02-06` và chưa Story nào được tự active.

## 11. `US-02-04` host implementation evidence — 2026-08-28

| Capability | Repository evidence | Status |
|---|---|---|
| Ordered durable bootstrap | `MobileBootstrap` publish phase `opening → migrating → verifying → hydrating → reconciling → ready`; failure dừng suffix | `PASS_HOST` |
| Durable projection | Bootstrap-specific strict SQLite read adapter trả migration/install/onboarding/settings/XP/Coin/exact catalog; không Clock/ID fabricate hoặc raw row | `PASS_HOST` |
| Physical/invariant verification | Integrity, FK, exact DDL/column/FK/history, singleton/catalog và economy receipt sums; toàn bộ read-only | `PASS_HOST` |
| Readiness barrier | Application-owned gate reject `CORE_COMMANDS_NOT_READY` ở idle/mọi boot phase/recovery/disposed, zero callback; open sau reconcile success | `PASS_HOST` |
| Recovery ownership | Post-open failure giữ application owner tới dispose; không repair/reseed/reset/close-reopen; stable phase/code | `PASS_HOST` |
| Reconciliation boundary | Explicit Epic-2 no-op adapter sau hydration/trước ready, replacement note cho EPIC-03; không Session read/write | `PASS_HOST` |
| Lifecycle ownership | Real React Native AppState current-state read + one application-scoped subscription; lifecycle chỉ cập nhật projection | `PASS_HOST` |
| Concurrency/dispose | Exact single-flight; ready/recovery rerun no-op; dispose từng deferred phase không late-ready, unsubscribe/close once | `PASS_HOST` |
| Presentation boundary | Existing generic loading/recovery boundary chỉ render children tại `ready`; không Retry/reset/Product route mới | `PASS_HOST` |
| Native probe harness | Dev-only isolated `US-02-04_SAFE_BOOTSTRAP`, reopen/invariant/fingerprint/readiness/cleanup assertions + owner runbook | `PASS_NATIVE_IOS` |

Automated checks dùng pinned Node.js `22.23.2` và pnpm `11.24.0`:

- `pnpm quality`: `PASS`.
  - Domain/Application/Mobile strict typecheck: `PASS`.
  - ESLint workspace: `PASS`.
  - Vitest: `13` files, `75` tests pass.
  - Device harness: `PASS`, bao gồm safe-bootstrap runbook/probe contract.
  - Architecture boundary: `11` forbidden imports rejected, `3` valid imports accepted.
  - Repository hygiene/checksum: `PASS`, một immutable production migration.
- `pnpm --filter @pixeldoro/mobile test`: `PASS`, `9` files / `66` tests.
- Expo public config resolve: `PASS`; SDK `57.0.0`, runtime `appVersion`, `expo-sqlite` và
  application ID `com.dragonc92team.pixeldoro` giữ nguyên.
- `git diff --check`: `PASS`.
- Không chạy native/EAS build, prebuild hoặc tạo native artifact.

Host evidence cover exact listener/call trace; returned/thrown failure ở cả năm phase; suffix
stop; command gate; lifecycle buffering; concurrent/repeated boot; deferred dispose từng phase;
schema/FK/catalog/economy/singleton mismatch; sanitized provider error; no-write/fingerprint
preservation và immutable durable snapshot.

## 12. `US-02-04` native runtime acceptance — owner evidence received 2026-08-28

Owner runbook:
[`apps/mobile/test/device/safe-bootstrap-smoke.md`](../../apps/mobile/test/device/safe-bootstrap-smoke.md).

Owner đã cung cấp structured report `[PixelDoro][SafeBootstrapProbe]`:

| Field | Owner evidence |
|---|---|
| Platform / OS / device | iOS / 26.5 / target model không được cung cấp |
| App version / application ID | `0.1.0` / `com.dragonc92team.pixeldoro` |
| Evidence received | 2026-08-28; exact runtime timestamp không có trong report |
| Final implementation commit SHA | `b36bc45190129da07e42d046f2badf6fddcd99e4` — khớp repository `HEAD` khi review |
| Probe result | `PASS` — `passed: true`, đủ `9/9` named assertions |
| Cleanup | `PASS` — report chỉ pass sau connections close và exact isolated probe DB cleanup |

```json
{
  "probe": "US-02-04_SAFE_BOOTSTRAP",
  "passed": true,
  "platform": "ios",
  "osVersion": "26.5",
  "appVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "b36bc45190129da07e42d046f2badf6fddcd99e4",
  "assertions": [
    "empty_database_reached_ready_after_ordered_barrier",
    "exact_durable_snapshot_hydrated",
    "readiness_gate_opened_only_after_reconciliation",
    "latest_reopen_preserved_snapshot_without_duplicate_seed",
    "injected_invariant_mismatch_entered_typed_recovery",
    "failed_bootstrap_kept_gate_closed_and_skipped_reconciliation",
    "failed_bootstrap_preserved_database_fingerprint",
    "repeated_boot_and_dispose_were_idempotent",
    "probe_connections_closed_and_databases_cleaned"
  ]
}
```

Thiếu target model và exact runtime timestamp chỉ là audit metadata gap, không làm yếu behavior
assertions hoặc SHA traceability. Một native target pass đóng gate `US-02-04`; both-platform
repeat vẫn thuộc `US-02-09`.

**Current Story status:** `DONE`.

Dependency phía `US-02-04` cho `US-02-05/07` đã đạt; `US-02-05` là Story kế tiếp theo order,
`US-02-07` vẫn chờ `US-02-06`, và không Story nào được tự active trong closeout này.

## 13. `US-02-05` host implementation evidence — 2026-08-28

| Capability | Repository evidence | Status |
|---|---|---|
| Application-owned contracts | Shared profile/session/reward/catalog/purchase/ownership ports; mobile installation/settings/review/analytics ports; stable sanitized persistence result/error | `PASS_HOST` |
| Entity ownership | Exact `10` product/metadata tables có capability-specific owner/adapter; `schema_migrations` tiếp tục migration-owned | `PASS_HOST` |
| Canonical mapping | Runtime exact type/null/enum/boolean/timestamp/conditional-shape mapping; bootstrap reuse foundation mappers; no snake_case/raw row outside Infrastructure | `PASS_HOST` |
| Transaction participation | Explicit scoped/unscoped APIs; scoped methods resolve current transaction executor; wrong/stale scope fail typed; no repository-local commit | `PASS_HOST` |
| Session persistence | Find-by-ID/active, prepared running insert, strict-background evidence và conditional terminal transition; không status/reward decision | `PASS_HOST` |
| Economy/inventory | Atomic profile progression, catalog-authoritative debit by item ID, insert-only reward/purchase receipts, ownership/equip persistence | `PASS_HOST` |
| Metadata | Typed store-review attempt và analytics properties serialization/basic persistence; no eligibility/TTL/drop-oldest/delivery/PostHog behavior | `PASS_HOST` |
| Immutable API | Reward/purchase normal repositories không expose update/delete; catalog runtime không expose insert/update/delete | `PASS_HOST` |
| Real SQLite evidence | Production migration `001`, cross-entity transaction commit, close/reopen exact values và returned-failure rollback trên Node SQLite | `PASS_HOST_SQLITE` |
| Composition/boundary | Một application-scoped persistence graph dùng existing owner/transaction; graph không thuộc Presentation facade; SQL-location/generic-CRUD scans sạch | `PASS_HOST` |
| Native probe harness | Dev-only isolated `US-02-05_TYPED_REPOSITORIES`, production graph/migration, reopen/rollback/conflict/wrong-scope/cleanup assertions + owner runbook | `PASS_NATIVE_IOS` |

Automated checks dùng pinned Node.js `22.23.2` và pnpm `11.24.0`:

- `pnpm quality`: `PASS`.
  - Domain/Application/Mobile strict typecheck: `PASS`.
  - ESLint workspace: `PASS`.
  - Vitest: `16` files / `92` tests pass, gồm pure mapper corruption matrix, fake-provider
    error/scope matrix và real host SQLite close/reopen/rollback integration.
  - Device harness: `PASS`, gồm typed-repositories runbook/probe contract.
  - Architecture boundary: `11` forbidden imports rejected, `3` valid imports accepted.
  - Repository hygiene/checksum: `PASS`, một immutable production migration.
- `git diff --check`: `PASS`.
- SQL location scan: không SQL trong shared/Mobile Application, Presentation hoặc route.
- Generic/destructive API scan: không base/generic CRUD, receipt update/delete hoặc catalog runtime
  mutation capability.
- Không chạy native/EAS build, prebuild hoặc tạo native artifact.

Host evidence cover đủ mười entity groups, valid/corrupt row mapping, nullable/enum/boolean/time
edge, provider conflict sanitization, inactive transaction scope, multi-repository returned/thrown
rollback, catalog-authoritative debit và immutable API surface. Exact Expo SQLite runtime vẫn là
manual owner gate theo
[`apps/mobile/test/device/typed-repositories-smoke.md`](../../apps/mobile/test/device/typed-repositories-smoke.md).

## 14. `US-02-05` native runtime acceptance — owner evidence received 2026-08-28

Owner runbook:
[`apps/mobile/test/device/typed-repositories-smoke.md`](../../apps/mobile/test/device/typed-repositories-smoke.md).

| Field | Owner evidence |
|---|---|
| Platform / OS / device | iOS / 26.5 / target model không được cung cấp |
| App version / application ID | `0.1.0` / `com.dragonc92team.pixeldoro` |
| Evidence received | 2026-08-28; exact runtime timestamp không có trong report |
| Final implementation commit SHA | `bdbed4d820caa2ad1648cba28679d76327eca1b0` — khớp repository `HEAD` khi review |
| Probe result | `PASS` — `passed: true`, đủ `10/10` named assertions |
| Cleanup | `PASS` — report chỉ pass sau application connections close và exact isolated database cleanup |

```json
{
  "probe": "US-02-05_TYPED_REPOSITORIES",
  "passed": true,
  "platform": "ios",
  "osVersion": "26.5",
  "appVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "bdbed4d820caa2ad1648cba28679d76327eca1b0",
  "assertions": [
    "repository_probe_database_opened_and_migrated",
    "all_durable_entity_groups_round_tripped",
    "transaction_scoped_multi_repository_work_committed",
    "catalog_authoritative_price_debit_was_verified",
    "canonical_mappers_preserved_exact_values_after_reopen",
    "returned_and_thrown_failures_rolled_back_all_repository_writes",
    "session_conditional_conflict_was_deterministic",
    "corrupt_or_constraint_failures_were_safely_mapped",
    "immutable_receipt_mutation_was_not_exposed_or_committed",
    "repository_graph_connections_closed_and_database_cleaned"
  ]
}
```

Thiếu target model và exact runtime timestamp chỉ là audit metadata gap, không làm yếu behavior
assertions hoặc SHA traceability. Một native target pass đóng gate `US-02-05`; both-platform
repeat vẫn thuộc `US-02-09`.

Final `pnpm quality` rerun trên exact implementation SHA pass `16` files / `92` tests cùng
device/boundary/hygiene gates.

**Current Story status:** `DONE`.

Dependency `US-02-06` đã mở theo authoritative execution order. Story tiếp theo chưa tự active.

## 15. `US-02-06` host implementation evidence — 2026-08-29

| Capability | Repository evidence | Status |
|---|---|---|
| Application query ownership | Shared history/contribution/cadence/economy ports; mobile review-facts/analytics queue contracts; graph internal, không Presentation exposure | `PASS_HOST` |
| Standard history | Exact `focus + standard`, terminal-only, failed/cancelled included, trial/running/Break excluded; deterministic `endsAt DESC, id ASC` keyset page | `PASS_HOST_SQLITE` |
| Contribution | Sum configured minutes chỉ completed standard Focus; sparse persisted local-day grouping; invalid calendar/range reject | `PASS_HOST_SQLITE` |
| Timezone durability | Persisted `scheduled_end_local_date` và original grouping survive close/reopen, không nhận current timezone input | `PASS_HOST_SQLITE` |
| Long Break cadence | Latest completed Long Break marker; only later completed standard Focus count; cancelled Long Break/trial/failure/cancel excluded | `PASS_HOST_SQLITE` |
| Store-review facts | Installation/completed standard/distinct persisted day/latest/current-version/rolling-365 facts; future attempts excluded from window; no feedback/native outcome | `PASS_HOST_SQLITE` |
| Economy consistency | One transaction snapshot; empty/non-zero exact receipt sums; stable `PERSISTENCE_INVARIANT_MISMATCH`; before/after fingerprint proves no repair | `PASS_HOST_SQLITE` |
| Bounded analytics | Approved event/privacy allowlist, exact 7-day TTL, cap/drop-oldest, dedupe, pending-first due retry, exact delete/clear primitives | `PASS_HOST_SQLITE` |
| Queue atomicity | Injected insert failure after expired cleanup rolls back whole queue mutation; rejected payload/name leaves count unchanged | `PASS_HOST_SQLITE` |
| Product retention | Queue cap/TTL/retry/rejection/rollback preserve singleton/catalog/session/reward/purchase/ownership/review table fingerprint | `PASS_HOST_SQLITE` |
| Planner/index evidence | Representative plans use six approved `001` indexes; bounded oldest sort documented; no migration `002` | `PASS_HOST_SQLITE` |
| Native harness | Isolated dev-only probe records platform/app/application ID/SHA/SQLite version, 11 stable assertions and exact DB cleanup | `PASS_IOS_RUNTIME` |

Automated checks dùng pinned Node.js `22.23.2` và pnpm `11.24.0`:

- Targeted `derived-queries.integration.test.ts`: `PASS`, `3/3` vertical integration cases.
- `pnpm quality`: `PASS`.
  - Domain/Application/Mobile strict typecheck: `PASS`.
  - ESLint workspace: `PASS`.
  - Vitest: `17` files / `95` tests pass.
  - Device harness: `PASS`, gồm `derived-queries-smoke.md` và diagnostic source contract.
  - Architecture boundary: `11` forbidden imports rejected, `3` valid imports accepted.
  - Repository hygiene/checksum: `PASS`, đúng một immutable production migration `001`.
- `git diff --check`: `PASS`.
- Retention audit: production `DELETE` mới chỉ target exact `analytics_events`; không generic table
  delete, session/ledger/ownership/review prune hoặc automatic repair/reset.
- Không có migration/schema `002`, Product screen/Zustand behavior, PostHog/native review call,
  Retry/reset implementation, prebuild, native/EAS build hoặc generated native artifact.

Host matrix dùng real Node SQLite để cover mixed standard/trial/Break/status fixtures, history
cursor tie, two persisted local days với different UTC offsets, completed/cancelled Long Break,
review boundary/future attempt, zero/non-zero/mismatch economy, `1000 → 1001` queue pressure,
exact-expiry cleanup, duplicate ID, due/future retry, forbidden free text/event, injected rollback,
full product-retention fingerprint và all approved representative index names.

Manual owner gate:
[`apps/mobile/test/device/derived-queries-smoke.md`](../../apps/mobile/test/device/derived-queries-smoke.md).

### 15.1. Exact owner native report

Owner-provided iOS report được tiếp nhận ngày 2026-08-29; `commitSha` khớp repository `HEAD`:

```json
{
  "probe": "US-02-06_DERIVED_QUERIES",
  "passed": true,
  "platform": "ios",
  "osVersion": "26.5",
  "appVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "e1cd3a54b1a58e84a68518a6ac87ad751f422992",
  "sqliteVersion": "3.50.3",
  "assertions": [
    "query_probe_database_opened_and_migrated",
    "mixed_standard_history_excluded_trial_running_and_breaks",
    "contribution_grouped_by_persisted_local_date",
    "timezone_change_did_not_regroup_contribution",
    "cadence_used_completed_long_break_reset_only",
    "store_review_facts_excluded_trial_status_and_feedback",
    "economy_consistency_passed_and_mismatch_preserved_rows",
    "analytics_queue_enforced_ttl_cap_dedupe_retry_and_privacy",
    "product_retention_rows_survived_queue_maintenance",
    "critical_query_plans_used_or_documented_approved_indexes",
    "probe_connections_closed_and_database_cleaned"
  ]
}
```

Exact report cover đủ native acceptance: real Expo SQLite open/migrate, mixed durable projections,
persisted local-day stability, cadence/review facts, economy no-repair, bounded/privacy queue,
product retention, planner evidence và isolated cleanup. Một native platform pass đủ gate Story;
both-platform repeat vẫn thuộc `US-02-09`.

**Current Story status:** `DONE`.

Planning dependency `US-02-07` đã mở theo authoritative order. Story tiếp theo chưa tự active;
Retry/reset không được implement trong closeout này.

## 16. `US-02-07` host implementation evidence — 2026-08-29

| Capability | Repository evidence | Status |
|---|---|---|
| Recovery taxonomy | Application-owned phase/reason contracts map database, migration, schema, seed, data and economy failures without provider exception leakage | `PASS_HOST` |
| Critical boundary | Explicit critical ingress closes readiness and publishes unavailable recovery; analytics/best-effort failures do not enter global recovery | `PASS_HOST` |
| Safe Retry | Explicit user Retry reopens the same database owner, reruns open → migrate → verify → hydrate → reconcile and opens readiness only after success | `PASS_HOST_SQLITE` |
| Retry concurrency/lifecycle | Concurrent Retry coalesces to one attempt; repeated boot, Retry and dispose remain deterministic without connection or subscription resurrection | `PASS_HOST` |
| Durable safety | Real SQLite injected failure rolls back uncommitted core writes; before/after fingerprint preserves schema and product rows across recovery and Retry | `PASS_HOST_SQLITE` |
| Migration mapping | Exact history/checksum/gap/newer/execution codes are preserved; retry reinspects durable history without migration `002` or destructive repair | `PASS_HOST` |
| Recovery UI | Friendly unavailable message and accessible `Thử lại` action; no raw code, exception, SQL, row or stale authoritative snapshot is rendered | `PASS_HOST` |
| Diagnostics | Fixed allowlisted event envelope with safe default adapter; diagnostic adapter failure cannot change recovery/readiness behavior | `PASS_HOST` |
| Scope/retention audit | No automatic reset/reseed/recreate/repair, session terminal/reward path, catalog overwrite or `US-02-08` capability is reachable from recovery | `PASS_HOST` |
| Native harness | Isolated dev-only `US-02-07_FAILURE_RECOVERY` probe covers typed failure, gate, same DB, concurrent Retry, fresh hydration, side-effect isolation, no destructive path and cleanup | `PASS_NATIVE_IOS` |

Automated checks dùng pinned Node.js `22.23.2` và pnpm `11.24.0`:

- `pnpm quality`: `PASS`.
  - Domain/Application/Mobile strict typecheck: `PASS`.
  - ESLint workspace: `PASS`.
  - Vitest: `21` files / `126` tests pass, gồm pure exhaustive recovery mapping, bootstrap phase
    fault/retry matrix, friendly UI/diagnostic contract và real host SQLite rollback/fingerprint.
  - Device harness: `PASS`, gồm failure-recovery runbook/probe source contract.
  - Architecture boundary: `11` forbidden imports rejected, `3` valid imports accepted.
  - Repository hygiene/checksum: `PASS`, đúng một immutable production migration `001`.
- `git diff --check`: `PASS` tại host implementation verification.
- Migration diff audit: không có migration/schema `002`; recovery không có production database
  delete/reset/repair path. Database deletion chỉ tồn tại trong isolated diagnostic cleanup.
- Không chạy native/EAS build, prebuild hoặc tạo native artifact.

Manual owner gate:
[`apps/mobile/test/device/failure-recovery-smoke.md`](../../apps/mobile/test/device/failure-recovery-smoke.md).
### 16.1. Exact owner native report

Owner-provided iOS report được tiếp nhận ngày 2026-08-29; `commitSha` khớp exact implementation
commit và report có SQLite runtime version cùng đủ stable assertions:

```json
{
  "probe": "US-02-07_FAILURE_RECOVERY",
  "passed": true,
  "platform": "ios",
  "osVersion": "26.5",
  "appVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "b3c8421ef3a20934005711a571655265cf736091",
  "sqliteVersion": "3.50.3",
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

Exact report cover typed/sanitized recovery, readiness lock, product-row retention, Retry
single-flight trên same database, fresh hydration, side-effect isolation, no destructive/Product
mutation path và isolated cleanup. Documentation-only closeout sau report không làm stale behavior
evidence. Both-platform repeat và broader kill/disk-full matrix vẫn thuộc `US-02-09`.

**Current Story status:** `DONE`.

Planning dependency `US-02-08` đã mở theo authoritative solo order. Reset implementation chưa được
tự active trong documentation/planning turn này.

## 17. `US-02-08` planning baseline — 2026-08-29

- Start gate đạt sau `US-02-07 DONE` với exact host/native evidence.
- `EPIC02-INPUT-03`, Data Model reset defaults/retention và anonymous identity policy đều đã
  `RESOLVED`; không có Product decision `OPEN` block Story.
- Implementation plan authoritative:
  [`US-02-08_IMPLEMENTATION_PLAN.md`](./US-02-08_IMPLEMENTATION_PLAN.md) `0.4.0` / `DONE`.
- Plan khóa reset là private confirmed capability, không tự reachable từ recovery/current UI;
  Settings warning/confirmation UX tiếp tục thuộc EPIC-10.
- Plan yêu cầu một existing SQLite transaction clear exact product rows/reseed singleton, atomic
  anonymous-ID rotation, preserve schema/history/catalog và full post-commit bootstrap.
- Database-file delete/recreate, migration repair/`002`, partial reset, provider SDK, Product
  Session/Reward/Pet behavior và native/EAS build đều ngoài scope.
- Owner đã duyệt `US0208-CONFIRM-01`–`05`; production/host/native harness implementation và exact
  owner iOS report đã hoàn tất. Planning dependency `US-02-09` đã mở.

## 18. `US-02-08` host implementation evidence — 2026-08-29

| Capability | Repository evidence | Status |
|---|---|---|
| Private authority | Confirmed reset chỉ có trên concrete composition graph; current `MobileApplicationFacade`, context, route và recovery action không expose capability | `PASS_HOST` |
| Reset barrier | Bootstrap maintenance lease đóng readiness trước cleanup/write; only ready/recovery entry; boot/Retry/reset/dispose conflicts deterministic | `PASS_HOST` |
| Single-flight/lifecycle | Concurrent reset trả cùng operation; Retry không tranh transaction; dispose thắng trước transaction và không resurrect graph | `PASS_HOST_SQLITE` |
| Atomic maintenance | Narrow Application port + static parameterized SQLite adapter dùng existing `BEGIN IMMEDIATE`; exact FK-safe delete/reseed order | `PASS_HOST_SQLITE` |
| Exact fresh defaults | Installation/settings/profile reseed với injected time, `relax`, `25/5/15`, all preferences enabled, zero XP/Coin và new anonymous ID | `PASS_HOST_SQLITE` |
| Retained surface | Full schema objects, migration history, indexes/triggers và exact 12-item catalog validated before/after reset | `PASS_HOST_SQLITE` |
| Durable rollback | Complete product/schema fingerprint unchanged khi provider failure được inject tại từng destructive/singleton reseed statement | `PASS_HOST_SQLITE` |
| Projection/bootstrap | Commit invalidates stale projection; same-DB open/migrate/verify/hydrate/reconcile runs before readiness and returns fresh snapshot | `PASS_HOST` |
| Post-commit failure | Bootstrap failure sau commit maps `RESET_COMMITTED_BOOTSTRAP_FAILED`, giữ gate closed và existing recovery Retry; không giả rollback/success | `PASS_HOST` |
| Best-effort side effect | Active-session lookup/notification cleanup failures thành sanitized warnings; no provider call inside transaction | `PASS_HOST` |
| Diagnostics/privacy | Fixed allowlisted event/error/warning envelope; no session ID, anonymous ID, SQL, stack, raw provider message or payload | `PASS_HOST` |
| Scope audit | No migration `002`, partial/generic reset, reset-path `deleteDatabase`, Settings UI, provider SDK hoặc Product behavior | `PASS_HOST` |
| Native harness | Isolated success/failure databases, production coordinator/adapter/bootstrap, 12 stable assertions và exact cleanup runbook | `PASS_NATIVE_IOS` |

Automated checks dùng pinned Node.js `22.23.2` và pnpm `11.24.0`:

- Targeted reset contracts/diagnostics/real-SQLite suites: `PASS`, `20/20` cases trong final run.
- `pnpm quality`: `PASS`.
  - Domain/Application/Mobile strict typecheck: `PASS`.
  - ESLint workspace: `PASS`.
  - Vitest: `24` files / `147` tests pass.
  - Device harness: `PASS`, gồm confirmed-reset runbook/probe source contract.
  - Architecture boundary: `11` forbidden imports rejected, `3` valid imports accepted.
  - Repository hygiene/checksum: `PASS`, đúng một immutable production migration `001`.
- `git diff --check`: `PASS` tại host implementation verification.
- Migration diff audit: không có migration/schema `002`.
- Production reset SQL audit: exact static maintenance adapter; database-file deletion chỉ tồn tại
  ở driver capability và isolated diagnostic cleanup, không reachable từ confirmed reset.
- Không chạy native/EAS build, prebuild hoặc tạo native artifact.

Manual owner gate:
[`apps/mobile/test/device/confirmed-reset-smoke.md`](../../apps/mobile/test/device/confirmed-reset-smoke.md).
### 18.1. Exact owner native report

Owner-provided iOS report được tiếp nhận ngày 2026-08-29; `commitSha` khớp repository `HEAD` và
report có SQLite runtime version cùng đủ stable assertions:

```json
{
  "probe": "US-02-08_CONFIRMED_RESET",
  "passed": true,
  "platform": "ios",
  "osVersion": "26.5",
  "appVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "795c3cd59abf80225747e36fcc61e4d13afbaa14",
  "sqliteVersion": "3.50.3",
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

Exact report cover real Expo SQLite open/migrate, full product fixture, no automatic invocation,
best-effort cleanup, atomic commit, exact clear/reseed/identity rotation, retained schema/catalog,
fresh bootstrap, injected rollback, concurrency/dispose safety và isolated cleanup. Các preceding
`[PixelDoro][Recovery]` lines là expected probe trace cho recovery/no-auto-reset assertions, không
phải probe failure. Documentation-only closeout không làm stale behavioral evidence.

**Current Story status:** `DONE`.

Planning dependency `US-02-09` đã mở theo authoritative solo order. Both-platform process-kill/
relaunch và Epic exit audit vẫn thuộc Story đó; không tự active trong closeout này.

## 19. `US-02-09` planning baseline — 2026-08-29

- Start gate đạt: `US-02-01` đến `US-02-08` đều `DONE`; latest baseline SHA là
  `795c3cd59abf80225747e36fcc61e4d13afbaa14` với host `24` files / `147` tests và exact iOS
  reset report `12/12` assertions, SQLite `3.50.3`.
- Implementation plan authoritative:
  [`US-02-09_IMPLEMENTATION_PLAN.md`](./US-02-09_IMPLEMENTATION_PLAN.md) `0.2.0` /
  `READY_FOR_IMPLEMENTATION` / implementation `NOT_STARTED`.
- Current gap là final same-SHA both-platform parity và actual process relaunch; prior per-Story
  iOS reports vẫn là supporting evidence nhưng không thay final US-02-09 iOS + Android pair.
- Plan đề xuất một dev-only aggregate runner reuse tám existing probes và một two-phase isolated
  sentinel: phase 1 commit rồi yêu cầu actual terminate/relaunch; phase 2 validate persistence,
  component matrix, normal readiness và cleanup.
- Deterministic injected unavailable/write/fingerprint evidence là bắt buộc. Physical disk-full
  chỉ chạy khi an toàn/khả thi; nếu không, record explicit limitation, không giả native pass.
- Required native pair là một iOS và một Android Development Build target trên exact same final
  behavior/harness SHA. Agent không chạy native/EAS/prebuild; owner thực hiện thủ công.
- `US0209-CONFIRM-01`–`05` đã `APPROVED 2026-08-29`: aggregate/SHA policy, actual relaunch,
  failure limitation, target/runtime matrix và owner-controlled Epic exit authority.
- Không planned migration `002`, Product Timer/Session/Pet/Gamification/UI behavior, provider SDK,
  release artifact hoặc tracked native/generated credential material.
- Chỉ sau host quality, two native reports, complete traceability và explicit owner approval mới
  chuyển `US-02-09`/`EPIC-02` sang `DONE` và mở planning `EPIC-03`.
