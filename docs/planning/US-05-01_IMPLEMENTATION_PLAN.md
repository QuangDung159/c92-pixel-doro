---
document_id: PIXELDORO_US_05_01_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-05-01 Implementation Plan
version: 0.3.0
status: IMPLEMENTED_AWAITING_OWNER_MANUAL
implementation_status: IMPLEMENTED_AWAITING_OWNER_MANUAL
implementation_started_at: 2026-08-31
last_updated: 2026-08-31
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
approved_by: Dũng Lư
approver_role: Tech Lead/Product Owner
approved_at: 2026-08-31
language: vi
branch: feats/epic-05
baseline_sha: 91cb459c05fdcfa1f114c9ed13ac143fdc7fd7d2
implementation_start_sha: 9c1b6e70a715116e0715f4248ae69f960f68a927
scope:
  - mobile_mvp
  - epic_05
  - us_05_01
  - durable_first_use_entry
  - production_onboarding_intro
authority: PLANNING
story_baseline: ./EPIC-05_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
ux_baseline: ./EPIC-03_UX_PROTOTYPE_PLAN.md
pet_home_baseline: ./EPIC-04_USER_STORIES.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
adr_navigation: ../architecture/decisions/ADR-002-navigation-with-expo-router.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-05-01 — Durable First-use Entry

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan cho Story đầu tiên của
`EPIC-05 — First-use Onboarding Trial`. Lượt tạo plan không triển khai production code,
không sửa schema/migration, không thêm dependency và không chạy native build.

**Story outcome:** Sau bootstrap, PixelDoro chọn đúng entry route từ durable installation/trial
facts. Người dùng mới thấy approved Cat/Mèo Dev Intro bằng production common UI; người đã hoàn tất
onboarding đi thẳng tới production Home. Running/completed/cancelled trial được phân loại đúng để
handoff cho các Story tiếp theo, không dựa navigation history hoặc `PrototypeProvider`.

**Priority:** `MUST` / `P0` / execution order `01` trong EPIC-05.

**Dependencies:** EPIC-01/02/03/04 hoàn tất theo baseline; DEC-05-01 đến DEC-05-04 đều được owner
duyệt Option 1 ngày 2026-08-31.

**Blocks:** `US-05-02`. Story sau không được active trước khi US-05-01 có implementation evidence
và owner đóng exit gate.

**Planning status:** `APPROVED` ngày 2026-08-31.
**Implementation status:** `IMPLEMENTED_AWAITING_OWNER_MANUAL`. Host implementation và automated
quality đã pass; Development Build/device acceptance chưa được owner cung cấp.

### 0.1. Readiness gate

- [x] Baseline EPIC-04 được xác minh tại `91cb459c05fdcfa1f114c9ed13ac143fdc7fd7d2`.
- [x] Branch hiện tại là `feats/epic-05`; không có owner change chồng lấn với file planning mới.
- [x] Owner duyệt DEC-05-01: onboarding bắt buộc, không Skip.
- [x] Owner duyệt DEC-05-02: analytics milestone theo committed Start/explicit Continue.
- [x] Owner duyệt DEC-05-03: cancelled trial quay lại Intro, không reward.
- [x] Owner duyệt DEC-05-04: deadline tự commit rồi mới mở Result.
- [x] Chỉ US-05-01 được mở cho implementation planning; US-05-02…05 vẫn `NOT STARTED`.
- [x] Owner duyệt toàn bộ `US0501-CONFIRM-01`…`06` ngày 2026-08-31.
- [x] `EPIC-05_USER_STORIES.md` chuyển US-05-01 sang `READY`.
- [x] Working tree được kiểm tra lại khi ghi approval; chỉ có hai planning file mới, chưa có production change.

### 0.2. Implementation update — 2026-08-31

- Implementation start SHA: `9c1b6e70a715116e0715f4248ae69f960f68a927` (`US-05-01` planning-only commit).
- Read-only entry query/controller, production composition, initial landing route, Intro migration,
  finite fixture và automated tests đã được triển khai trong working tree.
- Targeted matrix pass: `7` files / `30` tests.
- Root `pnpm run quality` pass: `60` files / `307` tests; device harness, boundary validation và
  repository hygiene đều pass.
- Không có schema/migration/dependency/native change; UI production mới/sửa nằm trong giới hạn 300 dòng.
- Owner manual Development Build evidence vẫn `PENDING`; Story chưa `DONE` và US-05-02 chưa mở.

## 1. Authority contract và current-state review

### 1.1. Contract áp dụng

| Authority | Contract cho US-05-01 |
| --- | --- |
| Product Core | First use ngắn; giới thiệu companion; default Cat/Mèo Dev; trial bắt buộc 5 phút; không naming/selector. |
| EPIC-03 approved UX | Intro hierarchy/copy/CTA; full-screen onboarding; no tab bar; approved route sequence. |
| EPIC-05 Story list | Durable route precedence, production Intro, loading/error/retry, no prototype authority, composition-only screen. |
| DEC-05-01 | Không có Skip hoặc đường bypass Home cho người chưa hoàn tất. |
| DEC-05-03 | Latest cancelled trial quay lại Intro, không đưa Home/Cancelled Result. |
| EPIC-04 | Home/Pet projection và Cat assets là production; Intro reuse PetStage contract, không tạo Pet system khác. |
| ADR-002 | Expo Router sở hữu route composition; navigation không nằm trong Domain/Infrastructure. |
| ADR-003 | SQLite là durable truth; screen-local/prototype state không quyết định first-use entry. |
| ADR-004 | Application thuần; Presentation không import repository/SQLite; composition root tạo concrete adapters. |
| Data Model 001 | `app_installation.onboarding_completed_at` và `sessions.focus_variant/status` đủ biểu diễn entry facts; không cần migration. |

### 1.2. Baseline code hiện tại

| Khu vực | Current state | Gap cần đóng |
| --- | --- | --- |
| Root layout | `initialRouteName: '(onboarding)'`; toàn Stack nằm trong `PrototypeProvider`. | App luôn chọn Intro trước khi đọc durable facts; có nguy cơ wrong-screen flash. |
| Bootstrap | SQLite open→migrate→verify→hydrate→reconcile; `BootstrapBoundary` chỉ render children khi ready. Snapshot có installation/profile/settings/catalog. | Bootstrap không đưa ra first-use destination và không đọc terminal onboarding trial. |
| Reconciliation | Production adapter đang là `NoopStartupReconciliationAdapter`. | US-05-01 chỉ phân loại fact hiện có; overdue completion vẫn thuộc US-05-03. |
| Installation | Repository có `find()` và `onboardingCompletedAt`; bootstrap snapshot cũng có field này. | Chưa có application projection kết hợp installation với session. |
| Session | `SessionRepository.findActive()` và `findById()` tồn tại; SQLite mapper hỗ trợ `onboarding_trial`. | Không có query theo variant để tìm latest onboarding trial khi không biết session id. |
| Onboarding route | Gọi `usePrototype().startTrial()` rồi `router.push('/focus/session')`. | CTA tạo fake in-memory session; route đang vi phạm durable command boundary. |
| Intro presentation | Hierarchy/copy đã approved nhưng dùng alias `PrototypeScreen`, `PixelPanel`, `PixelCompanion`, `PrimaryButton` và hiển thị `PrototypeBadge`. | Chuyển sang canonical common components; bỏ badge; CTA không được fake-start trong Story này. |
| Home route | Đã production, đọc committed bootstrap/profile/Pet projection. | Có thể làm destination cho `onboardingCompletedAt != null` mà không mở rộng scope. |
| Running/Result | Vẫn đọc `PrototypeProvider`; running có mock countdown, result có mock reward. | US-05-01 chỉ chọn destination; production screen content được chuyển rõ sang US-05-02/03. |
| Common UI | `ScreenShell`, `ScreenHeader`, `Panel`, `Button`, `PetStage`, `StatusSurface`, `BootstrapBoundary` đã production và <300 dòng. | Reuse trực tiếp; không tạo shell/card/button/Pet mới. |

### 1.3. Data gap được xác định

Schema không thiếu field. Gap là read API: application có thể tìm active session nhưng không thể
phân loại latest terminal onboarding trial nếu không biết id. Plan thêm đúng một query method hẹp
vào `SessionRepository`; SQLite implementation filter `focus_variant = 'onboarding_trial'` và sort
deterministic. Không thêm table, column, index hoặc migration.

Proposed query contract:

```ts
interface SessionRepository {
  // Existing methods remain unchanged.
  findLatestOnboardingTrial(): Promise<
    PersistenceResult<SessionRecord | null>
  >;
}
```

Sort contract dự kiến:

```sql
WHERE session_type = 'focus'
  AND focus_variant = 'onboarding_trial'
ORDER BY started_at DESC, created_at DESC, id DESC
LIMIT 1
```

Method trả full mapped `SessionRecord`, không trả route string. Product route decision vẫn ở
Application controller. Existing schema constraint đã cấm `failed` cho `onboarding_trial`; nếu
adapter/test double vẫn trả impossible fact, controller fail closed thay vì tự sửa data.

### 1.4. Scope traps phải tránh

1. Không nhét first-use destination vào SQL `CASE`; Infrastructure chỉ trả durable record.
2. Không mở rộng `BootstrapDurableSnapshot` với stale session fact vì bootstrap đọc data trước
   reconciliation; dedicated controller đọc sau bootstrap ready sẽ dùng latest persisted state.
3. Không triển khai startup reconciliation trong Story này. Overdue running vẫn chọn Running;
   US-05-03 sẽ thay no-op adapter và có quyền resolve trước Result.
4. Không xóa `PrototypeProvider` khỏi root ngay vì Focus/Break/History/Shop/Settings/Feedback còn là
   approved prototype consumers. Story chỉ loại nó khỏi first-use authority/Intro; removal cuối
   cùng phải theo consumer migration, không làm vỡ later-epic screens.
5. Không cho Intro CTA tiếp tục tạo fake session. Trước US-05-02, CTA hiển thị approved label nhưng
   ở disabled/not-ready state; branch không được coi là release-ready giữa Story.
6. Không productionize Running/Result để “làm đẹp” route handoff. Their behavior remains explicitly
   transferred; route classification can be automated/review-fixture evidence, not acceptance cho
   countdown/reward.
7. Không thêm Pet naming, species selector, mode/tag control, Strict branch, analytics event hoặc
   reward logic.

## 2. Product decisions đã khóa

| Decision | Owner-approved result | Effect on US-05-01 |
| --- | --- | --- |
| DEC-05-01 | Mandatory, no Skip | Intro có đúng một product CTA; không có Home bypass. |
| DEC-05-02 | Milestones follow committed Start/Continue | Không emit analytics trong US-05-01 vì chưa có Start/Continue commit. |
| DEC-05-03 | Cancelled → Intro | `cancelled` destination là `onboarding_intro`. |
| DEC-05-04 | Auto commit then Result | Chỉ ảnh hưởng future reconciliation; US-05-01 không tự complete overdue trial. |

`OPEN-009` vẫn open và không block. Intro dùng default Cat/Mèo Dev, không có input tên.

## 3. Proposed technical directions cần owner duyệt

Các direction sau là implementation detail; chúng không đổi Product decision ở mục 2.

### TD-05-01-A — Dedicated mobile Application controller

Tạo `FirstUseEntryController` trong `apps/mobile/src/application/first-use`, không đặt trong route,
React provider hoặc Infrastructure. Controller phụ thuộc narrow readers:

```ts
type FirstUseInstallationReader = Pick<InstallationRepository, 'find'>;
type FirstUseSessionReader = Pick<SessionRepository, 'findLatestOnboardingTrial'>;
```

Controller sở hữu external-store projection, single-flight `refresh()`, stale-result generation
guard, subscription và `dispose()`. Không giữ durable truth; mỗi refresh rebuild projection từ port.

**Rationale:** Installation port hiện thuộc mobile Application, trong khi destination là mobile
navigation projection. Di chuyển toàn InstallationRepository sang shared package chỉ để có controller
sẽ là refactor ngoài Story.

### TD-05-01-B — Finite projection và fail-closed precedence

Projection contract:

```ts
type FirstUseEntryDestination =
  | 'onboarding_intro'
  | 'trial_running'
  | 'trial_result'
  | 'home';

type FirstUseEntryProjection =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; destination: FirstUseEntryDestination }
  | {
      status: 'error';
      error: { code: 'FIRST_USE_ENTRY_READ_FAILED' | 'FIRST_USE_ENTRY_STATE_INVALID' };
    };
```

Precedence:

```text
installation missing/reader failure --------------------> error
onboardingCompletedAt != null ---------------------------> home
no onboarding trial ------------------------------------> onboarding_intro
latest onboarding trial = running ----------------------> trial_running
latest onboarding trial = completed --------------------> trial_result
latest onboarding trial = cancelled --------------------> onboarding_intro
impossible/invalid onboarding trial --------------------> error
```

Completed installation is the explicit durable journey milestone and wins entry routing. Controller
does not delete, transition, reward, reconcile, or “repair” conflicting data. Any state impossible
under schema/approved commands fails closed and is documented for later recovery policy.

### TD-05-01-C — Root landing route; no wrong-screen flash

- Add `/index` as the only initial landing route and change `initialRouteName` from `(onboarding)`
  to `index`.
- `index.tsx` subscribes to `FirstUseEntryProjection`, renders a production loading/error surface,
  and uses `router.replace()` only for a `ready` destination.
- Route mapping is fixed and tested:
  `onboarding_intro → /(onboarding)`, `trial_running → /focus/session`,
  `trial_result → /focus/result`, `home → /(tabs)`.
- While replace is in flight, keep neutral loading UI; never render Intro/Home optimistically.
- Retry calls only `refreshFirstUseEntry`; technical error codes/raw provider text never reach copy.

### TD-05-01-D — Production Intro with truthful disabled handoff

- Remove `usePrototype` from `(onboarding)/index.tsx`.
- Render canonical `ScreenShell`, `ScreenHeader`, `Panel`, `PetStage`, `InlineNotice`, and `Button`;
  remove `PrototypeBadge` and prototype-named aliases from the Intro implementation.
- Keep approved hierarchy/copy and Cat/Mèo Dev. No Skip/name/selector.
- Until US-05-02 supplies a production Start command, `Thử phiên 5 phút` is disabled and announced
  as disabled. It must not no-op while appearing enabled and must not create in-memory state.
- `OnboardingScreen` receives plain props (`onStartTrial`, `startTrialEnabled`, optional busy/error
  only when US-05-02 adds them). No repository/navigation import.

This is an intentional incremental branch state, not Epic release acceptance. US-05-02 must enable
the CTA through a committed command before the journey can ship.

### TD-05-01-E — Prototype containment, not broad removal

`PrototypeProvider` may remain wrapping the Stack temporarily because non-US-05-01 routes still
consume it. Enforcement for this Story is narrower and testable:

- root landing route and onboarding route do not import prototype context;
- first-use controller/composition do not depend on prototype types/state;
- Intro renders no PrototypeBadge/control/mock label;
- later prototype consumers are unchanged unless a compile-only signature migration is necessary.

The provider is removed only after all consumers are migrated by their owning Stories; keeping it
temporarily is not permission to use it for new production behavior.

### TD-05-01-F — Dev-only finite review fixture

- Parse `EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE` only in composition/review code under `__DEV__` and
  `diagnosticsEnabled !== false`.
- Accepted Story-01 scenarios: `first_use_new`, `first_use_returning`, `first_use_running`,
  `first_use_completed`, `first_use_cancelled`, `first_use_read_error`.
- Fixture provides narrow installation/session readers to the production controller; it cannot
  provide destination directly, call router, mutate production DB, or appear as a user control.
- Production/invalid env returns `undefined`; application uses SQLite readers.
- New/returning/error are primary visible manual cases. Running/completed fixture verifies selected
  handoff route only; production countdown/result content remains explicitly pending US-05-02/03.
- SQLite integration remains the durable evidence for real rows; fixture evidence must not be
  described as production persistence proof.

## 4. Target design

### 4.1. Ownership graph

```text
SQLite app_installation + sessions
            |
            v
InstallationRepository + SessionRepository
            |
            v
FirstUseEntryController (Mobile Application)
            |
            v
MobileApplicationFacade / provider hooks
            |
            v
/index route (loading/error + replace callback)
      |             |              |             |
      v             v              v             v
  Intro        Trial Running   Trial Result      Home
```

Only `/index` knows concrete route strings. Controller returns semantic destinations. Screens know
neither repository nor route precedence.

### 4.2. Controller lifecycle

```text
idle --refresh--> loading --read success--> ready(destination)
                         \--read/invalid--> error
error --retry----> loading
ready --refresh--> loading/ready
any --dispose----> listeners cleared; late result ignored
```

Rules:

- Concurrent `refresh()` callers share one promise.
- Last active generation is the only operation allowed to publish.
- `ready` never publishes until both required facts are classified.
- Repository errors map to stable first-use codes; raw SQL/provider detail stays Infrastructure.
- Controller performs no writes and does not call navigation.

### 4.3. Read sequence

1. Application bootstrap reaches `ready`; database/readiness gate is already open.
2. Composition invokes or allows `/index` to invoke `firstUseEntry.refresh()` once.
3. Controller reads installation.
4. If installation is completed, it can return `home` without session query; this avoids an
   unnecessary route-blocking read for returning users.
5. Otherwise controller reads latest onboarding trial and maps status per TD-05-01-B.
6. `/index` replaces route only after `ready`.

Short-circuiting Home is safe because explicit `onboarding_completed_at` is the approved completion
milestone. Story does not inspect or repair any stale session after completion.

### 4.4. UI composition

`FirstUseEntryScreen` is a small pure presentation component:

- `loading`: `ScreenShell` + `LoadingState` with polite status.
- `error`: `ScreenShell` + `ErrorState`, safe copy, Retry.
- `redirecting`: neutral loading state while route replacement occurs.

`OnboardingScreen` keeps the approved sections and accepts data/callback props only. Pet is the
default `PetStage state="idle"` using EPIC-04 renderer/fallback/reduced-motion contract.

Estimated UI sizes:

| File/component | Estimate | Split/test boundary |
| --- | ---: | --- |
| `/index` route | 45–75 lines | Hook + semantic-to-route mapping/navigation only. |
| `FirstUseEntryScreen` | 50–85 lines | Loading/error/redirecting presentation tests. |
| `OnboardingScreen` | 70–110 lines | Approved copy, component reuse, disabled CTA/a11y tests. |
| Provider hooks update | +20–35 lines | External-store and refresh hook tests via controller. |

No UI source is expected to approach 240 lines; 300 remains a hard limit.

### 4.5. Route acceptance boundary for this Story

US-05-01 accepts production destination selection, Intro, Home handoff, and recovery surface.
It does not falsely accept production Running/Result content. Specifically:

| Destination | US-05-01 acceptance | Transferred work |
| --- | --- | --- |
| Intro | Full visible/presentation acceptance; Start CTA disabled truthfully. | Production Start action in US-05-02. |
| Home | Full route + existing production Home acceptance/regression. | None in Story 01. |
| Trial Running | Semantic route selection and no Intro/Home misroute. | Durable running projection/countdown/cancel in US-05-02. |
| Trial Result | Semantic route selection and no Intro/Home misroute. | Committed result/reward in US-05-03. |
| Cancelled | Full return-to-Intro route selection. | Creating cancellation belongs US-05-02. |

## 5. Scope khóa cho implementation

### 5.1. In scope

- Read-only first-use entry controller/projection and retry.
- Latest onboarding-trial repository query using schema 001.
- Initial `/index` landing route and deterministic replace mapping.
- Production Intro component migration; prototype badge/state removed from first-use route.
- Returning-user direct route to existing production Home.
- Loading/error/invalid-state UI without wrong-screen flash.
- Dev-only finite Story-01 fixture through narrow production controller dependencies.
- Unit, controller, SQLite integration, presentation, navigation, accessibility, boundary and
  common-component regression tests.
- Story evidence and status update after implementation/manual review.

### 5.2. Out of scope

- Start/cancel/complete/reconcile/reward/Continue commands.
- Real countdown, Result reward projection, celebration event, onboarding completion write.
- Enabling the Intro CTA before US-05-02.
- Removing PrototypeProvider from unrelated routes or productionizing their mock state.
- Analytics events/provider; DEC-05-02 is recorded but has no milestone in this Story.
- Naming, Pet/species selector, multiple Pet, mode/tag selector, Strict/grace branch.
- Standard Focus/Break/History/Progression/Shop/Settings behavior.
- Schema/migration/index, dependency, native config/artifact, prebuild/EAS/device automation.

## 6. Authoritative execution plan cho solo developer

Only one task and one Story are active at a time.

| Order | Task | Main output | Gate to next |
| ---: | --- | --- | --- |
| T00 | Owner approval and baseline recheck | Plan directions approved; clean non-overlapping worktree | T01 |
| T01 | Lock tests/contracts first | Projection/precedence/query/route cases fail for the right reason | T02 |
| T02 | Add latest onboarding-trial query | Shared port + SQLite implementation + deterministic integration proof | T03 |
| T03 | Implement FirstUseEntryController | Finite read-only external-store projection and error mapping | T04 |
| T04 | Wire composition/facade/provider | Production graph and narrow fixture injection; lifecycle/dispose safe | T05 |
| T05 | Add initial landing route | No-flash `/index` and tested semantic route mapping | T06 |
| T06 | Migrate approved Intro | Canonical common UI, no prototype authority/badge, disabled truthful CTA | T07 |
| T07 | Add review fixture/manual harness | Finite dev-only scenarios; production absence proven | T08 |
| T08 | Full automated/a11y/boundary regression | Targeted matrix + `pnpm run quality` green | T09 |
| T09 | Owner manual evidence and closeout | New/returning/error captures; route handoff proof; Story report/status | US-05-02 gate |

### T00 — Owner approval and baseline recheck

- Approve TD-05-01-A through F as a set or record exact amendments.
- Confirm only US-05-01 becomes `IN_PROGRESS`; US-05-02 remains unopened.
- Recheck branch/HEAD/upstream/worktree; preserve both planning files and any owner changes.
- Record implementation-start SHA separately from planning baseline.

**Stop:** unresolved technical direction, branch moved to baseline without EPIC-04 completion, or
overlapping owner edits.

### T01 — Lock tests/contracts first

- Write controller precedence table covering installation/trial/error/impossible facts.
- Write repository integration expectation for latest onboarding trial ordering/filtering.
- Write route mapping/navigation tests and Intro absence/disabled-CTA assertions.
- Extend boundary test case so route/Presentation cannot import persistence/repository/prototype
  authority for first use.

**Checkpoint:** tests document the planned behavior without adding production behavior prematurely.

### T02 — Add latest onboarding-trial query

- Extend `SessionRepository` with `findLatestOnboardingTrial()`.
- Implement owner-read query via existing `sessionSelect`, `readMappedOne`, and `mapSessionRow`.
- Filter exact session type/variant; deterministic order; parameter-free static filter.
- Add SQLite integration rows: standard newer than trial, multiple cancelled retries, newest running,
  completed, no trial, reopen, provider read failure mapping.
- Update only compile-affected typed test doubles; do not add a second repository or direct SQL in
  Application/Presentation.

**Checkpoint:** no schema diff; repository returns records, not route decisions.

### T03 — Implement FirstUseEntryController

- Define semantic destination/projection/error types and narrow readers.
- Implement short-circuit Home, trial status mapping, typed errors, single-flight refresh,
  generation guard, subscription, and dispose.
- Test every state, retry after failure, duplicate refresh, late result after dispose, listener
  notifications, and no writes.

**Checkpoint:** pure host tests prove the route decision without React/Expo/SQLite imports.

### T04 — Wire composition, facade, and provider

- Construct controller from `persistence.installation` and `persistence.sessions`.
- Add facade property and refresh method; expose `useFirstUseEntryProjection` and
  `useFirstUseEntryRefresh` hooks.
- Refresh only after bootstrap is ready; bootstrap recovery retry must lead to a fresh entry read.
- Dispose controller with application graph.
- Inject fixture readers only from composition/review when exact dev gate is active.
- Expand `create-mobile-application.test.ts` for real graph, overrides, boot/retry/dispose, and no
  fixture in production-like mode.

**Checkpoint:** route can consume an Application projection; no repository reaches provider/screen.

### T05 — Add initial landing route

- Add root `/index` route and set it as `unstable_settings.initialRouteName`.
- Trigger one refresh on idle; do not loop on ready/error renders.
- Replace semantic destinations using the exact route map in TD-05-01-C.
- Render `FirstUseEntryScreen` during load/error/redirect; Retry stays on landing route.
- Navigation tests assert one replace, no push/back-stack duplication, no replace before ready, and
  no technical error copy.

**Checkpoint:** new/returning choice occurs before Intro/Home render; deep routes stay reachable.

### T06 — Migrate approved Intro

- Remove `usePrototype` from onboarding route and `PrototypeBadge` from Intro.
- Replace prototype-named aliases with canonical common imports without duplicating styles.
- Preserve approved copy/order and default Cat/Mèo Dev.
- Render `Thử phiên 5 phút` disabled until US-05-02; no fake navigation or mutation.
- Confirm no Skip/name/species/mode/tag/Strict controls and no tabs.
- Test screen-reader order, heading/notice/button semantics, large text wrapping, reduced-motion/static
  Pet visibility, and component line count.

**Checkpoint:** visible Intro is production presentation even though Start action is intentionally pending.

### T07 — Review fixture and manual harness

- Parse exact finite env values in a dev-only review module.
- Supply narrow reader overrides; never pass a destination or router callback from fixture.
- Ensure fixture state is recreated deterministically after relaunch and cannot touch `pixeldoro.db`.
- Add parser/availability tests for undefined, invalid, production-like, and each accepted scenario.
- Document that fixture is route-review evidence, while SQLite integration is durable-row evidence.

**Checkpoint:** fixture can review every route decision without becoming application truth.

### T08 — Automated verification

- Run targeted controller/repository/presentation/navigation/composition tests.
- Run typecheck, lint, device-harness validator, boundaries, repository hygiene, then root quality.
- Inspect new/modified UI line counts and direct import/duplication audit.
- Confirm no migration checksum/schema/dependency/native file changed.

**Stop:** any root gate fail, route flash, prototype authority import, disabled CTA appearing enabled,
fixture production leak, or schema/dependency change.

### T09 — Manual evidence and closeout

- Owner runs Development Build guide in §10 on implementation SHA.
- Record new/returning/error plus cancelled route evidence; running/result are route-selection only.
- Record SQLite integration before/after facts and explicitly label fixture facts non-production.
- Fix failures and rerun affected + root gates on final behavior SHA.
- Update plan/report/EPIC Story status only after owner accepts evidence; do not open US-05-02 early.

## 7. Planned file impact

Exact filenames may be refined during implementation only when ownership stays the same and plan is
updated before code diverges.

### 7.1. Files dự kiến tạo

| File | Responsibility | Target size |
| --- | --- | ---: |
| `apps/mobile/src/application/first-use/first-use-entry.controller.ts` | Projection types, read orchestration, precedence, retry/subscription lifecycle | 140–210 |
| `apps/mobile/src/application/first-use/first-use-entry.controller.test.ts` | Pure precedence/error/concurrency/dispose matrix | test-only |
| `apps/mobile/src/application/first-use/index.ts` | Narrow public exports | ≤30 |
| `apps/mobile/src/app/index.tsx` | Initial route composition and semantic route replace | 45–75 |
| `apps/mobile/src/presentation/features/onboarding/first-use-entry-screen.tsx` | Loading/error/redirecting surface | 50–85 |
| `apps/mobile/src/presentation/features/onboarding/first-use-entry-screen.test.tsx` | Safe copy, retry, accessibility rendering | test-only |
| `apps/mobile/src/presentation/features/onboarding/index.test.tsx` | Intro hierarchy/reuse/disabled CTA/forbidden-control assertions | test-only |
| `apps/mobile/src/composition/review/first-use-entry-review-fixture.ts` | Finite dev-only reader overrides | 80–130 |
| `apps/mobile/src/composition/review/first-use-entry-review-fixture.test.ts` | Parser/gate/scenario isolation tests | test-only |

Route behavior tests may be placed in `apps/mobile/src/app/index.test.tsx` if the Expo Router mock is
stable and does not require a new dependency. Otherwise semantic route mapping is exported as a pure
local helper from Application/route-support and tested without rendering Router internals.

### 7.2. Files dự kiến cập nhật

| File | Planned change |
| --- | --- |
| `packages/application/src/persistence/session.repository.ts` | Add narrow latest-onboarding-trial read method. |
| `apps/mobile/src/infrastructure/database/repositories/sqlite-session.repository.ts` | Implement mapped deterministic query. |
| `apps/mobile/test/integration/sqlite-repository-round-trip.integration.test.ts` | Add real SQLite filtering/ordering/reopen cases without duplicating host driver. |
| `apps/mobile/src/application/index.ts` | Export first-use controller/types. |
| `apps/mobile/src/application/mobile-application.facade.ts` | Expose controller and refresh command. |
| `apps/mobile/src/presentation/providers/mobile-application-context.tsx` | Add projection/refresh hooks only. |
| `apps/mobile/src/composition/create-mobile-application.ts` | Construct/dispose/refresh controller and gate fixture overrides. |
| `apps/mobile/src/composition/create-mobile-application.test.ts` | Verify real/fixture graph and lifecycle. |
| `apps/mobile/src/app/_layout.tsx` | Initial route becomes `index`; retain provider only for pending consumers. |
| `apps/mobile/src/app/(onboarding)/index.tsx` | Remove prototype start/navigation authority; pass production Intro props. |
| `apps/mobile/src/presentation/features/onboarding/index.tsx` | Canonical common components, no badge, disabled truthful Start handoff. |
| `scripts/validate-boundaries.mjs` | Add only a focused negative case if existing rules do not catch first-use repository/prototype imports. |

### 7.3. Files/khu vực không được chạm

- `apps/mobile/src/infrastructure/database/migrations/**` và schema manifest/checksum.
- `package.json`, `pnpm-lock.yaml`, Expo/native config, `ios/`, `android/`, build artifacts.
- Reward/profile writes, timer/reconciliation, Pet terminal feedback, analytics queue/provider.
- Focus Running/Result presentation except a minimal compile-only route signature if unavoidable;
  such a change must not claim production behavior.
- History/Shop/Settings/Feedback/Break prototype behavior.
- Product/architecture authority other than planning status/evidence updates explicitly required.

## 8. Acceptance-to-evidence matrix

| Acceptance | Automated evidence | Manual evidence | Status at plan |
| --- | --- | --- | --- |
| New installation → approved Intro | Controller + route + component tests | `first_use_new` screenshot/video | [ ] |
| Completed onboarding → Home | Precedence/navigation test | `first_use_returning` cold launch | [ ] |
| Running trial → Running destination | Controller/route table test | Fixture route-selection record; downstream content pending | [ ] |
| Completed trial → Result destination | Controller/route table test | Fixture route-selection record; downstream content pending | [ ] |
| Cancelled trial → Intro | Controller + SQLite record test | `first_use_cancelled` cold launch | [ ] |
| Read failure → safe Retry | Controller failure/retry + screen copy test | `first_use_read_error` and successful retry | [ ] |
| No wrong-screen flash | No navigation before ready test | cold-launch video for new/returning | [ ] |
| No prototype authority/badge | Import/static/presentation tests | Intro visual inspection | [ ] |
| No naming/selector/Skip/Strict | Component text/role negative tests | Intro inspection | [ ] |
| No writes from entry read | Port spies + SQLite before/after | evidence record notes unchanged facts | [ ] |
| Common UI/a11y/reduced motion | Existing + new component tests | screen reader/large text/Reduce Motion | [ ] |
| No UI >300/schema/dependency/native diff | repository/static audit | n/a | [ ] |

## 9. Automated test strategy

### 9.1. Pure Application/controller

- Table-test every precedence row in TD-05-01-B.
- Installation read failure; missing installation; session read failure; impossible status/record.
- Completed installation short-circuits session read.
- Cancelled maps Intro with no write/reward call.
- Single-flight duplicate refresh; retry after error; subscriber notification count; unsubscribe.
- A slower stale read cannot overwrite a newer refresh; dispose ignores late result.
- Projection contains semantic destination only, never route path/SQLite error.

### 9.2. Repository/SQLite integration

- No trial returns null.
- Standard Focus is excluded even if newer.
- Multiple onboarding trials select deterministic latest record.
- Running/completed/cancelled rows round-trip through existing mapper.
- Close/reopen retains same result.
- Provider failure maps existing stable persistence error; raw error does not escape.
- Migration registry/checksum remains unchanged.

### 9.3. Composition/controller integration

- Production graph uses `persistence.installation/sessions`.
- Dev fixture overrides only the two narrow readers and leaves Home/Pet/persistence graph intact.
- `diagnosticsEnabled: false`, non-dev, missing/invalid env cannot enable fixture.
- Boot ready triggers a usable entry refresh; retry/dispose behaves deterministically.
- Existing Pet/bootstrap/reset tests remain green.

### 9.4. Presentation/navigation

- `/index` renders loading before projection and no destination screen flash.
- Exactly one `replace` for each ready destination; no `push`; Retry does not navigate.
- Intro uses common component types, approved copy/order, Cat idle stage, and disabled CTA.
- No `PrototypeBadge`, mock label, name input, Skip, ChoiceChip, work tag, mode, or Strict text/control.
- Error copy has no database code, SQLite/provider wording, stack, or raw details.
- Existing Home route still reads production profile/Pet projections.

### 9.5. Accessibility and component regressions

- Loading uses polite live region; error is actionable/announced; Retry has button semantics.
- Intro heading and copy order, disabled CTA state, ≥44pt existing Button target, large-text layout.
- Pet status remains understandable with Reduce Motion/static fallback; decorative art not double-read.
- `ScreenShell`, `ScreenHeader`, `Panel`, `Button`, `PetStage`, `StatusSurface`, Bootstrap/Home/Pet tests pass.
- Static line-count audit: every production UI/source ≤300; no duplicate shell/panel/button/Pet/status.

### 9.6. Boundary/regression

- Route/Presentation cannot import Infrastructure, repository, SQL, or prototype authority.
- Mobile Application cannot import Infrastructure/Expo/SQLite.
- Infrastructure returns records/errors only and does not import navigation/presentation.
- Existing prototype consumers continue to compile while provider remains temporary.
- Root `pnpm run quality` is mandatory on final implementation SHA.

## 10. Manual test guide dự kiến

### 10.1. Preconditions

- Plan và TD-05-01-A…F đã được owner duyệt.
- US-05-01 implementation/root quality đã pass trên exact SHA cần review.
- Existing compatible Expo Development Build đã cài; không dùng Expo Go, không prebuild/EAS.
- Fixture chỉ dùng review readers và không sửa production `pixeldoro.db`.
- Running/Result cases chỉ accept route selection; content production thuộc US-05-02/03.

### 10.2. Exact command

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_new pnpm start --clear
```

Expected `node -v`: `v22.23.2`.

### 10.3. Scenario A — New user

1. Cold launch Development Build with `first_use_new`.
2. Start point is neutral bootstrap/entry loading, not Intro/Home content.
3. Confirm Intro appears without wrong-screen flash.
4. Verify eyebrow/title/description, Cat/Mèo Dev, two promise rows, Relax 5-minute notice, and
   `Thử phiên 5 phút`.
5. Confirm CTA is visibly and accessibly disabled for Story 01; it does not start a fake session.
6. Confirm no Prototype badge/control, Skip, name input, Pet/species selector, mode/tag selector,
   Strict/grace copy, tab bar, XP/Coin change, or navigation when pressing disabled CTA.

Expected durable/review fact: fixture reports `onboardingCompletedAt=null`, no trial; before/after
unchanged. Expected Pet: Cat idle/base state, no celebration. Expected XP/Coin: unchanged.
Expected navigation: landing→Intro.

### 10.4. Scenario B — Returning user

Restart Metro with:

```sh
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_returning pnpm start --clear
```

1. Force-stop the app, relaunch, and record the first visible product screen.
2. Confirm direct production Home/Pet Room, with no Intro flash.
3. Confirm Home reads its existing production profile/Pet projection and no review totals are
   fabricated by first-use fixture.

Expected fact: `onboardingCompletedAt` is non-null and unchanged; session query is not required.
Expected Pet: Home base projection. XP/Coin: existing committed totals, no mutation.

### 10.5. Scenario C — Cancelled and error recovery

Run separately:

```sh
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_cancelled pnpm start --clear
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_read_error pnpm start --clear
```

1. Cancelled case must land Intro, with no reward/result/Home bypass.
2. Error case must stay on a safe recovery surface with Retry and no technical details.
3. Press Retry; the deterministic fixture succeeds on its second read and opens Intro exactly once
   without duplicate navigation.
4. Disable network and repeat new/returning/error retry; local entry classification must not require
   network.

Expected fact: read-only; installation/session/reward/profile unchanged. Pet stays base; XP/Coin
unchanged. Negative: error must not mark onboarding complete or fabricate a trial.

### 10.6. Scenario D — Running/completed destination handoff

Run `first_use_running` and `first_use_completed` separately. Record that the semantic target is
Running and Result respectively and that Intro/Home is not chosen. Do **not** mark countdown,
completion, reward, or Result UI as passed in US-05-01; those remain US-05-02/03 acceptance.

### 10.7. Accessibility/reduced motion/relaunch

- Enable screen reader: verify loading announcement, Intro heading/order, Cat status once, disabled
  CTA state, error alert and Retry label.
- Increase system text size: content remains scrollable/reachable; no clipped CTA/copy.
- Enable Reduce Motion: Cat static fallback is visible and conveys idle status.
- Background/foreground and cold relaunch each new/returning/cancelled case; destination remains
  deterministic and no state changes merely from viewing.

### 10.8. Cleanup

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

Cold launch once after cleanup and confirm no fixture badge/control/state is present. Fixture must
not create a database requiring destructive cleanup.

### 10.9. Evidence owner gửi

- Git SHA; platform; device/simulator; OS; Development Build/app version.
- Video of cold new/returning launch proving no wrong-screen flash.
- Screenshots of Intro and error/retry; route-selection record for running/completed/cancelled.
- Before/after installation/session/reward/profile facts, clearly separating fixture facts from real
  SQLite integration evidence.
- Screen reader, large text, Reduce Motion, offline, background/relaunch pass/fail.
- Exact automated/root-quality output and pass/fail for every manual step.

Không đánh dấu device/platform pass trước khi owner evidence tồn tại.

## 11. Verification commands dự kiến

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
pnpm exec vitest run apps/mobile/src/application/first-use apps/mobile/src/composition/review/first-use-entry-review-fixture.test.ts apps/mobile/src/presentation/features/onboarding apps/mobile/test/integration/sqlite-repository-round-trip.integration.test.ts
pnpm run typecheck
pnpm run lint
pnpm run test:boundaries
pnpm run check:repository
pnpm run quality
git diff --check
git status --short
```

Implementation closeout records exact test counts from actual output; plan does not predict or mark
them passed. No prebuild/EAS/native command is part of this Story.

## 12. Risks, stop conditions, and rollback

### 12.1. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Intro flashes before Home | User sees contradictory journey | Neutral `/index` landing; replace only after ready; cold-launch video/test. |
| Bootstrap snapshot becomes stale after later reconciliation | Wrong terminal route | Dedicated post-bootstrap controller read; do not embed session in bootstrap snapshot. |
| Latest query accidentally returns Standard Focus | Trial routing corrupt | Exact variant/type filter plus newer-standard integration case. |
| Provider removed too early | Breaks unrelated prototype routes | Contain but retain provider until owning Story migrates each consumer. |
| Disabled CTA looks functional or no-ops | Misleading user/reviewer | Existing Button disabled/a11y state; explicit negative tests; enable only US-05-02. |
| Fixture bypasses Product logic | False evidence | Inject facts/readers only; controller derives destination; production absence tests. |
| Route screen absorbs business logic | Boundary/maintenance issue | Semantic projection in Application; route owns path mapping/callback only. |
| Repository interface change causes broad fake churn | Rework | Add one narrow read method; update only typed implementations/test doubles; no generic query API. |
| Impossible state silently repaired | Data loss/wrong route | Fail closed with stable error; no write in Story. |

### 12.2. Mandatory stop conditions

Stop implementation and return to owner/plan review if:

- existing schema cannot express required route facts without migration;
- approved UX would require Skip, naming, selector, or Start behavior in this Story;
- a clean no-flash route requires changing native/dependency graph;
- owner changes overlap planned files and cannot be preserved safely;
- Running/Result must be productionized to make Story evidence honest;
- root quality/boundary/schema immutability cannot pass without scope expansion.

### 12.3. Rollback/revert strategy

- Keep work in small commits/slices matching T02–T07 so query/controller/route/Intro can be reviewed.
- Revert only Story-owned commits through normal Git history if owner requests; never reset/discard
  owner changes or rewrite history.
- If route gate fails, restore previous initial route in a revert commit while preserving tests/plan
  for diagnosis; do not bypass with prototype state.
- Fixture cleanup is removal of env and app restart; no user database deletion.

## 13. Definition of Done cho US-05-01

- [x] Owner approved this plan and TD-05-01-A…F before implementation on 2026-08-31.
- [x] Exactly one Story was active; US-05-02 remained unopened.
- [x] Automated tests map new/returning/running/completed/cancelled facts to the approved semantic destination.
- [x] Intro is production common UI with Cat/Mèo Dev and no prototype badge/authority/forbidden control.
- [x] CTA is truthful/disabled until US-05-02; no in-memory session is created.
- [ ] Returning user reaches production Home without Intro flash.
- [ ] Loading/read failure/retry are safe, accessible, local/offline, and write nothing.
- [x] Latest onboarding-trial SQLite query is deterministic and requires no schema/migration.
- [x] Controller/composition/presentation/navigation/SQLite/a11y/boundary/common automated tests pass.
- [x] `pnpm run quality` and `git diff --check` pass in the implementation working tree.
- [x] No UI source exceeds 300 lines; no duplicated common component or repository import in screen.
- [x] No dependency/native artifact/schema/reward/timer/analytics/later-epic behavior changed.
- [ ] Owner manual evidence records SHA/platform/device/OS/captures/facts/pass-fail honestly.
- [x] Running/Result production behavior remains explicitly transferred, not marked accepted.
- [ ] Story report/status is updated and owner closes exit gate before US-05-02.

## 14. Owner confirmation gate cho implementation

Owner đã duyệt toàn bộ `US0501-CONFIRM-01`…`06` bằng xác nhận “Duyệt 0501” ngày
2026-08-31. Approval đóng planning gate và đưa Story sang `READY`; nó không tự đánh dấu task
production nào là `IN_PROGRESS`.

| ID | Confirmation | Recommendation | Status |
| --- | --- | --- | --- |
| `US0501-CONFIRM-01` | Mobile Application `FirstUseEntryController` với narrow readers/external-store projection | Approve TD-05-01-A | `APPROVED 2026-08-31` |
| `US0501-CONFIRM-02` | Finite destination precedence; completed installation wins; invalid fact fails closed | Approve TD-05-01-B | `APPROVED 2026-08-31` |
| `US0501-CONFIRM-03` | `/index` neutral landing + replace-only route map | Approve TD-05-01-C | `APPROVED 2026-08-31` |
| `US0501-CONFIRM-04` | Production Intro; Start CTA disabled until committed command arrives in US-05-02 | Approve TD-05-01-D | `APPROVED 2026-08-31` |
| `US0501-CONFIRM-05` | Retain but contain PrototypeProvider for pending consumers | Approve TD-05-01-E | `APPROVED 2026-08-31` |
| `US0501-CONFIRM-06` | Finite dev-only reader fixture; SQLite integration remains durability evidence | Approve TD-05-01-F | `APPROVED 2026-08-31` |

Không còn technical confirmation mở. Story sẵn sàng để owner yêu cầu bắt đầu implementation.

## 15. References

- `docs/planning/EPIC-05_USER_STORIES.md` — Story scope, decisions, tests, manual evidence, order.
- `docs/PIXELDORO_CORE_TRUTH.md` — Product truth and OPEN-009.
- `docs/planning/EPIC-03_UX_PROTOTYPE_PLAN.md` — owner-approved hierarchy/navigation.
- `docs/planning/EPIC-04_USER_STORIES.md` and exit report — production Cat/Home contracts.
- Architecture overview/system/project/data model and ADR-002/003/004.
- Timer Engine, Session Lifecycle, Pet State Machine, Gamification Rules.

## 16. Change log

| Version | Date | Author | Change |
| --- | --- | --- | --- |
| 0.3.0 | 2026-08-31 | Codex | Implemented the approved host slice; targeted 30 tests and root 307 tests pass. Marked Story awaiting owner Development Build/manual evidence, not DONE. |
| 0.2.0 | 2026-08-31 | Codex, recording owner approval | Recorded approval of US0501-CONFIRM-01…06 and moved the Story to READY. No production task started. |
| 0.1.0 | 2026-08-31 | Codex, for owner review | Created implementation plan after owner approved DEC-05-01…04; defined read-only entry controller, latest trial query, root landing route, production Intro migration, fixture/test/evidence plan, and six technical confirmations. No production implementation. |
