# ExecPlan: Task 5, Emulator Stremio Web Smoke Validation

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-01
- Next action: perform the Task 5 bridge readiness review, then run the emulator smoke bridge only when explicitly started

## Goal
Validate the Task 4 runtime bridge against `https://web.stremio.com/` on the Samsung TV emulator with source freshness evidence, then hand off to Task 6 real-TV validation.

## Context
Task 5 is a bridge only. It starts after Task 4 local validation has passed and the team explicitly starts the emulator bridge. Emulator observations provide local confidence only and never replace real Samsung TV acceptance. The bridge must preserve the stale-launch, signing/decryption, sandbox timeout, and real-TV limitations documented in the repo.

## Steps
1. Prepare the smoke checklist and result rubric.
2. Define served-source and injection-load evidence requirements.
3. Run emulator smoke validation only after Task 4 local validation passes and the bridge is explicitly started.
4. Record pass, partial, or blocked results and residual risks.
5. Hand off to Task 6 for real-TV acceptance.

## Validation commands
- `git diff --check -- PLAN.md docs/agent docs/validation`

## Stop conditions
Stop if Task 4 local validation has not passed, if source freshness evidence cannot be established, if emulator observations would be treated as final acceptance, or if unsupported TV privileges, signing secrets, or undocumented device behavior are required.
