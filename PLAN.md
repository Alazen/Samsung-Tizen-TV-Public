# PLAN.md: Stremio Web TV Remote for TizenBrew

## Current status

Task 3, Emulator Debug Harness Decision, is closed as blocked on a repeatable fresh install/debug refresh path.
Task 4 is not started. It may be decomposed only if its TaskCards explicitly preserve Decision B, the stale-launch risk, the signing/decryption blocker, and the requirement for real Samsung TV validation.

Active plan:
- `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md`

Task 3 status:
- Task 3A: `docs/agent/task-cards/completed/task-03a-create-debug-harness-taskcards.md` - completed
- Task 3B: `docs/agent/task-cards/blocked/task-03b-validate-debug-command-path.md` - blocked
- Task 3C: `docs/agent/task-cards/completed/task-03c-record-debug-harness-decision.md` - completed

TaskCard index:
- `docs/agent/task-cards/index.md`

## Project goal

Build a thin TizenBrew site-modification module that improves Stremio Web remote-control usability on Samsung Tizen TVs without replacing Stremio Web.

## Active plans

- Task 3: `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md`
- Task 4: `docs/agent/exec-plans/active/task-04-runtime-core.md`
- Task 5: `docs/agent/exec-plans/active/task-05-real-tv-tizenbrew-validation.md`

## Completed plans

- Task 1: `docs/agent/exec-plans/completed/task-01-detailed-plan.md`
- Task 2: `docs/agent/exec-plans/completed/task-02-tizen-studio-tv-emulator-setup.md`

## Durable docs

- Product scope: `docs/product/scope.md`
- Non-goals: `docs/product/non-goals.md`
- Acceptance rules: `docs/product/acceptance.md`
- Runtime architecture: `docs/runtime/`
- Validation: `docs/agent/validation.md` and `docs/validation/`
- Local toolchain: `docs/agent/local-toolchain.md`
- Known risks: `docs/agent/known-risks.md`
- Decisions: `docs/agent/decision-log.md`
- Agent architecture router: `docs/agent/architecture.md`
- TaskCard index: `docs/agent/task-cards/index.md`

## Rule for future work

Do not start application behavior changes until the active ExecPlan has been converted into bounded TaskCards with allowed files, validation commands, acceptance criteria, and stop conditions.

Every active agent or subagent task must have a TaskCard in `docs/agent/task-cards/active/`.

Completed TaskCards belong in `docs/agent/task-cards/completed/`.

Blocked TaskCards belong in `docs/agent/task-cards/blocked/`.

Do not use completed TaskCards as permission to perform new work.
