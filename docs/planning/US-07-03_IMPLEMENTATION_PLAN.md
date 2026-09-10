---
document_id: PIXELDORO_US_07_03_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-07-03 Break Timestamp Countdown, Relaunch và Completion Plan
version: 0.4.0
status: DONE_OWNER_ACCEPTED_QUICK_UI
implementation_status: DONE_OWNER_ACCEPTED
date: 2026-09-09
last_updated: 2026-09-09
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
approved_by: Dũng Lư
approved_at: 2026-09-09
language: vi
branch: feats/epic-07
planning_baseline_sha: fc322028281cbca1ca0ec48772c195548201217a
implementation_start_sha: b6339899003f88e7554b6ea301229af3950d3493
exact_implementation_sha: d51e1c23683c770dba5f4a0791d29167cb84bd96
previous_story_sha: fc322028281cbca1ca0ec48772c195548201217a
previous_story_acceptance: DONE_OWNER_ACCEPTED_QUICK_UI
manual_device_status: OWNER_QUICK_UI_SMOKE_REPORTED
owner_acceptance_status: ACCEPTED_TO_OPEN_US_07_04_PLANNING
formal_tester_status: NOT_RUN
schema_change: NONE_APPROVED
dependency_change: NONE_APPROVED
native_change: NONE_APPROVED
scope:
  - mobile_mvp
  - epic_07
  - us_07_03
  - break_timestamp_countdown
  - break_lifecycle_reconciliation
  - break_completion
  - break_startup_recovery
authority: PLANNING
story_baseline: ./EPIC-07_USER_STORIES.md
previous_story_plan: ./US-07-02_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-07-02_IMPLEMENTATION_REPORT.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
timer_baseline: ../specifications/timer-engine.md
session_baseline: ../specifications/session-lifecycle.md
gamification_baseline: ../specifications/gamification-rules.md
pet_baseline: ../specifications/pet-state-machine.md
adr_navigation: ../architecture/decisions/ADR-002-navigation-with-expo-router.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-07-03 — Break timestamp countdown, background/relaunch và completion

## 0. Mục đích và trạng thái

Plan này nối running Break đã commit ở US-07-02 thành một lifecycle hoàn chỉnh tới `completed`:
countdown luôn derive từ persisted `endsAt`, dừng visual tick khi app không visible, reconcile khi
foreground/startup/deadline và chỉ hiển thị completed sau conditional transaction commit.

Lượt hiện tại chỉ cập nhật planning/evidence documents; **không sửa production code**, schema,
dependency, lockfile hoặc native configuration.

**Story outcome:** Short/Long Break tiếp tục đúng qua background, lock, kill và relaunch; tại hoặc sau
deadline, Break commit `completed` đúng một lần, Pet trở về `idle`, XP/Coin và reward ledger không đổi.

**Priority:** `P0`; execution order `03` trong EPIC-07.

**Dependency:** US-07-02 đã commit/push tại
`fc322028281cbca1ca0ec48772c195548201217a` và được owner quick UI accepted ngày 2026-09-09.

**Planning status:** `DONE_OWNER_ACCEPTED_QUICK_UI`.

**Implementation status:** `DONE_OWNER_ACCEPTED`. Owner duyệt toàn bộ Option A cho
`US0703-CONFIRM-01→10`, candidate đã commit/push tại exact SHA
`d51e1c23683c770dba5f4a0791d29167cb84bd96`, và owner xác nhận quick UI không crash, hoạt động đúng
kỳ vọng ngày 2026-09-09. Structured device/accessibility và formal test vẫn `NOT_RUN`.

### 0.1. Gate từ US-07-02

- [x] Exact durable Start từ completed Standard Result đã commit/push.
- [x] Short `5` / Long `15`, one-active, current-cadence transaction và exact-ID handoff đã pass.
- [x] Owner quick UI báo cáo không crash và hoạt động đúng kỳ vọng ngày 2026-09-09.
- [x] Existing handoff screen cố ý không có fake countdown; lifecycle thuộc Story này.
- [x] No-schema/source-relation limitation đã ghi rõ và không cản Break completion.
- [ ] Structured iOS/Android/accessibility matrix và formal tester vẫn `NOT_RUN`; không suy diễn từ
  quick smoke.

### 0.2. Story boundary bắt buộc

- US-07-03 sở hữu live timestamp countdown, app visibility, foreground/startup/deadline reconcile,
  durable `running → completed`, exact completed projection và Pet `breaking → idle`.
- US-07-04 sở hữu user Cancel, confirmation/back flow, cancel/completion race UX và cancelled Result.
- US-07-05 sở hữu Break notification, analytics, final accessibility/integrity và Epic exit.
- Story này không thêm Pause/Resume, Strict/grace, Break `failed`, reward, auto-start Focus, notification,
  analytics hoặc persisted background timestamp.

## 1. Authority contract

| Authority | Contract áp dụng |
|---|---|
| Product Core | Short `5`, Long `15`; Break không Pause/Strict/reward; background/kill không làm failed. |
| Timer Engine | Timer truth là absolute `endsAt`; tick không write; `00:00` chỉ request reconcile. |
| Session Lifecycle | `now >= endsAt` và row còn running → completed; terminal commit trước UI/side effect. |
| System Architecture | Mọi mutation qua shared coordinator; startup/foreground có reconciliation barrier. |
| Data Model | Reuse `sessions` và conditional running transition; terminal immutable; no reward row. |
| Pet State Machine | Running Break → `breaking`; completed Break → `idle`; không Celebrate/Bugged. |
| ADR-002/003/004 | Exact durable ID trong route; state không nằm ở timer/component/URL payload; platform sau ports. |

Nếu implementation phát hiện cần schema, background field cho Break, durable timer tick hoặc một
terminal status mới, dừng và đưa evidence cho owner; không tự mở migration hay thay authority.

## 2. Current-state audit tại baseline

### 2.1. Capability tái sử dụng

- Domain `projectRemainingTime(endsAt, now)` đã trả `running`, `deadline_pending` hoặc `invalid`, dùng
  `ceil` cho display seconds và không mutate.
- Common `CountdownDisplay` đã có `timer` semantics, tabular `MM:SS` và polite pending announcement.
- `DeviceTimeoutScheduler` cùng route activation/app visibility pattern đã chạy cho Trial và Standard.
- `AppLifecyclePort`, `AppVisibilityController` và root lifecycle subscription đã tồn tại.
- `SessionCommandCoordinator` đang dùng chung cho Trial, Standard Focus và Start Break.
- `SessionRepository.findById(InTransaction)`, `findActive(InTransaction)` và
  `transitionFromRunningInTransaction` đủ cho exact conditional completion.
- SQLite migration `001` đã enforce Break type/duration/null/reward/status và one-running invariants.
- `LoadRunningBreakUseCase`, `BreakSessionController`, `/break/session?sessionId=...` và
  `BreakStartedScreen` đã có exact durable handoff, Pet Breaking và Retry read.
- `PetCompanionController` derive active Break thành `breaking`; khi không active sẽ về `idle`.
- Standard Focus có reference pattern cho timestamp controller, lifecycle orchestration, startup
  reconciliation, terminal freshness, critical recovery và exact Result navigation.
- Long Break cadence query đã derive marker từ completed Long; completing Long tự reset cadence mà
  không cần counter write.

### 2.2. Gap phải đóng

1. Chưa có pure Break reconciliation decision/validator cho deadline và corrupt timestamp.
2. Chưa có `ReconcileBreakUseCase` đọc exact/active Break trong transaction và conditional-complete.
3. Running loader chỉ chấp nhận `running`, chưa trả exact committed `completed` projection.
4. `BreakSessionController` chưa tick, visibility-aware, deadline single-fire hoặc terminal projection.
5. Chưa có Break lifecycle controller nối foreground/deadline với recovery, Pet và route projection.
6. Startup adapter chỉ reconcile Standard; running Break hiện bị first-use entry xem là invalid.
7. First-use navigation chưa có exact `break_running`/`break_completed` destination + session ID.
8. Break screen chưa dùng `CountdownDisplay` và chưa có committed completed state.
9. Chưa có isolated accelerated/relaunch/failure fixtures hoặc real SQLite completion evidence.

### 2.3. Schema/dependency verdict đề xuất

- `NO SCHEMA CHANGE`; giữ migration `001` immutable.
- `NO PACKAGE/LOCKFILE CHANGE`.
- `NO EXPO/NATIVE CONFIG CHANGE`.
- Không ghi `backgrounded_at` cho Break; field này tiếp tục chỉ thuộc Strict Standard Focus.
- Reuse exact row, absolute timestamps và generic conditional transition hiện có.
- Không tạo timer/cadence/reward table hoặc in-memory source of truth thứ hai.

## 3. Target user flows

### 3.1. Exact running route ở foreground

1. Route validate scalar, nonblank `sessionId` và activate Break session controller.
2. Controller exact-load row đã commit; foreign/missing/terminal-invalid ID không fallback active/latest.
3. UI render Short/Long, Pet Breaking và `CountdownDisplay` từ `endsAt - clock.nowMs()`.
4. Visible tick chỉ project lại mỗi giây; không gọi repository/coordinator.
5. Countdown không restart Pet loop và không announce mỗi giây bằng live region.

### 3.2. Background/foreground trước deadline

1. Lifecycle bridge capture event và lập tức stop Break tick/hidden Pet animation.
2. Không ghi `backgroundedAt`, không schedule work để giữ JavaScript timer sống.
3. Foreground enqueue exact Break reconcile qua shared coordinator trước khi reveal/tick lại.
4. Nếu `now < endsAt`, row vẫn running; controller reload cùng ID và remaining nhảy theo timestamp.
5. Pet refresh về committed `breaking`; không Bugged/failed.

### 3.3. Deadline ở foreground

1. Tick project `deadline_pending/00:00` và phát đúng một reconcile request cho session ID.
2. UI giữ pending copy, không tự claim completed hoặc Pet Idle.
3. Command capture một `now`, transaction-read exact row và validate Break identity/timestamps.
4. Nếu row còn running và `now >= endsAt`, conditional transition sang `completed` với
   `resolvedAt = updatedAt = captured now`, reward fields giữ zero/null.
5. Commit xong mới publish completed projection, refresh Pet thành Idle và dừng tick.

### 3.4. Kill/relaunch

- **Trước deadline:** startup reconciliation giữ row running; first-use navigation mở exact
  `/break/session?sessionId=<id>` và countdown derive lại.
- **Tại/sau deadline:** startup reconciliation commit/read exact completed winner trước readiness;
  first-use navigation mở cùng exact route ở committed completed state.
- Không tạo Break mới, không dựa interval cũ, không replay terminal Pet feedback.

### 3.5. Failure/retry

- Exact read failure: route giữ ID và hiển thị Retry; không fallback.
- Reconcile read/write/transaction hoặc corrupt timestamp: không hiển thị completed; vào recovery
  boundary đã duyệt và giữ durable row nguyên vẹn.
- Post-commit Pet/read refresh failure không downgrade completion hoặc retry terminal write như một
  mutation mới; retry chỉ hydrate exact committed truth/Pet.

## 4. Proposed architecture

```text
/break/session?sessionId=<exact-id>
  → BreakSessionController (exact load + timestamp projection + visible ticks)
      → deadline_pending emits exact ID once
          → BreakLifecycleController
              → ReadinessGate
              → ReconcileBreakUseCase
                  → shared SessionCommandCoordinator
                  → SQLite transaction
                      → exact row read
                      → Domain decision
                      → conditional running → completed
              → commit
              → BreakOutcomeController + session reload + Pet refresh

startup / foreground
  → startup/lifecycle reconciliation barrier
  → same ReconcileBreakUseCase
  → exact running/completed navigation truth
```

### 4.1. Domain Break reconciliation decision

Thêm pure module dự kiến `packages/domain/src/break/break-reconciliation.decision.ts`:

```ts
type BreakReconciliationDecision =
  | { kind: 'running'; remainingMs: number }
  | { kind: 'complete' }
  | { kind: 'invalid' };

decideBreakReconciliation({ startedAt, endsAt, updatedAt, nowMs })
```

Rules:

- mọi timestamp là safe integer, non-negative;
- `startedAt < endsAt`, `updatedAt >= startedAt`, `nowMs >= updatedAt`;
- `nowMs < endsAt` → running;
- `nowMs >= endsAt` → complete;
- không có Strict/background/failure/cancel/reward decision.

Display vẫn reuse `projectRemainingTime`; decision module là command authority và không phụ thuộc
presentation rounding.

### 4.2. Application completion transaction

Thêm helper dự kiến `complete-break-transaction.ts` và `ReconcileBreakUseCase`:

- input optional exact `sessionId`; deadline/route dùng exact ID, startup có thể đọc active;
- đọc row trong transaction; chỉ own `short_break`/`long_break`;
- terminal completed hợp lệ trả `existing_terminal`, không write;
- terminal cancelled trả finite `terminal_winner` để US-07-04 có thể mở rộng, không đổi status;
- Focus/trial trả `not_owned` ở active arbitration hoặc ineligible với exact ID;
- running row phải pass exact Break tuple/null/zero/timestamp validator;
- decision running trả no-write outcome;
- decision complete gọi `transitionFromRunningInTransaction` với completed + zero/null reward;
- `not_updated` phải exact re-read winner trong cùng transaction; không đoán completion;
- typed errors tách read/write/transaction/state-invalid;
- use case không phụ thuộc profile/reward/notification/analytics/Pet/navigation.

Proposed outcome:

```ts
type ReconcileBreakOutcome =
  | { outcome: 'no_active_session' }
  | { outcome: 'not_owned' }
  | { outcome: 'running'; sessionId: string }
  | { outcome: 'completed'; sessionId: string; resolvedAt: number;
      freshness: 'fresh_commit' | 'existing_terminal' }
  | { outcome: 'terminal_winner'; sessionId: string };
```

### 4.3. Exact running/completed loader

Evolve `LoadRunningBreakUseCase` thành an exact Break session query (rename or additive replacement
decided during implementation without changing public behavior):

- accepts only scalar nonblank exact ID;
- returns discriminated `running` or `completed` projection;
- exposes type/duration/startedAt/endsAt and completed `resolvedAt`;
- validates zero/null/no-reward invariants;
- rejects Focus, missing, corrupt and unsupported terminal rows;
- never reads active/latest as fallback.

### 4.4. Mobile session/lifecycle/outcome controllers

`BreakSessionController` remains the exact route projection owner and gains:

- `activate(sessionId)` / `deactivate()` lifecycle;
- one cached exact durable projection;
- timestamp projection via injected clock + scheduler;
- visible-only one-second ticks;
- per-session deadline single-fire guard;
- `setAppVisible`, refresh coalescing, generation/dispose guards;
- `running`, `deadline_pending`, `completed`, missing/error projections.

Add `BreakLifecycleController` following the proven Standard pattern but without background write,
profile hydration or terminal one-shot:

- serialize foreground/deadline reconcile;
- map typed failures to critical recovery;
- after commit publish exact outcome, refresh Break session and Pet;
- reveal/tick only after reconcile barrier;
- post-commit refresh failure cannot reverse durable completion.

Add a narrow `BreakOutcomeController` holding only exact completed identity/resolvedAt needed between
startup reconcile and first-use navigation. It is runtime projection, not durable truth, and never
creates a terminal effect.

### 4.5. Startup arbitration and first-use navigation

Extend the current startup adapter instead of adding a parallel bootstrap:

1. onboarding trial delegate runs as today;
2. Standard reconcile keeps returning `not_owned` for active Break;
3. Break reconcile owns active Short/Long and commits deadline if due;
4. exact active/terminal projection is validated before readiness opens;
5. first-use entry receives `break_running` or `break_completed` with exact session ID;
6. navigation replaces to `/break/session?sessionId=<id>`.

Invalid/corrupt active Break keeps bootstrap in recovery. No transient Home flash and no active/latest
fallback inside the Break route.

### 4.6. Presentation

Replace the US-07-02 notice with production behavior:

- running → reused `CountdownDisplay`, type/duration, Pet Breaking, no Pause/Cancel/reward controls;
- deadline pending → `00:00` + polite “đang xác nhận” state, actions disabled;
- completed → minimal committed completion panel, Pet Idle, explicit `Về Home` action, zero-reward copy;
- read error → exact-ID Retry;
- lifecycle critical error → existing global recovery boundary.

Recommended Story boundary keeps the same exact `/break/session` route for running and completed.
US-07-04 adds Cancel and may expand the terminal surface without changing durable identity.

### 4.7. Review fixtures

Add finite dev-only `EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE` scenarios on disposable databases prefixed
`pixeldoro-us-07-03-`:

- `break_running_short_fast_clock`;
- `break_running_long_fast_clock`;
- `break_running_relaunch_before_deadline`;
- `break_completion_write_failure_once`;
- `break_completion_read_failure_once`.

Fixtures must persist real `5`/`15` minute configured duration through production Start. Acceleration
uses injected clock/scheduler only; no 5-second durable Break, direct terminal mutation or normal
`pixeldoro.db` access.

## 5. Data and transaction invariants

1. Exact Short remains `short_break/5`; exact Long remains `long_break/15`.
2. `startedAt` and `endsAt` never change during reconciliation.
3. Break `backgroundedAt` remains `null`; background/foreground performs no Break lifecycle write.
4. Visible display tick performs zero persistence calls.
5. `00:00` is `deadline_pending`, not durable completed truth.
6. One command captures one `now`; Domain and terminal timestamps use that captured value.
7. Completion mutation is conditional on exact row still being `running`.
8. `resolvedAt = updatedAt = captured now`; late reconciliation does not rewrite `endsAt`.
9. Completed Break keeps `xpEarned=0`, `coinsEarned=0`, `rewardClaimedAt=null`.
10. No RewardTransaction/profile delta is inserted or updated.
11. Terminal `completed`/`cancelled` is immutable; existing winner is reread, never overwritten.
12. Freshness distinguishes fresh commit from existing terminal hydration.
13. Commit is final success; Pet/navigation/read side effects occur afterward.
14. Completed Long resets cadence only because existing derived query sees its committed marker.
15. All mutations use the same application-scoped coordinator and SQLite transaction backstop.

## 6. Error and recovery matrix

| Case | Durable result | UI/recovery |
|---|---|---|
| Exact running, before deadline | No write | Countdown resumes from timestamp. |
| Deadline reached | Completed once | Pending until commit, then completed screen. |
| Duplicate deadline/foreground calls | At most one transition | Shared callers converge on committed winner. |
| Exact completed reopen | No write | Same completed identity; Pet Idle. |
| Focus/trial/missing/blank ID | No write | Exact route unavailable; no fallback. |
| Corrupt Break tuple/timestamp/reward field | No write | Durable-data recovery; no fabricated countdown/result. |
| Read failure before commit | No write | Retry/recovery; row preserved. |
| Transition/transaction failure | Rollback | Keep pending/recovery; no completed UI. |
| Conditional write loses race | Winner preserved | Exact reread and render winner. |
| Background/lock/kill | No Break background write | Reconcile on foreground/relaunch; never failed. |
| Pet refresh failure after commit | Completion remains committed | Retry Pet/read only; no terminal rewrite. |
| Offline/provider unavailable | Local flow unchanged | Completion succeeds; no provider dependency. |

Technical error copy must not expose SQLite, transaction, fixture, query, timestamp internals or
cadence implementation.

## 7. Planned file impact

### 7.1. New files — indicative

- `packages/domain/src/break/break-reconciliation.decision.ts` + test.
- `packages/application/src/break/complete-break-transaction.ts` + test.
- `packages/application/src/break/reconcile-break.use-case.ts` + test.
- `apps/mobile/src/application/break/break-lifecycle.controller.ts` + test.
- `apps/mobile/src/application/break/break-outcome.controller.ts` + test.
- `apps/mobile/src/composition/break/create-break-lifecycle-slice.ts` + test.
- `apps/mobile/src/composition/review/break-running-review-fixture.ts` + test.
- `apps/mobile/src/presentation/features/break/break-running-screen.tsx` + test.
- `apps/mobile/src/presentation/features/break/break-completed-screen.tsx` + test.
- `apps/mobile/test/integration/break-completion.integration.test.ts`.
- `apps/mobile/test/integration/epic-07-break-lifecycle-route-integrity.integration.test.ts`.
- `apps/mobile/test/device/break-running-completion-smoke.md`.
- `docs/planning/US-07-03_IMPLEMENTATION_REPORT.md` after implementation.

Exact names may be consolidated when a module remains cohesive and below project size limits; layer
ownership and test boundaries may not be collapsed into route/component code.

### 7.2. Expected modified files

- Domain/Application barrel exports.
- Existing running Break loader and `BreakSessionController` tests/contract.
- Break facade/hooks and root composition/disposal.
- Startup reconciliation adapter and first-use entry/navigation projections.
- `/break/session` exact route and Break presentation exports.
- EPIC-07 story/evidence status and device-guide validator.

### 7.3. Explicitly unchanged

- `apps/mobile/src/infrastructure/database/migrations/001_initial_schema.ts`.
- Package manifests and `pnpm-lock.yaml`.
- iOS/Android native projects and Expo configuration.
- Standard/Trial duration, Strict, reward and notification behavior.
- Long Break cadence SQL definition.
- Prototype reducers as product authority.

## 8. Ordered implementation tasks

1. Record approved confirmations and exact implementation-start SHA; verify clean baseline.
2. Add pure Break reconciliation decision + boundary/invalid tests.
3. Add exact zero-reward completion helper and transaction tests.
4. Add `ReconcileBreakUseCase` with typed outcomes/errors, freshness and race reread.
5. Expand exact Break loader to running/completed projections.
6. Evolve `BreakSessionController` with exact identity, timestamp ticks, visibility and deadline guard.
7. Add Break outcome/lifecycle controller and readiness/recovery/Pet handling.
8. Wire additive Break lifecycle slice into shared coordinator/root lifecycle/disposal.
9. Extend startup reconciliation and first-use exact-ID destinations without Home flash.
10. Replace handoff notice with running/pending/completed production UI.
11. Add isolated fast-clock/relaunch/failure fixtures through production records/commands.
12. Add real SQLite completion/reopen/no-reward/cadence-reset/race integration tests.
13. Run focused tests, full quality, both platform exports, Doctor and static scope audit.
14. Create implementation report/device guide; request owner quick UI without marking formal cases.

## 9. Automated test plan

### 9.1. Domain/Application

- Decision: before/equal/after deadline; invalid/non-safe/order-violating timestamps.
- Completion helper: exact zero/null transition payload; updated/not-updated/read/write failure.
- Reconcile: no active, not owned, Short/Long running, fresh completed, existing completed,
  terminal winner, exact foreign/missing/corrupt, transaction failure.
- Concurrent reconcile: deadline/tick/foreground callers produce one fresh commit and stable followers.
- Verify zero calls to reward/profile/notification/analytics dependencies by construction/static audit.

### 9.2. Controller/composition/presentation

- Exact route activation/deactivation and ID-change stale-read guard.
- Tick projects timestamp, uses ceil, stops background/unmount/completed and fires deadline once.
- Foreground waits for reconciliation before revealing timer.
- Completion failure never publishes completed; Retry recovers.
- Fresh/existing completion refreshes Pet Idle without terminal one-shot.
- Startup running/completed Break exact navigation and invalid Break recovery.
- `CountdownDisplay` semantics: no per-second live announcement; pending polite once.
- Screen running/pending/completed/error/large-text action hierarchy snapshots.
- Static route rejects prototype, active/latest fallback and direct persistence imports.

### 9.3. Real SQLite integration

- Short and Long before deadline remain running with unchanged row.
- Equal/after deadline commits completed once with exact timestamps and zero reward.
- Duplicate/concurrent reconcile returns one fresh commit; later calls existing terminal.
- Injected transition/commit failure rolls back; retry commits once.
- Reopen before deadline loads same running ID; reopen after deadline completes same ID.
- No RewardTransaction/profile delta for either Break type.
- Completed Long changes derived next recommendation to Short; completed Short does not reset cycle.
- Break `backgrounded_at` stays null; no `failed` status can be produced.

### 9.4. Regression and gates

- Existing US-07-01/02 cadence, recommendation and Start suites.
- Trial and Standard start/countdown/background/reconcile/cancel/result suites.
- Pet arbitration/lifecycle and first-use navigation suites.
- Full `pnpm quality` with Node `22.23.2`.
- iOS and Android Expo JS exports.
- Expo Doctor with pre-existing warnings recorded, not opportunistically upgraded.
- `git diff --check`, boundary validator, one-lockfile/immutable-migration hygiene.

## 10. Manual UI/device plan

Create `apps/mobile/test/device/break-running-completion-smoke.md` with isolated fixtures.

Minimum owner quick smoke:

1. Start Short; observe accessible countdown and no Pause/Strict/reward control.
2. Background/lock over 10 seconds before deadline; foreground remaining jumps correctly and Pet stays
   Breaking.
3. Kill/relaunch before deadline; exact same ID/type/endsAt resumes with no duplicate.
4. Cross deadline; `00:00` shows pending until commit, then completed + Pet Idle + zero reward.
5. Run Long completion; reopen a completed Focus Result and verify next recommendation is Short.
6. Inject completion write/read failure once; no false completed UI, Retry succeeds exactly once.
7. Airplane mode path remains fully functional.
8. Screen reader does not announce every second; largest text/Reduce Motion/actions remain usable.

Evidence must record implementation SHA, fixture/database, platform/device/OS, timestamp/timezone,
online state and `PASS/FAIL/BLOCKED/NOT_RUN`. Owner quick smoke, structured platform/accessibility and
formal tester status remain separate.

## 11. Acceptance criteria

- [x] Countdown derives only from persisted `endsAt - now` and tick performs no write.
- [x] Tick/animation stops in background/unmount and re-anchors on foreground.
- [x] Break background/lock/crash/kill never writes failed or `backgroundedAt`.
- [x] Relaunch before deadline opens the same exact running Break.
- [x] At/past deadline commits exact Break completed once after conditional transaction.
- [x] Relaunch after deadline resolves before presenting final truth.
- [x] `00:00` pending never claims completion before commit.
- [x] Completed Break has zero reward row/profile delta/reward UI.
- [x] Pet is Breaking only while committed running and Idle after completion; no Celebrate/Bugged.
- [x] Completed Short preserves cadence; completed Long resets via durable derived query.
- [x] Corrupt/read/write/commit failure is recoverable without guessed state or fallback identity.
- [x] No Cancel/notification/analytics/Pause/Strict behavior leaks into Story scope.
- [x] No schema/dependency/native change.
- [x] Full automated/platform/static gates pass; owner quick UI PASS được ghi riêng với formal test.

## 12. Risks and controls

| Risk | Control |
|---|---|
| Countdown becomes truth | Pure display projection; only reconcile transaction changes status. |
| `00:00` falsely shows completed | Explicit `deadline_pending` projection until commit. |
| Background interval drains battery | Stop scheduler and visual work when hidden/unmounted. |
| Foreground flashes stale remaining | Reconcile barrier before reveal/reactivation. |
| Startup sends active Break Home | Exact Break destinations added to first-use arbitration. |
| Multiple reconcilers race | Shared coordinator + conditional update + exact winner reread. |
| Completion accidentally rewards | No reward/profile ports; zero/null transition + integration assertions. |
| Long cadence reset too early | Only completed Long row is marker; running/failed write impossible. |
| Pet celebrates Break | Base refresh only; no terminal feedback request. |
| Fixture fakes duration/truth | Real 5/15-minute row; accelerate injected clock/scheduler only. |
| Route accepts wrong session | Scalar exact ID and typed validator; no fallback. |
| Scope absorbs Cancel/notifications | Static imports/tests and explicit Story 04/05 boundary. |

## 13. Rollback strategy

- New Break reconciliation/domain/controllers/slice/screens can be reverted as one Story.
- Restore US-07-02 exact handoff shell if running lifecycle UI must be disabled.
- Startup Break destination can safely fall back only by blocking/recovery, never by deleting or
  mutating an existing running row.
- Completed Break rows created during accepted testing remain valid durable data; rollback must not
  raw-delete user data. Use confirmed reset only for disposable review databases.
- No migration rollback exists because plan proposes no schema change.

## 14. Definition of Ready / Done

### 14.1. Definition of Ready

- [x] US-07-02 exact committed SHA and owner quick acceptance recorded.
- [x] Product/Timer/Session/Data/Pet/ADR contracts audited.
- [x] Current countdown, scheduler, lifecycle, startup, repository and route gaps audited.
- [x] No-schema/dependency/native default established.
- [x] Target transaction, startup arbitration, recovery, tests and fixture strategy documented.
- [x] Owner approves `US0703-CONFIRM-01→10` on 2026-09-09.
- [x] Plan status/version and exact implementation-start SHA updated before coding.

### 14.2. Definition of Done

- [x] All acceptance criteria and focused/full automated gates pass.
- [x] Both platform exports pass; Doctor warnings recorded truthfully.
- [x] Exact running/completed Break route contains no prototype/fallback authority.
- [x] No reward/profile/notification/analytics/Break-background write is reachable.
- [x] Report/device guide/exact committed SHA exist.
- [x] Owner quick UI PASS is recorded separately from structured/formal evidence.
- [x] Owner explicitly accepts US-07-03 and authorizes US-07-04 planning.

## 15. Owner confirmation gate — APPROVED

### US0703-CONFIRM-01 — Completed presentation boundary

- **Option A — đề xuất:** giữ exact `/break/session?sessionId=<id>`; sau commit render completed tối
  thiểu + Pet Idle + `Về Home`. US-07-04 mở rộng Cancel/cancelled Result.
- **Option B:** completion về Home ngay, chỉ notice transient.
- **Option C:** tạo `/break/result` đầy đủ ngay Story 03.
- **Impact:** khóa route/screen/outcome controller và ranh giới với US-07-04.
- [x] Owner selected option: A — 2026-09-09.

### US0703-CONFIRM-02 — Startup navigation

- **Option A — đề xuất:** startup reconcile trước readiness rồi first-use entry mở exact running hoặc
  freshly completed Break ID; không Home flash.
- **Option B:** startup chỉ reconcile data, luôn về Home; user tự tìm session.
- **Option C:** route đọc active/latest không cần exact ID.
- **Impact:** khóa startup adapter, entry projection và exact-identity guarantee.
- [x] Owner selected option: A — 2026-09-09.

### US0703-CONFIRM-03 — Controller ownership

- **Option A — đề xuất:** evolve `BreakSessionController` cho exact timer projection; thêm
  `BreakLifecycleController` + narrow `BreakOutcomeController`, không nhét mutation vào React route.
- **Option B:** một controller duy nhất chứa read/tick/reconcile/Pet/navigation.
- **Option C:** route component tự giữ timer và gọi repository/use case.
- **Impact:** khóa layer/file graph, disposal và test seams.
- [x] Owner selected option: A — 2026-09-09.

### US0703-CONFIRM-04 — Completion timestamp

- **Option A — đề xuất:** `resolvedAt = updatedAt = captured reconcile now`; `endsAt` giữ nguyên.
- **Option B:** ghi `resolvedAt = endsAt` dù reconcile muộn.
- **Impact:** A khớp lifecycle hiện tại và audit trail; khóa transaction assertions.
- [x] Owner selected option: A — 2026-09-09.

### US0703-CONFIRM-05 — Background behavior

- **Option A — đề xuất:** background chỉ stop tick/visual; không ghi Break `backgroundedAt`; foreground
  reconcile timestamp trước reveal.
- **Option B:** persist background timestamp cho Break để diagnostics.
- **Option C:** giữ interval chạy background.
- **Impact:** khóa no-Strict/no-write invariant và pin/OS behavior.
- [x] Owner selected option: A — 2026-09-09.

### US0703-CONFIRM-06 — Countdown cadence và accessibility

- **Option A — đề xuất:** visible tick tối đa mỗi giây, `ceil` display, reuse `CountdownDisplay`; không
  live-announce mỗi giây, chỉ pending politely một lần.
- **Option B:** tick 250 ms để animation mượt hơn.
- **Option C:** tick theo phút.
- **Impact:** khóa scheduler, battery và accessibility tests.
- [x] Owner selected option: A — 2026-09-09.

### US0703-CONFIRM-07 — Failure recovery surface

- **Option A — đề xuất:** exact read lỗi dùng local Retry; reconcile/corrupt/transaction lỗi vào global
  critical recovery; tuyệt đối không show completed trước commit.
- **Option B:** mọi lỗi local inline trên Break route.
- **Option C:** mọi lỗi về Home.
- **Impact:** khóa error mapping và bootstrap/readiness behavior.
- [x] Owner selected option: A — 2026-09-09.

### US0703-CONFIRM-08 — Post-commit Pet/read failure

- **Option A — đề xuất:** completion commit là final success; publish exact completed identity, retry
  hydration/Pet only, không rollback hoặc retry transition như mutation mới.
- **Option B:** coi toàn flow failed và giữ `00:00` dù row đã completed.
- **Impact:** khóa freshness/outcome/retry semantics.
- [x] Owner selected option: A — 2026-09-09.

### US0703-CONFIRM-09 — Review fixture acceleration

- **Option A — đề xuất:** disposable `pixeldoro-us-07-03-*` DB; persist thật 5/15 phút, accelerate chỉ
  injected clock/scheduler và one-shot repository failures.
- **Option B:** persist Break 5 giây.
- **Option C:** mutate normal database thủ công.
- **Impact:** khóa evidence fidelity và data safety.
- [x] Owner selected option: A — 2026-09-09.

### US0703-CONFIRM-10 — Scope/schema/side effects

- **Option A — đề xuất:** no schema/dependency/native; không Cancel, notification hoặc analytics;
  completed Break chỉ zero-reward durable truth + Pet/read refresh.
- **Option B:** kéo notification vào Story 03.
- **Option C:** kéo Cancel/terminal race vào Story 03.
- **Impact:** khóa Story size và gates của US-07-04/05.
- [x] Owner selected option: A — 2026-09-09.

### 15.1. Approval checklist

- [x] Owner selected Option A for confirmations `01→10` on 2026-09-09.
- [x] No non-A selection requires authority, file-impact or test-plan reconciliation.
- [x] Epic status/next gate and plan version/status are updated from explicit decisions.
- [x] Exact implementation-start SHA is recorded immediately before coding.
- [x] No material confirmation remains pending.

## 16. References

- [EPIC-07 User Stories](./EPIC-07_USER_STORIES.md)
- [US-07-02 Plan](./US-07-02_IMPLEMENTATION_PLAN.md)
- [US-07-02 Report](./US-07-02_IMPLEMENTATION_REPORT.md)
- [MVP Epics](./MVP_EPICS.md)
- [Product Core](../PIXELDORO_CORE_TRUTH.md)
- [System Architecture](../architecture/system-architecture.md)
- [Technical Overview](../architecture/technical-overview.md)
- [Project Structure](../architecture/project-structure.md)
- [Data Model](../architecture/data-model.md)
- [Session Lifecycle](../specifications/session-lifecycle.md)
- [Timer Engine](../specifications/timer-engine.md)
- [Gamification Rules](../specifications/gamification-rules.md)
- [Pet State Machine](../specifications/pet-state-machine.md)
- [ADR-002 Navigation](../architecture/decisions/ADR-002-navigation-with-expo-router.md)
- [ADR-003 State and Persistence](../architecture/decisions/ADR-003-state-and-persistence.md)
- [ADR-004 Domain and Platform Boundaries](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md)

## 17. Change log và planning validation

| Version | Date | Author | Change |
|---|---|---|---|
| 0.4.0 | 2026-09-09 | Codex | Recorded exact committed/pushed SHA `d51e1c23683c770dba5f4a0791d29167cb84bd96`, owner quick UI PASS (no crash, works as expected), US-07-03 closure and authorization to open owner-gated US-07-04 planning; structured/formal evidence remains NOT_RUN. |
| 0.3.1 | 2026-09-09 | Codex | Fixed owner-smoke startup recovery on an existing accelerated fixture database: pre-prepare reconciliation now uses wall clock, virtual time starts only during seed/after prepare, and restart continuity has regression coverage. |
| 0.3.0 | 2026-09-09 | Codex | Implemented all approved Option A decisions; recorded 772-test full-quality pass, iOS/Android exports, unchanged 19/21 Doctor baseline, isolated review fixtures/device guide and worktree candidate status. Owner quick UI/formal test remain NOT_RUN. |
| 0.2.0 | 2026-09-09 | Codex | Recorded owner approval of Option A for confirmations 01–10; locked same-route completion, exact startup navigation, controller split, captured-now timestamps, no Break background write, one-second accessible ticks, recovery/freshness/fixture boundaries and no-schema/no-side-effect scope; opened implementation at exact SHA. |
| 0.1.0 | 2026-09-09 | Codex | Created owner-gated US-07-03 plan from accepted US-07-02 exact SHA; defined timestamp countdown, no-background-write lifecycle, conditional zero-reward completion, startup exact-ID arbitration, recovery, fixtures/tests and ten pending confirmations. No production code changed. |

Validation required for this planning turn:

- [x] `git diff --check` passes.
- [x] All relative Markdown references resolve.
- [x] Confirmation IDs are continuous `01→10`.
- [x] Only planning/evidence documents changed.
- [x] No unrun automated/manual/formal evidence is marked PASS.

**US-07-03 is committed/pushed and owner accepted through quick UI at exact SHA
`d51e1c23683c770dba5f4a0791d29167cb84bd96`; structured accessibility and formal tester evidence
remain `NOT_RUN`.**
