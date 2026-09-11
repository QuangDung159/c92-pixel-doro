---
document_id: PIXELDORO_US_08_05_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-08-05 Implementation Plan
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
planning_baseline_sha: 94a0b24ac0bb62854d02754c90a94f415e0edbec
implementation_start_sha: e46c5e6c66dba2c0415693e622e2d9f3b308f7af
exact_implementation_sha: 30adc34be23dca48379b6f2553203fdadb9f9e5b
previous_story: US-08-04
previous_story_status: DONE_OWNER_ACCEPTED
previous_story_implementation_sha: 94a0b24ac0bb62854d02754c90a94f415e0edbec
manual_device_status: PASS_OWNER_QUICK_UI
formal_tester_status: NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED
schema_change: NONE_PROPOSED
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
next_gate: EPIC_09_PLANNING_REQUEST
scope:
  - mobile_mvp
  - epic_08
  - us_08_05
  - offline_end_to_end_integrity
  - analytics_deduplication
  - production_route_integrity
  - epic_exit_candidate
authority: PLANNING
story_baseline: ./EPIC-08_USER_STORIES.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
data_model_baseline: ../architecture/data-model.md
gamification_baseline: ../specifications/gamification-rules.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
adr_analytics: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# US-08-05 — Offline Loop Integrity và EPIC-08 Exit Candidate

## 0. Outcome, scope và gate

**User outcome:** sau khi hoàn tất Focus và nhận Coin, user thấy progression mới, mua một item đúng
một lần, trang bị item, thấy Pet Room thay đổi và cold-relaunch vẫn giữ đúng toàn bộ durable truth khi
offline. Rapid/retry/race hoặc analytics failure không được double reward, double debit, mất ownership,
stale equip hay làm hỏng room.

**Priority/order:** `P1 / 5`, Story cuối của EPIC-08.

US-08-01→04 đã `DONE_OWNER_ACCEPTED`; exact upstream mới nhất là US-08-04 tại
`94a0b24ac0bb62854d02754c90a94f415e0edbec`. Owner duyệt `US0805-CONFIRM-01→06` theo Option A ngày
2026-09-11; implementation bắt đầu từ SHA `e46c5e6...`. Approval authorize implementation candidate,
không tự authorize commit, push, EPIC-08 Exit Report hoặc mở EPIC-09.

### 0.1. In scope

- Một aggregate real-SQLite proof cho Focus reward → progression/catalog → purchase → inventory/equip
  → Pet Room → close/reopen, dùng đúng production use case/repository/coordinator.
- Offline behavior, rapid/retry/race, rollback và ambiguous-read evidence ở ranh giới toàn loop.
- Cross-feature analytics proof cho `shop_viewed`, `item_unlocked`, `item_equipped`: exact properties,
  deterministic IDs, opt-out/failure isolation và không re-emit từ render/relaunch.
- Aggregate route/static integrity: Shop/Home/Focus/Result/Room dùng production owner; Shop không có
  prototype fallback, root prototype chỉ còn cho feature thuộc EPIC-09/10 hoặc nhánh chưa retire.
- Finite dev-only exit fixtures, device guide, implementation report và frozen candidate evidence.
- Sửa gap nhỏ trong behavior đã duyệt chỉ khi test end-to-end chứng minh gap; mọi thay đổi phải giữ
  nguyên Product invariant và được ghi rõ trong implementation report.

### 0.2. Out of scope

- Economy/level/catalog/equip rule mới; reward multiplier, rarity, slot, refund, sell-back hoặc auto-equip.
- Schema/migration, dependency/package, native/prebuild/permission hoặc remote asset/provider.
- Analytics delivery worker/dashboard/PostHog provider; `item_unequipped` hay event mới.
- UI redesign, route/tab mới, modal/audio/haptic hoặc room editor.
- Xóa root `PrototypeProvider` hoặc prototype của History/Settings trước EPIC owner tương ứng.
- Tạo/đóng `EPIC-08_EXIT_REPORT.md`, đánh dấu Epic DONE hoặc mở EPIC-09 trước owner acceptance riêng.

## 1. Baseline audit

### 1.1. Git và accepted evidence

| Fact | Baseline |
|---|---|
| Branch / origin | `feats/epic-08`; clean và aligned trước documentation edit |
| Planning baseline | `94a0b24ac0bb62854d02754c90a94f415e0edbec` |
| US-08-01 | `DONE_OWNER_ACCEPTED` — `9be0a0f...` |
| US-08-02 | `DONE_OWNER_ACCEPTED` — `5c6791d...` |
| US-08-03 | `DONE_OWNER_ACCEPTED` — `d6399dd...` |
| US-08-04 | `DONE_OWNER_ACCEPTED` — `94a0b24...`; owner reports no crash/expected behavior |
| Current quality baseline | 176 test files / 909 tests; typecheck, lint, device validator, boundaries and hygiene PASS |
| Formal breadth | `NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED`; owner quick UI is not formal certification |

### 1.2. Capability audit và gap

| Capability | Hiện có | Authority | Reuse | US-08-05 gap/owner |
|---|---|---|---|---|
| Focus reward | Atomic session completion + unique reward receipt + profile XP/Coin update | Production/accepted | Exact use cases and coordinator | Aggregate no-regrant proof across Result/render/relaunch |
| Progression | Level/progress derived from economy verification | Production/accepted | `createHomeProfileProjection`, Shop/Home projections | Same committed facts at every surface in one journey |
| Catalog | Exact immutable 12-item seed and approved-catalog validation | Production/accepted | Existing migration/manifest/query | Aggregate checksum/route proof only |
| Purchase | Authoritative price, atomic debit+receipt+ownership, recovery outcome | Production/accepted | `PurchaseItemUseCase` | Cross-loop retry/concurrency/reopen proof |
| Inventory/equip | Owned-only, free, idempotent multi-equip with post-read | Production/accepted | `SetItemEquippedUseCase` | Purchase→equip ordering/race and reopen proof |
| Pet Room | Read-only equipped projection + bundled fixed-anchor room art | Production/accepted | Existing room loader/controller | End-to-end committed handoff and offline reopen proof |
| Serialization | One application-scoped `SessionCommandCoordinator` | Production/accepted | Reuse same instance for reward/purchase/equip/read | Prove cross-command order under overlap |
| Analytics queue | Bounded SQLite queue, TTL/dedupe, best-effort recorders | Production foundation | Existing three EPIC-08 recorders | One journey exact IDs/properties/no-reemit/failure proof |
| Shop route | Production screen/controller; no Shop prototype import | Production/accepted | Existing route integrity tests | Aggregate route/prototype boundary at Epic exit |
| Fixtures | Story-specific isolated DB fixtures for 01→04 | Dev-only evidence | Reuse production commands and decorators | One bounded exit namespace and cleanup contract |
| UI components | `ScreenShell`, `ScreenHeader`, `ProgressionSummary`, `ItemGrid`, `ItemTile`, notices/dialogs, `PetStage` | Production | No new UI expected | Regression only; no duplicate common component |

### 1.3. Demonstrated impact verdict

- Migration `001` already represents profile, sessions, reward receipts, purchase receipts, ownership,
  equip timestamps, catalog and analytics queue. Không có durable fact mới.
- Existing use cases own every required transaction. Full user journey must **not** be wrapped in one
  transaction because Focus, purchase and equip are distinct user actions.
- Existing event allowlist/recorders already implement the approved analytics semantics. US-08-05
  verifies composition and dedupe; it does not invent provider delivery.
- `ShopScreen` is currently below the 240-line split-review threshold. `ShopController` is a non-UI
  class above 500 lines; evidence-only work must not expand it. If a functional fix must touch it,
  extract a cohesive purchase/equip flow collaborator before adding branches and regress all consumers.
- Therefore the expected production behavior delta is `NONE`; expected implementation is fixtures,
  aggregate tests, narrow integrity guards and evidence docs. A discovered Product/schema gap stops work.

## 2. Locked invariants

1. XP is cumulative/non-spend; Coin changes only through accepted reward/purchase commands.
2. One completed eligible Focus creates at most one reward receipt and one profile delta.
3. Result render, notification response, tab focus, room render and analytics never grant reward.
4. Purchase trusts catalog price only and atomically commits debit, unique receipt and ownership.
5. Insufficient/already-owned/rapid/retry/race cannot make Coin negative or create duplicate ownership.
6. Equip is free, owned-only, multi-item and touches only the target ownership row.
7. Read projections never repair/write durable product facts.
8. Room renders only committed equipped known IDs and writes nothing.
9. Analytics happens after committed facts, is deterministic/best-effort and cannot change product truth.
10. Relaunch rebuilds from SQLite; no in-memory projection is accepted as authority.
11. Corrupt/missing identities fail closed through existing Recovery; transient reads expose Retry/stale
    behavior already owned by the feature.
12. Normal `pixeldoro.db` is never selected, reset or mutated by an exit fixture.

## 3. Planned architecture

```text
UI / device fixture
  → existing Focus / Shop / Home controllers
    → one shared SessionCommandCoordinator
      → existing reward / purchase / equip use cases
        → existing SQLite transaction + repositories
          → close/reopen
            → existing Shop + Room read projections

Committed outcomes ──best effort──> existing bounded analytics queue
```

### 3.1. Aggregate SQLite harness

Create one integration harness that opens a dedicated temporary database, retains one coordinator and
executes only public production use cases. It records fingerprints for profile, session, reward receipt,
purchase receipt, owned item and analytics rows after each committed action.

Sequence:

1. Bootstrap fresh profile/catalog and assert Level 1, 0 XP, 0 Coin, no ownership.
2. Start/reconcile one eligible Standard Focus; assert exactly one reward and expected XP/Coin.
3. Reconcile/render-equivalent reads again; assert zero additional reward/profile mutation.
4. Load Shop, purchase authoritative `desk-mug`, then repeat/overlap purchase attempt.
5. Equip the new ownership, overlap an idempotent equip, load room and assert exact item.
6. Close database, reopen with the same driver/name, recreate projections and compare durable fingerprint.
7. Repeat the read path offline; no network/provider is required.

Each command retains its existing transaction. The harness observes boundaries; it does not create a
test-only mega-transaction or directly insert valid product facts.

### 3.2. Race and failure harness

- Same-item concurrent purchase through the shared coordinator: one fresh commit, other already-owned;
  one debit/receipt/ownership.
- Purchase→equip overlap: equip cannot fabricate ownership; serialized final state is coherent.
- Same/opposite equip overlap: committed final state matches the serialized command order; Coin unchanged.
- Reward reconcile overlap with Shop read/purchase: no partial economy snapshot or double reward.
- Inject transaction/write/post-read failures at existing ports; assert rollback or explicit recovered
  commit outcome, then reopen and verify exact facts.
- Corrupt catalog/receipt/ownership is injected as a read decorator after valid setup, not written into
  normal DB by fixture preparation.

### 3.3. Analytics integrity

- `shop_viewed:<focusEpisodeId>` once per activation episode, properties `{}`.
- `item_unlocked:<purchaseReceiptId>` with `{itemId, pricePaidCoins}` only for fresh/recovered commit.
- `item_equipped:<itemId>:<equippedAt>` with `{itemId}` only for fresh false→true commit.
- Duplicate calls return `already_queued`; render/refocus/relaunch emits no duplicate unlock/equip event.
- Analytics disabled, settings read throw, queue reject/throw and absent provider leave every economy and
  ownership fingerprint identical to the corresponding success flow.
- No provider or delivery attempt is added; pending queue rows remain EPIC-11-owned.

### 3.4. Route and prototype boundary

Extend aggregate integrity coverage to prove:

- `/(tabs)/shop` imports production `ShopScreen` and facade hooks only.
- Home uses committed profile/room owners; Focus/Result use existing production branches.
- Shop feature/route does not import prototype context, reducer, mock catalog or prototype controls.
- Root `PrototypeProvider`, History and Settings prototype consumers remain untouched for later Epics.
- No business rule or SQL is added to route/screen/component files.

### 3.5. Presentation/reuse decision

No new screen or common component is planned. US-08-05 consumes existing loading/empty/error/busy/
success states and verifies them across the journey. If a display defect is found, extend the owning
common component backward-compatibly and run all current consumer tests; do not add an exit-only UI.

## 4. Durable fact and ownership matrix

| Fact/action | Durable owner | Domain/Application owner | Presentation role | Failure behavior |
|---|---|---|---|---|
| XP/Coin reward | profile + reward receipt + completed session | Focus reconcile transaction | Display committed projection | Rollback or recovered exact commit; never grant on render |
| Level/progress | Derived from verified total XP | Progression projection | Render only | Invalid facts fail closed |
| Catalog price | `catalog_items` approved seed | Shop loader/purchase use case | Display and send item ID only | Drift/corrupt → Recovery |
| Purchase | purchase receipt + profile debit + owned row | Purchase transaction | Confirm/action/result | Rollback or exact recovered outcome |
| Equip | target owned row | Set-equipped transaction | Desired boolean only | Retry loader after known commit; no economy write |
| Room | catalog + equipped owned rows | Read-only room projection | Decorative render | Local read/art fallback; zero durable write |
| Analytics | `analytics_events` bounded queue | Existing recorders after commit | No truth/optimistic UI | Skip/fail silently relative to product truth |

## 5. Navigation and lifecycle matrix

| Entry/event | Expected committed behavior |
|---|---|
| Fresh Home | Level 1/0/0 and empty room from SQLite |
| Focus → Result | Eligible completion grants once; Result only reads receipt/outcome |
| Result → Home/Shop | Both surfaces load the same committed XP/Coin |
| Shop purchase | Confirmation uses shown authoritative item; success after committed reload |
| Shop Inventory equip | Same route/mode; room changes only after committed equip |
| Shop → Home | Home focus refresh rebuilds room; no Shop push/optimistic shared object |
| Background/refocus | Coalesced reload; stale completion dropped |
| Notification reopen | Existing Result navigation; zero reward regrant |
| Cold relaunch | Bootstrap/reconcile/read projections reconstruct exact durable facts |
| Airplane mode | Entire flow works; queued analytics may remain pending |

## 6. Error and recovery matrix

| Failure | UI/command outcome | Durable assertion | Retry owner |
|---|---|---|---|
| Focus reward write/commit | Existing Result recovery | No partial reward/profile/session tuple | Focus owner |
| Shop initial read | Error/Retry or global Recovery by error class | Zero mutation | Shop loader |
| Purchase insufficient | Exact shortfall; no confirmation write | No debit/receipt/ownership | User earns more Coin |
| Purchase write/commit | Technical error or recovered commit | All three purchase facts or none | Purchase command/loader |
| Equip write/commit | Error or recovered committed state | Only target row; Coin unchanged | Equip command/loader |
| Post-commit refresh | `committed_refresh_pending` | Commit retained; Retry reads only | Feature controller |
| Room read/art | Pet/Home remains usable; notice/fallback | Zero write | Room loader/asset mapping |
| Analytics settings/queue/provider | No product-facing failure | Product fingerprint unchanged | No retry in EPIC-08 UI |
| Corrupt identity/linkage | Global Recovery/fail closed | No auto-repair | Existing reset/recovery flow |

## 7. Planned file impact

### New

- `apps/mobile/src/composition/review/epic-08-exit-review-fixture.ts` + focused tests.
- `apps/mobile/test/integration/epic-08-offline-loop.integration.test.ts`.
- `apps/mobile/test/integration/epic-08-analytics-integrity.integration.test.ts` if separating keeps each
  integration file focused; otherwise one aggregate file remains under the repository line budget.
- `apps/mobile/test/integration/epic-08-production-integrity.integration.test.ts` for aggregate route,
  prototype, SQL-location and package/schema drift guards.
- `apps/mobile/test/device/epic-08-exit-smoke.md` with initial result `NOT_RUN`.
- `docs/planning/US-08-05_IMPLEMENTATION_REPORT.md` only when a validated candidate exists.

### Modify

- `create-mobile-application.ts` only to resolve/dev-gate the dedicated exit fixture and select its
  isolated database/decorators; no normal-launch branch changes.
- Composition tests and device-guide validator for exact fixture/guide registration.
- EPIC-08 planning/master status after candidate evidence.
- Existing production file only if an aggregate test proves a narrow accepted-behavior gap.

### Explicitly unchanged

- Migration `001`, schema checksum/manifest/catalog values, packages/lockfile and native configuration.
- Domain formulas and public reward/purchase/equip contracts unless a demonstrated contradiction stops
  implementation for owner review.
- Shop/Home/Focus/Result navigation and visual hierarchy.
- Root prototype ownership for later Epics.
- `EPIC-08_EXIT_REPORT.md` until explicit post-smoke closure authorization.

## 8. Execution sequence

1. Freeze clean implementation start SHA after owner approves `US0805-CONFIRM-01→06`.
2. Add aggregate static integrity test first; confirm baseline production/prototype boundaries.
3. Add real-SQLite happy-path loop with durable fingerprints and close/reopen.
4. Add rapid/concurrent command cases using one coordinator; no direct valid-fact inserts.
5. Add rollback/recovered-commit/corrupt-read matrix at current transaction boundaries.
6. Add analytics exact-event/opt-out/queue-failure/no-reemit assertions.
7. Add finite exit fixture namespace and device guide; normal DB isolation must be tested.
8. Run focused tests, full quality, boundaries/hygiene/device validator and exact-candidate Android/iOS
   JS exports.
9. Write implementation report with actual counts/status; keep manual rows `NOT_RUN`.
10. Present smoke checklist. Only after owner smoke may docs bind exact SHA and request separate Epic
    closure/EPIC-09 authorization.

## 9. Automated test strategy

### 9.1. Domain/Application regression

- Exact level thresholds and reward formula; ineligible/duplicate completion remains zero-reward.
- Purchase success, insufficient, already-owned, same-item/different-item concurrency and ambiguous
  commit readback.
- Equip owned/unowned, same-state, opposite-state concurrency, purchase→equip ordering and free invariant.
- Verify all commands share the same coordinator in composition.

### 9.2. Real SQLite aggregate

- Fresh reward→purchase→equip→room→close/reopen with exact row counts/links/balances/timestamps.
- Reward receipt ↔ session/profile; purchase receipt ↔ profile/catalog; ownership ↔ purchase exact linkage.
- Fingerprints before/after all read-only projections and failed commands.
- Rollback/commit failure stages; no negative balance, duplicate receipt or orphan ownership.
- Offline/no-provider run is byte-for-byte equivalent for product tables.

### 9.3. Controller/presentation/navigation

- Full ready/loading/empty/error/retry/busy/success states remain reachable and truthful.
- Rapid actions are coalesced/disabled; committed refresh pending reruns loader only.
- Refocus/unmount/relaunch drops stale completion and rebuilds current state.
- No Shop prototype fallback; Home/Pet/Focus/Break and Result regressions pass.
- Existing common component snapshots/a11y semantics regress; no new feature-local duplicate.

### 9.4. Analytics/static/export

- Exact three events, properties, timestamps, deterministic IDs and queue dedupe.
- Opt-out/read throw/queue reject/queue throw do not affect product facts.
- No `item_unequipped`, provider import, network dependency or event from render/relaunch.
- Schema/catalog/assets exact hashes/identities; no new migration/dependency/native config.
- `pnpm quality`, device validator, boundary/hygiene checks and Android/iOS Expo export at frozen candidate.

## 10. Fixture vocabulary

Dedicated variable proposed: `EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE`. Every recognized value is
dev-only, finite and selects `pixeldoro-us-08-05-<scenario>.db`; release/unknown values are ignored.

| Scenario | Runtime purpose |
|---|---|
| `epic_08_fresh_reward_to_room` | Fresh isolated DB; compose existing accelerated Focus review clock for observable reward→buy→equip→room |
| `epic_08_relaunch_committed` | Idempotently prepare a committed item through production commands, then validate relaunch |
| `epic_08_provider_failure` | Product flow succeeds while analytics queue/provider port fails |
| `epic_08_accessibility_matrix` | Deterministic available/owned/equipped states for screen-reader/large-text review |

`epic_08_concurrent_purchase_equip`, `epic_08_corrupt_identity` and `epic_08_all_errors_once` remain
automated integration-harness labels rather than runtime UI scenarios under proposed Option A. This
keeps destructive/cross-command timing deterministic and avoids exposing a large diagnostic control UI.

Fixture setup may call production Focus/purchase/equip commands. It may decorate ports to fail reads or
analytics, but must not insert orphan valid facts, edit balances directly, bypass the coordinator or
select/reset `pixeldoro.db`. Cleanup closes/unsets; no recursive workspace deletion.

## 11. Manual device guide plan

Planned file: `apps/mobile/test/device/epic-08-exit-smoke.md`; initial status `NOT_RUN`.

### 11.1. Main quick flow

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE=epic_08_fresh_reward_to_room \
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_fast_clock \
pnpm start --clear
```

Optional deep link: `xcrun simctl openurl booted 'pixeldoro://?review=us0805'`; Android uses the same
quoted URL.

- [ ] Record exact SHA, platform/device/OS, app build, timezone, network and accessibility settings.
- [ ] Complete accelerated eligible Focus; Result/Home/Shop show one committed reward.
- [ ] Buy `desk-mug`; rapid second action cannot double debit/unlock.
- [ ] Open `Đã sở hữu`, equip mug, return Home and see it in the room.
- [ ] Background/refocus, notification/Result reopen and cold relaunch preserve exact values/item.
- [ ] Repeat main journey in Airplane mode; no network/provider requirement or crash.
- [ ] Run provider-failure fixture; economy/inventory/room outcome is identical.
- [ ] Run VoiceOver/TalkBack, largest text, Reduce Motion, grayscale and touch-target checks where available.
- [ ] Regress Home/Pet/Focus/Break and record unexecuted formal rows as `NOT_RUN`, never implicit PASS.

### 11.2. Cleanup

```sh
unset EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] Normal launch selects `pixeldoro.db` and retains the user's normal data unchanged.
- [ ] Attach actual PASS/FAIL/BLOCKED/NOT_RUN evidence; no placeholder is promoted as result.

## 12. Acceptance criteria

- [x] Eligible completed Focus grants exact XP/Coin once; render/reopen/reconcile retry does not regrant.
- [x] Home and Shop show the same committed progression after reward and relaunch.
- [x] Purchase uses exact catalog price and produces one debit/receipt/ownership under rapid/retry/race.
- [x] Insufficient/already-owned/failure paths leave no partial facts and never make Coin negative.
- [x] Equip is owned-only/free/idempotent; race final state is coherent and siblings remain unchanged.
- [x] Pet Room shows only the committed equipped set after Home refocus and cold relaunch.
- [x] Product loop works offline and without analytics/provider delivery.
- [x] Analytics exact IDs/properties/dedupe/opt-out/failure isolation pass; no render/relaunch re-emission.
- [x] Corrupt/missing durable identity fails closed; transient failures retain truthful Retry behavior.
- [x] Shop production route has no prototype fallback; later-Epic prototype owners remain intact.
- [x] Home/Pet/Focus/Break/Result regressions, a11y semantics and common components pass.
- [x] Full quality, boundaries, hygiene, device validator and both platform JS exports pass at one candidate.
- [x] Implementation report records exact automated/manual/formal status without fabricated evidence.

## 13. Delivery gates

### 13.1. Definition of Ready

- [x] US-08-01→04 are owner accepted; latest exact SHA is `94a0b24...`.
- [x] EPIC confirmations 08/09/10/11 approve analytics semantics, no-impact verdict, prototype boundary
  and formal evidence deferral policy.
- [x] Schema/repositories/transactions/routes/analytics/components/fixtures were audited.
- [x] No schema/dependency/native or new Product capability is required by the current plan.
- [x] Owner approves `US0805-CONFIRM-01→06` Option A.
- [x] Implementation start SHA is frozen at `e46c5e6...` and worktree overlap was rechecked.

### 13.2. Definition of Done

- [x] All acceptance criteria and aggregate real-SQLite/race/failure/analytics tests pass.
- [x] Dev fixture is gated, isolated, deterministic, idempotent and has tested cleanup/normal-DB proof.
- [x] No presentation component exceeds 300 lines; any touched 240–260 line component gets split review.
- [x] `ShopController` receives no added responsibility; a touched functional gap triggers extraction review.
- [x] No schema/dependency/native/provider/new-event/prototype-scope drift.
- [x] Full quality and Android/iOS exports pass at one frozen candidate SHA.
- [x] Implementation report/device guide contain actual evidence; formal deferred cases remain unchecked.
- [x] Owner quick UI result is recorded separately from formal testing.

### 13.3. Exit gate

- [x] Owner accepts exact committed/pushed candidate `30adc34...` after quick UI smoke on 2026-09-11.
- [x] Owner explicitly authorizes `EPIC-08_EXIT_REPORT.md` and EPIC-08 closure on 2026-09-11.
- [x] Master Epic status is updated to `DONE_OWNER_ACCEPTED`; EPIC-09 dependency gate is open but no
  EPIC-09 planning/coding was started implicitly.

## 14. Risks and rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| Exit test duplicates existing Story tests | Aggregate only cross-feature invariants; reuse helpers | Remove redundant case, retain cross-loop proof |
| Fixture mutates normal data | Dedicated env/database name + tests + release gate | Disable resolver; normal DB path unchanged |
| Race test is flaky | Deterministic coordinator/deferred ports, no wall-clock sleep | Keep race automated; do not expose runtime timing UI |
| Analytics blocks product flow | Best-effort existing ports and fingerprint equality | Remove only exit wiring/test decorator, never product commit |
| Prototype retirement expands scope | Static allow/deny ownership list | Revert aggregate rule, keep accepted per-route guards |
| Evidence-only Story grows into refactor | Stop-on-gap rule and owner re-review | Ship no speculative refactor |

## 15. Open questions cần owner confirm

### US0805-CONFIRM-01 — Story shape

- **Option A — đề xuất:** evidence-first integration/exit slice; không thêm Product behavior/UI. Chỉ sửa
  narrow accepted-behavior gap nếu aggregate test chứng minh.
- **Option B:** đồng thời refactor/redesign Shop/Room trước Epic exit.
- **Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-11.

### US0805-CONFIRM-02 — Fixture surface

- **Option A — đề xuất:** dedicated exit env/database; 4 runtime UI scenarios ở mục 10, còn race/corrupt/
  all-errors là deterministic automated harness, không tạo diagnostic UI lớn.
- **Option B:** expose toàn bộ 7 scenario trên Development Build UI.
- **Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-11.

### US0805-CONFIRM-03 — Race và failure evidence

- **Option A — đề xuất:** exhaustive race/rollback/corrupt proof bằng real SQLite automated tests; owner
  smoke chỉ chạy representative rapid-tap, provider failure, offline và relaunch.
- **Option B:** bắt owner chạy thủ công toàn bộ failure/race matrix trước candidate.
- **Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-11.

### US0805-CONFIRM-04 — Analytics boundary

- **Option A — đề xuất:** verify ba event đã duyệt và local queue; không thêm provider, event hoặc UI.
- **Option B:** đưa provider delivery/worker vào US-08-05.
- **Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-11.

### US0805-CONFIRM-05 — Prototype retirement

- **Option A — đề xuất:** enforce Shop/Home/room production boundary, giữ root/History/Settings prototype
  cho Epic owner kế tiếp.
- **Option B:** xóa toàn bộ prototype scaffolding trong EPIC-08.
- **Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-11.

### US0805-CONFIRM-06 — Acceptance và Epic closure

- **Option A — đề xuất:** automated gates + owner quick UI đủ accept US-08-05; formal breadth tiếp tục
  `DEFERRED_TO_EPIC_12`. Epic exit/EPIC-09 cần một xác nhận riêng sau exact candidate.
- **Option B:** bắt buộc full formal iOS/Android accessibility/device matrix và tự đóng Epic cùng Story.
- **Status:** `APPROVED_OPTION_A` — owner confirmed 2026-09-11.

Approval Option A đã được ghi nhận; implementation candidate hiện chờ owner quick UI. Approval này không
tự authorize commit/push hoặc Epic closure.

## 16. Impact verdict and change log

| Area | Verdict |
|---|---|
| Schema/migration | `NONE_PROPOSED`; migration `001` already covers all facts/invariants |
| Dependency/package | `NONE_PROPOSED` |
| Native/prebuild/permission | `NONE_PROPOSED` |
| Production UI | No new screen/component expected |
| Durable writes | Existing Focus reward, purchase, equip commands only |
| Analytics | Verify existing three local events; no provider/new event |
| Prototype | Shop/Home integrity only; later owners preserved |
| Deferred | Formal breadth, provider delivery, later Epic UI and all new economy behavior |

| Version | Date | Author | Change |
|---|---|---|---|
| 0.4.0 | 2026-09-11 | Codex | Recorded explicit owner authorization to close EPIC-08. Exit Report created, Epic marked DONE_OWNER_ACCEPTED and EPIC-09 dependency gate opened without implicitly starting its planning or coding. |
| 0.3.0 | 2026-09-11 | Codex | Bound owner quick UI PASS (no crash; behavior as expected) to exact committed/pushed SHA `30adc34...`; US-08-05 is DONE_OWNER_ACCEPTED. Formal breadth remains NOT_RUN/deferred. EPIC-08 implementation is sufficient, but Epic closure/EPIC-09 still require explicit owner authorization. |
| 0.2.0 | 2026-09-11 | Codex | Recorded owner approval for `US0805-CONFIRM-01→06` Option A and froze implementation start SHA `e46c5e6...`. Delivered the isolated exit fixture, aggregate SQLite/relaunch/race/analytics/static integrity evidence and device guide. Aggregate evidence exposed and fixed the missing `pricePaidCoins` analytics property allowlist entry. Candidate is automated-PASS and awaits owner quick UI; no commit/push or Epic closure was authorized. |
| 0.1.0 | 2026-09-11 | Codex | Initial plan after US-08-04 owner acceptance at exact SHA `94a0b24...`. Audited the full production reward/progression/purchase/equip/room/analytics/route stack; proposed evidence-first aggregate SQLite loop, deterministic race/failure/analytics proof, dedicated isolated exit fixtures, device guide and six pending confirmations. No production code, schema, dependency or native configuration changed. |
