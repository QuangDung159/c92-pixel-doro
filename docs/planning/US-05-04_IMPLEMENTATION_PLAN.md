---
document_id: PIXELDORO_US_05_04_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-05-04 Implementation Plan
version: 0.3.0
status: IMPLEMENTED_AWAITING_OWNER_ACCEPTANCE
implementation_status: IMPLEMENTED_AWAITING_OWNER_ACCEPTANCE
implementation_started_at: 2026-08-31
created_at: 2026-08-31
last_updated: 2026-08-31
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-05
baseline_sha: dcfeb17ea583c896ddba9fa3ce81f3de2d3b8298
accepted_dependency_sha: a66d8a9e3ab870dd8e42b1b7349b2408bf4630d8
implementation_start_sha: 8c66dd59a441f142bae701c33747dacc88905b2c
implementation_sha: f1302b8c0ae8035f67b56aa410b197890498ddc9
formal_tester_status: DEFERRED_TO_LATER_PHASE
scope:
  - mobile_mvp
  - epic_05
  - us_05_04
  - fresh_pet_celebration
  - explicit_onboarding_handoff
  - committed_home_refresh
authority: PLANNING
story_baseline: ./EPIC-05_USER_STORIES.md
previous_story_plan: ./US-05-03_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-05-03_IMPLEMENTATION_REPORT.md
epic_04_baseline: ./EPIC-04_USER_STORIES.md
epic_04_exit_report: ./EPIC-04_EXIT_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
system_architecture: ../architecture/system-architecture.md
project_structure: ../architecture/project-structure.md
data_model: ../architecture/data-model.md
pet_state_machine: ../specifications/pet-state-machine.md
session_lifecycle: ../specifications/session-lifecycle.md
gamification_rules: ../specifications/gamification-rules.md
adr_navigation: ../architecture/decisions/ADR-002-navigation-with-expo-router.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-05-04 — Pet Celebration and Explicit Home/Pet Room Handoff

## 0. Mục đích và trạng thái

Tài liệu này khóa implementation plan cho Story thứ tư của `EPIC-05 — First-use Onboarding Trial`.
Lượt tạo plan chỉ sửa planning/acceptance record, không sửa production code, schema/migration,
dependency, native artifact hoặc Pet asset.

**Story outcome:** fresh onboarding completion vừa commit được chuyển một lần vào EPIC-04 Pet
feedback để Mèo Dev celebrate tối đa `2.000 ms`, không block CTA. User chọn `Vào Pet Room`; app ghi
`onboarding_completed_at`, refresh committed Bootstrap/Home projection và chỉ navigate khi Home có
đúng totals đã commit. Reopen/relaunch không replay celebration và returning launch đi thẳng Home.

**Priority:** `MUST` / `P1` / execution order `04` trong EPIC-05.

**Entry baseline:** US-05-03 được owner đóng `DONE_OWNER_ACCEPTED` trên exact implementation SHA
`a66d8a9e3ab870dd8e42b1b7349b2408bf4630d8` sau quick smoke. Formal tester/device evidence vẫn
`DEFERRED_TO_LATER_PHASE`.

**Planning status:** `APPROVED` ngày 2026-08-31.
**Implementation status:** `IMPLEMENTED_AWAITING_OWNER_ACCEPTANCE` tại exact SHA
`f1302b8c0ae8035f67b56aa410b197890498ddc9`. Owner duyệt toàn bộ
`US0504-CONFIRM-01`…`08` và implementation mở từ `8c66dd5` ngày 2026-08-31.

### 0.2. Implementation update — 2026-08-31

- Fresh-only base-first bridge đã map completion event vào accepted EPIC-04 Pet controller; event
  được consume sau accepted/safe duplicate và giữ lại cho recoverable retry.
- Conditional installation handoff, narrow Bootstrap snapshot refresh, exact totals/route verify và
  replace Home đã triển khai; retry sau committed write không cấp reward lần hai.
- Result CTA `Vào Pet Room` enabled, single-flight, truthful error và không phụ thuộc 2 giây Pet
  feedback.
- Ba finite fixture `trial_completed_fresh`, `trial_completed_reopen`, `trial_continue_failure` và
  deferred device guide đã có.
- Final root quality pass: `80` test files / `374` tests; device harness, boundaries, hygiene,
  lint/typecheck và `git diff --check` pass.
- Không schema/migration/dependency/native/asset/analytics change. Formal tester vẫn deferred.

### 0.1. Readiness gate

- [x] Branch `feats/epic-05` sạch và khớp origin tại `dcfeb17` khi audit.
- [x] US-05-03 accepted exact SHA, quick smoke record và deferred tester limitation được ghi rõ.
- [x] EPIC-04 Pet controllers/assets/arbitration/reduced-motion/no-replay contracts đã accepted.
- [x] Existing installation repository, Bootstrap snapshot, Home production projection và Result
  boundary đã audit.
- [x] Không cần schema/migration/index/dependency/native/asset mới.
- [x] DEC-05-01 giữ onboarding mandatory; DEC-05-04 giữ commit-before-Result.
- [x] Formal tester execution tiếp tục deferred; automated/SQLite/EPIC-04 regressions là gate bắt buộc.
- [x] Owner duyệt toàn bộ confirmations; Story chuyển `IN_PROGRESS` từ `8c66dd5`.

## 1. Baseline audit và gap map

### 1.1. Foundation có thể reuse

| Capability | Baseline | Cách dùng trong US-05-04 |
| --- | --- | --- |
| Fresh completion provenance | Completion controller giữ `freshEvent` với session/receipt/time/`5/1`; hydration không tạo event | Consume đúng event này; không infer freshness từ Result/session read. |
| Pet terminal feedback | EPIC-04 controller validates reward, dedupe, priority, `celebrating=2.000ms` | Map fixed onboarding completion thành existing `FreshCommittedTerminalTransition`. |
| Pet visual arbitration | Base active truth > fresh terminal > idle; lifecycle discard/no replay | Refresh base sau completion trước khi request celebration. |
| Pet presentation | Accepted assets, one-shot/still, fallback, reduced motion và semantic status | Reuse `PetVisualStatus`; không tạo celebration component/art mới. |
| Result | Production committed Result + `RewardSummary`; Continue hiện disabled | Enable explicit `Vào Pet Room` với busy/error callback. |
| Installation | `find` + `setOnboardingCompleted` đã có | Add application command và conditional/idempotent write semantics. |
| Bootstrap/Home | Home đọc profile từ Bootstrap snapshot | Add narrow post-write snapshot refresh before Home navigation. |
| First-use routing | Installation completed → Home | Refresh/verify destination after successful Continue. |
| SQLite | Singleton installation/profile; existing rewards/session committed | Continue chỉ đổi installation timestamp; không reward/profile/session write. |

### 1.2. Gap bắt buộc phải đóng

1. Fresh event đang buffer nhưng chưa có production bridge tới Pet terminal controller.
2. Pet base có thể vẫn là `working` ngay sau completion; request celebration trước base refresh sẽ bị
   arbiter xem là conflict/stale.
3. Result CTA disabled và chưa có Continue command/state/error/retry/navigation.
4. `setOnboardingCompleted` hiện update unconditional; chưa classify already-completed/race một cách
   idempotent.
5. Bootstrap snapshot của live completion còn giữ profile cũ; Home đang đọc chính snapshot này.
6. Chưa có narrow refresh API để publish installation/profile committed snapshot sau Continue.
7. Chưa có `trial_completed_fresh`, `trial_completed_reopen`, `trial_continue_failure` fixtures.
8. Chưa có integration proof rằng Continue chỉ đổi installation, giữ reward/session/profile nguyên.

## 2. Phạm vi khóa

### 2.1. In scope

- Application-scoped bridge consume fresh onboarding completion vào EPIC-04 Pet feedback.
- Exact event mapping, base refresh ordering, retry/recovery và discard semantics.
- Accepted celebrate one-shot/still/reduced-motion/fallback; CTA luôn non-blocking.
- Explicit idempotent onboarding handoff command và conditional installation persistence.
- Narrow Bootstrap committed-snapshot refresh; verify Home totals before navigation.
- Result `Vào Pet Room` busy/error/retry; refresh First-use/Pet/Home projections.
- Returning cold launch direct Home, no Result/celebration replay.
- Three finite dev fixtures and automated/real SQLite/EPIC-04 regressions.

### 2.2. Out of scope

- New animation/art/sprite, new Pet state, species/name/customization/progression mutation.
- Reward/session/profile mutation from Pet or Continue.
- Generic event bus/outbox/replay receipt hoặc persisted animation state.
- Analytics `onboarding_completed` emission/provider (US-05-05).
- Standard Focus/Break production flow, history, store review, notifications/audio/haptics.
- Schema/migration/index/package/native configuration change.

### 2.3. Fake remaining sau Story

- Production first-use journey Intro → Running → Result → Home không còn prototype state.
- Chỉ dev fixture/evidence controls còn review-only và phải bị gate khỏi production default.
- Analytics milestone vẫn chưa emit cho tới US-05-05; UI/durable handoff không được fake analytics.

## 3. Technical directions đề xuất

### TD-05-04-A — Fresh completion → Pet bridge, không infer từ hydration

Tạo application/composition bridge hẹp, subscribe `OnboardingTrialCompletionController`:

1. Chỉ xử lý projection `committed` có non-null `freshEvent`.
2. Coalesce theo `eventId`; không đọc latest completed row để tạo event.
3. Refresh `PetCompanionController` trước, yêu cầu base ready với `activeSessionId=null`.
4. Map event thành existing EPIC-04 transition:

```text
sessionId       = freshEvent.sessionId
committedAtMs   = freshEvent.resolvedAt
sessionType     = focus
focusVariant    = onboarding_trial
mode            = relax
terminalStatus  = completed
rewardCommitted = true
```

5. Gọi `PetTerminalFeedbackController.requestFreshTransition` với current Result session ID và
   committed base active session ID.
6. Khi accepted/known duplicate hoặc stale hợp lệ, discard buffered event. Runtime/refresh/conflict
   recovery giữ event để explicit Retry; không tự loop request.

Receipt/event ID không thay Pet dedupe contract `sessionId + terminalStatus`; nó chỉ coalesce bridge.
Hydrated completed Result không có fresh event nên bridge không chạy.

### TD-05-04-B — EPIC-04 arbitration/lifecycle giữ nguyên

- `celebrating` tối đa `2.000 ms`, then derive base idle.
- CTA không chờ/khóa theo animation; user có thể Continue ngay khi feedback đang active.
- Result unmount/Home navigation và background discard active one-shot; resume/reopen không replay.
- New active session vẫn preempt theo existing priority.
- Reduced Motion dùng existing still pose; playback failure giữ state-specific still tới deadline.
- Một accepted fresh event tạo đúng một polite semantic announcement.
- Pet controller/renderer không được access installation/session/reward/profile repositories.

Không sửa Domain Pet rules trừ khi audit chứng minh bug; plan mặc định chỉ adapter/composition wiring.

### TD-05-04-C — Explicit idempotent onboarding handoff command

Tạo mobile Application `CompleteFirstUseHandoffUseCase` với injected clock + installation repository:

1. Validate clock timestamp.
2. Read singleton installation; missing/corrupt là error.
3. Nếu `onboardingCompletedAt !== null`, trả `already_completed` và giữ original timestamp.
4. Nếu null, conditional update `WHERE id=1 AND onboarding_completed_at IS NULL` với
   `completedAt=updatedAt=now`.
5. `updated` → `completed_fresh`; `not_updated` → re-read và chỉ thành `already_completed` nếu durable
   timestamp đã tồn tại.

Controller/facade single-flight ngăn double tap; conditional SQL bảo vệ race. Command không mở
transaction nhiều entity vì chỉ mutate một singleton row, và tuyệt đối không chạm session, receipt,
profile hoặc Pet.

### TD-05-04-D — Persist → refresh → verify → navigate

Thêm narrow `MobileBootstrap.refreshReadySnapshot()`:

- Chỉ chạy khi Bootstrap `ready`; coalesce concurrent refresh.
- Read `BootstrapData` bằng existing adapter, không close/reopen DB, không rerun migration/reconcile.
- Publish snapshot mới atomically nếu read thành công; giữ snapshot cũ nếu read lỗi.
- Return typed error cho Result recovery; không navigate với stale Home snapshot.

Continue orchestration khóa thứ tự:

```text
CTA single-flight
  -> persist onboarding completion (fresh hoặc already-completed)
    -> refresh Bootstrap committed snapshot
      -> verify onboardingCompletedAt != null
      -> verify snapshot profile totals == committed Result totals
        -> refresh FirstUse destination == home + Pet base
          -> success signal
            -> router.replace('/(tabs)')
```

Nếu write đã commit nhưng refresh/verify lỗi, Result hiển thị retry. Retry nhận
`already_completed`, chạy lại refresh/verify rồi navigate; không rewrite reward. Subsequent cold
launch initial hydrate đọc completion/profile và route thẳng Home.

### TD-05-04-E — Result/Home presentation contract

- `OnboardingTrialResultScreen` nhận committed result, Pet projection, `onContinue`, busy và error.
- Đổi disabled `Tiếp tục` thành enabled approved CTA `Vào Pet Room`.
- CTA focus/target luôn available trong celebration; `busy` chỉ chống submit trùng, không phụ thuộc
  playback completion.
- Reuse `InlineNotice`/`ErrorState` cho handoff failure; reward/Pet status vẫn truthful.
- Route giữ back blocked trước explicit Continue theo mandatory onboarding decision.
- Success dùng `router.replace('/(tabs)')`; không push để Back quay lại Result/replay.
- Home tiếp tục dùng production `HomeScreen`/Bootstrap profile; không truyền mock `5/1` qua route.

### TD-05-04-F — Fresh event lifecycle và recovery ownership

Bridge state đề xuất: `idle | delivering | delivered | recovery`.

- Event chỉ discard sau accepted/drop-safe decision hoặc explicit reset.
- Pet runtime failure: Result Pet recovery action dismisses controller recovery rồi gọi bridge Retry.
- Result read/hydration không retrigger bridge.
- Continue success discards active terminal feedback on unmount nhưng không ảnh hưởng durable handoff.
- Confirmed reset/new trial clears completion event + bridge state through existing application reset
  path, tránh stale event trong cùng runtime.
- Bridge dispose/unsubscribe hủy late async publish; visual subscriber không đổi durable truth.

### TD-05-04-G — Finite review fixtures

| Fixture | Production path exercised | Không được làm |
| --- | --- | --- |
| `trial_completed_fresh` | Prepare real trial, complete atomically through production controller, bridge fresh event to Pet. | Không seed fake reward/celebration. |
| `trial_completed_reopen` | Prepare committed session/receipt/profile without publishing fresh event; Result hydrates base Pet. | Không emit event từ latest row. |
| `trial_continue_failure` | Fail exactly first conditional installation write; Retry uses real repository. | Không fail reward/profile hoặc fake Home. |

Fixtures chỉ `__DEV__` + diagnostics + finite allowlist. `trial_completed_fresh/reopen` phải giữ exact
session/receipt/profile facts từ production commands; Continue failure phải giữ completion flag null
đến successful retry.

### TD-05-04-H — Scope và evidence policy

- Không schema/migration/index/dependency/native/asset change.
- Automated/real SQLite + all EPIC-04 Pet regressions + Result/Home route tests bắt buộc pass.
- Formal tester/Development Build execution giữ `DEFERRED_TO_LATER_PHASE` theo owner policy; plan
  vẫn tạo guide/matrix, không mark manual pass khi chưa có evidence.
- Quick smoke sau implementation có thể được owner dùng cho acceptance riêng, nhưng phải ghi rõ mức
  evidence và exact SHA.
- Không mở analytics/US-05-05 trong implementation này.

## 4. Application contracts chi tiết

### 4.1. Handoff outcomes

```text
completed_fresh(completedAt)
already_completed(completedAt)
error(INSTALLATION_READ_FAILED)
error(ONBOARDING_HANDOFF_WRITE_FAILED)
error(ONBOARDING_HANDOFF_TIME_INVALID)
error(ONBOARDING_HANDOFF_REFRESH_FAILED)
error(ONBOARDING_HANDOFF_STATE_INCONSISTENT)
```

Persistence use case chỉ sở hữu ba error đầu/write; refresh/consistency errors thuộc mobile
orchestration/controller. UI dùng finite safe copy, không leak SQL.

### 4.2. Durable invariants trước Home

Trước navigation phải đồng thời đúng:

| Fact | Required |
| --- | --- |
| Installation | `id=1`, `onboardingCompletedAt != null` |
| Session | Existing onboarding trial remains `completed`, exact reward fields unchanged |
| Receipt | Same one receipt/reason/ID/deltas |
| Profile | Snapshot totals equal committed Result totals |
| First-use route | `home` |
| Pet base | No committed active session; terminal feedback may be active but non-blocking |

Continue timestamp không dùng làm analytics event trong Story này. No second receipt/profile update.

### 4.3. Pet delivery outcomes

- `delivered`: existing Pet request accepted.
- `already_delivered`: runtime duplicate decision; discard completion buffer.
- `dropped_stale`: only if a newer committed context legitimately wins; discard stale buffer.
- `recovery`: base read/runtime/conflicting truth; retain buffer and expose Retry.

Invalid mapping là programmer error covered by tests; Presentation vẫn nhận typed recovery, không
fallback fake celebration.

## 5. File ownership và dự kiến thay đổi

| Area | Planned change |
| --- | --- |
| `apps/mobile/src/application/onboarding-trial/` | Pet feedback bridge + handoff controller/use case/tests. |
| `apps/mobile/src/application/bootstrap/mobile-bootstrap.ts` | Narrow ready-snapshot refresh + tests. |
| `apps/mobile/src/application/persistence/installation.repository.ts` | Preserve port, document conditional semantics if needed. |
| `apps/mobile/src/infrastructure/database/repositories/sqlite-foundation.repositories.ts` | Conditional onboarding-completion update. |
| `apps/mobile/src/composition/create-mobile-application.ts` | Wire bridge, handoff orchestration, refresh ordering and lifecycle/reset cleanup. |
| `apps/mobile/src/composition/review/` | Fresh/reopen/one-shot Continue failure fixtures. |
| `apps/mobile/src/application/mobile-application.facade.ts` | Typed handoff/bridge retry methods/controllers. |
| `apps/mobile/src/presentation/providers/` | Projection/actions hooks only. |
| `apps/mobile/src/presentation/features/onboarding-trial/` | Enabled CTA, busy/error; reuse existing Pet/Reward UI. |
| `apps/mobile/src/app/focus/result.tsx` | Continue→Home only after orchestration success; no repository logic. |
| `apps/mobile/src/app/(tabs)/index.tsx` | At most refresh hook/test; no mock totals or business rule. |
| `apps/mobile/test/integration/` | Installation-only mutation, failure/retry, Home snapshot/relaunch evidence. |
| `apps/mobile/test/device/` | Deferred US-05-04 guide and harness validation. |

Không tạo common event bus, duplicate Pet controller hoặc second Home profile store.

## 6. Implementation sequence

1. **Acceptance baseline:** record approved confirmations and implementation start SHA.
2. **Handoff persistence:** conditional repository update + idempotent application use case/tests.
3. **Snapshot refresh:** Bootstrap ready refresh + failure/stale/dispose tests.
4. **Pet bridge:** fresh mapping, base-first order, retry/discard/no-replay tests.
5. **Composition:** application-scoped bridge, Continue orchestration and reset/lifecycle cleanup.
6. **Presentation:** enable `Vào Pet Room`, busy/error, success replace navigation.
7. **Fixtures/integration:** fresh/reopen/failure plus real SQLite fingerprint proof.
8. **Regression/evidence:** EPIC-04 suites, Result/Home/a11y/reduced motion, root quality/scope audit.
9. **Report:** bind implementation exact SHA; formal tester fields remain deferred unless actual
   evidence arrives.

Không mở analytics US-05-05 để “finish journey” trong Story này.

## 7. Automated test matrix

### 7.1. Handoff persistence/controller

- Null completion timestamp conditionally writes captured clock once.
- Existing timestamp returns `already_completed` without overwrite.
- Concurrent/double Continue: one updated, one durable already-completed; same timestamp.
- Installation missing/read/write/not-updated-without-fact map to finite errors.
- Write success + snapshot refresh failure remains Result; Retry only refreshes and succeeds.
- Snapshot installation/profile mismatch prevents navigation.

### 7.2. Pet bridge/arbitration

- Fresh post-commit onboarding event refreshes base idle then requests exactly one celebration.
- Exact transition mapping uses onboarding trial/Relax/completed/rewardCommitted.
- Hydrated/reopened completed Result has no event/request/replay.
- Duplicate bridge notification/controller rerender remains once.
- Base active conflict/runtime scheduler failure exposes recovery and retry retains event.
- Background/unmount discards active feedback; foreground/reopen does not replay.
- CTA works before/during/after 2.000 ms; new active truth preempts existing feedback.
- Existing EPIC-04 standard completed/Strict failed/cancel/Break regressions remain unchanged.

### 7.3. Presentation/Home

- Result renders celebrating Pet projection and committed RewardSummary simultaneously.
- `Vào Pet Room` enabled, accessible, busy single-flight and independent of animation state.
- Failure stays Result with safe retry; success replace-navigates exactly once.
- Home receives refreshed production snapshot and displays committed totals.
- Subsequent launch route is Home with no Intro/Result flash.
- Large text, screen reader order, reduced-motion still pose and one announcement pass.

### 7.4. Real SQLite/scope gates

- Continue changes only `app_installation.onboarding_completed_at/updated_at`.
- Session/receipt/profile fingerprints and row counts unchanged before/after Continue/retry/reopen.
- One-shot failure keeps completion null; retry sets one stable timestamp.
- Offline flow succeeds locally.
- `pnpm run quality`, `git diff --check`, boundaries, device harness, repository hygiene.
- No migration/schema manifest/package lock/native/asset drift; UI files `<300`.

## 8. Formal tester guide — execution deferred

Guide/fixtures sẽ được triển khai nhưng không mark pass nếu tester chưa cung cấp evidence.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_completed_fresh pnpm start --clear
```

Deferred matrix:

1. Fresh Result: Mèo Dev celebrate once; reward remains `5/1`; CTA usable immediately.
2. Tap `Vào Pet Room` during celebration; Home shows exact committed totals.
3. Kill/relaunch: direct Home, base Pet, no Result flash/celebration replay.
4. `trial_completed_reopen`: committed Result with base Pet, no replay.
5. `trial_continue_failure`: first tap stays Result with null completion flag; Retry persists once then
   Home; reward/session/profile unchanged.
6. Offline, Reduce Motion, screen reader and large text preserve status/action order.

Evidence fields: exact SHA, platform, device/simulator, OS, Development Build version, fresh/reopen/
relaunch/reduced-motion captures, Home screenshot, durable before/after facts, pass/fail. Current
formal tester status: `DEFERRED`.

Cleanup:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

## 9. Definition of Done

- [x] Owner approves `US0504-CONFIRM-01`…`08`; implementation start SHA recorded.
- [x] Only fresh post-commit event requests celebration; hydration/reopen/relaunch never replay.
- [x] Pet base refresh precedes event request; EPIC-04 arbitration/dedupe/duration remain intact.
- [x] Celebration/reduced-motion/fallback never blocks `Vào Pet Room`.
- [x] Continue persists installation conditionally/idempotently before navigation.
- [x] Snapshot refresh and totals/destination verification complete before Home.
- [x] Failure after write is safely retryable without reward/session/profile mutation.
- [x] Home and later cold launch show committed totals/direct route with base Pet.
- [x] Three finite fixtures travel through production commands and are absent by default.
- [x] Targeted/SQLite/EPIC-04/root quality/boundary/hygiene/line-count gates pass.
- [x] No schema/migration/dependency/native/asset/analytics change.
- [x] Implementation report binds exact SHA; formal tester stays deferred unless evidence arrives.
- [ ] Owner accepts exact implementation before US-05-05 opens.

## 10. Owner confirmation gate

| ID | Confirmation | Recommendation | Status |
| --- | --- | --- | --- |
| `US0504-CONFIRM-01` | Base-first bridge maps only buffered fresh event into existing EPIC-04 controller | Approve TD-05-04-A | `APPROVED 2026-08-31` |
| `US0504-CONFIRM-02` | Keep EPIC-04 2s/non-blocking/reduced-motion/lifecycle/no-replay contracts unchanged | Approve TD-05-04-B | `APPROVED 2026-08-31` |
| `US0504-CONFIRM-03` | Conditional idempotent installation handoff; no session/reward/profile writes | Approve TD-05-04-C | `APPROVED 2026-08-31` |
| `US0504-CONFIRM-04` | Persist → refresh snapshot → verify totals/route → replace Home | Approve TD-05-04-D | `APPROVED 2026-08-31` |
| `US0504-CONFIRM-05` | Enable `Vào Pet Room`; busy/error, but never wait for animation | Approve TD-05-04-E | `APPROVED 2026-08-31` |
| `US0504-CONFIRM-06` | Retain fresh event on recoverable delivery error; discard only after safe outcome/reset | Approve TD-05-04-F | `APPROVED 2026-08-31` |
| `US0504-CONFIRM-07` | Finite fresh/reopen/one-shot Continue failure fixtures through production paths | Approve TD-05-04-G | `APPROVED 2026-08-31` |
| `US0504-CONFIRM-08` | No schema/assets/dependencies/analytics; automated gates mandatory, formal tester deferred | Approve TD-05-04-H | `APPROVED 2026-08-31` |

Owner có thể duyệt một lần bằng `Duyệt US0504-CONFIRM-01…08` hoặc nêu ID cần chỉnh. Approval chỉ
mở implementation US-05-04; không mở analytics/integrity US-05-05.

## 11. Risks và mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Request Pet trước base refresh | Conflict/recovery, mất celebration | Bridge bắt buộc refresh committed base idle trước request. |
| Hydrated Result bị hiểu là fresh | Replay celebration | Event provenance only; never infer from repository read. |
| Animation khóa CTA | User mắc ở Result | CTA independent from playback and enabled during one-shot. |
| Installation write xong nhưng Home snapshot cũ | Home hiển thị `0/0` | Narrow snapshot refresh + exact totals verification before navigation. |
| Retry Continue ghi timestamp mới | Non-idempotent handoff | Conditional null update + already-completed re-read preserves timestamp. |
| Pet error làm mất fresh event | Không retry được feedback | Bridge retains buffer on recovery and exposes retry. |
| Result→Home Back replay | Duplicate feedback/journey | Replace navigation + no hydration event. |
| Fixture tạo fake success | False evidence | Real commands/repos, dev finite allowlist, production absence tests. |

## 12. References

- `docs/planning/EPIC-05_USER_STORIES.md` — locked Story/flow/evidence.
- `docs/planning/US-05-03_IMPLEMENTATION_PLAN.md` and report — accepted fresh-event/Result baseline.
- `docs/planning/EPIC-04_USER_STORIES.md` and exit report — accepted Pet implementation.
- `docs/specifications/pet-state-machine.md` — 2s, priority, no replay, reduced motion/fallback.
- `docs/specifications/session-lifecycle.md` and gamification rules — committed reward boundary.
- Architecture/data model and ADR-002/003/004.
- Existing Installation repository, BootstrapData and production Home projection.

## 13. Change log

| Version | Date | Author | Change |
| --- | --- | --- | --- |
| 0.3.0 | 2026-08-31 | Codex | Recorded implementation at f1302b8, final 80/374 quality evidence, fresh Pet delivery, idempotent Home handoff and deferred formal tester status; Story awaits owner acceptance. |
| 0.2.0 | 2026-08-31 | Codex, recording owner approval | Recorded approval of US0504-CONFIRM-01…08 and opened implementation from exact SHA 8c66dd5; US-05-05 remains closed. |
| 0.1.0 | 2026-08-31 | Codex, for owner review | Closed accepted a66d8a9 dependency audit; proposed fresh Pet bridge, idempotent Continue, committed Home refresh, fixtures, tests and deferred tester contracts. No production implementation. |
