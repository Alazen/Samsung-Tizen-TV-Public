# ExecPlan: Task 4.5, Emulator Stremio Web Smoke Validation

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-01
- Next action: wait for a Task 4 runtime slice to pass local validation, then run the emulator smoke bridge

## Goal
Validate the Task 4 runtime bridge against `https://web.stremio.com/` on the Samsung TV emulator with source freshness evidence, then hand off to Task 5 real-TV validation.

## Context
Task 4.5 is a bridge only. It starts after a Task 4 runtime slice passes local validation. Emulator observations provide local confidence only and never replace real Samsung TV acceptance. The bridge must preserve the stale-launch, signing/decryption, sandbox timeout, and real-TV limitations documented in the repo.

## Steps
1. Prepare the smoke checklist and result rubric.
2. Define served-source and injection-load evidence requirements.
3. Run emulator smoke validation only after Task 4 local validation passes.
4. Record pass, partial, or blocked results and residual risks.
5. Hand off to Task 5 for real-TV acceptance.

## Validation commands
- `git diff --check -- PLAN.md docs/agent docs/validation`

## Stop conditions
Stop if Task 4 local validation has not passed, if source freshness evidence cannot be established, if emulator observations would be treated as final acceptance, or if unsupported TV privileges, signing secrets, or undocumented device behavior are required.
