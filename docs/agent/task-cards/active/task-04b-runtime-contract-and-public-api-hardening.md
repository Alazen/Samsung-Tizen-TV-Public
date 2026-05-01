# TaskCard: Task 4b, Runtime Contract and Public API Hardening

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-04-runtime-core.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Harden the runtime contract exposed through `window.__STREMIO_TIZENBREW_REMOTE__` without expanding product behavior. This is the first bounded implementation-facing Task 4 slice after the docs-only Task 4a decomposition.

The implementation must keep the module safe to inject repeatedly, safe to load before or after DOM readiness, and safe to load in environments where `document`, `tizen`, `tizen.tvinputdevice`, or `tizen.application` are missing.

## Parent context

Task 4 is the runtime-core implementation track. Task 4.5 remains queued until at least one Task 4 slice passes local validation. This TaskCard does not authorize emulator smoke validation and does not replace real Samsung TV validation.

## Required context

### Files to read

- `PLAN.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/task-cards/active/task-04a-runtime-core-inventory-and-slice-plan.md`
- `docs/agent/exec-plans/active/task-04-runtime-core.md`
- `docs/agent/validation.md`
- `docs/runtime/module-boundary.md`
- `docs/runtime/diagnostics.md`
- `docs/product/scope.md`
- `docs/product/non-goals.md`
- `docs/product/acceptance.md`
- `package.json`
- `src/main.js`
- `tests/syntax.test.js`

### Current behavior to preserve

- `src/main.js` bootstraps under `__STREMIO_TIZENBREW_REMOTE__`.
- Re-running the script must not create duplicate listeners, styles, diagnostics panels, or exit modals.
- `getState()` must stay callable after bootstrap.
- Missing browser or Tizen APIs must be reflected in state instead of throwing.
- Optional TV key registration must remain soft-fail.

## Files allowed to edit

- `src/main.js`
- `tests/syntax.test.js`
- `docs/runtime/module-boundary.md`
- `docs/runtime/diagnostics.md`
- `docs/agent/task-cards/active/task-04b-runtime-contract-and-public-api-hardening.md`

## Files forbidden

- `package.json`
- `package-lock.json`
- `tests/manifest.test.js`
- `PLAN.md`
- `docs/vendor/`
- `harness/` unless explicitly approved by the tech lead
- Generated artifacts
- `Debug/` folders
- `*.wgt`
- `*.zip`
- `*.log`
- Caches
- Signing material
- Secrets

## Constraints

- Do not add dependencies.
- Do not add a build step.
- Do not change package metadata or manifest keys.
- Do not rebind mandatory TV keys in `package.json`.
- Do not start Task 4.5.
- Do not add emulator or real-TV acceptance claims.
- Keep the runtime as a thin site-modification layer, not a replacement for Stremio Web.
- Prefer contract tests over broad behavior changes.

## Exact implementation target

Make the public runtime contract explicit and test-covered:

- `window.__STREMIO_TIZENBREW_REMOTE__` exists after bootstrap.
- The namespace exposes the expected stable methods:
  - `init`
  - `injectStylesIfPossible`
  - `registerOptionalKeys`
  - `getState`
  - `renderDiagnostics`
- The namespace exposes `initialized === true` after successful bootstrap.
- Re-bootstrap returns without resetting existing runtime state or duplicating side effects.
- `getState()` returns defensive copies for mutable arrays or nested records that should not be externally mutated.
- Loading without `document` does not throw.
- Loading without `tizen` does not throw.
- Loading without `tizen.tvinputdevice` does not throw and reports `tvInputDevice: false`.
- Loading without `tizen.application` does not throw and reports `application: false`.

If `src/main.js` already satisfies part of this contract, prefer adding or tightening tests rather than rewriting working code.

## Documentation obligations

- Update `docs/runtime/module-boundary.md` if the stable namespace contract is clarified or changed.
- Update `docs/runtime/diagnostics.md` if `getState()` fields are clarified or changed.
- Update this TaskCard before moving it to `completed/` with changed files, validation results, and residual risks.
- Decision log update required: no, unless the public contract changes in a way future tasks must treat as a durable decision.
- Known risks update required: no, unless missing API behavior exposes a durable limitation.
- `PLAN.md` update required: no.

## Validation

Run the implementation validation in this order:

```bash
npm run check:syntax
npm test
```

If npm is unavailable, use the direct Node fallback documented in `docs/agent/validation.md`:

```bash
node tests/syntax.test.js
node tests/manifest.test.js
```

Docs validation:

```bash
git diff --check -- docs/runtime docs/agent/task-cards/active/task-04b-runtime-contract-and-public-api-hardening.md
```

## Done when

- The public namespace contract is explicit in tests or docs.
- Re-bootstrap remains idempotent.
- Missing `document` remains non-throwing.
- Missing `tizen`, `tizen.tvinputdevice`, and `tizen.application` remain non-throwing.
- `getState()` remains safe for external callers and does not expose mutable internal state directly.
- `npm run check:syntax` passes.
- `npm test` passes.
- No forbidden files were edited.
- Task 4.5 remains queued.

## Stop conditions

- Stop if the change requires editing `package.json`, manifest keys, dependencies, lockfiles, generated artifacts, signing material, or secrets.
- Stop if the implementation requires undocumented Samsung TV behavior or Seller Office-only information.
- Stop if the same validation command fails twice for the same reason.
- Stop if the task expands into focus navigation, remote key routing, dialog handling, emulator smoke validation, or real-TV validation. Those belong to later TaskCards.
- Stop if files outside the allowed edit list appear necessary.

## Expected output

Return a completion report with:

- Summary
- Changed files
- Public contract status
- Validation commands and results
- Acceptance status
- Remaining risks

## Completion notes

- Runtime behavior did not require changes. `src/main.js` already satisfied the requested contract once the edge cases were made explicit in tests.
- `tests/syntax.test.js` now asserts the exported namespace identity, required public methods, idempotent re-bootstrap, missing `tizen.tvinputdevice` and `tizen.application` handling, and defensive-copy behavior from `getState()`.
- Runtime boundary and diagnostics docs now name the exported namespace contract, idempotent bootstrap, and soft-fail diagnostics behavior without widening scope into later Task 4 slices.
- Validation evidence:
  - `npm run check:syntax`
  - `npm test`
  - `git diff --check -- docs/runtime docs/agent/task-cards/active/task-04b-runtime-contract-and-public-api-hardening.md`
- Acceptance status:
  - Task 4b local hardening slice passed required local validation.
  - Task 4.5 remains queued and was not started.
- Remaining risks:
  - The contract is explicit for the requested namespace cases, but external consumers can still mutate the exported namespace object itself if they choose.
  - Git reported only LF-to-CRLF normalization warnings on edited text files during docs validation.
