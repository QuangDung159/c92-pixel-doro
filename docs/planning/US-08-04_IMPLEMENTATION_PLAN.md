---
document_id: PIXELDORO_US_08_04_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-08-04 Implementation Plan
version: 0.3.0
status: IMPLEMENTATION_CANDIDATE_AWAITING_OWNER_SMOKE
implementation_status: VALIDATED_UNCOMMITTED_CANDIDATE
date: 2026-09-11
last_updated: 2026-09-11
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-08
planning_baseline_sha: d6399dd7590852c051f671757c3200c8d70b8bc8
implementation_start_sha: 4b1dee1a3f56a5d9022da9f4a22160368391c6fc
exact_implementation_sha: null
previous_story: US-08-03
previous_story_status: DONE_OWNER_ACCEPTED
previous_story_implementation_sha: d6399dd7590852c051f671757c3200c8d70b8bc8
manual_device_status: NOT_RUN_OWNER_SMOKE_REQUESTED
formal_tester_status: NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED
art_candidate_status: APPROVED_AND_PROMOTED
art_candidate_approval: US0804_ART_01_APPROVED_OWNER_2026_09_11
art_candidate_id: us0804-room-art-candidate-v1
art_candidate_sha256: ccb8d07187456131505ca8f71051783647b2aaca7f5b869f416649cfe957bcf9
art_backdrop_sha256: d22ae4d4198a8aa15a50ef442eff337f83db6c7d9af50f9b235fe8e5a9ed06c5
schema_change: NONE_PROPOSED
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
scope:
  - mobile_mvp
  - epic_08
  - us_08_04
  - equipped_room_projection
  - bundled_decoration_art
  - deterministic_fixed_anchors
authority: PLANNING
story_baseline: ./EPIC-08_USER_STORIES.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
data_model_baseline: ../architecture/data-model.md
gamification_baseline: ../specifications/gamification-rules.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-08-04 — Equipped Decorations in Pet Room

## 0. Outcome, scope và execution gate

**User outcome:** Pet Room hiển thị đúng các decoration đã committed ở trạng thái equipped. Empty,
one và many-equipped đều an toàn; đổi trạng thái tại Shop rồi quay về Home hoặc relaunch sẽ dựng lại
đúng room từ SQLite. Decoration chỉ là cosmetic và không can thiệp Pet/session/economy truth.

US-08-03 đã được owner quick-smoke accept tại exact committed/pushed SHA `d6399dd...`. Plan US-08-04
đã được owner duyệt Option A và review-only art package đã được tạo; chưa sửa production code,
migration, dependency/native hoặc import candidate vào runtime.

US-08-04 có hai gate tách biệt; gate thứ nhất đã được owner duyệt Option A ngày 2026-09-11:

1. Owner duyệt `US0804-CONFIRM-01→06` để khóa architecture/UX và cho phép tạo exact art candidate —
   `APPROVED_OPTION_A`.
2. Codex trình contact sheet/room preview; owner đã duyệt exact candidate bằng `US0804-ART-01` ngày
   2026-09-11 trước khi asset được đưa vào production manifest và production code bắt đầu.

Candidate package `us0804-room-art-candidate-v1` đã được owner duyệt. Backdrop và transparent item
atlas đã được promote vào runtime cùng typed manifest; implementation candidate đang chờ owner smoke.

### 0.1. In scope

- Một read-only equipped-room projection riêng cho Home/Pet Room.
- Exact mapping 12 stable catalog IDs → bundled decoration PNG + fixed anchor/layer.
- Một default room backdrop không thuộc catalog, nếu Option A được duyệt và exact art được accept.
- Empty/one/many equipped; stable order; Home refocus/cold relaunch refresh.
- Loading, stale-refresh, read error, corrupt projection và missing-asset fallback không làm Pet crash.
- Concise room summary cho accessibility; raw decorative images bị ẩn khỏi screen reader.
- Dev-only fixtures, real SQLite/integrity/component tests, device guide và implementation report.

### 0.2. Out of scope

- Drag/drop, user-controlled placement, persisted slot/position, physics/collision hoặc room editor.
- Single-slot wardrobe, auto-equip, equip cost/refund, delete ownership hoặc sửa catalog/economy.
- Decoration animation như truth, Pet gameplay effect, multiplier/protection hoặc new Pet state.
- Shop thumbnail redesign; US-08-04 chỉ sở hữu visual payoff trong Pet Room.
- Remote images/CDN/download, analytics on render, new package/native/permission.
- History/Settings, contribution colors, Pet naming/evolution và EPIC-09+ scope.

## 1. Baseline audit

### 1.1. Accepted upstream

| Fact | Evidence |
|---|---|
| Branch/baseline | `feats/epic-08` at exact origin SHA `d6399dd7590852c051f671757c3200c8d70b8bc8`; clean before docs |
| US-08-01 | `DONE_OWNER_ACCEPTED` at `9be0a0f...` |
| US-08-02 | `DONE_OWNER_ACCEPTED` at `5c6791d...` |
| US-08-03 | `DONE_OWNER_ACCEPTED` at `d6399dd...`; owner reports no crash/expected behavior |
| Last automated gate | 169 files / 892 tests; quality, boundaries, hygiene and Android/iOS JS exports PASS |
| Manual breadth | Owner quick UI PASS; structured device/a11y/offline matrix remains `NOT_RUN` |

### 1.2. Reusable production capability

| Area | Current capability | US-08-04 decision |
|---|---|---|
| Durable truth | `owned_items.is_equipped/equipped_at`; multi-equip and composite receipt FK | Read only; no schema/write |
| Catalog | Exact approved 12 stable IDs/names and immutable schema seed | Validate against same authority |
| Repository | `catalog.list`, `ownedItems.listByProfile` and shared SQLite owner | Sufficient; no new SQL required initially |
| Serialization | One application `SessionCommandCoordinator` serializes Shop mutation/read | Room read joins same coordinator |
| Shop | Buy/equip/unequip commits then reloads authoritative projection | No direct UI handoff or optimistic room state |
| Home | Route focus refreshes Pet; `HomeScreen` composes Pet/profile/Focus CTA | Add independent room slice and focus refresh |
| Pet scene | `PetStage` owns bounded 230px scene, animation and status text | Extend with optional visual layers, backward-compatible |
| Pet arbitration | Idle/Working/Breaking/Celebrating/Bugged already accepted/tested | Decoration cannot own or alter state |
| Assets | Approved Cat sheets + typed hashes/manifest/attribution | Mirror asset discipline for room set |
| Item art | `assets/sprites/items/.gitkeep`; no approved decoration art | Hard gate: create and approve exact candidate |

### 1.3. Gap verdict

- Existing schema already represents all room truth; a migration would invent forbidden slot/layout data.
- Existing repository can provide a consistent catalog + owned snapshot through the shared read
  coordinator. A dedicated equipped-only SQL query is optional optimization, not required for 12 rows.
- Presentation has no production room art. Neutral Shop diamonds and Cat sprites are not decoration
  assets and cannot be promoted implicitly.
- The main technical change is a read-only application/controller slice plus layered Home presentation.
- Therefore proposed impact remains `NO SCHEMA / NO DEPENDENCY / NO NATIVE CHANGE`; art approval is the
  only hard pre-code gate.

## 2. Locked invariants

1. SQLite ownership/equipped rows are the only room item truth; presentation never persists layout.
2. Projection exposes only approved stable IDs, display names and equipped timestamps—not image modules.
3. Only `isEquipped=true` items appear; available, owned-unequipped, unknown or invalid items never do.
4. Catalog ordering is the deterministic projection order; render order then uses manifest layer/order.
5. Multiple decorations coexist. Rendering one item never hides/unequips/rewrites a sibling.
6. Room load/render/navigation writes zero profile, receipt, ownership, reward, session or analytics rows.
7. Decoration failure is isolated: Pet status, profile and Start Focus remain usable.
8. No optimistic bridge from Shop; Home reads committed state after navigation/refocus.
9. Missing artwork never fabricates ownership or substitutes a different purchasable item.
10. Bundled asset imports stay in Presentation. Application and repository layers remain asset-agnostic.
11. Decoration is cosmetic only and cannot alter Pet arbitration, timer, XP, Coin or reward outcomes.
12. No render analytics event is introduced; `item_equipped` remains owned by US-08-03.

## 3. Phase A — exact art candidate gate

### 3.1. Candidate package

After plan approval, create a review-only package containing:

- One coherent warm pixel-art default room backdrop, explicitly non-catalog.
- Twelve transparent item candidates matching exact IDs:
  `desk-mug`, `tiny-plant`, `book-stack`, `desk-lamp`, `wall-calendar`, `floor-cushion`,
  `small-rug`, `wall-poster`, `bookshelf`, `standing-lamp`, `armchair`, `window-view`.
- One contact sheet with ID/name labels outside sprite bounds for review only.
- Empty, one-equipped, three-equipped and all-equipped room previews at narrow and max content widths.
- Candidate manifest recording source, generation date, dimensions and candidate hashes.

Candidate assets live under a `candidates/room-v1/` directory and are not imported by runtime code.
Production files are promoted only after `US0804-ART-01` approval.

### 3.2. Proposed visual direction

- Warm, calm home-office pixel art matching Cat Dev’s friendly low-detail proportions.
- Muted cream/brown room with restrained blue/gold accents from the existing UI palette.
- Transparent decoration PNGs, no baked text, currency, logo, Pet, timer or state indicator.
- Pixel edges remain crisp at supported display sizes; no remote font or texture dependency.
- Each object remains identifiable alone and readable without color as the only differentiator.
- Backdrop remains understandable when no catalog item is equipped.

### 3.3. Promotion contract after approval

Proposed production structure:

```text
apps/mobile/assets/sprites/rooms/pet-room-v1.png
apps/mobile/assets/sprites/items/room-v1/<stable-item-id>.png
apps/mobile/src/presentation/room/item-decoration-manifest.ts
apps/mobile/assets/ATTRIBUTIONS.md
```

The typed manifest owns exact bundled import, SHA-256, intrinsic size, room zone, normalized anchor,
display bounds, z-layer and fallback policy. CI/static tests require exactly the 12 approved IDs, no
duplicate anchor key, no missing file and matching hashes.

## 4. Application projection

### 4.1. Contract

Add `packages/application/src/room/load-equipped-room-projection.use-case.ts`:

```ts
interface EquippedRoomItem {
  readonly itemId: string;
  readonly displayName: string;
  readonly equippedAt: number;
}

interface EquippedRoomProjection {
  readonly items: readonly EquippedRoomItem[];
}

type LoadEquippedRoomProjectionErrorCode =
  | 'ROOM_READ_FAILED'
  | 'ROOM_CATALOG_INVALID'
  | 'ROOM_OWNERSHIP_INVALID';
```

Dependencies are the approved catalog snapshot, `catalog.list` and `ownedItems.listByProfile` only.
The query runs under the existing application coordinator. It does not receive profile debit,
purchase insert, equip update, session/reward write, analytics queue or asset resolver capabilities.

### 4.2. Validation and projection rules

- Validate the actual catalog as the exact approved 12-item snapshot: identity, name, category, price,
  version, timestamp shape, no unknown/duplicate/missing row.
- Validate all owned rows for MVP profile, known item ID, unique item, non-empty receipt linkage and
  equipped flag/timestamp shape. Composite receipt coherence remains guarded by SQLite FK and the
  purchase/equip command owners; room query does not perform N receipt reads.
- Filter only equipped rows and map in approved catalog order.
- Freeze the result; empty array is success.
- Persistence corrupt/invariant errors map to typed data-invalid; technical errors map read-failed.
- Never repair, insert, unequip or delete rows.

### 4.3. Shared validation reuse

Extract only small pure catalog/ownership validators from the Shop projection when doing so reduces
drift without changing Shop behavior. Do not refactor purchase/equip transaction code or broaden this
Story merely to create a generic framework. Existing Shop regression tests must remain unchanged/green.

## 5. Mobile controller and lifecycle

### 5.1. Projection state

Add a feature-owned `RoomDecorationsController`:

```ts
type RoomDecorationsControllerProjection =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly room: EquippedRoomProjection;
      readonly refresh: 'idle' | 'refreshing' | 'error';
    }
  | { readonly status: 'error'; readonly code: 'ROOM_READ_FAILED' | 'ROOM_DATA_INVALID' };
```

- `activate()` initial-loads once per Home focus episode; rapid calls coalesce.
- Refocus reads committed truth. Previous successful projection remains visible while refreshing.
- Technical refresh failure preserves previous committed items and offers room-only Retry.
- Initial failure shows an inline room fallback/error but does not replace Pet/profile/Focus CTA.
- Corrupt room projection is fail-closed and isolated to decoration presentation; it does not invoke
  global bootstrap Recovery under proposed Option A.
- Generation/dispose guards drop stale completions after Home blur/unmount.

### 5.2. Composition/facade

- Add `create-room-decorations-slice.ts` using persistence catalog/owned items and the shared command
  coordinator.
- Expose controller and `refreshRoomDecorations` through the mobile application facade/provider.
- Home route focus activates both Pet refresh and room refresh; blur deactivates only the room
  controller. No Shop controller coupling/event bus is introduced.
- Reset/dispose joins existing application lifecycle; reset returns room to idle/empty through reload.

## 6. Presentation and deterministic placement

### 6.1. Component boundaries

- `EquippedRoomDecorationLayer`: renders manifest-mapped bundled images only.
- `RoomDecorationStatus`: renders loading/stale/error/missing-art notice and textual summary.
- `PetStage`: receives optional underlay/overlay scene nodes, defaults undefined, and keeps existing
  Pet animation/status semantics unchanged.
- `PetVisualStatus`: forwards optional room layers only for a valid Pet scene; existing loading/recovery
  flows retain ownership of Pet errors.
- `HomeScreen`: composes room projection with Pet/profile and keeps each file below 300 lines.

No duplicate `PetStage`, no direct repository call, and no asset lookup inside application/controller.

### 6.2. Anchor model

Manifest anchors are deterministic presentation data, not durable slots. Proposed semantic zones:

| Item | Zone | Layer intent |
|---|---|---|
| `window-view` | upper-left wall | back |
| `wall-calendar` | upper-center wall | back |
| `wall-poster` | upper-right wall | back |
| `bookshelf` | left wall/floor | back |
| `standing-lamp` | right floor | back |
| `small-rug` | center floor | back, below Pet |
| `armchair` | right floor | back |
| `desk-lamp` | left work surface | back |
| `tiny-plant` | left work surface | front detail |
| `book-stack` | center-left floor/surface | front detail |
| `desk-mug` | center-right work surface | front detail |
| `floor-cushion` | front-right floor | front |

Exact normalized coordinates/display bounds are locked only with the approved room preview. Runtime
uses the manifest values at every width; it never computes a new layout from equip time or array index.
All-equipped preview must remain legible without covering Pet status text or Start Focus action.

### 6.3. Empty, missing and accessibility behavior

- Empty equipment shows the approved base room and Cat; no error, upsell modal or fake item.
- A missing asset omits only that image, keeps its committed name in the summary and shows one concise
  inline notice with Retry. No substitute catalog item is rendered.
- Decoration images set `accessible={false}`, `accessibilityElementsHidden` and Android equivalent;
  they do not create 12 noisy focus targets.
- One text summary announces `Phòng có N vật phẩm: ...`; empty summary is concise and non-live.
- Pet state/status remains the live semantic owner. Room refresh success is not repeatedly announced.
- Largest text affects summary/notices below the bounded scene, never absolute-positioned item art.
- Decoration layers use `pointerEvents="none"`; existing Start Focus and navigation touch targets remain.

## 7. Failure/retry matrix

| Stage | Visible behavior | Durable behavior | Retry |
|---|---|---|---|
| Empty equipped set | Base room + Cat + empty summary | No write | None |
| Initial technical read fails | Base/Pet usable; room inline error | No write | Room loader only |
| Refresh read fails | Previous room stays + stale notice | No write | Room loader only |
| Catalog/ownership invalid | No item art; room data-invalid notice | No repair/write | Re-read only after external correction |
| One asset missing/throws | Other items render; one notice + truthful summary | Ownership unchanged | Re-resolve bundled manifest only |
| Pet projection fails | Existing Pet recovery UI owns error | Room writes nothing | Existing Pet retry |
| App backgrounds/unmounts | Stale completion dropped | No write | Home refocus reload |
| Shop equip finishes then Home opens | Home reads committed set | Equip already owned by US-08-03 | Never replay equip |
| Offline | Bundled room renders normally | Local read only | Same as online |

## 8. Files and implementation order

### Phase A — review-only art

1. Generate candidate backdrop + 12 coherent item assets and contact sheet.
2. Build empty/one/many/all-equipped narrow/wide previews.
3. Record source/dimensions/hashes in candidate manifest and attribution draft.
4. Stop and request explicit `US0804-ART-01` owner approval.

### Phase B — code after art approval

1. Add application equipped-room projection/use-case and tests.
2. Add RoomDecorations controller, composition slice, facade/provider hooks and lifecycle tests.
3. Promote only approved assets; add typed runtime manifest/hash/coverage tests and attribution.
4. Add layered room components and backward-compatible PetStage/PetVisualStatus integration.
5. Wire Home route focus/refresh/error isolation.
6. Add fixtures, real SQLite/route integrity/component tests and device guide.
7. Run full quality, boundary/hygiene/device validator and Android/iOS JS exports.
8. Create implementation report with exact evidence; do not claim manual PASS before owner smoke.

### Expected production files

- `packages/application/src/room/load-equipped-room-projection.use-case.ts` + tests/export.
- `apps/mobile/src/application/room/room-decorations.controller.ts` + tests/export.
- `apps/mobile/src/composition/room/create-room-decorations-slice.ts` + tests.
- `apps/mobile/src/presentation/room/item-decoration-manifest.ts` + tests.
- `apps/mobile/src/presentation/features/home/equipped-room-decoration-layer.tsx` + tests.
- `apps/mobile/src/presentation/features/home/room-decoration-status.tsx` + tests.
- Existing Home route/screen, provider/facade/root and Pet scene components via bounded edits.
- `apps/mobile/src/composition/review/room-decoration-review-fixture.ts` + tests.
- `apps/mobile/test/integration/epic-08-equipped-room-route-integrity.integration.test.ts`.
- `apps/mobile/test/device/equipped-room-smoke.md` + validator update.
- Approved assets/manifest/attribution and `US-08-04_IMPLEMENTATION_REPORT.md`.

### Explicitly unchanged

- Migration 001/schema manifest/checksum and every durable write repository method.
- Purchase/equip/reward/session commands and event taxonomy.
- Cat identity/state animation assets and arbitration logic.
- Dependencies, lockfile, app/native config, permissions and four-tab navigation.

## 9. Fixture and test strategy

### 9.1. Safe dev fixtures

Dedicated prefix `pixeldoro-us-08-04-`:

| Fixture | Setup |
|---|---|
| `room_empty` | Fresh profile, no ownership |
| `room_one_equipped` | Production Focus reward → purchase → equip `desk-mug` |
| `room_many_equipped` | Production commands create three owned, two/three equipped |
| `room_mixed_equipped` | Equipped + owned-unequipped rows verify filter |
| `room_missing_asset` | Valid durable set; presentation resolver omits one known candidate |
| `room_catalog_corrupt` | Decorated read returns invalid catalog; no DB corruption |
| `room_read_failure_once` | First/refresh room read fails once, then delegate succeeds |

Existing `EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE` covers Idle/Working/Breaking; terminal fixture covers
Celebrating/Bugged. Combine it with the EPIC-08 room variable rather than multiplying durable DBs.
All ownership fixtures use production Focus reward/purchase/equip commands; no direct orphan insert.

### 9.2. Automated evidence

- Application: empty/one/many/mixed; stable order; unknown/duplicate/corrupt/timestamp/read failures;
  immutable result and zero write capability.
- Controller: initial/refocus/stale refresh/error/retry/coalescing/deactivate/dispose.
- Manifest: exactly 12 IDs/files/hashes, unique asset ID/anchor, allowed layers and bounds.
- Component: empty/many/missing art, layer order, pointer behavior, accessibility-hidden images and summary.
- Pet regression: all five states, playback callbacks, visibility/Reduce Motion and terminal feedback.
- SQLite: committed equip set, mixed filtering, close/reopen, zero row changes from room reads.
- Static integrity: Home route uses facade only; application imports no assets/React Native; no network
  image URI/new analytics/schema/dependency/native change; component line-count budget.
- Full `pnpm quality`, platform exports and device guide validator.

### 9.3. Manual smoke outline

- Start `room_many_equipped`; verify exact expected assets and no unexpected/duplicate item.
- Unequip one in Shop, return Home, verify only that decoration disappears.
- Background/cold relaunch/Airplane mode; same committed set returns.
- Run empty/missing/catalog/read-error cases; base Pet/Start Focus remain usable.
- Exercise Idle/Working/Breaking/Celebrating/Bugged without decoration changing Pet semantics.
- Check narrow Android, iPhone, largest text, VoiceOver/TalkBack, Reduce Motion and touch navigation.
- Record device/OS/SHA/art version/result; unexecuted breadth remains `NOT_RUN`.

## 10. Delivery gates

### Definition of Ready

- [x] US-08-03 accepted at exact SHA `d6399dd...`.
- [x] EPIC confirmations 06/07/09 approve fixed anchors, explicit art gate and manual truthfulness.
- [x] Schema/repository/Home/Pet/assets baseline audited; no migration capability gap.
- [x] Owner approved `US0804-CONFIRM-01→06` Option A on 2026-09-11.
- [x] Exact `US0804-ART-01` candidate/placement preview approved on 2026-09-11.
- [x] Exact implementation start SHA recorded after both approvals: `4b1dee1...`.

### Definition of Done

- [ ] Only committed equipped known items render at approved stable anchors; empty/many/reopen work.
- [ ] Room read/art failure never blocks Pet/profile/Start Focus or changes durable data.
- [ ] All five Pet states and Shop→Home handoff regress without optimistic state.
- [ ] Approved assets have typed manifest, matching hashes and attribution/source record.
- [ ] Accessibility summary/fallback and decorative-node hiding pass automated/manual evidence.
- [ ] Fixtures/device guide/report exist with manual/formal status recorded honestly.
- [ ] Quality/boundaries/hygiene/device validator and Android/iOS exports pass.
- [ ] Exact committed SHA and owner smoke are bound before opening US-08-05.

## 11. Open questions cần owner confirm

### US0804-CONFIRM-01 — Art workflow gate

- **Option A — đề xuất:** duyệt plan cho phép tạo review-only art package; Codex phải trình preview và
  dừng chờ `US0804-ART-01` trước khi promote asset/code production.
- **Option B:** plan approval đồng thời chấp nhận artwork chưa nhìn thấy.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

### US0804-CONFIRM-02 — Default room backdrop

- **Option A — đề xuất:** candidate gồm một warm pixel-art backdrop luôn có, không thuộc catalog, để
  empty room vẫn hoàn chỉnh và 12 fixed anchors có ngữ cảnh.
- **Option B:** giữ nền phẳng hiện tại và chỉ thêm item sprites.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

### US0804-CONFIRM-03 — Projection/error isolation

- **Option A — đề xuất:** dedicated read-only room projection/controller; lỗi decoration fail-closed
  trong room layer nhưng Pet/profile/Start Focus vẫn dùng được, không global Recovery.
- **Option B:** filter Shop projection hoặc đưa mọi room corruption vào global Recovery.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

### US0804-CONFIRM-04 — Placement model

- **Option A — đề xuất:** 12 manifest-defined normalized anchors + back/front layers; không slot UI,
  không persist position, không đổi vị trí theo equip time.
- **Option B:** auto-flow/grid hoặc single visible decoration.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

### US0804-CONFIRM-05 — Missing asset và accessibility

- **Option A — đề xuất:** omit đúng broken image, giữ committed name trong một room summary, hiện một
  inline notice; toàn bộ decoration image bị ẩn khỏi screen reader.
- **Option B:** render icon thay thế cho từng item và cho từng image thành focus target.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

### US0804-CONFIRM-06 — Refresh và scope

- **Option A — đề xuất:** Home focus tự đọc lại qua shared coordinator; refresh failure retry loader
  room only. Asset chỉ dùng trong Pet Room ở Story này, không redesign Shop tile.
- **Option B:** Shop push projection trực tiếp sang Home và đồng thời đổi thumbnail Shop.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-11.

Plan confirmations và exact `US0804-ART-01 candidate v1` đã được duyệt. Gate kế tiếp là owner quick
UI smoke trên implementation candidate; chưa được ghi PASS cho đến khi owner xác nhận.

## 12. Impact verdict and change log

| Area | Verdict |
|---|---|
| Schema/migration | `NONE_PROPOSED`; equipped truth and multi-equip already sufficient |
| Dependency/package | `NONE_PROPOSED`; React Native Image and current tooling sufficient |
| Native/prebuild/permission | `NONE_PROPOSED` |
| Durable writes | None |
| Assets | New owner-approved bundled backdrop + 12 item PNGs + typed hashes/attribution |
| Analytics | None on room render |
| Deferred | Editor/slots/positions, remote assets, Shop thumbnail redesign, gameplay effects |

| Version | Date | Author | Change |
|---|---|---|---|
| 0.3.0 | 2026-09-11 | Codex | Recorded exact `US0804-ART-01 candidate v1` approval and implementation start SHA `4b1dee1...`. Promoted backdrop and transparent 12-item atlas; added immutable equipped-room projection, isolated controller, Home focus lifecycle, deterministic layered rendering, explicit `room`/`focus` scene modes, accessibility summary, tests and smoke guide. Room mode fits the full backdrop and scales Cat down; focus mode renders Cat only. Full quality 174 files / 904 tests and Android/iOS exports PASS; owner/manual smoke remains NOT_RUN. |
| 0.2.0 | 2026-09-11 | Codex | Recorded owner approval of confirmations 01–06 Option A. Generated review-only `us0804-room-art-candidate-v1` package with the built-in ImageGen tool: 12-item room/contact sheet (`ccb8d071...`) and separate empty backdrop (`d22ae4d...`). Production code remains NOT_STARTED pending `US0804-ART-01`. |
| 0.1.0 | 2026-09-11 | Codex | Initial plan after US-08-03 owner acceptance at exact SHA `d6399dd...`. Audited clean baseline, missing art hard gate, read-only room projection, layered Pet/Home composition, fixed anchors, failure isolation, accessibility, fixtures/tests and six pending confirmations. No art or production code changed. |
