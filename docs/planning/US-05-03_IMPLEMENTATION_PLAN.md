---
document_id: PIXELDORO_US_05_03_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-05-03 Implementation Plan
version: 0.1.0
status: READY_FOR_OWNER_CONFIRMATION
implementation_status: NOT_STARTED
created_at: 2026-08-31
last_updated: 2026-08-31
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-05
baseline_sha: ef05b207e48bf36623932a83bc24d589dca99f23
formal_tester_status: DEFERRED_TO_LATER_PHASE
scope:
  - mobile_mvp
  - epic_05
  - us_05_03
  - atomic_trial_completion
  - exactly_once_reward
  - startup_foreground_reconciliation
  - committed_result
authority: PLANNING
story_baseline: ./EPIC-05_USER_STORIES.md
previous_story_plan: ./US-05-02_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-05-02_IMPLEMENTATION_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
system_architecture: ../architecture/system-architecture.md
project_structure: ../architecture/project-structure.md
data_model: ../architecture/data-model.md
timer_specification: ../specifications/timer-engine.md
session_lifecycle: ../specifications/session-lifecycle.md
gamification_rules: ../specifications/gamification-rules.md
adr_navigation: ../architecture/decisions/ADR-002-navigation-with-expo-router.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-05-03 — Complete and Reward Exactly Once

## 0. Mục đích và trạng thái

Tài liệu này khóa implementation plan cho Story thứ ba của `EPIC-05 — First-use Onboarding Trial`.
Lượt này chỉ sửa planning/acceptance record, không sửa production code, schema/migration, dependency
hay native artifact.

**Story outcome:** khi trial tới hoặc quá `endsAt`, một command duy nhất commit nguyên tử session
`completed`, một reward receipt `onboarding_trial_completed`, profile `+5 XP / +1 Coin`; Result chỉ
hiển thị dữ liệu đã commit. Deadline tick, foreground và startup dùng cùng một command. Retry,
reopen, relaunch hoặc các nguồn chạy đồng thời không được cộng lại.

**Priority:** `MUST` / `P0` / execution order `03` trong EPIC-05.

**Entry baseline:** US-05-02 được owner đóng `DONE_OWNER_ACCEPTED` tại exact SHA
`ef05b207e48bf36623932a83bc24d589dca99f23`. Formal tester/Development Build evidence của 05-02
được chuyển sang phase tester sau và không được ghi giả là đã pass.

**Planning status:** `READY_FOR_OWNER_CONFIRMATION`.
**Implementation status:** `NOT_STARTED`. Không production implementation trước khi owner duyệt
`US0503-CONFIRM-01`…`08`.

### 0.1. Readiness gate

- [x] Branch `feats/epic-05` sạch và khớp origin tại `ef05b207…` khi audit.
- [x] US-05-02 đã đóng trên exact implementation SHA; completion/reward boundary được transfer rõ.
- [x] DEC-05-04 đã khóa automatic commit rồi mới Result.
- [x] Existing SQLite schema, repositories, transaction, startup và lifecycle contracts đã audit.
- [x] Schema hiện tại đủ; không migration/index/dependency/native permission mới.
- [x] Reward amount/reason/exclusion đã khóa bởi Gamification spec: `5 XP`, `1 Coin`,
  `onboarding_trial_completed`.
- [x] Automated/real SQLite gates là bắt buộc trong implementation.
- [x] Formal tester/device matrix được chuẩn bị nhưng execution giữ `DEFERRED_TO_LATER_PHASE` theo
  chỉ đạo owner.
- [ ] Owner duyệt toàn bộ confirmation trước khi đổi Story sang `READY/IN_PROGRESS`.

## 1. Baseline audit và gap map

### 1.1. Foundation có thể reuse

| Capability | Baseline `ef05b207` | Cách dùng trong US-05-03 |
| --- | --- | --- |
| Trial truth | Exact five-minute Relax onboarding record + timestamp countdown | Reuse invariant và `endsAt`; không tạo timer truth mới. |
| Command serialization | Một `SessionCommandCoordinator` dùng chung Start/Cancel | Completion phải dùng đúng cùng instance. |
| Session transition | Conditional `running → terminal` trong transaction | Reuse cho `completed`; không update terminal row. |
| Reward repository | Read by session + transactional insert | Thêm transactional read để classify duplicate ngay trong transaction. |
| Profile repository | Transactional read + progression update | Reuse để cộng đúng `5/1` trong cùng transaction. |
| SQLite constraints | One active session, one receipt/session, terminal immutability | Defense in depth sau Application idempotency. |
| Reward trigger | Receipt chỉ insert khi completed session khớp profile/delta/reason/time | Khóa write order session → receipt → profile. |
| Running controller | `deadline_pending`, durable refresh, lifecycle-aware tick | Thêm one-shot request callback; không cho controller tự SQL. |
| Startup | Readiness đóng đến sau `reconcileAtStartup` | Thay Noop bằng production adapter gọi cùng completion use case. |
| First-use route | Completed trial chưa onboarding-complete → Result | Refresh sau commit; startup/relaunch đi đúng durable Result. |
| Result UI | Prototype `focus/result` còn đọc PrototypeProvider | Production trial projection thắng; Standard prototype fallback tách biệt. |

### 1.2. Gap bắt buộc phải đóng

1. Chưa có `CompleteOnboardingTrialUseCase` và exact completion outcome types.
2. `RewardReceiptRepository` chưa có `findBySessionIdInTransaction` để verify duplicate/corruption
   trong cùng transaction.
3. `NoopStartupReconciliationAdapter` chưa resolve overdue trial.
4. Deadline chỉ dừng ở `deadline_pending`; foreground lifecycle chưa request completion.
5. Chưa có single-flight mobile completion controller/fresh-event buffer.
6. Result production chưa đọc session + receipt + profile committed truth.
7. Bootstrap hydrate trước startup reconcile; nếu startup commit progression, snapshot ban đầu bị cũ.
8. Fixture 05-02 chưa có overdue/race/one-shot reward failure scenarios của 05-03.

## 2. Phạm vi khóa

### 2.1. In scope

- Pure validation cho eligible onboarding completion và exact reward invariant.
- Shared Application completion command với một atomic transaction.
- Idempotent outcomes cho fresh completion, already-completed, still-running, no-active và terminal
  winner.
- Stable fresh terminal event chỉ được tạo sau transaction commit.
- Transaction-scoped reward receipt lookup; SQLite adapter/test updates tương ứng.
- Một completion controller/facade single-flight cho deadline và foreground.
- Production startup reconciliation adapter dùng cùng use case trước readiness open.
- Post-reconciliation re-hydrate bootstrap snapshot khi startup thực sự commit durable changes.
- Committed onboarding Result loader/controller, RewardSummary, pending/error/retry và navigation
  sau commit.
- Finite dev-only overdue/race/reward-failure fixtures; real SQLite atomicity/race/reopen evidence.

### 2.2. Out of scope

- Pet celebration animation/presentation, consuming the fresh event, replay policy UI (US-05-04).
- Enabled Continue/Home handoff hoặc write `onboarding_completed_at` (US-05-04).
- Analytics provider/event delivery (US-05-05).
- Standard Focus completion/reward, Break flow, Strict/grace, work tag hoặc history productionization.
- Notification/background task/audio/haptic.
- Claim reward CTA, reward recomputation trong screen, fake profile/reward.
- Schema/migration/index/package/native change.

### 2.3. Fake remaining được phép

- Result dùng Cat/Mèo Dev base state; không gọi Pet terminal feedback trong Story này.
- Continue/Pet Room CTA có thể hiện đúng approved layout nhưng phải disabled/review-only và không
  navigate; enabled persisted handoff thuộc US-05-04.
- Standard Result prototype chỉ còn là isolated fallback khi không có durable onboarding trial.
- Reward/session/profile tuyệt đối không dùng mock hoặc fallback number.

## 3. Technical directions đề xuất

### TD-05-03-A — Một completion command, một transaction, exact write order

Tạo `CompleteOnboardingTrialUseCase` trong Shared Application. Command nhận optional `sessionId`:

- deadline source truyền stable running `sessionId`;
- startup/foreground có thể reconcile active session khi không có ID;
- clock, ID, repositories, transaction và existing `SessionCommandCoordinator` đều injected.

Trong coordinator và `transaction.execute`:

1. Read target session trong transaction.
2. Validate exact onboarding trial invariant, profile `1`, `status=running` và `now >= endsAt`.
3. Read singleton profile trong transaction; missing/corrupt là failure trước write.
4. Conditional transition session `running → completed` với:
   `resolvedAt=now`, `xpEarned=5`, `coinsEarned=1`, `rewardClaimedAt=now`, `updatedAt=now`.
5. Insert one receipt `{sessionId, profileId:1, xpDelta:5, coinDelta:1,
   reason:'onboarding_trial_completed', createdAt:now}`.
6. Apply profile progression `+5/+1`; `not_updated` là failure.
7. Transaction commit xong mới trả fresh event/result.

Write order session → receipt → profile là bắt buộc vì existing SQLite trigger từ chối receipt nếu
completed session fields/reason/time chưa khớp. Bất kỳ failure nào rollback cả ba writes.

### TD-05-03-B — Idempotency và race classification

Outcome đề xuất:

```text
completed_fresh(result, event)
already_completed(result, event = none)
still_running(sessionId, endsAt)
no_active
already_terminal(cancelled)
not_applicable(non-trial active)
error(recoverable code)
```

Defense layers:

1. Mobile single-flight ngăn UI/lifecycle duplicate trong cùng source.
2. Existing shared FIFO coordinator serialize Start/Cancel/Complete trong cùng runtime.
3. Conditional `WHERE status='running'` quyết định terminal winner.
4. Unique `reward_transactions(session_id)` và reward-session trigger bảo vệ database.
5. Known-ID duplicate re-read completed session + matching receipt trong transaction rồi trả
   `already_completed`; không emit event, không profile update.
6. Startup/foreground không còn active trả `no_active`; Result loader hydrate committed fact riêng,
   không dùng no-active làm lý do trao reward.

Corrupt completed session thiếu/mismatch receipt không được chữa bằng cách insert/reward lại; trả
safe persistence/invariant error để tránh duplicate.

### TD-05-03-C — Một source controller cho deadline, foreground và startup

- `OnboardingTrialRunningController` thêm callback `onDeadlineReached(sessionId)` one-shot theo
  session/generation. Nó chỉ request Application command, không biết transaction/navigation.
- `OnboardingTrialCompletionController` giữ finite projection
  `idle | resolving | committed | error`, coalesce request trùng và gọi completion use case.
- Foreground lifecycle gọi controller này trước khi refresh Running/First-use/Pet base.
- Startup dùng `ProductionStartupReconciliationAdapter` gọi cùng use case khi readiness còn đóng.
- Tất cả dependency graph dùng cùng `SessionCommandCoordinator` đã tạo trong composition.

Deadline/foreground success phải load committed Result projection rồi mới expose navigation signal.
Error giữ Running ở truthful completion-pending/recovery với Retry; không mở Cancel ở/qua deadline.

### TD-05-03-D — Startup reconciliation barrier và snapshot freshness

Giữ thứ tự foundation hiện tại `open → migrate → verify → initial hydrate → reconcile`. Đổi
`StartupReconciliationPort` success value từ `void` sang outcome
`{ durableDataChanged: boolean }`.

- `false`: dùng initial snapshot, không đọc lại.
- `true`: bootstrap đọc `BootstrapData` lần cuối sau commit, trước `readiness.open()` và publish
  `ready`.
- Re-hydrate failure vào existing recovery path; không fake ready với profile snapshot cũ.
- Completed row được hydrate khi relaunch không phải durable change và không tạo fresh event.

Live deadline/foreground Result loader luôn đọc repositories sau commit. Production Home chưa được
mở trong 05-03; US-05-04 phải refresh committed profile before enabled Continue→Home.

### TD-05-03-E — Committed Result và fresh-vs-hydrated event

Tạo `LoadOnboardingTrialResultUseCase`/mobile Result controller đọc:

- latest onboarding trial phải `completed` với exact `5/1` và non-null `rewardClaimedAt`;
- receipt by session phải khớp profile, reason, delta và `createdAt=rewardClaimedAt`;
- profile record phải tồn tại; total XP/Coin là committed facts, không được screen tự cộng.

Result projection có `loading | ready | missing | error`. `ready` mang session/receipt IDs, reward
deltas, committed totals và resolved timestamp. Reopen/relaunch chỉ load projection; không chạy
reward mutation.

Fresh event dùng receipt ID làm stable identity, chứa session/receipt/resolvedAt/`5/1`, và chỉ xuất
hiện trong `completed_fresh` sau commit. Startup vừa thực sự commit overdue trial có thể buffer event
trong completion boundary; startup hydrate một completed trial cũ tuyệt đối không emit. US-05-04 mới
được consume event cho Pet.

### TD-05-03-F — Production Result route và component ownership

- `/focus/result` ưu tiên committed onboarding Result khi trial durable tồn tại; Standard Focus
  prototype fallback giữ isolated.
- Tạo common pure `RewardSummary` nhận committed props; không import repositories/rules.
- Production `OnboardingTrialResultScreen` reuse `ScreenShell`, `ScreenHeader`, `Panel`, `PetStage`
  base, `StatDisplay`, `StatusSurface`, `InlineNotice` và common Button.
- Không claim button; `+5 XP / +1 Coin` lấy từ projection.
- CTA handoff hiển thị disabled/review-only để không bypass US-05-04.
- Automatic replace tới Result chỉ khi completion controller đã commit và Result projection ready.
- Nếu commit thành công nhưng Result read lỗi, retry chỉ read; không chạy reward lần hai.

### TD-05-03-G — Finite fixtures và truthful recovery

Mở rộng dev-only review fixture với đúng ba scenario đã khóa trong Epic:

| Fixture | Behavior | Không được làm |
| --- | --- | --- |
| `trial_overdue_running` | Sau migration, seed exact durable running row đã overdue rồi gọi production startup reconcile. | Không seed completed/reward/profile. |
| `trial_complete_race` | Kích deadline + foreground requests đồng thời qua production controller/use case. | Không bypass coordinator/transaction. |
| `trial_reward_write_failure` | Fail đúng lần receipt insert đầu; retry dùng real repository và commit. | Không giữ failure vĩnh viễn hoặc fake success. |

Fixture chỉ tồn tại khi `__DEV__`, diagnostics enabled và env value thuộc finite allowlist. Add tests
chứng minh production default không wrap repos/clock và persisted duration vẫn đúng 5 phút.

### TD-05-03-H — Scope/no-schema và evidence policy

- Không thay `001_initial-schema`, manifest, dependency lockfile, Expo/native config.
- Chỉ mở transaction-scoped reward read method; không tạo bảng/event outbox mới.
- Automated + real SQLite atomicity/race/reopen tests phải pass trước implementation report.
- Formal tester/device execution tiếp tục `DEFERRED_TO_LATER_PHASE` theo chỉ đạo owner. Plan vẫn tạo
  guide/matrix để tester chạy sau; không mark manual pass trong report nếu chưa có evidence.

## 4. Application contracts chi tiết

### 4.1. Eligibility

Chỉ complete khi tất cả đúng:

| Field | Required |
| --- | --- |
| `sessionType` | `focus` |
| `focusVariant` | `onboarding_trial` |
| `mode` | `relax` |
| `workTag` | `null` |
| `configuredDurationMinutes` | `5` |
| `profileId` | `1` |
| `status` | `running` |
| `resolvedAt/rewardClaimedAt` | `null` |
| `xpEarned/coinsEarned` | `0/0` |
| Time | captured `now >= endsAt` |

`now < endsAt` trả `still_running`, không round/fast-forward. Onboarding trial không có `failed`.

### 4.2. Transaction errors

Public error codes phải finite và presentation-safe, ví dụ:

- `ONBOARDING_TRIAL_READ_FAILED`
- `ONBOARDING_TRIAL_NOT_ELIGIBLE`
- `ONBOARDING_TRIAL_COMPLETION_FAILED`
- `ONBOARDING_TRIAL_RESULT_READ_FAILED`
- `ONBOARDING_TRIAL_RESULT_INCONSISTENT`

Không leak SQLite message/SQL. Transaction busy/constraint/corrupt map về recoverable application
error; logs/diagnostics có thể giữ typed internal detail theo existing policy.

### 4.3. Post-commit ordering

```text
capture now + reward id
  -> shared coordinator
    -> transaction validates + writes + commits
      -> build/publish fresh event
        -> reload committed Result + other projections
          -> navigation signal
```

Không refresh/navigate/event trong transaction callback. Pet refresh trong 05-03 chỉ base committed
projection; không nhận terminal event.

## 5. File ownership và dự kiến thay đổi

| Area | Planned change |
| --- | --- |
| `packages/application/src/onboarding-trial/` | Completion invariant/use case, result loader, outcome/event types và unit tests. |
| `packages/application/src/persistence/reward-receipt.repository.ts` | Add transaction-scoped read contract. |
| `apps/mobile/src/infrastructure/database/repositories/` | Implement transaction-scoped reward read; mapper/SQLite tests. |
| `apps/mobile/src/application/onboarding-trial/` | Completion controller + Result controller; extend Running deadline callback. |
| `apps/mobile/src/application/ports/startup-reconciliation.port.ts` | Typed changed/unchanged outcome. |
| `apps/mobile/src/composition/startup/` | Production onboarding trial reconciliation adapter; retire Noop in production graph. |
| `apps/mobile/src/application/bootstrap/` | Conditional post-reconciliation hydrate before ready. |
| `apps/mobile/src/composition/create-mobile-application.ts` | One shared coordinator/use case/controller graph and lifecycle ordering. |
| `apps/mobile/src/composition/review/` | Three finite completion fixtures and isolation tests. |
| `apps/mobile/src/presentation/components/` | Common pure `RewardSummary` + tests/export. |
| `apps/mobile/src/presentation/features/onboarding-trial/` | Production Result screen/recovery + tests. |
| `apps/mobile/src/app/focus/result.tsx` | Durable trial arbitration and post-commit navigation behavior. |
| `apps/mobile/test/integration/` | Real SQLite atomicity/race/rollback/reopen/startup cases. |
| `apps/mobile/test/device/` | US-05-03 deferred tester guide/harness validation. |

Không tạo generic session completion framework hoặc refactor Standard Focus trong Story này.

## 6. Implementation sequence

1. **Shared contracts:** exact invariant, reward constants, outcome/event and transactional reward read.
2. **Atomic command:** happy path, duplicate/terminal classification, rollback/error tests.
3. **SQLite adapter/integration:** trigger-compatible write order, unique receipt, concurrency/reopen.
4. **Startup barrier:** production adapter, changed outcome, conditional final hydrate, recovery tests.
5. **Runtime orchestration:** completion controller, deadline callback, foreground single-flight.
6. **Committed Result:** loader/controller, common RewardSummary, production route arbitration.
7. **Fixtures/recovery:** overdue/race/one-shot failure and production-isolation tests.
8. **Regression/evidence:** root quality, boundaries, line limits, schema/dependency/hygiene diff audit.
9. **Report:** bind implementation to exact SHA; formal tester fields remain deferred unless evidence
   actually arrives.

Mỗi bước giữ test gần code. Không mở US-05-04 behavior để “test end-to-end” sớm.

## 7. Automated test matrix

### 7.1. Shared unit/application

- Exact eligible trial at and after deadline completes; one millisecond before remains running.
- Wrong variant/mode/tag/duration/profile/status/reward fields reject without writes.
- Transaction writes exact completed fields, receipt reason/time/delta and profile `+5/+1`.
- Failure at session, receipt or profile boundary rolls back and returns error.
- Known-ID duplicate returns same committed result without event/write.
- Cancel-vs-complete winner is terminal and deterministic through shared coordinator.
- Fresh event exists only after transaction success; hydration/error never emits.
- Result loader rejects missing/mismatched receipt and returns committed totals/deltas.

### 7.2. Mobile controller/bootstrap/presentation

- Duplicate deadline ticks and foreground calls coalesce.
- Deadline callback is one-shot per session/generation and Retry is possible after error.
- Startup overdue commit blocks ready, then conditionally rehydrates snapshot.
- Startup existing completed record does not change data or emit event.
- Startup reconciliation/read failure stays in existing recovery flow.
- Navigation occurs only after committed Result projection ready.
- Result has no claim/prototype controls; reward label is grouped/accessibility-readable.
- Large text wraps; Reduce Motion does not hide outcome; disabled Continue cannot navigate.
- Standard Focus prototype fallback remains unchanged when no durable onboarding trial exists.

### 7.3. Real SQLite integration

- Running → completed + one receipt + profile `5/1` in one transaction.
- Two concurrent sources yield exactly one fresh completion; row/receipt/profile count stays one.
- Unique receipt, immutable terminal and reward trigger protections remain effective.
- Injected receipt/profile failure leaves running row, no receipt and profile unchanged.
- Retry after one-shot failure commits once.
- Close/reopen completed DB hydrates same Result and no new reward/event.
- Onboarding trial remains excluded from Standard completed-session history/contribution queries.
- Offline network state has no effect on local transaction.

### 7.4. Repository gates

- Targeted package/mobile suites.
- `pnpm run quality`.
- `git diff --check`.
- boundary/device harness/repository hygiene.
- no modified migration/schema manifest/package lock/native config.
- changed production UI files `<300` hard limit; plan review threshold `≤240` where practical.

## 8. Formal tester guide — execution deferred

Guide sẽ được implement cùng fixture nhưng không được đánh dấu pass trong Story report nếu tester
chưa gửi evidence.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_overdue_running pnpm start --clear
```

Deferred matrix:

1. Cold launch overdue running trial; no reward appears before commit; Result then shows `+5 XP` and
   `+1 Coin`, no claim.
2. Record session/receipt/profile facts; reopen, foreground repeatedly, kill/relaunch; facts unchanged.
3. `trial_complete_race`: exactly one Result, receipt and `+5/+1` increment.
4. `trial_reward_write_failure`: no partial data; Retry succeeds once.
5. Offline completion succeeds locally.
6. Screen reader, large text and Reduce Motion preserve meaning/order.
7. Cat stays base; Continue disabled; no celebration/Home handoff yet.

Evidence fields: exact SHA, platform, device/simulator, OS, Development Build version, captures,
before/after durable facts, pass/fail per case. Current status of all fields: `DEFERRED`.

Cleanup:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

## 9. Definition of Done

- [ ] Owner approves `US0503-CONFIRM-01`…`08`; implementation start SHA is recorded.
- [ ] All completion sources use one command/coordinator and commit before navigation/event.
- [ ] Session + receipt + profile write atomically with exact `5/1` and correct reason.
- [ ] Duplicate/race/retry/reopen/relaunch cannot duplicate reward/profile progression.
- [ ] Failure at each write boundary leaves no partial mutation and has truthful recovery.
- [ ] Startup overdue reconcile blocks readiness and publishes a post-reconcile fresh snapshot.
- [ ] Result reads committed session/receipt/profile facts; no screen formula/claim/fake reward.
- [ ] Fresh event exists post-commit only; old hydration emits none; Pet consumption remains 05-04.
- [ ] Continue/Home remains disabled/transferred; Standard prototype remains isolated.
- [ ] Targeted, real SQLite, root quality, boundary, hygiene and line-count gates pass.
- [ ] No schema/migration/dependency/native/analytics/notification change.
- [ ] Implementation report is bound to an exact final SHA.
- [ ] Formal tester fields remain `DEFERRED` unless actual later-phase evidence is supplied; no false
  manual pass is recorded.

## 10. Owner confirmation gate

| ID | Confirmation | Recommendation | Status |
| --- | --- | --- | --- |
| `US0503-CONFIRM-01` | One shared completion use case; atomic session → receipt → profile order with exact `5/1` | Approve TD-05-03-A | `PENDING OWNER` |
| `US0503-CONFIRM-02` | Fresh/already/still-running/no-active/terminal outcomes plus coordinator + constraints idempotency | Approve TD-05-03-B | `PENDING OWNER` |
| `US0503-CONFIRM-03` | Deadline, foreground and startup feed one single-flight completion boundary | Approve TD-05-03-C | `PENDING OWNER` |
| `US0503-CONFIRM-04` | Startup changed outcome triggers one post-reconcile hydrate before readiness opens | Approve TD-05-03-D | `PENDING OWNER` |
| `US0503-CONFIRM-05` | Result validates committed session/receipt/profile; stable fresh event only after commit | Approve TD-05-03-E | `PENDING OWNER` |
| `US0503-CONFIRM-06` | Production Result + common RewardSummary; base Pet and disabled Continue until 05-04 | Approve TD-05-03-F | `PENDING OWNER` |
| `US0503-CONFIRM-07` | Finite overdue/race/one-shot reward failure fixtures through production command | Approve TD-05-03-G | `PENDING OWNER` |
| `US0503-CONFIRM-08` | No schema/dependency/native expansion; automated/SQLite mandatory, formal tester deferred | Approve TD-05-03-H | `PENDING OWNER` |

Owner có thể duyệt một lần bằng `Duyệt US0503-CONFIRM-01…08` hoặc nêu ID cần chỉnh. Approval chỉ
mở implementation của US-05-03, không mở Pet celebration/Continue/Home/analytics.

## 11. Risks và mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Deadline/foreground/startup complete đồng thời | Duplicate reward/profile | One shared coordinator, conditional terminal write, unique receipt, race integration. |
| Receipt inserted before matching session | Trigger failure/partial state | Exact trigger-compatible order inside one transaction. |
| Profile update fails after receipt | Partial economy | Same transaction; failure propagation + rollback test. |
| Startup publishes stale XP/Coin snapshot | Later UI inconsistency | Changed outcome + post-reconcile hydrate before readiness. |
| Result read fails after successful commit | Accidental re-reward | Separate Result retry; duplicate command classifies already-completed. |
| Old completion replays Pet event | Duplicate celebration later | Fresh event only from current successful commit; hydration emits none. |
| Fixture bypasses production truth | False evidence | Dev allowlist, real use case/repos, production absence tests. |
| Story leaks into US-05-04/06 | Rework/scope drift | Base Pet, disabled Continue, Standard prototype isolated. |

## 12. References

- `docs/planning/EPIC-05_USER_STORIES.md` — locked story/order/DEC-05-04/evidence.
- `docs/planning/US-05-02_IMPLEMENTATION_PLAN.md` and report — accepted entry baseline.
- `docs/specifications/session-lifecycle.md` — reconciliation barrier, atomic transitions and crash recovery.
- `docs/specifications/gamification-rules.md` — exact onboarding reward/exclusions.
- `docs/specifications/timer-engine.md` — timestamp deadline and no decrement truth.
- Architecture/data model and ADR-002/003/004.
- Existing SQLite reward trigger, terminal immutability and unique receipt index.

## 13. Change log

| Version | Date | Author | Change |
| --- | --- | --- | --- |
| 0.1.0 | 2026-08-31 | Codex, for owner review | Audited ef05b207 baseline; proposed atomic completion, race/idempotency, startup refresh, committed Result/fresh-event, fixture, test and deferred tester contracts. No production implementation. |
