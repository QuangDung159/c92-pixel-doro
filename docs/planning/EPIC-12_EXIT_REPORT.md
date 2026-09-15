---
document_id: PIXELDORO_EPIC_12_EXIT_REPORT
title: PixelDoro EPIC-12 — Product-scope Exit Report
version: 1.0.0
status: DONE_OWNER_ACCEPTED_PRODUCT_SCOPE
date: 2026-09-15
owner: Dũng Lư
closure_scope: PRODUCT_CORE_ONLY
product_scope_status: DONE_OWNER_ACCEPTED
closed_beta_status: NOT_CLAIMED
release_validation_status: DEFERRED
user_stories: ./EPIC-12_USER_STORIES.md
implementation_report: ./EPIC-12_IMPLEMENTATION_REPORT.md
release_validation_guide: ../../apps/mobile/test/device/epic-12-beta-readiness.md
---

# EPIC-12 product-scope exit report

## 1. Closure verdict

Owner explicitly directed: `Đóng EPIC-12 theo product scope` on 2026-09-15.

EPIC-12 is therefore closed as `DONE_OWNER_ACCEPTED_PRODUCT_SCOPE`. This closure means the Mobile MVP
core feature set is implemented and no additional product feature is required inside EPIC-12. It does
not mean `CLOSED_BETA_READY`, public-launch ready, or that unexecuted device/release rows passed.

## 2. Delivered product scope

The accepted Mobile MVP contains:

- onboarding trial and durable handoff;
- Relax/Strict Focus lifecycle, completion/cancel and reward;
- explicit Break and cadence behavior;
- XP/Coin progression, Shop purchase, inventory/equip and Pet Room;
- History and contribution projection;
- Pet rendering, animation and layered fallback;
- sound, haptic, notification preference, analytics opt-out and confirmed reset;
- feedback UI/failure handling and store-review eligibility policy;
- offline-first local data, recovery and idempotency boundaries.

EPIC-12 product hardening retired the obsolete prototype production graph, split the oversized mobile
provider by responsibility, aligned the approved Expo SDK patches, retained schema `001`, and added
repository/build-source safeguards. No new core feature remains planned.

## 3. Automated evidence

- Full root quality passes: `220` test files and `1,109` tests.
- TypeScript, lint, architecture boundaries, device-guide validation and repository hygiene pass.
- Online Expo Doctor previously passed `21/21` after the approved SDK patch alignment.
- No new migration, schema mutation, provider key or persisted feedback content was introduced.

Automated evidence supports product implementation and hardening. It does not replace physical-device,
assistive-technology, store-install, OTA or rollback evidence.

## 4. Release validation explicitly deferred

The following items move to a separate release-validation track and are not blockers for this
product-scope closure:

- same-SHA iOS/Android aggregate durability run;
- minimum and representative physical-device matrix;
- background/foreground, kill/relaunch, offline and native permission breadth;
- VoiceOver, TalkBack, Largest Text, contrast and Reduce Motion evidence;
- 30-minute Pet performance/thermal benchmark;
- preview/runtime/OTA compatibility and rollback rehearsal;
- exact TestFlight group and Google Play internal/closed track evidence;
- tester install/launch, release notes, support handoff and closed-beta go/no-go.

All corresponding rows remain `NOT_RUN`, `BLOCKED` or `FAIL` as recorded. None is converted to PASS by
this scope decision.

## 5. First store-build record

Owner reported the first App Store and Play Store uploads complete. EAS metadata confirms finished store
builds, but Android and latest iOS report different Git SHAs and include config that was not committed at
the reported SHA. These artifacts are useful operational setup evidence only and are not accepted as
same-SHA EPIC-12 release evidence. They do not invalidate the product-feature closure.

## 6. Follow-up policy

- Product bugs discovered later are tracked as separate bugs; a P0/P1 product regression may trigger a
  narrowly scoped follow-up but does not silently rewrite this closure.
- Closed-beta readiness requires a separately approved candidate and completion of the deferred release
  matrix. It must never be inferred from this report.
- PostHog activation and a live feedback endpoint remain optional/external decisions, not core-feature
  completion blockers.

## 7. Final owner state

| Scope | Final state |
|---|---|
| Mobile MVP product/core features | `FEATURE_COMPLETE` |
| EPIC-12 product scope | `DONE_OWNER_ACCEPTED_PRODUCT_SCOPE` |
| Physical-device/accessibility/performance validation | `DEFERRED_TO_RELEASE_VALIDATION` |
| Store install/distribution/rollback evidence | `DEFERRED_TO_RELEASE_VALIDATION` |
| Closed beta | `NOT_CLAIMED / NOT_CLOSED_BETA_READY` |

