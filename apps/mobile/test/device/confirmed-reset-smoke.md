# US-02-08 confirmed reset native runtime probe

Run this probe manually on an existing development build after automated checks pass. It uses only
`pixeldoro-us-02-08-confirmed-reset-probe.db` and
`pixeldoro-us-02-08-confirmed-reset-failure-probe.db`, removes both isolated databases after the
run and never opens, mutates or deletes production `pixeldoro.db`.

Do not create a native/EAS build solely for this Story; use the existing development build.

## 1. Use the pinned toolchain and capture the implementation SHA

```sh
nvm use
git rev-parse HEAD
```

Required versions: Node `22.23.2`, pnpm `11.24.0`.

## 2. Start the explicit dev-only probe

Stop the previous Metro process and clear every earlier probe flag before starting:

```sh
unset EXPO_PUBLIC_SQLITE_KERNEL_PROBE
unset EXPO_PUBLIC_INITIAL_SCHEMA_PROBE
unset EXPO_PUBLIC_FORWARD_MIGRATION_PROBE
unset EXPO_PUBLIC_SAFE_BOOTSTRAP_PROBE
unset EXPO_PUBLIC_TYPED_REPOSITORIES_PROBE
unset EXPO_PUBLIC_DERIVED_QUERIES_PROBE
unset EXPO_PUBLIC_FAILURE_RECOVERY_PROBE

EXPO_PUBLIC_CONFIRMED_RESET_PROBE=1 \
EXPO_PUBLIC_COMMIT_SHA=<commit-sha> \
pnpm start --clear
```

Open the existing development build on iOS or Android. The isolated probe runs first, then normal
application bootstrap continues against production `pixeldoro.db`.

## 3. Expected report

Console prefix: `[PixelDoro][ConfirmedResetProbe]`. Accept only when:

- `probe: "US-02-08_CONFIRMED_RESET"`
- `passed: true`
- `applicationId` matches the installed PixelDoro development build
- `commitSha` exactly matches `git rev-parse HEAD`
- `sqliteVersion` is present and is not `unavailable`
- all assertions are present:
  - `reset_probe_database_opened_and_migrated`
  - `complete_pre_reset_product_fixture_was_verified`
  - `unconfirmed_and_recovery_paths_could_not_invoke_reset`
  - `notification_cleanup_failure_was_best_effort`
  - `confirmed_reset_committed_atomically`
  - `product_history_economy_and_metadata_were_cleared`
  - `singletons_reseeded_and_anonymous_identity_rotated`
  - `schema_history_triggers_indexes_and_exact_catalog_were_preserved`
  - `post_reset_bootstrap_hydrated_fresh_defaults_before_ready`
  - `injected_mid_reset_failure_restored_complete_fingerprint`
  - `concurrent_repeated_reset_and_dispose_were_safe`
  - `probe_connections_closed_and_databases_cleaned`

Send the complete structured report for recording in
`docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`. One native platform closes the US-02-08
runtime gate; iOS + Android process-kill/relaunch repetition remains part of `US-02-09`.

## 4. UI observation

The normal bootstrap placeholder should appear after the probe. US-02-08 adds no Settings entry,
warning/modal, reset button or success screen. Those confirmation and invocation surfaces belong
to EPIC-10. The capability is reachable only from the explicit dev-only probe in the current app.

## 5. Cleanup

Stop Metro and unset `EXPO_PUBLIC_CONFIRMED_RESET_PROBE`. Default/production startup must not
execute the probe. If cleanup fails, accept `passed: false` and manually remove only the two exact
probe databases named above before retrying.
