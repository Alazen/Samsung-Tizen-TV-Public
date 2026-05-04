# TaskCard: Task 5c, Troubleshoot Emulator Launch Target and Source Freshness

## Status

- State: completed troubleshooting slice, retained for routing context while the narrower Task 5d target-equivalent path remains active.
- Parent ExecPlan: `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- Current owner: Codex
- Last updated: 2026-05-02

## Public documentation privacy note

Use placeholders for local checkout paths, Tizen Studio roots, emulator IDs, emulator profile names, debug ports, CDP target IDs, Windows usernames, machine-specific folders, and signing profile names. Raw local logs should stay outside the repository or be redacted before commit.

## Objective

Unblock Task 5b by troubleshooting why the live Samsung TV emulator debug target launches `file:///index.html` from the disposable harness and serves stale `js/stremio-remote.js` content instead of proving fresh runtime code on `https://web.stremio.com/`.

This is an unblocker and troubleshooting slice. It must not weaken Task 5b evidence requirements, and it must not mark the emulator smoke validation as passed.

## Triggering evidence

- Restarting `<emulator-profile>` cleared the previous launch-path timeout.
- `sdb` saw `<emulator-id>` again.
- `tz run -d` succeeded and exposed debug port `<debug-port>`.
- The live target remained `file:///index.html`, not `https://web.stremio.com/`.
- The served `js/stremio-remote.js` failed the freshness contract: `hasSrcMarker=false`, `hasInjectionMarker=false`, `hasInteractiveControl=false`.

## Files allowed to edit

Original troubleshooting slice:

- disposable emulator harness files
- validation docs
- known risks
- TaskCard indexes and active Task 5 ExecPlan
- `PLAN.md`
- decision log only if a durable decision is created

For the public-docs redaction follow-up, edit docs only.

## Files forbidden

- `src/main.js`, except for inspection only
- Package manifests and lockfiles, unless explicitly approved
- Runtime behavior changes outside the disposable emulator harness
- Vendor docs
- Generated artifacts and local build outputs
- Logs, caches, packaged app outputs, signing material, certificate passphrases, and credentials

## Constraints

- Do not weaken Task 5b source-freshness requirements.
- Do not treat `file:///index.html` as equivalent to `https://web.stremio.com/` for Task 5b.
- Do not mark Task 5b as passed from local-harness evidence.
- Keep Task 6 real Samsung TV validation mandatory.
- If the real Stremio Web debug target cannot be launched from the current harness without signing material, unsupported privileges, or undocumented behavior, record that blocker instead of changing product runtime code.

## Exact implementation target

Make the smallest safe change that either establishes a repeatable `https://web.stremio.com/` debug path with fresh runtime source evidence, or records a precise blocker explaining why that cannot be done in the current harness/toolchain.

## Validation

```bash
npm run check:syntax
npm run check:manifest
npm test
git diff --check -- PLAN.md docs/agent docs/validation
```

If the emulator path is available, rerun live debug checks with placeholders in public docs:

```bash
<tizen-studio-root>\tools\sdb.exe devices
<tizen-studio-root>\tools\tizen-core\tz.exe run -d -e <emulator-id> -w <repo-root>\harness\CodexTvRuntimeCheck
```

Record `location.href`, served module URL, marker booleans, and `window.__STREMIO_TIZENBREW_REMOTE__` state.

## Outcome

- The disposable `CodexTvRuntimeCheck` harness is confirmed to be a local fixture/debug vehicle only and not a valid Task 5b smoke target.
- The correct Task 5 bridge model is the real TizenBrew site-modification module path targeting `https://web.stremio.com/`.
- Public GitHub/jsDelivr hosting for the pinned commit is cleared.
- The next blocker is emulator-side TizenBrew standalone service/debug observability.
- Next action: execute `docs/agent/task-cards/active/task-05d-run-tizenbrew-emulator-target-equivalent-smoke.md` and keep Task 5b blocked until that path yields target-equivalent runtime evidence.

## Stop conditions

- Stop if fixing the issue requires signing material, certificate passphrases, production data, or generated packaged artifacts.
- Stop if the same emulator command fails twice for the same reason.
- Stop if the only available evidence comes from `file:///index.html` but the task needs `https://web.stremio.com/`.
- Stop if the fix would change product runtime behavior.

## Report format

- Changed files:
- Root cause:
- Command attempted:
- Evidence captured:
- Validation run:
- Task 5b status:
- Result:
- Risks:
