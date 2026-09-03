# US-05-02 onboarding trial Development Build review

Use an existing compatible Development Build. Record exact Git SHA, platform, device/simulator,
OS and app version. Start with a clean first-use database.

## 1. Production Start, resume and Cancel

```sh
nvm use
git rev-parse HEAD
pnpm start --clear
```

1. Cold launch to Intro and rapidly tap `Thử phiên 5 phút` twice.
2. Confirm one Running screen/session, a countdown near `05:00`, and working Cat.
3. Confirm no Prototype badge, mock/Complete control, Strict, mode or work-tag selector.
4. Background or lock for about 15 seconds; return and confirm wall-clock elapsed.
5. Kill before deadline and relaunch; confirm the same session ID/deadline resumes.
6. Open Cancel and dismiss; confirm the session remains running.
7. Confirm Cancel; navigation returns to Intro only after commit.
8. Reopen and confirm `cancelled`, zero XP/Coin, no reward receipt and idle Cat.
9. Disable network and repeat; the local workflow must remain available.

## 2. Finite failure and clock fixtures

Restart Metro between scenarios:

```sh
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_start_failure pnpm start --clear
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_cancel_failure pnpm start --clear
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_running_fast_clock pnpm start --clear
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_deadline_pending pnpm start --clear
```

- `trial_start_failure`: remain on Intro; no session row; truthful retry copy.
- `trial_cancel_failure`: remain on Running; row stays running; no reward/profile write.
- `trial_running_fast_clock`: display advances 30×, while persisted duration remains exactly five
  minutes and `endsAt-startedAt=300000`.
- `trial_deadline_pending`: on the accepted US-05-02 SHA `ef05b207`, quickly reaches `00:00`, shows
  “Đang xác nhận kết quả…” and does not complete. On later US-05-03 builds this boundary is expected
  to continue through the production completion command; use the US-05-03 guide for that behavior.

Review VoiceOver/TalkBack, large text and Reduce Motion. Countdown must not announce every second;
button/dialog order must remain understandable.

## 3. Cleanup

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

Capture start/double-tap/background/relaunch/cancel video, failure/pending screenshots, durable
before/after facts and pass/fail for every group. Bind US-05-02 evidence to `ef05b207`; do not treat
later completion/reward behavior as US-05-02 evidence.
