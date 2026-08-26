# ADR-008: PostHog analytics và cost guardrails

- **Status:** `ACCEPTED`
- **Date:** 2026-08-26
- **Owners:** Engineering/Product

## Context

PixelDoro cần đo activation, completion, retention và core focus loop trong closed beta nhưng vẫn phải hoạt động offline, không yêu cầu tài khoản và không thu dữ liệu vượt quá nhu cầu sản phẩm. Analytics provider cũng tạo chi phí tăng theo event volume; autocapture hoặc user profiles có thể làm volume và chi phí tăng ngoài dự kiến.

## Decision

Dùng PostHog Cloud EU cho Mobile MVP, tích hợp qua application-owned analytics port/adapter. Chỉ capture các anonymous core product events trong allowlist đã review. Không self-host trong MVP.

Cấu hình bắt buộc:

- Anonymous installation ID ngẫu nhiên; không tạo person profile.
- Tắt autocapture, screen/touch capture, app lifecycle autocapture, session replay và GeoIP enrichment.
- Không thu IDFA/GAID, advertising ID, account/contact, push token, free text, Pet name hoặc raw database record.
- Không gửi development/test analytics; preview chỉ dùng project/dataset tách biệt nếu cần acceptance test có chủ đích.
- Mỗi event tối đa 20 custom properties và 2 KiB serialized custom payload.
- Queue tối đa 1.000 events/device, TTL 7 ngày và drop-oldest khi đầy. Queue/retry nằm ngoài core transaction.
- Delivery bất đồng bộ theo batch, exponential backoff và at-least-once; `eventId` hỗ trợ deduplication.
- Opt-out/reset xóa queue, rotate anonymous ID và dừng capture ngay.
- Raw provider retention không vượt quá 12 tháng; không tạo export dài hạn ngoài data plan được duyệt.

Cost guardrails:

- Planning budget tối đa 250 events/MAU/tháng.
- Billing limit ban đầu `US$50/tháng`, không tự tăng.
- Cảnh báo tại 50%, 75% và 90% event budget/spend ceiling.
- Review schema, sampling và provider tại 500.000 events/tháng.
- Engineering/Product phải phê duyệt lại trước khi vượt 1.000.000 events/tháng hoặc tăng billing limit.

## Consequences

- Core analytics đủ cho funnel/retention nhưng không có replay hoặc hành vi UI tự động.
- Event taxonomy và adapter cần được quản lý như API: typed events, allowlisted properties, schema review và tests.
- Offline events có thể bị loại sau 7 ngày hoặc khi queue đầy; việc mất analytics không ảnh hưởng product truth.
- Raw analytics có thể tồn tại phía provider lâu hơn nhu cầu phân tích ngắn hạn, nhưng bị chặn ở mức tối đa 12 tháng và không được nhân bản tùy tiện.
- Pricing/free tier là dependency có thể thay đổi, vì vậy monthly usage và billing alerts là yêu cầu vận hành.
- Adapter giữ khả năng đổi provider nếu pricing, privacy hoặc product capability không còn phù hợp.

## Alternatives considered

- Amplitude: free event allowance ban đầu lớn hơn nhưng chi phí sau free tier kém minh bạch hơn cho quyết định MVP hiện tại.
- Mixpanel: phù hợp product analytics nhưng chi phí vượt free tier cao hơn ở volume đã ước tính.
- Firebase Analytics: chi phí capture trực tiếp thấp nhưng raw export/query có thể phát sinh BigQuery cost và tăng coupling với Google stack.
- Self-host PostHog: tăng quyền kiểm soát nhưng tạo thêm chi phí vận hành, backup, upgrade và monitoring không phù hợp Mobile MVP.

## References

- [PostHog pricing](https://posthog.com/pricing)
- [PostHog React Native SDK](https://posthog.com/docs/libraries/react-native)
