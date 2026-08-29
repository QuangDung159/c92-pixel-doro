---
document_id: PIXELDORO_US_02_06_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-02-06 Implementation Plan
version: 0.3.0
status: IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME
implementation_status: IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME
last_updated: 2026-08-29
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead
language: vi
scope:
  - mobile_mvp
  - epic_02
  - us_02_06
  - derived_queries
  - economy_consistency
  - bounded_analytics_metadata
  - retention_and_index_evidence
authority: PLANNING
story_baseline: ./EPIC-02_USER_STORIES.md
epic_baseline: ./MVP_EPICS.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
project_structure_baseline: ../architecture/project-structure.md
data_model_baseline: ../architecture/data-model.md
session_lifecycle_baseline: ../specifications/session-lifecycle.md
gamification_baseline: ../specifications/gamification-rules.md
adr_state_and_persistence: ../architecture/decisions/ADR-003-state-and-persistence.md
adr_domain_platform_boundaries: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
adr_store_review: ../architecture/decisions/ADR-006-in-app-feedback-and-store-review.md
adr_analytics: ../architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md
---

# US-02-06 — Derived Queries và Consistency Evidence

## 0. Mục đích và trạng thái

Tài liệu này là implementation plan authoritative cho `US-02-06` thuộc
`EPIC-02 — Durable Local Data, Migration và Safe Bootstrap`.

**Story outcome:** Các Epic sau nhận được read-only durable facts cho standard Focus history,
contribution, Long Break cadence, store-review và economy consistency mà không tạo aggregate source
of truth thứ hai; analytics metadata được giữ trong cap/TTL/privacy boundary xác định và không tác
động product truth.

**Dependency:** `US-02-05 DONE`. Exact iOS repository probe pass `10/10` assertions trên
implementation SHA `bdbed4d820caa2ad1648cba28679d76327eca1b0`; final host quality pass `16`
files / `92` tests.

**Priority:** `MUST` / `P1_DURABILITY` / execution order `06` trong EPIC-02.

**Blocks:** `US-02-07` và `US-02-08`. Recovery cần stable economy/query invariant result; reset
cần analytics cleanup/retention boundary đã được kiểm chứng.

**Planning status:** `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`.
**Implementation status:** `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`.

Production contracts/adapters, host SQLite evidence, retention/index audit và dev-only native probe
đã hoàn tất ngày 2026-08-29. Full `pnpm quality` pass `17` files / `95` tests; Story còn chờ owner
chạy exact native report trên final implementation SHA trước khi closeout `DONE`.

Không có Product blocker nghiêm trọng. `OPEN-006` contribution color threshold vẫn giữ nguyên
`OPEN` nhưng nằm ngoài outcome của Story này; `OPEN-001`/`OPEN-009` về Pet cũng không liên quan.
Năm technical confirmation `US0206-CONFIRM-01` đến `05` đã được Dũng Lư duyệt ngày
2026-08-28; đây là technical direction cho implementation, không thay đổi Product authority.

### 0.1. Start gate

- [x] `US-02-01` đến `US-02-05 DONE` và exact native evidence đã được review.
- [x] Normative schema `001`, migration history, bootstrap barrier và typed repository graph ổn định.
- [x] Các Product rule dùng cho persisted date, cadence, review facts và economy đã `RESOLVED`.
- [x] Không cần chốt contribution color hoặc final analytics metrics taxonomy.
- [x] `US0206-CONFIRM-01`–`05` được owner duyệt ngày 2026-08-28.
- [x] Chỉ `US-02-06` active; không implement Retry/reset/feature orchestration song song.

## 1. Baseline và current-state review

### 1.1. Authority contract

| Authority | Contract áp dụng cho `US-02-06` |
|---|---|
| `EPIC-02_USER_STORIES.md` | Exact history/contribution/cadence/review/economy exclusions, analytics cap/TTL và evidence outcome. |
| Product Core §5.2, §9, §10.5, §12–13 | Standard Focus identity, persisted local-day grouping, Long Break cadence, review thresholds/facts và approved core analytics names. |
| Data Model §5–6, §9.1, §11, §13–14 | Durable columns/indexes, receipt equations, edge cases, retention và query-plan evidence. |
| System Architecture §2–7 | Application-owned query port; Infrastructure-owned SQL; SQLite là durable truth; no provider side effect trong transaction. |
| Project Structure §3–7 | Shared/mobile ownership, public exports, query adapter placement và architecture boundary. |
| ADR-003/004 | Không Zustand aggregate/feature storage; Domain/Application không biết SQL/raw row/provider. |
| ADR-006 | Review attempt chỉ là durable fact; không suy diễn rating/outcome và không gọi native review trong Story này. |
| ADR-008 | Queue cap 1.000, TTL 7 ngày, privacy/payload bound, async retry; chưa tích hợp PostHog. |

### 1.2. Repository hiện tại sau `US-02-05`

| Khu vực | Current state | Hệ quả cho plan |
|---|---|---|
| Typed repositories | Mười durable entity group có Application port, canonical mapper và SQLite adapter. | Derived query phải compose trên same database/mapper truth; không mở connection hoặc row model thứ hai. |
| Transaction kernel | Opaque scope và scoped repository methods đã chứng minh multi-repository commit/rollback. | Economy snapshot và analytics maintenance phải atomic; query adapters không tự nested transaction. |
| Sessions/indexes | Có exact status/type/variant/local-day/resolved timestamps cùng history/local-day/cadence indexes. | Có thể triển khai facts bằng schema `001`; cần planner audit trước khi đề xuất index mới. |
| Economy | Profile balance cùng immutable reward/purchase receipts đã round-trip và rollback. | Verifier chỉ so sánh snapshot nhất quán; tuyệt đối không repair. |
| Store review | Installation và attempt repository đã có; chưa có facts aggregate. | Mobile Application sở hữu facts query; không đưa eligibility/native call vào persistence. |
| Analytics | Basic insert/find/pending/update đã có structural bound `20` properties / `2 KiB`. | Cần khóa name/privacy policy, TTL/cap/drop-oldest/dedupe/due-retry behavior trong transaction. |
| Migration registry | Chỉ có migration `001`, checksum lock đã đạt native evidence. | Không tự tạo `002`; mọi schema change phải quay lại owner review. |

### 1.3. Review findings

1. Story là query/foundation vertical slice, không phải History, Break, Review hay Analytics
   Product feature. Projection chỉ trả durable facts; future use case chịu trách nhiệm eligibility,
   colors, selection, copy và navigation.
2. Standard Focus phải luôn được nhận diện bằng cả `session_type = focus` và
   `focus_variant = standard`; filter chỉ một cột có thể làm trial rò vào history/economy trigger.
3. Contribution dùng `configured_duration_minutes`, không elapsed time; chỉ completed standard
   Focus và group theo persisted `scheduled_end_local_date`. Timezone hiện tại không được tính lại.
4. Failed/cancelled standard Focus có thể xuất hiện trong terminal history nhưng đóng góp `0`;
   running và trial không thuộc standard history projection.
5. Cadence reset marker là completed Long Break gần nhất. Cancelled Long Break, Short Break,
   trial, failed/cancelled Focus không count/reset.
6. Store-review query chỉ trả installation/session/distinct-day/attempt facts. Threshold `7/5/3`,
   cooldown `120` ngày và cap `3/365` là Product orchestration của Epic sau; query không trả
   `eligible` hoặc gọi native API.
7. Economy comparison phải dùng một consistent transaction snapshot. Hai SELECT không cùng
   boundary có thể báo mismatch giả nếu command commit xen giữa.
8. Mismatch là typed invariant/recovery signal và read-only. Không update profile, insert balancing
   receipt, clamp, reseed hoặc delete bất kỳ row nào.
9. Queue maintenance có write side effect nhưng chỉ trên `analytics_events`; cap/TTL/drop-oldest
   phải commit/rollback nguyên tử và có deterministic tie-breaker.
10. `OPEN-006` chỉ liên quan contribution color; plan trả minutes/count sparse rows và không tự
    chọn threshold/màu.
11. ADR-008 chưa chốt final provider/property taxonomy. Story có thể fail closed với approved event
    names và conservative value boundary mà không tích hợp PostHog hoặc sáng tác metrics target.
12. Existing schema đã có index phù hợp cho các query chính. Tạo migration `002` chỉ để tránh một
    bounded temp sort của queue là scope/risk không tương xứng.

## 2. Scope contract

### 2.1. In scope

- Application-owned query contracts/projections cho standard history, contribution, cadence và
  economy consistency; Mobile Application-owned review facts và analytics queue contract.
- SQLite query adapters dùng exact application-scoped owner, parameter binding, canonical mapper
  và transaction executor hiện có.
- Deterministic order/cursor/range boundary và validated input limits.
- Economy verifier trong một transaction snapshot, typed mismatch và no-write evidence.
- Analytics TTL/cap/drop-oldest/dedupe/due-retry/delete-delivered primitives với atomic boundary.
- Approved event-name/privacy/payload enforcement tại persistence boundary; không provider call.
- Product retention guard, mixed fixture matrix và representative `EXPLAIN QUERY PLAN` evidence.
- Host tests, full repository quality và một dev-only native Expo SQLite probe/runbook.
- Documentation/evidence/status closeout sau exact owner native report.

### 2.2. Explicit out of scope

- History/contribution UI, calendar zero-fill, contribution color/threshold hoặc Zustand aggregate.
- `StartBreak`, Break due/sticky selection, timer/lifecycle/notification hoặc session mutation.
- Store-review eligibility/candidate/orchestration, feedback/rating, native request API và UI.
- Economy repair/reconciliation, reward grant, XP/Coin formula, purchase/equip behavior.
- Final analytics metric target/property taxonomy, event producers, PostHog SDK/network delivery,
  background worker hoặc OS scheduling.
- Retry/recovery screen và command gate (`US-02-07`).
- Confirmed full reset/reseed/anonymous ID rotation orchestration (`US-02-08`).
- Schema/migration `002`, ORM/query builder hoặc new storage/provider.
- Native/EAS build/prebuild và generated iOS/Android artifact trong agent turn.

## 3. Technical directions đã được owner duyệt

### TD-02-06-A — Query ownership và fact-only projections

**Proposal:**

- Shared `packages/application` sở hữu `StandardFocusHistoryQuery`, `ContributionQuery`,
  `LongBreakCadenceQuery` và `EconomyConsistencyQuery` vì các capability này phục vụ portable core
  use case sau.
- Mobile Application sở hữu `StoreReviewFactsQuery` và bounded analytics queue contract vì chúng
  phụ thuộc installation/app-version/provider-facing metadata.
- SQLite Infrastructure implement SQL/projection mapping; composition root giữ adapter graph
  internal. Presentation facade không expose repository/raw query trực tiếp.
- History projection chỉ chứa durable facts: identity, terminal status, mode/tag, configured
  duration, timestamps và persisted local-day.
- Contribution trả sparse row `{ scheduledEndLocalDate, totalCompletedMinutes,
  completedSessionCount }`; không fill zero/màu.
- Cadence trả completed standard Focus count kể từ reset marker và nullable latest completed Long
  Break fact; không trả `isDue` hoặc chọn Break type.
- Review trả installation/session/day/attempt facts; không trả `eligible`.

**Status:** `APPROVED 2026-08-28` — `US0206-CONFIRM-01`.

### TD-02-06-B — Deterministic order, cursor và time boundary

**Proposal:**

- History chỉ lấy terminal standard Focus (`completed|failed|cancelled`), order
  `ends_at DESC, id ASC`; keyset cursor `(endsAt, id)`, limit integer `1..100`, không offset.
- Contribution nhận inclusive validated ISO local-date range và trả sparse rows trong date order;
  query luôn dùng persisted key, không nhận timezone để recompute.
- Cadence chọn completed Long Break gần nhất theo `resolved_at DESC, id ASC`; count completed
  standard Focus có `resolved_at > marker.resolved_at`. Boundary này diễn đạt “completed sau reset
  marker”, dùng đúng cadence index và không count một terminal fact đồng thời/trước marker. Không có
  marker thì count toàn bộ completed standard Focus.
- Review rolling window là `[nowMs - 365 ngày, nowMs]` inclusive; future timestamp không được count.
  Query trả latest attempt/counters/current-version-attempted fact nhưng không evaluate cooldown,
  cap hoặc eligibility.

**Status:** `APPROVED 2026-08-28` — `US0206-CONFIRM-02`.

### TD-02-06-C — Economy mismatch là stable read-only invariant result

**Proposal:**

- `verifyEconomyConsistency(profileId)` chạy trong một transaction snapshot: đọc stored profile,
  sum immutable reward/purchase receipts với empty sum bằng `0`, rồi so sánh exact integer.
- Consistent trả typed success fact. Mismatch trả `PersistenceError` code mới
  `PERSISTENCE_INVARIANT_MISMATCH` với safe entity/reason/mismatched-field identifiers; không rò
  SQL, raw balance/row hoặc provider exception qua Presentation.
- Verifier tuyệt đối không write. Host/native evidence fingerprint toàn bộ profile/receipt rows
  trước/sau mismatch để chứng minh no repair.
- Missing/corrupt profile và provider failure tiếp tục dùng existing not-found/corrupt/provider
  categories; không gom mọi lỗi thành mismatch.

**Status:** `APPROVED 2026-08-28` — `US0206-CONFIRM-03`.

### TD-02-06-D — Atomic bounded analytics queue với conservative privacy allowlist

**Proposal:**

- Mobile Application queue coordinator dùng `TransactionPort`; repository cung cấp scoped
  primitives và không tự commit.
- `enqueueBounded(event, nowMs)` trong một transaction: xóa `expires_at <= nowMs`; reject event đã
  expired; nếu exact `eventId` đã tồn tại thì trả `already_queued` mà không overwrite; khi queue đang
  full, drop đủ existing oldest rows theo `(occurred_at ASC, event_id ASC)` để còn tối đa `999`, rồi
  insert event mới. Toàn bộ sequence commit/rollback cùng nhau và committed count luôn `<= 1000`.
- Delivery selection chỉ lấy `pending` và `retry_wait` có `next_attempt_at <= nowMs`, deterministic
  pending-first rồi due-retry theo next-attempt/occurred/event ID. Provider success về sau có thể
  gọi exact-ID delete; retry update exact attempt/next-attempt. Story này không gọi network.
- Approved event name là closed union từ Product Core §13.2 cộng `store_review_requested` của
  ADR-006. Properties tiếp tục tối đa `20` keys / `2 KiB`; number/boolean/null được phép, string chỉ
  nhận closed categorical values đã có authority. Free text, Pet name, raw row/JSON blob, feedback,
  contact identifier và provider payload bị reject.
- Có queue-clear primitive cho future opt-out/reset, nhưng Settings/provider orchestration và
  anonymous-ID rotation vẫn ngoài Story.

**Status:** `APPROVED 2026-08-28` — `US0206-CONFIRM-04`.

### TD-02-06-E — Existing-index evidence; không tự tạo migration `002`

**Proposal:**

- Host real-SQLite tests ghi semantic result và representative `EXPLAIN QUERY PLAN`; native probe
  ghi `sqlite_version()` và xác nhận index names khi Expo runtime trả plan deterministic.
- Expected index set: `ix_sessions_history`, `ix_sessions_local_day`,
  `ix_sessions_long_break_cadence`, `ix_store_review_attempt_time`, `ix_analytics_delivery` và
  `ix_analytics_expiry`.
- Bounded queue oldest-selection được phép dùng documented temporary sort trên normal-state queue
  tối đa `1000` existing rows; đây không phải lý do tự thêm schema.
- Không tạo migration `002`. Nếu critical query không thể dùng approved index và không thể rewrite
  an toàn, implementation dừng tại decision gate và xin owner duyệt schema change.
- Một native platform đủ closeout Story; iOS + Android repeat nằm ở `US-02-09`, theo policy đã duyệt.

**Status:** `APPROVED 2026-08-28` — `US0206-CONFIRM-05`.

## 4. Contract và invariant chi tiết

### 4.1. Query matrix authoritative

| Query | Include | Exclude | Projection/order |
|---|---|---|---|
| Standard history | Terminal `focus + standard`: completed/failed/cancelled | Running, trial, Short/Long Break | Durable facts; `endsAt DESC, id ASC`; keyset page |
| Contribution | Completed `focus + standard` trong persisted date range | Failed/cancelled/running/trial/break | Sparse local date, configured minutes sum, count; date ASC |
| Long Break cadence | Completed standard Focus resolve sau latest completed Long Break resolve marker | Trial, failed/cancelled/running Focus; cancelled Long Break | Count + nullable latest completed Long Break fact |
| Review facts | Completed standard Focus, distinct persisted local-day, attempts trong/current version | Trial, failed/cancelled/running/break; feedback/native outcome | Installation/count/day/attempt facts only |
| Economy | Stored profile + sums immutable reward/purchase receipts | Analytics/catalog/ownership/session-derived recomputation | Typed consistent or invariant mismatch; no writes |

### 4.2. Analytics queue invariant

| Concern | Locked behavior |
|---|---|
| Capacity | Committed queue count luôn `<= 1000`; full queue drop existing oldest deterministic trước insert. |
| TTL | `expiresAt <= nowMs` là expired và bị cleanup; enqueue expired event bị reject. |
| Idempotency | Same event ID không overwrite/duplicate; cleanup đã thực hiện vẫn có thể commit. |
| Retry order | Pending trước, sau đó retry đã due; deterministic tie-breaker bằng timestamps/event ID. |
| Failure | Cleanup/insert/trim/update/delete rollback cùng transaction; không partial queue mutation. |
| Privacy | Closed event names, bounded typed properties; reject free text/raw durable/provider payload. |
| Isolation | Mọi cleanup chỉ target `analytics_events`; không cascade/delete product truth. |

### 4.3. Retention invariant

- Không background prune/delete `sessions`, `reward_transactions`, `purchase_transactions`,
  `owned_items`, `store_review_attempts`, profile/catalog/settings/installation.
- Product rows chỉ có thể bị xóa bởi future confirmed full-reset private executor hoặc approved
  migration maintenance path.
- Query không mutate để normalize/repair legacy data. Corrupt/incompatible value fail closed qua
  canonical mapper/error boundary.
- Analytics queue cleanup không được share generic table-name/delete helper nhận arbitrary target.

### 4.4. Index/planner invariant

- Semantic correctness là acceptance bắt buộc; planner evidence là guard cho representative data,
  không hard-code toàn bộ unstable `EXPLAIN` text.
- Test assert approved index name với critical lookup khi runtime deterministic; nếu planner chọn
  equivalent primary/unique index hợp lệ, evidence ghi justification thay vì ép hint.
- Không dùng query hint/provider extension không được Expo SQLite hỗ trợ.
- Range/order tests phải có duplicate timestamp/date tie fixture để chứng minh deterministic result.

## 5. Authoritative implementation order cho solo developer

| Order | Task | Gate/output | Blocks |
|---:|---|---|---|
| `T00` | Owner confirmation gate | `CONFIRM-01`–`05` approved | Tất cả task implementation |
| `T01` | Query/error/projection contracts | Stable Application API + fixtures compile | T02–T06 |
| `T02` | History + contribution vertical slice | Mixed status/trial/date result pass | T07 |
| `T03` | Long Break cadence vertical slice | Reset/no-reset/tie fixture pass | T07 |
| `T04` | Store-review facts vertical slice | Install/session/day/attempt facts pass | T07 |
| `T05` | Economy consistency verifier | Valid/mismatch/no-write pass | T07, US-02-07 |
| `T06` | Bounded analytics queue | Cap/TTL/dedupe/retry/privacy atomic matrix pass | T07, US-02-08 |
| `T07` | Retention + index audit | No product prune + planner evidence | T08 |
| `T08` | Host integration/full quality | Complete matrix and repository checks pass | T09 |
| `T09` | Native diagnostic + manual runbook | Dev-only Expo SQLite probe ready | T10 |
| `T10` | Owner native evidence | Exact report on final implementation SHA | T11 |
| `T11` | Closeout | Evidence/docs/status complete; open US-02-07 | Story DONE |

Chỉ một task/Story active tại một thời điểm. `MUST` biểu thị MVP requirement;
`P1_DURABILITY` biểu thị dependency/correctness priority; bảng trên là execution order thực tế.

### 5.1. Vì sao order này authoritative

1. Contract/projection freeze trước SQL để tránh adapter tự quyết Product output.
2. Ba read-query slice độc lập đi trước consistency/write metadata; mỗi slice có evidence riêng và
   tái sử dụng fixture/schema hiện có.
3. Economy verifier đi trước recovery vì `US-02-07` cần stable mismatch category.
4. Analytics atomic boundary đi sau transaction/repository contract nhưng trước reset vì
   `US-02-08` cần queue cleanup seam.
5. Retention/index audit chạy sau mọi SQL tồn tại; host quality trước native để không đẩy lỗi thuần
   logic sang owner.
6. Story chỉ DONE sau exact native report được review; cross-platform repeat vẫn ở `US-02-09`.

## 6. Task checklist chi tiết

### US0206-T00 — Decision gate

- [x] Owner duyệt `US0206-CONFIRM-01`–`05` ngày 2026-08-28.
- [x] Update plan lên `READY_FOR_IMPLEMENTATION`; implementation vẫn `NOT_STARTED`.
- [x] Snapshot clean/dirty worktree và giữ nguyên unrelated owner changes.

### US0206-T01 — Application contracts và fixture vocabulary

- [x] Thêm shared query ports/projections/error code theo TD-A/C.
- [x] Thêm mobile review-facts/analytics queue contracts theo TD-A/D.
- [x] Export có chủ đích qua package/mobile Application index; không Presentation leak.
- [x] Khóa validated range/cursor/limit/clock inputs và deterministic IDs/timestamps.
- [x] Tạo mixed fixture vocabulary: standard/trial/break/status/date/timezone/attempt/economy/queue.
- [x] Boundary/type tests pass trước adapter implementation.

### US0206-T02 — Standard history và contribution

- [x] Implement parameter-bound standard history query và keyset cursor.
- [x] Implement persisted-local-date contribution aggregation.
- [x] Test failed/cancelled visible history nhưng zero contribution; running/trial/break excluded.
- [x] Test duplicate `endsAt` order/cursor, inclusive date range và invalid input fail closed.
- [x] Test timezone-change fixture không regroup persisted date.

### US0206-T03 — Long Break cadence

- [x] Implement latest completed Long Break marker lookup.
- [x] Count only completed standard Focus theo approved marker boundary.
- [x] Test no-marker, completed marker, cancelled marker, trial/status exclusions và timestamp tie.
- [x] Chứng minh adapter không trả `isDue`, chọn/start Break hoặc mutate session.

### US0206-T04 — Store-review facts

- [x] Implement installation/completed-standard/distinct-persisted-day facts.
- [x] Implement latest/current-version/rolling-window attempt facts với injected `nowMs`.
- [x] Test trial/status/break exclusion, same-day dedupe, future/window boundary và version identity.
- [x] Chứng minh query không join/read feedback, gọi native API hoặc persist outcome.

### US0206-T05 — Economy consistency verifier

- [x] Add stable invariant mismatch error/result contract.
- [x] Aggregate reward XP/Coin và purchase Coin bằng exact integer/empty-sum semantics.
- [x] Read/compare trong một transaction snapshot.
- [x] Test consistent zero/non-zero và typed mismatch; existing mapper/provider matrix giữ corrupt/error boundary.
- [x] Fingerprint all economy rows before/after mismatch; assert no write/repair SQL path.

### US0206-T06 — Bounded analytics metadata

- [x] Add approved event-name/privacy property validation.
- [x] Implement scoped cleanup, dedupe, insert, deterministic trim và queue count.
- [x] Implement due-delivery selection, exact retry update, delivered-ID delete và clear primitive.
- [x] Test boundaries `999/1000/1001`, equal timestamps, exact TTL, duplicate ID và retry ordering.
- [x] Inject insert failure sau cleanup; assert whole queue rollback and product tables unchanged.
- [x] Test free text/raw row/unapproved event/oversize/too-many-property rejection.

### US0206-T07 — Retention và planner audit

- [x] Search/audit production delete/prune paths; whitelist chỉ queue maintenance và existing private
  migration mechanics.
- [x] Assert sessions/receipts/ownership/review attempts survive all queue operations.
- [x] Capture representative query plan/index names trên real SQLite fixture.
- [x] Existing indexes đủ; bounded queue oldest-selection được document, không cần migration `002`.

### US0206-T08 — Host evidence và full quality

- [x] Add pure contract/validation tests và real SQLite integration matrix.
- [x] Run targeted derived-query/queue tests với Node `22.23.2` pinned của repository.
- [x] Run root `pnpm quality`: `17` files / `95` tests pass ngày 2026-08-29.
- [x] Run repository hygiene/boundary checks; không có generated native artifact/secret.

### US0206-T09 — Native probe và runbook

- [x] Add dev-only `US-02-06_DERIVED_QUERIES` Expo SQLite probe qua existing diagnostics seam.
- [x] Seed isolated probe database; không đụng normal app database/user rows.
- [x] Reuse production queries/coordinator; raw SQL chỉ seed/read probe evidence.
- [x] Ghi platform/OS/app/application ID/commit SHA/SQLite version và stable assertion IDs.
- [x] Close connection idempotently và cleanup only isolated probe database.
- [x] Viết manual runbook; agent không chạy native/EAS build.

### US0206-T10 — Owner native evidence

- [ ] Owner chạy manual probe trên ít nhất một target đã duyệt.
- [ ] Report `passed: true`, đủ exact assertion IDs và exact final implementation SHA.
- [ ] Agent review SHA/assertion completeness; code change sau report làm evidence cũ stale.

### US0206-T11 — Closeout

- [ ] Map mọi acceptance criterion tới host/native evidence.
- [ ] Update plan, Epic Story và consolidated evidence record.
- [ ] Chỉ chuyển `DONE` khi host quality + exact native report đều pass.
- [ ] Mở planning gate `US-02-07`; không tự implement Retry/reset.

## 7. Planned file impact

Tên file có thể điều chỉnh nhỏ trong implementation nhưng ownership/boundary không đổi.

| Khu vực | Planned impact |
|---|---|
| `packages/application/src/persistence/` | Shared history/contribution/cadence/economy query ports, projections và invariant error extension. |
| `packages/application/src/index.ts` | Intentional shared exports. |
| `apps/mobile/src/application/persistence/` | Store-review facts và bounded analytics queue contracts/coordinator. |
| `apps/mobile/src/application/index.ts` | Intentional mobile Application exports; không facade/Presentation exposure. |
| `apps/mobile/src/infrastructure/database/queries/` | SQLite derived query adapters; có thể tạo directory mới thay vì nhồi repository CRUD. |
| `apps/mobile/src/infrastructure/database/repositories/` | Chỉ thêm scoped analytics primitives cần cho queue; không generic delete API. |
| `apps/mobile/src/infrastructure/database/persistence-graph.ts` | Internal composition wiring cho query/queue adapters. |
| `apps/mobile/test/integration/` | Mixed durable-query/economy/analytics/retention/planner matrix. |
| `apps/mobile/src/composition/diagnostics/` | Dev-only native probe entry point. |
| `docs/testing/` hoặc existing runbook location | Owner manual native scenario. |
| `docs/planning/` | Plan/evidence/status closeout. |

**Không planned:** migration registry/lock/schema `002`, Product UI/Zustand, Timer/Session/Pet,
PostHog/provider, native project files hoặc generated build artifact.

## 8. Acceptance và evidence matrix

| Story acceptance | Automated evidence | Native evidence |
|---|---|---|
| Standard history/contribution exclusions | Mixed status/type/variant/date integration table | Same fixture projection assertion |
| Persisted local-day/timezone stability | Reopen after simulated timezone change | Persisted grouping survives Expo reopen |
| Cadence completed marker semantics | No-marker/completed/cancelled/tie matrix | Native cadence assertion |
| Review facts only | Trial/day/window/version fixture; no-feedback dependency audit | Native review-facts assertion |
| Economy exact consistency/no repair | Zero/non-zero/mismatch + before/after fingerprint | Native mismatch preserves rows |
| Queue cap/TTL/drop/dedupe/retry/privacy | `999/1000/1001`, TTL, fault and rejection matrix | Native bounded queue assertion |
| Product retention | Before/after counts/row hashes for product tables | Native queue maintenance leaves product rows |
| Index evidence | Representative `EXPLAIN QUERY PLAN` report | Approved index names/SQLite version where deterministic |

### 8.1. Proposed native report contract

```json
{
  "probe": "US-02-06_DERIVED_QUERIES",
  "passed": true,
  "platform": "ios-or-android",
  "osVersion": "owner-runtime",
  "appVersion": "0.1.0",
  "applicationId": "com.dragonc92team.pixeldoro",
  "commitSha": "40-character-final-implementation-sha",
  "sqliteVersion": "runtime-value",
  "assertions": [
    "query_probe_database_opened_and_migrated",
    "mixed_standard_history_excluded_trial_running_and_breaks",
    "contribution_grouped_by_persisted_local_date",
    "timezone_change_did_not_regroup_contribution",
    "cadence_used_completed_long_break_reset_only",
    "store_review_facts_excluded_trial_status_and_feedback",
    "economy_consistency_passed_and_mismatch_preserved_rows",
    "analytics_queue_enforced_ttl_cap_dedupe_retry_and_privacy",
    "product_retention_rows_survived_queue_maintenance",
    "critical_query_plans_used_or_documented_approved_indexes",
    "probe_connections_closed_and_database_cleaned"
  ]
}
```

Exact assertion IDs được freeze khi `T09` implement; đổi code/IDs sau owner run cần rerun trên new
SHA. Native report không thay host fault matrix; host report không thay Expo SQLite runtime evidence.

## 9. Failure, recovery và rollback policy

- Invalid query input trả typed validation/persistence result trước SQL; không coerce date/cursor/limit.
- Query/mapping/provider failure không trả partial projection hoặc cache result thành second truth.
- Economy mismatch giữ gate integration-compatible cho `US-02-07`, nhưng Story này không render
  recovery UI hoặc Retry.
- Queue transaction failure rollback cleanup/insert/trim/update/delete; retry call có deterministic
  idempotency theo event ID.
- Không automatic reset/recreate/reseed/repair; không delete product rows trong mọi failure path.
- Nếu query plan không đạt index expectation, ưu tiên semantic-safe rewrite/documentation; schema
  change là owner decision gate mới, không workaround bằng untracked SQL.

## 10. Definition of Done

- [x] Năm owner confirmations được duyệt và phản ánh trong plan.
- [x] Tất cả `T01`–`T09` hoàn tất theo authoritative order.
- [x] Mọi acceptance criteria trong Epic Story có automated evidence traceable.
- [x] Full root quality/boundary/hygiene pass trên implementation awaiting native report.
- [ ] Owner native report pass đủ exact assertions trên exact final implementation SHA.
- [x] Không migration `002`, Product UI/behavior, provider delivery, Retry/reset hoặc native artifact
  ngoài scope.
- [ ] Planning/evidence docs closeout và `US-02-06 DONE` chỉ sau review.

## 11. Owner confirmations

| ID | Cần xác nhận | Đề xuất | Trạng thái |
|---|---|---|---|
| `US0206-CONFIRM-01` | Ownership và fact-only projection | Duyệt TD-02-06-A | `APPROVED 2026-08-28` |
| `US0206-CONFIRM-02` | History cursor/date/cadence/review time boundaries | Duyệt TD-02-06-B | `APPROVED 2026-08-28` |
| `US0206-CONFIRM-03` | Economy mismatch/error/no-repair contract | Duyệt TD-02-06-C | `APPROVED 2026-08-28` |
| `US0206-CONFIRM-04` | Atomic analytics cap/TTL/dedupe/retry/privacy boundary | Duyệt TD-02-06-D | `APPROVED 2026-08-28` |
| `US0206-CONFIRM-05` | Existing-index/native evidence và no migration `002` | Duyệt TD-02-06-E | `APPROVED 2026-08-28` |

Không còn Product input nào bắt buộc owner chốt để implement Story sau khi năm technical
confirmation trên được duyệt. `OPEN-001`, `OPEN-006` và `OPEN-009` tiếp tục giữ nguyên trạng thái
theo authority và không block Story này.

## 12. Handoff sau khi plan được duyệt

1. Decision gate `US0206-CONFIRM-01`–`05` đã hoàn tất và plan đã
   `READY_FOR_IMPLEMENTATION`.
2. Khi owner yêu cầu triển khai, implementation chạy tuần tự `T01 → T09`; owner chỉ cần tham gia
   lại nếu phát sinh schema gate ngoài plan.
3. Agent bàn giao manual runbook; owner chạy native probe và gửi exact JSON report.
4. Agent closeout `T10 → T11`, sau đó mới tạo implementation plan `US-02-07`.

## 13. References

- `docs/planning/EPIC-02_USER_STORIES.md`
- `docs/planning/MVP_EPICS.md`
- `docs/PIXELDORO_CORE_TRUTH.md`
- `docs/architecture/data-model.md`
- `docs/architecture/system-architecture.md`
- `docs/architecture/project-structure.md`
- `docs/architecture/technical-overview.md`
- `docs/specifications/session-lifecycle.md`
- `docs/specifications/gamification-rules.md`
- `docs/architecture/decisions/ADR-003-state-and-persistence.md`
- `docs/architecture/decisions/ADR-004-domain-and-platform-boundaries.md`
- `docs/architecture/decisions/ADR-006-in-app-feedback-and-store-review.md`
- `docs/architecture/decisions/ADR-008-posthog-analytics-and-cost-guardrails.md`
- `docs/planning/US-02-05_IMPLEMENTATION_PLAN.md`
- `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`

## 14. Change log

### 0.3.0 — 2026-08-29

- Hoàn tất shared/mobile query contracts, SQLite history/contribution/cadence/review/economy
  adapters và application-scoped graph wiring.
- Hoàn tất atomic bounded analytics queue, approved privacy allowlist, retention guard và
  representative planner/index evidence mà không tạo migration `002`.
- Full `pnpm quality` pass `17` files / `95` tests; device/boundary/hygiene gates pass.
- Thêm isolated dev-only `US-02-06_DERIVED_QUERIES` probe và manual runbook; không chạy native/EAS.
- Chuyển Story sang `IMPLEMENTED_AWAITING_OWNER_NATIVE_RUNTIME`; còn `T10` owner report và `T11`
  closeout.

### 0.2.0 — 2026-08-28

- Ghi nhận Dũng Lư duyệt đủ `US0206-CONFIRM-01`–`05` ngày 2026-08-28.
- Khóa query ownership/projection, deterministic boundaries, economy no-repair, atomic analytics
  queue/privacy và existing-index/no-migration technical directions.
- Chuyển plan sang `READY_FOR_IMPLEMENTATION`; implementation vẫn `NOT_STARTED` và chưa chỉnh
  production code.

### 0.1.0 — 2026-08-28

- Tạo implementation plan đầu tiên cho `US-02-06` từ Story baseline và `US-02-05 DONE` evidence.
- Khóa scope fact-only cho history/contribution/cadence/review/economy và bounded analytics metadata.
- Đề xuất năm technical confirmations về ownership, query boundary, economy mismatch, analytics
  atomic/privacy behavior và existing-index/no-migration policy.
- Đặt authoritative solo-developer order `T00 → T11` và giữ implementation `NOT_STARTED`.
- Không chốt Product `OPEN`, không chỉnh production code và không chạy native/EAS build.
