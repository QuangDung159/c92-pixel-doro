---
document_id: PIXELDORO_US_02_09_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-02-09 Implementation Plan
version: 0.3.0
status: IMPLEMENTED_AWAITING_OWNER_CROSS_PLATFORM_RUNTIME
implementation_status: IMPLEMENTED_AWAITING_OWNER_CROSS_PLATFORM_RUNTIME
last_updated: 2026-08-30
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
language: vi
scope:
  - mobile_mvp
  - epic_02
  - us_02_09
  - cross_platform_runtime_evidence
  - process_relaunch_persistence
  - epic_exit_audit
authority: PLANNING
story_baseline: ./EPIC-02_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
evidence_baseline: ./EPIC-02_IMPLEMENTATION_EVIDENCE.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
adr_mobile_runtime: ../architecture/decisions/ADR-001-mobile-runtime-and-toolchain.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_delivery_pipeline: ../architecture/decisions/ADR-007-eas-delivery-pipeline.md
---

# US-02-09 — Cross-platform Evidence và Epic Exit Audit

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan authoritative dự kiến cho Story cuối của
`EPIC-02 — Durable Local Data, Migration và Safe Bootstrap`.

**Story outcome:** Một final committed graph có full automated evidence và một exact structured
runtime report trên cả iOS lẫn Android, gồm actual process relaunch persistence, migration/
constraint/repository/query/bootstrap/recovery/reset coverage và traceability tới toàn bộ Epic exit
gate. `EPIC-03` chỉ được mở sau khi owner review evidence và xác nhận không còn known blocker.

**Dependencies:** `US-02-01` đến `US-02-08` đều `DONE`. Latest implementation baseline là
`US-02-08` SHA `795c3cd59abf80225747e36fcc61e4d13afbaa14`, full `pnpm quality` pass
`24` files / `147` tests và exact iOS reset probe pass `12/12` với SQLite `3.50.3`.

**Priority:** `MUST` / `P3_EVIDENCE` / execution order `09` trong EPIC-02.

**Blocks:** `EPIC-02 DONE` và planning gate của `EPIC-03`. Story này không tạo Timer/Session
behavior; nó chỉ quyết định durable foundation hiện tại có đủ evidence để handoff hay chưa.

**Planning status:** `IMPLEMENTED_AWAITING_OWNER_CROSS_PLATFORM_RUNTIME`.
**Implementation status:** `IMPLEMENTED_AWAITING_OWNER_CROSS_PLATFORM_RUNTIME`.

Không có Product decision `OPEN` hoặc technical confirmation nào còn block implementation. Owner
đã duyệt đủ `US0209-CONFIRM-01`–`05` ngày 2026-08-29. Aggregate two-phase runner, exact component
contract validation, final normal-bootstrap gate, host integration tests, device validator và
cross-platform runbook đã hoàn tất ngày 2026-08-30. Full `pnpm quality` pass `25` files / `153`
tests. Story còn chờ owner chạy exact same-SHA scenario trên iOS và Android; agent không chạy
native/EAS build, prebuild, development client hoặc tạo native artifact.

### 0.1. Start gate

- [x] `US-02-01` đến `US-02-08` đã `DONE` với host + ít nhất một iOS runtime report mỗi Story.
- [x] Exact `US-02-08` implementation SHA/report đã được owner cung cấp và review.
- [x] Data Model `1.0.0 APPROVED`; `DM-OPEN-001`–`007` đều `RESOLVED`.
- [x] `EPIC02-INPUT-01`–`03` đều `RESOLVED`.
- [x] Không có migration `002`, Product behavior hoặc provider integration cần thiết để bắt đầu audit.
- [x] Chỉ planning `US-02-09` active; `EPIC-03` chưa được mở.
- [x] Owner duyệt `US0209-CONFIRM-01`–`05` ngày 2026-08-29.

## 1. Baseline và current-state review

### 1.1. Authority contract

| Authority | Contract áp dụng cho `US-02-09` |
|---|---|
| `EPIC-02_USER_STORIES.md` | Root quality + full automated matrix + owner-run iOS/Android evidence + consolidated exit audit. |
| `MVP_EPICS.md` EPIC-02 | Chỉ đóng Epic khi schema/migration/bootstrap/recovery/reset integration evidence đủ; `EPIC-03` phụ thuộc `EPIC-02 DONE`. |
| `MVP_EPICS.md` §8 | Epic Done cần end-to-end outcome, all mandatory Stories, architecture/offline/recovery/privacy/device evidence và zero known blocker. |
| Data Model §13 | Migration, constraint, repository/query, queue, retention, reset, mobile và device/simulator test matrix. |
| Data Model §14–15 | Normative acceptance/edge cases phải map về implementation evidence; approval không thay test. |
| Technical Overview §10.4 | Device acceptance chạy ít nhất một iOS target và một Android target; lifecycle/relaunch là rủi ro bắt buộc phù hợp scope. |
| Technical Overview §10.5 | Native change cần binary mới; credentials/generated artifact không nằm trong repository. |
| ADR-001 | Acceptance dùng Expo Development Build, không dùng Expo Go cho native capability; iOS/Android cùng shared core. |
| ADR-003 | SQLite là durable truth; in-memory projection phải rebuild được sau relaunch. |
| ADR-007 | EAS/native compatibility boundary và remote credential policy; Story này không sở hữu release build/submit. |

### 1.2. Evidence hiện có

- Root `pnpm quality` sau `US-02-08` pass `24` files / `147` tests, gồm typecheck, lint, Vitest,
  device-harness validation, architecture boundaries, repository hygiene và immutable migration.
- Tám dev-only Expo SQLite probe đã cover kernel, initial schema, forward migration, bootstrap,
  repositories, derived queries, recovery và confirmed reset trên isolated databases.
- Tám Story đã có exact iOS runtime evidence, nhưng ở các implementation SHA khác nhau. Chúng là
  evidence hợp lệ cho từng Story, chưa thay cho final both-platform exit run trên cùng graph.
- Mỗi existing native probe dùng production adapter/coordinator tương ứng, stable assertions,
  `commitSha`, runtime SQLite version và exact isolated cleanup.
- Host matrices đã cover empty/latest/synthetic migration, checksum/gap/newer history, failed
  migration/history write, constraints, repository round-trip, query exclusions, queue bounds,
  failure/Retry và reset statement-fault rollback.
- Chưa có exact Android runtime evidence cho durable-data graph.
- Existing close/reopen assertions chứng minh database connection persistence trong một process;
  chưa có one-probe, two-launch evidence chứng minh rows survive actual process termination/relaunch.
- Repository hiện pin Expo SDK `57`, React Native `0.86.3`, `expo-sqlite ~57.0.2`, app version/
  runtime `0.1.0` và iOS/Android application ID `com.dragonc92team.pixeldoro`.

### 1.3. Gap phải đóng trong Story này

| ID | Gap hiện tại | Hướng xử lý trong plan |
|---|---|---|
| `US0209-GAP-01` | Evidence phân tán qua tám Story/SHA, chưa có final-graph audit. | Add one consolidated traceability record và final-SHA aggregate native runner. |
| `US0209-GAP-02` | Chưa có Android Expo SQLite runtime report. | Owner chạy approved Android development target trên exact same final SHA. |
| `US0209-GAP-03` | iOS evidence cũ không chứng minh full final graph sau mọi Story. | Owner chạy aggregate final probe lại trên iOS; prior reports chỉ làm supporting evidence. |
| `US0209-GAP-04` | Close/reopen database chưa phải OS process relaunch. | Add two-phase persistent sentinel và require force-stop/terminate + reopen thật. |
| `US0209-GAP-05` | Physical disk-full khó tạo deterministic và có thể gây hại target. | Bắt buộc injected write/unavailable evidence; ghi explicit limitation cho physical disk-full nếu không chạy. |
| `US0209-GAP-06` | Chưa có binary/runtime freshness record cho mỗi target. | Report app/application/runtime/SQLite/OS/target kind; rebuild only when installed native runtime is stale. |
| `US0209-GAP-07` | Epic completion checklist chưa được chuyển thành final pass/blocker table. | Criterion-to-evidence audit + owner exit decision trước khi đổi status Epic. |

### 1.4. Review findings và scope traps

1. “Cross-platform” không có nghĩa cần chạy mọi synthetic failure trên native. Host deterministic
   matrix vẫn authoritative cho exhaustive fault injection; native chứng minh Expo SQLite/runtime
   parity và representative critical paths.
2. Tám iOS reports trước đây vẫn có giá trị, nhưng không thể thay một final-SHA iOS run vì graph đã
   thay đổi sau từng Story và `US-02-09` sẽ thêm harness orchestration.
3. `close()` rồi `open()` trong cùng JS process không đủ cho process-kill acceptance. Exit harness
   phải persist stage/sentinel, dừng ở explicit `AWAITING_RELAUNCH`, rồi validate ở launch kế tiếp.
4. Không được làm đầy storage thật chỉ để “pass disk-full”. Nếu target/runtime không cung cấp cách
   an toàn và deterministic, record `NOT_RUN_UNSAFE_OR_NONDETERMINISTIC` cùng injected equivalent; không
   biến limitation thành pass giả.
5. Native dependency/config không dự kiến đổi trong Story. Existing valid development client được
   reuse; owner chỉ rebuild nếu installed binary thiếu current SQLite/config/runtime compatibility.
6. Simulator/emulator là target hợp lệ theo Story baseline. Minimum-device/performance matrix rộng
   hơn thuộc release hardening/EPIC-12, không được kéo vào Epic 2.
7. Aggregate probe phải dùng isolated databases và production adapters; không đọc/reset database
   người dùng, không expose probe ở production hoặc current UI.
8. “Epic exit audit” có thể kết luận `BLOCKED`; plan không được tự đánh dấu `DONE` chỉ vì commands
   chạy xong. Known blocker phải được sửa và evidence chạy lại trên final behavior SHA.

## 2. Proposed technical directions cần owner xác nhận

### TD-02-09-A — Aggregate final-SHA evidence thay vì tám manual command rời

- Add one dev-only `US-02-09_EPIC_EXIT` runner behind exact explicit flag.
- Runner reuse/invoke tám existing production-backed probe functions in deterministic order; không
  copy schema/business rules hoặc tạo database adapter thứ hai.
- Final report chỉ pass khi mọi component report pass với exact frozen assertion surface và cleanup.
- Cả iOS/Android final report phải có cùng 40-character behavior/harness `commitSha`; docs-only
  closeout sau report không làm stale evidence.
- Bất kỳ change nào tới production behavior, migration, dependency/config, probe/harness hoặc test
  contract sau một platform report đều invalidate cả platform pair và yêu cầu chạy lại hai bên.

### TD-02-09-B — Two-phase actual process-relaunch contract

- Aggregate runner dùng một exact isolated exit-audit database và persisted sentinel/stage.
- Phase 1 migrate/verify DB, write a bound sentinel + exact commit/platform/app/runtime identity,
  close connection và emit structured `AWAITING_RELAUNCH`; chưa emit `passed: true`.
- Owner phải force-stop/terminate app process rồi reopen cùng build/flag; Metro reload, Fast Refresh,
  navigation reload hoặc chỉ close/reopen connection không được tính.
- Phase 2 reopen same isolated DB, validate sentinel/stored identity, run aggregate component matrix,
  validate normal bootstrap can still reach ready, close and delete exact probe databases.
- Commit/platform/application/runtime mismatch giữa phase 1/2 fail closed và không được sửa sentinel
  để tiếp tục. Owner cleanup exact probe DB rồi restart scenario từ phase 1.

### TD-02-09-C — Failure evidence và physical disk-full limitation

- Host remains exhaustive source cho statement-by-statement failure, unavailable/read/write,
  rollback fingerprint và recovery/reset matrices.
- Native aggregate phải cover representative injected unavailable/write failure through production
  recovery/transaction boundaries; durable before/after fingerprint và Retry vẫn bắt buộc.
- Physical disk-full/OS storage exhaustion chỉ chạy khi owner có safe deterministic target method;
  không fill disk của personal device, không corrupt application/user database.
- Nếu không khả thi, evidence record ghi `NOT_RUN_UNSAFE_OR_NONDETERMINISTIC`, reason/risk và deterministic
  substitute đã pass. Đây là documented limitation, không phải failed Story nếu mọi app-controlled
  invariant/transaction path đã có evidence.
- OS uninstall/storage corruption/device loss tiếp tục ngoài app-controlled durability promise.

### TD-02-09-D — Minimum target/build/runtime matrix

- Required pair: ít nhất một iOS device/simulator và một Android device/emulator được Expo
  Development Build hỗ trợ; Expo Go không được tính.
- Mỗi run record `platform`, `osVersion`, `targetKind`, `appVersion`, `runtimeVersion`,
  `applicationId`, `commitSha`, `sqliteVersion` và exact assertions.
- Cả hai target dùng same final behavior SHA và compatible native graph. OS/version không cần giống
  nhau; SQLite result semantics/assertions phải tương đương.
- Không bắt buộc EAS build. Owner có thể dùng existing compatible dev client hoặc local development
  build; agent không chạy native/EAS/prebuild.
- Nếu dependency/config/plugin/runtime đã đổi so với installed client, owner refresh development
  build trước evidence. Generated `ios/`, `android/`, binary, credential hoặc artifact không commit.

### TD-02-09-E — Epic exit decision và handoff authority

- Consolidated evidence maps từng EPIC-02 completion criterion, Story acceptance và relevant Data
  Model test row tới exact host/native evidence or explicit limitation.
- `US-02-09` chỉ `DONE` khi host quality pass trên final graph, iOS + Android final reports pass,
  repository audit sạch và không còn known durable/bootstrap blocker.
- Owner review/approve exit audit là explicit close gate. Agent không tự đổi `EPIC-02 DONE` chỉ dựa
  documentation hoặc một platform report.
- Khi approved: update `US-02-09`, `EPIC-02_USER_STORIES`, consolidated evidence và EPIC-02
  checklist/status trong `MVP_EPICS.md`; sau đó mới mở planning `EPIC-03`.
- Nếu một platform khác biệt hoặc criterion thiếu evidence, giữ Story/Epic incomplete, classify
  blocker và sửa upstream/harness tối thiểu; không waive ngầm hoặc mở Timer/Session implementation.

## 3. Owner confirmations

| ID | Cần xác nhận | Đề xuất | Trạng thái |
|---|---|---|---|
| `US0209-CONFIRM-01` | Aggregate runner và exact same final-SHA invalidation policy | Duyệt TD-02-09-A | `APPROVED 2026-08-29` |
| `US0209-CONFIRM-02` | Two-phase sentinel + actual force-stop/relaunch semantics | Duyệt TD-02-09-B | `APPROVED 2026-08-29` |
| `US0209-CONFIRM-03` | Injected failure bắt buộc và physical disk-full documented limitation | Duyệt TD-02-09-C | `APPROVED 2026-08-29` |
| `US0209-CONFIRM-04` | One iOS + one Android Development Build target/runtime matrix | Duyệt TD-02-09-D | `APPROVED 2026-08-29` |
| `US0209-CONFIRM-05` | Owner-controlled Epic exit audit và EPIC-03 handoff gate | Duyệt TD-02-09-E | `APPROVED 2026-08-29` |

Đây là technical/evidence decisions. Không có `OPEN-001`, `OPEN-006` hoặc `OPEN-009` bị chốt;
nếu owner không duyệt một proposal, chỉ direction tương ứng được sửa trước implementation.

## 4. In scope và out of scope khóa cho implementation

### 4.1. In scope

- Consolidated criterion-to-evidence inventory cho `US-02-01`–`08` và EPIC-02 exit checklist.
- Dev-only aggregate runner reuse tám existing isolated Expo SQLite probes.
- Two-phase isolated persistent sentinel cho actual process terminate/relaunch.
- Stable cross-platform report contract và component-probe aggregation.
- Host audit/fill evidence gaps nếu criterion hiện có chưa trace được.
- Root quality, boundary, repository hygiene, migration checksum và scope audits.
- Owner manual iOS/Android Development Build runbook.
- Explicit safe limitation record cho physical disk-full nếu không deterministic.
- Evidence reconciliation, blocker classification, owner exit review và documentation closeout.

### 4.2. Out of scope

- Timer/Session start/cancel/reconcile/complete/reward behavior hoặc production command.
- Pet, Gamification, History UI, Shop, Settings confirmation hoặc Product feature integration.
- Migration/schema `002`, schema repair/downgrade hoặc database salvage/export.
- New production repository/query/reset/recovery behavior trừ bug fix bắt buộc được audit phát hiện.
- PostHog, notification, feedback, store-review provider delivery hoặc remote diagnostics.
- EAS build/submit/update, signing/credential operation, TestFlight/Google Play artifact.
- Agent-run native build/prebuild/emulator/device control.
- Filling physical device storage, corrupting user database hoặc destructive device setup.
- Full minimum/current device/performance/release matrix của `EPIC-12`.

## 5. Authoritative execution order cho solo developer

| Order | Task | Gate/output | Blocks |
|---:|---|---|---|
| `T00` | Owner confirmation gate | `CONFIRM-01`–`05` approved | Tất cả implementation task |
| `T01` | Final traceability inventory | Every Epic/Story/Data Model criterion mapped or gap declared | T02–T05 |
| `T02` | Host evidence stabilization | Missing deterministic tests only; stable commands/matrix | T03–T06 |
| `T03` | Two-phase aggregate native harness | Phase 1 sentinel → real relaunch → phase 2 aggregate report | T04–T07 |
| `T04` | Cross-platform report + failure limitation contract | Frozen metadata/assertions; no fake disk-full evidence | T05–T08 |
| `T05` | Manual runbook + device-harness validation | Non-destructive iOS/Android procedure ready | T06–T08 |
| `T06` | Final host quality/repository audit | Exact final behavior SHA ready for native run | T07–T08 |
| `T07` | Owner iOS evidence | Two-phase final report on final SHA | T08 |
| `T08` | Owner Android evidence | Equivalent two-phase report on same final SHA | T09 |
| `T09` | Epic exit audit + blocker review | Full criterion table and owner decision | T10 |
| `T10` | Closeout/handoff | US-02-09 + EPIC-02 DONE; EPIC-03 planning gate open | Story/Epic complete |

Chỉ một task/Story active tại một thời điểm. `MUST` là MVP requirement; `P3_EVIDENCE` là
dependency priority; bảng trên là execution order thực tế. Owner có thể chạy Android trước iOS nếu
thuận tiện, nhưng cả hai report phải tồn tại trước `T09`; tài liệu giữ `T07 → T08` để có một thứ tự
authoritative duy nhất cho solo workflow.

### 5.1. Rationale cho order

1. Inventory đi trước code để Story không tạo test/harness dư thừa cho evidence đã có.
2. Host gap đóng trước native để owner không phải debug deterministic logic trên thiết bị.
3. Relaunch state machine được xây trước report/runbook để manual procedure và assertions cùng một
   contract, không dựa hướng dẫn prose không kiểm chứng.
4. Freeze report rồi mới chạy final quality; SHA sau `T06` là behavior/harness baseline cho cả hai
   platform.
5. iOS/Android reports là input cho exit audit, không phải nghi thức sau khi Epic đã được đóng.
6. EPIC-03 chỉ mở sau explicit owner review để không chuyển known durable blocker sang Timer/Session.

## 6. Task checklist chi tiết

### US0209-T00 — Decision gate

- [x] Owner duyệt `US0209-CONFIRM-01`–`05` ngày 2026-08-29.
- [x] Update plan qua `READY_FOR_IMPLEMENTATION` trước implementation.
- [x] Snapshot worktree và preserve unrelated owner/documentation changes.

### US0209-T01 — Traceability inventory và gap classification

- [x] Map 11 EPIC-02 completion criteria tới exact Story/host/native evidence.
- [x] Map 12 `US-02-09` acceptance criteria và Data Model §13 relevant rows.
- [x] Inventory current tests, eight probe contracts và migration checksum evidence theo
  capability; không cần list từng test nếu stable suite/file grouping trace đủ.
- [x] Classify gap thành `MISSING_TEST`, `MISSING_NATIVE_PARITY`, `LIMITATION` hoặc `BLOCKER`.
- [x] Verify prior iOS reports/assertions/SHA remain preserved as supporting evidence.
- [x] Confirm no `OPEN`/`DEFERRED` field/fixture và no product history background prune.

### US0209-T02 — Host evidence stabilization

- [x] Run targeted audit trước; chỉ add automated test nếu criterion không có deterministic evidence.
- [x] Preserve exact empty/latest/synthetic/incompatible migration matrix.
- [x] Preserve constraint, repositories, derived query, retention, recovery/Retry và reset matrices.
- [x] Add aggregate contract tests without duplicating schema/business rules.
- [x] Verify all probe functions return stable passed/assertion/metadata contracts and cleanup.
- [x] Không thay production behavior chỉ để thuận tiện cho report; không phát hiện bug/blocker mới.

### US0209-T03 — Two-phase aggregate Expo SQLite harness

- [x] Add explicit dev-only `EXPO_PUBLIC_EPIC_02_EXIT_PROBE=1` gate; production/default boot no-op.
- [x] Use exact isolated exit database and static name; never inspect/mutate default product DB.
- [x] Phase 1 migrate/verify, persist bound sentinel + final identity, close and emit
  `AWAITING_RELAUNCH` without success.
- [x] Phase 2 validate same platform/application/runtime/commit + sentinel after relaunch.
- [x] Sequentially invoke/reuse `US-02-01`–`08` probe functions and validate exact reports.
- [x] Verify normal bootstrap/readiness after aggregate diagnostics and no probe leakage.
- [x] Close idempotently and delete only exact isolated/component probe DBs after success/failure.
- [x] Handle stale/mismatched phase deterministically with safe exact cleanup/restart guidance.

### US0209-T04 — Report contract và failure/limitation evidence

- [x] Freeze phase-1 and final report schemas, metadata and stable assertion IDs.
- [x] Include platform/OS/target kind/app/runtime/application/SHA/SQLite identity.
- [x] Require exact component probe IDs, passed state and assertion completeness.
- [x] Carry representative write/unavailable/fingerprint/Retry/reset rollback facts into final result.
- [x] Add explicit physical disk-full status: `RUN_ON_ISOLATED_TARGET_AND_PASSED`,
  `RUN_ON_ISOLATED_TARGET_AND_FAILED` hoặc `NOT_RUN_UNSAFE_OR_NONDETERMINISTIC`; không dùng
  ambiguous boolean.
- [x] Test report has no SQL, row payload, anonymous/session ID, stack, credential or raw exception.

### US0209-T05 — Cross-platform manual runbook và validation

- [x] Write one non-destructive runbook cho iOS và Android, including prerequisites and cleanup.
- [x] Explain existing compatible dev client vs mandatory refresh after native/config mismatch.
- [x] Explain phase 1 signal, actual force-stop/terminate, phase 2 reopen and final log capture.
- [x] Record exact `git rev-parse HEAD`, target kind, OS, runtime and application identity.
- [x] Explain safe automatic exact-probe cleanup; never delete app/user DB.
- [x] Extend device-harness validator for new flag, runner, DB name, assertion/report contract.
- [x] Confirm default/production startup cannot execute aggregate or component probes.

### US0209-T06 — Final host quality và repository audit

- [x] Run targeted aggregate/relaunch/report tests with pinned Node `22.23.2` / pnpm `11.24.0`.
- [x] Run root `pnpm quality`: `25` files / `153` tests pass ngày 2026-08-30.
- [x] Run `git diff --check`, boundary, repository hygiene and immutable migration checksum.
- [x] Audit no migration `002`, Product behavior, provider SDK or probe production exposure.
- [x] Audit no generated `ios/`, `android/`, binary, signing material or credential in tracked diff.
- [x] Commit behavior/harness baseline and freeze exact SHA before native evidence.

### US0209-T07 — Owner iOS final evidence

- [ ] Owner dùng compatible iOS Development Build; refresh manually only if required.
- [ ] Run phase 1, terminate actual app process, reopen and obtain final `passed: true` report.
- [ ] Report metadata/assertions/component probes complete và `commitSha` equals frozen SHA.
- [ ] Record target kind/OS/runtime/SQLite version and any safe failure limitation.
- [ ] Verify cleanup/default UI after probe; send structured reports to review.

### US0209-T08 — Owner Android final evidence

- [ ] Owner dùng compatible Android Development Build; refresh manually only if required.
- [ ] Run exact same two-phase process-relaunch scenario on same frozen SHA.
- [ ] Final assertions/component probes equivalent to iOS; platform-specific metadata may differ.
- [ ] Record target kind/API/OS/runtime/SQLite version and any safe failure limitation.
- [ ] Verify cleanup/default UI after probe; send structured reports to review.
- [ ] Any Android-only failure is blocker/gap, không được waive bằng iOS pass.

### US0209-T09 — Consolidated Epic exit audit

- [ ] Reconcile both final reports against frozen SHA and exact assertion contract.
- [ ] Populate criterion-to-host/iOS/Android evidence table and limitation register.
- [ ] Confirm every `US-02-01`–`09` Story `DONE` and all mandatory acceptance mapped.
- [ ] Confirm no known migration/bootstrap/persistence/recovery/reset blocker or crash.
- [ ] Confirm architecture, offline, recovery, accessibility/privacy boundary evidence proportional
  to EPIC-02 scope.
- [ ] Present `PASS_READY_TO_CLOSE` or explicit blocker list to owner; request exit approval.

### US0209-T10 — Closeout và EPIC-03 handoff

- [ ] Owner explicitly approves EPIC-02 exit audit.
- [ ] Mark `US-02-09 DONE`; update plan, Story baseline and consolidated evidence.
- [ ] Check EPIC-02 completion checklist/status in `MVP_EPICS.md` only after evidence approval.
- [ ] Record documentation-only closeout does not stale frozen behavioral reports.
- [ ] Open planning gate `EPIC-03`; do not implement Timer/Session in closeout turn.

## 7. Planned file impact

| Khu vực | Planned impact |
|---|---|
| `apps/mobile/src/composition/diagnostics/` | Aggregate exit runner, two-phase sentinel/report orchestration; reuse existing probes. |
| `apps/mobile/src/composition/create-mobile-application.ts` | One dev-only explicit exit-probe flag and lazy wiring. |
| `apps/mobile/test/` | Aggregate/relaunch/report contract tests or minimal missing evidence tests only. |
| `apps/mobile/test/device/` | `epic-02-exit-smoke.md` and validator updates for both platforms/two phases. |
| `docs/planning/US-02-09_IMPLEMENTATION_PLAN.md` | Confirmation, implementation, native and closeout status. |
| `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md` | Final traceability, two reports, limitations and exit decision. |
| `docs/planning/EPIC-02_USER_STORIES.md` | Story status/acceptance closeout. |
| `docs/planning/MVP_EPICS.md` | EPIC-02 completion/status only after owner exit approval. |

Tên file có thể đổi nhỏ khi implement nhưng evidence semantics, isolated database ownership và
same-SHA gate không đổi.

**Không planned:** production migration/repository/use case, migration `002`, Product UI/behavior,
provider SDK, native dependency/config, EAS pipeline change hoặc tracked native artifact.

## 8. Acceptance và evidence matrix

| Story acceptance | Host/repository evidence | iOS + Android evidence |
|---|---|---|
| Root quality/test/boundary pass | Pinned `pnpm quality`, exact counts, diff/hygiene/checksum | Final report SHA matches committed graph |
| Migration matrix complete | Existing empty/latest/synthetic/incompatible/rollback suites | Aggregate component probe passes on both platforms |
| Constraint matrix complete | Real SQLite FK/check/index/trigger/immutability suites | Initial schema/repository component reports pass |
| Repository/query matrix complete | Round-trip, transaction, query/exclusion/queue/retention suites | Repository + derived-query reports equivalent |
| Recovery/reset matrix complete | Fault/fingerprint/Retry + per-statement reset rollback | Recovery + reset component reports equivalent |
| iOS durable runtime | Host contract validates metadata/assertions | Actual iOS two-phase final report |
| Android durable runtime | Host contract validates metadata/assertions | Actual Android two-phase final report |
| Write/disk/unavailable | Exhaustive injected matrix + explicit limitation record | Representative safe injected path; no fake physical pass |
| Native freshness/artifact policy | Config/lockfile/hygiene/tracked-file audit | Dev-build/runtime/application identity recorded |
| No OPEN/DEFERRED scope | Schema/fixture/source audit | Aggregate final schema/component assertions |
| Full Epic mapping | Criterion-to-evidence table completeness test/review | Both reports linked to same criteria |
| No known blocker/owner gate | Audit outputs + blocker register | Owner reviews pair and approves exit |

### 8.1. Frozen phase-1 report contract

```json
{
  "probe": "US-02-09_EPIC_EXIT",
  "status": "AWAITING_RELAUNCH",
  "phase": "sentinel_committed",
  "platform": "ios-or-android",
  "osVersion": "owner-runtime",
  "targetKind": "device-or-simulator-or-emulator",
  "appVersion": "0.1.0",
  "runtimeVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "40-character-final-implementation-sha",
  "sqliteVersion": "runtime-value",
  "nextAction": "terminate_and_relaunch_same_build",
  "assertions": [
    "exit_probe_database_opened_and_migrated",
    "persistent_sentinel_committed_before_relaunch",
    "sentinel_connection_closed_before_relaunch"
  ]
}
```

Phase 1 không có `passed: true`. Owner chỉ tiếp tục khi exact report cho biết sentinel đã commit và
connection đã close. Hot/Fast Refresh không được tính là relaunch.

### 8.2. Frozen final report contract

```json
{
  "probe": "US-02-09_EPIC_EXIT",
  "passed": true,
  "phase": "completed_after_relaunch",
  "platform": "ios-or-android",
  "osVersion": "owner-runtime",
  "targetKind": "device-or-simulator-or-emulator",
  "appVersion": "0.1.0",
  "runtimeVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "40-character-final-implementation-sha",
  "sqliteVersion": "runtime-value",
  "physicalDiskFullStatus": "NOT_RUN_UNSAFE_OR_NONDETERMINISTIC",
  "componentProbes": [
    "US-02-01_SQLITE_KERNEL",
    "US-02-02_INITIAL_SCHEMA",
    "US-02-03_FORWARD_MIGRATION",
    "US-02-04_SAFE_BOOTSTRAP",
    "US-02-05_TYPED_REPOSITORIES",
    "US-02-06_DERIVED_QUERIES",
    "US-02-07_FAILURE_RECOVERY",
    "US-02-08_CONFIRMED_RESET"
  ],
  "assertions": [
    "exit_probe_database_opened_and_migrated",
    "persistent_sentinel_survived_actual_process_relaunch",
    "all_component_probes_passed_with_exact_assertions",
    "migration_and_schema_safety_were_cross_platform_equivalent",
    "constraints_repositories_and_queries_were_cross_platform_equivalent",
    "bootstrap_recovery_retry_and_reset_were_cross_platform_equivalent",
    "representative_unavailable_and_write_failures_preserved_durable_truth",
    "normal_boot_reached_ready_after_exit_probe",
    "no_open_or_deferred_schema_scope_was_detected",
    "runtime_identity_and_final_commit_were_verified",
    "probe_connections_closed_and_databases_cleaned"
  ]
}
```

Assertion IDs/component order đã freeze trong `T03`–`T04`. Final report không embed toàn bộ rows
hoặc 80+ component assertions; aggregate runner validate exact component contracts internally và
chỉ report pass atomically sau normal bootstrap `ready` + cleanup.

## 9. Failure, retry và evidence invalidation policy

- Phase-1 sentinel transaction failure emits typed failed report; không yêu cầu relaunch và không
  mutate app database.
- App terminated trước sentinel commit không được tính; next launch safely starts phase 1 again.
- Phase-2 missing/corrupt sentinel, platform/app/runtime/SHA mismatch fail closed; không auto-repair.
- Component probe failure stops final success, attempts exact isolated cleanup and retains failure
  identity without raw exception/SQL/row leakage.
- Cleanup failure yields `passed: false`; owner removes only documented exact probe DB before retry.
- Any product/migration/dependency/config/harness change after first platform report invalidates both
  reports. Documentation-only evidence/status changes do not invalidate behavior SHA.
- A platform-only result mismatch is a blocker until root cause/fix/re-run; iOS pass cannot waive
  Android failure or vice versa.
- No automatic product reset, schema repair, downgrade or destructive recovery during audit.
- Physical disk-full limitation must remain visible in final evidence; it cannot be silently omitted.

## 10. Definition of Done

- [x] `US0209-CONFIRM-01`–`05` approved và reflected trong plan.
- [x] `T01`–`T06` implementation/host/harness/runbook complete theo order.
- [x] Final root quality/boundary/hygiene/checksum pass trên frozen behavior SHA.
- [x] Aggregate probe reuses all eight component contracts without production exposure.
- [ ] Actual process relaunch sentinel pass on one iOS and one Android target.
- [ ] Both final reports pass exact contract trên same frozen SHA.
- [x] Deterministic unavailable/write/fingerprint evidence pass; physical disk-full limitation ghi rõ.
- [x] No migration `002`, Product behavior, provider/native dependency hoặc tracked native artifact.
- [ ] Consolidated audit maps all Epic criteria/Story acceptance/Data Model rows.
- [ ] Không còn known blocker/crash trong migration/bootstrap/durable-data outcome.
- [ ] Owner explicitly approves Epic exit; `US-02-09` và `EPIC-02` closeout hoàn tất.
- [ ] `EPIC-03` chỉ mở planning sau `EPIC-02 DONE`.

## 11. Handoff sau planning

1. `T00 → T06` đã hoàn tất; host quality pass và final behavior/harness commit được freeze.
2. Owner chạy two-phase probe theo
   `apps/mobile/test/device/epic-02-exit-smoke.md` trên iOS rồi Android bằng exact same SHA.
3. Agent không chạy native/EAS build; owner gửi hai final structured reports để review.
4. Agent reconcile evidence và trình exit audit; owner quyết định `PASS_READY_TO_CLOSE` hoặc blocker.
5. Chỉ sau explicit exit approval mới update `EPIC-02 DONE` và mở planning `EPIC-03`.

## 12. References

- `docs/planning/EPIC-02_USER_STORIES.md`, `US-02-09`, traceability và readiness
- `docs/planning/MVP_EPICS.md`, EPIC-02, EPIC-03 và §8 Definition of Epic Done
- `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`
- `docs/planning/US-02-01_IMPLEMENTATION_PLAN.md` đến `US-02-08_IMPLEMENTATION_PLAN.md`
- `docs/PIXELDORO_CORE_TRUTH.md`, platform/privacy/delivery baselines
- `docs/architecture/data-model.md`, §12.8–12.9, §13–15
- `docs/architecture/system-architecture.md`, §2, §4–7
- `docs/architecture/project-structure.md`, test/device layout và boundary rules
- `docs/architecture/technical-overview.md`, §2, §10.4–10.5
- `docs/architecture/decisions/ADR-001-mobile-runtime-and-toolchain.md`
- `docs/architecture/decisions/ADR-003-state-and-persistence.md`
- `docs/architecture/decisions/ADR-007-eas-delivery-pipeline.md`

## 13. Change log

### 0.3.0 — 2026-08-30

- Implement dev-only aggregate `US-02-09_EPIC_EXIT` runner reuse exact eight component probes.
- Add isolated two-phase migration/sentinel, strict runtime/target/final-SHA identity, fail-closed
  mismatch, normal-bootstrap-ready finalization và exact cleanup.
- Freeze sanitized phase/final reports, explicit physical disk-full limitation và exact component/
  assertion surfaces; missing target kind bị reject thay vì suy đoán.
- Add real host SQLite phase/relaunch/identity/assertion-drift/full-component tests, composition
  finalization test, cross-platform manual runbook và device-harness validation.
- Full `pnpm quality` pass `25` files / `153` tests; boundary `11` forbidden / `3` valid; repository
  hygiene pass với một immutable migration. Không native/EAS/prebuild hoặc generated artifact.
- Chuyển Story sang `IMPLEMENTED_AWAITING_OWNER_CROSS_PLATFORM_RUNTIME`; còn `T07`–`T10`.

### 0.2.0 — 2026-08-29

- Ghi nhận owner duyệt đủ `US0209-CONFIRM-01`–`05`.
- Khóa aggregate same-SHA probe, two-phase actual relaunch, deterministic failure/explicit
  disk-full limitation, one-iOS/one-Android Development Build matrix và owner Epic-exit authority.
- Chuyển plan sang `READY_FOR_IMPLEMENTATION`; implementation vẫn `NOT_STARTED`.
- Không triển khai harness hoặc chạy native/EAS/prebuild trong confirmation turn.

### 0.1.0 — 2026-08-29

- Tạo implementation plan sau `US-02-08 DONE` và exact iOS reset evidence được review.
- Review full host/native inventory và xác định gaps: final same-SHA pair, Android parity, actual
  process relaunch, runtime freshness, disk-full limitation và explicit Epic exit authority.
- Đề xuất năm confirmation cho aggregate probe, two-phase relaunch, failure limitation,
  iOS/Android target matrix và owner-controlled handoff.
- Đặt authoritative solo order `T00 → T10`; implementation `NOT_STARTED`.
- Không chỉnh production code, migration hoặc chạy native/EAS/prebuild trong planning turn.
