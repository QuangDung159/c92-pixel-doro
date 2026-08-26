# ADR-006: In-app feedback and store review separation

- **Status:** `ACCEPTED`
- **Date:** 2026-08-26
- **Owners:** Product + Engineering

## Context

PixelDoro cần thu feedback định tính sớm để phát hiện trải nghiệm chưa tốt, đồng thời có thể mời người dùng đánh giá ứng dụng trên App Store và Google Play. Apple yêu cầu dùng system-provided review API và không chấp nhận custom store review prompt. Google Play yêu cầu không hỏi mức độ hài lòng trước/đồng thời với in-app review card và cấm thao túng rating/review.

Một flow đưa người chấm 4–5 sao tới store nhưng giữ người chấm 1–3 sao ở form nội bộ là review gating và không được triển khai.

## Decision

Triển khai hai flow độc lập:

1. **Product feedback:** popup/screen trong app có nhãn “Góp ý cho PixelDoro”, thu `experienceScore` 1–5 và comment tùy chọn qua feedback adapter.
2. **Store review:** dùng `expo-store-review` để gọi native review API của Apple/Google.

`experienceScore`, comment, sentiment hoặc việc người dùng đã submit feedback không được dùng để gọi, chặn hoặc chuyển hướng store review. Không hỏi câu hỏi hài lòng ngay trước/in-review flow; không incentive bằng XP, Coin hoặc item.

Store review trigger chỉ dựa trên engagement trung tính. Native request chỉ được xét trong production build khi tất cả điều kiện sau đúng:

- App đã được cài ít nhất 7 ngày.
- Có ít nhất 5 completed Focus sessions trên ít nhất 3 ngày local khác nhau.
- Người dùng vừa completed một Focus session, đã xem xong reward/celebration và trở về Home.
- Không có active Focus/Break, onboarding, modal hoặc thao tác time-sensitive.
- Native store review action khả dụng.

Frequency cap được enforce local: cooldown ít nhất 120 ngày, tối đa 3 attempts trong rolling 365 ngày và tối đa một attempt trên mỗi app version. Attempt phải được persist ngay trước khi gọi native API và vẫn được tính nếu OS/store không hiển thị prompt hoặc không trả outcome. Không retry ngay sau lỗi/không hiển thị.

Các field tối thiểu cần persist gồm `installedAt`, `lastStoreReviewAttemptAt`, các attempt timestamps trong rolling window và `lastStoreReviewAttemptVersion`; completed count cùng distinct active days được derive từ session history. Reset toàn bộ dữ liệu local sẽ reset các field này theo data reset policy.

Chỉ analytics event `store_review_requested` được phép capture; app không được suy diễn hoặc capture rating/review result. Nếu Settings có CTA chủ động “Đánh giá PixelDoro”, CTA mở trang review của store thay vì gọi native in-app review prompt.

## Consequences

- Team vẫn nhận được feedback xấu sớm để sửa sản phẩm mà không thao túng store rating.
- Feedback provider và analytics phải tách dữ liệu; comment không được gửi vào analytics.
- UI test phải chứng minh người chấm thấp không bị chặn khỏi store review và người chấm cao không tự động bị chuyển sang store.
- Native store prompt có thể không xuất hiện dù app gọi API vì hệ điều hành/store kiểm soát quota và eligibility.
- Không cần backend hoặc dịch vụ trả phí; policy dùng session history và metadata local.
- QA phải kiểm thử eligibility/frequency policy bằng adapter fake vì native prompt không hiển thị deterministically.
- Feedback submit failure không ảnh hưởng core focus loop.

## Alternatives considered

- Review gating theo số sao: loại bỏ vì vi phạm tinh thần/chính sách integrity của store và tạo rủi ro rejection/removal.
- Chỉ mở external store link: kém tự nhiên hơn native review API và không phải lựa chọn mặc định.
- Chỉ thu store review, không có feedback nội bộ: không đáp ứng nhu cầu beta research và support.

## References

- [PixelDoro Product Core — In-app feedback và store review](../../PIXELDORO_CORE_TRUTH.md#105-in-app-feedback-và-store-review--locked)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple requesting App Store reviews](https://developer.apple.com/documentation/StoreKit/requesting-app-store-reviews)
- [Google Play In-App Review guidelines](https://developer.android.com/guide/playcore/in-app-review)
- [Expo StoreReview](https://docs.expo.dev/versions/v57.0.0/sdk/storereview/)
