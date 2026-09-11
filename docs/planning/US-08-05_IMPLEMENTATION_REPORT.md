---
document_id: PIXELDORO_US_08_05_IMPLEMENTATION_REPORT
title: PixelDoro Mobile MVP — US-08-05 Implementation Report
version: 0.1.0
status: VALIDATED_IMPLEMENTATION_CANDIDATE_AWAITING_OWNER_SMOKE
date: 2026-09-11
owner: Dũng Lư
branch: feats/epic-08
implementation_start_sha: e46c5e6c66dba2c0415693e622e2d9f3b308f7af
exact_implementation_sha: null
manual_device_status: NOT_RUN
formal_tester_status: NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED
schema_change: NONE
dependency_change: NONE
native_change: NONE
---

# US-08-05 — Offline Loop Integrity và EPIC-08 Exit Candidate

## Outcome

US-08-05 now has an evidence-first exit candidate for the complete offline loop: Focus reward → Shop
purchase → inventory equip → Pet Room → cold reopen. The implementation reuses production use cases,
repositories, transactions and the one application-scoped command coordinator; it adds no new Product UI,
economy rule, schema, dependency, native configuration or analytics provider.

## Delivered

- Dev-only `EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE` with four finite scenarios and a dedicated
  `pixeldoro-us-08-05-<scenario>.db`; release/unknown values are ignored and normal `pixeldoro.db` is not
  selected or reset.
- Idempotent relaunch/accessibility preparation uses production Focus, purchase and equip commands; valid
  product facts are never directly inserted by the fixture.
- Provider-failure scenario decorates only analytics enqueue. Product writes, projections and local durable
  truth remain untouched.
- Real-SQLite aggregate coverage proves reward/purchase/equip/room facts, idempotent repeat, coordinator race,
  exact three analytics events and cold-relaunch persistence.
- Static integrity coverage keeps Home/Shop on production owners, preserves History/Settings prototype scope,
  and guards against migration/provider drift.
- The aggregate test found a narrow production gap: `item_unlocked` emitted approved property
  `pricePaidCoins`, but SQLite metadata validation rejected that property. The allowlist now accepts positive
  safe integers and has mapper plus real-queue regression coverage.
- The previously accepted Pet Room runtime calibration was `scale: 0.45`, `top: 25%`; its stale test still
  expected `0.4/20%`. Only the test expectation was aligned to the owner-smoked runtime; runtime pixels did
  not change in US-08-05.

## Automated evidence

- `pnpm quality`: PASS — 179 test files, 918 tests.
- Typecheck and lint: PASS.
- Device guide validator: PASS.
- Boundary validator: PASS — 12 forbidden imports rejected, 4 valid imports accepted.
- Repository hygiene: PASS — one lockfile, no signing material, no Skia dependency, one immutable migration.
- Focused US-08-05 suite: PASS — 5 files, 24 tests.
- Android export: PASS — 1,927 modules; room assets bundled.
- iOS export: PASS — 1,832 modules; room assets bundled.
- `git diff --check`: PASS before documentation finalization.

## Remaining gate

Owner quick UI smoke is `NOT_RUN`; formal device/accessibility breadth remains
`NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED`. Exact implementation SHA stays `null` because commit/push was
not authorized. Owner smoke acceptance, Epic exit closure and EPIC-09 authorization remain separate gates.

## Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-09-11 | Codex | Recorded validated implementation candidate, automated evidence, narrow analytics validator fix and pending owner smoke gate. |
