# ADR-005: Animation stack

- **Status:** `ACCEPTED_WITH_GATE`
- **Date:** 2026-08-26
- **Owners:** Engineering + Art
- **Baseline approved:** 2026-08-26

## Context

Pixel art và Pet animation là bản sắc sản phẩm, nhưng Mobile MVP phải ưu tiên độ ổn định, pin, bundle size và khả năng chạy trên cả iOS/Android.

## Decision

Dùng React Native Reanimated cùng bundled sprite assets làm animation baseline cho UI transition, feedback và toàn bộ Pet state. Không thêm React Native Skia vào dependency baseline.

Trước khi đánh giá Skia, prototype Reanimated phải triển khai đủ `idle`, `working`, `breaking`, `celebrating` và `bugged`. Prototype chạy loop tối thiểu 30 phút trên minimum supported Android/iOS device và thiết bị tầm trung/hiện hành đại diện.

Benchmark ghi nhận:

- UI frame stability và freeze/jank trên 100 ms.
- Memory growth/leak.
- CPU, thermal và energy behavior.
- Cold-start impact.
- Binary-size delta.

Nếu tạo Skia spike, phải dùng cùng scene, asset, animation duration và device matrix với baseline.

Skia chỉ được chấp nhận khi một visual requirement `LOCKED` không thể đạt bằng Reanimated + sprite, hoặc Skia tạo cải thiện hiệu năng đáng kể và lặp lại được trên minimum device; đồng thời reviewer chấp nhận chi phí binary, memory, energy, test và maintenance. Hiệu ứng trang trí không thuộc product core phải được giảm/bỏ trước khi dùng nó làm lý do thêm Skia.

Mọi Skia implementation nằm trong Presentation/animation infrastructure, không chứa business rule và phải có static/sprite fallback.

## Consequences

- Baseline native dependency và binary nhỏ hơn vì chưa cài Skia.
- Asset pipeline phải chuẩn hóa sprite size/frame/loop trong Project Structure và Pet State Machine.
- Nếu Skia vượt gate, ADR này phải được cập nhật kèm benchmark report, compatibility, phạm vi sử dụng và fallback đã duyệt.
- UI quan trọng phải có reduced-motion/static fallback.
- Nếu Skia không vượt gate, quyết định kết thúc với Reanimated + sprite và không cần mở lại chỉ vì preference hình ảnh.

## Alternatives considered

- Cài Skia ngay từ đầu: cung cấp rendering mạnh hơn nhưng chưa có nhu cầu đã được chứng minh và làm tăng binary/complexity.
- Chỉ dùng JavaScript-timed animation: không phù hợp mục tiêu animation mượt và dễ làm JS workload ảnh hưởng UI.

## References

- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)
- [React Native Skia installation and bundle size](https://shopify.github.io/react-native-skia/docs/getting-started/installation/)
