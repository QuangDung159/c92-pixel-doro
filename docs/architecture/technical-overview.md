---
document_id: PIXELDORO_TECHNICAL_OVERVIEW
title: PixelDoro Mobile MVP — Technical Overview
version: 1.0.0
status: APPROVED
last_updated: 2026-08-26
owner: Dũng Lư
approved_by: Dũng Lư
approver_role: Tech Lead
approved_at: 2026-08-26
language: vi
scope:
  - mobile_mvp
  - technical_direction
authority: SECONDARY
source_of_truth: ../PIXELDORO_CORE_TRUTH.md
---

# PixelDoro Mobile MVP — Technical Overview

## 0. Vai trò và phạm vi tài liệu

Tài liệu này mô tả định hướng kỹ thuật cấp cao cho Mobile MVP của PixelDoro trên iOS và Android. Đây là cầu nối giữa [Product Core — Single Source of Truth](../PIXELDORO_CORE_TRUTH.md) và các đặc tả chi tiết về kiến trúc, timer, session, Pet, gamification và dữ liệu.

Tài liệu này quyết định **dùng công nghệ nào, các thành phần chịu trách nhiệm gì và những ràng buộc nào phải được bảo vệ**. Tài liệu này không thay thế:

- `system-architecture.md` cho dependency direction và data flow chi tiết.
- `project-structure.md` cho cấu trúc thư mục, naming và import boundary.
- Các specification cho state machine, gameplay rule và edge case.
- `data-model.md` cho schema, constraint, index và migration.

Khi có mâu thuẫn về ý nghĩa sản phẩm hoặc phạm vi MVP, [Product Core](../PIXELDORO_CORE_TRUTH.md) được ưu tiên. Thay đổi một quyết định kỹ thuật quan trọng phải cập nhật ADR tương ứng trước hoặc đồng thời với implementation.

### 0.1. Trạng thái quyết định

| Trạng thái | Ý nghĩa trong tài liệu này |
|---|---|
| `LOCKED` | Đã được Product Core khóa; implementation phải tuân theo. |
| `MVP_DEFAULT` | Mặc định kỹ thuật cho MVP; chỉ thay đổi qua review có chủ đích và ADR. |
| `PROPOSED` | Đề xuất kỹ thuật đang chờ reviewer/tech lead phê duyệt. |
| `GATED` | Đã chốt điều kiện đánh giá; chưa được đưa vào baseline cho tới khi vượt acceptance gate. |
| `OPEN` | Chưa quyết định; có owner và thời điểm cần chốt. |
| `DEFERRED` | Không thuộc Mobile MVP. |

## 1. Technical summary

PixelDoro Mobile MVP là một ứng dụng React Native viết bằng TypeScript, chạy trên iOS và Android bằng Expo Development Build. Ứng dụng hoạt động offline-first, không yêu cầu tài khoản và không phụ thuộc backend để hoàn thành core focus loop.

SQLite là nguồn sự thật bền vững trên thiết bị. Zustand giữ state phục vụ UI và orchestration trong bộ nhớ, nhưng không thay thế database. Timer dựa trên timestamp đã persist và được reconcile khi app foreground hoặc khởi động lại; JavaScript interval chỉ dùng để vẽ countdown. Domain được viết bằng TypeScript thuần và truy cập notification, app lifecycle, database, analytics, feedback, audio và haptic qua interface/adapter.

## 2. Mục tiêu kỹ thuật của Mobile MVP

1. Timer và kết quả session vẫn đúng sau background, foreground và relaunch thông thường.
2. Một completed session chỉ được cấp XP/Coin tối đa một lần.
3. Core loop hoạt động khi thiết bị không có mạng và khi notification permission bị từ chối.
4. UI, Pet state và history luôn có thể được dựng lại từ dữ liệu đã persist.
5. Business rule có thể test mà không cần React Native runtime hoặc thiết bị thật.
6. Tích hợp platform nằm sau adapter để core domain có thể được tái sử dụng trong tương lai.
7. Pixel art và animation giữ được bản sắc nhưng không làm giảm khả năng đọc, accessibility, pin hoặc độ ổn định.

## 3. Nền tảng và technology stack

### 3.1. Stack đã chọn

| Hạng mục | Lựa chọn | Trạng thái | Vai trò và giới hạn |
|---|---|---|---|
| Nền tảng | iOS và Android | `LOCKED` | Desktop và web không phải release target của MVP. |
| Application framework | React Native | `LOCKED` | Chia sẻ UI/application code giữa hai nền tảng, vẫn cho phép native adapter khi cần. |
| Ngôn ngữ | TypeScript | `LOCKED` | Domain model, use case, adapter contract và UI đều dùng TypeScript. |
| Type policy | TypeScript strict type checking | `MVP_DEFAULT` | Hạn chế `any` tại boundary; exception phải được cô lập và giải thích. |
| Tooling/runtime | Expo Development Build | `LOCKED` | Development và kiểm thử native capability dùng development build; Expo Go không phải môi trường acceptance chính. |
| Navigation | Expo Router, typed routes | `MVP_DEFAULT` | File-based routing cho onboarding, Home, Focus, Result, Break, Shop, History, Settings và Feedback. Route file chỉ làm composition; không chứa business rule. |
| Client state | Zustand | `MVP_DEFAULT` | Giữ UI state, derived state và application coordination. Không dùng Zustand làm durable source of truth. |
| Local database | SQLite qua `expo-sqlite` | `MVP_DEFAULT` | Lưu session, reward ledger, Pet profile, inventory, settings và migration metadata. Screen không query SQLite trực tiếp. |
| Animation | React Native Reanimated + bundled sprite assets | `MVP_DEFAULT` | Baseline đã chấp nhận cho UI transition, Pet state animation và feedback; sprite asset là nguồn hình ảnh chính. |
| Complex graphics | React Native Skia | `GATED` | Không cài trong baseline. Chỉ thêm sau prototype/benchmark vượt adoption gate trong ADR-005. |
| Notification | Local notification qua `expo-notifications` | `LOCKED` | Chỉ nhắc Focus/Break kết thúc. Notification không quyết định session result hoặc reward eligibility. |
| Analytics | PostHog Cloud EU sau application adapter | `MVP_DEFAULT` | Anonymous product analytics, manual allowlist only; cấm autocapture, session replay và person profile. Giới hạn dữ liệu, queue và chi phí theo mục 8.1 cùng ADR-008. |
| Product feedback | In-app popup/screen qua feedback adapter | `LOCKED` | Thu experience score 1–5 sao và nội dung tùy chọn; độc lập với store rating/review. |
| Store review | `expo-store-review` dùng native system review APIs | `LOCKED` | Không custom store prompt, review gating hoặc incentive. |
| OTA update | EAS Update | `LOCKED` | Chỉ phát hành JavaScript, styling và asset tương thích với native runtime. |
| Build/submission pipeline | EAS Build + EAS Submit + EAS Workflows | `LOCKED` | Build signed binary và upload tới App Store Connect/Google Play; public release vẫn theo store approval/promotion. |
| Signing credentials | EAS-managed remote credentials | `LOCKED` | EAS quản lý Android keystore/upload key, iOS distribution certificate và provisioning profile; secret không nằm trong repository. |

Expo khuyến nghị Expo Router cho dự án Expo mới; Expo Router cũng cung cấp file-based routing và typed routes. `expo-sqlite` cung cấp database được persist qua app restart. Reanimated thực thi animation trên UI thread; Skia có thêm chi phí binary đáng kể nên chỉ được đưa vào sau một technical spike. Xem [Expo Router](https://docs.expo.dev/router/introduction/), [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/), [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/) và [React Native Skia](https://shopify.github.io/react-native-skia/docs/getting-started/installation/).

### 3.2. Quản lý phiên bản

- Mobile MVP dùng Expo SDK `57.x` stable với React Native `0.86.x` và React `19.2.3`.
- Node.js dùng dòng 22 LTS, range `>=22.13.0 <23.0.0`; exact Node patch được pin trong `.nvmrc` hoặc `.tool-versions` khi scaffold ứng dụng.
- React Native New Architecture và Hermes là runtime baseline.
- Minimum platform là iOS `16.4` và Android `7.0`/API `24`; Android `compileSdkVersion` và `targetSdkVersion` là API `36`; Xcode tối thiểu `26.4`.
- Expo SDK và các package Expo/native chỉ dùng stable channel; không dùng beta, canary hoặc nightly cho MVP.
- Package Expo/native được cài bằng `npx expo install` để lấy version tương thích với SDK `57.x`; exact dependency tree được pin bằng lockfile và commit cùng source code.
- Package có native code phải được cài bằng phiên bản tương thích với Expo SDK đang pin và phải tạo lại development build sau khi native dependency thay đổi.
- Không nâng React Native độc lập với Expo SDK.
- Không nâng Expo SDK, React Native, database hoặc animation major version trong cùng một thay đổi với gameplay rule.
- Expo SDK major/minor được giữ ở dòng `57.x` từ khi bắt đầu implementation đến hết closed beta. Patch update chỉ được nhận sau compatibility check và acceptance test; security fix hoặc release blocker được ưu tiên xử lý.
- Mỗi lần nâng major version phải chạy lại acceptance test cho timer recovery, notification, database migration và animation trên cả iOS lẫn Android.
- EAS Update dùng `runtimeVersion` policy `appVersion`. Mọi thay đổi native dependency, Expo SDK, permission hoặc native configuration phải bump app version và tạo binary mới trước khi phát hành update tương ứng.

Baseline này tuân theo compatibility matrix của [Expo SDK 57](https://docs.expo.dev/versions/latest/). Phiên bản cụ thể của Expo Router, SQLite, Notifications, Reanimated và Worklets phải theo kết quả của `npx expo install` tại thời điểm scaffold, thay vì được nâng độc lập.

## 4. Kiến trúc cấp cao

Mobile app tuân theo bốn vùng trách nhiệm; chi tiết sẽ được khóa trong `system-architecture.md`:

```text
Presentation (routes, screens, components)
                  ↓
Application (use cases, orchestration, ports)
                  ↓
Domain (entities, policies, state transitions)
                  ↓
Infrastructure (SQLite, notification, lifecycle, analytics adapters)
```

Các dependency compile-time phải hướng vào abstraction/domain. Infrastructure triển khai port do Application/Domain định nghĩa; Domain không import Infrastructure.

### 4.1. Ranh giới bắt buộc

- Domain không import React, React Native, Expo, Zustand, SQLite hoặc thư viện UI.
- Screen/route không truy cập SQLite, notification hoặc analytics SDK trực tiếp.
- Platform API phải đi qua interface/adapter và trả về kiểu dữ liệu do ứng dụng sở hữu.
- Route chỉ chịu trách nhiệm navigation, composition và truyền input đã validate vào application use case.
- Repository là lối vào duy nhất cho dữ liệu bền vững; mọi SQL nằm trong Infrastructure.
- Zustand store gọi application use case/repository abstraction, không chứa công thức reward hoặc session transition riêng.

## 5. State ownership và data flow

### 5.1. Nguồn sự thật

| Loại state | Nguồn sự thật | Ví dụ |
|---|---|---|
| Durable product state | SQLite | Session, reward transaction, XP/Coin, inventory, settings. |
| Active session truth | Record đã persist + timestamp hiện tại | `startedAt`, `endsAt`, `mode`, `status`, `backgroundedAt`, `resolvedAt`, `rewardClaimedAt`. |
| UI/derived state | Zustand, có thể dựng lại | Countdown đang hiển thị, selected tab, loading/error, Pet state được map từ session. |
| Ephemeral visual state | Component/Reanimated | Animation progress, gesture state, transient celebration timing. |

Zustand được hydrate từ repository. App không được coi state còn trong memory là bằng chứng duy nhất rằng session đã hoàn thành hoặc reward đã được cấp.

### 5.2. Focus session flow tối thiểu

```text
User action
  → Application use case validate input
  → Domain tạo/transition session
  → Repository persist session
  → Notification adapter schedule best-effort
  → Zustand/UI nhận projection mới
  → App background/foreground/relaunch
  → Reconciliation đọc SQLite + current timestamp
  → Domain resolve terminal status
  → Transaction persist status + reward ledger (nếu eligible)
  → UI/Pet render từ kết quả đã persist
```

Notification schedule thất bại hoặc permission bị từ chối không được rollback một session hợp lệ. Analytics/feedback network failure cũng không được chặn core loop.

## 6. Timer, lifecycle và consistency constraints

Các ràng buộc dưới đây là `LOCKED` theo Product Core:

- Countdown truth được tính từ timestamp; không tích lũy số tick của `setInterval`.
- Khi app start hoặc trở lại foreground, hệ thống phải đọc active session và reconcile trước khi hiển thị kết quả cuối.
- Relax Mode không fail khi app rời foreground.
- Strict Mode Lite dùng grace period 10 giây và so sánh `violationAt` với `endsAt` đúng theo Product Core.
- `completed`, `failed` và `cancelled` là terminal; không transition trở lại `running`.
- Reward grant gắn với `sessionId` duy nhất và phải idempotent.
- Việc resolve terminal status và ghi reward ledger phải nằm trong một database transaction hoặc cơ chế atomic tương đương.
- Notification là side effect hỗ trợ trải nghiệm, không phải clock và không phải bằng chứng completion.
- Thay đổi timezone chỉ ảnh hưởng cách trình bày/history theo ngày local; elapsed session truth dùng absolute timestamp.

Chi tiết về clock source, device-time change, restart, race condition và edge case thuộc `timer-engine.md` và `session-lifecycle.md`.

## 7. Offline-first

### 7.1. Core loop không phụ thuộc mạng

Các hành vi sau phải hoạt động ở airplane mode sau khi app đã được cài:

- Onboarding và Home/Pet Room.
- Bắt đầu, theo dõi, reconcile và kết thúc Focus/Break session.
- Relax Mode và Strict Mode Lite.
- Cấp XP/Coin, cập nhật Pet/progression và inventory local.
- History, contribution graph và settings.
- Local notification nếu hệ điều hành đã cấp quyền.
- Reset/xóa toàn bộ dữ liệu local.

Analytics và feedback có thể cần mạng nhưng phải là side effect best-effort. Nếu MVP cần queue event offline, queue phải có giới hạn, không chứa nội dung nhạy cảm và không làm chậm transaction của core loop.

### 7.2. Không có server authority trong MVP

- Không authentication, account, cloud sync hoặc backend bắt buộc.
- Không chờ server để start/complete session hoặc claim reward.
- Không thiết kế schema như thể remote ID hoặc conflict resolution đã tồn tại.
- Mọi khả năng sync tương lai phải được thêm bằng migration và ADR riêng, không làm phức tạp MVP hiện tại.

## 8. Privacy-first và data minimization

- Dữ liệu sản phẩm mặc định nằm trên thiết bị.
- Không thu free-text task content; MVP chỉ có các work tag đã khóa trong Product Core.
- Anonymous analytics chỉ chứa event name và các thuộc tính cần trực tiếp cho core metrics, ví dụ duration bucket, mode và terminal status.
- Không gửi Pet name, device contact, nội dung cá nhân hoặc database record thô vào analytics.
- Analytics SDK không được truy cập trực tiếp từ screen; adapter phải enforce allowlist event/property.
- Không dùng advertising identifier, cross-app tracking hoặc push token từ server trong MVP.
- Permission notification được xin trong context có giải thích giá trị; từ chối permission không làm hỏng timer.
- Settings phải cho phép reset/xóa toàn bộ dữ liệu local. Chi tiết xóa dữ liệu và retention sẽ được định nghĩa trong `data-model.md`.
- Không ghi session payload, Pet name hoặc nội dung có thể nhận dạng người dùng vào production log/crash breadcrumb.

### 8.1. Analytics limits và cost guardrails

Mobile MVP dùng PostHog Cloud EU cho product analytics. SDK phải nằm sau analytics adapter do ứng dụng sở hữu; provider không được trở thành dependency của Domain hoặc core flow. Analytics luôn là side effect best-effort và không được làm chậm hoặc làm thất bại start/complete session, reward transaction hay navigation.

Các giới hạn bắt buộc:

| Nhóm | Giới hạn Mobile MVP |
|---|---|
| Identity | Chỉ dùng anonymous installation ID ngẫu nhiên; `person_profiles` phải tắt. Không dùng account ID, advertising ID, IDFA/GAID, contact, push token hoặc cross-app identifier. |
| Collection | Manual allowlist only. Tắt autocapture, screen/touch capture, app lifecycle autocapture, session replay và GeoIP enrichment. Không gửi analytics từ development, test hoặc preview automation. |
| Event schema | Chỉ core product events đã được review; tối đa 20 custom properties/event và tối đa 2 KiB cho serialized custom payload. Không gửi free text hoặc raw database record. |
| Local queue | Tối đa 1.000 events/device; event hết hạn sau 7 ngày. Khi đầy, bỏ event cũ nhất và ghi local counter không chứa payload. Queue/retry không được chạy trong core database transaction. |
| Delivery | Batch bất đồng bộ; retry exponential backoff khi có mạng. Mỗi event có `eventId` để hỗ trợ deduplication; delivery là at-least-once, không giả định exactly-once. |
| Reset/opt-out | Settings cho phép tắt analytics. Opt-out hoặc reset data phải xóa local queue, xóa/rotate anonymous installation ID và dừng capture ngay lập tức. |
| Provider retention | Raw event retention phía provider không vượt quá 12 tháng trong MVP; phải review nhu cầu giảm retention trước public beta và không export bản sao dài hạn ngoài kế hoạch dữ liệu đã duyệt. |
| Event budget | Ngân sách lập kế hoạch tối đa 250 events/MAU/tháng. Đây là aggregate cost budget; terminal core events không được âm thầm bỏ chỉ vì một người dùng hoạt động nhiều. |
| Spend ceiling | Billing limit ban đầu là `US$50/tháng`, không tự tăng. Cảnh báo tại 50%, 75% và 90% của cả monthly event budget lẫn spend ceiling. |
| Review threshold | Review schema, sampling và provider khi đạt 500.000 events/tháng; bắt buộc phê duyệt lại chi phí trước khi vượt 1.000.000 events/tháng hoặc tăng billing limit. |

Không self-host PostHog trong MVP. Giá và free tier là dependency vận hành có thể thay đổi; Engineering/Product phải kiểm tra pricing hiện hành tại mỗi cost review. Không được bật thêm PostHog product hoặc collection mode chỉ vì nằm trong free tier—mọi mở rộng dữ liệu phải qua privacy và cost review.

### 8.2. In-app feedback và store review

Hai flow phải độc lập cả về UI, trigger và dữ liệu:

1. **Product feedback:** popup/screen có nhãn “Góp ý cho PixelDoro”, thu `experienceScore` 1–5 và comment tùy chọn qua feedback adapter.
2. **Store review:** gọi `expo-store-review` để hệ điều hành/StoreKit/Google Play hiển thị native review flow.

Ràng buộc bắt buộc:

- Không dùng `experienceScore`, sentiment, comment hoặc lịch sử feedback để quyết định có gọi store review hay không.
- Không chỉ chuyển người chấm điểm cao sang store; người chấm thấp không bị chặn khỏi store review.
- Không hiển thị câu hỏi mức độ hài lòng ngay trước hoặc trong store review flow.
- Không tạo UI mô phỏng App Store/Google Play rating card.
- Không cấp XP, Coin, item hoặc lợi ích để đổi lấy feedback/store review.
- Feedback comment không được gửi vào analytics; chỉ feedback provider được nhận nội dung mà người dùng chủ động submit.
- Product feedback submit failure là recoverable side effect và không ảnh hưởng core loop.

Store review eligibility và frequency cap:

- Chỉ xét trong production build khi native store review action khả dụng.
- Lần đầu chỉ eligible khi app đã được cài ít nhất 7 ngày, có ít nhất 5 completed Focus sessions và completed sessions xuất hiện trên ít nhất 3 ngày local khác nhau.
- Candidate chỉ được tạo từ một completed Focus session. Chỉ gọi native API sau khi reward/celebration kết thúc và người dùng đã trở về Home; failed/cancelled session không tạo candidate.
- Khi gọi, không được có active Focus/Break, onboarding, modal hoặc thao tác time-sensitive khác.
- Cooldown tối thiểu 120 ngày giữa hai attempts; tối đa 3 attempts trong rolling 365 ngày và tối đa một attempt cho mỗi app version.
- Persist attempt ngay trước khi gọi native API. Attempt vẫn được tính nếu OS/store không hiển thị prompt hoặc app không thể biết kết quả; không retry ngay.
- Eligibility không được đọc feedback score, sentiment, comment hoặc feedback history. Không capture rating/review outcome vì native API không cung cấp kết quả đáng tin cậy; analytics chỉ được ghi `store_review_requested`.
- Nếu Settings có nút chủ động “Đánh giá PixelDoro”, nút này mở trang review của store thay vì gọi native in-app review prompt.

Các rule này tuân theo [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google Play In-App Review guidelines](https://developer.android.com/guide/playcore/in-app-review) và [Expo StoreReview](https://docs.expo.dev/versions/v57.0.0/sdk/storereview/).

## 9. Scope kỹ thuật của Mobile MVP

### 9.1. In scope

- iOS và Android app dùng chung React Native/TypeScript core.
- Các screen đã liệt kê trong Product Core: Onboarding, Home/Pet Room, Focus Setup, Focus Session, Result, Break, Shop/Inventory nhỏ, History, Settings và Feedback.
- Một Pet mặc định với `idle`, `working`, `breaking`, `celebrating` và `bugged`.
- Focus 15–120 phút; Short Break 5 phút; Long Break 15 phút.
- Relax Mode và Strict Mode Lite với grace period 10 giây.
- Local persistence, local notification, XP/Coin, history và contribution graph cơ bản.
- Anonymous analytics tối thiểu và feedback entry sau adapter.
- Audio/haptic có setting tắt.

### 9.2. Out of scope

- Authentication, account, backend bắt buộc và cloud sync.
- Desktop/web release, social, leaderboard và multiplayer focus room.
- Native app blocking hoàn chỉnh, Live Activities, Dynamic Island và widget.
- Subscription, production IAP, quảng cáo và rewarded video.
- Nhiều Pet, evolution ba cấp, happiness decay và energy system phức tạp.
- Server push notification, AI feature và remote game economy.
- Việc thêm package/infrastructure chỉ để chuẩn bị cho các mục deferred ở trên.

## 10. Cross-cutting technical constraints

### 10.1. Reliability

- Persist durable transition trước khi điều hướng tới màn hình dựa vào transition đó.
- Mọi side effect có khả năng được gọi lại sau relaunch phải có idempotency key hoặc deduplication rule.
- Database migration phải forward-only, có schema version và được test trên dữ liệu của phiên bản trước.
- Không xóa dữ liệu người dùng khi migration hoặc asset load thất bại; app phải fail safely và cung cấp recovery path.

### 10.2. Performance và battery

- UI tick chỉ chạy khi cần render countdown; session truth không phụ thuộc tick frequency.
- Dừng/pause animation không nhìn thấy khi app background hoặc screen unmount.
- Sprite, audio và font được bundle local cho core experience.
- Skia chỉ được thêm sau khi đo trên thiết bị tầm trung của cả iOS và Android.
- Hiệu ứng trang trí như CRT/shader phải được giảm hoặc bỏ trước khi thêm rendering dependency mới nếu không ảnh hưởng product core.
- Celebration/CRT effect phải ngắn, tiết chế và không làm block navigation hoặc input.

### 10.3. Accessibility và experience

- Text quan trọng không được render chỉ bằng pixel sprite.
- Countdown, status và action phải có semantic label cho screen reader.
- Tôn trọng reduced-motion khi platform cung cấp; có fallback tĩnh cho animation quan trọng.
- Không chỉ dùng màu để phân biệt completed/failed/cancelled.
- Audio và haptic có thể tắt hoàn toàn; timer vẫn truyền đạt kết quả bằng hình ảnh/text.

### 10.4. Testability

- Domain unit test dùng fake clock và in-memory repository/port, không cần React Native runtime.
- Integration test bao phủ SQLite transaction, migration, app lifecycle reconciliation và notification adapter failure.
- Device acceptance test chạy trên ít nhất một thiết bị/simulator iOS và một thiết bị/emulator Android.
- Các luồng kill/relaunch, background quá grace period và reward retry là test bắt buộc trước closed beta.

### 10.5. OTA, signing và release pipeline

#### EAS Update

- Dùng ba channel tách biệt: `development`, `preview` và `production`.
- Production OTA chỉ chứa JavaScript, styling và bundled asset tương thích với binary/runtime hiện có.
- Update phải được kiểm tra trên `preview` với cùng `runtimeVersion` trước khi promote/publish production.
- Production rollout phải có bước quan sát crash/startup health và khả năng republish bản ổn định trước đó.
- Native dependency, Expo SDK, permission, entitlement hoặc config plugin change không được phát hành chỉ bằng OTA; phải tạo binary mới.
- EAS Update là kênh phân phối, không phải cách né App Store/Google Play review policy.

#### Credentials

- `credentialsSource` mặc định là `remote`; EAS quản lý signing credential cho cả iOS và Android.
- Keystore, private key, certificate password, App Store Connect key và service-account secret không được commit vào repository.
- Chỉ role được ủy quyền có quyền tạo, rotate, download hoặc revoke credential; thao tác credential phải có audit/recovery procedure.
- Google Play App Signing được ưu tiên; EAS quản lý upload credential dùng trong build/submit.

#### Build và submit

```text
Release trigger
  → typecheck/lint/unit/integration tests
  → EAS Build cho iOS và Android
  → smoke test artifact/preview
  → EAS Submit
  → iOS: TestFlight / App Store Connect
  → Android: internal/closed/production track theo submission profile
  → manual approval/promotion khi store yêu cầu
```

EAS Submit upload binary nhưng không được xem là bằng chứng app đã public. Với iOS, build được đưa vào TestFlight/App Store Connect và bước gửi App Review/phát hành vẫn theo quy trình Apple. Với Android, submission profile phải chỉ rõ track và release status; closed beta mặc định dùng closed/internal track.

### 10.6. Pet animation performance gate

Reanimated + bundled sprite assets phải được dùng để dựng đủ `idle`, `working`, `breaking`, `celebrating` và `bugged` trước khi đánh giá Skia.

Prototype phải chạy animation loop liên tục tối thiểu 30 phút trên:

- Một Android API 24 với RAM 2–3 GB hoặc thiết bị thấp nhất thực tế có thể tiếp cận.
- Một Android tầm trung đại diện beta audience.
- Một thiết bị iOS 16.4 ở mức phần cứng thấp nhất thực tế có thể tiếp cận.
- Một thiết bị iOS hiện hành.

Benchmark ghi nhận UI frame stability, freeze/jank trên 100 ms, memory growth, CPU/thermal, cold start và binary size. Nếu có Skia spike, cùng scene, asset và duration phải được dùng để so sánh công bằng.

Skia chỉ được chấp nhận khi đáp ứng cả hai nhóm điều kiện:

1. Có ít nhất một justification: một visual requirement `LOCKED` không thể đạt bằng Reanimated + sprite asset, hoặc Skia tạo cải thiện hiệu năng đáng kể và lặp lại được trên minimum supported device.
2. Chi phí binary, memory, energy, test và maintenance đã được reviewer chấp nhận.

Mọi Skia implementation phải nằm trong Presentation/animation infrastructure, không chứa business rule và có static/sprite fallback. Nếu không vượt gate, TECH-OPEN-004 kết thúc với baseline Reanimated và Skia không được cài.

## 11. Acceptance criteria cho Technical Overview

Tài liệu được xem là sẵn sàng phê duyệt khi reviewer xác nhận:

- [x] Release target chỉ gồm iOS và Android.
- [x] React Native, TypeScript và Expo Development Build được ghi rõ.
- [x] Navigation, state management, database, animation và notification stack có quyết định cụ thể.
- [x] Durable state và UI state có ownership không chồng lấn.
- [x] Offline-first, privacy-first và no-required-backend được định nghĩa bằng hành vi kiểm thử được.
- [x] Timer timestamp, reconciliation và reward idempotency là ràng buộc bắt buộc.
- [x] In-scope và out-of-scope khớp Product Core.
- [x] Domain/platform boundary đủ rõ để System Architecture chi tiết hóa.
- [x] Các quyết định quan trọng có ADR liên quan.
- [x] Product feedback và store review được tách độc lập, không review gating.
- [x] OTA, runtime compatibility, credential ownership và build/submit pipeline được xác định.
- [x] Analytics provider, privacy boundary, offline queue, retention và cost guardrails được xác định.
- [x] Owner và reviewer đã được ghi nhận: Dũng Lư, Tech Lead.
- [x] Không còn ADR ở trạng thái `PROPOSED`; ADR-002 và ADR-003 đã được duyệt.
- [x] Tech Lead Dũng Lư đã phê duyệt toàn bộ tài liệu ngày 2026-08-26.

## 12. Architecture Decision Records

| ADR | Quyết định | Trạng thái |
|---|---|---|
| [ADR-001](decisions/ADR-001-mobile-runtime-and-toolchain.md) | React Native + TypeScript + Expo Development Build | `ACCEPTED` theo Product Core |
| [ADR-002](decisions/ADR-002-navigation-with-expo-router.md) | Expo Router cho navigation | `ACCEPTED` |
| [ADR-003](decisions/ADR-003-state-and-persistence.md) | Zustand cho client state, SQLite cho durable state | `ACCEPTED` |
| [ADR-004](decisions/ADR-004-domain-and-platform-boundaries.md) | Domain TypeScript thuần và platform adapters | `ACCEPTED` theo Product Core |
| [ADR-005](decisions/ADR-005-animation-stack.md) | Reanimated + sprite baseline, Skia sau performance gate | `ACCEPTED` |
| [ADR-006](decisions/ADR-006-in-app-feedback-and-store-review.md) | In-app feedback độc lập với native store review; engagement trigger và frequency cap | `ACCEPTED` |
| [ADR-007](decisions/ADR-007-eas-delivery-pipeline.md) | EAS Update, managed credentials và build/submit pipeline | `ACCEPTED` |
| [ADR-008](decisions/ADR-008-posthog-analytics-and-cost-guardrails.md) | PostHog Cloud EU, anonymous analytics và cost guardrails | `ACCEPTED` |

## 13. Technical decisions

### 13.1. Resolved

| ID | Quyết định | Trạng thái | Ngày chốt |
|---|---|---|---|
| TECH-OPEN-001 | Expo SDK `57.x` stable; React Native `0.86.x`; React `19.2.3`; Node.js 22 LTS (`>=22.13.0 <23.0.0`); New Architecture + Hermes; iOS `16.4+`; Android `7.0+`/API `24+`; Android compile/target API `36`; Xcode `26.4+`. Expo/native dependencies được cài bằng `npx expo install` và pin bằng lockfile. Không dùng pre-release; giữ SDK ở dòng `57.x` đến hết closed beta và chỉ nhận patch sau compatibility/acceptance test. | `RESOLVED` | 2026-08-26 |
| TECH-OPEN-002 | Dùng PostHog Cloud EU sau analytics adapter, anonymous installation ID và manual event allowlist. Tắt person profiles, autocapture, session replay, GeoIP cùng advertising identifiers. Queue tối đa 1.000 events/device, hết hạn sau 7 ngày; raw provider retention tối đa 12 tháng. Event budget 250 events/MAU/tháng, billing cap ban đầu US$50/tháng và bắt buộc cost review tại 500.000/1.000.000 events mỗi tháng. | `RESOLVED` | 2026-08-26 |
| TECH-OPEN-003 | Feedback dùng popup/screen trong app với experience score 1–5 và comment tùy chọn. Store review dùng `expo-store-review` trong flow độc lập; cấm review gating, custom store prompt và incentive. | `RESOLVED` | 2026-08-26 |
| TECH-OPEN-004 | Reanimated + bundled sprite assets là animation baseline; Skia không được cài ban đầu. Skia chỉ được thêm nếu Pet prototype và benchmark trên minimum supported devices vượt adoption gate của ADR-005; implementation phải có static/sprite fallback. | `RESOLVED_WITH_GATE` | 2026-08-26 |
| TECH-OPEN-005 | Dùng EAS Update cho OTA với `appVersion` runtime policy; EAS-managed remote credentials; EAS Build + Submit + Workflows làm release pipeline. Native change bắt buộc tạo binary mới; store public release vẫn theo approval/promotion của Apple/Google. | `RESOLVED` | 2026-08-26 |
| TECH-OPEN-006 | Native store review chỉ eligible trong production sau ít nhất 7 ngày cài đặt, 5 completed Focus sessions và 3 ngày active khác nhau; request tại Home sau completed reward/celebration. Cooldown 120 ngày, tối đa 3 attempts/rolling 365 ngày và một attempt/app version. Persist mọi attempt kể cả khi prompt không hiển thị; không dùng feedback data để xét eligibility. | `RESOLVED` | 2026-08-26 |

### 13.2. Open

Không còn technical decision mở trong phạm vi Technical Overview hiện tại. Owner/reviewer và trạng thái phê duyệt tài liệu vẫn được theo dõi riêng trong acceptance checklist.

Nếu phát sinh open decision mới, mục đó phải có owner và hạn chốt; không được âm thầm biến thành requirement. Nếu một quyết định thay đổi stack hoặc ranh giới đã mô tả, phải cập nhật ADR và tài liệu này. Quyết định đã resolved chỉ được thay đổi qua review và ADR tương ứng.

## 14. Tài liệu kế tiếp

Sau khi Technical Overview và các ADR được phê duyệt, thứ tự tiếp theo là:

1. `system-architecture.md`: layer, dependency direction, use case và side-effect flow.
2. `project-structure.md`: workspace/package layout, naming và import rule.
3. `timer-engine.md` và `session-lifecycle.md`: có thể soạn song song sau kiến trúc.

## 15. Change log

### 1.0.0 — 2026-08-26

- Tech Lead Dũng Lư phê duyệt Technical Overview.
- Chuyển trạng thái tài liệu từ `DRAFT` sang `APPROVED` sau khi toàn bộ TECH-OPEN-001 đến TECH-OPEN-006 đã chốt và ADR-001 đến ADR-008 đã `ACCEPTED`.
- Ghi nhận owner/approver và phát hành baseline Technical Overview `1.0.0` cho các tài liệu kỹ thuật kế tiếp.

### 0.7.0 — 2026-08-26

- Duyệt ADR-002: Expo Router với typed routes cho navigation; route files chỉ làm composition.
- Duyệt ADR-003: Zustand cho UI/client projection và SQLite làm durable source of truth qua repository.
- Chuyển navigation từ `PROPOSED` sang `MVP_DEFAULT`; Technical Overview không còn ADR ở trạng thái `PROPOSED`.

### 0.6.0 — 2026-08-26

- Chốt `TECH-OPEN-006`: production-only store review eligibility sau 7 ngày cài đặt, 5 completed Focus sessions và 3 active days.
- Chốt natural stopping point tại Home sau completed reward/celebration; failed/cancelled session không tạo request candidate.
- Chốt cooldown 120 ngày, tối đa 3 attempts trong rolling 365 ngày và một attempt/app version.
- Quy định persist mọi attempt kể cả khi system prompt không hiển thị, không retry ngay và không suy diễn rating/review outcome.
- Cập nhật ADR-006 và chuyển Product `OPEN-011` sang resolved.

### 0.5.0 — 2026-08-26

- Chốt `TECH-OPEN-002`: PostHog Cloud EU, anonymous-only và manual event allowlist sau analytics adapter.
- Cấm person profiles, autocapture, session replay, GeoIP enrichment, advertising identifiers và analytics ở development/test.
- Chốt queue tối đa 1.000 events/device, TTL 7 ngày, payload/property limits, at-least-once delivery và reset/opt-out behavior.
- Chốt provider retention tối đa 12 tháng, event budget 250 events/MAU/tháng, billing cap US$50/tháng, cảnh báo 50/75/90% và cost review tại 500.000/1.000.000 events mỗi tháng.
- Thêm ADR-008 và chuyển Product `OPEN-007` sang resolved.

### 0.4.0 — 2026-08-26

- Chốt `TECH-OPEN-004` thành `RESOLVED_WITH_GATE`.
- Chấp nhận Reanimated + bundled sprite assets làm animation baseline và không cài Skia ban đầu.
- Quy định device matrix, benchmark 30 phút, adoption criteria và static/sprite fallback cho Skia spike.
- Chuyển ADR-005 từ `PROPOSED` sang `ACCEPTED`.

### 0.3.0 — 2026-08-26

- Chốt `TECH-OPEN-003`: product feedback dùng popup/screen trong app với experience score 1–5 và comment tùy chọn.
- Tách product feedback khỏi native store review; cấm review gating, custom store prompt và incentive theo store policy.
- Chốt `TECH-OPEN-005`: EAS Update, `appVersion` runtime policy, EAS-managed credentials và EAS Build/Submit/Workflows.
- Ghi rõ OTA/native boundary, preview/production channels, rollback và store submission semantics.
- Thêm ADR-006, ADR-007 và `TECH-OPEN-006` cho store review trigger/frequency cap.

### 0.2.0 — 2026-08-26

- Chốt `TECH-OPEN-001` với Expo SDK `57.x`, React Native `0.86.x`, React `19.2.3` và Node.js 22 LTS.
- Chốt minimum platform iOS `16.4+`, Android `7.0+`/API `24+`, Android compile/target API `36` và Xcode `26.4+`.
- Chốt New Architecture + Hermes, stable-only dependency policy, `npx expo install`, committed lockfile và giữ Expo SDK ở dòng `57.x` đến hết closed beta.
- Chuyển `TECH-OPEN-001` từ Open sang Resolved.

### 0.1.0 — 2026-08-26

- Tạo draft Technical Overview đầu tiên từ Product Core 1.0.0.
- Đề xuất Expo Router và xác định ownership giữa Zustand/SQLite.
- Ghi rõ offline-first, privacy-first, timer consistency và platform boundary.
- Tạo liên kết tới năm ADR đang chờ review.
