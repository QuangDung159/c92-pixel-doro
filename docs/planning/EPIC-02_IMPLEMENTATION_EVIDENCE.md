---
document_id: PIXELDORO_EPIC_02_IMPLEMENTATION_EVIDENCE
title: PixelDoro Mobile MVP — EPIC-02 Implementation Evidence
version: 0.4.0
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

Dependency gate sang `US-02-03` đã mở ở mức ready-for-planning. Story sau vẫn `NOT_STARTED`;
`EPIC02-INPUT-02` chưa được resolve và không có Story thứ hai tự active trong closeout này.
