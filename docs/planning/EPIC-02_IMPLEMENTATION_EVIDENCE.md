---
document_id: PIXELDORO_EPIC_02_IMPLEMENTATION_EVIDENCE
title: PixelDoro Mobile MVP — EPIC-02 Implementation Evidence
version: 0.1.0
status: AWAITING_OWNER_NATIVE_RUNTIME
last_updated: 2026-08-27
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

Implementation và host evidence của `US-02-01 — SQLite Ownership và Transactional Kernel`
đã hoàn tất trên working tree dựa trên commit `12ea70d`. Story chưa được đánh dấu `DONE`
vì exact Expo native runtime probe theo `EPIC02-INPUT-01` cần owner chạy thủ công trên
development build và ghi final commit SHA/platform report.

Không có normative schema/migration, Timer/Session/Reward/Pet/Inventory/Settings behavior,
auto-reset, native/EAS build hoặc native artifact nào được tạo trong implementation turn này.

## 2. `US-02-01` implementation evidence

| Capability | Repository evidence | Automated status |
|---|---|---|
| Compatible SQLite dependency | `expo-sqlite ~57.0.2`, Expo config plugin mặc định, root lockfile và minimum-release-age allowlist | `PASS` |
| Application-owned contract | Opaque `TransactionScope`, result-aware `TransactionPort`, stable `TransactionTechnicalError` | `PASS` |
| Connection ownership | `SQLiteDatabaseOwner` open single-flight, FK enable/readback, close/lease coordination, stable close-failed state | `PASS_HOST` |
| Transaction kernel | Same owner connection; static `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK`; returned-failure/throw rollback | `PASS_HOST` |
| Scope safety | Executor chỉ resolve khi scope active; stale scope reject; no raw connection trên facade | `PASS_HOST` |
| Concurrency | Nested/overlapping transaction reject deterministic bằng `TRANSACTION_BUSY` | `PASS_HOST` |
| Parameter binding | Executor bắt buộc params; injection-shaped string được truyền tách khỏi SQL | `PASS_HOST` |
| Error mapping | Open/close/begin/work/commit/rollback failures map về application-owned code; raw exception không tới Presentation | `PASS_HOST` |
| Async application lifecycle | Boot mở/verify DB trước ready; repeated boot/dispose idempotent; dispose-during-open không late-ready | `PASS_HOST` |
| Architecture enforcement | Driver import chỉ hợp lệ trong database Infrastructure; route/Presentation/Application/composition/non-database Infrastructure bị chặn | `PASS` |
| Native runtime probe | Dev-only, explicit-flag harness trên exact probe DB; no product route; structured report/cleanup | `READY_OWNER_RUN` |

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

## 4. Native runtime acceptance — owner action required

Chạy theo
[`apps/mobile/test/device/sqlite-kernel-smoke.md`](../../apps/mobile/test/device/sqlite-kernel-smoke.md)
trên native platform có development build khả dụng trước:

```sh
EXPO_PUBLIC_SQLITE_KERNEL_PROBE=1 EXPO_PUBLIC_COMMIT_SHA=<commit-sha> pnpm start
```

Gắn structured log `[PixelDoro][SQLiteKernelProbe]` vào mục này và ghi:

| Field | Owner evidence |
|---|---|
| Platform / OS / device | `PENDING` |
| App version | `PENDING` |
| Final implementation commit SHA | `PENDING` |
| `expo-sqlite` version | `57.0.2` |
| Probe result | `PENDING` — yêu cầu `passed: true` |
| Probe DB cleanup | `PENDING` |

Probe phải chứng minh trên exact native runtime:

- FK bật trên connection và invalid child insert bị reject.
- Commit còn tồn tại sau close/reopen.
- Returned failure và thrown failure không để lại partial row.
- SQL-shaped value được lưu như bound data.
- Overlap trả `TRANSACTION_BUSY`.
- Close/dispose lặp an toàn và exact probe DB được cleanup.

Owner unset `EXPO_PUBLIC_SQLITE_KERNEL_PROBE` sau run. Both-platform repeat vẫn thuộc
`US-02-09`; một native target pass là gate còn lại để đóng `US-02-01`.

## 5. Acceptance status

| `US-02-01` acceptance | Status |
|---|---|
| Dependency/lockfile compatible | `PASS` |
| Single owner và architecture boundary | `PASS` |
| Application-scoped lifecycle/dispose | `PASS_HOST`; native repeat pending |
| Foreign-key enable/enforcement | `PASS_HOST`; `PENDING_NATIVE` |
| Commit success | `PASS_HOST`; `PENDING_NATIVE` |
| Returned-failure/throw rollback | `PASS_HOST`; `PENDING_NATIVE` |
| Nested/overlap deterministic | `PASS_HOST`; native probe pending |
| No side-effect capability trong transaction scope | `PASS` |
| Parameter binding | `PASS_HOST`; native probe pending |
| Typed failure/no raw provider leak | `PASS_HOST` |
| Architecture checks | `PASS` |

**Current Story status:** `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`.

`US-02-02` vẫn bị block cho tới khi native report pass, evidence được owner review và
`US-02-01` được đánh dấu `DONE`.
