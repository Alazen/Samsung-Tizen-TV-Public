# TaskCard: Task 4.5B, Define Served Source and Injection Evidence

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-04-5-emulator-stremio-web-smoke-validation.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Define the freshness marker or hash and the module injection/load evidence that must be captured before trusting emulator observations from `https://web.stremio.com/`.

## Required context

### Files to read

- `PLAN.md`
- `docs/agent/task-card-template.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/active/task-04-5-emulator-stremio-web-smoke-validation.md`
- `docs/agent/validation.md`
- `docs/validation/emulator-validation.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/validation/real-tv-validation.md`
- `docs/agent/known-risks.md`

### Docs to read

- `docs/product/scope.md`
- `docs/product/non-goals.md`
- `docs/product/acceptance.md`

## Files allowed to edit

- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/validation/emulator-validation.md`
- `docs/agent/known-risks.md`
- `docs/agent/task-cards/index.md`
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

- This is a documentation task only.
- Do not run emulator commands.
- Do not trust live emulator output without source freshness evidence.
- Do not claim final acceptance.
- Do not modify runtime behavior.

## Documentation obligations

- Must update `docs/validation/emulator-stremio-web-smoke-validation.md` with the freshness rule and evidence definitions.
- Must update `docs/validation/emulator-validation.md` if the routing summary changes.
- Must update `docs/agent/known-risks.md` if a new durable stale-source limitation is introduced.
- Decision log update required: no.
- PLAN.md update required: only if the bridge routing changes.

## Validation

Primary docs validation:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
```

## Done when

- The checklist explicitly says how to record the source freshness marker or hash.
- The checklist explicitly says how to capture module injection or load evidence.
- The checklist makes stale-source observations blocked until freshness is proven.

## Stop conditions

- Stop if the evidence definition would require emulator execution.
- Stop if the required edits exceed the allowed file list.
- Stop if the task expands into runtime implementation.

## Report format

- Changed files:
- Validation run:
- Result:
- Risks:
