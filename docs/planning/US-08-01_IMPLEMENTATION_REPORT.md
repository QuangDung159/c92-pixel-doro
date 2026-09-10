---
document_id: PIXELDORO_US_08_01_IMPLEMENTATION_REPORT
title: PixelDoro Mobile MVP — US-08-01 Implementation Report
version: 0.2.0
status: DONE_OWNER_ACCEPTED
date: 2026-09-10
owner: Dũng Lư
branch: feats/epic-08
implementation_start_sha: 41e46df9cc122a56b60cfc08ee72dee3a351a2c7
exact_implementation_sha: 9be0a0f399a78014bb1a67239b0c478b30a7cdcd
candidate_identity: EXACT_COMMITTED_OWNER_ACCEPTED_SHA
owner_smoke_status: PASS_OWNER_QUICK_UI
formal_tester_status: NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED
schema_change: NONE
dependency_change: NONE
native_change: NONE
---

# US-08-01 implementation report

## Delivered

- Replaced the Shop prototype route with a production read-only controller and finite
  loading/ready/refresh/error states. First load is explicit; refocus keeps the last committed view
  while refreshing and transient failure retains it with inline Retry.
- Added one Application projection that verifies economy consistency, validates the exact immutable
  12-row migration catalog, validates ownership, derives Level progress and returns frozen view data.
- Reused the application-scoped session coordinator so Shop reads cannot interleave with local
  economy commands. Durable catalog/profile/ownership corruption enters Recovery; technical reads
  stay locally retryable and never receive fake fallback data.
- Added a shared Level/XP/Coin summary for Home and Shop plus responsive text-first item grid/tile.
  Item state is explicit as available, owned or equipped; the neutral marker is decorative only.
- Added best-effort local `shop_viewed` analytics once per Shop focus episode. Retry does not enqueue a
  second event and analytics failure cannot affect projection state.
- Added finite dev-only isolated fixtures for fresh, reachable `45→50 XP`, mixed ownership, one-shot
  read failure and corrupt catalog. Fixture progression uses production Start/Reconcile reward paths;
  normal `pixeldoro.db` remains untouched.
- Added the owner/device guide at `apps/mobile/test/device/progression-catalog-smoke.md`; manual and
  formal results remain honestly `NOT_RUN` until executed.

## Automated evidence

- `pnpm quality`: PASS — typecheck, lint, 163 test files / 856 tests, device guide validator,
  architecture boundaries and repository hygiene.
- Focused US-08-01 suite before final rapid-Retry addition: PASS — 13 files / 49 tests.
- Real SQLite coverage: fresh exact catalog/no-write, production-earned progression, purchased owned/
  equipped states, close/reopen parity and corrupt-catalog fail-closed behavior.
- Controller/application coverage: exact Level boundaries including unit-only `49 XP`, initial load,
  stale-while-refresh, transient Retry, corruption Recovery, stale completion discard, rapid Retry
  coalescing and focus-episode analytics semantics.
- iOS JS export: PASS — 1,814 modules.
- Android JS export: PASS — 1,909 modules.
- Expo Doctor: 20/21. The remaining check reports SDK 57 patch-version drift for `expo`,
  `expo-build-properties`, `expo-dev-client`, `expo-linking`, `expo-router` and `expo-updates`.
  Dependency upgrades were not authorized and are outside this no-dependency Story.
- Schema/migration/package/dependency/native/asset diff: none.

## Product and safety verdict

- Shop is read-only for reward/profile/purchase/ownership facts; the only write is the approved
  best-effort analytics event.
- Purchase, confirmation, insufficient-balance, equip/unequip and room decoration behavior remain
  deferred to US-08-02→04.
- The production migration source and checksum are unchanged. Composition injects the migration-owned
  catalog contract without creating a second catalog authority.
- The implementation was committed at exact SHA `9be0a0f399a78014bb1a67239b0c478b30a7cdcd`.

## Owner acceptance and residual evidence

Owner reported quick UI `PASS` on 2026-09-10 for the exact committed candidate: no crash and behavior
worked as expected. US-08-01 is `DONE_OWNER_ACCEPTED`; US-08-02 planning is open. Structured fixture,
iOS/Android, accessibility and offline matrices remain `NOT_RUN`, and formal breadth remains deferred
to EPIC-12 unless actually executed.
