# TaskCard: Task 5b, Run and Record Emulator Stremio Smoke Validation

## Status

- State: blocked
- Parent ExecPlan: `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- Current owner: Codex
- Last updated: 2026-05-02

## Public documentation privacy note

Use placeholders for local checkout paths, Tizen Studio roots, emulator IDs, emulator profile names, debug ports, CDP target IDs, Windows usernames, machine-specific folders, and signing profile names. Raw local logs should stay outside the repository or be redacted before commit.

## Blocking reason

Task 5b remains blocked because the latest emulator relaunch proved the debug launch path can attach again, but it still did not satisfy the Task 5b target or source-freshness contract.

Observed blocker:

- Restarting `<emulator-profile>` cleared the previous launch-path timeout.
- `sdb` saw `<emulator-id>` again.
- `tz run -d` succeeded with debug port `<debug-port>`.
- The live debug target remained `file:///index.html`, not `https://web.stremio.com/`.
- The served `js/stremio-remote.js` failed the freshness contract: `hasSrcMarker=false`, `hasInjectionMarker=false`, `hasInteractiveControl=false`.

Task 5c documented the launch-target and stale-source root cause. The narrower Task 5d path is the current target-equivalent follow-up. Task 5b stays blocked until that path yields `https://web.stremio.com/` runtime evidence.

## Objective

Run the emulator smoke checklist after Task 5a is complete, then record the smoke result, residual risks, and Task 6 handoff notes without presenting emulator evidence as final acceptance.

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
- Logs, caches, packaged app outputs, signing material, certificate passphrases, and credentials

## Constraints

- Do not modify runtime behavior.
- Do not use emulator evidence as final acceptance.
- Require source freshness evidence before trusting any observation.
- Record outcomes as `pass`, `partial`, or `blocked`.
- Keep Task 6 real Samsung TV validation mandatory.
- If the run is blocked, record the blocker instead of a pass/fail claim.

## Validation

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

## Safe next action

Execute `docs/agent/task-cards/active/task-05d-run-tizenbrew-emulator-target-equivalent-smoke.md` if that TaskCard exists in the branch. Otherwise keep Task 5c as the active unblocker until a narrower TaskCard is created.

## Blocked notes

- Date: 2026-05-02
- Blocking reason: the emulator can launch and attach, but the live debug target is the local harness page `file:///index.html`, not `https://web.stremio.com/`, and source freshness cannot be established for live smoke evidence.
- Evidence observed:
  - Repo commit: `199b05ad3f384d9df49f88600aa4e1e6486fff52`.
  - `src/main.js`: source marker present, injection marker present, SHA-256 `f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f`.
  - `harness/CodexTvRuntimeCheck/js/stremio-remote.js`: source marker absent, injection marker absent, SHA-256 `157a26938024e8ab6c6d7aa476000960f0c37efb16cb0600226b467c553c617b`.
  - Emulator launch command shape: `<tizen-studio-root>\tools\tizen-core\tz.exe run -d -e <emulator-id> -w <repo-root>\harness\CodexTvRuntimeCheck`.
  - Debug target: `http://127.0.0.1:<debug-port>/json`, URL `file:///index.html`, websocket `ws://127.0.0.1:<debug-port>/devtools/page/<target-id>`.
  - Local harness runtime existed and `getState()` returned initialized state, but this evidence does not count for Stremio Web smoke validation.
  - Live served module returned `length=47244`, `hasNamespace=true`, `hasSrcMarker=false`, `hasInjectionMarker=false`, `hasInteractiveControl=false`.
- Safe next action: keep Task 5b blocked and use a bridge path that serves fresh repo-tracked runtime code in the real smoke target.
- Result: `blocked`.
- Residual risks: emulator validation remains local confidence only; real Samsung TV plus TizenBrew validation remains mandatory.

## Report format

- Changed files:
- Command attempted:
- Evidence captured:
- Validation run:
- Result:
- Risks:
