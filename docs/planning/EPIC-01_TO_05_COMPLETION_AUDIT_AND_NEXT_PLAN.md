---
document_id: PIXELDORO_EPIC_01_TO_05_COMPLETION_AUDIT_AND_NEXT_PLAN
title: PixelDoro — EPIC-01 to EPIC-05 Completion Audit and Next Plan
version: 1.0.0
status: COMPLETE_EPIC_06_PLANNING_READY
date: 2026-09-03
owner: Dũng Lư
branch: feats/epic-05
audit_baseline_sha: 031fdb57b3ecafe5cf590b5db571c925f595e232
epic_05_behavior_sha: 580f559016e192b95d3d286a61d161b3af460a1d
audited_document_count_before_report: 55
formal_tester_status: DEFERRED_TO_LATER_PHASE_WHERE_RECORDED
language: vi
authority: PLANNING
master_plan: ./MVP_EPICS.md
product_truth: ../PIXELDORO_CORE_TRUTH.md
epic_05_exit: ./EPIC-05_EXIT_REPORT.md
---

# EPIC-01 đến EPIC-05 — Completion Audit và Next Plan

## 1. Kết luận

Toàn bộ `55` tài liệu có sẵn dưới `docs/` trước report này đã được inventory theo authority,
status, checklist, decision gate và evidence link. Năm Epic đầu tiên hiện được đồng bộ là
`DONE_OWNER_ACCEPTED`:

| Epic | Final state | Evidence chính | Limitation còn giữ |
|---|---|---|---|
| EPIC-01 | `DONE_OWNER_ACCEPTED` | Workspace/build/route smoke/EAS foundation | Preview/production OTA vẫn là release gate |
| EPIC-02 | `DONE_OWNER_ACCEPTED` | SQLite/bootstrap/recovery/reset + revised owner exit | Final same-SHA iOS/Android aggregate thuộc EPIC-12 |
| EPIC-03 | `DONE_OWNER_ACCEPTED`; UX `UX_APPROVED` | Clickable primary flow + data-needs map | Prototype không phải production truth ngoài slice đã thay |
| EPIC-04 | `DONE_OWNER_ACCEPTED` | Pet/Home, Cat Dev assets, device/performance acceptance | Không Pet naming/selector/multiple Pet |
| EPIC-05 | `DONE_OWNER_ACCEPTED` | SHA `580f559`, root `82/391`, SQLite exclusions, quick UI smoke | Formal tester/device matrix deferred |

Master plan chỉ mở `EPIC-06_PLANNING_READY`. Standard Focus production implementation chưa bắt đầu;
Mobile MVP và closed beta chưa hoàn tất.

## 2. Tài liệu đã audit

- Product authority: Product Core.
- Master planning: MVP Epic breakdown, Epic 01–05 Story/UX/exit/evidence records và toàn bộ Story
  plan/report hiện có.
- Architecture: Technical Overview, System Architecture, Project Structure, Data Model và ADR-001
  đến ADR-008.
- Specifications: Timer Engine, Session Lifecycle, Pet State Machine, Gamification Rules.
- Governance/runbook: Technical Documentation Checklist và EPIC-01 delivery runbook.

Normative architecture/specification content không bị rewrite vì không có decision mới. Audit chỉ
đồng bộ trạng thái/checklist/evidence và ghi next planning gate.

## 3. Consistency fixes đã áp dụng

1. EPIC-01 planning/evidence metadata từ `APPROVED`/stale `IN_PROGRESS` sang completed owner state.
2. EPIC-02 `DONE`/`COMPLETE` được normalized thành owner-accepted nhưng giữ nguyên revised exit và
   EPIC-12 aggregate limitation.
3. Plan `US-02-01` được chuyển từ planning-only `APPROVED` sang `DONE`, đồng nhất với
   implementation status và evidence đã có từ 2026-08-28.
4. EPIC-03 giữ `UX_APPROVED` như semantic UX status và thêm completed owner state cho Epic.
5. EPIC-05 Story/exit/master checklist được đóng sau xác nhận hoàn thành năm Epic đầu.
6. Technical Documentation common completion criteria được tick để khớp trạng thái `DONE` đã có.
7. Product Core chỉ tick acceptance có evidence từ EPIC-01–05; future-Epic items vẫn mở.
8. Master refinement checklist ghi nhận process đã dùng cho EPIC-03–05 nhưng bắt buộc re-validate
   theo capability cho EPIC-06–11.

## 4. Deferred/open truth không được chuyển thành pass

- EPIC-05 formal tester: `DEFERRED_TO_LATER_PHASE`; quick smoke là owner-reported, không phải full
  device matrix.
- EPIC-02 final same-release-candidate-SHA iOS/Android aggregate: thuộc EPIC-12.
- `OPEN-006` contribution colors: vẫn open, chỉ block final EPIC-09 visual QA.
- `OPEN-009` Pet naming: vẫn open; onboarding hiện không có naming/schema và đã đóng đúng scope.
- Standard Focus, Break, economy UI, History/Contribution UI, Settings, provider analytics,
  Feedback/Store Review và Beta Readiness vẫn chưa production-complete.

## 5. Next plan — EPIC-06 Standard Focus

### 5.1. Gate hiện tại

- `EPIC-05 DONE_OWNER_ACCEPTED`: closed.
- Approved EPIC-03 Standard Focus flow: available for refinement.
- Timer/Session/Gamification normative rules: approved.
- Existing schema `001`: implementation baseline only; không tự động chứng minh không có data gap.
- `OPEN-006` và `OPEN-009`: không block EPIC-06.
- Implementation: `NOT_STARTED`.

### 5.2. Planning sequence bắt buộc

1. Audit production Standard Focus baseline versus EPIC-03 prototype: Setup, Running, Result,
   Relax/Strict, cancel, retry, Home/Break exits.
2. Map each screen/action to application command, durable fact, derived projection and side effect;
   preserve `NO SCHEMA` unless an approved flow proves a gap.
3. Create/review `EPIC-06_USER_STORIES.md` with owner-visible increments, dependencies, fixtures,
   a11y/offline/recovery and exact exit evidence.
4. Proposed slicing for review, not yet approved:
   - `US-06-01`: production Setup validation and commit-before-navigation Start;
   - `US-06-02`: Relax running/countdown/background/relaunch/cancel;
   - `US-06-03`: Strict grace evidence, foreground/relaunch precedence and failed outcome;
   - `US-06-04`: exactly-once completion/reward and committed Result variants;
   - `US-06-05`: notification/analytics best-effort, a11y, integrity and Epic exit evidence.
5. List owner confirmations for behavior boundaries and approve them before any production code.
6. Implement one Story at a time; each Story needs exact-SHA report and owner acceptance before the
   next becomes active.

### 5.3. Guardrails cho EPIC-06 planning

- Không implement Break creation/cadence beyond Result CTA contract; EPIC-07 owns Break behavior.
- Không add provider/PostHog, Settings UI, History UI, Shop/economy UI hoặc Pet naming.
- Standard Focus analytics may use existing typed local queue only after event semantics are locked;
  provider delivery remains EPIC-11.
- Prototype fallback chỉ được loại theo production slice đã thay thế; không xóa later-Epic review
  behavior hàng loạt.
- Reward must be automatic/atomic/idempotent; Result never owns claim truth.
- Notification and Pet/analytics failures stay outside core session/reward transaction.
- Formal device claims require actual platform/device/OS/SHA evidence; automated tests remain labeled.

## 6. Updated checklist

- [x] Inventory toàn bộ 55 existing docs.
- [x] Reconcile EPIC-01–05 status with evidence and owner acceptance.
- [x] Close EPIC-05 exit/master checklist without fabricating deferred evidence.
- [x] Update Product Core acceptance items proven by first five Epics.
- [x] Update Technical Documentation common checklist.
- [x] Preserve OPEN/deferred/future-Epic boundaries.
- [x] Open EPIC-06 planning only.
- [ ] Create and owner-review detailed EPIC-06 Story breakdown.
- [ ] Approve EPIC-06 implementation confirmations.
- [ ] Begin EPIC-06 production implementation.

## 7. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0.0 | 2026-09-03 | Codex, recording owner five-Epic completion | Audited 55 existing docs, normalized EPIC-01–05 closure/checklists, preserved deferred/open truth and opened only EPIC-06 planning with a proposed Story sequence. |
