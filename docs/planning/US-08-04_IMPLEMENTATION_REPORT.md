---
document_id: PIXELDORO_US_08_04_IMPLEMENTATION_REPORT
title: PixelDoro Mobile MVP — US-08-04 Implementation Report
version: 0.1.0
status: IMPLEMENTATION_CANDIDATE_AWAITING_OWNER_SMOKE
date: 2026-09-11
owner: Dũng Lư
branch: feats/epic-08
implementation_start_sha: 4b1dee1a3f56a5d9022da9f4a22160368391c6fc
exact_implementation_sha: null
manual_device_status: NOT_RUN_OWNER_SMOKE_REQUESTED
formal_tester_status: NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED
schema_change: NONE
dependency_change: NONE
native_change: NONE
---

# US-08-04 — Equipped Decorations in Pet Room

## Outcome

Home/Pet Room now reads the committed equipped set from SQLite on every focus episode and renders the
approved bundled room/art at fixed layered anchors. Empty and multi-equipped states are supported.
The query is read-only and decoration failures remain local: Pet, profile and Start Focus stay usable.

## Delivered

- Immutable application projection validates the exact 12-item catalog and ownership rows, filters
  equipped records and preserves catalog order without write capabilities.
- Feature-owned controller coalesces loads, drops stale completion, preserves the last committed room
  on refresh failure and never enters global recovery.
- Home focus lifecycle activates/deactivates the controller independently of Shop and Pet refresh.
- Pet scenes have explicit modes: `room` fits the full 1672:941 backdrop and scales Cat for the room;
  default `focus` ignores room layers and renders only Cat + semantic status.
- After owner screenshot review, the backdrop uses an explicit 100%×100% image inside the matching
  1672:941 canvas so native image sizing cannot select only the upper wall region. This is UI-only;
  clearing SQLite/equipment state is not required.
- All 12 decorations now use two explicit coordinate systems: measured primary-subject source bounds
  inside each 362×362 atlas cell, and normalized target visible bounds measured from the approved room
  composition. The renderer crops isolated atlas noise and compensates each sprite's different transparent
  padding before placing it. Both axes use room width as the shared scale, matching how the approved
  composition was uniformly expanded into the taller empty-room backdrop.
  Portrait size changes therefore preserve the intended visible position and scale instead of aligning
  padded atlas cells or relying on one guessed size for unrelated objects.
- Owner reference comparison corrected the two desk anchors: mug is the leftmost item and the plant
  sits to its right, matching the approved composition rather than the previously reversed order.
- The book stack is now on the desk after the plant. Dev-only `room_full_equipped` renders all 12
  catalog items through a read projection for one-pass visual review and never writes SQLite state.
- Approved backdrop plus transparent 4×3 atlas are bound to typed dimensions, hashes, crop cells,
  deterministic back/front anchors and offline static imports.
- Decoration pixels are non-interactive and hidden from accessibility; one concise textual room
  summary owns the semantics without visible normal-state copy. Loading is visually quiet;
  read/data-invalid/stale-refresh states remain isolated and actionable below the scene.
- Owner screenshot review moved the mug and plant onto the desk surface and removed the visible
  item-list and idle-status copy to match the simple classic virtual-pet-machine theme.
- Device guide and static route/boundary/asset-integrity coverage were added.
- The post-smoke full-room calibration replaces per-item guessed anchors with the source-bound/target-bound
  transform and adds invariant tests for atlas containment, target placement and uniform device scaling.
- Desk-item depth is explicit: the farther plant renders behind the nearer mug even though catalog order
  remains unchanged.

## Automated evidence

- `pnpm quality`: PASS — 176 test files, 909 tests.
- Typecheck/lint: PASS.
- Boundary validator: PASS — 12 forbidden imports rejected, 4 valid imports accepted.
- Device guide validator and repository hygiene: PASS.
- Android export: PASS — 1,925 modules; approved atlas/backdrop bundled.
- iOS export: PASS — 1,830 modules; approved atlas/backdrop bundled.
- `git diff --check`: PASS.

## Truthfulness and remaining gate

No migration, dependency, native/prebuild, permission, economy/session command or analytics taxonomy
changed. The candidate is uncommitted, so `exact_implementation_sha` remains null. Owner quick UI and
formal device/accessibility evidence remain `NOT_RUN`; use `apps/mobile/test/device/equipped-room-smoke.md`.
