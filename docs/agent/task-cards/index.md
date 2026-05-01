# TaskCard Index

Purpose: track active, completed, and blocked agent or subagent tasks so implementation work does not drift, duplicate, or lose required documentation.

## Rules

- Every active agent or subagent task must have a TaskCard in `docs/agent/task-cards/active/`.
- Work from one TaskCard at a time.
- Do not start application behavior changes unless the relevant ExecPlan has been decomposed into TaskCards.
- Completed TaskCards move to `docs/agent/task-cards/completed/`.
- Blocked TaskCards move to `docs/agent/task-cards/blocked/`.
- Do not leave finished work in `active/`.

## Folder meanings

### `active/`

Tasks that have started or are ready for immediate execution.

A TaskCard belongs here when:
- It has a clear objective.
- It has required context.
- It lists allowed files.
- It lists forbidden files.
- It has validation commands.
- It has done conditions.
- It has stop conditions.

### `completed/`

Tasks that are finished and retained as durable execution history.

A completed TaskCard must include:
- Completion status.
- Changed files or produced docs.
- Validation commands run.
- Result.
- Residual risks.

### `blocked/`

Tasks that cannot proceed without user approval, external access, missing toolchain state, signing material, real-device access, or another unresolved dependency.

A blocked TaskCard must include:
- Blocking reason.
- Evidence observed.
- What approval or input is needed.
- Safe next action.

## Task 3 status

- Task 3 is closed as blocked under Decision B.
- Task 3A: `completed/task-03a-create-debug-harness-taskcards.md` - completed
- Task 3B: `blocked/task-03b-validate-debug-command-path.md` - blocked
- Task 3C: `completed/task-03c-record-debug-harness-decision.md` - completed

## Active TaskCards

- Task 4a: `active/task-04a-runtime-core-inventory-and-slice-plan.md` - reconcile the already-implemented runtime core, define the bounded 4b through 4f Task 4 slices, and keep Task 4.5 queued until a Task 4 slice passes local validation
- Task 4.5a: `active/task-04-5a-prepare-emulator-stremio-smoke-checklist.md` - prepare the canonical smoke checklist, queued behind Task 4 local validation
- Task 4.5b: `active/task-04-5b-define-served-source-and-injection-evidence.md` - define source freshness and injection evidence, queued behind Task 4 local validation
- Task 4.5c: `active/task-04-5c-run-emulator-stremio-smoke-validation.md` - run the emulator smoke validation after Task 4 local validation passes
- Task 4.5d: `active/task-04-5d-record-emulator-stremio-results.md` - record smoke results and residual risks after validation

## Completed TaskCards

- Task 1: `completed/task-01-detailed-plan.md`
- Task 2: `completed/task-02-tizen-studio-tv-emulator-setup.md`
- Task 3A: `completed/task-03a-create-debug-harness-taskcards.md`
- Task 3C: `completed/task-03c-record-debug-harness-decision.md`

## Blocked TaskCards

- Task 3B: `blocked/task-03b-validate-debug-command-path.md`

## Promotion rules

### Active to completed

Move a TaskCard from `active/` to `completed/` only when:
- Done conditions are satisfied.
- Required validation has run or a reason is recorded.
- Documentation obligations are satisfied.
- Remaining risks are listed.

### Active to blocked

Move a TaskCard from `active/` to `blocked/` when:
- The task requires files outside the allowed edit list.
- The task requires dependency, schema, auth, permissions, billing, deployment, signing material, secrets, generated artifacts, or production data changes.
- The same validation command fails twice.
- Required external device or emulator state is unavailable.

## Required TaskCard sections

Each TaskCard must include:

- Objective
- Parent ExecPlan
- Required context
- Files allowed to edit
- Files forbidden
- Constraints
- Documentation obligations
- Validation
- Done when
- Stop conditions
- Report format

## Documentation obligations

Every active TaskCard must state:

- Docs that must be read.
- Docs that must be updated if durable knowledge changes.
- Whether `docs/agent/decision-log.md` must be updated.
- Whether `docs/agent/known-risks.md` must be updated.
- Whether `PLAN.md` must be updated.

## Default validation

Use `docs/agent/validation.md` as the source of truth.

For docs-only or harness-only edits, start with:

```bash
git diff --check -- AGENTS.md PLAN.md docs/agent .agents/skills
```

For runtime or package-affecting edits, use:

```bash
npm run check:syntax
npm run check:manifest
npm test
```

If npm is unavailable, use the direct Node equivalents documented in `docs/agent/validation.md`.
