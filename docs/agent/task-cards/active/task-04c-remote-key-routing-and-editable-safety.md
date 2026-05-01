# TaskCard: Task 4c, Remote Key Routing and Editable Safety

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-04-runtime-core.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Bound the next Task 4 runtime slice to remote key routing and editable safety only. This card authorizes work on the document-level `keydown` contract, arrow/enter/back handling boundaries, editable passthrough, and the distinction between mandatory keys and optional registered keys.

This card does not authorize focus-candidate heuristics, back/exit policy expansion, diagnostics/source-evidence work, emulator validation, or package metadata changes.

## Parent context

Task 4 is the active runtime-core implementation track. Task 4b passed local validation and is now execution history. Task 4.5 remains queued as an emulator bridge and is not final acceptance.

This TaskCard exists so the next runtime behavior work stays narrow before Task 4d, Task 4e, and Task 4f address later slices.

## Required context

### Files to read

- `docs/agent/task-cards/index.md`
- `docs/agent/task-cards/completed/task-04b-runtime-contract-and-public-api-hardening.md`
- `docs/agent/exec-plans/active/task-04-runtime-core.md`
- `docs/agent/validation.md`
- `docs/runtime/module-boundary.md`
- `docs/runtime/focus-spatial-navigation.md`
- `docs/runtime/back-exit.md`
- `docs/product/scope.md`
- `docs/product/non-goals.md`
- `docs/product/acceptance.md`
- `src/main.js`
- `tests/syntax.test.js`

### Current behavior to preserve

- Runtime key handling remains centered on the document `keydown` listener.
- Editable contexts must keep arrow and enter behavior for text entry instead of being hijacked by remote-navigation logic.
- Optional key registration through `tizen.tvinputdevice` must remain soft-fail and must not imply ownership of mandatory keys.
- The runtime stays a thin site-modification layer rather than a full Stremio Web replacement.

## Files allowed to edit

- `src/main.js`
- `tests/syntax.test.js`
- `docs/runtime/module-boundary.md`
- `docs/runtime/focus-spatial-navigation.md`
- `docs/runtime/back-exit.md`
- `docs/agent/task-cards/active/task-04c-remote-key-routing-and-editable-safety.md`

## Files forbidden

- `package.json`
- `package-lock.json`
- `tests/manifest.test.js`
- `PLAN.md`
- `docs/vendor/`
- `harness/`
- Generated artifacts
- `Debug/`
- `*.wgt`
- `*.zip`
- `*.log`
- Signing material
- Secrets

## Constraints

- Do not add dependencies.
- Do not add a build step.
- Do not change package metadata or manifest keys.
- Do not rebind or claim ownership of mandatory TV keys in package metadata.
- Keep key routing inside document `keydown`.
- Preserve editable passthrough for inputs, textareas, contenteditable surfaces, and role/textbox-like editable UI.
- Do not expand into focus candidate selection, diagnostics/source evidence, or broader back/exit policy changes beyond the routing boundaries needed for this slice.
- Do not start Task 4.5.
- Do not run emulator validation from this card.

## Exact implementation target

Keep the key-routing contract explicit and test-covered:

- Arrow, Enter, and Back handling stay owned by the runtime only through document `keydown`.
- Editable surfaces pass through arrow and enter events so active text-entry UI keeps native behavior.
- Back handling changes in this slice, if any, must stay limited to routing boundaries and must not redefine the documented back/exit priority.
- Optional registered keys remain manifest-driven and soft-fail when unavailable.
- The runtime does not treat optional key registration as permission to own mandatory keys.
- Tests should make the routing boundary and editable passthrough clear without widening into Task 4d or Task 4e behavior.

If `src/main.js` already satisfies part of this target, prefer tightening tests and runtime docs over rewriting working code.

## Documentation obligations

- Update `docs/runtime/module-boundary.md` if the document-level key-routing contract is clarified.
- Update `docs/runtime/focus-spatial-navigation.md` if editable passthrough or directional-routing boundaries become clearer.
- Update `docs/runtime/back-exit.md` only if the routing boundary for Back needs clarification without changing the broader policy.
- Update this TaskCard before moving it to `completed/` with changed files, validation results, and residual risks.
- Decision log update required: no, unless a durable key-routing rule changes future Task 4 slices.
- Known risks update required: no, unless editable detection exposes a durable limitation.
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
git diff --check -- docs/runtime docs/agent/task-cards/active/task-04c-remote-key-routing-and-editable-safety.md
```

## Done when

- The document `keydown` routing boundary is explicit in code, tests, or docs.
- Editable passthrough for inputs, textareas, contenteditable surfaces, and role/textbox-like surfaces is preserved and covered.
- Optional registered keys remain separate from mandatory key ownership.
- `npm run check:syntax` passes.
- `npm test` passes.
- No forbidden files were edited.
- Task 4.5 remains queued.

## Stop conditions

- Stop if the task requires editing `package.json`, manifest keys, dependencies, lockfiles, generated artifacts, signing material, or secrets.
- Stop if the implementation expands into focus-candidate heuristics, dialog-close heuristics, broader back/exit behavior, emulator smoke validation, or real-TV validation.
- Stop if the same validation command fails twice for the same reason.
- Stop if files outside the allowed edit list appear necessary.

## Report format

- Summary
- Changed files
- Validation commands and results
- Acceptance status
- Remaining risks
