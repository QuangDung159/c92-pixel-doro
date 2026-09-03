---
document_id: PIXELDORO_US_06_03_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-06-03 Strict Mode Lite, grace evidence, reconciliation và failed outcome plan
version: 0.1.0
status: PROPOSED_OWNER_REVIEW
implementation_status: NOT_STARTED
date: 2026-09-03
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-06
planning_baseline_sha: 9a8e3d87d44612b7bd9aa8bf9e592099300d9e2e
implementation_start_sha: PENDING_OWNER_APPROVAL
us_06_02_implementation_sha: 9a8e3d87d44612b7bd9aa8bf9e592099300d9e2e
us_06_02_acceptance: OWNER_QUICK_UI_ACCEPTED_TO_OPEN_PLANNING
formal_tester_status: DEFERRED_TO_LATER_PHASE
scope:
  - mobile_mvp
  - epic_06
  - us_06_03
  - strict_mode_lite
  - durable_background_evidence
  - grace_and_deadline_precedence
  - foreground_and_startup_reconciliation
  - failed_result
  - fresh_pet_bugged
authority: PLANNING
story_baseline: ./EPIC-06_USER_STORIES.md
previous_story_plan: ./US-06-02_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-06-02_IMPLEMENTATION_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
ux_baseline: ./EPIC-03_UX_PROTOTYPE_PLAN.md
timer_baseline: ../specifications/timer-engine.md
session_baseline: ../specifications/session-lifecycle.md
pet_baseline: ../specifications/pet-state-machine.md
gamification_baseline: ../specifications/gamification-rules.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
adr_navigation: ../architecture/decisions/ADR-002-navigation-with-expo-router.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-06-03 — Strict Mode Lite, grace evidence, reconciliation và failed outcome

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan owner-gated cho Story thứ ba của EPIC-06. Lượt lập plan chỉ
thay đổi tài liệu; **không triển khai production code US-06-03**, không đổi schema/migration, không
thêm dependency/native config và không tự đánh dấu acceptance test là pass.

**Story outcome:** một Standard Focus `strict/running` dùng durable lifecycle evidence để quyết định
chính xác: quay lại an toàn trước grace/deadline thì tiếp tục và clear episode; vắng đủ 10 giây với
`violationAt <= endsAt` thì commit `failed` zero reward; relaunch dùng cùng precedence và không bao
giờ đoán failure khi thiếu evidence. Failed Result đọc exact committed session, Home-only; Pet
Bugged chỉ phát một lần từ fresh failed commit.

**Priority:** `P0`; execution order `03` trong EPIC-06.

**Planning status:** `PROPOSED_OWNER_REVIEW`.

**Implementation status:** `NOT_STARTED`. Owner cần duyệt các confirmation ở mục 13 trước production
edit. Default proposal cho toàn bộ confirmation là **Option A**.

### 0.1. Gate được mở từ US-06-02

- [x] US-06-02 exact implementation SHA:
  `9a8e3d87d44612b7bd9aa8bf9e592099300d9e2e`.
- [x] Branch/upstream tại lúc audit: `feats/epic-06` / `origin/feats/epic-06`.
- [x] Working tree sạch trước lượt planning.
- [x] US-06-02 automated/SQLite/quality/iOS bundle evidence đã được ghi nhận.
- [x] Owner báo cáo đã test nhanh UI và yêu cầu mở planning US-06-03.
- [ ] Full structured manual matrix của US-06-02 chưa có artifact chi tiết; không được ghi giả pass.
- [ ] Formal tester vẫn `DEFERRED_TO_LATER_PHASE`.

### 0.2. Ranh giới bắt buộc

- `US-06-03` sở hữu Strict background evidence, 10-second grace, failed transition, failed Result và
  fresh Bugged.
- `US-06-04` sở hữu Standard completion, reward receipt/profile delta, completed Result và Celebrate.
- Story 03 có thể **phân loại** `completion_due` để giữ precedence đúng nhưng không được commit
  `completed`, reward hoặc mở completed Result.
- `US-06-05` sở hữu notification/analytics provider và Epic exit a11y đầy đủ.
- EPIC-07 sở hữu Break. Failed/cancelled Result không hiện Start Break.
- Strict Lite không khóa app khác, không pause/resume, không dùng heartbeat và không thêm penalty.

## 1. Authority contract

| Authority | Contract áp dụng cho US-06-03 |
|---|---|
| Product Core | Strict Lite grace đúng 10 giây; companion-first; không native app blocking hay guilt-heavy penalty. |
| Timer Engine | `violationAt=backgroundedAt+10_000`; failed khi evidence tồn tại, `now>=violationAt` và `violationAt<=endsAt`; terminal persisted luôn thắng. |
| Session Lifecycle | Background/foreground/startup/cancel serialized; safe return clear evidence atomically; missing evidence không suy diễn failure. |
| Data Model | Dùng existing `sessions.backgrounded_at/status/resolved_at/reward`; no schema change; conditional transaction là backstop. |
| Pet State | Chỉ fresh committed Strict failed request Bugged; 1.500 ms; reopen/relaunch không replay. |
| Gamification | Failed có `0 XP / 0 Coin`, không receipt, không profile delta. |
| Architecture | Domain decision thuần; Application sở hữu orchestration; lifecycle adapter chỉ chuyển event; route/screen không tính precedence. |
| EPIC-06 story | Reuse Running/Result/Pet, exact boundaries, safe recovery, Relax/trial/Break regressions. |

Nếu plan này mâu thuẫn authority cao hơn, authority cao hơn thắng và plan phải sửa trước khi code.

## 2. Current-state audit tại baseline

### 2.1. Capability đã có và cần tái sử dụng

- Standard Start đã persist valid Strict record với `backgroundedAt=null`, reward zero và exact
  configured timestamps.
- `StandardFocusSessionController` đã có clock/scheduler/visibility cho Relax và typed
  `strict_handoff`; đây là controller cần evolve thành shared Standard Running projection.
- `SessionCommandCoordinatorPort` đã serialize Start/Cancel/Trial completion; lifecycle/reconcile phải
  dùng cùng coordinator, không tạo mutex thứ hai.
- `SessionRepository` đã có exact reads, active reads, conditional terminal transition và
  `recordBackgroundedAtInTransaction` cho active Standard Strict.
- SQLite schema/index/check đã có `backgrounded_at`; migration `001` đủ capability.
- `CriticalRecoveryPort`/bootstrap đã có runtime recovery và đóng readiness cho uncertain durable
  writes.
- `PetTerminalFeedbackController` đã validate fresh Standard Strict failed, dedupe/no-replay và
  fallback; thiếu bridge từ Standard reconciliation commit.
- Standard Result hiện đọc exact cancelled identity và Home-only, là nền để generalize failed
  variant mà không dùng latest-terminal fallback.
- Startup adapter hiện giữ trial reconciliation rồi validate Standard active record; đây là seam để
  đưa Strict reconciliation vào một active-session boundary.

### 2.2. Gap phải xử lý

1. Không có pure Domain decision cho grace/deadline/missing-evidence precedence.
2. Lifecycle root không capture background timestamp trước khi enqueue và chưa persist Strict episode.
3. Repository chưa có conditional clear `backgroundedAt` theo exact episode.
4. Existing record-background update chưa bảo vệ stale callback bằng episode/update-time contract.
5. Foreground/startup chưa reconcile Strict, chưa có barrier chống flash stale Running/Home.
6. Strict vẫn ở `strict_handoff`, chưa có countdown, grace notice và production Cancel behavior.
7. Cancel hiện chỉ nhận Relax; nếu mở thẳng cho Strict có thể cho user né violation đã đủ evidence.
8. Result reader chỉ nhận `relax/cancelled`, chưa nhận `strict/failed` invariant.
9. Fresh failed commit chưa được giữ làm exact navigation handoff và Pet Bugged event qua startup.
10. Deadline-completion writer chưa tồn tại và phải tiếp tục thuộc US-06-04.

### 2.3. Kết luận schema/dependency

Audit không tìm thấy schema gap. Proposed decision:

- `NO SCHEMA CHANGE` và `NO MIGRATION 002`;
- chỉ mở rộng existing repository port bằng conditional clear/stronger episode CAS;
- `NO PACKAGE/LOCKFILE CHANGE`;
- `NO EXPO/NATIVE CONFIG CHANGE`;
- `NO NOTIFICATION/ANALYTICS PROVIDER` trong Story này.

Nếu implementation phát hiện contradiction thật, dừng và đưa evidence cho owner; không tự mở rộng.

## 3. Canonical Strict decision

### 3.1. Inputs và validation

Domain nhận immutable facts: `startedAt`, `endsAt`, optional `backgroundedAt`, captured `now`. Mọi
timestamp phải là non-negative safe integer; `endsAt > startedAt`; phép cộng grace phải chống
overflow. Invalid input trả typed `invalid`, không tự repair.

### 3.2. Decision order

```text
terminal row                       → persisted terminal wins outside this decision
no backgroundedAt + now < endsAt  → running_no_evidence
no backgroundedAt + now >= endsAt → completion_due

violationAt = backgroundedAt + 10_000

now >= violationAt
AND violationAt <= endsAt          → failed_due

now >= endsAt                      → completion_due

otherwise                          → running_safe_clear
```

Order là contract: equality `violationAt == endsAt` phải fail; `endsAt < violationAt` không được
fail và chuyển `completion_due` khi deadline tới. Story 03 không mutate completed trong branch này.

### 3.3. Proposed Domain API

```ts
type StrictReconciliationDecision =
  | { readonly outcome: 'running_no_evidence' }
  | {
      readonly outcome: 'running_safe_clear';
      readonly expectedBackgroundedAt: number;
    }
  | {
      readonly outcome: 'failed_due';
      readonly expectedBackgroundedAt: number;
      readonly violationAt: number;
    }
  | { readonly outcome: 'completion_due'; readonly endsAt: number }
  | { readonly outcome: 'invalid'; readonly reason: StrictDecisionInvalidReason };

decideStrictReconciliation(input): StrictReconciliationDecision
```

Domain không đọc DB, không gọi clock, không clear field, không cấp reward và không tạo UI copy.

## 4. Target user flows

### 4.1. Strict Running trước khi rời app

1. Controller đọc exact durable Standard Strict running record.
2. Countdown dùng existing shared timestamp projection; không tích lũy interval.
3. UI hiển thị rõ “Strict · grace 10 giây”, configured duration/tag và Pet Working.
4. Cancel dùng same confirmation UX; hardware back đi qua same authority.

### 4.2. App rời foreground

1. Lifecycle boundary capture `backgroundedAt=clock.nowMs()` **trước** khi enqueue async work.
2. Visual tick/Pet animation dừng ngay.
3. Application-scoped lifecycle controller enqueue command vào shared session coordinator.
4. Transaction đọc active record và chỉ ghi khi valid Standard Strict running, episode đang null,
   timestamp trước deadline và callback không stale.
5. Duplicate background giữ earliest active episode; không kéo dài grace bằng callback sau.
6. Read/write/transaction uncertainty vào critical recovery; app không tiếp tục giả Strict an toàn.

### 4.3. Foreground an toàn

1. Capture foreground `now` tại lifecycle boundary và đặt Standard projection vào `reconciling`.
2. Shared coordinator/transaction đọc current exact truth.
3. Domain trả `running_safe_clear` nếu `now < violationAt` và `now < endsAt`.
4. Repository clear chỉ đúng `sessionId + expectedBackgroundedAt` trong transaction.
5. Conditional miss re-read winner: terminal wins; episode mới hơn không bị callback cũ clear.
6. Sau commit/read ổn định mới refresh Session/Pet và mở visible Running countdown.

### 4.4. Proven violation

1. Foreground/startup/deadline/cancel guard đều gọi cùng Strict reconcile authority.
2. `failed_due` dùng conditional `running→failed` trong transaction.
3. Persist `resolvedAt=updatedAt=captured now`, `XP=0`, `Coin=0`, `rewardClaimedAt=null`; không receipt.
4. Conditional miss re-read exact winner; không overwrite terminal.
5. Chỉ fresh `failed` commit tạo runtime outcome handoff.
6. Route exact `/focus/result?sessionId=<id>`, Result đọc committed failed row.
7. Pet base refresh rồi request Bugged từ fresh event; feedback failure không rollback session.

### 4.5. Deadline trước violation hoặc thiếu evidence

1. Nếu `endsAt < violationAt`, failure không hợp lệ kể cả `now` đã qua grace.
2. Nếu relaunch không có persisted `backgroundedAt`, không đoán user đã rời app.
3. Khi `now >= endsAt`, Domain trả `completion_due`.
4. Story 03 giữ controlled `deadline_pending`; không clear evidence cần cho audit, không commit
   completed/reward, không mở Result giả.
5. US-06-04 sẽ consume cùng decision để commit completion/reward exactly once.

### 4.6. Relaunch

1. Bootstrap migration/readiness hoàn thành và active-session reconciliation chạy trước route truth.
2. Trial vẫn dùng existing trial strategy; Standard Strict dùng shared Strict strategy.
3. Persisted violation có thể fresh-commit failed trong startup và tạo exact runtime handoff.
4. Entry navigation consume handoff để mở failed Result thay vì rơi Home sau `findActive=null`.
5. Already-failed terminal được mở lại theo exact navigation thì không tạo fresh event/Bugged replay.

### 4.7. Cancel race

1. Strict Cancel và lifecycle/reconcile dùng same coordinator.
2. Cancel transaction đọc evidence và chạy pure decision tại captured `now` trước terminal write.
3. Nếu `failed_due`, Cancel không được thắng; reconcile commits/read-winner và UI đi failed Result.
4. Nếu chưa violation, trước deadline, Cancel được commit `cancelled` zero reward như Relax.
5. Nếu Cancel commit trước một delayed background callback, callback re-read terminal và no-op.
6. Nếu deadline due, giữ `deadline_pending`; không cho overdue Cancel lấy mất future completion.

## 5. Target architecture

```text
Native AppState event
      │ capture timestamp synchronously
      ▼
StandardFocusLifecycleController
      │
      ├── background ─► RecordStrictBackgroundUseCase
      │
      └── active/startup/cancel guard
                         │
                         ▼
              ReconcileStandardFocusUseCase
                         │
            SessionCommandCoordinatorPort
                         │
                  TransactionPort
                         │
        Domain decision + SessionRepository CAS
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
  running/clear     completion_due    fresh failed commit
        │                │                 │
 Running projection  pending US-04   exact Result handoff
                                           │
                                  Pet fresh Bugged bridge
```

### 5.1. Ownership rules

- Lifecycle adapter: capture/forward native event only; không tính grace/deadline.
- Lifecycle controller: sequence, single-flight, barrier/recovery orchestration.
- Use case: exact read, domain decision, conditional transaction, race classification.
- Domain: pure precedence.
- Repository: conditional persistence only.
- Presentation: render typed projection và route committed handoff only.
- Pet controller: transient feedback only; không quyết định session status.

## 6. Application contracts

### 6.1. Record background command

Proposed outcomes:

```ts
type RecordStrictBackgroundOutcome =
  | { readonly outcome: 'recorded'; readonly sessionId: string }
  | { readonly outcome: 'already_recorded'; readonly sessionId: string }
  | { readonly outcome: 'no_active_session' }
  | { readonly outcome: 'not_strict_standard' }
  | { readonly outcome: 'deadline_pending'; readonly sessionId: string }
  | { readonly outcome: 'stale_event'; readonly sessionId: string };
```

Rules:

- timestamp capture bên ngoài queue nhưng validation trong transaction;
- chỉ `focus/standard/strict/running`;
- `capturedAt >= endsAt` không mở episode mới; deadline branch để reconcile;
- backgroundedAt đã tồn tại → preserve earliest active episode;
- stale callback không được restore episode đã clear;
- technical uncertainty map về typed error rồi enter recovery.

### 6.2. Repository clear/CAS

Proposed port input:

```ts
interface ClearSessionBackgroundInput {
  readonly sessionId: string;
  readonly expectedBackgroundedAt: number;
  readonly updatedAt: number;
}
```

SQL condition phải gồm exact ID, `running/focus/standard/strict` và
`backgrounded_at = expectedBackgroundedAt`. Để chặn delayed pre-foreground background callback,
record-background contract phải reject timestamp không mới hơn durable `updatedAt`; safe clear ghi
`updatedAt=foregroundCapturedAt`.

### 6.3. Reconciliation outcomes

```ts
type ReconcileStandardFocusOutcome =
  | { readonly outcome: 'no_active_session' }
  | { readonly outcome: 'not_owned' }
  | { readonly outcome: 'running'; readonly sessionId: string }
  | { readonly outcome: 'safe_episode_cleared'; readonly sessionId: string }
  | { readonly outcome: 'completion_due'; readonly sessionId: string }
  | {
      readonly outcome: 'failed';
      readonly sessionId: string;
      readonly freshness: 'fresh_commit' | 'existing_terminal';
      readonly resolvedAt: number;
    }
  | { readonly outcome: 'terminal_winner'; readonly sessionId: string };
```

Only `fresh_commit` may produce navigation/Pet fresh event. `existing_terminal` is idempotent truth,
not a replay instruction.

### 6.4. Runtime outcome handoff

Startup failed commit happens before `FirstUseEntryController` reads active session; without a typed
handoff it would route Home because failed is no longer active. Add application-scoped
`StandardFocusOutcomeHandoffController`:

- stores only current runtime fresh terminal outcome, never durable history;
- exact `sessionId/status/resolvedAt`, generation-safe and consume-on-navigation;
- FirstUse Entry returns parameterized `standard_focus_result` destination before Home;
- foreground Session route observes same handoff and replaces exact Result only after commit;
- handoff loss never changes durable truth; exact Result can still be opened from valid navigation;
- reopening an existing failed Result does not reconstruct freshness or Bugged.

Prefer destination as a discriminated object carrying `sessionId`, not a global “latest failed” lookup.

### 6.5. Critical recovery

Any uncertain Strict lifecycle persistence is correctness-critical:

- background read/write/transaction failure;
- foreground reconcile read/clear/terminal transaction failure;
- corrupt/overflow timestamp;
- conditional miss whose winner cannot be re-read;
- startup reconciliation failure.

Controller calls `CriticalRecoveryPort.enterRecovery` with existing finite reason mapping and closes
readiness through bootstrap. Retry reboots/reconciles durable truth. UI không cho session tiếp tục
với untrusted Strict evidence.

## 7. Running, Result và Pet presentation

### 7.1. Strict Running

Reuse Standard Running screen/component tree:

- same timestamp countdown, duration/tag card và Pet Working;
- mode label `Strict` + concise grace notice;
- `reconciling` disables controls and shows non-final status;
- `deadline_pending` shows Story-04 handoff; Cancel disabled;
- no countdown live announcement per second;
- no background arithmetic or local grace timer in React component.

### 7.2. Failed Result

Generalize cancelled-only exact reader thành Standard terminal Result reader, nhưng Story 03 chỉ mở:

- `relax|strict / cancelled` with existing invariant;
- `strict / failed` with zero reward and valid terminal timestamps/evidence;
- `completed` remains typed not-owned until US-06-04.

Failed UI:

- exact `sessionId` required; no latest fallback;
- neutral explanation that Strict grace was exceeded;
- `0 XP`, `0 Coin`; no reward claim/celebration;
- Home-only action; no Start Break/Focus Again;
- meaning is not color/motion-only; large text remains scrollable.

### 7.3. Pet feedback order

1. Failed transaction commits.
2. Re-read/refresh Pet base from durable active truth.
3. Typed Standard bridge sends fresh failed transition with exact current Result session ID.
4. Bugged may play once for 1.500 ms; Reduce Motion gets static equivalent.
5. Visual failure falls back without changing session/navigation.
6. Relaunch/reopen/existing terminal does not replay.

## 8. Race and idempotency matrix

| Race | Required winner |
|---|---|
| Duplicate background callbacks | First valid active episode remains; duplicate no-op. |
| Background queued, foreground captured later | Background persists, foreground decision sees same episode and clears/fails. |
| Foreground clear commits, old background callback arrives late | Old callback rejected by captured timestamp vs durable `updatedAt`. |
| New background after safe clear | Newer timestamp opens a new episode. |
| Cancel before any violation/evidence write | Cancelled terminal wins; later lifecycle command no-op. |
| Evidence exists, Cancel before grace | Cancel may win if still before deadline. |
| Evidence proves violation, Cancel requested | Failed wins; no Cancel escape. |
| `violationAt == endsAt` | Failed wins. |
| `endsAt < violationAt` | Never fail; completion_due when deadline reached. |
| Completion implementation absent | Controlled deadline_pending; no fake terminal. |
| Foreground and startup reconcile overlap | Coordinator serializes; second read classifies committed winner. |
| Failed CAS loses to another terminal | Re-read terminal; never overwrite or emit false fresh event. |
| Process killed with evidence persisted | Startup applies same precedence. |
| Process killed before evidence persisted | Missing evidence; never infer failure. |
| Result reopened after fresh Bugged | Durable Result renders; no feedback replay. |

## 9. File/work-package plan

Exact filenames may be adjusted to existing naming conventions, nhưng ownership không đổi.

### T01 — Record approval/baseline

- Update this plan with selected options, approval date and implementation-start SHA.
- Re-check clean tree and authority drift immediately before first production edit.

### T02 — Pure Domain Strict decision

- Add decision type/function under Domain timer/session ownership.
- Unit table for grace/deadline equality, before/after, missing evidence, invalid/overflow.
- Export only public Domain API; no Application/platform imports.

### T03 — Repository episode CAS

- Add exact conditional clear port/input.
- Strengthen record episode behavior with stale-event protection.
- Implement SQLite queries in existing repository; no migration.
- Mapper/schema stay unchanged; repository unit/integration tests cover conditional misses.

### T04 — Record background use case

- Add transaction/coordinator use case with typed no-op/deadline/stale outcomes.
- Validate exact active identity and preserve earliest episode.
- Map all technical failures without throwing presentation-specific errors.

### T05 — Standard reconcile use case

- Add shared foreground/startup/deadline/cancel-guard reconciliation.
- Use Domain decision, clear CAS or failed terminal CAS, then re-read race winner.
- Keep `completion_due` non-mutating in Story 03.
- Emit freshness only from this call's successful failed update.

### T06 — Strict-aware Cancel

- Extend existing Standard Cancel identity to Strict.
- Run Strict decision before cancel mutation.
- Route `failed_due` through same reconciliation authority; reject deadline pending.
- Preserve Relax behavior and existing cancelled invariant.

### T07 — Lifecycle/startup composition

- Add application-scoped lifecycle controller using shared coordinator.
- Capture timestamps at native boundary before async enqueue.
- Refactor startup adapter into one active-session reconciliation boundary with trial and Standard
  strategies; do not weaken trial invariants.
- Gate visibility/refresh so stale Strict truth is not briefly shown.

### T08 — Runtime outcome handoff/navigation

- Add exact fresh outcome handoff controller.
- Extend FirstUse destination to parameterized Standard Result identity.
- Session route and entry route consume committed handoff, never infer latest result.
- Test generation/dispose/duplicate navigation.

### T09 — Standard Running Strict projection

- Replace `strict_handoff` with timestamp Running/reconciling/deadline projections.
- Reuse common countdown and existing Standard screen.
- Add concise grace copy; no UI timer authority.

### T10 — Failed Result

- Generalize cancelled-only reader/controller to typed terminal Standard Result.
- Add Strict failed invariant and exact query-param branch.
- Reuse Result family; Home-only, no reward/Break/celebration.

### T11 — Fresh Pet Bugged bridge

- Wire fresh failed handoff after durable commit and Pet base refresh.
- Prove dedupe, preemption, Reduce Motion/fallback and no replay.
- No Pet state persistence or new animation dependency.

### T12 — Review fixtures/device guide

- Add finite accelerated clock/lifecycle fixtures using valid production-created 15-minute Strict
  sessions.
- Add one-shot background write/clear/reconcile failures and rapid oscillation fixture.
- Extend confirmed reset only through existing Development Build contract.

### T13 — Automated and SQLite evidence

- Run focused tests during implementation, then full quality/typecheck/lint/Vitest.
- Add real SQLite Start→background→safe clear/fail/reopen journeys.
- Run boundary/hygiene/migration lock and iOS Metro export.

### T14 — Report/exact SHA/owner gate

- Create implementation report with factual pass/fail and scope audit.
- Commit candidate and record exact SHA.
- Owner quick UI may open US-06-04 planning; full manual/formal status remains separate.

## 10. Automated verification matrix

### 10.1. Domain

- [ ] No evidence before deadline → running.
- [ ] No evidence at/after deadline → completion_due, never failed.
- [ ] Foreground at `violationAt-1` and before deadline → safe clear.
- [ ] Foreground at `violationAt` with `violationAt<endsAt` → failed.
- [ ] `violationAt==endsAt` → failed.
- [ ] `endsAt<violationAt`, now at deadline → completion_due.
- [ ] Invalid range, negative, unsafe integer and grace overflow → invalid.

### 10.2. Application

- [ ] Background timestamp captured before queue and persisted serialized.
- [ ] Relax/trial/Break/no-active callbacks do not write Strict evidence.
- [ ] Duplicate episode preserves earliest timestamp.
- [ ] Safe clear is exact-episode CAS and stale callback cannot restore it.
- [ ] Failed commit has zero reward/no receipt/profile write.
- [ ] Conditional miss re-reads terminal/episode winner.
- [ ] Strict Cancel cannot beat already-proven violation.
- [ ] Foreground/startup concurrent requests coalesce/serialize.
- [ ] Technical uncertainty enters recovery.

### 10.3. Presentation/navigation/Pet

- [ ] Strict shares timestamp Running; no `strict_handoff` remains in production flow.
- [ ] Reconciliation barrier prevents stale Running/Home flash.
- [ ] Fresh startup failed handoff routes exact Result.
- [ ] Missing/wrong query identity never falls back to latest/prototype.
- [ ] Failed Result shows zero reward and Home-only.
- [ ] Bugged fires only on fresh failed commit and does not replay on reopen/relaunch.
- [ ] Reduce Motion/static semantics and screen-reader text preserve failure meaning.

### 10.4. Real SQLite journeys

- [ ] Production Start creates valid 15-minute Strict row.
- [ ] Background <10s → foreground clears evidence, row stays running.
- [ ] Background >10s, violation before/equal deadline → failed exactly once.
- [ ] Deadline before violation → row stays running/deadline_pending for US-06-04, never failed.
- [ ] Persist evidence, close/reopen → same precedence and exact session ID.
- [ ] Missing evidence after reopen → no false failure.
- [ ] Failed has no reward receipt/profile delta.
- [ ] Terminal/cancel/clear races preserve winner.

### 10.5. Full gates

- [ ] Root quality/typecheck/lint/Vitest pass.
- [ ] Device harness pass with new Strict guide.
- [ ] Architecture boundary/import checks pass.
- [ ] Repository hygiene/migration/dependency/native drift pass.
- [ ] Expo iOS export/Metro bundle pass.
- [ ] `git diff --check` and changed UI line-count audit pass.

## 11. Manual UI test guide

Target guide: `apps/mobile/test/device/standard-focus-strict-running-smoke.md`.

### 11.1. Preconditions

- Record exact implementation SHA, device/simulator, OS and build version.
- Use Development Build and existing confirmed reset.
- Create Strict via production Setup/Start with valid `15 minutes + work tag`.
- Accelerated fixtures may change injected clock/lifecycle only; persisted config remains valid.

### 11.2. Quick owner path

1. Start Strict; verify countdown, Strict grace notice, tag and Pet Working.
2. Background briefly under 10 seconds; return before deadline; verify Running continues.
3. Use accelerated fixture for >10 seconds with violation before deadline; verify failed Result.
4. Verify `0 XP`, `0 Coin`, no Break, Home-only and Bugged at most once.
5. Reopen same failed Result; verify Bugged does not replay.
6. Relaunch a persisted-evidence fixture and verify same exact outcome.
7. Trigger background-write failure fixture; verify recovery/Retry, not silent Running.

### 11.3. Extended matrix

- Exact equality `violationAt==endsAt` → failed.
- Deadline before violation → deadline pending until US-06-04, never failed.
- Kill/missing evidence → no false failure.
- Cancel before grace works; Cancel after proven violation cannot escape failure.
- Rapid background/active oscillation preserves newest valid episode.
- Offline, screen reader, largest text and Reduce Motion.
- Capture sanitized durable before/after facts and screenshot/video.

Quick owner smoke and formal tester evidence must be recorded separately. Unrun checks stay unchecked.

## 12. Risks và mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Timestamp captured after async delay | shortens grace/false fail | capture synchronously at lifecycle boundary |
| Duplicate background resets grace | Strict can be bypassed | preserve earliest active episode |
| Stale callback restores cleared episode | later false fail | captured timestamp vs `updatedAt` + exact episode CAS |
| UI computes grace | split truth/race drift | pure Domain decision + typed projection only |
| Startup failed commit falls Home | user misses outcome | exact runtime outcome handoff before active read |
| Reopen replays Bugged | repeated punishment | freshness only on successful update in current runtime |
| Cancel evades proven violation | wrong terminal status | Strict decision inside serialized Cancel transaction |
| Story 03 commits completion | steals US-06-04/reward scope | non-mutating `completion_due`/deadline_pending |
| Background write fails silently | unreliable Strict | critical recovery/readiness close |
| Conditional clear removes newer episode | lost evidence | `expectedBackgroundedAt` CAS |
| Result loads latest session | cross-session ambiguity | required exact sessionId + invariant validation |
| New schema/dependency for convenience | migration/native risk | existing column/ports; explicit owner stop gate |

## 13. Owner confirmations — proposed

### US0603-CONFIRM-01 — Pure precedence contract

- **Option A (recommended):** one pure Domain decision with ordered outcomes
  `failed_due → completion_due → safe_clear/running`, equality failure and overflow validation.
- **Option B:** calculate grace separately in each use case.
- **Option C:** calculate in lifecycle/UI.
- **Trade-off:** A creates one testable authority; B/C can diverge at exact boundaries.
- [ ] Owner selected option: `PENDING`.

### US0603-CONFIRM-02 — US-06-03/04 completion boundary

- **Option A (recommended):** Story 03 classifies `completion_due` but leaves row running in a
  controlled `deadline_pending`; never fail when deadline precedes violation; Story 04 commits
  completed/reward.
- **Option B:** implement zero-reward completion now.
- **Option C:** keep evaluating Strict after deadline until grace ends.
- **Trade-off:** A preserves precedence and Story ownership; B creates wrong reward; C can false-fail.
- [ ] Owner selected option: `PENDING`.

### US0603-CONFIRM-03 — Lifecycle timestamp/ownership

- **Option A (recommended):** application-scoped lifecycle controller captures timestamp before
  enqueue and uses shared SessionCommandCoordinator; UI only consumes projection.
- **Option B:** write directly in native AppState callback.
- **Option C:** let Running screen own lifecycle state.
- **Trade-off:** A gives serialization and testability; B/C split command/recovery ownership.
- [ ] Owner selected option: `PENDING`.

### US0603-CONFIRM-04 — Episode idempotency/stale callback

- **Option A (recommended):** preserve earliest active episode; duplicate no-op; safe clear advances
  `updatedAt`; reject stale captured timestamp so old callbacks cannot reopen evidence.
- **Option B:** every background callback overwrites timestamp.
- **Option C:** keep only in-memory generation without durable guard.
- **Trade-off:** A prevents grace extension and false restore across queue/relaunch.
- [ ] Owner selected option: `PENDING`.

### US0603-CONFIRM-05 — Conditional clear port

- **Option A (recommended):** add `clearBackgroundedAtInTransaction` with exact session ID + expected
  episode CAS; reuse existing column/index, no migration.
- **Option B:** unconditional clear by session ID.
- **Option C:** set a sentinel timestamp instead of null.
- **Trade-off:** A cannot delete newer evidence; B races; C violates schema semantics.
- [ ] Owner selected option: `PENDING`.

### US0603-CONFIRM-06 — One reconciliation boundary

- **Option A (recommended):** shared Standard reconcile use case for foreground/startup/deadline and
  Strict Cancel guard, composed under one active-session coordinator alongside existing trial
  strategy; conditional miss always re-reads winner.
- **Option B:** separate startup/foreground writers.
- **Option C:** route-local reconciliation only.
- **Trade-off:** A prevents multiple terminal authorities and stale startup UI.
- [ ] Owner selected option: `PENDING`.

### US0603-CONFIRM-07 — Strict Cancel race

- **Option A (recommended):** allow Strict Cancel before deadline only when persisted evidence at
  captured `now` does not already prove violation; proven violation fails first; coordinator order
  decides genuinely concurrent earlier commands.
- **Option B:** always allow Cancel while row says running.
- **Option C:** disable Cancel for all Strict sessions.
- **Trade-off:** A preserves existing Cancel UX without offering a violation escape hatch.
- [ ] Owner selected option: `PENDING`.

### US0603-CONFIRM-08 — Runtime persistence failure

- **Option A (recommended):** uncertain Strict background/reconcile read/write/transaction enters
  critical recovery; Retry reboots/reconciles durable truth.
- **Option B:** show toast and continue Running.
- **Option C:** assume background evidence was saved.
- **Trade-off:** A never lies about evidence; B/C can create false pass/fail.
- [ ] Owner selected option: `PENDING`.

### US0603-CONFIRM-09 — Failed Result identity/actions

- **Option A (recommended):** exact parameterized session ID, generalized Standard terminal reader,
  Strict failed invariant, zero reward, Home-only; completed remains US-06-04.
- **Option B:** load latest failed Standard session.
- **Option C:** keep failed result only in route memory.
- **Trade-off:** A survives relaunch and prevents cross-session fallback.
- [ ] Owner selected option: `PENDING`.

### US0603-CONFIRM-10 — Fresh outcome handoff/Pet Bugged

- **Option A (recommended):** fresh failed commit creates exact runtime handoff used by entry/session
  navigation and Pet bridge; already-failed reopen/relaunch never recreates freshness or Bugged.
- **Option B:** infer feedback whenever Result status is failed.
- **Option C:** persist a “Bugged played” flag.
- **Trade-off:** A matches existing transient contract with no schema; B replays; C adds durable UI state.
- [ ] Owner selected option: `PENDING`.

### US0603-CONFIRM-11 — Fixtures/evidence/scope

- **Option A (recommended):** valid 15-minute production Start plus finite accelerated clock/lifecycle
  and one-shot failure fixtures; real SQLite + full quality/bundle; no schema/dependency/native/
  notification/analytics change; owner quick UI may gate progression while formal tester stays deferred.
- **Option B:** persist invalid short Strict sessions.
- **Option C:** wait real time and treat automated evidence as manual pass.
- **Trade-off:** A gives fast, truthful boundary evidence without weakening business invariants.
- [ ] Owner selected option: `PENDING`.

## 14. Implementation start checklist sau approval

- [ ] Record owner decision for all eleven confirmations.
- [ ] Re-check clean tree, branch/upstream and exact HEAD before first production edit.
- [ ] Record implementation-start SHA separately from planning baseline.
- [ ] Re-read authority changed after this plan.
- [ ] Confirm no concurrent owner edits overlap target files.
- [ ] Implement T02→T14 in dependency order.
- [ ] Stop and ask immediately if code contradicts an approved confirmation or requires schema,
  dependency, native config, notification/analytics provider, completion/reward scope.

## 15. Definition of Done

- [ ] All approved confirmations implemented exactly.
- [ ] Acceptance/automated/SQLite matrices have factual evidence.
- [ ] Relax/trial/Break/US-06-01/02 regressions pass.
- [ ] No Strict business rule in screen or native lifecycle adapter.
- [ ] No completion/reward/notification/analytics scope leak.
- [ ] No schema/dependency/native drift.
- [ ] Manual status recorded honestly.
- [ ] Implementation report references exact commit SHA.
- [ ] Owner accepts US-06-03 before US-06-04 planning/implementation becomes active.

## 16. References

- [EPIC-06 User Stories](./EPIC-06_USER_STORIES.md)
- [US-06-02 Implementation Plan](./US-06-02_IMPLEMENTATION_PLAN.md)
- [US-06-02 Implementation Report](./US-06-02_IMPLEMENTATION_REPORT.md)
- [Product Core](../PIXELDORO_CORE_TRUTH.md)
- [EPIC-03 UX Prototype Plan](./EPIC-03_UX_PROTOTYPE_PLAN.md)
- [Timer Engine](../specifications/timer-engine.md)
- [Session Lifecycle](../specifications/session-lifecycle.md)
- [Pet State Machine](../specifications/pet-state-machine.md)
- [Gamification Rules](../specifications/gamification-rules.md)
- [System Architecture](../architecture/system-architecture.md)
- [Project Structure](../architecture/project-structure.md)
- [Data Model](../architecture/data-model.md)
- [ADR-002 Navigation](../architecture/decisions/ADR-002-navigation-with-expo-router.md)
- [ADR-003 State/Persistence](../architecture/decisions/ADR-003-state-and-persistence.md)
- [ADR-004 Domain/Platform Boundaries](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md)

## 17. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-09-03 | Codex | Created owner-gated implementation plan for Strict durable evidence, exact grace/deadline precedence, lifecycle/startup reconciliation, Strict-aware Cancel, failed Result, fresh Bugged, fixtures and evidence. Production implementation remains not started. |

**US-06-03 remains `NOT_STARTED` until owner approves the confirmations. Default recommendation is
Option A for `US0603-CONFIRM-01`→`11`.**
