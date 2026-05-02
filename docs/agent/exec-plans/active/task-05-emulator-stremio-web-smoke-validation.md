# ExecPlan: Task 5, Emulator Stremio Web Smoke Validation

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-02
- Next action: resolve the blocked Task 5b emulator/source-freshness gate, then retry the smoke bridge without treating emulator evidence as final acceptance

## Goal
Validate the Task 4 runtime bridge against `https://web.stremio.com/` on the Samsung TV emulator with source freshness evidence, then hand off to Task 6 real-TV validation.

## Context
Task 5 is a bridge only. It starts after Task 4 local validation has passed and the team explicitly starts the emulator bridge. Emulator observations provide local confidence only and never replace real Samsung TV acceptance. The bridge must preserve the stale-launch, signing/decryption, sandbox timeout, and real-TV limitations documented in the repo.

Task 5b remains blocked after the 2026-05-02 retry against commit `7fdd3acef4a385da4396a776c45cc558a6cd2fec`. The emulator/device visibility issue was cleared, but the current debug path still lands on `file:///index.html` instead of `https://web.stremio.com/`, and the live served `js/stremio-remote.js` still does not match the repo-tracked freshness evidence.

## Slices
1. Task 5a (completed): prepared the smoke checklist, source freshness rules, module injection/load evidence requirements, and pass/partial/blocked result rubric.
2. Task 5b (next gated): run the emulator smoke validation, record the result, capture residual risks, and hand off to Task 6.

## Steps
1. Task 5a is complete as a docs-only readiness slice.
2. Use a bridge path that actually loads `https://web.stremio.com/` and align source-freshness proof with the current repo-tracked source marker, commit SHA, or source hash.
3. Move Task 5b back to active only when the smoke target and live served-source gates are ready for one bounded retry.
4. Record pass, partial, or blocked results and residual risks in the validation docs.
5. Hand off to Task 6 for real-TV acceptance only after Task 5 results are recorded; Task 6 remains mandatory either way.

## Validation commands
- `git diff --check -- PLAN.md docs/agent docs/validation`

## Stop conditions
Stop if Task 4 local validation has not passed, if source freshness evidence cannot be established, if emulator observations would be treated as final acceptance, or if unsupported TV privileges, signing secrets, or undocumented device behavior are required.
