# PLAN: standalone-tizen-wrapper-poc

Status: approved

## Objective

Convert the existing `harness/CodexTvRuntimeCheck` Samsung TV Web Application directly into `StremioWebWrapperPOC` version `1.1.0`, loading `https://web.stremio.com/` without TizenBrew and adding lightweight wrapper-level remote diagnostics.

## Parent Goal Contract

- Goal: build, debug, package, install, and validate the in-place standalone wrapper on the existing emulator, then validate playback on the connected real TV.
- Non-goals: no Stremio UI rebuild, API integration, AVPlay implementation, dependency changes, synthetic cross-origin key forwarding, or new branch.
- Acceptance: fresh WGT, Stremio load, key detection, overlay toggles, redacted diagnostics, emulator evidence, and explicit real-TV playback result.
- Constraints: AGY performs implementation directly in the repository from bounded TaskCards; Codex reviews and validates without manually repairing product code.

## TaskCard sequence

| Order | TaskCard | Depends on | Status |
|---:|---|---|---|
| 1 | `taskcards/TC-001-convert-harness-shell.md` | none | completed |
| 2 | `taskcards/TC-002-remote-diagnostics.md` | TC-001 | completed |
| 3 | `taskcards/TC-003-tests-and-docs.md` | TC-002 | completed |
| 4 | `taskcards/TC-004-emulator-validation.md` | TC-003 | completed |
| 5 | `taskcards/TC-005-real-tv-and-final-report.md` | TC-004 | completed |
| 6 | `taskcards/TC-006-iframe-navigation-adapter.md` | TC-005 | completed |
| 7 | `taskcards/TC-007-emulator-navigation-validation.md` | TC-006 | completed |
| 8 | `taskcards/TC-008-real-tv-navigation-validation.md` | TC-007 | completed |
| 9 | `taskcards/TC-009-commit-push-phase-decision.md` | TC-008 | completed |
| 10 | `taskcards/TC-010-emulator-navigation-login-back-ux.md` | TC-009 | completed |

## Allowed files

- `harness/CodexTvRuntimeCheck/**` except generated output
- `tests/tizen-wrapper-harness.test.js`
- This execution-plan directory
- Narrow durable docs explicitly listed by a TaskCard

## Forbidden files

- Dependencies, lockfiles, root package scripts, signing material, credentials, generated `Debug/`, WGT, logs, caches, vendor files, or TizenBrew runtime files

## Validation gates

- `node --check harness/CodexTvRuntimeCheck/js/main.js`
- `node tests/tizen-wrapper-harness.test.js`
- `npm test`
- `git diff --check`
- Repo/Debug/live-served `js/main.js` marker parity
- Fresh WGT build/install/run on emulator
- Real-TV playback result before any playback-fixed claim

## AGY execution policy

- Mode: direct repository mode only.
- Model: `Gemini 3.5 Flash (High)` via the confirmed `gemini-3.5-flash-high` CLI slug.
- Codex captures status before/after, reviews every diff, and retries through TaskCard feedback instead of editing implementation.
- Stop if AGY cannot produce parser-ready output, changes forbidden files, or exhausts two correction retries.

## Approval

- Approved by: user in chat
- Date: 2026-06-27
- Notes: stay on `stremio-webapp-tizen`; modify the existing harness in place.
