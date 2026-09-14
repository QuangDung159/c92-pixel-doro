---
document_id: PIXELDORO_EPIC_12_USER_STORIES
title: PixelDoro EPIC-12 — Hardening, Device Validation và Closed-beta Delivery User Stories
version: 0.2.0
status: IMPLEMENTATION_IN_PROGRESS_DEVICE_AND_DELIVERY_EVIDENCE_PENDING
date: 2026-09-14
last_updated: 2026-09-14
owner: Dũng Lư
branch: feats/epic-12
upstream: origin/feats/epic-12
planning_baseline_sha: 6a0fa42860a9134c1374867a33aa0d8b16d9bb89
planning_baseline_identity: EXACT_COMMITTED_PUSHED_SHA
worktree_at_audit: CLEAN
previous_epic: EPIC-11
previous_epic_status: DONE_OWNER_ACCEPTED
previous_epic_implementation_sha: deeaebf07f5edcb4d24ca1cfcc3e2ff5a9780ee0
start_gate: EPIC_11_DONE_OWNER_ACCEPTED_AND_MVP_FEATURE_COMPLETE
start_gate_status: MET_2026_09_14
implementation_opened_sha: aaee07fff999388920ebb3beb759567ac4f01c43
implementation_status: IN_PROGRESS
manual_device_status: NOT_RUN
schema_verdict: SCHEMA_001_SUFFICIENT_NO_MIGRATION_PLANNED
dependency_verdict: OWNER_APPROVED_12_EXPO_PATCH_ALIGNMENTS_APPLIED_NO_NEW_PACKAGE
native_config_verdict: NO_CONFIG_CHANGE_FRESH_NATIVE_BUILD_REQUIRED_AFTER_PATCH_ALIGNMENT
authority: PLANNING
product_truth: ../PIXELDORO_CORE_TRUTH.md
epic_baseline: ./MVP_EPICS.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model: ../architecture/data-model.md
manual_guide: ../../apps/mobile/test/device/epic-12-beta-readiness.md
implementation_report: ./EPIC-12_IMPLEMENTATION_REPORT.md
---

# EPIC-12 — Hardening, Device Validation và Closed-beta Delivery

## 1. Executive summary

EPIC-12 đưa Mobile MVP từ trạng thái feature-complete candidate sang một release candidate có thể
truy nguyên, có bằng chứng trên iOS/Android và có đường rollback. Owner đã xác nhận đóng EPIC-11 ngày
2026-09-14; authority hiện hành ghi `DONE_OWNER_ACCEPTED` và W3 `MVP_FEATURE_COMPLETE`, nên EPIC-12
được mở implementation tại exact pre-change SHA `aaee07fff999388920ebb3beb759567ac4f01c43`.
Việc mở implementation không suy ra device/release PASS hoặc `CLOSED_BETA_READY`.

Audit chọn tám vertical Story, theo thứ tự giảm release risk:

1. `US-12-01` — release-candidate truth, carry-over và freeze gate (`P0`).
2. `US-12-02` — automated hardening, data integrity và recovery (`P0`).
3. `US-12-03` — same-SHA iOS/Android aggregate durability (`P0`).
4. `US-12-04` — cross-feature offline/lifecycle/idempotency validation (`P0`).
5. `US-12-05` — accessibility, permission và device compatibility (`P1`).
6. `US-12-06` — Pet fallback và 30-minute performance benchmark (`P1`).
7. `US-12-07` — preview/runtime/OTA boundary và rollback rehearsal (`P0`).
8. `US-12-08` — internal distribution, closed-beta artifact và Epic exit (`P0`).

Số lượng này giữ mỗi Story có một outcome độc lập: candidate identity; automated integrity; native
durability parity; core journey correctness; inclusive/device compatibility; Pet performance; update
safety; và distribution/exit. Accessibility không bị trộn với performance; native durability không bị
trộn với EAS delivery; build distribution không bị trộn với code refactor.

Không production code, migration, dependency install, native config change, build, submit, commit hoặc
push được thực hiện trong task planning này. Mọi manual/device case chưa chạy tiếp tục là `NOT_RUN` hoặc
`BLOCKED`; automated evidence cũ chỉ là supporting evidence.

## 2. Git và start-gate audit

| Audit item | Kết quả tại 2026-09-14 |
|---|---|
| Repository | `/Users/dunglu/Documents/Working/c92-pixel-doro` |
| Branch / upstream hiện hành | `feats/epic-12` / `origin/feats/epic-12` |
| Exact planning baseline | `6a0fa42860a9134c1374867a33aa0d8b16d9bb89` |
| HEAD/upstream parity | Cùng exact SHA tại thời điểm audit |
| Worktree trước planning | Clean; không có owner change chưa commit cần chạm hoặc ghi đè |
| Candidate EPIC-11 implementation | `deeaebf07f5edcb4d24ca1cfcc3e2ff5a9780ee0` |
| Diff candidate → planning HEAD | Chỉ docs và device-validator metadata; không có production source change |
| EPIC-01→10 | `DONE_OWNER_ACCEPTED` theo roadmap/Exit Reports hiện hành |
| EPIC-11 | `DONE_OWNER_ACCEPTED`; authority và Exit Report đã ghi closure ngày 2026-09-14 |
| `MVP_FEATURE_COMPLETE` | Đạt; `MVP_EPICS.md` ghi W3 feature delivery complete |
| EPIC-12 start gate | **ĐÃ ĐẠT** |
| Current state | `IMPLEMENTATION_IN_PROGRESS / DEVICE_AND_DELIVERY_EVIDENCE_PENDING` |

Gate record mở implementation:

1. EPIC-11 User Stories, Implementation Report và Exit Report đều ghi `DONE_OWNER_ACCEPTED`.
2. `MVP_EPICS.md` 3.5.0 ghi EPIC-01→11 đã accepted và W3 feature delivery complete.
3. Owner xác nhận trực tiếp ngày 2026-09-14 và yêu cầu triển khai EPIC-12.
4. Các confirmation còn lại trong §18 vẫn pending theo phạm vi của từng Story; không tự bật external
   service, tạo chi phí, build/submit hoặc chọn device/track thay owner.

Planning baseline không phải release-candidate SHA. RC SHA chỉ được freeze sau `US-12-02` và mọi change
được owner duyệt; mọi device/build/update artifact phải ghi exact SHA riêng.

## 3. Source hierarchy và audit coverage

Thứ tự authority khi có mâu thuẫn:

1. `docs/PIXELDORO_CORE_TRUTH.md` `ACTIVE` cho Product truth, MVP scope và acceptance.
2. ADR hiện hành, Architecture/Data Model `APPROVED`, rồi Specifications `APPROVED`.
3. `docs/planning/MVP_EPICS.md`, User Stories/Exit/Evidence/Implementation Reports đã accepted.
4. Code, test, build config và device guide hiện tại làm implementation evidence; code không được tự đổi
   product truth.
5. Prompt/task này chỉ yêu cầu audit/planning; không cấp quyền implementation hoặc release mutation.

Tài liệu đã audit gồm toàn bộ Product Core, MVP roadmap, Technical Overview, System Architecture,
Project Structure, Data Model, ADR-001→008, Timer Engine, Session Lifecycle, Pet State Machine,
Gamification Rules; mọi `EPIC-*_USER_STORIES.md`, Exit/Evidence/Implementation Report hiện có; kế hoạch
`US-02-01→09`; các report/plan được Epic records dẫn chiếu; toàn bộ guide trong
`apps/mobile/test/device`; validator hiện hành; production source/config/test inventory. Các marker
`NOT_RUN`, `BLOCKED`, `DEFERRED_TO_EPIC_12`, `TRANSFERRED_TO_EPIC_12` và tương đương được giữ nguyên
ý nghĩa, không đổi thành `PASS`.

## 4. Current implementation audit

### 4.1. Route/screen inventory

Production navigation hiện có:

- Entry/onboarding: `/`, `/(onboarding)`.
- Tabs: Home `/(tabs)`, History, Shop, Settings.
- Core flow: `/focus/setup`, `/focus/session`, `/focus/result`, `/break/session`.
- Research/operational: `/feedback`.
- Route helpers: Pet visibility, notification-navigation bridge, terminal branch composition và
  cancel/back handling.

Route files hiện chủ yếu đọc router params, gọi facade/controller hook, bố trí branch và dispatch
navigation sau committed result. Không thấy SQL/repository/provider SDK trong production screen/route.
`focus/session.tsx` là route phức tạp nhất (197 dòng) nhưng vẫn dưới split-review threshold; cần giữ
branch logic ở các typed arbitration/branch component thay vì tiếp tục phình to.

### 4.2. Capability classification

| Capability | Phân loại hiện tại | Evidence / gap chính | EPIC-12 disposition |
|---|---|---|---|
| Domain/Application boundaries | Production, reusable | Pure domain/use cases, ports, coordinator, typed results; boundary validator hiện có | Regress; không viết lại |
| SQLite schema/migration | Production, reusable nhưng cần release validation | Chỉ migration `001`, checksum lock, constraints/triggers/reset/recovery tests | Test released-schema/latest/downgrade-safe cases; không plan `002` |
| Bootstrap/readiness/recovery | Production nhưng cần hardening | Safe barrier/Retry/confirmed reset; formal kill/relaunch breadth thiếu | US-12-02/03/04 |
| Timer/session lifecycle | Production nhưng cần hardening | Timestamp reconciliation, Strict grace, cancel/completion serialization đã automated/quick-smoked | Same-SHA device/race/wall-clock matrix |
| Reward/purchase/equip | Production nhưng cần hardening | Atomic receipts, unique session/item, non-negative balance, offline reopen tests | Cross-feature race/idempotency matrix |
| Notification/sound/haptic | Production nhưng cần device validation | Expo adapters, settings gates, failure isolation; physical permission/silent-mode breadth thiếu | US-12-04/05 |
| Pet projection/rendering/assets | Production, reusable; final benchmark required | Cat Dev sheets, Reanimated, Reduce Motion and layered fallback; prior 30-min evidence at EPIC-04 SHA | Re-run on final RC/device slots in US-12-06 |
| Analytics privacy/queue | Production, reusable; live rollout deferred | 17-event allowlist, 1,000/7d queue, opt-out/rotate, direct HTTPS adapter; no live key | Fail-closed validation; PostHog live non-blocker unless re-enabled |
| Feedback | Production UI/adapter; external activation prerequisite | HTTPS/idempotency/memory-only; live endpoint unset | Local unavailable case required; endpoint needed before real submissions |
| Store review | Production policy/adapter; native evidence missing | `expo-store-review` present; eligibility/caps tested; Development Build row `NOT_RUN` | US-12-05 native evidence |
| EAS/runtime profiles | Production baseline but delivery unproven | dev/preview/production channels, `appVersion` runtime; workflows exist | Preview/runtime/rollback rehearsal and track decision |
| Device fixtures/guides | Production-support, reusable | Broad isolated DB/env fixtures; validator recognizes through EPIC-11 only | Extend validator plan without weakening PASS rules |
| Common UI components | Production, reusable | Shell/header/panel/button/chip/dialog/status/Pet/toggle/grid/reward/progression contracts | Reuse and regress; no EPIC-12 redesign |
| Prototype scaffold | Retired in current US-12-01 candidate | Root no longer mounts `PrototypeProvider`; obsolete focus/break branches, screens, state/context and aliases removed; integrity tests updated | Repository validator rejects retired prototype source re-entry; owner/candidate SHA still pending |
| Closed-beta artifact/release notes | Missing | No final artifact manifest, known-issues/go-no-go record or actual distribution evidence | US-12-08 |
| Device/account/EAS/store access | External prerequisite | Availability not represented in repository | Owner confirmation and `BLOCKED` status when absent |
| PostHog live project | Deferred có owner approval | Cost decision on 2026-09-13; missing config must fail closed | Not a blocker unless owner reverses decision |
| Public launch/monetization/cloud/social | Không thuộc EPIC-12 | Product Core out of scope | Excluded |

### 4.3. Size and concentration audit

Current US-12-01 candidate đã tách
`presentation/providers/mobile-application-context.tsx` từ provider/hook file 334 dòng thành một stable
barrel và các module bootstrap/onboarding/feature/Pet có ownership riêng; public consumer import contract
không đổi và mọi production screen/component hiện <=300 dòng. Các concentration point khác không phải UI component nhưng có risk:
`composition/create-mobile-application.ts` (1,633), `application/shop/shop.controller.ts` (543),
`application/bootstrap/mobile-bootstrap.ts` (521), derived queries (496), Settings controller (468),
migration runner (350) và migration `001` (695). Không refactor chỉ để giảm line count trong EPIC-12;
file nào bị chạm để sửa blocker phải được tách theo capability/state ownership/test boundary, không chuyển
complexity sang god hook/helper. Composition root nên tách factory theo existing feature slice nếu
`US-12-02` cần sửa wiring.

## 5. Carry-over matrix EPIC-01 → EPIC-11

| Source | Exact requirement | Current status | Evidence hiện có | Evidence còn thiếu | Target | EPIC-12 owner | Beta blocker? | Owner confirmation | Điều kiện `PASS` |
|---|---|---|---|---|---|---|:---:|---|---|
| EPIC-01 evidence; ADR-001/007 | Compatible iOS/Android native graph và delivery baseline | Production config; historical development build evidence | Expo/RN pins, EAS profiles/workflows, prior builds | Fresh RC native build/runtime identity | iOS + Android | 07/08 | Yes | `EPIC12-CONFIRM-03/04/06` | Signed/internal artifacts bind exact RC SHA, runtime and intended track |
| EPIC-02 `US-02-09`; Evidence §19–21 | Final same-release-candidate-SHA aggregate durability parity | `TRANSFERRED_TO_EPIC_12`; iOS phase 1 only | 25/153 historical host, 8 component probes, iOS sentinel phase 1 | iOS phase 2 + full Android final pair on same RC | iOS/Android Dev Build | 03 | Yes | `CONFIRM-02/03` | Both final JSON reports pass exact contract/SHA and cleanup |
| EPIC-02/Data Model §13–14 | Every released schema → latest; gap/checksum/newer/rollback/recovery | Automated historical PASS; formal RC not run | Migration/constraint/fault tests, one immutable `001` | RC rerun, actual target parity, downgrade-safe evidence | Host + iOS/Android | 02/03 | Yes | `CONFIRM-11` if change needed | All deterministic cases pass; physical disk-full remains explicit limitation |
| Product Core §19; MVP Epics §6 | Cross-feature Mobile MVP acceptance audit | Incomplete/checklist mixed | Epic-specific automated and owner quick evidence | One traceable RC acceptance ledger without inferred PASS | Both platforms | 01/08 | Yes | `CONFIRM-01/12` | Every acceptance row links PASS evidence or approved non-blocking limitation; zero open blocker |
| EPIC-05 Exit §4 | Fresh/cancel/relaunch/offline/failure/a11y trial matrix | Formal tester deferred | 82/391, quick smoke, exact durable facts | Formal platform/device/assistive-tech rows | iOS/Android | 04/05 | Yes for core/a11y policy | `CONFIRM-03/10` | Exact RC rows executed; reward/exclusions remain exact |
| EPIC-06 Exit §6 | Relax/Strict, background/relaunch, grace, notification, a11y breadth | Formal physical/a11y deferred | 119/651 historical, simulator/emulator quick smoke | Physical/repr device matrix, boundary clock cases | iOS/Android | 04/05 | Yes | `CONFIRM-03` | Same RC terminal truth/reward/notification isolation passes |
| EPIC-07 Exit deferred checklist | Break allowed/denied/background/lock/tap, cancel/delivery, offline/a11y | `DEFERRED / NOT_RUN` | 152/817 historical, quick UI | Formal two-platform rows | iOS/Android | 04/05 | Yes | `CONFIRM-03` | Correct Break outcome/cadence/no reward under all states |
| EPIC-07 Exit | Expo Doctor network/CocoaPods evidence | Historical `18/21` | Quality/exports passed | Revalidate current dependencies/tooling with network-capable environment | Build environment | 02/07 | Conditional | `CONFIRM-11` | No incompatible dependency/config issue; deviations documented |
| EPIC-08 Exit deferred checklist | Physical purchase/equip/relaunch/offline and a11y matrix | `DEFERRED / NOT_RUN` | 179/918, real SQLite aggregate, quick smoke | Formal device + assistive technology | iOS/Android | 04/05 | Yes | `CONFIRM-03/10` | Atomic one-time purchase/owned/equip persists and remains accessible |
| EPIC-09 Exit deferred items | History/contribution physical, VO/TalkBack, Largest Text, grayscale, Reduce Motion | `NOT_RUN_DEFERRED_TO_EPIC_12` | 206/1,056, SQLite reopen, exports | Formal final visual/device rows | iOS/Android | 05 | Yes per a11y policy | `CONFIRM-10` | Correct data/bands and non-color-only semantics on RC |
| EPIC-09 Exit | SDK-57 patch drift/tooling debt | Resolved in current candidate; online Doctor `21/21` | Owner approved `CONFIRM-11=B`; exact 12 Expo patch alignments, lockfile, root quality and Doctor rerun PASS | Exact committed candidate + fresh native build/device evidence | Build env + iOS/Android | 02/03/07 | Yes before final artifact | `CONFIRM-11=B` recorded | Quality + Doctor remain green on frozen SHA; fresh native artifacts pass |
| EPIC-10 Exit/Report | Android physical permission/silent mode, VO/TalkBack/Largest Text/Reduce Motion | `NOT_RUN`; iOS build only historical | 212/1,080, iOS Dev Build with audio/haptic | Full platform permission/availability and accessibility | iOS/Android | 04/05 | Yes | `CONFIRM-03/10` | Off/unavailable never emits or blocks core; settings persist |
| EPIC-10 reset evidence | Reset failure/kill/relaunch and recovery | Automated historical PASS; formal device incomplete | Atomic reset/fingerprint/single-flight tests | RC device kill-before/after and normal-launch cleanup | iOS/Android | 04 | Yes | `CONFIRM-03` | No partial truth; rollback or committed fresh bootstrap only |
| EPIC-11 Report §5–6 | Formal device/accessibility breadth | `NOT_RUN_DEFERRED_TO_EPIC_12` | 222/1,115, aggregate quick UI | Detailed platform/build/a11y rows | iOS/Android | 04/05 | Yes for core flow | `CONFIRM-03/10` | Each row independently recorded; no aggregate inference |
| EPIC-11 native row `E11-NATIVE-01` | Store-review adapter availability/request in native Development Build | `NOT_RUN` | Policy/fake adapter automated PASS; package installed | Production-like native build evidence; OS prompt outcome not claimed | iOS/Android supported store context | 05 | Yes for native boundary | `CONFIRM-03/04/06` | Availability/call evidenced; attempt persists; prompt display remains OS-owned |
| EPIC-11 feedback | Live endpoint before collecting real submissions | Activation deferred | UI, controller, HTTPS adapter/local fake PASS | Owner endpoint, data owner/retention and preview synthetic request | Preview/production | 08 | Yes only before real feedback | `CONFIRM-05` | Approved HTTPS endpoint accepts one synthetic idempotent submission; no secret/content in evidence |
| ADR-008 / owner decision | Live PostHog activation | `LIVE_DEFERRED`, fail-closed | Adapter/queue/privacy contract PASS; no key | Nothing for core-only beta unless re-enabled | Provider EU | 08 optional | **No** while deferred | `CONFIRM-06` | Deferred: missing config creates zero request; enabled: separate project/retention/billing evidence |
| EPIC-04 Exit; ADR-005 | Static fallback + 30-minute Reanimated benchmark | Historical PASS at `5b3a182`, not RC | Approved assets, fallback/reduced-motion tests, old device matrix | RC minimum + representative device run with metrics | Min/repr iOS/Android | 06 | Yes | `CONFIRM-03/09` | 30m each slot; no crash/freeze >100ms, unbounded memory growth or unacceptable thermal/battery |
| ADR-007; workflows | Preview/runtime compatibility, OTA/native boundary, rollback/republish | Config exists; rehearsal not evidenced | `appVersion` runtime, channels, approval workflow | Same-runtime preview smoke, incompatible-native negative check, rollback rehearsal | EAS preview/target binary | 07 | Yes | `CONFIRM-06/08` | Artifact/update manifest matches runtime; stable update republished and verified |
| MVP EPIC-12 | Internal build and closed-beta artifact | Missing | EAS profiles; Android internal draft submit profile | Actual targets, iOS path, tester group/track, artifact manifest | TestFlight/Google Play or approved equivalent | 08 | Yes | `CONFIRM-04/07/08/12` | Intended testers install exact RC artifacts; notes/known issues/support/rollback owner recorded |
| EPIC-07/09 notes | Remaining prototype scaffolding retirement | Deferred until production owners replaced it; now replacements exist | Production routes for Focus/Break/History/Settings/Feedback exist | Reachability/static proof and safe removal/regression | Shared production graph | 01/02 | Yes | `CONFIRM-11` only if change expands | No production import/mount/route; full consumer regression passes |
| US-02-09 limitation | Physical disk-full | `NOT_RUN_UNSAFE_OR_NONDETERMINISTIC` | Deterministic unavailable/write/rollback tests | No destructive fill-device run required | Host/device | 02 | No if documented | `CONFIRM-12` | Limitation retained; no fake PASS; deterministic failure suite passes |

## 6. Risks và release blockers

| Risk | Severity | Detection/gate | Default disposition |
|---|---:|---|---|
| EPIC-11 not owner-closed | Critical | §2 start gate | Stop implementation; planning only |
| Evidence taken from different SHA/runtime | Critical | Candidate manifest + validator | Invalidate affected rows/builds and rerun |
| Durable parity differs by platform | Critical | US-12-03 | Stop release; fix root cause, freeze new RC, rerun both |
| Core truth changes under offline/lifecycle race | Critical | US-12-02/04 | No-go; preserve DB and add regression |
| Wrong OTA for native runtime | Critical | US-12-07 | Do not publish; create compatible binary/update |
| Prototype surface reachable/bundled as authority | High | static reachability + route smoke | Remove before RC; no UX redesign |
| Accessibility blocker or clipped core action | High | US-12-05 | No-go for affected supported target until fixed/retested |
| Pet renderer leak/thermal regression | High | US-12-06 | Disable nonessential motion/use still fallback; no Skia by default |
| Feedback endpoint absent while inviting real testers | High | US-12-08 | Block feedback-collecting rollout; core-only internal test may continue |
| Live PostHog accidentally sends/costs | High | missing-config network assertion | Keep fail-closed; do not add key |
| Closed-beta track misconfigured as production | Critical | distribution target manifest/manual approval | Stop submit; owner chooses exact track/group |
| Secrets/production data in evidence | High | repository/evidence scan | Redact/revoke as needed; regenerate safe artifact |

## 7. Prioritized Story map

| Order | Story | Priority | Primary release outcome | Depends on | Exit unlock |
|---:|---|---|---|---|---|
| 1 | `US-12-01` RC truth/carry-over/freeze gate | P0 | One authoritative candidate manifest and no prototype authority | EPIC-11 accepted + confirmations | Scoped hardening can begin |
| 2 | `US-12-02` Automated integrity/recovery hardening | P0 | Deterministic gate green; blocker fixes regression-locked | 01 | Freeze RC SHA |
| 3 | `US-12-03` Same-SHA native durability parity | P0 | iOS/Android US-02-09 final pair | 02/frozen SHA | Native durable gate |
| 4 | `US-12-04` Offline/lifecycle/idempotency journey | P0 | Core truth survives real device lifecycle/network/races | 03 | Core closed-beta candidate |
| 5 | `US-12-05` A11y/permission/device compatibility | P1 | Core flow usable across required assistive/permission states | 04 | Inclusive compatibility gate |
| 6 | `US-12-06` Pet fallback/performance | P1 | RC animation/fallback meets ADR-005 | 03; may execute after 05 | Visual/performance gate |
| 7 | `US-12-07` Preview/runtime/rollback rehearsal | P0 | Update can be promoted and recovered safely | 04–06 | Distribution-approved artifact |
| 8 | `US-12-08` Internal/closed-beta delivery and exit | P0 | Testers receive artifacts; handoff/go-no-go complete | 07 + all blockers | `CLOSED_BETA_READY` |

`US-12-05` và `US-12-06` có thể dùng cùng frozen build/device booking, nhưng solo execution vẫn ghi
kết quả theo từng Story và không chia sẻ `PASS` ngầm. Bất kỳ production, migration, dependency, native
config, harness hoặc acceptance-contract change sau freeze làm stale mọi downstream evidence bị ảnh
hưởng; documentation-only record update không đổi behavior SHA nhưng phải giữ link tới artifact cũ.

Implementation checkpoint 2026-09-14: `US-12-01/02` repository changes are implemented; root quality
passes and online Expo Doctor is `21/21` after owner-approved `CONFIRM-11=B` patch alignment. Exact
committed candidate/owner acceptance remain pending. `US-12-03→08` retain their `NOT_RUN`/blocked state.

## 8. Story details

### US-12-01 — Authoritative release-candidate truth, carry-over và freeze gate

| Field | Contract |
|---|---|
| Priority / release risk | `P0`; ngăn test nhầm SHA, bỏ sót debt, prototype lọt vào RC và false PASS |
| User/release outcome | Owner nhìn một manifest là biết source, native/runtime/config, evidence state và blocker của candidate |
| Source | `MVP_EPICS.md` §2.2–3.4, EPIC-12; Product Core §19; Project Structure §4–5; mọi Exit Report §Deferred |
| Dependency/order | EPIC-11 `DONE_OWNER_ACCEPTED`; blocking confirmations; Story đầu tiên |
| Current capability | Git/EAS metadata, reports, device fixtures và boundary validator đã tồn tại |
| Exact gap | Chưa có EPIC-12 RC manifest/acceptance ledger; prototype provider/branches vẫn hiện diện trong graph |
| Deliverables | RC manifest template; carry-over ledger; prototype reachability/removal evidence; invalidation policy; go/no-go checklist |
| Owner gate / confirms | Owner approves candidate-freeze policy and prototype disposition; `CONFIRM-01/02/11/12` |

**Scope and behavior.** In scope: reconcile authority with HEAD; map every carry-over to a case/Story;
identify production/config/native/test-contract files; prove prototype code is unreachable, then remove
root mount/dead branches in an authorized implementation change; generate one machine-readable or
strict Markdown candidate manifest. Out of scope: feature redesign, new gameplay, schema/dependency or
distribution. Happy path freezes a clean commit only after US-12-02 gates. Alternate path records a
non-blocking limitation/owner-approved deferred external prerequisite. Error path refuses freeze on
dirty tree, missing EPIC-11 closure, ambiguous SHA/runtime, prototype reachability or open P0 blocker.
Offline/background behavior is N/A except the manifest must enumerate the cases owned by later Stories.

**Ownership/impact.** Domain/Application/Infrastructure remain unchanged; Composition removes only
obsolete prototype wiring after proof; Presentation retains production screens/common components; route
files remain composition-only. Data/schema: none. Native/dependency/config: none. Privacy/security:
manifest contains no secret, anonymous ID, database rows or feedback text. Accessibility/performance:
no UI redesign; static line/reachability gates apply. UI reuse: existing production screens and common
components only; prototype aliases are not promoted.

**Fixtures, tests and evidence.** Fixture: no product DB; static source graph and exact Git metadata.
Automated: root quality, boundary/hygiene, dead-prototype import test, route inventory and line-count gate.
Update `apps/mobile/test/device/validate-device-harness.mjs` trong implementation của Story này để nhận
guide EPIC-12 và fail nếu thiếu required case ID, status vocabulary, exact-SHA/build/runtime/channel field,
cleanup/normal-launch instruction hoặc deferred-evidence marker. Validator chỉ kiểm cấu trúc/giá trị được
phép; nó không được tự đổi `NOT_RUN`/`BLOCKED` thành `PASS` hoặc coi presence của text là device evidence.
Manual: launch every production route once from a clean normal launch; status `NOT_RUN` until done.
Evidence: exact SHA, clean status, changed-file classification, manifest checksum, validator output and
screenshots only where route visibility matters.

**Acceptance criteria.** Given EPIC-11 is not closed, when freeze is requested, then it is rejected with
no implementation state change. Given a clean candidate and green US-12-02 gates, when manifest is
created, then commit SHA, app/runtime version, dependency lock, migration checksum, build profiles and all
open evidence are exact. Given production owners exist, when source reachability is checked, then no
production route/root provider imports or renders prototype state/control; removal does not alter approved
visual flow. Given any behavior/config/harness change, when evidence is reviewed, then affected downstream
rows become `NOT_RUN` and stale artifacts are not reused.

**Rollback, DoR, DoD and checklist.** Rollback restores only the prior presentation/composition wiring in
a forward fix if route regression appears; never restores prototype as durable authority or changes data.
DoR: start gate + confirmations + clean tree. DoD: manifest/reachability/carry ledger and all consumer
regressions pass; owner accepts frozen identity.

- [x] Start gate and `CONFIRM-01=A` approved; `CONFIRM-02/11/12` remain pending.
- [x] Every carry-over row has owner/case/blocker/PASS condition.
- [x] Prototype reachability removed with automated integrity/repository evidence.
- [ ] RC manifest freezes exact committed SHA only after US-12-02.
- [ ] Owner accepts the candidate identity; no manual case inferred.

### US-12-02 — Automated hardening, data integrity và safe recovery

| Field | Contract |
|---|---|
| Priority / release risk | `P0`; corrupt/partial/duplicated durable truth and startup failure |
| Outcome | Deterministic failure/race suite proves schema `001`, session/economy/privacy/reset correctness before device time is spent |
| Source | Data Model §1, §5–9, §11, §13–14; Timer §6–10; Session Lifecycle §8–10/14; System Architecture §6 |
| Dependency/order | US-12-01 audit gate; precedes freeze/native evidence |
| Current capability | Strong unit/SQLite/integration suite and failure injection already production-backed |
| Exact gap | Full current-HEAD rerun/traceability, patch-drift disposition, static size/reachability gates and any newly found blocker regression |
| Deliverables | Green automated matrix; blocker list/fixes if authorized; integrity fingerprint report; exact RC-freeze recommendation |
| Owner gate / confirms | `CONFIRM-11` for any schema/dependency/native/config change; no such change is planned |

**Scope and behavior.** In scope: current root quality; session start/cancel/complete races; Strict boundary;
reward/purchase/equip idempotency; queue opt-out races; migration empty/latest/checksum/gap/newer/rollback;
reset failure/rebootstrap; feedback unavailable; store-review caps; static boundaries/line audit. Out of scope:
physical disk fill, live providers, cosmetic refactor or unapproved dependency upgrades. Happy path yields
no production change. Alternate path allows a narrowly scoped bug fix with regression and new candidate.
Error path preserves database fingerprints, blocks freeze and records owner/action. Offline/relaunch facts
use real disposable SQLite close/reopen tests; physical process evidence stays US-12-03/04.

**Ownership/impact.** Domain owns pure decisions; Application owns coordinator/idempotency/recovery;
Infrastructure owns SQL/migration/adapters/faults; Presentation only maps typed states. Schema remains `001`.
No dependency/native/config change. Privacy tests prove fail-closed analytics, memory-only feedback and no
secret/content logs. Accessibility is static/component semantics here, not formal assistive-tech PASS.
Performance includes no busy loop, bounded queue and command completion thresholds recorded by test runner.
UI reuse: regress all touched common consumers; split `mobile-application-context.tsx` if touched, and review
large composition/controllers by responsibility rather than line-only churn.

**Fixtures/tests/evidence.** Exact disposable prefixes from existing guides; never `pixeldoro.db`.
Automated matrix: domain, application, real SQLite, mobile integration, boundary, repository hygiene,
device-guide validator, typecheck/lint and platform JS exports as buildability evidence only. Manual matrix:
none can be upgraded by this Story. Evidence: command/test counts, timings, fixture DB names, before/after
hash/fingerprint, exact SHA and sanitized failure codes.

**Acceptance criteria.** Given duplicate reconcile/cancel/purchase/equip triggers, when commands race, then
one accepted durable outcome/receipt exists and balances never go negative. Given migration/reset/write
failure, when the transaction fails, then no partial mutation or false success appears and Retry uses the
same safe boundary. Given analytics Off or missing provider config, when core actions run, then zero external
request occurs and core truth is unchanged. Given corrupt timestamps/newer schema, when bootstrap runs,
then unsafe commands are blocked without auto-reset/repair. Given the production graph, when static gates
run, then no screen contains SQL/provider/business rule and no component/screen exceeds 300 lines.

**Rollback/DoR/DoD/checklist.** Roll back a code fix by forward revert/disable of the narrow call site while
preserving schema and user data; a data fix requires forward migration and separate owner approval. DoR:
US-12-01 inventory and safe fixtures. DoD: all deterministic P0 tests green, no unresolved critical/high
data blocker, exact evidence stored and owner permits freeze.

- [x] Root quality and online Expo Doctor `21/21` pass after `CONFIRM-11=B`; exact committed-candidate
  rerun remains required before freeze evidence is final.
- [x] Migration/recovery/reset and all idempotency races pass in the current automated matrix.
- [x] Fail-closed privacy and prototype/static boundary gates pass.
- [x] Touched common consumer regression and provider split review pass.
- [x] No schema/dependency/native/config change was introduced.

### US-12-03 — Same-SHA iOS/Android native aggregate durability parity

| Field | Contract |
|---|---|
| Priority / risk | `P0`; platform-specific SQLite/runtime/relaunch divergence |
| Outcome | One iOS and one Android target produce the exact `US-02-09_EPIC_EXIT` final report on the same frozen RC SHA |
| Source | `US-02-09_IMPLEMENTATION_PLAN.md` §8–10; EPIC-02 Evidence §19–21; ADR-001/003 |
| Dependency/order | US-12-02 green and RC frozen; before broad journey tests |
| Current capability | Two-phase aggregate runner and eight component probes exist; iOS phase 1 historical only |
| Exact gap | Final iOS phase 2 and full Android final report on one current same SHA/runtime |
| Deliverables | Two final JSON reports, target metadata, logs, cleanup and parity verdict |
| Owner gate/confirms | `CONFIRM-02/03`; owner supplies/authorizes targets and exact RC |

**Scope/behavior.** In scope is the existing two-phase disposable aggregate only. Out: app product DB,
physical disk fill, EAS release submit, changing assertions to accept missing fields. Happy: phase 1 commits
sentinel, actual terminate/relaunch, phase 2 validates all eight probes, normal bootstrap and cleanup.
Alternate: simulator/emulator is allowed only if owner policy accepts it and target kind is explicit.
Error: any SHA/runtime/app ID/platform/assertion mismatch is `FAIL`; unavailable target is `BLOCKED`.
Background alone/Fast Refresh is not relaunch. Operation is offline/local except Development Build loading.

**Ownership/impact.** Reuse existing Composition diagnostic harness, Infrastructure SQLite and normal
bootstrap; no Domain/Application/Presentation behavior change. Schema/dependency/native/config: none.
Privacy: JSON has no rows/IDs beyond synthetic sentinel metadata. Accessibility/performance: N/A for PASS.
UI reuse: normal bootstrap surface only.

**Fixtures/tests/evidence.** Exact DB `pixeldoro-us-02-09-epic-exit-probe.db` plus exact component DBs.
Automated contract validator must reject incomplete/wrong-order/wrong-SHA reports. Manual matrix is one
iOS and one Android development target; each row records OS/target/runtime/build ID. Evidence is complete
phase-1 and phase-2 structured output plus normal-launch observation and cleanup.

**Acceptance criteria.** Given the frozen RC, when phase 1 runs on each platform, then it reports
`AWAITING_RELAUNCH` without `passed: true`. Given an actual process relaunch, when phase 2 completes, then
`passed: true`, exact component/assertion order, non-unavailable SQLite version, same SHA/runtime/app ID and
`physicalDiskFullStatus=NOT_RUN_UNSAFE_OR_NONDETERMINISTIC` are present. Given one platform fails, then the
other platform pass does not waive it. Given cleanup completes, then normal launch has no probe flag/state.

**Rollback/DoR/DoD/checklist.** No data rollback; failed probes clean exact disposable DB only. Any fix
creates a new RC and reruns both platforms. DoR: frozen build installed, flags documented, targets booked.
DoD: pair passes same SHA and owner accepts parity.

- [ ] iOS phase 1 + actual relaunch + final report `PASS`.
- [ ] Android phase 1 + actual relaunch + final report `PASS`.
- [ ] SHA/runtime/app ID/component/assertion parity validated.
- [ ] Exact disposable cleanup and normal launch verified.
- [ ] Owner accepts same-SHA durability gate.

### US-12-04 — Cross-feature offline, lifecycle và idempotency device validation

| Field | Contract |
|---|---|
| Priority / risk | `P0`; user loses/duplicates core truth across real lifecycle/network transitions |
| Outcome | Core journey remains correct from onboarding through Focus/Break/reward/shop/history/settings/reset on supported devices |
| Source | Product Core §3–7, §9–12, §14/19; Timer §6–10; Session Lifecycle §4–10; Epic 05–11 deferred guides |
| Dependency/order | US-12-03; one frozen candidate |
| Current capability | Production end-to-end slices, deterministic fixtures and many quick smokes |
| Exact gap | One formal cross-feature, physical/representative lifecycle/offline/race ledger on final RC |
| Deliverables | Completed core cases in manual guide, durable fact snapshots, blocker/fix/rerun record |
| Owner gate/confirms | `CONFIRM-03/09/12`; go/no-go owner owns blocker disposition |

**Scope/behavior.** In: Relax/Strict background/foreground and kill/relaunch before/after deadlines;
wall-clock/timezone limitations; Break no-Strict/cadence; reward/purchase/equip duplicate races; airplane
mode; notification failure/denial isolation; reset failure/recovery; feedback unavailable; analytics
fail-closed. Out: public load scale, backend/network sync, anti-cheat clock, physical disk corruption.
Happy path covers complete journey and reopen. Alternate path covers denied/off/unavailable side effects.
Error path must retain committed truth, expose Retry/Recovery and never auto-reset. Offline is primary, not
an exception; relaunch rebuilds from SQLite; background ticks are not truth.

**Ownership/impact.** No planned code change. Domain/Application/Infrastructure/Presentation must keep
existing responsibilities if a defect is fixed. Schema `001`; no native/config change unless a confirmed
root cause requires separate approval. Privacy: use synthetic tags/catalog only; no production DB or
feedback text. Accessibility here checks blocker-level navigation/status only; formal semantics in 05.
Performance/battery: no busy-loop/repeated side effects during long background/offline.
UI reuse: existing screens/common recovery/dialog/notice components; no test-only product UI.

**Fixtures/tests/evidence.** Use exact documented `pixeldoro-us-*` databases and dev-only clocks/fail-once
decorators for accelerated cases; run at least one non-accelerated real lifecycle case per platform.
Automated tests support but never mark device rows. Manual guide maps `E12-LIFE-*`, `E12-IDEM-*`,
`E12-DB-*`, `E12-OFF-*`, `E12-PERM-*`, `E12-SENS-*`. Save exact SHA/build/runtime/network/app state,
before/after counts and video/screenshots without raw database dumps.

**Acceptance criteria.** Given Relax/background or Break/background, when deadline passes and app returns,
then correct completed status is reconciled once. Given Strict background, when return is inside grace it
remains running/clears evidence; at `violationAt <= endsAt` it fails with zero reward; when deadline wins it
completes. Given kill after terminal commit, when relaunch occurs, then reward/receipt/animation are not
duplicated. Given duplicate purchase/equip actions, only one debit/ownership and intended equip truth exist.
Given airplane mode/denied side effects, all local core actions work. Given reset write failure/kill, only
full rollback or fully committed reset is visible, never partial state.

**Rollback/DoR/DoD/checklist.** Stop testing and preserve exact artifact on a blocker. Fix by smallest
layer-owned change, add automated regression, freeze new RC and rerun impacted plus smoke baseline.
DoR: parity pass, safe fixture/cleanup, device slots. DoD: all P0 core rows PASS, no crash/data blocker,
limitations accepted explicitly.

- [ ] Relax/Strict/Break lifecycle and wall-clock rows pass.
- [ ] Reward/purchase/equip races are idempotent on device.
- [ ] Offline, notification denial/failure and sensory Off do not block core.
- [ ] Migration/reset/recovery device rows preserve exact truth.
- [ ] No crash/blocker; every unrun/unavailable row stays honest.

### US-12-05 — Accessibility, permission và device compatibility

| Field | Contract |
|---|---|
| Priority / risk | `P1` (release-blocking rows may be P0); inaccessible core action, clipped content or platform permission crash |
| Outcome | Required users can finish the core flow with screen reader/Largest Text/Reduce Motion and denied/unavailable permissions |
| Source | Product Core §2.6, §10–11/19; ADR-005/006; prior Epic deferred a11y matrices |
| Dependency/order | US-12-04; may share frozen build booking with 06 |
| Current capability | Semantic component tests, scrollable shell, non-color text, Reduced Motion store and permission adapters |
| Exact gap | Formal VoiceOver/TalkBack, Largest Text, contrast/grayscale, Reduce Motion and native store-review evidence |
| Deliverables | Per-platform assistive/device rows, issue severity list, native availability record |
| Owner gate/confirms | `CONFIRM-03/09/10`; owner defines formal evidence floor |

**Scope/behavior.** In: minimum/representative phones, VoiceOver, TalkBack, maximum supported Dynamic Type/
font size, grayscale/high contrast where available, Reduce Motion, notification denied/unavailable/request
failure, sound/haptic Off/unavailable, store review availability. Out: iPad/tablet (currently unsupported),
localization redesign, WCAG certification, OS prompt appearance guarantee. Happy: full keyboard/touch/screen
reader traversal and visible focus. Alternate: unavailable side effect has accurate status/action. Error:
no trap/clipped primary CTA/color-only state; blocker opens issue and no-go row. Relaunch must retain app
preferences but not replay announcements/sensory/store-review requests; offline remains usable.

**Ownership/impact.** Presentation owns semantics/layout/focus; Application exposes state/actions;
Infrastructure owns OS permission/native adapters; Domain unchanged. Schema remains `001`; existing native
graph requires fresh build evidence, no new dependency/config planned. Privacy: screen reader text must not
announce anonymous IDs/raw errors/comments. Performance: assistive tech and Reduce Motion must not create
render loops. Reuse ScreenShell/Header, buttons, chips, dialogs, status/notice, Pet status, ToggleRow;
feature-local history graph semantics remain local.

**Fixtures/tests/evidence.** Use production screens with disposable fixtures for edge states. Automated:
component semantic regressions, target-size/static labels, route boundaries. Manual: `E12-A11Y-*`,
`E12-PERM-*`, `E12-SENS-*`, `E12-REVIEW-01` on named OS/build. Evidence: short screen-reader recordings,
screenshots at Largest Text/grayscale, permission status, native call/attempt metadata; never claim the OS
displayed a review prompt.

**Acceptance criteria.** Given VoiceOver/TalkBack, when traversing core and Feedback, then order, roles,
selected/checked/busy/error/retry/status are understandable and actionable with >=44pt targets. Given Largest
Text, no primary control/status is clipped and screen scroll/focus remains reachable. Given grayscale/high
contrast or Reduce Motion, meaning remains in text/border/role and Pet uses correct still fallback. Given
notification/store-review/sensory is denied/unavailable, the app does not crash/rollback core truth and
offers only accurate remediation. Given relaunch, old transient announcements/prompts do not replay.

**Rollback/DoR/DoD/checklist.** Disable the offending nonessential side effect/animation; keep text and core
actions. Layout/semantic fixes must regress all common consumers. DoR: owner evidence policy, devices and
fresh native build. DoD: required rows pass or owner explicitly no-go/changes target support; zero core a11y
blocker.

- [ ] VoiceOver and TalkBack required journeys pass.
- [ ] Largest Text, contrast/grayscale and Reduce Motion pass.
- [ ] Notification/sound/haptic unavailable and Off paths pass.
- [ ] Store-review native adapter evidence recorded without prompt-outcome claim.
- [ ] All common-component consumers regress after any fix.

### US-12-06 — Pet asset fallback và 30-minute Reanimated benchmark

| Field | Contract |
|---|---|
| Priority / risk | `P1`; crash/jank/leak/thermal drain in core emotional surface |
| Outcome | Cat Dev remains understandable and responsive for 30 minutes on approved minimum/representative devices, with layered fallback |
| Source | ADR-005; Pet State Machine §6–10; EPIC-04 Exit; Product Core §2.6/8 |
| Dependency/order | Frozen RC and US-12-03; complete before 07 |
| Current capability | Five bundled sheets, static catalog, Reanimated driver/lifecycle, four-layer fallback, historical benchmark |
| Exact gap | Final RC benchmark/device metadata and forced asset/driver fallback evidence |
| Deliverables | Metrics sheet/videos, fallback matrix, binary/cold-start observation, ADR gate verdict |
| Owner gate/confirms | `CONFIRM-03/09`; benchmark devices/threshold disposition |

**Scope/behavior.** In: idle/working/breaking loops, celebrating/bugged one-shots, background/unmount,
Reduce Motion, playback failure, missing state frame, missing all art, 30-minute run per approved slot.
Out: new art, redesign, Skia spike unless locked requirement demonstrably fails and owner opens a separate
ADR/dependency decision. Happy path uses Reanimated. Alternate uses state still → idle still → neutral
placeholder with semantic status. Error must not mutate session/reward or block CTA. Offline always works;
relaunch does not replay terminal one-shots.

**Ownership/impact.** Domain/Application Pet projection stays unchanged; Presentation animation/catalog
owns rendering; Infrastructure diagnostics are sanitized. No schema/dependency/native/config change.
Privacy: metrics contain device model/OS/build only, no user content/ID. Accessibility: sprite hidden from
screen reader; semantic Pet status remains. Performance record: freeze/jank >100 ms, memory trend, CPU,
thermal, energy/battery, cold-start and binary size; exact acceptable thermal/battery disposition is owner
gate if tooling cannot quantify consistently. Reuse PetStage/PetVisualStatus/Portrait and existing assets.

**Fixtures/tests/evidence.** Existing Pet asset review scenarios and visibility hooks; no production DB.
Automated: manifest checksums/dimensions/alpha, render-plan/driver cleanup, reduced-motion and failure tests.
Manual: `E12-PET-01→03` on exact RC build. Evidence: start/end memory, jank/freeze log, CPU/thermal/battery
observations at fixed intervals, screen capture, build size/cold-start method and cleanup.

**Acceptance criteria.** Given normal animation visible for 30 minutes, no crash, freeze >100 ms,
unbounded memory growth, runaway CPU or owner-defined unacceptable thermal/battery occurs. Given background/
unmount, playback stops and resumes only from current committed base state. Given Reduce Motion or injected
asset/driver failure, the correct static/placeholder layer plus semantic status renders and core actions
remain responsive. Given terminal result relaunch, celebrating/bugged does not replay. Given baseline passes,
Skia remains absent.

**Rollback/DoR/DoD/checklist.** Disable nonessential playback/use existing still layer by forward config/code
change; never change product truth. DoR: device slots, measurement method and RC build. DoD: all required
slots/fallbacks pass and owner accepts ADR-005 verdict.

- [ ] Asset/static/driver fallback matrix passes.
- [ ] 30-minute minimum iOS benchmark passes.
- [ ] 30-minute minimum Android benchmark passes.
- [ ] Representative/current device coverage meets owner matrix.
- [ ] Reanimated retained; no unauthorized Skia/dependency change.

### US-12-07 — Preview build, runtime/OTA compatibility và rollback rehearsal

| Field | Contract |
|---|---|
| Priority / risk | `P0`; incompatible update or unrecoverable bad release reaches testers |
| Outcome | Team can validate, promote and recover a same-runtime JS/asset update without crossing native boundary |
| Source | ADR-007; Technical Overview §3.2/10; app config/eas profiles/workflows |
| Dependency/order | US-12-04→06 pass on frozen candidate |
| Current capability | `appVersion` runtime, dev/preview/production channels, preview approval workflow, remote credentials policy |
| Exact gap | Actual preview binary/update compatibility evidence; negative native-boundary and rollback rehearsal; closed-beta channel decision |
| Deliverables | Build/update manifest, preview smoke, compatibility classification, rollback transcript and restored-version proof |
| Owner gate/confirms | `CONFIRM-04/06/08`; credentials/channel/track/rollback authority |

**Scope/behavior.** In: classify candidate diff as JS/asset vs native; build/install approved preview; publish
only to preview; smoke same runtime; verify incompatible native/config change cannot be delivered as OTA;
rehearse republish of known-good update and verify devices receive it. Out: production/public promotion,
store submission, credential export/rotation unless separately authorized. Happy: compatible update loads
and rollback restores known-good behavior. Alternate: binary-only candidate bypasses OTA and requires fresh
build. Error: runtime/build/channel mismatch is `FAIL` and publication stops. Offline launch uses embedded
bundle; background update must not mutate active session truth or interrupt a session.

**Ownership/impact.** No Domain/Application/schema change. Infrastructure/build configuration is inspected;
any config mutation requires owner approval. Existing native dependencies (SQLite/notifications/audio/
haptics/store-review/updates) must be present in binary. Privacy/security: EAS credentials remain remote;
logs redact tokens/URLs containing secret query values. Accessibility/performance: preview reuses accepted
UI and startup timing is observed. UI reuse: no release-only product screen.

**Fixtures/tests/evidence.** One harmless version/visual marker or existing observable behavior approved for
update verification; no production data. Automated: quality, config/runtime manifest comparison, build
profile lint and secret scan. Manual: `E12-DELIVERY-01→04` with exact update group/build/runtime/channel.
Evidence: EAS artifact/update IDs, SHA, app/runtime version, install source, before/after screenshot, rollback
owner/timestamp; no credential values.

**Acceptance criteria.** Given a preview binary with runtime R, when a compatible update with R is published
to preview, then it loads after approved restart and core smoke passes. Given a native dependency/config/
permission change, when classified, then OTA is rejected and a new app version/binary is required. Given a
bad compatible update rehearsal, when rollback owner republishes known-good update, then preview target
returns to known-good behavior and embedded bundle remains a safe offline fallback. No production channel
is touched without separate authorization.

**Rollback/DoR/DoD/checklist.** Rollback is the Story outcome: republish known-good same-runtime update or
distribute prior compatible binary; never downgrade schema automatically. DoR: owner channel/credentials/
rollback authority and accepted RC. DoD: preview/negative boundary/rollback evidence all pass.

- [ ] Candidate native-vs-OTA classification approved.
- [ ] Preview binary/update exact runtime smoke passes.
- [ ] Native-incompatible negative boundary passes.
- [ ] Known-good republish/rollback rehearsal passes.
- [ ] Production channel remains untouched in planning/rehearsal scope.

### US-12-08 — Internal distribution, closed-beta artifact và Epic exit

| Field | Contract |
|---|---|
| Priority / risk | `P0`; wrong audience/track, unusable artifact or no operational owner |
| Outcome | Approved testers can install the exact RC; owner has release notes, known issues, support, rollback and go/no-go evidence |
| Source | Product Core §13.4/18–19; MVP EPIC-12; ADR-007; EPIC-11 activation decisions |
| Dependency/order | All prior Stories and blocking confirmations |
| Current capability | EAS build/submit profiles and owner quick guide patterns |
| Exact gap | Actual iOS/Android internal targets, feedback activation choice, artifact manifest, release notes/known issues and exit report |
| Deliverables | Internal build(s), tester install proof, closed-beta package, release notes, known issues, ops handoff, Exit Report |
| Owner gate/confirms | `CONFIRM-04→08/10/12`; distribution, providers, track, rollback and go/no-go decisions |

**Scope/behavior.** In: build/distribute to explicitly approved internal/closed-beta targets; verify install/
launch/update; activate feedback only if endpoint/data ownership is approved; keep PostHog disabled unless a
separate activation decision; assemble test instructions, privacy/support contact, known issues, build/SHA/
runtime IDs, rollback steps and go/no-go summary. Out: public launch, production track promotion, store
marketing/monetization. Happy: testers install and quick smoke passes. Alternate: core-only internal build
ships with feedback unavailable clearly recorded and no invitation to submit real feedback. Error: missing
credential/device/account/track is `BLOCKED`; a crash/P0 issue is no-go. Offline embedded core works after
install; relaunch/update retains data compatibility.

**Ownership/impact.** No product-layer change expected. Delivery configuration may need a narrowly approved
closed track/group update because current Android production submit points to `production` draft and iOS
submit target is not explicit. Schema remains `001`; no dependency/native/config change is authorized by
this plan. Privacy/security: no secrets/prod DB/free-text in artifacts; feedback retention/data owner must be
named; PostHog live stays fail-closed. Accessibility/performance gates are inherited, not rerun by claim.
UI reuse: existing app and guides only.

**Fixtures/tests/evidence.** Normal launch plus disposable quick-smoke data. Automated: final quality,
secret/artifact scan, internal-link/manifest validator. Manual: owner quick smoke and `E12-DIST-01/02`,
`E12-EXIT-01`. Evidence: install links/IDs stored outside repo if sensitive, sanitized build metadata,
tester/device/timezone, notes, blocker owner/next action and owner signature/date.

**Acceptance criteria.** Given approved targets, when internal artifacts are distributed, then one iOS and
one Android tester can install/open exact RC and metadata matches manifest. Given feedback endpoint is not
activated, when form submits, then unavailable/retry behavior does not lose core truth and rollout materials
do not promise collection. Given PostHog remains deferred, zero external analytics request/key exists and
it is not a no-go item. Given all mandatory evidence, when go/no-go review occurs, then no open crash/P0
blocker, known issues have owner/workaround, rollback owner can act, and only explicit owner acceptance marks
`DONE_OWNER_ACCEPTED`/`CLOSED_BETA_READY`.

**Rollback/DoR/DoD/checklist.** Pause tester access/promotion, republish known-good update or withdraw the
affected internal artifact according to store capability; preserve data and audit trail. DoR: 01–07 pass,
targets/owners confirmed. DoD: install evidence, closed-beta package, operational handoff, Exit Report and
explicit owner acceptance.

- [ ] Approved iOS internal/closed-beta artifact installs and opens.
- [ ] Approved Android internal/closed-beta artifact installs and opens.
- [ ] Feedback/PostHog activation state matches owner decision and rollout copy.
- [ ] Release notes, known issues, support/rollback/go-no-go owners are complete.
- [ ] Owner explicitly marks EPIC-12 `DONE_OWNER_ACCEPTED`; no automated self-closure.

## 9. UI/common component inventory

| Common component/pattern | Current consumers | Decision for EPIC-12 | Contract/regression |
|---|---|---|---|
| `ScreenShell` | All product screens/routes, including virtualized History branch | Reuse unchanged; extend only backward-compatibly | Scroll/fixed modes, safe area, Largest Text/keyboard regression |
| `ScreenHeader` | Onboarding, Home, Focus, Break, Shop, History, Settings, Feedback | Reuse | Header semantics/wrapping on every consumer |
| `Panel` | Home, Result, Break, History, status, progression, items | Reuse | Tone/style must not become product meaning alone |
| `Button` / Primary / Secondary | Every actionable feature | Reuse | Busy/disabled/label/44pt and all consumer actions |
| `ChoiceChip` | Focus, Settings, Feedback score, Shop filter | Reuse; no new release chip | Radio/selected/disabled and non-color checkmark |
| `ConfirmationDialog` | Focus/Break cancel, Shop purchase, reset | Reuse | Busy Back blocked, focus/order/destructive copy |
| `LoadingState`/`EmptyState`/`ErrorState` | Bootstrap, Focus, Break, Home, History, Shop, Settings | Reuse | Stable Retry, alert/live semantics, no raw error |
| `InlineNotice` | Most feature error/warning/success surfaces | Reuse | No secret/raw DB/provider content; wrapping |
| `CountdownDisplay`/`DurationControl` | Trial/Standard/Break; Focus/Settings | Reuse | Timestamp projection only; formatting/a11y regression |
| `PetStage`/`PetVisualStatus`/`PetPortrait`/`PetStatusText` | Home/onboarding/focus/break/result | Reuse | Static/reduced-motion/fallback and semantic status |
| `RewardSummary`/`ProgressionSummary`/`StatDisplay` | Trial/Focus result, Home/Shop | Reuse | Committed values only; no claim action |
| `ItemGrid`/`ItemTile` | Shop/inventory | Reuse | Atomic intent/busy/owned/equip semantics stay outside component |
| `ToggleRow` | Settings channels/privacy/notification | Reuse | Switch checked/disabled/label/hint; persistence stays controller-owned |
| `SectionLabel` | Focus/History/Settings/Feedback | Reuse | Text hierarchy and wrap |
| History graph/list components | History only, semantics domain-specific | Keep feature-local | Do not promote solely because they are rows/panels |
| Room decoration/thumbnail | Home/Shop visual semantics differ | Keep feature-local with shared manifest IDs | No empty wrapper/common abstraction |
| Prototype controls/provider/screens | Prototype-only/dead production support | Do not reuse; remove after reachability proof | Production routes and common consumers must regress |

Không có EPIC-12-specific product UI được đề xuất. Nếu beta diagnostics cần trình bày, ưu tiên guide và
external artifact; không thêm release/debug panel vào production app. Common component không import feature,
repository, SQLite, provider/native adapter hoặc business rule.

## 10. Screen/component responsibility matrix

| Surface | Screen/route may own | Controller/application owns | Forbidden in screen | EPIC-12 check |
|---|---|---|---|---|
| Entry/Onboarding | layout, CTA, navigation after result | first-use destination, trial start | SQLite/session invariant | offline/relaunch/a11y |
| Home/Pet Room | layout, user intents, route token dispatch | profile/Pet/room/store-review projections | review eligibility, renderer truth | no prototype/provider leak |
| Focus Setup | draft controls/navigation | validation, durable defaults/start | duration/business validation copy as authority | Largest Text/duplicate Start |
| Focus Session | branch layout/cancel intent | reconciliation/outcome/coordinator | timer truth/state machine | lifecycle/Strict boundaries |
| Focus Result | exact ID routing/layout | committed result/reward/Break recommendation | reward claim/calculation | reopen/idempotency |
| Break Session | layout/cancel/Home intent | lifecycle/cadence/outcome | Strict/reward rule | background/cancel race |
| Shop/Inventory | layout/filter/intent/dialog | price/debit/purchase/equip | price authority/SQL | duplicate/offline/relaunch |
| History/Contribution | list/graph layout/actions | pagination/query/projection | raw row/grouping rules | a11y/timezone/offline |
| Settings | controls/dialog/navigation | patch ordering, opt-out, reset, permission/sensory | provider/native/reset rule | permission/reset/relaunch |
| Feedback | form projection/intents | validation/idempotent submit | HTTP endpoint/log/persistence | unavailable/a11y/privacy |

## 11. Component reuse/promotion và consumer regression matrix

| Proposed change trigger | Reuse/promotion decision | Existing consumers to regress | New consumer | Gate |
|---|---|---|---|---|
| A common primitive needs a beta-found bug fix | Extend existing API backward-compatibly | Every import listed in §9, plus component tests | None expected | No behavior default change |
| Two feature-local notices/actions prove same semantics | Evaluate promotion only after two real contracts match | Both old consumers | The second consumer | API has no feature/domain import |
| History row/graph and Settings row share only visual shape | Do not promote | Existing local tests | None | Semantics/interaction differ |
| Pet/room visual wants one wrapper | Reuse PetStage/manifest; keep room positioning local | Home, Focus, Break, onboarding, result | None | No business state in component |
| Prototype alias resembles production shell | Remove alias/consumer; do not promote | All production routes/screens | None | Static reachability + full UI regression |

Required common regression set after any common edit: Onboarding intro/trial; Home/Pet/room; Focus Setup/
Running/Result; Break recommendation/running/result; Shop purchase/inventory/equip; History list/graph/
pagination; Settings toggles/reset/dialog; Feedback score/input/error/success; bootstrap loading/recovery.

## 12. Line-count, split và static-boundary checklist

- [ ] No component or screen exceeds 300 lines; 240–260 triggers documented split review.
- [x] `mobile-application-context.tsx` (334 at audit) is split by provider/hook responsibility; no god
  hook replaces it and the existing barrel contract remains stable.
- [ ] `focus/session.tsx` stays below 240 and delegates branches/arbitration.
- [ ] If `create-mobile-application.ts` is touched, feature-slice factories reduce wiring concentration;
  no business rule moves into Composition.
- [ ] Large controllers/query/migration files touched by a blocker receive responsibility/test-boundary
  review; unchanged normative migration is not churned for line count.
- [ ] Routes import Presentation/Application hooks only; no Domain/Infrastructure/SQLite/provider SDK.
- [ ] Presentation has no SQL/repository/provider/native adapter or eligibility/reward/rate calculation.
- [ ] Common components have no feature/application repository/provider import.
- [ ] Prototype provider/control/branches are absent from production reachability before freeze.
- [ ] Boundary validator and explicit EPIC-12 static assertions reject regressions, not merely search for
  preferred strings.

## 13. Test pyramid và device matrix

| Level | Scope | Required before release | Evidence semantics |
|---|---|---|---|
| Pure unit | Domain decisions, projections, allowlists, render plan | All relevant suites green | Automated only |
| Application | Coordinator, idempotency, Retry/stale/side-effect ordering | All P0 paths | Automated only |
| Real SQLite integration | Migration/constraints/reward/purchase/reset/queue/reopen | Full deterministic matrix | Automated/host, not device PASS |
| Mobile integration/static | Composition, routes, common UI semantics, boundaries | Full regression | Automated, not assistive-tech PASS |
| Native aggregate | US-02-09 two-phase on iOS/Android | Same frozen SHA | Device/simulator row only |
| Manual core | Offline/lifecycle/race/permission | Minimum + representative owner-approved slots | Per-case `PASS/FAIL/BLOCKED/NOT_RUN` |
| Accessibility/performance | VO/TalkBack/Largest Text/contrast/Reduce Motion/30m Pet | Owner-approved device slots | Per-case evidence, no aggregation by inference |
| Delivery | Preview/runtime/rollback/install | Same artifact chain | Build/update/distribution IDs + device smoke |

Proposed target slots, pending `EPIC12-CONFIRM-03`:

| Slot | Minimum policy target | Representative/current target | Notes |
|---|---|---|---|
| iOS | iPhone-class target on iOS 16.4 if accessible | Current team iPhone/current iOS | Simulator may support aggregate/layout; physical required for haptic/notification/thermal claims |
| Android | Phone-class API 24 if accessible | Current mid-range Android/current supported OS | Emulator may support aggregate; physical required for haptic/thermal/battery claims |

If exact minimum hardware/OS is unavailable, row is `BLOCKED` until owner explicitly changes required
matrix or accepts a documented risk; representative coverage cannot silently stand in for minimum.

## 14. Fixture và evidence strategy

- Use only exact disposable databases named by the guide, never wildcard/glob and never normal
  `pixeldoro.db`.
- Every fixture is dev-only/env-gated, default-absent and reports its exact scenario/database.
- Production route/action must create/read facts; fixture may seed facts or inject clock/failure/platform
  state but not replace production Domain/Application rule.
- Never use real feedback, analytics secret, production account ID, raw DB dump or user content in evidence.
- Evidence record includes case, exact SHA, platform/device/OS, build ID/runtime/channel, network/app/a11y
  state, artifact, tester/date/timezone, cleanup and blocker owner/next action.
- A failed or stale run is retained with reason; rerun receives a new record, not overwritten history.
- Build/export/automated PASS never updates a manual row. A quick owner smoke never fills formal matrix rows.
- Validator update planned in `US-12-01/02`: require guide path, mandatory `E12-*` IDs, allowed status
  vocabulary, nonempty SHA/build/cleanup fields for PASS, `BLOCKED` owner/action, PostHog fail-closed row and
  exact normal-launch cleanup. It must reject `PASS` with placeholders and must not bulk-convert status.

## 15. Manual guide mapping

Authoritative guide: `apps/mobile/test/device/epic-12-beta-readiness.md`.

| Story | Manual groups |
|---|---|
| 01 | `E12-RC-01`, owner quick smoke prerequisites |
| 02 | Automated only; supports `E12-DB-*` but does not mark them |
| 03 | `E12-DATA-IOS`, `E12-DATA-AND` |
| 04 | `E12-LIFE-*`, `E12-IDEM-*`, `E12-DB-*`, `E12-OFF-*`, `E12-PERM-*`, `E12-SENS-*` |
| 05 | `E12-A11Y-*`, permission/sensory rows, `E12-REVIEW-01` |
| 06 | `E12-PET-*` |
| 07 | `E12-DELIVERY-*` |
| 08 | `E12-DIST-*`, `E12-EXIT-01`, quick smoke and go/no-go summary |

## 16. Release và rollback strategy

1. Close EPIC-11 and confirmations; run audit/automated gates.
2. Freeze one RC commit; build native artifacts with exact app/runtime version.
3. Run same-SHA aggregate, core/a11y/performance matrix. A production/harness/config fix creates a new RC
   and invalidates affected downstream evidence.
4. Classify release delta: JS/style/bundled asset compatible with runtime may use preview OTA; any native
   dependency, Expo SDK, permission, entitlement or config-plugin change requires app-version bump/new binary.
5. Validate preview before any production/closed-beta channel. Rehearse known-good republish and record owner.
6. Distribute to owner-approved TestFlight/Google Play track/group only; current `production` draft profile is
   not assumed to be the beta target.
7. On blocker: stop promotion, preserve evidence, disable nonessential side effect/motion where safe, or
   republish known-good compatible update/prior binary. Never downgrade schema automatically, delete user DB,
   restore cleared analytics IDs/events, or claim undo for committed reset.

## 17. Out-of-scope guardrails

- No public launch guarantee, public-store promotion, marketing asset campaign or monetization.
- No authentication, backend, cloud sync, desktop, social, native app blocking, widget/Live Activity or AI.
- No pause/resume, new Pet/evolution, shop expansion, task manager or gameplay redesign.
- No PostHog key/project/live analytics unless owner separately re-enables with signal, EU project,
  retention, billing alerts and cost owner.
- No feedback outbox/free-text persistence.
- No Skia unless ADR-005 gate demonstrably fails and owner approves a separate dependency/native decision.
- No schema `002`, dependency upgrade or native/config change merely for cleanup; discovered necessity enters
  `EPIC12-CONFIRM-11` and invalidates affected evidence.
- No real database wildcard read/delete; no secret/signing material committed.

## 18. Open confirmation register

Trong các bảng Story/carry-over, dạng rút gọn `CONFIRM-nn` luôn trỏ tới ID đầy đủ
`EPIC12-CONFIRM-nn` trong register này; ID đầy đủ là canonical khi ghi decision/evidence.

| ID | Decision / 2–3 options | Recommended option | Trade-off | Stories blocked | Output unlocked | Pending default | Impact |
|---|---|---|---|---|---|---|---|
| `EPIC12-CONFIRM-01` | EPIC-11 closure: A accept exact candidate; B request fixes/new SHA; C keep open | A only if owner review accepts report; otherwise B | A opens EPIC-12; B delays but protects truth | 01→08 | EPIC-12 start gate | `A — ACCEPTED_2026_09_14` | Release |
| `EPIC12-CONFIRM-02` | RC policy: A one frozen SHA for all blocking evidence; B per-platform SHA; C rolling main | A | Fixes require rerun, but evidence is comparable | 01→08 | Candidate manifest + same-SHA ledger | No freeze | Release/process |
| `EPIC12-CONFIRM-03` | Device matrix: A minimum + representative physical for hardware claims, simulator/emulator supplemental; B available devices only; C outsourced lab | A | Higher booking cost; credible native/perf evidence | 03→06 | Exact target ledger + device bookings | Missing slots `BLOCKED` | Device/cost |
| `EPIC12-CONFIRM-04` | Internal distribution: A TestFlight + Google Play internal/closed; B EAS internal links only; C one platform first | A | Strongest store-like coverage; account/setup cost | 07/08 | Build/install plan + distribution evidence | No submit/distribution | Native/release/cost |
| `EPIC12-CONFIRM-05` | Feedback endpoint: A activate approved preview/prod endpoint before real testers; B core-only test with form unavailable; C remove feedback promise from invite | A for feedback-collecting beta | Data ops/retention ownership vs stronger signal | 08 | Feedback activation/rollout copy | Adapter disabled; no real submissions | External/privacy/cost |
| `EPIC12-CONFIRM-06` | PostHog: A continue deferred; B re-enable preview only; C re-enable beta production | A | No behavioral analytics/cost; preserves privacy boundary | 07/08 optional telemetry | Explicit telemetry disposition | Fail-closed, non-blocker | External/privacy/cost |
| `EPIC12-CONFIRM-07` | Release target: A TestFlight internal + Google Play named internal/closed group; B production draft; C EAS install only | A | Requires exact account/group setup; avoids accidental public rollout | 08 | Target manifest + tester invite scope | Do not use current production track | Config/release |
| `EPIC12-CONFIRM-08` | Rollback/go-no-go owner: A Dũng owns both with named backup; B separate release/technical owners; C no formal owner | A for solo team | Concentrated responsibility but unambiguous action | 07/08 | Rehearsal authority + signed decision | No promotion | Release/security |
| `EPIC12-CONFIRM-09` | Benchmark coverage: A required slots + ADR metrics/no freeze >100ms; B representative only; C historical EPIC-04 evidence | A | More test time; final-RC confidence | 04→06 | Measurement protocol + booked devices | Benchmark rows `NOT_RUN` | Device/performance |
| `EPIC12-CONFIRM-10` | Accessibility evidence: A VO+TalkBack+Largest Text+contrast+Reduce Motion; B one screen reader/platform; C automated only | A | Most effort; lowest exclusion/rejection risk | 05/08 | Formal a11y matrix + exit threshold | Formal rows `NOT_RUN`; no release acceptance | Accessibility |
| `EPIC12-CONFIRM-11` | Schema/dependency/native/config need: A no change unless blocker; B approve named narrow patch; C broad modernization | B, after Doctor identified exact drift | Twelve patch updates require fresh native build evidence but remove SDK mismatch | 01/02/07 | Clean Doctor + candidate dependency graph | `B — ACCEPTED_AND_APPLIED_2026_09_14` | Dependency/native build; no schema/config |
| `EPIC12-CONFIRM-12` | Exit risk policy: A zero crash/P0 plus accepted nonblocking limitations; B zero known issue; C ship with P0 workaround | A | Practical closed beta with explicit risk ownership | 01/04/08 | Go/no-go threshold + limitation policy | Any crash/P0 is no-go | Release |

Các confirmation tạo chi phí, external service, native/config/schema change hoặc distribution không được
plan này tự chọn thay owner. Recommendation chỉ là planning input.

## 19. Epic completion checklist

- [ ] `EPIC12-CONFIRM-01→12` blocking decisions are recorded; pending defaults respected.
- [ ] `US-12-01` RC truth/carry-over/freeze gate accepted.
- [ ] `US-12-02` automated integrity/recovery hardening accepted.
- [ ] `US-12-03` same-SHA iOS/Android aggregate evidence accepted.
- [ ] `US-12-04` core offline/lifecycle/recovery/idempotency accepted.
- [ ] `US-12-05` accessibility/permission/device compatibility accepted.
- [ ] `US-12-06` Pet benchmark/fallback accepted.
- [ ] `US-12-07` preview/runtime/OTA boundary and rollback rehearsal accepted.
- [ ] `US-12-08` internal distribution/closed-beta artifact accepted.
- [ ] All Mobile MVP acceptance rows trace to exact implementation/manual evidence.
- [ ] Same-SHA iOS/Android durability parity passes.
- [ ] Background/foreground, kill/relaunch, restart and wall-clock recovery pass.
- [ ] Reward/purchase/equip and data integrity/idempotency pass.
- [ ] Offline core loop passes without account/backend/network.
- [ ] Migration/reset failure/recovery and normal-launch cleanup pass.
- [ ] Notification denied/unavailable/failure and sound/haptic Off/unavailable pass.
- [ ] Minimum/representative device and required accessibility coverage pass.
- [ ] Pet 30-minute benchmark and all fallback layers pass.
- [ ] Privacy/reset/analytics opt-out pass; PostHog state matches owner decision.
- [ ] Preview/runtime/OTA native boundary passes.
- [ ] Rollback/republish rehearsal passes with named owner.
- [ ] Internal iOS and Android build/install evidence exists.
- [ ] Closed-beta artifact, release notes, known issues and operational handoff are complete.
- [ ] No known crash or P0 closed-beta blocker remains.
- [ ] Owner explicitly marks `EPIC-12 DONE_OWNER_ACCEPTED` and `CLOSED_BETA_READY`.

## 20. Change log

| Version | Date | Change |
|---|---|---|
| `0.3.0` | 2026-09-14 | Recorded `EPIC12-CONFIRM-11=B`; aligned exactly 12 Expo SDK 57 patch dependencies, regenerated lockfile, and passed online Expo Doctor `21/21` plus full root quality. Fresh native/device evidence remains `NOT_RUN`. |
| `0.2.0` | 2026-09-14 | Recorded EPIC-11 closure/MVP feature-complete and opened implementation at `aaee07f...`; retired prototype production graph, split the oversized provider hooks, extended repository/device validators and bound local quality PASS while keeping device/delivery evidence `NOT_RUN`. |
| `0.1.0` | 2026-09-14 | Created full EPIC-01→11 carry-over/code/config audit, eight prioritized Stories, UI reuse/static-boundary plan, test/evidence/release/rollback strategy and 12 owner confirmations. Recorded planning baseline `6a0fa428...` and kept implementation blocked by EPIC-11 closure. |
