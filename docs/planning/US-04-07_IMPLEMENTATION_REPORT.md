---
document_id: PIXELDORO_US_04_07_IMPLEMENTATION_REPORT
title: PixelDoro US-04-07 — Production Cat Sprite Implementation Report
version: 1.0.0
status: IMPLEMENTED_AWAITING_OWNER_DEVICE_ACCEPTANCE
story: US-04-07
date: 2026-08-31
owner: Dũng Lư
baseline_commit: a5abf5e
language: vi
---

# US-04-07 — Implementation report

## 1. Output

- Mobile MVP dùng một Pet cố định: Cat / Mèo Dev, stable ID `cat-dev`.
- Owner Product/Art duyệt atlas candidate v1 ngày 2026-08-31.
- Atlas được normalize thành năm PNG RGBA `1374 × 229`; mỗi sheet có sáu frame vuông `229 × 229`.
- Typed static manifest chứa asset ID, state, playback mode, timing, dimensions và SHA-256.
- Renderer phát frame sprite thật cho loop/one-shot; reduced motion dùng frame tĩnh cùng state.
- Fallback chain giữ nguyên: state playback → same-state still → Cat Idle still → neutral code placeholder.
- Onboarding copy xác nhận Mèo Dev; Pet naming và Pet selection thuộc phase sau.

## 2. Production assets

| State | File | Playback | SHA-256 |
|---|---|---|---|
| Idle | `cat-dev--idle--sheet.png` | loop | `645731c476da1db47864e8fc4174ee753b06d74df52f0894c3aeea97ed27bc33` |
| Working | `cat-dev--working--sheet.png` | loop | `90ac46ec44222aa27a9f3ef9d22e62e7e6a5e9e4a34fbfab193741677632ef68` |
| Breaking | `cat-dev--breaking--sheet.png` | loop | `edce5ac5f22fd0a4bb43c4757daa04baeaff9bb7d995f678b6340f23d76d5c94` |
| Celebrating | `cat-dev--celebrating--sheet.png` | one-shot | `c8c39a70a686e77fc90030bbad25ecc10586fb3e342a9051d40caa9f9d30bc74` |
| Bugged | `cat-dev--bugged--sheet.png` | one-shot | `943f51b26e5fbe406b3dcc204087334d39f4524b1ba9bd1e07ac31a49edbe66a` |

Candidate provenance SHA-256:
`e5baa6bcccc271bdd68a67c24641866636d514aa20d10740c430bc009e3ae697`.

## 3. Implementation boundary

- Cat identity/source chỉ nằm ở Presentation typed asset manifest.
- Domain/Application vẫn identity-neutral; Pet state enum không có species.
- Không thêm Pet selector, persistence field, schema/migration, native dependency, Skia hoặc remote asset.
- Mọi source component liên quan dưới 300 dòng; renderer/fallback/lifecycle stack từ US-04-01–06 được reuse.

## 4. Automated evidence

Lệnh `pnpm quality` với Node `v22.23.2` pass ngày 2026-08-31:

- Typecheck: pass toàn workspace.
- ESLint: pass.
- Vitest: `55/55` files, `281/281` tests pass.
- Device harness: pass.
- Architecture boundaries: 11 forbidden imports rejected, 3 valid imports accepted.
- Repository hygiene: pass; một immutable migration, không Skia/signing material/lockfile thừa.
- Asset integrity test xác minh PNG signature, RGBA color type, exact dimensions/frame count và checksum.

## 5. Pending owner evidence

`US-04-07` và `EPIC-04` chưa Done cho tới khi owner chạy
`US-04-07_TEST_GUIDE.md`, ghi iOS/Android target, accessibility/fallback result và performance result.
Không tự suy diễn device pass từ automated host test.
