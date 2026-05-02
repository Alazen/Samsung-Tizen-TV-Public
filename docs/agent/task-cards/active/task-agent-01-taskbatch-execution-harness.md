# TaskCard: task-agent-01-taskbatch-execution-harness

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

## Files allowed to create
- `docs/agent/task-batches/index.md`
- `docs/agent/task-batches/active/.gitkeep`
- `docs/agent/task-batches/completed/.gitkeep`
- `.agents/skills/task-batch-executor/SKILL.md`

## Files allowed to modify
- `AGENTS.md` (short routing link only)
- `docs/agent/index.md` (routing only)
- `docs/agent/task-cards/index.md` (dependency metadata conventions)
- `docs/agent/validation.md` (docs validation routing clarification)
- `docs/agent/exec-plans/active/mvp.md` (TaskBatch status-table pattern reference)
- `docs/agent/task-card-template.md` (dependency metadata fields)

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

## Validation command
- `git diff --check -- AGENTS.md PLAN.md docs/agent .agents/skills`
- `git status --short`

## Done when
- All acceptance criteria are met.
- Validation commands succeed.
- Diff is docs-only and inside allowed files.

## Stop conditions
- Any required change touches forbidden files.
- Work requires dependencies, schemas, migrations, auth, permissions, deployment, billing, secrets, production data, or runtime-source edits.
- Same validation command fails twice.

## Report format
- Changed files
- Validation run
- Result
- Remaining risks
