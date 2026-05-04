# PLAN.md: Stremio Web TV Remote for TizenBrew

## Current status

Task 3, Emulator Debug Harness Decision, is closed as blocked under Decision B.

Task 4 is active with Task 4a, Task 4b, Task 4c, Task 4d, and Task 4e completed. The final runtime slice closed out Back, Exit, dialog behavior, diagnostics, and source-evidence prep.

Task 5 is the active emulator smoke-validation bridge against `https://web.stremio.com/`. Task 5a is complete. Task 5b remains blocked because the observable live target was `file:///index.html`, not `https://web.stremio.com/`, and the served module did not satisfy the source-freshness contract. Task 5c documented that the disposable harness is not target-equivalent. Task 5d is the narrower active target-equivalent TizenBrew smoke slice. Public module hosting is now proven for the pinned module path, but emulator-side TizenBrew service/debug observability remains blocked.

Task 6 is the real Samsung TV plus TizenBrew validation gate and final acceptance path. Task 5 never replaces real Samsung TV acceptance.

## Public documentation privacy note

Public docs must use placeholders for local checkout paths, Tizen Studio roots, emulator IDs, profile names, debug ports, CDP target IDs, Windows usernames, machine-specific folder names, and signing profile names. Raw local logs should stay outside the repository, or be redacted before commit. Keep commit SHAs and source hashes only when they are needed for source-freshness evidence.

## Active plans

- `docs/agent/exec-plans/active/task-04-runtime-core.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `docs/agent/exec-plans/active/task-06-real-tv-tizenbrew-validation.md`

## Task 5 status

- Task 5a: `docs/agent/task-cards/completed/task-05a-prepare-emulator-stremio-smoke-checklist.md` - completed docs-only bridge-readiness checklist, source freshness rules, injection evidence rules, and result rubric routing.
- Task 5b: `docs/agent/task-cards/blocked/task-05b-run-and-record-emulator-stremio-smoke-validation.md` - blocked because the observable live target remained `file:///index.html`, not `https://web.stremio.com/`, and the served module did not satisfy the freshness contract.
- Task 5c: `docs/agent/task-cards/active/task-05c-troubleshoot-emulator-launch-target-and-source-freshness.md` - troubleshooting slice documenting that the disposable harness is not target-equivalent and that the correct bridge path is TizenBrew site-modification injection.
- Task 5d: `docs/agent/task-cards/active/task-05d-run-tizenbrew-emulator-target-equivalent-smoke.md` - active target-equivalent TizenBrew smoke slice; public hosting is proven, but emulator-side service/debug observability remains blocked.

## Project goal

Build a thin TizenBrew site-modification module that improves Stremio Web remote-control usability on Samsung Tizen TVs without replacing Stremio Web.

## Durable docs

- Product scope: `docs/product/scope.md`
- Acceptance rules: `docs/product/acceptance.md`
- Runtime architecture: `docs/runtime/`
- Validation: `docs/agent/validation.md` and `docs/validation/`
- Local toolchain: `docs/agent/local-toolchain.md`
- Known risks: `docs/agent/known-risks.md`
- Public-docs privacy checklist: `docs/agent/public-docs-privacy-checklist.md`

## Rule for future work

Do not start application behavior changes until the active ExecPlan has been converted into bounded TaskCards with allowed files, validation commands, acceptance criteria, and stop conditions.

Every active agent or subagent task must have a TaskCard in `docs/agent/task-cards/active/`. Completed TaskCards belong in `docs/agent/task-cards/completed/`. Blocked TaskCards belong in `docs/agent/task-cards/blocked/`.
