# US-04-03 terminal Pet feedback Development Build review

Use an existing compatible Development Build. This explicit development-only fixture sends a
deterministic committed-transition DTO through the production Domain/Application feedback contract.
It does not write session, reward, XP, Coin, or receipt data to `pixeldoro.db`.

## 1. Use the pinned Node version and open the Result shell

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=completed pnpm start --clear
```

`node -v` must print `v22.23.2`. Open the installed PixelDoro Development Build, tap
`Thử phiên 5 phút`, then use the `Complete` prototype control to reach `Kết quả phiên`. The Result
screen is only the review shell; the terminal fixture, not the mock reward card, is the feedback
event under review. Do not judge terminal feedback on the `FIRST USE` screen.

Expected for `completed`:

- Pet immediately uses the distinct Celebrate pose and shows `Người bạn đang ăn mừng cùng bạn`.
- `Vào Pet Room` remains tappable while the feedback is visible.
- Pet returns to the committed Idle base state no later than 2.000 ms.
- Reopening Result in the same app runtime does not replay the same event.

## 2. Review every terminal scenario

Stop Metro between scenarios, change the terminal fixture, restart Metro, and repeat the short trial
flow to Result.

```sh
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=strict_failed pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=cancelled pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=break_completed pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=duplicate_completed pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE=playback_error pnpm start --clear
```

Expected results:

- `strict_failed`: distinct Bugged pose and `Người bạn vừa bị nhiễu, mình thử lại nhé`; returns to
  Idle no later than 1.500 ms; no reward is created.
- `cancelled`: no Celebrate/Bugged one-shot; Idle remains visible.
- `break_completed`: no Celebrate/Bugged one-shot; Idle remains visible.
- `duplicate_completed`: only one Celebrate window and one screen-reader announcement; no replay.
- `playback_error`: final static Celebrate pose and semantic text remain until the same 2.000 ms
  deadline; screen does not crash and the Result CTA remains tappable.

For VoiceOver/TalkBack, verify the accepted Celebrate/Bugged status is announced once and remains
understandable without color. A static pose is intentional in this Story; full animation playback
and OS Reduce Motion acceptance belong to US-04-05/06.

## 3. Record evidence and restore production path

Record the Git SHA, platform, OS, device/simulator, one short timing video, scenario result table, and
the accessibility observation. The fixture contract and automated tests prove no durable write;
do not infer session/reward truth from the prototype reward card.

Stop Metro and clear both review fixtures:

```sh
unset EXPO_PUBLIC_EPIC_04_TERMINAL_FIXTURE
unset EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE
pnpm start --clear
```

Reopen the app. No terminal feedback may be emitted merely by mounting Result without an explicitly
configured development fixture or a future production committed-transition caller.
