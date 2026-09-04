# US-06-03 Strict Running/Grace Development Build review

Use pinned Node `22.23.2`, pnpm `11.24.0` and an existing compatible Development Build. Record
`<implementation-sha>`, device/simulator, OS and app version. Formal tester remains
`DEFERRED_TO_LATER_PHASE` until independently executed.

## 1. Production Strict path

```sh
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
git rev-parse HEAD
pnpm start --clear
```

1. Complete onboarding and use the confirmed Development Build reset when a clean journey is needed.
2. Start `15 / strict / study` through production Setup.
3. Confirm timestamp countdown, `Strict · grace 10 giây`, Study tag and Pet Working.
4. Background briefly under 10 seconds, return before deadline and confirm Running continues.
5. Cancel before grace and confirm exact cancelled Result remains zero reward and Home-only.

## 2. Proven failure and no replay

Use the accelerated fixture; persisted duration remains a valid 15 minutes.

```sh
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_strict_fast_grace pnpm start --clear
```

1. Start Strict, background long enough for accelerated clock to cross the 10-second grace, then
   foreground.
2. Confirm navigation waits for durable `failed`, Result uses the exact session ID and shows
   `0 XP / 0 Coin`, no Break and Home-only.
3. Confirm Pet Bugged occurs at most once after the fresh failed commit.
4. Reopen/relaunch the same failed Result and confirm Bugged does not replay.

## 3. Persistence recovery fixtures

```sh
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_strict_background_write_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_strict_clear_write_failure_once pnpm start --clear
```

- Background-write failure must enter Recovery; it must not silently continue Strict.
- Safe-clear failure must enter Recovery; Retry reboots and reconciles durable evidence.
- After each one-shot failure, reset/restart the fixture before testing another scenario.

## 4. Boundary evidence

- Automated/SQLite evidence owns exact `violationAt == endsAt` and `endsAt < violationAt` cases.
- Kill with persisted evidence must use the same startup precedence and exact Result handoff.
- Kill without persisted evidence must never invent failure; deadline remains pending until US-06-04.
- Rapid background/foreground callbacks must preserve the first active episode and reject stale writes.

## 5. Accessibility and cleanup

- Screen reader must explain Strict/grace/failed without announcing countdown every second.
- Largest text keeps countdown, recovery, confirmation and Home reachable.
- Reduce Motion retains textual failed meaning and a static Pet fallback.
- Failure meaning must not depend on color or animation.

```sh
unset EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE
pnpm start --clear
```

Capture exact SHA/device/OS, screenshots/video and sanitized before/after durable facts. Record each
case as `PASS`, `FAIL`, `BLOCKED` or `NOT_RUN`; keep automated, owner quick smoke and formal tester
evidence separate.
