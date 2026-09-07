# US-06-02 Relax Running/Cancel Development Build review

Use pinned Node `22.23.2`, pnpm `11.24.0` and an existing compatible Development Build. Record
`<implementation-sha>`, device/simulator, OS and app version. Formal tester remains
`DEFERRED_TO_LATER_PHASE` until independently executed.

## 1. Timestamp Running and visibility

```sh
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
git rev-parse HEAD
pnpm start --clear
```

1. Confirm onboarding is complete, use `Reset dữ liệu test` if a safe clean journey is required.
2. Start `15 / relax / coding` through production Setup.
3. Confirm the screen shows Relax, Coding, Pet Working and a decreasing `MM:SS` countdown.
4. Lock/background for at least 10 seconds, then foreground. Remaining time must jump from timestamp
   truth rather than replaying missed ticks; Relax must not become failed.
5. Force-close/relaunch before deadline. Confirm the same session ID opens and no second row exists.

## 2. Durable Cancel and exact Result

1. Tap Back or `Dừng phiên`, then dismiss. Confirm no durable field changes.
2. Open again and confirm. Navigation must wait for commit.
3. Verify exact row: `status=cancelled`, non-null `resolved_at`, reward fields `0/0/null`.
4. Confirm Result says the session stopped, Pet is Idle, only Home is active, and there is no
   reward, celebration, Claim or Break CTA.
5. Relaunch/open the exact Result identity and confirm no unrelated latest session is substituted.

## 3. Finite Development Build fixtures

Restart Metro between scenarios. Persisted duration stays product-valid; only injected review clock
or one-shot repository failure changes.

```sh
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_running_fast_clock pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_deadline_pending pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_cancel_write_failure_once pnpm start --clear
```

- `standard_running_fast_clock`: a valid 15-minute session advances display clock at 30x.
- `standard_deadline_pending`: a valid 15-minute session reaches `00:00` quickly, disables Cancel
  and does not invent completed/reward truth.
- `standard_cancel_write_failure_once`: first Cancel stays Running with finite error; Retry commits
  exactly once and opens exact cancelled Result.

## 4. Accessibility and failure recovery

- Screen reader announces the timer label/status but not every second.
- Large text keeps countdown, error and Cancel confirmation reachable in the scroll container.
- Reduce Motion leaves all status text and actions understandable.
- Read/cancel failure must not fall through to prototype or false Result.
- Cancelled and deadline-pending meanings must not depend only on color.

## 5. Cleanup and evidence

```sh
unset EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE
pnpm start --clear
```

Capture exact SHA/device/OS, before/after durable facts, foreground/relaunch video, confirmation
dismiss/commit, failure/Retry, Result, offline, screen reader, large text and Reduce Motion. Record
each case as `PASS`, `FAIL`, `BLOCKED` or `NOT_RUN`; keep automated, owner quick smoke and formal
tester evidence separate.
