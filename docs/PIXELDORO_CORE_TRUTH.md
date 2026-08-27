---
document_id: PIXELDORO_CORE_TRUTH
title: PixelDoro Product Core — Single Source of Truth
version: 1.13.0
status: ACTIVE
last_updated: 2026-08-27
owner: Dũng Lư
owner_roles:
  - Tech Lead
  - Product Owner
  - Lead Mobile Developer
language: vi
scope:
  - product_vision
  - product_core
  - mobile_mvp
  - future_direction
authority: PRIMARY
---

# PixelDoro Product Core — Single Source of Truth

## 0. Vai trò của tài liệu

Đây là tài liệu sự thật trung tâm của PixelDoro. Tài liệu xác định:

- PixelDoro là sản phẩm gì và không phải là sản phẩm gì.
- Giá trị cốt lõi mà sản phẩm phải bảo vệ.
- Trải nghiệm và gameplay loop chính.
- Phạm vi Mobile MVP hiện tại.
- Những quyết định đã chốt, mặc định đang áp dụng, nội dung bị hoãn và câu hỏi còn mở.
- Ranh giới giữa tầm nhìn dài hạn và yêu cầu phải triển khai ngay.

Khi một tài liệu khác mâu thuẫn với file này, file này được ưu tiên. Nếu team quyết định thay đổi product core hoặc phạm vi MVP, phải cập nhật file này trước hoặc đồng thời với thay đổi implementation.

Các tài liệu kỹ thuật chi tiết được phép mở rộng nội dung trong file này nhưng không được âm thầm thay đổi ý nghĩa sản phẩm.

## 0.1. Quy ước trạng thái quyết định

| Trạng thái | Ý nghĩa |
|---|---|
| `LOCKED` | Đã chốt, implementation phải tuân theo. |
| `MVP_DEFAULT` | Mặc định áp dụng cho MVP, có thể đổi sau review có chủ đích. |
| `PROPOSED` | Đề xuất cần được xác nhận trước khi xem là yêu cầu bắt buộc. |
| `DEFERRED` | Không thuộc Mobile MVP, chỉ xem xét sau khi có dữ liệu người dùng. |
| `OPEN` | Chưa quyết định; không được tự suy diễn thành requirement. |

## 0.2. Quy tắc dành cho developer và AI

- Không biến nội dung `PROPOSED`, `DEFERRED` hoặc `OPEN` thành tính năng MVP nếu chưa có quyết định mới.
- Không tự thêm backend, authentication, cloud sync, social hoặc monetization vào MVP.
- Không thay đổi công thức gameplay, trạng thái session hoặc timer semantics nếu chưa cập nhật tài liệu này.
- Khi thiếu thông tin, ghi rõ assumption hoặc tạo câu hỏi mở; không âm thầm invent business rule.
- Ưu tiên vòng lặp focus đơn giản, đáng tin cậy hơn số lượng tính năng.
- Mọi tính năng phải hỗ trợ mục tiêu giúp người dùng bắt đầu và duy trì deep work.
- Pixel art là ngôn ngữ hình ảnh; Pet đồng hành mới là giá trị cảm xúc cốt lõi.

## 0.3. Project ownership

Dũng Lư hiện kiêm nhiệm các vai trò chính của PixelDoro Mobile MVP:

| Vai trò | Trách nhiệm chính |
|---|---|
| Tech Lead | Chốt technical direction, architecture boundary, engineering trade-off và technical-document approval. |
| Product Owner | Chốt product scope, behavior, priority và các Product decision đang `OPEN`/`PROPOSED`. |
| Lead Mobile Developer | Là developer chính phía mobile, chịu trách nhiệm implementation và technical validation trên iOS/Android. |

Trong tài liệu dự án, “Dũng Lư”, “Tech Lead”, “Product Owner” và “Lead Mobile Developer” có thể cùng chỉ một decision owner tùy phạm vi quyết định.

---

# 1. Product Identity

| Thuộc tính | Giá trị | Trạng thái |
|---|---|---|
| Tên sản phẩm | PixelDoro | `LOCKED` |
| Tagline hiện tại | PixelDoro: 8-Bit Focus Companion | `MVP_DEFAULT` |
| Loại sản phẩm | Gamified focus timer kết hợp virtual Pet | `LOCKED` |
| Nền tảng MVP | iOS và Android | `LOCKED` |
| Visual direction | Pixel art, retro, Game Boy/8-bit inspired | `LOCKED` |
| Product model MVP | Offline-first, không yêu cầu tài khoản | `LOCKED` |
| Desktop | Chưa thuộc MVP | `DEFERRED` |

## 1.1. Product thesis

PixelDoro biến một phiên tập trung khô khan thành trải nghiệm làm việc cùng một người bạn pixel. Khi người dùng tập trung, Pet cũng làm việc. Khi người dùng nghỉ, Pet cũng nghỉ. Khi người dùng hoàn thành phiên, cả hai cùng tiến bộ và không gian sống của Pet dần thay đổi.

Giá trị chính không nằm ở đồng hồ đếm ngược. Giá trị chính là cảm giác:

> “Mình không làm việc một mình; có một người bạn nhỏ đang đồng hành và tiến bộ cùng mình.”

Trạng thái: `LOCKED`.

## 1.2. One-line value proposition

> PixelDoro là người bạn tập trung 8-bit giúp biến thời gian deep work thành tiến trình có thể nhìn thấy, cảm nhận và muốn quay lại.

Trạng thái: `MVP_DEFAULT`.

## 1.3. Vấn đề người dùng

PixelDoro tập trung giải quyết các vấn đề sau:

1. Khó bắt đầu một phiên làm việc cần tập trung.
2. Pomodoro truyền thống hữu ích nhưng khô khan và thiếu động lực cảm xúc.
3. Người dùng dễ chuyển sang ứng dụng gây xao nhãng.
4. Thời gian đã tập trung thường chỉ được thể hiện bằng con số, không tạo cảm giác tiến triển.
5. Nhiều ứng dụng productivity tạo thêm áp lực thay vì tạo cảm giác được đồng hành.

## 1.4. Đối tượng mục tiêu

### Primary audience — `LOCKED`

- Lập trình viên.
- Designer, writer và knowledge worker.
- Dân văn phòng thực hiện deep work.
- Học sinh/sinh viên thích pixel art và gamification.
- Người gặp khó khăn khi bắt đầu hoặc duy trì một phiên tập trung.

### Early beta audience — `MVP_DEFAULT`

Ưu tiên tuyển beta user từ nhóm:

- Đang sử dụng Pomodoro hoặc từng thử một focus timer.
- Làm việc/học tập trên máy tính nhưng dùng điện thoại làm timer.
- Thích retro game, cozy game hoặc virtual Pet.
- Sẵn sàng sử dụng app tối thiểu vài ngày và gửi feedback.

## 1.5. Product positioning

PixelDoro không cố trở thành task manager toàn diện, habit tracker toàn diện hoặc game RPG phức tạp. PixelDoro tập trung vào một lời hứa hẹp:

> Giúp người dùng bắt đầu và hoàn thành các phiên focus bằng sự đồng hành của một Pet pixel.

Trạng thái: `LOCKED`.

---

# 2. Product Principles

## 2.1. Companion before punishment — `LOCKED`

Pet là người bạn đồng hành, không phải công cụ thao túng cảm xúc. Một phiên thất bại có thể khiến Pet bị bug hoặc buồn trong thời gian ngắn, nhưng không được:

- Làm Pet chết vĩnh viễn.
- Xóa tiến trình đã tích lũy.
- Buộc người dùng xem quảng cáo để cứu Pet.
- Làm người dùng cảm thấy có lỗi vì nghỉ một vài ngày.

## 2.2. Focus before game — `LOCKED`

Gameplay phải hỗ trợ focus. Không thêm hoạt động khiến người dùng ở lại trong app lâu hơn một cách không cần thiết trong lúc đáng lẽ họ đang làm việc.

## 2.3. Reward completed effort — `LOCKED`

Phần thưởng đến từ thời gian tập trung đã hoàn thành. Không thưởng cho việc mở app liên tục, xem quảng cáo hoặc thực hiện hành động gây xao nhãng.

## 2.4. Reliable before feature-rich — `LOCKED`

Timer, session recovery và reward idempotency phải đáng tin cậy trước khi thêm nhiều Pet, shop lớn, cloud sync hoặc social.

## 2.5. Offline-first and privacy-conscious — `LOCKED`

Mobile MVP phải hoạt động mà không cần tài khoản và không phụ thuộc mạng. Chỉ thu thập analytics cần thiết để đánh giá sản phẩm; không thu nội dung nhạy cảm của task nếu không cần.

## 2.6. Retro with restraint — `MVP_DEFAULT`

Pixel art, chiptune, CRT và haptic tạo bản sắc nhưng không được ảnh hưởng khả năng đọc, accessibility, pin hoặc hiệu năng.

---

# 3. Core Experience Loop

## 3.1. Primary loop — `LOCKED`

```text
Chọn loại công việc và thời lượng
                ↓
          Bắt đầu Focus
                ↓
      Pet bắt đầu làm việc
                ↓
    Người dùng duy trì tập trung
                ↓
       Hoàn thành phiên Focus
                ↓
          Nhận XP và Coin
                ↓
  Mở khóa/trang trí tiến trình Pet
                ↓
       Nghỉ ngắn hoặc bắt đầu lại
```

## 3.2. Emotional loop — `LOCKED`

```text
Pet hiện diện
    → Pet cùng làm
    → Người dùng không muốn làm gián đoạn Pet
    → Hoàn thành tạo cảm giác thành tựu chung
    → Pet/room thay đổi
    → Người dùng muốn quay lại
```

## 3.3. Một phiên thành công phải tạo ra ba kết quả

1. Người dùng biết mình vừa hoàn thành bao nhiêu phút tập trung.
2. Pet phản hồi tích cực bằng animation hoặc âm thanh.
3. Tiến trình dài hạn thay đổi bằng XP, Coin, unlock hoặc history.

Trạng thái: `LOCKED`.

---

# 4. Mobile MVP Scope

## 4.1. Mục tiêu MVP — `LOCKED`

MVP phải trả lời câu hỏi:

> Người dùng có muốn quay lại và thực hiện nhiều phiên focus hơn vì có Pet pixel đồng hành hay không?

MVP không nhằm chứng minh khả năng kiếm tiền, social growth hoặc cross-platform sync.

## 4.2. In scope

Các tính năng thuộc Mobile MVP:

1. Onboarding ngắn.
2. Một Pet mặc định.
3. Home/Pet Room.
4. Chọn tag công việc.
5. Chọn thời lượng Focus từ 15 đến 120 phút.
6. Short Break mặc định 5 phút.
7. Long Break mặc định 15 phút.
8. Relax Mode.
9. Strict Mode nhẹ với grace period 10 giây.
10. Local notification khi hết Focus hoặc Break.
11. Pet states và retro animation cơ bản.
12. XP và Coin sau session hoàn thành.
13. Inventory/shop nhỏ phục vụ kiểm chứng reward loop.
14. Lịch sử phiên focus.
15. Contribution graph cơ bản theo ngày.
16. Settings cho âm thanh, rung và notification.
17. Cơ chế gửi feedback trong app.
18. Anonymous product analytics tối thiểu.

Trạng thái tổng thể: `MVP_DEFAULT`, ngoại trừ các core behavior đã được đánh dấu `LOCKED` trong các mục chi tiết.

## 4.3. Out of scope

Không thuộc Mobile MVP:

- Authentication và tài khoản người dùng.
- Backend bắt buộc.
- Cloud sync.
- Desktop app.
- Social, friend, leaderboard hoặc focus room.
- App blocking native hoàn chỉnh.
- Dynamic Island/Live Activities.
- Lock Screen/Home Screen widget.
- Subscription.
- In-app purchase production.
- Rewarded video ads.
- Revive Token.
- Seasonal DLC.
- Nhiều loại Pet.
- Pet evolution ba cấp hoàn chỉnh.
- Happiness decay theo số ngày bỏ app.
- Energy system phức tạp.
- Push notification từ server.
- AI features.

Trạng thái: `LOCKED` cho phạm vi MVP hiện tại; các mục này có thể được đưa vào roadmap sau review.

---

# 5. Focus Configuration

## 5.1. Focus duration

| Thuộc tính | Giá trị | Trạng thái |
|---|---:|---|
| Minimum standard Focus | 15 phút | `LOCKED` |
| Maximum standard Focus | 120 phút | `LOCKED` |
| Default standard Focus | 25 phút | `MVP_DEFAULT` |
| Standard Focus step | 5 phút | `MVP_DEFAULT` |
| Onboarding trial Focus | Cố định 5 phút | `MVP_DEFAULT`; ngoại lệ đã chốt qua `GR-OPEN-003` |

Minimum 15 phút chỉ áp dụng cho Focus được bắt đầu từ normal focus flow. Onboarding trial là special Focus cố định 5 phút và không mở rộng duration selector của standard Focus.

## 5.2. Break duration

| Loại | Giá trị | Trạng thái |
|---|---:|---|
| Short Break | 5 phút | `LOCKED` |
| Long Break | 15 phút | `LOCKED` |
| Số completed Focus trước Long Break | 4 | `MVP_DEFAULT` |

Long Break cadence cho Mobile MVP:

- Sau bốn Focus session `completed` kể từ Long Break `completed` gần nhất, loại Break kế tiếp là Long Break 15 phút.
- Nếu chưa từng hoàn thành Long Break, bộ đếm bắt đầu từ completed Focus đầu tiên trong local history.
- Focus `failed` hoặc `cancelled` không tăng bộ đếm.
- Onboarding trial Focus không tăng bộ đếm, kể cả khi `completed`.
- Trạng thái Long Break đến hạn phải giữ qua app relaunch và tiếp tục có hiệu lực cho tới khi Long Break `completed`.
- Long Break `cancelled` không reset trạng thái đến hạn.
- Trước khi Long Break đến hạn, Break kế tiếp sau completed Focus là Short Break 5 phút.
- Quy tắc này tự động chọn loại Break nhưng không tự động khởi động Break. Theo `OPEN-010` đã chốt, người dùng phải chủ động chọn “Bắt đầu nghỉ”.

Trạng thái cadence: `MVP_DEFAULT`, chốt từ `OPEN-003` ngày 2026-08-26.

## 5.3. Work tags

Tags mặc định của standard Focus:

- `coding`
- `study`
- `writing`
- `reading`

Trạng thái: `LOCKED` theo product backlog gốc.

Tag mở rộng như `design`, `planning`, `meeting` hoặc custom tag là `DEFERRED`.

Onboarding trial không yêu cầu người dùng chọn loại công việc và không có work tag; durable session record dùng `workTag = null`. Trial tiếp tục bị loại khỏi standard Focus history, contribution graph, Long Break cadence, store-review eligibility và core Focus/reward analytics.

Trạng thái trial tag: `MVP_DEFAULT`, chốt từ `DM-OPEN-006` ngày 2026-08-27.

## 5.4. Pause behavior

Mobile MVP không hỗ trợ pause cho cả Focus session và Break session.

Khi một session đang chạy, người dùng có thể cancel session hoặc để timer tiếp tục. UI không cung cấp action Pause/Resume và timer truth không có trạng thái `paused` hoặc field `pausedAt` trong phạm vi MVP.

Trạng thái: `MVP_DEFAULT`.

Lý do: không pause giữ session semantics, notification scheduling và recovery sau background/relaunch đơn giản, đáng tin cậy. Team có thể xem xét lại sau beta bằng một Product decision mới nếu dữ liệu người dùng chứng minh nhu cầu.

---

# 6. Focus Modes

## 6.1. Relax Mode — `LOCKED`

Relax Mode cho phép người dùng:

- Chuyển sang ứng dụng khác.
- Khóa màn hình.
- Nghe nhạc hoặc tra cứu tài liệu.
- Để timer tiếp tục dựa trên timestamp.

Rời app không làm session thất bại trong Relax Mode.

Onboarding trial 5 phút luôn dùng Relax Mode semantics, không hiển thị mode selector và không có Strict/grace-period failure. Durable session record dùng `mode = relax`.

Trạng thái trial mode: `MVP_DEFAULT`, chốt từ `DM-OPEN-006` ngày 2026-08-27.

## 6.2. Strict Mode Lite — `LOCKED` cho MVP

Strict Mode MVP không khóa ứng dụng khác ở cấp hệ điều hành. Nó phát hiện việc PixelDoro chuyển sang background và áp dụng grace period 10 giây.

Quy tắc chính xác:

```text
backgroundedAt = thời điểm app rời foreground
violationAt    = backgroundedAt + 10 giây

Nếu violationAt <= endsAt:
    session thất bại khi người dùng vắng mặt quá grace period

Nếu endsAt < violationAt:
    session hoàn thành trước khi grace period kết thúc
```

Khi người dùng quay lại:

- Nếu không có violation: session tiếp tục hoặc được resolve completed.
- Nếu có violation: session chuyển sang `failed`.
- Không nhận XP hoặc Coin cho session failed.
- Pet hiển thị trạng thái Bugged ngắn hạn.

Nếu app không được mở lại ngay, trạng thái được reconcile vào lần mở tiếp theo dựa trên các timestamp đã lưu.

## 6.3. Native app blocking

Khóa hoặc shield ứng dụng gây xao nhãng bằng API native iOS/Android là `DEFERRED`.

Native app blocking không phải điều kiện để phát hành MVP.

## 6.4. Break mode behavior — `MVP_DEFAULT`

Break không áp dụng Strict Mode Lite hoặc grace-period violation:

- Rời app, khóa màn hình, crash hoặc kill không làm Break `failed`.
- Break đang chạy chỉ resolve `completed` theo deadline hoặc `cancelled` khi người dùng cancel trước terminal commit.
- `failed` trong Mobile MVP chỉ áp dụng cho Strict Focus violation.

Quyết định này được Dũng Lư — Product Owner/Tech Lead chốt qua `SL-OPEN-001` ngày 2026-08-26.

---

# 7. Timer and Session Truth

## 7.1. Timer model — `LOCKED`

Timer phải dựa trên timestamp, không dựa vào việc JavaScript chạy `setInterval` liên tục dưới background.

Nguồn sự thật tối thiểu:

```text
startedAt
endsAt
mode
status
backgroundedAt (nếu có)
resolvedAt (nếu có)
rewardClaimedAt (nếu có)
```

UI có thể tick để hiển thị countdown nhưng tick không phải nguồn sự thật của thời gian.

## 7.2. Session statuses — `LOCKED`

| Status | Ý nghĩa |
|---|---|
| `running` | Session đã bắt đầu và chưa có kết quả cuối. |
| `completed` | Người dùng hoàn thành đủ thời gian theo rule. |
| `failed` | Session vi phạm Strict Mode. |
| `cancelled` | Người dùng chủ động kết thúc trước thời hạn. |

Status là terminal khi đã thành `completed`, `failed` hoặc `cancelled`.

## 7.3. Session transitions — `LOCKED`

```text
IDLE
  └── START_FOCUS → RUNNING

RUNNING
  ├── TIME_ELAPSED → COMPLETED
  ├── STRICT_VIOLATION → FAILED
  └── USER_CANCEL → CANCELLED

COMPLETED / FAILED / CANCELLED
  └── không được transition ngược về RUNNING
```

## 7.4. Reward idempotency — `LOCKED`

- Một session chỉ được cấp reward tối đa một lần.
- Reward phải gắn với `sessionId` duy nhất.
- Reward được grant tự động trong transaction resolve completed Focus; Result screen chỉ hiển thị reward đã commit và không phải manual claim trigger.
- Việc mở result screen nhiều lần không được cộng thêm reward.
- Session `failed` hoặc `cancelled` không nhận XP/Coin.
- Việc notification được gửi hay không không ảnh hưởng eligibility của reward.

## 7.5. Recovery behavior — `LOCKED`

Khi app khởi động hoặc quay lại foreground:

1. Đọc active session đã persist.
2. So sánh timestamp với thời gian hiện tại.
3. Kiểm tra Strict Mode violation nếu có.
4. Resolve session về kết quả terminal khi cần.
5. Cấp reward nếu đủ điều kiện và chưa từng cấp.
6. Đồng bộ UI và Pet state theo kết quả cuối.

## 7.6. Device clock và incomplete lifecycle evidence — `MVP_DEFAULT`

- Mobile MVP dùng absolute wall-clock timestamp của thiết bị làm time authority khi start và reconcile session.
- Timestamp được biểu diễn thống nhất bằng Unix epoch milliseconds UTC; đổi timezone không dời deadline tuyệt đối.
- Nếu người dùng hoặc hệ điều hành chỉnh system clock, session có thể complete sớm hoặc muộn theo wall clock mới. Đây là giới hạn được chấp nhận của offline MVP; không thêm backend hoặc anti-cheat clock.
- Strict session chỉ fail khi có persisted `backgroundedAt` chứng minh violation. Nếu app relaunch mà thiếu timestamp này do crash, force-kill hoặc OS kill, hệ thống không tự suy diễn violation; session được resolve theo deadline.
- Khi Strict session foreground lại trong grace period, `backgroundedAt` của background episode đó được clear atomically sau safe reconciliation.

## 7.7. Corrupt data và database recovery — `MVP_DEFAULT`

- Nếu timestamp của active session không hợp lệ hoặc database không thể đọc/ghi, app không được tự complete, fail, cancel hoặc cấp reward.
- Dữ liệu hiện có được giữ nguyên và UI chuyển sang recovery state với action thử lại; recovery state là application projection, không phải session status mới.
- Nếu database vẫn hoạt động nhưng riêng active session có timestamp hỏng, người dùng có thể chủ động hủy phiên lỗi; session chuyển `cancelled` và không nhận reward.
- Reset toàn bộ dữ liệu local chỉ là phương án cuối, phải do người dùng chủ động chọn và xác nhận rõ ràng.

---

# 8. Pet System

## 8.1. Vai trò của Pet — `LOCKED`

Pet phải thể hiện ba vai trò:

1. Body double: cùng làm việc với người dùng.
2. Emotional feedback: phản hồi trạng thái session.
3. Visible progression: biến thời gian focus thành thay đổi có thể nhìn thấy.

## 8.2. Pet states trong MVP

| Pet state | Trigger | Hành vi | Trạng thái |
|---|---|---|---|
| `idle` | Không có session | Ngồi, nhìn quanh hoặc tương tác nhẹ | `LOCKED` |
| `working` | Focus đang chạy | Gõ máy, đọc sách hoặc đeo tai nghe | `LOCKED` |
| `breaking` | Break đang chạy | Ngủ, uống cà phê hoặc vươn vai | `LOCKED` |
| `celebrating` | Focus completed | Chúc mừng ngắn, phản hồi tích cực | `LOCKED` |
| `bugged` | Strict session failed | Hiệu ứng bug/buồn ngắn hạn | `LOCKED` |

## 8.3. Pet-state mapping — `LOCKED`

```text
No active session           → idle
Focus session running       → working
Break session running       → breaking
Focus session completed     → celebrating
Strict session failed       → bugged
Session cancelled           → idle
```

## 8.4. Pet types

Tầm nhìn dài hạn có ba archetype:

- Cat / Mèo Dev.
- Dog / Corgi Pixel.
- Robot 8-bit.

MVP chỉ có một Pet mặc định. Loài Pet cụ thể là `OPEN` và phải được chốt cùng art direction.

## 8.5. Evolution

Tầm nhìn dài hạn:

```text
Egg → Baby → Adult
```

Evolution ba cấp là `DEFERRED`. MVP chỉ cần XP/level hoặc một dạng visible progression đơn giản để kiểm chứng reward loop.

## 8.6. Happiness và Energy

- Happiness tăng theo chuỗi hoàn thành focus.
- Energy liên quan tới break/rest.
- Không giảm Happiness theo ngày bỏ app trong MVP.
- Không để Energy ngăn người dùng bắt đầu Focus trong MVP.

Trạng thái: `DEFERRED`.

---

# 9. Gamification and Economy

## 9.1. Economy goals — `LOCKED`

Economy tồn tại để:

- Biến thời gian focus thành tiến trình hữu hình.
- Tạo lý do quay lại nhẹ nhàng.
- Cho phép cá nhân hóa Pet Room.

Economy không được:

- Trở thành pay-to-focus.
- Buộc người dùng xem quảng cáo.
- Có quá nhiều loại tiền trong MVP.
- Phạt bằng cách xóa vật phẩm đã sở hữu.

## 9.2. MVP currencies

| Currency | Mục đích | Trạng thái |
|---|---|---|
| XP | Level/progression | `LOCKED` |
| Coin | Mở khóa đồ trang trí | `LOCKED` |

## 9.3. Reward formula — `MVP_DEFAULT`

Công thức Mobile MVP đã chốt:

```text
xpEarned    = completedFocusMinutes
coinsEarned = floor(completedFocusMinutes / 5)
```

Ví dụ:

| Focus | XP | Coin |
|---:|---:|---:|
| 15 phút | 15 | 3 |
| 25 phút | 25 | 5 |
| 50 phút | 50 | 10 |
| 120 phút | 120 | 24 |

`completedFocusMinutes` là số phút Focus đã cấu hình của một session `completed`; thời gian vượt quá `endsAt` không tạo thêm reward. `floor` làm tròn Coin xuống số nguyên. Focus `failed`/`cancelled` và mọi Break không nhận XP/Coin.

Ngoại lệ onboarding đã chốt qua `GR-OPEN-003`:

- Onboarding trial là special Focus có configured duration cố định 5 phút.
- Trial `completed` áp dụng cùng công thức và nhận `5 XP`, `1 Coin`.
- Trial reward được grant tự động trong cùng completed transaction và idempotent bằng RewardTransaction unique theo trial `sessionId`.
- `5 XP` đóng góp vào cumulative XP/level; `1 Coin` đóng góp vào spendable Coin balance.
- Trial không `completed` không nhận partial XP/Coin.
- Trial không tính vào standard Focus history/contribution graph, Long Break cadence, store-review eligibility hoặc core Focus/reward analytics.

Trạng thái: `MVP_DEFAULT`, chốt từ `OPEN-004` ngày 2026-08-26.

## 9.4. Shop and inventory

Mobile MVP có đúng 12 shop items để kiểm chứng người dùng có quan tâm tới reward loop hay không:

| Stable item ID | Tên hiển thị | Category | Giá |
|---|---|---|---:|
| `desk-mug` | Cốc trên bàn | `furniture` | 5 Coin |
| `tiny-plant` | Chậu cây nhỏ | `furniture` | 10 Coin |
| `book-stack` | Chồng sách | `furniture` | 15 Coin |
| `desk-lamp` | Đèn bàn | `furniture` | 20 Coin |
| `wall-calendar` | Lịch treo tường | `furniture` | 25 Coin |
| `floor-cushion` | Đệm ngồi | `furniture` | 30 Coin |
| `small-rug` | Thảm nhỏ | `furniture` | 40 Coin |
| `wall-poster` | Tranh treo tường | `furniture` | 50 Coin |
| `bookshelf` | Kệ sách | `furniture` | 60 Coin |
| `standing-lamp` | Đèn đứng | `furniture` | 75 Coin |
| `armchair` | Ghế bành | `furniture` | 90 Coin |
| `window-view` | Khung cửa sổ | `furniture` | 120 Coin |

Shop/inventory rules đã chốt:

- 12 item trên là shop items purchasable; default room/Pet presentation assets không tính vào catalog.
- Catalog hiển thị từ đầu và không level-gate item.
- Item được mua một lần bằng Coin; purchase debit và ownership phải commit atomically.
- Coin balance không được âm; item đã sở hữu không thể mua lại hoặc bị xóa do unequip, Focus failed/cancelled hay economy progression.
- Equip item đã sở hữu không tốn thêm Coin.
- Toàn bộ item chỉ là cosmetic room decoration và không tạo XP/Coin multiplier, reward bonus, protection hoặc gameplay advantage.
- Không dynamic pricing, sale, discount, refund, sell-back, consumable, duplicate stack, gift hoặc trade trong Mobile MVP.
- Exact schema, constraint, index và migration thuộc `architecture/data-model.md` nhưng không được thay đổi behavior đã chốt ở đây.

Trạng thái: `MVP_DEFAULT`, chốt từ `OPEN-005` ngày 2026-08-26.

## 9.5. Streak

Streak có thể được ghi nhận trong dữ liệu nhưng không được dùng để trừng phạt người dùng trong MVP.

Streak UI và streak protection: `DEFERRED`.

## 9.6. Revive Token

Revive Token và rewarded ad để cứu Pet/session không thuộc MVP.

Trạng thái: `DEFERRED`.

---

# 10. User Experience

## 10.1. Primary screens

| Screen | Mục đích | MVP |
|---|---|---|
| Onboarding | Giải thích Pet companion và chạy thử | Có |
| Home / Pet Room | Điểm quay về chính, xem Pet và tiến trình | Có |
| Focus Setup | Chọn duration, tag và mode | Có |
| Focus Session | Countdown và Pet working | Có |
| Focus Result | Kết quả, XP, Coin và phản hồi Pet | Có |
| Break Session | Countdown nghỉ và Pet breaking | Có |
| Shop / Inventory | Mở khóa và equip vật phẩm | Có, phạm vi nhỏ |
| History | Danh sách session và contribution graph | Có, cơ bản |
| Settings | Audio, haptic, notifications, data | Có |
| Feedback | Thu nhận feedback trải nghiệm trong app | Có |

## 10.2. First-use flow — `MVP_DEFAULT`

```text
Launch
  → Giới thiệu ngắn về Pet
  → Chọn tên Pet hoặc dùng tên mặc định
  → Chạy onboarding trial Focus 5 phút
  → Pet celebrate
  → Nhận 5 XP và 1 Coin
  → Vào Home/Pet Room
```

Onboarding trial là special Focus ngắn hơn minimum standard Focus. Reward được grant tự động và idempotent như completed Focus khác, nhưng trial không được tính vào:

- Standard Focus history hoặc contribution graph.
- Long Break cadence.
- Completed Focus count/active day dùng cho store-review eligibility.
- Standard `focus_session_started`, `focus_session_completed` hoặc `reward_granted` analytics.

Trial không hiển thị Focus Setup, mode selector hoặc work-tag selector. Trial persist `mode = relax`, `workTag = null`, dùng Relax lifecycle và không thể `failed` bởi Strict violation. Trial dùng `onboarding_started`/`onboarding_completed` cho core analytics. Data Model phải làm trial có thể được phân biệt bền vững với standard Focus mà không tạo session status mới.

## 10.3. Normal focus flow — `LOCKED`

```text
Home
  → Focus Setup
  → Start
  → Focus Session
  → Completed
      → Result + committed reward
      → người dùng chọn Bắt đầu nghỉ hoặc Về Home
      → chỉ tạo/start Break sau thao tác Bắt đầu nghỉ
  → Failed / Cancelled
      → Result không reward
      → Home hoặc thử Focus lại
```

Chỉ Focus `completed` eligible đi tiếp trực tiếp tới Break. Focus `failed` hoặc `cancelled` không hiển thị Break CTA và không được tạo Break từ terminal result đó.

Break không auto-start trong Mobile MVP. Sau khi reward/celebration của completed Focus kết thúc, Result hiển thị lựa chọn “Bắt đầu nghỉ” và “Về Home”. Break durable record chỉ được tạo sau khi người dùng chọn bắt đầu và StartBreak transaction commit. Nếu app crash, bị kill hoặc relaunch trước thao tác đó, hệ thống không tự tạo Break.

Outcome gating này được Dũng Lư — Product Owner chốt qua `SL-OPEN-002` ngày 2026-08-26.
No-auto-start behavior được Dũng Lư — Product Owner chốt qua `OPEN-010` ngày 2026-08-26.

## 10.4. Experience tone — `LOCKED`

- Ấm áp, ngắn gọn, không phán xét.
- Retro nhưng dễ đọc.
- Celebration có cảm giác thỏa mãn nhưng không quá dài.
- Failure copy khuyến khích thử lại, không dùng guilt-heavy language.
- Không dùng dark pattern để bán hàng hoặc xin review.

## 10.5. In-app feedback và store review — `LOCKED`

PixelDoro có hai luồng độc lập:

### In-app product feedback

- Popup/screen trong app thu `experience score` từ 1–5 sao và nội dung góp ý tùy chọn.
- Đây là feedback gửi cho team PixelDoro, không phải rating gửi lên App Store hoặc Google Play.
- UI phải ghi rõ ngữ cảnh “Góp ý cho PixelDoro”, không giả dạng system store review prompt.
- Feedback entry luôn có trong Settings và có thể xuất hiện ở một thời điểm phù hợp ngoài active Focus/Break session.
- Submit feedback cần mạng nhưng lỗi mạng không được làm hỏng core loop; hành vi retry/queue thuộc technical specification.

### App Store / Google Play review

- Store rating/review chỉ dùng system-provided in-app review API của Apple và Google, thông qua platform adapter.
- Không dùng custom UI để thay thế hoặc mô phỏng store review prompt.
- Không review-gate: `experience score`, sentiment hoặc nội dung feedback không được dùng để quyết định ai được thấy, ai bị chặn hoặc ai được chuyển tới store review.
- Không hỏi người dùng về mức độ hài lòng ngay trước hoặc trong store review flow.
- Không thưởng XP, Coin, item hoặc lợi ích khác để đổi lấy rating/review.
- Store review request lần đầu chỉ eligible trong production build sau ít nhất 7 ngày cài đặt, 5 completed standard Focus sessions và 3 ngày có completed standard Focus session khác nhau. Onboarding trial không đóng góp vào count hoặc active day này.
- Request chỉ được gọi tại natural stopping point: người dùng vừa completed Focus, đã xem xong reward/celebration và trở về Home; không gọi sau failed/cancelled session hoặc khi có active Focus/Break, onboarding hay modal khác.
- Cooldown tối thiểu 120 ngày, tối đa 3 attempts trong rolling 365 ngày và tối đa một attempt/app version. Mọi lần gọi đều tính là attempt kể cả khi OS/store không hiển thị prompt; không retry ngay.
- Eligibility không được đọc feedback score, sentiment, comment hoặc feedback history. App không suy diễn rating/review outcome từ native API.

Mục tiêu của in-app feedback là phát hiện vấn đề sớm và cải thiện trải nghiệm. Không được thao túng, lọc hoặc che giấu rating/review trên App Store và Google Play.

---

# 11. Notifications, Audio and Haptics

## 11.1. Local notifications — `LOCKED`

MVP dùng local notification cho:

- Focus session kết thúc.
- Break session kết thúc.

Notification permission phải được yêu cầu trong context phù hợp, không bắt buộc ngay lần launch đầu tiên nếu chưa giải thích giá trị.

Nếu permission bị từ chối, timer vẫn phải hoạt động đầy đủ khi app được mở lại.

## 11.2. Audio — `MVP_DEFAULT`

Âm thanh 8-bit có thể dùng cho:

- Button feedback.
- Focus completed.
- Break completed.
- Level/unlock.

Âm thanh phải có setting tắt hoàn toàn.

## 11.3. Haptics — `MVP_DEFAULT`

Haptic dùng tiết chế cho:

- Start session.
- Complete session.
- Reward/unlock.
- Các nút quan trọng.

Haptic phải có setting tắt.

---

# 12. History and Analytics for Users

## 12.1. User-facing history — `MVP_DEFAULT`

Người dùng có thể xem:

- Tổng số phút focus theo ngày.
- Danh sách session gần đây.
- Tag của session.
- Completed/failed/cancelled status.
- Contribution graph cơ bản theo ngày.

Onboarding trial không xuất hiện trong standard Focus history và không đóng góp vào tổng phút focus theo ngày.

Phân tích sâu theo tuần/tháng và cloud history là `DEFERRED`.

## 12.2. Contribution graph semantics

Mỗi ô biểu diễn tổng số phút của các standard Focus session `completed` trong một ngày local.

Session `failed` và `cancelled` không đóng góp vào intensity.
Onboarding trial không đóng góp vào intensity dù trial `completed`.

Ngưỡng màu cụ thể: `OPEN`.

---

# 13. Product Analytics and User Research

## 13.1. Mục tiêu đo lường — `LOCKED`

Analytics chỉ nhằm trả lời:

1. Người dùng có bắt đầu session không?
2. Người dùng có hoàn thành session không?
3. Người dùng có bắt đầu session thứ hai không?
4. Người dùng có quay lại vào ngày/tuần sau không?
5. Pet, reward và room có ảnh hưởng tới động lực không?

## 13.2. Events tối thiểu — `MVP_DEFAULT`

```text
onboarding_started
onboarding_completed
focus_setup_viewed
focus_session_started
focus_session_completed
focus_session_failed
focus_session_cancelled
break_started
break_completed
reward_granted
shop_viewed
item_unlocked
item_equipped
history_viewed
feedback_started
feedback_submitted
```

Onboarding trial chỉ dùng `onboarding_started` và `onboarding_completed` trong core analytics. Trial không phát `focus_session_started`, `focus_session_completed` hoặc `reward_granted`; điều này giữ first-session/core Focus metrics tách khỏi tutorial exception.

## 13.3. Core metrics

- First-session start rate.
- First-session completion rate.
- Second-session start rate.
- Sessions completed per active user.
- D1 retention.
- D7 retention.
- Relax/Strict Mode usage split.
- Shop engagement.
- Feedback sentiment về Pet companion.

Target số cụ thể: `OPEN`. Không được tự coi benchmark đề xuất là product requirement.

## 13.4. Beta rollout — `LOCKED`

```text
Internal prototype
    → khoảng 10 internal/close users
    → sửa lỗi trải nghiệm chính
    → closed beta khoảng 30–50 target users
    → phỏng vấn định tính
    → review retention và session behavior
    → quyết định mở rộng hoặc điều chỉnh core loop
```

---

# 14. Data Truth

## 14.1. Core entities

### PetProfile

```text
id
name
type
stage
level
exp
equippedSkinId
createdAt
updatedAt
```

### FocusSession

```text
id
focusDurationMinutes
breakDurationMinutes
mode
status
tag
startedAt
endsAt
backgroundedAt
resolvedAt
coinsEarned
xpEarned
rewardClaimedAt
createdAt
updatedAt
```

### InventoryItem

```text
id
category
name
price
isDefault
metadata
```

### OwnedItem

```text
id
itemId
unlockedAt
isEquipped
```

### RewardTransaction

```text
id
sessionId
xpDelta
coinDelta
reason
createdAt
```

### AppSettings

```text
focusDurationMinutes
shortBreakMinutes
longBreakMinutes
defaultMode
soundEnabled
hapticsEnabled
notificationsEnabled
```

Chi tiết type, constraint, index và migration thuộc `architecture/data-model.md`.

## 14.2. Data ownership — `LOCKED`

- Mobile MVP lưu dữ liệu local trên thiết bị.
- Người dùng có thể reset/xóa toàn bộ dữ liệu local.
- Không yêu cầu account để sử dụng core loop.
- Cloud sync không được giả định tồn tại.

---

# 15. Technical Direction

## 15.1. Locked stack for Mobile MVP

| Thành phần | Quyết định | Trạng thái |
|---|---|---|
| Framework | React Native | `LOCKED` |
| Language | TypeScript | `LOCKED` |
| Tooling | Expo Development Build | `LOCKED` |
| State | Zustand | `MVP_DEFAULT` |
| Database | SQLite | `MVP_DEFAULT` |
| Animation | Reanimated; Skia chỉ khi cần hiệu ứng phức tạp | `MVP_DEFAULT` |
| Notification | Local notifications | `LOCKED` |
| Analytics | PostHog Cloud EU, anonymous manual events qua adapter | `MVP_DEFAULT` |
| Store review | System review API qua `expo-store-review` | `LOCKED` |
| OTA update | EAS Update | `LOCKED` |
| Build và submission | EAS Build + EAS Submit + EAS Workflows | `LOCKED` |
| Signing credentials | EAS-managed remote credentials | `LOCKED` |
| Architecture | Offline-first, domain tách khỏi platform | `LOCKED` |

## 15.2. Architecture constraints — `LOCKED`

- Business rules viết bằng TypeScript thuần khi có thể.
- Domain không import React Native, Expo hoặc UI framework.
- SQLite không được truy cập trực tiếp từ screen component.
- Timer sử dụng timestamp và reconciliation.
- Reward grant phải idempotent.
- Platform APIs đi qua adapter/interface.
- Analytics chỉ dùng anonymous installation ID và manual event allowlist; cấm person profile, autocapture, session replay, advertising identifier và dữ liệu free text. Queue/cost/retention limits theo Technical Overview và ADR-008.
- EAS Update chỉ phát hành JavaScript, styling và bundled asset tương thích với native runtime hiện có.
- Thay đổi native dependency, Expo SDK, permission hoặc native configuration phải tạo binary mới qua EAS Build.
- OTA update phải được ràng buộc bằng `runtimeVersion`; production update phải qua preview validation và có rollback path.
- Signing credential không được commit vào repository; quyền quản lý credential phải dùng EAS role/permission phù hợp.
- Desktop tương lai phải có khả năng reuse core domain packages.

## 15.3. Desktop direction

Desktop là `DEFERRED` cho tới khi Mobile MVP chứng minh core loop.

Các lựa chọn tương lai có thể gồm:

- React + Electron, reuse TypeScript domain.
- React Native Windows/macOS.
- Phương án khác sau technical spike.

Chưa có lựa chọn desktop nào là quyết định đã chốt.

---

# 16. Monetization Truth

## 16.1. MVP monetization — `LOCKED`

Mobile MVP không cần chứng minh monetization và không tích hợp quảng cáo hoặc thanh toán production.

## 16.2. Long-term candidates — `DEFERRED`

- One-time lifetime/founder unlock.
- Cosmetic skin/theme/room packs.
- Tip jar/supporter badge.
- Subscription chỉ khi có giá trị định kỳ thực sự như cloud sync hoặc content cadence.

## 16.3. Monetization constraints — `LOCKED`

- Không đặt quảng cáo bắt buộc trong luồng focus.
- Không dùng cảm giác Pet đau/bệnh để ép mua hoặc xem quảng cáo.
- Core focus timer phải hữu dụng mà không cần trả tiền.
- Giá và package cụ thể là `OPEN`.

---

# 17. Non-goals

PixelDoro không nhằm trở thành các sản phẩm sau trong giai đoạn hiện tại:

- Task manager thay thế Todoist/Things/Notion.
- Habit tracker toàn diện.
- Calendar hoặc project-management suite.
- RPG có combat và multiplayer.
- Social network năng suất.
- Công cụ giám sát nhân viên.
- Ứng dụng chặn toàn bộ thiết bị bằng mọi giá.
- AI productivity assistant.
- Game được tối ưu để tăng screen time.

Trạng thái: `LOCKED` cho Mobile MVP.

---

# 18. Roadmap Direction

## Phase 0 — Documentation and prototype

- Chốt product truth.
- Hoàn thiện tám tài liệu kỹ thuật cốt lõi.
- Tạo một Pet animation prototype.
- Kiểm chứng timer lifecycle trên thiết bị thật.

## Phase 1 — Mobile MVP

- Hoàn thành core loop.
- Phát hành internal build.
- Phát hành closed beta.
- Thu thập analytics và feedback.

## Phase 2 — Retention improvements

Chỉ thực hiện khi dữ liệu cho thấy core loop có tín hiệu tích cực:

- Pet evolution.
- Nhiều room/item hơn.
- Streak có tính bảo vệ ngày nghỉ.
- Daily/weekly quests nhẹ.
- Analytics sâu hơn.

## Phase 3 — Native mobile capabilities

- App blocking/allowlist.
- Live Activities/Dynamic Island.
- Lock Screen/Home Screen widgets.

## Phase 4 — Account and expansion

- Cloud backup/sync.
- Authentication.
- Monetization production.
- Desktop companion.

Roadmap phases không phải cam kết thời gian và không tự động trở thành scope của phase hiện tại.

---

# 19. MVP Acceptance Definition

Mobile MVP được xem là đủ điều kiện closed beta khi:

- [ ] Người dùng mới hiểu được giá trị Pet companion qua onboarding.
- [ ] Người dùng có thể bắt đầu Relax hoặc Strict focus session.
- [ ] Timer vẫn đúng sau background/foreground.
- [ ] App reconcile đúng session sau crash/relaunch thông thường.
- [ ] Strict grace period 10 giây hoạt động theo rule.
- [ ] Completed session chỉ được cấp reward một lần.
- [ ] Failed/cancelled session không nhận reward.
- [ ] Pet thể hiện đúng Idle, Working, Break, Celebrating và Bugged.
- [ ] Local notification hoạt động khi được cấp quyền.
- [ ] Permission bị từ chối không làm hỏng timer.
- [ ] XP/Coin và inventory persist sau khi restart app.
- [ ] Shop có đúng 12 item và price theo §9.4; catalog hiển thị từ đầu và không level-gate.
- [ ] Purchase không làm Coin âm, không debit/unlock hai lần và commit Coin debit + ownership atomically.
- [ ] Item đã sở hữu persist sau restart, equip miễn phí và không bị xóa do unequip hoặc session outcome.
- [ ] Lịch sử hiển thị đúng completed/failed/cancelled session.
- [ ] Completed onboarding trial 5 phút nhận đúng 5 XP/1 Coin tối đa một lần và không ảnh hưởng standard history/cadence/store-review/core Focus analytics.
- [ ] Onboarding trial persist `mode = relax`, `workTag = null`, không hiển thị selector tương ứng và không thể fail bởi Strict violation.
- [ ] Contribution graph chỉ tính completed standard Focus minutes và loại onboarding trial.
- [ ] Người dùng có thể tắt audio và haptic.
- [ ] Người dùng có thể gửi feedback.
- [ ] Các analytics event chính không phát trùng ngoài chủ đích.
- [ ] Không có crash/blocker đã biết trong core focus flow.
- [ ] Có cơ chế reset/xóa dữ liệu local.

---

# 20. Product Decisions

## 20.1. Resolved decisions

| ID | Quyết định | Owner | Trạng thái | Ngày chốt |
|---|---|---|---|---|
| OPEN-002 | Mobile MVP không hỗ trợ pause cho cả Focus session và Break session; người dùng có thể cancel hoặc để timer tiếp tục. | Product | `RESOLVED` | 2026-08-26 |
| OPEN-003 | Sau bốn completed Focus kể từ completed Long Break gần nhất, Break kế tiếp là Long Break 15 phút. Trạng thái đến hạn giữ qua relaunch, chỉ reset khi Long Break completed; failed/cancelled Focus và cancelled Long Break không thay đổi/reset cadence. Quyết định chọn loại Break không đồng nghĩa auto-start. | Product | `RESOLVED` | 2026-08-26 |
| OPEN-004 | Completed Focus nhận `XP = completedFocusMinutes` và `Coin = floor(completedFocusMinutes / 5)`; overtime không tạo thêm reward, failed/cancelled Focus và Break không nhận XP/Coin. | Product/Game Design | `RESOLVED` | 2026-08-26 |
| OPEN-010 | Break không auto-start. Sau completed Focus reward/celebration, người dùng chọn “Bắt đầu nghỉ” hoặc “Về Home”; chỉ StartBreak transaction sau explicit action mới tạo running Break. | Product | `RESOLVED` | 2026-08-26 |
| OPEN-007 | Beta analytics dùng PostHog Cloud EU qua adapter, anonymous-only và manual allowlist; áp dụng queue, privacy, retention và cost limits trong ADR-008. | Engineering/Product | `RESOLVED` | 2026-08-26 |
| OPEN-008 | Feedback được thu bằng popup/screen trong app với `experience score` 1–5 sao và nội dung tùy chọn. Store review là flow độc lập dùng system API; cấm review gating. | Product | `RESOLVED` | 2026-08-26 |
| OPEN-011 | Store review dùng engagement trigger trung tính: production-only, sau 7 ngày cài đặt, 5 completed standard Focus sessions và 3 standard-Focus active days; onboarding trial không được tính. Request tại Home sau reward/celebration; cooldown 120 ngày, tối đa 3 attempts/365 ngày và một attempt/app version. | Product/Engineering | `RESOLVED` | 2026-08-26 |
| SL-OPEN-001 | Break không áp dụng Strict/grace violation; background/lock/crash/kill không làm Break failed. | Product/Engineering | `RESOLVED` | 2026-08-26 |
| SL-OPEN-002 | Chỉ completed Focus eligible đi tiếp tới Break; failed/cancelled Focus về Home hoặc thử lại và không có Break CTA/entry. | Product | `RESOLVED` | 2026-08-26 |
| GR-OPEN-003 | Onboarding trial là special Focus cố định 5 phút; completed trial nhận 5 XP/1 Coin bằng automatic idempotent grant nhưng không tính standard history/contribution, Long Break cadence, store-review eligibility hoặc core Focus/reward analytics. | Product/Game Design | `RESOLVED` | 2026-08-26 |
| DM-OPEN-006 | Onboarding trial dùng Relax semantics, persist `mode = relax`, không có work tag (`workTag = null`), không hiển thị mode/tag selector và không có Strict failure branch. | Product/Engineering | `RESOLVED` | 2026-08-27 |
| OPEN-005 | Mobile MVP có đúng 12 neutral room `furniture` items với exact ID/name/price 5–120 Coin theo §9.4; catalog mở từ đầu, không level-gate, mua một lần atomically bằng Coin và equip miễn phí khi owned. | Product/Game Design | `RESOLVED` | 2026-08-26 |

## 20.2. Open decisions

Các mục sau chưa được chốt và phải được quyết định rõ trong tài liệu liên quan:

| ID | Câu hỏi | Owner | Trạng thái |
|---|---|---|---|
| OPEN-001 | Pet mặc định của MVP là Cat, Dog hay Robot? | Product/Art | `OPEN` |
| OPEN-006 | Contribution graph dùng các ngưỡng màu nào? | Product/Design | `OPEN` |
| OPEN-009 | Người dùng có được đặt tên Pet trong onboarding không? | Product | `OPEN` |

Không mục nào trong bảng này được xem là requirement đã chốt cho tới khi trạng thái được cập nhật.

---

# 21. Glossary

| Thuật ngữ | Định nghĩa |
|---|---|
| Focus Session | Khoảng thời gian người dùng cam kết tập trung. |
| Break Session | Khoảng nghỉ sau Focus. |
| Relax Mode | Mode cho phép rời app mà không fail session. |
| Strict Mode Lite | Mode phát hiện app background quá grace period nhưng chưa khóa app native. |
| Grace Period | Khoảng 10 giây cho phép người dùng quay lại trước khi Strict session fail. |
| Pet | Người bạn pixel phản ánh trạng thái và tiến trình focus. |
| Pet Room | Không gian chính để hiển thị Pet và đồ trang trí. |
| XP | Điểm tiến trình nhận từ completed focus time. |
| Coin | Tiền soft currency dùng mở khóa cosmetic item. |
| Reward Grant | Thao tác cấp XP/Coin cho một completed session. |
| Reconciliation | Tính lại session truth từ timestamp khi app resume/relaunch. |
| Contribution Graph | Biểu đồ ô theo ngày thể hiện completed focus minutes. |
| Mobile MVP | Bản iOS/Android tối thiểu dùng để kiểm chứng core loop với người dùng. |

---

# 22. Change Log

## 1.13.0 — 2026-08-27

- Chốt `DM-OPEN-006` theo phương án A: onboarding trial persist `mode = relax` và `workTag = null`.
- Chốt trial không hiển thị mode/work-tag selector, dùng Relax lifecycle và không có Strict/grace-period failure.
- Giữ nguyên trial reward 5 XP/1 Coin, automatic idempotent grant và toàn bộ exclusion khỏi standard history/contribution/cadence/store-review/core Focus analytics.
- Bổ sung MVP acceptance và cho phép maintenance sync Timer Engine, Session Lifecycle, Gamification Rules cùng Data Model.

## 1.12.0 — 2026-08-26

- Chốt Product `OPEN-005` theo phương án B: Mobile MVP có đúng 12 neutral room `furniture` items với exact ID/name/price từ 5 đến 120 Coin.
- Chốt default room/Pet assets không tính vào 12 shop items; catalog hiển thị từ đầu và không level-gate.
- Chốt item mua một lần bằng atomic Coin debit + ownership, Coin không âm và equip miễn phí khi đã sở hữu.
- Chốt catalog cosmetic-only, không multiplier/gameplay advantage và không dynamic pricing/refund/sell-back/consumable/duplicate/gift/trade trong MVP.
- Bổ sung MVP acceptance cho exact catalog, purchase idempotency/atomicity và inventory persistence.

## 1.11.0 — 2026-08-26

- Chốt `GR-OPEN-003`: onboarding trial là special Focus cố định 5 phút và là ngoại lệ đối với minimum standard Focus 15 phút.
- Chốt completed trial nhận `5 XP`, `1 Coin` bằng cùng reward formula và automatic atomic/idempotent grant theo `sessionId`.
- Chốt trial reward đóng góp cumulative XP/level và Coin balance nhưng không tính standard history/contribution graph, Long Break cadence, store-review eligibility hoặc core Focus/reward analytics.
- Làm rõ standard Focus duration, first-use flow, store-review count, history, contribution graph, analytics và MVP acceptance tương ứng.

## 1.10.0 — 2026-08-26

- Chốt `OPEN-004`: completed Focus nhận XP bằng số phút Focus đã cấu hình và Coin bằng `floor(completedFocusMinutes / 5)`.
- Quy định overtime không tạo thêm reward; failed/cancelled Focus và mọi Break không nhận XP/Coin.
- Giữ automatic reward grant trong completed Focus transaction và reward idempotency theo baseline đã duyệt.

## 1.9.0 — 2026-08-26

- Chốt `OPEN-010`: Break không auto-start trong Mobile MVP.
- Sau completed Focus reward/celebration, người dùng chủ động chọn “Bắt đầu nghỉ” hoặc “Về Home”.
- Quy định chỉ StartBreak transaction sau explicit action mới tạo running Break; crash/kill/relaunch trước action không được tự tạo Break.
- Giữ automatic Short/Long Break type selection của `OPEN-003` độc lập với manual start behavior.

## 1.8.0 — 2026-08-26

- Chốt `OPEN-003`: sau bốn completed Focus kể từ completed Long Break gần nhất, Break kế tiếp là Long Break 15 phút.
- Quy định Long Break due state giữ qua relaunch, chỉ reset khi Long Break completed; failed/cancelled Focus và cancelled Long Break không thay đổi/reset cadence.
- Tách automatic Break type selection khỏi `OPEN-010` về auto-start Break.
- Đồng bộ `SL-OPEN-001`: Break không áp dụng Strict hoặc grace-period failure.
- Đồng bộ `SL-OPEN-002`: chỉ completed Focus eligible đi tiếp tới Break; failed/cancelled Focus không có Break CTA/entry.

## 1.7.0 — 2026-08-26

- Chốt safe-recovery behavior cho corrupt timestamp và database read/write failure.
- Cấm tự suy diễn terminal result hoặc cấp reward khi durable truth không đọc/validate/commit được.
- Quy định recovery UI giữ dữ liệu, cho phép retry; explicit cancel áp dụng cho phiên lỗi có thể truy cập và full reset chỉ là phương án cuối có xác nhận.

## 1.6.0 — 2026-08-26

- Chốt device wall clock làm time authority của offline Mobile MVP và chấp nhận giới hạn khi system clock bị thay đổi.
- Chốt evidence-based Strict recovery khi relaunch thiếu persisted `backgroundedAt`; không fail nếu không có durable evidence.
- Chốt clear `backgroundedAt` atomically khi Strict session quay lại an toàn trong grace period.
- Làm rõ reward được grant tự động trong completed Focus transaction; Result screen không phải manual claim trigger.

## 1.5.0 — 2026-08-26

- Ghi nhận Dũng Lư là Tech Lead, Product Owner và Lead Mobile Developer của PixelDoro Mobile MVP.
- Làm rõ Dũng Lư đồng thời sở hữu product decision, technical direction và implementation chính phía mobile.

## 1.4.0 — 2026-08-26

- Chốt `OPEN-002`: Mobile MVP không hỗ trợ pause cho cả Focus session và Break session.
- Quy định UI không có action Pause/Resume; timer MVP không có trạng thái `paused` hoặc field `pausedAt`.
- Giữ cancel hoặc tiếp tục timer là hai lựa chọn khi session đang chạy; pause chỉ được xem xét lại bằng Product decision mới sau beta.

## 1.3.0 — 2026-08-26

- Chốt `OPEN-011`: điều kiện engagement trung tính và natural stopping point cho native store review request.
- Chốt minimum 7 ngày cài đặt, 5 completed Focus sessions, 3 active days; cooldown 120 ngày, tối đa 3 attempts/365 ngày và một attempt/app version.
- Quy định không retry khi prompt không hiển thị, không suy diễn review outcome và không dùng feedback data để xét eligibility.

## 1.2.0 — 2026-08-26

- Chốt `OPEN-007`: PostHog Cloud EU cho beta analytics, tích hợp qua adapter với anonymous manual events.
- Khóa nguyên tắc không person profile, autocapture, session replay, advertising identifier hoặc free-text analytics.
- Dẫn chiếu queue, event volume, retention và billing limits sang Technical Overview cùng ADR-008.

## 1.1.0 — 2026-08-26

- Chốt `OPEN-008`: feedback dùng popup/screen trong app với experience score 1–5 sao và nội dung tùy chọn.
- Tách in-app product feedback khỏi App Store/Google Play review; cấm review gating, incentive và custom store review prompt.
- Chốt system store review API qua `expo-store-review`; thêm `OPEN-011` cho trigger/frequency cap.
- Chốt EAS Update cho OTA, EAS-managed remote credentials và EAS Build/Submit/Workflows cho release pipeline.

## 1.0.0 — 2026-08-26

- Tạo single source of truth đầu tiên.
- Chốt Mobile MVP trước, dùng React Native và team JavaScript hiện có.
- Hoãn desktop cho tới sau khi kiểm chứng người dùng.
- Tách rõ product vision, MVP scope và future roadmap.
- Xác định timer timestamp model, Strict Mode Lite và reward idempotency.
- Ghi lại các quyết định còn mở cần product review.
