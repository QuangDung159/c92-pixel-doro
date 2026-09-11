# US-08-04 — Equipped Pet Room quick UI smoke

Status: `IMPLEMENTATION_CANDIDATE`; owner/manual evidence remains `NOT_RUN`.

## Setup nhanh

```sh
cd /Users/dunglu/Documents/Working/c92-pixel-doro
export PATH="/Users/dunglu/.nvm/versions/node/v22.23.2/bin:$PATH"
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=inventory_multi_equipped pnpm start --clear
```

Fixture uses isolated database prefix `pixeldoro-us-08-03-` and production reward/purchase/equip
commands. Open Home/Pet Room after boot.

## Smoke bắt buộc

- [ ] Warm empty-room backdrop appears; Cat and its status remain visible and animate normally.
- [ ] Backdrop fits the full room frame without zoom/crop; Cat is smaller than the standalone Focus view.
- [ ] `Cốc trên bàn` and `Chậu cây nhỏ` appear together at stable positions; room summary says 2 items.
- [ ] Open Shop → `Đã sở hữu`, unequip `Chậu cây nhỏ`, return Home: only the plant disappears.
- [ ] Equip it again, return Home, background/foreground and cold relaunch: both items return from SQLite.
- [ ] `Bắt đầu tập trung` remains tappable; Working/Breaking/Celebrating/Bugged Pet state is unchanged by decor.
- [ ] Open a Focus or Break screen: only Cat + status is rendered; no room backdrop or decoration layer.
- [ ] Airplane mode still renders the bundled room; no remote image request or crash.
- [ ] Largest text keeps summary/notices outside the scene; VoiceOver/TalkBack announces one room summary,
  not individual decoration images; Reduce Motion does not hide the room.

## Empty và cleanup

```sh
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=inventory_empty pnpm start --clear
unset EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] `inventory_empty` shows backdrop + Cat and summary `Phòng chưa có vật phẩm được trang bị.`
- [ ] Normal database remains untouched after fixture cleanup.

| Platform/device/OS | Fixture | Result | Artifact/notes |
|---|---|---|---|
| `<fill>` | `inventory_multi_equipped` | `NOT_RUN` | `<implementation-sha>` |
| `<fill>` | `inventory_empty` | `NOT_RUN` | `<fill>` |
