# EPIC-05 exit UI and device smoke

Status: `DEFERRED_TO_LATER_PHASE`. This guide prepares formal tester execution; automated evidence
must not be recorded as a device pass. Run it only after the implementation is frozen and replace
`<implementation-sha>` with the exact behavior commit.

## 1. Freeze the evidence identity

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
pnpm -v
git rev-parse HEAD
```

Record exact SHA, platform, device/simulator/emulator, OS, Development Build/app version and whether
the run is online or offline. Expected Node is `v22.23.2`; evidence SHA must equal
`<implementation-sha>`.

## 2. Fresh full journey

```sh
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=epic_05_fresh_end_to_end pnpm start --clear
```

Start from Intro and tap `Thử phiên 5 phút`. The injected clock accelerates only time; the CTA must
still use the production Start command. Verify:

1. Intro → Running → Result → Home completes without prototype badges or review buttons.
2. Running remains a fixed Relax five-minute onboarding trial; no mode/tag/Strict selector appears.
3. Result shows exactly `5 XP` and `1 Coin`, and Mèo Dev feedback remains understandable with motion
   disabled.
4. `Vào Pet Room` reaches Home with totals `5 XP` / `1 Coin`.
5. Repeated taps and a process relaunch do not add reward, replay celebration or reopen onboarding.
6. Run once offline from before Start through Home; navigation and durable outcome remain identical.

Capture Intro, Running, Result and Home. Repeat with Reduce Motion, screen reader and largest text;
record reading order, status announcements, button labels, wrapping/clipping, contrast and touch
targets. A visual-only animation difference is allowed; reward/outcome/copy must be identical.

## 3. Exclusion seed

```sh
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=epic_05_exclusion_seed pnpm start --clear
```

This finite fixture creates and completes the trial with production Start/Complete commands before
startup finishes. Verify Result reads committed `5 XP` / `1 Coin`; Continue reaches Home once; a
relaunch goes directly Home. Record that Standard History/contribution/Long Break/store-review UI,
when implemented in their owning epics, must not count this trial. The authoritative current proof
is the real SQLite automated exit journey, not a visual inference.

## 4. Recovery regression

Repeat the owning finite cases if any result above is uncertain:

```sh
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_start_failure pnpm start --clear
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_reward_write_failure pnpm start --clear
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_continue_failure pnpm start --clear
```

Each injected failure must preserve truthful state, provide a usable retry, and never show a partial
reward or route success. Analytics failure has no provider/network fixture: it is proven by the
automated best-effort composition test and must never block the UI.

## 5. Cleanup

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

Default startup must contain no fixture state or control. Send the exact evidence identity, captures,
pass/fail per step and any raw durable facts available to the owner. Until supplied, formal tester
status remains `DEFERRED_TO_LATER_PHASE`.
