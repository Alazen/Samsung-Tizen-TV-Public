# TaskCard: Task 5d, Record Emulator Stremio Results

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Record the emulator smoke result, residual risks, and handoff notes without promoting emulator evidence to final acceptance.

## Required context

### Files to read

- `PLAN.md`
- `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md`
- `docs/agent/task-cards/index.md`
- `docs/agent/validation.md`
- `docs/validation/emulator-validation.md`
- `docs/validation/emulator-stremio-web-smoke-validation.md`
- `docs/validation/real-tv-validation.md`
- `docs/product/acceptance.md`
- `docs/agent/known-risks.md`

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
- `docs/agent/decision-log.md`, only if a durable decision is created

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

- Do not claim final acceptance.
- Preserve the real Samsung TV validation requirement.
- Keep stale-launch, signing/decryption, sandbox timeout, and emulator-local-confidence risks visible.
- If the run was blocked, record the blocker instead of a pass/fail claim.

## Documentation obligations

- Must update `docs/validation/emulator-stremio-web-smoke-validation.md` with the final result summary.
- Must update `docs/validation/emulator-validation.md` if the result changes the guidance.
- Must update `docs/agent/known-risks.md` if a new durable limitation was found.
- Decision log update required: only if a durable decision was created.
- PLAN.md update required: yes, if task status or routing changed.

## Validation

Primary docs validation:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
```

## Done when

- The result summary includes `pass`, `partial`, or `blocked`.
- Residual risks are recorded.
- Task 6 real-TV validation remains mandatory.

## Stop conditions

- Stop if recording results would require runtime source edits.
- Stop if recording results would require committing generated artifacts.
- Stop if the result would be presented as final acceptance.

## Report format

- Changed files:
- Validation run:
- Result:
- Risks:
