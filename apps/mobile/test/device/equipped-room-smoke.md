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
- [ ] `Cốc trên bàn` sits at the left edge of the desk and `Chậu cây nhỏ` sits immediately to its
  right/behind it, matching the approved room perspective; the mug visibly overlaps the plant pot
  where their bounds meet, and both remain on the desk surface.
- [ ] Repeat on one narrow and one wide portrait device: item anchors and sizes retain the same
  relationship to the desk, floor and walls.
- [ ] Open Shop → `Đã sở hữu`, unequip `Chậu cây nhỏ`, return Home: only the plant disappears.
- [ ] Equip it again, return Home, background/foreground and cold relaunch: both items return from SQLite.
- [ ] `Bắt đầu tập trung` remains tappable; Working/Breaking/Celebrating/Bugged Pet state is unchanged by decor.
- [ ] Open a Focus or Break screen: only Cat + status is rendered; no room backdrop or decoration layer.
- [ ] Airplane mode still renders the bundled room; no remote image request or crash.
- [ ] Normal Pet Room shows no item-list text and no visible `Người bạn đang chờ bạn` label.
- [ ] VoiceOver/TalkBack can still announce the Pet state and one room summary without focusing
  individual decoration images; Reduce Motion does not hide the room.

## Full-room visual pass

```sh
EXPO_PUBLIC_EPIC_08_ROOM_REVIEW_FIXTURE=room_full_equipped pnpm start --clear
```

- [ ] All 12 approved decorations render together without changing SQLite ownership/equipment.
- [ ] Compare visible artwork bounds (not transparent atlas cells) with the approved contact sheet:
  mug/plant/books/lamp sit on the desk; calendar/poster/window hang on the wall; bookshelf,
  armchair and standing lamp form the right-side cluster; cushion/rug sit on the floor.
- [ ] Relative sizes match the approved composition: window/rug/furniture remain large while desk
  accessories remain small; Cat is centered above the rug.
- [ ] Repeat the full-room fixture on one narrow and one wide portrait device. Every object keeps the
  same relationship to the room surfaces; no per-device anchor adjustment or state reset is needed.

## Empty và cleanup

```sh
EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE=inventory_empty pnpm start --clear
unset EXPO_PUBLIC_EPIC_08_REVIEW_FIXTURE
unset EXPO_PUBLIC_EPIC_08_ROOM_REVIEW_FIXTURE
pnpm start --clear
```

- [ ] `inventory_empty` shows only backdrop + Cat without an empty-state paragraph.
- [ ] Normal database remains untouched after fixture cleanup.

| Platform/device/OS | Fixture | Result | Artifact/notes |
|---|---|---|---|
| `<fill>` | `inventory_multi_equipped` | `NOT_RUN` | `<implementation-sha>` |
| `<fill>` | `inventory_empty` | `NOT_RUN` | `<fill>` |
