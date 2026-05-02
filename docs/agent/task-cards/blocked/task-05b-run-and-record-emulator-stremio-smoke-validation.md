# TaskCard: Task 5b, Run and Record Emulator Stremio Smoke Validation

## Status

- State: blocked
- Parent ExecPlan: `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- Current owner: Codex
- Last updated: 2026-05-02

## Blocking reason

Task 5b remains blocked because the latest emulator relaunch proved the debug launch path can attach again, but it still did not satisfy the Task 5b target or source-freshness contract.

Observed blocker:

- Restarting `T-samsung-10.0-x86_64` cleared the previous launch-path timeout.
- `sdb` saw `emulator-26101` again.
- `tz run -d` succeeded with debug port `38333`.
- The live debug target remained `file:///index.html`, not `https://web.stremio.com/`.
- The served `js/stremio-remote.js` failed the freshness contract:
  - `hasSrcMarker=false`
  - `hasInjectionMarker=false`
  - `hasInteractiveControl=false`

Task 5c is now the active unblocker for troubleshooting the launch target and stale served runtime source.

## Objective

Run the emulator smoke checklist after Task 5a is complete, then record the smoke result, residual risks, and Task 6 handoff notes without presenting emulator evidence as final acceptance.

## Required context

### Files to read

- `PLAN.md`
- `docs/agent/exec-plans/active/task-04-runtime-core.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/validation.md`
- `docs/validation/emulator-validation.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/validation/real-tv-validation.md`
- `docs/product/acceptance.md`
- `docs/agent/known-risks.md`

## Files allowed to edit

- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/validation/emulator-validation.md`
- `docs/agent/known-risks.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/index.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `PLAN.md`
- `docs/agent/decision-log.md`, only if a durable decision is created

## Files forbidden

- Runtime source files
- Tests
- Package manifests and lockfiles
- Vendor docs
- Generated artifacts and local build outputs
- Logs, caches, packaged app outputs, signing material, and secrets

## Constraints

- Do not modify runtime behavior.
- Do not use emulator evidence as final acceptance.
- Require source freshness evidence before trusting any observation.
- Record outcomes as `pass`, `partial`, or `blocked`.
- Keep Task 6 real Samsung TV validation mandatory.
- If the run is blocked, record the blocker instead of a pass/fail claim.

## Documentation obligations

- Must update `docs/validation/emulator-stremio-web-smoke-validation.md` with run evidence and final result summary.
- Must update `docs/validation/emulator-validation.md` if the procedure or guidance changes.
- Must update `docs/agent/known-risks.md` if a new durable limitation is discovered.
- Decision log update required: only if a durable decision is created.
- PLAN.md update required: yes, if task status, result, or routing changes.

## Validation

Primary docs validation:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
```

## Done when

- The checklist has been executed or a blocker has been documented.
- Source freshness evidence is captured or the result is recorded as blocked.
- Module load evidence is captured or the result is recorded as blocked.
- The result summary includes `pass`, `partial`, or `blocked`.
- Residual risks are recorded.
- Task 6 real-TV validation remains mandatory.

## Stop conditions

- Stop if the same emulator command fails twice.
- Stop if source freshness cannot be established.
- Stop if the task would bypass real-TV validation.
- Stop if the task requires runtime implementation changes.
- Stop if recording results would require committing generated artifacts.
- Stop if the result would be presented as final acceptance.

## Safe next action

Execute `docs/agent/task-cards/active/task-05c-troubleshoot-emulator-launch-target-and-source-freshness.md`.

## Report format

- Changed files:
- Command attempted:
- Evidence captured:
- Validation run:
- Result:
- Risks:

## Blocked notes

- Date: 2026-05-02
- Blocking reason:
  - The emulator can now launch and attach, but the current debug path still does not satisfy Task 5b.
  - The live debug target is the local harness page `file:///index.html`, not `https://web.stremio.com/`, so the required smoke target is not under test from this launch path.
  - Source freshness still cannot be established for live smoke evidence. The repo-tracked harness module contains `isInteractiveControl`, but the live served `js/stremio-remote.js` fetched from the running debug target does not.
- Evidence observed:
  - `git rev-parse HEAD` -> `199b05ad3f384d9df49f88600aa4e1e6486fff52`
  - `node -e "...marker/hash check..."` -> `src/main.js sourceMarker=true injectionMarker=true sha256=f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f`
  - `node -e "...marker/hash check..."` -> `harness/CodexTvRuntimeCheck/js/stremio-remote.js sourceMarker=false injectionMarker=false sha256=157a26938024e8ab6c6d7aa476000960f0c37efb16cb0600226b467c553c617b`
  - `node -e "...harness hash check..."` -> `hasInteractiveControl=true`, `hasNamespace=true`
  - `E:\tizen-studio\tools\emulator\bin\em-cli.bat launch -n T-samsung-10.0-x86_64` -> launched successfully in the desktop user context
  - `E:\tizen-studio\tools\sdb.exe devices` -> `emulator-26101 device T-samsung-10.0-x86_64`
  - `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck` -> launched successfully with debug port `33211`
  - `http://127.0.0.1:33211/json` -> debug page title `Codex TV Runtime Check`, URL `file:///index.html`, websocket `ws://127.0.0.1:33211/devtools/page/73275F01B8BC9425630466AA6D776370`
  - CDP runtime snapshot -> `window.__STREMIO_TIZENBREW_REMOTE__` exists, `getState()` exists, registered keys include `Info`, and Tizen APIs are available in the local harness page
  - CDP `fetch('js/stremio-remote.js')` inside the live debug target -> `length=47244`, `hasNamespace=true`, `hasSrcMarker=false`, `hasInjectionMarker=false`, `hasInteractiveControl=false`
  - `git status --short --ignored harness/CodexTvRuntimeCheck` -> only ignored `harness/CodexTvRuntimeCheck/Debug/` output
  - `git ls-files harness/CodexTvRuntimeCheck/Debug/*` -> no tracked generated Debug output
- What approval or input is needed:
  - Re-run Task 5b only after the bridge path under test actually loads `https://web.stremio.com/` and exposes the repo-tracked runtime in that target.
  - Before accepting smoke observations, establish source freshness by aligning the loaded module evidence with the current repo-tracked source marker, commit SHA, or documented source hash, then proving the live served module content through the debug target.
- Safe next action:
  - Keep Task 5b blocked and document a bridge path that serves fresh repo-tracked runtime code in the real smoke target, then move the TaskCard back to `active/` for one bounded retry.
- Result:
  - `blocked`
- Residual risks:
  - Emulator validation remains local confidence only.
  - Real Samsung TV plus TizenBrew validation remains mandatory and is not bypassed.
