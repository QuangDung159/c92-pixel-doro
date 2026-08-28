---
document_id: PIXELDORO_US_02_05_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-02-05 Implementation Plan
version: 0.4.0
status: IN_PROGRESS
implementation_status: IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME
last_updated: 2026-08-28
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
language: vi
scope:
  - mobile_mvp
  - epic_02
  - us_02_05
  - typed_persistence_ports
  - sqlite_repositories
  - persistence_mappers
  - transaction_participation
authority: PLANNING
story_baseline: ./EPIC-02_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
session_lifecycle_baseline: ../specifications/session-lifecycle.md
gamification_baseline: ../specifications/gamification-rules.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundaries: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
adr_analytics: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# US-02-05 — Typed Repository và Mapper Integration

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan authoritative cho `US-02-05` thuộc
`EPIC-02 — Durable Local Data, Migration và Safe Bootstrap`.

**Story outcome:** Mỗi durable product/metadata entity có Application-owned typed capability,
SQLite adapter và canonical mapper; các thao tác command-critical tham gia đúng transaction hiện
tại, không rò SQL/raw row/provider exception và không đưa Product behavior của Epic sau vào
Infrastructure.

**Dependency:** `US-02-04 DONE`. Safe bootstrap/readiness native probe đã pass `9/9` assertion trên
implementation SHA `b36bc45190129da07e42d046f2badf6fddcd99e4`.

**Priority:** `MUST` / `P1_DURABILITY` / execution order `05` trong EPIC-02.

**Blocks:** `US-02-06`. Derived queries không được xây trực tiếp trên SQLite/raw row trước khi
typed mapping, repository ownership và transaction participation có một contract ổn định.

**Planning status:** `IN_PROGRESS`. **Implementation status:**
`IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`.

Không có Product blocker. Bốn technical confirmation `US0205-CONFIRM-01` đến `04` đã được
Dũng Lư duyệt ngày 2026-08-28. Decision gate đã đóng; `US0205-T01 → T08` đã hoàn tất,
full host quality pass và `T09` đang chờ owner chạy exact native probe.

### 0.1. Start gate

- [x] `US-02-01 DONE`: application-scoped SQLite owner và transaction kernel.
- [x] `US-02-02 DONE`: normative schema `001`, exact seed và database backstop.
- [x] `US-02-03 DONE`: forward-only migration/history/checksum runner.
- [x] `US-02-04 DONE`: migration/verify/hydrate/reconcile readiness barrier.
- [x] `EPIC02-INPUT-03 RESOLVED`: reward/purchase receipts immutable trong normal path.
- [x] Không cần Product decision `OPEN` để lập plan.
- [x] `US0205-CONFIRM-01`–`04` được owner duyệt ngày 2026-08-28.
- [x] Chỉ `US-02-05` active; không implement `US-02-06/07/08/09` song song.

## 1. Baseline và current-state review

### 1.1. Authority contract

| Authority | Contract áp dụng cho `US-02-05` |
|---|---|
| `EPIC-02_USER_STORIES.md` | Typed Application ports, SQLite adapters, mapper/error contract, transaction-scoped primitives và evidence cho toàn bộ durable entity. |
| System Architecture §2–7 | Application sở hữu I/O port; Infrastructure implement; composition root inject; durable command chạy trong transaction ngắn; không provider side effect trong transaction. |
| Project Structure §3–7 | Shared/mobile ownership, public export, repository/mapper naming, SQL placement và boundary enforcement. |
| Technical Overview §5 | SQLite là durable truth; repository là lối vào duy nhất; Application/Presentation không biết raw persistence representation. |
| Data Model §3–7, §13 | Exact table/column/enum/nullability/FK/immutability/index/retention constraints và mobile integration evidence. |
| ADR-003/004 | SQLite là durable authority; Domain thuần; Application sở hữu abstraction, Infrastructure sở hữu provider mapping. |
| ADR-008 | Analytics queue là typed bounded metadata, privacy-safe và nằm ngoài core transaction; delivery/provider behavior không thuộc Story này. |

### 1.2. Repository hiện tại sau `US-02-04`

| Khu vực | Current state | Hệ quả cho plan |
|---|---|---|
| SQLite owner/executor | Một application-scoped owner; lease/executor và parameter binding đã có. | Mọi adapter phải dùng lại owner; không tự `openDatabaseAsync`. |
| Transaction kernel | Application-owned opaque `TransactionScope`; SQLite implementation resolve executor theo scope; overlap reject deterministic. | Repository scoped call phải nhận scope và dùng exact executor; không nested/self-commit. |
| Schema/migrations | Schema `001` có đủ table/backstop/seed và forward runner đã đạt evidence. | Không tạo migration `002`, ALTER table hoặc schema workaround trong Story này. |
| Bootstrap | Verifier + narrow durable read adapter hydrate installation/settings/profile/catalog rồi publish ready. | Full repository mapper phải trở thành canonical mapping source; không giữ duplicate row interpretation. |
| Shared Application | Chỉ có result, clock, ID, transaction/foundation contracts; chưa có product repository. | Cần thêm portable persistence capability vào public package API có chủ đích. |
| Mobile Application | Có bootstrap/readiness/lifecycle ports; Presentation facade chỉ expose bootstrap state. | Mobile-only persistence ports có thể nằm tại đây nhưng không được đưa vào Presentation facade. |
| SQLite repositories | Chưa có entity repository/mapper suite. | Cần incremental slice và entity coverage audit; tránh một generic CRUD abstraction. |
| Tests | Schema/migration/bootstrap probes có; chưa có repository round-trip/corrupt-row matrix. | Host mapper/integration matrix là evidence chính; native probe xác nhận Expo SQLite wiring. |

### 1.3. Review findings

1. Normative schema có mười product/metadata table cần typed owner. `schema_migrations` tiếp tục
   thuộc migration infrastructure, không phải Product repository thứ mười một.
2. Full repository không được thay transaction kernel bằng repository-local transaction hoặc
   `runExclusive`; một Application use case tương lai phải phối hợp nhiều repository trong cùng
   một scope/commit.
3. Basic entity reads/writes của Story này khác derived query behavior của `US-02-06`; không đưa
   history grouping, contribution calendar, cadence, review eligibility, economy repair hoặc
   analytics retention vào plan này.
4. Session persistence cần primitive active lookup/insert/conditional mutation, nhưng status,
   reward eligibility, XP/Coin formula và lifecycle decision vẫn thuộc Domain/Application Epic 3.
5. Receipt immutability phải thể hiện cả ở schema và API: normal reward/purchase repository chỉ
   insert/read; không expose update/delete hoặc maintenance flag.
6. Catalog price là durable authority. Debit capability không được nhận một `price` do UI gửi;
   future purchase orchestration phải lấy/consume price từ catalog truth trong cùng transaction.
7. Bootstrap adapter hiện có mapping installation/settings/profile/catalog. Nếu repository tạo
   mapper thứ hai độc lập, hai đường hydrate có thể diễn giải corruption khác nhau.
8. Mapper cần validate runtime row shape dù TypeScript đã khai báo row type; SQLite/provider có thể
   trả legacy/corrupt value. Không được `Boolean(value)`, `parseInt`, default fill hoặc clamp.
9. `analytics_events.properties_json` là storage serialization. Application contract phải nhận/trả
   typed safe property object, không raw JSON string; allowlist/queue delivery orchestration vẫn để
   Story kế tiếp hoặc analytics feature owner.
10. Presentation không cần và không được nhận repository graph. Repository chỉ được inject vào
    Application use case/bootstrap composition.
11. Không có lý do correctness để thêm ORM/query builder/DI container/generic base repository cho
    app solo developer ở Story này.

## 2. Scope contract

### 2.1. In scope

- Application-owned immutable record/DTO, repository/query/command capability và stable
  persistence error contract.
- Canonical pure runtime mapper cho installation, settings, profile, sessions, rewards, catalog,
  purchases, ownership, store-review attempts và analytics queue.
- SQLite adapters dùng parameter binding, exact application-scoped owner và existing transaction
  scope/executor.
- Basic entity lookup/list/insert/update capability cần trực tiếp cho future Application commands;
  conditional persistence primitives không quyết định business outcome.
- Normal-path immutable receipt API và no-delete/no-update evidence.
- Catalog-authoritative debit seam, settings atomic update và OS-permission separation.
- Bootstrap durable hydration reuse canonical mapper/repository mapping truth.
- Composition-local persistence graph; public package export/boundary enforcement.
- Host unit/integration/fault evidence và một dev-only native Expo SQLite probe/runbook.
- Documentation/evidence/status closeout sau owner native report.

### 2.2. Explicit out of scope

- `StartFocus`, `CancelSession`, `ReconcileActiveSession`, terminal resolution hoặc reward grant.
- XP/Coin calculation, streak, Pet stage/state, contribution color hoặc gamification policy.
- `PurchaseItem`, `EquipItem`, Store UI hoặc ownership/product compatibility rule.
- History/contribution/cadence/store-review eligibility/economy consistency derived queries.
- Analytics event production taxonomy, drop-oldest, TTL cleanup, batching, retry/backoff hoặc
  PostHog delivery; các phần này thuộc `US-02-06`/future analytics adapter.
- User-facing Retry/recovery flow (`US-02-07`) và confirmed reset/maintenance executor (`US-02-08`).
- Schema/migration `002`, data repair/backfill hoặc durable bypass flag.
- Persistent Zustand store, Product screen/navigation, UI copy hoặc visual update.
- ORM, code generation, DI container, service locator, remote sync hoặc second SQLite driver.
- Native/EAS build/prebuild và generated iOS/Android artifact trong agent turn.

## 3. Technical directions đề xuất — chờ owner confirmation

### TD-02-05-A — Port ownership theo portability, không theo table/layer máy móc

**Proposal:**

- `packages/application` sở hữu portable core capability cho profile, session, reward receipt,
  catalog, purchase receipt và owned item; đây là dependency của shared Epic 3/8 use cases sau.
- Mobile Application sở hữu installation, app settings, store-review attempt và analytics queue vì
  contract chứa lifecycle/device/provider-facing metadata của Mobile MVP.
- Infrastructure sở hữu SQLite row type, SQL, serialization và concrete repository/mapper.
- Composition root giữ một internal `MobilePersistenceGraph`; không export graph/repository qua
  `MobileApplicationFacade` hoặc Presentation provider.
- Bootstrap hydration dùng lại canonical mapper của repository adapters (hoặc delegate basic reads
  qua adapter) để không có mapping truth thứ hai; runtime physical verifier vẫn là read-only
  infrastructure boundary riêng.

Việc tách này bảo vệ shared core nhưng không dựng abstraction desktop/remote chưa có nhu cầu.

**Status:** `APPROVED 2026-08-28` — `US0205-CONFIRM-01`.

### TD-02-05-B — Explicit scoped/unscoped capability, không optional transaction mơ hồ

**Proposal:**

- Read-only projection/bootstrap lookup dùng unscoped query method trên application-scoped owner;
  method không tự mở write transaction.
- Mỗi read/write cần atomic command có explicit `...InTransaction(scope, ...)` hoặc nằm trong
  command repository interface nhận `TransactionScope` bắt buộc.
- Không dùng optional `scope?`, ambient/global transaction, repository factory hoặc generic
  Unit-of-Work; call-site nhìn vào signature phải biết operation có tham gia transaction hay không.
- Concrete adapter inject `SQLiteDatabaseOwner` + `SQLiteTransaction`, resolve exact executor từ
  `scope` cho scoped call; repository không `BEGIN`, `COMMIT`, `ROLLBACK` hoặc dispose owner.
- Conditional write trả typed persistence outcome như `updated` / `not_updated`; conditional miss
  không bị biến thành provider exception hoặc business decision.
- Core command side effects không được enqueue analytics/notification/store-review trong durable
  transaction.

**Status:** `APPROVED 2026-08-28` — `US0205-CONFIRM-02`.

### TD-02-05-C — Capability matrix tối thiểu, không generic CRUD

**Proposal:** khóa surface ban đầu như bảng dưới. Tên symbol cuối có thể điều chỉnh nhỏ khi code
review nhưng không mở rộng capability ngoài outcome.

| Entity/table | Read capability | Normal write capability | Cố ý không expose |
|---|---|---|---|
| `app_installation` | Singleton read | Set onboarding completion; set/rotate/clear anonymous analytics ID bằng atomic field update | Delete, arbitrary patch, fabricate install time |
| `app_settings` | Singleton read | Replace exact writable settings fields + `updatedAt` atomically sau validation | OS permission read/write, partial raw column patch |
| `pet_profiles` | Singleton read, scoped read | Apply explicit progression delta; conditional catalog-authoritative debit trong scope | Reward formula, clamp, arbitrary balance assignment/delete |
| `sessions` | Find by ID, find active; scoped equivalents | Insert prepared running record; conditional evidence update/terminal transition từ expected durable state | Chọn target status, calculate duration/reward, delete |
| `reward_transactions` | Find by ID/session | Insert prepared receipt trong scope | Update/delete/upsert-ignore |
| `catalog_items` | Find/list; scoped find | Không có normal write; migration owns catalog | UI price input, runtime update/delete |
| `purchase_transactions` | Find by ID/profile+item | Insert prepared receipt trong scope | Update/delete/upsert-ignore |
| `owned_items` | Find/list by profile; scoped find | Insert prepared ownership; conditional equipped-state persistence từ Application decision | Compatibility/slot/layout rule, delete |
| `store_review_attempts` | Find by app version/list basic records | Insert prepared attempt | Eligibility decision, rating/outcome, update/delete |
| `analytics_events` | Find basic event/basic ordered pending rows | Insert structurally validated prepared event; exact state/attempt mutation primitive reserved for later adapter integration | Provider delivery, retention/drop-oldest orchestration, arbitrary event/free text |

Catalog-authoritative debit primitive nhận `profileId`, `itemId` và audit timestamp; SQLite lấy
price từ `catalog_items` trong cùng scoped operation. Contract không nhận `priceCoins` từ UI.
Primitive chỉ báo persistence outcome/fact, không tự tạo purchase receipt/ownership hoặc tuyên bố
purchase success.

Reward/purchase delete authority không nằm trong normal repository; `US-02-08` sẽ tạo private
confirmed-reset executor theo `EPIC02-INPUT-03`, không dùng bypass flag/table.

**Status:** `APPROVED 2026-08-28` — `US0205-CONFIRM-03`.

### TD-02-05-D — Fail-closed mapper và stable persistence error

**Proposal:**

- Application-owned record dùng `camelCase`, union enum/value object đã validate và millisecond
  timestamps; không chứa `snake_case`, SQL/SQLite type, `propertiesJson` hoặc provider error.
- Infrastructure row type phản ánh exact storage columns. Pure mapper kiểm tra runtime value trước
  khi tạo record: exact nullability/type, integer/safe timestamp, boolean `0|1`, enum allowlist,
  duration/offset/range, conditional session shape và relationship identity có trong joined row.
- Corrupt read trả stable `PERSISTENCE_CORRUPT_DATA` với safe `entity`/`field`/reason category;
  không trả raw value, SQL, provider message hoặc row.
- Provider open/query/write/constraint failure được map sang stable Application persistence code;
  expected `not found` trả `null`, còn conditional miss trả explicit typed outcome.
- Write input được validate trước SQL; database constraint vẫn là durable backstop. Không silently
  normalize, default, clamp hoặc swallow unique/FK/immutable trigger failure.
- Analytics properties mapper chỉ nhận JSON object privacy-safe, tối đa 20 keys/2 KiB; parse/shape
  sai là corruption. Exact event taxonomy/allowlisted property schema thuộc analytics producer,
  không tự sáng tác ở Story này.
- Host tests dùng pure mapper fixtures để cover corrupt values khó insert qua schema; SQLite
  integration tests cover provider/constraint/transaction mapping thực tế.

**Status:** `APPROVED 2026-08-28` — `US0205-CONFIRM-04`.

## 4. Contract và invariant chi tiết

### 4.1. Entity coverage authoritative

| Durable table | Application owner | Infrastructure owner | Evidence tối thiểu |
|---|---|---|---|
| `app_installation` | Mobile Application installation capability | SQLite installation mapper/repository | Singleton exact round-trip + nullable analytics/onboarding fields |
| `app_settings` | Mobile Application settings capability | SQLite settings mapper/repository | All enums/booleans/ranges + atomic write/reopen |
| `pet_profiles` | Shared Application profile capability | SQLite profile mapper/repository | Zero/non-zero balance + scoped update/debit rollback |
| `sessions` | Shared Application session capability | SQLite session mapper/repository | Running/terminal shapes + conditional conflict |
| `reward_transactions` | Shared Application reward receipt capability | SQLite reward mapper/repository | Insert/read + duplicate/update rejection |
| `catalog_items` | Shared Application catalog query | SQLite catalog mapper/repository | Exact 12 items/order/value + read-only API |
| `purchase_transactions` | Shared Application purchase receipt capability | SQLite purchase mapper/repository | Insert/read + duplicate/update rejection |
| `owned_items` | Shared Application owned-item capability | SQLite owned-item mapper/repository | Insert/list/equip persistence + FK identity |
| `store_review_attempts` | Mobile Application store-review persistence capability | SQLite store-review mapper/repository | Nullable-none not applicable; app-version uniqueness |
| `analytics_events` | Mobile Application analytics queue persistence capability | SQLite analytics mapper/repository | Properties/state/attempt/null schedule round-trip |
| `schema_migrations` | Migration port/runner đã có | Migration infrastructure đã có | Excluded from Product repository; existing migration evidence reused |

Không table nào được sở hữu bởi Presentation/Zustand. Không tạo `HistoryRepository`,
`ContributionRepository`, `PetStateRepository` hoặc aggregate durable table trong Story này.

### 4.2. Transaction participation invariant

Một future core command phải có data flow sau:

```text
Application use case
  → transaction.run(scope =>
      repository A scoped read(scope)
      pure Domain decision
      repository A/B scoped writes(scope)
    )
  → single commit
  → publish committed projection
  → best-effort side effects outside transaction
```

Required evidence:

1. Multi-repository success commit survives close/reopen.
2. Returned failure after earlier repository write rolls all scoped writes back.
3. Thrown mapped failure after earlier repository write rolls all scoped writes back.
4. Repository cannot accept scope from another transaction/owner.
5. Unscoped read observes only committed state, không thấy uncommitted write qua bypass.
6. Repository adapter không gọi transaction API trực tiếp ngoài scope resolution.

### 4.3. Mapping invariant

- ID là exact non-empty durable ID theo schema/baseline; mapper không generate replacement ID.
- Timestamp là finite safe integer theo approved unit; mapper không parse date string hoặc gọi Clock.
- SQLite integer boolean chỉ chấp nhận exact `0`/`1` và map sang boolean.
- Nullable field giữ chính xác `null`; empty string không thay cho null trừ khi authority cho phép.
- Enum chỉ chấp nhận value trong approved union; unknown value fail closed.
- Joined relationship field phải khớp owner/profile/session/item identity; mismatch là corruption.
- `properties_json` parse một lần tại Infrastructure và serialize deterministically cho write
  evidence; raw serialized value không ra khỏi adapter.
- Mapper không tính reward, price, elapsed duration, contribution, Pet state hoặc review eligibility.

### 4.4. Error boundary

Plan dùng một Application-owned discriminated persistence failure family. Exact code list phải nhỏ
và stable, tối thiểu phân biệt:

- `PERSISTENCE_UNAVAILABLE`: owner/connection không usable hoặc disposed.
- `PERSISTENCE_QUERY_FAILED`: provider read không hoàn tất nhưng không đủ bằng chứng gọi là corrupt.
- `PERSISTENCE_WRITE_FAILED`: provider write/constraint không hoàn tất.
- `PERSISTENCE_CONFLICT`: unique/conditional concurrency conflict có nghĩa ở capability boundary.
- `PERSISTENCE_CORRUPT_DATA`: committed row không map được theo normative contract.

Failure projection không chứa SQL, database filename, provider stack/message hoặc raw row. Adapter có
thể giữ `cause` nội bộ cho test/log có kiểm soát nhưng không export qua public result.

### 4.5. Bootstrap integration invariant

- Production bootstrap order `open → migrate → verify → hydrate → reconciliation boundary → ready`
  không đổi.
- Physical verifier vẫn kiểm tra schema/history/integrity/economy invariants trước repository hydrate.
- Installation/settings/profile/catalog hydration dùng canonical mapper mới; existing bootstrap
  snapshot shape không mở rộng bằng entity ngoài approved `US-02-04` contract.
- Repository graph có thể được tạo tại composition nhưng Product command vẫn bị readiness guard chặn.
- Mapper failure trong hydrate map về existing safe bootstrap recovery phase/code; không repair row.

## 5. Authoritative implementation order cho solo developer

Chỉ một Task active tại một thời điểm. `MUST` là Epic commitment; dependency priority giải thích
correctness block; số `Txx` dưới đây là exact execution order trong Story.

| Order | Task ID | Outcome độc lập | Depends on | Blocks |
|---:|---|---|---|---|
| `00` | `US0205-T00` | Owner duyệt bốn confirmation; scope/contract freeze | Story start gate | Tất cả task code |
| `01` | `US0205-T01` | Shared/mobile persistence result, record và scoped/unscoped contract compile qua public API | T00 | T02–T06 |
| `02` | `US0205-T02` | Installation/settings/profile/catalog vertical slice round-trip và bootstrap dùng canonical mapper | T01 | T06, T07, T08 |
| `03` | `US0205-T03` | Session vertical slice hỗ trợ active lookup/insert/conditional mutation đúng transaction | T01, T02 | T04, T06–T08 |
| `04` | `US0205-T04` | Reward/purchase/owned-item economy slice có immutable API, authoritative price seam và atomic rollback | T03 | T06–T08 |
| `05` | `US0205-T05` | Store-review/analytics metadata slice có typed row persistence, không kéo delivery/eligibility | T01, T04 | T06–T08 |
| `06` | `US0205-T06` | Composition persistence graph, export/boundary và 10-table ownership audit hoàn tất | T02–T05 | T07–T08 |
| `07` | `US0205-T07` | Host round-trip/corruption/transaction/fault matrix và full quality pass | T02–T06 | T08 |
| `08` | `US0205-T08` | Dev-only native repository probe + owner runbook sẵn sàng, không chạy native trong agent turn | T07 | T09 |
| `09` | `US0205-T09` | Owner chạy iOS native probe, gửi exact report + SHA; Android nếu gate yêu cầu | T08 | T10 |
| `10` | `US0205-T10` | Evidence/doc/status closeout; chỉ khi mọi acceptance đạt mới mở `US-02-06` | T09 | `US-02-06` |

### 5.1. Vì sao order này authoritative

1. Contract/error/transaction participation phải đứng trước adapter để tránh sửa đồng loạt mười
   entity sau khi capability surface đã lan rộng.
2. Bootstrap entities đứng đầu vì chúng đã có production consumer và giúp phát hiện duplicate
   mapping truth sớm.
3. Session đứng trước economy vì reward receipt có ownership/FK theo session; economy đứng trước
   metadata vì atomic ledger/inventory correctness có priority cao hơn side-effect metadata.
4. Composition/coverage audit chỉ có ý nghĩa sau khi từng vertical slice có acceptance riêng.
5. Host evidence chạy trước native probe để device chỉ xác nhận Expo SQLite/runtime integration,
   không thay unit/integration coverage.
6. `US-02-06` chỉ mở sau exact closeout; không xây derived query song song trên raw SQL surface đang
   thay đổi.

## 6. Task checklist chi tiết

### US0205-T00 — Decision gate

- [x] Duyệt `US0205-CONFIRM-01` port ownership/bootstrap reuse.
- [x] Duyệt `US0205-CONFIRM-02` scoped/unscoped API.
- [x] Duyệt `US0205-CONFIRM-03` capability matrix/catalog debit seam.
- [x] Duyệt `US0205-CONFIRM-04` mapper/error/analytics structural boundary.
- [x] Chuyển document sang `READY_FOR_IMPLEMENTATION`; implementation vẫn `NOT_STARTED`.

### US0205-T01 — Application persistence contract

- [x] Tạo stable persistence result/error/outcome types ở đúng shared/mobile owner.
- [x] Tạo immutable camelCase record/DTO cho mười entity; không export raw row.
- [x] Tạo capability-specific repository/query/command ports, không base CRUD interface.
- [x] Tạo explicit scoped/unscoped signatures và type-only `TransactionScope` dependency.
- [x] Export shared contract qua `@pixeldoro/application` public root; mobile ports qua mobile
  Application module public boundary tối thiểu.
- [x] Add compile/boundary tests chứng minh Application không import mobile/SQLite/provider.

### US0205-T02 — Durable bootstrap entity slice

- [x] Implement row types + pure mappers cho installation/settings/profile/catalog.
- [x] Implement SQLite repositories dùng owner lease/parameter binding.
- [x] Add settings exact atomic write/range validation; OS permission không tham gia contract.
- [x] Add profile scoped read/progression/debit persistence primitive theo approved matrix.
- [x] Catalog chỉ read và price lấy từ storage; không runtime mutation API.
- [x] Refactor bootstrap data adapter dùng canonical mapper/repository mapping truth.
- [x] Unit mapper valid/corrupt matrix; integration round-trip/close-reopen cho bốn entity.
- [x] Verify bootstrap regression baseline không đổi về snapshot/order/seed duplication; exact Expo
  runtime confirmation nằm trong `T09`.

### US0205-T03 — Session slice

- [x] Implement session row mapper cho exact running/terminal conditional shapes.
- [x] Implement find-by-ID/find-active unscoped và scoped equivalents.
- [x] Implement insert prepared running record; unique-active conflict map stable.
- [x] Implement conditional background evidence/terminal transition từ expected current state.
- [x] Transition input chứa facts đã được Domain/Application quyết định; repository không calculate.
- [x] Integration tests cover success, stale/missing row, invalid shape, rollback và reopen.

### US0205-T04 — Economy/inventory slice

- [x] Implement reward receipt mapper/read/insert-only adapter.
- [x] Implement purchase receipt mapper/read/insert-only adapter.
- [x] Implement owned item mapper/read/insert/conditional equipped-state adapter.
- [x] Implement/verify catalog-authoritative scoped debit seam không nhận UI price.
- [x] Add multi-repository transaction fixture session + reward + profile update.
- [x] Add purchase + debit + receipt + ownership transaction fixture.
- [x] Inject returned/thrown failure giữa writes; verify no partial durable state.
- [x] Assert normal APIs không có update/delete cho reward/purchase receipts.
- [x] Assert immutable trigger/unique/FK conflicts map stable và không bị swallow.

### US0205-T05 — Metadata slice

- [x] Implement store-review attempt mapper/find/insert adapter.
- [x] Implement analytics event mapper/basic insert/read/state mutation primitives theo approved
  boundary.
- [x] Validate analytics properties object/key-count/serialized size/privacy-safe structural type.
- [x] Không implement eligibility, rating truth, TTL/drop-oldest/delivery/backoff/PostHog.
- [x] Integration tests cover app-version/event-ID uniqueness, nullable schedule và close/reopen.
- [x] Verify metadata call không chạy như hidden side effect trong core repository transaction.

### US0205-T06 — Composition và architecture audit

- [x] Tạo application-scoped internal persistence graph tại mobile composition root.
- [x] Reuse exact owner/transaction; không thêm SQLite connection hoặc global singleton.
- [x] Không đưa repository graph vào Presentation facade/context.
- [x] Entity-to-owner/adapter registry test chứng minh đủ 10 tables; migration table excluded rõ.
- [x] Scan SQL placement, forbidden import/deep import/public export.
- [x] Scan generic CRUD/arbitrary receipt mutation/maintenance bypass API.

### US0205-T07 — Host evidence

- [x] Pure mapper round-trip/corrupt matrix cho mỗi entity.
- [x] SQLite integration round-trip cho mỗi entity và nullable/enum/timestamp edge.
- [x] Transaction participation/rollback/wrong-scope/concurrency matrix.
- [x] Provider/constraint/error sanitization matrix.
- [x] Existing US01–US04 regression suites pass.
- [x] Full `pnpm quality` pass dưới repository-pinned Node/pnpm.
- [x] Repository hygiene không có native artifact/credential/temporary DB.

### US0205-T08 — Native probe và runbook

- [x] Tạo dev-only `US-02-05_TYPED_REPOSITORIES` probe trên isolated database.
- [x] Probe dùng production owner, migration `001`, transaction và repository graph.
- [x] Probe tạo valid cross-entity fixture, close/reopen và assert exact values.
- [x] Probe inject rollback/conditional/immutable conflict và assert no partial rows.
- [x] Probe cleanup database/connection idempotently; không ghi production database.
- [x] Runbook ghi pinned Node activation, commit SHA, platform/app/application ID và exact JSON
  expected assertions.
- [x] Agent không chạy native/EAS build; giao owner chạy thủ công.

### US0205-T09 — Owner native evidence

- [ ] Owner chạy iOS development runtime theo runbook trên exact implementation SHA.
- [ ] Report có `passed: true`, platform, OS/app/application ID, full commit SHA và exact assertion set.
- [ ] Đối chiếu SHA với implementation commit; rerun nếu code production/probe đổi sau report.
- [ ] Android runtime evidence chỉ bắt buộc nếu Epic/device gate hiện hành yêu cầu ở Story này;
  không giả lập pass bằng host SQLite.

### US0205-T10 — Closeout

- [ ] Lưu automated/native outputs vào `EPIC-02_IMPLEMENTATION_EVIDENCE.md`.
- [ ] Update plan/User Stories status/version/change log, exact implementation/evidence SHA.
- [ ] Review diff xác nhận không Product behavior/schema scope creep.
- [ ] Chỉ chuyển `DONE` và mở `US-02-06` khi exit checklist đầy đủ.

## 7. Planned file impact

Exact filenames có thể co lại khi owner duyệt ownership, nhưng responsibility/location sau là
authoritative:

```text
packages/application/src/
  persistence/
    persistence-error.ts
    profile.repository.ts
    session.repository.ts
    reward-receipt.repository.ts
    catalog.repository.ts
    purchase-receipt.repository.ts
    owned-item.repository.ts
  index.ts

apps/mobile/src/application/
  persistence/
    installation.repository.ts
    settings.repository.ts
    store-review-attempt.repository.ts
    analytics-event.repository.ts
    index.ts

apps/mobile/src/infrastructure/database/
  mappers/
    <entity>-row.mapper.ts
  repositories/
    sqlite-<entity>.repository.ts
  persistence-graph.ts
  index.ts

apps/mobile/src/composition/
  mobile-composition.ts

apps/mobile/test/integration/
  typed-repositories.integration.test.ts
  repository-transactions.integration.test.ts
  repository-corruption.integration.test.ts

apps/mobile/test/device/
  us-02-05-typed-repositories.probe.ts
  US-02-05_TYPED_REPOSITORIES_RUNBOOK.md
```

Không bắt buộc một file cho mỗi table nếu grouping giữ capability rõ, nhưng không được tạo file
`generic-repository.ts`, `base-crud.repository.ts`, `database-service.ts` hoặc export SQL executor
như Application API.

## 8. Acceptance và evidence matrix

| Acceptance | Automated evidence | Native/manual evidence |
|---|---|---|
| 10 product/metadata tables có typed owner, migration history excluded | Entity ownership registry + architecture review | Probe exercises all entity groups |
| Application port không import SQLite/provider/mobile | Boundary/typecheck/export tests | Không cần native |
| SQL chỉ trong mobile database Infrastructure | SQL-location scan/boundary test | Không cần native |
| snake_case → camelCase, no raw row leak | Mapper unit/API compile tests | Exact reopened values |
| Corrupt enum/null/timestamp/boolean/relationship fail typed | Pure corrupt fixture matrix + fault adapter | Constraint/mapped failure subset |
| Session active/insert/conditional mutation, no Product decision | Session integration + API review | Conditional conflict assertion |
| Receipt normal API immutable | Compile/API surface + trigger integration | Immutable conflict assertion |
| Scoped repository joins current transaction | Multi-repo commit/rollback/wrong-scope tests | Rollback/no-partial assertion |
| Catalog price authoritative, no UI price contract | Port signature review + debit integration | Catalog-authoritative debit assertion |
| Settings atomic/range, no OS permission truth | Unit/integration + API review | Reopen exact setting values |
| Valid round-trip every entity | Entity fixture matrix | Cross-entity close/reopen |
| Bootstrap uses canonical mapping and stays safe | US04 regression + mapper reuse review | Existing bootstrap assertions remain pass |
| Public export/boundary/hygiene | Full `pnpm quality` + repository status | Exact report SHA |

### 8.1. Proposed native report contract

Probe name: `US-02-05_TYPED_REPOSITORIES`.

Expected assertion IDs sau implementation review:

```text
repository_probe_database_opened_and_migrated
all_durable_entity_groups_round_tripped
canonical_mappers_preserved_exact_values_after_reopen
transaction_scoped_multi_repository_work_committed
returned_and_thrown_failures_rolled_back_all_repository_writes
session_conditional_conflict_was_deterministic
immutable_receipt_mutation_was_not_exposed_or_committed
catalog_authoritative_price_debit_was_verified
corrupt_or_constraint_failures_were_safely_mapped
repository_graph_connections_closed_and_database_cleaned
```

Exact assertion list được freeze ở `T08`; thay đổi list sau owner evidence yêu cầu rerun. Probe là
dev-only diagnostic, không xuất hiện trong release UI và không thay host test matrix.

## 9. Failure, recovery và rollback policy

- Repository write failure để transaction owner rollback; adapter không retry, compensate hoặc
  publish partial success.
- Corrupt committed row fail typed và đi existing bootstrap/recovery boundary khi xảy ra lúc
  hydration; không auto-delete/reseed/clamp.
- Duplicate receipt/active session/ownership/app-version/event ID không `INSERT OR IGNORE`; conflict
  phải observable qua typed result.
- Receipt/catalog normal path không có destructive API. Confirmed reset authority chờ `US-02-08`.
- Nếu implementation cần schema change, dừng Story và review baseline/migration scope; không sửa
  migration `001` đã phát hành để làm test xanh.
- Nếu PostHog/event taxonomy cần quyết định mới, giữ adapter capability hẹp và chuyển input về
  analytics owner; không tự chốt event schema trong repository.
- Có thể revert source/docs của Story; durable fixture DB của dev-only probe phải isolated và cleanup.

## 10. Definition of Done

- [x] Bốn confirmation được owner duyệt và ghi ngày duyệt.
- [x] `US0205-T01`–`T08` implementation/host/probe/runbook hoàn tất theo order.
- [x] Mọi normative product/metadata table có typed owner/adapter; `schema_migrations` excluded đúng.
- [x] No raw row/SQL/provider leak; no generic CRUD/receipt mutation bypass.
- [x] Scoped multi-repository transaction, rollback và catalog-authoritative price evidence pass.
- [x] Valid/corrupt mapper matrix và host SQLite close/reopen round-trip đủ mọi entity.
- [x] Existing US01–US04 regression + full quality pass.
- [ ] Owner native report pass trên exact SHA và được lưu vào evidence document.
- [x] Không production Product behavior/UI/schema migration mới/native artifact ngoài policy.
- [ ] Documentation closeout hoàn tất; `US-02-06` chỉ mở sau `US-02-05 DONE`.

## 11. Owner confirmations

| ID | Cần xác nhận | Đề xuất | Status |
|---|---|---|---|
| `US0205-CONFIRM-01` | Port/package ownership và bootstrap mapper reuse | Shared core ports cho profile/session/economy/catalog/ownership; mobile ports cho installation/settings/store-review/analytics; Infrastructure rows/mappers; graph không ra Presentation; bootstrap reuse canonical mapper. | `APPROVED 2026-08-28` |
| `US0205-CONFIRM-02` | Transaction participation API | Tách explicit unscoped read và scoped command methods; không optional/ambient scope, self-transaction hay generic Unit-of-Work. | `APPROVED 2026-08-28` |
| `US0205-CONFIRM-03` | Exact capability surface | Dùng capability matrix §3, no generic CRUD; receipt insert/read-only; catalog-authoritative debit không nhận UI price; maintenance delete chờ US08. | `APPROVED 2026-08-28` |
| `US0205-CONFIRM-04` | Mapper/error/analytics structural boundary | Fail closed với stable sanitized persistence errors; validate exact runtime row; analytics chỉ structural object limit, không kéo taxonomy/retention/delivery. | `APPROVED 2026-08-28` |

## 12. Handoff sau khi plan được duyệt

1. Owner review bốn confirmation; có thể duyệt một lượt hoặc từng ID.
2. Update plan `READY_FOR_IMPLEMENTATION`, freeze contract/order và không tự bắt đầu code nếu owner
   chưa yêu cầu implementation.
3. Khi owner yêu cầu implement, chạy `T01 → T08` tuần tự; gửi host evidence và manual runbook.
4. Owner chạy `T09`; agent đối chiếu exact report/SHA rồi thực hiện `T10` closeout.
5. Chỉ sau `DONE` mới lập/active implementation plan `US-02-06`.

## 13. References

- [`EPIC-02_USER_STORIES.md`](./EPIC-02_USER_STORIES.md), `US-02-05`, block graph và
  `EPIC02-INPUT-03`.
- [`MVP_EPICS.md`](./MVP_EPICS.md), EPIC-02 outcome/start/exit gate.
- [`PIXELDORO_CORE_TRUTH.md`](../PIXELDORO_CORE_TRUTH.md), product truth và deferred decisions.
- [`system-architecture.md`](../architecture/system-architecture.md), §2–7.
- [`project-structure.md`](../architecture/project-structure.md), §3–7.
- [`technical-overview.md`](../architecture/technical-overview.md), persistence flow/failure.
- [`data-model.md`](../architecture/data-model.md), §3–7 và §13.
- [`ADR-003-state-and-persistence.md`](../architecture/decisions/ADR-003-state-and-persistence.md).
- [`ADR-004-domain-and-platform-boundaries.md`](../architecture/decisions/ADR-004-domain-and-platform-boundaries.md).
- [`ADR-008-posthog-analytics-and-cost-guardrails.md`](../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md).
- [`US-02-04_IMPLEMENTATION_PLAN.md`](./US-02-04_IMPLEMENTATION_PLAN.md), bootstrap mapper consumer
  và readiness boundary baseline.

## 14. Change log

### 0.4.0 — 2026-08-28

- Implement Application-owned typed contracts, canonical fail-closed mappers và capability-specific
  SQLite repositories cho đủ `10` product/metadata tables; `schema_migrations` giữ migration-owned.
- Wire application-scoped persistence graph, reuse mapper trong bootstrap và giữ graph ngoài
  Presentation facade; không schema/Product/derived-query/recovery/reset scope creep.
- Host `pnpm quality` pass `16` files / `92` tests, gồm real host SQLite close/reopen transaction
  round-trip; device/boundary/hygiene gates pass.
- Thêm dev-only `US-02-05_TYPED_REPOSITORIES` isolated probe/runbook; chuyển implementation sang
  `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`, chờ `T09` exact report và `T10` closeout.

### 0.3.0 — 2026-08-28

- Owner yêu cầu bắt đầu implementation `US-02-05`; Story chuyển `IN_PROGRESS`.
- Giữ authoritative order `T01 → T10`; native/EAS execution thuộc owner-run evidence.
- Không mở `US-02-06` trước host/native closeout.

### 0.2.0 — 2026-08-28

- Ghi nhận Dũng Lư duyệt `US0205-CONFIRM-01`–`04` ngày 2026-08-28.
- Khóa port ownership, explicit transaction participation, capability matrix và fail-closed
  mapper/error boundary theo proposal `0.1.0`.
- Chuyển plan sang `READY_FOR_IMPLEMENTATION`; giữ implementation `NOT_STARTED` và authoritative
  order `US0205-T01 → T10`.

### 0.1.0 — 2026-08-28

- Tạo implementation plan sau khi `US-02-04 DONE` và exact native evidence được chấp nhận.
- Khóa phạm vi typed ports/mappers/adapters cho 10 durable product/metadata tables, exclude
  `schema_migrations` khỏi Product repository.
- Đề xuất bốn confirmation cho ownership, transaction API, capability surface và mapper/error.
- Đặt authoritative solo execution order `T00 → T10`; không triển khai production code/native build.
