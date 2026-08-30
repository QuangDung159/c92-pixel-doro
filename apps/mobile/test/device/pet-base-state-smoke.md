# US-04-02 committed Pet base-state Development Build review

Use an existing compatible Development Build. The explicit review fixture exercises the production
Domain/Application mapping and Presentation renderer without writing to `pixeldoro.db`. Automated
integration separately verifies the SQLite session repository → Application projection path.

## 1. Capture the revision and start Metro

```sh
nvm use
git rev-parse HEAD
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=idle pnpm start --clear
```

Open the installed PixelDoro Development Build and record platform, OS, device/simulator and the
fixture value. The fixture is development-only and is never enabled without the explicit variable.

## 2. Review each state

Stop Metro between scenarios, replace the fixture value, restart, then reopen Pet Room:

```sh
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=focus pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=short_break pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=long_break pnpm start --clear
EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE=error pnpm start --clear
```

Expected visible results:

- `idle`: “Người bạn đang chờ bạn”.
- `focus`: “Người bạn đang tập trung cùng bạn”.
- `short_break` and `long_break`: “Người bạn đang nghỉ cùng bạn”.
- `error`: friendly recovery surface with Retry; no Idle/Working/Breaking Pet is guessed.
- Focus/Break prototype countdown, route changes and Complete controls do not alter the committed
  base projection.
- VoiceOver/TalkBack announces each state in text. Reduce Motion does not change logical state.

## 3. Production-path cleanup

Stop Metro and clear the fixture before normal use:

```sh
unset EXPO_PUBLIC_EPIC_04_PET_BASE_FIXTURE
pnpm start --clear
```

Reopen the app. It must read only the production SQLite `sessions` repository. Capture screenshots
for the four ready scenarios plus recovery, and record the exact fixture table and revision.
