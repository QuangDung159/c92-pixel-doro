# US-02-09 cross-platform Epic exit probe

Run this probe manually on an existing compatible Expo Development Build after automated checks
pass and the final implementation/harness commit is frozen. Expo Go is not acceptance evidence.
The probe uses only these isolated databases:

- `pixeldoro-us-02-09-epic-exit-probe.db`
- the exact isolated `US-02-01`–`US-02-08` probe databases documented by their runbooks

It never reads, resets or deletes the normal `pixeldoro.db` product database.

Run the complete two-phase scenario once on iOS and once on Android using the exact same commit
SHA. The agent does not run native/EAS builds; the owner refreshes a development client manually
only when the installed binary does not contain the current Expo SQLite/config/runtime graph.

## 1. Prepare the final evidence SHA

Use Node.js `22.23.2` and pnpm `11.24.0`, then run:

```sh
pnpm quality
git diff --check
git rev-parse HEAD
```

Commit implementation/harness changes before device evidence. Documentation-only closeout after
both reports does not stale behavior evidence. Any later production, migration, dependency,
configuration, probe, harness or test-contract change invalidates both platform reports.

## 2. Clear earlier probe flags

Stop the previous Metro process and clear every component flag:

```sh
unset EXPO_PUBLIC_SQLITE_KERNEL_PROBE
unset EXPO_PUBLIC_INITIAL_SCHEMA_PROBE
unset EXPO_PUBLIC_FORWARD_MIGRATION_PROBE
unset EXPO_PUBLIC_SAFE_BOOTSTRAP_PROBE
unset EXPO_PUBLIC_TYPED_REPOSITORIES_PROBE
unset EXPO_PUBLIC_DERIVED_QUERIES_PROBE
unset EXPO_PUBLIC_FAILURE_RECOVERY_PROBE
unset EXPO_PUBLIC_CONFIRMED_RESET_PROBE
```

Only `EXPO_PUBLIC_EPIC_02_EXIT_PROBE` may be enabled during this scenario.

## 3. Start one platform run

For an iOS simulator:

```sh
EXPO_PUBLIC_EPIC_02_EXIT_PROBE=1 \
EXPO_PUBLIC_EPIC_02_TARGET_KIND=simulator \
EXPO_PUBLIC_COMMIT_SHA=<final-commit-sha> \
pnpm start
```

Use `device` instead of `simulator` for a physical iOS device. For Android, restart Metro with
`emulator` for an emulator or `device` for a physical device:

```sh
EXPO_PUBLIC_EPIC_02_EXIT_PROBE=1 \
EXPO_PUBLIC_EPIC_02_TARGET_KIND=emulator \
EXPO_PUBLIC_COMMIT_SHA=<same-final-commit-sha> \
pnpm start
```

Open the installed Development Build. Keep Metro running through both phases.

## 4. Phase 1 — commit the relaunch sentinel

Wait for one console line prefixed `[PixelDoro][Epic02ExitProbe]`. Continue only when it contains:

- `probe: "US-02-09_EPIC_EXIT"`
- `status: "AWAITING_RELAUNCH"`
- `phase: "sentinel_committed"`
- exact platform, OS, target kind, app/runtime/application ID and final commit SHA
- a non-`unavailable` SQLite version
- exactly these assertions:
  - `exit_probe_database_opened_and_migrated`
  - `persistent_sentinel_committed_before_relaunch`
  - `sentinel_connection_closed_before_relaunch`

Do not treat phase 1 as a pass. It deliberately has no `passed: true`.

## 5. Perform an actual process relaunch

After the phase-1 line:

1. Force-stop/terminate PixelDoro from the iOS app switcher, Simulator, Android recent-apps UI or
   the target's app-management controls.
2. Do not stop Metro and do not change any environment value, build, target or commit.
3. Reopen PixelDoro from its app icon.

Fast Refresh, Metro reload, route navigation, background/foreground only, or SQLite close/reopen in
the same app process do not count as this manual evidence step.

## 6. Phase 2 — accept the final platform report

The second launch validates the persisted sentinel, runs all eight production-backed component
probes, then allows the normal bootstrap to reach `ready`. Accept the platform only when the final
`[PixelDoro][Epic02ExitProbe]` JSON has:

- `passed: true`
- `phase: "completed_after_relaunch"`
- the same exact final `commitSha` used by the other platform
- exact runtime/application identity and a non-`unavailable` SQLite version
- `physicalDiskFullStatus: "NOT_RUN_UNSAFE_OR_NONDETERMINISTIC"`; current harness intentionally
  records the approved safe limitation instead of filling target storage
- exactly these component probes, in order:
  - `US-02-01_SQLITE_KERNEL`
  - `US-02-02_INITIAL_SCHEMA`
  - `US-02-03_FORWARD_MIGRATION`
  - `US-02-04_SAFE_BOOTSTRAP`
  - `US-02-05_TYPED_REPOSITORIES`
  - `US-02-06_DERIVED_QUERIES`
  - `US-02-07_FAILURE_RECOVERY`
  - `US-02-08_CONFIRMED_RESET`
- exactly these final assertions:
  - `exit_probe_database_opened_and_migrated`
  - `persistent_sentinel_survived_actual_process_relaunch`
  - `all_component_probes_passed_with_exact_assertions`
  - `migration_and_schema_safety_were_cross_platform_equivalent`
  - `constraints_repositories_and_queries_were_cross_platform_equivalent`
  - `bootstrap_recovery_retry_and_reset_were_cross_platform_equivalent`
  - `representative_unavailable_and_write_failures_preserved_durable_truth`
  - `no_open_or_deferred_schema_scope_was_detected`
  - `runtime_identity_and_final_commit_were_verified`
  - `normal_boot_reached_ready_after_exit_probe`
  - `probe_connections_closed_and_databases_cleaned`

Expected `[PixelDoro][Recovery]` lines may appear while the aggregate runs the failure/recovery and
confirmed-reset components. They are deliberate injected scenarios, not a failed exit probe. The
authoritative result is the final structured `Epic02ExitProbe` report.

Send both complete final JSON reports plus whether each target was a device, simulator or emulator
for recording in `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`.

## 7. UI observation and cleanup

After the final report, the existing foundation/bootstrap UI should appear normally. US-02-09 adds
no Timer, Session, Pet, Shop, Settings or reset UI.

Stop Metro and unset:

```sh
unset EXPO_PUBLIC_EPIC_02_EXIT_PROBE
unset EXPO_PUBLIC_EPIC_02_TARGET_KIND
unset EXPO_PUBLIC_COMMIT_SHA
```

Default and production startup must never run the exit probe. Successful phase 2 deletes every
exact isolated probe database. A failed run returns a stable `failedAssertion` and attempts exact
cleanup; do not delete or replace `pixeldoro.db` to recover a diagnostic run.
