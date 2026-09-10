---
document_id: PIXELDORO_US_08_01_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-08-01 Implementation Plan
version: 0.2.0
status: IMPLEMENTED_AWAITING_OWNER_QUICK_UI
implementation_status: IMPLEMENTED_UNCOMMITTED_CANDIDATE
date: 2026-09-10
last_updated: 2026-09-10
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-08
planning_baseline_sha: 6e68fe5d800342e187f267f356b08335ace9a6b6
implementation_start_sha: 41e46df9cc122a56b60cfc08ee72dee3a351a2c7
exact_implementation_sha: null
previous_epic: EPIC-07
previous_epic_status: DONE_OWNER_ACCEPTED
previous_epic_implementation_sha: f6c7b9269b2abee07bfe8eeb5d804c6245b67c0a
manual_device_status: NOT_RUN
formal_tester_status: NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED
schema_change: NONE_PROPOSED
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
scope:
  - mobile_mvp
  - epic_08
  - us_08_01
  - committed_progression
  - production_catalog
  - read_only_shop
  - shop_viewed_analytics
authority: APPROVED_IMPLEMENTATION_PLAN
story_baseline: ./EPIC-08_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
gamification_baseline: ../specifications/gamification-rules.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
adr_analytics: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# US-08-01 — Committed Progression và Production Catalog

## 0. Mục đích, outcome và gate

Tài liệu này chuyển `US-08-01` trong breakdown EPIC-08 thành implementation plan đã được owner duyệt
và được triển khai thành candidate chưa commit. Không có thay đổi migration/schema,
package/dependency hoặc native configuration; chưa commit và chưa push.

**User outcome:** user mở Pet Room hoặc tab Cửa hàng và thấy cùng một Level/XP/Coin committed, cùng
đúng 12 item catalog đã duyệt, price/ownership/equipped state đọc từ SQLite; Shop không còn mock Coin,
sample item, prototype controls hoặc action giả.

**Priority/order:** `P0 / 1` trong EPIC-08.

**Blocks:** `US-08-02 — Atomic One-time Purchase`. Story 02 không được mở trước khi owner chấp nhận
candidate read-only này, gồm catalog identity, projection ownership, UI states và no-write evidence.

**Planning status:** `APPROVED_OPTION_A_01_TO_05`.
**Implementation status:** `IMPLEMENTED_UNCOMMITTED_CANDIDATE_AWAITING_OWNER_QUICK_UI`.

### 0.1. Baseline và working-tree audit

| Fact | Kết quả |
|---|---|
| Branch | `feats/epic-08` |
| Implementation start HEAD / origin | `41e46df9cc122a56b60cfc08ee72dee3a351a2c7`; trùng `origin/feats/epic-08` |
| Commit gần nhất trước production edit | `41e46df Epic 08 - US-08-01` (planning documents only) |
| EPIC-07 | `DONE_OWNER_ACCEPTED`; exact implementation SHA `f6c7b926...` |
| Existing worktree delta trước plan | `docs/planning/EPIC-08_USER_STORIES.md` là untracked owner work; giữ nguyên |
| EPIC-08 implementation | US-08-01 candidate đã implement trên working tree, chưa commit |
| Breakdown confirmations | `US0800-CONFIRM-01→11` đã ghi `APPROVED_OPTION_A` ngày 2026-09-10 |
| Story gate | Owner duyệt `US0801-CONFIRM-01→05 theo Option A` và authorize coding ngày 2026-09-10 |

### 0.2. Readiness checklist trước implementation

- [x] Product Core, Gamification Rules, Data Model, architecture/ADR và EPIC-08 breakdown đã đối chiếu.
- [x] EPIC-07 exact accepted implementation và current HEAD đã xác minh.
- [x] Existing level projection, profile/catalog/owned repositories, economy verifier, bootstrap,
  controller/composition pattern, Shop prototype, common UI và tests đã audit.
- [x] Schema `001` đủ durable facts và invariant cho read slice; không có migration gap.
- [x] Không cần package, native module, prebuild hoặc permission mới.
- [x] Owner chấp nhận Story breakdown là implementation baseline.
- [x] Owner duyệt `US0801-CONFIRM-01→05 theo Option A` ngày 2026-09-10.
- [x] `implementation_start_sha` được khóa tại `41e46df9...` trước production edit.

## 1. Breakdown review và authority reconciliation

### 1.1. Kết luận review

Breakdown `EPIC-08_USER_STORIES.md` nhất quán với Product Core về read-only scope, exact catalog,
progression, no level gate, offline behavior, prototype retirement và Story ordering. US-08-01 có thể
được triển khai mà không mở purchase/equip transaction của Story 02/03.

Có một correction bắt buộc trong execution fixture:

- `shop_progress_49` không thể tạo bằng production reward semantics: onboarding trial và Standard
  Focus hợp lệ đều cộng XP theo bội số `5`.
- `49 XP` vẫn là Domain/Application unit boundary bắt buộc.
- Device/real-SQLite journey dùng `shop_progress_45` → `shop_progress_50`, đều tạo bằng production
  completed-Focus commands và vẫn chứng minh threshold Level 2 tại `50 XP`.
- Không seed trực tiếp `pet_profiles.total_xp = 49`, không tạo receipt sai formula và không làm verifier
  tin một economy state mà user thật không thể đạt.

### 1.2. Product và technical rules đã khóa

- [x] Level bắt đầu `1` tại `0 XP`; threshold `25 × (L-1) × (L+2) / 2`.
- [x] XP cumulative, không spend, không level-down và không persist level cache.
- [x] Shop có đúng 12 stable ID/name/category/price đã duyệt; toàn bộ visible từ đầu.
- [x] Catalog/persistence là authority; UI không hard-code price hoặc ownership.
- [x] Default Pet/room presentation không phải free catalog item.
- [x] Item status trong Story này chỉ đọc; purchase/equip action chưa xuất hiện.
- [x] `shop_viewed` dùng properties `{}`, local queue, best-effort và không ảnh hưởng product truth.
- [x] Không level-up modal/audio/haptic trong EPIC-08.
- [x] Chỉ Shop prototype owner được retire; History/Settings prototype scaffolding được giữ.
- [x] Owner quick UI là Story gate; formal breadth vẫn deferred theo confirmation đã duyệt.

### 1.3. Current capability và exact gaps

| Capability | Baseline reusable | Exact gap US-08-01 |
|---|---|---|
| Level rule | `deriveLevelProgression`; `createHomeProfileProjection` | Bổ sung threshold/large-safe-input evidence; không tạo formula mới |
| Profile truth | `ProfileRepository`, bootstrap snapshot, `EconomyConsistencyQuery` | Fresh Shop loader + typed error; Home/Shop reusable presentation |
| Catalog | `CatalogRepository.list()` order price/ID; exact migration seed; bootstrap exact verifier | Runtime exact-list validation và production projection |
| Ownership | `OwnedItemRepository.listByProfile(1)` + strict mapper/FK | Join/map read-only `available/owned/equipped` state |
| Serialization | Existing `SessionCommandCoordinator`; all reward writes use it | Reuse as short serialized economy-read window; future purchase must share it |
| Bootstrap/recovery | Ready barrier, refresh, global Recovery, economy verification | Map transient read versus durable corruption consistently |
| Analytics | Typed allowlist, bounded local queue, settings opt-out | `ShopAnalyticsRecorder` + one focus-episode lifecycle owner |
| Home UI | Production stats/progress markup | Reuse one common progression component with Shop; remove duplicate layout only |
| Shop UI | 3 hard-coded prototype cards and controls | Replace whole Shop feature with finite production screen states |
| Common UI | Panel/Button/Header/Shell/Loading/Error/Stat/ProgressionSummary | Extend progression API; add ItemTile + layout-only ItemGrid |
| Navigation | Existing Shop tab and bootstrap boundary | Route/controller hooks + focus refresh; no new route |
| Fixtures/tests | Isolated DB, one-shot port failure, integration/device guide patterns | EPIC-08 finite scenarios and read-only fingerprint proof |

### 1.4. Scope traps phải tránh

1. Không thêm Buy, Preview, Equip, Inventory mode, modal confirmation hoặc disabled fake CTA.
2. Không copy 12 items vào Screen/component/fixture như production truth.
3. Không dùng bootstrap snapshot như fallback sau query failure hoặc catalog corruption.
4. Không đổi migration `001`, `schema-manifest.ts` hoặc migration lock để di chuyển catalog constants.
5. Không dùng raw SQL/repository/Domain function trong route, screen hoặc component.
6. Không tự tính level/progress/affordability trong Presentation.
7. Không coi prototype glyph là approved cosmetic art hoặc room asset.
8. Không tạo catalog empty state như hợp lệ; exact catalog thiếu/thừa/trùng/sai là corruption.
9. Không enqueue analytics mỗi render, Retry hoặc component remount trong cùng focus episode.
10. Không refactor toàn bộ root/prototype/analytics architecture ngoài consumer cần thiết của Story.

## 2. Proposed behavior contract

### 2.1. Read flow

```text
Shop tab gains focus after Bootstrap ready
  → ShopController.activate(focus episode)
      → best-effort shop_viewed once for this episode
      → serialized LoadShopProjection
          → existing EconomyConsistencyQuery.verify(profile 1)
          → CatalogRepository.list()
          → OwnedItemRepository.listByProfile(1)
          → validate exact injected approved catalog contract
          → validate ownership references/uniqueness/profile
          → reuse createHomeProfileProjection(totalXp, coinBalance)
          → freeze ordered Shop projection
      → render production ready state

Retry
  → repeat read only
  → never enqueue another shop_viewed for the same focus episode

Tab loses focus
  → ShopController.deactivate()
  → next focus starts a new view episode and refresh
```

The existing coordinator serializes the short read window against current reward writes and will be
the required coordinator for Story-02 economy writes. No new transaction or query port is introduced
unless implementation tests demonstrate that this window cannot preserve the approved invariant.

### 2.2. Application projection

```ts
type ShopItemState = 'available' | 'owned' | 'equipped';

interface ShopItemProjection {
  readonly id: string;
  readonly displayName: string;
  readonly category: 'furniture';
  readonly priceCoins: number;
  readonly state: ShopItemState;
}

interface ShopProjection {
  readonly profile: HomeProfileProjection;
  readonly items: readonly ShopItemProjection[];
}
```

Projection không chứa buy eligibility, action label, image/asset ID, rarity, slot, level gate hoặc
dynamic price. Story 02 phải bổ sung action projection từ authoritative command policy, không suy ra
từ UI state đã ship ở Story 01.

### 2.3. Error taxonomy

| Application error | Meaning | Presentation/recovery |
|---|---|---|
| `SHOP_READ_FAILED` | Repository/query unavailable or transient read failure | Local ErrorState + Retry; previous data policy theo CONFIRM-03 |
| `SHOP_ECONOMY_INCONSISTENT` | XP/Coin không reconcile receipt ledger | Global Recovery `BOOTSTRAP_ECONOMY_INVARIANT_FAILED` |
| `SHOP_PROFILE_INVALID` | Missing/invalid profile projection | Global Recovery `DURABLE_DATA_CORRUPT` |
| `SHOP_CATALOG_INVALID` | Missing/extra/duplicate/wrong exact item/version/order contract | Global Recovery `DURABLE_DATA_CORRUPT` |
| `SHOP_OWNERSHIP_INVALID` | Foreign/duplicate/wrong-profile ownership facts | Global Recovery `DURABLE_DATA_CORRUPT` |

Không error nào fallback sang hard-coded/mock catalog. Analytics error không nằm trong Shop projection
và không đổi ready/error/recovery result.

### 2.4. UI state contract

| State | Visible behavior |
|---|---|
| First loading | Header + full LoadingState; không mock balance/item |
| Ready | Compact committed progression + đủ 12 ordered ItemTile |
| Ready/owned | Tile nói rõ `Đã sở hữu`; no action |
| Ready/equipped | Tile nói rõ `Đang trang bị`; no action |
| Focus refresh | Giữ hoặc thay ready surface theo CONFIRM-03; không flash mock/empty |
| Transient read error | Safe non-technical copy + `Thử lại`; Retry chỉ đọc |
| Durable corruption | Existing global Recovery; no catalog interaction |
| Empty catalog | Không phải EmptyState; classify corruption |

## 3. Technical directions

### TD-08-01-A — Reuse the migration-owned catalog contract without editing migration sources

`INITIAL_CATALOG_SEED` hiện là exact executable copy của Product catalog và thuộc immutable migration
source set. Plan không di chuyển hoặc sửa `schema-manifest.ts`, vì thay source set sẽ làm migration
checksum drift dù dữ liệu giữ nguyên.

Thay vào đó, `LoadShopProjectionUseCase` nhận một immutable `approvedCatalog` dependency hẹp. Mobile
composition inject `INITIAL_CATALOG_SEED` cộng approved `catalogVersion = 1`; unit tests inject fixtures.
Application owns comparison behavior:

- exact count `12`;
- exact stable ID/name/category/price/version;
- no duplicate ID;
- exact price-then-ID order;
- no extra/missing record;
- freeze returned projection.

Như vậy có một executable data source, không import mobile Infrastructure vào shared Application và
không tạo Domain/UI catalog copy thứ hai.

### TD-08-01-B — A shared Application use case owns the read projection

Tạo `packages/application/src/shop/load-shop-projection.use-case.ts` với dependencies:

```ts
interface LoadShopProjectionDependencies {
  readonly economy: EconomyConsistencyQuery;
  readonly catalog: Pick<CatalogRepository, 'list'>;
  readonly ownedItems: Pick<OwnedItemRepository, 'listByProfile'>;
  readonly approvedCatalog: readonly ApprovedCatalogItem[];
}
```

Use case:

1. verify profile `1` economy bằng query hiện có;
2. list catalog và owned rows qua ports hiện có;
3. phân biệt technical read error với persistence corruption/invariant mismatch;
4. validate exact approved catalog và ownership relationship;
5. reuse `createHomeProfileProjection` để derive level/progress;
6. map mỗi catalog record sang exactly one read-only state;
7. trả typed frozen result, không write, clock, ID, navigation hoặc analytics.

Không tạo `ShopRepository`, joined SQLite query hoặc transaction-scoped list methods trong Story này.
Nếu race test chứng minh serialized window chưa đủ, implementation dừng và re-plan thay vì âm thầm
mở rộng persistence ports.

### TD-08-01-C — One Shop controller owns focus, refresh and stale work

Tạo mobile `ShopController` với external-store projection và narrow actions:

```ts
type ShopControllerProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly shop: ShopProjection; readonly refreshing: boolean }
  | { readonly status: 'error'; readonly code: 'SHOP_READ_FAILED' };

activate(): Promise<void>;
deactivate(): void;
retry(): Promise<void>;
```

Controller responsibilities:

- activate once per navigation focus episode;
- coalesce duplicate activate/retry while same load is running;
- generation guard drops stale completion after deactivate/new episode/dispose;
- no fake catalog and no error-code-to-copy mapping;
- publish only immutable Application projection;
- call critical recovery for typed durable corruption per CONFIRM-02;
- record analytics once per focus episode, independent from load outcome;
- Retry never creates a second analytics event;
- dispose invalidates pending work and listeners.

### TD-08-01-D — Shop analytics is a separate best-effort recorder

Tạo `ShopAnalyticsRecorder` theo existing onboarding/focus/break recorder pattern:

```text
eventName   = shop_viewed
eventId     = shop_viewed:<focusEpisodeId>
properties  = {}
occurredAt  = focus activation timestamp
TTL/cap     = existing bounded queue policy
```

`focusEpisodeId` do injected `IdPort` tạo một lần trong `activate`; `ClockPort` cung cấp timestamp.
Analytics setting đọc từ ready bootstrap snapshot. Disabled/throw/queue failure đều best-effort,
không đổi Shop state, không Retry/backfill và không mở provider delivery của EPIC-11.

### TD-08-01-E — Dedicated composition slice prevents more root responsibility

Tạo `apps/mobile/src/composition/shop/create-shop-slice.ts` để:

- bind migration-owned approved catalog descriptor;
- tạo `LoadShopProjectionUseCase`;
- wrap `execute()` qua existing shared coordinator;
- tạo analytics recorder và `ShopController`;
- expose narrow `{ shop, dispose }`.

`create-mobile-application.ts` hiện `1,145` dòng; root chỉ được instantiate slice, expose facade và
dispose. Không nhét validation, read orchestration, fixture mutation hoặc focus-episode state vào root.

### TD-08-01-F — Common progression component serves Home and Shop

Extend `ProgressionSummary` bằng discriminated API, giữ backward compatibility cho completed Result:

```ts
type ProgressionSummaryProps =
  | { readonly variant?: 'result'; readonly totalXp: number; readonly coinBalance: number }
  | { readonly variant: 'full' | 'compact'; readonly progression: HomeProfileProjection };
```

- `result`: current Standard/Trial Result appearance and semantics unchanged.
- `full`: Home owns Level/XP/Coin + progressbar + XP-to-next in one common component.
- `compact`: Shop shows same committed values with denser spacing.
- Component chỉ render pre-derived percentage/xp-to-next; không import Domain formula.
- Home removes its duplicate progress markup and uses `variant="full"`.
- Existing Result consumers keep `result` variant and receive regression tests.

### TD-08-01-G — ItemTile and ItemGrid are common presentation primitives

Create common `ItemTile` and `ItemGrid` now because Shop catalog and accepted Inventory mode are two
confirmed consumers:

- `ItemTile` receives presentation-ready identity/name/price/state; no repository, formula or price
  command payload.
- Story 01 has no press/action prop. Story 02/03 may extend a reviewed action slot instead of shipping
  disabled/no-op affordance now.
- State always uses text (`Có thể mua`, `Đã sở hữu`, `Đang trang bị`); color is supplemental.
- Neutral visual treatment follows CONFIRM-04 and is hidden from accessibility if decorative.
- Whole tile exposes one grouped accessible name/value/state; no misleading button role.
- `ItemGrid` owns responsive wrapping/layout/stable keys only; no data mapping/filter/order logic.
- Both stay below 240 lines initially and have independent component tests.

### TD-08-01-H — Production Shop route replaces only its prototype owner

`apps/mobile/src/app/(tabs)/shop.tsx` becomes route composition:

- subscribes via `useShopProjection`;
- obtains `activate/deactivate/retry` via hook;
- uses `useFocusEffect` for exact tab focus episode;
- renders `ShopScreen` with typed props;
- contains no repository, analytics event creation, catalog data or business rule.

`ShopScreen` uses `ScreenShell`, `ScreenHeader`, `ProgressionSummary`, `ItemGrid`, `ItemTile`,
`LoadingState`, `ErrorState` and optional `InlineNotice`. It removes `PrototypeScreen`,
`PrototypeBadge`, `PrototypeControls`, `ControlButton`, sample array, mock balance, fake action and local
review-state reducer from Shop only. Root PrototypeProvider and History/Settings consumers remain.

### TD-08-01-I — Finite fixtures exercise production boundaries

Tạo `create-shop-review-fixture.ts` với environment
`EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE` và dedicated database prefix `pixeldoro-us-08-01-`:

| Scenario | Setup |
|---|---|
| `shop_fresh_zero` | Fresh migrated DB, direct dev review deep link; zero profile, exact catalog |
| `shop_progress_45` | Three valid completed 15-minute Standard Focus rewards |
| `shop_progress_50` | Two valid completed 25-minute Standard Focus rewards |
| `shop_owned_mixed` | Valid rewards then catalog-authoritative debit + receipt + owned rows in isolated transaction |
| `shop_read_failure_once` | One-shot decorated read failure, then delegate to production ports |
| `shop_catalog_corrupt` | Decorated catalog returns one deterministic identity mismatch; normal DB unchanged |

Fixture selection is dev-only/default-absent. Unknown values do nothing. Seeded durable facts use
production commands/repositories and isolated SQLite. The two failure scenarios decorate ports only;
they do not patch normal user data or add a production bypass flag.

## 4. Component reuse và screen composition

### 4.1. Common Component Reuse Matrix

| UI need | Existing | Decision | Scope | Consumers/regression |
|---|---|---|---|---|
| Screen shell/header | `ScreenShell`, `ScreenHeader` | Reuse unchanged | Common | Home/Shop/all current screens |
| Surface/card | `Panel`/`PixelPanel` | Reuse through common components | Common | All Panel consumers |
| Progression/balance | `ProgressionSummary`, Home markup | Extend discriminated variants | Common | Home, Shop, Standard/Trial Result |
| Stat | `StatDisplay` | Reuse inside summary | Common | Existing summaries/Home/Shop |
| Item tile | None; prototype card invalid | Create `ItemTile` | Common | Shop now, Inventory accepted next |
| Grid | None | Create layout-only `ItemGrid` | Common | Shop now, Inventory accepted next |
| Loading/error | `LoadingState`, `ErrorState` | Reuse unchanged unless proven gap | Common | Bootstrap/features/Shop |
| Notice | `InlineNotice` | Reuse only for refresh failure policy | Common | Existing consumers + Shop |
| Button | Existing Button family | Retry comes from `ErrorState`; no item CTA | Common | No new action API in Story 01 |
| Art/avatar | Pet components/prototype glyph | Do not reuse as item art | N/A | Neutral decorative marker only |

### 4.2. Screen Composition Matrix

| Screen | Hook/controller | Common components | Navigation | Maximum responsibility |
|---|---|---|---|---|
| Home/Pet Room | Existing bootstrap profile + Pet hooks | ProgressionSummary full, Pet, panels/buttons | Existing Focus/Shop tabs | Compose committed profile/Pet; no derivation/write |
| Shop route | Shop projection/actions | None directly | Focus activate/deactivate in existing tab | Subscribe and pass typed state only |
| Shop screen | None beyond props | Shell/Header/Summary/Grid/Tile/states | No nested route/action | Map finite state to UI copy/layout |

### 4.3. Size and responsibility gates

- [ ] No component exceeds 300 lines.
- [ ] Any file reaching 240–260 lines gets explicit split review before merge.
- [ ] Screen contains no catalog constants, level formula, SQL, repository or queue call.
- [ ] ItemGrid contains no filter/sort/state mapping.
- [ ] ItemTile contains no purchase/equip business decision.
- [ ] Common changes run every current consumer regression.

## 5. Navigation, focus và recovery matrix

| From/state | Trigger | Expected result | No-write guarantee |
|---|---|---|---|
| Home ready | Tap Cửa hàng tab | First load → production Shop | No reward/purchase/ownership write |
| Shop ready | Switch tab then return | New focus episode, fresh read, one new view event | Economy fingerprint unchanged |
| Shop loading | Duplicate focus callback | One coalesced read/event episode | No duplicate durable product write |
| Shop error | Retry | Read only; same view episode | No new `shop_viewed` |
| Shop ready | Back/reselect | Existing tab semantics, no mutation | Economy fingerprint unchanged |
| Offline/relaunch | Open Shop | Local committed projection | No network/provider dependency |
| Transient read failure | Retry | Recover to current SQLite facts | No hard-coded fallback |
| Catalog/profile/owned corrupt | Any load | Global Recovery | No render/action against invalid facts |

## 6. Planned file impact

Indicative new files:

- `packages/application/src/shop/load-shop-projection.use-case.ts` + test.
- `apps/mobile/src/application/shop/shop.controller.ts` + test.
- `apps/mobile/src/application/shop/shop-analytics.recorder.ts` + test.
- `apps/mobile/src/application/shop/index.ts`.
- `apps/mobile/src/composition/shop/create-shop-slice.ts` + test.
- `apps/mobile/src/composition/review/shop-review-fixture.ts` + test.
- `apps/mobile/src/presentation/components/item-tile.tsx` + test.
- `apps/mobile/src/presentation/components/item-grid.tsx` + test.
- `apps/mobile/src/presentation/features/shop/index.test.tsx`.
- `apps/mobile/test/integration/shop-projection.integration.test.ts`.
- `apps/mobile/test/integration/epic-08-shop-route-integrity.integration.test.ts`.
- `apps/mobile/test/device/progression-catalog-smoke.md`.
- `docs/planning/US-08-01_IMPLEMENTATION_REPORT.md` after implementation.

Indicative modified files:

- `packages/application/src/index.ts` — public Shop projection exports.
- `packages/domain/src/progression/level-progression.test.ts` — exact boundaries/large safe values only.
- `apps/mobile/src/application/index.ts` — Shop controller/recorder exports.
- `apps/mobile/src/application/mobile-application.facade.ts` — narrow Shop controller surface.
- `apps/mobile/src/composition/create-mobile-application.ts` — compose/dispose Shop slice only.
- `apps/mobile/src/presentation/providers/mobile-application-context.tsx` — Shop projection/actions hooks.
- `apps/mobile/src/presentation/components/progression-summary.tsx` + tests — variants.
- `apps/mobile/src/presentation/components/index.ts` — common exports.
- `apps/mobile/src/presentation/features/home/index.tsx` + tests — common full summary.
- `apps/mobile/src/presentation/features/shop/index.tsx` — production state rendering.
- `apps/mobile/src/app/(tabs)/shop.tsx` — focus lifecycle route composition.
- Device validator allowlist only if the new guide pattern requires it.

Explicitly unchanged:

- all migration files, `schema-manifest.ts`, migration lock/checksum;
- database schema/index/trigger/seed values;
- package manifests/lockfile/native folders/config;
- purchase/equip repositories and commands;
- Pet/room assets and rendering;
- History/Settings prototype consumers.

## 7. Ordered implementation tasks

| Order | Task | Output | Depends/gate |
|---:|---|---|---|
| T00 | Confirmation + start baseline | Approved plan IDs; recorded start SHA | Owner only |
| T01 | Application projection | Typed loader, validation, unit tests, exports | T00 |
| T02 | Controller + analytics | Focus lifecycle, retry/recovery, recorder tests | T01 |
| T03 | Shop composition slice | Existing coordinator/repositories/queue wiring | T01–02 |
| T04 | Common progression | Full/compact/result variants + all-consumer regressions | T00 |
| T05 | Common item presentation | ItemTile/ItemGrid + semantics/layout tests | T00 |
| T06 | Production route/screen | Replace Shop prototype owner; finite states | T02–05 |
| T07 | Review fixtures | Isolated DB, reachable XP, failures/corruption | T03/06 |
| T08 | Integration/integrity | SQLite/relaunch/no-write/navigation/prototype scans | T01–07 |
| T09 | Candidate evidence | Quality, exports, guide/report, diff checks | T08 |

### T00 gate

- [x] Owner confirms `US0801-CONFIRM-01→05 theo Option A`.
- [x] Breakdown correction `49 durable fixture → 45` is reflected in the approved baseline.
- [x] No pre-existing worktree conflict existed in planned production files.
- [x] `implementation_start_sha` was recorded before T01/T04/T05 edits.

### T01–T03 gate

- [x] Loader has no UI/mobile/SQL import and returns frozen typed projection.
- [x] Approved catalog enters through composition dependency; no production copy is added.
- [x] Existing economy verifier and repositories are reused.
- [x] Coordinator serializes projection read; no nested transaction/deadlock.
- [x] Controller separates transient Retry from durable Recovery.
- [x] Analytics failure/disabled state cannot affect Shop projection.

### T04–T06 gate

- [x] Existing Result `ProgressionSummary` semantics remain regression-covered.
- [x] Home/Shop render same provided committed profile values.
- [x] Shop contains exactly one grid source from projection and no hard-coded samples.
- [x] Tiles have no interactive role/action in this Story.
- [x] Prototype imports/controls/mock copy are absent only from Shop owner.
- [ ] Largest text can scroll and never clips price/status/action-free tiles.

### T07–T09 gate

- [x] Every fixture uses a dedicated database and/or scoped decorated port; guide defines cleanup.
- [x] `45→50` device fixture uses production completed reward commands.
- [x] Real SQLite close/reopen returns exact projection.
- [x] Product table fingerprints prove projection reads are read-only.
- [x] Manual/formal status remains `NOT_RUN` until actually executed.
- [x] Exact candidate SHA is not claimed before an authorized commit exists.

## 8. Automated test strategy

### 8.1. Domain/Application unit

- [ ] `deriveLevelProgression`: `0`, `49`, `50`, `124`, `125`, multi-level `160`, invalid negatives/
  fractions/unsafe values and highest practical safe threshold behavior.
- [ ] Profile projection: nonnegative Coin, exact percent/xp-to-next and invalid values.
- [ ] Shop loader happy path: exact 12 price/ID order, zero and progressed profile.
- [ ] All item states: available, owned, equipped; multiple owned/equipped accepted.
- [ ] Missing/extra/duplicate/wrong ID/name/category/price/version catalog fails closed.
- [ ] Foreign/duplicate/wrong-profile ownership facts fail closed.
- [ ] Economy mismatch maps differently from technical read failure.
- [ ] Every dependency throw maps to finite typed error.
- [ ] Repeated execute performs no write and returns immutable projection.

### 8.2. Controller/analytics/composition

- [ ] idle → loading → ready; first failure → error → Retry → ready.
- [ ] Same-episode activate/retry coalesces; stale response after deactivate is dropped.
- [ ] Refocus creates a new read/view episode; retry does not create another event.
- [ ] Corruption invokes exact critical-recovery reason once.
- [ ] Analytics enabled/disabled/queue failure/throw/dedupe and `{}` properties.
- [ ] `shop_viewed:<focusEpisodeId>` uses injected deterministic ID/time and existing TTL.
- [ ] Slice wires approved catalog and coordinator without exposing Infrastructure to Presentation.
- [ ] Dispose invalidates pending loads/listeners.

### 8.3. Component/navigation

- [ ] Progression result/full/compact variants; exact labels/progress values.
- [ ] Standard Result and Trial Result retain accepted summary behavior.
- [ ] Home uses full common summary; Shop uses compact common summary.
- [ ] ItemTile available/owned/equipped label is non-color-only and grouped for screen reader.
- [ ] ItemGrid preserves input order/stable key and fits small/large text layouts.
- [ ] Shop loading/ready/transient error; exact 12 tiles; no empty-as-valid state.
- [ ] Shop route calls activate/deactivate per focus and Retry action only.
- [ ] No purchase/equip callback or disabled fake CTA exists.

### 8.4. Real SQLite/integrity/regression

- [ ] Fresh migration returns exact zero profile + 12 catalog + zero ownership.
- [ ] Valid reward receipts project `45` and `50` correctly; close/reopen preserves values.
- [ ] Valid purchase/owned fixture maps owned/equipped without future UI action.
- [ ] One-shot read failure recovers; catalog corrupt scenario never falls back.
- [ ] Economy fingerprint before/after render/focus/retry/navigation is identical.
- [ ] Concurrent completed reward versus coordinated Shop read returns one wholly committed version.
- [ ] Existing bootstrap, reward, Pet, Home, Focus and Break integration suites pass.
- [ ] Static scan: Shop route/feature has no prototype/repository/SQL/Domain import or mock copy.
- [ ] Static scan: no new/modified component >300 lines; review at 240–260.
- [ ] Migration source set/checksum and schema object count remain unchanged.

### 8.5. Candidate commands

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
pnpm exec vitest run packages/domain/src/progression packages/application/src/shop \
  apps/mobile/src/application/shop apps/mobile/src/composition/shop \
  apps/mobile/src/presentation/components apps/mobile/src/presentation/features/home \
  apps/mobile/src/presentation/features/shop apps/mobile/test/integration/shop-projection.integration.test.ts \
  apps/mobile/test/integration/epic-08-shop-route-integrity.integration.test.ts
pnpm quality
pnpm --filter @pixeldoro/mobile exec expo export --platform ios --output-dir /tmp/pixeldoro-us0801-ios
pnpm --filter @pixeldoro/mobile exec expo export --platform android --output-dir /tmp/pixeldoro-us0801-android
pnpm --filter @pixeldoro/mobile run doctor
git diff --check
```

Export output directories are disposable and must not be committed. Doctor warnings that predate the
Story are recorded, not opportunistically fixed through dependency/native changes.

## 9. Manual device guide plan

Planned file: `apps/mobile/test/device/progression-catalog-smoke.md`.
Initial status: `NOT_RUN`.

### 9.1. Main command and deep links

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=shop_fresh_zero pnpm start --clear
xcrun simctl openurl booted 'pixeldoro://shop?review=us0801'
adb shell am start -W -a android.intent.action.VIEW -d 'pixeldoro://shop?review=us0801'
```

### 9.2. Executable checklist

- [ ] Record SHA/build/platform/device/OS/timezone/network/text/a11y settings.
- [ ] `shop_fresh_zero`: Level 1, 0 XP, 0 Coin, exact 12 items/prices; no mock/prototype/action.
- [ ] `shop_progress_45`: Level 1, 45 XP, còn 5 XP tới Level 2.
- [ ] `shop_progress_50`: Level 2 at exact threshold and Home/Shop parity.
- [ ] `shop_owned_mixed`: available/owned/equipped labels correct; no tappable fake action.
- [ ] `shop_read_failure_once`: safe error then Retry succeeds without second view event.
- [ ] `shop_catalog_corrupt`: no partial/fake catalog; approved Recovery path appears.
- [ ] Switch Home↔Shop repeatedly; verify refresh policy, no flicker/incorrect stale state.
- [ ] Airplane mode, background/foreground and cold relaunch retain local values.
- [ ] Largest text, grayscale, Reduce Motion, VoiceOver/TalkBack and touch/reading order.
- [ ] Repeat on available iOS and Android target; record actual PASS/FAIL/BLOCKED only.
- [ ] Capture screenshots/recording, fixture DB name, analytics count and before/after economy counts.
- [ ] Cleanup: stop server, unset variable and delete only exact disposable fixture databases.

## 10. Acceptance criteria

- [x] Shop route/feature has no PrototypeBadge/Controls/Screen, sample item array, mock Coin or fake CTA.
- [x] Ready state displays exact 12 approved IDs/names/category/prices from committed SQLite facts.
- [x] Catalog order is exact price then stable ID and all items are visible at Level 1/0 XP/0 Coin.
- [x] No rarity/filter/locked/coming-soon/level-gate/purchase/equip behavior is introduced.
- [x] Level/XP/Coin uses one Application projection rule and reusable Home/Shop presentation.
- [x] Home and Shop show the same committed profile facts after relevant refresh.
- [x] Owned/equipped labels are truthful and read-only; unavailable rows fail closed.
- [x] Missing/extra/duplicate/corrupt catalog/profile/ownership never renders hard-coded fallback.
- [x] Transient read error has Retry; durable invariant violation enters approved Recovery.
- [x] Render/focus/retry/back/offline/relaunch creates zero reward/purchase/ownership/equip write.
- [x] `shop_viewed` is local/best-effort, `{}`, once per focus episode and never affects Shop truth.
- [x] Screen imports only hooks/common components and stays below responsibility/size gates.
- [ ] UI meaning survives largest text, grayscale, Reduce Motion and screen reader.
- [x] Focus/Break/Pet/Home/Result/bootstrap behavior remains regression-green.
- [x] No schema/migration/dependency/native change exists.
- [x] Manual/formal evidence status is recorded honestly as `NOT_RUN`.

## 11. DoR, DoD và next gate

### 11.1. Definition of Ready

- [x] Owner accepts the US-08-01 breakdown and this plan's Option A confirmations.
- [x] Fixture correction `49 durable → 45 durable; 49 unit-only` is accepted with the implementation baseline.
- [x] Planned API/recovery/refresh/neutral visual/analytics timing is settled.
- [x] Existing worktree changes are preserved and conflicts re-audited.
- [x] Start SHA is recorded and implementation began only after authorization.

### 11.2. Definition of Done

- [x] All automated acceptance/checklists pass: full quality `163 files / 856 tests`.
- [x] Real SQLite, coordinator race, close/reopen, corrupt/read-failure and no-write tests pass.
- [x] Production Shop-only prototype owner is removed; later consumers remain intact.
- [x] Common changes pass all current consumers and size gates.
- [x] iOS/Android JS exports pass; Doctor `20/21` patch drift is recorded.
- [x] Device guide exists and keeps actual manual/formal status `NOT_RUN`.
- [x] Implementation report records files, decisions, tests, evidence and uncommitted candidate identity.
- [x] No migration/schema/dependency/native/package/asset change.
- [x] `git diff --check`, quality, boundaries, repository hygiene and guide validator pass.

### 11.3. Gate mở US-08-02

- [ ] Owner reviews exact US-08-01 candidate on available device/simulator.
- [ ] Owner explicitly accepts US-08-01 and authorizes US-08-02 planning.
- [ ] Purchase implementation remains absent until that gate opens.

## 12. Owner confirmations — resolved

### US0801-CONFIRM-01 — Catalog contract injection

- **Option A — đề xuất:** inject immutable `INITIAL_CATALOG_SEED + version 1` từ composition vào shared
  loader; không sửa/copy migration source.
- **Option B:** tạo catalog constant thứ hai trong Domain/Application rồi giữ parity bằng test.
- **Impact/block:** A tránh checksum drift và duplicate truth; block T01/T03.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

### US0801-CONFIRM-02 — Durable corruption recovery

- **Option A — đề xuất:** technical read failure ở Shop có local Retry; profile/economy/catalog/
  ownership invariant mismatch vào global Recovery.
- **Option B:** giữ mọi lỗi trong Shop local ErrorState.
- **Impact/block:** A fail closed nhất quán với bootstrap; block controller/error acceptance.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

### US0801-CONFIRM-03 — Refocus refresh UX

- **Option A — đề xuất:** first load dùng full LoadingState; refocus giữ last committed ready content với
  subtle refreshing state, transient failure giữ content + inline Retry.
- **Option B:** mọi refresh thay toàn màn hình bằng Loading/ErrorState.
- **Impact/block:** A tránh flicker nhưng controller có thêm `refreshing`; block UI/controller shape.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

### US0801-CONFIRM-04 — Item visual trước art gate

- **Option A — đề xuất:** text-first tile + một neutral pixel marker chung, decorative/a11y-hidden và ghi
  rõ không phải final room art; không dùng prototype glyph.
- **Option B:** text-only tile.
- **Impact/block:** A dễ scan hơn nhưng vẫn không giả định artwork; block ItemTile snapshot/UI review.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

### US0801-CONFIRM-05 — `shop_viewed` timing

- **Option A — đề xuất:** enqueue once ngay khi ready Shop route nhận focus, dù projection load sau đó
  lỗi; Retry không enqueue lại.
- **Option B:** chỉ enqueue sau first ready projection success.
- **Impact/block:** A đo visit intent đúng focus semantics đã duyệt; B đo successful catalog view;
  block controller/analytics tests.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

Owner đã duyệt một lần bằng `Duyệt US0801-CONFIRM-01→05 theo Option A` và authorize coding.
Approval không bao gồm commit/push; candidate tiếp tục chờ quick UI acceptance.

## 13. Impact verdict và deferred boundary

| Area | Verdict |
|---|---|
| Schema/migration | `NONE`; source set/checksum/seed/objects unchanged |
| Dependency/package | `NONE` |
| Native/prebuild/permission | `NONE` |
| Production durable write | `NONE` ngoài best-effort existing analytics queue |
| Art/assets | `NONE`; exact decoration art remains US-08-04 gate |
| Prototype retirement | Shop owner only |
| Formal breadth | Deferred to EPIC-12 unless actually executed/evidenced |

Deferred and not silently promoted: purchase, insufficient balance, confirmation dialog, inventory
mode, equip/unequip, room decoration assets/anchors, rarity/filter, level-up effect, provider delivery,
History/Settings retirement, Pet naming/evolution and Product `OPEN-006/009`.

## 14. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.2.0 | 2026-09-10 | Codex | Recorded owner Option A approval and coding authorization; implementation completed as an uncommitted candidate. Full quality passed 163 files/856 tests; iOS/Android exports passed; Doctor 20/21 with existing Expo patch drift. Manual/formal evidence remains NOT_RUN. |
| 0.1.0 | 2026-09-10 | Codex | Initial implementation plan after breakdown/code audit. Proposed existing-port/coordinator reuse, Shop production composition, common progression/item components, recovery/analytics contract and five owner confirmations. Corrected unreachable durable `49 XP` fixture to reachable `45→50`; no production code created. |
