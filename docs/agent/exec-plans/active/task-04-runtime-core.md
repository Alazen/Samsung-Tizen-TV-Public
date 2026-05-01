# ExecPlan: Task 4, Runtime Core

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-01
- Next action: perform a Task 5 bridge readiness review for the smoke-validation markers and keep the emulator bridge queued until the team explicitly starts it.

## Goal
Implement the thin TV-focused runtime control layer without replacing Stremio Web.

## Context
Durable runtime behavior is defined in `docs/runtime/*.md`; this plan tracks execution sequencing only.
Task 4a is completed as the docs-only inventory and slice-plan step.
Task 4b and Task 4c are completed local-validation slices.
Task 4d is completed as a local-validation slice.
Task 4e is completed as the final local-validation slice for Back, Exit, dialog behavior, diagnostics, and source-evidence prep.
Task 5 replaces the former Task 4.5 numbering and remains queued until the bridge readiness review is complete and the team explicitly starts the emulator bridge.
Task 6 replaces the former Task 5 numbering and remains the real Samsung TV plus TizenBrew acceptance gate.

## Steps
1. Confirm the completed Task 4e closeout and the named smoke-validation markers.
2. Keep Task 5 queued while the bridge readiness review is prepared.
3. Do not start the emulator bridge until the team explicitly starts it.
4. Hand off from Task 5 to Task 6 only after emulator smoke results and residual risks are recorded.

## Planned slices

1. Task 4a: docs-only runtime inventory and slice plan. Completed.
2. Task 4b: runtime contract and public API hardening. Completed.
3. Task 4c: remote key routing and editable safety. Completed.
4. Task 4d: focus candidate navigation. Completed.
5. Task 4e: merged Back, Exit, dialog behavior, diagnostics, and source-evidence prep. Completed.

## Validation commands
- `npm run check:syntax`
- `npm run check:manifest`
- `npm test`

## Stop conditions
Stop if work requires unsupported TV privileges, undocumented device behavior, or Samsung Seller Office-only information.
Stop if work would require runtime dependencies, generated artifacts, or a full Stremio replacement.
Stop if emulator validation or real-TV validation is required before the local Task 4 slice passes.
