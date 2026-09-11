---
document_id: PIXELDORO_US_08_03_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-08-03 Implementation Plan
version: 0.4.0
status: DONE_OWNER_ACCEPTED
implementation_status: DONE_OWNER_ACCEPTED
date: 2026-09-11
last_updated: 2026-09-11
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-08
planning_baseline_sha: 5c6791dbec982d7f522e4113180458daf2e9ce95
implementation_start_sha: 5c6791dbec982d7f522e4113180458daf2e9ce95
current_worktree_base_sha: d6399dd7590852c051f671757c3200c8d70b8bc8
exact_implementation_sha: d6399dd7590852c051f671757c3200c8d70b8bc8
previous_story: US-08-02
previous_story_status: DONE_OWNER_ACCEPTED
previous_story_implementation_sha: 5c6791dbec982d7f522e4113180458daf2e9ce95
manual_device_status: PASS_OWNER_QUICK_UI
formal_tester_status: NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED
schema_change: NONE_PROPOSED
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
scope:
  - mobile_mvp
  - epic_08
  - us_08_03
  - durable_inventory
  - free_multi_equip
  - item_equipped_analytics
authority: PLANNING
story_baseline: ./EPIC-08_USER_STORIES.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
data_model_baseline: ../architecture/data-model.md
gamification_baseline: ../specifications/gamification-rules.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
adr_analytics: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# US-08-03 — Durable Inventory và Free Equip

## 0. Outcome, scope và gate

**User outcome:** user chuyển giữa `Cửa hàng` và `Đã sở hữu` trong cùng Shop tab, thấy đúng inventory
đã commit, rồi trang bị/tháo từng decoration miễn phí. Nhiều item có thể cùng equipped; trạng thái
cuối giữ đúng sau refocus hoặc relaunch và không bao giờ làm đổi Coin/XP/receipt/ownership.

**Planning status:** `APPROVED_OPTION_A_01_TO_06`.
**Implementation status:** `DONE_OWNER_ACCEPTED` tại exact committed/pushed SHA `d6399dd...`.

Owner đã quick-smoke accept US-08-02 tại exact committed/pushed SHA `5c6791d...` và duyệt
`US0803-CONFIRM-01→06` theo Option A. Candidate đã được commit/push và owner quick-smoke PASS:
không crash, behavior đúng kỳ vọng. Không đổi migration, dependency hoặc native config; structured/
formal device breadth vẫn `NOT_RUN`.

### 0.1. In scope

- `Cửa hàng` / `Đã sở hữu` modes trong cùng Shop tab, không thêm route/tab mới.
- Empty inventory; owned unequipped; equipped; submitting; success; same-state; not-owned; technical,
  corrupt và committed-refresh-pending states.
- Command chỉ nhận stable `itemId` + boolean desired state; chỉ update owned row đã tồn tại.
- Equip/unequip miễn phí, multi-equip, idempotent, serialized qua coordinator hiện hữu.
- Exact transaction postcondition/readback và committed projection refresh; không optimistic truth.
- Best-effort deterministic `item_equipped` chỉ cho fresh false→true.
- Dev-only fixture, real SQLite/race/UI tests, device guide và implementation report.

### 0.2. Out of scope

- Slot/one-item-only wardrobe, drag/drop, room placement, decoration art hoặc Pet Room rendering.
- Auto-equip khi mua, equipment cost/refund, delete ownership, quantity/rarity/filter/search.
- `item_unequipped`, audio/haptic/animation required for truth hoặc remote analytics delivery.
- Schema/migration, dependency/package, native/prebuild/permission changes.
- US-08-04 exact art candidate and fixed room-anchor integration.

## 1. Baseline audit

### 1.1. Accepted upstream

| Fact | Evidence |
|---|---|
| US-08-01 accepted | Exact SHA `9be0a0f...` |
| US-08-02 accepted | Exact SHA `5c6791dbec982d7f522e4113180458daf2e9ce95`; owner quick UI PASS |
| Current branch | `feats/epic-08`; planning baseline equals origin |
| Quality at US-08-02 | 166 files / 874 tests, typecheck/lint/boundaries/hygiene and iOS/Android exports PASS |
| Manual breadth | Owner quick UI PASS; structured/formal fixture/a11y breadth remains `NOT_RUN` |

### 1.2. Existing reusable capability

| Area | Existing capability | US-08-03 decision |
|---|---|---|
| Durable model | `owned_items(profile_id,item_id)` with `is_equipped`, `equipped_at`, `updated_at` | Reuse exactly |
| Backstops | FK ownership→purchase/catalog/profile; check + trigger enforce flag/timestamp shape | No migration |
| Multi-equip | No slot/unique-equipped constraint; approved index supports many equipped rows | Preserve; never clear siblings |
| Repository | `find`, `findInTransaction`, `listByProfile`, `setEquippedInTransaction` | Sufficient; no raw SQL gap |
| Receipt read | `findByProfileAndItemInTransaction` from US-08-02 | Reuse for ownership coherence |
| Catalog read | `findByIdInTransaction` + exact approved seed mapping | Reuse for stable item authority |
| Projection | Shop already verifies economy/catalog/ownership and returns `available/owned/equipped` | Reuse if CONFIRM-01 A |
| Serialization | One application-scoped `SessionCommandCoordinator` owns reward/purchase/Shop reads | Equip joins same instance |
| UI | `ItemGrid`, `ItemTileAction`, `ChoiceChip`, `InlineNotice`, busy buttons | Extend backward-compatibly |
| Analytics | Bounded queue and `item_equipped` allowlist already exist | Add recorder; no provider |

### 1.3. Demonstrated impact verdict

- Existing schema exactly represents owned/equipped truth and approved multi-equip semantics.
- Existing repository already exposes the only mutable operation needed.
- No package/native capability is required.
- Therefore `NO SCHEMA / NO DEPENDENCY / NO NATIVE CHANGE` remains locked unless implementation
  proves a new invariant gap; such a gap stops coding and reopens owner review.

## 2. Locked invariants

1. MVP profile ID remains `1`; `itemId` must be non-empty stable identity.
2. Equip/unequip is valid only for a coherent catalog + receipt + ownership triple.
3. Command accepts desired state, never accepts Coin/XP/price/receipt/timestamps from Presentation.
4. Only `owned_items.is_equipped`, `equipped_at`, `updated_at` may change.
5. Equip sets `isEquipped=true` and one captured safe timestamp for both `equippedAt/updatedAt`.
6. Unequip sets `isEquipped=false`, `equippedAt=null` and updates only `updatedAt`.
7. Same desired state is a zero-write idempotent outcome and preserves all timestamps.
8. An unowned item is rejected with zero mutation; ownership is never inserted/deleted/repaired here.
9. One item transition never changes equipped state of any sibling; multi-equip is normative.
10. UI state changes only after committed projection reload; no optimistic equipped badge.
11. A known/recovered commit is never inverted or replayed because refresh/analytics failed.
12. Analytics cannot affect transaction truth and no unequip event is emitted.

## 3. Proposed Application contract

### 3.1. Input and outcomes

Create `packages/application/src/shop/set-item-equipped.use-case.ts`:

```ts
interface SetItemEquippedInput {
  readonly itemId: string;
  readonly isEquipped: boolean;
}

type SetItemEquippedOutcome =
  | {
      readonly outcome: 'fresh_commit' | 'recovery_commit';
      readonly transition: 'equipped' | 'unequipped';
      readonly ownership: OwnedItemRecord;
    }
  | {
      readonly outcome: 'already_in_state';
      readonly ownership: OwnedItemRecord;
    }
  | {
      readonly outcome: 'not_owned';
      readonly itemId: string;
    };
```

`already_in_state` and `not_owned` are successful zero-write business outcomes, not persistence
errors. `not_owned` remains fail-closed and never creates ownership.

### 3.2. Typed errors

- `SET_EQUIPPED_ITEM_ID_INVALID`
- `SET_EQUIPPED_DESIRED_STATE_INVALID`
- `SET_EQUIPPED_ITEM_UNAVAILABLE`
- `SET_EQUIPPED_DATA_INVALID`
- `SET_EQUIPPED_READ_FAILED`
- `SET_EQUIPPED_WRITE_FAILED`
- `SET_EQUIPPED_TRANSACTION_FAILED`
- `SET_EQUIPPED_RESULT_READ_FAILED`

Corrupt/invariant mismatch maps to `SET_EQUIPPED_DATA_INVALID` and global Recovery. Technical
read/write/transaction failures remain local only where durable outcome is proven absent/unknown.

### 3.3. Serialized transaction algorithm

The exact existing application coordinator wraps transaction plus any ambiguous readback:

1. Validate `itemId` and runtime boolean; resolve exact item from injected approved catalog.
2. Capture one safe transition timestamp. Do not allocate an arbitrary command/event ID.
3. Start one `BEGIN IMMEDIATE` transaction.
4. Read actual catalog row and compare exact approved identity/name/category/price/version.
5. Read owned row and purchase receipt for `(profile,item)` in the same transaction.
6. Both absent → `not_owned`, zero write. One-sided/mismatched linkage/price/reason → data invalid.
7. If ownership already equals desired state → `already_in_state`, zero write and preserve timestamps.
8. Call `setEquippedInTransaction` for exactly one owned row. Require `updated`; zero-change after a
   coherent opposite-state pre-read is a write conflict/failure.
9. Re-read ownership + receipt in transaction and assert immutable ownership fields unchanged plus
   exact desired flag/timestamp postcondition.
10. Commit and return `fresh_commit`; controller reloads the full coordinated Shop projection before
    displaying the new state.

No profile/reward/purchase insert/delete API is injected into this command. This makes a Coin/XP/
receipt/ownership mutation structurally unavailable.

### 3.4. Ambiguous transaction result

After a technical transaction result only:

- Read exact catalog, receipt and ownership after the transaction returns, still inside the outer
  coordinator operation.
- Exact desired flag plus this attempt's timestamp proves `recovery_commit`.
- Original opposite flag/timestamp proves no commit and returns `SET_EQUIPPED_TRANSACTION_FAILED`.
- Desired flag with another timestamp, partial facts or mismatched immutable linkage is unproven data
  and returns `SET_EQUIPPED_DATA_INVALID`; do not emit analytics or repair it.
- Same-state preflight never enters ambiguous recovery because it performs no write.

## 4. Shop controller and composition

### 4.1. View mode

Proposed state:

```ts
type ShopViewMode = 'catalog' | 'inventory';
```

- `catalog` shows all 12 items; `inventory` filters the same committed projection to owned/equipped.
- Empty inventory is a valid presentation outcome, not a new query/error state.
- Mode is UI/controller state only and never persisted in SQLite.
- No `LoadInventoryProjection` duplicates repository reads if CONFIRM-01 Option A is approved.

### 4.2. Equip command state

```ts
type ShopEquipProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting'; readonly itemId: string; readonly desired: boolean }
  | { readonly status: 'success'; readonly itemId: string; readonly equipped: boolean }
  | { readonly status: 'already_in_state'; readonly itemId: string; readonly equipped: boolean }
  | { readonly status: 'not_owned'; readonly itemId: string }
  | { readonly status: 'committed_refresh_pending'; readonly itemId: string; readonly equipped: boolean }
  | { readonly status: 'error'; readonly itemId: string };
```

Actions: `setShopViewMode(mode)`, `setItemEquipped(itemId,isEquipped)`,
`retryEquipRefresh()`, `dismissEquipNotice()`.

- Request is accepted only for item currently projected as owned/equipped.
- One UI command is in flight at a time; every equipment action is disabled until committed refresh.
- Use case still serializes and revalidates to protect direct/concurrent/race entry points.
- Known/recovered commit followed by Shop read failure publishes `committed_refresh_pending`; Retry
  executes loader only and never replays or inverses the mutation.
- Deactivate/unmount does not cancel durable work. Stale publish is discarded; refocus reload wins.

### 4.3. Composition

Extend `createShopSlice` with:

- `SetItemEquippedUseCase` using the exact current coordinator, transaction, catalog, purchases and
  owned-items ports;
- existing readiness gate before command entry;
- `ItemEquippedAnalyticsRecorder` using the same bounded side-effect queue;
- no second controller mutex, repository facade, route or durable mode preference.

## 5. Presentation plan

### 5.1. Modes and inventory empty state

- Add an accessible radiogroup/segmented control using backward-compatible `ChoiceChip`:
  `Cửa hàng` and `Đã sở hữu`.
- Catalog mode remains the 12-item Shop. Inventory mode shows only `owned/equipped` items in existing
  stable catalog order.
- Empty copy: `Bạn chưa có vật phẩm nào. Hoàn thành Focus để nhận Coin rồi quay lại Cửa hàng.`
- Empty CTA `Xem cửa hàng` changes local mode only; no navigation or write.

### 5.2. Item actions and copy

- Available catalog item keeps US-08-02 `Mua`/exact-shortfall behavior.
- Owned item action: `Trang bị`; equipped item action: `Tháo`.
- Actions are available on the same owned/equipped tiles in both modes if CONFIRM-01 Option A passes.
- No confirmation dialog for reversible, free equip/unequip if CONFIRM-02 Option A passes.
- Busy copy: `Đang trang bị…` / `Đang tháo…`; all equipment actions disabled during transaction.
- Success: `Đã trang bị <item>.` / `Đã tháo <item>; vật phẩm vẫn thuộc sở hữu của bạn.`
- Same-state: `Trạng thái <item> đã được cập nhật trước đó.`
- Not-owned: `Bạn chưa sở hữu <item>. Coin và vật phẩm không thay đổi.`
- Technical: `Chưa thể xác nhận thay đổi. Trạng thái đã lưu gần nhất vẫn đang hiển thị.`
- Commit/read pending: `Đã ghi nhận thay đổi. Đang đọc lại trạng thái đã lưu.`

### 5.3. Common components

- Extend `ItemTileAction` only as needed for busy/selected semantics; preserve purchase consumer.
- Add a small reusable mode selector or radiogroup wrapper rather than duplicating chip semantics.
- Keep Shop screen under 300 lines; split catalog/inventory controls or notices near 240–260 lines.
- No room art/icon is promoted to durable/equipped truth in this Story.

## 6. Analytics

Add `ItemEquippedAnalyticsRecorder`:

```text
eventName  = item_equipped
eventId    = item_equipped:<itemId>:<equippedAt>
properties = { itemId }
TTL/cap    = existing bounded queue policy
```

- Emit after `fresh_commit` false→true and, if confirmed, exact current-attempt `recovery_commit`.
- Never emit for unequip, same-state, not-owned, corrupt/technical failure or projection refresh.
- Queue disabled/failure/throw cannot alter controller result or durable owned row.

## 7. Navigation, lifecycle and accessibility

| State/event | Planned behavior |
|---|---|
| Enter Inventory | Same Shop route; mode control announces selected state |
| Equip/unequip | Focus stays on exact item action; button announces busy/disabled |
| Command settles | Stable `item.id` key; label/state update only after committed reload |
| Background/unmount | Durable command may finish; stale UI completion is dropped |
| Refocus/relaunch | Coordinated loader reconstructs exact committed item flags |
| Offline/provider down | Local action works; analytics failure is invisible to equip truth |
| Corrupt ownership/receipt | Global Recovery; no repair/fake inventory |

Text state and action are never color-only. `accessibilityState.selected` is reserved for actual
mode selection; tile uses explicit owned/equipped labels rather than inventing single-selection
semantics for multi-equip. Largest text must wrap without hiding mode/actions.

## 8. Planned file impact

### New

- `packages/application/src/shop/set-item-equipped.use-case.ts` + tests.
- `apps/mobile/src/application/shop/item-equipped-analytics.recorder.ts` + tests.
- `apps/mobile/src/composition/review/inventory-equip-review-fixture.ts` + tests.
- `apps/mobile/test/integration/inventory-equip.integration.test.ts`.
- `apps/mobile/test/integration/epic-08-inventory-route-integrity.integration.test.ts`.
- `apps/mobile/test/device/inventory-equip-smoke.md`.
- `docs/planning/US-08-03_IMPLEMENTATION_REPORT.md` at candidate gate.

### Modify

- Application exports; Shop controller/slice/root facade/provider hooks and tests.
- Shop screen and extracted mode/notices if line budget requires it.
- `ItemTile`/`ItemGrid`/`ChoiceChip` only backward-compatibly; all current consumers regress.
- Device guide validator and EPIC-08 planning/status docs.

### Explicitly unchanged

- Repository interface/SQLite equip SQL unless audit changes (current port is sufficient).
- Migration `001`, schema manifest/checksum/seed, packages/lockfile and native config.
- Purchase transaction, reward/session lifecycle, Pet Room visuals and later History/Settings owners.

## 9. Fixture plan

Dedicated prefix `pixeldoro-us-08-03-`; finite dev-only allowlist:

| Fixture | Durable setup / boundary |
|---|---|
| `inventory_empty` | Fresh migrated profile, no purchase |
| `inventory_mixed` | Production rewards + purchases create two owned items; one initially equipped |
| `inventory_multi_equipped` | Three valid purchases; two equipped via production command |
| `equip_unowned` | Direct command harness against visible but unowned catalog item |
| `equip_double_tap` | Controller rapid action; one target row |
| `equip_opposite_race` | Application concurrent desired states through shared coordinator |
| `equip_write_failure_once` | Decorated owned update fails before commit |
| `equip_read_failure_once` | Known commit then projection reload fails once |
| `equip_analytics_failure` | Equip commits; queue failure isolated |

All ownership comes from production purchase commands and reconciled Focus rewards. No fixture inserts
orphan ownership, edits profile balance directly or touches `pixeldoro.db`.

## 10. Automated test strategy

### 10.1. Application

- Invalid item ID/desired runtime value; exact approved/actual catalog mismatch.
- Empty/not-owned zero-write; coherent owned equip/unequip; same-state timestamp preservation.
- Receipt/ownership one-sided or linkage/price mismatch; invalid equipped timestamp shape.
- Read/update/post-read/transaction failures and exact ambiguous commit readback.
- Concurrent same state, opposite state, different items and purchase→equip using one coordinator.
- Assert command receives no profile debit/reward/purchase-insert/delete capability.

### 10.2. Repository and real SQLite

- `setEquippedInTransaction` exact parameters, zero-change and mapped failure/throw.
- Equip then unequip touches only target owned row; Coin/XP/receipt counts and ownership count unchanged.
- Two or more rows remain equipped simultaneously; no sibling clearing.
- Transaction rollback at update/post-read; trigger rejects mismatched flag/timestamp.
- Close/reopen exact equipped state; unowned update changes zero rows.

### 10.3. Controller/presentation/lifecycle

- Mode switch/default/in-memory behavior and valid empty inventory.
- Catalog purchase regression; owned/equipped action labels in both modes.
- Busy global lock, coalesced tap, success/same-state/not-owned/error/recovery notices.
- Known commit refresh failure retries loader only; no second set command or analytics event.
- Deactivate/dispose stale completion; refocus/relaunch committed reload.
- Accessibility role/state/labels/live region, largest-text wrapping and stable keys/focus.
- `ItemTile`, `ItemGrid`, `ChoiceChip`, Break/Focus/Settings consumer regressions.

### 10.4. Analytics/static/platform

- Exact event ID/properties/timestamp; disabled/dedupe/queue failure/throw.
- No event for unequip/same/not-owned/error; exact recovered equip behavior per CONFIRM-06.
- Route has no repository/domain import; no new route/prototype/art/deferred scope.
- Full quality/boundary/hygiene/device validator and iOS/Android JS exports.

## 11. Failure and retry matrix

| Stage | Durable result | Controller/UI | Retry rule |
|---|---|---|---|
| Invalid/unavailable/corrupt item | No write | Recovery or fail-closed local result | Never repair |
| Not owned | No write | Informative notice | Buy in catalog, not equip retry |
| Same desired state | No write | Already-current notice | No command replay |
| Update/post-read application failure | Rollback | Local technical error | New explicit intent allowed |
| Transaction technical, original state read back | No commit proven | Local error | New explicit intent allowed |
| Transaction technical, exact attempt timestamp read back | Commit proven | Refresh committed projection | Never replay mutation |
| Known commit, projection read fails | Committed | `committed_refresh_pending` | Loader only |
| Analytics disabled/fails | Equip remains committed | No economy/equip error | No mutation retry |
| Background/dispose | Commit may complete | Drop stale publish | Refocus reload |

## 12. Delivery gates

### 12.1. Definition of Ready

- [x] US-08-02 accepted at exact SHA `5c6791d...`.
- [x] EPIC-level confirmations 05/06/08/09 are approved Option A.
- [x] Schema/repository/projection/UI/analytics baseline audited; no migration gap found.
- [x] Owner approved `US0803-CONFIRM-01→06 theo Option A` on 2026-09-11.
- [x] Exact implementation start SHA `5c6791dbec982d7f522e4113180458daf2e9ce95` recorded before production edits.

### 12.2. Definition of Done

- [x] Equip/unequip is free, owned-only, idempotent, multi-item and durable after relaunch.
- [x] No sibling state, Coin, XP, receipt, ownership count or session/reward truth changes.
- [x] Every failure proves rollback, no-write or exact recovered commit; UI is never optimistic.
- [x] Purchase flow and all common-component consumers regress cleanly.
- [x] Deterministic fresh-equip analytics is isolated from durable truth.
- [x] Safe fixtures/device guide exist; owner/formal evidence recorded honestly as `NOT_RUN`.
- [x] Typecheck/lint/tests/boundaries/hygiene/device validator/platform exports pass.
- [x] Implementation report binds exact SHA; owner acceptance opens US-08-04 art gate.

## 13. Open questions cần owner confirm

### US0803-CONFIRM-01 — Inventory mode và projection owner

- **Option A — đề xuất:** reuse one committed Shop projection; `Đã sở hữu` only filters owned/equipped
  items. Keep selected mode in memory across tab refocus, cold relaunch defaults `Cửa hàng`; no DB field.
- **Option B:** create a separate Inventory query/controller or persist last mode.
- **Impact:** A avoids duplicate truth/read races and adds no route/schema.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

### US0803-CONFIRM-02 — Equip interaction

- **Option A — đề xuất:** direct explicit `Trang bị` / `Tháo` action with no confirmation because it is
  free and reversible; busy disables mutation controls.
- **Option B:** reuse confirmation dialog for every equip/unequip.
- **Impact:** A keeps the common spend confirmation specific to irreversible Coin debit.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

### US0803-CONFIRM-03 — Rapid UI actions

- **Option A — đề xuất:** allow one equipment command globally at a time and disable all equip controls
  until committed refresh; Application still serializes/revalidates concurrent direct calls.
- **Option B:** queue every rapid/opposite UI tap.
- **Impact:** A prevents hidden intent queues and stale opposite labels without optimistic state.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

### US0803-CONFIRM-04 — Timestamp/idempotency/readback

- **Option A — đề xuất:** same-state preserves timestamps; fresh transition uses one timestamp for
  `updatedAt` and equipped `equippedAt`; ambiguous recovery requires that exact attempt timestamp.
- **Option B:** rewrite timestamps on same-state and accept desired state alone as commit proof.
- **Impact:** A gives meaningful idempotency and deterministic ambiguous-result proof.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

### US0803-CONFIRM-05 — Commit then refresh failure

- **Option A — đề xuất:** show `committed_refresh_pending`; Retry reloads Shop only and never replays or
  inverses equip, matching purchase safety.
- **Option B:** show generic error and let the action execute again.
- **Impact:** A preserves known durable truth and prevents accidental toggles.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

### US0803-CONFIRM-06 — Recovered equip analytics

- **Option A — đề xuất:** emit deterministic `item_equipped:<itemId>:<equippedAt>` for fresh and exact
  current-attempt recovered false→true commit; never for unequip/pre-existing/same-state.
- **Option B:** emit only for direct fresh commit.
- **Impact:** A avoids lost analytics while receipt-free timestamp identity keeps dedupe deterministic.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

Owner có thể duyệt gọn bằng: `Duyệt US0803-CONFIRM-01→06 theo Option A`. Approval sẽ authorize coding
US-08-03 nhưng không tự authorize commit/push.

## 14. Impact verdict and change log

| Area | Verdict |
|---|---|
| Schema/migration | `NONE_PROPOSED`; existing owned row/check/trigger/index supports multi-equip |
| Dependency/package | `NONE_PROPOSED` |
| Native/prebuild/permission | `NONE_PROPOSED` |
| Durable writes | One existing owned row's equip flag/timestamps only |
| Analytics | Existing bounded local queue; `item_equipped` only |
| Deferred | Room art/anchors, slots/editor, auto-equip, delete/refund, remote provider |

| Version | Date | Author | Change |
|---|---|---|---|
| 0.4.0 | 2026-09-11 | Codex | Bound owner quick UI PASS to exact committed/pushed SHA `d6399dd...`; story is DONE_OWNER_ACCEPTED and US-08-04 planning/art-candidate gate is open. Structured/formal evidence remains NOT_RUN. |
| 0.3.0 | 2026-09-11 | Codex | Recorded validated uncommitted US-08-03 candidate: durable multi-equip, same-route inventory modes, deterministic analytics, SQLite fixtures/round-trip, guide, full quality and platform exports PASS. Manual smoke remains NOT_RUN; exact SHA remains null. |
| 0.2.0 | 2026-09-11 | Codex | Recorded owner approval of Option A for confirmations 01–06 and coding authorization. Implementation starts from exact SHA `5c6791d...`; commit/push remain unauthorized. |
| 0.1.0 | 2026-09-11 | Codex | Initial US-08-03 plan after owner acceptance of US-08-02 at exact SHA `5c6791d...`. Audited existing multi-equip schema/repository/projection/UI/analytics, proposed owned-only free atomic transition/readback, same Shop route modes, tests/fixtures/device gates and six owner confirmations. No production code changed. |
