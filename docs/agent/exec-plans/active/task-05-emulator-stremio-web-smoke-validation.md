# ExecPlan: Task 5, Emulator Stremio Web Smoke Validation

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-02
- Next action: keep Task 5b blocked and create a target-equivalent smoke-path follow-up after Task 5c confirmed the harness launch-path mismatch

## Goal
Validate the Task 4 runtime bridge against `https://web.stremio.com/` on the Samsung TV emulator with source freshness evidence, then hand off to Task 6 real-TV validation.

## Context
Task 5 is a bridge only. It starts after Task 4 local validation has passed and the team explicitly starts the emulator bridge. Emulator observations provide local confidence only and never replace real Samsung TV acceptance. The bridge must preserve the stale-launch, package refresh, sandbox timeout, and real-TV limitations documented in the repo.

The latest Task 5b attempt unblocked the `tz run -d` launch timeout after restarting `T-samsung-10.0-x86_64`, but it still did not satisfy the Task 5 target or freshness contract. `sdb` saw `emulator-26101`, `tz run -d` succeeded with debug port `38333`, the live target stayed `file:///index.html`, and served `js/stremio-remote.js` lacked the required source marker, injection marker, and interactive-control guard. Task 5b therefore remains blocked until Task 5c establishes a safe fresh-code `https://web.stremio.com/` debug path or records a precise blocker.

Task 5b remains blocked after the 2026-05-02 retries. The emulator/device visibility issue was cleared, but the current debug path still lands on `file:///index.html` instead of `https://web.stremio.com/`. Task 5c troubleshooting confirmed the repo-tracked harness module now matches `src/main.js` (marker and hash parity), and isolated the remaining blocker as launch-path equivalence: a harness-only redirect/hosted-start change does not preserve equivalent injected runtime evidence in the cross-origin target page.

## Slices
1. Task 5a (completed): prepared the smoke checklist, source freshness rules, module injection/load evidence requirements, and pass/partial/blocked result rubric.
2. Task 5b (blocked): attempted emulator smoke validation, but the live debug target was `file:///index.html` and served stale runtime source.
3. Task 5c (active): troubleshoot launch-target equivalence and source freshness so Task 5b is not retried with non-equivalent local harness evidence.

## Steps
1. Task 5a is complete as a docs-only readiness slice.
2. Preserve Task 5b as blocked until its target and freshness preconditions can be met.
3. Execute Task 5c to determine whether the current disposable harness can be safely adjusted, whether the harness runtime copy needs a repeatable freshness guard, or whether a different module launch path is required.
4. Task 5c conclusion: keep Task 5b blocked unless the smoke target is `https://web.stremio.com/` and runtime evidence is captured in that target context; local harness-page evidence is non-equivalent.
5. If a target-equivalent path is established, reactivate Task 5b for one bounded retry and record pass/partial/blocked.
6. Hand off to Task 6 for real-TV acceptance.

## Validation commands
- `npm run check:syntax`
- `npm run check:manifest`
- `npm test`
- `git diff --check -- PLAN.md docs/agent docs/validation`

## Stop conditions
Stop if Task 4 local validation has not passed, if source freshness evidence cannot be established, if emulator observations would be treated as final acceptance, or if unsupported TV privileges, protected local credentials, generated packaged artifacts, or undocumented device behavior are required.
