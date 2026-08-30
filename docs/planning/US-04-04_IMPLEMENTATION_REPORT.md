---
document_id: PIXELDORO_US_04_04_IMPLEMENTATION_REPORT
title: PixelDoro US-04-04 — Pet Arbitration and No-Replay Implementation Report
version: 1.1.0
status: DONE_OWNER_ACCEPTED
story: US-04-04
date: 2026-08-30
owner: Dũng Lư
baseline_commit: 8e9690e123e7e9e12e1166ff23bfc45db324edd1
language: vi
authority: IMPLEMENTATION_EVIDENCE
story_authority: ./EPIC-04_USER_STORIES.md
---

# US-04-04 — Implementation report

## 1. Kết quả

US-04-04 đã hoàn tất code và automated quality gates. Một application-scoped arbiter hiện chọn Pet
visual theo thứ tự:

```text
safety/recovery → active committed Focus/Break → fresh terminal one-shot → Idle
```

Active Focus/Break mới preempt one-shot cũ ngay và timer bị hủy; effect không thể quay lại. Stale,
duplicate, wrong-Result-context và out-of-order terminal candidate bị drop mà không tạo visible flash.
Owner xác nhận đã test `US-04-04` ngày 2026-08-30. Story ở trạng thái `DONE_OWNER_ACCEPTED` và
`US-04-05` được mở theo yêu cầu tiếp theo; report không tự suy diễn platform/device metadata.

## 2. Output đã implement

### Domain

- Pure visual priority decision cho safety/base/terminal/Idle.
- Pure freshness decision dùng current Result context, active committed session, runtime-seen key,
  known per-session terminal status và committed timestamp.
- Cùng session có conflicting terminal statuses hoặc đồng thời active + terminal đi vào recovery;
  không có fixed Celebrate/Bugged priority.

### Application

- `PetVisualController` application-scoped kết hợp base và terminal sources thành một immutable
  `PetVisualProjection`.
- Running Focus/Break preempt active terminal timer và seen key vẫn được giữ để effect không resume.
- Latest accepted committed timestamp được giữ trong runtime, nên older event vẫn bị drop sau khi
  one-shot trước đã kết thúc.
- Base refresh đang ở ready không publish loading trung gian; replacement committed projection được
  publish trực tiếp để tránh flicker.
- New controller/runtime luôn bắt đầu terminal Idle; không đọc terminal row và không persist receipt.

### Mobile lifecycle và Presentation

- App background discard one-shot; foreground refresh committed base và không replay terminal event.
- Focus Result unmount discard one-shot. Mount/remount Result không tự emit event.
- Home, Focus Running, Break Running và Focus Result dùng một shared visual provider/status renderer.
- Chỉ accepted terminal projection có polite live-region; stale/drop/duplicate không publish duplicate
  announcement.
- Explicit dev review control `Emit Pet review fixture` xuất hiện chỉ khi fixture được cấu hình.

## 3. Automated evidence

Root quality chạy bằng Node `v22.23.2` và pass:

| Gate | Kết quả |
|---|---|
| Typecheck | Pass toàn bộ Domain, Application, Mobile |
| Lint | Pass, không warning |
| Tests | `47` test files / `255` tests pass |
| Device guide validator | Pass |
| Architecture boundaries | `11` forbidden imports rejected / `3` valid imports accepted |
| Repository hygiene | Pass; một lockfile, không signing material/Skia, một immutable migration |
| Diff whitespace check | Pass |

Coverage mới gồm priority matrix, context/recency/duplicate/conflict freshness, preemption cho
Working/Breaking, no-flicker refresh, background discard, new-runtime base-only state, composition
integration, explicit Result fixture control và semantic renderer.

## 4. Owner acceptance

Owner xác nhận “Đã test 0404” ngày 2026-08-30. Checklist tham chiếu:
`apps/mobile/test/device/pet-arbitration-smoke.md`.

Platform/OS/device, video và profiler metadata chưa được owner cung cấp nên vẫn để trống, không tự
suy diễn. Việc thiếu metadata này không thay đổi owner acceptance đã được phát biểu trực tiếp.

## 5. Boundary và phần chưa làm

- Không implement production Focus/Break command, resolver, reward commit hoặc terminal emitter.
- Không thêm `resultViewed`, animation receipt, schema/migration hoặc terminal-row hydration.
- Không implement sprite/Reanimated playback, blur visibility hoặc performance benchmark; thuộc
  US-04-05.
- Full reduced-motion/layered asset fallback acceptance thuộc US-04-06.
- Không chốt Cat/Dog/Robot hoặc resolve `OPEN-001`; production asset gate thuộc US-04-07.
- Không chạy native/EAS build hoặc Expo prebuild.

## 6. Gate sang Story tiếp theo

Gate đã pass: `US-04-04` là `DONE_OWNER_ACCEPTED`; owner đã yêu cầu và implementation đã chuyển sang
`US-04-05`.
