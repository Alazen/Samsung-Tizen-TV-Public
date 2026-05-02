# TaskCard: Task 5c, Troubleshoot Emulator Launch Target and Source Freshness

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- Current owner: Codex
- Last updated: 2026-05-02

## Objective

Unblock Task 5b by troubleshooting why the live Samsung TV emulator debug target launches `file:///index.html` from the disposable harness and serves stale `js/stremio-remote.js` content instead of proving fresh runtime code on `https://web.stremio.com/`.

This is an unblocker and troubleshooting slice. It may make the smallest safe harness, test, or documentation changes needed to establish a repeatable fresh-code debug path. It must not weaken Task 5b evidence requirements, and it must not mark the emulator smoke validation as passed.

## Triggering evidence

- Restarting `T-samsung-10.0-x86_64` cleared the previous launch-path timeout.
- `sdb` saw `emulator-26101` again.
- `tz run -d` succeeded and exposed debug port `38333`.
- The live target remained `file:///index.html`, not `https://web.stremio.com/`.
- The served `js/stremio-remote.js` failed the freshness contract:
  - `hasSrcMarker=false`
  - `hasInjectionMarker=false`
  - `hasInteractiveControl=false`

## Required context

### Files to read

- `PLAN.md`
- `package.json`
- `AGENTS.md`
- `docs/agent/validation.md`
- `docs/agent/known-risks.md`
- `docs/validation/emulator-validation.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `docs/agent/task-cards/blocked/task-05b-run-and-record-emulator-stremio-smoke-validation.md`
- `harness/CodexTvRuntimeCheck/config.xml`
- `harness/CodexTvRuntimeCheck/index.html`
- `harness/CodexTvRuntimeCheck/js/stremio-remote.js`
- `src/main.js`
- `tests/manifest.test.js`
- `tests/syntax.test.js`

## Files allowed to edit

- `harness/CodexTvRuntimeCheck/config.xml`
- `harness/CodexTvRuntimeCheck/index.html`
- `harness/CodexTvRuntimeCheck/js/stremio-remote.js`
- `tests/manifest.test.js`
- `tests/syntax.test.js`
- `docs/validation/emulator-validation.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/agent/known-risks.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `PLAN.md`
- `docs/agent/decision-log.md`, only if a durable decision is created

## Files forbidden

- `src/main.js`, except for inspection only
- Package manifests and lockfiles, unless the user explicitly approves a follow-up change
- Runtime behavior changes outside the disposable emulator harness
- Vendor docs
- Generated artifacts and local build outputs
- Logs, caches, packaged app outputs, signing material, certificate passwords, and secrets

## Constraints

- Do not weaken Task 5b source-freshness requirements.
- Do not treat `file:///index.html` as equivalent to `https://web.stremio.com/` for Task 5b.
- Do not mark Task 5b as passed from local-harness evidence.
- Prefer proving why the current launch path is wrong before changing files.
- Prefer a minimal harness/source-sync fix before broad harness redesign.
- Keep Task 6 real Samsung TV validation mandatory.
- If the real `https://web.stremio.com/` debug target cannot be launched from the current harness without signing, unsupported privileges, or undocumented behavior, record that blocker instead of changing product runtime code.

## Troubleshooting target

Codex should determine which of these is true and act accordingly:

1. The disposable `CodexTvRuntimeCheck` harness is only suitable for local fixture validation and cannot be the Task 5b web smoke target.
2. The harness launch target can safely be adjusted to load `https://web.stremio.com/` for emulator smoke validation.
3. The harness copy of `js/stremio-remote.js` is stale and needs a repeatable repo-tracked sync or guard against drift.
4. The correct Task 5b path is a different TizenBrew/module launch path, not the disposable harness.
5. The emulator can reach `https://web.stremio.com/`, but module injection must be proven through a different debug target or served-module URL.

## Exact implementation target

Make the smallest safe change that either:

- establishes a repeatable debug path where `location.href` is `https://web.stremio.com/` and the served runtime source contains `stremio-webapp-src-main-js-task4e-v1`, `stremio-webapp-runtime-injection-v1`, and the interactive-control guard; or
- records a precise blocker explaining why that cannot be done in the current harness/toolchain and what TaskCard should be created next.

If a fix is made, add or update a lightweight guard so future validation fails before emulator launch when the harness runtime copy is stale against the canonical runtime source markers.

## Validation

Run narrow validation first:

```bash
npm run check:syntax
npm run check:manifest
npm test
```

Run docs/static validation after documentation updates:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
```

If the emulator path is available, rerun the live debug checks:

```bash
E:\tizen-studio\tools\sdb.exe devices
E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck
```

Then inspect the live debug target and record:

- debug port
- `location.href`
- served module URL
- `hasSrcMarker`
- `hasInjectionMarker`
- `hasInteractiveControl`
- `Boolean(window.__STREMIO_TIZENBREW_REMOTE__)`
- `window.__STREMIO_TIZENBREW_REMOTE__?.getState?.()` if available

## Done when

- The launch-target/source-freshness root cause is documented.
- Either a minimal safe fix is implemented and validated, or a precise blocker is recorded.
- Task 5b remains blocked unless the live target is `https://web.stremio.com/` and source freshness can be proven.
- If Task 5b is unblocked, it is moved back to `docs/agent/task-cards/active/` or a clear next TaskCard is created for the resumed smoke run.
- Residual risks are updated.
- Task 6 real Samsung TV validation remains mandatory.

## Stop conditions

- Stop if fixing the issue requires signing material, certificate passwords, production data, or generated packaged artifacts.
- Stop if the same emulator command fails twice for the same reason.
- Stop if the only available evidence comes from `file:///index.html` but the task needs `https://web.stremio.com/`.
- Stop if the fix requires unsupported TV privileges or undocumented device behavior.
- Stop if the fix would change product runtime behavior instead of the disposable emulator harness or validation guard.

## Report format

- Changed files:
- Root cause:
- Command attempted:
- Evidence captured:
- Validation run:
- Task 5b status:
- Result:
- Risks:
