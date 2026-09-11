---
document_id: PIXELDORO_US_09_01_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-09-01 Implementation Plan
version: 0.1.0
status: PENDING_OWNER_CONFIRMATION
implementation_status: NOT_STARTED
date: 2026-09-11
last_updated: 2026-09-11
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-09
planning_baseline_sha: 950cd90c2eae3ae4e6abe99f5e1ea42e207a9f55
implementation_start_sha: null
exact_implementation_sha: null
previous_epic: EPIC-08
previous_epic_status: DONE_OWNER_ACCEPTED
previous_epic_implementation_sha: 30adc34be23dca48379b6f2553203fdadb9f9e5b
manual_device_status: NOT_RUN
formal_tester_status: NOT_RUN
schema_change: NONE_PROPOSED
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
analytics_change: NONE_PROPOSED_IN_THIS_STORY
next_gate: OWNER_CONFIRM_US0901_CONFIRM_01_TO_06_AND_AUTHORIZE_CODING
scope:
  - mobile_mvp
  - epic_09
  - us_09_01
  - standard_focus_history
  - first_page_read_projection
  - production_history_screen
  - read_only
authority: PROPOSED_IMPLEMENTATION_PLAN
story_baseline: ./EPIC-09_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
session_specification: ../specifications/session-lifecycle.md
timer_specification: ../specifications/timer-engine.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
adr_analytics: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
previous_epic_exit: ./EPIC-08_EXIT_REPORT.md
---

# US-09-01 — Truthful Standard Focus History First Page

## 0. Mục đích, outcome và gate

Tài liệu này chuyển `US-09-01` trong breakdown EPIC-09 thành một implementation plan reviewable.
Plan chỉ mô tả implementation candidate; chưa cấp quyền coding, không claim test, device evidence,
commit hoặc push.

**User outcome:** khi mở tab Lịch sử, user thấy tối đa 20 phiên Standard Focus terminal gần nhất từ
SQLite theo stable order, với ngày, configured duration, work tag và explicit status; hoặc thấy
loading/empty/read-error trung thực. Không còn sample row, contribution preview hay prototype controls.

**Priority/order:** `P0 / 1` trong EPIC-09.

**Blocks:** `US-09-02 — Date-grouped Pagination và Resilient Refresh`. Story 02 không được mở trước khi
owner chấp nhận exact candidate của Story 01 và read-only first-page contract ổn định.

### 0.1. Baseline và working-tree audit

| Fact | Kết quả audit |
|---|---|
| Repository | `/Users/dunglu/Documents/Working/c92-pixel-doro` |
| Branch | `feats/epic-09` |
| Planning HEAD | `950cd90c2eae3ae4e6abe99f5e1ea42e207a9f55` |
| HEAD subject | `Epic 09 - US-09-01` |
| Origin alignment | Local branch trùng `origin/feats/epic-09` tại thời điểm audit |
| Worktree trước file plan | Clean |
| EPIC-09 breakdown | Committed tại planning HEAD; status `PENDING_OWNER_CONFIRMATION` |
| EPIC-08 | `DONE_OWNER_ACCEPTED`; behavior SHA `30adc34be23d...` |
| Implementation authorization | Chưa có |

### 0.2. Readiness checklist trước coding

- [x] Product Core, EPIC roadmap, EPIC-09 breakdown, Data Model, architecture/ADR và session/timer
  specification đã được đối chiếu.
- [x] History route/screen, prototype mock, persistence graph, history query/mapper, common components,
  lifecycle/controller patterns, fixture patterns và test harness đã được audit.
- [x] Existing schema/query chứng minh đủ durable facts; không có migration requirement.
- [x] Existing query đã có stable order, terminal Standard Focus filter, cursor và index evidence.
- [x] EPIC-08 predecessor đã owner accepted.
- [ ] Owner duyệt `US0901-CONFIRM-01→06` và các inherited Story-01 decisions.
- [ ] Exact clean `implementation_start_sha` được ghi sau approval, trước production edit.
- [ ] Planned production paths được re-check để không overwrite owner changes mới.

## 1. Authority reconciliation và scope boundary

### 1.1. Product/session contract đã khóa

- History gồm `session_type = focus`, `focus_variant = standard`, status
  `completed|failed|cancelled` của profile MVP `1`.
- `running`, onboarding trial, Short Break và Long Break không xuất hiện.
- Failed/cancelled vẫn là history truth; không được mô tả như completed và không có reward copy.
- Duration hiển thị là `configured_duration_minutes`, không phải đo thời gian thực tế hoặc reward.
- Stable order là `ends_at DESC, id ASC`.
- Local day là immutable `scheduled_end_local_date` đã persist khi Start theo scheduled-end timezone
  context; không regroup theo timezone hiện tại, relaunch, delayed reconciliation hoặc DST.
- History projection là read-only; render/query/Retry không sửa session, reward, profile hoặc settings.
- MVP hoàn toàn offline; không network/provider dependency.
- `history_viewed` đã allowlist nhưng implementation thuộc US-09-05, không Story 01.

### 1.2. Exact in scope

1. Harden history read boundary để reject non-canonical persisted local date trước khi UI nhận row.
2. Tạo shared Application use case cho first-page query, validation, error mapping và immutable output.
3. Tạo mobile History controller cho initial load, coalesced Retry và stale-completion guard.
4. Tạo dedicated History composition slice và expose narrow facade/hooks.
5. Thay History prototype bằng production first-page screen/list/row/status presentation.
6. Reuse existing common shell/header/panel/loading/empty/error/button primitives.
7. Tạo finite isolated fixtures, automated coverage, route integrity proof và device smoke guide.

### 1.3. Explicit out of scope

- Load more UI, page merge, date-group header, day completed total, SectionList và scroll restoration.
- Refocus/foreground resilient refresh, stale notice và append failure state của US-09-02.
- Contribution range, zero-fill, intensity thresholds, colors, graph hoặc `OPEN-006` resolution.
- Search/filter/custom date range/export/delete/edit/retention cap.
- Mode, time-of-day, XP/Coin/reward text hoặc session detail route.
- `history_viewed`, analytics recorder, queue behavior hoặc provider delivery.
- Migration/schema/index/trigger change; package/dependency/native/prebuild/permission change.
- Retire Settings prototype, root `PrototypeProvider`, or any later-Epic prototype owner.
- Create US-09-02 plan/report or EPIC-09 Exit Report.

### 1.4. Scope traps phải tránh

1. Không query trực tiếp trong route, hook, screen hoặc component.
2. Không copy SQL/filter/status inclusion logic sang Application hoặc Presentation.
3. Không dùng prototype rows/colors/copy/reward làm production fallback.
4. Không biến failed/cancelled configured duration thành completed minutes.
5. Không derive local date bằng `new Date(endsAt)` hoặc timezone hiện tại.
6. Không add pagination affordance trước Story 02 dù query trả `nextCursor`.
7. Không add contribution placeholder/neutral graph vào production Story 01.
8. Không refresh theo app foreground hoặc enqueue analytics trong Story 01.
9. Không auto-repair/reset corrupt durable data.
10. Không opportunistically refactor duplicated calendar validators hoặc root composition ngoài nhu cầu
   trực tiếp của slice.

## 2. Current capability và exact gaps

| Capability | Production baseline | Exact gap / planned owner |
|---|---|---|
| History query port | `StandardFocusHistoryQuery` với typed input/page/cursor | Shared use case chưa consume/validate thành presentation-safe first page |
| SQLite history query | Filter đúng standard terminal; order/cursor/limit 1–100; index evidence | `mapSessionRow` mới check date shape, chưa reject calendar date như `2026-02-30` ở history path |
| Persistence graph | Expose `standardFocusHistory` | Chưa bind vào mobile feature slice |
| History route | Thin export của `HistoryScreen` | Chưa subscribe controller/focus lifecycle |
| History screen | Prototype `useState`, mock rows, 7 neutral cells và controls | Phải replace bằng typed production props/states |
| Controller patterns | Shop/Room/Focus có external-store, coalescing, generation/dispose | Chưa có History controller |
| Facade/hooks | `MobileApplicationFacade`, provider hooks | Chưa expose History projection/actions |
| Common UI | `ScreenShell`, `ScreenHeader`, `Panel`, state surfaces, buttons | Thiếu semantic History row/status/list wrapper |
| SQLite tests | Mixed/exclusion/order/cursor/index/reopen trong derived-query suite | Thiếu canonical-date corrupt, first-page projection, read-only fingerprint và production consumer proof |
| Review fixtures | Finite isolated fixtures của EPIC-05→08 | Chưa có EPIC-09 History fixture namespace |
| Analytics | `history_viewed` typed allowlist | Deliberately no Story-01 recorder/hook |

Kết luận: đây là wiring/projection/presentation gap, không phải durable fact gap.

## 3. Proposed behavior contract

### 3.1. Read flow

```text
History tab gains focus after Bootstrap ready
  → HistoryController.activate()
      → from idle, or after a pending load was abandoned: publish loading
      → preserve an existing actionable error until explicit Retry
      → LoadFocusHistoryPageUseCase.execute({ cursor: null })
          → StandardFocusHistoryQuery.list({ profileId: 1, limit: 20, cursor: null })
          → validate page/entry/cursor/order/uniqueness/canonical date
          → freeze first-page projection
      → publish empty or ready

Retry after transient first-load error
  → repeat the same read intent
  → coalesce rapid Retry calls
  → never write or enqueue analytics

History tab loses focus / controller disposes
  → invalidate generation
  → drop any late completion
  → never cancel/repair/delete durable session facts
```

Under proposed Option A, a successful ready page remains in controller memory across tab leave/return
during the same app runtime and `activate()` does not refresh it yet. Cold relaunch creates a new
controller and reads SQLite again. Refocus/foreground refresh and stale-error UI are added in Story 02.

### 3.2. Shared Application projection

Indicative contract:

```ts
export const FOCUS_HISTORY_PAGE_SIZE = 20;

export interface FocusHistoryItemProjection {
  readonly id: string;
  readonly status: 'completed' | 'failed' | 'cancelled';
  readonly workTag: 'coding' | 'study' | 'writing' | 'reading';
  readonly configuredDurationMinutes: number;
  readonly endsAt: number;
  readonly scheduledEndLocalDate: string;
}

export interface FocusHistoryFirstPageProjection {
  readonly items: readonly FocusHistoryItemProjection[];
  readonly nextCursor: StandardFocusHistoryCursor | null;
}

export type LoadFocusHistoryPageErrorCode =
  | 'HISTORY_READ_FAILED'
  | 'HISTORY_DATA_INVALID';

execute(): Promise<ApplicationResult<
  FocusHistoryFirstPageProjection,
  LoadFocusHistoryPageError
>>;
```

The use case always owns `profileId = MVP_PROFILE_ID`, `limit = 20` and `cursor = null`; Presentation
cannot choose inclusion rules or a larger query. `nextCursor` is retained as a validated future
capability but is neither displayed nor invoked until US-09-02.

The projection intentionally drops `mode`, `startedAt`, `resolvedAt` and original UTC offset because
Story-01 UI does not consume them. The query port continues returning its full durable fact contract.

### 3.3. Runtime validation contract

Before returning success, the Application boundary verifies:

- at most 20 entries and no duplicate ID;
- non-empty stable ID, exact three terminal statuses and exact four work tags;
- configured duration is a safe integer in Standard Focus range/step;
- `endsAt` is a safe timestamp;
- `scheduledEndLocalDate` is a real canonical Gregorian `YYYY-MM-DD` date;
- items are strictly ordered by `endsAt DESC, id ASC`;
- non-null `nextCursor` equals the last returned item and is only accepted for a full page;
- every item and returned array/page is frozen or freshly immutable.

Infrastructure also adds the canonical calendar-date check in `mapHistoryEntry` using the existing
private `isCanonicalLocalDate` helper in `sqlite-derived-queries.ts`. This closes the row-mapper shape
gap without changing migration `001` or refactoring unrelated write validators.

### 3.4. Error taxonomy và recovery

| Source/result | Application result | Controller/UI | Recovery |
|---|---|---|---|
| `PERSISTENCE_UNAVAILABLE` | `HISTORY_READ_FAILED` | Local ErrorState + Retry | No global recovery |
| `PERSISTENCE_QUERY_FAILED` | `HISTORY_READ_FAILED` | Local ErrorState + Retry | No global recovery |
| Port throws/rejects | `HISTORY_READ_FAILED` | Local ErrorState + Retry | No global recovery |
| `PERSISTENCE_CORRUPT_DATA` | `HISTORY_DATA_INVALID` | No partial/fake rows | `DURABLE_DATA_CORRUPT` |
| `PERSISTENCE_INVARIANT_MISMATCH` | `HISTORY_DATA_INVALID` | No partial/fake rows | `DURABLE_DATA_CORRUPT` |
| Invalid typed page/entry/order/cursor | `HISTORY_DATA_INVALID` | No partial/fake rows | `DURABLE_DATA_CORRUPT` |
| Unexpected write/conflict error from read port | `HISTORY_READ_FAILED` | Local ErrorState + Retry; test exposes contract violation | No global recovery |

The controller calls `CriticalRecoveryPort.enterRecovery('DURABLE_DATA_CORRUPT')` once for the current
invalid load. It never calls confirmed reset. Initial technical read errors remain feature-local so
the rest of the app stays usable.

### 3.5. Controller state contract

```ts
export type HistoryControllerProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | {
      readonly status: 'ready';
      readonly items: readonly FocusHistoryItemProjection[];
      readonly hasMore: boolean;
    }
  | {
      readonly status: 'error';
      readonly code: 'HISTORY_READ_FAILED' | 'HISTORY_DATA_INVALID';
    };
```

Controller actions are limited to `activate()`, `deactivate()`, `retry()` and `dispose()`.

- Duplicate `activate`/Retry during one pending read returns the same promise.
- `empty` is a successful zero-row read, never an error fallback.
- `hasMore` is derived only from validated `nextCursor`; no load-more action exists yet.
- Late success/error after deactivate/new generation/dispose is ignored.
- Subscriber exceptions do not alter state or durable facts.
- Under Option A, ready/empty and an actionable technical error are cached for the current runtime;
  only explicit Retry from error reads again. A load abandoned while pending restarts on re-entry.
  Story 02 replaces this narrow policy with refocus/foreground refresh semantics.

### 3.6. UI state và content contract

| Projection | Visible behavior |
|---|---|
| `idle/loading` | Existing `LoadingState`: “Đang đọc lịch sử Focus…”; no sample row/graph |
| `empty` | Existing `EmptyState`: Standard Focus terminal session sẽ xuất hiện; trial/Break không tính |
| `ready` | Header + one production panel/list containing up to 20 typed rows |
| `error/HISTORY_READ_FAILED` | Existing `ErrorState` with safe local copy and `Thử lại` |
| `error/HISTORY_DATA_INVALID` | Global recovery owns final surface; no row or mock fallback |

Proposed row semantics:

- primary: `<duration> phút · <localized work tag>`;
- secondary: localized date `DD/MM/YYYY` derived by string parts from persisted local-date key;
- status: explicit `Hoàn thành`, `Thất bại` or `Đã hủy` text;
- grouped accessibility label announces date, configured duration, work tag and status once;
- decorative status marker is hidden; status never relies only on color;
- no mode, time-of-day, XP/Coin or “không reward” copy.

The screen receives typed controller projection and callbacks only. Formatting helpers stay feature-
local and pure; they do not inspect raw SQLite rows or recalculate timezone.

## 4. Planned architecture và ownership

```text
/(tabs)/history route
  → useHistoryProjection + useHistoryActions
    → HistoryController
      → LoadFocusHistoryPageUseCase
        → StandardFocusHistoryQuery port
          → SQLiteStandardFocusHistoryQuery
            → sessions (read only)

HistoryScreen
  → ScreenShell / ScreenHeader / status surfaces / Panel
  → FocusHistoryList
    → FocusHistoryRow / HistoryStatusBadge
```

### TD-09-01-A — Shared use case owns read intent and validation

Create `packages/application/src/history/load-focus-history-page.use-case.ts` and its tests. It owns
fixed MVP profile/page input, validates port output, maps finite errors and returns only immutable UI-
needed facts. It imports no React, Expo, SQLite, local copy or navigation.

The use case does not group days, sum minutes, derive contribution, translate labels, enqueue events
or persist cursor. This keeps the Story vertical while leaving a clean cursor seam for Story 02.

### TD-09-01-B — Existing SQLite query remains the only filter/order owner

Reuse `SQLiteStandardFocusHistoryQuery`; do not add a repository or alternate joined query. The only
planned query change is canonical validation of each history local date before mapping success.
Existing SQL/filter/order/index stays byte-for-behavior compatible.

Extend existing real-SQLite evidence for invalid calendar dates, fixed first-page limit, stable ties,
excluded session classes, close/reopen and a before/after product-table fingerprint.

### TD-09-01-C — Mobile controller owns lifecycle and finite state

Create a small external-store `HistoryController` following accepted Room/Shop patterns. It owns
single-flight load, generation guard, error-to-Recovery routing, immutable publish and dispose.

It must not import Infrastructure, map Vietnamese labels, know SQL, generate analytics IDs, aggregate
contribution or write durable data. Do not prebuild Story-02 append/refresh branches.

### TD-09-01-D — Dedicated composition slice limits root growth

Create `apps/mobile/src/composition/history/create-history-slice.ts` to instantiate the shared use case
from `persistence.standardFocusHistory`, wrap no transaction/coordinator around the read, and create
the controller with existing `criticalRecovery`.

`create-mobile-application.ts` is already large. Its change is limited to fixture selection, slice
construction, facade exposure and dispose. Validation, mock behavior and state transitions stay in
their owning modules.

### TD-09-01-E — Production History route replaces only History prototype authority

The route becomes the focus lifecycle composition point:

- subscribe with `useHistoryProjection`;
- obtain `activate/deactivate/retry` from `useHistoryActions`;
- bind `activate/deactivate` through `useFocusEffect`;
- render `HistoryScreen` with projection and Retry callback.

The production History feature removes `useState`, `PrototypeScreen`, `PrototypeBadge`,
`PrototypeControls`, `ControlButton`, hard-coded session rows and neutral contribution cells. It does
not remove root `PrototypeProvider` or Settings/later-Epic prototype code.

### TD-09-01-F — First page uses current scroll shell; virtualization waits

A fixed maximum of 20 rows is rendered within existing `ScreenShell`/`ScrollView`. Story 01 does not
extend `ScreenShell`, nest a `FlatList`/`SectionList`, or introduce load-more UI. Story 02 owns the
single-scroll-owner/virtualized list change together with grouping and pagination.

Feature-local components:

- `FocusHistoryList`: ordered layout and stable IDs only;
- `FocusHistoryRow`: row semantics/layout from typed item;
- `HistoryStatusBadge`: explicit status text plus supplemental tone.

They remain feature-local until a second reasonable production consumer exists.

### TD-09-01-G — Finite isolated fixtures exercise production boundaries

Create `history-first-page-review-fixture.ts` under the existing review composition area:

| Scenario | Setup/behavior |
|---|---|
| `history_first_page_empty` | Fresh migrated isolated DB, no session rows |
| `history_first_page_mixed` | Valid completed/failed/cancelled Standard Focus plus excluded trial/running/Break facts |
| `history_first_page_read_failure_once` | One-shot decorated history query failure, then production delegate |
| `history_first_page_corrupt` | Decorated query returns one invalid canonical date; normal database remains valid |

Valid durable facts are created through production lifecycle/use-case/repository boundaries and obey
migration constraints. Failure/corrupt scenarios decorate the narrow query port; they never alter
`pixeldoro.db`. The environment is finite/dev-only:
`EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE`; unknown/empty values select no fixture. Database names start
`pixeldoro-us-09-01-`.

## 5. Component reuse và screen responsibility

### 5.1. Common Component Reuse Matrix

| UI need | Existing component | Decision | Scope | Consumers / regression |
|---|---|---|---|---|
| Screen container | `ScreenShell` | Reuse unchanged | Common | All current screens + History |
| Header | `ScreenHeader` | Reuse unchanged | Common | Existing features + History |
| Surface/card | `Panel` / `PixelPanel` | Reuse `Panel` | Common | Existing panels + History list |
| Loading | `LoadingState` | Reuse unchanged | Common | Existing states + History |
| Empty | `EmptyState` | Reuse unchanged | Common | Existing states + History |
| Error/Retry | `ErrorState` + `SecondaryButton` internally | Reuse unchanged | Common | Existing states + History |
| Status chip/badge | `ChoiceChip` is interactive and semantically wrong | Create `HistoryStatusBadge` | Feature-local | Three History statuses |
| List row | No production history row | Create `FocusHistoryRow` | Feature-local | History first page |
| List wrapper | No appropriate common primitive | Create `FocusHistoryList` | Feature-local | History first page; Story 02 may replace |
| Date group header | None | Do not create in Story 01 | Deferred US-09-02 | None |
| Contribution cell/legend | Prototype-only | Remove from production screen; do not replace | Deferred US-09-03/04 | None |
| Pagination control | Common Button available | Do not render in Story 01 | Deferred US-09-02 | None |
| Inline notice | `InlineNotice` | Not needed without stale refresh | Deferred US-09-02 | Existing consumers unchanged |

No common component modification is currently planned. If implementation proves a small common gap,
stop and add the exact consumer/regression impact to this plan before editing it.

### 5.2. Screen Responsibility Matrix

| Owner | Allowed | Forbidden |
|---|---|---|
| History route | Subscribe, bind focus entry/exit, forward Retry | SQL/query, validation, label/date logic, analytics |
| `HistoryScreen` | Select state surface and compose typed list | Fetch, filter/order, local-date calculation, mock fallback |
| `FocusHistoryList` | Preserve ordered input and stable keys | Sort/filter/page/merge/aggregate |
| `FocusHistoryRow` | Render typed date/duration/tag/status semantics | Raw row, reward rule, current-time conversion |
| `HistoryStatusBadge` | Render exact status text/supplemental tone | Decide inclusion or contribution |
| `HistoryController` | State, load/retry coalescing, generation, Recovery call | SQL, translation, navigation, analytics |
| Shared use case | Fixed read intent, validation, error mapping, immutable projection | React/Expo/SQLite/copy |
| SQLite query | SQL/filter/order/row mapping | UI state/copy/navigation/write |

### 5.3. Size and responsibility gates

- [ ] No component exceeds 300 lines.
- [ ] Any component approaching 240–260 lines gets explicit split review.
- [ ] `HistoryScreen` does not absorb row/status/list implementations if independent tests are clearer.
- [ ] Route and hooks remain thin; no durable state in React state/context/Zustand.
- [ ] `create-mobile-application.ts` contains wiring only for this feature.
- [ ] Feature-local components are not promoted to common speculatively.

## 6. Navigation, lifecycle và recovery matrix

| State/event | Application action | Expected projection | Must not happen |
|---|---|---|---|
| First History focus | `activate()` | loading → empty/ready/error | Mock fallback/write/analytics |
| Duplicate focus callback while pending | Same active generation | One query | Duplicate query or publish |
| Retry while pending | Return current promise | One query | Retry storm |
| Retry after technical error | New first-page read | loading → empty/ready/error | Session mutation |
| Leave tab while pending | `deactivate()` invalidates generation | Late result dropped | Late ready/error publish |
| Return after ready in same runtime | `activate()` preserves ready under Option A | Same accepted page | Implicit refresh before Story 02 |
| Return after initial error | `activate()` waits for explicit Retry under Option A | Error stays actionable | Hidden retry loop |
| Cold relaunch | New controller after bootstrap | Fresh SQLite read | In-memory projection as authority |
| Airplane mode | Same local path | Full first page | Network/provider error |
| Corrupt durable fact | Fail closed | Global Recovery | Clamp/repair/reset/partial list |
| Other tabs/routes | No History interception | Existing accepted behavior | Prototype retirement outside History |

## 7. Durable fact và mutation matrix

| Fact | Durable owner | Story read/use | Story write |
|---|---|---|---|
| Session ID/type/variant | `sessions` | Query filter + stable row key | None |
| Status | `sessions.status` | Explicit completed/failed/cancelled label | None |
| Configured duration | `sessions.configured_duration_minutes` | Row duration label | None |
| Work tag | `sessions.work_tag` | Localized row label | None |
| `endsAt` | `sessions.ends_at` | Stable order/validation only | None |
| Scheduled-end local day | `sessions.scheduled_end_local_date` | Stable date display | None |
| Original UTC offset | `sessions.scheduled_end_utc_offset_minutes` | Query validation context; not displayed | None |
| Reward/profile/settings | Their existing tables | Not needed for History projection | None |
| Cursor | Application result | `hasMore` fact for future Story | Transient only; not persisted |
| Analytics event | `analytics_events` | Not read | None in Story 01 |

The only writes allowed during a device fixture are isolated fixture preparation before evidence.
Production screen/query/controller execution must preserve the exact product-table fingerprint.

## 8. Planned file impact

### 8.1. Indicative new files

- `packages/application/src/history/load-focus-history-page.use-case.ts` and test.
- `apps/mobile/src/application/history/history.controller.ts` and test.
- `apps/mobile/src/application/history/index.ts`.
- `apps/mobile/src/composition/history/create-history-slice.ts` and test.
- `apps/mobile/src/composition/review/history-first-page-review-fixture.ts` and test.
- `apps/mobile/src/presentation/features/history/focus-history-list.tsx` and test.
- `apps/mobile/src/presentation/features/history/focus-history-row.tsx` and test.
- `apps/mobile/src/presentation/features/history/history-status-badge.tsx` and test.
- `apps/mobile/src/presentation/features/history/index.test.tsx`.
- `apps/mobile/test/integration/focus-history-first-page.integration.test.ts`.
- `apps/mobile/test/integration/epic-09-history-route-integrity.integration.test.ts`.
- `apps/mobile/test/device/focus-history-first-page-smoke.md`.
- `docs/planning/US-09-01_IMPLEMENTATION_REPORT.md` only after authorized implementation.

### 8.2. Indicative modified files

- `packages/application/src/index.ts` — export History use case/projection/error contract.
- `apps/mobile/src/infrastructure/database/queries/sqlite-derived-queries.ts` — canonical history date
  validation only.
- `apps/mobile/test/integration/derived-queries.integration.test.ts` — regression for canonical corrupt
  local date; preserve all existing query evidence.
- `apps/mobile/src/application/index.ts` — export History controller.
- `apps/mobile/src/application/mobile-application.facade.ts` — expose narrow controller.
- `apps/mobile/src/composition/create-mobile-application.ts` — fixture select, slice compose/expose/dispose.
- `apps/mobile/src/presentation/providers/mobile-application-context.tsx` — projection/action hooks.
- `apps/mobile/src/presentation/features/history/index.tsx` — replace prototype with production screen.
- `apps/mobile/src/app/(tabs)/history.tsx` — focus lifecycle and typed props.
- `apps/mobile/test/device/validate-device-harness.mjs` only if its discovery/required-section rules need
  the new guide registered.

### 8.3. Explicitly unchanged

- Migration `001`, migration registry/manifest/lock/checksum, schema/index/trigger/seed.
- `StandardFocusHistoryQuery` SQL/filter/order/cursor API unless a demonstrated defect forces re-plan.
- Contribution query and all contribution UI/`OPEN-006` work.
- Package manifests, `pnpm-lock.yaml`, native folders/config and permissions.
- Analytics event types/queue/recorders/provider.
- Existing Focus/Break/session transaction commands and reward behavior.
- Common components unless a proven gap is approved.
- Root `PrototypeProvider`, Settings prototype and every non-History prototype owner.

## 9. Ordered implementation tasks

| Order | Task | Observable output | Depends/gate |
|---:|---|---|---|
| T00 | Owner gate + start audit | Approved IDs; clean start SHA | Owner confirmation |
| T01 | Query boundary hardening | Invalid calendar date fails closed; existing SQL unchanged | T00 |
| T02 | Shared first-page use case | Typed immutable 20-row projection + finite errors | T01 |
| T03 | History controller | loading/empty/ready/error/Retry/generation behavior | T02 |
| T04 | Composition/facade/hooks | Production query reaches controller through narrow boundaries | T03 |
| T05 | Feature-local presentation | Production list/row/status + reusable common states | T02–04 |
| T06 | Route/prototype retirement | History tab uses controller; History mock/controls gone | T04–05 |
| T07 | Isolated fixtures | Empty/mixed/read-failure/corrupt review scenarios | T01–06 |
| T08 | Integration/static evidence | SQLite/relaunch/no-write/a11y/route/size coverage | T01–07 |
| T09 | Candidate evidence/docs | Quality, exports, device guide, implementation report | T08 |

### 9.1. T00 gate

- [ ] Owner approves `US0901-CONFIRM-01→06` Option A.
- [ ] Approval explicitly authorizes coding US-09-01 only, not Story 02 or the whole Epic.
- [ ] Current branch/HEAD/origin/worktree is re-audited.
- [ ] Existing owner changes are preserved; conflicting paths stop for review.
- [ ] `implementation_start_sha` is recorded before T01.

### 9.2. T01–T04 gate

- [ ] Query rejects impossible canonical dates without schema/migration edit.
- [ ] Use case owns fixed profile/page input and validates output defensively.
- [ ] No layer duplicates SQL inclusion/order logic.
- [ ] Technical read errors remain local; durable invalid facts enter exact critical recovery.
- [ ] Controller coalesces pending work and drops stale completion.
- [ ] Facade/hooks expose no repository/query/SQLite object to Presentation.

### 9.3. T05–T07 gate

- [ ] History displays only date/duration/tag/status from typed projection.
- [ ] Empty/loading/error/Retry/ready are all observable without mock fallback.
- [ ] Status/date semantics survive grayscale and screen reader.
- [ ] No contribution/load-more/date-group/analytics feature leaks into Story 01.
- [ ] History-only prototype imports/data/controls are absent.
- [ ] Every fixture uses exact isolated database namespace and deterministic cleanup.

### 9.4. T08–T09 gate

- [ ] Unit/controller/component/SQLite/static tests pass on exact candidate.
- [ ] Read/render/retry/relaunch product-table fingerprints are identical.
- [ ] Existing full regression suite, boundary, hygiene and device-guide validator pass.
- [ ] iOS and Android JS exports pass; Doctor drift is recorded, not silently fixed.
- [ ] Manual guide exists with actual status, initially `NOT_RUN`.
- [ ] Implementation report contains exact files, commands, results, residual limitations and SHA status.

## 10. Automated test strategy

### 10.1. Shared Application tests

- [ ] Query input is exactly `{ profileId: 1, limit: 20, cursor: null }`.
- [ ] Empty page returns frozen empty projection with `nextCursor: null`.
- [ ] Completed/failed/cancelled map exactly; trial/running/Break never arrive from production query.
- [ ] Projection drops mode/reward/timestamps not needed by UI.
- [ ] One through 20 rows preserve `endsAt DESC, id ASC` order and stable IDs.
- [ ] Valid 20-row page may expose validated `nextCursor`; short page with cursor fails closed.
- [ ] Duplicate ID, bad order, invalid cursor/ID/status/tag/duration/timestamp/date fails closed.
- [ ] Calendar boundaries cover leap day, invalid February/date zero/month 13 and year boundary.
- [ ] Read unavailable/query failure/throw maps `HISTORY_READ_FAILED`.
- [ ] Corrupt/invariant/malformed page maps `HISTORY_DATA_INVALID`; unexpected technical error codes
  fail locally as `HISTORY_READ_FAILED` and remain visible to tests.
- [ ] Repeated execution never mutates input/page/entries.

### 10.2. Controller/composition tests

- [ ] `idle → loading → ready`, `idle → loading → empty`, and technical error → Retry → ready.
- [ ] Rapid activate/Retry while pending calls loader once and returns the same work.
- [ ] Deactivate/dispose drops late success, error and Recovery side effects.
- [ ] Invalid data calls `enterRecovery('DURABLE_DATA_CORRUPT')` once.
- [ ] Technical failure never enters global recovery.
- [ ] Ready/empty cache behavior across same-runtime re-entry matches confirmation 03.
- [ ] Subscriber throw is isolated; dispose removes listeners.
- [ ] Slice injects `persistence.standardFocusHistory`, not repository/session writes.
- [ ] Facade/hook action identities remain stable enough for `useFocusEffect` dependencies.

### 10.3. Component/route tests

- [ ] Loading, empty, technical error/Retry and ready states render exact approved copy.
- [ ] Completed/failed/cancelled each use explicit text, not color-only semantics.
- [ ] All four work tags have localized labels; long Vietnamese content wraps.
- [ ] Date is derived from canonical persisted string as `DD/MM/YYYY`, not device timezone.
- [ ] One grouped accessible row label includes date/duration/tag/status in visual order.
- [ ] Decorative markers are hidden; no duplicate screen-reader focus.
- [ ] Input order and stable session IDs are preserved as keys.
- [ ] Twenty rows remain scrollable on small portrait and largest-text-shaped layout.
- [ ] `ChoiceChip` is not reused for non-interactive status.
- [ ] History route uses hooks + `useFocusEffect` only and forwards Retry.
- [ ] History feature contains no `Prototype*`, mock/sample, repository/SQLite/Domain import or graph.
- [ ] No new/modified component exceeds 300 lines; split review occurs at 240–260.

### 10.4. Real SQLite/integrity tests

- [ ] Fresh migrated DB returns a successful empty first page.
- [ ] Mixed completed/failed/cancelled standard rows appear with exact facts.
- [ ] Running Standard Focus, completed trial, completed/cancelled Break are excluded.
- [ ] Equal `endsAt` values use `id ASC`; 21+ rows prove first 20 and valid next cursor.
- [ ] Impossible shape-valid local date such as `2026-02-30` yields corrupt-data failure.
- [ ] Close/reopen returns identical first-page projection/order.
- [ ] Airplane-equivalent harness requires no network/provider.
- [ ] Fingerprint sessions/rewards/profile/settings/catalog/ownership/receipts before and after
  query/controller render intent/Retry/reopen is identical.
- [ ] Existing derived-query pagination/index/contribution/cadence/review facts remain green.
- [ ] Static route scan proves production facade and History-only prototype retirement.
- [ ] Migration source/checksum/schema objects and dependency/native files have no drift.

### 10.5. Candidate commands

Commands are planned, not run by this document:

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
pnpm exec vitest run packages/application/src/history \
  apps/mobile/src/application/history \
  apps/mobile/src/composition/history \
  apps/mobile/src/composition/review/history-first-page-review-fixture.test.ts \
  apps/mobile/src/presentation/features/history \
  apps/mobile/test/integration/focus-history-first-page.integration.test.ts \
  apps/mobile/test/integration/epic-09-history-route-integrity.integration.test.ts \
  apps/mobile/test/integration/derived-queries.integration.test.ts
pnpm quality
pnpm --filter @pixeldoro/mobile exec expo export --platform ios \
  --output-dir /tmp/pixeldoro-us0901-ios
pnpm --filter @pixeldoro/mobile exec expo export --platform android \
  --output-dir /tmp/pixeldoro-us0901-android
pnpm --filter @pixeldoro/mobile run doctor
git diff --check
```

Export folders are disposable and must not be committed. Existing Expo Doctor patch/network warnings
are recorded as tooling debt; Story 01 does not update packages/native config to clear them.

## 11. Fixture và manual device guide plan

Planned guide: `apps/mobile/test/device/focus-history-first-page-smoke.md`.

Initial status: `NOT_RUN`.

### 11.1. Mandatory guide header/evidence fields

- Status `NOT_RUN` until the exact scenario actually executes.
- Exact implementation SHA or explicit uncommitted candidate identity.
- Platform, device/simulator/emulator and OS version.
- App build/runtime and Node/pnpm versions.
- Timezone and network state.
- VoiceOver/TalkBack, text size, Reduce Motion and grayscale/filter settings.
- Exact `EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE` value.
- Exact isolated database name with `pixeldoro-us-09-01-` prefix.
- Screenshot/recording/log reference, result and notes.
- Cleanup/reset/dispose and environment-unset instructions.

### 11.2. Planned launch commands

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_first_page_empty pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_first_page_mixed pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_first_page_read_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=history_first_page_corrupt pnpm start --clear
```

Deep-link commands may be included only after exact route scheme is verified; the existing History tab
is always the primary navigation entry.

### 11.3. Executable smoke checklist

- [ ] Empty fixture shows production empty state, no sample row/graph/prototype controls.
- [ ] Mixed fixture shows completed/failed/cancelled Standard Focus in exact stable order.
- [ ] Trial, running Standard Focus and both Break kinds are absent.
- [ ] Every row shows date, configured duration, tag and explicit status; no mode/time/XP/Coin.
- [ ] One-shot read failure shows local Retry; Retry returns exact rows without durable changes.
- [ ] Corrupt projection enters safe Recovery; no partial/mock row or automatic reset.
- [ ] Leave while loading and return; late stale result does not flash or duplicate.
- [ ] Same-runtime re-entry matches approved Story-01 cache policy.
- [ ] Cold relaunch and airplane mode reconstruct the same first page from isolated SQLite.
- [ ] VoiceOver/TalkBack reads each row once in logical order.
- [ ] Largest text and small portrait remain scrollable without clipped meaning.
- [ ] Grayscale preserves status meaning; Reduce Motion changes no behavior because no animation exists.
- [ ] Stop server, reset/delete only exact fixture DB, unset the variable and launch normally.
- [ ] Normal launch proves fixture never selected or mutated `pixeldoro.db`.
- [ ] Record each result as `PASS`, `FAIL`, `BLOCKED` or `NOT_RUN`; do not infer device evidence from JS export.

## 12. Acceptance criteria

- [ ] History route uses production facade/hooks and focus lifecycle; no direct query/repository/SQLite.
- [ ] Production screen contains no prototype badge/control/state/mock row/contribution preview.
- [ ] First page reads exactly 20 recent terminal Standard Focus rows with stable query order.
- [ ] Completed, failed and cancelled preserve exact status, configured duration, tag and persisted date.
- [ ] Trial, running Focus, Short Break and Long Break are excluded.
- [ ] No row copy implies completed work/reward for failed or cancelled sessions.
- [ ] Empty/loading/technical error/Retry/ready states are deterministic and accessible.
- [ ] Corrupt calendar date or malformed page fails closed and enters existing critical Recovery.
- [ ] Coalescing and generation guards prevent duplicate queries or late stale publication.
- [ ] Render/query/Retry/tab leave/cold relaunch writes no product or analytics fact.
- [ ] First-page UI remains usable offline, at largest text and on small portrait.
- [ ] Status meaning is explicit in text and accessible without color.
- [ ] `nextCursor` is validated but no load-more affordance/action ships.
- [ ] Date grouping, contribution, stale refresh and analytics remain absent.
- [ ] History-only prototype authority is retired; Settings/root/later prototype remains intact.
- [ ] No schema/migration/dependency/native/provider/common-component drift.
- [ ] All automated/static/platform gates and honest device-guide status are recorded at candidate time.

## 13. Definition of Ready, Definition of Done và next gate

### 13.1. Definition of Ready

- [ ] Owner approves `US0901-CONFIRM-01→06` Option A and authorizes Story-01 coding.
- [ ] Relevant breakdown decisions `US0900-CONFIRM-01/05/08/10` are thereby ratified for Story 01.
- [ ] First-page/row/lifecycle/recovery/component/fixture contracts are settled.
- [ ] Branch, HEAD, origin and worktree are re-audited after approval.
- [ ] No owner change conflicts with planned files.
- [ ] Exact `implementation_start_sha` is written into this plan before code edits.

### 13.2. Definition of Done

- [ ] Every acceptance criterion and relevant automated matrix row passes on the exact candidate.
- [ ] Real SQLite mixed/exclusion/order/canonical-corrupt/reopen/no-write evidence passes.
- [ ] Controller lifecycle/coalescing/stale-drop/Recovery tests pass.
- [ ] Production History route/screen contains no prototype/mock/SQL/business rule.
- [ ] Common components are reused unchanged and existing consumers remain regression-green.
- [ ] Component size/responsibility gates pass.
- [ ] Full `pnpm quality`, iOS/Android JS exports, boundaries, repository hygiene, guide validator and
  `git diff --check` pass or any pre-existing warning is isolated and recorded.
- [ ] Device guide exists and actual owner/formal status is explicit; unchecked cases remain `NOT_RUN`.
- [ ] Implementation report records exact files, commands, counts, failures/fixes and candidate identity.
- [ ] No migration/schema/dependency/native/provider/contribution/analytics change.

### 13.3. Gate mở US-09-02

- [ ] Owner reviews the exact US-09-01 candidate and device evidence status.
- [ ] Owner explicitly accepts US-09-01 and authorizes US-09-02 planning.
- [ ] Story 02 must replace or extend the documented cache-only refocus limitation with approved
  date-group/pagination/stale-refresh behavior; it cannot infer acceptance from Story 01 completion.

## 14. Owner Confirmation Register

### US0901-CONFIRM-01 — First-page size và cursor seam

- **Vấn đề:** Story 01 cần fixed query input nhưng load-more thuộc Story 02.
- **Option A — đề xuất:** đọc đúng `20` rows, `cursor: null`; validate/retain `nextCursor` as `hasMore`
  nhưng không render hoặc expose load-more action.
- **Option B:** đọc `100` rows và không giữ cursor seam.
- **Impact/block:** A reuse query/paging contract và giữ UI slice nhỏ; block T02/controller acceptance.
- **Status:** `PENDING_OWNER`.

### US0901-CONFIRM-02 — Row content và date format

- **Vấn đề:** Product khóa duration/tag/status nhưng first-page flat list vẫn cần ngày dễ hiểu.
- **Option A — đề xuất:** row hiển thị `DD/MM/YYYY`, configured duration, localized tag và explicit
  status; không mode, time-of-day, XP/Coin/reward.
- **Option B:** chỉ duration/tag/status, không hiển thị date trước Story 02.
- **Impact/block:** A làm recent history có ngữ cảnh mà không timezone recompute; block row copy/a11y tests.
- **Status:** `PENDING_OWNER`.

### US0901-CONFIRM-03 — Refocus behavior tạm thời của Story 01

- **Vấn đề:** Resilient refocus/foreground refresh được phân cho Story 02.
- **Option A — đề xuất:** initial focus đọc một lần; ready/empty được giữ trong cùng runtime, re-entry
  không refresh; cold relaunch đọc lại. Retry chỉ xuất hiện sau technical error.
- **Option B:** Story 01 đã refresh mỗi refocus và thêm ready-refreshing/stale-error state.
- **Impact/block:** A giữ vertical slice nhỏ và tránh implement nửa Story 02; block controller state shape.
- **Status:** `PENDING_OWNER`.

### US0901-CONFIRM-04 — Validation và Recovery boundary

- **Vấn đề:** History mapper đang check date shape nhưng chưa check ngày calendar thực; lỗi kỹ thuật và
  durable corruption cần hai recovery owner khác nhau.
- **Option A — đề xuất:** harden canonical date ở existing query + defensive Application validation;
  unavailable/query/throw dùng local Retry, corrupt/invariant/malformed page vào global Recovery;
  không repair/reset tự động.
- **Option B:** mọi read failure vào global Recovery và không thêm defensive page validation.
- **Impact/block:** A fail closed cho durable truth nhưng giữ app usable với lỗi tạm; block T01–T03.
- **Status:** `PENDING_OWNER`.

### US0901-CONFIRM-05 — Component và prototype boundary

- **Vấn đề:** First page cần row/status/list nhưng chưa có second production consumer.
- **Option A — đề xuất:** reuse common shell/header/panel/state/button unchanged; tạo row/status/list
  feature-local; render tối đa 20 rows trong current ScrollView; retire prototype chỉ trong History.
- **Option B:** tạo common virtualized history primitives và mở rộng ScreenShell ngay.
- **Impact/block:** A ít regression và để grouping/pagination quyết định virtualization ở Story 02;
  block T05/T06.
- **Status:** `PENDING_OWNER`.

### US0901-CONFIRM-06 — Fixture và evidence gate

- **Vấn đề:** Cần review empty/mixed/error/corrupt mà không chạm owner database hoặc claim formal PASS.
- **Option A — đề xuất:** bốn finite dev-only scenarios trên DB `pixeldoro-us-09-01-*`; valid facts qua
  production boundaries, failure/corrupt qua query decorator; automated gates + owner quick UI,
  structured/formal breadth giữ `NOT_RUN` nếu chưa thực thi.
- **Option B:** không tạo device fixtures; chỉ dựa vào automated tests/manual data hiện có.
- **Impact/block:** A cho evidence lặp lại và cleanup an toàn; block T07–T09/candidate acceptance.
- **Status:** `PENDING_OWNER`.

### 14.1. Confirmation response

Owner có thể duyệt và mở coding bằng một câu:

`Duyệt US0901-CONFIRM-01→06 theo Option A và authorize coding US-09-01`

Approval này ratify `US0900-CONFIRM-01/05/08/10` cho phạm vi Story 01, nhưng không resolve các
confirmation contribution/analytics/later-Story khác và không authorize commit, push hoặc US-09-02.

## 15. Impact verdict và deferred boundary

| Area | Verdict |
|---|---|
| Schema/migration/index | `NONE`; existing schema/query/index sufficient |
| Dependency/package/lockfile | `NONE` |
| Native/prebuild/permission | `NONE` |
| Production durable write | `NONE` |
| Analytics | `NONE`; `history_viewed` deferred US-09-05 |
| Network/provider | `NONE` |
| Common component change | `NONE_PROPOSED` |
| Prototype retirement | History feature/route only |
| Formal device/accessibility | `NOT_RUN` until executed; policy confirmation remains EPIC-level |

Deferred without silent promotion: date grouping/day totals, load more/page merge, virtualized list,
refocus/foreground refresh, stale notice, contribution range/zero-fill/intensity/colors/graph,
`OPEN-006`, `history_viewed`, provider delivery, Settings productionization, retention/search/export and
EPIC-09 exit certification.

## 16. Rollback strategy

If the candidate is rejected before commit:

1. Revert only new History use case/controller/slice/hooks/fixture/tests and History route/feature edits.
2. Restore the prior History prototype route/feature from the recorded implementation start SHA.
3. Keep migration/schema/persistence data untouched; do not delete owner `pixeldoro.db`.
4. Delete only exact disposable fixture databases after resolving their names.
5. Preserve all Settings/root/later-Epic prototype code.

If a post-commit rollback is later authorized, use a normal revert of the exact Story commit rather
than destructive reset. No data migration rollback is required because Story 01 writes no production
durable fact.

## 17. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-09-11 | Codex | Audited committed EPIC-09 breakdown and production query/UI/composition/test baseline; proposed a read-only 20-row first-page slice, canonical date hardening, typed use case/controller, History-only prototype retirement, isolated fixtures and six owner confirmations. No coding, test claim, commit or push. |
