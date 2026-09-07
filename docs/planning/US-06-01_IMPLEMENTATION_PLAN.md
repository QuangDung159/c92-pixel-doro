---
document_id: PIXELDORO_US_06_01_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-06-01 Implementation Plan
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
planning_baseline_sha: aa7f561c2eb8bca8302a1f6a072665819d653dbe
implementation_start_sha: aa7f561c2eb8bca8302a1f6a072665819d653dbe
exact_implementation_sha: 68f2c54d3630817385b320622476c55c67caea13
manual_device_status: OWNER_QUICK_UI_SMOKE_REPORTED
formal_tester_status: DEFERRED_TO_LATER_PHASE
scope:
  - mobile_mvp
  - epic_06
  - us_06_01
  - production_standard_focus_setup
  - durable_standard_focus_start
authority: PLANNING
story_baseline: ./EPIC-06_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
completion_baseline: ./EPIC-01_TO_05_COMPLETION_AUDIT_AND_NEXT_PLAN.md
ux_baseline: ./EPIC-03_UX_PROTOTYPE_PLAN.md
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

# US-06-01 — Production Standard Focus Setup, validation và commit-before-navigation Start

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan cho Story đầu tiên của
`EPIC-06 — Standard Focus Experience`. Lượt tạo plan chỉ cập nhật planning document; không triển
khai production code, không sửa schema/migration, không thêm dependency/native config, không chạy
prebuild/native build và không push/tạo PR.

**Story outcome:** Người dùng mở production Focus Setup, chọn duration/mode/work tag hợp lệ và chỉ
được đưa sang Focus Session sau khi một Standard Focus `running` đã commit bền vững. Start failure
giữ nguyên draft, không điều hướng giả và không tạo partial session. Running handoff của Story này
đọc committed session để chứng minh Start thành công; timestamp countdown/cancel thuộc `US-06-02`.

**Priority:** `P0`; execution order `01` trong EPIC-06.

**Dependencies:** EPIC-01→05 `DONE_OWNER_ACCEPTED`; EPIC-03 UX `UX_APPROVED`; toàn bộ
`US0600-CONFIRM-01`→`10` được owner duyệt Option A ngày 2026-09-03.

**Blocks:** `US-06-02`. Story tiếp theo không được active trước khi US-06-01 có exact-SHA evidence,
manual status trung thực và owner acceptance.

**Block disposition ngày 2026-09-03:** satisfied. Exact SHA đã có; owner quick UI acceptance mở
planning US-06-02; full manual/formal evidence vẫn được giữ deferred trung thực.

**Planning status:** `DONE_OWNER_ACCEPTED_QUICK_UI`.
**Implementation status:** `DONE_OWNER_ACCEPTED`; exact implementation SHA
`68f2c54d3630817385b320622476c55c67caea13`. Owner quick UI smoke đủ để mở planning Story 02;
full manual matrix/formal tester vẫn được ghi riêng là deferred.

### 0.1. Readiness gate tại thời điểm tạo plan

- [x] Branch `feats/epic-06`, upstream `origin/feats/epic-06` và clean working tree được xác minh.
- [x] Planning baseline SHA được ghi là `aa7f561c2eb8bca8302a1f6a072665819d653dbe`.
- [x] Owner duyệt EPIC-level Story order, `NO SCHEMA CHANGE`, prototype retirement và component plan.
- [x] Owner duyệt defaults `25 / relax / coding`; Setup draft không auto-persist.
- [x] Owner duyệt generic lifecycle ownership cho Story sau và Result/Break boundary.
- [x] Chỉ implementation planning của `US-06-01` được mở; production implementation chưa bắt đầu.
- [x] Owner duyệt Option A cho `US0601-CONFIRM-01`→`08` ngày 2026-09-03.
- [x] Implementation-start SHA được ghi là `aa7f561c2eb8bca8302a1f6a072665819d653dbe` trước production edit đầu tiên.

## 1. Authority contract và current-state review

### 1.1. Contract áp dụng

| Authority | Contract cho US-06-01 |
|---|---|
| Product Core | Standard duration `15..120`, step `5`, default `25`; Relax/Strict; four tags; no pause; Start durable before UI success. |
| EPIC-03 UX approved | Setup hierarchy, mode/tag selection, Home→Setup→Running navigation; draft transient; no schema gap. |
| EPIC-06 approved Story plan | P0 Start slice; `25/relax/coding`; no schema; common component reuse; prototype retired theo surface. |
| Timer Engine | Capture `now` once; `endsAt=startedAt+duration`; Start serialized; notification/analytics only after commit. |
| Session Lifecycle | One active session; valid Standard Focus shape; UI navigates after commit only. |
| System Architecture | Shared coordinator, typed Application result, SQLite transaction/backstop, thin routes/screens. |
| Project Structure | Domain/Application pure; adapters in mobile Infrastructure; Presentation uses public API; tests colocated/integration split. |
| Data Model 001 | Existing `sessions` columns/checks/indexes/triggers fully represent Standard Focus Start. |
| ADR-003/004 | SQLite is durable truth; prototype/local state cannot decide session truth; platform/database details stay behind ports. |

### 1.2. Baseline code hiện tại

| Khu vực | Current state | Classification | Gap cần đóng |
|---|---|---|---|
| Home | Production Home CTA pushes `/focus/setup`. | Production/reusable | Không đổi business behavior; regression only. |
| Setup route | Reads `PrototypeProvider`; reducer `startFocus()` then immediately pushes session. | Prototype/fake | Production controller/use case; commit-before-navigation; retry/error. |
| Setup screen | Approved layout; imports prototype types/badge/aliases; duration logic inline. | Visual reusable, state fake | Typed production view model; split file; no prototype copy. |
| Duration | `−5/+5` and quick values inline; reducer clamps/rounds malformed input. | Prototype/presentational mixed | Common pure control; Domain rejects invalid input instead of silently normalizing command. |
| Mode/tag | `ChoiceChip` renders selected state; defaults in prototype state. | Visual reusable | Production typed draft `relax/coding`; Application validation. |
| Standard Start | No Standard Focus use case/record factory/controller/facade method. | Missing | Domain validation; Application command; transaction; typed result. |
| Trial Start | Production command with clock/calendar/id/coordinator/session transaction. | Production pattern | Reuse pattern/ports, not trial invariant or trial outcome types. |
| Session repository | Generic read/insert/conditional transition methods and SQLite implementation. | Production reusable | No new repository method needed for Start; active read/insert already exist. |
| Schema | Standard/Strict fields, one-running unique index, immutability triggers. | Production baseline | No gap; migration `001` remains immutable. |
| Focus session route | Production trial branch, else Standard prototype branch using local active session. | Mixed | Durable Standard branch must win when active Standard row exists. |
| App entry/relaunch | Completed onboarding short-circuits directly to Home without checking active Standard session. | Production but pre-EPIC-06 | Recognize committed active Standard Focus enough to route session; reconciliation stays later Story. |
| Running UI | Prototype fixed `MM:00`, mock controls/reward outcomes. | Fake | Story 01 adds truthful committed-start handoff only; countdown/cancel explicitly transferred. |
| Pet | Base projection already derives `working` from active committed Focus. | Production reusable | Refresh after Start and render through `PetVisualStatus`; no new Pet logic. |
| Provider | Shared provider file is `232` lines. | Production, near split-review threshold | Put new Standard Focus hooks in a separate provider module. |
| Focus feature | `index.tsx` is `241` lines and mixes Setup + prototype Running. | Split required | Separate production Setup, committed-start handoff and prototype Running files. |
| Composition | `create-mobile-application.ts` is large but is composition, not a UI component. | Production | Use a focused slice factory/helper to avoid another responsibility block. |

### 1.3. Critical vertical-slice finding

Chỉ thay Setup route là không đủ. Sau durable Standard Start, `/focus/session` hiện thấy trial
projection `missing`, rồi fallback vào prototype branch; vì production Start không tạo
`PrototypeState.activeSession`, user sẽ nhận “không tìm thấy phiên prototype”. Do đó US-06-01 phải
thêm một read-only committed Standard Focus handoff trên chính `/focus/session`.

Handoff này:

- đọc active `sessions` row qua Application port;
- validate row đúng `focus/standard/running`;
- hiển thị configured minutes, mode, tag và Pet Working từ committed truth;
- không tính/decrement remaining seconds;
- không cancel/complete/fail/reward;
- được `US-06-02` mở rộng thành full timestamp Running thay vì bị bỏ đi.

Đây là owner-visible output độc lập của Story 01 nhưng chưa phải EPIC-06 release acceptance. Copy
phải user-facing và truthful; không hiển thị “Story”, “mock”, “prototype” hay technical roadmap.

### 1.4. Relaunch gap cần đóng vừa đủ

`FirstUseEntryController` hiện trả `home` ngay khi `onboardingCompletedAt != null`, nên cold relaunch
sau committed Standard Start không route lại session. Story requirement đã yêu cầu relaunch nhận ra
committed active session. Plan mở rộng entry projection tối thiểu:

```text
onboarding completed
  → read active session
  → no active: home
  → running standard Focus: standard_focus_running
  → unsupported/conflicting active fact: fail closed
```

Entry chỉ route theo durable `running` fact; không tự reconcile deadline/Strict evidence. Startup/
foreground reconciliation đúng precedence vẫn thuộc `US-06-02/03/04`. Nếu active Standard đã quá
deadline trong Story 01 incremental branch, Session handoff vẫn phản ánh row đang `running` và không
tự complete; limitation này phải ghi rõ trong report.

### 1.5. Scope traps phải tránh

1. Không copy `prototypeReducer`, `clampDuration` hoặc `rewardFor` sang production.
2. Không để route/screen gọi repository, SQLite, clock hoặc tự dựng session row.
3. Không lưu Setup draft vào `app_settings`; EPIC-10 mới sở hữu Settings behavior.
4. Không implement countdown, background timestamp, cancel, reconcile, reward hoặc Result.
5. Không schedule notification/analytics/haptic trong Story này; chỉ trả committed Start fact để
   Story 05 gắn post-commit hooks sau.
6. Không xóa toàn bộ prototype provider/Break/Result. Chỉ retire production Setup authority và đảm
   bảo active Standard durable branch thắng prototype Running fallback.
7. Không thêm schema/index/trigger/migration hoặc đổi existing migration checksum.
8. Không tạo một “session store” bền vững thứ hai; controller projection luôn rebuild được từ SQLite.
9. Không dùng UI busy/single-flight thay thế coordinator/unique index correctness.
10. Không làm broad refactor composition/provider chỉ để đẹp code; split đúng consumer/test boundary.

## 2. Product và Epic decisions đã khóa

| Decision | Owner-approved result | Effect on US-06-01 |
|---|---|---|
| `US0600-CONFIRM-01` | Giữ five-Story order | Story chỉ Start/Setup/handoff; Running semantics chuyển Story 02. |
| `US0600-CONFIRM-02` | `NO SCHEMA CHANGE` | Migration `001` immutable; stop nếu có evidence gap thật. |
| `US0600-CONFIRM-03` | Retire prototype theo surface | Setup production không import prototype; Running prototype còn fallback cho review state chưa thay. |
| `US0600-CONFIRM-04` | Common reuse/split matrix | Create `DurationControl`; split Focus feature; no duplicated primitives. |
| `US0600-CONFIRM-05` | Một shared session command authority | Standard Start dùng cùng application-scoped `SessionCommandCoordinator` với trial. |
| `US0600-CONFIRM-08` | Finite dev fixtures + truthful evidence classes | Fixture không được claim durable/device truth. |
| `US0600-CONFIRM-09` | `25 / relax / coding`; no auto-persist | Exact Setup initial draft. |

`US0600-CONFIRM-06/07/10` được giữ cho Story sau; US-06-01 không mở Break, notification dependency
hoặc analytics provider.

## 3. Proposed technical directions cần owner duyệt

### TD-06-01-A — Domain owns Standard Focus configuration validation

Tạo pure Domain module cho constants, allowlist và validation:

```ts
type FocusMode = 'relax' | 'strict';
type WorkTag = 'coding' | 'study' | 'writing' | 'reading';

interface StandardFocusConfiguration {
  readonly durationMinutes: number;
  readonly mode: FocusMode;
  readonly workTag: WorkTag;
}

type StandardFocusConfigurationDecision =
  | { readonly ok: true; readonly value: StandardFocusConfiguration }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'DURATION_INVALID'
          | 'MODE_INVALID'
          | 'WORK_TAG_INVALID';
      };
    };
```

Rules:

- valid duration is safe integer, `15..120`, divisible by `5`;
- validation rejects; it does not clamp/round malformed command input;
- returned value is frozen/immutable;
- Domain reads no clock, repository, React, platform or localized copy.

Application persistence types `FocusMode`/`WorkTag` should alias or re-export Domain types to avoid
two allowlists becoming independent truth. Existing public Application import names remain stable so
EPIC-05 code does not churn.

### TD-06-01-B — Application record factory and Start command

Create an Application-owned `createStandardFocusRecord` because it produces
`RunningSessionRecord`, which is an Application persistence contract. Inputs are validated Domain
configuration plus Application-captured id/time/calendar facts.

Proposed command:

```ts
interface StartStandardFocusInput {
  readonly durationMinutes: number;
  readonly mode: FocusMode;
  readonly workTag: WorkTag;
}

type StartStandardFocusOutcome = {
  readonly outcome: 'started';
  readonly session: RunningSessionRecord;
};

type StartStandardFocusErrorCode =
  | 'STANDARD_FOCUS_CONFIG_INVALID'
  | 'SESSION_TIME_INVALID'
  | 'SESSION_START_CONFLICT'
  | 'SESSION_START_READ_FAILED'
  | 'SESSION_START_WRITE_FAILED'
  | 'SESSION_START_TRANSACTION_FAILED';
```

Execution order:

```text
validate input (Domain)
  → capture startedAt once
  → derive safe endsAt
  → snapshot local date/offset for endsAt
  → generate id and create immutable running record
  → shared SessionCommandCoordinator
  → transaction:
      read active
      reject any active session
      insert running Standard Focus
  → commit
  → return committed Start fact
```

No notification/analytics/Pet/navigation runs in the use case transaction. Unique running index is
the database backstop; its conflict maps to the same stable active-session error where possible.

### TD-06-01-C — Active conflict and retry policy

- Same-runtime double tap is coalesced by `StandardFocusSetupController.start()` single-flight and
  disabled button.
- Cross-caller/process correctness is coordinator + transaction + unique index.
- Any pre-existing active trial/Focus/Break returns `SESSION_START_CONFLICT`; Start never silently
  attaches to an unknown session or replaces its config.
- If commit succeeded but navigation/app process failed, app entry reads the committed active
  Standard Focus and routes Running. User must not press Start again to recover.
- Error copy distinguishes “đã có phiên đang chạy” from recoverable persistence failure, but never
  exposes raw SQL/provider details.

This keeps retry idempotent through durable read/routing rather than inventing a Start idempotency
key or treating every active Standard Focus as the same user intent.

### TD-06-01-D — Application-scoped Setup and Session controllers

Create two focused mobile Application controllers:

1. `StandardFocusSetupController`
   - owns ephemeral valid draft and submit projection;
   - exact initial draft `25/relax/coding`;
   - setters reject invalid candidate values without normalizing;
   - preserves draft through command failure;
   - coalesces concurrent Start;
   - returns typed committed result to route;
   - resets to defaults only after successful Start/new explicit reset, never by persistence write.

2. `StandardFocusSessionController`
   - read-only in Story 01;
   - depends on `SessionRepository.findActive`;
   - exposes `idle/loading/ready/missing/error`;
   - `ready` contains immutable committed session id/config/timestamps;
   - no display tick, remaining calculation, cancel or reconcile yet;
   - designed for Story 02 to add timestamp phase/tick without replacing ownership.

Both controllers use external-store subscribe/getSnapshot, single-flight refresh, generation guard
and dispose patterns already proven by EPIC-05. Neither imports React/router/SQLite.

### TD-06-01-E — Commit-before-navigation composition

Composition creates the Domain/Application slice with existing clock/calendar/id/transaction/
repository and the same application-scoped `SessionCommandCoordinator` used by onboarding trial.

Facade `startStandardFocus()`:

```text
readiness.run(StartStandardFocus.execute(current draft))
  → command success
  → refresh StandardFocusSessionController from repository
  → verify ready session id equals committed result
  → refresh Pet base projection
  → return success to route
```

Only the Setup route calls `router.push('/focus/session')` after this entire committed refresh
succeeds. If commit succeeds but projection refresh fails, facade returns an actionable committed-
but-handoff error/warning contract and entry routing remains the recovery path. It must not retry
insert or claim Start failed in a way that invites duplicate creation.

To avoid expanding the already-large composition function with another dense responsibility block,
create a focused `createStandardFocusSlice(...)` helper returning use case/controllers and narrow
operations. The main composition root remains lifecycle owner and passes the existing coordinator.

### TD-06-01-F — Durable app-entry and Focus Session arbitration

Extend semantic destination vocabulary with `standard_focus_running`.

When onboarding is complete, `FirstUseEntryController` reads active session before returning Home.
Only a valid running Standard Focus maps to `standard_focus_running`; unsupported/conflicting active
truth fails closed. Route map replaces to `/focus/session`.

`/focus/session` arbitration order:

1. production onboarding trial projection when ready;
2. production Standard Focus committed projection when ready;
3. recovery/error if a durable read failed or truth conflicts;
4. prototype fallback only when both production readers confirm `missing` and prototype review state
   owns the journey.

The route must not render prototype fallback while production readers are still `idle/loading`.
This prevents a fake-screen flash and makes durable Standard truth win deterministically.

### TD-06-01-G — Common components and Focus feature split

- Create common `DurationControl` with `value/min/max/step/quickValues/onChange/disabled`.
- Component emits UI intent only; it does not validate Product rules, clamp, persist or navigate.
- Reuse common `ScreenShell`, `ScreenHeader`, `Panel`, `SectionLabel`, `ChoiceChip`, `Button`,
  `InlineNotice`, `PetVisualStatus`.
- Extend `ChoiceChip` only with optional accessible label/group support proven necessary; preserve
  all existing consumers and tests.
- Split current `presentation/features/focus/index.tsx` into:
  - production `focus-setup-screen.tsx`;
  - production `standard-focus-started-screen.tsx`;
  - feature-local `prototype-focus-session-screen.tsx`;
  - small public `index.ts` barrel.
- Setup and committed-start screen import no prototype types/components.
- Put Standard Focus provider hooks in a separate module so the existing 232-line provider does not
  cross the 240–260 split-review threshold because of this Story.

### TD-06-01-H — Finite review fixtures and side-effect boundary

Use `EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE` only under `__DEV__` plus diagnostics gate. Proposed finite
scenarios:

- `standard_start_success`;
- `standard_start_active_conflict`;
- `standard_start_write_failure_once`;
- `standard_start_committed_relaunch`;
- `standard_start_read_failure`.

Fixtures inject narrow clocks/repository decorators or prepare through production use cases. They do
not return route destinations directly, call router, mutate schema or use `PrototypeProvider` as
session authority. Failure is one-shot where Retry evidence is required. Real SQLite integration,
not fixture UI, is authoritative durable evidence.

Story 01 deliberately emits no Standard Focus analytics and schedules no notification. The Start
outcome supplies stable `session.id/startedAt` for `US-06-05`; adding placeholder/no-op side-effect
ports now would be speculative abstraction.

## 4. Target design

### 4.1. Ownership graph

```text
Focus Setup route
      |
      v
StandardFocusSetupController (ephemeral draft + submit state)
      |
      v
StartStandardFocusUseCase
      |
      +--> Domain validate configuration
      +--> Clock / Calendar / Id ports
      +--> shared SessionCommandCoordinator
      +--> Transaction + SessionRepository
                    |
                    v
            committed running row
                    |
                    v
StandardFocusSessionController + PetCompanionController
      |
      v
/focus/session arbitration
      |
      v
StandardFocusStartedScreen (committed config, no fake countdown)
```

On relaunch:

```text
/index → FirstUseEntryController
       → installation complete + active Standard Focus
       → standard_focus_running
       → /focus/session
       → StandardFocusSessionController reads same committed row
```

### 4.2. Domain configuration behavior

| Input | Decision |
|---|---|
| `15`, `120`, any approved step | valid |
| `14`, `121`, `17`, float, unsafe integer | `DURATION_INVALID` |
| `relax`, `strict` | valid |
| missing/arbitrary mode | `MODE_INVALID` |
| `coding/study/writing/reading` | valid |
| missing/custom tag | `WORK_TAG_INVALID` |

UI only offers valid intents, but use case still validates hostile/direct/test inputs. Validation
returns stable code; Vietnamese copy belongs Presentation.

### 4.3. Exact running record shape

```text
profileId                         = 1
sessionType                       = focus
focusVariant                      = standard
mode                              = selected relax|strict
status                            = running
workTag                           = selected approved tag
configuredDurationMinutes         = selected valid duration
startedAt                         = captured now
endsAt                            = startedAt + duration * 60_000
backgroundedAt                    = null
resolvedAt                        = null
xpEarned / coinsEarned            = 0 / 0
rewardClaimedAt                   = null
scheduledEndLocalDate             = calendar snapshot at endsAt
scheduledEndUtcOffsetMinutes      = same snapshot
createdAt / updatedAt             = startedAt
```

Record factory validates safe timestamp arithmetic, non-empty id, canonical calendar snapshot and
the Domain configuration. SQLite mapper/constraints perform the independent persistence backstop.

### 4.4. Setup projection

```ts
type StandardFocusSetupProjection = {
  readonly configuration: StandardFocusConfiguration;
  readonly command:
    | { readonly status: 'idle' }
    | { readonly status: 'submitting' }
    | {
        readonly status: 'error';
        readonly error: {
          readonly code:
            | 'INVALID_CONFIGURATION'
            | 'ACTIVE_SESSION'
            | 'START_UNAVAILABLE'
            | 'COMMITTED_HANDOFF_UNAVAILABLE';
        };
      };
};
```

Application use-case errors map once to mobile Application projection codes. Screen maps these
finite codes to warm Vietnamese copy. Raw persistence/transaction/provider messages are forbidden.

### 4.5. Committed session projection

```ts
type StandardFocusSessionProjection =
  | { readonly status: 'idle' | 'loading' }
  | {
      readonly status: 'ready';
      readonly sessionId: string;
      readonly durationMinutes: number;
      readonly mode: FocusMode;
      readonly workTag: WorkTag;
      readonly startedAt: number;
      readonly endsAt: number;
    }
  | { readonly status: 'missing' }
  | {
      readonly status: 'error';
      readonly error: {
        readonly code:
          | 'STANDARD_FOCUS_READ_FAILED'
          | 'STANDARD_FOCUS_STATE_INVALID';
      };
    };
```

`ready` only accepts an exact running Standard Focus. Trial/Break/terminal rows are `missing` when
owned by another valid branch; malformed Standard truth is `error`. Route arbitration must
distinguish valid-other-branch from corrupt/conflicting data.

### 4.6. User flow and navigation

```text
Home
  → /focus/setup
  → draft 25 / relax / coding
  → edit with common controls
  → Start (button busy)
      → invalid/conflict/failure: remain Setup, preserve draft, friendly error
      → transaction commit + projection verify: push /focus/session
  → committed-start handoff
      → exact configured minutes/mode/tag
      → Pet Working from committed active session
      → no fake countdown/control/result
```

Back from Setup replaces/returns Home without write. Hardware/system back behavior follows router
stack; there is no active session until Start commits. Once committed, navigation failure must not
offer a second Start as if nothing happened; app entry/session refresh is the recovery path.

### 4.7. UI composition and line estimates

| File/component | Estimate | Boundary |
|---|---:|---|
| `focus-setup-screen.tsx` | 150–210 | Layout/copy/view model callbacks only. |
| `duration-control.tsx` | 90–130 | Presentational numeric intent; reusable. |
| `standard-focus-started-screen.tsx` | 90–140 | Committed config + Pet/recovery-safe copy; no timer math. |
| `prototype-focus-session-screen.tsx` | 120–180 | Existing prototype behavior isolated unchanged. |
| Focus public `index.ts` | ≤30 | Exports only. |
| Setup route | 50–80 | Hooks, callbacks, committed-success navigation. |
| Standard session branch | 50–90 | Projection→screen composition. |
| Standard provider hooks | 40–80 | External-store hooks only. |

Split review starts at `240`; no component/UI source file may exceed `300`. The common duration
control needs regression coverage before future EPIC-10 reuse; no speculative settings API now.

## 5. Scope khóa cho implementation

### 5.1. In scope

- Pure Domain Standard Focus configuration constants/types/validation.
- Application Standard Focus record factory and Start use case.
- Reuse shared session command coordinator, clock/calendar/id, transaction and repositories.
- Mobile Setup controller with transient defaults/draft, typed error and single-flight Start.
- Read-only Standard Focus Session controller/projection for committed handoff and relaunch.
- Entry projection extension for active Standard Focus after onboarding complete.
- Commit-before-navigation facade/route behavior and Pet base refresh.
- Production Setup UI split; common DurationControl; optional ChoiceChip a11y API extension.
- Truthful committed-start Session handoff with no fake countdown.
- Production-vs-prototype Session route arbitration without fake flash.
- Finite dev-only fixtures, real SQLite integration, automated/static/a11y/manual guide.
- Update Story/plan status and create implementation report only after implementation evidence.

### 5.2. Out of scope

- Countdown/display tick/deadline request.
- Relax background/foreground/relaunch reconciliation semantics beyond routing an existing running row.
- Cancel confirmation/command/cancelled Result.
- Strict background evidence, grace or failed outcome.
- Completion, reward receipt/profile increment, terminal Result or Pet one-shot.
- Notification schedule/cancel, analytics event, audio/haptic.
- Break creation/cadence/CTA, History, Shop, Settings or later Epic UI.
- Remember-last-draft Settings behavior or custom/no-tag Standard Focus.
- Schema/migration/index/trigger, dependency, native config/artifact, prebuild/EAS.
- Removal of all prototype code/provider unrelated to Setup and durable Session arbitration.

## 6. Authoritative execution plan cho solo developer

Only one task and one Story are active at a time.

| Order | Task | Main output | Gate to next |
|---:|---|---|---|
| T00 | Approve plan and recheck baseline | Technical directions locked; implementation-start SHA | T01 |
| T01 | Lock contracts/tests first | Domain/use-case/controller/route expectations fail correctly | T02 |
| T02 | Implement Domain configuration | One validated immutable configuration truth | T03 |
| T03 | Implement record factory + Start command | Atomic durable Standard Start | T04 |
| T04 | Implement committed Session read controller | Durable handoff/relaunch projection | T05 |
| T05 | Wire Standard Focus application slice | Facade/readiness/coordinator/refresh/dispose | T06 |
| T06 | Build common DurationControl and split Focus UI | Production Setup, isolated prototype Running | T07 |
| T07 | Migrate Setup route commit-before-navigation | No prototype Start authority | T08 |
| T08 | Add Session arbitration and entry routing | Active durable Standard branch wins/relaunch works | T09 |
| T09 | Add finite fixtures + SQLite journey | Failure/conflict/relaunch evidence | T10 |
| T10 | Full quality/static/a11y verification | Root quality green, scope guardrails pass | T11 |
| T11 | Owner manual evidence and closeout | Exact-SHA report/acceptance; open US-06-02 | Story exit |

### T00 — Owner approval and baseline recheck

- Approve/amend `TD-06-01-A`→`H` and `US0601-CONFIRM-01`→`08`.
- Record exact implementation-start SHA and branch/upstream/worktree.
- Preserve owner changes; stop on overlapping edit to planned files.
- Confirm no schema/dependency/native authorization is needed for this Story.

**Stop:** any pending technical direction, dirty overlapping production file, missing EPIC-05
completion ancestry or owner changes that invalidate the audit.

### T01 — Lock contracts/tests first

- Add Domain validation table tests for every duration step/boundary/malformed value/mode/tag.
- Add record factory tests for exact field shape, timestamp overflow, id/calendar invalidity.
- Add Start use-case tests for operation order, active conflict, repository/transaction failure and
  no partial success.
- Add controller/entry/session/route expectations before production wiring.
- Add static assertions for prototype isolation, common reuse, no schema/dependency drift and UI
  line-count target.

**Checkpoint:** tests express authority contracts, not implementation accidents.

### T02 — Implement Domain configuration

- Add module and public Domain export.
- Keep allowlist/constants immutable and pure TypeScript.
- Alias Application session port mode/tag types to Domain types without breaking public imports.
- Run Domain and compile-affected Application tests.

**Checkpoint:** one product-rule owner; no React/platform/persistence dependency in Domain.

### T03 — Implement record factory and Start command

- Add Standard record factory and tests adjacent to source.
- Implement validation→time/calendar/id→coordinator→transaction order.
- Reuse `findActiveInTransaction` and `insertRunningInTransaction`.
- Map errors to stable finite Application codes; no raw exceptions.
- Verify success only after transaction commit returns.
- Add real SQLite integration for exact row, unique active backstop, rollback and reopen.

**Checkpoint:** migration file/checksum unchanged; active count `0→1`; no side-effect call.

### T04 — Implement committed Session read controller

- Implement narrow read/use-case or controller dependency on `findActive`.
- Validate Standard identity and running terminal/reward shape.
- Add single-flight, generation/dispose and listener-safety tests.
- Expose ready config/timestamps only; explicitly omit remaining/cancel/reconcile.

**Checkpoint:** projection survives repository reopen and never reads prototype state.

### T05 — Wire Standard Focus application slice

- Create focused slice factory with use case, Setup controller and Session controller.
- Pass the existing shared `SessionCommandCoordinator`; do not instantiate a second session writer.
- Add facade properties/operations and readiness gating.
- On successful Start, refresh committed Standard Session and Pet; verify matching session id.
- Add provider hooks in separate `standard-focus-hooks` module.
- Dispose/reset controllers through application lifecycle/confirmed reset as appropriate.
- Extend composition tests for boot, Start, read failure, reset and dispose.

**Checkpoint:** screens/routes consume only application projections and callbacks.

### T06 — Build common DurationControl and split Focus UI

- Create/test `DurationControl`; migrate approved Setup duration hierarchy.
- Preserve quick values `15/25/50`, bounds `15/120`, step `5` and selected text.
- Extend ChoiceChip accessibility API only if tests prove the need.
- Split existing 241-line feature file along responsibility boundaries.
- Production Setup uses canonical common components and no `PrototypeBadge`/prototype type.
- Move existing mock Running intact to feature-local prototype file and preserve its tests.
- Add committed-start screen with configured facts and Pet Working/recovery projection.

**Checkpoint:** no duplicated Button/Card/Chip/Pet/notice; all UI files ≤300 and target files <240.

### T07 — Migrate Setup route

- Replace `usePrototype` with Standard Setup hooks/actions.
- Bind duration/mode/tag callbacks to controller draft.
- Bind busy/error and disable Start while submitting.
- Call async Start; navigate only when result/projection verification succeeds.
- Preserve draft on error; Home back causes no write.
- Test no `router.push` before commit or on any failure; one push on success.

**Checkpoint:** production Setup has no prototype or persistence import.

### T08 — Add Session arbitration and entry routing

- Add Standard committed branch to `/focus/session`.
- Wait for production readers before considering prototype fallback.
- Preserve trial production priority and regress all trial scenarios.
- Extend entry destination/controller/navigation for active Standard Focus after onboarding complete.
- Fail closed on unsupported/conflicting active truth.
- Verify cold relaunch routes `/focus/session` and reads same session id without a second Start.

**Checkpoint:** durable truth always wins; no mock flash; no terminal reconciliation added.

### T09 — Finite fixtures and integration evidence

- Add exact dev/diagnostics gated parser and narrow overrides.
- Exercise success, active conflict, one-shot write/read failure and committed relaunch.
- Use production use case/controller/route paths; fixture cannot decide destination directly.
- Add host SQLite full journey: boot completed onboarding → Setup Start → committed row → reopen →
  entry Session → one row/no reward/event.
- Prove Standard row remains excluded from trial-specific result/analytics behavior at this stage.

**Checkpoint:** fixture labels remain review-only; durable assertions come from SQLite integration.

### T10 — Automated verification

- Run targeted Domain/Application/mobile tests during iteration.
- Run root `pnpm run quality` with pinned runtime once final code is ready.
- Run `git diff --check`, migration lock/checksum, dependency/lockfile/native artifact and line audit.
- Confirm no Standard notification/analytics/reward/Strict/cancel symbols introduced outside planned
  contracts.
- Validate device guide syntax through existing harness.

**Checkpoint:** all gates green on exact candidate tree; no flaky failure hidden by rerun.

### T11 — Owner manual evidence and closeout

- Execute guide in section 10 on Development Build/device available.
- Record exact SHA/platform/device/OS/build, durable facts and pass/fail.
- Distinguish automated evidence, owner quick smoke and formal tester evidence.
- Create `US-06-01_IMPLEMENTATION_REPORT.md`; update plan/Story status only from real evidence.
- Owner acceptance opens planning of US-06-02; it does not auto-start implementation.

## 7. Planned file impact

Exact names may be amended during owner review, but ownership/layer cannot be silently changed.

### 7.1. Files dự kiến tạo

| File/area | Purpose | Estimated lines |
|---|---|---:|
| `packages/domain/src/focus/standard-focus-configuration.ts` | Constants/types/pure validation | 80–130 |
| colocated Domain test | Boundary/allowlist/malformed matrix | 120–190 |
| `packages/application/src/standard-focus/standard-focus-record.ts` | Immutable running record factory | 90–140 |
| colocated record test | Exact shape/time/calendar validation | 120–190 |
| `packages/application/src/standard-focus/start-standard-focus.use-case.ts` | Serialized atomic Start | 130–210 |
| colocated Start test | Success/failure/conflict/order matrix | 220–300 |
| optional `load-running-standard-focus.use-case.ts` | Narrow committed read/validation | 90–150 |
| `apps/mobile/src/application/standard-focus/standard-focus-setup.controller.ts` | Draft/submit projection | 140–220 |
| `apps/mobile/src/application/standard-focus/standard-focus-session.controller.ts` | Read-only committed handoff | 140–220 |
| colocated controller tests | External-store/single-flight/error tests | ≤300 each |
| `apps/mobile/src/composition/standard-focus/create-standard-focus-slice.ts` | Focused wiring helper | 140–220 |
| `apps/mobile/src/presentation/components/duration-control.tsx` | Shared presentational duration UI | 90–130 |
| colocated DurationControl test | Bounds/intent/a11y | 60–110 |
| `presentation/features/focus/focus-setup-screen.tsx` | Production Setup | 150–210 |
| `presentation/features/focus/standard-focus-started-screen.tsx` | Committed-start handoff | 90–140 |
| `presentation/features/focus/prototype-focus-session-screen.tsx` | Existing mock Running isolated | 120–180 |
| colocated screen tests | Copy/state/common/a11y | ≤220 each |
| `presentation/providers/standard-focus-hooks.ts` | Setup/Session external-store hooks | 40–80 |
| `app/focus/standard-focus-started-branch.tsx` | Thin committed branch | 50–90 |
| `composition/review/standard-focus-start-review-fixture.ts` | Finite dev fixture | 150–240 |
| colocated fixture test | Gate/scenario/absence | 120–200 |
| `test/integration/standard-focus-start.integration.test.ts` | Real SQLite journey/reopen | 220–300 |
| `test/device/standard-focus-start-smoke.md` | Manual exact-SHA guide | 100–170 |
| `docs/planning/US-06-01_IMPLEMENTATION_REPORT.md` | Created only after implementation evidence | documentation |

### 7.2. Files dự kiến cập nhật

- `packages/domain/src/index.ts` — public Domain export.
- `packages/application/src/index.ts` — Standard Focus Application exports.
- `packages/application/src/persistence/session.repository.ts` — alias shared Domain types if approved;
  no repository capability expansion needed for Start.
- `apps/mobile/src/application/index.ts` — controller exports.
- `apps/mobile/src/application/mobile-application.facade.ts` — narrow controller/operation contract.
- `apps/mobile/src/composition/mobile-application.ts` — concrete application type if needed.
- `apps/mobile/src/composition/create-mobile-application.ts` — slice construction/lifecycle calls only.
- `apps/mobile/src/application/first-use/first-use-entry.controller.ts` and tests — active Standard
  destination after onboarding completion.
- `apps/mobile/src/presentation/features/onboarding/first-use-entry-navigation.ts` and tests — route map.
- `apps/mobile/src/presentation/providers/mobile-application-context.tsx` — export narrow facade
  accessor only if required; do not append feature hooks here.
- `apps/mobile/src/presentation/components/index.ts` — DurationControl export.
- `apps/mobile/src/presentation/features/focus/index.tsx` — replaced by split public barrel; old mixed
  implementation removed after imports migrate.
- `apps/mobile/src/presentation/features/focus/index.test.tsx` — split/migrate regressions.
- `apps/mobile/src/app/focus/setup.tsx` and route test — production command/navigation.
- `apps/mobile/src/app/focus/session.tsx` and tests — production arbitration.
- `apps/mobile/src/app/focus/prototype-session-branch.tsx` — renamed export/import only.
- composition/integrity/boundary tests and device harness inventory where required.
- `docs/planning/EPIC-06_USER_STORIES.md` — Story readiness/status only after plan approval/evidence.

### 7.3. Files/khu vực không được chạm

- `apps/mobile/src/infrastructure/database/migrations/001_initial-schema.migration.ts` and lock.
- `pnpm-lock.yaml`, package manifests, native `ios/`/`android/`, generated artifacts.
- reward/profile transaction behavior, notification adapters, analytics vocabulary/recorder.
- Strict/cancel/completion/Result/Break production modules not owned by this Story.
- Product Core, approved specifications/architecture unless a real contradiction is found and owner
  separately authorizes normative maintenance.

## 8. Acceptance-to-evidence matrix

| Acceptance | Automated evidence | Durable/integration evidence | Manual evidence |
|---|---|---|---|
| Defaults `25/relax/coding` | Controller/screen test | No write before Start | Setup screenshot |
| Valid duration/mode/tag only | Domain + use-case matrix | Invalid call leaves zero row | Control boundary walkthrough |
| Commit before navigation | Route/facade order test | Row exists before success callback | Failure/success video |
| Exact running row | Record/mapping test | SQLite field-by-field assertion | Sanitized before/after facts |
| One active session | Use-case conflict test | Unique-index/transaction integration | Conflict fixture/copy |
| Double tap one command | Controller single-flight test | Active row count exactly one | Rapid-tap video |
| Failure preserves draft | Controller/screen tests | Insert failure zero/rollback | One-shot failure + Retry |
| Relaunch recognizes active | Entry/navigation/controller tests | Close/reopen same session id | Cold relaunch video |
| No fake Running truth | Static/import/route tests | Session controller reads SQLite | No mock badge/control/countdown |
| Common/a11y/line guardrails | Component/static tests | N/A | Screen reader/large text/Reduce Motion |
| No schema/dependency/native change | Repository checks/diff | Migration checksum unchanged | N/A |

## 9. Automated test strategy

### 9.1. Domain

- All valid durations from `15` through `120` in step `5`.
- Below/above/not-step/float/NaN/infinity/unsafe integer.
- Exact approved mode/tag allowlists and arbitrary/missing values through defensive boundary.
- Immutable result and deterministic validation precedence.
- No platform/global clock access.

### 9.2. Application record and Start use case

- Exact running row for Relax and Strict across representative durations/tags.
- EndsAt/local date/offset/id/time validation and safe arithmetic boundary.
- Validate before transaction; capture clock once; correct calendar input.
- Active trial/standard/break conflicts; no insert.
- Read failure, insert failure, transaction technical failure and thrown adapter containment.
- Coordinator serializes Start with trial Start; queue releases after rejection.
- Success returned only after commit; zero post-commit side effects in use case.

### 9.3. Real SQLite integration

- Production migration/bootstrap then Standard Start with exact row mapping.
- `0→1` active count; second concurrent/successive Start rejected; row count stays one.
- Injected insert failure rolls back and Retry commits once.
- Close/reopen loads same session/config/timestamps.
- Trial repository/results/analytics unaffected; no reward row/profile delta/analytics row.
- Migration checksum, triggers/indexes and schema manifest unchanged.

### 9.4. Setup and Session controllers

- Exact default projection; valid setters; invalid setter cannot poison draft.
- Draft preserved through active conflict/read/write/transaction error.
- Start single-flight, listener behavior, reset-after-success policy, dispose/late-result guard.
- Session `ready/missing/error`, malformed row fail closed, refresh single-flight and reopen.
- Committed handoff session id matches Start result; mismatch maps handoff error.

### 9.5. Composition/facade/readiness

- Before boot/readiness closed: no command/write/navigation success.
- Shared coordinator identity across trial and Standard commands.
- Successful Start refresh order: session projection → Pet → return success.
- Projection/Pet failure after commit does not attempt a second insert.
- Reset/dispose clears ephemeral controller state without altering committed session unexpectedly.
- Fixture overrides absent by default/production-like diagnostics mode.

### 9.6. Presentation/components/routes

- DurationControl increment/decrement/bounds/quick values/disabled/labels/touch target.
- ChoiceChip old Settings/Feedback/Focus consumers regress.
- Setup has approved copy, no badge/mock label, busy/error, preserved selection.
- No router push before success; no push on error; exactly one push on verified commit.
- Session arbitration waits for production readers, trial remains correct, Standard durable wins,
  prototype only on confirmed no-durable-state.
- Started screen displays configured facts and Pet projection; contains no fixed/fake countdown.
- Entry route maps `standard_focus_running` correctly after onboarding complete.

### 9.7. Accessibility and structural gates

- Radiogroup/radio selected states and visible checkmark; no color-only selection.
- Duration value and buttons have semantic labels/states; largest text reflows/scrolls.
- Busy/error/committed status uses text and live region without announcement spam.
- Reduce Motion Pet still pose preserves Working meaning.
- Production Setup/Standard branch has no prototype/persistence import.
- UI files ≤300; split review assertion for ≥240.
- No deep import across Presentation features; public barrel used.

## 10. Manual UI test guide dự kiến

### 10.1. Mục tiêu và evidence classes

Prove production Home→Setup→durable Start→committed Session handoff, failure/retry/conflict and cold
relaunch without claiming timestamp Running semantics that belong to Story 02.

- **Automated:** host/unit/integration/static; never called device pass.
- **Owner quick smoke:** primary visible journey on recorded target.
- **Formal tester:** full device/OS matrix only when actually executed; otherwise `DEFERRED`.

### 10.2. Preconditions

- Exact candidate Git SHA, branch, Development Build identity.
- Record platform, physical/simulator, device model and OS version.
- Onboarding already completed; profile/bootstrap healthy; no active session for primary scenario.
- Approved production reset or finite `EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE`; no ad-hoc SQL mutation
  used as pass evidence.
- Network may remain offline; Standard Start is local-first.

### 10.3. Safe reset/reproduce

1. Use confirmed local-data reset only when scenario requires fresh state.
2. Complete/seed onboarding through an approved production review path.
3. Clear fixture env and restart Development Build between fixture groups.
4. Never delete `pixeldoro.db` mid-scenario then infer transaction behavior.
5. Record sanitized durable before facts before tapping Start.

### 10.4. Scenario A — Default Setup and valid controls

1. From Home tap **Bắt đầu tập trung**.
   - Expected: production Setup, no prototype badge/control/mock copy.
2. Verify initial `25 phút`, `Relax`, `Lập trình` visibly selected.
   - Expected: selected state conveyed by text/checkmark and accessibility state.
3. Decrement to `15`; attempt another decrement.
   - Expected: remains `15`, decrement disabled.
4. Increment to `120`; attempt another increment; test quick `15/25/50`.
   - Expected: every value stays within range/step.
5. Select Strict and each tag, then return to desired candidate.
   - Expected: one selection per group, no write/session created.
6. Back Home, reopen Setup according to approved draft lifecycle.
   - Expected: defaults or retained state exactly as technical confirmation records; still zero row.

### 10.5. Scenario B — Successful durable Start

1. Record active session count `0` and selected config.
2. Tap Start once.
   - Expected: busy state; no immediate optimistic Session navigation.
3. Wait for navigation.
   - Expected: committed-start Session handoff displays exact minutes/mode/tag and Pet Working.
4. Inspect sanitized durable facts.
   - Expected: one exact `focus/standard/running` row, timestamps/local-day valid, reward fields zero.
5. Confirm no reward receipt/profile delta/Standard analytics/notification claim.
6. Verify no fixed/mock countdown, Complete/Fail/Cancel dev controls or Break CTA.

### 10.6. Scenario C — Double tap and active conflict

1. Reset to no active session; rapidly tap Start twice.
   - Expected: one pending operation, one row, one navigation.
2. With a committed active session, navigate to Setup only via approved conflict fixture.
3. Tap Start with a different draft.
   - Expected: friendly active-session error, no second row, existing config unchanged.
4. Verify button/draft remain usable for safe exit; no raw error text.

### 10.7. Scenario D — Write/read failure and Retry

1. Enable `standard_start_write_failure_once` and select a non-default valid draft.
2. Tap Start.
   - Expected: stay Setup; exact draft preserved; no row; safe Retry copy.
3. Retry once.
   - Expected: commit one row and navigate once.
4. Run read/handoff failure after commit if fixture supports it.
   - Expected: no second insert; recovery route/read finds committed session.
5. Keep device/network offline throughout.
   - Expected: same local truth; no core failure due network.

### 10.8. Scenario E — Cold relaunch after commit

1. From successful handoff record session ID and timestamps.
2. Force-close app without cancelling/completing.
3. Relaunch.
   - Expected: entry routes `/focus/session`, same committed session/config displayed.
4. Inspect durable facts.
   - Expected: exactly one row, same ID/start/end, no reward/terminal mutation.
5. If current wall clock has passed deadline, record Story-01 limitation explicitly; UI must not
   invent completion/reward. Full reconciliation is deferred, not failed silently.

### 10.9. Accessibility, large text and Reduce Motion

1. Enable VoiceOver/TalkBack; traverse duration, mode, tag, Start, Back and errors.
2. Verify group/selected/disabled/busy announcements and logical focus order.
3. Use largest practical text setting; verify scrolling, no clipped selected text and reachable CTA.
4. Enable Reduce Motion; verify Pet Working static semantics and unchanged Start flow.
5. Verify mode/tag/error/committed state is not communicated by color/motion only.

### 10.10. Pass/fail record and artifacts

For every scenario record:

- pass/fail and exact failing step;
- Git SHA, branch, platform/device/simulator, OS, build identity;
- Setup/default/error/handoff screenshots;
- short video for commit-before-navigation, double tap and relaunch;
- sanitized session before/after facts and relevant safe log;
- fixture name and confirmation it was disabled during cleanup.

Owner quick smoke may close only the evidence owner explicitly accepts. Missing formal device fields
remain `DEFERRED`; automated SQLite evidence is not relabeled as UI/device evidence.

### 10.11. Cleanup

- Leave no review failure wrapper/env enabled.
- End/reset active review session through approved safe reset path; do not manually patch row status.
- Restore normal text size/screen reader/Reduce Motion only after evidence is captured.
- Confirm default app start no longer exposes fixture behavior.

## 11. Verification commands dự kiến

Run with repository-pinned Node `22.23.2` and pnpm `11.24.0`. Exact targeted filenames may be
amended to match approved final names.

```sh
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
pnpm exec vitest run \
  packages/domain/src/focus \
  packages/application/src/standard-focus \
  apps/mobile/src/application/standard-focus \
  apps/mobile/test/integration/standard-focus-start.integration.test.ts
pnpm --filter @pixeldoro/mobile run test:device
pnpm run quality
git diff --check
git status --short
```

Additional read-only audits:

```sh
git diff --name-only
git diff -- apps/mobile/src/infrastructure/database/migrations
git diff -- package.json apps/mobile/package.json pnpm-lock.yaml
find apps/mobile/src/presentation -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 \
  | xargs -0 wc -l | sort -nr | head
```

No prebuild, Expo native run, EAS build, dependency install, push or PR in the implementation turn
unless separately requested/authorized.

## 12. Risks, stop conditions and rollback

### 12.1. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Setup commits then handoff refresh fails | User may think Start failed and retry | Separate committed-handoff error; entry read recovers; never reinsert automatically. |
| First-use entry remains Home-first | Cold relaunch loses active-session route | Extend semantic entry/read active Standard and test close/reopen. |
| Session route flashes prototype | Fake truth shown before durable read | Wait for both production readers; prototype only after confirmed missing. |
| Domain/Application mode/tag drift | Two allowlists diverge | Alias/re-export Domain types; one validation matrix. |
| UI controller normalization hides invalid input | Direct malformed input accidentally accepted | Domain/use case reject; controller setters only accept valid candidates. |
| Composition adds second coordinator | Trial/Standard race correctness breaks | Inject exact existing coordinator into Standard slice; identity test. |
| Provider/Focus file exceeds split guardrail | Mixed responsibilities, hard testing | Separate hooks and screens before adding behavior. |
| Active unsupported Break/trial after onboarding complete | Entry routes Home over active truth | Fail closed; later owning Story extends supported destination. |
| Fixture becomes truth | Manual review falsely passes | Finite dev gate, narrow dependencies, SQLite integration authoritative. |
| Story-01 handoff looks like full Running | Scope/evidence overclaim | No timer controls; report limitation; Story 02 exit remains open. |

### 12.2. Mandatory stop conditions

Stop implementation and return to owner review if:

1. Existing schema cannot express an approved Standard Start invariant.
2. A dependency/native config change appears necessary.
3. Product behavior requires a default/draft/conflict policy different from approved confirmations.
4. Correct relaunch routing requires implementing terminal reconciliation beyond Story 01.
5. Shared coordinator cannot be reused without changing accepted trial behavior.
6. Owner changes overlap planned source files and cannot be preserved safely.
7. Migration/lockfile/native/generated artifact changes unexpectedly.
8. Any UI file would exceed 300 lines without a meaningful responsibility split.
9. Root quality exposes a real baseline contradiction that cannot be isolated without scope expansion.

Do not silently resolve a stop condition through schema, new package, copied component or broader Epic
implementation.

### 12.3. Rollback/revert strategy

- Implement in small commits/checkpoints matching T02–T09 when owner workflow requests commits.
- A failed command transaction rolls back through existing transaction port; no manual data repair.
- A failed UI/composition slice is reverted by its scoped code commit, not `git reset --hard`.
- Existing prototype files remain available until each production consumer is accepted, enabling a
  code revert without deleting later-Epic review behavior.
- New common API must keep old consumer regression tests so revert does not strand Settings/Feedback.
- No migration means code rollback does not require data down-migration.

## 13. Definition of Ready cho implementation

- [x] Owner approves `TD-06-01-A`→`H`.
- [x] Owner approves `US0601-CONFIRM-01`→`08` below.
- [x] Exact implementation-start SHA/branch/upstream/working tree recorded.
- [x] Planned target names/ownership and file split accepted.
- [x] Active conflict, draft lifecycle and committed-handoff recovery behavior locked.
- [x] Finite fixture/evidence classification approved.
- [x] No schema/dependency/native gate is open.

## 14. Definition of Done cho US-06-01

- [x] Default production Setup is exact `25/relax/coding` and contains no prototype authority.
- [x] Domain and Application reject every invalid duration/mode/tag without durable write.
- [x] Successful Start commits exact running Standard Focus before navigation.
- [x] Active conflict/double tap/write failure cannot create multiple/partial rows.
- [x] Draft persists through error and Retry follows approved lifecycle.
- [x] Committed Session handoff reads SQLite truth and contains no fake countdown/outcome/reward.
- [x] Cold relaunch routes the same active Standard Focus without a second Start.
- [x] Pet Working derives from committed active session; no new Pet/session truth.
- [x] Common component reuse and all old/new consumer regressions pass.
- [x] All UI files satisfy split review/hard 300-line guardrail.
- [x] Targeted tests, real SQLite integration, root quality, boundaries, device guide and diff checks pass.
- [x] No schema/migration/dependency/native analytics-notification provider/later-Story implementation changed.
- [ ] Exact-SHA implementation report and factual manual evidence status recorded.
- [ ] Owner accepts US-06-01 before US-06-02 becomes active.

## 15. Owner confirmation gate cho implementation

EPIC-level confirmations are already approved. The following implementation details remain pending.

### US0601-CONFIRM-01 — Validation ownership and reject-not-clamp

- **Option A (recommended):** Domain owns allowlist/range/step and rejects malformed input; UI only
  offers valid controls.
- **Option B:** Application-only validation.
- **Option C:** silently clamp/round command input as prototype does.
- **Trade-off:** A gives one pure/testable Product rule; B weakens Domain ownership; C hides defects.
- [x] Owner approved option: A — 2026-09-03.

### US0601-CONFIRM-02 — Active session and retry policy

- **Option A (recommended):** any active session is conflict; same-runtime double tap single-flight;
  commit/navigation failure recovers by durable entry read, not a second Start.
- **Option B:** treat any active Standard Focus as `already_running` success.
- **Option C:** replace/cancel active session automatically.
- **Trade-off:** A preserves user intent and one-active invariant; B can attach to unrelated config;
  C mutates truth outside explicit cancel flow.
- [x] Owner approved option: A — 2026-09-03.

### US0601-CONFIRM-03 — Setup draft lifecycle

- **Option A (recommended):** initial `25/relax/coding`; preserve while screen/error/retry is active;
  reset after committed Start or a fresh Setup entry; never persist Settings.
- **Option B:** preserve for entire app runtime after Back.
- **Option C:** persist last selection now.
- **Trade-off:** A is deterministic and within approved scope; B creates hidden runtime preference;
  C opens EPIC-10 Settings behavior/schema semantics.
- [x] Owner approved option: A — 2026-09-03.

### US0601-CONFIRM-04 — Story-01 Running handoff

- **Option A (recommended):** render committed config/Pet Working on `/focus/session`, no fake/fixed
  countdown or cancel; Story 02 extends same controller/screen ownership.
- **Option B:** keep user on Setup after commit.
- **Option C:** reuse prototype Running temporarily.
- **Trade-off:** A is truthful and owner-visible; B violates approved navigation; C conflates fake truth.
- [x] Owner approved option: A — 2026-09-03.

### US0601-CONFIRM-05 — Cold relaunch entry behavior

- **Option A (recommended):** completed-onboarding entry checks active session and routes valid running
  Standard Focus; no terminal reconciliation in this Story.
- **Option B:** relaunch Home until Story 02.
- **Option C:** implement full reconciliation now.
- **Trade-off:** A satisfies durable recovery with minimal scope; B loses active journey; C pulls
  Stories 02–04 forward.
- [x] Owner approved option: A — 2026-09-03.

### US0601-CONFIRM-06 — UI split/common component plan

- **Option A (recommended):** common DurationControl; split Setup/committed/prototype screens; separate
  provider hooks module.
- **Option B:** extend current 241-line mixed file.
- **Option C:** build broad form/design system.
- **Trade-off:** A follows approved reuse and test boundaries; B crosses split threshold; C speculative.
- [x] Owner approved option: A — 2026-09-03.

### US0601-CONFIRM-07 — Prototype retirement boundary

- **Option A (recommended):** Setup has no prototype authority; durable Standard branch wins; keep
  prototype Running fallback only for confirmed no-durable review state until Story 02.
- **Option B:** delete all Focus prototype now.
- **Option C:** let prototype branch render active Standard after commit.
- **Trade-off:** A avoids later-Epic breakage and fake truth; B broad scope; C invalid evidence.
- [x] Owner approved option: A — 2026-09-03.

### US0601-CONFIRM-08 — Fixture and side-effect boundary

- **Option A (recommended):** finite dev fixtures through production paths; no notification/analytics/
  haptic hook in Story 01; SQLite evidence is authoritative.
- **Option B:** create placeholder side-effect adapters now.
- **Option C:** use prototype reducer as success/failure fixture.
- **Trade-off:** A avoids speculative API and false truth; B creates unused abstraction; C proves only UI.
- [x] Owner approved option: A — 2026-09-03.

All eight implementation confirmations were approved as Option A on 2026-09-03. Implementation may
proceed within the locked scope of this plan.

## 16. References

- [EPIC-06 User Stories](./EPIC-06_USER_STORIES.md)
- [MVP Epic Plan](./MVP_EPICS.md)
- [EPIC-03 UX Prototype Plan](./EPIC-03_UX_PROTOTYPE_PLAN.md)
- [Product Core](../PIXELDORO_CORE_TRUTH.md)
- [Timer Engine](../specifications/timer-engine.md)
- [Session Lifecycle](../specifications/session-lifecycle.md)
- [Gamification Rules](../specifications/gamification-rules.md)
- [Pet State Machine](../specifications/pet-state-machine.md)
- [System Architecture](../architecture/system-architecture.md)
- [Project Structure](../architecture/project-structure.md)
- [Data Model](../architecture/data-model.md)
- [ADR-002 Navigation](../architecture/decisions/ADR-002-navigation-with-expo-router.md)
- [ADR-003 State/Persistence](../architecture/decisions/ADR-003-state-and-persistence.md)
- [ADR-004 Boundaries](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md)

## 17. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.3.1 | 2026-09-03 | Codex | Recorded exact implementation SHA and owner quick-UI acceptance; closed the US-06-01 progression gate and opened US-06-02 planning without overstating detailed manual/formal evidence. |
| 0.3.0 | 2026-09-03 | Codex | Recorded implemented working-tree candidate, automated/SQLite/quality evidence and remaining exact-SHA, manual/device and owner-acceptance gates. |
| 0.2.0 | 2026-09-03 | Codex | Recorded owner approval of `US0601-CONFIRM-01`→`08` as Option A and implementation-start SHA; implementation moved to `IN_PROGRESS`. |
| 0.1.0 | 2026-09-03 | Codex | Created owner-gated implementation plan for production Standard Focus Setup/Start, durable handoff, minimal relaunch routing, common component split, fixtures and evidence; production implementation remains not started. |

**US-06-01 is implemented at exact SHA `68f2c54d3630817385b320622476c55c67caea13`, automated-verified
and owner-accepted from quick UI review. Detailed manual matrix and formal tester remain deferred.**
