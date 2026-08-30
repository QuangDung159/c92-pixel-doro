---
document_id: PIXELDORO_MVP_EPIC_BREAKDOWN
title: PixelDoro Mobile MVP — Epic Breakdown
version: 1.1.0
status: APPROVED
last_updated: 2026-08-30
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
approved_by: Dũng Lư
approver_role: Product Owner
approved_at: 2026-08-27
amended_at: 2026-08-30
amendment_approved_by: Dũng Lư
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
9. `MVP Priority` và `Execution Order` là hai khái niệm khác nhau: mọi Epic trong file này đều `MUST`, nhưng chỉ được thực hiện theo thứ tự đã công bố.
10. Không bắt đầu Epic kế tiếp khi exit gate của Epic hiện tại chưa có evidence, trừ một spike/prototype được ghi rõ là non-production và không được tính completion.
11. Testing, accessibility, offline behavior, privacy và recovery được thực hiện trong Epic sở hữu behavior; không dồn toàn bộ về `EPIC-12`.
12. Analytics event contract/hook được thêm cùng feature tạo event; provider delivery, queue và final taxonomy validation thuộc `EPIC-11`.
13. Từ `EPIC-03`, mọi Product capability phải đi theo thứ tự: user outcome → user flow → clickable
    UI mock → owner UX approval → thin vertical implementation → technical hardening.
14. Mock được phép dùng fake/in-memory data, fake navigation, placeholder asset và deterministic
    state switcher; không cần production Domain/DB/native integration để được review UX.
15. Không khóa schema/repository/domain model mới trước UI-flow approval. Sau approval mới map
    `screen/state → action → domain fact → persist/derive → schema tối thiểu`.
16. Schema `EPIC-02` là implementation baseline hiện có, không phải lý do ép UX. Nếu approved flow
    cần dữ liệu khác, update Data Model và forward migration thay vì bẻ UI theo database cũ.
17. Evidence đầu tiên của Product Epic phải là flow nhìn thấy và thao tác được. Log/probe/test chỉ
    là evidence kỹ thuật bổ sung sau khi experience direction đã đúng.

### 1.3. Trạng thái checklist

- `[ ]`: Chưa hoàn thành hoặc chưa có evidence.
- `[x]`: Hoàn thành và đã có evidence phù hợp.

Nếu đang thực hiện, trạng thái được quản lý ở planning tool/issue tracker; checkbox chỉ được đánh dấu khi item hoàn tất.

## 2. Priority và execution model

### 2.1. Priority definitions

| Thuộc tính | Ý nghĩa | Giá trị áp dụng |
|---|---|---|
| `MVP Priority` | Mức độ bắt buộc đối với Mobile MVP/closed beta | Tất cả Epic là `MUST`. Không Epic nào là optional/nice-to-have trong baseline hiện tại. |
| `Delivery Wave` | Nhóm outcome cần hoàn thành trước khi qua milestone kế tiếp | `W1_FOUNDATION`, `W2_EXPERIENCE_VALIDATION`, `W3_VERTICAL_MVP`, `W4_BETA_RELEASE`. |
| `Execution Order` | Thứ tự solo developer bắt đầu và hoàn thành Epic | `01` đến `12`; đây là thứ tự authoritative mặc định. |
| `Start Gate` | Evidence bắt buộc trước khi mở Epic | Exit gate của Epic đứng ngay trước trong execution order, cộng decision gate trực tiếp nếu có. |
| `Exit Gate` | Outcome/evidence tối thiểu để đóng Epic và mở Epic tiếp theo | Completion checklist + Definition of Epic Done. |

`MUST` không có nghĩa mọi Epic được làm đồng thời. Với solo developer, execution order tối ưu cho feedback và giảm rework quan trọng hơn việc mở nhiều Epic sớm.

### 2.2. Authoritative execution order

| Order | Epic | Loại | MVP Priority | Delivery Wave | Start Gate | Exit outcome mở Epic kế tiếp |
|---:|---|---|---|---|---|---|
| `01` | `EPIC-01` — Mobile Foundation | Enabler | `MUST` | `W1_FOUNDATION` | Epic plan được review | Workspace/build/quality baseline chạy được trên iOS và Android. |
| `02` | `EPIC-02` — Durable Data & Bootstrap | Enabler | `MUST` | `W1_FOUNDATION` | `EPIC-01 DONE` | SQLite schema/migration/bootstrap/recovery có integration evidence. |
| `03` | `EPIC-03` — MVP Experience Prototype & User-flow Validation | Product Discovery | `MUST` | `W2_EXPERIENCE_VALIDATION` | `EPIC-02 DONE` | Clickable primary flow dùng mock data/fake navigation được owner duyệt trước production behavior. |
| `04` | `EPIC-04` — Pet Companion | Product | `MUST` | `W3_VERTICAL_MVP` | `EPIC-03 DONE`; neutral placeholder được phép tới khi Pet gate đóng | Approved Home/Pet flow được triển khai thành vertical slice nhỏ nhất. |
| `05` | `EPIC-05` — Onboarding Trial | Product | `MUST` | `W3_VERTICAL_MVP` | `EPIC-04 DONE`; Pet naming chỉ block production persistence nếu flow cần | Trial 5 phút hoàn thành end-to-end và nhận reward đúng một lần. |
| `06` | `EPIC-06` — Standard Focus | Product | `MUST` | `W3_VERTICAL_MVP` | `EPIC-05 DONE` | Standard Relax/Strict Focus hoàn thành/cancel/fail end-to-end. |
| `07` | `EPIC-07` — Break & Cadence | Product | `MUST` | `W3_VERTICAL_MVP` | `EPIC-06 DONE` | Focus → explicit Break/Home loop và Long Break cadence đúng durable truth. |
| `08` | `EPIC-08` — Progression & Shop | Product | `MUST` | `W3_VERTICAL_MVP` | `EPIC-07 DONE` | XP/Coin/level/shop/purchase/equip loop hoàn chỉnh và offline. |
| `09` | `EPIC-09` — History & Contribution | Product | `MUST` | `W3_VERTICAL_MVP` | `EPIC-08 DONE`; `GATE-CONTRIBUTION-COLOR` đóng trước final visual QA | History/contribution đọc đúng durable sessions và exclusions. |
| `10` | `EPIC-10` — Settings & Data Control | Product | `MUST` | `W3_VERTICAL_MVP` | `EPIC-09 DONE` | User kiểm soát setting, permission preference, analytics opt-out và reset. |
| `11` | `EPIC-11` — Analytics, Feedback & Store Review | Product/Operational | `MUST` | `W3_VERTICAL_MVP` | `EPIC-10 DONE` | Beta signals/feedback/review flow hoạt động đúng privacy/integrity guardrails. |
| `12` | `EPIC-12` — Beta Readiness | Release | `MUST` | `W4_BETA_RELEASE` | `EPIC-11 DONE` | Toàn bộ MVP có device evidence và closed-beta artifact/rollback path. |

### 2.3. Master execution checklist

- [x] `01 / EPIC-01 / W1` — Mobile Foundation.
- [x] `02 / EPIC-02 / W1` — Durable Data & Bootstrap.
- [x] `03 / EPIC-03 / W2` — MVP Experience Prototype & User-flow Validation.
- [ ] `04 / EPIC-04 / W3` — Pet Companion.
- [ ] `05 / EPIC-05 / W3` — Onboarding Trial.
- [ ] `06 / EPIC-06 / W3` — Standard Focus.
- [ ] `07 / EPIC-07 / W3` — Break & Cadence.
- [ ] `08 / EPIC-08 / W3` — Progression & Shop.
- [ ] `09 / EPIC-09 / W3` — History & Contribution.
- [ ] `10 / EPIC-10 / W3` — Settings & Data Control.
- [ ] `11 / EPIC-11 / W3` — Analytics, Feedback & Store Review.
- [ ] `12 / EPIC-12 / W4` — Beta Readiness.

## 3. Critical path và delivery gates

### 3.1. Authoritative solo-developer critical path

```text
EPIC-01
  → EPIC-02
  → EPIC-03
  → EPIC-04
  → EPIC-05
  → EPIC-06
  → EPIC-07
  → EPIC-08
  → EPIC-09
  → EPIC-10
  → EPIC-11
  → EPIC-12
```

Đây là execution path được dùng để tạo Story/Task priority. Dependency kỹ thuật có thể cho phép một Epic bắt đầu sớm hơn về mặt lý thuyết, nhưng solo developer không làm vậy nếu Epic trước chưa đạt exit gate.

### 3.2. Delivery wave gates

| Wave | Epic | Gate để kết thúc Wave | Ý nghĩa |
|---|---|---|---|
| `W1_FOUNDATION` | `EPIC-01` → `EPIC-02` | `FOUNDATION_READY` | Workspace và existing durable-data foundation sẵn sàng; không mở rộng schema trước UX. |
| `W2_EXPERIENCE_VALIDATION` | `EPIC-03` | `PRIMARY_FLOW_APPROVED` | Primary MVP flow có clickable mock, fake data/navigation và explicit owner UX approval. |
| `W3_VERTICAL_MVP` | `EPIC-04` → `EPIC-11` | `MVP_FEATURE_COMPLETE` | Approved experience được thay dần bằng vertical production slices và đủ 18 scope item. |
| `W4_BETA_RELEASE` | `EPIC-12` | `CLOSED_BETA_READY` | Device matrix, hardening, delivery và rollback path hoàn tất. |

Không mở Wave kế tiếp khi gate của Wave hiện tại chưa đạt.

### 3.3. Lý do của execution order

1. `EPIC-01 → 02` kết thúc phần foundation đã đầu tư; không tiếp tục engineering-first sau đó.
2. `EPIC-03` kiểm chứng trước toàn bộ primary experience bằng UI nhìn thấy, mock data và fake navigation.
3. `EPIC-04 → 07` thay mock bằng các vertical slice nhỏ theo đúng flow đã duyệt: Pet/Home → Trial → Standard Focus → Break.
4. Timer/session/reward correctness không còn là một Epic vô hình riêng; chỉ được đào sâu trong slice đang cần behavior đó.
5. `EPIC-08 → 11` mở rộng progression/history/settings/feedback sau khi core loop đã dùng được.
6. Schema/query/provider mới chỉ được thiết kế sau screen/action/state tương ứng được owner duyệt.
7. `EPIC-12` gom cross-platform parity, migration/runtime audit và release hardening; không dùng để sửa UX cơ bản chưa được validate.

### 3.4. Cross-cutting execution rules

- Mỗi Product Epic bắt đầu bằng flow/state inventory và clickable mock; owner duyệt UX trước implementation plan kỹ thuật.
- Fake data, fake navigation và placeholder asset là acceptance hợp lệ của prototype nhưng phải được gắn nhãn non-production.
- UI flow quyết định domain facts cần có; schema/DB không được dùng làm source of product truth hoặc ép interaction design.
- Chỉ persist facts cần sống qua relaunch hoặc cần audit/idempotency; presentation state và dữ liệu derive không tự động trở thành column.
- Mỗi Epic phải hoàn thành unit/integration/device evidence phù hợp sau khi user-visible direction được duyệt; `EPIC-12` chạy cross-feature/device matrix cuối.
- Accessibility, reduced motion, offline behavior, error/recovery và privacy được triển khai cùng Story sở hữu behavior.
- Analytics event contract/hook được thêm trong `EPIC-05` đến `EPIC-10`; PostHog adapter, bounded queue và final allowlist validation thuộc `EPIC-11`.
- Settings/default-state contract được thiết lập trong `EPIC-02`/capability owner; Settings UI và user control hoàn thiện ở `EPIC-10`.
- Prototype `EPIC-03` có thể merge dưới dev-only/fake boundary nếu default app rõ ràng là prototype; nó không tạo durable product truth hoặc chốt Product decision `OPEN`.
- Nếu approved UX mâu thuẫn schema/architecture cũ, ưu tiên UX đã duyệt và tạo explicit model/migration decision; không bẻ flow để bảo vệ sunk technical work.

## 4. Product decision gates

Ba decision sau vẫn `OPEN` và không được Epic này tự chốt:

| Gate | Decision | Epic bị ảnh hưởng trực tiếp | Milestone phải chốt |
|---|---|---|---|
| `GATE-PET-IDENTITY` | `OPEN-001` — Pet mặc định là Cat, Dog hay Robot | `EPIC-04`, `EPIC-05`, asset production trong `EPIC-12` | Trước khi chọn/tích hợp production Pet asset. |
| `GATE-CONTRIBUTION-COLOR` | `OPEN-006` — Ngưỡng màu contribution graph | `EPIC-09`, visual QA trong `EPIC-12` | Trước khi khóa contribution visual design. |
| `GATE-PET-NAMING` | `OPEN-009` — Có cho đặt tên Pet trong onboarding hay không | `EPIC-05`, schema/migration liên quan | Không block placeholder mock; phải đóng trước final production naming UX hoặc thêm Pet-name field. |

Trong khi gate chưa chốt:

- Được dùng neutral placeholder/fallback để phát triển phần không phụ thuộc decision.
- Không seed species/name, không khóa artwork và không viết acceptance test giả định một phương án.
- Không coi placeholder là production decision.

## 5. Epic definitions

### EPIC-01 — Mobile Foundation và Delivery Baseline

**Loại:** Enabler

- **MVP priority:** `MUST`
- **Delivery wave:** `W1_FOUNDATION`
- **Execution order:** `01`
- **Status:** `DONE`
- **Start gate:** Epic plan được review; không có upstream implementation dependency.

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

- [x] Workspace layout và package dependency direction khớp Project Structure.
- [x] Root scripts chạy được typecheck, lint và test theo workspace.
- [x] Forbidden imports giữa Domain/Application/Presentation/Infrastructure bị CI phát hiện.
- [x] Mobile development build khởi động được trên ít nhất một iOS target và một Android target.
- [x] Composition root là nơi duy nhất biết concrete dependency graph.
- [x] Route files chỉ làm composition, không chứa business rule hoặc SDK/database access.
- [x] Development, preview và production build/update boundary được cấu hình.
- [x] Native dependency/config change không thể bị phát hành nhầm chỉ bằng OTA.
- [x] Signing secret/credential không được commit vào repository.
- [x] Skia không nằm trong baseline dependency khi chưa vượt ADR-005 gate.

**Out of scope:** Desktop app, backend, cloud sync, DI container, Turborepo/Nx và abstraction chỉ phục vụ future scope.

---

### EPIC-02 — Durable Local Data, Migration và Safe Bootstrap

**Loại:** Enabler

- **MVP priority:** `MUST`
- **Delivery wave:** `W1_FOUNDATION`
- **Execution order:** `02`
- **Status:** `DONE` — owner close/re-baseline ngày 2026-08-30.
- **Start gate:** `EPIC-01 DONE`.

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

- [x] Initial migration tạo đúng toàn bộ schema normative.
- [x] Foreign key, one-running-session index và terminal immutability được enforce.
- [x] Exact catalog có đúng 12 item, ID/name/category/price theo Product Core.
- [x] Settings seed dùng `relax`; sound/haptic/notification preference/analytics bằng `1`.
- [x] Không có field Pet species/name/stage hoặc feature `DEFERRED` trong schema.
- [x] Migration có version, checksum, gap detection và rollback behavior.
- [x] Migration/bootstrap failure giữ dữ liệu và chặn unsafe command.
- [x] Database recovery có Retry; không tự reset hoặc tự repair balance/session.
- [x] Full reset cần explicit confirmation, atomic và giữ schema/catalog hợp lệ.
- [x] Product history/ledger/ownership không bị background-prune.
- [x] Migration/constraint/reset integration tests có evidence.

**Closeout note:** Host/real-SQLite matrix pass `25` files / `153` tests trên SHA
`79f6e4dcea8965810f190011f507fa73732eb6a2`; các Story `US-02-01`–`08` có iOS runtime evidence.
Owner chủ động re-baseline ngày 2026-08-30: final same-SHA iOS/Android aggregate parity không còn
block Product discovery và được chuyển sang `EPIC-12` release-hardening. iOS phase 1 của aggregate
đã commit/close sentinel thành công; chưa được ghi thành final platform pass khi phase 2 chưa có.

**Out of scope:** Cloud ID, sync revision, remote database, feedback free-text outbox và background product-history retention job.

---

### EPIC-03 — MVP Experience Prototype và User-flow Validation

**Loại:** Product Discovery / UI Prototype

- **MVP priority:** `MUST`
- **Delivery wave:** `W2_EXPERIENCE_VALIDATION`
- **Execution order:** `03`
- **Status:** `DONE` — clickable prototype và data-needs map được owner duyệt ngày 2026-08-30.
- **Start gate:** `EPIC-02 DONE`; không cần thêm schema/domain/timer implementation.

**Outcome:** Owner có thể nhìn thấy, bấm qua và duyệt primary PixelDoro experience trước khi team
đầu tư tiếp vào Timer/Session/Pet/Gamification internals.
**Dependency:** `EPIC-01`; dùng foundation hiện có nhưng không bị schema `EPIC-02` ràng buộc UX.
**Nguồn chính:** Product Core, user-flow review với owner và visual direction; technical specs chỉ
được dùng làm constraint khi prototype cần biểu đạt state, không drive screen structure.

**In scope:**

- Map primary journey: First Use → Home/Pet Room → configure Focus → running → terminal Result →
  reward feedback → explicit Break/Home.
- Clickable React Native UI mock chạy trong Development Build hiện có.
- Fake/in-memory fixtures, fake navigation và deterministic state switcher cho happy/alternate/error
  states; không cần production use case hoặc SQLite write.
- Mock Home/Pet, Focus setup, running timer, completed/failed/cancelled Result, Break choice và các
  entry point tối thiểu tới Shop/History/Settings/Feedback.
- Neutral Pet/asset/copy placeholder cho decision `OPEN`; không ngầm chốt species/name/colors.
- Owner review về information hierarchy, CTA, back behavior, state transitions, copy và cảm nhận
  core reward loop.
- Sau approval, lập data-needs map: screen/state → action → domain fact → persist/derive → schema
  tối thiểu; ghi rõ chỗ nào schema hiện tại cần giữ, bỏ qua hoặc migrate.

**Epic completion checklist:**

- [x] Primary user-flow diagram được review trước Story implementation kỹ thuật.
- [x] Clickable mock chạy được end-to-end bằng fake data/fake navigation.
- [x] Happy path từ First Use tới completed Focus/reward/Home nhìn thấy được.
- [x] Failed/cancelled, empty/loading/error và recovery entry có mock state đủ để review.
- [x] Owner xác nhận screen hierarchy, CTA, transition và back/exit behavior.
- [x] Không cần JSON probe để hiểu prototype outcome; demo chính nằm trên UI.
- [x] Không có production Timer/Session/Reward/Pet rule được implement trước UX approval.
- [x] Product decision `OPEN` dùng placeholder, không được chốt ngầm.
- [x] Data-needs map phân biệt durable fact, transient UI state và derived projection.
- [x] Chỉ sau explicit owner UX approval mới mở implementation planning `EPIC-04`–`07`.

**Closeout note:** Owner duyệt lean flow và sáu UX confirmation, sau đó duyệt clickable prototype
ngày 2026-08-30. Prototype dùng Presentation-owned in-memory reducer, fake navigation/countdown và
neutral placeholder; root `pnpm quality` pass `26` files / `158` tests. Data-needs map xác nhận
approved UX không cần schema/migration mới và không chốt `OPEN-001`, `OPEN-006`, `OPEN-009`.

**Out of scope:** Production timer correctness, background/relaunch reconciliation, reward commit,
notification scheduling, schema migration mới, real purchase/equip, analytics provider và final art.

---

### EPIC-04 — Home/Pet Room và Pet Companion Projection

**Loại:** Product

- **MVP priority:** `MUST`
- **Delivery wave:** `W3_VERTICAL_MVP`
- **Execution order:** `04`
- **Start gate:** `EPIC-03 DONE`; neutral placeholder được phép, nhưng `GATE-PET-IDENTITY` phải đóng trước Epic exit/production asset acceptance.

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

- **MVP priority:** `MUST`
- **Delivery wave:** `W3_VERTICAL_MVP`
- **Execution order:** `05`
- **Start gate:** `EPIC-04 DONE`; approved prototype flow là baseline. `GATE-PET-NAMING` chỉ phải
  đóng trước production naming persistence/copy nếu approved flow thực sự cần naming.

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

- **MVP priority:** `MUST`
- **Delivery wave:** `W3_VERTICAL_MVP`
- **Execution order:** `06`
- **Start gate:** `EPIC-05 DONE`.

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

- **MVP priority:** `MUST`
- **Delivery wave:** `W3_VERTICAL_MVP`
- **Execution order:** `07`
- **Start gate:** `EPIC-06 DONE`.

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

- **MVP priority:** `MUST`
- **Delivery wave:** `W3_VERTICAL_MVP`
- **Execution order:** `08`
- **Start gate:** `EPIC-07 DONE`.

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

- **MVP priority:** `MUST`
- **Delivery wave:** `W3_VERTICAL_MVP`
- **Execution order:** `09`
- **Start gate:** `EPIC-08 DONE`; `GATE-CONTRIBUTION-COLOR` không block low-fidelity flow/mock,
  chỉ block final contribution visual acceptance.

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

- **MVP priority:** `MUST`
- **Delivery wave:** `W3_VERTICAL_MVP`
- **Execution order:** `10`
- **Start gate:** `EPIC-09 DONE`.

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

- **MVP priority:** `MUST`
- **Delivery wave:** `W3_VERTICAL_MVP`
- **Execution order:** `11`
- **Start gate:** `EPIC-10 DONE`; event contracts/hooks từ Epic tạo behavior đã tồn tại.

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

- **MVP priority:** `MUST`
- **Delivery wave:** `W4_BETA_RELEASE`
- **Execution order:** `12`
- **Start gate:** `EPIC-11 DONE` và `MVP_FEATURE_COMPLETE`.

**Outcome:** Mobile MVP đáp ứng acceptance definition, chạy ổn định trên iOS/Android target và sẵn sàng phát hành internal/closed beta có rollback path.  
**Dependency:** `EPIC-01` đến `EPIC-11`.  
**Nguồn chính:** Product Core §18–19, Technical Overview §10, ADR-005, ADR-007 và toàn bộ implementation acceptance criteria.

**In scope:**

- Cross-feature acceptance audit theo Product Core và specification.
- Minimum/current iOS/Android device matrix.
- Background/foreground, kill/relaunch, restart và wall-clock scenario validation.
- Reward/purchase idempotency và migration/reset failure validation.
- Final same-SHA iOS/Android aggregate durability parity được chuyển từ `US-02-09`; prior host/iOS
  Story evidence vẫn là supporting baseline, không được ghi thành Android pass giả.
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
- [ ] `US-02-09_EPIC_EXIT` final aggregate pass trên một iOS và một Android target cùng release-candidate SHA.
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
| 8 | Relax Mode | `EPIC-03` prototype; `EPIC-05`, `EPIC-06` implementation |
| 9 | Strict Mode Lite, grace 10 giây | `EPIC-03` prototype; `EPIC-06` implementation |
| 10 | Local notification cho Focus/Break | `EPIC-03` mock state; `EPIC-06`, `EPIC-07`, `EPIC-10` implementation |
| 11 | Pet states và retro animation | `EPIC-04` |
| 12 | XP và Coin sau completed Focus | `EPIC-03` prototype; `EPIC-05`, `EPIC-06`, `EPIC-08` implementation |
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
- [ ] Với Product Epic: clickable UI/user flow đã được owner duyệt trước production technical plan.
- [ ] Với prototype Epic: fake data/navigation được gắn nhãn rõ và không bị trình bày như production behavior.
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

Việc duyệt master Epic plan hoàn tất item đầu tiên. Các item còn lại là refinement gate
áp dụng riêng trước khi khóa User Story cho từng Product Epic tương lai; chúng không
block trạng thái `APPROVED` của master plan hoặc `DONE` của Epic 1.

- [x] Dũng Lư review và phê duyệt danh sách, outcome và thứ tự Epic.
- [ ] Tạo/review tài liệu user flow end-to-end trước khi khóa Story cho các Product Epic.
- [ ] Tạo clickable UI mock bằng fake data/fake navigation trước mọi schema/domain plan mới.
- [ ] Gắn mỗi flow với Epic owner và source requirement.
- [ ] Xác định happy path, alternate path, error/recovery path và exit state cho từng flow.
- [ ] Ghi decision gate vào Story bị ảnh hưởng bởi `OPEN-001`, `OPEN-006`, `OPEN-009`.
- [ ] Chỉ chia Story đủ nhỏ sau khi flow và acceptance boundary rõ ràng.
- [ ] Lập data-needs map sau UX approval; không suy ngược UX từ schema hiện có.
- [ ] Sau Story mới tạo Task theo layer và test level.
- [ ] Không estimate deadline trước khi Story refinement hoàn tất.

## 10. Change log

### 1.1.0 — 2026-08-30

- Owner re-baseline MVP sang UI/user-flow first: mock data, fake navigation và placeholder được
  phép để validate experience trước technical depth.
- Đóng `EPIC-02` theo host/real-SQLite evidence đã hoàn tất; final same-SHA iOS/Android aggregate
  parity được chuyển minh bạch sang `EPIC-12`, không ghi platform pass chưa có.
- Thay `EPIC-03 — Timer & Session Core` bằng `MVP Experience Prototype & User-flow Validation`;
  Timer/Session/Reward correctness được triển khai incrementally trong approved vertical slices.
- Re-wave thành `W1_FOUNDATION` → `W2_EXPERIENCE_VALIDATION` → `W3_VERTICAL_MVP` →
  `W4_BETA_RELEASE`; giữ solo execution order `01`–`12`.
- Quy định UI approval đi trước schema/domain/repository; approved UX có quyền dẫn tới Data Model
  update/forward migration, không bị sunk schema ép ngược.

### 1.0.0 — 2026-08-27

- Dũng Lư duyệt danh sách, outcome, execution order và delivery gate của 12 Epic làm
  planning baseline với vai trò Product Owner/Tech Lead.
- Đánh dấu `EPIC-01 — Mobile Foundation và Delivery Baseline` là `DONE` theo
  cross-platform build/device evidence và quality/repository gates đã pass.
- Mở start gate cho `EPIC-02`; giữ `EPIC-02` đến `EPIC-12` chưa triển khai.

### 0.2.0 — 2026-08-27

- Tách rõ `MVP Priority`, `Delivery Wave`, `Execution Order`, `Start Gate` và `Exit Gate`.
- Xác nhận toàn bộ 12 Epic đều là `MUST`; thứ tự `01 → 12` là authoritative execution path cho solo developer.
- Chia delivery thành `W1_FOUNDATION`, `W2_CORE_LOOP`, `W3_MVP_COMPLETE` và `W4_BETA_RELEASE` với gate rõ ràng.
- Ghi start gate, wave và execution order trực tiếp trong từng Epic definition.
- Bổ sung lý do sequencing để ưu tiên correctness, Pet companion, vertical trial validation, core Focus/Break loop rồi mới mở rộng breadth.
- Bổ sung cross-cutting rules: test/accessibility/offline/privacy/recovery phải hoàn tất trong Epic sở hữu; analytics contract/hook được thêm cùng feature; `EPIC-12` chỉ là final audit/release gate.
- Quy định stop-the-line khi phát hiện thiếu upstream invariant/schema/architecture và không mở Epic/Wave kế tiếp khi exit gate chưa đạt.

### 0.1.0 — 2026-08-27

- Tạo Epic breakdown đầu tiên từ Product Core 1.13.0 và toàn bộ technical/specification baseline đã `APPROVED`.
- Chia 12 Epic theo product outcome/capability và enabler cần thiết cho solo developer.
- Bổ sung dependency order, completion checklist, Definition of Epic Done và pre-story planning checklist.
- Mapping đủ 18 hạng mục Mobile MVP về Epic owner.
- Giữ Product `OPEN-001`, `OPEN-006`, `OPEN-009` dưới dạng decision gate, không chốt ngầm.
- Bổ sung scope guardrails để ngăn roadmap/deferred feature lọt vào Mobile MVP.
