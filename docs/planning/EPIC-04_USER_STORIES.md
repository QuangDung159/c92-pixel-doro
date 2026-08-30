---
document_id: PIXELDORO_EPIC_04_USER_STORIES
title: PixelDoro EPIC-04 — Home/Pet Room và Pet Companion Projection User Stories
version: 0.3.0
status: APPROVED_FOR_SEQUENTIAL_IMPLEMENTATION
last_updated: 2026-08-30
owner: Dũng Lư
approved_by: Dũng Lư
approved_at: 2026-08-30
implementation_status: US_04_02_IMPLEMENTED_AWAITING_OWNER_MANUAL_EVIDENCE
language: vi
scope:
  - mobile_mvp
  - epic_04
  - home_pet_room
  - pet_companion_projection
authority: PLANNING
product_truth: ../PIXELDORO_CORE_TRUTH.md
epic_baseline: ./MVP_EPICS.md
ux_baseline: ./EPIC-03_UX_PROTOTYPE_PLAN.md
baseline_commit: d859e1fe8d3dd4f82d602902b8517ab31729fd67
---

# EPIC-04 — Home/Pet Room và Pet Companion Projection

## 0. Epic context và authority

### 0.1. Outcome

Người dùng luôn nhìn thấy Pet phản ánh đúng trạng thái đã commit và cảm nhận được sự đồng hành,
trong khi animation không được làm chậm, block hoặc thay đổi core Focus flow.

Story list đã được owner duyệt toàn bộ trong một lượt ngày 2026-08-30. Solo developer chỉ được có
**một Story active tại một thời điểm** và đi theo execution order ở mục 8. Owner xác nhận đã test
`US-04-01` và yêu cầu tiến hành Story tiếp theo; `US-04-02` đã hoàn tất implementation/automated
gates và đang chờ owner manual Development Build evidence. Các Story 03–07 chưa được active.

### 0.2. Baseline đã xác minh

| Hạng mục | Kết quả |
|---|---|
| Branch làm việc | `feats/epic-04`, tracking `origin/feats/epic-04` |
| HEAD/baseline | `d859e1fe8d3dd4f82d602902b8517ab31729fd67` — `Epic 4 (#5)` |
| Worktree trước planning | Sạch, không có owner change chưa commit |
| EPIC-03 completion | `MVP_EPICS.md` ghi `DONE`; clickable prototype và data-needs map được owner duyệt ngày 2026-08-30 |
| UX approval | `EPIC-03_UX_PROTOTYPE_PLAN.md` có `status: UX_APPROVED` |
| Commit đối chiếu | `d859e1f` và local commit `d1e60a0` có cùng parent `8478885` và tree không có diff; `d859e1f` là commit merged/current trên branch dự kiến |
| Overlap | Chưa có `docs/planning/EPIC-04_USER_STORIES.md`; không có thay đổi chồng lấn |

### 0.3. Thứ tự authority

Khi có khác biệt, Story và Task phải áp dụng đúng thứ tự:

1. `PIXELDORO_CORE_TRUTH.md` và scope Product đã khóa.
2. Clickable UX cùng hierarchy/CTA/flow trong `EPIC-03_UX_PROTOTYPE_PLAN.md` đã được owner duyệt.
3. `MVP_EPICS.md` và approved UX data-needs map.
4. `pet-state-machine.md`, `session-lifecycle.md`, `timer-engine.md`, `gamification-rules.md`.
5. Architecture/ADR boundary.
6. Existing schema/code là implementation baseline, không được ép ngược UX.

## 1. Baseline inventory đã đọc

### 1.1. Product, planning và completion evidence

| Tài liệu | Trạng thái/ý nghĩa được dùng |
|---|---|
| `docs/PIXELDORO_CORE_TRUTH.md` | `ACTIVE` 1.13.0; Product thesis, companion-first, Pet mapping, primary journey và `OPEN-001` |
| `docs/planning/MVP_EPICS.md` | `APPROVED`; EPIC-03 `DONE`, EPIC-04 scope/checklist, gate và execution wave |
| `docs/planning/EPIC-03_UX_PROTOTYPE_PLAN.md` | `UX_APPROVED`; approved hierarchy, CTA, fake boundary, data-needs map và quality evidence |
| `docs/planning/EPIC-01_USER_STORIES.md` | `APPROVED`; foundation dependency, route/composition/test conventions |
| `docs/planning/EPIC-01_IMPLEMENTATION_EVIDENCE.md` | Foundation code `DONE`; manual/native evidence gate history được giữ làm context |
| `docs/planning/EPIC-02_USER_STORIES.md` | `DONE`; persistence, bootstrap, recovery, repository/query boundary và owner UI-first re-baseline |
| `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md` | `COMPLETE`; host `25/153` pass, per-Story native evidence, final parity chuyển EPIC-12 |
| `docs/planning/US-02-01_IMPLEMENTATION_PLAN.md` | Implementation `DONE`; SQLite owner/transaction boundary |
| `docs/planning/US-02-02_IMPLEMENTATION_PLAN.md` | `DONE`; immutable migration `001`, schema/seed/constraint contract |
| `docs/planning/US-02-03_IMPLEMENTATION_PLAN.md` | `DONE`; forward-only migration safety |
| `docs/planning/US-02-04_IMPLEMENTATION_PLAN.md` | `DONE`; safe bootstrap/readiness barrier |
| `docs/planning/US-02-05_IMPLEMENTATION_PLAN.md` | `DONE`; typed repository/mapper graph |
| `docs/planning/US-02-06_IMPLEMENTATION_PLAN.md` | `DONE`; derived query/consistency boundary |
| `docs/planning/US-02-07_IMPLEMENTATION_PLAN.md` | `DONE`; failure recovery/Retry/no-destruction |
| `docs/planning/US-02-08_IMPLEMENTATION_PLAN.md` | `DONE`; confirmed local reset and projection cleanup boundary |
| `docs/planning/US-02-09_IMPLEMENTATION_PLAN.md` | `DONE` theo revised scope; cross-platform exit evidence chuyển EPIC-12 |

Không có planning/evidence file hoàn thành nào khác trên disk ngoài inventory trên. EPIC-01 evidence
còn frontmatter `IN_PROGRESS_MANUAL_BUILD_GATES`, nhưng phần Story evidence và owner closure đã được
đọc để không suy diễn sai foundation capability.

### 1.2. Architecture và specification

Đã đọc các baseline hiện hành sau:

- `docs/architecture/technical-overview.md` — `APPROVED`.
- `docs/architecture/system-architecture.md` — `APPROVED`.
- `docs/architecture/project-structure.md` — `APPROVED`.
- `docs/architecture/data-model.md` — `APPROVED`, gồm maintenance 1.1.0 UI-first.
- Toàn bộ `ADR-001` đến `ADR-008`; riêng ADR-005 là `ACCEPTED_WITH_GATE`.
- `docs/specifications/timer-engine.md` — `APPROVED`.
- `docs/specifications/session-lifecycle.md` — `APPROVED`.
- `docs/specifications/pet-state-machine.md` — `APPROVED`.
- `docs/specifications/gamification-rules.md` — `APPROVED`.
- `docs/TECHNICAL_DOCUMENTATION_CHECKLIST.md` — documentation preparation `DONE`.

### 1.3. Code, test và device-guide baseline

Đã audit route tree, toàn bộ `presentation/components`, `presentation/features`,
`presentation/prototype`, theme, mobile Application/provider/composition boundary, shared Domain và
Application public API, session/profile persistence ports, SQLite repository/query graph, test/fake
và toàn bộ device guide hiện có.

Các file ảnh hưởng trực tiếp gồm:

- `apps/mobile/src/presentation/components/prototype-ui.tsx`;
- `bootstrap-boundary.tsx`, `placeholder-screen.tsx`;
- `features/home/index.tsx`, `features/focus/index.tsx`, `features/break/index.tsx` và các feature
  consumer còn lại;
- `prototype/prototype-context.tsx`, `prototype-state.ts`, `prototype-state.test.ts`;
- route/layout trong `apps/mobile/src/app`;
- `mobile-application-context.tsx`, `mobile-application-root.tsx`,
  `create-mobile-application.ts`, `mobile-application.facade.ts`;
- `MobileBootstrap`/`BootstrapProjection` và app-lifecycle port/adapter;
- shared `SessionRepository`, `ProfileRepository`, derived-query ports;
- `SQLiteSessionRepository`, `SQLiteProfileRepository`, persistence graph và bootstrap adapter;
- integration/unit test foundation và `apps/mobile/test/device/*.md`.

## 2. Audit findings

### 2.1. Current Home/Pet Room UX và code structure

Approved Home đang có đúng hierarchy cần bảo vệ: prototype badge → warm header → companion scene →
Level/XP/Coin → primary Focus CTA → room progress. Route `(tabs)/index.tsx` chỉ nối navigation,
nhưng `HomeScreen` tự giữ reviewer `ready/loading/error` state và toàn bộ dữ liệu hiển thị là hard-coded
mock. Home chưa nhận committed projection từ Application.

Bottom navigation có bốn resting tabs `Pet Room / Lịch sử / Cửa hàng / Cài đặt`; active Focus/Break
dùng full-screen stack. Đây là approved journey, không được EPIC-04 đổi route model, CTA order hoặc
back behavior.

### 2.2. Prototype code đủ tốt để reuse

- Palette, safe-area/max-width shell, spacing và cozy Game Boy-like visual direction.
- Hierarchy/API ý tưởng của `ScreenHeader`, `PixelPanel`, `PrimaryButton`, `SecondaryButton`,
  `ChoiceChip`, `Stat`, `LoadingState`, `EmptyState`, `ErrorState`, `ConfirmationModal` và
  `InlineNotice`.
- Neutral geometric `PixelCompanion` đủ làm **fallback concept** và giữ state-specific semantic text;
  nó không phải final Pet art hoặc animation engine.
- Route files hiện giữ composition/navigation khá mỏng.
- Bootstrap recovery boundary có durable safety gate và accessible Retry thật.

Reuse nghĩa là giữ behavior/visual contract rồi tách/generalize có migration test; không copy code
sang tên mới và để hai implementation trôi khác nhau.

### 2.3. Prototype-only fake boundary phải giữ tách biệt

- `PrototypeProvider`, `prototypeReducer`, review controls, mock countdown, mock reward, reviewer
  break selection và local review states là Presentation-owned in-memory fake.
- Reducer tự start/resolve session và tự tính reward để demo. Nó không được gọi là committed truth,
  không được import vào Domain/Application production projection và không được dùng làm acceptance
  evidence cho Pet correctness.
- `PrototypeBadge`, `PrototypeControls`, `ControlButton` chỉ thuộc review mode. Production Home và
  Pet components không import chúng.
- Prototype có thể tiếp tục tồn tại để regression-check approved journey cho tới khi từng consumer
  được migrate; xóa toàn bộ fake boundary không thuộc EPIC-04.

### 2.4. Component duplication và size/responsibility risk

- `prototype-ui.tsx` dài **399 dòng**, gộp 18 exported primitive/component, Pet scene, modal, async
  states, prototype controls và một style registry. File này không được promote nguyên khối.
- `features/focus/index.tsx` dài **334 dòng** và chứa Setup, Running, Result. Không có component đơn
  lẻ vượt 300 dòng, nhưng file có risk ownership; khi EPIC-04 sửa Pet consumer phải split theo
  screen/responsibility thay vì tăng tiếp.
- Focus và Break lặp timer block, top metadata, cancel-modal wiring và result composition. EPIC-04
  không mở rộng timer refactor, nhưng common Pet stage/modal primitives phải loại phần duplication
  thuộc phạm vi trực tiếp.
- Home/History/Shop tự tạo card headings/body style; Input/Switch còn feature-local và chưa có đủ
  EPIC-04 consumer để bắt buộc generalize.
- `PixelCompanion` vừa tự định nghĩa `CompanionState`, semantic copy, room decoration và drawable.
  Production component phải nhận state/projection qua typed props, không tự derive business fact.

### 2.5. Pet projection gap theo layer

| Layer | Đã có | Còn thiếu cho EPIC-04 |
|---|---|---|
| Domain | Chỉ foundation health; chưa có Pet module | Pure `PetState`/base mapping từ committed active-session fact; invalid-combination decision |
| Shared Application | Typed session/profile repository ports | Application-owned Pet projection DTO, read/refresh use case và fresh terminal transition contract |
| Mobile Application | Bootstrap, lifecycle, recovery/readiness | Projection controller/store boundary, runtime terminal event handoff, visibility-safe refresh |
| Composition | Persistence graph đã có session/profile repositories | Wire Pet projection/arbiter once và expose facade, không đưa repository cho screen |
| Presentation provider | Chỉ bootstrap projection/retry | Selector/hook cho committed Pet projection, command/error/visibility state |
| Presentation | Static fake `PixelCompanion` | Production Pet stage, animation renderer, fallback/reduced-motion and semantic status contract |

### 2.6. Boundary đưa committed projection vào UI

Authoritative direction:

```text
SQLite Session/Profile truth
  → typed repository port
  → Application read/refresh use case
  → application-owned PetCompanionProjection
  → application-scoped projection controller (subscribable)
  → Presentation provider selector
  → Home/Focus/Break/Result composition
```

Screen không gọi repository, không map row và không tự quyết định Pet state. Existing
`BootstrapProjection.snapshot` có profile totals nhưng **không có active session**; startup
reconciliation adapter hiện là noop. Vì vậy không được giả rằng bootstrap đã cung cấp đủ Pet truth.

### 2.7. Base state và transient state

- Base: `idle`, `working`, `breaking`, derive bất kỳ lúc nào từ active session đã commit.
- Transient: `celebrating`, `bugged`, chỉ từ event “terminal transition vừa commit trong runtime
  hiện tại”; không được suy ra bằng cách đọc terminal row mới nhất.
- Khi transient hết hạn/bị drop/preempt, render lại base projection hiện hành; không ghi gì xuống DB.
- Recovery/bootstrap unsafe state đứng ngoài Pet enum và render recovery surface, không giả `idle`.

### 2.8. Vị trí animation arbiter

Arbiter thuộc mobile Application/Presentation controller boundary, được composition root tạo một
lần cho application runtime. Nó nhận application-owned committed projection/event, giữ runtime
dedupe/timer tạm thời và xuất render decision. Drawable/Reanimated progress vẫn component-scoped.

Không đặt arbiter trong screen, Domain entity, repository hoặc reducer prototype. Domain chỉ chứa
mapping/priority decision thuần; Application/controller sở hữu freshness/dedupe/lifecycle; renderer
sở hữu frame playback và cleanup.

### 2.9. Story ownership của correctness concern

| Concern | Story owner |
|---|---|
| Production Home composition/common primitives | `US-04-01` |
| Base committed mapping/projection/provider | `US-04-02` |
| Fresh transition, duration, runtime dedupe | `US-04-03` |
| Priority, active-session preemption, relaunch/reopen/resume no-replay | `US-04-04` |
| Background/unmount/not-visible cleanup và performance | `US-04-05` |
| Reduced motion, layered fallback, semantic accessibility | `US-04-06` |
| Production identity/assets và Epic exit evidence | `US-04-07`, gated |

### 2.10. Layered fallback test direction

Renderer dependency phải cho phép deterministic injection của: playable state sheet, playback
failure, missing state sheet/fallback frame, available idle still và missing-all-assets. Automated
tests kiểm tra lần lượt state frame → state static frame → same-Pet idle still → neutral code
placeholder, luôn giữ semantic status. Device guide kiểm tra visual result và core navigation vẫn
hoạt động; animation failure không được sửa session/reward/profile.

### 2.11. `OPEN-001` block chính xác

`OPEN-001 / GATE-PET-IDENTITY` **không block** neutral production composition, Pet mapping,
arbitration, lifecycle, fallback hay accessibility. Nó block:

- chọn Cat, Dog hoặc Robot;
- stable production `<pet-id>` và final species-specific asset set;
- production art/animation acceptance, attribution và final visual QA;
- `US-04-07 DONE` và EPIC-04 exit.

Không copy, placeholder hoặc test fixture nào được xem là ngầm đóng gate.

### 2.12. Technical baseline có nguy cơ ép UX

- Existing bootstrap/persistence graph có thể khiến implementation chỉ show Home sau bootstrap
  snapshot dù approved flow cần committed session projection; phải thêm đúng read boundary, không
  đổi UX theo dữ liệu hiện có.
- Schema `001` có `pet_profiles` nhưng không có Pet identity/state field. Đây là đúng data-needs map,
  không phải lý do bỏ state hoặc thêm column.
- Static sprite layout trong Project Structure là asset convention, không chốt art/species.
- Reanimated baseline không cho phép animation lấn CTA, Result hierarchy hoặc reduced motion.
- Prototype context ở root dễ bị reuse nhầm như app state; production Pet provider phải độc lập.

### 2.13. Approved prototype phải giữ để tránh UX regression

- Home/Pet Room là resting root và tab đầu tiên.
- Cozy room hierarchy, Pet là visual anchor trước stats/CTA, primary CTA vẫn “Bắt đầu tập trung”.
- Four resting tabs; active Focus/Break không có tabs.
- Completed Result: outcome → Pet feedback → committed reward → explicit Break/Home.
- Failed/cancelled Result không reward; chỉ failed Strict có Bugged; cancel về Idle.
- Completed Break không celebrate/reward.
- Warm, concise, non-judgmental Vietnamese copy; status không chỉ bằng màu/motion.
- Neutral geometric placeholder tới khi `OPEN-001` đóng.

### 2.14. Schema/data-needs conclusion

Approved data-needs map và current schema **đủ cho EPIC-04**. Active/base state derive từ existing
`sessions`; totals derive/read từ `pet_profiles`; terminal reward truth đã có `sessions` +
`reward_transactions`. Route, modal, loading, Pet state, animation progress, replay receipt và
dedupe key đều transient/derived. Không có migration hoặc schema gap thật trong scope này.

## 3. UI reuse/component audit

| Pattern/component hiện tại | Consumer hiện tại | Direction | Target ownership/API | Size/split guardrail |
|---|---|---|---|---|
| `PrototypeScreen` | Mọi prototype feature | Generalize | `ScreenShell`: safe-area, scroll/non-scroll slot, max width, testID | <120 dòng; prototype badge không nằm trong shell |
| `ScreenHeader` | Mọi feature | Reuse/generalize | `ScreenHeader`: eyebrow/title/description/right slot; header role | <100 dòng |
| `SectionLabel` | Setup/Settings/Feedback | Reuse/generalize khi migrate | `SectionHeader`/label với title, optional description/action slot | <100 dòng; không biết feature state |
| `PixelPanel` | Home, Setup, Result, Break, secondary screens | Generalize | `Panel` variants `default/strong/gold/danger`; no feature state | <120 dòng |
| `PrimaryButton`/`SecondaryButton` | Toàn prototype | Generalize chung | `Button` với finite `tone`, disabled/busy, label, role | <160 dòng; không duplicate theo màu |
| Icon button | Chưa có consumer thật | Không tạo trong EPIC-04 | Chỉ tạo khi có icon-only action được approved; bắt buộc accessible name | Không tạo speculative abstraction |
| `ChoiceChip` | Setup/Settings/Feedback | Generalize ngoài critical path | `ChoiceChip` selected/disabled/radio semantics | Chỉ migrate consumer khi touched; <140 dòng |
| `Stat` | Home/Result | Reuse/generalize | `StatDisplay` label/value/help; semantic grouping | <100 dòng |
| Room progress track | Chỉ Home | Giữ feature-local | `RoomProgressDisplay` chỉ promote khi có consumer thứ hai/API ổn định | <140 dòng; value/label qua props |
| Status badge | Chưa có common implementation | Không tạo chỉ để biểu đạt Pet | Pet state dùng semantic status text; tạo badge sau khi có repeated approved consumer | Không color-only/speculative |
| Loading/Empty/Error | Home/History/Shop/Feedback | Generalize | `StatusSurface` finite state/slots; alert/live-region contract | <180 dòng, Retry callback only |
| `ConfirmationModal` | Focus/Break | Generalize | `ConfirmationDialog`; title/body/actions/focus/escape contract | <180 dòng; no session rule |
| `PixelCompanion` | Onboarding/Home/Focus/Result/Break | Split/generalize | `PetStage` + `PetPortrait` + `PetStatusText`; state passed in | Mỗi component <180 dòng; mapping outside renderer |
| Prototype badge/controls | Prototype only | Keep local | `presentation/prototype/components` | Không export qua production UI barrel |
| Raw `TextInput`, `Switch` | Feedback/Settings | Keep feature-local trong EPIC-04 | Chưa có duplicate EPIC-04 use case đủ để abstract; accessibility contract ở feature | Không tạo abstraction chỉ để giảm dòng |
| Timer blocks | Focus/Break | Record duplication; defer | Feature-local timer component thuộc Timer/Session Epic | EPIC-04 chỉ đổi Pet slot, không refactor timer rule |
| Status indicators/cards | History/Shop | Keep feature-local | Chưa có cross-feature API ổn định | Không bị EPIC-04 mở rộng |
| Reduced-motion/static fallback | Chưa có | Create | `MotionAwarePetStage`/renderer boundary | Container <200 dòng; asset renderer tách riêng |

Migration rule: `prototype-ui.tsx` phải được rút nhỏ bằng migration từng consumer. Không tạo một
`common` file mới 399 dòng, không duplicate primitive rồi bỏ consumer cũ trôi khác. Regression test
phải chụp contract/semantics của consumer approved trước và sau migration.

## 4. Scope và guardrails

### 4.1. In scope

- Production-ready Home/Pet Room composition bảo toàn approved UX.
- Năm Pet states: `idle`, `working`, `breaking`, `celebrating`, `bugged`.
- Base projection từ committed active session và transient fresh-terminal feedback.
- Hold time tối đa 2.000 ms/1.500 ms; runtime dedupe `sessionId + terminalStatus`.
- Active session preemption; relaunch/Result reopen/resume no-replay.
- Animation lifecycle, screen visibility, background/unmount cleanup và ADR-005 benchmark evidence.
- Reduced motion, layered fallback, semantic text/accessibility.
- Neutral placeholder cho đến khi Pet identity gate đóng.
- Production asset integration và final evidence chỉ sau gate.

### 4.2. Out of scope

- Multiple Pet, evolution, Happiness, Energy, death hoặc species-specific gameplay.
- Skia trước khi ADR-005 gate chứng minh cần thiết và ADR được cập nhật.
- Production Start/Cancel/Reconcile Timer/Session/Reward implementation của Epic khác.
- Schema/migration mới; persist Pet state, animation progress, replay receipt hoặc dedupe key.
- Đổi approved primary journey, route hierarchy hoặc auto-start Break.
- Final Pet identity/art trước `OPEN-001`.
- Xóa prototype wholesale, refactor Timer blocks hoặc generalize mọi UI component trong app.

### 4.3. Cross-Story implementation rules

- Screen composition-only; không business rule, state derivation, arbitration hoặc repository call.
- Common component không import feature state/repository.
- Feature component không giữ durable truth hoặc copy Domain/Application rule.
- Mọi UI component dưới 300 dòng; split sớm theo input/output và test boundary thật.
- Không abstraction chỉ để giảm line count.
- Không JSON probe làm evidence chính. Automated test + owner-visible Development Build walkthrough
  là evidence.
- Không chạy native/EAS build hoặc Expo prebuild trong planning; implementation guide dùng existing
  compatible Development Build, owner refresh khi native graph thực sự đổi.

## 5. Product/technical gates

| Gate | Áp dụng | Điều kiện mở/đóng |
|---|---|---|
| `OWNER-STORY-APPROVAL` | Mọi Story | Owner duyệt decomposition, order, boundary và evidence trong mục 15 trước khi active `US-04-01` |
| `COMMITTED-PROJECTION-CONTRACT` | `US-04-02` trở đi | Application-owned DTO/provider và recovery semantics được review trong Story refinement |
| `FRESH-TERMINAL-HANDOFF` | `US-04-03`–`04` | Event chỉ phát sau terminal/reward commit; không infer từ route/latest terminal row |
| `ADR-005-BASELINE` | `US-04-05`/`07` | Reanimated + bundled sprite; Skia cấm nếu chưa vượt benchmark gate |
| `GATE-PET-IDENTITY / OPEN-001` | `US-04-07`, Epic exit | Owner/Product-Art chốt Cat/Dog/Robot và authority sync trước production asset acceptance |
| `OWNER-DEVICE-EVIDENCE` | Mỗi Story và Epic exit | Owner chạy guide trên Development Build/target phù hợp và ghi platform/OS/device/SHA/evidence |

## 6. Priority model

- **MVP Priority** trả lời capability có bắt buộc cho MVP không. Mọi Story là `MUST`, nhưng
  `US-04-07` chưa executable khi gate mở.
- **Dependency priority** trả lời Story cần làm sớm vì mở khóa correctness/risk. Dùng `P0`, `P1`,
  `P2`.
- **Execution order** là thứ tự authoritative cho solo developer. Không suy execution order chỉ từ
  nhãn MVP; không làm song song.

## 7. Story overview

| Order | Story | Title | User-visible outcome | MVP | Dep. priority | Dependencies | Blocks | Gate | Output hữu hình | Automated evidence | Manual evidence |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `US-04-01` | Pet Room có composition production và UI primitive dùng lại | Home giữ approved hierarchy nhưng không còn phụ thuộc component fake nguyên khối | MUST | P0 | EPIC-01, EPIC-03 | 02–07 | Owner approval | Home production composition + common primitive migration | Component/a11y/regression tests | Home visual walkthrough iOS/Android sizes |
| 2 | `US-04-02` | Pet phản ánh base state đã commit | Idle/Working/Breaking hiển thị từ committed active session | MUST | P0 | 01, persistence/bootstrap foundation | 03–07 | Projection contract | Domain mapper + Application projection/provider + rendered states | Mapping + provider + committed-to-render integration | Three base scenarios + recovery |
| 3 | `US-04-03` | Pet phản hồi terminal Focus vừa hoàn tất | Celebrate/Bugged đúng fresh outcome và duration, không lặp cùng key | MUST | P0 | 02 | 04–07 | Fresh handoff | One-shot feedback visible in Result/Pet stage | Trigger/duration/dedupe tests | Completed/Strict failed/cancel/break matrix |
| 4 | `US-04-04` | Pet luôn ưu tiên việc đang diễn ra và không replay cũ | Active session preempt stale feedback; reopen/relaunch/resume về base đúng | MUST | P0 | 03 | 05–07 | Fresh handoff | Observable arbitration/no-replay transitions | Priority/preemption/runtime recreation/remount tests | Start new session, reopen, relaunch, resume |
| 5 | `US-04-05` | Animation chỉ chạy khi Pet nhìn thấy | Background/unmount/offscreen dừng playback; foreground derive lại đúng | MUST | P1 | 04 | 06–07 | ADR-005 | Loop/one-shot renderer + lifecycle/performance evidence | visibility/cleanup/no-restart tests | background/unmount + 30-minute device matrix |
| 6 | `US-04-06` | Pet state vẫn hiểu được khi giảm chuyển động hoặc asset lỗi | Still pose/fallback/status text giữ core flow usable | MUST | P1 | 05 | 07 | Accessibility review | Reduced-motion and layered fallback surfaces | fallback/a11y/component variants | OS reduced motion + failure injection |
| 7 | `US-04-07` | Pet production identity hoàn chỉnh và Epic có exit evidence | Final approved Pet assets thay neutral placeholder mà không đổi behavior | MUST | P2/GATED | 06, `OPEN-001` resolved | EPIC-04 exit | `GATE-PET-IDENTITY` | Production asset catalog/attribution + final walkthrough record | manifest/asset/fallback/regression suite | Final iOS/Android matrix + owner acceptance |

## 8. Authoritative execution graph

```text
OWNER-STORY-APPROVAL
  → US-04-01 Home composition/common primitives
  → US-04-02 committed base projection
  → US-04-03 fresh terminal feedback
  → US-04-04 arbitration/preemption/no-replay
  → US-04-05 lifecycle/performance
  → US-04-06 reduced motion/fallback/accessibility
  → [OPEN-001 / GATE-PET-IDENTITY resolved + authority sync]
  → US-04-07 production assets + final Epic evidence
  → OWNER EPIC EXIT
```

Không có nhánh song song. `OPEN-001` có thể được Product/Art xử lý trong thời gian chờ nhưng không
làm `US-04-07` active đồng thời với Story khác.

## 9. User Story details

### US-04-01 — Pet Room production-ready bằng reusable primitives

**User story:** Là người dùng quay lại PixelDoro, tôi muốn thấy một Pet Room rõ ràng, ấm áp và nhất
quán để tôi biết tiến trình của mình và bắt đầu phiên Focus tiếp theo ngay.

| Identity | Giá trị |
|---|---|
| MVP Priority | MUST |
| Dependency priority | P0 — UX foundation |
| Dependencies | EPIC-01 foundation; EPIC-03 `UX_APPROVED` |
| Blocks | `US-04-02` đến `US-04-07` |
| Gate | `OWNER-STORY-APPROVAL`; không cần `OPEN-001` |
| Initial status | `NOT_STARTED` |
| Current status | `DONE_OWNER_ACCEPTED` |

#### Outcome và output

- User-visible outcome: Home/Pet Room mở được với approved hierarchy, neutral Pet portrait, committed
  profile totals khi available, Focus CTA và friendly loading/recovery state.
- Output mở/nhìn thấy: tab `Pet Room` trong Development Build; state ready/loading/recovery qua
  production boundary hoặc injected application fixture, không qua review reducer như truth.
- Screen/state: Home ready/loading/recovery; không đổi route hoặc Focus CTA destination.
- Reuse: palette, safe area/max width, header/panel/button/stat/status visual contracts.
- Tạo/generalize: `ScreenShell`, `ScreenHeader`, `Panel`, `Button`, `StatDisplay`, `StatusSurface`,
  neutral `PetPortrait/PetStage` shell.
- Split: tách production primitives khỏi `prototype-ui.tsx`; chuyển badge/control về prototype-local.
  Split `features/focus/index.tsx` chỉ khi migration Pet import làm file tiếp tục phình; không refactor
  timer behavior.

#### Scope

**In scope:** composition-only Home; common primitive extraction; production/fake boundary rõ;
approved layout/copy regression; responsive/a11y contract.

**Out of scope:** base session mapping ngoài Idle shell, animation, terminal feedback, Timer/Reward,
room purchase/equip, final art, schema.

**Fake còn lại:** Prototype controls và fake secondary journeys vẫn tồn tại trong prototype module.
Home production không đọc `usePrototype`; deterministic UI tests được inject projection props/facade.

**Production foundation:** `MobileApplicationRoot`, bootstrap/recovery barrier, theme, router và
bootstrap profile snapshot. **Cố ý chưa làm:** active-session Pet derivation và motion.

#### Acceptance criteria

- [x] Home giữ đúng hierarchy Pet → stats → Focus CTA → room progress và là resting root.
- [x] Loading/recovery không hiển thị mock data như committed truth; Retry vẫn friendly và safe.
- [x] Neutral portrait không chốt Cat, Dog hoặc Robot.
- [x] Header/button/stat/status có role, label, disabled/busy state phù hợp và focus order hợp lý.
- [x] State không chỉ truyền bằng màu; neutral Pet có semantic status text.
- [x] Reduced motion chưa animate; neutral static shell an toàn.
- [x] Không mutate durable truth, không gọi repository từ screen/component.
- [x] Không replay hoặc terminal behavior nào được thêm ngầm.
- [x] `OPEN-001` giữ `OPEN`.
- [x] Common component không import feature/repository; mỗi component <300 dòng và một trách nhiệm.
- [x] Approved primary journey/component consumer không regression.
- [x] Automated tests pass.
- [x] Manual guide pass.
- [x] Evidence được ghi lại.

#### Implementation boundary

- Domain: không thêm business mapping trong Story này.
- Application: expose profile/home-ready projection tối thiểu từ existing bootstrap/application DTO;
  không đưa raw repository/SQLite row vào UI.
- Presentation: Home chỉ nhận projection/callback, layout component và render slots.
- Adapter/asset: neutral code-rendered portrait; không production bitmap.
- Không Start/Cancel/Reconcile/Reward plan, schema hoặc repository call từ screen.

#### UI reuse plan

| Item | Plan |
|---|---|
| Existing reuse | Palette, shell layout, header/panel/button/stat/status behavior |
| Generalize | Finite variants/slots; `Button` owns disabled/busy semantics; `StatusSurface` owns live region/alert |
| New thật sự cần | `PetStage` composition slot chỉ để tránh Home/Result tự dựng scene |
| Consumers | Home trước; Onboarding/Focus/Break/Result migrate theo Story khi touched |
| Props | Presentation values/callbacks only; no session/repository/domain entity |
| Accessibility | Header role; button role/state; status live-region/alert; portrait label/status text |
| Size estimate | 60–180 dòng/component; style colocated theo component |
| Split rule | Shell/header/panel/button/stat/status/Pet stage tách file; prototype badge/control tách local |

#### Automated test plan

- Component variants, pressed/disabled/busy/selected semantics và callback tests.
- Home integration test từ application-owned ready/loading/recovery projection tới rendered hierarchy.
- Assert Home/production components không import prototype context hoặc Infrastructure.
- Regression test Focus CTA/navigation callback và approved text order.
- Static line/responsibility audit: không component >300 dòng; `prototype-ui.tsx` không còn là
  production barrel.

#### Manual test guide

**Preconditions:** automated checks pass; existing compatible Development Build; record SHA,
platform, OS, device/simulator và viewport; neutral identity gate vẫn open.

**Fixture/scenario:** production-ready bootstrap projection với profile totals; injected read failure
cho recovery; không dùng reducer reward/session làm committed evidence.

**Steps và expected result:**

1. Mở app và vào tab Pet Room. → Header, neutral Pet, stats, primary Focus CTA, room progress đúng
   approved order; không thấy badge/control fake trên production Home.
2. Chọn “Bắt đầu tập trung”. → Mở Focus Setup như prototype đã duyệt; không auto-start session.
3. Quay lại Home và inject loading. → Có polite status, không flash mock totals.
4. Inject recoverable read/bootstrap failure. → Có alert + Retry; retry thành công về Home, không mất data.
5. Bật screen reader, đi theo focus order. → Title → Pet status → stats → CTA → progress; label rõ.
6. Kiểm tra một iOS và một Android phone size phổ biến. → Không clip/overlap; scroll usable.
7. Bật Reduce Motion. → Home vẫn là static neutral composition, không mất state text hoặc action.

**Evidence:** screenshot ready/loading/recovery mỗi platform, focus-order note, SHA/device table.
**Tuyệt đối không xảy ra:** fake controls, repository error/SQL text, species-specific art, navigation
change, profile mutation.

#### Implementation evidence — 2026-08-30

- Production Home đọc committed profile snapshot qua Application projection; không đọc
  `PrototypeProvider`, review reducer hoặc repository từ screen/component.
- Home giữ hierarchy Pet → stats → Focus CTA → room progress; neutral Pet không chốt Cat, Dog hoặc
  Robot. Level được derive thuần từ committed total XP theo công thức Product đã duyệt.
- Common UI được tách thành focused primitives; prototype badge/control ở prototype-local boundary;
  `prototype-ui.tsx` 399 dòng đã được loại bỏ và không có component mới vượt 300 dòng.
- Root quality pass: typecheck, lint, `31` test files / `174` tests, device harness, boundary checks
  (`11` forbidden rejected / `3` valid accepted) và repository hygiene.
- Không chạy native/EAS/prebuild. Owner xác nhận “Đã test” và yêu cầu tiến hành Story tiếp theo ngày
  2026-08-30, nên `US-04-01` được đóng và `US-04-02` được active. Platform/device/screenshot metadata
  không được cung cấp trong turn xác nhận và không được tài liệu này tự suy diễn.

---

### US-04-02 — Pet phản ánh base state đã commit

**User story:** Là người dùng, tôi muốn Pet hiển thị đang chờ, đang làm việc hoặc đang nghỉ theo
phiên thật đã commit để người bạn luôn phản ánh đúng việc tôi đang làm.

| Identity | Giá trị |
|---|---|
| MVP Priority | MUST |
| Dependency priority | P0 — correctness foundation |
| Dependencies | `US-04-01`; Session/Profile repository và readiness foundation |
| Blocks | `US-04-03` đến `US-04-07` |
| Gate | `COMMITTED-PROJECTION-CONTRACT` |
| Initial status | `NOT_STARTED` |
| Current status | `IMPLEMENTED_AWAITING_OWNER_MANUAL_EVIDENCE` |

#### Outcome và output

- Visible: no active → `idle`; committed running Focus → `working`; committed running Short/Long
  Break → `breaking`; recovery không giả thành Pet state.
- Output: Home/Focus/Break Pet stage render từ one Application projection/provider.
- Reuse: `PetStage`, `StatusSurface`, screen primitives từ 01.
- New: Domain pure base mapper; Application `PetCompanionProjection`; controller/provider selectors.
- Split: Pet renderer không biết session type; feature screen không biết mapping.

#### Scope

**In scope:** read-only committed base mapping, refresh/hydrate provider, recovery/error projection,
screen integration và fixtures. **Out:** start/resolve command, countdown truth, terminal one-shot,
animation, schema.

**Fake còn lại:** reviewer state can inject application DTO in tests/dev review, nhưng không được gọi
prototype reducer là production truth. **Foundation:** `SessionRepository.findActive`, profile/bootstrap,
composition root/lifecycle. **Chưa làm:** terminal event handoff.

#### Acceptance criteria

- [x] No active committed session render `idle`.
- [x] Running Focus (standard/trial) render `working`.
- [x] Running Short/Long Break render `breaking`.
- [x] Cancelled Focus/Break hoặc completed Break với no active render base `idle`.
- [x] Countdown `0`, route hoặc notification không tự đổi Pet state.
- [x] Invalid/corrupt/unavailable truth render recovery, không chọn Pet state an toàn giả.
- [x] Semantic text nói rõ state; không chỉ màu/pose.
- [x] Presentation không mutate durable truth và không gọi repository.
- [x] Không terminal replay/request trong Story này; `OPEN-001` không bị chốt.
- [x] Common components giữ single responsibility và <300 dòng.
- [x] Automated mapping/provider/integration tests pass.
- [ ] Manual guide pass.
- [ ] Evidence được ghi lại.

#### Implementation boundary

- Domain: `PetState` và pure base decision nhận minimal committed active-session fact; không clock,
  React, SQLite hoặc route.
- Application: use case đọc typed repository sau readiness, map sang immutable projection DTO và
  typed recovery/error; controller is subscribable/rebuildable.
- Presentation: provider/hook nhận facade/controller; `PetStage` chỉ render `state`, status copy,
  motion/fallback flags; screens compose.
- Composition: inject existing repository vào use case/controller; facade không expose repository.
- Không production Start/Resolve/Reward; integration fixture insert committed rows qua test support.

#### UI reuse plan

| Item | Plan |
|---|---|
| Existing | Pet stage shell, status text, Home/Focus/Break slots |
| Generalize | `PetStage` props `{state, statusLabel, visualMode, isVisible}`; state not derived inside |
| New | Provider selector/hook; feature-local Pet placement wrapper only if layout differs |
| Consumers | Home, Focus Running, Break Running; Result waits Story 03 |
| Accessibility | Accessible group + state-specific readable label; duplicate decorative nodes hidden |
| Estimate/split | Mapper <120; controller modules <220; renderer <180; provider <150 |

#### Automated test plan

- Pure mapping table for no-active/Focus/Short Break/Long Break and invalid/impossible facts.
- Assert trial running maps Working but no Strict inference.
- Application test reads committed repository fake and publishes immutable projection after success.
- Recovery test for unavailable/corrupt read; prior unsafe projection not exposed as fresh truth.
- Integration from committed SQLite session fixture → Application projection → rendered semantic state.
- Regression: countdown tick/route/remount inputs cannot alter mapper result.

#### Manual test guide

**Preconditions:** 01 done; existing Development Build; test fixture capable of committed rows;
record SHA/platform/device. **Scenarios:** no active, committed running Focus, committed Short Break,
committed Long Break, unavailable/corrupt read.

1. Launch with no active row. → Pet Room says waiting/Idle.
2. Load committed running Focus then open relevant screen. → Working text/pose; display tick changes
   do not reset/change logical state.
3. Load committed Short Break and Long Break separately. → Both show Breaking; no Strict warning from Pet.
4. Commit cancel/complete Break and refresh with no active session. → Idle; no celebration/reward.
5. Inject unsafe read. → Recovery + Retry; no guessed Idle/Working/Breaking.
6. Screen-reader pass. → Each state announced in text; state remains understandable without color.
7. Bật Reduce Motion. → Base state vẫn có static representation/semantic text; logical mapping không đổi.

**Evidence:** state screenshots, committed fixture IDs/status table, recovery result, device/SHA.
**Không được xảy ra:** screen queries DB, fake reducer considered truth, countdown-driven state, Break
Bugged/celebration, new schema.

#### Implementation evidence — 2026-08-30

- Domain pure mapper quyết định `idle` / `working` / `breaking` chỉ từ minimal committed active-session
  fact; invalid/impossible fact trả typed failure thay vì đoán state.
- Application controller đọc `SessionRepository.findActive`, publish immutable
  `loading/ready/recovery` projection, coalesce concurrent refresh và bỏ stale result sau dispose.
- Composition inject repository vào application-scoped controller, hydrate sau bootstrap, refresh khi
  app active hoặc Pet Room được focus; Presentation facade không expose repository.
- Home, Focus Running và Break Running dùng cùng projection/provider. Countdown, route và prototype
  reducer không được truyền vào mapper; Result one-shot vẫn chờ `US-04-03`.
- Neutral code-rendered Pet có pose tĩnh riêng cho Idle/Working/Breaking; không chốt species và không
  thêm animation trước Story 05. Semantic status text vẫn là nguồn diễn đạt chính.
- SQLite repository → Application controller integration pass; explicit Development Build review
  fixtures `idle/focus/short_break/long_break/error` chỉ bật bằng
  `EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE` trong dev và không ghi `pixeldoro.db`.
- Root quality pass: typecheck, lint, `38` test files / `205` tests, device harness, boundary checks và
  repository hygiene. Manual guide `apps/mobile/test/device/pet-base-state-smoke.md` vẫn `PENDING`.
- Không thêm schema/migration, production Start/Resolve/Reward, terminal event hoặc Pet identity.

---

### US-04-03 — Pet phản hồi terminal Focus vừa commit

**User story:** Là người dùng vừa hoàn thành hoặc thất bại một Strict Focus, tôi muốn nhận phản hồi
Pet ngắn và đúng outcome để nỗ lực được công nhận mà không bị chậm hoặc phán xét.

| Identity | Giá trị |
|---|---|
| MVP Priority | MUST |
| Dependency priority | P0 — transient correctness |
| Dependencies | `US-04-02` |
| Blocks | `US-04-04`–`07` |
| Gate | `FRESH-TERMINAL-HANDOFF` |
| Initial status | `NOT_STARTED` |

#### Outcome và output

- Fresh committed completed Focus sau reward commit → `celebrating` tối đa 2.000 ms.
- Fresh committed Strict failed Focus → `bugged` tối đa 1.500 ms.
- Cancelled Focus, completed/cancelled Break không tạo one-shot.
- Cùng `sessionId + terminalStatus` trong runtime chỉ được accept một lần.
- Output visible trong Pet stage/Result without blocking CTA/navigation.

#### Scope

**In:** committed-transition event contract, terminal mapper, hold time, runtime dedupe, one-shot render
decision và status copy. **Out:** production resolver/reward implementation, priority/preemption across
new active session (Story 04), full playback lifecycle (05), final asset.

**Fake:** deterministic committed-event fixture được phép cho tests/manual review, phải được gắn nhãn
fixture và đi qua production event contract sau simulated commit success. **Foundation:** terminal
session/reward types/repositories; no direct database polling to invent freshness.

#### Acceptance criteria

- [ ] Celebrate chỉ sau completed Focus + reward truth committed; failure trước commit không request.
- [ ] Bugged chỉ sau Strict Focus failed commit; Relax/trial/Break không request Bugged.
- [ ] Celebrate <=2.000 ms; Bugged <=1.500 ms; input/navigation không bị block.
- [ ] Duplicate same runtime key bị drop; no durable receipt.
- [ ] Cancelled Focus/Break và completed Break về base projection, no reward/one-shot.
- [ ] Animation/status failure không rollback hoặc grant/revoke reward.
- [ ] Semantic copy warm, concise, non-guilt-heavy; no color-only state.
- [ ] Reduced-motion full policy deferred to 06 nhưng renderer có static-capable contract.
- [ ] Không chốt `OPEN-001`; component rules đạt.
- [ ] Automated tests pass.
- [ ] Manual guide pass.
- [ ] Evidence được ghi lại.

#### Implementation boundary

- Domain: pure terminal decision từ committed transition DTO (`sessionType`, variant/mode,
  terminalStatus, rewardCommitted where required), reject impossible combinations.
- Application: emit `FreshCommittedTerminalTransition` only after caller reports successful commit;
  runtime dedupe store/clock port; event is not repository row hydration.
- Presentation: render accepted one-shot and status; timeout completion returns request control to
  current base projection.
- Production Timer/Reward Epic later owns calling the handoff after its commit; EPIC-04 provides and
  verifies contract, not resolver logic.

#### UI reuse plan

- Reuse `PetStage`, `PetStatusText`, Result layout and common buttons/panels.
- Generalize renderer finite `playback: loop | one-shot | still`, `onVisualComplete` callback that
  cannot mutate product truth.
- New: feature-local result Pet feedback wrapper only if it adds layout, not state rules.
- Consumers: Focus Result and shared Pet stage.
- Accessibility: live-region status once per accepted fresh event; avoid repeated announcement.
- Estimates: terminal mapper <140; dedupe <120; one-shot controller <220; renderer component <200.

#### Automated test plan

- Completed standard/trial Focus with committed reward → Celebrate; reward-not-committed → no request.
- Strict failed → Bugged; Relax failed/impossible → safe error/no request.
- Cancelled Focus, completed/cancelled Break → no terminal Pet request.
- Fake clock exact boundaries 1.500/2.000 ms; early visual finish holds still only to max; never beyond.
- Same key repeated before/after render reads only accepted once in runtime.
- Animation callback/failure cannot invoke repository/transaction/reward.
- Render integration verifies status copy, live-region and non-blocking Result CTA.

#### Manual test guide

**Preconditions:** 02 done; Development Build; committed-event scenario fixture; record durable
session/reward before triggering visual event. **Scenarios:** completed Focus, Strict failed, cancelled
Focus, completed Break, duplicate event.

1. Trigger completed Focus commit fixture with reward committed, then publish fresh event. → Celebrate
   appears immediately, CTA remains tappable, returns to base by 2.000 ms.
2. Trigger fresh Strict failed commit. → Bugged appears with neutral copy, returns by 1.500 ms, no reward.
3. Trigger cancelled Focus and completed Break. → No Celebrate/Bugged; base Idle when no active.
4. Re-send exact key. → No second one-shot or duplicate screen-reader announcement.
5. Force visual playback error. → Static/semantic result remains; reward/session records unchanged.
6. Dùng static/reduced-motion-capable review mode. → Celebrate/Bugged vẫn có state text, đúng hold time
   và không phát lại; full OS reduced-motion acceptance thuộc `US-04-06`.

**Evidence:** short recording with visible timing marker, before/after durable facts, accessibility
announcement note, SHA/device. **Không được xảy ra:** claim action, duplicate reward, route blocking,
guilt copy, Break celebration, persisted receipt.

---

### US-04-04 — Pet ưu tiên committed truth mới và không replay feedback cũ

**User story:** Là người dùng chuyển nhanh giữa Result, Home và phiên mới, tôi muốn Pet luôn phản ánh
việc đang diễn ra thay vì phát lại kết quả cũ gây nhầm lẫn.

| Identity | Giá trị |
|---|---|
| MVP Priority | MUST |
| Dependency priority | P0 — lifecycle correctness |
| Dependencies | `US-04-03` |
| Blocks | `US-04-05`–`07` |
| Gate | Fresh event provenance reviewed |
| Initial status | `NOT_STARTED` |

#### Outcome và output

- Active committed Focus/Break mới preempt stale Celebrate/Bugged.
- Stale/out-of-order terminal request bị drop bằng committed context + recency, không fixed enum priority.
- Result reopen/remount, relaunch/hydration và resume không replay one-shot.
- Output: observable transition one-shot → Working/Breaking hoặc base Idle without flicker/replay.

#### Scope

**In:** arbiter priority, preemption, stale request policy, runtime recreation/remount/resume contract.
**Out:** frame performance/visibility renderer implementation (05), Timer commands, durable receipt.

#### Acceptance criteria

- [ ] Safety/recovery gate > active committed session > accepted fresh terminal request > Idle.
- [ ] New active Focus/Break after commit preempts old one-shot immediately.
- [ ] Current committed Result context + recency resolves terminal tie; impossible same-session terminal
  combination enters safe error/recovery rather than arbitrary Bugged/Celebrate priority.
- [ ] Hydrate terminal row on relaunch, reopen Result, rerender/reconcile read không replay.
- [ ] Backgrounded one-shot is discarded; resume derive base and does not replay.
- [ ] Idle does not prematurely preempt a valid one-shot absent higher truth.
- [ ] Arbiter only selects visual state; no durable mutation/reward decision.
- [ ] Accessibility announcement follows accepted render state once; component <300 dòng.
- [ ] `OPEN-001` remains open; component/reuse rules đạt.
- [ ] Automated tests pass.
- [ ] Manual guide pass.
- [ ] Evidence được ghi lại.

#### Implementation boundary

- Domain: pure arbitration decision from base/current request/context/recency.
- Application/controller: application-scoped runtime state, seen keys, freshness provenance, lifecycle
  discard; new runtime starts with no hydrated terminal event.
- Presentation: subscribes render decision; Result route mount itself never emits terminal event.
- Repository remains read truth only; no `resultViewed`/receipt column.

#### UI reuse plan

- Reuse shared Pet stage/status and screen compositions.
- New `PetVisualDecision` DTO; arbiter is non-React module with a narrow subscribe/snapshot API.
- Consumer: one provider for all screens, not one arbiter per screen.
- Accessibility: announcement ID follows accepted decision; stale/drop produces no announcement.
- Estimate: arbiter <250 dòng; split freshness/dedupe clock helpers if approaching 220; provider <150.

#### Automated test plan

- Priority matrix: recovery, active Focus, active Break, fresh terminal, idle.
- StartFocus/StartBreak committed projection preempts current terminal request.
- Older terminal event after active session is dropped; multiple terminal requests use context/recency.
- Same session impossible completed+failed produces safe error decision.
- New controller/runtime + hydrated terminal record produces base only.
- Result unmount/remount/read repeat and resume do not emit/request/replay.
- Integration: committed projection update → provider → rendered Working/Breaking before stale one-shot.

#### Manual test guide

**Preconditions:** 03 done; Development Build; fixtures for fresh terminal plus committed active session;
ability to terminate/relaunch app process.

1. Start valid Celebrate then commit/start Break fixture before 2 s. → Immediately Breaking; Celebrate
   never resumes afterward.
2. Start Bugged then commit/start Focus fixture. → Immediately Working.
3. Reopen Result multiple times. → Result data stays correct; no new one-shot/announcement.
4. Terminate app after terminal commit and relaunch same build. → Base Idle/no-active or active state,
   no Celebrate/Bugged replay.
5. Background during one-shot, then foreground. → Old one-shot does not replay; base derives correctly.
6. Inject stale terminal request after active session. → No visible flash.
7. Bật static/reduced-motion-capable mode và screen reader. → Cùng arbitration/no-replay result;
   stale/drop state không tạo duplicate announcement.

**Evidence:** recordings of two preemptions, relaunch/reopen/resume table, SHA/device.
**Không được xảy ra:** queued old animations, fixed Bugged-over-Celebrate guess, `resultViewed` write,
session/reward mutation.

---

### US-04-05 — Animation chỉ chạy khi nhìn thấy và không ảnh hưởng focus flow

**User story:** Là người dùng, tôi muốn Pet chuyển động mượt khi nhìn thấy nhưng dừng khi app hoặc
screen không còn hiển thị để PixelDoro không tốn pin hay làm chậm phiên Focus.

| Identity | Giá trị |
|---|---|
| MVP Priority | MUST |
| Dependency priority | P1 — performance/lifecycle |
| Dependencies | `US-04-04` |
| Blocks | `US-04-06`, `US-04-07` |
| Gate | ADR-005 Reanimated baseline; Skia excluded |
| Initial status | `NOT_STARTED` |

#### Outcome và output

- Idle/Working/Breaking loop when visible; Celebrate/Bugged one-shot/hold when visible.
- Playback stops on background, screen blur/not-visible and unmount; countdown rerender does not
  restart loop.
- Foreground derives current decision and starts a valid base loop; old one-shot stays discarded.
- 30-minute target matrix records frame/jank, memory, CPU/thermal/energy, cold-start and binary delta.

#### Scope

**In:** Reanimated sprite/static renderer contract, visibility aggregation, cleanup, loop restart policy,
performance benchmark/runbook. **Out:** Skia spike unless separate ADR gate, final art, native/EAS build
by agent, production timer.

#### Acceptance criteria

- [ ] Loop state does not restart on countdown/projection-equivalent rerender.
- [ ] One-shot does not loop or block input/navigation.
- [ ] Background, blur/not-visible, recovery replacement and unmount cancel visual work/timers.
- [ ] Foreground starts current base state only after safe projection/reconciliation boundary.
- [ ] Cleanup is idempotent; no late callback changes visible state after unmount/preemption.
- [ ] Animation failure falls toward static contract and never mutates durable truth.
- [ ] Reduced motion switch hook is supported; full still behavior accepted in 06.
- [ ] Reanimated + bundled sprite remains baseline; no Skia/dependency/schema change.
- [ ] Components <300 dòng; renderer, visibility hook and asset playback adapter split by responsibility.
- [ ] Accessibility/status text không bị animation che, lặp hoặc mất focus.
- [ ] Automated tests pass.
- [ ] Manual guide pass.
- [ ] Performance và Story evidence được ghi lại.

#### Implementation boundary

- Domain/Application arbitration remains from 02–04.
- Mobile Presentation hook combines app lifecycle projection + route/screen focus + mount state into
  `isVisible`; it does not derive session truth.
- Renderer owns frames/shared values/cancel; asset access through typed static catalog.
- Lifecycle adapter remains composition-scoped; no per-component native subscription proliferation.

#### UI reuse plan

- Reuse Pet stage/status/fallback container.
- Create `usePetVisualVisibility`, `PetAnimationRenderer`, sprite-player adapter.
- API: render decision, manifest entry, isVisible, reduceMotion, onPlaybackFailure; callbacks cannot
  accept repository/use case.
- Consumers: all Pet stage placements.
- Accessibility text remains outside animated decorative surface.
- Estimate: hook <160, renderer <220, manifest adapter <180; split loop/one-shot driver only if needed.

#### Automated test plan

- Visibility truth table for active/background, focused/blurred, mounted/unmounted.
- Fake animation driver verifies start/cancel counts and idempotent cleanup.
- Equivalent Working projection/countdown rerender does not restart.
- State change/preemption cancels prior playback before new playback.
- Unmount/background prevents late completion callback; foreground no terminal replay.
- Playback failure routes static failure state without thrown crash or application mutation.
- Timer/hold-time fake-clock tests remain deterministic.

#### Manual test guide

**Preconditions:** 04 done; existing compatible Development Build with Reanimated; OS performance
tools available; owner selects minimum supported iOS 16.4+/Android API 24+ target where practical
plus one current/mid-range target. No new build solely for planning.

1. Observe Idle, Working, Breaking for normal use. → Smooth state-appropriate loop; text readable.
2. Keep Working visible while countdown/UI rerenders. → Loop does not visibly restart/jump.
3. Background 10–30 seconds then foreground. → Visual work stops in background; foreground derives
   committed state; no old terminal replay.
4. Navigate away/unmount Pet screen and return. → No duplicate driver/timer; current base starts once.
5. Start one-shot and navigate immediately. → Navigation responds; playback cancels.
6. Run each loop/one-shot sequence for 30 minutes on ADR-005 matrix. → Record jank >100 ms, memory
   growth, CPU/thermal/energy, cold start and binary delta; no leak/freeze blocker.
7. Bật Reduce Motion và screen reader trong một lifecycle pass. → Driver motion không tiếp tục chạy;
   semantic status/action vẫn đọc được. Full fallback acceptance thuộc `US-04-06`.

**Evidence:** screen recording, lifecycle log/counter without raw session payload, benchmark table,
SHA/build/device. **Không được xảy ra:** background animation, duplicated loops, blocked CTA,
production log payload, Skia addition without gate.

---

### US-04-06 — Reduced motion, layered fallback và semantic Pet state

**User story:** Là người dùng cần giảm chuyển động hoặc gặp lỗi asset, tôi muốn vẫn hiểu Pet đang ở
trạng thái nào và tiếp tục Focus flow an toàn.

| Identity | Giá trị |
|---|---|
| MVP Priority | MUST |
| Dependency priority | P1 — accessibility/resilience |
| Dependencies | `US-04-05` |
| Blocks | `US-04-07` |
| Gate | Accessibility/fallback contract owner review |
| Initial status | `NOT_STARTED` |

#### Outcome và output

- Reduced motion renders state-specific still pose; terminal still stays within approved hold time.
- Fallback chain: state playback → state fallback frame → same-Pet Idle still → neutral code
  placeholder + semantic status.
- Missing/corrupt asset/playback failure never crash/block/mutate session or reward.
- Status is announced/readable and does not rely on color, sprite or motion.

#### Scope

**In:** OS reduced-motion subscription, static pose policy, deterministic asset-failure boundary,
sanitized diagnostics, roles/labels/live-region/focus behavior. **Out:** remote asset retry/download,
new Pet state, final identity, visual redesign.

#### Acceptance criteria

- [ ] Reduced motion: Idle/Working/Breaking use state still; Celebrate/Bugged use state still no longer
  than 2.000/1.500 ms and remain preemptible.
- [ ] Missing playback but readable asset uses same-state fallback frame.
- [ ] Missing state frame uses selected Pet Idle still plus current semantic state text.
- [ ] Missing all bitmap uses neutral geometric placeholder plus current semantic state text.
- [ ] Playback/asset failure does not crash, block actions, grant/rollback reward or alter projection.
- [ ] Diagnostics sanitized, no raw session payload/Pet name, no network retry.
- [ ] Pet/status group has clear role/label; decorative frames hidden; live announcements are not spammed.
- [ ] Buttons/selected/disabled/busy/focus order remain accessible after common migration.
- [ ] No `OPEN-001` decision; all components <300 dòng và reuse rules đạt.
- [ ] Automated tests pass.
- [ ] Manual guide pass.
- [ ] Evidence được ghi lại.

#### Implementation boundary

- Application projection retains logical state independent of visual availability/reduced motion.
- Presentation reduced-motion adapter exposes boolean and cleanup; asset catalog returns typed lookup
  result/failure, not provider exception.
- Renderer chooses fallback only; never chooses session/Pet logical state.
- Diagnostic port best effort outside core transaction.

#### UI reuse plan

- Reuse `PetStage`, `PetStatusText`, `StatusSurface`, common Button.
- Generalize `MotionAwarePetStage` finite `visualMode` and fallback slot; no feature import.
- New typed `PetAssetCatalog`/manifest reader and neutral code placeholder.
- Consumers: Home, Focus, Break, Result, Onboarding once migrated.
- Estimate: reduced-motion hook <140; fallback resolver <180; neutral placeholder <120; stage <220.

#### Automated test plan

- Reduced-motion initial value/change listener/cleanup tests.
- Every logical state maps to correct still pose and semantic label.
- Layered failure matrix: animation failure, missing/corrupt state sheet, missing fallback frame,
  missing all; assert exact next fallback.
- Terminal still duration/preemption/no-replay tests.
- Accessibility role/label/live-region; state not color-only; no duplicate announcement on rerender.
- Common component variant/disabled/selected/busy regression tests.
- Assert diagnostic is sanitized and core repository/transaction calls remain zero during failure.

#### Manual test guide

**Preconditions:** 05 done; Development Build; OS Reduce Motion control; dev-only asset/playback failure
injection that cannot alter product DB.

1. Enable Reduce Motion before launch and inspect all five states. → State-specific still pose + text;
   no motion, no lost CTA.
2. Toggle Reduce Motion while loop/one-shot runs. → Motion stops safely; logical state/reward unchanged.
3. Inject playback failure with state asset present. → Same-state fallback frame.
4. Remove/mark current state asset corrupt. → Same-Pet Idle still + current state text.
5. Mark all bitmap unavailable. → Neutral geometric placeholder + current state text.
6. Use screen reader/high text size. → State, result and actions understandable; focus order stable; layout scrolls.

**Evidence:** screenshot matrix five states in reduced motion, each fallback layer, accessibility notes,
before/after durable facts, SHA/device. **Không được xảy ra:** remote download, crash, silent/color-only
state, Cat/Dog/Robot inference, reward/session mutation.

---

### US-04-07 — Production Pet identity/assets và Epic exit

**User story:** Là người dùng, tôi muốn người bạn Pet có identity và animation production đã được
duyệt để trải nghiệm đồng hành hoàn chỉnh, nhất quán trên iOS và Android.

| Identity | Giá trị |
|---|---|
| MVP Priority | MUST |
| Dependency priority | P2 — final acceptance, `GATED` |
| Dependencies | `US-04-06`; `OPEN-001` resolved + authority sync |
| Blocks | EPIC-04 exit; production Pet acceptance in later Epics |
| Gate | `GATE-PET-IDENTITY` hard gate |
| Initial status | `BLOCKED_BY_OPEN_001` |

#### Outcome và output

- Approved Cat/Dog/Robot decision (do owner/Product-Art chốt, không phải Story này) được tích hợp qua
  stable Pet ID, five-state bundled asset set, manifest/fallback/attribution.
- Final Home/Focus/Break/Result walkthrough shows production Pet without changing approved behavior.
- Epic exit evidence ties exact assets, app SHA/runtime and iOS/Android results.

#### Scope

**In sau gate:** authority sync references, optimized bundled assets, typed manifest, attribution,
visual timing/performance/accessibility acceptance, full Epic regression/evidence. **Out:** tự chọn
identity, multiple Pet, evolution/stats/gameplay, Skia without gate, schema for type/name.

**Fake còn lại:** prototype neutral art may remain in prototype-only review surfaces until migrated,
but production consumer uses approved catalog. **Production foundation:** all 01–06 behavior unchanged.

#### Acceptance criteria

- [ ] `OPEN-001` được owner/Product-Art chuyển `RESOLVED` và authority documents sync trước asset accept.
- [ ] Không Story/asset/copy ngầm chọn species trước decision.
- [ ] Approved stable `<pet-id>` có Idle/Working/Breaking/Celebrating/Bugged manifest và fallback frame.
- [ ] Bundled static imports, naming/layout/attribution khớp Project Structure; core works offline.
- [ ] Timing, preemption, no-replay, lifecycle, reduced motion, fallback và semantics không regression.
- [ ] Asset missing/corrupt still falls through approved chain; animation failure no crash/mutation.
- [ ] Final layout works on common iOS/Android phone sizes and performance gate has no blocker.
- [ ] No component >300 dòng; no feature rule in common renderer; no schema/migration.
- [ ] Full automated matrix/root quality pass.
- [ ] Owner manual matrix pass.
- [ ] Evidence được ghi lại.
- [ ] Chỉ sau tất cả criteria owner mới được đánh `US-04-07 DONE` và `EPIC-04 DONE`.

#### Implementation boundary

- Product/Art owns identity/art approval; Engineering only integrates approved stable IDs/assets.
- Typed static catalog lives in Presentation asset boundary; binary under mobile assets with attribution.
- Domain/Application contracts remain identity-neutral; no species-specific enum/gameplay.
- No persistence field unless a future approved data-needs change proves a durable fact; current map says no.

#### UI reuse plan

- Reuse complete stage/renderer/fallback stack from 01–06; only manifest/assets change.
- New files limited to approved binary assets, manifest/catalog entries and attribution/evidence.
- Consumers remain all Pet stage placements through one catalog API.
- Accessibility labels remain state/outcome-based, không assume decorative artwork conveys meaning.
- Manifest/catalog modules <220 dòng; split by stable Pet ID/state when real responsibility warrants.

#### Automated test plan

- Manifest completeness and static asset resolution for all five states/fallback frames.
- Asset dimension/frame index/playback mode validation; one-shot duration cannot exceed spec.
- Offline/static catalog test; no dynamic path/remote fetch.
- Full mapping/arbitration/dedupe/preemption/relaunch/resume/lifecycle/reduced-motion/fallback suite.
- Common UI/approved primary journey regression and architecture boundary tests.
- Root quality/repository hygiene; assert no Skia/new migration/species-specific domain rule.

#### Manual test guide

**Preconditions:** owner has resolved `OPEN-001` and synced authority; 06 done; assets frozen; automated
checks pass; same release-candidate SHA on compatible iOS/Android Development Builds.

1. Run final matrix in mục 14. → Every state/outcome/transition/fallback matches expected behavior.
2. Inspect assets at 1x/common screen densities and common phone sizes. → Crisp/readable/no clipping.
3. Run reduced motion and every fallback injection. → Semantics/actions preserved.
4. Run 30-minute animation matrix on minimum/current representative devices. → No blocker/leak/jank.
5. Airplane mode relaunch. → All core Pet assets work; no network dependency/replay.
6. Compare approved prototype hierarchy/CTA/back/result journey. → No UX regression.

**Evidence:** Product-Art decision reference, asset IDs/checksums/attribution, screenshots/video, exact
SHA/runtime/device matrix, performance table, owner signed result. **Không được xảy ra:** Story start
before gate, unapproved species/copy, remote core asset, schema addition, Skia shortcut, fabricated
platform pass.

## 10. Epic checklist → Story → evidence traceability

| Epic criterion | Story | Automated evidence | Manual evidence |
|---|---|---|---|
| Pet derives committed truth, not tick/route/notification | 02 | Mapper/provider/integration | Idle/Working/Breaking + tick check |
| Focus running → Working; Break → Breaking; none → Idle | 02 | Table tests | Three-state scenario set |
| Completed Focus after reward commit → Celebrate | 03 | Commit-gated trigger test | Completed fixture recording |
| Strict failed → Bugged; cancel → Idle | 03 | Outcome matrix | Failed/cancel walkthrough |
| Completed Break no celebrate/reward | 02–03 | Negative tests | Break completion walkthrough |
| Active session preempts stale one-shot | 04 | Arbiter/preemption | Start Break/Focus during one-shot |
| Relaunch/Result reopen/resume no replay | 04 | Runtime/remount tests | Process relaunch/reopen/background |
| Animation failure no crash/block/mutation | 05–06 | Failure/zero-write tests | Inject playback/asset failure |
| Animation stops not visible | 05 | Visibility/cleanup | Background/unmount/offscreen |
| Reduced motion/static fallback + text | 06 | Motion/fallback/a11y | OS toggle + fallback matrix |
| Production asset only after `OPEN-001` | 07 | Gate/manifest audit | Owner Product-Art acceptance |
| Approved Home/Pet experience | 01–07 | UI regression | Final walkthrough/screenshots |

## 11. Common component reuse matrix

| Component/pattern | 01 | 02 | 03 | 04 | 05 | 06 | 07 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Screen shell/header/panel/button | Create/generalize | Reuse | Reuse | Reuse | Reuse | Regression | Regression |
| Stat/status/loading/recovery | Create/generalize | Reuse | Reuse | Reuse | Reuse | A11y harden | Regression |
| Pet stage/portrait/status text | Neutral shell | Base states | One-shot state | Arbiter consumer | Animation renderer | Motion/fallback | Approved assets |
| Confirmation dialog | Migrate contract if touched | Reuse only | Result actions remain non-blocking | Regression | Unmount check | A11y check | Final regression |
| Prototype badge/controls | Keep local | Test-only adapter label | Fixture only | Fixture only | Fixture only | Fixture only | Not production |
| Input/Switch/Timer block | Defer | Defer | Defer | Defer | Pet slot only | A11y regression | Final regression |

## 12. Automated test matrix

| Test area | 01 | 02 | 03 | 04 | 05 | 06 | 07 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Common component variants/a11y | Primary | Regression | Regression | Regression | Regression | Full | Full |
| Approved Home/journey regression | Primary | Yes | Yes | Yes | Yes | Yes | Final |
| Pure Pet base mapping | — | Primary | Regression | Regression | Regression | Regression | Full |
| Committed projection → render | Home state | Primary | Extend | Extend | Extend | Extend | Full |
| Terminal mapping/commit gate | — | — | Primary | Regression | Regression | Regression | Full |
| Duration/runtime dedupe | — | — | Primary | Extend | Regression | Reduced-motion | Full |
| Preemption/stale/no-replay | — | — | Basic | Primary | Extend | Extend | Full |
| Visibility/background/unmount | — | — | — | Resume contract | Primary | Extend | Full |
| Reduced motion/fallback/assets | Neutral shell | Semantic base | Static-capable | No replay | Failure handoff | Primary | Full assets |
| Zero durable mutation on visual failure | Boundary | Boundary | Primary | Primary | Primary | Primary | Full |
| Manifest/offline/performance contract | — | — | — | — | Baseline | Fallback | Primary |

Test support ưu tiên fake clock/repository/animation driver/lifecycle. SDK/platform boundary có thể mock.
Không test `PrototypeReducer` outcome như production truth; không tạo JSON probe làm evidence chính.

## 13. Per-Story manual evidence summary

| Story | Owner phải chạy | Evidence tối thiểu |
|---|---|---|
| 01 | Home ready/loading/recovery + common sizes/a11y | Screenshots, focus order, SHA/device |
| 02 | Idle/Working/Breaking + recovery from committed fixtures | State screenshots + fixture fact table |
| 03 | Complete/Strict fail/cancel/Break + duration/dedupe | Timed recording + durable before/after |
| 04 | Preempt/reopen/relaunch/resume | Transition recordings + relaunch table |
| 05 | Background/unmount/offscreen + 30-minute matrix | Lifecycle evidence + benchmark table |
| 06 | OS reduced motion + four fallback levels + screen reader | Screenshot/failure matrix + a11y notes |
| 07 | Final full iOS/Android walkthrough on frozen SHA | Decision/asset/performance/device acceptance set |

## 14. Final Epic manual walkthrough matrix

Owner tự chạy trên Development Build; ghi exact SHA, app/runtime version, platform, OS, device/target,
date, PASS/FAIL và evidence link. Một final release-candidate SHA phải được dùng cho iOS và Android;
không ghi platform pass nếu chưa thực sự chạy.

| # | Scenario | Expected result | Evidence |
|---:|---|---|---|
| 1 | Home, no active session | `idle`, semantic waiting text | Screenshot |
| 2 | Committed Focus running | `working`; tick/route không đổi logical state | Recording |
| 3 | Committed Short/Long Break running | `breaking`; no Strict/Bugged | Recording |
| 4 | Fresh completed Focus after reward commit | `celebrating` <=2.000 ms; reward already committed | Timed video + facts |
| 5 | Fresh Strict failed Focus | `bugged` <=1.500 ms; no reward; neutral copy | Timed video + facts |
| 6 | Cancelled Focus/Break | Base `idle`, no one-shot/reward | Screenshot/facts |
| 7 | Completed Break | Idle, no Celebrate/reward | Screenshot/facts |
| 8 | Start active session during one-shot | Working/Breaking preempts immediately | Recording |
| 9 | Relaunch after terminal commit | No old one-shot; derive base/current active | Process-relaunch record |
| 10 | Reopen Result | Correct durable result, no replay/grant | Recording + facts |
| 11 | Background/unmount during animation | Playback/timer stops; no late callback | Lifecycle log/video |
| 12 | Foreground | Reconcile/derive correct current base; no replay | Recording |
| 13 | OS Reduce Motion | State-specific still pose + text | Screenshot set |
| 14 | Missing animation/playback | Same-state fallback frame | Failure screenshot |
| 15 | Missing state asset/frame | Same-Pet Idle still + current semantic text | Failure screenshot |
| 16 | Missing all Pet asset | Neutral code placeholder + semantic text | Failure screenshot |
| 17 | Animation failure | No crash/block/session/reward mutation | Before/after facts |
| 18 | Common component regression | CTA/tab/full-screen/back/Result hierarchy unchanged | Journey recording |
| 19 | Common iOS/Android phone sizes | Readable, scrollable, no clip/overlap | Device screenshots |
| 20 | 30-minute performance matrix | No blocker/leak; metrics recorded per ADR-005 | Benchmark report |
| 21 | Airplane-mode relaunch | Bundled Pet visuals/fallback available offline | Recording |

## 15. Owner confirmation gate — xác nhận một lượt

Owner đã xác nhận toàn bộ mục sau trong một lượt ngày 2026-08-30 trước khi `US-04-01` active:

- [x] Chấp nhận decomposition bảy Story và execution order `01 → 02 → 03 → 04 → 05 → 06 → 07`;
  solo developer chỉ active một Story.
- [x] Chấp nhận Home production composition giữ approved hierarchy, còn `PrototypeProvider`/
  controls/reward/countdown fake ở boundary riêng và không là production truth.
- [x] Chấp nhận Pet base mapping ở Domain, committed projection/event DTO/controller ở Application,
  provider/renderer ở Presentation; screen không gọi repository.
- [x] Chấp nhận animation arbiter application-scoped, runtime-only, không persist, không đặt trong
  screen/prototype reducer/Domain entity.
- [x] Chấp nhận split `prototype-ui.tsx` thành focused primitives và Pet stage; prototype badge/control
  giữ local; không component >300 dòng.
- [x] Chấp nhận Reanimated + bundled sprite direction, visibility cleanup, reduced-motion still pose và
  layered fallback; không Skia nếu chưa vượt ADR-005 gate.
- [x] Xác nhận `OPEN-001 / GATE-PET-IDENTITY` chỉ cho phép neutral placeholder ở 01–06 và hard-block
  production Pet asset acceptance, `US-04-07 DONE` cùng Epic exit; tài liệu này không chọn Cat/Dog/Robot.
- [x] Chấp nhận owner manual evidence per Story và final iOS/Android Development Build matrix; agent
  không chạy native/EAS build hoặc Expo prebuild trong planning.

Approval Story list không đồng nghĩa resolve `OPEN-001`, approve artwork hoặc approve implementation.

## 16. Definition of Ready

### 16.1. Epic Ready để bắt đầu Story đầu tiên

- [x] Owner confirmation mục 15 hoàn tất trong một lượt.
- [x] Document chuyển khỏi `READY_FOR_OWNER_STORY_REVIEW` bằng owner-approved change.
- [x] Worktree sạch hoặc mọi owner change không overlap Story active.
- [x] Chỉ `US-04-01` được active; các Story sau vẫn `NOT_STARTED`/`BLOCKED`.

### 16.2. Story Ready

- [ ] Story trước `DONE` với automated + manual evidence được owner chấp nhận.
- [ ] Current baseline SHA và affected files được audit lại; không overwrite uncommitted owner work.
- [ ] Story tasks là vertical outcome, không chia thành layer-only mini projects.
- [ ] Props/projection/error/fake boundary và component split được refine đủ để implement.
- [ ] Test fixtures phản ánh committed facts; không biến fake behavior thành production truth.
- [ ] Gate riêng đã đóng; đặc biệt `US-04-07` không Ready khi `OPEN-001` còn `OPEN`.

## 17. Definition of Done

### 17.1. Story Done

- [ ] User-visible outcome mở và kiểm tra được theo guide.
- [ ] Acceptance checklist của Story hoàn tất bằng evidence thật.
- [ ] Domain/Application/Presentation/adapter boundary đúng và không repository call từ screen.
- [ ] Common UI reuse/migration không duplicate implementation; component <300 dòng.
- [ ] Automated targeted tests, root quality, boundary và repository hygiene pass.
- [ ] Owner manual Development Build guide pass với SHA/platform/device evidence.
- [ ] Không native/EAS/prebuild artifact, JSON probe, schema/migration hoặc out-of-scope Product behavior.
- [ ] Evidence record được cập nhật trước khi Story sau active.

### 17.2. Epic Done

- [ ] `US-04-01`–`US-04-07` đều Done theo authoritative order.
- [ ] `OPEN-001` resolved/authority-synced và production Pet assets được Product-Art accept.
- [ ] Toàn bộ Epic checklist/automated matrix/final manual matrix pass trên frozen SHA.
- [ ] No known core-flow, lifecycle, accessibility, fallback hoặc performance blocker.
- [ ] Owner explicit approve Epic exit; planning status/evidence được cập nhật bằng turn riêng.

## 18. Open risks/decisions

| ID | Risk/decision | Impact | Owner/mitigation | Status |
|---|---|---|---|---|
| `OPEN-001` | Default Pet Cat/Dog/Robot | Blocks production assets/07/Epic exit | Product/Art resolve; no inference | OPEN |
| `RISK-04-01` | Prototype common file 399 lines/god-component drift | Duplication, >300 rule | Split in 01 with consumer regression | OPEN until 01 |
| `RISK-04-02` | Root prototype provider mistaken for app truth | Wrong state/reward/replay | Independent production facade/provider; import tests | OPEN until 02 |
| `RISK-04-03` | Latest terminal row mistaken as fresh event | Relaunch/reopen replay | Commit-time event provenance; no read inference | OPEN until 03–04 |
| `RISK-04-04` | Startup reconciliation is currently noop | Unsafe active projection if overclaimed | 02 exposes read/recovery boundary only; Timer Epic owns production reconcile | VISIBLE DEPENDENCY |
| `RISK-04-05` | Reanimated asset/frame cost on low-end device | Jank/battery/leak | 05 ADR-005 benchmark and simplify decoration first | OPEN until 05 |
| `RISK-04-06` | Accessibility semantics duplicated by animated nodes | Repeated/spam announcements | One semantic status owner; decorative frames hidden | OPEN until 06 |
| `RISK-04-07` | Architecture/schema drives UX | Approved flow regression or needless migration | Authority order + data-needs no-gap decision | MONITOR |
| `RISK-04-08` | Final iOS/Android evidence missing/fabricated | Invalid Epic exit | Frozen SHA and explicit per-platform owner record | OPEN until 07 |

## 19. Change log

### 0.3.0 — 2026-08-30

- Ghi nhận owner đã test/chấp nhận `US-04-01` và yêu cầu mở Story tiếp theo; không tự điền metadata
  platform/device/screenshot chưa được cung cấp.
- Implement `US-04-02`: committed Pet base mapper, read-only Application controller/provider,
  lifecycle/focus refresh, recovery không đoán state và Home/Focus/Break integration.
- Thêm SQLite integration evidence cùng Development Build review fixture/guide không mutate database;
  `US-04-02` đang chờ owner manual evidence trước khi active `US-04-03`.
- Giữ `OPEN-001` nguyên trạng; không thêm production Timer/Reward/terminal behavior hoặc schema.

### 0.2.0 — 2026-08-30

- Ghi nhận owner duyệt toàn bộ confirmation và thứ tự triển khai bảy Story trong một lượt.
- Hoàn tất implementation + automated gates của `US-04-01`; giữ Story ở trạng thái chờ owner manual
  Development Build evidence, chưa active `US-04-02`.
- Tách production common UI khỏi prototype-only controls, nối Home với committed profile projection
  và thêm pure Level progression projection.
- Giữ `OPEN-001` nguyên trạng; `US-04-07` và Epic exit tiếp tục bị hard-block.

### 0.1.0 — 2026-08-30

- Tạo EPIC-04 Story list ở trạng thái `READY_FOR_OWNER_STORY_REVIEW` từ baseline merged
  `d859e1fe8d3dd4f82d602902b8517ab31729fd67`.
- Ghi baseline inventory, code/component/projection audit và xác nhận data-needs không có schema gap.
- Chia bảy user-visible vertical Story theo production Home → base committed projection → fresh
  terminal feedback → arbitration/no-replay → lifecycle/performance → reduced motion/fallback/a11y →
  gated production assets/Epic exit.
- Tách rõ MVP priority, dependency priority, execution order, output hữu hình, automated/manual
  evidence, common component plan và owner one-pass confirmation.
- Giữ `OPEN-001` nguyên trạng; không chọn Cat, Dog hoặc Robot; không tạo implementation plan riêng.
