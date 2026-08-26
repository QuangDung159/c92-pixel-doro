---
document_id: PIXELDORO_PROJECT_STRUCTURE
title: PixelDoro Mobile MVP — Project Structure
version: 1.0.0
status: APPROVED
last_updated: 2026-08-26
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
approved_by: Dũng Lư
approver_role: Tech Lead
approved_at: 2026-08-26
language: vi
scope:
  - mobile_mvp
  - workspace_layout
  - source_organization
authority: SECONDARY
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ./technical-overview.md
architecture_baseline: ./system-architecture.md
---

# PixelDoro Mobile MVP — Project Structure

## 0. Vai trò và phạm vi tài liệu

Tài liệu này chi tiết hóa cách tổ chức repository cho PixelDoro Mobile MVP từ:

- [Product Core — Single Source of Truth](../PIXELDORO_CORE_TRUTH.md).
- [Technical Overview 1.0.0](./technical-overview.md) đã `APPROVED`.
- [System Architecture 1.0.0](./system-architecture.md) đã `APPROVED`.
- ADR-001 đến ADR-008 trong [`decisions/`](./decisions/).

Tài liệu xác định:

- Cấu trúc `apps/`, `packages/` và `docs/`.
- Trách nhiệm của từng package, module và thư mục.
- Import boundary giữa Presentation, Application, Domain, Infrastructure và Composition Root.
- Naming cho file, component, hook, store, use case, port, repository và adapter.
- Vị trí của unit test, integration test, device test, fixture, fake và mock.
- Vị trí và naming của sprite, audio và font được bundle trong ứng dụng.
- Một ví dụ thêm feature mới mà không phá vỡ kiến trúc đã duyệt.

Tài liệu này không quyết định lại technology stack, product rule, timer semantics, session lifecycle, Pet behavior, reward formula hoặc database schema. Nếu có mâu thuẫn, Product Core được ưu tiên về sản phẩm; Technical Overview 1.0.0, System Architecture 1.0.0 và ADR đã duyệt được ưu tiên về baseline kỹ thuật.

### 0.1. Trạng thái quyết định

| Trạng thái | Ý nghĩa |
|---|---|
| `BASELINE` | Đã được Product Core, Technical Overview, System Architecture hoặc ADR khóa/chấp nhận. |
| `PROPOSED` | Đề xuất trong bản draft này; chưa trở thành requirement cho tới khi Tech Lead xác nhận. |
| `RESOLVED` | Đã được Tech Lead chốt trong tài liệu này. |
| `OPEN` | Chưa quyết định; không được tự suy diễn thành requirement. |
| `DEFERRED` | Không thuộc Mobile MVP. |

Các layout và convention trong phiên bản hiện tại đã được giải quyết qua `PS-OPEN-001` đến `PS-OPEN-008`. Trạng thái `PROPOSED` chỉ còn dùng cho lịch sử thay đổi hoặc đề xuất tương lai chưa được Tech Lead xác nhận.

## 1. Nguyên tắc tổ chức

Các nguyên tắc sau kế thừa trực tiếp từ baseline và có trạng thái `BASELINE`:

1. Domain là TypeScript thuần và không import React, React Native, Expo, Zustand, SQLite hoặc UI framework.
2. Application sở hữu use case, application result/projection và I/O port; Application chỉ phụ thuộc Domain.
3. Infrastructure triển khai port do Application sở hữu và được phép dùng Domain type khi mapping cần thiết.
4. Presentation chỉ gọi Application boundary; route, screen, component, hook và Zustand store không gọi SQLite hoặc provider/platform SDK trực tiếp.
5. Composition Root là nơi duy nhất biết concrete implementation của toàn dependency graph và dùng manual dependency injection.
6. SQLite là nguồn sự thật bền vững; Zustand chỉ giữ projection có thể hydrate/dựng lại và UI state tạm thời.
7. Route file chỉ làm route/layout composition; URL tree không được dùng thay cho domain boundary.
8. Mobile-specific code không được đưa vào shared core chỉ để chuẩn bị cho desktop hoặc backend đang `DEFERRED`.
9. Không tạo abstraction, package hoặc thư mục `shared`/`common` chung chung khi chưa có trách nhiệm và owner rõ ràng.

## 2. Workspace layout đề xuất

### 2.1. Cấu trúc cấp cao — `PS-OPEN-001` (`RESOLVED`)

Quyết định được Tech Lead Dũng Lư chốt ngày 2026-08-26: dùng workspace với hai shared core package `domain` và `application`.

```text
pixel-doro/
├── apps/
│   └── mobile/
├── packages/
│   ├── domain/
│   └── application/
├── docs/
│   ├── architecture/
│   │   ├── decisions/
│   │   ├── data-model.md
│   │   ├── project-structure.md
│   │   ├── system-architecture.md
│   │   └── technical-overview.md
│   ├── specifications/
│   │   ├── gamification-rules.md
│   │   ├── pet-state-machine.md
│   │   ├── session-lifecycle.md
│   │   └── timer-engine.md
│   ├── PIXELDORO_CORE_TRUTH.md
│   └── TECHNICAL_DOCUMENTATION_CHECKLIST.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
└── <root-tooling-config>
```

Không tạo package riêng cho UI kit, config, test support hoặc từng feature trong baseline ban đầu. Chỉ tách package mới khi có ít nhất một consumer thực tế, boundary ổn định và lợi ích lớn hơn chi phí package manifest, public API, dependency graph và test configuration.

### 2.2. Trách nhiệm cấp cao

| Vị trí | Trách nhiệm | Không được chứa |
|---|---|---|
| `apps/mobile` | Expo Router, React Native Presentation, Zustand projection/controller, mobile Infrastructure, asset và Composition Root | Product rule bị nhân đôi; shared core rule chỉ dùng được trên mobile |
| `packages/domain` | Entity, value object, policy, transition và domain result thuần TypeScript | I/O port, SQL, React, Expo, Zustand, clock/global ID access |
| `packages/application` | Use case dùng chung, command/query, DTO, projection, typed result, coordinator và platform-neutral Application-owned port | SQL, Expo/native/provider SDK, Zustand, UI copy, flow chỉ tồn tại trên mobile |
| `docs/architecture` | Baseline kiến trúc, project structure, data model và ADR | Implementation source code |
| `docs/specifications` | Đặc tả timer, session, Pet và gamification | Quyết định âm thầm thay đổi Product Core/baseline |

### 2.3. Workspace tooling — `PS-OPEN-002` (`RESOLVED`)

Quyết định được Tech Lead Dũng Lư chốt ngày 2026-08-26:

- Dùng `pnpm` workspace và duy nhất một `pnpm-lock.yaml` ở repository root.
- Pin exact pnpm version bằng field `packageManager` trong root `package.json` để local, CI và EAS dùng cùng toolchain.
- Workspace package nội bộ dùng protocol `workspace:*`; không resolve package trùng tên từ public registry.
- Không commit `package-lock.json`, `yarn.lock` hoặc lockfile của package manager khác.
- Chưa thêm Turborepo hoặc task orchestrator/cache layer trong Mobile MVP. Root scripts chỉ điều phối typecheck, lint và test tới workspace cần thiết.
- Giữ isolated dependency installation mặc định của pnpm. Chỉ chuyển `nodeLinker: hoisted` sau khi xác nhận một Expo/native dependency thực tế không tương thích, đồng thời ghi lý do và chạy lại acceptance test liên quan.

Lý do: pnpm hỗ trợ workspace, dependency isolation và một dependency graph rõ ràng với chi phí vận hành phù hợp quy mô ba workspace. Không thêm Turborepo vì lợi ích cache/orchestration chưa bù được config và debugging overhead ở giai đoạn MVP.

## 3. Shared core packages

### 3.1. `packages/domain` — `RESOLVED`

```text
packages/domain/
├── src/
│   ├── session/
│   │   ├── focus-session.ts
│   │   ├── session-mode.ts
│   │   ├── session-status.ts
│   │   └── resolve-session.ts
│   ├── reward/
│   │   ├── reward-decision.ts
│   │   └── reward-policy.ts
│   ├── pet/
│   │   └── derive-pet-state.ts
│   ├── inventory/
│   ├── settings/
│   └── index.ts
├── test/
│   ├── fixtures/
│   └── builders/
├── package.json
└── tsconfig.json
```

Quy tắc:

- Module được nhóm theo product capability, không theo loại kỹ thuật chung chung như `models/`, `helpers/` hoặc `utils/`.
- Một rule chỉ được thêm khi Product Core hoặc specification tương ứng đã chốt.
- Domain nhận `now`, ID và external facts qua input value; không tự đọc global clock, random generator hoặc platform state.
- `src/index.ts` là public API duy nhất của package. Consumer không import đường dẫn sâu vào nội bộ package.
- Danh sách file trong cây là ví dụ tổ chức, không tự chốt các rule đang `OPEN` trong Product Core.

### 3.2. `packages/application` — `RESOLVED`

```text
packages/application/
├── src/
│   ├── session/
│   │   ├── start-focus.use-case.ts
│   │   ├── cancel-session.use-case.ts
│   │   ├── reconcile-active-session.use-case.ts
│   │   ├── session-command-coordinator.ts
│   │   └── session.projection.ts
│   ├── history/
│   │   ├── list-focus-history.use-case.ts
│   │   └── focus-history.projection.ts
│   ├── reward/
│   ├── inventory/
│   ├── ports/
│   │   ├── clock.port.ts
│   │   ├── focus-session.repository.ts
│   │   ├── id.port.ts
│   │   └── transaction.port.ts
│   ├── result/
│   │   └── application-result.ts
│   └── index.ts
├── test/
│   ├── fakes/
│   ├── fixtures/
│   └── builders/
├── package.json
└── tsconfig.json
```

Quy tắc:

- Command/use case thay đổi Focus/Break session phải đi qua `SessionCommandCoordinator` đã được System Architecture chốt.
- I/O port dùng chung thuộc shared Application; port chỉ phục vụ mobile thuộc Mobile-only Application. Port không đặt trong Domain hoặc Infrastructure.
- Use case trả application-owned DTO/projection và typed result; không trả SQLite row, provider object hoặc mutable Domain entity cho Presentation.
- UI copy và localization không nằm trong Application; Presentation map stable error code sang nội dung hiển thị.
- Application không import Zustand và không mutate store.
- Package này không chứa Expo lifecycle type, native notification, store review hoặc provider-specific capability. Desktop tương lai có thể dùng package mà không kéo mobile runtime vào dependency graph.

## 4. `apps/mobile` layout

### 4.1. Cấu trúc mobile — `PS-OPEN-003` (`RESOLVED`)

Quyết định được Tech Lead Dũng Lư chốt ngày 2026-08-26:

- Dùng cấu trúc hybrid: giữ layer boundary ở cấp thư mục lớn, sau đó nhóm Presentation theo feature và Infrastructure theo capability/provider.
- Theo convention chính thức của Expo SDK 55+, route nằm trong `src/app`; không đổi sang custom router root.
- Tách Mobile-only Application khỏi shared Application để mobile-specific orchestration không làm bẩn core có thể tái sử dụng cho desktop.

```text
apps/mobile/
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── (onboarding)/
│   │   │   └── index.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── history.tsx
│   │   │   ├── settings.tsx
│   │   │   └── shop.tsx
│   │   ├── focus/
│   │   │   ├── setup.tsx
│   │   │   ├── session.tsx
│   │   │   └── result.tsx
│   │   ├── break/
│   │   │   └── session.tsx
│   │   └── feedback/
│   │       └── index.tsx
│   ├── application/
│   │   ├── lifecycle/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   ├── audio/
│   │   ├── haptics/
│   │   ├── feedback/
│   │   ├── store-review/
│   │   ├── ports/
│   │   │   ├── app-lifecycle.port.ts
│   │   │   ├── analytics.port.ts
│   │   │   ├── audio.port.ts
│   │   │   ├── feedback.port.ts
│   │   │   ├── haptic.port.ts
│   │   │   ├── notification.port.ts
│   │   │   └── store-review.port.ts
│   │   └── index.ts
│   ├── composition/
│   │   ├── create-mobile-application.ts
│   │   ├── mobile-application.ts
│   │   └── mobile-application-context.tsx
│   ├── presentation/
│   │   ├── features/
│   │   │   ├── onboarding/
│   │   │   ├── home/
│   │   │   ├── focus/
│   │   │   ├── break/
│   │   │   ├── history/
│   │   │   ├── shop/
│   │   │   ├── settings/
│   │   │   └── feedback/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── theme/
│   │   └── assets/
│   └── infrastructure/
│       ├── database/
│       │   ├── migrations/
│       │   ├── mappers/
│       │   ├── repositories/
│       │   └── sqlite-transaction.ts
│       ├── platform/
│       │   ├── app-lifecycle/
│       │   ├── audio/
│       │   ├── clock/
│       │   ├── haptics/
│       │   ├── notifications/
│       │   └── store-review/
│       └── providers/
│           ├── analytics/
│           └── feedback/
├── assets/
│   ├── sprites/
│   ├── audio/
│   └── fonts/
├── test/
│   ├── integration/
│   ├── device/
│   ├── fixtures/
│   ├── fakes/
│   └── mocks/
├── app.config.ts
├── eas.json
├── package.json
└── tsconfig.json
```

Route tree trên minh họa cách composition các screen đã nằm trong Mobile MVP. Tên route group và URL cụ thể có thể được tinh chỉnh khi triển khai navigation, nhưng các rule `src/app` chỉ chứa route/layout và không dùng custom router root đã được chốt.

### 4.2. Trách nhiệm module mobile

| Thư mục | Trách nhiệm | Boundary chính |
|---|---|---|
| `src/app/` | Expo Router route/layout, đọc route parameter và composition screen | Không business rule, SQL, SDK call hoặc Zustand implementation |
| `src/application/` | Use case, orchestration và port chỉ tồn tại trên mobile: lifecycle, notification, analytics, feedback, audio, haptic và native store review | Không import Expo/native/provider SDK, SQL, Zustand hoặc UI; không nhân đôi shared core rule |
| `src/composition/` | Khởi tạo database/adapters/use cases/store, chạy migration và startup reconciliation, đăng ký lifecycle một lần | Nơi duy nhất import toàn bộ concrete graph |
| `src/presentation/features/` | Screen, feature-local component/hook/store selector và mapping application result sang UX | Chỉ gọi Application boundary |
| `src/presentation/components/` | UI primitive dùng bởi ít nhất hai feature | Không chứa product/session/reward rule |
| `src/presentation/hooks/` | Hook trình bày dùng bởi nhiều feature | Không gọi Infrastructure trực tiếp |
| `src/presentation/stores/` | Zustand projection/controller cấp ứng dụng | Không giữ durable truth hoặc tự triển khai business rule |
| `src/presentation/theme/` | Token màu, spacing, typography và reduced-motion presentation policy | Không chứa asset/provider access |
| `src/presentation/assets/` | Typed catalog dùng static import cho bundled asset | Không chứa binary asset; binary nằm trong `assets/` |
| `src/infrastructure/database/` | SQLite connection, migration, mapper, repository và transaction implementation | SQL chỉ tồn tại tại đây |
| `src/infrastructure/platform/` | Adapter cho Expo/native capability | Không thay đổi business rule |
| `src/infrastructure/providers/` | Adapter cho PostHog/feedback provider, sanitize và provider error mapping | Không rò SDK type ra Application/Presentation |
| `assets/` | Sprite, audio và font được bundle local | Không chứa remote-only core asset |
| `test/` | Integration/device suite và mobile test support | Không trở thành runtime dependency |

### 4.3. Feature-local Presentation

Một feature Presentation có thể dùng cấu trúc sau:

```text
src/presentation/features/focus/
├── components/
│   ├── focus-countdown.tsx
│   └── focus-mode-selector.tsx
├── hooks/
│   └── use-focus-session.ts
├── screens/
│   ├── focus-setup-screen.tsx
│   └── focus-session-screen.tsx
├── focus.copy.ts
└── index.ts
```

Quy tắc promote:

- Component/hook bắt đầu trong feature sở hữu nó.
- Chỉ chuyển sang `presentation/components` hoặc `presentation/hooks` sau khi có ít nhất hai consumer thật và API đã đủ ổn định.
- Không tạo `utils/`, `common/` hoặc `shared/` để bỏ code chưa rõ owner.
- Feature folder trong Presentation là boundary về ownership UI, không thay thế Domain/Application module.

## 5. Import boundaries — `PS-OPEN-004` (`RESOLVED`)

Quyết định được Tech Lead Dũng Lư chốt ngày 2026-08-26: enforce dependency direction bằng workspace dependency, package public exports, TypeScript package resolution và ESLint boundary rules. Không dùng deep import xuyên package/feature và chưa thêm dependency-analysis framework riêng trong Mobile MVP.

### 5.1. Dependency matrix

| Importer | Được import | Bị cấm |
|---|---|---|
| `packages/domain` | Standard TypeScript và module Domain khác qua public/internal path hợp lệ | Application, mobile app, React, Expo, Zustand, SQLite, provider SDK |
| `packages/application` | `@pixeldoro/domain`, module shared Application | `apps/mobile`, React Native, Expo, Zustand, SQLite/provider SDK, mobile-only flow |
| Mobile Application | Public API của `@pixeldoro/application` và `@pixeldoro/domain` khi cần product type; module Mobile Application | Presentation, Infrastructure, React Native, Expo, Zustand, SQLite/provider SDK |
| Mobile Presentation | Public API của shared/Mobile Application, Presentation module | `@pixeldoro/domain` trực tiếp, mobile Infrastructure, SQL, Expo/provider SDK trực tiếp |
| Mobile Infrastructure | Public API/port của shared/Mobile Application; Domain type khi mapper thực sự cần | Presentation, route file, Zustand store, business rule mới |
| Mobile Composition Root | Domain, shared/Mobile Application, Infrastructure và Presentation provider/controller | Không đặt product rule hoặc SQL tại đây |
| Expo route | Screen/layout export và composition context tối thiểu | Domain, Infrastructure, repository, provider SDK, business rule |
| Test code | Public API của subject; internal path chỉ khi test được colocate trong cùng module | Import test support vào production source |

### 5.2. Public API và đường dẫn import

Quy tắc được chốt:

- Workspace package dùng tên `@pixeldoro/domain` và `@pixeldoro/application`.
- Mobile-only Application dùng alias nội bộ của app và không được export như một shared workspace package.
- Consumer bên ngoài package chỉ import từ public `exports`; cấm deep import như `@pixeldoro/domain/src/session/...`.
- Mỗi package có một root `src/index.ts`; chỉ thêm subpath export khi root API trở nên quá lớn hoặc có boundary ổn định.
- Feature Presentation có `index.ts` nhỏ để route hoặc feature khác import public screen/component. Không tạo barrel xuyên toàn bộ app.
- Import trong cùng module dùng relative path; import qua module/package boundary dùng alias/public export.
- Không import file từ feature khác bằng đường dẫn sâu. Code thực sự dùng chung phải được promote có chủ đích.

### 5.3. Enforcement

Boundary được enforce bằng các lớp sau:

1. Workspace dependency trong từng `package.json` để package graph không có dependency ngược.
2. Package `exports` để consumer bên ngoài chỉ truy cập public API, không deep-import source nội bộ.
3. TypeScript project/reference hoặc package resolution để source chỉ thấy package và symbol hợp lệ.
4. ESLint `no-restricted-imports` để kiểm tra architecture boundary trong local lint và CI.

Không chỉ dựa vào code review cho rule có thể kiểm tra tự động. Baseline chưa dùng dependency-cruiser, Nx, custom graph framework hoặc plugin kiến trúc chuyên biệt. Chỉ xem xét thêm công cụ khi rule hiện tại không biểu diễn được boundary thực tế hoặc vi phạm lặp lại tạo chi phí đo được; thay đổi phải qua Tech Lead review.

## 6. Naming conventions — `PS-OPEN-005` (`RESOLVED`)

Quyết định được Tech Lead Dũng Lư chốt ngày 2026-08-26. Convention dưới đây bám quy tắc của React, TypeScript và Expo Router; phần không được framework quy định là convention thống nhất riêng của PixelDoro.

### 6.1. Source file và symbol

| Loại | File naming | Export naming | Ví dụ |
|---|---|---|---|
| Source file chung | `kebab-case.ts` / `kebab-case.tsx` | Theo loại symbol | `application-result.ts` |
| React component/screen | `kebab-case.tsx` | `PascalCase` | `focus-session-screen.tsx` → `FocusSessionScreen` |
| Hook | `use-<name>.ts` | `use<Name>` | `use-focus-session.ts` → `useFocusSession` |
| Zustand store | `<scope>.store.ts` | `create<Scope>Store`, `use<Scope>Store` | `session.store.ts` |
| Use case | `<verb>-<noun>.use-case.ts` | `<Verb><Noun>UseCase` hoặc factory cùng tên | `start-focus.use-case.ts` |
| Port | `<capability>.port.ts` | `<Capability>Port` | `notification.port.ts` |
| Repository port | `<entity>.repository.ts` | `<Entity>Repository` | `focus-session.repository.ts` |
| Adapter | `<provider-or-platform>-<capability>.adapter.ts` | `<ProviderOrPlatform><Capability>Adapter` | `expo-notification.adapter.ts` |
| SQLite implementation | `sqlite-<entity>.repository.ts` | `SQLite<Entity>Repository` | `sqlite-focus-session.repository.ts` |
| Mapper | `<source>-<target>.mapper.ts` | Function cụ thể | `focus-session-row.mapper.ts` |
| Projection/DTO | `<subject>.projection.ts` / `<subject>.dto.ts` | `PascalCase` | `session.projection.ts` |
| Test | Cùng basename + `.test.ts[x]` | — | `resolve-session.test.ts` |
| Integration test | `<behavior>.integration.test.ts` | — | `reward-transaction.integration.test.ts` |
| Device test | `<flow>.device.test.ts` | — | `strict-relaunch.device.test.ts` |

### 6.2. Naming rules

- Tên phải mô tả trách nhiệm, tránh `manager`, `helper`, `util`, `common`, `base` hoặc `misc` khi không có nghĩa domain rõ ràng.
- Không dùng hậu tố `Service` cho mọi class. Orchestration thuộc Application dùng `UseCase`; I/O implementation dùng `Adapter` hoặc `Repository`.
- Chỉ dùng `<name>.service.ts` khi đối tượng thực sự cung cấp một capability ổn định không khớp use case, port, adapter hoặc repository; trách nhiệm phải được ghi trong module README hoặc code contract.
- File có JSX dùng `.tsx`; file không có JSX dùng `.ts`.
- React component dùng `PascalCase`; custom Hook bắt đầu bằng `use` và theo sau bằng tên `PascalCase` trong symbol, ví dụ `useFocusSession`.
- Expo Router route/layout phải có default export theo contract của framework. Source module ngoài `src/app` ưu tiên named export; chỉ dùng default export khi framework hoặc asset loader yêu cầu.
- Interface/type không dùng tiền tố `I` hoặc hậu tố `Type`.
- Boolean bắt đầu bằng `is`, `has`, `can` hoặc `should` theo ý nghĩa.
- Event dùng thì quá khứ cho fact đã xảy ra (`focusSessionCompleted`); command dùng động từ mệnh lệnh (`startFocus`).
- Stable error code dùng `SCREAMING_SNAKE_CASE`; TypeScript enum/union value dùng `lowercase` theo Product Core khi biểu diễn session/Pet state.
- Symbol chứa tên công nghệ giữ cách viết chuẩn khi rõ ràng, ví dụ `SQLiteFocusSessionRepository`, `PostHogAnalyticsAdapter` và `ExpoNotificationAdapter`.
- Expo Router giữ filename/cú pháp đặc biệt `_layout.tsx`, `index.tsx`, `+not-found.tsx`, `[param].tsx` và `(group)` theo framework; đây là ngoại lệ có chủ đích với naming chung.
- Platform-specific source dùng hậu tố `.ios.ts[x]`, `.android.ts[x]`, `.native.ts[x]` hoặc `.web.ts[x]`. Trong `src/app`, một platform-specific route phải có route không hậu tố tương ứng để giữ universal route/deep-link contract.

### 6.3. Ecosystem references

- [React — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks): component bắt đầu bằng chữ hoa; custom Hook bắt đầu bằng `use` theo sau bởi chữ hoa.
- [Expo — Using TypeScript](https://docs.expo.dev/guides/typescript/): dùng `.tsx` cho file có JSX và `.ts` cho file TypeScript không có JSX.
- [Expo Router — Notation](https://docs.expo.dev/router/basics/notation/): quy ước `index.tsx`, `_layout.tsx`, route group, dynamic route và special route.
- [Expo Router — Platform-specific modules](https://docs.expo.dev/router/advanced/platform-specific-modules/): hậu tố platform và yêu cầu route không hậu tố khi có route platform-specific trong `src/app`.

## 7. Test, fixture, fake và mock — `PS-OPEN-006` (`RESOLVED`)

Quyết định được Tech Lead Dũng Lư chốt ngày 2026-08-26: unit test colocate cạnh source; reusable test support thuộc workspace sở hữu; integration/device test thuộc mobile; ưu tiên fake cho core port và chỉ dùng mock chủ yếu tại SDK/platform boundary.

### 7.1. Vị trí test

Quy tắc được chốt:

- Unit test colocate cạnh source bằng `<basename>.test.ts[x]` để owner và behavior dễ tìm.
- Package-level reusable builder/fixture/fake nằm trong `<workspace>/test/{builders,fixtures,fakes}`.
- Mobile integration test nằm trong `apps/mobile/test/integration`.
- Test cần runtime thiết bị/simulator nằm trong `apps/mobile/test/device`.
- Provider SDK mock chỉ nằm trong `apps/mobile/test/mocks` hoặc cạnh integration suite dùng nó.
- Không tạo root `packages/test-support` trong baseline. Chỉ tách khi cùng test helper có ít nhất hai package consumer và không kéo mobile/runtime dependency vào Domain.
- Test source/support không được export trong production package API hoặc trở thành runtime dependency.
- `PS-OPEN-006` chỉ chốt structure và ownership. Việc chọn unit/integration/device test runner phải dựa trên compatibility với Expo SDK 57 tại thời điểm scaffold và không được làm thay đổi boundary này.

### 7.2. Ý nghĩa và giới hạn

| Loại | Dùng khi | Quy tắc |
|---|---|---|
| Fixture | Dữ liệu mẫu bất biến, dễ đọc | Không ẩn default quan trọng ảnh hưởng behavior |
| Builder | Test cần thay đổi một vài field trong object hợp lệ | Default phải explicit và deterministic |
| Fake | Implementation nhỏ có hành vi thật trong memory | Ưu tiên cho clock, ID, repository và Application port |
| Mock | Cần xác nhận interaction/provider call khó fake | Chủ yếu ở SDK/platform boundary; không mock toàn bộ Domain |

Các test bắt buộc từ baseline phải có vị trí rõ ràng:

- Domain unit test: timestamp/session transition, Strict Mode và reward policy sau khi specification tương ứng được duyệt.
- Application unit test: command coordination, typed result, side-effect ordering và retry/deduplication contract.
- SQLite integration test: migration, transaction, conditional terminal transition và reward ledger unique theo `sessionId`.
- Mobile integration/device test: background/foreground, kill/relaunch, notification denial/failure và startup reconciliation barrier.
- Asset/presentation test: missing asset fallback, reduced motion và accessibility semantics.

Không thêm expected behavior cho các Product Core decision đang `OPEN`; test cho các mục đó chỉ được viết sau khi product/specification chốt.

## 8. Sprite, audio và font — `PS-OPEN-007` (`RESOLVED`)

Quyết định được Tech Lead Dũng Lư chốt ngày 2026-08-26: binary asset thuộc mobile app, dùng stable asset ID, được nạp qua typed static catalog và luôn có fallback phù hợp. Pet animation baseline dùng một sprite sheet cho mỗi Pet state; animation timing/priority tiếp tục thuộc Pet State Machine specification.

### 8.1. Asset layout

```text
apps/mobile/assets/
├── sprites/
│   ├── pets/
│   │   └── <pet-id>/
│   │       ├── idle/
│   │       ├── working/
│   │       ├── breaking/
│   │       ├── celebrating/
│   │       └── bugged/
│   ├── rooms/
│   ├── items/
│   └── effects/
├── audio/
│   └── sfx/
├── fonts/
└── ATTRIBUTIONS.md
```

Không ghi cứng Cat, Dog hoặc Robot vào path cho tới khi Product `OPEN-001` được chốt. `<pet-id>` là stable asset identifier, không phải display name.

### 8.2. Naming

| Asset | Pattern | Ví dụ không ràng buộc Pet cụ thể |
|---|---|---|
| Sprite sheet Pet | `<pet-id>--<state>--sheet.png` | `default-pet--working--sheet.png` |
| Room/item/effect | `<category>--<asset-id>.png` | `effect--focus-complete.png` |
| Sprite manifest | `<pet-id>.sprite-manifest.ts` | `default-pet.sprite-manifest.ts` |
| Sound effect | `<event-or-action>.<supported-format>` | `focus-complete.wav` |
| Font binary | `<family-name>-<weight>.otf` hoặc `.ttf` | `pixeldoro-display-regular.otf` |
| TypeScript asset key | `camelCase` | `focusCompleteSound` |

Quy tắc:

- Filename dùng ASCII lowercase kebab-case; `--` chỉ phân tách các phần cố định trong sprite naming.
- Core sprite/audio/font được bundle local; không phụ thuộc download để chạy core loop.
- Mỗi Pet state dùng một sprite sheet. Frame rời chỉ là exception sau khi Art/Engineering chứng minh sprite sheet không đáp ứng pipeline hoặc performance gate; exception phải giữ cùng stable asset ID và fallback contract.
- Typed manifest nằm trong `src/presentation/assets/manifests/`, dùng static import/`require` literal và khai báo sheet, frame geometry, loop/one-shot cùng fallback. Giá trị timing/priority chỉ được điền theo Pet State Machine đã duyệt.
- Asset catalog trong `src/presentation/assets` là lối truy cập duy nhất cho Presentation; screen/component không tự dựng path động hoặc import binary rải rác.
- Không overwrite binary asset dưới cùng filename nếu thay đổi có thể cần đối chiếu hoặc rollback; thay đổi breaking dùng asset ID/version mới theo art pipeline được duyệt.
- Audio SFX dùng format được `expo-audio` hỗ trợ và phải được smoke-test trên iOS/Android target; codec cụ thể là tối ưu asset, không thay đổi naming/boundary đã chốt. Audio có thể bị tắt và failure không ảnh hưởng core loop.
- Font dùng OTF hoặc TTF; ưu tiên OTF khi cùng family/quality có sẵn. Mobile embed font bằng `expo-font` config plugin và luôn có readable/system fallback; thêm hoặc đổi native font configuration yêu cầu binary build mới theo delivery baseline.
- Text quan trọng không được render chỉ bằng sprite hoặc custom font.
- `assets/ATTRIBUTIONS.md` ghi source, author, license và phạm vi sử dụng của third-party asset trước khi ship.
- Chưa tạo shared asset package. Khi desktop có consumer thực tế, binary/catalog có thể được promote bằng stable asset ID mà không đổi Domain/Application contract.

Pet cụ thể, frame timing, animation priority, font family thực tế và nội dung audio không được tài liệu này tự chốt; chúng thuộc Product/Art hoặc specification tương ứng. Các lựa chọn đó phải tuân thủ layout, naming, static catalog, fallback và attribution rule đã chốt tại đây.

## 9. Ví dụ thêm feature đúng kiến trúc — `PS-OPEN-008` (`RESOLVED`)

Quyết định được Tech Lead Dũng Lư chốt ngày 2026-08-26: dùng danh sách Focus History cơ bản làm reference implementation khi thêm feature mới. Ví dụ chỉ dùng requirement đã nằm trong Product Core và không bao gồm contribution-graph color threshold đang `OPEN`.

### 9.1. File thay đổi dự kiến

```text
packages/application/src/history/
├── list-focus-history.use-case.ts
├── focus-history.projection.ts
└── list-focus-history.use-case.test.ts

packages/application/src/ports/
└── focus-session.repository.ts

apps/mobile/src/application/history/
├── view-focus-history.use-case.ts
└── view-focus-history.use-case.test.ts

apps/mobile/src/infrastructure/database/
├── repositories/sqlite-focus-session.repository.ts
└── repositories/sqlite-focus-session.repository.integration.test.ts

apps/mobile/src/presentation/features/history/
├── components/focus-history-row.tsx
├── screens/history-screen.tsx
├── hooks/use-focus-history.ts
└── index.ts

apps/mobile/src/app/(tabs)/history.tsx
```

### 9.2. Luồng dependency

```text
src/app/(tabs)/history.tsx
  → compose HistoryScreen
  → Presentation hook/controller gọi mobile ViewFocusHistoryUseCase
  → Mobile use case gọi shared ListFocusHistoryUseCase
  → Shared use case đọc FocusSessionRepository port
  → SqliteFocusSessionRepository thực thi query
  → Shared use case map record thành FocusHistoryProjection
  → Zustand/Presentation render projection
  → Mobile use case enqueue history_viewed best-effort qua mobile AnalyticsPort
```

### 9.3. Điều không được làm

- Route hoặc `HistoryScreen` không import SQLite repository.
- Component không nhận raw SQLite row.
- Zustand store không tự query database hoặc tự tính session terminal status.
- Infrastructure không tự thay đổi rule completed/failed/cancelled.
- Analytics delivery failure không làm History screen thất bại.
- Không tự chốt contribution graph threshold trong feature này.

### 9.4. Checklist khi thêm feature

1. Xác nhận feature thuộc Mobile MVP hoặc đã có product approval.
2. Xác định rule có cần Domain thay đổi hay chỉ là Application query/Presentation change.
3. Định nghĩa hoặc mở rộng Application-owned port/result trước khi viết concrete adapter.
4. Implement Infrastructure và wire tại Composition Root; không khởi tạo adapter trong screen/store.
5. Thêm Presentation feature và route composition mỏng.
6. Thêm unit/integration/device test tương ứng với rủi ro.
7. Kiểm tra import boundary tự động trong CI.
8. Cập nhật specification/ADR nếu feature tạo quyết định mới; không sửa baseline âm thầm.

## 10. Quy tắc thêm module hoặc package mới

Một module/package mới chỉ được tạo khi trả lời được:

1. Trách nhiệm duy nhất của nó là gì?
2. Owner và consumer thực tế là ai?
3. Nó thuộc layer nào và được phép import gì?
4. Public API tối thiểu là gì?
5. Có thể colocate trong module hiện có mà vẫn rõ ràng không?
6. Có kéo dependency mobile/provider vào shared core không?
7. Có đang chuẩn bị quá sớm cho desktop, backend, cloud sync hoặc feature `DEFERRED` không?

Nếu chưa trả lời được, giữ code gần feature đang sở hữu thay vì tạo `shared`, `common`, `utils` hoặc package mới.

## 11. Project structure decisions

| ID | Câu hỏi cần Tech Lead chốt | Đề xuất hiện tại | Owner | Trạng thái |
|---|---|---|---|---|
| `PS-OPEN-001` | Shared core dùng hai package `domain` + `application`, hay một package `core`? | Hai package để enforce dependency direction ở package boundary. | Dũng Lư — Tech Lead | `RESOLVED` |
| `PS-OPEN-002` | Workspace dùng package manager/task tooling nào? | `pnpm` workspace, một root lockfile, pin pnpm version; chưa thêm Turborepo/task orchestrator cho MVP. | Dũng Lư — Tech Lead | `RESOLVED` |
| `PS-OPEN-003` | `apps/mobile` tổ chức layer-first, feature-first hay hybrid? | Hybrid theo Expo `src/app`; thêm Mobile-only Application và giữ shared Application platform-neutral để mở đường cho desktop. | Dũng Lư — Tech Lead | `RESOLVED` |
| `PS-OPEN-004` | Public API và import boundary được enforce ở mức nào? | Workspace dependency + package exports + TypeScript resolution + ESLint restricted imports; cấm cross-package/cross-feature deep import. | Dũng Lư — Tech Lead | `RESOLVED` |
| `PS-OPEN-005` | Chấp nhận naming convention nào? | File kebab-case, symbol theo TypeScript/React convention, suffix theo vai trò và Expo Router/platform notation. | Dũng Lư — Tech Lead | `RESOLVED` |
| `PS-OPEN-006` | Test/fixture/fake/mock được colocate và chia cấp nào? | Unit test colocate; reusable support ở workspace `test/`; integration/device ở mobile; ưu tiên fake và giới hạn mock tại SDK boundary. | Dũng Lư — Tech Lead | `RESOLVED` |
| `PS-OPEN-007` | Asset layout, naming và pipeline baseline là gì? | Mobile-local asset theo category/Pet state, sprite sheet mỗi state, stable ID, typed static catalog, fallback và attribution metadata. | Dũng Lư — Tech Lead + Art | `RESOLVED` |
| `PS-OPEN-008` | Ví dụ feature nào dùng làm reference implementation? | Focus History cơ bản, không đụng product decision đang mở. | Dũng Lư — Tech Lead | `RESOLVED` |

`PS-OPEN-001` đến `PS-OPEN-008` được Dũng Lư xác nhận ngày 2026-08-26. Nếu quyết định tương lai làm thay đổi Product Core, Technical Overview, System Architecture hoặc ADR đã duyệt, phải dừng và xử lý thay đổi baseline qua review riêng trước.

## 12. Acceptance criteria

- [x] Cấu trúc `apps/`, `packages/` và `docs/` đã được Tech Lead chốt.
- [x] Trách nhiệm của từng package/module/thư mục không chồng lấn.
- [x] Import boundary phản ánh đúng System Architecture 1.0.0 và có cơ chế kiểm tra tự động.
- [x] Domain không thể import mobile runtime, provider SDK hoặc Application.
- [x] Presentation không thể truy cập Infrastructure/SQLite/provider SDK trực tiếp.
- [x] Naming cho file, component, hook, store, use case, service/adapter và repository đã được chốt.
- [x] Unit test, integration test, device test, fixture, fake và mock có vị trí rõ ràng.
- [x] Sprite, audio và font có vị trí, stable naming và fallback rule rõ ràng.
- [x] Ví dụ thêm feature tuân thủ dependency direction và composition-root wiring.
- [x] Không có Product Core decision `OPEN` bị biến thành requirement.
- [x] Không có package/abstraction chỉ phục vụ desktop, backend hoặc scope `DEFERRED`.
- [x] `PS-OPEN-001` đến `PS-OPEN-008` đã được Tech Lead chốt.
- [x] Tech Lead đã review và phê duyệt tài liệu ngày 2026-08-26.

## 13. Change log

### 1.0.0 — 2026-08-26

- Tech Lead Dũng Lư review và phê duyệt toàn bộ Project Structure.
- Chuyển trạng thái tài liệu từ `DRAFT` sang `APPROVED` sau khi `PS-OPEN-001` đến `PS-OPEN-008` đều được chốt và toàn bộ acceptance criteria đã đạt.
- Ghi nhận Dũng Lư là Owner, Reviewer và Approver.
- Phát hành Project Structure 1.0.0 làm baseline tổ chức source, test và asset cho các specification/tài liệu kỹ thuật tiếp theo cùng Mobile MVP implementation.

### 0.8.0 — 2026-08-26

- Chốt `PS-OPEN-008`: dùng Focus History cơ bản làm reference implementation cho quy trình thêm feature mới.
- Ghi rõ flow Route → Presentation → Mobile/shared Application → repository port → SQLite adapter và analytics side effect best-effort.
- Loại contribution-graph color threshold đang `OPEN` khỏi ví dụ để không biến product decision chưa chốt thành requirement.
- Kiểm tra chéo Mobile Application port ownership và bổ sung lifecycle, notification, analytics, feedback, audio, haptic cùng store review theo System Architecture 1.0.0.
- Hoàn tất `PS-OPEN-001` đến `PS-OPEN-008`; giữ tài liệu ở `DRAFT` để kiểm tra chéo và chờ Tech Lead phê duyệt bản `1.0.0`.

### 0.7.0 — 2026-08-26

- Chốt `PS-OPEN-007`: binary asset thuộc `apps/mobile/assets`, dùng stable asset ID và typed static catalog trong Presentation.
- Chọn một sprite sheet cho mỗi Pet state làm baseline; frame/timing/loop/one-shot/fallback được khai báo qua typed manifest và phải khớp Pet State Machine đã duyệt.
- Quy định local audio dùng format tương thích `expo-audio` và được smoke-test trên iOS/Android; font OTF/TTF ưu tiên OTF, embed qua `expo-font` config plugin và có system fallback.
- Thêm `assets/ATTRIBUTIONS.md` cho source/license metadata; cấm core asset phụ thuộc mạng hoặc screen tự dựng dynamic asset path.
- Chưa tạo shared asset package; stable asset ID cho phép promote khi desktop có consumer thực tế.

### 0.6.0 — 2026-08-26

- Chốt `PS-OPEN-006`: unit test colocate cạnh source; reusable builder/fixture/fake thuộc `test/` của workspace sở hữu.
- Đặt mobile integration test tại `apps/mobile/test/integration` và device/simulator test tại `apps/mobile/test/device`.
- Ưu tiên fake deterministic cho clock, ID, repository và Application port; giới hạn mock chủ yếu tại Expo/native/provider SDK boundary.
- Không tạo `packages/test-support` trong baseline và không export test support qua production package API.
- Giữ lựa chọn test runner ngoài phạm vi quyết định structure; runner phải tương thích Expo SDK 57 và tuân thủ boundary đã chốt.

### 0.5.0 — 2026-08-26

- Chốt `PS-OPEN-005`: source file dùng kebab-case; component, Hook, store, use case, port, repository, adapter, mapper, projection và test dùng suffix/symbol convention theo trách nhiệm.
- Bổ sung convention chính thức của React: component dùng `PascalCase`, custom Hook bắt đầu bằng `use` theo sau bởi chữ hoa.
- Bổ sung convention TypeScript/Expo: `.tsx` chỉ cho file có JSX; source thông thường ưu tiên named export, Expo Router route/layout dùng default export.
- Bổ sung Expo Router notation và platform suffix; platform-specific route trong `src/app` phải có route không hậu tố tương ứng.
- Chuẩn hóa canonical technology symbol như `SQLiteFocusSessionRepository`, `PostHogAnalyticsAdapter` và `ExpoNotificationAdapter`.

### 0.4.0 — 2026-08-26

- Chốt `PS-OPEN-004`: enforce dependency direction bằng workspace dependency, package exports, TypeScript package resolution và ESLint `no-restricted-imports`.
- Cấm deep import xuyên workspace package và Presentation feature; consumer chỉ dùng public API đã export.
- Ghi dependency matrix cho Domain, shared/Mobile Application, Presentation, Infrastructure, Composition Root và Expo route.
- Chưa thêm dependency-cruiser, Nx hoặc architecture framework riêng; chỉ xem xét khi rule baseline không đủ hoặc vi phạm lặp lại tạo chi phí đo được.

### 0.3.0 — 2026-08-26

- Chốt `PS-OPEN-002`: dùng pnpm workspace với một `pnpm-lock.yaml` tại repository root và protocol `workspace:*` cho package nội bộ.
- Quy định pin exact pnpm version bằng field `packageManager`; không trộn lockfile từ npm hoặc Yarn.
- Giữ isolated dependency installation mặc định; `nodeLinker: hoisted` chỉ là fallback sau khi có lỗi tương thích Expo/native package được xác nhận.
- Không thêm Turborepo/task orchestrator trong Mobile MVP; chỉ xem xét khi thời gian build/test hoặc dependency graph tạo nhu cầu đo được.

### 0.2.0 — 2026-08-26

- Chốt `PS-OPEN-001`: workspace dùng hai shared package `packages/domain` và `packages/application` để enforce dependency direction.
- Chốt `PS-OPEN-003`: mobile dùng cấu trúc hybrid với Expo Router tại `apps/mobile/src/app`; non-route code nằm ngoài route directory.
- Tách `apps/mobile/src/application` cho lifecycle, notification, feedback và native store-review orchestration chỉ dành cho mobile.
- Giới hạn `packages/application` ở use case/port platform-neutral để desktop tương lai có thể tái sử dụng mà không kéo Expo hoặc React Native vào dependency graph.
- Cập nhật ví dụ Focus History để mobile orchestration sở hữu analytics side effect, còn shared use case chỉ xử lý query/projection dùng chung.
- Giữ desktop ngoài phạm vi MVP; chưa tạo `apps/desktop`, desktop adapter, sync abstraction hoặc package chỉ phục vụ desktop.

### 0.1.0 — 2026-08-26

- Tạo bản draft đầu tiên từ Product Core 1.3.0, Technical Overview 1.0.0, System Architecture 1.0.0 và ADR-001 đến ADR-008.
- Ghi đề xuất workspace `apps/mobile`, `packages/domain`, `packages/application` và cấu trúc `docs`.
- Ghi trách nhiệm module, import boundary, naming, vị trí test/fixture/fake/mock và asset convention dưới trạng thái `PROPOSED`.
- Thêm ví dụ Focus History và checklist thêm feature đúng kiến trúc.
- Ghi `PS-OPEN-001` đến `PS-OPEN-008` để Tech Lead duyệt lần lượt; chưa đánh dấu tài liệu hoặc checklist hoàn thành.
