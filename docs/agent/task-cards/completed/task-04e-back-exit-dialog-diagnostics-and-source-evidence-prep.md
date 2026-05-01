# TaskCard: Task 4e, Back, Exit, Dialog, Diagnostics, and Source-Evidence Prep

## Status

- State: completed
- Parent ExecPlan: `docs/agent/exec-plans/active/task-04-runtime-core.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Complete the final Task 4 runtime slice by merging the original Task 4e and Task 4f scopes into one bounded implementation task.

This card authorizes Back routing, exit modal behavior, modal-contained navigation, diagnostics completeness, and source-evidence prep for the later Task 5 emulator bridge.

This card does not authorize emulator execution, real Samsung TV validation, dependency changes, generated artifacts, signing material, or starting Task 5.

## Required context

### Files to read

- `PLAN.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/active/task-04-runtime-core.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `docs/agent/validation.md`
- `docs/runtime/module-boundary.md`
- `docs/runtime/focus-spatial-navigation.md`
- `docs/runtime/back-exit.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/product/scope.md`
- `docs/product/non-goals.md`
- `docs/product/acceptance.md`
- `src/main.js`
- `tests/syntax.test.js`
- `harness/CodexTvRuntimeCheck/js/stremio-remote.js`

## Files allowed to edit

- `src/main.js`
- `tests/syntax.test.js`
- `harness/CodexTvRuntimeCheck/js/stremio-remote.js`, only if parity tests require it
- `docs/runtime/back-exit.md`
- `docs/runtime/module-boundary.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/agent/task-cards/completed/task-04e-back-exit-dialog-diagnostics-and-source-evidence-prep.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/active/task-04-runtime-core.md`
- `PLAN.md`

## Files forbidden

- `package.json`
- `package-lock.json`
- `tests/manifest.test.js`, unless an existing manifest check fails due to this task
- `docs/vendor/`
- Generated artifacts
- `Debug/`
- `*.wgt`
- `*.zip`
- `*.log`
- Caches
- Signing material
- Secrets

## Constraints

- Do not add dependencies.
- Do not add a build step.
- Do not change package metadata.
- Do not claim mandatory TV keys through optional key registration.
- Keep key routing inside the existing document `keydown` flow.
- Preserve editable passthrough.
- Keep module-owned diagnostics and exit UI outside normal content focus candidates.
- Do not start Task 5.
- Do not treat emulator evidence as final acceptance.

## Exact implementation target

- Back closes diagnostics before any other Back action.
- Back closes the exit modal as Keep watching when the modal is open.
- Back prefers safe contextual dialog or overlay handling before app exit.
- Back uses conservative history fallback only when it is safe.
- Back opens the module exit modal only at the module exit boundary.
- Exit modal supports remote navigation between Keep watching and End the app.
- Enter on Keep watching closes the modal and restores focus when possible.
- Enter on End the app attempts Tizen app exit when available and records success or soft failure.
- Missing document, history, focus, or Tizen application APIs never throw.
- Diagnostics report Back resolution, exit state, exit result, key state, API availability, focus state, candidate count, and source/injection evidence required by Task 5.
- Tests cover the above boundaries without executing the emulator.

## Documentation obligations

- Update `docs/runtime/back-exit.md` with the final Back/Exit contract.
- Update `docs/runtime/module-boundary.md` only if the runtime public contract changes.
- Update `docs/validation/emulator-stremio-web-smoke-validation.md` if source/injection evidence names become specific.
- Update this TaskCard before moving it to completed.
- Update `docs/agent/task-cards/index.md`.
- Update `docs/agent/exec-plans/active/task-04-runtime-core.md`.
- Update `PLAN.md` to remove stale Task 4d next-action wording.
- Decision log update required: only if a durable Back/Exit policy decision changes.
- Known risks update required: only if a durable emulator, source freshness, or exit limitation is discovered.

## Validation

Run:

```bash
npm run check:syntax
npm run check:manifest
npm test
git diff --check -- PLAN.md docs/agent docs/runtime docs/validation
```

If npm is unavailable:

```bash
node tests/syntax.test.js
node tests/manifest.test.js
git diff --check -- PLAN.md docs/agent docs/runtime docs/validation
```

## Done when

- Back/Exit/Dialog behavior is explicit in code, tests, and docs.
- Diagnostics expose the evidence needed by Task 5.
- Source freshness or injection evidence requirements are documented.
- `npm run check:syntax` passes.
- `npm run check:manifest` passes.
- `npm test` passes.
- Docs diff check passes.
- No forbidden files were edited.
- Task 5 remains queued and is not executed.

## Stop conditions

- Stop if the task requires dependency, package, manifest, signing, generated artifact, or secret changes.
- Stop if emulator execution is needed.
- Stop if real Samsung TV validation is needed.
- Stop if source freshness cannot be defined without a build or packaging decision.
- Stop if the same validation command fails twice for the same reason.
- Stop if files outside the allowed edit list appear necessary.

## Report format

- Summary
- Changed files
- Validation commands and results
- Acceptance status
- Remaining risks

## Completion notes

- Summary:
  - Task 4e is complete. The final Task 4 runtime slice now implements and documents the Back, Exit, dialog, diagnostics, and source-evidence closeout that feeds the queued Task 5 bridge.
  - The smoke-validation evidence is now named explicitly: source marker `stremio-webapp-src-main-js-task4e-v1`, injection marker `stremio-webapp-runtime-injection-v1`, and `getState()` runtime markers `namespacePresent`, `initializedNamespace`, `styleMarkerPresent`, `diagnosticsPanelMarkerPresent`, `exitModalMarkerPresent`, `styleMarkerInjected`, `diagnosticsPanelCreated`, and `exitModalCreated`.
  - Diagnostics text now records the source marker, injection marker, injection evidence summary, diagnostics open state, last exit attempt, optional key registration summary, and the existing path/key/action/focus/candidate/back/exit/API fields.
- Changed files:
  - `src/main.js`
  - `tests/syntax.test.js`
  - `docs/agent/task-cards/completed/task-04e-back-exit-dialog-diagnostics-and-source-evidence-prep.md`
  - `docs/agent/task-cards/index.md`
  - `docs/agent/exec-plans/active/task-04-runtime-core.md`
  - `PLAN.md`
  - `docs/validation/emulator-stremio-web-smoke-validation.md`
- Validation commands and results:
  - `npm run check:syntax` - passed
  - `npm run check:manifest` - passed
  - `npm test` - passed
  - `git diff --check -- PLAN.md docs/agent docs/runtime docs/validation` - passed
- Acceptance status:
  - Back, Exit, dialog, diagnostics, and source-evidence behavior are implemented or verified in code.
  - Tests explicitly cover the Task 4e boundaries.
  - Docs match the runtime behavior for the local Task 4 closeout.
  - Task 4e docs/status closeout is complete.
  - Task 5 remains queued and is not started.
- Remaining risks:
  - Emulator smoke validation is still a bridge step and does not replace real Samsung TV acceptance.
