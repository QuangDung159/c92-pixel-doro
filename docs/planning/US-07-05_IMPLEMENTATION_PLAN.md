---
document_id: PIXELDORO_US_07_05_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-07-05 Notification, Analytics Hooks, Accessibility và EPIC-07 Exit Plan
version: 0.5.0
status: DONE_OWNER_ACCEPTED
implementation_status: DONE_OWNER_ACCEPTED
date: 2026-09-10
last_updated: 2026-09-10
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-07
planning_baseline_sha: a3cafa39f6b2882b126562e6c8f54eb186887cc2
implementation_start_sha: a3cafa39f6b2882b126562e6c8f54eb186887cc2
exact_implementation_sha: f6c7b9269b2abee07bfe8eeb5d804c6245b67c0a
previous_story_sha: a3cafa39f6b2882b126562e6c8f54eb186887cc2
previous_story_acceptance: DONE_OWNER_ACCEPTED_QUICK_UI
manual_device_status: PASS_OWNER_QUICK_UI
formal_tester_status: DEFERRED_TO_LATER_PHASE
schema_change: NONE_PROPOSED
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
scope:
  - mobile_mvp
  - epic_07
  - us_07_05
  - break_notification
  - notification_navigation
  - break_analytics
  - accessibility
  - prototype_integrity
  - epic_exit
authority: PLANNING
story_baseline: ./EPIC-07_USER_STORIES.md
previous_story_plan: ./US-07-04_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-07-04_IMPLEMENTATION_REPORT.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
timer_baseline: ../specifications/timer-engine.md
session_baseline: ../specifications/session-lifecycle.md
gamification_baseline: ../specifications/gamification-rules.md
pet_baseline: ../specifications/pet-state-machine.md
adr_navigation: ../architecture/decisions/ADR-002-navigation-with-expo-router.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
adr_analytics: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# US-07-05 — Notification, analytics hooks, accessibility và EPIC-07 exit

## 0. Mục đích và gate

Story cuối EPIC-07 nối Break lifecycle đã owner-accepted với local notification best-effort, exact
notification-tap navigation, local analytics hooks, accessibility/integrity audit và Epic exit
evidence. Notification, analytics và UI không được trở thành session/reward truth.

US-07-04 final exact SHA `a3cafa39f6b2882b126562e6c8f54eb186887cc2` đã commit/push và owner
xác nhận quick UI không crash, hoạt động đúng kỳ vọng ngày 2026-09-10. Structured device/a11y và
formal tester vẫn `NOT_RUN`; không suy diễn từ owner quick smoke.

Plan đã được owner duyệt toàn bộ Option A ngày 2026-09-10. Implementation bắt đầu từ exact SHA
`a3cafa39f6b2882b126562e6c8f54eb186887cc2`; no-schema/dependency/native scope được khóa.

Implementation candidate hoàn tất ngày 2026-09-10: full quality PASS `152 files / 817 tests`, iOS và
Android JS export PASS. Owner xác nhận quick UI không crash và hoạt động đúng kỳ vọng ngày
2026-09-10 tại exact implementation SHA `f6c7b9269b2abee07bfe8eeb5d804c6245b67c0a`.
Structured physical-device/accessibility matrix và formal tester vẫn `NOT_RUN`.

## 1. Authority và scope

### 1.1. In scope

- Break completion local notification sau durable Start commit; cleanup sau completed/cancelled commit.
- Permission/preference/sound policy reuse từ Standard Focus.
- Một shared typed notification response pipeline cho Focus + Break, warm/cold tap và exact navigation.
- Local deterministic `break_started`/`break_completed` analytics nếu owner duyệt; không provider upload.
- Failure isolation, startup ensure/cleanup, reset cleanup, stale/repeated/malformed tap.
- Break UI semantic/large-text/Reduce Motion/touch audit và regression common consumers.
- Static production-prototype boundary, full Short/Long journey, device guide/report và EPIC-07 Exit Report.

### 1.2. Out of scope

- Push/server notification, APNs/FCM token, badges, custom sound, Live Activities/widgets.
- PostHog upload/provider worker, analytics dashboard/retention target; thuộc EPIC-11.
- Settings production UI hoặc permission management; thuộc EPIC-10.
- Audio/haptic implementation, configurable Break duration, Pause/Strict/reward/history.
- New database notification receipt, source Focus relation hoặc terminal viewed marker.
- Replacing prototype dependencies of Shop/History/Settings before their owning Epics.

## 2. Baseline audit tại `a3cafa3`

### 2.1. Reusable capabilities

- `expo-notifications ~57.0.17`, Expo plugin/native build và lazy gateway đã production từ EPIC-06.
- `ExpoFocusNotificationAdapter` đã xử lý provisional permission, Android channel, deterministic
  ensure/cancel, exact schedule comparison, warm/cold response mapping và last-response clear.
- `StandardFocusSideEffectCoordinator` đã có post-commit Start/terminal, startup ensure, fresh-only
  analytics, bounded response dedupe, dispose và failure isolation.
- Shared analytics allowlist/schema/mapper/queue đã có `break_started`, `break_completed`, TTL 7 ngày,
  capacity 1000, deterministic event-ID dedupe và persisted opt-out setting.
- Break Start/Lifecycle/Cancel đã cung cấp exact session, freshness, durable winner, startup reconcile,
  exact route và post-commit Pet refresh.
- Common UI đã có semantic header, countdown, confirmation, no-reward Result, scrolling shell, Reduce
  Motion still và external Pet status text.
- Full accepted baseline: 148 test files / 800 tests; iOS/Android export pass; Doctor baseline 19/21.

### 2.2. Gaps và debt cần xử lý

- Notification types, keys, gateway copy/channel và navigation controller đều hard-code Standard Focus.
- Chỉ Standard coordinator sở hữu Expo response listener; thêm listener Break riêng sẽ tạo cold-start
  clear/dedupe/navigation race.
- Startup adapter chỉ ensure/cleanup notification cho Standard; Break chỉ publish completion outcome.
- Reset cleanup nhận session ID nhưng hiện chỉ derive Focus operation key.
- Break Start/terminal composition chưa dispatch notification hoặc analytics.
- Chưa có typed Break analytics recorder/property validator tests dù event names đã allowlisted.
- Root bridge chỉ hiểu `/focus/session` và `/focus/result`; chưa có exact Break destination.
- Break prototype production boundary chưa có Epic-exit deletion/retention verdict.
- Chưa có notification/a11y/exit fixtures, real SQLite side-effect journey, device guide hoặc Exit Report.
- `create-mobile-application.ts` đã khoảng 1,082 dòng; Story không được tiếp tục nhồi orchestration vào root.

## 3. Proposed behavior contract — chờ owner approval

### 3.1. Post-commit flow

```text
fresh Break Start COMMIT
  → exact running route/Pet Breaking
  → best-effort ensure Break deadline notification
  → best-effort enqueue break_started

completed/cancelled Break COMMIT
  → exact terminal Result/Pet Idle
  → best-effort cancel Break notification
  → fresh completed only: enqueue break_completed
  → cancelled: no analytics event (not in approved taxonomy)
```

Side-effect failure không rollback, không mở global Recovery và không đổi navigation đã commit.
Crash sau commit trước hook có thể làm mất analytics event; startup chỉ ensure/cancel notification,
không backfill historical analytics.

### 3.2. Notification identity và copy

```text
operation key = break-complete:<sessionId>
payload.kind  = break_completion
payload.sessionId = exact Break ID
payload.breakType = short_break | long_break
payload.url = /break/session
```

- Title: `Phiên nghỉ đã kết thúc`.
- Short body: `Nghỉ ngắn đã xong. Mèo Dev đang chờ bạn quay lại.`
- Long body: `Nghỉ dài đã xong. Mèo Dev đang chờ bạn quay lại.`
- One date trigger tại persisted `endsAt`, không repeat, badge 0; sound theo setting/OS permission.
- Android channel riêng `break-completion`; không đổi channel/copy của Standard Focus.
- Exact matching schedule trả `already_scheduled`; same key mismatch cancel rồi recreate.

### 3.3. Permission và failure policy

- `notificationsEnabled=false`: không read/request/schedule; terminal/reset cleanup vẫn được phép.
- Sau fresh explicit Break Start: read permission; `undetermined` request một lần theo existing policy;
  allowed/provisional ensure, denied skip và không prompt lại.
- Startup running Break chỉ read/ensure; không request permission trong cold launch.
- Provider/read/schedule/cancel/response failure bị cô lập; durable countdown/terminal vẫn hoạt động offline.

### 3.4. Tap routing và durable authority

```text
valid Break notification response
  → bootstrap/readiness barrier
  → exact Break reconcile/read
      running before deadline → /break/session exact running
      overdue running → reconcile → /break/session exact completed
      completed/cancelled → /break/session exact Result
      missing/foreign/corrupt → Home
  → consume navigation request + clear accepted initial response
```

Notification payload không được truyền status/reward/timestamp authority. Early/stale/repeated tap chỉ
đọc/reconcile exact durable row, không start/cancel/grant/replay Pet hoặc analytics.

### 3.5. Analytics contract

| Event | Trigger | Stable event ID | Properties |
|---|---|---|---|
| `break_started` | fresh committed Break Start | `break_started:<sessionId>` | `breakType`, `durationMinutes` |
| `break_completed` | fresh committed completion | `break_completed:<sessionId>` | `breakType`, `durationMinutes`, `terminalStatus=completed` |

Session ID chỉ dùng trong local deterministic event ID, không là property. Không ghi source Focus ID,
work tag, device identity, balance, free text hoặc reward. `analyticsEnabled=false` skip và không backfill.
Cancelled Break không phát event vì Product Core chưa có `break_cancelled`.

## 4. Architecture và ownership

### 4.1. Notification generalization

- Đổi Focus-only contract thành discriminated `SessionCompletionNotification` hỗ trợ
  `standard_focus_completion | break_completion`, giữ compatibility wrapper/export nếu giảm churn.
- Một Expo adapter/gateway schedule input nhận typed content/channel descriptor từ application-owned
  mapper; raw Expo types chỉ ở infrastructure.
- Một response source/subscription và một bounded response-ID set cho cả hai kinds.
- Một navigation controller projection chứa destination kind + exact session ID; root có một bridge.
- Standard behavior/copy/key/channel giữ nguyên và có regression tests byte-for-byte ở contract level.

### 4.2. Break side-effect slice

Tạo feature-local composition slice thay vì tăng root file:

- `BreakAnalyticsRecorder` validate exact running/completed Break facts.
- `BreakSideEffectCoordinator` nhận Start/terminal/startup callbacks và shared response dispatcher.
- `BreakNotificationNavigationHandler` boot/reconcile/load exact ID rồi publish destination.
- Composition chỉ truyền typed hooks vào `createBreakStartSlice`/`BreakLifecycleController`.
- Startup adapter mở rộng optional Break ensure/afterTerminal; cancellation winner cleanup luôn chạy.

### 4.3. Reset cleanup

Reset adapter phải cancel deterministic keys cho exact known active session type. Không dùng
`cancelAllScheduledNotificationsAsync`, không đụng notification ngoài PixelDoro và không cần schema.

### 4.4. Presentation/accessibility

- Reuse same `/break/session?sessionId=<id>` cho tap running/completed/cancelled.
- Notification navigation bridge không flash missing route trước khi về Home.
- Audit ScreenHeader reading order, countdown non-spam, confirmation labels/focus, terminal no-reward
  text, largest text scroll, minimum touch target và non-color meaning.
- Pet animation vẫn ẩn khỏi accessibility tree; external status text và Reduce Motion still giữ nghĩa.
- Production Break route/screen không import prototype context/components/reducer. Global prototype
  scaffolding cần cho out-of-scope tabs được giữ tạm và ghi rõ không là Break authority.

## 5. Component reuse matrix

| Need | Existing owner | Decision | Regression |
|---|---|---|---|
| Permission/ensure/cancel | Expo Focus adapter/gateway | Generalize typed session kind | Standard exact key/copy/channel |
| Response listener | Standard coordinator | Promote one shared dispatcher | warm/cold/dedupe/dispose |
| Navigation bridge | Standard bridge/controller | Generalize exact Focus/Break destinations | all current Focus taps |
| Analytics queue | bounded SQLite queue | Reuse unchanged | TTL/capacity/opt-out/dedupe |
| Break hooks | Start/Lifecycle/Cancel callbacks | Add post-commit typed hooks | core outcome isolation |
| Break UI | existing production screen/common components | Semantic/layout fixes only | Trial/Standard/common consumers |
| Prototype boundary | static integrity tests | No new common component | future Shop/History/Settings remain intact |

No new visual common component proposed. Any common change requires cross-consumer tests.

## 6. Planned file impact

Indicative new files:

- `apps/mobile/src/application/break/break-analytics.recorder.ts` + tests.
- `apps/mobile/src/application/break/break-side-effect.coordinator.ts` + tests.
- `apps/mobile/src/application/notifications/session-completion-notification.ts` + tests.
- `apps/mobile/src/application/notifications/session-notification-navigation.controller.ts` + tests.
- `apps/mobile/src/composition/break/create-break-side-effects.ts`.
- `apps/mobile/src/composition/review/break-side-effect-review-fixture.ts` + tests.
- `apps/mobile/test/integration/break-side-effects.integration.test.ts`.
- `apps/mobile/test/integration/epic-07-production-integrity.integration.test.ts`.
- `apps/mobile/test/device/epic-07-exit-smoke.md`.
- `docs/planning/US-07-05_IMPLEMENTATION_REPORT.md`.
- `docs/planning/EPIC-07_EXIT_REPORT.md`.

Expected modifications:

- Focus notification contracts/adapter/gateway/coordinator/navigation/bridge and their tests.
- Break Start/Lifecycle/Cancel composition callbacks, startup reconciliation and root facade.
- Analytics mapper tests only if existing property allowlist needs tightening; no migration.
- Break/common presentation only for proven accessibility issues.
- Review fixture resolver, device validator and EPIC-07 evidence docs.

Explicit non-impact: `packages/domain`, reward/profile transaction, migration `001`, package/lockfile,
Expo plugin/native config and PostHog provider should remain unchanged unless audit disproves baseline.

## 7. Implementation sequence after approval

1. Record owner options and exact implementation-start SHA; reconcile any non-A choice.
2. Introduce generic notification kind/key/input/response contract with Standard compatibility tests.
3. Generalize Expo gateway/adapter and retain existing Standard key/copy/channel behavior.
4. Build one shared response dispatcher/navigation projection for warm/cold Focus + Break taps.
5. Add Break analytics recorder with deterministic events and opt-out/failure isolation.
6. Add Break side-effect coordinator and wire fresh Start/completed plus all terminal cleanup.
7. Extend startup ensure/terminal cleanup and exact Break notification tap reconciliation.
8. Make reset cleanup kind-aware without broad OS deletion.
9. Add finite isolated fixtures for permission/schedule/cancel/queue/tap cases.
10. Run accessibility/large-text/Reduce Motion audit; fix only evidenced shared/Break issues.
11. Add real SQLite side-effect and production prototype-integrity integration coverage.
12. Run full quality, both exports, Expo config introspection/Doctor and static scope audit.
13. Create device guide, implementation report and EPIC-07 Exit Report; request owner quick smoke.

## 8. Automated test plan

### 8.1. Notification contracts/adapters

- Exact Focus and Short/Long Break key/kind/content/channel/date/sound.
- Allowed/provisional/undetermined/denied/preference-off and no cold-start prompt.
- already-scheduled, mismatch replace, past-due skip, prepare/list/schedule/cancel failures.
- Warm/cold/malformed/custom-action/foreign-key response mapping and initial-response clear.
- One subscription, bounded dedupe, dispose/Fast Refresh and Focus regression.

### 8.2. Break orchestration/analytics

- Fresh Start schedules + records once; Start conflict/write failure dispatches nothing.
- Fresh completion cancels + records once; existing completion only cleans notification.
- Cancelled/CAS winner cleans notification and records no completion/cancel event.
- Opt-out/queue throw/partial failure does not change core success or enter Recovery.
- Startup running ensures, terminal cleans, no analytics reconstruction.
- Stable event IDs, exact properties, TTL/capacity/dedupe and no reward/profile dependency.

### 8.3. Tap/navigation/integration

- Early running, overdue running, completed, cancelled, missing/foreign/corrupt exact ID.
- Stale/repeated concurrent taps create one consumed navigation intent and no durable mutation beyond
  normal reconcile.
- Cancel vs delivery/tap race renders first committed terminal winner.
- Real SQLite Short/Long full journey, reopen, zero reward/profile delta and cadence preservation/reset.
- Reset cancels only known PixelDoro operation keys.

### 8.4. Accessibility/integrity/gates

- Semantic labels/roles/state/live-region, countdown non-spam and largest-text structural layout.
- Reduce Motion still/text and Pet crop regression.
- Break production route has no prototype/SDK/repository/reward imports.
- Standard/Trial/common notification/modal/result regressions.
- Node `22.23.2`: typecheck, lint, full tests, device validator, boundaries, repository hygiene.
- iOS/Android JS exports, Expo config introspection, Doctor warnings recorded without upgrade.

## 9. Manual UI/device plan

Guide `apps/mobile/test/device/epic-07-exit-smoke.md` sẽ dùng disposable database prefix
`pixeldoro-us-07-05-*`, real 5/15-minute records và clock/scheduler injection chỉ để review nhanh.

Minimum scenarios:

1. Permission allowed: Short/Long schedule một notification đúng copy; background delivery và tap.
2. Permission denied/preference off: không loop prompt; countdown/completion/cancel vẫn đúng.
3. Early tap mở exact running; terminal tap mở exact completed/cancelled Result.
4. Missing/stale/repeated/malformed tap về Home hoặc no-op, không reward/navigation loop.
5. Schedule/cancel/response/analytics failure once không crash, không global Recovery.
6. Cancel khi notification gần fire: durable winner và UI thống nhất.
7. Kill/relaunch before/after deadline; startup ensure/cleanup không backfill analytics.
8. Offline, VoiceOver/TalkBack, largest text, Reduce Motion, touch targets trên iOS/Android.
9. Full Focus Result → Break CTA → Start → terminal → Home; zero reward và cadence đúng.

Evidence ghi exact SHA, fixture/database, device/OS/build, timezone, permission/network state và
PASS/FAIL/BLOCKED/NOT_RUN. Owner quick smoke không thay formal/structured matrix.

## 10. Acceptance criteria

- [x] Allowed permission schedules at most one exact-deadline Short/Long notification.
- [x] Denied/off/provider failure never blocks Break core truth or navigation.
- [x] Completion/cancel terminal cleanup is best-effort, idempotent and exact-key only.
- [x] Warm/cold tap reads/reconciles exact durable Break and follows approved destination.
- [x] Early/stale/repeated/malformed taps cannot invent terminal state, reward or replay side effects.
- [x] Notification copy distinguishes Short/Long without implying XP/Coin.
- [x] Approved `break_started`/`break_completed` events are deterministic, privacy-safe and fresh-only.
- [x] Cancelled Break creates no unapproved analytics event.
- [x] Startup/reset handle known Break notification safely without broad OS deletion.
- [x] Break UI passes semantic/source audit; unrun device accessibility remains honestly labeled.
- [x] Production Break route/screen has no prototype authority; out-of-scope prototype tabs still work.
- [x] No schema/dependency/native change and no PostHog provider scope.
- [x] Full automated/platform/static gates pass and Epic exit evidence exists.

## 11. Risks và controls

| Risk | Control |
|---|---|
| Two response listeners race/clear initial tap | One shared dispatcher/subscription and consume token. |
| Generalization regresses Standard Focus | Compatibility exports + exact key/copy/channel regression. |
| Notification becomes terminal truth | Handler only invokes durable exact reconcile/read. |
| Cancel leaves stale OS notification | Terminal cleanup for every winner; stale tap remains harmless. |
| Startup prompts unexpectedly | Cold start only reads permission; request only after explicit Start. |
| Analytics duplicates/backfills | Deterministic ID + fresh-only hooks + no startup reconstruction. |
| Root composition grows further | Extract notification/Break side-effect slices. |
| Prototype cleanup breaks future tabs | Retire Break authority only; static inventory before deletion. |
| A11y status overstated | Separate source/automated, owner quick smoke and formal device evidence. |
| Scope drifts into upgrades/EPIC-10/11 | No package/native/provider/settings change by default. |

## 12. Rollback strategy

- Revert Break side-effect hooks and generic notification additions while preserving all US-07-01→04
  durable behavior.
- Retain Standard Focus adapter behavior through compatibility layer; rollback must not change its key.
- Scheduled stale Break notification is harmless because response validates exact durable truth; cleanup
  may be invoked best-effort by the previous app version only for known keys.
- Analytics queue rows are non-authoritative and can expire normally; do not raw-delete product data.
- No migration rollback because no schema change proposed.

## 13. Definition of Ready / Done

### Ready

- [x] US-07-04 final exact SHA and owner quick UI acceptance recorded.
- [x] Product/Timer/Session/Gamification/Pet/ADR authority audited.
- [x] Existing notification, analytics, startup, reset, navigation and prototype ownership audited.
- [x] No-schema/dependency/native default and shared-listener design documented.
- [x] Test/device/rollback/evidence plan documented.
- [x] Owner approves confirmations `US0705-CONFIRM-01→12` on 2026-09-10.
- [x] Epic `US0700-CONFIRM-05/06` resolved consistently.
- [x] Exact implementation-start SHA recorded before coding.

### Done

- [x] All acceptance criteria and full automated/platform/static gates pass.
- [x] Standard Focus notification behavior remains unchanged.
- [x] Implementation report, device guide and EPIC-07 Exit Report bind exact SHA.
- [x] Owner quick UI status and structured/formal evidence recorded separately.
- [x] Owner explicitly accepts US-07-05/EPIC-07 and authorizes EPIC-08 planning.

## 14. Owner confirmation gate — APPROVED

### US0705-CONFIRM-01 — Notification copy/tap (`US0700-CONFIRM-05`)

- **Option A — đề xuất:** title `Phiên nghỉ đã kết thúc`; body nêu Nghỉ ngắn/dài; early tap mở exact
  running, terminal mở exact Result, missing/foreign/corrupt về Home.
- **Option B:** mọi valid tap mở Break route để route tự fail/recover.
- **Option C:** mọi tap về Home.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-02 — Break analytics (`US0700-CONFIRM-06`)

- **Option A — đề xuất:** fresh-only `break_started` và `break_completed`; không `break_cancelled`;
  local queue only, provider delivery deferred EPIC-11.
- **Option B:** defer toàn bộ Break analytics tới EPIC-11.
- **Option C:** thêm `break_cancelled` sau Product taxonomy update.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-03 — Notification architecture

- **Option A — đề xuất:** generalize một adapter/response dispatcher/navigation bridge cho Focus + Break,
  giữ compatibility và exact Standard regression.
- **Option B:** thêm pipeline Break độc lập với listener riêng.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-04 — Key/channel/copy isolation

- **Option A — đề xuất:** `break-complete:<id>` + Android `break-completion`; giữ nguyên Focus key/channel.
- **Option B:** dùng chung `focus-completion` channel/key prefix.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-05 — Permission timing

- **Option A — đề xuất:** request `undetermined` chỉ sau fresh explicit Break Start; cold startup chỉ read/
  ensure, denied/off không prompt lại.
- **Option B:** Break không bao giờ request, chỉ dùng permission đã có.
- **Option C:** request khi app launch.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-06 — Terminal cleanup

- **Option A — đề xuất:** completed/cancelled/existing terminal đều cancel exact key best-effort; analytics
  chỉ fresh completion.
- **Option B:** chỉ fresh terminal cleanup.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-07 — Analytics properties/crash window

- **Option A — đề xuất:** chỉ `breakType`, `durationMinutes`, completed terminal status; deterministic local
  ID; không startup backfill sau crash window.
- **Option B:** thêm session/source IDs vào properties và reconstruct startup events.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-08 — Reset scope

- **Option A — đề xuất:** cancel exact known Focus/Break PixelDoro keys theo typed session; không cancel-all.
- **Option B:** cancel mọi scheduled notification của app khi confirmed reset.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-09 — Prototype retirement

- **Option A — đề xuất:** production Break không import prototype; giữ scaffolding còn cần cho out-of-scope
  Shop/History/Settings, static gate ngăn nó trở lại Break authority.
- **Option B:** xóa toàn bộ prototype runtime ngay trong US-07-05 và thay các tab liên quan.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-10 — Accessibility/Epic exit evidence

- **Option A — đề xuất:** source/automated audit + owner quick smoke có thể đóng Epic khi owner explicit;
  structured physical-device/formal matrix chưa chạy vẫn ghi `NOT_RUN`/deferred.
- **Option B:** block Epic closure đến khi formal iOS/Android screen-reader matrix pass.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-11 — Review fixtures

- **Option A — đề xuất:** disposable `pixeldoro-us-07-05-*`, real 5/15-minute rows; fast scheduler và one-shot
  platform failures only, không ghi normal DB.
- **Option B:** dùng vài-giây durable Break rows để test nhanh.
- [x] Owner selected option: A — 2026-09-10.

### US0705-CONFIRM-12 — Scope/schema/dependencies

- **Option A — đề xuất:** reuse installed Expo notification/plugin và analytics queue; no schema/package/
  lock/native/provider/settings change; giữ Doctor drift ngoài scope.
- **Option B:** upgrade Expo patch set trong Story này.
- **Option C:** thêm notification receipt/schema.
- [x] Owner selected option: A — 2026-09-10.

## 15. References

- [EPIC-07 User Stories](./EPIC-07_USER_STORIES.md)
- [US-07-04 Plan](./US-07-04_IMPLEMENTATION_PLAN.md)
- [US-07-04 Report](./US-07-04_IMPLEMENTATION_REPORT.md)
- [US-06-05 Plan](./US-06-05_IMPLEMENTATION_PLAN.md)
- [US-06-05 Report](./US-06-05_IMPLEMENTATION_REPORT.md)
- [EPIC-06 Exit Report](./EPIC-06_EXIT_REPORT.md)
- [MVP Epics](./MVP_EPICS.md)
- [Product Core](../PIXELDORO_CORE_TRUTH.md)
- [Timer Engine](../specifications/timer-engine.md)
- [Session Lifecycle](../specifications/session-lifecycle.md)
- [Gamification Rules](../specifications/gamification-rules.md)
- [Pet State Machine](../specifications/pet-state-machine.md)
- [ADR-002 Navigation](../architecture/decisions/ADR-002-navigation-with-expo-router.md)
- [ADR-003 State and Persistence](../architecture/decisions/ADR-003-state-and-persistence.md)
- [ADR-004 Domain/Platform Boundaries](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md)
- [ADR-008 Analytics Guardrails](../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md)

## 16. Change log và validation

| Version | Date | Author | Change |
|---|---|---|---|
| 0.5.0 | 2026-09-10 | Codex | Recorded explicit EPIC-07 closure and EPIC-08 planning authorization. Completed the Story Done checklist while preserving unexecuted formal platform/accessibility/offline/failure cases as deferred, not PASS. |
| 0.4.0 | 2026-09-10 | Codex | Bound exact implementation SHA `f6c7b9269b2abee07bfe8eeb5d804c6245b67c0a` and recorded owner quick UI PASS: no crash, behavior matched expectations. Closed US-07-05 as `DONE_OWNER_ACCEPTED`; structured accessibility/formal evidence remains `NOT_RUN`. |
| 0.3.0 | 2026-09-10 | Codex | Implemented approved Option A candidate: shared typed Focus/Break notification response pipeline, exact Break scheduling/tap/cleanup, fresh-only analytics, finite fixtures, SQLite/integrity tests and device/exit evidence. Full quality and both JS exports PASS; owner/formal smoke remains `NOT_RUN`. |
| 0.2.0 | 2026-09-10 | Codex | Recorded owner approval of all Option A confirmations 01–12, resolved Epic confirmations 05/06, locked shared notification/tap, fresh-only analytics, permission/cleanup/reset/prototype/evidence/no-change boundaries and opened implementation at exact SHA `a3cafa39f6b2882b126562e6c8f54eb186887cc2`. |
| 0.1.0 | 2026-09-10 | Codex | Created owner-gated US-07-05 plan from accepted exact SHA `a3cafa39f6b2882b126562e6c8f54eb186887cc2`; audited reusable Standard notification/analytics pipeline, proposed one shared dispatcher, exact Break tap, fresh-only events, accessibility/prototype integrity and Epic exit evidence with no schema/dependency/native default. |

Planning validation:

- [x] Implementation started from the recorded clean behavior baseline.
- [x] US-07-04 owner acceptance and final exact SHA recorded.
- [x] Confirmation IDs continuous `01→12`; Epic confirmations 05/06 mapped explicitly.
- [x] Production/test/docs changes remain inside approved no-schema/dependency/native scope.
- [x] No unrun automated/manual/formal evidence marked PASS.

Coding gate was satisfied by owner approval of all Option A confirmations. Closure still requires
owner smoke confirmation and final exact SHA binding.
