---
document_id: PIXELDORO_EPIC_13_USER_STORIES
title: PixelDoro EPIC-13 — Expo OTA Quick Update & Hotfix Delivery User Stories
version: 1.2.0
status: IMPLEMENTATION_IN_PROGRESS_OWNER_APPROVED_SCOPE
date: 2026-09-15
last_updated: 2026-09-15
owner: Dũng Lư
approved_by: Dũng Lư
approved_at: 2026-09-15
owner_decisions: OTA_CONFIRM_01_TO_09_RECOMMENDED_OPTIONS_ACCEPTED
epic: EPIC-13
scope: POST_MVP_OPERATIONAL_DELIVERY
implementation_status: LOCAL_US_13_01_TO_05_IMPLEMENTED_PENDING_DEVICE_EVIDENCE
production_authorization: NOT_GRANTED
publish_execution_status: NOT_RUN
rollback_execution_status: NOT_RUN
branch_audited: feats/epic-13
audit_head_sha: 8c072d4
previous_epic: EPIC-12
previous_epic_status: DONE_OWNER_ACCEPTED_PRODUCT_SCOPE
closed_beta_status: NOT_CLAIMED
source_plan: ./US-13-01_EXPO_OTA_IMPLEMENTATION_PLAN.md
authority_references:
  - ../PIXELDORO_CORE_TRUTH.md
  - ./MVP_EPICS.md
  - ./EPIC-12_EXIT_REPORT.md
  - ./EPIC-12_USER_STORIES.md
  - ./EPIC-12_IMPLEMENTATION_REPORT.md
  - ../architecture/decisions/ADR-007-eas-delivery-pipeline.md
  - ../architecture/technical-overview.md
  - ../architecture/system-architecture.md
  - ../architecture/project-structure.md
  - ../architecture/data-model.md
  - ../specifications/timer-engine.md
  - ../specifications/session-lifecycle.md
---

# EPIC-13 — Expo OTA Quick Update & Hotfix Delivery

## 0. Epic status and interpretation

Owner approved this planning baseline and the recommended options in `OTA-CONFIRM-01` through
`OTA-CONFIRM-09` on 2026-09-15. This approval opens implementation in Story order; it does not authorize
an EAS build, update publish, channel mutation, rollout, rollback, commit, or push. Local implementation for
US-13-01 through US-13-05 is now in progress and only evidence-backed checklist items are closed. All device,
remote topology, publication, rollout, rollback, commit, and push actions remain open until separately authorized.

`EPIC-12` remains closed as `DONE_OWNER_ACCEPTED_PRODUCT_SCOPE`. Its unexecuted release-validation rows
remain honestly deferred; they are not silently imported into EPIC-13 unless the evidence directly proves
OTA compatibility, delivery, adoption, or recovery.

### Product and operational outcome

> Developer có thể phát hành nhanh một quick update/hotfix tương thích native tới Android và iOS mà
> không cần tạo store build mới cho từng hotfix, đồng thời có kiểm thử, runtime guard, staged rollout,
> monitoring và rollback an toàn.

Non-negotiable invariants:

- OTA carries only JavaScript/TypeScript and bundled assets compatible with the installed native runtime.
- OTA never bypasses store review for native capability, permission, entitlement, SDK, plugin, or policy.
- A candidate with uncertain compatibility fails closed into the store-build path.
- Cold start and offline use remain available; network/update failure never blocks core bootstrap.
- No reload occurs during active Focus, active Break, bootstrap recovery/maintenance, or a terminal/DB write.
- OTA never deletes, downgrades, or makes local data unreadable by the known-good or embedded update.
- Store-version prompting and OTA adoption are separate flows. OTA does not change
  `nativeApplicationVersion`.
- Production publish, rollout mutation, and rollback each require explicit owner authorization at execution
  time, even after this Epic or an individual Story is approved.

## 1. Audit method and evidence semantics

### 1.1. Sources audited

- No `AGENTS.md` exists in this repository; the only discovered sibling file is outside this repository and
  does not apply.
- Product Core Truth, Technical Documentation Checklist, all architecture/data/specification documents and
  ADR-001 through ADR-008 were audited.
- `MVP_EPICS.md` and the Epic/User Story/implementation-plan/implementation-report/exit-report history from
  EPIC-01 through EPIC-12 were inventoried and audited for outcome, decisions, checklist state, deferrals,
  and evidence identity.
- Special attention was given to EPIC-12 exit/user stories/implementation report, ADR-007, and the existing
  `US-13-01_EXPO_OTA_IMPLEMENTATION_PLAN.md` draft.
- README, root/mobile package scripts, resolved Expo config, `eas.json`, build-source guard, composition root,
  bootstrap/lifecycle, Focus/Break projections, transaction boundary, store-version prompt, shared UI,
  analytics/diagnostics, boundary rules, and repository hygiene were inspected.
- Official Expo documentation was checked on 2026-09-15; links are in section 17.
- Read-only EAS metadata was queried on 2026-09-15. No remote state was changed.

### 1.2. Evidence vocabulary

| Label | Meaning |
|---|---|
| `IMPLEMENTED` | Code/config exists in the audited repository. |
| `OWNER_ACCEPTED` | Owner explicitly accepted the stated product or Story scope. |
| `AUTOMATED_ONLY` | Host/export/validator evidence exists, but no device conclusion is implied. |
| `DEVICE_EVIDENCE` | A named build/device/runtime/case has a stored execution record. |
| `DEFERRED` | The authority explicitly moved the item to a later release-validation track. |
| `NOT_IMPLEMENTED` | Required capability is absent. |
| `NOT_PROVEN` | Configuration or code suggests capability, but required runtime/device evidence is absent. |

### 1.3. Prior-Epic interpretation

| Source | Accepted fact | Limitation preserved for EPIC-13 |
|---|---|---|
| EPIC-01–11 records | Product slices are implemented and owner accepted at their recorded SHAs. | Formal device/accessibility breadth is often deferred; quick smoke is not a full OTA matrix. |
| EPIC-12 exit | Mobile MVP product/core scope is owner accepted and closed. | `CLOSED_BETA_READY` is not claimed; exact-source cross-platform build, OTA, rollback, accessibility, and distribution evidence remains deferred. |
| EPIC-12 implementation | Root quality passed; build-source guard exists; three store builds finished. | Android/latest iOS use different SHAs and reported versions not present at those SHAs; these builds are not accepted exact-source evidence. |
| Existing US-13-01 plan | Useful proposal for appVersion runtime, safe prompt, staged delivery, and rollback. | `READY_FOR_OWNER_REVIEW`, `NOT_STARTED`; no item is treated as implemented or accepted. |

## 2. Current-state audit

### 2.1. Expo, project, runtime, and native build facts

Resolved locally with pinned Node `22.23.2` and pnpm `11.24.0`:

| Field | Current PixelDoro value | Evidence/verdict |
|---|---|---|
| Expo SDK | `57.0.0`; package `expo ~57.0.22` | `apps/mobile/package.json`, resolved Expo config; `IMPLEMENTED`. |
| `expo-updates` | `~57.0.22`; lock resolves `57.0.22` | Dependency and config plugin exist; `IMPLEMENTED`, client flow `NOT_IMPLEMENTED`. |
| EAS project | `6f65fb79-ffe9-4fa6-9951-895f27bf0725`; owner resolves `dragonc92team` | `app.config.ts`, resolved config, EAS metadata. |
| Update URL | `https://u.expo.dev/6f65fb79-ffe9-4fa6-9951-895f27bf0725` | Resolved config; included through native build configuration. |
| App version | `1.0.1` | Current resolved config. |
| Runtime policy | `{ policy: "appVersion" }`, resolving to runtime `1.0.1` in current builds | Compatible only if native changes always trigger app-version bump and new build. |
| iOS identity | `com.dragonc92team.pixeldoro`, build `2` | Current resolved config. |
| Android identity | `com.dragonc92team.pixeldoro`, version code `1` | Current resolved config. |
| Native targets | iOS 16.4+, Android min 24/target 36 | Existing build-properties configuration. |

The current `appVersion` policy is retained by ADR-007. It is less automatic than Expo's fingerprint
policy: forgetting to bump `version` after native change can create a false compatibility match. EPIC-13
therefore requires an independent fail-closed diff classifier and runtime manifest; policy alone is not a
sufficient guard.

### 2.2. Local profiles, channels, and environments

| Build profile | Distribution | Channel | Effective EAS environment | Finding |
|---|---|---|---|---|
| `development` | internal dev client | `development` | `development` | Development builds do not represent release-build update behavior. |
| `development-simulator` | internal simulator | inherited `development` | inherited `development` | Supplemental only. |
| `preview` | internal | `preview` | `preview` | Existing production-like internal profile. |
| `qa` | inherited internal | `qa` | inherited `preview` | Local profile exists; remote channel is absent. Intended early test lane. |
| `staging` | inherited internal | `staging` | **inherited `preview`** | Conflict: not production-environment parity. Must explicitly use `production` if topology decision A is accepted. |
| `production` | store/default | `production` | `production` | Current store builds use production channel/runtime `1.0.1`. |

SDK 55+ requires explicit `--environment` for `eas update`. Build profile environment does not
automatically protect update publication, so every wrapper command must pass and record the environment.

### 2.3. Read-only EAS topology and build evidence

Remote audit on 2026-09-15 found:

- `preview` channel → `preview` branch; no update groups.
- `production` channel → `production` branch; no update groups.
- No remote `qa` or `staging` channel/branch exists yet.
- Finished store builds: Android `93d77431-…` runtime `1.0.1`, iOS `98fee2fe-…` runtime `1.0.1`,
  and newer iOS `d20dc640-…` runtime `1.0.1`; all are production-channel store builds.
- No OTA has been published. There is no known-good OTA group, adoption metric, staged rollout, or rollback
  transcript to inherit.

The production binaries are technically configured to request production-channel updates with runtime
`1.0.1`, so a same-platform/same-runtime update can be eligible. This is `NOT_PROVEN`, not OTA readiness:
no installed-device receipt exists, and EPIC-12 rejected these builds as exact-source release evidence.

### 2.4. Current startup and client behavior

| Concern | Expo default | PixelDoro now | EPIC-13 proposal |
|---|---|---|---|
| Enabled | `updates.enabled: true` | Not overridden; therefore enabled in release builds | Keep enabled; expose disabled/unavailable adapter state. |
| Launch check | `ON_LOAD` | Not overridden; default applies | Make explicit only if owner accepts adoption design; preserve early error recovery. |
| Launch wait | `fallbackToCacheTimeout: 0` | Not overridden; no network wait | Keep `0`; offline/startup must not block. |
| Apply | Download on launch, run on next restart | Default only | Add foreground check/download and user-controlled safe restart. |
| Foreground | App decides via API | No OTA logic | Throttled, single-flight check after app becomes active and bootstrap is ready. |
| Reload | App decides via `reloadAsync()` | Never called for OTA | Only after pending update + explicit intent + safe gate. |
| Error recovery | Native `expo-updates` recovery | Present by library/default, unexercised | Test early crash, known-good, and embedded fallback; do not overstate the 10-second recovery window. |

The existing `StoreUpdatePrompt` checks the store version after one second and on foreground, uses
`Application.nativeApplicationVersion`, and renders a non-dismissible `ConfirmationDialog`. It remains a
separate force-store-update capability. OTA must not reuse its policy or trigger it; only lifecycle patterns
and common UI may be reused.

### 2.5. Application architecture and safe-boundary findings

- Composition owns `ReactNativeAppLifecycleAdapter`; `MobileBootstrap` projects lifecycle and subscribes to
  foreground/background. Focus and Break controllers already expose `running`, `deadline_pending`, and
  terminal/error states and refresh on foreground.
- Durable Focus/Break terminal work runs through a single SQLite `BEGIN IMMEDIATE` transaction. The
  transaction implementation rejects overlap but does not expose an application-readable busy projection.
- Therefore “screen is Home” or “timer says zero” is insufficient to prove safe reload. EPIC-13 needs one
  application-owned safe-restart decision that combines active durable session, bootstrap state, terminal
  reconciliation/write barrier, and update state. Presentation must not infer this from route names.
- `MobileApplicationRoot` is the correct composition seam for an OTA coordinator after bootstrap/provider
  creation. Routes/screens should not import `expo-updates`.
- Analytics is local, bounded, allowlisted, opt-out aware, and external PostHog delivery is currently
  fail-closed/deferred. EAS Update insights can provide update launches and failed installs without depending
  on PostHog; richer crash/performance monitoring is not presently proven.

### 2.6. Existing validation and exact gaps

| Capability | Current | Exact EPIC-13 gap |
|---|---|---|
| Clean build source | Root wrapper rejects dirty tree before/after prebuild and prints SHA. | No shared guard module and no OTA wrapper/receipt/diff baseline. |
| Repository hygiene | One lockfile, no signing material, no retired prototype, UI <=300, immutable migrations. | No OTA script/receipt rules, no update boundary cases. |
| Architecture validator | Application cannot import Expo/Infrastructure; Presentation cannot import Infrastructure/Expo. | Add valid Updates adapter boundary and negative direct-import checks. |
| Unit/integration tests | Strong controller, lifecycle, persistence, fault-injection coverage. | No update state machine, compatibility classifier, throttle, safe gate, or adapter tests. |
| Device harness | Existing Epic guides and validator. | No stable EPIC-13 case catalog/receipt schema/false-PASS guard. |
| Publish/promotion | None. | No safe publish, exact-group republish, approval, or rollout controls. |
| Rollback | ADR statement only. | No known-good reference, embedded fallback rehearsal, or persisted-state proof. |

### 2.7. Changes that require a new binary

A new native/store build is mandatory when any of these changes: Expo SDK/React Native/native dependency,
config plugin or plugin inputs, permission/entitlement, bundle/package ID, native icon/splash, native update
URL/request headers/channel, runtime policy/value, code-signing certificate/metadata, build number/version
code, or other generated native configuration. A new build is also required to make native startup config
changes effective in installed binaries.

The client coordinator itself is JS and may be delivered by a compatible OTA because `expo-updates` is
already embedded, but that bootstrap update would still rely on default launch adoption until it is running.
Code signing cannot be retrofitted into existing unsigned binaries: the verification certificate is part of
the native runtime, so signing adoption requires a new runtime/build.

## 3. Story decomposition and dependency map

Eight vertical slices are retained because each ends in an independently observable operational capability,
matches a distinct blast radius, and allows a solo developer to stop safely before remote production work.
Combining client download with reload UX would make active-session safety impossible to accept separately;
combining staged validation with production rollout would collapse the authorization boundary.

```text
US-13-01 Runtime/config baseline
  └─> US-13-02 Eligibility classifier
       └─> US-13-03 Safe publish wrapper + receipt

US-13-01 ─> US-13-04 Client check/download/pending lifecycle
Focus/Break/transaction facts ───────┘
US-13-04 ─> US-13-05 Safe restart UX/protection

US-13-01..05 ─> US-13-06 QA/staging device validation
US-13-03 + US-13-06 + owner authorization ─> US-13-07 exact promotion + rollout
US-13-06 + US-13-07 receipts ─> US-13-08 rollback rehearsal + handoff
```

| Order | Story | Priority | Risk | Independently observable outcome |
|---:|---|---|---|---|
| 1 | `US-13-01` OTA runtime/config baseline | P0 | High | Resolved, reviewable runtime/channel/environment manifest with no publish. |
| 2 | `US-13-02` Native-vs-OTA eligibility classifier | P0 | Critical | Candidate returns deterministic `OTA_ELIGIBLE` or fail-closed `STORE_BUILD_REQUIRED`. |
| 3 | `US-13-03` Safe publish wrapper and receipt | P0 | Critical | Dry-run proves unsafe targets cannot reach EAS; non-production publish can produce sanitized receipt. |
| 4 | `US-13-04` Client check/download/pending lifecycle | P0 | High | Release-like app can discover/download without blocking boot or reloading. |
| 5 | `US-13-05` Safe restart UX and active-session protection | P0 | Critical | Pending update reloads only after explicit intent at a proven safe boundary. |
| 6 | `US-13-06` QA/staging device validation | P0 | Critical | Android+iOS evidence proves same-runtime delivery, cross-runtime rejection, offline/data safety. |
| 7 | `US-13-07` Exact-artifact production promotion and phased rollout | P0 | Critical | Owner-authorized source group is republished without rebundling and gated 10→50→100. |
| 8 | `US-13-08` Rollback/embedded fallback rehearsal and handoff | P0 | Critical | Known-good and embedded recovery are rehearsed with preserved data and owned runbook. |

## 4. User Stories

### US-13-01 — OTA runtime/config baseline

**Priority/Risk:** P0 / High.

**Statement:** Là release developer, tôi muốn một baseline runtime/channel/environment explicit và có thể
resolve tự động, để mọi build/update biết chính xác native compatibility boundary trước khi publish.

**Observable outcome:** A committed config diff and generated/sanitized runtime manifest map app version,
runtime, project, platform, profile, channel, and EAS environment; no update is published.

**Dependency/start gate:** EPIC-12 remains closed; `OTA-CONFIRM-02`, `04`, and `09` are reviewed. Start is
not blocked for local implementation, but any new build needs separate authorization.

**Current capability:** `expo-updates` and URL exist; runtime is `appVersion`; local profiles exist.
**Exact gap:** Native update behavior is implicit; staging inherits preview environment; remote QA/staging
do not exist; no runtime manifest or binary-to-runtime register exists.

**Scope in:** explicit update defaults; explicit staging environment after decision; manifest generator;
profile inheritance tests; binary registry template. **Scope out:** publish, build, remote channel mutation,
SDK/dependency upgrade, runtime-policy change.

**Paths:** Happy—resolve same `1.0.1` runtime for both platforms. Alternate—older supported runtime gets
its own immutable manifest. Error/offline—missing/ambiguous project/runtime/profile fails locally; no network
is required for config validation.

**Ownership:** Domain none; Application owns runtime identity value types only if reused; Infrastructure owns
Expo config resolution; Composition exposes manifest command; Presentation none.

**Impacts:** Data/persistence none. Native impact: explicit native update settings require a new build to
change installed behavior. Security/privacy: manifest contains IDs/SHA, never credentials/env values.
Accessibility/UI: none. Performance/startup: keep zero launch wait. Diagnostics: record resolved app version,
runtime, platform, profile/channel/environment, config hash, and source SHA.

**Acceptance criteria:**

1. Given each release profile, when config is resolved, then project ID, URL, app/runtime version, platform,
   channel, and effective environment are non-empty and match the approved matrix.
2. Given `staging`, when topology A is accepted, then it resolves production environment without changing
   the production channel.
3. Given absent/malformed runtime or mismatched platform manifest, when validation runs, then it fails before
   any EAS command.
4. Given offline execution, when the manifest is generated, then local validation completes without blocking
   app startup or contacting EAS.

**Tests:** Automated unit/config snapshots for all profiles and missing fields; script test for deterministic
manifest and secret redaction. Manual: `E13-M01/M02/M03/M04` later prove binary/runtime behavior.

**Evidence:** config diff, resolved public config, runtime manifest JSON, profile matrix, source SHA, validator
output. **Rollback:** revert config diff before a build; after a build, retain old runtime/channel and issue a
new corrected build—never mutate installed native config by assumption.

**Definition of Ready:** topology/data/signing implications recorded; no secret needed. **Definition of Done:**
automated config evidence passes, affected binary requirement is explicit, and no remote mutation occurred.

Checklist:

- [x] Record approved topology decisions and runtime ownership.
- [x] Make accepted launch behavior and staging environment explicit.
- [x] Generate and validate sanitized runtime manifest for iOS/Android.
- [x] Add config/profile regression tests and evidence.
- [x] Confirm no EAS update/build/channel mutation occurred in this Story.

### US-13-02 — Native-vs-OTA eligibility classifier

**Priority/Risk:** P0 / Critical.

**Statement:** Là release developer, tôi muốn candidate được phân loại fail closed từ exact baseline tới exact
HEAD, để native-incompatible hoặc data-unsafe change không thể đi vào OTA flow.

**Observable outcome:** A machine-readable eligibility report identifies every changed path/rule and returns
one terminal result: `OTA_ELIGIBLE`, `STORE_BUILD_REQUIRED`, or `UNDETERMINED_BLOCKED`.

**Dependency/start gate:** US-13-01 manifest contract. No remote access required.

**Current capability:** Build wrapper checks clean SHA; migration validator checks immutability.
**Exact gap:** No approved baseline input, diff classifier, package/config semantic comparison, or unknown-file
rule; runtime equality alone can falsely allow native changes.

**Scope in:** exact base/head SHA; path and semantic rules from section 7; package/lock/config/plugin/native
directory/migration/env/API checks; reason codes; override prohibition. **Scope out:** deciding app-store policy,
auto-bumping versions, guessing native compatibility, publishing.

**Paths:** Happy—JS/text/style candidate with unchanged native graph passes. Alternate—known native change
returns store build. Error—missing baseline, dirty/untracked candidate, rename ambiguity, malformed config,
or unknown extension returns blocked, never eligible.

**Ownership:** Domain may own pure classification vocabulary/rules; Application orchestrates evidence and
decision; Infrastructure reads Git/config/files; Presentation none.

**Impacts:** Data: migration/persisted semantics default deny. Native: any possible native output change denies
OTA. Security: do not print file content/env values; paths and hashes only. Accessibility/UI: classifier applies
to UI changes but does not replace UI tests. Performance: local scan bounded by exact diff. Diagnostics:
reason-code list and classifier version in report.

**Acceptance criteria:**

1. Given a whitelisted JS/style/text diff, when all runtime and data checks pass, then result is eligible with
   exact base/head/runtime.
2. Given any native dependency, SDK, plugin, permission, entitlement, identity, native asset/config, or runtime
   change, then result is `STORE_BUILD_REQUIRED`.
3. Given schema/persisted semantics or an unknown classification, then result is blocked under approved data policy.
4. Given a dirty tree or non-ancestor/unresolved baseline, then no publish-capable output is produced.

**Tests:** Pure table tests for every section-7 row; property tests for unknown paths; script fixtures for dirty
tree, rename, lockfile, plugin input, native folders, migration, env/API flags, and wrong runtime.
Manual: reviewer samples the generated report against Git diff.

**Evidence:** eligibility JSON/Markdown, exact SHA pair, runtime manifest hash, changed-path inventory, classifier
version, reviewer identity. **Rollback:** classifier is preflight only; revert rule change if false positive.
False negative is P0: disable wrapper/publishing until rule is corrected.

**Definition of Ready:** baseline/ref convention and policy decisions accepted. **Definition of Done:** all matrix
rules and negative fixtures pass; unknown always fails closed.

Checklist:

- [x] Define typed classification results and stable reason codes.
- [ ] Compare exact committed base/head and semantic native surfaces.
- [ ] Cover every eligibility matrix row with automated tests.
- [x] Block unknown, dirty, wrong-runtime, and data-unsafe candidates.
- [ ] Store sanitized eligibility report as release evidence.

### US-13-03 — Safe publish wrapper and update receipt

**Priority/Risk:** P0 / Critical.

**Statement:** Là release operator, tôi muốn một entry point duy nhất bắt buộc quality, eligibility, target,
environment, message, and authorization checks, để publication is reproducible and auditable.

**Observable outcome:** Dry-run prints the exact action without network; authorized QA/staging publication can
produce a sanitized receipt containing source SHA, runtime, platform update IDs, and update group ID.

**Dependency/start gate:** US-13-01/02 done. QA/staging remote creation/publish requires explicit execution
authorization. Production publication is structurally impossible in the source-publish path.

**Current capability:** Build wrapper has useful clean-source logic. **Exact gap:** No reusable guard, update
script, quality gate, required message/environment, group receipt, approval token, or production bypass test.

**Scope in:** extract reusable source guard; `qa|staging` source publish; dry-run; exact CLI version; explicit
platform/channel/environment/message/runtime; receipt validation/redaction; production handoff only by group.
**Scope out:** production direct bundle, automatic EAS login, secret storage, rollout mutation.

**Paths:** Happy—clean eligible candidate passes quality and publishes authorized non-production target.
Alternate—dry-run yields full proposed command/receipt skeleton. Error—dirty tree, wrong runtime/env, missing
message, malformed CLI JSON, network/auth failure, or missing platform group returns no success receipt.

**Ownership:** Domain classifier vocabulary; Application release policy; Infrastructure Git/process/EAS JSON
adapters; Presentation none; root script is composition entry point.

**Impacts:** Data none. Native none for eligible update. Security: least-privilege EAS account, no token/log URL/
env value in receipt; production approval cannot be a default flag. Accessibility none. Performance: quality
cost accepted before network. Diagnostics: command version, timestamps, failure phase, group/update IDs.

**Acceptance criteria:**

1. Given clean eligible SHA and required inputs, when dry-run runs, then no network mutation occurs and exact
   target/environment/runtime/message are shown.
2. Given any failed preflight, when wrapper runs, then EAS publish is never invoked.
3. Given `production` in source-publish mode, then wrapper rejects it regardless of generic confirmation flags.
4. Given successful QA/staging publish, then receipt validates both platform entries or explicit single-platform
   scope and never contains credentials.

**Tests:** Script fixtures for dirty tree, wrong runtime/environment, native diff, missing message, direct
production bypass, invalid/missing group, malformed JSON, command failure, and redaction. Manual: authorized
QA/staging receipt verification in US-13-06.

**Evidence:** quality transcript, eligibility report hash, publish receipt, group ID, platform update IDs,
SHA/runtime/channel/environment mapping, asset inventory/size, operator/time. **Rollback:** a failed source
publish does not delete history; publish a corrected newer group or republish known-good per runbook.

**Definition of Ready:** CLI contract pinned and remote authorization model known. **Definition of Done:** all
negative paths prove zero publish call; a real receipt is not required until the separately authorized device Story.

Checklist:

- [ ] Refactor clean-source guard without weakening build behavior.
- [x] Implement dry-run and QA/staging-only source publish modes.
- [x] Require quality, classifier, explicit environment/runtime/message/platform.
- [x] Validate and redact immutable receipt schema.
- [ ] Prove direct production and invalid-group bypasses fail.

### US-13-04 — Client check/download/pending-update lifecycle

**Priority/Risk:** P0 / High.

**Statement:** Là user, tôi muốn app kiểm tra và tải bản vá best-effort mà không chặn mở app, để bản vá sẵn
sàng nhưng Focus và dữ liệu cục bộ vẫn đáng tin cậy khi offline hoặc mạng lỗi.

**Observable outcome:** A release-like build exposes a deterministic projection for disabled, idle, checking,
available/downloading, pending, no-update, and recoverable error; it never reloads in this Story.

**Dependency/start gate:** US-13-01; adapter contract can be developed independently from publication.

**Current capability:** lifecycle port/bootstrap and Expo default launch download exist. **Exact gap:** no
application port/adapter/state machine, foreground throttle/single-flight, manifest validation, or update facts.

**Scope in:** application update port/controller; Expo Updates infrastructure adapter; initial state hydration;
foreground check after readiness; download; 15-minute process throttle proposal; single flight; sanitized facts.
**Scope out:** reload/prompt, background task dependency, channel surfing/header override, store-version flow.

**Paths:** Happy—foreground check finds and downloads compatible update, reaching pending. Alternate—no update,
disabled/dev mode, or already pending. Error/offline—failure becomes non-blocking recoverable state; core app stays ready.

**Ownership:** Domain none; Application owns state machine/throttle/intents; Infrastructure alone imports
`expo-updates`; Composition wires lifecycle/readiness; Presentation reads projection only.

**Impacts:** Data none. Native: works only where Updates is enabled/configured. Security: whitelist update
metadata; never log headers/manifest bodies. Accessibility: download is silent; no alert churn. Performance:
no startup wait, throttle, single flight, no polling. Diagnostics: current/pending update ID, runtime/channel,
embedded flag, check/fetch phase, duration, sanitized error code.

**Acceptance criteria:**

1. Given offline cold start, when app boots, then core readiness is unaffected and update failure is recoverable.
2. Given repeated foreground events within throttle, then at most one check runs.
3. Given available compatible update, when fetch completes, then state is pending and reload is never called.
4. Given disabled/dev/malformed adapter data, then state is safely unavailable/error without raw exception leak.

**Tests:** Pure state machine, throttle, clock boundary, single-flight, dispose; adapter tests for disabled,
unavailable, no update, available, fetch failure, pending, malformed manifest; integration tests for boot and
foreground ordering. Device: E13-M05–M10.

**Evidence:** state transition tests, adapter matrix, boot timing comparison, update facts screenshot/log.
**Rollback:** remove composition wiring while leaving native default behavior; never clear Expo cache/database.

**Definition of Ready:** port vocabulary and throttle decision documented. **Definition of Done:** controller/
adapter/integration tests pass, architecture checks pass, and no path calls reload.

Checklist:

- [x] Add Application-owned update port, state machine, and reason codes.
- [x] Implement Expo Updates adapter in Infrastructure only.
- [x] Wire boot/foreground with throttle, single flight, and disposal.
- [x] Add adapter and integration failure matrix.
- [x] Verify no boot block, no polling, and no reload.

### US-13-05 — Safe restart UX and active-session protection

**Priority/Risk:** P0 / Critical.

**Statement:** Là user, tôi muốn tự chọn restart khi bản vá đã tải và chỉ ở thời điểm an toàn, để Focus,
Break, terminal reward, và local transaction không bị cắt ngang.

**Observable outcome:** Pending update produces a dismissible common dialog only when the application safe gate
is open; active/terminal work defers it and later re-evaluates automatically.

**Dependency/start gate:** US-13-04 and an application-owned terminal/transaction barrier design.

**Current capability:** Focus/Break projections, lifecycle barriers, `ConfirmationDialog`, buttons, reduced-motion
context. **Exact gap:** no unified durable active-session query, transaction-busy signal, safe gate, restart intent,
or reload adapter behavior.

**Scope in:** safe decision with explicit denial reasons; pending deferral; “Khởi động lại”/“Để sau” prompt;
reload single flight; failure recovery; post-session re-evaluation. **Scope out:** forced restart, countdown,
route-owned decisions, store force-update popup, auto reload on foreground.

**Paths:** Happy—Home/no active operation, user confirms, latest pending update reloads. Alternate—dismiss and
apply at future cold start. Error—Focus/Break/bootstrap/terminal write blocks; reload rejection restores pending
state and app remains usable.

**Ownership:** Domain none; Application owns `SafeRestartDecision` and controller; Infrastructure wraps
`reloadAsync`; Composition supplies session/bootstrap/critical-operation facts; Presentation is the dialog only.

**Impacts:** Data: reload after committed barriers only; no writes. Native/runtime: reload selects most recent
downloaded update; no guarantee of JS after awaited call. Security none beyond metadata redaction. Accessibility:
modal semantics, logical focus/order, screen reader labels, Largest Text scrollability, touch targets, Reduce
Motion/no essential animation. Performance: render only on pending/safe transitions. Diagnostics: deferred reason,
prompt shown/dismissed/restart requested/reload failed; never session content.

**Acceptance criteria:**

1. Given pending update and safe idle app, when gate opens, then one dismissible prompt is shown.
2. Given running/deadline-pending Focus or Break, bootstrap non-ready, or terminal/DB operation pending, then
   prompt/reload is withheld.
3. Given a session becomes terminal and persistence barriers settle, then pending update becomes offerable.
4. Given confirm, then reload is called once; given reload failure, app remains usable and pending can retry.
5. Given store-version prompt and OTA state, then each retains independent trigger and copy; OTA never changes
   native version comparison.

**Tests:** Pure safe-decision matrix; controller single-flight/dismiss/re-offer; integration with active Focus,
Break, terminal persistence, bootstrap recovery, navigation/modal lifecycle; component tests for dialog contract.
Device: E13-M11–M15 and M26.

**Evidence:** decision matrix, integration transcript, iOS/Android screen-reader and Largest Text captures,
before/after durable fingerprints. **Rollback:** disable foreground prompt/check wiring; downloaded update remains
for next safe cold start. If update itself is bad, use US-13-08—not database reset.

**Definition of Ready:** observable critical-operation barrier chosen; UX/a11y decision accepted. **Definition of
Done:** all deny/allow transitions pass and device evidence shows zero session interruption.

Checklist:

- [x] Add safe-restart decision and observable critical-operation barrier.
- [x] Reuse `ConfirmationDialog` and existing buttons; do not clone store prompt.
- [x] Defer through Focus, Break, bootstrap, and terminal persistence.
- [x] Prove reload single-flight and failure recovery.
- [ ] Complete accessibility matrix and line-count review.

### US-13-06 — QA/staging device validation

**Priority/Risk:** P0 / Critical.

**Statement:** Là release owner, tôi muốn cùng candidate được chứng minh trên Android và iOS qua QA rồi staging
production-environment parity, để production promotion is based on device evidence rather than config inference.

**Observable outcome:** Named Android/iOS builds receive same-runtime updates, reject different runtime, preserve
data offline/reload, and produce a signed-off staging source-group evidence pack.

**Dependency/start gate:** US-13-01–05 done; remote QA/staging creation and update publication separately
authorized; device inventory available; staging binary exists for target runtime or is authorized to build.

**Current capability:** Local profiles exist; remote QA/staging absent; production builds exist but are invalid
exact-source release evidence. **Exact gap:** no staging binary, update group, device receipt, data fingerprint,
asset/adoption/negative-runtime proof.

**Scope in:** harmless observable marker/candidate; QA preview env; staging production env; iOS/Android physical
devices (simulator supplemental); full manual sequence; data/asset checks; source-group freeze. **Scope out:**
production publish/rollout, public store release, unrelated EPIC-12 breadth.

**Paths:** Happy—both platforms fetch/apply staging candidate and retain truth. Alternate—newer TestFlight runtime
correctly ignores old runtime update. Error/offline—cached/embedded app opens; failed fetch leaves current update.

**Ownership:** No new product ownership; test harness may expose sanitized diagnostics through composition.
**Impacts:** Data read-only fingerprints and compatibility verification; no reset. Native: new staging binaries
may be needed per runtime/channel. Security: tester access and receipts omit secrets. Accessibility: run required
modal matrix. Performance: record cold-start and asset download regression. Diagnostics: current/source group and
platform update IDs, failed installs, native logs if needed.

**Acceptance criteria:**

1. Given matching staging runtime on physical iOS/Android, when candidate is published/fetched, then both run it.
2. Given different runtime, when the same channel is checked, then update is not offered/applied.
3. Given offline/error/relaunch, then last-known-good/embedded launches and core data remains intact.
4. Given active Focus/Break/terminal write, then no reload occurs; after safe completion, restart succeeds.
5. Given all mandatory cases pass, then source group is frozen with exact SHA/runtime/environment and known-good target.

**Tests:** Automated gates rerun from clean SHA. Device tests E13-M01–M20 and M25–M26 in section 10; EAS service
behavior cannot be replaced by mocks.

**Evidence:** build IDs, app/build/runtime/channel, source group/update IDs, receipts, screenshots/video, tester/
timestamp, network/session states, data fingerprints, asset list/size, EAS insights. **Rollback:** stop testing,
republish known-good on staging or embedded fallback; never delete local DB.

**Definition of Ready:** device/build/channel authorization and inventory complete. **Definition of Done:** all
mandatory iOS/Android cases PASS; failures resolved and rerun; staging source group explicitly frozen.

Checklist:

- [ ] Create/authorize required QA and staging topology without touching production.
- [ ] Register exact iOS/Android builds for target runtime.
- [ ] Execute ordered matching, cross-runtime, offline, safe-session, data, asset, and crash cases.
- [ ] Save complete per-case records and EAS group/update facts.
- [ ] Freeze one staging source group and one known-good reference.

### US-13-07 — Exact-artifact production promotion and phased rollout

**Priority/Risk:** P0 / Critical.

**Statement:** Là production approver, tôi muốn republish đúng staging artifact đã PASS và rollout theo gate,
để production không bundle lại source và blast radius được giới hạn.

**Observable outcome:** An explicitly approved staging source group is republished by group to production at 10%,
then only progresses to 50% and 100% after monitoring gates; every mutation has a receipt.

**Dependency/start gate:** US-13-03/06 done; decisions 03/06/07 accepted; production authorization for the exact
group and each progression; known-good rollback target recorded.

**Current capability:** production channel exists with no update groups. **Exact gap:** no source-group promotion,
authorization, rollout, metrics baseline, stop condition, or receipt.

**Scope in:** validate group/platform/runtime/SHA/environment; `update:republish --group` style exact-content
promotion; per-update rollout; 10→50→100 gates; EAS update insights; mutation log. **Scope out:** `eas update`
from production source, branch-based rollout unless owner changes topology, automatic full rollout.

Exact-artifact means republishing the already built staging group without re-running Metro/export. Republish may
create a distinct destination production group/update IDs; the receipt must map source group → destination group
and verify artifact identity, not falsely require identical group IDs.

**Paths:** Happy—authorized healthy rollout progresses. Alternate—hold percentage longer. Error—identity mismatch,
missing platform, unhealthy metrics, or another active rollout blocks mutation; stop/revert path begins.

**Ownership:** Application/release policy validates gates; Infrastructure reads EAS group/insights and invokes
explicit mutation; no Presentation product UI.

**Impacts:** Data unchanged by policy. Native none. Security: production role/approval least privilege; sanitized
receipt. Accessibility inherited from tested artifact. Performance/startup: compare failed installs, launches,
payload, download/adoption and reported startup regression. Diagnostics: group insights per platform and time window.

**Acceptance criteria:**

1. Given frozen staging group and approval, when promotion runs, then no source bundle/export executes and receipt
   maps exact source/destination identity.
2. Given no owner approval or identity/known-good/monitor gap, then production mutation is impossible.
3. Given 10% healthy through the accepted window, then 50% requires a fresh approval; likewise 100%.
4. Given stop condition, then no progression occurs and authorized revert/rollback procedure is selected.

**Tests:** Script tests for invalid group, runtime/platform/env mismatch, source rebundle attempt, missing approval,
direct production bypass, active rollout, stale metrics. Real EAS/device: E13-M21–M24.

**Evidence:** approval ID, source/destination group and update IDs, SHA/runtime/channel/environment mapping, exact
command version, rollout percentages/timestamps, per-platform insights, stop/go decision. **Rollback:** revert
current rollout when applicable; otherwise known-good republish/embedded/fix-forward per section 12.

**Definition of Ready:** production owner, monitoring and rollback ownership accepted. **Definition of Done:** only
after 100% healthy window and receipts; rollout completion does not imply Story acceptance without owner review.

Checklist:

- [ ] Verify exact source group, platform completeness, runtime, environment, SHA, and known-good target.
- [ ] Capture explicit production and 10% authorization.
- [ ] Republish without bundling; validate destination receipt.
- [ ] Monitor and separately authorize 50% and 100%.
- [ ] Save final adoption/failed-install evidence and owner verdict.

### US-13-08 — Rollback, embedded fallback, and operational handoff

**Priority/Risk:** P0 / Critical.

**Statement:** Là on-call owner, tôi muốn rehearsed recovery choices and a self-contained runbook, để bad OTA
can be contained without data loss or an improvised production response.

**Observable outcome:** Staging transcripts prove rollout revert, known-good republish, embedded fallback, and
fix-forward/store-build routing; a named owner can execute the decision tree from receipts.

**Dependency/start gate:** US-13-06 staging evidence and known-good reference. Production handoff additionally
depends on US-13-07 and owner decisions.

**Current capability:** Expo native error recovery and ADR rollback statement. **Exact gap:** no rehearsal,
known-good registry, persisted compatibility result, RTO/stop rules, or handoff owner.

**Scope in:** staging rehearsal; decision tree; rollout revert; known-good group republish; rollback-to-embedded;
fix-forward; native store-build escalation; post-incident verification. **Scope out:** DB deletion/downgrade,
credential disclosure, automatic production rollback, claiming native recovery catches all crashes.

**Paths:** Happy—known-good republish restores compatible behavior. Alternate—embedded rollback. Error—new state
is not backward compatible, so rollback is prohibited and fix-forward is used; native fault routes to new build.

**Ownership:** Application compatibility policy; Infrastructure EAS recovery commands/receipts; Composition
diagnostics; operational owner authorizes external mutations.

**Impacts:** Data: compare before/after fingerprints and compatibility; no schema downgrade. Native: embedded is
per installed build; native fault needs store build. Security: code-signing/key recovery is separate protected
runbook, not this repository. Accessibility: recovered UI must retain tested baseline. Performance: recovery should
not add launch wait. Diagnostics: incident ID, affected group/runtime/platform, action, RTO, result.

**Acceptance criteria:**

1. Given an in-progress rollout, when revert is rehearsed, then targeting and final branch/group state are recorded.
2. Given backward-compatible persisted state, when known-good is republished, then app/data recover on both platforms.
3. Given no safe prior OTA, when embedded fallback is rehearsed, then each build returns to its embedded update and
   local data remains readable.
4. Given incompatible persisted state, then runbook prohibits rollback and selects tested fix-forward.
5. Given native-boundary failure, then OTA recovery is rejected and new runtime/store build is selected.

**Tests:** Pure rollback decision matrix; script receipt/target validation; staging device E13-M18–M20/M24;
tabletop incident with unavailable EAS/auth failure and owner escalation.

**Evidence:** rollback transcript, known-good and embedded IDs, before/after data fingerprint, screenshots,
decision/RTO/timestamps/operator, final channel/group state. **Rollback of the runbook:** documentation can be
corrected; executed update history is immutable and recovered with a newer action, never deletion.

**Definition of Ready:** rollback owner and data policy accepted. **Definition of Done:** both platforms pass
staging recovery, runbook is owner accepted, credentials remain external, production recovery remains separately authorized.

Checklist:

- [ ] Record known-good OTA and embedded references per runtime/platform.
- [ ] Rehearse rollout revert, known-good republish, and embedded fallback on staging.
- [ ] Prove History/XP/Coin/inventory/settings remain readable and unchanged.
- [ ] Validate fix-forward/native-build decision paths and EAS-unavailable tabletop.
- [ ] Complete owner handoff, contacts, RTO, and evidence retention.

## 5. UI reuse audit

### 5.1. Current component catalog and reuse matrix

| Need | Existing asset | Decision |
|---|---|---|
| Modal/popup | `ConfirmationDialog` / alias `ConfirmationModal` (86 lines) | Reuse directly for OTA safe restart; do not reuse `StoreUpdatePrompt` policy/copy. |
| Primary/secondary actions | `Button`, `PrimaryButton`, `SecondaryButton` (79 lines) | Reuse; existing busy/disabled/accessibility state is sufficient. |
| Notice/banner | `InlineNotice` (34 lines) | Reuse only if a persistent non-modal failure becomes actionable; default OTA errors stay silent. |
| Loading/error/empty | `LoadingState`, `ErrorState`, `EmptyState` | No OTA screen planned; do not surface background download progress by default. |
| Card/panel | `Panel` | Reuse if diagnostics are later shown in a development-only screen. |
| Screen shell/header | `ScreenShell`, `ScreenHeader` | No new OTA screen planned. |
| Progress indicator | `ActivityIndicator` through current status components | Not needed for silent background fetch; no new indicator. |
| Chip/input/avatar | Existing choice/input patterns/Pet components | Not relevant; do not create OTA variants. |
| Reduce Motion | `ReducedMotionProvider` | Modal uses fade; test and disable/change only if platform evidence requires it. |

### 5.2. New and extended components

- New common Presentation component required now: **none**. A composition-level `OtaUpdateCoordinator` (name
  illustrative) is not a reusable visual component; it connects application projection/intents to the existing
  dialog.
- `ConfirmationDialog` should be extended only when tests demonstrate a gap: e.g. Largest Text content scrolling,
  deterministic initial accessibility focus, or an enum-based presentation option. Changes must be backward
  compatible and must not create boolean-prop explosion.
- No OTA screen, duplicated card, custom button, cloned popup, or store-force-update variant is allowed.

### 5.3. Screen/component ownership

| Owner | Allowed responsibility | Forbidden responsibility |
|---|---|---|
| Route/screen | High-level layout/navigation only; no OTA addition expected. | Expo import, network, version/runtime compare, safe decision. |
| Composition coordinator | Subscribe to application projection; render common dialog; dispatch intents. | Native decision rules or durable truth inference from route. |
| Application controller | State machine, throttle, safe decision, reload intent, diagnostics vocabulary. | Expo/React Native imports. |
| Infrastructure adapter | `expo-updates` calls and native metadata mapping. | UI, session policy, store-version policy. |

### 5.4. Line-count and single-responsibility checklist

- [ ] Every production `app/**/*.tsx` and `presentation/**/*.tsx` remains <=300 lines.
- [ ] Coordinator, state machine, adapter, and dialog each have one named responsibility.
- [ ] No helper becomes a hidden multi-policy god object.
- [ ] Component API is typed, narrow, and enum/variant-oriented rather than many booleans.
- [ ] Presentation has no Infrastructure/native import; screens contain no compare/check/fetch/reload logic.
- [ ] Pattern used from two or more locations is evaluated for common-component extraction.

### 5.5. Accessibility test matrix

| Surface/state | VoiceOver iOS | TalkBack Android | Largest/Dynamic Text | Focus/order | Reduce Motion |
|---|---|---|---|---|---|
| Pending safe-restart dialog | Title/body/actions announced once | Same semantic order | No clipping; content/actions reachable | Initial focus inside modal; dismiss then restart | No essential motion; fade acceptable only if setting respected |
| Busy/restart requested | Busy/disabled state announced | Same | Labels remain complete | No duplicate activation | No animation dependency |
| Deferred during Focus/Break | No surprise announcement/modal | Same | Timer remains readable | Focus remains on session controls | No interruption |
| Reload failure | Polite actionable feedback only if shown | Same | Message wraps/scrolls | Retry/dismiss reachable | Static feedback |
| Store prompt coexistence | Correct distinct title and priority | Same | No stacked inaccessible modal | Only one modal owns focus | Same |

## 6. Runtime and release identity model

Every candidate and receipt must preserve this mapping:

```text
base SHA → candidate SHA → classifier version → app version/runtime
→ platform → build ID + embedded update ID → channel → branch
→ EAS environment → source update group + platform update IDs
→ destination group (if republished) → rollout percentage/time
→ current/known-good/embedded references → device evidence
```

Runtime match is necessary but not sufficient. Eligibility also requires compatible native graph, public
environment values, API/data semantics, assets, platform, channel mapping, and exact source evidence.

## 7. OTA eligibility matrix

| Change type | OTA? | Conditions | Required tests | Bump app version/new build when | Rollback implication |
|---|---|---|---|---|---|
| TypeScript/JavaScript | Yes, conditional | Uses only native APIs already embedded; same runtime/data contract | Unit/integration/export + affected device smoke | Native module/config or uncertain dependency appears | Prior update must read any state produced by candidate |
| UI/style/text | Yes, conditional | No native font/config/localization entitlement change | Visual, a11y, Largest Text, both platforms | Requires native resource/config change | Republish known-good if state-neutral |
| Bundled image/audio/font | Yes, conditional | Metro-bundled, license approved, size known, asset downloads fully | Export asset list, download/offline/failure, rendering/playback | Native launch icon/splash/font registration/plugin changes | Known-good safe; embedded may lack new optional asset |
| Analytics call | Yes, conditional | Existing JS adapter/event contract; allowlisted, opt-out, no new native SDK/secret | Contract/privacy/queue/failure tests | New native SDK/plugin/key config required | Event duplication/taxonomy impact assessed; no core rollback |
| Environment variable | Conditional | `EXPO_PUBLIC_*`, non-secret, same value class as tested build/update environment | Resolved bundle/env parity, absence/fail-closed, secret scan | Variable affects native config/plugin or secret-only server value | Republish must use correct environment-built artifact |
| API contract | Conditional | Backward compatible with deployed client/server and offline behavior | Contract tests, old/new server matrix, timeout/offline | New native transport/security capability or breaking client contract | Server compatibility retained through rollback window |
| Native dependency | No | None | Classifier negative fixture | Always add/bump version and build | OTA cannot repair missing native code; ship store build |
| Expo SDK / React Native | No | None | Package/lock/config diff negative fixture | Always | New runtime/store build; do not target old binary |
| Config plugin or plugin input | No by default | Unknown/JS-only proof is not accepted in first iteration | Semantic config diff + prebuild review in store flow | Any plugin/input change | Installed native output cannot be rolled back by OTA |
| Permission/entitlement | No | None | Native config negative fixture | Always | Store/native remediation only |
| Bundle/package ID | No | None | Identity diff negative fixture | Always | Different app identity; OTA is irrelevant |
| App icon/splash | No for native launch asset | In-app bundled image is classified separately | Native asset/config negative fixture | Native icon/adaptive icon/splash changes | Existing installed branding persists until new build |
| iOS build number | No | Metadata only | Config diff routes to build workflow | Whenever changed | Cannot be changed/reversed by OTA |
| Android version code | No | Metadata only | Config diff routes to build workflow | Whenever changed | Cannot be changed/reversed by OTA |
| Database migration | No under recommended policy | Owner may only change policy with dedicated compatibility design | Migration from every released schema + upgrade/rollback/kill matrix | Default: app version bump and new build | Never downgrade/delete DB; unsafe rollback becomes fix-forward |
| Persisted-data semantic change | No under recommended policy | Additive/read-compatible exception needs explicit owner review | Old/new bundle bidirectional compatibility and replay tests | If older known-good/embedded cannot safely read state | Rollback prohibited; fix-forward |
| Store metadata | No/Not applicable | Change in App Store Connect/Play Console | Store review/metadata validation | Binary metadata/capability also changes | Revert in store console; OTA does not affect it |

Classifier rule: if a row, condition, baseline, generated native effect, or data compatibility result is not
known with high confidence, return `UNDETERMINED_BLOCKED`; never infer OTA eligibility.

## 8. Automated test strategy

### 8.1. Test pyramid

| Level | Automated coverage | Must remain real device/EAS |
|---|---|---|
| Pure unit | semantic/runtime equality; eligibility table; update state machine; safe-session/critical-operation decision; throttle/single-flight; rollback decision | None |
| Adapter | Updates disabled/dev; no update; available; fetch failure; pending; reload failure; malformed metadata/log; exception redaction | Native module actually enabled, real asset download, real reload |
| Integration | bootstrap non-blocking; foreground ordering; active Focus/Break; terminal persistence barrier; navigation/modal lifecycle; store prompt independence | OS lifecycle, process kill, release-mode update behavior |
| Script | dirty tree; wrong runtime; native-incompatible diff; wrong environment; missing message; direct production bypass; invalid group; source-group mismatch; receipt redaction | EAS auth/service/group identity and rollout mutation |
| Device/service | Harness schema validation and false-PASS guard | Same/cross-runtime delivery, offline fallback, exact-group republish, rollout, early crash, rollback |

### 8.2. Required automated gates per candidate

- Root `typecheck`, lint, full test suite, boundary validator, repository hygiene.
- Expo config resolution and runtime manifest validation for both platforms.
- Candidate classifier and asset inventory/size report.
- Update client/controller/adapter/integration suites.
- Device-guide validator: stable IDs, required fields, status vocabulary, and no pre-filled PASS.
- Wrapper dry-run proving exact command/receipt without network.

### 8.3. Test architecture additions

- Application tests use fakes for clock, lifecycle, update port, active-session query, and critical-operation gate.
- Infrastructure adapter tests mock only the `expo-updates` module boundary and map raw errors to stable codes.
- Composition integration uses existing mobile application/provider patterns; no test support enters production exports.
- Boundary validator gains negative cases for Application/Presentation/route importing `expo-updates`, and one
  valid Infrastructure adapter case.
- Repository hygiene gains receipt-secret checks and keeps UI <=300; generated evidence/artifacts use an approved,
  gitignored path unless the sanitized summary is intentionally committed.

## 9. Manual execution record schema

Every manual case below must have one record per executed platform/build. Do not overwrite history; reruns append.

```yaml
case_id: E13-Mxx
status: NOT_RUN # PASS | FAIL | BLOCKED | NOT_RUN
platform_device: "<iOS/Android physical model + OS>"
installed_build_id: "<EAS/store build ID>"
app_version: "<nativeApplicationVersion>"
runtime_version: "<Updates.runtimeVersion>"
channel: "<Updates.channel>"
current_update_id: "<UUID or EMBEDDED:id>"
target_update_group: "<source/destination group ID or N/A>"
network_state: "<online/wifi/cellular/offline/loss point>"
starting_app_session_state: "<cold/home/focus/break/deadline_pending/terminal_write>"
preconditions: "<known-good, data seed, rollout %, environment>"
steps: ["<ordered actions>"]
expected_result: "<observable result>"
evidence: ["<screenshots/video/log/receipt/data fingerprint/insights path>"]
tester: "<name>"
timestamp_timezone: "<ISO-8601 with offset>"
notes: "<sanitized>"
```

Required status starts as `NOT_RUN`. `PASS` requires all identity fields, expected result, and stored evidence;
an unavailable device/account/channel is `BLOCKED`, not `PASS`.

## 10. Ordered manual device guide

Execute QA smoke first, then staging compatibility/safety, then rollback, and only then separately authorized
production-like rollout. For `iOS+Android`, create two records with the same case ID and platform suffix.

| Order / Case | Platform/device | Preconditions and identity fields | Network / start | Steps | Expected result | Required evidence / initial status |
|---|---|---|---|---|---|---|
| 01 `E13-M01` | Physical iOS | QA build ID; app/runtime/channel/current ID; QA target group | Online / cold | Install known build; open twice as needed; inspect diagnostics | Matching runtime receives/runs QA marker | Receipt + before/after IDs + screenshots / `NOT_RUN` |
| 02 `E13-M02` | Physical Android | Same QA identity fields | Online / cold | Same as M01 | Same-runtime Android receives update | Same / `NOT_RUN` |
| 03 `E13-M03` | Physical iOS | Different-runtime build; target group recorded | Online / cold | Check/reopen twice | Different runtime never receives target | IDs + no-update evidence / `NOT_RUN` |
| 04 `E13-M04` | Physical Android | Different-runtime build | Online / cold | Same as M03 | Cross-runtime rejected | Same / `NOT_RUN` |
| 05 `E13-M05` | iOS+Android | Staging build/source group | Online / cold | Launch from terminated state | Core UI opens immediately; check/download does not block | launch video/timing/log / `NOT_RUN` |
| 06 `E13-M06` | iOS+Android | Last-known-good installed | Offline / cold | Disable network; launch/navigate core | Cached/embedded app and local data work | video + current ID/data hash / `NOT_RUN` |
| 07 `E13-M07` | iOS+Android | App backgrounded past throttle | Online / foreground | Resume app once/repeatedly | One throttled check; no duplicate request/prompt | lifecycle logs / `NOT_RUN` |
| 08 `E13-M08` | iOS+Android | Compatible target available | Online / Home | Trigger check and wait fetch | Download completes; state pending; no auto reload | pending state + group IDs / `NOT_RUN` |
| 09 `E13-M09` | iOS+Android | Compatible target available | Network loss during fetch / Home | Cut network mid-download; restore | Current update remains; app usable; retry succeeds later | video/log/error code / `NOT_RUN` |
| 10 `E13-M10` | iOS+Android | Download completed | Offline / pending | Navigate/background/reopen policy path | Pending fact remains coherent; no corrupt partial activation | current/pending IDs / `NOT_RUN` |
| 11 `E13-M11` | iOS+Android | Pending update; no active work | Online / Home | Confirm restart | Exactly one reload; target ID runs | video + before/after IDs / `NOT_RUN` |
| 12 `E13-M12` | iOS+Android | Pending update; running Focus | Any / Focus | Foreground, wait, attempt adoption | No prompt/reload interrupts Focus | full-session video + session ID/hash / `NOT_RUN` |
| 13 `E13-M13` | iOS+Android | Pending update; running Break | Any / Break | Same as M12 | No prompt/reload interrupts Break | same / `NOT_RUN` |
| 14 `E13-M14` | iOS+Android | Pending update; deadline/terminal write fixture | Any / transition | Cross deadline and persist reward/result | Reload withheld until transaction/reconciliation settles | transaction/result/reward evidence / `NOT_RUN` |
| 15 `E13-M15` | iOS+Android | M12/13/14 complete; update pending | Online / safe result→Home | Finish/leave session; confirm prompt | Prompt appears only after safe boundary; restart succeeds | ordered video/log / `NOT_RUN` |
| 16 `E13-M16` | iOS+Android | Seed History/XP/Coin/inventory/settings; hashes captured | Online / safe | Apply update; relaunch; inspect all data | Values/ownership/settings/history unchanged | sanitized before/after fingerprint + screens / `NOT_RUN` |
| 17 `E13-M17` | iOS+Android | Candidate includes new bundled asset | Weak/normal network / Home | Fetch/apply; navigate to asset; relaunch offline | All assets complete; no blank/crash; fallback as designed | asset list/size/video/log / `NOT_RUN` |
| 18 `E13-M18` | iOS+Android staging | Deliberate early-crash test group; known-good recorded | Online / first launch | Apply and launch failing update under controlled fixture | Native recovery behavior observed; failed update not falsely called healthy | crash/failed-install/current ID evidence / `NOT_RUN` |
| 19 `E13-M19` | iOS+Android staging | Bad group active; compatible known-good | Online / recovery | Republish exact known-good; relaunch | Known-good runs; data remains readable | source/destination receipt + video/hash / `NOT_RUN` |
| 20 `E13-M20` | iOS+Android staging | No safe OTA selected; embedded IDs known | Online then offline / recovery | Roll back branch to embedded; relaunch | Each build runs its embedded update; DB not reset/downgraded | embedded/current IDs + hash/video / `NOT_RUN` |
| 21 `E13-M21` | Production-like, both platforms | Owner approval; destination group; baseline metrics | Online / representative states | Start 10% per-update rollout; sample assigned/control devices | 10% state and both cohorts verified | rollout receipt + insights / `NOT_RUN` |
| 22 `E13-M22` | Production-like, both | M21 healthy/window met | Online | Approve/edit to 50%; recheck cohorts | 50% recorded; no stop breach | approval + insights / `NOT_RUN` |
| 23 `E13-M23` | Production-like, both | M22 healthy/window met | Online | Approve/edit to 100% | All eligible users targeted; final metrics recorded | final receipt/insights / `NOT_RUN` |
| 24 `E13-M24` | Production-like/staging rehearsal | Active partial rollout | Online | Trigger stop condition; revert rollout | Progression stops; control/known-good state restored | revert transcript + final mapping / `NOT_RUN` |
| 25 `E13-M25` | Physical iOS TestFlight + Android newer build where available | Newer app/runtime than store; old target group | Online / cold+foreground | Check old-runtime update | Newer runtime does not receive it | build/runtime/current IDs / `NOT_RUN` |
| 26 `E13-M26` | iOS+Android | Store manifest advertises higher native version; OTA pending/none variants | Online / Home | Exercise store and OTA triggers independently | OTA never changes native version or spuriously triggers/clears store force-update | both prompt policies + native version evidence / `NOT_RUN` |

## 11. Release and exact-promotion flow

Recommended topology, pending `OTA-CONFIRM-02`:

```text
clean exact SHA + quality + classifier + runtime manifest
  → publish QA with --channel qa --environment preview
  → QA device smoke
  → publish release candidate with --channel staging --environment production
  → full staging Android+iOS evidence + freeze source group
  → owner authorizes exact source group
  → republish source group to production without export/rebundle
  → production per-update rollout 10%
  → monitor + owner gate → 50%
  → monitor + owner gate → 100%
  → final monitoring window + handoff
```

Controls:

- Staging uses production environment values but a staging channel/build, preventing end-user exposure.
- Production promotion accepts only a validated source group ID and checks its runtime/platform/update identities.
- A new `eas update` from current source is not promotion and is forbidden after staging PASS.
- EAS per-update rollout is preferred for one immutable hotfix. Only one active per-update rollout per branch/
  runtime is allowed; finish/revert it before a new update for that runtime.
- Branch-based rollout is out of the first iteration because it adds channel mapping complexity; owner can
  revisit after operational evidence.

## 12. Rollout monitoring and rollback strategy

### 12.1. Proposed gate signals

For each platform and group record launches, unique users, failed installs, payload size, adoption split, and
manual core-smoke result from EAS Update details/insights. Exact thresholds and windows remain owner decisions.
PostHog is not a production gate while live delivery remains deferred. EAS Observe/download metrics require an
additional capability/dependency and are not assumed present.

Immediate stop candidates: any P0/P1 data loss/corruption, repeatable startup loop, cross-runtime delivery,
Focus/Break interruption, store-flow coupling, significant failed-install regression, missing platform artifact,
or inability to identify rollback target.

### 12.2. Recovery modes

| Mode | Use when | Action and constraint |
|---|---|---|
| Revert rollout | New per-update rollout is partial and control update is safe | End/revert the rollout; record resulting group mapping. |
| Republish known-good | Previous published group is data-compatible | Republish exact known-good group; creates a new latest recovery publication. |
| Rollback to embedded | No safe OTA group, embedded build is compatible with current data | Instruct branch to embedded; behavior depends on each installed binary's embedded update. |
| Fix-forward | Candidate wrote state older code cannot safely read | Do not rollback; publish a compatible fix after staging proof. |
| New store build | Fault is native/runtime/config/signing boundary | Bump app version/runtime and follow store build/review path. |

Deleting the database, restoring an older schema, or overwriting user truth is never rollback.

Expo native error recovery is defense in depth, not the operational plan: early first-launch failures can be
marked failed and fall back, but errors after content appeared and crashes beyond the documented recovery window
may still crash. Staging and active monitoring remain mandatory.

## 13. Risks and controls

| Risk | Control / verification |
|---|---|
| Same runtime but missing native API | AppVersion plus fail-closed semantic diff classifier and staging build parity. |
| Preview variables in production artifact | Explicit `--environment`; staging uses production env; exact-group republish. |
| Source rebuilt after staging | Production mode accepts group ID only and asserts no export/bundle subprocess. |
| Wrong platform/group/runtime | Receipt schema and remote group lookup require complete mapping. |
| Reload cuts active/terminal work | Application safe gate + critical-operation barrier + device M12–M15. |
| Offline/startup regression | Zero launch wait, best-effort errors, M05/M06/M09. |
| Persisted state breaks rollback | Default no schema/semantic OTA; bidirectional compatibility or fix-forward. |
| Large/missing assets | Export inventory/size, complete fetch, weak-network/offline asset tests. |
| Early crash loop | Staged early-crash rehearsal, EAS failed installs, known-good/embedded references. |
| Store force-update coupling | Separate controllers/diagnostics and M26. |
| Secret/PII leak | Public env review, receipt redaction, existing analytics allowlist/opt-out, no raw manifests. |
| Weak monitoring | Owner-set windows/thresholds; EAS update insights; no 50/100 progression on unknown health. |
| Code-signing gap | Explicit owner decision; new signed runtime/build if adopted. |
| EAS outage/auth loss | Offline app unaffected; tabletop escalation; no improvised database action. |

## 14. Owner confirmation register

Owner approved the plan on 2026-09-15. This records the recommended option for every row as the
implementation baseline. Execution-time production authorization remains separate and is not granted.

| ID | Decision and options | Recommendation | Trade-off / current state |
|---|---|---|---|
| `OTA-CONFIRM-01` | Adoption UX: A safe non-blocking prompt; B next-cold-start only; C forced immediate reload | **A — ACCEPTED 2026-09-15** | Best speed/control; needs safe gate/a11y. B simplest but slower. C violates active-session principle. |
| `OTA-CONFIRM-02` | Topology: A QA(preview env)→staging(production env)→production; B preview→production; C custom EAS envs | **A — ACCEPTED 2026-09-15** | Strong parity with default environments. Remote QA/staging creation remains execution work. |
| `OTA-CONFIRM-03` | Rollout: A 10→50→100; B 5→25→50→100; C 100% | **A — ACCEPTED 2026-09-15** | Balanced solo operation. Every production percentage still needs separate execution authorization. |
| `OTA-CONFIRM-04` | Data/schema: A no migration/semantic change via OTA; B additive backward-compatible only; C allow reviewed migrations | **A — ACCEPTED 2026-09-15** | Preserves the safest rollback boundary. |
| `OTA-CONFIRM-05` | Code signing: A adopt on next new runtime/store build; B require before any production OTA; C defer | **A — ACCEPTED 2026-09-15** | Certificate is native and requires new build/runtime; current binaries cannot be retrofitted. |
| `OTA-CONFIRM-06` | Production approver: A Dũng Lư only; B named backup; C two-person approval | **A — ACCEPTED 2026-09-15** | Dũng Lư is the sole production approver for the solo phase. |
| `OTA-CONFIRM-07` | Monitoring: A 24h at 10%, 24h at 50%, 48h after 100% with zero P0/P1 and owner-set failed-install ceiling; B 6/12/24h; C cohort-count gate | **A — ACCEPTED 2026-09-15** | Windows and zero-P0/P1 rule are accepted; the numeric failed-install/sample ceiling remains a required production execution input. |
| `OTA-CONFIRM-08` | Rollback owner: A production approver owns execution; B named on-call backup; C automated rollback | **A — ACCEPTED 2026-09-15** | Dũng Lư owns rollback execution; add a backup later without changing the baseline. |
| `OTA-CONFIRM-09` | Staging binary per runtime: A one iOS+Android staging binary for every production runtime; B reuse dev build; C production binary channel surf | **A — ACCEPTED 2026-09-15** | Strongest channel/native parity; consumes build time/cost. |

Decisions 01–04 and 09 unblock implementation design. Decisions 03, 06–08 plus explicit exact-group approval
are hard gates for production. Decision 05 determines whether current unsigned runtime may ever receive a
production OTA or only serve QA/rehearsal before a new signed store runtime.

## 15. Epic Definition of Ready

- [x] Owner accepted the recommended options for `OTA-CONFIRM-01` through `OTA-CONFIRM-09` on 2026-09-15.
- [ ] Exact clean implementation baseline SHA and supported runtime/platform registry are recorded.
- [ ] QA/staging remote topology and physical device inventory have authorized owners.
- [ ] Production roles, monitoring thresholds/windows, stop conditions, and rollback owner are named.
- [ ] Known-good/embedded evidence storage and credential custody locations are defined without secrets here.
- [ ] No EPIC-12 deferred item is imported unless mapped to an EPIC-13 acceptance criterion.

## 16. Epic Definition of Done

- [ ] `US-13-01` through `US-13-08` are individually accepted with linked evidence.
- [ ] Classifier blocks every native/data/unknown negative case and direct production source publish.
- [ ] Client check/download/restart is non-blocking, throttled, single-flight, and safe around Focus/Break/write.
- [ ] Matching and different runtime behavior is proven on physical iOS and Android release-like builds.
- [ ] History, XP, Coin, inventory, settings, and assets survive update and recovery.
- [ ] Staging known-good republish and rollback-to-embedded are rehearsed on both platforms.
- [ ] Exact-content source→production destination group mapping is proven without rebundling.
- [ ] Production 10→50→100 rollout has explicit approvals and healthy monitoring evidence, if production execution
  is included in the accepted Story run; otherwise Epic remains not production-complete.
- [ ] Runbook, known-good registry, receipts, RTO/stop conditions, and rollback owner are handed off.
- [ ] Owner explicitly accepts EPIC-13; planning/config existence alone never marks it done.

## 17. Master implementation checklist

### Phase A — local safety foundation

- [x] Accept owner decision register.
- [x] Implement/verify US-13-01 runtime/config baseline.
- [ ] Implement/verify US-13-02 fail-closed classifier.
- [ ] Implement/verify US-13-03 wrapper dry-run and receipts.
- [x] Run root quality/boundary/hygiene and secret scan.

### Phase B — client capability

- [x] Implement/verify US-13-04 client lifecycle.
- [x] Implement/verify US-13-05 safe restart and common dialog reuse.
- [ ] Verify all UI files <=300 and accessibility matrix automated cases.
- [ ] Freeze a clean device-validation candidate SHA.

### Phase C — authorized non-production evidence

- [ ] Authorize/create required QA/staging remote topology.
- [ ] Build/register staging binaries per accepted runtime policy if needed.
- [ ] Publish QA and staging only through wrapper; save receipts.
- [ ] Execute E13-M01–M20 and M25–M26 on required devices.
- [ ] Freeze staging source group and known-good/embedded references.
- [ ] Rehearse rollback and complete operational handoff.

### Phase D — separately authorized production

- [ ] Capture exact-group production authorization and health baseline.
- [ ] Republish without rebundling and start 10% rollout.
- [ ] Execute/record E13-M21 and accepted monitoring window.
- [ ] Capture separate 50% authorization; execute/record E13-M22.
- [ ] Capture separate 100% authorization; execute/record E13-M23.
- [ ] Verify E13-M24 stop/revert readiness and final known-good state.
- [ ] Complete final monitoring window and owner acceptance.

## 18. Official Expo primary references

- [EAS Update introduction](https://docs.expo.dev/eas-update/introduction/)
- [Get started and publish semantics](https://docs.expo.dev/eas-update/getting-started/)
- [Deployments, channels, branches, and gradual deployment](https://docs.expo.dev/eas-update/deployment/)
- [Runtime versions and native compatibility](https://docs.expo.dev/eas-update/runtime-versions/)
- [Expo Updates SDK API and launch defaults](https://docs.expo.dev/versions/latest/sdk/updates/)
- [Downloading, foreground patterns, and adoption metrics](https://docs.expo.dev/eas-update/download-updates/)
- [EAS environments for builds and updates](https://docs.expo.dev/eas/environment-variables/usage/)
- [Rollouts](https://docs.expo.dev/eas-update/rollouts/)
- [Rollbacks](https://docs.expo.dev/eas-update/rollbacks/)
- [Error recovery](https://docs.expo.dev/eas-update/error-recovery/)
- [Manage channels/branches and republish groups](https://docs.expo.dev/eas-update/eas-cli/)
- [Update debugging](https://docs.expo.dev/eas-update/debug/)
- [End-to-end update code signing](https://docs.expo.dev/eas-update/code-signing/)
- [Asset optimization](https://docs.expo.dev/eas-update/optimize-assets/)
- [EAS CLI update insights](https://docs.expo.dev/eas/cli/)

## 19. Change log

| Version | Date | Change |
|---|---|---|
| `1.2.0` | 2026-09-15 | Implemented the local US-13-01→05 foundation: explicit update config/profile mapping, runtime manifest, fail-closed classifier, guarded QA/staging wrapper, client update lifecycle, safe-restart gate, common dialog reuse, and Settings identity showing native version plus a shared publish-time millisecond OTA number (`Updates.createdAt` fallback for older bundles). “Latest” is claimed only after a successful compatible check on the current channel. Remote/device/production work remains unexecuted and unauthorized. |
| `1.1.0` | 2026-09-15 | Recorded owner approval of the EPIC-13 plan and recommended options for `OTA-CONFIRM-01→09`; opened ordered implementation while preserving separate authorization for every EAS build, publish, channel, rollout, rollback, commit, and push action. |
| `1.0.0` | 2026-09-15 | Created EPIC-13 planning baseline after repository, history, code/config, remote EAS read-only, and official Expo audit. Decomposed eight vertical Stories; added UI/component, eligibility, test, device, promotion, rollback, risk, decision, DoR/DoD, and master checklists. No implementation or EAS mutation performed. |
