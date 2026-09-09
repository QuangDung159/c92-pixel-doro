---
document_id: PIXELDORO_US_07_01_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-07-01 Implementation Plan
version: 0.4.0
status: DONE_OWNER_ACCEPTED_QUICK_UI
implementation_status: DONE_OWNER_ACCEPTED
date: 2026-09-08
last_updated: 2026-09-09
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-07
planning_baseline_sha: 0e6493ffe3520780e61c739df38f3de6e4da04df
implementation_start_sha: 0e6493ffe3520780e61c739df38f3de6e4da04df
exact_implementation_sha: a3b92fd8a6908f4efecea7fc7c8d49ac20683aa3
manual_device_status: OWNER_QUICK_UI_SMOKE_REPORTED
owner_acceptance_status: ACCEPTED_TO_OPEN_US_07_02_PLANNING
formal_tester_status: NOT_RUN
schema_change: NONE_PROPOSED
scope:
  - mobile_mvp
  - epic_07
  - us_07_01
  - durable_break_cadence
  - completed_focus_result_recommendation
authority: PLANNING
story_baseline: ./EPIC-07_USER_STORIES.md
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

# US-07-01 — Cadence đúng và lựa chọn Break trên completed Result

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan cho Story đầu tiên của
`EPIC-07 — Break Experience và Long Break Cadence`. Lượt tạo plan chỉ thêm planning document;
không triển khai production code, không sửa schema/migration, dependency/native configuration,
không chạy prebuild/native build và không push/tạo PR.

**Story outcome:** sau một completed Standard Focus, Result đọc durable local history để nói rõ Break
kế tiếp là Short `5` phút hay Long `15` phút. Result/Home/retry/relaunch chỉ đọc; chúng không tạo
Break, không reset cadence và không thay đổi session/reward/profile.

**Priority:** `P0`; execution order `01` trong EPIC-07.

**Dependency:** EPIC-06 `DONE_OWNER_ACCEPTED`, accepted behavior candidate
`458a8868ac0024e3b3d1eff64ccc26408a81b2e1`; current EPIC-07 planning baseline
`0e6493ffe3520780e61c739df38f3de6e4da04df`.

**Blocks:** `US-07-02`. Durable Start Break không được triển khai trước khi cadence policy,
recommendation projection, exact-source gating và UI state của Story này có accepted evidence.

**Planning status:** `DONE_OWNER_ACCEPTED_QUICK_UI`.
**Implementation status:** `DONE_OWNER_ACCEPTED`. Candidate đã commit/push tại exact SHA
`a3b92fd8a6908f4efecea7fc7c8d49ac20683aa3`; owner báo cáo quick UI smoke không crash và hoạt động
đúng kỳ vọng ngày 2026-09-09. Structured device/accessibility matrix và formal tester không được suy
diễn là PASS từ xác nhận này.

### 0.1. Readiness gate tại thời điểm tạo plan

- [x] Repository đang ở `feats/epic-07`; upstream cùng SHA và working tree sạch trước file này.
- [x] EPIC-06 accepted behavior candidate và current documentation-only delta đã được đối chiếu.
- [x] Product Core, EPIC-07 breakdown, architecture/specifications và current production/test code đã
  được audit.
- [x] Existing `LongBreakCadenceQuery` và SQLite implementation đã được xác minh là reusable.
- [x] Existing Standard completed Result/controller/route/component và all-consumer risks đã được
  xác minh trên planning baseline.
- [x] Không có schema gap cho scope đọc/hiển thị recommendation.
- [x] Owner duyệt Option A cho `US0701-CONFIRM-01`→`09` ngày 2026-09-08.
- [x] `implementation_start_sha` được ghi ngay trước production edit đầu tiên.

## 1. Authority contract và current-state review

### 1.1. Contract áp dụng

| Authority | Contract cho US-07-01 |
|---|---|
| Product Core §5.2 | Short `5`; Long `15`; `<4` completed Standard Focus kể từ marker → Short, `>=4` → Long; due sticky tới completed Long. |
| Product Core §10.3 | Chỉ completed Standard Result eligible; Break không auto-start; failed/cancelled không có Break CTA. |
| EPIC-07 Stories | Pure cadence policy, `LoadNextBreakRecommendation(sessionId)`, finite loading/error/retry và no write. |
| Session Lifecycle | SQLite session history là durable truth; terminal status immutable; exact identity, fail closed. |
| System Architecture | Domain quyết định rule; Application orchestration; Infrastructure query; Presentation nhận typed projection. |
| Data Model `001` | Existing unified `sessions` và cadence index/query đủ dùng; không persist counter/`long_break_due`. |
| ADR-003/004 | Không dùng prototype/UI state làm business truth; SQL/platform stays behind ports. |
| EPIC-03 UX | Completed Result có reward rồi explicit Break/Home hierarchy; prototype selector chỉ là review evidence. |

### 1.2. Baseline code hiện tại

| Khu vực | Current state tại `0e6493f` | Classification | Gap cần đóng |
|---|---|---|---|
| Domain | Chưa có Break cadence decision/type. | Missing | Pure policy và exact constants/result type. |
| Application port | `LongBreakCadenceQuery.getFacts(profileId)` trả count + latest completed Long marker. | Production/reusable | Use case phải validate source và map facts; port không trả `isDue`. |
| SQLite query | CTE tìm latest completed Long; count completed Standard Focus với `resolved_at > marker`; profile `1`. | Production/reusable | Thêm edge/integration evidence; không đổi SQL nếu confirmation 09 chọn A. |
| Standard result loader | Đọc exact session/reward/profile trong transaction, reject inconsistent result. | Production/reusable | Không nhét cadence business rule vào loader hoặc terminal result projector. |
| Standard result controller | `idle/loading/ready/missing/error`, generation guard. | Production/reusable | Recommendation cần lifecycle riêng để lỗi cadence không che reward đã commit. |
| Result route branch | Refresh exact Result/Pet, request terminal feedback, render one production screen. | Production/reusable | Chỉ request recommendation sau exact completed Result; reset/stale guard khi ID/outcome đổi. |
| Standard Result screen | Completed hiển thị reward/progression và Home-only; failed/cancelled no Break. | Production/reusable | Compose recommendation panel cho completed only; preserve current branches. |
| Prototype Focus result | Có Short/Long selector và fake Start callback. | Prototype-only | Không import/reuse state/reducer/selector trong production. |
| Composition | `create-mobile-application.ts` đã `934` lines; Standard slice đã tách helper. | Production, growth risk | Tạo Break recommendation slice/helper thay vì tiếp tục nhồi root graph. |
| Device harness | Có accepted EPIC-06 fixtures/guides và validator allowlist. | Production tooling | Thêm isolated EPIC-07 cadence fixture/guide, không sửa normal owner DB trực tiếp. |

### 1.3. Critical vertical-slice finding: CTA chưa thể có production action thật

US-07-01 đưa recommendation và CTA “Bắt đầu nghỉ” vào completed Result nhưng `StartBreak`
transaction, commit-before-navigation và Break handoff thuộc US-07-02. Ba cách phải tránh:

1. Không để CTA enabled nhưng no-op hoặc chỉ đổi Presentation state.
2. Không điều hướng tới `/break/session` trước durable Break row; route đó hiện còn prototype.
3. Không kéo Start transaction vào Story 01 vì sẽ phá Story boundary và thiếu one-active/race evidence.

Plan đề xuất review visual/copy/callback contract của CTA bằng finite dev-only fixture trong Story 01,
nhưng production completed Result chỉ publish CTA khi US-07-02 cung cấp durable handler. Đây là
`US0701-CONFIRM-02`; acceptance/report của Story 01 phải nói rõ staging, không claim user đã Start được.

### 1.4. Read consistency finding

Existing cadence query là read-only port không nhận `TransactionScope`; exact Standard Result loader
lại dùng transaction cho session/reward/profile. Việc đổi query port thành transaction-scoped chỉ để
tạo atomic preview sẽ làm rộng persistence contract mà không loại được stale state trước lúc user tap.

Plan đề xuất:

```text
exact completed Result is ready
  → LoadNextBreakRecommendation(sourceSessionId)
      → read exact source session
      → reject unless completed Standard Focus
      → read current LongBreakCadenceFacts
      → validate facts
      → Domain decides Short 5 / Long 15
  → render advisory current recommendation

US-07-02 StartBreak
  → reads cadence again inside serialized Start command
  → committed type is authoritative if preview became stale
```

Recommendation read không write và không cần block reward Result. `US0701-CONFIRM-01/06` chốt policy
này trước implementation.

### 1.5. Scope traps phải tránh

1. Không persist cadence counter, `isLongBreakDue`, preview type hoặc Result-viewed state.
2. Không sửa migration `001`, cadence index hoặc generic session repository nếu tests không chứng minh
   một lỗi baseline độc lập.
3. Không đưa SQL/repository/query vào route, hook, controller hoặc component.
4. Không để Presentation tự so sánh count với `4` hoặc tự chọn duration.
5. Không trust `nextBreakKind` từ prototype, route params hoặc caller.
6. Không fallback Short khi source/query/facts invalid.
7. Không đọc “latest completed Focus” thay cho exact `sessionId` đang hiển thị.
8. Không thay reward/profile/Pet terminal behavior đã accepted ở EPIC-06.
9. Không thêm Start/cancel/running/notification/analytics logic của Story sau.
10. Không đổi failed/cancelled Result thành eligible và không thêm Focus Again trong Story này.

## 2. Product và Epic decisions đã khóa

- [x] Short Break là `5` phút; Long Break là `15` phút.
- [x] Count `0–3` chọn Short; `4+` chọn Long.
- [x] Count không clamp ở `4`; Long due vẫn due khi completed Focus mới được thêm.
- [x] Chỉ completed Standard Focus tăng count.
- [x] Trial, running, failed/cancelled Focus không tăng count.
- [x] Short Break và cancelled Long Break không reset cadence.
- [x] Chỉ latest completed Long Break reset marker.
- [x] Recommendation derive từ durable local history, hoạt động offline và qua relaunch.
- [x] Result/Home/retry/relaunch không tạo Break hay mutate durable facts.
- [x] Chỉ exact completed Standard Result eligible; failed/cancelled/trial không có Break entry.
- [x] Screen thể hiện type và duration bằng text, không chỉ màu/sprite/motion.
- [x] `StartBreak` re-validation/commit, Break running và navigation thuộc US-07-02.

## 3. Proposed technical directions

### TD-07-01-A — Domain owns the cadence decision

Tạo pure module dưới `packages/domain/src/break/`:

```ts
type BreakRecommendation =
  | { kind: 'short'; sessionType: 'short_break'; durationMinutes: 5 }
  | { kind: 'long'; sessionType: 'long_break'; durationMinutes: 15 };

type BreakCadenceDecision =
  | { ok: true; recommendation: BreakRecommendation }
  | { ok: false; reason: 'invalid_completed_standard_focus_count' };

decideNextBreakRecommendation(completedStandardFocusCount: number): BreakCadenceDecision
```

Rules:

- count phải là safe non-negative integer;
- `0,1,2,3` → exact frozen Short/5 projection;
- `4+` → exact frozen Long/15 projection;
- Domain không biết SQLite, profile, marker ID, source Result hoặc UI copy;
- constants được export một lần để StartBreak Story 02 reuse, không duplicate magic numbers.

### TD-07-01-B — Application validates exact source and cadence facts

Tạo `LoadNextBreakRecommendationUseCase` trong `packages/application/src/break/` với dependencies hẹp:

```text
sessions.findById(sourceSessionId)
longBreakCadence.getFacts(profileId = 1)
```

Typed outcome dự kiến:

```ts
type LoadNextBreakRecommendationOutcome = {
  outcome: 'ready';
  sourceSessionId: string;
  recommendation: BreakRecommendation;
  completedStandardFocusCountSinceLastCompletedLongBreak: number;
  latestCompletedLongBreakSessionId: string | null;
};
```

Typed failure codes:

- `BREAK_RECOMMENDATION_SOURCE_INELIGIBLE`: blank/missing/foreign/non-completed/non-Standard source;
- `BREAK_RECOMMENDATION_READ_FAILED`: repository/query technical failure;
- `BREAK_RECOMMENDATION_FACTS_INVALID`: profile/count/marker shape inconsistent.

Eligibility uses the exact durable session row: profile `1`, `focus/standard/completed`, valid Standard
identity/timestamps and resolved terminal facts. It does not re-project reward or mutate source. The
existing Result loader remains reward/result authority and is not coupled to Break types.

### TD-07-01-C — Existing SQLite query remains fact-only

`SQLiteLongBreakCadenceQuery` remains the Infrastructure owner of history filtering:

- latest marker: `long_break/completed` only;
- count: `focus/standard/completed` after marker;
- exclude trial, running, failed/cancelled, Short Break and cancelled Long;
- preserve current index `ix_sessions_long_break_cadence`;
- return count + marker, never `isDue`, type or duration.

No schema/index/query rewrite is planned. Integration tests extend the current mixed-history suite and
add exact `0/3/4/5+`, reopen, completed marker, cancelled marker and equal-timestamp policy coverage.

### TD-07-01-D — Break recommendation has an independent controller

Tạo `BreakRecommendationController` dưới mobile Application:

```ts
type BreakRecommendationProjection =
  | { status: 'idle' }
  | { status: 'loading'; sourceSessionId: string }
  | { status: 'ready'; sourceSessionId: string; recommendation: BreakRecommendation }
  | { status: 'error'; sourceSessionId: string; code: RecommendationErrorCode };
```

Controller responsibilities:

- exact source ID present in every non-idle projection;
- coalesce repeated in-flight refresh for the same source;
- generation guard drops stale response when source changes;
- `reset()` clears old recommendation for non-completed/missing Result;
- `dispose()` invalidates pending completion and listeners;
- controller never navigates, writes, decides cadence or silently supplies Short.

Recommendation error stays local to its panel. Existing committed reward Result and Home remain
usable, because failure to answer “nghỉ loại nào?” must not hide a completed Focus already persisted.

### TD-07-01-E — A dedicated composition slice owns wiring

Tạo `createBreakRecommendationSlice` dưới `apps/mobile/src/composition/break/`:

- receives `SessionRepository` and existing `LongBreakCadenceQuery`;
- builds use case + controller;
- returns narrow `{ recommendation, dispose }` surface;
- is exposed through `MobileApplicationFacade` as `breakRecommendation`;
- root `create-mobile-application.ts` only composes the helper and disposes it.

Không đưa recommendation vào `createStandardFocusSlice`: source là Standard Result nhưng capability
và future command owner là Break. Boundary này ngăn Standard controller phát triển thành một union của
mọi Epic sau Result.

### TD-07-01-F — Completed Result composes an independent panel

Tạo `BreakRecommendationPanel` dưới `presentation/features/break/` và compose trong
`StandardFocusResultScreen` only when `result.status === 'completed'`.

State contract:

| State | UI |
|---|---|
| `loading` | Inline accessible loading copy; committed reward/Pet/Home vẫn hiện. |
| `ready short` | `Nghỉ ngắn · 5 phút`, short supportive copy, staged Start action theo confirmation 02. |
| `ready long` | `Nghỉ dài · 15 phút`, long supportive copy, staged Start action theo confirmation 02. |
| `error` | Không đoán type; inline notice + `Thử đọc lại`; Home vẫn usable. |
| stale/mismatched ID | Không render recommendation cũ; treat as loading/idle. |

The route requests recommendation only after exact completed Result becomes ready. Failed/cancelled
results reset the controller and retain their existing one-action/no-reward UI. Result route never
passes count/type from URL.

### TD-07-01-G — Accessibility and copy are typed presentation concerns

- Type and minutes appear together in visible text and accessible label.
- Raw cadence count is not user-facing under the proposed copy policy.
- Loading announcement is polite and finite, never repeated per render/tick.
- Error/retry is understandable without technical terms such as query, SQLite, fixture or cadence.
- Primary/secondary hierarchy remains clear; Home stays reachable at largest text.
- Reduce Motion, grayscale, missing sprite and screen reader do not change recommendation meaning.
- Reused `PrimaryButton`, `SecondaryButton`, `Panel`, `InlineNotice`, `LoadingState` are changed only if
  cross-consumer evidence proves a gap.

### TD-07-01-H — Finite isolated review evidence

Add dev-only `EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE` scenarios:

- `break_cadence_count_0`;
- `break_cadence_count_3`;
- `break_cadence_count_4`;
- `break_cadence_due_sticky`;
- `break_cadence_completed_long_reset`;
- `break_cadence_cancelled_long_no_reset`;
- `break_cadence_read_failure_once`.

Fixtures must use an isolated database identity and production query/use-case/controller path. They may
seed valid records through controlled test composition, but cannot decorate the query with a hardcoded
recommendation, import prototype state or raw-delete the normal owner database. Failure injection is
one-shot and Retry returns to the real production path.

## 4. Target design

### 4.1. Ownership graph

```text
StandardFocusResultBranch
  ├─ existing StandardFocusResultController
  │    └─ existing LoadStandardFocusResultUseCase
  │         └─ transaction: exact session + reward receipt + profile
  └─ new BreakRecommendationController
       └─ new LoadNextBreakRecommendationUseCase
            ├─ SessionRepository.findById(exact source ID)
            ├─ LongBreakCadenceQuery.getFacts(profile 1)
            │    └─ existing SQLiteLongBreakCadenceQuery
            └─ Domain decideNextBreakRecommendation(count)

StandardFocusResultScreen
  ├─ existing committed result/reward/Pet/Home
  └─ new BreakRecommendationPanel(typed projection, callbacks only)
```

### 4.2. Exact cadence decision table

| Completed Standard count since marker | Latest completed Long | Recommendation |
|---:|---|---|
| `0` | none/exists | Short `5` |
| `1` | none/exists | Short `5` |
| `2` | none/exists | Short `5` |
| `3` | none/exists | Short `5` |
| `4` | none/exists | Long `15` |
| `5+` | none/exists | Long `15`, still due |
| negative/fraction/unsafe | any | typed invalid decision; no UI fallback |

The marker does not change the threshold in Domain. It only establishes which completed Standard rows
the Infrastructure count includes.

### 4.3. Exact source eligibility

A source is eligible only when all are true:

1. requested ID is a non-empty exact match;
2. row exists and `profileId === 1`;
3. `sessionType === 'focus'` and `focusVariant === 'standard'`;
4. `status === 'completed'`;
5. Standard configuration/timestamps/terminal shape are internally valid;
6. current Result branch is already ready for the same exact ID.

Trial, running, failed, cancelled, Break, malformed and missing records return typed ineligible/error;
none may be substituted by latest history.

### 4.4. Result/recommendation state matrix

| Standard Result | Recommendation | Rendered behavior |
|---|---|---|
| loading/missing/error | any | Existing full Result loading/error; recommendation not shown/reset. |
| failed/cancelled ready | any | Existing neutral Result; no recommendation/Start entry. |
| completed ready | idle/loading | Reward/Pet/Home plus inline recommendation loading. |
| completed ready | matching ready | Reward/Pet/Home plus Short/Long panel. |
| completed ready | matching error | Reward/Pet/Home plus inline retry; no type/default Start. |
| completed ready | ready for old ID | Old data hidden; current source refresh begins. |

### 4.5. Navigation and mutation matrix

| Action | Navigation | Durable write |
|---|---|---|
| Open/reopen completed Result | none | none |
| Refresh/retry recommendation | none | none |
| Background/foreground/relaunch | existing Result route only | none from recommendation |
| Tap Home | replace Home | none; cadence unchanged |
| Tap staged Start in Story 01 review | review-only callback/evidence per approval | none |
| Production Start after US-07-02 | `/break/session` only after commit | owned by `StartBreak`, not this plan |

### 4.6. Error mapping

| Application failure | User surface | Recovery |
|---|---|---|
| source ineligible/missing | “Chưa thể đề xuất phiên nghỉ cho kết quả này.” | Home; Retry only if transient route hydration can recover. |
| repository/query read failed | “Chưa đọc được nhịp nghỉ đã lưu.” | Retry/Home. |
| corrupt/invalid cadence facts | Same finite safe copy; diagnostic code retained internally. | Retry/Home; no Short fallback. |
| stale response/disposed branch | no visible error | Ignore; current generation owns UI. |

No error in this table may enter critical bootstrap recovery, revoke reward, replay Pet feedback or
write analytics/notification.

## 5. Scope khóa cho implementation

### 5.1. In scope

- Pure cadence decision and constants in Domain.
- Exact-source recommendation use case in Application.
- Existing cadence query reuse and additional SQLite/integration evidence.
- Independent mobile controller, hook, facade and composition slice.
- Completed-only Result panel with loading/ready/error/retry and accessible type/duration.
- Story-safe CTA staging according to owner confirmation.
- Isolated finite review fixture and per-Story manual device guide.
- Regression coverage for EPIC-06 Standard result/reward/Pet, Trial and derived queries.
- Implementation report/exact SHA/manual evidence handoff after code is actually implemented.

### 5.2. Out of scope

- Any Break session insert/update; `StartBreak` and one-active transaction.
- `/break/session` production routing/handoff, countdown, completion, cancel or Result.
- Pet `breaking` transition.
- Break local notification or analytics events.
- Settings Short/Long selector or configurable duration.
- Schema/index/migration, persisted counter/due flag or source-Focus relation.
- Changes to reward/profile, Standard lifecycle, terminal feedback or existing Focus notification.
- Prototype reducer/provider as production fallback.
- EPIC-08→12 scope, `OPEN-006`, `OPEN-009` or new Product behavior.

## 6. Authoritative execution plan

### T00 — Record approval and implementation baseline

- Record owner choices for confirmation 01→09 in this document.
- Update `EPIC-07_USER_STORIES.md` confirmation 02 when confirmation 01 resolves it.
- Recheck branch/upstream/status and overlapping edits.
- Record `implementation_start_sha`; stop if baseline production code changed after this audit.

### T01 — Lock Domain contract with tests first

- Add count validation and threshold table tests for `0,1,2,3,4,5` and large safe count.
- Add negative/fraction/NaN/infinite/unsafe integer tests.
- Add exact Short/Long type/duration assertions.
- Implement/export pure decision only after failing tests are reviewed.

### T02 — Lock Application source/recommendation contract

- Add exact eligible completed Standard fixture.
- Add blank/missing/foreign/profile/trial/running/failed/cancelled/Break cases.
- Add cadence query failure, session read failure and invalid fact shape cases.
- Assert no repository write methods, reward/profile port or clock dependency exists.
- Implement typed `LoadNextBreakRecommendationUseCase` and exports.

### T03 — Extend real SQLite cadence evidence

- Reuse current test database harness.
- Cover no marker counts `0/3/4/5+`.
- Cover completed Long reset, cancelled Long no reset, Short no reset and additional Focus sticky due.
- Cover close/reopen and exact source eligibility.
- Cover equal timestamp semantics approved in confirmation 09.
- Assert query plan continues to use cadence index and migration checksum is unchanged.

### T04 — Implement controller lifecycle

- Add idle/loading/ready/error exact-ID projections.
- Coalesce same-ID in-flight refresh.
- Drop stale different-ID response and disposed callback.
- Reset on ineligible Result/outcome change.
- Retry from current exact source; never remember recommendation as durable state.

### T05 — Add Break recommendation composition slice

- Build use case/controller from existing persistence graph.
- Expose narrow facade surface and provider hook.
- Wire dispose and root graph test.
- Keep root composition change minimal; no Break Start placeholder service.

### T06 — Build recommendation panel and Result integration

- Add independent loading/ready/error states.
- Render exact Vietnamese type/duration/copy approved in confirmations.
- Stage CTA per confirmation 02; Home remains existing action.
- Request only after matching completed Result; reset for failed/cancelled/missing/error.
- Preserve reward/progression/Pet terminal feedback and review reload behavior.

### T07 — Add finite isolated review fixtures

- Add approved scenario names to validation allowlist.
- Select dedicated dev-only database identity before database composition.
- Seed valid histories without touching the normal database.
- Inject read failure once, then return to production query on Retry.
- Provide deterministic reset/cleanup and no production-build fixture access.

### T08 — Add vertical integration/regression coverage

- Full completed Standard Result → current durable recommendation.
- Home/reopen/relaunch/retry produce no writes and preserve due.
- Failed/cancelled/trial exact source produces no Break panel/CTA.
- Recommendation failure does not hide reward or break Home.
- Stale controller response cannot cross session IDs.
- Existing Standard Result, Pet outcome, Trial and derived-query tests remain green.

### T09 — Create executable manual guide

- Add `apps/mobile/test/device/break-cadence-result-smoke.md`.
- Include exact SHA/build/device/OS/fixture/reset metadata.
- Include count 0/3/4/sticky/reset/error/offline/relaunch/no-write/a11y scenarios.
- Mark notification and cancel/completion mutation cases `NOT_APPLICABLE` for Story 01.
- Keep owner quick smoke and formal tester evidence separate.

### T10 — Full verification and handoff

- Run focused tests, root quality, repository/boundary/device guide checks and iOS/Android JS exports.
- Review production imports for prototype leakage and UI files for line budget.
- Create implementation report with exact before/after facts and known limitations.
- Commit candidate, record exact SHA, request owner UI review; do not open US-07-02 before acceptance.

## 7. Planned file impact

Exact filenames may move one directory within the approved layer, but ownership and dependency
direction cannot change without updating this plan.

### 7.1. Files dự kiến tạo

| File | Purpose | Target size |
|---|---|---:|
| `packages/domain/src/break/next-break-recommendation.ts` | Pure threshold/type/duration decision. | ≤100 |
| `packages/domain/src/break/next-break-recommendation.test.ts` | Decision/invalid table. | ≤150 |
| `packages/application/src/break/load-next-break-recommendation.use-case.ts` | Exact source + cadence orchestration. | ≤180 |
| `packages/application/src/break/load-next-break-recommendation.use-case.test.ts` | Eligibility/error/no-write matrix. | ≤260 |
| `apps/mobile/src/application/break/break-recommendation.controller.ts` | Async exact-ID UI projection. | ≤180 |
| `apps/mobile/src/application/break/break-recommendation.controller.test.ts` | Coalescing/stale/reset/dispose/retry. | ≤240 |
| `apps/mobile/src/application/break/index.ts` | Mobile Application public exports. | ≤60 |
| `apps/mobile/src/composition/break/create-break-recommendation-slice.ts` | Focused composition/disposal. | ≤150 |
| `apps/mobile/src/composition/break/create-break-recommendation-slice.test.ts` | Wiring/reuse/no-write contract. | ≤180 |
| `apps/mobile/src/presentation/providers/break-hooks.ts` | Narrow projection/actions hooks. | ≤80 |
| `apps/mobile/src/presentation/features/break/break-recommendation-panel.tsx` | Typed accessible Result panel. | ≤180 |
| `apps/mobile/src/presentation/features/break/break-recommendation-panel.test.tsx` | State/copy/action/accessibility tests. | ≤220 |
| `apps/mobile/src/composition/review/break-cadence-review-fixture.ts` | Dev-only isolated scenario setup. | ≤240 |
| `apps/mobile/src/composition/review/break-cadence-review-fixture.test.ts` | Fixture isolation/reset/failure tests. | ≤240 |
| `apps/mobile/test/integration/break-cadence-result.integration.test.ts` | SQLite vertical journey/no-write evidence. | ≤300 |
| `apps/mobile/test/device/break-cadence-result-smoke.md` | Executable owner/formal guide. | ≤220 |
| `docs/planning/US-07-01_IMPLEMENTATION_REPORT.md` | Implementation/evidence/limitation report after work. | evidence-sized |

### 7.2. Files dự kiến cập nhật

| File | Planned change | Regression owner |
|---|---|---|
| `packages/domain/src/index.ts` | Export cadence decision/types/constants. | Domain package exports. |
| `packages/application/src/index.ts` | Export recommendation use case/types. | Application package exports. |
| `apps/mobile/src/application/index.ts` | Export Break controller types. | Mobile application boundaries. |
| `apps/mobile/src/application/mobile-application.facade.ts` | Add narrow `breakRecommendation`. | Facade/typecheck. |
| `apps/mobile/src/composition/create-mobile-application.ts` | Compose/dispose Break recommendation slice and fixture input. | Root graph/bootstrap/dispose. |
| `apps/mobile/src/composition/create-mobile-application.test.ts` | Assert surface exists/disposes without side effects. | Composition. |
| `apps/mobile/src/app/focus/standard-focus-result-branch.tsx` | Refresh/reset matching recommendation; retry action. | Exact Result/Pet lifecycle. |
| `apps/mobile/src/presentation/features/focus/standard-focus-result-screen.tsx` | Compose panel for completed only. | Completed/failed/cancelled UI. |
| `apps/mobile/src/presentation/features/focus/standard-focus-result-screen.test.tsx` | Preserve reward/Home/no-CTA branches and add panel composition. | Standard Result. |
| `apps/mobile/src/infrastructure/database/queries/sqlite-derived-queries.ts` | Expected test-only/no change; modify only if approved equal-time policy requires it. | All derived queries/indexes. |
| `apps/mobile/test/integration/derived-queries.integration.test.ts` | Extend cadence history/tie/reopen assertions. | Persistence query. |
| `apps/mobile/test/device/validate-device-harness.mjs` | Register new guide/fixture names/required sections. | Device evidence validator. |
| `docs/planning/EPIC-07_USER_STORIES.md` | Record approved confirmation/state only after owner response. | Epic planning consistency. |

### 7.3. Files/khu vực không được chạm

- Existing migration SQL/checksum and schema tables/indexes/triggers.
- Reward/profile transaction and Standard completion/cancel/reconcile business logic.
- Focus notification/analytics SDK adapters or event taxonomy.
- Production `/break/session` route and prototype Break running/result behavior.
- Pet state machine/assets/animation ownership.
- Settings/history/shop/feedback and EPIC-08→12 modules.
- Generated native projects, lockfile or package dependencies.

## 8. Acceptance-to-evidence matrix

| Acceptance | Primary automated evidence | Manual evidence |
|---|---|---|
| Count `0–3` → Short 5; `4+` → Long 15 | Domain table + SQLite integration | fixtures count 0/3/4/sticky |
| Only completed Standard counts | SQLite mixed history | failed/cancelled/trial fixture checks |
| Completed Long reset; cancelled Long does not | query/integration reopen tests | reset/no-reset scenarios |
| Due survives Home/relaunch/additional Focus | SQLite reopen + branch lifecycle tests | Home/relaunch walkthrough |
| Exact completed source only | Application eligibility matrix | failed/cancelled/trial Result |
| No mutation/auto-start | write-spy + DB fingerprint before/after | session row count before/after |
| Read/corrupt failure has Retry/Home, no Short fallback | use case/controller/screen error tests | one-shot failure fixture |
| Type/duration accessible text | component semantic tests | VoiceOver/TalkBack/large text |
| EPIC-06 result/reward/Pet unchanged | Standard integration/regression suite | completed/failed/cancelled smoke |

## 9. Automated test strategy

### 9.1. Domain

- Boundary table `0..5`, a large safe integer and exact frozen output.
- Invalid negative, fraction, `NaN`, infinity and unsafe integer.
- Tests assert no dependency on marker, profile, clock, repository or presentation labels.

### 9.2. Application

- Exact completed Standard source succeeds with matching `sourceSessionId`.
- Blank/missing/mismatched ID, wrong profile/type/variant/status and malformed timestamps fail closed.
- Query/read technical errors map deterministically.
- Profile mismatch, invalid count and malformed marker facts return facts-invalid.
- No write/reward/profile/clock dependency exists; repeat call is pure relative to current facts.

### 9.3. Infrastructure and real SQLite

- No marker counts all completed Standard history only.
- Latest completed Long marker excludes earlier Focus and resets next recommendation.
- Cancelled Long and Short do not become marker.
- Additional Focus after due increments count without changing Long decision.
- Close/reopen returns same facts.
- Equal `resolvedAt` case follows confirmation 09.
- Query plan/index assertion and migration immutability stay green.

### 9.4. Controller/composition

- Idle→loading→ready and error→loading→ready Retry.
- Same source concurrent refresh performs one in-flight use-case call.
- Different source supersedes old generation; old response cannot publish.
- Reset/dispose blocks late callbacks.
- Facade and hook expose no repository or mutable cadence state.
- Root dispose includes new slice and bootstrap remains ready if recommendation read later fails.

### 9.5. Presentation/route

- Completed Result preserves reward/progression/Pet and renders correct matching panel.
- Failed/cancelled preserve existing copy, no recommendation/CTA.
- Loading/error panel does not hide Home or reward.
- Stale recommendation ID is never shown for a different Result.
- Retry calls controller with exact route/session ID.
- CTA staging follows approved contract and never navigates/writes in Story 01.
- Type/duration/action discoverable by text/semantics; no color-only meaning.

### 9.6. Regression/static

- Existing Standard completion/result/outcome/Pet/notification tests.
- Existing Trial Result and derived-query tests.
- No import from prototype state/provider into new Domain/Application/production branch.
- UI/component line budget and dependency-direction validator.
- No schema/package/native/generated file delta.

## 10. Manual UI/device guide plan

### 10.1. Evidence header

Record exact implementation SHA, app/build profile, scenario, isolated database name, platform,
device/simulator, OS, date/time/timezone, online/offline, font size, Reduce Motion and screen reader.
Owner quick smoke and formal tester results stay separate.

### 10.2. Safe setup/reset

1. Verify no active session in normal app and record normal session count only; do not delete it.
2. Start Development Build with one approved EPIC-07 fixture.
3. Confirm the screen identifies dev review mode without exposing technical copy in user-facing panel.
4. Fixture must use its isolated database; capture before/after fingerprint.
5. Change scenario only after closing prior isolated fixture and using its documented cleanup.

### 10.3. Scenario A — Short before threshold

1. Open exact completed Result with count `0`; expect `Nghỉ ngắn · 5 phút`.
2. Repeat count `3`; expect Short `5`, not Long.
3. Tap Home, reopen/relaunch same Result; expect same current recommendation.
4. Confirm no Short/Long Break row was created and cadence facts did not change from viewing.

### 10.4. Scenario B — Long due and sticky

1. Open count `4`; expect `Nghỉ dài · 15 phút`.
2. Tap Home and relaunch; expect Long remains due.
3. Add another valid completed Standard Focus through fixture; expect count increases and Long stays due.
4. Confirm repeated refresh/reopen creates no Break and no reward/profile/session mutation.

### 10.5. Scenario C — Reset/exclusion

1. Complete/seed a valid Long marker; expect next current recommendation returns Short.
2. Use cancelled Long; expect Long remains due.
3. Add Short, trial, failed and cancelled Focus records; expect none changes the relevant count.
4. Open failed/cancelled/trial Result; expect no Break recommendation/Start entry.

### 10.6. Scenario D — Failure and Retry

1. Enable one-shot cadence read failure.
2. Expect committed reward/Pet/Home remain visible; no default Short or Start.
3. Tap Retry once; expect real current recommendation from production query.
4. Background/foreground during pending read; expect no stale duplicate/error loop.

### 10.7. Robustness and accessibility

- Airplane mode: all scenarios work because truth is local.
- Background/relaunch: no auto-start/write; recommendation reloads current facts.
- Notification allowed/denied/stale/repeated tap: `NOT_APPLICABLE` to mutation in Story 01; no case may
  create a Break or change recommendation facts.
- Cancel/completion race: `NOT_APPLICABLE` before Break exists; only committed terminal history affects
  future query results.
- VoiceOver/TalkBack: type, minutes, loading/error, Retry/Home and staged action state are clear.
- Largest text: reward and panel copy wrap; Retry/Home/action remain reachable without horizontal scroll.
- Reduce Motion/grayscale/missing Pet animation: recommendation meaning remains textual.
- Rapid Retry/Home/reopen: no stale recommendation from a previous exact Result.

### 10.8. Cleanup and evidence record

1. Unset EPIC-07 fixture and close/remove only the explicitly named disposable fixture database through
   its supported cleanup.
2. Relaunch normal app and verify normal data/session count is unchanged.
3. Record each case `PASS/FAIL/NOT_RUN/DEFERRED`; never infer device PASS from unit/integration tests.
4. Attach screenshots/video and before/after durable facts to implementation report.

## 11. Verification commands dự kiến

Focused contract tests:

```bash
pnpm exec vitest run \
  packages/domain/src/break/next-break-recommendation.test.ts \
  packages/application/src/break/load-next-break-recommendation.use-case.test.ts \
  apps/mobile/src/application/break/break-recommendation.controller.test.ts \
  apps/mobile/src/composition/break/create-break-recommendation-slice.test.ts \
  apps/mobile/src/presentation/features/break/break-recommendation-panel.test.tsx \
  apps/mobile/test/integration/break-cadence-result.integration.test.ts
```

Focused regression:

```bash
pnpm exec vitest run \
  apps/mobile/test/integration/derived-queries.integration.test.ts \
  apps/mobile/test/integration/standard-focus-completion.integration.test.ts \
  apps/mobile/src/application/standard-focus/standard-focus-result.controller.test.ts \
  apps/mobile/src/presentation/features/focus/standard-focus-result-screen.test.tsx
```

Full gates:

```bash
pnpm quality
pnpm mobile:doctor
pnpm --filter @pixeldoro/mobile exec expo export --platform ios --output-dir /tmp/pixeldoro-us0701-ios
pnpm --filter @pixeldoro/mobile exec expo export --platform android --output-dir /tmp/pixeldoro-us0701-android
git diff --check
git status --short
```

No command result is marked PASS in this plan until it is actually run against the implementation
candidate. Native build is not required because Story 01 adds no dependency/plugin/native config;
manual iOS/Android evidence uses the compatible Development Build and remains factually labeled.

## 12. Risks, stop conditions and rollback

### 12.1. Risks and mitigations

| Risk | Control |
|---|---|
| Screen computes or stores cadence | Domain decision + fact-only query + static import test. |
| Preview becomes stale before Start | Label as current recommendation; US-07-02 re-reads in serialized command. |
| Recommendation failure hides earned reward | Separate controller/panel; Result/Home remain available. |
| Old Result/session substituted | Exact ID in use case/controller/projection; no latest fallback. |
| Prototype selector leaks authority | Production import test; new fixture uses durable history. |
| CTA is deceptive before Start exists | Confirmation 02 staging gate; no enabled production no-op. |
| Root composition grows further | New focused slice; line impact budget. |
| Fixture damages owner data | Dedicated database identity, explicit cleanup, no raw normal DB deletion. |
| Timestamp tie changes cadence unexpectedly | Explicit confirmation 09 and integration test. |

### 12.2. Mandatory stop conditions

Stop implementation and return to owner/architecture review if:

- a requested option requires persisting counter/due/source relation or modifying migration `001`;
- current branch production code changed after recorded start SHA in overlapping modules;
- exact completed Result cannot be validated without widening reward/session authority;
- existing query contradicts locked count/reset behavior on real SQLite;
- fixture cannot isolate owner data safely;
- CTA must navigate/start before a durable StartBreak contract exists;
- a common component fix affects Trial/Standard behavior beyond scoped regression budget;
- any Product `OPEN` or EPIC-08→12 behavior becomes necessary.

### 12.3. Rollback/revert strategy

- New Domain/Application/controller/slice/panel modules are additive and can be reverted as one Story.
- Result branch/screen changes must be independently revertible to accepted EPIC-06 Home-only behavior.
- No migration/data rollback is needed because Story 01 performs no schema/data write.
- Isolated fixture database can be removed by exact fixture identity; normal database is never targeted.
- If recommendation fails after release, safe degraded behavior is committed Result + Home, not guessed Short.

## 13. Definition of Ready cho implementation

- [x] EPIC-06 accepted baseline and current branch/HEAD are recorded.
- [x] Source-of-truth/current code/schema/query/component inventory is complete.
- [x] No schema/dependency/native change is proposed.
- [x] Target ownership, files, task order, tests, manual evidence and rollback are planned.
- [x] Owner approves confirmations 01→09.
- [x] Plan was updated to version `0.2.0` with exact selected options before coding.
- [x] Implementation start SHA and clean/known-overlap status are recorded.

## 14. Definition of Done cho US-07-01

- [x] Domain threshold/invalid decision passes focused tests.
- [x] Application exact-source query returns typed current Short/Long recommendation and fails closed.
- [x] Existing SQLite query passes mixed-history/reset/sticky/reopen/tie policy evidence.
- [x] Completed Standard Result shows accessible recommendation; failed/cancelled/trial do not.
- [x] Loading/error/retry cannot hide reward or block Home; no fallback Short.
- [x] Result render/retry/Home/relaunch creates no Break or other durable mutation.
- [x] CTA staging exactly matches owner confirmation and makes no false Start claim.
- [x] Prototype state/query selector is absent from production recommendation path.
- [x] Full quality/exports/static/repository gates pass at the worktree candidate; Expo Doctor baseline warnings are recorded in the report.
- [x] Manual guide/report records actual owner/formal evidence without upgrading `NOT_RUN`.
- [x] Exact committed implementation SHA is recorded and owner accepts Story output.
- [x] US-07-02 implementation planning/Start contract may become active.

## 15. Owner confirmation gate — APPROVED

### US0701-CONFIRM-01 — Recommendation versus Start authority

- **Option A — đề xuất:** Result previews current cadence; US-07-02 re-reads inside serialized
  `StartBreak`, and actual committed type wins if facts changed.
- **Option B:** snapshot type on Result load and force Start to use it; requires durable snapshot semantics.
- **Option C:** Start trusts UI type; violates business-rule ownership and is not recommended.
- **Impact:** resolves EPIC-level `US0700-CONFIRM-02`; blocks Domain/Application contract.
- [x] Owner selected option: A — 2026-09-08.

### US0701-CONFIRM-02 — CTA staging before US-07-02

- **Option A — đề xuất:** Story 01 reviews CTA contract in dev fixture/tests; production completed Result
  exposes recommendation + Home, then enables real CTA atomically when US-07-02 durable Start lands.
- **Option B:** show disabled production CTA in Story 01; more visible but ships an intentionally unavailable action.
- **Option C:** expand Story 01 to Start; breaks approved Story boundary and is not recommended.
- **Impact:** blocks Result UI/acceptance wording.
- [x] Owner selected option: A — 2026-09-08.

### US0701-CONFIRM-03 — Result loading composition

- **Option A — đề xuất:** committed reward/Pet/Home render immediately; recommendation loads/errors in
  an independent inline panel.
- **Option B:** block the whole Result until cadence read finishes; simpler state but hides committed output.
- **Impact:** blocks controller/screen composition.
- [x] Owner selected option: A — 2026-09-08.

### US0701-CONFIRM-04 — Recommendation failure behavior

- **Option A — đề xuất:** inline finite error + Retry/Home; no type and no Start fallback.
- **Option B:** silently show Short; simpler but can violate durable cadence.
- **Option C:** full-screen error; safe but unnecessarily hides committed reward.
- **Impact:** blocks error projection/copy.
- [x] Owner selected option: A — 2026-09-08.

### US0701-CONFIRM-05 — User-facing cadence copy

- **Option A — đề xuất:** show only `Nghỉ ngắn · 5 phút` or `Nghỉ dài · 15 phút`; do not expose raw count.
- **Option B:** also show “X/4 phiên”; more explanatory but becomes stale/noisy once due is sticky above four.
- **Impact:** blocks exact panel copy/snapshots.
- [x] Owner selected option: A — 2026-09-08.

### US0701-CONFIRM-06 — Read consistency/port shape

- **Option A — đề xuất:** separate exact source read + existing fact query; preview may change, Start rechecks.
- **Option B:** widen cadence query to transaction scope for an atomic preview; broader persistence change,
  still cannot keep preview current until tap.
- **Impact:** blocks use-case dependencies and planned file impact.
- [x] Owner selected option: A — 2026-09-08.

### US0701-CONFIRM-07 — Component ownership

- **Option A — đề xuất:** dedicated Break recommendation controller/slice/panel, composed by Standard Result.
- **Option B:** extend Standard Result loader/controller with Break union state; fewer files but couples bounded contexts.
- **Impact:** blocks module layout/facade surface.
- [x] Owner selected option: A — 2026-09-08.

### US0701-CONFIRM-08 — Review fixture isolation

- **Option A — đề xuất:** new EPIC-07 fixture variable + dedicated disposable database; production query/path required.
- **Option B:** hardcode query responses in fixture; faster but does not prove durable cadence.
- **Option C:** seed normal app database; highest owner-data risk and not recommended.
- **Impact:** blocks manual/device evidence design only.
- [x] Owner selected option: A — 2026-09-08.

### US0701-CONFIRM-09 — Equal terminal timestamp edge

- **Option A — đề xuất:** a completed Focus counts only when `resolvedAt >` completed Long marker;
  equal millisecond does not count, matching current query and conservative reset semantics.
- **Option B:** tie-break by session ID; deterministic but assigns temporal meaning to generated IDs.
- **Option C:** count equal timestamps; can count a Focus not provably after the reset marker.
- **Impact:** blocks exact SQLite boundary test; no SQL change under A.
- [x] Owner selected option: A — 2026-09-08.

### 15.1. Approval checklist

- [x] Owner selected Option A for confirmations 01→09 on 2026-09-08.
- [x] No non-A choice requires scope/design reconciliation.
- [x] EPIC-level confirmation 02 and this plan version/status are updated from explicit owner input.
- [x] No material US-07-01 confirmation remains pending before production code.

## 16. References

- [EPIC-07 User Stories](./EPIC-07_USER_STORIES.md)
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
- [EPIC-06 Exit Report](./EPIC-06_EXIT_REPORT.md)

## 17. Change log và planning validation

| Version | Date | Author | Change |
|---|---|---|---|
| 0.4.0 | 2026-09-09 | Codex | Recorded exact committed/pushed implementation SHA and owner-reported quick UI smoke: no crash, behavior as expected; accepted Story output to open US-07-02 planning while formal and structured accessibility/device evidence remain NOT_RUN. |
| 0.3.0 | 2026-09-08 | Codex | Recorded completed worktree implementation and automated/full-quality/platform-export evidence; owner/manual/formal review and exact committed SHA remain pending. |
| 0.2.0 | 2026-09-08 | Codex | Recorded owner approval of Option A for confirmations 01–09, resolved EPIC-level cadence-lock timing, and captured implementation start SHA before production edits. |
| 0.1.0 | 2026-09-08 | Codex | Created owner-gated US-07-01 plan from current EPIC-07 baseline; detailed pure cadence policy, exact-source recommendation, independent Result panel/controller, no-schema/read-only boundaries, tests, fixtures, manual guide and nine pending confirmations. No production code changed. |

Validation required for this planning turn:

- [x] `git diff --check` returns no whitespace error for the new plan.
- [x] All relative Markdown references resolve.
- [x] Confirmation IDs are continuous `01`→`09` and record owner-approved Option A.
- [x] No production/schema/dependency/native/generated file was changed.
- [x] No automated/manual/formal evidence is falsely marked PASS.

**US-07-01 is committed at `a3b92fd8a6908f4efecea7fc7c8d49ac20683aa3`, automated evidence passed,
and owner quick UI smoke was accepted to open US-07-02 planning. Formal and structured
device/accessibility evidence remain `NOT_RUN`.**
