# US-05-04 Pet celebration and Home handoff smoke

Formal tester execution is deferred. Run this matrix later against the exact implementation SHA;
do not mark it passed from automated evidence alone.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_completed_fresh pnpm start --clear
```

Verify that the committed Result shows `5 XP` and `1 Coin`, Mèo Dev celebrates once, and `Vào Pet
Room` remains usable immediately. Tap during the celebration: Home must show the committed totals.
Kill and relaunch: the app must go directly Home with base Pet and no replay.

```sh
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_completed_reopen pnpm start --clear
```

Verify Result hydrates committed `5/1` with base Pet and never emits a celebration.

```sh
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_continue_failure pnpm start --clear
```

Verify the first `Vào Pet Room` attempt stays on Result with a safe retry message. Retry must open
Home once, preserve the original reward/session/profile facts, and persist one stable
`onboarding_completed_at` timestamp.

Repeat the fresh case offline, with Reduce Motion, screen reader, and large text. Capture exact SHA,
platform, device/simulator, OS, app version, Result/Home screenshots, and durable before/after facts.

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```
