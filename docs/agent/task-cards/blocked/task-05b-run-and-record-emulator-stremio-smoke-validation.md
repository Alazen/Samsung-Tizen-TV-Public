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
