# US-02-02 initial schema native runtime probe

Run this probe manually on an existing development build after automated checks pass. The
probe uses only:

- `pixeldoro-us-02-02-schema-probe.db`
- `pixeldoro-us-02-02-failure-probe.db`

It closes and deletes those exact databases after execution. It must never open, migrate or
delete `pixeldoro.db`.

## 1. Prepare the pinned toolchain

Use Node.js `22.23.2` and pnpm `11.24.0`, then verify the final implementation commit:

```sh
node --version
pnpm --version
git rev-parse HEAD
```

Do not use Node.js 24; the repository intentionally rejects it through `engines.node`.

## 2. Start the explicit dev-only probe

Stop any existing Metro process for this project, then run:

```sh
EXPO_PUBLIC_INITIAL_SCHEMA_PROBE=1 \
EXPO_PUBLIC_COMMIT_SHA=<commit-sha> \
pnpm start
```

Open the already-installed PixelDoro development build on one available iOS or Android target.
No new native/EAS build is required when the development build already contains
`expo-sqlite 57.0.2`.

The normal PixelDoro foundation screen appears after the probe completes. `US-02-02` does not
add a product UI or schema diagnostics screen.

## 3. Capture the structured result

Find one log line beginning with:

```text
[PixelDoro][InitialSchemaProbe]
```

The JSON must contain:

- `probe: "US-02-02_INITIAL_SCHEMA"`.
- `passed: true` and no `failedAssertion`.
- Exact `platform`, `osVersion`, `appVersion`, and final `commitSha`.
- These named assertions:
  - `schema_probe_database_opened`
  - `initial_schema_applied_atomically`
  - `exact_schema_surface_verified`
  - `foreign_keys_restrict_and_valid_seed_verified`
  - `exact_seed_verified`
  - `valid_entity_shapes_committed`
  - `negative_write_matrix_rejected_without_partial_rows`
  - `schema_and_seed_survived_reopen`
  - `failure_probe_database_opened`
  - `injected_apply_failure_rolled_back_all_schema`
  - `probe_connections_closed_idempotently`

`passed: true` is emitted only after both exact probe databases close and cleanup succeeds.

## 4. Record and clean the environment

Paste the complete JSON report into
`docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md` with the device/simulator model if known.
One native target pass is required for `US-02-02`; both iOS and Android are repeated in
`US-02-09`.

Stop Metro and unset `EXPO_PUBLIC_INITIAL_SCHEMA_PROBE` after the run. Default and production
boot must not execute the probe.
