---
document_id: PIXELDORO_EPIC_06_USER_STORIES
title: PixelDoro EPIC-06 — Standard Focus User Stories
version: 0.5.1
status: US_06_03_DONE_US_06_04_PLANNING_OWNER_REVIEW
date: 2026-09-04
owner: Dũng Lư
reviewed_by: Dũng Lư
reviewed_at: 2026-09-03
branch: feats/epic-06
baseline_sha: 658b708825e633916692b4e19d4086885fd50ce1
owner_review_sha: aa7f561c2eb8bca8302a1f6a072665819d653dbe
upstream: origin/feats/epic-06
epic: EPIC-06
epic_state: IN_PROGRESS
implementation_state: US_06_01_02_03_DONE_US_06_04_NOT_STARTED
formal_tester_status: DEFERRED_TO_LATER_PHASE
language: vi
authority: PLANNING
authority_references:
  - ../PIXELDORO_CORE_TRUTH.md
  - ./EPIC-03_UX_PROTOTYPE_PLAN.md
  - ./MVP_EPICS.md
  - ./EPIC-01_TO_05_COMPLETION_AUDIT_AND_NEXT_PLAN.md
  - ../specifications/timer-engine.md
  - ../specifications/session-lifecycle.md
  - ../specifications/gamification-rules.md
  - ../specifications/pet-state-machine.md
  - ../architecture/technical-overview.md
  - ../architecture/system-architecture.md
  - ../architecture/project-structure.md
  - ../architecture/data-model.md
  - ../architecture/decisions/ADR-001-mobile-runtime-and-toolchain.md
  - ../architecture/decisions/ADR-002-navigation-with-expo-router.md
  - ../architecture/decisions/ADR-003-state-and-persistence.md
  - ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
  - ../architecture/decisions/ADR-005-animation-stack.md
  - ../architecture/decisions/ADR-006-in-app-feedback-and-store-review.md
  - ../architecture/decisions/ADR-007-eas-delivery-pipeline.md
  - ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# EPIC-06 — Standard Focus User Stories

## 0. Trạng thái và nguyên tắc dùng tài liệu

Tài liệu này chỉ phân rã planning cho `EPIC-06`. Nó không phải implementation plan của
`US-06-01`, không cấp quyền thay đổi production code và không chuyển bất kỳ acceptance checkbox
implementation nào sang hoàn thành.

Authority order khi triển khai hoặc review:

1. Product Core và product decision đã khóa.
2. Owner-approved EPIC-03 UX flow.
3. MVP Epic Plan và completion audit.
4. Timer Engine, Session Lifecycle, Gamification Rules, Pet State Machine.
5. Architecture và ADR.
6. Schema/code hiện có là implementation baseline, không được tự thay requirement.

Nếu nội dung phía dưới mâu thuẫn authority cao hơn, authority cao hơn thắng và tài liệu này phải được
sửa trước khi implementation tiếp tục. Owner Dũng Lư đã review và duyệt Option A cho toàn bộ
confirmation ở mục 12 ngày 2026-09-03, đồng thời cho phép tạo implementation plan riêng cho
`US-06-01`. Owner sau đó duyệt Option A cho toàn bộ implementation confirmations và yêu cầu triển
khai code. US-06-01 hiện có exact implementation SHA
`68f2c54d3630817385b320622476c55c67caea13`; owner đã báo cáo quick UI smoke và yêu cầu mở
implementation planning cho US-06-02. Full manual matrix/formal tester không bị suy diễn là pass và
vẫn được giữ deferred. Owner đã duyệt `US0602-CONFIRM-01`→`10` Option A; US-06-02 đã commit tại
exact SHA `9a8e3d87d44612b7bd9aa8bf9e592099300d9e2e`, owner báo cáo quick UI smoke đạt mức chấp nhận để
mở owner-gated implementation planning cho US-06-03. Full structured manual matrix/formal tester
không bị suy diễn là pass.
Owner tiếp tục duyệt `US0603-CONFIRM-01`→`11` Option A. US-06-03 đã commit tại exact SHA
`14ef3413742df4159aa3a7e537d2fd02667cb203`, bao gồm quick-UI fixes cho stale Trial Result và Cancel
callback. Owner báo cáo quick UI done và cho phép mở
[US-06-04 implementation planning](./US-06-04_IMPLEMENTATION_PLAN.md). US-06-04 production code
chưa bắt đầu; confirmations riêng đang chờ owner review. Full structured manual/formal evidence
không được suy diễn là pass.

## 1. Kết luận audit baseline

### 1.1. Git/readiness

| Kiểm tra | Kết quả ngày 2026-09-03 |
|---|---|
| Branch | `feats/epic-05` |
| HEAD | `658b708825e633916692b4e19d4086885fd50ce1` |
| Upstream | `origin/feats/epic-05`; local ahead `1` |
| Completion commit | HEAD đúng completion baseline được yêu cầu; ancestor check pass |
| Working tree trước task | Sạch |
| Owner change conflict | Không có |
| EPIC-01 → EPIC-05 | `DONE_OWNER_ACCEPTED` |
| EPIC-06 | `PLANNING_READY`; implementation `NOT_STARTED` |
| EPIC-05 formal tester | `DEFERRED_TO_LATER_PHASE` |
| Product open decisions | `OPEN-006`, `OPEN-009` vẫn mở và không block EPIC-06 |

### 1.2. Audit conclusion

- Standard Focus Setup, Running và Result hiện là **prototype**, không phải production behavior.
- Production route `/focus/session` và `/focus/result` chỉ ưu tiên durable onboarding trial; khi
  không có trial production projection, chúng rơi về Standard Focus prototype branch.
- Standard Focus prototype dùng `PrototypeProvider`/`prototypeReducer`, hard-coded default
  `25 / relax / coding`, countdown cố định, dev controls và reward tự tính trong memory.
- Production onboarding trial đã có commit-before-navigation Start, timestamp countdown,
  cancel/complete/relaunch, atomic reward, committed Result, Pet feedback và best-effort local
  analytics. Các pattern này tái sử dụng được, nhưng các use case hiện trial-specific.
- Schema/migration `001` đã chứa đầy đủ Standard Focus, Strict `backgrounded_at`, four-status,
  reward receipt và transaction backstop. Audit không chứng minh schema gap; planning decision mặc
  định là `NO SCHEMA CHANGE`, chờ owner xác nhận `US0600-CONFIRM-02`.
- Không có production local-notification schedule/cancel adapter cho session. Package hiện tại cũng
  chưa khai báo notification package chuyên dụng; đây là gate cần owner duyệt riêng, không được tự
  thêm dependency hoặc native config.

## 2. Completed-document inventory

Audit đã inventory `56` file có sẵn trong `docs/` trước khi tạo tài liệu này và đọc nội dung liên
quan đến authority, status, decision, implementation evidence, limitation và carry-forward; không
chỉ đọc filename/metadata.

### 2.1. Product, governance, architecture và specification

- [x] `docs/PIXELDORO_CORE_TRUTH.md` — `ACTIVE`; Focus config/mode/truth/UX/notification/analytics.
- [x] `docs/TECHNICAL_DOCUMENTATION_CHECKLIST.md` — documentation baseline `DONE`; open governance.
- [x] `docs/architecture/technical-overview.md` — `APPROVED`; stack/platform/quality constraints.
- [x] `docs/architecture/system-architecture.md` — `APPROVED`; transaction, coordinator, projection.
- [x] `docs/architecture/project-structure.md` — `APPROVED`; ownership/import/test/asset boundaries.
- [x] `docs/architecture/data-model.md` — `APPROVED`; session/reward/schema/transaction invariants.
- [x] `docs/architecture/decisions/ADR-001-mobile-runtime-and-toolchain.md` — accepted runtime/toolchain.
- [x] `docs/architecture/decisions/ADR-002-navigation-with-expo-router.md` — accepted navigation.
- [x] `docs/architecture/decisions/ADR-003-state-and-persistence.md` — accepted state ownership.
- [x] `docs/architecture/decisions/ADR-004-domain-and-platform-boundaries.md` — accepted boundaries.
- [x] `docs/architecture/decisions/ADR-005-animation-stack.md` — accepted animation stack.
- [x] `docs/architecture/decisions/ADR-006-in-app-feedback-and-store-review.md` — accepted separation.
- [x] `docs/architecture/decisions/ADR-007-eas-delivery-pipeline.md` — accepted delivery boundary.
- [x] `docs/architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md` — accepted queue/privacy.
- [x] `docs/specifications/timer-engine.md` — `APPROVED`; timestamp/Strict/reconcile/idempotency.
- [x] `docs/specifications/session-lifecycle.md` — `APPROVED`; terminal/reward/recovery/Result boundary.
- [x] `docs/specifications/pet-state-machine.md` — `APPROVED`; base/terminal/no-replay/a11y.
- [x] `docs/specifications/gamification-rules.md` — `APPROVED`; reward formula/atomicity/idempotency.
- [x] `docs/runbooks/EPIC-01_DELIVERY.md` — delivery evidence boundary; no build invoked here.

### 2.2. Master plan, Epic evidence và UX

- [x] `docs/planning/MVP_EPICS.md` — EPIC-01→05 done; EPIC-06 planning-ready only.
- [x] `docs/planning/EPIC-01_TO_05_COMPLETION_AUDIT_AND_NEXT_PLAN.md` — completion/deferred truth.
- [x] `docs/planning/EPIC-01_USER_STORIES.md` — `DONE_OWNER_ACCEPTED`.
- [x] `docs/planning/EPIC-01_IMPLEMENTATION_EVIDENCE.md` — `COMPLETE_OWNER_ACCEPTED`.
- [x] `docs/planning/EPIC-02_USER_STORIES.md` — `DONE_OWNER_ACCEPTED`.
- [x] `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md` — `COMPLETE_OWNER_ACCEPTED`.
- [x] `docs/planning/EPIC-03_UX_PROTOTYPE_PLAN.md` — `DONE_OWNER_ACCEPTED`/`UX_APPROVED`.
- [x] `docs/planning/EPIC-04_USER_STORIES.md` — `DONE_OWNER_ACCEPTED`.
- [x] `docs/planning/EPIC-04_EXIT_REPORT.md` — `DONE_OWNER_ACCEPTED`.
- [x] `docs/planning/EPIC-05_USER_STORIES.md` — `DONE_OWNER_ACCEPTED`.
- [x] `docs/planning/EPIC-05_EXIT_REPORT.md` — owner accepted; formal tester deferred.

### 2.3. Implementation plan/report/evidence inventory EPIC-02→05

- [x] `docs/planning/US-02-01_IMPLEMENTATION_PLAN.md` — workspace/scaffold baseline (`DONE`).
- [x] `docs/planning/US-02-02_IMPLEMENTATION_PLAN.md` — initial schema/migration (`DONE`).
- [x] `docs/planning/US-02-03_IMPLEMENTATION_PLAN.md` — SQLite kernel/transaction (`DONE`).
- [x] `docs/planning/US-02-04_IMPLEMENTATION_PLAN.md` — bootstrap seed/verification (`DONE`).
- [x] `docs/planning/US-02-05_IMPLEMENTATION_PLAN.md` — typed repositories (`DONE`).
- [x] `docs/planning/US-02-06_IMPLEMENTATION_PLAN.md` — derived queries (`DONE`).
- [x] `docs/planning/US-02-07_IMPLEMENTATION_PLAN.md` — migration/reopen evidence (`DONE`).
- [x] `docs/planning/US-02-08_IMPLEMENTATION_PLAN.md` — safe recovery (`DONE`).
- [x] `docs/planning/US-02-09_IMPLEMENTATION_PLAN.md` — reset/exit evidence (`DONE`).
- [x] `docs/planning/US-04-03_IMPLEMENTATION_REPORT.md` — terminal Pet feedback accepted.
- [x] `docs/planning/US-04-04_IMPLEMENTATION_REPORT.md` — arbitration/no-replay accepted.
- [x] `docs/planning/US-04-05_IMPLEMENTATION_REPORT.md` — playback/visibility accepted.
- [x] `docs/planning/US-04-06_IMPLEMENTATION_REPORT.md` — fallback/a11y accepted.
- [x] `docs/planning/US-04-07_ART_CANDIDATE_REVIEW.md` — Cat Dev art approved/integrated.
- [x] `docs/planning/US-04-07_IMPLEMENTATION_REPORT.md` — final Pet asset implementation accepted.
- [x] `docs/planning/US-04-07_TEST_GUIDE.md` — manual art/device evidence guide reviewed.
- [x] `docs/planning/US-05-01_IMPLEMENTATION_PLAN.md` — production trial Start plan accepted.
- [x] `docs/planning/US-05-01_IMPLEMENTATION_REPORT.md` — commit-first trial Start evidence accepted.
- [x] `docs/planning/US-05-02_IMPLEMENTATION_PLAN.md` — running/cancel/relaunch plan accepted.
- [x] `docs/planning/US-05-02_IMPLEMENTATION_REPORT.md` — timestamp/cancel evidence; tester deferred.
- [x] `docs/planning/US-05-03_IMPLEMENTATION_PLAN.md` — atomic completion/Result plan accepted.
- [x] `docs/planning/US-05-03_IMPLEMENTATION_REPORT.md` — race/rollback/reopen evidence; tester deferred.
- [x] `docs/planning/US-05-04_IMPLEMENTATION_PLAN.md` — Pet/Continue handoff plan accepted.
- [x] `docs/planning/US-05-04_IMPLEMENTATION_REPORT.md` — fresh Pet/Home handoff evidence accepted.
- [x] `docs/planning/US-05-05_IMPLEMENTATION_PLAN.md` — analytics/integrity exit plan accepted.
- [x] `docs/planning/US-05-05_IMPLEMENTATION_REPORT.md` — local analytics/exclusion evidence accepted;
  formal tester remains deferred.

## 3. Code/data/UX capability audit

| Capability/screen | Current state | Classification | Reusable code | Gap | Owner Story | Confirmation |
|---|---|---|---|---|---|---|
| Focus Setup | Full visual selector; `25/relax/coding`; route calls reducer then pushes | Prototype/fake | `FocusSetupScreen` hierarchy; common shell/panel/chip/button | Production typed draft, validation, command status, durable Start | `US-06-01` | `01`, `03`, `09` |
| Start Standard Focus | Không có use case/controller/facade method | Missing | trial Start pattern; coordinator; calendar/clock/id; generic session insert | Standard validation, record creation, active conflict, committed projection | `US-06-01` | `02`, `05` |
| Route after Start | Setup route navigates from local reducer immediately | Prototype/fake | Expo Router route boundary | Navigate only after transaction success; friendly retry/warning | `US-06-01` | `03` |
| Relax Running | Standard branch reads in-memory `activeSession` | Prototype/fake | trial running controller/tick scheduler; Pet/status/cancel UI | Standard read projection, timestamp tick, foreground/startup reconciliation | `US-06-02` | `05` |
| Countdown | Standard shows configured `MM:00` forever | Fake/hard-coded | `createOnboardingTrialRemainingProjection`; scheduler | Generic timestamp projection and accessible timer display | `US-06-02` | `04` |
| Cancel | Standard dev control directly sets local result | Prototype/fake | trial cancel use case; conditional transition repository; dialog | Standard cancel command, race result, committed cancelled Result | `US-06-02` | `05` |
| Strict background evidence | Repository can write `backgrounded_at`; lifecycle bridge does not call it | Infrastructure partial | lifecycle adapter; coordinator; repository conditional update | Background command, failure recovery and episode ownership | `US-06-03` | `05` |
| Strict foreground/relaunch | Startup adapter reconciles trial only | Missing for Standard | bootstrap reconciliation barrier; trial controller composition | precedence `violation <= deadline`, clear evidence, missing-evidence policy | `US-06-03` | `05` |
| Relax/Strict lifecycle | Trial production is Relax-only; Standard local state only | Partial/prototype | clock/calendar/session transaction boundaries | Generic standard domain decision and application commands | `US-06-02/03` | `05` |
| Complete Standard Focus | Không có production resolver | Missing | trial completion transaction pattern; profile/reward/session repos | Configured reward formula, conditional terminal, fresh event, retry | `US-06-04` | `02`, `05` |
| Reward | Prototype computes `minutes` and `floor(minutes/5)` in reducer | Fake for Standard | generic reward/profile repository; unique session receipt | Automatic atomic/idempotent standard receipt `focus_completed` | `US-06-04` | `02` |
| Focus Result | Trial production ready; Standard Result reads reducer values | Mixed production/prototype | `RewardSummary`, Pet visual, header/panel/stat/buttons | Standard committed result query/controller; three variants; no replay | `US-06-04` | `03`, `06` |
| Pet feedback | EPIC-04 controller complete; trial bridge emits fresh completed | Production/reusable | base projection, fresh terminal feedback, no-replay, fallback | Emit Standard completed/Strict failed only after commit | `US-06-03/04` | `05` |
| Startup/foreground | Bootstrap barrier + trial reconciliation; foreground only calls trial complete | Production but trial-scoped | readiness/bootstrap/lifecycle/controller patterns | One active-session reconciliation authority covering Standard | `US-06-02/03/04` | `05` |
| Notification | Reset cleanup is no-op; no session schedule/cancel adapter | Missing | post-commit warning pattern only | Typed port, idempotent operation, platform adapter, denial/failure | `US-06-05` | `07`, `10` |
| Analytics | Typed allowlist + bounded queue; onboarding-only recorder | Production foundation/partial | queue, opt-out snapshot, deterministic IDs | Standard Focus recorder and after-commit hooks; no provider | `US-06-05` | `07` |
| Accessibility/motion | Common buttons/chips/status/Pet reduced-motion exist | Production reusable | semantic controls, Pet fallback, `ScreenShell` scroll | Timer live-region policy, large-text layout, non-color outcome audit | all; exit in `US-06-05` | `04`, `08` |
| Schema | `sessions`/`reward_transactions`/indexes/triggers support Standard/Strict | Production baseline | migration `001`, mappers, repositories, queries | Không có gap được chứng minh | all | `02` |

### 3.1. Reuse và non-reuse quyết định từ audit

Reuse production:

- `SessionCommandCoordinator`, `ClockPort`, `IdPort`, `LocalCalendarPort`, `TransactionPort`.
- `SessionRepository`, `RewardReceiptRepository`, `ProfileRepository` và SQLite implementations.
- Partial unique running-session index, terminal immutability, conditional update, reward unique key.
- Trial timestamp projection/controller pattern, bootstrap/readiness barrier và app lifecycle adapter.
- Pet companion/terminal/visual controllers; analytics allowlist/queue.
- Common Presentation components ở mục 4.

Không reuse làm production truth:

- `prototype-state.ts`, `PrototypeProvider`, `PrototypeFocusResult`, fake reward math hoặc dev controls.
- `PrototypeSessionBranch`/`PrototypeResultBranch` làm Standard route authority.
- Fixed `MM:00`, `MOCK COUNTDOWN`, direct `resolveFocus` và local `activeSession`.
- Prototype Break selector/action; EPIC-07 vẫn sở hữu Break command/cadence UI.

## 4. Common Component Reuse Matrix

Mọi props phía dưới là proposal để owner review, chưa phải API đã implement.

| Primitive/pattern | Existing file và consumer | Quyết định | Proposed props/API và cấm business logic | A11y contract | Target/ước lượng | Regression consumer |
|---|---|---|---|---|---|---|
| Screen shell/layout | `components/screen-shell.tsx`; toàn prototype, onboarding trial | Reuse trực tiếp; bỏ alias `PrototypeScreen` khỏi production Focus | `children`; layout/scroll only; cấm fetch/navigation/session | Safe area, scroll, keyboard taps, large text | giữ common ~30 dòng | onboarding, Home, Focus, Break, Settings |
| Header | `components/screen-header.tsx` | Reuse trực tiếp | `eyebrow/title/description`; cấm outcome derivation | title role header, readable reflow | ~45 dòng | mọi feature hiện tại |
| Section title | `components/section-label.tsx` | Reuse trực tiếp | `children`; presentation only | text remains visible at large text | ~20 dòng | Setup/Settings/Feedback |
| Card/Panel | `components/panel.tsx` | Reuse trực tiếp | `tone/style/children`; tone do view model chọn | không dùng tone làm status duy nhất | ~45 dòng | mọi screen/card |
| Chip/Tag/Mode | `components/choice-chip.tsx` | Extend API nhỏ | thêm optional `accessibilityLabel`; keep selected/disabled/callback | radio state + visible checkmark + 44pt target | common ≤75 dòng | Focus Setup, Settings, Feedback |
| Duration control | Chưa có common; hiện inline trong `focus/index.tsx` | Create common vì API ổn định và Setup là consumer đầu; promote khi Settings default-duration dùng ở EPIC-10 | `value/min/max/step/onChange/disabled/quickValues`; cấm validation truth/persistence | increment/decrement labels, value text, large-text wrap | `components/duration-control.tsx` 90–130 | Focus Setup; future Settings |
| Button/variants | `components/button.tsx` | Reuse/extend only nếu cần destructive visual tone | `label/onPress/tone/disabled/busy`; cấm command/navigation policy | role/state/label, busy, 44pt | common ≤100 | toàn app |
| Popup/confirmation | `components/confirmation-dialog.tsx` | Reuse; extend optional dismiss/confirm labels only | callbacks + view copy; cấm cancel command | modal semantics, focus order, busy lock, OS back dismiss | common ≤90 | trial, Focus, Break |
| Avatar/Pet portrait/stage | `pet-portrait.tsx`, `pet-stage.tsx`, `pet-visual-status.tsx` | Reuse trực tiếp qua public component index | typed projection/callback; cấm transition/reward/session read | semantic status outside decorative sprite; Reduce Motion still | existing ≤110/file | Home, trial, Focus, Break, Result |
| Status badge/surface | `status-surface.tsx`; loading/empty/error | Extend only for optional inline action label if proven | typed display model; cấm raw provider/SQLite errors | alert/live-region, non-color, readable retry | common ≤110 | bootstrap, trial, History, Shop, Focus |
| Inline notice | `inline-notice.tsx` | Extend `tone` only if warning/success distinction needs it | `children/tone`; no error mapping | text/glyph in addition to color | common ≤60 | onboarding, Focus, Break |
| Reward summary | `reward-summary.tsx` | Reuse directly for committed completed Result | `xpEarned/coinsEarned`; no formula/no claim callback | grouped summary label; visible values | ~45 dòng | onboarding Result + Standard Result |
| Stat display | `stat-display.tsx` | Reuse trực tiếp | `label/value`; no progression math | grouped accessible label | ~40 dòng | onboarding/Home/Result |
| Countdown display | Trial has `trial-countdown.tsx`; Standard prototype has inline block | Create generic common display, migrate trial | `displaySeconds/phase/accessibilityLabel`; no clock/tick arithmetic | controlled announcement cadence; tabular numerals; large text | `components/countdown-display.tsx` 70–100 | trial + Standard Running |
| Reduced-motion wrapper | `reduced-motion.store/context` + Pet animation consumes it | Giữ owner hiện tại; không tạo wrapper speculative | projection only; no session rule | OS preference respected; no meaning lost | no new file unless second non-Pet animation | Pet consumers/current screens |

### 4.1. UI file split guardrail

- `presentation/features/focus/index.tsx` hiện `241` dòng: đã chạm split-review threshold. Trước
  production work phải tách thành `focus-setup-screen.tsx` và `focus-running-screen.tsx`; public
  `index.ts` chỉ export.
- `focus-result-screen.tsx` hiện `150` dòng nhưng prototype-specific. Production Result nên dùng
  typed view model và tách outcome body/next-actions nếu file dự kiến vượt `240–260` dòng.
- `app/focus/session.tsx` hiện `134` dòng và đang chứa trial orchestration. Không nhồi Standard
  business state vào route; tách production branch/controller hook để route giữ khoảng `≤80` dòng.
- Không UI source file nào được vượt `300` dòng. Mọi estimate chạm `240` phải có split review trước
  merge; không tạo fragment vô nghĩa chỉ để đạt số dòng.
- Common component chỉ nhận typed props/view model/callback. Session transition, timestamp math,
  validation, reward, SQL, navigation policy và provider SDK bị cấm.

## 5. Story order, priority và tangible output

| Order | Story | Priority | Dependency | Owner-visible output độc lập |
|---:|---|---|---|---|
| 1 | `US-06-01` — Production Standard Focus Setup, validation và commit-before-navigation Start | `P0` | EPIC-05, approved UX, owner confirmations | Setup thật tạo một committed Standard Focus và chỉ vào Running sau commit |
| 2 | `US-06-02` — Relax Running, timestamp countdown, recovery và cancel | `P0` | `US-06-01` | Relax countdown sống qua background/relaunch; cancel ra committed cancelled Result |
| 3 | `US-06-03` — Strict Mode Lite và failed outcome | `P0` | `US-06-02` | Grace/precedence/relaunch có evidence; Strict fail ra committed failed Result |
| 4 | `US-06-04` — Exactly-once completion, reward và committed Result | `P0` | `US-06-02`, `US-06-03` | Completed session/reward commit once; 3 Result variants đọc durable facts |
| 5 | `US-06-05` — Side-effect hooks, accessibility, integrity và Epic exit | `P1` | `US-06-01`→`04`; notification gate | Notification/analytics best-effort, full regression/evidence/exit candidate |

Không điều chỉnh proposed sequence vì audit không phát hiện dependency bắt buộc khác. Notification
thiếu dependency/adapter được giữ ở Story cuối, không làm yếu durable truth và cần confirmation riêng.

## 6. US-06-01 — Production Standard Focus Setup, validation và commit-before-navigation Start

### 6.1. Identity, priority, value và output

- **Priority:** `P0` — mọi Running/Strict/Result phụ thuộc một Standard Focus record hợp lệ đã commit.
- **User value:** người dùng cấu hình đúng duration/mode/tag và biết Start thành công thật, không mất
  lựa chọn hoặc thấy Running giả khi database thất bại.
- **Tangible deliverable:** Home → production Setup → Start → committed running Standard Focus →
  Running route; validation/conflict/write failure giữ Setup với retry-safe copy.

### 6.2. Dependency, order, Start gate và Exit gate

- **Order/dependency:** Story `1`; EPIC-05 accepted, EPIC-03 UX approved, schema/repository baseline.
- **Start gate:** `US0600-CONFIRM-01/02/03/04/09` approved; working tree clean; exact implementation
  baseline recorded; no schema/dependency/native change without separate approval.
- **Exit gate:** owner thấy durable Start journey; unit/integration/route/a11y evidence pass; exact
  SHA report và owner acceptance trước `US-06-02`.

### 6.3. Scope, current gap và prototype boundary

**In scope:** duration `15..120`, step `5`, default `25`; modes `relax/strict`; four tags; typed
validation; active-session conflict; timestamp/local-day derivation; transaction insert; busy/error;
commit-before-navigation; post-commit side-effect intentions.

**Out of scope:** Running semantics, Strict violation, terminal reward, Break, remembering last draft,
custom tag, schema/migration, settings UI, provider analytics.

**Current-state gap:** Setup calls `startFocus()` on prototype reducer then navigates immediately.
Validation/clamp lives in Presentation prototype and there is no Standard Start use case.

**Boundary:** reuse visual hierarchy/copy only. Retire Standard Setup dependency on
`PrototypeProvider` when Story lands; do not reuse reducer, fake reward or fake session record.

### 6.4. User flow và navigation

1. Home CTA opens `/focus/setup`; draft initializes from confirmed defaults.
2. User changes duration/mode/tag; Presentation holds draft only.
3. Start maps draft to typed application input; invalid input never reaches persistence.
4. Button becomes busy; command serializes, validates active invariant and commits running row.
5. On success, route replaces/pushes `/focus/session` from committed session ID/projection.
6. On typed failure, remain Setup, preserve draft, show non-technical retry/conflict copy.

### 6.5. Responsibilities by layer

- **Domain:** pure Standard Focus config validation and immutable record decision; no clock/platform.
- **Application:** `StartStandardFocusUseCase`; capture clock once; local calendar; coordinator;
  discriminated result/warnings; committed running projection.
- **Infrastructure:** reuse SQLite session insert/transaction/unique active index; map conflict/error;
  no SQL/schema extension.
- **Presentation:** typed Setup view model/controller; common components; route only composes
  dependencies and navigates from success result.

### 6.6. Durable facts and side effects

Before Start: no new session; Setup draft is transient. After success: exactly one `sessions` row
with `focus/standard`, valid config, `running`, `started_at`, `ends_at`, local-day facts and zero/null
terminal/reward fields. Story này chỉ refresh committed Session/Pet projections sau commit; không
thêm haptic, notification hoặc analytics hook. Các best-effort side effect đó vẫn thuộc `US-06-05`.

### 6.7. UI reuse, target ownership và line estimate

- Reuse `ScreenShell`, `ScreenHeader`, `Panel`, `SectionLabel`, `ChoiceChip`, `Button`, `InlineNotice`.
- Create `DurationControl` common; no rule/persistence inside it.
- Expected ownership: `packages/domain/src/focus/`, `packages/application/src/standard-focus/`, mobile
  application controller/composition, `presentation/features/focus/focus-setup-screen.tsx`, thin route.
- Estimate: Setup `170–220`, controller/hook `120–180`, route `≤60`, common duration `90–130`.
  Split review before `240`; hard max `300` per UI file.

### 6.8. Acceptance criteria

- [x] Default is exactly `25` minutes and approved initial mode/tag behavior.
- [x] Only duration `15..120` divisible by `5`, approved mode and tag can Start.
- [x] Direct malformed application input is rejected without write.
- [x] Start persists one Standard Focus with correct timestamps/local-day facts.
- [x] Existing active session returns typed conflict and creates no second row.
- [x] UI navigates only after commit; write/transaction failure remains on Setup.
- [x] Double tap is coalesced/serialized and cannot create two sessions.
- [x] Draft is not a second durable truth and is not auto-written to Settings.
- [x] Route/screen contain no SQL, reward, timestamp or navigation-success guess.

### 6.9. Automated test checklist

- [x] Domain matrix: min/max/step/mode/tag/overflow/timestamp.
- [x] Use-case tests: success, active conflict, read/write/transaction/calendar failure, duplicate tap.
- [x] Real SQLite integration: exact row, unique active backstop, rollback/no partial row.
- [x] Controller/route tests: busy, preserve draft, no pre-commit navigation, warning isolation.
- [ ] Component tests: duration bounds, chip semantics, large-text layout contract.
- [x] Existing onboarding Start and common component regressions pass.

### 6.10. Manual UI test guide

- **Mục tiêu:** chứng minh Setup thật và commit-before-navigation.
- **Preconditions/fixture:** fresh installed database hoặc approved finite `standard_start_*` dev fixture;
  không có active session; network off được phép.
- **Reset/reproduce:** dùng confirmed local-data reset/dev fixture documented cho exact candidate;
  không xóa DB thủ công giữa các assertion.
- **Record:** platform, physical/simulator, OS, app/build identity và exact Git SHA.
- **Steps/expected:** (1) Home→Setup: thấy `25/approved mode/tag`; (2) thử min/max/step và VoiceOver/
  TalkBack labels; (3) bật offline rồi Start: Running chỉ xuất hiện sau committed success; (4) inject
  one-shot write failure: vẫn ở Setup, draft giữ nguyên, Retry commit một row; (5) simulate double tap:
  một row; (6) relaunch: committed active session được nhận diện, không tạo row mới.
- **Durable facts:** chụp sanitized session row/probe trước/sau; active count `0→1`; exact config/time.
- **Accessibility:** largest practical text size, screen reader, no color-only selected state; Reduce
  Motion không đổi flow.
- **Pass/fail evidence:** checklist per step, screenshots Setup/error/Running, short video commit gate,
  sanitized log/probe. Owner quick smoke ghi riêng; automated evidence không phải device pass; formal
  tester để `DEFERRED` nếu chưa chạy.
- **Cleanup:** cancel/reset bằng approved flow; tắt fixture/failure injection.

### 6.11. Error, recovery, race, relaunch và accessibility cases

- Offline không block local Start; database unavailable/corrupt không được navigate hoặc write giả.
- Retry sau unknown UI error phải đọc durable active truth trước khi insert mới.
- Concurrent Start/foreground reconciliation dùng coordinator + unique index.
- Relaunch sau commit-before-navigation phải route theo committed active session.
- Busy/disabled/selected/error được truyền bằng text/semantics; large text scroll/reflow; no motion-only.

### 6.12. Evidence, Definition of Ready và Definition of Done

**Evidence cần lưu:** exact SHA, diff/scope audit, automated result, SQLite before/after, owner-visible
captures, manual matrix, limitation/deferred note.

**DoR:** confirmations/gates approved; inputs/error codes/view model/file ownership/test fixture rõ;
no schema/dependency/native drift. **DoD:** all acceptance/tests pass, output reviewable, common
consumer regressions pass, report exact SHA, owner accepts; no checkbox tự tick từ planning này.

## 7. US-06-02 — Relax Running, timestamp countdown, background/relaunch recovery và cancel

### 7.1. Identity, priority, value và output

- **Priority:** `P0` — establishes trustworthy running/cancel lifecycle before Strict/reward.
- **User value:** Relax timer continues correctly when app is backgrounded/killed and cancel is safe.
- **Tangible deliverable:** committed Relax session displays timestamp countdown, recovers after
  foreground/relaunch, and cancel confirmation leads to committed cancelled Result.

### 7.2. Dependency, Start gate và Exit gate

- Depends on accepted `US-06-01`; order `2`.
- **Start gate:** `US0600-CONFIRM-04/05` approved; production Start projection exists.
- **Exit gate:** Relax Running/cancel/relaunch evidence on exact SHA; owner acceptance before Strict.

### 7.3. Scope, gap và boundary

**In scope:** generic remaining projection from `endsAt-now`; visible-only ticks; read active Standard
Focus; Relax foreground/startup reconcile; cancel transaction/race; cancelled Result read; recovery.

**Out of scope:** Strict background evidence, completed reward implementation, notification provider,
Break, pause/resume. Countdown reaching zero requests reconcile but completion/reward is owned by
`US-06-04`; until then a controlled `deadline_pending` projection must not invent completed truth.

Current Standard branch is fake/fixed countdown and local cancel. Reuse trial controller architecture,
not its trial-specific invariant or route fallback.

### 7.4. User flow/navigation

Committed Relax row → Running projection → visible timestamp countdown. Background stops tick; Relax
truth remains running. Foreground/relaunch passes reconciliation barrier and re-anchors from timestamp.
Back/close opens confirmation. Dismiss continues; confirm sends cancel; only committed cancel replaces
Result. Cancel failure stays Running/recovery; terminal race reads winner.

### 7.5. Responsibilities

- **Domain:** remaining-time projection; cancel eligibility; Relax reconcile decision.
- **Application:** standard running/result query, controller, cancel use case; coordinator/single-flight.
- **Infrastructure:** generic session read/conditional terminal update; no schema change.
- **Presentation:** reusable countdown, Pet working, mode/tag context, confirmation, recovery; no timer math.

### 7.6. Durable facts và side effects

Display ticks write nothing. Safe Relax background/foreground does not fail. Successful cancel changes
`running→cancelled`, sets `resolved_at`, keeps reward `0/0/null`. After commit only: notification
cleanup intention, analytics cancellation, Pet base refresh; failures best-effort.

### 7.7. UI reuse/targets/line guardrail

Reuse common shell/header/Pet/status/notice/button/dialog. Create generic `CountdownDisplay` and
migrate trial consumer with regression test. Split current focus file into
`focus-running-screen.tsx` `180–230`; controller/hook `150–220`; route branch `≤80`; countdown
`70–100`. No UI file over `300`.

### 7.8. Acceptance criteria

- [ ] Remaining is `max(0, endsAt-now)` and display tick never writes database.
- [ ] Tick stops background/unmount and re-anchors foreground; no accumulated interval truth.
- [ ] Relax background/lock/relaunch never resolves `failed`.
- [ ] Startup/foreground barrier prevents stale Running/Result display.
- [ ] Cancel confirmation dismisses safely; confirm navigates only after cancel commit.
- [ ] Cancelled session has no reward/Break CTA and Result reads committed facts.
- [ ] Completion-vs-cancel winner is terminal and later command cannot overwrite it.
- [ ] DB/read failure renders recovery without guessing session/Pet state.

### 7.9. Automated tests

- [ ] Remaining boundary and ceil-display tests with fake clock.
- [ ] Controller visible/background/unmount/no-restart/generation tests.
- [ ] Relax foreground/relaunch before/at/after deadline projection tests.
- [ ] Cancel success/already-cancelled/deadline/terminal/read/write/rollback/race tests.
- [ ] Real SQLite cancel-first and terminal-first integration.
- [ ] Countdown accessibility and onboarding countdown migration regressions.

### 7.10. Manual UI test guide

- **Mục tiêu:** Relax countdown/recovery/cancel from durable truth.
- **Preconditions/fixture:** committed short review-duration Relax fixture created through production
  Start path; normal Product duration remains valid; record SHA/device/OS/build.
- **Reset:** confirmed reset or finite fixture reset; never edit timestamp row manually for pass claim.
- **Steps/expected:** (1) observe decrement and Pet Working; (2) background/lock, wait, foreground:
  remaining jumps from timestamps, still Relax; (3) kill/relaunch before deadline: same session; (4)
  open cancel, dismiss: still running; (5) confirm cancel: committed cancelled Result, no reward/Break;
  (6) inject cancel write failure/offline: no false Result, retry works; (7) race cancel/deadline fixture:
  display committed winner only.
- **Durable/visible checks:** session ID stable, status/resolved/reward fields; screenshot/video/log.
- **Accessibility:** screen reader countdown/status/action, large text, Reduce Motion/static Pet,
  non-color cancelled status.
- **Record/cleanup:** pass/fail each case; automated vs owner quick smoke vs formal tester separated;
  formal remains `DEFERRED` if absent; reset/cancel and disable fixtures.

### 7.11. Error/retry/background/race/a11y

Cover offline, DB unavailable, corrupt timestamps, cancel duplicate, completion/cancel race, stale
route, background/unmount, process kill and system clock limitation. Recovery never becomes a fifth
session status. Countdown announcement must avoid per-second screen-reader spam.

### 7.12. Evidence, DoR, DoD

Evidence: exact SHA, automated matrix, real SQLite facts, foreground/relaunch video, cancelled Result,
deferred labels. **DoR:** Story 01 accepted and lifecycle ownership approved. **DoD:** gates pass,
trial regressions pass, no business rule in UI, exact-SHA report and owner acceptance.

## 8. US-06-03 — Strict Mode Lite, grace evidence, foreground/relaunch precedence và failed outcome

### 8.1. Identity, priority, value và output

- **Priority:** `P0` — Strict is locked EPIC-06 outcome with high recovery/race risk.
- **User value:** user gets predictable ten-second grace without false punishment.
- **Tangible deliverable:** Strict Running persists background evidence, reconciles exact boundaries,
  and shows committed failed Result/Pet Bugged only when evidence proves violation.

### 8.2. Dependency/gates

- Depends on accepted `US-06-02`; order `3`.
- **Start gate:** `US0600-CONFIRM-05` approved; shared active-session reconciliation boundary stable.
- **Exit gate:** exact grace/precedence/kill tests plus owner-visible Strict pass before completion Story.

### 8.3. Scope, gap, boundary

In scope: background command/evidence, safe foreground clear, `violationAt=backgroundedAt+10s`,
`violationAt<=endsAt` failure precedence, relaunch, missing-evidence policy, failed Result, fresh Pet
Bugged after commit. Out: native blocking, pause, penalty, reward, notification provider.

Current repository supports `backgrounded_at`, but lifecycle composition only publishes visibility
and reconciles trial completion; no Standard Strict command exists. Prototype “Strict fail” button
is review-only and must not survive as production authority.

### 8.4. Flow/navigation

Strict Running → app background captures timestamp before queue → persist episode. Foreground/startup
reconcile: proven violation wins at equality; otherwise deadline completion is delegated to Story 04;
safe return before both clears evidence atomically. Failed commit rebuilds Result/Pet then navigates;
missing evidence after kill never guesses violation.

### 8.5. Responsibilities

- **Domain:** pure precedence/validation decision with captured `now`.
- **Application:** record-background use case; reconcile active Standard Focus; single-flight;
  committed failed fresh event; typed recovery.
- **Infrastructure:** reuse conditional `backgrounded_at` update and terminal update; add repository
  clear operation only if port lacks it, using existing column/transaction, no migration.
- **Presentation:** mode/grace explanation, failed Result, Pet projection; no background arithmetic.

### 8.6. Durable facts/side effects

Before background, `backgrounded_at=null`; successful Strict background persists one episode. Safe
return clears it in transaction. Proven violation commits `failed/resolved_at`, reward remains zero.
Bugged/notification cleanup/analytics happen after commit and may fail without changing truth.

### 8.7. UI reuse/targets/line estimate

Reuse Running screen, notice, committed Result family, Pet visual. No new “Strict screen”. Expected
domain decision `100–180`, use cases/controllers each `150–240`, lifecycle adapter extension
`100–180`, Result variant child `≤120`; route remains `≤80`; UI hard max `300`.

### 8.8. Acceptance criteria

- [ ] Strict background timestamp is captured at lifecycle boundary and persisted serialized.
- [ ] Return before grace/deadline keeps running and atomically clears episode.
- [ ] `violationAt == endsAt` commits `failed`; `endsAt < violationAt` permits completion path.
- [ ] Strict fails only with persisted evidence; missing background evidence never guesses violation.
- [ ] Relaunch uses same precedence and terminal persisted state always wins.
- [ ] Failed has no reward/Break CTA; Pet Bugged is fresh, non-blocking and no-replay.
- [ ] Lifecycle persistence failure enters safe recovery; does not silently continue unreliable Strict.
- [ ] Relax/trial/Break semantics remain unchanged.

### 8.9. Automated tests

- [ ] Domain table: before/equal/after grace and deadline; invalid timestamps/overflow.
- [ ] Background write and clear transaction success/failure/duplicate episodes.
- [ ] Foreground/startup single-flight and command ordering tests.
- [ ] Real SQLite Strict failure, safe return, kill/missing evidence, terminal race.
- [ ] Pet fresh Bugged/dedupe/no-replay and failed Result gating.
- [ ] Relax/trial/Break lifecycle regressions.

### 8.10. Manual UI test guide

- **Mục tiêu:** prove Strict grace and evidence-based recovery.
- **Preconditions/fixture:** production-created Strict session plus finite accelerated boundary fixture;
  exact SHA/device/OS/build recorded.
- **Reset:** approved reset/fixture; clear only through fixture contract, not ad-hoc SQL.
- **Steps/expected:** (1) background <10s then return before deadline: Running, evidence cleared;
  (2) background >10s with violation before/equal deadline: committed failed, Bugged once, no reward;
  (3) deadline before violation: committed completed path when Story 04 available; (4) kill with
  persisted evidence: relaunch same decision; (5) kill fixture missing evidence: no false fail;
  (6) inject background-write failure: recovery, no invented status; (7) reopen failed Result: no
  Bugged replay.
- **Checks:** sanitized session facts before/after, screen capture with timestamp overlay/log, Result
  copy/CTA, Pet state. Test offline too.
- **Accessibility:** screen reader states/recovery, large text, Reduce Motion still Bugged, no color-only.
- **Evidence/cleanup:** per-step pass/fail; owner quick smoke and formal tester separated; formal
  `DEFERRED` if not run; terminate/reset fixture safely.

### 8.11. Error/retry/background/race/a11y

Include background write failure, rapid active/background oscillation, queued cancel, foreground and
startup concurrent reconcile, completion precedence, missing evidence, clock change limitation,
database unavailable and stale lifecycle callbacks. No guilt-heavy copy or motion-only failure.

### 8.12. Evidence, DoR, DoD

Evidence: boundary table, SQLite facts, exact-SHA video, fresh/no-replay Pet, recovery failure proof.
**DoR:** Relax lifecycle accepted and ownership confirmation closed. **DoD:** all exact boundaries and
regressions pass, report/owner acceptance recorded, no Strict logic in screen/lifecycle adapter.

## 9. US-06-04 — Exactly-once completion, reward transaction và committed Result variants

### 9.1. Identity, priority, value và output

- **Priority:** `P0` — durable outcome/reward is core value and highest integrity boundary.
- **User value:** completed effort becomes correct XP/Coin once; reopened Result never changes it.
- **Tangible deliverable:** deadline/foreground/startup resolves Standard Focus atomically and Result
  renders committed completed/failed/cancelled facts with correct actions.

### 9.2. Dependency/gates

- Depends on accepted `US-06-02` and `US-06-03`; order `4`.
- **Start gate:** confirmations `02/05/06` approved; race/transaction fixtures designed.
- **Exit gate:** real SQLite atomicity/idempotency/rollback/reopen plus owner-visible three Results.

### 9.3. Scope, gap, boundary

In scope: generic reconcile completion, reward `XP=minutes`, `Coin=floor(minutes/5)`, automatic
session/receipt/profile atomic transaction, committed Result query/projection, fresh Celebrate,
failed/cancelled no reward, retry/race/reopen. Out: Break creation/cadence, Shop UI, History UI,
manual claim, reward multiplier, provider analytics.

Prototype currently calculates reward in reducer and Result reads local values. Trial completion is
production but fixed `5/1` and trial-specific. Reuse transaction pattern/repositories/Pet contract;
do not generalize by weakening trial/standard invariants.

### 9.4. Flow/navigation

Countdown zero/foreground/startup only requests reconcile. Transaction reads running row, applies
Strict precedence, then either keeps running, fails, or completes with receipt/profile. After commit,
result query re-reads session+receipt+profile; route shows matching variant. Reopen reads only; Retry
from failed/cancelled opens fresh Setup. Completed returns Home; Break CTA behavior follows
`US0600-CONFIRM-06` and never inserts Break in EPIC-06.

### 9.5. Responsibilities

- **Domain:** terminal decision and standard reward formula/invariants.
- **Application:** resolve/reconcile use case, committed result loader/controller, fresh event identity.
- **Infrastructure:** existing conditional transition, unique receipt, progression update in one
  transaction; read committed result; rollback on any failure.
- **Presentation:** typed Result view model, common RewardSummary/Pet/buttons; no reward math/claim.

### 9.6. Durable facts/side effects

Completed after transaction: session `completed`, exact reward fields/claimed time; one
`reward_transactions` row reason `focus_completed`; profile increment exact once. Failed/cancelled:
no receipt/profile change. Result open has zero mutation. After commit only: Pet terminal feedback,
notification cleanup, analytics reward/session hooks, audio/haptic; best-effort/no rollback.

### 9.7. UI reuse/targets/line estimate

Reuse `RewardSummary`, `PetVisualStatus`, shell/header/panel/button/status. Replace prototype result
type with application view model. Expected `focus-result-screen.tsx` `180–230`, optional
`focus-result-actions.tsx` `70–110`, controller `150–220`, result loader `160–240`, route `≤80`.
No copy of reward card/stat/Pet; split review ≥240.

### 9.8. Acceptance criteria

- [ ] Completion derives from persisted timestamps, never UI tick/button.
- [ ] Completed transition + receipt + profile increment + session reward fields commit atomically.
- [ ] Reward equals configured minutes and floor(minutes/5), never overtime.
- [ ] Retry/race/relaunch yields at most one receipt/increment.
- [ ] Any mid-transaction failure rolls back all writes and is safely retryable.
- [ ] Result validates session/receipt/profile consistency and renders recovery on mismatch.
- [ ] Reopen/hydrate does not grant reward or replay Celebrate/Bugged.
- [ ] Failed/cancelled have zero reward and no Break entry.
- [ ] Result navigation/actions follow approved EPIC-06/07 boundary.

### 9.9. Automated tests

- [ ] Reward table all valid durations `15..120` step `5`.
- [ ] Reconcile outcomes Relax/Strict/running/completed/failed/terminal.
- [ ] Transaction order, receipt/profile failure rollback, duplicate/retry/race.
- [ ] Real SQLite exactly-once across close/reopen/relaunch and corrupt consistency reads.
- [ ] Three Result variant CTA/copy/a11y tests and no claim action.
- [ ] Pet fresh complete/fail/no-replay; trial completion regressions.

### 9.10. Manual UI test guide

- **Mục tiêu:** prove durable outcome/reward and Result truth.
- **Preconditions/fixture:** profile totals recorded; production Standard sessions using finite
  accelerated completion/failure/cancel fixtures; exact SHA/device/OS/build.
- **Reset:** approved local reset once; each scenario creates a fresh session through production path.
- **Steps/expected:** (1) complete 15/25/120 samples: Result exact XP/Coin and profile delta; (2)
  force concurrent deadline/foreground: one reward; (3) inject receipt/profile failure: no partial
  session/reward/profile, Retry once; (4) complete then reopen/relaunch Result: same facts, no extra
  reward/Celebrate; (5) failed and cancelled: zero/no Break; (6) offline throughout; (7) corrupt-read
  fixture: recovery, no guessed reward.
- **Durable checks:** session row, receipt count/reason/delta, profile before/after, result identity.
- **Accessibility:** grouped reward summary, non-color terminal labels, largest text, screen reader,
  Reduce Motion, CTA usable during/without animation.
- **Evidence/cleanup:** screenshots all variants, race/failure video/log, sanitized before/after,
  pass/fail; distinguish automated/owner/formal and keep formal `DEFERRED` if absent; reset fixtures.

### 9.11. Error/retry/background/race/a11y

Cover notification/analytics/Pet failure after commit, result read failure, mismatched receipt,
receipt unique conflict, profile write failure, cancel/complete/background races, terminal stale
route, clock/timezone limitation and offline. Side effects never decide result or reward.

### 9.12. Evidence, DoR, DoD

Evidence: exact transaction facts, reward matrix, rollback/race/reopen proof, three Result captures,
scope audit. **DoR:** prior lifecycle accepted and Result/Break boundary approved. **DoD:** atomic
integrity/regressions/owner acceptance complete; no schema/dependency/native change.

## 10. US-06-05 — Notification/analytics best-effort hooks, accessibility, integrity regression và Epic exit

### 10.1. Identity, priority, value và output

- **Priority:** `P1` — required Epic behavior/evidence but must remain outside core truth.
- **User value:** completion reminder and accessible/reliable flow without sacrificing session truth.
- **Tangible deliverable:** idempotent notification behavior (after technical approval), typed local
  analytics hooks, full accessibility/integrity regression, device guide and EPIC-06 exit candidate.

### 10.2. Dependency/gates

- Depends on accepted `US-06-01`→`04`; order `5`.
- **Start gate:** `US0600-CONFIRM-07/08/10` approved; notification dependency/native compatibility
  explicitly authorized or an authority update re-scopes the exit gate.
- **Exit gate:** all Epic checklist evidence, exact SHA report, owner acceptance; formal tester status
  remains factual, never inferred.

### 10.3. Scope, gap, boundary

In scope: typed notification operation port/adapter, ensure/cancel idempotency, permission denied/
schedule failure isolation, Standard Focus typed local analytics recorder/hook, opt-out, event
dedupe, accessibility/large-text/Reduce Motion, integrity/static/scope/device guide and exit report.

Out: PostHog/provider delivery, Settings permission UI, remote notification, Break notification,
Feedback/Store Review, EPIC-07→12 UI, unapproved package/native config.

Current analytics queue/allowlist is reusable; recorder is onboarding-only. Notification production
adapter is absent. Prototype controls remain review-only and must not be reachable as Standard truth.

### 10.4. User flow/navigation

Start commit → best-effort notification ensure and `focus_session_started`. Terminal commit →
best-effort cancel/cleanup and outcome event; completed also `reward_granted` from committed receipt.
Denial/failure may show an actionable non-blocking notice only when useful; core navigation/result
continues. Notification tap/repeat enters reconciliation/read path, never completes/grants directly.

### 10.5. Responsibilities

- **Domain:** none for provider/permission; analytics property vocabulary may use pure validation.
- **Application:** notification operation contract; typed Standard analytics recorder with stable IDs;
  post-commit orchestration; no arbitrary screen capture API.
- **Infrastructure:** platform adapter after approved dependency/config; reuse bounded SQLite queue.
- **Presentation:** accessible notices/status, final common component migration and regression; no SDK.

### 10.6. Durable facts/side effects

Notification is not durable timer/reward truth. Analytics rows are side-effect queue facts and may be
absent on failure/opt-out. Stable event IDs derive from committed session/receipt identity. No
notification/analytics call inside core transaction; failure cannot rollback/reclassify session.

### 10.7. UI reuse/targets/line estimate

Reuse/migrate every matrix component; no duplicate status/reward/timer UI. Expected notice change
`≤60`, notification/analytics application modules `120–220` each, platform adapter `120–220`, exit
test harness/fixture files scoped; Focus UI remains below `240–260` review threshold and `300` hard max.

### 10.8. Acceptance criteria

- [ ] Notification ensure/cancel is idempotent per session/operation.
- [ ] Permission denial/schedule/cancel failure never changes Start/terminal/reward truth.
- [ ] Notification tap/repeat routes through reconciliation/read, not mutation shortcut.
- [ ] Analytics emits only approved Standard events after corresponding commit, stable/deduped.
- [ ] Opt-out/failure cannot block core flow; no provider/network implementation.
- [ ] Screens pass screen reader, large text, Reduce Motion, touch target and non-color-only audit.
- [ ] Prototype authority is removed from production Standard routes while later-Epic prototype remains isolated.
- [ ] Offline/error/retry/race/integrity suites and scope/static gates pass.
- [ ] Exact device/OS/SHA evidence status is honest; formal tester not fabricated.

### 10.9. Automated tests

- [ ] Notification adapter fake: ensure/cancel duplicate, denial, throw, stale/tap behavior.
- [ ] Analytics event names/properties/IDs/opt-out/dedupe/queue failure and ordering.
- [ ] Real SQLite journey Start→Relax/Strict→complete/fail/cancel→reopen with exact facts/events.
- [ ] Static gates: no prototype authority, no deep Presentation imports, UI line count, migration immutable.
- [ ] Accessibility component/screen semantic snapshots and Reduced Motion regressions.
- [ ] Root typecheck/lint/tests/boundaries/repository hygiene and `git diff --check`.

### 10.10. Manual UI test guide

- **Mục tiêu:** final owner-visible EPIC-06 journey and side-effect/a11y isolation.
- **Preconditions/fixture:** candidate Development Build only after approved notification technical
  gate; fresh permission states, finite failure fixtures, local database; record exact SHA/platform/
  device/OS/build.
- **Reset:** documented app-data/permission reset per OS plus confirmed local reset; never claim a
  simulator automation as physical-device pass.
- **Steps/expected:** (1) Relax complete in foreground/background and receive at most one local
  completion notification when allowed; (2) deny permission and repeat: session/reward still exact;
  (3) inject schedule/cancel failure: core flow succeeds; (4) tap stale/repeated notification: same
  committed Result/no extra reward; (5) Strict fail/cancel: cleanup and correct no-reward Result;
  (6) analytics enabled/disabled/failure fixture: correct local rows or skip, same UI truth; (7)
  offline/relaunch/race smoke; (8) screen reader, largest text, Reduce Motion, portrait/supported
  device sizes across Setup/Running/three Results/recovery.
- **Checks/evidence:** sanitized session/receipt/profile/event/notification operation facts;
  screenshots, videos, permission state, logs, per-case pass/fail.
- **Evidence classes:** automated evidence listed separately; owner quick smoke may cover primary
  flow; formal tester requires full signed record and otherwise stays `DEFERRED`.
- **Cleanup:** cancel notification, reset permission/fixture/config, leave no active session.

### 10.11. Error/retry/background/race/a11y

Cover permission denied/undetermined, adapter unavailable, duplicate schedule/cancel/tap, killed after
commit before side effect, queue full/TTL/opt-out, concurrent lifecycle/user commands, offline,
corrupt DB/recovery, reduced motion and large text. Notification/analytics loss is allowed; core fact
loss or duplicate reward is not.

### 10.12. Evidence, DoR, DoD

Evidence: exact SHA, full command outputs, component reuse/line audit, notification/analytics facts,
accessibility/device captures, formal tester state, exit/scope report. **DoR:** all core Stories
accepted and technical gate approved. **DoD:** Epic exit checklist pass, owner accepts exact candidate,
future scope untouched; formal tester remains deferred if not actually executed.

## 11. Cross-Story durable truth and ownership map

| Action/event | Durable fact before | Owner command | Durable fact after | Post-commit only |
|---|---|---|---|---|
| Open Setup/change draft | no session mutation | Presentation draft | unchanged | optional `focus_setup_viewed` after approved hook |
| Start | no active session | `StartStandardFocus` | one valid running Standard Focus | notification ensure, started analytics, haptic |
| Display tick | running row | projection only | unchanged | none |
| Strict background | running Strict, no active episode | `RecordSessionBackgrounded` | persisted `backgrounded_at` | none/diagnostic |
| Safe foreground | running with episode | `ReconcileActiveSession` | running, episode cleared | notification ensure |
| Cancel | running | `CancelStandardFocus` | cancelled/no reward | cleanup, cancelled analytics, Pet refresh |
| Strict violation | running + evidence | `ReconcileActiveSession` | failed/no reward | cleanup, failed analytics, fresh Bugged |
| Deadline complete | running, no winning violation | `ReconcileActiveSession` | completed + receipt + profile delta atomically | cleanup, completion/reward analytics, fresh Celebrate |
| Open/reopen Result | terminal committed facts | result query | unchanged | no replay/no grant |

## 12. Owner confirmations — `APPROVED` ngày 2026-09-03

### US0600-CONFIRM-01 — Story decomposition và order

- **Vấn đề:** có giữ `01 Start → 02 Relax → 03 Strict → 04 Reward/Result → 05 side effects/exit`?
- **Options:** A giữ sequence; B gộp Relax+Strict; C đưa reward trước Strict.
- **Trade-off:** A tạo vertical output và cô lập recovery risk; B ít Story nhưng slice lớn; C cho
  completed demo sớm hơn nhưng Result/reconcile phải sửa lại khi Strict precedence xuất hiện.
- **Recommendation:** A. **Nếu chưa duyệt:** không mở implementation `US-06-01`.
- [x] Owner approved option: A — 2026-09-03.

### US0600-CONFIRM-02 — Schema/no-schema decision

- **Vấn đề:** audit thấy migration `001` đã đủ Standard/Strict/reward.
- **Options:** A `NO SCHEMA CHANGE`; B mở migration mới khi chỉ có code gap; C yêu cầu spike chứng minh
  một field/invariant cụ thể trước decision.
- **Trade-off:** A nhỏ nhất và khớp approved data-needs map; B tăng migration risk không có user value;
  C phù hợp chỉ khi implementation phát hiện contradiction thật.
- **Recommendation:** A; tự động chuyển sang C nếu có evidence gap, tuyệt đối không chọn B silently.
- **Nếu chưa duyệt:** mọi Story bị chặn khỏi schema/migration mutation.
- [x] Owner approved option: A — 2026-09-03.

### US0600-CONFIRM-03 — Prototype retirement boundary

- **Vấn đề:** Standard routes đang fallback prototype, trial production đã tách.
- **Options:** A retire prototype theo từng production surface, giữ later-Epic prototype cô lập; B
  xóa toàn bộ prototype một lượt; C giữ production fallback tới Epic exit.
- **Trade-off:** A giảm rủi ro và không phá Break/secondary review; B gây scope creep; C dễ lẫn fake truth.
- **Recommendation:** A. **Nếu chưa duyệt:** không đổi route authority/prototype files.
- [x] Owner approved option: A — 2026-09-03.

### US0600-CONFIRM-04 — Common component reuse/migration plan

- **Vấn đề:** Focus file đã 241 dòng; trial và Standard cần shared countdown/primitives.
- **Options:** A matrix/split ở mục 4; B giữ mọi component feature-local; C tạo design system lớn.
- **Trade-off:** A reuse có consumer thật và giữ file nhỏ; B duplicate; C speculative abstraction.
- **Recommendation:** A. **Nếu chưa duyệt:** không tạo/đổi common API.
- [x] Owner approved option: A — 2026-09-03.

### US0600-CONFIRM-05 — Relax/Strict/cancel/relaunch ownership

- **Vấn đề:** startup/foreground hiện trial-scoped, Standard cần một active-session authority.
- **Options:** A mở rộng thành generic reconciliation coordinator/use case; B tạo song song trial và
  Standard reconcilers; C để route tự reconcile.
- **Trade-off:** A một command boundary và deterministic race; B có nguy cơ hai writer; C vi phạm
  route/layer boundary.
- **Recommendation:** A, giữ trial invariant bằng strategy/typed branch chứ không copy writer.
- **Nếu chưa duyệt:** `US-06-02/03/04` không bắt đầu.
- [x] Owner approved option: A — 2026-09-03.

### US0600-CONFIRM-06 — Result/Break boundary

- **Vấn đề:** approved final UX có Break/Home, nhưng EPIC-07 sở hữu Break creation/cadence.
- **Options:** A EPIC-06 production Result chỉ active Home, giữ typed extension slot và EPIC-07 mới
  hiện Start Break CTA; B hiện disabled “sắp có”; C hiện CTA nhưng tạo prototype Break.
- **Trade-off:** A không lừa user/không tạo Break; B gây dead-end/noise; C trộn fake production truth.
- **Recommendation:** A. Failed/cancelled luôn không có Break. **Nếu chưa duyệt:** Result exit actions
  chưa thể khóa.
- [x] Owner approved option: A — 2026-09-03.

### US0600-CONFIRM-07 — Notification/analytics best-effort boundary

- **Vấn đề:** side effects không được ảnh hưởng core truth; provider delivery thuộc EPIC-11.
- **Options:** A local notification adapter + local typed analytics queue only; B thêm PostHog; C
  đưa side effects vào core transaction.
- **Trade-off:** A đúng authority/offline; B/C scope/risk cao và vi phạm plan.
- **Recommendation:** A. **Nếu chưa duyệt:** chỉ triển khai core Stories, không side-effect hook.
- [x] Owner approved option: A — 2026-09-03.

### US0600-CONFIRM-08 — Fixture, quick smoke và formal tester strategy

- **Vấn đề:** cần accelerated/error/race evidence nhưng không được gọi automation là device pass.
- **Options:** A finite dev fixtures qua production paths + owner quick smoke + formal tester deferred;
  B chờ 15–120 phút thật cho mọi test; C mock reducer làm evidence.
- **Trade-off:** A deterministic và trung thực; B chậm/khó race; C không chứng minh production truth.
- **Recommendation:** A, mọi evidence ghi SHA/device/OS/class. **Nếu chưa duyệt:** fixture/device guide
  chưa được tạo.
- [x] Owner approved option: A — 2026-09-03.

### US0600-CONFIRM-09 — Setup initial work-tag/default behavior

- **Vấn đề:** Product khóa four-tag allowlist nhưng không ghi explicit default tag; approved prototype
  đang chọn `coding`.
- **Options:** A giữ `coding` selected theo approved prototype; B bắt user chọn tag trước Start; C
  thêm “không tag” cho Standard.
- **Trade-off:** A ít friction và khớp approved visual; B rõ intent nhưng đổi approved flow; C vi phạm
  Standard schema/Product tag requirement.
- **Recommendation:** A; duration `25`, mode `relax`, tag `coding`, draft không auto-persist.
- **Nếu chưa duyệt:** Setup validation/initial view model chưa khóa.
- [x] Owner approved option: A — 2026-09-03.

### US0600-CONFIRM-10 — Notification dependency/native gate

- **Vấn đề:** repo chưa có production session notification adapter và chưa khai báo notification
  package; task này cấm tự thêm dependency/native config.
- **Options:** A owner duyệt một implementation gate riêng để chọn Expo-compatible package/config sau
  compatibility check; B defer actual notification sang EPIC-10 và sửa authority/exit scope; C dùng
  no-op và claim notification complete.
- **Trade-off:** A đáp ứng EPIC-06 nhưng cần explicit dependency/native authorization; B tránh change
  nhưng mâu thuẫn current EPIC-06 in-scope nếu không sửa plan; C không trung thực.
- **Recommendation:** A; approval này chỉ cho phép lập technical plan tiếp theo, không cài package
  trong planning task hiện tại. **Nếu chưa duyệt:** `US-06-05` notification exit bị chặn, core Stories
  vẫn có thể triển khai sau các confirmation khác.
- [x] Owner approved option: A — 2026-09-03.

## 13. Epic-level checklists

### 13.1. Baseline/readiness checklist

- [x] Branch/HEAD/upstream/working tree đã kiểm tra.
- [x] Completion commit `658b708…` được xác minh.
- [x] EPIC-01→05 owner-accepted và EPIC-06 `NOT_STARTED` được xác minh.
- [x] Formal tester deferred và `OPEN-006/009` được giữ nguyên.
- [x] Owner duyệt toàn bộ confirmation theo Option A ngày 2026-09-03.
- [x] Owner-review SHA cho planning `US-06-01` được ghi là `aa7f561…`.

### 13.2. Code/data/UI audit checklist

- [x] Audit production/prototype route Setup/Running/Result.
- [x] Audit fake state/hard-coded countdown/reward/dev fixture.
- [x] Audit command/projection/repository/query/transaction reuse.
- [x] Audit Start/cancel/reconcile/complete/reward/Strict/notification/analytics gaps.
- [x] Audit schema và kết luận proposed `NO SCHEMA CHANGE`.
- [x] Audit component reuse/duplication/responsibility/line count.
- [x] Owner confirms audit decisions ngày 2026-09-03.

### 13.3. Owner confirmation checklist

- [x] `US0600-CONFIRM-01` Story order — Option A.
- [x] `US0600-CONFIRM-02` no-schema — Option A.
- [x] `US0600-CONFIRM-03` prototype retirement — Option A.
- [x] `US0600-CONFIRM-04` common reuse — Option A.
- [x] `US0600-CONFIRM-05` lifecycle ownership — Option A.
- [x] `US0600-CONFIRM-06` Result/Break — Option A.
- [x] `US0600-CONFIRM-07` side effects — Option A.
- [x] `US0600-CONFIRM-08` evidence strategy — Option A.
- [x] `US0600-CONFIRM-09` Setup defaults — Option A.
- [x] `US0600-CONFIRM-10` notification technical gate — Option A; package/config vẫn cần plan riêng.

### 13.4. Per-Story acceptance checklist

- [x] `US-06-01` accepted on exact SHA `68f2c54d3630817385b320622476c55c67caea13`.
- [x] `US-06-02` accepted on exact SHA `9a8e3d87d44612b7bd9aa8bf9e592099300d9e2e`.
- [x] `US-06-03` quick-UI accepted at exact SHA `14ef3413742df4159aa3a7e537d2fd02667cb203`.
- [ ] `US-06-04` accepted on exact SHA.
- [ ] `US-06-05` accepted on exact SHA.

### 13.5. Story Definition of Ready

- [ ] Previous Story exit/owner acceptance complete.
- [ ] Relevant owner confirmations approved.
- [ ] User output, durable facts, errors/races and side-effect order explicit.
- [ ] Target ownership/API/file estimates reviewed; UI split plan below 300 lines.
- [ ] Finite fixture and evidence class defined.
- [ ] No unapproved schema/dependency/native change.

### 13.6. Story Definition of Done

- [ ] Owner-visible output works through production path.
- [ ] Acceptance and automated checklist pass.
- [ ] Manual guide executed to the factual evidence level recorded.
- [ ] Error/offline/background/relaunch/race/a11y cases have evidence.
- [ ] Common old/new consumers have regression coverage.
- [ ] Scope/diff/line/import/migration/dependency audit pass.
- [ ] Exact-SHA report and owner acceptance recorded before next Story.

### 13.7. Common component reuse checklist

- [ ] No duplicate Card/Chip/Input/Button/Popup/Pet/timer/status/reward UI.
- [ ] Common components remain presentational with typed props/callbacks.
- [ ] Trial consumer migrated/regression-tested for generic countdown.
- [ ] Focus feature split reviewed at 240–260 lines; no UI file >300.
- [ ] No deep import across Presentation feature boundaries.
- [ ] Feature-local component records a promotion trigger when not common.

### 13.8. Accessibility checklist

- [ ] Setup controls have role/state/label and ≥44pt target.
- [ ] Countdown announcement cadence avoids per-second screen-reader noise.
- [ ] Running/Result/recovery meaning is not color/sprite/motion/audio-only.
- [ ] Largest supported text reflows/scrolls without hiding CTA.
- [ ] Reduce Motion uses static Pet poses and preserves outcome.
- [ ] Modal focus/back/busy semantics and retry actions work.

### 13.9. Manual evidence checklist

- [ ] Exact SHA, platform, device/simulator, OS and build recorded.
- [ ] Preconditions, fixture, safe reset, steps, expected and cleanup recorded.
- [ ] Durable before/after facts and screenshots/video/log attached.
- [ ] Offline/failure/background/foreground/relaunch/race cases recorded.
- [ ] Screen reader/large text/Reduce Motion recorded.
- [ ] Automated, owner quick smoke and formal tester evidence separated.
- [ ] Unexecuted formal tester fields remain `DEFERRED`.

### 13.10. EPIC-06 exit checklist

- [ ] Valid Standard Setup/Start commit-before-navigation.
- [ ] Relax timestamp countdown/background/relaunch/cancel.
- [ ] Strict grace/evidence/precedence/failed result.
- [ ] Automatic atomic idempotent configured-minute reward.
- [ ] Committed completed/failed/cancelled Results; no reopen grant/replay.
- [ ] Pet contract and notification/analytics best-effort boundaries.
- [ ] Accessibility/offline/error/retry/race/integrity evidence.
- [ ] All five Stories owner-accepted; exact Epic candidate SHA/report.
- [ ] EPIC-05 deferred truth and open Product decisions remain intact.

### 13.11. Out-of-scope guardrail checklist

- [ ] No pause/resume/custom tag/native app blocking/task manager.
- [ ] No Break creation/cadence implementation from EPIC-07.
- [ ] No Shop/economy, History/contribution, Settings/reset UI.
- [ ] No PostHog/provider, Feedback or Store Review implementation.
- [ ] No Pet naming/species selector or `OPEN-006/009` closure.
- [ ] No unapproved schema/migration/dependency/native config.
- [ ] No native/prebuild/EAS build, push or PR without separate request.

## 14. Planning completion and retained limitations

- [x] Tài liệu `EPIC-06_USER_STORIES.md` được tạo bằng tiếng Việt với technical identifier giữ nguyên.
- [x] Five-Story sequence, priorities, dependencies, outputs và detailed gates được lập.
- [x] Mỗi Story có acceptance, automated checklist, executable manual guide, recovery/race/a11y và
  DoR/DoD.
- [x] Common Component Reuse Matrix và line-count guardrail được lập.
- [x] Owner confirmation register được duyệt Option A ngày 2026-09-03.
- [x] US-06-01 production implementation đã có exact SHA, automated verification và owner quick UI
  acceptance để mở Story 02 planning.
- [x] US-06-02 đã commit tại exact SHA, owner quick-UI accepted và progression gate đã đóng.
- [ ] Formal tester execution hoàn tất.

Retained limitations:

1. Không có production local-notification adapter/dependency/config tại baseline; owner gate bắt buộc.
2. EPIC-05 formal tester vẫn `DEFERRED_TO_LATER_PHASE`; planning này không nâng cấp trạng thái đó.
3. `OPEN-006` contribution colors và `OPEN-009` Pet naming vẫn mở, không block EPIC-06.
4. Wall-clock/device lifecycle limitation giữ đúng approved specifications.
5. Prototype là UX evidence, không phải production timer/session/reward evidence.
6. US-06-01/02/03 đã đóng progression gate qua owner quick UI. US-06-04 plan đã tạo nhưng production
   implementation chưa bắt đầu; 11 confirmations, gồm post-commit cold-start Result restoration,
   chờ owner duyệt. Full manual/formal evidence vẫn deferred.

## 15. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.5.1 | 2026-09-04 | Codex | Recorded final US-06-03 SHA and owner quick-UI acceptance; opened US-06-04 owner-gated completion/reward/Result planning, implementation not started. |
| 0.5.0 | 2026-09-03 | Codex | Recorded owner-approved US-06-03 implementation candidate with automated/SQLite/quality/iOS bundle verification; exact SHA, manual UI and owner acceptance remain pending. |
| 0.4.1 | 2026-09-03 | Codex | Recorded US-06-02 exact SHA and owner quick-UI acceptance; opened owner-gated US-06-03 planning while retaining detailed manual/formal evidence limitations. |
| 0.4.0 | 2026-09-03 | Codex | Recorded owner approval and US-06-02 implemented working-tree candidate with automated/SQLite/bundle verification; exact SHA, manual UI and owner acceptance remain pending. |
| 0.3.1 | 2026-09-03 | Codex | Recorded US-06-01 exact SHA and owner quick-UI acceptance; opened owner-gated US-06-02 planning while keeping detailed manual/formal evidence deferred. |
| 0.3.0 | 2026-09-03 | Codex | Recorded US-06-01 working-tree implementation and automated verification; exact SHA, manual/device evidence and owner acceptance remain pending. |
| 0.2.0 | 2026-09-03 | Codex | Recorded owner approval of `US0600-CONFIRM-01`→`10` as Option A and opened owner-gated implementation planning for `US-06-01`; production implementation remains not started. |
| 0.1.0 | 2026-09-03 | Codex | Created the EPIC-06 Story plan and owner confirmation register. |

**EPIC-06 is in progress. US-06-01 is owner-accepted at exact SHA
`68f2c54d3630817385b320622476c55c67caea13`; US-06-02 is owner-accepted at exact SHA
`9a8e3d87d44612b7bd9aa8bf9e592099300d9e2e`; US-06-03 is owner-accepted through quick UI at
`14ef3413742df4159aa3a7e537d2fd02667cb203`. US-06-04 plan awaits owner confirmation; its production
implementation has not started.**
