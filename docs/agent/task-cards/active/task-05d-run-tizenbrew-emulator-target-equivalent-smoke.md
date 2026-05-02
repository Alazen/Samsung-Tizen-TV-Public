# TaskCard: Task 5d, Run TizenBrew Emulator Target-Equivalent Smoke

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- Current owner: Codex
- Last updated: 2026-05-02

## Objective

Use the real TizenBrew site-modification module path to launch `https://web.stremio.com/` on the Samsung TV emulator, inject this repo's pinned `src/main.js`, and capture Task 5b-equivalent runtime evidence.

## Required context

### Files to read

- `PLAN.md`
- `package.json`
- `src/main.js`
- `docs/agent/validation.md`
- `docs/agent/known-risks.md`
- `docs/validation/emulator-validation.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/task-cards/active/task-05c-troubleshoot-emulator-launch-target-and-source-freshness.md`
- `docs/agent/task-cards/blocked/task-05b-run-and-record-emulator-stremio-smoke-validation.md`

## Files allowed to edit

- `PLAN.md`
- `docs/validation/emulator-validation.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/agent/known-risks.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `docs/agent/task-cards/active/task-05d-run-tizenbrew-emulator-target-equivalent-smoke.md`
- `docs/agent/task-cards/active/task-05c-troubleshoot-emulator-launch-target-and-source-freshness.md`, only for status/handoff updates
- `docs/agent/decision-log.md`, only if a durable decision is created

## Files forbidden

- `src/main.js`
- `package.json`
- lockfiles
- generated artifacts
- `Debug/`
- `.wgt` files
- signing material
- certificate passwords
- secrets
- TizenBrew vendor source copied into this repo

## Constraints

- Do not return to the disposable `CodexTvRuntimeCheck` harness as the Task 5b smoke target.
- Do not weaken Task 5b source-freshness requirements.
- Do not change product runtime source.
- Treat jsDelivr freshness and target-equivalent runtime evidence as separate gates; both must pass.
- Keep Task 6 real Samsung TV plus TizenBrew validation mandatory.
- If the emulator cannot expose a fresh `https://web.stremio.com/` debug target, record that blocker instead of claiming smoke success.

## Acceptance criteria

- `npm run check:syntax` passes.
- `npm run check:manifest` passes.
- `npm test` passes.
- The pinned module metadata and source URLs return `200` from jsDelivr.
- The pinned CDN source contains `stremio-webapp-src-main-js-task4e-v1`, `stremio-webapp-runtime-injection-v1`, `isInteractiveControl`, and `__STREMIO_TIZENBREW_REMOTE__`.
- TizenBrew is configured to autolaunch `gh/Alazen/Samsung-Tizen-TV@0c7f8dc59562cb666d0f14672191aa9a2a217d2c`.
- A fresh debug target exists whose URL starts with `https://web.stremio.com/`.
- In that target, `window.__STREMIO_TIZENBREW_REMOTE__` exists and `getState()` returns initialized runtime state.
- Task 5b remains blocked unless all target and source gates pass.

## Validation

Run narrow validation first:

```bash
npm run check:syntax
npm run check:manifest
npm test
git rev-parse HEAD
```

Run emulator/CDN checks:

```bash
E:\tizen-studio\tools\sdb.exe devices
```

Run docs/static validation after documentation updates:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
```

## Done when

- The pinned module freshness evidence is captured from jsDelivr.
- The emulator-side TizenBrew config path is exercised.
- A fresh `https://web.stremio.com/` debug target is captured, or a precise blocker is recorded.
- Task 5b remains blocked unless target-equivalent runtime evidence exists.
- Residual risks are updated.
- Task 6 real Samsung TV validation remains mandatory.

## Stop conditions

- Stop if the same command fails twice for the same reason.
- Stop if the target remains `file:///index.html`.
- Stop if the only available target is the TizenBrew UI or a stale disposable-harness debug target.
- Stop if jsDelivr freshness cannot be proven for the pinned module.
- Stop if runtime source changes appear necessary.
- Stop if work requires signing secrets, certificate passwords, deployment changes, or forbidden files.

## Report format

- Changed files:
- Commands run:
- Emulator target:
- Module identifier:
- Source evidence:
- Runtime evidence:
- Smoke checklist result:
- Task 5b status:
- Task 6 status:
- Risks:

## Current execution notes

- The public jsDelivr hosting gate is now cleared for `gh/Alazen/Samsung-Tizen-TV@0c7f8dc59562cb666d0f14672191aa9a2a217d2c`.
- The first target-equivalent retry wrote `tizenbrewConfig.json` through `/home/owner/share/tmp/sdk_tools/tmp/` plus `shell 0 mv`, launched `xvvl3S1bvH.TizenBrewStandalone`, and still did not expose a fresh Stremio Web debug target.
- Forwarded probes to the expected TizenBrew localhost service on `tcp:8081` were reset by the host remote side, and localhost `/json` scans only found the stale disposable-harness target on port `38333`.
- Current result category: `blocked` pending a usable TizenBrew standalone service/debug path on the emulator.
