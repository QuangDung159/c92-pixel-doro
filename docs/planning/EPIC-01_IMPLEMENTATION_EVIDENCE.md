---
document_id: PIXELDORO_EPIC_01_IMPLEMENTATION_EVIDENCE
title: PixelDoro Mobile MVP — EPIC-01 Implementation Evidence
version: 0.1.0
status: IN_PROGRESS_MANUAL_BUILD_GATES
last_updated: 2026-08-27
owner: Dũng Lư
language: vi
scope:
  - mobile_mvp
  - epic_01
  - implementation_evidence
baseline: ./EPIC-01_USER_STORIES.md
---

# PixelDoro Mobile MVP — EPIC-01 Implementation Evidence

## 1. Kết luận hiện tại

Repository đã hoàn thành foundation có thể kiểm chứng tự động của `US-01-01` đến
`US-01-06`, đồng thời đã tạo configuration, workflow, smoke harness và runbook cho
`US-01-07`. Theo quyết định của owner, mọi native/EAS build sẽ được chạy manual.

Epic chưa được đánh dấu hoàn thành vì còn các gate manual phụ thuộc Expo account,
EAS cloud và iOS/Android route-smoke evidence theo Definition of Story Done.

Không có Timer, Session, Pet identity, gamification, SQLite schema, backend, cloud sync,
desktop hoặc Product decision đang `OPEN` được triển khai trong Epic này.

## 2. Configuration đã resolve

| Input | Giá trị/evidence | Trạng thái |
|---|---|---|
| `CONFIG-01` | Node.js `22.23.2`, pin trong `.nvmrc` và root `engines` | `RESOLVED` |
| `CONFIG-02` | pnpm `11.24.0`, pin trong root `packageManager` | `RESOLVED` |
| `CONFIG-03` | Expo `57.0.17`, React Native `0.86.3`, React `19.2.3`; `expo install --check` pass | `RESOLVED` |
| `CONFIG-04` | Vitest `4.1.11`; pure TypeScript tests không cần Expo runtime | `RESOLVED` |
| `CONFIG-05` | iOS/Android identifier: `com.dunglu.pixeldoro` | `RESOLVED_ASSUMPTION_REVIEW_REQUIRED` |
| `CONFIG-06` | `EXPO_OWNER` và `EXPO_PROJECT_ID` chưa được owner chọn/link | `PENDING_OWNER` |

Bundle/application identifier là technical assumption hợp lý cho owner hiện tại nhưng
cần Dũng Lư xác nhận trước EAS initialization vì đổi identifier sau khi phân phối
binary tạo migration/release cost.

## 3. Story evidence

| Story | Repository evidence | Trạng thái kỹ thuật |
|---|---|---|
| `US-01-01` | Root workspace/toolchain configs, một `pnpm-lock.yaml`, clean install bằng toolchain đã pin | `REPO_COMPLETE` |
| `US-01-02` | Domain/Application packages, public-only exports, independent build/typecheck, package-owned test support | `REPO_COMPLETE` |
| `US-01-03` | Expo SDK 57 app, typed `src/app` route tree, screens ngoài route, asset skeleton, Reanimated không Skia | `REPO_COMPLETE` |
| `US-01-04` | Manual composition root, application facade/context, readiness/recovery, one-subscription + dispose tests | `REPO_COMPLETE` |
| `US-01-05` | Root quality command; 7 deliberate violations bị reject, 2 valid dependency cases được accept | `REPO_COMPLETE` |
| `US-01-06` | 4 representative tests pass; deterministic fakes; mobile integration và device harness đúng owner | `REPO_COMPLETE` |
| `US-01-07` | App/EAS profiles, 3 channels, runtime policy, remote credentials, manual quality-gated workflows, rollback runbook | `CONFIG_COMPLETE_MANUAL_EVIDENCE_PENDING` |

Story checkbox trong baseline chưa đổi sang `[x]` vì Definition of Story Done còn yêu
cầu owner review/task record/PR evidence. Bảng này phản ánh implementation evidence,
không thay Dũng Lư phê duyệt planning document.

## 4. Automated evidence — 2026-08-27

Chạy bằng Node.js `22.23.2` và pnpm `11.24.0`:

- `pnpm quality`: pass.
  - Domain/Application/Mobile strict typecheck: pass.
  - ESLint workspace + architecture boundaries: pass.
  - Vitest: 4 files, 4 tests pass.
  - Device harness/required route presence: pass.
  - Architecture cases: 7 forbidden reject, 2 valid accept.
- `pnpm build`: Domain và Application build độc lập: pass.
- `pnpm peers check`: không có peer dependency issue.
- `pnpm run mobile:doctor`: Expo Doctor `21/21` checks pass.
- `expo install --check`: dependencies up to date.
- Repository hygiene: đúng một root lockfile; không signing material hoặc Skia.
- Metro production export: Android/Hermes và iOS/Hermes đều pass.

Một local iOS development build cũng đã compile/install thành công trong quá trình
foundation verification. Bằng chứng close-story chính thức vẫn dùng manual run do owner
chủ động và gắn vào record theo runbook.

## 5. Manual gate để đóng Epic

- [ ] Dũng Lư xác nhận `com.dunglu.pixeldoro` cho cả hai platform.
- [ ] Chọn Expo account owner và chạy `eas init` để resolve
  `EXPO_OWNER`/`EXPO_PROJECT_ID`.
- [ ] Chạy `eas workflow:validate` cho cả 3 workflow sau khi project được link.
- [ ] Tạo EAS-managed remote credentials; xác nhận không export/commit secret.
- [ ] Trigger thủ công development workflow và lưu iOS/Android build URL/ID.
- [ ] Chạy route smoke trên ít nhất một iOS và một Android target; gắn output cùng
  platform, OS, device và commit SHA.
- [ ] Publish preview thủ công, xác minh cùng runtime trên hai platform và lưu update group.
- [ ] Diễn tập rollback/republish trên artifact phù hợp trước production use.
- [ ] Dũng Lư review Story breakdown/evidence và cập nhật checkbox theo Definition of Done.

EAS workflow schema validation đã được thử nhưng CLI dừng ở project prerequisite vì app
chưa link EAS project. Không tạo/link cloud project tự động vì đây là lựa chọn account
ownership và external state thuộc `CONFIG-06`.

