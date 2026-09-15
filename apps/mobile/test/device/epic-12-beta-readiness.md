# EPIC-12 — Beta readiness device guide

Status: `NOT_RUN / CANDIDATE_INVALIDATED / REFREEZE_REQUIRED`

Planning baseline SHA: `6a0fa42860a9134c1374867a33aa0d8b16d9bb89`

Previous frozen release-candidate SHA: `59cb87c4bc4b150a7d95265d9655f4b04bc2309a` (`INVALIDATED`)

Product/config baseline SHA: `baf70d37778e92ff0d5c258d2f2d5c1d2c0d87be` (`QUALITY_PASS`)

Replacement candidate SHA: `PENDING_CLEAN_COMMIT_AND_OWNER_REFREEZE`

Allowed case results: `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`.

Guide này là runbook kiểm chứng, không phải bằng chứng đã chạy. Governance prerequisite chỉ được PASS
khi có owner decision/evidence tương ứng; mọi execution row bắt đầu ở `NOT_RUN`. Prerequisite chưa được
owner chốt có thể được đổi thành `BLOCKED` kèm blocker cụ thể. Không suy diễn PASS từ automated test,
quick smoke, SHA cũ, một platform khác, hay việc app không crash.

EPIC-12 chỉ được bắt đầu implementation khi EPIC-11 đã có cả `DONE_OWNER_ACCEPTED` và
`MVP_FEATURE_COMPLETE`. Owner đã xác nhận closure ngày 2026-09-14; authority hiện hành ghi EPIC-11
`DONE_OWNER_ACCEPTED` và W3 feature delivery complete. Điều này mở implementation nhưng không tạo
release candidate hoặc beta-ready PASS.

## 1. Hai tầng kiểm thử và quy tắc kết luận

| Tầng | Mục đích | Thời lượng | Có thể kết luận |
|---|---|---:|---|
| Quick smoke `E12-Q*` | Tìm crash/blocker rõ ràng trên một Development Build | 10–15 phút | Chỉ kết luận quick path của đúng SHA/device đã chạy |
| Full closed-beta matrix `E12-*` | Chứng minh release candidate trên iOS + Android, lifecycle, offline, accessibility, delivery và rollback | Theo matrix | Chỉ các row có đủ metadata/evidence mới được PASS |

- Quick smoke PASS không tự điền PASS cho bất kỳ full-matrix row nào.
- Automated PASS không thay thế thao tác device, VoiceOver/TalkBack, native permission, store-review,
  build/install, OTA hoặc rollback.
- Simulator/emulator không thay thế physical device khi row yêu cầu physical device.
- Evidence từ SHA khác chỉ là historical context. Final exit phải dùng cùng một frozen exact RC SHA.
- Nếu build/profile/runtime/channel không xác định được, row là `BLOCKED`, không phải `PASS`.
- Nếu expected result mơ hồ hoặc không quan sát được, dừng row và ghi blocker; không “test by feel”.

## 2. Safety, data và evidence policy

### 2.1 Database safety

- Database người dùng thật `pixeldoro.db` tuyệt đối không được mở, đọc, sửa, reset, copy đè hoặc xóa.
- Chỉ dùng database disposable được fixture hiện có tự khai báo. Trước mọi reset, panel dev-only phải
  hiện đúng tên database disposable và đúng scenario.
- Chỉ cleanup từng database theo tên chính xác qua flow fixture đã được tài liệu hóa. Không dùng
  wildcard/glob, không xóa file thủ công, không đổi tên database.
- Nếu panel không xuất hiện hoặc ghi `pixeldoro.db`, dừng ngay, ghi `FAIL`, không thử reset.
- Fixture EPIC-12 mới nếu chưa được implement là prerequisite `BLOCKED`; không tự tạo dữ liệu trực tiếp
  trong SQLite để “đủ test”.

Các database disposable hiện có được guide này tham chiếu:

- `pixeldoro-us-11-epic-11-quick.db`
- Các database mang prefix chính xác đã được guide nguồn công bố:
  `pixeldoro-us-02-09-`, `pixeldoro-us-05-`, `pixeldoro-us-06-`, `pixeldoro-us-07-`,
  `pixeldoro-us-08-`, `pixeldoro-us-09-`, `pixeldoro-us-10-`, `pixeldoro-us-11-`.

Không được giả định một suffix tồn tại nếu guide nguồn hoặc dev panel không xác nhận nó.

### 2.2 Evidence hygiene

- Artifact không chứa feedback comment, analytics event body, anonymous ID, provider key, endpoint
  secret, user data hoặc database thường.
- Screenshot/video phải che notification content nhạy cảm, device identifier và account/store identity.
- Log chỉ giữ status/code đã sanitize. Không upload raw SQLite, request/response body hoặc environment.
- Mỗi row ghi exact 40-character SHA, không chỉ branch/tag hoặc SHA rút gọn.
- Timestamp dùng ISO-8601 kèm timezone, ví dụ `2026-09-14T10:30:00+07:00`.
- Artifact path/link phải tồn tại, đọc được và chỉ thuộc release evidence được owner phê duyệt.

### 2.3 Build-source gate

- Mọi release-evidence build phải chạy qua root build entry point trên clean committed/pushed SHA.
- Gate phải từ chối cả tracked và untracked changes trước prebuild.
- Sau prebuild, gate phải xác nhận worktree vẫn clean và exact SHA không đổi trước khi gọi EAS.
- Build log phải giữ dòng `Verified clean mobile build source` với exact 40-character SHA.
- Nếu xuất hiện `Refusing mobile build`, commit/resolve thay đổi rồi chạy lại; không bypass để lấy artifact.

## 3. Prerequisites và owner gates

Các tham chiếu `CONFIRM-nn` trong guide là dạng rút gọn của canonical ID
`EPIC12-CONFIRM-nn` tại `docs/planning/EPIC-12_USER_STORIES.md` §18.

| Gate | Required value | Owner | Result | Evidence / blocker |
|---|---|---|---|---|
| `E12-G01` | EPIC-11 = `DONE_OWNER_ACCEPTED` + `MVP_FEATURE_COMPLETE` | Product owner | `PASS` | Owner confirmation 2026-09-14; EPIC-11 Exit/User Stories/Implementation Report và `MVP_EPICS.md` 3.5.0 |
| `E12-G02` | Một frozen exact RC SHA; cùng SHA cho iOS và Android final evidence | Release owner | `FAIL` | Prior SHA `59cb87c...` invalidated; Android build reports `1ca4e3f...`, latest iOS reports `726c22e...`, and both include config not committed at those SHAs; re-freeze/rebuild required |
| `E12-G03` | Minimum + representative physical device/OS matrix được chốt | QA owner | `BLOCKED` | `EPIC12-CONFIRM-03=A`, 2026-09-15; policy approved, awaiting complete physical device/model/OS inventory |
| `E12-G04` | iOS internal group và Android internal/closed track chính xác được chốt | Release owner | `BLOCKED` | Store upload owner-reported 2026-09-15; exact App Store/TestFlight group and Google Play track/release remain unrecorded |
| `E12-G05` | Feedback test endpoint bật cho beta hoặc owner chấp nhận limitation rõ ràng | Product/privacy owner | `NOT_RUN` | `<fill>` |
| `E12-G06` | PostHog tiếp tục fail-closed/deferred hoặc được bật bằng test project EU | Product/privacy owner | `NOT_RUN` | Live PostHog historical state: owner-deferred do cost |
| `E12-G07` | Rollback/republish decision owner và go/no-go owner được gọi tên | Release owner | `NOT_RUN` | `<fill>` |
| `E12-G08` | Build IDs, runtime version, update channel và native compatibility recorded | Build owner | `FAIL` | Existing EAS artifacts are cross-SHA and include uncommitted config. Build-source guard is implemented and negative-tested, but must be committed/re-frozen before clean rebuild |

### Device slots — owner phải chốt trước full run

| Slot | Minimum required role | Exact device | OS | Owner confirmation | State |
|---|---|---|---|---|---|
| `IOS-MIN` | Physical iPhone ở minimum supported iOS 16.4 nếu thiết bị khả dụng; nếu không, owner ghi giới hạn | `<fill>` | `<fill>` | `CONFIRM-03=A` | `BLOCKED` |
| `IOS-REP` | Physical iPhone ở iOS đại diện hiện hành | iPhone 13 | iOS 26.6.2 | `CONFIRM-03=A`; discovered offline 2026-09-15 | `BLOCKED` |
| `AND-MIN` | Physical Android ở minimum supported API 24 nếu thiết bị khả dụng; nếu không, owner ghi giới hạn | `<fill>` | `<fill>` | `CONFIRM-03=A` | `BLOCKED` |
| `AND-REP` | Physical Android ở target/đại diện API 36 hoặc owner-approved available level | `<fill>` | `<fill>` | `CONFIRM-03=A` | `BLOCKED` |

Supplemental targets discovered read-only on 2026-09-15; these do not satisfy physical-device rows:

| Slot | Target | OS/API | Availability | Permitted evidence |
|---|---|---|---|---|
| `IOS-SIM-REP` | iPhone 14 Plus Simulator | iOS 26.5 | `BOOTED` | Aggregate/layout supplemental only |
| `AND-EMU-REP` | `sdk_gphone64_arm64` emulator | API 36 | `CONNECTED` | Aggregate/layout supplemental only |

## 4. Run header — điền riêng cho mỗi build candidate

| Field | Required value |
|---|---|
| Run ID | `<fill, e.g. E12-RC1-20260914>` |
| Tester | `<fill>` |
| Start/end ISO timestamp + timezone | `<fill>` |
| Branch | `<fill>` |
| Exact RC SHA | `<REFREEZE_REQUIRED>` |
| Working tree status | `<clean / explain>` |
| Platform/device/model | `<fill>` |
| OS/API version | `<fill>` |
| Physical/simulator/emulator | `<fill>` |
| App version/build number | `<fill>` |
| EAS build ID/profile | `<fill>` |
| Runtime version | `<fill>` |
| Update channel/update ID | `<fill>` |
| Install source/group/track | `<fill>` |
| Network start state | `<online/offline/constrained>` |
| App start state | `<fresh install/seeded/relaunch/background>` |
| Accessibility state | `<default/Largest Text/VoiceOver/TalkBack/Reduce Motion/etc.>` |
| Fixture/scenario | `<fill or normal launch>` |
| Exact disposable DB | `<fill; never pixeldoro.db>` |
| Evidence directory | `<fill>` |

## 5. Tier 1 — quick smoke 10–15 phút

### 5.1 Setup

Chạy trên một Development Build tương thích native dependency. Đây không phải preview/release artifact.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
git branch --show-current
git rev-parse HEAD
EXPO_PUBLIC_EPIC_11_REVIEW_FIXTURE=epic_11_quick \
EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE=first_use_returning \
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_fast_clock \
pnpm start --clear
```

- [ ] Exact SHA bằng candidate đang ghi trong run header.
- [ ] Dev panel ghi đúng `epic_11_quick · pixeldoro-us-11-epic-11-quick.db`.
- [ ] Nếu fixture/build không tương thích, quick smoke = `BLOCKED`; không đổi sang normal database.
- [ ] Bắt đầu stopwatch sau khi app ready; mục tiêu hoàn tất trong 10–15 phút.

### 5.2 Quick path

| Minute | Case | Steps | Exact expected result | Result | Evidence |
|---:|---|---|---|---|---|
| 0–1 | `E12-Q01` | Ghi metadata, cold launch fixture, mở Home. | App ready; đúng scenario/DB; không Recovery/crash; không có prototype badge/control trong production path. | `NOT_RUN` | `<fill>` |
| 1–2 | `E12-Q02` | Nếu onboarding chưa hoàn tất, đi trial/handoff; nếu fixture đã returning, ghi prerequisite và mở Focus Setup. | Không kẹt route; trial không trao standard reward; returning state vào được Focus Setup. | `NOT_RUN` | `<fill>` |
| 2–4 | `E12-Q03` | Start Relax Focus; background 5 giây rồi foreground. | Timer phục hồi theo elapsed time; một active session; controls không stale/double-trigger. | `NOT_RUN` | `<fill>` |
| 4–6 | `E12-Q04` | Dùng fast clock hoàn tất Focus, nhận result rồi về Home. | Một terminal result; reward đúng một lần; Home/progression phản ánh committed data. | `NOT_RUN` | `<fill>` |
| 6–8 | `E12-Q05` | Shop: mua một item đủ điều kiện, equip; về Home/room. | Coin trừ đúng một lần; ownership/equipped nhất quán; room phản ánh item. | `NOT_RUN` | `<fill>` |
| 8–9 | `E12-Q06` | Start/complete hoặc cancel Break theo fixture khả dụng. | Cadence/result đúng; không ghi Focus reward; notification failure không chặn core flow. | `NOT_RUN` | `<fill>` |
| 9–10 | `E12-Q07` | Mở History và contribution graph, load more nếu có. | Row/group/tổng phút/graph nhất quán; không duplicate hoặc empty flicker. | `NOT_RUN` | `<fill>` |
| 10–11 | `E12-Q08` | Settings: toggle sound/haptic/analytics; mở Feedback; thử submit hợp lệ hoặc ghi endpoint unavailable. | Preferences có hiệu lực; core không phụ thuộc provider; feedback có success hoặc actionable unavailable, không mất kiểm soát. | `NOT_RUN` | `<fill>` |
| 11–13 | `E12-Q09` | Force-close app, relaunch cùng fixture; kiểm Home/History/Shop/Settings. | Không reset/corrupt; reward, purchase, equip, history và preferences giữ đúng. | `NOT_RUN` | `<fill>` |
| 13–15 | `E12-Q10` | Chụp sanitized evidence, ghi elapsed, thực hiện cleanup mục 9. | Evidence đủ metadata; normal launch được phục hồi; không đụng `pixeldoro.db`. | `NOT_RUN` | `<fill>` |

Quick-smoke aggregate:

| Exact SHA | Device/OS/build/runtime/channel | Tester/timezone | Elapsed | Result | Evidence |
|---|---|---|---:|---|---|
| `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `NOT_RUN` | `<fill>` |

Nếu một feature không thể đạt trong 15 phút bằng fixture hiện có, ghi case `BLOCKED` và blocker/next
action; không dùng thao tác DB thủ công hoặc skip im lặng.

## 6. Tier 2 — full closed-beta matrix

### 6.1 Cách ghi row

Mỗi row phải có một evidence record riêng theo schema dưới đây. Cột viết tắt trong matrix trỏ đến record
đó; một artifact chung không được dùng để che thiếu metadata của row khác.

| Field bắt buộc cho mỗi row | Giá trị |
|---|---|
| Case/result | `<case> / PASS\|FAIL\|BLOCKED\|NOT_RUN` |
| Exact SHA | `<REFREEZE_REQUIRED>` |
| Platform/device/OS | `<fill>` |
| Physical/simulator/emulator | `<fill>` |
| App version + build ID/profile | `<fill>` |
| Runtime version + channel/update ID | `<fill>` |
| Fixture + exact disposable DB | `<fill or normal launch/no DB access>` |
| Network/app/accessibility state | `<fill all three>` |
| Start/end ISO timestamp + timezone | `<fill>` |
| Tester | `<fill>` |
| Artifact/link | `<fill>` |
| Cleanup result | `<fill>` |
| Blocker owner + next action | `<none or fill>` |

### 6.2 Release identity và EPIC-02 same-SHA durability

| Case | Prerequisite | Steps | Exact expected result | Platforms | Result | Evidence record |
|---|---|---|---|---|---|---|
| `E12-RC-01` | `E12-G01→G08` satisfied | Capture source SHA, clean status, app/build/runtime/channel/update/install source on both binaries. | iOS and Android records resolve to the same exact source SHA and approved native/runtime boundary. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-DATA-IOS` | Existing `US-02-09_EPIC_EXIT`; DB `pixeldoro-us-02-09-epic-exit-probe.db` | Run full EPIC-02 aggregate flow including actual terminate/relaunch and final JSON on frozen RC. | All 25 files/153 historical host behaviors and eight probe domains are represented by current automated proof; device aggregate produces valid final JSON with no data loss/corruption. | iOS physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-DATA-AND` | Same exact runner/DB and same SHA as iOS | Repeat entire aggregate, including actual terminate/relaunch; do not reuse iOS outcome. | Same contract passes independently on Android; final JSON/platform metadata are Android-specific. | Android physical | `NOT_RUN` | `<fill all §6.1 fields>` |

`Physical disk full` remains `NOT_RUN_UNSAFE_OR_NONDETERMINISTIC`; use only the existing injected failure
suite. Không tạo full-disk condition trên owner device.

### 6.3 Lifecycle, time, idempotency và local data

| Case | Prerequisite | Steps | Exact expected result | Required coverage | Result | Evidence record |
|---|---|---|---|---|---|---|
| `E12-LIFE-01` | Relax Focus fixture | Start, background beyond a visible tick, foreground. | Remaining time derives from elapsed time; no duplicate active/terminal episode; UI matches repository state. | iOS + Android representative | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-LIFE-02` | Strict Focus fixture | Background within and beyond documented grace boundary. | Boundary behavior exactly matches policy; one terminal outcome and no reward on failure. | iOS + Android representative | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-LIFE-03` | Disposable seeded state | Force-close before terminal commit, after terminal commit, after reward, after purchase/equip; relaunch each. | Atomic state: never partial; committed result survives; reward/purchase/equip occur once. | iOS + Android representative | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-LIFE-04` | Approved time fixture | Cross midnight; change timezone/wall clock; foreground and relaunch. | Stored local-day/history policy is stable; timer/review/cooldown cannot be gained or duplicated by clock change. | iOS + Android representative | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-IDEM-01` | Fast terminal fixture | Double-tap/stale-tap/back/foreground around Focus and Break completion. | Exactly one terminal transition, reward, history row and side-effect intent per episode. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-IDEM-02` | Shop exact-balance/equip fixtures | Double tap purchase/equip; relaunch at commit boundaries. | Balance/ownership/equipped invariants hold; no negative balance or duplicate ownership mutation. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-DB-01` | Frozen candidate starts from latest previously released schema | Install previous approved build with data, upgrade candidate, relaunch. | Migration is forward-only/idempotent; data preserved; schema/checksum matches candidate. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-DB-02` | Existing migration/bootstrap failure fixture | Inject failure then Retry; separately run confirmed reset only on exact disposable DB. | Actionable recovery, bounded retry, no crash loop; cancel preserves data; confirmed reset returns safe bootstrap. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |

### 6.4 Offline, permission, provider và native capability

| Case | Prerequisite | Steps | Exact expected result | Required coverage | Result | Evidence record |
|---|---|---|---|---|---|---|
| `E12-OFF-01` | Core state seeded; online once only if install requires | Enable Airplane mode; run onboarding/Focus/Break/reward/Shop/equip/History/Settings; relaunch offline. | Core loop remains usable and durable without account/backend/network; no blocking analytics/feedback banner. | iOS + Android physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-OFF-02` | Analytics On then Off; feedback failure fixture | Offline capture/retry, toggle Off, relaunch, toggle On; submit/retry feedback. | Queue is bounded; Off blocks/clears/rotates as designed and never backfills; feedback draft is process-only; core unaffected. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-PERM-01` | Notification permission not determined, then denied | Exercise notification preference/session scheduling and open system settings path. | Denial is explained/actionable; session continues; no repeated coercive prompt or crash. | iOS + Android physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-PERM-02` | Schedule/cancel/unavailable fixtures | Inject schedule/cancel failure; foreground/background and relaunch. | Local session remains source of truth; stale notification is bounded/cancelled when possible; failures never corrupt session. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-SENS-01` | Sound/haptic On/Off and unavailable fixtures | Complete/cancel sessions with each combination; test Android silent mode and iOS device setting behavior. | Off produces no requested effect; unavailable/throw does not block terminal commit; no repeated effect after relaunch. | iOS + Android physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-FDBK-01` | Owner-approved beta feedback test endpoint | Submit valid/invalid/boundary/offline/double-tap/retry/force-close cases. | Accessible validation/success/error; one logical submit; no content in analytics/log/SQLite; no auto-resubmit after kill. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-AN-01` | Owner decision from `E12-G06` | Verify fail-closed mode, or test-project delivery if explicitly enabled; toggle privacy/reset during delayed send. | No external call without exact approved config; generation fence prevents resurrection; no content/auto-capture/profile/location. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-REVIEW-01` | Store-capable production-like Development Build | Reach exact eligibility then invoke native adapter once; also test cooldown/unavailable. | Attempt persists before native call; OS may show no prompt and that is not failure; no custom pre-prompt/outcome tracking/repeat. | iOS + Android physical | `NOT_RUN` | `<fill all §6.1 fields>` |

### 6.5 Accessibility và visual resilience

| Case | Prerequisite | Steps | Exact expected result | Required coverage | Result | Evidence record |
|---|---|---|---|---|---|---|
| `E12-A11Y-IOS` | Representative iPhone | VoiceOver traverse every production route and modal; perform core actions and errors. | Meaningful labels/roles/state/hints/order; focus follows navigation/error; no unreachable control; targets >=44pt. | iOS physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-A11Y-AND` | Representative Android | TalkBack traverse same scope and actions. | Same semantic contract independently verified; Android back/focus behavior correct. | Android physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-A11Y-TEXT` | Largest supported text/font scale | Inspect Home/onboarding/Focus/Break/result/Shop/dialog/History/Settings/Feedback/recovery. | Text wraps/scrolls; no clipped status/CTA/countdown/dialog; controls remain operable and visible. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-A11Y-VIS` | Grayscale/high contrast where available | Inspect selection, progress, graph, success/error, disabled/busy states. | Meaning never color-only; contrast/focus/selected/error cues stay distinguishable. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-A11Y-MOTION` | Reduce Motion enabled | Navigate and exercise Pet/session/result/progress transitions. | State remains visible without required animation; no flashing/jarring loop; lifecycle cleanup still correct. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |

### 6.6 Pet fallback và 30-minute benchmark

| Case | Prerequisite | Steps | Exact expected result | Required coverage | Result | Evidence record |
|---|---|---|---|---|---|---|
| `E12-PET-01` | Existing Pet lifecycle/accessibility fixtures | Force playback failure, missing state asset, idle fallback and neutral fallback; background/foreground and Reduce Motion. | Fallback order is playback → state still → idle still → neutral placeholder; semantic state never disappears; no loop/leak/crash. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-PET-02` | Owner-approved iOS minimum/representative benchmark device | Run representative normal flow continuously 30 minutes; record cold start, memory/CPU/thermal/energy and visible jank. | No crash/freeze, unbounded growth, sustained thermal/energy regression or >100ms interaction jank outside documented measurement noise. | iOS physical | `NOT_RUN` | `<fill all §6.1 fields + measurements>` |
| `E12-PET-03` | Owner-approved Android minimum/representative benchmark device | Repeat exact benchmark scenario independently. | Same exit contract; record Android-specific measurements rather than copying iOS conclusion. | Android physical | `NOT_RUN` | `<fill all §6.1 fields + measurements>` |

Threshold/device/tool must be confirmed before the benchmark. Historical EPIC-04 performance evidence on SHA
`5b3a182...` is context only and cannot PASS these final-RC rows.

### 6.7 Preview, runtime, OTA, rollback và distribution

Store-build ledger discovered from EAS metadata on 2026-09-15. `FINISHED` means the cloud build
completed; owner reports store upload completed. It does not mean same-SHA, install, review or rollout PASS.

| Platform | EAS build ID | EAS Git SHA | Version/build/runtime/channel | Build | Release-evidence result |
|---|---|---|---|---|---|
| Android | `93d77431-0b2d-435e-914e-fe90f95f07bb` | `1ca4e3f51487fe4df2cd264c18f6b90554842447` | `1.0.1` / `1` / `1.0.1` / `production` | `FINISHED`; store upload owner-reported | `FAIL` — SHA/config not reproducible and differs from latest iOS |
| iOS, first | `98fee2fe-defc-4fa7-8684-f1b5ddcbbd15` | `1ca4e3f51487fe4df2cd264c18f6b90554842447` | `1.0.1` / `1` / `1.0.1` / `production` | `FINISHED`; superseded by build 2 | `FAIL` — SHA/config not reproducible |
| iOS, latest | `d20dc640-ba5b-4d76-9bd5-96e9f9f39ed1` | `726c22e26009fff952c381408a551c0ef01d0980` | `1.0.1` / `2` / `1.0.1` / `production` | `FINISHED`; store upload owner-reported | `FAIL` — SHA/config not reproducible and differs from Android |

| Case | Prerequisite | Steps | Exact expected result | Required coverage | Result | Evidence record |
|---|---|---|---|---|---|---|
| `E12-DELIVERY-01` | Approved preview builds from frozen SHA | Install clean iOS/Android preview artifacts; launch from icon without Metro; record runtime/channel/update. | Both binaries install/launch normally, contain no fixture/prototype surface, use approved environment and same source SHA. | iOS + Android physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-DELIVERY-02` | Compatible preview update; no native/config/schema boundary change | Publish approved compatible preview update, cold relaunch/apply, run quick path. | Only intended JS/assets change; correct channel receives it; app remains durable; update ID recorded. | iOS + Android physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-DELIVERY-03` | Deliberately incompatible native/runtime candidate in safe internal environment | Verify it is not delivered to incompatible installed runtime; rebuild instead. | Runtime boundary prevents incompatible OTA; no production channel touched; no user/data corruption. | iOS + Android | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-DELIVERY-04` | Named rollback owner and last-known-good update | Rehearse republish/rollback in preview; cold relaunch and run core quick checks. | Devices converge to approved last-known-good update; data remains compatible; decision/timestamps/update IDs recorded. | iOS + Android physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-DIST-01` | Owner-confirmed iOS internal group | Deliver candidate, accept/install/update as a tester outside dev tooling. | Correct group gets correct build; launch from icon succeeds; tester-facing notes/privacy/feedback path available. | iOS physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-DIST-02` | Owner-confirmed Android internal/closed track | Deliver candidate, accept/install/update as a tester outside dev tooling. | Correct track gets correct build; no accidental production rollout; launch/update succeeds. | Android physical | `NOT_RUN` | `<fill all §6.1 fields>` |
| `E12-EXIT-01` | Every required row resolved | Audit evidence index, known issues, privacy, rollback, support/feedback, release notes and owner sign-offs. | Zero known crash/P0 beta blocker; limitations named; all PASS tied to frozen SHA; owner explicitly accepts closed-beta readiness. | Release artifact | `NOT_RUN` | `<fill all §6.1 fields>` |

## 7. Consumer regression checklist

Run on both platforms for any common component changed during EPIC-12. Untouched components still receive
the closed-beta traversal because styling/native behavior may vary by build.

| Shared surface | Required consumers |
|---|---|
| `ScreenShell`, `ScreenHeader`, `SectionLabel`, `Panel` | Onboarding, Home, Focus Setup/Session/Result, Break, Shop, History, Settings, Feedback, Recovery |
| `Button`, `PrimaryButton`, `SecondaryButton`, `ChoiceChip` | Session controls, result actions, shop dialogs, retry/reset, preferences, feedback score/submit |
| `InlineNotice`, `LoadingState`, `EmptyState`, `ErrorState`, `ConfirmationDialog` | Bootstrap/read failures, empty History/Shop, purchase/reset/feedback/provider failure |
| `CountdownDisplay`, `DurationControl`, `ToggleRow`, `StatDisplay` | Focus/Break timing, setup, Settings, reward/progression |
| `PetStage`, `PetPortrait`, `PetVisualStatus`, `PetStatusText`, `NeutralPetPlaceholder` | Home, onboarding, Focus/Break/result and fallback cases |
| `ItemGrid`, `ItemTile`, `RewardSummary`, `ProgressionSummary`, `PetCompanionStatus` | Shop/inventory/room/result/Home |

- [ ] No shared component accumulates feature business rules or persistence/provider access.
- [ ] Feature-local History graph/list and room positioning stay local unless at least two real consumers need
  the same semantic contract.
- [ ] Any touched UI component remains <=300 lines; otherwise split by responsibility before review.
- [ ] `mobile-application-context.tsx` is split before being touched or explicitly waived as a beta risk; do
  not add more responsibility to it.
- [ ] No Presentation import of SQL, concrete repository/provider, composition root or native persistence.
- [ ] Routes remain thin and delegate behavior; focus-session exception must not grow without a split.
- [ ] Static boundary and consumer tests cover any promoted common component.

## 8. Build type and evidence distinction

| Build/environment | Allowed purpose | Cannot prove |
|---|---|---|
| Local dev/Metro + fixture | Deterministic failure/time/data paths, quick smoke | Store distribution, release channel, final binary, native production configuration |
| Development Build | Native permission/audio/haptic/store-review adapter behavior plus fixtures | Exact preview/production artifact or tester delivery |
| Preview/internal candidate | Install, runtime/channel/OTA, offline/normal-launch, beta-like behavior | Production rollout; native change via OTA |
| Release/closed-beta candidate | Final approved internal artifact and track/group | Broader production readiness unless separately accepted |

Native dependency, app config, permission text, runtime policy or SQLite migration change requires a new
native build and a new frozen RC SHA. OTA không được dùng để vượt native/runtime/schema boundary.

## 9. Safe cleanup và normal-launch verification

Trước khi cleanup, chụp lại panel có exact disposable database. Dùng documented confirmed-reset flow chỉ
khi cần và chỉ khi panel vẫn chỉ đúng database đó.

```sh
unset EXPO_PUBLIC_EPIC_02_EXIT_PROBE
unset EXPO_PUBLIC_EPIC_02_TARGET_KIND
unset EXPO_PUBLIC_EPIC_05_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_07_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_08_ROOM_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_10_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_11_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] Stop Metro trước khi đổi/unset fixture.
- [ ] Không dùng wildcard/glob hoặc file deletion trong cleanup.
- [ ] Launch lại từ icon/normal entry; không còn dev fixture/probe panel hoặc prototype control.
- [ ] Normal launch dùng `pixeldoro.db`, nhưng tester không mở/đọc/reset database đó.
- [ ] Core routes mở được; không có seeded test data hoặc auto-completion clock.
- [ ] Xóa/redact temporary evidence nhạy cảm theo §2.2.
- [ ] Ghi cleanup result cho từng evidence row.

## 10. Go/no-go summary

| Gate | Required to ship closed beta | Current result | Evidence/owner |
|---|---|---|---|
| EPIC-11 owner closure + MVP feature-complete | Yes | `PASS` | `EPIC12-CONFIRM-01=A`, 2026-09-14 |
| Frozen same-SHA iOS/Android candidate | Yes | `FAIL` | Prior SHA `59cb87c...` invalidated; uploaded Android/iOS artifacts are dirty-source and cross-SHA; replacement awaits clean evidence/harness commit and owner re-freeze |
| Automated hardening and boundary checks | Yes | `PASS` | Product/config baseline and current evidence/harness worktree quality PASS: 220 test files / 1,109 tests; prior Expo Doctor `21/21` |
| EPIC-02 same-SHA durability pair | Yes | `NOT_RUN` | `<fill>` |
| Lifecycle/offline/idempotency/migration/reset | Yes | `NOT_RUN` | `<fill>` |
| Notification/audio/haptic/provider/store-review | Yes, except explicitly accepted external limitation | `NOT_RUN` | `<fill>` |
| Accessibility minimum + representative matrix | Yes | `BLOCKED` | `CONFIRM-03=A`; exact device/OS inventory and `CONFIRM-10` remain pending |
| Pet fallback + 30-minute benchmark | Yes | `NOT_RUN` | `CONFIRM-09` |
| Preview/runtime/OTA/rollback rehearsal | Yes | `BLOCKED` | Existing store builds fail exact-source gate; `CONFIRM-08` pending |
| iOS/Android internal distribution | Yes | `BLOCKED` | Upload owner-reported, but artifacts fail exact-source gate; exact group/track, tester install and `CONFIRM-04/07` remain pending |
| Evidence index, release notes, known issues, support path | Yes | `NOT_RUN` | `<fill>` |
| Zero known crash/P0 blocker and explicit owner acceptance | Yes | `NOT_RUN` | `CONFIRM-12` |

Current verdict: `NO_GO — CANDIDATE_INVALIDATED / REFREEZE_AND_CLEAN_REBUILD_REQUIRED`.

Không đổi verdict thành GO cho đến khi mọi required row là PASS trên frozen SHA, mọi BLOCKED được owner
giải quyết hoặc chấp nhận rõ ràng theo policy, và owner ghi chính xác `EPIC-12 DONE_OWNER_ACCEPTED` cùng
`CLOSED_BETA_READY`.

## 11. Evidence index template

| Case | Result | Exact SHA | Platform/device/OS | Build/runtime/channel | Network/app/a11y | Tester/timezone | Artifact | Cleanup | Blocker owner/next |
|---|---|---|---|---|---|---|---|---|---|
| `E12-Q01→Q10` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-RC-01` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-DATA-IOS` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-DATA-AND` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-LIFE-01→04` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-IDEM-01→02` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-DB-01→02` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-OFF-01→02` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-PERM-01→02` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-SENS-01` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-FDBK-01` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-AN-01` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-REVIEW-01` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-A11Y-*` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-PET-01→03` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-DELIVERY-01→04` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |
| `E12-DIST-01→02` | `BLOCKED` | `<REFREEZE_REQUIRED>` | iOS/Android | IDs in §6.7; exact group/track `<fill>` | `<fill>` | Owner report 2026-09-15 | Store upload reported; install evidence missing | `<fill>` | Re-freeze/rebuild, record group/track, install/launch |
| `E12-EXIT-01` | `NOT_RUN` | `<REFREEZE_REQUIRED>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` | `<fill>` |

Không gộp range trong evidence artifact thực tế: khi chạy, tách một row cho từng case và từng platform.
