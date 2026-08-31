---
document_id: PIXELDORO_US_05_02_IMPLEMENTATION_REPORT
title: PixelDoro US-05-02 — Start, Run, Resume, or Cancel Trial Implementation Report
version: 0.1.0
status: IMPLEMENTED_AWAITING_OWNER_MANUAL
story: US-05-02
date: 2026-08-31
owner: Dũng Lư
baseline_commit: f2efd62168886b429c1d8bf360dd99cf35fced97
implementation_start_commit: 9a519748fd62bd08624275e59ff18c4729265314
implementation_sha: PENDING_OWNER_COMMIT
language: vi
---

# US-05-02 Implementation Report

## 1. Outcome

US-05-02 đã được triển khai trên host working tree theo toàn bộ owner-approved
`US0502-CONFIRM-01`…`07`:

- Intro CTA commit đúng một real `onboarding_trial` trước khi replace tới Running.
- Double-tap/concurrent Start serialize; running trial hiện có trở thành idempotent resume.
- Countdown derive từ durable `endsAt` và injected clock, không decrement-state làm truth.
- Background dừng display tick; foreground/cold relaunch đọc lại cùng durable session.
- Cancel confirmation conditionally commit `cancelled`, không reward/profile mutation, rồi mới Intro.
- Deadline trong phạm vi Story này vào truthful `deadline_pending`, khóa Cancel và không fake
  completed/reward/Result.
- Standard Focus prototype vẫn hoạt động qua route fallback tách biệt; durable trial branch không có
  prototype/mock/Strict/Complete controls.

Story chưa `DONE`: final Git SHA và owner Development Build/manual acceptance còn pending.

## 2. Implemented architecture

### Shared Application

- `LocalCalendarPort` snapshot local date/UTC offset tại deadline.
- Exact five-minute Relax trial record factory với calendar/timestamp validation.
- FIFO `SessionCommandCoordinator` dùng chung Start/Cancel.
- `StartOnboardingTrialUseCase`: active read + exact insert trong transaction; started/already-running
  result; conflict và persistence/transaction error mapping.
- `CancelOnboardingTrialUseCase`: re-read, deadline guard, conditional cancelled transition, terminal
  winner classification và all-zero reward fields.
- Pure remaining projection: `max(0, endsAt-now)`, ceil display seconds, deadline-pending boundary.

### Mobile Application/Infrastructure

- `OnboardingTrialRunningController` external store với generation guard, durable refresh,
  visibility-aware scheduler và wall-clock re-projection.
- `DeviceLocalCalendarAdapter`; existing timeout scheduler được reuse structurally.
- Composition facade gates commands behind readiness, refreshes first-use/running/Pet projections
  only after committed success, and forwards lifecycle visibility.
- Dev-only finite review fixture intercepts only selected Start/Cancel writes or accelerates injected
  clock. Production default remains real SQLite/clock.

### Presentation/Navigation

- Intro CTA có busy/error/single-flight state; navigation chỉ sau command success.
- Production `OnboardingTrialRunningScreen` + feature-local `TrialCountdown`.
- Hardware back/Dừng phiên mở common confirmation dialog; busy state prevents repeated confirm.
- `/focus/session` reads durable trial projection first, renders safe loading/error/pending, and only
  falls back to existing Standard Focus prototype when no durable onboarding trial exists.
- Cancel success replaces Intro; failure remains truthful on Running.

## 3. Durable and concurrency evidence

Host `node:sqlite` integration executes the production migration/repositories/transaction:

1. Two concurrent Starts produce one `started`, one `already_running` and one database row.
2. Exact persisted invariant includes duration `5`, Relax/null tag and `endsAt-startedAt=300000`.
3. Close/reopen preserves the same running session.
4. Cancel commits `cancelled`; second close/reopen preserves terminal state.
5. Reward lookup remains null; profile remains `0 XP / 0 Coin` throughout.

SQLite schema/partial unique index remains unchanged and acts as defense in depth behind the FIFO
coordinator.

## 4. Automated evidence

### Targeted gates

- Shared Application typecheck pass.
- Shared Application: `12` files / `50` tests pass after final calendar validation addition.
- Mobile Application/Infrastructure/Integration: `32` files / `195` tests pass.
- Real SQLite onboarding trial start/reopen/cancel/reopen integration pass.

### Root gate

Initial full gate after feature/test wiring:

- `pnpm run quality`: pass.
- Vitest: `71` files / `339` tests pass.
- ESLint: pass with no warnings.
- Device harness: pass, including new US-05-02 review checklist.
- Boundaries: `11` forbidden imports rejected; `3` valid imports accepted.
- Repository hygiene: pass; one immutable migration; no dependency/signing/Skia drift.
- `git diff --check`: pass.

This is the final host recount after report/date-validation changes.

## 5. Test coverage added

- Record invariant and invalid ID/timestamp/calendar/offset cases.
- Remaining time at five minutes, sub-second boundary, exact deadline and overdue.
- FIFO order, recovery after thrown command, double-start serialization and active conflict.
- Cancel reward-zero transition, deadline rejection and already-cancelled idempotency.
- Running controller visible tick, background pause, foreground deadline, missing/read failure.
- Device local calendar adapter and finite fixture gating/failure/clock acceleration.
- Production countdown/running UI pending/forbidden-control assertions.
- Host SQLite double-start, exact persisted facts, reopen, Cancel, second reopen and economy unchanged.
- Intro busy/recovery presentation and extended device harness contract.

## 6. Scope audit

- No schema, migration, index, package dependency, Expo/native configuration or generated artifact.
- No session completion, reward receipt insertion, profile progression or onboarding completion write.
- No Result productionization, Pet terminal celebration or analytics event/provider.
- No notification/audio/haptic/background task.
- No Standard Focus/Break productionization, Strict/grace, work-tag/mode selector or pause/resume.
- No naming/species selection; `OPEN-009` remains open.
- All new/changed production UI files remain below 300 lines; largest new controller is below 180.

## 7. Manual Development Build gate — pending

Use the full guide at:

`apps/mobile/test/device/onboarding-trial-smoke.md`

Minimum normal run:

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
pnpm start --clear
```

Required owner evidence:

- [ ] Final implementation SHA, platform, device/simulator, OS and Development Build/app version.
- [ ] Rapid double-tap creates one Running trial near `05:00`.
- [ ] Background and cold relaunch resume same session/deadline.
- [ ] Cancel dismiss keeps running; Confirm commits cancelled before Intro.
- [ ] Durable row exact; reward absent; XP/Coin unchanged; Pet working→idle without celebration.
- [ ] Start/cancel failure fixtures remain truthful and retryable.
- [ ] Fast-clock keeps persisted five-minute duration; deadline pending has no completion/reward.
- [ ] Offline, screen reader, large text and Reduce Motion cases pass.
- [ ] Video/screenshots plus before/after durable facts and pass/fail per group.

Cleanup:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

No device/platform/manual box is marked pass by this report.

## 8. Transferred limitations

- At/after deadline, session remains durable `running` while UI shows completion-pending.
- Automatic completion, reward transaction, Result navigation and startup/foreground reconciliation
  belong exclusively to US-05-03.
- Result celebration/Home handoff and analytics remain US-05-04/05.
- US-05-03 must not open until owner closes US-05-02 on an exact implementation SHA.

## 9. Change log

| Version | Date | Author | Change |
| --- | --- | --- | --- |
| 0.1.0 | 2026-08-31 | Codex | Recorded approved host implementation, architecture, automated/SQLite evidence, scope audit, manual gate and transferred US-05-03 boundary. |
