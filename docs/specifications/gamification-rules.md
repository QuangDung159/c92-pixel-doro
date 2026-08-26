---
document_id: PIXELDORO_GAMIFICATION_RULES_SPECIFICATION
title: PixelDoro Mobile MVP — Gamification Rules Specification
version: 1.0.0
status: APPROVED
last_updated: 2026-08-26
owner: Dũng Lư
owner_roles:
  - Tech Lead
  - Product Owner
  - Lead Mobile Developer
reviewer: Dũng Lư
reviewer_role: Tech Lead
reviewed_at: 2026-08-26
approved_by: Dũng Lư
approver_role: Tech Lead / Product Owner
approved_at: 2026-08-26
language: vi
scope:
  - mobile_mvp
  - gamification
  - reward
  - level_progression
  - shop_inventory
authority: TERTIARY
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
timer_engine_baseline: ./timer-engine.md
session_lifecycle_baseline: ./session-lifecycle.md
pet_state_machine_baseline: ./pet-state-machine.md
---

# PixelDoro Mobile MVP — Gamification Rules Specification

## 0. Vai trò, phạm vi và trạng thái quyết định

Tài liệu này đặc tả gamification và economy của PixelDoro Mobile MVP, gồm:

- Điều kiện nhận XP/Coin theo session type và terminal status.
- Công thức, rounding, giới hạn và bảng reward theo Focus duration hợp lệ.
- Transaction boundary, idempotency và chống grant reward nhiều lần.
- Level threshold và cách tính level.
- Điều kiện mở khóa, mua và sở hữu cosmetic item.
- Số lượng item, danh sách item và giá đã duyệt cho shop MVP.
- Edge cases, decision table và acceptance criteria.

Tài liệu này không quyết định lại timer/session/Pet truth và không được dùng để chốt:

- Pet mặc định là Cat, Dog hay Robot; Product `OPEN-001` vẫn `OPEN`.
- Contribution graph color threshold; Product `OPEN-006` vẫn `OPEN`.
- Pet naming; Product `OPEN-009` vẫn `OPEN`.
- Evolution, Happiness, Energy, streak UI/protection, Revive Token, monetization hoặc nội dung `DEFERRED`.
- Schema, datatype, index, migration hoặc exact SQL; các nội dung đó thuộc `architecture/data-model.md`.
- Artwork, sprite, slot layout hoặc visual theme cụ thể của từng item.

Nếu có mâu thuẫn, Product Core 1.12.0 là nguồn sự thật sản phẩm ưu tiên cao nhất. Technical Overview 1.0.0, System Architecture 1.0.0, Project Structure 1.0.0, Timer Engine 1.0.1, Session Lifecycle 1.0.0, Pet State Machine 1.0.0 và ADR-001 đến ADR-008 là baseline đã duyệt.

### 0.1. Trạng thái quyết định

| Trạng thái | Ý nghĩa |
|---|---|
| `LOCKED` | Đã được Product Core khóa; implementation phải tuân theo. |
| `BASELINE` | Đã được tài liệu kỹ thuật/ADR có authority cao hơn chấp nhận; tài liệu này chỉ trace và chi tiết hóa. |
| `PROPOSED` | Phương án đang đề xuất; chưa phải requirement và không được dùng để khóa implementation/acceptance test. |
| `RESOLVED` | Quyết định Gamification Rules đã được Dũng Lư xác nhận. |
| `OPEN` | Chưa quyết định; không được tự suy diễn khi triển khai hoặc viết test. |
| `DEFERRED` | Không thuộc Mobile MVP. |

Phiên bản `1.0.0` đã được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26. `GR-OPEN-001`, `GR-OPEN-002`, `GR-OPEN-003` và Product `OPEN-005` đều đã `RESOLVED`; Product Core 1.12.0 đã đồng bộ onboarding reward, exact catalog/price cùng shop semantics có phê duyệt. Không còn decision `OPEN` ảnh hưởng trực tiếp đến Gamification Rules Mobile MVP.

### 0.2. Authority và traceability

| Nguồn | Phiên bản/trạng thái | Rule được kế thừa |
|---|---|---|
| `PIXELDORO_CORE_TRUTH.md` | 1.12.0 `ACTIVE` | XP/Coin, standard/onboarding Focus reward, level/economy boundary, exact shop catalog/price và deferred boundaries. |
| `TECHNICAL_DOCUMENTATION_CHECKLIST.md` | Hiện hành | Definition of done của Gamification Rules. |
| `architecture/technical-overview.md` | 1.0.0 `APPROVED` | SQLite durable truth, offline-first, reward transaction và side-effect boundary. |
| `architecture/system-architecture.md` | 1.0.0 `APPROVED` | Domain/Application ownership, command serialization, atomic transaction và unique `sessionId`. |
| `architecture/project-structure.md` | 1.0.0 `APPROVED` | Reward/inventory module boundary, naming, test placement và asset neutrality với Product `OPEN-001`. |
| `specifications/timer-engine.md` | 1.0.1 `APPROVED` | Completion truth, concurrency, automatic claim, safe recovery và reward idempotency. |
| `specifications/session-lifecycle.md` | 1.0.0 `APPROVED` | Reward eligibility, formula/rounding, Focus → Reward → Result và Break behavior. |
| `specifications/pet-state-machine.md` | 1.0.0 `APPROVED` | Animation là transient side effect và không thay đổi durable reward truth. |
| ADR-003, ADR-004 | `ACCEPTED` | SQLite/Zustand ownership và pure Domain/platform boundary. |

### 0.3. Decision snapshot của bản phát hành

| Phạm vi | Trạng thái hiện tại | Ghi chú |
|---|---|---|
| Focus reward eligibility/formula/rounding | `LOCKED`/`BASELINE` | Đã chốt trong Product Core 1.12.0. |
| Automatic atomic reward grant/idempotency | `LOCKED`/`BASELINE` | Đã chốt trong Product Core và các baseline kỹ thuật. |
| Level curve và level semantics | `RESOLVED` | `GR-OPEN-001`; Dũng chọn phương án B ngày 2026-08-26. |
| Shop access, purchase và equip conditions | `RESOLVED` | `GR-OPEN-002`; Dũng chọn phương án A ngày 2026-08-26. |
| Onboarding trial reward | `RESOLVED` | `GR-OPEN-003`; Dũng chọn phương án A và Product Core đã đồng bộ. |
| Số lượng item, danh sách và giá | `RESOLVED` | Product `OPEN-005`; Dũng chọn phương án B và Product Core 1.12.0 đã đồng bộ ngày 2026-08-26. |

## 1. Nguyên tắc và invariant

Các invariant sau là normative vì đã được Product Core hoặc baseline cao hơn khóa:

1. Chỉ Focus session có terminal status `completed` nhận XP/Coin.
2. Focus `failed`/`cancelled` và mọi Break không nhận XP/Coin.
3. `xpEarned = completedFocusMinutes`.
4. `coinsEarned = floor(completedFocusMinutes / 5)`.
5. `completedFocusMinutes` là configured Focus duration của session đã commit; không dùng thời gian wall-clock thực tế hoặc thời gian reconcile muộn.
6. Overtime sau `endsAt` không tạo thêm XP/Coin.
7. Completed Focus transition và reward grant phải commit tự động trong cùng database transaction.
8. Mỗi `sessionId` có tối đa một `RewardTransaction`; retry/race không được cộng balance lần hai.
9. Result screen, notification, analytics, Pet animation hoặc việc mở lại Result không được grant/claim reward.
10. Transient Pet state, audio, haptic và animation không thay đổi durable reward truth.
11. Khi session timestamp hoặc database không đọc/validate/commit an toàn, app không tự grant reward.
12. Reward/economy không được trở thành pay-to-focus, yêu cầu quảng cáo, xóa item đã sở hữu hoặc thêm currency thứ ba trong MVP.

## 2. Currency và durable truth

### 2.1. Hai currency của Mobile MVP — `LOCKED`

| Currency | Mục đích | Rule đã khóa |
|---|---|---|
| XP | Level/progression | Chỉ nhận từ completed Focus theo công thức đã duyệt. |
| Coin | Mở khóa cosmetic item | Chỉ nhận từ completed Focus theo công thức đã duyệt. |

Không thêm premium currency, token, streak currency hoặc Revive Token trong Mobile MVP.

### 2.2. Ownership của dữ liệu — `BASELINE`

| Dữ liệu | Durable truth | Không phải truth |
|---|---|---|
| XP/Coin đã kiếm từ session | `RewardTransaction` unique theo `sessionId` cùng balance/progression đã commit | Result copy, analytics event, animation hoặc Zustand state. |
| Reward của một Focus | `xpEarned`, `coinsEarned`, `rewardClaimedAt` và ledger đã commit atomically | Countdown `0`, notification delivery hoặc route Result. |
| Level | Derive từ cumulative XP theo `GR-OPEN-001` đã duyệt; nếu persist để query nhanh thì phải nhất quán với cumulative XP đã commit | Animation `level-up` hoặc badge tạm thời. |
| Item ownership | `OwnedItem`/inventory record đã commit | Shop card, equip animation hoặc analytics `item_unlocked`. |
| Coin spend | Purchase transaction/atomic equivalent chờ Data Model chi tiết hóa | UI optimistic balance. |

SQLite là durable source of truth. Zustand chỉ giữ projection có thể hydrate/dựng lại và không chứa bản sao độc lập của reward formula, level formula hoặc purchase rule.

### 2.3. Economy semantics — `RESOLVED`

Các semantics đã được chốt qua `GR-OPEN-001`:

- XP là cumulative progression, không bị tiêu khi lên level.
- Level bắt đầu từ `1` tại `0 XP`.
- Không có max level riêng; cùng công thức tiếp tục sau level 10.
- Không có level-down trong MVP; full local-data reset có xác nhận là data lifecycle operation, không phải level mechanic.

Các semantics sau đã được chốt qua `GR-OPEN-002`:

- Coin là spendable balance, bắt đầu từ `0`, không được âm.
- XP không được dùng để mua item và không có exchange XP ↔ Coin.
- Reset toàn bộ local data có xác nhận sẽ reset Coin và inventory theo data-reset policy; không có partial economy reset trong MVP.
- Không có refund, sell-back, consumable hoặc discount system trong MVP.

## 3. Reward eligibility theo session outcome

### 3.1. Decision table normative

| Session type | Terminal status | XP | Coin | RewardTransaction | Result behavior | Trạng thái |
|---|---|---:|---:|---|---|---|
| Focus | `completed` | `completedFocusMinutes` | `floor(completedFocusMinutes / 5)` | Tạo tự động tối đa một record theo `sessionId` | Chỉ hiển thị committed reward | `LOCKED`/`BASELINE`. |
| Focus | `failed` | `0` | `0` | Không tạo reward ledger | Result không reward; Pet transient `bugged` | `LOCKED`. |
| Focus | `cancelled` | `0` | `0` | Không tạo reward ledger | Result không reward; Pet base `idle` | `LOCKED`. |
| Onboarding trial Focus | `completed` | `5` | `1` | Tạo tự động tối đa một record theo `sessionId` | Pet celebrate; không tính vào standard history/cadence/store-review/core analytics | `LOCKED`/`RESOLVED` theo Product Core 1.12.0 và `GR-OPEN-003`. |
| Short Break | `completed` | `0` | `0` | Không tạo reward ledger | Không reward/celebration | `LOCKED`/`BASELINE`. |
| Short Break | `cancelled` | `0` | `0` | Không tạo reward ledger | Không reward | `LOCKED`/`BASELINE`. |
| Long Break | `completed` | `0` | `0` | Không tạo reward ledger | Không reward; cadence reset theo Session Lifecycle | `LOCKED`/`BASELINE`. |
| Long Break | `cancelled` | `0` | `0` | Không tạo reward ledger | Không reward; due state không reset | `LOCKED`/`BASELINE`. |
| Break | `failed` | Không áp dụng | Không áp dụng | Không áp dụng | Break không có Strict failure branch | `BASELINE`. |

### 3.2. Các yếu tố không thay đổi reward — `LOCKED`/`BASELINE`

Với cùng một completed Focus duration, reward không thay đổi theo:

- Relax hay Strict Mode.
- Work tag.
- App ở foreground/background tại deadline.
- Notification có được schedule/deliver/tap hay không.
- Reconciliation xảy ra đúng deadline hay muộn hơn.
- Pet animation có chạy thành công hay không.
- Audio/haptic/analytics side effect có thành công hay không.
- Result screen được mở bao nhiêu lần.

Không có streak multiplier, level multiplier, random bonus, ad bonus, item bonus hoặc monetization multiplier trong Mobile MVP.

## 4. Công thức, rounding và reward limit

### 4.1. Công thức normative — `LOCKED`

```text
xpEarned    = completedFocusMinutes
coinsEarned = floor(completedFocusMinutes / 5)
```

Input của công thức phải là configured Focus duration đã persist của session `completed`, không phải:

- `resolvedAt - startedAt`.
- `now - startedAt`.
- Số tick UI.
- Duration do Result screen hoặc analytics payload gửi lại.
- Overtime sau `endsAt`.

### 4.2. Rounding — `LOCKED`

- XP bằng đúng số phút Focus đã cấu hình; không làm tròn dựa trên elapsed milliseconds sau completion.
- Coin dùng `floor`, luôn làm tròn xuống số nguyên.
- Với range/step hiện tại 15–120 phút, bước 5 phút, các Focus duration hợp lệ chia hết cho 5 nên Coin không có phần dư.
- Nếu một future approved duration không chia hết cho 5, `floor` vẫn áp dụng; tài liệu này không tự mở rộng valid duration của MVP.
- Invalid/corrupt duration không được clamp hoặc làm tròn để cấp reward; dùng safe recovery và không grant cho tới khi durable truth an toàn.

### 4.3. Reward limits — `LOCKED`/`BASELINE`

- Per-session minimum cho standard Focus hợp lệ hiện tại: `15 XP` và `3 Coin`.
- Per-session maximum cho standard Focus hợp lệ hiện tại: `120 XP` và `24 Coin`.
- Giới hạn trên phát sinh từ Focus range `15–120` phút, không phải cap áp sau công thức.
- Không có bonus cho overtime; reconcile muộn vẫn dùng configured duration tối đa của chính session đó.
- Baseline không định nghĩa daily/weekly/lifetime reward cap. Việc thêm cap sẽ làm một completed Focus không còn nhận đủ công thức đã duyệt và vì vậy cần Product decision cùng cập nhật authority cao hơn; draft này không thêm cap.

### 4.4. Bảng reward cho mọi standard Focus duration hợp lệ

Bảng dưới dùng range 15–120 phút và step 5 phút hiện hành:

| Focus duration | XP | Coin |
|---:|---:|---:|
| 15 phút | 15 | 3 |
| 20 phút | 20 | 4 |
| 25 phút | 25 | 5 |
| 30 phút | 30 | 6 |
| 35 phút | 35 | 7 |
| 40 phút | 40 | 8 |
| 45 phút | 45 | 9 |
| 50 phút | 50 | 10 |
| 55 phút | 55 | 11 |
| 60 phút | 60 | 12 |
| 65 phút | 65 | 13 |
| 70 phút | 70 | 14 |
| 75 phút | 75 | 15 |
| 80 phút | 80 | 16 |
| 85 phút | 85 | 17 |
| 90 phút | 90 | 18 |
| 95 phút | 95 | 19 |
| 100 phút | 100 | 20 |
| 105 phút | 105 | 21 |
| 110 phút | 110 | 22 |
| 115 phút | 115 | 23 |
| 120 phút | 120 | 24 |

### 4.5. Ví dụ phổ biến

| Tình huống | Phép tính | Kết quả |
|---|---|---|
| Completed Focus 15 phút | `XP = 15`; `Coin = floor(15/5)` | `15 XP`, `3 Coin`. |
| Completed Focus mặc định 25 phút | `XP = 25`; `Coin = floor(25/5)` | `25 XP`, `5 Coin`. |
| Completed Focus 50 phút | `XP = 50`; `Coin = floor(50/5)` | `50 XP`, `10 Coin`. |
| Completed Focus 120 phút, reconcile sau deadline 30 phút | Dùng configured `120`, bỏ overtime | `120 XP`, `24 Coin`. |
| Strict Focus 25 phút failed | Outcome không eligible | `0 XP`, `0 Coin`. |
| Focus 25 phút cancelled ở phút 24 | Outcome không eligible; không partial reward | `0 XP`, `0 Coin`. |
| Long Break 15 phút completed | Break không eligible | `0 XP`, `0 Coin`. |

### 4.6. Onboarding trial — `GR-OPEN-003` (`RESOLVED`)

Dũng Lư chọn phương án A ngày 2026-08-26:

- Trial là special completed Focus có configured duration cố định `5 phút`; đây là ngoại lệ onboarding đối với standard Focus minimum 15 phút.
- Completed trial áp dụng cùng công thức chuẩn và nhận `5 XP`, `1 Coin`.
- Reward được grant tự động, atomically và idempotent bằng RewardTransaction unique theo trial `sessionId` như completed Focus khác.
- `5 XP` được cộng vào cumulative XP/level và `1 Coin` được cộng vào spendable balance.
- Pet có thể `celebrating` sau committed trial reward theo transient animation boundary đã duyệt.
- Trial không tính vào standard Focus history hoặc contribution graph.
- Trial không tăng Long Break cadence.
- Trial không tính vào completed Focus count/active day dùng cho store-review eligibility.
- Trial không phát standard `focus_session_started`/`focus_session_completed`/`reward_granted` core analytics; onboarding analytics tiếp tục dùng `onboarding_started`/`onboarding_completed` theo approved analytics allowlist. Exact onboarding property/event expansion, nếu có, cần analytics schema review riêng.
- Trial chỉ nhận reward khi terminal result là `completed`; incomplete/cancelled trial không nhận partial XP/Coin.

Product Core 1.12.0 chứa toàn bộ duration, reward và exclusion semantics trên; quyết định onboarding được Dũng phê duyệt và đồng bộ lần đầu ở Product Core 1.11.0 ngày 2026-08-26.

## 5. Automatic reward grant và idempotency

### 5.1. Atomic completed Focus transaction — `LOCKED`/`BASELINE`

```text
Reconcile completed Focus
  → SessionCommandCoordinator / single-flight
  → transaction đọc durable session còn running
  → validate timestamp + configured Focus duration
  → Domain xác nhận completed và tính reward delta
  → conditional transition running → completed
  → persist resolvedAt
  → insert RewardTransaction unique(sessionId)
  → cộng XP/Coin đúng một lần
  → persist xpEarned + coinsEarned + rewardClaimedAt
  → cập nhật level/progression theo rule đã duyệt, nếu level được persist
  → commit
  → hydrate committed projection
  → Result/Pet/audio/haptic/analytics chạy best-effort sau commit
```

Không được có durable state `completed` nhưng thiếu reward của một eligible Focus do crash giữa terminal write và reward write. Nếu level được persist để query nhanh thay vì chỉ derive, level update cũng phải nằm trong cùng transaction để không lệch cumulative XP.

### 5.2. Idempotency key và database backstop — `LOCKED`/`BASELINE`

- Business idempotency key của reward là `sessionId`.
- `RewardTransaction.sessionId` phải unique hoặc có atomic equivalent được Data Model duyệt.
- Conditional terminal transition chỉ thành công khi persisted session còn `running`.
- Retry đọc terminal session đã commit và trả committed reward; không insert ledger hoặc cộng balance mới.
- Unique conflict do race không được chuyển thành lần cộng balance thứ hai.
- Một session không được có hai RewardTransaction khác nhau vì reason, Result reopen, notification tap hoặc analytics retry.

### 5.3. Grant authority — `LOCKED`

Chỉ application use case xử lý terminal completed Focus transaction được phép yêu cầu Domain tính reward và persist ledger/balance. Các thành phần sau chỉ đọc/chiếu committed truth:

- Result screen hoặc navigation route.
- Zustand/Presentation store.
- Local notification handler.
- Analytics adapter/event `reward_granted`.
- Pet state/animation arbiter.
- Audio/haptic adapter.
- History, Home/Pet Room hoặc shop UI.

Không có manual claim button hoặc claim API từ Presentation trong Mobile MVP. `rewardClaimedAt` là receipt nội bộ của automatic grant, không phải bằng chứng người dùng đã bấm claim.

### 5.4. Failure và retry behavior — `BASELINE`

| Failure window | Hành vi bắt buộc |
|---|---|
| Database fail trước transaction commit | Không hiển thị completed/reward như truth; không chạy grant side effect; vào safe recovery. |
| App kill trong transaction | Transaction rollback hoặc atomicity equivalent; relaunch reconcile lại từ durable truth. |
| App kill sau transaction commit, trước Result | Hydrate same completed session/reward; không grant lại. |
| Pet/audio/haptic/analytics fail sau commit | Reward giữ nguyên; không rollback và không retry grant. |
| Result mở lại hoặc notification tap nhiều lần | Read/reconcile terminal truth; không tạo ledger mới. |
| Corrupt duration/timestamp | Không clamp/reward; giữ dữ liệu và vào recovery. |

Repair policy cho một database đã có inconsistent legacy reward/session record thuộc Data Model/migration; specification này cấm UI hoặc animation tự “sửa” bằng cách cộng reward lại.

## 6. Level progression — `GR-OPEN-001` (`RESOLVED`)

### 6.1. Mục tiêu

Level phải biến cumulative XP thành visible progression đơn giản mà không đưa evolution, Happiness, Energy, streak hoặc gameplay phức tạp vào MVP.

### 6.2. Các phương án đã cân nhắc

| Phương án | Rule | Trải nghiệm/độ tin cậy | Chi phí | Độ phức tạp |
|---|---|---|---|---|
| A — Linear 100 XP/level | Level 1 ở 0 XP; mỗi 100 XP tăng một level | Rất dễ hiểu/test; nhịp đều nhưng early progress chậm hơn và thiếu cảm giác tăng thử thách | Thấp | Thấp |
| B — Progressive +25 XP mỗi level (**đã chọn**) | Threshold level `L`: `25 × (L-1) × (L+2) / 2` | Early level nhanh, nhịp tăng dần; phù hợp beta nhưng cần kiểm chứng balance | Thấp | Thấp–trung bình |
| C — Fixed table level 1–10 | Dùng bảng threshold curated và dừng/cap tại level 10 | Dễ tune milestone nhưng tạo cap/behavior sau max level và cần maintenance table | Trung bình | Trung bình |

**Quyết định:** Dũng Lư chọn phương án B ngày 2026-08-26. **Độ tin cậy tại thời điểm chốt:** `MEDIUM`. **Chi phí:** thấp. **Độ phức tạp:** thấp–trung bình.

Lý do: level 2 đến sau khoảng hai completed Focus 25 phút, tạo feedback sớm; các level sau chậm dần mà vẫn chỉ cần một công thức deterministic, không cần content milestone hoặc evolution.

### 6.3. Rule chi tiết của phương án B — `RESOLVED`

```text
thresholdXp(level L) = 25 × (L - 1) × (L + 2) / 2, với L >= 1

currentLevel = level lớn nhất có thresholdXp(level) <= totalXp
xpIntoLevel = totalXp - thresholdXp(currentLevel)
xpToNextLevel = thresholdXp(currentLevel + 1) - totalXp
```

| Level | Cumulative XP threshold | Số Focus 25 phút tương đương tối thiểu |
|---:|---:|---:|
| 1 | 0 | 0 |
| 2 | 50 | 2 |
| 3 | 125 | 5 |
| 4 | 225 | 9 |
| 5 | 350 | 14 |
| 6 | 500 | 20 |
| 7 | 675 | 27 |
| 8 | 875 | 35 |
| 9 | 1.100 | 44 |
| 10 | 1.350 | 54 |

Semantics normative:

- Level bắt đầu ở `1` tại `0 XP`.
- XP là cumulative và không bị tiêu khi lên level.
- Không có max level riêng cho MVP; cùng công thức tiếp tục sau level 10.
- Một completed Focus có thể vượt qua nhiều threshold; final level là level cao nhất thỏa total XP mới.
- Level được tính từ total XP sau reward delta, không từ số session hoặc Coin.
- Nếu level được persist để query nhanh, persisted level phải được cập nhật atomically cùng reward; total XP vẫn là input kiểm chứng canonical.
- Level-up animation/audio/haptic chỉ là transient side effect sau commit, không tạo level hoặc reward.
- Không có level-down trong MVP vì XP không bị tiêu/xóa ngoài full local-data reset có xác nhận.

### 6.4. Ví dụ level theo phương án B — `RESOLVED`

| Trước session | Completed Focus | Sau reward | Kết quả level |
|---|---:|---:|---|
| Level 1, `0 XP` | 25 phút | `25 XP` | Vẫn level 1; còn 25 XP tới level 2. |
| Level 1, `25 XP` | 25 phút | `50 XP` | Lên level 2. |
| Level 2, `100 XP` | 25 phút | `125 XP` | Lên level 3. |
| Level 1, `40 XP` | 120 phút | `160 XP` | Lên level 3; một session có thể vượt nhiều threshold nếu input đủ lớn. |
| Level 5, `490 XP` | 15 phút | `505 XP` | Lên level 6 tại threshold 500; 5 XP vào level mới. |

Formula, threshold và semantics trong mục 6 là normative cho Gamification Rules sau khi `GR-OPEN-001` được chốt. Việc specification vẫn `DRAFT` và checklist chưa hoàn thành không thay thế yêu cầu implementation/test evidence.

## 7. Unlock, purchase và equip — `GR-OPEN-002` (`RESOLVED`)

### 7.1. Các mô hình unlock được cân nhắc

| Phương án | Level condition | Coin condition | Trải nghiệm/độ tin cậy | Chi phí | Độ phức tạp |
|---|---|---|---|---|---|
| A — Catalog mở từ đầu; Coin mua item (**đã chọn**) | Không level-gate item | Balance `>= price` | Người dùng thấy ngay mục tiêu Coin; test reward loop trực tiếp; XP level vẫn là visible progression riêng | Thấp | Thấp |
| B — Level mở catalog, Coin mua item | Phải đạt level từng item | Vẫn phải đủ Coin | XP và Coin cùng có vai trò nhưng tạo double gate, cần nhiều copy/test/balance | Trung bình | Trung bình |
| C — Level milestone grant item miễn phí; shop Coin độc lập | Một số item free theo level | Item khác dùng Coin | Reward đa dạng hơn nhưng tăng transaction/unlock event và content mapping | Trung bình | Trung bình–cao |

**Quyết định:** Dũng Lư chọn phương án A ngày 2026-08-26. **Độ tin cậy tại thời điểm chốt:** `MEDIUM-HIGH`. **Chi phí:** thấp. **Độ phức tạp:** thấp.

Lý do: Mobile MVP cần kiểm chứng người dùng có quan tâm reward/shop loop hay không. Level-gate cộng thêm Coin gate làm khó xác định người dùng không mua vì không thích item hay vì chưa đủ điều kiện.

### 7.2. Unlock conditions của phương án A — `RESOLVED`

| Đối tượng | Điều kiện unlock/ownership |
|---|---|
| Level `L` | Cumulative XP đạt `thresholdXp(L)` đã được duyệt. |
| Shop item | Item tồn tại trong catalog đã duyệt, user chưa sở hữu, Coin balance `>= price`, purchase transaction commit. |
| Default room/Pet presentation asset | Không phải shop item và không tính vào 12 item purchasable đã duyệt; exact asset phụ thuộc Product/Art decisions riêng. |
| Equip item | User đã sở hữu item; equip không tốn thêm Coin. |

### 7.3. Purchase transaction — `RESOLVED`

```text
PurchaseItem command
  → validate itemId trong approved catalog
  → transaction:
      → đọc authoritative item price + Coin balance + ownership
      → reject nếu item đã owned hoặc balance không đủ
      → debit Coin đúng price
      → insert OwnedItem unique theo itemId/profile
  → commit
  → refresh balance/inventory projection
  → best-effort item_unlocked analytics + animation/audio/haptic
```

Rule normative:

- Price đọc từ local catalog/durable record đã duyệt, không tin price do UI gửi.
- Coin balance không được âm.
- Purchase và ownership insert phải atomic; không có trạng thái đã trừ Coin nhưng chưa sở hữu item.
- Double tap/retry/race không được trừ Coin hoặc unlock item hai lần.
- Item đã owned không thể mua lại; MVP không có duplicate stack, consumable hoặc quantity.
- Item đã owned không bị xóa do unequip, session failed/cancelled hoặc economy rebalance.
- Equip/unequip chỉ thay đổi presentation selection của item đã owned và không tạo reward transaction.
- Không refund, sell-back, gift, trade, discount, bundle hoặc dynamic pricing trong MVP.
- Full local-data reset có xác nhận là ngoại lệ duy nhất có thể xóa local inventory cùng toàn bộ product data.

Exact purchase ledger, unique constraint và equip schema thuộc Data Model. Data Model phải chi tiết hóa mà không thay đổi behavior đã chốt trong `GR-OPEN-002`.

## 8. Item catalog và price — Product `OPEN-005` (`RESOLVED`)

### 8.1. Authority boundary

Product Core 1.12.0 đã đồng bộ có phê duyệt phương án B ngày 2026-08-26. Vì vậy:

- Product `OPEN-005` đã `RESOLVED`.
- Đúng 12 item, stable ID, display name, category và price ở mục 8.3 là normative cho Mobile MVP.
- Shop semantics ở mục 7 và catalog ở mục 8 phải được triển khai cùng nhau; Data Model có thể chi tiết hóa storage nhưng không được đổi behavior hoặc price đã duyệt.
- Default room/Pet asset không nằm trong 12 item purchasable và vẫn phụ thuộc Product/Art decision riêng.
- Mọi thay đổi catalog/price sau baseline này là Product change mới và phải đồng bộ lại Product Core trước khi trở thành requirement.

### 8.2. Các phương án catalog

| Phương án | Quy mô | Price range đề xuất | Trải nghiệm/độ tin cậy | Chi phí art/QA | Độ phức tạp implementation |
|---|---:|---:|---|---|---|
| A — Tối thiểu | 10 shop items | 5–90 Coin | Nhanh ship, đủ vài purchase; ít dữ liệu về breadth preference | Thấp | Thấp |
| B — Cân bằng (**đã chọn**) | 12 shop items | 5–120 Coin | Nằm giữa range Product Core; có reward sớm và mục tiêu dài hơn | Trung bình | Thấp–trung bình |
| C — Rộng | 15 shop items | 5–150 Coin | Nhiều lựa chọn hơn nhưng tăng art, placement, QA và balance trước khi loop được chứng minh | Cao | Trung bình |

**Quyết định:** Dũng Lư chọn phương án B ngày 2026-08-26. **Độ tin cậy tại thời điểm chốt:** `MEDIUM`. **Chi phí:** trung bình, chủ yếu ở art/QA. **Độ phức tạp:** thấp–trung bình. Product Core 1.12.0 đã hoàn tất authority sync có phê duyệt.

### 8.3. Danh sách và giá phương án B — `RESOLVED`

Danh sách cố ý dùng room decoration trung tính, không phụ thuộc Cat/Dog/Robot, Pet naming, evolution, skin hoặc contribution colors. `Số Focus 25 phút` dùng income `5 Coin/session` và chỉ nhằm giải thích pacing; không phải unlock condition riêng.

| # | Stable item ID | Tên hiển thị | Category | Price | Số Focus 25 phút để đủ giá từ 0 Coin |
|---:|---|---|---|---:|---:|
| 1 | `desk-mug` | Cốc trên bàn | `furniture` | 5 Coin | 1 |
| 2 | `tiny-plant` | Chậu cây nhỏ | `furniture` | 10 Coin | 2 |
| 3 | `book-stack` | Chồng sách | `furniture` | 15 Coin | 3 |
| 4 | `desk-lamp` | Đèn bàn | `furniture` | 20 Coin | 4 |
| 5 | `wall-calendar` | Lịch treo tường | `furniture` | 25 Coin | 5 |
| 6 | `floor-cushion` | Đệm ngồi | `furniture` | 30 Coin | 6 |
| 7 | `small-rug` | Thảm nhỏ | `furniture` | 40 Coin | 8 |
| 8 | `wall-poster` | Tranh treo tường | `furniture` | 50 Coin | 10 |
| 9 | `bookshelf` | Kệ sách | `furniture` | 60 Coin | 12 |
| 10 | `standing-lamp` | Đèn đứng | `furniture` | 75 Coin | 15 |
| 11 | `armchair` | Ghế bành | `furniture` | 90 Coin | 18 |
| 12 | `window-view` | Khung cửa sổ | `furniture` | 120 Coin | 24 |

Catalog rules:

- 12 item trên là shop items purchasable; default room/Pet asset không tính vào con số 12.
- Tất cả item có giá integer Coin dương và không dùng real money.
- Theo `GR-OPEN-002` đã chốt, tất cả item visible/purchasable từ đầu khi đủ Coin; không level gate.
- Không item nào grant multiplier, reward bonus, protection, Energy, Happiness hoặc gameplay advantage.
- Item chỉ là cosmetic room decoration; exact art/placement slot phải được Art/Presentation validation và không được tự chọn Pet mặc định.
- Price không dynamic theo level, streak, session count hoặc thời gian.
- Bảng là catalog normative theo Product Core 1.12.0; implementation không được tự thêm, bỏ, đổi ID, category hoặc price.

### 8.4. Price pacing của phương án B — `RESOLVED`

- First purchase có thể xảy ra sau một completed Focus 25 phút (`5 Coin`).
- Mid-tier 30–60 Coin tương đương 6–12 completed Focus 25 phút nếu bắt đầu từ 0 và không mua item khác.
- High-tier 75–120 Coin tương đương 15–24 completed Focus 25 phút.
- Tổng giá toàn catalog là `540 Coin`, tương đương `108` completed Focus 25 phút nếu user mua tất cả và không có nguồn Coin khác.
- Mục tiêu của range là tạo một purchase sớm để test loop và vẫn có item dài hạn; confidence chỉ `MEDIUM` vì chưa có beta economy data.

Không có sale, discount, daily deal, random drop hoặc real-money price trong Mobile MVP.

## 9. Level, unlock và reward side-effect boundary

### 9.1. Durable progression trước transient feedback — `BASELINE`

Nếu completed Focus làm user lên level hoặc đủ Coin mua item:

- XP/Coin/level truth phải commit trước level-up feedback.
- Coin debit/ownership truth phải commit trước item-unlocked feedback.
- Animation/audio/haptic failure không rollback level, balance hoặc ownership.
- Relaunch hydrate committed truth; không replay reward grant hoặc purchase.
- Analytics event chỉ là best-effort và không phải ledger/ownership proof.

### 9.2. Pet boundary — `LOCKED`/`BASELINE`

- `celebrating` chỉ phản hồi completed Focus đã commit; animation không nhân reward.
- `bugged` chỉ phản hồi Strict Focus failed và không xóa XP/Coin/item trước đó.
- Item equip có thể thay đổi visual Pet Room nhưng không thay Pet state machine, session status hoặc reward formula.
- Không dùng Pet sickness/death, Happiness/Energy hoặc guilt để ép purchase.

## 10. Out of scope và deferred

Các nội dung sau không thuộc Gamification Rules Mobile MVP:

- Pet evolution hoặc stage progression `Egg → Baby → Adult`.
- Happiness, Energy, mood decay hoặc Pet death.
- Streak UI, streak protection, streak multiplier hoặc daily quest.
- Revive Token hoặc rewarded ads.
- Loot box, random drop, crafting, duplicate item, consumable hoặc item rarity gameplay.
- Premium currency, IAP, subscription, real-money item hoặc monetization package.
- Social gifting, trade, leaderboard hoặc shared economy.
- Cloud/server economy, anti-cheat backend hoặc remote price configuration.
- Multiple Pet/skin system trước khi Product `OPEN-001` và scope tương ứng được duyệt.
- Contribution graph color unlock hoặc bất kỳ quyết định nào giải quyết `OPEN-006`.

## 11. Edge cases

| ID | Edge case | Hành vi bắt buộc/đề xuất | Trạng thái |
|---|---|---|---|
| `GR-EDGE-001` | Focus completed đúng `now == endsAt` | Grant theo configured duration nếu Strict violation không thắng; đúng một transaction. | `LOCKED`/`BASELINE`. |
| `GR-EDGE-002` | Strict `violationAt == endsAt` | `failed`; `0 XP`, `0 Coin`, không RewardTransaction. | `LOCKED`. |
| `GR-EDGE-003` | Reconcile completed Focus rất muộn | Không thưởng overtime; dùng configured duration. | `LOCKED`. |
| `GR-EDGE-004` | Focus cancelled ở giây/phút cuối trước terminal commit | `0 XP`, `0 Coin`; không partial reward. | `LOCKED`. |
| `GR-EDGE-005` | Break completed/cancelled | `0 XP`, `0 Coin`; không reward ledger. | `LOCKED`/`BASELINE`. |
| `GR-EDGE-006` | Countdown/Result tính reward trước durable commit | Không hiển thị như truth và không mutate balance; chờ application result. | `BASELINE`. |
| `GR-EDGE-007` | Hai reconciliation cùng lúc | Single-flight + transaction + unique `sessionId`; một reward grant. | `BASELINE`. |
| `GR-EDGE-008` | Completion commit trước cancel | `completed`; reward đúng một lần; cancel no-op. | `BASELINE`. |
| `GR-EDGE-009` | Cancel commit trước completion | `cancelled`; không reward; reconcile no-op. | `BASELINE`. |
| `GR-EDGE-010` | App kill sau completed/reward commit, trước Result | Hydrate same reward; không grant lại hoặc yêu cầu claim. | `BASELINE`. |
| `GR-EDGE-011` | Result/notification/Pet animation chạy nhiều lần | Chỉ đọc committed reward; không tạo ledger hoặc delta mới. | `LOCKED`/`BASELINE`. |
| `GR-EDGE-012` | Notification/analytics/audio/haptic fail | Reward truth giữ nguyên; không rollback/regrant. | `BASELINE`. |
| `GR-EDGE-013` | Duration/timestamp corrupt | Safe recovery; không clamp, floor hoặc grant từ dữ liệu không an toàn. | `BASELINE`. |
| `GR-EDGE-014` | Standard Focus 15 phút completed | `15 XP`, `3 Coin`. | `LOCKED`. |
| `GR-EDGE-015` | Standard Focus 120 phút completed | `120 XP`, `24 Coin`; đây là per-session maximum hiện hành. | `LOCKED`. |
| `GR-EDGE-016` | One Focus vượt nhiều level threshold | Chọn level cao nhất thỏa cumulative XP mới; không mất XP dư. | `RESOLVED` theo `GR-OPEN-001`. |
| `GR-EDGE-017` | Level-up animation fail/reopen | Durable XP/level không đổi; không replay reward grant. | `RESOLVED`/`BASELINE` theo `GR-OPEN-001`. |
| `GR-EDGE-018` | Purchase double tap/retry | Atomic ownership + debit; tối đa một debit/OwnedItem. | `RESOLVED` theo `GR-OPEN-002`. |
| `GR-EDGE-019` | Coin balance thấp hơn price | Reject typed insufficient-balance result; không debit/ownership. | `RESOLVED` theo `GR-OPEN-002`. |
| `GR-EDGE-020` | Item đã owned được mua lại | Reject/no-op typed result; không debit lần nữa. | `RESOLVED` theo `GR-OPEN-002`. |
| `GR-EDGE-021` | Price/item record invalid | Không purchase hoặc sửa giá ngầm; giữ balance và vào safe catalog/recovery path. | `RESOLVED`; exact contract thuộc Data Model. |
| `GR-EDGE-022` | Equip item chưa owned | Reject; không thay equipped projection hoặc balance. | `RESOLVED` theo `GR-OPEN-002`. |
| `GR-EDGE-023` | Session failed/cancelled sau khi user đã sở hữu item từ trước | Không xóa/revoke item hoặc XP/Coin cũ. | `LOCKED`. |
| `GR-EDGE-024` | Onboarding trial 5 phút completes | Grant atomically/idempotently `5 XP`, `1 Coin`; cộng progression/balance nhưng loại khỏi standard history/contribution, cadence, store-review eligibility và core Focus analytics. | `LOCKED`/`RESOLVED` theo Product Core 1.12.0 và `GR-OPEN-003`. |
| `GR-EDGE-025` | Catalog/price thay đổi ở version tương lai sau khi user đã mua | Mobile MVP không có dynamic pricing. Nếu Product duyệt thay đổi ở version sau, OwnedItem hiện có không bị thu hồi; migration/price-version contract phải được Data Model review. | `RESOLVED` cho MVP; future change cần authority mới. |

## 12. Traceability tới Technical Documentation Checklist

| Checklist Gamification Rules | Vị trí trong specification | Trạng thái phát hành |
|---|---|---|
| Công thức XP và Coin | Mục 4.1 | Đã khóa theo Product Core 1.12.0. |
| Level thresholds và unlock conditions | Mục 6, 7 | Level threshold và unlock/purchase/equip conditions đã chốt qua `GR-OPEN-001/002`. |
| Reward theo Focus duration | Mục 4.4–4.5 | Có bảng đầy đủ 15–120 phút theo step hiện hành. |
| Reward cho completed/failed/cancelled | Mục 3 | Đã khóa theo baseline. |
| Rounding và reward limit | Mục 4.2–4.3 | Đã mô tả floor, per-session range và no-overtime. |
| Chống claim/grant nhiều lần | Mục 5 | Đã kế thừa atomic transaction + unique `sessionId`. |
| Danh sách item và giá MVP | Mục 8 | Phương án B đã `RESOLVED`; exact catalog/price đã đồng bộ trong Product Core 1.12.0. |
| Ví dụ reward phổ biến | Mục 4.5 | Đã có. |
| Edge cases | Mục 11 | Đã có baseline và các case theo toàn bộ decision đã resolve. |
| Review/phê duyệt | Mục 14–16 | Dũng Lư đã review/phê duyệt; checklist mục 7 được phép cập nhật hoàn thành. |

## 13. Decision table

### 13.1. Resolved/baseline decisions

| ID/phạm vi | Quyết định | Nguồn authority | Trạng thái |
|---|---|---|---|
| Currency set | MVP chỉ có XP và Coin. | Product Core §9.2 | `LOCKED`. |
| Eligibility | Chỉ completed Focus nhận reward; failed/cancelled Focus và mọi Break không reward. | Product Core §7.4, §9.3; Session Lifecycle §5 | `LOCKED`. |
| Formula | `XP = completedFocusMinutes`; `Coin = floor(completedFocusMinutes / 5)`. | Product Core 1.12.0 §9.3; Product `OPEN-004` đã resolved | `LOCKED`/`BASELINE`. |
| Duration source | Dùng configured Focus minutes; overtime/reconcile muộn không tăng reward. | Product Core §9.3; Session Lifecycle §5.2 | `LOCKED`. |
| Rounding | Coin dùng integer floor. | Product Core §9.3 | `LOCKED`. |
| Automatic grant | Grant trong completed Focus transaction; Result không manual claim. | Product Core §7.4; Timer `TE-OPEN-009` | `LOCKED`/`BASELINE`. |
| Idempotency | RewardTransaction unique theo `sessionId`; terminal + ledger + XP/Coin + receipt atomic. | Product Core §7.4; System Architecture §6.3; Timer §9 | `LOCKED`/`BASELINE`. |
| Side effects | Result, notification, analytics, Pet/audio/haptic không grant hoặc rollback reward. | Product Core; System Architecture; Pet State Machine | `LOCKED`/`BASELINE`. |
| Safety | Invalid timestamp/database failure không tự terminal/reward. | Product Core §7.7; Timer `TE-OPEN-010` | `BASELINE`. |
| Deferred boundary | Không evolution, Happiness, Energy, streak UI, Revive Token hoặc monetization trong MVP. | Product Core §4.3, §8.5–8.6, §9.5–9.6, §16 | `LOCKED`/`DEFERRED`. |
| `GR-OPEN-001` | Level 1 tại 0 XP; XP cumulative/non-spendable; threshold `25 × (L-1) × (L+2) / 2`; không max level riêng; một reward có thể vượt nhiều threshold. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-26. |
| `GR-OPEN-002` | Catalog không level-gate; item visible/purchasable từ đầu; đủ Coin thì purchase một lần atomically; equip miễn phí khi owned; Coin bắt đầu từ 0 và không âm. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-26. |
| `GR-OPEN-003` | Onboarding trial là special completed Focus 5 phút, nhận `5 XP`/`1 Coin` bằng automatic idempotent grant; không tính standard history/contribution, Long Break cadence, store-review eligibility hoặc core Focus analytics. | Product Core 1.12.0; Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-26; authority sync hoàn tất. |
| Product `OPEN-005` | 12 neutral room items với exact stable ID/display name/category/price 5–120 Coin; visible từ đầu, purchase một lần bằng Coin, equip miễn phí. | Product Core 1.12.0 §9.4; Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-26; authority sync hoàn tất. |

### 13.2. Open decisions

Không còn decision `OPEN` ảnh hưởng trực tiếp đến Gamification Rules Mobile MVP. Product `OPEN-001`, `OPEN-006` và `OPEN-009` vẫn `OPEN` nhưng nằm ngoài phạm vi quyết định của tài liệu này; không được suy diễn Pet mặc định, contribution colors hoặc Pet naming từ catalog đã duyệt.

### 13.3. Các phương án đã cân nhắc cho `GR-OPEN-003` — `RESOLVED`

| Phương án | Hành vi | Độ tin cậy/UX | Chi phí | Độ phức tạp |
|---|---|---|---|---|
| A — Special completed Focus 5 phút, dùng formula chuẩn (**đã chọn**) | `5 XP`, `1 Coin`; flag onboarding để loại khỏi standard history/contribution, core analytics, cadence và store-review eligibility | Khớp “nhận reward đầu tiên”, economy dễ hiểu; nhưng tạo ngoại lệ dưới minimum 15 phút | Trung bình | Trung bình |
| B — Fixed onboarding reward riêng | Ví dụ fixed XP/Coin được Product chốt, không áp formula standard | Tune first purchase tốt hơn nhưng thêm reason/formula đặc biệt và test/migration | Trung bình | Trung bình–cao |
| C — Chỉ celebration, không durable XP/Coin | Không RewardTransaction | Đơn giản nhưng mâu thuẫn trực tiếp với câu “nhận reward đầu tiên” nếu reward được hiểu là XP/Coin | Thấp | Thấp |

**Quyết định:** Dũng Lư chọn phương án A ngày 2026-08-26. **Độ tin cậy tại thời điểm chốt:** `MEDIUM-LOW`. **Chi phí:** trung bình. **Độ phức tạp:** trung bình.

Lý do: phương án này giữ lời hứa “nhận reward đầu tiên” và dùng cùng công thức thay vì tạo reward amount thứ hai. Confidence thấp hơn hai decision trước vì nó tạo ngoại lệ dưới minimum Focus 15 phút. Product Core 1.12.0 hiện chứa ngoại lệ đã được đồng bộ có phê duyệt.

## 14. Acceptance criteria

Checkbox ở mục này là implementation acceptance criteria và vẫn để trống cho tới khi có implementation/test evidence.

### 14.1. Reward formula và outcome

- [ ] Chỉ Focus `completed` nhận XP/Coin.
- [ ] Focus `failed`/`cancelled` và mọi Break nhận `0 XP`, `0 Coin` và không có RewardTransaction.
- [ ] Completed Focus dùng `xpEarned = completedFocusMinutes`.
- [ ] Completed Focus dùng `coinsEarned = floor(completedFocusMinutes / 5)`.
- [ ] Reward dùng configured Focus duration đã persist, không dùng elapsed/reconcile/overtime duration.
- [ ] Standard Focus 15 phút nhận `15 XP`, `3 Coin`.
- [ ] Standard Focus 25 phút nhận `25 XP`, `5 Coin`.
- [ ] Standard Focus 50 phút nhận `50 XP`, `10 Coin`.
- [ ] Standard Focus 120 phút nhận `120 XP`, `24 Coin`.
- [ ] Mọi valid duration 15–120 phút theo step hiện hành khớp bảng ở mục 4.4.
- [ ] Invalid/corrupt duration không bị clamp/round để grant reward và đi vào safe recovery.
- [ ] Không streak/mode/tag/level/item/advertisement multiplier trong MVP.

### 14.2. Atomicity và idempotency

- [ ] Completed Focus status, `resolvedAt`, RewardTransaction, XP/Coin delta và `rewardClaimedAt` commit atomically.
- [ ] RewardTransaction unique theo `sessionId` hoặc atomic equivalent đã được Data Model duyệt.
- [ ] Concurrent/retried reconciliation chỉ tạo tối đa một reward grant và một balance delta.
- [ ] Cancel/completion race tuân theo transaction đầu tiên conditional-transition từ `running`.
- [ ] App kill sau commit hydrate same reward và không grant lại.
- [ ] Result reopen, notification tap, analytics retry hoặc Pet animation không grant/claim reward.
- [ ] Side-effect failure sau commit không rollback/regrant reward.
- [ ] Database/timestamp failure không hiển thị reward chưa commit hoặc tự repair bằng grant mới.

### 14.3. Level progression — `GR-OPEN-001` `RESOLVED`

- [ ] Level bắt đầu ở 1 tại 0 XP và XP là cumulative/non-spendable.
- [ ] Threshold level khớp công thức `25 × (L-1) × (L+2) / 2` và bảng đã duyệt.
- [ ] Một session vượt nhiều threshold chọn final level cao nhất và giữ XP dư.
- [ ] Level update, nếu persist, commit atomically cùng cumulative XP reward.
- [ ] Level-up visual/audio/haptic không tạo hoặc rollback durable progression.
- [ ] Không evolution, level-down, max level riêng hoặc max-level content đặc biệt trong MVP nếu chưa được duyệt riêng.

### 14.4. Shop, unlock và inventory — `GR-OPEN-002`/Product `OPEN-005` `RESOLVED`

- [ ] Catalog không level-gate; mọi approved item visible/purchasable từ đầu.
- [ ] Chỉ user đủ Coin và chưa owned item mới purchase thành công.
- [ ] Purchase debit + OwnedItem commit atomically; double tap/retry không debit hai lần.
- [ ] Coin balance bắt đầu từ 0, không âm và price được đọc từ authoritative catalog.
- [ ] Item đã owned không thể mua lại, không bị xóa bởi failed/cancelled session hoặc unequip.
- [ ] Equip chỉ áp dụng cho owned item và không tốn Coin.
- [ ] Catalog có đúng 12 item, stable ID, display name, category và price khớp mục 8.3 và Product Core 1.12.0.
- [ ] Catalog không phụ thuộc default Pet, Pet naming, contribution colors hoặc nội dung deferred.
- [ ] Không cosmetic item nào tạo gameplay/reward multiplier.

### 14.5. Onboarding trial — `GR-OPEN-003` `RESOLVED`

- [ ] Trial là special completed Focus có configured duration cố định 5 phút.
- [ ] Completed trial nhận `5 XP`, `1 Coin` bằng automatic atomic/idempotent RewardTransaction unique theo `sessionId`.
- [ ] Trial reward cộng cumulative XP/level và spendable Coin balance.
- [ ] Incomplete/cancelled trial không nhận partial XP/Coin.
- [ ] Trial không tính vào standard Focus history/contribution graph, Long Break cadence hoặc store-review eligibility.
- [ ] Trial dùng onboarding analytics thay vì standard Focus/reward core analytics.

Authority sync đã hoàn tất trong Product Core 1.12.0; các checkbox trên tiếp tục là implementation acceptance criteria.

### 14.6. Test matrix tối thiểu

| Cấp test | Phạm vi Gamification Rules |
|---|---|
| Domain unit | Eligibility matrix, exact XP/Coin formula, floor, valid-duration table, no overtime và level formula đã duyệt. |
| Application unit | Automatic grant, no manual claim, typed result, purchase orchestration theo catalog đã duyệt, side-effect ordering. |
| SQLite integration | Atomic terminal/reward, unique `sessionId`, balance update, purchase debit/ownership unique theo catalog đã duyệt. |
| Mobile integration | Result/history/shop hydrate committed truth; notification/Pet/analytics không grant; recovery projection. |
| Device/simulator | Kill/relaunch after commit, repeated Result/notification entry, offline purchase/inventory persistence theo catalog đã duyệt. |

## 15. Review và phát hành

Gamification Rules `1.0.0` được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-26 sau khi xác nhận:

1. `GR-OPEN-001`, `GR-OPEN-002`, `GR-OPEN-003` và Product `OPEN-005` đều đã `RESOLVED`.
2. Product Core 1.12.0 đã được Dũng phê duyệt đồng bộ onboarding trial cùng exact catalog/price và shop semantics.
3. Không còn decision ảnh hưởng trực tiếp ở trạng thái `OPEN`/`PROPOSED` trong normative rules.
4. Decision table, edge cases và acceptance criteria phản ánh toàn bộ lựa chọn đã duyệt.
5. Không có mâu thuẫn với Product Core, ba architecture baseline, Timer Engine, Session Lifecycle, Pet State Machine hoặc ADR.
6. Technical Documentation Checklist được phép cập nhật mục Gamification Rules thành hoàn thành.

Các checkbox ở mục 14 là implementation acceptance criteria và vẫn để trống cho tới khi có test/device evidence; specification approval không thay thế implementation verification.

## 16. Change log

### 1.0.0 — 2026-08-26

- Dũng Lư — Tech Lead/Product Owner review và phê duyệt toàn bộ Gamification Rules Specification.
- Chuyển tài liệu từ `DRAFT` sang `APPROVED` sau khi `GR-OPEN-001`, `GR-OPEN-002`, `GR-OPEN-003` và Product `OPEN-005` đều `RESOLVED`.
- Xác nhận reward formula/outcome, duration table, rounding/limits, atomic idempotent grant, level progression, shop catalog/price, purchase/equip rules, edge cases và acceptance criteria không mâu thuẫn Product Core hoặc các baseline đã duyệt.
- Phát hành Gamification Rules 1.0.0 làm baseline trực tiếp cho Data Model và Mobile MVP implementation.
- Cho phép cập nhật Technical Documentation Checklist mục Gamification Rules thành hoàn thành.

### 0.7.0 — 2026-08-26

- Dũng Lư phê duyệt đồng bộ phương án B của Product `OPEN-005` vào Product Core 1.12.0.
- Chuyển exact 12-item catalog, stable ID, display name, category, price 5–120 Coin và shop semantics thành normative rules.
- Chuyển Product `OPEN-005`, catalog edge case, traceability và acceptance criteria liên quan sang `RESOLVED`.
- Xác nhận không còn decision `OPEN` ảnh hưởng trực tiếp đến Gamification Rules; Product `OPEN-001`, `OPEN-006` và `OPEN-009` vẫn ngoài phạm vi và không bị chốt ngầm.
- Giữ tài liệu ở `DRAFT` để Dũng review và duyệt toàn bộ; chưa cập nhật Technical Documentation Checklist.

### 0.6.0 — 2026-08-26

- Dũng Lư chọn phương án B cho Product `OPEN-005`: 12 neutral room items với exact item/price table 5–120 Coin ở mục 8.3.
- Ghi nhận confidence `MEDIUM`, art/QA cost trung bình và implementation complexity thấp–trung bình.
- Giữ catalog/price ở `PROPOSED` và Product `OPEN-005` ở `OPEN` vì Product Core 1.11.0 chưa được phê duyệt đồng bộ.
- Không sửa Product Core, Technical Documentation Checklist, architecture baseline, Timer Engine, Session Lifecycle, Pet State Machine hoặc ADR trong version này.

### 0.5.0 — 2026-08-26

- Dũng Lư phê duyệt đồng bộ onboarding trial decision vào Product Core 1.11.0.
- Cập nhật direct authority reference từ Product Core 1.10.0 lên 1.11.0.
- Bỏ trạng thái chờ authority sync khỏi `GR-OPEN-003`, onboarding decision/edge case và acceptance criteria.
- Giữ tài liệu ở `DRAFT`; Product `OPEN-005` vẫn là decision trực tiếp duy nhất còn `OPEN`.
- Không sửa Technical Documentation Checklist, architecture baseline, Timer Engine, Session Lifecycle, Pet State Machine hoặc ADR.

### 0.4.0 — 2026-08-26

- Dũng Lư chốt `GR-OPEN-003` theo phương án A.
- Chốt onboarding trial là special completed Focus 5 phút, nhận `5 XP`/`1 Coin` bằng automatic atomic/idempotent RewardTransaction.
- Chốt trial reward đóng góp cumulative XP/level và Coin balance nhưng không tính vào standard history/contribution graph, Long Break cadence, store-review eligibility hoặc core Focus analytics.
- Chuyển onboarding rule, alternatives, edge case, decision table và acceptance criteria liên quan sang `RESOLVED`.
- Ghi rõ Product Core 1.10.0 cần được đồng bộ có phê duyệt trước khi Gamification Rules đủ điều kiện review/phát hành; chưa sửa Product Core trong version này.
- Giữ tài liệu ở `DRAFT`; Product `OPEN-005` tiếp tục `OPEN`.

### 0.3.0 — 2026-08-26

- Dũng Lư chốt `GR-OPEN-002` theo phương án A.
- Chốt catalog không level-gate; mọi approved item visible/purchasable từ đầu khi đủ Coin.
- Chốt Coin bắt đầu từ 0, không âm; purchase debit + OwnedItem commit atomically, item chỉ mua một lần và equip miễn phí khi đã owned.
- Chốt không exchange XP/Coin, refund, sell-back, consumable, discount hoặc dynamic shop mechanic trong MVP.
- Chuyển purchase transaction, edge cases, decision table và acceptance criteria liên quan từ `PROPOSED`/`OPEN` sang `RESOLVED`.
- Giữ item count/list/price ở `PROPOSED` vì Product `OPEN-005` vẫn `OPEN`; không đồng bộ Product Core ở bước này.
- Giữ tài liệu ở `DRAFT`; `GR-OPEN-003` và Product `OPEN-005` tiếp tục `OPEN`.

### 0.2.0 — 2026-08-26

- Dũng Lư chốt `GR-OPEN-001` theo phương án B.
- Chốt level bắt đầu ở 1 tại 0 XP; XP cumulative và không bị tiêu khi lên level.
- Chốt threshold level `L` là `25 × (L-1) × (L+2) / 2`, không có max level riêng và một completed Focus có thể vượt nhiều threshold mà không mất XP dư.
- Chuyển level rule, examples, edge case, decision table và acceptance criteria liên quan từ `PROPOSED`/`OPEN` sang `RESOLVED`.
- Giữ tài liệu ở `DRAFT`; `GR-OPEN-002`, `GR-OPEN-003` và Product `OPEN-005` tiếp tục `OPEN`.
- Không sửa Product Core, Technical Documentation Checklist, architecture baseline, Timer Engine, Session Lifecycle, Pet State Machine hoặc ADR vì quyết định level không thay đổi authority cao hơn hiện hành.

### 0.1.0 — 2026-08-26

- Tạo draft Gamification Rules từ Product Core 1.10.0, Technical Documentation Checklist, ba architecture baseline 1.0.0, Timer Engine 1.0.1, Session Lifecycle 1.0.0, Pet State Machine 1.0.0 và ADR-001 đến ADR-008.
- Kế thừa nguyên vẹn reward eligibility, exact XP/Coin formula, configured-duration source, floor rounding, no-overtime và automatic atomic idempotent grant theo `sessionId`.
- Thêm bảng reward cho toàn bộ standard Focus duration 15–120 phút theo step 5 phút hiện hành, ví dụ phổ biến, reward limits và failure/retry boundary.
- Ghi `GR-OPEN-001` cho level curve, `GR-OPEN-002` cho unlock/purchase/equip semantics và `GR-OPEN-003` cho onboarding trial reward ambiguity.
- Ghi proposal level progressive, catalog mở từ đầu và 12 neutral room items với price 5–120 Coin; tất cả giữ `PROPOSED`/`OPEN`.
- Giữ Product `OPEN-005` nguyên trạng và ghi rõ Product Core phải được đồng bộ có phê duyệt trước khi item/price trở thành normative.
- Không chọn Pet mặc định, Pet naming, contribution colors hoặc nội dung deferred.
- Không sửa Product Core, Technical Documentation Checklist, architecture baseline, Timer Engine, Session Lifecycle, Pet State Machine hoặc ADR.
