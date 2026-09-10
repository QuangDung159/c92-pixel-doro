---
document_id: PIXELDORO_EPIC_07_USER_STORIES
title: PixelDoro EPIC-07 — Break Experience và Long Break Cadence User Stories
version: 0.9.1
status: IN_PROGRESS
date: 2026-09-08
last_updated: 2026-09-10
owner: Dũng Lư
language: vi
scope:
  - mobile_mvp
  - epic_07
  - user_story_breakdown
authority: PLANNING
product_truth: ../PIXELDORO_CORE_TRUTH.md
epic_baseline: ./MVP_EPICS.md
branch_audited: feats/epic-07
baseline_head: 7cb8310642a80876221c015198b3f51d1251af15
epic_06_behavior_candidate: 458a8868ac0024e3b3d1eff64ccc26408a81b2e1
epic_06_status: DONE_OWNER_ACCEPTED
implementation_status: US_07_01_DONE_US_07_02_DONE_US_07_03_DONE_US_07_04_AUTOMATED_PASS
formal_tester_status: NOT_RUN
schema_change: NONE_APPROVED_FOR_US_07_02_US_07_03
next_gate: US_07_04_OWNER_QUICK_UI_SMOKE
---

# EPIC-07 — Break Experience và Long Break Cadence

## 0. Mục đích và cách dùng tài liệu

Tài liệu này chia `EPIC-07` thành các vertical slice nhỏ, quan sát được và kiểm thử độc lập. Đây là
planning artifact; task này không sửa production code, schema, dependency hoặc native configuration.

Thứ tự ưu tiên khi có mâu thuẫn:

1. Product Core hiện hành.
2. Architecture/Data Model đã duyệt.
3. Timer, Session, Pet và Gamification specifications đã duyệt.
4. `MVP_EPICS.md` và Exit Report mới nhất.
5. Implementation đã commit.
6. UX prototype chỉ làm evidence về hierarchy/copy/navigation; fake reducer không phải production
   behavior.
7. Tài liệu lịch sử chỉ dùng để hiểu decision/evidence; Exit Report mới hơn thắng trạng thái cũ.

Không confirmation nào trong mục 19 được xem là đã duyệt chỉ vì Option A được đề xuất. Mọi
implementation plan bị ảnh hưởng phải dừng tại gate tương ứng cho tới khi owner chốt.

## 1. Authority và tài liệu tham chiếu

### 1.1. Inventory đã audit

| Nhóm | Tài liệu đã đối chiếu | Cách sử dụng |
|---|---|---|
| Product truth | Toàn bộ `docs/PIXELDORO_CORE_TRUTH.md` 1.16.0 | Authority cao nhất cho Break, cadence, reward, flow, notification và scope. |
| Master planning | Toàn bộ `docs/planning/MVP_EPICS.md` 1.6.0 | EPIC-07 outcome, gate, checklist và ranh giới EPIC-08→12. |
| Architecture | Toàn bộ `technical-overview.md`, `system-architecture.md`, `project-structure.md`, `data-model.md` | Layer ownership, transaction/side-effect order, file boundary, schema/index/derived truth. |
| ADR | ADR-001 đến ADR-008 | Runtime, navigation, persistence, domain/platform, animation, feedback/review, delivery và analytics guardrail. |
| Specification | Toàn bộ `session-lifecycle.md`, `timer-engine.md`, `gamification-rules.md`, `pet-state-machine.md` | Normative lifecycle, timestamp, race, no reward và Pet breaking rules. |
| UX evidence | Toàn bộ `EPIC-03_UX_PROTOTYPE_PLAN.md` | Approved UX evidence cho immersive Break, cancel confirmation và Break Result; không lấy mock reducer làm truth. |
| Exit authority | `EPIC-04_EXIT_REPORT.md`, `EPIC-05_EXIT_REPORT.md`, `EPIC-06_EXIT_REPORT.md` | Capability đã giao, exact accepted candidates và deferred evidence. |
| User Stories | Toàn bộ `EPIC-04_USER_STORIES.md`, `EPIC-05_USER_STORIES.md`, `EPIC-06_USER_STORIES.md` | Mẫu vertical slice, component reuse, Pet/Trial/Standard boundary và gate discipline. |
| Implementation plans/reports | Toàn bộ plan/report của US-04-03→07, US-05-01→05, US-06-01→05, gồm art/test guide liên quan | Reuse contract thực tế, accepted option, known limitation và regression surface. |
| Foundation history | Toàn bộ tài liệu còn lại trong `docs/`, gồm EPIC-01/02 evidence, US-02-01→09 plans, audit, checklist và runbook | Xác minh migration, typed repository, derived query, reset, safe bootstrap và evidence semantics. |
| Device guides | Toàn bộ Markdown và validator trong `apps/mobile/test/device/` | Mẫu fixture, reset an toàn, exact SHA/device metadata và phân loại evidence. |
| Production/test code | `packages/domain`, `packages/application`, `apps/mobile/src`, `apps/mobile/test` | Inventory implementation tại baseline, không suy luận từ plan cũ. |

### 1.2. Product truth đã khóa

- Short Break là `5` phút; Long Break là `15` phút; không configurable trong EPIC-07.
- Sau bốn completed Standard Focus kể từ completed Long Break gần nhất, Break kế tiếp là Long.
- Nếu chưa có completed Long Break, count bắt đầu từ completed Standard Focus đầu tiên trong local
  history.
- Trial, Focus failed/cancelled/running và Break không tăng Focus cadence.
- Long Break due giữ qua Home, relaunch và thêm Focus; chỉ completed Long Break reset cycle.
- Cancelled Long Break không reset due.
- Chỉ completed Standard Focus Result có Break CTA; failed/cancelled không có.
- Break không auto-start. Chỉ explicit action và committed `StartBreak` mới tạo running Break.
- Break không có Pause/Resume, Strict/grace hoặc `failed` branch trong Mobile MVP.
- Break completion boundary là `now >= endsAt`, dùng device wall clock và timestamp persisted.
- Completed/cancelled Break không nhận XP/Coin, không có RewardTransaction và không Celebrate.
- Break running map Pet sang `breaking`; terminal Break trở lại base `idle` nếu không có active session.
- Notification/analytics/audio/haptic/Pet animation là best-effort sau commit, không phải durable truth.

### 1.3. Prototype-only và historical-only

Các phần sau chỉ là UX evidence hoặc lịch sử, không phải requirement production:

- `PrototypeProvider`, `PrototypeSession`, `nextBreakKind`, fake countdown và reviewer buttons
  `Complete/Cancelled`.
- Settings shortcut tự chọn Short/Long; production cadence không phải user preference.
- Mock reward/no-reward data và in-memory Break Result.
- Prototype route behavior khi state bị mất; production phải đọc durable session và fail closed.
- Các checkbox `PASS` ở plan cũ không thay formal EPIC-07 evidence; Exit Report mới nhất quyết định
  trạng thái EPIC trước.

### 1.4. Deferred/future scope phải giữ ngoài EPIC-07

- EPIC-08: Shop, inventory, purchase/equip và progression breadth.
- EPIC-09: History UI, contribution graph và `OPEN-006` color thresholds.
- EPIC-10: Settings production UI, configurable preference control và local-data control breadth.
- EPIC-11: PostHog provider/network delivery, feedback và store review.
- EPIC-12: formal hardening/beta delivery breadth.
- Native app blocking, pause/resume, configurable Break duration, auto-start Focus/Break, Live
  Activities, widget, server push, backend clock, cloud sync, Energy/Happiness/Streak/Revive.
- `OPEN-009` Pet naming và mọi scope phụ thuộc quyết định này.

## 2. Git và readiness state

| Fact | Audit result |
|---|---|
| Branch | `feats/epic-06` |
| Audit HEAD | `303c74813cff6ad752b8ac0e4239b9cf2e14a009` |
| Upstream | `origin/feats/epic-06` cùng HEAD tại thời điểm audit |
| EPIC-06 accepted behavior | `458a8868ac0024e3b3d1eff64ccc26408a81b2e1` |
| Diff accepted candidate → audit HEAD | Chỉ documentation/master-state merge; không có production code change. |
| EPIC-06 gate | `DONE_OWNER_ACCEPTED`; owner quick smoke iOS/Android reported. |
| Formal tester | EPIC-05/06 matrix vẫn `DEFERRED_TO_LATER_PHASE`; EPIC-07 là `NOT_RUN`. |
| EPIC-07 | `PLANNING_READY`, production implementation chưa bắt đầu. |
| Working tree trước file này | Clean. |

Readiness conclusion: đủ điều kiện tạo breakdown. Chưa đủ điều kiện tạo/duyệt implementation plan
cho các Story bị confirmation ở mục 19 chặn.

## 3. Baseline audit và current implementation inventory

### 3.1. Domain

| Capability | Hiện có | Gap EPIC-07 |
|---|---|---|
| Session countdown | Pure `projectRemainingTime` dùng timestamp | Reuse nguyên vẹn cho Break. |
| Pet base state | `focus/short_break/long_break running` → `working/breaking` | Không cần Pet state mới. |
| Pet terminal feedback | Break completed/cancelled hợp lệ nhưng không one-shot | Reuse; test no Celebrate/Bugged. |
| Standard Focus config/reward/Strict | Production-tested | Không reuse business rule Strict/reward cho Break. |
| Cadence decision | Chưa có pure Domain policy | Cần pure decision từ `LongBreakCadenceFacts`; threshold `4`, sticky due. |
| Break identity/transition | Chưa có focused validators | Cần validate type/duration/no mode/no tag/no reward và terminal decision. |

### 3.2. Shared/mobile Application

| Capability | Hiện có | Gap EPIC-07 |
|---|---|---|
| `SessionRecord`/repository | Hỗ trợ `short_break`, `long_break`, generic insert/find/conditional transition | Reuse contract; bổ sung use case, không cần port SQL mới mặc định. |
| Command serialization | Một application-scoped `SessionCommandCoordinator` | Mọi Start/Cancel/Reconcile Break phải dùng cùng instance với Trial/Standard. |
| Cadence query port | `LongBreakCadenceQuery.getFacts(profileId)` trả count + latest marker | Cần application/domain projection chọn type/duration; query không được trả `isDue`. |
| Standard Focus slice | Setup/Running/Cancel/Reconcile/Result/controller pattern hoàn chỉnh | Reuse pattern, không copy nguyên file hoặc nhét Break branches vào Standard controller. |
| Startup/lifecycle | Adapter hiện reconcile Trial và Standard; foreign Break là `not_owned` | Cần Break reconciliation participant và routing without race. |
| Mobile facade/hooks | Chưa expose Break controller/actions | Cần narrow typed Break surfaces. |

### 3.3. Infrastructure/persistence

| Capability | Hiện có | Kết luận |
|---|---|---|
| Schema `001` | Unified `sessions`; exact Break conditional checks, fixed 5/15 durations, no mode/tag/background, status running/completed/cancelled | Đủ dùng. |
| Active invariant | `ux_sessions_one_running` | Đủ chống double Start/concurrent Focus-Break. |
| Terminal backstop | Conditional update + terminal immutable trigger | Đủ cho cancel/completion race. |
| No reward | Break checks bắt `0/0/null`; reward trigger reject Break | Đủ chống reward sai. |
| Cadence index/query | `ix_sessions_long_break_cadence`; `SQLiteLongBreakCadenceQuery` đã test/probe | Reuse; thêm end-to-end fixtures, không tạo counter. |
| Mapper | Validate Short `5`, Long `15`, null Focus fields và zero reward | Reuse. |
| Notification | Focus-specific port/adapter/key/response đã có | Nên generalize/extend typed session-completion variant; không duplicate Expo gateway. |
| Analytics queue | Allowlist đã chứa `break_started`, `break_completed` | Reuse local queue; provider delivery vẫn EPIC-11. |

**Schema verdict:** không có schema gap cho behavior đã khóa. Giữ migration `001` immutable. Chỉ nếu
owner chọn durable “mỗi completed Focus chỉ được mở tối đa một Break” ở `US0700-CONFIRM-01` thì mới
phát sinh schema gap thật (`source_focus_session_id`/unique relation hoặc equivalent) và phải dừng để
cập nhật Data Model + forward migration trước implementation plan.

### 3.4. Presentation/navigation/component

| Surface | Production hiện tại | EPIC-07 action |
|---|---|---|
| Standard completed Result | Committed result + reward + Home-only | Extend đúng completed variant với cadence projection và Break CTA; failed/cancelled giữ nguyên. |
| Break route/screen | Hoàn toàn dùng prototype in-memory và mock controls | Thay production branch bằng durable controller/projection; không fallback prototype. |
| Settings Break selector | Reviewer shortcut chọn Short/Long mock | Giữ prototype-only cho later UX review hoặc retire khỏi production path; không dùng làm cadence. |
| Pet | Common `PetVisualStatus` + approved `breaking` sprite | Reuse không đổi state/asset. |
| Timer | Common `CountdownDisplay` | Reuse với typed caption; không tạo Break timer component trùng. |
| Shell/status/buttons/modal | Common production primitives đã có | Reuse/extend typed props; regression Trial và Standard. |

### 3.5. Audit common component và consumer

- `Panel/PixelPanel`: Home, Onboarding, Standard Result/Running/Setup và prototype secondary screens.
- `ChoiceChip`: Standard Setup, Feedback, Settings prototype; Break production không cần loại Break
  selector vì cadence tự chọn.
- `DurationControl`: Standard Setup; không dùng cho fixed Break.
- `PrimaryButton/SecondaryButton`: toàn bộ primary flow; đã có disabled/busy/accessibility state.
- `ConfirmationDialog/Modal`: Trial, Standard và prototype Break cancel.
- `PetVisualStatus`: Home, Trial, Standard, prototype Break.
- `CountdownDisplay`: Trial và Standard production.
- `LoadingState/ErrorState`: bootstrap, route branches và feature screens.
- `InlineNotice`: Onboarding/Standard/prototype Break.
- `RewardSummary/ProgressionSummary`: Trial/Standard Result; Break tuyệt đối không render hai component
  này.
- `ScreenShell/ScreenHeader`: production screens; prototype alias vẫn tồn tại nhưng không được dùng làm
  production authority.

Không file production component nào hiện vượt 300 dòng; prototype Break/Result mỗi file khoảng 150
dòng. Mọi file mới target dưới 220 dòng; tại 240–260 dòng phải review split, 300 là hard limit.

## 4. Scope và out-of-scope

### 4.1. In scope

- Cadence projection chính xác từ durable history.
- Completed Standard Focus Result hiển thị current Short/Long recommendation và explicit Break/Home.
- Atomic `StartBreak` dùng current cadence, fixed duration và one-active invariant.
- Short/Long Break running countdown, Pet `breaking`, background/foreground/relaunch recovery.
- Break completion/cancel, no reward/no one-shot, exact committed result/navigation theo confirmation.
- Notification completion idempotent, stale/repeated tap safe.
- Local allowlisted `break_started` và `break_completed` hooks theo confirmation; no provider upload.
- Offline, safe recovery, duplicate/concurrent command, accessibility và regression evidence.
- Retire production dependence on prototype Break state; retain only explicitly labeled dev fixture code.

### 4.2. Out of scope

- Mọi mục ở §1.4.
- Tự chọn Short/Long bằng UI, custom duration hoặc lưu cadence trong Settings/Zustand.
- Reward, progression delta, Celebrate/Bugged hoặc manual Claim cho Break.
- `failed` Break, Strict/grace/background penalty hoặc `backgroundedAt` cho Break.
- Start Break từ failed/cancelled/trial Result hoặc tự động khi Focus complete/render/relaunch.
- General-purpose session framework/refactor không tạo user outcome EPIC-07.

## 5. Dependency và risk analysis

### 5.1. Ordered execution graph

```text
Owner confirmations 01–06
        |
        v
US-07-01 Cadence + completed Result choice
        |
        v
US-07-02 Explicit durable Start + Breaking handoff
        |
        v
US-07-03 Timestamp running + completion/relaunch
        |
        v
US-07-04 Cancel/recovery/race + terminal Result
        |
        v
US-07-05 Notification/analytics/a11y/integrity + Epic exit
```

### 5.2. Risk order

| Risk | Mức | Story owner | Control |
|---|---|---|---|
| Cadence stale hoặc biến thành second truth | Critical | US-07-01/02 | Pure decision + current query trong command; no counter. |
| Auto-start/foreign result tạo Break | Critical | US-07-01/02 | Exact completed Standard identity + explicit command only. |
| Duplicate/concurrent Start | High | US-07-02 | Shared coordinator + transaction + unique running index. |
| Break bị Standard/Trial startup bỏ qua | High | US-07-03 | One startup barrier with explicit Break participant. |
| Cancel/deadline race cho sai terminal | High | US-07-04 | Single-capture timestamp + conditional transition + DB integration. |
| Break nhận reward/animation sai | High | US-07-03/04 | Domain/application rejection + schema/trigger assertions. |
| Notification tap điều hướng stale | High | US-07-05 | Typed key + durable reconcile/read + consumed request. |
| Reuse common component làm regression Trial/Standard | Medium | Mỗi Story | Consumer regression matrix. |
| Prototype lọt production | Medium | US-07-02/05 | Static route/import integrity test. |

## 6. Ordered User Story list

| Order | Story | Priority | User-visible/testable increment | Dependency |
|---:|---|---|---|---|
| 1 | US-07-01 — Cadence đúng và lựa chọn Break trên completed Result | P0 | Result nói rõ Short 5/Long 15 hiện due và chỉ có Start/Home | EPIC-06; confirmations 02 |
| 2 | US-07-02 — Explicit durable Start Break và Pet chuyển sang Breaking | P0 | Tap Start tạo đúng một running Break rồi mới điều hướng | US-07-01; confirmation 01 |
| 3 | US-07-03 — Break timestamp countdown, background/relaunch và completion | P0 | Break sống qua background/relaunch, complete đúng deadline, zero reward | US-07-02 |
| 4 | US-07-04 — Cancel, terminal recovery và race-safe Break Result | P0 | Cancel confirmation/result, recovery và race phản ánh committed winner | US-07-03; confirmations 03–04 |
| 5 | US-07-05 — Notification, analytics hooks, accessibility và Epic integrity | P1 | Notification/tap an toàn, semantic UI, prototype removed, exit evidence | US-07-04; confirmations 05–06 |

Không có P2 Story: polish không tách thành scope mơ hồ; phần cần thiết để accessibility/integrity đi
vào US-07-05, enhancement ngoài MVP bị deferred.

## 7. US-07-01 — Cadence đúng và lựa chọn Break trên completed Result

### 7.1. Outcome, dependency và phạm vi

- **User outcome:** sau completed Standard Focus, người dùng biết phiên nghỉ kế tiếp là Short 5 phút
  hay Long 15 phút và có thể chọn bắt đầu hoặc về Home; không có Break nào tự tạo.
- **Priority/order:** `P0`, thứ `1`.
- **Dependency:** EPIC-06 accepted Result + existing `LongBreakCadenceQuery`; `US0700-CONFIRM-02`.
- **In scope:** pure cadence policy, application projection, Result loading/error/retry, completed-only
  CTA, current due through Home/relaunch/additional Focus.
- **Out of scope:** Start transaction, Break running, notification, user-selectable Break type.
- **User-visible output:** completed Result hiển thị `Nghỉ ngắn · 5 phút` hoặc `Nghỉ dài · 15 phút`,
  CTA `Bắt đầu nghỉ` và `Về Home`; failed/cancelled unchanged.

### 7.2. Durable facts, rules và layer ownership

| Concern | Contract |
|---|---|
| Read | Completed Standard Focus exact ID; count since latest completed Long Break; latest marker. |
| Write | Không write. Result render/Home/relaunch không insert/update session. |
| Domain | `<4` → Short; `>=4` → Long; count không clamp/reset; invalid negative/unsafe facts reject. |
| Application query | `LoadNextBreakRecommendation(sessionId)` validates source completed Standard Focus and maps cadence facts to type/duration. |
| Infrastructure | Reuse `SQLiteLongBreakCadenceQuery`; no SQL in screen; no schema/index change. |
| Presentation | Branch owns fetch/retry/navigation; screen receives typed recommendation/callback only. |

Error: query/source mismatch hiển thị finite `ErrorState` + Retry/Home; không đoán Short mặc định.
Offline: toàn bộ local. Relaunch đọc lại current cadence. Race: preview có thể stale khi một command
khác commit; US-07-02 command re-evaluates and returns actual committed type. Accessibility: type,
duration, due meaning và actions phải được đọc bằng text, không chỉ màu/sprite.

### 7.3. Acceptance criteria

- [x] Count `0–3` chọn Short 5 phút; count `4+` chọn Long 15 phút.
- [x] Trial, running, failed/cancelled Focus và cancelled/Short Break không ảnh hưởng count.
- [x] Chỉ latest completed Long Break là reset marker.
- [x] Long due giữ qua Home, relaunch và completed Standard Focus bổ sung.
- [x] Completed Long Break làm lần đọc tiếp theo trở về Short nếu chưa có đủ bốn Focus mới.
- [x] Result render/retry/reopen không tạo Break hoặc mutate cadence.
- [x] Failed/cancelled Standard và Trial Result không có Start Break.
- [x] Cadence read/corrupt failure không fallback thành Short; có Retry/Home an toàn.
- [x] CTA/copy thể hiện type + duration bằng text và không phụ thuộc màu/motion.

### 7.4. Automated test checklist

- [x] Domain table test `0,1,2,3,4,5+`, invalid count và marker facts.
- [x] Application test exact completed Standard source; reject running/failed/cancelled/trial/Break.
- [x] SQLite mixed-history test no marker, completed marker, cancelled marker, additional Focus và reopen.
- [x] Controller single-flight/stale response/dispose/retry test.
- [x] Presentation test completed recommendation and unchanged failed/cancelled variants.
- [x] Regression: existing derived-query, Trial Result và Standard Result tests pass.

### 7.5. Manual UI/device test guide

- [ ] **Mục tiêu:** xác nhận recommendation dùng durable cadence và không auto-start.
- [ ] **Preconditions:** exact SHA/build/device/OS recorded; onboarding complete; no active session.
- [ ] **Fixture:** dev-only mixed cadence scenarios `count_0`, `count_3`, `count_4`, `completed_long_reset`,
  mỗi fixture phải gọi production query/projection và không sửa production DB ngoài isolated setup.
- [ ] **Reset an toàn:** dùng confirmed Development Build reset hoặc isolated fixture DB; ghi trước/sau;
  không xóa `pixeldoro.db` bằng script thủ công.
- [ ] **Step 1:** mở completed Result với count 3. **Expected:** Short 5, Start/Home; zero Break row.
- [ ] **Step 2:** mở count 4 rồi về Home, relaunch, mở lại exact Result. **Expected:** Long 15 vẫn due;
  vẫn zero Break row.
- [ ] **Step 3:** thêm completed Focus trong due fixture. **Expected:** Long vẫn due, không reset/clamp.
- [ ] **Step 4:** fixture completed Long Break. **Expected:** recommendation trở lại Short.
- [ ] **Step 5:** failed/cancelled/trial Results. **Expected:** không CTA Break.
- [ ] **Offline/provider failure:** airplane mode và analytics/notification provider unavailable không
  đổi recommendation.
- [ ] **Foreground/background/relaunch:** background/relaunch Result không tạo session.
- [ ] **Cancel/completion race:** `NOT_APPLICABLE` ở Story này vì chưa có Break row; chạy fixture race
  cadence read với một terminal transition và xác nhận chỉ durable completed facts ảnh hưởng query.
- [ ] **Notification allowed/denied/stale/repeated tap:** `NOT_APPLICABLE` cho mutation ở Story này;
  nếu shared handler đã tồn tại thì mỗi trường hợp chỉ được reload durable Result/cadence, không Start.
- [ ] **Screen reader/large text/Reduce Motion:** đọc type/duration/action; CTA wrap và reachable;
  meaning không đổi khi motion giảm.
- [ ] **Platforms:** chạy owner quick smoke iOS + Android; formal tester ghi độc lập.
- [ ] **Cleanup:** unset fixture, đóng isolated DB, chạy normal app và xác nhận không active Break.
- [ ] **Evidence:** automated `PASS`; owner quick smoke `PASS` (no crash, works as expected,
  2026-09-09); structured case/platform metadata và formal tester vẫn `NOT_RUN`, không suy diễn.

### 7.6. DoR, DoD, evidence và next gate

- [x] **DoR:** `US0700-CONFIRM-02` approved; source identity/error copy trong plan; no schema change.
- [x] **DoD:** acceptance + automated checks pass; implementation report/exact SHA/device guide tạo;
  owner chấp nhận output quan sát được; formal status ghi trung thực.
- [x] **Evidence files:** `US-07-01_IMPLEMENTATION_PLAN.md`, `US-07-01_IMPLEMENTATION_REPORT.md`,
  `apps/mobile/test/device/break-cadence-result-smoke.md`.
- [x] **Gate sang US-07-02:** cadence Domain/Application ownership và completed-only Result được owner
  accepted; no auto-start/prototype authority regression.

## 8. US-07-02 — Explicit durable Start Break và Pet chuyển sang Breaking

### 8.1. Outcome, dependency và phạm vi

- **User outcome:** chỉ khi tap `Bắt đầu nghỉ`, đúng Short/Long Break mới được persist một lần; sau
  commit người dùng thấy countdown và Pet nghỉ.
- **Priority/order:** `P0`, thứ `2`.
- **Dependency:** US-07-01; `US0700-CONFIRM-01/02`.
- **In scope:** Break record factory/validator, atomic Start, current cadence re-evaluation, one-active
  conflict, committed handoff, route/Pet refresh, double tap/concurrent Start.
- **Out of scope:** terminal completion/cancel and notification.
- **User-visible output:** busy CTA → committed Break Session with actual type/duration + Pet breaking;
  Home creates nothing.

### 8.2. Durable facts, rules và layer ownership

| Concern | Contract |
|---|---|
| Read | Exact source completed Standard Focus; current cadence; active session within transaction. |
| Write | One `sessions` row: `short_break/5` or `long_break/15`, null variant/mode/tag/background, zero reward, running timestamps/local-day. |
| Domain | Select type from current cadence; construct immutable valid Break identity; no reward/Strict. |
| Command | `StartBreak(sourceFocusSessionId)` on shared coordinator; one captured `now`, transaction read/validate/insert, return actual record. |
| Infrastructure | Reuse generic session repository + active unique index; no migration under Option A. |
| Presentation | Result invokes command; navigation only after commit; running screen receives durable projection. |

Error/recovery: invalid/foreign source or active conflict stays on Result with actionable copy; DB
failure creates no row/navigation/side effect. Offline: fully functional. Race: double tap shares
pending UI but correctness uses coordinator/index; concurrent Focus Start yields one winner. Relaunch
after commit routes same Break via startup barrier. Pet must refresh after commit and active Breaking
preempts prior Celebrate without session mutation.

### 8.3. Acceptance criteria

- [x] Result/Home/render/relaunch before tap creates zero Break rows.
- [x] Explicit tap from eligible completed Standard Result creates exactly one current-cadence Break.
- [x] Short row is 5 minutes; Long row is 15; all Break-only null/zero invariants hold.
- [x] Trial/failed/cancelled/running/foreign IDs cannot Start Break.
- [x] Navigation and Pet Breaking happen only after durable commit.
- [x] Double tap/concurrent Start creates at most one running session.
- [x] Active Focus/Trial/Break conflict does not replace/cancel existing session.
- [x] Home action does not consume/reset cadence.
- [x] Write/read/commit failure leaves UI recoverable and does not schedule side effects.
- [x] No production import/use of prototype state for Start or handoff.

### 8.4. Automated test checklist

- [x] Break record factory exact Short/Long shape and invalid timestamp/calendar tests.
- [x] Start use case eligible/foreign/current-cadence/change-between-preview-and-tap tests.
- [x] Coordinator double call and concurrent Standard/Trial/Break Start tests.
- [x] Real SQLite insert/rollback/unique-running/reopen tests with migration `001`.
- [x] Controller committed-handoff/error/dispose tests.
- [x] Route/Pet test navigation-after-commit and Breaking projection.
- [x] Static production-route test rejects prototype imports/fallback.
- [x] Regression: Trial/Standard Start, Pet arbitration, reset and derived cadence suites.

### 8.5. Manual UI/device test guide

- [ ] **Mục tiêu:** chứng minh explicit commit-before-navigation Start và Pet Breaking.
- [ ] **Preconditions:** accepted US-07-01, exact evidence metadata, completed Standard Result.
- [ ] **Fixture:** `break_start_short`, `break_start_long_due`, `break_start_write_failure_once`,
  `break_start_active_conflict`; valid production duration only.
- [ ] **Reset:** confirmed reset/isolated fixture; capture session count and cadence before test.
- [ ] **Step 1:** tap Home. **Expected:** Home, no Break row, cadence unchanged.
- [ ] **Step 2:** tap Start once. **Expected:** pending accessible state, one durable running row, then
  Break screen type/duration and Pet Breaking.
- [ ] **Step 3:** rapid double tap. **Expected:** one row/route, no duplicate error loop.
- [ ] **Step 4:** force Start write failure. **Expected:** remain Result, Retry available, no row/Pet
  transition; Retry commits once.
- [ ] **Step 5:** race with active session. **Expected:** existing session wins, no overwrite.
- [ ] **Relaunch:** kill immediately after commit. **Expected:** same Break ID/type resumes; no second row.
- [ ] **Offline/provider failure:** Start succeeds offline; unavailable notification/analytics does not
  block (actual side effects added later).
- [ ] **Cancel/completion race:** `NOT_RUN` tới US-07-04; trong phạm vi Story này chỉ xác nhận concurrent
  Start không tạo terminal row và không can thiệp active session winner.
- [ ] **Notification allowed/denied/stale/repeated tap:** `NOT_RUN` tới US-07-05; nếu adapter dùng chung
  đã chạy thì mọi trường hợp không được tạo thêm Break hoặc đổi Start transaction đã commit.
- [ ] **Screen reader/large text/Reduce Motion/touch:** pending/failed/success meaning announced; buttons
  at least 44×44pt/48dp equivalent; Pet meaning has status text.
- [ ] **Platforms/cleanup/evidence:** iOS + Android quick smoke, unset fixture, finish/cancel test Break
  via fixture or confirmed reset; record automated/owner/formal separately as `NOT_RUN` until run.

Owner evidence recorded 2026-09-09: quick UI smoke `PASS` — no crash, works as expected. Platform,
device/OS, accessibility and formal tester metadata were not supplied, so the detailed matrix above
remains unchecked/`NOT_RUN` rather than being inferred from the owner smoke.

### 8.6. DoR, DoD, evidence và next gate

- [x] **DoR:** US-07-01 accepted; confirmations 01/02 approved; no-schema Option A recorded.
- [x] **DoD:** atomic Start/handoff/Pet and race tests pass; no prototype production path; report, SHA
  and guide exist; owner accepts.
- [x] **Evidence files:** `US-07-02_IMPLEMENTATION_PLAN.md`, `US-07-02_IMPLEMENTATION_REPORT.md`,
  `apps/mobile/test/device/break-start-smoke.md`.
- [x] **Gate sang US-07-03:** one running Break survives cold reopen and all existing Start regressions
  pass.

## 9. US-07-03 — Break timestamp countdown, background/relaunch và completion

### 9.1. Outcome, dependency và phạm vi

- **User outcome:** Break countdown remains trustworthy while app backgrounds or restarts and ends as
  completed at deadline without penalty or reward.
- **Priority/order:** `P0`, thứ `3`.
- **Dependency:** US-07-02.
- **In scope:** running controller, timestamp display, app lifecycle/startup reconcile, completion
  transaction, exact terminal read, Pet returns Idle, zero reward.
- **Out of scope:** user cancel UX/race refinement, notification, analytics.
- **User-visible output:** Short/Long running UI, background/relaunch continuation, completed state.

### 9.2. Durable facts, rules và layer ownership

| Concern | Contract |
|---|---|
| Read | Active/exact running Break; exact terminal Break result. |
| Write | Conditional `running → completed`, `resolvedAt/updatedAt = captured now`, reward remains zero/null. |
| Domain | `now < endsAt` running; `now >= endsAt` completed; Break never failed; invalid facts reject. |
| Commands | `ReconcileBreak(sessionId?)`, startup/foreground/deadline trigger on shared coordinator. |
| Infrastructure | Generic conditional transition and mapper; no reward/profile repository. |
| Presentation | Reuse `CountdownDisplay`, `PetVisualStatus`, shell/header/status; tick only requests reconcile. |

Tick never writes. Background stops tick/animation but does not write `backgroundedAt`. Foreground and
relaunch reconcile before final render. Completion failure enters recovery without false terminal.
Duplicate tick/foreground/startup commands coalesce/serialize and yield one commit. Completed Break
has no receipt/profile delta and cannot emit Celebrate/Bugged.

### 9.3. Acceptance criteria

- [x] Countdown derives from `endsAt - now`, stops in background and re-anchors on foreground.
- [x] Background/lock/crash/kill never changes Break to failed.
- [x] Relaunch before deadline hydrates the same running Break.
- [x] At/past deadline reconcile commits completed exactly once.
- [x] Relaunch after deadline commits/reads completed before showing final truth.
- [x] Completed Short does not reset long cadence; completed Long resets via existing derived query.
- [x] Completed Break creates no RewardTransaction/profile delta/reward UI.
- [x] Pet Breaking only for committed running; completed returns Idle and never Celebrate/Bugged.
- [x] DB/corrupt timestamp failure shows recovery and preserves record.
- [x] Countdown `00:00` pending does not itself claim completion.

### 9.4. Automated test checklist

- [x] Pure remaining/completion decision boundary and invalid timestamp tests.
- [x] Reconcile running/completed/existing terminal/foreign/no-active/error tests.
- [x] Controller tick visibility/single deadline callback/dispose tests.
- [x] Startup participant ordering with Trial/Standard/Break and readiness barrier tests.
- [x] SQLite completion/reopen/no-reward and cadence-reset tests; failure/retry covered at boundaries.
- [x] Pet Breaking→Idle/no-one-shot arbitration tests.
- [x] Regression: Standard Strict background behavior remains unchanged; Trial remains Relax.

### 9.5. Manual UI/device test guide

- [ ] **Mục tiêu:** validate timestamp, no-Strict, relaunch và zero-reward completion.
- [ ] **Preconditions:** running Short/Long from production Start; record ID, endsAt, XP/Coin.
- [ ] **Fixture:** accelerated valid Break clock for quick smoke plus normal-clock relaunch scenario;
  fixture must not persist fake 5-second duration.
- [ ] **Reset:** do not reset while preserving relaunch case; otherwise confirmed reset only.
- [ ] **Step 1:** observe countdown. **Expected:** accessible timer, no Pause/Strict/reward controls.
- [ ] **Step 2:** background/lock >10 seconds before deadline. **Expected:** still running, Pet Breaking
  on return, remaining jumps from timestamp.
- [ ] **Step 3:** kill/relaunch before deadline. **Expected:** same ID/type/endsAt, no duplicate row.
- [ ] **Step 4:** cross deadline foreground. **Expected:** completed committed, zero reward, Pet Idle.
- [ ] **Step 5:** Long completion then reopen cadence Result. **Expected:** cycle reset; Short recommendation.
- [ ] **Failure:** inject transition/commit/read failure. **Expected:** recovery, no completed UI until Retry.
- [ ] **Offline/provider:** airplane mode full run succeeds.
- [ ] **Cancel/completion race:** `NOT_RUN` tới US-07-04; smoke completion-first nếu cancel UI đã nối và
  xác nhận conditional terminal write giữ completed winner, không reward.
- [ ] **Notification allowed/denied/stale/repeated tap:** `NOT_RUN` tới US-07-05; nếu adapter dùng chung
  đã hoạt động thì permission/tap state không được thay đổi timestamp completion truth.
- [ ] **Screen reader/large text/Reduce Motion:** timer not announced each second; pending announced
  politely once; content/actions remain reachable; static Breaking status remains meaningful.
- [ ] **Platforms/cleanup/evidence:** normal + accelerated path on iOS/Android; unset fixture; record
  status `NOT_RUN`/`PASS` per evidence class without upgrading simulator results to formal tester.

Owner evidence recorded 2026-09-09: quick UI smoke `PASS` — no crash, works as expected. Platform,
device/OS, accessibility and formal tester metadata were not supplied, so the detailed matrix above
remains unchecked/`NOT_RUN` rather than being inferred from the owner smoke.

### 9.6. DoR, DoD, evidence và next gate

- [x] **DoR:** US-07-02 accepted; startup ownership and recovery route documented in the owner-gated
  US-07-03 implementation plan.
- [x] **DoD:** automated timestamp/background/relaunch/completion/no-reward evidence passes;
  report/guide/exact SHA exist; owner quick UI accepted.
- [x] **Evidence files:** `US-07-03_IMPLEMENTATION_PLAN.md`, `US-07-03_IMPLEMENTATION_REPORT.md`,
  `apps/mobile/test/device/break-running-completion-smoke.md`.
- [x] **Gate sang US-07-04:** both Break types complete/reopen with zero reward and Standard/Trial
  lifecycle regressions pass.

## 10. US-07-04 — Cancel, terminal recovery và race-safe Break Result

### 10.1. Outcome, dependency và phạm vi

- **User outcome:** user can safely dismiss or confirm early end; the UI always reflects the durable
  winner when cancel and completion compete.
- **Priority/order:** `P0`, thứ `4`.
- **Dependency:** US-07-03; `US0700-CONFIRM-03/04`.
- **In scope:** cancel confirmation/back, cancel command, deadline guard, exact terminal Result,
  retry/recovery, duplicate cancel and completion race.
- **Out of scope:** notification/analytics provider and new reward/Pet one-shot.
- **User-visible output:** dismiss keeps running; confirm yields cancelled Result/Home flow; race may
  show completed Result according to committed truth.

### 10.2. Durable facts, rules và layer ownership

| Concern | Contract |
|---|---|
| Read | Exact running/terminal Break; never “latest session” fallback. |
| Write | Conditional `running → cancelled` before deadline or completion reconcile at/past deadline per confirmation. |
| Domain | Break type/duration identity; terminal immutable; completed/cancelled only. |
| Commands | `CancelBreak(sessionId)` through shared coordinator; terminal winner returned typed. |
| Infrastructure | Reuse conditional update/transaction/trigger; no delete/repair. |
| Presentation | Common ConfirmationDialog busy/error; route renders exact terminal result/navigation per confirmation 03. |

Cancel failure keeps modal/action recoverable and Break running. Duplicate confirmation does not
create new write. Back on running opens modal; back on Result follows confirmed navigation. No result
branch renders RewardSummary/ProgressionSummary. Pet returns Idle after either terminal outcome.

### 10.3. Acceptance criteria

- [x] Back/Cancel opens accessible confirmation; dismiss changes no durable facts.
- [x] Confirm before deadline commits cancelled once, zero reward.
- [x] Confirm at/past deadline follows `US0700-CONFIRM-04`; no arbitrary UI winner.
- [x] Completion-first blocks later cancel; cancel-first before deadline blocks later completion.
- [x] Duplicate cancel/rapid tap returns stable terminal/no-op result.
- [x] Read/write/commit failure does not navigate or invent terminal result.
- [x] Result reads exact Break ID and rejects Focus/trial/malformed record.
- [x] Completed/cancelled Break have no reward/progression/Celebrate/Bugged UI.
- [x] Completed Long resets cadence; cancelled Long leaves Long due.
- [x] Relaunch terminal Break does not replay side effects.

### 10.4. Automated test checklist

- [x] Cancel use case before/equal/after deadline, already terminal, foreign, invalid and DB failure.
- [x] Coordinator concurrent cancel/reconcile and duplicate calls.
- [x] Real SQLite cancel-first/completion-first/rollback/reopen/cadence assertions.
- [x] Cancel controller busy/error/reset/dispose and detached callback tests.
- [x] Exact Result reader completed/cancelled/foreign/no-reward corruption tests.
- [x] Screen/route modal/back/result static/accessibility contract tests.
- [x] Regression: Standard/Trial cancel modal and Home/result actions pass in full suite.

### 10.5. Manual UI/device test guide

- [ ] **Mục tiêu:** verify dismiss/confirm, durable winner, Result and recovery.
- [ ] **Preconditions:** running Short and Long cases; exact metadata and XP/Coin baseline.
- [ ] **Fixture:** fast clock, cancel-write-failure-once, reconcile-race and exact-result-read-failure.
- [ ] **Reset:** confirmed reset only between independent cases; never raw-delete normal DB.
- [ ] **Step 1:** press Back, dismiss. **Expected:** countdown continues, status running, no data change.
- [ ] **Step 2:** confirm before deadline. **Expected:** cancelled once, zero reward, Pet Idle, confirmed
  terminal navigation.
- [ ] **Step 3:** repeat tap/back/reopen. **Expected:** same exact result, no new write/animation.
- [ ] **Step 4:** race cancel just before deadline and completion at deadline. **Expected:** committed
  first valid transition wins; durable row and UI agree.
- [ ] **Step 5:** cancel Long. **Expected:** Long still due after Home/relaunch/additional Focus.
- [ ] **Step 6:** inject write/result-read failure. **Expected:** remain running or error+Retry; no fake result.
- [ ] **Notification cases:** allowed/denied/stale/repeated are `NOT_RUN` for this Story unless shared
  infrastructure already fires; authoritative coverage belongs US-07-05.
- [ ] **Offline/background/relaunch:** offline cancel works; background modal behavior safe; terminal
  reopen does not replay.
- [ ] **Screen reader/large text/Reduce Motion/touch:** modal focus/order/busy state/labels valid;
  actions reachable on iOS and Android.
- [ ] **Cleanup/evidence:** unset fixture; leave no running test session; record automated, owner smoke
  and formal tester separately.

### 10.6. DoR, DoD, evidence và next gate

- [x] **DoR:** US-07-03 accepted; confirmations 03/04 and all Story options approved as Option A.
- [ ] **DoD:** cancel/race/result/recovery matrices pass; report/SHA/guide exist; owner accepts.
- [x] **Evidence files:** `US-07-04_IMPLEMENTATION_PLAN.md`, `US-07-04_IMPLEMENTATION_REPORT.md`,
  `apps/mobile/test/device/break-cancel-result-smoke.md`.
- [x] **Automated gate:** no reward/Pet/cadence regression and both race orders proven in SQLite.
- [ ] **Gate sang US-07-05:** exact implementation SHA đã record; chờ owner quick UI acceptance sau
  Pet crop fix.

## 11. US-07-05 — Notification, analytics hooks, accessibility và Epic integrity

### 11.1. Outcome, dependency và phạm vi

- **User outcome:** Break ends reliably with or without notification permission; tapping a valid or
  stale notification never changes truth, and the whole Break flow remains usable with assistive tech.
- **Priority/order:** `P1`, thứ `5`.
- **Dependency:** US-07-04; `US0700-CONFIRM-05/06`.
- **In scope:** generalize/reuse completion notification port/Expo gateway, typed key/response,
  post-commit local analytics hooks if approved, tap navigation, fixtures, accessibility, all-consumer
  regression, production prototype retirement and Epic exit evidence.
- **Out of scope:** PostHog delivery/network, Settings production controls, formal beta certification.
- **User-visible output:** permission-allowed Break notification; denied/provider failure leaves core
  flow intact; exact safe destination on tap; polished semantic Break UI.

### 11.2. Durable facts, rules và layer ownership

| Concern | Contract |
|---|---|
| Notification read | Settings preference + OS permission via port; running/terminal session by ID. |
| Notification write | OS schedule/cancel only; no SQLite notification receipt. |
| Analytics write | Existing bounded `analytics_events` queue for approved events only; outside session transaction. |
| Core write | None from notification tap; handler invokes reconcile/read through readiness/coordinator. |
| Infrastructure | Extend existing Expo adapter/gateway typed by Focus/Break; stable key `session type + completion + ID`. |
| Presentation | Shared navigation bridge consumes request once and routes confirmed destination. |

Permission/schedule/cancel/queue failure is swallowed as side-effect failure after durable commit.
Stale/repeated/malformed taps do not complete/cancel/reward. Relaunch ensures running notification or
cancels terminal stale key best-effort. Accessibility audit covers all new/extended common consumers;
Reduce Motion preserves textual meaning.

### 11.3. Acceptance criteria

- [ ] Allowed permission schedules at most one exact-deadline Break completion notification.
- [ ] Denied/undetermined/preference-off/provider failure never blocks Start/countdown/terminal truth.
- [ ] Cancel/completion cancels stale schedule best-effort after commit.
- [ ] Tap reconciles/reads durable exact Break and routes only per approved confirmation.
- [ ] Early/stale/repeated/malformed tap cannot create terminal status, reward or duplicate navigation.
- [ ] Notification copy identifies Short/Long completion without implying XP/Coin.
- [ ] Approved local `break_started/completed` events are deterministic, bounded and privacy-safe; no
  cancelled event is invented unless Product later approves it.
- [ ] Production Break routes/screens do not import prototype context/state/control/badge.
- [ ] Common component regression passes for Trial and Standard Focus consumers.
- [ ] Screen reader, largest text, Reduce Motion and touch targets pass source/automated audit;
  unexecuted device cases remain `NOT_RUN`/`DEFERRED`.
- [ ] EPIC-07 exit report binds exact behavior SHA and separates automated/owner/formal evidence.

### 11.4. Automated test checklist

- [ ] Notification adapter key/input/permission/ensure/cancel/response tests for both Focus and Break.
- [ ] Side-effect coordinator Start/terminal/startup/reset and failure-isolation tests.
- [ ] Notification warm/cold/early/stale/repeated tap navigation integration tests.
- [ ] Analytics deterministic ID/allowlist/opt-out/failure/duplicate tests if confirmation 06 selects A.
- [ ] Real SQLite full Break journey and no reward/profile delta assertions.
- [ ] Component/route accessibility and large-text structural tests.
- [ ] Production prototype integrity, boundary, migration immutability, repository hygiene tests.
- [ ] Root typecheck, lint, full tests, device-guide validator, boundary validator and both platform JS
  exports pass at frozen candidate.

### 11.5. Manual UI/device test guide

- [ ] **Mục tiêu:** full Short/Long journey, notification/tap, failure isolation and accessibility.
- [ ] **Preconditions:** exact candidate SHA, compatible Development Build, app identity, iOS/Android
  device/OS metadata, normal DB backup decision and XP/Coin baseline.
- [ ] **Fixture:** finite fast notification, denied, schedule-failure-once, cancel-failure-once,
  queue-failure-once, stale tap and repeated tap scenarios; production session durations stay 5/15.
- [ ] **Reset:** reset OS permission per platform when needed; product data only through confirmed reset;
  fixture databases isolated and cleaned.
- [ ] **Step 1 allowed:** Start Short/Long then background. **Expected:** one correct no-reward completion
  notification; tap opens approved exact destination and one terminal row.
- [ ] **Step 2 denied:** deny permission. **Expected:** no repeat prompt; timer/relaunch/completion works.
- [ ] **Step 3 provider failure:** fail schedule/cancel. **Expected:** bootstrap stays ready, core truth works.
- [ ] **Step 4 early tap:** tap before deadline. **Expected:** same running Break, no terminal/reward.
- [ ] **Step 5 stale/repeated tap:** after terminal/Home tap multiple times. **Expected:** stable exact
  Result/Home per confirmation, no new Break/navigation loop.
- [ ] **Step 6 cancel race:** cancel while notification fires. **Expected:** durable winner only; stale OS
  display cannot change it.
- [ ] **Step 7 offline:** full flow with network unavailable. **Expected:** no core degradation.
- [ ] **Step 8 relaunch:** kill before/after deadline. **Expected:** ensure/cancel best-effort and same truth.
- [ ] **Step 9 accessibility:** VoiceOver/TalkBack reading order, timer non-spam, modal focus, type/duration,
  terminal/no-reward status and CTAs; largest text no clipping; Reduce Motion retains still/text.
- [ ] **Step 10 touch/platform:** all targets minimum platform-equivalent size on iOS and Android;
  foreground/background/lock behavior captured.
- [ ] **Cleanup:** unset every fixture, restore normal notification permission as desired, clear isolated
  DB, verify normal Home has no active session.
- [ ] **Evidence classes:** automated report, owner quick smoke and formal tester report stored separately;
  any unrun case is `NOT_RUN` or `DEFERRED`, never PASS.

### 11.6. DoR, DoD, evidence và Epic gate

- [ ] **DoR:** US-07-04 accepted; confirmations 05/06 approved; dependency/native impact confirmed as
  reuse-only unless plan proves otherwise.
- [ ] **DoD:** all automated/exports pass; manual status honest; prototype production path removed;
  exact SHA/report/exit report created; owner accepts Epic closure explicitly.
- [ ] **Evidence files:** `US-07-05_IMPLEMENTATION_PLAN.md`, `US-07-05_IMPLEMENTATION_REPORT.md`,
  `apps/mobile/test/device/epic-07-exit-smoke.md`, `EPIC-07_EXIT_REPORT.md`.
- [ ] **Exit gate:** only explicit owner acceptance may set `DONE_OWNER_ACCEPTED` and open EPIC-08
  planning; formal deferred status remains explicit.

## 12. Common Component Reuse Matrix

| Story/UI need | Existing component | Decision | Owner | Consumers | Est. line impact | Required regression |
|---|---|---|---|---|---:|---|
| 07-01 Result shell/header | `ScreenShell`, `ScreenHeader` | Reuse | common | Trial, Standard, Home, Break | 0–15 | all current screen snapshots/semantics |
| 07-01 recommendation/status | `Panel`, `InlineNotice`, `LoadingState`, `ErrorState` | Reuse typed composition | common | Standard Result + Break | 0–25 | bootstrap/Trial/Standard error states |
| 07-01 Start/Home actions | `PrimaryButton`, `SecondaryButton` | Reuse; busy label through props | common | all primary flows | 0–20 | button, Trial/Standard CTA tests |
| 07-02/03 Pet | `PetVisualStatus` + approved `breaking` sprite | Reuse unchanged | Pet common | Home, Trial, Standard, Break | 0 | Pet arbitration/playback/fallback |
| 07-03 countdown | `CountdownDisplay` | Extend only if neutral session caption prop insufficient | common | Trial, Standard, Break | 0–25 | all timer consumers, screen reader non-spam |
| 07-04 cancel confirmation | `ConfirmationDialog` | Reuse; no Break-specific duplicate | common | Trial, Standard, Break | 0–20 | busy/dismiss/onRequestClose consumers |
| 07-04 terminal no-reward status | `Panel`, `StatDisplay` or plain semantic text | Reuse; never RewardSummary | Break feature | Break only initially | 25–60 | Standard failed/cancelled no-reward |
| 07-05 navigation status | existing Standard notification bridge/controller pattern | Extend typed shared variant, avoid duplicate bridge | app/presentation common | Focus + Break | 40–100 | Focus notification exact Result/tap |

Feature-local components được phép:

- `BreakRecommendationPanel`: consumer ban đầu Standard completed Result; local vì semantics chỉ thuộc
  Result→Break. Promote common khi EPIC khác có ít nhất consumer thứ hai cho cùng recommendation/action.
- `BreakSessionScreen` và `BreakResultScreen`: feature screens/compositions, không phải common component;
  chúng chỉ bố trí primitives và callback. Tách `BreakSessionSummary` nếu file tiến gần 240–260 dòng
  và summary có boundary độc lập; không tách text wrapper vụn.

## 13. Shared durable fact và command ownership matrix

| Fact/action | Durable owner | Domain owner | Application command/query | Presentation role |
|---|---|---|---|---|
| Completed Standard eligibility | `sessions` exact row | identity validator | load recommendation/StartBreak validation | render CTA only when projection eligible |
| Cadence count/marker | derived SQL from `sessions` | choose Short/Long threshold | `LongBreakCadenceQuery` + recommendation use case | display typed recommendation |
| Long due | Không persist riêng | `count >= 4` | recompute on read/Start | never store in local UI as truth |
| Start Break | inserted `sessions` row | valid type/duration/no reward | `StartBreak` on shared coordinator/transaction | invoke, pending, navigate after commit |
| Remaining time | `endsAt` + current clock | remaining projection | running controller | display tick only |
| Completion | status/resolved timestamps | deadline decision | `ReconcileBreak` | request/read committed result |
| Cancel | status/resolved timestamps | terminal invariant | `CancelBreak` | confirmation then invoke |
| Cadence reset | completed Long Break row | derived marker semantics | existing cadence query | refresh recommendation only |
| Pet Breaking/Idle | no Pet durable row | existing Pet mapping | Pet controller refresh | render projection |
| Notification | OS best-effort only | none | application-owned port/coordinator | handle typed destination only |
| Break analytics | bounded local queue side effect | allowlisted event shape | recorder after fresh commit | no direct capture |

## 14. Navigation/result/break flow matrix

| Source/state | Action/event | Durable effect | Destination | Guard |
|---|---|---|---|---|
| Completed Standard Result | render/relaunch | none | same Result | no auto-start |
| Completed Standard Result | Home | none | Home | cadence remains current |
| Completed Standard Result | Start Break | insert current Short/Long after commit | Break Session | exact eligible source, no active session |
| Failed/cancelled Standard Result | any | no Break | Home/Setup only | no Break CTA |
| Trial Result | any | no Break | onboarding/Home flow | trial excluded |
| Running Break | tick before deadline | none | same screen | display only |
| Running Break | foreground/startup at/past deadline | completed commit | approved terminal destination | reconcile first |
| Running Break | Back/Cancel dismiss | none | same screen | modal transient |
| Running Break | Cancel confirm before deadline | cancelled commit | approved terminal destination | conditional running transition |
| Terminal Break | Home/back | none | Home | no auto Focus |
| Notification tap early | reconcile/read | none if still running | Break Session | exact ID |
| Notification tap terminal | reconcile/read | no extra write | Result/Home per confirmation | exact ID, consume request |
| Notification stale/malformed | none | none | current safe surface/Home | never substitute latest session |

## 15. Error, recovery và race matrix

| Case | Required behavior | Evidence owner |
|---|---|---|
| Cadence query failure/corruption | no default Short; retry/Home; no write | US-07-01 unit/SQLite/UI |
| Preview vs Start cadence change | Start transaction current facts win; UI handoff actual record | US-07-02 |
| Double Start tap | at most one running row and one route | US-07-02 SQLite/controller |
| Concurrent Focus/Trial/Break Start | first valid transaction wins; others typed active conflict | US-07-02 integration |
| Kill after Start commit before navigation | relaunch same Break; no duplicate | US-07-02/03 device |
| Tick + foreground + startup reconcile | serialize/coalesce; one terminal commit | US-07-03 |
| DB fail during completion | rollback/preserve running; recovery; Retry | US-07-03 SQLite/device |
| Cancel before deadline vs completion | first valid conditional commit wins | US-07-04 |
| Cancel at/past deadline | owner-confirmed precedence; durable/UI agree | US-07-04 |
| Duplicate cancel | existing terminal/no-op; no side effect replay | US-07-04 |
| Completed/cancelled Long | completed resets; cancelled remains due | US-07-03/04 cadence integration |
| Notification schedule/cancel fail | ignore after commit; core remains ready | US-07-05 |
| Early/stale/repeated notification tap | durable reconcile/read only; no reward/new Break | US-07-05 |
| Analytics queue fail/duplicate | no core failure; deterministic ID dedupe | US-07-05 if approved |
| Invalid timestamp/row | no normalize/repair/terminal; recovery | US-07-03/04 |

## 16. Accessibility matrix

| Surface | Screen reader | Large text | Reduce Motion/non-color | Touch/input |
|---|---|---|---|---|
| Recommendation | reads Short/Long, duration, due context and both actions | panel/actions wrap and scroll | type stated in text | CTA >=44pt/48dp equivalent |
| Running | timer role/value; no per-second live spam; pending polite once | countdown and cancel reachable | Breaking status text/static pose | Cancel/back deterministic |
| Confirmation | modal title/body/focus order/busy/disabled semantics | buttons stack/wrap | destructive choice not color-only | hardware back dismiss blocked while busy |
| Result | completed/cancelled + zero reward stated | Home action visible in scroll | no reward/status textual, no animation dependency | one clear primary exit |
| Recovery/error | alert + Retry label | no clipped body/action | not color-only | Retry remains reachable |
| Notification | accessible OS title/body where platform supports | OS-owned | copy carries meaning without icon/sound | repeated tap idempotent |

## 17. Automated test strategy

### 17.1. Test pyramid

- [ ] Domain: cadence selection, Break identity, deadline/terminal rules and no reward.
- [ ] Shared Application: recommendation, Start, Reconcile, Cancel, exact Result and coordinator races.
- [ ] Mobile Application/controllers: pending/error/refresh/lifecycle/dispose/navigation handoff.
- [ ] Infrastructure: mapper/repository/query/notification adapter and migration constraint regression.
- [ ] Real SQLite: end-to-end mixed cadence, both types, rollback, race, reopen and zero economy delta.
- [ ] Presentation: completed-only CTA, fixed type/duration, countdown/modal/result/accessibility.
- [ ] Static integrity: no prototype production import, file-size boundary, no schema drift.
- [ ] Root gates at each Story proportional to risk; full `pnpm quality`, exports and diff check at Epic
  candidate.

### 17.2. Required deterministic fixture vocabulary

- [ ] `cadence_0`, `cadence_3`, `cadence_4_due`, `cadence_completed_long_reset`,
  `cadence_cancelled_long_sticky`.
- [ ] `break_start_short`, `break_start_long`, `break_start_conflict`, `break_start_write_failure_once`.
- [ ] `break_running_fast_clock`, `break_completion_write_failure_once`, `break_result_read_failure_once`.
- [ ] `break_cancel_write_failure_once`, `break_cancel_completion_race`.
- [ ] `break_notification_fast`, `permission_denied`, `schedule_failure_once`, `cancel_failure_once`,
  `queue_failure_once`, `early_tap`, `stale_tap`, `repeated_tap`.
- [ ] Fixtures default-absent, Development Build only, finite, typed and unable to bypass production
  command/repository semantics.

## 18. Per-Story DoR/DoD và EPIC-07 exit checklist

### 18.1. Shared Story Definition of Ready

- [ ] Previous Story gate explicitly accepted.
- [ ] Affected confirmation IDs approved; no implicit Option A selection.
- [ ] User-visible outcome, exact source identity and error/recovery path are defined.
- [ ] Durable reads/writes, Domain rule, command/query owner and transaction boundary are named.
- [ ] Schema/dependency/native impact audited; any gap is a blocker before code.
- [ ] Common component matrix and all existing consumers/regressions are listed.
- [ ] Fixture and manual guide avoid unsafe production-data deletion.

### 18.2. Shared Story Definition of Done

- [ ] Story acceptance checklist passes with automated evidence.
- [ ] Output is observable on Development Build and owner status is recorded honestly.
- [ ] Formal tester cases not executed remain `NOT_RUN`/`DEFERRED`.
- [ ] No business/timer/cadence/reward/persistence rule lives in screen/component.
- [ ] No component exceeds 300 lines; 240–260-line files have documented split review.
- [ ] Common changes pass every old Trial/Standard/Home/Pet consumer regression.
- [ ] No Product `OPEN`, prototype behavior or EPIC-08→12 scope is silently promoted.
- [ ] Implementation report, exact SHA, guide and durable before/after evidence are recorded.
- [ ] `git diff --check`, relevant tests, typecheck/lint/boundary/hygiene gates pass.

### 18.3. EPIC-07 exit checklist

- [ ] EPIC-06 remains `DONE_OWNER_ACCEPTED`; accepted behavior regressions pass.
- [ ] Break never auto-starts on Focus completion, Result render or relaunch.
- [ ] Failed/cancelled Focus and trial cannot create Break from Result.
- [ ] Focus 1–3 since marker select Short; fourth and later select Long.
- [ ] Trial/failed/cancelled Focus do not increase cadence.
- [ ] Long due survives Home/relaunch/additional Focus.
- [ ] Cancelled Long does not reset; completed Long resets.
- [ ] Break background/lock/crash/kill cannot fail.
- [ ] Break completion/cancel is race-safe, durable and exact-ID.
- [ ] No Break reward receipt/profile delta/Reward UI/Celebrate/Bugged.
- [ ] Local notification denial/failure/stale/repeated tap cannot change truth.
- [ ] Production Break flow has no prototype authority/fallback.
- [ ] Offline, screen reader, large text, Reduce Motion and touch requirements have recorded status.
- [ ] Full automated gates and both platform JS exports pass at exact candidate.
- [ ] Owner quick smoke and formal tester evidence are clearly separated.
- [ ] EPIC-07 Exit Report exists and owner explicitly authorizes closure/EPIC-08 planning.

## 19. Owner confirmation register

### US0700-CONFIRM-01 — Có enforce tối đa một Break cho mỗi completed Focus không?

Vấn đề: schema hiện tại không liên kết Break với Focus nguồn. Core chỉ khóa Break bắt đầu từ completed
Result sau explicit action, nhưng chưa nói một Result cũ có được mở lại để start thêm Break hay không.

- **Option A — đề xuất mặc định:** không thêm source relation/schema; Start chỉ khả dụng từ currently
  displayed eligible completed Result và one-active invariant. Impact: giữ migration `001`, scope nhỏ;
  không có durable guarantee “một Break/Focus” nếu tương lai deep link/history cho mở Result cũ.
- **Option B:** thêm `source_focus_session_id` và unique/backstop bằng Data Model update + forward
  migration. Impact: enforce bền vững một Break/Focus nhưng mở schema, mapper, migration, reset/query và
  compatibility work; block US-07-02 plan tới khi authority được cập nhật.
- **Option C:** Break không bind Focus source, cho Start từ một resting surface khi không active.
  Impact: mở navigation/scope ngoài EPIC-07 baseline và làm yếu completed-only Result rule; không đề xuất.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-09. Không thêm source relation/schema;
one-active invariant được enforce nhưng không claim durable one-Break-per-Focus cho Result cũ mở lại.

### US0700-CONFIRM-02 — Thời điểm chốt loại Break

- **Option A — đề xuất mặc định:** Result preview đọc current cadence; `StartBreak` đọc lại cadence
  trong serialized transaction và actual committed type thắng nếu facts đổi. Impact: chống stale/race,
  đúng durable current truth; UI cần handoff actual type.
- **Option B:** snapshot type khi Focus completed/Result first loads và giữ tới khi tap. Impact: dễ stale
  qua Home/relaunch/additional Focus; cần durable snapshot nếu muốn reliability.
- **Option C:** chỉ đọc cadence trên Result, Start tin input từ UI. Impact: screen trở thành business-rule
  authority/race-prone; không đề xuất.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-08. Result previews current cadence;
`StartBreak` must read it again inside the serialized transaction and the committed type wins.

### US0700-CONFIRM-03 — Terminal Break đi đâu?

- **Option A — đề xuất mặc định:** completed/cancelled đều mở exact Break Result, rồi user chọn về Home;
  match approved prototype UX evidence. Impact: output rõ, testable, thêm exact Result reader/screen.
- **Option B:** completed mở Result; cancelled về Home ngay sau commit. Impact: ít friction khi cancel
  nhưng outcome handling không nhất quán.
- **Option C:** cả hai về Home trực tiếp với accessible notice. Impact: ít surface hơn nhưng bỏ approved
  prototype Result hierarchy và làm terminal evidence ít trực quan.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10. Completed/cancelled both render exact
Break Result before explicit Home navigation.

### US0700-CONFIRM-04 — Cancel tại hoặc sau deadline

- **Option A — đề xuất mặc định:** command capture time; nếu `capturedAt >= endsAt`, reconcile completed
  và không commit cancelled. Tap trước deadline vẫn có thể cancel nếu command được queue sau. Impact:
  match completion boundary/single-capture pattern của Standard Focus.
- **Option B:** bất kỳ cancel transaction nào lock row trước completion đều thắng, kể cả tap tại/sau
  deadline. Impact: literal commit-first race nhưng user có thể cancel một Break đã hết giờ theo clock.
- **Option C:** disable cancel ở `00:01` buffer. Impact: invent grace/buffer không có Product truth;
  không đề xuất.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10. Captured time at/past deadline resolves
completion; a request captured before deadline remains cancel-eligible while queued.

### US0700-CONFIRM-05 — Notification copy và tap destination

- **Option A — đề xuất mặc định:** title `Phiên nghỉ đã kết thúc`; body nêu Short/Long và mời quay lại;
  tap early → exact Running, terminal → exact Break Result, missing/stale → Home. Impact: consistent với
  existing Focus notification durability and confirmation 03.
- **Option B:** mọi valid tap mở Break route rồi route tự arbitrate. Impact: bridge đơn giản hơn nhưng
  transient route/error flash có thể xuất hiện với stale ID.
- **Option C:** mọi tap về Home. Impact: an toàn/đơn giản nhưng không đưa user tới exact outcome.

**Status:** `PENDING_OWNER`; blocks US-07-05 notification/navigation plan.

### US0700-CONFIRM-06 — Break analytics trong EPIC-07

- **Option A — đề xuất mặc định:** enqueue local deterministic `break_started` sau fresh Start và
  `break_completed` sau fresh completion; không invent `break_cancelled`; provider delivery chờ EPIC-11.
  Impact: dùng allowlist/queue sẵn có, parity Product Core; thêm failure/dedupe tests.
- **Option B:** defer toàn bộ Break analytics hook tới EPIC-11. Impact: EPIC-07 nhỏ hơn nhưng EPIC-11
  phải backfill wiring; crash-window historical events không được backfill.
- **Option C:** thêm `break_cancelled`. Impact: mở event taxonomy chưa có trong Product Core; cần Product
  decision/update trước code.

**Status:** `PENDING_OWNER`; blocks analytics scope of US-07-05 only.

### 19.1. Confirmation approval checklist

- [x] Owner selected Option A for `US0700-CONFIRM-01` on 2026-09-09.
- [x] Owner selected Option A for `US0700-CONFIRM-02` on 2026-09-08.
- [x] Owner selected Option A for `US0700-CONFIRM-03` on 2026-09-10.
- [x] Owner selected Option A for `US0700-CONFIRM-04` on 2026-09-10.
- [ ] Owner selects one option for `US0700-CONFIRM-05`.
- [ ] Owner selects one option for `US0700-CONFIRM-06`.
- [x] Document version/status/schema verdict updated for confirmations affecting US-07-02.

## 20. Known limitations và deferred evidence

- Formal physical-device/VoiceOver/TalkBack/largest-text/Reduce Motion matrices từ EPIC-05/06 vẫn
  deferred; không được kế thừa như PASS.
- EPIC-06 accepted candidate có owner simulator/emulator quick smoke, không phải formal certification.
- Existing SDK 57 patch drift nêu trong EPIC-06 Exit Report vẫn là pre-existing limitation; EPIC-07
  không tự upgrade dependency.
- Device wall-clock change có thể làm Break complete sớm/muộn theo approved offline policy; không thêm
  anti-cheat/backend clock.
- OS có thể không deliver local notification; session truth vẫn reconcile khi app mở.
- Crash sau durable commit trước best-effort analytics/audio/haptic/notification cleanup có thể làm mất
  transient effect/event theo approved MVP policy.
- Nếu confirmation 01 chọn A, durable one-Break-per-Focus guarantee không tồn tại; limitation phải được
  ghi lại trong implementation report/Exit Report.
- `OPEN-006` và `OPEN-009` vẫn `OPEN`, không liên quan trực tiếp và không bị tài liệu này chốt.

## 21. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.9.1 | 2026-09-10 | Codex | Recorded committed/pushed US-07-04 SHA `7cb8310642a80876221c015198b3f51d1251af15`; fixed owner-reported Break Pet animation top-edge artifact via source-frame crop metadata applied consistently to playback and still fallback. Full suite remains green at 148 files / 800 tests; fix awaits owner retest and commit. |
| 0.9.0 | 2026-09-10 | Codex | Recorded US-07-04 worktree implementation and automated/platform PASS: exact cancel/completion winner, same-route cancelled Result, zero reward, Long cadence preservation, recovery fixtures and device guide. Owner/formal device evidence and exact commit SHA remain pending. |
| 0.8.0 | 2026-09-10 | Codex | Recorded owner approval of US-07-04 Option A confirmations and Epic `US0700-CONFIRM-03/04`; opened US-07-04 implementation from exact SHA `b2227cdb7add682f8e49da556f271744da31d62d`. |
| 0.7.0 | 2026-09-09 | Codex | Recorded US-07-03 exact committed SHA and owner quick UI PASS; closed Story 03 and opened owner-gated US-07-04 planning while preserving structured/formal evidence as NOT_RUN. |
| 0.6.0 | 2026-09-09 | Codex | Recorded US-07-03 worktree implementation and automated/platform PASS; owner quick UI, exact committed SHA and US-07-04 gate remain pending. |
| 0.5.0 | 2026-09-09 | Codex | Recorded owner approval of all US0703 Option A confirmations and opened US-07-03 implementation from exact SHA `b6339899003f88e7554b6ea301229af3950d3493`; no-schema/dependency/native scope remains locked. |
| 0.4.0 | 2026-09-09 | Codex | Recorded US-07-02 exact committed SHA and owner quick UI PASS; closed Story 02, opened owner-gated US-07-03 planning, and preserved structured accessibility/formal evidence as NOT_RUN. |
| 0.3.0 | 2026-09-09 | Codex | Recorded owner approval of US0700-CONFIRM-01 Option A through the approved US-07-02 plan; finalized no-schema verdict for Story 02 and opened implementation. Confirmations 03–06 remain gated to their later Stories. |
| 0.2.0 | 2026-09-09 | Codex | Recorded US-07-01 committed SHA and owner quick UI acceptance; opened owner-gated US-07-02 planning while preserving formal/structured manual evidence as NOT_RUN. |
| 0.1.0 | 2026-09-08 | Codex | Audited current documentation/code/test baseline; created five risk-ordered vertical Stories, no-schema default verdict, component/durable/navigation/race/a11y/test matrices, executable per-Story device guides and six pending owner confirmations. No production code was changed. |
