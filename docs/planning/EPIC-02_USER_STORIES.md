---
document_id: PIXELDORO_EPIC_02_USER_STORIES
title: PixelDoro Mobile MVP — EPIC-02 User Stories
version: 1.0.0
status: READY_FOR_REVIEW
last_updated: 2026-08-28
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
language: vi
scope:
  - mobile_mvp
  - epic_02
  - durable_local_data
  - user_story_breakdown
authority: PLANNING
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
timer_engine_baseline: ../specifications/timer-engine.md
session_lifecycle_baseline: ../specifications/session-lifecycle.md
pet_state_machine_baseline: ../specifications/pet-state-machine.md
gamification_baseline: ../specifications/gamification-rules.md
adr_directory: ../architecture/decisions
---

# PixelDoro Mobile MVP — EPIC-02 User Stories

## 0. Epic context và authority

**Epic:** `EPIC-02 — Durable Local Data, Migration và Safe Bootstrap`  
**Loại:** Enabler  
**MVP Priority:** `MUST`  
**Delivery Wave:** `W1_FOUNDATION`  
**Execution Order:** `02`  
**Start Gate:** `EPIC-01 DONE` — đã đạt theo `MVP_EPICS.md` 1.0.0.  
**Dependency:** `EPIC-01`.

**Epic outcome đã hiệu chỉnh để kiểm chứng được:** Ứng dụng có SQLite làm durable
source of truth duy nhất, có schema/migration/seed/bootstrap an toàn và không thực hiện
app-initiated destructive recovery hoặc để lại partial committed state khi thao tác
database thất bại.

Cụm “không mất dữ liệu khi database gặp lỗi” trong Epic baseline được hiểu trong
boundary ứng dụng có thể kiểm soát:

- Không tự xóa, reset, overwrite, normalize hoặc “repair” dữ liệu khi migration,
  checksum, invariant, read hoặc write thất bại.
- Migration và core database command phải rollback hoặc giữ nguyên durable state đã
  commit trước đó khi SQLite còn bảo đảm transaction semantics.
- UI không được hiển thị success, terminal result, reward hoặc reset result chưa commit.
- Không hứa chống mất dữ liệu do hỏng storage vật lý, OS xóa app data, uninstall hoặc
  device failure nằm ngoài control của ứng dụng.

### 0.1. Exit Gate authoritative

`EPIC-02` chỉ được đánh dấu `DONE` và mở `EPIC-03` khi có evidence chứng minh:

1. Initial migration tạo đúng toàn bộ schema normative của Data Model 1.0.0.
2. Foreign key, one-running-session, terminal immutability, conditional row shape,
   reward/purchase/ownership và singleton backstop được SQLite enforce.
3. Exact singleton/default seed và exact 12-item catalog khớp authority.
4. Forward-only migration có version/checksum, phát hiện gap/checksum mismatch/newer
   schema và rollback failed migration mà không tự xóa database.
5. Bootstrap chỉ chuyển `ready` sau open → migration → verification → hydration và
   readiness barrier hoàn tất; unsafe command bị chặn trước đó.
6. Repository/mappers không rò raw SQLite row/SQL ra Presentation và dùng cùng
   application-scoped transaction/connection owner.
7. Durable query semantics cho history, contribution, cadence, store-review facts và
   economy consistency có integration evidence, gồm onboarding-trial exclusions.
8. Database/migration/invariant failure tạo typed recovery projection có Retry; không
   auto-reset, auto-terminal hoặc auto-repair.
9. Confirmed full reset engine atomic, giữ schema/catalog hợp lệ, reseed defaults và
   không tạo partial reset khi thất bại.
10. Automated integration evidence và iOS/Android runtime evidence phù hợp đã được
    lưu; owner thực hiện native/development-build step thủ công.

### 0.2. Scope boundary với Epic sau

Tài liệu này chỉ cho phép model/port/adapter/fake/harness tối thiểu cần cho database
foundation. Cụ thể:

- `EPIC-02` sở hữu SQLite connection, transaction implementation, schema, migration,
  seed, mapper, repository, persistence-level query, bootstrap/readiness, database
  recovery và reset engine.
- `EPIC-03` sở hữu Domain/Application behavior để start/cancel/reconcile/resolve
  Focus/Break và automatic reward grant. `EPIC-02` chỉ cung cấp persistence contract,
  constraint và test fixture; không tạo production Timer/Session use case.
- `EPIC-04` sở hữu Pet projection/animation. `EPIC-02` không persist Pet state hoặc
  animation receipt.
- `EPIC-07` sở hữu product behavior chọn/start Short/Long Break. `EPIC-02` chỉ cung
  cấp durable query facts/cadence read model đã được baseline yêu cầu.
- `EPIC-08` sở hữu Product/Application purchase/equip flow. `EPIC-02` chỉ cung cấp
  schema, transaction/repository primitive và database backstop.
- `EPIC-09` sở hữu History/Contribution UI và contribution colors. `EPIC-02` chỉ cung
  cấp query semantics; không chốt `OPEN-006`.
- `EPIC-10` sở hữu Settings/reset warning, confirmation UX và user-facing data-control
  flow. `EPIC-02` sở hữu confirmed reset executor; không thêm Settings flow sớm.
- `EPIC-11` sở hữu PostHog delivery, final analytics allowlist, feedback và native
  store-review orchestration. `EPIC-02` chỉ sở hữu bounded queue/attempt persistence
  và durable query facts được Data Model giao.

Không có production code của `EPIC-02` được triển khai trong lượt tạo tài liệu này.

## 1. Review findings

### 1.1. Outcome, dependency và gate

| Hạng mục | Finding | Kết luận planning |
|---|---|---|
| Outcome | Hướng đúng nhưng “không mất dữ liệu” quá tuyệt đối nếu không giới hạn failure domain. | Dùng outcome kiểm chứng được ở mục 0: no automatic destructive recovery và no partial committed state. |
| Dependency | `EPIC-02` chỉ phụ thuộc `EPIC-01`; toolchain/composition/test foundation đã có. | Start gate đã đạt. |
| Start Gate | `MVP_EPICS.md` 1.0.0 ghi `EPIC-01 DONE`. | Cho phép refine và bắt đầu `US-02-01` sau khi breakdown được owner duyệt. |
| Exit Gate | Baseline có checklist đúng nhưng chưa gắn từng criterion với Story/evidence. | Mục 2, 4 và 5 của tài liệu này tạo mapping authoritative. |
| Device evidence | Data Model yêu cầu iOS/Android evidence nhưng lượt planning không được chạy native/EAS build. | `US-02-09` giữ gate này; owner chạy thủ công khi implementation hoàn tất. |

### 1.2. Mâu thuẫn/ambiguity đã được phân giải trong planning

| ID | Finding | Cách xử lý, không thay Product truth |
|---|---|---|
| `REVIEW-02-01` | “Startup migration + reconciliation barrier” có thể bị hiểu là kéo session reconciliation vào Epic 2. | Epic 2 dựng readiness order và injectable startup-reconciliation boundary/fake để chứng minh không thể bypass; terminal decision/reward behavior chỉ bắt đầu ở Epic 3. |
| `REVIEW-02-02` | Full reset xuất hiện ở cả Epic 2 và Epic 10. | Epic 2: atomic executor, barrier, rollback và post-reset bootstrap. Epic 10: warning/confirmation UX và Settings entry. Recovery không tự gọi reset. |
| `REVIEW-02-03` | Data Model chứa schema cho analytics/store review trong khi provider behavior thuộc Epic 11. | Epic 2 triển khai schema, bounded persistence và query facts; không gọi provider/native review, không khóa event taxonomy ngoài approved fields. |
| `REVIEW-02-04` | Data Model mô tả transaction reward/purchase nhưng implementation behavior thuộc Epic 3/8. | Epic 2 enforce constraint, transaction-scoped repository primitives và fault/race fixtures; không tạo production `CompleteFocus`/`PurchaseItem` use case hoặc tự tính Product decision mới. |
| `REVIEW-02-05` | Product Core §14 có sketch `PetProfile` chứa name/type/stage, nhưng các decision tương ứng còn `OPEN`/`DEFERRED`. | Data Model 1.0.0 là normative schema detail: chỉ `total_xp`/`coin_balance`; không thêm Pet species/name/stage/skin. |
| `REVIEW-02-06` | “Migration rollback” có thể bị hiểu là hỗ trợ downgrade. | Chỉ rollback transaction của migration thất bại. Không automatic downgrade; binary cũ gặp schema mới phải fail safely. |

### 1.3. Acceptance/scope gaps cần đóng bằng Story

- Baseline chưa chỉ rõ canonical checksum input và cách chứng minh migration file bất biến.
- Baseline chưa chọn authoritative runtime strategy cho integration test `expo-sqlite`;
  không nên âm thầm thêm database driver thứ hai chỉ để test.
- Ledger immutable nhưng confirmed reset/migration vẫn cần delete có chủ đích; cần khóa
  enforcement mechanism để test không vô tình làm reset bất khả thi.
- Current repository chỉ có synchronous foundation bootstrap và generic
  `FOUNDATION_BOOT_FAILED`; chưa có SQLite dependency, async database readiness,
  phase-specific typed error hoặc Retry.
- Evidence cần tách rõ host deterministic tests, Expo runtime integration tests và
  owner-run iOS/Android device evidence.

Không finding nào yêu cầu chốt `OPEN-001`, `OPEN-006` hoặc `OPEN-009` để bắt đầu
`US-02-01`.

## 2. Priority, dependency và execution order

### 2.1. Ba khái niệm không được trộn lẫn

| Thuộc tính | Ý nghĩa trong EPIC-02 |
|---|---|
| `MUST` | Story bắt buộc để đạt Epic exit gate. Cả chín Story đều `MUST`; không phải nhãn sequencing. |
| `Dependency Priority` | Nhóm rủi ro phải khóa trước nhóm sau: `P0_CORRECTNESS`, `P1_DURABILITY`, `P2_RECOVERY`, `P3_EVIDENCE`. |
| `Execution Order` | Thứ tự authoritative cho solo developer; chỉ một Story active tại một thời điểm. |

### 2.2. Story overview

| Order | Story | MVP Priority | Dependency Priority | Dependencies | Blocks | Outcome độc lập |
|---:|---|---|---|---|---|---|
| `01` | `US-02-01` — SQLite Ownership và Transactional Kernel | `MUST` | `P0_CORRECTNESS` | `EPIC-01` | `US-02-02` | Một application-scoped SQLite owner và transaction boundary commit/rollback kiểm chứng được. |
| `02` | `US-02-02` — Normative Schema, Constraints và Exact Seed | `MUST` | `P0_CORRECTNESS` | `US-02-01` | `US-02-03` | Empty database nhận đúng schema/invariant/seed normative, chưa cần product use case. |
| `03` | `US-02-03` — Forward-only Migration Safety | `MUST` | `P0_CORRECTNESS` | `US-02-02` | `US-02-04` | Migration history phát hiện drift/gap/newer schema và rollback failure an toàn. |
| `04` | `US-02-04` — Safe Bootstrap và Readiness Barrier | `MUST` | `P1_DURABILITY` | `US-02-03` | `US-02-05`, `US-02-07` | App chỉ ready sau DB migrate/verify/hydrate; future core command không thể bypass barrier. |
| `05` | `US-02-05` — Typed Repository và Mapper Integration | `MUST` | `P1_DURABILITY` | `US-02-04` | `US-02-06` | Mọi durable entity có typed Application port/SQLite adapter không rò SQL/raw row. |
| `06` | `US-02-06` — Derived Queries và Consistency Evidence | `MUST` | `P1_DURABILITY` | `US-02-05` | `US-02-07`, `US-02-08` | Query facts/exclusions/consistency và bounded metadata persistence đúng durable truth. |
| `07` | `US-02-07` — Failure Recovery và Retry | `MUST` | `P2_RECOVERY` | `US-02-04`, `US-02-06` | DB/migration/invariant failure giữ dữ liệu, block command và Retry an toàn. |
| `08` | `US-02-08` — Atomic Confirmed Full Reset | `MUST` | `P2_RECOVERY` | `US-02-07` | `US-02-09` | Confirmed reset atomically clear/reseed product data, giữ schema/catalog và rebootstrap. |
| `09` | `US-02-09` — Cross-platform Evidence và Epic Exit Audit | `MUST` | `P3_EVIDENCE` | `US-02-01` → `US-02-08` | `EPIC-03` | Automated + iOS/Android evidence chứng minh Epic exit gate; không có native artifact trong repo. |

### 2.3. Authoritative execution graph

```text
US-02-01 SQLite Ownership / Transaction Kernel
    ↓ correctness owner
US-02-02 Normative Schema / Constraints / Seed
    ↓ schema contract frozen
US-02-03 Forward-only Migration Safety
    ↓ database can be opened/upgraded safely
US-02-04 Bootstrap / Verification / Hydration / Readiness
    ↓ durable foundation becomes consumable
US-02-05 Typed Repositories / Mappers
    ↓ all persistence surfaces integrated
US-02-06 Derived Queries / Consistency / Metadata
    ↓ durable read facts and retention semantics verified
US-02-07 Typed Recovery / Retry
    ↓ failure path proven non-destructive
US-02-08 Confirmed Full Reset
    ↓ last-resort destructive path proven atomic
US-02-09 iOS + Android Evidence / Exit Audit
    ↓
EPIC-02 DONE → EPIC-03 may start
```

Không reorder `US-02-05` lên trước schema/migration/bootstrap để “làm repository song
song”: việc đó tạo adapter trên contract chưa được enforce và tăng rework. Không đưa
device audit lên sớm thay cho integration evidence; device evidence xác nhận cùng
contract sau khi foundation đã hoàn chỉnh.

## 3. Technical inputs cần owner xác nhận

Các input này là technical implementation decision, không phải Product decision
`OPEN`. Chúng không block review Story breakdown hoặc việc bắt đầu analysis/task của
`US-02-01`, nhưng phải được resolve trước acceptance của Story ghi trong bảng.

| ID | Input cần resolve | Recommendation hiện tại | Story gate | Owner |
|---|---|---|---|---|
| `EPIC02-INPUT-01` | `RESOLVED 2026-08-27` — authoritative strategy để chạy exact `expo-sqlite` migration/repository integration tests ngoài/ trong app runtime. | Dùng host unit tests với fake transaction/driver cho orchestration và Expo runtime integration harness cho exact SQLite behavior; không thêm SQLite driver thứ hai nếu chưa có compatibility need được chứng minh. | Đã đạt cho `US-02-01`; device half được audit ở `US-02-09`. | Dũng Lư — Tech Lead |
| `EPIC02-INPUT-02` | Canonical checksum input/algorithm cho immutable migration artifact. | Dùng deterministic SHA-256 trên canonical migration descriptor/SQL payload được commit; test recompute checksum và fail khi released payload bị sửa. Không checksum runtime-transpiled bundle hoặc timestamp biến đổi. | Trước khi đóng `US-02-03`. | Dũng Lư — Tech Lead |
| `EPIC02-INPUT-03` | `RESOLVED 2026-08-28` — enforce immutable reward/purchase receipt trong normal path nhưng vẫn cho confirmed reset/approved migration delete theo explicit order. | Trigger chặn `UPDATE`; normal repository không expose update/delete; chỉ private maintenance executor hoặc approved migration có delete path. Không thêm durable bypass flag/table. | Đã đạt cho `US-02-02`; resolution là baseline cho `US-02-08`. | Dũng Lư — Tech Lead |

Exact database filename, adapter class name, test command name và typed error-code
spelling là Task-level configuration. Chúng phải ổn định/test được nhưng không cần
Product Owner decision nếu không làm đổi behavior trong baseline.

**Resolution update — 2026-08-27:** `EPIC02-INPUT-01` đã `RESOLVED` bởi Dũng Lư —
Tech Lead/Product Owner. `US-02-01` dùng host unit/contract tests với fake cho orchestration
và exact Expo native runtime probe cho SQLite behavior; không thêm SQLite driver thứ hai.
Probe chạy trên native platform có development build khả dụng trước, còn both-platform audit
vẫn thuộc `US-02-09`. Chi tiết authoritative nằm trong
[`US-02-01_IMPLEMENTATION_PLAN.md`](./US-02-01_IMPLEMENTATION_PLAN.md).

## 4. User Stories

### US-02-01 — SQLite Ownership và Transactional Kernel

**Implementation status:** `DONE` — host evidence và exact iOS runtime probe pass trên
commit `a75ecc9112c2aa279bee9a818d9c97e586b84b21` ngày 2026-08-28. Dependency gate cho
`US-02-02` đã mở; both-platform repeat vẫn thuộc `US-02-09`.

**Story statement**

> Với vai trò solo developer, tôi muốn một SQLite connection và transaction boundary
> có owner duy nhất để mọi durable adapter sau này dùng cùng foreign-key/atomicity
> contract và không mở database từ screen hoặc use case.

**Outcome:** Mobile composition graph có thể open/dispose một database application-scoped,
bật foreign keys trước repository access và chứng minh commit/rollback qua
Application-owned transaction port mà không cần Timer/Session behavior.

**Dependencies:** `EPIC-01 DONE`; `EPIC02-INPUT-01` phải resolve trước Story acceptance.

**In scope:**

- Cài `expo-sqlite` bằng compatible Expo install flow và commit lockfile change.
- Database connection owner/factory trong mobile Infrastructure.
- Application-owned transaction abstraction không rò SQLite/native type.
- Application-scoped lifecycle, open/close/dispose và single-owner wiring ở composition root.
- `PRAGMA foreign_keys = ON` trước mọi repository access và verification tương ứng.
- Parameter binding boundary và short transaction contract; support write transaction
  semantics cần cho `BEGIN IMMEDIATE` hoặc equivalent đã review.
- Fake/test double tối thiểu cho host unit test.

**Out of scope:** Schema table, migration 001, Session coordinator, reward formula,
purchase use case, Zustand persistence, provider SDK và database connection từ screen.

**Acceptance criteria:**

- [x] `expo-sqlite` version tương thích Expo SDK 57 được cài theo baseline và lockfile được cập nhật.
- [x] Chỉ composition/database owner khởi tạo concrete SQLite connection; route, Presentation và shared Domain không import database driver.
- [x] Một mobile application graph dùng một application-scoped connection/transaction implementation và dispose idempotently.
- [x] Foreign key được bật và kiểm tra trên connection trước khi tạo/cho phép repository access.
- [x] Transaction port commit toàn bộ write khi callback thành công.
- [x] Transaction port rollback toàn bộ write khi callback throw/trả failure theo contract.
- [x] Nested/overlapping transaction behavior được định nghĩa rõ hoặc bị reject typed; không silently auto-commit.
- [x] Provider/platform side effect không thể được gọi bên trong database transaction abstraction.
- [x] SQL value đi qua parameter binding; API không khuyến khích ghép raw input vào SQL.
- [x] Open, transaction và close failure được map sang application-owned technical error, không rò raw provider exception ra Presentation.
- [x] Architecture boundary checks hiện có vẫn pass.

**Task checklist sơ bộ:**

- [x] Resolve `EPIC02-INPUT-01` và ghi test-runtime rationale.
- [x] Cài compatible SQLite dependency.
- [x] Định nghĩa transaction/database lifecycle port contract.
- [x] Implement SQLite connection/transaction owner.
- [x] Wire owner tại `create-mobile-application` hoặc equivalent.
- [x] Thêm commit/rollback/FK/dispose contract tests.
- [x] Cập nhật boundary rule nếu concrete driver có thể bị import sai layer.

**Evidence yêu cầu:**

- Dependency/lockfile diff và Expo compatibility check.
- Transaction commit/rollback integration output.
- Foreign-key enforcement output trên exact runtime strategy đã duyệt.
- Composition test chứng minh một owner, boot/dispose lặp an toàn.
- Boundary test chứng minh Presentation/route không import SQLite.

**References:** Technical Overview §3.1, §4.1, §5.1, §10.1; System Architecture
§2.2–2.4, §5, §6.1; Project Structure §4.1–4.2, §5, §7; ADR-003, ADR-004;
Data Model §2.3, §7.

---

### US-02-02 — Normative Schema, Constraints và Exact Seed

**Implementation plan:**
[`US-02-02_IMPLEMENTATION_PLAN.md`](./US-02-02_IMPLEMENTATION_PLAN.md) `1.2.0`
`DONE`; host checks và exact iOS native probe pass trên commit
`4996c7d6529d0a1578e2d052bdbaaf858d9e1a1d`.
`EPIC02-INPUT-03` và
`US0202-CONFIRM-01` đến `03` đều đã được owner duyệt.

**Story statement**

> Với vai trò solo developer, tôi muốn database tự enforce durable invariants và seed
> chính xác để dữ liệu sai không thể được hợp thức hóa chỉ bởi UI hoặc in-memory state.

**Outcome:** Một empty database có thể nhận initial schema artifact tạo đúng toàn bộ
table, field, enum, FK, check, unique, index, trigger và seed của Data Model 1.0.0;
negative writes bị SQLite reject độc lập với Product use case.

**Dependencies:** `US-02-01`; `EPIC02-INPUT-03` phải resolve trước Story acceptance.

**In scope:**

- Initial migration artifact theo naming/location của Project Structure/Data Model.
- Toàn bộ table normative: `app_installation`, `app_settings`, `pet_profiles`,
  `sessions`, `reward_transactions`, `catalog_items`, `purchase_transactions`,
  `owned_items`, `store_review_attempts`, `analytics_events`, `schema_migrations`.
- Field datatype/null/default/check, PK/FK/unique/composite FK, required indexes và triggers.
- Partial unique index bảo vệ một `running` session.
- Terminal/identity immutability và reward/purchase/owned-item consistency backstop.
- Initial singleton seed và exact 12-item catalog seed.
- Deterministic schema inspection/negative-write integration fixtures.

**Out of scope:** Start/resolve/purchase/equip production use case, Pet species/name/stage,
contribution colors, dynamic catalog, cloud/sync field và future nullable placeholder.

**Acceptance criteria:**

- [x] Initial artifact tạo đúng 11 table normative và mọi column/null/default/check rule trong Data Model §4.
- [x] Mọi product foreign key dùng `ON DELETE RESTRICT`; foreign-key check trả không có violation trên valid seed.
- [x] Session chỉ chấp nhận four statuses và conditional shape đúng cho standard Focus, onboarding trial, Short Break và Long Break.
- [x] Onboarding trial bắt buộc duration `5`, `mode = relax`, `work_tag IS NULL`, không có Strict evidence/failure shape.
- [x] Break bắt buộc mode/tag/focus variant/background evidence `NULL`, duration đúng type và không nhận reward fields.
- [x] Partial unique index reject running session thứ hai trên cùng local database.
- [x] Terminal status/immutable identity fields không thể bị update trái invariant.
- [x] Reward row chỉ hợp lệ cho completed Focus, unique theo `session_id`, delta/reason khớp session và không update trong normal path.
- [x] Purchase/ownership composite constraint ngăn receipt khác profile/item; balance/receipt semantics có database backstop phù hợp baseline.
- [x] Singleton installation/settings/profile chỉ cho `id = 1`.
- [x] Settings seed là duration `25`, Short `5`, Long `15`, mode `relax`; sound/haptic/notification preference/analytics đều `1`.
- [x] Profile seed có `total_xp = 0`, `coin_balance = 0`.
- [x] Catalog có đúng 12 row với exact ID/display name/category/price và không seed owned item.
- [x] Không có Pet species/name/stage/skin, `paused`, Pet visual state, contribution color, cloud ID/sync revision hoặc feature `DEFERRED`.
- [x] Required index/trigger set trong Data Model §5 tồn tại và được behavior test, không chỉ snapshot tên.
- [x] Seed timestamp đi qua deterministic/injected application clock contract; không dùng SQLite `CURRENT_TIMESTAMP` làm timestamp product.

**Task checklist sơ bộ:**

- [x] Resolve immutable-ledger reset enforcement theo `EPIC02-INPUT-03`.
- [x] Tạo migration `001` và canonical schema descriptor.
- [x] Implement table/check/FK/unique/index/trigger theo Data Model.
- [x] Implement singleton và catalog seed.
- [x] Tạo valid fixture cho từng entity shape.
- [x] Tạo negative fixture cho conditional checks, one-running, terminal mutation, reward và ownership mismatch.
- [x] Tạo normalized schema/seed verifier.

**Evidence yêu cầu:**

- `sqlite_master`/PRAGMA inspection hoặc equivalent cho table/index/trigger/FK.
- Exact seed comparison gồm count và từng field, không chỉ snapshot tổng quát.
- Negative-write integration matrix với expected constraint/trigger failure.
- Review diff chứng minh không có field từ Product `OPEN`/`DEFERRED`.

**References:** Product Core §5–9, §14, §20; Data Model §1–5, §8.2,
§14.1–14.4; Timer Engine §2–3; Session Lifecycle §2–5; Gamification Rules
§2–8.

---

### US-02-03 — Forward-only Migration Safety

**Implementation plan:**
[`US-02-03_IMPLEMENTATION_PLAN.md`](./US-02-03_IMPLEMENTATION_PLAN.md) `0.1.0` đang
`READY_FOR_REVIEW`; implementation `NOT_STARTED`. `EPIC02-INPUT-02` cùng
`US0203-CONFIRM-01`–`03` vẫn chờ owner duyệt trước khi chuyển
`READY_FOR_IMPLEMENTATION`.

**Story statement**

> Với vai trò solo developer, tôi muốn migration history được kiểm tra trước khi
> repository chạy để app không mở một schema drift, thiếu version hoặc mới hơn binary
> rồi thực hiện unsafe read/write.

**Outcome:** Migration runner forward-only apply pending version theo thứ tự, ghi history
chỉ sau success và fail safely khi checksum/gap/newer schema/migration execution không
hợp lệ, không tự downgrade hoặc xóa dữ liệu.

**Dependencies:** `US-02-02`; `EPIC02-INPUT-02` phải resolve trước Story acceptance.

**In scope:**

- Ordered migration registry/descriptors và immutable version/name/checksum metadata.
- Initial database → latest và released-version fixture → latest.
- Version gap, duplicate version/name, checksum mismatch và newer-schema detection.
- Transactional DDL/data backfill/validation khi SQLite operation cho phép.
- History write sau migration validation thành công.
- Typed migration result/error cho bootstrap/recovery.
- Retry same database sau failed migration.

**Out of scope:** Automatic downgrade, remote migration, destructive re-create, real
future product schema, OTA compatibility policy ngoài existing release baseline.

**Acceptance criteria:**

- [ ] Migration filename/registry version strictly increasing và stable theo Data Model naming.
- [ ] Empty database apply `001` rồi ghi đúng một `schema_migrations` row sau full success.
- [ ] Database đã ở latest không reapply seed/schema và bootstrap lặp idempotent.
- [ ] Pending migrations apply theo version order; mỗi row history chỉ ghi sau DDL/backfill/validation success.
- [ ] Canonical checksum contract theo `EPIC02-INPUT-02` deterministic và mismatch của released artifact bị phát hiện trước repository access.
- [ ] Version gap, duplicate version/name hoặc unknown applied migration fail typed và không chạy phần còn lại.
- [ ] Binary biết latest thấp hơn database fail safely; không downgrade hoặc query/write incompatible schema.
- [ ] Failure giữa migration rollback toàn bộ transactional change và không ghi applied row giả.
- [ ] Retry sau failure bắt đầu từ durable history còn hợp lệ, không duplicate seed hoặc mất existing rows.
- [ ] Migration failure không gọi reset/delete/recreate database.
- [ ] Synthetic migration fixture chứng minh upgrade path mà không thêm production feature/schema ngoài baseline.
- [ ] Released migration artifact được kiểm tra immutability trong repository quality gate hoặc equivalent review evidence.

**Task checklist sơ bộ:**

- [ ] Resolve checksum input/algorithm.
- [ ] Implement migration descriptor/registry.
- [ ] Implement history inspection và compatibility validation.
- [ ] Implement ordered apply + transactional history write.
- [ ] Implement gap/checksum/newer-schema typed errors.
- [ ] Tạo synthetic upgrade/failure fixtures.
- [ ] Thêm immutable-artifact repository check.

**Evidence yêu cầu:**

- Empty → latest và synthetic prior → latest outputs.
- Checksum drift, version gap, duplicate và newer-schema expected-failure outputs.
- Before/after row/schema comparison chứng minh rollback/retention.
- Re-run output chứng minh idempotency và không duplicate catalog/singleton.

**References:** Technical Overview §10.1; Data Model §4.11, §8, §11
`DM-EDGE-017`–`019`, §13, §14.6; ADR-003, ADR-007.

---

### US-02-04 — Safe Bootstrap và Readiness Barrier

**Story statement**

> Với vai trò người dùng, tôi muốn ứng dụng chỉ cho dùng core flow sau khi local data
> đã mở, migrate, verify và hydrate an toàn để không có command chạy trên schema hoặc
> projection chưa sẵn sàng.

**Outcome:** Composition root chạy async bootstrap theo ordered barrier; Presentation
chỉ nhận `ready` từ committed durable projection sau database verification và không
thể gửi future core mutation trong lúc boot/recovery.

**Dependencies:** `US-02-03`.

**In scope:**

- Refactor foundation bootstrap placeholder thành asynchronous database bootstrap.
- Ordered phases: connection/FK → migration → schema/seed/invariant verification →
  minimal hydration → startup-reconciliation boundary → readiness.
- Minimal installation/settings/profile/catalog read adapters cần cho bootstrap.
- Single-flight/idempotent boot và application-scoped lifecycle subscription ownership.
- Typed bootstrap projection đủ phân biệt booting/ready/recovery và failure phase.
- Injectable startup-reconciliation boundary/fake để chứng minh order; production
  Session reconciliation behavior chờ `EPIC-03`.
- Command gate/facade không expose future core mutation trước readiness.

**Out of scope:** Resolve running session, Strict precedence, reward, product navigation,
onboarding gating, persistent Zustand và provider initialization làm điều kiện ready.

**Acceptance criteria:**

- [ ] Bootstrap không chuyển `ready` trước khi connection mở, FK bật, migration và verification hoàn tất.
- [ ] Singleton/settings/profile/catalog projection hydrate từ committed SQLite rows, không từ hard-coded Zustand defaults.
- [ ] Exact catalog/singleton/schema history/invariant mismatch fail closed; bootstrap không upsert/repair ngầm.
- [ ] Startup-reconciliation boundary luôn được gọi sau migration/verification và trước readiness; fake chứng minh call order.
- [ ] Epic 2 production không resolve/complete/fail/cancel/reward session và không invent terminal truth.
- [ ] Presentation route/screen chỉ render core children ở `ready`; boot/recovery giữ command gate đóng.
- [ ] Concurrent/repeated boot dùng single-flight hoặc idempotent result, không mở nhiều connection hay đăng ký lifecycle nhiều lần.
- [ ] Dispose trong boot/ready/recovery cleanup connection/subscription an toàn.
- [ ] Side-effect/provider availability không là prerequisite cho durable readiness.
- [ ] Bootstrap result/projection không chứa raw SQLite row/error.

**Task checklist sơ bộ:**

- [ ] Định nghĩa async bootstrap phase/result contract.
- [ ] Tạo minimal bootstrap repositories/verifiers.
- [ ] Wire ordered boot pipeline trong composition root.
- [ ] Tạo readiness command gate.
- [ ] Tạo startup-reconciliation port/fake với replacement note cho Epic 3.
- [ ] Cập nhật BootstrapBoundary loading/recovery rendering tối thiểu.
- [ ] Thêm order/single-flight/dispose integration tests.

**Evidence yêu cầu:**

- Ordered call trace open → FK → migrate → verify → hydrate → reconciliation boundary → ready.
- Test chứng minh command bị reject/blocked trước ready và trong recovery.
- Projection evidence đọc exact seed từ SQLite.
- Repeated boot/dispose test không leak connection/subscription.

**References:** System Architecture §5.1–5.2, §6.6, §7; Project Structure
§4.1–4.2; Data Model §2.3, §8.1, §13 Mobile integration; Timer Engine §6.6,
§12.1 startup barrier.

---

### US-02-05 — Typed Repository và Mapper Integration

**Story statement**

> Với vai trò developer của Epic sau, tôi muốn mọi durable entity có typed
> Application-owned persistence contract và SQLite adapter để có thể xây use case mà
> không truy cập SQL/raw row hoặc nhân đôi mapping.

**Outcome:** Toàn bộ durable entity có mapper/repository adapter đúng ownership,
transaction-scoped operation và corruption/error mapping; round-trip integration
tests chứng minh adapter dùng normative schema mà chưa triển khai Product behavior.

**Dependencies:** `US-02-04`.

**In scope:**

- Application-owned repository/record/DTO contract theo capability.
- SQLite mapper/adapter cho installation, settings, profile, sessions, rewards,
  catalog, purchases, ownership, store-review attempts và analytics queue.
- Migration history tiếp tục thuộc migration infrastructure, không export như product repository.
- Transaction-scoped repository access và conditional mutation primitive cần cho Epic 3/8.
- Stable mapping/error khi row vi phạm enum, nullability, timestamp hoặc relationship expectation.
- Parameter binding và no-deep-import/public API integration.

**Out of scope:** `StartFocus`, `ReconcileActiveSession`, `PurchaseItem`, `EquipItem`,
review eligibility orchestration, PostHog delivery, Pet projection hoặc UI feature.

**Acceptance criteria:**

- [ ] Mọi product/metadata table normative có owner và adapter/maintenance boundary rõ ràng; không có orphan durable table.
- [ ] Application port không import `expo-sqlite`, SQL string, native type hoặc provider exception.
- [ ] SQL chỉ nằm trong `apps/mobile/src/infrastructure/database` theo Project Structure.
- [ ] Mapper chuyển `snake_case` row sang application-owned `camelCase` type và không rò raw row ra Presentation.
- [ ] Invalid enum/null/timestamp/boolean/relationship shape trả typed corruption/invariant error; không silently coerce, clamp hoặc normalize.
- [ ] Session repository hỗ trợ active read, insert running record và conditional transition primitive nhưng không quyết định status/reward.
- [ ] Reward/purchase receipt normal repository không expose arbitrary update/delete; maintenance boundary tuân `EPIC02-INPUT-03`.
- [ ] Transaction-scoped repository call tham gia transaction hiện tại, không tự commit riêng.
- [ ] Catalog price read là authoritative storage fact; UI-supplied price không xuất hiện trong debit primitive contract.
- [ ] Settings write primitive giữ atomic row update/range backstop; OS permission không được map thành setting truth.
- [ ] Valid round-trip fixture cho mỗi entity giữ nguyên ID/timestamp/enum/nullable value.
- [ ] Architecture/public-export/boundary tests pass.

**Task checklist sơ bộ:**

- [ ] Chia port theo capability owner, tránh generic CRUD repository.
- [ ] Tạo persistence record/mapper types.
- [ ] Implement singleton/reference/session/economy/metadata adapters.
- [ ] Implement conditional and transaction-scoped primitives.
- [ ] Add valid/corrupt round-trip fixtures.
- [ ] Export public Application contract tối thiểu.
- [ ] Wire concrete adapters tại composition root.

**Evidence yêu cầu:**

- Entity-to-port/adapter mapping table.
- Round-trip integration output cho mọi entity.
- Corrupt-row expected typed-error cases.
- Boundary output chứng minh SQL/driver không rò vào Application/Presentation.
- Review chứng minh không có generic CRUD API bypass immutable/business boundary.

**References:** System Architecture §2–5, §7; Project Structure §3–5, §7;
Data Model §3–7, §13; ADR-003, ADR-004.

---

### US-02-06 — Derived Queries và Consistency Evidence

**Story statement**

> Với vai trò các Epic History, Break, Economy và Store Review sau này, tôi muốn nhận
> durable query facts nhất quán để không tạo aggregate/counter source of truth thứ hai
> trong Zustand hoặc feature-specific storage.

**Outcome:** SQLite query adapters trả đúng history/contribution/cadence/store-review
facts, phát hiện economy mismatch không tự repair và quản lý analytics metadata theo
bounded retention; integration fixtures chứng minh exclusions/index semantics.

**Dependencies:** `US-02-05`.

**In scope:**

- Standard Focus history và contribution grouping query.
- Long Break cadence facts từ completed durable sessions.
- Store-review installation/session/active-day/attempt facts; không gọi native review.
- Economy consistency verifier giữa stored profile và immutable receipts.
- Analytics queue persistence-level cap 1.000, TTL 7 ngày, drop-oldest, retry ordering
  và payload/property bound enforcement; không tích hợp PostHog.
- Product-data retention guard: không background-prune sessions/ledger/ownership/attempts.
- Representative query-plan/index evidence khi deterministic trên selected runtime.

**Out of scope:** Contribution color threshold, History UI, StartBreak selection/use
case, review candidate/orchestration, final analytics taxonomy/provider, economy repair.

**Acceptance criteria:**

- [ ] Standard history filter bắt buộc `session_type = focus AND focus_variant = standard`.
- [ ] Contribution chỉ sum `configured_duration_minutes` của completed standard Focus và group bằng persisted `scheduled_end_local_date`.
- [ ] Failed/cancelled standard Focus có thể ở history nhưng đóng góp `0`; onboarding trial bị loại khỏi history/contribution.
- [ ] Cadence count chỉ gồm completed standard Focus sau completed Long Break gần nhất; trial/failed/cancelled bị loại.
- [ ] Cancelled Long Break không reset cadence facts; completed Long Break là reset marker.
- [ ] Store-review facts loại trial, dùng distinct persisted local-day key và không đọc/join feedback data.
- [ ] Attempt facts hỗ trợ one-per-app-version và time-window query nhưng không gọi native API hoặc suy diễn review outcome.
- [ ] `total_xp` bằng sum reward XP và `coin_balance` bằng reward Coin + purchase debit trên valid fixture.
- [ ] Economy mismatch trả typed recovery/invariant result và giữ rows; verifier không tự cộng/trừ/insert/delete để repair.
- [ ] Analytics queue không vượt 1.000 row, expired row được xóa theo TTL, full queue drop oldest side-effect row và không đụng product truth.
- [ ] Analytics payload/property bounds được enforce trước/ở persistence boundary; free text/raw database row không được queue.
- [ ] Không có background job/prune path xóa session, reward/purchase receipt, ownership hoặc store-review attempt.
- [ ] Critical query dùng required index hoặc có documented planner evidence/justification trên runtime đã duyệt.

**Task checklist sơ bộ:**

- [ ] Implement history/contribution queries.
- [ ] Implement cadence facts query.
- [ ] Implement store-review facts/attempt queries.
- [ ] Implement economy consistency verifier.
- [ ] Implement bounded analytics queue repository behavior.
- [ ] Add retention guard/tests.
- [ ] Add mixed standard/trial/status/timezone fixture matrix.

**Evidence yêu cầu:**

- Query result tables trên mixed fixture chứng minh mọi exclusion.
- Timezone-change fixture giữ original `scheduled_end_local_date` grouping.
- Economy valid/mismatch outputs và before/after no-repair comparison.
- Queue cap/TTL/drop-oldest/retry ordering/payload rejection outputs.
- Retention test chứng minh chỉ analytics queue bị bounded cleanup.

**References:** Product Core §5.2, §9, §10.5, §12; Data Model §5.2,
§6, §9.1, §11 `DM-EDGE-020`–`027`, §13–14; ADR-006, ADR-008.

---

### US-02-07 — Failure Recovery và Retry

**Story statement**

> Với vai trò người dùng, tôi muốn app giữ dữ liệu và cho thử lại khi database,
> migration hoặc invariant không an toàn để một lỗi kỹ thuật không tự biến thành mất
> history/economy hoặc kết quả session giả.

**Outcome:** Fault injection ở open/migrate/verify/hydrate/read/write đưa app vào typed
recovery projection, giữ readiness gate đóng và Retry cùng database an toàn; không có
automatic reset/reseed/repair/terminal mutation.

**Dependencies:** `US-02-04`, `US-02-06`.

**In scope:**

- Application-owned error categories cho database open, unavailable/read/write,
  migration history/checksum/gap/newer schema/execution và invariant/seed/economy mismatch.
- Recovery projection với actionable Retry; sanitized technical diagnostics.
- Retry single-flight, re-run safe bootstrap stage theo durable state còn lại.
- Command blocking trong recovery.
- Fault injection matrix và no-destructive-side-effect assertions.
- Corrupt active-session/storage fact được surface cho `EPIC-03`; không resolve ở Epic 2.

**Out of scope:** Product-specific corrupt-session cancel, terminal reconciliation,
automatic repair migration, cloud restore, Settings full reset confirmation UI.

**Acceptance criteria:**

- [ ] Open/read/write/migration/checksum/gap/newer-schema/seed/invariant/economy failure map sang stable typed category; raw exception/message không rò ra UI.
- [ ] Recovery projection là Application/UI state, không persist như session status hoặc database row.
- [ ] Recovery screen có Retry action khả dụng/accessibility label; không chỉ hiện error code dead-end.
- [ ] Trong recovery, readiness gate chặn mọi future core mutation và giữ last safe projection hoặc explicit unavailable state.
- [ ] Không failure path nào tự delete/recreate database, reset singleton, overwrite catalog, repair balance/ledger hoặc terminal/reward session.
- [ ] Retry dùng cùng durable database, re-inspect history và chỉ chuyển ready sau toàn bộ barrier pass.
- [ ] Concurrent Retry coalesce/serialize; không mở nhiều connection hoặc apply migration trùng.
- [ ] Failure sau partial uncommitted write chứng minh rollback/no committed half-state theo transaction contract.
- [ ] Failure diagnostic được sanitize, không log raw session payload, Pet name, feedback text hoặc database dump.
- [ ] Reset executor của `US-02-08` không được tự gọi từ recovery; chỉ có thể xuất hiện sau external explicit confirmation flow ở Epic 10.

**Task checklist sơ bộ:**

- [ ] Define typed database/migration/recovery errors và UI mapping contract.
- [ ] Add Retry command vào bootstrap facade/projection.
- [ ] Implement command gate behavior trong recovery.
- [ ] Add fault injectors cho từng bootstrap/transaction phase.
- [ ] Add sanitized diagnostic policy/tests.
- [ ] Add no-reset/no-repair/no-terminal assertions.

**Evidence yêu cầu:**

- Fault matrix: injected phase → typed error → persisted rows before/after → Retry result.
- UI/integration evidence cho loading/recovery/Retry/ready state.
- Command rejection evidence trong recovery.
- Sanitized-log assertion.

**References:** Product Core §7.7; Technical Overview §10.1; System Architecture
§5.2, §7.2; Data Model §1.14, §6.1, §8.1, §11, §14.6; Timer Engine §10.2.

---

### US-02-08 — Atomic Confirmed Full Local-data Reset

**Story statement**

> Với vai trò người dùng đã xác nhận rõ ràng, tôi muốn xóa toàn bộ dữ liệu local trong
> một thao tác nguyên tử để app trở về trạng thái cài mới hợp lệ mà không để lại XP,
> Coin, history hoặc inventory reset dở dang.

**Outcome:** Một confirmed-reset executor không được expose từ current UI có thể block
core command, clear/reseed đúng product rows trong một transaction, giữ schema/migration
history/exact catalog và rebootstrap; failure rollback và không báo success giả.

**Dependencies:** `US-02-07`; `EPIC02-INPUT-03` đã resolve.

**In scope:**

- Application reset barrier/executor chỉ nhận invocation sau external confirmation boundary.
- Best-effort notification cleanup port cho known active session; fake/no-op tối thiểu
  được phép cho tới notification capability owner.
- Explicit delete order và atomic reseed theo Data Model §9.2.
- Preserve `schema_migrations`, normative schema và exact approved catalog.
- New install/settings/profile state, analytics queue clear, store-review attempts clear,
  anonymous ID rotate/create theo reset/opt-in policy.
- Clear in-memory projection và re-run bootstrap sau commit.
- Failure/kill/retry integration evidence.

**Out of scope:** Settings entry, warning/copy/modal, partial XP/history/inventory reset,
account/server deletion, cloud backup/restore và provider-specific analytics cleanup.

**Acceptance criteria:**

- [ ] Không route/screen/recovery path hiện tại tự gọi reset executor; Epic 10 phải cung cấp explicit warning/confirmation UX trước invocation.
- [ ] Reset barrier block core commands trước cleanup/transaction và release đúng sau failure hoặc post-reset rebootstrap.
- [ ] Notification cleanup là best-effort trước transaction; failure không ngăn một otherwise-valid confirmed reset.
- [ ] Một transaction xóa analytics queue, owned items, purchases, rewards, sessions và store-review attempts theo safe explicit order.
- [ ] Settings/profile/installation được reset/reseed đúng initial defaults với injected `now`; anonymous analytics identity được rotate/create theo approved policy.
- [ ] `schema_migrations`, tables/indexes/triggers và exact 12-item catalog vẫn hợp lệ sau reset.
- [ ] Reset success clear/rebuild projection từ new durable state; không giữ stale XP/Coin/session/ownership trong memory.
- [ ] Transaction failure/kill trước commit giữ toàn bộ pre-reset product data và không render success.
- [ ] Retry sau committed reset không tạo duplicate singleton/catalog hoặc resurrect product rows cũ.
- [ ] Không có partial reset API cho XP, Coin, inventory, session history hoặc progression.
- [ ] Normal receipt repository vẫn immutable; chỉ private confirmed-reset/approved-migration maintenance path có delete authority theo `EPIC02-INPUT-03`.

**Task checklist sơ bộ:**

- [ ] Define reset barrier và private executor contract.
- [ ] Implement notification cleanup port/fake boundary.
- [ ] Implement ordered reset transaction/reseed.
- [ ] Implement post-commit projection clear + rebootstrap.
- [ ] Add rollback/kill/retry fixtures.
- [ ] Add schema/catalog/post-reset verifier.
- [ ] Document Epic 10 confirmation integration contract.

**Evidence yêu cầu:**

- Before/after table-count/value report cho successful reset.
- Injected mid-reset failure chứng minh all-or-nothing rollback.
- Post-reset bootstrap output với exact defaults/catalog và zero product history/economy.
- Test chứng minh recovery không auto-invoke reset và normal repositories không delete ledger.

**References:** Product Core §7.7, §14.2, §19; Data Model §7.8, §9.2,
§11 `DM-EDGE-021`–`022`, §13 Reset integration, §14.6; `MVP_EPICS.md`
EPIC-02/EPIC-10 boundary.

---

### US-02-09 — Cross-platform Evidence và Epic Exit Audit

**Story statement**

> Với vai trò solo developer, tôi muốn bằng chứng tự động và runtime trên iOS/Android
> cho durable foundation để chỉ mở Timer/Session implementation khi migration,
> bootstrap, persistence, recovery và reset thực sự hoạt động trên target platform.

**Outcome:** Một evidence record trace mọi Epic criterion tới automated run hoặc
owner-run iOS/Android scenario; repository quality pass và không có known blocker trong
durable-data/bootstrap outcome.

**Dependencies:** `US-02-01` đến `US-02-08` hoàn tất.

**In scope:**

- Root quality/typecheck/lint/boundary/unit/integration checks liên quan.
- Exact Expo SQLite runtime integration harness.
- iOS và Android development-build/device/simulator evidence do owner chạy thủ công.
- Persistence qua app restart/relaunch, empty → latest migration, recovery Retry và reset.
- Constraint/failure smoke scenarios có rủi ro platform-specific.
- Consolidated `EPIC-02_IMPLEMENTATION_EVIDENCE.md` hoặc equivalent review record.
- Epic exit audit và handoff contract cho `EPIC-03`.

**Out of scope:** EAS/native build trong lượt planning hiện tại, Timer/Session device
behavior, closed-beta artifact, PostHog/provider delivery và full `EPIC-12` matrix.

**Acceptance criteria:**

- [ ] Root quality/test/boundary commands pass với exact committed dependency graph.
- [ ] Automated matrix cover empty DB, latest DB, synthetic upgrade, checksum/gap/newer schema, migration rollback và repeated bootstrap.
- [ ] Automated constraint matrix cover FK, singleton, conditional session shape, one-running, terminal/identity immutability, reward/purchase/ownership backstop.
- [ ] Automated repository/query matrix cover every durable entity, trial exclusions, local-day grouping, cadence/review facts, economy consistency và analytics queue bounds.
- [ ] Automated recovery/reset matrix chứng minh no automatic destruction, Retry và atomic reset rollback/success.
- [ ] iOS target mở app, migrate/bootstrap ready, persist/reopen data và confirmed-reset harness theo scenario đã duyệt.
- [ ] Android target chạy cùng scenario và kết quả tương đương về durable truth.
- [ ] Write/disk/database-unavailable failure được kiểm thử trên runtime nơi khả thi; limitation không deterministic được ghi rõ, không giả evidence.
- [ ] Native dependency change dẫn tới development-build refresh do owner thực hiện; không commit generated native build artifact/credential.
- [ ] Không có `OPEN-001`, `OPEN-006`, `OPEN-009` hoặc feature `DEFERRED` trong schema/evidence fixture.
- [ ] Evidence record map đủ toàn bộ EPIC-02 completion checklist và không dùng documentation approval thay implementation evidence.
- [ ] Không còn known blocker khiến migration/bootstrap unsafe; `EPIC-03` chỉ được mở sau owner review exit audit.

**Task checklist sơ bộ:**

- [ ] Consolidate automated test matrix và stable commands.
- [ ] Prepare non-destructive iOS/Android scenario checklist.
- [ ] Owner refresh development build sau SQLite native dependency change.
- [ ] Owner chạy iOS evidence.
- [ ] Owner chạy Android evidence.
- [ ] Record artifact references/output/screenshots cần thiết, không commit secret/binary.
- [ ] Create implementation evidence record và traceability audit.
- [ ] Review Epic exit gate; chỉ sau đó cập nhật planning status.

**Evidence yêu cầu:**

- Automated command outputs/CI references.
- iOS và Android target/build/runtime identification cùng scenario result.
- Migration/recovery/reset before/after evidence.
- Consolidated criterion-to-evidence table.
- Repository status chứng minh không có native artifact/credential ngoài policy.

**References:** Technical Overview §10.4–10.5; Data Model §13–15;
Project Structure §7; ADR-001, ADR-003, ADR-007; `MVP_EPICS.md` §8 Definition
of Epic Done.

## 5. EPIC-02 traceability

| EPIC-02 completion criterion | Story owner |
|---|---|
| Initial migration tạo đúng toàn bộ schema normative | `US-02-02`, `US-02-03`, `US-02-09` |
| Foreign key, one-running và terminal immutability được enforce | `US-02-01`, `US-02-02`, `US-02-09` |
| Exact 12-item catalog | `US-02-02`, `US-02-04`, `US-02-09` |
| Settings seed `relax`; sound/haptic/notification/analytics = `1` | `US-02-02`, `US-02-08` |
| Không có Pet species/name/stage hoặc deferred field | `US-02-02`, `US-02-09` |
| Version/checksum/gap detection/rollback behavior | `US-02-03`, `US-02-07`, `US-02-09` |
| Migration/bootstrap failure giữ dữ liệu và chặn unsafe command | `US-02-04`, `US-02-07` |
| Database recovery có Retry, không auto reset/repair | `US-02-07` |
| Full reset explicit-confirmation boundary, atomic, schema/catalog valid | `US-02-08` |
| Product history/ledger/ownership không background-prune | `US-02-06`, `US-02-09` |
| Repository/mappers/transaction boundary đúng architecture | `US-02-01`, `US-02-05` |
| Durable history/cadence/store-review/economy queries | `US-02-06` |
| Migration/constraint/reset integration evidence | `US-02-02`, `US-02-03`, `US-02-08`, `US-02-09` |
| Startup migration/readiness/reconciliation barrier order | `US-02-04`, `US-02-09`; real session reconciliation thuộc `EPIC-03` |

## 6. Definition of Ready trước khi tạo Task

Một Story đủ điều kiện chia thành Task khi:

- [ ] Story statement, outcome, dependencies và block relation đã được Dũng Lư review.
- [ ] In-scope/out-of-scope không kéo Product behavior của Epic sau vào Epic 2.
- [ ] Technical input trực tiếp của Story đã resolve hoặc Task đầu tiên được ghi rõ là
  bounded spike/non-production để resolve input trước implementation acceptance.
- [ ] Acceptance criteria có evidence type cụ thể và không phụ thuộc documentation-only assertion.
- [ ] Product `OPEN-001`, `OPEN-006`, `OPEN-009` không bị chốt ngầm.
- [ ] Schema/repository Task trace được về Data Model exact section và entity owner.
- [ ] Native/device step có owner/manual boundary rõ ràng; không yêu cầu AI chạy EAS/native build.

## 7. Definition of Story Done

Một Story chỉ được đánh dấu `[x]` khi:

- [ ] Tất cả acceptance criteria bắt buộc đã đạt.
- [ ] Task chính thức đã hoàn thành hoặc được loại qua review có chủ đích.
- [ ] Root quality/test/boundary command liên quan pass.
- [ ] Migration/repository/constraint evidence dùng exact committed schema/runtime theo strategy đã duyệt.
- [ ] Failure evidence chứng minh durable rows trước/sau, không chỉ kiểm tra error message.
- [ ] Không có raw SQL/SQLite/provider type vượt architecture boundary.
- [ ] Không có automatic destructive recovery, partial committed state hoặc success projection chưa commit.
- [ ] Không kéo Timer/Session/Pet/Gamification/Product behavior của Epic sau ngoài minimal port/fake/harness đã nêu.
- [ ] Documentation/ADR được cập nhật nếu implementation tạo technical decision mới.

## 8. EPIC-02 readiness assessment

### 8.1. Trạng thái hiện tại

- **Documentation baseline:** đủ và nhất quán; Data Model 1.0.0 đã `APPROVED`, toàn bộ
  `DM-OPEN-001` đến `DM-OPEN-007` đã `RESOLVED`.
- **Epic start gate:** đã đạt vì `EPIC-01 DONE`.
- **Product blocker:** không có; ba Product decision còn `OPEN` đều nằm ngoài schema
  foundation và đã có explicit exclusion.
- **Story breakdown:** `READY_FOR_REVIEW`, chưa tự coi là owner-approved baseline.
- **Implementation readiness:** `US-02-01` và `US-02-02` đã `DONE`. Exact native report của
  `US-02-02` pass trên implementation commit đã đối chiếu. Plan `US-02-03` `0.1.0` đã được
  tạo ở trạng thái `READY_FOR_REVIEW` / implementation `NOT_STARTED`; dependency gate đã mở
  nhưng `EPIC02-INPUT-02` và ba confirmation kỹ thuật của plan vẫn chờ owner duyệt. Toàn
  Story breakdown vẫn `READY_FOR_REVIEW`; `US-02-03` chưa tự active.

### 8.2. Điều kiện chuyển `READY_FOR_IMPLEMENTATION`

1. Dũng Lư review/approve chín Story, block graph và one-active-Story execution order.
2. [Đã đạt 2026-08-27] Xác nhận `EPIC02-INPUT-01` trước khi khóa test task của `US-02-01`.
3. Xác nhận `EPIC02-INPUT-02` trước khi khóa migration runner acceptance.
4. [Đã đạt 2026-08-28] Xác nhận `EPIC02-INPUT-03` trước khi khóa schema trigger/reset maintenance design.
5. Tạo Task IDs theo Story; không cần estimate deadline để chuyển readiness.

## 9. Review checklist

- [ ] Chín Story cover đủ EPIC-02 completion criteria và Data Model implementation acceptance thuộc phạm vi foundation.
- [ ] Mọi Story là outcome/evidence slice; layer chỉ xuất hiện trong Task responsibility.
- [ ] `MUST`, dependency priority và execution order được phân biệt rõ.
- [ ] Solo developer chỉ có một active Story theo order `01 → 09`.
- [ ] Correctness/invariant đứng trước migration/bootstrap; adapter/query đứng trước recovery/reset/device audit.
- [ ] `OPEN-001`, `OPEN-006`, `OPEN-009` không bị chốt ngầm.
- [ ] Session reconciliation/reward behavior, Pet animation, purchase UX và Product UI của Epic sau không lọt vào implementation.
- [ ] Reset executor và Settings confirmation UX có owner Epic riêng, không duplicate scope.
- [ ] Recovery có Retry và no-auto-reset/no-repair evidence.
- [ ] Native/EAS build không được chạy trong planning turn; owner-run evidence nằm ở `US-02-09`.
- [ ] Dũng Lư review và phê duyệt Story breakdown trước khi chuyển status sang `APPROVED`/`READY_FOR_IMPLEMENTATION`.

## 10. Change log

### 1.0.0 — 2026-08-28

- Link implementation plan `US-02-03` `0.1.0` và ghi trạng thái `READY_FOR_REVIEW` /
  `NOT_STARTED`.
- Ghi rõ ba owner confirmation đang chờ cho canonical checksum, per-migration transaction
  checkpoint và no-auto-adoption behavior; không tự resolve `EPIC02-INPUT-02`.
- Giữ production implementation, bootstrap wiring và native/EAS build ngoài planning turn.

### 0.9.0 — 2026-08-28

- Tiếp nhận iOS native report `US-02-02_INITIAL_SCHEMA` `passed: true`, đủ `11/11`
  assertions và exact SHA `4996c7d6529d0a1578e2d052bdbaaf858d9e1a1d`.
- Hoàn tất acceptance checklist và chuyển `US-02-02` sang `DONE`.
- Mở dependency gate `US-02-03` ở mức ready-for-planning; giữ `EPIC02-INPUT-02` chưa resolve
  và không tự active Story tiếp theo.

### 0.8.0 — 2026-08-28

- Ghi nhận `US-02-02` đã implement production initial schema artifact, exact manifest/seed,
  host tests, native probe và manual runbook theo plan `1.1.0`.
- Chuyển Story sang `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`; giữ acceptance checklist
  mở và tiếp tục block `US-02-03` tới khi owner native report được review.
- Không kéo migration runner/bootstrap/repository/Product behavior hoặc native build vào scope.

### 0.7.0 — 2026-08-28

- Ghi nhận owner duyệt `US0202-CONFIRM-03`; cả ba confirmation của `US-02-02` đã
  `APPROVED`.
- Chuyển implementation plan `US-02-02` sang `READY_FOR_IMPLEMENTATION`; implementation
  vẫn `NOT_STARTED`.

### 0.6.0 — 2026-08-28

- Ghi nhận owner duyệt `US0202-CONFIRM-02` và khóa ranh giới artifact `001` với migration
  runner/history/checksum của `US-02-03`.
- Giữ `US0202-CONFIRM-03` chờ owner; implementation `US-02-02` chưa bắt đầu.

### 0.5.0 — 2026-08-28

- Ghi nhận owner duyệt `US0202-CONFIRM-01` và resolve `EPIC02-INPUT-03`.
- Khóa delete boundary cho immutable receipts mà không thêm durable bypass state; giữ
  `US0202-CONFIRM-02`/`03` chờ owner.

### 0.4.0 — 2026-08-28

- Link implementation plan `US-02-02` `0.1.0` và ghi rõ trạng thái `READY_FOR_REVIEW` /
  `NOT_STARTED`.
- Giữ `EPIC02-INPUT-03` cùng technical confirmations ở trạng thái chờ owner; không tự mở
  implementation gate hoặc thay đổi Story acceptance.

### 0.3.0 — 2026-08-28

- Ghi nhận exact iOS runtime probe `passed: true` với đủ 11 assertion trên implementation
  commit `a75ecc9112c2aa279bee9a818d9c97e586b84b21`.
- Đóng `US-02-01` là `DONE`, hoàn tất acceptance checklist và mở dependency gate cho
  `US-02-02`.
- Giữ cross-platform iOS + Android repeat ở `US-02-09`; không đổi approval status của toàn
  bộ chín-Story breakdown và không resolve sớm `EPIC02-INPUT-02`/`03`.

### 0.2.0 — 2026-08-27

- Ghi nhận owner approval cho test strategy của `US-02-01` và chuyển
  `EPIC02-INPUT-01` sang `RESOLVED`.
- Link implementation plan authoritative của `US-02-01`; không thay status approval của
  toàn bộ chín-Story breakdown hoặc resolve sớm `EPIC02-INPUT-02`/`03`.

### 0.1.0 — 2026-08-27

- Tạo breakdown đầu tiên cho `EPIC-02` thành chín Enabler Story theo dependency order.
- Hiệu chỉnh outcome “không mất dữ liệu” thành failure boundary kiểm chứng được mà
  không làm yếu no-destructive-recovery invariant.
- Tách rõ `MUST`, dependency priority và authoritative solo-developer execution order.
- Bao phủ SQLite ownership, transaction kernel, schema/seed, migration, bootstrap,
  repository/mappers, derived queries, recovery, reset và iOS/Android evidence.
- Phân ranh giới EPIC-02 với Session/Timer/Pet/Gamification/History/Settings/Analytics
  Epic sau; chỉ cho phép port/fake/harness tối thiểu cần cho foundation.
- Giữ Product `OPEN-001`, `OPEN-006`, `OPEN-009` nguyên trạng và không thêm field liên quan.
- Ghi ba technical input cần Dũng Lư xác nhận trước acceptance của Story liên quan.
- Đặt tài liệu ở `READY_FOR_REVIEW`; không tự ghi owner approval hoặc implementation completion.
