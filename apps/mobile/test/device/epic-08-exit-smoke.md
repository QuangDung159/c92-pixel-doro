# EPIC-08 / US-08-05 quick UI smoke

Status: `NOT_RUN`  
Implementation SHA: `<implementation-sha>`

## Main offline loop

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE=epic_08_fresh_reward_to_room \
EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE=standard_completion_fast_clock \
pnpm start --clear
```

- [ ] Bật Airplane mode; app vẫn mở và không crash.
- [ ] Chạy Focus nhanh đến Result; Home và Cửa hàng cùng tăng đúng `25 XP / 5 Coin` một lần.
- [ ] Mua `Cốc trên bàn`; tap nhanh lần hai không trừ Coin hoặc unlock thêm lần nữa.
- [ ] Mở `Đã sở hữu`, chọn `Trang bị`, quay lại Pet Room và thấy cốc đúng vị trí.
- [ ] Background/refocus rồi cold relaunch; XP, Coin và vật phẩm vẫn giữ nguyên.

## Relaunch và analytics failure

Chạy riêng từng fixture với `pnpm start --clear`:

```sh
EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE=epic_08_relaunch_committed pnpm start --clear
EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE=epic_08_provider_failure pnpm start --clear
EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE=epic_08_accessibility_matrix pnpm start --clear
```

- [ ] `epic_08_relaunch_committed`: Pet Room có cốc, tổng `25 XP / 0 Coin`; relaunch không đổi dữ liệu.
- [ ] `epic_08_provider_failure`: chạy Focus/mua/trang bị bình thường dù analytics thất bại.
- [ ] `epic_08_accessibility_matrix`: Cửa hàng có đủ trạng thái available/owned/equipped.
- [ ] VoiceOver/TalkBack đọc đúng nút; largest text không che hành động; Reduce Motion không làm mất trạng thái.

## Cleanup

```sh
unset EXPO_PUBLIC_EPIC_08_EXIT_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_06_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] Launch thường dùng `pixeldoro.db`; dữ liệu thật không bị fixture thay đổi.
- [ ] Ghi PASS/FAIL/BLOCKED/NOT_RUN, device/OS/network/accessibility và exact SHA thực tế.
