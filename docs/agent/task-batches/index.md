# TaskBatch Execution

## Definition
A TaskBatch is a parent execution campaign composed of multiple bounded TaskCards. TaskCards remain small and reviewable. The TaskBatch gives Codex permission to execute multiple TaskCards in one long-running session when the parent scope, dependencies, validation commands, and stop conditions are clear.

## When to use a TaskBatch
Use a TaskBatch when:
- A user explicitly asks for a bounded range (for example, Task 3A through Task 3F).
- Multiple TaskCards share one parent objective and can be sequenced with explicit dependencies.
- Running each TaskCard in separate sessions would cause avoidable context resets or status drift.

## When not to use a TaskBatch
Do not use a TaskBatch when:
- A single TaskCard is enough.
- Scope is open-ended or discovery-heavy.
- Stop conditions are unclear.
- Required files include forbidden domains (dependencies, secrets, deployment, runtime files in docs-only batches).

## TaskBatch vs TaskCard
- TaskCard: one bounded unit of work with explicit allowed files, validation, and stop conditions.
- TaskBatch: orchestrates multiple TaskCards while preserving each TaskCard boundary and acceptance checks.

## Locations
- Active TaskBatches: `docs/agent/task-batches/active/`
- Completed TaskBatches: `docs/agent/task-batches/completed/`

## Dependency map workflow
1. Read `PLAN.md`, the active ExecPlan, TaskCard index, and each TaskCard in the requested batch range.
2. Capture explicit prerequisites from `Depends on` metadata.
3. Mark blocked TaskCards first.
4. Build execution groups: dependency-ordered sequential chain plus independent lanes.

## Parallel execution rules
A TaskCard can run in parallel only if all are true:
- Declared as parallel-safe in `Can run in parallel with`.
- No unresolved dependency edge between cards.
- No shared edits in `Conflicts with files`.

If parallel metadata is unknown, assume sequential execution.
If two TaskCards edit the same file, assume conflict unless the TaskBatch explicitly states otherwise.

## TaskBatch status persistence
Update status after each TaskCard completion attempt.

| TaskCard | Status | Owner agent | Validation | Changed files | Blocker |
| --- | --- | --- | --- | --- | --- |
| task-XXa-example.md | pending | unassigned | not run | none | none |

### Status values
- `pending`
- `in_progress`
- `blocked`
- `completed`
- `skipped`

### Owner agent examples
- `tech-lead`
- `subagent-a-implementation`
- `subagent-b-validation`
- `subagent-reviewer`
- `unassigned`

## Validation cadence
- Run each child TaskCard validation immediately after that TaskCard.
- Run dependency-group-level validation after each completed dependency group.
- Stop after two repeated failures of the same validation command.

## Stop conditions
Halt the TaskBatch when:
- A required edit exceeds TaskCard allowed files.
- Dependencies, schemas, migrations, auth, permissions, deployment, billing, secrets, or production data become required.
- Runtime source edits are required but forbidden by the batch.
- The same validation command fails twice.

## Final reporting
Final TaskBatch report must include:
- Completed TaskCards
- Blocked TaskCards
- Skipped TaskCards
- Changed files
- Validation results
- Subagent audit findings
- Acceptance status
- Remaining risks
