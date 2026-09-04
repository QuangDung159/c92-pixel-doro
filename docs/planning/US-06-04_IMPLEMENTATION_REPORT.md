---
document_id: PIXELDORO_US_06_04_IMPLEMENTATION_REPORT
title: PixelDoro US-06-04 — Completion, Reward và Committed Result
version: 0.1.0
status: IMPLEMENTED_PENDING_OWNER_QUICK_UI
story: US-06-04
date: 2026-09-04
owner: Dũng Lư
branch: feats/epic-06
implementation_start_sha: 7d9f93eb496120988bc2f945ec9084de2c58b8a9
implementation_candidate: UNCOMMITTED_WORKING_TREE
exact_implementation_sha: PENDING_COMMIT
manual_device_status: NOT_RUN
owner_acceptance_status: PENDING_QUICK_UI
formal_tester_status: DEFERRED_TO_LATER_PHASE
language: vi
---

# US-06-04 Implementation Report

## 1. Outcome

Đã triển khai working-tree candidate theo `US0604-CONFIRM-01`→`11` **Option A**, owner duyệt
ngày 2026-09-04. Chưa commit/push và chưa coi Story owner-accepted.

- Standard Relax/Strict hết giờ dùng một reconciliation service, timestamp từ durable session.
- XP bằng configured minutes, Coin bằng floor(minutes/5), không cộng overtime hoặc Strict multiplier.
- Session completed + unique receipt `focus_completed` + profile delta commit atomically.
- Duplicate/retry/reopen không cấp thưởng lần hai; lỗi ghi/postcondition/commit rollback.
- Exact-ID Result đọc session/receipt/profile trong một transaction không ghi dữ liệu.
- Completed hiển thị reward và tiến trình hiện tại; failed/cancelled giữ 0/0; production exit Home-only.
- Fresh completion yêu cầu Celebrate; existing Result không replay; Pet failure không ảnh hưởng reward.
- Home refresh profile sau commit; giữ exact handoff nếu hydration lỗi để Recovery Retry không mất ID.
- Production Result không còn fallback sang prototype reward. Trial vẫn dùng committed Result riêng.

## 2. Architecture / ownership

Domain có `calculateStandardFocusReward`, dùng validation duration hiện tại; test toàn bộ 22 valid
durations và invalid inputs. Application tách internal completion transaction, shared terminal validator
và `LoadStandardFocusResultUseCase`. Loader/screen/branch cũ mang tên cancelled được thay bằng tên
generalized Result; không để public aliases song song hoặc giữ hai grant writers.

`ReconcileStandardFocusUseCase` dùng shared session-command coordinator, một transaction, Strict
decision helper hiện hữu. CAS miss đọc exact terminal winner; không insert receipt/profile delta.
Fresh postcondition xác nhận exact session/receipt/reward/timestamps và profileBefore + deltas,
đồng thời chặn safe-integer overflow. Existing result validate identity/reward facts/current balances;
không dùng một receipt để suy ra tổng ledger hoặc cấm Coin đã được chi tiêu.

Startup và runtime dùng cùng Standard reconcile instance. Fresh startup commit báo durable data
changed để bootstrap hydrate profile. Runtime hydrate profile/Pet trước publish route handoff và request
feedback đồng bộ, tránh Result consume outcome khi post-commit read còn pending. Profile read lỗi vẫn
giữ ID và vào Recovery; Pet read/animation lỗi được giới hạn ở visual boundary.

Standard route arbitration đợi reader hoàn tất, không redirect phiên mới/Trial sang outcome cũ.
First-use entry ưu tiên active session mới trước outcome cũ chưa consume. Dev confirmed reset cũng
clear runtime outcome. Public completed/failed/consume callbacks vẫn bound, có detached regression.

## 3. UI reuse

Reuse `ScreenShell`, `ScreenHeader`, `Panel`, `RewardSummary`, `StatDisplay`, `PetVisualStatus`,
`InlineNotice`, buttons và error/loading surfaces. `ProgressionSummary` là common presentational
component mới, dùng chung cho Trial và Standard; không chứa reward math/persistence/navigation.
Consumer tests Trial + Standard đều pass.

UI file line-count tại candidate: Result route 16, Standard branch 48, Trial branch 39,
Standard Result screen 87, common progression 24, Session route 195; không vượt 300 dòng.
Prototype later-Epic files vẫn giữ riêng, không được dùng làm fallback cho production Result.

## 4. SQLite / correctness evidence

`standard-focus-completion.integration.test.ts`: **23 tests** dùng host `node:sqlite`, production
migration/repositories/transaction; production Start tạo valid session, không fake duration dưới 15.

- 15/25/120 phút, late reconciliation, duplicate concurrent requests dưới coordinator, close/reopen.
- Transition failure, receipt failure, unique receipt conflict, profile write/missing/conditional miss,
  wrong profile postcondition, post-read failure, integer overflow và injected COMMIT failure.
  Kiểm tra sau rollback session running, no receipt, profile không tăng; Retry fresh rồi existing.
- COMMIT failure là driver fault injection trước SQL COMMIT trên SQLite thật, không phải OS crash test.
- Strict thiếu evidence/deadline-first complete; exact equality/violation-first fail, không receipt.
- Cancel-first immutable, Cancel tại deadline bị từ chối, completion-first không cancel lại được.
- Receipt/profile one-shot fixtures dùng transaction thật; Result-read failure Retry chỉ đọc.
- Purchase `desk-mug` thực sự debit 5 Coin, tạo purchase receipt và owned item; reopen Result vẫn
  thưởng 25/5, current balance 0. SQL xác nhận XP = reward ledger, Coin = reward + purchase ledger,
  một reward receipt/session.
- Fresh startup completion mở exact Result và Home snapshot mới; dispose/reboot sau commit về Home,
  outcome/Pet feedback idle; exact Result reread giữ reward/tổng.

Unit coverage bổ sung CAS completed/cancelled/missing/running winner; malformed/foreign session;
missing/wrong receipt reason/profile/delta/time; unsafe profile; unexpected receipt cho failed/cancelled;
fresh/existing lifecycle, post-commit profile read failure, delayed hydration, visual failure isolation,
stale navigation và detached completed callback. Existing Strict/Trial/Pet/reset suites vẫn chạy đầy đủ.

## 5. Verification đã chạy

Runtime: Node **22.23.2**, pnpm **11.24.0**, thông qua PATH pinned của repo.

```sh
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
pnpm run quality
```

- Full quality: **PASS**; Domain/Application/Mobile typecheck, lint không warning/error.
- Root Vitest: **110 files / 613 tests PASS**.
- Device harness validator: PASS, có checklist completion mới; không phải device execution.
- Boundaries: 11 forbidden imports rejected, 3 valid imports accepted.
- Repository hygiene: PASS; 1 immutable migration, không signing/dependency drift.
- Expo iOS JS export: PASS, **1707 modules**; output ngoài repo:
  `/private/tmp/pixeldoro-us0604-ios-final-20260904`.
- `git diff --check`: PASS. Native build/prebuild/device UI không chạy.

Export chạy `expo export --platform ios` trong mobile bằng Node22. Shell có warning RVM `ps` sandbox
và Metro có color-env warning; command exit 0, bundle được tạo. Host SQLite có experimental warning
của Node22; không ảnh hưởng test pass.

## 6. Owner quick UI handoff

Guide: [Standard Focus completion smoke](../../apps/mobile/test/device/standard-focus-completion-smoke.md).

Fixture `standard_completion_fast_clock`: 15 phút trong khoảng 30 giây thật. Receipt/profile/result-read
one-shot fixtures cùng factor x30; dev Result có **Đọc lại kết quả đã lưu**. Mỗi fixture chỉ bật trong
development build; dữ liệu vẫn là valid production session. Không dùng accelerated runtime anchor
qua cold restart để kết luận timestamp behavior. Test startup overdue bằng clock thường/controlled clock.

- [ ] Owner quick UI 15/Relax → +15/+3 → Home đúng tổng, không stale Trial redirect.
- [ ] Strict completion/failure và Cancel popup không crash; đúng 0/0 hoặc configured reward.
- [ ] Read-only reload không cấp/replay; Recovery Retry không double grant.
- [ ] Offline, Reduce Motion, large text, screen reader, ảnh/video + device/OS/build evidence.
- [ ] Owner chấp nhận candidate và ghi exact committed SHA sau khi được yêu cầu commit.

## 7. Option A limitations / scope audit

Nếu process đã commit rồi chết trước Result, next startup không có active session/runtime handoff:
**về Home với totals đúng**, không tự chọn latest Result. Exact-ID reopen đọc same committed facts,
no replay. Không có durable viewed marker/guaranteed auto-restore unseen Result theo confirmation 07.

Không thay schema/migration/trigger/index, package manifest/lockfile, dependency, Expo/native config,
notification/analytics/audio/haptic provider; không Break/pause/resume/native blocking. Không sửa normative
Core/specification/architecture. Shop purchase chỉ là integration fixture để kiểm tra current balance.

US-06-04 đã triển khai, nhưng exact commit, owner UI acceptance và formal device evidence còn mở.
US-06-05 chưa bắt đầu; formal tester giữ `DEFERRED_TO_LATER_PHASE`.
