---
document_id: PIXELDORO_EPIC_11_USER_STORIES
title: PixelDoro EPIC-11 — Analytics, Feedback & Store Review User Stories
version: 0.2.0
status: IMPLEMENTATION_IN_PROGRESS_OWNER_QUICK_UI_PENDING
date: 2026-09-13
owner: Dũng Lư
branch: feats/epic-11
upstream: origin/feats/epic-11
audit_baseline_sha: a8dd7eb21dc978884994a46230fb9837d8d74f68
audit_baseline_identity: EXACT_COMMITTED_PUSHED_SHA
worktree_at_audit: CLEAN
previous_epic: EPIC-10
previous_epic_status: DONE_OWNER_ACCEPTED
previous_epic_accepted_sha: bee029a12576af8d8470668c1fa2ce8d8502ac4b
implementation_status: CODE_COMPLETE_AUTOMATED_GATES_PASS_OWNER_QUICK_UI_PENDING
schema_status: SCHEMA_001_APPEARS_SUFFICIENT_NO_MIGRATION_AUTHORIZED
dependency_status: EXPO_STORE_REVIEW_INSTALLED_DIRECT_POSTHOG_HTTPS_NO_SDK
native_status: STORE_REVIEW_NATIVE_ADAPTER_IMPLEMENTED_REBUILD_EVIDENCE_PENDING
analytics_provider_status: POSTHOG_CLOUD_EU_AUTHORIZED_PROVIDER_CONFIG_MISSING
feedback_provider_status: HTTPS_ADAPTER_IMPLEMENTED_OWNER_ENDPOINT_MISSING
authority: PLANNING
product_truth: ../PIXELDORO_CORE_TRUTH.md
epic_baseline: ./MVP_EPICS.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model: ../architecture/data-model.md
analytics_adr: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
feedback_review_adr: ../architecture/decisions/ADR-006-in-app-feedback-and-store-review.md
manual_guide: ../../apps/mobile/test/device/epic-11-quick-ui-smoke.md
---

# EPIC-11 — Analytics, Feedback & Store Review

## 0. Executive summary

EPIC-11 đưa các analytics event đã được feature Epic ghi vào SQLite tới provider một cách ẩn danh,
có giới hạn và chịu lỗi; cho người dùng gửi góp ý trong app; và chỉ gọi system store-review API ở
một thời điểm đủ điều kiện, không gián đoạn. Core Focus/Break/Reward/Shop/History phải tiếp tục chạy
offline và không được rollback vì network, provider, feedback hoặc store API.

Audit khóa sáu vertical Story theo dependency và privacy risk:

1. `US-11-01` khóa taxonomy/payload và provider-independent capture boundary.
2. `US-11-02` giao queue delivery bền vững qua offline/relaunch.
3. `US-11-03` nối PostHog Cloud EU với opt-out/reset hiện có.
4. `US-11-04` thay feedback prototype bằng flow production từ Settings.
5. `US-11-05` thực thi eligibility/cooldown và native store-review request.
6. `US-11-06` khóa integrity, operational evidence và exit EPIC-11.

Ngày 2026-09-13, owner duyệt toàn bộ `US1100-CONFIRM-01→10` theo Option A và yêu cầu tiến hành
coding. Implementation hiện có trong worktree, chưa commit/push và đang chờ owner quick UI; PostHog EU
credential, feedback endpoint, retention/cost owner và native build evidence vẫn là external gate.

## 1. Authority, baseline và source hierarchy

### 1.1 Git baseline

| Item | Audit result |
|---|---|
| Repository | `/Users/dunglu/Documents/Working/c92-pixel-doro` |
| Branch | `feats/epic-11` |
| HEAD | `a8dd7eb21dc978884994a46230fb9837d8d74f68` |
| Upstream | `origin/feats/epic-11` tại cùng exact SHA |
| Worktree trước task | Clean; không có owner change cần bảo tồn |
| EPIC-10 | `DONE_OWNER_ACCEPTED`; implementation `bee029a12576af8d8470668c1fa2ce8d8502ac4b` |
| Mutation policy | Chỉ planning docs/manual executable specification; không code/commit/push |

### 1.2 Source hierarchy

1. `PIXELDORO_CORE_TRUTH.md` hiện hành cho Product truth `LOCKED`, `MVP_DEFAULT`, `RESOLVED`.
2. ADR `ACCEPTED`, architecture/Data Model `APPROVED`, rồi specification `APPROVED`.
3. `MVP_EPICS.md`, accepted Exit Report/User Story record và exact implementation evidence.
4. Production code/test ở baseline chỉ chứng minh capability hiện có; code không tự tạo Product rule.
5. Prototype/mock/fixture chỉ là review aid, không phải production capability hoặc durable truth.
6. Nội dung `OPEN`, `PROPOSED`, `DEFERRED`, unchecked không được tự nâng thành requirement.

### 1.3 Tài liệu và implementation surface đã audit

- Product Core, Technical Documentation Checklist; Technical Overview, System Architecture,
  Project Structure, Data Model; toàn bộ ADR-001→008 và specification được chúng dẫn chiếu.
- `MVP_EPICS.md`; User Story, implementation plan/report/evidence, Exit Report và device guide của
  toàn bộ Epic hoàn thành, đặc biệt EPIC-05→10.
- Analytics types/mappers/recorders/capture gate/queue; installation identity; settings opt-out/reset;
  SQLite schema/repositories/queries; composition facade/lifecycle; feedback route/prototype; Settings,
  Home/Result routes; common presentation components; integration fixtures/tests và device harness.

## 2. Product/technical truth đã khóa

- App offline-first, không account. Analytics là best-effort side effect, không phải product truth.
- PostHog Cloud EU là provider đã chọn; profiles, autocapture, session replay, advertising ID, GeoIP,
  raw content và dev/test traffic bị cấm. Preview chỉ dùng project riêng khi được bật có chủ đích.
- Anonymous install ID ngẫu nhiên; opt-out dừng capture ngay, clear queue, rotate ID; opt-in không
  backfill. Provider retention tối đa 12 tháng.
- Payload tối đa 20 custom properties và 2 KiB; queue tối đa 1.000 event/device, TTL 7 ngày, drop
  oldest và local dropped counter không chứa payload.
- Delivery async/batch, exponential backoff, at-least-once và dùng stable `eventId` làm provider
  dedupe key. Capture/provider failure phải nằm ngoài core SQLite transaction.
- Feedback: score 1–5 bắt buộc, comment tùy chọn; entry luôn có trong Settings; cần network; không
  persist score/comment, không outbox/background retry, draft chỉ ở memory và có thể mất khi app đóng.
- Feedback content không bao giờ đi vào analytics/log. Feedback submit và analytics delivery là hai
  pipeline độc lập.
- Store review: system API qua adapter; không custom review UI/gate/incentive/satisfaction pre-question;
  không dùng feedback data hoặc suy diễn review outcome.
- Eligibility: production build; cài ít nhất 7 ngày; ít nhất 5 completed Standard Focus; ít nhất 3
  `scheduled_end_local_date` khác nhau; trial bị loại. Chỉ request ở Home sau reward/celebration đã
  hoàn tất, khi không active session/onboarding/modal.
- Mỗi native call được persist thành attempt ngay trước call, kể cả OS không hiện prompt; cooldown
  120 ngày, tối đa 3 attempt trong rolling 365 ngày, tối đa 1/app version; không retry ngay.
- Cost guardrail: 250 events/MAU/month, USD 50/month ceiling, alert 50/75/90%, review ở 500k
  events/month và phải duyệt trước 1M/tháng hoặc tăng spend.

## 3. Current capability audit

### 3.1 Production/reusable/prototype/missing/deferred matrix

| Capability | Classification | Audit evidence / EPIC-11 action |
|---|---|---|
| Schema `001` analytics/review tables | Production, reusable | Có queue state/index, unique `event_id`, unique review `app_version`; chưa thấy migration gap. |
| `BoundedAnalyticsQueue` | Production, reusable/extend | Cap 1.000, TTL 7 ngày, drop oldest, dedupe enqueue, due/retry/delete/clear đã có. Chưa có delivery coordinator/backoff/single-flight. |
| Analytics row mapper | Production, must harden | Reject name/key/value/size sai; hiện allowlist property là global, chưa khóa exact payload theo event. |
| Feature analytics hooks | Mixed production | Onboarding, Standard Focus, Break, Reward, Shop, Item, History đã enqueue; `focus_setup_viewed` chưa có recorder/hook. |
| Feedback/store event names | Placeholder contract only | Tên có trong union/mapping nhưng chưa có production trigger. |
| Capture gate + Settings opt-out | Production, reusable | Gate memory block trước durable Off; clear queue + rotate ID; opt-in không backfill; Retry có. |
| Anonymous installation identity | Production, reusable | Local install row và rotate path đã có. |
| Provider/delivery/network adapter | Missing | Không PostHog dependency/config/adapter, không batch sender, connectivity trigger hoặc delivery worker. |
| Feedback screen | Prototype only | Local mock state, PrototypeBadge/mock controls; không provider, controller, retry/idempotency production. |
| Settings feedback entry | Missing | Production Settings hiện không có entry “Góp ý cho PixelDoro”. |
| Feedback persistence/outbox | Explicitly prohibited | Data Model chọn memory-only form; không tạo table/migration/background auto-submit. |
| Store-review facts/repository | Production, reusable | Installation/session/local-day/attempt queries và unique version persistence đã có. |
| Store-review policy/use case/native adapter | Missing | Chưa eligibility decision service, trigger, `expo-store-review`, adapter hoặc event hook. |
| Lifecycle/command coordination | Production, reusable/extend | Bootstrap/foreground subscription và serialized session commands có; delivery cần riêng single-flight, review không chạy từ background. |
| Failure/recovery conventions | Production, reusable | Sanitized errors, explicit Retry, committed-truth projection, provider failure isolation. |
| Device fixtures/database convention | Production, reusable | Env-gated dev fixtures, exact disposable DB, safe reset/unset, honest `NOT_RUN`. |
| Full formal device/accessibility/release matrix | Deferred to EPIC-12 | EPIC-11 chỉ tạo/run story-owned evidence; không claim aggregate beta readiness. |

### 3.2 Existing common component inventory

| Primitive | Existing consumers / suitability |
|---|---|
| `ScreenShell`, `ScreenHeader`, `SectionLabel`, `Panel` | Production layout/card/section primitives across Settings, Home, Shop, History; reuse. |
| `Button` | Production CTA/busy/disabled base across flows; reuse, extend only if accessible busy API truly missing. |
| `ChoiceChip` | Production selection primitive in setup/settings; reuse inside rating control if semantics can be backward-compatible. |
| `ConfirmationDialog` | Production destructive confirmation; not needed for feedback or review. |
| `StatusSurface`, `InlineNotice` | Production empty/error/retry/status feedback; reuse. |
| `ToggleRow` | Production Settings control; analytics stays on existing component. |
| `PetPortrait` / Pet state variants | Domain-specific Pet avatar; do not relabel as generic avatar for feedback. |
| `ItemTile/Grid`, `RewardSummary`, `ProgressionSummary`, `Countdown`, `DurationControl`, `Stat` | Production but unrelated; do not reuse cosmetically. |
| Input/textarea | No common production primitive. One feedback consumer only, so feature-local wrapper first; promote only at second real consumer. |
| Icon button / generic badge / generic avatar | No common primitive and no EPIC-11 need; do not create speculatively. |

Common extraction still follows the repository rule: at least two real consumers or a demonstrated
cross-feature contract. Every touched common component keeps existing API behavior and adds regression
tests for old consumers. Screen files only bind projection, intents, components, layout and minimal
navigation; no SQLite, provider/native SDK, policy calculation or complex transformation. Hard limit
300 lines/file; review separation at about 240 lines without moving complexity into a giant hook/helper.

## 4. EPIC-11 boundary and gates

### 4.1 Outcome and in scope

- Final typed event taxonomy and exact per-event payload validation at capture and persistence read.
- Missing in-scope capture hook, durable delivery coordinator, bounded retries and local evidence.
- Privacy-safe PostHog Cloud EU adapter/config with opt-out/reset and provider failure isolation.
- Production feedback entry/form/submit/retry using an independent provider boundary.
- Store-review eligibility/request policy, durable attempt and native adapter.
- Story-owned offline/relaunch/background/privacy/a11y tests and EPIC-11 exit report inputs.

### 4.2 Explicitly out of scope

- Product analytics dashboard design/ongoing operation beyond retention/cost/config evidence.
- Full beta readiness aggregate, full physical-device/accessibility breadth, signing/distribution,
  production rollout and release artifact; these remain EPIC-12.
- Account/profile/cross-device identity, cloud history/sync, remote feature flags/A-B testing.
- Autocapture, replay, GeoIP, ad identifiers, notification/user contact identifiers or free text analytics.
- Feedback outbox/draft persistence/background submit, public reply/support ticket workflow.
- Custom review prompt/gate, review outcome tracking, incentive, rating pre-question or store deep-link CTA.
- Schema migration unless implementation proves a concrete schema-001 integrity gap and owner separately approves.

### 4.3 Start and exit gates

- Start gate met only for planning: EPIC-10 is `DONE_OWNER_ACCEPTED`; baseline event hooks/queue exist.
- Implementation start requires confirmations in §17 that block the relevant Story.
- EPIC exit requires six Story DoDs, owner-reviewed taxonomy, provider/config evidence, local adapter
  evidence, quick smoke result recorded honestly, automated quality gates, no privacy violations and
  an Exit Report. Documentation approval alone is not implementation completion.

## 5. Assumptions and unresolved decisions

Planning assumptions, not approved requirements:

- Existing schema can support queue and review policy without migration.
- Delivery can be single-process/single-flight; no `in_flight` durable state is needed for at-least-once.
- A provider acceptance followed by crash-before-delete may resend; stable event ID must be mapped to
  provider dedupe (`$insert_id` or verified equivalent) instead of claiming exactly-once.
- Settings-only feedback entry is the smallest MVP. Contextual invitations are optional Product text,
  not a launch requirement.
- A direct HTTPS provider adapter may reduce native/SDK surface, but transport must be confirmed and
  verified against current official provider contract during implementation.

Unresolved owner decisions are not silently resolved here; see §17.

## 6. Prioritized Story list

| Order | Story | Priority | Observable outcome | Primary gate |
|---:|---|---|---|---|
| 1 | `US-11-01` — Validated analytics contract | P0 privacy/integrity | Invalid name/event-specific payload never enters queue; complete local taxonomy is inspectable. | `CONFIRM-01`, taxonomy approval |
| 2 | `US-11-02` — Durable bounded delivery | P0 integrity | Due events survive offline/relaunch and retry without unbounded growth or same-process overlap. | `CONFIRM-02` retry policy |
| 3 | `US-11-03` — Privacy-safe PostHog delivery | P0 privacy/operational | Analytics On delivers anonymous allowlisted events; Off stops/cleans without affecting core. | `CONFIRM-03/04`, provider config |
| 4 | `US-11-04` — In-app feedback | P1 user value | User can send 1–5 score + optional comment from Settings and explicitly retry a failed submit. | `CONFIRM-05/06/07` |
| 5 | `US-11-05` — Respectful store review | P1 growth/integrity | Eligible production user may receive one native request at a safe Home stopping point; policy prevents spam. | `CONFIRM-08` |
| 6 | `US-11-06` — Integrity and exit evidence | P0 release gate | EPIC-11 has reproducible local evidence and bounded operational handoff without claiming EPIC-12. | Prior Stories + `CONFIRM-09/10` |

## 7. US-11-01 — Validated analytics contract

**Priority/order:** P0 / 1.

**User outcome:** analytics cannot leak unexpected data or corrupt the offline experience; maintainers can
inspect one provider-independent typed contract for every approved event.

### Flow, alternate, failure and lifecycle

- Happy: a committed feature fact reaches its recorder, passes the exact event schema and capture gate,
  then is inserted once with deterministic ID/occurredAt/TTL.
- Alternate: analytics Off returns `skipped_disabled`; event is never constructed for later backfill.
- Error/recovery: invalid name/property/value/size is rejected and sanitized locally; queue failure is
  best-effort and never changes or rolls back product fact. Fixing config affects only future intents.
- Background/foreground/relaunch: capture happens only on the owning committed intent, never by scanning
  history at boot/foreground. Relaunch reads existing valid queue rows; corrupt rows fail closed.
- Offline: enqueue remains local and succeeds; no network is required.
- Privacy/a11y: no new user UI. If a local review surface is implemented, it exposes counts/name/error
  codes only, never payload/free text, and remains screen-reader legible.

### Scope, dependencies, reuse and missing capability

- In: discriminated event union/schema; per-event exact keys/value enums; validation before enqueue and
  on SQLite read; missing `focus_setup_viewed` hook; stable IDs; trial exclusions; unit/integration evidence.
- Out: provider HTTP, retry scheduling, dashboards, new product metrics, retrospective backfill.
- Dependencies/start gate: EPIC-05→10 recorders and schema-001 queue; `US1100-CONFIRM-01` approves
  final table. Start only from clean reviewed baseline.
- Reuse: event repository, mapper byte counter, queue, capture gate, feature recorders and command patterns.
- Missing: event-specific types/validator, one Focus Setup recorder/hook, canonical taxonomy document/test.

### Data, transaction, concurrency, idempotency and stale rules

- Read: committed domain/application facts and current durable analytics preference through the gate.
- Write: one `analytics_events` row/event; no product table mutation.
- Enqueue validation/dedupe/cap/insert stays one SQLite transaction and outside core transaction.
- Deterministic IDs use immutable owning facts. Concurrent duplicate capture returns `already_queued`.
- Do not capture after delayed/stale screen completion; hook belongs to accepted intent/committed result.
- Trial produces only onboarding events; never standard focus/reward analytics.

### UI states

| State | Required behavior |
|---|---|
| loading / ready / empty | No new UI; core screen keeps its own state. Local test probe may show sanitized ready/empty counts. |
| submitting / success | Capture is unobtrusive background side effect; never changes CTA label/layout or displays success. |
| failure / retry | Core flow succeeds; diagnostic code/test probe only. No user retry because replay would fabricate an intent. |
| offline | Same local enqueue path; no network banner. |
| disabled/ineligible | Analytics Off skips immediately and creates no backlog. |
| permission/system unavailable | N/A; capture contract requests no permission/native API. |

### Data minimization and event validation

- Only §13 event names and exact payloads; unknown or extra key rejects the whole event.
- No comment, work text beyond fixed `workTag` enum, route title, error message/stack, file/DB path,
  contact, device/ad ID, IP/GeoIP, notification ID, provider response, review outcome or arbitrary string.
- Max 20 custom properties and 2 KiB remain defense-in-depth even where exact schemas are smaller.

### Automated/manual/rollback

| Layer | Required automated evidence |
|---|---|
| Domain | Fact validators preserve duration/mode/tag/session/reward constraints and trial exclusion. |
| Application | Each event accepts exact schema; rejects missing/extra/wrong-type/range; Off does not call queue. |
| Persistence/real SQLite | Invalid taxonomy/payload/corrupt row rejected; stable duplicate inserts once; cap/TTL unaffected. |
| Composition | Every recorder receives the coordinated gate/queue; Focus Setup hook exists once. |
| Provider | Fake boundary proves canonical event shape; no concrete provider in this Story. |
| Presentation/route/static | No provider/SQLite import; Focus Setup interaction emits once without UI flicker. |
| Failure/race/privacy | queue throw cannot affect core; double tap/reopen/stale completion does not multiply event; free text rejected. |

Manual smoke: `E11-01`, `E11-02`, `E11-03` in the guide; inspect local adapter/probe only, never
production dashboard. Rollback removes the new recorder/hook and event-schema changes together; do not
leave a producer whose schema is rejected. Existing queue rows remain readable or are explicitly
purged only through the analytics privacy path, never by destructive DB surgery.

### UI/component reuse matrix

| UI element | Reuse existing | Extend common | Create common | Feature-local | Consumers | Test impact |
|---|---|---|---|---|---|---|
| Core feature surfaces | Existing feature UI | No | No | No | Setup/Focus/Break/Shop/History | Regression: no visual/busy/navigation change |
| Optional dev-only sanitized probe | `Panel`, `StatusSurface` | No | No | Yes — fixture-only diagnostics have no product consumer | Device reviewer only | Static dev-only gating + no payload rendering |

### DoR, DoD, owner gate and checklist

**DoR:** exact taxonomy approved; producer-to-fact map reviewed; ID rules defined; no schema/dependency
change; fixtures named. **DoD:** exact validation at both boundaries, missing hook implemented, all
producer tests/real SQLite/privacy tests pass, no core regression, evidence recorded at exact SHA.
**Owner acceptance:** owner reviews taxonomy and a local capture sample with analytics On/Off; manual
rows remain `NOT_RUN` until executed.

- [ ] `US1100-CONFIRM-01` approved.
- [ ] Implement exact per-event types and validators.
- [ ] Add `focus_setup_viewed` at the approved user intent, once per focus episode.
- [ ] Prove invalid/extra/free-text payload rejection and trial exclusions.
- [ ] Prove Off/no-backfill/core-failure isolation.
- [ ] Record automated and manual evidence at exact implementation SHA.

**Expected output:** typed event contract/validator, updated recorders/mapper/composition, focused unit and
SQLite integration tests, fixture evidence and taxonomy review record.

**Prohibited:** provider SDK/network, dynamic event names/properties, history scan/backfill, screen-level
analytics logic, PII/raw content, schema migration, dashboard work or EPIC-12 aggregate claims.

## 8. US-11-02 — Durable bounded delivery across offline/relaunch

**Priority/order:** P0 / 2.

**User outcome:** analytics never blocks the app; queued data is bounded and gets another safe delivery
chance after network recovery/relaunch without uncontrolled duplicates.

### Flow, alternate, failure and lifecycle

- Happy: boot/foreground/post-capture signal asks a single-flight coordinator for due rows; it sends a
  bounded batch through `AnalyticsDeliveryPort`, then deletes only provider-accepted event IDs.
- Alternate: empty/not-due queue is a no-op. Concurrent triggers coalesce rather than start parallel sends.
- Error/retry: transient failure increments attempt and schedules exponential retry; permanent invalid
  local shape is rejected before provider. Queue read/write error ends the pass and leaves core ready.
- Background: foreground→background cancels/ends new work best-effort; no long task is promised. A
  completion arriving after opt-out is stale and cannot mutate the newly cleared queue.
- Relaunch: durable `retry_wait` rows become due by timestamp; no boot history scan. Crash after remote
  accept but before delete may resend same stable ID, which provider dedupe must tolerate.
- Offline: keep rows until due retry/TTL/cap; never show a blocking app error.
- Privacy/a11y: no payload logging and no product UI; local probe exposes status/counters without content.

### Scope, dependencies, reuse and missing capability

- In: delivery port/result contract, coordinator, batch limit, retry schedule, single-flight/lifecycle,
  TTL/cap/drop counter, accepted-delete and retry marking, deterministic fake adapter/probe.
- Out: real PostHog credentials/transport, OS background service, guaranteed exactly-once, dashboards.
- Dependency/start: `US-11-01`; owner approves `CONFIRM-02` values.
- Reuse: schema/repository/queue, app lifecycle, capture gate, clock/ID injection, fixture conventions.
- Missing: worker/coordinator, adapter port, connectivity-independent trigger, local dropped counter and
  explicit stale generation/cancellation barrier coordinated with privacy cleanup.

### Data and integrity rules

- Read due rows ordered deterministically; write only retry metadata, deletes and payload-free drop count.
- Never hold core transaction during provider call. Never delete before accepted result.
- One process pass at a time. Batch result must identify accepted/retryable/rejected IDs exactly; unknown
  response IDs are corruption and do not delete rows.
- Opt-out generation/token invalidates in-flight completion. A stale sender cannot reinsert or mark rows.
- Queue remains 1.000 max; drop oldest ordering must be deterministic (`created_at`, then `event_id`).

### UI states

| State | Required behavior |
|---|---|
| loading / ready / empty | App bootstrap is not held by delivery; empty is silent no-op. |
| submitting / success | Background send has no label flicker/layout shift/control lock/success toast. |
| failure / retry | Silent scheduled retry; only sanitized dev evidence, no core Recovery screen. |
| offline | Queue preserved/bounded; retry on approved trigger, not busy loop. |
| disabled/ineligible | Gate Off cancels/invalidates pass and privacy cleanup owns queue clear. |
| permission/system unavailable | N/A; no permission. Network/provider unavailable maps to retry. |

### Data minimization/validation

Adapter receives only canonical event, anonymous install ID, event ID and occurrence time. Attempt
count, local DB path, internal failure text and dropped counter are not event properties. Payload is
revalidated immediately before delivery.

### Automated/manual/rollback

| Layer | Required automated evidence |
|---|---|
| Application | empty/no-op, bounded batch, success-delete, retry schedule, mixed result, single-flight. |
| Persistence/SQLite | cap/TTL/oldest eviction, retry survives reopen, accepted delete exact IDs, rollback on write failure. |
| Composition/lifecycle | boot/foreground trigger once, background/Off invalidates stale completion. |
| Adapter contract | fake accepted/retryable/permanent/malformed/throw/timeout responses. |
| Failure/race | duplicate triggers, kill-before-send, kill-after-accept-before-delete, Off during send, TTL during retry. |
| Privacy | no logs/payload counter; no Off capture/backfill; provider never sees rejected event. |

Manual: `E11-04`→`E11-08`. Rollback disables delivery wiring fail-closed while retaining the already
bounded local queue; never disable cap/TTL or delete user product data.

### UI/component reuse matrix

| UI element | Reuse existing | Extend common | Create common | Feature-local | Consumers | Test impact |
|---|---|---|---|---|---|---|
| Product UI | Existing shells/states unchanged | No | No | No | Whole app | No spinner/banner regression |
| Dev delivery probe | `Panel`, `StatusSurface`, `Button` if interactive retry is needed | No | No | Yes — dev-only adapter evidence | Device reviewer | Dev gating, sanitized output, a11y labels |

### DoR, DoD, gate and checklist

**DoR:** `US-11-01` accepted; retry/batch triggers approved; fake result contract frozen. **DoD:** queue
survives relaunch, bounded eviction/TTL deterministic, no overlapping pass, accepted-only delete and
stale opt-out race tests pass. **Owner acceptance:** offline→relaunch→retry local probe demonstrates one
logical event ID and no core UI disruption.

- [ ] `US1100-CONFIRM-02` approved.
- [ ] Implement delivery port and single-flight coordinator outside core transactions.
- [ ] Implement approved backoff/batch/lifecycle triggers and payload-free drop counter.
- [ ] Cover provider failure, retry, mixed result, kill/relaunch, stale Off and duplicate trigger races.
- [ ] Record real SQLite and device evidence at exact SHA.

**Expected output:** delivery port/coordinator, queue extensions only if needed, fake adapter/probe,
application/composition/SQLite tests and retry evidence.

**Prohibited:** unbounded queue/retry loop, core-screen loading, network inside core transaction, durable
`in_flight` without a new approved design, background service promise, exactly-once claim or real provider.

## 9. US-11-03 — Privacy-safe PostHog Cloud EU delivery

**Priority/order:** P0 / 3.

**User outcome:** when analytics is On, only anonymous approved events may reach the configured EU
project; when Off, capture/delivery stop immediately and core use remains unaffected.

### Flow, alternate, failure and lifecycle

- Happy: configured production/intentional preview build maps a canonical batch to provider with stable
  anonymous install ID and dedupe ID; accepted results remove queue rows.
- Alternate: dev/test, missing/invalid config and analytics Off fail closed for network delivery. Preview
  uses a separate project only when explicitly configured.
- Failure/recovery: timeout/429/5xx is retryable; verified permanent request rejection follows approved
  policy without leaking payload. Provider outage never changes Focus/Reward/Settings success.
- Background/foreground/relaunch: flush only through `US-11-02` lifecycle rules; best-effort app-state
  handoff, durable retry after relaunch; no background review request.
- Offline: no request or safe fast failure, queue remains bounded.
- Privacy/a11y: existing Settings analytics toggle is the user control; its existing Off/Retry messaging
  remains accessible. No new permission prompt.

### Scope, dependencies, reuse and missing capability

- In: concrete PostHog EU adapter/config, anonymous mapping, dedupe mapping, environment isolation,
  opt-out/reset/in-flight coordination, sanitized diagnostics, retention/cost readiness evidence.
- Out: profiles, identify, autocapture, replay, GeoIP, dashboards beyond setup/cost evidence, experimentation.
- Dependency/start: `US-11-01/02`, `CONFIRM-03/04`, owner-supplied project/key and verified provider docs.
- Reuse: Settings toggle/controller/capture barrier, anonymous ID rotation, queue clear, delivery port.
- Missing: dependency or HTTPS adapter, config parser, provider contract tests, live preview evidence.

### Data and integrity rules

- Read current anonymous install ID only after capture gate permits delivery; never cache across rotation.
- Provider call outside SQLite transaction. Opt-out blocks first, persists Off, clears queue, rotates ID.
- In-flight result carries privacy generation; stale completion after Off cannot delete/mark rows of a new
  generation. Opt-in starts empty and only future events use the rotated ID.
- Stable event ID maps to verified PostHog dedupe field; do not use session/purchase IDs as distinct ID.

### UI states

| State | Required behavior |
|---|---|
| loading / ready / empty | Existing Settings hydration/ready; queue state is not displayed. |
| submitting / success | Toggle local save follows EPIC-10 unobtrusive behavior; no provider-success UI. |
| failure / retry | Cleanup failure keeps capture blocked and shows existing sanitized Retry. Provider failure stays silent. |
| offline | Toggle/cleanup works locally; sending waits. |
| disabled/ineligible | Off/dev/test/missing config sends nothing. |
| permission/system unavailable | No OS permission; unavailable provider is isolated/retryable or fail-closed config state. |

### Data minimization/validation

- `distinct_id` is only the random anonymous install ID; person profiles disabled.
- Disable automatic device/screen/lifecycle/location properties to the extent supported by chosen
  transport. Only canonical custom payload plus event ID/time is sent.
- No provider body/header/credential in logs/screens/errors. Endpoint must be EU host from verified config.

### Automated/manual/rollback

| Layer | Required automated evidence |
|---|---|
| Adapter contract | exact URL/config, request schema, dedupe mapping, partial/retry classifications, timeout/redaction. |
| Application | On/Off/reset/opt-in generations, no backfill, provider throw isolation. |
| Composition | dev/test disabled, preview separate, production missing config fail-closed, lifecycle wiring once. |
| Persistence/SQLite | Off clears rows and rotates identity durably; relaunch preserves Off/empty queue. |
| Presentation | Settings common regression, accessible status/Retry, no provider imports. |
| Privacy/race | Off during in-flight, reset during send, stale provider response, forbidden automatic properties. |

Manual: `E11-09`→`E11-13`; local adapter evidence is sufficient for behavior. Live provider row is
`BLOCKED` until credentials/project exist and does not authorize production dashboard access. Rollback
removes/disables concrete adapter/config and leaves delivery port fail-closed; preserve Settings Off and
queue privacy behavior.

### UI/component reuse matrix

| UI element | Reuse existing | Extend common | Create common | Feature-local | Consumers | Test impact |
|---|---|---|---|---|---|---|
| Analytics control | `ToggleRow`, `InlineNotice`, `Button`, Settings section | Only if existing busy/a11y state lacks required API | No | No | Existing Settings | Full EPIC-10 consumer regression |
| Provider state | No product UI | No | No | Dev-only sanitized probe from US-11-02 | Reviewer | No payload/key exposure |

### DoR, DoD, gate and checklist

**DoR:** transport/config approved, current official provider contract checked, credentials injected outside
repo, retention/cost owner named. **DoD:** contract/privacy tests pass; EU/environment config verified;
Off/reset races and no-backfill proven; core unaffected; live evidence either PASS or explicitly BLOCKED.
**Owner acceptance:** approves sanitized local sample, config/retention/cost record and analytics toggle path.

- [ ] `US1100-CONFIRM-03` and `US1100-CONFIRM-04` approved.
- [ ] Implement concrete adapter without profiles/autocapture/replay/GeoIP.
- [ ] Prove environment separation, stable dedupe and response classification.
- [ ] Prove Off/reset/in-flight/no-backfill and provider-failure isolation.
- [ ] Record cost/retention configuration owner and exact-SHA evidence.

**Expected output:** provider adapter/config boundary, contract tests, composition wiring, privacy integration
tests, sanitized provider/config evidence and operational handoff.

**Prohibited:** checked-in secret, US data host, identify/profile, autocapture/replay, raw logs/content,
dev/test events, dashboard scope creep or provider call from UI/core transaction.

## 10. US-11-04 — In-app feedback from Settings

**Priority/order:** P1 / 4.

**User outcome:** user can open “Góp ý cho PixelDoro”, select score 1–5, optionally write a comment,
submit with clear status and retry a network failure without duplicate submissions.

### Flow, alternate, failure and lifecycle

- Happy: Settings entry opens form; score enables Submit; controller trims/validates input, assigns one
  in-memory submission ID, sends once, shows success, then allows safe close.
- Alternate: empty comment is valid; Cancel/Back before send discards memory draft. Contextual prompt is
  absent unless separately approved later.
- Error/retry: network/provider error keeps draft and same submission ID while screen remains open; Retry
  reuses it. Validation error focuses the affected control. Provider permanent rejection is sanitized.
- Background/foreground: form stays in memory while process lives; active submit result may update only
  the same mounted/generation state. Background does not auto-submit.
- Relaunch/kill: draft and pending retry may be lost by design; no outbox/auto-submit/duplicate replay.
- Offline: form can be composed; Submit gives explicit offline/failure state and Retry after recovery.
- Privacy: comment/score go only to feedback provider contract; comment never analytics/log/SQLite.
- Accessibility: labeled 1–5 radiogroup, selected state not color-only, logical focus, error announcement,
  keyboard/screen-reader textarea, >=44pt touch targets, Largest Text scrolling, Reduce Motion.

### Scope, dependencies, reuse and missing capability

- In: Settings entry, production route/screen/controller, memory draft, rating/comment validation,
  independent feedback port/adapter, explicit Retry/idempotency, analytics `feedback_started/submitted`
  without score/comment, component/a11y tests.
- Out: feedback persistence/outbox/background retry, attachment, support inbox UI, NPS dashboard,
  contextual solicitation, store-review branching.
- Dependency/start: `US-11-01`; `CONFIRM-05/06/07`; provider endpoint/auth test facility.
- Reuse: `ScreenShell`, `ScreenHeader`, `Panel`, `SectionLabel`, `ChoiceChip`, `Button`, `InlineNotice`/
  `StatusSurface`, router pattern and EPIC-10 settings row/navigation styling.
- Missing: feedback provider/contract, controller, Settings entry, production screen, feature-local rating
  group/comment field, submission generation/stale completion rules.

### Data and integrity rules

- Read/write form only in memory; write no SQLite row. Provider receives only approved feedback fields.
- Generate submission ID once per Submit intent and reuse for explicit Retry; new edit after failure either
  retains the ID for the same logical submission or invalidates and creates a new ID per approved contract.
- Single-flight submit; double tap coalesces. Late result from prior screen/generation is ignored.
- `feedback_started` emits once per form visit/episode; `feedback_submitted` only after provider acceptance;
  their analytics payload is `{}` and their failure cannot change feedback outcome.

### UI states

| State | Required behavior |
|---|---|
| loading | No blocking data load; screen renders form immediately. |
| ready | No score selected, comment editable, Submit disabled with accessible reason. |
| empty | Empty comment is valid; missing score is the only empty-required state. |
| submitting | Inputs/Back policy explicit, one stable busy label, no double submit/layout shift. |
| success | Confirmation text/role, no review prompt, safe return to Settings. |
| failure | Sanitized message preserves in-memory draft and focuses/announces error. |
| retry | Explicit Retry reuses submission ID; editing follows approved ID rule. |
| offline | Clear network-needed state; no auto-submit when network returns. |
| disabled/ineligible | Submit disabled until valid score and while single-flight. |
| permission/system unavailable | N/A unless provider config unavailable; show non-destructive unavailable state. |

### UI/component reuse matrix

| UI element | Reuse existing | Extend common | Create common | Feature-local | Consumers | Test impact |
|---|---|---|---|---|---|---|
| Screen/layout/card/header | `ScreenShell`, `ScreenHeader`, `Panel`, `SectionLabel` | No | No | No | Feedback + existing screens | Existing snapshots/behavior unchanged |
| Score 1–5 | `ChoiceChip` items | Only backward-compatible radio semantics if missing | No | `FeedbackRatingGroup` — composite/label/error is unique to one flow | Feedback | Chip regression + radiogroup focus/a11y |
| Comment | Raw RN `TextInput` inside wrapper | No proven second consumer | No | `FeedbackCommentField` — one product consumer; owns label/count/error only | Feedback | Unicode/max/keyboard/screen-reader tests |
| Primary/Retry/Close | `Button` | Only if accessible busy state truly missing | No | No | Feedback + existing consumers | Button regression if extended |
| Error/success/offline | `InlineNotice` or `StatusSurface` | No | No | No | Feedback + existing features | Existing status consumer regression |
| Settings entry row | Existing Settings row/layout pattern | Extract common only if now >=2 identical navigation-row consumers | Conditional after consumer audit | Feature-local only if Settings-specific API differs | Settings/Feedback | Route/static/a11y tests |

### Data minimization/validation

- Proposed pending approval: score integer 1–5; comment trimmed, optional, max 1.000 Unicode code points
  and 4 KiB UTF-8; submission ID, app version and platform only. No analytics ID, session/history/reward,
  device name, contact, locale/location, raw error or database data.
- Never put score/comment in analytics payload. Never log request body.

### Automated/manual/rollback

| Layer | Required automated evidence |
|---|---|
| Application/controller | validation, state machine, explicit retry same ID, edit/stale/unmount/double tap, success event timing. |
| Adapter contract | exact allowlist, idempotency key, timeout/rejection/redaction; comment never analytics. |
| Persistence/SQLite | assert zero feedback draft/content/outbox rows before/after/relaunch. |
| Composition | production adapter injected; provider failure isolated; analytics recorder independent. |
| Presentation/component | all states, Largest Text, VO/TalkBack roles/state/focus, keyboard, Reduce Motion. |
| Route/static | Settings entry always present; screen imports facade/controller only, no SQLite/provider. |

Manual: `E11-14`→`E11-19`. Rollback can remove provider wiring/disable Submit with honest unavailable
state; do not restore prototype/mock submit as production. Keep Settings navigation only if destination
truthfully explains unavailable state.

### DoR, DoD, gate and checklist

**DoR:** provider/contract/input limits/entry policy approved; copy/flow reviewed; test endpoint handles
idempotency. **DoD:** production label/no PrototypeBadge, memory-only flow, retry same ID/no duplicate,
no raw content analytics/log/SQLite, a11y tests and device evidence pass. **Owner acceptance:** submits
happy/error/retry path, verifies Settings entry and confirms no review gating.

- [ ] `US1100-CONFIRM-05/06/07` approved.
- [ ] Approve clickable state/copy review before provider implementation.
- [ ] Implement thin screen + controller + feedback port/adapter and memory-only draft.
- [ ] Prove retry/no duplicate/stale completion/no persistence/no content analytics.
- [ ] Prove accessibility and local provider-boundary evidence at exact SHA.

**Expected output:** Settings entry, production feedback route/components/controller/adapter, tests, fixture
and exact-SHA evidence.

**Prohibited:** feedback table/outbox/draft persistence, automatic retry, raw content analytics/log,
email/contact collection, review prompt/gate, screen business logic or speculative common input library.

## 11. US-11-05 — Respectful store-review request

**Priority/order:** P1 / 5.

**User outcome:** an eligible production user may see the OS review prompt only at a safe Home stopping
point, while ineligible/cooldown/unavailable paths stay silent and never interrupt core work.

### Flow, alternate, failure and lifecycle

- Happy: after a fresh completed Standard Focus reward/celebration returns to Home, controller derives
  eligibility from durable facts; if eligible and native API available, persist attempt, then call once.
- Alternate: install age/session/day/version/cooldown/year cap not met, active session/onboarding/modal,
  non-production build or not a fresh stopping point => silent ineligible result, no attempt.
- Error/recovery: eligibility read failure or attempt write failure means no native call. API unavailable/
  unsupported/throw after committed attempt does not crash and is not immediately retried.
- Background/foreground: never request while background/inactive; foreground alone is not eligibility
  trigger. A stale eligibility result after navigation/background/modal/session change is discarded.
- Relaunch: a persisted attempt prevents repeat; relaunch does not recreate the consumed trigger.
- Offline: policy derivation is local; adapter availability may be false. No network requirement is imposed
  on core and no retry loop starts.
- Privacy/a11y: no custom prompt/UI or feedback-data input. OS owns prompt accessibility. Home does not
  change focus/order/animation; Reduce Motion celebration behavior remains existing behavior.

### Scope, dependencies, reuse and missing capability

- In: pure eligibility policy, safe trigger token, repository facts, persist-before-call application use
  case, native port/`expo-store-review` adapter, production/version/availability checks, one anonymous
  `store_review_requested` event after attempt commit.
- Out: custom rating dialog, satisfaction pre-question, feedback branching, outcome inference/tracking,
  store page CTA, notification, immediate retry, dashboard.
- Dependency/start: `US-11-01`, production Home/Result/reward flow, `CONFIRM-08`, native build capability.
- Reuse: installation/session/local-day/review-attempt repositories, command coordination, app-state,
  Home/Result transition and analytics queue.
- Missing: policy/use case, fresh trigger, app version/build-kind port, native adapter/dependency, tests.

### Data and integrity rules

- Read `installed_at`, completed Standard Focus count, distinct persisted `scheduled_end_local_date`,
  latest/rolling/current-version attempts, current active session/modal/app state/build/version.
- Write `store_review_attempts` exactly once in a transaction before native call; then enqueue analytics
  best-effort outside that transaction. No feedback read.
- Eligibility boundary values: >=7 days, >=5 sessions, >=3 days; latest attempt must be >=120 days ago;
  fewer than 3 in rolling 365 days; no current-version attempt.
- Serialize competing triggers; unique `app_version` is final guard. Re-read/commit atomically enough that
  two stale eligible decisions cannot call twice. Late native result is ignored and never infers outcome.

### UI states

| State | Required behavior |
|---|---|
| loading / ready / empty | No custom loading/empty UI; Home remains usable. Eligibility runs unobtrusively. |
| submitting / success | No custom busy/success. OS prompt, if shown, is the only review UI. |
| failure / retry | Silent sanitized failure; no immediate/manual Retry. Future policy attempt waits for all caps. |
| offline | Core Home unaffected; unavailable adapter path is silent. |
| disabled/ineligible | Silent no-op with payload-free local reason in tests only. |
| permission/system unavailable | No permission request; unavailable/unsupported API makes no call and no crash. |

### UI/component reuse matrix

| UI element | Reuse existing | Extend common | Create common | Feature-local | Consumers | Test impact |
|---|---|---|---|---|---|---|
| Home/reward stopping point | Existing Home/Result/Pet components | No | No | No | Existing core flow | Assert no layout/focus/animation regression |
| Review prompt | Native system UI via adapter | No | No | No custom component allowed | OS | Native availability/call-count evidence |
| Ineligible/error state | No product UI | No | No | Dev-only sanitized fixture output — policy audit only | Reviewer | No reason/payload leaks to product UI |

### Data minimization/validation

- Provider receives native request only; no rating/outcome/user data exists. Analytics event uses stable
  attempt-derived ID and approved non-content payload (proposed `{}` or approved `attemptCount` only).
- Do not send installation timestamp, exact session dates/counts, app state or eligibility reason.

### Automated/manual/rollback

| Layer | Required automated evidence |
|---|---|
| Domain/application | every threshold edge, trial exclusion, local-day distinctness, caps/cooldowns/version, safe context. |
| Persistence/SQLite | exact facts, inclusive boundary tests, unique version race, write failure => zero calls, reopen prevents repeat. |
| Adapter contract | available/unavailable/unsupported/throw and exactly one call after committed attempt. |
| Composition/lifecycle | production-only, fresh Home token, no background/foreground-only request, stale result discarded. |
| Presentation/route | no custom gate/prompt, no feedback dependency, Home remains operable/a11y-stable. |
| Analytics/privacy | request event only after attempt commit; no outcome/facts/feedback payload; queue failure isolated. |

Manual: `E11-20`→`E11-26`. Native prompt display is OS-controlled; evidence asserts request invocation and
attempt, not that a dialog appeared. Rollback disables trigger/adapter while retaining attempt history;
never delete attempts to force re-prompt on real user data.

### DoR, DoD, gate and checklist

**DoR:** trigger/native dependency approved; app version/build-kind source defined; fixture seeds exact
boundaries in disposable DB. **DoD:** thresholds/caps/races persist-before-call proven; native unavailable
safe; no feedback/custom gate/outcome tracking; production device evidence recorded or honestly BLOCKED.
**Owner acceptance:** reviews eligible/ineligible/cooldown fixture results and safe Home timing.

- [ ] `US1100-CONFIRM-08` approved.
- [ ] Implement pure policy + serialized persist-before-call use case.
- [ ] Add native adapter/dependency only after approval and rebuild native Development Build.
- [ ] Prove thresholds, cooldown/year/version caps, races, relaunch, unavailable and lifecycle rules.
- [ ] Record attempt/call-count local evidence without claiming OS displayed prompt.

**Expected output:** policy/use case/native port+adapter/composition wiring, tests, disposable fixtures and
exact-SHA native evidence.

**Prohibited:** custom pre-prompt/gate, feedback read, outcome inference, attempt deletion, immediate retry,
request during session/onboarding/modal/background, OTA-only native release or EPIC-12 distribution work.

## 12. US-11-06 — EPIC-11 integrity hardening and exit evidence

**Priority/order:** P0 release gate / 6.

**User outcome:** the beta-signal capabilities can be reviewed and rolled back confidently without
weakening offline core behavior or overstating unrun platform evidence.

### Flow, alternate, failure and lifecycle

- Happy: deterministic disposable fixture runs analytics On/Off/offline/relaunch/provider failure,
  feedback happy/retry and review policy paths; evidence records exact SHA and sanitized facts.
- Alternate: provider credentials/native build/device unavailable becomes `BLOCKED`/`NOT_RUN`, while
  local adapter/SQLite evidence can still pass independently.
- Error/recovery: any privacy/integrity violation blocks exit; core regression rolls back the owning Story.
- Background/foreground/relaunch/offline: combined fixture proves no forbidden flush/request, queue retry
  persists, feedback is not auto-resubmitted, review is not repeated.
- Privacy/a11y: evidence contains no payload/comment/secret/PII; story-owned Largest Text, screen reader
  and Reduce Motion rows are executed where available, never inferred from another platform.

### Scope, dependencies, reuse and missing capability

- In: cross-Story integration tests, dev-only fixture/probe, guide validation, cost/taxonomy/privacy report,
  quick owner smoke and Exit Report inputs.
- Out: full formal iOS/Android/minimum-device matrix, release signing/distribution/rollout, full dashboard
  operation and MVP aggregate; EPIC-12 owns them.
- Dependencies/start: `US-11-01→05` implementation candidates; `CONFIRM-09/10`.
- Reuse: device harness conventions, repository checks, exact-SHA evidence, disposable DB/reset fixtures.
- Missing: EPIC-11 aggregate fixture, validator entries, Exit Report and operational owner evidence.

### Data and integrity rules

- Fixture only writes named disposable DB/provider fakes. It never opens/mutates/deletes `pixeldoro.db`.
- Each scenario resets through explicit confirmed fixture path; no wildcard delete.
- Parallel/late fixture callbacks use generation IDs; results cannot contaminate next scenario.
- Evidence records counts/IDs/status codes, not content/credentials or production user data.

### UI states

| State | Required behavior |
|---|---|
| loading / ready / empty | Fixture labels state explicitly and never masquerades as production. |
| submitting / success | Feedback state visible; analytics/review background work does not block core. |
| failure / retry | Injected failures show only owning feature behavior and preserve committed core data. |
| offline | Combined offline/relaunch path is runnable with local evidence. |
| disabled/ineligible | Analytics Off and review ineligible have deterministic evidence. |
| permission/system unavailable | Store API/provider prerequisites recorded `BLOCKED/NOT_RUN`, never fake PASS. |

### UI/component reuse matrix

| UI element | Reuse existing | Extend common | Create common | Feature-local | Consumers | Test impact |
|---|---|---|---|---|---|---|
| Product flows | All components chosen in owning Stories | No new extension here | No | No | Settings/Feedback/Home | Run common regression suite |
| Review fixture panel | `Panel`, `StatusSurface`, `Button` | No | No | Yes — dev-only orchestration/evidence | Reviewer | Dev gating, state reset, sanitized a11y |

### Data minimization/validation

- Re-run exact taxonomy/payload/privacy suite and grep/static boundary for provider/native imports.
- Cost report uses aggregate event counts only. Manual artifacts redact key, anonymous ID and comment.

### Automated/manual/rollback

| Layer | Required automated evidence |
|---|---|
| Domain/application | all Story matrices plus combined failure/race paths. |
| Persistence/real SQLite | cap/TTL/relaunch/opt-out, feedback zero persistence, review attempt durability. |
| Composition/provider/native | environment gates, injected adapter failures, one wiring instance/call. |
| Presentation/static | no prototype badge/mock path, no forbidden imports, common regressions, line limits. |
| Device/docs | harness validator recognizes guide/fixture; every result starts/remaining unrun stays `NOT_RUN`. |

Manual: entire `epic-11-quick-ui-smoke.md`; quick path <10 minutes plus separate structured rows.
Rollback is per Story: provider fail-closed, feedback Submit unavailable without fake success, review trigger
disabled without deleting attempts. A privacy breach requires stop-ship and queue/identity cleanup through
approved application path.

### DoR, DoD, gate and checklist

**DoR:** five Story candidates and fixtures available at one exact SHA; owner defines acceptable blocked
external rows. **DoD:** required automated checks pass; quick manual result honest; provider/cost/retention
evidence present or explicit blocker; Exit Report reviewed; roadmap only then may mark EPIC-11 done.
**Owner acceptance:** owner explicitly accepts exact SHA and named deferred EPIC-12 breadth.

- [ ] `US1100-CONFIRM-09/10` approved.
- [ ] Implement dev-only isolated aggregate fixture and device-validator rules.
- [ ] Run full required automated/privacy/boundary/common regression matrix.
- [ ] Execute owner quick smoke; retain `NOT_RUN/BLOCKED` per unexecuted case.
- [ ] Produce Exit Report/cost-retention handoff and obtain explicit owner acceptance.

**Expected output:** combined integration/device fixture, updated validator, completed manual evidence,
operational handoff and future EPIC-11 Exit Report.

**Prohibited:** Story-free “test only” scope, production debug UI, production data/dashboard dependency,
secret/content artifacts, false PASS, EPIC-12 matrix/release work or roadmap completion before acceptance.

## 13. Analytics taxonomy and exact payload plan

This is the proposed review contract for `US1100-CONFIRM-01`; it is not approved merely by appearing here.
All property sets are exact: no additional key is accepted.

| Event | Producer/committed fact | Exact custom payload | Stable event ID rule | Status |
|---|---|---|---|---|
| `onboarding_started` | First-use onboarding episode | `{}` | `onboarding_started:<onboardingSessionId>` | Existing hook; verify |
| `onboarding_completed` | Durable onboarding completion | `{}` | `onboarding_completed:1:<completedAt>` | Existing hook; verify |
| `focus_setup_viewed` | New Focus Setup visit/episode | `{}` | `focus_setup_viewed:<focusEpisodeId>` | Missing hook |
| `focus_session_started` | Committed running Standard Focus | `mode`, `workTag`, `durationMinutes` | `focus_session_started:<sessionId>` | Existing hook |
| `focus_session_completed` | Committed terminal Standard Focus | `mode`, `workTag`, `durationMinutes`, `terminalStatus=completed` | `focus_session_completed:<sessionId>` | Existing hook |
| `focus_session_failed` | Committed terminal Standard Strict | `mode`, `workTag`, `durationMinutes`, `terminalStatus=failed` | `focus_session_failed:<sessionId>` | Existing hook |
| `focus_session_cancelled` | Committed cancelled Standard Focus | `mode`, `workTag`, `durationMinutes`, `terminalStatus=cancelled` | `focus_session_cancelled:<sessionId>` | Existing hook |
| `break_started` | Committed running Break | `breakType`, `durationMinutes` | `break_started:<sessionId>` | Existing hook |
| `break_completed` | Committed completed Break | `breakType`, `durationMinutes`, `terminalStatus=completed` | `break_completed:<sessionId>` | Existing hook |
| `reward_granted` | Committed unique reward receipt | `durationMinutes`, `xpEarned`, `coinsEarned` | `reward_granted:<receiptId>` | Existing hook; Standard only |
| `shop_viewed` | One Shop visit per focus episode | `{}` | `shop_viewed:<focusEpisodeId>` | Existing hook |
| `item_unlocked` | Committed purchase receipt | `itemId`, `pricePaidCoins` | `item_unlocked:<purchaseReceiptId>` | Existing hook |
| `item_equipped` | Committed equipped fact | `itemId` | `item_equipped:<itemId>:<equippedAt>` | Existing hook |
| `history_viewed` | One History visit per focus episode | `{}` | `history_viewed:<focusEpisodeId>` | Existing hook |
| `feedback_started` | Feedback form visit/episode | `{}` | `feedback_started:<feedbackEpisodeId>` | New; no comment/score |
| `feedback_submitted` | Feedback provider accepted | `{}` | `feedback_submitted:<submissionId>` | New; no comment/score |
| `store_review_requested` | Attempt committed before native call | Proposed `{}`; `attemptCount` only if owner demonstrates metric need | `store_review_requested:<attemptId>` | New; confirmation required |

Value allowlists remain fixed enums/ranges already proven by domain facts. Remove unused global keys
(`sessionType`, `focusVariant`, `status`, `rewardReason`, `category`, first/second/returning flags) from
accepted wire payload unless a named event schema is separately approved. These current mapper keys are
not authority to send them.

## 14. Provider, queue, retry and idempotency plan

```text
Committed user intent/fact
  -> capture gate + exact event validator
  -> bounded SQLite queue (dedupe/cap/TTL transaction)
  -> single-flight delivery coordinator
  -> provider-independent batch port
  -> PostHog EU adapter
  -> accepted IDs deleted / retryable IDs scheduled
```

- Proposed, pending `CONFIRM-02`: 20 events/batch; initial delay 30s; exponential x2 capped at 6h;
  deterministic bounded jitter derived from event ID; retry until TTL, not infinite past expiry.
- Triggers: ready boot, foreground and post-capture signal; triggers coalesce. No timer busy-loop and no
  promised OS background execution.
- At-least-once: SQLite `event_id` and provider dedupe field are the same logical ID. Crash after accept
  before delete can resend; this is allowed. No promise of exactly-once network delivery.
- Delete only exact accepted IDs. Retry response classification must be provider-contract tested.
- Queue clear/identity rotation increments privacy generation or equivalent; late send completions are stale.
- Drop counter is local aggregate without payload and must not be recursively captured as analytics.

## 15. Cross-Story data/privacy matrix

| Data | Local persistence | External destination | Retention/control | Forbidden use |
|---|---|---|---|---|
| Canonical analytics event | SQLite queue, <=1.000, TTL 7d | PostHog EU when On | Opt-out clear; provider <=12mo | Product truth, profile, replay, content |
| Anonymous install ID | `app_installation` | Analytics `distinct_id` only | Rotate on opt-out/reset | Cross-app/account/ad identity |
| Feedback score/comment | Memory only | Approved feedback provider | Lost on close; provider policy to approve | SQLite, analytics, log, review eligibility |
| Feedback submission ID | Memory for current form/retry | Feedback idempotency key | Discard after close | Analytics distinct ID/cross-session profile |
| Review eligibility facts | Existing local installation/session/attempt rows | Never sent | Existing product retention/reset | Feedback influence, provider profile |
| Review attempt | SQLite durable | Native API only receives call, not row | Caps survive relaunch | Delete-to-reprompt, infer outcome |
| Dropped/retry counters | Local aggregate only | No analytics by default | Reset/diagnostic policy | Payload/content logging |

## 16. Fixture, automated and manual test plan

### 16.1 Disposable database safety

- Proposed fixture env: `EXPO_PUBLIC_EPIC_11_REVIEW_FIXTURE=epic_11_quick` plus named sub-fixtures.
- Database: exactly `pixeldoro-us-11-epic-11-quick.db` or story-prefixed
  `pixeldoro-us-11-<story>-<case>.db`; never `pixeldoro.db`.
- Fixture/probe exists only in dev/review composition and is unreachable in production.
- Setup reports selected fixture/database before mutation. Cleanup uses in-app confirmed reset for that
  exact database, closes connection, unsets exact env var; never wildcard/glob delete.
- Fake analytics/feedback/review adapters record sanitized call count/event IDs/status, never comment,
  secret or production network traffic.

### 16.2 Consolidated automated matrix

| Required case | Story/layer | Exit expectation |
|---|---|---|
| Wrong taxonomy, extra/wrong payload, >2KiB | 01 application + real SQLite | Rejected before queue/provider |
| Analytics Off and opt-in after Off | 01/03 composition | Zero capture while Off; zero backfill |
| Queue cap/TTL/deterministic oldest eviction | 02 SQLite | <=1.000, exact survivor set, payload-free count |
| Retry/partial result/no duplicate | 02 adapter/application | Same IDs, accepted-only delete, single-flight |
| Kill/relaunch and crash window | 02 SQLite/composition | Retry survives; at-least-once within stated policy |
| Provider/network failure | 02/03 integration | Core fact/UI unchanged, retry bounded |
| Feedback happy/error/retry/double tap | 04 controller/adapter | Same submission ID; one provider logical submission |
| Feedback privacy/persistence | 04 static/SQLite | No comment/score in analytics/log/DB |
| Review thresholds/cooldown/year/version | 05 domain/SQLite | Exact eligible/ineligible decisions, no spam |
| Review unavailable/write/native failure | 05 adapter/integration | No crash; write failure zero call; native failure attempt retained |
| Background/foreground stale work | 02/03/04/05 composition | No forbidden flush/submit/review; stale result ignored |
| Common component regression | 03/04/06 presentation | Existing consumers unchanged; a11y states correct |
| Architecture/line limits | all static | No UI→SQLite/provider/native import; <=300, review >=240 |

### 16.3 Manual matrix

| Capability | Guide cases | Platform expectation |
|---|---|---|
| Taxonomy/capture/Off | `E11-01`→`03`, `09`→`13` | Local adapter both platforms where run; live provider separately gated |
| Queue/offline/relaunch/retry | `E11-04`→`08` | iOS and Android structured rows; quick path may use one target |
| Feedback | `E11-14`→`19` | Happy/error/retry/privacy/a11y on available target; other remains NOT_RUN |
| Store review | `E11-20`→`26` | Native Development Build; simulator/emulator support recorded honestly |
| Accessibility | `E11-27`→`29` | Largest Text + VoiceOver/TalkBack + Reduce Motion separately |
| Combined cleanup | `E11-30` | Exact disposable DB/env only |

## 17. Owner confirmation register

Owner decision 2026-09-13: `Approve US1100-CONFIRM-01=A, 02=A, 03=A, 04=A, 05=A, 06=A,
07=A, 08=A, 09=A, 10=A.` Các lựa chọn này là requirement của implementation hiện tại.

| ID | Decision/options | Recommendation and trade-off | Blocks / exact scope unlocked |
|---|---|---|---|
| `US1100-CONFIRM-01` | A approve 17-event exact table; B edit names/payloads; C defer final taxonomy | A: smallest authority-aligned data surface; loses unapproved segmentation intentionally. | Blocks 01 onward. Unlocks typed schema, missing hook and producer tests. |
| `US1100-CONFIRM-02` | A 20/batch, 30s x2 to 6h + deterministic jitter until TTL; B owner values; C no auto retry | A: bounded, testable, modest battery/network; adds policy constants. | Blocks 02/03. Unlocks coordinator/retry tests. |
| `US1100-CONFIRM-03` | A direct HTTPS PostHog batch adapter; B official RN SDK configured manual-only; C defer live provider | A: app-owned queue/least native surface; must maintain HTTP contract. B may ease SDK support but risks second queue/automatic properties. | Blocks 03. Unlocks dependency/config/adapter choice. |
| `US1100-CONFIRM-04` | A missing config fail-closed, dev/test disabled, preview separate; B allow dev project; C throw/bootstrap block | A preserves core/privacy; provider misconfig can delay signals silently unless monitored. | Blocks 03/06. Unlocks environment/config and evidence policy. |
| `US1100-CONFIRM-05` | A independent owner-supplied HTTPS feedback endpoint with idempotency; B PostHog survey; C mail client | A preserves analytics/feedback separation and in-app UX; requires endpoint. B risks content coupling; C is not reliable in-app submit. | Blocks 04. Unlocks feedback adapter. |
| `US1100-CONFIRM-06` | A score 1–5 + optional trimmed comment <=1.000 code points/4KiB and minimal appVersion/platform; B different limits; C score only | A balances usefulness/bounds but creates provider retention responsibility. | Blocks 04. Unlocks validation/request contract. |
| `US1100-CONFIRM-07` | A Settings-only MVP; B add one contextual invitation later in Story; C contextual only | A meets “always in Settings” with least interruption; forgoes proactive response rate. | Blocks final 04 UX. Unlocks trigger/copy scope. |
| `US1100-CONFIRM-08` | A approve `expo-store-review` native dependency and one fresh post-celebration Home trigger; B other native adapter; C defer store review | A matches ADR and avoids repeat foreground triggers; requires native rebuild and cannot guarantee visible OS prompt. | Blocks 05. Unlocks dependency/native wiring/fixture. |
| `US1100-CONFIRM-09` | A owner quick path may close Story-owned manual gate while formal breadth remains EPIC-12; B require both platforms now; C automated-only | A preserves roadmap split and honest evidence; leaves explicit NOT_RUN debt to EPIC-12. | Blocks 06/EPIC exit. Unlocks exit evidence threshold. |
| `US1100-CONFIRM-10` | A owner supplies PostHog EU project/key and names retention/cost-alert owner; B team member; C local-only until later | A enables live verification/operational guardrails; secrets stay outside repo. | Blocks live 03/06 evidence, not local implementation. |

Suggested one-line approval format (owner may edit any item):
`Approve US1100-CONFIRM-01=A, 02=A, 03=A, 04=A, 05=A, 06=A, 07=A, 08=A, 09=A, 10=A.`

## 18. Risks and rollback

| Risk | Prevention/evidence | Rollback boundary |
|---|---|---|
| Global allowlist leaks unrelated key | Exact per-event discriminated validation at capture/read/send | Revert contract+producer atomically; fail closed |
| Provider SDK adds hidden collection/queue | Transport decision + contract/static tests | Disable/remove concrete adapter, keep port/queue |
| Opt-out races an in-flight response | Block-first gate + privacy generation/stale discard | Disable delivery; preserve Off cleanup |
| Queue loops/drains battery or grows | TTL/cap/batch/backoff/single-flight tests | Disable triggers, retain bounded queue |
| Feedback duplicates or leaks content | Stable submission ID, memory-only, redacted tests | Disable Submit/adapter; never persist draft |
| Store review spams | Atomic persist-before-call, unique version, caps, fresh trigger | Disable trigger; retain attempt history |
| Native dependency shipped OTA-only | Native rebuild/evidence gate | Revert adapter/config; no release claim |
| External prerequisite causes false completion | `BLOCKED/NOT_RUN` and local fake evidence separated | Keep Epic open; do not relabel PASS |

## 19. EPIC-11 Definition of Done and Exit Checklist

EPIC-11 is done only when the owner accepts one exact implementation SHA and all required local gates
below are checked. `US1100-CONFIRM-*` approval starts scoped work; it does not itself satisfy DoD.

- [x] All blocking confirmations resolved in writing.
- [ ] `US-11-01→06` each meet DoR, DoD, tests, rollback and owner acceptance gate.
- [ ] Exact per-event taxonomy rejects invalid/extra/free-text payload at capture/read/send.
- [ ] Analytics Off creates no event, clears queue/rotates identity and opt-in never backfills.
- [ ] Queue cap/TTL/drop/retry/single-flight/relaunch/at-least-once behavior has real SQLite evidence.
- [ ] Provider failure/network loss never changes committed core behavior.
- [ ] PostHog EU environment, anonymous/manual-only settings, retention/cost owner are evidenced or an
  explicitly owner-accepted external blocker keeps Epic open.
- [ ] Feedback is production, always reachable from Settings, memory-only, retry-idempotent and content-safe.
- [ ] Store review exact eligibility/caps/safe timing/persist-before-call/unavailable paths pass.
- [ ] No presentation import of SQLite, analytics provider or native store-review adapter.
- [ ] Touched common components pass all old/new consumer regression and a11y tests; line limits pass.
- [ ] Device guide validator/document checks pass; manual cases remain honest per platform.
- [ ] No secret, raw feedback, provider payload or production user data in logs/evidence/repo.
- [ ] Exit Report identifies remaining EPIC-12 device/release breadth; EPIC-12 is not opened early.
- [ ] Owner explicitly marks EPIC-11 `DONE_OWNER_ACCEPTED` at exact SHA before roadmap checkbox changes.

## 20. Change log

| Version | Date | Change |
|---|---|---|
| `0.2.0` | 2026-09-13 | Owner approved confirmations 01→10 Option A; implemented exact analytics delivery/privacy wiring, production feedback, store-review policy/native adapter and isolated quick-UI fixtures. Automated gates pass; exact-SHA/device/provider evidence remains open. |
| `0.1.0` | 2026-09-12 | Initial full code/doc audit, six prioritized vertical Stories, taxonomy/provider/queue/privacy/component/test/fixture plans and owner confirmation register. Implementation remains `NOT_STARTED`. |
