---
document_id: PIXELDORO_US_08_02_IMPLEMENTATION_REPORT
title: PixelDoro Mobile MVP — US-08-02 Implementation Report
version: 0.2.0
status: DONE_OWNER_ACCEPTED
date: 2026-09-11
owner: Dũng Lư
branch: feats/epic-08
implementation_start_sha: 9be0a0f399a78014bb1a67239b0c478b30a7cdcd
exact_implementation_sha: 5c6791dbec982d7f522e4113180458daf2e9ce95
candidate_identity: EXACT_COMMITTED_OWNER_ACCEPTED_SHA
owner_smoke_status: PASS_OWNER_QUICK_UI
formal_tester_status: NOT_RUN_DEFERRED_TO_EPIC_12_UNLESS_EXECUTED
schema_change: NONE
dependency_change: NONE
native_change: NONE
---

# US-08-02 implementation report

## Delivered

- Added `PurchaseItemUseCase` whose public input is only `itemId`. It re-reads and validates the
  migration-owned catalog price inside one transaction, then performs guarded Coin debit, immutable
  receipt insert, unequipped ownership insert and exact postcondition reads.
- Reused the application-scoped `SessionCommandCoordinator` for reward, purchase and Shop reads.
  Existing coherent receipt/ownership returns no-op `already_owned`; insufficient balance performs
  zero writes; one-sided or mismatched durable facts fail closed.
- Added ambiguous transaction readback. Only the generated coherent receipt/ownership/economy proves
  `recovery_commit`; all-absent facts remain retryable, and partial/mismatched facts enter Recovery.
- Extended Shop with confirm/submitting/success/insufficient/already-owned/error and
  `committed_refresh_pending` states. A known commit refresh failure can retry only the projection
  read and never reruns purchase; rapid confirm calls are coalesced.
- Added disabled exact-shortfall CTAs, authoritative purchase copy and busy/result announcements.
  Purchased items are owned but not equipped; equip remains US-08-03.
- Added deterministic best-effort `item_unlocked:<receiptId>` for fresh and current-attempt recovered
  commits, never for pre-owned or failed commands.
- Added four isolated quick-review fixtures and
  `apps/mobile/test/device/shop-purchase-smoke.md`. Manual results remain `NOT_RUN` until owner runs it.

## Automated evidence

- `pnpm run typecheck`: PASS.
- `pnpm run lint`: PASS.
- `pnpm test`: PASS — 166 test files / 874 tests, plus device guide validator.
- `pnpm run test:boundaries`: PASS — 12 forbidden imports rejected; 4 valid imports accepted.
- `pnpm run check:repository`: PASS — one lockfile, no signing material, no Skia dependency and one
  immutable migration.
- iOS JS export: PASS — 1,817 modules. Android JS export: PASS — 1,912 modules.
- Real SQLite verifies exact-balance purchase, receipt/ownership linkage, unequipped state,
  close/reopen economy truth and idempotent already-owned replay.
- Unit/controller coverage verifies insufficient zero-write, corrupt one-sided facts, ambiguous
  readback, concurrent same-item serialization, rapid confirm coalescing, deterministic analytics and
  refresh-only retry after known commit.

## Scope and residual evidence

- Production migration/checksum, packages, dependencies, native config and permissions are unchanged.
- Owner quick UI smoke is `PASS` on 2026-09-11 at exact SHA `5c6791d...`: no crash and behavior worked
  as expected. Structured VoiceOver/TalkBack, large text, offline and physical-device breadth remain
  `NOT_RUN`; the quick smoke does not replace those evidence rows.
- Advanced failure/race cases are automated rather than exposed as UI fixtures, preventing the review
  harness from manufacturing partial durable truth.
- Candidate was committed and pushed at exact SHA `5c6791dbec982d7f522e4113180458daf2e9ce95`,
  then accepted by the owner quick UI smoke. US-08-03 planning is now open.

## Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.2.0 | 2026-09-11 | Codex | Bound owner quick UI PASS to exact committed/pushed SHA `5c6791d...`: no crash and expected behavior. US-08-02 is `DONE_OWNER_ACCEPTED`; structured/formal evidence remains `NOT_RUN`. |
| 0.1.0 | 2026-09-11 | Codex | Recorded the validated US-08-02 worktree candidate and automated evidence before owner smoke. |
