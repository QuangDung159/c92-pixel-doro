# EPIC-07 / US-07-05 device smoke

Status: `NOT_RUN`  
Implementation SHA: `<implementation-sha>`

## Preconditions

- Node `22.23.2`, compatible iOS/Android Development Build, notification setting enabled.
- Each `break_side_effect_*` fixture uses an isolated `pixeldoro-us-07-05-` database.
- Use confirmed in-app reset before reusing the same fixture when a prior terminal row exists.
- Record iOS/Android and permission state separately; unrun cases remain `NOT_RUN`.

## Quick owner path — allowed + exact early tap

```bash
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_side_effect_fast_notification pnpm start --clear
```

Open the seeded completed Focus result (quote the URL so `zsh` does not expand `?`):

```bash
xcrun simctl openurl booted "pixeldoro://focus/result?sessionId=us0702-focus-1"
```

1. Tap `Bắt đầu nghỉ`, allow notifications if prompted, then background/lock the app.
2. Within about 30 seconds expect exactly one notification titled `Phiên nghỉ đã kết thúc`, body
   `Nghỉ ngắn đã xong. Mèo Dev đang chờ bạn quay lại.` and no XP/Coin claim.
3. Tap it. The durable 5-minute Break is still early, so expect the same exact running Break screen,
   no reward, no new Break and no Recovery screen.
4. Tap Back, dismiss once, then confirm cancellation. Expect exact cancelled Result, zero reward and
   no later duplicate notification from `break-complete:<sessionId>`.

## Finite failure checks

Restart one fixture at a time and repeat Start:

```bash
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_side_effect_permission_denied pnpm start --clear
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_side_effect_schedule_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_side_effect_cancel_failure_once pnpm start --clear
EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE=break_side_effect_queue_failure_once pnpm start --clear
```

Expected: Start/countdown/cancel/completion truth remains usable, bootstrap stays ready, no global
Recovery and no duplicate prompt. The injected failure occurs once only.

## Relaunch, accessibility and platform matrix

- Relaunch a running Break: startup may read/ensure an allowed notification but must not request OS
  permission. Relaunch completed/cancelled truth must not replay analytics or Pet feedback.
- VoiceOver/TalkBack: header, Break type/duration, countdown status, confirmation and no-reward Result
  are understandable; decorative Pet animation is ignored while its external status text is read.
- Largest text: content scrolls and no title/action is clipped. Reduce Motion: still Pet + status text
  preserve meaning. Touch targets remain reachable.
- Repeat on iOS and Android; verify Android uses `break-completion`. Test offline/Airplane mode once.

## Cleanup

```bash
unset EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE
```

Use confirmed in-app reset if desired and restore OS notification permission. Formal tester evidence is
`NOT_RUN` until separately executed.
