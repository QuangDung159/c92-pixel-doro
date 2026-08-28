---
document_id: PIXELDORO_EPIC_02_IMPLEMENTATION_EVIDENCE
title: PixelDoro Mobile MVP — EPIC-02 Implementation Evidence
version: 0.9.0
status: IN_PROGRESS
last_updated: 2026-08-28
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

`US-02-05 — Typed Repository và Mapper Integration` đã hoàn tất production implementation,
host quality/fault/real-SQLite evidence và dev-only native probe/runbook. Story đang
`IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`; chưa `DONE` và chưa mở `US-02-06` cho tới khi
owner gửi exact `US-02-05_TYPED_REPOSITORIES` report trên final implementation SHA.

Không có migration runner/history/checksum, production bootstrap migration,
Timer/Session/Reward/Pet/Inventory/Settings use case, auto-reset, native/EAS build hoặc native
artifact nào được tạo trong implementation turn `US-02-02`.

Repository có ignored native artifacts từ trước turn dưới `apps/mobile/android/` và
`apps/mobile/artifacts/`; chúng không thuộc implementation diff/commit set và không bị sửa/xóa.

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
| Native probe harness | Dev-only isolated `US-02-05_TYPED_REPOSITORIES`, production graph/migration, reopen/rollback/conflict/wrong-scope/cleanup assertions + owner runbook | `READY_OWNER_RUN` |

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

**Current Story status:** `IN_PROGRESS` /
`IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`.

Pending evidence:

1. Owner chạy `US-02-05_TYPED_REPOSITORIES` trên existing development build với exact final SHA.
2. Report `passed: true` đủ `10/10` assertions và cleanup.
3. Đối chiếu SHA, rerun quality nếu cần, rồi thực hiện `US0205-T10` closeout và mới mở
   dependency `US-02-06`.
