# TaskCard: Task 4.5A, Prepare Emulator Stremio Smoke Checklist

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-04-5-emulator-stremio-web-smoke-validation.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Prepare the canonical smoke checklist that will be used to validate `https://web.stremio.com/` in the Samsung TV emulator after Task 4 runtime slices pass local validation.

## Required context

### Files to read

- `PLAN.md`
- `docs/agent/task-card-template.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/active/task-04-5-emulator-stremio-web-smoke-validation.md`
- `docs/agent/validation.md`
- `docs/validation/emulator-validation.md`
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
- `docs/agent/task-cards/index.md`
- `docs/agent/exec-plans/index.md`
- `docs/agent/exec-plans/active/task-04-5-emulator-stremio-web-smoke-validation.md`
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
- Do not start the smoke bridge until a Task 4 runtime slice passes local validation.

## Documentation obligations

- Must update `docs/validation/emulator-stremio-web-smoke-validation.md`.
- Must update `docs/validation/emulator-validation.md`.
- Must update `docs/agent/task-cards/index.md`.
- Must update `PLAN.md`.
- Must update `docs/agent/exec-plans/index.md` if the bridge needs top-level routing visibility.
- Decision log update required: no.
- Known risks update required: yes, if the checklist introduces a durable emulator limitation or freshness rule.

## Validation

Primary docs validation:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
```

## Done when

- The smoke checklist covers `web.stremio.com` load, module injection/load evidence, source freshness marker/hash, `Info` diagnostics, optional key registration or soft failure, safe focus candidates, directional navigation, `Back` behavior, media-key handling, console errors, and pass/partial/blocked outcomes.
- The Task 4.5 bridge points to the smoke checklist.
- No runtime source files are changed.

## Stop conditions

- Stop if creating the checklist would require emulator execution or runtime changes.
- Stop if the checklist cannot capture source freshness evidence and result categories.
- Stop if required edits exceed the allowed file list.

## Report format

- Changed files:
- Validation run:
- Result:
- Risks:
