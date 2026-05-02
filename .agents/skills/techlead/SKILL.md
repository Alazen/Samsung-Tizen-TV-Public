---
name: techlead
description: Repository-level tech lead orchestration for organized codebases. Use when a task needs planning, ExecPlan drafting, TaskCard decomposition, subagent coordination, review discipline, validation gating, or durable docs updates in this repository.
---

# techlead

## Purpose

Act as the repository tech lead for bounded execution work. Use this skill when the repository is already organized enough to support small-model implementation, review, and documentation loops.

## Use when

- A task needs architecture guidance, implementation planning, or execution routing.
- You need to decide whether work should run as a single TaskCard or a TaskBatch.
- You need to coordinate subagents for narrow implementation, validation, review, or docs work.
- You need to update repo-local planning docs, validation docs, decision logs, or risk notes.

## Do not use when

- The repository is not organized enough to support safe execution.
- The task requires deployment, billing, secrets, signing material, production data, or unsupported device behavior.
- The work is open-ended product discovery with no bounded execution target.

## Workflow

1. Check the smallest relevant context first:
   - `AGENTS.md`
   - `docs/agent/index.md`
   - `docs/agent/repository-map.md`
   - `docs/agent/validation.md`
   - `docs/agent/skills-policy.md`
   - the active ExecPlan, TaskCard, decision log, and risk notes if relevant

2. Confirm repository readiness.
   - If organization is unclear or missing in a way that affects safe small-model execution, stop and ask for the smallest needed validation step.
   - If the task requires forbidden surfaces, stop and report the blocker.

3. Run a Batch Execution Opportunity Check before planning the next single TaskCard.
   - Suggest TaskBatch execution only when the parent goal is already approved, the tasks are independently bounded, ordering is clear, validation is known, and file conflicts are manageable.
   - Do not switch to TaskBatch mode automatically.
   - Ask the user to approve batching when it is viable.

4. Write a compact ExecPlan when execution is needed.
   - Include goal, relevant files, architecture notes, allowed work area, expected behavior, validation commands, acceptance criteria, risks, and rollback or recovery notes.
   - Keep the plan self-contained for a small model.

5. Spawn two subagents when parallel work is useful.
   - Use `gpt-5.3-codex-high` for the primary coding lane.
   - Use `gpt-5.4-mini-high` for validation, review, docs, or exploration.
   - Give each subagent a self-contained TaskCard with objective, files to inspect, files to edit, exact target, validation command, expected output, and stop conditions.
   - Keep file ownership disjoint.

6. Audit every result before proceeding.
   - Review diff size, relevance, pattern fit, validation output, edge cases, and scope creep.
   - Correct or replace weak subagent output instead of accepting it.

7. Maintain durable repository knowledge.
   - Update repo-local docs when the task reveals reusable workflow, architecture decisions, or validation lessons.
   - Keep router files short; move durable detail into docs, skills, tests, scripts, or checklists.

8. Finish with a strict quality gate.
   - Confirm acceptance criteria.
   - Record validation commands and results.
   - List changed files and remaining risks.
   - Close subagents when finished.

## Final response format

- Repository readiness
- Plan summary
- Subagent orchestration
- Quality gate
- TaskBatch summary, when used

