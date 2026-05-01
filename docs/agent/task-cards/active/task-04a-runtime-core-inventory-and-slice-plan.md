# TaskCard: Task 4a, Runtime Core Inventory and Slice Plan

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-04-runtime-core.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Create the missing Task 4 TaskCard layer as a docs-only reconciliation step. This card must inventory the current runtime surface in `src/main.js`, identify the weak or missing Task 4 behavior, and define the bounded follow-on slices that will be used for implementation work. It must not change runtime behavior.

Task 4 is still marked as not started in `PLAN.md`, but the runtime core already has meaningful implementation and tests. This card reconciles that state by documenting what already exists and by turning the remaining behavior work into bounded TaskCards before any new runtime edits begin.

## Current runtime surface

The current `src/main.js` already provides:

- A one-time bootstrap guard under `__STREMIO_TIZENBREW_REMOTE__`.
- A small public runtime namespace with `init`, `injectStylesIfPossible`, `registerOptionalKeys`, `getState`, and `renderDiagnostics`.
- Optional key registration through `tizen.tvinputdevice` when available, while skipping mandatory arrow, enter, and back keys.
- Runtime availability tracking for `document`, `tizen`, `tvinputdevice`, `application`, `MutationObserver`, and `requestAnimationFrame`.
- Shared style injection for focus outlines, diagnostics, and the exit modal.
- Diagnostics toggles on `Info` and the color keys.
- A keydown listener that normalizes key events and suppresses default handling when the module consumes them.
- Editable-context passthrough so arrow and enter handling do not hijack active text inputs.
- Candidate collection, directional focus movement, focus restoration, Enter activation, and focus styling for visible actionable elements.
- Back handling that can close diagnostics, close the exit modal, click safe dialog affordances, use browser history, or open the module exit modal as a fallback.
- App-exit attempts through the public Tizen application API when available, with non-throwing failure capture when it is missing or fails.

The current test surface already covers bootstrap idempotence, missing API tolerance, diagnostics toggling, editable safety, focus seeding and movement, safe dialog-close heuristics, history-backed back behavior, exit-modal flows, and non-throwing exit failures.

## Weak or missing Task 4 behavior

Task 4 still needs bounded runtime slices because the current behavior is still mostly heuristic and generic:

- The module does not assert ownership of mandatory TV keys, by design.
- Runtime lifecycle and DOM-readiness behavior are not yet documented as an explicit contract for repeated bootstrap, readiness timing, and dynamic candidate invalidation.
- Focus and candidate selection still depend on broad DOM heuristics rather than a documented thin contract for visible Stremio Web actions.
- Candidate visibility and navigation edge cases still need targeted coverage for dynamic DOM changes, hidden ancestors, `aria-*` state, and ambiguous geometry.
- Back and modal handling need tighter documented rules so the module does not become a full Stremio replacement or take destructive shortcuts.
- Diagnostics and state reporting still need an explicit freshness or source-evidence handoff for the queued Task 4.5 emulator bridge.
- Emulator validation and real-TV acceptance remain separate gates, so Task 4.5 must stay queued until a Task 4 slice passes local validation.

## Planned Task 4 slices

- Task 4b: runtime contract and public API hardening.
  Scope: stabilize the exported namespace contract, keep bootstrap idempotent, and keep missing document or Tizen APIs non-throwing.
- Task 4c: remote key routing and editable safety.
  Scope: keep arrow, enter, and back handling inside document `keydown`, preserve editable passthrough, and keep optional media, color, and info key registration manifest-driven.
- Task 4d: focus candidate navigation.
  Scope: improve visible actionable candidate detection, keep module-owned diagnostics and exit UI out of normal content focus, and preserve soft-fail generic navigation.
- Task 4e: back, exit, and dialog behavior.
  Scope: preserve documented Back priority, keep dialog-close heuristics conservative, and use only public exit APIs with non-throwing failure recording.
- Task 4f: diagnostics and source-evidence prep.
  Scope: expose enough diagnostics or source-marker evidence for Task 4.5 to prove the emulator loaded current local source without treating emulator validation as final acceptance.

## Required context

### Files to read

- `PLAN.md`
- `docs/agent/task-card-template.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/active/task-04-runtime-core.md`
- `docs/agent/validation.md`
- `docs/runtime/module-boundary.md`
- `docs/runtime/focus-spatial-navigation.md`
- `docs/runtime/back-exit.md`
- `docs/runtime/diagnostics.md`
- `package.json`
- `src/main.js`
- `tests/manifest.test.js`
- `tests/syntax.test.js`

### Docs to read

- `docs/product/scope.md`
- `docs/product/non-goals.md`
- `docs/product/acceptance.md`

## Files allowed to edit

- `docs/agent/task-cards/active/task-04a-runtime-core-inventory-and-slice-plan.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/active/task-04-runtime-core.md`

## Files forbidden

- `src/`
- `tests/`
- `package.json`
- `package-lock.json`
- `PLAN.md`
- `docs/vendor/`
- Generated artifacts
- `Debug/` folders
- `*.wgt`
- `*.zip`
- `*.log`
- Caches
- Signing material
- Secrets

## Constraints

- This is a docs-only proposal.
- Do not change runtime behavior.
- Do not edit `src/main.js`, tests, package metadata, or vendored docs.
- Do not start Task 4.5.
- Do not start Task 4.5 until a Task 4 slice has passed local validation.
- Keep the module thin: no runtime dependencies, no generated artifacts, and no full Stremio replacement.

## Documentation obligations

- Must update `docs/agent/task-cards/index.md` to list Task 4a as active.
- Must update `docs/agent/exec-plans/active/task-04-runtime-core.md` so the next action points to Task 4a and the planned 4b/4c/4d slices.
- Decision log update required: no.
- Known risks update required: no, unless the inventory introduces a durable new limitation.
- `PLAN.md` update required: no.

## Validation

Primary docs validation:

```bash
git diff --check -- PLAN.md docs/agent
```

## Done when

- Task 4a exists as a bounded active TaskCard.
- The card captures the current runtime surface, the missing or weak Task 4 behavior, and the planned 4b/4c/4d/4e/4f slices.
- The allowed and forbidden files are explicit.
- The validation command, done conditions, stop conditions, and report format are explicit.
- Task 4.5 is still queued behind a Task 4 local validation pass.
- No runtime files have been changed.

## Stop conditions

- Stop if the task would require edits to `src/main.js`, `tests/`, `package.json`, `PLAN.md`, vendored docs, or generated artifacts.
- Stop if the requested docs cannot stay bounded without changing runtime behavior.
- Stop if a conflicting worker has already changed one of the allowed docs files.
- Stop if the draft would activate Task 4.5 before a Task 4 slice passes local validation.

## Report format

- Summary
- Files changed
- Validation run/result
- Remaining risks
