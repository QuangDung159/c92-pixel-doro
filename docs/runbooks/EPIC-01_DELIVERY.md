# EPIC-01 delivery and validation runbook

This runbook separates repository-complete foundation work from the account-, cloud-,
and device-dependent evidence required to close `US-01-07`.

## 1. Resolve Expo project ownership

1. Sign in with the least-privilege Expo account that owns PixelDoro.
2. From `apps/mobile`, run `eas init` and create/link the `pixeldoro` project.
3. Record the returned account owner and project UUID as EAS environment variables
   `EXPO_OWNER` and `EXPO_PROJECT_ID` for development, preview, and production.
4. For local commands, copy `.env.example` to an ignored `.env.local` and fill the
   same two values. Never commit the values if team policy treats project metadata as
   private.
5. Confirm resolved config from `apps/mobile` with `npx expo config --type public`.
6. Validate each checked-in workflow with
   `eas workflow:validate .eas/workflows/<workflow>.yml --non-interactive`.

Stable native identifiers are `com.dragonc92team.pixeldoro` for both the iOS bundle and
Android application. Changing either identifier, Expo SDK, native dependency,
permission, entitlement, or config plugin requires an app-version bump and new binary.
Expo SDK 57 runs the New Architecture and Hermes baseline by default; their legacy
opt-in config keys are no longer part of the SDK 57 config schema.

## 2. Credentials and roles

- Keep `credentialsSource: remote`; let EAS manage iOS certificates/profiles and the
  Android upload key.
- Prefer Google Play App Signing. EAS holds the upload credential, not the app-signing
  key.
- Grant build/update roles only to people who need them. Restrict create, rotate,
  download, and revoke operations to the project owner.
- Never commit `.p8`, `.p12`, `.jks`, `.keystore`, `.mobileprovision`, passwords,
  App Store Connect keys, or Google service-account JSON.
- After any credential change, record actor, date, reason, affected platform, and
  recovery owner in the private operations log.

## 3. Development builds and smoke evidence

All native and EAS builds are manual owner-triggered actions. No checked-in workflow
has a push/schedule trigger.

Release signing credentials use `credentialsSource: remote` for every profile and stay
managed by EAS. Do not create `credentials.json`, use `credentialsSource: local`, or
download signing material into the repository. A local Android EAS build authenticates
with Expo only to resolve the project and temporarily download the EAS-managed
credential for signing; the build itself runs on the developer machine.

For the phone-first MVP, native iPad support is disabled. Android tablet is not part of
the Epic acceptance device matrix; validate on an Android phone target.

Run repository gates first:

```sh
pnpm quality
pnpm check:repository
```

Then run the manual workflow from `apps/mobile`:

```sh
eas workflow:run .eas/workflows/build-development.yml --wait
```

Install the Android artifact on at least one API 24+ emulator/device and the iOS
artifact on at least one iOS 16.4+ simulator/device. Follow the visual checklist in
`apps/mobile/test/device/foundation-smoke.md` on both platforms. Maestro is not required;
open each deep link with the platform command in that checklist and verify the expected
screen text manually.

Attach build URLs/IDs, platform + OS/device details, date, commit SHA, and the manual
pass/fail result to the Epic evidence record. A screenshot of the initial screen plus a
short result table is sufficient. A successful build alone is not boot evidence.

Use the single interactive build entry point from the repository root:

```sh
pnpm build:mobile
```

Use either production shortcut when no interactive selection is needed:

```sh
pnpm build:android:prd:local
pnpm build:ios:prd:local
```

Before either production command, manually increment `ANDROID_VERSION_CODE` and
`IOS_BUILD_NUMBER` in `apps/mobile/app.config.ts`. The project uses
`cli.appVersionSource: local`, and the production profile explicitly disables EAS
auto-increment so the checked-in values remain the source of truth.

Commit and push all version/config/asset changes before invoking a root build command.
The root build entry point fails closed on tracked or untracked worktree changes, prints
the exact 40-character source SHA, runs prebuild, and verifies the worktree plus SHA again
before invoking EAS. Never bypass this gate for an artifact used as release evidence.

The command asks, in order, for platform, artifact type, environment, and build runner.
iOS uses IPA and production as defaults; its simulator archive option is restricted to
development. Android uses AAB and production as defaults; AAB is restricted to
production because it is a Google Play artifact rather than a directly shareable
install. Development defaults to a local build, while other environments default to
EAS service builds. Local artifacts are written under `apps/mobile/artifacts/`; EAS
builds return a shareable build page. Signing credentials remain EAS-managed remotely
in both modes.

## 3.1 Shareable QA and staging builds

QA and staging use EAS-hosted internal-distribution builds so testers can install from
the build page without receiving local artifact files. Each tier has a separate EAS
Update channel while both inherit the `preview` EAS environment. Select Android + APK
or iOS + IPA, choose QA or staging, then accept the default EAS runner. iOS internal
builds can only be installed on devices registered with EAS and included in the
provisioning profile.

## 4. Preview and production OTA boundary

OTA is allowed only for JavaScript, styling, and bundled assets compatible with the
current `appVersion` runtime. Native/config changes listed in section 1 require a new
binary.

1. Run `.eas/workflows/publish-preview-update.yml`.
2. Install/open preview builds for both platforms with the same runtime version.
3. Run the device smoke flow and observe startup/crash health.
4. Record preview update group, runtime version, commit SHA, and evidence.
5. Only then run `.eas/workflows/publish-production-update.yml` and approve the manual
   gate. The gate certifies that the exact commit/runtime has preview evidence.

## 5. Rollback or republish

If production is unhealthy, stop promotion and identify the last known-good update
group for the same runtime. Prefer a tested fix-forward when persisted state is not
backward compatible. Otherwise republish the known-good group:

```sh
eas update:republish --group <known-good-update-group-id> --destination-channel production
```

If no safe prior update exists, roll back to the embedded update for the affected
runtime:

```sh
eas update:roll-back-to-embedded --channel production --runtime-version <app-version>
```

Re-run the production smoke flow and monitor startup/crash health. Record the incident,
bad group, recovery group, runtime, decision owner, and outcome. Users may continue to
run a downloaded bad update until the next update check, so monitoring must continue.

## 6. Submit boundary

`eas submit` uploads an existing binary to App Store Connect/TestFlight or a configured
Google Play track. It is not evidence that the app is public. Store review, release
status, and manual promotion remain separate approvals. The checked-in Android submit
profiles default to `draft`; production publication is never automatic in Epic 1.
