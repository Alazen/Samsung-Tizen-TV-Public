# TaskCard: Task 3A, Create Debug Harness TaskCards

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md`
- Current owner: unassigned
- Last updated: 2026-04-30

## Objective

Create the Task 3 TaskCards required to execute the emulator debug harness decision in bounded, reviewable steps.

## Required context

### Files to read

- `PLAN.md`
- `docs/agent/task-card-template.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md`
- `docs/agent/validation.md`

### Docs to read

- `docs/agent/local-toolchain.md`
- `docs/validation/emulator-validation.md`
- `docs/agent/decision-log.md`
- `docs/agent/known-risks.md`

## Files allowed to edit

- `docs/agent/task-cards/index.md`
- `docs/agent/task-cards/active/task-03a-create-debug-harness-taskcards.md`
- `docs/agent/task-cards/active/task-03b-validate-debug-command-path.md`
- `docs/agent/task-cards/active/task-03c-record-debug-harness-decision.md`
- `PLAN.md`

## Files forbidden

- `src/`
- `tests/`
- `package.json`
- `package-lock.json`
- `docs/vendor/`
- Generated artifacts
- Temporary emulator harness files
- Signing material
- Secrets

## Constraints

- This is a docs-only organization task.
- Do not change application behavior.
- Do not change package scripts.
- Do not create generated emulator artifacts.
- Keep each Task 3 TaskCard small enough for a subagent to execute independently.

## Documentation obligations

- Must update `docs/agent/task-cards/index.md` with active Task 3 TaskCards.
- Must update `PLAN.md` so it points to the active TaskCards.
- Decision log update required: no.
- Known risks update required: no, unless a new risk is discovered.

## Validation

Primary docs validation:

```bash
git diff --check -- PLAN.md docs/agent/task-cards
```

Optional broader validation:

```bash
git diff --check -- PLAN.md docs/agent
```

## Done when

- Task 3A, Task 3B, and Task 3C TaskCards exist in `docs/agent/task-cards/active/`.
- `docs/agent/task-cards/index.md` lists the active TaskCards.
- `PLAN.md` points to the active TaskCards.
- No application source files are changed.

## Stop conditions

- Stop if creating TaskCards requires changing application behavior.
- Stop if required edits exceed the allowed file list.
- Stop if the active TaskCards cannot be made specific enough to validate.

## Report format

- Changed files:
- Validation run:
- Result:
- Risks:
