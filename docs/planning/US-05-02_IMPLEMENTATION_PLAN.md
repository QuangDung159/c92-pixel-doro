---
document_id: PIXELDORO_US_05_02_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-05-02 Implementation Plan
version: 0.1.0
status: PROPOSED_OWNER_REVIEW
implementation_status: NOT_STARTED
created_at: 2026-08-31
last_updated: 2026-08-31
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-05
baseline_sha: f2efd62168886b429c1d8bf360dd99cf35fced97
scope:
  - mobile_mvp
  - epic_05
  - us_05_02
  - start_onboarding_trial
  - durable_countdown
  - resume_and_cancel
authority: PLANNING
story_baseline: ./EPIC-05_USER_STORIES.md
previous_story_plan: ./US-05-01_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-05-01_IMPLEMENTATION_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
system_architecture: ../architecture/system-architecture.md
project_structure: ../architecture/project-structure.md
data_model: ../architecture/data-model.md
timer_specification: ../specifications/timer-engine.md
session_lifecycle: ../specifications/session-lifecycle.md
adr_navigation: ../architecture/decisions/ADR-002-navigation-with-expo-router.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-05-02 — Start, Run, Resume, or Cancel the Fixed Trial

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan cho Story thứ hai của `EPIC-05 — First-use Onboarding Trial`.
Lượt tạo plan không sửa production code, schema/migration, dependency hay native artifact.

**Story outcome:** CTA Intro tạo đúng một phiên `onboarding_trial` Relax 5 phút trong SQLite rồi mới
mở Running. Countdown luôn suy ra từ `endsAt - now`, tiếp tục đúng sau background/cold relaunch.
Dismiss Cancel không đổi dữ liệu; Confirm Cancel commit `cancelled`, không reward/profile mutation,
rồi mới quay lại Intro.

**Priority:** `MUST` / `P0` / execution order `02` trong EPIC-05.

**Dependency:** US-05-01 đã được owner accept trên exact SHA
`f2efd62168886b429c1d8bf360dd99cf35fced97` ngày 2026-08-31.

**Blocks:** US-05-03. Story completion/reward không được mở trong implementation của US-05-02.

**Planning status:** `PROPOSED — OWNER REVIEW`.
**Implementation status:** `NOT STARTED`. Production implementation chỉ bắt đầu sau khi owner duyệt
toàn bộ `US0502-CONFIRM-01`…`07` ở §14.

### 0.1. Readiness gate

- [x] Branch/baseline là `feats/epic-05` tại `f2efd62`.
- [x] US-05-01 đã có automated evidence và owner manual acceptance.
- [x] DEC-05-03 khóa Cancelled → Intro; DEC-05-04 khóa completion commit trước Result.
- [x] Existing schema/repository/transaction/clock/lifecycle contracts được audit.
- [x] Không cần schema, migration, index, dependency hoặc native permission mới.
- [x] Phạm vi deadline trước US-05-03 được xác định là completion-pending, không fake success.
- [ ] Owner duyệt technical directions và evidence strategy của plan này.
- [ ] Chỉ sau approval mới chuyển Story sang `READY` và bắt đầu production implementation.

## 1. Authority contract và phạm vi khóa

### 1.1. Trial invariant

Mọi đường Start trong Story này phải tạo record đúng contract sau; UI không nhận input để thay đổi:

| Field | Giá trị bắt buộc |
| --- | --- |
| `profileId` | Singleton MVP profile `1` |
| `sessionType` | `focus` |
| `focusVariant` | `onboarding_trial` |
| `mode` | `relax` |
| `workTag` | `null` |
| `configuredDurationMinutes` | `5` |
| `status` | `running` |
| `startedAt` | injected clock `now` |
| `endsAt` | `startedAt + 300_000` |
| `backgroundedAt` | `null` |
| `resolvedAt` / reward fields | `null` / `0` |
| Strict/grace/failure branch | Không tồn tại |

`scheduledEndLocalDate` và `scheduledEndUtcOffsetMinutes` được snapshot từ device calendar tại
`endsAt`, qua injected application port; screen/use case không tự gọi `new Date()` làm business fact.

### 1.2. In scope

1. Production Start command với commit-before-navigation.
2. Serialization + idempotent duplicate start; active Standard/Break conflict fail closed.
3. Timestamp-derived running projection và display tick khoảng một giây khi visible.
4. Background/foreground/cold relaunch cùng durable session; Relax không ghi `backgroundedAt`.
5. Production Running UI, Cancel confirmation, cancel transaction và error/retry state.
6. Intro CTA busy/error behavior; Pet base projection refresh sau committed Start/Cancel.
7. Finite dev-only failure/clock fixtures và SQLite durability/concurrency evidence.

### 1.3. Explicit out of scope

- Không complete session, tạo reward receipt, cộng `5 XP`/`1 Coin`, celebrate hoặc Result production.
- Không startup/foreground reconciliation của overdue session; phần này thuộc US-05-03.
- Không analytics provider/event; DEC-05-02 được thực thi trong US-05-05.
- Không notification scheduling, audio, haptic hay background task mới.
- Không Standard Focus, Break, Strict, grace window, work tag, pause/resume.
- Không xóa `PrototypeProvider` khi các route ngoài onboarding trial còn dùng nó.
- Không đổi schema/migration/index hoặc generalize `TrialCountdown` thành common timer sớm.

## 2. Current-state audit tại baseline `f2efd62`

| Khu vực | Baseline đã có | Gap US-05-02 |
| --- | --- | --- |
| First-use entry | Durable controller: no/cancelled→Intro, running→`/focus/session`. | Refresh projections sau command và render Running production. |
| Intro | Production common UI; CTA đúng copy nhưng disabled/no-op. | Bind CTA vào committed Start, busy/error/retry. |
| Session persistence | Typed full/in-transaction read, insert running, conditional running transition. | Application Start/Cancel semantics và typed error mapping. |
| SQLite | `BEGIN IMMEDIATE`, one-running partial unique index, trial checks. | In-process coordinator tránh `TRANSACTION_BUSY` cho double-tap; integration proof. |
| Clock/ID | `ClockPort`, `IdPort` và device adapters đã inject. | Local end-date/offset snapshot port; running projection/tick scheduler. |
| Lifecycle | `AppVisibilityController` và platform lifecycle adapter. | Pause display tick in background; refresh from wall clock on active. |
| Focus route | Shared route hiện render prototype session/mock countdown/controls. | Route arbitration: durable trial production first; prototype Standard fallback giữ nguyên. |
| Pet | Durable `PetCompanionController` maps active session; visual boundary đã production. | Refresh after commit; cancellation never emits terminal reward feedback. |
| Completion | Startup reconciliation vẫn Noop; Result vẫn prototype. | Intentionally remain transferred to US-05-03/04. |

### 2.1. Quan sát transaction/concurrency quan trọng

`SQLiteTransaction` trả `TRANSACTION_BUSY` nếu hai `execute()` overlap trong cùng runtime. Database
unique partial index vẫn là last defense, nhưng tự nó không tạo UX double-tap thân thiện. Vì vậy Start
và Cancel trial phải đi qua một FIFO `SessionCommandCoordinator` trước transaction. Coordinator không
thay durable constraint và không giữ session truth.

### 2.2. Deadline boundary trước US-05-03

Khi `now >= endsAt`, US-05-02 không có quyền chuyển session sang `completed`. Để không vi phạm
DEC-05-04 hoặc cho Cancel thắng sau deadline, projection chuyển sang `deadline_pending`, dừng tick,
hiển thị “Đang xác nhận kết quả…” và disable Cancel. Cancel command cũng đọc clock/record trong
serialized flow và trả `SESSION_DEADLINE_REACHED` mà không mutation.

Đây là truthful temporary boundary, không phải completed state. US-05-03 sẽ thay pending bằng cùng
transactional reconciliation path trên active deadline, foreground và startup.

## 3. Proposed technical directions cần owner duyệt

### TD-05-02-A — Shared use cases, mobile running controller

Đặt business commands/pure projection trong `packages/application/src/onboarding-trial` vì chỉ phụ
thuộc typed repositories/transaction/clock/id. Đặt lifecycle/tick orchestration trong
`apps/mobile/src/application/onboarding-trial` vì nó phụ thuộc mobile visibility/readiness/composition.

Tách trách nhiệm:

- `StartOnboardingTrialUseCase`: capture immutable input, serialize, transact, return committed record.
- `CancelOnboardingTrialUseCase`: serialize, re-read, conditional transition, return committed result.
- `createOnboardingTrialRemainingProjection`: pure `max(0, endsAt - now)` mapping.
- `OnboardingTrialRunningController`: load durable row, schedule/pause tick, expose external store.

Controller không ghi session/reward; use case không navigate/render.

### TD-05-02-B — Explicit local calendar snapshot port

Thêm narrow platform-neutral port:

```ts
interface LocalCalendarPort {
  snapshot(atMs: number): ApplicationResult<{
    localDate: string;           // YYYY-MM-DD
    utcOffsetMinutes: number;    // -840..840
  }, LocalCalendarError>;
}
```

`DeviceLocalCalendarAdapter` là nơi duy nhất dùng JavaScript `Date`. Start capture `now`, tính
`endsAt`, rồi snapshot calendar tại `endsAt` trước transaction. Invalid/non-safe timestamp, invalid
date string hoặc offset fail trước write; không tự thay bằng UTC giả.

### TD-05-02-C — Serialized idempotent Start semantics

Start chạy qua readiness gate và FIFO coordinator. Trong transaction:

1. `findActiveInTransaction()`.
2. Không có active → insert exact locked trial record.
3. Active đúng running `onboarding_trial` → success
   `{ outcome: 'already_running', session }`; không insert row mới.
4. Active Standard Focus/Break hoặc invalid trial → `SESSION_START_CONFLICT`; không navigate.
5. Insert/commit failure → typed recoverable error; Intro ở lại và CTA retry được.

Hai tap đồng thời vì thế lần một commit `started`, lần hai đọc committed row và trả
`already_running`. Cả hai success paths đều navigate replace tới cùng Running route, nhưng navigation
adapter phải single-flight/dedupe để không tạo history stack kép.

### TD-05-02-D — Conditional, reward-free Cancel with deadline guard

Cancel nhận `sessionId`, capture `now`, serialize và transactionally re-read:

- running trial và `now < endsAt` → conditional transition `cancelled`, `resolvedAt=updatedAt=now`,
  `xpEarned=coinsEarned=0`, `rewardClaimedAt=null`;
- already cancelled → idempotent `{ outcome: 'already_cancelled' }`;
- completed/other terminal → `SESSION_ALREADY_TERMINAL`;
- `now >= endsAt` → `SESSION_DEADLINE_REACHED`, không mutation;
- conditional update mất race → re-read và map theo committed winner, không claim false success.

Chỉ `cancelled`/`already_cancelled` mới cho route refresh first-use projection rồi replace Intro.
Không write reward/profile/installation và không gọi Pet terminal feedback.

### TD-05-02-E — Timestamp projection, visibility-aware scheduler

Durable truth là `startedAt`/`endsAt`; display không decrement một counter làm source of truth.

```ts
type OnboardingTrialRunningProjection =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; phase: 'running'; sessionId: string;
      remainingMs: number; displaySeconds: number; endsAt: number }
  | { status: 'ready'; phase: 'deadline_pending'; sessionId: string; endsAt: number }
  | { status: 'missing' }
  | { status: 'error'; error: { code: OnboardingTrialReadErrorCode } };
```

Mỗi tick đọc `clock.nowMs()` và derive lại từ `endsAt`. Khi app/route không visible, cancel scheduled
tick; khi active/focused, đọc durable row và project lại ngay. Không ghi `backgroundedAt` cho Relax.
Một scheduler port nhỏ reuse structural contract của `DeviceTimeoutScheduler`; không thêm timer lib.

Accessibility announcement không chạy mỗi giây. Screen có label cập nhật theo phút/nhóm mốc và
live-region chỉ dùng cho state change như pending/error.

### TD-05-02-F — Route arbitration giữ Standard prototype tách biệt

`/focus/session` phải ưu tiên durable onboarding-trial projection:

```text
load durable active/latest onboarding trial
  loading/error/running/pending -> production trial branch
  no durable running trial      -> existing prototype Standard Focus branch
```

Tạo feature-local `OnboardingTrialRunningScreen` và `TrialCountdown`; không nhồi thêm vào
`presentation/features/focus/index.tsx`. Existing `FocusSessionScreen` prototype tiếp tục phục vụ
Standard Focus ngoài scope. Production trial branch không render `PrototypeBadge`, `MOCK COUNTDOWN`
hoặc Complete/Strict/Cancelled dev controls.

Back gesture/hardware back ở production Running mở cùng Cancel confirmation, không pop route trước
commit. Missing durable session refreshes first-use entry and replaces theo durable destination;
không tự tạo trial và không fallback Home.

### TD-05-02-G — Finite dev fixture at port boundaries

Mở rộng `EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE` bằng finite scenarios, chỉ khi `__DEV__` và diagnostics
enabled:

- `trial_start_failure`
- `trial_cancel_failure`
- `trial_running_fast_clock`
- `trial_deadline_pending`

Fast clock chỉ inject clock/scheduler behavior; persisted `configuredDurationMinutes=5` và
`endsAt-startedAt=300_000` không đổi. Fixture không thêm user-facing menu, không bypass use case,
không tồn tại trong production bundle path theo gate hiện hành. SQLite integration vẫn là authority
cho durability/concurrency; reader-only fixture của US-05-01 không được dùng để “giả commit”.

## 4. Application contracts dự kiến

### 4.1. Start result/error

```ts
type StartOnboardingTrialOutcome =
  | { outcome: 'started'; session: RunningSessionRecord }
  | { outcome: 'already_running'; session: RunningSessionRecord };

type StartOnboardingTrialErrorCode =
  | 'CORE_COMMANDS_NOT_READY'
  | 'SESSION_START_CONFLICT'
  | 'SESSION_TIME_INVALID'
  | 'SESSION_START_READ_FAILED'
  | 'SESSION_START_WRITE_FAILED'
  | 'SESSION_START_TRANSACTION_FAILED';
```

Raw SQLite/constraint/transaction messages không đi tới UI. Retry chỉ cho readiness/read/write/
transaction failure; conflict hướng người dùng về active flow an toàn.

### 4.2. Cancel result/error

```ts
type CancelOnboardingTrialOutcome =
  | { outcome: 'cancelled'; sessionId: string }
  | { outcome: 'already_cancelled'; sessionId: string };

type CancelOnboardingTrialErrorCode =
  | 'CORE_COMMANDS_NOT_READY'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_ONBOARDING_TRIAL'
  | 'SESSION_DEADLINE_REACHED'
  | 'SESSION_ALREADY_TERMINAL'
  | 'SESSION_CANCEL_READ_FAILED'
  | 'SESSION_CANCEL_WRITE_FAILED'
  | 'SESSION_CANCEL_TRANSACTION_FAILED';
```

### 4.3. Mobile facade boundary

Facade cung cấp projection/actions hẹp cho React:

```ts
readonly onboardingTrialRunning: OnboardingTrialRunningController;
startOnboardingTrial(): Promise<StartOnboardingTrialUiResult>;
cancelOnboardingTrial(sessionId: string): Promise<CancelOnboardingTrialUiResult>;
refreshOnboardingTrialRunning(): Promise<void>;
```

Composition facade orchestrates post-commit refresh `firstUseEntry`, running projection và Pet base.
Router chỉ replace sau facade success; facade không import Expo Router.

## 5. End-to-end flows

### 5.1. Start

```text
Intro CTA -> disable/busy -> readiness -> FIFO coordinator -> capture ID/time/calendar
          -> transaction reads active -> insert or reuse same running trial -> COMMIT
          -> refresh first-use/running/Pet -> router.replace('/focus/session')
```

Mọi failure trước/ở commit giữ Intro, re-enable safe retry và hiện copy recovery. Không có optimistic
Running screen.

### 5.2. Resume

```text
background: pause display scheduler only
foreground: read clock + durable row -> derive remaining -> schedule next tick
cold launch: bootstrap -> FirstUseEntry trial_running -> Running controller reads same row
```

Không pause/resume timestamp, không cộng bù thời gian, không phụ thuộc network.

### 5.3. Cancel

```text
Back/Dừng phiên -> confirmation
Dismiss -> close dialog, no command/no write
Confirm -> busy -> FIFO coordinator -> transaction re-read + conditional cancelled -> COMMIT
        -> refresh first-use/Pet -> router.replace('/(onboarding)')
```

Failure giữ user trên Running với committed session truth và retry. Deadline guard chuyển pending,
không Cancel, không reward.

## 6. File/change map dự kiến

### 6.1. Shared Application

- Add `packages/application/src/onboarding-trial/onboarding-trial-record.ts` — constants/factory validation.
- Add `start-onboarding-trial.use-case.ts` + tests.
- Add `cancel-onboarding-trial.use-case.ts` + tests.
- Add `onboarding-trial-remaining.projection.ts` + tests.
- Add `session-command.coordinator.ts` + concurrency tests.
- Add `packages/application/src/ports/local-calendar.port.ts`.
- Update `packages/application/src/index.ts` exports only; no Domain or persistence schema change.

### 6.2. Mobile Application/Infrastructure/Composition

- Add `apps/mobile/src/application/onboarding-trial/*` running controller/contracts/tests.
- Add `DeviceLocalCalendarAdapter`; reuse/rename `DeviceTimeoutScheduler` only if needed to expose a
  neutral scheduler interface without changing Pet behavior.
- Wire use cases/controller/facade/context hooks in composition.
- Extend lifecycle subscription to pause/resume trial display and refresh on foreground.
- Add finite dev-only fixture adapters/tests; preserve normal SQLite defaults.

### 6.3. Presentation/Routes

- Update `app/(onboarding)/index.tsx`: Start busy/error/action/navigation.
- Update `presentation/features/onboarding/index.tsx`: optional busy/error props; existing hierarchy.
- Add `presentation/features/onboarding-trial/onboarding-trial-running-screen.tsx`.
- Add feature-local `trial-countdown.tsx` and component tests.
- Update `app/focus/session.tsx` to arbitrate durable trial vs existing prototype branch.
- Preserve prototype Standard Focus files/behavior outside the new branch.

### 6.4. Explicit no-change targets

- `001_initial-schema.migration.ts` and migration registry.
- Reward/Profile repositories, Pet terminal feedback, Result route/screen.
- Standard Focus setup, Break, History, Shop, Settings, Feedback.
- Package dependencies, Expo config, native iOS/Android artifacts.

## 7. Implementation sequence

1. Add pure invariant factory, local calendar contract, remaining projection and unit tests.
2. Add FIFO coordinator and Start use case with duplicate/conflict/commit tests.
3. Add Cancel use case with deadline/terminal/race/no-reward tests.
4. Add device calendar/scheduler adapters and SQLite integration matrix.
5. Add running controller with tick/lifecycle/relaunch/error tests.
6. Wire composition facade/context and post-commit projection refresh.
7. Enable Intro CTA with truthful busy/error and commit-before-replace route.
8. Add production trial Running screen/countdown/cancel flow; preserve prototype fallback.
9. Add dev-only failure/clock fixtures and route/component/accessibility tests.
10. Run targeted tests, full quality, boundary/hygiene/line-count/diff inspection.
11. Write implementation report; wait for owner Development Build evidence before `DONE`.

Không bắt đầu bước 1 trước owner approval. Không gộp US-05-03 completion để “test hết timer”.

## 8. Test strategy

### 8.1. Pure/application tests

- Record luôn exact invariant; `endsAt-startedAt=300_000`; invalid ID/time/calendar rejected.
- Remaining at before-start, running, `1 ms`, exact deadline, overdue; never negative.
- Start success only after transaction returns committed success.
- Two overlapping Starts: one `started`, one `already_running`, one durable row.
- Existing trial resumes; Standard/Break active conflicts; persistence/transaction failures typed.
- Cancel dismiss does not call use case; confirm transitions once with all reward fields zero/null.
- Cancel retry/idempotency; completed winner; conditional-update-lost race; deadline guard.
- Coordinator releases queue after success/failure/throw and does not deadlock.

### 8.2. SQLite/integration tests

- Real schema accepts exact trial and rejects mutated duration/mode/tag/background/status combinations.
- Concurrent UI-level Starts serialize; repository/unique index prove one active row after reopen.
- Cancel persists through close/reopen; reward count/profile totals unchanged.
- Start/cancel rollback leaves no partial row or false terminal state.
- Offline execution uses local DB only.

### 8.3. Controller/lifecycle tests

- Cold load running projection; tick derives clock, not prior display value.
- Background cancels scheduled tick; foreground jumps by elapsed wall time.
- Relaunch reads same session ID/endsAt.
- Stale async refresh cannot overwrite latest generation; dispose stops notifications.
- Deadline emits one stable pending projection and no completion/cancel command.
- Missing/read error surfaces recoverable state; no prototype fallback for known durable read error.

### 8.4. Presentation/navigation tests

- Intro CTA disabled while busy; double press invokes one logical flow.
- No navigation before commit; failure remains Intro; success replace Running.
- Countdown `05:00` formatting/boundaries/tabular digits/a11y labels.
- Running contains no Prototype badge/mock/Complete/Strict/tag/mode controls.
- Back/Dừng opens dialog; dismiss retains session; confirm busy/failure/success behavior.
- Cancel replace Intro only after commit; deadline pending disables Cancel.
- Durable trial branch wins; no trial preserves existing prototype Standard Focus behavior.

### 8.5. Required gates

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
pnpm --filter @pixeldoro/application test
pnpm --filter @pixeldoro/mobile test
pnpm run quality
git diff --check
```

Ngoài command gate: kiểm tra mọi UI file `<=300` dòng; target mới `<=240`; không duplicate common
Button/Dialog/Pet/shell; không screen import repository/SQLite; không schema/dependency/native diff.

## 9. Error/recovery copy contract

| State | UI truth | Action |
| --- | --- | --- |
| Start busy | “Đang bắt đầu phiên…” | CTA disabled |
| Start persistence failure | “Chưa thể bắt đầu. Dữ liệu của bạn chưa thay đổi.” | Thử lại |
| Active conflict | “Bạn đang có một phiên khác.” | Mở active flow hoặc retry entry |
| Running read failure | “Chưa thể đọc phiên đang chạy. Dữ liệu vẫn an toàn.” | Thử lại |
| Cancel busy | “Đang dừng phiên…” | Dialog/actions disabled |
| Cancel failure | “Chưa thể dừng. Phiên vẫn đang chạy.” | Thử lại / đóng notice |
| Deadline pending | “Đang xác nhận kết quả…” | Cancel disabled; no fake success |

Không hiển thị raw DB code, “prototype”, “mock”, reward success hoặc completed wording trong pending.

## 10. Manual Development Build guide dự kiến

### 10.1. Preconditions

- Implementation SHA cuối cùng của US-05-02, compatible Development Build, clean/review database.
- Ghi platform, device/simulator, OS và app build version trước khi test.
- Không dùng US-05-01 reader fixture để giả một committed Start.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
pnpm start --clear
```

### 10.2. Happy path + duplicate protection

1. Cold launch new user tới Intro.
2. Tap nhanh `Thử phiên 5 phút` hai lần.
3. Xác nhận chỉ một Running screen/session, bắt đầu gần `05:00`, Pet working.
4. Xác nhận không có mode/tag/Strict/grace/Complete/prototype control.
5. Capture durable row: exact invariant, `endsAt-startedAt=300_000`.

### 10.3. Background/relaunch

1. Background/lock khoảng 15 giây rồi foreground.
2. Remaining phải giảm theo wall-clock, không đứng yên hoặc reset.
3. Kill app trước deadline, relaunch; cùng `sessionId` và `endsAt` tiếp tục.
4. Tắt network và lặp start/relaunch; local flow vẫn chạy.

### 10.4. Cancel

1. Mở Cancel rồi dismiss; durable row vẫn `running`.
2. Mở lại, Confirm; nếu commit thành công mới quay Intro.
3. Cold relaunch; Intro vẫn xuất hiện theo DEC-05-03.
4. Durable row là `cancelled`, reward receipt count và XP/Coin không đổi; Pet idle, không celebrate.

### 10.5. Failure/pending/a11y

1. Review `trial_start_failure`: ở Intro, truthful error, retry được, không row mới.
2. Review `trial_cancel_failure`: ở Running, session vẫn running, retry được, không về Intro giả.
3. Review `trial_running_fast_clock`: persisted duration vẫn 5 phút; display tiến nhanh qua injected clock.
4. Review `trial_deadline_pending`: hiển thị pending, Cancel disabled, không Result/reward/celebration.
5. Screen reader/large text: timer/button/dialog order rõ; timer không announce mỗi giây.
6. Reduce Motion: Pet/timer vẫn mang đủ nghĩa.

Cleanup fixture nếu đã dùng:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

**Evidence owner gửi:** exact SHA; platform/device/OS/build; video double-tap/background/relaunch/cancel;
screenshots failure/pending/a11y; before/after session/reward/profile facts; pass/fail từng nhóm. Không tự
điền device pass nếu owner chưa cung cấp.

## 11. Security/privacy/performance/accessibility audit

- Local-only command; không network/token/PII/log raw persistence error.
- ID/time/calendar validation trước write; SQLite constraints và transaction giữ defense in depth.
- Một scheduled timeout khi visible; background/dispose phải cancel, không interval leak.
- External-store listener/generation guard theo pattern US-05-01/Pet controller.
- No optimistic terminal/reward state; stale route cannot mutate a different session ID.
- Timer dùng tabular digits, large-text wrapping, semantic label; dialog focus/labels từ common UI.

## 12. Scope traps phải tránh

1. Không dùng `setInterval` decrement làm truth hoặc persist remaining seconds.
2. Không navigate trước transaction commit, kể cả double-tap.
3. Không map `TRANSACTION_BUSY` thành success; coordinator ngăn overlap, constraint là fallback.
4. Không Cancel một session đã tới deadline để né completion Story.
5. Không tự complete/reward khi countdown về `00:00`.
6. Không render prototype controls trong durable branch hoặc dùng `PrototypeProvider` làm authority.
7. Không add notifications/background task chỉ vì Timer spec ghi best-effort effect.
8. Không refactor toàn Focus/Break hay tạo common timer abstraction chưa có consumer thứ hai.
9. Không sửa schema để thêm request ID; idempotency dựa serialized active-session invariant.
10. Không đánh dấu DONE chỉ từ automated/host tests; cần owner Development Build acceptance.

## 13. Definition of Done

- [ ] Owner duyệt `US0502-CONFIRM-01`…`07`; implementation start SHA được ghi lại.
- [ ] Start creates/reuses exactly one committed exact-invariant trial before navigation.
- [ ] Duplicate/concurrent start and active conflict matrix pass.
- [ ] Running derives wall-clock remaining; background/cold relaunch resume same session.
- [ ] Deadline stays truthful pending with Cancel disabled; no completion/reward/result.
- [ ] Cancel dismiss is no-op; confirm conditionally commits reward-free cancelled before Intro.
- [ ] Failure/retry/offline states remain truthful and preserve durable facts.
- [ ] Durable trial route has no prototype/mock/Strict/Complete controls; Standard prototype unaffected.
- [ ] Pet working→idle refresh follows committed Start/Cancel; no terminal celebration.
- [ ] Targeted tests, root quality, diff check, boundaries, hygiene and line-count gates pass.
- [ ] No schema/migration/dependency/native/reward/profile/analytics/notification change.
- [ ] Implementation report binds evidence to exact SHA and lists transferred US-05-03 behavior.
- [ ] Owner manually accepts Development Build evidence before Story becomes `DONE_OWNER_ACCEPTED`.

## 14. Owner confirmation gate

Owner có thể duyệt một lần bằng `Duyệt 0502` nếu đồng ý toàn bộ bảng. Approval chỉ chuyển plan sang
`READY`; production code bắt đầu khi owner yêu cầu implement.

| ID | Confirmation | Recommendation | Status |
| --- | --- | --- | --- |
| `US0502-CONFIRM-01` | Shared Start/Cancel/pure projection; mobile lifecycle controller | Approve TD-05-02-A | `PENDING` |
| `US0502-CONFIRM-02` | Injected LocalCalendarPort snapshots end local date/offset | Approve TD-05-02-B | `PENDING` |
| `US0502-CONFIRM-03` | FIFO serialized Start; existing running trial is idempotent success, other active is conflict | Approve TD-05-02-C | `PENDING` |
| `US0502-CONFIRM-04` | Conditional reward-free Cancel; at/after deadline refuse mutation | Approve TD-05-02-D | `PENDING` |
| `US0502-CONFIRM-05` | Timestamp-derived controller; background pauses display only; deadline pending | Approve TD-05-02-E | `PENDING` |
| `US0502-CONFIRM-06` | Durable trial production route wins; existing Standard Focus prototype remains isolated | Approve TD-05-02-F | `PENDING` |
| `US0502-CONFIRM-07` | Finite dev-only failure/fast-clock fixture plus SQLite durability evidence | Approve TD-05-02-G | `PENDING` |

## 15. References

- `docs/planning/EPIC-05_USER_STORIES.md` — Story scope/order/decisions/evidence.
- `docs/planning/US-05-01_IMPLEMENTATION_PLAN.md` and report — accepted entry baseline.
- `docs/specifications/timer-engine.md` — timestamp/countdown/commit ordering.
- `docs/specifications/session-lifecycle.md` — trial/Cancel/Relax invariants and races.
- Architecture/data model and ADR-002/003/004.
- EPIC-04 Pet contracts for committed base projection and no terminal replay.

## 16. Change log

| Version | Date | Author | Change |
| --- | --- | --- | --- |
| 0.1.0 | 2026-08-31 | Codex, for owner review | Audited accepted f2efd62 baseline; proposed exact Start/Cancel, concurrency, clock/calendar, lifecycle, deadline-pending, route, fixture, test and manual evidence contracts. No production implementation. |
