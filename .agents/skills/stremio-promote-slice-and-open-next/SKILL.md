---
name: stremio-promote-slice-and-open-next
description: Use only after a bounded Stremio Web TV Remote TaskCard slice has completed and the repository status docs need to be synchronized before the next slice starts. This is a docs-only workflow for moving a completed TaskCard, opening the next TaskCard when requested, and syncing PLAN.md, the active ExecPlan, and docs/agent/task-cards/index.md. Do not use for runtime implementation, tests, package metadata, emulator validation, or real-TV validation.
---

# stremio-promote-slice-and-open-next

## Use only when

- A bounded TaskCard slice has completed or is being closed as blocked.
- The next bounded slice must be opened or confirmed.
- The task is limited to repository status synchronization and TaskCard routing.
- The user or active ExecPlan has identified the next logical slice.

## Do not use when

- Runtime behavior, tests, package metadata, dependencies, generated artifacts, signing material, secrets, emulator execution, or real-TV validation need changes.
- The current TaskCard has not met its done conditions or stop conditions.
- The next slice does not have enough context to define a bounded TaskCard.
- The work would claim Task 4.5 emulator validation or Task 5 real-TV acceptance without evidence.

## Required inputs

- Completed or blocked TaskCard path.
- Parent ExecPlan path.
- Next slice name and short objective.
- Validation evidence for the completed slice, or the blocking reason if the slice is blocked.
- Whether `PLAN.md` status needs to change.

## Allowed files

- `PLAN.md`
- `docs/agent/exec-plans/active/*.md`
- `docs/agent/exec-plans/completed/*.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/task-cards/active/*.md`
- `docs/agent/task-cards/completed/*.md`
- `docs/agent/task-cards/blocked/*.md`
- `docs/agent/known-risks.md` only when a residual risk must be persisted.
- `docs/agent/decision-log.md` only when the transition records a durable decision.

## Forbidden files

- `src/`
- `tests/`
- `package.json`
- `package-lock.json`
- `docs/vendor/`
- `harness/`
- `Debug/`
- Generated artifacts
- `*.wgt`
- `*.zip`
- `*.log`
- Caches
- Signing material
- Secrets

## Steps

1. Read the completed or blocked TaskCard and confirm its state, validation evidence, acceptance status, and residual risks.
2. Confirm the parent ExecPlan still lists the current slice and next logical slice.
3. Move the TaskCard to the correct folder:
   - completed slices go to `docs/agent/task-cards/completed/`
   - blocked slices go to `docs/agent/task-cards/blocked/`
4. Ensure the moved TaskCard includes:
   - final state
   - changed files or produced docs
   - validation commands and results, or blocking evidence
   - acceptance status
   - residual risks
5. Update `docs/agent/task-cards/index.md`:
   - remove the closed card from Active TaskCards
   - add it to Completed or Blocked TaskCards
   - add the next active TaskCard only if it exists and is ready
6. Update the active ExecPlan:
   - mark the completed or blocked slice accurately
   - set the next action to create, confirm, or execute the next bounded slice
   - keep queued gates queued unless explicitly unlocked
7. Update `PLAN.md` only when top-level status changed or has drifted from the TaskCard index.
8. Update `docs/agent/known-risks.md` or `docs/agent/decision-log.md` only when the transition creates durable risk or decision history.
9. Run docs validation.
10. Return a concise status-sync report.

## Validation commands

Run the narrowest relevant docs validation:

```bash
git diff --check -- PLAN.md docs/agent .agents/skills/stremio-promote-slice-and-open-next/SKILL.md
```

If the transition follows runtime implementation, preserve the completed TaskCard's runtime validation evidence, but do not rerun or modify runtime tests from this skill.

## Stop conditions

- Stop if the completed TaskCard lacks validation evidence or a recorded reason validation could not run.
- Stop if the next slice would require runtime implementation before a TaskCard exists.
- Stop if the transition would require editing forbidden files.
- Stop if the transition would start Task 4.5 emulator validation without explicit approval.
- Stop if the transition would claim real Samsung TV acceptance without real-device evidence.
- Stop if there is a conflict between `PLAN.md`, the active ExecPlan, and the TaskCard index that cannot be resolved from existing repo evidence.

## Final response format

- Status transition:
- Files changed:
- Validation:
- Next slice:
- Remaining risks:
