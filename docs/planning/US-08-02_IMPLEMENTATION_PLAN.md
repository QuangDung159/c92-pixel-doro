---
document_id: PIXELDORO_US_08_02_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-08-02 Implementation Plan
version: 0.4.0
status: DONE_OWNER_ACCEPTED
implementation_status: DONE_OWNER_ACCEPTED
date: 2026-09-10
last_updated: 2026-09-11
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-08
planning_baseline_sha: 9be0a0f399a78014bb1a67239b0c478b30a7cdcd
implementation_start_sha: 9be0a0f399a78014bb1a67239b0c478b30a7cdcd
exact_implementation_sha: 5c6791dbec982d7f522e4113180458daf2e9ce95
previous_story: US-08-01
previous_story_status: DONE_OWNER_ACCEPTED
previous_story_implementation_sha: 9be0a0f399a78014bb1a67239b0c478b30a7cdcd
manual_device_status: PASS_OWNER_QUICK_UI
formal_tester_status: NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED
schema_change: NONE
dependency_change: NONE
native_change: NONE
scope:
  - mobile_mvp
  - epic_08
  - us_08_02
  - atomic_purchase
  - buy_once
  - item_unlocked_analytics
authority: PLANNING
story_baseline: ./EPIC-08_USER_STORIES.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
data_model_baseline: ../architecture/data-model.md
gamification_baseline: ../specifications/gamification-rules.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
adr_analytics: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# US-08-02 — Atomic One-time Purchase

## 0. Outcome, scope và gate

**User outcome:** user chọn một item trong Shop, xem confirmation có tên và giá authoritative, rồi
mua đúng một lần. Thành công trừ đúng Coin và tạo ownership unequipped; thiếu Coin hoặc đã sở hữu
không thay đổi dữ liệu và có phản hồi rõ ràng.

**Planning status:** `APPROVED_OPTION_A_01_TO_06`.
**Implementation status:** `DONE_OWNER_ACCEPTED` at exact SHA `5c6791dbec982d7f522e4113180458daf2e9ce95`.
Owner quick UI smoke passed with no crash and expected behavior; structured/formal breadth remains
separately `NOT_RUN`.

Owner đã accept US-08-01 tại exact SHA `9be0a0f399a...`, sau đó duyệt `US0802-CONFIRM-01→06` theo
Option A và mở coding. Candidate hiện đã implement/automated-validate trong worktree; không có
migration, dependency/native change, commit hoặc push.

### 0.1. In scope

- Purchase command chỉ nhận `itemId`; giá luôn đọc lại từ committed catalog trong transaction.
- Accessible confirmation, cancel/no-write, submitting, success, insufficient, already-owned,
  committed-but-refresh-pending và retryable failure states.
- Một `BEGIN IMMEDIATE` bao trọn catalog/profile/receipt/ownership read, guarded debit, receipt insert,
  owned insert và in-transaction postcondition.
- Same-item/different-item/Reward concurrency dùng chung coordinator hiện hữu.
- Ambiguous transaction result chỉ được coi committed sau exact durable readback.
- `item_unlocked` local/best-effort với deterministic receipt identity.
- Dev-only fixture, real SQLite tests, UI/device guide và implementation report.

### 0.2. Out of scope

- Auto-equip hoặc equip/unequip command; Inventory mode thuộc US-08-03.
- Item detail route, preview artwork, room rendering, rarity/filter/locked state.
- Refund, sell-back, quantity, consumable, dynamic price/sale, remote purchase/backend authority.
- Optimistic Coin/ownership, UI-authored price, retry bằng cách chạy lại command sau known commit.
- Schema/migration/package/native/permission/provider delivery changes.

## 1. Baseline audit

| Area | Existing capability | Gap / plan verdict |
|---|---|---|
| Accepted Shop | `ShopController`, exact catalog projection, focus refresh | Extend with selection + purchase command state; preserve read states |
| Serialization | One application-scoped `SessionCommandCoordinator` used by Focus/Break/Shop | Reuse exact instance; do not create a second economy mutex |
| Transaction | `SQLiteTransaction` uses `BEGIN IMMEDIATE`, rollback and typed technical errors | Reuse; add ambiguous-result readback outside completed transaction |
| Catalog | `findByIdInTransaction`, exact migration-owned contract | Re-read selected item and compare approved identity/price/version |
| Profile | `findInTransaction`, guarded `debitCatalogItemInTransaction` | Reuse; classify zero-change using pre-read facts, never UI price |
| Purchase receipt | external find + insert; unique profile/item, immutable trigger | Add narrow `findByProfileAndItemInTransaction` port/adapter method |
| Ownership | external/transaction find + transaction insert | Reuse; insert unequipped and validate receipt linkage |
| Economy | verifier reconciles profile with reward + purchase ledgers | Shop refresh verifies direct commit; ambiguous recovery requires explicit verifier readback |
| Analytics | approved `item_unlocked`, bounded queue, typed properties | Add recorder keyed by purchase receipt; no provider |
| Dialog | common `ConfirmationDialog`, busy buttons, modal a11y boundary | Add backward-compatible labels/tone/focus contract if confirmed |
| Item tile/grid | truthful non-interactive US-08-01 presentation | Add optional purchase action without embedding business decisions |
| Schema | price/debit checks, receipt uniqueness, FK ownership, immutable receipt | Sufficient; `NO SCHEMA CHANGE` |

### 1.1. Schema backstops already present

- `purchase_transactions`: positive price, `coin_delta = -price_paid_coins`, reason allowlist,
  `UNIQUE(profile_id,item_id)` and immutable update trigger.
- `owned_items`: primary key `(profile_id,item_id)`, unique purchase ID, triple FK back to the same
  receipt/profile/item and unequipped/equipped shape check.
- Guarded profile debit reads `catalog_items.price_coins` and refuses negative balance.
- These are defense-in-depth. Application still classifies intent/result before relying on constraint
  errors; UI never parses SQLite messages.

### 1.2. Demonstrated port gap

`PurchaseReceiptRepository` can read by profile/item only outside a transaction. Atomic preflight and
postcondition require the same read through the active transaction scope. Plan adds:

```ts
findByProfileAndItemInTransaction(
  scope: TransactionScope,
  profileId: number,
  itemId: string,
): Promise<PersistenceResult<PurchaseReceiptRecord | null>>;
```

This is an internal typed-port/adapter extension only; no schema or migration change.

## 2. Authority and invariant model

1. MVP profile ID remains `1`.
2. Command input is a non-empty stable `itemId`; Presentation cannot provide price, Coin delta,
   receipt ID, ownership state or timestamp.
3. Selected catalog row must equal the injected approved migration-owned contract.
4. Existing receipt and existing ownership must be both absent or a coherent pair. One-sided/mismatched
   facts are corruption, not `already_owned`.
5. Insufficient means committed profile Coin `<` authoritative catalog price before any write.
6. Fresh purchase applies exactly `-price`, inserts one immutable receipt and one ownership with
   `isEquipped=false`, `equippedAt=null`.
7. Success is never optimistic. UI changes Coin/item state only from the reloaded Shop projection.
8. A definitely committed transaction is never replayed because a later projection read failed.
9. A transaction technical error may be ambiguous; exact receipt + ownership + economy readback is
   required before returning recovered commit.
10. Analytics cannot change, roll back or retry purchase truth.

## 3. Proposed Application contract

### 3.1. Input and outcomes

Create `packages/application/src/shop/purchase-item.use-case.ts`:

```ts
interface PurchaseItemInput {
  readonly itemId: string;
}

type PurchaseItemOutcome =
  | {
      readonly outcome: 'fresh_commit' | 'recovery_commit';
      readonly receipt: PurchaseReceiptRecord;
      readonly ownership: OwnedItemRecord;
      readonly coinBalance: number;
    }
  | {
      readonly outcome: 'already_owned';
      readonly receipt: PurchaseReceiptRecord;
      readonly ownership: OwnedItemRecord;
      readonly coinBalance: number;
    }
  | {
      readonly outcome: 'insufficient_funds';
      readonly itemId: string;
      readonly priceCoins: number;
      readonly coinBalance: number;
      readonly shortfallCoins: number;
    };
```

`already_owned` and `insufficient_funds` are successful, durable business outcomes with zero write;
they are not retryable technical errors.

### 3.2. Typed errors

Proposed finite error codes:

- `PURCHASE_ITEM_ID_INVALID`
- `PURCHASE_ITEM_UNAVAILABLE`
- `PURCHASE_PROFILE_INVALID`
- `PURCHASE_DATA_INVALID`
- `PURCHASE_READ_FAILED`
- `PURCHASE_WRITE_FAILED`
- `PURCHASE_TRANSACTION_FAILED`
- `PURCHASE_RESULT_READ_FAILED`

Persistence corruption/invariant mismatch maps to `PURCHASE_DATA_INVALID` and global Recovery at the
mobile controller boundary. Unavailable/query/transaction failure maps to local error or readback.

### 3.3. Transaction algorithm

The entire method runs inside the existing application coordinator:

1. Validate `itemId`, allocate one receipt ID and capture one safe timestamp.
2. `transaction.execute` starts `BEGIN IMMEDIATE`.
3. Read catalog item by ID and compare exact approved contract.
4. Read profile, receipt-by-profile/item and ownership in the same transaction.
5. If receipt + ownership form a valid pair, return `already_owned` with zero write.
6. If only one exists or linkage/price/identity is wrong, return data-invalid and roll back.
7. If balance is below price, return `insufficient_funds` with zero write.
8. Guarded debit by `itemId`; zero-change after sufficient pre-read is a write conflict/failure.
9. Insert receipt using authoritative price and `coinDelta=-price`.
10. Insert ownership linked to receipt, unequipped.
11. Re-read profile/receipt/ownership inside transaction and assert exact postcondition.
12. Commit and return `fresh_commit`; controller immediately refreshes through the coordinated Shop
    loader, which verifies aggregate economy before publishing new UI truth.

No nested transaction occurs. For an ambiguous technical result only, aggregate verification starts
after the purchase transaction has returned and while the same outer coordinator operation is active.

### 3.4. Ambiguous commit/readback

If the transaction returns a technical error after work began:

- Read exact generated receipt ID, `(profile,item)` ownership and economy after the transaction ends.
- Coherent facts proving that generated receipt committed return `recovery_commit`.
- All facts absent return `PURCHASE_TRANSACTION_FAILED`; retry is allowed with a new attempt.
- Partial/mismatched facts return `PURCHASE_DATA_INVALID` and enter Recovery.
- Existing purchase with another receipt ID returns `already_owned`, never another debit.

For a known successful commit followed by the coordinated Shop refresh failing, controller publishes
`committed_refresh_pending`; Retry performs projection refresh only, never purchase again.

## 4. Mobile controller and composition

### 4.1. Extend ShopController without merging durable truth

Keep the US-08-01 load projection and add orthogonal command state:

```ts
type ShopPurchaseProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'confirming'; readonly itemId: string }
  | { readonly status: 'submitting'; readonly itemId: string }
  | { readonly status: 'success'; readonly itemId: string }
  | { readonly status: 'committed_refresh_pending'; readonly itemId: string }
  | { readonly status: 'insufficient'; readonly itemId: string; readonly shortfallCoins: number }
  | { readonly status: 'already_owned'; readonly itemId: string }
  | { readonly status: 'error'; readonly itemId: string };
```

Actions: `requestPurchase(itemId)`, `dismissPurchase()`, `confirmPurchase()`,
`retryPurchaseRefresh()`, `dismissPurchaseNotice()`.

- Request only selects an item present/available in the last committed projection.
- Confirm coalesces repeated taps for the same selection; all other purchase requests are blocked
  while pending.
- Modal cannot dismiss during submitting. Background/unmount does not cancel durable work.
- Commit outcome triggers projection load. Only loaded committed projection changes Coin/item state.
- If controller becomes inactive, completion may finish but stale UI publish is discarded; refocus
  reloads durable truth.

### 4.2. Composition

Extend `createShopSlice` with:

- the exact existing coordinator instance;
- transaction, profile, catalog, purchase, ownership and economy ports;
- approved catalog injected from the same migration-owned seed mapping used by US-08-01;
- readiness gate before command entry;
- `ItemUnlockedAnalyticsRecorder` as post-commit best-effort side effect.

Do not instantiate a second coordinator and do not expose repositories/transaction to Presentation.

## 5. Analytics contract

```text
eventName  = item_unlocked
eventId    = item_unlocked:<purchaseReceiptId>
properties = { itemId, pricePaidCoins }
TTL/cap    = existing bounded queue policy
```

- Emit only for a purchase proven newly committed by this command (`fresh_commit`; treatment of
  `recovery_commit` is owner confirmation 06).
- Never emit for cancel, insufficient, already-owned, technical failure or projection refresh.
- Queue disabled/failure/throw is isolated and cannot change controller purchase result.

## 6. Presentation plan

### 6.1. ItemTile / ItemGrid

- Extend tile with optional action model supplied by Shop: `available`, `unaffordable`, `busy`,
  `owned`, `equipped`.
- Tile still receives authoritative projected display name/price/state; it does not compute purchase
  eligibility or call Application directly.
- Available item exposes one explicit button. Owned/equipped items have no purchase button.
- Insufficient presentation includes exact shortfall from committed projection, while the command
  revalidates balance for races.

### 6.2. ConfirmationDialog

Use item name and authoritative price from current projection. Proposed backward-compatible common
API adds configurable dismiss label, confirm tone/order and focus targets while preserving current
Focus/Break defaults and tests.

Purchase copy:

- Title: `Mua <item>?`
- Body: `Dùng <price> Coin. Vật phẩm sẽ vào mục Đã sở hữu và chưa được trang bị.`
- Dismiss: `Để sau`
- Confirm: `Mua với <price> Coin`
- Busy: `Đang mua…`

### 6.3. Result copy

- Success: `Đã thêm <item> vào vật phẩm sở hữu.`
- Refresh pending: `Đã ghi nhận giao dịch. Đang đọc lại Coin và vật phẩm đã lưu.`
- Insufficient: `Cần thêm <shortfall> Coin để mua <item>.`
- Already owned: `Bạn đã sở hữu <item>. Coin không thay đổi.`
- Technical: `Chưa thể hoàn tất giao dịch. Coin và vật phẩm chưa được xác nhận thay đổi.`

No inert `Trang bị` button is introduced in US-08-02; US-08-03 adds the real action.

## 7. Navigation, lifecycle and accessibility

| State/event | Behavior |
|---|---|
| Open confirmation | Stay on Shop; focus/reading order enters dialog |
| Dismiss | Zero write; restore focus to exact item purchase trigger |
| Confirm/submitting | Disable both actions; one polite busy announcement |
| Back/background pending | Do not start/cancel/replay transaction; durable completion may finish |
| Fresh/recovered commit | Stay Shop; refresh committed projection; announce once |
| Relaunch | Normal Shop read shows owned item and debited Coin; no success replay |
| Offline/provider down | Local purchase works; analytics failure is invisible to economy |

Largest text must wrap item/price/dialog copy and keep actions reachable. Touch target uses existing
52–54pt minimum. Ownership/affordability/success are never color-only.

## 8. Planned file impact

### New

- `packages/application/src/shop/purchase-item.use-case.ts` + tests.
- `apps/mobile/src/application/shop/item-unlocked-analytics.recorder.ts` + tests.
- `apps/mobile/src/composition/review/shop-purchase-review-fixture.ts` + tests.
- `apps/mobile/test/integration/shop-purchase.integration.test.ts`.
- `apps/mobile/test/integration/epic-08-purchase-route-integrity.integration.test.ts`.
- `apps/mobile/test/device/shop-purchase-smoke.md`.
- `docs/planning/US-08-02_IMPLEMENTATION_REPORT.md` at candidate gate.

### Modify

- Purchase receipt repository port/export and SQLite adapter/tests for transaction-scoped read.
- `ShopController`, Shop slice/root facade/provider hooks and their tests.
- `ItemTile`, `ItemGrid`, `ConfirmationDialog`, Shop screen and consumer regressions.
- Dev fixture selection and device guide validator.

### Explicitly unchanged

- Migration `001`, schema manifest/checksum/seed, package manifests/lockfile, native config.
- Reward formula/lifecycle, equip repository behavior, Pet room art, History/Settings prototypes.

## 9. Fixture plan

Dedicated prefix `pixeldoro-us-08-02-`; finite dev-only allowlist:

| Fixture | Durable setup / injected boundary |
|---|---|
| `purchase_exact_balance` | One valid 25-minute Focus → 5 Coin; buy `desk-mug` |
| `purchase_insufficient` | Fresh 0 Coin profile |
| `purchase_owned` | Prior valid purchase committed through production command |
| `purchase_double_tap` | Controller rapid-confirm harness, one DB target |
| `purchase_concurrent_same` | Two same-item commands on shared coordinator |
| `purchase_concurrent_different` | 10 Coin, two item attempts with serialized balance truth |
| `purchase_debit_failure_once` | Decorated profile debit failure before receipt |
| `purchase_receipt_failure_once` | Decorated receipt insert failure |
| `purchase_ownership_failure_once` | Decorated owned insert failure after receipt insert; rollback all |
| `purchase_commit_ambiguous_once` | Commit outcome uncertain, exact readback determines result |
| `purchase_read_failure_once` | Known commit then projection refresh read failure |
| `purchase_analytics_failure` | Purchase commits; analytics queue fails best-effort |

All Coin originates from production completed-Focus rewards. Pre-owned setup uses the production
purchase command, never direct profile edits or orphan receipt/ownership inserts.

## 10. Automated test strategy

### 10.1. Application

- Input identity, exact catalog contract, exact-balance success and unequipped ownership.
- Insufficient/already-owned zero-write paths; missing/corrupt profile/catalog/receipt/owned facts.
- Failure at every read/debit/receipt/ownership/postcondition/transaction/readback stage.
- Same/different-item concurrency, double tap, Reward versus purchase serialization.
- Fresh, existing and ambiguous-recovered outcomes; no retry after known commit.
- Frozen typed outputs and no UI/mobile/SQLite import in shared Application.

### 10.2. Repository and real SQLite

- New transaction receipt read validates input, mapping and active scope.
- Exact balance `5→0`, one receipt, one unequipped ownership and ledger-consistent profile.
- Rollback at debit/receipt/owned/work/commit failures; no partial row or negative Coin.
- Unique/FK/check/immutable backstops and corrupt mapper rows.
- Close/reopen, offline local operation and exact durable projection.
- Ambiguous-after-commit driver proves readback; absent commit remains technical failure.

### 10.3. Controller/UI/a11y

- Confirmation open/dismiss/no-write; stale item selection rejected.
- Rapid confirm coalescing, busy lock, lifecycle stale-response guard and dispose.
- Success refresh only from committed projection; refresh failure never reruns purchase.
- Insufficient/already-owned/retry/corruption recovery copy and transitions.
- Item button/disabled/owned/equipped semantics; 12-item order retained.
- Dialog defaults regress Focus/Break; purchase labels/focus/busy/live-region tested.
- Static import/line-count/no-optimistic/no-UI-price/no-prototype scans.

### 10.4. Candidate gates

```sh
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
pnpm quality
pnpm --filter @pixeldoro/mobile exec expo export --platform ios --output-dir /tmp/pixeldoro-us0802-ios
pnpm --filter @pixeldoro/mobile exec expo export --platform android --output-dir /tmp/pixeldoro-us0802-android
pnpm --filter @pixeldoro/mobile run doctor
git diff --check
```

Doctor's accepted SDK patch-drift is recorded, not opportunistically changed in this Story.

## 11. Manual device guide plan

Planned file: `apps/mobile/test/device/shop-purchase-smoke.md`, initial status `NOT_RUN`.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=purchase_exact_balance pnpm start --clear
```

- Record SHA/build/platform/device/OS/timezone/network/text/a11y and before/after durable counts.
- Open `desk-mug`, dismiss, reopen and confirm; verify `5→0`, one owned, not equipped.
- Rapid confirm; insufficient/already-owned; every injected write/read/analytics failure.
- Background/kill/relaunch and Airplane mode; never duplicate/replay known commit.
- VoiceOver/TalkBack focus restore, busy/live result; largest text and Reduce Motion.
- Reset only disposable fixture DB, unset env and retain actual `PASS/FAIL/BLOCKED/NOT_RUN`.

## 12. DoR, DoD and next gate

### Definition of Ready

- [x] US-08-01 exact candidate `9be0a0f...` is owner accepted.
- [x] EPIC confirmations 02/03/04/08/09 are approved Option A.
- [x] Existing transaction/repository/schema/UI capabilities and gaps are audited.
- [x] No schema/dependency/native change is required.
- [x] Owner approved `US0802-CONFIRM-01→06 theo Option A` on 2026-09-10.
- [x] Implementation start SHA recorded as `9be0a0f399a...` before first production edit.

### Definition of Done

- [x] Acceptance plus application/repository/SQLite/race/controller/UI/static tests pass.
- [x] Core rollback/readback/no-optimistic-truth paths pass; exhaustive formal breadth remains deferred.
- [x] Shared coordinator and same-item purchase race are regression-covered.
- [x] iOS/Android exports, full quality, boundaries, hygiene and device validator pass.
- [x] Device guide exists; owner/formal evidence status remains honest.
- [x] Implementation report records exact SHA, test counts and no-schema/dependency/native verdict.

### Gate US-08-03

- [x] Owner accepted exact US-08-02 candidate `5c6791d...` and purchase UX after quick UI.
- [x] Equip/Inventory production implementation remains absent pending US-08-03 plan approval.

## 13. Open questions cần owner confirm

### US0802-CONFIRM-01 — Coordinator ownership

- **Option A — đề xuất:** reuse exact application-scoped `SessionCommandCoordinator` instance for
  reward, purchase and Shop reads; keep current name for this Story.
- **Option B:** add a second `EconomyCommandCoordinator` mutex.
- **Impact:** A prevents cross-queue interleaving without rename churn.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

### US0802-CONFIRM-02 — Transaction receipt read port

- **Option A — đề xuất:** add `findByProfileAndItemInTransaction` to existing purchase receipt port and
  SQLite adapter; no raw SQL in use case.
- **Option B:** infer already-owned from ownership only and let insert constraint classify receipt.
- **Impact:** A enables coherent preflight/postcondition and clean corruption classification.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

### US0802-CONFIRM-03 — Unaffordable item interaction

- **Option A — đề xuất:** tile shows disabled `Chưa đủ Coin` plus exact shortfall; command still
  revalidates insufficient balance for stale/concurrent state.
- **Option B:** allow confirmation/command for every available item, then show insufficient result.
- **Impact:** A avoids a knowingly futile confirmation while retaining race safety.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

### US0802-CONFIRM-04 — Commit versus refresh failure UX

- **Option A — đề xuất:** known/recovered commit disables further purchase and shows
  `committed_refresh_pending`; Retry only reloads Shop. Never rerun the purchase command.
- **Option B:** show generic purchase error and let Confirm retry.
- **Impact:** A prevents duplicate intent and tells the truth about durable commit.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

### US0802-CONFIRM-05 — Purchase dialog common API

- **Option A — đề xuất:** extend `ConfirmationDialog` backward-compatibly for labels/tone/focus;
  purchase uses `Để sau` + primary `Mua với X Coin` and restores exact tile focus.
- **Option B:** use current hard-coded `Tiếp tục`/secondary-confirm dialog unchanged.
- **Impact:** A gives correct spend semantics/a11y while preserving Focus/Break defaults.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

### US0802-CONFIRM-06 — Analytics after ambiguous recovered commit

- **Option A — đề xuất:** emit deterministic `item_unlocked:<receiptId>` for both `fresh_commit` and
  current-attempt `recovery_commit`; queue dedupe prevents duplicates. Never emit for pre-owned.
- **Option B:** emit only for direct `fresh_commit`, accepting a missing event after recovered commit.
- **Impact:** A preserves newly committed event coverage without touching economy truth.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-10.

Owner đã duyệt `Duyệt US0802-CONFIRM-01→06 theo Option A` và authorize coding. Approval không tự
authorize commit/push.

## 14. Impact verdict and change log

| Area | Verdict |
|---|---|
| Schema/migration | `NONE`; existing constraints/triggers are sufficient |
| Dependency/package | `NONE` |
| Native/prebuild/permission | `NONE` |
| Durable writes | Exact profile debit + purchase receipt + unequipped ownership in one transaction |
| Analytics | Existing bounded local queue only; no provider |
| Deferred | Equip, Inventory mode, room art, refund/sell-back, remote purchase |

| Version | Date | Author | Change |
|---|---|---|---|
| 0.4.0 | 2026-09-11 | Codex | Recorded owner quick UI PASS at exact committed/pushed SHA `5c6791d...`: no crash and expected behavior. US-08-02 is accepted and opens US-08-03 planning; structured/formal breadth remains `NOT_RUN`. |
| 0.3.0 | 2026-09-11 | Codex | Implemented the approved atomic purchase candidate in the worktree: shared serialization, transaction receipt read, exact debit/receipt/unequipped ownership, ambiguous readback, refresh-only committed recovery, deterministic analytics, Shop UI and four safe quick-review fixtures. Typecheck/lint/tests/boundaries/hygiene pass; owner/formal UI evidence and exact committed SHA remain pending. |
| 0.2.0 | 2026-09-10 | Codex | Recorded owner approval of Option A for confirmations 01–06 and coding authorization. Implementation starts from exact SHA `9be0a0f...`; commit/push remain unauthorized. |
| 0.1.0 | 2026-09-10 | Codex | Initial US-08-02 plan after owner acceptance of US-08-01. Audited transaction/ports/schema/UI, identified one transaction-scoped receipt-read gap, proposed shared serialization, atomic/readback contract, fixtures/tests and six owner confirmations. No production code changed. |
