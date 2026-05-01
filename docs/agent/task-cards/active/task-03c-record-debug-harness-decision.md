# TaskCard: Task 3C, Record Debug Harness Decision

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md`
- Current owner: unassigned
- Last updated: 2026-04-30

## Objective

Record the final Task 3 emulator debug harness decision and residual limitations after validation evidence exists.

## Required context

### Files to read

- `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md`
- `docs/agent/task-cards/active/task-03b-validate-debug-command-path.md`
- `docs/validation/emulator-validation.md`
- `docs/agent/local-toolchain.md`
- `docs/agent/decision-log.md`
- `docs/agent/known-risks.md`
- `PLAN.md`

### Docs to read

- `docs/product/acceptance.md`
- `docs/validation/real-tv-validation.md`

## Files allowed to edit

- `docs/agent/decision-log.md`
- `docs/agent/known-risks.md`
- `docs/validation/emulator-validation.md`
- `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md`
- `PLAN.md`
- `docs/agent/task-cards/active/task-03c-record-debug-harness-decision.md`

## Files forbidden

- `src/`
- `tests/`
- `package.json`
- `package-lock.json`
- `docs/vendor/`
- Generated artifacts
- Temporary harness files
- Secrets
- Signing material

## Constraints

- Do not record a final decision until Task 3B has evidence or a blocker.
- Do not mark Task 3 complete unless acceptance criteria are satisfied.
- Do not start Task 4 runtime implementation from this TaskCard.
- Do not treat emulator success as final product acceptance.

## Decision to record

Record one of:

```text
Decision A: Use the repo-tracked `CodexTvRuntimeCheck` project as the preferred debug harness.
Decision B: Debug harness is blocked pending emulator/toolchain/user-context access.
```

## Documentation obligations

- Must update `docs/agent/decision-log.md` with the selected decision.
- Must update `docs/agent/known-risks.md` with emulator limitations and real-TV acceptance requirements.
- Must update `docs/validation/emulator-validation.md` if the final procedure changes.
- Must update the Task 3 ExecPlan status if complete or blocked.
- Must update `PLAN.md` current status if Task 3 is completed or blocked.
- Generated `Debug/` folders and `.wgt` packages remain non-source artifacts.

## Validation

Primary docs validation:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
```

Generated artifact check before final report:

```bash
git status --short
```

## Done when

- Debug harness decision is recorded in `docs/agent/decision-log.md`.
- Residual limits are recorded in `docs/agent/known-risks.md`.
- Task 3 ExecPlan status reflects the current state.
- `PLAN.md` points to the correct next active task.
- No application behavior files are changed.

## Stop conditions

- Stop if Task 3B has no evidence and no blocker.
- Stop if the decision would require committing generated artifacts.
- Stop if the decision depends on unavailable signing secrets or private credentials.
- Stop if the task expands into runtime implementation.

## Report format

- Changed files:
- Decision recorded:
- Validation run:
- Result:
- Remaining risks:
- Next active task:
