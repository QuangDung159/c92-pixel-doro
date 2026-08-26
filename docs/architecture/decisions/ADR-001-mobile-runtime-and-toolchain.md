# ADR-001: Mobile runtime and toolchain

- **Status:** `ACCEPTED` — đã được khóa trong Product Core 1.0.0
- **Date:** 2026-08-26
- **Owners:** Engineering/Tech Lead
- **Technical baseline approved:** 2026-08-26

## Context

PixelDoro cần phát hành một Mobile MVP chung cho iOS và Android, tận dụng năng lực JavaScript/TypeScript hiện có, hỗ trợ native notification, SQLite, app lifecycle và animation.

## Decision

Dùng React Native, TypeScript strict mode và Expo Development Build. Expo Go chỉ dùng cho thử nghiệm không phụ thuộc native capability; acceptance test và beta build phải chạy bằng development/production build của ứng dụng.

Technical baseline của Mobile MVP:

- Expo SDK `57.x` stable.
- React Native `0.86.x` và React `19.2.3`, theo compatibility matrix của Expo.
- Node.js 22 LTS, range `>=22.13.0 <23.0.0`.
- React Native New Architecture và Hermes.
- iOS `16.4+`, Xcode `26.4+`.
- Android `7.0+`/API `24+`, `compileSdkVersion` và `targetSdkVersion` API `36`.

Expo/native dependency phải được cài bằng `npx expo install`. Exact package và Node patch được pin bằng lockfile cùng `.nvmrc` hoặc `.tool-versions`. Không dùng beta, canary hoặc nightly cho MVP. Không nâng React Native độc lập với Expo SDK. Expo SDK major/minor được giữ ở dòng `57.x` đến hết closed beta; patch update chỉ được nhận sau compatibility check và acceptance test, với security fix hoặc release blocker được ưu tiên.

## Consequences

- Phần lớn application/domain code được chia sẻ giữa iOS và Android.
- Native dependency hoặc config plugin change yêu cầu build lại development client.
- Package phải tương thích với Expo SDK đang pin.
- Thiết bị thấp nhất cần được kiểm thử là iOS 16.4 và Android API 24; test matrix phải bổ sung thiết bị/OS trung gian và phiên bản mới nhất.
- Desktop không được kéo vào kiến trúc MVP; domain thuần TypeScript vẫn được bảo vệ để có khả năng reuse sau này.

## Alternatives considered

- React Native Community CLI: linh hoạt hơn ở native layer nhưng tăng setup/maintenance trước khi MVP chứng minh core loop.
- Hai ứng dụng Swift/Kotlin riêng: chi phí triển khai và đồng bộ rule cao hơn nhu cầu MVP.

## References

- [PixelDoro Product Core](../../PIXELDORO_CORE_TRUTH.md)
- [Expo SDK compatibility matrix](https://docs.expo.dev/versions/latest/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
