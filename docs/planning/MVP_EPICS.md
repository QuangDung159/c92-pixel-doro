---
document_id: PIXELDORO_MVP_EPIC_BREAKDOWN
title: PixelDoro Mobile MVP — Epic Breakdown
version: 0.1.0
status: DRAFT_FOR_REVIEW
last_updated: 2026-08-27
owner: Dũng Lư
language: vi
scope:
  - mobile_mvp
  - product_planning
  - epic_breakdown
authority: PLANNING
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
timer_engine_baseline: ../specifications/timer-engine.md
session_lifecycle_baseline: ../specifications/session-lifecycle.md
pet_state_machine_baseline: ../specifications/pet-state-machine.md
gamification_baseline: ../specifications/gamification-rules.md
---

# PixelDoro Mobile MVP — Epic Breakdown

## 0. Mục đích

Tài liệu này chia phạm vi PixelDoro Mobile MVP thành các Epic để chuẩn bị tạo User Story và Task cho mô hình solo developer.

Tài liệu này:

- Chỉ sử dụng requirement đã `LOCKED`, `MVP_DEFAULT`, `BASELINE`, `RESOLVED` hoặc nằm trong tài liệu `APPROVED`.
- Không tự biến Product decision `OPEN`, nội dung `DEFERRED` hoặc roadmap sau MVP thành requirement.
- Chia Epic theo user outcome/product capability; screen và technical layer chỉ là implementation surface.
- Dùng checklist để theo dõi planning và implementation evidence.
- Không thay thế Product Core, architecture baseline hoặc specification đã duyệt.

Nếu có mâu thuẫn, tài liệu có authority cao hơn được ưu tiên theo thứ tự đã định nghĩa trong Product Core và Data Model.

## 1. Convention chia Epic

### 1.1. Hierarchy

```text
Mobile MVP
  → Epic: một outcome/capability lớn
      → User Story: một vertical slice có giá trị và kiểm thử được
          → Task: Domain / Application / Infrastructure / Presentation / Test
```

### 1.2. Quy tắc cho solo developer

1. Tại một thời điểm chỉ có tối đa một Epic implementation ở trạng thái `IN_PROGRESS`.
2. Epic được thực hiện theo dependency order; không mở nhiều workstream song song.
3. Enabler Epic chỉ xây đủ nền tảng cho Product Epic gần nhất, không chuẩn bị sớm cho scope `DEFERRED`.
4. User Story phải là vertical slice khi có thể; không tạo Story riêng chỉ mang tên “UI”, “Database” hoặc “Business Logic”.
5. Technical layer được tách thành Task bên dưới Story, trừ khi đó là enabler có acceptance độc lập.
6. Không estimate hoặc cam kết thời gian Epic trước khi các Story chính được refine.
7. Mỗi Epic phải có outcome, scope, dependency, decision gate và completion checklist rõ ràng.
8. Documentation approval không thay thế code/test/device evidence.

### 1.3. Trạng thái checklist

- `[ ]`: Chưa hoàn thành hoặc chưa có evidence.
- `[x]`: Hoàn thành và đã có evidence phù hợp.

Nếu đang thực hiện, trạng thái được quản lý ở planning tool/issue tracker; checkbox chỉ được đánh dấu khi item hoàn tất.

## 2. MVP Epic overview

Thứ tự dưới là implementation sequence mặc định cho solo developer.

- [ ] `EPIC-01` — Thiết lập nền tảng Mobile và delivery pipeline.
- [ ] `EPIC-02` — Xây dựng durable local data, migration và safe bootstrap.
- [ ] `EPIC-03` — Xây dựng Timer/Session Core đáng tin cậy.
- [ ] `EPIC-04` — Xây dựng Home/Pet Room và Pet companion projection.
- [ ] `EPIC-05` — Hoàn thành first-use onboarding trial.
- [ ] `EPIC-06` — Hoàn thành Standard Focus experience.
- [ ] `EPIC-07` — Hoàn thành Break experience và Long Break cadence.
- [ ] `EPIC-08` — Hoàn thành progression, shop và inventory loop.
- [ ] `EPIC-09` — Hoàn thành history và contribution graph.
- [ ] `EPIC-10` — Hoàn thành settings, device feedback và local-data control.
- [ ] `EPIC-11` — Hoàn thành product analytics, feedback integrity và store review.
- [ ] `EPIC-12` — Hardening, device validation và closed-beta delivery.

## 3. Dependency map

```text
EPIC-01 Mobile Foundation
    ↓
EPIC-02 Durable Data & Bootstrap
    ↓
EPIC-03 Timer & Session Core
    ├──────────────→ EPIC-04 Pet Companion
    │                    ├────────→ EPIC-05 Onboarding Trial
    │                    ├────────→ EPIC-06 Standard Focus
    │                    │              └────→ EPIC-07 Break & Cadence
    │                    └────────→ EPIC-08 Progression & Shop
    ├─────────────────────────────→ EPIC-09 History
    └─────────────────────────────→ EPIC-10 Settings & Data Control

EPIC-05/06/09/10
    └─────────────────────────────→ EPIC-11 Analytics & Store Review

EPIC-01 đến EPIC-11
    └─────────────────────────────→ EPIC-12 Beta Readiness
```

Dependency map thể hiện điều kiện hoàn thành, không cấm prototype UI sớm. Prototype không được xem là committed product truth hoặc Epic completion evidence.

## 4. Product decision gates

Ba decision sau vẫn `OPEN` và không được Epic này tự chốt:

| Gate | Decision | Epic bị ảnh hưởng trực tiếp | Milestone phải chốt |
|---|---|---|---|
| `GATE-PET-IDENTITY` | `OPEN-001` — Pet mặc định là Cat, Dog hay Robot | `EPIC-04`, `EPIC-05`, asset production trong `EPIC-12` | Trước khi chọn/tích hợp production Pet asset. |
| `GATE-CONTRIBUTION-COLOR` | `OPEN-006` — Ngưỡng màu contribution graph | `EPIC-09`, visual QA trong `EPIC-12` | Trước khi khóa contribution visual design. |
| `GATE-PET-NAMING` | `OPEN-009` — Có cho đặt tên Pet trong onboarding hay không | `EPIC-05`, schema/migration liên quan | Trước khi khóa onboarding UX hoặc thêm Pet-name field. |

Trong khi gate chưa chốt:

- Được dùng neutral placeholder/fallback để phát triển phần không phụ thuộc decision.
- Không seed species/name, không khóa artwork và không viết acceptance test giả định một phương án.
- Không coi placeholder là production decision.

## 5. Epic definitions

### EPIC-01 — Mobile Foundation và Delivery Baseline

**Loại:** Enabler  
**Outcome:** Solo developer có workspace tái lập được, chạy development build trên iOS/Android và có quality/delivery baseline đúng kiến trúc đã duyệt.  
**Dependency:** Không.  
**Story breakdown:** [`EPIC-01_USER_STORIES.md`](./EPIC-01_USER_STORIES.md).
**Nguồn chính:** Technical Overview, System Architecture, Project Structure, ADR-001 đến ADR-008.

**In scope:**

- `pnpm` workspace với `apps/mobile`, `packages/domain`, `packages/application`.
- Expo SDK 57.x, React Native 0.86.x, React 19.2.3 và Node.js 22 LTS theo baseline.
- Expo Router typed routes tại `apps/mobile/src/app`.
- TypeScript strict mode, package exports và import-boundary enforcement.
- Manual dependency injection và mobile composition root skeleton.
- Unit/integration/device test structure và runner tương thích toolchain.
- Development/preview/production EAS profiles, `runtimeVersion` policy và channel boundary.
- Reanimated + bundled sprite baseline; chưa cài Skia.

**Epic completion checklist:**

- [ ] Workspace layout và package dependency direction khớp Project Structure.
- [ ] Root scripts chạy được typecheck, lint và test theo workspace.
- [ ] Forbidden imports giữa Domain/Application/Presentation/Infrastructure bị CI phát hiện.
- [ ] Mobile development build khởi động được trên ít nhất một iOS target và một Android target.
- [ ] Composition root là nơi duy nhất biết concrete dependency graph.
- [ ] Route files chỉ làm composition, không chứa business rule hoặc SDK/database access.
- [ ] Development, preview và production build/update boundary được cấu hình.
- [ ] Native dependency/config change không thể bị phát hành nhầm chỉ bằng OTA.
- [ ] Signing secret/credential không được commit vào repository.
- [ ] Skia không nằm trong baseline dependency khi chưa vượt ADR-005 gate.

**Out of scope:** Desktop app, backend, cloud sync, DI container, Turborepo/Nx và abstraction chỉ phục vụ future scope.

---

### EPIC-02 — Durable Local Data, Migration và Safe Bootstrap

**Loại:** Enabler  
**Outcome:** Ứng dụng có durable source of truth nhất quán, migrate/seed an toàn và không mất dữ liệu khi bootstrap hoặc database gặp lỗi.  
**Dependency:** `EPIC-01`.  
**Nguồn chính:** Data Model 1.0.0, System Architecture, ADR-003.

**In scope:**

- SQLite connection, transaction implementation, repository/mappers và migration framework.
- Toàn bộ table, enum, constraint, index và trigger normative trong Data Model.
- Singleton installation/settings/profile seed.
- Exact 12-item catalog seed.
- Startup migration + reconciliation barrier.
- Typed database/migration recovery projection.
- Confirmed full local-data reset transaction.
- Durable queries cho history, cadence, store-review eligibility và economy consistency để các Epic sau sử dụng.

**Epic completion checklist:**

- [ ] Initial migration tạo đúng toàn bộ schema normative.
- [ ] Foreign key, one-running-session index và terminal immutability được enforce.
- [ ] Exact catalog có đúng 12 item, ID/name/category/price theo Product Core.
- [ ] Settings seed dùng `relax`; sound/haptic/notification preference/analytics bằng `1`.
- [ ] Không có field Pet species/name/stage hoặc feature `DEFERRED` trong schema.
- [ ] Migration có version, checksum, gap detection và rollback behavior.
- [ ] Migration/bootstrap failure giữ dữ liệu và chặn unsafe command.
- [ ] Database recovery có Retry; không tự reset hoặc tự repair balance/session.
- [ ] Full reset cần explicit confirmation, atomic và giữ schema/catalog hợp lệ.
- [ ] Product history/ledger/ownership không bị background-prune.
- [ ] Migration/constraint/reset integration tests có evidence.

**Out of scope:** Cloud ID, sync revision, remote database, feedback free-text outbox và background product-history retention job.

---

### EPIC-03 — Reliable Timer và Session Core

**Loại:** Enabler/Core capability  
**Outcome:** Focus/Break session có thể start, cancel, reconcile và resolve chính xác sau background/relaunch mà không complete hoặc grant reward hai lần.  
**Dependency:** `EPIC-02`.  
**Nguồn chính:** Timer Engine 1.0.2, Session Lifecycle 1.0.1, System Architecture.

**In scope:**

- Pure Domain rules cho timestamp, four-status lifecycle và Strict precedence.
- `SessionCommandCoordinator`, command serialization và reconciliation single-flight.
- Start/cancel/reconcile Application use cases với typed result/error/warning.
- Device wall-clock adapter và single-capture `now` contract.
- Relax/Strict/background/foreground/startup reconciliation.
- Automatic atomic completed-Focus reward transaction.
- Notification ensure/cancel operation key theo session.
- Safe recovery cho corrupt timestamp/database failure.
- Defensive Pause/Resume not-supported boundary.

**Epic completion checklist:**

- [ ] Timer truth chỉ dựa persisted timestamp + current wall clock.
- [ ] Session chỉ dùng `running`, `completed`, `failed`, `cancelled`.
- [ ] Focus/Break không có Pause/Resume hoặc `pausedAt`.
- [ ] Completion boundary dùng `now >= endsAt`.
- [ ] Strict grace 10 giây dùng đúng `violationAt <= endsAt` precedence.
- [ ] Strict foreground an toàn clear `backgroundedAt` atomically.
- [ ] Strict relaunch thiếu evidence không bị suy diễn thành failure.
- [ ] Cancel/completion race cho kết quả theo first committed transition.
- [ ] Completed Focus + reward ledger + XP/Coin + receipt commit atomically.
- [ ] Retry/reconcile/notification tap không grant reward lần hai.
- [ ] Invalid timestamp/database failure không tạo terminal truth hoặc reward giả.
- [ ] Notification failure không rollback session/reward.
- [ ] Domain/Application/SQLite integration tests bao phủ boundary và race chính.

**Out of scope:** UI hoàn chỉnh, native app blocking, server clock, pause/resume và manual reward claim.

---

### EPIC-04 — Home/Pet Room và Pet Companion Projection

**Loại:** Product  
**Outcome:** Người dùng luôn nhìn thấy Pet phản ánh đúng trạng thái đã commit và cảm nhận được sự đồng hành mà không làm animation ảnh hưởng core focus flow.  
**Dependency:** `EPIC-01`, `EPIC-03`.  
**Decision gate:** `GATE-PET-IDENTITY` trước production asset.  
**Nguồn chính:** Product Core §8, Pet State Machine 1.0.0, ADR-005.

**In scope:**

- Home/Pet Room làm điểm quay về chính.
- Pet states `idle`, `working`, `breaking`, `celebrating`, `bugged`.
- Base projection và transient one-shot arbitration.
- Celebration tối đa 2.000 ms; Bugged tối đa 1.500 ms.
- Runtime dedupe theo `sessionId + terminalStatus`.
- Reanimated sprite loops, one-shot, cleanup khi background/unmount.
- Reduced motion, layered static fallback và semantic status text.
- Neutral placeholder cho tới khi Product chọn Pet mặc định.

**Epic completion checklist:**

- [ ] Pet state derive từ committed session projection, không từ countdown/notification/route.
- [ ] Focus running map `working`; Break running map `breaking`; no active map `idle`.
- [ ] Completed Focus fresh transition request `celebrating` sau reward commit.
- [ ] Strict failed fresh transition request `bugged`; cancelled về `idle`.
- [ ] Completed Break không celebrate và không tạo reward.
- [ ] Active session mới preempt stale terminal one-shot.
- [ ] Relaunch/Result reopen/resume không replay one-shot cũ.
- [ ] Animation failure không crash, block hoặc mutate core truth.
- [ ] Reduced-motion/static fallback vẫn truyền đạt state bằng text.
- [ ] Animation dừng khi không nhìn thấy.
- [ ] Production Pet asset chỉ được khóa sau `OPEN-001` resolved.

**Out of scope:** Multiple Pet, evolution, Happiness, Energy, Pet death, Skia khi chưa vượt gate và species-specific gameplay.

---

### EPIC-05 — First-use Onboarding Trial

**Loại:** Product  
**Outcome:** Người dùng mới hiểu giá trị Pet companion, hoàn thành trial Focus ngắn và đi vào Home với reward đầu tiên đã persist.  
**Dependency:** `EPIC-03`, `EPIC-04`.  
**Decision gate:** `GATE-PET-NAMING`; `GATE-PET-IDENTITY` cho production presentation.  
**Nguồn chính:** Product Core §10.2, Timer Engine, Session Lifecycle, Gamification Rules.

**In scope:**

- Intro ngắn về Pet companion.
- Trial Focus cố định 5 phút.
- `focusVariant = onboarding_trial`, `mode = relax`, `workTag = null`.
- Không hiển thị mode/tag selector và không có Strict failure branch.
- Completed trial nhận 5 XP/1 Coin tự động, atomic và idempotent.
- Trial celebration và chuyển vào Home/Pet Room.
- Trial exclusion khỏi standard history, contribution, cadence, store review và standard Focus/reward analytics.
- Relaunch/recovery dựa trên durable trial record.

**Epic completion checklist:**

- [ ] First-use path không đưa người dùng qua Standard Focus Setup.
- [ ] Trial duration/mode/tag được persist đúng invariant.
- [ ] Background/lock/crash/kill dùng Relax lifecycle.
- [ ] Trial không thể resolve `failed` bởi Strict violation.
- [ ] Completed trial nhận đúng 5 XP/1 Coin tối đa một lần.
- [ ] Cancelled/incomplete trial không nhận partial reward.
- [ ] Trial không xuất hiện trong standard history/contribution/cadence/store-review queries.
- [ ] Trial chỉ dùng onboarding analytics events theo allowlist.
- [ ] Relaunch không tạo duplicate reward hoặc replay terminal animation cũ.
- [ ] Pet naming chỉ được triển khai sau `OPEN-009` resolved; chưa chốt thì không thêm schema/requirement.

**Out of scope:** Standard Focus duration selector, Strict trial, custom work tag và tutorial economy/gameplay phức tạp.

---

### EPIC-06 — Standard Focus Experience

**Loại:** Product  
**Outcome:** Người dùng có thể cấu hình, bắt đầu và hoàn thành hoặc kết thúc một Standard Focus session với kết quả rõ ràng, đáng tin cậy.  
**Dependency:** `EPIC-03`, `EPIC-04`.  
**Nguồn chính:** Product Core §5–7 và §10.3, Timer Engine, Session Lifecycle.

**In scope:**

- Focus Setup với duration 15–120 phút, step 5, default 25.
- Work tags `coding`, `study`, `writing`, `reading`.
- Relax Mode và Strict Mode Lite.
- Focus Session countdown derive từ timestamp.
- Cancel confirmation/command và terminal Result.
- Completed/failed/cancelled outcome copy không phán xét.
- Result hiển thị configured minutes và committed XP/Coin.
- Home navigation sau terminal result.
- Local notification completion behavior; permission denial không làm hỏng timer.

**Epic completion checklist:**

- [ ] Chỉ valid duration/tag/mode mới start được Standard Focus.
- [ ] UI chỉ điều hướng như đã start sau durable commit.
- [ ] Countdown tick không mutate database hoặc grant reward.
- [ ] Relax background/lock/relaunch không làm session fail.
- [ ] Strict grace và boundary cases render đúng committed outcome.
- [ ] Cancelled/failed Focus không nhận reward.
- [ ] Completed Focus nhận reward theo configured minutes, không overtime.
- [ ] Result reopen không grant hoặc replay reward.
- [ ] Failed/cancelled Result không có Break entry.
- [ ] Notification denied/stale/tap lặp không thay session truth.
- [ ] Accessibility không phụ thuộc sprite, motion, audio hoặc màu.

**Out of scope:** Pause/resume, custom tags, native app blocking, task manager và Break implementation chi tiết của `EPIC-07`.

---

### EPIC-07 — Break Experience và Long Break Cadence

**Loại:** Product  
**Outcome:** Sau một completed Focus, người dùng có thể chủ động nghỉ đúng loại Break và Pet phản ánh trạng thái nghỉ mà không bị phạt khi rời app.  
**Dependency:** `EPIC-03`, `EPIC-04`, `EPIC-06`.  
**Nguồn chính:** Product Core §5.2, §6.4, §10.3; Session Lifecycle §7.

**In scope:**

- CTA “Bắt đầu nghỉ” và “Về Home” sau completed Focus.
- Break chỉ start sau explicit action và durable StartBreak commit.
- Short Break 5 phút trước khi Long Break due.
- Long Break 15 phút sau bốn completed Standard Focus kể từ completed Long Break gần nhất.
- Durable cadence derive từ session history.
- Break running/completed/cancelled lifecycle.
- Break không áp dụng Strict hoặc reward.
- Pet `breaking`, local notification và relaunch recovery.

**Epic completion checklist:**

- [ ] Break không auto-start khi Focus complete, Result render hoặc app relaunch.
- [ ] Failed/cancelled Focus không thể tạo Break từ terminal Result đó.
- [ ] Completed Focus thứ 1–3 chọn Short Break.
- [ ] Completed Focus thứ 4 làm Long Break due.
- [ ] Trial/failed/cancelled Focus không tăng cadence.
- [ ] Long Break due sống qua Home/relaunch/additional Focus.
- [ ] Cancelled Long Break không reset due; completed Long Break reset cycle.
- [ ] Break background/lock/crash/kill không resolve `failed`.
- [ ] Completed/cancelled Break không nhận XP/Coin hoặc celebrate.
- [ ] Cancel/completion race và notification behavior dùng cùng durable rules.

**Out of scope:** Auto-start Break, auto-start Focus, Strict Break, pause/resume và configurable Break duration.

---

### EPIC-08 — Progression, Shop và Inventory Loop

**Loại:** Product  
**Outcome:** Người dùng nhìn thấy thời gian Focus chuyển thành XP/Coin, level và cosmetic room items có thể mua/equip an toàn.  
**Dependency:** `EPIC-02`, `EPIC-03`, `EPIC-04`.  
**Nguồn chính:** Product Core §9, Gamification Rules 1.0.1, Data Model.

**In scope:**

- XP/Coin balance hydrate từ durable current state.
- Level derive từ cumulative XP theo công thức đã duyệt.
- Shop hiển thị đúng 12 item từ đầu, không level gate.
- Purchase bằng authoritative catalog price.
- Atomic Coin debit + purchase receipt + OwnedItem.
- Inventory ownership, free equip/unequip và Pet Room projection.
- Offline persistence và idempotent double-tap/retry behavior.

**Epic completion checklist:**

- [ ] Level bắt đầu ở 1 tại 0 XP và derive đúng threshold formula.
- [ ] XP cumulative, không spend và không level-down ngoài full reset.
- [ ] Catalog có đúng 12 item với exact ID/name/category/price.
- [ ] Catalog visible từ đầu và không level gate.
- [ ] Coin balance bắt đầu từ 0 và không âm.
- [ ] Purchase dùng catalog price, không tin price từ UI.
- [ ] Purchase/debit/receipt/ownership commit atomically.
- [ ] Double tap/retry không debit hoặc unlock hai lần.
- [ ] Item đã owned không thể mua lại và không mất do unequip/session outcome.
- [ ] Equip chỉ áp dụng owned item và không tốn Coin.
- [ ] Item không tạo multiplier, protection hoặc gameplay advantage.
- [ ] Inventory/equipped state sống qua app restart.

**Out of scope:** Dynamic pricing, sale, refund, sell-back, consumable, duplicate, rarity, crafting, gifting, trade, premium currency và monetization.

---

### EPIC-09 — Focus History và Contribution Graph

**Loại:** Product  
**Outcome:** Người dùng có thể xem lại các Standard Focus session và thấy completed Focus minutes theo ngày local một cách nhất quán.  
**Dependency:** `EPIC-02`, `EPIC-06`.  
**Decision gate:** `GATE-CONTRIBUTION-COLOR` trước final visual QA.  
**Nguồn chính:** Product Core §12, Data Model §6.2, Project Structure reference feature.

**In scope:**

- Recent Standard Focus history.
- Duration, work tag và completed/failed/cancelled status.
- Contribution graph theo `scheduled_end_local_date`.
- Chỉ completed Standard Focus minutes đóng góp intensity.
- Trial bị loại khỏi standard history và contribution.
- History/contribution query từ SQLite, không dùng Zustand aggregate.
- Basic empty/loading/error/accessibility states.

**Epic completion checklist:**

- [ ] History chỉ query `session_type = focus` và `focus_variant = standard`.
- [ ] Recent list hiển thị đúng duration/tag/status.
- [ ] Failed/cancelled có thể xuất hiện trong history nhưng đóng góp 0 phút.
- [ ] Trial không xuất hiện trong standard history/contribution.
- [ ] Local day dùng immutable scheduled-end date đã persist.
- [ ] Timezone change/reconcile muộn không regroup session cũ.
- [ ] Contribution graph không chỉ dùng màu để truyền đạt dữ liệu.
- [ ] Final intensity/color thresholds chỉ được khóa sau `OPEN-006` resolved.

**Out of scope:** Weekly/monthly deep analytics, cloud history, streak UI và contribution-based unlock.

---

### EPIC-10 — Settings, Device Feedback và Local-data Control

**Loại:** Product  
**Outcome:** Người dùng kiểm soát được âm thanh, rung, notification preference, analytics preference và dữ liệu local mà không ảnh hưởng tính đúng của timer.  
**Dependency:** `EPIC-01`, `EPIC-02`, `EPIC-03`.  
**Nguồn chính:** Product Core §11 và §14.2, Technical Overview, Data Model.

**In scope:**

- Settings cho default Focus duration/mode, sound, haptics, notifications và analytics.
- Contextual notification-permission education/request.
- Audio/haptic feedback theo setting.
- Analytics opt-out coordinated behavior.
- Explicit confirmed full local-data reset.
- Recovery/Retry UX khi settings/reset/database command thất bại.
- Accessibility/reduced-motion platform preference consumption trong presentation boundary.

**Epic completion checklist:**

- [ ] Sound và haptic có thể tắt hoàn toàn.
- [ ] Notification preference không bị coi là OS permission truth.
- [ ] Permission denial không làm hỏng Start/Complete/Recovery.
- [ ] Settings mutation validate range và commit atomically.
- [ ] Analytics opt-out dừng capture, clear queue và rotate anonymous ID.
- [ ] Full reset có warning/confirmation và block concurrent core command.
- [ ] Reset thành công clear product data/projection nhưng giữ schema/catalog hợp lệ.
- [ ] Reset failure rollback và không hiển thị success giả.
- [ ] Không có partial XP/Coin/history/inventory reset.

**Out of scope:** Account deletion trên server, cloud backup, configurable advanced audio mixer và remote notification.

---

### EPIC-11 — Analytics, Product Feedback và Store Review Integrity

**Loại:** Product/Operational  
**Outcome:** Team thu được beta signal và feedback cần thiết mà không làm hỏng offline core loop, thu thập quá mức hoặc review-gate người dùng.  
**Dependency:** `EPIC-02`, `EPIC-05`, `EPIC-06`, `EPIC-09`, `EPIC-10`.  
**Nguồn chính:** Product Core §10.5 và §13, Technical Overview §8, ADR-006, ADR-008, Data Model.

**In scope:**

- PostHog Cloud EU adapter với anonymous installation ID.
- Manual typed event allowlist và property/payload limits.
- Bounded offline queue 1.000 events, TTL 7 ngày, drop-oldest.
- Core MVP analytics events và trial exclusions.
- Product feedback form: score 1–5, optional comment, Retry khi form còn mở.
- Feedback không persist local và comment không vào analytics/log.
- Native store-review eligibility, frequency cap và persisted attempts.
- Feedback/store-review separation và no-review-gating enforcement.
- Cost/retention operational guardrails.

**Epic completion checklist:**

- [ ] Không person profile, autocapture, session replay, GeoIP hoặc advertising identifier.
- [ ] Không development/test analytics; preview chỉ dùng dataset tách biệt khi cần.
- [ ] Event/property/payload chỉ đi qua typed allowlist.
- [ ] Queue cap/TTL/retry chạy ngoài core transaction.
- [ ] Analytics failure không block core flow.
- [ ] Trial chỉ phát onboarding events và không phát standard Focus/reward events.
- [ ] Feedback comment không persist, không log và không gửi analytics.
- [ ] Feedback submit failure cho Retry tại chỗ và không ảnh hưởng core loop.
- [ ] Store review chỉ xét production tại Home sau completed reward/celebration.
- [ ] Eligibility dùng 7 ngày, 5 completed Standard Focus và 3 active local days.
- [ ] Cooldown 120 ngày, tối đa 3 attempts/365 ngày và một attempt/app version.
- [ ] Attempt persist trước native call và vẫn tính khi prompt không hiển thị.
- [ ] Feedback score/comment/history không tham gia store-review eligibility.
- [ ] Chỉ capture `store_review_requested`, không suy diễn review outcome.

**Out of scope:** Review gating, custom store prompt, incentive, feedback outbox, session replay, user profile và server-side analytics identity.

---

### EPIC-12 — Hardening, Device Validation và Closed-beta Delivery

**Loại:** Release  
**Outcome:** Mobile MVP đáp ứng acceptance definition, chạy ổn định trên iOS/Android target và sẵn sàng phát hành internal/closed beta có rollback path.  
**Dependency:** `EPIC-01` đến `EPIC-11`.  
**Nguồn chính:** Product Core §18–19, Technical Overview §10, ADR-005, ADR-007 và toàn bộ implementation acceptance criteria.

**In scope:**

- Cross-feature acceptance audit theo Product Core và specification.
- Minimum/current iOS/Android device matrix.
- Background/foreground, kill/relaunch, restart và wall-clock scenario validation.
- Reward/purchase idempotency và migration/reset failure validation.
- Offline/airplane-mode core-loop validation.
- Accessibility, reduced motion, notification denial và asset fallback validation.
- Reanimated Pet benchmark 30 phút theo ADR-005.
- Preview validation, production runtime compatibility và rollback rehearsal.
- Internal build, close-user rollout và closed-beta artifact.

**Epic completion checklist:**

- [ ] Toàn bộ Mobile MVP acceptance definition có implementation evidence.
- [ ] Không còn crash/blocker đã biết trong core focus flow.
- [ ] Timer/recovery/reward race tests pass trên iOS và Android.
- [ ] Offline core loop hoạt động không cần account/backend/network.
- [ ] Notification denial/failure không làm hỏng timer.
- [ ] Migration từ mọi released schema được test.
- [ ] Reset, analytics opt-out và privacy boundary được xác minh.
- [ ] Pet animation benchmark hoàn tất trên minimum và representative devices.
- [ ] Skia chỉ được xem xét nếu baseline không đạt locked visual/performance requirement; nếu cần phải cập nhật ADR.
- [ ] Preview build được smoke-test với đúng runtime trước production/closed-beta delivery.
- [ ] Native change không được phát hành nhầm bằng OTA.
- [ ] Có rollback/republish path cho production-compatible update.
- [ ] Internal build được phân phối trước closed beta.
- [ ] Closed-beta artifact và release notes sẵn sàng.

**Out of scope:** Public launch guarantee, monetization validation, desktop, social, cloud sync và Phase 2–4 roadmap.

## 6. MVP scope traceability

Bảng này bảo đảm toàn bộ 18 hạng mục Mobile MVP trong Product Core §4.2 có Epic owner.

| # | Mobile MVP scope | Epic owner |
|---:|---|---|
| 1 | Onboarding ngắn | `EPIC-05` |
| 2 | Một Pet mặc định | `EPIC-04`; chờ `OPEN-001` để khóa production asset |
| 3 | Home/Pet Room | `EPIC-04` |
| 4 | Chọn tag công việc | `EPIC-06` |
| 5 | Focus 15–120 phút | `EPIC-06` |
| 6 | Short Break 5 phút | `EPIC-07` |
| 7 | Long Break 15 phút | `EPIC-07` |
| 8 | Relax Mode | `EPIC-03`, `EPIC-06` |
| 9 | Strict Mode Lite, grace 10 giây | `EPIC-03`, `EPIC-06` |
| 10 | Local notification cho Focus/Break | `EPIC-03`, `EPIC-06`, `EPIC-07`, `EPIC-10` |
| 11 | Pet states và retro animation | `EPIC-04` |
| 12 | XP và Coin sau completed Focus | `EPIC-03`, `EPIC-08` |
| 13 | Inventory/shop nhỏ | `EPIC-08` |
| 14 | Focus history | `EPIC-09` |
| 15 | Contribution graph | `EPIC-09`; chờ `OPEN-006` cho final colors |
| 16 | Settings cho sound/haptic/notification | `EPIC-10` |
| 17 | In-app feedback | `EPIC-11` |
| 18 | Anonymous product analytics | `EPIC-11` |

## 7. Scope guardrails

Các hạng mục sau không được tạo Epic/User Story cho Mobile MVP nếu chưa có Product/Architecture decision mới:

- [ ] Không authentication hoặc account.
- [ ] Không backend bắt buộc hoặc cloud sync.
- [ ] Không desktop/web release target.
- [ ] Không social, friend, leaderboard hoặc focus room.
- [ ] Không native app blocking hoàn chỉnh.
- [ ] Không Live Activities, Dynamic Island hoặc widget.
- [ ] Không subscription, production IAP hoặc quảng cáo.
- [ ] Không Revive Token hoặc rewarded video.
- [ ] Không nhiều Pet hoặc evolution ba cấp.
- [ ] Không Happiness decay hoặc Energy system phức tạp.
- [ ] Không custom work tag hoặc task manager.
- [ ] Không Pause/Resume Focus hoặc Break.
- [ ] Không server push notification hoặc AI feature.
- [ ] Không streak UI/protection hoặc daily/weekly quest.
- [ ] Không dynamic shop pricing, refund, trade, consumable hoặc gameplay multiplier.

Các checkbox trong mục này được giữ trống có chủ đích: chúng là guardrail “không làm”, không phải backlog cần hoàn thành.

## 8. Definition of Epic Done

Một Epic chỉ được đánh dấu `[x]` khi:

- [ ] Outcome của Epic có thể demo/kiểm thử end-to-end ở phạm vi đã định nghĩa.
- [ ] Tất cả User Story bắt buộc của Epic đã hoàn thành hoặc được Product Owner chủ động loại khỏi scope qua review.
- [ ] Acceptance criteria liên quan trong Product Core/specification có evidence.
- [ ] Domain/Application/Infrastructure/Presentation boundaries không bị phá vỡ.
- [ ] Offline, error/recovery, accessibility và privacy path liên quan đã được kiểm thử.
- [ ] Side-effect failure không làm sai durable product truth.
- [ ] Unit/integration/device evidence tương xứng với rủi ro của Epic đã có.
- [ ] Không có known blocker/crash trong outcome chính của Epic.
- [ ] Không kéo nội dung `OPEN`/`DEFERRED` vào implementation mà chưa được duyệt.
- [ ] Documentation/ADR được cập nhật nếu implementation tạo decision mới.

## 9. Checklist trước khi chia User Story

- [ ] Dũng Lư review và phê duyệt danh sách, outcome và thứ tự Epic.
- [ ] Tạo/review tài liệu user flow end-to-end trước khi khóa Story cho các Product Epic.
- [ ] Gắn mỗi flow với Epic owner và source requirement.
- [ ] Xác định happy path, alternate path, error/recovery path và exit state cho từng flow.
- [ ] Ghi decision gate vào Story bị ảnh hưởng bởi `OPEN-001`, `OPEN-006`, `OPEN-009`.
- [ ] Chỉ chia Story đủ nhỏ sau khi flow và acceptance boundary rõ ràng.
- [ ] Sau Story mới tạo Task theo layer và test level.
- [ ] Không estimate deadline trước khi Story refinement hoàn tất.

## 10. Change log

### 0.1.0 — 2026-08-27

- Tạo Epic breakdown đầu tiên từ Product Core 1.13.0 và toàn bộ technical/specification baseline đã `APPROVED`.
- Chia 12 Epic theo product outcome/capability và enabler cần thiết cho solo developer.
- Bổ sung dependency order, completion checklist, Definition of Epic Done và pre-story planning checklist.
- Mapping đủ 18 hạng mục Mobile MVP về Epic owner.
- Giữ Product `OPEN-001`, `OPEN-006`, `OPEN-009` dưới dạng decision gate, không chốt ngầm.
- Bổ sung scope guardrails để ngăn roadmap/deferred feature lọt vào Mobile MVP.
