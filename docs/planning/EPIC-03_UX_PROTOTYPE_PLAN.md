---
document_id: PIXELDORO_EPIC_03_UX_PROTOTYPE_PLAN
title: PixelDoro EPIC-03 — UX Prototype Plan
version: 1.1.0
status: DONE_OWNER_ACCEPTED
ux_status: UX_APPROVED
last_updated: 2026-09-03
owner: Dũng Lư
language: vi
scope:
  - mobile_mvp
  - epic_03
  - ux_prototype
authority: PLANNING
product_truth: ../PIXELDORO_CORE_TRUTH.md
epic_baseline: ./MVP_EPICS.md
---

# EPIC-03 — MVP Experience Prototype và User-flow Validation

## 1. Outcome

Owner có thể mở app, nhìn thấy và bấm xuyên suốt trải nghiệm PixelDoro bằng dữ liệu giả trước khi
thiết kế sâu hoặc nối production Timer, Session, Reward, Pet hay database.

Gate của Phase A là owner duyệt flow, hierarchy, CTA, navigation/back behavior, transition, copy
direction và cách biểu đạt reward loop trong tài liệu này. Chỉ sau explicit approval mới bắt đầu
clickable React Native prototype ở Phase B.

Phase A đạt approval ngày 2026-08-30 khi owner duyệt cả sáu lựa chọn UX ở mục 9. Sau Phase B,
owner tiếp tục duyệt clickable prototype ngày 2026-08-30. Epic completion được normalized ngày
2026-09-03 thành `DONE_OWNER_ACCEPTED`; UX artifact vẫn giữ semantic status `UX_APPROVED`.

## 2. Baseline audit

### 2.1. Hiện trạng có thể reuse

- Expo Router đã có route shell cho Onboarding, Home, Focus Setup/Session/Result, Break Session,
  Shop, History, Settings và Feedback.
- Production bootstrap/loading/recovery boundary của EPIC-02 đã tồn tại và có accessible retry.
- Presentation đã có light Game Boy-like palette, safe-area handling và neutral Pet placeholder.
- App shell, composition root và import boundary hiện tại đủ làm foundation; prototype không cần
  thêm package, schema, migration hoặc repository.

### 2.2. Current UX gaps

- Mọi Product screen hiện là placeholder tĩnh, không có CTA, form control, transition hoặc
  clickable journey.
- Copy hiện tại giải thích architecture/future implementation cho developer thay vì nói với user.
- Chưa có first-use routing/entry decision; Onboarding route không dẫn vào trial hoặc Home.
- Bottom tabs đã tồn tại nhưng chưa được xác nhận là navigation model phù hợp; label dùng tiếng Anh
  trong khi screen copy dùng tiếng Việt.
- Focus Setup chưa có duration, mode, work tag, validation hay primary CTA.
- Focus Session chưa có countdown, Pet working state, mode/tag context hoặc cancel confirmation.
- Focus Result chưa phân biệt completed, failed, cancelled; chưa có reward feedback, retry hoặc
  Break/Home gating.
- Break mới có running placeholder; chưa có completed/cancelled result và đường trở về Home.
- Shop, History, Settings và Feedback chưa có entry/action, empty/loading/error/recovery state để
  owner review.
- Global bootstrap có loading/recovery state thật nhưng không có reviewer control an toàn để xem
  lại các UX state một cách deterministic.
- Chưa có responsive layout primitives ngoài một centered placeholder; hierarchy, tap target,
  scroll behavior và reduced-motion presentation chưa được chứng minh trên kích thước mobile phổ
  biến.

### 2.3. Flow đang thiếu

```text
First Use
  → onboarding trial brief
  → trial running
  → trial completed + reward
  → Home / Pet Room
  → Focus Setup
  → Focus Running
  → completed / failed / cancelled Result
  → completed: reward feedback → Break hoặc Home
  → failed/cancelled: thử lại hoặc Home
  → Break running → Break result → Home
```

Ngoài journey trên, chưa có đường bấm tối thiểu từ resting surfaces tới Shop, History, Settings và
Feedback.

### 2.4. Product decisions còn mở

| ID | Ảnh hưởng prototype | Boundary bắt buộc |
|---|---|---|
| `OPEN-001` — Pet mặc định | Pet xuất hiện ở Home, running và Result | Dùng geometric/pixel companion trung tính; không dùng hình Cat, Dog hoặc Robot. |
| `OPEN-006` — contribution colors | History empty/preview state | Không khóa intensity threshold; prototype chỉ dùng neutral placeholder pattern và text. |
| `OPEN-009` — Pet naming | First-use flow/copy | Không yêu cầu nhập tên, không persist/seed tên và không ngầm đặt tên mặc định. |

Ba decision này tiếp tục `OPEN`; EPIC-03 không tự chốt.

### 2.5. Technical baseline có nguy cơ ép UX

- Route inventory hiện tại có thể khiến team coi mỗi route placeholder là screen structure đã chốt.
  Prototype được phép đổi hierarchy hoặc thêm presentation-only state nếu flow review cần.
- Existing four-tab shell có thể làm active Focus/Break bị bao quanh bởi navigation gây xao nhãng.
  Đề xuất chỉ dùng tabs ở resting surfaces và dùng full-screen stack cho active journey.
- Result hiện có một route duy nhất nhưng không có nghĩa completed/failed/cancelled phải có cùng
  hierarchy hoặc CTA; route có thể render outcome variants bằng fake state.
- Production bootstrap đang bọc toàn app, nhưng prototype content không được gọi repository hoặc
  suy ra first-use/session truth từ schema chỉ để render mock.
- Existing SQLite entities/fields không được dùng để loại bỏ control hoặc thêm copy. Sau UX approval
  mới map data needs và đánh giá schema/migration.
- Technical specifications mô tả correctness và durable boundaries; chúng chỉ constrain state hợp
  lệ, không quyết định visual composition, number of cards, tab placement hoặc animation style.

## 3. Proposed primary user-flow

### 3.1. End-to-end flow diagram

```text
[Launch / First Use]
        |
        v
[Onboarding intro]
  value: focus with a companion
        |
        | "Thử phiên 5 phút"
        v
[Trial running · mock Relax 05:00]
        |
        | prototype: complete or cancel
        +------------------------------+
        |                              |
        v                              v
[Trial completed]                [Trial cancelled]
  +5 XP / +1 Coin                 retry onboarding trial
        |                              |
        | "Vào Pet Room"              +------> [Onboarding intro]
        v
[Home / Pet Room · Pet idle]
  progress summary + primary CTA
        |
        | "Bắt đầu tập trung"
        v
[Focus Setup]
  duration + mode + work tag
        |
        | "Bắt đầu 25 phút"
        v
[Focus running · Pet working]
        |
        | deterministic prototype outcome
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
[Completed Result]   [Failed Result]    [Cancel confirmation]
  duration + Pet       Strict-only         | keep focusing
  celebration          gentle copy         | cancel session
  + XP / Coin               |              v
        |                    |        [Cancelled Result]
        |                    |              |
        |                    +------+-------+
        |                           |
        |                           | retry Focus / Home
        |                           v
        |                     [Focus Setup] or [Home]
        |
        | explicit choice
        +--------------------+--------------------+
        |                                         |
        | "Bắt đầu nghỉ 5 phút"                  | "Về Pet Room"
        v                                         v
[Break running · Pet breaking]              [Home / Pet Room]
        |
        | mock complete or cancel
        v
[Break result]
  completed/cancelled, no reward
        |
        | "Về Pet Room"
        v
[Home / Pet Room]
```

Prototype standard Focus mặc định dùng 25 phút để minh họa; reviewer có thể chọn duration hợp lệ
15–120 phút theo bước 5. Trial luôn 5 phút, Relax, không tag, không mode selector và không có failed
branch. Break suggestion mặc định là Short Break 5 phút; reviewer control có thể đổi sang Long Break
15 phút để review copy nhưng không mô phỏng cadence production.

### 3.2. Outcome rules phải nhìn thấy trong UI

- Completed Focus: hiển thị configured minutes, Pet feedback, XP/Coin và hai lựa chọn Break/Home.
- Failed Focus: chỉ là Strict violation, copy không phán xét, không reward, chỉ thử lại/Home.
- Cancelled Focus: copy trung tính, không reward, chỉ thử lại/Home.
- Không có Pause/Resume trên Focus hoặc Break.
- Cancel từ running luôn qua confirmation; dismiss confirmation giữ session mock đang chạy.
- Break không auto-start; chỉ bắt đầu sau explicit CTA trên completed Result.
- Break completed/cancelled không reward và không trigger Pet celebration.
- Reward là feedback tự động đã có trong result mock; không có nút Claim.
- Pet state luôn có text label tương ứng; không truyền đạt state chỉ bằng màu hoặc motion.

## 4. Screen/state inventory

| Surface | User-visible states cần prototype | Primary action / exit |
|---|---|---|
| First Use | intro; trial brief; trial cancelled/retry | Thử phiên 5 phút; retry |
| Trial Running | running; cancel confirmation | simulate complete; cancel |
| Trial Result | completed + `5 XP`/`1 Coin` | Vào Pet Room |
| Home / Pet Room | ready; loading skeleton; recovery card | Bắt đầu tập trung; secondary destinations; retry |
| Focus Setup | default; edited duration/mode/tag; invalid/incomplete | Bắt đầu `{duration}` phút; back Home |
| Focus Running | Relax; Strict; cancel confirmation; mock resolving | deterministic complete/fail/cancel |
| Focus Result | completed; failed; cancelled | completed: Break/Home; others: retry/Home |
| Break Running | Short; Long; cancel confirmation; mock resolving | deterministic complete/cancel |
| Break Result | completed; cancelled | Về Pet Room |
| History | empty; sample content; loading; error/retry | back/tab navigation |
| Shop | sample catalog entry; loading; error/retry | back/tab navigation; no real purchase |
| Settings | prototype preferences; Feedback entry; reviewer controls entry | open Feedback; switch mock scenario |
| Feedback | empty form; validation; mock submitting; mock success/error retry | submit fake feedback; back Settings |
| Global bootstrap | existing loading; existing recovery/retry | retry bootstrap |

“Sample content” chỉ phục vụ hierarchy review. Shop không debit Coin/equip; settings không phải
production preference truth; feedback không gửi mạng; history không query SQLite.

## 5. Proposed navigation model

```text
Root stack
├── First Use flow (full screen, no tabs)
├── Resting tabs
│   ├── Home / Pet Room
│   ├── History
│   ├── Shop
│   └── Settings
│       └── Feedback (push screen)
└── Immersive session stack (no tabs)
    ├── Focus Setup
    ├── Focus Running
    ├── Focus Result
    ├── Break Running
    └── Break Result
```

Proposed back behavior:

- First Use: không system-back ra màn hình rỗng; trial running back mở cancel confirmation.
- Home tabs: dùng platform tab/back behavior bình thường; Home là resting root.
- Focus Setup: back về Home và giữ lựa chọn chỉ trong memory của prototype session.
- Focus/Break Running: back/close luôn mở cancel confirmation, không terminal ngầm.
- Focus Result: back tương đương “Về Pet Room”; completed không tự tạo Break.
- Break Result: back về Home.
- Feedback: back về Settings; mock submit success không đổi navigation ngoài explicit action.

Trong active Focus/Break, tabs bị ẩn để bảo vệ attention. Secondary destination không xuất hiện
trên running/result surface, ngoại trừ CTA đã thuộc core loop.

## 6. Fake-data boundary

Prototype dùng một presentation-owned boundary dễ xóa, ví dụ `presentation/prototype`, gồm:

- immutable fixtures cho profile/progress/reward/history/catalog;
- in-memory prototype state cho onboarding, setup selection và current scenario;
- deterministic actions để chuyển complete/fail/cancel/loading/error/retry;
- reviewer control được gắn nhãn rõ `Prototype` và chỉ có trong development/prototype context;
- fake countdown hiển thị giá trị cố định hoặc bước mô phỏng, không đo thời gian production;
- fake navigation action không tạo session, reward, purchase, feedback submission hoặc database write.

Boundary này không import repository, SQLite adapter, production reward policy hoặc session command.
Nó không export fake truth sang Domain/Application và không thay đổi migration/schema. Existing
production bootstrap foundation có thể tiếp tục bọc app, nhưng Product screen chỉ đọc fake
prototype state trong EPIC-03.

## 7. Story order — user-visible increments

Chỉ một Story ở trạng thái active tại một thời điểm. Thứ tự dưới đây là authoritative cho Phase B
sau owner approval:

1. **US-03-01 — Prototype shell và reviewer controls**  
   Resting tabs, immersive stack, prototype badge/control và deterministic scenario boundary chạy
   được; chưa có production persistence.
2. **US-03-02 — First Use tới Home/Pet Room**  
   Owner bấm từ intro qua trial running/completed reward vào Home với neutral companion.
3. **US-03-03 — Home tới Focus Running**  
   Home CTA, Focus Setup duration/mode/tag và Running surface hoàn chỉnh bằng mock state.
4. **US-03-04 — Focus terminal branches**  
   Cancel confirmation và completed/failed/cancelled Result có đúng reward/CTA gating.
5. **US-03-05 — Reward tới Break/Home**  
   Completed Result cho explicit Break/Home; Short/Long Break mock chạy tới result rồi về Home.
6. **US-03-06 — Secondary entry points và review states**  
   Shop, History, Settings, Feedback cùng loading/empty/error/retry states có thể bấm tới.
7. **US-03-07 — UX polish và walkthrough gate**  
   Responsive pass, accessibility semantics, reduced-motion/static state communication, copy pass
   và manual owner walkthrough.

Không Story nào được chia theo tên Domain/Application/Infrastructure/Presentation. Technical task,
test và file split chỉ nằm bên dưới user-visible Story sau refinement.

## 8. Acceptance evidence

Evidence chính của EPIC-03 là UI chạy được trong Development Build hiện có:

- manual walkthrough từ First Use qua trial tới Home;
- manual walkthrough Home → Setup → Running → Completed → reward → Break → Home;
- manual walkthrough failed và cancelled Focus, xác nhận không reward/Break CTA;
- manual walkthrough cancel confirmation và dismiss behavior;
- manual walkthrough Short/Long Break mock và result;
- bấm được Shop, History, Settings, Feedback;
- reviewer bật được loading/empty/error/retry state mà không sửa database;
- screen recording hoặc screenshot set phục vụ owner review, không dùng JSON probe làm evidence chính;
- accessibility label/role cơ bản, readable text và non-color-only state communication;
- typecheck, lint, relevant tests và root `pnpm quality` ở final Phase B gate;
- không chạy native/EAS build hoặc Expo prebuild.

## 9. Owner UX approval gate

Owner cần xác nhận cùng một lượt các lựa chọn sau trước Phase B:

1. **First Use:** dùng intro ngắn → trial Relax 5 phút → reward → Home; không có naming field khi
   `OPEN-009` còn mở. Cần xác nhận có cho phép “Bỏ qua dùng thử” hay trial là bước bắt buộc.
2. **Navigation:** dùng bốn resting tabs `Pet Room / Lịch sử / Cửa hàng / Cài đặt`; Feedback nằm
   trong Settings; active Focus/Break dùng full-screen stack không tabs.
3. **Back/cancel:** back ở running mở confirmation; back ở Result về Home; completed Result không
   auto-start Break.
4. **Reward/result hierarchy:** completed Result dùng một surface duy nhất gồm duration, Pet
   celebration, reward card rồi Break/Home CTA; không thêm claim step. Failed/cancelled dùng cùng
   family layout nhưng không reward/Break CTA.
5. **Prototype review control:** cho phép một control gắn nhãn `Prototype` để owner chuyển
   complete/fail/cancel/loading/empty/error và Short/Long Break deterministically.
6. **Visual/copy direction:** cozy Game Boy-like room, neutral geometric pixel companion, tiếng Việt
   ngắn gọn và ấm áp; không chốt species, Pet name hoặc contribution colors.

Approval của sáu mục trên là approval cho hướng UX prototype, không phải approval cho production
Timer/Session/schema behavior. Nếu owner yêu cầu đổi một mục, update tài liệu này trước khi code.

## 10. In scope / out of scope

### In scope

- Clickable primary and alternate journey bằng fake state/navigation.
- Neutral placeholder art và presentation primitives cần cho prototype.
- Screen hierarchy, CTA, back behavior, copy, loading/empty/error/recovery review.
- Basic responsive/accessibility/reduced-motion behavior ở mức prototype.
- Secondary entry points đủ để đánh giá information architecture.

### Out of scope

- Production Timer/Session engine, background/relaunch reconciliation hoặc Strict detection.
- Production reward commit/idempotency, Pet animation engine hoặc final art.
- Schema, migration, repository hoặc data-needs mapping trước UX approval.
- Notification, analytics, purchase/equip, feedback network submission hoặc settings persistence.
- Native/EAS build, Expo prebuild, store review, reset behavior hoặc JSON probe mới.

## 11. Approval execution record

- [x] Owner duyệt flow và sáu UX confirmation trước implementation.
- [x] Phase B triển khai theo Story order, giữ mọi fake behavior sau prototype boundary.
- [x] Quality gate pass và clickable prototype được owner duyệt ở Phase C.
- [x] Data-needs map chỉ được tạo sau explicit owner approval:

```text
screen/state → user action → domain fact → persist hay derive → schema tối thiểu
```

Không lập production Timer/Session/schema implementation plan trong tài liệu Phase A này.

## 12. Phase B implementation evidence

### 12.1. Outcome có thể nhìn thấy

- First Use dẫn vào trial Relax 5 phút, completed/cancelled result và trial reward mock.
- Home/Pet Room có neutral companion, progress summary, Focus CTA và ready/loading/recovery state.
- Focus Setup cho chọn 15–120 phút theo bước 5, Relax/Strict và bốn work tag.
- Running Focus có mock countdown, Pet working, cancel confirmation và deterministic outcome
  controls cho complete/fail/cancel/resolving.
- Focus Result phân biệt completed/failed/cancelled; chỉ completed hiển thị reward và Break/Home.
- Break chỉ bắt đầu sau explicit CTA; Short/Long Break có running, cancel confirmation và result.
- History, Shop, Settings và Feedback đều bấm tới được; các state loading/empty/error/retry có thể
  review trực tiếp bằng UI.
- Resting surfaces dùng bốn tabs; active Focus/Break dùng full-screen stack và chặn accidental
  hardware back bằng cancel confirmation.

### 12.2. Fake boundary đang dùng

- `presentation/prototype/prototype-state.ts` chứa deterministic in-memory state/reducer.
- `PrototypeProvider` sống trong Presentation và không import repository/SQLite/Application use case.
- Countdown, profile/progress, history, catalog, settings, feedback submission và reward đều gắn
  nhãn mock/fake; relaunch có thể reset toàn bộ prototype state.
- `Prototype controls` chỉ render trong development context và không tạo durable fact.

### 12.3. Production foundation được reuse

- Expo Router app shell và route boundary.
- `MobileApplicationRoot`, production bootstrap/loading/recovery barrier của EPIC-02.
- Safe-area, React Native accessibility semantics và existing theme entry point.

### 12.4. Production behavior cố ý chưa làm

- Không Timer/Session engine, timestamp reconciliation, Strict background detection hoặc notification.
- Không reward transaction, XP/Coin persistence, cadence query, purchase/equip hoặc feedback network.
- Không schema, migration, repository, analytics, reset behavior, final Pet identity/name/art hoặc
  contribution color threshold.
- Không native/EAS build, Expo prebuild hoặc JSON probe mới.

### 12.5. Quality result

Root `pnpm quality` chạy một lần bằng pinned Node `22.23.2` và pass:

- workspace typecheck: pass;
- lint: pass;
- `26` test files / `158` tests: pass, gồm `5` prototype-state tests;
- device checklist/route harness: pass;
- import-boundary validation: pass;
- repository hygiene: pass.

Visual web QA được thử như evidence phụ nhưng sandbox không cho local dev server bind cổng. Không
mở rộng quyền hoặc thêm dependency vì việc này; Development Build walkthrough vẫn là evidence chính.

### 12.6. Owner review gate tiếp theo

Owner review trực tiếp các điểm: screen hierarchy, CTA, tab/full-screen navigation, back/cancel,
copy, reward clarity, Home/Pet feeling, complete/fail/cancel branches và Break/Home decision. Chỉ
sau explicit approval của clickable prototype mới tạo data-needs map hoặc production plan.

Owner đã explicit approve clickable prototype ngày 2026-08-30. Data-needs map ở mục 13 được phép
tạo; production implementation plan vẫn thuộc refinement riêng của Epic sở hữu capability.

## 13. Approved UX data-needs map

### 13.1. Mapping normative cho bước refinement tiếp theo

| Screen/state | User action | Domain fact cần có | Persist hay derive | Schema tối thiểu / đánh giá schema `001` |
|---|---|---|---|---|
| Launch | Mở app | Onboarding đã hoàn tất chưa; có active/trial terminal session cần reconcile không | `onboarding_completed_at` và session là durable; route được derive | `app_installation.onboarding_completed_at` + `sessions`; **KEEP**, không thêm route column |
| First Use intro | Chọn “Thử phiên 5 phút” | Bắt đầu onboarding trial cố định 5 phút, Relax, no tag | Persist trial sau successful Start command | `sessions` với `focus_variant=onboarding_trial`, `mode=relax`, `work_tag=NULL`; **KEEP** |
| Trial Running | Xem countdown | Remaining time và Pet `working` | Derive từ durable trial `ends_at`, current clock và active status | `sessions`; **KEEP**; không persist remaining seconds hoặc Pet state |
| Trial Running | Mở/dismiss cancel confirmation | Modal visibility, pending choice | Transient Presentation state | **NO SCHEMA** |
| Trial Running | Xác nhận cancel | Trial terminal `cancelled`, không reward | Persist conditional terminal transition | `sessions.status/resolved_at`; **KEEP** |
| Trial resolve | Deadline được reconcile | Trial `completed`; `5 XP`, `1 Coin` đã grant đúng một lần | Persist atomically | `sessions` + `reward_transactions` + `pet_profiles`; **KEEP** |
| Trial Result | Xem celebration/reward | Committed trial outcome/reward; fresh transition có thể celebrate | Outcome/reward durable; animation transient | Existing session/reward/profile rows; **KEEP**; không persist animation receipt |
| Trial Result | Chọn “Vào Pet Room” | First-use flow đã được user hoàn tất | Persist completion timestamp sau explicit action | `app_installation.onboarding_completed_at`; **KEEP** |
| Home/Pet Room | Xem Pet và tiến trình | Active session base state; total XP/Coin; level; catalog/owned room facts | XP/Coin/ownership durable; level/Pet/room projection derive | `pet_profiles`, `sessions`, `catalog_items`, `owned_items`; **KEEP** |
| Home/Pet Room | Chọn “Bắt đầu tập trung” | Chưa có session mới; chỉ mở configuration flow | Navigation + draft state transient | **NO SCHEMA** |
| Focus Setup | Đổi duration/mode/tag | Draft configuration cho phiên kế tiếp | Transient tới khi user Start | **NO NEW SCHEMA**; có thể seed duration/mode từ `app_settings`, không auto-persist draft |
| Focus Setup | Chọn “Bắt đầu N phút” | Standard Focus config hợp lệ và no active session | Persist trong successful Start transaction | Existing `sessions` duration/mode/work_tag/timestamps/local-day fields; **KEEP** |
| Focus Running | Xem countdown/Pet | Remaining time, mode/tag context và Pet `working` | Derive từ committed running session + clock | `sessions`; **KEEP**; display tick không write DB |
| Focus Running | Mở/dismiss cancel confirmation | Modal visibility | Transient Presentation state | **NO SCHEMA** |
| Focus Running | Xác nhận cancel | Focus `cancelled`, không reward | Persist conditional terminal transition | `sessions.status/resolved_at`; **KEEP** |
| Strict Focus | Rời app quá grace và reconcile | Strict violation có evidence → `failed`, không reward | Persist terminal session; Pet `bugged` derive transiently | Existing `sessions.backgrounded_at/status/resolved_at`; **KEEP** |
| Completed Focus | Deadline được reconcile | `completed` + automatic XP/Coin exactly once | Persist atomically | `sessions` + `reward_transactions` + `pet_profiles`; **KEEP** |
| Focus Result | Xem complete/fail/cancel | Terminal outcome, configured minutes, committed reward; CTA eligibility | Read/derive từ session/reward truth | Existing session/reward/profile rows; **KEEP**; không persist result-viewed/claim state |
| Failed/Cancelled Result | Chọn retry | Không có domain mutation; mở Setup với fresh draft | Navigation/transient draft | **NO SCHEMA** |
| Bất kỳ Focus Result | Chọn “Về Pet Room” | Không tạo Break | Navigation only | **NO SCHEMA**; đặc biệt không insert Break row |
| Completed Result | Xem Short/Long suggestion | Loại Break kế tiếp theo completed-Focus cadence | Derive từ durable history | Existing `sessions` + Long Break cadence query; **KEEP**; không persist `long_break_due` |
| Completed Result | Chọn “Bắt đầu nghỉ” | Explicit StartBreak với derived Short/Long type | Persist Break chỉ sau action này | Existing `sessions` short/long break shape; **KEEP** |
| Break Running | Xem countdown/Pet | Remaining time và Pet `breaking`; không Strict | Derive từ running Break + clock | `sessions`; **KEEP**; không persist Pet/countdown state |
| Break Running | Mở/dismiss confirmation | Cancel modal state | Transient Presentation state | **NO SCHEMA** |
| Break Running | Complete/cancel | Break terminal `completed` hoặc `cancelled`, không reward | Persist conditional terminal transition | `sessions.status/resolved_at`; **KEEP** |
| Break Result | Xem result / về Home | Break outcome, no reward; Pet base `idle` | Read outcome; navigation/Pet derive | `sessions`; **KEEP** |
| History empty/list | Mở History | Standard Focus history, gồm completed/failed/cancelled; loại trial | Derived query từ durable sessions | Existing history index/query; **KEEP** |
| Contribution preview | Xem ngày hoạt động | Completed standard Focus minutes theo local end date; trial excluded | Derived aggregation | Existing sessions/local-day index/query; **KEEP**; color threshold chờ `OPEN-006` và không persist |
| Shop entry | Mở catalog/preview item | Catalog facts, balance và owned/equipped status | Catalog/ownership durable; preview state transient | Existing catalog/profile/owned tables; **KEEP** |
| Shop entry | “Xem trước” trong prototype | Chưa phải approved purchase/equip action | Presentation-only preview | **NO SCHEMA/NO PRODUCTION COMMAND** trong EPIC-03 |
| Settings | Toggle sound/haptic/notification preference | App preference của user; OS permission là platform truth riêng | Persist app preference; derive OS permission | Existing `app_settings`; **KEEP** |
| Settings | Chọn reviewer Short/Long shortcut | Chỉ đổi scenario prototype; không phải cadence preference | Transient/dev-only | **NO SCHEMA** |
| Feedback form | Chọn 1–5 sao, nhập comment | Draft feedback payload | Transient cho tới submit | **NO SQLITE TABLE**; không dùng `analytics_events` vì comment/free text bị cấm |
| Feedback submit | Gửi góp ý | Network side effect độc lập core loop | Gửi qua Feedback port; idle/submitting/success/error derive | Không cần schema cho approved immediate-retry UX; durable outbox chỉ thêm nếu specification tương lai yêu cầu |
| Loading/empty/error/recovery | Retry hoặc trở lại | Application/read projection và recoverable UI state | Derive/transient | **NO SCHEMA**; recovery không phải session/Pet status |
| Prototype controls | Chuyển scenario | Review-only fake state | Dev-only in memory | **NO SCHEMA**, không export thành Product fact |

### 13.2. Minimal schema conclusion

Approved UX **không tạo schema gap bắt buộc**. Giữ migration `001` bất biến; không thêm migration,
table hoặc column trong EPIC-03.

Các durable facts đã đủ chỗ lưu:

- first-use completion → `app_installation`;
- user preferences → `app_settings`;
- XP/Coin → `pet_profiles`;
- trial/Focus/Break config và lifecycle → `sessions`;
- automatic reward receipt → `reward_transactions`;
- catalog/purchase/ownership/equip → existing economy tables;
- history/contribution/cadence → derive từ `sessions`.

Các giá trị cố ý không persist:

- current route, selected tab, Setup draft, remaining seconds;
- cancel modal, resolving/loading/error state;
- Pet state/animation progress hoặc celebration receipt;
- reward card viewed/claimed state;
- `long_break_due`, level hoặc contribution intensity/color;
- prototype scenario/control state;
- feedback draft trong analytics queue.

### 13.3. Remaining gates và capability boundaries

- `OPEN-001`, `OPEN-006`, `OPEN-009` tiếp tục `OPEN`; mapping không tạo Pet species/name/color fact.
- Existing schema đủ không có nghĩa production use case đã tồn tại. Start/reconcile/cancel/reward,
  Pet projection, notification và Feedback port phải được triển khai trong thin vertical Epic sở hữu.
- Focus Setup change không tự ghi `app_settings`: approved UX chỉ xác nhận per-session selection.
  Một behavior “nhớ lựa chọn gần nhất” cần explicit Product decision trước khi implement.
- Shop entry prototype chưa approve purchase/equip interaction chi tiết; EPIC-08 vẫn phải bắt đầu
  bằng UX review cho capability đó trước production command.
- Feedback retry hiện là in-memory immediate retry. Không reuse analytics queue và không tạo durable
  free-text outbox nếu chưa có privacy/retention specification riêng.

Data-needs mapping hoàn tất mà không dùng schema hiện tại để thay đổi approved UX.
