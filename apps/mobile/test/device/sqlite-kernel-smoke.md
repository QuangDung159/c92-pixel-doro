# US-02-01 SQLite kernel native runtime probe

Run this probe manually on a development build after setting the explicit diagnostic flag.
The probe uses only `pixeldoro-us-02-01-probe.db`, closes it, and deletes that exact probe
database after execution. It must never use or delete `pixeldoro.db`.

## Required environment

```sh
EXPO_PUBLIC_SQLITE_KERNEL_PROBE=1 EXPO_PUBLIC_COMMIT_SHA=<commit-sha> pnpm start
```

Open the installed development build and inspect the Metro/Expo log for one structured line
beginning with `[PixelDoro][SQLiteKernelProbe]`.

## Acceptance

The JSON report must contain:

- `probe: "US-02-01_SQLITE_KERNEL"`.
- `passed: true` and no `failedAssertion`.
- Exact `platform`, `osVersion`, `appVersion`, and `commitSha`.
- Passed assertions for connection/FK verification, commit after reopen, returned-failure
  rollback, thrown-failure rollback, foreign-key rejection, parameter binding, deterministic
  overlap rejection, and idempotent dispose.

Record the report in `docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`. One native target
is required to accept `US-02-01`; both iOS and Android are repeated at `US-02-09`.

Unset `EXPO_PUBLIC_SQLITE_KERNEL_PROBE` after the evidence run. Default and production boot
must not execute the probe.
