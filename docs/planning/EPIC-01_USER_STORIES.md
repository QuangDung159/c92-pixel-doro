---
document_id: PIXELDORO_EPIC_01_USER_STORIES
title: PixelDoro Mobile MVP — EPIC-01 User Stories
version: 1.0.0
status: APPROVED
last_updated: 2026-08-27
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
approved_by: Dũng Lư
approver_role: Product Owner
approved_at: 2026-08-27
language: vi
scope:
  - mobile_mvp
  - epic_01
  - user_story_breakdown
authority: PLANNING
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
adr_directory: ../architecture/decisions
---

# PixelDoro Mobile MVP — EPIC-01 User Stories

## 0. Epic context

**Epic:** `EPIC-01 — Mobile Foundation và Delivery Baseline`  
**Loại:** Enabler  
**Epic outcome:** Solo developer có workspace tái lập được, chạy development build trên iOS/Android và có quality/delivery baseline đúng kiến trúc đã duyệt.

Tài liệu này chia `EPIC-01` thành các Enabler Story có acceptance boundary độc lập. Vì Epic này không trực tiếp cung cấp một product user flow, Story dùng actor “solo developer” và outcome kỹ thuật có thể kiểm chứng thay vì ép mọi nội dung vào mẫu “người dùng cuối”.

Tài liệu này không:

- Triển khai business rule của Timer, Session, Pet hoặc Gamification.
- Chọn Pet mặc định, contribution colors hoặc Pet naming.
- Tạo database schema/migration của `EPIC-02`.
- Thêm backend, cloud sync, desktop hoặc feature `DEFERRED`.
- Khóa deadline/estimate trước khi Task refinement hoàn tất.

## 1. Story convention

Mỗi Story gồm:

- **Story statement:** Actor, nhu cầu và giá trị.
- **Outcome:** Kết quả kiểm thử được khi Story hoàn thành.
- **Dependencies:** Story phải hoàn thành trước.
- **In scope / Out of scope:** Ranh giới tránh scope creep.
- **Acceptance criteria:** Điều kiện bắt buộc để đánh dấu Story hoàn thành.
- **Task checklist sơ bộ:** Khu vực implementation cần tách thành Task chính thức ở bước kế tiếp.
- **Evidence:** Bằng chứng cần lưu trong PR/issue/review.

Checkbox chỉ được đánh dấu `[x]` khi có implementation evidence. Documentation approval không tự hoàn thành Story.

## 2. Story overview và dependency order

Thứ tự mặc định cho solo developer:

- [x] `US-01-01` — Thiết lập reproducible toolchain và pnpm workspace.
- [x] `US-01-02` — Thiết lập shared Domain/Application packages và public API.
- [x] `US-01-03` — Scaffold Expo mobile app và typed route skeleton.
- [x] `US-01-04` — Thiết lập mobile layers và manual composition root.
- [x] `US-01-05` — Tự động enforce architecture boundaries và quality gates.
- [x] `US-01-06` — Thiết lập test foundation cho Domain/Application/Mobile.
- [x] `US-01-07` — Thiết lập EAS delivery baseline và xác minh development builds.

```text
US-01-01 Reproducible Workspace
    ↓
US-01-02 Shared Core Packages
    ↓
US-01-03 Expo Mobile Skeleton
    ↓
US-01-04 Mobile Layers & Composition Root
    ↓
US-01-05 Architecture/Quality Enforcement
    ↓
US-01-06 Test Foundation
    ↓
US-01-07 EAS Delivery & Cross-platform Build Validation
```

## 3. Configuration inputs

Các input dưới chưa được tài liệu Product/Architecture khóa exact value. Chúng không block việc phê duyệt Story breakdown, nhưng phải được resolve tại Story/Task tương ứng trước khi implementation acceptance hoàn tất.

| ID | Input cần resolve | Story owner | Quy tắc |
|---|---|---|---|
| `CONFIG-01` | Exact Node.js 22 LTS patch | `US-01-01` | Phải nằm trong `>=22.13.0 <23.0.0` và được pin bằng `.nvmrc` hoặc `.tool-versions`. |
| `CONFIG-02` | Exact pnpm version | `US-01-01` | Pin bằng root `packageManager`; chỉ một root lockfile. |
| `CONFIG-03` | Exact Expo-compatible package versions | `US-01-03` | Resolve bằng `npx expo install`, giữ Expo SDK 57.x stable. |
| `CONFIG-04` | Test runner/tooling | `US-01-06` | Phải tương thích Expo SDK 57 và giữ test-placement boundary đã duyệt. |
| `CONFIG-05` | iOS bundle identifier và Android application ID | `US-01-07` | Stable, nhất quán giữa app config và EAS profiles; không encode environment vào domain model. |
| `CONFIG-06` | Expo/EAS project/account identifiers và role ownership | `US-01-07` | Dùng least privilege và EAS-managed remote credentials. |

Các input trên là technical configuration, không phải Product decision `OPEN`.

## 4. User Stories

### US-01-01 — Reproducible Toolchain và pnpm Workspace

**Story statement**

> Với vai trò solo developer, tôi muốn repository pin một toolchain và workspace thống nhất để local development, automation và EAS sử dụng cùng dependency graph có thể tái lập.

**Outcome:** Một checkout sạch có thể cài dependency bằng pnpm, nhận đúng Node/pnpm version expectation và chạy root workspace commands mà không tạo lockfile cạnh tranh.

**Dependencies:** Không.

**In scope:**

- Root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` và base TypeScript configuration.
- Pin exact Node patch và pnpm version.
- Workspace discovery cho `apps/*` và `packages/*`.
- Root scripts điều phối workspace typecheck/lint/test/build khi script con đã tồn tại.
- pnpm isolated dependency installation mặc định.

**Out of scope:** Turborepo, Nx, custom task orchestrator, `nodeLinker: hoisted` khi chưa có incompatibility evidence và application feature code.

**Acceptance criteria:**

- [x] `CONFIG-01` được resolve và Node patch được pin bằng `.nvmrc` hoặc `.tool-versions`.
- [x] `CONFIG-02` được resolve và exact pnpm version được pin trong root `packageManager`.
- [x] Root package được đánh dấu private và không publish ngoài chủ đích.
- [x] Workspace nhận diện `apps/mobile`, `packages/domain` và `packages/application`.
- [x] Nội bộ workspace dùng `workspace:*`, không resolve package trùng tên từ public registry.
- [x] Repository chỉ có một `pnpm-lock.yaml`; không có `package-lock.json` hoặc `yarn.lock`.
- [x] Base TypeScript configuration bật strict type checking.
- [x] Fresh dependency installation hoàn tất bằng toolchain đã pin.
- [x] Root commands có stable entry point cho typecheck, lint và test.
- [x] Không thêm task orchestrator/cache layer ngoài baseline.

**Task checklist sơ bộ:**

- [x] Pin Node và pnpm.
- [x] Tạo root workspace/package configuration.
- [x] Tạo base TypeScript configuration.
- [x] Tạo root script contract.
- [x] Sinh và kiểm tra root lockfile.
- [x] Ghi local setup instructions tối thiểu.

**Evidence yêu cầu:**

- Clean-install output thành công.
- Root package/workspace/toolchain files.
- Xác nhận không có lockfile cạnh tranh.

**References:** Project Structure §2.1–2.3; Technical Overview §3.2; ADR-001.

---

### US-01-02 — Shared Domain/Application Packages và Public API

**Story statement**

> Với vai trò solo developer, tôi muốn Domain và shared Application là hai workspace packages có dependency direction rõ ràng để business rules tương lai có thể test độc lập và không bị khóa vào mobile runtime.

**Outcome:** `@pixeldoro/domain` và `@pixeldoro/application` có thể typecheck/build độc lập; Application chỉ phụ thuộc public API của Domain và consumer không thể deep-import source nội bộ.

**Dependencies:** `US-01-01`.

**In scope:**

- Package skeleton cho `packages/domain` và `packages/application`.
- Stable package names, root public exports và TypeScript/package resolution.
- Dependency direction Application → Domain.
- Test-support directories thuộc đúng package nhưng không export runtime.
- Minimal placeholder modules/contracts để chứng minh package graph; không implement gameplay rule.

**Out of scope:** Timer/reward/session implementation, mobile-only ports, SQLite/provider adapters và generic `shared/common/utils` package.

**Acceptance criteria:**

- [x] Domain package có tên `@pixeldoro/domain` và root public API `src/index.ts`.
- [x] Application package có tên `@pixeldoro/application` và root public API `src/index.ts`.
- [x] Application khai báo Domain bằng `workspace:*`.
- [x] Domain không phụ thuộc Application, mobile app, React, Expo, Zustand, SQLite hoặc provider SDK.
- [x] Application không phụ thuộc mobile app, React Native, Expo, Zustand, SQLite hoặc provider SDK.
- [x] Package exports chặn consumer deep-import như `@pixeldoro/domain/src/...`.
- [x] Source trong package dùng relative import hợp lệ; cross-package import dùng public API.
- [x] Hai package typecheck độc lập bằng toolchain đã pin.
- [x] Test fixture/builder/fake skeleton không nằm trong production exports.
- [x] Không tạo package `shared`, `common`, `utils`, `config` hoặc `test-support` chưa có consumer thực tế.

**Task checklist sơ bộ:**

- [x] Tạo Domain package manifest/source/public export.
- [x] Tạo Application package manifest/source/public export.
- [x] Cấu hình TypeScript/package exports.
- [x] Tạo package-local test-support directories.
- [x] Thêm package typecheck commands.
- [x] Thêm minimal import/build smoke check.

**Evidence yêu cầu:**

- Package manifests và public exports.
- Independent typecheck output.
- Negative/deep-import validation được `US-01-05` tự động hóa.

**References:** System Architecture §2–4; Project Structure §2–3 và §5.

---

### US-01-03 — Expo Mobile App và Typed Route Skeleton

**Story statement**

> Với vai trò solo developer, tôi muốn một Expo Development Build app có typed navigation skeleton để các Product Epic sau thêm screen đúng route boundary mà không đặt business logic vào route files.

**Outcome:** Mobile app scaffold theo Expo SDK 57.x có route tree cho toàn bộ primary screen group, boot được bằng development toolchain và route files chỉ compose placeholder screens nằm ngoài `src/app`.

**Dependencies:** `US-01-02`.

**In scope:**

- `apps/mobile` Expo/React Native app.
- Expo SDK 57.x stable, React Native 0.86.x, React 19.2.3, New Architecture và Hermes.
- Expo Router typed routes tại `apps/mobile/src/app`.
- Route groups/skeleton cho onboarding, tabs, Focus, Break và Feedback.
- Placeholder screens/components ngoài route directory.
- Mobile asset directory skeleton và attribution file.
- Reanimated baseline dependency; chưa thêm Skia.

**Out of scope:** Production visual design, navigation business gating, SQLite, Zustand product projection, real Pet asset và feature behavior.

**Acceptance criteria:**

- [x] `CONFIG-03` được resolve bằng `npx expo install` với stable Expo-compatible packages.
- [x] Expo SDK giữ ở dòng 57.x; React Native/React khớp approved compatibility baseline.
- [x] New Architecture và Hermes được bật theo baseline.
- [x] Expo Router typed routes được cấu hình tại `apps/mobile/src/app`.
- [x] Route skeleton tồn tại cho Onboarding, Home, History, Settings, Shop, Focus Setup/Session/Result, Break Session và Feedback.
- [x] Route/layout files chỉ default-export composition component.
- [x] Screen/component code nằm ngoài route directory.
- [x] Route files không import Domain, Infrastructure, repository hoặc provider SDK.
- [x] Mobile app chỉ dùng public exports của shared packages.
- [x] Asset skeleton có `sprites`, `audio`, `fonts` và `ATTRIBUTIONS.md`.
- [x] Reanimated là animation baseline; Skia không được cài.
- [x] Placeholder UI có readable text và basic accessibility label; không phụ thuộc sprite.

**Task checklist sơ bộ:**

- [x] Scaffold Expo mobile workspace.
- [x] Cài package bằng `npx expo install` và commit lockfile change.
- [x] Cấu hình typed Expo Router.
- [x] Tạo route groups và placeholder screens.
- [x] Tạo mobile asset directory skeleton.
- [x] Thiết lập Reanimated baseline.
- [x] Chạy mobile start/typecheck smoke check.

**Evidence yêu cầu:**

- Dependency versions/lockfile.
- Route tree và placeholder screenshots hoặc smoke-test output.
- Expo diagnostic output không có compatibility error blocking.

**References:** Technical Overview §3; Project Structure §4 và §8; ADR-001, ADR-002, ADR-005.

---

### US-01-04 — Mobile Layers và Manual Composition Root

**Story statement**

> Với vai trò solo developer, tôi muốn mobile code có Presentation, Mobile Application, Infrastructure và Composition boundaries rõ ràng để các feature tương lai nhận dependency qua một composition root thay vì khởi tạo SDK/repository trong screen hoặc store.

**Outcome:** Mobile dependency graph có manual composition root và application context/facade; placeholder Presentation có thể gọi một injected application boundary mà không import concrete Infrastructure.

**Dependencies:** `US-01-03`.

**In scope:**

- `src/application`, `src/composition`, `src/presentation`, `src/infrastructure` module skeleton.
- Mobile-only Application ports theo capability đã duyệt.
- Manual dependency injection và application-scoped lifecycle.
- Application context/provider/facade boundary cho Presentation.
- Bootstrap readiness/recovery projection skeleton.
- Lifecycle subscription ownership và cleanup contract.
- Fakes/no-op adapters đủ để verify wiring trước `EPIC-02`.

**Out of scope:** Concrete SQLite schema/repository, real PostHog/feedback integration, session reconciliation và DI container/service locator.

**Acceptance criteria:**

- [x] Mobile layer directories khớp Project Structure baseline.
- [x] Mobile-only Application không import Presentation, Infrastructure, React Native, Expo, Zustand, SQLite hoặc provider SDK.
- [x] Infrastructure triển khai Application-owned placeholder ports và không chứa business rules.
- [x] Presentation chỉ nhận application facade/context và không import Infrastructure.
- [x] `create-mobile-application` hoặc equivalent là nơi duy nhất khởi tạo concrete graph.
- [x] Dependency được truyền tường minh; không có service locator/global mutable container.
- [x] Application-scoped dependency không được khởi tạo lại theo screen render.
- [x] Lifecycle subscription chỉ đăng ký một lần cho graph và có cleanup/dispose contract.
- [x] Presentation có bootstrap/loading/recovery readiness boundary trước core command.
- [x] Placeholder dependency graph có thể boot/dispose trong automated smoke test.
- [x] Database/provider capability chưa có implementation thật dùng fake/no-op adapter rõ ràng, không invent product truth.

**Task checklist sơ bộ:**

- [x] Tạo mobile Application port/module skeleton.
- [x] Tạo Presentation module/context boundary.
- [x] Tạo Infrastructure adapter skeleton/fakes.
- [x] Tạo manual composition-root factory.
- [x] Tạo bootstrap readiness model.
- [x] Tạo lifecycle registration/dispose contract.
- [x] Thêm composition smoke test.

**Evidence yêu cầu:**

- Dependency graph/module tree.
- Composition boot/dispose test output.
- Review chứng minh screen không trực tiếp biết concrete adapter.

**References:** System Architecture §2–5 và §7; Project Structure §4–5; ADR-004.

---

### US-01-05 — Architecture Boundary và Quality-gate Enforcement

**Story statement**

> Với vai trò solo developer, tôi muốn architecture rules được tự động kiểm tra để một thay đổi sai dependency direction bị phát hiện trước khi trở thành implementation baseline.

**Outcome:** Một root quality command kiểm tra type/lint/import boundaries; deliberate forbidden-import fixtures hoặc validation cases thất bại như mong đợi.

**Dependencies:** `US-01-04`.

**In scope:**

- TypeScript package/project resolution.
- ESLint restricted-import rules phản ánh dependency matrix.
- Package exports/dependency graph enforcement.
- Root quality command và machine-readable exit code.
- Negative validation cho các boundary rủi ro cao.
- Quality command sẵn sàng được EAS Workflow gọi ở `US-01-07`.

**Out of scope:** Dependency-cruiser, Nx architecture plugin, custom graph framework và provider-specific code quality rules chưa có implementation.

**Acceptance criteria:**

- [x] Root quality command chạy typecheck và lint cho toàn workspace.
- [x] Domain import Application/mobile/React/Expo/Zustand/SQLite/provider SDK bị fail.
- [x] Shared Application import mobile/React Native/Expo/Zustand/SQLite/provider SDK bị fail.
- [x] Mobile Application import Presentation/Infrastructure/Expo/provider SDK bị fail.
- [x] Mobile Presentation import Domain trực tiếp, Infrastructure, SQL hoặc provider SDK bị fail.
- [x] Expo route import Domain/Infrastructure/repository/provider SDK bị fail.
- [x] Cross-package deep import ngoài public exports bị fail.
- [x] Production source import test support bị fail hoặc không resolve.
- [x] Hợp lệ Presentation → Application và Infrastructure → Application-port vẫn typecheck.
- [x] Quality command trả exit code khác 0 khi có deliberate violation.
- [x] Không thêm architecture-analysis framework ngoài baseline khi ESLint/TypeScript đủ biểu diễn rule.

**Task checklist sơ bộ:**

- [x] Cấu hình TypeScript workspace/package resolution.
- [x] Cấu hình ESLint restricted imports theo dependency matrix.
- [x] Tạo root quality command.
- [x] Tạo negative boundary validation cases.
- [x] Ghi hướng dẫn xử lý boundary exception qua review/ADR.

**Evidence yêu cầu:**

- Successful quality output trên source hợp lệ.
- Expected-failure output cho deliberate violation.
- Mapping rule configuration về Project Structure dependency matrix.

**References:** Project Structure §5; System Architecture §3; Technical Overview §4.1.

---

### US-01-06 — Test Foundation cho Domain, Application và Mobile

**Story statement**

> Với vai trò solo developer, tôi muốn test foundation deterministic theo từng layer để các Epic sau có thể thêm unit, integration và device evidence đúng ownership mà không kéo mobile runtime vào Domain.

**Outcome:** Test commands, directory conventions, representative smoke tests và fake boundaries chạy được từ root workspace theo structure đã duyệt.

**Dependencies:** `US-01-05`.

**In scope:**

- Resolve test runner/tooling tương thích Expo SDK 57.
- Colocated unit-test convention.
- Package-local fixtures/builders/fakes.
- Mobile integration/device test directories.
- Fake Clock/ID/Application-port examples.
- Provider/platform mock boundary example.
- Root test command và coverage/report baseline nếu tooling hỗ trợ ổn định.

**Out of scope:** Full Timer/Session test matrix, product UI snapshot suite và generic shared test-support package.

**Acceptance criteria:**

- [x] `CONFIG-04` được resolve và ghi rõ compatibility rationale.
- [x] Unit test colocate cạnh source bằng `<basename>.test.ts[x]`.
- [x] Domain test chạy không cần React Native/Expo runtime.
- [x] Application test có thể dùng deterministic fake Clock/ID/port.
- [x] Package reusable test support nằm trong package owner `test/` và không export runtime.
- [x] Mobile integration tests nằm trong `apps/mobile/test/integration`.
- [x] Device/simulator test harness hoặc command boundary nằm trong `apps/mobile/test/device`.
- [x] Provider SDK mock chỉ nằm ở mobile test boundary.
- [x] Root test command chạy test của Domain, Application và Mobile foundation.
- [x] Ít nhất một representative passing smoke test tồn tại cho mỗi workspace.
- [x] Quality/import checks ngăn production source phụ thuộc test support.
- [x] Không tạo `packages/test-support` khi chưa có ít nhất hai package consumers thực tế.

**Task checklist sơ bộ:**

- [x] Chọn và cấu hình compatible test tooling.
- [x] Tạo colocated unit smoke tests.
- [x] Tạo package fixtures/builders/fakes skeleton.
- [x] Tạo mobile integration/device directory và command.
- [x] Tạo fake Clock/ID/port examples.
- [x] Kết nối root test command.
- [x] Document test placement và command usage.

**Evidence yêu cầu:**

- Root test output thành công.
- Một Domain test không load mobile runtime.
- Một composition/mobile integration smoke test.
- Test directory/public-export review.

**References:** Project Structure §7; Technical Overview §10.4; System Architecture §2–7.

---

### US-01-07 — EAS Delivery Baseline và Development-build Validation

**Story statement**

> Với vai trò solo developer, tôi muốn một EAS delivery baseline có runtime/channel/credential boundary rõ ràng để tạo và kiểm thử development/preview/production-compatible artifacts trên iOS và Android mà không commit signing secrets.

**Outcome:** EAS configuration và workflow quality gates tồn tại; development build boot/smoke test thành công trên ít nhất một iOS và một Android target; OTA/native boundary và rollback path được ghi rõ.

**Dependencies:** `US-01-06`.

**In scope:**

- Resolve app identifiers, EAS project/account identifiers và role ownership.
- `app.config.ts`, `eas.json` và EAS Workflow baseline.
- Development, preview và production build/update channels.
- `runtimeVersion` policy `appVersion`.
- EAS-managed remote credentials và secret hygiene.
- Quality gates trước build/update.
- iOS/Android development-build smoke test.
- Preview-before-production update policy và rollback/republish procedure.
- EAS Submit profile boundary; không đồng nghĩa public release.

**Out of scope:** Public store release, real production submission approval, paid-service budget change, feature acceptance và native capability chưa thuộc foundation.

**Acceptance criteria:**

- [x] `CONFIG-05` được resolve và app identifiers ổn định trong app/EAS configuration.
- [x] `CONFIG-06` được resolve với least-privilege owner/role phù hợp.
- [x] `app.config.ts` và `eas.json` có development, preview và production profiles rõ ràng.
- [x] Update channels `development`, `preview`, `production` được tách.
- [x] `runtimeVersion` dùng `appVersion` policy.
- [x] Native dependency/Expo SDK/permission/config-plugin change được document là binary-build requirement.
- [x] Production OTA chỉ cho JavaScript, styling và bundled assets tương thích runtime.
- [x] EAS Workflow gọi quality/test gates trước build/update job.
- [x] Signing credentials dùng EAS-managed remote source và không nằm trong repository.
- [x] iOS development build boot và route smoke test thành công trên một target phù hợp.
- [x] Android development build boot và route smoke test thành công trên một target phù hợp.
- [x] Preview validation với cùng runtime là điều kiện trước production update.
- [x] Rollback/republish stable update procedure được ghi và có thể diễn tập khi artifact phù hợp.
- [x] EAS Submit được mô tả là upload step, không phải bằng chứng app đã public.
- [x] Skia không được thêm chỉ để hoàn tất build foundation.

**Task checklist sơ bộ:**

- [x] Resolve app/EAS identifiers và permission ownership.
- [x] Cấu hình app version/runtime policy.
- [x] Tạo EAS build/submit/update profiles.
- [x] Tạo EAS quality/build workflow.
- [x] Thiết lập EAS-managed remote credentials.
- [x] Tạo iOS development build và chạy smoke test.
- [x] Tạo Android development build và chạy smoke test.
- [x] Ghi preview/promotion/rollback procedure.
- [x] Kiểm tra repository không chứa signing secret.

**Evidence yêu cầu:**

- EAS configuration/workflow files.
- Successful iOS/Android development-build references và smoke-test result.
- Quality-gate run result.
- Secret scan/repository review.
- Delivery/rollback runbook.

**References:** Technical Overview §10.5; ADR-001, ADR-005, ADR-007.

## 5. EPIC-01 traceability

| EPIC-01 completion criterion | Story owner |
|---|---|
| Workspace layout và dependency direction | `US-01-01`, `US-01-02`, `US-01-04` |
| Root typecheck/lint/test commands | `US-01-01`, `US-01-05`, `US-01-06` |
| Forbidden imports bị automation phát hiện | `US-01-05` |
| Development build chạy iOS/Android | `US-01-07` |
| Composition root là concrete graph owner duy nhất | `US-01-04`, `US-01-05` |
| Route files chỉ composition | `US-01-03`, `US-01-05` |
| Development/preview/production delivery boundary | `US-01-07` |
| Native change không phát hành nhầm chỉ bằng OTA | `US-01-07` |
| Signing secret không commit | `US-01-07` |
| Skia không có trong baseline | `US-01-03`, `US-01-07` |

## 6. Definition of Ready trước khi tạo Task

Một Story đủ điều kiện chia thành Task khi:

- [x] Story statement, outcome và dependency đã được Dũng Lư review.
- [x] In-scope/out-of-scope không mâu thuẫn Epic hoặc baseline.
- [x] Configuration input thuộc Story đã có owner và cách resolve.
- [x] Acceptance criteria có thể kiểm thử bằng output/file/build/evidence cụ thể.
- [x] Không có Product decision `OPEN` bị chốt trong Story.
- [x] Task có thể chia theo implementation responsibility mà không tạo business rule mới.

## 7. Definition of Story Done

Một Story chỉ được đánh dấu `[x]` khi:

- [x] Tất cả acceptance criteria bắt buộc đã đạt.
- [x] Task chính thức của Story đã hoàn thành hoặc được loại qua review có chủ đích.
- [x] Root quality/test commands liên quan pass.
- [x] Evidence yêu cầu được gắn vào PR/issue/review record.
- [x] Không có secret, generated credential hoặc forbidden dependency trong repository.
- [x] Không kéo implementation của Epic sau vào Story ngoài minimal fake/skeleton đã nêu.
- [x] Documentation/ADR được cập nhật nếu implementation tạo technical decision mới.

## 8. Review checklist

- [x] Bảy Story cover đủ toàn bộ completion criteria của `EPIC-01`.
- [x] Story order phù hợp dependency và giới hạn một active Epic/Story cho solo developer.
- [x] Không có Product `OPEN-001`, `OPEN-006`, `OPEN-009` bị chốt ngầm.
- [x] Không có Timer/Session/Pet/Gamification business behavior lọt vào Epic foundation.
- [x] Không có backend, cloud sync, desktop hoặc scope `DEFERRED`.
- [x] Configuration input chưa khóa đã được ghi owner thay vì invent value.
- [x] Dũng Lư review và phê duyệt Story breakdown trước khi tạo Task IDs.

## 9. Change log

### 1.0.0 — 2026-08-27

- Dũng Lư duyệt Story breakdown với vai trò Product Owner/Tech Lead và khóa tài liệu
  làm planning baseline cho implementation.
- Xác nhận `US-01-01` đến `US-01-07` đã đạt Definition of Story Done theo
  `EPIC-01_IMPLEMENTATION_EVIDENCE.md`.
- Chấp nhận implementation/evidence record hiện có thay cho việc tạo Task ID hồi tố;
  không mở rộng scope chỉ để tái tạo planning ceremony sau khi code đã hoàn tất.
- Giữ EAS preview validation và rollback rehearsal làm pre-production gate, không phải
  blocker của Epic 1 khi chưa publish production OTA.

### 0.1.0 — 2026-08-27

- Tạo breakdown đầu tiên cho `EPIC-01` thành bảy Enabler Story theo dependency order.
- Bổ sung story statement, outcome, scope, acceptance criteria, task checklist sơ bộ và evidence cho từng Story.
- Bổ sung configuration-input register cho exact toolchain, package, test, app và EAS identifiers.
- Mapping toàn bộ EPIC-01 completion criteria về Story owner.
- Giữ Product decision đang `OPEN`, business behavior và các Epic sau ngoài phạm vi.
