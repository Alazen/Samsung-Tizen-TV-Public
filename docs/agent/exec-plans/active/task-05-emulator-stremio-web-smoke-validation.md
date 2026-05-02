# ExecPlan: Task 5, Emulator Stremio Web Smoke Validation

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-02
- Next action: keep Task 5b blocked, preserve Task 5c as the completed harness-mismatch conclusion, and execute Task 5d until the emulator exposes a fresh `https://web.stremio.com/` TizenBrew debug target or a precise blocker

## Goal
Validate the Task 4 runtime bridge against `https://web.stremio.com/` on the Samsung TV emulator with source freshness evidence, then hand off to Task 6 real-TV validation.

## Context
Task 5 is a bridge only. It starts after Task 4 local validation has passed and the team explicitly starts the emulator bridge. Emulator observations provide local confidence only and never replace real Samsung TV acceptance. The bridge must preserve the stale-launch, package refresh, sandbox timeout, and real-TV limitations documented in the repo.

The latest Task 5b attempt unblocked the `tz run -d` launch timeout after restarting `T-samsung-10.0-x86_64`, but it still did not satisfy the Task 5 target or freshness contract. `sdb` saw `emulator-26101`, `tz run -d` succeeded with debug port `38333`, the live target stayed `file:///index.html`, and served `js/stremio-remote.js` lacked the required source marker, injection marker, and interactive-control guard. Task 5b therefore remains blocked until a safe fresh-code `https://web.stremio.com/` debug path is observed or a precise blocker is recorded.

Task 5c is now complete as the harness-path conclusion: the disposable `CodexTvRuntimeCheck` app is not target-equivalent smoke evidence. The public GitHub repository also clears the old jsDelivr hosting blocker for the pinned TizenBrew module. The first Task 5d retry proved those CDN gates, but the emulator-side TizenBrew standalone app still did not expose a stable localhost service or a fresh Web Inspector target for `https://web.stremio.com/`, so Task 5b remains blocked on service/debug observability rather than source freshness.

## Slices
1. Task 5a (completed): prepared the smoke checklist, source freshness rules, module injection/load evidence requirements, and pass/partial/blocked result rubric.
2. Task 5b (blocked): attempted emulator smoke validation, but the live debug target was `file:///index.html` and served stale runtime source.
3. Task 5c (completed): documented that the disposable harness cannot satisfy Task 5b target equivalence and that the correct bridge path is TizenBrew site-modification injection.
4. Task 5d (active): run the target-equivalent TizenBrew smoke path, first proving public jsDelivr freshness for the pinned module and then requiring a fresh `https://web.stremio.com/` debug target before any smoke assertions.

## Steps
1. Task 5a is complete as a docs-only readiness slice.
2. Preserve Task 5b as blocked until its target and freshness preconditions can be met.
3. Treat Task 5c as complete: keep Task 5b blocked unless the smoke target is `https://web.stremio.com/` and runtime evidence is captured in that target context; local harness-page evidence is non-equivalent.
4. Execute Task 5d through the real TizenBrew module path, using the pinned public GitHub/jsDelivr module identifier and strict CDN marker checks.
5. If Task 5d produces a fresh `https://web.stremio.com/` debug target with proven injection, reactivate Task 5b for one bounded retry and record pass/partial/blocked.
6. If Task 5d still cannot expose that target, record the precise emulator-side blocker and keep Task 6 mandatory for real-TV acceptance.

## Validation commands
- `npm run check:syntax`
- `npm run check:manifest`
- `npm test`
- `git diff --check -- PLAN.md docs/agent docs/validation`

## Stop conditions
Stop if Task 4 local validation has not passed, if source freshness evidence cannot be established, if emulator observations would be treated as final acceptance, or if unsupported TV privileges, protected local credentials, generated packaged artifacts, or undocumented device behavior are required.
