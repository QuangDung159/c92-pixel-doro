# PixelDoro foundation manual route smoke

Maestro is not required for Epic 1. Run this checklist manually on at least one Android
phone and one iPhone/simulator using the binary being accepted.

Record the platform, OS version, device, app version, commit SHA, date, and pass/fail
result. A screenshot of the initial screen plus a short result table is sufficient.

## Checklist

1. Launch a fresh install and confirm `Chào mừng đến PixelDoro` is visible.
2. Open `pixeldoro://focus/setup` and confirm `Chuẩn bị phiên` is visible.
3. Open `pixeldoro://focus/session` and confirm `Đang tập trung` is visible.
4. Open `pixeldoro://focus/result` and confirm `Kết quả phiên` is visible.
5. Open `pixeldoro://break/session` and confirm `Nghỉ một chút` is visible.
6. Open `pixeldoro://feedback` and confirm `Gửi góp ý` is visible.
7. Confirm no tested route crashes, hangs, or shows the Expo error screen.

## Opening a deep link

Android device or emulator:

```sh
adb shell am start -a android.intent.action.VIEW -d "<deep-link>" com.dragonc92team.pixeldoro
```

iOS Simulator:

```sh
xcrun simctl openurl booted "<deep-link>"
```

Replace `<deep-link>` with each URL from the checklist. These commands only open a
route; the expected text and app health are confirmed visually.
