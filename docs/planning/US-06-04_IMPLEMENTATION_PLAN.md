---
document_id: PIXELDORO_US_06_04_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-06-04 Exactly-once completion, reward và committed Result
version: 0.2.0
status: OWNER_APPROVED
implementation_status: IMPLEMENTED_PENDING_OWNER_QUICK_UI
implementation_start_sha: 7d9f93eb496120988bc2f945ec9084de2c58b8a9
approved_by: Dũng Lư
approved_at: 2026-09-04
date: 2026-09-04
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-06
upstream: origin/feats/epic-06
planning_baseline_sha: 14ef3413742df4159aa3a7e537d2fd02667cb203
us_06_03_implementation_sha: 14ef3413742df4159aa3a7e537d2fd02667cb203
us_06_03_acceptance: OWNER_QUICK_UI_ACCEPTED_TO_OPEN_PLANNING
manual_device_status: NOT_RUN_FOR_US_06_04
formal_tester_status: DEFERRED_TO_LATER_PHASE
authority: PLANNING
story_baseline: ./EPIC-06_USER_STORIES.md
previous_story_plan: ./US-06-03_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-06-03_IMPLEMENTATION_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
---

# US-06-04 — Exactly-once completion, reward và committed Result

## 0. Outcome, trạng thái và gates

**Priority P0, execution order 04.** Standard Focus Relax/Strict tới deadline được resolve từ
durable timestamps, cấp đúng reward một lần và mở Result đọc committed facts. Failed/cancelled
tiếp tục zero reward. Overtime, retry, app relaunch hoặc mở lại Result không làm tăng reward.

Owner đã duyệt Option A cho cả 11 confirmations ngày 2026-09-04 và yêu cầu triển khai code.
Implementation bắt đầu trên clean HEAD `7d9f93eb496120988bc2f945ec9084de2c58b8a9`.
Không chạy prebuild/native build, không thêm dependency, không đổi schema/migration hoặc commit/push.

### 0.1. Baseline/readiness đã xác minh

- [x] Branch/upstream: `feats/epic-06` / `origin/feats/epic-06`.
- [x] HEAD và US-06-03 implementation SHA: `14ef3413742df4159aa3a7e537d2fd02667cb203`.
- [x] EPIC-01→05 baseline được bảo toàn qua squash: `658b708…` không là direct ancestor, nhưng
  tree của nó và commit ancestor `4ed76c7` giống hệt nhau:
  `a982443f2b815ab2148248f14b49c83e7319eb29`; content diff rỗng. Không claim direct ancestry pass.
- [x] Working tree sạch trước khi tạo plan; không có owner edit cần ghi đè.
- [x] SHA này chứa fix stale Trial Result redirect và unbound outcome callback khi Cancel.
- [x] Owner báo cáo quick UI done và yêu cầu mở US-06-04 planning.
- [x] Baseline evidence đã ghi trong lượt fix: 106 test files / 515 tests, typecheck/lint và iOS
  bundle 1700 modules. Đây là evidence US-06-03, không phải test pass US-06-04.
- [ ] Full structured manual matrix và formal tester của Story trước chưa hoàn tất.
- [x] Owner duyệt Option A cho `US0604-CONFIRM-01` đến `US0604-CONFIRM-11` trước production edit.

### 0.2. Scope và điều kiện dừng

In scope: pure reward policy; shared Standard reconciliation; atomic completed transaction;
exact-ID terminal reader; completed/failed/cancelled Result; fresh Celebrate/Bugged handoff;
profile refresh; finite development fixtures; race/rollback/reopen evidence.

Out of scope: Break creation/cadence, History/Shop UI, manual Claim, pause/resume, native app
blocking, notification/analytics/audio/haptic provider delivery, schema/dependency/native changes.
US-06-05 sở hữu notification/local analytics hooks và Epic exit; EPIC-07 sở hữu Start Break.

Theo `US0600-CONFIRM-06` đã duyệt, cả ba production Result chỉ có **Về Home** là exit action.
Không đưa prototype Break, disabled “sắp có”, Focus Again hoặc manual Claim vào production.

Nếu cần guaranteed auto-resume Result sau post-commit crash, xem confirmation 07; chưa có quyền
thêm durable presentation marker. Nếu implementation phát hiện gap khác, dừng và hỏi ngay kèm
evidence, lựa chọn và đề xuất; không silently mở rộng scope.

## 1. Authority contract

| Nguồn | Contract bắt buộc |
|---|---|
| Product Core; Gamification Rules | `XP = configured minutes`, `Coin = floor(minutes/5)`; automatic atomic grant; no overtime/partial reward. |
| Timer Engine; Session Lifecycle | Persisted terminal wins; Strict violation wins khi `violationAt <= endsAt`; deadline wins nếu không có winning violation. |
| Data Model | Conditional running transition + unique session receipt + profile delta cùng transaction; no persisted level; no UI repair. |
| Pet State Machine | Fresh committed completed Focus → Celebrate 2000 ms; Strict failed → Bugged 1500 ms; reopen không replay. |
| EPIC-06 approved confirmations | No schema mặc định; retire prototype theo surface; Home-only Result tới EPIC-07; owner quick smoke khác formal evidence. |
| Architecture/ADRs | Domain thuần; Application orchestration; Infrastructure SQL; Presentation chỉ projection/callback; shared coordinator. |

Plan không thay đổi normative specification. Các điểm chưa đủ authority, đặc biệt automatic
post-commit Result restoration ở §6.3, được đưa ra owner confirmation chứ không coi là đã khóa.

## 2. Audit current code: reuse và gap thực tế

Các đường dẫn trong bảng tính từ repository root và tồn tại tại planning baseline.

| Capability | Current implementation | Reuse / gap US-06-04 |
|---|---|---|
| Start/configuration | `packages/application/src/standard-focus/start-standard-focus.use-case.ts`, `standard-focus-record.ts` | Production valid 15–120/step 5, timestamps và local-day key; giữ nguyên. |
| Strict precedence | `packages/domain/src/session/strict-reconciliation.decision.ts` | Reuse pure decision; `completion_due` hiện chưa có completed writer. |
| Standard reconcile | `packages/application/src/standard-focus/reconcile-standard-focus.use-case.ts` | Hiện chỉ nhận Strict; Relax trả `not_owned`; mở rộng cùng authority cho cả hai mode. |
| Shared Strict transaction | `packages/application/src/standard-focus/strict-standard-focus-transaction.ts` | Giữ failed/safe-clear/CAS; completion dùng cùng transaction scope, không acquire coordinator lồng. |
| Atomic pattern | `packages/application/src/onboarding-trial/complete-onboarding-trial.use-case.ts` | Trial có atomic fixed 5/1 grant; reuse pattern/ports, không nới trial invariant thành Standard. |
| Persistence | `session.repository.ts`, `reward-receipt.repository.ts`, `profile.repository.ts` trong `packages/application/src/persistence/` | Đã đủ exact reads, in-transaction reads, transition, receipt insert và progression update. |
| SQLite backstop | `apps/mobile/src/infrastructure/database/migrations/001_initial-schema.migration.ts` | Đã có completed reward CHECK, unique session receipt, reason `focus_completed`, immutable terminal/receipt trigger. Không sửa migration 001. |
| Result query | `packages/application/src/standard-focus/load-standard-focus-cancelled-result.use-case.ts` | Đọc exact ID, chỉ cancelled/failed; chưa đọc receipt/profile hoặc completed. |
| Lifecycle/startup | `standard-focus-lifecycle.controller.ts`, `active-session-startup-reconciliation.adapter.ts` | Barrier có sẵn; chỉ publish fresh failed; cần completed handoff và profile refresh. |
| Runtime outcome | `standard-focus-outcome.controller.ts` | Chỉ failed; consume đã bound-safe. Generalize terminal outcome, giữ exact session identity và no replay. |
| Result UI | `standard-focus-cancelled-result-screen.tsx` | Production cancelled/failed, Home-only; extend/rename thành Standard terminal family. |
| Completed UI | `focus-result-screen.tsx`, `prototype-result-branch.tsx` | Prototype reducer/reward/Break; chỉ reuse hierarchy/copy, không dùng làm production truth. |
| Common reward | `apps/mobile/src/presentation/components/reward-summary.tsx` | Đã production cho Trial, typed committed delta; reuse trực tiếp. |
| Pet feedback | `packages/application/src/pet/pet-terminal-feedback.controller.ts` | Đã support Standard completed; thiếu post-commit bridge từ Standard. |
| Development fixture | `standard-focus-start-review-fixture.ts` | Có fast clock/deadline-pending/Strict/failure decorators; cần receipt/profile/result fixtures. |

### 2.1. Carry-forward regressions từ quick UI

Hai issue vừa fix phải thành regression bắt buộc, không chỉ test business use case:

1. Trial completion projection còn `committed` không được redirect một Standard session sang Trial
   Result. Loading branch cũng không được dùng stale completion để điều hướng.
2. Presentation tách action khỏi controller không làm mất `this`; mount/focus Result với callback
   `consume` phải an toàn cả outcome idle, cancelled, fresh failed và fresh completed.

### 2.2. Schema verdict và giới hạn

Completion/reward persistence không có schema gap: existing tables/ports đủ. Không cần migration,
new reward reason, cached level, “reward granted” flag hoặc analytics receipt để làm core truth.

Schema **không có** marker Result đã xem/chưa xem. Vì vậy “reward sống qua crash” đã có nền tảng,
nhưng “cold start tự mở đúng Result chưa xem đúng một lần” là requirement khác; không được claim
hai việc này tương đương. Confirmation 07 khóa cách xử lý trước implementation.

## 3. Domain và canonical decision

### 3.1. Pure reward policy

Proposed new `packages/domain/src/focus/standard-focus-reward.ts`:

- Nhận configured Standard duration đã validate; validate lại integer/range/step ở public boundary.
- Trả typed immutable `{ xpEarned, coinsEarned }` hoặc typed invalid; không throw/clamp/round input.
- Dùng `xpEarned = durationMinutes`, `coinsEarned = Math.floor(durationMinutes / 5)`.
- Không nhận elapsed time, UI seconds, `now`, profile, mode multiplier hoặc work-tag multiplier.
- Trial vẫn dùng trial-specific validation/reason/5-minute exception; không gọi Standard policy với 5.
- Export qua Domain public API; table test toàn bộ 22 duration hợp lệ từ 15 đến 120.

### 3.2. Reconciliation order

```text
exact session / active session read inside shared transaction
  ├─ foreign type (Trial/Break) → not_owned; không mutate
  ├─ terminal → validate/read exact committed winner; không grant
  └─ running Standard
       ├─ invalid identity/config/timestamp → typed recovery error
       ├─ Strict winning violation → existing failed transaction path
       ├─ now >= endsAt → completed + receipt + profile transaction
       └─ trước deadline → running / safe clear Strict episode
```

Capture `now` một lần sau khi nhận coordinator lease và trước transaction decision. Validate safe
timestamp, `endsAt = startedAt + configuredMinutes*60_000`, profile ID và Standard identity;
không chỉ dựa vào partial `isRunningStandardFocus` guard khi tests/ports trả malformed record.

| Persisted condition | Kết quả |
|---|---|
| Relax trước deadline | Running, no terminal/reward write. |
| Relax đúng/sau deadline | Completed, configured reward một lần. |
| Strict evidence; `now >= violationAt` và `violationAt <= endsAt` | Failed, zero reward; equality vẫn failed. |
| Strict `endsAt < violationAt`, `now >= endsAt` | Completed; late foreground không đảo sang failed. |
| Strict không evidence, deadline tới | Completed; không suy diễn violation. |
| Strict safe return trước cả hai mốc | Existing exact-episode clear rồi tiếp tục. |
| Terminal persisted từ command trước | Winner immutable, không tính lại terminal status. |

## 4. Atomic completion và idempotency contract

### 4.1. Transaction duy nhất

Evolve `ReconcileStandardFocusUseCase`; tạo focused internal completion service thay vì copy toàn
bộ Trial use case hoặc thêm public writer thứ hai. Proposed internal file:
`packages/application/src/standard-focus/complete-standard-focus-transaction.ts` (new).

```text
coordinator.run
  capture now
  transaction.execute(scope)
    read + validate exact running Standard session
    apply Strict precedence / deadline decision
    read profileBefore; validate safe non-negative balances
    calculate reward từ persisted configured duration
    validate safe integer profileBefore + deltas (overflow → rollback)
    generate/validate non-empty receipt ID
    conditional transition running → completed
      resolvedAt = rewardClaimedAt = updatedAt = now
      xpEarned / coinsEarned = Domain reward
    if CAS miss: re-read exact winner, không insert receipt/profile delta
    insert receipt: unique sessionId, reason focus_completed, createdAt = now
    apply profile deltas; require exactly one row updated
    read session/receipt/profileAfter; validate exact postconditions
  commit
  return fresh event / committed outcome
post-commit hydrate → exact Result navigation → best-effort Pet feedback
```

Reward uses configured duration, không dùng `resolvedAt - startedAt`. `resolvedAt` ghi actual
reconciliation timestamp, không backdate thành `endsAt`. Scheduled-end local date/offset và
session identity giữ nguyên để History/cadence tương lai không bị regroup do reconcile muộn.

Strict completed có thể giữ background evidence nếu deadline thắng grace; không clear evidence
sau terminal commit. Reader validate evidence không chứng minh winning violation.

### 4.2. Failure/rollback

- Transition, receipt insert, profile delta, postcondition read hoặc commit fail → không success
  outcome/fresh event; transaction rollback tất cả writes.
- Receipt conflict bất ngờ không được swallow như “đã grant” sau khi transition local thành công.
  Rollback rồi Retry đọc durable winner; tuyệt đối không cộng profile lần hai.
- Profile before/after phải khớp exact deltas trong transaction; không dùng optimistic balance.
- Transaction technical error map sang finite Application error; uncertain persistence dùng
  existing critical recovery/readiness gate, giữ dữ liệu, Retry bootstrap/reconcile.
- Không sửa corrupt data bằng cách insert missing receipt hoặc cộng reward từ Result.

### 4.3. Races và existing terminal

- Session ID là business idempotency key; receipt ID chỉ là identity của một ledger record.
- Conditional miss luôn re-read exact session; missing/invalid winner là error, không success giả.
- Existing completed: validate matching receipt/profile snapshot, trả `existing_terminal`, no write.
- Existing failed/cancelled: retain persisted status, zero reward, no completion event.
- Cancel trước cutoff đã commit thì completion không thắng lại. Cancel đúng/sau deadline không
  được tạo cancelled; existing deadline reconciliation phải tiếp tục, không để UI kẹt ở 00:00.
- Strict Cancel vẫn kiểm tra proven violation trong cùng coordinator/transaction; không bypass grace.
- Deadline/foreground/startup/retry dùng cùng reconciliation service. Không mutex thứ hai và không
  gọi public coordinator-owning use case từ bên trong một coordinator lease khác.

## 5. Committed Result query và view model

Rename generalized loader thành proposed `load-standard-focus-result.use-case.ts`; cập nhật public
exports/consumers/tests trong cùng change. Không giữ tên “cancelled” cho completed family lâu dài.
Old aliases chỉ giữ nếu audit thấy consumer cần migration từng bước; không tạo API song song vô hạn.

### 5.1. Exact identity và consistent snapshot

- Required non-empty `sessionId`; không query latest Trial/Standard terminal để thay thế ID bị thiếu.
- Đọc session, receipt theo session ID và profile trong một read-only transaction snapshot bằng
  existing `TransactionPort`/in-transaction reads. Query không gọi reconcile, grant hoặc update.
- `missing`, `read_failed`, `inconsistent` là các trạng thái riêng; retry chỉ đọc lại đúng ID.
- Validate Standard config, profile identity, duration/timestamps, status và immutable reward facts.
- Completed: `resolvedAt >= endsAt`; session reward đúng Domain formula; claimed time/receipt time
  khớp; receipt reason `focus_completed`; session/profile/receipt ID và deltas khớp.
- Failed/cancelled: reward 0/null và **không có receipt**; retain existing Strict/cancel cutoff rules.
- Profile tồn tại, safe/non-negative. Với completed fresh transaction, validate exact before/after
  delta; với reopened Result, current balances có thể khác sau phiên mới/purchase.
- Không kiểm tra `coinBalance >= coinsEarned` khi reopen: Coin là spendable. Global balance/ledger
  equality thuộc bootstrap verifier và integrity tests, không suy ra từ một receipt đơn lẻ.

### 5.2. Typed model

`StandardFocusTerminalResult` là discriminated union `completed | failed | cancelled`. Common fields:
exact session ID, mode/tag, configured minutes, started/ends/resolved timestamps. Completed thêm
receipt ID, claimed timestamp, committed XP/Coin và current profile totals nếu hiển thị progression.
Failed/cancelled giữ literal zero reward; failed chỉ `strict` và có evidence hợp lệ.

Screen không biết repositories, không nhận “claim”, không tự tính reward/level/Strict precedence.
Nếu hiển thị current totals, copy là **Tiến trình hiện tại**, không gọi đó là balance tại completion.
Level dùng existing derived progression API, không persist hoặc tạo công thức thứ hai.

## 6. Lifecycle, navigation và freshness

### 6.1. One completion flow

- Deadline tick chỉ request `reconcileNow(sessionId)`; pending UI khóa Cancel, không tự set completed.
- Lifecycle foreground giữ barrier tới khi reconcile + committed projections refresh xong.
- Startup adapter dùng cùng Standard reconcile cho Relax/Strict sau trial-owned reconciliation;
  completed commit phải báo `durableDataChanged=true` để bootstrap refresh profile snapshot.
- Runtime completion refresh Home profile qua bootstrap refresh API ngoài transaction; Result,
  Pet và Home không giữ ba balance source khác nhau.
- Generalize `StandardFocusOutcomeController` tới fresh completed/failed; exact session ID luôn đi
  cùng outcome. Route Result consume đúng ID; outcome của session cũ không redirect phiên mới.
- Public callbacks dùng bound functions/stable wrappers; detached action regression bắt buộc.

### 6.2. Pet và post-commit failures

Fresh completion event có session ID, receipt ID, mode, terminal status và committed timestamp.
Chỉ tạo event từ transaction vừa commit, không tái tạo từ Result read/existing receipt.

Refresh Pet active-session projection trước request Celebrate; `rewardCommitted=true` chỉ có sau
atomic commit. Dùng existing feedback controller 2000 ms, dedupe/no-replay/preemption/Reduce Motion.
Failed giữ Bugged 1500 ms; cancelled không terminal animation. User không phải đợi animation mới
được về Home; animation/asset/Pet read failure không rollback reward hoặc retry grant.

Tách post-commit data refresh error khỏi commit failure: giữ exact outcome identity để retry read,
không mất handoff vì refresh Pet thất bại. Không thêm notification/analytics provider trong US-06-04.

### 6.3. Cold restart sau commit — explicit owner decision

Hai trường hợp khác nhau:

1. App khởi động với overdue running session: startup reconcile vừa commit → có fresh outcome
   trong runtime mới → mở exact Result sau barrier; Celebrate có thể chạy theo fresh contract.
2. Session đã commit ở process trước rồi process bị kill trước Result: next startup không còn active
   session và không có runtime handoff. Existing schema không phân biệt Result đã xem/chưa xem.

**Option A đã duyệt tại confirmation 07:** giữ no-schema; trường hợp 2 hydrate đúng profile và về
Home nếu không có exact route identity. Nếu exact Result ID được cung cấp lại (route/development
reopen; future notification/history), đọc same committed reward, no replay. Không tự chọn latest
terminal và không hứa auto-restore một màn hình mà không có durable presentation intent.

Owner đã duyệt clarification này ngày 2026-09-04. Không claim guaranteed auto-restore unseen Result.
Nếu sau này cần durable presentation acknowledgement, phải mở scope/approval riêng theo
`US0600-CONFIRM-02`; implementation hiện tại không đổi schema.

## 7. UI reuse, ownership và line-count plan

| Existing component / consumer | Quyết định và proposed API | Cấm / accessibility | Target estimate |
|---|---|---|---|
| `ScreenShell`, `ScreenHeader` — Trial/Standard | Reuse trực tiếp, status-specific title/copy. | No repository/navigation policy; heading/text wrap. | Không clone; screen 160–230 lines. |
| `Panel`, `InlineNotice` — nhiều screens | Reuse reward/no-reward/error surfaces. | No terminal decision; non-color status text. | Existing common files, stable API. |
| `RewardSummary` — Trial Result | Reuse `xpEarned/coinsEarned` committed values. | No math/claim; grouped reward accessibility label. | Existing 40 lines; ≤80 nếu cần a11y extension. |
| `StatDisplay` — Trial/Standard | Reuse current totals và zero-reward display. | Presentational only; large-text wrap. | No duplicate reward/stat card. |
| `PetVisualStatus` — all session/results | Reuse projection + retry/dismiss callbacks. | No grant/freshness inference; Reduce Motion/still fallback. | Không tạo Pet component mới. |
| Primary/Secondary buttons | Reuse; Home active, retry-read trong ErrorState. | ≥44pt touch target; label không phụ thuộc màu/motion. | Actions feature-local ≤80 nếu cần. |
| `ErrorState`/`LoadingState` | Exact-ID load states; no prototype fallback. | Loading/recovery announcement; no false success. | Reuse trực tiếp. |
| `standard-focus-cancelled-result-screen.tsx` (74 lines) | Rename/extend `standard-focus-result-screen.tsx`, typed union. | Pure layout/callback; no reward/SQL/time rules. | 160–230 lines. |
| `app/focus/result.tsx` (148 lines) | Thin route shell; move Trial/Standard loaders/branches theo trách nhiệm. | Route chỉ wiring/query params; no business logic. | Route ≤80; branch 80–160 each. |
| `focus-result-screen.tsx` (150 lines, prototype) | Isolate/rename prototype screen, remove Standard production fallback. | Không expose mock reward/Break controls trong production. | Preserve later-Epic prototype review explicitly. |

No UI source >300 lines; split review từ 240–260. Không tách fragments vô nghĩa. Shared common API
change phải có tests cho Trial và Standard consumers. Tag-label reuse phải qua stable public API,
không deep import giữa Presentation features. Domain/application services cũng split theo responsibility.

Composition root hiện 833 lines: không tiếp tục nhồi completion logic ở root. Extend existing
`composition/standard-focus/` slice hoặc thêm focused completion wiring helper; không refactor toàn
app chỉ để giảm line count. Root vẫn là wiring, không tính reward hay mutate SQL.

## 8. Execution plan sau approval

| Task | Deliverable / ownership | Depends on | Verification |
|---|---|---|---|
| T01 | Record all confirmations, exact implementation-start SHA, clean-tree overlap check. | Owner approval | No pending material decision. |
| T02 | Pure Standard reward policy + public export. | T01 | All valid durations, invalid/overflow inputs, no overtime input. |
| T03 | Terminal union + shared committed-facts validator. | T02 | Completed/failed/cancelled/foreign/corrupt records. |
| T04 | Internal completed transaction service using existing ports. | T03 | Write ordering, exact deltas, all rollback points, CAS miss. |
| T05 | Evolve Standard reconcile Relax+Strict; preserve Strict helper and Cancel boundaries. | T04 | Deadline/violation equality and races; no nested lease. |
| T06 | Generalized exact-ID Result query/controller, read-only consistent snapshot. | T03–05 | Receipt/profile mismatches, no mutation, reopen after spend. |
| T07 | Generalize outcome handoff/lifecycle/startup; refresh bootstrap profile. | T05–06 | Foreground/deadline/startup, stale identity, refresh failure. |
| T08 | Fresh Celebrate bridge, preserve Bugged/no replay. | T07 | Fresh/existing/preempted/Reduce Motion/Pet failure. |
| T09 | Standard Result family/route split and prototype retirement. | T06–08 | Three variants, Home-only, loading/error, callbacks bound. |
| T10 | Finite review fixtures and quick UI guide. | T05–09 | Production Start, fast clock, one-shot failures, disabled outside dev. |
| T11 | Real SQLite completion integration matrix. | T04–10 | Atomicity, duplicate/race, reopen, ledger/profile consistency. |
| T12 | Full quality, iOS JS export, scope audit and report. | T11 | Exact commands/runtime/results and no unintended files. |
| T13 | Owner quick UI, fix issues, record exact final SHA and acceptance. | T12 | Open US-06-05 only after acceptance. |

### 8.1. Target ownership areas

- Domain: `packages/domain/src/focus/standard-focus-reward.ts` and test (new), public index.
- Application Standard: new completion transaction/committed validator; evolve reconcile/result
  use cases, result types and exports; focused Cancel regressions, không duplicate writer.
- Existing persistence ports/repositories: reuse; chỉ extend query port nếu consistent snapshot cần
  capability thực sự thiếu. Không DDL/trigger/migration/lock change.
- Mobile controllers: `apps/mobile/src/application/standard-focus/`, first-use entry; bound actions.
- Composition: existing Standard slice, startup adapter, focused feedback/profile refresh wiring.
- Presentation: `app/focus/result.tsx`, `session.tsx`, Standard result branch/screen, provider hooks;
  reuse common reward/Pet/status components, keep prototype separately labelled.
- Tests: new `apps/mobile/test/integration/standard-focus-completion.integration.test.ts` and
  `apps/mobile/test/device/standard-focus-completion-smoke.md` (đã tạo).
- Evidence: [US-06-04 Implementation Report](./US-06-04_IMPLEMENTATION_REPORT.md).

## 9. Acceptance checklist — automated/source evidence; UI owner pending

- [x] Valid Standard Relax/Strict completion được decide từ persisted timestamps, không từ UI value.
- [x] Mọi valid duration nhận exact configured XP và floor Coin, không overtime/multiplier.
- [x] Session completed fields, unique receipt và profile increment commit atomically.
- [x] Before/after profile postcondition và safe integer validation pass.
- [x] Duplicate/retry/CAS miss/receipt conflict không grant hai lần; terminal winner immutable.
- [x] Strict equality failed; deadline-before-violation completed; missing evidence no false fail.
- [x] Cancel cutoff/race vẫn đúng và deadline pending đi tới reconciliation, không kẹt UI.
- [x] Result đọc exact committed session/receipt/profile; no mutation/Claim/latest fallback.
- [x] Failed/cancelled zero reward, receipt absent, no Break/celebration.
- [x] Completed Home-only, common RewardSummary, truthful current totals nếu hiển thị.
- [x] Fresh outcome survives post-commit read failure trong runtime; existing result không replay.
- [x] Startup behavior theo confirmation 07 được ghi và test đúng, không overclaim restore.
- [x] Home profile refresh sau completion; Result reopen không làm totals tăng.
- [x] Trial→Standard routing và detached outcome callback regressions pass.
- [x] No schema/dependency/native/notification/analytics/Break scope leak.

## 10. Automated và real SQLite matrix

| Layer | Cases bắt buộc |
|---|---|
| Domain | 22 valid durations; NaN/Infinity/non-integer/out-of-range/wrong-step; exact formula; reward không nhận elapsed/mode multiplier. |
| Reconcile | Relax before/equal/after; Strict all grace/deadline precedence; no active; foreign type; malformed config/timestamp; terminal winner. |
| Transaction | Transition fail, CAS miss, receipt fail/conflict, profile missing/write miss, post-read fail, commit fail; no fresh event before commit. |
| Idempotency | Same exact ID twice; concurrent deadline/foreground; duplicate startup/retry; Cancel-first/completion-first/Strict-failure-first. |
| Result query | Wrong/missing ID, running/Trial/Break rejection; receipt missing/wrong reason/delta/profile/time; zero-result unexpected receipt; current balance after spend. |
| Controllers/routes | Stable bound callbacks; outcome consume exact ID; stale Trial committed cannot redirect Standard; loading/error never prototype reward; mounted/disposed async guards. |
| Pet | Fresh completed once, existing receipt no Celebrate, fresh failed once, cancelled none; current active preempts old feedback; asset failure/Reduce Motion non-blocking. |
| SQLite | Production migration/repositories/transaction; session + receipt + profile exact facts; failure after each write rollback; close/reopen; durable ledger equality. |
| Regressions | Trial fixed 5/1 and no standard analytics; Start, Relax/Strict, cancel, confirmed reset, Pet lifecycle, derived history/cadence queries, repository boundaries. |

SQLite scenarios must use valid production Start, not insert a fake sub-15-minute Standard record.
Assert receipt count per session is one; failed/cancelled receipt count zero; profile delta exact;
`totalXp = SUM(reward.xpDelta)` and Coin includes purchase deltas. Reopen a completed Result after a
real purchase fixture to prove a lower current Coin balance is not misclassified as corruption.

Quality gate uses pinned Node `22.23.2` / pnpm `11.24.0`: typecheck, lint, root Vitest suite, device
harness validation, boundaries, repository hygiene, `git diff --check`, iOS JS export. Native build
and prebuild remain out of scope. A checklist validator is not a device test.

## 11. Manual UI guide và evidence

### 11.1. Preconditions / fixture contract

- Record exact implementation SHA, simulator/device model, OS, development build version and
  fixture name. User quick smoke, automated and formal tester results are separate evidence classes.
- Finish/dừng current test session through normal UI. Full reset chỉ dùng approved Development
  Build confirmation trên disposable test data; không ad-hoc SQL hoặc xóa app data của owner.
- Complete Trial → Vào Pet Room once; record initial profile XP/Coin (fresh trial baseline 5/1).
- Fixtures đã triển khai: `standard_completion_fast_clock`, `standard_completion_receipt_failure_once`,
  `standard_completion_profile_failure_once`, `standard_completion_result_read_failure_once`; clock x30.
  Dev exact-ID reload trên Result chỉ đọc, không grant/replay; duplicate reconcile được test tự động.
- Clock acceleration phải nhất quán cho Start/tick/lifecycle/reconcile. Cold-start test dùng persisted
  valid record và controlled clock, không giả rằng in-memory acceleration anchor sống qua process kill.

### 11.2. Quick owner smoke

1. Tạo `15 phút / Relax / Học tập` bằng production Setup với fast clock. Start phải vào countdown
   ngay, không quay lại Trial Result. Tới deadline tự mở completed Result.
2. Kiểm tra `+15 XP / +3 Coin`, no Claim, Home-only. Fresh baseline 5/1 phải thành 20/4 khi về Home.
3. Mở lại exact Result bằng dev reopen entry: same reward/receipt, không cộng thêm, không Celebrate
   lại. Reload và kiểm tra totals vẫn giữ; startup routing theo confirmation 07.
4. Tạo Strict valid session rồi return trong grace: tiếp tục; dùng boundary fixture deadline trước
   violation: completed. Separate equality/violation-before-deadline fixture: failed, 0/0.
5. Tạo phiên mới, bấm Dừng → dismiss: vẫn chạy. Bấm Dừng → confirm trước cutoff: cancelled Result,
   0/0, Home-only, không crash `disposed`/không tạo reward.
6. Chạy receipt/profile failure once: không success/reward giả; Retry đi qua recovery và chỉ có một
   reward sau khi transaction thành công. Không dùng Result reopen làm Retry grant.
7. Quay Home rồi tạo phiên mới ngay: outcome/Trial Result cũ không chiếm route mới.

Mỗi bước ghi pass/fail + ảnh/video và sanitized before/after facts khi có. Quick smoke không đủ để
tick toàn bộ §9/§10; owner có thể gate progression theo approved strategy, formal tester vẫn deferred.

### 11.3. Extended matrix

- Samples 25 phút → 25/5 và 120 phút → 120/24; late reconcile không thưởng overtime.
- Background/relaunch trước và sau deadline; Strict missing evidence và exact equality.
- Deadline + foreground concurrent; kill trong transaction; kill sau commit trước Result; reopen
  exact ID theo selected recovery contract. Không gộp ba crash windows thành một “relaunch pass”.
- Offline throughout; no notification permission/provider cần thiết để reward đúng.
- Screen reader đọc terminal status + grouped reward + Home; không announce countdown mỗi giây.
- Largest text không cắt reward/CTA; Reduce Motion vẫn hiểu completed/failed, Home luôn usable.
- Pet/asset/Result read failure sau commit không làm reward rollback hoặc bị grant lần hai.

Cleanup: tắt fixture và reload; xác nhận production mode không có fast clock/failure injection;
chỉ reset disposable data có confirmation. Lưu evidence outside production asset bundles; không log
database path, private data hoặc toàn bộ database không cần thiết.

## 12. Risks và mitigation

| Risk | Mitigation |
|---|---|
| Hai completion writers cho Relax/Strict/Trial | One Standard reconcile service, existing Trial typed ownership; shared coordinator, no nested lease. |
| Commit completed trước reward ngoài transaction | One scope, fail-return rollback, real SQLite kill/failure matrix. |
| Late foreground đảo completed thành failed | Strict precedence trước completed; persisted terminal immutable. |
| UI đọc stale profile sau completion | Bootstrap/profile refresh sau commit, exact Result query; no local balance math. |
| Post-commit refresh fail bị hiểu là grant fail | Typed committed identity retained, read-only retry; Pet errors isolated. |
| Result reopen kiểm tra Coin sai vì đã spend | Current balance khác per-session reward; ledger consistency không dùng lower-bound receipt. |
| Stale Trial/outcome route hoặc unbound callback | Regression từ US-06-03 ở route/action boundary, không chỉ controller direct call. |
| Overclaim crash Result restore | Confirmation 07 explicit, không có latest-terminal heuristic/hidden schema. |
| Prototype completed/Break lọt production | Parameterized Standard Result fail closed; isolate prototype review. |
| UI/composition tăng trách nhiệm | Reuse common primitives, focused branch/helper boundaries, line-count gate. |

## 13. Owner confirmations — APPROVED 2026-09-04

Owner đã duyệt Option A cho toàn bộ confirmations dưới đây; các product rules đã khóa không
được mở lại bằng option vi phạm invariant. Option B dưới đây là alternative về scope/design cần
review, không phải implementation mặc định.

### US0604-CONFIRM-01 — Reward Domain và configured duration

- **A (đề xuất):** pure Standard reward policy, reject invalid duration; Trial giữ exception riêng.
- **B:** trước hết trích generic Focus reward policy và migrate Trial cùng lúc, vẫn validate variant.
- **Trade-off:** A ít regression và đúng vertical owner; B reuse rộng hơn nhưng tăng scope Trial.
- **Chưa duyệt:** chưa khóa Domain API và regression surface.
- [x] Owner selected option: A — 2026-09-04.

### US0604-CONFIRM-02 — Một Standard reconciliation authority

- **A (đề xuất):** evolve existing reconcile cho Relax/Strict, internal completion service dùng same
  scope; Strict decision/helper và Cancel precedence giữ nguyên.
- **B:** facade dispatcher tới typed Relax/Strict internal strategies cùng coordinator/transaction.
- **Trade-off:** A tận dụng seam hiện có; B thêm abstraction nếu branching thực tế lớn hơn dự kiến.
- **Chưa duyệt:** không thêm completed writer hoặc thay lifecycle/startup wiring.
- [x] Owner selected option: A — 2026-09-04.

### US0604-CONFIRM-03 — Atomic grant và timestamp/postcondition

- **A (đề xuất):** session transition → unique receipt → profile delta → re-read postconditions cùng
  transaction; resolved/claimed/receipt time là captured reconciliation `now`; rollback mọi failure.
- **B:** same invariant nhưng dùng một Infrastructure aggregate command chuyên completed grant.
- **Trade-off:** A reuse existing ports và test từng failure boundary; B cần API mới và adapter lớn hơn.
- **Chưa duyệt:** chưa triển khai completion transaction. Không option nào cho phép partial commit.
- [x] Owner selected option: A — 2026-09-04.

### US0604-CONFIRM-04 — Idempotency và race winner

- **A (đề xuất):** CAS miss re-read exact winner; existing completed validate receipt và no write;
  unexpected receipt conflict rollback; shared coordinator + SQLite unique/transaction backstop.
- **B:** thêm explicit operation-token abstraction nhưng vẫn dùng session ID làm reward key.
- **Trade-off:** A đủ current local architecture, ít state; B thêm abstraction không thay durable key.
- **Chưa duyệt:** chưa khóa retry/race outcome types; không làm retry theo receipt ID mới.
- [x] Owner selected option: A — 2026-09-04.

### US0604-CONFIRM-05 — Exact Result và profile consistency

- **A (đề xuất):** generalized union/loader, read-only transaction snapshot session+receipt+profile;
  receipt invariant strict; current totals không bị so như balance-at-completion; no repair/Claim.
- **B:** Result chỉ hiển thị session reward, current totals chỉ ở Home; vẫn verify receipt/profile.
- **Trade-off:** A cho thấy progression như Trial và cần current-totals label; B UI gọn hơn.
- **Chưa duyệt:** chưa khóa Result view model/UX. Không latest-session fallback.
- [x] Owner selected option: A — 2026-09-04.

### US0604-CONFIRM-06 — Fresh completion handoff và Pet

- **A (đề xuất):** generalize runtime outcome tới completed/failed, retain exact ID qua refresh
  failures, Celebrate chỉ từ fresh atomic commit; existing/reopen no replay, cancelled none.
- **B:** focused Standard completion controller tách riêng, adapter hợp nhất navigation outcome.
- **Trade-off:** A ít controller/state hơn; B hữu ích nếu lifecycle helper vượt một trách nhiệm.
- **Chưa duyệt:** chưa wire completed navigation/Pet; không infer freshness từ receipt existence.
- [x] Owner selected option: A — 2026-09-04.

### US0604-CONFIRM-07 — Post-commit cold restart / Result restoration

- **A (đề xuất, cần owner xác nhận UX clarification):** no schema; fresh runtime/startup completion
  opens exact Result. Prior-process committed session không có route ID thì cold start về Home với
  correct totals; exact-ID reopen vẫn đọc same reward/no replay. Không bảo đảm auto-open unseen Result.
- **B:** yêu cầu guaranteed auto-restore unseen Result; làm bounded spike và owner review durable
  presentation acknowledgement/state restoration trước code, có thể cần migration mới.
- **Trade-off:** A giữ approved no-schema và không lặp Result cũ mỗi lần mở app; B UX recovery mạnh
  hơn nhưng là capability chưa có, không thể giả lập bằng latest terminal hoặc rewardClaimedAt.
- **Chưa duyệt:** implementation gate đóng. Không tự coi A là cách diễn giải specification đã được duyệt.
- [x] Owner selected option: A — 2026-09-04.

### US0604-CONFIRM-08 — Result actions / Break boundary

- **A (đề xuất):** Home-only cho cả ba variants theo `US0600-CONFIRM-06`; Start Break chờ EPIC-07;
  không Focus Again/disabled placeholder/Claim. New session được tạo từ Home→Setup.
- **B:** xin amend previous UX decision để thêm “Thiết lập phiên mới” cho failed/cancelled.
- **Trade-off:** A giữ approved baseline; B giảm thao tác nhưng đổi action contract và cần regression thêm.
- **Chưa duyệt:** chưa đổi Result actions; prototype Break không bao giờ là production option.
- [x] Owner selected option: A — 2026-09-04.

### US0604-CONFIRM-09 — UI reuse và prototype retirement

- **A (đề xuất):** extend/rename production Standard result family, reuse common RewardSummary/Pet,
  split route theo branch; isolate prototype screen và remove Standard fallback.
- **B:** migrate prototype Result component hoàn toàn sang typed production props rồi tách review adapter.
- **Trade-off:** A giữ tested failed/cancelled path; B giảm hai layouts nhưng đụng nhiều prototype controls.
- **Chưa duyệt:** chưa đổi common API/prototype routes; hard max UI 300 lines giữ nguyên.
- [x] Owner selected option: A — 2026-09-04.

### US0604-CONFIRM-10 — Recovery và side-effect boundary

- **A (đề xuất):** uncertain durable failure vào existing critical recovery; post-commit read retry
  giữ exact identity; Pet failure non-blocking. Notification/analytics/audio/haptic delivery chờ owner Story.
- **B:** thêm feature-local completion recovery controller trước khi escalate critical recovery.
- **Trade-off:** A reuse safe-readiness contract; B nhiều state hơn và cần chứng minh không mở mutation sớm.
- **Chưa duyệt:** chưa khóa recovery UX; không thêm provider hoặc grant từ Retry Result.
- [x] Owner selected option: A — 2026-09-04.

### US0604-CONFIRM-11 — Fixtures, verification và no-schema scope

- **A (đề xuất):** valid production Start + consistent accelerated clock + one-shot receipt/profile/
  read failures; real SQLite/full quality/iOS export; owner quick UI gate, formal tester deferred;
  no schema/dependency/native change trừ khi confirmation 07 chuyển sang spike được duyệt riêng.
- **B:** chỉ real-time manual sessions, vẫn giữ automated integrity matrix và same scope constraints.
- **Trade-off:** A nhanh và reproduce boundary/race tốt; B ít fixture code nhưng chậm/khó lặp failure.
- **Chưa duyệt:** không thêm dev fixture hoặc claim device pass.
- [x] Owner selected option: A — 2026-09-04.

## 14. Definition of Ready / Done

### Ready trước code

- [x] US-06-02/03 progression acceptance và baseline đã xác minh.
- [x] Current code/schema/UI audit và target ownership ghi trong plan.
- [x] Authority, known limitations, manual guide và confirmations được lập.
- [x] Owner khóa toàn bộ 11 confirmations Option A, gồm 07.
- [x] Record exact implementation-start SHA `7d9f93eb496120988bc2f945ec9084de2c58b8a9`; clean tree.
- [x] Option A không cần scope/schema/dependency mới.

### Done sau implementation

- [x] Automated/SQLite evidence ghi tại report; device/manual tách riêng và chưa chạy.
- [x] Common consumers và routing/detached-callback regression tests pass.
- [ ] Exact committed implementation SHA, report và owner acceptance được ghi.
- [x] Manual checklist không tick thay owner; formal vẫn deferred.
- [x] No unapproved schema/dependency/native/Break/provider change.
- [ ] US-06-04 accepted trước US-06-05 planning/implementation.

## 15. References

- [EPIC-06 User Stories](./EPIC-06_USER_STORIES.md)
- [US-06-03 Plan](./US-06-03_IMPLEMENTATION_PLAN.md)
- [US-06-03 Report](./US-06-03_IMPLEMENTATION_REPORT.md)
- [Product Core](../PIXELDORO_CORE_TRUTH.md)
- [Approved UX Prototype](./EPIC-03_UX_PROTOTYPE_PLAN.md)
- [Timer Engine](../specifications/timer-engine.md)
- [Session Lifecycle](../specifications/session-lifecycle.md)
- [Gamification Rules](../specifications/gamification-rules.md)
- [Pet State Machine](../specifications/pet-state-machine.md)
- [Data Model](../architecture/data-model.md)
- [System Architecture](../architecture/system-architecture.md)
- [Project Structure](../architecture/project-structure.md)
- [ADR-002 Navigation](../architecture/decisions/ADR-002-navigation-with-expo-router.md)
- [ADR-003 State/Persistence](../architecture/decisions/ADR-003-state-and-persistence.md)
- [ADR-004 Domain/Platform](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md)

## 16. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.2.0 | 2026-09-04 | Codex | Recorded all 11 Option A approvals, start SHA, implementation candidate, automated evidence and manual handoff; no commit/owner acceptance inferred. |
| 0.1.0 | 2026-09-04 | Codex | Created owner-gated completion/reward/Result plan on accepted US-06-03 SHA; documented 11 pending confirmations, crash-restoration decision, reuse, transaction and evidence matrices. |

## 17. Historical planning-only validation (trước owner approval)

- [x] HEAD/tree đã kiểm tra tại đầu lượt; chỉ bốn planning documents được thay đổi/tạo.
- [x] Relative Markdown links trong bốn documents đều resolve tới file tồn tại.
- [x] Confirmation IDs liên tục 01–11, tất cả owner decisions còn `PENDING`.
- [x] Acceptance US-06-04 chưa tick; chỉ planning/readiness evidence được ghi nhận.
- [x] Scope/sequence giữ US-06-04 sau accepted US-06-03, trước US-06-05; Break chờ EPIC-07.
- [x] `git diff --check` pass; không sửa production/schema/dependency/native artifact.
- [ ] Runtime/full quality/device US-06-04 chưa chạy vì đây là documentation-only planning.

**US-06-04 implemented as an uncommitted candidate under approved Option A; owner quick UI and acceptance pending.**
