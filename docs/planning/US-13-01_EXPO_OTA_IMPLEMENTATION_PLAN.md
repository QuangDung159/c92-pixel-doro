---
document_id: PIXELDORO_US_13_01_EXPO_OTA_IMPLEMENTATION_PLAN
title: PixelDoro — Expo OTA Quick Update & Hotfix Delivery Plan
version: 0.1.0
status: READY_FOR_OWNER_REVIEW
date: 2026-09-15
owner: Dũng Lư
scope: POST_MVP_OPERATIONAL_DELIVERY
implementation_status: NOT_STARTED
depends_on:
  - ./EPIC-12_EXIT_REPORT.md
  - ../architecture/decisions/ADR-007-eas-delivery-pipeline.md
---

# US-13-01 — Expo OTA quick update và hotfix

## 1. User story

Là developer, tôi muốn phân phối nhanh các thay đổi JavaScript/TypeScript và asset tương thích đến người
dùng qua Expo OTA, để có thể sửa lỗi hoặc cải thiện nhỏ mà không phải tạo và chờ duyệt một store build mới.

Đây là capability vận hành hậu MVP. Nó không mở lại EPIC-12 và không tự cấp quyền publish production.

## 2. Outcome và phạm vi

### Outcome

- Một hotfix tương thích native được kiểm tra, phát hành QA/staging, promote đúng artifact sang production,
  rollout tăng dần và có thể rollback.
- Người dùng nhận update không chặn cold start; update đã tải chỉ được activate ở thời điểm an toàn.
- Mọi update truy được về Git SHA, runtime version, platform, channel, environment và EAS update group.
- Native-incompatible change bị chặn trước publish và được chuyển sang store-build flow.

### Trong phạm vi

- EAS Update cho Android/iOS.
- `qa`, `staging`, `production` channel và EAS environment tương ứng.
- Runtime/app-version guard, clean-source guard và publish metadata.
- Client check/download/apply lifecycle.
- Phased rollout, monitoring, republish/rollback và embedded fallback rehearsal.
- Runbook, automated checks và physical-device evidence tối thiểu.

### Ngoài phạm vi

- Thay Expo SDK, React Native hoặc native dependency bằng OTA.
- Permission, entitlement, config plugin, bundle/package ID, native app icon/splash hoặc native setting change.
- Database/schema migration hoặc persisted-data semantic không backward/rollback compatible.
- Tự động publish production khi merge.
- Né App Store/Google Play policy bằng OTA.
- Store binary update popup; flow đó độc lập và chỉ dựa trên native store version.

## 3. Current-state audit

| Capability | Current state | Gap |
|---|---|---|
| `expo-updates` | Đã cài `~57.0.22` và có config plugin | Chưa có product-facing adoption controller/evidence |
| Update URL | Đã trỏ `https://u.expo.dev/6f65fb79-ffe9-4fa6-9951-895f27bf0725` | Cần xác minh trong binary đã phân phối |
| Runtime policy | `appVersion`; app hiện tại `1.0.1` | Chưa có guard ngăn publish từ runtime sai |
| Channels | Có development/preview/qa/staging/production | `staging` đang kế thừa environment `preview`, chưa phù hợp exact-bundle promotion sang production |
| Startup behavior | Expo mặc định `ON_LOAD`, `fallbackToCacheTimeout: 0` | Update thường activate ở lần mở sau; chưa có safe-restart UX |
| Publish command | Chưa có wrapper ở root | Chưa enforce quality, clean SHA, environment, message và target |
| Rollback | ADR đã nêu republish known-good | Chưa rehearsal hoặc có evidence template |

## 4. Quyết định thiết kế đề xuất

### 4.1. Runtime compatibility

Giữ `runtimeVersion: { policy: "appVersion" }`.

- Store binary `1.0.1` chỉ nhận OTA có runtime `1.0.1` và đúng platform/channel.
- Mỗi store release bump app version để tạo native runtime boundary mới.
- Hotfix cho runtime cũ phải bắt đầu từ tag/branch của chính runtime đó, không publish từ nhánh đã bump
  app version.
- Store force-update không bị OTA kích hoạt vì OTA không đổi `nativeApplicationVersion`.

### 4.2. Environment và promotion

Áp dụng persistent release-candidate flow:

```text
local quality
  → qa channel + preview environment
  → staging channel + production environment
  → republish exact staging update group sang production
  → rollout 10% → 50% → 100%
```

- `qa`: kiểm thử sớm, được phép dùng preview variables.
- `staging`: release candidate dùng chính production variables nhưng chỉ tới tester build/channel.
- `production`: không bundle lại từ source sau khi staging PASS; promote/republish đúng update group đã test.
- Trước implementation, đổi `build.staging.environment` từ giá trị kế thừa `preview` sang `production`.

### 4.3. Client adoption

- Không block cold start để chờ mạng; giữ `fallbackToCacheTimeout: 0`.
- Giữ automatic `ON_LOAD` để có early error recovery và background download.
- Khi app foreground, throttle manual check; không tạo request song song.
- Nếu update đã tải:
  - đang Home/History/Shop/Settings và không có session active: hiện dialog không ép buộc
    `Bản vá đã sẵn sàng` với `Khởi động lại` và `Để sau`;
  - đang Focus/Break hoặc terminal transition: trì hoãn dialog tới safe boundary;
  - user chọn restart: gọi `Updates.reloadAsync()` sau khi đã xác nhận update pending;
  - user bỏ qua: update tự chạy ở cold start kế tiếp.
- Offline, Expo Go, development runtime hoặc update error: im lặng và không ảnh hưởng core flow.
- Không dùng native store force-update popup cho OTA.

### 4.4. Rollout và rollback

- Production mặc định rollout `10%`, quan sát rồi tăng `50%`, sau đó `100%`.
- Chỉ một rollout cùng runtime/channel tại một thời điểm.
- P0/P1 hoặc startup regression: dừng rollout và rollback về update known-good.
- Nếu previous update không an toàn với persisted state: fix-forward, không republish mù.
- Embedded rollback là phương án cuối và phải được rehearsal trên staging trước.

## 5. OTA eligibility matrix

| Loại thay đổi | OTA? | Rule |
|---|---:|---|
| TypeScript/JavaScript business hoặc presentation fix | Có | Không phụ thuộc native API mới |
| Style, text, localization | Có | Store metadata không nằm trong OTA |
| Image/audio/font được Metro bundle | Có | Kiểm tra asset size và tải hoàn chỉnh |
| Thêm/sửa analytics call hiện có | Có điều kiện | Không thêm native SDK/config/key bí mật |
| Thay native dependency hoặc Expo SDK | Không | Bump app version và build mới |
| `app.config.ts`, config plugin, permission, entitlement | Không mặc định | Classify native; build mới nếu ảnh hưởng native output |
| iOS build number / Android version code | Không | Store build only |
| Schema migration hoặc destructive data rewrite | Không trong scope này | Store build + forward/rollback compatibility plan riêng |
| Đổi API contract/env public | Có điều kiện | Staging phải dùng production environment và backward compatible |

## 6. Implementation work breakdown

### OTA-T01 — Runtime và config baseline

- [ ] Xác minh production binary hiện có chứa đúng project ID, channel và runtime `1.0.1` trên cả iOS/Android.
- [ ] Đặt explicit `updates.checkAutomatically: "ON_LOAD"` và `fallbackToCacheTimeout: 0` để config không
  phụ thuộc default ngầm.
- [ ] Sửa `staging.environment` thành `production`; giữ `qa.environment` là `preview`.
- [ ] Ghi release tag convention: `mobile/runtime-<appVersion>-embedded`.
- [ ] Không publish bất kỳ update nào trong task config này.

### OTA-T02 — Fail-closed OTA classifier và publish wrapper

- [ ] Tạo `scripts/run-mobile-update.mjs` dùng cùng clean-source/SHA guard với mobile build wrapper.
- [ ] Input bắt buộc: target `qa|staging|production`, platform, message và expected runtime.
- [ ] Chạy root quality trước publish.
- [ ] Resolve Expo config và fail nếu expected runtime khác runtime thực tế.
- [ ] Fail khi diff/candidate chứa native-incompatible surface: native dependency, SDK, plugin, permission,
  entitlement, generated native project hoặc schema migration.
- [ ] Luôn truyền explicit `--channel` và `--environment`; SDK 57 không dựa vào local `.env` cho update.
- [ ] Production cần cờ xác nhận riêng và chỉ nhận staging update-group ID đã PASS; không publish trực tiếp.
- [ ] Lưu sanitized JSON receipt: SHA, runtime, channel, environment, platform, message, group ID và timestamp.

### OTA-T03 — Client update lifecycle

- [ ] Tạo application controller/state machine `idle/checking/downloading/ready/restarting/error`.
- [ ] Tạo Expo Updates adapter; Presentation chỉ đọc projection và phát intent.
- [ ] Theo dõi `useUpdates()` hoặc equivalent subscription, không poll liên tục.
- [ ] Check lúc foreground với throttle tối thiểu 15 phút mỗi process.
- [ ] Tải update best-effort; không reload khi Focus/Break/commit transition đang active.
- [ ] Reuse `ConfirmationDialog` cho safe-restart prompt có thể dismiss.
- [ ] Không log manifest headers, token hoặc secret environment values.

### OTA-T04 — Automated validation

- [ ] Unit: runtime equality/mismatch, eligibility allow/deny matrix và missing config.
- [ ] Unit: single-flight, throttle, offline/error, pending update và safe-session gate.
- [ ] Unit: update mới không gọi reload trước user intent; reload failure không crash app.
- [ ] Integration: active Focus/Break trì hoãn prompt; terminal persistence hoàn tất trước reload.
- [ ] Script test: dirty tree, wrong runtime, forbidden diff, wrong environment và production bypass đều fail.
- [ ] Root quality, boundary validation và repository hygiene PASS.

### OTA-T05 — QA/staging rehearsal

- [ ] Build staging binary một lần cho runtime hiện tại nếu chưa có binary đúng channel.
- [ ] Publish harmless observable marker lên `qa`; verify Android/iOS nhận đúng runtime.
- [ ] Publish release candidate lên `staging` bằng production environment.
- [ ] Kiểm tra cold start, foreground download, safe restart, offline launch và core smoke.
- [ ] Xác minh History/XP/Coin/inventory/settings giữ nguyên qua reload.
- [ ] Ghi EAS build/update IDs, exact SHA, runtime, channel, platform và screenshots.

### OTA-T06 — Rollback và production rollout

- [ ] Rehearse rollback staging về known-good update group.
- [ ] Rehearse rollback-to-embedded và sau đó publish lại update tốt.
- [ ] Xác minh rollback không làm thay đổi/downgrade local database.
- [ ] Sau owner approval, republish exact staging group sang production ở 10%.
- [ ] Theo dõi adoption/failed install/startup regression trước 50% và 100%.
- [ ] Lưu production and rollback receipt; không tự động hóa production promotion trong iteration đầu.

## 7. Acceptance criteria

1. **Compatible hotfix:** Given production binary runtime `R`, when exact staging update group runtime `R`
   được owner promote, then production users cùng platform/channel nhận update mà không cần store build mới.
2. **TestFlight/newer binary:** Binary runtime khác không nhận update; không có cross-runtime delivery.
3. **Native boundary:** Candidate thêm native dependency/config/plugin/permission hoặc schema migration bị
   wrapper chặn trước EAS publish.
4. **Safe adoption:** Active Focus/Break không bị reload; prompt chỉ xuất hiện tại safe boundary hoặc update
   chạy ở cold start tiếp theo.
5. **Offline:** Không mạng vẫn mở embedded/last-known-good bundle và core data hoạt động.
6. **Exact promotion:** Production chạy cùng update group đã PASS trên staging, không phải bundle mới tạo lại.
7. **Rollback:** Known-good republish và embedded rollback đều có staging evidence; persisted product truth
   không bị xóa hoặc downgrade.
8. **Observability:** Có thể xác định update nào đang chạy theo update ID/runtime/channel/platform và xem
   adoption/failed-install metrics mà không thu thập nội dung người dùng.

## 8. Release evidence template

| Field | Required |
|---|---|
| Git SHA / source clean | Yes |
| App version / runtime version | Yes |
| Platform | Android + iOS |
| Source channel / environment | Yes |
| EAS update group ID | Yes |
| QA/staging smoke result | Yes |
| Core data before/after | Sanitized fingerprint only |
| Rollout percentage | Production only |
| Adoption / failed installs | Production only |
| Rollback target and owner | Yes |
| Secret/token values | Never |

## 9. Risks và controls

| Risk | Control |
|---|---|
| JS calls native API absent from installed binary | Runtime + forbidden-diff guard; store build required |
| Preview variables leak into production bundle | Staging uses production EAS environment; exact group promotion |
| Bad update reaches all users | 10/50/100 rollout and stop/revert gate |
| Reload interrupts a timer transaction | Safe-session gate; no automatic foreground reload |
| Rollback breaks newer persisted data | No schema/destructive OTA; compatibility test; fix-forward when unsafe |
| Large assets slow adoption | Update asset inventory/size evidence; keep hotfix small |
| Broken launch prevents recovery | Keep automatic early check, stage first, retain embedded/known-good rollback |
| Wrong runtime receives update | `appVersion` policy plus runtime verification before publish |

## 10. Owner decisions before implementation

| ID | Decision | Recommended option |
|---|---|---|
| `OTA-CONFIRM-01` | Adoption UX | **A:** non-blocking download + safe-restart prompt; never interrupt active session |
| `OTA-CONFIRM-02` | Promotion topology | **A:** QA(preview env) → staging(production env) → exact-group production |
| `OTA-CONFIRM-03` | Production rollout | **A:** 10% → 50% → 100%; manual approval at each step |
| `OTA-CONFIRM-04` | Data changes | **A:** no schema/destructive persisted-data change through OTA |
| `OTA-CONFIRM-05` | Code signing | **A:** defer until EAS plan/cost owner approves; keep as separate hardening gate |

Implementation may start after `OTA-CONFIRM-01→04` are accepted. Production publish, rollout mutation and
rollback remain separately owner-authorized external actions even after implementation approval.

## 11. Definition of done

- [ ] T01–T06 complete with automated and device evidence.
- [ ] At least one harmless Android+iOS staging OTA is received and safely activated on matching runtime.
- [ ] Native-incompatible negative case cannot publish.
- [ ] Exact staging group promotion flow is proven without regenerating bundle.
- [ ] Staging rollback restores known-good behavior and preserves product data.
- [ ] Production rollout runbook names approver, stop condition and rollback target.
- [ ] Owner accepts `US-13-01 DONE`; production deployment is not inferred from Story completion.

## 12. References

- [Expo — Deploy updates](https://docs.expo.dev/eas-update/deployment/)
- [Expo — Downloading updates](https://docs.expo.dev/eas-update/download-updates/)
- [Expo — Runtime versions](https://docs.expo.dev/eas-update/runtime-versions/)
- [Expo — Rollouts](https://docs.expo.dev/eas-update/rollouts/)
- [Expo — Rollbacks](https://docs.expo.dev/eas-update/rollbacks/)
- [Expo — Error recovery](https://docs.expo.dev/eas-update/error-recovery/)
- [Expo — EAS environment variables](https://docs.expo.dev/eas/environment-variables/usage/)
- [Expo — Update code signing](https://docs.expo.dev/eas-update/code-signing/)
