# US-02-03 forward migration native runtime probe

Run this probe manually on an existing development build after automated checks pass. It uses
only these isolated databases and deletes them after every successful run:

- `pixeldoro-us-02-03-migration-probe.db`
- `pixeldoro-us-02-03-incompatible-probe.db`
- `pixeldoro-us-02-03-retry-probe.db`

It never opens or deletes production `pixeldoro.db`. Do not run an EAS/native build solely for
this Story; use the existing development build.

## 1. Use the pinned toolchain and capture the implementation SHA

```sh
nvm use
git rev-parse HEAD
```

The required versions are Node `22.23.2` and pnpm `11.24.0`.

## 2. Start the explicit dev-only probe

```sh
EXPO_PUBLIC_FORWARD_MIGRATION_PROBE=1 \
EXPO_PUBLIC_COMMIT_SHA=<commit-sha> \
pnpm start
```

Open the existing development build on iOS or Android and wait for the structured console
report. Normal UI is unchanged because US-02-03 does not wire production bootstrap.

## 3. Expected report

The console prefix is `[PixelDoro][ForwardMigrationProbe]`. Accept the run only when:

- `probe: "US-02-03_FORWARD_MIGRATION"`
- `passed: true`
- `applicationId` matches the installed PixelDoro development build
- `commitSha` exactly matches `git rev-parse HEAD`
- all assertions are present:
  - `empty_database_migrated_to_latest`
  - `exact_history_committed_after_validation`
  - `latest_rerun_was_noop`
  - `synthetic_upgrade_applied_in_order`
  - `incompatible_history_rejected_before_write`
  - `failed_migration_rolled_back_without_false_history`
  - `failed_history_write_rolled_back_without_false_history`
  - `retry_resumed_from_valid_durable_history`
  - `committed_history_survived_reopen`
  - `probe_connections_closed_and_databases_cleaned`

Record the complete report in `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`. One native
platform closes the US-02-03 runtime gate; the iOS + Android repeat belongs to US-02-09.

## 4. Cleanup

Stop Metro and unset `EXPO_PUBLIC_FORWARD_MIGRATION_PROBE`. Default/production startup must
not execute this probe. If cleanup fails, the report returns `passed: false`; manually remove
only the three exact probe databases above before retrying.
