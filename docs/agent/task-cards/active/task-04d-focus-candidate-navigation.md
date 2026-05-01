# TaskCard: Task 4d, Focus Candidate Navigation

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-04-runtime-core.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Bound the next Task 4 runtime slice to focus candidate navigation only. This card authorizes work on visible actionable candidate detection, module-owned UI exclusion from normal content focus, geometry-based directional movement, soft-fail handling when no candidate exists, and focus seeding when no current candidate is focused.

This card does not authorize Back/Exit policy changes, diagnostics or source-evidence work, emulator validation, real Samsung TV validation, package metadata changes, or generated artifacts.

## Parent context

Task 4 is the active runtime-core implementation track. Task 4a is completed as the docs-only inventory and slice-plan step. Task 4b and Task 4c are completed local-validation slices. Task 4.5 remains queued as the emulator bridge and must not start from this card.

This TaskCard exists so the next runtime behavior change stays limited to focus candidate navigation before Task 4e and Task 4f address later slices.

## Required context

### Files to read

- `docs/agent/task-cards/index.md`
- `docs/agent/task-cards/completed/task-04a-runtime-core-inventory-and-slice-plan.md`
- `docs/agent/task-cards/completed/task-04b-runtime-contract-and-public-api-hardening.md`
- `docs/agent/task-cards/completed/task-04c-remote-key-routing-and-editable-safety.md`
- `docs/agent/exec-plans/active/task-04-runtime-core.md`
- `docs/agent/validation.md`
- `docs/runtime/module-boundary.md`
- `docs/runtime/focus-spatial-navigation.md`
- `docs/product/scope.md`
- `docs/product/non-goals.md`
- `docs/product/acceptance.md`
- `src/main.js`
- `tests/syntax.test.js`

### Current behavior to preserve

- Remote key routing remains centered on the document `keydown` listener.
- Editable passthrough from Task 4c remains intact for text-entry surfaces.
- Missing browser or Tizen APIs continue to degrade safely without throwing.
- Module-owned diagnostics and exit UI must stay outside normal content-navigation heuristics unless a later slice explicitly says otherwise.

## Files allowed to edit

- `src/main.js`
- `tests/syntax.test.js`
- `docs/runtime/focus-spatial-navigation.md`
- `docs/agent/task-cards/active/task-04d-focus-candidate-navigation.md`

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
- Caches
- Signing material
- Secrets

## Constraints

- Do not add dependencies.
- Do not add a build step.
- Do not change package metadata or manifest keys.
- Do not rebind or claim ownership of mandatory TV keys.
- Keep key routing inside the existing document `keydown` flow rather than adding a new event-ownership path.
- Preserve editable passthrough already established by Task 4c.
- Exclude module-owned diagnostics and exit UI from normal content focus candidates.
- Do not expand into Back/Exit behavior, diagnostics/source evidence, emulator smoke validation, or real-TV validation.
- Do not start Task 4.5.

## Exact implementation target

Keep the focus-candidate navigation contract explicit and test-covered:

- Candidate detection prefers visible, actionable elements already present in the Stremio DOM.
- Module-owned diagnostics UI and exit UI are excluded from normal content focus selection.
- Editable surfaces continue to pass through native arrow and Enter behavior even when focus-candidate logic is active.
- When no valid candidate exists in the requested direction, the runtime soft-fails without throwing or trapping focus.
- Directional movement among candidates uses geometry-based heuristics rather than DOM order alone.
- When no current content candidate is focused, the runtime can seed focus to the best available candidate for the requested direction.
- Tests in `tests/syntax.test.js` make the candidate-selection, module-UI exclusion, soft-fail, and focus-seeding boundaries explicit without widening into Task 4e or Task 4f behavior.

If `src/main.js` already satisfies part of this target, prefer tightening tests and runtime docs over rewriting working code.

## Documentation obligations

- Update `docs/runtime/focus-spatial-navigation.md` if the focus-candidate rules or exclusions become clearer.
- Update this TaskCard before moving it to `completed/` with changed files, validation results, and residual risks.
- Decision log update required: no, unless a durable candidate-selection rule changes future Task 4 slices.
- Known risks update required: no, unless candidate detection exposes a durable limitation.
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
git diff --check -- docs/runtime docs/agent/task-cards/active/task-04d-focus-candidate-navigation.md
```

## Done when

- Focus candidate selection is explicit in code, tests, or docs.
- Module-owned diagnostics and exit UI are excluded from normal content focus.
- Editable passthrough remains preserved.
- Geometry-based directional movement and focus seeding are covered.
- `npm run check:syntax` passes.
- `npm test` passes.
- No forbidden files were edited.
- Task 4.5 remains queued.

## Stop conditions

- Stop if the task requires editing `package.json`, manifest keys, dependencies, lockfiles, generated artifacts, signing material, or secrets.
- Stop if the implementation expands into Back/Exit behavior, diagnostics/source evidence, emulator smoke validation, or real-TV validation.
- Stop if the same validation command fails twice for the same reason.
- Stop if files outside the allowed edit list appear necessary.

## Report format

- Summary
- Changed files
- Validation commands and results
- Acceptance status
- Remaining risks
