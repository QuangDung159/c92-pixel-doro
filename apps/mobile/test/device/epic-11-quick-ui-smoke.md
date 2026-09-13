# EPIC-11 Analytics, Feedback & Store Review — quick UI smoke

Status: `READY_FOR_OWNER_QUICK_UI`

Implementation SHA: `<implementation-sha>`

Allowed case results: `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`.
Initial result for every case: `NOT_RUN`.

Guide này chạy trên implementation worktree sau planning baseline
`a8dd7eb21dc978884994a46230fb9837d8d74f68`. Vì thay đổi chưa được commit, `<implementation-sha>`
phải giữ nguyên cho tới khi owner yêu cầu commit; quick UI hiện tại là kiểm tra local, chưa phải bằng chứng
acceptance exact-SHA.

Chỉ dùng các database disposable có prefix chính xác `pixeldoro-us-11-`; quick path dùng các suffix
`epic-11-quick`, `epic-11-feedback-failure-once`, `epic-11-review-cooldown`. Không được mở, đọc, sửa,
reset hoặc xóa database thường `pixeldoro.db`. Không dùng wildcard/glob để cleanup.

## 1. Run record và prerequisites

- [ ] Thay `<implementation-sha>` bằng output exact của `git rev-parse HEAD`; build, Metro và artifact
  phải cùng SHA.
- [ ] Xác nhận worktree/branch/build type; không suy diễn PASS từ SHA khác.
- [ ] Có Development Build tương thích native dependency của Story 05; Expo Go/OTA-only không đủ.
- [ ] Fixture `EXPO_PUBLIC_EPIC_11_REVIEW_FIXTURE=epic_11_quick` tồn tại, dev-only và báo đúng database.
- [ ] Home hiển thị panel dev-only gồm đúng scenario, disposable database và kết quả store-review đã
  sanitize; tuyệt đối không render feedback comment, ID, provider key hoặc request body.
- [ ] Live PostHog EU project/key và feedback test endpoint là optional external prerequisite. Nếu thiếu,
  live rows ghi `BLOCKED`; local adapter-boundary rows vẫn chạy độc lập.
- [ ] Không dùng production analytics dashboard để kết luận local capture, retry hoặc duplicate behavior.

| Field | Value |
|---|---|
| Date/time/timezone | `<fill>` |
| Branch | `feats/epic-11` or `<fill>` |
| Exact implementation SHA | `<implementation-sha>` |
| Platform | `iOS` / `Android` / `<fill>` |
| Device/simulator/emulator | `<fill>` |
| OS version | `<fill>` |
| Build/profile | `<fill>` |
| Network start state | `Online` / `Airplane mode` / `<fill>` |
| Analytics preference start | `On` / `Off` / `<fill>` |
| Provider mode | `local-fake` / `test-project` / `<fill>` |
| Store-review adapter | `fake` / `native` / `<fill>` |
| Accessibility state | `default` / `Largest Text` / `VoiceOver/TalkBack` / `Reduce Motion` / `<fill>` |
| Disposable database | `pixeldoro-us-11-epic-11-quick.db` |

## 2. Safe setup

From repository root:

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
node --version
pnpm --version
git branch --show-current
git rev-parse HEAD
EXPO_PUBLIC_EPIC_11_REVIEW_FIXTURE=epic_11_quick \
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_returning \
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_fast_clock \
pnpm start --clear
```

- [ ] Home panel names exactly `epic_11_quick · pixeldoro-us-11-epic-11-quick.db`.
- [ ] If panel is absent or names `pixeldoro.db`, stop immediately and record `FAIL`.
- [ ] If stale fixture data affects the run, use the existing Settings confirmed-reset flow only while the
  Home panel still names the exact disposable database.
- [ ] Confirm normal user content and provider credentials are absent from fixture output/artifacts.

## 3. Quick path — target under 10 minutes

Run on one available Development Build first. This is owner quick smoke, not the full iOS/Android matrix.

| Minute | Case | Action and exact observable result | Initial result |
|---:|---|---|---|
| 0–1 | `E11-Q01` | Start `epic_11_quick`; Home panel shows exact scenario + disposable DB and “Chưa có yêu cầu đánh giá mới.” | `NOT_RUN` |
| 1–3 | `E11-Q02` | Settings → “Góp ý cho PixelDoro”; Submit is disabled before score. Select 4, enter an optional short comment, Submit once. Accessible success appears. | `NOT_RUN` |
| 3–4 | `E11-Q03` | Return Settings, turn Anonymous analytics Off, open Focus Setup then go back; every core control remains usable and no analytics/provider banner appears. Turn On again. | `NOT_RUN` |
| 4–6 | `E11-Q04` | Start a 15-minute Relax Focus; accelerated review clock completes it in about 30 seconds. On Result press “Về Home”. | `NOT_RUN` |
| 6–7 | `E11-Q05` | Home panel changes to `Kết quả đã làm sạch: requested`. Background/foreground once; no second prompt or UI interruption appears. | `NOT_RUN` |
| 7–8 | `E11-Q06` | Restart Metro with `epic_11_feedback_failure_once`; submit score 4. First submit shows network Retry, unchanged retry succeeds. | `NOT_RUN` |
| 8–10 | `E11-Q07` | Restart with `epic_11_review_cooldown` + fast clock; complete the same short path and return Home. Panel shows `ineligible`, core UI remains usable. | `NOT_RUN` |

Optional unsupported-native branch: restart with `epic_11_review_unavailable`, complete the fast-clock path,
and expect sanitized `unavailable` with no crash. Exact call-count, ID reuse, queue, privacy-generation and
persist-before-native ordering are automated gates, not claims inferred from this UI-only smoke.

Đổi scenario bằng cách dừng Metro rồi chạy một trong các lệnh sau từ repository root:

```sh
EXPO_PUBLIC_EPIC_11_REVIEW_FIXTURE=epic_11_feedback_failure_once \
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_returning \
pnpm start --clear
EXPO_PUBLIC_EPIC_11_REVIEW_FIXTURE=epic_11_review_cooldown \
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_returning \
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_fast_clock \
pnpm start --clear
EXPO_PUBLIC_EPIC_11_REVIEW_FIXTURE=epic_11_review_unavailable \
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_returning \
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_fast_clock \
pnpm start --clear
```

- [ ] Total elapsed time recorded: `<fill>`; if over 10 minutes, keep evidence but do not claim quick-path target.

## 4. Taxonomy, allowlist and capture cases

| ID | Steps | Expected | Result | Evidence |
|---|---|---|---|---|
| `E11-01` | Use fixture to submit unknown event name. | Rejected before queue/provider; sanitized validation code only. | `NOT_RUN` | `<fill>` |
| `E11-02` | Submit approved name with extra key, wrong enum/type/range, raw text and >2 KiB payload. | Each whole event rejected; queue/call count unchanged; raw value not logged/rendered. | `NOT_RUN` | `<fill>` |
| `E11-03` | Open Focus Setup once, rerender/back/reopen in same and new episode. | One stable event per approved episode; `{}` payload; no render-driven duplicate. | `NOT_RUN` | `<fill>` |

- [ ] Verify trial path emits only onboarding events, never standard focus/reward events.
- [ ] Verify existing Standard Focus/Break/Shop/Item/History event samples match exact per-event schemas.

## 5. Queue, offline, retry, relaunch and duplicate cases

| ID | Steps | Expected | Result | Evidence |
|---|---|---|---|---|
| `E11-04` | Seed exactly 1.000 canonical events, enqueue one more. | Queue remains 1.000; deterministic oldest row evicted; payload-free dropped count +1. | `NOT_RUN` | `<fill>` |
| `E11-05` | Seed expired and live rows at TTL boundary; trigger pass. | Expired rows removed, live due rows retain deterministic order; no provider call for expired row. | `NOT_RUN` | `<fill>` |
| `E11-06` | Airplane mode, create event, background/foreground, force-close and relaunch. | Core works; row survives in disposable DB with bounded retry; no busy loop or blocking banner. | `NOT_RUN` | `<fill>` |
| `E11-07` | Fake transient failure then advance fixture clock/network recovery. Trigger foreground and post-capture together. | One single-flight batch; attempt/backoff advances once; same IDs accepted, then exact rows deleted. | `NOT_RUN` | `<fill>` |
| `E11-08` | Simulate remote accept then kill before local delete; relaunch. | Resend may occur with same dedupe ID; fake provider records one logical event, queue eventually clears. | `NOT_RUN` | `<fill>` |

- [ ] Background transition never starts a new long flush; foreground triggers at most one coalesced pass.
- [ ] Provider throw/timeout/429/5xx and malformed/partial response cannot mutate core product rows.

## 6. Analytics On/Off, provider and privacy cases

| ID | Steps | Expected | Result | Evidence |
|---|---|---|---|---|
| `E11-09` | Analytics On + local fake; create each representative event. | Only approved canonical fields + anonymous ID/event ID/time reach adapter. | `NOT_RUN` | `<fill>` |
| `E11-10` | Turn Off with queued rows. | Capture blocks first, durable Off commits, queue clears, anonymous ID rotates. | `NOT_RUN` | `<fill>` |
| `E11-11` | While Off create several feature actions, relaunch, then turn On. | Zero capture/delivery while Off and zero backfill; next new action uses rotated ID. | `NOT_RUN` | `<fill>` |
| `E11-12` | Turn Off/reset while a fake send is delayed, then release old completion. | Stale completion is ignored; no queue resurrection/cross-generation mutation. | `NOT_RUN` | `<fill>` |
| `E11-13` | Missing config/dev/test mode and injected provider outage. | No external request in fail-closed environments; outage is bounded/retryable; core remains ready. | `NOT_RUN` | `<fill>` |

Optional live provider prerequisite row:

| Case | Prerequisite | Expected | Initial result | Evidence |
|---|---|---|---|---|
| `E11-LIVE-01` | Owner-supplied PostHog Cloud EU test project/key, retention <=12 months, manual-only config | One synthetic non-content event arrives with dedupe ID and no automatic/profile/location properties. | `NOT_RUN` | `<fill or BLOCKED reason>` |

- [ ] Redact project key, anonymous ID and provider request/response body from screenshots/logs.
- [ ] Do not use live dashboard absence/presence alone to override local adapter-boundary evidence.

## 7. Feedback cases

| ID | Steps | Expected | Result | Evidence |
|---|---|---|---|---|
| `E11-14` | Open Settings. | Entry “Góp ý cho PixelDoro” is always present and opens production screen; no PrototypeBadge/mock controls. | `NOT_RUN` | `<fill>` |
| `E11-15` | No score, empty comment; then choose each score 1–5. | Submit disabled with accessible reason until score; selection announced/not color-only; empty comment allowed. | `NOT_RUN` | `<fill>` |
| `E11-16` | Enter boundary Unicode comment and exceed approved limit. | Valid boundary submits; overflow blocked/explained without truncation surprise; no content in logs/analytics. | `NOT_RUN` | `<fill>` |
| `E11-17` | Submit happy path and double tap. | One busy state/layout stable; one provider logical submission; accessible success; no review prompt. | `NOT_RUN` | `<fill>` |
| `E11-18` | Airplane mode or fake failure; press Retry after recovery. | Draft stays only while screen/process lives; Retry reuses submission ID; one logical submission. | `NOT_RUN` | `<fill>` |
| `E11-19` | Fail submit, force-close/relaunch, reopen form. | Draft/pending submit is gone; no SQLite/outbox row and no automatic resubmit. | `NOT_RUN` | `<fill>` |

- [ ] Inspect local analytics sample: `feedback_started/submitted` contain `{}` and never score/comment.
- [ ] Inspect disposable SQLite through approved fixture summary: no feedback content/draft/outbox persistence.
- [ ] A provider/test-account prerequisite that is missing is `BLOCKED`, not a reason to mark local UI PASS.

## 8. Store-review policy/native cases

| ID | Fixture/action | Expected | Result | Evidence |
|---|---|---|---|---|
| `E11-20` | Install age 6d23h59m, 5 completed standard sessions, 3 local days. | Ineligible; zero attempt/call. | `NOT_RUN` | `<fill>` |
| `E11-21` | Age >=7d but 4 sessions or 2 distinct days; include many onboarding trials. | Ineligible; trials do not count; zero attempt/call. | `NOT_RUN` | `<fill>` |
| `E11-22` | Exact eligible facts; fresh completed reward/celebration → Home, foreground active/no modal/session. | Attempt commits before exactly one fake native call; request event only after commit. | `NOT_RUN` | `<fill>` |
| `E11-23` | Eligible but latest attempt <120d, 3 attempts in rolling 365d, or same app version. | Each variant silent/ineligible; no new attempt/call. | `NOT_RUN` | `<fill>` |
| `E11-24` | Eligible facts but active session/onboarding/modal/background or foreground-only/relaunch. | No request and no consumed fake success. | `NOT_RUN` | `<fill>` |
| `E11-25` | Inject attempt-write failure, then native unavailable/unsupported/throw after successful write. | Write failure => zero native call. Native failure => attempt retained, no crash/immediate retry. | `NOT_RUN` | `<fill>` |
| `E11-26` | Competing duplicate triggers and delayed eligibility result after navigation/background. | Serialized one attempt/call; stale result discarded; reopen/relaunch does not repeat. | `NOT_RUN` | `<fill>` |

Optional native row:

| Case | Prerequisite | Expected | Initial result | Evidence |
|---|---|---|---|---|
| `E11-NATIVE-01` | Production-like native Development Build with approved `expo-store-review`; supported store context | Adapter availability and one request invocation evidenced. OS may choose not to show prompt; do not claim outcome. | `NOT_RUN` | `<fill or BLOCKED reason>` |

- [ ] Confirm no custom rating pre-prompt, incentive, feedback branching or review-outcome tracking.
- [ ] Confirm attempts are never deleted/reset merely to force a real user re-prompt.

## 9. Accessibility and non-regression

| ID | Setting/action | Expected | Result | Evidence |
|---|---|---|---|---|
| `E11-27` | Largest system text on Settings/Feedback/error/success. | Content wraps/scrolls, no clipped score/CTA/status, focus target remains visible. | `NOT_RUN` | `<fill>` |
| `E11-28` | VoiceOver on iOS or TalkBack on Android; traverse feedback. | Heading/order/radiogroup selected state/required hint/text input/count/error/busy/success/Retry read correctly; >=44pt targets. | `NOT_RUN` | `<fill>` |
| `E11-29` | Reduce Motion + grayscale/high-contrast where available. | State never conveyed only by color/motion; no lost feedback; analytics/review background work causes no animation/layout flicker. | `NOT_RUN` | `<fill>` |

- [ ] Re-run touched `Button`, `ChoiceChip`, `InlineNotice`, `StatusSurface`, `ScreenShell/Header`, Settings
  consumers and verify no visual/interaction/accessibility regression.
- [ ] Record iOS and Android separately; one platform never implies PASS on the other.

## 10. Safe cleanup

- [ ] Stop Metro before changing/unsetting fixture.
- [ ] If reset is needed, confirm the Home panel names the exact current `pixeldoro-us-11-*` database
  before using Settings → “Xóa toàn bộ dữ liệu local”.
- [ ] Confirm fixture reports its connection closed and exact disposable state cleared.

```sh
unset EXPO_PUBLIC_EPIC_11_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] Confirm normal launch reports `pixeldoro.db`; do not inspect, reset or delete it.
- [ ] Do not run file deletion with wildcard/glob. Do not rename/copy fixture DB over `pixeldoro.db`.
- [ ] Remove/redact temporary evidence containing comment, anonymous ID, project key or request body.
- [ ] Keep every unexecuted row `NOT_RUN`; validator/typecheck/export is not manual PASS.

## 11. Evidence/artifact register

| Case/date/timezone | Platform/device/OS/build | Network/app/a11y state | Result | Exact SHA | Artifact/notes |
|---|---|---|---|---|---|
| `E11-Q01→Q09` / `<fill>` | `<fill>` | `<fill>` | `NOT_RUN` | `<implementation-sha>` | `<fill>` |
| `E11-01→03` / `<fill>` | `<fill>` | `<fill>` | `NOT_RUN` | `<implementation-sha>` | `<fill>` |
| `E11-04→08` / `<fill>` | `<fill>` | `<fill>` | `NOT_RUN` | `<implementation-sha>` | `<fill>` |
| `E11-09→13` / `<fill>` | `<fill>` | `<fill>` | `NOT_RUN` | `<implementation-sha>` | `<fill>` |
| `E11-LIVE-01` / `<fill>` | `<fill>` | Provider prerequisite `<fill>` | `NOT_RUN` | `<implementation-sha>` | `<fill or BLOCKED reason>` |
| `E11-14→19` / `<fill>` | `<fill>` | `<fill>` | `NOT_RUN` | `<implementation-sha>` | `<fill>` |
| `E11-20→26` / `<fill>` | `<fill>` | `<fill>` | `NOT_RUN` | `<implementation-sha>` | `<fill>` |
| `E11-NATIVE-01` / `<fill>` | `<fill>` | Native prerequisite `<fill>` | `NOT_RUN` | `<implementation-sha>` | `<fill or BLOCKED reason>` |
| `E11-27→29` / `<fill>` | `<fill>` | Largest Text / VoiceOver/TalkBack / Reduce Motion | `NOT_RUN` | `<implementation-sha>` | `<fill>` |
| `E11-30 cleanup` / `<fill>` | `<fill>` | Normal launch | `NOT_RUN` | `<implementation-sha>` | `<fill>` |

## 12. Exit honesty

- [ ] Attach exact-SHA automated output separately; do not copy its PASS into this manual table.
- [ ] Any crash, privacy leak, duplicate logical feedback, repeated review call or core-flow corruption is FAIL.
- [ ] Missing test project/account/native build/device is BLOCKED for that row and keeps required gate open.
- [ ] Full physical-device/platform/accessibility breadth and release artifact remain EPIC-12; this guide
  does not mark them complete.
