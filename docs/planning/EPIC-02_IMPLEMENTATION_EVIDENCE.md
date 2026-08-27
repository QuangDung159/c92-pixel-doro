---
document_id: PIXELDORO_EPIC_02_IMPLEMENTATION_EVIDENCE
title: PixelDoro Mobile MVP — EPIC-02 Implementation Evidence
version: 0.2.0
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
---

# PixelDoro Mobile MVP — EPIC-02 Implementation Evidence

## 1. Kết luận hiện tại

`US-02-01 — SQLite Ownership và Transactional Kernel` đã `DONE`. Host evidence và exact
Expo native runtime probe đều pass trên implementation commit
`a75ecc9112c2aa279bee9a818d9c97e586b84b21`; repository `HEAD` đã được đối chiếu đúng SHA
này khi tiếp nhận report ngày 2026-08-28.

Không có normative schema/migration, Timer/Session/Reward/Pet/Inventory/Settings behavior,
auto-reset, native/EAS build hoặc native artifact nào được tạo trong implementation turn này.

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
