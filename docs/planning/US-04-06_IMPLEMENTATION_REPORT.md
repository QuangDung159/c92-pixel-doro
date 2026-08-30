---
document_id: PIXELDORO_US_04_06_IMPLEMENTATION_REPORT
title: PixelDoro US-04-06 — Reduced Motion, Layered Fallback and Semantic Pet State Report
version: 1.0.0
status: IMPLEMENTED_AWAITING_OWNER_MANUAL_EVIDENCE
story: US-04-06
date: 2026-08-30
owner: Dũng Lư
baseline_commit: 2c9dda933881b83db26e28c7cef149f93ca3f9b8
language: vi
authority: IMPLEMENTATION_EVIDENCE
story_authority: ./EPIC-04_USER_STORIES.md
---

# US-04-06 — Implementation report

## 1. Kết quả

US-04-06 đã hoàn tất code và automated gates. Khi OS bật Reduce Motion, cả năm Pet state dùng pose
tĩnh. Khi playback/art lỗi, renderer hạ cấp theo chuỗi xác định mà vẫn giữ nguyên semantic state,
session/reward truth và CTA. Story đang `IMPLEMENTED_AWAITING_OWNER_MANUAL_EVIDENCE`;
`US-04-07` chưa active và vẫn bị `OPEN-001` chặn.

## 2. Output đã implement

### Reduced Motion

- Một store/provider app-scoped đọc `AccessibilityInfo`, nghe `reduceMotionChanged` và cleanup một lần.
- Initial state conservative still để tránh motion flash trước khi OS query hoàn tất.
- OS event mới hơn không bị late initial read ghi đè; toggle đang chạy sẽ cancel driver an toàn.
- Celebrate/Bugged static vẫn do terminal controller giới hạn 2.000/1.500 ms và preemptible.

### Layered fallback

Typed resolver chọn chính xác:

```text
state playback → same-state still → neutral-family Idle still → neutral geometric placeholder
```

- Presentation chỉ chọn visual layer; logical state/status tiếp tục đến từ Application projection.
- Runtime driver exception được contain và chuyển sang same-state still.
- Ba fixture development-only cho phép review từng lớp; invalid/production input luôn dùng normal path.
- Current baseline dùng neutral code-pose do chưa có production identity. Không suy diễn Cat/Dog/Robot;
  production sprite catalog vẫn thuộc US-04-07 sau khi `OPEN-001` đóng.

### Accessibility và diagnostics

- `PetStatusText` là semantic owner duy nhất; pose/animation/placeholder là decorative và không nhận focus.
- Status không phụ thuộc màu, sprite hay motion. Shared Button/ChoiceChip giữ busy, disabled, selected
  state và visible selected marker.
- Diagnostic envelope cố định chỉ có event/state/layer/reason; không có session ID, tên Pet, payload,
  SQL hoặc stack. Sink failure best-effort không đi vào transaction hay application truth.

## 3. Automated evidence

Root quality chạy bằng Node `v22.23.2` và pass:

| Gate | Kết quả |
|---|---|
| Typecheck | Pass toàn bộ Domain, Application, Mobile |
| Lint | Pass, không warning |
| Tests | `55` test files / `280` tests pass |
| Device guide validator | Pass, gồm US-04-06 fallback/accessibility guide |
| Architecture boundaries | `11` forbidden imports rejected / `3` valid imports accepted |
| Repository hygiene | Pass; một lockfile, không signing material/Skia, một immutable migration |
| Diff whitespace | Pass |
| Presentation size audit | Pass; max source module `241` dòng |

Coverage mới gồm initial/change/race/cleanup của Reduce Motion, exact fallback matrix, runtime failure,
terminal failure still/preemption, five distinct static poses, semantic status, ChoiceChip/Button state,
sanitized console adapter và diagnostic-sink failure không đổi projection.

## 4. Manual evidence cần owner xác nhận

Thực hiện `apps/mobile/test/device/pet-accessibility-fallback-smoke.md` và ghi:

- screenshot đủ năm state khi Reduce Motion bật và toggle đang chạy;
- ba fallback layer bằng development fixture;
- VoiceOver/TalkBack, font lớn, focus order và CTA notes;
- before/after XP/Coin/session result;
- Git SHA, platform/device/OS và pass/fail.

Manual evidence hiện `PENDING`; report không tự suy diễn device/accessibility result.

## 5. Boundary và gate tiếp theo

- Không remote retry/download, new Pet state, UI redesign, dependency/Skia, schema/migration hoặc native build.
- Không resolve `OPEN-001` và không tạo production Pet identity/art.
- Chỉ đóng US-04-06 sau owner acceptance. US-04-07 còn hard-block cho tới khi `OPEN-001` được Product/Art
  resolve và authority documents được đồng bộ.
