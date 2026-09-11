---
document_id: PIXELDORO_EPIC_08_USER_STORIES
title: PixelDoro EPIC-08 — Progression, Shop và Inventory Loop User Stories
version: 1.0.0
status: US_08_04_IMPLEMENTATION_CANDIDATE_OWNER_SMOKE
date: 2026-09-10
last_updated: 2026-09-11
owner: Dũng Lư
reviewed_by: Dũng Lư
confirmations_approved_at: 2026-09-10
confirmations_status: APPROVED_OPTION_A_01_TO_11
language: vi
scope:
  - mobile_mvp
  - epic_08
  - user_story_breakdown
authority: PLANNING
branch: feats/epic-08
baseline_sha: 6e68fe5d800342e187f267f356b08335ace9a6b6
previous_epic: EPIC-07
previous_epic_status: DONE_OWNER_ACCEPTED
previous_epic_implementation_sha: f6c7b9269b2abee07bfe8eeb5d804c6245b67c0a
implementation_status: US_08_04_VALIDATED_UNCOMMITTED_CANDIDATE
formal_tester_status: DEFERRED_TO_EPIC_12_UNLESS_ACTUALLY_RUN
schema_impact: NONE_APPROVED_EXISTING_SCHEMA_001_SUFFICIENT
dependency_impact: NONE_APPROVED
native_impact: NONE_APPROVED
next_gate: OWNER_US0804_QUICK_UI_SMOKE
product_truth: ../PIXELDORO_CORE_TRUTH.md
epic_baseline: ./MVP_EPICS.md
gamification_specification: ../specifications/gamification-rules.md
data_model: ../architecture/data-model.md
---

# EPIC-08 — Progression, Shop và Inventory Loop

## 0. Mục đích và authority

Tài liệu này phân rã `EPIC-08` thành các vertical slice nhỏ, có outcome nhìn thấy, rollback và review
độc lập. US-08-01 đã được owner accept tại `9be0a0f...`; US-08-02 đã được owner quick-UI accept tại
exact SHA `5c6791d...`; US-08-03 đã được owner quick-UI accept tại exact committed/pushed SHA
`d6399dd...`. US-08-04 planning và exact art-candidate gate đang mở. Không có migration, dependency
hoặc native configuration change.

Thứ tự authority khi review hoặc triển khai:

1. `PIXELDORO_CORE_TRUTH.md` và Product decision đã khóa.
2. Architecture/Data Model, ADR và specification trạng thái `APPROVED`.
3. `MVP_EPICS.md` và Exit Report mới nhất.
4. Behavior đã implement và owner accepted ở EPIC-01→07.
5. Code/test tại baseline SHA là capability inventory, không tự thay đổi Product truth.
6. EPIC-03 prototype chỉ là UX evidence; mock value, glyph, action và reducer không phải requirement.

Nếu tài liệu này mâu thuẫn authority cao hơn, authority cao hơn thắng và plan phải sửa trước khi code.
Owner đã chọn Option A cho toàn bộ `US0800-CONFIRM-01`→`11` ngày 2026-09-10. Approval này khóa
các decision trong mục 20 nhưng không tự phê duyệt implementation plan hoặc production code.

## 1. Baseline audit

### 1.1. Git và readiness

| Fact | Kết quả audit |
|---|---|
| Branch | `feats/epic-08` |
| Original breakdown baseline | `6e68fe5d800342e187f267f356b08335ace9a6b6` |
| Current accepted planning baseline | `d6399dd7590852c051f671757c3200c8d70b8bc8`; origin aligned before docs |
| Working tree trước US-08-04 plan | Clean |
| EPIC-07 status | `DONE_OWNER_ACCEPTED` |
| EPIC-07 exact implementation SHA | `f6c7b9269b2abee07bfe8eeb5d804c6245b67c0a` |
| EPIC-08 implementation | US-08-01 accepted `9be0a0f...`; US-08-02 `5c6791d...`; US-08-03 `d6399dd...` |
| Formal tester | `NOT_RUN`; EPIC-05→07 deferred evidence không được kế thừa là PASS |

Kết luận tại implementation candidate: US-08-03 đã đóng bằng owner quick UI acceptance;
US-08-04 đã được duyệt confirmations/art, implemented và validated tự động, đang chờ owner smoke.

### 1.2. Tài liệu đã audit và phân loại

- [x] Product source of truth: `PIXELDORO_CORE_TRUTH.md` `ACTIVE` và `MVP_EPICS.md` hiện hành.
- [x] Architecture: technical overview, system architecture, project structure và data model đều
  `APPROVED`; ADR-001→008 đã đọc theo decision/boundary liên quan.
- [x] Specifications: timer, session lifecycle, Pet state machine và gamification đều `APPROVED`.
- [x] EPIC-01/02 User Stories và implementation evidence; US-02-01→09 implementation plans.
- [x] EPIC-03 UX prototype plan và approved data-needs map.
- [x] EPIC-04 User Stories/Exit Report, US-04-03→07 reports, art review và device guide.
- [x] EPIC-05 User Stories/Exit Report và US-05-01→05 plans/reports.
- [x] EPIC-06 User Stories/Exit Report và US-06-01→05 plans/reports.
- [x] EPIC-07 User Stories/Exit Report và US-07-01→05 plans/reports.
- [x] Technical checklist, delivery runbook, current device guides, implementation và tests.

### 1.3. Authority reconciliation

| Loại thông tin | Kết luận dùng cho EPIC-08 |
|---|---|
| Product truth đã duyệt | XP/Coin, level curve, exact 12-item catalog, buy-once, no level gate, atomic purchase, owned-only free equip, cosmetic-only |
| Owner-accepted behavior | Reward/profile truth, Home progression, safe bootstrap/recovery, transaction coordinator, SQLite adapters, Pet projection, tabs/navigation, analytics queue |
| Prototype/mock | Shop chỉ có 3 sample glyph, `6 COIN MOCK`, local loading/error control, `XEM TRƯỚC · MOCK`; không có purchase/equip truth |
| Deferred scope | Evolution, Happiness/Energy, streak, rarity, dynamic price, refund/sell-back, consumable, quantity, trade/gift, premium currency, cloud economy, multiple Pet |
| Product OPEN còn hiệu lực | `OPEN-006` contribution colors và `OPEN-009` Pet naming; không block EPIC-08 và không được giải quyết tại đây |
| Technical debt ngoài EPIC-08 | SDK 57 patch drift/Expo Doctor `18/21`, formal device breadth của Epic cũ, provider delivery EPIC-11, History/Settings prototype retirement theo Epic owner |

### 1.4. Product rules đã resolved, không hỏi lại

- Level 1 tại 0 XP; threshold `25 × (L-1) × (L+2) / 2`; XP cumulative, không spend/level-down.
- `pet_profiles.total_xp` và `coin_balance` là current-state truth; immutable receipts dùng audit và
  verifier; UI/Zustand không là authority.
- Local seeded `catalog_items` là purchase authority, đúng 12 item/category/name/price; không remote
  catalog, filter, rarity hoặc level gate.
- Item mua một lần; already-owned không mua lại; insufficient balance không mutate.
- Default room/Pet assets không phải catalog item, không free ownership row và không có default item ID.
- `owned_items` cho phép nhiều furniture item cùng equipped; không persist slot/quantity.
- Purchase để item ở trạng thái unequipped; equip/unequip là action riêng, miễn phí và owned-only.
- Analytics taxonomy đã có `shop_viewed`, `item_unlocked`, `item_equipped`; provider delivery thuộc
  EPIC-11 và không nằm trong economy transaction.

## 2. Scope và out of scope

### 2.1. In scope

- Production Home progression hydrate từ committed profile, including level/threshold progress.
- Production Shop tab đọc exact catalog, Coin balance và owned/equipped status.
- Atomic Purchase command dùng catalog price trong transaction.
- Inventory projection; explicit equip/unequip; multiple equipped room decorations.
- Pet Room render committed equipped projection với safe fallback.
- Offline/relaunch/race/idempotency/recovery và analytics hooks đã allowlist.
- Retire Shop-only prototype ownership khi production slice thay thế hoàn toàn.

### 2.2. Out of scope

- New reward source, reward formula, manual claim, level cap, level gate hoặc level-up bonus.
- Item art/behavior chưa được owner chấp nhận; prototype glyph không tự thành production asset.
- Single-slot wardrobe, collision/layout editor, drag/drop, room save layout hoặc Pet skin.
- Dynamic price, sale, refund, sell-back, consumable, duplicate stack, rarity, category filter,
  locked/coming-soon, crafting, gift, trade, real money hoặc monetization.
- Schema/migration/dependency/native changes nếu implementation audit không chứng minh gap mới.
- Provider/PostHog delivery, History, Settings, contribution graph, Pet naming/evolution.

## 3. Current capability audit

| Capability | Hiện có | Production hay prototype | Có thể reuse | Gap của EPIC-08 | Owner |
|---|---|---|---|---|---|
| XP/Coin reward | Formula + atomic completed Focus/trial reward, unique receipt, profile delta | Production/accepted | Có, read-only dependency | Không cấp lại; refresh Shop/Home sau committed writes | Existing Focus owners; EPIC-08 chỉ consumer |
| Level | `deriveLevelProgression`, threshold tests; Home projection | Production/accepted | Có nguyên vẹn | Shop/shared balance projection và corrupt-value recovery | Domain/Application progression owner |
| Current profile | Typed repo + bootstrap snapshot + economy verifier | Production/accepted | Có | Focus-aware refresh/query controller sau purchase/equip | Application EPIC-08 projection |
| Catalog | Exact seed 12 rows, mapper, list/find-in-transaction, bootstrap verification | Production/accepted | Có nguyên vẹn | Production Shop query/controller and render | Application catalog query |
| Purchase receipt | Table, unique profile/item, immutable trigger, typed repo | Production foundation | Có | Purchase use case/coordinator/result mapping | Application PurchaseItem command |
| Coin debit | Catalog-authoritative guarded repository operation | Production foundation | Có | Orchestrate receipt + ownership atomically; classify zero-change | Application PurchaseItem command |
| Ownership | Composite FK/PK, typed list/find/insert | Production foundation | Có | Inventory projection/controller and joined validation | Application inventory query |
| Equip | `setEquippedInTransaction`, consistency trigger; many equipped supported | Production foundation | Có | Use case, serialized race behavior, idempotent result | Application SetItemEquipped command |
| Transaction | `BEGIN IMMEDIATE`, scope enforcement, `SessionCommandCoordinator` | Production/accepted | Pattern có | Economy-specific coordinator or shared serialized command policy | Application composition |
| Economy consistency | Bootstrap and query verify profile totals vs receipts | Production/accepted | Có | Run at safe boundaries; map mismatch to recovery | Bootstrap/Application recovery |
| Home/Pet | Committed profile/Pet controller, Cat renderer, progress UI | Production/accepted | Có | Refresh profile and render equipped decorations | Home/room projection owner |
| Shop UI | 3 hard-coded sample cards and mock review controls | Prototype only | Chỉ hierarchy/copy evidence | Replace entire Shop feature with production screen | Presentation EPIC-08 |
| Navigation | Four tabs; Shop route exists; bootstrap boundary | Production shell | Có | Refresh on focus, exact retry and no prototype fallback | Route composition |
| Analytics | Typed local queue + approved names | Production local hook | Có | Fresh deterministic Shop/purchase/equip recorders | Application side-effect owner |
| Common UI | Button, Panel, ChoiceChip, ConfirmationDialog, Stat, state surfaces, shell/header, Pet status | Production/common | Có/extend | Item tile, balance display and accessible progress API | Presentation common owner |
| Tests/fixtures | Domain/app/repo/SQLite/race/device patterns | Production evidence harness | Có | EPIC-08 isolated DB fixtures and route integrity | Story owner |

### 3.1. Schema/dependency/native verdict

`NO CHANGE PROPOSED`. Migration `001` đã biểu diễn mọi durable fact/invariant của EPIC-08 và đã có
exact seed, constraints, indexes, triggers, mapper/repository/transaction support. Không tạo migration
chỉ để thêm presentation slot, cached level, preview state hoặc analytics receipt. Nếu implementation
phát hiện invariant đã duyệt không enforce được, dừng Story, ghi proof và mở Data Model/ADR review;
không sửa migration `001` đã release.

## 4. Dependency graph và execution order

```text
EPIC-07 DONE_OWNER_ACCEPTED
  → US-08-01 Progression + Catalog read slice
      → US-08-02 Atomic purchase slice
          → US-08-03 Inventory + equip/unequip slice
              → US-08-04 Equipped Pet Room projection
                  → US-08-05 Offline integrity + analytics + Epic exit candidate
```

Order ưu tiên invariant và data risk trước, tạo Shop read-only vertical slice sớm, rồi mutation atomic,
selection, visual payoff và cuối cùng cross-feature exit. Mỗi Story chỉ active sau gate Story trước.

## 5. Risk register

| ID | Risk | Impact | Mitigation/owner | Story |
|---|---|---|---|---|
| R08-01 | UI hoặc command tin price từ card | Coin sai/âm | Command chỉ nhận `itemId`; transaction đọc catalog | 02 |
| R08-02 | Rapid/concurrent purchase debit hai lần | Mất Coin | Serialized command + guarded debit + unique receipt/ownership + rollback/readback | 02 |
| R08-03 | Profile aggregate lệch receipts | False balance | Existing verifier, fail closed, no UI repair | 01/02/05 |
| R08-04 | Bootstrap snapshot stale sau mutation | Shop/Home sai | Dedicated refreshable projection; post-commit read; focus refresh | 02–05 |
| R08-05 | Equip race tạo stale visual | Room sai | Exact item command serialized, committed read wins | 03/04 |
| R08-06 | Prototype glyph/layout bị coi là approved art | Fake requirement | Owner confirmation + production fallback boundary | 04 |
| R08-07 | Common component copy/paste | Regression/a11y drift | Reuse matrix + all-consumer tests + 240–260 split review | all |
| R08-08 | Analytics failure ảnh hưởng purchase | Economy corruption | Best-effort after commit, deterministic event IDs, failure tests | 02/03/05 |
| R08-09 | Formal evidence bị ghi PASS giả | Invalid exit | Every guide starts `NOT_RUN`; owner/formal status separated | all |
| R08-10 | Existing deferred scope leaks in | Rework | Static integrity scans and explicit deferred checklist | 05 |

## 6. Ordered User Story list

| Order | Story | User outcome | Priority | Dependencies | Initial status |
|---:|---|---|---|---|---|
| 1 | US-08-01 — Committed Progression và Production Catalog | User sees trustworthy level/XP/Coin and all 12 catalog items | P0 | EPIC-07; confirmations 01/03/08/09/10 approved | DONE_OWNER_ACCEPTED (`9be0a0f...`) |
| 2 | US-08-02 — Atomic One-time Purchase | User can safely buy one affordable item once | P0 | 01; confirmations 02/03/04/08/09 | DONE_OWNER_ACCEPTED (`5c6791d...`) |
| 3 | US-08-03 — Durable Inventory và Free Equip | User can distinguish owned items and equip/unequip without cost | P0 | 02; confirmations 05/06/08/09 | DONE_OWNER_ACCEPTED (`d6399dd...`) |
| 4 | US-08-04 — Equipped Decorations in Pet Room | User sees equipped purchases persist in the room | P1 | 03; confirmations 06/07/09 | ART_CANDIDATE_AWAITING_OWNER_APPROVAL |
| 5 | US-08-05 — Offline Loop Integrity và Exit Candidate | User can complete reward→buy→equip→relaunch loop reliably | P1 | 01–04; confirmations 08/09/10/11 | BLOCKED |

## 7. US-08-01 — Committed Progression và Production Catalog

- **User outcome:** từ Pet Room hoặc tab Cửa hàng, user thấy Level/XP/Coin committed và đúng 12 item
  theo price authority, không còn `MOCK` hoặc sample catalog.
- **Priority/order:** `P0 / 1`.
- **Dependencies:** EPIC-07 exit; existing profile/catalog/bootstrap/level projection.
- **In scope:** production Shop loading/read/retry; exact 12 items; balance/level summary; read-only
  owned/equipped status if fixture has it; Shop-view analytics only after confirmation 08.
- **Out of scope:** purchase/equip mutation, item visual in room, catalog filtering/locked states.
- **Durable facts read:** `pet_profiles.total_xp`, `coin_balance`; all `catalog_items`; `owned_items`.
- **Durable facts written:** none; optional analytics queue is side effect only.
- **Domain rules:** derive level only through `deriveLevelProgression`; validate nonnegative safe totals;
  catalog identity is exact and ordered by authoritative price/ID, no level gate.
- **Application owner:** planned `LoadShopProjection` query + `ShopController`; screen calls hook only.
- **Transaction boundary:** consistent read snapshot preferred; no business mutation. Read/mapping failure
  returns typed recovery and never falls back to hard-coded catalog.
- **UI states:** loading; ready with balance + 12 item grid; empty is corruption/recovery rather than
  valid catalog; read error with Retry; corrupt catalog/profile with safe recovery copy.
- **Navigation:** Pet Room tab ↔ Shop tab; reselect/refocus refreshes; Back/tab never changes economy.
- **Offline:** complete; uses local SQLite only.
- **Analytics:** `shop_viewed` best-effort with confirmed deterministic focus semantics; no provider.
- **Accessibility:** header order; one grouped balance announcement; each tile exposes name, price,
  ownership/equipped state; dynamic text wraps; 44pt/48dp actions; no color-only ownership.
- **Open questions/Option A:** `US0800-CONFIRM-01/03/08/09/10` đều `APPROVED_OPTION_A` ngày
  2026-09-10; không còn confirmation blocker cho Story này.

### 7.1. Acceptance criteria

- [ ] Shop route has no PrototypeBadge, PrototypeControls, hard-coded sample catalog or mock Coin.
- [ ] Ready state displays exactly the 12 approved IDs/names/category/prices from committed catalog.
- [ ] Catalog is fully visible from Level 1/0 XP/0 Coin; no locked/coming-soon/rarity/filter state.
- [ ] Level 1 at 0 XP and all threshold/boundary/multi-level projections use the approved formula.
- [ ] Home and Shop display the same committed profile values after refresh.
- [ ] Missing/extra/duplicate/corrupt catalog or invalid profile fails closed with Retry; no fake fallback.
- [ ] Rendering/navigation/retry causes zero purchase, receipt, ownership or reward write.
- [ ] Offline launch and cold relaunch show the same local values.
- [ ] Screen imports only controller/hooks/common components, never repository/SQL/Domain rule.
- [ ] Owner/formal manual status remains honest and evidence is recorded.

### 7.2. Automated tests

- [x] Domain unit: exact level boundaries and invalid total.
- [x] Application query/controller: loading/ready/error/retry, exact order, invalid/empty/duplicate facts.
- [x] Repository/mapper: production list paths plus corrupt/thrown/read-failure handling.
- [x] Real SQLite: fresh seed, earned rewards, owned/equipped fixtures, close/reopen exact projection.
- [x] Component: balance, progress, 12 tiles and ownership semantics; largest-text remains manual.
- [x] Navigation: Shop tab refocus refresh, Home values parity and static no-mutation boundary.
- [x] Analytics: disabled/failure/focus-episode dedupe behavior.
- [x] Static architecture: no prototype/import leakage, no component >300 lines.
- [x] iOS/Android JS export and device guide validator at candidate gate.

### 7.3. Fixture/data requirements

Dev-only isolated DB prefix `pixeldoro-us-08-01-`: `shop_fresh_zero`, `shop_progress_45`,
`shop_progress_50`, `shop_owned_mixed`, `shop_read_failure_once`, `shop_catalog_corrupt`. Finite,
deterministic, no normal DB, production mapper/query semantics unchanged, explicit test-data reset.
`49 XP` remains a unit boundary; the durable/device fixture uses reachable `45→50 XP` because valid
production Focus rewards change XP in multiples of `5` and fixtures must not bypass reward semantics.

### 7.4. Manual device guide — planned file

File: `apps/mobile/test/device/progression-catalog-smoke.md`; initial status `NOT_RUN`.

**Mục tiêu:** xác nhận production progression/catalog local và read-only.

**Preconditions/command:**

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=shop_fresh_zero pnpm start --clear
```

Deep link iOS: `xcrun simctl openurl booted 'pixeldoro://shop?review=us0801'`.
Android: `adb shell am start -W -a android.intent.action.VIEW -d 'pixeldoro://shop?review=us0801'`.

- [ ] Record SHA/build/platform/device/OS/timezone/network/text/a11y settings; status starts `NOT_RUN`.
- [ ] Open Shop; verify Level 1, 0 XP, 0 Coin and all 12 exact items/prices, no mock badge.
- [ ] Run `shop_progress_45`, then `shop_progress_50`; verify threshold transition without mutation.
- [ ] Run read-failure/corrupt fixtures; Retry recovers only the one-shot failure, no fake catalog.
- [ ] Airplane mode + cold relaunch preserve data; background/foreground refreshes without flicker.
- [ ] At largest text and VoiceOver/TalkBack, inspect order/labels/scroll/touch; Reduce Motion loses no meaning.
- [ ] Cleanup using fixture Reset, stop server, `unset EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE`; normal DB unchanged.
- [ ] Attach screenshots, screen recording, fixture DB name, before/after counts and PASS/FAIL/BLOCKED.

### 7.5. DoR, DoD và next gate

- [x] **DoR:** owner approves breakdown plus confirmations 01/03/08/09/10 relevant to read slice.
- [x] **DoR:** planned controller/component APIs and fixture isolation are reviewed.
- [x] **DoD automated:** acceptance checks pass; guide exists; unexecuted manual cases retain `NOT_RUN`.
- [x] **DoD automated:** production Shop replaces only its prototype owner; no schema/dependency/native change.
- [ ] **Evidence owner gate:** report/test counts/exports exist; exact SHA and screenshots await commit/quick UI.
- [x] **Gate US-08-02:** owner accepted exact US-08-01 candidate after quick UI review.

## 8. US-08-02 — Atomic One-time Purchase

- **User outcome:** user with enough Coin confirms a purchase, balance decreases by catalog price and
  item becomes owned exactly once; insufficient/already-owned paths explain the truth without loss.
- **Priority/order:** `P0 / 2`.
- **Dependencies:** US-08-01; confirmations 02, 03 and 04.
- **In scope:** Purchase command, confirmation/busy/result states, atomic debit+receipt+ownership,
  insufficient/already-owned/unknown/corrupt/write-read failure, rapid and concurrent action.
- **Out of scope:** auto-equip, refund, price input from UI, item detail marketplace, animation required
  for commit, provider delivery.
- **Durable facts read:** profile, catalog item, purchase receipt and ownership within transaction.
- **Durable facts written:** profile Coin debit, immutable `purchase_transactions`, `owned_items`
  unequipped; analytics after commit only.
- **Domain rules:** valid stable item identity; price is positive authoritative catalog value; no
  negative balance; already-owned rejects/no-op; exactly one purchase per profile/item.
- **Application owner:** `PurchaseItemUseCase`, existing shared `SessionCommandCoordinator`, Shop controller.
- **Transaction boundary:** one `BEGIN IMMEDIATE` reads catalog/profile/ownership, guarded debit,
  inserts receipt + owned row, verifies postcondition and commits. Any failure rolls back all. Retry
  after committed/ambiguous result reads existing receipt and returns `already_owned`, never debits.
- **UI states:** confirmation; submitting; success; insufficient Coin; already owned; unavailable/
  corrupt; recoverable error with Retry. Optimistic balance/ownership is forbidden.
- **Navigation:** remain in Shop; success refreshes committed projection; Back during pending cannot
  start another command; relaunch returns committed state.
- **Offline:** full local command; network/provider unavailable is irrelevant.
- **Analytics:** deterministic `item_unlocked:<purchaseReceiptId>` after fresh or current-attempt
  recovered commit; never for pre-owned. Failure is isolated and never rolls back purchase.
- **Accessibility:** dialog title/body include item + authoritative price; focus trapped/restored;
  busy state announced once; success/error live region; buttons meet touch target.
- **Open questions/Option A:** `US0800-CONFIRM-02/03/04/08/09` đều `APPROVED_OPTION_A` ngày
  2026-09-10.

### 8.1. Acceptance criteria

- [x] Presentation submits only `itemId`; no UI price is accepted by command or persistence API.
- [x] Successful purchase atomically debits exact catalog price, inserts one receipt and one owned row.
- [x] New ownership starts `isEquipped=false`, `equippedAt=null`; purchase does not auto-equip.
- [x] Insufficient Coin changes no balance/receipt/ownership and provides actionable copy.
- [x] Already-owned item cannot be purchased again and changes no Coin.
- [x] Rapid double tap, concurrent same-item command, retry and relaunch produce at most one debit/receipt/owner.
- [x] Catalog/profile/receipt/ownership corrupt or missing fails closed; UI never repairs totals.
- [x] Write/commit/readback failure never displays uncommitted success; ambiguous commit recovers by read.
- [x] Analytics/animation/audio/haptic/provider failure leaves committed economy unchanged.
- [x] Purchase/reward commands share one coordinator and cannot interleave into a negative balance.

### 8.2. Automated tests

- [x] Application unit: item identity/price/owned/balance decision including exact-balance success.
- [x] Application: success, insufficient, already owned, corrupt pair and ambiguous commit readback.
- [ ] Application race/idempotency: double tap, concurrent same item, concurrent different items,
  purchase concurrent with reward; committed-result readback.
- [x] Repository/mapper: transaction-scoped receipt read, guarded debit and typed row mapping.
- [ ] Real SQLite: full transaction commit/rollback at debit/receipt/ownership/commit/read stages;
  close/reopen; no negative balance; unique backstops.
- [x] Controller/component: confirmation/dismiss/busy/success/error/refresh-only retry and no optimistic truth.
- [ ] Navigation/lifecycle: background, unmount, relaunch during/after command.
- [x] Analytics deterministic ID/disabled/failure test; architecture/integrity scans; iOS/Android exports.

### 8.3. Fixture/data requirements

Implemented quick-UI fixtures under `pixeldoro-us-08-02-`: `purchase_exact_balance`,
`purchase_insufficient`, `purchase_owned`, `purchase_read_failure_once`. Rapid/concurrent/write-stage/
ambiguous/analytics failure breadth stays automated so the device harness never seeds fake partial
durable truth; formal breadth remains deferred per confirmation 11.

### 8.4. Manual device guide

File: `apps/mobile/test/device/shop-purchase-smoke.md`; initial status `NOT_RUN`.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=purchase_exact_balance pnpm start --clear
```

Deep link: `xcrun simctl openurl booted 'pixeldoro://shop?itemId=desk-mug'`; Android uses the same
quoted URL through `adb shell am start`.

- [ ] Record evidence metadata and durable profile/receipt/owned counts before action (`NOT_RUN`).
- [ ] Select `desk-mug`, dismiss once, reopen, confirm; verify busy, one success, balance 5→0, owned.
- [ ] Rapid tap confirm; verify one command/receipt and no negative/flickering optimistic balance.
- [ ] Run insufficient/already-owned scenarios; expected zero mutation and truthful CTA/copy.
- [ ] Inject each write/commit/read/analytics failure; expected rollback or committed-read recovery.
- [ ] Kill/relaunch after commit and use Airplane mode; expected one stable ownership/debit.
- [ ] Verify dialog focus, announcements, largest text, Reduce Motion and touch targets on iOS/Android.
- [ ] Cleanup disposable DB and unset fixture; attach before/after SQL facts, capture and actual status.

### 8.5. DoR, DoD và next gate

- [x] **DoR:** US-08-01 accepted; confirmations 01→06 explicitly approved for this Story.
- [x] **DoR:** transaction failure table and concurrency strategy reviewed against schema backstops.
- [x] **DoD automated:** implementation/typecheck/lint/tests/boundaries/hygiene pass without schema change.
- [x] **DoD evidence prep:** manual guide exists; owner/formal evidence remains truthfully `NOT_RUN`.
- [ ] **Evidence:** exact transaction trace, before/after balance/receipt/owner counts, report/SHA.
- [x] **Gate US-08-03:** owner accepted purchase UX at exact SHA `5c6791d...` after quick UI smoke.

## 9. US-08-03 — Durable Inventory và Free Equip

- **User outcome:** user sees all owned items, equips or unequips any owned decoration at no cost,
  and the committed selection remains correct after rapid actions or relaunch.
- **Priority/order:** `P0 / 3`.
- **Dependencies:** US-08-02; confirmations 05 and 06.
- **In scope:** owned/equipped projection, explicit equip/unequip, multiple equipped furniture items,
  unowned rejection, idempotent same-state action, race/read/write recovery.
- **Out of scope:** one-slot wardrobe, drag/drop placement, auto-equip purchase, delete ownership,
  equipment gameplay effect and unequip analytics event.
- **Durable facts read:** catalog + `owned_items` for profile; committed profile balance for parity.
- **Durable facts written:** only `is_equipped`, `equipped_at`, `updated_at` of existing owned row;
  optional `item_equipped` side-effect after fresh false→true commit.
- **Domain rules:** only owned item can change selection; equip/unequip costs zero; multiple furniture
  rows may be equipped; same desired state is idempotent; ownership is never deleted.
- **Application owner:** existing `LoadShopProjectionUseCase`, implemented `SetItemEquippedUseCase`,
  shared command coordinator and Shop controller own the slice; no duplicate Inventory query.
- **Transaction boundary:** serialized transaction finds owned row, validates desired transition,
  conditionally updates timestamp/flag and commits. Unowned/missing/corrupt/zero-change is typed;
  profile, purchase and reward tables are untouched.
- **UI states:** inventory empty; owned unequipped; equipped; updating per item; read/write error with
  safe Retry; Shop cards reuse the same status/action component.
- **Navigation:** Inventory is a section/mode within the Shop tab under Option A; tab refocus refreshes;
  no new route required. Exit to Pet Room only after committed refresh.
- **Offline:** complete local behavior.
- **Analytics:** `item_equipped:<itemId>:<equippedAt>` only for fresh equip; no unapproved
  `item_unequipped`; queue/provider failure cannot affect selection.
- **Accessibility:** state and action both named; selected/equipped semantics not color-only; changing
  one item announces exact result and does not move focus unexpectedly.
- **Approved EPIC decisions:** `US0800-CONFIRM-05/06/08/09` đều `APPROVED_OPTION_A` ngày 2026-09-10.
- **Implementation plan:** `US-08-03_IMPLEMENTATION_PLAN.md`; story-specific
  `US0803-CONFIRM-01→06` đã được owner duyệt Option A ngày 2026-09-11. Implementation report:
  `US-08-03_IMPLEMENTATION_REPORT.md`; candidate chưa commit và manual smoke `NOT_RUN`.

### 9.1. Acceptance criteria

- [x] Inventory lists committed owned items and distinguishes equipped/unequipped in text/semantics.
- [x] Empty inventory is valid and explains how to obtain items; it is not a database error.
- [x] Equip owned item updates only its owned row and costs no Coin/XP/receipt.
- [x] Unequip preserves ownership and clears equipped timestamp consistently.
- [x] More than one owned furniture item may be equipped simultaneously; one action does not clear others.
- [x] Equip unowned/unknown/corrupt item is rejected with zero mutation.
- [x] Repeated same-state tap is idempotent; rapid opposite actions resolve to committed serialized order.
- [x] Relaunch/refocus reads exact committed states; no stale optimistic selection survives failure.
- [x] Failed/cancelled Focus or Break cannot revoke ownership/equipment.
- [x] Analytics disabled/failure/duplicate does not change durable selection.

### 9.2. Automated tests

- [x] Application boundary: owned-only/idempotent desired-state decision; multi-equip remains allowed.
- [x] Application query/use case: empty/mixed inventory, equip, unequip, same-state, unowned/corrupt.
- [ ] Race: double equip, equip↔unequip, two different items and purchase→equip serialization.
- [x] Repository/mapper: existing flag/timestamp shape/backstop and transaction-scoped update regress cleanly.
- [ ] Real SQLite: free equip/unequip, multi-equipped, rollback, close/reopen, FK/trigger backstop.
- [x] Component/controller: empty state, tile variants, global busy, error and refresh-only retry.
- [x] Navigation/refocus and Shop consumer regression; architecture/line-count/platform gates.

### 9.3. Fixture/data requirements

Implemented under `pixeldoro-us-08-03-`: `inventory_empty`, `inventory_mixed`,
`inventory_multi_equipped`, `equip_read_failure_once`. All ownership is created by production
Focus reward/purchase/equip commands. Unowned, double-tap, opposite race, write failure and analytics
failure stay in automated harnesses rather than manufacturing partial durable UI state.

### 9.4. Manual device guide

File: `apps/mobile/test/device/inventory-equip-smoke.md`; initial status `NOT_RUN`.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=inventory_mixed pnpm start --clear
```

Deep link: `xcrun simctl openurl booted 'pixeldoro://shop?review=us0803'`; quote the same URL for
Android `adb shell am start`.

- [ ] Record metadata and before facts; initial result `NOT_RUN`.
- [ ] Equip two different owned items; both remain equipped and Coin/XP/receipt counts do not change.
- [ ] Unequip one; ownership remains and only that row becomes unequipped.
- [ ] Rapid same/opposite taps; visible final state equals committed row after settling/relaunch.
- [ ] Run empty/unowned/write/read/analytics failures; verify expected state and safe Retry.
- [ ] Background/relaunch/offline; verify all selections persist without network.
- [ ] VoiceOver/TalkBack, largest text, Reduce Motion, grayscale and touch-target checks on both platforms.
- [ ] Cleanup isolated fixture; unset variable; capture actual evidence/status.

### 9.5. DoR, DoD và next gate

- [x] **DoR:** US-08-02 accepted at exact SHA `5c6791d...`; confirmations 05/06/08/09 approved.
- [x] **DoR:** owner-approved schema semantics support multi-equip and persist no slot.
- [x] **DoR:** owner approved story-specific `US0803-CONFIRM-01→06` Option A on 2026-09-11.
- [x] **DoD automated:** free/no-delete/multi-equip/idempotency and opposite-order checks pass.
- [x] **DoD automated:** shared tile/status changes regress Shop purchase and old common consumers.
- [x] **Evidence:** implementation report binds exact SHA `d6399dd...`; owner quick UI PASS recorded.
- [x] **Gate US-08-04:** owner accepts inventory/equip behavior; structured breadth remains `NOT_RUN`.

## 10. US-08-04 — Equipped Decorations in Pet Room

- **User outcome:** equipped purchases visibly personalize Pet Room; unequipped/unowned items do not
  appear, and a relaunch reconstructs the same safe room from committed facts.
- **Priority/order:** `P1 / 4`.
- **Dependencies:** US-08-03; confirmation 07 (visual asset/placement acceptance).
- **In scope:** read-only equipped room projection; approved mapping of 12 stable IDs to cosmetic
  presentation; static/deterministic placement; missing/corrupt asset fallback; Home refresh.
- **Out of scope:** layout editor, physics/collision, user-controlled position, slot persistence,
  animation as truth, new Pet/state, art generation without separate approval.
- **Durable facts read:** equipped `owned_items` joined to authoritative catalog; existing active
  session/profile for Home/Pet state.
- **Durable facts written:** none from room rendering/navigation/retry.
- **Domain rules:** decoration is cosmetic only; never changes Pet state, reward, multiplier,
  protection, balance or ownership; default Cat/room remain without catalog ownership.
- **Application owner:** planned `LoadEquippedRoomProjection` query/controller; it validates owned +
  catalog identity and returns presentation-safe stable item IDs, not asset modules.
- **Transaction boundary:** consistent read; no mutation. Invalid item/catalog relationship fails the
  decoration layer safely while core Home/Pet remains usable; no silent ownership repair.
- **UI states:** base room/empty; one/many equipped; loading; decoration recovery/inline notice;
  individual missing-art fallback; core Pet recovery remains existing owner.
- **Navigation:** Shop → Pet Room tab; Home focus refreshes equipped projection; Start Focus unaffected.
- **Offline:** bundled/local assets only, no remote fetch.
- **Analytics:** none on render; equipment event belongs to US-08-03.
- **Accessibility:** decorative pixels hidden from screen reader; one concise room summary lists
  equipped names; Pet status remains semantic owner; largest text does not overlap actions.
- **Open questions/Option A:** `US0800-CONFIRM-06/07/09`, story confirmations 01→06 và exact
  `US0804-ART-01 candidate v1` đều đã được owner duyệt.
- **Implementation:** `US-08-04_IMPLEMENTATION_PLAN.md` và `US-08-04_IMPLEMENTATION_REPORT.md`;
  validated uncommitted candidate đang chờ owner quick UI smoke.

### 10.1. Acceptance criteria

- [ ] Only committed owned+equipped catalog items appear; unknown/unowned/unequipped never render.
- [ ] Empty inventory/equipment preserves an understandable default room with Mèo Dev.
- [ ] Two or more equipped items can appear simultaneously at deterministic non-persisted positions.
- [ ] Relaunch/refocus reconstructs the same set from SQLite; rendering writes nothing.
- [ ] Decoration does not alter Pet Idle/Working/Breaking/Celebrating/Bugged arbitration.
- [ ] Decoration does not alter XP/Coin/reward/purchase/equip facts or Focus/Break navigation.
- [ ] Missing/invalid asset uses approved fallback/notice and does not crash or fake ownership.
- [ ] Offline works; no remote asset, new dependency or native change.
- [ ] Decorative nodes are accessibility-hidden and a concise textual summary is available.
- [ ] Art/placement evidence is explicitly owner accepted, not inferred from prototype glyph.

### 10.2. Automated tests

- [ ] Application projection: empty/one/many/mixed/corrupt catalog-owned joins.
- [ ] Repository/SQLite: equipped-only query, stable ordering, reopen, read failure.
- [ ] Component: decoration mapping/placement/fallback, hidden decorative nodes, semantic summary.
- [ ] Home/Pet regression across all five Pet states, feedback, visibility and Reduce Motion.
- [ ] Zero-mutation/integrity scan on render/navigation; no asset network/dependency.
- [ ] iOS/Android layout snapshots/export and line-count/boundary checks.

### 10.3. Fixture/data requirements

`pixeldoro-us-08-04-`: `room_empty`, `room_one_equipped`, `room_many_equipped`,
`room_mixed_equipped`, `room_missing_asset`, `room_catalog_corrupt`, `room_read_failure_once`, plus
Idle/Working/Breaking/Celebrating/Bugged variants. Fixture only seeds isolated DB and selects approved
bundled asset failure mode.

### 10.4. Manual device guide — planned file

File: `apps/mobile/test/device/equipped-room-smoke.md`; initial status `NOT_RUN`.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=room_many_equipped pnpm start --clear
```

Deep link: `xcrun simctl openurl booted 'pixeldoro://?review=us0804'`; Android uses the same quoted URL.

- [ ] Capture baseline metadata and owner-approved asset/placement version (`NOT_RUN`).
- [ ] Verify expected equipped set in room, default Mèo Dev and zero unexpected/duplicate visuals.
- [ ] Switch to Shop, unequip one, return; only committed item disappears and ownership remains.
- [ ] Exercise all Pet states; decorations never replace/spam Pet semantics or actions.
- [ ] Run empty/missing/corrupt/read-failure; expected safe room/fallback/Retry, no crash.
- [ ] Airplane mode, background and cold relaunch preserve room set.
- [ ] VoiceOver/TalkBack hears Pet + concise room summary, not every pixel; inspect largest text,
  Reduce Motion, contrast and touch targets on iOS/Android.
- [ ] Cleanup isolated data and attach screenshot/video matrix with actual status.

### 10.5. DoR, DoD và next gate

- [x] **DoR:** US-08-03 accepted at `d6399dd...`; confirmations 06/07/09 and exact
  `US0804-ART-01 candidate v1` approved.
- [x] **DoR:** every item ID has an explicit presentation/fallback mapping and license/source record.
- [ ] **DoD:** acceptance, Home/Pet regression, offline/relaunch and fallback tests pass.
- [ ] **DoD:** no component >300 lines; any 240–260 line component received split review.
- [ ] **Evidence:** approved visual reference, asset manifest, screenshots, report/SHA/test results.
- [ ] **Gate US-08-05:** owner accepts room personalization slice.

## 11. US-08-05 — Offline Loop Integrity và EPIC-08 Exit Candidate

- **User outcome:** after earning Coin, user can inspect progression, buy, equip, see the room change
  and relaunch fully offline without duplicated spend, lost ownership or stale state.
- **Priority/order:** `P1 / 5`.
- **Dependencies:** US-08-01→04; confirmations 08 and 09.
- **In scope:** end-to-end regression, analytics hooks, production route/prototype integrity,
  fixture/device guide validation, failure/relaunch/accessibility evidence and exit candidate.
- **Out of scope:** provider delivery, formal beta certification if deferred by owner, later Epic UI.
- **Durable facts read:** profile, reward/purchase receipts, catalog, owned/equipped, active session.
- **Durable facts written:** only existing production Focus reward, purchase and equip commands;
  analytics queue side effects after fresh commits/views.
- **Domain rules:** all approved progression/purchase/equip invariants; no new economy rule.
- **Application owner:** composed controllers/use cases; no screen orchestration of business rules.
- **Transaction boundary:** each command owns its existing atomic boundary; end-to-end flow does not
  wrap unrelated user actions in one transaction. Analytics is always outside product transaction.
- **UI states:** full ready/loading/empty/error/Retry/busy/success states across progression, catalog,
  purchase, inventory and equipped room.
- **Navigation:** entry Home or Shop tab; end-to-end Home→Focus→Result→Home/Shop→purchase→inventory→
  equip→Home; background, tab refocus, notification Result reopen and cold-start exits retain truth.
- **Offline:** required entire flow; provider/network failures are non-blocking.
- **Analytics:** `shop_viewed`, fresh `item_unlocked`, fresh false→true `item_equipped`; deterministic
  IDs, opt-out, queue failure and no re-emission from render/relaunch.
- **Accessibility:** full screen-reader order, largest text, Reduce Motion, non-color state and touch
  targets; manual claims retain actual status.
- **Open questions/Option A:** `US0800-CONFIRM-08/09/10/11` đều `APPROVED_OPTION_A` ngày 2026-09-10.

### 11.1. Acceptance criteria

- [ ] Completed trial/standard Focus rewards remain exactly once and feed current level/Coin truth.
- [ ] Reward render/notification tap/Shop render never grants XP/Coin again.
- [ ] Full purchase/equip/room flow works offline and persists after cold relaunch.
- [ ] Coin never negative; receipt/ownership unique; equipped state belongs only to owned item.
- [ ] Concurrent purchase/equip/reward commands resolve without inconsistent aggregate or stale UI.
- [ ] Every injected read/write/commit failure has truthful recovery and no partial durable facts.
- [ ] Analytics opt-out/provider/queue failure changes no product truth and emits no duplicate event.
- [ ] Shop production route has no prototype fallback; root prototype stays only for EPIC-09/10 owners.
- [ ] Home/Pet/Focus/Break regressions pass, including all Pet states and Result/notification flows.
- [ ] iOS/Android JS exports, architecture/integrity, typecheck/lint/tests/device validator pass.
- [ ] Formal/owner evidence status is recorded honestly; no `PASS` without execution.
- [ ] Exit report is not created/closed until owner accepts exact candidate and authorizes closure.

### 11.2. Automated tests

- [ ] Domain: full level thresholds/economy decision regression.
- [ ] Application/controller: all query/command/state/error paths and command serialization.
- [ ] Repository/mapper: catalog/profile/receipt/owned and corrupt/missing identity matrix.
- [ ] Real SQLite: reward→purchase→equip→reopen; same/different-item races; rollback at every stage.
- [ ] Component/navigation: full user flow, state surfaces, deep links/refocus and no prototype fallback.
- [ ] Static integrity: screen boundaries, SQL location, component line limit, exact catalog and no
  schema/dependency/native drift.
- [ ] Analytics: allowlist/properties/dedupe/opt-out/failure; provider remains absent.
- [ ] Root quality plus iOS/Android JS export at exact frozen candidate.

### 11.3. Fixture/data requirements

`pixeldoro-us-08-05-`: `epic_08_fresh_reward_to_room`, `epic_08_relaunch_committed`,
`epic_08_concurrent_purchase_equip`, `epic_08_provider_failure`, `epic_08_corrupt_identity`,
`epic_08_all_errors_once`, `epic_08_accessibility_matrix`. Normal `pixeldoro.db` is never selected,
reset or migrated by a fixture.

### 11.4. Manual device guide — planned file

File: `apps/mobile/test/device/epic-08-exit-smoke.md`; initial status `NOT_RUN`.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=epic_08_fresh_reward_to_room pnpm start --clear
```

- [ ] Record exact frozen SHA/build/platform/device/OS/timezone/network/accessibility metadata.
- [ ] Complete fixture Focus; verify committed reward once and updated Home/Shop values.
- [ ] Buy `desk-mug`, try duplicate/rapid purchase, equip it, return Home and capture room change.
- [ ] Background/foreground, notification/result reopen and cold relaunch; verify no regrant/debit/event.
- [ ] Repeat full path in Airplane mode; inject analytics/provider and every storage failure.
- [ ] Run concurrent same/different purchase and equip scenarios; compare durable before/after facts.
- [ ] Run VoiceOver/TalkBack, largest text, Reduce Motion, grayscale/touch targets on iOS and Android.
- [ ] Run Home/Pet/Focus/Break regression and both platform JS exports at exact candidate.
- [ ] Cleanup fixture DB, unset variable, normal launch; attach all results as `PASS/FAIL/BLOCKED/NOT_RUN`.

### 11.5. DoR, DoD và exit gate

- [ ] **DoR:** US-08-01→04 accepted and confirmations 08/09/10/11 approved.
- [ ] **DoR:** frozen candidate, formal-vs-owner evidence policy and exit commands agreed.
- [ ] **DoD:** full automated/integration/static/export checks pass at one exact SHA.
- [ ] **DoD:** owner quick UI and formal results are recorded separately; deferred remains unchecked.
- [ ] **Evidence:** aggregate test counts, export logs, device matrix, durable table snapshots, report/SHA.
- [ ] **Gate:** owner explicitly accepts exact candidate, authorizes EPIC-08 Exit Report and opens only
  EPIC-09 planning.

## 12. Common Component Reuse Matrix

| UI need | Existing component | Reuse/extend/create | Common hay feature-local | Consumers | API/variants | Regression tests |
|---|---|---|---|---|---|---|
| Card/surface | `Panel`/`PixelPanel` | Reuse; do not create Shop card base | Common | All current screens, ItemTile | `tone`, `style`, children | All Panel consumers + Shop states |
| Chip/status | `ChoiceChip` | Extend only if non-interactive status variant is genuinely shared; otherwise compose text in tile | Common | Focus controls, Shop/Inventory | selected/disabled/state label | Existing ChoiceChip + tile semantics |
| Input | No general Input; none needed | Do not create | N/A | None in EPIC-08 | N/A | Static scan: no unnecessary input |
| Button | `PrimaryButton`, `SecondaryButton`, `Button` | Reuse; add loading/disabled semantics centrally only if API gap proven | Common | Confirmation, purchase, equip, retry | primary/secondary, busy/disabled, label | Existing Button + every action consumer |
| Popup/confirmation | `ConfirmationDialog` | Extend item/price body and focus contract, no feature duplicate | Common | Purchase; existing Focus/Break cancel | visible/title/body/actions/focus restore | Existing cancel dialogs + purchase dismiss/confirm |
| Avatar/Pet | `PetPortrait`, `PetStage`, `PetVisualStatus` | Reuse unchanged | Common | Home/Pet/Focus/Break | existing projection/fallback/motion | All five Pet states and old screens |
| Stat display | `StatDisplay` | Reuse | Common | Home, Shop balance/progression | label/value | Home snapshots + a11y grouping |
| Balance/progress | `ProgressionSummary` + Home progress markup | Extend into clear common `ProgressionSummary`/`LevelProgress` API; remove duplicated formula/layout | Common | Home, Shop | level,totalXp,coinBalance,xpToNext,percent, compact/full | Home/Shop exact parity, thresholds, large text |
| Item tile | None; prototype local card is not reusable production code | Create one focused common ItemTile | Common | Shop catalog and Inventory mode; future room summary | item identity/name/price/state/action/busy/disabled; no price command payload | all states, a11y, action identity, large text |
| Empty/loading/error | `EmptyState`, `LoadingState`, `ErrorState` | Reuse; extend copy slots only if required | Common | Shop/Inventory/Room | title/body/retry/label | Existing bootstrap/feature consumers + new states |
| Screen shell/header | `ScreenShell`, `ScreenHeader` | Reuse unchanged unless large-text bug proven | Common | Home/Shop | existing props | All current screens |
| List/grid | No production item grid | Create `ItemGrid` only if both Shop catalog and Inventory use it; layout-only, no mapping/rule | Common | Shop + Inventory | items/renderItem/empty; responsive columns | 12 items, large text, small phone, stable keys |
| Pet/room presentation | `PetVisualStatus` | Extend Home composition with feature-local `EquippedRoomDecorations`; do not overload Pet component | Feature-local until second consumer | Home initially | equipped item view data/fallback/summary | Pet regressions + empty/many/missing asset |
| Toast/inline notice | `InlineNotice` | Reuse inline; do not add toast for durable success unless need proven | Common | Purchase/equip/recovery | tone/message/dismiss if existing | old consumers + live-region behavior |
| Accessibility wrapper | Native accessible props; semantic Pet owners | Prefer focused common helper only after repeated need; no empty wrapper | Common pattern | Balance/tile/grid/room | label/value/state/hide decorative | VoiceOver/TalkBack-shaped component tests |

Component rules for every Story:

- [ ] Screen only calls hooks/controllers, lays out components and dispatches navigation.
- [ ] No Screen/component contains price, level, ownership, transaction or persistence rule.
- [ ] Common pattern with two consumers is extracted/reused; no Shop/Inventory copy/paste.
- [ ] No component exceeds 300 lines; every file approaching 240–260 lines gets responsibility split review.
- [ ] Split by independent responsibility/state/test/reuse/UI branch, never by arbitrary line chunks.
- [ ] No wrapper-only component is created merely to satisfy line count.
- [ ] Common modification runs every current consumer regression.

## 13. Screen Composition Matrix

| Screen | Controllers/hooks | Common components | Feature components | Navigation | Max responsibility |
|---|---|---|---|---|---|
| Home / Pet Room | Home profile refresh, Pet visual, equipped room projection | ScreenShell/Header, Stat/Progression, Panel, PetVisualStatus, states, Button, InlineNotice | EquippedRoomDecorations | Tab entry; Focus CTA; Shop tab handoff | Compose three committed projections and navigation; no derivation/write |
| Shop — catalog mode | ShopController projection/actions | ScreenShell/Header, ProgressionSummary, ItemGrid/ItemTile, states, ConfirmationDialog | Shop mode selector/header copy | Shop tab, refocus refresh, stay on purchase | Render catalog and forward itemId/action only |
| Shop — inventory mode | InventoryController projection/actions | same ItemGrid/ItemTile/states/notices/buttons | Inventory empty guidance | Same tab; Pet Room exit | Render owned/equipped state and desired-state commands |
| Purchase confirmation | ShopController purchase action | ConfirmationDialog, buttons, notice | None unless item preview is approved | Modal on same tab; restore focus | Confirm/cancel one authoritative projection; no price calculation |
| Global bootstrap/recovery | Existing bootstrap/retry | BootstrapBoundary, state surfaces | None | Existing launch arbitration | Preserve safe barrier; no Shop fallback |

## 14. Durable Fact and Command Ownership Matrix

| Fact/action | Durable owner | Domain owner | Application command/query | Presentation role | Failure behavior |
|---|---|---|---|---|---|
| Total XP | `pet_profiles.total_xp`; audit sum reward receipts | Approved level/reward rules | LoadShop/Home projection; existing reward command writes | Display committed total only | mismatch → recovery; never repair in UI |
| Coin balance | `pet_profiles.coin_balance`; reward + purchase receipt sum | nonnegative/spend rule | projection; existing reward and planned PurchaseItem write | display committed balance | mismatch/invalid → recovery |
| Level | Derived, not persisted | `deriveLevelProgression` | projection maps total XP | show level/progress | invalid XP → recovery, no clamp |
| Reward receipt | `reward_transactions` + completed session | existing reward decision | existing completion use cases | display only | no grant from Shop/Home/render/tap |
| Catalog identity/price | migration-owned `catalog_items` exact seed | approved catalog invariants | LoadShop + transaction findById | display record; submit itemId only | missing/corrupt/extra → fail closed |
| Purchase | immutable `purchase_transactions` | buy-once/price/balance decision | planned `PurchaseItemUseCase` | confirmation/busy/result | entire transaction rollback or committed readback |
| Inventory ownership | `owned_items` PK/FK to purchase receipt | owned-once/no deletion | LoadInventory; PurchaseItem inserts | display state | conflict maps already-owned; no second debit |
| Equip | `owned_items.is_equipped/equipped_at` | owned-only/free/multi-equip | planned `SetItemEquippedUseCase` | submit itemId + desired state | unowned/error no mutation; read committed state |
| Equipped room | Derived join of catalog + owned equipped rows | cosmetic-only boundary | LoadEquippedRoomProjection | map approved stable ID to decoration | layer fallback/notice; core Home remains safe |
| Shop viewed event | bounded `analytics_events` side-effect queue | approved taxonomy | ShopAnalyticsRecorder after confirmed view | none beyond route lifecycle | disabled/failure ignored for product truth |
| Item unlocked event | analytics queue; purchase receipt is truth | approved taxonomy | recorder after fresh purchase commit | none | deterministic dedupe; no rollback/retry purchase |
| Item equipped event | analytics queue; owned row is truth | approved taxonomy | recorder after fresh false→true commit | none | failure ignored; no unapproved unequip event |

## 15. Navigation Matrix

| From/state | Action | Destination | Durable precondition | Failure/stale behavior |
|---|---|---|---|---|
| Home ready | tap Cửa hàng tab | Shop catalog | bootstrap ready | Shop loading/recovery; no mock fallback |
| Shop catalog | select available unowned item | ConfirmationDialog | valid projected item | stale item revalidated by command; reject safely |
| Confirmation | dismiss/Back | same Shop focus | none | zero write; focus returns to source tile |
| Confirmation | confirm | same Shop busy→refreshed | readiness + itemId | error stays/retries; no navigation before commit |
| Shop success | switch Inventory mode | Shop inventory | committed owned row | refresh/read recovery |
| Inventory | equip/unequip | same screen refreshed | exact owned item | error inline; committed state wins |
| Shop/Inventory | tap Pet Room tab | Home | none | Home independently loads equipped projection |
| Home | start Focus | existing Focus Setup | existing gate | unchanged EPIC-06 behavior |
| Any route relaunch | bootstrap arbitration | canonical existing route/Home | safe migration/verification | existing recovery; never Shop hard-code fallback |

URLs containing `?` in every guide/command must remain quoted.

## 16. Error and Recovery Matrix

| Failure | User-visible state/action | Durable guarantee | Retry rule |
|---|---|---|---|
| Profile/catalog read | Shop recovery + Retry | zero write/fake fallback | repeat read only |
| Empty/extra/duplicate/corrupt catalog | catalog integrity recovery | no purchase possible | retry after valid data; no reseed in UI |
| Missing/corrupt profile | global/Shop recovery | no clamp or fabricated balance | existing recovery/reset only by explicit user path |
| Insufficient Coin | inline/dialog result | no debit/receipt/owner | user earns Coin; repeat remains safe |
| Already owned | owned state + Equip option | no second debit/receipt | refresh; never retry purchase |
| Concurrent same purchase | one success, loser owned/readback | one debit/receipt/owner | loser loads committed result |
| Concurrent different purchase | serialized results | balance guard prevents negative | refresh after each committed winner |
| Debit/receipt/ownership write | recoverable error | full rollback | retry whole command with same intent/new technical ID only per approved use-case policy |
| Commit result ambiguous | verifying/recovery | never show speculative success | read by profile+item; do not blind retry debit |
| Post-commit projection read | committed-pending-refresh notice | purchase stays committed | retry read only |
| Equip unowned | inline rejection | zero write/balance change | refresh ownership; no implicit purchase |
| Equip write/read | error + committed refresh | no optimistic state retained | retry desired-state command or read as classified |
| Missing decoration asset | fallback + notice | ownership/equip remains | retry render/read; no durable mutation |
| Analytics/provider | no economy error | product truth unchanged | bounded queue owns retry; provider EPIC-11 |
| App kill/relaunch | bootstrap then committed projection | SQLite commit/rollback atomic | normal hydrate/reconcile; no grant/debit replay |

## 17. Automated Test Strategy

### 17.1. Test pyramid by layer

- [ ] **Domain unit:** level threshold, purchase eligibility, owned-only/free equip and invariant inputs.
- [ ] **Application use case:** query/command typed outcomes, transaction call order, postcondition,
  idempotency, coordinator and side-effect ordering.
- [ ] **Controller/view-model:** loading/ready/empty/error/retry/busy/refocus/unmount and stale result.
- [ ] **Repository/mapper:** exact catalog/profile/purchase/owned map, conditional write and corrupt data.
- [ ] **Real SQLite integration:** full commit, injected rollback, close/reopen, constraints, concurrent
  purchase/equip/reward and economy verification.
- [ ] **Race/idempotency:** rapid/same/different purchase, equip opposite-state, ambiguous commit,
  Result/notification/relaunch no reward replay.
- [ ] **Component:** common variants, dialog, item tile/grid, progression, room fallback and a11y.
- [ ] **Navigation:** tab/refocus/deep-link/relaunch, no prototype fallback, existing Focus/Break paths.
- [ ] **Static architecture/integrity:** import/SQL location, immutable migration checksum, exact catalog,
  component <300, prototype ownership and no forbidden scope/dependency.
- [ ] **Platform:** iOS/Android JS export on frozen candidate; no native/prebuild change.
- [ ] **Device:** each Story guide plus final offline/accessibility/regression smoke with actual status.

### 17.2. Mandatory scenario coverage

- [ ] Purchase success/exact balance.
- [ ] Insufficient Coin.
- [ ] Duplicate/rapid/concurrent same and different purchase.
- [ ] Debit, receipt, ownership, commit and post-commit read failure.
- [ ] Relaunch after commit/rollback/ambiguous result.
- [ ] Equip owned/unowned; same-state and opposite-state race; multiple equipped.
- [ ] Default room fallback and no default/free catalog ownership.
- [ ] Corrupt item identity/catalog/profile/owned relationship.
- [ ] Empty inventory and 12-item catalog.
- [ ] Entire flow offline.
- [ ] Analytics disabled/provider/queue failure cannot affect economy.
- [ ] Largest text, VoiceOver/TalkBack, Reduce Motion, grayscale and touch target.
- [ ] Loading/error/retry without fake fallback.
- [ ] Home/Pet/Focus/Break and reward/notification regression.

## 18. Fixture Vocabulary

| Prefix/family | Purpose | Durable setup | Cleanup |
|---|---|---|---|
| `shop_*` | progression/catalog read | isolated profile/rewards/catalog/owned rows | fixture Reset + unset env |
| `purchase_*` | success/insufficient/race/failure | isolated deterministic Coin via real reward receipts; exact catalog | dispose/reset isolated DB |
| `inventory_*`, `equip_*` | empty/mixed/multi/race/failure | ownership created with valid purchase receipts, never orphan seed | reset isolated DB |
| `room_*` | equipped rendering/Pet states/assets | valid owned/equipped rows; explicit asset failure toggle | reset + clear failure toggle |
| `epic_08_*` | full reward→room exit | finite complete journey in `pixeldoro-us-08-05-*` | reset/close/unset; normal launch proof |

Fixture contract:

- [ ] `__DEV__` only and default-absent.
- [ ] Finite deterministic scenario names; unknown value selects no fixture.
- [ ] Database name starts exact disposable Story prefix; never `pixeldoro.db`.
- [ ] Uses production migration, commands, repository and transaction semantics.
- [ ] Failure injection is one-shot, typed and scoped; no production rule bypass.
- [ ] Seeded XP/Coin reconciles to valid immutable receipts; ownership reconciles to purchase receipt.
- [ ] Explicit cleanup, dispose and environment unset are documented.

## 19. Shared DoR, DoD và EPIC-08 Exit Checklist

### 19.1. Shared Definition of Ready

- [ ] Previous Story exact candidate is owner accepted.
- [ ] Every confirmation affecting the Story is explicitly approved; Option A not assumed.
- [ ] User outcome, durable reads/writes, Domain owner, command/query and transaction are named.
- [ ] Loading/empty/error/recovery/offline/navigation/a11y states are reviewable.
- [ ] Common component/reuse and all regression consumers are identified.
- [ ] Schema/dependency/native verdict is re-audited; any contrary proof blocks code.
- [ ] Fixture cannot touch normal DB and manual guide starts `NOT_RUN`.

### 19.2. Shared Definition of Done

- [ ] Story acceptance and automated checklists pass with evidence.
- [ ] Real SQLite and relevant race/rollback/relaunch tests pass.
- [ ] Output is observable on Development Build; owner/formal status recorded honestly.
- [ ] No business/economy/persistence rule exists in Screen/component.
- [ ] No component exceeds 300 lines; 240–260 split review complete where applicable.
- [ ] Common changes pass every existing consumer regression.
- [ ] No Product OPEN/prototype/deferred/later-Epic scope is promoted.
- [ ] No migration/dependency/native change unless separately approved from demonstrated gap.
- [ ] Implementation report, exact SHA, command results and device guide/evidence are recorded.
- [ ] `git diff --check`, relevant quality/boundary/hygiene/device-validator and platform exports pass.

### 19.3. EPIC-08 exit checklist

- [ ] EPIC-07 remains `DONE_OWNER_ACCEPTED`; accepted regressions pass.
- [ ] Level starts at 1/0 XP and derives exact progressive thresholds from cumulative XP.
- [ ] XP is cumulative/non-spend; Coin starts at zero and never negative.
- [ ] Shop shows exact 12 approved items from start with no level gate.
- [ ] Purchase trusts catalog price and commits debit+receipt+ownership atomically.
- [ ] Insufficient/already-owned/double-tap/retry/race cannot double debit or unlock.
- [ ] Inventory/ownership/equipped state persists across relaunch and session outcomes.
- [ ] Equip is owned-only, free, multi-item and has no gameplay effect.
- [ ] Equipped cosmetic projection is visible, safe and does not alter Pet/session/reward truth.
- [ ] Render, Result, notification and analytics never grant reward or purchase.
- [ ] Full loop works offline; corrupt/missing facts fail closed with recovery.
- [ ] Shop route has no prototype authority; History/Settings prototype remains with later owners.
- [ ] Accessibility, platform exports, static gates and device evidence have honest recorded status.
- [ ] Exact implementation SHA and owner acceptance are bound before Exit Report/master update.
- [ ] Owner explicitly authorizes EPIC-08 closure and only then opens EPIC-09 planning.

## 20. Owner Confirmation Register

All entries below are `APPROVED_OPTION_A`. Dũng Lư explicitly approved the proposed Option A for
`US0800-CONFIRM-01` through `US0800-CONFIRM-11` on 2026-09-10.

### US0800-CONFIRM-01 — Level-up presentation

**Vấn đề:** level formula đã resolved, nhưng Product chưa yêu cầu modal/animation khi crossing threshold.

- **Option A — đề xuất:** Home và Shop show committed current level/progress only; no blocking level-up
  modal/audio/haptic in EPIC-08. Impact: smallest reliable scope, relaunch has no replay question.
- **Option B:** add a fresh-commit level-up transient effect. Impact: requires provenance/dedupe,
  Reduced Motion and side-effect failure contract; expands US-08-01/05.
- **Story bị block:** US-08-01 presentation acceptance.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10.

### US0800-CONFIRM-02 — Purchase confirmation

**Vấn đề:** EPIC-03 only approved `Xem trước · MOCK`, not a production buy interaction.

- **Option A — đề xuất:** accessible `ConfirmationDialog` names item and authoritative price before
  command; cancel writes nothing. Impact: prevents accidental spend and reuses existing common dialog.
- **Option B:** direct Buy button with no dialog. Impact: faster but makes accidental irreversible MVP
  purchase more likely because refund/sell-back is out of scope.
- **Story bị block:** US-08-02 UI/interaction.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10.

### US0800-CONFIRM-03 — Coin balance placement

**Vấn đề:** Shop must make affordability clear without duplicating balance authority.

- **Option A — đề xuất:** common compact ProgressionSummary at Shop top, showing committed Coin plus
  Level/XP context; Home keeps full variant. Impact: clear parity and one reusable component API.
- **Option B:** Shop shows Coin only in header/eyebrow. Impact: denser but weaker progression link and
  needs a separate balance pattern.
- **Story bị block:** US-08-01/02 visual acceptance.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10.

### US0800-CONFIRM-04 — Post-purchase state

**Vấn đề:** whether successful purchase automatically equips the item.

- **Option A — đề xuất:** purchase creates unequipped ownership, then offers explicit `Trang bị`.
  Impact: matches existing approved schema/default transaction and keeps buy/equip separately reviewable.
- **Option B:** auto-equip after purchase. Impact: needs a second mutation/failure contract or broader
  atomic transaction and changes room unexpectedly; authority update likely required.
- **Story bị block:** US-08-02 completion UI and US-08-03 entry state.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10.

### US0800-CONFIRM-05 — Catalog/Inventory information architecture

**Vấn đề:** Product requires Shop/Inventory but does not define separate route/tab.

- **Option A — đề xuất:** one Shop tab with accessible `Cửa hàng` / `Đã sở hữu` modes; reuse ItemGrid/
  ItemTile and no new route. Impact: small navigation surface and preserves four approved resting tabs.
- **Option B:** separate nested Inventory route. Impact: supports deep link but adds header/back/refresh
  state and route tests with little MVP value.
- **Story bị block:** US-08-03 screen composition/navigation.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10.

### US0800-CONFIRM-06 — Multi-equip presentation

**Vấn đề:** Data Model resolves that many furniture rows may be equipped and no slot is persisted;
presentation still needs a deterministic policy.

- **Option A — đề xuất:** every owned item has one code/asset mapping to a fixed room anchor; multiple
  items can coexist and no slot selector is shown. Impact: matches schema, avoids migration/editor.
- **Option B:** single visible item or one item per invented slot. Impact: conflicts with approved
  multi-equip semantics or requires new slot/product/schema decision.
- **Story bị block:** US-08-03/04 visual behavior.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10.

### US0800-CONFIRM-07 — Production cosmetic assets

**Vấn đề:** repository has Cat sprites but no approved production art/manifest for the 12 decorations;
prototype glyphs are explicitly mock.

- **Option A — đề xuất:** before US-08-04 implementation, create/review one coherent bundled pixel-art
  asset set and manifest for all 12 stable IDs, then integrate only the owner-approved candidate with
  deterministic fallback. Impact: fulfills visible room payoff and creates an explicit art gate.
- **Option B:** ship text/icon tiles and room summary without visible decorations. Impact: smaller but
  does not fully demonstrate the Epic outcome that Pet Room visibly changes.
- **Story bị block:** US-08-04 hard-block; US-08-01→03 can use neutral tile icon/fallback only after
  confirming it is not final room art.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10. US-08-04 still requires separate
owner approval of the exact art candidate before implementation; this confirmation approves the
art-gate process, not unseen artwork.

### US0800-CONFIRM-08 — Analytics event semantics

**Vấn đề:** names are approved, but exact fresh timing/properties are not yet bound for EPIC-08.

- **Option A — đề xuất:** `shop_viewed` once per application screen-focus episode with `{}`;
  `item_unlocked` keyed by purchase receipt with `{itemId, pricePaidCoins}`; `item_equipped` only on
  fresh false→true commit with `{itemId}`. All local/best-effort; no `item_unequipped`. Impact: minimal,
  deterministic, privacy-safe and matches current allowlist.
- **Option B:** defer all three hooks to EPIC-11. Impact: smaller now but no historical backfill and
  EPIC-11 must wire feature behavior later.
- **Story bị block:** analytics portions of US-08-01/02/03 and US-08-05 exit.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10.

### US0800-CONFIRM-09 — Schema/dependency/native verdict

**Vấn đề:** audit finds existing migration `001` sufficient.

- **Option A — đề xuất:** lock `NO SCHEMA / NO DEPENDENCY / NO NATIVE CHANGE`; reuse existing profile,
  catalog, purchase, owned/equip, transaction and verifier capabilities. Impact: no migration risk;
  a newly demonstrated invariant gap must stop and reopen review.
- **Option B:** plan new schema now for level cache, slot or item metadata. Impact: creates second truth
  or unapproved product behavior without a demonstrated requirement; not recommended.
- **Story bị block:** implementation planning for all Stories.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10. Schema/dependency/native impact is
locked to `NONE` unless a later demonstrated gap is separately reviewed.

### US0800-CONFIRM-10 — Prototype retirement boundary

**Vấn đề:** root `PrototypeProvider` remains required by later History/Settings prototypes.

- **Option A — đề xuất:** remove prototype imports/controls/fallback only from Shop route/feature and
  add integrity test; keep root provider and later-owner consumers until EPIC-09/10 replace them.
  Impact: safe incremental retirement.
- **Option B:** delete all prototype scaffolding in EPIC-08. Impact: breaks/re-scopes History/Settings
  and violates later-Epic ownership.
- **Story bị block:** US-08-01 and US-08-05 production-integrity acceptance.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10.

### US0800-CONFIRM-11 — Formal accessibility/device exit gate

**Vấn đề:** EPIC-05→07 used owner quick smoke with formal matrices deferred; EPIC-08 must state its gate.

- **Option A — đề xuất:** each Story requires automated checks + owner quick UI on available iOS/
  Android; structured physical-device, VoiceOver/TalkBack/largest-text/Reduce Motion breadth remains
  `DEFERRED_TO_EPIC_12` unless actually run. Impact: consistent roadmap, no fabricated PASS.
- **Option B:** make full formal iOS/Android accessibility/device matrix mandatory before EPIC-08
  closes. Impact: stronger feature-level evidence but requires tester/devices/time now.
- **Story bị block:** US-08-05 exit definition, not US-08-01 implementation planning.

**Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-10. Formal breadth is
`DEFERRED_TO_EPIC_12` unless actually executed and evidenced earlier.

### 20.1. Confirmation approval checklist

- [x] Owner selected Option A for `US0800-CONFIRM-01` on 2026-09-10.
- [x] Owner selected Option A for `US0800-CONFIRM-02` on 2026-09-10.
- [x] Owner selected Option A for `US0800-CONFIRM-03` on 2026-09-10.
- [x] Owner selected Option A for `US0800-CONFIRM-04` on 2026-09-10.
- [x] Owner selected Option A for `US0800-CONFIRM-05` on 2026-09-10.
- [x] Owner selected Option A for `US0800-CONFIRM-06` on 2026-09-10.
- [x] Owner selected Option A for `US0800-CONFIRM-07` on 2026-09-10.
- [x] Owner selected Option A for `US0800-CONFIRM-08` on 2026-09-10.
- [x] Owner selected Option A for `US0800-CONFIRM-09` on 2026-09-10.
- [x] Owner selected Option A for `US0800-CONFIRM-10` on 2026-09-10.
- [x] Owner selected Option A for `US0800-CONFIRM-11` on 2026-09-10.
- [x] Document version/status/gates are updated after owner confirmation; no implementation plan is
  created in the same implicit step.

### 20.2. Resolved topics that are not owner blockers

| Topic | Resolution/authority |
|---|---|
| Level formula | Progressive +25 curve, Gamification Rules `GR-OPEN-001 RESOLVED` |
| Catalog authority | Exact local migration-owned 12 rows, Product `OPEN-005 RESOLVED` |
| Buy again | Forbidden; unique profile/item and approved buy-once rule |
| Equip one/many | Many furniture may be equipped; no slot persisted, Data Model approved |
| Default/free item | Default room/Pet assets are outside catalog; no default owned item |
| Rarity/category/filter | Only `furniture`; rarity/filter/locked behavior outside MVP |
| No negative/duplicate | Domain/Application plus SQLite guarded debit/unique constraints |
| Reward on render/tap | Forbidden by Product Core; only completed Focus transaction grants |

## 21. Deferred Checklist and Known Limitations

- [ ] Formal EPIC-05→07 physical-device/accessibility evidence remains deferred and non-PASS.
- [ ] EPIC-08 formal breadth is `DEFERRED_TO_EPIC_12` per approved `US0800-CONFIRM-11` Option A;
  unexecuted cases stay `NOT_RUN`.
- [ ] Expo Doctor SDK 57 patch drift/current historical `18/21` remains tooling debt, not EPIC-08 scope.
- [ ] PostHog/provider delivery, queue worker and dashboard remain EPIC-11.
- [ ] History/contribution and final `OPEN-006` colors remain EPIC-09.
- [ ] Settings/data-control UI and its prototype retirement remain EPIC-10.
- [ ] Pet naming `OPEN-009`, multiple Pet, evolution, Happiness/Energy and streak remain outside scope.
- [ ] Dynamic pricing, sale/refund/sell-back, rarity/filter, quantity, consumable, trade/gift and
  monetization remain deferred.
- [ ] Existing wall-clock/offline limitations of completed Focus remain unchanged; EPIC-08 does not
  add backend authority or anti-cheat.
- [x] Exact production decoration artwork/placement approved by owner through
  `US0804-ART-01 candidate v1` on 2026-09-11; confirmation 07 alone was not treated as art approval.

## 22. Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0.0 | 2026-09-11 | Codex | Recorded owner approval of exact US0804 art candidate v1 and implemented the equipped Pet Room candidate from start SHA `4b1dee1...`: read-only committed projection, isolated refresh controller, fixed layered atlas rendering, explicit room/focus scene modes, accessibility summary and bundled offline assets. Full quality 174 files / 904 tests plus Android/iOS exports PASS; owner/manual smoke remains NOT_RUN. |
| 0.9.0 | 2026-09-11 | Codex | Recorded owner approval of US0804 confirmations 01–06 Option A and created review-only art candidate v1: room/contact sheet (`ccb8d071...`) plus empty backdrop (`d22ae4d...`). Production integration/coding remains blocked until exact `US0804-ART-01` approval. |
| 0.8.0 | 2026-09-11 | Codex | Bound US-08-03 owner quick UI PASS to exact committed/pushed SHA `d6399dd...`: no crash and expected behavior. Story 03 is DONE_OWNER_ACCEPTED; opened US-08-04 planning and exact art-candidate gate while structured/formal evidence remains NOT_RUN. |
| 0.7.0 | 2026-09-11 | Codex | Recorded owner approval of US0803 Option A 01–06 and validated uncommitted implementation candidate: same-route inventory modes, free durable multi-equip, refresh-only recovery, analytics, production-command fixtures, 169 files / 892 tests, quality and platform exports PASS. Owner/formal smoke remains NOT_RUN. |
| 0.6.0 | 2026-09-11 | Codex | Recorded owner quick UI PASS for US-08-02 at exact committed/pushed SHA `5c6791d...`: no crash and expected behavior. Story 02 is DONE_OWNER_ACCEPTED and US-08-03 planning is open; structured/formal evidence remains NOT_RUN. |
| 0.5.0 | 2026-09-11 | Codex | Recorded US-08-02 worktree candidate after Option A implementation: atomic buy-once, shared coordinator, confirmed/insufficient/committed-refresh UI, deterministic analytics, real SQLite reopen and safe device fixtures. Automated gates and iOS/Android exports pass; owner smoke and exact committed SHA remain pending. |
| 0.4.0 | 2026-09-10 | Codex | Recorded owner quick UI PASS for US-08-01 at exact SHA `9be0a0f...`: no crash and expected behavior. Story 01 is DONE_OWNER_ACCEPTED and US-08-02 planning is open; structured/formal device evidence remains NOT_RUN. |
| 0.3.0 | 2026-09-10 | Codex | Recorded US-08-01 plan approval and coding authorization. Story 01 is an uncommitted candidate awaiting owner quick UI; automated quality and both platform exports pass, manual/formal evidence remains NOT_RUN. |
| 0.2.1 | 2026-09-10 | Codex | Corrected the US-08-01 durable/device threshold fixture from unreachable `49 XP` to production-reachable `45→50 XP`; retained `49 XP` as an exact unit boundary. No scope or production behavior changed. |
| 0.2.0 | 2026-09-10 | Codex | Recorded owner approval of Option A for all eleven confirmations. Locked no schema/dependency/native change, incremental Shop-only prototype retirement, deterministic local analytics, multi-equip/fixed-anchor direction and formal breadth deferral to EPIC-12. Exact decoration artwork still requires its own candidate approval. No implementation plan or production code was created. |
| 0.1.0 | 2026-09-10 | Codex | Audited EPIC-01→07 docs/current code and baseline; confirmed EPIC-07 exact accepted implementation SHA and clean EPIC-08 planning baseline; created five risk-ordered vertical Stories, reuse/screen/durable/navigation/error/test/fixture/manual matrices, no-schema verdict and eleven pending owner confirmations. No production code, migration, dependency or native configuration changed. |
