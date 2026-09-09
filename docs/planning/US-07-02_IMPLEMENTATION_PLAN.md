---
document_id: PIXELDORO_US_07_02_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-07-02 Explicit Durable Start Break và Pet Breaking Plan
version: 0.1.0
status: DRAFT_OWNER_CONFIRMATION_REQUIRED
implementation_status: NOT_STARTED
date: 2026-09-09
last_updated: 2026-09-09
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-07
planning_baseline_sha: a3b92fd8a6908f4efecea7fc7c8d49ac20683aa3
implementation_start_sha: NOT_STARTED
exact_implementation_sha: NOT_AVAILABLE
previous_story_sha: a3b92fd8a6908f4efecea7fc7c8d49ac20683aa3
previous_story_acceptance: DONE_OWNER_ACCEPTED_QUICK_UI
manual_device_status: NOT_RUN
formal_tester_status: NOT_RUN
schema_change: NONE_PROPOSED_PENDING_CONFIRMATION
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
scope:
  - mobile_mvp
  - epic_07
  - us_07_02
  - explicit_durable_start_break
  - transactional_cadence_revalidation
  - committed_break_handoff
  - pet_breaking
authority: PLANNING
story_baseline: ./EPIC-07_USER_STORIES.md
previous_story_plan: ./US-07-01_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-07-01_IMPLEMENTATION_REPORT.md
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

# US-07-02 — Explicit durable Start Break và Pet chuyển sang Breaking

## 0. Mục đích và trạng thái

Plan này biến recommendation đã accepted ở US-07-01 thành một explicit, atomic `StartBreak` flow.
Lượt hiện tại chỉ tạo/cập nhật planning documents; **không sửa production code**, schema, dependency
hoặc native configuration.

**Story outcome:** từ exact completed Standard Focus Result, user tap `Bắt đầu nghỉ`; application đọc
lại cadence hiện tại trong serialized transaction, persist đúng một running Short `5` hoặc Long `15`,
rồi mới handoff tới exact durable Break và refresh Pet thành `breaking`. `Về Home`, render, reload hoặc
relaunch trước tap không tạo Break.

**Priority:** `P0`; execution order `02` trong EPIC-07.

**Planning status:** `DRAFT_OWNER_CONFIRMATION_REQUIRED`.

**Implementation status:** `NOT_STARTED`. Coding chỉ bắt đầu sau khi owner duyệt
`US0702-CONFIRM-01→10` và plan được cập nhật bằng quyết định thực tế.

### 0.1. Gate từ US-07-01

- [x] US-07-01 committed/pushed tại exact SHA
  `a3b92fd8a6908f4efecea7fc7c8d49ac20683aa3`.
- [x] US-07-01 full automated quality, iOS export và Android export pass.
- [x] Owner báo cáo quick UI smoke không crash và hoạt động đúng kỳ vọng ngày 2026-09-09.
- [x] Cadence preview là read-only và exact-source; production Start CTA vẫn chưa bật.
- [x] Owner đã duyệt cadence được đọc lại tại Start; actual committed type thắng preview stale.
- [ ] Epic-level `US0700-CONFIRM-01` về one-Break-per-Focus chưa được duyệt.
- [ ] Structured physical-device/accessibility matrix và formal tester vẫn `NOT_RUN`; không suy diễn
  từ quick smoke.

### 0.2. Story boundary bắt buộc

- US-07-02 sở hữu explicit Start, transaction, durable running record, exact-ID handoff và Pet
  `breaking` sau commit.
- US-07-03 sở hữu live timestamp countdown, visibility ticks, foreground/relaunch reconciliation và
  completion tại deadline.
- US-07-04 sở hữu Cancel, cancel/completion race và terminal Break Result.
- US-07-05 sở hữu notification, analytics hooks, final accessibility/integrity và Epic exit.
- Không auto-start, không user chọn Short/Long, không reward, không Strict/grace, không terminal write.

## 1. Authority contract

| Authority | Contract áp dụng |
|---|---|
| Product Core | Short `5`, Long `15`; completed Standard Result mới có Start; explicit action only; no reward/Strict. |
| Approved US-07-01 | Preview đọc current facts; Start bắt buộc re-read cadence; committed type thắng preview. |
| System Architecture | Mọi session mutation dùng cùng application-scoped coordinator; transaction/constraint là correctness backstop. |
| Data Model | Unified `sessions`, one-running unique index, exact Break checks và cadence index đã đủ dưới Option A. |
| Session Lifecycle | Persist trước navigation/side effect; exact committed identity; offline/local truth; fail closed. |
| Pet State Machine | Running Short/Long Break → `breaking`; active truth preempts transient Celebrate; Pet không mutate session. |
| ADR-002/003/004 | Route mang typed exact identity; durable state không nằm ở URL/Zustand/prototype; platform/SQLite sau ports. |

Nếu implementation phát hiện contradiction với authority cao hơn hoặc schema không thể giữ invariant,
dừng và đưa evidence cho owner; không tự mở migration/refactor.

## 2. Current-state audit tại baseline

### 2.1. Capability tái sử dụng

- `BreakRecommendation` đã khóa tuple `short_break/5` và `long_break/15` trong Domain.
- `LoadNextBreakRecommendationUseCase` đã có exact completed Standard source validator và current
  cadence mapping; read preview không write.
- `SessionRepository` có exact/active reads trong transaction và insert running.
- `SQLiteTransaction` + `ux_sessions_one_running` là atomic/concurrency backstop.
- Một `SessionCommandCoordinator` đã được compose chung cho Trial và Standard Focus.
- `ClockPort`, `IdPort`, `LocalCalendarPort` và record factory pattern đã production-test.
- `PetCompanionController` derive active Break thành `breaking`; `PetVisualController` đã có arbitration
  để committed active truth preempt terminal Focus feedback.
- Result branch/panel đã có typed recommendation, Retry và exact source ID.
- Common `PrimaryButton`, `SecondaryButton`, `InlineNotice`, `ErrorState`, `LoadingState`,
  `PetVisualStatus` đủ cho Start states/handoff shell.

### 2.2. Gap phải đóng

1. Chưa có Break record validator/factory bảo đảm null/zero/fixed-duration invariants.
2. Chưa có transactional cadence query port; current `LongBreakCadenceQuery.getFacts` đọc ngoài
   transaction nên không đủ làm commit-time authority.
3. Chưa có `StartBreakUseCase` dùng shared coordinator + one transaction.
4. Recommendation panel production chưa publish Start callback/busy/error.
5. Chưa có mobile Start controller/single-flight/committed outcome projection.
6. `/break/session` vẫn hoàn toàn phụ thuộc prototype state và không nhận exact durable ID.
7. Chưa có production exact running-Break loader/controller/screen shell cho committed handoff.
8. Root composition/facade/hooks chưa expose narrow Start + running Break surfaces.
9. Chưa có review fixtures/integration evidence cho duplicate, active conflict, rollback và cadence đổi
   giữa preview/tap.

### 2.3. Schema/dependency verdict đề xuất

Theo `US0700-CONFIRM-01` Option A được đề xuất:

- `NO SCHEMA CHANGE`, giữ migration `001` immutable;
- `NO source_focus_session_id` và không claim durable one-Break-per-Focus;
- `NO PACKAGE/LOCKFILE CHANGE`;
- `NO EXPO/NATIVE CONFIG CHANGE`;
- mở rộng transactional query API/adapter trên schema/index hiện tại;
- notification/analytics vẫn chưa được gọi ở Story này.

Nếu owner chọn confirmation 01 Option B, plan này bị block: phải cập nhật Product/Data Model, tạo
forward migration và re-plan mapper/repository/compatibility trước coding.

## 3. Target user flows

### 3.1. Result trước explicit tap

1. Exact completed Standard Result và recommendation ready như US-07-01.
2. Start là primary action; Home là secondary action.
3. Render, Retry recommendation, background, reload hoặc Home không write.
4. Khi recommendation lỗi, không có Start fallback; Home vẫn dùng được.

### 3.2. Start thành công

1. User tap Start; controller coalesce duplicate press và publish accessible pending state.
2. Readiness gate phải ready; command vào shared `SessionCommandCoordinator`.
3. Command capture một `startedAt`, mở transaction và đọc exact source.
4. Validate source vẫn là completed Standard Focus hợp lệ.
5. Đọc current cadence facts bằng cùng transaction executor; validate facts và decide tuple.
6. Đọc active session trong transaction; nếu có, trả typed conflict và không thay thế record.
7. Tạo exact Break record với one ID/calendar snapshot và insert.
8. Transaction commit; outcome trả actual committed record/type, không echo preview input.
9. Mobile discard/preempt stale terminal Focus feedback, refresh Pet, rồi navigate exact committed ID.
10. Break route đọc exact durable running row; render type/duration + Pet `breaking`.

### 3.3. Preview đổi trước tap

Preview có thể là Short nhưng một durable command khác làm Long due trước khi tap. Start transaction
đọc lại facts và commit Long; Result/handoff phải dùng returned committed Long, không giữ Short label
cũ. Trường hợp ngược lại sau completed Long marker tương tự: committed Short thắng preview Long.

### 3.4. Active conflict hoặc pre-commit failure

- Exact source/cadence/active/insert/transaction failure → rollback/no row/no navigation.
- Result vẫn hiển thị committed Focus reward và Home.
- CTA trở lại retryable state với finite user copy; không đoán type mới.
- Existing active Focus/Trial/Break không bị cancel/replace.

### 3.5. Commit thành công nhưng handoff read/Pet refresh lỗi

- Không biến thành “Start failed” và không cho retry insert.
- Navigate/open exact committed Break ID; running branch tự đọc durable truth và hiển thị recovery nếu
  read thất bại.
- Pet recovery độc lập với session truth; retry chỉ refresh read/Pet, không gọi `StartBreak` lần nữa.

## 4. Proposed architecture

```text
Completed Standard Result + current recommendation
                       │ explicit tap(sourceFocusSessionId)
                       ▼
              BreakStartController
                       │ readiness + single-flight
                       ▼
                 StartBreakUseCase
                       │ shared SessionCommandCoordinator
                       ▼
               SQLite transaction
        ┌──────────────┼────────────────────┐
        │              │                    │
 exact source read  cadence facts       active read
        └──────────────┼────────────────────┘
                       ▼
        Domain decision + Break record factory
                       │ insert + COMMIT
                       ▼
        actual RunningSessionRecord (exact ID/type)
                       │
             Pet refresh + exact route
                       ▼
       Durable Break handoff screen + breaking Pet
```

### 4.1. Domain Break configuration

Extend `packages/domain/src/break/` with a pure validator or projector that accepts only:

```ts
type BreakConfiguration =
  | { sessionType: 'short_break'; durationMinutes: 5 }
  | { sessionType: 'long_break'; durationMinutes: 15 };
```

It must reject mismatched type/duration, unsafe values and any attempt to introduce mode/tag/reward.
Reuse the US-07-01 recommendation tuple; do not create competing `5/15` constants.

### 4.2. Application record factory

Add `createBreakSessionRecord` analogous to Standard record construction, returning a frozen
`RunningSessionRecord` with:

- `profileId = 1`;
- exact generated nonblank `id`;
- `sessionType = short_break|long_break` from current Domain decision;
- `focusVariant/mode/workTag/backgroundedAt/resolvedAt/rewardClaimedAt = null`;
- `status = running`, `xpEarned = coinsEarned = 0`;
- `endsAt = startedAt + durationMinutes * 60_000`;
- valid calendar date/UTC offset derived from `endsAt`;
- `createdAt = updatedAt = startedAt`.

Factory has no repository/clock/navigation dependency.

### 4.3. Transactional cadence port

Do not reuse the non-transactional preview read inside Start. Add a narrow contract such as:

```ts
interface TransactionalLongBreakCadenceQuery {
  getFactsInTransaction(
    scope: TransactionScope,
    profileId: number,
  ): Promise<PersistenceResult<LongBreakCadenceFacts>>;
}
```

`SQLiteLongBreakCadenceQuery` should reuse one private SQL/read mapper for owner reads and transaction
executor reads. Existing preview API/behavior remains unchanged. No cadence counter or `isDue` is
persisted.

### 4.4. StartBreak use case

Proposed input/output:

```ts
type StartBreakInput = { sourceFocusSessionId: string };
type StartBreakOutcome = {
  outcome: 'started';
  sourceFocusSessionId: string;
  session: RunningSessionRecord;
};
```

Typed errors should distinguish at least:

- source ineligible/missing;
- cadence read/facts invalid;
- active session conflict;
- time/calendar/record invalid;
- insert conflict/write failure;
- transaction technical failure.

The use case does not accept type/duration from Presentation. It validates exact source inside the
transaction, reads cadence inside that transaction, derives the actual tuple, checks active, inserts
and returns only committed output. No notification, analytics, Pet or navigation dependency.

### 4.5. Mobile Start controller/slice

Add a dedicated `BreakStartController` rather than coupling write state into recommendation reads.
Projection:

```ts
type BreakStartProjection =
  | { status: 'idle'; sourceSessionId: string | null }
  | { status: 'submitting'; sourceSessionId: string }
  | { status: 'committed'; sourceSessionId: string; breakSessionId: string }
  | { status: 'error'; sourceSessionId: string; code: BreakStartUiErrorCode };
```

Rules:

- same source while pending returns the same Promise;
- different source cannot steal an in-flight result;
- dispose/generation guard suppresses stale publish;
- success is never remapped to failure because Pet refresh/render fails;
- Retry after a pre-commit error calls Start again; post-commit recovery never calls Start again.

Extend `createBreakRecommendationSlice` into a cohesive Break entry slice or rename it to
`create-break-slice.ts`; preserve narrow controller ownership and explicit disposal.

### 4.6. Result CTA

`BreakRecommendationPanel` receives typed Start command state and callback:

- ready + idle/error → enabled primary `Bắt đầu nghỉ 5/15 phút`;
- submitting → disabled/busy semantic state; duplicate taps coalesce;
- pre-commit error → finite inline copy + retry Start; Home remains available;
- recommendation loading/error → no Start;
- committed → route handoff, no second insert action.

`StandardFocusResultScreen` makes Start primary and `Về Home` secondary only on completed + ready
recommendation. Failed/cancelled variants remain unchanged. Route passes source ID only; no type,
duration or cadence count enters the command.

### 4.7. Exact durable Break handoff

Change `/break/session` to accept required scalar `sessionId`. Add a production branch that:

- exact-loads only valid running Short/Long rows;
- rejects missing/blank/array/foreign/terminal IDs without latest fallback;
- renders committed type/duration and `PetVisualStatus`;
- contains no prototype import or fallback;
- offers read/Pet retry that cannot insert a session;
- does not implement live ticking, completion or Cancel in this Story.

The existing prototype Break screen may remain only behind an explicitly isolated prototype/review
route if still needed; `/break/session` production path must not use it.

## 5. Data and transaction invariants

| Invariant | Enforcement |
|---|---|
| Explicit action only | Start callable only from completed Result callback; tests prove render/Home/reload no write. |
| Exact eligible source | `findByIdInTransaction` + Standard completed validation. |
| Current cadence wins | transactional facts read + Domain decision; UI tuple ignored as command input. |
| At most one active session | active read + insert in same transaction + `ux_sessions_one_running`. |
| Fixed Break shape | Domain tuple + application factory + mapper/check constraints. |
| No reward | record zero/null + schema checks/triggers + no reward repository dependency. |
| Commit before route/Pet | controller receives successful transaction outcome first. |
| No second truth | Zustand/controller holds transient command state only; row/history remains truth. |
| Offline | all required reads/writes use local SQLite; no provider gate. |
| No one-Break-per-Focus claim | Option A has no durable source relation; documented limitation. |

Transaction ordering proposed:

```text
BEGIN IMMEDIATE
  read + validate exact completed Standard source
  read + validate cadence facts
  decide actual Break type/duration
  read active session; reject when present
  construct and validate running Break record
  insert row (unique/check constraints remain backstop)
COMMIT
return actual committed row
```

Clock is captured once at command boundary. Calendar snapshot uses computed `endsAt`. ID generation
must not define business order or cadence.

## 6. Error and recovery matrix

| Failure | Durable result | UI behavior |
|---|---|---|
| Blank/missing/foreign source | No write | Stay Result; source unavailable; Home. |
| Source no longer eligible/corrupt | No write | Fail closed; no Start fallback. |
| Cadence read/corrupt facts | Rollback | Stay Result; retry command/current read. |
| Active Focus/Trial/Break | No write | Explain another session is active; offer Home/open active only if exact reader confirms it. |
| Invalid clock/calendar/record | Rollback | Generic Start unavailable; no plausible row. |
| Insert conflict/write failure | Rollback | Retryable finite error; no route/Pet transition. |
| Transaction technical failure | Rollback/unknown guarded by transaction result | Re-read active truth before allowing another Start if outcome is ambiguous. |
| Commit success, route render read fails | One Break exists | Exact Break recovery; never retry insert. |
| Pet refresh fails | One Break exists | Session screen/recovery remains; retry Pet read only. |
| Rapid double tap | One in-flight UI command | At most one active row; one committed route. |

No technical error copy may mention SQLite, query, transaction, fixture or cadence.

## 7. Planned file impact

### 7.1. New files (indicative names)

- `packages/domain/src/break/break-configuration.ts` + test.
- `packages/application/src/break/break-session-record.ts` + test.
- `packages/application/src/break/start-break.use-case.ts` + test.
- `packages/application/src/break/load-running-break.use-case.ts` + test.
- `apps/mobile/src/application/break/break-start.controller.ts` + test.
- `apps/mobile/src/application/break/break-session.controller.ts` + test.
- `apps/mobile/src/composition/review/break-start-review-fixture.ts` + test.
- `apps/mobile/src/presentation/features/break/break-started-screen.tsx` + test.
- `apps/mobile/test/integration/break-start.integration.test.ts`.
- `apps/mobile/test/device/break-start-smoke.md`.
- `docs/planning/US-07-02_IMPLEMENTATION_REPORT.md` after implementation.

### 7.2. Expected modified files

- Domain/Application barrel exports.
- `packages/application/src/persistence/derived-query.ts` for narrow transactional cadence contract.
- SQLite derived query implementation/tests to share SQL across owner/transaction executors.
- Break application/composition slice, facade and hooks.
- Standard Result branch/screen + recommendation panel/tests for real Start states.
- `/break/session` route to remove production prototype authority and require exact ID.
- root composition/tests/disposal and device-guide validator.

### 7.3. Explicitly unchanged

- migration `001`, schema SQL and database version under approved Option A;
- reward/profile mutation paths;
- Standard/Trial Start behavior;
- notification/analytics adapters;
- app config, package manifest, lockfile and native projects;
- Break terminal/cancel logic.

New/modified feature files target dưới `220` lines; review split ở `240–260`; `300` là hard limit.
Large composition root only wires a narrow slice; business logic không được đặt tại root.

## 8. Ordered implementation tasks

1. Ghi approved confirmations, plan version/status, schema verdict và clean start SHA.
2. Thêm Domain Break configuration validator + table tests; reuse US-07-01 constants.
3. Thêm application Break record factory + invariant tests.
4. Mở transactional cadence port và refactor SQLite query dùng chung SQL/mapping; regression preview.
5. Implement `StartBreakUseCase` với shared coordinator/transaction/current cadence/exact source.
6. Implement exact running-Break loader và validation; không tick/terminal.
7. Implement Start + handoff controllers, generation/single-flight/dispose/error classification.
8. Wire Break slice/facade/readiness/Pet refresh and root disposal.
9. Enable production CTA and exact commit-before-navigation route.
10. Replace `/break/session` prototype authority bằng durable production branch/screen shell.
11. Add isolated fixtures + real SQLite/race/no-write/reopen tests.
12. Run focused tests, full quality, static boundary/hygiene, iOS/Android exports and Doctor.
13. Create implementation report/device guide with exact candidate identity and truthful evidence.
14. Request owner quick UI review; do not open US-07-03 implementation until accepted.

## 9. Automated test plan

### 9.1. Domain/Application unit

- Short/Long exact tuple accepted; every mismatched duration/type rejected.
- Break record exact null/zero/time/calendar/local-date/offset invariants.
- Eligible completed Standard source starts Short/Long from transactional facts.
- Preview stale in both directions; committed current fact wins.
- Reject Trial, running, failed, cancelled, Break, missing, foreign profile and corrupt source.
- Reject invalid cadence facts/marker/count, active conflict, clock/calendar/id/insert/transaction errors.
- Assert dependency calls and order; no reward/profile/notification/analytics port available.

### 9.2. Controller/composition/presentation

- Same-source double tap shares pending operation; stale/disposed results do not publish.
- Pre-commit errors remain Result and retry safely.
- Committed success navigates once using returned Break ID; never preview type as route truth.
- Result loading/error has no Start; completed ready has Start + Home hierarchy.
- Failed/cancelled Standard has no Break Start.
- Exact Break branch rejects malformed/foreign/terminal IDs and never falls back prototype/latest.
- Pet projection is `breaking` only after committed active row; stale Celebrate is preempted.
- Hook/facade/slice disposal and readiness regression.

### 9.3. Real SQLite integration/race

- Short and Long insert exact shape; close/reopen preserves same row.
- Result render/Home/retry/relaunch before tap preserves full session/reward/profile fingerprint.
- Double Start through same/different controller calls produces at most one running row.
- Concurrent Standard/Trial/Break Start: first valid transaction wins; others typed conflict.
- Existing active Focus/Trial/Break remains unchanged.
- Write failure rolls back; retry inserts exactly once.
- Cadence change between preview/tap commits current type.
- Unique/check/trigger backstops reject malformed/rewarded Break rows.
- No reward receipt/profile mutation and no terminal status created.

### 9.4. Regression and gates

- US-07-01 cadence Domain/Application/controller/panel/SQLite tests.
- Trial/Standard Start, Result, Pet arbitration/base/terminal and confirmed reset suites.
- `pnpm quality` under Node `22.23.2`.
- iOS and Android JS exports; Expo Doctor warnings classified against baseline.
- `git diff --check`, boundary validator, device-guide validator, repository hygiene.
- Static search proves production Break route/Start path has no prototype import.

## 10. Manual UI/device plan

Create `apps/mobile/test/device/break-start-smoke.md` with isolated fixtures:

- `break_start_short`;
- `break_start_long_due`;
- `break_start_preview_changes`;
- `break_start_write_failure_once`;
- `break_start_active_conflict`.

Core checks:

1. Open exact completed Result; Home creates nothing and cadence remains unchanged.
2. Short Start: pending state → one durable `short_break/5` → exact route → Pet Breaking.
3. Long Start: pending state → one durable `long_break/15` → exact route → Pet Breaking.
4. Rapid double tap yields one row and one route.
5. Preview-change fixture shows committed type wins preview.
6. Write failure stays Result/no Pet transition; Retry commits once.
7. Active conflict preserves existing session and does not navigate to a fabricated Break.
8. Kill after commit/before observing route; reopen exact ID and verify no duplicate row. Full startup
   resume remains US-07-03, so classify accordingly.
9. Airplane mode succeeds; notification/analytics permission/provider are not required.
10. Screen reader reads type, duration, busy/error and Pet status; large text/Reduce Motion/touch remain
    usable.

Use dedicated disposable databases prefixed `pixeldoro-us-07-02-`; never seed/delete normal
`pixeldoro.db`. Record exact SHA, platform/device/OS/timezone and results separately for automated,
owner quick smoke and formal tester.

## 11. Acceptance criteria

- [ ] Before explicit tap, Result/Home/render/reload/relaunch creates zero Break rows.
- [ ] Exact eligible completed Standard source is revalidated inside Start transaction.
- [ ] Cadence is re-read inside the transaction; actual committed type wins stale preview.
- [ ] Short row is exact `short_break/5`; Long row is exact `long_break/15`.
- [ ] Break null/zero/timestamp/calendar invariants hold; no reward/profile mutation.
- [ ] Trial/failed/cancelled/running/Break/missing/foreign source cannot Start.
- [ ] Active Focus/Trial/Break conflict preserves existing truth.
- [ ] Rapid/concurrent Start creates at most one running session.
- [ ] Navigation and Pet `breaking` occur only after durable commit.
- [ ] Post-commit recovery never retries insert or labels committed Start as failed.
- [ ] Exact Break route reads the committed ID and has no latest/prototype fallback.
- [ ] Production CTA has accessible pending/error/retry and Home remains usable.
- [ ] No notification/analytics/terminal/completion/cancel behavior is added.
- [ ] No schema/dependency/native change under approved Option A.

## 12. Risks and controls

| Risk | Level | Control |
|---|---|---|
| Preview becomes stale | Critical | Transactional cadence read; command accepts source ID only. |
| Duplicate/concurrent Start | Critical | UI single-flight + shared coordinator + transaction + unique index. |
| Commit succeeds but UI retries insert | Critical | Committed is final success; exact-ID recovery path only. |
| Old Result starts additional Break later | High | Explicitly accepted limitation under Option A; no false one-per-Focus claim. |
| Prototype remains production authority | High | Replace exact route branch + static import test. |
| Pet changes before commit | High | Refresh only from active durable read after success. |
| Break accidentally rewarded | High | Factory + mapper/check/trigger + no reward dependencies. |
| Story absorbs timer lifecycle | Medium | Handoff shell only; US-07-03 owns ticks/reconcile/completion. |
| Common Result regressions | Medium | completed/failed/cancelled/Trial test matrix. |

## 13. Rollback strategy

- New Domain/Application/controllers/slice/route branch are additive and revertible as one Story.
- Result CTA can be removed to restore accepted US-07-01 recommendation + Home behavior.
- Durable Break rows created during accepted testing remain valid schema rows; rollback must not raw-delete
  user data. Use confirmed reset only for isolated review databases.
- No migration rollback exists under Option A.
- Safe degraded behavior is completed Result + recommendation + Home; never prototype Start or guessed
  Break type.

## 14. Definition of Ready / Done

### 14.1. Definition of Ready

- [x] US-07-01 exact SHA, automated evidence and owner quick acceptance recorded.
- [x] Current ports/repository/coordinator/Pet/route/prototype gaps audited.
- [x] Target transaction, layer ownership, tests, fixtures and rollback planned.
- [ ] Owner approves `US0702-CONFIRM-01→10`.
- [ ] Plan status/version/schema verdict updated from explicit decisions.
- [ ] Implementation start SHA and worktree overlap state recorded immediately before coding.

### 14.2. Definition of Done

- [ ] All acceptance criteria and focused/full automated gates pass.
- [ ] Both platform exports pass; Doctor delta documented.
- [ ] Production Start/route contains no prototype authority or auto-start path.
- [ ] Report and device guide exist with exact candidate SHA.
- [ ] Owner quick UI output recorded separately from structured/formal evidence.
- [ ] Owner explicitly accepts US-07-02 and authorizes US-07-03 planning.

## 15. Owner confirmation gate — PENDING

### US0702-CONFIRM-01 — One Break per completed Focus / schema

- **Option A — đề xuất:** không thêm source relation; Start từ exact currently displayed eligible
  completed Result khi không có active session. Giữ migration `001`; ghi rõ không có durable guarantee
  one-Break-per-Focus cho Result cũ mở lại.
- **Option B:** thêm `source_focus_session_id` + unique/backstop và forward migration.
- **Option C:** cho Start từ resting surface không bind completed Result.
- **Impact:** mirror `US0700-CONFIRM-01`; B/C block và buộc re-plan schema/navigation.
- [ ] Owner selected option: `<pending>`.

### US0702-CONFIRM-02 — Commit-time cadence consistency

- **Option A — đề xuất:** thêm narrow transactional cadence query, source/facts/active/insert cùng một
  transaction; preview API vẫn giữ riêng.
- **Option B:** đọc cadence trước transaction rồi chỉ insert trong transaction; có race stale.
- **Option C:** tin type từ Result; trái confirmation đã duyệt.
- **Impact:** blocks port/use-case/SQLite design.
- [ ] Owner selected option: `<pending>`.

### US0702-CONFIRM-03 — Ranh giới running UI với US-07-03

- **Option A — đề xuất:** US-07-02 handoff screen chỉ hiện committed type/duration + Pet Breaking +
  notice; không fake/static/live countdown. US-07-03 thêm timestamp countdown/relaunch/completion.
- **Option B:** thêm live countdown cơ bản ngay Story 02 nhưng chưa reconcile deadline/lifecycle; có
  nguy cơ `00:00` treo và mở rộng scope.
- **Option C:** gộp toàn bộ US-07-03 vào Story 02; tăng mạnh scope/risk.
- **Impact:** blocks screen/controller boundary và acceptance copy.
- [ ] Owner selected option: `<pending>`.

### US0702-CONFIRM-04 — Exact Break route identity

- **Option A — đề xuất:** navigate `/break/session?sessionId=<committed-id>`; scalar nonblank exact ID,
  no active/latest/prototype fallback.
- **Option B:** route không ID và đọc active Break; đơn giản nhưng identity mơ hồ/race-prone.
- **Impact:** blocks route/loader/controller contract.
- [ ] Owner selected option: `<pending>`.

### US0702-CONFIRM-05 — Post-commit handoff/Pet failure

- **Option A — đề xuất:** commit là success cuối; open exact Break recovery và chỉ retry durable read/Pet,
  tuyệt đối không retry Start.
- **Option B:** ở lại Result và báo Start failed; dễ khiến user insert lần hai sau active state đổi.
- **Impact:** blocks controller outcome/error model.
- [ ] Owner selected option: `<pending>`.

### US0702-CONFIRM-06 — Controller ownership

- **Option A — đề xuất:** `BreakStartController` riêng, cùng Break slice với recommendation nhưng state
  độc lập; running handoff controller riêng để US-07-03 mở rộng.
- **Option B:** nhét command vào recommendation controller.
- **Option C:** giữ pending/error trực tiếp trong React route.
- **Impact:** blocks file graph/facade/hooks/disposal.
- [ ] Owner selected option: `<pending>`.

### US0702-CONFIRM-07 — Result action hierarchy

- **Option A — đề xuất:** khi recommendation ready, Start là primary; Home là secondary. Loading/error
  cadence không có Start và Home luôn usable.
- **Option B:** cả Start và Home cùng primary hierarchy.
- **Option C:** Home primary, Start secondary.
- **Impact:** blocks exact component props/copy/snapshots/accessibility.
- [ ] Owner selected option: `<pending>`.

### US0702-CONFIRM-08 — Duplicate semantics dưới no-source-relation

- **Option A — đề xuất:** coalesce presses trong cùng pending operation; coordinator/index bảo đảm tối
  đa một active row. Không claim idempotency vĩnh viễn sau Break terminal vì schema không bind source.
- **Option B:** in-memory remember source forever; mất qua relaunch và tạo second truth.
- **Option C:** thêm durable source relation; tương đương confirmation 01 Option B.
- **Impact:** blocks tests/error wording và limitation statement.
- [ ] Owner selected option: `<pending>`.

### US0702-CONFIRM-09 — Review fixture isolation

- **Option A — đề xuất:** `EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE` scenarios mới + database disposable
  prefix `pixeldoro-us-07-02-`; seed/fail via production ports/use cases.
- **Option B:** mock Start result/route; không chứng minh commit.
- **Option C:** seed normal database; không an toàn.
- **Impact:** blocks manual/integration evidence only.
- [ ] Owner selected option: `<pending>`.

### US0702-CONFIRM-10 — Side-effect boundary

- **Option A — đề xuất:** Story 02 không schedule notification và không enqueue analytics; chỉ durable
  Start + Pet read refresh. Notification/analytics vào US-07-05 theo confirmations riêng.
- **Option B:** enqueue `break_started` ngay Story 02; kéo scope/error/dedupe của US-07-05 sớm.
- **Option C:** schedule completion notification ngay Start; phụ thuộc lifecycle contract chưa giao.
- **Impact:** blocks dependency/scope assertions.
- [ ] Owner selected option: `<pending>`.

### 15.1. Approval checklist

- [ ] Owner selects one option for confirmations 01→10.
- [ ] Any non-A selection is reconciled against Product/Architecture/Data Model.
- [ ] Epic-level `US0700-CONFIRM-01` and schema verdict are updated from explicit selection.
- [ ] Plan version/status and implementation start SHA are updated before production edits.
- [ ] No coding starts while a material confirmation remains pending.

## 16. References

- [EPIC-07 User Stories](./EPIC-07_USER_STORIES.md)
- [US-07-01 Plan](./US-07-01_IMPLEMENTATION_PLAN.md)
- [US-07-01 Report](./US-07-01_IMPLEMENTATION_REPORT.md)
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

## 17. Change log và planning validation

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-09-09 | Codex | Created owner-gated plan from committed US-07-01 baseline; defined transactional current-cadence Start, exact durable handoff, Pet Breaking, no-schema default, tests/fixtures/rollback and ten pending confirmations. No production code changed. |

Validation for this planning turn:

- [x] `git diff --check` passes.
- [x] All relative Markdown references resolve.
- [x] Confirmation IDs are continuous `01→10`.
- [x] Only planning/evidence documents changed.
- [x] No unrun automated/manual/formal evidence is marked PASS.

**US-07-02 remains owner-gated. No production implementation is authorized until confirmations
`01→10` are explicitly approved and recorded.**
