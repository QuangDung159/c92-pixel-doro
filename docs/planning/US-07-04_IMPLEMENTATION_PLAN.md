---
document_id: PIXELDORO_US_07_04_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-07-04 Cancel, Terminal Recovery và Race-safe Break Result Plan
version: 0.1.0
status: DRAFT_OWNER_REVIEW_REQUIRED
implementation_status: NOT_STARTED
date: 2026-09-09
last_updated: 2026-09-09
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-07
planning_baseline_sha: d51e1c23683c770dba5f4a0791d29167cb84bd96
implementation_start_sha: NOT_STARTED
exact_implementation_sha: NOT_STARTED
previous_story_sha: d51e1c23683c770dba5f4a0791d29167cb84bd96
previous_story_acceptance: DONE_OWNER_ACCEPTED_QUICK_UI
manual_device_status: NOT_RUN
formal_tester_status: NOT_RUN
schema_change: NONE_PROPOSED
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
scope:
  - mobile_mvp
  - epic_07
  - us_07_04
  - break_cancel
  - terminal_race
  - exact_break_result
  - recovery
authority: PLANNING
story_baseline: ./EPIC-07_USER_STORIES.md
previous_story_plan: ./US-07-03_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-07-03_IMPLEMENTATION_REPORT.md
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

# US-07-04 — Cancel, terminal recovery và race-safe Break Result

## 0. Mục đích và trạng thái

Plan này nối running/completed Break của US-07-03 với explicit Cancel có confirmation, conditional
terminal transaction và exact terminal Result. UI phải luôn render durable winner khi Cancel và
completion cạnh tranh; modal, countdown hoặc thao tác Back không được tự quyết định terminal state.

Lượt hiện tại chỉ cập nhật planning/evidence documents; **không sửa production code**, schema,
dependency, lockfile hoặc native configuration.

**Story outcome:** người dùng có thể dismiss hoặc xác nhận dừng Short/Long Break; cancel hợp lệ trước
deadline commit `cancelled` đúng một lần, không reward; tại/sau deadline completion được xét theo
owner-confirmed precedence; exact Result phản ánh committed `completed` hoặc `cancelled`.

**Priority/order:** `P0`, Story thứ `4` trong EPIC-07.

**Dependency:** US-07-03 đã commit/push và owner accepted quick UI tại exact SHA
`d51e1c23683c770dba5f4a0791d29167cb84bd96` ngày 2026-09-09.

**Planning status:** `DRAFT_OWNER_REVIEW_REQUIRED`.

**Implementation status:** `NOT_STARTED`. Coding bị khóa tới khi owner duyệt plan và confirmations
`US0704-CONFIRM-01→10`; confirmations 01/02 cũng resolve Epic-level `US0700-CONFIRM-03/04`.

### 0.1. Gate từ US-07-03

- [x] Exact timestamp countdown/background/relaunch/completion đã commit/push.
- [x] Conditional Break completion, zero reward, exact-ID route và Pet Idle đã pass automated gates.
- [x] Owner quick UI xác nhận không crash và hoạt động đúng kỳ vọng ngày 2026-09-09.
- [x] Existing `/break/session` đã có running, deadline-pending và completed projection.
- [ ] Structured iOS/Android/accessibility matrix và formal tester vẫn `NOT_RUN`; không suy diễn từ
  owner quick smoke.
- [ ] Epic confirmations `US0700-CONFIRM-03/04` còn pending và phải được khóa trước coding.

### 0.2. Story boundary bắt buộc

- US-07-04 sở hữu confirmation/back, `CancelBreak`, cancel/completion race, exact cancelled projection,
  terminal Result và recovery/retry liên quan Cancel.
- US-07-05 sở hữu Break notification, notification tap, analytics và Epic exit accessibility matrix.
- Story này không thêm Pause/Resume, Strict/grace, Break `failed`, reward, auto-start Focus, history,
  notification hoặc analytics.

## 1. Authority contract

| Authority | Contract áp dụng |
|---|---|
| Product Core | Break chỉ `completed` theo deadline hoặc `cancelled` khi explicit cancel commit trước terminal; không reward. |
| Timer Engine | Capture current time once; `now >= endsAt` là completion boundary; first valid conditional terminal commit wins. |
| Session Lifecycle | Terminal immutable; Cancel/complete qua shared coordinator; invalid truth không được đoán. |
| Data Model | Reuse generic `running → terminal` transition; zero/null reward; cancelled Long không reset cadence. |
| Pet State Machine | Running Break → Breaking; terminal Break → Idle; không Celebrate/Bugged. |
| ADR-002/003/004 | Exact durable ID, mutation ngoài React, UI/prototype không là authority. |

`US0700-CONFIRM-03/04` chưa được owner chốt. Plan chỉ đề xuất Option A; không được xem là product
decision cho tới khi owner xác nhận.

## 2. Current-state audit tại baseline

### 2.1. Đã có thể reuse

- `ReconcileBreakUseCase` và `completeBreakInTransaction` đã cung cấp deadline completion, conditional
  transition, terminal-winner reread và freshness.
- `isRunningBreak`, `isCompletedBreak`, `isCancelledBreak` cung cấp identity validation; cancelled
  hiện chưa được exact loader/controller render.
- `LoadBreakSessionUseCase` exact-load running/completed; route không fallback active/latest.
- `BreakSessionController`, `BreakLifecycleController`, `BreakOutcomeController` đã serialize
  countdown/deadline/foreground và Pet refresh.
- Generic repository `findByIdInTransaction` + `transitionFromRunningInTransaction`, SQLite
  transaction, one-active index và terminal immutability đủ cho cancel; không cần schema mới.
- Common `ConfirmationDialog`, `CountdownDisplay`, `ErrorState`, `InlineNotice`, `Panel`,
  `PetVisualStatus`, buttons và shell/header đã có consumer Trial/Standard Focus.
- `useSessionCancelBack` và Focus modal flow đã xử lý Android hardware Back với gesture disabled.
- Long-break cadence query đã chỉ dùng completed Long marker; cancelled Long tự nhiên không reset.

### 2.2. Gaps phải triển khai

- Chưa có pure Break cancel decision tại before/equal/after deadline và invalid-clock boundary.
- Chưa có `CancelBreakUseCase`, typed result/error, captured-at contract hoặc CAS winner mapping.
- `LoadBreakSessionUseCase` cố ý reject cancelled; exact terminal projection chưa đủ hai outcomes.
- Break controller/hooks/facade chưa có cancel pending/error/single-flight/reset/dispose contract.
- Production Break screen chưa có Dừng, modal, back interception hoặc cancelled Result.
- Completion outcome đã hiểu cancelled winner nhưng lifecycle/route chưa hydrate cancelled projection.
- Startup chỉ route fresh completed Break; fresh cancelled runtime/cold relaunch policy chưa khóa.
- Chưa có review fixtures cho cancel success/write/read/race/Long cadence.
- Chưa có real SQLite cancel-first/completion-first/reopen/no-reward tests hoặc device guide.

### 2.3. Prototype boundary

`presentation/features/break/index.tsx` chỉ là UX evidence cho modal/hierarchy. Production không import
prototype reducer/context/control/badge và không nhận terminal status từ URL hoặc local UI state.

## 3. Proposed behavior contract — chờ owner approval

### 3.1. User flow

```text
exact running Break
  → Dừng phiên / hardware Back
  → accessible ConfirmationDialog
      → Tiếp tục nghỉ: dismiss only, no durable write
      → Dừng phiên nghỉ: CancelBreak(exact ID, capturedAt)
          → capturedAt < endsAt + running → cancelled commit
          → capturedAt >= endsAt + running → completion reconcile
          → terminal/CAS race → exact durable winner
  → commit success
  → refresh exact Break + Pet
  → same exact route renders completed/cancelled Result
  → Về Home
```

### 3.2. Time and race contract

- Route/controller captures one safe timestamp when confirm action enters the command, before waiting
  in the shared coordinator; UI tap time, render time và transaction start time không được trộn.
- `capturedAt < endsAt`: cancel is eligible; transaction conditionally writes cancelled.
- `capturedAt >= endsAt`: command delegates to the same completion helper; it does not write cancelled.
- Conditional loser rereads exact row: completed/cancelled winner is returned typed, never overwritten.
- Duplicate same-ID confirms coalesce; different-ID stale completion cannot navigate current route.
- Deadline callback, foreground, startup and Cancel all share the application coordinator plus SQLite
  conditional transition.
- Countdown pending disables new Cancel request; an already-enqueued pre-deadline request remains
  eligible according to its captured timestamp.

### 3.3. Durable cancel payload

Normal eligible cancel writes only:

```text
status = cancelled
resolvedAt = capturedAt
updatedAt = capturedAt
xpEarned = 0
coinsEarned = 0
rewardClaimedAt = null
backgroundedAt remains null
```

No reward/profile/cadence/notification/analytics/Pet write is part of the transaction. Pet refresh and
navigation occur after commit.

### 3.4. Exact terminal projection

Extend exact Break projection with `cancelled` and strict validation:

- completed: `resolvedAt >= endsAt`;
- normal cancelled: `startedAt <= resolvedAt < endsAt`;
- all Break identity/null/zero fields valid;
- missing/Focus/trial/failed/corrupt rejects, never falls back;
- Result reads exact committed outcome only and cannot trigger mutation or side effects.

## 4. Layer ownership and API design

### 4.1. Domain

Add a pure cancellation decision, for example:

```ts
decideBreakCancellation({ startedAt, endsAt, capturedAt })
  → cancel_allowed
  → completion_due
  → invalid
```

It validates safe integer/order boundaries, never reads clock, and does not construct persistence
payloads. Existing Break configuration remains the type/duration authority.

### 4.2. Application

`CancelBreakUseCase.execute(sessionId, capturedAt?)` owns:

1. nonblank exact ID and one captured safe timestamp;
2. shared coordinator entry;
3. exact transaction read;
4. Break identity/running/terminal classification;
5. before-deadline conditional cancelled transition or at/past-deadline completion helper;
6. CAS loser exact winner reread;
7. typed `cancelled`, `completed`, `already_cancelled` or terminal-winner output;
8. finite read/write/transaction/state/deadline-recovery errors.

It must not depend on profile, reward receipt, notification, analytics, Pet, navigation or React.

`LoadBreakSessionUseCase` expands read-only output to completed/cancelled terminal projections; no
separate “latest result” query is introduced.

### 4.3. Mobile application/composition

- Add `BreakCancelController` for same-ID coalescing, busy/error, stale generation and disposal.
- Keep `BreakSessionController` as exact read/timer projection owner; add cancelled terminal support.
- Extend `BreakOutcomeController` only if runtime terminal handoff needs both completed/cancelled.
- `BreakLifecycleController` remains completion/reconcile owner and treats cancelled CAS winner as
  terminal hydration, not an error.
- Root composition wires Cancel with the same coordinator, transaction, clock and repository used by
  reconciliation; post-commit refreshes exact row and Pet.
- Facade/hooks expose typed projection/actions only; route never imports repository/use case.

### 4.4. Presentation/navigation

- Keep exact `/break/session?sessionId=<id>` as running and terminal surface unless owner selects a
  dedicated result route.
- Running shows secondary `Dừng phiên`, disabled during deadline pending/submitting.
- Hardware Back opens the same modal; iOS gesture remains disabled to avoid route escape without
  confirmation.
- Dismiss closes modal and countdown continues; no durable mutation.
- Successful command refreshes exact row; UI renders durable completed/cancelled winner.
- Result shows type/duration/status/no-reward copy + `Về Home`; no `RewardSummary`,
  `ProgressionSummary`, Claim, Break CTA or Focus auto-start.
- Missing/corrupt exact Result uses Error/Recovery, never Home fallback with fabricated notice.

## 5. Recovery and side-effect rules

| Case | Durable truth | UI behavior |
|---|---|---|
| Dismiss confirmation | unchanged running | Modal closes; countdown continues. |
| Cancel before deadline | cancelled once | Exact cancelled Result after hydration. |
| Confirm at/past deadline | completed once | Exact completed Result; never cancelled by stale UI. |
| Cancel-first race | cancelled | Completion returns terminal winner; Result cancelled. |
| Completion-first race | completed | Cancel returns terminal winner; Result completed. |
| Duplicate confirm | one write | Busy/coalesced; one navigation. |
| Cancel read/write/transaction failure | running or unchanged | Modal/inline retry; no navigation/fake result. |
| Post-commit exact read failure | terminal committed | Local read retry; never re-run mutation as new intent. |
| Pet refresh failure | terminal committed | Result remains; Pet retry is independent. |
| Cancelled Long | cancelled marker only | Long remains due. |
| Relaunch after terminal | immutable terminal | No reward/Pet one-shot replay. |
| Offline/provider unavailable | local path unchanged | Cancel/Result still works. |

Technical copy không lộ SQLite, query, transaction, fixture hoặc timestamp internals.

## 6. Common Component Reuse Matrix

| UI need | Existing component | Decision | Owner | Consumers | Estimate | Regression |
|---|---|---|---|---|---:|---|
| Cancel confirmation | `ConfirmationDialog` | Reuse typed text/busy props unchanged by default | Common presentation | Trial, Standard, Break | 0–20 | all modal consumers |
| Countdown | `CountdownDisplay` | Reuse unchanged | Common presentation | Trial, Standard, Break | 0 | timer semantics/a11y |
| Running/terminal layout | `ScreenShell`, `ScreenHeader`, `Panel` | Reuse | Common presentation | all flows | 0 | snapshots/layout |
| Cancel/error notice | `InlineNotice`, `ErrorState` | Reuse | Common presentation | all flows | 0 | error consumers |
| Actions | `PrimaryButton`, `SecondaryButton` | Reuse busy/disabled | Common presentation | all flows | 0 | button consumers |
| Pet state | `PetVisualStatus` | Reuse unchanged | Common Pet | Home/Trial/Standard/Break | 0 | arbitration/fallback |
| Back intent | `useSessionCancelBack` | Reuse or minimally generalize | App navigation | Trial/Standard/Break | <80 | Android back tests |
| Break Result body | Existing `BreakStartedScreen` branch | Extend feature-local; one current consumer | Break presentation | `/break/session` | <220 file | running/completed regression |

No new common component is proposed. Feature-local Result remains in Break because it has one route;
promote only if a second non-Break consumer needs the same terminal/no-reward contract.

## 7. Planned file impact

### 7.1. New files — indicative

- `packages/domain/src/break/break-cancellation.decision.ts` + test.
- `packages/application/src/break/cancel-break.use-case.ts` + test.
- `apps/mobile/src/application/break/break-cancel.controller.ts` + test.
- `apps/mobile/src/composition/review/break-cancel-review-fixture.ts` + test.
- `apps/mobile/test/integration/break-cancel-result.integration.test.ts`.
- `apps/mobile/test/integration/epic-07-break-cancel-route-integrity.integration.test.ts`.
- `apps/mobile/test/device/break-cancel-result-smoke.md`.
- `docs/planning/US-07-04_IMPLEMENTATION_REPORT.md` after implementation.

Exact file names may be consolidated if ownership stays intact and production files remain below the
project target of 220 lines; no screen/component may exceed 300 lines.

### 7.2. Expected modified files

- Domain/Application barrel exports and Break terminal validators/loader.
- Break session/lifecycle/outcome controllers, facade/hooks and composition.
- `/break/session`, `BreakStartedScreen`, Break presentation exports/tests.
- Root Stack/back handling only if required by approved route policy.
- Review fixture resolver/database selection and device-guide validator.
- EPIC-07 status/evidence documents.

### 7.3. Explicit non-impact

- No migration/schema, package/lockfile, native project or Expo config.
- No RewardTransaction/profile update.
- No notification/analytics adapter (US-07-05).
- No prototype behavior promoted as persistence authority.

## 8. Implementation sequence after approval

1. Record owner selections and exact implementation-start SHA; reconcile any non-A option.
2. Add pure cancel decision and timestamp boundary tests.
3. Tighten normal cancelled Break validator and exact terminal projection.
4. Implement `CancelBreakUseCase` using shared coordinator/transaction/completion helper.
5. Add controller coalescing, typed errors, stale-ID/dispose guards and post-commit hydration.
6. Integrate cancelled terminal winner into lifecycle/outcome/Pet refresh.
7. Wire facade/hooks/root composition without direct route mutation logic.
8. Add running Cancel action, common confirmation, back interception and exact Result branch.
9. Add isolated cancel/race/read/write/Long fixtures through production records/commands.
10. Add real SQLite cancel-first/completion-first/reopen/no-reward/cadence tests.
11. Run full regressions, quality, iOS/Android exports, Doctor and static scope audit.
12. Create report/device guide; request owner quick UI separately from formal evidence.

## 9. Automated test plan

### 9.1. Domain/Application

- Before/equal/after deadline; unsafe, backward and order-invalid timestamps.
- Exact Short/Long eligible cancellation payload and zero/null fields.
- Missing/Focus/trial/failed/corrupt rows reject without write.
- Existing cancelled/completed returns stable typed terminal truth.
- Captured-before-deadline but queued-after-deadline follows approved capture contract.
- CAS loser rereads completed/cancelled winner; read/write/transaction failures finite.
- No reward/profile/notification/analytics dependencies by construction/static audit.

### 9.2. Controller/presentation/navigation

- Same-ID double confirm coalesces; different-ID stale result cannot navigate.
- Busy/error/reset/dispose and detached subscriber/callback guards.
- Dismiss has no command; deadline pending disables new cancel.
- Android hardware Back opens one modal; modal Back dismisses unless busy.
- Running/completed/cancelled exact route branches and invalid ID failure.
- Result contains no reward/progression/Claim/Break CTA/Pet one-shot.
- Common ConfirmationDialog regression for Trial/Standard.

### 9.3. Real SQLite integration

- Short/Long cancel before deadline commits once with exact timestamps and zero reward.
- Cancel-first then reconcile → cancelled; reconcile-first then cancel → completed.
- Equal/after deadline confirm completes rather than cancels under proposed Option A.
- Concurrent duplicate commands yield one transition and stable followers.
- Injected write/read/transaction failure rolls back or preserves committed terminal.
- Reopen exact completed/cancelled; no reward receipt/profile delta.
- Cancelled Long preserves due; completed Long resets due.
- One-active constraint releases after terminal; a new eligible Focus may start normally.

### 9.4. Full gates

- Existing US-07-01→03 cadence/Start/countdown/completion suites.
- Trial/Standard cancel/modal/result/lifecycle regressions.
- Pet base/arbitration/lifecycle regressions.
- `pnpm quality` with Node `22.23.2`.
- iOS and Android Expo JS exports.
- Expo Doctor warnings recorded without opportunistic upgrades.
- `git diff --check`, boundary validator, immutable migration/one-lockfile hygiene.

## 10. Manual UI/device plan

Create `apps/mobile/test/device/break-cancel-result-smoke.md` with disposable
`pixeldoro-us-07-04-*` databases.

Minimum owner quick smoke:

1. Running Short: Dừng/Back opens modal; dismiss continues countdown with no reset.
2. Confirm before deadline: exact cancelled Result, Pet Idle, zero XP/Coin, Home works.
3. Running Long cancel: reopen cadence Result and verify Long remains due.
4. Completion-first and cancel-first race fixtures render their committed winner.
5. Double tap confirm creates one terminal write/navigation.
6. Inject cancel-write and terminal-read failure once; no fake terminal; Retry recovers.
7. Background with modal open, foreground, relaunch terminal and offline paths remain safe.
8. VoiceOver/TalkBack focus/order, largest text, Reduce Motion and touch targets remain usable.

Evidence records exact implementation SHA, fixture/database, platform/device/OS, timestamp/timezone,
online state and PASS/FAIL/BLOCKED/NOT_RUN. Owner quick smoke, structured platform/accessibility and
formal tester remain separate.

## 11. Acceptance criteria

- [ ] Back/Dừng opens accessible confirmation; dismiss writes nothing and countdown continues.
- [ ] Confirm before deadline commits exact cancelled once with zero reward.
- [ ] Confirm at/past deadline follows owner-approved precedence and durable truth.
- [ ] Cancel-first and completion-first races preserve the first valid conditional terminal commit.
- [ ] Duplicate confirm/cancel returns stable terminal truth and one navigation.
- [ ] Exact terminal Result reads completed/cancelled only; rejects foreign/missing/corrupt data.
- [ ] Read/write/transaction/Post-commit hydration failure never invents result or reward.
- [ ] Completed/cancelled Result has Pet Idle and no Celebrate/Bugged/reward/progression UI.
- [ ] Cancelled Long does not reset cadence; completed Long continues to reset it.
- [ ] Background/relaunch/offline behavior preserves committed winner without side-effect replay.
- [ ] No notification/analytics/Pause/Strict/failed behavior leaks into scope.
- [ ] No schema/dependency/native change.
- [ ] Full automated/platform/static gates pass and evidence is recorded honestly.

## 12. Risks and controls

| Risk | Control |
|---|---|
| UI tap wins after deadline incorrectly | Capture once + approved deadline decision inside transaction. |
| Cancel and completion disagree | Same coordinator, conditional update, exact winner reread. |
| Modal dismiss mutates | Presentation-only local state; command only on confirm. |
| Double tap writes/navigates twice | Controller Promise coalescing + SQLite CAS. |
| Completed overwritten by cancel | Terminal immutable; completion winner returned typed. |
| Cancelled overwritten by completion | Completion helper recognizes cancelled terminal winner. |
| Result grants reward | Exact zero validator; no reward/profile ports/components. |
| Cancelled Long resets due | Existing query only selects completed Long; real SQLite assertion. |
| Back escapes active session | Reuse back hook; gesture disabled; modal owns intent. |
| Post-commit read error retries mutation | Separate mutation success from exact hydration retry. |
| Corrupt row force-cancel unsafe | Owner-gated narrow recovery policy; no raw repair/delete. |
| Scope absorbs notification | Static imports/tests and explicit US-07-05 boundary. |

## 13. Rollback strategy

- Revert new cancel command/controller/presentation wiring as one Story while preserving US-07-03
  countdown/completion.
- Terminal rows already created are valid immutable data and must not be raw-deleted.
- If terminal UI is rolled back, exact completed hydration from US-07-03 remains supported; cancelled
  records fail closed until cancel feature is restored.
- Use confirmed reset only for disposable review data; no migration rollback exists.

## 14. Definition of Ready / Done

### 14.1. Definition of Ready

- [x] US-07-03 exact committed SHA and owner quick acceptance recorded.
- [x] Product/Timer/Session/Data/Pet contracts and current code gaps audited.
- [x] Existing common components and Trial/Standard cancel consumers audited.
- [x] No-schema/dependency/native default established.
- [x] Transaction/race/recovery/test/fixture strategy documented.
- [ ] Owner approves `US0704-CONFIRM-01→10`.
- [ ] Epic `US0700-CONFIRM-03/04` are resolved consistently.
- [ ] Plan status/version and exact implementation-start SHA updated before coding.

### 14.2. Definition of Done

- [ ] All acceptance criteria and focused/full automated gates pass.
- [ ] Both platform exports pass; Doctor warnings recorded truthfully.
- [ ] Exact running/completed/cancelled route contains no prototype/fallback authority.
- [ ] No reward/profile/notification/analytics write is reachable.
- [ ] Report/device guide/exact implementation SHA exist.
- [ ] Owner quick UI output is recorded separately from structured/formal evidence.
- [ ] Owner explicitly accepts US-07-04 and authorizes US-07-05 planning.

## 15. Owner confirmation gate — PENDING

### US0704-CONFIRM-01 — Terminal destination (`US0700-CONFIRM-03`)

- **Option A — đề xuất:** completed/cancelled đều render exact Break Result rồi user chọn Home.
- **Option B:** completed có Result; cancelled về Home ngay.
- **Option C:** cả hai về Home với transient notice.
- **Impact:** khóa terminal navigation, reader/screen và cold/warm handoff.
- [ ] Owner selected option: PENDING.

### US0704-CONFIRM-02 — Cancel đúng/sau deadline (`US0700-CONFIRM-04`)

- **Option A — đề xuất:** capture time một lần; `capturedAt >= endsAt` phải reconcile completed, không
  ghi cancelled. Request capture trước deadline vẫn eligible khi phải chờ coordinator.
- **Option B:** transaction cancel lock trước thì thắng kể cả tap sau deadline.
- **Option C:** disable Cancel bằng buffer ở giây cuối.
- **Impact:** khóa domain boundary và cả hai thứ tự race.
- [ ] Owner selected option: PENDING.

### US0704-CONFIRM-03 — Route cho terminal Result

- **Option A — đề xuất:** evolve cùng exact `/break/session?sessionId=<id>` cho running/completed/
  cancelled; không tạo route mới.
- **Option B:** terminal chuyển sang `/break/result?sessionId=<id>`.
- **Impact:** A reuse hydration/lifecycle hiện có; B tách surface nhưng thêm bridge/test.
- [ ] Owner selected option: PENDING.

### US0704-CONFIRM-04 — Back và modal lifecycle

- **Option A — đề xuất:** Dừng/Android Back mở cùng modal; iOS gesture giữ disabled; background hoặc
  route deactivate dismiss modal transient; busy modal không dismiss.
- **Option B:** modal giữ mở qua background/foreground.
- **Option C:** Back về Home không confirmation, chỉ nút Dừng mới mở modal.
- **Impact:** khóa navigation safety và transient state tests.
- [ ] Owner selected option: PENDING.

### US0704-CONFIRM-05 — Cancelled Result content

- **Option A — đề xuất:** type/duration + `CANCELLED` + Pet Idle + no-reward text + Home; không render
  Reward/Progression/stat cards hoặc Focus Again.
- **Option B:** render stat card XP/Coin đều 0.
- **Option C:** cancelled chỉ hiện notice ngắn.
- **Impact:** khóa visual hierarchy và component reuse.
- [ ] Owner selected option: PENDING.

### US0704-CONFIRM-06 — Cold relaunch terminal policy

- **Option A — đề xuất:** fresh runtime cancel mở exact Result; cold launch sau terminal về Home trừ
  khi có exact deep link. Không thêm durable viewed marker.
- **Option B:** mọi cold launch mở latest terminal Break Result.
- **Option C:** thêm durable viewed marker để reopen unseen Result.
- **Impact:** A giữ no-schema/exact-ID; B dùng latest fallback; C cần data-model/migration review.
- [ ] Owner selected option: PENDING.

### US0704-CONFIRM-07 — Post-commit read/Pet failure

- **Option A — đề xuất:** terminal commit là final; retry exact hydration/Pet only, không gửi lại
  cancel intent như mutation mới.
- **Option B:** coi toàn flow failed và cho nút Cancel Retry.
- **Impact:** khóa idempotency và recovery surface.
- [ ] Owner selected option: PENDING.

### US0704-CONFIRM-08 — Corrupt active Break recovery

- **Option A — đề xuất:** thêm narrow recovery-cancel chỉ khi exact active row vẫn chứng minh được
  Break identity và conditional `running`; không repair/delete. Row không đủ identity tiếp tục global
  recovery/confirmed reset.
- **Option B:** chỉ Retry/global confirmed reset; không recovery-cancel trong Story này.
- **Option C:** raw force-cancel mọi corrupt session.
- **Impact:** khóa Timer `TE-EDGE-002` recovery interpretation và infrastructure seam; C không đề xuất.
- [ ] Owner selected option: PENDING.

### US0704-CONFIRM-09 — Review fixtures

- **Option A — đề xuất:** disposable `pixeldoro-us-07-04-*`; real 5/15-minute rows; injected clock và
  one-shot read/write/race failures only.
- **Option B:** persist Break vài giây để test nhanh.
- **Option C:** mutate normal database thủ công.
- **Impact:** khóa evidence fidelity/data safety.
- [ ] Owner selected option: PENDING.

### US0704-CONFIRM-10 — Scope/schema/side effects

- **Option A — đề xuất:** no schema/dependency/native; không notification/analytics; reuse generic
  transition, common modal và same route.
- **Option B:** kéo Break notification vào Story 04.
- **Option C:** thêm terminal/source/viewed schema.
- **Impact:** khóa Story size và gate US-07-05.
- [ ] Owner selected option: PENDING.

### 15.1. Approval checklist

- [ ] Owner selects one option for confirmations `01→10`.
- [ ] Any non-A selection is reconciled against authority, file impact and test plan.
- [ ] Epic `US0700-CONFIRM-03/04` status is updated from explicit owner decisions.
- [ ] Plan version/status and exact implementation-start SHA are updated before coding.
- [ ] No material confirmation remains pending.

## 16. References

- [EPIC-07 User Stories](./EPIC-07_USER_STORIES.md)
- [US-07-03 Plan](./US-07-03_IMPLEMENTATION_PLAN.md)
- [US-07-03 Report](./US-07-03_IMPLEMENTATION_REPORT.md)
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
| 0.1.0 | 2026-09-09 | Codex | Created owner-gated US-07-04 plan from accepted US-07-03 exact SHA; defined cancel/deadline decision, shared conditional race, exact terminal Result, recovery, common reuse, fixtures/tests and ten pending confirmations. No production code changed. |

Validation required for this planning turn:

- [x] `git diff --check` passes.
- [x] All relative Markdown references resolve.
- [x] Confirmation IDs are continuous `01→10`.
- [x] Only planning/evidence documents changed.
- [x] No unrun automated/manual/formal evidence is marked PASS.

**Do not implement US-07-04 until owner approves the plan and all material confirmations.**
