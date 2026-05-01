# ExecPlan: Task 5, Emulator Stremio Web Smoke Validation

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-01
- Next action: run and record the emulator smoke bridge in Task 5b only after Task 4 local validation has passed, Task 5a is complete, and the team explicitly starts the bridge

## Goal
Validate the Task 4 runtime bridge against `https://web.stremio.com/` on the Samsung TV emulator with source freshness evidence, then hand off to Task 6 real-TV validation.

## Context
Task 5 is a bridge only. It starts after Task 4 local validation has passed and the team explicitly starts the emulator bridge. Emulator observations provide local confidence only and never replace real Samsung TV acceptance. The bridge must preserve the stale-launch, signing/decryption, sandbox timeout, and real-TV limitations documented in the repo.

## Slices
1. Task 5a (completed): prepared the smoke checklist, source freshness rules, module injection/load evidence requirements, and pass/partial/blocked result rubric.
2. Task 5b (next gated): run the emulator smoke validation, record the result, capture residual risks, and hand off to Task 6.

## Steps
1. Task 5a is complete as a docs-only readiness slice.
2. Run Task 5b only after Task 4 local validation has passed and the team explicitly starts the bridge.
3. Record pass, partial, or blocked results and residual risks in the validation docs.
4. Hand off to Task 6 for real-TV acceptance.

## Validation commands
- `git diff --check -- PLAN.md docs/agent docs/validation`

## Stop conditions
Stop if Task 4 local validation has not passed, if source freshness evidence cannot be established, if emulator observations would be treated as final acceptance, or if unsupported TV privileges, signing secrets, or undocumented device behavior are required.
