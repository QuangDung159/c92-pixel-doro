---
document_id: PIXELDORO_EPIC_05_USER_STORIES
version: 0.13.0
status: US_05_04_IMPLEMENTED_AWAITING_OWNER_ACCEPTANCE
date: 2026-08-31
owner: Dũng Lư
baseline_sha: 91cb459c05fdcfa1f114c9ed13ac143fdc7fd7d2
branch: feats/epic-05
authority_references:
  - docs/PIXELDORO_CORE_TRUTH.md
  - docs/planning/MVP_EPICS.md
  - docs/planning/EPIC-03_UX_PROTOTYPE_PLAN.md
  - docs/planning/EPIC-04_USER_STORIES.md
  - docs/planning/EPIC-04_EXIT_REPORT.md
  - docs/architecture/technical-overview.md
  - docs/architecture/system-architecture.md
  - docs/architecture/project-structure.md
  - docs/architecture/data-model.md
  - docs/specifications/timer-engine.md
  - docs/specifications/session-lifecycle.md
  - docs/specifications/pet-state-machine.md
  - docs/specifications/gamification-rules.md
---

# EPIC-05 — First-use Onboarding Trial

> Living execution record. US-05-01/02 acceptance is bound to exact implementation SHAs. US-05-02
> formal tester evidence is explicitly deferred to a later phase; no device/manual pass is implied.
> Later Stories remain gated by their own plan, implementation, evidence and owner acceptance.

## 1. Epic context and outcome

EPIC-05 turns the approved clickable first-use journey into a durable production vertical slice. A new user understands the value of the Cat / Mèo Dev companion, completes one fixed five-minute Focus trial, receives exactly `5 XP` and `1 Coin`, sees the Pet celebrate a freshly committed result, and explicitly enters Home/Pet Room.

The locked trial invariant is:

| Field | Required value |
| --- | --- |
| `focusVariant` | `onboarding_trial` |
| Duration | 5 minutes |
| `mode` | `relax` |
| `workTag` | `null` |
| Strict/grace branch | Absent |
| Completed reward | Exactly `5 XP`, `1 Coin` |
| Reward delivery | Automatic, atomic with completion, idempotent |
| Default Pet | Cat / Mèo Dev (`cat-dev`) |

The onboarding trial must not contribute to standard history, contribution graph, Long Break cadence, store-review eligibility, or standard/core Focus analytics. Durable session/reward/profile/install facts—not screen-local state—must drive relaunch and recovery.

## 2. Baseline verification

Verification was performed before planning changes.

| Check | Finding |
| --- | --- |
| Initial branch | `feats/epic-04` |
| Accepted closure commit | `ce6f831d8cc830ec95ff87ff6ff59658ca4d6b5a` (`Close EPIC-04`) |
| Newest full-content baseline | `91cb459c05fdcfa1f114c9ed13ac143fdc7fd7d2` (`Feats/epic 04 (#6)`) |
| Why this SHA | It is the newer squash merge on `dev`; its Git tree is byte-for-byte identical to `ce6f831` (`a8215965…`) even though squash history makes `ce6f831` not an ancestor. |
| EPIC-04 completion | `EPIC-04_USER_STORIES.md` is `DONE_OWNER_ACCEPTED`; exit report is present; `MVP_EPICS.md` marks EPIC-04 `DONE`. |
| EPIC-04 assets/evidence | Production Cat sprite set and US-04 evidence/reports are present. |
| Target branch | `feats/epic-05`, created from and tracking the verified full-content baseline. |
| Worktree at audit start | Clean; no owner changes were discarded or overwritten. |

- [x] Current branch, HEAD, upstream, and worktree checked.
- [x] Latest full-content EPIC-04 completion commit identified without assuming a SHA.
- [x] EPIC-04 planning, exit report, MVP status, sprites, and evidence verified.
- [x] `feats/epic-05` based on the verified baseline.
- [x] No reset, history rewrite, push, PR, schema change, dependency install, prebuild, or native build performed.

## 3. Authority order

When sources disagree, implementation must follow this order:

1. Product Core and locked product scope.
2. Owner-approved EPIC-03 clickable UX.
3. `MVP_EPICS.md` and the approved data-needs mapping.
4. Completed EPIC-04 Pet/Home behavior.
5. Timer Engine, Session Lifecycle, Pet State Machine, and Gamification Rules.
6. Architecture and ADR boundaries.
7. Existing schema/code as an implementation baseline only.

The database and current prototype must not silently redefine approved UX. A data gap becomes a documented gate/proposal; it is not authorization to change schema.

## 4. Completed-document inventory

All current documents with relevant `ACTIVE`, `APPROVED`, `ACCEPTED`, `DONE`, `DONE_OWNER_ACCEPTED`, `COMPLETE`, or completion-evidence status were inventoried and read for EPIC-05 impact.

| Group | Documents read | EPIC-05 authority/finding |
| --- | --- | --- |
| Product | `PIXELDORO_CORE_TRUTH.md` (`ACTIVE`) | Locked first-use outcome and trial invariants; `OPEN-009` remains open. |
| MVP planning | `MVP_EPICS.md` (`APPROVED`) | EPIC-05 is MUST; EPIC-04 exit opens its start gate; EPIC-06/08/09/11 remain later epics. |
| Approved UX | `EPIC-03_UX_PROTOTYPE_PLAN.md` (`UX_APPROVED`) | Intro → trial → result → Pet Room hierarchy, tab/full-screen rules, cancellation route, and data-needs map. |
| Pet/Home completion | `EPIC-04_USER_STORIES.md`, `EPIC-04_EXIT_REPORT.md` (`DONE_OWNER_ACCEPTED`) | Production Home/Pet projections, Cat assets, committed-event celebration contract, reduced-motion/fallback behavior. |
| Pet implementation evidence | `US-04-03` through `US-04-07` implementation reports, art review, and device guide | Confirms review fixture boundaries and owner-accepted Cat/Mèo Dev quality. |
| Foundation | `EPIC-01_USER_STORIES.md`, `EPIC-01_IMPLEMENTATION_EVIDENCE.md` | Runtime, routes, module boundaries, and root quality gates. Evidence status wording is older, but recorded implementation outcomes were inspected rather than inferred from filename. |
| Persistence | `EPIC-02_USER_STORIES.md`, `EPIC-02_IMPLEMENTATION_EVIDENCE.md` | SQLite/repository/query foundation is complete; it does not yet provide the production onboarding application flow. |
| Persistence plans | `US-02-01` … `US-02-09_IMPLEMENTATION_PLAN.md` (all completed/approved plans) | Schema bootstrap, installation/profile/session/reward repositories, queries, transactions, and recovery contracts. |
| Architecture | `technical-overview.md`, `system-architecture.md`, `project-structure.md`, `data-model.md` | Pure domain/application boundaries, Expo Router presentation, SQLite durable truth, composition root ownership. |
| ADRs | ADR-001 through ADR-008 | Toolchain, navigation, SQLite, domain/platform separation, Reanimated/sprites, feedback/store review, delivery, and later PostHog guardrails. |
| Specifications | Timer Engine, Session Lifecycle, Pet State Machine, Gamification Rules | Timestamp-derived timer, terminal transitions, fresh committed Pet feedback, and reward correctness. |
| Readiness | `TECHNICAL_DOCUMENTATION_CHECKLIST.md` | Documentation preparation is complete; EPIC-05 implementation/device acceptance still needs future evidence. |

## 5. Code, UX, and data-needs audit

### 5.1 Required findings

| # | Audit question | Current baseline | EPIC-05 consequence |
| --- | --- | --- | --- |
| 1 | Current First Use UX | The root layout initially routes to `(onboarding)`. The screen matches the approved short intro, Cat/Mèo Dev copy, and `Thử phiên 5 phút` CTA, but is backed by `PrototypeProvider`. No naming or selector UI is shown. | Preserve hierarchy/copy; replace prototype state and hard-coded launch choice with a production launch projection. |
| 2 | Fake vs production trial steps | Intro, `startTrial`, running timer, completion/cancel, result, and reward are in-memory prototype behavior. Running shows `MOCK COUNTDOWN` and fixed `05:00`; dev controls simulate outcomes. | Each visible step must cross application commands/projections and committed SQLite facts before prototype controls are removed from production routes. |
| 3 | Approved hierarchy/CTA/navigation | Full-screen intro and active flow have no tabs. Result order is outcome → Pet → reward → CTA. Completed CTA is `Vào Pet Room`; back from result goes Home. Approved cancellation returns to intro. | Keep this hierarchy. Resolve the remaining behavior choices in DEC-05-01/03/04 before implementation. |
| 4 | Trial session creation | `prototype-state.ts` creates an in-memory `{kind: 'trial', durationMinutes: 5, mode: 'relax'}` object. No production session row is inserted by the CTA. | Add a production Start Onboarding Trial application command using the existing session port/transaction boundary. Navigate only after commit. |
| 5 | Trial completion | Prototype reducer resolves locally. No production timer/deadline controller commits the terminal transition. Startup reconciliation is currently `NoopStartupReconciliationAdapter`. | Add exactly-once deadline/foreground/startup reconciliation and a conditional terminal transition. |
| 6 | Reward card | Focus Result reads a prototype reward and labels it `REWARD FEEDBACK · MOCK`. | Read the committed reward receipt/result projection; never calculate or claim reward in the screen. |
| 7 | Pet celebration boundary | EPIC-04 exposes `PetTerminalFeedbackController` and `PetVisualController`. The terminal controller accepts only a fresh committed event, dedupes within runtime, and must never write session/reward. Production composition currently emits only from a development review fixture. | After the completion transaction succeeds, hand the fresh terminal event to this existing boundary. Reopen/relaunch hydration must use base projection and must not replay celebration. |
| 8 | Relaunch/recovery | Prototype state is lost. Bootstrap calls a startup reconciliation port, but the production adapter is no-op. Session repositories can read active/terminal rows. | Route from durable installation/session state, derive remaining time from timestamps, and reconcile overdue running trial before rendering a stable destination. |
| 9 | Trial exclusions | Schema persists `focus_variant`. History, contribution, cadence, and store-review queries explicitly filter `focus_variant = 'standard'`; schema/query integration tests cover the filters. | Preserve and expand regression coverage with a real completed trial fixture. Do not add trial to standard/core Focus analytics. |
| 10 | Home/Pet Room handoff | Home is production and reads committed profile/Pet projection. Result CTA is prototype navigation; `onboarding_completed_at` is not written by the flow. | On explicit Continue, persist onboarding completion, refresh/bootstrap production projection, then route Home. Home must show committed total `5 XP`/`1 Coin`. |
| 11 | Does `OPEN-009` block? | No. Approved prototype intentionally has no naming field; Product Core permits the default name while naming remains open. | Keep Cat/Mèo Dev. Do not create a naming gate, field, table, or inferred decision. |
| 12 | Is the data-needs map sufficient? | Schema 001 already has installation completion, onboarding-trial session, reward receipt, profile progression, unique reward-per-session, and standard-query exclusions. Repository ports cover the facts, but production trial use cases/projections/reconciliation and a composition event handoff are missing. | No migration is currently justified. Generalize application/repository APIs only where required; if implementation proves a schema gap, stop and raise a separate authority/schema proposal. |
| 13 | UI duplication/size risk | Common primitives exist and relevant presentation files are below 300 lines; Focus setup is the largest audited screen at 241 lines. Timer/result blocks and prototype controls are feature-specific. | Make routes/screens composition-only. Extract a stable reward summary now; keep trial countdown feature-local until a second proven consumer. Split proactively near 240–260 lines. |
| 14 | Prototype code worth reusing | Approved copy, layout order, route names, Cat stage composition, confirmation dialog interaction, and basic focus/result visual structure are useful presentation references. | Migrate visuals to production view-model props and common components without importing prototype state into production application/composition. |
| 15 | Prototype code that must remain separate | `PrototypeProvider`, reducer, fake rewards, deterministic review buttons, placeholder Break/History/Shop/Settings/Feedback state. | Keep fixtures dev-only. Never treat reducer state or fixture navigation as durable Product truth; do not productionize later-epic screens in EPIC-05. |

### 5.2 Production ownership map

| Area | Production today | Prototype/review-only today | EPIC-05 action |
| --- | --- | --- | --- |
| Launch/onboarding | Route shell only | State, eligibility, CTA action | Production launch projection and command wiring. |
| Session | SQLite schema, repository, transaction primitives | Trial creation/resolve path | Application/domain trial use cases and projections. |
| Timer | Timestamp contracts in specs | Fixed label and fake controls | Clock-derived running projection plus lifecycle reconciliation. |
| Reward/profile | Receipt/profile repositories, constraints | Reward formula/card state in reducer | Atomic completion+reward+profile command and committed result projection. |
| Pet | Base projection, visual controller, terminal feedback controller, Cat assets | Development event fixture | Production post-commit event handoff; no Pet-side writes. |
| Home | Production projection/UI | None relevant | Refresh after Continue; show committed totals. |
| History/cadence/review | Production queries with standard-only filters | Prototype screens remain | Regression-test exclusions only; no new feature UI. |
| Analytics | Typed event vocabulary/ports | No EPIC-05 production emissions | Add only typed semantic hooks per DEC-05-02; no provider/vendor work. |

### 5.3 Approved journey and recovery routing

```text
Launch/bootstrap
  ├─ onboarding completed ───────────────────────────────> Home/Pet Room
  ├─ running trial, before deadline ─────────────────────> Trial Running
  ├─ running trial, deadline passed ─> reconcile commit ─> Trial Result
  ├─ completed trial, onboarding not completed ──────────> Trial Result
  ├─ cancelled trial, onboarding not completed ──────────> Intro
  └─ no trial, onboarding not completed ─────────────────> Intro

Intro --committed Start--> Trial Running
Trial Running --committed Cancel--> Intro
Trial Running --deadline/foreground/startup--> atomic Complete + Reward --> Result
Result --committed explicit Continue--> Home/Pet Room
```

No route may infer durable completion from navigation history alone.

## 6. UI reuse and component audit

Line counts are baseline source counts, not target estimates. Proposed APIs are planning proposals, not implementation commitments.

| Pattern / component | Current consumers and responsibility | Lines | Reuse / generalize decision | Proposed API / migration | Accessibility contract | Target owner / size guardrail |
| --- | --- | ---: | --- | --- | --- | --- |
| Screen shell + safe-area/scroll: `ScreenShell` | Most feature screens; safe-area and scroll layout | 30 | Reuse directly. Do not create a second onboarding shell. | Existing children/content props; add a finite non-scroll option only if real countdown layout proves it necessary. | Safe-area, keyboard/scroll reachability, large-text content remains reachable. | Common presentation; target ≤80. |
| `ScreenHeader` | Eyebrow/title/description | 43 | Reuse directly. | Existing text props; no speculative right slot. | Heading role and deterministic reading order. | Common; target ≤80. |
| `SectionLabel` | Small section headings | 18 | Reuse directly; no generalization. | Existing label prop. | Text scaling/contrast. | Common; target ≤40. |
| `Panel` | Cards/surfaces across screens | 45 | Reuse finite `default/strong/gold/danger` tones. | Trial intro/result sections migrate to `Panel`; no copied borders/shadows. | Does not steal semantics; children own labels. | Common; target ≤100. |
| `ChoiceChip` | Focus selectors | 54 | Do not use in onboarding because mode/tag/species selectors are prohibited. Keep for later Standard Focus. | No migration in EPIC-05. | Radio role/state already owned. | Common; target ≤80. |
| Text input | Raw `TextInput` exists only in Feedback | n/a | Do not generalize and do not add to onboarding. Naming is open and out of scope. | None. | None added. | Feedback remains feature-local. |
| `Button` | Primary/secondary actions app-wide | 79 | Reuse. Generalize only with a finite `danger` tone if cancellation visual evidence requires it; do not duplicate. | `variant`, `disabled`, `busy`, label/callback; migrate any trial-local button copy to it. | Button role, disabled/busy state, accessible label, ≥44pt target. | Common; target ≤120. |
| Secondary/destructive action | `Button` secondary + `ConfirmationDialog` destructive secondary action | included | Reuse current dialog contract. A `danger` visual variant is optional and test-driven, not required upfront. | Cancel CTA opens dialog; confirm performs command, dismiss preserves running session. | Destructive action explicitly labelled; predictable focus and escape/dismiss. | Common dialog; target ≤100. |
| Icon button | No stable production consumer/API | n/a | Do not create speculatively. | None. | If later needed, separate 44pt target/label contract. | Deferred. |
| `ConfirmationDialog` | Focus cancel confirmation | 60 | Reuse directly; improve focus/announcement only if tests expose a gap. | title/body/confirm/cancel callbacks and finite destructive semantics. | Modal announcement, focus order, dismiss, screen-reader labels. | Common; target ≤100. |
| Pet portrait/avatar: `PetPortrait` | Cat art frame | 44 | Reuse directly; it is the avatar equivalent. No generic avatar abstraction. | Existing Pet visual props. | Meaningful Pet label; decorative layers hidden. | Pet common; target ≤80. |
| `PetStage` | Home/review Pet composition and animation host | 80 | Reuse for intro/result. | Accept committed `PetVisualProjection`; no session/reward dependency. | Static fallback and status text remain understandable without motion. | Pet common; target ≤140. |
| Status badge | No dedicated stable component | n/a | Do not create solely for trial. Use text/notice/status surface. | None. | Status must not be color-only. | Deferred. |
| `PetStatusText` / `PetVisualStatus` | Accessible Pet state/status | 32 / 55 | Reuse as EPIC-04 contract; do not duplicate celebration copy. | Projection-driven state; decorative animation hidden. | Live/status semantics only on fresh changes; reduced-motion parity. | Pet common; each ≤100. |
| `StatDisplay` | Home XP/Coin stats | 38 | Reuse for individual stats. | Pass committed label/value. | Clear combined label/value and scalable text. | Common; target ≤70. |
| Progress display | Home progress remains feature-local | n/a | Do not generalize for trial; countdown is not progression. | None. | Existing Home semantics retained. | Home feature. |
| Reward summary | Result currently duplicates a fake reward block | n/a | Create one common presentational `RewardSummary` because trial Result and known Standard Result share a stable committed-reward shape. | Proposed `{ xp, coins, title?, tone?: 'earned'|'neutral' }`; migrate current Result visual consumer, but no business logic. | Group label announces XP/Coin once; not color-only; large text wraps. | Common; estimated 60–90, own component tests. |
| `StatusSurface` | Loading/empty/error full states | 79 | Reuse for launch/result recovery. Add finite retry action only if existing API cannot express it. | `state`, message, optional action callback. | Status/alert semantics appropriate to state; retry labelled. | Common; target ≤120. |
| Empty state | `StatusSurface` empty variant | included | Reuse; no onboarding-specific empty component. | Existing finite state. | Explicit explanatory copy. | Common. |
| Error/recovery state | `StatusSurface` + `InlineNotice` | 79 / 25 | Reuse; error surfaces consume failure view models, never repository errors directly. | Optional retry callback and stable safe copy. | Alert when actionable; focus remains reachable. | Common; each ≤120. |
| `InlineNotice` | Inline informational copy | 25 | Reuse. Generalize tone/role only if running/result recovery needs a second stable variant. | Proposed finite `info/warning/error` only when proven. | Role chosen by urgency; not color-only. | Common; target ≤70. |
| Loading boundary: `BootstrapBoundary` | App bootstrap loading/error | 62 | Reuse and extend projection routing outside the visual component. | Bootstrap view state + retry. | Loading announced without repeated live-region noise. | Provider/presentation; target ≤100. |
| Reduced-motion/static fallback | Owned by EPIC-04 Pet components | included above | Reuse unchanged. Trial screens may not invent an alternate celebration. | System reduced-motion signal flows through existing Pet visual API. | Same outcome/copy/reward without motion. | Pet common. |
| Trial countdown block | Focus screen currently renders fixed mock countdown; Break has a separate prototype countdown | part of 241-line screen | Create feature-local `TrialCountdown` initially. A common timer abstraction has only one production consumer and Standard Focus may require different states. | Proposed pure props `{ remainingMs, state, accessibilityLabel }`; no clock, repository, transition, or navigation inside. | Announces meaningful minute/state changes without per-second screen-reader spam; large text; reduced motion irrelevant. | Focus/onboarding feature; estimated 70–110, own tests; revisit in EPIC-06. |
| `PrototypeControls` | Review-only state buttons | 94 | Keep dev-only; never migrate into production UI. | A typed, gated EPIC-05 review fixture may trigger production commands but must not ship as a user control. | Review-only. | Prototype/review; keep isolated. |

### 6.1 Screen composition rule

Onboarding, Trial Running, Result, and route files may only arrange components, consume a projection/view model, and connect navigation/action callbacks. They must not contain eligibility, transition rules, timestamp arithmetic, reward math, Pet derivation, SQL/repository calls, or copied primitives. No UI/source file may exceed 300 lines; split review begins at 240 lines, using responsibility and test boundaries rather than artificial fragments.

## 7. Scope

### In scope

- Durable launch decision for first-use, active trial, terminal trial, and returning user.
- Approved Cat/Mèo Dev intro with no naming or selector.
- Production start/cancel/complete/reconcile commands for fixed onboarding trial.
- Timestamp-derived running projection, background/foreground/relaunch recovery, and offline operation.
- Atomic, automatic, idempotent completion + `5 XP` + `1 Coin` receipt/profile update.
- Committed result projection, EPIC-04 fresh terminal feedback handoff, and explicit Continue to Home/Pet Room.
- Standard-query exclusion regression proof and minimal typed analytics semantics after owner decision.
- Error/retry, accessibility, reduced-motion, common-component regression, and review fixtures/evidence guides.

### Out of scope

- Pet naming and resolving `OPEN-009`.
- Pet/species selector, Dog/Rabbit roster, multiple Pets, or species persistence.
- Standard Focus setup/timer/result, work tags, mode selector, Strict mode, grace failure, break flow (EPIC-06).
- New progression surfaces/levels/unlocks (EPIC-08), production history UI (EPIC-09), or analytics provider/dashboard (EPIC-11).
- Store-review prompting, native graph changes, dependency installation, schema/migration changes, prebuild/EAS/native builds.
- Treating prototype state, dev fixtures, logs, or JSON probes as production truth or the primary visible outcome.

## 8. Product and technical gates

| Gate | Required before | State | Closure |
| --- | --- | --- | --- |
| G05-BASE | Any implementation | CLOSED | Verified baseline `91cb459…`, clean branch, EPIC-04 accepted. |
| G05-PLAN | US-05-01 | CLOSED | Owner approved all four Product confirmations, the US-05-01 implementation plan, and `US0501-CONFIRM-01`…`06` on 2026-08-31. |
| G05-UX | US-05-01/02/04 | CLOSED | Owner approved Option 1 for DEC-05-01, DEC-05-03, and DEC-05-04 on 2026-08-31. |
| G05-ANALYTICS | US-05-05 | CLOSED | Owner approved Option 1 for DEC-05-02 on 2026-08-31. |
| G05-DATA | Each story | CONDITIONAL | Existing schema appears sufficient. Any proven schema gap stops implementation for separate owner/authority review; no silent migration. |
| G05-STORY-N | Next story | US-05-03 CLOSED | Owner accepted US-05-03 on `a66d8a9e` after quick smoke; formal tester evidence is deferred; US-05-04 planning may open, but production remains gated by its plan approval. |

## 9. Story overview

| Order | Story | User-visible increment | MVP Priority | Dependency Priority | Dependencies | Blocks | Initial status |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | US-05-01 — Durable First-use Entry | New user sees approved production intro; returning/recovering user lands on the correct durable route. | MUST | P0 | EPIC-01/02/03/04, G05-PLAN/G05-UX | US-05-02 | DONE_OWNER_ACCEPTED — `f2efd62` |
| 2 | US-05-02 — Start, Run, Resume, or Cancel Trial | CTA starts a real five-minute trial; countdown resumes after background/relaunch; cancel safely returns to intro. | MUST | P0 | US-05-01, DEC-05-03 | US-05-03 | DONE_OWNER_ACCEPTED — `ef05b207`; TESTER DEFERRED |
| 3 | US-05-03 — Complete and Reward Exactly Once | Deadline produces one committed completion and reward; Result reads `5 XP`/`1 Coin` from durable truth. | MUST | P0 | US-05-02, DEC-05-04 | US-05-04/05 | DONE_OWNER_ACCEPTED — `a66d8a9e`; QUICK SMOKE PASS; TESTER DEFERRED |
| 4 | US-05-04 — Pet Celebration and Home Handoff | Fresh completion celebrates once; explicit Continue lands in production Home with committed totals. | MUST | P1 | US-05-03, EPIC-04, DEC-05-04 | US-05-05 | IMPLEMENTED — AWAITING OWNER ACCEPTANCE `f1302b8`; TESTER DEFERRED |
| 5 | US-05-05 — First-use Integrity and Exit Evidence | Full offline/relaunch/a11y journey is reviewable; exclusions and analytics semantics are proven without later-epic scope. | MUST | P1 | US-05-04, DEC-05-02 | EPIC-05 exit / EPIC-06 gate | NOT STARTED — SEQUENCED |

`MVP Priority` says every capability is mandatory for the MVP outcome. `Dependency Priority` expresses correctness/rework risk: P0 establishes durable truth before polished handoff; P1 closes integration and evidence; no P2 story is proposed.

## 10. Dependency graph and authoritative execution order

```text
Owner approves plan + DEC-05-01/03/04
                  |
                  v
US-05-01 -> US-05-02 -> US-05-03 -> US-05-04 -> US-05-05 -> EPIC-05 owner acceptance
                                              ^             |
                                              |             +-- requires DEC-05-02
                                       EPIC-04 contracts
```

Authoritative solo-developer order is exactly `US-05-01 → US-05-02 → US-05-03 → US-05-04 → US-05-05`. Only one story may be `IN_PROGRESS` at a time. A following story may not open until the prior story's exit condition is recorded.

This order first removes incorrect launch/prototype truth, then commits a recoverable running record, then builds exactly-once terminal/reward behavior, and only then connects transient Pet feedback and final handoff. It prevents presentation work from dictating persistence semantics and prevents celebration from firing before a commit exists.

## 11. Story details

### US-05-01 — Durable First-use Entry

**User story statement:** As a first-time or returning user, I want app launch to place me in the correct first-use destination so that I never see a stale or contradictory onboarding state.

**User-visible outcome:** A genuinely new installation sees the approved Cat/Mèo Dev intro. A completed installation goes directly to Home. An active or terminal trial is routed from durable state to Running or Result rather than being reset to intro.

**Tangible output:** Production first-use composition and launch projection replace `PrototypeProvider` as the authority for onboarding routes; loading/error/retry states are visibly reviewable.

- **MVP Priority:** MUST
- **Dependency Priority:** P0
- **Dependencies:** G05-PLAN, DEC-05-01, EPIC-01 bootstrap/navigation, EPIC-02 installation/session repositories, EPIC-03 hierarchy, EPIC-04 production Home/Pet.
- **Blocks:** US-05-02.
- **Product/technical gate:** Owner approves mandatory/skip behavior. Existing schema must express every launch state; otherwise G05-DATA stops work.
- **Initial status:** `PROPOSED — OWNER REVIEW`.

**In scope**

- Durable launch projection and deterministic route precedence shown in §5.3.
- Production intro presentation using approved copy, Cat/Mèo Dev, common surfaces, and CTA callback.
- Bootstrap loading, safe error, retry, and no-flash routing.
- Removing prototype state as route authority while retaining dev-only fixture isolation.

**Out of scope**

- Creating a trial session, countdown, reward, naming, skip behavior not approved by DEC-05-01, or later-epic tabs.

**Fake remaining after this story:** The CTA may be wired to a development placeholder/disabled state only for this story's review; no fake session may be presented as durable. Running/completion/result remain the next stories.

**Production foundation:** `FirstUseLaunchProjection`/controller contract, composition wiring, durable route precedence, and production intro view model.

**Acceptance criteria**

- [ ] New installation with no trial shows the approved Cat/Mèo Dev intro and `Thử phiên 5 phút`.
- [ ] No name, species, mode, work-tag, or Strict selector is visible.
- [ ] Completed onboarding routes directly to production Home/Pet Room.
- [ ] Running trial routes to Running; completed trial without onboarding completion routes to Result; cancelled trial routes per DEC-05-03.
- [ ] Loading/error/retry avoids flashing an incorrect screen and never fabricates durable state.
- [ ] Route/screen imports no repository, SQL, prototype reducer, or business rule.
- [ ] Production routes no longer depend on `PrototypeProvider` for eligibility.
- [ ] Cat static/reduced-motion behavior remains equivalent.

**Layer boundaries**

| Layer | Responsibility |
| --- | --- |
| Domain | Express no navigation; only validated durable state types if missing. |
| Application | Read installation/session facts and return one finite launch destination/projection. |
| Infrastructure | Use existing repositories; no schema changes and no UI concerns. |
| Presentation/composition | Map finite projection to routes and common components; CTA is a callback, not a repository call. |

**UI reuse/component plan:** Reuse `BootstrapBoundary`, `ScreenShell`, `ScreenHeader`, `Panel`, `Button`, `PetStage`, `PetStatusText`, and `StatusSurface`. Keep the intro screen feature-local because it has one cohesive consumer. Migrate approved copy/layout from prototype to view-model props; do not migrate reducer dependencies. No new common component is required.

**Component size/split estimate:** Intro composition 90–130 lines; launch route/controller adapter 70–110; all UI files <200. Tests isolate projection routing and Intro rendering. Split only if bootstrap routing and rendering become mixed responsibilities.

**Task breakdown by layer**

- Domain/Application: define finite launch destination and precedence; cover inconsistent/read-failure outcomes.
- Infrastructure: adapt current installation/session reads; confirm cancelled/terminal lookup behavior.
- Composition: replace no-op/prototype launch authority with production controller.
- Presentation: bind approved intro and common recovery states; remove prototype badge/control from user path.
- Tests/evidence: projection, import boundary, route, component, a11y, and fixture review.

**Automated test plan**

- Pure unit: route precedence table for new/running/completed/cancelled/onboarding-complete facts.
- Application/controller: repository success, inconsistent facts, read failure, retry, and no state mutation.
- SQLite integration: seed each existing fact shape and confirm projection; no migration test expected.
- Presentation/navigation: intro copy/CTA, no forbidden selectors, correct routes, no wrong-screen flash.
- Accessibility: header hierarchy, CTA label/target, Cat status, loading/error announcement, large text.
- Boundary/import: presentation cannot import infrastructure/repository/prototype authority.
- Common regression: BootstrapBoundary/PetStage existing consumers remain green.
- Root gate: `pnpm run quality`; verify UI source line-limit check or explicit repository check reports no file >300.

**Manual test guide**

Preconditions: owner-approved DEC-05-01/03, existing compatible Development Build installed, clean review database or typed dev fixture. The fixture must feed the production projection through isolated test data; it must not bypass it.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_new pnpm start --clear
```

1. Start at a cold launch with `first_use_new`; wait for bootstrap.
2. Confirm intro hierarchy, Cat/Mèo Dev, value copy, and `Thử phiên 5 phút`; confirm no selector/name/Strict UI.
3. Switch fixture to `first_use_returning`, cold relaunch, and confirm direct Home with no intro flash.
4. Review `first_use_running`, `first_use_completed`, `first_use_cancelled`, and `first_use_read_error`; cold relaunch each and confirm §5.3 destination/retry behavior.
5. Turn network connectivity off and relaunch `first_use_new`; local first-use routing must still work.
6. Enable the OS screen reader and large text; verify heading/CTA/status order. Enable Reduce Motion; Cat remains visible and understandable without motion.

Expected durable fact: this story only reads existing fixture facts; viewing/retrying does not create sessions, rewards, or completion flags. Expected Pet: base Cat state only, never celebrate. Expected XP/Coin: unchanged. Expected navigation: exact durable route table. Negative assertions: no prototype badge/control, no wrong-screen flash, no repository error text, no name/species/mode/tag/Strict control.

Cleanup:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

Evidence to send: Git SHA; platform; device/simulator; OS; screenshots/video of new/returning/error states; before/after installation/session/reward/profile durable facts; pass/fail per step. Device/platform remains unchecked until owner evidence exists.

**Minimum evidence:** automated gate output, route-table test result, intro/returning/error screenshots, fixture isolation note, line-count report, and owner manual record metadata.

**Must not happen:** Intro shown from screen-local state; a read changes data; naming/selector appears; fixture ships as user UI; an error silently marks onboarding complete.

**Exit condition:** Owner accepts the durable routing/intro increment and automated gates pass; G05-STORY-1 closes before US-05-02 becomes active.

---

### US-05-02 — Start, Run, Resume, or Cancel the Fixed Trial

**User story statement:** As a new user, I want the intro CTA to start a real five-minute trial that survives interruption so that I can trust the timer and safely retry if I cancel.

**User-visible outcome:** Tapping `Thử phiên 5 phút` commits one running trial, then opens a real timestamp-derived countdown. Background/relaunch resumes the correct remaining time. Confirmed cancellation commits `cancelled`, gives no reward, and returns to intro.

**Tangible output:** The production CTA, running screen, cancel confirmation, and relaunch path are directly reviewable without mock countdown controls.

- **MVP Priority:** MUST
- **Dependency Priority:** P0
- **Dependencies:** US-05-01, DEC-05-03, existing SessionRepository/transaction/clock contracts.
- **Blocks:** US-05-03.
- **Product/technical gate:** Trial invariant is immutable; concurrent start and running-session conflict semantics must be explicit before UI navigation.
- **Initial status:** `PROPOSED — OWNER REVIEW`.

**In scope**

- Production Start Onboarding Trial command with fixed variant/duration/mode/tag.
- Commit-before-navigation, duplicate-tap/concurrent-start safety, and friendly recovery.
- Clock-derived remaining time; foreground/background/relaunch resume.
- Relax cancellation with confirmation, durable terminal transition, no reward, return to intro.

**Out of scope**

- Completed reward/result, background failure, Strict/grace behavior, Standard Focus, or break scheduling.

**Fake remaining after this story:** A deadline may show a safe completion-pending/recovery state until US-05-03; it must not fake completion/reward. Dev fixtures may accelerate time only through an injected clock, never change production duration.

**Production foundation:** Start/cancel application use cases, running projection/controller, lifecycle clock adapter, and recoverable production session route.

**Acceptance criteria**

- [ ] CTA commits exactly one `running` session with `focusVariant=onboarding_trial`, configured/XP minutes `5`, `mode=relax`, and `workTag=null` before navigation.
- [ ] Duplicate taps/concurrent starts cannot create two running trials.
- [ ] Running UI derives remaining time from durable timestamps and a clock, not decrement-only screen state.
- [ ] Background and cold relaunch before deadline resume the same session with plausible remaining time.
- [ ] No mode/tag/Strict/grace/failure control or branch exists.
- [ ] Cancel dialog dismissal preserves running; confirm commits `cancelled`, returns to intro, and creates no reward/profile increment.
- [ ] Start/cancel persistence failure keeps the user on a recoverable screen and does not claim success.
- [ ] Offline start/run/cancel works against local durable storage.

**Layer boundaries**

| Layer | Responsibility |
| --- | --- |
| Domain | Validate fixed onboarding trial input and allowed running→cancelled transition; no clock/platform import. |
| Application | Start/cancel commands, idempotency/conflict result, timestamp-derived running projection. |
| Infrastructure | Existing SQLite session/transaction and injected clock/lifecycle adapters. |
| Presentation/composition | CTA invokes command; screen renders projection and confirmation; navigation follows command result. |

**UI reuse/component plan:** Reuse `ScreenShell`, `ScreenHeader`, `Panel`, `Button`, `ConfirmationDialog`, `PetStage`, `InlineNotice`, and `StatusSurface`. Add feature-local pure `TrialCountdown` (70–110 lines) with projection props; do not generalize a common timer until EPIC-06 proves a second production API. Remove `MOCK COUNTDOWN` and user-facing prototype controls; do not migrate Break prototype.

**Component size/split estimate:** Running screen 120–180 composition-only; countdown 70–110; cancel dialog remains 60; controller/use-case files each target ≤180. Countdown owns formatting/accessibility tests; screen owns layout/action tests.

**Task breakdown by layer**

- Domain: onboarding-trial construction/transition invariants using existing types where sufficient.
- Application: start, duplicate conflict mapping, cancel, running projection, deadline-pending state.
- Infrastructure/composition: SQLite transaction/repository, clock and app-lifecycle wiring.
- Presentation: real countdown, busy/error states, confirmation, commit-result navigation.
- Tests/evidence: invariant, concurrency, relaunch, offline, import, component, and navigation proof.

**Automated test plan**

- Pure unit: exactly 5 minutes, relax, null tag, no Strict failure; remaining-time boundaries and non-negative display.
- Application/controller: commit-before-success, duplicate tap, active-session conflict, cancel/dismiss, storage failure.
- SQLite integration/concurrency: one running row under two starts; valid cancelled row; no reward/profile mutation.
- Presentation/component: countdown format/states, no forbidden controls, busy/error/retry, dialog behavior.
- Navigation/flow: intro→running only after commit; cancel→intro only after commit.
- Relaunch/lifecycle: resume same session before deadline; background time is wall-clock time for Relax.
- Accessibility: countdown announcement throttling, large text, buttons/dialog focus and labels.
- Boundary/common regression: no repository import in screen; Button/Dialog/Pet existing consumers pass.
- Root gate: `pnpm run quality` plus explicit UI ≤300-line and no-duplicate primitive inspection.

**Manual test guide**

Preconditions: US-05-01 accepted, existing compatible Development Build, clean local review database. `trial_running_fast_clock` may accelerate review display through an injected dev clock but persisted configured duration must remain five minutes.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_fresh pnpm start --clear
```

1. Start at Intro, rapidly tap `Thử phiên 5 phút` twice, and confirm only one Running screen/session.
2. Confirm countdown begins near `05:00`; verify no selectors, work tag, Strict copy, prototype badge, or Complete control.
3. Background for about 15 seconds and return; remaining time reflects elapsed wall time.
4. Kill and relaunch before deadline; the same session resumes rather than starting over.
5. Open Cancel, dismiss it, and confirm timer/session continue. Open again, confirm cancellation, and verify return to Intro.
6. Confirm durable session is `cancelled`; no reward transaction; XP/Coin unchanged; Cat is base state and does not celebrate.
7. Run `trial_start_failure` and `trial_cancel_failure`; UI must stay truthful and offer safe retry.
8. Disable network and repeat start/cancel; local workflow still succeeds.
9. With screen reader/large text, inspect countdown, buttons, and dialog order. With Reduce Motion, no meaning is lost.

Expected durable fact: one running row becomes cancelled only on confirm. Expected Pet: base/neutral, no terminal celebration for cancellation unless EPIC-04 contract explicitly defines non-reward status feedback; never celebrate reward. Expected XP/Coin: unchanged. Expected navigation: Intro→Running after commit; confirmed Cancel→Intro after commit. Negative assertions: no double session, no fake Complete, no reward, no Standard/Strict state.

Cleanup:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

Evidence to send: Git SHA; platform; device/simulator; OS; start/background/relaunch/cancel video; before/after session/reward/profile facts; failure/offline screenshots; pass/fail. Do not mark device pass without owner evidence.

**Minimum evidence:** invariant and concurrent-start integration results, relaunch video, cancel facts, error/offline proof, a11y record, line-count/import report.

**Must not happen:** Navigation before commit; countdown reset on relaunch; second running trial; reward on cancel; Strict failure; screen-owned time/SQL logic.

**Exit condition:** Start/resume/cancel is owner-reviewable and durable with gates green; G05-STORY-2 closes before completion/reward work starts.

---

### US-05-03 — Complete and Reward Exactly Once

**User story statement:** As a user who reaches the trial deadline, I want completion and my first reward recorded exactly once so that Result always reflects trustworthy progress.

**User-visible outcome:** At/after the deadline the app resolves the running trial, shows completed Result, and displays a committed `+5 XP` and `+1 Coin` without a claim action. Repeated reconciliation, result reopen, or relaunch does not duplicate it.

**Tangible output:** Automatic deadline completion, startup/foreground recovery, committed reward summary, and recoverable failure UI are visible through the production flow.

- **MVP Priority:** MUST
- **Dependency Priority:** P0
- **Dependencies:** US-05-02, DEC-05-04, Session/Reward/Profile repositories, shared transaction, schema constraints.
- **Blocks:** US-05-04 and US-05-05.
- **Product/technical gate:** Atomic mutation order and conditional terminal outcome must pass SQLite concurrency/failure tests before Result is considered valid.
- **Current status:** `DONE_OWNER_ACCEPTED` at `a66d8a9e`; owner reports quick smoke pass,
  automated/real SQLite gates pass and formal tester is deferred. US-05-04 planning may open.

**In scope**

- Deadline, foreground, and startup reconciliation through one completion use case.
- Atomic running→completed + reward receipt + profile progression transaction.
- Idempotent/concurrent duplicate handling and committed Result projection.
- Result recovery/retry when completion transaction fails; automatic navigation per DEC-05-04.

**Out of scope**

- Pet celebration presentation/Continue (US-05-04), reward claim button, generic Standard Focus completion, analytics provider.

**Fake remaining after this story:** Pet may remain in its committed base projection and Continue may be disabled/review-only until US-05-04. Reward/session/profile must contain no fake values.

**Production foundation:** Complete Onboarding Trial command, startup reconciliation adapter, committed result projection, and fresh-commit event output for the Pet boundary.

**Acceptance criteria**

- [ ] Deadline resolution commits session `completed`, reward receipt, and profile totals in one transaction.
- [ ] Committed values are exactly `5 XP` and `1 Coin`, with onboarding-trial reward reason and one receipt per session.
- [ ] Result reads committed session/reward facts; screen performs no formula and has no claim button.
- [ ] Duplicate deadline callbacks, foreground/startup reconciliation, concurrent completes, and Result reopen keep one reward and one profile increment.
- [ ] A transaction failure leaves no partial completion/reward/profile mutation and offers recovery.
- [ ] Relaunch with overdue running session reconciles before showing Result; relaunch with completed session reads the existing result.
- [ ] Trial remains Relax: background time counts, and no failed terminal status is introduced.
- [ ] A fresh committed terminal event is emitted only after commit, contains stable identity, and is not emitted for hydrated old completion.

**Layer boundaries**

| Layer | Responsibility |
| --- | --- |
| Domain | Validate completion eligibility/reward facts as pure rules; no SQLite/navigation/Pet mutation. |
| Application | Orchestrate conditional transition, reward/profile writes, idempotent result, and post-commit event output. |
| Infrastructure | Execute existing repositories within shared SQLite transaction; startup/lifecycle adapters call the same use case. |
| Presentation/composition | Render committed Result/RewardSummary and recovery; route only after committed outcome. |

**UI reuse/component plan:** Reuse `ScreenShell`, `ScreenHeader`, `Panel`, `PetStage` in base state, `StatDisplay`, `StatusSurface`, and `InlineNotice`. Create common pure `RewardSummary` with committed values and migrate the current Result reward visual; keep calculation in domain/application. Result screen remains feature composition and should not know receipt reason/SQL.

**Component size/split estimate:** `RewardSummary` 60–90; Result composition 130–190; result view-model/controller ≤180. Independent tests for transaction use case, result projection, RewardSummary, and navigation. No UI file >240 target.

**Task breakdown by layer**

- Domain: exact onboarding reward/invariant validation, terminal eligibility, idempotent outcome types.
- Application: transactional completion and result read; stable fresh-vs-hydrated event semantics.
- Infrastructure: transaction-scoped session/reward/profile adapters and production startup/foreground reconciliation.
- Composition/presentation: deadline command trigger, committed Result, recovery, RewardSummary.
- Tests/evidence: failure injection, concurrency, relaunch, query facts, component/a11y/import proof.

**Automated test plan**

- Pure unit: only running onboarding trial at/after five-minute deadline can complete; exact reward; no failed branch.
- Application/controller: deadline/foreground/startup share one command; fresh vs already-completed outcomes; post-commit event timing.
- SQLite integration: atomic happy path, unique receipt, conditional transition, rollback at each write boundary.
- Idempotency/concurrency: duplicate callbacks and two completers yield one completed row, one receipt, total +5/+1 once.
- Relaunch/recovery: overdue running reconciles; completed rehydrates without new event/reward; error retries safely.
- Presentation/navigation: no claim, committed values, automatic/result behavior per DEC-05-04, safe pending/error states.
- Accessibility: grouped reward label, large-text wrap, result heading/order, error announcement.
- Boundary/common regression: Pet feedback cannot mutate reward/session; screen imports no repository; RewardSummary/Home/Result regressions.
- Root gate: `pnpm run quality`, UI line-limit, schema unchanged, and deterministic clock tests.

**Manual test guide**

Preconditions: US-05-02 accepted, existing Development Build, a clean trial fixture. The accelerated fixture injects clock/lifecycle input while storing a genuine five-minute configuration and calling the production completion command.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_overdue_running pnpm start --clear
```

1. Cold launch an overdue running trial and wait for reconciliation.
2. Confirm the UI does not briefly claim reward before commit; then Result displays completed outcome and `+5 XP`, `+1 Coin` with no claim button.
3. Record session, reward receipt, and profile totals. Reopen Result, background/foreground repeatedly, then kill/relaunch.
4. Confirm the same Result and unchanged one receipt/total increment; no second reward animation is required in this story.
5. Use `trial_complete_race` to trigger two completion sources; verify exactly one visible result and reward.
6. Use `trial_reward_write_failure`; verify no partial completed row/profile/reward, a safe retry, and successful one-time result after retry.
7. Disable network and complete/reconcile; local transaction succeeds offline.
8. With screen reader/large text, confirm result and grouped reward are understandable. With Reduce Motion, the committed outcome remains fully clear.

Expected durable fact: completed onboarding-trial session + one reward receipt + profile increased by exactly 5/1. Expected Pet: base state in this story; the fresh event output exists but Pet integration is not yet acceptance. Expected XP/Coin: +5/+1 once. Expected navigation: deadline/reconcile→Result per DEC-05-04. Negative assertions: no claim, duplicate receipt, partial write, Standard history implication, failed status, or fake reward label.

Cleanup:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

Evidence to send: Git SHA; platform; device/simulator; OS; normal/race/failure/relaunch video/screenshots; before/after session/reward/profile facts; pass/fail. Device status stays pending until received.

**Minimum evidence:** atomic rollback and concurrency integration output, exact reward facts, Result/relaunch captures, offline/a11y record, no-schema-diff and line-count reports.

**Must not happen:** Partial completion; a screen-calculated reward; a second receipt/profile increment; completion before deadline; fresh event before commit or on hydration.

**Exit condition:** Owner can verify exactly-once committed Result and failure recovery; all P0 gates pass before Pet/handoff integration begins.

---

### US-05-04 — Pet Celebration and Explicit Home/Pet Room Handoff

**User story statement:** As a user who earned my first reward, I want Mèo Dev to acknowledge it and then enter my Pet Room so that the trial ends with a meaningful companion payoff.

**User-visible outcome:** A freshly committed trial completion triggers the accepted EPIC-04 celebration once. The CTA remains usable, persists onboarding completion, and opens production Home showing the committed `5 XP`/`1 Coin`. Relaunch/reopen does not replay celebration.

**Tangible output:** End-to-end Result celebration and `Vào Pet Room` handoff to production Home/Pet Room.

- **MVP Priority:** MUST
- **Dependency Priority:** P1
- **Dependencies:** US-05-03, EPIC-04 accepted controllers/assets, DEC-05-04.
- **Blocks:** US-05-05.
- **Product/technical gate:** Fresh-event semantics and explicit Continue persistence must preserve EPIC-04 arbitration/no-replay contract.
- **Current status:** `IMPLEMENTED — AWAITING OWNER ACCEPTANCE` tại `f1302b8`; final root quality
  `80/374` pass, formal tester deferred và US-05-05 vẫn gated.

**In scope**

- Production handoff of fresh committed terminal event to EPIC-04 controller.
- Accepted Cat celebration, ≤2s feedback/non-blocking CTA, reduced-motion/static fallback, no replay.
- Explicit Continue writes `onboarding_completed_at`, refreshes projection, and routes Home.
- Continue failure/retry and returning-user launch behavior.

**Out of scope**

- New animation/art, Pet progression/species/name, reward mutation by Pet, or generic event bus/provider.

**Fake remaining after this story:** Only the dev fixture/evidence harness remains review-only. The complete user path itself has no prototype state.

**Production foundation:** Composed trial-terminal→Pet feedback adapter and durable onboarding-completion/refresh handoff.

**Acceptance criteria**

- [ ] Only a fresh post-commit completion triggers EPIC-04 terminal feedback; hydrated/reopened Result uses base projection and does not replay.
- [ ] Celebration uses approved Cat assets/controller and never writes session, reward, or profile.
- [ ] CTA is available throughout or within the EPIC-04 ≤2s feedback contract and motion never blocks navigation.
- [ ] Reduce Motion/static fallback communicates the same success without animation.
- [ ] `Vào Pet Room` persists onboarding completion before routing; failure stays on truthful Result with retry.
- [ ] Home reads production projection and displays committed totals including exactly `5 XP`/`1 Coin`.
- [ ] Subsequent cold launch goes directly Home with no onboarding/result flash.
- [ ] Back/navigation behavior cannot create reward or replay celebration.

**Layer boundaries**

| Layer | Responsibility |
| --- | --- |
| Domain | No new Pet or reward rules. Preserve existing terminal-event identity semantics. |
| Application | Return fresh committed event; persist explicit onboarding completion; expose success/failure outcomes. |
| Infrastructure | Existing installation repository and transaction/read adapters; no Pet writes. |
| Presentation/composition | Feed event to EPIC-04 controller, render projection, invoke Continue, refresh/navigate after success. |

**UI reuse/component plan:** Reuse `PetStage`, `PetPortrait`, `PetVisualStatus`, `PetStatusText`, `RewardSummary`, `Button`, `Panel`, and production Home. No new celebration component and no copied sprite/animation. Result remains composition-only. If Continue busy/error needs inline feedback, reuse `InlineNotice`/`StatusSurface`.

**Component size/split estimate:** Result composition remains ≤220 after Pet integration; a narrow composition adapter ≤100; no Pet common file expands past 200. Existing EPIC-04 component/controller tests remain the primary visual-state boundary.

**Task breakdown by layer**

- Application/composition: connect the fresh completion output to existing terminal feedback; add explicit completion command/refresh sequence.
- Infrastructure: use current installation update and profile/Pet reads; confirm idempotent Continue/retry.
- Presentation: accepted Result hierarchy, non-blocking CTA, busy/error, Home handoff.
- Tests/evidence: fresh/reopen/relaunch, reduced motion, Continue failure/retry, Home totals, EPIC-04 regression.

**Automated test plan**

- Pure/application: fresh event once; hydrated completion none; onboarding completion write is idempotent.
- Controller: Pet arbitration consumes fresh committed event only and does not mutate durable reward/session.
- SQLite integration: Continue persists installation completion; retry is safe; reward/profile unchanged.
- Presentation/navigation: result hierarchy, celebration/CTA coexist, success→Home, failure stays Result, later launch→Home.
- Relaunch: no celebration replay and no onboarding flash; Home totals remain 5/1.
- Accessibility/reduced motion: status announced once, static success parity, CTA focus/target and large text.
- Boundary/common regression: EPIC-04 Pet suites, RewardSummary, Home, Button; no presentation repository imports.
- Root gate: `pnpm run quality`, UI ≤300, no new assets/schema/dependencies.

**Manual test guide**

Preconditions: US-05-03 accepted, existing Development Build, owner-approved EPIC-04 Cat assets. Use a fresh committed event fixture that travels through production composition.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=trial_completed_fresh pnpm start --clear
```

1. Enter Result immediately after a fresh committed completion; record Cat celebration, result hierarchy, reward, and CTA.
2. Tap `Vào Pet Room` during/after feedback; confirm it is not blocked, then Home shows Mèo Dev and total 5 XP/1 Coin.
3. Kill/relaunch; confirm direct Home without intro/result/celebration replay.
4. Review `trial_completed_reopen`; confirm committed Result/reward but base Pet state and no replay.
5. Review `trial_continue_failure`; tap Continue, confirm truthful Result/error and unchanged completion flag; retry and confirm one successful flag then Home.
6. Disable network and repeat Continue; local persistence/handoff succeeds.
7. Enable Reduce Motion and complete a fresh fixture; confirm static/status success and usable CTA. Use screen reader/large text to verify result→Pet→reward→CTA order and one meaningful status announcement.

Expected durable fact: Continue changes only onboarding completion timestamp/idempotent installation fact; session/reward/profile stay unchanged from US-05-03. Expected Pet: celebrate once for fresh commit, base state on reopen/relaunch. Expected XP/Coin: still exactly 5/1. Expected navigation: Result→Home after successful explicit Continue; later launch→Home. Negative assertions: no celebration before commit/replay, no blocked CTA, no Pet mutation of reward/session, no duplicate reward.

Cleanup:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

Evidence to send: Git SHA; platform; device/simulator; OS; fresh/reopen/relaunch/reduced-motion videos; Home screenshot; before/after installation/session/reward/profile facts; pass/fail. Owner evidence is required before platform acceptance.

**Minimum evidence:** fresh-vs-hydrated controller tests, Continue failure/idempotency integration proof, EPIC-04 regression output, Home/relaunch/reduced-motion captures, accessibility record.

**Must not happen:** Pet controller writes durable reward/session; celebration replays; Continue marks completion before its write succeeds; animation traps user; Home shows prototype totals.

**Exit condition:** Owner verifies accepted Pet feedback and durable Home handoff; G05-STORY-4 closes before final integrity/evidence story.

---

### US-05-05 — First-use Integrity, Exclusions, and Exit Evidence

**User story statement:** As a new or returning user, I want the complete first-use journey to remain correct across offline use, relaunch, accessibility settings, and later app surfaces so that my first reward never pollutes normal Focus behavior.

**User-visible outcome:** The full new-user journey is reviewable end to end; returning users consistently land Home with correct totals; interruption/error states recover without duplication or inaccessible feedback.

**Tangible output:** A production end-to-end review path and evidence pack prove the user outcome, while automated query/event checks prove trial exclusion without making logs/tests the visible product outcome.

- **MVP Priority:** MUST
- **Dependency Priority:** P1
- **Dependencies:** US-05-04, DEC-05-02, all prior gates.
- **Blocks:** EPIC-05 owner acceptance and EPIC-06 start gate.
- **Product/technical gate:** Analytics event semantics must be owner-approved; provider/vendor delivery remains out of scope.
- **Initial status:** `PROPOSED — OWNER REVIEW`.

**In scope**

- End-to-end regression and review fixture through production commands/projections.
- Standard history/contribution/cadence/store-review exclusions with real completed-trial data.
- Minimal typed onboarding analytics hook semantics per DEC-05-02; explicit separation from standard/core Focus events.
- Full offline/relaunch/failure/a11y/reduced-motion evidence and documentation closure.
- Boundary, common-component, duplication, and 300-line guardrails.

**Out of scope**

- PostHog/provider/network delivery, dashboards, production History UI, Standard Focus, new product telemetry, schema/native/dependency changes.

**Fake remaining after this story:** None in the production first-use route. Review fixtures remain dev-only and visibly/gate-separated; later-epic placeholder screens remain intentionally prototype.

**Production foundation:** Accepted onboarding vertical slice and stable boundary for EPIC-06 Standard Focus without sharing trial-only rules.

**Acceptance criteria**

- [ ] Fresh install completes Intro→Running→Result→Home with durable recovery and exact reward.
- [ ] Trial is absent from standard history, contribution, Long Break cadence, store-review eligibility, and standard/core Focus event stream.
- [ ] Onboarding event hooks follow DEC-05-02 and are idempotent at their durable milestones; no provider is added.
- [ ] Duplicate complete/reconcile/result reopen/relaunch/Continue never duplicate reward, completion, event milestone, or celebration.
- [ ] Offline and injected storage failures recover truthfully without partial facts.
- [ ] Screen reader, large text, contrast/status semantics, touch targets, and Reduce Motion meet existing contracts.
- [ ] No production screen imports repository/SQL/prototype authority; no duplicated common primitive or UI/source >300 lines.
- [ ] No naming/species/selector/Strict/Standard Focus/EPIC-08/09/11 behavior enters the slice.
- [ ] Root quality gate and documented evidence inventory pass; device/platform checks remain pending until owner supplies evidence.

**Layer boundaries**

| Layer | Responsibility |
| --- | --- |
| Domain/Application | Preserve trial invariants and typed semantic events; no provider or presentation concern. |
| Infrastructure | Verify queries/transactions against real SQLite trial rows; local operation remains offline-first. |
| Presentation/composition | One production flow and finite dev fixture gate; no debug/log output as outcome. |
| Evidence | Map automated and owner manual results to every Epic criterion without marking unrun checks. |

**UI reuse/component plan:** No new product component is expected. Reuse the completed Intro/Countdown/Result/Pet/Home composition. Any issue must be fixed at its owning common component with regression tests for all consumers; do not fork a trial-only copy. Review fixture controls remain outside production routes.

**Component size/split estimate:** No UI file may cross 300; final report targets all ≤240 where practical. If a file nears the threshold, split only a cohesive child/view model with explicit props and independent tests. Final static audit records lines, ownership, and duplicates.

**Task breakdown by layer**

- Domain/application: wire owner-approved typed onboarding milestones and standard/core-event exclusion.
- Infrastructure: seed a real completed trial and exercise every exclusion query plus rollback/offline paths.
- Presentation/composition: final fixture isolation, accessibility/reduced-motion/error polish, no prototype leakage.
- Tests/evidence: end-to-end navigation, recovery/race matrix, boundary/line/duplicate audit, owner guide and exit report inputs.

**Automated test plan**

- Pure unit: locked trial invariants and event classification; no standard/core Focus event for onboarding trial.
- Application/controller: complete journey, milestone idempotency, Pet read-only boundary, all failure result mappings.
- SQLite integration: real trial excluded from history/contribution/cadence/review queries; exactly one reward/profile increment/completion timestamp.
- Navigation/flow: fresh→Intro→Running→Result→Home; returning→Home; cancel→Intro; overdue→Result.
- Idempotency/concurrency/relaunch: combined duplicate sources and cold starts preserve one terminal outcome/reward/celebration/milestone.
- Offline/error: full local flow offline; failure injection at start, complete/reward, Continue reads/writes.
- Presentation/a11y: no forbidden controls, hierarchy/copy, screen reader, large text, touch targets, Reduce Motion/static parity.
- Boundary/import/common regression: screens have no repository/SQL/prototype imports; common consumers pass; no duplicate primitives; UI source ≤300.
- Root gate: `pnpm run quality`; record exact Node/pnpm, Git SHA, test counts, and any known transferred native/device gate.

**Manual test guide**

Preconditions: US-05-01…04 accepted, decisions closed, compatible Development Build, clean review database. Run the fixture once for deterministic setup, then repeat the normal production route without fixture.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node -v
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=epic_05_fresh_end_to_end pnpm start --clear
```

1. Cold launch as new user; verify Intro and start the trial.
2. Verify fixed Relax countdown, background/foreground, and cold relaunch recovery.
3. Reach the deadline using the fixture clock; observe committed Result, one Cat celebration, 5 XP/1 Coin, and no claim.
4. Reopen/relaunch Result before Continue; verify no replay/duplicate. Continue and verify Home totals; relaunch again and verify direct Home.
5. Run a separate cancellation path; confirm Intro return, no reward, no onboarding completion.
6. With `epic_05_exclusion_seed`, inspect the available production/review surfaces that can safely demonstrate no Standard history/cadence/review eligibility; rely on attached automated query facts for non-visible surfaces, not a JSON/log as the product outcome.
7. Disable network for the whole path. Inject start/completion/Continue failures one at a time and verify recovery/rollback.
8. Repeat the visible journey with screen reader, large text, and Reduce Motion; verify reading order, labels, touch targets, non-color status, static Pet feedback, and unblocked CTA.
9. Remove the fixture, clear review data by the documented fixture cleanup action, and cold launch the normal development route to confirm fixtures do not leak.

Expected durable fact: one completed onboarding trial, one reward receipt, profile +5/+1, onboarding completion only after Continue; exclusions return no standard contribution. Expected Pet: one fresh celebration, base on hydration. Expected XP/Coin: exactly 5/1. Expected navigation: canonical flow and returning Home. Negative assertions: no duplicate/fake reward, trial in standard surfaces/events, provider network dependency, naming/species/Strict/Standard controls, or prototype badge.

Cleanup:

```sh
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
pnpm start --clear
```

Evidence to send: Git SHA; platform; device/simulator; OS; complete/cancel/relaunch/offline/reduced-motion videos or screenshots; before/after installation/session/reward/profile plus exclusion facts; automated gate output; pass/fail per case. Never mark untested platform/device as passed.

**Minimum evidence:** root-quality output, end-to-end capture, exclusion integration results, race/relaunch/offline/failure evidence, a11y/reduced-motion record, fixture isolation, no-schema/dependency/native diff, component line/import/duplication report.

**Must not happen:** Tests/logs become the only visible output; trial leaks into standard queries/events; analytics provider is added; fixture changes production behavior; any acceptance is checked without evidence.

**Exit condition:** All story/Epic DoD items have evidence, owner completes manual review and explicitly accepts EPIC-05; only then may MVP planning open EPIC-06.

## 12. Automated test matrix

| Required behavior | US01 | US02 | US03 | US04 | US05 |
| --- | :---: | :---: | :---: | :---: | :---: |
| Durable launch routing | Primary | Regression | Recovery | Returning | E2E |
| Fixed 5m / Relax / null tag / no Strict | Absence UI | Primary | Regression | Regression | E2E |
| Exactly-once start | — | Primary | Regression | — | Race |
| Exactly-once completion/reward 5/1 | — | Pending-safe | Primary | Regression | E2E/race |
| Atomic rollback | — | Start/cancel | Primary | Continue | Combined |
| Relaunch/background/offline | Routing | Primary | Primary | No replay | Full journey |
| Committed Result | Route | — | Primary | Regression | E2E |
| Pet feedback read-only/no replay | Base only | Cancel negative | Event output | Primary | E2E |
| Standard exclusions | Route negative | Invariant | Fixture facts | Regression | Primary query integration |
| Analytics classification | — | No core event | Candidate milestone | Candidate milestone | Primary after DEC-05-02 |
| Error/recovery | Read | Start/cancel | Complete/reward | Continue | Combined |
| Accessibility/reduced motion | Intro | Timer/dialog | Result/reward | Celebration/CTA | Full journey |
| Import/common/≤300 guards | Primary | Regression | Regression | Regression | Final static audit |

## 13. Manual evidence matrix

No box below is checked by planning. Owner/device evidence is required.

| Evidence case | Story | Git SHA | Platform/device/OS | Capture | Durable before/after | Result |
| --- | --- | --- | --- | --- | --- | --- |
| New/returning/recovery launch | US-05-01 | `f2efd62` | iOS / iPhone 14 Plus Simulator / OS not supplied | New + cancelled screenshots; owner reports full guide pass | Owner reports unchanged; raw dump not supplied | PASS — OWNER ACCEPTED |
| Start/double tap/background/relaunch/cancel/offline | US-05-02 | `ef05b207` | DEFERRED — formal tester phase | DEFERRED | Automated SQLite facts accepted; manual facts deferred | OWNER ACCEPTED — FORMAL TEST DEFERRED |
| Deadline/race/rollback/reopen/relaunch reward | US-05-03 | `a66d8a9e` | Not supplied; formal tester deferred | Owner reports quick smoke done; captures not supplied | Automated real SQLite facts pass; raw manual facts deferred | PASS — OWNER ACCEPTED QUICK SMOKE; FORMAL TESTER DEFERRED |
| Fresh/reopen celebration/Continue/Home/Reduce Motion | US-05-04 | `f1302b8` | DEFERRED — formal tester phase | DEFERRED | Automated fresh/reopen/failure, SQLite handoff and 80/374 root quality pass | IMPLEMENTED — OWNER ACCEPTANCE PENDING; TESTER DEFERRED |
| Full journey/exclusions/failures/a11y | US-05-05 | [ ] | [ ] | [ ] | [ ] | [ ] |

Every evidence record must state pass/fail per step and must not use an automated simulator result as a substitute for owner device acceptance.

## 14. Common component reuse matrix

| Component | US01 | US02 | US03 | US04 | US05 | Migration/regression owner |
| --- | --- | --- | --- | --- | --- | --- |
| ScreenShell/Header/SectionLabel | Reuse | Reuse | Reuse | Reuse | Audit | Common presentation tests |
| Panel/Button | Reuse | Reuse | Reuse | Reuse | Audit | Existing consumers + trial screens |
| ConfirmationDialog | — | Reuse cancel | — | — | Audit | Focus dialog tests |
| PetStage/Portrait/Status | Intro/base | Base | Base/event output | Fresh feedback | E2E | EPIC-04 regression suite |
| StatusSurface/InlineNotice | Launch recovery | Command recovery | Transaction recovery | Continue recovery | Combined | Common state tests |
| StatDisplay | — | — | Reward child if useful | Home | E2E | Home + Result |
| RewardSummary (new common) | — | — | Create/migrate | Reuse | Audit | Trial Result; EPIC-06 future consumer |
| TrialCountdown (feature-local) | — | Create | Reuse | — | Audit | Trial only; revisit, do not pre-generalize |
| PrototypeControls | Never production | Dev-only isolation | Dev-only isolation | Dev-only isolation | Remove/leak audit | Prototype/review owner |

## 15. Definition of Ready

A story may move from `PROPOSED — OWNER REVIEW` to `READY` only when:

- [ ] Owner has approved this document, authoritative order, and decisions that gate the story.
- [ ] Previous story exit condition is closed; no other EPIC-05 story is active.
- [ ] User-visible output, in/out scope, fake remaining, and evidence expectations are understood.
- [ ] Relevant production/prototype boundaries and component migration are named.
- [ ] Required repository/application APIs are confirmed against baseline; any schema gap is raised, not silently changed.
- [ ] Automated tests and owner manual fixture are feasible without new dependency/native work.
- [ ] Expected file ownership/splits keep every UI source below 300 lines.

## 16. Story Definition of Done

No item is pre-accepted by this planning pass.

- [ ] User-visible outcome and tangible output work through production commands/projections.
- [ ] All acceptance criteria and automated tests for the story pass.
- [ ] `pnpm run quality` passes on the recorded Git SHA.
- [ ] Error, offline, relaunch/background, a11y, and reduced-motion cases relevant to the story are evidenced.
- [ ] Manual guide was run; platform/device/OS and pass/fail evidence are recorded by owner/reviewer.
- [ ] Durable before/after facts match expectations and contain no partial/duplicate writes.
- [ ] Common components are reused; migrations/regressions pass; screens remain composition-only.
- [ ] No UI source exceeds 300 lines and no speculative/duplicate abstraction was added.
- [ ] No schema/migration/dependency/native artifact or later-epic scope was introduced without a separately approved gate.
- [ ] Story report records remaining fake explicitly and closes its exit condition before the next story starts.

## 17. Epic Definition of Done

- [ ] A new user completes the approved Intro→5-minute Relax trial→committed Result→Home/Pet Room journey.
- [ ] Trial is always `onboarding_trial`, 5 minutes, Relax, null tag, with no selectors/Strict failure.
- [ ] Completion, reward receipt, and profile update are automatic, atomic, idempotent, and exactly 5 XP/1 Coin.
- [ ] Relaunch/background/startup recovery uses durable facts and produces no duplicate reward/event/celebration.
- [ ] EPIC-04 Cat celebration consumes only a fresh committed event and never mutates session/reward.
- [ ] Explicit Continue persists onboarding completion; Home and later launch show correct committed state.
- [ ] Trial is excluded from standard history/contribution/cadence/store-review/core Focus analytics.
- [ ] Offline/error/a11y/reduced-motion paths and all common-component/boundary/size regressions pass.
- [ ] No naming/species/selector/Standard Focus/later analytics provider or unapproved schema/native/dependency scope exists.
- [ ] All five stories, automated gates, manual evidence, and owner confirmation are accepted.
- [ ] EPIC-05 exit report/MVP status is updated only in the future closure pass, not in this planning pass.

## 18. Risk and decision register

### 18.1 Owner-approved decisions

#### DEC-05-01 — Is onboarding trial mandatory or skippable?

**Owner decision — 2026-08-31:** Option 1 approved. Onboarding trial is mandatory and has no Skip action.

- **Blocks:** US-05-01 and final launch semantics.
- **Options:**
  1. **Mandatory, no Skip (recommended):** matches the approved prototype and ensures the defined first-use outcome.
  2. Skip directly to Home, no reward: requires completion semantics/copy and weakens the guaranteed trial outcome.
  3. Show a disabled/deferred Skip affordance: adds confusing UI without a supported path.
- **Recommendation/confidence:** Option 1, high confidence.
- **Product impact:** Preserves the locked outcome; Option 2 creates a second onboarding outcome.
- **UX impact:** Simplest, one clear CTA; the cost is no bypass.
- **Implementation cost/complexity:** Option 1 low; Option 2 medium due to routing, flag, event, and empty-progress semantics; Option 3 low code but poor UX.
- **Schema/migration impact:** None expected for Option 1. Option 2 may reuse completion timestamp but changes its meaning; authority clarification required, not a schema-first decision.
- **Test impact:** Option 1 one canonical path; Option 2 adds skip/relaunch/no-reward matrices.

#### DEC-05-02 — When is `onboarding_completed` semantically emitted?

**Owner decision — 2026-08-31:** Option 1 approved. `onboarding_started` follows the committed Start milestone; `onboarding_completed` follows committed explicit Continue.

- **Blocks:** US-05-05 analytics contract only; no provider work.
- **Options:**
  1. **`onboarding_started` after Start session commit; `onboarding_completed` after explicit Continue persists `onboarding_completed_at` (recommended).**
  2. Emit completed when reward transaction commits.
  3. Emit completed when Result is first viewed.
- **Recommendation/confidence:** Option 1, high confidence.
- **Product impact:** Aligns telemetry with durable journey milestones and the approved data-needs map.
- **UX impact:** None visible; correctly distinguishes reward earned from onboarding exited.
- **Implementation cost/complexity:** All options low for typed hooks; Option 1 has the clearest idempotency key/fact.
- **Schema/migration impact:** None; use existing committed identities/timestamp. No analytics provider added.
- **Test impact:** Option 1 tests event after commit, retry/relaunch idempotency, and exclusion from core Focus events.

#### DEC-05-03 — Where does a cancelled trial go?

**Owner decision — 2026-08-31:** Option 1 approved. A committed cancellation returns to Intro without reward.

- **Blocks:** US-05-01 route table and US-05-02 cancellation.
- **Options:**
  1. **Commit cancelled and return to Intro with retry CTA (recommended):** matches approved EPIC-03 flow.
  2. Stay on a Cancelled Result with explicit Retry/Intro choices.
  3. Allow Home bypass after cancellation.
- **Recommendation/confidence:** Option 1, high confidence.
- **Product impact:** Keeps the first-use outcome mandatory and cancellation reward-free.
- **UX impact:** Clear recovery. It also fixes the prototype mismatch where `Về giới thiệu` currently invokes the retry action.
- **Implementation cost/complexity:** Option 1 low; Option 2 medium presentation/state; Option 3 medium and conflicts with DEC-05-01 outcome.
- **Schema/migration impact:** None; `cancelled` already exists.
- **Test impact:** Option 1 requires cancel→intro/no reward/relaunch intro; alternatives add branches.

#### DEC-05-04 — What happens at the five-minute deadline?

**Owner decision — 2026-08-31:** Option 1 approved. The app commits automatically and navigates to Result only after durable success.

- **Blocks:** US-05-03 transition/navigation and US-05-04 result handoff.
- **Options:**
  1. **Automatically commit then navigate to Result (recommended):** no claim/finish action; errors remain recoverable on Running/pending.
  2. Commit automatically but require an `Xong` CTA to open Result.
  3. Wait until foreground/relaunch to resolve/navigate even while app is active.
- **Recommendation/confidence:** Option 1, high confidence.
- **Product impact:** Best matches automatic reward and a short guided trial.
- **UX impact:** Immediate payoff; navigation happens only after durable success. Option 2 adds unnecessary friction; Option 3 feels broken while active.
- **Implementation cost/complexity:** Option 1 medium due to lifecycle/race handling; Option 2 medium plus state/UI; Option 3 lower active scheduling but poor UX and still needs reconciliation.
- **Schema/migration impact:** None.
- **Test impact:** Option 1 requires deadline/foreground/startup race tests and commit-before-navigation proof.

### 18.2 Non-decision acknowledgements

- `OPEN-009` remains unresolved and does **not** block EPIC-05 because the approved journey uses Cat/Mèo Dev without a naming field.
- Existing schema appears sufficient. This planning document does not authorize migration; a discovered gap must become a separate owner proposal.
- Trial-specific behavior must not be generalized into Standard Focus until EPIC-06.

### 18.3 Delivery risks

| Risk | Likelihood / impact | Mitigation / owner |
| --- | --- | --- |
| Multiple lifecycle sources complete concurrently | Medium / critical | One conditional transactional command; unique receipt; deterministic race tests. Application/infrastructure owner. |
| Celebration fires before commit or replays after hydration | Medium / high | Fresh-event result type, post-commit composition handoff, EPIC-04 arbitration regressions. |
| Prototype state leaks into production route | Medium / high | Import boundary tests, dev-only fixture gate, no PrototypeProvider authority. |
| Countdown drifts/resets | Medium / high | Timestamp + injected clock projection; foreground/relaunch tests; no decrement truth. |
| Partial Continue leaves wrong route | Low / high | Persist-before-navigation, safe retry, launch projection from durable fact. |
| Common UI forks or exceeds size limit | Medium / medium | Reuse matrix, 240-line review threshold, ≤300 hard gate, consumer regressions. |
| Trial pollutes later metrics | Medium / high | Existing standard-only filters plus real SQLite trial regression and typed event classification. |
| Review fixture becomes production backdoor | Low / high | Build/dev gating, production-route absence test, fixture isolation evidence. |

## 19. Owner confirmation checklist

One-pass review requested. No implementation starts until these are answered.

- [ ] Approve five-story decomposition and exact solo execution order.
- [ ] Approve EPIC-05 scope/out-of-scope, especially no naming/selector/Standard Focus/provider work.
- [x] DEC-05-01: Option 1 approved on 2026-08-31 (mandatory, no Skip).
- [x] DEC-05-02: Option 1 approved on 2026-08-31 (analytics completion after explicit Continue commit).
- [x] DEC-05-03: Option 1 approved on 2026-08-31 (cancel→Intro).
- [x] DEC-05-04: Option 1 approved on 2026-08-31 (automatic commit then Result).
- [ ] Confirm `OPEN-009` stays open and Cat/Mèo Dev default is sufficient.
- [ ] Approve UI reuse/generalization plan: common `RewardSummary`, feature-local `TrialCountdown`, no speculative input/icon/status abstractions.
- [ ] Approve manual fixture strategy using the existing Development Build and pinned Node path.
- [x] `US-05-01` authorized to move to `READY` through approval of `US0501-CONFIRM-01`…`06` on 2026-08-31; remaining Epic-wide confirmations stay open for their owning Story/exit gate.
- [x] `US-05-01` closed `DONE_OWNER_ACCEPTED` at `f2efd62` on 2026-08-31.
- [x] `US-05-02_IMPLEMENTATION_PLAN.md` confirmations `US0502-CONFIRM-01`…`07` approved 2026-08-31; implementation opened at `9a51974`.
- [x] `US-05-02` closed `DONE_OWNER_ACCEPTED` at `ef05b207` on 2026-08-31; Development Build/formal tester matrix explicitly deferred to a later phase without manual-pass claim.
- [x] `US-05-03_IMPLEMENTATION_PLAN.md` confirmations `US0503-CONFIRM-01`…`08` approved 2026-08-31; implementation opened at `657c25e`.
- [x] `US-05-03` implementation committed at `a66d8a9e`; root 77 files/358 tests and real SQLite race/rollback/reopen gates pass; formal tester deferred.
- [x] Owner closed US-05-03 on `a66d8a9e` after quick smoke; formal tester remains deferred; only US-05-04 planning opens.
- [x] `US-05-04_IMPLEMENTATION_PLAN.md` confirmations `US0504-CONFIRM-01`…`08` approved; implementation opened at `8c66dd5`.
- [x] `US-05-04` implementation committed at `f1302b8`; root 80 files/374 tests, SQLite handoff, fresh/reopen/failure and scope gates pass; formal tester deferred.
- [ ] Owner acceptance must close US-05-04 on `f1302b8` before US-05-05 planning/production opens.

## 20. Change log

| Version | Date | Author | Change |
| --- | --- | --- | --- |
| 0.13.0 | 2026-08-31 | Codex | Recorded US-05-04 implementation at f1302b8 and automated/SQLite evidence; Story awaits owner acceptance, formal tester remains deferred, US-05-05 stays gated. |
| 0.12.0 | 2026-08-31 | Codex, recording owner approval | Recorded US0504-CONFIRM-01…08 approval and opened US-05-04 implementation at exact SHA 8c66dd5; US-05-05 remains gated. |
| 0.11.0 | 2026-08-31 | Codex, recording owner acceptance | Closed US-05-03 at a66d8a9e after owner-reported quick smoke, retained formal tester evidence as deferred, and opened only US-05-04 plan review. |
| 0.10.0 | 2026-08-31 | Codex | Recorded US-05-03 implementation at a66d8a9e and automated/SQLite evidence; Story awaits owner acceptance, formal tester remains deferred, US-05-04 stays gated. |
| 0.9.0 | 2026-08-31 | Codex, recording owner approval | Recorded US0503-CONFIRM-01…08 approval and opened US-05-03 implementation at 657c25e; US-05-04 remains gated. |
| 0.8.0 | 2026-08-31 | Codex, recording owner acceptance | Closed US-05-02 at ef05b207 with formal tester evidence deferred and opened only US-05-03 implementation-plan review. |
| 0.7.0 | 2026-08-31 | Codex | Recorded US-05-02 host implementation and automated gates; Story remains awaiting owner Development Build evidence and final commit SHA. |
| 0.6.0 | 2026-08-31 | Codex, recording owner approval | Recorded US0502-CONFIRM-01…07 approval and moved US-05-02 implementation to IN PROGRESS at 9a51974. |
| 0.5.0 | 2026-08-31 | Codex, recording owner acceptance | Closed US-05-01 at f2efd62 with owner manual acceptance and opened US-05-02 implementation-plan review; US-05-02 production remains gated. |
| 0.4.0 | 2026-08-31 | Codex | Recorded US-05-01 host implementation and automated quality pass; kept Story/next gate open pending owner manual Development Build evidence. |
| 0.3.0 | 2026-08-31 | Codex, recording owner approval | Recorded approval of the US-05-01 implementation plan and technical confirmations; moved only US-05-01 to READY. No implementation started. |
| 0.2.0 | 2026-08-31 | Codex, recording owner decision | Recorded approval of DEC-05-01 through DEC-05-04, opened US-05-01 implementation-plan review, and kept production implementation gated. |
| 0.1.0 | 2026-08-31 | Codex, for owner review | Verified EPIC-04 baseline; audited authority/code/UI/data/tests; proposed five vertical stories, execution order, evidence plans, reuse strategy, and four owner decisions. No production implementation. |
