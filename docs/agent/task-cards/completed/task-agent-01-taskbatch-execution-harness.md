# TaskCard: task-agent-01-taskbatch-execution-harness

## Status

- State: completed
- Parent ExecPlan: `docs/agent/exec-plans/active/mvp.md`
- Completion source: historical TaskCard reconstructed from merged remote TaskBatch harness changes
- Current owner: none
- Last updated: 2026-05-02

## Objective

Add first-class TaskBatch support to the repository agent harness so Codex can execute a bounded range of child TaskCards in one long-running session without collapsing them back into one oversized task.

## Files to inspect

- `PLAN.md`
- `AGENTS.md`
- `docs/agent/index.md`
- `docs/agent/architecture.md`
- `docs/agent/validation.md`
- `docs/agent/task-card-template.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/active/mvp.md`
- `.agents/skills/stremio-task-executor/SKILL.md`

## Files allowed to edit

Historical task is completed. No active edits are allowed from this TaskCard.

Original work area was docs-only TaskBatch harness routing and repo-local skills.

## Files forbidden

- Runtime source files
- Application behavior files
- Build output and generated files
- Lockfiles and package/dependency files
- Deployment files
- Secrets and environment files

## Exact implementation target

Implement a docs-only TaskBatch harness layer with:
1. Dedicated TaskBatch docs and folder structure.
2. TaskBatch status table conventions.
3. TaskCard dependency metadata conventions.
4. A narrow, validation-oriented `task-batch-executor` repo skill.
5. Concise router updates so agents discover TaskBatch flow quickly.

## Acceptance criteria

- `docs/agent/task-batches/index.md` exists and documents definition, usage boundaries, dependency mapping, parallelization checks, status persistence, validation cadence, stop conditions, and final reporting.
- TaskBatch folders exist:
  - `docs/agent/task-batches/active/.gitkeep`
  - `docs/agent/task-batches/completed/.gitkeep`
- TaskBatch status table format and status vocabulary are documented.
- TaskCard dependency metadata conventions are documented in index/template docs.
- `.agents/skills/task-batch-executor/SKILL.md` exists with required frontmatter and bounded workflow.
- Routing docs are concise and do not convert `AGENTS.md` into a large manual.

## Validation

Historical record creation validation:

```bash
git diff --check -- AGENTS.md PLAN.md docs/agent .agents/skills
git status --short
```

## Done when

- This TaskCard exists under `docs/agent/task-cards/completed/`.
- It preserves that the TaskBatch harness work was docs-only.
- It points future batch execution to `docs/agent/task-batches/` and `.agents/skills/task-batch-executor/SKILL.md`.
- It does not make the TaskBatch harness appear active when Task 5c is the current unblocker.

## Stop conditions

- Stop if updating this historical TaskCard requires changing runtime source files.
- Stop if the completion record would require inventing implementation details not present in the merged docs.
- Stop if the task would reopen TaskBatch work without a new active TaskCard.

## Completion report

- Changed files:
  - `AGENTS.md`
  - `docs/agent/index.md`
  - `docs/agent/task-card-template.md`
  - `docs/agent/task-cards/index.md`
  - `docs/agent/validation.md`
  - `docs/agent/exec-plans/active/mvp.md`
  - `docs/agent/task-batches/index.md`
  - `docs/agent/task-batches/active/.gitkeep`
  - `docs/agent/task-batches/completed/.gitkeep`
  - `.agents/skills/task-batch-executor/SKILL.md`
- Validation run:
  - Merged from `origin/Stremio-WebApp`; preserve the documented validation contract above.
- Result:
  - The repository now includes first-class TaskBatch docs, folder structure, dependency metadata conventions, and a repo-local TaskBatch execution skill.
- Risks:
  - This historical reconstruction records the merged TaskBatch harness outcome without replaying the original execution session.
