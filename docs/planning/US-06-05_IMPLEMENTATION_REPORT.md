---
document_id: PIXELDORO_US_06_05_IMPLEMENTATION_REPORT
title: PixelDoro Mobile MVP — US-06-05 implementation report
version: 0.1.0
status: IMPLEMENTED_CANDIDATE_PENDING_NATIVE_OWNER_UI
date: 2026-09-07
owner: Dũng Lư
branch: feats/epic-06
implementation_start_sha: 87b5bee2976fa6c1990c3b583c669e60e6576018
exact_implementation_sha: PENDING_COMMIT
manual_device_status: US_06_05_NOT_RUN
formal_tester_status: DEFERRED_TO_LATER_PHASE
authority: EVIDENCE
plan: ./US-06-05_IMPLEMENTATION_PLAN.md
---

# US-06-05 — Implementation report

## Kết luận

Implementation candidate đã hoàn tất theo toàn bộ 12 confirmation Option A được owner duyệt.
Session/reward truth vẫn nằm trong transaction hiện có; notification và analytics chạy sau commit,
best-effort, không thể đưa app vào Recovery hay thay đổi Result. Candidate chưa được coi là Epic exit:
chưa rebuild Development Build sau config plugin và chưa chạy owner quick UI/manual device smoke.

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
| Vitest | PASS — 116 files / 640 tests |
| Device harness validator | PASS |
| Boundary validator | PASS — 12 forbidden rejected / 4 valid accepted |
| Repository hygiene | PASS — one lockfile, no signing material, no Skia, immutable migration preserved |
| iOS JS export | PASS — 1,775 modules; output `/private/tmp/pixeldoro-us0605-ios-final.Q4f3Bl` |
| Android JS export | PASS — 1,870 modules; output `/private/tmp/pixeldoro-us0605-android-final.161ZTl` |
| Expo config introspection | PASS — `expo-notifications` plugin present |
| Expo Doctor | 20/21 PASS; remaining failure is existing SDK57 patch drift in six Expo packages, not introduced by this story |
| Native Development Build | NOT RUN — config plugin requires rebuild |
| Device/manual owner smoke | NOT RUN |
| Formal tester | DEFERRED_TO_LATER_PHASE |

Targeted US-06-05 suite also passed: 8 files / 47 tests, including adapter, coordinator, analytics,
startup, fixture, side-effect SQLite and Standard completion integration. The full suite additionally
passed the EPIC-02 reset/relaunch race after preserving dispose idempotency.

## Known limitation and handoff

Expo Doctor still reports the repository's pre-existing SDK patch drift (`expo ~57.0.17` versus the
doctor baseline `~57.0.20`, plus related Expo packages). Upgrading that unrelated set would expand
scope and was not performed. Native notification behavior remains unproven until a fresh iOS/Android
Development Build is rebuilt from this candidate.

Next owner action: rebuild the Development Build, run
[standard-focus-side-effects-exit-smoke.md](../../apps/mobile/test/device/standard-focus-side-effects-exit-smoke.md),
then report quick UI/device evidence. Only after that should exact SHA and EPIC-06 exit acceptance be
closed.
