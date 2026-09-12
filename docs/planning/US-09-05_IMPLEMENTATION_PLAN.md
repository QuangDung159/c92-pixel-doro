---
document_id: PIXELDORO_US_09_05_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-09-05 Implementation Plan
version: 0.3.0
status: IMPLEMENTED_CANDIDATE_AWAITING_OWNER_SMOKE
implementation_status: IMPLEMENTED_UNCOMMITTED_WORKTREE_CANDIDATE
date: 2026-09-12
last_updated: 2026-09-12
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-09
planning_baseline_sha: cdce571d7f61e088d7f48c297d32a9373e7f0a99
implementation_start_sha: 0a84afeb7ddf5bb1a33f1c9b6c56dfdfa4a8122b
current_candidate_base_sha: 0a84afeb7ddf5bb1a33f1c9b6c56dfdfa4a8122b
exact_implementation_sha: null
candidate_identity: UNCOMMITTED_WORKTREE_ON_APPROVED_START_SHA
previous_story: US-09-04
previous_story_status: DONE_OWNER_ACCEPTED
previous_story_accepted_sha: cdce571d7f61e088d7f48c297d32a9373e7f0a99
manual_device_status: NOT_RUN
formal_tester_status: NOT_RUN
automated_status: PASS_206_FILES_1056_TESTS
schema_change: NONE_PROPOSED
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
analytics_change: ADD_EXISTING_ALLOWLIST_EVENT_HOOK_ONLY
next_gate: OWNER_QUICK_UI_SMOKE_THEN_EXACT_SHA_EXIT_ACCEPTANCE
scope:
  - mobile_mvp
  - epic_09
  - us_09_05
  - history_lifecycle_integrity
  - history_viewed_local_analytics
  - offline_relaunch
  - prototype_integrity
  - epic_09_exit_candidate
authority: OWNER_APPROVED_IMPLEMENTATION_PLAN
story_baseline: ./EPIC-09_USER_STORIES.md
previous_story_plan: ./US-09-04_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-09-04_IMPLEMENTATION_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
data_model_baseline: ../architecture/data-model.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_analytics: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# US-09-05 — Offline Lifecycle, Analytics, Prototype Integrity và EPIC-09 Exit Candidate

## 0. Outcome và gate

Plan này mở sau khi US-09-01→04 đều owner accepted; Story gần nhất được bind tại exact SHA
`cdce571...`. History list/group/pagination, seven-day contribution projection, final graph/colors và
panel-local resilience đã là accepted behavior.

**User outcome:** History/Contribution tiếp tục đúng khi user chuyển tab, background/foreground, offline
hoặc cold relaunch; mỗi History focus episode chỉ tạo tối đa một local `history_viewed` event khi opt-in,
và analytics failure không bao giờ ảnh hưởng UI hay product facts.

**Priority/order:** `P1 / 5`, Story cuối của EPIC-09.

Owner đã duyệt `US0905-CONFIRM-01→06 Option A` và cấp quyền coding ngày 2026-09-12. Approval chỉ mở
implementation candidate; không tự cấp quyền commit/push, đánh dấu EPIC-09 `DONE`, tạo closure accepted
hay mở EPIC-10 coding.

### 0.1. Baseline audit

| Fact | Kết quả |
|---|---|
| Repository/branch | `/Users/dunglu/Documents/Working/c92-pixel-doro` / `feats/epic-09` |
| Planning HEAD | `cdce571d7f61e088d7f48c297d32a9373e7f0a99`; implementation starts after planning-doc commit `0a84afe...` |
| Origin alignment | Local và `origin/feats/epic-09` cùng exact SHA tại audit |
| Worktree trước doc update | Clean |
| US-09-01 | `DONE_OWNER_ACCEPTED` — `18057faf...` |
| US-09-02 | `DONE_OWNER_ACCEPTED` — `91d0612...` |
| US-09-03 | `DONE_OWNER_ACCEPTED` — `c0291ec...` |
| US-09-04 | `DONE_OWNER_ACCEPTED` — `cdce571...`; no crash, expected behavior |
| Current quality | 203 test files / 1,044 tests; iOS 1,855 / Android 1,950 modules |
| Current Doctor | 20/21; known 9 Expo SDK-57 patch drifts |
| Formal breadth | `NOT_RUN`; prior owner quick smoke is not formal certification |

## 1. Authority và scope

### 1.1. Locked/inherited truth

- History focus/refocus activates both History and Contribution controllers; active foreground refreshes
  both. Same-intent reads coalesce and stale completions are dropped.
- Product reads are SQLite-local, work offline and reconstruct from durable facts after relaunch.
- `history_viewed` already belongs to the approved analytics allowlist.
- Analytics capture follows current bootstrap setting; disabled means skip, never backfill.
- Local queue is existing bounded capacity `1,000`, TTL `604,800,000 ms`, event-ID deduped and provider-free.
- Analytics is best-effort side effect outside product read/session transactions; failure is invisible to UI.
- History route/feature is production and prototype-free. Settings/root prototype remain owned by later Epic.
- No Product history row, contribution threshold/color, pagination or local-date behavior changes here.

### 1.2. In scope

1. Add typed mobile `HistoryAnalyticsRecorder` for existing `history_viewed` event.
2. Record once on inactive→active History controller transition using injected `IdPort` and `ClockPort`.
3. Prove no events from repeated activate while active, refresh, foreground, Retry, Load more, render,
   accessibility focus or cold relaunch without a new focus transition.
4. Prove opt-out, queue rejection/throw and invalid analytics inputs cannot change projections/navigation.
5. Add aggregate real-SQLite lifecycle/offline/relaunch/read-only/analytics isolation evidence.
6. Add finite EPIC-09 exit fixtures, final device guide, implementation report and Exit Report candidate.
7. Strengthen prototype/route/static/no-drift gates and run final repository/platform evidence.

### 1.3. Out of scope

- PostHog/provider delivery, worker, retry transport, dashboard, consent UI or analytics backfill.
- New event names/properties, graph interaction event or screen-visible analytics diagnostics.
- History UI redesign, filter/search/delete/edit/export, calendar navigation or cloud sync.
- Schema/migration/index/trigger, package/lockfile, native/prebuild/permission or remote asset changes.
- Removing `PrototypeProvider`, Settings prototype or Focus branches still owned by later scope.
- Formal cross-platform/device/a11y certification unless actually executed.
- Marking EPIC-09 done before explicit owner smoke + exact-SHA closure authorization.

### 1.4. Scope traps

1. Không record event trong render/effect dependency churn, Retry hoặc mỗi controller refresh.
2. Không dùng session ID/date as episode ID; focus episode dùng existing injected `IdPort`.
3. Không await analytics before load/publish/navigation và không expose analytics error to UI.
4. Không retry/backfill khi opt-out hoặc queue failure; a later new episode is a distinct allowed event.
5. Không dùng provider/network trong History path hoặc device fixture.
6. Không gộp History và Contribution reads vào one mega-transaction/controller.
7. Không sửa valid product facts để phục vụ aggregate test; fixture seeds qua production commands.
8. Không claim formal PASS từ automated tests/exports hoặc broad owner “work as expected”.
9. Không xóa later-owner prototype code chỉ vì History đã production.

## 2. Capability inventory và gap

| Capability | Accepted baseline | Story-05 gap |
|---|---|---|
| History lifecycle | `activate/deactivate/refresh`, generation guards, page races | Aggregate focus/foreground/relaunch proof |
| Contribution lifecycle | Independent accepted controller, same route triggers | Cross-controller aggregate proof |
| Route | `useFocusEffect` + active foreground refresh | Event owner must avoid effect/render duplicates |
| Analytics allowlist | `history_viewed` mapper/schema already accepted | No typed History recorder/hook |
| Analytics queue | TTL/capacity/dedupe/transaction already production | Exact event and failure-isolation proof |
| Shop precedent | `ShopAnalyticsRecorder` + controller activation episode | Reuse pattern with History-specific types/IDs |
| Fixtures | Story-specific US-09-01→04 isolated databases | Missing final aggregate exit family |
| Static integrity | History route/presentation prototype/SQL boundaries | Missing analytics owner and full Epic exit audit |

Kết luận: schema, allowlist, queue, ID/clock/settings and lifecycle seams already exist. Expected behavior
delta is one local analytics hook; remaining work is aggregate evidence/fixtures/docs. No dependency or
native change is justified.

## 3. Proposed contracts

### 3.1. History analytics recorder

```ts
type HistoryAnalyticsOutcome =
  | { outcome: 'enqueued' | 'already_queued'; eventId: string }
  | { outcome: 'skipped_disabled' };

interface HistoryAnalyticsRecorderPort {
  recordViewed(
    focusEpisodeId: string,
    occurredAt: number,
  ): Promise<ApplicationResult<HistoryAnalyticsOutcome, HistoryAnalyticsError>>;
}
```

Exact record:

```text
eventId       = history_viewed:<focusEpisodeId>
eventName     = history_viewed
properties    = {}
occurredAt    = injected clock value
expiresAt     = occurredAt + existing queue TTL
deliveryState = pending
attemptCount  = 0
nextAttemptAt = null
createdAt     = occurredAt
```

Recorder validates nonblank ID and safe timestamp/TTL addition, reads capture setting through injected
callback, uses only `enqueueBounded`, maps rejection/throw to typed local error and never triggers
Recovery or UI state.

### 3.2. Focus-episode ownership

`HistoryController.activate()` remains the single episode owner:

```text
disposed activate              → no-op, no event
inactive → active              → generate ID/time, fire-and-forget recordViewed once, start load/refresh
active → active                → coalesce/no-op, no event
active foreground refresh      → refresh reads only, no event
active Retry/Load more/render   → no event
deactivate → activate          → new focus episode, new event
```

Analytics fires best-effort after the inactive→active transition is established and must not wait for
History or Contribution success. If ID/clock/recorder throws or rejects, controller continues the same
load and projection behavior.

Contribution controller does not know about analytics. This avoids double event when the route activates
both controllers with `Promise.all`.

### 3.3. Composition boundary

`createHistorySlice` receives existing `clock`, `id`, bounded analytics queue and `readBootstrap`. It
constructs `HistoryAnalyticsRecorder` with capture enabled only when bootstrap is ready and
`settings.analyticsEnabled === true`, then injects it into `HistoryController`.

Root composition passes the already coordinated local analytics queue used by Shop/side effects. No
provider/delivery call is added. Existing controller/facade/provider/route public API need not change.

### 3.4. Lifecycle and offline exit contract

| Event | History read | Contribution read | `history_viewed` |
|---|---|---|---|
| First tab focus | initial/refresh | initial/refresh | one new event if enabled |
| Same active render/callback | none | none | none |
| Background→foreground while focused | coalesced refresh | coalesced refresh | none |
| Switch away→back | replacement refresh | range refresh | one new episode event |
| Retry / Load more | exact accepted intent | contribution Retry only | none |
| Cold launch directly into History | SQLite reconstruction | SQLite reconstruction | one event for actual new focus |
| Relaunch elsewhere | none until History focused | none | none |
| Airplane mode | unchanged local reads | unchanged local read | local queue only |

### 3.5. EPIC-09 exit artifacts

Authorized implementation creates:

- `US-09-05_IMPLEMENTATION_REPORT.md` as candidate evidence;
- `EPIC-09_EXIT_REPORT.md` with `CANDIDATE_AWAITING_OWNER_EXIT_ACCEPTANCE` only;
- final device guide `epic-09-exit-smoke.md`, initially `NOT_RUN`;
- exact accepted SHA fields remain null until owner confirms committed/pushed candidate.

No document may label Epic `DONE_OWNER_ACCEPTED` before explicit final owner closure.

## 4. Aggregate fixture design

Use `EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE` with exact prefix `pixeldoro-us-09-05-`:

| Scenario | Evidence |
|---|---|
| `epic_09_empty` | Empty list + zero graph + one local view event |
| `epic_09_mixed_40` | Two pages, date groups, all terminal statuses and contribution bands |
| `epic_09_offline_relaunch` | Same product fingerprint after close/reopen/airplane mode |
| `epic_09_read_failure_once` | Local list/contribution failure and exact Retry isolation |
| `epic_09_analytics_failure_once` | First enqueue fails, UI/data remain identical; no auto retry |
| `epic_09_timezone_changed` | Current range moves but stored sessions do not regroup |

Valid sessions/rewards/profile are prepared through migration + production lifecycle use cases under the
shared coordinator. Failure scenarios decorate only exact read/queue ports. Unknown/empty env selects no
fixture; normal `pixeldoro.db` is never selected or reset.

Analytics row counts/IDs are asserted through automated SQLite tests. Device UI does not expose an
analytics debug panel; manual smoke verifies that enabled/disabled/failure paths do not alter UX.

## 5. File impact

### 5.1. Planned new files

- `apps/mobile/src/application/history/history-analytics.recorder.ts` and test.
- `apps/mobile/src/composition/review/epic-09-exit-review-fixture.ts` and test.
- Aggregate real-SQLite EPIC-09 exit integration test.
- `apps/mobile/test/device/epic-09-exit-smoke.md`.
- `docs/planning/US-09-05_IMPLEMENTATION_REPORT.md` after authorized implementation.
- `docs/planning/EPIC-09_EXIT_REPORT.md` as unaccepted candidate after implementation.

### 5.2. Planned modified files

- History application barrel/controller/tests.
- History slice/tests and root composition for recorder dependencies/fixture decorators.
- Existing route/prototype integrity and device-guide validators.
- EPIC-09 tracker, this plan and reports at candidate/acceptance gates.

### 5.3. Explicitly unchanged

- History/Contribution Application projection/builders/use cases and public UI behavior.
- Route/provider/facade API unless failing evidence proves an unavoidable seam.
- Migration `001`, schema/index/trigger/seed/checksum.
- Package manifests/lockfile, native config, permissions and bundled assets.
- Provider delivery/worker/dashboard and Settings/prototype owners.
- Product sessions/profile/rewards from analytics execution.

## 6. Ordered implementation tasks

| Order | Task | Observable output |
|---:|---|---|
| T00 | Owner gate + clean start audit | Six confirmations approved; exact start SHA |
| T01 | Typed recorder | Exact local event/TTL/properties, opt-out/failure isolation |
| T02 | Controller episode hook | One event/inactive→active; zero event on refresh/retry/render |
| T03 | Composition wiring | Existing queue/settings/clock/id, no provider/API change |
| T04 | Aggregate fixture | Six finite isolated scenarios under US-09-05 prefix |
| T05 | SQLite/lifecycle evidence | Offline/relaunch/paging/graph/event/fingerprint proof |
| T06 | Prototype/static gates | History production only; later-owner prototype preserved |
| T07 | Device guide | Full History/Contribution exit smoke, honest evidence rows |
| T08 | Candidate reports | Story report + unaccepted Epic Exit Report |
| T09 | Final gates | Quality, exports, Doctor, diff/no-drift and exact evidence |

## 7. Test strategy

### 7.1. Recorder and controller

- Exact `history_viewed:<episodeId>`, `{}`, timestamps, TTL and immutable event.
- Enabled enqueue, duplicate `already_queued`, disabled skip, invalid ID/time and TTL overflow.
- Settings callback throw, queue rejection and queue throw all remain typed/best-effort.
- First activate once; repeated active activate, refresh, Retry, append and render produce no event.
- Deactivate/reactivate produces a new ID/event; dispose is no-op; analytics rejection never changes state.

### 7.2. Lifecycle and SQLite aggregate

- Both controllers coalesce on first focus/refocus/foreground and drop stale read completions.
- Mixed 40 rows paginate 20+20 with stable IDs, group totals and seven exact contribution cells.
- Failed/cancelled remain visible but do not contribute; trial/running/Break remain absent.
- Cross-midnight/timezone/relaunch preserve stored scheduled-end local dates.
- Product fingerprint is identical before/after render, reads, retries and analytics failure; only exact
  expected `analytics_events` rows may differ when capture is enabled.
- Opt-out and queue failure leave analytics count/product facts exact; cold reopen preserves local queue.

### 7.3. Integrity and platform gates

- History route/presentation imports no prototype/mock/repository/SQLite/business rules.
- Settings/root/later-owner prototype files remain present and compiling.
- Fixture allowlist is finite, `__DEV__`, default absent and never selects `pixeldoro.db`.
- No schema/checksum/dependency/native/provider drift; every feature module respects line limits.
- Full typecheck, lint, Vitest, device validator, boundaries, repository hygiene, iOS/Android export,
  Expo Doctor and `git diff --check` evidence.

## 8. Manual smoke and evidence policy

Proposed guide: `apps/mobile/test/device/epic-09-exit-smoke.md`; initial `Status: NOT_RUN`.

Owner quick UI covers observable end-to-end behavior: empty/mixed two pages, graph/colors, Retry states,
tab switch, foreground, offline, relaunch and no prototype in History. Analytics enabled/disabled/failure
must be invisible to UI; exact queue evidence belongs to automated SQLite tests, not a debug screen.

Structured iOS/Android physical device, full VoiceOver/TalkBack, largest text, grayscale and Reduce
Motion remain `NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED` under proposed Option A. Final Story/Epic
acceptance still needs an explicit owner quick smoke on the exact committed/pushed SHA.

## 9. Acceptance và Done gates

- [x] Owner approves `US0905-CONFIRM-01→06 Option A` and authorizes Story-05 coding.
- [x] Exact once-per-focus-episode event semantics and ID/properties/TTL are implemented.
- [x] Opt-out/invalid/queue failure or throw cannot affect History/Contribution state.
- [x] Refocus/foreground/retry/load-more/render/relaunch semantics match approved matrix.
- [x] Aggregate SQLite/offline/reopen tests prove complete EPIC-09 product truth and allowed side effect.
- [x] History remains prototype-free; Settings/root later-owner prototype remains intact.
- [x] Fixture family is finite, isolated and cannot select normal database.
- [x] No schema/dependency/native/provider or unauthorized product-data write drift.
- [x] Automated/static/platform evidence and manual/formal statuses are recorded honestly.
- [x] Story report and Epic Exit Report candidate exist without premature DONE claim.
- [ ] Owner accepts exact committed SHA and separately authorizes EPIC-09 closure before EPIC-10 planning.

## 10. Owner Confirmation Register

### US0905-CONFIRM-01 — View episode timing

- **Option A — đề xuất:** one event cho mỗi inactive→active History focus; initial/refocus có event,
  foreground refresh/Retry/Load more/render không có event.
- **Option B:** foreground khi History active cũng tạo một event mới.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0905-CONFIRM-02 — Event identity/properties

- **Option A — đề xuất:** `history_viewed:<IdPort.nextId()>`, exact `{}`, injected clock, existing 7-day
  TTL/capacity/dedupe; disabled thì skip và không backfill.
- **Option B:** stable daily ID hoặc thêm page/row/count properties.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0905-CONFIRM-03 — Lifecycle owner và failure

- **Option A — đề xuất:** `HistoryController.activate` sở hữu best-effort hook theo Shop precedent;
  contribution không record; ID/clock/settings/queue failure không đổi UI/Recovery.
- **Option B:** route React effect trực tiếp enqueue analytics.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0905-CONFIRM-04 — Exit fixtures

- **Option A — đề xuất:** six finite `epic_09_*` scenarios, prefix `pixeldoro-us-09-05-`, valid facts qua
  production commands; read/analytics failure bằng scoped decorators.
- **Option B:** chỉ reuse rời rạc các Story fixture cũ, không có aggregate exit dataset.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0905-CONFIRM-05 — Analytics manual evidence

- **Option A — đề xuất:** exact event/count/opt-out/failure được chứng minh bằng automated SQLite;
  manual chỉ xác nhận UI không bị ảnh hưởng, không thêm debug analytics UI.
- **Option B:** thêm dev-only analytics inspector vào History screen.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0905-CONFIRM-06 — Formal/closure gate

- **Option A — đề xuất:** quality + exports + owner quick UI trên exact SHA đủ đóng Story/Epic; structured
  physical-device/a11y breadth giữ deferred/NOT_RUN; Epic closure vẫn cần explicit owner authorization.
- **Option B:** bắt buộc full formal iOS/Android/a11y matrix trước khi tạo Exit Report.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

Owner có thể duyệt gọn:

`Duyệt US0905-CONFIRM-01→06 theo Option A`

Approval này mở coding US-09-05. Nó không authorize commit/push, tự đánh dấu EPIC-09 accepted hoặc mở
EPIC-10 planning/coding trước final exact-SHA owner exit acceptance.

## 11. Impact và rollback

| Area | Verdict |
|---|---|
| Schema/migration/index | `NONE`; allowlist/table/queue already sufficient |
| Dependency/package/lockfile | `NONE` |
| Native/prebuild/permission | `NONE` |
| Product durable writes | `NONE` |
| Analytics durable write | One bounded local `history_viewed` per enabled focus episode |
| Provider/network | `NONE`; deferred EPIC-11 |
| UI/common component | `NONE` proposed |
| Formal device/a11y | Proposed deferred to EPIC-12 unless actually executed |

Rollback removes History recorder injection/hook, exit fixture/tests/guides and candidate reports;
accepted History/Contribution behavior remains. Existing queued analytics rows follow normal bounded
retention/reset policy; never delete product data or normal `pixeldoro.db` during rollback.

## 12. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.3.0 | 2026-09-12 | Codex | Implemented the approved local `history_viewed` focus-episode hook, six isolated exit fixtures, real-SQLite aggregate/reopen/failure evidence, static/device gates and candidate reports. Quality passed 206 files/1,056 tests; iOS/Android exports passed; Doctor 20/21 with the same 9 SDK-57 patch drifts. Owner/manual smoke remains `NOT_RUN`; no commit/push or Epic closure claim. |
| 0.2.0 | 2026-09-12 | Codex | Recorded owner approval for `US0905-CONFIRM-01→06 Option A`, opened coding and bound exact implementation start SHA `0a84afe...`. No commit/push or Epic closure authority. |
| 0.1.0 | 2026-09-12 | Codex | Audited accepted US-09-01→04, History/Contribution lifecycle, Shop analytics precedent, bounded queue/settings/ID/clock, prototype boundary and exit requirements; proposed exact once-per-focus event, aggregate fixtures/evidence and six owner confirmations. No coding, commit or push. |
