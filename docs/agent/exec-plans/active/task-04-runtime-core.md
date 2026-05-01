# ExecPlan: Task 4, Runtime Core

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-01
- Next action: execute the merged Task 4e/4f runtime slice for Back, Exit, dialog behavior, diagnostics, and source-evidence prep; keep Task 4.5 queued until this local slice passes validation.

## Goal
Implement the thin TV-focused runtime control layer without replacing Stremio Web.

## Context
Durable runtime behavior is defined in `docs/runtime/*.md`; this plan tracks execution sequencing only.
Task 4a is completed as the docs-only inventory and slice-plan step.
Task 4b and Task 4c are completed local-validation slices.
Task 4d is completed as a local-validation slice.
Task 4e and Task 4f are intentionally merged into one bounded final Task 4 runtime slice.
Task 4.5 remains queued until Task 4 local validation passes.

## Steps
1. Execute the merged Task 4e/4f TaskCard.
2. Keep the implementation bounded to Back, Exit, dialog behavior, diagnostics, and source-evidence prep.
3. Run local validation after the merged slice.
4. Keep Task 4.5 queued until the team explicitly starts the emulator bridge.

## Planned slices

1. Task 4a: docs-only runtime inventory and slice plan. Completed.
2. Task 4b: runtime contract and public API hardening. Completed.
3. Task 4c: remote key routing and editable safety. Completed.
4. Task 4d: focus candidate navigation. Completed.
5. Task 4e: merged Back, Exit, dialog behavior, diagnostics, and source-evidence prep. Active.

## Validation commands
- `npm run check:syntax`
- `npm run check:manifest`
- `npm test`

## Stop conditions
Stop if work requires unsupported TV privileges, undocumented device behavior, or Samsung Seller Office-only information.
Stop if work would require runtime dependencies, generated artifacts, or a full Stremio replacement.
Stop if emulator validation or real-TV validation is required before the local Task 4 slice passes.
