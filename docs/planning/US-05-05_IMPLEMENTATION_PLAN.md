---
document_id: PIXELDORO_US_05_05_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-05-05 Implementation Plan
version: 0.3.0
status: IMPLEMENTED_AWAITING_OWNER_ACCEPTANCE
implementation_status: IMPLEMENTED_AWAITING_OWNER_ACCEPTANCE
created_at: 2026-08-31
last_updated: 2026-09-01
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-05
baseline_sha: fc7521ff96a04913dda3b49223fcf6dccb3cc21b
accepted_dependency_sha: f1302b8c0ae8035f67b56aa410b197890498ddc9
implementation_start_sha: 2080d15d5ddcce5033610490076e5ff0ae4b7019
implementation_started_at: 2026-09-01
implementation_sha: 580f559016e192b95d3d286a61d161b3af460a1d
automated_quality_status: PASS_82_FILES_391_TESTS
formal_tester_status: DEFERRED_TO_LATER_PHASE
scope:
  - mobile_mvp
  - epic_05
  - us_05_05
  - onboarding_analytics_milestones
  - trial_exclusion_integrity
  - end_to_end_exit_evidence
authority: PLANNING
story_baseline: ./EPIC-05_USER_STORIES.md
previous_story_plan: ./US-05-04_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-05-04_IMPLEMENTATION_REPORT.md
epic_breakdown: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
system_architecture: ../architecture/system-architecture.md
project_structure: ../architecture/project-structure.md
data_model: ../architecture/data-model.md
gamification_rules: ../specifications/gamification-rules.md
analytics_adr: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# US-05-05 — First-use Integrity, Exclusions, and Exit Evidence

## 0. Mục đích và trạng thái

Tài liệu này khóa implementation plan cho Story cuối của `EPIC-05 — First-use Onboarding Trial`.
Lượt tạo plan chỉ sửa planning/acceptance record, không sửa production code, schema/migration,
dependency, native artifact hoặc analytics provider.

**Story outcome:** full first-use journey được chứng minh end-to-end bằng production commands và
durable facts; onboarding trial không làm ô nhiễm Standard Focus history/contribution/cadence/store
review/core analytics. Hai onboarding milestones được ghi local best-effort, idempotent sau exact
durable commits. Offline/error/a11y/reduced-motion/boundary/scope evidence đủ để owner review EPIC-05
exit mà không mở provider/PostHog hay EPIC-06 behavior.

**Priority:** `MUST` / `P1` / execution order `05` trong EPIC-05.

**Entry baseline:** US-05-04 được owner đóng `DONE_OWNER_ACCEPTED` trên exact implementation SHA
`f1302b8c0ae8035f67b56aa410b197890498ddc9` sau quick UI smoke. Formal tester/device evidence vẫn
`DEFERRED_TO_LATER_PHASE`.

**Planning status:** `APPROVED`.
**Implementation status:** `IMPLEMENTED_AWAITING_OWNER_ACCEPTANCE` tại exact SHA
`580f559016e192b95d3d286a61d161b3af460a1d`. Owner đã duyệt toàn bộ
`US0505-CONFIRM-01`…`08` ngày 2026-09-01; implementation mở tại `2080d15`.

### 0.1. Readiness gate

- [x] Branch `feats/epic-05` sạch và khớp origin tại `fc7521f` khi audit.
- [x] US-05-01…04 đều có accepted exact implementation SHA; US-05-04 quick-smoke limitation ghi rõ.
- [x] DEC-05-02 khóa `onboarding_started` sau Start commit và `onboarding_completed` sau explicit
  Continue commit.
- [x] Existing bounded analytics queue có dedupe PK, max 1.000, TTL 7 ngày, property allowlist và
  không provider dependency.
- [x] Standard history/contribution/Long Break/store-review queries đã lọc durable
  `focus_variant='standard'`.
- [x] Existing SQLite schema đủ; không cần migration/index/dependency/native change.
- [x] Final root US-05-04 baseline `80` files / `374` tests pass.
- [x] Formal tester execution tiếp tục deferred; automated/SQLite/static gates là bắt buộc.
- [x] Owner duyệt toàn bộ confirmations; Story chuyển `IN_PROGRESS` tại exact SHA `2080d15`.

### 0.2. Implementation update — 2026-09-01

- Deterministic local milestones đã nối sau committed Start/Continue với exact `{}` properties,
  opt-out skip và best-effort isolation.
- Một real SQLite production journey chứng minh exact reward/install/event fingerprints, duplicate,
  reopen và bốn Standard exclusions.
- Hai finite fixture `epic_05_fresh_end_to_end` / `epic_05_exclusion_seed`, prototype fallback split
  và executable import/line/common/fixture gates đã có.
- Offline/failure/a11y/Reduced Motion regressions và deferred device guide đã được validate.
- Final root quality pass `82` files / `391` tests; boundary, device harness, hygiene, typecheck, lint
  và `git diff --check` pass.
- Không schema/migration/dependency/native/provider/EPIC-06 behavior change. Formal tester vẫn
  `DEFERRED_TO_LATER_PHASE`; owner acceptance của exact SHA còn pending.

## 1. Baseline audit và gap map

### 1.1. Foundation có thể reuse

| Capability | Baseline | Cách dùng trong US-05-05 |
| --- | --- | --- |
| Start milestone | `StartOnboardingTrialUseCase` trả committed session, including stable ID/startedAt | Record only after success; deterministic event ID from session ID. |
| Completion milestone | Handoff trả stable `completedAt` after installation commit/verify | Record only after successful explicit Continue; deterministic ID from completed timestamp. |
| Analytics queue | `BoundedAnalyticsQueue` cap/TTL/drop-oldest/dedupe/retry/privacy validation | Enqueue local event only; no SDK/delivery/provider. |
| Capture preference | Ready Bootstrap snapshot has `settings.analyticsEnabled` | Skip immediately when false; never retroactively backfill opt-out milestones. |
| Trial discriminator | Session persists `focusVariant='onboarding_trial'` | Pure classifier prevents standard Focus/reward event names. |
| Exclusion queries | Four query implementations filter `focus_variant='standard'` | Prove together using a trial created by production commands, not raw-only fixture. |
| Journey | Intro→Running→Result→Home implemented and accepted | Compose final fresh/relaunch/failure evidence; no new product UI. |
| Pet/reward/handoff | Exact-once reward, fresh-only feedback, idempotent Continue accepted | Cross-source duplicate/relaunch proof; do not reopen controllers. |
| A11y/motion | Common semantics, Reduced Motion and Pet fallback accepted | Regression/static/device matrix; fix only owning common component if a bug appears. |

### 1.2. Gap bắt buộc phải đóng

1. `onboarding_started`/`onboarding_completed` names exist in allowlist but production commands do not
   record them.
2. No typed factory/classifier fixes exact milestone identity/timestamp and explicitly forbids
   `focus_session_*`/`reward_granted` for trial.
3. No composition policy connects analytics opt-out and best-effort queueing without affecting core
   command outcomes/navigation.
4. Existing exclusion tests contain a trial row, but no single integration journey creates a real
   trial through Start→Complete→Continue and asserts all four exclusions plus analytics together.
5. No finite `epic_05_fresh_end_to_end` and `epic_05_exclusion_seed` review contracts.
6. Shared Focus session/result route modules still import prototype authority for later-epic fallback;
   the production trial branches need explicit isolation proof/refactor without implementing EPIC-06.
7. No executable audit enforces first-use route import bans and the `≤300`-line UI/source guardrail.
8. EPIC-05 has no final implementation/evidence report or owner-gated exit report yet.

## 2. Phạm vi khóa

### 2.1. In scope

- Typed onboarding milestone event factory/recorder and composition hooks.
- Deterministic event IDs, empty approved properties, opt-out and best-effort semantics.
- Explicit negative classification: no standard Focus/reward analytics from onboarding trial.
- Real SQLite production-journey proof across reward, installation, queue and four exclusion queries.
- Full journey/no-duplicate/offline/failure/relaunch evidence composition.
- Finite end-to-end/exclusion fixtures and later-phase device guide.
- Trial branch isolation from prototype authority plus executable import/line/duplicate guardrails.
- Accessibility, Reduce Motion, status/copy/touch-target/common-component regressions.
- US-05-05 implementation report and draft EPIC-05 exit inventory, both exact-SHA-bound.

### 2.2. Out of scope

- PostHog SDK, provider adapter, network delivery, batching worker, retry scheduler or dashboard.
- New analytics event/property, autocapture, session replay, identity/person profile or raw export.
- Analytics Settings UI/opt-out mutation (EPIC-10); existing preference is only respected.
- Production Standard Focus/Strict/Break/History/Contribution/Store Review UI behavior.
- Pet naming/species/selector/progression, shop, notifications/audio/haptics.
- Schema/migration/index/package/dependency/native configuration change.
- Marking EPIC-05/MVP checklist `DONE` before owner accepts exact US-05-05 implementation SHA.

### 2.3. Fake remaining sau Story

- Không fake state trong production first-use route.
- Later-epic screens may retain explicitly isolated prototype behavior until their owning Epic.
- Dev fixtures remain finite and absent by default; analytics provider delivery remains intentionally
  deferred to EPIC-11, not faked by console output.

## 3. Technical directions đề xuất

### TD-05-05-A — Typed milestone recorder with deterministic identity

Tạo mobile Application `OnboardingAnalyticsRecorder` (hoặc equivalent cohesive name) với hai typed
commands:

```text
recordStarted(sessionId, startedAt)
  eventId    = onboarding_started:<sessionId>
  eventName  = onboarding_started
  occurredAt = durable session.startedAt

recordCompleted(completedAt)
  eventId    = onboarding_completed:1:<completedAt>
  eventName  = onboarding_completed
  occurredAt = durable app_installation.onboarding_completed_at
```

Mỗi record dùng `expiresAt = occurredAt + ANALYTICS_EVENT_TTL_MS`, `deliveryState=pending`,
`attemptCount=0`, `nextAttemptAt=null`, `createdAt=occurredAt` và exact empty properties `{}`.

- Validate non-empty ID/safe timestamps before queueing.
- Reuse existing queue dedupe; không thêm receipt/table/flag.
- `enqueued` và `already_queued` đều là success.
- Persistence error maps typed analytics outcome for test/diagnostic only; never leaks to UI/core
  command result.

Không dùng random event ID vì duplicate Start/Continue/retry phải collapse vào cùng durable
milestone.

### TD-05-05-B — Commit-first, best-effort, opt-out-safe composition

Composition ordering:

```text
Start CTA
  -> committed Start outcome
    -> return/navigate production Running
    -> best-effort record onboarding_started

Continue CTA
  -> committed installation + refreshed/verified Home handoff
    -> return/navigate production Home
    -> best-effort record onboarding_completed
```

Recorder chỉ capture khi ready Bootstrap snapshot có `analyticsEnabled=true`. Nếu false, return
`skipped_disabled` ngay, không queue và không backfill khi setting được bật lại.

- Analytics runs outside Start/session/reward/installation transactions.
- Queue failure/throw không đổi success result, không block navigation và không enter critical
  recovery.
- Duplicate explicit command retry may call recorder again; deterministic ID makes it idempotent.
- Startup hydration, Result read, foreground reconciliation và Home launch không synthesize/backfill
  events. Điều này tránh replay và tránh thu hồi tố trong thời gian opt-out.
- Development/test may verify the local queue, but no provider send path is introduced.

### TD-05-05-C — Trial analytics classification is closed and minimal

Pure factory/classifier accepts only approved onboarding facts:

- Trial emits only `onboarding_started` and `onboarding_completed`.
- Never emits `focus_session_started`, `focus_session_completed`, `focus_session_failed`,
  `focus_session_cancelled` or `reward_granted`.
- Exact properties remain `{}` because no onboarding property expansion has schema approval.
- No session record, receipt/profile totals, anonymous ID, free text, Pet data, device/platform or
  work tag is serialized into event properties.

Existing global allowlist remains unchanged. No arbitrary event-name API is exposed to screens.

### TD-05-05-D — One real journey proves every durable exclusion

Add real SQLite integration that uses production Start, Complete and first-use handoff commands:

1. Start exact five-minute onboarding trial.
2. Complete/reconcile via production transaction; assert one reward/profile `+5/+1`.
3. Explicit Continue; assert one stable installation timestamp.
4. Record the two deterministic onboarding events, repeat record/reconcile/Continue, reopen DB.
5. Assert exact two onboarding queue rows and zero standard Focus/reward event names for trial.
6. Assert Standard history empty, contribution empty, Long Break cadence count zero, store-review
   completed/active-day counts zero.
7. Assert session/receipt/profile/installation/event fingerprints unchanged across duplicates and
   reopen; returning First-use destination is Home.

Query SQL already correct; implementation mặc định chỉ thêm regression proof. Nếu test tìm bug,
fix existing query owner with focused regression—không thêm parallel query or screen formula.

### TD-05-05-E — Finite review fixtures through production paths

| Fixture | Purpose | Contract |
| --- | --- | --- |
| `epic_05_fresh_end_to_end` | Fresh Intro→Running→Result→Home with accelerated injected clock | User still presses production CTAs; no seeded fake reward/event/navigation. |
| `epic_05_exclusion_seed` | Deterministic completed trial for exclusion/evidence inspection | Prepare through production commands/transactions; evidence adapter reads typed facts. |

Existing targeted failure fixtures remain reusable; do not combine all failures into an unbounded
debug switch. Both new names require `__DEV__` + diagnostics + finite allowlist and must be absent in
production/default tests.

Evidence may show readable summaries in a dev-only surface/harness, but raw JSON/log is not the user
outcome and cannot replace SQLite assertions.

### TD-05-05-F — Prototype isolation and executable structural guardrails

- Refactor shared `focus/session` and `focus/result` route composition so the production onboarding
  branch does not call `usePrototype`; isolate later-epic fallback in cohesive route-local children.
- Do not replace Standard Focus prototype with production behavior in this Story.
- Production first-use feature/screens/routes may import Presentation/Application/composition hooks,
  never repository/SQL/infrastructure or prototype state authority.
- Add a Vitest/static integrity suite that walks scoped first-use source files and enforces:
  - forbidden repository/SQL/infrastructure/prototype imports;
  - no `PrototypeBadge`, mock reward or screen-side `5/1` formula;
  - no relevant UI/source file over `300` lines;
  - review fixture names absent unless `__DEV__`-gated finite composition files;
  - no duplicated common Button/Reward/Pet/status primitive.

If splitting is required, split by branch/ownership with typed props and tests; no speculative shared
abstraction.

### TD-05-05-G — Accessibility/offline/recovery and evidence closure

- Regress semantic order Intro→Pet/status→reward/totals→CTA and truthful non-color error states.
- Verify Button busy/disabled roles, Cancel confirmation, Reward summary, Pet polite announcement,
  Reduced Motion still parity and playback failure fallback.
- Offline first-use commands and local analytics queue must work without network/provider.
- Inject start/reward/Continue/queue failures independently; analytics failure must never change core
  durable/navigation outcome.
- Extend device harness with exact SHA/platform/device/OS/app version fields and full journey matrix;
  leave all manual cells `DEFERRED` until evidence exists.

### TD-05-05-H — Exit/report gate and scope containment

- No schema/migration/index/dependency/native/provider change.
- Implementation report binds exact implementation SHA, final tests, SQLite fingerprints and static
  audit.
- Create/update EPIC-05 exit evidence as `AWAITING_OWNER_ACCEPTANCE`; do not mark EPIC-05 or
  `MVP_EPICS.md` complete in the implementation commit.
- Only a later owner acceptance on exact US-05-05 SHA may:
  - close US-05-05 and EPIC-05;
  - finalize `EPIC-05_EXIT_REPORT.md`;
  - mark EPIC-05 done/open EPIC-06 planning gate.
- Formal tester remains deferred unless actual evidence is supplied; quick smoke must be labeled
  owner-reported with missing fields explicit.

## 4. Application contracts chi tiết

### 4.1. Recorder outcomes

```text
enqueued(eventId)
already_queued(eventId)
skipped_disabled
error(ONBOARDING_ANALYTICS_FACT_INVALID)
error(ONBOARDING_ANALYTICS_QUEUE_FAILED)
```

Composition swallows recorder errors after optional non-payload diagnostic. Tests can observe them
through injected recorder; Presentation never renders analytics success/failure.

### 4.2. Exact event schema

| Event | Trigger fact | Event ID | Properties | Forbidden siblings |
| --- | --- | --- | --- | --- |
| `onboarding_started` | Successful committed Start outcome | `onboarding_started:<sessionId>` | `{}` | all `focus_session_*`, `reward_granted` |
| `onboarding_completed` | Successful explicit Continue with durable completedAt | `onboarding_completed:1:<completedAt>` | `{}` | all `focus_session_*`, `reward_granted` |

No event is emitted at Intro view, timer deadline, Result view, Pet celebration, hydration or Home
render.

### 4.3. Final durable fingerprint

| Fact | Required after full journey and duplicates |
| --- | --- |
| Installation | one singleton, stable non-null `onboardingCompletedAt` |
| Trial session | one completed onboarding trial, `5 min`, Relax, no tag, reward fields `5/1` |
| Reward | one `onboarding_trial_completed` receipt |
| Profile | exactly `5 XP / 1 Coin` from clean baseline |
| Analytics queue | one started + one completed onboarding event; no standard/reward event |
| Standard history | zero trial entries |
| Contribution | zero trial minutes/days |
| Long Break cadence | zero trial increment |
| Store review | zero completed standard Focus / active-day contribution |
| Pet | one fresh celebration in runtime; base on hydration/relaunch |
| Route | returning launch resolves Home |

## 5. File ownership và dự kiến thay đổi

| Area | Planned change |
| --- | --- |
| `apps/mobile/src/application/onboarding-trial/` | Typed milestone factory/recorder/outcomes/tests. |
| `apps/mobile/src/application/mobile-application.facade.ts` | Narrow analytics milestone integration surface if needed. |
| `apps/mobile/src/composition/create-mobile-application.ts` | Commit-first best-effort hooks and capture policy wiring. |
| `apps/mobile/src/composition/review/` | Two finite EPIC-05 fixtures/evidence coordinator. |
| `apps/mobile/src/app/focus/` | Isolate prototype-only fallback children from production trial branches. |
| `apps/mobile/test/integration/onboarding-trial.integration.test.ts` or focused EPIC-05 integration | Full production journey fingerprints/events/exclusions/reopen. |
| `apps/mobile/test/integration/` | Static import/line/fixture/common-component integrity suite. |
| `apps/mobile/test/device/` | Full EPIC-05 deferred manual guide + harness validation. |
| `docs/planning/` | US-05-05 report and owner-gated EPIC-05 exit evidence. |

Không tạo provider adapter, analytics worker, second queue, second query implementation or product
evidence screen.

## 6. Implementation sequence

1. **Acceptance baseline:** record approved confirmations and exact implementation start SHA.
2. **Pure analytics contract:** deterministic onboarding event factory/classifier + unit tests.
3. **Recorder/policy:** existing bounded queue, opt-out, finite outcomes and failure tests.
4. **Composition hooks:** Start/Continue commit-first best-effort integration; duplicate/no-backfill.
5. **SQLite integrity:** one production journey; analytics/exclusion/fingerprint/reopen assertions.
6. **Route isolation/static gates:** prototype branch split, import/line/common/fixture audit.
7. **Fixtures/device guide:** full journey and exclusion seed; deferred evidence fields.
8. **Full regressions:** offline/failure/a11y/reduced-motion/EPIC-04/US-05-01…04/root quality.
9. **Reports:** bind exact SHA; Story and Epic remain awaiting owner acceptance.

Không mở PostHog/provider/EPIC-06 để “complete analytics” hoặc “remove all prototypes”.

## 7. Automated test matrix

### 7.1. Analytics unit/application

- Started/completed factories create exact deterministic ID/time/TTL/pending/empty properties.
- Invalid ID/time fails before queue.
- Queue `enqueued`/`already_queued` map success; persistence failure is finite.
- Disabled preference skips without queue; later enable does not retroactively backfill.
- Start/handoff core success remains success when recorder rejects/throws/is slow.
- Duplicate Start/Continue retries call same event ID.
- Hydration/foreground/Result/Home never invokes recorder.
- Trial classifier exposes no standard Focus/reward event.

### 7.2. Real SQLite journey/integrity

- Clean Start→Complete→Continue persists exact final fingerprint.
- Duplicate completion/reconcile/result/Continue/event calls keep one reward, one timestamp and two
  events.
- Reopen retains events/facts and routes Home without celebration replay.
- Standard history excludes trial.
- Contribution has zero trial minutes/count.
- Long Break cadence remains zero.
- Store-review completed Focus/active-day counts remain zero.
- Queue cap/TTL/privacy/dedupe existing regressions remain green.
- Queue failure rollback is isolated from session/reward/installation transactions.

### 7.3. Flow/presentation/a11y

- Fresh fixture follows production Intro→Running→Result→Home controls.
- Cancel returns Intro with no reward/completion/events except committed started milestone.
- Start/reward/Continue failure recovery remains truthful and no partial facts.
- Pet one announcement/fresh celebration; reopen/base/Reduced Motion/fallback parity.
- CTA labels, accessibility roles/states/order, large text layout and touch targets regressions.
- No trial branch reads prototype state; later fallback tests remain unchanged.

### 7.4. Static/scope/root gates

- Scoped source has no infrastructure/repository/SQL/prototype imports.
- Relevant route/presentation/application files `≤300` lines.
- No fixture leakage/default activation or duplicate primitives/formulas.
- No schema/migration/index/package/lock/native/provider diff.
- `pnpm run quality`, `git diff --check`, exact changed-file scope and repository hygiene pass.

## 8. Formal tester guide — execution deferred

Implementation will add the final guide; no row is marked passed without evidence.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=epic_05_fresh_end_to_end pnpm start --clear
```

Deferred matrix:

1. Fresh Intro→Running→Result→Home; exact `5/1`, one celebration, CTA non-blocking.
2. Background/foreground and cold relaunch in Running and Result; no reset/duplicate/replay.
3. Returning relaunch direct Home with base Pet and committed totals.
4. Cancel path returns Intro with no reward/completion.
5. Existing start/reward/Continue failures recover without partial durable facts.
6. Entire flow offline.
7. Screen reader, large text, Reduce Motion and visual playback failure parity.
8. `epic_05_exclusion_seed` evidence matches automated zero Standard history/contribution/cadence/
   review/core-event facts.
9. Remove fixture and verify normal default contains no review control/data leakage.

Evidence fields: exact SHA, platform, device/simulator, OS, Development Build/app version, Node/pnpm,
fresh/relaunch/cancel/failure/offline/a11y/motion captures, durable fingerprints and pass/fail. Current
formal tester status: `DEFERRED`.

Cleanup:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

## 9. Definition of Done

- [x] Owner approves `US0505-CONFIRM-01`…`08`; implementation start SHA recorded.
- [x] Exactly two onboarding milestone types record only after their durable commits.
- [x] Deterministic IDs make duplicate Start/Continue idempotent; no hydration/backfill emission.
- [x] Analytics disabled skips capture; analytics failure never changes core outcome/navigation.
- [x] Trial emits no standard Focus/reward events and properties remain exact `{}`.
- [x] Production-created trial passes all history/contribution/cadence/store-review exclusions.
- [x] Full journey fingerprint remains exact across duplicate/reopen/offline/failure paths.
- [x] Fresh/exclusion fixtures use production paths and are absent by default.
- [x] Trial route branches are isolated from prototype authority; static import/line/common gates pass.
- [x] A11y/Reduced Motion/Pet/common regressions and final root quality pass.
- [x] No schema/migration/dependency/native/provider/EPIC-06 scope change.
- [x] Implementation/evidence reports bind exact SHA; formal tester stays deferred unless supplied.
- [ ] Owner accepts exact US-05-05 implementation before EPIC-05/MVP status closes or EPIC-06 opens.

## 10. Owner confirmation gate

| ID | Confirmation | Recommendation | Status |
| --- | --- | --- | --- |
| `US0505-CONFIRM-01` | Deterministic typed IDs/timestamps for exactly started/completed onboarding milestones | Approve TD-05-05-A | `APPROVED — 2026-09-01` |
| `US0505-CONFIRM-02` | Commit-first best-effort queue; opt-out skip, no startup backfill, no core failure | Approve TD-05-05-B | `APPROVED — 2026-09-01` |
| `US0505-CONFIRM-03` | Exact `{}` properties; never standard Focus/reward events for trial | Approve TD-05-05-C | `APPROVED — 2026-09-01` |
| `US0505-CONFIRM-04` | One production SQLite journey proves all exclusions/fingerprints/reopen | Approve TD-05-05-D | `APPROVED — 2026-09-01` |
| `US0505-CONFIRM-05` | Two finite full-journey/exclusion fixtures through production paths | Approve TD-05-05-E | `APPROVED — 2026-09-01` |
| `US0505-CONFIRM-06` | Isolate prototype fallback and enforce import/≤300/common/fixture static gates | Approve TD-05-05-F | `APPROVED — 2026-09-01` |
| `US0505-CONFIRM-07` | Offline/failure/a11y/motion automated gates mandatory; formal tester deferred | Approve TD-05-05-G | `APPROVED — 2026-09-01` |
| `US0505-CONFIRM-08` | No schema/provider/dependencies/EPIC-06; Epic exit remains owner-gated | Approve TD-05-05-H | `APPROVED — 2026-09-01` |

Owner có thể duyệt một lần bằng `Duyệt US0505-CONFIRM-01…08` hoặc nêu ID cần chỉnh. Approval chỉ
mở implementation US-05-05; không tự đóng EPIC-05 hoặc mở implementation EPIC-06.

## 11. Risks và mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Analytics runs before durable commit | False milestone | Hook only after successful Start/Handoff outcome using returned durable fact. |
| Queue failure blocks onboarding | Broken core loop | Outside core transaction, best-effort result ignored by command/navigation. |
| Random IDs duplicate milestones | Inflated metrics | Deterministic IDs from session ID/completion timestamp + queue PK. |
| Startup backfill violates opt-out/replays | Privacy/semantic error | No hydration synthesis or retroactive capture. |
| Trial emits standard events | Polluted funnel/reward metrics | Closed factory + negative event-name tests + SQLite count proof. |
| Existing raw-seed test masks query gap | False integrity confidence | Full trial produced through production commands, all queries asserted together. |
| Removing prototype expands EPIC-06 | Scope drift/regression | Isolate only trial branch; preserve later-epic fallback unchanged. |
| Fixture becomes production backdoor | Review state leakage | `__DEV__`/diagnostics/finite allowlist/default absence static test. |
| Automated pass claimed as device evidence | False exit evidence | Formal matrix remains deferred; missing platform/captures explicit. |
| Story commit auto-closes Epic | Gate bypass | Separate exact-SHA owner acceptance before exit/MVP/EPIC-06 updates. |

## 12. References

- `docs/planning/EPIC-05_USER_STORIES.md` — locked Story/decisions/exit matrix.
- `docs/planning/US-05-01…04` plans/reports — accepted journey facts.
- `docs/PIXELDORO_CORE_TRUTH.md` — first-use exclusions and analytics event separation.
- `docs/specifications/gamification-rules.md` — trial reward/exclusion rules.
- `docs/architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md` — privacy, queue,
  provider separation.
- `docs/architecture/data-model.md` — existing analytics queue and durable discriminators.
- Existing bounded queue, four derived queries, trial controllers and Pet/Home composition.

## 13. Change log

| Version | Date | Author | Change |
| --- | --- | --- | --- |
| 0.3.0 | 2026-09-01 | Codex | Bound deterministic analytics, real SQLite exclusion proof, fixtures/static/a11y gates and 82/391 quality evidence to exact implementation SHA 580f559; Story awaits owner acceptance and formal tester remains deferred. |
| 0.2.0 | 2026-09-01 | Codex, recording owner approval | Recorded approval of US0505-CONFIRM-01…08 and opened implementation at exact SHA 2080d15; EPIC-05 exit remains owner-gated and EPIC-06 remains closed. |
| 0.1.0 | 2026-08-31 | Codex, for owner review | Closed accepted f1302b8 dependency audit; proposed deterministic onboarding milestone hooks, production-journey exclusion proof, fixture/static/a11y gates and owner-gated EPIC-05 exit. No production implementation. |
