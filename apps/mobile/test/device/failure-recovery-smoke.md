# US-02-07 failure recovery native runtime probe

Run this probe manually on an existing development build after automated checks pass. It uses only
`pixeldoro-us-02-07-failure-recovery-probe.db`, removes that isolated database after the run and
never opens, mutates or deletes production `pixeldoro.db`.

Do not create a native/EAS build solely for this Story; use the existing development build.

## 1. Use the pinned toolchain and capture the implementation SHA

```sh
nvm use
git rev-parse HEAD
```

Required versions: Node `22.23.2`, pnpm `11.24.0`.

## 2. Start the explicit dev-only probe

Stop the previous Metro process and clear earlier probe flags before starting:

```sh
unset EXPO_PUBLIC_SQLITE_KERNEL_PROBE
unset EXPO_PUBLIC_INITIAL_SCHEMA_PROBE
unset EXPO_PUBLIC_FORWARD_MIGRATION_PROBE
unset EXPO_PUBLIC_SAFE_BOOTSTRAP_PROBE
unset EXPO_PUBLIC_TYPED_REPOSITORIES_PROBE
unset EXPO_PUBLIC_DERIVED_QUERIES_PROBE

EXPO_PUBLIC_FAILURE_RECOVERY_PROBE=1 \
EXPO_PUBLIC_COMMIT_SHA=<commit-sha> \
pnpm start --clear
```

Open the existing development build on iOS or Android. The isolated probe runs first, then normal
application bootstrap continues against production `pixeldoro.db`.

## 3. Expected report

Console prefix: `[PixelDoro][FailureRecoveryProbe]`. Accept only when:

- `probe: "US-02-07_FAILURE_RECOVERY"`
- `passed: true`
- `applicationId` matches the installed PixelDoro development build
- `commitSha` exactly matches `git rev-parse HEAD`
- `sqliteVersion` is present and is not `unavailable`
- all assertions are present:
  - `recovery_probe_database_opened_and_migrated`
  - `typed_failure_reason_was_sanitized`
  - `failure_closed_readiness_and_hid_core_projection`
  - `durable_rows_survived_injected_failure`
  - `concurrent_retry_coalesced_to_one_attempt`
  - `retry_reused_same_database_and_reran_ordered_barrier`
  - `successful_retry_hydrated_fresh_snapshot_before_ready`
  - `side_effect_failure_did_not_enter_core_recovery`
  - `no_reset_repair_terminal_or_reward_path_was_invoked`
  - `repeated_retry_and_dispose_were_safe`
  - `probe_connections_closed_and_database_cleaned`

Send the complete structured report for recording in
`docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`. One native platform closes the US-02-07
runtime gate; iOS + Android repetition remains part of `US-02-09`.

## 4. UI observation

The normal bootstrap placeholder should appear after the probe. No Timer, Session, Pet, reset or
feature UI is added. The recovery boundary now has friendly copy and an accessible `Thử lại`
action when a real critical database failure occurs; it does not display SQL, rows, exception text
or a technical error code.

## 5. Cleanup

Stop Metro and unset `EXPO_PUBLIC_FAILURE_RECOVERY_PROBE`. Default/production startup must not
execute the probe. If cleanup fails, accept `passed: false` and manually remove only the exact probe
database named above before retrying.
