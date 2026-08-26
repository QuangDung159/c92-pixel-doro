# ADR-007: EAS delivery pipeline

- **Status:** `ACCEPTED`
- **Date:** 2026-08-26
- **Owners:** Engineering/Tech Lead

## Context

PixelDoro cần một release pipeline thống nhất cho iOS và Android, quản lý signing credentials, tạo development/preview/production builds, upload store binary và phát hành các thay đổi JavaScript/asset tương thích mà không chờ binary release mới.

## Decision

Dùng Expo Application Services làm delivery platform:

- EAS Update cho over-the-air update.
- `runtimeVersion` policy `appVersion` để tách native runtime compatibility.
- EAS-managed remote credentials cho Android và iOS.
- EAS Build để tạo signed development, preview và production binary.
- EAS Submit để upload binary tới App Store Connect/TestFlight và Google Play track.
- EAS Workflows để chạy quality gates, build, update và submit jobs.

Dùng các update channel `development`, `preview` và `production`. Mọi production update phải được validate trên preview với cùng runtime trước khi phát hành. Native dependency, Expo SDK, permission, entitlement hoặc config-plugin change bắt buộc bump app version và tạo binary mới.

EAS Submit không đồng nghĩa app đã public. App Store review, TestFlight promotion và Google Play track/release status vẫn theo store configuration cùng approval phù hợp.

## Consequences

- Signing credential được chia sẻ cho team qua EAS permissions thay vì file secret trong repository.
- Cần quy trình least privilege, credential rotation, audit và recovery/export.
- OTA có thể sửa JS, styling và bundled asset nhanh, nhưng không được dùng cho native-incompatible change hoặc để né store review policy.
- Production update cần monitoring và rollback bằng cách republish update ổn định trước đó.
- EAS service availability, quota và pricing trở thành dependency vận hành cần được theo dõi.

## Alternatives considered

- Local credentials + local build: giảm phụ thuộc cloud nhưng tăng secret distribution và khác biệt môi trường giữa team members.
- GitHub Actions/Fastlane tự quản toàn bộ: linh hoạt hơn nhưng tăng setup/maintenance không cần thiết cho Mobile MVP.
- Không OTA: đơn giản hơn nhưng làm chậm việc sửa lỗi JS/asset trong beta.

## References

- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Runtime versions](https://docs.expo.dev/eas-update/runtime-versions/)
- [EAS managed credentials](https://docs.expo.dev/app-signing/managed-credentials/)
- [EAS automated submissions](https://docs.expo.dev/build/automate-submissions/)
- [EAS Workflows](https://docs.expo.dev/eas/workflows/introduction/)
