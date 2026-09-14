---
document_id: PIXELDORO_EPIC_12_IMPLEMENTATION_REPORT
title: PixelDoro EPIC-12 — Hardening, Device Validation và Closed-beta Delivery Implementation Report
version: 0.2.0
status: IMPLEMENTATION_IN_PROGRESS_AUTOMATED_AND_EXPO_DOCTOR_PASS_DEVICE_AND_DELIVERY_NOT_RUN
date: 2026-09-14
last_updated: 2026-09-14
owner: Dũng Lư
branch: feats/epic-12
upstream: origin/feats/epic-12
implementation_baseline_sha: aaee07fff999388920ebb3beb759567ac4f01c43
candidate_sha: PENDING_COMMIT_NOT_FROZEN
start_gate: MET_EPIC_11_DONE_OWNER_ACCEPTED_AND_MVP_FEATURE_COMPLETE
schema_verdict: SCHEMA_001_UNCHANGED
dependency_verdict: OWNER_APPROVED_12_EXPO_PATCH_ALIGNMENTS_APPLIED
native_config_verdict: NO_CONFIG_CHANGE_FRESH_NATIVE_BUILD_REQUIRED
manual_device_status: NOT_RUN
closed_beta_status: NO_GO
user_stories: ./EPIC-12_USER_STORIES.md
manual_guide: ../../apps/mobile/test/device/epic-12-beta-readiness.md
---

# EPIC-12 implementation report

## 1. Current result

Owner xác nhận đóng EPIC-11 và yêu cầu mở EPIC-12 ngày 2026-09-14. Authority hiện hành đã có EPIC-11
`DONE_OWNER_ACCEPTED` và W3 `MVP_FEATURE_COMPLETE`, vì vậy implementation bắt đầu từ exact clean SHA
`aaee07fff999388920ebb3beb759567ac4f01c43` trên branch `feats/epic-12`.

Repository hardening của `US-12-01/02` đã được implement trong worktree và root quality gate pass.
Owner đã xác nhận `EPIC12-CONFIRM-11=B`; đúng 12 Expo SDK patch dependencies được align, lockfile được
đồng bộ, và online Expo Doctor hiện `21/21`. Chưa có exact committed candidate SHA,
device/build/update/distribution evidence hoặc owner exit
acceptance; do đó Epic vẫn `IN_PROGRESS`, manual rows vẫn `NOT_RUN`, và verdict vẫn `NO_GO`.

## 2. Implemented scope

### 2.1. Production graph retirement

- Root app không còn mount `PrototypeProvider`.
- Đã loại bỏ dead prototype Focus/Break branches, result/running screens, reducer/context, controls,
  alias `PrototypeScreen` và `usePrototypeBack`.
- Production Focus, Break, onboarding, History, Shop, Settings và Feedback routes không đổi behavior
  owner; chúng tiếp tục dùng durable application facades/controllers.
- Các older-Epic integrity tests được cập nhật từ “prototype vẫn tồn tại” sang “prototype đã retired”.

### 2.2. UI ownership và size boundary

`mobile-application-context.tsx` 334 dòng đã được tách theo responsibility mà giữ nguyên import contract:

- provider/context ownership;
- bootstrap/entry hooks;
- onboarding hooks;
- Home/Shop/Room/History hooks;
- Pet/lifecycle hooks.

Repository hygiene giờ fail nếu production source đưa lại file/path prototype hoặc nếu production
screen/component TSX vượt hard limit 300 dòng. Không tạo god hook, wrapper UI rỗng hoặc abstraction mới.

### 2.3. EPIC-12 device-guide validator

Existing validator đã nhận `epic-12-beta-readiness.md` và kiểm:

- toàn bộ `E12-G*`, `E12-Q*` và required full-matrix case IDs;
- status vocabulary và initial implementation/manual status;
- exact SHA, platform/device/OS, build/runtime/channel, network/app/a11y, tester/timezone và artifact fields;
- exact disposable database, wildcard prohibition, cleanup và normal-launch instruction;
- go/no-go marker và false-PASS guard.

Chỉ governance gate `E12-G01` được PASS theo owner closure. Validator từ chối manual/device
`PASS` được điền trước evidence; automated PASS không được nâng cấp manual row.

## 3. Automated evidence

Executed from repository root with required Node `22.23.2` / pinned pnpm environment:

| Gate | Result | Evidence |
|---|---|---|
| Workspace typecheck | `PASS` | Domain, shared Application và Mobile TypeScript projects pass |
| ESLint | `PASS` | Repository lint pass |
| Automated tests | `PASS` | `220` test files, `1,109` tests |
| Device-guide validator | `PASS` | Existing guides plus EPIC-12 structure/false-PASS checks accepted |
| Boundary validator | `PASS` | `12` forbidden imports rejected; `4` valid imports accepted |
| Repository hygiene | `PASS` | One lockfile, no signing material/Skia/prototype source, UI <=300 lines, one immutable migration |
| Expo Doctor (online) | `PASS` | `21/21`; no issue detected after owner-approved patch alignment |
| Peer dependency audit | `PASS_WITH_BASELINE_WARNING` | Existing optional `@expo/require-utils@55.0.8` TypeScript range warning; unchanged from baseline; Doctor/typecheck pass |

SQLite experimental warnings emitted by Node during tests are tooling warnings; no test failed.

Owner đã duyệt và implementation đã áp dụng đúng patch alignment sau:

| Package | Previous | Applied |
|---|---:|---:|
| `expo` | `57.0.17` | `~57.0.22` |
| `expo-asset` | `57.0.15` | `~57.0.17` |
| `expo-audio` | `57.0.4` | `~57.0.5` |
| `expo-build-properties` | `57.0.15` | `~57.0.17` |
| `expo-constants` | `57.0.17` | `~57.0.18` |
| `expo-dev-client` | `57.0.16` | `~57.0.19` |
| `expo-haptics` | `57.0.2` | `~57.0.3` |
| `expo-linking` | `57.0.8` | `~57.0.10` |
| `expo-notifications` | `57.0.17` | `~57.0.18` |
| `expo-router` | `57.0.17` | `~57.0.21` |
| `expo-sqlite` | `57.0.2` | `~57.0.3` |
| `expo-updates` | `57.0.18` | `~57.0.22` |

## 4. Story status

| Story | Implementation status | Remaining exit evidence |
|---|---|---|
| `US-12-01` | `IMPLEMENTED_CANDIDATE_PENDING_SHA_AND_OWNER_ACCEPTANCE` | Commit/freeze exact SHA; owner confirms RC policy and risk disposition |
| `US-12-02` | `IMPLEMENTED_AUTOMATED_AND_DOCTOR_PASS_PENDING_EXACT_CANDIDATE` | Re-run full quality/Doctor on clean committed candidate and bind output to SHA |
| `US-12-03` | `NOT_RUN` | Same-SHA iOS/Android two-phase durability reports |
| `US-12-04` | `NOT_RUN` | Physical/representative offline/lifecycle/idempotency matrix |
| `US-12-05` | `NOT_RUN` | VoiceOver/TalkBack/Largest Text/permission/native store-review evidence |
| `US-12-06` | `NOT_RUN` | Pet fallback device rows and 30-minute iOS/Android benchmark |
| `US-12-07` | `NOT_RUN` | Preview/runtime/OTA negative boundary and rollback rehearsal |
| `US-12-08` | `BLOCKED_BY_TARGETS_AND_PRIOR_STORIES` | Internal distribution, artifact, notes, operational handoff and owner go/no-go |

## 5. Candidate manifest state

| Field | Current value |
|---|---|
| Implementation baseline | `aaee07fff999388920ebb3beb759567ac4f01c43` |
| Candidate exact SHA | `PENDING_COMMIT_NOT_FROZEN` |
| App version | `0.1.0` |
| Runtime policy | `appVersion` |
| SQLite migrations | One immutable `001`; unchanged |
| Dependency lock/native graph | 12 owner-approved Expo SDK 57 patch alignments; no new package |
| Native/build configuration | Config unchanged; fresh native build required because native module versions changed |
| Live PostHog | Deferred/fail-closed; no key/config added |
| Feedback live endpoint | Deferred/unset; no real submission claim |
| Automated candidate evidence | Root quality PASS; online Expo Doctor `21/21`; rerun required after exact commit/freeze |
| Manual/device/build/delivery evidence | `NOT_RUN` |

Any production/config/harness change after the candidate is frozen invalidates affected downstream
evidence and requires a new exact SHA plus rerun. Documentation-only evidence updates retain artifact SHA.

## 6. Data, privacy, native và rollback

- Không migration hoặc schema mutation; schema `001` giữ nguyên.
- Đúng 12 Expo SDK patch dependencies được update theo `CONFIRM-11=B`; không thêm package mới.
- Không đổi native/app/EAS config và chưa build/submit/publish update. Vì native module versions đã đổi,
  fresh Development/preview build là bắt buộc trước native/device PASS.
- Không thêm provider key, endpoint, production data hoặc raw feedback/analytics content.
- Prototype retirement rollback, nếu phát hiện production regression, là forward restore tối thiểu của
  route-independent behavior; không đưa prototype thành product truth trở lại.
- Provider split giữ stable barrel. Nếu consumer regression xuất hiện, restore export mapping nhỏ nhất;
  không gộp lại god context 334 dòng.

## 7. Confirmations và blockers

| ID | State | Effect |
|---|---|---|
| `EPIC12-CONFIRM-01` | `A — ACCEPTED_2026_09_14` | EPIC-11 closure/start gate mở implementation |
| `EPIC12-CONFIRM-02` | `PENDING` | Chưa freeze candidate SHA |
| `EPIC12-CONFIRM-03/09/10` | `PENDING` | Device, benchmark và accessibility rows chưa thể exit |
| `EPIC12-CONFIRM-04/07/08` | `PENDING` | Build target, track/group, rollback và go/no-go chưa được chọn |
| `EPIC12-CONFIRM-05` | `PENDING` | Feedback endpoint vẫn unset; không thu submission thật |
| `EPIC12-CONFIRM-06` | `PENDING_DEFAULT_DEFERRED` | PostHog vẫn fail-closed và không phải core blocker |
| `EPIC12-CONFIRM-11` | `B — ACCEPTED_AND_APPLIED_2026_09_14` | 12 patch alignments applied; Doctor `21/21`; fresh native build evidence required |
| `EPIC12-CONFIRM-12` | `PENDING_DEFAULT_NO_GO_ON_CRASH_OR_P0` | Exit policy chưa owner-sign |

## 8. Next execution order

1. Review current diff, commit only when owner requests, then freeze exact candidate SHA.
2. Rerun full quality/Doctor on that clean SHA and bind `US-12-01/02` evidence.
3. Produce fresh native Development/preview builds for the aligned native modules.
4. Execute `US-12-03` same-SHA iOS/Android aggregate.
5. Execute manual guide rows for `US-12-04→06` on owner-confirmed devices.
6. After target/channel/owner confirmations, execute preview/runtime/rollback and internal distribution.
7. Create Exit Report only when all mandatory rows have evidence and owner explicitly accepts
   `EPIC-12 DONE_OWNER_ACCEPTED` plus `CLOSED_BETA_READY`.

## 9. Change log

| Version | Date | Change |
|---|---|---|
| `0.2.0` | 2026-09-14 | Applied owner-approved `EPIC12-CONFIRM-11=B`: exactly 12 Expo SDK 57 patch alignments, regenerated lockfile, online Doctor `21/21`, full root quality PASS; native/device evidence remains `NOT_RUN`. |
| `0.1.0` | 2026-09-14 | Opened implementation after EPIC-11 closure; retired prototype graph, split oversized provider hooks, extended repository/device validators and recorded full local quality PASS without claiming device/delivery readiness. |
