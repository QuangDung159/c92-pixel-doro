---
document_id: PIXELDORO_EPIC_05_EXIT_REPORT
title: PixelDoro EPIC-05 — First-use Onboarding Trial Exit Report
version: 0.2.0
status: AWAITING_EPIC_CLOSE_AUTHORIZATION
date: 2026-09-03
owner: Dũng Lư
branch: feats/epic-05
candidate_sha: 580f559016e192b95d3d286a61d161b3af460a1d
formal_tester_status: DEFERRED_TO_LATER_PHASE
us_05_05_status: DONE_OWNER_ACCEPTED
quick_smoke_status: OWNER_REPORTED_PASS
language: vi
---

# EPIC-05 Exit Report — Owner-gated Candidate

## 1. Exit candidate

EPIC-05 có implementation candidate tại exact behavior SHA
`580f559016e192b95d3d286a61d161b3af460a1d`. Automated evidence cho toàn bộ production first-use
slice đã pass và owner đã chấp nhận US-05-05 sau quick UI test ngày 2026-09-03. Report này vẫn
`AWAITING_EPIC_CLOSE_AUTHORIZATION` vì chưa có lệnh đóng Epic/MVP hoặc mở EPIC-06.

Không checkbox nào trong `MVP_EPICS.md` được đóng bởi draft này. EPIC-06 vẫn khóa cho tới khi owner
ủy quyền đóng EPIC-05/MVP và mở next-Epic gate; formal tester/device matrix tiếp tục deferred và
không được suy ra từ automated simulator/host tests.

## 2. Story inventory

| Story | Accepted/implementation SHA | Recorded state |
| --- | --- | --- |
| US-05-01 | `f2efd62` | DONE_OWNER_ACCEPTED |
| US-05-02 | `ef05b207` | DONE_OWNER_ACCEPTED; formal tester deferred |
| US-05-03 | `a66d8a9e` | DONE_OWNER_ACCEPTED; quick smoke, tester deferred |
| US-05-04 | `f1302b8` | DONE_OWNER_ACCEPTED; quick UI smoke, tester deferred |
| US-05-05 | `580f559` | DONE_OWNER_ACCEPTED; quick UI smoke, tester deferred |

## 3. Candidate exit evidence

- Fresh Intro→Running→Result→Home is backed by production commands and durable SQLite facts.
- Trial invariant remains fixed `5m / relax / null tag / no Strict`, with exact reward `5 XP / 1 Coin`.
- Duplicate/race/reopen/relaunch paths preserve one session resolution, receipt, profile increment,
  installation completion timestamp and analytics milestone per type.
- Trial remains absent from Standard history, contribution, Long Break cadence and store-review facts.
- Trial emits only `onboarding_started`/`onboarding_completed`, exact `{}` properties, local queue
  only; opt-out/failure cannot block the core journey.
- Pet fresh feedback/no-replay, accessibility, large-text-compatible primitives, Reduced Motion and
  recovery regressions are retained.
- Production trial routes contain no prototype authority call; finite fixtures are default-absent.
- Final quality: `82` files / `391` tests, device harness, boundaries, repository hygiene,
  typecheck/lint and diff check pass.

## 4. Scope and deferred truth

No schema/migration/index/dependency/native/provider/EPIC-06 behavior changed. No PostHog delivery,
Settings opt-out UI, Standard Focus, History UI, store-review prompt or later-Epic functionality was
opened.

Formal tester still needs exact platform/device/OS/app identity and captures for full fresh,
relaunch, offline, failure, screen-reader, large-text and Reduce Motion matrix. Guide:
`apps/mobile/test/device/epic-05-exit-smoke.md`.

## 5. Owner decision gate

- [x] All five Story implementations have exact recorded SHAs.
- [x] US-05-05 automated exit evidence and scope audit pass.
- [x] Deferred tester limitation is explicit.
- [x] Owner accepts US-05-05 exact SHA `580f559016e192b95d3d286a61d161b3af460a1d`
  after owner-reported quick UI test on 2026-09-03.
- [ ] Owner authorizes EPIC-05 close/MVP checklist update and next-Epic gate.

Until the pending Epic close authorization is resolved, authoritative state remains
`US_05_05_DONE_OWNER_ACCEPTED_EPIC_EXIT_PENDING`.

## 6. Change log

| Version | Date | Author | Change |
| --- | --- | --- | --- |
| 0.2.0 | 2026-09-03 | Codex, recording owner acceptance | Recorded US-05-05 quick UI test done and exact-SHA acceptance; formal tester remains deferred and explicit EPIC-05/MVP close authorization is still pending. |
| 0.1.0 | 2026-09-01 | Codex | Created owner-gated EPIC-05 exit candidate bound to 580f559; automated evidence passes, formal tester remains deferred, Epic/MVP/EPIC-06 status stays open/locked. |
