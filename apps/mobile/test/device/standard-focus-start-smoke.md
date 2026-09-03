# US-06-01 Standard Focus Setup/Start Development Build review

Use an existing compatible Development Build. Record `<implementation-sha>`, platform,
device/simulator, OS and app version. Complete onboarding first and start with no active session.
Formal tester execution remains `DEFERRED_TO_LATER_PHASE` until it is actually run.

## 1. Default Setup and valid controls

```sh
nvm use
git rev-parse HEAD
pnpm start --clear
```

1. From Pet Room, tap the Focus CTA and confirm production Setup opens without a Prototype badge.
2. Confirm defaults are exactly `25`, `relax`, `coding`.
3. Confirm decrement/increment move by five and stop at `15`/`120`.
4. Confirm quick values `15`, `25`, `50`; select every mode and work tag.
5. Navigate Back, reopen Setup and confirm the fresh defaults return without a durable write.
6. Review screen reader order, large text, touch targets and Reduce Motion behavior.

## 2. Durable Start and committed handoff

1. Choose `50 / strict / study`, rapidly tap Start twice and record the before/after session facts.
2. Confirm only one running row exists with `focus/standard/running`, configured duration `50`,
   Strict mode, Study tag, zero reward fields and `endsAt-startedAt=3000000`.
3. Confirm navigation occurs only after the write and the Session screen shows committed config.
4. Confirm the Pet projection is Working and no mock countdown, Cancel, reward or Result control is
   present.
5. Force-close and cold relaunch. Confirm the same session opens without a second Start.
6. Repeat offline; local durable Start and relaunch must remain available.

Development Build only: the committed handoff exposes `Reset dữ liệu test`. Open it, confirm the
destructive warning and verify the existing confirmed-reset flow clears local sessions/progress then
returns to onboarding. This control must be absent from a production build and is not a session
Cancel implementation.

## 3. Finite development fixtures

Restart Metro between scenarios:

```sh
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_start_success pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_start_active_conflict pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_start_write_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_start_committed_relaunch pnpm start --clear
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_start_read_failure pnpm start --clear
```

- `standard_start_success`: production Start reaches the committed handoff.
- `standard_start_active_conflict`: remain on Setup with active-session copy and no inserted row.
- `standard_start_write_failure_once`: first attempt preserves draft; Retry commits exactly once.
- `standard_start_committed_relaunch`: boot prepares a durable Standard Focus through production
  Start and routes to Session.
- `standard_start_read_failure`: never fall through to prototype while durable read is unavailable.

Fixtures are review aids. SQLite integration and captured durable row facts are authoritative.
Notification, analytics and haptic side effects must remain absent for this Story.

## 4. Cleanup and evidence record

```sh
unset EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE
pnpm start --clear
```

Capture exact SHA/device/OS, Setup and committed-handoff screenshots, double-tap video, durable row
facts before/after, failure/Retry, cold relaunch, offline and accessibility results. Record each
scenario as `PASS`, `FAIL`, `BLOCKED` or `NOT_RUN`; never upgrade fixture UI to durable evidence.
