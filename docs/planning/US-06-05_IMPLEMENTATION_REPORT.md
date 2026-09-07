---
document_id: PIXELDORO_US_06_05_IMPLEMENTATION_REPORT
title: PixelDoro Mobile MVP — US-06-05 implementation report
version: 1.0.0
status: DONE_OWNER_ACCEPTED_QUICK_UI
date: 2026-09-07
owner: Dũng Lư
branch: feats/epic-06
implementation_start_sha: 87b5bee2976fa6c1990c3b583c669e60e6576018
exact_implementation_sha: 458a8868ac0024e3b3d1eff64ccc26408a81b2e1
manual_device_status: OWNER_QUICK_UI_SMOKE_REPORTED_IOS_ANDROID
owner_acceptance_status: DONE_OWNER_ACCEPTED
formal_tester_status: DEFERRED_TO_LATER_PHASE
resolved_issues:
  - US0605-KNOWN-01_NOTIFICATION_ICON_CROSS_PLATFORM_PARITY
authority: EVIDENCE
plan: ./US-06-05_IMPLEMENTATION_PLAN.md
---

# US-06-05 — Implementation report

## Kết luận

US-06-05 đã hoàn tất theo toàn bộ 12 confirmation Option A được owner duyệt.
Session/reward truth vẫn nằm trong transaction hiện có; notification và analytics chạy sau commit,
best-effort, không thể đưa app vào Recovery hay thay đổi Result. Owner đã báo cáo quick UI smoke trên
iOS và Android, xác nhận các lỗi notification/navigation/crash đã được sửa và đóng notification-icon
issue. Production Standard route không còn prototype fallback. Formal tester vẫn deferred, không bị
suy diễn từ owner smoke.

## Phạm vi đã triển khai

- Thêm `expo-notifications ~57.0.17` và config plugin; đồng bộ direct `expo-constants ~57.0.17` để
  loại duplicate native module.
- Tạo application ports cho permission, deterministic schedule/cancel, response mapping và navigation.
- Expo adapter xử lý provisional permission, Android channel, exact deadline/sound matching,
  malformed response, stale/duplicate tap và provider failure.
- Coordinator nối post-commit Start/terminal/startup/reset; preference off không prompt; tap đi qua
  readiness + durable reconcile/read exact session.
- Standard analytics recorder ghi năm event được allowlist, ID deterministic, opt-out, queue
  dedupe/TTL/capacity và không upload provider.
- Bổ sung finite dev fixtures cho permission/schedule/cancel/queue failure và accelerated 30-second
  notification; thêm SQLite isolation journey và device smoke guide.
- Audit/fix accessibility cho countdown, confirmation busy state, reward/result stats và wrapping
  mode/tag rows; pegboard decoration placeholder vẫn ẩn.
- Mở rộng metadata validation cho các property analytics mới, không tạo migration/schema.

## Verification evidence

| Check | Kết quả |
|---|---|
| Typecheck | PASS — domain, application, mobile |
| ESLint | PASS |
| Vitest | PASS — 119 files / 651 tests |
| Device harness validator | PASS |
| Boundary validator | PASS — 12 forbidden rejected / 4 valid accepted |
| Repository hygiene | PASS — one lockfile, no signing material, no Skia, immutable migration preserved |
| iOS JS export | PASS — 1,776 modules; output `/private/tmp/pixeldoro-epic06-ios.askhOc` |
| Android JS export | PASS — 1,871 modules; output `/private/tmp/pixeldoro-epic06-android.em064b` |
| Expo config introspection | PASS — `expo-notifications` plugin present |
| Expo Doctor | 20/21 PASS; remaining failure is existing SDK57 patch drift in six Expo packages, not introduced by this story |
| Native Development Build | OWNER-REPORTED PASS — iOS Simulator và Android Emulator |
| Device/manual owner smoke | OWNER-REPORTED PASS — notification delivery/tap/result/icon và no-crash fixes |
| Formal tester | DEFERRED_TO_LATER_PHASE |

Targeted US-06-05 suite also passed: 8 files / 47 tests, including adapter, coordinator, analytics,
startup, fixture, side-effect SQLite and Standard completion integration. The full suite additionally
passed the EPIC-02 reset/relaunch race after preserving dispose idempotency.

## Known issues and handoff

### `US0605-KNOWN-01` — Notification icon iOS/Android

**Trạng thái:** `CLOSED_OWNER_ACCEPTED` — owner đóng ngày 2026-09-07.

- Resolution tại candidate `5d045058950ea373b1d438556062cf64073c6701`: bỏ explicit Android
  notification-icon override khỏi Expo plugin để notification dùng application icon.
- Owner đã xác nhận kết quả icon và yêu cầu đóng issue. Việc đóng này chỉ áp dụng cho parity icon;
  các Epic exit gate khác vẫn được đánh giá độc lập.

Expo Doctor still reports the repository's pre-existing SDK patch drift (`expo ~57.0.17` versus the
doctor baseline `~57.0.20`, plus related Expo packages). Upgrading that unrelated set would expand
scope and was not performed. Formal physical-device/accessibility matrix remains
`DEFERRED_TO_LATER_PHASE`; owner emulator/simulator smoke is recorded separately and is the approved
progression/closure evidence for this Epic.
