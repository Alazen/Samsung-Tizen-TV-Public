# PLAN: <task-slug>

Status: draft|approved|active|blocked|completed

## Objective

<TODO: one-paragraph objective>

## Six-question gate

1. What is the user-visible goal?
2. What files may be edited?
3. What files are forbidden?
4. What validation proves progress?
5. What must stop the run?
6. What is the next resume action?

## Parent Goal Contract

- Goal:
- Non-goals:
- Acceptance:
- Constraints:

## Goal mode policy

- Mode: normal|goal_mode
- Goal mode allowed scope:
- Goal mode stop conditions:

## Milestones

| ID | Milestone | Status | Validation |
|---|---|---|---|
| M1 |  | pending |  |

## TaskCard sequence

| Order | TaskCard | Depends on | Status |
|---:|---|---|---|
| 1 | `taskcards/TC-001-<short-name>.md` | none | pending |

## Allowed files

- `TODO`

## Forbidden files

- generated artifacts
- signing material
- secrets
- auth/billing/deployment/production data unless explicitly approved

## Validation gates

- `TODO: exact command or unavailable validation note`

## Progress budget

- Checkpoint after each TaskCard.
- Stop after two repeated failures of the same validation command.

## Resume instructions

- Read `EXECUTION_STATE.json`.
- Continue from `active_taskcard`.
- Re-run narrow validation before edits if state is stale.

## Approval

- Approved by:
- Date:
- Notes:
