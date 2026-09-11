---
document_id: PIXELDORO_US_09_02_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-09-02 Implementation Plan
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
planning_baseline_sha: 18057fafe478ea95969c43c11b1ad72d9a7faed4
implementation_start_sha: null
exact_implementation_sha: null
previous_story: US-09-01
previous_story_status: DONE_OWNER_ACCEPTED
previous_story_accepted_sha: 18057fafe478ea95969c43c11b1ad72d9a7faed4
manual_device_status: NOT_RUN
formal_tester_status: NOT_RUN
schema_change: NONE_PROPOSED
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
analytics_change: NONE_PROPOSED_IN_THIS_STORY
next_gate: OWNER_CONFIRM_US0902_CONFIRM_01_TO_06
scope:
  - mobile_mvp
  - epic_09
  - us_09_02
  - date_grouped_history
  - cursor_pagination
  - resilient_refresh
  - virtualized_list
  - read_only
authority: PROPOSED_IMPLEMENTATION_PLAN
story_baseline: ./EPIC-09_USER_STORIES.md
previous_story_plan: ./US-09-01_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-09-01_IMPLEMENTATION_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
session_specification: ../specifications/session-lifecycle.md
timer_specification: ../specifications/timer-engine.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-09-02 — Date-grouped Pagination và Resilient Refresh

## 0. Outcome và gate

Plan này mở Story kế tiếp sau khi US-09-01 được owner quick-UI accepted. Nó chưa cấp quyền coding,
commit hoặc push.

**User outcome:** History được group theo persisted local day, mỗi ngày có tổng số phút Standard Focus
`completed`; user có thể xem thêm từng page mà không duplicate/mất row, và dữ liệu đã đọc vẫn còn khi
append hoặc refresh tạm lỗi.

**Priority/order:** `P0 / 2` trong EPIC-09.

**Blocks:** final History list/graph composition của US-09-04. Contribution projection và graph vẫn
thuộc US-09-03/04, không được kéo vào Story này.

### 0.1. Baseline audit

| Fact | Kết quả |
|---|---|
| Repository | `/Users/dunglu/Documents/Working/c92-pixel-doro` |
| Branch | `feats/epic-09` |
| Planning HEAD | `18057fafe478ea95969c43c11b1ad72d9a7faed4` |
| Origin alignment | Local và `origin/feats/epic-09` cùng SHA tại audit |
| Worktree trước doc update | Clean |
| US-09-01 | `DONE_OWNER_ACCEPTED`; quick UI PASS, no crash, expected behavior |
| Existing History page | Fixed 20-row first page; validated `nextCursor`; no Load more |
| Existing SQL | Cursor `(ends_at,id)`, `limit + 1`, order `ends_at DESC,id ASC` đã đúng |
| Schema/index | Migration `001` và `ix_sessions_history` đủ; không có fact gap |
| Coding authority | Chưa có; chờ `US0902-CONFIRM-01→06` |

## 1. Authority và scope

### 1.1. Inherited truth

- History chỉ gồm terminal Standard Focus; running, onboarding trial và Break bị loại.
- Mọi group dùng immutable `scheduled_end_local_date`, không regroup bằng timezone hiện tại.
- Day total chỉ cộng `configured_duration_minutes` của row `completed`; failed/cancelled vẫn hiển thị
  trong group nhưng đóng góp `0`.
- Query order là `endsAt DESC, id ASC`; cursor dùng đúng cặp `(endsAt,id)`.
- Product history được giữ tới confirmed full reset; UI không được ám chỉ retention cap.
- Tất cả page/refresh là read-only, offline, không analytics trong Story 02.
- Transient read error giữ feature usable; invalid/corrupt durable fact vào critical Recovery và không
  auto-repair/reset.

### 1.2. In scope

1. Mở shared History page loader cho first/next cursor nhưng vẫn khóa page size `20`.
2. Tạo pure date-group projection và completed-minute aggregation với overflow guard.
3. Mở rộng History controller cho committed pages, cursor, append, refresh, Retry và race arbitration.
4. Refresh first page khi tab refocus hoặc app trở lại foreground trong lúc History active.
5. Giữ committed rows khi refresh/append technical failure; publish notice/action riêng.
6. Dùng một virtualized `SectionList` scroll owner, date headers, totals và explicit Load more.
7. Thêm isolated fixtures, real-SQLite/race/static coverage và manual smoke guide.

### 1.3. Out of scope

- Contribution range/zero fill/intensity bands/colors/graph/legend (`US-09-03/04`).
- `history_viewed` hoặc analytics queue/provider (`US-09-05`).
- Pull-to-refresh gesture, infinite scroll, automatic background prefetch hoặc persisted cursor.
- Search/filter/date picker/week/month navigation/session detail/edit/delete/export.
- Time-of-day, mode, XP/Coin/reward copy hoặc completed-reward audit.
- Schema/migration/index/trigger, dependency, native/prebuild hoặc permission changes.
- Settings/root prototype retirement hay common visual redesign.

### 1.4. Scope traps

1. Không group bằng `new Date(endsAt)` hoặc timezone runtime.
2. Không cộng failed/cancelled duration vào completed-day total.
3. Không sort lại theo label/date format ở Presentation.
4. Không expose raw cursor/query/repository qua route hoặc component.
5. Không clear committed rows khi append/refresh technical error.
6. Không advance/reset cursor khi read chưa thành công.
7. Không nest `SectionList`/`FlatList` trong current `ScreenShell` ScrollView.
8. Không dùng scroll-end auto pagination; action phải explicit và accessible.
9. Không persist page/scroll/controller cache như durable truth.
10. Không resolve contribution `OPEN-006` hoặc add analytics opportunistically.

## 2. Capability inventory và gap

| Capability | Baseline | Story-02 gap |
|---|---|---|
| SQLite history query | Đã support cursor, stable tie order, 1–100 limit | Không đổi SQL; cần consumer multi-page evidence |
| Shared loader | Fixed `{limit:20,cursor:null}`, defensive validation | Cần typed cursor input và verify page nằm sau requested cursor |
| Item projection | Immutable ID/status/tag/duration/date/endsAt | Đủ cho paging/grouping; không thêm reward/mode |
| History controller | Initial load/cache/local Retry/generation guard | Chưa có committed multi-page state, refresh/append state/race |
| App visibility | Existing `AppVisibilityController` + `useAppVisibility` | History route chưa request foreground refresh |
| Screen/list | `ScreenShell` ScrollView + one Panel/rows | Cần one-scroll-owner virtualized date sections |
| Common UI | `Panel`, `InlineNotice`, `SecondaryButton` | Có thể reuse; ScreenShell cần non-scroll mode mặc định-safe |
| Fixtures | Story-01 empty/mixed/read failure/corrupt | Chưa có 21+/boundary/append/refresh scenarios |

Kết luận: đây là Application/controller/presentation lifecycle gap; không phải data-model gap.

## 3. Proposed contracts

### 3.1. Generic page loader

Generalize internal Story-01 use case thay vì tạo query/use case song song:

```ts
export interface LoadFocusHistoryPageInput {
  readonly cursor: StandardFocusHistoryCursor | null;
}

execute(input: LoadFocusHistoryPageInput): Promise<ApplicationResult<
  FocusHistoryPageProjection,
  LoadFocusHistoryPageError
>>;
```

Use case vẫn owns `profileId = 1` và `limit = 20`. Nó validate:

- input cursor safe/non-empty;
- page tối đa 20, immutable items, no duplicate nội page;
- exact stable order;
- với next-page, mọi entry strictly nằm sau requested cursor;
- returned `nextCursor` bằng last row, chỉ non-null khi page đủ 20 và tiến về phía older rows;
- malformed page/cursor/order/date/duration/status/tag → `HISTORY_DATA_INVALID`.

Controller là consumer duy nhất chọn cursor. Presentation chỉ gọi `loadMore()`.

### 3.2. Group projection

Pure shared Application builder:

```ts
export interface FocusHistoryDateSection {
  readonly localDate: string;
  readonly completedMinutes: number;
  readonly items: readonly FocusHistoryItemProjection[];
}
```

Builder nhận merged ordered items và:

- giữ group order theo first occurrence trong already-validated list;
- giữ row order trong group;
- cộng duration chỉ khi `status === 'completed'`;
- giữ group có `0` completed minutes nếu chỉ có failed/cancelled;
- reject duplicate ID, cross-page bad order, invalid date hoặc unsafe sum;
- freeze section/items/output.

Presentation không tự group/sum/sort.

### 3.3. Controller projection

```ts
export type HistoryControllerProjection =
  | { readonly status: 'idle' | 'loading' }
  | { readonly status: 'empty' }
  | {
      readonly status: 'ready';
      readonly sections: readonly FocusHistoryDateSection[];
      readonly refresh: 'idle' | 'refreshing' | 'error';
      readonly pagination: 'idle' | 'loading' | 'error' | 'end';
    }
  | {
      readonly status: 'error';
      readonly code: 'HISTORY_READ_FAILED' | 'HISTORY_DATA_INVALID';
    };
```

Private controller state giữ flat committed items + next cursor. Cursor không ra Presentation.

Actions:

- `activate()` — initial load nếu chưa có committed projection; refocus thì refresh first page.
- `deactivate()` — invalidate pending publication, giữ committed projection.
- `refresh()` — first-page read, dùng cho foreground hoặc refresh Retry.
- `loadMore()` — đọc đúng private cursor một lần.
- `retryInitial()` / `retryRefresh()` / `retryLoadMore()` — retry đúng intent, không overload write.
- `dispose()` — invalidate tất cả generation và listeners.

### 3.4. Refresh semantics

```text
Initial focus, no committed data
  → blocking loading → empty/ready/local error

Tab refocus with committed data
  → keep sections visible; refresh=refreshing
  → successful first page atomically replaces committed pages and cursor
  → technical failure keeps old sections/cursor; refresh=error

App background → active while History focused
  → same refresh intent; duplicate pending refresh coalesces

Corrupt/invalid first or later page
  → do not publish partial result
  → enter DURABLE_DATA_CORRUPT recovery
```

Foreground observation stays in the route through existing `useAppVisibility`; controller remains
platform-agnostic. Route tracks whether History is focused and calls `refresh()` only on an actual
non-active → active transition while focused.

### 3.5. Append/merge semantics

```text
loadMore()
  → capture current cursor + generation
  → pagination=loading, retain all sections
  → successful page:
      validate it follows captured cursor
      merge by stable ID/order
      rebuild immutable date sections
      commit items + next cursor atomically
  → technical failure:
      retain items + same cursor
      pagination=error
  → Retry:
      use exact same retained cursor
```

Identical duplicate IDs from an overlapping response are deduped defensively; same ID with conflicting
facts, non-progressing cursor or broken global order fails closed. A new terminal row inserted before
the current cursor does not affect older-page append; it appears after the next successful refresh.

### 3.6. Race arbitration

- Duplicate append or refresh intents coalesce by kind.
- Refresh requested during append has priority: append generation becomes stale and cannot publish;
  refresh starts from cursor `null` and owns the next committed state.
- Append requested while refresh is pending is ignored/disabled.
- Deactivate/dispose invalidates both types; late success/error/Recovery side effect is dropped.
- Successful refresh resets pagination to its returned first-page cursor; failed refresh retains the
  exact old cursor and loaded pages.
- No read path writes session/profile/reward/settings/analytics facts.

## 4. UI và scroll architecture

### 4.1. One scroll owner

Extend `ScreenShell` with a narrow `scrollable?: boolean` API, default `true`:

- every existing consumer keeps current ScrollView behavior unchanged;
- History passes `scrollable={false}`;
- non-scroll branch uses the same SafeArea/max-width/padding tokens plus a flex content container;
- `FocusHistoryList` uses one `SectionList` inside existing `Panel` and becomes the only scroll owner.

Do not introduce another common list abstraction. Add direct ScreenShell regression tests for default
and non-scroll branches.

### 4.2. Proposed visual/content contract

- Screen header remains `Những nhịp đã qua.`.
- Each section header shows persisted date as `DD/MM/YYYY` and explicit
  `<N> phút hoàn thành`; a failed/cancelled-only day shows `0 phút hoàn thành`.
- Accepted Story-01 row component/copy/alignment stays unchanged.
- Footer action: `Xem thêm`; busy copy: `Đang tải lịch sử…`.
- Append failure keeps rows and shows `Chưa tải thêm được lịch sử.` + `Thử tải lại`.
- Refresh failure keeps rows and shows `Chưa cập nhật được lịch sử mới nhất.` + `Thử lại`.
- End state removes the Load-more button; it does not say “đã hiển thị toàn bộ lịch sử vĩnh viễn”.
- Refresh/append notice uses `InlineNotice`; action reuses `SecondaryButton`.
- Status/date/total meaning remains text-first, grayscale-safe and screen-reader readable.

## 5. Responsibility matrix

| Owner | Owns | Must not own |
|---|---|---|
| Route | Focus episode, app visibility transition, callbacks | Cursor, merge, grouping, SQL |
| History screen | State/notice/list composition | Fetch, sum, current timezone |
| SectionList wrapper | Virtualization, keys, footer/header rendering | Sort, dedupe, cursor |
| Date header | Date/total copy and accessibility | Calculate total |
| Row/status | Accepted Story-01 semantics | Paging/group totals |
| History controller | Cursor, committed projection, intent/race/generation | SQL, Vietnamese copy, AppState API |
| Shared page use case | Fixed query size, cursor/page validation, immutable page | Merge/UI/lifecycle |
| Shared group builder | Ordered grouping and completed-only sum | Query/React/translation |
| SQLite query | Existing filter/order/cursor SQL | Presentation/controller state |

## 6. State and navigation matrix

| Event/state | Expected | Preserved facts |
|---|---|---|
| First focus | blocking loading → empty/ready/error | No fake/stale rows exist yet |
| Refocus ready | rows remain, non-blocking refresh | Old rows/cursor until success |
| Foreground while focused | coalesced refresh | Same as refocus |
| Foreground while another tab active | no History query | Cached History untouched |
| Load more | rows remain, footer busy | Old cursor until success |
| Append technical failure | rows + append notice/retry | Items and exact cursor |
| Refresh technical failure | rows + stale notice/retry | All loaded pages and cursor |
| Successful refresh | replace atomically with new first page | New cursor only |
| New row before append | append older rows from captured cursor | New row waits for refresh |
| Corrupt any page | global Recovery, no partial merge | Durable DB not repaired/reset |
| Deactivate pending | late result ignored | Last committed projection |
| Cold relaunch | new first-page load | Cursor/scroll not persisted |
| Airplane mode | same local behavior | No network/provider dependency |

## 7. File impact

### 7.1. Planned new files

- `packages/application/src/history/build-focus-history-sections.ts` and test.
- `apps/mobile/src/presentation/features/history/history-date-section-header.tsx` and test.
- `apps/mobile/src/presentation/features/history/history-pagination-footer.tsx` and test.
- `apps/mobile/src/composition/review/history-grouped-review-fixture.ts` and test.
- `apps/mobile/test/integration/focus-history-pagination.integration.test.ts`.
- `apps/mobile/test/device/focus-history-pagination-lifecycle-smoke.md`.
- `docs/planning/US-09-02_IMPLEMENTATION_REPORT.md` only after authorized implementation.

### 7.2. Planned modified files

- Story-01 page use case/test and Application barrel — cursor input + boundary validation.
- History controller/test — committed pages, grouping, refresh/append intents and races.
- History slice/facade/provider — new loader/group builder and narrow actions.
- History route — focus/refocus and foreground observation.
- History screen/list/tests — grouped SectionList, notices and Load-more states.
- `ScreenShell` plus a focused common-component test — default-safe non-scroll mode.
- Root composition/review fixture tests — finite Story-02 fixture selection.
- Existing SQLite integration/static/device guide validator where evidence requires.
- EPIC-09 story tracker and this plan/report status at candidate time.

### 7.3. Explicitly unchanged

- Migration `001`, registry/checksum/schema/index/trigger/seed.
- Existing history SQL/filter/order unless a failing test demonstrates a defect and owner re-approves.
- Contribution query/projection/graph and `OPEN-006` colors.
- Package manifests/lockfile, native config, permissions and assets.
- Analytics types/queue/provider.
- Standard Focus/Break lifecycle commands and reward transactions.
- Existing ScreenShell consumers' default behavior.

## 8. Ordered implementation tasks

| Order | Task | Observable output |
|---:|---|---|
| T00 | Owner gate + start audit | Approved confirmations, clean exact start SHA |
| T01 | Generalize page loader | Cursor-aware 20-row page with boundary validation |
| T02 | Pure group projection | Stable date sections + completed-only safe total |
| T03 | Controller state/races | Refresh/append/retry/coalescing/stale guards |
| T04 | Facade/lifecycle wiring | Refocus + foreground while active only |
| T05 | ScreenShell non-scroll seam | Default consumers unchanged; one scroll owner possible |
| T06 | Grouped virtualized UI | Date headers/totals/rows/notices/Load more |
| T07 | Isolated fixtures | 21+, equal boundary, failures and new-on-refresh |
| T08 | SQLite/integration/static/device evidence | No duplicate/write/nested-scroll regression |
| T09 | Candidate gates/report | Quality, exports, Doctor record, honest manual status |

## 9. Test strategy

### 9.1. Application/page/grouping

- First/next query always uses profile `1`, page `20`, exact cursor.
- Reject cursor/page boundary regression, non-progressing cursor, cross-page bad order and conflicting ID.
- Accept `20/21/40+` flows and stable equal-`endsAt` ID boundary.
- Group multiple days descending; merge a day split across pages into one section.
- Day with only failed/cancelled remains visible with total `0`.
- Completed-only sums are safe integers; overflow fails closed.
- All page/section/item arrays are immutable and inputs remain unchanged.

### 9.2. Controller/races

- Initial loading/empty/error behavior remains Story-01 compatible.
- Append single-flight; retry uses unchanged cursor; success advances once; end is truthful.
- Refresh single-flight; failure retains pages/cursor; success replaces first page atomically.
- Refresh-during-append priority and append-during-refresh suppression.
- New-row-between-pages, identical duplicate dedupe and conflicting duplicate Recovery.
- Deactivate/dispose drops late result and prevents late Recovery side effects.
- Subscriber throw cannot change state or durable facts.

### 9.3. Presentation/lifecycle

- Exact date header/total and all row statuses/tags.
- Refresh/append notices and Retry buttons announce correct state.
- Load more button exposes busy/disabled state and minimum touch target through common button.
- Route refreshes on refocus and actual foreground transition only while focused.
- `SectionList` is the only History scroll owner; stable item/section keys are used.
- ScreenShell default ScrollView branch is unchanged for existing consumers.
- Largest-text-shaped props wrap; no component exceeds 300 lines.
- Static scans reject raw query/repository/SQLite/current-time/contribution/analytics imports.

### 9.4. Real SQLite/integrity

- 21 and 40+ retained rows return exact pages/order/end.
- Equal `endsAt` across boundary neither skips nor duplicates ID.
- Mixed statuses/days produce exact completed-only totals.
- Close/reopen/cold reconstruction returns first page from durable data.
- Product-table fingerprints are identical across page, append failure, refresh and Retry.
- Existing query-plan index evidence and all Story-01 exclusions remain green.
- Migration/checksum/schema/dependency/native diffs remain absent.

## 10. Fixtures và manual smoke

Use existing dev-only env `EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE`; Story-02 databases use prefix
`pixeldoro-us-09-02-`:

| Scenario | Evidence |
|---|---|
| `history_grouped_21` | First page, day headers/totals, one-row next page and end |
| `history_equal_end_boundary` | Stable ID tie across page boundary |
| `history_load_more_failure_once` | Rows/cursor retained; Retry appends once |
| `history_refresh_failure_once` | Stale rows + notice; Retry clears notice |
| `history_new_terminal_on_refresh` | Successful refresh replaces first page with new terminal row |

Valid facts use production boundaries where deterministic. Tie/race behavior may use a narrow dev-only
query decorator over an isolated database; it cannot touch `pixeldoro.db` or insert corrupt production
facts.

Planned guide: `apps/mobile/test/device/focus-history-pagination-lifecycle-smoke.md`, initial status
`NOT_RUN`. It must record exact SHA, platform/device/OS, runtime, timezone, network, a11y settings,
fixture/database, PASS/FAIL/BLOCKED/NOT_RUN and cleanup/unset steps.

## 11. Acceptance và Done gates

- [ ] Date groups use persisted local date and descending stable order.
- [ ] Day totals sum completed configured minutes only; failed/cancelled remain visible.
- [ ] Explicit 20-row Load more neither skips nor duplicates equal-timestamp rows.
- [ ] Append failure retains rows/cursor and Retry uses the same intent.
- [ ] Refocus/active-foreground refresh coalesces and never publishes a stale generation.
- [ ] Refresh failure retains committed pages with actionable inline notice.
- [ ] Successful refresh atomically replaces pages and resets cursor from first page.
- [ ] Empty is published only after successful empty first-page read.
- [ ] Invalid page/merge/overflow enters critical Recovery without partial rows or reset.
- [ ] History has one virtualized scroll owner; default ScreenShell consumers regressions pass.
- [ ] Offline/relaunch/no-write/a11y/static/platform evidence is recorded honestly.
- [ ] No contribution, analytics, schema, dependency, native or unrelated prototype drift.
- [ ] Owner quick UI acceptance is bound to exact committed SHA before Story 02 closes.

## 12. Owner Confirmation Register

### US0902-CONFIRM-01 — Page và end policy

- **Option A — đề xuất:** `20` rows/page, explicit `Xem thêm`, mỗi lần thêm `20`; hide button khi
  `nextCursor = null`, không cap durable history.
- **Option B:** load tự động khi gần cuối list.
- **Status:** `PENDING_OWNER`; blocks page loader/footer acceptance.

### US0902-CONFIRM-02 — Date header và day total

- **Option A — đề xuất:** group bằng persisted date; header `DD/MM/YYYY` + `<N> phút hoàn thành`, kể
  cả `0 phút hoàn thành`; failed/cancelled vẫn ở group nhưng không tăng total.
- **Option B:** relative label Hôm nay/Hôm qua và ẩn total khi bằng 0.
- **Status:** `PENDING_OWNER`; blocks grouping/copy/a11y.

### US0902-CONFIRM-03 — Successful refresh replacement

- **Option A — đề xuất:** refresh thành công atomically thay toàn bộ loaded pages bằng first page mới
  và cursor mới; không ép scroll-to-top. Refresh lỗi giữ nguyên pages/cursor.
- **Option B:** merge first page mới vào toàn bộ pages cũ và cố giữ pagination depth.
- **Status:** `PENDING_OWNER`; blocks merge/race contract.

### US0902-CONFIRM-04 — Refresh triggers và race priority

- **Option A — đề xuất:** refresh khi tab refocus và khi app foreground trong lúc History focused;
  coalesce pending same intent; refresh ưu tiên và invalidate late append.
- **Option B:** chỉ refresh khi user bấm nút thủ công.
- **Status:** `PENDING_OWNER`; blocks controller/route lifecycle.

### US0902-CONFIRM-05 — One-scroll-owner architecture

- **Option A — đề xuất:** thêm `ScreenShell scrollable={false}` với default `true` giữ nguyên; History
  dùng một `SectionList` trong existing Panel, không sticky header ở Story 02.
- **Option B:** giữ ScrollView và render toàn bộ merged rows không virtualization.
- **Status:** `PENDING_OWNER`; blocks common seam/list implementation.

### US0902-CONFIRM-06 — Loading/error visibility

- **Option A — đề xuất:** giữ rows khi refresh/append; hiện inline status + Retry riêng; không
  pull-to-refresh, không auto retry, không clear list. Copy dùng `Đang cập nhật…`,
  `Chưa cập nhật được…`, `Đang tải lịch sử…`, `Chưa tải thêm được…`.
- **Option B:** refresh im lặng và dùng một full-screen Error chung cho mọi failure.
- **Status:** `PENDING_OWNER`; blocks final controller projection/UI states.

Owner có thể duyệt gọn:

`Duyệt US0902-CONFIRM-01→06 theo Option A`

Approval chỉ mở coding US-09-02. Nó không authorize commit/push, US-09-03 hoặc toàn EPIC-09.

## 13. Impact và rollback

| Area | Verdict |
|---|---|
| Schema/migration/index | `NONE`; existing query/index sufficient |
| Dependency/package/lockfile | `NONE` |
| Native/prebuild/permission | `NONE` |
| Durable writes | `NONE` |
| Analytics/provider | `NONE`; deferred US-09-05 |
| Common component | Narrow backward-compatible ScreenShell non-scroll mode proposed |
| Contribution/OPEN-006 | `NONE`; deferred US-09-03/04 |
| Formal device/a11y | `NOT_RUN` until executed |

Rollback restores accepted Story-01 fixed first-page controller/screen, removes Story-02 grouping/
pagination/lifecycle fixtures and reverts only the ScreenShell non-scroll seam. No database rollback or
data deletion is required. Never reset/delete `pixeldoro.db`; only exact isolated fixture DBs may be
cleaned after their names are resolved.

## 14. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-09-11 | Codex | Audited accepted US-09-01 SHA `18057faf...`, existing cursor SQL, controller/AppVisibility/ScreenShell/UI boundaries; proposed read-only date grouping, explicit 20-row pagination, resilient refresh, one SectionList owner, five isolated fixture scenarios and six owner confirmations. No coding, commit or push. |
