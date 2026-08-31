---
document_id: PIXELDORO_US_04_07_ART_CANDIDATE_REVIEW
title: PixelDoro US-04-07 — Cat Dev Sprite Candidate Review
version: 1.1.0
status: APPROVED_AND_PRODUCTION_INTEGRATED
story: US-04-07
date: 2026-08-31
owner: Dũng Lư
baseline_commit: a5abf5e
language: vi
authority: ART_REVIEW_EVIDENCE
---

# US-04-07 — Cat Dev sprite candidate v1

## 1. Quyết định đã chốt

Product Owner Dũng Lư chốt Pet mặc định của Mobile MVP là **Cat** ngày 2026-08-31. Stable asset ID đề
xuất là `cat-dev`; quyết định này không mở multiple Pet, pet naming, schema hoặc species gameplay.

## 2. Candidate đã duyệt

- PNG RGBA: `apps/mobile/assets/sprites/pets/cat-dev/candidates/cat-dev-atlas-candidate-v1.png`
- Kích thước: `1374 × 1145`, alpha: có.
- Grid: `6 cột × 5 hàng`; mỗi frame `229 × 229`; tổng `30` frame.
- Hàng từ trên xuống: Idle, Working, Breaking, Celebrating, Bugged.
- SHA-256: `e5baa6bcccc271bdd68a67c24641866636d514aa20d10740c430bc009e3ae697`.
- Product/Art approval: Dũng Lư xác nhận “Good job — Duyệt bộ sprite mới” ngày 2026-08-31.
- Runtime integration: hoàn tất qua năm bundled production sheet và typed manifest; neutral renderer
  vẫn là failure fallback cuối chuỗi.

## 3. Prompt đã dùng

Built-in OpenAI ImageGen được yêu cầu tạo một atlas pixel-art nền trong suốt cho cùng một Mèo Dev,
giữ square head, triangular ears, short tail, dark forest-green body và amber eyes xuyên suốt. Atlas có
đúng 5 hàng state × 6 frame; Working có desk/laptop, Breaking có cushion, Celebrating có pixel sparks,
Bugged có displaced red pixel blocks. Palette bám `#17352C`, `#416D3A`, `#E4B44C`, `#FFFDF0`,
`#5596A5`, và chỉ Bugged dùng hạn chế `#C94B43`. Không text/logo/watermark/background/gradient.

## 4. Checklist duyệt Product/Art

- [x] Silhouette đọc rõ là Cat trong candidate review.
- [x] Cùng một character/proportion/palette qua đủ 30 frame.
- [x] Idle/Working/Breaking/Celebrating/Bugged phân biệt được mà không cần text.
- [x] Working desk/laptop và Breaking cushion không tạo visual clutter.
- [x] Celebrate vui nhưng không quá chói; Bugged không mang nghĩa Pet bị đau/chết.
- [x] Pixel edges, transparent padding và baseline phù hợp để crop thành năm state sheet.
- [x] Palette/hierarchy phù hợp UI PixelDoro hiện tại.
- [x] Owner chọn `APPROVE` ngày 2026-08-31.

## 5. Production integration

Engineering đã crop/normalize thành năm file `<pet-id>--<state>--sheet.png`, tạo typed static manifest,
thay neutral runtime art và thêm automated checksum/dimension/alpha validation. Owner device matrix và
acceptance cho `US-04-07`/EPIC-04 exit vẫn được ghi riêng sau khi chạy test guide.
