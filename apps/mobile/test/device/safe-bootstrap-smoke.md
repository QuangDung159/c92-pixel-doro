# US-02-04 safe bootstrap native runtime probe

Run this probe manually on an existing development build after automated checks pass. It uses
only `pixeldoro-us-02-04-safe-bootstrap-probe.db` and deletes that database after the run.
It never opens, mutates, or deletes production `pixeldoro.db`.

Do not create a native/EAS build solely for this Story; use the existing development build.

## 1. Use the pinned toolchain and capture the implementation SHA

```sh
nvm use
git rev-parse HEAD
```

The required versions are Node `22.23.2` and pnpm `11.24.0`.

## 2. Start the explicit dev-only probe

```sh
EXPO_PUBLIC_SAFE_BOOTSTRAP_PROBE=1 \
EXPO_PUBLIC_COMMIT_SHA=<commit-sha> \
pnpm start
```

Open the existing development build on iOS or Android. The probe runs before the normal
production database bootstrap, against its isolated database only.

## 3. Expected report

The console prefix is `[PixelDoro][SafeBootstrapProbe]`. Accept the run only when:

- `probe: "US-02-04_SAFE_BOOTSTRAP"`
- `passed: true`
- `applicationId` matches the installed PixelDoro development build
- `commitSha` exactly matches `git rev-parse HEAD`
- all assertions are present:
  - `empty_database_reached_ready_after_ordered_barrier`
  - `exact_durable_snapshot_hydrated`
  - `readiness_gate_opened_only_after_reconciliation`
  - `latest_reopen_preserved_snapshot_without_duplicate_seed`
  - `injected_invariant_mismatch_entered_typed_recovery`
  - `failed_bootstrap_kept_gate_closed_and_skipped_reconciliation`
  - `failed_bootstrap_preserved_database_fingerprint`
  - `repeated_boot_and_dispose_were_idempotent`
  - `probe_connections_closed_and_databases_cleaned`

Record the complete structured report in
`docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`. One native platform closes the US-02-04
runtime gate; the iOS + Android repeat remains part of US-02-09.

## 4. UI observation

The normal application UI should appear after the probe finishes and production bootstrap
reaches `ready`. US-02-04 adds no Product screen, Retry button, Session behavior, or navigation.
If the production database itself is incompatible, the existing generic recovery boundary is
shown with a stable code and core children remain hidden.

## 5. Cleanup

Stop Metro and unset `EXPO_PUBLIC_SAFE_BOOTSTRAP_PROBE`. Default/production startup must not
execute this probe. A cleanup failure returns `passed: false`; manually remove only the exact
probe database above before retrying.
