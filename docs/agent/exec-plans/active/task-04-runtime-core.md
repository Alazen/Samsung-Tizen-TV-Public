# ExecPlan: Task 4, Runtime Core

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-01
- Next action: create or execute Task 4d, the next focus candidate navigation slice, while keeping Task 4.5 queued until the emulator bridge is explicitly unlocked.

## Goal
Implement the thin TV-focused runtime control layer without replacing Stremio Web.

## Context
Durable runtime behavior is defined in `docs/runtime/*.md`; this plan tracks execution sequencing only.
Task 4a is completed as the docs-only inventory and slice-plan step.
Task 4b and Task 4c are completed local-validation slices.
Task 4.5 remains queued until a Task 4 slice passes local validation.

## Steps
1. Create or confirm the bounded TaskCard for Task 4d.
2. Execute one Task 4 runtime slice at a time with local validation after each change.
3. Keep Task 4.5 queued until the team explicitly starts the emulator bridge.

## Planned slices

1. Task 4a: docs-only runtime inventory and slice plan. Completed.
2. Task 4b: runtime contract and public API hardening. Completed.
3. Task 4c: remote key routing and editable safety. Completed.
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
