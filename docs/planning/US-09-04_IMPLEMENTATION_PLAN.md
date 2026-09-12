---
document_id: PIXELDORO_US_09_04_IMPLEMENTATION_PLAN
title: PixelDoro Mobile MVP — US-09-04 Implementation Plan
version: 0.4.0
status: DONE_OWNER_ACCEPTED
implementation_status: DONE_OWNER_ACCEPTED
date: 2026-09-12
last_updated: 2026-09-12
owner: Dũng Lư
reviewer: Dũng Lư
reviewer_role: Tech Lead/Product Owner
language: vi
branch: feats/epic-09
planning_baseline_sha: c0291ece7a905e4048889bd96a99f2fd39a3db28
implementation_start_sha: c0291ece7a905e4048889bd96a99f2fd39a3db28
current_candidate_base_sha: cdce571d7f61e088d7f48c297d32a9373e7f0a99
exact_implementation_sha: cdce571d7f61e088d7f48c297d32a9373e7f0a99
candidate_identity: EXACT_COMMITTED_OWNER_ACCEPTED_SHA
previous_story: US-09-03
previous_story_status: DONE_OWNER_ACCEPTED
previous_story_accepted_sha: c0291ece7a905e4048889bd96a99f2fd39a3db28
manual_device_status: OWNER_QUICK_UI_SMOKE_REPORTED_PASS
formal_tester_status: NOT_RUN
schema_change: NONE_PROPOSED
dependency_change: NONE_PROPOSED
native_change: NONE_PROPOSED
analytics_change: NONE_PROPOSED
product_decision: OPEN_006_RESOLVED_OPTION_A
automated_status: PASS_203_FILES_1044_TESTS
next_gate: US_09_05_IMPLEMENTATION_PLAN_CONFIRMATION
scope:
  - mobile_mvp
  - epic_09
  - us_09_04
  - production_contribution_graph
  - palette_application
  - responsive_layout
  - accessibility
authority: OWNER_APPROVED_IMPLEMENTATION_PLAN
story_baseline: ./EPIC-09_USER_STORIES.md
previous_story_plan: ./US-09-03_IMPLEMENTATION_PLAN.md
previous_story_report: ./US-09-03_IMPLEMENTATION_REPORT.md
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
technical_baseline: ../architecture/technical-overview.md
architecture_baseline: ../architecture/system-architecture.md
adr_domain_platform_boundary: ../architecture/decisions/ADR-004-domain-and-platform-boundaries.md
---

# US-09-04 — Production Contribution Graph và Accessibility

## 0. Outcome và gate

Plan này mở sau khi owner accepted US-09-03 tại exact SHA `c0291ec...`. Story 03 đã cung cấp read-only
seven-day projection, semantic bands, independent lifecycle/error handling và neutral text-first panel.
Story 04 chỉ chuyển projection đã accepted thành final visual graph accessible; không đổi data truth.

**User outcome:** người dùng nhận ra nhịp Focus của bảy ngày gần đây bằng màu/swatch trong một glance,
đồng thời vẫn đọc được exact date, completed minutes, session count và band khi dùng grayscale,
largest text, Reduce Motion hoặc screen reader.

**Priority/order:** `P1 / 4` trong EPIC-09.

Owner đã duyệt `US0904-CONFIRM-01→06 Option A` ngày 2026-09-12 và cấp quyền coding Story 04.
Approval không cấp quyền commit/push, US-09-05 implementation hoặc EPIC-09 closure.

### 0.1. Baseline audit

| Fact | Kết quả |
|---|---|
| Repository/branch | `/Users/dunglu/Documents/Working/c92-pixel-doro` / `feats/epic-09` |
| Planning HEAD | `c0291ece7a905e4048889bd96a99f2fd39a3db28` |
| Origin alignment | Local và `origin/feats/epic-09` cùng SHA tại audit |
| Worktree trước doc update | Clean |
| US-09-03 | `DONE_OWNER_ACCEPTED`; owner quick UI PASS, no crash, expected behavior |
| Product decision | `OPEN-006 RESOLVED`: five exact bands và five existing light palette tokens |
| Current UI | Neutral seven-row panel, exact date/minutes/count/range, panel-local loading/error/stale Retry |
| Current scroll | One History `SectionList`; contribution panel nằm trong list header |
| Missing | Final swatches/legend, responsive graph treatment, contrast assertions và device guide |

## 1. Authority và scope

### 1.1. Locked/inherited truth

- Range luôn có đúng bảy local calendar days, oldest→current local day, kể cả zero days.
- Mỗi day đã có exact `completedMinutes`, `completedSessionCount` và semantic `intensity` từ Application.
- Fill mapping cố định: `zero→background`, `low→surface`, `medium→surfaceStrong`, `high→accent`,
  `peak→accentDark`.
- Màu/band không persist; Presentation không tính minutes, query SQLite hoặc đọc current date/timezone.
- Final graph phải có border, numeric minutes và text legend; màu không được là meaning duy nhất.
- Failed/cancelled/running/trial/Break exclusions, cross-midnight/day truth và controller lifecycle không đổi.
- History list phải còn usable khi contribution loading/error/stale; graph không có network hoặc remote art.

### 1.2. In scope

1. Apply exact fill tokens bằng một Presentation-only exhaustive visual mapping.
2. Thêm compact seven-cell graph strip theo chronological projection.
3. Giữ exact text rows làm color-independent details và screen-reader owner.
4. Thêm five-band legend bằng swatch + exact minute range, không dùng evaluative score copy.
5. Chốt border treatment đủ deterministic non-text contrast cho mọi band.
6. Chốt today marker, decorative/accessibility ownership và no-interaction contract.
7. Component/static/integration coverage, visual/accessibility smoke guide và candidate report.

### 1.3. Out of scope

- Thay đổi range, threshold, zero-fill, query, controller, SQLite hoặc local-date semantics.
- Tap/tooltip/detail, selection, gesture, animation, streak, reward, calendar paging hoặc custom range.
- Dark mode/theme switching; app hiện dùng `Palette.light` cố định.
- New colors, design assets, chart/animation dependency hoặc native module.
- Analytics graph interaction; `history_viewed` thuộc US-09-05.
- Formal cross-device certification nếu chưa thực sự chạy; status phải giữ `NOT_RUN`.

### 1.4. Scope traps

1. Không copy hex trực tiếp vào feature; chỉ dùng named palette tokens đã approved.
2. Không đặt text bên trong dark/variable fill rồi giả định contrast; exact text nằm ngoài swatch.
3. Không dùng cùng `palette.border` cho `peak`: audit ratio chỉ khoảng `1.64:1` với `accentDark`.
4. Không ẩn exact rows để đổi lấy compact strip; grayscale/largest-text meaning phải còn nguyên.
5. Không để decorative strip/legend swatches tạo duplicate VoiceOver/TalkBack focus.
6. Không dùng `numberOfLines`, font downscale hoặc horizontal scroll để che overflow.
7. Không thêm touch role, press state hoặc tap affordance cho non-interactive cell.
8. Không làm contribution visual state che/replace accepted History list state.

## 2. Capability inventory và gap

| Capability | Accepted baseline | Story-04 gap |
|---|---|---|
| Application projection | Seven immutable days + exhaustive semantic band | Không đổi |
| Contribution controller | Independent loading/ready/error/stale/Retry | Không đổi |
| Neutral panel | Seven exact text rows; accessible one focus/day | Cần graph strip + final legend |
| Theme | Exact light tokens đã bundled | Cần exhaustive band→fill/border mapping |
| Scroll/layout | One `SectionList`, panel scrolls with History | Cần compact no-horizontal-loss graph |
| Fixtures | Mixed fixture đã chứa zero + đủ low/medium/high/peak | Có thể reuse; không cần DB mới |
| A11y infrastructure | Decorative hiding patterns và Reduce Motion provider sẵn có | Graph cần explicit focus ownership |

Kết luận: Story 04 là Presentation-only refinement. Không có lý do đổi Application, controller,
composition, persistence, migration, dependency hoặc native configuration.

## 3. Proposed visual contract

### 3.1. Graph composition

Option A đề xuất giữ hai lớp có trách nhiệm khác nhau:

```text
7 ngày gần đây
[■][■][■][■][■][■][■]   ← compact chronological graph
 06 07 08 09 10 11 12   ← day-of-month labels

06/09  15 phút  1 phiên  1–24 phút
... exact seven text rows ...

Mức đóng góp
■ 0 phút  ■ 1–24 phút ... ■ 100+ phút
```

- Graph strip cung cấp glanceable pattern, luôn đúng bảy cells và stable `localDate` keys.
- Cell chỉ dùng day-of-month hai chữ số để không mất chiều ngang; full `DD/MM/YYYY` vẫn ở detail row.
- Existing detail rows vẫn là exact visible meaning và accessibility owner.
- Legend giải thích fill mapping bằng exact ranges; không hiển thị internal labels `low/high/peak`.
- Không có tap, tooltip, animation, selection hoặc horizontal scrolling.

### 3.2. Palette và contrast contract

Fill mapping giữ nguyên Product truth. Border được phép thích ứng mà không tạo color authority mới:

| Band | Fill token | Border token đề xuất | Audited contrast |
|---|---|---|---:|
| zero | `background` | `border` | `8.63:1` |
| low | `surface` | `border` | `7.64:1` |
| medium | `surfaceStrong` | `border` | `6.17:1` |
| high | `accent` | `border` | `4.10:1` |
| peak | `accentDark` | `white` | `5.92:1` |

Ratios dùng current checked-in light palette và WCAG relative-luminance formula. `accentDark` với
`border` chỉ khoảng `1.64:1`, nên adaptive white border là deliberate contrast fix. Exact numeric/text
meaning vẫn nằm ngoài fill và dùng existing readable text colors.

### 3.3. Presentation contracts

```ts
type ContributionVisualTokens = Readonly<{
  fillColor: string;
  borderColor: string;
}>;

contributionVisualTokens(
  intensity: ContributionIntensityBand,
): ContributionVisualTokens;
```

Mapping phải exhaustive và nằm trong History Presentation feature; Application không import theme.

```ts
ContributionGraphStrip({ days })
ContributionLegend()
ContributionDayRow({ day, isToday })
```

- `ContributionGraphStrip` dùng projection order, không sort hoặc date-math lại.
- Whole strip/decorative swatches bị ẩn khỏi accessibility tree; exact rows giữ one focus/day.
- `ContributionLegend` có visible ranges và một concise accessible label, swatches không focus riêng.
- `isToday` lấy từ `day.localDate === projection.endLocalDate`, không gọi clock/Date.

### 3.4. Responsive and state behavior

- Seven columns dùng equal flex widths, bounded gap và no fixed screen width; no horizontal ScrollView.
- Day labels cho phép system font scaling/wrap; không truncate/downscale. Exact rows tiếp tục wrap như
  accepted Story 03 và là fallback chính ở largest text.
- Panel loading/error/stale behavior giữ nguyên; graph/legend chỉ render khi projection `ready`.
- Ready all-zero vẫn render seven background cells, borders, exact zero rows và legend.
- Reduce Motion không cần branch vì graph hoàn toàn static.

## 4. Responsibility matrix

| Owner | Owns | Must not own |
|---|---|---|
| `ContributionPanel` | Compose heading, ready graph, rows, legend và existing states | Band/date/query calculations |
| `ContributionGraphStrip` | Ordered visual cells/day labels | Screen-reader detail, sorting, interaction |
| `ContributionDayRow` | Exact visible/a11y day meaning, optional today copy | Theme selection, current clock |
| `ContributionLegend` | Exact five swatches/ranges | Session totals, qualitative score |
| Visual token mapper | Exhaustive band→approved fill/border tokens | Persisted color, business thresholds |
| Existing controller/use case | Accepted projection/lifecycle only | Visual tokens/layout |

## 5. File impact

### 5.1. Planned new files

- `apps/mobile/src/presentation/features/history/contribution-visual-tokens.ts` and test.
- `apps/mobile/src/presentation/features/history/contribution-graph-strip.tsx` and test.
- `apps/mobile/src/presentation/features/history/contribution-legend.tsx` and test.
- `apps/mobile/test/device/contribution-graph-accessibility-smoke.md`.
- `docs/planning/US-09-04_IMPLEMENTATION_REPORT.md` after authorized implementation.

### 5.2. Planned modified files

- `contribution-panel.tsx`/test to compose graph + rows + legend only for ready state.
- `contribution-day-row.tsx`/test for approved today marker and focus semantics.
- History feature barrel and route-integrity test inventory.
- Device-guide validator.
- This plan, EPIC-09 tracker and eventual implementation report status/evidence.

### 5.3. Explicitly unchanged

- Application projection/use case and all semantic thresholds.
- Contribution/History controllers, facade/provider/route lifecycle and SQLite queries.
- Migration `001`, registry/checksum/schema/index/trigger/seed.
- Package manifests/lockfile, assets, native config and permissions.
- Analytics queue/provider and every product-data write path.
- Common components unless failing evidence proves a reusable defect and owner separately approves scope.

## 6. Ordered implementation tasks

| Order | Task | Observable output |
|---:|---|---|
| T00 | Owner gate + clean exact start audit | Six confirmations approved; exact start SHA recorded |
| T01 | Visual token mapping | All five fills + contrast-safe borders, no raw feature hex |
| T02 | Graph strip | Seven chronological stable cells/day labels, non-interactive |
| T03 | Legend | Five exact color/range mappings, no qualitative pressure copy |
| T04 | Detail/a11y integration | Exact rows retained; today/focus ownership per approval |
| T05 | State/screen integration | Graph only in ready; list survives loading/error/stale |
| T06 | Automated/static checks | Bands/order/a11y/contrast/responsive/no forbidden imports |
| T07 | Device guide | Small width, largest text, screen reader, grayscale, Reduce Motion |
| T08 | Candidate gates/report | Quality, exports, Doctor, diff and honest manual status |

## 7. Test strategy

### 7.1. Visual mapping và contrast

- Exhaustive `zero|low|medium|high|peak` mapping to exact fill tokens.
- Exact adaptive border mapping; no literal hex in feature files.
- Test relative-luminance ratios for each fill/border pair `>= 3:1` on checked-in light palette.
- Guard that thresholds/ranges remain imported from accepted projection/copy authority, not recalculated.

### 7.2. Component and accessibility

- Exactly seven graph cells, chronological order and stable local-date keys for zero/mixed/all bands.
- Graph strip and decorative swatches hidden from duplicate accessibility focus.
- Exactly one full label per detail day: date, minutes, completed count, exact range and today marker.
- Legend visibly contains five swatches + ranges; no internal/evaluative band names.
- No `onPress`, button role, gesture, animation, timer, network, repository or SQLite import.
- Long numbers/Vietnamese copy and largest-text-shaped props do not introduce truncation contract.

### 7.3. Screen/regression/static

- Loading/initial error/stale Retry remain panel-local; accepted History list stays rendered.
- All-zero projection renders full graph/details/legend, not empty state.
- History retains one `SectionList`; no nested/horizontal scroll owner.
- Existing ScreenShell/Panel/InlineNotice/History row tests remain green.
- Every History presentation module stays below 300 lines; split review starts at 240–260.
- Full repository quality, iOS/Android Expo export, Doctor, `git diff --check` and no-drift audit.

## 8. Fixtures và manual smoke

Reuse the accepted dev-only `EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE` scenarios. Không tạo DB fixture mới:

| Scenario | Story-04 evidence |
|---|---|
| `contribution_mixed_week` | Đã có zero + low + medium + high + peak trong một seven-day range |
| `contribution_zero_week` | Zero fill/border/readability |
| `contribution_threshold_edges` | Exact band visual mapping |
| `contribution_read_failure_once` | Error/Retry local; History remains usable |
| `contribution_cross_midnight` / `timezone_changed` | Visual không làm đổi accepted date truth |

Long Vietnamese/numeric cases là pure component fixtures; largest text là manual device configuration,
không cần tạo durable data mới. Proposed guide:
`apps/mobile/test/device/contribution-graph-accessibility-smoke.md`, initial `Status: NOT_RUN`.

Manual breadth: normal/small portrait, largest system text, VoiceOver/TalkBack, grayscale/color filter,
Reduce Motion, airplane mode/cold relaunch và cleanup exact isolated DB/env. Chỉ case thực sự chạy mới
được ghi PASS.

## 9. Acceptance và Done gates

- [x] Owner approves `US0904-CONFIRM-01→06 Option A` and authorizes Story-04 coding.
- [x] Exact five fill tokens and adaptive border treatment match approved visual contract.
- [x] Seven-cell graph and exact seven detail rows remain chronological and complete.
- [x] Numeric minutes/date/count/range remain visible without color.
- [x] Screen reader props expose one concise focus/day and no decorative duplicate.
- [ ] Largest text/small portrait remains scrollable without truncation or horizontal loss.
- [x] Legend is exact, non-evaluative and structurally meaningful without color.
- [x] No interaction/animation/network/data/schema/dependency/native/analytics drift.
- [x] Automated/static/platform gates pass with exact evidence; manual status remains `NOT_RUN`.
- [x] Owner final visual smoke is bound to exact committed SHA `cdce571...`; Story 04 closed.

## 10. Owner Confirmation Register

### US0904-CONFIRM-01 — Graph composition

- **Option A — đề xuất:** compact 7-cell chronological color strip + giữ seven exact text rows bên dưới.
- **Option B:** không có strip; chỉ thêm colored swatch vào từng text row.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0904-CONFIRM-02 — Legend copy

- **Option A — đề xuất:** five swatches với exact ranges `0`, `1–24`, `25–49`, `50–99`, `100+ phút`;
  không hiển thị các nhãn đánh giá “thấp/cao/đỉnh”.
- **Option B:** thêm Vietnamese qualitative labels cho mỗi band.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0904-CONFIRM-03 — Peak contrast border

- **Option A — đề xuất:** `border` token cho zero→high, `white` border cho peak; mọi pair đã audit `>=3:1`.
- **Option B:** dùng `border` token cho tất cả dù peak chỉ khoảng `1.64:1`.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0904-CONFIRM-04 — Today marker

- **Option A — đề xuất:** append visible `Hôm nay` ở exact last-day row, derive từ `endLocalDate`;
  không tạo fill/shape đặc biệt làm sai intensity.
- **Option B:** chỉ hiển thị date như sáu ngày còn lại.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0904-CONFIRM-05 — Accessibility ownership

- **Option A — đề xuất:** graph strip/swatches decorative và hidden; exact row là một focus/day; legend
  là một text group, graph không interactive/animated.
- **Option B:** mỗi graph cell và detail row đều focusable.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

### US0904-CONFIRM-06 — Fixture và change boundary

- **Option A — đề xuất:** reuse Story-03 fixtures, Presentation-only code; không đổi query/controller,
  không schema/dependency/native/analytics; owner quick visual smoke required, formal breadth honest.
- **Option B:** tạo fixture DB/range/controller riêng cho Story 04.
- **Status:** `APPROVED_OPTION_A` — owner 2026-09-12.

Owner có thể duyệt gọn:

`Duyệt US0904-CONFIRM-01→06 theo Option A`

Approval này mở coding US-09-04 trên exact start SHA được audit lúc đó. Nó không authorize commit/push,
US-09-05 implementation hoặc EPIC-09 closure.

## 11. Impact và rollback

| Area | Verdict |
|---|---|
| Schema/migration/index | `NONE` |
| Dependency/package/lockfile | `NONE` |
| Native/prebuild/permission | `NONE` |
| Durable writes | `NONE` |
| Application/controller/query | `NONE` proposed |
| Analytics/provider | `NONE`; deferred US-09-05 |
| Common component | `NONE` proposed |
| Formal device/a11y | `NOT_RUN` until executed |

Rollback removes graph strip/legend/visual mapping và restores accepted neutral Story-03 panel/row.
Không cần database rollback hoặc data deletion. Never reset/delete `pixeldoro.db`; fixture DBs giữ exact
isolated cleanup contract của Story 03.

## 12. Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.4.0 | 2026-09-12 | Codex | Bound owner quick visual UI PASS to exact committed/pushed SHA `cdce571...`: no crash and expected behavior. Closed US-09-04 as `DONE_OWNER_ACCEPTED`; structured/formal breadth remains `NOT_RUN`; opened US-09-05 planning. |
| 0.3.0 | 2026-09-12 | Codex | Implemented approved Option A candidate: exact five-band visual tokens, contrast-safe peak border, decorative seven-cell strip, retained accessible details, today marker, exact legend and device guide. Full quality passed 203 files/1,044 tests; iOS/Android exports passed; Doctor remains 20/21 known patch drift. Candidate is uncommitted on `c0291ec...`; owner visual smoke remains `NOT_RUN`. |
| 0.2.0 | 2026-09-12 | Codex | Recorded owner approval for `US0904-CONFIRM-01→06 Option A`, opened Story-04 coding and bound exact implementation start SHA `c0291ec...`. No commit/push authority. |
| 0.1.0 | 2026-09-12 | Codex | Audited accepted US-09-03 SHA `c0291ec...`, resolved palette, current neutral panel/a11y/scroll architecture and actual token contrast; proposed Presentation-only seven-cell graph, exact legend, adaptive peak border, retained text rows, fixture reuse and six owner confirmations. No coding, commit or push. |
