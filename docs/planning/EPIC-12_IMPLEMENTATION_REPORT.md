---
document_id: PIXELDORO_EPIC_12_IMPLEMENTATION_REPORT
title: PixelDoro EPIC-12 — Hardening, Device Validation và Closed-beta Delivery Implementation Report
version: 0.7.0
status: IMPLEMENTATION_IN_PROGRESS_BUILD_SOURCE_GUARD_IMPLEMENTED_COMMIT_REFREEZE_REBUILD_REQUIRED
date: 2026-09-14
last_updated: 2026-09-15
owner: Dũng Lư
branch: feats/epic-12
upstream: origin/feats/epic-12
implementation_baseline_sha: aaee07fff999388920ebb3beb759567ac4f01c43
previous_candidate_sha: 59cb87c4bc4b150a7d95265d9655f4b04bc2309a
previous_candidate_status: INVALIDATED_BY_POST_FREEZE_CONFIG_ASSET_AND_HARNESS_CHANGES
product_config_baseline_sha: baf70d37778e92ff0d5c258d2f2d5c1d2c0d87be
replacement_candidate_sha: PENDING_CLEAN_COMMIT_AFTER_EVIDENCE_HARNESS_UPDATE
start_gate: MET_EPIC_11_DONE_OWNER_ACCEPTED_AND_MVP_FEATURE_COMPLETE
schema_verdict: SCHEMA_001_UNCHANGED
dependency_verdict: OWNER_APPROVED_12_EXPO_PATCH_ALIGNMENTS_APPLIED
native_config_verdict: POST_FREEZE_CONFIG_ASSET_AND_BUILD_TOOLING_CHANGE_REFREEZE_REBUILD_REQUIRED
delivery_execution_status: FIRST_IOS_ANDROID_STORE_UPLOADS_OWNER_REPORTED_BUILD_SOURCE_GATE_FAILED
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

Repository hardening của `US-12-01/02` đã được commit trong frozen candidate và root quality gate pass.
Owner đã xác nhận `EPIC12-CONFIRM-11=B`; đúng 12 Expo SDK patch dependencies được align, lockfile được
đồng bộ, và online Expo Doctor hiện `21/21`. Owner sau đó xác nhận `EPIC12-CONFIRM-02=A`,
freezing exact committed candidate SHA `59cb87c4bc4b150a7d95265d9655f4b04bc2309a` cho mọi blocking
evidence. Tại checkpoint đó chưa có device/update/distribution evidence hoặc owner exit acceptance.
Các build/upload phát sinh sau đó được ghi bên dưới nhưng không đạt exact-source gate; do đó Epic vẫn
`IN_PROGRESS`, manual rows vẫn `NOT_RUN/BLOCKED`, và verdict vẫn `NO_GO`.

Ngày 2026-09-15, owner duyệt `EPIC12-CONFIRM-03=A`: hardware claims phải dùng minimum và
representative physical devices; simulator/emulator chỉ bổ sung. Exact device/model/OS inventory chưa
đủ nên các slot vẫn `BLOCKED` và không có device PASS. Read-only discovery thấy một iPhone 13/iOS
26.6.2 đang offline, một iPhone 14 Plus Simulator/iOS 26.5 đang booted và Android
`sdk_gphone64_arm64` emulator/API 36 đang connected. Hai virtual targets chỉ là supplemental; iPhone 13
chỉ có thể làm representative physical target sau khi reconnect.

Owner đồng thời quyết định EAS Build và store upload sẽ thực hiện sau. Quyết định này hoãn execution,
không chọn thay `EPIC12-CONFIRM-04=A/B/C`; không EAS build, submit, upload hay distribution action nào
được thực hiện trong checkpoint này.

Sau checkpoint đó, owner báo đã submit xong first build lên App Store và Play Store. EAS read-only
metadata xác nhận các production/store builds đã `FINISHED`, nhưng chúng không đạt exact-source gate:

| Platform/artifact | EAS build ID | EAS Git SHA | App/build/runtime | Evidence verdict |
|---|---|---|---|---|
| Android store AAB | `93d77431-0b2d-435e-914e-fe90f95f07bb` | `1ca4e3f51487fe4df2cd264c18f6b90554842447` | `1.0.1` / `1` / `1.0.1` | `REJECTED_FOR_EPIC_12_EXACT_SOURCE_EVIDENCE` |
| iOS store IPA, first | `98fee2fe-defc-4fa7-8684-f1b5ddcbbd15` | `1ca4e3f51487fe4df2cd264c18f6b90554842447` | `1.0.1` / `1` / `1.0.1` | `REJECTED_FOR_EPIC_12_EXACT_SOURCE_EVIDENCE` |
| iOS store IPA, latest | `d20dc640-ba5b-4d76-9bd5-96e9f9f39ed1` | `726c22e26009fff952c381408a551c0ef01d0980` | `1.0.1` / `2` / `1.0.1` | `REJECTED_FOR_EPIC_12_EXACT_SOURCE_EVIDENCE` |

Android/iOS build metadata reports app version `1.0.1` while commit `1ca4e3f...` still contained `0.1.0`;
latest iOS reports build number `2` while commit `726c22e...` still contained build number `1`. Therefore
both build rounds included uncommitted config changes and cannot be reconstructed from their reported Git
SHA. Latest iOS and Android also use different Git SHAs. Store upload is retained as owner-reported
operational fact, not release PASS. Clean product/config baseline
`baf70d37778e92ff0d5c258d2f2d5c1d2c0d87be` passes full quality (`220` files / `1,109` tests).
Because this audit changes the evidence harness, the replacement SHA must be taken only after these
records are committed cleanly, then explicitly re-frozen and rebuilt.

The root mobile build entry point now blocks any tracked/untracked worktree change, prints the exact
40-character build SHA, executes prebuild, then verifies the repository is still clean and the SHA is
unchanged before invoking EAS. Its dirty-worktree negative path fails closed as expected, and full root
quality remains green. This guard is not yet committed, so replacement freeze remains pending.

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
| Build-source guard negative path | `PASS` | Dirty tracked/untracked state rejected before prebuild/EAS; exact changed paths reported |

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
| `US-12-01` | `CANDIDATE_INVALIDATED_REFREEZE_REQUIRED` | Commit evidence/harness update cleanly; owner approves replacement exact SHA |
| `US-12-02` | `QUALITY_PASS_PRODUCT_CONFIG_BASELINE` | Re-run/bind quality and a new clean build to the owner-refrozen replacement SHA |
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
| Previous candidate exact SHA | `59cb87c4bc4b150a7d95265d9655f4b04bc2309a` — invalidated by post-freeze changes |
| Product/config baseline SHA | `baf70d37778e92ff0d5c258d2f2d5c1d2c0d87be` — clean full-quality PASS before this evidence/harness update |
| Replacement candidate exact SHA | `PENDING_CLEAN_COMMIT_AND_OWNER_REFREEZE` |
| Current app version/build | `1.0.1`; iOS build `2`; Android version code `1` |
| Runtime policy | `appVersion` |
| SQLite migrations | One immutable `001`; unchanged |
| Dependency lock/native graph | 12 owner-approved Expo SDK 57 patch alignments; no new package |
| Native/build configuration | Post-freeze change: explicit local version source, app/build versions, encryption declaration, EAS profiles/build tooling and icons; clean rebuild required |
| Live PostHog | Deferred/fail-closed; no key/config added |
| Feedback live endpoint | Deferred/unset; no real submission claim |
| Automated candidate evidence | Product/config baseline `baf70d3...` and current evidence/harness worktree: full root quality PASS; prior online Expo Doctor `21/21` |
| Build evidence | Three EAS builds `FINISHED`, but exact-source validation `FAIL` |
| Manual/device/delivery evidence | `NOT_RUN/BLOCKED`; store upload owner-reported, no tester install/launch evidence |

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
| `EPIC12-CONFIRM-02` | `A — POLICY_ACCEPTED; REFREEZE_REQUIRED` | Prior frozen SHA invalidated; replacement awaits clean evidence/harness commit and explicit owner confirmation |
| `EPIC12-CONFIRM-03` | `A — ACCEPTED_2026_09_15` | Minimum + representative physical coverage required; exact device/OS inventory remains `BLOCKED` |
| `EPIC12-CONFIRM-09/10` | `PENDING` | Benchmark và accessibility evidence floor chưa được chốt |
| `EPIC12-CONFIRM-04` | `UPLOAD_OWNER_REPORTED_TARGET_UNCONFIRMED` | Store uploads completed, but exact A/B/C group/track is unconfirmed and artifacts fail exact-source gate |
| `EPIC12-CONFIRM-07/08` | `PENDING` | Track/group, rollback và go/no-go owner chưa được chọn |
| `EPIC12-CONFIRM-05` | `PENDING` | Feedback endpoint vẫn unset; không thu submission thật |
| `EPIC12-CONFIRM-06` | `PENDING_DEFAULT_DEFERRED` | PostHog vẫn fail-closed và không phải core blocker |
| `EPIC12-CONFIRM-11` | `B — ACCEPTED_AND_APPLIED_2026_09_14` | 12 patch alignments applied; Doctor `21/21`; fresh native build evidence required |
| `EPIC12-CONFIRM-12` | `PENDING_DEFAULT_NO_GO_ON_CRASH_OR_P0` | Exit policy chưa owner-sign |

## 8. Next execution order

1. Commit the build-source guard plus evidence/harness update, verify a clean tree, run the guard's
   `--check` success path and rerun quality, then owner explicitly
   re-freezes that new exact SHA as the replacement candidate.
2. Rebuild both platforms from the same clean exact SHA; do not reuse the current uploaded artifacts as
   blocking evidence.
3. Record App Store Connect submission/build state, TestFlight group, Google Play track/release and
   tester install/launch evidence.
4. Fill the exact iOS/Android physical device/model/OS inventory required by `CONFIRM-03=A`.
5. Execute `US-12-03` same-SHA iOS/Android aggregate and `US-12-04→06` device rows.
6. Execute preview/runtime/rollback and internal distribution after remaining owner confirmations.
7. Create Exit Report only when all mandatory rows have evidence and owner explicitly accepts
   `EPIC-12 DONE_OWNER_ACCEPTED` plus `CLOSED_BETA_READY`.

## 9. Change log

| Version | Date | Change |
|---|---|---|
| `0.7.0` | 2026-09-15 | Implemented fail-closed build-source verification before and after prebuild. Dirty-source negative check and full quality PASS; commit, clean-path verification and replacement re-freeze remain required. |
| `0.6.0` | 2026-09-15 | Recorded owner-reported App Store/Play Store uploads and verified three finished EAS store builds. Detected dirty-source metadata and cross-SHA mismatch, invalidated `59cb87c...`, and recorded quality-PASS product/config baseline `baf70d3...`; replacement SHA awaits clean evidence/harness commit, explicit re-freeze and rebuild. |
| `0.5.0` | 2026-09-15 | Recorded owner deferral of EAS Build and store upload. No `CONFIRM-04` A/B/C target was inferred, no external action was performed, and delivery remains blocked until resumed. |
| `0.4.0` | 2026-09-15 | Recorded `EPIC12-CONFIRM-03=A`; required minimum + representative physical-device coverage. Read-only discovery recorded one offline physical iPhone plus available iOS/Android virtual targets; unresolved physical slots remain `BLOCKED`. |
| `0.3.0` | 2026-09-14 | Recorded `EPIC12-CONFIRM-02=A`; froze exact RC SHA `59cb87c4bc4b150a7d95265d9655f4b04bc2309a` for all blocking evidence while preserving device/build/delivery rows as `NOT_RUN` and verdict `NO_GO`. |
| `0.2.0` | 2026-09-14 | Applied owner-approved `EPIC12-CONFIRM-11=B`: exactly 12 Expo SDK 57 patch alignments, regenerated lockfile, online Doctor `21/21`, full root quality PASS; native/device evidence remains `NOT_RUN`. |
| `0.1.0` | 2026-09-14 | Opened implementation after EPIC-11 closure; retired prototype graph, split oversized provider hooks, extended repository/device validators and recorded full local quality PASS without claiming device/delivery readiness. |
