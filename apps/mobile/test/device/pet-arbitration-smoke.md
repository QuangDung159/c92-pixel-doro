# US-04-04 Pet arbitration and no-replay Development Build review

Use an existing compatible Development Build. The fixture is development-only, keeps committed base
facts in memory, sends terminal DTOs through the production freshness contract, and never writes
session/reward/receipt data to `pixeldoro.db`.

## 1. Use the pinned Node version and open the Result review shell

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE=preempt_break pnpm start --clear
```

`node -v` must print `v22.23.2`. Open/reload the Development Build, tap `Thử phiên 5 phút`, tap
`Complete`, then press `Emit Pet review fixture` once. Result mount itself must remain quiet until this
explicit control is pressed.

Expected for `preempt_break`:

- Celebrate appears immediately.
- After about 700 ms, committed Short Break replaces it directly with Breaking.
- There is no Idle/loading flash and Celebrate never resumes.
- Result CTA remains tappable throughout.

## 2. Review priority, stale input, and conflict safety

Stop Metro between scenarios, restart with one value, reload the app, return to Result, then press the
explicit fixture control once.

```sh
EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE=preempt_focus pnpm start --clear
EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE=stale_after_active pnpm start --clear
EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE=conflicting_terminal pnpm start --clear
```

Expected results:

- `preempt_focus`: Bugged appears, then committed Focus replaces it directly with Working after about
  700 ms; Bugged never resumes.
- `stale_after_active`: Working appears and the older terminal event causes no Celebrate/Bugged flash
  or accessibility announcement.
- `conflicting_terminal`: Celebrate appears, then the same session's conflicting failed status opens
  friendly Pet recovery after about 400 ms. It must not choose Bugged-over-Celebrate by enum priority.
  The session/reward mock UI remains intact; dismissing visual recovery does not mutate it.

## 3. Review reopen, relaunch, and background discard

### Reopen and relaunch

```sh
EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE=reopen_relaunch pnpm start --clear
```

1. Reach Result and press `Emit Pet review fixture`; confirm Celebrate.
2. Navigate away before 2 seconds, then reach Result again in the same app runtime. Do not press the
   control yet: no one-shot may appear merely from remount.
3. Press the control again: the already-seen key is dropped and no second announcement appears.
4. Force-quit the app process and relaunch with the same Metro bundle. Do not press the control: only
   the committed base Idle state appears; no terminal row is hydrated/replayed.

### Background and resume

```sh
EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE=background_discard pnpm start --clear
```

Reach Result, press the fixture control, then background the app while Celebrate is visible. Wait more
than 2 seconds and foreground it. Expected: base Idle only; Celebrate does not resume/replay. Pressing
the same control again in that runtime is deduped.

With VoiceOver/TalkBack, accepted terminal feedback is announced once. Preempted, stale, reopened,
resumed, or duplicate input produces no duplicate announcement. Static poses are intentional here;
visibility-driven animation playback belongs to US-04-05.

## 4. Restore production path and record evidence

Record Git SHA, platform/OS/device, short videos for both preemptions, the stale/conflict table,
reopen/relaunch/background observations, and screen-reader note.

```sh
unset EXPO_PUBLIC_EPIC_04_ARBITRATION_FIXTURE
unset EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE
unset EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE
pnpm start --clear
```

Reopen the app. With no explicit fixture or future production post-commit caller, Result
mount/reopen/relaunch/resume must never emit terminal feedback.
