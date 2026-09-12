---
document_id: PIXELDORO_EPIC_09_USER_STORIES
title: PixelDoro EPIC-09 — Focus History và Contribution Graph User Stories
version: 1.0.0
status: IMPLEMENTATION_IN_PROGRESS_OWNER_GATED
date: 2026-09-11
last_updated: 2026-09-12
owner: Dũng Lư
language: vi
scope:
  - mobile_mvp
  - epic_09
  - user_story_breakdown
authority: PLANNING
branch: feats/epic-09
baseline_sha: 05e3e883e0c6dc3292b3707fd5fe5af65032dc75
baseline_worktree: CLEAN_BEFORE_THIS_DOCUMENT
previous_epic: EPIC-08
previous_epic_status: DONE_OWNER_ACCEPTED
previous_epic_accepted_sha: 30adc34be23dca48379b6f2553203fdadb9f9e5b
previous_epic_closure_commit: 05e3e883e0c6dc3292b3707fd5fe5af65032dc75
implementation_status: US_09_01_TO_04_DONE_OWNER_ACCEPTED_US_09_05_PLANNING_OWNER_GATED
formal_tester_status: NOT_RUN
schema_impact: NONE_PROPOSED_EXISTING_SCHEMA_001_SUFFICIENT
dependency_impact: NONE_PROPOSED
native_impact: NONE_PROPOSED
product_gate: OPEN_006_RESOLVED_OPTION_A
next_gate: OWNER_CONFIRM_US_09_05_IMPLEMENTATION_PLAN
product_truth: ../PIXELDORO_CORE_TRUTH.md
epic_baseline: ./MVP_EPICS.md
data_model: ../architecture/data-model.md
session_specification: ../specifications/session-lifecycle.md
timer_specification: ../specifications/timer-engine.md
previous_epic_exit: ./EPIC-08_EXIT_REPORT.md
---

# EPIC-09 — Focus History và Contribution Graph

## 0. Mục đích và authority

Tài liệu này audit baseline và theo dõi các vertical slice của `EPIC-09`, với output quan sát được,
dependency, test, device guide, rollback và owner gate riêng. US-09-01→04 đã owner accepted;
US-09-05 đang ở implementation-plan confirmation gate. Tài liệu không
tự cấp quyền coding, commit hoặc push.

Thứ tự authority khi review hoặc triển khai:

1. `PIXELDORO_CORE_TRUTH.md` và Product decision đã khóa.
2. Architecture, Data Model, ADR và specification trạng thái `APPROVED`.
3. `MVP_EPICS.md` và Exit Report mới nhất.
4. Behavior đã implement và owner accepted ở EPIC-01→08.
5. Code/test tại baseline SHA là capability inventory, không tự thay đổi Product truth.
6. EPIC-03 prototype chỉ là UX evidence; mock data, local reducer, màu và copy phụ không phải durable
   hoặc business authority.

Nếu tài liệu này mâu thuẫn authority cao hơn, authority cao hơn thắng và planning phải được sửa trước
khi coding. Option A trong mục 24 chỉ có authority khi status ghi owner đã approve/ratify.

## 1. Git/baseline audit

### 1.1. Exact Git state trước khi tạo tài liệu

| Fact | Kết quả audit |
|---|---|
| Repository | `/Users/dunglu/Documents/Working/c92-pixel-doro` |
| Branch | `feats/epic-09` |
| HEAD / exact planning baseline | `05e3e883e0c6dc3292b3707fd5fe5af65032dc75` |
| HEAD subject | `Feats/epic 08 (#11)` |
| Origin | `https://github.com/QuangDung159/c92-pixel-doro.git` |
| Upstream state | `feats/epic-09...origin/feats/epic-09`; local và remote cùng baseline tại thời điểm audit |
| Worktree trước tài liệu này | Clean; không có tracked/untracked owner change |
| EPIC-08 Exit Report in Git | Có trong HEAD; không phải closure doc uncommitted |
| EPIC-08 status | `DONE_OWNER_ACCEPTED` |
| EPIC-08 exact accepted behavior SHA | `30adc34be23dca48379b6f2553203fdadb9f9e5b` |
| EPIC-09 code authorization | Chưa có |

Không commit, push, đổi branch, reset hoặc rollback nào được thực hiện trong bước planning này.

### 1.2. Dependency gate

`EPIC-08_EXIT_REPORT.md` xác nhận US-08-01→05 đã owner accepted, automated quality và iOS/Android JS
export pass trên accepted candidate, đồng thời mở `EPIC-09` planning gate. Exit Report cũng nói rõ gate
này không tự cấp quyền implementation. Điều kiện predecessor của EPIC-09 đã đạt; owner confirmation
trong mục 24 vẫn là gate trước planning Story/coding.

## 2. Tài liệu đã audit và phân loại

### 2.1. Product, roadmap và UX authority

| Nhóm | Tài liệu đã đọc/audit | Phân loại và kết luận dùng cho EPIC-09 |
|---|---|---|
| Product truth | `docs/PIXELDORO_CORE_TRUTH.md` | `ACTIVE`, authority cao nhất: standard history, status, contribution semantics, offline MVP và `OPEN-006`. |
| Roadmap | `docs/planning/MVP_EPICS.md` | EPIC-09 `MUST`, order 09, scope cơ bản; EPIC-08 đã done; final color QA bị gate. |
| Approved UX | `docs/planning/EPIC-03_UX_PROTOTYPE_PLAN.md` | History có empty/sample/loading/error; sample dùng 7-day neutral preview; data-needs map giữ schema/query hiện có. |
| Cross-Epic audit | `docs/planning/EPIC-01_TO_05_COMPLETION_AUDIT_AND_NEXT_PLAN.md` | Giữ `OPEN-006`, không chuyển prototype thành production truth. |

### 2.2. Architecture, persistence và specification

| Nhóm | Tài liệu đã đọc/audit | Kết luận |
|---|---|---|
| Technical overview | `technical-overview.md` | SQLite durable authority, offline History, route/screen không truy cập SQLite/provider. |
| System architecture | `system-architecture.md` | Presentation → Application → Domain; Infrastructure implement Application-owned port; side effect ngoài product truth. |
| Project structure | `project-structure.md` | Focus History là reference feature; shared query/projection, mobile use case/controller, thin route; ví dụ path là định hướng, không phải code đã tồn tại. |
| Data model | `data-model.md` | `sessions` đã đủ facts/index; history/contribution là derived read; `DM-OPEN-002` và retention đã resolved. |
| ADR | ADR-001→008, đặc biệt ADR-002/003/004/008 | Expo Router composition-only; SQLite/Zustand ownership; platform boundary; local analytics queue và provider isolation. |
| Session/timer | `session-lifecycle.md`, `timer-engine.md` | Four-status truth, configured duration, terminal immutability, timestamp/reconciliation và trial/Break exclusions. |
| Gamification/Pet | `gamification-rules.md`, `pet-state-machine.md` | Configured completed minutes là reward basis; History không được grant/replay reward hoặc Pet feedback. |

### 2.3. Completed Epic/Story evidence

- EPIC-01 User Stories và implementation evidence: route/build/quality/device baseline.
- EPIC-02 User Stories, implementation evidence và US-02-01→09 plans: schema `001`, typed repository,
  derived history/contribution query, query-plan/index evidence, safe bootstrap/recovery, isolated probes
  và confirmed reset.
- EPIC-03 approved UX prototype plan: secondary tab hierarchy, review states và data-needs map.
- Toàn bộ Exit Report hiện có: EPIC-04, 05, 06, 07 và 08 đều `DONE_OWNER_ACCEPTED`.
- EPIC-04→08 User Story breakdown, các Implementation Plan/Report liên quan: common components,
  controller lifecycle, generation guard, exact-ID reads, SQLite integration, finite review fixture,
  local analytics và truthful manual-evidence conventions.
- `TECHNICAL_DOCUMENTATION_CHECKLIST.md`, EPIC-01 delivery runbook và toàn bộ current device guide
  pattern được audit để giữ cùng evidence vocabulary.

Không có planning artifact EPIC-09 trước tài liệu này. Không có Exit Report riêng cho EPIC-01→03;
evidence của các Epic đó nằm trong User Stories/Implementation Evidence/UX approval tương ứng.

### 2.4. Phân loại authority của implementation hiện tại

| Loại | Hiện trạng |
|---|---|
| Production implementation | SQLite schema/migration, session mapper/repository, history/contribution query, persistence graph, tab route shell, bootstrap/recovery, analytics queue/allowlist và common UI primitives. |
| Prototype-only | `presentation/features/history/index.tsx`: `useState`, hard-coded rows, neutral 7 cells, `PrototypeBadge/Controls`; không đọc SQLite. |
| Reusable production capability | Cursor query limit 1–100, stable order, local-day aggregation, `ScreenShell/Header`, `Panel`, `Button`, state surfaces, `InlineNotice`, `StatDisplay`, controller/focus lifecycle pattern và finite isolated fixture pattern. |
| Missing capability | History application use case/controller/facade wiring; typed UI projection; date groups; production row/list; load-more lifecycle; zero-filled date range/intensity policy; contribution graph; EPIC-09 fixture; history analytics recorder; route/prototype integrity tests. |
| Technical debt ngoài scope | Expo SDK 57 patch drift/Doctor baseline; deferred formal device matrices của Epic trước; provider delivery/dashboard EPIC-11. |
| Deprecated/non-authoritative | Prototype History mock values/colors/reward copy; illustrative file tree trong architecture không chứng minh file đã tồn tại. Không có production History implementation để retire ngoài prototype owner. |

## 3. Current implementation/capability audit

### 3.1. Durable schema và local-date truth

`sessions` đã có đầy đủ:

- `session_type`, `focus_variant`, `status`, `mode`, `work_tag`;
- `configured_duration_minutes`, `started_at`, `ends_at`, `resolved_at`;
- immutable `scheduled_end_local_date` và `scheduled_end_utc_offset_minutes`;
- index `ix_sessions_history`, `ix_sessions_local_day`, `ix_sessions_recent`;
- immutable identity/timestamp backstops và terminal constraints.

`DM-OPEN-002` đã resolved: local day là local date của `ends_at`, được tính/persist khi Start theo
timezone context của scheduled end. Cross-midnight session thuộc ngày kết thúc dự kiến. Delayed
reconciliation, DST hoặc timezone device đổi sau Start không regroup row cũ. Product history giữ local
tới confirmed full reset; không có MVP retention cap hoặc background prune.

Kết luận: không có durable fact gap và không đề xuất schema/migration.

### 3.2. Production history query

`SQLiteStandardFocusHistoryQuery` hiện:

- filter `profile_id = 1`, `session_type = 'focus'`, `focus_variant = 'standard'`;
- chỉ lấy `completed|failed|cancelled`, loại `running`, onboarding trial và mọi Break;
- order `ends_at DESC, id ASC`;
- cursor `(endsAt, id)`, đọc `limit + 1`, limit hợp lệ `1..100`;
- map duration/mode/tag/status/timestamps/local-day/offset sang typed Application fact;
- fail closed khi row không đúng standard terminal identity.

Real SQLite coverage đã có mixed history, tie-break ordering, two-page cursor, trial/running/Break
exclusion, invalid input, query-plan index và close/reopen.

Gap còn lại: query trả persistence fact, chưa có user-facing projection, day grouping, page merge,
load-more failure state hoặc production consumer.

### 3.3. Production contribution query

`SQLiteContributionQuery` hiện:

- chỉ sum `configured_duration_minutes` của completed standard Focus;
- group/order theo persisted `scheduled_end_local_date` trong inclusive date range;
- trả sparse rows có `totalCompletedMinutes` và `completedSessionCount`;
- loại failed/cancelled/trial/running/Break;
- validate canonical query range và positive aggregate row;
- có SQLite integration cho mixed data, timezone-change no-regroup, index use và reopen.

Gap còn lại: chưa có current display range, zero-fill missing days, intensity mapping, final threshold/
color decision, screen projection hoặc accessible graph.

### 3.4. Route, screen và prototype

- `src/app/(tabs)/history.tsx` hiện chỉ export `HistoryScreen` prototype.
- Prototype screen dài nhỏ, dùng local state và hard-coded 7-day/sample rows; không dùng prototype
  context nhưng có `PrototypeBadge/Controls`.
- Tab shell/navigation là production và History là resting tab; không cần route mới.
- Root `PrototypeProvider` vẫn có consumer hợp lệ ở Settings và prototype Focus branches; EPIC-09
  không được xóa provider hoặc prototype ngoài History ownership.

### 3.5. Common UI và list-layout constraint

Production common components có `Panel`, `Button`, `ScreenShell`, `ScreenHeader`, `EmptyState`,
`LoadingState`, `ErrorState`, `InlineNotice`, `StatDisplay`. Không có production status tag, History
row, date-group header, contribution cell/legend hoặc pagination component.

`ScreenShell` luôn dùng `ScrollView`. History data được giữ tới reset và có load-more, nên production
list không được lồng một virtualized list trong `ScrollView`. Đề xuất mở rộng backward-compatible
`ScreenShell` với non-scroll/body variant hoặc một primitive chung tương đương, default behavior giữ
nguyên cho mọi consumer; History `SectionList` sở hữu scroll/virtualization.

### 3.6. Application, lifecycle, analytics và test harness

- Chưa có History member trong `MobileApplicationFacade`, controller hoặc provider hook.
- Shop/Room controllers là reusable pattern: `idle/loading/ready/error`, preserve stale committed
  projection, coalesce retry, generation guard drop late completion, `activate/deactivate/dispose`.
- `useFocusEffect` đã là route-focus pattern; `AppVisibilityController` có thể hỗ trợ foreground
  refresh mà không làm UI sở hữu business rule.
- `history_viewed` đã nằm trong typed analytics allowlist và SQLite mapper; chưa có recorder/hook.
- Provider/PostHog delivery chưa có và thuộc EPIC-11.
- Vitest, host `node:sqlite`, iOS/Android JS export, boundary/hygiene/device-guide validators và
  isolated database fixtures đã có. Không có EPIC-09-specific fixture hoặc guide.

## 4. Product scope và out-of-scope

### 4.1. In scope đã có authority

- Recent Standard Focus history từ durable SQLite.
- Mỗi row hiển thị configured duration, work tag và terminal status.
- History gồm standard Focus `completed`, `failed`, `cancelled`; loại `running`.
- Onboarding trial và tất cả Short/Long Break bị loại khỏi standard history.
- Tổng completed standard Focus minutes theo local day.
- Contribution graph cơ bản theo ngày, chỉ completed standard Focus đóng góp intensity.
- Local day lấy từ immutable `scheduled_end_local_date`.
- Basic loading, empty, error, retry, offline, relaunch và accessibility behavior.
- `history_viewed` local best-effort theo event allowlist đã duyệt, sau owner xác nhận timing.
- Retire chỉ History prototype khi production owner thay thế hoàn toàn.

### 4.2. Out of scope

- Trial hoặc Break history UI; active/running session trong History.
- Weekly/monthly deep analytics, report/export, filters, search, custom range, streak UI.
- Cloud history, account, sync, remote database hoặc network requirement.
- Delete/edit/reclassify session; partial reset; repair/mutation từ query/render.
- Actual elapsed/overtime/partial minutes; reward/XP/Coin grant hoặc recomputation.
- Contribution-based reward/unlock, social comparison, leaderboard hoặc share image.
- Provider delivery/worker/dashboard, new analytics event hoặc arbitrary properties; EPIC-11 owns it.
- Settings productionization, Pet naming, other prototype retirement, SDK/dependency/native upgrade.

## 5. Locked invariants

1. Standard history filter luôn là `session_type=focus AND focus_variant=standard` và terminal status.
2. Trial, running Focus và mọi Break không xuất hiện trong standard History.
3. Failed/cancelled standard Focus có thể xuất hiện nhưng đóng góp đúng `0` contribution minutes.
4. Completed contribution dùng configured duration, không dùng wall-clock elapsed, overtime, XP hoặc
   `resolvedAt-startedAt`.
5. History/contribution group bằng immutable `scheduled_end_local_date`; không derive lại bằng timezone
   hiện tại.
6. Cross-midnight/DST/timezone-change behavior giữ theo `DM-OPEN-002`.
7. History order giữ production query baseline `endsAt DESC, id ASC`; cursor không dùng array index.
8. Query/render/read không ghi hoặc sửa session/reward/profile/settings.
9. SQLite là durable authority; controller/store chỉ giữ replaceable projection.
10. Corrupt/overflow/missing fact fail closed; UI không clamp, repair, seed mock hoặc đoán status.
11. Core History/Contribution hoạt động offline và giữ cùng projection sau cold relaunch.
12. Graph/status không truyền đạt bằng màu hoặc motion duy nhất.
13. `history_viewed` là side effect local ngoài read result; failure không làm History fail.
14. Không thêm schema/dependency/native/provider khi chưa có proof và owner gate riêng.

## 6. Risk register

| ID | Risk | Impact | Mitigation/owner | Story |
|---|---|---|---|---|
| R09-01 | Prototype data/màu lọt vào production | False history/product decision | Typed projection only; static no-mock/no-prototype gate | 01/04/05 |
| R09-02 | Trial/Break/running bị hiển thị | Sai product history | Existing filters + mixed real SQLite fixture + regression | 01 |
| R09-03 | Failed/cancelled cộng phút | Sai contribution | Pure aggregation/intensity tests + query regression | 03 |
| R09-04 | Dynamic timezone regroup | Ngày/tổng thay đổi sau relaunch/travel | Chỉ đọc persisted local-day key; cross-midnight/DST fixtures | 01/03 |
| R09-05 | Pagination duplicate/missing ở equal timestamp | Danh sách không ổn định | `(endsAt,id)` cursor; merge by stable ID; insert-between-pages tests | 02 |
| R09-06 | Initial/load-more/refresh race publish stale result | UI nhảy lùi hoặc append sai | Generation token, single-flight/coalescing, stale completion drop | 01/02/05 |
| R09-07 | Read error xóa dữ liệu cũ | Mất ngữ cảnh dù DB chỉ lỗi tạm thời | Preserve last committed projection + inline Retry | 02/05 |
| R09-08 | `ScreenShell` + virtual list nested scroll | Jank/a11y/layout lỗi | Backward-compatible non-scroll shell variant; SectionList owns scroll | 02 |
| R09-09 | `OPEN-006` bị chốt ngầm | Sai Product/Design authority | Neutral semantic fallback; final colors blocked by confirmation 04 | 03/04 |
| R09-10 | Graph phụ thuộc màu/ô quá nhỏ | Không dùng được với screen reader/grayscale/text lớn | Visible minutes/legend, per-cell label, logical order, no color-only meaning | 04 |
| R09-11 | Analytics retry/provider làm fail screen | Core offline flow bị block | Deterministic local enqueue best-effort; no provider | 05 |
| R09-12 | Fixture chọn `pixeldoro.db` | Owner data bị mutate | Finite `__DEV__` allowlist + exact disposable prefix + static test | all |
| R09-13 | Component phình thành god screen | Khó test/reuse, vượt 300 lines | Controller owns data; split list/row/group/graph by responsibility | 02/04 |
| R09-14 | Formal evidence bị ghi PASS khi chưa chạy | Exit evidence không đáng tin | Guide begins `NOT_RUN`; owner/formal status separated | all/05 |

## 7. Proposed architecture

### 7.1. Dependency flow

```text
History tab route
  → History controller hooks (subscribe + activate/deactivate/retry/loadMore)
  → mobile HistoryController
  → shared LoadFocusHistoryPage / BuildContributionProjection
  → existing StandardFocusHistoryQuery / ContributionQuery ports
  → existing SQLite adapters and canonical mappers
  → typed HistoryScreenProjection
  → HistoryScreen + focused components

History focus episode
  → HistoryAnalyticsRecorder
  → existing bounded local analytics queue
  → provider delivery remains EPIC-11
```

### 7.2. Layer ownership

- **Domain/shared Application:** validate canonical local dates; map durable facts to immutable row/day
  projection; zero-fill ordered range; apply owner-approved fixed intensity thresholds; merge pages
  deterministically without mutation.
- **Mobile Application:** controller state, loading/retry/stale/load-more lifecycle, generation guard,
  coalescing, current-day range request, error mapping and best-effort analytics orchestration.
- **Infrastructure:** keep SQL and row mapping; strengthen canonical corrupt-date/overflow fail-closed
  validation only where audit proves current mapper gap; no business/palette/UI rule in SQL.
- **Presentation:** render typed projection, accessibility, layout and user intent only.
- **Composition:** inject existing query ports, clock/local calendar, analytics queue and recovery owner;
  expose controller through facade/provider.

### 7.3. Read and transaction boundary

- History/contribution are read-only. No session/reward/profile transaction or `BEGIN IMMEDIATE` is
  needed merely to render.
- Each repository call reads committed SQLite facts. One controller generation publishes only after
  all required reads for that projection complete; a later activation invalidates earlier results.
- Initial history can become ready independently of the contribution panel so a graph read failure
  does not erase valid list data. Retry ownership is explicit per projection.
- Pagination appends only a successful page; failed/stale pages leave existing entries/cursor intact.
- Reads, retries, focus/foreground refresh and analytics must not call a session mutation repository.

### 7.4. Planned module shape; final paths belong to Story implementation plans

```text
packages/application/src/history/
  focus-history.projection.ts
  contribution.projection.ts
  load-focus-history-page.use-case.ts

apps/mobile/src/application/history/
  history.controller.ts
  history-analytics.recorder.ts

apps/mobile/src/composition/history/
  create-history-slice.ts
apps/mobile/src/composition/review/
  history-review-fixture.ts

apps/mobile/src/presentation/features/history/
  index.ts
  history-screen.tsx
  focus-history-row.tsx
  history-date-group.tsx
  contribution-graph.tsx
  contribution-cell.tsx
  contribution-legend.tsx
```

Không bắt buộc tạo mọi file trên nếu responsibility vẫn nhỏ; hard limit 300 lines và split review
240–260 lines áp dụng. Không tạo package/module chung chỉ để khớp sơ đồ minh họa.

## 8. Ordered User Story summary

Thứ tự năm Story giữ data correctness trước, rồi projection/list, contribution semantics/visual và
cuối cùng lifecycle/analytics/exit. Story 01 có production user-visible first page nên không phải một
horizontal “backend-only” slice; Story 03 có neutral semantic day panel trước final color treatment.

| Order | Story | User outcome | Priority | Dependencies | Initial status |
|---:|---|---|---|---|---|
| 1 | US-09-01 — Truthful Standard Focus History First Page | History tab đọc và hiển thị first page terminal Standard Focus thật từ SQLite | P0 | EPIC-08; confirmations 05/08/10 | DONE_OWNER_ACCEPTED — `18057faf...` |
| 2 | US-09-02 — Date-grouped Pagination và Resilient Refresh | User xem thêm history theo ngày mà không duplicate/mất dữ liệu khi refresh lỗi | P0 | 01; confirmations 01/02/06 | DONE_OWNER_ACCEPTED — `91d0612...` |
| 3 | US-09-03 — Stable Daily Contribution Projection | User thấy đủ các ngày trong range và đúng completed minutes/intensity semantics | P0 | 01; confirmations 03/04 | DONE_OWNER_ACCEPTED — `c0291ec...` |
| 4 | US-09-04 — Production Contribution Graph và Accessibility | User đọc graph rõ trên small screen, screen reader, largest text và grayscale | P1 | 02/03; `OPEN-006` confirmation 04 | DONE_OWNER_ACCEPTED — `cdce571...` |
| 5 | US-09-05 — Offline Lifecycle, Analytics, Prototype Integrity và Epic Exit | History ổn định qua refocus/relaunch/offline và sẵn sàng exit evidence | P1 | 01→04; confirmations 06/07/09/10 | PLANNING_AWAITING_OWNER_CONFIRMATION |

## 9. US-09-01 — Truthful Standard Focus History First Page

- **User outcome:** mở tab Lịch sử và thấy first page từ committed SQLite, hoặc empty/loading/error
  trung thực; không còn sample row hay prototype control.
- **Priority/order:** `P0 / 1`.
- **Dependencies:** EPIC-08 exit; existing history query/persistence graph; owner confirmations 05/08/10.
- **In scope:** typed row projection; existing stable filter/order; first page read; production
  controller route wiring; minimal flat list; initial loading/empty/read error/Retry; corrupt fail closed.
- **Out of scope:** date grouping, load more, contribution graph, analytics, provider, mutation.
- **Durable facts read:** standard terminal session ID, status, mode, work tag, configured duration,
  timestamps, scheduled-end local date/offset.
- **Durable facts written:** none.
- **Domain rules:** exact include/exclude matrix; configured duration is label, not completed claim;
  canonical local date; stable row key; status is explicit text.
- **Application owner:** `LoadFocusHistoryPage` + `HistoryController` first-page state.
- **Transaction/read boundary:** read-only existing query, default first-page size only after confirmation;
  no write/repair; one generation token drops late result.
- **UI states:** idle/loading; empty; ready; transient read error + Retry; invalid/corrupt → safe recovery.
- **Navigation:** History resting tab; `useFocusEffect` activate/deactivate; leaving tab does not mutate or
  clear durable data.
- **Offline/relaunch:** local-only; same rows and order after close/reopen.
- **Analytics:** none in this Story; `history_viewed` remains US-09-05.
- **Accessibility:** screen header first; row is one logical accessible group containing duration, tag,
  status and date; status visible in text, no color-only dot.
- **Owner approval gate:** confirmations 05, 08 and 10; Story plan/coding waits for breakdown approval.
- **Rollback notes:** remove new History slice/wiring and restore prior History route file; migration
  remains untouched. Never roll back owner session data.

### 9.1. Acceptance criteria

- [x] Route renders production projection and has no hard-coded history data, `PrototypeBadge` or review controls.
- [x] Only terminal Standard Focus appears; running/trial/Short Break/Long Break is absent.
- [x] Completed, failed and cancelled rows preserve exact status, configured duration and work tag.
- [x] Order is `endsAt DESC, id ASC`; stable IDs are React keys.
- [x] Failed/cancelled copy cannot imply completed minutes or reward.
- [x] Empty database renders approved empty state and no fake row/graph.
- [x] Read failure renders Retry; corrupt date/timestamp/status/duration fails closed without clamp/repair.
- [x] Initial retry coalesces; result after deactivate/unmount is dropped.
- [x] Render/query/retry produces identical sessions/profile/reward database fingerprint.
- [x] Screen/route imports no SQLite repository, SQL, provider or domain business rule.

### 9.2. Automated tests

- [x] Domain/Application: full included/excluded status/type/variant table.
- [x] Projection: completed/failed/cancelled labels; Vietnamese tag labels; immutable output.
- [x] Canonical date/timestamp/duration safe-integer and corrupt/overflow rejection.
- [x] Controller: idle/loading/ready/empty/error/retry, coalesced load, deactivate/unmount stale drop.
- [x] SQLite: fresh DB, mixed terminal/running/trial/Break, equal `endsAt` tie order, reopen.
- [x] Read-only fingerprint before/after initial load and retry.
- [x] Component: three statuses, long Vietnamese text, semantic grouping, stable keys.
- [x] Static: thin route, no prototype/mock/SQL/repository import, files below size limits.

### 9.3. Fixture/data requirements

Dev-only finite family `history_first_page_*`, disposable database prefix `pixeldoro-us-09-01-`:
`history_first_page_empty`, `history_first_page_mixed`, `history_first_page_read_failure_once`,
`history_first_page_corrupt`. Valid mixed seed must use production migration and valid lifecycle
records/receipts; corrupt injection belongs to automated harness unless a safe isolated fixture can
guarantee cleanup.

### 9.4. Manual smoke checklist

Proposed file: `apps/mobile/test/device/focus-history-first-page-smoke.md`; initial `Status: NOT_RUN`.

- [ ] Record implementation SHA, platform/device/OS, build/runtime, timezone, network, accessibility
  settings, env name and exact isolated database.
- [ ] Empty opens with no sample content; mixed opens in expected stable order with all three statuses.
- [ ] Trial, running Focus and both Break kinds are absent.
- [ ] One-shot read error shows Retry; Retry loads same durable rows.
- [ ] Leave/re-enter tab while load is pending; no stale flash or duplicate row.
- [ ] Airplane mode and cold relaunch preserve results.
- [ ] VoiceOver/TalkBack and largest text read full row meaning; small portrait remains scrollable.
- [ ] Cleanup fixture database and `unset EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE`; normal launch proves
  `pixeldoro.db` was never selected.

### 9.5. DoR / DoD

- [x] **DoR:** breakdown and confirmations 05/08/10 approved; projection/error API reviewed.
- [x] **DoR:** exact page size from confirmation 01 is available even if pagination UI is Story 02.
- [x] **DoD:** acceptance/automated/static tests pass; guide exists and remains honest.
- [x] **DoD:** output visible on Development Build; exact SHA/report/evidence status recorded.
- [x] **Next gate:** owner accepts Story 01 before Story 02 planning/coding.

## 10. US-09-02 — Date-grouped Pagination và Resilient Refresh

- **User outcome:** user xem history theo từng local day, biết completed minutes của day và bấm xem
  thêm mà dữ liệu cũ vẫn giữ khi load/refresh tạm lỗi.
- **Priority/order:** `P0 / 2`.
- **Dependencies:** US-09-01; confirmations 01/02/06.
- **In scope:** deterministic date grouping; per-day completed-minute summary; cursor page merge;
  load-more state/retry/end; foreground/refocus refresh; stale committed projection/notice; virtualized list.
- **Out of scope:** filter/search/custom range, edit/delete, infinite background prefetch, graph.
- **Durable facts read:** same history facts and `nextCursor`; no new fact.
- **Durable facts written:** none.
- **Domain rules:** day key is persisted scheduled-end date for every included status; day total sums
  configured minutes of completed rows only; page merge dedupes by session ID and preserves query order.
- **Application owner:** History controller owns first-page refresh versus append state, cursor and race.
- **Transaction/read boundary:** every page read-only; append publishes atomically only after success;
  refresh replaces only after successful first page.
- **UI states:** ready/refreshing/stale-error; loading-more/load-more-error/end; empty only when successful
  first-page read is empty.
- **Navigation:** tab re-entry and app foreground request coalesced first-page refresh; scroll position
  is presentation state and need not survive process relaunch.
- **Offline/relaunch:** reads all retained local rows; cursor is not persisted; cold launch starts first page.
- **Analytics:** none added.
- **Accessibility:** date header precedes rows; day total has explicit label; Load more is a button with
  busy/disabled state and minimum touch target; reading order follows visual order.
- **Owner approval gate:** confirmations 01/02/06.
- **Rollback notes:** fall back to accepted first-page screen; no DB rollback or data deletion.

### 10.1. Acceptance criteria

- [x] Date groups are descending and preserve row order inside each group.
- [x] Completed total per group excludes failed/cancelled while those rows stay visible.
- [x] Initial page and every next page use approved page size and existing `(endsAt,id)` cursor.
- [x] Equal timestamps across page boundary neither duplicate nor skip stable IDs.
- [x] New terminal row appearing before Load more does not corrupt older-page merge.
- [x] Load-more failure retains all loaded rows/cursor and provides retry of the same read intent.
- [x] End-of-list removes/disables Load more truthfully; no hidden retention cap is implied.
- [x] Refocus/foreground refresh is coalesced; late older response cannot replace newer generation.
- [x] Refresh failure keeps committed rows with `InlineNotice`; successful retry clears stale notice.
- [x] History uses one scroll owner; no virtualized list nested in `ScrollView`.

### 10.2. Automated tests

- [x] Pure grouping: mixed statuses, multiple days, page boundary splitting same day, empty input.
- [x] Completed-day sum: zero completed with failed/cancelled rows; safe integer overflow fail closed.
- [x] Cursor: 20/21/40+ rows, same `endsAt`, duplicate response, new-row-between-pages.
- [x] Controller: append single-flight, append vs refresh race, rapid Retry, deactivate/dispose stale drop.
- [x] SQLite: MVP-representative retained dataset and query-plan index evidence.
- [x] Component: SectionList sections/headers/rows/load-more states, largest-text-shaped props.
- [x] ScreenShell regression: default ScrollView consumers unchanged; non-scroll variant lays out History.
- [x] Read-only fingerprint across page, failed append, refresh and relaunch.

### 10.3. Fixture/data requirements

Prefix `pixeldoro-us-09-02-`: `history_grouped_21`, `history_equal_end_boundary`,
`history_load_more_failure_once`, `history_refresh_failure_once`, `history_new_terminal_on_refresh`.
The fixture must not seed orphan/corrupt production facts; race/corrupt cases stay automated when UI
control would be nondeterministic.

### 10.4. Manual smoke checklist

Implemented file: `apps/mobile/test/device/focus-history-pagination-lifecycle-smoke.md`;
`Status: NOT_RUN` pending owner execution.

- [ ] Record all required metadata, fixture env and isolated DB name.
- [ ] Verify first page, date headers and completed-day totals for mixed status rows.
- [ ] Load next page crossing a date group; no duplicate/header jump; end state is truthful.
- [ ] Trigger one-shot append failure; old rows stay; Retry appends exactly once.
- [ ] Background/foreground and tab switch/refocus; stale content remains during refresh and then updates.
- [ ] Kill/relaunch offline; first page/order/group totals match durable data.
- [ ] VoiceOver/TalkBack order, largest text, small portrait and Load-more touch target.
- [ ] Cleanup/reset isolated DB, unset fixture and launch normally.

### 10.5. DoR / DoD

- [x] **DoR:** US-09-01 owner accepted; confirmations 01/02/06 approved.
- [x] **DoR:** ScreenShell extension API and regression consumers reviewed.
- [x] **DoD:** paging/grouping/lifecycle automated tests and manual guide complete; no write path added.
- [x] **DoD:** no component >300 lines; controller projection types were split into a focused file.
- [x] **Next gate:** owner accepted Story 02 at exact SHA `91d0612...`; Story 03 planning is open.

## 11. US-09-03 — Stable Daily Contribution Projection

- **User outcome:** user sees a neutral, textual daily contribution panel with every day in the approved
  range and exact completed Standard Focus minutes, including zero-minute days.
- **Priority/order:** `P0 / 3`.
- **Dependencies:** US-09-01; confirmations 03/04.
- **In scope:** current range calculation; sparse-query zero fill; completed totals/count; fixed intensity
  band mapping after approval; low-fidelity neutral day cells/labels; empty and read error.
- **Out of scope:** final colors/polish, week/month navigation, streak, reward, heatmap beyond approved range.
- **Durable facts read:** contribution date, completed minutes and completed session count.
- **Durable facts written:** none.
- **Domain rules:** inclusive ordered ISO date range; missing dates become zero; only completed Standard
  Focus contributes configured minutes; no current-time timezone regroup of stored rows.
- **Application owner:** contribution projection builder and controller subprojection; current day from
  injected clock + local calendar, never `new Date()` inside Domain.
- **Transaction/read boundary:** read-only range query; list remains usable if contribution read fails.
- **UI states:** neutral loading, zero-range empty contribution, ready semantic cells, local Retry.
- **Navigation:** lives in History tab header; no new route or date-picker.
- **Offline/relaunch:** all local; same stored days after timezone change; only “today” range anchor may
  follow the device's new current local day.
- **Analytics:** no new graph event.
- **Accessibility:** each day exposes date, minutes, session count and intensity text; visible numeric
  minutes/legend ensure no color-only meaning.
- **Owner approval gate:** range confirmation 03 and Product `OPEN-006` confirmation 04.
- **Rollback notes:** remove contribution subprojection/panel; accepted History list remains available.

### 11.1. Acceptance criteria

- [x] Range has exactly the owner-approved consecutive local dates ending on current local day.
- [x] Sparse SQL result is zero-filled; duplicate/out-of-range/unsorted/corrupt facts fail closed.
- [x] Daily total equals sum of configured duration for completed standard sessions only.
- [x] Failed/cancelled/trial/running/Break never affects minutes, count or band.
- [x] Cross-midnight session appears on persisted scheduled-end date.
- [x] Delayed reconciliation, DST boundary and timezone change do not regroup stored session day.
- [x] Intensity thresholds are fixed, deterministic and not persisted.
- [x] Zero and non-zero days have explicit numeric/text meaning independent of color.
- [x] Aggregate or date arithmetic overflow/corruption enters typed error; no clamp/mock fallback.
- [x] Empty history produces all zero days, not a missing/short graph.

### 11.2. Automated tests

- [x] Pure date-range generation across month/year/leap day and DST-adjacent calendar dates.
- [x] Zero fill/order for sparse rows and exact inclusive endpoints.
- [x] Band boundaries at every approved threshold ±1; large safe integer and overflow rejection.
- [x] Included/excluded session matrix and configured-duration aggregation.
- [x] SQLite cross-midnight, timezone/offset change, delayed reconciliation and reopen.
- [x] Controller independent list/contribution loading/error/retry and stale completion drop.
- [x] Neutral panel component exposes numeric minutes, count and stable day key.
- [x] Fingerprint proves contribution reads never mutate sessions/rewards/profile.

### 11.3. Fixture/data requirements

Prefix `pixeldoro-us-09-03-`: `contribution_zero_week`, `contribution_mixed_week`,
`contribution_threshold_edges`, `contribution_cross_midnight`, `contribution_timezone_changed`,
`contribution_read_failure_once`. DST/corrupt/overflow scenarios should remain automated if a device
cannot reproduce them deterministically.

### 11.4. Manual smoke checklist

Implemented file: `apps/mobile/test/device/contribution-projection-smoke.md`;
`Status: OWNER_QUICK_UI_SMOKE_REPORTED_PASS` at `c0291ec...`. Structured rows remain `NOT_RUN`.

- [ ] Record implementation SHA/device/build/timezone/network/a11y/env/database.
- [ ] Empty fixture shows exact zero days and zero-minute labels.
- [ ] Mixed fixture matches known daily minutes/count and excludes failed/cancelled/trial/Break.
- [ ] Cross-midnight/timezone fixture remains on persisted day after app/device timezone change.
- [ ] One-shot query error affects panel only; Retry restores exact values and leaves list intact.
- [ ] Cold relaunch and airplane mode retain the same stored-day projection.
- [ ] Screen reader reads date/minutes/count/band; grayscale still exposes exact meaning.
- [ ] Cleanup/unset and normal launch check.

### 11.5. DoR / DoD

- [x] **DoR:** Story 01 accepted; confirmations 03/04 approved.
- [x] **DoR:** exact range/bands/palette fallback are traceable to owner decision.
- [x] **DoD:** domain/application/SQLite/component tests and neutral panel pass.
- [x] **DoD:** no contribution aggregate/color/level stored in SQLite/Zustand authority.
- [x] **Next gate:** owner accepted Story 03 at exact SHA `c0291ec...`; Story 04 planning is open.

## 12. US-09-04 — Production Contribution Graph và Accessibility

- **User outcome:** user understands daily effort at a glance and can still read exact meaning with
  screen reader, grayscale, largest text or Reduce Motion.
- **Priority/order:** `P1 / 4`.
- **Dependencies:** US-09-02, US-09-03 and `OPEN-006` resolved through confirmation 04.
- **In scope:** final cell/legend palette; responsive graph composition; visible day/minute labels;
  accessibility order/labels; contrast/grayscale; loading/error/Retry/stale panel integration.
- **Out of scope:** animation-heavy heatmap, tap tooltip/detail route, calendar paging, streak/share.
- **Durable facts read:** typed contribution projection only; components never receive raw SQLite rows.
- **Durable facts written:** none.
- **Domain rules:** none in component; it consumes band/minute/date projection.
- **Application owner:** existing contribution builder/controller; Presentation only lays out.
- **Transaction/read boundary:** read-only; render and accessibility focus never trigger query mutation.
- **UI states:** loading; ready all-zero/mixed; error; stale-refresh notice; no missing-day collapse.
- **Navigation:** History tab only; graph is non-interactive under proposed MVP Option A.
- **Offline/relaunch:** local projection, bundled colors/components, no network/asset download.
- **Analytics:** no graph-interaction event.
- **Accessibility:** chronological order; full day/date/minutes/count/band label; visible numeric fallback;
  legend has text ranges; decorative color is hidden from duplicate focus; no required motion.
- **Owner approval gate:** Story 03 is accepted and `OPEN-006` is resolved; Story-04 visual/a11y
  implementation still requires approval of its dedicated plan confirmations.
- **Rollback notes:** revert visual component to accepted neutral Story-03 panel; never alter facts/query.

### 12.1. Acceptance criteria

- [x] Final swatches and thresholds exactly match resolved `OPEN-006`; no prototype color authority.
- [x] Seven/date-range cells render in chronological order with stable keys and zero-day cells.
- [x] Cell/legend contains exact numeric/text meaning independent of color.
- [x] Screen-reader props expose one concise label per day without duplicate decorative focus.
- [ ] Largest text wraps labels/legend without clipping; small portrait can scroll without horizontal loss.
- [x] Touch-target rule is not falsely applied to non-interactive cells; no affordance suggests tap.
- [x] Reduce Motion changes no meaning; graph has no animation.
- [x] Loading/error/retry/stale behavior does not hide valid History list.
- [ ] Long Vietnamese labels and locale date copy remain readable at largest device text.
- [x] Graph/list/screen modules respect responsibility and line limits.

### 12.2. Automated tests

- [x] Component structure for every band, zero/mixed/full range and stable order.
- [x] Accessibility labels, roles, hidden decorative children and reading order.
- [x] Contrast token/static assertions; device visual contrast remains manual.
- [x] No truncation/downscale API and no horizontal-scroll layout contract; device largest text remains manual.
- [x] No animation/gesture/network/repository import.
- [x] Loading/error/stale panel does not replace ready list.
- [x] Common ScreenShell/Panel/State/InlineNotice regressions pass in full suite.
- [x] Static graph semantics remain derived and non-persisted.

### 12.3. Fixture/data requirements

Reuse valid Story-03 data plus `contribution_all_bands` and `contribution_long_labels`; exact database
prefix `pixeldoro-us-09-04-`. Palette/fallback is bundled and deterministic; no remote art.

### 12.4. Manual smoke checklist

Implemented file: `apps/mobile/test/device/contribution-graph-accessibility-smoke.md`; `Status: NOT_RUN`.

- [ ] Record exact metadata and owner-approved `OPEN-006` decision reference.
- [ ] Compare all-zero, all bands and mixed-status fixtures against expected minutes/ranges.
- [ ] Inspect small portrait and both platform font scaling at largest text.
- [ ] VoiceOver/TalkBack reads chronological date/minutes/count/band once per cell.
- [ ] Grayscale/color-filter and contrast inspection prove non-color semantics.
- [ ] Toggle Reduce Motion; no lost meaning, focus jump or visual dependency.
- [ ] Background/refocus/error/Retry preserve History list and recover graph.
- [ ] Airplane mode/cold relaunch; cleanup database/env and normal launch.

### 12.5. DoR / DoD

- [x] **DoR:** Stories 02/03 accepted and `OPEN-006` resolved explicitly.
- [x] **DoR:** final palette/threshold/legend copy approved through `US0904-CONFIRM-01→06 Option A`.
- [x] **DoD:** component/a11y/static tests pass; manual status is recorded, never inferred.
- [x] **DoD:** final visual owner acceptance bound to exact SHA `cdce571...`; Story 05 planning open.

## 13. US-09-05 — Offline Lifecycle, Analytics, Prototype Integrity và Epic Exit

- **User outcome:** History/Contribution stays trustworthy through tab switches, background, offline and
  cold relaunch; viewing History records at most the approved local event without affecting screen.
- **Priority/order:** `P1 / 5`.
- **Dependencies:** US-09-01→04; confirmations 06/07/09/10.
- **In scope:** full route/app lifecycle coalescing; `history_viewed` local recorder; analytics opt-out/
  queue failure; isolated aggregate fixture; History-only prototype retirement/static gates; full
  regression/platform evidence and Epic exit candidate.
- **Out of scope:** PostHog/provider delivery, analytics backfill/dashboard, Settings production UI,
  deleting all prototype scaffolding, formal cross-Epic certification beyond approved gate.
- **Durable facts read:** all History/contribution facts and analytics-enabled setting snapshot.
- **Durable facts written:** only one bounded `analytics_events` side-effect row per approved focus
  episode when enabled; no product session/history write.
- **Domain rules:** no new product rule; deterministic event identity and closed `{}` properties.
- **Application owner:** History controller lifecycle + HistoryAnalyticsRecorder; Bootstrap recovery
  remains critical owner for corruption.
- **Transaction/read boundary:** history reads read-only; analytics enqueue happens best-effort outside
  reads/session transactions. Provider failure cannot exist in this Epic path.
- **UI states:** full ready/empty/loading/error/stale/load-more set; no analytics-visible error.
- **Navigation:** reselect/refocus/foreground behavior follows confirmation 06; only History route loses
  prototype authority; other later-owner routes remain unchanged.
- **Offline/relaunch:** full functionality in airplane mode; queue remains bounded local; cold relaunch
  reconstructs projection from SQLite and does not invent/backfill a view event unless a new focus episode
  is actually activated under approved semantics.
- **Analytics:** only `history_viewed`, deterministic ID, `{}`, manual allowlist, opt-out skip, no provider.
- **Accessibility:** aggregate regression covers list/group/graph/states/buttons/screen reader/largest
  text/Reduce Motion/grayscale.
- **Owner approval gate:** confirmations 06/07/09/10 and final exact-SHA smoke/exit authorization.
- **Rollback notes:** remove recorder/hook/EPIC-09 fixture and restore prior accepted production
  History; keep bounded queue/schema/other prototype consumers. If event hook is rolled back, no session
  or product row is touched; queued analytics follows existing retention/reset policy.

### 13.1. Acceptance criteria

- [ ] Initial focus, tab refocus and foreground requests are coalesced per approved lifecycle policy.
- [ ] Background/unmount/dispose drops late completions and releases listeners.
- [ ] Cold relaunch/offline returns identical durable list/group/contribution facts.
- [ ] `history_viewed` timing/ID/properties exactly match confirmation 07.
- [ ] Analytics disabled, queue rejection or thrown error changes no History state/navigation/facts.
- [ ] No duplicate/backfill event from Retry, Load more, graph render, accessibility focus or stale refresh.
- [ ] History route/screen has no prototype/mock fallback or direct repository/SQL/business rule.
- [ ] Settings and other later-owner prototype code remains intact; root provider is not removed.
- [ ] Fixture is finite, `__DEV__`, default-absent and can never select/mutate `pixeldoro.db`.
- [ ] No schema/migration/dependency/native/provider drift.
- [ ] Typecheck/lint/tests/boundary/hygiene/device validator/JS exports/diff check are evidenced, not assumed.
- [ ] Exact implementation SHA, owner quick UI/formal status and deferred items are recorded honestly.

### 13.2. Automated tests

- [ ] Controller lifecycle: focus/refocus/background/foreground/unmount/dispose and race permutations.
- [ ] Analytics: deterministic one-per-focus episode, `{}`, enabled/disabled, dedupe, queue failure/throw.
- [ ] Real SQLite aggregate: mixed retained history, paging, graph, timezone/relaunch, analytics isolation.
- [ ] Fingerprint before/after every read/render/retry proves only expected analytics side-effect may differ.
- [ ] Route integrity: production facade only; no prototype/mock/repository/SQL.
- [ ] Prototype ownership: Settings and remaining later-Epic branches still compile and test.
- [ ] Common-component regressions, max-lines audit and stable-key scan.
- [ ] Fresh database, MVP-representative large dataset, corrupt/read failure and recovery.
- [ ] iOS JS export, Android JS export, typecheck, lint, Vitest, boundaries, repository hygiene,
  device-guide validator and `git diff --check` at candidate SHA.

### 13.3. Fixture/data requirements

Prefix `pixeldoro-us-09-05-`: `epic_09_empty`, `epic_09_mixed_40`, `epic_09_offline_relaunch`,
`epic_09_read_failure_once`, `epic_09_analytics_failure_once`, `epic_09_timezone_changed`.
All valid facts must come from migration/production lifecycle commands or consistent immutable receipts.
Race/corrupt/destructive cases stay automated. Unknown env value selects no fixture.

### 13.4. Manual smoke checklist

Proposed file: `apps/mobile/test/device/epic-09-exit-smoke.md`; `Status: NOT_RUN`.

- [ ] Record SHA, platform/device/OS, build/runtime, timezone, network, VoiceOver/TalkBack, largest
  text, Reduce Motion, grayscale/filter, env and isolated DB.
- [ ] Run empty, mixed and >one-page happy paths; verify list/group/totals/graph.
- [ ] Trigger initial/append/graph/stale-refresh errors and exact Retry behavior.
- [ ] Switch tabs, background/foreground, rotate if supported and cold relaunch.
- [ ] Enable airplane mode before launch; History remains complete and no provider is required.
- [ ] Verify one view event per approved focus episode; opt-out/failure leaves UI unchanged.
- [ ] Run screen reader, largest text, Reduce Motion, grayscale and small portrait checks.
- [ ] Confirm no prototype badge/control in History and Settings prototype remains available.
- [ ] Reset/cleanup isolated database; unset env; normal app launch cannot see fixture data.
- [ ] Attach actual PASS/FAIL/BLOCKED evidence; do not infer physical-device/formal pass from exports.

### 13.5. DoR / DoD

- [ ] **DoR:** Stories 01→04 owner accepted; confirmations 06/07/09/10 approved.
- [ ] **DoR:** exit commands, fixtures, rollback and manual evidence owner are reviewed.
- [ ] **DoD:** all Story and Epic acceptance/tests pass with exact counts/output and SHA.
- [ ] **DoD:** manual/owner/formal evidence status is explicit; no unchecked case labeled PASS.
- [ ] **DoD:** implementation report and EPIC-09 Exit Report candidate exist only after implementation.
- [ ] **Exit gate:** owner explicitly accepts exact candidate and authorizes EPIC-09 closure/EPIC-10
  planning; no implicit next-Epic coding.

## 14. Common Component Reuse Matrix

| UI need | Component hiện có | Reuse/extend/create | Common hay feature-local | Consumers | Props/variants | Regression tests |
|---|---|---|---|---|---|---|
| Card/panel | `Panel` / `PixelPanel` | Reuse | Common | Graph, notices, current screens | `tone`, `style`, children | Existing consumers + History states |
| Chip/tag/status | `ChoiceChip` is interactive and wrong semantics | Create `HistoryStatusBadge` only; promote later if second real consumer | Feature-local | History rows | `status`, visible label, optional decorative tone | all 3 statuses, grayscale/a11y |
| Input | No common Input; not needed | Do not create | N/A | None | N/A | Static no-unneeded-input |
| Button | `PrimaryButton`, `SecondaryButton`, `Button` | Reuse | Common | Retry, Load more, current screens | label/busy/disabled/a11y label | all current consumers + paging |
| Popup/dialog/modal | `ConfirmationDialog`; no History confirmation | Do not use/create | Common existing | None in EPIC-09 | N/A | Existing regressions unchanged |
| Avatar/Pet | Pet common stack exists; History does not need Pet | Do not use/create | Common existing | None | N/A | Existing regressions unchanged |
| Header/screen shell | `ScreenHeader`, `ScreenShell` | Reuse; extend shell with backward-compatible non-scroll variant if SectionList chosen | Common | All screens; History | default scroll unchanged; non-scroll body/style | every ScreenShell consumer + History small screen |
| Empty/loading/error | `EmptyState`, `LoadingState`, `ErrorState` | Reuse; no History copy | Common | Bootstrap, Shop, History | title/body/label/Retry | existing + initial graph/list states |
| List row | None production; prototype row is mock | Create `FocusHistoryRow` | Feature-local | History list | typed row; no raw row/reward rule | statuses/tags/long text/stable identity |
| Date group header | None | Create `HistoryDateGroupHeader` | Feature-local | History SectionList | date label/completed minutes/session count | zero-completed/mixed/page merge |
| Stat display | `StatDisplay` | Reuse if day summary layout fits; do not force if it harms list header semantics | Common | Home/Shop/History | label/value | current consumers + long text |
| Calendar/contribution cell | Prototype local cell is non-authoritative | Create `ContributionCell` | Feature-local | Contribution graph | date/minutes/count/band/a11y label | all bands/zero/stable order |
| Tooltip/legend | None | Create text legend only; no tooltip under proposed non-interactive MVP | Feature-local | Contribution graph | ordered ranges + swatches/text | grayscale/largest text/a11y |
| Pagination/load-more | Common Button exists | Compose feature-local load-more state from Button; create common control only after second consumer | Feature-local | History list | idle/busy/error/end | retry/coalescing/touch target |
| Inline notice | `InlineNotice` | Reuse | Common | Stale refresh/load-more/graph notice | `announce`, children | existing + non-duplicate live region |

Common-component rules:

- [ ] Reuse production components before creation; prototype component is never authority.
- [ ] A small common extension is backward-compatible and keeps default rendering unchanged.
- [ ] Pattern gets promoted to common only with two reasonable current consumers, not speculative reuse.
- [ ] Every common change runs regression tests for all consumers.
- [ ] No component exceeds 300 lines; 240–260 lines triggers documented split review.
- [ ] No History god component fetches, aggregates, paginates, navigates, animates and renders together.

## 15. Screen Responsibility Matrix

| Owner | Allowed responsibility | Forbidden responsibility |
|---|---|---|
| `history.tsx` route | Subscribe projection/actions; route focus activation/deactivation; forward app visibility intent | SQL/repository, filter rules, aggregation, intensity, analytics identity, mock fallback |
| `HistoryScreen` | Layout header/list/graph/states; forward Retry/Load more intent | Fetching, cursor merge, timezone math, durable repair, event dedupe |
| `FocusHistoryRow` | Render typed row/status/tag/duration/date semantics | Raw SQLite row, reward derivation, inclusion rules |
| `HistoryDateGroupHeader` | Render typed day summary | Sum rows or reinterpret dates |
| `ContributionGraph` | Layout typed days/legend and a11y order | Query, zero-fill, threshold calculation, persistence |
| `ContributionCell` | Render one typed day with visible/non-color semantics | Date arithmetic, navigation side effect |
| Presentation hooks | `useSyncExternalStore`, return controller actions | Hold durable authority or call infrastructure |
| `HistoryController` | Lifecycle/state/race/coalescing/error mapping/analytics orchestration | SQL, product aggregation duplication, React navigation |
| Shared projection/use case | Pure mapping/group/merge/date-range/intensity rules | React/Expo/SQLite/provider imports |
| SQLite query/mapper | Parameterized SQL and row validation | UI copy/color, analytics, Product mutation |

## 16. Durable Fact Ownership Matrix

| Fact | Durable owner | Read/derive rule | Writes in EPIC-09 | Presentation role |
|---|---|---|---|---|
| Session identity/type/variant | `sessions` | standard Focus terminal filter | None | stable row key/display only |
| Status | `sessions.status` | completed/failed/cancelled visible; running excluded | None | explicit text/badge |
| Configured minutes | `sessions.configured_duration_minutes` | row label; contribution only when completed | None | display typed value |
| Work tag/mode | `sessions.work_tag/mode` | validate standard identity; proposed UI shows tag, not mode | None | localized label only |
| Absolute timestamps | `started_at/ends_at/resolved_at` | stable ordering by `endsAt`; validate safe order | None | no timer/reconciliation |
| Local day | `scheduled_end_local_date` | immutable grouping key, no current-zone regroup | None | display/group typed key |
| Original offset | `scheduled_end_utc_offset_minutes` | audit/validation context, not regroup input | None | normally not displayed |
| Daily minutes/count | Derived query/projection | completed standard only; missing day zero-filled | None; never table/cache authority | render graph/group summary |
| Intensity band/color | Derived, not persisted | owner-approved thresholds + Presentation palette | None | visual/text mapping |
| Pagination cursor | Application projection | `(endsAt,id)` from query | None; transient | Load more intent only |
| View analytics | `analytics_events` side-effect queue | one approved focus episode, deterministic ID, `{}` | Story 05 only | never controls screen |

## 17. Navigation/Lifecycle Matrix

| Event | Application action | Expected projection | Must not happen |
|---|---|---|---|
| First History tab focus | activate + initial list/contribution reads | loading→empty/ready/error | mock fallback or write |
| Repeated activate same focus | coalesce current load | one generation/request set | duplicate analytics/read storm |
| Load more | read next cursor | append once or preserve + retry | clear list/duplicate rows |
| Switch to another tab | deactivate/invalidate pending generation | no late publish | durable clear |
| Return to History | new focus episode refresh | stale-ready→fresh or notice | blank screen while stale truth exists |
| App background while History focused | pause nonessential refresh work | retain projection | session mutation or graph regroup |
| Foreground while still focused | coalesced refresh per confirmation 06 | fresh committed facts | double view event unless approved |
| Unmount/dispose | unsubscribe/invalidate | no publish/leak | late navigation/event |
| Cold relaunch | bootstrap then new activation | reconstruct first page/range | persisted cursor/Zustand authority |
| Airplane mode | same local path | full functionality | provider/network error |
| Existing Focus/Break route | unchanged | current owner behavior | History intercept/navigation change |

## 18. Error/Recovery Matrix

| Failure | User-visible behavior | Durable guarantee | Retry/recovery owner |
|---|---|---|---|
| Initial list query unavailable/read failed | ErrorState + Retry | zero write/fallback | History controller repeats first-page read |
| Corrupt list row/date/status/duration | Safe error/global recovery | preserve rows; no clamp/repair | existing CriticalRecovery/explicit reset only |
| Refresh failure with ready list | keep list + InlineNotice | committed projection retained | refresh read only |
| Load-more failure | keep pages + retry control | cursor/rows unchanged | repeat same cursor intent |
| Contribution read failure | list remains; graph error + Retry | no history mutation | graph read only |
| Sparse range | zero-fill days | no aggregate table/write | pure projection |
| Overflow/invalid aggregate | fail closed graph | no clamp or fake band | critical recovery if durable corruption |
| Deactivate/unmount race | drop late completion | no stale publish | next activation |
| Analytics disabled/failure | no UI error | session/history unchanged | skip or existing bounded queue policy |
| Bootstrap/database unavailable | existing global recovery barrier | no unsafe screen/read | existing Retry; reset only explicit confirmed path |
| Fixture invalid/unknown | normal app/no fixture | `pixeldoro.db` not selected by fixture | developer fixes env; no fallback seed |

## 19. Automated Test Matrix

| Layer/gate | Mandatory coverage | Story |
|---|---|---|
| Domain/pure projection | include/exclude; configured-duration aggregation; date group; range/zero-fill; thresholds; corrupt/overflow | 01–03 |
| Shared Application | page mapping/merge/cursor/order; immutable output; no mutation | 01–03 |
| Mobile Application | loading/ready/empty/error/stale; retry/coalesce; append; stale drop; lifecycle; analytics isolation | 01/02/05 |
| SQLite integration | fresh/mixed/large DB; exclusions; order/cursor; local-day/DST/timezone; corrupt/read failure; reopen | 01–05 |
| Read-only fingerprint | sessions/rewards/profile unchanged before/after read/render/retry; analytics exception isolated | all |
| Component/UI | all states; long Vietnamese; largest-text-shaped props; a11y labels/order; non-color graph; keys; small width | 01–04 |
| Common regressions | ScreenShell/Header/Panel/Button/states/InlineNotice/Stat and all existing consumers | 02/04 |
| Navigation/lifecycle | tab focus/refocus/background/foreground/unmount/relaunch; existing routes unaffected | 02/05 |
| Analytics | allowed name, exact `{}`, deterministic dedupe, opt-out/failure, no backfill/provider | 05 |
| Static/integrity | production facade only; no mock/SQL/business rule; later prototype intact; max lines; no drift | 01/05 |
| Platform | iOS JS export, Android JS export, typecheck, lint, full tests, boundaries, hygiene, guide validator, diff check | 05 |

No checkbox or matrix row may be labeled PASS until the command/scenario actually runs on the exact
candidate. Existing EPIC-02 query evidence is supporting baseline, not EPIC-09 UI evidence.

## 20. Fixture/Data Matrix

| Fixture family | Purpose | Required valid facts | Failure/race ownership | Database/cleanup |
|---|---|---|---|---|
| `history_first_page_*` | empty/mixed/read/corrupt | standard/trial/running/Break matrix | corrupt preferably automated | `pixeldoro-us-09-01-*`; reset/dispose/unset |
| `history_grouped_*` | >page, equal end, per-day totals | valid terminal standard rows across days | append/refresh one-shot failure | `pixeldoro-us-09-02-*` |
| `contribution_*` | zero/mixed/bands/cross-midnight/timezone | completed plus excluded rows and persisted local keys | DST/overflow automated | `pixeldoro-us-09-03/04-*` |
| `epic_09_*` | aggregate offline/relaunch/analytics | full retained representative dataset | lifecycle/queue failure | `pixeldoro-us-09-05-*` |

Global fixture contract:

- [ ] `EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE` only, gated by `__DEV__` + diagnostics.
- [ ] Finite allowlist; unknown/empty value selects no fixture.
- [ ] Dedicated DB name always starts `pixeldoro-us-09-`; never `pixeldoro.db`.
- [ ] Production migration/repository/query semantics are used; valid seeds respect schema/triggers.
- [ ] No fixture mutates owner normal database or bypasses production filter to create a false happy path.
- [ ] Failure injection is one-shot/scoped; destructive/corrupt/race tests stay in automated harness.
- [ ] Every guide documents cleanup, database reset/dispose and env unset.

## 21. Manual Device Evidence Matrix

Every proposed guide starts with `Status: NOT_RUN` and these required metadata fields: exact
implementation SHA, platform/device/OS, app build/runtime, timezone, network state, accessibility
settings, fixture env, dedicated isolated database, cleanup/reset and env-unset instructions.

| Story | Proposed guide | Primary manual evidence | Initial status |
|---|---|---|---|
| US-09-01 | `apps/mobile/test/device/focus-history-first-page-smoke.md` | empty/mixed/exclusions/error/Retry/relaunch/a11y | PASS_OWNER_QUICK_UI at `18057faf...`; structured breadth NOT_RUN |
| US-09-02 | `apps/mobile/test/device/focus-history-pagination-lifecycle-smoke.md` | group/page/append failure/refocus/small screen | PASS_OWNER_QUICK_UI at `91d0612...`; structured breadth NOT_RUN |
| US-09-03 | `apps/mobile/test/device/contribution-projection-smoke.md` | zero/mixed/range/local-day/timezone/error | PASS_OWNER_QUICK_UI at `c0291ec...`; structured breadth NOT_RUN |
| US-09-04 | `apps/mobile/test/device/contribution-graph-accessibility-smoke.md` | final colors, VoiceOver/TalkBack, largest text, grayscale, Reduce Motion | PASS_OWNER_QUICK_UI at `cdce571...`; structured breadth NOT_RUN |
| US-09-05 | `apps/mobile/test/device/epic-09-exit-smoke.md` | aggregate offline/relaunch/lifecycle/analytics/prototype integrity | NOT_RUN |

Race, corrupt and destructive scenarios remain automated when UI reproduction cannot be deterministic.
JS export is not physical-device evidence. Owner quick smoke and formal tester evidence are recorded as
separate classes.

## 22. Shared Definition of Ready / Definition of Done

### 22.1. Shared Definition of Ready

- [ ] Previous Story exact candidate is owner accepted.
- [ ] Breakdown plus every confirmation affecting the Story is explicitly approved; Option A is not assumed.
- [ ] User outcome, scope, durable reads/writes, layer owner and read boundary are named.
- [ ] Loading/empty/error/retry/stale/offline/navigation/a11y states are reviewable.
- [ ] Common reuse, feature-local creation and regression consumers are identified.
- [ ] Fixture cannot select normal DB; guide starts `NOT_RUN` with complete metadata/cleanup.
- [ ] Schema/dependency/native verdict is re-audited; no contrary proof exists.
- [ ] `OPEN-006` is resolved before Story 04 final visual work.

### 22.2. Shared Definition of Done

- [ ] Story acceptance and automated checklists pass with exact evidence.
- [ ] Relevant real SQLite, read-only fingerprint, race and relaunch tests pass.
- [ ] Output is observable on Development Build; owner/formal status is honest.
- [ ] Screen/component contains no SQL, inclusion rule, aggregation, timezone or analytics identity.
- [ ] No component exceeds 300 lines; 240–260 line split review is documented.
- [ ] Common changes pass every existing consumer regression.
- [ ] No Product OPEN, mock, deferred scope or later-Epic owner is promoted.
- [ ] No schema/dependency/native/provider change unless separately proven and approved.
- [ ] Implementation report, exact SHA, commands and device evidence status are recorded.
- [ ] `git diff --check`, quality, boundaries, hygiene, guide validator and platform exports pass.

## 23. EPIC-09 Exit Checklist

- [ ] EPIC-08 remains `DONE_OWNER_ACCEPTED`; no predecessor behavior regresses.
- [ ] History shows only terminal Standard Focus in stable order with duration/tag/status.
- [ ] Running Focus, onboarding trial and every Break are absent.
- [ ] Failed/cancelled remain visible but contribute zero minutes.
- [ ] Completed daily minutes use configured duration only.
- [ ] Date grouping and graph use immutable scheduled-end local day across cross-midnight/DST/timezone.
- [ ] Pagination/refresh/retry/lifecycle cannot duplicate, drop or overwrite with stale data.
- [ ] Empty/loading/error/stale states are production, recoverable and contain no mock fallback.
- [ ] Contribution range, thresholds and final colors match owner-resolved decisions.
- [ ] Graph/list remain meaningful without color/motion and pass accessibility checks with honest status.
- [ ] Full feature works offline and reconstructs from SQLite after cold relaunch.
- [ ] `history_viewed` is local, typed, deduped, opt-out aware and cannot block UI.
- [ ] History production route has no prototype authority; later-owner prototype remains intact.
- [ ] Schema `001`, dependencies, lockfile and native config have no unauthorized drift.
- [ ] Full automated/static/platform gates pass on exact candidate.
- [ ] Five Story reports/guides and exact accepted SHAs are recorded.
- [ ] Owner explicitly accepts EPIC-09 exact candidate and authorizes closure/EPIC-10 planning.

## 24. Owner Confirmation Register

### US0900-CONFIRM-01 — Page size và load-more policy

- **Vấn đề:** Product chỉ nói “recent”; existing query hỗ trợ cursor/limit nhưng không khóa UI page size.
- **Option A — đề xuất:** first page `20`, explicit “Xem thêm”, mỗi lần thêm `20`, không cap/archive
  durable history. Stable order/cursor giữ `endsAt DESC, id ASC`.
- **Option B:** tải tối đa `100` rows một lần và không có Load more trong MVP.
- **Story bị block:** US-09-01 page input; US-09-02 pagination acceptance.
- **Impact:** A giữ initial cost nhỏ và dùng capability sẵn có; B đơn giản hơn nhưng tạo UI cap mơ hồ.
- **Status:** `APPROVED_OPTION_A` — ratified by `US0902-CONFIRM-01`, owner 2026-09-11.

### US0900-CONFIRM-02 — Date grouping và completed-day summary

- **Vấn đề:** Product yêu cầu total minutes/day nhưng không nói vị trí và cách group recent list.
- **Option A — đề xuất:** group rows bằng `scheduled_end_local_date`; header mỗi day hiển thị tổng
  configured minutes của completed rows. Failed/cancelled vẫn nằm trong group nhưng không tăng total.
- **Option B:** flat recent list; daily total chỉ xuất hiện ở contribution graph.
- **Story bị block:** US-09-02.
- **Impact:** A làm local-day truth dễ hiểu và accessible hơn; B nhỏ hơn nhưng giấu một outcome Product.
- **Status:** `APPROVED_OPTION_A` — ratified by `US0902-CONFIRM-02`, owner 2026-09-11.

### US0900-CONFIRM-03 — Contribution range

- **Vấn đề:** “basic theo ngày” chưa khóa số ngày hoặc điều hướng calendar.
- **Option A — đề xuất:** rolling `7` local calendar days, gồm hôm nay, zero-fill đủ bảy; không week
  paging/date picker trong MVP.
- **Option B:** current calendar month với 28–31 cells và month navigation.
- **Story bị block:** US-09-03/04.
- **Impact:** A khớp approved prototype, small-screen và scope nhỏ; B tăng breadth/layout/date-nav tests.
- **Status:** `APPROVED_OPTION_A` — ratified by `US0903-CONFIRM-01`, owner 2026-09-12.

### US0900-CONFIRM-04 — `OPEN-006` intensity thresholds và color palette

- **Vấn đề:** Product `OPEN-006` chưa chốt exact contribution thresholds/colors.
- **Option A — đề xuất:** 5 semantic bands: `0`, `1–24`, `25–49`, `50–99`, `100+` completed minutes;
  map lần lượt vào existing theme tokens `background`, `surface`, `surfaceStrong`, `accent`,
  `accentDark`, sau contrast/device review. Luôn hiển thị numeric minutes + text legend.
- **Option B:** Product/Design cung cấp một threshold/swatch set khác trước Story 03/04.
- **Story bị block:** US-09-03 intensity acceptance; US-09-04 toàn bộ final visual acceptance.
- **Impact:** A align default 25-minute rhythm, không dependency/schema và có neutral fallback; B cho
  Design control cao hơn nhưng cần exact values trước implementation.
- **Status:** `APPROVED_OPTION_A` — ratified by `US0903-CONFIRM-03/04`, owner 2026-09-12;
  `OPEN-006` resolved, final contrast acceptance remains US-09-04.

### US0900-CONFIRM-05 — History row content breadth

- **Vấn đề:** Prototype sample có reward copy; Product scope chỉ khóa duration/tag/status.
- **Option A — đề xuất:** row hiển thị configured duration, localized work tag và explicit status;
  không mode, actual clock time, XP/Coin hoặc reward copy trong MVP.
- **Option B:** thêm mode, time-of-day và committed reward cho completed rows.
- **Story bị block:** US-09-01 visual contract.
- **Impact:** A là scope nhỏ nhất và tránh biến History thành reward audit; B cần thêm copy/layout/a11y.
- **Status:** `APPROVED_OPTION_A` — ratified by `US0901-CONFIRM-02`, owner 2026-09-11.

### US0900-CONFIRM-06 — Refresh và stale-data policy

- **Vấn đề:** Chưa khóa khi nào History refresh và cách giữ projection khi read tạm lỗi.
- **Option A — đề xuất:** load ở first focus; tab refocus hoặc app foreground khi tab active tạo
  coalesced refresh; giữ last committed list/graph với inline notice và Retry. Cursor reset chỉ sau
  successful first-page refresh.
- **Option B:** chỉ load một lần mỗi app runtime; user phải relaunch để thấy data mới.
- **Story bị block:** US-09-02/05.
- **Impact:** A fresh hơn và reuse controller pattern; B ít code nhưng stale sau completed Focus.
- **Status:** `APPROVED_OPTION_A` — ratified by `US0902-CONFIRM-03/04/06`, owner 2026-09-11.

### US0900-CONFIRM-07 — `history_viewed` timing/properties

- **Vấn đề:** Event name đã allowlist nhưng exact timing/dedupe/properties chưa được khóa.
- **Option A — đề xuất:** enqueue once per History tab focus episode sau `activate`, event ID
  `history_viewed:<episodeId>`, exact `{}` properties; Retry/Load more/foreground refresh/render không
  tạo event mới; opt-out/failure skip silently. Không provider/backfill.
- **Option B:** defer hook hoàn toàn sang EPIC-11.
- **Story bị block:** analytics portion of US-09-05, không block core History UI.
- **Impact:** A giữ feature-owned historical event contract; B giảm scope nhưng không backfill được views.
- **Status:** `PENDING_OWNER`.

### US0900-CONFIRM-08 — Read error versus critical recovery

- **Vấn đề:** Cần phân biệt transient query failure và durable corruption.
- **Option A — đề xuất:** unavailable/query failure ở feature-local Error/Retry; nếu đã có ready data thì
  giữ stale. Corrupt/invalid/overflow durable fact vào existing critical recovery; không repair/reset tự động.
- **Option B:** mọi read failure vào global bootstrap recovery và che toàn app.
- **Story bị block:** US-09-01/02/03.
- **Impact:** A giữ app usable khi lỗi tạm thời nhưng fail closed cho corruption; B nhất quán đơn giản
  hơn nhưng quá rộng cho lỗi đọc một panel.
- **Status:** `APPROVED_OPTION_A` — ratified by `US0901-CONFIRM-04` and
  `US0903-CONFIRM-06`, owner reaffirmed 2026-09-12.

### US0900-CONFIRM-09 — Manual/formal evidence gate

- **Vấn đề:** Epic trước dùng owner quick smoke và deferred formal breadth; EPIC-09 cần gate rõ.
- **Option A — đề xuất:** mỗi Story cần automated gates + owner quick UI trên available iOS/Android;
  structured physical-device, full VoiceOver/TalkBack/largest-text/Reduce Motion breadth giữ
  `DEFERRED_TO_EPIC_12` trừ khi thực sự chạy; Story 04 vẫn cần explicit visual/color owner acceptance.
- **Option B:** bắt buộc full formal iOS/Android accessibility/device matrix trước EPIC-09 close.
- **Story bị block:** US-09-05 exit definition, không block Story 01 planning.
- **Impact:** A nhất quán roadmap và không tạo PASS giả; B evidence mạnh hơn nhưng cần tester/devices ngay.
- **Status:** `PENDING_OWNER`.

### US0900-CONFIRM-10 — Schema/dependency/native và prototype retirement

- **Vấn đề:** Audit thấy schema/query đủ; root prototype provider vẫn cần cho later-owner screens.
- **Option A — đề xuất:** lock `NO SCHEMA / NO DEPENDENCY / NO NATIVE CHANGE`; replace/remove prototype
  only in History route/feature, keep Settings/root provider/other prototype branches intact. Nếu phát
  hiện fact gap thực, stop Story và mở Data Model/ADR gate riêng.
- **Option B:** tạo migration/cache/history aggregate hoặc xóa toàn bộ prototype scaffolding ngay.
- **Story bị block:** implementation planning cho all Stories và US-09-05 integrity.
- **Impact:** A reuse production capability, rollback dễ và không xâm phạm EPIC-10; B tạo second truth/
  re-scope không có evidence.
- **Status:** `PENDING_OWNER`.

### 24.1. Confirmation response

Owner có thể duyệt gọn:

`Duyệt US0900-CONFIRM-01→10 theo Option A`

Việc duyệt breakdown/confirmations chỉ mở planning cho `US-09-01`; không tự cấp quyền code toàn Epic,
không tạo implementation plan Story 01 trong cùng bước này.

## 25. Deferred Checklist / Known Limitations

- [ ] Weekly/monthly analytics, calendar navigation, custom range, search/filter/export remain deferred.
- [ ] Trial/Break/running session history remains excluded; no separate history surface is planned.
- [ ] Streak UI, contribution reward/unlock/share/social comparison remain deferred.
- [ ] Cloud/account/sync/remote history and anti-cheat time authority remain out of MVP.
- [ ] Provider delivery/worker/dashboard and final analytics operations remain EPIC-11.
- [ ] Settings production UI and root prototype-provider retirement remain EPIC-10.
- [ ] Formal prior-Epic physical-device/accessibility breadth remains non-PASS until actually executed;
  proposed carry to EPIC-12 awaits confirmation 09.
- [ ] Existing Expo Doctor SDK-57 patch/CocoaPods/network warnings remain tooling debt, not EPIC-09 scope.
- [ ] MVP retention keeps all product history until confirmed full reset; very-long-term compaction is
  intentionally not designed here.
- [ ] Scroll position and pagination cursor are transient and need not survive process relaunch.
- [x] US-09-02 automated quality and platform export evidence is recorded; owner/manual device status
  remains explicitly `NOT_RUN` until executed.
- [x] US-09-03 automated quality and platform export evidence is recorded; owner/manual device status
  includes quick UI PASS at exact SHA `c0291ec...`; structured/formal breadth remains `NOT_RUN`.

## 26. Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0.0 | 2026-09-12 | Codex | Bound US-09-04 owner quick visual UI PASS to exact committed/pushed SHA `cdce571...`; no crash and expected behavior. Structured/formal breadth remains `NOT_RUN`; closed Story 04 and opened owner-gated US-09-05 implementation planning. |
| 0.9.0 | 2026-09-12 | Codex | Recorded approved US-09-04 Option A implementation candidate on uncommitted worktree over `c0291ec...`: exact palette/contrast mapping, static seven-cell strip, retained accessible rows, today marker, exact legend and smoke guide. Quality passed 203 files/1,044 tests; platform exports passed; owner visual smoke remains `NOT_RUN`. |
| 0.8.0 | 2026-09-12 | Codex | Recorded owner approval for `US0904-CONFIRM-01→06 Option A`; opened US-09-04 coding on exact start SHA `c0291ec...`. No commit/push authority. |
| 0.7.0 | 2026-09-12 | Codex | Bound US-09-03 owner quick UI PASS to exact committed/pushed SHA `c0291ec...`; no crash and expected behavior. Structured/formal breadth remains `NOT_RUN`; closed Story 03 and opened owner-gated US-09-04 implementation planning. |
| 0.6.0 | 2026-09-12 | Codex | Recorded approved US-09-03 Option A implementation candidate on uncommitted worktree over `91d0612...`: seven-day zero-filled contribution projection, semantic bands, independent resilient controller, neutral text-first panel, fixtures and smoke guide. Automated quality passed 200 files/1,038 tests; platform exports passed; owner UI remains `NOT_RUN`. |
| 0.4.0 | 2026-09-12 | Codex | Bound US-09-02 owner quick UI PASS to exact committed/pushed SHA `91d0612...`; no crash and expected behavior. Structured/formal breadth remains `NOT_RUN`; opened owner-gated US-09-03 implementation planning. |
| 0.3.0 | 2026-09-12 | Codex | Recorded US-09-02 Option A implementation candidate on uncommitted worktree over `36bd9b0...`; full quality passed 194 files/992 tests, iOS/Android exports passed, Doctor remains 20/21 known patch drift, owner UI smoke remains `NOT_RUN`. |
| 0.2.0 | 2026-09-11 | Codex | Recorded US-09-01 automated PASS and owner quick UI acceptance at exact SHA `18057faf...`; structured/formal breadth remains `NOT_RUN`; opened owner-gated US-09-02 implementation planning. |
| 0.1.0 | 2026-09-11 | Codex | Audited clean `feats/epic-09` baseline `05e3e883...`, confirmed EPIC-08 `DONE_OWNER_ACCEPTED`, classified production/prototype/missing capabilities, proposed no schema/dependency/native change, created five risk-ordered Stories with complete matrices/guides/DoR/DoD/rollback, and opened ten owner confirmations. No EPIC-09 code, implementation plan, commit or push. |
