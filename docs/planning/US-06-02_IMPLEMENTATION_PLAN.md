---
document_id: PIXELDORO_US_06_02_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-06-02 Relax Running, timestamp countdown, cancel và relaunch plan
version: 0.3.1
status: DONE_OWNER_ACCEPTED_QUICK_UI
implementation_status: DONE_OWNER_ACCEPTED
date: 2026-09-03
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
approved_by: Dũng Lư
approved_at: 2026-09-03
language: vi
branch: feats/epic-06
planning_baseline_sha: 68f2c54d3630817385b320622476c55c67caea13
implementation_start_sha: 68f2c54d3630817385b320622476c55c67caea13
implementation_candidate: COMMITTED
exact_implementation_sha: 9a8e3d87d44612b7bd9aa8bf9e592099300d9e2e
us_06_01_implementation_sha: 68f2c54d3630817385b320622476c55c67caea13
us_06_01_acceptance: OWNER_QUICK_UI_ACCEPTED_TO_OPEN_PLANNING
formal_tester_status: DEFERRED_TO_LATER_PHASE
manual_device_status: OWNER_QUICK_UI_SMOKE_REPORTED
owner_acceptance_status: ACCEPTED_TO_OPEN_US_06_03_PLANNING
scope:
  - mobile_mvp
  - epic_06
  - us_06_02
  - standard_focus_relax_running
  - timestamp_countdown
  - durable_cancel
  - cancelled_result
  - foreground_and_relaunch_reanchor
authority: PLANNING
story_baseline: ./EPIC-06_USER_STORIES.md
previous_story_plan: ./US-06-01_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-06-01_IMPLEMENTATION_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
ux_baseline: ./EPIC-03_UX_PROTOTYPE_PLAN.md
timer_baseline: ../specifications/timer-engine.md
session_baseline: ../specifications/session-lifecycle.md
gamification_baseline: ../specifications/gamification-rules.md
pet_baseline: ../specifications/pet-state-machine.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
adr_navigation: ../architecture/decisions/ADR-002-navigation-with-expo-router.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-06-02 — Relax Running, timestamp countdown, cancel và relaunch

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan owner-gated cho Story thứ hai của EPIC-06. Lượt lập plan chỉ
thay đổi tài liệu; **không triển khai production code**, không đổi schema/migration, không thêm
dependency/native config và không tự đánh dấu acceptance test là pass.

**Story outcome:** một Standard Focus `relax/running` đã commit được hiển thị bằng countdown suy ra
từ `endsAt - now`; tick chỉ phục vụ hiển thị và dừng khi app/screen không visible. Foreground hoặc
relaunch đọc lại durable truth và re-anchor từ clock. User có thể dismiss hoặc confirm Cancel; chỉ
sau khi `running → cancelled` commit thành công mới mở Result đọc đúng session đã commit.

**Priority:** `P0`; execution order `02` trong EPIC-06.

**Planning status:** `OWNER_APPROVED` ngày 2026-09-03.

**Implementation status:** `DONE_OWNER_ACCEPTED`. Owner đã duyệt Option A cho toàn bộ
`US0602-CONFIRM-01`→`10`; implementation đã commit tại exact SHA
`9a8e3d87d44612b7bd9aa8bf9e592099300d9e2e`. Owner báo cáo đã hoàn tất quick UI smoke và yêu cầu
mở planning US-06-03. Full structured manual matrix không bị suy diễn là pass; formal tester vẫn
deferred.

### 0.1. Gate được mở từ US-06-01

- [x] US-06-01 exact implementation SHA:
  `68f2c54d3630817385b320622476c55c67caea13`.
- [x] Branch/upstream tại lúc audit: `feats/epic-06` / `origin/feats/epic-06`.
- [x] Working tree sạch trước khi tạo plan.
- [x] Automated baseline của US-06-01: typecheck/lint/Vitest/SQLite/boundary/hygiene/bundle pass.
- [x] Owner báo cáo đã test nhanh UI và yêu cầu mở planning US-06-02.
- [ ] Full US-06-01 manual matrix chưa có structured evidence; không được ghi giả là pass.
- [ ] Formal tester vẫn `DEFERRED_TO_LATER_PHASE`.

### 0.2. Ranh giới bắt buộc

- `US-06-02` sở hữu **Relax Running + Cancel + Cancelled Result**.
- `US-06-03` sở hữu Strict background evidence/grace/failed outcome.
- `US-06-04` sở hữu completion, reward receipt, completed Result và completion-vs-Strict precedence.
- `US-06-05` sở hữu notification/analytics/a11y Epic exit đầy đủ.
- EPIC-07 sở hữu Break; cancelled Result không hiện Start Break.
- Countdown về `00:00` **không** tự ghi `completed`, không cấp reward và không giả Result.

## 1. Authority contract

| Authority | Contract áp dụng cho US-06-02 |
|---|---|
| Product Core | Focus session không pause; Relax không fail vì background; Cancel là explicit user action. |
| Timer Engine | Timestamp là truth; `remaining=max(0, endsAt-now)`; visible-only ticks; startup/foreground barrier; mutations serialized. |
| Session Lifecycle | Running có thể overdue chờ reconcile; terminal immutable; cancelled có zero reward; Result đọc committed facts. |
| Data Model | Dùng `sessions.status/resolved_at/xp/coins/reward_claimed_at`; existing conditional transition là backstop. |
| Gamification | Cancelled không reward, không receipt, không profile delta. |
| Pet State | Running hiển thị Working; sau committed cancel refresh thành Idle; không phát terminal reward feedback. |
| Architecture | Domain/Application thuần; SQLite qua ports; route/screen không tính timer hoặc tự mutate status. |
| EPIC-06 story plan | Generic countdown, Relax foreground/relaunch, cancel race, committed cancelled Result, no schema. |

Nếu plan này mâu thuẫn authority cao hơn, authority cao hơn thắng và plan phải sửa trước khi code.

## 2. Current-state audit tại baseline

### 2.1. Những gì đã có và tái sử dụng được

- `StandardFocusSessionController` đang đọc durable active Standard session và chiếu config đã
  commit; đây là ownership cần được mở rộng, không thay bằng prototype state.
- `OnboardingTrialRunningController` đã chứng minh pattern route-active/app-visible, generation
  guard, tick scheduler, foreground refresh và deadline callback.
- `createOnboardingTrialRemainingProjection` đã có exact math `Math.max` + ceil display, nhưng tên và
  ownership còn trial-specific.
- `CancelOnboardingTrialUseCase` đã chứng minh coordinator + transaction + conditional terminal
  transition + re-read winner.
- `SessionRepository` đã có `findById`, `findActive`, `findByIdInTransaction` và
  `transitionFromRunningInTransaction`; không cần repository API hay migration mới cho Cancel.
- Focus Session route đã arbitrate `trial → standard → prototype`, refresh Pet và hỗ trợ hardware
  back request; có thể tách Standard branch mà không phá trial.
- Focus Result route hiện ưu tiên committed onboarding trial rồi prototype; cần thêm exact Standard
  cancelled branch, không được dùng “latest terminal” mơ hồ.
- Development Build đã có confirmed reset CTA qua existing local-data reset path.

### 2.2. Gap phải xử lý

1. Standard projection chưa có `remainingMs`, `displaySeconds`, `phase`, clock/scheduler/visibility.
2. Standard screen đang cố ý chỉ hiển thị configured minutes và notice “bước tiếp theo”.
3. Standard không có cancel use case/controller/single-flight/error mapping.
4. Root lifecycle chỉ forward visibility cho onboarding trial; Standard chưa re-anchor khi foreground.
5. Startup adapter chỉ reconcile trial completion; chưa có Standard Relax read/projection barrier.
6. Result chưa đọc Standard cancelled session theo exact identity.
7. Trial countdown/component và remaining projection chưa generic.
8. Strict session có thể đã được tạo từ US-06-01; Story 02 không được silently xử lý Strict như Relax.

### 2.3. Kết luận schema/dependency

Audit không tìm thấy schema gap. Cancel dùng existing conditional transition; Result dùng existing
`findById`. Countdown dùng injected clock/scheduler hiện có. Default decision là:

- `NO SCHEMA CHANGE`;
- `NO MIGRATION 002`;
- `NO PACKAGE/LOCKFILE CHANGE`;
- `NO EXPO/NATIVE CONFIG CHANGE`;
- `NO NOTIFICATION PROVIDER` trong Story này.

Nếu implementation phát hiện contradiction thật, dừng và đưa evidence cho owner; không tự mở rộng.

## 3. Target user flows

### 3.1. Mở Relax Running

1. Route activate và durable active read chạy.
2. Chỉ valid `focus/standard/relax/running` mới vào production Relax Running.
3. Controller capture `now`, derive phase/remaining từ `endsAt`; UI không tự tính.
4. Pet refresh từ durable active truth và hiển thị Working.
5. Visible screen schedule one cancellable tick; mỗi tick lại đọc clock, không trừ local counter.

### 3.2. Background/foreground

1. Khi app không active: dừng scheduled tick ngay; không ghi DB, không fail Relax.
2. Khi active lại: durable refresh/barrier chạy trước khi hiển thị truth mới.
3. Nếu vẫn trước deadline: re-anchor countdown từ clock.
4. Nếu tại/sau deadline: phase thành `deadline_pending`, countdown `00:00`, Cancel bị khóa.
5. Không transition completed/reward trong Story 02.

### 3.3. Relaunch

1. Bootstrap/migration/readiness hoàn thành.
2. Startup reconciliation giữ trial semantics hiện tại và kiểm tra Standard active truth.
3. Completed-onboarding entry route tới `/focus/session` nếu valid Standard vẫn running.
4. Session controller re-read cùng durable session ID và project từ current clock.
5. Read/corrupt failure fail closed vào recovery; không fallback prototype.

### 3.4. Cancel dismiss

1. Back/close hoặc CTA mở confirmation.
2. Dismiss đóng modal và session tiếp tục.
3. Không write, không route, không reset countdown/Pet.

### 3.5. Cancel confirm

1. Controller single-flight; CTA/modal busy, duplicate press bị coalesce/ignore.
2. Use case vào shared `SessionCommandCoordinator`.
3. Capture một `now`, transaction đọc exact session ID.
4. Validate Standard + Relax + running + `now < endsAt`.
5. Conditional update `running → cancelled` với `resolvedAt=updatedAt=now`, reward `0/0/null`.
6. Nếu conditional update mất race, re-read committed winner trong transaction.
7. Chỉ `cancelled`/`already_cancelled` mới refresh Pet và route exact cancelled Result.
8. Mọi failure khác giữ Running/recovery; không route giả.

### 3.6. Cancelled Result

1. Navigation mang exact `sessionId` của committed cancel.
2. Result controller dùng `findById(sessionId)` và validate Standard/cancelled invariant.
3. UI hiển thị neutral cancelled copy, configured context, zero reward và Pet Idle.
4. Active action chỉ có Home theo `US0600-CONFIRM-06`; không Focus Again/Break/reward claim.
5. Read failure giữ recovery trên Result; không fallback prototype hoặc latest unrelated session.

## 4. Proposed architecture

```text
App lifecycle / Route focus
          │
          ▼
StandardFocusSessionController ── Clock + TickScheduler
          │                         │
          │ durable findActive      └─ timestamp projection only
          ▼
Standard Focus Running Screen ── Cancel confirmation
                                      │
                                      ▼
                         CancelStandardFocusUseCase
                                      │
                         SessionCommandCoordinator
                                      │
                         SQLite transaction + CAS
                                      │ commit cancelled
                                      ▼
                    /focus/result?sessionId=<exact-id>
                                      │
                         StandardFocusResultController
                                      │ findById + validate
                                      ▼
                         Cancelled Result + Pet Idle
```

### 4.1. Domain/shared projection

Tách remaining projection khỏi trial naming thành shared pure API, ví dụ:

```ts
export type RemainingTimeProjection =
  | { phase: 'running'; remainingMs: number; displaySeconds: number }
  | { phase: 'deadline_pending'; remainingMs: 0; displaySeconds: 0 };

export const projectRemainingTime = (endsAt: number, nowMs: number) => ...;
```

Invariants:

- invalid/unsafe timestamp không được biến thành plausible countdown;
- `remainingMs = max(0, endsAt-now)`;
- display dùng ceil để không hiện `00:00` trước deadline;
- `now >= endsAt` → `deadline_pending`;
- projection không có side effect/write.

Trial consumer được migrate sang API chung với regression test; không đổi trial behavior.

### 4.2. Standard session projection/controller

Mở rộng controller hiện tại thay vì tạo authority cạnh tranh. Ready projection dự kiến:

```ts
type StandardFocusSessionProjection =
  | { status: 'idle' | 'loading' }
  | {
      status: 'ready';
      phase: 'running' | 'deadline_pending';
      sessionId: string;
      durationMinutes: number;
      mode: 'relax';
      workTag: WorkTag;
      startedAt: number;
      endsAt: number;
      remainingMs: number;
      displaySeconds: number;
    }
  | { status: 'strict_handoff'; ... }
  | { status: 'missing' }
  | { status: 'error'; error: ... };
```

Controller sở hữu:

- route `activate/deactivate`;
- app visibility;
- one scheduled tick at a time;
- refresh coalescing/generation guard;
- reset deadline request khi session identity đổi;
- no tick ở background/unmounted/deadline pending/error/missing;
- exact current-clock projection, không accumulated interval.

Strict branch phải được typed riêng và giữ truthful US-06-01 handoff cho tới US-06-03; không cho
Relax controller giả rằng Strict safe khi background.

### 4.3. Cancel Application use case

Create `CancelStandardFocusUseCase` với finite result:

```ts
type CancelStandardFocusOutcome =
  | { outcome: 'cancelled'; sessionId: string }
  | { outcome: 'already_cancelled'; sessionId: string };

type CancelStandardFocusErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_STANDARD_FOCUS'
  | 'SESSION_MODE_NOT_OWNED'
  | 'SESSION_DEADLINE_REACHED'
  | 'SESSION_ALREADY_TERMINAL'
  | 'SESSION_CANCEL_READ_FAILED'
  | 'SESSION_CANCEL_WRITE_FAILED'
  | 'SESSION_CANCEL_TRANSACTION_FAILED';
```

Required transaction algorithm:

1. Enter shared coordinator.
2. Capture/validate `now` once.
3. `findByIdInTransaction` exact ID.
4. If terminal cancelled and valid Standard Relax, return idempotent `already_cancelled`.
5. Reject wrong variant/mode/invalid/other terminal.
6. Reject `now >= endsAt` as deadline reached.
7. Conditional terminal update with zero reward.
8. If `not_updated`, re-read winner and classify; never overwrite terminal.
9. Map technical transaction/read/write failures; do not throw to UI.

### 4.4. Cancel command controller/presentation state

Standard branch owns `confirmVisible`, `submitting`, finite error and one operation. Route chỉ nối
navigation result. Suggested finite projection:

- `idle`;
- `confirming`;
- `submitting`;
- `error: deadline_reached | unavailable | already_terminal`.

On success:

1. committed result returned;
2. Standard session refresh confirms active no longer exists;
3. Pet refresh confirms Idle/base truth;
4. route replaces exact Result URL.

Nếu post-commit Pet refresh lỗi, committed cancel vẫn thắng; Result được phép mở với Pet recovery.

### 4.5. Startup/foreground barrier

Không tạo writer song song. Composition mở rộng active-session reconciliation ownership đã duyệt ở
`US0600-CONFIRM-05`:

- trial strategy giữ completion behavior hiện tại;
- Standard Relax strategy chỉ read/validate/reproject trong Story 02;
- overdue Standard Relax vẫn durable `running`, UI `deadline_pending`;
- Strict được nhận diện và chuyển typed handoff, không dùng Relax assumptions;
- startup/read failure fail bootstrap/recovery theo existing readiness contract;
- foreground refresh serialized với command coordinator khi mutation có thể cạnh tranh.

Story 02 không thêm completed writer. Story 04 sẽ thay deadline callback bằng full reconciliation
strategy mà không đổi Presentation contract.

### 4.6. Exact cancelled Result query

Create `LoadStandardFocusCancelledResultUseCase.execute(sessionId)`:

- `findById(sessionId)`;
- exact Standard Focus identity/config validation;
- require `status='cancelled'`, non-null safe `resolvedAt`;
- require `xpEarned=0`, `coinsEarned=0`, `rewardClaimedAt=null`;
- return immutable committed result DTO;
- wrong/missing/inconsistent/read errors là finite error; không đoán latest row.

Không đọc reward receipt/profile vì cancelled không có reward. Không tạo receipt để “chứng minh 0”.

### 4.7. Route arbitration

- Session giữ precedence: production trial → production Standard → prototype only on confirmed
  durable missing.
- Standard Relax uses new Running branch; Strict uses explicit deferred handoff.
- Result khi có valid Standard `sessionId` param ưu tiên exact Standard cancelled reader.
- Không có param thì giữ trial result path hiện tại; prototype chỉ confirmed missing.
- Invalid param/read error fail closed, không tự chuyển sang unrelated latest result.

## 5. UI plan

### 5.1. Reusable CountdownDisplay

Tạo common `CountdownDisplay` từ TrialCountdown và migrate trial:

- props chỉ nhận `displaySeconds`, `pending`, label/caption variant;
- formatting presentation-only; math remaining ở pure projection;
- tabular digits, stable layout;
- one accessibility label; không live-announce mỗi giây;
- `deadline_pending` được announce polite một lần theo phase transition;
- Reduce Motion không ảnh hưởng timer truth.

### 5.2. Relax Running screen

Hiển thị:

- header “Đang tập trung”;
- mode Relax + work tag + configured duration context;
- countdown từ controller;
- Pet Working;
- concise Relax notice;
- Cancel CTA;
- development tools tách khỏi primary CTA/hierarchy.

Deadline pending:

- `00:00`;
- copy “Đang chờ xác nhận kết quả…”;
- Cancel disabled/hidden theo approved option;
- Retry durable refresh nếu reconcile chưa sẵn sàng;
- không reward/celebration/Result.

### 5.3. Cancel confirmation

- Title/body nói rõ phiên sẽ dừng và không nhận thưởng.
- Dismiss là safe default.
- Confirm CTA có busy state, không double submit.
- Error giữ modal/screen và cho Retry; không reset session.
- Hardware back dùng cùng confirmation authority.

### 5.4. Cancelled Result

- neutral status “Phiên đã dừng”;
- configured duration/mode/tag và resolved time nếu UX cần;
- reward rõ `0 XP / 0 coin` hoặc neutral “Không có phần thưởng”, không celebratory animation;
- Pet Idle từ fresh base read;
- chỉ Home là active action; không Focus Again/Break;
- recovery state cho exact result read/Pet failure.

### 5.5. File-size guardrail

- Route modules target `≤120` lines, hard max `300`.
- Running screen target `180–240` lines, hard max `300`.
- Cancel modal/section child `≤120` nếu parent gần threshold.
- Countdown common `70–110`.
- Controllers/use cases target `≤260`; split theo responsibility nếu vượt.

## 6. Planned file changes

Tên cuối có thể điều chỉnh theo repository convention, nhưng ownership không đổi.

### 6.1. Create

- `packages/domain/src/session/remaining-time.projection.ts` (re-export through Application public API
  for mobile consumers)
- `packages/application/src/standard-focus/cancel-standard-focus.use-case.ts`
- `packages/application/src/standard-focus/load-standard-focus-cancelled-result.use-case.ts`
- matching unit tests cho ba module trên
- `apps/mobile/src/application/standard-focus/standard-focus-cancel.controller.ts`
- `apps/mobile/src/application/standard-focus/standard-focus-result.controller.ts`
- matching controller tests
- `apps/mobile/src/presentation/components/countdown-display.tsx`
- common countdown tests
- `apps/mobile/src/presentation/features/focus/standard-focus-running-screen.tsx`
- `apps/mobile/src/presentation/features/focus/standard-focus-cancelled-result-screen.tsx`
- focused presentation tests
- `apps/mobile/src/app/focus/standard-focus-running-branch.tsx`
- `apps/mobile/src/app/focus/standard-focus-cancelled-result-branch.tsx`
- `apps/mobile/src/composition/review/standard-focus-running-review-fixture.ts`
- `apps/mobile/test/device/standard-focus-relax-running-smoke.md`
- real SQLite integration test cho cancel/relaunch/result/race
- `docs/planning/US-06-02_IMPLEMENTATION_REPORT.md` chỉ sau khi có implementation evidence

### 6.2. Modify

- export barrels ở Domain/Application/Mobile Presentation.
- `StandardFocusSessionController` + tests: clock/scheduler/lifecycle/phase/Strict handoff.
- Standard Focus slice: wire cancel/result/shared coordinator.
- mobile application facade/context/hooks: typed Standard actions/projections.
- root lifecycle/startup composition: Standard visibility + read barrier.
- Focus Session route/arbitration: new Relax branch, preserve trial/fail-closed behavior.
- Focus Result route/arbitration: exact Standard cancelled result branch.
- onboarding trial running controller/projection/countdown consumer: migrate common APIs without
  semantic change.
- existing dev fixture wiring: finite accelerated clock/failure modes.

### 6.3. Must not change

- migration SQL/lock/checksum;
- package manifests/lockfile;
- Expo/native signing/prebuild config;
- notification/analytics provider;
- reward receipt/profile balance on cancel;
- Strict background evidence/grace;
- Break creation/navigation behavior;
- onboarding trial business invariant.

## 7. Work breakdown và dependency order

| ID | Work item | Depends on | Exit evidence |
|---|---|---|---|
| T01 | Lock owner confirmations + baseline status | Plan | All confirmations decided |
| T02 | Extract generic remaining projection | T01 | boundary/invalid/ceil tests; trial regression |
| T03 | Extract generic CountdownDisplay | T02 | component/a11y tests; trial visual contract |
| T04 | Extend Standard session controller | T02 | lifecycle/tick/re-anchor/Strict tests |
| T05 | Implement cancel use case | T01 | transaction/error/deadline/race unit tests |
| T06 | Wire Standard slice/cancel controller | T04,T05 | single-flight/readiness/Pet ordering tests |
| T07 | Implement exact cancelled result reader/controller | T05 | identity/invariant/error tests |
| T08 | Build Relax Running/cancel UI | T03,T04,T06 | RTL tests, file guardrail |
| T09 | Build Result branch/navigation | T07 | exact-ID route and no-fallback tests |
| T10 | Compose startup/foreground barrier | T04,T06 | lifecycle/relaunch tests |
| T11 | Add finite dev fixtures/device guide | T08,T09,T10 | harness + guide pass |
| T12 | Run real SQLite integration/race suite | T05,T07,T10 | cancel-first/terminal-first/reopen evidence |
| T13 | Full regression/quality/bundle | T02–T12 | exact command outputs |
| T14 | Report + owner quick UI | T13 | exact SHA, honest manual status |

No production edit begins before T01 passes. T14 cannot mark formal tester pass without evidence.

## 8. Detailed acceptance criteria

### AC-01 — Timestamp truth

- [ ] Remaining equals `max(0, endsAt-now)`.
- [ ] Display uses ceil seconds before deadline.
- [ ] Tick never changes durable session fields.
- [ ] System clock is read at projection time; no decrement-only truth.

### AC-02 — Visibility lifecycle

- [ ] Tick runs only when route active and app visible.
- [ ] Background/unmount cancels scheduled tick.
- [ ] Foreground re-reads/reprojects before showing fresh truth.
- [ ] No duplicate scheduler after rapid visibility changes.

### AC-03 — Relax safety

- [ ] Background/lock/relaunch never commits `failed` for Relax.
- [ ] `backgroundedAt` is not written for Relax in Story 02.
- [ ] Before deadline relaunch opens same session ID with re-anchored countdown.
- [ ] Read/corrupt failure enters recovery, not prototype.

### AC-04 — Deadline boundary

- [ ] `now < endsAt` is running.
- [ ] `now == endsAt` and `now > endsAt` are `deadline_pending`.
- [ ] Pending does not commit completed/reward/result.
- [ ] Pending prevents a new cancel request under proposed boundary.

### AC-05 — Cancel confirmation

- [ ] Back/close and CTA open one confirmation authority.
- [ ] Dismiss causes no write/navigation.
- [ ] Confirm is single-flight with busy state.
- [ ] Failure preserves session and offers finite Retry.

### AC-06 — Durable cancel

- [ ] Only exact valid Relax Standard `running` can transition.
- [ ] Commit sets `cancelled`, safe `resolvedAt/updatedAt`, reward `0/0/null`.
- [ ] No receipt/profile delta is created.
- [ ] Navigation occurs only after commit.

### AC-07 — Race/idempotency

- [ ] Duplicate cancel returns already-cancelled success for same valid session.
- [ ] Terminal winner is never overwritten.
- [ ] Conditional update miss re-reads and classifies committed winner.
- [ ] Read/write/transaction failure never produces false Result.

### AC-08 — Cancelled Result

- [ ] Route/query identifies exact session ID.
- [ ] Result validates committed Standard cancelled invariant.
- [ ] UI shows no reward, no Break CTA, no celebration.
- [ ] Pet is refreshed after commit and normally Idle.
- [ ] Missing/wrong/inconsistent session fails closed.

### AC-09 — Strict boundary

- [ ] Existing Strict session is recognized, not treated as Relax.
- [ ] No fake Strict background safety/failure/grace is introduced.
- [ ] Truthful handoff points to US-06-03 ownership.

### AC-10 — Regression/scope

- [ ] Onboarding trial timer/cancel/completion/result remain passing.
- [ ] Standard Start/cold entry remain passing.
- [ ] No schema/package/native drift.
- [ ] No production UI file exceeds 300 lines.

## 9. Automated verification matrix

### 9.1. Pure projection

- before deadline by 1ms/999ms/1000ms;
- exact deadline and after;
- large safe duration;
- invalid/unsafe endsAt/now;
- ceil formatting and no early zero.

### 9.2. Session controller

- idle→loading→ready;
- read missing/error/throw/invalid;
- Relax ready before deadline;
- exact/after deadline pending;
- activate/deactivate and app visibility;
- one scheduled tick; cancellation on unmount;
- foreground jumps from clock rather than missed tick count;
- refresh generation/stale result protection;
- session identity change resets deadline request;
- Strict typed handoff.

### 9.3. Cancel use case/controller

- success exact fields;
- already-cancelled idempotency;
- not found/wrong variant/wrong mode;
- exact/after deadline rejection;
- completed/failed terminal winner;
- invalid clock;
- read/write/transaction technical failure;
- rollback leaves running;
- conditional miss then cancelled winner;
- conditional miss then other terminal winner;
- rapid double confirm/single-flight;
- no navigation before promise/commit;
- Pet refresh post-commit only.

### 9.4. Result reader/controller

- exact valid cancelled record;
- missing/wrong standard identity;
- running/completed/failed rejected for cancelled branch;
- non-zero reward or non-null claim rejected inconsistent;
- read failure/throw;
- stale generation/session ID switch;
- no latest unrelated session fallback.

### 9.5. Route/presentation

- trial precedence preserved;
- Standard Relax branch selection;
- Strict handoff selection;
- durable read error fail closed;
- exact result param path;
- invalid param recovery;
- modal dismiss/confirm/busy/error;
- countdown a11y without per-second live spam;
- cancelled Result no reward/Break/celebration;
- large text/Reduce Motion-compatible layout contract.

### 9.6. Real SQLite integration

Use production migration/repository/transaction/coordinator:

1. start Relax through production Start;
2. close/reopen and read same running ID;
3. cancel before deadline and assert exact terminal fields;
4. reopen and load exact cancelled Result;
5. ensure `findActive=null` and no reward receipt/profile delta;
6. second cancel is idempotent;
7. injected terminal-first race is immutable;
8. write/transaction failure rollback leaves running;
9. trial and Standard one-active invariant still holds.

## 10. Manual quick UI guide planned

Full guide sẽ nằm ở `apps/mobile/test/device/standard-focus-relax-running-smoke.md`.

### 10.1. Preconditions

- exact implementation SHA, device/simulator, OS và build recorded;
- Development Build diagnostics enabled only for review;
- clean local data hoặc confirmed reset;
- onboarding complete;
- create valid `15 / relax / coding` session through production Setup/Start;
- accelerated review clock, nếu dùng, phải là finite injected adapter; persisted duration vẫn hợp lệ.

### 10.2. Quick smoke steps

1. Start Relax → thấy countdown giảm, đúng mode/tag, Pet Working.
2. Background/lock một khoảng → foreground, countdown nhảy theo elapsed clock, không fail.
3. Kill/relaunch trước deadline → mở cùng session, không tạo row mới.
4. Mở Cancel → dismiss → session tiếp tục.
5. Mở lại → confirm → chỉ sau busy/commit mới thấy cancelled Result.
6. Result không reward/Break; Pet Idle; Home hoạt động đúng approved flow.
7. Chạy cancel write failure fixture → vẫn ở Running, error hữu hạn, Retry được.
8. Chạy near-deadline fixture → `00:00 deadline_pending`, không fake completed/reward.

### 10.3. Accessibility

- VoiceOver đọc timer/status/Cancel nhưng không announce mỗi giây;
- large text không che CTA/confirmation;
- Reduce Motion vẫn hiểu trạng thái bằng text;
- cancelled/pending không chỉ phân biệt bằng màu;
- focus returns predictably after dismiss/error.

### 10.4. Evidence honesty

- Owner quick smoke, automated harness và formal tester là ba cột riêng.
- Screenshot/video không thay durable SQLite assertion.
- Không tick case chưa chạy.
- Formal tester giữ `DEFERRED` nếu không có tester evidence.

## 11. Quality gates và Definition of Done

### 11.1. Required commands/evidence

- pinned Node `22.23.2` và repository pnpm version;
- root typecheck;
- ESLint no warning;
- complete Vitest suite;
- focused real SQLite integration;
- boundary/import validation;
- repository hygiene/migration lock;
- Expo iOS export/Metro bundle;
- `git diff --check`;
- changed UI line-count audit;
- exact implementation SHA after commit.

### 11.2. DoD

- [ ] All approved confirmations implemented exactly.
- [ ] AC-01→10 have automated evidence where applicable.
- [ ] Real SQLite proves cancel/reopen/result/race facts.
- [ ] Trial/US-06-01 regressions pass.
- [ ] No schema/dependency/native drift.
- [ ] Manual status recorded honestly.
- [ ] Implementation report references exact SHA.
- [ ] Owner accepts US-06-02 before US-06-03 planning/implementation becomes active.

## 12. Risks và mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Countdown uses accumulated intervals | drift/fake remaining | clock-derived projection every render tick |
| Interval survives background/unmount | leaks/stale UI | explicit route/app gates + scheduler cancellation tests |
| Deadline at 0 auto-completes | steals US-06-04/reward truth | controlled `deadline_pending`; no completion writer |
| Cancel after deadline beats future completion | wrong terminal winner | proposed cutoff `now >= endsAt`; coordinator/CAS |
| Route navigates before commit | false cancelled Result | typed committed outcome is sole navigation trigger |
| Result loads latest session | cross-session data leak | exact sessionId query + `findById` validation |
| Strict treated as Relax | missing violation semantics | typed Strict handoff; US-06-03 remains owner |
| Two lifecycle writers | nondeterministic race | one coordinator/strategy boundary |
| Generic extraction breaks trial | onboarding regression | migrate one consumer at a time + full trial suite |
| Dev fixture changes durable product rules | invalid evidence | valid persisted duration + finite injected clock/failure ports |
| Pet refresh fails post-commit | visual stale but truth committed | Result recovery; never rollback/lie about cancel |

## 13. Owner confirmations — approved 2026-09-03

### US0602-CONFIRM-01 — Shared remaining projection/countdown

- **Option A (recommended):** extract generic remaining projection + CountdownDisplay and migrate
  onboarding trial with regression coverage.
- **Option B:** duplicate Standard-specific math/UI.
- **Option C:** keep trial component and import it under Standard naming.
- **Trade-off:** A removes duplicated timer truth with two real consumers; B/C increase drift/coupling.
- [x] Owner approved option: A — 2026-09-03.

### US0602-CONFIRM-02 — Relax/Strict Story boundary

- **Option A (recommended):** full Running lifecycle only for Relax; existing Strict active session gets
  explicit truthful handoff until US-06-03, never Relax semantics.
- **Option B:** show same timer/cancel for Strict but omit violation behavior.
- **Option C:** disable/remove Strict from Setup retroactively.
- **Trade-off:** A preserves approved US-06-01 config without lying; B implies unsafe behavior; C
  changes an already accepted Story.
- [x] Owner approved option: A — 2026-09-03.

### US0602-CONFIRM-03 — Deadline và Cancel cutoff

- **Option A (recommended):** `now >= endsAt` → `deadline_pending`, block/reject Cancel, no completion
  write until US-06-04.
- **Option B:** allow Cancel while durable status remains running even after deadline.
- **Option C:** auto-complete with zero reward now.
- **Trade-off:** A prevents overdue cancel stealing completion and avoids fake reward; B makes outcome
  depend on delayed UI action; C violates Story ownership.
- [x] Owner approved option: A — 2026-09-03.

### US0602-CONFIRM-04 — Startup/foreground behavior

- **Option A (recommended):** one active-session barrier; Standard Relax read/reproject only, overdue
  remains durable running + UI pending; no Standard terminal writer in Story 02.
- **Option B:** route-local refresh only, no startup barrier.
- **Option C:** add early Standard completion writer.
- **Trade-off:** A matches timestamp/recovery authority; B can flash stale truth; C pulls US-06-04.
- [x] Owner approved option: A — 2026-09-03.

### US0602-CONFIRM-05 — Cancel transaction/race contract

- **Option A (recommended):** shared coordinator + exact-ID transaction + conditional terminal write +
  re-read race winner; only cancelled/already-cancelled navigates cancelled Result.
- **Option B:** unconditional status update.
- **Option C:** local UI cancellation then async persistence.
- **Trade-off:** A preserves terminal immutability/commit-before-navigation; B/C can overwrite/lie.
- [x] Owner approved option: A — 2026-09-03.

### US0602-CONFIRM-06 — Cancelled Result identity/actions

- **Option A (recommended):** route exact `sessionId`, `findById`, validate cancelled zero-reward;
  chỉ Home active, không Focus Again/Break.
- **Option B:** load latest terminal Standard session.
- **Option C:** keep cancelled result in route memory only.
- **Trade-off:** A survives relaunch and prevents cross-session ambiguity; B/C are not durable/exact.
- [x] Owner approved option: A — 2026-09-03.

### US0602-CONFIRM-07 — Controller/composition ownership

- **Option A (recommended):** evolve existing Standard session controller; separate cancel/result
  controllers; one composition slice/coordinator; routes stay thin.
- **Option B:** put clock/cancel state in route hooks.
- **Option C:** create a second parallel Standard running authority.
- **Trade-off:** A preserves existing handoff and layering; B/C split truth and race ownership.
- [x] Owner approved option: A — 2026-09-03.

### US0602-CONFIRM-08 — Development review fixtures

- **Option A (recommended):** keep valid persisted 15-minute config, use finite injected accelerated
  clock plus one-shot read/write/race failures; existing confirmed reset remains.
- **Option B:** persist invalid 1-minute session.
- **Option C:** wait real duration for every boundary case.
- **Trade-off:** A gives fast evidence without corrupting business invariants; B invalidates evidence;
  C is slow and weak for exact races.
- [x] Owner approved option: A — 2026-09-03.

### US0602-CONFIRM-09 — Side effects trong Story 02

- **Option A (recommended):** core cancel + Pet refresh only; no notification/analytics placeholder or
  dependency; US-06-05 owns providers/hooks.
- **Option B:** introduce no-op interfaces now.
- **Option C:** add notification package/native config now.
- **Trade-off:** A avoids speculative API/config drift; B/C add scope without user-visible provider.
- [x] Owner approved option: A — 2026-09-03.

### US0602-CONFIRM-10 — Schema/evidence/exit gate

- **Option A (recommended):** no schema/dependency/native change; full automated + real SQLite +
  bundle evidence; owner quick UI can accept progression while formal tester remains explicitly
  deferred.
- **Option B:** add migration for convenience.
- **Option C:** treat automated tests as manual/device pass.
- **Trade-off:** A is truthful and matches current capability; B/C add risk or false evidence.
- [x] Owner approved option: A — 2026-09-03.

## 14. Implementation start checklist sau approval

- [ ] Record owner decision for all ten confirmations in this document.
- [ ] Re-check clean tree, branch/upstream and exact HEAD immediately before first production edit.
- [ ] Record implementation-start SHA separately from planning baseline.
- [ ] Re-read any authority changed after this plan.
- [ ] Confirm no concurrent owner changes overlap target files.
- [ ] Implement in T02→T14 dependency order.

## 15. References

- [EPIC-06 User Stories](./EPIC-06_USER_STORIES.md)
- [US-06-01 Implementation Plan](./US-06-01_IMPLEMENTATION_PLAN.md)
- [US-06-01 Implementation Report](./US-06-01_IMPLEMENTATION_REPORT.md)
- [Product Core](../PIXELDORO_CORE_TRUTH.md)
- [EPIC-03 UX Prototype Plan](./EPIC-03_UX_PROTOTYPE_PLAN.md)
- [Timer Engine](../specifications/timer-engine.md)
- [Session Lifecycle](../specifications/session-lifecycle.md)
- [Gamification Rules](../specifications/gamification-rules.md)
- [Pet State Machine](../specifications/pet-state-machine.md)
- [System Architecture](../architecture/system-architecture.md)
- [Project Structure](../architecture/project-structure.md)
- [Data Model](../architecture/data-model.md)
- [ADR-002 Navigation](../architecture/decisions/ADR-002-navigation-with-expo-router.md)
- [ADR-003 State/Persistence](../architecture/decisions/ADR-003-state-and-persistence.md)
- [ADR-004 Domain/Platform Boundaries](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md)

## 16. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.3.1 | 2026-09-03 | Codex | Recorded exact implementation SHA and owner quick-UI progression acceptance; closed US-06-02 and opened owner-gated US-06-03 planning while retaining manual/formal evidence limitations. |
| 0.3.0 | 2026-09-03 | Codex | Recorded implemented working-tree candidate, automated/SQLite/quality/iOS bundle evidence and remaining exact-SHA/manual/owner gates. |
| 0.2.0 | 2026-09-03 | Codex | Recorded owner approval of Option A for `US0602-CONFIRM-01`→`10` and implementation-start SHA; production implementation moved to `IN_PROGRESS`. |
| 0.1.0 | 2026-09-03 | Codex | Created owner-gated implementation plan for Relax timestamp Running, lifecycle re-anchor, durable Cancel, exact cancelled Result, generic countdown migration, fixtures and evidence. Production implementation remains not started. |

**US-06-02 is owner-accepted at exact implementation SHA
`9a8e3d87d44612b7bd9aa8bf9e592099300d9e2e`. Owner quick UI opens US-06-03 planning; detailed
manual matrix and formal tester evidence remain deferred.**
