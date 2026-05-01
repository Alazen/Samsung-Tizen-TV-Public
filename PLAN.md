# PLAN.md: Stremio Web TV Remote for TizenBrew

## Current status

Task 3, Emulator Debug Harness Decision, is closed as blocked under Decision B.
Task 4 is not started.
Task 4.5 is a queued emulator smoke-validation bridge against `https://web.stremio.com/`; it starts only after a Task 4 runtime slice passes local validation and it never replaces real Samsung TV acceptance.
Task 5 remains the real Samsung TV plus TizenBrew validation gate and final acceptance path.

Active plan:
- `docs/agent/exec-plans/active/task-04-runtime-core.md`
- `docs/agent/exec-plans/active/task-04-5-emulator-stremio-web-smoke-validation.md`
- `docs/agent/exec-plans/active/task-05-real-tv-tizenbrew-validation.md`

Task 3 status:
- Task 3A: `docs/agent/task-cards/completed/task-03a-create-debug-harness-taskcards.md` - completed
- Task 3B: `docs/agent/task-cards/blocked/task-03b-validate-debug-command-path.md` - blocked under Decision B
- Task 3C: `docs/agent/task-cards/completed/task-03c-record-debug-harness-decision.md` - completed

TaskCard index:
- `docs/agent/task-cards/index.md`

## Project goal

Build a thin TizenBrew site-modification module that improves Stremio Web remote-control usability on Samsung Tizen TVs without replacing Stremio Web.

## Active plans

- Task 4: `docs/agent/exec-plans/active/task-04-runtime-core.md`
- Task 4.5: `docs/agent/exec-plans/active/task-04-5-emulator-stremio-web-smoke-validation.md`
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
