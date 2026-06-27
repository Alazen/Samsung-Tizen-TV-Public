# Sequential manifest: <task-slug>

## Parent Goal Contract summary

- Goal:
- Non-goals:
- Acceptance:

## Execution order

| Order | TaskCard | Status | Gate |
|---:|---|---|---|
| 1 | `taskcards/TC-001-<short-name>.md` | pending |  |

## Dependency map

| TaskCard | Depends on | Notes |
|---|---|---|
| TC-001 | none |  |

## File conflict map

| File path | TaskCards | Conflict risk |
|---|---|---|
| `TODO` |  | low|medium|high |

## Phase gates

- inspect
- implement
- validate
- checkpoint
- report

## Checkpoints

- Update `EXECUTION_STATE.json` after each TaskCard.
- Update `EXECUTION_REPORT.md` after each validation gate.

## Resume instructions

- Read `EXECUTION_STATE.json`.
- Resume from `active_taskcard` unless `stop_reason` requires user approval.
