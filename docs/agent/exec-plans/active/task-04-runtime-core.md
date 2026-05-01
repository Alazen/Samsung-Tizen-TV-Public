# ExecPlan: Task 4, Runtime Core

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-01
- Next action: complete Task 4a, the docs-only runtime inventory and slice-plan TaskCard, then begin the first bounded runtime slice only after Task 4a has queued Task 4b through Task 4f.

## Goal
Implement the thin TV-focused runtime control layer without replacing Stremio Web.

## Context
Durable runtime behavior is defined in `docs/runtime/*.md`; this plan tracks execution sequencing only.
Task 4a is the bounded docs-only entry point for inventorying the current runtime surface, reconciling the already-implemented runtime core, and defining the next slices.
Task 4.5 remains queued until a Task 4 slice passes local validation.

## Steps
1. Complete Task 4a and publish the runtime inventory and slice plan.
2. Create or confirm bounded TaskCards for Task 4b through Task 4f from the Task 4a inventory.
3. Execute one Task 4 runtime slice at a time with local validation after each change.
4. Leave Task 4.5 queued until at least one Task 4 slice has passed local validation.

## Planned slices

1. Task 4a: docs-only runtime inventory and slice plan.
2. Task 4b: runtime contract and public API hardening.
3. Task 4c: remote key routing and editable safety.
4. Task 4d: focus candidate navigation.
5. Task 4e: back, exit, and dialog behavior.
6. Task 4f: diagnostics and source-evidence prep for the Task 4.5 emulator bridge.

## Validation commands
- `npm run check:syntax`
- `npm run check:manifest`
- `npm test`

## Stop conditions
Stop if work requires unsupported TV privileges, undocumented device behavior, or Samsung Seller Office-only information.
Stop if work would require runtime dependencies, generated artifacts, or a full Stremio replacement.
