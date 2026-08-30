# US-02-06 derived queries native runtime probe

Run this probe manually on an existing development build after automated checks pass. It uses only
`pixeldoro-us-02-06-derived-queries-probe.db`, deletes that isolated database after the run and
never opens, mutates or deletes production `pixeldoro.db`.

Do not create a native/EAS build solely for this Story; use the existing development build.

## 1. Use the pinned toolchain and capture the implementation SHA

```sh
nvm use
git rev-parse HEAD
```

Required versions: Node `22.23.2`, pnpm `11.24.0`.

## 2. Start the explicit dev-only probe

```sh
EXPO_PUBLIC_DERIVED_QUERIES_PROBE=1 \
EXPO_PUBLIC_COMMIT_SHA=<commit-sha> \
pnpm start
```

Open the existing development build on iOS or Android. The isolated probe runs first, then normal
application boot continues against production `pixeldoro.db`.

## 3. Expected report

Console prefix: `[PixelDoro][DerivedQueriesProbe]`. Accept only when:

- `probe: "US-02-06_DERIVED_QUERIES"`
- `passed: true`
- `applicationId` matches the installed PixelDoro development build
- `commitSha` exactly matches `git rev-parse HEAD`
- `sqliteVersion` is present and is not `unavailable`
- all assertions are present:
  - `query_probe_database_opened_and_migrated`
  - `mixed_standard_history_excluded_trial_running_and_breaks`
  - `contribution_grouped_by_persisted_local_date`
  - `timezone_change_did_not_regroup_contribution`
  - `cadence_used_completed_long_break_reset_only`
  - `store_review_facts_excluded_trial_status_and_feedback`
  - `economy_consistency_passed_and_mismatch_preserved_rows`
  - `analytics_queue_enforced_ttl_cap_dedupe_retry_and_privacy`
  - `product_retention_rows_survived_queue_maintenance`
  - `critical_query_plans_used_or_documented_approved_indexes`
  - `probe_connections_closed_and_database_cleaned`

Send the complete structured report for recording in
`docs/planning/EPIC-02_IMPLEMENTATION_EVIDENCE.md`. One native platform closes the US-02-06
runtime gate; iOS + Android repetition remains part of `US-02-09`.

## 4. UI observation

No Product UI change is expected. After the probe, the existing bootstrap placeholder UI should
appear normally. This Story adds durable query facts, a consistency verifier and bounded analytics
metadata only; no History calendar, Break selection, store-review prompt, economy repair, PostHog,
Retry or reset flow becomes user-visible.

## 5. Cleanup

Stop Metro and unset `EXPO_PUBLIC_DERIVED_QUERIES_PROBE`. Default/production startup must not
execute the probe. If cleanup fails, accept `passed: false` and manually remove only the exact probe
database named above before retrying.
