---
name: long-run-execution
description: Execute an approved 002-compatible PLAN using sequential TaskCards, checkpoints, and execution state. Use only for approved long-running work. Do not use for bootstrap or ad-hoc product changes.
---

# Long Run Execution

## Use only when

- A PLAN exists under `docs/agent/exec-plans/active/<task-slug>/PLAN.md`.
- TaskCards exist or the plan explicitly allows creating them from templates.
- The user approved long-run execution or explicitly asked to proceed.

## Do not use when

- The task is harness bootstrap only.
- The plan is draft or unapproved.
- Product scope, allowed files, or validation is ambiguous.

## Required inputs

- `PLAN.md`
- `sequential-manifest.md`
- `EXECUTION_STATE.json`
- `EXECUTION_REPORT.md`
- TaskCards under `taskcards/`

## Allowed files/folders

- Files listed in the active TaskCard.
- Execution state/report files for the active plan.
- Decision/risk docs when durable updates are needed.

## Steps

1. Read `EXECUTION_STATE.json` and active TaskCard.
2. Verify dependencies and allowed files.
3. Inspect before editing.
4. Implement only the active TaskCard.
5. Run narrow validation.
6. Update execution state and report.
7. Stop or continue according to the sequential manifest.

## Validation commands

- Use the active TaskCard command first.
- If missing, stop and request a TaskCard fix.

## Stop conditions

- Approval-required area appears.
- File conflict with another active task.
- Validation fails twice the same way.
- State file and report disagree.
- Product scope expands beyond the approved plan.

## Final response format

- Active TaskCard completed or blocked.
- Changed files.
- Validation result.
- Updated state/report paths.
- Next TaskCard or stop reason.
