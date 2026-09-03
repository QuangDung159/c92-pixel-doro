# US-05-03 exactly-once completion Development Build review — deferred

Formal tester execution is deferred to a later phase. Do not mark this guide passed without exact
SHA, platform, device/simulator, OS, app version, captures and durable before/after facts.

## 1. Startup overdue completion

Start with a clean first-use database:

```sh
nvm use
git rev-parse HEAD
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_overdue_running pnpm start --clear
```

1. Cold launch. The dev-only preparation creates a real five-minute running row after migration,
   advances only the injected clock, then calls production startup reconciliation.
2. Readiness must stay closed until session, receipt and profile commit atomically and final
   bootstrap hydration finishes.
3. Result shows committed `+5 XP`, `+1 Coin`, totals `5/1`, no Claim and a disabled Continue.
4. Cat remains base; celebration and Pet Room handoff belong to US-05-04.
5. Reopen Result and relaunch. The same receipt/result is loaded and totals remain unchanged.

## 2. Completion race

```sh
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_complete_race pnpm start --clear
```

Start the trial and wait for accelerated deadline/foreground requests. Verify one completed session,
one `onboarding_trial_completed` receipt and one profile increment of exactly `5 XP / 1 Coin`.
There must be only one fresh completion; reopen/relaunch must not emit another.

## 3. Transaction failure and retry

```sh
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_reward_write_failure pnpm start --clear
```

The first reward insert fails once. Verify recovery remains truthful: session stays running, receipt
is absent and profile remains `0/0`. Retry from the recovery UI; verify one atomic completed row,
one receipt and totals `5/1`. A second retry/relaunch must not change them.

## 4. Offline and accessibility

- Disable network before completion; local SQLite completion still succeeds.
- VoiceOver/TalkBack announces one grouped reward summary and understandable heading order.
- Large text wraps without hiding reward or retry.
- Reduce Motion does not remove committed status/reward meaning.

## 5. Cleanup

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

Required durable evidence: session status/resolved/reward fields; receipt ID/session/reason/deltas/time;
profile totals before/after; row/receipt counts after race, retry, reopen and relaunch. Current status:
`DEFERRED_TO_LATER_PHASE`.
