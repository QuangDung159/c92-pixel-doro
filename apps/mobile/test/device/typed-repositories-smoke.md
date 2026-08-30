# US-02-05 typed repositories native runtime probe

Run this probe manually on an existing development build after automated checks pass. It uses
only `pixeldoro-us-02-05-repositories-probe.db`, deletes that database after the run and never
opens, mutates or deletes production `pixeldoro.db`.

Do not create a native/EAS build solely for this Story; use the existing development build.

## 1. Use the pinned toolchain and capture the implementation SHA

```sh
nvm use
git rev-parse HEAD
```

Required versions: Node `22.23.2`, pnpm `11.24.0`.

## 2. Start the explicit dev-only probe

```sh
EXPO_PUBLIC_TYPED_REPOSITORIES_PROBE=1 \
EXPO_PUBLIC_COMMIT_SHA=<commit-sha> \
pnpm start
```

Open the existing development build on iOS or Android. The probe runs first against its isolated
database, then the normal application boot continues against production `pixeldoro.db`.

## 3. Expected report

Console prefix: `[PixelDoro][TypedRepositoriesProbe]`. Accept only when:

- `probe: "US-02-05_TYPED_REPOSITORIES"`
- `passed: true`
- `applicationId` matches the installed PixelDoro development build
- `commitSha` exactly matches `git rev-parse HEAD`
- all assertions are present:
  - `repository_probe_database_opened_and_migrated`
  - `all_durable_entity_groups_round_tripped`
  - `canonical_mappers_preserved_exact_values_after_reopen`
  - `transaction_scoped_multi_repository_work_committed`
  - `returned_and_thrown_failures_rolled_back_all_repository_writes`
  - `session_conditional_conflict_was_deterministic`
  - `immutable_receipt_mutation_was_not_exposed_or_committed`
  - `catalog_authoritative_price_debit_was_verified`
  - `corrupt_or_constraint_failures_were_safely_mapped`
  - `repository_graph_connections_closed_and_database_cleaned`

Send the complete structured report for recording in
`docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`. One native platform closes the US-02-05
runtime gate; iOS + Android repetition remains part of `US-02-09`.

## 4. UI observation

No Product UI change is expected. After the probe, the existing bootstrap placeholder UI should
appear normally. This Story adds persistence contracts and adapters only; no Timer, Session,
History, Shop, Pet, analytics delivery, Retry or reset behavior becomes user-visible.

## 5. Cleanup

Stop Metro and unset `EXPO_PUBLIC_TYPED_REPOSITORIES_PROBE`. Default/production startup must not
execute the probe. If cleanup fails, accept `passed: false` and manually remove only the exact
probe database named above before retrying.
