---
document_id: PIXELDORO_EPIC_01_IMPLEMENTATION_EVIDENCE
title: PixelDoro Mobile MVP — EPIC-01 Implementation Evidence
version: 0.2.0
status: COMPLETE_OWNER_ACCEPTED
last_updated: 2026-09-03
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

`EPIC-01` đã hoàn thành. Repository foundation, cross-platform native build/boot,
manual route smoke, quality gates, EAS configuration và EAS-managed remote credentials
đều có evidence. Dũng Lư đã review và phê duyệt Story breakdown cùng MVP Epic plan làm
baseline ngày 2026-08-27.

Không có Timer, Session, Pet identity, gamification, SQLite schema, backend, cloud sync,
desktop hoặc Product decision đang `OPEN` được triển khai trong Epic này.

Metadata được normalized ngày 2026-09-03 từ stale `IN_PROGRESS_MANUAL_BUILD_GATES` sang
`COMPLETE_OWNER_ACCEPTED`. Toàn bộ closure checklist bên dưới đã pass từ 2026-08-27; thay đổi này
không tạo evidence mới hoặc claim preview/production OTA đã chạy.

## 2. Configuration đã resolve

| Input | Giá trị/evidence | Trạng thái |
|---|---|---|
| `CONFIG-01` | Node.js `22.23.2`, pin trong `.nvmrc` và root `engines` | `RESOLVED` |
| `CONFIG-02` | pnpm `11.24.0`, pin trong root `packageManager` | `RESOLVED` |
| `CONFIG-03` | Expo `57.0.17`, React Native `0.86.3`, React `19.2.3`; `expo install --check` pass | `RESOLVED` |
| `CONFIG-04` | Vitest `4.1.11`; pure TypeScript tests không cần Expo runtime | `RESOLVED` |
| `CONFIG-05` | iOS/Android identifier: `com.dragonc92team.pixeldoro` | `RESOLVED_OWNER_CONFIRMED` |
| `CONFIG-06` | Expo owner `dragonc92team`; EAS project `6f65fb79-ffe9-4fa6-9951-895f27bf0725` đã link | `RESOLVED` |

Bundle/application identifier đã được Dũng Lư xác nhận trước EAS initialization. Đổi
identifier sau khi phân phối binary sẽ tạo migration/release cost.

MVP hiện giới hạn device acceptance ở iPhone và Android phone; native iPad support bị
tắt để không mở rộng layout/device QA scope trước khi core loop ổn định.

## 3. Story evidence

| Story | Repository evidence | Trạng thái kỹ thuật |
|---|---|---|
| `US-01-01` | Root workspace/toolchain configs, một `pnpm-lock.yaml`, clean install bằng toolchain đã pin | `DONE` |
| `US-01-02` | Domain/Application packages, public-only exports, independent build/typecheck, package-owned test support | `DONE` |
| `US-01-03` | Expo SDK 57 app, typed `src/app` route tree, screens ngoài route, asset skeleton, Reanimated không Skia | `DONE` |
| `US-01-04` | Manual composition root, application facade/context, readiness/recovery, one-subscription + dispose tests | `DONE` |
| `US-01-05` | Root quality command; 7 deliberate violations bị reject, 2 valid dependency cases được accept | `DONE` |
| `US-01-06` | 4 representative tests pass; deterministic fakes; mobile integration và device harness đúng owner | `DONE` |
| `US-01-07` | App/EAS profiles, 3 channels, runtime policy, remote-only credentials, local Android APK/AAB profiles, manual quality-gated workflows, rollback runbook | `DONE` |

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

### Android physical-device evidence — 2026-08-27

- Local APK build hoàn tất bằng profile `android-apk` với Android remote keystore do
  EAS quản lý; artifact không được commit.
- Artifact: `apps/mobile/artifacts/pixeldoro.apk`, SHA-256
  `545efcbb311215afd5dd16771e93172261cdda039f7be6e5eb891f0ac2ccc8ad`.
- APK signature verify pass; signing certificate SHA-256
  `c055bf5b4eb7eb7abe56641eed452e5439909076288fc28732b9528d44054f35`.
- Cài và boot thành công trên TECNO CK7n, Android 14 / API 34, ARM64.
- Installed package được ADB xác nhận là `com.dragonc92team.pixeldoro`, version `0.1.0`,
  version code `1`, min SDK `24`, target SDK `36`.
- Owner đã cung cấp screenshot onboarding boot trên thiết bị thật và xác nhận manual
  route smoke pass cho toàn bộ checklist. Maestro không phải dependency của Epic 1.

### iOS Simulator evidence — 2026-08-27

- Owner chạy local native build bằng `pnpm run ios` sau khi cập nhật bundle identifier.
- Build được cài và boot thành công trên iPhone 14 Plus Simulator, iOS 26.5.
- Simulator app container và `Info.plist` xác nhận bundle identifier
  `com.dragonc92team.pixeldoro`, display name `PixelDoro`, version `0.1.0`, build `1`,
  minimum iOS `16.4`.
- Owner đã cung cấp screenshot onboarding boot trên Simulator và xác nhận manual route
  smoke pass cho toàn bộ checklist.
- Simulator build không tạo hoặc xác nhận iOS distribution certificate/provisioning
  profile; credential này được xác nhận riêng qua EAS ở bằng chứng bên dưới.

### iOS EAS credential evidence — 2026-08-27

- EAS xác nhận tất cả build credentials đã sẵn sàng cho project
  `@dragonc92team/pixeldoro` và bundle identifier `com.dragonc92team.pixeldoro`.
- PixelDoro reuse Distribution Certificate còn hiệu lực của cùng Apple Developer Team;
  EAS tạo App Store Provisioning Profile riêng cho bundle identifier của ứng dụng.
- Credential được EAS quản lý từ xa; không download certificate/profile và không tạo
  `credentials.json` trong repository.
- Không tạo APNs Push Notifications Key ở Epic 1: MVP chỉ dùng local notification;
  server push notification nằm ngoài scope và không cần APNs credential.

### Manual route-smoke evidence — 2026-08-27

- Build source commit: `ddd759ef96945f3e4f5ce0dcb26ecd04012ed6a5`.
- Targets: TECNO CK7n / Android 14 và iPhone 14 Plus Simulator / iOS 26.5.
- Owner đã test tay và xác nhận PASS trên cả hai platform cho onboarding cùng các deep
  link `pixeldoro://focus/setup`, `pixeldoro://focus/session`,
  `pixeldoro://focus/result`, `pixeldoro://break/session` và `pixeldoro://feedback`.
- Mỗi deep link mở đúng màn hình mong đợi; không có crash, hang hoặc Expo error screen
  được báo cáo trong lượt kiểm tra.

## 5. Epic closure record

- [x] Dũng Lư xác nhận `com.dragonc92team.pixeldoro` cho cả hai platform.
- [x] Xác nhận Expo account owner `dragonc92team`; EAS project ID
  `6f65fb79-ffe9-4fa6-9951-895f27bf0725` đã được link.
- [x] Chạy `eas workflow:validate` thành công cho cả 3 workflow sau khi project được link.
- [x] Hoàn tất EAS-managed remote credentials; xác nhận không export/commit secret.
  - [x] Android remote keystore đã được EAS tạo và resolve cho local build.
  - [x] iOS Distribution Certificate và App Store Provisioning Profile đã sẵn sàng trên EAS.
- [x] Chạy manual route smoke trên ít nhất một iOS và một Android target theo
  `apps/mobile/test/device/foundation-smoke.md`; gắn pass/fail result cùng platform, OS,
  device và commit SHA. Không yêu cầu Maestro.
- [x] Dũng Lư review Story breakdown/evidence và phê duyệt planning baseline.

Các operation sau không block Epic 1 và chỉ được chạy khi có artifact/use case phù hợp:

- EAS cloud development workflow không được trigger để tránh dùng free build quota;
  local iOS/Android build, boot và route-smoke evidence được owner chấp nhận thay thế.
- Preview OTA phải được publish và smoke-test trên cùng runtime trước production OTA.
- Rollback/republish phải được diễn tập trước production use; runbook đã sẵn sàng.

EAS project đã được owner link thủ công. Cả ba workflow đã được Expo API xác nhận có
configuration YAML hợp lệ bằng EAS CLI `22.6.0` ngày 2026-08-27.
