# US-09-04 — Contribution graph visual/accessibility UI smoke

Status: `NOT_RUN`. Chỉ ghi PASS sau khi chạy trên exact `<implementation-sha>`. Guide reuse fixture DB
prefix `pixeldoro-us-09-03-`; không tạo hoặc đụng production database `pixeldoro.db`.

## 1. Setup và primary visual

Ghi platform/device/OS, build/runtime, timezone, network, text size, color filter và accessibility settings.

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=contribution_mixed_week pnpm start --clear
```

Mở tab `Lịch sử`:

- [ ] Panel `7 NGÀY GẦN ĐÂY` có đúng 7 cells theo thứ tự `06` → `12`, không horizontal scroll.
- [ ] Cells tương ứng đủ năm fill: zero/background, low/surface, medium/surfaceStrong, high/accent và
  peak/accentDark; peak có white border, bốn band còn lại dùng dark border.
- [ ] Bên dưới vẫn có đủ 7 exact rows với full date, minutes, completed session count và exact range.
- [ ] Dòng `12/09` hiển thị `Hôm nay`; marker không thay fill hoặc intensity.
- [ ] Legend `Mức đóng góp` có `0 phút`, `1–24 phút`, `25–49 phút`, `50–99 phút`, `100+ phút`;
  không có nhãn đánh giá thấp/cao/đỉnh.
- [ ] Contribution panel và `GẦN ĐÂY` cuộn trong cùng History SectionList; không nested-scroll warning.

## 2. Zero, threshold và error states

Dừng Metro giữa mỗi fixture:

```sh
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=contribution_zero_week pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=contribution_threshold_edges pnpm start --clear
EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE=contribution_read_failure_once pnpm start --clear
```

- [ ] `contribution_zero_week`: đủ 7 background cells có border, 7 rows `0 phút`, exact legend vẫn hiện.
- [ ] `contribution_threshold_edges`: colors/ranges khớp exact semantic bands, không clamp hoặc missing day.
- [ ] `contribution_read_failure_once`: graph/legend chưa render khi initial error; History vẫn usable;
  bấm `Thử lại` thì graph, rows và legend xuất hiện đúng một lần.
- [ ] Rời/quay lại tab hoặc background/foreground: stale rows/graph giữ nguyên trong lúc refresh;
  technical failure hiện Retry riêng và không che History list.
- [ ] Airplane mode và cold relaunch vẫn render cùng local projection, không tải remote asset.

## 3. Responsive và accessibility

- [ ] Small portrait: 7 cells co đều, two-digit day labels không bị mất và không có horizontal scroll.
- [ ] Largest system text: exact rows/legend wrap, không truncate/downscale; toàn bộ content cuộn tới cuối.
- [ ] VoiceOver/TalkBack đọc đúng một focus cho mỗi day: full date, `Hôm nay` ở last day, minutes, count,
  exact range; không focus lại graph strip hoặc từng swatch.
- [ ] Legend được đọc thành một text group với đủ năm ranges.
- [ ] Bật grayscale/color filter: pattern vẫn hiểu bằng day labels, exact rows và legend text.
- [ ] Bật Reduce Motion: không animation, focus jump hoặc meaning bị mất.
- [ ] Cells không có button role, tap state, tooltip hoặc affordance giả.

## 4. Cleanup và evidence

```sh
unset EXPO_PUBLIC_EPIC_09_REVIEW_FIXTURE
pnpm start --clear
```

Xác nhận normal launch dùng `pixeldoro.db`. Ghi exact implementation SHA, fixture/database,
PASS/FAIL/BLOCKED, screenshot/recording và notes; case chưa chạy giữ `NOT_RUN`.

| Platform/device/OS | Fixture/settings | Result | Artifact/notes |
|---|---|---|---|
| `<fill>` | `contribution_mixed_week` | `NOT_RUN` | `<implementation-sha>` |
| `<fill>` | `contribution_zero_week` | `NOT_RUN` | `<fill>` |
| `<fill>` | `contribution_threshold_edges` | `NOT_RUN` | `<fill>` |
| `<fill>` | `contribution_read_failure_once` | `NOT_RUN` | `<fill>` |
| `<fill>` | `Largest text + VoiceOver/TalkBack` | `NOT_RUN` | `<fill>` |
| `<fill>` | `Grayscale + Reduce Motion` | `NOT_RUN` | `<fill>` |
