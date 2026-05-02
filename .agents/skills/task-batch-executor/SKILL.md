---
name: task-batch-executor
description: Use only when the user explicitly asks to execute a bounded range of repository TaskCards or a documented TaskBatch in one long-running Codex session. Do not use for single TaskCard execution, product discovery, broad refactors, deployment, runtime validation, or work without clear stop conditions.
---

# task-batch-executor

## name
- task-batch-executor

## description
- Execute a bounded set of TaskCards in one session while preserving TaskCard-level constraints, validation, and stop rules.

## use only when
- The user explicitly requests a TaskCard range (for example, Task 3A through Task 3F).
- The user asks to execute all unblocked TaskCards for a parent task.
- Parent scope, dependency ordering, validation commands, and stop conditions are documented.

## do not use when
- Only one TaskCard is requested.
- The request is discovery-only, architecture-only, or unbounded.
- Runtime/deployment/secrets/dependency changes are required without explicit permission.

## required inputs
- Requested TaskBatch scope or TaskCard range.
- `PLAN.md`.
- Active ExecPlan.
- `docs/agent/task-cards/index.md`.
- Every TaskCard in the requested range.

## allowed files
- TaskBatch docs in `docs/agent/task-batches/`.
- TaskCards referenced by the requested batch.
- Other files explicitly allowed by each active child TaskCard.

## steps
1. Read `PLAN.md`.
2. Read the active ExecPlan.
3. Read `docs/agent/task-cards/index.md`.
4. Read every TaskCard in the requested range.
5. Build a dependency map.
6. Identify blocked tasks.
7. Identify tasks that can run in parallel.
8. Identify file conflicts.
9. Execute unblocked TaskCards in dependency order.
10. Spawn subagents only for independent lanes.
11. Validate after each TaskCard.
12. Update TaskBatch status after each TaskCard.
13. Continue until the batch is complete or a stop condition is reached.

## validation commands
- Use each child TaskCard's explicit validation command(s).
- For docs-only TaskBatch updates, prefer:
  - `git diff --check -- AGENTS.md PLAN.md docs/agent .agents/skills`
  - `git status --short`

## stop conditions
- Stop after two repeated failures of the same validation command.
- Stop if work requires dependencies, schemas, migrations, auth, permissions, deployment, billing, secrets, production data, or forbidden files.
- Stop if runtime source would need modification but the TaskBatch forbids it.

## final response format
- Completed TaskCards
- Blocked TaskCards
- Skipped TaskCards
- Changed files
- Validation results
- Subagent audit findings
- Acceptance status
- Remaining risks
