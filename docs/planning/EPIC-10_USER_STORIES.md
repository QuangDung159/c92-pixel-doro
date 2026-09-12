---
document_id: PIXELDORO_EPIC_10_USER_STORIES
title: PixelDoro EPIC-10 — Settings & Data Control User Stories
version: 0.3.0
status: OWNER_ACCEPTED_CLOSURE_READY_PENDING_EXACT_SHA
date: 2026-09-12
owner: Dũng Lư
branch: feats/epic-10
upstream: origin/feats/epic-10
baseline_sha: e55a2e00ddb6f5804b53fffd9df367e1902a42e5
baseline_identity: EXACT_COMMITTED_PUSHED_SHA
worktree_at_audit: DIRTY_PREEXISTING_DOCUMENTATION_ONLY
previous_epic: EPIC-09
previous_epic_status: DONE_OWNER_ACCEPTED_IN_PREEXISTING_UNCOMMITTED_CLOSURE_RECORDS
implementation_status: REVIEW_PASS_UNCOMMITTED_AFTER_4FA1EF3
manual_device_status: PASS_OWNER_QUICK_UI_NO_CRASH_2026_09_12
formal_tester_status: NOT_RUN
schema_change: NONE_PROPOSED_SCHEMA_001_SUFFICIENT
dependency_change: APPROVED_OPTION_A_EXPO_AUDIO_HAPTICS
native_change: APPROVED_OPTION_A_EXPO_AUTOLINK_AND_AUDIO_CONFIG
authority: PLANNING
product_truth: ../PIXELDORO_CORE_TRUTH.md
epic_baseline: ./MVP_EPICS.md
data_model: ../architecture/data-model.md
---

# EPIC-10 — Settings & Data Control

## Closure review update

Owner reported quick UI testing complete without a crash and requested EPIC-10 closure review on
2026-09-12. All five Story outcomes are owner accepted at the reviewed worktree. Automated quality is
green at 212 files / 1,080 tests, final iOS/Android JS exports pass, and the iOS Development Build was
rebuilt with ExpoAudio/ExpoHaptics and opened successfully. The only closure blocker is binding the
reviewed fixes after `573cd8d` to an exact commit SHA under separate commit authorization. Formal
cross-platform/accessibility breadth remains deferred and is not relabeled PASS.

## 0. Outcome, document boundary và authority

Tài liệu này là audit/breakdown trước implementation. Sau EPIC-10, người dùng phải có thể chọn
default Focus, kiểm soát notification/audio/haptic/anonymous analytics, và xóa toàn bộ dữ liệu local
bằng một flow có cảnh báo, atomicity, Recovery và bằng chứng offline/relaunch rõ ràng.

Không có code, migration, dependency, native config, implementation plan, commit hoặc push nào được
ủy quyền bởi tài liệu này. Mỗi Story tiếp tục bị chặn bởi owner confirmation tương ứng.

### 0.1. Source-of-truth hierarchy

Khi có mâu thuẫn, dùng thứ tự sau:

1. `docs/PIXELDORO_CORE_TRUTH.md` hiện hành cho Product truth `LOCKED`/`MVP_DEFAULT` và scope.
2. ADR `ACCEPTED`, Architecture/Data Model `APPROVED`, rồi Specification `APPROVED` cho technical truth.
3. `MVP_EPICS.md`, Epic Exit Report mới nhất và owner-approved Story records cho sequencing/evidence.
4. Production implementation đã commit chỉ chứng minh capability đang có; code không tự tạo Product rule.
5. EPIC-03 prototype chỉ là UX evidence; fake reducer, copy và control không phải production truth.
6. Nội dung `OPEN`, `PROPOSED`, `DEFERRED`, unchecked hoặc historical stale không thành requirement.

Authority conflict được phát hiện phải block phần bị ảnh hưởng và đưa về owner; không tự chọn theo code.

### 0.2. Product truth đã khóa cho EPIC-10

- Mobile MVP offline-first, no-account; SQLite là durable truth và Zustand/controller chỉ là projection.
- Settings MVP gồm default Focus duration/mode, sound, haptics, notification preference và analytics.
- Seed/reset là `25 / 5 / 15 / relax`, sound/haptic/notification/analytics bật.
- Sound phải có setting tắt hoàn toàn; haptic phải có setting tắt.
- Notification preference không phải OS permission truth; permission chỉ được hỏi trong context phù hợp.
- Permission denied/restricted/unavailable không được làm hỏng Timer/Session/Reward/Recovery.
- Analytics opt-out phải dừng capture ngay, clear queue, rotate anonymous ID và không backfill khi bật lại.
- Confirmed full reset xóa product rows/projections atomically, giữ schema/migration/exact catalog hợp lệ.
- Reset thất bại rollback/Recovery, không báo success giả; không có partial XP/Coin/history/inventory reset.
- Reduced Motion là platform preference được consume trong Presentation; không persist thành app setting.
- Side-effect SDK call luôn ngoài core transaction và failure không đổi Session/Reward truth.

## 1. Git và baseline audit

| Item | Exact audit result |
|---|---|
| Repository | `/Users/dunglu/Documents/Working/c92-pixel-doro` |
| Branch | `feats/epic-10` |
| HEAD / exact planning baseline | `e55a2e00ddb6f5804b53fffd9df367e1902a42e5` |
| Upstream | `origin/feats/epic-10` |
| HEAD decoration | local `feats/epic-10`, `origin/feats/epic-10`, local/remote `dev` cùng SHA |
| Baseline commit | `Feats/epic 09 (#12)`, 2026-09-12T15:04:52+07:00 |
| Ahead/behind | Không có divergence được `git status --branch` báo cáo |
| Worktree | Dirty trước task; 5 modified planning documents, không có staged/untracked/code change |
| Task mutation policy | Giữ nguyên 5 owner changes; chỉ thêm file planning này |

Pre-existing owner changes, không do task này tạo:

- `docs/planning/EPIC-09_EXIT_REPORT.md`
- `docs/planning/EPIC-09_USER_STORIES.md`
- `docs/planning/MVP_EPICS.md`
- `docs/planning/US-09-05_IMPLEMENTATION_PLAN.md`
- `docs/planning/US-09-05_IMPLEMENTATION_REPORT.md`

Diff của năm file trên đổi closure metadata/checklist từ pending sang `DONE_OWNER_ACCEPTED`, ghi owner
closure ngày 2026-09-12 tại accepted behavior SHA
`a1abf5fecea6f27483de024bc64df2f2b2bfe0b5`, và chỉ mở EPIC-10 planning ở thread riêng. Vì các
closure edits chưa commit, kế hoạch ghi trung thực: dependency gate được owner mở trong pre-existing
worktree evidence; exact Git baseline vẫn là `e55a2e0...`.

## 2. Toàn bộ tài liệu đã đọc/audit

### 2.1. Product, architecture, decisions và specifications

- `docs/PIXELDORO_CORE_TRUTH.md`
- `docs/TECHNICAL_DOCUMENTATION_CHECKLIST.md`
- `docs/architecture/data-model.md`
- `docs/architecture/project-structure.md`
- `docs/architecture/system-architecture.md`
- `docs/architecture/technical-overview.md`
- `docs/architecture/decisions/ADR-001-mobile-runtime-and-toolchain.md`
- `docs/architecture/decisions/ADR-002-navigation-with-expo-router.md`
- `docs/architecture/decisions/ADR-003-state-and-persistence.md`
- `docs/architecture/decisions/ADR-004-domain-and-platform-boundaries.md`
- `docs/architecture/decisions/ADR-005-animation-stack.md`
- `docs/architecture/decisions/ADR-006-in-app-feedback-and-store-review.md`
- `docs/architecture/decisions/ADR-007-eas-delivery-pipeline.md`
- `docs/architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md`
- `docs/specifications/gamification-rules.md`
- `docs/specifications/pet-state-machine.md`
- `docs/specifications/session-lifecycle.md`
- `docs/specifications/timer-engine.md`

### 2.2. Epic/master planning, evidence và exit records

- `docs/planning/MVP_EPICS.md`
- `docs/planning/EPIC-01_IMPLEMENTATION_EVIDENCE.md`
- `docs/planning/EPIC-01_TO_05_COMPLETION_AUDIT_AND_NEXT_PLAN.md`
- `docs/planning/EPIC-01_USER_STORIES.md`
- `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`
- `docs/planning/EPIC-02_USER_STORIES.md`
- `docs/planning/EPIC-03_UX_PROTOTYPE_PLAN.md`
- `docs/planning/EPIC-04_EXIT_REPORT.md`, `EPIC-04_USER_STORIES.md`
- `docs/planning/EPIC-05_EXIT_REPORT.md`, `EPIC-05_USER_STORIES.md`
- `docs/planning/EPIC-06_EXIT_REPORT.md`, `EPIC-06_USER_STORIES.md`
- `docs/planning/EPIC-07_EXIT_REPORT.md`, `EPIC-07_USER_STORIES.md`
- `docs/planning/EPIC-08_EXIT_REPORT.md`, `EPIC-08_USER_STORIES.md`
- `docs/planning/EPIC-09_EXIT_REPORT.md`, `EPIC-09_USER_STORIES.md`

### 2.3. Toàn bộ Story plans/reports/artifacts hiện có

- `US-02-01_IMPLEMENTATION_PLAN.md` đến `US-02-09_IMPLEMENTATION_PLAN.md`.
- `US-04-03_IMPLEMENTATION_REPORT.md` đến `US-04-06_IMPLEMENTATION_REPORT.md`;
  `US-04-07_ART_CANDIDATE_REVIEW.md`, `US-04-07_IMPLEMENTATION_REPORT.md`, `US-04-07_TEST_GUIDE.md`.
- `US-05-01_IMPLEMENTATION_PLAN.md` đến `US-05-05_IMPLEMENTATION_PLAN.md` và matching
  `US-05-01_IMPLEMENTATION_REPORT.md` đến `US-05-05_IMPLEMENTATION_REPORT.md`.
- `US-06-01_IMPLEMENTATION_PLAN.md` đến `US-06-05_IMPLEMENTATION_PLAN.md` và matching reports.
- `US-07-01_IMPLEMENTATION_PLAN.md` đến `US-07-05_IMPLEMENTATION_PLAN.md` và matching reports.
- `US-08-01_IMPLEMENTATION_PLAN.md` đến `US-08-05_IMPLEMENTATION_PLAN.md` và matching reports.
- `US-09-01_IMPLEMENTATION_PLAN.md` đến `US-09-05_IMPLEMENTATION_PLAN.md` và matching reports.

### 2.4. Manual device guides

Toàn bộ Markdown trong `apps/mobile/test/device/` đã được audit: 39 smoke guides hiện có, từ
`foundation-smoke.md`, các EPIC-02 persistence/bootstrap/reset guides, Pet/Onboarding/Standard
Focus/Break/Shop/History/Contribution guides đến `epic-09-exit-smoke.md`. Format kế thừa bắt buộc:
exact SHA, isolated DB, fixture/env, platform/device/OS/network/settings metadata, từng case
`PASS/FAIL/BLOCKED/NOT_RUN`, cleanup, và không suy diễn manual PASS từ test/export.

## 3. Capability inventory và authority classification

| Capability | Classification | Evidence/audit verdict |
|---|---|---|
| Schema `001` `app_settings` | Production, reusable | Đã có exact constraints/defaults; không thấy schema gap EPIC-10. |
| Bootstrap settings snapshot | Production, reusable | Hydrate đủ duration/break/mode/sound/haptic/notification/analytics. |
| `AppSettingsRepository.find/replace` + SQLite mapper | Production, reusable nhưng cần extend | Full-row replace có validation; chưa có transaction-scoped patch/CAS chống stale overwrite. |
| Focus Setup | Production, cần integrate | Controller đang reset về hard-coded `25/relax/coding`; chưa consume user defaults. |
| Notification preference consumption | Production, reusable | Focus/Break coordinator đã skip khi off, đọc/request permission, schedule/cancel best-effort. |
| Notification native adapter | Production, reusable | `expo-notifications`, stable keys, permission states, Android channels và sound policy đã có. |
| Local analytics queue/hooks | Production, reusable | Bounded queue/event hooks có opt-in check; chưa có provider delivery (đúng EPIC-11). |
| Confirmed reset use case/SQLite adapter | Production, reusable, not user-wired | Atomic clear/reseed/postcondition/rebootstrap/probe có; nằm ngoài public Presentation facade. |
| Bootstrap/critical Recovery | Production, reusable | Loading/recovery/Retry barrier và sanitized diagnostics đã có. |
| Reduced Motion store/provider | Production, reusable | Đọc/subcribe OS preference; không persist. |
| Common UI | Production, reusable/extend | `Panel`, Button, `ChoiceChip`, `DurationControl`, `ConfirmationDialog`, Header, states, notice, shell. |
| Settings route/screen/toggles | Prototype-only | Dùng local `useState`, raw RN `Switch`, `PrototypeBadge`, break reviewer shortcut; không persist. |
| Feedback entry | Prototype UX evidence; EPIC-11 owner | Không kéo feedback submit/store review vào EPIC-10. |
| Audio/haptic feedback | Missing | Chưa dependency/adapter/asset/production call; audio directory chỉ có `.gitkeep`. |
| Settings application slice | Missing | Chưa use case/controller/facade/hooks, stale arbitration, per-field error/retry. |
| Analytics opt-out orchestration | Missing | Chưa privacy command commit-off → stop/clear/rotate → refresh; no backfill tests. |
| Production reset surface | Missing | Chưa Settings confirmation/busy/result/navigation, public facade hoặc consumer tests. |
| Provider analytics/dashboard | Deferred to EPIC-11 | Không được implement trong EPIC-10. |
| Formal beta/device breadth | Deferred to EPIC-12 unless run | Không được relabel PASS bằng automated evidence. |
| Prototype reviewer controls/fake settings | Non-authoritative | Chỉ giữ làm review evidence tới production replacement được owner accept. |
| Historical pending EPIC-09 copy | Superseded | Exit Report/owner closure record mới hơn quyết định trạng thái; không dùng stale sentence làm blocker. |

### 3.1. Component-size audit

Production visual components hiện có đều dưới 240 dòng. `SettingsScreen` prototype khoảng 100 dòng.
Các file vượt 300 dòng hiện là composition/application/infrastructure/diagnostic modules, không phải
visual component; EPIC-10 không được làm chúng phình thêm thiếu kiểm soát. `mobile-application-context.tsx`
đã 322 dòng nên Settings hooks phải tách sang feature provider module thay vì nối tiếp vào file này.

## 4. Product scope

### 4.1. In scope

- Production Settings screen và persisted default Focus duration/mode.
- Persisted sound/haptic preference và actual in-app feedback obeying those controls.
- Notification preference, live OS permission status, contextual request/education và active schedule sync.
- Coordinated anonymous analytics opt-out/opt-in local behavior.
- Explicit confirmed full local-data reset, reset barrier, retry/recovery và post-reset onboarding handoff.
- Offline/background/foreground/cold-relaunch/accessibility behavior và isolated device evidence.
- Backward-compatible common component extensions và regression cho mọi consumer.

### 4.2. Explicit out of scope

- Feedback submission, store-review CTA/native review, PostHog provider/delivery/dashboard/cost ops (EPIC-11).
- Beta readiness, store build/release sign-off và full formal device matrix ownership (EPIC-12).
- Account/server deletion, cloud backup/sync, remote/push notification, APNs/FCM token.
- Partial reset, export/import/backup, analytics history viewer, advanced audio mixer/volume/custom pack.
- Configurable short/long Break duration, default work tag, remember-last-setup behavior, Pet naming.
- Native app blocking, widgets, Live Activities, Dynamic Island, desktop.
- Schema/migration change unless a newly discovered approved authority conflict is brought to owner.

## 5. Ordered User Story summary

| Order | Story | Priority | Observable user outcome | Dependency/gate | Independent rollback |
|---:|---|---|---|---|---|
| 1 | `US-10-01` — Production Settings và Focus defaults | P0 | Xem/sửa Settings đã lưu; phiên Setup mới dùng duration/mode mặc định | EPIC-09 closure + `US1000-CONFIRM-01/02` | Route/controller/default integration only |
| 2 | `US-10-02` — Anonymous analytics privacy control | P0 data/privacy | Opt out dừng capture, xóa queue, rotate ID; opt in không backfill | US-10-01 + `CONFIRM-03` | Remove privacy command/UI; keep queue schema |
| 3 | `US-10-03` — Confirmed full local-data reset | P0 destructive data | Cảnh báo rõ, reset atomic, về onboarding; failure giữ data | US-10-01/02 + `CONFIRM-04` | Remove production surface/wiring; retain proven reset kernel |
| 4 | `US-10-04` — Notification preference và permission transparency | P1 | User hiểu app preference vs OS state; toggle không phá timer | US-10-01 + `CONFIRM-05` | Revert Settings wiring; existing Focus/Break notification stays |
| 5 | `US-10-05` — Sound/haptic quiet controls và Epic integrity | P1 | Actual feedback obeys toggles across accepted flows | US-10-01→04 + `CONFIRM-06/07` | Disable/remove new adapters/hooks/assets independently |

Execution ưu tiên foundation bắt buộc trước, sau đó privacy/destructive-data risk, rồi platform
permission và sensory feedback. Không Story nào chỉ là UI/database/refactor/testing.

## 6. Shared Story contract

Áp dụng cho cả năm Story:

- Route/screen chỉ gọi hooks/facade, subscribe projection, gửi intent, layout component và navigation.
- Business validation, persistence, permission orchestration, analytics identity, reset transaction nằm
  ở Domain/Application/Infrastructure owner tương ứng.
- Screen/component tối đa 300 dòng; review split từ khoảng 240. Không boolean-prop explosion.
- Settings commands serialize cùng durable/analytics/reset barrier; duplicate intent coalesce hoặc no-op.
- UI không optimistic-claim durable success. Last committed snapshot thắng; stale completion không ghi đè.
- Offline không block read/write local. Network/provider failure không đổi UI truth của core loop.
- Missing/corrupt settings singleton là Recovery, không phải Empty/default fallback.
- Mọi fixture dùng exact disposable DB prefix `pixeldoro-us-10-<story>-`; không mở/reset/xóa
  `pixeldoro.db`.
- Automated, owner quick smoke, structured device evidence và formal tester status luôn tách biệt.

## 7. US-10-01 — Production Settings và durable Focus defaults

### 7.1. Identity, outcome, priority và gates

- **User outcome:** người dùng mở Cài đặt, thấy committed values, đổi default duration/mode và lần
  mở Focus Setup kế tiếp bắt đầu từ default mới.
- **Priority/order:** P0, Story 1; foundation cho toàn bộ settings/privacy/data-control UI.
- **Dependencies:** EPIC-09 owner closure evidence; schema/bootstrap/repository EPIC-02; production
  Focus Setup EPIC-06; approved EPIC-03 hierarchy.
- **Prerequisite gate:** owner duyệt `US1000-CONFIRM-01` và `US1000-CONFIRM-02`; record exact
  implementation-start SHA; worktree changes được re-audit.
- **Owner confirmation before coding:** `[x] APPROVED_OPTION_A_2026-09-12`.

### 7.2. Scope, rules và output

**In scope:** replace route ownership from prototype to production; load singleton settings; edit
duration `15..120 step 5` and `relax|strict`; durable atomic update; refresh projection; seed fresh
Focus Setup from committed defaults; keep work tag `coding` because no default-tag requirement exists.

**Out of scope:** remember last Setup selection, configurable Break durations, audio/haptic/notification/
analytics side-effect orchestration, reset, feedback, provider analytics, schema change.

**Authority:** Product Core §5, §14, §15; Data Model §4.2, §7.8, `DM-OPEN-004`; ADR-002/003/004;
MVP EPIC-10; EPIC-03 UX data-needs map. Prototype layout/copy is evidence only.

**Concrete output:** production settings slice/controller/hooks/screen; common toggle/action-row
primitives needed by later Stories; Settings route no longer imports prototype state; Focus Setup reads
committed default duration/mode on each fresh entry; standalone guide proposed as
`apps/mobile/test/device/settings-focus-defaults-smoke.md`.

### 7.3. Facts, ownership, transaction và states

| Concern | Contract |
|---|---|
| Durable reads | `app_settings` singleton and `updated_at`; Bootstrap projection may be read cache only after verified hydration. |
| Durable writes | `focus_duration_minutes`, `default_mode`, `updated_at`; preserve all unrelated columns. |
| Domain | Existing Focus duration/mode validation; no UI clamping or default invention. |
| Application | Load/update use case, Settings controller finite state, command serialization, committed refresh and Setup-default handoff. |
| Infrastructure | Extend repository with transaction-scoped read/patch or safe equivalent; SQL remains here. |
| Presentation | Route/hooks/projection, layout, intent; reusable `DurationControl`, `ChoiceChip`, Panel/Header/states. |
| Transaction | One read-validate-patch-write per user change; no full-row stale overwrite. Commit precedes ready/success UI. |
| Concurrency/idempotency | Single-flight per intent; identical committed value is no-op; last serialized user intent wins; late prior read/write cannot replace newer projection. |

UI state contract:

- `loading`: initial verified read; controls disabled, polite announcement.
- `ready`: exact committed values; no empty state because singleton is required.
- `saving`: changed control busy/disabled; other intent is serialized, not interleaved.
- `error`: finite friendly copy; committed value remains visible; retry exact pending intent.
- `retry`: re-read before applying stale pending value; user can dismiss by choosing current value.
- `stale`: background/relaunch/newer command revision wins; late completion dropped.
- missing/corrupt singleton: enter shared Recovery; never fabricate seed defaults in screen.

Navigation/lifecycle/offline:

- Settings tab activates/refreshes on focus; leaving screen cancels subscription, not durable command.
- Background during save allows command to settle; foreground refreshes and arbitrates revision.
- Cold relaunch reads committed defaults; Focus Setup uses them only for a new draft, never mutates an
  already-running session.
- Airplane mode has no effect. Permission states are not read in this Story.
- Analytics: no new event; settings values are never analytics properties.
- Accessibility: radiogroup/selected/disabled/busy semantics, 44/48pt-equivalent targets, readable
  order, dynamic type wrap/scroll, no meaning by color/motion.
- Rollback: restore route to prototype without touching schema/data; revert Setup default injection;
  committed rows remain valid and old code reads them.

### 7.4. Acceptance criteria

- [ ] Settings route uses production facade/hooks and contains no repository/SQLite/business rule.
- [ ] Initial load equals exact committed `app_settings`; no flash of fake defaults as Ready.
- [ ] Duration rejects values outside `15..120 step 5`; mode accepts only Relax/Strict.
- [ ] Each accepted change commits atomically and preserves every unrelated settings field.
- [ ] Duplicate/rapid/stale actions cannot lose a newer committed setting.
- [ ] Focus Setup fresh entry uses saved duration/mode; work tag remains existing `coding` default.
- [ ] Back/reopen, background/foreground, offline and cold relaunch retain committed values.
- [ ] Read/write failure gives truthful Retry; corrupt/missing data enters Recovery.
- [ ] Prototype break shortcut/badge/copy are absent from production Settings route.
- [ ] No component exceeds 300 lines; files near 240 lines have split review evidence.

### 7.5. Automated-test checklist

- [ ] Domain tests cover all duration boundaries/steps and exact mode values.
- [ ] Application use-case/controller tests cover load/save/no-op, duplicate, rapid order, failure,
  retry, deactivate/reactivate and stale completion.
- [ ] Persistence tests cover transaction-scoped patch, unrelated-column preservation, rollback,
  missing/corrupt row and real SQLite reopen.
- [ ] Composition tests prove bootstrap/repository/controller/Setup default wiring.
- [ ] Presentation tests cover loading/ready/saving/error/Retry and accessibility semantics.
- [ ] Route/static-boundary tests prove no prototype/SQLite import and no feedback/reset scope leak.
- [ ] Offline/relaunch integration uses real isolated SQLite.
- [ ] Existing `DurationControl`, `ChoiceChip`, Button, Panel, Header and Focus Setup consumers regress.

### 7.6. Manual UI/device guide — `settings-focus-defaults-smoke.md`

Planning-time exact implementation SHA: `NOT_AVAILABLE_PRE_IMPLEMENTATION`; không được thay bằng
baseline SHA. Guide chỉ điền giá trị này sau khi có implementation commit cần review.

- [ ] Setup: `cd /Users/dunglu/Documents/Working/c92-pixel-doro`; use pinned Node `22.23.2`,
  `git rev-parse HEAD`, and record exact implementation SHA/build profile.
- [ ] Run one fixture at a time with `EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE=settings_defaults_<case> pnpm start --clear`.
- [ ] Confirm database prefix `pixeldoro-us-10-01-`; never open/mutate/delete `pixeldoro.db`.
- [ ] Happy path: set `50/strict`, leave/reopen Settings, open fresh Setup and see `50/strict/coding`.
- [ ] Alternate: min/max/step, same-value no-op, rapid changes and Back during saving.
- [ ] Error/Retry: read failure once and write failure once preserve committed values, then retry once.
- [ ] Background/foreground during load/save; no stale visual overwrite.
- [ ] Airplane mode repeats happy/error path with provider-independent behavior.
- [ ] Cold relaunch confirms Settings and new Setup use committed defaults.
- [ ] Largest system text keeps every value/control/error/CTA reachable by scroll.
- [ ] VoiceOver iOS/TalkBack Android announce group, label, value, selected/disabled/busy and Retry.
- [ ] Reduce Motion retains all meaning; no animation is required.
- [ ] Cleanup: unset `EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE`, stop Metro, restart normal app; do not
  remove any DB except the exact disposable fixture via its confirmed test reset.
- [ ] Evidence row includes platform/device-or-simulator/OS/app version/network/text size/screen reader/
  Reduce Motion/fixture/database/exact SHA/artifact and `PASS/FAIL/BLOCKED/NOT_RUN`.
- [ ] Do not infer manual PASS from unit/integration tests, route checks or JS export.

Fixture requirements: default-ready, persisted-custom, read-failure-once, write-failure-once,
rapid-stale-result; deterministic clock/revision and dedicated DB per case.

**Definition of Ready:** `[ ]` confirmations approved; `[ ]` start SHA/status captured; `[ ]` exact
contracts/fixture names reviewed; `[ ]` no owner change overwritten.

**Definition of Done:** `[ ]` output/acceptance/automated checks pass; `[ ]` guide exists with honest
statuses; `[ ]` owner accepts exact committed SHA; `[ ]` US-10-02 coding remains separately gated.

## 8. US-10-02 — Anonymous analytics privacy control

### 8.1. Identity, outcome, priority và gates

- **User outcome:** người dùng tắt anonymous analytics và có bảo đảm local observable rằng capture
  dừng, pending queue bị xóa, identity được rotate; bật lại bắt đầu sạch và không backfill.
- **Priority/order:** P0 privacy/data, Story 2.
- **Dependencies:** US-10-01 accepted; local queue/event hooks and installation/settings repositories.
- **Prerequisite gate:** `US1000-CONFIRM-03` approved; exact prior Story SHA and start SHA recorded.
- **Owner confirmation before coding:** `[x] APPROVED_OPTION_A_2026-09-12`.

### 8.2. Scope, rules và output

**In scope:** analytics toggle; coordinated command with capture barrier; commit `analytics_enabled=0`
first; refresh in-memory setting; clear queue; rotate `anonymous_analytics_id`; recover/retry cleanup;
safe opt-in with existing rotated identity; no backfill.

**Out of scope:** PostHog SDK/network delivery, dashboard, person profile, analytics consent screen,
event-taxonomy expansion, viewing/exporting events, feedback/store review.

**Authority:** Product Core §2.5, §13, §15.2; ADR-008; Data Model §4.1/4.2/7.8/9; EPIC-05/06/07/08/09
local event hooks. Exact rule is already approved; confirmation chooses error/UI orchestration only.

**Concrete output:** privacy command/controller projection, transaction-safe repository operations,
Settings control/status/Retry, aggregate local-queue proof and
`apps/mobile/test/device/analytics-privacy-control-smoke.md`.

### 8.3. Facts, ownership, transaction và states

| Concern | Contract |
|---|---|
| Durable reads | Current analytics preference, installation anonymous ID, queue count/fingerprint. |
| Durable writes | Settings `analytics_enabled`, installation `anonymous_analytics_id`, deletion of `analytics_events`. |
| Domain | No provider logic; validate only privacy command intent/identity shape if pure rule is needed. |
| Application | Own ordered opt-out/opt-in, analytics command barrier, Retry and safe projection. |
| Infrastructure | SQLite transaction-scoped update/queue clear/identity write; ID adapter supplies random value. |
| Presentation | Toggle, plain-language privacy copy, busy/error/retry state; never constructs ID/event. |
| Transaction boundary | Phase 1 commits disabled preference before cleanup. Cleanup is serialized and durable; capture remains disabled if cleanup fails. Opt-in commits only after valid identity/clean state. |
| Concurrency/idempotency | Same coordinator/barrier as enqueue; duplicate opt-out coalesces/no-ops; retry clears again safely and never restores old ID/events; stale opt-in cannot overtake newer opt-out. |

States: initial `loading`; enabled/disabled `ready`; `disabling`; `cleanup_required` with Retry while
capture remains off; `enabling`; finite error; stale revision drop. Empty queue is a valid ready fact,
not an Empty screen. Background/foreground/relaunch resume cleanup if needed; cold relaunch never
captures when durable flag is off. Offline works fully. Permission unavailable is N/A.

Analytics/privacy: the control itself must not enqueue an analytics event; no ID/queue payload shown
or logged; sanitized diagnostics only. Accessibility: switch label/state/hint, busy/disabled, error
announcement, dynamic type, focus returns to control after completion. Rollback removes UI/command but
must not re-enable opted-out devices or restore deleted events/old ID.

### 8.4. Acceptance criteria

- [ ] Durable off commits before any further event can enqueue.
- [ ] Opt-out clears all queued rows and rotates to a fresh non-empty anonymous ID.
- [ ] Old/new identity differ; neither is emitted to UI/log/analytics.
- [ ] Queue/ID cleanup failure leaves capture disabled and exposes truthful Retry/Recovery.
- [ ] Retry/duplicate/background races are idempotent; no old event or ID resurrects.
- [ ] Opt-in starts with empty queue/current rotated ID and does not backfill missed events.
- [ ] All existing recorders observe refreshed setting without app restart.
- [ ] Timer/session/reward/history/shop/reset truth is unchanged by privacy cleanup failure.

### 8.5. Automated-test checklist

- [ ] Application tests assert exact ordered calls, capture barrier, opt-out/opt-in duplicate/stale races.
- [ ] Persistence/real-SQLite tests seed every allowlisted event shape, clear/rotate/reopen and rollback.
- [ ] Integration tests race event enqueue vs opt-out; no row survives after completed opt-out.
- [ ] Composition tests wire shared coordinator/clock/ID/settings/installation/queue correctly.
- [ ] Presentation/a11y tests cover enabled/disabled/disabling/cleanup-error/Retry.
- [ ] Existing onboarding/focus/break/shop/history analytics recorder regressions pass.
- [ ] Static checks prove no provider SDK/network/dashboard and no sensitive diagnostics.

### 8.6. Manual UI/device guide — `analytics-privacy-control-smoke.md`

Planning-time exact implementation SHA: `NOT_AVAILABLE_PRE_IMPLEMENTATION`; không được thay bằng
baseline SHA. Guide chỉ điền giá trị này sau khi có implementation commit cần review.

- [ ] Setup at repo root with Node `22.23.2`; capture exact implementation SHA/build.
- [ ] Use `EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE=analytics_privacy_<case> pnpm start --clear` and a DB
  prefixed `pixeldoro-us-10-02-`; never touch `pixeldoro.db`.
- [ ] Happy path: seeded queue → toggle off → disabled status, zero queue, rotated identity evidence.
- [ ] Alternate: toggle on, exercise accepted flow, see only new events; no historical backfill.
- [ ] Error/Retry: cleanup/identity failure once leaves off; Retry finishes without resurrecting rows.
- [ ] Duplicate/rapid off-on-off and stale completion finish at last committed intent.
- [ ] Background/foreground during cleanup resumes truthfully; no false enabled state.
- [ ] Airplane mode proves no provider/network dependency.
- [ ] Cold relaunch while off stays off/empty; relaunch after opt-in does not backfill.
- [ ] Largest text, VoiceOver/TalkBack and Reduce Motion keep control/status/Retry usable and explicit.
- [ ] Cleanup unsets fixture and restarts normal app; delete only exact disposable DB through test reset.
- [ ] Record device/OS/network/settings/database/fixture/exact SHA/artifacts and per-case
  `PASS/FAIL/BLOCKED/NOT_RUN`; automated evidence never becomes manual PASS.

Fixture requirements: queue-populated, queue-empty, clear-failure-once, identity-write-failure-once,
enqueue-race, off-relaunch, opt-in-no-backfill; deterministic old/new IDs.

**DoR:** `[ ]` US-10-01 accepted; `[ ]` CONFIRM-03 approved; `[ ]` start SHA/fixture reviewed.

**DoD:** `[ ]` privacy invariants and all tests pass; `[ ]` honest guide/evidence; `[ ]` owner accepts
exact committed SHA; `[ ]` no provider delivery implemented; `[ ]` US-10-03 remains separately gated.

## 9. US-10-03 — Confirmed full local-data reset và safe return

### 9.1. Identity, outcome, priority và gates

- **User outcome:** người dùng đọc cảnh báo đầy đủ, xác nhận xóa toàn bộ dữ liệu local, app chỉ báo
  thành công sau atomic commit/rebootstrap và trở về First Use; failure giữ dữ liệu và cho Retry.
- **Priority/order:** P0 destructive-data risk, Story 3.
- **Dependencies:** US-10-01/02 accepted; existing `ConfirmedLocalDataReset`, SQLite reset adapter,
  bootstrap/readiness/recovery and notification cleanup.
- **Prerequisite gate:** `US1000-CONFIRM-04` approved; before fingerprint and exact start SHA captured.
- **Owner confirmation before coding:** `[x] APPROVED_OPTION_A_2026-09-12`.

### 9.2. Scope, rules và output

**In scope:** production Settings destructive action; two-step accessible confirmation; busy/back
lock; expose existing use case via a narrow facade/controller; clear all product/analytics/review rows;
reseed installation/settings/profile; preserve schema migrations/catalog; clear all projections; route
to onboarding only after verified rebootstrap; rollback/recovery and notification-cleanup warning.

**Out of scope:** partial reset, undo/restore/backup/export, uninstall, cloud/account deletion, deleting
schema/catalog, resetting OS permission, treating reset as automatic migration recovery.

**Authority:** Product Core §7.7/§14.2/§19; Data Model §7.8/§9/DM-EDGE-022; Timer safe recovery;
EPIC-02 US-02-08 and current production reset kernel. Existing dev-only reset is capability evidence,
not approval for production copy/placement.

**Concrete output:** common destructive confirmation variant, Settings reset section, reset controller/
facade/hook, complete projection invalidation/navigation, aggregate real-SQLite fixture and
`apps/mobile/test/device/settings-full-reset-smoke.md`.

### 9.3. Facts, ownership, transaction và states

| Concern | Contract |
|---|---|
| Durable reads | Before fingerprint, active session ID, schema/catalog/migration fingerprint. |
| Durable delete | analytics, owned, purchase/reward receipts, sessions, store-review attempts. |
| Durable reseed | fresh installation/anonymous ID, default settings, zero profile; onboarding incomplete. |
| Domain | No reset policy in screen; approved full-vs-partial invariant may be pure validation. |
| Application | Confirmation intent, reset lease/barrier/single-flight, warnings, rebootstrap, projection invalidation. |
| Infrastructure | Reuse SQLite adapter/transaction, notification cleanup and sanitized diagnostics. |
| Presentation | Warning/confirm/cancel/busy/error/Retry and post-success navigation only. |
| Transaction | Notification cleanup best-effort before `BEGIN IMMEDIATE`; all product deletes/reseeds/postconditions in one transaction; schema/catalog/migrations retained. Navigation after rebootstrap verification. |
| Concurrency/idempotency | One reset operation/lease; duplicate confirm shares operation; readiness blocks all core commands; retry after rollback is safe; uncertain rollback enters Recovery, never retries blindly. |

States: ready action; confirmation open; resetting/busy; success is transient only after committed
rebootstrap; finite pre-commit error with data retained/Retry; uncertain or post-commit-bootstrap failure
enters global Recovery. There is no empty/success state before verification. Stale screen completion after
unmount cannot navigate a newer route.

Navigation/lifecycle/offline: Settings is resting entry; active-session deep-link race is covered and
reset deletes it under barrier. Back dismisses confirmation only before confirm; busy modal cannot be
dismissed. Background/foreground keeps barrier; cold relaunch after committed reset enters onboarding,
after rollback keeps old facts, after uncertain commit goes Recovery. Airplane mode does not matter.
OS notification permission is unchanged; known schedule cleanup can warn/fail best-effort.

Analytics/privacy: reset clears queue and rotates identity according default enabled seed; reset action
does not emit analytics. No before/after raw data in production log. Accessibility: destructive wording
read in full, focus trapped/modal semantics, clear confirm/cancel labels, busy state, no color-only danger,
largest text scroll. Rollback strategy removes production Settings entry/wiring only; never attempts to
undo a committed reset, and preserves the proven kernel.

### 9.4. Acceptance criteria

- [ ] No reset occurs without explicit confirmation; cancel/back before confirm changes nothing.
- [ ] Confirmation names sessions/history/XP/Coin/items/preferences and irreversibility in warm copy.
- [ ] Core commands are blocked from lease acquisition until reset settles.
- [ ] Successful transaction clears exact approved rows, reseeds exact defaults/new identity, retains
  schema/migration/catalog fingerprints and verifies postconditions.
- [ ] App clears stale controllers/prototype projections and routes to onboarding only after rebootstrap.
- [ ] Transaction failure rolls back all data and never renders success.
- [ ] Rollback uncertainty/post-commit bootstrap failure enters Recovery with sanitized Retry policy.
- [ ] Duplicate confirm/background/relaunch cannot partially reset or navigate twice.
- [ ] OS permission remains OS-owned; notification cleanup failure never restores deleted data.

### 9.5. Automated-test checklist

- [ ] Existing reset application/SQLite unit and integration suites remain green.
- [ ] Controller tests cover confirm/cancel/single-flight/unmount/stale navigation/warning/errors.
- [ ] Real SQLite aggregate tests verify before/after fingerprint, rollback, reopen and exact retained set.
- [ ] Race tests cover reset vs Start/complete/reward/purchase/settings/analytics enqueue.
- [ ] Composition tests expose only narrow reset boundary and clear every projection.
- [ ] Presentation tests cover modal focus/Back/busy/error/Retry and destructive non-color semantics.
- [ ] Route/static checks prove production entry and absence of raw SQL/delete in screen.
- [ ] Existing `ConfirmationDialog`, Button, BootstrapBoundary and all consumer regressions pass.

### 9.6. Manual UI/device guide — `settings-full-reset-smoke.md`

Planning-time exact implementation SHA: `NOT_AVAILABLE_PRE_IMPLEMENTATION`; không được thay bằng
baseline SHA. Guide chỉ điền giá trị này sau khi có implementation commit cần review.

- [ ] Setup repo/Node `22.23.2`; capture exact SHA/build and a rich disposable fixture.
- [ ] Run `EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE=full_reset_<case> pnpm start --clear`; verify DB prefix
  `pixeldoro-us-10-03-`, never `pixeldoro.db`.
- [ ] Happy path: history/reward/shop/settings/events populated; cancel once (no change), confirm once,
  see onboarding only after reset; verify defaults/zero state/catalog intact.
- [ ] Alternate: active-session/scheduled-notification fixture; reset removes session and no stale route.
- [ ] Error/Retry: transaction failure once retains exact fingerprint; Retry commits once.
- [ ] Uncertain/post-commit bootstrap case enters Recovery and never shows false success.
- [ ] Rapid double confirm/Back cannot duplicate or dismiss busy operation.
- [ ] Background/foreground and app kill before/after commit match rollback/committed truth.
- [ ] Airplane mode repeats successful local reset.
- [ ] Cold relaunch after success starts First Use; old reward/history/item/event cannot reappear.
- [ ] Largest text, VoiceOver/TalkBack read warning/order/states; Reduce Motion preserves meaning.
- [ ] Cleanup unsets fixture; stop Metro; only exact disposable DB is removed through safe fixture flow.
- [ ] Record exact SHA, platform/device/OS/app version/network/permissions/text size/a11y/settings,
  fixture/database/artifact and per-case `PASS/FAIL/BLOCKED/NOT_RUN`.
- [ ] Do not infer manual PASS from reset probe, SQLite tests or exports.

Fixture requirements: rich-product-data, active-session, notification-cleanup-failure, transaction-
failure-once, rollback-uncertain, post-commit-bootstrap-failure, committed-relaunch; exact catalog/
migration fingerprints and deterministic new ID.

**DoR:** `[ ]` US-10-01/02 accepted; `[ ]` CONFIRM-04 approved; `[ ]` destructive copy/fixture/start SHA reviewed.

**DoD:** `[ ]` atomicity/recovery/navigation evidence pass; `[ ]` guide honest; `[ ]` owner accepts exact
committed SHA; `[ ]` no partial reset/account/cloud scope; `[ ]` US-10-04 remains separately gated.

## 10. US-10-04 — Notification preference và OS permission transparency

### 10.1. Identity, outcome, priority và gates

- **User outcome:** người dùng biết app muốn gửi notification hay OS đang allow/denied/restricted;
  họ có thể đổi preference mà Timer/Reward vẫn hoạt động và active schedule được sync best-effort.
- **Priority/order:** P1 platform reliability, Story 4.
- **Dependencies:** US-10-01 accepted; existing Focus/Break notification coordinators/adapters.
- **Prerequisite gate:** `US1000-CONFIRM-05` approved; permission matrix/start SHA recorded.
- **Owner confirmation before coding:** `[x] APPROVED_OPTION_A_2026-09-12`.

### 10.2. Scope, rules và output

**In scope:** durable notification toggle; current OS permission projection; clear education/status;
explicit contextual request only when appropriate; off cancels owned active schedule after commit;
on with allowed permission ensures exact active schedule; denied/restricted/unavailable copy and Retry/
open-system-settings behavior only if owner approves Option A.

**Out of scope:** push/server notification, token, remote permission state persistence, badge, custom
sound, marketing reminder, notification history/inbox, changing OS permission programmatically.

**Authority:** Product Core §11.1; Data Model §4.2/§6.6/§7.1; Timer notification idempotency;
EPIC-06/07 accepted notification behavior. Permission is platform truth, never inferred from preference.

**Concrete output:** notification settings use case/controller/permission port extension, Settings
status/education, active schedule sync, tests and `apps/mobile/test/device/notification-settings-smoke.md`.

### 10.3. Facts, ownership, transaction và states

| Concern | Contract |
|---|---|
| Durable facts | `notifications_enabled`, `updated_at`; active session remains session truth. |
| Platform facts | live `allowed|undetermined|denied|restricted/unavailable` projection; not persisted. |
| Domain | No OS rule; existing session eligibility unchanged. |
| Application | Persist preference, read/request permission, derive status, ensure/cancel after commit. |
| Infrastructure | Existing Expo gateway/adapter; optional system-settings launcher port if approved. |
| Presentation | Toggle/status/education/action; no Expo SDK import. |
| Transaction | Preference write atomic; OS read/request/schedule/cancel outside transaction. |
| Concurrency/idempotency | Revisioned toggle; stable session operation key; duplicate ensure/cancel safe; stale permission/schedule completion cannot flip newer preference. |

States: settings loading/ready; permission checking; request in flight; enabled+allowed;
enabled+undetermined; enabled+denied/restricted/unavailable; disabled regardless of OS state; finite
read/request/sync error with Retry. No Empty state. Off is durable success even if cancel fails; show
non-blocking warning and retry cleanup. Background/foreground re-read OS state; cold relaunch does not
prompt. Offline works; permission denied leaves Timer/session/reward intact. Analytics: no permission or
toggle event. Accessibility: switch/status/action semantics, no repeated modal/live announcement,
dynamic type. Rollback removes new Settings orchestration, leaves accepted notification behavior intact.

### 10.4. Acceptance criteria

- [ ] UI separately states app preference and live OS permission; never equates one with the other.
- [ ] Permission request occurs only after explicit approved context; never on launch/recovery/relaunch.
- [ ] Denied/restricted/unavailable never blocks Start/complete/reward/recovery or prompts repeatedly.
- [ ] Toggle off commits first and cancels exact owned active notification best-effort.
- [ ] Toggle on with allowed permission ensures one exact active notification; no duplicates.
- [ ] Toggle races/background/foreground honor newest committed preference and live OS state.
- [ ] Sound setting continues to govern notification sound independent of notification preference.
- [ ] OS permission is not added to schema/Zustand as durable truth.

### 10.5. Automated-test checklist

- [ ] Controller/application tests cover every permission/preference pair and request policy.
- [ ] Persistence tests cover toggle preservation/rollback/reopen.
- [ ] Adapter tests cover denied/provisional/restricted/unavailable, ensure/cancel idempotency and sound.
- [ ] Race tests cover off during ensure, on/off rapid taps, stale permission completion and active terminal.
- [ ] Composition tests reuse accepted adapter and exact active-session loader.
- [ ] Presentation/a11y tests cover all states/copy/actions/largest-text structure.
- [ ] Existing Focus/Break notification, response navigation and reset cleanup regressions pass.
- [ ] Route/static tests prove no SDK/persistence logic in screen and no native config drift unless approved.

### 10.6. Manual UI/device guide — `notification-settings-smoke.md`

Planning-time exact implementation SHA: `NOT_AVAILABLE_PRE_IMPLEMENTATION`; không được thay bằng
baseline SHA. Guide chỉ điền giá trị này sau khi có implementation commit cần review.

- [ ] Setup repo/Node `22.23.2`, exact SHA/build; native Development Build compatible with
  `expo-notifications` (rebuild only if actual native config changed).
- [ ] Use `EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE=notification_settings_<case> pnpm start --clear` and DB
  prefix `pixeldoro-us-10-04-`; never touch `pixeldoro.db`.
- [ ] Happy path allowed: toggle off/on, active Focus and Break each retain one exact schedule.
- [ ] Alternate undetermined: education + explicit request once; allow and verify status/schedule.
- [ ] Denied/restricted/unavailable: no loop/crash; timer/reward work; approved recovery action works.
- [ ] Error/Retry: permission-read/request/ensure/cancel failure stays truthful and non-blocking.
- [ ] Rapid toggles/stale operation do not create duplicate or wrongly enabled notification.
- [ ] Background/foreground after changing OS permission refreshes live status.
- [ ] Airplane mode proves local notification/settings do not require network.
- [ ] Cold relaunch never auto-prompts; committed preference persists and active schedule reconciles safely.
- [ ] Largest text, VoiceOver/TalkBack and Reduce Motion preserve status/control/action meaning.
- [ ] Cleanup resets test app OS permission as appropriate, unsets fixture, restarts normal app and removes
  only exact disposable DB through safe flow.
- [ ] Record SHA/device/OS/build/network/app preference/OS permission/sound/text/a11y/fixture/DB/artifact
  with `PASS/FAIL/BLOCKED/NOT_RUN`; exports/tests do not create manual PASS.

Fixture requirements: allowed, undetermined, denied, restricted-or-unavailable, read-failure-once,
request-failure-once, ensure/cancel-failure-once, active-focus, active-break, toggle-race.

**DoR:** `[ ]` US-10-01 accepted; `[ ]` CONFIRM-05 approved; `[ ]` platform matrix/start SHA ready.

**DoD:** `[ ]` preference/permission/session isolation pass; `[ ]` iOS/Android evidence status honest;
`[ ]` owner accepts exact committed SHA; `[ ]` no push/provider scope; `[ ]` US-10-05 separately gated.

## 11. US-10-05 — Sound/haptic quiet controls và EPIC-10 integrity

### 11.1. Identity, outcome, priority và gates

- **User outcome:** actual accepted user actions provide restrained sound/haptic feedback when enabled
  and remain completely quiet per channel when disabled, including after relaunch; meaning never depends
  on sensory feedback.
- **Priority/order:** P1 experience/integration, Story 5 and EPIC exit candidate.
- **Dependencies:** US-10-01→04 accepted; existing commit-first side-effect boundaries and Reduced Motion.
- **Prerequisite gate:** `US1000-CONFIRM-06` (feedback matrix/assets/dependencies) and
  `US1000-CONFIRM-07` (exit/evidence) approved; exact start SHA recorded.
- **Owner confirmation before coding:** `[x] APPROVED_OPTION_A_2026-09-12`.

### 11.2. Scope, rules và output

**In scope:** durable sound/haptic toggles; application-owned typed feedback intent; platform adapters;
approved minimal feedback points; read latest settings after commit; best-effort failure isolation;
audio lifecycle; no replay on hydration/relaunch; aggregate offline/prototype/route/regression evidence;
EPIC-10 exit candidate artifacts only after implementation.

**Out of scope:** music, volume/mixer, custom sound packs, background audio, notification custom sound,
audio used as status truth, reward changes, provider analytics/feedback/store review, formal beta release.

**Authority:** Product Core §2.6/§11.2/§11.3; System Architecture side-effect ordering; Pet/Session/
Gamification specs; accepted EPIC-05→09 fresh-vs-hydrated and commit-first boundaries. Exact sound asset
and feedback-event set are not locked and therefore remain owner confirmation, not inferred from code.

**Concrete output:** typed audio/haptic ports and adapters, approved bundled attributed SFX if selected,
Settings toggles, commit-first call sites, common regression suite, aggregate EPIC exit fixture/report
candidate and `apps/mobile/test/device/settings-sound-haptic-exit-smoke.md`.

### 11.3. Facts, ownership, transaction và states

| Concern | Contract |
|---|---|
| Durable facts | `sound_enabled`, `haptics_enabled`, `updated_at`; no playback receipt/state. |
| Domain | No platform/audio code; existing outcomes decide eligible feedback facts. |
| Application | Typed intent after committed user/outcome action; gate by current settings; best-effort/dedupe. |
| Infrastructure | Audio/haptic adapters, preload/unload/lifecycle and sanitized errors. |
| Presentation | Toggle intent and existing text/visual meaning; does not call SDK or construct event identity. |
| Transaction | Setting write atomic. Playback/haptic always after product commit and outside transactions. |
| Concurrency/idempotency | Duplicate fresh terminal callbacks play at most once per runtime fresh ID; hydrated/reopened results never replay; disabling wins over queued not-yet-started feedback. |

States: shared Settings loading/ready/saving/error/Retry; adapter unavailable does not change committed
toggle and yields non-blocking accessible notice only when useful. No Empty state. Background stops/
releases in-app audio as platform requires; foreground does not replay. Cold relaunch restores toggles but
does not replay old result. Offline works. Silent/device haptic unavailable is an allowed platform
outcome; no error loop. Notification sound remains owned by existing notification adapter. Analytics:
no new sound/haptic event. Accessibility: every meaning remains in text/role/state; toggles describe
channel, screen reader does not depend on sound/haptic; Reduce Motion is independent.

Rollback: default-disable/remove new call sites/adapters/assets without schema rollback; retain persisted
booleans and Settings UI; production can safely return to no in-app audio/haptic.

### 11.4. Acceptance criteria

- [ ] Sound/haptic toggles commit atomically, preserve unrelated fields and persist across relaunch.
- [ ] Enabled channels fire only at owner-approved moments and only after durable success where relevant.
- [ ] Disabled sound produces no in-app SFX and suppresses notification sound through existing policy.
- [ ] Disabled haptic produces no application-owned haptic request.
- [ ] Adapter failure/unavailable/silent mode never rolls back or blocks core command/navigation.
- [ ] Reopen/relaunch/recovery does not replay terminal reward/Pet/audio/haptic feedback.
- [ ] Rapid toggle/action/stale callbacks obey latest committed preference without feedback storm.
- [ ] All state/outcome remains understandable with sound/haptic/motion/color unavailable.
- [ ] Dependency/native/asset license/config changes exactly match approved register; no unreviewed drift.
- [ ] Production Settings replacement accepted before prototype Settings ownership is retired/deleted.

### 11.5. Automated-test checklist

- [ ] Settings controller/persistence tests cover both toggles, retries, stale/rapid order and reopen.
- [ ] Application intent tests cover approved matrix, commit-first, disabled skip and fresh-only dedupe.
- [ ] Adapter tests cover preload/play/failure/unavailable/background/dispose and no sensitive logs.
- [ ] Composition tests inject fake ports and verify no direct SDK import in screen/domain.
- [ ] Presentation/a11y tests cover toggles/notices and no sensory-only meaning.
- [ ] Existing notification sound, Pet, onboarding, Focus, Break, shop, history and reset regressions pass.
- [ ] Real SQLite aggregate proves settings/relaunch/reset defaults and no product-data mutation.
- [ ] iOS/Android export/quality/static/component-size/prototype-route boundaries pass.

### 11.6. Manual UI/device guide — `settings-sound-haptic-exit-smoke.md`

Planning-time exact implementation SHA: `NOT_AVAILABLE_PRE_IMPLEMENTATION`; không được thay bằng
baseline SHA. Guide chỉ điền giá trị này sau khi có implementation commit cần review.

- [ ] Setup repo/Node `22.23.2`, exact SHA/build; install compatible Development Build if approved
  dependency/native config requires it.
- [ ] Run each `EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE=sensory_<case> pnpm start --clear` with DB prefix
  `pixeldoro-us-10-05-`; never use `pixeldoro.db`.
- [ ] Happy path enabled: execute every approved feedback point once; record expected sound/haptic.
- [ ] Alternate: sound off/haptic on, sound on/haptic off, both off; no cross-channel leakage.
- [ ] Error/unavailable: injected adapter failures do not block session/reward/navigation/Settings.
- [ ] Retry setting write does not replay product action or sensory feedback.
- [ ] Background/foreground during/after sound and haptic; no replay/stuck audio.
- [ ] Airplane mode repeats matrix without network dependency.
- [ ] Cold relaunch restores choices and does not replay prior result/reward feedback.
- [ ] Largest text and VoiceOver/TalkBack convey all meaning with device muted/haptics unavailable.
- [ ] Reduce Motion combinations remain understandable and do not alter sound/haptic preference.
- [ ] Aggregate Settings: focus defaults, analytics opt-out, reset and notification cases regress.
- [ ] Cleanup unset fixture, stop Metro, restart normal app; remove only exact disposable DB safely.
- [ ] Record exact SHA/device/OS/build/network/silent-mode/volume/haptic availability/permission/text/a11y/
  fixture/DB/artifacts and each `PASS/FAIL/BLOCKED/NOT_RUN`.
- [ ] Do not infer device audio/haptic PASS from mocks, automated tests or JS exports.

Fixture requirements: each approved feedback point, four toggle combinations, audio-failure-once,
haptic-failure-once, unavailable platform, background-playback, hydrated-result, rapid-toggle/action,
aggregate-exit. Bundled SFX must have attribution/license evidence.

**DoR:** `[ ]` US-10-01→04 accepted; `[ ]` CONFIRM-06/07 approved; `[ ]` dependency/assets/native
impact and start SHA explicitly recorded.

**DoD:** `[ ]` all acceptance/automated/static/export checks pass; `[ ]` device guide honest;
`[ ]` implementation/report/exit candidate bound to exact SHA; `[ ]` owner accepts Story, then separately
authorizes EPIC-10 closure; `[ ]` no EPIC-11/12 work starts implicitly.

## 12. Data ownership và transaction matrix

| Operation | Durable read/write | Atomic boundary | Serialized with | Post-commit side effects | Failure/result |
|---|---|---|---|---|---|
| Load Settings | Read singleton | Read snapshot | Controller revision | None | Missing/corrupt → Recovery |
| Change Focus default | Read/patch Settings | One Settings transaction | Settings command | Refresh Bootstrap/Setup seed | Rollback; committed value stays |
| Toggle analytics off | Settings off, queue clear, install ID rotate | Ordered privacy phases; capture barrier spans them | Settings + analytics enqueue | Projection refresh only | Off remains; cleanup Retry/Recovery |
| Toggle analytics on | Validate clean queue/ID, Settings on | Enable only after prerequisites | Settings + analytics enqueue | Future capture only | No backfill |
| Full reset | All approved product rows; reseed singletons | One `BEGIN IMMEDIATE` + postconditions | Global reset/readiness barrier | Notification cleanup before; rebootstrap/nav after | Rollback or Recovery; no false success |
| Toggle notification | Patch Settings | One Settings transaction | Settings command | OS read/request/ensure/cancel | Core truth unaffected |
| Toggle sound/haptic | Patch Settings | One Settings transaction | Settings command | Future feedback only | No replay |
| Play sound/haptic | Read current projection | No DB transaction | Fresh-event/runtime dedupe | Platform adapter | Best-effort/no core rollback |

No new durable fact, table, column, migration or second truth is proposed.

## 13. UI state matrix

| Surface | Loading | Ready/empty | Error/Retry | Stale/race | Lifecycle/offline |
|---|---|---|---|---|---|
| Settings root | Verified singleton read | Controls from commit; Empty N/A | Friendly Retry; corrupt → Recovery | Revision drops late read/write | Refresh on focus; offline |
| Per-setting control | Disabled/busy | Exact value/status | Keep committed value; Retry intent | Last serialized intent wins | Relaunch rehydrates |
| Analytics privacy | Disabling/enabling | Enabled or disabled; queue empty valid | Cleanup-required while capture off | enqueue barrier; no old event return | Resume cleanup; no backfill |
| Reset confirmation | Modal open/resetting | Success only after rebootstrap | Pre-commit Retry or global Recovery | Duplicate confirm single-flight | Busy Back blocked; relaunch truth-based |
| Notification | Permission checking | Preference + OS status | Retry read/request/sync | late OS result cannot flip pref | foreground re-read; no launch prompt |
| Sound/haptic | Saving | Exact toggles | Non-blocking adapter notice | queued feedback checks newest setting | no old replay after foreground/relaunch |

## 14. Common Component Reuse Matrix

| UI need | Existing component | Decision / location | Consumers current → planned | Props/variants | Accessibility contract | Regression required / promotion reason |
|---|---|---|---|---|---|---|
| Screen shell | `ScreenShell` | Reuse common | All feature screens → Settings | existing scrollable | Safe area, scroll, keyboard taps | All shell consumers; no new wrapper |
| Header | `ScreenHeader` | Reuse common | Focus/History/etc. → Settings | existing optional description | Header role, dynamic wrap | Existing snapshots/component tests |
| Card/panel | `Panel` | Reuse; replace hard-coded gold/danger with palette tokens if touched | Broad → Settings sections | existing tones | Group meaning not color-only | All tone consumers; token contrast |
| Primary/secondary button | `Button` | Backward-compatible extend common with `danger` only if confirmation needs it | Broad → retry/reset | tone, busy, disabled, label | button/disabled/busy/label, min target | Every consumer + destructive variant contrast |
| Toggle/list row | Raw RN `Switch` only in prototype | Create common `ToggleRow`; no Settings-local copy | Settings now; future privacy/accessibility controls | label, body, value, disabled/busy, onChange, optional status | switch role/state/label/hint, focus order, target | Component tests; promote because semantics repeat 4+ times |
| Action list row | None | Create common `ActionRow` if feedback/reset/system settings share semantics | Settings → EPIC-11 feedback/store | title/body/action/tone/disabled | button role, clear label, no nested target | Tests; promote due multiple cross-Epic consumers |
| Duration selector | `DurationControl` | Reuse unchanged or backward-compatible disabled/busy semantics | Focus Setup → Settings | min/max/step/quick values | label/value/buttons/radiogroup | Existing Focus Setup regression |
| Mode chips | `ChoiceChip` | Reuse | Focus Setup → Settings | selected/disabled | radio + selected; visible checkmark | Existing consumers |
| Confirmation modal | `ConfirmationDialog` | Extend common for destructive copy, scroll/focus/busy and safer default busy label | Focus/Break → Reset | tone, labels, busy, optional scroll | modal/focus/back/busy; no color-only danger | Focus/Break cancel regressions mandatory |
| Loading/empty/error | `LoadingState`, `ErrorState`, `EmptyState` | Reuse/extend retry label only; Settings Empty N/A | Broad → Settings | label/title/body/action | alert/live region/action | All current consumers |
| Inline notice | `InlineNotice` | Backward-compatible tone/status extension if required | Focus/Shop → Settings | announce/tone | controlled live region, text meaning | Existing consumers and contrast |
| Permission badge/tag | `HistoryStatusBadge` is feature-specific | Do not reuse/promote; use text `InlineNotice`/ToggleRow status | History only → none | N/A | Avoid badge/color-only permission truth | Reason: History terminal semantics do not generalize |
| Input/form field | None production common | Do not create in EPIC-10 | EPIC-11 feedback owns future need | N/A | N/A | No EPIC-10 text input |
| Avatar/Pet display | Pet components exist | No Settings use | Home/Focus/Result only | N/A | Existing Pet semantics | No unrelated dependency |
| Chip/badge/tag | `ChoiceChip` | Reuse only for mode; do not invent settings badge | Focus Setup → Settings | existing | radio semantics | Existing regressions |

Any common component edit must remain backward-compatible or explicitly migrate all consumers in the
same Story; a Settings-specific business rule never enters common visual primitives.

## 15. Fixture và database-isolation matrix

| Story | Prefix | Required facts | Failure/race decorators | Forbidden |
|---|---|---|---|---|
| US-10-01 | `pixeldoro-us-10-01-` | default/custom Settings | read/write once, stale load/save | normal DB, prototype setting |
| US-10-02 | `pixeldoro-us-10-02-` | queue + old/new ID + opt state | clear/ID fail, enqueue race | provider/network, raw IDs in log |
| US-10-03 | `pixeldoro-us-10-03-` | rich product graph + fingerprints | tx/rollback/bootstrap/cleanup fail | raw delete, partial reset |
| US-10-04 | `pixeldoro-us-10-04-` | active Focus/Break + preference | permission/ensure/cancel fail, toggle race | changing OS permission as DB fact |
| US-10-05 | `pixeldoro-us-10-05-` | all toggle combinations + fresh/hydrated results | adapter fail/unavailable/background | unlicensed asset, normal DB |

- [ ] Fixture selection is dev-only, finite and disabled by default.
- [ ] Every fixture owns a dedicated DB; each case records exact DB name.
- [ ] Cleanup can target only validated exact prefix, never glob/normal `pixeldoro.db`.
- [ ] Production path creates/reads facts; decorators inject only stated clock/failure/platform fact.

## 16. Automated test matrix

| Layer | US-10-01 | US-10-02 | US-10-03 | US-10-04 | US-10-05 |
|---|---:|---:|---:|---:|---:|
| Domain unit | duration/mode | identity invariant if needed | full-only invariant | N/A | eligible feedback mapping |
| Application/controller | load/save/stale | privacy order/barrier | lease/reset/rebootstrap | permission matrix | toggle/fresh dedupe |
| Persistence/integration | settings patch/reopen | clear/rotate/reopen | full graph atomicity | pref/reopen | pref/reopen |
| Composition | Setup defaults | shared queue coordinator | facade/projection clear | notification adapter | audio/haptic ports |
| Presentation/component | all states/a11y | privacy states | modal/recovery | permission states | toggle/notice |
| Route/static boundary | no prototype/SQL | no provider | no raw delete | no SDK in screen | no SDK in screen/domain |
| Real SQLite | required | required | required aggregate | required pref/session | required aggregate |
| Offline/relaunch | required | required | required | required | required |
| Permission/failure | N/A | cleanup failure | cleanup warning | full matrix | unavailable adapter |
| Race/retry/duplicate/stale | required | required | required | required | required |
| Existing-consumer regression | Focus Setup/common | all recorders | reset/bootstrap/common | Focus/Break notifications | all accepted flows/common |

## 17. Manual device evidence matrix

| Story/guide | iOS | Android | Offline | BG/FG | Cold relaunch | Largest text | VO/TalkBack | Reduce Motion | Current status |
|---|---|---|---|---|---|---|---|---|---|
| US-10-01 `settings-focus-defaults-smoke.md` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | `NOT_RUN` |
| US-10-02 `analytics-privacy-control-smoke.md` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | `NOT_RUN` |
| US-10-03 `settings-full-reset-smoke.md` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | `NOT_RUN` |
| US-10-04 `notification-settings-smoke.md` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | `NOT_RUN` |
| US-10-05 `settings-sound-haptic-exit-smoke.md` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | `NOT_RUN` |

Mỗi evidence row bắt buộc có exact implementation SHA, date/time/timezone, platform/device/simulator,
OS/app/build, network, OS permissions/settings, sound/haptic/silent mode, text size, screen reader,
Reduce Motion, fixture/database, result và artifact/notes. `PASS` chỉ sau execution thực tế.

## 18. Shared Definition of Ready và Definition of Done

### 18.1. Shared Definition of Ready

- [ ] Story outcome, in/out scope, authority and dependencies are owner accepted.
- [ ] Every confirmation blocking the Story is `APPROVED_OPTION_*`, not merely recommended.
- [ ] Prior Story is `DONE_OWNER_ACCEPTED` at an exact committed SHA.
- [ ] Branch/HEAD/upstream/worktree are re-audited; owner changes classified/preserved.
- [ ] Exact implementation-start SHA is recorded before code changes.
- [ ] Durable facts, transaction/concurrency/idempotency and error/retry/stale contracts are reviewed.
- [ ] Planned component reuse and any backward-compatible extension list all current consumers.
- [ ] Fixture names, dedicated DB prefix, failure decorators and safe cleanup are agreed.
- [ ] Dependency/native/permission/schema impact is explicit; no implicit install/config change.
- [ ] Standalone device guide is created initially with every case `NOT_RUN`.

### 18.2. Shared Definition of Done

- [ ] User-visible output and every acceptance criterion are implemented within approved scope.
- [ ] Domain/Application/Infrastructure/Presentation ownership and screen responsibility pass review.
- [ ] No visual component exceeds 300 lines; >=240-line components have recorded split review.
- [ ] Domain, controller, persistence, composition, presentation, route/static and accessibility tests pass.
- [ ] Real SQLite, offline/relaunch, failure/retry/race/duplicate/stale cases pass where applicable.
- [ ] Every changed common component has regression evidence for every current consumer.
- [ ] No unauthorized schema/dependency/native/config/permission/provider/prototype drift.
- [ ] Root quality and required iOS/Android export/native gates pass on the frozen candidate.
- [ ] Implementation report and manual guide bind evidence to exact implementation SHA.
- [ ] Manual cases are only marked PASS when executed; `NOT_RUN/BLOCKED` remain explicit.
- [ ] Owner quick smoke and exact committed-SHA acceptance are recorded before next Story coding opens.
- [ ] No commit/push is performed without separate owner authorization in the implementation task.

## 19. EPIC-10 Exit Checklist

Planning/audit evidence completed in this task:

- [x] Exact Git baseline and upstream recorded; five pre-existing owner document edits preserved.
- [x] EPIC-09 `DONE_OWNER_ACCEPTED` closure evidence distinguished from baseline commit identity.
- [x] Product/architecture/spec/planning/manual-guide corpus and relevant code inventory audited.
- [x] Prototype, production/reusable, missing, deprecated and deferred capabilities separated.
- [x] Five vertical Stories, reuse/data/UI/fixture/test/manual matrices and owner register drafted.

Closure review evidence:

- [ ] US-10-01→05 each satisfy DoR/DoD and are owner accepted at exact committed SHAs.
- [x] Production Settings has no prototype authority, reviewer shortcut or fake local state.
- [x] Saved duration/mode drive fresh Focus Setup without modifying active session or work-tag policy.
- [x] Sound and haptic can each be fully disabled and remain so after relaunch.
- [x] Notification preference remains distinct from live OS permission; denial never breaks core flow.
- [x] Analytics opt-out stops capture, clears queue, rotates identity and never backfills.
- [x] Full reset is confirmed, barriered and atomic; defaults/schema/catalog/relaunch truth pass.
- [x] Error/retry/stale/background/offline behaviors pass at the appropriate automated layers; formal
  device/accessibility breadth remains explicitly deferred.
- [x] Common component consumer regressions and component-size gates pass.
- [x] Isolated fixture databases prove no access/mutation/deletion of normal `pixeldoro.db`.
- [x] No provider feedback/analytics/store review (EPIC-11) or beta release scope (EPIC-12) is absorbed.
- [ ] EPIC-10 exit candidate and exact evidence SHA are reviewed.
- [x] Owner requested EPIC-10 closure after review; EPIC-11 planning does not start before exact SHA.

## 20. Risks và rollback

| Risk | Impact | Prevention/evidence | Rollback |
|---|---|---|---|
| Full-row replace loses another toggle | Privacy/preference regression | transaction patch/serialization/stale tests | Revert command/repository extension; retain valid row |
| Event enqueue races opt-out | Privacy breach | shared capture barrier + real SQLite race | Force durable off; disable capture adapter; retry clear |
| Reset reports success before commit/rebootstrap | Irrecoverable false assurance | verified postconditions + navigation-after-ready | Enter Recovery; never claim/undo committed reset |
| Reset races core command | Partial/new data after wipe | global readiness lease and aggregate races | Disable production reset entry; retain kernel |
| Preference confused with OS permission | Repeated prompts/missed notifications | two-fact projection/copy and full permission matrix | Revert Settings permission actions; existing session flow stays |
| Enabling notification duplicates active schedule | Duplicate alerts | stable operation key/ensure idempotency | Cancel owned key and revert new sync wiring |
| Audio/haptic dependency or lifecycle instability | Crash/battery/native drift | official adapter boundary, failure/device tests, short asset | Disable call sites/remove adapter/assets in later approved commit |
| Sensory feedback replays on hydration | Annoyance/accessibility issue | fresh-event runtime dedupe, relaunch tests | Disable terminal sensory hooks |
| Common component extension regresses screens | Cross-Epic UI break | backward-compatible API + all-consumer regression | Revert extension; feature-local orchestration with common primitives |
| Settings component becomes god component | Untestable/risky changes | <=300/240 review, separate section components/controller | Split by responsibility without changing contracts |
| Prototype is deleted too early | Loss of accepted UX evidence/fallback | retire only after owner accepts production replacement | Restore prototype route/file from version control |
| Dirty owner docs accidentally overwritten | Evidence loss | status/diff checks before/after; edit only this file | Stop and restore only task-owned addition with owner direction |

Rollback never rewrites schema `001`, restores deleted analytics events/old IDs, invents an undo for a
committed reset, or uses destructive Git commands. Data-affecting rollback is forward-safe and owner-gated.

## 21. Deferred checklist

- [ ] EPIC-11: PostHog Cloud EU provider/delivery, retention/cost alerts and operational dashboard.
- [ ] EPIC-11: feedback form/network Retry, store review eligibility/attempt and no-review-gating.
- [ ] EPIC-12: formal cross-device/accessibility/beta-readiness matrix and store delivery sign-off.
- [ ] Account/server deletion, cloud backup/sync and remote notification.
- [ ] Partial reset, export/import, undo/restore and selective history/economy deletion.
- [ ] Advanced audio volume/mixer/music/custom packs and background audio.
- [ ] Configurable Break durations, default work tag and remember-last-Setup.
- [ ] Pet naming (`OPEN-009`), multiple Pet/evolution/happiness/energy.
- [ ] Native app blocking, widgets, Live Activities/Dynamic Island, desktop.

Unchecked means deferred/not done, not an implicit future requirement.

## 22. Owner Confirmation Register

No issue already resolved by Product Core, ADR, specification or prior Epic is asked again. Approval
can be sent in one line: `Duyệt US1000-CONFIRM-01→07 theo Option A`.

### US1000-CONFIRM-01 — Story breakdown và execution order

- **Decision:** approve five vertical slices/order in §5.
- **Option A — Recommended:** `defaults → analytics privacy → full reset → notification → sound/haptic + exit`.
  Foundation first, then highest data/privacy risk; each rollback remains independent.
- **Option B:** merge analytics/reset/notification/sensory into one Settings Story. Fewer gates but much
  larger blast radius and weak independent acceptance/rollback.
- **Option C:** split final exit-only Story. More gate overhead and risks creating a testing-only Story.
- **Blocked:** all US-10-01→05 coding.
- **Status:** `APPROVED_OPTION_A_2026-09-12`.

### US1000-CONFIRM-02 — Save interaction và Focus-default consumption

- **Decision:** how Settings commits ordinary duration/mode/sound/haptic preferences.
- **Option A — Recommended:** immediate atomic commit per changed control, busy only affected row; on
  error restore/retain committed value with inline Retry. New Focus Setup reads saved duration/mode;
  current draft/running session is unchanged.
- **Option B:** explicit bottom `Lưu thay đổi` commits all fields. Clear transaction moment but creates
  unsaved draft/back-discard semantics and larger stale overwrite surface.
- **Option C:** commit on leaving screen. Least visible, hardest to explain/retry, and unsafe on kill.
- **Blocked:** US-10-01 and all later toggle Stories.
- **Status:** `APPROVED_OPTION_A_2026-09-12`.

### US1000-CONFIRM-03 — Analytics cleanup failure UX

- **Decision:** state shown after durable opt-out succeeds but queue/ID cleanup has not yet completed.
- **Option A — Recommended:** show analytics Off immediately, block capture, display `Đang hoàn tất quyền
  riêng tư`/Retry, serialize cleanup until queue empty + ID rotated; never roll preference back On.
- **Option B:** global Recovery until cleanup completes. Strong barrier but blocks unrelated offline core
  flow for a side-effect privacy cleanup.
- **Option C:** silently retry later. Lower friction but weak user assurance and less observable failure.
- **Blocked:** US-10-02.
- **Status:** `APPROVED_OPTION_A_2026-09-12`.

### US1000-CONFIRM-04 — Reset placement và active-session edge

- **Decision:** production destructive CTA/copy and behavior if an active session exists via stale/deep link.
- **Option A — Recommended:** `Xóa toàn bộ dữ liệu local` in a final danger section; one modal names
  history, XP/Coin, items and preferences, states irreversible; confirmed reset barrier may delete an
  active session and cancel its owned notification best-effort before atomic reset.
- **Option B:** block reset while any session runs and route user to session. Less surprising session loss
  but adds a special recovery path and can prevent last-resort reset of a corrupt active session.
- **Option C:** require typed confirmation text. Strong friction but adds an input component and is heavy
  for local no-account MVP.
- **Blocked:** US-10-03.
- **Status:** `APPROVED_OPTION_A_2026-09-12`.

### US1000-CONFIRM-05 — Enabling notification when OS permission is not allowed

- **Decision:** Settings behavior after explicit toggle On for `undetermined` or denied/restricted OS state.
- **Option A — Recommended:** toggle On commits app preference; Settings gives context then requests only
  when `undetermined`. If denied/restricted, keep preference On, show OS-blocked status and an `Mở Cài đặt
  hệ thống` action where available; never repeat prompt automatically.
- **Option B:** commit preference On but defer permission request to next explicit Start. Reuses accepted
  context but Settings may look enabled without immediate resolution.
- **Option C:** revert preference Off when OS denies. Simpler appearance but incorrectly couples app
  preference to OS truth and loses user intent.
- **Blocked:** US-10-04.
- **Status:** `APPROVED_OPTION_A_2026-09-12`.

### US1000-CONFIRM-06 — Minimal in-app sound/haptic feedback set

- **Decision:** exact MVP events and native dependency/asset scope, currently not locked by authority.
- **Option A — Recommended:** use Expo-compatible audio/haptic adapters; one short attributed 8-bit SFX
  for fresh Focus/Break completion and reward/unlock; restrained haptic for committed Start, fresh
  completion/reward/unlock and destructive confirmation. No generic button sound, music or replay.
- **Option B:** haptic only plus existing notification default sound; smallest native/asset scope but does
  not deliver meaningful in-app audio to validate the sound toggle.
- **Option C:** sound/haptic on every button plus all listed moments. Richer retro feel but noisy, higher
  test/asset/accessibility cost and contrary to restraint.
- **Blocked:** US-10-05; any dependency/native config/audio asset addition.
- **Status:** `APPROVED_OPTION_A_2026-09-12`.

### US1000-CONFIRM-07 — Story/Epic owner evidence gate

- **Decision:** minimum owner smoke needed for native settings exit candidate.
- **Option A — Recommended:** owner quick smoke on both iOS and Android at exact committed candidate for
  Settings persistence, permission denial, reset and sound/haptic; structured unexecuted rows remain
  `NOT_RUN`, formal breadth stays EPIC-12; separate explicit Epic closure afterward.
- **Option B:** one platform owner smoke, second deferred. Faster but weaker for platform permission and
  haptic/audio behavior.
- **Option C:** require full formal device/accessibility matrix now. Strongest evidence but absorbs
  EPIC-12 scope and delays feature closure.
- **Blocked:** US-10-05 exit gate and EPIC-10 closure.
- **Status:** `APPROVED_OPTION_A_2026-09-12`.

## 23. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.3.0 | 2026-09-12 | Codex | Recorded owner quick UI PASS/no crash and closure request. Closure review found and fixed notification-Off permission and reset single-flight edges; final quality reached 212/1,080 and both platform exports passed. Kept exact-SHA and formal deferred evidence honest. |
| 0.2.0 | 2026-09-12 | Codex | Owner approved `US1000-CONFIRM-01→07` Option A. Implemented all five slices in the worktree with production Settings UI/controller, column-safe persistence, Focus defaults, privacy cleanup gate, permission reconciliation, confirmed reset, sound/haptic adapters, tests and quick UI guide. Manual evidence remains `NOT_RUN`; implementation SHA remains unavailable until commit. |
| 0.1.0 | 2026-09-12 | Codex | Audited exact Git baseline, pre-existing EPIC-09 closure edits, full documentation/manual-guide corpus and current code/component capability. Drafted five dependency/risk-ordered vertical Stories with scope, ownership, transactions, UI/lifecycle/privacy/a11y states, tests, isolated fixtures, manual guides, reuse matrices, honest exit/deferred checklists and seven pending owner confirmations. No implementation, commit or push. |
