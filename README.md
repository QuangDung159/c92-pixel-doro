# PixelDoro

PixelDoro is an offline-first mobile focus companion. This repository currently
implements the EPIC-01 foundation: reproducible workspace, shared core boundaries,
Expo Router skeleton, manual composition, automated quality checks, and EAS delivery
configuration. Timer, persistence, Pet behavior, and gamification start in later Epics.

## Required toolchain

- Node.js `22.23.2` (pinned in `.nvmrc`)
- pnpm `11.24.0` (pinned in `packageManager`)
- Xcode `26.4+` for iOS development builds
- Android SDK/API 36 for Android development builds

```sh
nvm use
corepack enable
pnpm install --frozen-lockfile
```

The repository intentionally has one root `pnpm-lock.yaml`. Do not run npm/yarn
install or enable pnpm's hoisted node linker without compatibility evidence and an
architecture review.

## Daily commands

```sh
pnpm quality
pnpm check:repository
pnpm run mobile:doctor
pnpm start
pnpm ios
pnpm android
```

`pnpm quality` runs strict TypeScript checks, ESLint architecture rules, layer smoke
tests, the device-harness validation, and deliberate forbidden-import checks.

For EAS account setup, native build validation, preview promotion, rollback, and
evidence capture, follow [the delivery runbook](docs/runbooks/EPIC-01_DELIVERY.md).
Builds are intentionally manual. Current repository evidence and remaining manual
gates are tracked in
[EPIC-01 implementation evidence](docs/planning/EPIC-01_IMPLEMENTATION_EVIDENCE.md).
