---
document_id: PIXELDORO_DATA_MODEL
title: PixelDoro Mobile MVP — Data Model
version: 1.2.1
status: APPROVED
last_updated: 2026-08-31
owner: Dũng Lư
owner_roles:
  - Tech Lead
  - Product Owner
  - Lead Mobile Developer
reviewer: Dũng Lư
reviewer_role: Tech Lead
reviewed_at: 2026-08-27
approved_by: Dũng Lư
approver_role: Tech Lead / Product Owner
approved_at: 2026-08-27
amended_at: 2026-08-31
amendment_approved_by: Dũng Lư
language: vi
scope:
  - mobile_mvp
  - sqlite_schema
  - durable_state
  - migration
authority: SECONDARY
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ./technical-overview.md
architecture_baseline: ./system-architecture.md
project_structure_baseline: ./project-structure.md
timer_engine_baseline: ../specifications/timer-engine.md
session_lifecycle_baseline: ../specifications/session-lifecycle.md
pet_state_machine_baseline: ../specifications/pet-state-machine.md
gamification_baseline: ../specifications/gamification-rules.md
---

# PixelDoro Mobile MVP — Data Model

## 0. Vai trò, phạm vi và trạng thái quyết định

Tài liệu này chi tiết hóa durable data model của PixelDoro Mobile MVP trên SQLite. Tài liệu xác định:

- Entity, field, datatype, default và nullable rule.
- Primary key, foreign key, unique constraint, check constraint và index.
- Enum/value naming dùng chung giữa persistence, Domain và Application mapping.
- Reward ledger, purchase transaction, progression và inventory relationship.
- Transaction boundary cho session, reward, purchase, settings và reset.
- Migration/schema versioning, retention, reset và safe-recovery behavior.
- Record example, edge case, test matrix và acceptance criteria.

Tài liệu này không quyết định lại product behavior, timer/session/Pet state, reward formula, catalog hoặc architecture boundary đã duyệt. Khi có mâu thuẫn:

1. [Product Core 1.15.0](../PIXELDORO_CORE_TRUTH.md) `ACTIVE` được ưu tiên về product truth.
2. Technical Overview, System Architecture, Project Structure và ADR đã duyệt được ưu tiên về technical baseline.
3. Timer Engine, Session Lifecycle, Pet State Machine và Gamification Rules `APPROVED` được ưu tiên về behavior chi tiết.
4. Tài liệu này chỉ được `APPROVED` sau khi mọi quyết định ảnh hưởng trực tiếp đã `RESOLVED` và Dũng Lư review/phê duyệt toàn bộ.

### 0.1. Trạng thái quyết định

| Trạng thái | Ý nghĩa |
|---|---|
| `LOCKED` | Product Core đã khóa; schema phải tuân theo. |
| `BASELINE` | Tài liệu/ADR đã duyệt khóa boundary hoặc behavior; Data Model chỉ chi tiết hóa. |
| `PROPOSED` | Chỉ dùng cho lịch sử draft hoặc đề xuất tương lai chưa được Dũng Lư xác nhận. |
| `RESOLVED` | Quyết định Data Model đã được Dũng Lư xác nhận. |
| `OPEN` | Chưa quyết định; không được tự suy diễn khi implement/migrate/test. |
| `DEFERRED` | Không thuộc Mobile MVP. |

Phiên bản `1.0.0` đã được Dũng Lư — Tech Lead/Product Owner review và phê duyệt ngày 2026-08-27. `DM-OPEN-001` đến `DM-OPEN-007` đều `RESOLVED`; authority sync cần thiết cho `DM-OPEN-006` đã hoàn tất. Không còn Data Model decision `OPEN` ảnh hưởng trực tiếp đến Mobile MVP. Schema, constraint, index, transaction, migration, retention và test boundary trong bản hiện tại là normative baseline cho implementation.

Từ re-baseline `1.1.0` ngày 2026-08-30, “normative” không có nghĩa schema được quyền drive UX.
Schema `001` là existing durable/safety baseline đã implement; Product Epic mới phải validate
clickable UI/user flow bằng mock data/fake navigation trước. Sau owner UX approval mới lập map
`screen/state → action → domain fact → persist/derive → schema tối thiểu`. Nếu approved experience
mâu thuẫn field/topology hiện tại, team update Data Model và forward migration; không bẻ UI để bảo
vệ sunk schema. Không thêm column/table chỉ vì một giá trị xuất hiện trên screen: transient
presentation state và derived projection phải được phân loại trước khi persist.

### 0.2. Authority/dependency audit

| Nguồn | Trạng thái trên disk | Dependency bắt buộc với Data Model |
|---|---|---|
| `PIXELDORO_CORE_TRUTH.md` | 1.15.0 `ACTIVE` | Mobile MVP scope, fixed Cat / Mèo Dev (`cat-dev`), four session statuses, trial Relax/no-tag, timestamp/reward truth, Product `OPEN-006/009`, catalog và reset. |
| `TECHNICAL_DOCUMENTATION_CHECKLIST.md` | Hiện hành | Definition of done của Data Model và review cuối bộ tài liệu. |
| `architecture/technical-overview.md` | 1.0.0 `APPROVED` | SQLite durable truth, Zustand projection, offline-first, forward-only migration. |
| `architecture/system-architecture.md` | 1.0.0 `APPROVED` | Transaction/side-effect order, automatic reward grant, unique `sessionId`, command serialization. |
| `architecture/project-structure.md` | 1.0.0 `APPROVED` | SQL/migration/repository placement, naming và integration-test placement. |
| `specifications/timer-engine.md` | 1.0.2 `APPROVED` | Unix epoch ms UTC, trial validation, active-session invariant, conditional terminal update, recovery. |
| `specifications/session-lifecycle.md` | 1.0.1 `APPROVED` | Focus/trial/Break lifecycle, Long Break cadence, manual StartBreak và history exclusions. |
| `specifications/pet-state-machine.md` | 1.0.0 `APPROVED` | Pet state/animation là transient projection; không persist animation receipt. |
| `specifications/gamification-rules.md` | 1.0.1 `APPROVED` | Reward formula, level formula, exact catalog, purchase/equip và onboarding trial trace. |
| ADR-001 đến ADR-008 | `ACCEPTED`/`ACCEPTED_WITH_GATE` | Runtime, persistence ownership, adapter boundary, side-effect metadata và privacy. |

### 0.3. Product decisions không được schema này giải quyết

| Product decision | Trạng thái | Data Model `1.0.0` xử lý thế nào |
|---|---|---|
| `OPEN-001` — Pet mặc định Cat/Dog/Robot | `RESOLVED` — Cat / Mèo Dev (`cat-dev`) | Một Pet cố định là static presentation asset identity; không cần seed `petType`, species hay migration/schema mới. |
| `OPEN-006` — Contribution graph colors | `OPEN` | Không persist color/intensity band; UI derive sau khi decision được duyệt. |
| `OPEN-009` — Pet naming | `OPEN` | Không bắt buộc hoặc seed `petName`; migration chỉ được thêm sau Product decision. |

Evolution/stage, Happiness, Energy, streak UI/protection, Revive Token, monetization, cloud sync/backend economy và các nội dung `DEFERRED` không có table/column trong Mobile MVP baseline này.

## 1. Durable-truth principles và invariants

1. SQLite là nguồn sự thật duy nhất cho durable product state. Zustand/UI chỉ hydrate projection và không giữ durable counter/balance độc lập. `BASELINE`.
2. Session status chỉ có `running`, `completed`, `failed`, `cancelled`. Không có `paused`, `resolution_due`, `resolving` hoặc `recovery_required` trong schema. `LOCKED`/`BASELINE`.
3. Chỉ có tối đa một session `running` trên local profile. UI pending state và in-process coordinator không thay thế database constraint. `BASELINE`.
4. Terminal status không đổi sang status khác hoặc quay lại `running`. `LOCKED`.
5. Completed Focus, `resolvedAt`, RewardTransaction, XP/Coin balance và `rewardClaimedAt` commit trong cùng transaction. `LOCKED`/`BASELINE`.
6. `RewardTransaction.sessionId` unique. Retry, Result reopen, notification tap, analytics hoặc Pet animation không tạo reward lần hai. `LOCKED`.
7. Failed/cancelled Focus và mọi Break không có RewardTransaction và không tăng XP/Coin. `LOCKED`.
8. Purchase debit, purchase receipt và ownership commit atomically; Coin không âm và item không được mua hai lần. `LOCKED`/`RESOLVED` upstream.
9. Catalog price được đọc từ authoritative local catalog; UI không truyền price authority. `RESOLVED` upstream.
10. Long Break cadence, contribution graph, standard history và store-review eligibility được derive từ durable sessions; không có counter/aggregate table tạo truth thứ hai. `BASELINE`.
11. Pet `idle/working/breaking/celebrating/bugged` và animation receipt/progress không được persist. `BASELINE`.
12. Notification delivery/schedule state không quyết định session truth. Stable operation key derive từ `sessionId`; stale notification chỉ trigger reconciliation. `BASELINE`.
13. Analytics queue nằm ngoài core transaction và không phải product truth. `BASELINE`.
14. Khi timestamp/schema/database không an toàn, app không sửa ngầm, resolve terminal hoặc grant reward; dữ liệu được giữ và Application trả recovery projection. `BASELINE`.

## 2. SQLite conventions — `RESOLVED`

### 2.1. Naming và scalar type

| Concept | SQLite representation | Rule |
|---|---|---|
| Table/column/index/trigger | `snake_case` | Mapper chuyển sang TypeScript `camelCase`; SQL không rò ra Presentation. |
| ID nghiệp vụ | `TEXT` | UUID/opaque ID do `IdPort` tạo; không encode Pet type, date hoặc provider. |
| Singleton ID | `INTEGER` | Luôn bằng `1`, kèm `CHECK (id = 1)`. |
| Timestamp | `INTEGER` | Unix epoch milliseconds UTC, finite integer trong JS-safe range. |
| Boolean | `INTEGER` | `0` hoặc `1`, `NOT NULL`, có `CHECK`. |
| Enum | `TEXT` | Lowercase `snake_case`, `CHECK` allowlist. |
| Coin/XP/duration | `INTEGER` | Không dùng `REAL`; có lower/upper bound tương ứng. |
| Local calendar date | `TEXT` | ISO `YYYY-MM-DD`; stable date key của `ends_at` theo `DM-OPEN-002`. |
| JSON adapter payload | `TEXT` | Chỉ cho bounded analytics properties; cấm ở core entity khi field typed đủ dùng. |

Timestamp range bắt buộc: `0 <= value <= 8_640_000_000_000_000`. Mọi `created_at`/`updated_at` do Application cung cấp; không dùng SQLite `CURRENT_TIMESTAMP` vì trả đơn vị/format khác clock contract.

### 2.2. Canonical enum values

| Enum | Values | Authority/trạng thái |
|---|---|---|
| `session_status` | `running`, `completed`, `failed`, `cancelled` | `LOCKED`. |
| `session_type` | `focus`, `short_break`, `long_break` | `RESOLVED`; biểu diễn ba type đã duyệt. |
| `focus_variant` | `standard`, `onboarding_trial` | `RESOLVED`; phân biệt trial bền vững mà không tạo status mới. |
| `session_mode` | `relax`, `strict` | Standard Focus chọn một value; onboarding trial bắt buộc `relax`; Break là `NULL`. `LOCKED`/`RESOLVED`. |
| `work_tag` | `coding`, `study`, `writing`, `reading` | Standard Focus chọn approved tag; onboarding trial và Break là `NULL`. `LOCKED`/`RESOLVED`. |
| `reward_reason` | `focus_completed`, `onboarding_trial_completed` | `RESOLVED`; không cho Break/failure/cancel reason. |
| `catalog_category` | `furniture` | `LOCKED` theo catalog 12 item. |
| `purchase_reason` | `item_purchase` | `RESOLVED`. |
| `analytics_delivery_state` | `pending`, `retry_wait` | `RESOLVED`; delivered/expired record bị xóa thay vì giữ receipt. |

Pet state không nằm trong bảng enum vì là projection. `level` không là enum và được derive từ `total_xp` theo formula đã duyệt.

### 2.3. SQLite connection requirements

- Bật `PRAGMA foreign_keys = ON` trên mọi connection trước repository access.
- Dùng một application-scoped connection/transaction implementation theo System Architecture.
- Migration hoàn tất trước khi tạo repository và trước startup reconciliation barrier.
- Core command dùng transaction ngắn; không gọi notification/provider/analytics/feedback/audio/haptic trong transaction.
- Repository dùng parameter binding; không ghép raw user/provider input vào SQL.

## 3. Entity inventory và relationship

### 3.1. Entity inventory Mobile MVP

| Entity/table | Vai trò | Durable product truth? | Trạng thái |
|---|---|---:|---|
| `app_installation` | Installed/onboarding metadata và anonymous analytics identity local | Có | `RESOLVED`. |
| `app_settings` | User preferences và default Focus setup | Có | Initial seed `RESOLVED` theo `DM-OPEN-004`. |
| `pet_profiles` | Singleton owner của progression/economy; không chốt species/name/stage | Có | Current-state strategy `RESOLVED` theo `DM-OPEN-003`. |
| `sessions` | Unified Focus/Short Break/Long Break record | Có | `RESOLVED` theo `DM-OPEN-001`. |
| `reward_transactions` | Immutable automatic Focus reward receipt unique theo `session_id` | Có | `LOCKED` behavior; schema `RESOLVED`. |
| `catalog_items` | Authoritative local 12-item catalog và price | Có/reference | Catalog `LOCKED`; schema `RESOLVED`. |
| `purchase_transactions` | Immutable Coin debit receipt cho item purchase | Có | `RESOLVED` theo `DM-OPEN-003`. |
| `owned_items` | Inventory ownership/equip truth | Có | `RESOLVED`. |
| `store_review_attempts` | Frequency-cap attempts đã persist trước native call | Có, policy metadata | `BASELINE`; schema `RESOLVED`. |
| `analytics_events` | Bounded best-effort provider queue | Không; side-effect metadata | `BASELINE`; schema `RESOLVED`. |
| `schema_migrations` | Forward-only schema history | Có, technical metadata | `BASELINE`; schema `RESOLVED`. |

Không tạo riêng `History`, `ContributionDay`, `LongBreakCounter`, `PetState`, `AnimationReceipt`, `NotificationResult`, `ResultClaim`, `Level`, `Streak`, `Happiness`, `Energy` hoặc cloud-sync entity.

### 3.2. Relationship diagram

```text
app_installation (singleton)       app_settings (singleton)
          │
          │ local installation
          ▼
pet_profiles (singleton progression owner)
    │ 1
    ├──────────────< sessions
    │                    │ 1
    │                    └──────── 0..1 reward_transactions
    │                                      │
    │                                      └── atomic delta → pet_profiles
    │
    ├──────────────< purchase_transactions >──────── catalog_items
    │                         │ 1
    │                         └──────── 1 owned_items >──────── catalog_items
    │
    └── level được derive từ total_xp; Pet visual state derive từ sessions

sessions ──derive──> history / contribution / Long Break cadence / store-review eligibility
store_review_attempts ──enforce──> native store-review frequency cap
analytics_events ──best-effort──> PostHog adapter (ngoài core transaction)
```

## 4. Core table definitions

Các table dưới là schema normative của Data Model `1.0.0`. Migration implementation phải giữ nguyên entity, field, enum, constraint và boundary này; thay đổi cần đi qua review/versioning của tài liệu.

### 4.1. `app_installation`

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `id` | `INTEGER` | No | `1` | PK; `CHECK (id = 1)`. |
| `installed_at` | `INTEGER` | No | Không có | Timestamp install/reset baseline; dùng store-review 7-day gate. |
| `onboarding_completed_at` | `INTEGER` | Yes | `NULL` | Chỉ set sau onboarding completion durable command. |
| `anonymous_analytics_id` | `TEXT` | Yes | `NULL` | Random installation ID; `UNIQUE` khi có; rotate khi opt-out/reset. |
| `created_at` | `INTEGER` | No | Không có | Bằng timestamp seed record. |
| `updated_at` | `INTEGER` | No | Không có | Update cùng metadata mutation. |

Không lưu account ID, advertising ID, Pet name, contact, push token hoặc provider person ID.

### 4.2. `app_settings`

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `id` | `INTEGER` | No | `1` | PK; `CHECK (id = 1)`. |
| `focus_duration_minutes` | `INTEGER` | No | `25` | `15..120`, bước `5`. |
| `short_break_minutes` | `INTEGER` | No | `5` | `CHECK (= 5)` cho MVP. |
| `long_break_minutes` | `INTEGER` | No | `15` | `CHECK (= 15)` cho MVP. |
| `default_mode` | `TEXT` | No | `relax` | `relax` hoặc `strict`; initial seed theo `DM-OPEN-004`. |
| `sound_enabled` | `INTEGER` | No | `1` | Boolean; user có thể tắt hoàn toàn. |
| `haptics_enabled` | `INTEGER` | No | `1` | Boolean; user có thể tắt hoàn toàn. |
| `notifications_enabled` | `INTEGER` | No | `1` | App preference, không phải OS permission truth. |
| `analytics_enabled` | `INTEGER` | No | `1` | Anonymous/manual allowlist; opt-out phải dừng capture, xóa queue và rotate ID. |
| `created_at` | `INTEGER` | No | Không có | Seed timestamp. |
| `updated_at` | `INTEGER` | No | Không có | Mutation timestamp. |

`notifications_enabled = 1` không có nghĩa OS đã grant permission. OS permission chỉ được đọc qua adapter và không persist như product truth.

### 4.3. `pet_profiles`

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `id` | `INTEGER` | No | `1` | PK; `CHECK (id = 1)` cho một local progression owner. |
| `total_xp` | `INTEGER` | No | `0` | Cumulative XP, `CHECK (>= 0)`. |
| `coin_balance` | `INTEGER` | No | `0` | Spendable Coin, `CHECK (>= 0)`. |
| `created_at` | `INTEGER` | No | Không có | Profile seed timestamp. |
| `updated_at` | `INTEGER` | No | Không có | Reward/purchase mutation timestamp. |

Không có `type`, `name`, `stage`, `happiness`, `energy`, `equipped_skin_id` trong MVP baseline draft:

- Mobile MVP chỉ có Cat / Mèo Dev (`cat-dev`); identity này thuộc static presentation catalog và không tạo durable `type` field.
- `name` sẽ giải quyết Product `OPEN-009` ngoài Data Model.
- `stage`/evolution, Happiness, Energy và skin system là `DEFERRED`.

`level` không persist: derive từ `total_xp` bằng `25 × (L-1) × (L+2) / 2`. Theo `DM-OPEN-003`, `total_xp`/`coin_balance` là authoritative current state cho read trong SQLite; reward/purchase rows là immutable idempotency/audit receipts. Current state và receipt phải commit atomically và thỏa consistency invariant ở mục 6.1.

### 4.4. `sessions` — `DM-OPEN-001` (`RESOLVED`)

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `id` | `TEXT` | No | Không có | PK; opaque Application-generated ID. |
| `profile_id` | `INTEGER` | No | `1` | FK → `pet_profiles(id)`; `ON DELETE RESTRICT`. |
| `session_type` | `TEXT` | No | Không có | `focus`, `short_break`, `long_break`. |
| `focus_variant` | `TEXT` | Conditional | `NULL` | Focus: `standard`/`onboarding_trial`; Break: `NULL`. |
| `mode` | `TEXT` | Conditional | `NULL` | Standard Focus: `relax`/`strict`; trial: `relax`; Break: `NULL`. |
| `status` | `TEXT` | No | `running` | Four-status allowlist. |
| `work_tag` | `TEXT` | Conditional | `NULL` | Standard Focus: approved tag; trial/Break: `NULL`. |
| `configured_duration_minutes` | `INTEGER` | No | Không có | Standard Focus 15–120 step 5; trial 5; Short 5; Long 15. |
| `started_at` | `INTEGER` | No | Không có | Immutable Unix epoch ms. |
| `ends_at` | `INTEGER` | No | Không có | Immutable; `started_at + duration × 60_000`. |
| `backgrounded_at` | `INTEGER` | Yes | `NULL` | Chỉ Strict Focus; clear atomically khi safe foreground. |
| `resolved_at` | `INTEGER` | Yes | `NULL` | `NULL` khi running; required khi terminal. |
| `xp_earned` | `INTEGER` | No | `0` | Completed Focus = configured minutes; còn lại `0`. |
| `coins_earned` | `INTEGER` | No | `0` | Completed Focus = floor(minutes/5); còn lại `0`. |
| `reward_claimed_at` | `INTEGER` | Yes | `NULL` | Automatic grant receipt; chỉ completed Focus. |
| `scheduled_end_local_date` | `TEXT` | No | Không có | ISO local date của `ends_at`, tính/persist khi Start; Application validate calendar date, SQLite check length/separator shape. |
| `scheduled_end_utc_offset_minutes` | `INTEGER` | No | Không có | UTC offset tại `ends_at`; `CHECK (-840..840)`. |
| `created_at` | `INTEGER` | No | Không có | Thường bằng `started_at`. |
| `updated_at` | `INTEGER` | No | Không có | Mỗi durable lifecycle mutation. |

Conditional checks bắt buộc:

```text
Focus standard:
  session_type = focus
  focus_variant = standard
  mode IN (relax, strict)
  work_tag IN (coding, study, writing, reading)
  configured_duration_minutes BETWEEN 15 AND 120
  configured_duration_minutes % 5 = 0

Onboarding trial:
  session_type = focus
  focus_variant = onboarding_trial
  configured_duration_minutes = 5
  mode = relax
  work_tag IS NULL
  backgrounded_at IS NULL
  status IN (running, completed, cancelled)
  không có Strict failure branch theo Product Core 1.13.0/DM-OPEN-006

Break:
  session_type IN (short_break, long_break)
  focus_variant IS NULL
  mode IS NULL
  work_tag IS NULL
  backgrounded_at IS NULL
  status IN (running, completed, cancelled)
  duration lần lượt = 5 hoặc 15
```

Status/reward checks bắt buộc:

```text
status = running
  → resolved_at IS NULL
  → xp_earned = 0 AND coins_earned = 0
  → reward_claimed_at IS NULL

status IN (failed, cancelled)
  → resolved_at IS NOT NULL
  → xp_earned = 0 AND coins_earned = 0
  → reward_claimed_at IS NULL

completed Break
  → resolved_at IS NOT NULL
  → xp_earned = 0 AND coins_earned = 0
  → reward_claimed_at IS NULL

completed Focus
  → resolved_at IS NOT NULL
  → xp_earned = configured_duration_minutes
  → coins_earned = floor(configured_duration_minutes / 5)
  → reward_claimed_at IS NOT NULL
```

Database backstop:

- Partial unique index trên `status = 'running'` bảo vệ chỉ một active session.
- Terminal update dùng conditional `UPDATE ... WHERE id = ? AND status = 'running'`.
- Trigger chặn đổi status khi `OLD.status` đã terminal.
- Trigger chặn đổi `profile_id`, `session_type`, `focus_variant`, `mode`, `work_tag`, duration, `started_at`, `ends_at` và hai field scheduled-end local-day sau insert.
- `backgrounded_at` chỉ được ghi cho Strict Focus; clear/terminal handling trong transaction reconciliation.

### 4.5. `reward_transactions`

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `id` | `TEXT` | No | Không có | PK. |
| `session_id` | `TEXT` | No | Không có | FK → `sessions(id)`; `UNIQUE`; `ON DELETE RESTRICT`. |
| `profile_id` | `INTEGER` | No | `1` | FK → `pet_profiles(id)`; cùng `session_id` tạo composite FK tới `sessions(id, profile_id)`. |
| `xp_delta` | `INTEGER` | No | Không có | Positive; bằng configured Focus minutes. |
| `coin_delta` | `INTEGER` | No | Không có | Positive; bằng floor(minutes/5). |
| `reason` | `TEXT` | No | Không có | `focus_completed` hoặc `onboarding_trial_completed`. |
| `created_at` | `INTEGER` | No | Không có | Cùng command timestamp với automatic grant. |

Invariant bắt buộc:

- Mỗi `session_id` tối đa một row.
- Row chỉ tham chiếu session `focus` đã `completed`.
- `reason` khớp `focus_variant`.
- Delta khớp `sessions.xp_earned/coins_earned` và formula.
- Insert row, update `pet_profiles`, terminal session fields và reward receipt nằm trong một transaction.
- Reward row immutable; không `UPDATE`/`DELETE` ngoài confirmed full reset hoặc migration được duyệt.

### 4.6. `catalog_items`

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `id` | `TEXT` | No | Không có | PK; exact stable item ID. |
| `display_name` | `TEXT` | No | Không có | Vietnamese approved display name. |
| `category` | `TEXT` | No | `furniture` | `CHECK (= 'furniture')`. |
| `price_coins` | `INTEGER` | No | Không có | Positive integer; exact approved price. |
| `catalog_version` | `INTEGER` | No | `1` | Migration-owned catalog seed version; không dynamic pricing. |
| `created_at` | `INTEGER` | No | Không có | Migration seed timestamp/value. |
| `updated_at` | `INTEGER` | No | Không có | Chỉ migration được duyệt thay đổi. |

Seed normative:

| `id` | `display_name` | `category` | `price_coins` |
|---|---|---|---:|
| `desk-mug` | Cốc trên bàn | `furniture` | 5 |
| `tiny-plant` | Chậu cây nhỏ | `furniture` | 10 |
| `book-stack` | Chồng sách | `furniture` | 15 |
| `desk-lamp` | Đèn bàn | `furniture` | 20 |
| `wall-calendar` | Lịch treo tường | `furniture` | 25 |
| `floor-cushion` | Đệm ngồi | `furniture` | 30 |
| `small-rug` | Thảm nhỏ | `furniture` | 40 |
| `wall-poster` | Tranh treo tường | `furniture` | 50 |
| `bookshelf` | Kệ sách | `furniture` | 60 |
| `standing-lamp` | Đèn đứng | `furniture` | 75 |
| `armchair` | Ghế bành | `furniture` | 90 |
| `window-view` | Khung cửa sổ | `furniture` | 120 |

Default room/Pet presentation assets không có row trong catalog này.

### 4.7. `purchase_transactions` — `DM-OPEN-003` (`RESOLVED`)

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `id` | `TEXT` | No | Không có | PK/idempotency receipt. |
| `profile_id` | `INTEGER` | No | `1` | FK → `pet_profiles(id)`. |
| `item_id` | `TEXT` | No | Không có | FK → `catalog_items(id)`; `UNIQUE (profile_id, item_id)`. |
| `price_paid_coins` | `INTEGER` | No | Không có | Positive; authoritative catalog price tại purchase. |
| `coin_delta` | `INTEGER` | No | Không có | Bằng `-price_paid_coins`. |
| `reason` | `TEXT` | No | `item_purchase` | Fixed MVP reason. |
| `created_at` | `INTEGER` | No | Không có | Committed purchase timestamp. |

Row có `UNIQUE (id, profile_id, item_id)` để `owned_items` tham chiếu đúng receipt owner/item. Row immutable và không có refund/reversal type trong MVP. Stored current balance + typed immutable receipt đã được `DM-OPEN-003` chốt.

### 4.8. `owned_items`

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `profile_id` | `INTEGER` | No | `1` | FK → `pet_profiles(id)`. |
| `item_id` | `TEXT` | No | Không có | FK → `catalog_items(id)`. |
| `purchase_transaction_id` | `TEXT` | No | Không có | FK → `purchase_transactions(id)`; `UNIQUE`. |
| `unlocked_at` | `INTEGER` | No | Không có | Purchase commit timestamp. |
| `is_equipped` | `INTEGER` | No | `0` | Boolean. Equip miễn phí khi owned. |
| `equipped_at` | `INTEGER` | Yes | `NULL` | Set khi equipped; clear khi unequipped. |
| `updated_at` | `INTEGER` | No | Không có | Equip/unequip timestamp. |

Primary key: `(profile_id, item_id)`. Composite FK `(purchase_transaction_id, profile_id, item_id)` tham chiếu `purchase_transactions(id, profile_id, item_id)`. Table-level check buộc `is_equipped = 0` đi cùng `equipped_at IS NULL`, và `is_equipped = 1` đi cùng `equipped_at IS NOT NULL`.

MVP không persist quantity, slot, multiplier, rarity hoặc Pet-specific compatibility. Nhiều furniture item có thể được equipped; exact visual placement thuộc Presentation/Art và không được schema tự chốt.

### 4.9. `store_review_attempts`

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `id` | `TEXT` | No | Không có | PK. |
| `app_version` | `TEXT` | No | Không có | `UNIQUE`; tối đa một attempt/app version. |
| `attempted_at` | `INTEGER` | No | Không có | Persist ngay trước native API call. |
| `created_at` | `INTEGER` | No | Không có | Bằng `attempted_at`. |

Không lưu rating/review outcome vì native API không cung cấp truth đáng tin cậy. Eligibility count và distinct active days derive từ completed standard Focus; trial bị loại.

### 4.10. `analytics_events` — side-effect queue

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `event_id` | `TEXT` | No | Không có | PK/dedupe key. |
| `event_name` | `TEXT` | No | Không có | Adapter allowlist; không arbitrary/free text. |
| `properties_json` | `TEXT` | No | `'{}'` | Max 20 properties và serialized payload <= 2 KiB. |
| `occurred_at` | `INTEGER` | No | Không có | Event timestamp. |
| `expires_at` | `INTEGER` | No | Không có | `occurred_at + 7 days`; expired row bị xóa. |
| `delivery_state` | `TEXT` | No | `pending` | `pending`/`retry_wait`. |
| `attempt_count` | `INTEGER` | No | `0` | `CHECK (>= 0)`. |
| `next_attempt_at` | `INTEGER` | Yes | `NULL` | Exponential-backoff schedule. |
| `created_at` | `INTEGER` | No | Không có | Queue insert time. |

Queue tối đa 1.000 rows/device; khi đầy drop oldest trước insert. Không queue free text, Pet name, raw database row hoặc feedback comment. Queue/retry/delete không chạy trong session/reward/purchase transaction.

### 4.11. `schema_migrations`

| Field | Type | Null | Default | Constraint/meaning |
|---|---|---:|---|---|
| `version` | `INTEGER` | No | Không có | PK, strictly increasing. |
| `name` | `TEXT` | No | Không có | Stable migration name; `UNIQUE`. |
| `checksum` | `TEXT` | No | Không có | Phát hiện migration file bị sửa sau release. |
| `applied_at` | `INTEGER` | No | Không có | Application Clock timestamp. |

`schema_migrations` là canonical migration history; không duy trì một writable schema-version truth thứ hai trong Zustand/settings.

## 5. Keys, constraints và indexes

### 5.1. Primary/foreign/unique constraints

| Table | PK | FK | Unique/backstop |
|---|---|---|---|
| `app_installation` | `id` | — | `anonymous_analytics_id` khi non-null. |
| `app_settings` | `id` | — | Singleton check. |
| `pet_profiles` | `id` | — | Singleton check. |
| `sessions` | `id` | `profile_id → pet_profiles` | One running row partial unique; `UNIQUE(id, profile_id)` cho composite ownership FK. |
| `reward_transactions` | `id` | `(session_id, profile_id) → sessions(id, profile_id)`; `profile_id → pet_profiles` | `UNIQUE(session_id)`. |
| `catalog_items` | `id` | — | Exact seed checked by migration test. |
| `purchase_transactions` | `id` | `profile_id → pet_profiles`; `item_id → catalog_items` | `UNIQUE(profile_id, item_id)`; `UNIQUE(id, profile_id, item_id)` cho ownership FK. |
| `owned_items` | `(profile_id, item_id)` | profile/catalog; `(purchase_transaction_id, profile_id, item_id) → purchase_transactions(id, profile_id, item_id)` | `UNIQUE(purchase_transaction_id)`. |
| `store_review_attempts` | `id` | — | `UNIQUE(app_version)`. |
| `analytics_events` | `event_id` | — | Event ID is dedupe key. |
| `schema_migrations` | `version` | — | `UNIQUE(name)`. |

All product FK use `ON DELETE RESTRICT`; confirmed full reset xóa row theo explicit order trong một reset transaction. Không dùng cascade âm thầm làm mất ledger/inventory.

### 5.2. Index set bắt buộc

| Index | Definition concept | Query/invariant |
|---|---|---|
| `ux_sessions_one_running` | Unique `sessions(status)` where `status = 'running'` | Active-session invariant. |
| `ix_sessions_history` | `(profile_id, session_type, focus_variant, status, ends_at DESC)` | Standard history/contribution/store review. |
| `ix_sessions_local_day` | `(profile_id, scheduled_end_local_date, session_type, focus_variant, status)` | Contribution grouping và store-review distinct active days. |
| `ix_sessions_recent` | `(profile_id, started_at DESC)` | Recent session list. |
| `ix_sessions_long_break_cadence` | `(profile_id, session_type, status, resolved_at DESC)` | Completed Focus since latest completed Long Break. |
| `ix_sessions_strict_active` | `(backgrounded_at)` where `status='running' AND mode='strict'` | Startup/foreground Strict reconciliation. |
| `ux_reward_transactions_session` | Unique `(session_id)` | Reward idempotency. |
| `ix_reward_transactions_profile_time` | `(profile_id, created_at DESC)` | Progression audit/rebuild. |
| `ix_catalog_items_category_price` | `(category, price_coins, id)` | Stable shop ordering/filter. |
| `ux_purchase_profile_item` | Unique `(profile_id, item_id)` | No duplicate purchase. |
| `ix_owned_items_equipped` | `(profile_id, is_equipped, updated_at DESC)` | Room projection. |
| `ix_store_review_attempt_time` | `(attempted_at DESC)` | 120-day/rolling-365 cap. |
| `ix_analytics_delivery` | `(delivery_state, next_attempt_at, occurred_at)` | Batch/retry. |
| `ix_analytics_expiry` | `(expires_at)` | TTL cleanup. |

Không tạo index đơn cột cho low-selectivity enum nếu không phục vụ query/partial invariant cụ thể.

### 5.3. Trigger/backstop bắt buộc

| Trigger | Hành vi |
|---|---|
| `trg_sessions_terminal_immutable` | Abort nếu terminal `OLD.status` đổi status. |
| `trg_sessions_identity_immutable` | Abort nếu identity/config/timestamp immutable field đổi sau insert. |
| `trg_reward_insert_valid_session` | Abort nếu session không phải completed Focus, delta/reason không khớp hoặc reward receipt không đồng nhất. |
| `trg_reward_immutable` | Abort `UPDATE`; `DELETE` chỉ được repository reset/migration path gọi theo explicit order. |
| `trg_purchase_immutable` | Abort `UPDATE`; `DELETE` chỉ được repository reset/migration path gọi theo explicit order. |
| `trg_owned_item_equip_consistency` | Backstop equip timestamp/value consistency; composite FK đã bảo đảm purchase receipt khớp profile/item. |

Application policy và Domain rule vẫn là nơi tạo decision; trigger chỉ là corruption/race backstop, không được chứa một reward formula khác với Domain/specification.

## 6. Derived data, queries và no-second-truth rules

### 6.1. Level/progression

```text
totalXp = pet_profiles.total_xp
currentLevel = max L sao cho 25 × (L-1) × (L+2) / 2 <= totalXp
coinBalance = pet_profiles.coin_balance
```

Consistency invariant đã chốt theo `DM-OPEN-003`:

```text
pet_profiles.total_xp
  = SUM(reward_transactions.xp_delta)

pet_profiles.coin_balance
  = SUM(reward_transactions.coin_delta)
  + SUM(purchase_transactions.coin_delta)
```

Empty sum được xem là `0`. Mobile MVP không có opening grant, refund, adjustment hoặc nguồn XP/Coin khác ngoài hai typed receipt trên. Reward/purchase command phải kiểm tra postcondition liên quan trong transaction/integration test. Migration/recovery verifier phát hiện mismatch nhưng không tự cộng/trừ để “sửa”; Application trả safe-recovery error và giữ dữ liệu cho tới khi có migration/repair được duyệt hoặc confirmed full reset.

Không persist `level`, `xpIntoLevel` hoặc `xpToNextLevel`. Nếu cache được thêm sau profiling, cache phải có migration/consistency contract và không trở thành authority mới. Zustand/UI chỉ đọc committed current state và không giữ balance authority độc lập.

### 6.2. Standard Focus history/contribution

Filter bắt buộc:

```text
session_type = focus
AND focus_variant = standard
```

Contribution cộng `configured_duration_minutes` chỉ khi `status = completed`. Failed/cancelled vẫn có thể xuất hiện trong recent history nhưng đóng góp `0` phút. Trial bị loại khỏi cả standard history và contribution.

Contribution và standard active-day group bằng `scheduled_end_local_date`. Key được tính từ `ends_at` và timezone context tại Start, nên không regroup khi reconcile muộn, relaunch hoặc timezone thiết bị thay đổi sau đó.

### 6.3. Long Break cadence

- Tìm completed Long Break gần nhất.
- Đếm completed standard Focus sau mốc đó; trial/failed/cancelled bị loại.
- Khi count >= 4, Long Break due giữ nguyên cho tới completed Long Break.
- Cancelled Long Break không reset.

Không persist `completed_focus_count`, `long_break_due` hoặc cadence state trong Zustand/settings.

### 6.4. Store-review eligibility

- `installed_at` cung cấp minimum 7-day gate.
- Count 5 completed standard Focus từ `sessions`.
- Count 3 distinct `scheduled_end_local_date` từ completed standard Focus theo `DM-OPEN-002`.
- `store_review_attempts` enforce cooldown 120 ngày, <=3 attempts/rolling 365 ngày và unique app version.
- Feedback score/comment/history không được join hoặc đọc trong eligibility query.

### 6.5. Pet state và transient effect

- Active Focus → `working`; active Break → `breaking`; no active → `idle`.
- Fresh committed completed Focus có thể request `celebrating`; fresh Strict failed Focus có thể request `bugged`.
- Runtime dedupe `sessionId + terminalStatus` không persist.
- Relaunch/Result reopen derive base state và không replay receipt.

### 6.6. Notification

Operation key derive từ `sessionId + completion type`; schema không có notification-success/claimed field. Handler luôn reconcile/read `sessions` trước render.

## 7. Transaction boundaries

### 7.1. Start Focus/Break

```text
BEGIN IMMEDIATE
  validate no running session via query + unique-index backstop
  derive scheduled-end local date/offset từ ends_at + timezone context hiện tại
  insert sessions(status = running, immutable timestamp/config/local-day key)
COMMIT
→ hydrate projection
→ notification/analytics/audio/haptic best-effort
```

Unique conflict map sang typed active-session error; không retry bằng insert ID mới.

### 7.2. Background/foreground safe reconciliation

- Strict background: conditional update active Strict Focus `backgrounded_at` trong session command transaction.
- Safe foreground before grace/deadline: giữ `running` và clear `backgrounded_at` trong cùng transaction.
- Break/Relax không dùng `backgrounded_at` làm evidence.
- Invalid timestamp/database failure rollback/no mutation và trả recovery error.

### 7.3. Completed Focus + automatic reward

```text
BEGIN IMMEDIATE
  SELECT running session
  validate timestamps/duration + Domain decision
  UPDATE sessions
    SET status='completed', resolved_at=?,
        xp_earned=?, coins_earned=?, reward_claimed_at=?, updated_at=?
    WHERE id=? AND status='running'
  require exactly 1 changed row
  INSERT reward_transactions(session_id UNIQUE, exact deltas/reason)
  UPDATE pet_profiles
    SET total_xp = total_xp + ?,
        coin_balance = coin_balance + ?, updated_at=?
    WHERE id=?
  require exactly 1 changed row
COMMIT
```

Bất kỳ failure/unique conflict bất ngờ nào rollback toàn bộ. Retry sau commit đọc committed terminal/reward và không cộng delta lại. Result, notification, analytics và Pet effect chạy sau commit.

### 7.4. Failed/cancelled Focus và completed/cancelled Break

- Conditional terminal update chỉ khi `status = running`.
- Set `resolved_at`, giữ reward fields bằng `0/NULL`.
- Không insert reward row và không update progression/balance.
- Side-effect cleanup chạy sau commit.

### 7.5. Purchase item

```text
BEGIN IMMEDIATE
  SELECT catalog price by item_id
  SELECT profile coin_balance
  SELECT ownership/purchase receipt
  reject if invalid catalog, owned hoặc insufficient balance
  UPDATE pet_profiles
    SET coin_balance = coin_balance - price, updated_at=?
    WHERE id=? AND coin_balance >= price
  require exactly 1 changed row
  INSERT purchase_transactions(unique profile_id + item_id, exact price/debit)
  INSERT owned_items(link purchase receipt, is_equipped=0)
COMMIT
```

Double tap/retry/unique conflict không được debit lần hai. UI price không được dùng trong debit.

### 7.6. Equip/unequip

- Transaction chỉ update owned row đã tồn tại.
- Equip chưa owned trả typed error và không mutate.
- Không Coin debit, RewardTransaction hoặc gameplay effect.
- Exact visual placement/slot không persist trong baseline.

### 7.7. Store-review attempt

Insert `store_review_attempts` commit ngay trước native API call. Native API failure/no prompt vẫn giữ attempt; không rollback/delete/retry ngay.

### 7.8. Settings và analytics opt-out

- Settings row update atomic, validate exact field range.
- Khi `analytics_enabled` chuyển `1 → 0`, commit preference trước, sau đó adapter dừng capture và xóa queue/rotate anonymous ID theo coordinated privacy command.
- Analytics cleanup không nằm trong session/reward transaction.

## 8. Migration và schema versioning

### 8.1. Forward-only migration — `BASELINE`/`RESOLVED`

1. Migration file immutable, đặt tại `apps/mobile/src/infrastructure/database/migrations/`.
2. Tên bắt buộc: `<zero-padded-version>_<kebab-description>.migration.ts`.
3. Mỗi migration chạy trong transaction khi SQLite operation cho phép.
4. Ghi `schema_migrations` chỉ sau khi toàn bộ DDL/data backfill/validation thành công.
5. Checksum mismatch, version gap hoặc migration failure dừng bootstrap trước repository/use case.
6. Không tự xóa DB, catalog, session, reward hoặc inventory khi migration fail.
7. UI vào database recovery state với Retry; confirmed full reset là last resort.
8. Không automatic downgrade. Binary cũ gặp schema mới phải fail safely; release pipeline phải test compatibility/rollback trước production.

### 8.2. Initial migration gate

Migration `001` chỉ được khóa để implement sau khi Data Model được Dũng review/phê duyệt toàn bộ và phát hành `1.0.0 APPROVED`. Initial seed phải:

- Tạo singleton installation/settings/profile.
- Seed Settings theo `DM-OPEN-004`: `relax`, sound/haptic/notification preference/analytics bằng `1`.
- Tạo exact 12 catalog rows và verify count/ID/name/category/price.
- Tạo FK/check/unique/index/trigger.
- Không seed Pet species/name/stage.
- Không seed owned shop item; default room assets không thuộc catalog.

### 8.3. Future migration boundaries

- Catalog/price change cần Product Core approval trước; owned item không bị thu hồi.
- Pet type column chỉ được xem xét nếu Product duyệt multiple-Pet scope mới; Pet name column chỉ thêm sau `OPEN-009` resolution và authority sync khi cần.
- Cloud ID, sync revision/conflict, backend economy hoặc account FK không được thêm trước Product/ADR approval.
- Evolution/Happiness/Energy/streak/monetization không được reserve bằng nullable column “để dùng sau”.
- Major Expo/SQLite upgrade phải test migration từ database version production trước đó trên iOS và Android.

## 9. Retention, deletion và reset

### 9.1. Retention policy — `DM-OPEN-007` (`RESOLVED`)

| Data | Retention Mobile MVP |
|---|---|
| Sessions/reward/purchase/owned items | Giữ local cho tới confirmed full reset; không background-prune product history. `RESOLVED` theo `DM-OPEN-007`. |
| Catalog/settings/profile/install metadata | Giữ tới migration/reset; catalog được reseed đúng approved version. |
| Store-review attempts | Giữ tới reset để enforce one-attempt/app-version; rolling query chỉ xét 365 ngày. |
| Analytics queue | Tối đa 1.000 rows và 7 ngày; delivered/expired/drop-oldest bị xóa. `BASELINE`. |
| Pet animation/notification delivery | Không persist. |
| Feedback score/comment | Không persist theo `DM-OPEN-005`; chỉ giữ trong memory khi form còn mở, không tự retry sau relaunch. |

### 9.2. Confirmed full local-data reset

Reset là explicit user action có warning/confirmation, không phải migration fallback tự động.

```text
enter reset barrier; block core commands
→ best-effort cancel notifications for known active session
→ BEGIN IMMEDIATE
    delete analytics queue
    delete owned_items
    delete purchase_transactions
    delete reward_transactions
    delete sessions
    delete store_review_attempts
    reset/reseed settings, profile, installation metadata
    keep schema_migrations and exact approved catalog/schema
  COMMIT
→ rotate/create anonymous analytics ID according to opt-in setting
→ clear Zustand/application projections
→ rerun bootstrap/hydration
```

Nếu reset transaction thất bại, rollback và giữ dữ liệu; không render reset success. Notification cleanup failure không được phục hồi dữ liệu đã reset nhưng phải được sanitize/log best-effort.

Không có partial reset riêng cho XP, Coin, inventory, session history hoặc Pet progression trong MVP.

## 10. Example records

Ví dụ minh họa format và invariant; ID/timestamp không phải seed cố định.

### 10.1. Completed standard Focus 25 phút

```json
{
  "id": "ses_01JSTANDARD25",
  "profile_id": 1,
  "session_type": "focus",
  "focus_variant": "standard",
  "mode": "relax",
  "status": "completed",
  "work_tag": "coding",
  "configured_duration_minutes": 25,
  "started_at": 1787792400000,
  "ends_at": 1787793900000,
  "backgrounded_at": null,
  "resolved_at": 1787793901200,
  "xp_earned": 25,
  "coins_earned": 5,
  "reward_claimed_at": 1787793901200,
  "scheduled_end_local_date": "2026-08-27",
  "scheduled_end_utc_offset_minutes": 420,
  "created_at": 1787792400000,
  "updated_at": 1787793901200
}
```

Hai field scheduled-end local-day là immutable truth đã được `DM-OPEN-002` chốt; contribution và store-review active-day query dùng cùng date key.

### 10.2. RewardTransaction tương ứng

```json
{
  "id": "rwd_01JSTANDARD25",
  "session_id": "ses_01JSTANDARD25",
  "profile_id": 1,
  "xp_delta": 25,
  "coin_delta": 5,
  "reason": "focus_completed",
  "created_at": 1787793901200
}
```

### 10.3. Completed onboarding trial

```json
{
  "id": "ses_01JTRIAL5",
  "profile_id": 1,
  "session_type": "focus",
  "focus_variant": "onboarding_trial",
  "mode": "relax",
  "status": "completed",
  "work_tag": null,
  "configured_duration_minutes": 5,
  "started_at": 1787788800000,
  "ends_at": 1787789100000,
  "scheduled_end_local_date": "2026-08-27",
  "scheduled_end_utc_offset_minutes": 420,
  "resolved_at": 1787789100500,
  "xp_earned": 5,
  "coins_earned": 1,
  "reward_claimed_at": 1787789100500
}
```

Query standard history/cadence/store review phải loại row này bằng `focus_variant`.

### 10.4. Running Strict Focus

```json
{
  "id": "ses_01JSTRICT50",
  "profile_id": 1,
  "session_type": "focus",
  "focus_variant": "standard",
  "mode": "strict",
  "status": "running",
  "work_tag": "writing",
  "configured_duration_minutes": 50,
  "started_at": 1787796000000,
  "ends_at": 1787799000000,
  "scheduled_end_local_date": "2026-08-27",
  "scheduled_end_utc_offset_minutes": 420,
  "backgrounded_at": 1787797200000,
  "resolved_at": null,
  "xp_earned": 0,
  "coins_earned": 0,
  "reward_claimed_at": null
}
```

### 10.5. Running Long Break

```json
{
  "id": "ses_01JBREAK15",
  "profile_id": 1,
  "session_type": "long_break",
  "focus_variant": null,
  "mode": null,
  "status": "running",
  "work_tag": null,
  "configured_duration_minutes": 15,
  "started_at": 1787800000000,
  "ends_at": 1787800900000,
  "scheduled_end_local_date": "2026-08-27",
  "scheduled_end_utc_offset_minutes": 420,
  "backgrounded_at": null,
  "resolved_at": null,
  "xp_earned": 0,
  "coins_earned": 0,
  "reward_claimed_at": null
}
```

### 10.6. Purchase và owned item

```json
{
  "purchase": {
    "id": "pur_01JDESKMUG",
    "profile_id": 1,
    "item_id": "desk-mug",
    "price_paid_coins": 5,
    "coin_delta": -5,
    "reason": "item_purchase",
    "created_at": 1787801000000
  },
  "ownership": {
    "profile_id": 1,
    "item_id": "desk-mug",
    "purchase_transaction_id": "pur_01JDESKMUG",
    "unlocked_at": 1787801000000,
    "is_equipped": 1,
    "equipped_at": 1787801010000,
    "updated_at": 1787801010000
  }
}
```

## 11. Edge cases và recovery matrix

| ID | Tình huống | Database behavior bắt buộc |
|---|---|---|
| `DM-EDGE-001` | Hai Start command | Partial unique active index cho một insert; loser typed conflict, không notification. |
| `DM-EDGE-002` | Cancel và complete race | Conditional update đầu tiên từ `running` thắng; terminal trigger chặn đổi kết quả. |
| `DM-EDGE-003` | Hai reconcile reward | Unique `reward_transactions.session_id` + transaction bảo đảm một delta. |
| `DM-EDGE-004` | Kill giữa terminal và reward | Không có committed half-state; cùng transaction rollback/commit toàn bộ. |
| `DM-EDGE-005` | Result/notification mở lặp | Read terminal/reward row; không insert/update balance. |
| `DM-EDGE-006` | Strict `violationAt == endsAt` | Persist `failed`, zero reward, không reward row. |
| `DM-EDGE-007` | Strict missing `backgrounded_at` after kill | Không invent evidence; resolve deadline theo baseline. |
| `DM-EDGE-008` | Break background lâu | Không persist Strict evidence; deadline/cancel quyết định result. |
| `DM-EDGE-009` | `ends_at < started_at`/overflow | Không resolve/reward; recovery projection; explicit conditional cancel nếu DB usable. |
| `DM-EDGE-010` | Completed Focus duration corrupt | Không clamp/floor/grant; rollback và recovery. |
| `DM-EDGE-011` | Reward unique conflict sau committed retry | Read committed reward; không cộng balance. Unexpected mismatch → recovery, không repair từ UI. |
| `DM-EDGE-012` | Purchase double tap | Unique profile/item + atomic guarded debit; một purchase/ownership. |
| `DM-EDGE-013` | Insufficient Coin | Guarded update changes 0 rows; rollback/no receipt/no ownership. |
| `DM-EDGE-014` | UI gửi price sai | Ignore UI price; read catalog price. |
| `DM-EDGE-015` | Item/catalog row invalid | Reject và safe catalog recovery; không sửa giá/debit. |
| `DM-EDGE-016` | Equip unowned item | Update changes 0 rows; typed error; no Coin/reward mutation. |
| `DM-EDGE-017` | Catalog migration đổi ID/price trái authority | Migration validation fail; không bootstrap. |
| `DM-EDGE-018` | Migration fail | Rollback/retain DB; recovery + Retry; no auto-delete. |
| `DM-EDGE-019` | Downgrade binary mở newer schema | Fail safely trước repository; không chạy incompatible query/write. |
| `DM-EDGE-020` | Analytics queue >1.000 | Drop oldest side-effect row; core product truth không đổi. |
| `DM-EDGE-021` | Analytics opt-out/reset | Stop capture, clear queue, rotate ID; no session/economy mutation trừ full reset scope. |
| `DM-EDGE-022` | Full reset bị kill giữa transaction | Atomic rollback hoặc full committed reset; không partial economy/history. |
| `DM-EDGE-023` | Timezone đổi sau session | Giữ `scheduled_end_local_date` đã persist; không regroup theo timezone hiện tại. |
| `DM-EDGE-024` | Trial completed | 5 XP/1 Coin once; query exclusions vẫn giữ dù Result/relaunch lặp. |
| `DM-EDGE-025` | Cancelled Long Break | Persist cancelled; cadence query không chọn làm reset marker. |
| `DM-EDGE-026` | Trial background/foreground hoặc nhận duplicate callback | Trial vẫn theo Relax semantics; không persist Strict evidence, không fail vì background và reward vẫn tối đa một lần. |
| `DM-EDGE-027` | Background cleanup cố prune product history/ledger | Không xóa session, reward/purchase receipt, ownership hoặc store-review attempt; chỉ analytics queue áp dụng cap/TTL riêng. |

## 12. Data Model decisions

### 12.1. Decision register

| ID | Câu hỏi | Proposal hiện tại | Owner | Trạng thái |
|---|---|---|---|---|
| `DM-OPEN-001` | Focus/Break dùng một bảng `sessions`, parent + subtype, hay bảng tách? | Chọn một bảng `sessions` với `session_type` và conditional checks. | Dũng Lư — Tech Lead | `RESOLVED` ngày 2026-08-27. |
| `DM-OPEN-002` | Completed standard Focus được gán vào local day nào khi qua nửa đêm/đổi timezone? | Chọn local date của `ends_at`, tính/persist khi Start theo timezone context lúc đó. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-27. |
| `DM-OPEN-003` | Current XP/Coin dùng stored aggregate + immutable receipts hay derive hoàn toàn từ ledger? | Chọn stored `total_xp`/`coin_balance` + typed reward/purchase receipts, commit atomically. | Dũng Lư — Tech Lead | `RESOLVED` ngày 2026-08-27. |
| `DM-OPEN-004` | Initial default cho mode/audio/haptic/notification/analytics preference là gì? | Chọn `relax`; sound/haptic/notification preference/analytics đều bật. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-27. |
| `DM-OPEN-005` | Feedback comment có queue/persist local để retry không, và retention/encryption policy là gì? | Chọn không persist; form chỉ giữ input trong memory và cho Retry khi còn mở. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-27. |
| `DM-OPEN-006` | Onboarding trial persist `mode`/`work_tag` nào khi first-use flow không yêu cầu user chọn? | Chọn `mode = relax`, `work_tag = NULL`; trial không có Strict failure path. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-27; authority sync hoàn tất. |
| `DM-OPEN-007` | Product history/ledger được giữ vô thời hạn local tới reset hay có retention cap? | Chọn giữ tới confirmed full reset; analytics queue vẫn theo cap/TTL riêng. | Dũng Lư — Product Owner/Tech Lead | `RESOLVED` ngày 2026-08-27. |

### 12.2. Alternatives cho `DM-OPEN-001`

Giải thích đơn giản: Focus và Break dùng chung status/timestamp/active-session invariant, nhưng có field riêng như mode/tag/trial. Cần chọn cách chia table trước khi khóa FK, index, repository và migration đầu tiên.

| Phương án | Thiết kế | Độ tin cậy | Chi phí | Độ phức tạp | Đánh giá |
|---|---|---|---|---|---|
| A — Một bảng `sessions` (**đã chọn**) | Một row shape, dùng `session_type` + conditional `CHECK` | `HIGH` | Thấp | Thấp–trung bình | Một active unique index, một history/cadence query và một terminal transaction path; trade-off là conditional constraint dài hơn. |
| B — Parent `sessions` + subtype tables | Common lifecycle ở parent; Focus/Break detail ở child 1:1 | `HIGH` | Trung bình | Trung bình–cao | Type purity tốt hơn nhưng cần multi-table insert/join và cross-table invariant/trigger phức tạp hơn. |
| C — Tách `focus_sessions`/`break_sessions` | Mỗi loại có schema riêng | `MEDIUM` | Trung bình | Trung bình | Row đơn giản, nhưng one-active invariant, reconciliation, history và race phải enforce xuyên hai table. |

**Quyết định:** Dũng Lư chọn phương án A ngày 2026-08-27. Confidence tại thời điểm chốt là `HIGH`; chi phí thấp và độ phức tạp thấp–trung bình. Một bảng `sessions` với `session_type` cùng conditional constraints là topology normative cho Mobile MVP.

Lựa chọn này không thay đổi Product Core hay baseline cao hơn; nó chỉ chi tiết hóa persistence nên không cần sync authority cao hơn.

### 12.3. Alternatives cho `DM-OPEN-002`

Decision này xác định một completed standard Focus qua nửa đêm hoặc được reconcile sau khi đổi timezone sẽ thuộc ngày nào trong contribution graph và store-review active-day count.

| Phương án | Local day được dùng | Độ tin cậy | Chi phí | Độ phức tạp | Đánh giá |
|---|---|---|---|---|---|
| A — Ngày bắt đầu | Local date của `started_at`, capture khi Start | `MEDIUM` | Thấp | Thấp | Ổn định, nhưng Focus hoàn thành sau nửa đêm vẫn tính vào ngày trước. |
| B — Ngày hoàn thành dự kiến (**đã chọn**) | Local date của `ends_at`, tính và persist ngay khi Start theo timezone context lúc đó | `MEDIUM-HIGH` | Thấp | Thấp–trung bình | Phản ánh ngày effort dự kiến hoàn thành; ổn định qua delayed reconciliation, relaunch hoặc timezone change sau đó. |
| C — Ngày resolve thực tế | Local date của `resolved_at` theo timezone thiết bị khi terminal transaction chạy | `LOW-MEDIUM` | Thấp | Thấp | Đơn giản nhưng session có thể bị chuyển ngày do app mở lại muộn hoặc user di chuyển timezone. |

**Quyết định:** Dũng Lư chọn phương án B ngày 2026-08-27. Confidence tại thời điểm chốt là `MEDIUM-HIGH`; chi phí thấp và độ phức tạp thấp–trung bình.

Schema persist `scheduled_end_local_date` và `scheduled_end_utc_offset_minutes` tương ứng với `ends_at`, được tính khi Start. Contribution graph và store-review distinct active days dùng cùng key; không dynamic regroup bằng timezone hiện tại.

Decision này chi tiết hóa “ngày local” đã được Product Core/Timer Engine giao cho Data Model; không thay đổi authority cao hơn nên không cần sync tài liệu khác.

### 12.4. Alternatives cho `DM-OPEN-003`

Decision này chọn cách bảo vệ current XP/Coin và immutable transaction receipts mà không tạo balance truth trong Zustand/UI.

| Phương án | Thiết kế | Độ tin cậy | Chi phí | Độ phức tạp | Đánh giá |
|---|---|---|---|---|---|
| A — Stored balance + typed receipts (**đã chọn**) | `pet_profiles.total_xp/coin_balance` cho current state; `reward_transactions` và `purchase_transactions` là immutable receipts; tất cả commit atomically | `HIGH` | Thấp | Trung bình | Read nhanh, idempotency/audit rõ; cần consistency invariant vì có stored aggregate. |
| B — Ledger-only | Không lưu current balance; mọi read tính tổng reward/purchase delta | `MEDIUM-HIGH` | Thấp | Trung bình | Một arithmetic source, nhưng Home/Shop/level và guarded purchase luôn cần aggregate query. |
| C — Unified economy ledger + stored balance | Gộp reward/purchase vào một ledger có conditional fields, vẫn lưu current balance | `MEDIUM` | Trung bình | Trung bình–cao | Một transaction stream nhưng row shape phức tạp và làm RewardTransaction/inventory mapping kém rõ hơn. |

**Quyết định:** Dũng Lư chọn phương án A ngày 2026-08-27. Confidence tại thời điểm chốt là `HIGH`; chi phí thấp và độ phức tạp trung bình.

`pet_profiles` là authoritative current state cho read; transaction tables là immutable idempotency/audit receipts. Application/SQLite transaction bắt buộc cập nhật cả hai atomically; consistency mismatch đi vào safe recovery và không được UI tự repair.

Decision này chỉ chi tiết hóa reward/purchase persistence đã được baseline giao cho Data Model; không cần sync authority cao hơn.

### 12.5. Alternatives cho `DM-OPEN-004`

Decision này chọn giá trị seed lần đầu cho các setting chưa có default rõ trong authority. Notification preference không đồng nghĩa tự xin/đã có OS permission; permission vẫn chỉ được request trong context phù hợp.

| Phương án | `default_mode` | Sound | Haptic | Notification preference | Analytics | Độ tin cậy/chi phí/phức tạp |
|---|---|---:|---:|---:|---:|---|
| A — Balanced experience (**đã chọn**) | `relax` | On | On | On | On | `MEDIUM`; chi phí thấp; phức tạp thấp. |
| B — Quiet/private by default | `relax` | Off | Off | Off | Off | `MEDIUM`; chi phí thấp; phức tạp thấp nhưng làm mờ audio/haptic/notification loop và giảm beta metrics. |
| C — Local experience, explicit data/prompt opt-in | `relax` | On | On | Off | Off | `MEDIUM`; chi phí thấp; phức tạp thấp–trung bình do cần enable/education flow rõ hơn. |

**Quyết định:** Dũng Lư chọn phương án A ngày 2026-08-27. Confidence tại thời điểm chốt là `MEDIUM`; chi phí thấp và độ phức tạp thấp.

- `relax` phù hợp companion-first và tránh Strict trở thành default trừng phạt.
- Sound/haptic mặc định bật để giữ retro feedback nhưng Settings có thể tắt hoàn toàn.
- Notification preference bật để core completion reminder hoạt động sau khi user cấp OS permission; app vẫn không xin permission ngoài context phù hợp.
- Analytics bật theo anonymous/manual-allowlist baseline để beta metrics hoạt động; user có thể opt out, queue bị xóa và anonymous ID được rotate.

Không default nào làm notification, analytics, audio hoặc haptic trở thành điều kiện của timer/reward. Decision này chi tiết hóa initial settings seed và không cần sync authority cao hơn.

### 12.6. Alternatives cho `DM-OPEN-005`

Decision này xác định feedback score/comment có được lưu bền vững trên thiết bị để tự retry sau app close/relaunch hay không. Feedback comment là free text và bị cấm gửi vào analytics/log.

| Phương án | Hành vi | Độ tin cậy | Chi phí | Độ phức tạp | Đánh giá |
|---|---|---|---|---|---|
| A — Không persist feedback (**đã chọn**) | Form giữ input trong memory; submit lỗi hiển thị Retry khi screen còn mở; app close có thể mất draft | `MEDIUM-HIGH` | Thấp | Thấp | Data minimization tốt nhất; không cần lưu free text hoặc background worker. |
| B — Durable bounded outbox | Persist score/comment tới khi gửi thành công hoặc TTL; tự retry có kiểm soát | `MEDIUM` | Trung bình | Trung bình–cao | UX retry tốt hơn nhưng thêm sensitive free-text retention, encryption/cleanup và provider idempotency. |
| C — Chỉ queue score | Persist 1–5 score, comment vẫn ephemeral | `LOW-MEDIUM` | Thấp–trung bình | Trung bình | Giảm dữ liệu nhưng có thể gửi feedback thiếu comment trái kỳ vọng và làm delivery semantics khó hiểu. |

**Quyết định:** Dũng Lư chọn phương án A ngày 2026-08-27. Confidence tại thời điểm chốt là `MEDIUM-HIGH`; chi phí thấp và độ phức tạp thấp.

Submit failure là recoverable UI error, không ảnh hưởng core loop; user có thể Retry khi form còn mở. App không lưu score/comment vào SQLite, analytics hoặc production log và không tự submit sau relaunch.

Decision này chi tiết hóa feedback retry boundary mà Product Core giao cho technical specification; không thay đổi authority cao hơn.

### 12.7. Alternatives cho `DM-OPEN-006`

First-use flow đã khóa trial Focus 5 phút nhưng trước decision này chưa nói trial có mode/tag nào. Lựa chọn ảnh hưởng Strict failure behavior và nullability của `sessions.mode/work_tag`.

| Phương án | Trial mode/tag | Độ tin cậy | Chi phí | Độ phức tạp | Đánh giá |
|---|---|---|---|---|---|
| A — Relax, không tag (**đã chọn**) | `mode = relax`; `work_tag = NULL` | `HIGH` | Thấp | Thấp | Dùng mode sẵn có, không phạt user trong onboarding và không invent work tag bị loại khỏi standard metrics. |
| B — Cả hai `NULL` + trial policy riêng | `mode = NULL`; `work_tag = NULL` | `MEDIUM` | Thấp | Trung bình | Tránh gán Relax nhưng tạo một Focus mode đặc biệt ngoài enum và thêm nhánh lifecycle. |
| C — User chọn mode/tag trước trial | Mode/tag non-null theo lựa chọn user | `LOW-MEDIUM` | Trung bình | Trung bình–cao | Thay đổi first-use flow, thêm friction và làm trial phức tạp hơn mục tiêu onboarding ngắn. |

**Quyết định:** Dũng Lư chọn phương án A ngày 2026-08-27 và phê duyệt các update đồng bộ. Confidence tại thời điểm chốt là `HIGH`; chi phí thấp và độ phức tạp thấp.

Trial dùng Relax lifecycle, không có Strict violation/failure branch và không có work tag; `focus_variant = onboarding_trial` tiếp tục loại trial khỏi standard history/contribution/cadence/store-review/core analytics.

Decision làm rõ product/session behavior trước đó chưa được authority nói rõ. Các tài liệu sau đã được bảo trì đồng bộ theo phê duyệt:

- `PIXELDORO_CORE_TRUTH.md` 1.13.0: trial dùng Relax semantics và không có work tag.
- `specifications/timer-engine.md` 1.0.2: Start validation và lifecycle exception cho trial.
- `specifications/session-lifecycle.md` 1.0.1: trial không có Strict failure và không tham gia standard lifecycle aggregates.
- `specifications/gamification-rules.md` 1.0.1: trace mode/tag neutrality và reward boundary của trial.

Không cần sửa Technical Overview, System Architecture, Project Structure, checklist hoặc ADR cho decision này.

### 12.8. Alternatives cho `DM-OPEN-007`

Giải thích đơn giản: cần chọn product history và economy receipts tồn tại bao lâu trên thiết bị. Reward/purchase receipts hiện vừa bảo vệ idempotency vừa kiểm chứng `total_xp`/`coin_balance`, nên xóa chúng theo tuổi có thể làm mất khả năng audit hoặc phá consistency invariant dù balance hiện tại vẫn còn.

| Phương án | Retention | Độ tin cậy | Chi phí | Độ phức tạp | Đánh giá |
|---|---|---|---|---|---|
| A — Giữ tới confirmed full reset (**đã chọn**) | Không background-prune sessions, reward/purchase receipts, ownership hoặc store-review attempts; analytics queue vẫn dùng cap/TTL riêng | `HIGH` | Thấp | Thấp | Giữ trọn idempotency/audit/aggregate consistency; phù hợp offline-only MVP. Trade-off là dữ liệu tăng dần cho tới reset. |
| B — Rolling retention cap | Xóa product rows quá tuổi hoặc vượt số lượng cấu hình | `LOW` | Trung bình | Cao | Cần chốt cap và cascade/summary semantics; dễ mất history, idempotency receipt, active-day truth hoặc làm balance không còn đối soát được. |
| C — Compact sang summary/tombstone | Prune session detail nhưng giữ summary/idempotency tombstone và economy checkpoint | `MEDIUM` | Cao | Cao | Có thể kiểm soát dung lượng dài hạn nhưng tạo migration, checkpoint và recovery protocol mới chưa cần cho Mobile MVP. |

**Quyết định:** Dũng Lư chọn phương án A ngày 2026-08-27. Confidence tại thời điểm chốt là `HIGH`; chi phí thấp và độ phức tạp thấp.

Product rows chỉ bị xóa trong confirmed full reset atomic hoặc migration được duyệt; không có background retention job cho sessions, reward/purchase receipts, ownership hoặc store-review attempts. Analytics side-effect queue tiếp tục độc lập với giới hạn 1.000 rows/7 ngày.

Decision này chi tiết hóa retention/reset persistence trong Data Model và không thay đổi Product Core, baseline `APPROVED`, checklist hoặc ADR; không cần authority sync cao hơn.

### 12.9. Decision order

```text
DM-OPEN-001 table topology — RESOLVED
  → DM-OPEN-002 local-day/history key — RESOLVED
  → DM-OPEN-003 economy current-state/ledger strategy — RESOLVED
  → DM-OPEN-004 settings seed defaults — RESOLVED
  → DM-OPEN-005 feedback persistence/privacy — RESOLVED
  → DM-OPEN-006 onboarding trial mode/tag representation — RESOLVED + SYNCED
  → DM-OPEN-007 local product-data retention — RESOLVED
  → schema freeze + migration/test review — NEXT
```

Mỗi decision trong register chỉ được chuyển `RESOLVED` sau xác nhận riêng của Dũng Lư. `DM-OPEN-001` đến `DM-OPEN-007` đã hoàn tất quy trình này; `DM-OPEN-006` cũng đã hoàn tất authority sync được phê duyệt.

## 13. Test matrix

| Cấp test | Phạm vi bắt buộc |
|---|---|
| Domain unit | Enum/value mapping, duration validation, reward/level formula, Strict precedence, trial exclusion facts. |
| Application unit | Transaction command contract, coordinator/single-flight, idempotent retry result, settings/reset/privacy orchestration. |
| SQLite migration | Empty DB → latest; every released version → latest; checksum/version gap; migration rollback; exact catalog seed. |
| SQLite constraints | FK enabled, one running session, conditional field checks, terminal immutability, timestamp/duration/reward checks. |
| SQLite reward integration | Atomic completed Focus + reward + profile delta; unique `session_id`; kill/rollback simulation; mismatch recovery. |
| SQLite session integration | Start/cancel/complete race, Strict background clear, Break no-Strict, trial 5-minute exception, terminal no-op. |
| SQLite inventory integration | Exact catalog/price, sufficient/insufficient balance, double tap, guarded debit, owned/equip rules. |
| Query integration | Standard history/trial exclusion, contribution sum, Long Break cadence, store-review count/distinct day. |
| Analytics queue integration | 1.000-row cap, 7-day TTL, drop-oldest, retry ordering, payload limit, opt-out/reset. |
| Retention integration | Product history/ledger/ownership/store-review attempts không bị background-prune; chỉ confirmed full reset hoặc approved migration được xóa. |
| Reset integration | Confirmed full reset atomicity, schema/catalog retained, history/economy/attempts cleared, singleton reseed. |
| Mobile integration | Bootstrap migration/reconciliation barrier, DB unavailable/recovery, Zustand rehydrate, notification/analytics side-effect isolation. |
| Device/simulator | iOS/Android kill/relaunch, disk-full/write failure where feasible, timezone/system-clock scenarios, reset/reinstall behavior. |

Required deterministic cases include 5-minute trial and every standard duration 15–120 step 5; reward values must match Gamification Rules exactly.

## 14. Acceptance criteria

Checkbox vẫn để trống cho tới implementation/test evidence; specification approval không thay thế implementation verification.

### 14.1. Entity/schema completeness

- [ ] Mọi Mobile MVP durable entity có owner và table/adapter boundary rõ ràng.
- [ ] Field có datatype, null/default/check rule; mọi enum khớp approved terminology.
- [ ] PK/FK/unique/index/trigger được migration và integration test xác minh.
- [ ] Không có Pet species/name/stage, contribution color hoặc deferred feature bị chốt ngầm.
- [ ] Không có `paused`, Pet visual state, Result claim, notification result hoặc UI recovery state trong durable schema.

### 14.2. Session/timer correctness

- [ ] Chỉ một `running` Focus/Break session tồn tại.
- [ ] Timestamp là Unix epoch ms; immutable start/config/deadline và `ends_at` arithmetic được validate.
- [ ] Conditional terminal transition chỉ thắng khi stored status còn `running`.
- [ ] Terminal status không đổi hoặc quay lại `running`.
- [ ] Break không có Strict fields/failure path; Strict evidence chỉ dựa persisted `backgrounded_at`.
- [ ] Onboarding trial persist `mode = relax`, `work_tag = NULL`; background không tạo Strict evidence/failure path.
- [ ] Corrupt timestamp/database/migration failure không tự terminal/reward hoặc delete data.

### 14.3. Reward/progression correctness

- [ ] Completed standard Focus và trial commit session + unique reward + profile delta + receipt atomically.
- [ ] Reward row unique theo `session_id`; retry/race/Result/notification/Pet/analytics không grant lại.
- [ ] `total_xp` bằng tổng reward XP; `coin_balance` bằng reward Coin cộng purchase debit; mismatch không được UI tự repair.
- [ ] Failed/cancelled Focus và mọi Break có zero reward/no reward row.
- [ ] Reward dùng configured minutes, floor Coin và không overtime bonus.
- [ ] Trial nhận 5 XP/1 Coin once và bị loại khỏi standard history/cadence/store review/core analytics.
- [ ] Level derive đúng từ cumulative XP; không persist evolution/stage.

### 14.4. Catalog/purchase/inventory

- [ ] Catalog có đúng 12 exact rows và price từ Product Core/Gamification Rules.
- [ ] UI price không là authority; debit dùng catalog price trong transaction.
- [ ] Coin không âm; purchase/debit/ownership atomic và idempotent.
- [ ] Owned item không mua lại/mất do unequip/session outcome; equip unowned bị reject.
- [ ] Không quantity, consumable, refund, dynamic pricing, multiplier hoặc monetization field.

### 14.5. Derived truth và side effects

- [ ] Initial/reset Settings seed `relax`; sound/haptic/notification preference/analytics bằng `1`, nhưng side-effect availability vẫn qua adapter/OS permission.
- [ ] History/contribution/cadence/store-review query derive từ sessions và không dùng Zustand counter.
- [ ] Contribution/local active day dùng policy `DM-OPEN-002` đã duyệt.
- [ ] Pet state/animation và notification không có durable receipt làm source truth thứ hai.
- [ ] Analytics queue bounded, TTL 7 ngày, ngoài core transaction và không chứa forbidden data.
- [ ] Feedback score/comment chỉ tồn tại trong form memory; submit failure cho Retry tại chỗ, không persist hoặc tự submit sau relaunch.
- [ ] Feedback/store-review data không được join để review-gate.

### 14.6. Migration/reset/recovery

- [ ] Forward-only migration có version/checksum và test từ mọi released schema.
- [ ] Migration failure giữ dữ liệu, block unsafe command và cung cấp Retry/recovery.
- [ ] Full reset cần explicit confirmation, atomic cho product rows và giữ schema/catalog hợp lệ.
- [ ] Sessions, reward/purchase receipts, ownership và store-review attempts được giữ tới confirmed full reset; không có background-prune product truth.
- [ ] Opt-out/reset clear analytics queue và rotate anonymous ID theo policy.
- [ ] Binary/schema compatibility và rollback path được release pipeline kiểm thử.

## 15. Review và release conditions

Data Model `1.0.0 APPROVED` và Technical Documentation Checklist được phát hành/cập nhật sau khi các điều kiện sau đã hoàn tất:

1. `DM-OPEN-001` đến mọi decision ảnh hưởng trực tiếp đều `RESOLVED` qua xác nhận của Dũng Lư.
2. Mọi thay đổi cần authority cao hơn đã được nêu, Dũng phê duyệt và đồng bộ trước hoặc đồng thời.
3. Enum, catalog ID/price, reward formula, trial exclusion và transaction boundary không mâu thuẫn bất kỳ baseline `APPROVED` nào.
4. Schema/migration baseline cuối có constraint/index/transaction/test matrix đủ để implement offline-first an toàn.
5. Dũng Lư review và phê duyệt toàn bộ tài liệu, không chỉ từng decision riêng lẻ.
6. Checklist mục Data Model và review cuối bộ tài liệu chỉ đổi sau approval trên.

Ngày 2026-08-27, Dũng Lư xác nhận đã review và duyệt toàn bộ Data Model; cả sáu điều kiện trên đã hoàn tất. Implementation acceptance checkbox ở mục 14 vẫn để trống cho tới khi có migration/test/device evidence và không làm giảm hiệu lực của specification baseline.

## 16. Change log

### 1.2.1 — 2026-08-31

- Đồng bộ Product Core 1.15.0 sau khi Cat Dev sprite v1 được duyệt.
- Xác nhận Pet selector/Cat-Dog-Rabbit roster thuộc phase sau và không tạo schema/migration trong MVP.

### 1.2.0 — 2026-08-31

- Đồng bộ Product `OPEN-001` đã `RESOLVED`: Cat / Mèo Dev với stable presentation ID `cat-dev`.
- Xác nhận quyết định một Pet cố định không tạo durable `petType`/species field và không cần schema migration.
- Multiple-Pet và Pet naming vẫn cần scope/decision riêng; không đổi schema `001` hay durable invariants.

### 1.1.0 — 2026-08-30

- Owner re-baseline product delivery sang UI/user-flow first; mock data và fake navigation được
  phép trước production Domain/DB integration.
- Giữ schema `001` làm existing durable/safety baseline, nhưng hủy cách hiểu database-first:
  approved UX có thể yêu cầu update Data Model và forward migration.
- Bắt buộc data-needs mapping sau UX approval và phân biệt durable fact, transient state, derived
  projection trước khi thêm table/column/repository.

### 1.0.0 — 2026-08-27

- Dũng Lư — Tech Lead/Product Owner xác nhận đã review và phê duyệt toàn bộ Data Model.
- Chuyển trạng thái tài liệu từ `DRAFT` sang `APPROVED`; exact schema, enum, constraint, index, trigger, transaction, migration và retention boundary trở thành normative Mobile MVP baseline.
- Xác nhận `DM-OPEN-001` đến `DM-OPEN-007` đều `RESOLVED` và authority sync liên quan đã hoàn tất.
- Xác nhận exact 12-item catalog/price, atomic unique reward theo `session_id`, stored progression consistency, no-second-truth boundary và offline-first recovery không mâu thuẫn baseline đã duyệt.
- Cập nhật Technical Documentation Checklist cho mục Data Model; implementation acceptance checkbox tiếp tục chờ test/device evidence.

### 0.8.0 — 2026-08-27

- Dũng Lư chọn phương án A cho `DM-OPEN-007`.
- Chốt giữ sessions, reward/purchase receipts, ownership và store-review attempts local tới confirmed full reset; không background-prune product truth.
- Giữ analytics queue tách biệt với cap 1.000 rows và TTL 7 ngày.
- Bổ sung retention edge case, integration-test scope và acceptance criterion.
- Ghi confidence `HIGH`, chi phí thấp và độ phức tạp thấp; không cần sửa authority cao hơn.
- Xác nhận `DM-OPEN-001` đến `DM-OPEN-007` đều `RESOLVED`; tài liệu vẫn `DRAFT` chờ Dũng review/phê duyệt toàn bộ.

### 0.7.0 — 2026-08-27

- Dũng Lư chọn phương án A cho `DM-OPEN-006` và phê duyệt các update đồng bộ.
- Chốt onboarding trial persist `mode = relax`, `work_tag = NULL`, dùng Relax lifecycle và không có Strict violation/failure branch.
- Giữ `focus_variant = onboarding_trial` làm durable discriminator để loại trial khỏi standard history, contribution, cadence, store-review và core analytics.
- Đồng bộ Product Core 1.13.0, Timer Engine 1.0.2, Session Lifecycle 1.0.1 và Gamification Rules 1.0.1; không sửa checklist, architecture baseline hoặc ADR.
- Ghi confidence `HIGH`, chi phí thấp và độ phức tạp thấp.

### 0.6.0 — 2026-08-27

- Dũng Lư chọn phương án A cho `DM-OPEN-005`.
- Chốt không persist feedback score/comment trong core SQLite và không tạo feedback outbox/background retry cho Mobile MVP.
- Chốt form chỉ giữ input trong memory; submit failure cho Retry khi screen còn mở, app close có thể làm mất draft và không tự submit sau relaunch.
- Giữ comment khỏi analytics/production log; feedback failure tiếp tục độc lập với core loop.
- Ghi confidence `MEDIUM-HIGH`, chi phí thấp và độ phức tạp thấp; không cần sửa authority cao hơn.

### 0.5.0 — 2026-08-27

- Dũng Lư chọn phương án A cho `DM-OPEN-004`.
- Chốt initial/reset Settings seed: `default_mode = relax`; sound, haptic, notification preference và anonymous analytics đều bật.
- Làm rõ notification preference không tự xin hoặc chứng minh OS permission; permission vẫn chỉ được request trong context phù hợp.
- Giữ opt-out analytics xóa queue, rotate anonymous ID và dừng capture; mọi side effect vẫn độc lập timer/reward truth.
- Ghi confidence `MEDIUM`, chi phí thấp và độ phức tạp thấp; không cần sửa authority cao hơn.

### 0.4.0 — 2026-08-27

- Dũng Lư chọn phương án A cho `DM-OPEN-003`.
- Chốt `pet_profiles.total_xp/coin_balance` là authoritative current state cho read trong SQLite; typed reward/purchase transactions là immutable idempotency/audit receipts.
- Chốt current state và receipt phải commit atomically trong reward/purchase transaction.
- Bổ sung consistency invariant từ receipt sums; mismatch đi vào safe recovery và không được Zustand/UI tự repair.
- Ghi confidence `HIGH`, chi phí thấp và độ phức tạp trung bình; không cần sửa authority cao hơn.

### 0.3.0 — 2026-08-27

- Dũng Lư chọn phương án B cho `DM-OPEN-002`.
- Chốt completed standard Focus thuộc local date của `ends_at`, được tính và persist ngay khi Start theo timezone context lúc đó.
- Thêm immutable `scheduled_end_local_date` và `scheduled_end_utc_offset_minutes`; contribution graph và store-review active-day dùng cùng stable key.
- Chốt không dynamic regroup khi reconcile muộn, relaunch hoặc timezone thiết bị thay đổi sau Start.
- Ghi confidence `MEDIUM-HIGH`, chi phí thấp và độ phức tạp thấp–trung bình; không cần sửa authority cao hơn.

### 0.2.0 — 2026-08-27

- Dũng Lư chọn phương án A cho `DM-OPEN-001`.
- Chốt một bảng `sessions` với `session_type`, conditional checks và một partial unique active-session index làm topology persistence của Focus/Short Break/Long Break.
- Ghi confidence `HIGH`, chi phí thấp và độ phức tạp thấp–trung bình.
- Xác nhận quyết định chỉ chi tiết hóa Data Model, không cần sửa Product Core, baseline `APPROVED`, checklist hoặc ADR.

### 0.1.0 — 2026-08-27

- Tạo Data Model draft đầu tiên từ duy nhất nội dung hiện có trong `docs/` trên disk.
- Audit Product Core 1.12.0, checklist, ba architecture baseline, bốn specification `APPROVED` và ADR-001 đến ADR-008.
- Kế thừa four-status session truth, Unix epoch ms, no-pause, Strict evidence, automatic atomic reward và safe recovery.
- Đề xuất entity/field/type/null/default, exact catalog seed, PK/FK/unique/index/trigger và transaction boundary.
- Loại Pet animation/Result/notification/Zustand/history aggregate khỏi durable truth; derive cadence/contribution/store-review từ sessions.
- Bổ sung migration/versioning, retention/reset, example records, edge cases, test matrix và acceptance criteria.
- Ghi `DM-OPEN-001` đến `DM-OPEN-007`; không tự chuyển decision nào sang `RESOLVED`.
- Không sửa Product Core, checklist, architecture/specification baseline hoặc ADR.
