# TC-005: Real-TV Playback and Final Report

Status: pending

## Objective

Record final real-TV behavior and apply only evidence-backed bounded harness corrections through AGY.

## Files allowed to edit

- `harness/CodexTvRuntimeCheck/config.xml`
- `harness/CodexTvRuntimeCheck/index.html`
- `harness/CodexTvRuntimeCheck/css/style.css`
- `harness/CodexTvRuntimeCheck/js/main.js`
- `harness/CodexTvRuntimeCheck/tizen_web_project.yaml`
- `tests/tizen-wrapper-harness.test.js`
- `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md`

## Exact target

- Use only an already-configured TV connection; never change Developer Mode IP.
- User enters credentials directly; never read or record credentials/private stream URLs.
- Test the same problematic video and record redacted error/state/source/capability evidence.
- Do not claim playback fixed without a real-TV pass.
- Final report must list branch, version, changed files, commands/results, WGT result, emulator result, real-TV result, remaining risks, and next recommendation.

## Stop conditions

- TV is unavailable until the user reconnects it.
- Credentials/signing material would be exposed.
- Fix expands into AVPlay, a full client, or Stremio API work.

## Response

Print `AGY_DONE`, changed files, validation performed, issues, and no unrelated commentary.
