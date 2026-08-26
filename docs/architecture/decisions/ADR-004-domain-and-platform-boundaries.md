# ADR-004: Domain and platform boundaries

- **Status:** `ACCEPTED` — đã được khóa trong Product Core 1.0.0
- **Date:** 2026-08-26
- **Owners:** Engineering/Tech Lead

## Context

Timer, Strict Mode, session transition và reward idempotency là business-critical. Các rule này cần test độc lập với mobile runtime và có khả năng reuse nếu PixelDoro mở rộng nền tảng sau MVP.

## Decision

Viết domain bằng TypeScript thuần. Domain không import React Native, Expo, UI framework, Zustand hoặc database driver. Database, clock, app lifecycle, notification, analytics, feedback, audio và haptic được truy cập qua port/interface; Infrastructure cung cấp adapter.

## Consequences

- Rule có thể unit test bằng fake clock và in-memory adapter.
- Side effect và dependency wiring cần được mô tả rõ trong System Architecture.
- Có thêm interface/mapper, đổi lại platform SDK không lan vào business rule.
- Desktop tương lai có thể reuse domain mà không buộc MVP phải xây desktop abstraction quá mức.

## Alternatives considered

- Gọi Expo/SQLite trực tiếp trong store hoặc screen: ít file hơn nhưng khó test, dễ nhân đôi rule và khóa domain vào mobile runtime.

## References

- [PixelDoro Product Core — Technical Direction](../../PIXELDORO_CORE_TRUTH.md#15-technical-direction)
