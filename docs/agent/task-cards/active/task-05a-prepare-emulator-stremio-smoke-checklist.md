# TaskCard: Task 5a, Prepare Emulator Stremio Bridge Checklist and Evidence Rules

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Prepare the canonical bridge readiness checklist for validating `https://web.stremio.com/` in the Samsung TV emulator, including source freshness rules, module injection/load evidence requirements, diagnostics evidence, and the pass/partial/blocked result rubric.

## Required context

### Files to read

- `PLAN.md`
- `docs/agent/task-card-template.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/index.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `docs/agent/validation.md`
- `docs/validation/emulator-validation.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/validation/real-tv-validation.md`
- `docs/product/scope.md`
- `docs/product/non-goals.md`
- `docs/product/acceptance.md`
- `docs/agent/known-risks.md`
- `package.json`

### Docs to read

- `docs/tizen/index.md`
- `docs/tizen/source-map.md`

## Files allowed to edit

- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/validation/emulator-validation.md`
- `docs/agent/known-risks.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/index.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
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

- This is a docs-only planning task.
- Do not run emulator commands.
- Do not add runtime behavior.
- Do not treat emulator evidence as final acceptance.
- Do not start the smoke bridge until Task 4 local validation has passed and Task 5 is explicitly started.
- Keep Task 6 real Samsung TV validation mandatory.

## Documentation obligations

- Must update `docs/validation/emulator-stremio-web-smoke-validation.md` if the checklist, source freshness rules, injection evidence rules, diagnostics evidence, or result rubric are incomplete.
- Must update `docs/validation/emulator-validation.md` if bridge routing or Task numbering is stale.
- Must update `docs/agent/task-cards/index.md`.
- Must update `PLAN.md`.
- Must update `docs/agent/exec-plans/index.md` if the bridge needs top-level routing visibility.
- Must update `docs/agent/known-risks.md` if the merged readiness slice introduces a durable emulator limitation or freshness rule.
- Decision log update required: no.

## Validation

Primary docs validation:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
```

## Done when

- The smoke checklist covers `web.stremio.com` load, module injection/load evidence, source freshness marker/hash, `Info` diagnostics, optional key registration or soft failure, safe focus candidates, directional navigation, `Back` behavior, media-key handling, console errors, and pass/partial/blocked outcomes.
- The checklist explicitly says how to record the source freshness marker or hash.
- The checklist explicitly says how to capture module injection or load evidence.
- The checklist makes stale-source observations blocked until freshness is proven.
- The Task 5 bridge points to the smoke checklist.
- TaskCard routing shows only Task 5a and Task 5b as active Task 5 slices.
- No runtime source files are changed.

## Stop conditions

- Stop if creating the checklist would require emulator execution or runtime changes.
- Stop if the checklist cannot capture source freshness evidence and result categories.
- Stop if required edits exceed the allowed file list.
- Stop if the task expands into runtime implementation.

## Report format

- Changed files:
- Validation run:
- Result:
- Risks:
