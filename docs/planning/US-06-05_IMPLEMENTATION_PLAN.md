---
document_id: PIXELDORO_US_06_05_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-06-05 Notification, analytics hooks, accessibility và EPIC-06 exit
version: 0.1.0
status: PROPOSED_OWNER_REVIEW
implementation_status: NOT_STARTED
date: 2026-09-07
owner: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-06
upstream: origin/feats/epic-06
planning_baseline_sha: 87b5bee2976fa6c1990c3b583c669e60e6576018
us_06_04_implementation_sha: da501a74db93001cf4f5600622568ca5424b4fa1
us_06_04_acceptance: OWNER_QUICK_UI_REPORTED_2026_09_07
manual_device_status: US_06_05_NOT_RUN
formal_tester_status: DEFERRED_TO_LATER_PHASE
authority: PLANNING
story_baseline: ./EPIC-06_USER_STORIES.md
previous_story_plan: ./US-06-04_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-06-04_IMPLEMENTATION_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
---

# US-06-05 — Notification, analytics hooks, accessibility và EPIC-06 exit

## 0. Outcome và owner gate

**Priority P1, execution order 05.** Story hoàn thiện vòng Standard Focus bằng local notification
best-effort, typed local analytics hooks, accessibility/integrity regression và EPIC-06 exit evidence.
Không side effect nào được trở thành session/reward truth hoặc chặn core flow.

Owner báo cáo quick UI US-06-04 done ngày 2026-09-07. Plan được tạo trên clean HEAD
`87b5bee2976fa6c1990c3b583c669e60e6576018`; SHA này chứa documentation closure của US-06-04,
trong khi exact code candidate là `da501a74db93001cf4f5600622568ca5424b4fa1`.

**Planning-only:** chưa cài package, chưa sửa config/native, chưa prebuild/build, chưa implement code.
Production implementation chỉ bắt đầu sau khi owner duyệt toàn bộ `US0605-CONFIRM-01`→`12`.

## 1. Authority và phạm vi

Authority order:

1. [Product Core](../PIXELDORO_CORE_TRUTH.md).
2. [EPIC-03 approved UX](./EPIC-03_UX_PROTOTYPE_PLAN.md).
3. [MVP Epics](./MVP_EPICS.md) và completion audit.
4. [Timer Engine](../specifications/timer-engine.md),
   [Session Lifecycle](../specifications/session-lifecycle.md),
   [Gamification](../specifications/gamification-rules.md),
   [Pet State Machine](../specifications/pet-state-machine.md).
5. Architecture/ADR; code/schema là baseline implementation, không thay Product rule.

### 1.1. In scope

- Local notification cho **Standard Focus** kết thúc; ensure sau Start commit, cancel sau terminal.
- OS permission trong context phù hợp; settings preference và denial/failure đều best-effort.
- Notification response/tap chỉ mang allowlisted identity vào durable reconcile/read path.
- Typed local analytics queue cho Standard Start/completed/failed/cancelled/reward-granted.
- Analytics opt-out/dedupe/TTL/capacity/error isolation; không provider delivery trong Story này.
- Accessibility/large text/Reduce Motion/non-color audit cho production Standard Setup/Running/Result,
  recovery/loading/error và common components có consumer liên quan.
- Offline/relaunch/race/integrity regressions, finite development fixtures, device guide/report.
- EPIC-06 exit report và truthful owner/formal evidence state.

### 1.2. Out of scope

- Remote/push notification, Expo push token, APNs/FCM credentials, background remote notification.
- PostHog SDK/provider upload, network worker, billing/retention dashboard; thuộc EPIC-11/provider gate.
- Settings UI/permission management screen; thuộc EPIC-10. Story chỉ đọc persisted preferences.
- Notification cho Break; Break production thuộc EPIC-07.
- Audio/haptic asset/provider, widgets, Live Activities/Dynamic Island, badges, custom sounds.
- Break CTA/cadence, Shop/History/Contribution/Feedback/Store Review và EPIC-07→12 UI.
- Schema/migration mới, server, account/sync, user-facing notification history.

## 2. Baseline audit thực tế

### 2.1. Git/runtime

| Check | Kết quả |
|---|---|
| Branch/upstream | `feats/epic-06` / `origin/feats/epic-06` |
| Planning HEAD | `87b5bee2976fa6c1990c3b583c669e60e6576018` |
| Tree trước plan | Clean; không owner edit cần ghi đè |
| US-06-04 code | `da501a74db93001cf4f5600622568ca5424b4fa1`; owner quick UI reported done |
| Toolchain | Node `22.23.2`, pnpm `11.24.0`, Expo SDK `57.0.17` |
| Latest evidence | 110 files / 618 tests; full quality pass sau `da501a7` |
| Formal tester | `DEFERRED_TO_LATER_PHASE`; không nâng trạng thái từ owner quick smoke |

### 2.2. Capability/code audit

| Capability | Hiện trạng | Reuse | Gap/owner |
|---|---|---|---|
| Notification package | Không có `expo-notifications`; app config không có plugin | Expo app config/EAS profiles | Package/config/native rebuild cần explicit approval |
| Notification port | Chỉ có reset cleanup port + no-op adapter | Reset orchestration pattern | Cần typed operation/permission/response ports và Expo adapter |
| Notification state | Schema cố ý không có notification receipt | Stable `sessionId` + OS scheduled list | No-schema idempotent mapping phải khóa |
| Settings | `notificationsEnabled`, `analyticsEnabled` đã bootstrap/persist, default true | Bootstrap ready snapshot | US-06-05 không thêm Settings UI |
| Analytics taxonomy | Allowlist đã chứa toàn bộ Standard events | `ApprovedAnalyticsEventName` | Cần Standard recorder/property contract |
| Analytics queue | SQLite bounded queue, capacity 1000, TTL 7 ngày, dedupe event ID | `BoundedAnalyticsQueue` | Không cần schema/provider delivery |
| Trial analytics | Production recorder cho onboarding-only, `{}` properties | Validation/error/opt-out pattern | Không generalize làm trial phát Standard event |
| Start hook | Committed Start trả exact session; composition wrapper có post-commit point | Standard slice + application graph | Cần dispatch notification + started analytics non-blocking |
| Terminal hook | Fresh reconcile outcome có exact ID/mode/receipt; Cancel controller có outcome | Lifecycle/outcome coordinator | Cần unified typed terminal side-effect dispatch |
| Startup/relaunch | Reconcile barrier đã có | Startup adapter/active reader | Running ensure; terminal cleanup; no reconstructed analytics replay |
| Notification tap | Chưa có listener/cold-start response handling | First-use/startup barrier + Result exact-ID reader | Cần validate payload/dedupe/dispose ownership |
| Reduce Motion | Store/provider và Pet playback fallback đã production | Reuse | Regression toàn Standard surface |
| Accessibility | Semantics đã có một phần; buttons ≥52px, chips 46px, wrapping ở nhiều rows | Common primitives | Audit grouped labels, large text overflow, countdown announcement |
| Prototype isolation | Standard Setup/Running/Result production; old prototype files còn isolated | Current route arbitration | Static gate không cho prototype trở lại authority |

### 2.3. Expo SDK 57 compatibility evidence

- Official SDK 57 docs recommend `expo-notifications ~57.0.17`, matching Expo `~57.0.17`.
- `NotificationRequestInput.identifier` is optional, allowing deterministic operation identity.
- Permission APIs expose read-only `getPermissionsAsync()` and prompting `requestPermissionsAsync()`;
  iOS provisional authorization must count as allowed.
- `scheduleNotificationAsync`, `getAllScheduledNotificationsAsync` and deterministic cancel support
  ensure/cancel reconciliation; response listener + last response support warm/cold tap paths.
- Config plugin changes require a new native build; local notification does not require push token or
  remote credentials.

Primary sources checked 2026-09-07:
[Expo Notifications SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) and
[Expo notification setup](https://docs.expo.dev/push-notifications/push-notifications-setup/).

## 3. Locked behavior và durable boundary

### 3.1. Post-commit flow

```text
Standard Start transaction COMMIT
  → navigate/refresh Running from committed session
  → best-effort notification ensure(permission/preference)
  → best-effort enqueue focus_session_started

Fresh terminal transaction COMMIT
  → committed Result/Home/Pet flow remains authoritative
  → best-effort cancel completion notification
  → enqueue one terminal event
  → completed only: enqueue reward_granted from receipt
```

Calls may execute concurrently after commit, but none is awaited to decide Start/terminal success.
Thrown/rejected/denied/unavailable side effect is swallowed into finite local diagnostic/review result;
không enter core database recovery và không retry core transaction.

### 3.2. Crash window

MVP accepts loss of a best-effort analytics event or notification operation if process dies after core
commit and before side effect. Relaunch **may ensure notification for a still-running session** and must
cancel a known terminal/stale operation, but does not reconstruct analytics events from historical rows.
This avoids replaying events and matches System Architecture accepted crash-window limitation.

### 3.3. No-schema decision

No new notification table/receipt/ack marker. Operation identity is deterministic:

```text
notification identifier = standard-focus-complete:<sessionId>
payload.kind            = standard_focus_completion
payload.sessionId       = exact Standard session ID
```

Adapter lists scheduled notifications owned by the exact identifier. Exact matching request returns
`already_scheduled`; mismatch under same key is cancelled then recreated. Terminal cancel is safe when
absent. Unknown app/third-party notifications are never cancelled. Schema `analytics_events` already
supports event dedupe/TTL/capacity; no migration gap exists.

## 4. Local notification design

### 4.1. Application-owned ports

Proposed mobile Application contracts (provider-neutral):

```ts
type NotificationPermission = 'allowed' | 'denied' | 'undetermined';

interface FocusCompletionNotificationPort {
  readPermission(): Promise<NotificationPermission>;
  requestPermission(): Promise<NotificationPermission>;
  ensure(input: { operationKey: string; sessionId: string; endsAt: number }):
    Promise<'scheduled' | 'already_scheduled' | 'skipped'>;
  cancel(operationKey: string): Promise<'cancelled' | 'already_absent'>;
}

interface FocusNotificationResponseSource {
  readInitial(): Promise<FocusNotificationResponse | null>;
  subscribe(listener: (response: unknown) => void): () => void;
}
```

Raw Expo response stays Infrastructure; validated application response contains only `kind`, exact
`sessionId`, operation ID and response identity. Port does not expose Expo enums/object graphs.

### 4.2. Permission/preference policy

- If `notificationsEnabled=false`: no permission prompt/schedule; terminal cleanup remains allowed.
- Read OS permission only after committed first Standard Start.
- `allowed` (including iOS provisional): ensure immediately.
- `undetermined`: request once in this contextual Start flow, then ensure only if allowed.
- `denied`: skip silently for core flow; no repeated prompt. Settings guidance waits EPIC-10.
- Prompt/schedule does not block committed navigation. No custom pre-permission modal in this Story.

### 4.3. Scheduling/copy/platform

- One date trigger at persisted `endsAt`, not remaining UI seconds; never repeating.
- If `endsAt <= now` when ensure runs: skip schedule and request existing reconcile path.
- Title proposed: **Phiên tập trung đã kết thúc**.
- Body proposed: **Mèo Dev đang chờ bạn xem kết quả.** No work tag, task text, reward guess or PII.
- Data only allowlisted `kind`, `sessionId`, `url=/focus/session`; handler ignores supplied reward/status.
- Foreground handler may show banner/list, no badge. Use default notification sound only when both
  sound setting and platform permission allow; no custom asset. Android creates stable channel
  `focus-completion` before permission/schedule.

### 4.4. Tap and lifecycle

- Application graph owns one response subscription and removes it on dispose/Fast Refresh.
- Warm tap and cold-start last-response converge into one finite handler, deduped by response ID.
- Validate payload, then refresh/reconcile exact active truth under startup/readiness barrier.
- Running before deadline → production Running. Overdue running → reconcile then exact Result.
- Exact terminal Standard → read-only exact Result; missing/foreign/corrupt → Home/recovery, never latest.
- Repeated/stale tap cannot complete/grant directly and cannot replay Pet/analytics.
- Clear/consume last response after accepted handling so cold start does not loop.

## 5. Standard analytics design

### 5.1. Events và stable IDs

| Event | Trigger | `eventId` | Allowlisted properties |
|---|---|---|---|
| `focus_session_started` | successful committed Standard Start | `focus_session_started:<sessionId>` | `mode`, `workTag`, `durationMinutes` |
| `focus_session_completed` | fresh committed completed outcome | `focus_session_completed:<sessionId>` | above + `terminalStatus=completed` |
| `focus_session_failed` | fresh committed Strict failed | `focus_session_failed:<sessionId>` | above + `terminalStatus=failed` |
| `focus_session_cancelled` | fresh committed cancel | `focus_session_cancelled:<sessionId>` | above + `terminalStatus=cancelled` |
| `reward_granted` | same fresh completed receipt | `reward_granted:<receiptId>` | `durationMinutes`, `xpEarned`, `coinsEarned` |

Session/receipt IDs are local dedupe identity, **not event properties**. No timestamps as properties,
free text, device identifier, Pet name, raw DB record or current balances. All payloads stay below
20 properties/2 KiB. Trial continues emitting only onboarding events with `{}` properties.

### 5.2. Recorder rules

- New `StandardFocusAnalyticsRecorder` validates exact config, status/reward and safe timestamp.
- Recorder owns event construction; screen/composition cannot pass arbitrary event/property maps.
- `analyticsEnabled=false` returns `skipped_disabled`, does not enqueue/backfill later.
- Queue error/throw returns finite error and is ignored by core orchestration.
- Existing unique event ID makes same callback/retry `already_queued`; fresh terminal dispatch only.
- Two completed events (completion + reward) are separate bounded queue operations outside core
  transaction. Partial analytics enqueue is acceptable; core truth never affected.
- Provider upload/PostHog SDK is explicitly deferred; this Story proves local queue facts only.

## 6. Accessibility, UI reuse và prototype exit

### 6.1. Audit/fix targets

- Setup: DurationControl labels/selected states, radiogroups, 44pt+ targets, wrapping at largest text.
- Running: countdown accessible value/caption without announcing every one-second visual tick; mode/tag,
  Strict grace, pending/recovery and Cancel remain reachable in portrait supported sizes.
- Confirmation: focus trapping/escape/back/labels; busy/disabled semantics; no hidden CTA.
- Results: explicit completed/failed/cancelled headings, grouped reward/current progression,
  non-color-only meaning, Home/Retry reachable, animation not required.
- Pet: semantic status outside sprite; Reduce Motion still fallback; hidden pegboard placeholder remains
  absent until future decoration feature.
- Common loading/error/notices: appropriate `polite`/`alert` without duplicate announcements.

`allowFontScaling` remains platform default; no global font cap is proposed. Where rows overflow, wrap or
stack by layout rather than truncating essential copy. Automated semantic tests supplement, not replace,
iOS/Android screen reader and largest-text evidence.

### 6.2. Reuse/ownership matrix

| Existing component/surface | Decision | Change budget | Forbidden logic |
|---|---|---:|---|
| `ScreenShell`, `ScreenHeader`, `Panel` | Reuse; fix layout only if device evidence | ≤60/file | permission/session/navigation |
| `Button`, `ChoiceChip`, `DurationControl` | Reuse/extend stable accessibility props | ≤100/file | config persistence/session Start |
| `CountdownDisplay` | Reuse; refine a11y announcement/value | ≤90 | interval/session decision |
| `ConfirmationDialog` | Reuse; add semantics only with cross-consumer tests | ≤100 | Cancel transition |
| `RewardSummary`, `ProgressionSummary` | Reuse unchanged unless largest-text issue proven | ≤70 | reward calculation |
| `PetVisualStatus`, `PetStage` | Reuse Reduce Motion/text contract | ≤110 | terminal truth |
| Standard screens/branches | Compose typed projections; no SDK import | target ≤220 | Expo/SQL/event construction |
| `create-mobile-application.ts` (821 lines) | Extract side-effect composition slice; do not grow | new slice ≤220 | provider raw types outside adapter |

No production UI file may exceed 300 lines; split review begins at 240–260. Prototype Setup/Session/Result
files remain only for later Epic review surfaces and must not be imported by production Standard routes.

## 7. Proposed modules và task sequence

| Task | Deliverable | Depends | Verification |
|---|---|---|---|
| T01 | Record approvals/start SHA/tree overlap; revise plan if option differs. | Owner | No pending material decision |
| T02 | Add exact Expo package/plugin under approved native gate; no custom config assets. | T01 | config introspection, doctor, lock audit |
| T03 | Provider-neutral notification permission/operation/response ports. | T01 | contract/invalid input tests |
| T04 | Expo adapter: stable ensure/cancel/channel/permission/response mapping. | T02–03 | fake SDK matrix, no raw leaks |
| T05 | Post-commit notification coordinator for Start/terminal/startup/reset. | T04 | denial/throw/relaunch/idempotency |
| T06 | Notification response handler + navigation handoff through durable truth. | T05 | warm/cold/stale/repeat/dispose |
| T07 | Standard typed analytics recorder using existing bounded queue. | T01 | exact IDs/properties/opt-out/dedupe |
| T08 | Wire Start/cancel/reconcile completion/failure hooks outside transaction. | T05,T07 | no core outcome dependency |
| T09 | Accessibility/large-text/Reduce Motion audit and focused fixes. | T08 | semantic/component/device matrix |
| T10 | Finite notification/analytics/a11y review fixtures and manual guide. | T04–09 | dev-only, one-shot, production path |
| T11 | Real SQLite side-effect isolation/integrity journey + static gates. | T08–10 | exact durable and queue facts |
| T12 | iOS/Android Development Builds and manual evidence after native config. | T02–11 | device/build matrix truthful |
| T13 | Full quality/export/scope audit, EPIC-06 exit report, owner handoff. | T12 | exact SHA/status; no future scope |

Expected target ownership:

- `apps/mobile/src/application/notifications/`: contracts/coordinator/response handler.
- `apps/mobile/src/application/standard-focus/standard-focus-analytics.recorder.ts`.
- `apps/mobile/src/infrastructure/platform/notifications/expo-focus-notification.adapter.ts`.
- `apps/mobile/src/composition/standard-focus/create-standard-focus-side-effects.ts`.
- `apps/mobile/src/composition/review/standard-focus-side-effect-review-fixture.ts`.
- Existing Standard controllers gain typed post-commit callbacks; screen/route receive no SDK/repository.
- `apps/mobile/test/integration/standard-focus-side-effects.integration.test.ts`.
- `apps/mobile/test/device/standard-focus-side-effects-exit-smoke.md`.
- `docs/planning/EPIC-06_EXIT_REPORT.md` after implementation/evidence.

Exact filenames may shift one directory within approved layer, but ownership/API boundaries above stay.

## 8. Acceptance checklist — chưa chạy

- [ ] Local notification package/plugin/build compatibility approved and verified for SDK57.
- [ ] Start commit success is independent from permission/schedule/analytics result.
- [ ] Stable ensure produces at most one equivalent notification per Standard session.
- [ ] Terminal completed/failed/cancelled cleanup is safe/idempotent; stale operations reconciled.
- [ ] Preference off/permission denied/undetermined/provisional/adapter failure follow approved policy.
- [ ] Tap/cold response validates exact identity and only enters reconcile/read; no direct grant/status.
- [ ] Standard analytics exact events/IDs/properties enqueue only after corresponding fresh commit.
- [ ] Trial emits no `focus_session_*` or `reward_granted`; opt-out has no backfill.
- [ ] Side-effect failure/partial analytics/crash window never changes committed session/reward/profile.
- [ ] Setup/Running/three Results/recovery pass semantic, large text, screen reader, Reduce Motion audits.
- [ ] Production Standard route contains no prototype fallback or provider SDK import.
- [ ] Offline/relaunch/race/reset regressions and real SQLite facts pass.
- [ ] iOS and Android native build/device evidence status recorded factually.
- [ ] No schema/provider/Break/EPIC-07→12 scope leak.
- [ ] Full quality, Expo exports, config/lock/repository/static checks pass.
- [ ] EPIC-06 exit report, exact committed SHA and owner acceptance recorded.

## 9. Automated và integration matrix

| Layer | Required cases |
|---|---|
| Notification port | invalid ID/time/key; denied/undetermined/allowed/provisional; finite error mapping |
| Expo adapter fake | exact schedule/already/mismatch replacement, absent cancel, Android channel, SDK throws |
| Permission | preference off never prompts; undetermined once; denial no retry; allowed schedules |
| Response | warm/cold/repeated/malformed/foreign/missing/stale; dispose unsubscribe; no raw reward/status trust |
| Analytics | five Standard events, exact property allowlist, invalid config/reward/time, opt-out, TTL/cap/dedupe/error |
| Orchestration | Start failure no side effect; committed Start side effects throw safely; terminal fresh/existing split |
| Lifecycle | foreground/startup running ensure; terminal cleanup; kill/crash-window limitation; concurrency |
| SQLite | full Standard Relax/Strict complete/fail/cancel/reopen; core facts unchanged by queue/adapter failure |
| Trial | onboarding events only, no Standard analytics/notification regression beyond trial-owned behavior |
| Accessibility | role/label/state/live-region, non-color text, touch targets, layout wrapping, Reduce Motion |
| Static | no Expo import outside adapter/composition, no prototype production import, UI ≤300, migration immutable |
| Full | typecheck, lint, Vitest, device validator, boundaries, repository, diff-check, iOS/Android JS export |

Native behavior cannot be proven by SDK mocks or JS export. At least one compatible Development Build
must be rebuilt after adding the config plugin. iOS Simulator supports local notification on supported
modern Xcode/iOS, but formal physical-device/Android evidence remains separately labeled.

## 10. Manual UI guide plan

### 10.1. Evidence header

Record exact implementation SHA, app version/build profile, fixture, platform/device/OS, permission
state, analytics setting, date/time/timezone, online/offline, Reduce Motion/text-size/screen-reader state.
Use confirmed reset only on disposable test data. OS permission reset uses documented simulator/device
settings; never delete owner data silently.

### 10.2. Primary quick smoke

1. Fresh permission undetermined + notification preference enabled; create valid 15/Relax/Study.
   Start navigates immediately from committed truth; contextual OS permission appears at most once.
2. Allow, background app, wait via valid accelerated fixture; exactly one local completion notification.
3. Tap it: reconcile exact session → committed Result, configured +15/+3, no duplicate reward/event.
4. Reopen/repeat stale notification/tap: same Result or Home/running truth, never direct mutation.
5. Create Strict; fail by grace and separately cancel before cutoff: notification cleaned, 0/0 Result.
6. Deny permission on clean permission state and repeat completion: timer/result/reward remain correct.
7. Turn analytics setting off using controlled fixture/repository (Settings UI not in scope): no rows;
   re-enable does not backfill. Enabled flow shows exact local queued IDs/properties only.
8. Inject schedule/cancel/queue throw once: no core Recovery, committed navigation and reward unchanged.

### 10.3. Accessibility/robustness

- VoiceOver iOS and TalkBack Android across Setup, Running, Cancel, completed/failed/cancelled Result,
  permission context and recovery; ensure countdown does not announce every visual second.
- Largest supported text: controls/copy wrap; Start/Cancel/Home/Retry and permission actions reachable.
- Reduce Motion: textual state/reward persists; Pet static fallback; notification truth unchanged.
- Color differentiation disabled/grayscale: selected mode/status/failure identified by text/semantics.
- Offline, background/foreground, terminate/relaunch and duplicate tap; capture screenshots/video/logs.

Formal tester remains `DEFERRED_TO_LATER_PHASE` unless the full signed matrix is actually run. Owner
quick smoke can gate progression but cannot be rewritten as formal iOS+Android certification.

## 11. Risks và recovery

| Risk | Control |
|---|---|
| Native package/config breaks existing build | exact SDK57 install, config diff review, clean dev rebuild, doctor/export |
| Permission prompt harms Start | after commit, contextual, at most once, never outcome dependency |
| Duplicate OS schedules | deterministic key + list/compare/cancel/recreate + terminal cleanup |
| Stale tap grants reward | payload carries identity only; durable reconcile/read owns outcome |
| Analytics becomes arbitrary tracking | recorder-built typed events/properties; no public capture map |
| Queue write shares core transaction | separate post-commit operation; tests assert core commit survives throw |
| Existing outcome replay duplicates terminal analytics | only fresh commit dispatch; deterministic queue ID backstop |
| App graph grows beyond maintainability | extract dedicated side-effect composition slice from 821-line graph |
| Mock claimed as device proof | separate unit/integration/device evidence classes and explicit statuses |
| Large-text fix creates design-system rewrite | evidence-driven changes only, existing common consumer regression |

Notification scheduling is inherently best-effort: OS may suppress or deliver late. Product truth is
verified on app foreground/relaunch from persisted timestamps, not notification presence.

## 12. Owner confirmations — PENDING

### US0605-CONFIRM-01 — Story scope và execution

- **A (đề xuất):** implement notification + local Standard analytics + accessibility/integrity + exit
  in one final Story, tasks T01→T13; no future-Epic UI.
- **B:** split US-06-05 into multiple Stories; clearer commits but changes approved Epic order/docs.
- **Ảnh hưởng:** without approval, implementation scope/exit gate is not stable.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-02 — Native dependency/config authorization

- **A (đề xuất):** authorize `expo-notifications ~57.0.17`, app config plugin and rebuilt iOS/Android
  Development Builds; local-only, no push token/APNs/FCM/custom sound.
- **B:** do not add native dependency; revise EPIC-06 exit to defer notification (authority change).
- **Trade-off:** A satisfies locked local notification but creates native rebuild/testing work; B keeps
  repo stable but cannot claim current EPIC-06 notification acceptance.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-03 — Permission UX

- **A (đề xuất):** after first committed Standard Start, if preference on + OS undetermined, request
  once without blocking navigation; denial silently skips and waits future Settings guidance.
- **B:** custom explainer modal before OS prompt; clearer context but adds new UX/copy/screen state.
- **C:** request on first launch; simplest wiring but violates contextual permission intent.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-04 — Notification identity/no-schema

- **A (đề xuất):** deterministic `standard-focus-complete:<sessionId>`, OS list/compare/replace,
  idempotent exact cancel; no durable notification receipt/migration.
- **B:** add local notification-operation table; stronger audit but unproven schema/user-value need.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-05 — Notification content/sound

- **A (đề xuất):** generic Vietnamese title/body in §4.3, no tag/reward/task data, no badge/custom asset;
  default sound only when sound setting permits.
- **B:** include mode/tag/reward; richer but privacy/stale-result risk and unnecessary payload.
- **C:** always silent; low interruption but weakens completion reminder experience.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-06 — Notification tap authority

- **A (đề xuất):** exact identity → startup/readiness barrier → reconcile/read → Running/Result/Home;
  repeated/malformed response ignored/recovered, never latest or direct complete/grant.
- **B:** deep-link directly to Result by route data; shorter but can render stale/uncommitted truth.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-07 — Standard analytics taxonomy/properties

- **A (đề xuất):** five approved events and minimal properties in §5.1; IDs only local dedupe key,
  never properties; Trial exclusion retained.
- **B:** events with empty `{}` like onboarding; safer privacy but loses mode/duration/tag metrics.
- **C:** add broad device/UI properties; violates minimization and schema-review boundary.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-08 — Analytics delivery boundary

- **A (đề xuất):** enqueue existing bounded SQLite queue only; no PostHog SDK/network delivery; accept
  post-commit crash-window loss and do not backfill/reconstruct events.
- **B:** integrate PostHog now; violates EPIC-11/provider delivery scope and expands cost/privacy work.
- **C:** reconstruct missing events on startup; improves counts but risks historical replay semantics.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-09 — Side-effect orchestration

- **A (đề xuất):** extract dedicated Standard side-effect composition/coordinator; invoke typed hooks
  after commit, run independently, never enter core Recovery for notification/analytics failure.
- **B:** place SDK/queue calls in controllers/routes; less file work but violates layering/testability.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-10 — Accessibility fix boundary

- **A (đề xuất):** audit/fix production Standard + affected common consumers; default font scaling,
  wrapping/stacking, semantic tests + manual VoiceOver/TalkBack/large text/Reduce Motion.
- **B:** global design-system rewrite; broader consistency but speculative and high regression risk.
- **C:** report issues only; cannot satisfy Epic exit accessibility requirements.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-11 — Fixtures/device evidence

- **A (đề xuất):** finite dev-only permission/schedule/cancel/queue/tap fixtures through production
  orchestration; owner quick smoke, formal tester deferred unless actually run; iOS+Android build status explicit.
- **B:** mocks/validator count as device pass; faster but factually invalid.
- **C:** require full formal tester before candidate; strongest evidence but blocks current iteration.
- [ ] Owner selected option: PENDING.

### US0605-CONFIRM-12 — Epic exit/next-step gate

- **A (đề xuất):** close EPIC-06 only after code committed, full quality/native evidence, report and
  owner quick UI acceptance; formal matrix may remain deferred and is recorded as limitation.
- **B:** close at automated pass before owner UI; faster but breaks established progression gate.
- **C:** start EPIC-07 implementation in parallel; increases active-session/notification overlap risk.
- [ ] Owner selected option: PENDING.

## 13. Definition of Ready / Done

### Ready before production code

- [x] US-06-04 exact implementation SHA and owner quick UI progression acceptance recorded.
- [x] Notification/analytics/a11y current code, schema, dependencies and native config audited.
- [x] Official SDK57 compatibility evidence and exact proposed dependency recorded.
- [x] No schema gap found; task sequence/test/manual plan prepared.
- [ ] Owner approves `US0605-CONFIRM-01`→`12`.
- [ ] Implementation start SHA/tree overlap recorded after approval.

### Done after implementation

- [ ] All §8 acceptance and §9 automated/integration gates have factual evidence.
- [ ] Native package/config/build/device evidence matches approved Option; no remote provider scope.
- [ ] Manual guide/report distinguish owner quick smoke from formal tester.
- [ ] Exact committed implementation SHA and owner acceptance recorded.
- [ ] EPIC-06 exit report closes only achieved items and preserves deferred limitations.
- [ ] US-06-05/EPIC-06 accepted before EPIC-07 implementation begins.

## 14. References, change log và planning validation

References: [EPIC-06 Stories](./EPIC-06_USER_STORIES.md),
[US-06-04 Report](./US-06-04_IMPLEMENTATION_REPORT.md),
[Technical Overview](../architecture/technical-overview.md),
[System Architecture](../architecture/system-architecture.md),
[Project Structure](../architecture/project-structure.md),
[Data Model](../architecture/data-model.md),
[ADR-004](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md),
[ADR-008](../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md).

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-09-07 | Codex | Created owner-gated US-06-05 plan after US-06-04 quick UI; audited notification native gap, reusable local analytics queue, accessibility targets, 12 confirmations and Epic exit evidence. |

Validation required for this planning turn:

- [x] `git diff --check`.
- [x] All local Markdown links resolve across the five touched documents.
- [x] Confirmation IDs continuous 01–12 and all 12 remain PENDING.
- [x] Only planning/device-guide Markdown changed; no production/package/config/schema/native/generated code.
- [x] No US-06-05 implementation/acceptance/device checkbox falsely marked complete.
- [x] EPIC-07→12 and provider delivery remain out of scope.

**US-06-05 implementation has not started. Await owner approval of all 12 confirmations.**
