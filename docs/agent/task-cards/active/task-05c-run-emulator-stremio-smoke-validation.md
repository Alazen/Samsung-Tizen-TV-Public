# TaskCard: Task 5c, Run Emulator Stremio Smoke Validation

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Run the emulator smoke checklist against `https://web.stremio.com/` after Task 4 local validation has passed and Task 5 is explicitly started.

## Required context

### Files to read

- `PLAN.md`
- `docs/agent/exec-plans/active/task-04-runtime-core.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/validation.md`
- `docs/validation/emulator-validation.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/validation/real-tv-validation.md`
- `docs/product/acceptance.md`
- `docs/agent/known-risks.md`
- `package.json`

### Docs to read

- `docs/product/scope.md`
- `docs/product/non-goals.md`

## Files allowed to edit

- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/validation/emulator-validation.md`
- `docs/agent/known-risks.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/index.md`
- `PLAN.md`

## Files forbidden

- `src/`
- `tests/`
- `package.json`
- `package-lock.json`
- `docs/vendor/`
- Generated artifacts
- `Debug/` folders
- `*.wgt`
- `*.zip`
- `*.log`
- Caches
- Signing material
- Secrets

## Constraints

- Do not modify runtime behavior.
- Do not start until Task 4 local validation has passed and Task 5 is explicitly started.
- Do not use emulator evidence as final acceptance.
- Require source freshness evidence before trusting any observation.
- Record outcomes as `pass`, `partial`, or `blocked`.

## Documentation obligations

- Must update `docs/validation/emulator-stremio-web-smoke-validation.md` with the run evidence.
- Must update `docs/validation/emulator-validation.md` if the procedure changes.
- Must update `docs/agent/known-risks.md` if a new durable limitation is discovered.
- Decision log update required: no, unless a durable decision is created.
- PLAN.md update required: yes, if the task status or next action changes.

## Validation

Primary docs validation:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
```

## Done when

- The checklist has been executed or a blocker has been documented.
- The result category and residual risks are recorded.
- The Task 6 real-TV gate remains mandatory.

## Stop conditions

- Stop if the same emulator command fails twice.
- Stop if source freshness cannot be established.
- Stop if the task would bypass real-TV validation.
- Stop if the task requires runtime implementation changes.

## Report format

- Changed files:
- Command attempted:
- Evidence captured:
- Validation run:
- Result:
- Risks:
