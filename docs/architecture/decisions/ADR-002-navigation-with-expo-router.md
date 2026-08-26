# ADR-002: Navigation with Expo Router

- **Status:** `ACCEPTED`
- **Date:** 2026-08-26
- **Owners:** Engineering/Tech Lead

## Context

Mobile MVP có khoảng mười screen và cần các flow Onboarding, Focus, Result, Break cùng nhóm screen Home/Shop/History/Settings. Navigation cần type-safe, dễ thấy cấu trúc và phù hợp Expo.

## Decision

Dùng Expo Router với typed routes. Route files chỉ composition screen/layout và gọi application boundary; business rule, SQL và SDK side effect không được đặt trong route.

## Consequences

- File system thể hiện navigation tree và Expo quản lý deep-link plumbing.
- `app`/`src/app` chỉ chứa route; component, feature và domain code nằm ngoài route directory.
- Project Structure phải quy định route group và tránh biến URL structure thành domain boundary.

## Alternatives considered

- React Navigation cấu hình thủ công: phù hợp React Native nhưng cần duy trì route definitions/types riêng trong khi Expo Router là lựa chọn được Expo khuyến nghị cho dự án mới.

## References

- [Expo Router introduction](https://docs.expo.dev/router/introduction/)
- [Expo Router core concepts](https://docs.expo.dev/router/basics/core-concepts/)
