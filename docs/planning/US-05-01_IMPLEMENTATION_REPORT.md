---
document_id: PIXELDORO_US_05_01_IMPLEMENTATION_REPORT
title: PixelDoro US-05-01 — Durable First-use Entry Implementation Report
version: 0.1.0
status: IMPLEMENTED_AWAITING_OWNER_MANUAL
story: US-05-01
date: 2026-08-31
owner: Dũng Lư
baseline_commit: 91cb459c05fdcfa1f114c9ed13ac143fdc7fd7d2
implementation_start_commit: 9c1b6e70a715116e0715f4248ae69f960f68a927
implementation_sha: PENDING_OWNER_COMMIT
language: vi
---

# US-05-01 — Implementation report

## 1. Outcome đã triển khai

- App có initial `/index` landing route trung lập thay vì mặc định render Intro.
- `FirstUseEntryController` đọc durable installation/trial facts sau bootstrap và trả đúng một
  semantic destination: Intro, Trial Running, Trial Result hoặc Home.
- Returning user có `onboarding_completed_at` được short-circuit tới production Home; session query
  không chạy không cần thiết.
- New/cancelled trial đi Intro; running đi Running route; completed đi Result route; impossible/read
  failure fail closed bằng safe recovery projection.
- Intro dùng production common `ScreenShell`, `ScreenHeader`, `Panel`, `PetStage`, `InlineNotice`,
  `Button`; không còn `PrototypeBadge` hoặc `usePrototype` authority.
- `Thử phiên 5 phút` hiển thị disabled trung thực cho tới US-05-02, không tạo fake/in-memory session.
- Dev-only finite fixture hỗ trợ new/returning/running/completed/cancelled/read-error review và bị
  chặn khi diagnostics/dev gate tắt.

## 2. Durable/application design

### 2.1. Latest onboarding trial query

`SessionRepository` có thêm read method `findLatestOnboardingTrial()`. SQLite adapter:

- filter `session_type = 'focus'` và `focus_variant = 'onboarding_trial'`;
- sort `started_at DESC, created_at DESC, id DESC` để deterministic;
- dùng existing `sessionSelect`, `readMappedOne`, `mapSessionRow` và stable persistence error;
- không thêm table, column, index hoặc migration.

Integration test chứng minh Standard Focus mới hơn không bị chọn, tie được resolve bằng stable id,
và kết quả giữ nguyên sau close/reopen.

### 2.2. Entry projection

Controller nằm trong mobile Application, phụ thuộc narrow Installation/Session readers và sở hữu:

- finite `idle/loading/ready/error` projection;
- single-flight refresh;
- generation guard và late-result protection khi dispose;
- stable error code, không rò SQL/provider detail;
- zero write, zero navigation, zero React/Expo/SQLite dependency.

Presentation route map semantic destination sang Expo Router path và suppress duplicate replace.

## 3. UI and prototype boundary

| Surface | Result |
| --- | --- |
| Root landing | Neutral loading/error/redirecting surface; no optimistic Intro/Home render. |
| Intro | Approved hierarchy/copy, default Cat/Mèo Dev, no Skip/name/species/mode/tag/Strict controls. |
| CTA | Existing common Button, disabled/a11y-disabled until US-05-02 production command. |
| Prototype containment | Provider remains only for pending consumers; `/index` and onboarding route do not import prototype state. |
| Running/Result | Only route selection accepted; production countdown/result remain US-05-02/03. |

Production UI/source sizes audited:

| File | Lines |
| --- | ---: |
| `apps/mobile/src/app/index.tsx` | 40 |
| `apps/mobile/src/app/(onboarding)/index.tsx` | 14 |
| `presentation/features/onboarding/index.tsx` | 68 |
| `first-use-entry-screen.tsx` | 30 |
| `first-use-entry-navigation.ts` | 37 |

All are below the 300-line hard limit; no common shell/panel/button/Pet component was duplicated.

## 4. Automated evidence

Node path/version used by the verification workflow: pinned Node `v22.23.2`.

### Targeted matrix

Command covered controller, composition fixture, navigation, presentation and SQLite integration:

- `7/7` test files passed.
- `30/30` tests passed.

### Root quality

`pnpm run quality` passed on 2026-08-31:

- workspace typecheck: pass;
- ESLint: pass;
- Vitest: `60/60` files, `307/307` tests pass;
- device-harness validator: pass;
- boundaries: 11 forbidden imports rejected, 3 valid imports accepted;
- repository hygiene: pass, one immutable migration, no signing material/Skia/extra lockfile.

`git diff --check` passed for implementation changes. No package/lockfile, migration/schema manifest,
native config/generated folder or native artifact changed.

## 5. Files changed

### Production

- Shared SessionRepository read contract and SQLite implementation.
- Mobile FirstUseEntryController and public Application/facade/provider exports.
- Composition construction, boot/retry/dispose integration and dev fixture gate.
- Root `/index`, root initial route, first-use navigation/status presentation.
- Onboarding route/Intro migration away from prototype authority.

### Tests/review

- Controller precedence/error/concurrency/dispose tests.
- SQLite latest-trial ordering/filter/reopen integration.
- Composition fixture enable/disable tests.
- Finite review fixture tests.
- Route mapping/deduplication and Intro/recovery presentation tests.

### Documentation

- EPIC-05 Story status, US-05-01 plan implementation state, and this report.

## 6. Scope audit

- No Start/Cancel/Complete/Reconcile/Reward/Continue implementation.
- No timer/countdown, committed Result, Pet terminal celebration or analytics event.
- No schema/migration/index/dependency/native change.
- No naming, Pet selector, species roster, multiple Pet, mode/tag selector or Strict branch.
- No productionization of Standard Focus, Break, History, Shop, Settings or Feedback.
- `OPEN-009` remains open.

## 7. Owner manual gate — pending

Use the full guide in `US-05-01_IMPLEMENTATION_PLAN.md` §10. Minimum start command:

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_new pnpm start --clear
```

Required owner evidence:

- [ ] Final Git SHA, platform, device/simulator, OS and Development Build/app version.
- [ ] New user cold launch: neutral entry → production Intro, no wrong-screen flash.
- [ ] Returning cold launch: direct production Home, no Intro flash.
- [ ] Cancelled: Intro; running/completed: correct route selection only.
- [ ] Read-error screen then Retry succeeds exactly once.
- [ ] Offline, background/foreground and cold relaunch cases.
- [ ] Screen reader, large text and Reduce Motion/static Cat behavior.
- [ ] Screenshot/video plus before/after installation/session/reward/profile facts and pass/fail.

Cleanup:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

No device/platform/manual box is marked pass by this report.

## 8. Remaining gate and limitations

- Story status remains `IMPLEMENTED_AWAITING_OWNER_MANUAL`, not `DONE`.
- `implementation_sha` remains pending until owner commits the implementation working tree.
- Intro CTA is intentionally disabled; enabling committed Start belongs US-05-02.
- Running/Result destination content remains prototype/pending and must not be accepted under US-05-01.
- US-05-02 remains unopened until owner supplies manual evidence and explicitly closes US-05-01.

## 9. Change log

| Version | Date | Author | Change |
| --- | --- | --- | --- |
| 0.1.0 | 2026-08-31 | Codex | Recorded host implementation, automated evidence, scope audit and pending owner Development Build gate. |
