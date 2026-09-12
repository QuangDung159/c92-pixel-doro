---
document_id: PIXELDORO_US_09_03_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-09-03 Implementation Plan
version: 0.3.0
status: IMPLEMENTED_AWAITING_OWNER_ACCEPTANCE
implementation_status: CANDIDATE_READY_FOR_OWNER_UI_SMOKE
date: 2026-09-12
last_updated: 2026-09-12
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-09
planning_baseline_sha: 91d0612975c9532d0d860be7dcd9995584cde96b
implementation_start_sha: 91d0612975c9532d0d860be7dcd9995584cde96b
current_candidate_base_sha: 91d0612975c9532d0d860be7dcd9995584cde96b
exact_implementation_sha: null
candidate_identity: UNCOMMITTED_WORKTREE_ON_CURRENT_CANDIDATE_BASE
previous_story: US-09-02
previous_story_status: DONE_OWNER_ACCEPTED
previous_story_accepted_sha: 91d0612975c9532d0d860be7dcd9995584cde96b
manual_device_status: NOT_RUN
formal_tester_status: NOT_RUN
schema_change: NONE
dependency_change: NONE
native_change: NONE
analytics_change: NONE_IN_THIS_STORY
product_decision: OPEN_006_RESOLVED_OPTION_A
automated_status: PASS_200_FILES_1038_TESTS
next_gate: OWNER_QUICK_UI_SMOKE_AND_ACCEPT_EXACT_COMMITTED_SHA
scope:
  - mobile_mvp
  - epic_09
  - us_09_03
  - rolling_daily_contribution
  - zero_fill
  - semantic_intensity
  - neutral_text_first_panel
  - read_only
authority: OWNER_APPROVED_IMPLEMENTATION_PLAN
story_baseline: ./EPIC-09_USER_STORIES.md
previous_story_plan: ./US-09-02_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-09-02_IMPLEMENTATION_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
data_model_baseline: ../architecture/data-model.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-09-03 — Stable Daily Contribution Projection

## 0. Outcome và gate

Plan này mở Story kế tiếp sau khi owner accepted US-09-02 tại exact SHA `91d0612...`. Owner đã duyệt
`US0903-CONFIRM-01→06 Option A` ngày 2026-09-12 và cấp quyền coding US-09-03; approval không cấp
quyền commit hoặc push.

**User outcome:** History có một contribution panel trung tính, text-first cho đủ các local day trong
range đã duyệt. Mỗi ngày hiển thị đúng completed Standard Focus minutes/count, gồm ngày `0`, và có
semantic intensity ổn định để US-09-04 áp dụng final visual.

**Priority/order:** `P0 / 3` trong EPIC-09.

**Blocks:** US-09-04 production contribution graph/accessibility. Owner đã resolve `OPEN-006` bằng
CONFIRM-03/04; Story 03 giữ neutral text-first UI, final palette/contrast application thuộc Story 04.

### 0.1. Baseline audit

| Fact | Kết quả |
|---|---|
| Repository/branch | `/Users/dunglu/Documents/Working/c92-pixel-doro` / `feats/epic-09` |
| Planning HEAD | `91d0612975c9532d0d860be7dcd9995584cde96b` |
| Origin alignment | Local và `origin/feats/epic-09` cùng SHA tại audit |
| Worktree trước doc update | Clean |
| US-09-02 | `DONE_OWNER_ACCEPTED`; quick UI PASS, no crash, expected behavior |
| Existing contribution query | Read-only sparse aggregate, date ASC, completed Standard Focus only |
| Existing facts | `scheduledEndLocalDate`, completed configured minutes và completed count |
| Existing index | `ix_sessions_local_day`; real-SQLite query-plan evidence đã có |
| Missing | Range owner, zero-fill, semantic bands, use case/controller, production panel/fixtures |
| Product gate tại planning audit | `OPEN-006` thresholds/colors còn `OPEN`; sau đó đã resolved bằng owner-approved CONFIRM-03/04 |

## 1. Authority và scope

### 1.1. Locked/inherited truth

- Mỗi day dùng immutable `scheduled_end_local_date`; không regroup stored session theo timezone hiện tại.
- Chỉ `completed` Standard Focus đóng góp configured duration và completed session count.
- Failed, cancelled, running, onboarding trial và mọi Break đóng góp `0` và không xuất hiện trong sparse
  contribution query.
- Contribution là derived read; không persist range, zero days, total, count, band, color hoặc “today”.
- Query/render/Retry không ghi session, reward, profile, setting hoặc analytics.
- UI phải meaningful bằng numeric/text khi không có màu, grayscale, Reduce Motion hoặc screen reader.
- Deep weekly/monthly analytics, calendar navigation và cloud history vẫn deferred.

### 1.2. In scope

1. Khóa rolling range, current-local-day anchor và civil-date arithmetic.
2. Tạo pure Application projection: exact range, sparse validation, zero-fill, safe totals/counts và
   semantic intensity.
3. Tạo read-only use case dùng existing `ContributionQuery`, injected clock và local calendar.
4. Tạo independent contribution controller với initial/refresh/stale/error/Retry generations.
5. Wire controller qua History composition/facade/provider/route mà không trộn cursor/list state.
6. Thêm neutral text-first contribution panel vào cùng History `SectionList` scroll owner.
7. Thêm isolated fixtures, pure/controller/SQLite/component/static coverage và device smoke guide.
8. Core Truth đã được update với exact thresholds/palette từ approved `OPEN-006`; Story 03 vẫn chỉ
   render neutral panel, Story 04 mới áp final color graph.

### 1.3. Out of scope

- Final colored contribution graph, color contrast/grayscale certification và final legend polish.
- Week/month paging, date picker, custom range, streak, tooltip, tap detail, share/export.
- Analytics event, provider, network, account/sync hoặc cloud history.
- History row/group/pagination semantics đã accepted; no cursor or SQL history changes.
- Schema/migration/index/trigger, package/lockfile, native/prebuild, permission hoặc remote asset changes.
- Persist aggregate/band/color/current date trong SQLite hoặc Zustand authority.

### 1.4. Scope traps

1. Không dùng `Date.now()`/`new Date()` trực tiếp trong Domain hoặc Presentation.
2. Không trừ `6 * 24h` để tạo civil dates vì DST; date range phải dùng calendar-date arithmetic.
3. Không coi sparse query empty là feature empty; output vẫn có đủ zero days.
4. Không cộng failed/cancelled/trial/Break hoặc elapsed/overtime/reward minutes.
5. Không dùng query order như implicit trust; duplicate/out-of-range/unsorted facts phải fail closed.
6. Không dùng màu prototype hoặc qualitative copy làm meaning duy nhất.
7. Không để contribution read failure clear/block accepted History rows.
8. Không tạo nested ScrollView/list hoặc horizontal graph overflow ở Story 03.
9. Không update Core Truth `OPEN-006` nếu owner chưa approve confirmations tương ứng.

## 2. Capability inventory và gap

| Capability | Baseline | Story-03 gap |
|---|---|---|
| SQLite query | Sparse positive days, inclusive range, date ASC, correct exclusions | Không đổi SQL; cần larger boundary/reopen/fingerprint evidence |
| Persistence mapper | Canonical real date, positive safe minutes/count | Application cần range/order/duplicate/coherence validation |
| Clock/calendar | `ClockPort` + `LocalCalendarPort.snapshot(atMs)` | Cần current-local-day orchestration và safe 7-day arithmetic |
| Application History | Page loader + date grouping | Chưa có contribution projection/use case/bands |
| Mobile History | Accepted independent list controller/lifecycle | Chưa có contribution controller/subprojection |
| Presentation | One `SectionList`, date groups, resilient notices | Chưa có production contribution panel/day row |
| Theme | Existing stable palette tokens | `OPEN-006` mapping chưa được owner resolve |

Kết luận: schema/query đủ. Story 03 là Application projection + independent controller + neutral
Presentation gap; không cần migration hay dependency mới.

## 3. Proposed contracts

### 3.1. Semantic projection

```ts
export type ContributionIntensityBand =
  | 'zero'
  | 'low'
  | 'medium'
  | 'high'
  | 'peak';

export interface DailyContributionProjection {
  readonly localDate: string;
  readonly completedMinutes: number;
  readonly completedSessionCount: number;
  readonly intensity: ContributionIntensityBand;
}

export interface ContributionRangeProjection {
  readonly startLocalDate: string;
  readonly endLocalDate: string;
  readonly days: readonly DailyContributionProjection[];
}
```

Projection dùng semantic band, không dùng hex/theme token và không chứa presentation copy. Tất cả
object/array được freeze.

### 3.2. Pure builder

```ts
buildContributionRangeProjection({
  endLocalDate,
  facts,
}): ApplicationResult<ContributionRangeProjection, ContributionProjectionError>
```

Builder:

- derive đúng 7 consecutive civil dates ending at `endLocalDate`;
- validate canonical/realisable date, leap/month/year boundary và safe arithmetic;
- require sparse facts strictly ascending, unique và nằm trong range;
- validate safe positive aggregate/count và coherent Standard Focus bounds;
- zero-fill missing dates với minutes/count `0` và band `zero`;
- map thresholds bằng pure exhaustive function;
- không mutate input, không query, không đọc clock/timezone/theme.

Corrupt duplicate/order/range/aggregate trả `CONTRIBUTION_DATA_INVALID`; không sort/clamp/dedupe để
che durable/query defect.

### 3.3. Read use case

```ts
class LoadDailyContributionUseCase {
  execute(): Promise<ApplicationResult<
    ContributionRangeProjection,
    LoadDailyContributionError
  >>;
}
```

Use case owns:

1. `clock.nowMs()` và input validation;
2. `calendar.snapshot(nowMs)` để lấy current device local date;
3. pure start-date calculation;
4. query `{ profileId: 1, startLocalDate, endLocalDate }`;
5. sparse fact → immutable projection builder.

Errors:

- `CONTRIBUTION_DATE_UNAVAILABLE` — clock/calendar snapshot không dùng được;
- `CONTRIBUTION_READ_FAILED` — technical persistence failure;
- `CONTRIBUTION_DATA_INVALID` — malformed/corrupt query facts, vào critical Recovery.

### 3.4. Independent controller

```ts
export type ContributionControllerProjection =
  | { readonly status: 'idle' | 'loading' }
  | {
      readonly status: 'ready';
      readonly value: ContributionRangeProjection;
      readonly refresh: 'idle' | 'refreshing' | 'error';
    }
  | {
      readonly status: 'error';
      readonly code:
        | 'CONTRIBUTION_DATE_UNAVAILABLE'
        | 'CONTRIBUTION_READ_FAILED'
        | 'CONTRIBUTION_DATA_INVALID';
    };
```

Actions: `activate`, `deactivate`, `refresh`, `retryInitial`, `retryRefresh`, `dispose`.

- First successful sparse-empty read publishes `ready` with 7 zero days, never `empty`.
- Refocus/foreground recomputes current local date and requests a fresh exact range.
- Technical/date refresh failure retains committed projection with inline Retry.
- Initial failure remains panel-local; History list continues its own state lifecycle.
- Invalid durable facts enter global Recovery; deactivate/dispose drops late result/side effect.
- Same-kind pending loads coalesce; subscriber exceptions cannot change durable/projection truth.

### 3.5. History lifecycle composition

History list controller và contribution controller giữ state độc lập. Route remains thin:

```text
History focus       → activate both controllers
History blur        → deactivate both controllers
focused background→active → refresh both controllers
Retry contribution → contribution only
Load more           → History list only
```

Không tạo transaction chung: một projection success không chờ hoặc rollback vì projection kia fail.
Existing History cursor/append/refresh arbitration giữ nguyên.

## 4. UI và scroll architecture

### 4.1. Neutral Story-03 panel

Proposed copy/layout:

- heading `7 ngày gần đây`;
- 7 rows chronological oldest → today;
- mỗi row có `DD/MM`, `<N> phút`, `<C> phiên hoàn thành`;
- exact range text (`0 phút`, `1–24 phút`, `25–49 phút`, `50–99 phút`, `100+ phút`) giữ meaning
  neutral và không phụ thuộc màu;
- loading/error/stale notice + local Retry chỉ chiếm contribution panel;
- zero week vẫn hiện đủ 7 rows, không dùng empty illustration.

Story 03 không apply final band colors. Approved mapping được giữ trong Product/plan authority cho
US-09-04 implementation và contrast validation.

### 4.2. One scroll owner

Contribution panel được render trong `SectionList.ListHeaderComponent`, trước `Gần đây`. Khi History
empty, same SectionList dùng `ListEmptyComponent` cho accepted empty copy. Nhờ vậy screen header vẫn
ổn định, toàn bộ contribution/history content còn lại dùng đúng một virtualized scroll owner và largest
text không bị clip bởi fixed panel.

Không tạo horizontal ScrollView, nested list hoặc common graph abstraction trong Story 03.

## 5. Responsibility matrix

| Owner | Owns | Must not own |
|---|---|---|
| Route | Focus/app-visibility episode, invoke two controller actions | Date math, query, thresholds |
| History screen/list | Compose states and one scroll owner | Aggregate, current day, SQL |
| Contribution panel/day row | Neutral copy/layout/accessibility | Zero-fill, band calculation, theme decision |
| Contribution controller | Committed projection, refresh/error/retry generation | Query/date arithmetic/UI copy |
| Load use case | Current-day snapshot, fixed profile/range query, error mapping | React/theme/persistence SQL |
| Pure builder | Civil range, validation, zero-fill, band | Clock/query/theme |
| SQLite query | Existing aggregate/filter/order | Zero days, band, Presentation |

## 6. File impact

### 6.1. Planned new files

- `packages/application/src/history/build-contribution-range-projection.ts` and test.
- `packages/application/src/history/load-daily-contribution.use-case.ts` and test.
- `apps/mobile/src/application/history/contribution.controller.ts` and test.
- `apps/mobile/src/presentation/features/history/contribution-panel.tsx` and test.
- `apps/mobile/src/presentation/features/history/contribution-day-row.tsx` and test.
- `apps/mobile/src/composition/review/contribution-review-fixture.ts` and test.
- `apps/mobile/test/device/contribution-projection-smoke.md`.
- `docs/planning/US-09-03_IMPLEMENTATION_REPORT.md` after authorized implementation.

### 6.2. Planned modified files

- Application/mobile barrels.
- History slice/facade/provider/root composition for independent contribution controller/query.
- History route/screen/list/tests for shared lifecycle and SectionList header/empty composition.
- Existing SQLite integration/static integrity/device-guide validator.
- Core Truth/Open-decision register only after owner resolves `OPEN-006`.
- EPIC-09 tracker và this plan/report status at candidate time.

### 6.3. Explicitly unchanged

- Migration `001`, registry/checksum/schema/index/trigger/seed.
- Existing contribution SQL/filter/group/order unless failing evidence finds a defect and owner re-approves.
- Accepted History row/group/cursor/page merge behavior.
- Package manifests/lockfile, native config, permissions and assets.
- Analytics queue/provider and all session/reward mutations.

## 7. Ordered implementation tasks

| Order | Task | Observable output |
|---:|---|---|
| T00 | Owner gate + exact start audit | Approved confirmations and clean start SHA |
| T01 | Resolve Product decision | Core Truth/tracker record exact approved bands/palette |
| T02 | Pure range/band projection | 7 real civil dates, validation, zero-fill, immutable output |
| T03 | Read use case | Injected current-local-day query and typed errors |
| T04 | Independent controller | Initial/refresh/stale/error/Retry generation behavior |
| T05 | Composition/lifecycle wiring | List and contribution load/refresh independently |
| T06 | Neutral panel in list header | Text-first 7-day output, one scroll owner |
| T07 | Isolated fixtures | Zero/mixed/edges/cross-midnight/timezone/error scenarios |
| T08 | SQLite/static/device evidence | Exclusions, read-only, relaunch and accessibility guide |
| T09 | Candidate gates/report | Quality, exports, Doctor record, honest manual status |

## 8. Test strategy

### 8.1. Pure Application

- Seven dates across month/year/leap-day boundaries; no `24h` DST arithmetic.
- Exact oldest→today order and inclusive endpoints.
- Sparse/empty query zero-fill; input untouched and output deeply immutable.
- Reject impossible/end-underflow dates, duplicate/unsorted/out-of-range facts.
- Reject unsafe/non-positive/coherently impossible aggregate values.
- Threshold cases at every boundary `-1 / exact / +1`; safe integer extremes.

### 8.2. Use case/controller

- Query exact profile/start/end from injected clock/calendar.
- Clock/calendar/read/data errors map independently and Recovery only for durable invalidity.
- Initial success/error, retry, refresh success replacement and stale refresh preservation.
- Refocus/date rollover recomputes seven-day range.
- Coalescing, rapid Retry, deactivate/dispose and late success/error/Recovery drop.
- Contribution failure never changes History list projection/cursor.

### 8.3. SQLite/integrity

- Completed Standard Focus only; exact configured minutes/count.
- Failed/cancelled/running/trial/Break excluded.
- Persisted scheduled-end date survives cross-midnight, timezone change, delayed reconciliation/reopen.
- Sparse range order and inclusive boundaries; `ix_sessions_local_day` remains used.
- Product-table fingerprint unchanged across load/error/Retry/relaunch.
- No migration/checksum/schema/dependency/native diff.

### 8.4. Presentation/accessibility

- Seven chronological rows with exact numeric/date/count/range text.
- Zero week remains ready and visible.
- Loading/initial error/stale refresh/Retry affect panel only.
- Contribution is inside same SectionList header; no nested/horizontal scroll.
- Largest-text-shaped content wraps; stable date keys; screen-reader label has date/minutes/count/range.
- No final color dependency or color-only meaning in Story 03.

## 9. Fixtures và manual smoke

Use existing dev-only env `EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE`; databases use exact prefix
`pixeldoro-us-09-03-`:

| Scenario | Evidence |
|---|---|
| `contribution_zero_week` | Seven zero days, no false empty |
| `contribution_mixed_week` | Sparse zero-fill and exact minutes/count |
| `contribution_threshold_edges` | Semantic boundary mapping |
| `contribution_cross_midnight` | Persisted scheduled-end day |
| `contribution_timezone_changed` | Current range moves; stored day does not regroup |
| `contribution_read_failure_once` | List remains; panel Retry recovers |

Valid facts use production commands over isolated DB where deterministic. Corrupt/overflow/DST edge
cases remain automated if device reproduction is unreliable. Guide starts `NOT_RUN` and records exact
SHA, device/OS/runtime, timezone, network, a11y, fixture/database, result/artifact and cleanup.

## 10. Acceptance và Done gates

- [x] Exact owner-approved 7-day range ends on injected current local date.
- [x] Sparse query zero-fills all dates; stored day never regroups under timezone change.
- [x] Minutes/count include only completed Standard Focus configured duration.
- [x] Exact semantic bands and reserved palette mapping match resolved `OPEN-006`.
- [x] Invalid facts/date arithmetic fail closed; no clamp/sort/mock fallback.
- [x] Contribution load/refresh/error/Retry remains independent of accepted History list.
- [x] Neutral panel is text-first, seven-day complete and one-scroll-owner safe.
- [x] Automated offline/relaunch/read-only/static/platform-export evidence is recorded honestly;
  structured device/a11y breadth remains `NOT_RUN`.
- [x] No schema, dependency, native, analytics, final graph or unrelated drift.
- [ ] Owner quick UI acceptance is bound to exact committed SHA before Story 03 closes.

## 11. Owner Confirmation Register

### US0903-CONFIRM-01 — Contribution range

- **Option A — đề xuất:** rolling `7` local calendar days, gồm current local day; oldest→today,
  zero-fill đủ 7; không week/month navigation.
- **Option B:** current calendar month, 28–31 days và month navigation.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0903-CONFIRM-02 — Current-day anchor và refresh

- **Option A — đề xuất:** mỗi initial/refocus/foreground refresh lấy `clock.nowMs()` qua injected
  `LocalCalendarPort`; civil-date arithmetic không dùng `24h`; date rollover thay range chỉ sau read
  thành công, lỗi giữ projection cũ + Retry.
- **Option B:** khóa range một lần mỗi app runtime, chỉ relaunch mới đổi “today”.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0903-CONFIRM-03 — Semantic intensity thresholds

- **Option A — đề xuất:** `zero=0`, `low=1–24`, `medium=25–49`, `high=50–99`, `peak=100+` completed
  minutes; fixed pure mapping, không persist.
- **Option B:** không tạo bands ở Story 03; chỉ expose raw minutes và chờ Story 04.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12; threshold portion của `OPEN-006` resolved.

### US0903-CONFIRM-04 — Exact palette authority

- **Option A — đề xuất:** reserve mapping cho Story 04: `zero→background`, `low→surface`,
  `medium→surfaceStrong`, `high→accent`, `peak→accentDark`, luôn kèm border/numeric/text legend;
  Story 03 vẫn render neutral text-only panel.
- **Option B:** Product/Design cung cấp threshold/swatch set khác trước coding.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12; `OPEN-006` resolved cùng CONFIRM-03, final
  contrast acceptance vẫn thuộc US-09-04.

### US0903-CONFIRM-05 — Neutral panel layout/content

- **Option A — đề xuất:** panel `7 ngày gần đây` nằm trong History SectionList header; 7 text rows
  oldest→today, mỗi row có `DD/MM`, minutes, completed count và exact band range; zero week vẫn hiện đủ.
- **Option B:** grid 7 cột ngay ở Story 03.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0903-CONFIRM-06 — Failure và controller isolation

- **Option A — đề xuất:** independent contribution controller; technical/date error chỉ ảnh hưởng panel,
  giữ stale contribution khi có; Retry riêng; History list/pagination vẫn usable; durable corrupt mới vào
  global Recovery.
- **Option B:** gộp contribution vào History controller và dùng full-screen error chung.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

Owner có thể duyệt gọn:

`Duyệt US0903-CONFIRM-01→06 theo Option A`

Approval này mở coding US-09-03 và resolve `OPEN-006` theo CONFIRM-03/04. Nó không authorize
commit/push, US-09-04 implementation hoặc EPIC-09 closure.

## 12. Impact và rollback

| Area | Verdict |
|---|---|
| Schema/migration/index | `NONE`; existing query/index sufficient |
| Dependency/package/lockfile | `NONE` |
| Native/prebuild/permission | `NONE` |
| Durable writes | `NONE` |
| Analytics/provider | `NONE`; deferred US-09-05 |
| Product authority | `OPEN-006` resolved by approved CONFIRM-03/04; final visual acceptance remains US-09-04 |
| Common component | `NONE` proposed; use existing Panel/InlineNotice/buttons/SectionList |
| Formal device/a11y | `NOT_RUN` until executed |

Rollback removes contribution use case/controller/panel/fixtures and restores accepted US-09-02
History composition. No database rollback or data deletion is required. Never reset/delete
`pixeldoro.db`; only exact isolated fixture DBs may be cleaned after resolving their names.

## 13. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.3.0 | 2026-09-12 | Codex | Implemented approved Option A candidate: seven-day civil range, sparse zero-fill, semantic bands, read-only use case, independent resilient controller, neutral SectionList-header panel, isolated fixtures and smoke guide. Full quality passed 200 files/1,038 tests; iOS/Android exports passed; Doctor 20/21 known patch drift. Candidate is uncommitted on base `91d0612...`; owner UI smoke remains `NOT_RUN`. |
| 0.2.0 | 2026-09-12 | Codex | Recorded owner approval for `US0903-CONFIRM-01→06 Option A`, resolved `OPEN-006`, opened coding and bound implementation start SHA `91d0612...`. No commit/push authority. |
| 0.1.0 | 2026-09-12 | Codex | Audited accepted US-09-02 SHA `91d0612...`, existing contribution SQL/index/clock/calendar/History scroll architecture and unresolved `OPEN-006`; proposed rolling seven-day immutable projection, zero-fill, exact semantic bands/palette authority, independent controller, neutral SectionList-header panel, isolated fixtures and six owner confirmations. No coding, test claim, commit or push. |
